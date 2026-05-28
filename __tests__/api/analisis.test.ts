import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PrismaClient } from '@prisma/client'

// Mock prisma module before importing the route
const mockPrisma = {
  cliente: { count: vi.fn() },
  venta: {
    count: vi.fn(),
    aggregate: vi.fn(),
    findMany: vi.fn(),
  },
  abono: {
    aggregate: vi.fn(),
  },
  producto: {
    findMany: vi.fn(),
  },
} as unknown as PrismaClient

vi.mock('../../lib/db', () => ({
  default: mockPrisma,
}))

const { GET } = await import('../../app/api/analisis/route')

describe('GET /api/analisis', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Set up default mock returns matching AnalisisData contract
    vi.mocked(mockPrisma.cliente.count).mockResolvedValue(15)
    vi.mocked(mockPrisma.venta.count).mockResolvedValueOnce(8) // ventasPendientes
    vi.mocked(mockPrisma.producto.findMany).mockResolvedValue([
      { nombre: 'Pan Batido', cantidadStock: 2 },
    ])
    vi.mocked(mockPrisma.venta.aggregate).mockResolvedValueOnce({
      _sum: { saldoPendiente: 450000 },
    }) // totalPorCobrar
    vi.mocked(mockPrisma.abono.aggregate).mockResolvedValueOnce({
      _sum: { monto: 1200000 },
    }) // totalRecuperado (all-time)
    vi.mocked(mockPrisma.abono.aggregate).mockResolvedValueOnce({
      _sum: { monto: 350000 },
    }) // recuperadoEsteMes
    vi.mocked(mockPrisma.venta.aggregate).mockResolvedValueOnce({
      _sum: { total: 2500000 },
    }) // ventasTotales
    vi.mocked(mockPrisma.venta.findMany).mockResolvedValue([
      {
        clienteId: 'c1',
        saldoPendiente: 200000,
        cliente: { nombre: 'Juan Perez' },
      },
      {
        clienteId: 'c2',
        saldoPendiente: 150000,
        cliente: { nombre: 'Maria Gomez' },
      },
      {
        clienteId: 'c3',
        saldoPendiente: 100000,
        cliente: { nombre: 'Carlos Ruiz' },
      },
    ])
    vi.mocked(mockPrisma.venta.count).mockResolvedValueOnce(3) // ventasHoy
  })

  it('returns all fields matching AnalisisData contract', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data).toHaveProperty('clientesActivos', 15)
    expect(data).toHaveProperty('ventasPendientes', 8)
    expect(data).toHaveProperty('totalPorCobrar', 450000)
    expect(data).toHaveProperty('ventasHoy', 3)
    expect(data).toHaveProperty('totalRecuperado', 1200000)
    expect(data).toHaveProperty('recuperadoEsteMes', 350000)
    expect(data).toHaveProperty('ventasTotales', 2500000)
    expect(data).toHaveProperty('pctRecuperacion')
    expect(data).toHaveProperty('clientesConDeuda', 3)
    expect(data).toHaveProperty('topDeudores')
    expect(data).toHaveProperty('stockBajo')
  })

  it('pctRecuperacion is calculated as percentage of totalRecuperado / ventasTotales', async () => {
    const response = await GET()
    const data = await response.json()

    // 1200000 / 2500000 = 0.48 → 48%
    expect(data.pctRecuperacion).toBe(48)
  })

  it('topDeudores returns top 3 debtors sorted by amount descending', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.topDeudores).toHaveLength(3)
    expect(data.topDeudores[0].nombre).toBe('Juan Perez')
    expect(data.topDeudores[0].total).toBe(200000)
    expect(data.topDeudores[1].nombre).toBe('Maria Gomez')
    expect(data.topDeudores[2].nombre).toBe('Carlos Ruiz')
  })

  it('stockBajo contains products with low stock', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.stockBajo).toHaveLength(1)
    expect(data.stockBajo[0].nombre).toBe('Pan Batido')
    expect(data.stockBajo[0].cantidadStock).toBe(2)
  })

  it('returns 500 when prisma throws', async () => {
    vi.mocked(mockPrisma.cliente.count).mockRejectedValueOnce(new Error('DB error'))

    const response = await GET()
    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data).toHaveProperty('error')
  })
})
