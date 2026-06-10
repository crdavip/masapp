import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { useParams, useSearchParams } from 'next/navigation'

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useSearchParams: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  usePathname: vi.fn(() => '/ventas/test-id'),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
    <a href={href} {...props}>{children}</a>,
}))

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ status: 'authenticated', data: { user: { name: 'Test' } } })),
}))

vi.mock('@/components/SearchableSelect', () => ({
  default: ({ options, value, onChange, placeholder }: {
    options: { value: string; label: string }[]
    value: string
    onChange: (v: string) => void
    placeholder?: string
  }) => (
    <select
      data-testid="searchable-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder || 'Seleccionar...'}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  ),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

const { default: VentaDetallePage } = await import('../../app/ventas/[id]/page')

const mockVenta = {
  id: 'test-venta-id',
  clienteId: 'test-cliente-id',
  cliente: { id: 'test-cliente-id', nombre: 'Juan Perez' },
  total: '150000.00',
  saldoPendiente: '100000.00',
  estado: 'pendiente',
  fecha: new Date().toISOString(),
  notas: null,
  items: [
    { id: 'item-1', productoId: 'prod-1', producto: { id: 'prod-1', nombre: 'Harina' }, cantidad: 5, precioUnitario: '20000.00', subtotal: '100000.00' },
    { id: 'item-2', productoId: 'prod-2', producto: { id: 'prod-2', nombre: 'Arroz' }, cantidad: 2, precioUnitario: '25000.00', subtotal: '50000.00' },
  ],
  abonos: [
    { id: 'abono-1', monto: '50000.00', metodoPago: 'efectivo', fecha: new Date().toISOString(), notas: null },
  ],
}

const mockProductos = [
  { id: 'prod-1', nombre: 'Harina', precioVenta: '20000.00', cantidadStock: 50 },
  { id: 'prod-2', nombre: 'Arroz', precioVenta: '25000.00', cantidadStock: 30 },
  { id: 'prod-3', nombre: 'Azúcar', precioVenta: '15000.00', cantidadStock: 20 },
]

const mockPagadaVenta = {
  ...mockVenta,
  total: '50000.00',
  saldoPendiente: '0.00',
  estado: 'pagada',
  items: [
    { id: 'item-1', productoId: 'prod-1', producto: { id: 'prod-1', nombre: 'Harina' }, cantidad: 5, precioUnitario: '10000.00', subtotal: '50000.00' },
  ],
  abonos: [
    { id: 'abono-1', monto: '50000.00', metodoPago: 'efectivo', fecha: new Date().toISOString(), notas: null },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useParams).mockReturnValue({ id: 'test-venta-id' })
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams('') as unknown as URLSearchParams)
  mockFetch.mockImplementation((url: string, options?: RequestInit) => {
    if (options?.method === 'PATCH') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ...mockVenta }),
      } as Response)
    }
    if (url === '/api/productos') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProductos),
      } as Response)
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockVenta),
    } as Response)
  })
})

afterEach(() => {
  cleanup()
})

describe('VentaDetallePage — edit mode', () => {
  it('shows edit button and enters edit mode with controls', async () => {
    render(<VentaDetallePage />)
    await screen.findByText('Juan Perez')

    expect(screen.getByText('Editar items')).toBeTruthy()

    fireEvent.click(screen.getByText('Editar items'))

    await screen.findByText('Guardar cambios')

    expect(screen.getByDisplayValue('5')).toBeTruthy()
    expect(screen.getByDisplayValue('2')).toBeTruthy()

    const removeButtons = screen.getAllByTitle('Eliminar item')
    expect(removeButtons).toHaveLength(2)

    expect(screen.getByText('Agregar producto')).toBeTruthy()
    expect(screen.getByText('Cancelar')).toBeTruthy()
  })

  it('calls PATCH with remove operation when removing an item', async () => {
    render(<VentaDetallePage />)
    await screen.findByText('Juan Perez')
    fireEvent.click(screen.getByText('Editar items'))
    await screen.findByText('Guardar cambios')

    const removeButtons = screen.getAllByTitle('Eliminar item')
    fireEvent.click(removeButtons[0])

    fireEvent.click(screen.getByText('Guardar cambios'))

    await waitFor(() => {
      const patchCall = mockFetch.mock.calls.find(
        ([url, opts]: [string, RequestInit]) =>
          opts?.method === 'PATCH' && url.includes('/items')
      )
      expect(patchCall).toBeTruthy()
      const body = JSON.parse(patchCall![1].body as string)
      expect(body.operations).toContainEqual({
        op: 'remove',
        ventaItemId: 'item-1',
      })
    })
  })

  it('calls PATCH with update operation when changing quantity', async () => {
    render(<VentaDetallePage />)
    await screen.findByText('Juan Perez')
    fireEvent.click(screen.getByText('Editar items'))
    await screen.findByText('Guardar cambios')

    const qtyInput = screen.getByDisplayValue('5') as HTMLInputElement
    fireEvent.change(qtyInput, { target: { value: '3' } })

    fireEvent.click(screen.getByText('Guardar cambios'))

    await waitFor(() => {
      const patchCall = mockFetch.mock.calls.find(
        ([url, opts]: [string, RequestInit]) =>
          opts?.method === 'PATCH' && url.includes('/items')
      )
      expect(patchCall).toBeTruthy()
      const body = JSON.parse(patchCall![1].body as string)
      expect(body.operations).toContainEqual({
        op: 'update',
        ventaItemId: 'item-1',
        cantidad: 3,
      })
    })
  })

  it('calls PATCH with add operation when adding a new item', async () => {
    render(<VentaDetallePage />)
    await screen.findByText('Juan Perez')
    fireEvent.click(screen.getByText('Editar items'))
    await screen.findByText('Guardar cambios')

    const select = screen.getByTestId('searchable-select')
    fireEvent.change(select, { target: { value: 'prod-3' } })

    const priceInputs = screen.getAllByRole('spinbutton')
    const priceInput = priceInputs[priceInputs.length - 1]
    fireEvent.change(priceInput, { target: { value: '15000' } })

    fireEvent.click(screen.getByText('Agregar'))

    await screen.findByDisplayValue('15000')

    fireEvent.click(screen.getByText('Guardar cambios'))

    await waitFor(() => {
      const patchCall = mockFetch.mock.calls.find(
        ([url, opts]: [string, RequestInit]) =>
          opts?.method === 'PATCH' && url.includes('/items')
      )
      expect(patchCall).toBeTruthy()
      const body = JSON.parse(patchCall![1].body as string)
      expect(body.operations).toContainEqual({
        op: 'add',
        productoId: 'prod-3',
        cantidad: 1,
        precioUnitario: 15000,
      })
    })
  })

  it('reverts all local changes on cancel', async () => {
    render(<VentaDetallePage />)
    await screen.findByText('Juan Perez')
    fireEvent.click(screen.getByText('Editar items'))
    await screen.findByText('Guardar cambios')

    const removeButtons = screen.getAllByTitle('Eliminar item')
    const qtyInput = screen.getByDisplayValue('5') as HTMLInputElement
    fireEvent.change(qtyInput, { target: { value: '3' } })

    fireEvent.click(screen.getByText('Cancelar'))

    expect(screen.queryByDisplayValue('3')).toBeNull()
    expect(screen.queryByDisplayValue('5')).toBeNull()
    expect(screen.queryByTitle('Eliminar item')).toBeNull()
    expect(screen.queryByText('Guardar cambios')).toBeNull()
    expect(screen.getByText('Editar items')).toBeTruthy()

    const patchCalls = mockFetch.mock.calls.filter(
      ([, opts]: [string, RequestInit]) => opts?.method === 'PATCH'
    )
    expect(patchCalls).toHaveLength(0)
  })

  it('disables save button when no changes made', async () => {
    render(<VentaDetallePage />)
    await screen.findByText('Juan Perez')
    fireEvent.click(screen.getByText('Editar items'))
    await screen.findByText('Guardar cambios')

    const saveButton = screen.getByText('Guardar cambios') as HTMLButtonElement
    expect(saveButton.disabled).toBe(true)
  })

  it('keeps edit mode active and shows error when save fails', async () => {
    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (options?.method === 'PATCH') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Stock insuficiente para Harina' }),
        } as Response)
      }
      if (url === '/api/productos') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProductos),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockVenta),
      } as Response)
    })

    render(<VentaDetallePage />)
    await screen.findByText('Juan Perez')
    fireEvent.click(screen.getByText('Editar items'))
    await screen.findByText('Guardar cambios')

    const removeButtons = screen.getAllByTitle('Eliminar item')
    fireEvent.click(removeButtons[0])

    fireEvent.click(screen.getByText('Guardar cambios'))

    await screen.findByText('Stock insuficiente para Harina')
    expect(screen.getByText('Guardar cambios')).toBeTruthy()
    expect(screen.getByText('Cancelar')).toBeTruthy()
  })

  it('hides edit button when estado is pagada', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/productos') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProductos),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPagadaVenta),
      } as Response)
    })

    render(<VentaDetallePage />)
    await screen.findByText('Juan Perez')

    expect(screen.queryByText('Editar items')).toBeNull()
  })
})
