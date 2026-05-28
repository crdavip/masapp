import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Dashboard from '../../app/page'
import { formatCOP } from '../../lib/format'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'authenticated', data: { user: { email: 'test@test.com' } } }),
  signOut: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/',
}))

const mockSummaryData = {
  totalPorCobrar: 450000,
  ventasHoy: 3,
  totalRecuperado: 1250000,
  stockBajo: [
    { nombre: 'Pan Batido', cantidadStock: 2 },
    { nombre: 'Leche', cantidadStock: 4 },
  ],
}

describe('Dashboard page (summary — 3 cards)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockSummaryData),
    })
  })

  function waitForDashboard() {
    return waitFor(() => {
      const els = screen.getAllByText('Dashboard')
      expect(els.length).toBeGreaterThanOrEqual(1)
    })
  }

  it('renders 3 summary StatCards: Ventas Hoy, Total Recuperado, Total por Cobrar', async () => {
    render(<Dashboard />)

    await waitForDashboard()

    expect(screen.getByText('Ventas hoy')).toBeDefined()
    expect(screen.getByText('Total recuperado')).toBeDefined()
    expect(screen.getByText('Total por cobrar')).toBeDefined()

    expect(screen.getByText(formatCOP(1250000))).toBeDefined()
    expect(screen.getByText(formatCOP(450000))).toBeDefined()
  })

  it('does NOT render removed stat labels', async () => {
    render(<Dashboard />)

    await waitForDashboard()

    expect(screen.queryByText('Clientes activos')).toBeNull()
    expect(screen.queryByText('Ventas pendientes')).toBeNull()
    expect(screen.queryByText('Recuperado este mes')).toBeNull()
    expect(screen.queryByText('Ventas totales')).toBeNull()
    expect(screen.queryByText('% Recuperación')).toBeNull()
    expect(screen.queryByText('Clientes con deuda')).toBeNull()
  })

  it('does NOT render TopDeudores section', async () => {
    render(<Dashboard />)

    await waitForDashboard()

    expect(screen.queryByText('Top 3 deudores')).toBeNull()
  })

  it('renders StockBajo section', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Productos con stock bajo')).toBeDefined()
    })

    expect(screen.getByText(/Pan Batido/)).toBeDefined()
  })

  it('renders Quick Links', async () => {
    render(<Dashboard />)

    await waitForDashboard()

    // "Clientes" appears in both Header nav and Quick Links
    const clientesLinks = screen.getAllByText('Clientes')
    expect(clientesLinks.length).toBeGreaterThanOrEqual(2)

    const productosLinks = screen.getAllByText('Productos')
    expect(productosLinks.length).toBeGreaterThanOrEqual(2)

    const ventasLinks = screen.getAllByText('Ventas')
    expect(ventasLinks.length).toBeGreaterThanOrEqual(2)

    const gestionarLinks = screen.getAllByText('Gestionar')
    expect(gestionarLinks).toHaveLength(3)
  })

  it('renders loading state initially', () => {
    render(<Dashboard />)
    expect(screen.getByText('Cargando...')).toBeDefined()
  })
})
