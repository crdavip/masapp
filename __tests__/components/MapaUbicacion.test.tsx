import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock leaflet and react-leaflet before importing the component
const mockMapContainer = vi.fn(({ children }) => <div data-testid="map-container">{children}</div>)
const mockTileLayer = vi.fn(() => null)
const mockMarker = vi.fn(() => null)
const mockUseMapEvents = vi.fn()
const mockPopup = vi.fn(({ children }) => <div data-testid="popup">{children}</div>)

vi.mock('react-leaflet', () => ({
  MapContainer: mockMapContainer,
  TileLayer: mockTileLayer,
  Marker: mockMarker,
  useMapEvents: mockUseMapEvents,
  Popup: mockPopup,
}))

vi.mock('leaflet', () => {
  const iconDefault = {
    prototype: { _getIconUrl: vi.fn() },
    mergeOptions: vi.fn(),
  }
  const L = {
    icon: vi.fn(() => ({})),
    Icon: { Default: iconDefault },
    DomUtil: { get: vi.fn() },
    DivIcon: vi.fn(),
  }
  return { default: L }
})

// We test the inner component by rendering it directly
// The inner component is at '@/components/MapaUbicacionInner'
// We create a mock version with the expected behavior

describe('MapaUbicacionInner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows hint to click on map when no coords', async () => {
    const MapaUbicacionInner = (await import('@/components/MapaUbicacionInner')).default
    const { container } = render(<MapaUbicacionInner />)
    // When no coords, shows hint instead of placeholder
    expect(container.textContent).toContain('clic en el mapa')
  })

  it('renders direccion text in search input when no coords but has direccion', async () => {
    const MapaUbicacionInner = (await import('@/components/MapaUbicacionInner')).default
    render(<MapaUbicacionInner direccion="Calle 123 #45-67, Bogotá" />)
    const input = screen.getByTestId('direccion-search') as HTMLInputElement
    expect(input.value).toBe('Calle 123 #45-67, Bogotá')
  })

  it('renders search input when not readonly', async () => {
    const MapaUbicacionInner = (await import('@/components/MapaUbicacionInner')).default
    render(<MapaUbicacionInner latitud={4.71} longitud={-74.07} />)
    expect(screen.getByTestId('direccion-search')).toBeDefined()
  })

  it('does not render search input when readonly', async () => {
    const MapaUbicacionInner = (await import('@/components/MapaUbicacionInner')).default
    render(<MapaUbicacionInner latitud={4.71} longitud={-74.07} readonly />)
    expect(screen.queryByTestId('direccion-search')).toBeNull()
  })
})
