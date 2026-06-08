import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPrisma = {
  cliente: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
}

vi.mock('../../lib/db', () => ({
  default: mockPrisma,
}))

const { POST } = await import('../../app/api/clientes/route')

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/clientes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/clientes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('persists direccion, latitud, longitud on create', async () => {
    const created = {
      id: 'cliente-1',
      nombre: 'Juan Perez',
      telefono: null,
      email: null,
      notas: null,
      direccion: 'Calle 123 #45-67, Bogotá',
      latitud: 4.71,
      longitud: -74.07,
      createdAt: new Date().toISOString(),
    }
    mockPrisma.cliente.create.mockResolvedValue(created)

    const response = await POST(makeRequest({
      nombre: 'Juan Perez',
      direccion: 'Calle 123 #45-67, Bogotá',
      latitud: 4.71,
      longitud: -74.07,
    }))

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.direccion).toBe('Calle 123 #45-67, Bogotá')
    expect(data.latitud).toBe(4.71)
    expect(data.longitud).toBe(-74.07)
    expect(mockPrisma.cliente.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        nombre: 'Juan Perez',
        direccion: 'Calle 123 #45-67, Bogotá',
        latitud: 4.71,
        longitud: -74.07,
      }),
    })
  })

  it('returns 422 when direccion is missing', async () => {
    const response = await POST(makeRequest({
      nombre: 'Juan Perez',
    }))

    expect(response.status).toBe(422)
    const data = await response.json()
    expect(data.error).toContain('direccion')
    expect(mockPrisma.cliente.create).not.toHaveBeenCalled()
  })

  it('creates cliente without latitud/longitud when only direccion provided', async () => {
    const created = {
      id: 'cliente-2',
      nombre: 'Maria Gomez',
      direccion: 'Carrera 10 #20-30',
      latitud: null,
      longitud: null,
      telefono: null,
      email: null,
      notas: null,
      createdAt: new Date().toISOString(),
    }
    mockPrisma.cliente.create.mockResolvedValue(created)

    const response = await POST(makeRequest({
      nombre: 'Maria Gomez',
      direccion: 'Carrera 10 #20-30',
    }))

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.direccion).toBe('Carrera 10 #20-30')
    expect(data.latitud).toBeNull()
    expect(data.longitud).toBeNull()
  })
})
