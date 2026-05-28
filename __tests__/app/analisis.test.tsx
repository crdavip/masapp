import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AnalisisPage from '../../app/analisis/page'
import { formatCOP } from '../../lib/format'

// Mock next-auth and next/navigation used by PageLayout
vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'authenticated', data: { user: { email: 'test@test.com' } } }),
  signOut: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/analisis',
}))

const mockData = {
  clientesActivos: 15,
  ventasPendientes: 8,
  totalPorCobrar: 450000,
  ventasHoy: 3,
  totalRecuperado: 1200000,
  recuperadoEsteMes: 350000,
  ventasTotales: 2500000,
  pctRecuperacion: 48,
  clientesConDeuda: 5,
  topDeudores: [
    { nombre: 'Juan Perez', total: 200000 },
    { nombre: 'Maria Gomez', total: 150000 },
    { nombre: 'Carlos Ruiz', total: 100000 },
  ],
  stockBajo: [
    { nombre: 'Pan Batido', cantidadStock: 2 },
    { nombre: 'Leche', cantidadStock: 4 },
  ],
}

describe('AnalisisPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockData),
    })
  })

  it('renders loading state initially', () => {
    render(<AnalisisPage />)
    expect(screen.getByText('Cargando...')).toBeDefined()
  })

  function waitForAnalisis() {
    return waitFor(() => {
      const els = screen.getAllByText('Análisis')
      expect(els.length).toBeGreaterThanOrEqual(1)
    })
  }

  it('renders all 9 StatCards with correct values after fetch', async () => {
    render(<AnalisisPage />)

    await waitForAnalisis()

    // Operational stats (4) — verify labels are rendered for all cards
    expect(screen.getByText('Clientes activos')).toBeDefined()
    expect(screen.getByText('Ventas pendientes')).toBeDefined()
    expect(screen.getByText('Total por cobrar')).toBeDefined()
    expect(screen.getByText('Ventas hoy')).toBeDefined()

    // Verify stat values render in the grid
    expect(screen.getByText('15')).toBeDefined()
    expect(screen.getByText('8')).toBeDefined()
    expect(screen.getByText(formatCOP(450000))).toBeDefined()
    const ventasHoyValues = screen.getAllByText('3')
    expect(ventasHoyValues.length).toBeGreaterThanOrEqual(1)

    // Analytical stats (5) — verify labels
    expect(screen.getByText('Total recuperado')).toBeDefined()
    expect(screen.getByText('Recuperado este mes')).toBeDefined()
    expect(screen.getByText('Ventas totales')).toBeDefined()
    expect(screen.getByText('% Recuperación')).toBeDefined()
    expect(screen.getByText('Clientes con deuda')).toBeDefined()

    // Verify analytical values
    expect(screen.getByText(formatCOP(1200000))).toBeDefined()
    expect(screen.getByText(formatCOP(350000))).toBeDefined()
    expect(screen.getByText(formatCOP(2500000))).toBeDefined()
    expect(screen.getByText('48%')).toBeDefined()
    const deudaValues = screen.getAllByText('5')
    expect(deudaValues.length).toBeGreaterThanOrEqual(1)
  })

  it('renders StockBajo section with product names', async () => {
    render(<AnalisisPage />)

    await waitFor(() => {
      expect(screen.getByText('Productos con stock bajo')).toBeDefined()
    })

    expect(screen.getByText(/Pan Batido/)).toBeDefined()
    expect(screen.getByText(/Leche/)).toBeDefined()
  })

  it('renders Top 3 deudores section', async () => {
    render(<AnalisisPage />)

    await waitFor(() => {
      expect(screen.getByText('Top 3 deudores')).toBeDefined()
    })

    expect(screen.getByText('Juan Perez')).toBeDefined()
    expect(screen.getByText('Maria Gomez')).toBeDefined()
    expect(screen.getByText('Carlos Ruiz')).toBeDefined()
  })

  it('renders stock bajo with correct unit text', async () => {
    render(<AnalisisPage />)

    await waitFor(() => {
      expect(screen.getByText(/2 unidades/)).toBeDefined()
    })

    expect(screen.getByText(/4 unidades/)).toBeDefined()
  })

  it('does NOT render stock bajo section when stockBajo is empty', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ...mockData, stockBajo: [] }),
    })

    render(<AnalisisPage />)

    await waitForAnalisis()

    expect(screen.queryByText('Productos con stock bajo')).toBeNull()
  })

  it('does NOT render TopDeudores section when topDeudores is empty', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ...mockData, topDeudores: [] }),
    })

    render(<AnalisisPage />)

    await waitForAnalisis()

    expect(screen.queryByText('Top 3 deudores')).toBeNull()
  })

  it('shows loading state on fetch error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    render(<AnalisisPage />)

    // Component should still show loading after a small delay
    // (the catch in useEffect prevents error, but data stays null)
    await new Promise(r => setTimeout(r, 100))

    expect(screen.getByText('Cargando...')).toBeDefined()
  })
})
