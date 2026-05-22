import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatCard from '../components/StatCard'
import { Users } from 'lucide-react'

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard icon={Users} label="Clientes" value={42} />)
    expect(screen.getByText('Clientes')).toBeDefined()
    expect(screen.getByText('42')).toBeDefined()
  })
})
