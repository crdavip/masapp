import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockTx = {
  venta: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  ventaItem: {
    create: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
  producto: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}

const mockPrisma = {
  $transaction: vi.fn((cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
}

vi.mock('../../lib/db', () => ({
  default: mockPrisma,
}))

const { PATCH } = await import('../../app/api/ventas/[id]/items/route')

function makeRequest(id: string, body: unknown): Request {
  return new Request(`http://localhost/api/ventas/${id}/items`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const baseVenta = {
  id: 'venta-1',
  clienteId: 'cliente-1',
  total: '100000.00',
  saldoPendiente: '50000.00',
  estado: 'parcial',
  fecha: new Date('2026-01-01'),
  notas: null,
  ultimoMovimiento: new Date('2026-01-01'),
  items: [
    {
      id: 'item-1',
      ventaId: 'venta-1',
      productoId: 'prod-1',
      cantidad: 5,
      precioUnitario: '10000.00',
      subtotal: '50000.00',
      producto: { id: 'prod-1', nombre: 'Harina', cantidadStock: 20, precioVenta: '10000.00' },
    },
    {
      id: 'item-2',
      ventaId: 'venta-1',
      productoId: 'prod-2',
      cantidad: 2,
      precioUnitario: '25000.00',
      subtotal: '50000.00',
      producto: { id: 'prod-2', nombre: 'Aceite', cantidadStock: 10, precioVenta: '25000.00' },
    },
  ],
  abonos: [
    { id: 'abono-1', ventaId: 'venta-1', monto: '50000.00', metodoPago: 'efectivo', fecha: new Date('2026-01-02'), notas: null },
  ],
}

const producto3 = { id: 'prod-3', nombre: 'Sal', cantidadStock: 15, precioVenta: '5000.00' }

describe('PATCH /api/ventas/[id]/items', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds an item, decrements stock, and increases total', async () => {
    const updatedVenta = {
      ...baseVenta,
      total: '110000.00',
      saldoPendiente: '60000.00',
      items: [
        ...baseVenta.items,
        {
          id: 'new-item',
          ventaId: 'venta-1',
          productoId: 'prod-3',
          cantidad: 2,
          precioUnitario: '5000.00',
          subtotal: '10000.00',
          producto: { id: 'prod-3', nombre: 'Sal' },
        },
      ],
    }
    mockTx.venta.findUnique
      .mockResolvedValueOnce(baseVenta)
      .mockResolvedValueOnce(updatedVenta)
    mockTx.producto.findUnique.mockResolvedValue(producto3)

    const response = await PATCH(makeRequest('venta-1', {
      operations: [{ op: 'add', productoId: 'prod-3', cantidad: 2, precioUnitario: 5000 }],
    }), { params: { id: 'venta-1' } })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.total).toBe('110000.00')
    expect(mockTx.ventaItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ventaId: 'venta-1',
        productoId: 'prod-3',
        cantidad: 2,
        precioUnitario: '5000.00',
        subtotal: '10000.00',
      }),
    })
    expect(mockTx.producto.update).toHaveBeenCalledWith({
      where: { id: 'prod-3' },
      data: { cantidadStock: { decrement: 2 } },
    })
  })

  it('removes an item, restores stock, and decreases total', async () => {
    const updatedVenta = {
      ...baseVenta,
      total: '50000.00',
      saldoPendiente: '0.00',
      estado: 'pagada',
      items: [baseVenta.items[1]],
    }
    mockTx.venta.findUnique
      .mockResolvedValueOnce(baseVenta)
      .mockResolvedValueOnce(updatedVenta)

    const response = await PATCH(makeRequest('venta-1', {
      operations: [{ op: 'remove', ventaItemId: 'item-1' }],
    }), { params: { id: 'venta-1' } })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.total).toBe('50000.00')
    expect(mockTx.ventaItem.delete).toHaveBeenCalledWith({ where: { id: 'item-1' } })
    expect(mockTx.producto.update).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { cantidadStock: { increment: 5 } },
    })
  })

  it('updates quantity, adjusts stock, and changes total', async () => {
    const updatedVenta = {
      ...baseVenta,
      total: '80000.00',
      saldoPendiente: '30000.00',
      items: [
        { ...baseVenta.items[0], cantidad: 3, subtotal: '30000.00' },
        baseVenta.items[1],
      ],
    }
    mockTx.venta.findUnique
      .mockResolvedValueOnce(baseVenta)
      .mockResolvedValueOnce(updatedVenta)

    const response = await PATCH(makeRequest('venta-1', {
      operations: [{ op: 'update', ventaItemId: 'item-1', cantidad: 3 }],
    }), { params: { id: 'venta-1' } })

    expect(response.status).toBe(200)
    expect(mockTx.ventaItem.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: expect.objectContaining({ cantidad: 3, subtotal: '30000.00' }),
    })
    expect(mockTx.producto.update).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { cantidadStock: { increment: 2 } },
    })
  })

  it('rejects add with insufficient stock (400)', async () => {
    const lowStock = { ...producto3, cantidadStock: 1 }
    mockTx.venta.findUnique.mockResolvedValueOnce(baseVenta)
    mockTx.producto.findUnique.mockResolvedValue(lowStock)

    const response = await PATCH(makeRequest('venta-1', {
      operations: [{ op: 'add', productoId: 'prod-3', cantidad: 2 }],
    }), { params: { id: 'venta-1' } })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Stock insuficiente')
    expect(mockTx.ventaItem.create).not.toHaveBeenCalled()
    expect(mockTx.producto.update).not.toHaveBeenCalled()
  })

  it('rejects update that exceeds stock (400)', async () => {
    mockTx.venta.findUnique.mockResolvedValueOnce(baseVenta)

    const response = await PATCH(makeRequest('venta-1', {
      operations: [{ op: 'update', ventaItemId: 'item-1', cantidad: 30 }],
    }), { params: { id: 'venta-1' } })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Stock insuficiente')
    expect(mockTx.ventaItem.update).not.toHaveBeenCalled()
  })

  it('rejects removal that would make saldoPendiente negative (400)', async () => {
    // total=60000, sumAbonos=50000, saldo=10000; removing item-1 (subtotal=60000) → saldo=-50000 ❌
    const ventaSmallSaldo = {
      ...baseVenta,
      total: '60000.00',
      saldoPendiente: '10000.00',
      items: [{ ...baseVenta.items[0], subtotal: '60000.00' }],
      abonos: [{ ...baseVenta.abonos[0], monto: '50000.00' }],
    }
    mockTx.venta.findUnique.mockResolvedValueOnce(ventaSmallSaldo)

    const response = await PATCH(makeRequest('venta-1', {
      operations: [{ op: 'remove', ventaItemId: 'item-1' }],
    }), { params: { id: 'venta-1' } })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('saldo pendiente')
    expect(mockTx.ventaItem.delete).not.toHaveBeenCalled()
  })

  it('rolls back all operations when one fails (atomicity)', async () => {
    // add prod-3 (stock=1, cantidad=2) fails; add prod-4 (stock=50) would pass alone
    const prod4 = { id: 'prod-4', nombre: 'Arroz', cantidadStock: 50, precioVenta: '3000.00' }
    const lowStockProd3 = { ...producto3, cantidadStock: 1 }

    mockTx.venta.findUnique.mockResolvedValueOnce(baseVenta)
    mockTx.producto.findUnique
      .mockResolvedValueOnce(lowStockProd3)
      .mockResolvedValueOnce(prod4)

    const response = await PATCH(makeRequest('venta-1', {
      operations: [
        { op: 'add', productoId: 'prod-3', cantidad: 2 },
        { op: 'add', productoId: 'prod-4', cantidad: 5 },
      ],
    }), { params: { id: 'venta-1' } })

    expect(response.status).toBe(400)
    expect(mockTx.ventaItem.create).not.toHaveBeenCalled()
    expect(mockTx.producto.update).not.toHaveBeenCalled()
    expect(mockTx.venta.update).not.toHaveBeenCalled()
  })

  it('recalculates estado from parcial to pagada when saldo reaches 0', async () => {
    // total=100000, abonos=50000, remove item-2 (50000) → new total=50000, new saldo=0 → pagada
    const updatedVenta = {
      ...baseVenta,
      items: [baseVenta.items[0]],
      total: '50000.00',
      saldoPendiente: '0.00',
      estado: 'pagada',
    }
    mockTx.venta.findUnique
      .mockResolvedValueOnce(baseVenta)
      .mockResolvedValueOnce(updatedVenta)

    const response = await PATCH(makeRequest('venta-1', {
      operations: [{ op: 'remove', ventaItemId: 'item-2' }],
    }), { params: { id: 'venta-1' } })

    expect(response.status).toBe(200)
    expect(mockTx.venta.update).toHaveBeenCalledWith({
      where: { id: 'venta-1' },
      data: expect.objectContaining({
        estado: 'pagada',
        saldoPendiente: '0.00',
      }),
    })
    const data = await response.json()
    expect(data.estado).toBe('pagada')
  })

  it('handles multiple mixed operations in a single request', async () => {
    // Net effect: update item-1 5→3 (-20000), remove item-2 (-50000), add prod-3 20*5000 (+100000)
    // projectedTotal = 100000 - 20000 - 50000 + 100000 = 130000 >= sumAbonos(50000) ✓
    const prod3 = { ...producto3, cantidadStock: 50 }
    mockTx.venta.findUnique
      .mockResolvedValueOnce(baseVenta)
      .mockResolvedValueOnce(baseVenta)
    mockTx.producto.findUnique.mockResolvedValue(prod3)

    const response = await PATCH(makeRequest('venta-1', {
      operations: [
        { op: 'update', ventaItemId: 'item-1', cantidad: 3 },
        { op: 'remove', ventaItemId: 'item-2' },
        { op: 'add', productoId: 'prod-3', cantidad: 20, precioUnitario: 5000 },
      ],
    }), { params: { id: 'venta-1' } })

    expect(response.status).toBe(200)
    expect(mockTx.ventaItem.update).toHaveBeenCalled()
    expect(mockTx.ventaItem.delete).toHaveBeenCalledWith({ where: { id: 'item-2' } })
    expect(mockTx.ventaItem.create).toHaveBeenCalled()
  })

  it('uses producto.precioVenta as fallback when precioUnitario is omitted', async () => {
    mockTx.venta.findUnique
      .mockResolvedValueOnce(baseVenta)
      .mockResolvedValueOnce(baseVenta)
    mockTx.producto.findUnique.mockResolvedValue(producto3)

    const response = await PATCH(makeRequest('venta-1', {
      operations: [{ op: 'add', productoId: 'prod-3', cantidad: 2 }],
    }), { params: { id: 'venta-1' } })

    expect(response.status).toBe(200)
    expect(mockTx.ventaItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        precioUnitario: '5000.00',
        subtotal: '10000.00',
      }),
    })
  })

  it('returns 404 when venta does not exist', async () => {
    mockTx.venta.findUnique.mockReset()
    mockTx.venta.findUnique.mockResolvedValue(null)

    const response = await PATCH(makeRequest('venta-nonexistent', {
      operations: [{ op: 'add', productoId: 'prod-1', cantidad: 1 }],
    }), { params: { id: 'venta-nonexistent' } })

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toContain('Venta no encontrada')
  })

  it('returns 400 when operations array is empty', async () => {
    const response = await PATCH(makeRequest('venta-1', { operations: [] }), { params: { id: 'venta-1' } })
    expect(response.status).toBe(400)
  })

  it('returns 400 when operation has invalid op field', async () => {
    const response = await PATCH(makeRequest('venta-1', {
      operations: [{ op: 'bogus' }],
    }), { params: { id: 'venta-1' } })
    expect(response.status).toBe(400)
  })

  it('returns 400 when add operation omits productoId', async () => {
    const response = await PATCH(makeRequest('venta-1', {
      operations: [{ op: 'add', cantidad: 2 }],
    }), { params: { id: 'venta-1' } })
    expect(response.status).toBe(400)
  })

  it('returns 400 when remove operation omits ventaItemId', async () => {
    const response = await PATCH(makeRequest('venta-1', {
      operations: [{ op: 'remove' }],
    }), { params: { id: 'venta-1' } })
    expect(response.status).toBe(400)
  })
})
