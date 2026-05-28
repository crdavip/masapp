import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PrismaClient } from '@prisma/client'

const mockPrisma = {
  venta: {
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  producto: {
    findMany: vi.fn(),
  },
  abono: {
    aggregate: vi.fn(),
  },
} as unknown as PrismaClient

vi.mock('../../lib/db', () => ({
  default: mockPrisma,
}))

const { GET } = await import('../../app/api/dashboard/route')

describe('GET /api/dashboard (summary — 3 cards)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(mockPrisma.producto.findMany).mockResolvedValue([
      { nombre: 'Pan Batido', cantidadStock: 2 },
    ])
    vi.mocked(mockPrisma.venta.aggregate).mockResolvedValue({
      _sum: { saldoPendiente: 450000 },
    }) // totalPorCobrar
    vi.mocked(mockPrisma.venta.count).mockResolvedValue(3) // ventasHoy
    vi.mocked(mockPrisma.abono.aggregate).mockResolvedValue({
      _sum: { monto: 1250000 },
    }) // totalRecuperado
  })

  it('returns summary fields: totalPorCobrar, ventasHoy, totalRecuperado, stockBajo', async () => {
    const response = await GET()
    const data = await response.json()

    // Summary fields MUST be present
    expect(data).toHaveProperty('totalPorCobrar', 450000)
    expect(data).toHaveProperty('ventasHoy', 3)
    expect(data).toHaveProperty('totalRecuperado')
    expect(data).toHaveProperty('stockBajo')

    // Analytical fields NOT in summary MUST NOT be present
    expect(data).not.toHaveProperty('clientesActivos')
    expect(data).not.toHaveProperty('ventasPendientes')
    expect(data).not.toHaveProperty('recuperadoEsteMes')
    expect(data).not.toHaveProperty('ventasTotales')
    expect(data).not.toHaveProperty('pctRecuperacion')
    expect(data).not.toHaveProperty('clientesConDeuda')
    expect(data).not.toHaveProperty('topDeudores')
  })

  it('returns stock bajo in response', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.stockBajo).toHaveLength(1)
    expect(data.stockBajo[0].nombre).toBe('Pan Batido')
    expect(data.stockBajo[0].cantidadStock).toBe(2)
  })

  it('returns 500 on prisma error', async () => {
    vi.mocked(mockPrisma.producto.findMany).mockRejectedValueOnce(new Error('DB error'))

    const response = await GET()
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data).toHaveProperty('error')
  })
})
