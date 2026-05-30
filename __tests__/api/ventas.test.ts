import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PrismaClient } from '@prisma/client'

const mockTx = {
  venta: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  producto: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  ventaItem: {
    create: vi.fn(),
  },
}

const mockPrisma = {
  $transaction: vi.fn((cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
} as unknown as PrismaClient

vi.mock('../../lib/db', () => ({
  default: mockPrisma,
}))

const { POST } = await import('../../app/api/ventas/route')

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/ventas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const baseProducto = {
  id: 'prod-1',
  nombre: 'Harina',
  precioVenta: '200.00',
  cantidadStock: 10,
  precioCompra: null,
  createdAt: new Date(),
  ventaItems: [],
}

const baseExistingVenta = {
  id: 'venta-existente',
  clienteId: 'cliente-1',
  total: '1000.00',
  saldoPendiente: '800.00',
  estado: 'pendiente',
  fecha: new Date('2026-01-01'),
  notas: null,
  cliente: { id: 'cliente-1', nombre: 'Juan Perez' },
  items: [
    { id: 'item-1', productoId: 'prod-1', producto: { id: 'prod-1', nombre: 'Harina' }, cantidad: 5, precioUnitario: '200.00', subtotal: '1000.00' },
  ],
  abonos: [
    { id: 'abono-1', monto: '200.00', metodoPago: 'efectivo', fecha: new Date('2026-01-02'), notas: null },
  ],
}

const baseNewVenta = {
  id: 'venta-nueva',
  clienteId: 'cliente-2',
  total: '600.00',
  saldoPendiente: '600.00',
  estado: 'pendiente',
  fecha: new Date(),
  notas: null,
  cliente: { id: 'cliente-2', nombre: 'Maria Gomez' },
  items: [
    { id: 'item-2', productoId: 'prod-2', producto: { id: 'prod-2', nombre: 'Pan' }, cantidad: 3, precioUnitario: '200.00', subtotal: '600.00' },
  ],
  abonos: [],
}

describe('POST /api/ventas — append to existing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates new venta when cliente has no active sale (appended: false)', async () => {
    mockTx.venta.findFirst.mockResolvedValue(null)
    mockTx.producto.findUnique.mockResolvedValue(baseProducto)
    mockTx.venta.create.mockResolvedValue({ id: 'new-id', clienteId: 'cliente-1' })
    mockTx.venta.findUnique.mockResolvedValue(baseNewVenta)

    const response = await POST(makeRequest({
      clienteId: 'cliente-2',
      items: [{ productoId: 'prod-2', cantidad: 3, precioUnitario: 200 }],
    }))

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data).toHaveProperty('appended', false)
    expect(data.cliente.nombre).toBe('Maria Gomez')
    expect(mockTx.venta.create).toHaveBeenCalledTimes(1)
    expect(mockTx.venta.update).not.toHaveBeenCalled()
  })

  it('appends items to existing pendiente sale and returns appended: true', async () => {
    mockTx.venta.findFirst.mockResolvedValue(baseExistingVenta)
    mockTx.producto.findUnique.mockResolvedValue(baseProducto)
    mockTx.venta.findUnique.mockResolvedValue({
      ...baseExistingVenta,
      items: [
        ...baseExistingVenta.items,
        { id: 'item-2', productoId: 'prod-1', producto: { id: 'prod-1', nombre: 'Harina' }, cantidad: 3, precioUnitario: '200.00', subtotal: '600.00' },
      ],
      total: '1600.00',
      saldoPendiente: '1400.00',
    })

    const response = await POST(makeRequest({
      clienteId: 'cliente-1',
      items: [{ productoId: 'prod-1', cantidad: 3, precioUnitario: 200 }],
    }))

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data).toHaveProperty('appended', true)
    expect(data.cliente.nombre).toBe('Juan Perez')
    expect(mockTx.venta.create).not.toHaveBeenCalled()
    expect(mockTx.venta.update).toHaveBeenCalled()
    expect(mockTx.ventaItem.create).toHaveBeenCalledTimes(1)
  })

  it('appends items to existing parcial sale', async () => {
    const parcialVenta = { ...baseExistingVenta, estado: 'parcial' }
    mockTx.venta.findFirst.mockResolvedValue(parcialVenta)
    mockTx.producto.findUnique.mockResolvedValue(baseProducto)
    mockTx.venta.findUnique.mockResolvedValue({
      ...parcialVenta,
      items: [
        ...parcialVenta.items,
        { id: 'item-2', productoId: 'prod-1', producto: { id: 'prod-1', nombre: 'Harina' }, cantidad: 2, precioUnitario: '200.00', subtotal: '400.00' },
      ],
      total: '1400.00',
      saldoPendiente: '1200.00',
    })

    const response = await POST(makeRequest({
      clienteId: 'cliente-1',
      items: [{ productoId: 'prod-1', cantidad: 2, precioUnitario: 200 }],
    }))

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data).toHaveProperty('appended', true)
    expect(data.estado).toBe('parcial') // estado does NOT change on append
    expect(mockTx.venta.create).not.toHaveBeenCalled()
  })

  it('creates new sale when cliente only has pagada sales', async () => {
    mockTx.venta.findFirst.mockResolvedValue(null)
    mockTx.producto.findUnique.mockResolvedValue(baseProducto)
    mockTx.venta.create.mockResolvedValue({ id: 'new-id' })
    mockTx.venta.findUnique.mockResolvedValue(baseNewVenta)

    const response = await POST(makeRequest({
      clienteId: 'cliente-2',
      items: [{ productoId: 'prod-2', cantidad: 3, precioUnitario: 200 }],
    }))

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data).toHaveProperty('appended', false)
    expect(mockTx.venta.create).toHaveBeenCalledTimes(1)
  })

  it('rejects insufficient stock on append and rolls back', async () => {
    const lowStockProduct = { ...baseProducto, cantidadStock: 1 }
    mockTx.venta.findFirst.mockResolvedValue(baseExistingVenta)
    mockTx.producto.findUnique.mockResolvedValue(lowStockProduct)

    const response = await POST(makeRequest({
      clienteId: 'cliente-1',
      items: [{ productoId: 'prod-1', cantidad: 3, precioUnitario: 200 }],
    }))

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toContain('Stock insuficiente')
    // Transaction callback threw, so no ventaItem or stock update occurred
    expect(mockTx.ventaItem.create).not.toHaveBeenCalled()
    expect(mockTx.producto.update).not.toHaveBeenCalled()
    expect(mockTx.venta.update).not.toHaveBeenCalled()
  })

  it('response shape includes all standard fields plus appended', async () => {
    mockTx.venta.findFirst.mockResolvedValue(baseExistingVenta)
    mockTx.producto.findUnique.mockResolvedValue(baseProducto)
    mockTx.venta.findUnique.mockResolvedValue({
      ...baseExistingVenta,
      items: baseExistingVenta.items,
      total: '1600.00',
      saldoPendiente: '1400.00',
    })

    const response = await POST(makeRequest({
      clienteId: 'cliente-1',
      items: [{ productoId: 'prod-1', cantidad: 3, precioUnitario: 200 }],
    }))

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('cliente')
    expect(data).toHaveProperty('items')
    expect(data).toHaveProperty('abonos')
    expect(data).toHaveProperty('total')
    expect(data).toHaveProperty('saldoPendiente')
    expect(data).toHaveProperty('estado')
    expect(data).toHaveProperty('appended')
    expect(typeof data.appended).toBe('boolean')
  })
})
