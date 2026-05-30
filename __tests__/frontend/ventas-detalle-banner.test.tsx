import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, cleanup } from '@testing-library/react'
import { useParams, useSearchParams } from 'next/navigation'

// Mock next/navigation before importing the component
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useSearchParams: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  usePathname: vi.fn(() => '/ventas/test-id'),
}))

// Mock next/link — render a simple anchor
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
    <a href={href} {...props}>{children}</a>,
}))

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ status: 'authenticated', data: { user: { name: 'Test' } } })),
}))

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

const { default: VentaDetallePage } = await import('../../app/ventas/[id]/page')

const mockVenta = {
  id: 'test-venta-id',
  clienteId: 'test-cliente-id',
  cliente: { id: 'test-cliente-id', nombre: 'Juan Perez' },
  total: '1000.00',
  saldoPendiente: '800.00',
  estado: 'pendiente',
  fecha: new Date().toISOString(),
  notas: null,
  items: [
    { id: 'item-1', productoId: 'prod-1', producto: { id: 'prod-1', nombre: 'Harina' }, cantidad: 5, precioUnitario: '200.00', subtotal: '1000.00' },
  ],
  abonos: [
    { id: 'abono-1', monto: '200.00', metodoPago: 'efectivo', fecha: new Date().toISOString(), notas: null },
  ],
}

describe('VentaDetallePage — anexado banner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useParams).mockReturnValue({ id: 'test-venta-id' })
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockVenta),
    } as Response)
  })

  afterEach(() => {
    cleanup()
  })

  it('shows banner when anexado=1 query param is present', async () => {
    const searchParams = new URLSearchParams('anexado=1')
    vi.mocked(useSearchParams).mockReturnValue(searchParams as unknown as URLSearchParams)

    render(<VentaDetallePage />)

    // Wait for the component to render fetched data
    await screen.findByText('Juan Perez')

    const banner = screen.queryByText('Items agregados a venta existente del cliente')
    expect(banner).toBeTruthy()
  })

  it('does not show banner when anexado query param is absent', async () => {
    const searchParams = new URLSearchParams('')
    vi.mocked(useSearchParams).mockReturnValue(searchParams as unknown as URLSearchParams)

    render(<VentaDetallePage />)

    // Wait for the component to render fetched data
    await screen.findByText('Juan Perez')

    const banner = screen.queryByText('Items agregados a venta existente del cliente')
    expect(banner).toBeNull()
  })
})
