import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Header from '../../components/Header'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'authenticated', data: { user: { email: 'test@test.com' } } }),
  signOut: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('Header', () => {
  it('renders Análisis link pointing to /analisis', () => {
    render(<Header />)

    const analisisLink = screen.getByText('Análisis')
    expect(analisisLink).toBeDefined()
    const anchor = analisisLink.closest('a')
    expect(anchor?.getAttribute('href')).toBe('/analisis')
  })

  it('renders all nav links including Análisis', () => {
    render(<Header />)

    expect(screen.getByText('Clientes')).toBeDefined()
    expect(screen.getByText('Productos')).toBeDefined()
    expect(screen.getByText('Ventas')).toBeDefined()
    expect(screen.getByText('Análisis')).toBeDefined()
  })
})
