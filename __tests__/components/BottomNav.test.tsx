import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import BottomNav from '../../components/BottomNav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

describe('BottomNav', () => {
  it('renders 5 nav items including Análisis', () => {
    render(<BottomNav />)

    expect(screen.getByText('Dashboard')).toBeDefined()
    expect(screen.getByText('Clientes')).toBeDefined()
    expect(screen.getByText('Productos')).toBeDefined()
    expect(screen.getByText('Ventas')).toBeDefined()
    expect(screen.getByText('Análisis')).toBeDefined()
  })

  it('renders all items in a single row container', () => {
    const { container } = render(<BottomNav />)

    const navWrapper = container.querySelector('.flex.items-center.justify-around')
    expect(navWrapper).toBeDefined()
    // Should have 5 Link children
    expect(navWrapper?.children.length).toBe(5)
  })
})
