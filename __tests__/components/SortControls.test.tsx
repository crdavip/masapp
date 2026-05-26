import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SortControls from '../../components/SortControls'

const OPTIONS = [
  { label: 'Nombre', value: 'nombre', type: 'string' as const },
  { label: 'Precio', value: 'precioVenta', type: 'number' as const },
]

describe('SortControls', () => {
  it('renders select with option labels', () => {
    render(
      <SortControls
        options={OPTIONS}
        field="nombre"
        direction="asc"
        onChange={() => {}}
        itemCount={5}
      />,
    )
    expect(screen.getByText('Nombre')).toBeDefined()
    expect(screen.getByText('Precio')).toBeDefined()
  })

  it('fires onChange when user selects a different field', () => {
    const onChange = vi.fn()

    render(
      <SortControls
        options={OPTIONS}
        field="nombre"
        direction="asc"
        onChange={onChange}
        itemCount={5}
      />,
    )

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'precioVenta' } })
    expect(onChange).toHaveBeenCalledWith('precioVenta', 'asc')
  })

  it('fires onChange with flipped direction when toggle is clicked', () => {
    const onChange = vi.fn()

    render(
      <SortControls
        options={OPTIONS}
        field="nombre"
        direction="asc"
        onChange={onChange}
        itemCount={5}
      />,
    )

    const toggle = screen.getByRole('button')
    fireEvent.click(toggle)
    expect(onChange).toHaveBeenCalledWith('nombre', 'desc')
  })

  it('fires again on second toggle click flipping back', () => {
    const onChange = vi.fn()

    render(
      <SortControls
        options={OPTIONS}
        field="nombre"
        direction="desc"
        onChange={onChange}
        itemCount={5}
      />,
    )

    const toggle = screen.getByRole('button')
    fireEvent.click(toggle)
    expect(onChange).toHaveBeenCalledWith('nombre', 'asc')
  })

  it('returns nothing when itemCount ≤ 1', () => {
    const { container } = render(
      <SortControls
        options={OPTIONS}
        field="nombre"
        direction="asc"
        onChange={() => {}}
        itemCount={1}
      />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('is visible when itemCount > 1', () => {
    render(
      <SortControls
        options={OPTIONS}
        field="nombre"
        direction="asc"
        onChange={() => {}}
        itemCount={5}
      />,
    )
    expect(screen.getByRole('combobox')).toBeDefined()
    expect(screen.getByRole('button')).toBeDefined()
  })

  it('applies responsive layout classes for small screens', () => {
    const { container } = render(
      <SortControls
        options={OPTIONS}
        field="nombre"
        direction="asc"
        onChange={() => {}}
        itemCount={5}
      />,
    )
    const wrapper = container.firstElementChild
    expect(wrapper?.className).toContain('flex-wrap')
  })
})
