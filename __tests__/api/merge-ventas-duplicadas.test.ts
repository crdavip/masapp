import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/merge-ventas-duplicadas/route'
import { mergeDuplicates } from '@/scripts/merge-ventas-duplicadas'

vi.mock('@/scripts/merge-ventas-duplicadas', () => ({
  mergeDuplicates: vi.fn(),
}))

const OLD_ENV = process.env

beforeEach(() => {
  vi.restoreAllMocks()
  process.env = { ...OLD_ENV, SEED_SECRET: 'test-secret' }
})

describe('GET /api/merge-ventas-duplicadas', () => {
  it('returns 401 without secret', async () => {
    const req = new Request('http://localhost/api/merge-ventas-duplicadas')
    const res = await GET(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('No autorizado')
  })

  it('returns 401 with wrong secret', async () => {
    const req = new Request('http://localhost/api/merge-ventas-duplicadas?secret=wrong')
    const res = await GET(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('No autorizado')
  })

  it('returns 200 with message when no duplicates', async () => {
    vi.mocked(mergeDuplicates).mockResolvedValue([])
    const req = new Request('http://localhost/api/merge-ventas-duplicadas?secret=test-secret')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('No se encontraron ventas duplicadas para fusionar')
  })

  it('returns 200 with merge results', async () => {
    vi.mocked(mergeDuplicates).mockResolvedValue([
      { clienteNombre: 'Cliente A', salesMerged: 2, itemsMoved: 5, abonosMoved: 2 },
      { clienteNombre: 'Cliente B', salesMerged: 1, itemsMoved: 3, abonosMoved: 0 },
    ])
    const req = new Request('http://localhost/api/merge-ventas-duplicadas?secret=test-secret')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('Fusión completada')
    expect(body.total).toBe(2)
    expect(body.detalles[0].cliente).toBe('Cliente A')
    expect(body.detalles[0].ventasFusionadas).toBe(2)
  })

  it('returns 500 when mergeDuplicates throws', async () => {
    vi.mocked(mergeDuplicates).mockRejectedValue(new Error('DB error'))
    const req = new Request('http://localhost/api/merge-ventas-duplicadas?secret=test-secret')
    const res = await GET(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('DB error')
  })
})
