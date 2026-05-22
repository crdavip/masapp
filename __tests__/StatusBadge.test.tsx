import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge from '../components/StatusBadge'

describe('StatusBadge', () => {
  it('renders pendiente state', () => {
    render(<StatusBadge estado="pendiente" />)
    expect(screen.getByText('Pendiente')).toBeDefined()
  })

  it('renders pagada state', () => {
    render(<StatusBadge estado="pagada" />)
    expect(screen.getByText('Pagada')).toBeDefined()
  })

  it('renders parcial state', () => {
    render(<StatusBadge estado="parcial" />)
    expect(screen.getByText('Parcial')).toBeDefined()
  })
})
