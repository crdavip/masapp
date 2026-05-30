import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PrismaClient } from '@prisma/client'

const mockTx = {
  ventaItem: {
    updateMany: vi.fn(),
    findMany: vi.fn(),
  },
  abono: {
    updateMany: vi.fn(),
    findMany: vi.fn(),
  },
  venta: {
    update: vi.fn(),
    delete: vi.fn(),
  },
}

const mockPrisma = {
  venta: {
    findMany: vi.fn(),
  },
  ventaItem: {
    updateMany: vi.fn(),
  },
  abono: {
    updateMany: vi.fn(),
  },
  $transaction: vi.fn((cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
} as unknown as PrismaClient

vi.mock('../../lib/db', () => ({
  default: mockPrisma,
}))

const { mergeDuplicates } = await import('../../scripts/merge-ventas-duplicadas')

function makeVenta(overrides: Record<string, unknown> = {}) {
  return {
    id: 'v-default',
    clienteId: 'c-default',
    cliente: { nombre: 'Cliente Default' },
    estado: 'pendiente',
    total: '1000.00',
    saldoPendiente: '1000.00',
    fecha: new Date('2026-01-01'),
    notas: null,
    items: [
      { id: 'vi-default', ventaId: 'v-default', productoId: 'p1', cantidad: 5, precioUnitario: '200.00', subtotal: '1000.00' },
    ],
    abonos: [],
    ...overrides,
  }
}

describe('mergeDuplicates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default return values for updateMany (used in every transaction)
    mockTx.ventaItem.updateMany.mockResolvedValue({ count: 1 })
    mockTx.abono.updateMany.mockResolvedValue({ count: 0 })
  })

  it('returns empty array when no duplicates exist (idempotent)', async () => {
    const clienteUnico = makeVenta({ id: 'v1', clienteId: 'c1', cliente: { nombre: 'Ana' } })
    mockPrisma.venta.findMany.mockResolvedValue([clienteUnico])

    const results = await mergeDuplicates()

    expect(results).toEqual([])
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('merges two pendiente sales into the oldest', async () => {
    const survivor = makeVenta({
      id: 'v-old',
      clienteId: 'c1',
      cliente: { nombre: 'Juan' },
      total: '1000.00',
      saldoPendiente: '800.00',
      fecha: new Date('2026-01-01'),
      items: [
        { id: 'vi-1', ventaId: 'v-old', productoId: 'p1', cantidad: 5, precioUnitario: '200.00', subtotal: '1000.00' },
      ],
      abonos: [
        { id: 'ab-1', ventaId: 'v-old', monto: '200.00' },
      ],
    })
    const nonSurvivor = makeVenta({
      id: 'v-new',
      clienteId: 'c1',
      cliente: { nombre: 'Juan' },
      total: '500.00',
      saldoPendiente: '500.00',
      fecha: new Date('2026-01-15'),
      items: [
        { id: 'vi-2', ventaId: 'v-new', productoId: 'p2', cantidad: 2, precioUnitario: '250.00', subtotal: '500.00' },
      ],
      abonos: [],
    })
    mockPrisma.venta.findMany.mockResolvedValue([survivor, nonSurvivor])

    // After moving: survivor has both items (vi-1 + vi-2)
    mockTx.ventaItem.updateMany.mockResolvedValue({ count: 1 })
    mockTx.abono.updateMany.mockResolvedValue({ count: 0 })
    mockTx.ventaItem.findMany.mockResolvedValue([
      { id: 'vi-1', ventaId: 'v-old', productoId: 'p1', cantidad: 5, precioUnitario: '200.00', subtotal: '1000.00' },
      { id: 'vi-2', ventaId: 'v-old', productoId: 'p2', cantidad: 2, precioUnitario: '250.00', subtotal: '500.00' },
    ])
    mockTx.abono.findMany.mockResolvedValue([
      { id: 'ab-1', ventaId: 'v-old', monto: '200.00' },
    ])
    mockTx.venta.update.mockResolvedValue({ id: 'v-old' })
    mockTx.venta.delete.mockResolvedValue({ id: 'v-new' })

    const results = await mergeDuplicates()

    expect(results).toHaveLength(1)
    expect(results[0].clienteNombre).toBe('Juan')
    expect(results[0].salesMerged).toBe(1)
    expect(results[0].itemsMoved).toBe(1)
    expect(results[0].abonosMoved).toBe(0)

    // Items and abonos moved to survivor
    expect(mockTx.ventaItem.updateMany).toHaveBeenCalledWith({
      where: { ventaId: 'v-new' },
      data: { ventaId: 'v-old' },
    })
    expect(mockTx.abono.updateMany).toHaveBeenCalledWith({
      where: { ventaId: 'v-new' },
      data: { ventaId: 'v-old' },
    })

    // Survivor total and saldoPendiente recalculated
    expect(mockTx.venta.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'v-old' },
        data: expect.objectContaining({
          total: '1500.00',
          saldoPendiente: '1300.00',
          estado: 'parcial',
        }),
      })
    )

    // Non-survivor deleted
    expect(mockTx.venta.delete).toHaveBeenCalledWith({ where: { id: 'v-new' } })
  })

  it('recalculates estado parcial when sumAbonos < total', async () => {
    const survivor = makeVenta({
      id: 'v1',
      clienteId: 'c1',
      cliente: { nombre: 'Pedro' },
      fecha: new Date('2026-01-01'),
      items: [
        { id: 'vi-1', ventaId: 'v1', productoId: 'p1', cantidad: 1, precioUnitario: '300.00', subtotal: '300.00' },
      ],
      abonos: [
        { id: 'ab-1', ventaId: 'v1', monto: '300.00' },
      ],
    })
    const nonSurvivor = makeVenta({
      id: 'v2',
      clienteId: 'c1',
      cliente: { nombre: 'Pedro' },
      fecha: new Date('2026-01-15'),
      items: [
        { id: 'vi-2', ventaId: 'v2', productoId: 'p2', cantidad: 1, precioUnitario: '200.00', subtotal: '200.00' },
      ],
      abonos: [],
    })
    mockPrisma.venta.findMany.mockResolvedValue([survivor, nonSurvivor])

    // total = 300 + 200 = 500, abonos = 300
    mockTx.ventaItem.updateMany.mockResolvedValue({ count: 1 })
    mockTx.abono.updateMany.mockResolvedValue({ count: 0 })
    mockTx.ventaItem.findMany.mockResolvedValue([
      { id: 'vi-1', ventaId: 'v1', productoId: 'p1', cantidad: 1, precioUnitario: '300.00', subtotal: '300.00' },
      { id: 'vi-2', ventaId: 'v1', productoId: 'p2', cantidad: 1, precioUnitario: '200.00', subtotal: '200.00' },
    ])
    mockTx.abono.findMany.mockResolvedValue([
      { id: 'ab-1', ventaId: 'v1', monto: '300.00' },
    ])
    mockTx.venta.update.mockResolvedValue({ id: 'v1' })
    mockTx.venta.delete.mockResolvedValue({ id: 'v2' })

    const results = await mergeDuplicates()

    expect(results).toHaveLength(1)
    
    const updateCall = mockTx.venta.update.mock.calls.find(
      (call: any[]) => call[0]?.where?.id === 'v1'
    )
    expect(updateCall).toBeDefined()
    // total=500, abonos=300, 300>=500? No. 300>0? Yes → 'parcial'
    expect(updateCall[0].data.estado).toBe('parcial')
    expect(updateCall[0].data.total).toBe('500.00')
    expect(updateCall[0].data.saldoPendiente).toBe('200.00')
  })

  it('recalculates estado pendiente when no abonos', async () => {
    const survivor = makeVenta({
      id: 'v1',
      clienteId: 'c1',
      cliente: { nombre: 'Luis' },
      total: '500.00',
      saldoPendiente: '500.00',
      fecha: new Date('2026-01-01'),
      items: [],
      abonos: [],
    })
    const nonSurvivor = makeVenta({
      id: 'v2',
      clienteId: 'c1',
      cliente: { nombre: 'Luis' },
      total: '300.00',
      saldoPendiente: '300.00',
      fecha: new Date('2026-01-10'),
      items: [
        { id: 'vi-2', ventaId: 'v2', productoId: 'p2', cantidad: 1, precioUnitario: '300.00', subtotal: '300.00' },
      ],
      abonos: [],
    })
    mockPrisma.venta.findMany.mockResolvedValue([
      { ...survivor, items: [], abonos: [] },
      nonSurvivor,
    ])

    // After moving: only vi-2 moved to survivor
    mockTx.ventaItem.updateMany.mockResolvedValue({ count: 1 })
    mockTx.abono.updateMany.mockResolvedValue({ count: 0 })
    mockTx.ventaItem.findMany.mockResolvedValue([
      { id: 'vi-2', ventaId: 'v1', productoId: 'p2', cantidad: 1, precioUnitario: '300.00', subtotal: '300.00' },
    ])
    mockTx.abono.findMany.mockResolvedValue([])
    mockTx.venta.update.mockResolvedValue({ id: 'v1' })
    mockTx.venta.delete.mockResolvedValue({ id: 'v2' })

    const results = await mergeDuplicates()

    expect(results).toHaveLength(1)
    
    const updateCall = mockTx.venta.update.mock.calls.find(
      (call: any[]) => call[0]?.where?.id === 'v1'
    )
    expect(updateCall).toBeDefined()
    // total=300, abonos=0, 0>=300? No. 0>0? No → 'pendiente'
    expect(updateCall[0].data.estado).toBe('pendiente')
  })

  it('deletes non-survivor sales after data moved', async () => {
    const survivor = makeVenta({
      id: 'v1', clienteId: 'c1', cliente: { nombre: 'Ana' },
      fecha: new Date('2026-01-01'),
    })
    const nonSurvivor = makeVenta({
      id: 'v2', clienteId: 'c1', cliente: { nombre: 'Ana' },
      fecha: new Date('2026-01-15'),
    })
    const nonSurvivor2 = makeVenta({
      id: 'v3', clienteId: 'c1', cliente: { nombre: 'Ana' },
      fecha: new Date('2026-01-20'),
    })
    mockPrisma.venta.findMany.mockResolvedValue([survivor, nonSurvivor, nonSurvivor2])

    // After moving: survivor keeps its own items
    mockTx.ventaItem.updateMany.mockResolvedValue({ count: 1 })
    mockTx.abono.updateMany.mockResolvedValue({ count: 1 })
    mockTx.ventaItem.findMany.mockResolvedValue(survivor.items)
    mockTx.abono.findMany.mockResolvedValue(survivor.abonos)
    mockTx.venta.update.mockResolvedValue({ id: 'v1' })
    mockTx.venta.delete.mockResolvedValue({})

    const results = await mergeDuplicates()

    expect(results).toHaveLength(1)
    expect(results[0].salesMerged).toBe(2)
    expect(mockTx.venta.delete).toHaveBeenCalledTimes(2)
    expect(mockTx.venta.delete).toHaveBeenCalledWith({ where: { id: 'v2' } })
    expect(mockTx.venta.delete).toHaveBeenCalledWith({ where: { id: 'v3' } })
  })

  it('handles multiple clients independently', async () => {
    const c1v1 = makeVenta({ id: 'c1v1', clienteId: 'c1', cliente: { nombre: 'Ana' }, fecha: new Date('2026-01-01') })
    const c1v2 = makeVenta({ id: 'c1v2', clienteId: 'c1', cliente: { nombre: 'Ana' }, fecha: new Date('2026-01-15') })
    const c2v1 = makeVenta({ id: 'c2v1', clienteId: 'c2', cliente: { nombre: 'Bob' }, fecha: new Date('2026-01-10') })
    const c2v2 = makeVenta({ id: 'c2v2', clienteId: 'c2', cliente: { nombre: 'Bob' }, fecha: new Date('2026-01-20') })

    mockPrisma.venta.findMany.mockResolvedValue([c1v1, c1v2, c2v1, c2v2])

    mockTx.ventaItem.updateMany.mockResolvedValue({ count: 1 })
    mockTx.abono.updateMany.mockResolvedValue({ count: 0 })
    // Each transaction call needs its own findMany setup
    // Use mockImplementation to return different data per call
    mockTx.ventaItem.findMany.mockImplementation((args: { where: { ventaId: string } }) => {
      if (args.where.ventaId === 'c1v1') {
        return Promise.resolve([
          { id: 'vi-c1', ventaId: 'c1v1', productoId: 'p1', cantidad: 5, precioUnitario: '200.00', subtotal: '1000.00' },
          { id: 'vi-c2', ventaId: 'c1v1', productoId: 'p2', cantidad: 3, precioUnitario: '150.00', subtotal: '450.00' },
        ])
      }
      if (args.where.ventaId === 'c2v1') {
        return Promise.resolve([
          { id: 'vi-c3', ventaId: 'c2v1', productoId: 'p3', cantidad: 2, precioUnitario: '500.00', subtotal: '1000.00' },
        ])
      }
      return Promise.resolve([])
    })
    mockTx.abono.findMany.mockResolvedValue([])
    mockTx.venta.update.mockResolvedValue({})
    mockTx.venta.delete.mockResolvedValue({})

    const results = await mergeDuplicates()

    expect(results).toHaveLength(2)
    expect(results.map(r => r.clienteNombre).sort()).toEqual(['Ana', 'Bob'])
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2)
  })
})
