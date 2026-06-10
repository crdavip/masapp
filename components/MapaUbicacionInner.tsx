'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Loader2, MapPin } from 'lucide-react'

// Leaflet CSS is required for map tiles and controls to render correctly.
// This import is safe because MapaUbicacion is always loaded via dynamic(() => import(...), { ssr: false }).
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icon (well-known webpack/bundler issue)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const COLOMBIA_CENTER: [number, number] = [4.57, -74.3]
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org'

export type MapaUbicacionProps = {
  latitud?: number | null
  longitud?: number | null
  direccion?: string | null
  onLocationChange?: (lat: number, lng: number, direccion?: string) => void
  readonly?: boolean
}

function MapClickHandler({
  readonly,
  onLocationChange,
  onPlaced,
}: {
  readonly: boolean
  onLocationChange?: (lat: number, lng: number, direccion?: string) => void
  onPlaced?: () => void
}) {
  useMapEvents({
    click(e) {
      if (readonly) return
      reverseGeocode(e.latlng.lat, e.latlng.lng, onLocationChange)
      onPlaced?.()
    },
  })
  return null
}

function DraggableMarker({
  position,
  readonly,
  onLocationChange,
}: {
  position: [number, number]
  readonly: boolean
  onLocationChange?: (lat: number, lng: number, direccion?: string) => void
}) {
  return (
    <Marker
      draggable={!readonly}
      position={position}
      eventHandlers={{
        dragend(e) {
          const marker = e.target
          const pos = marker.getLatLng()
          reverseGeocode(pos.lat, pos.lng, onLocationChange)
        },
      }}
    >
      <Popup>
        {position[0].toFixed(4)}, {position[1].toFixed(4)}
      </Popup>
    </Marker>
  )
}

async function reverseGeocode(
  lat: number,
  lng: number,
  onLocationChange?: (lat: number, lng: number, direccion?: string) => void,
) {
  if (!onLocationChange) return
  // Return coordinates immediately, geocode in background
  onLocationChange(lat, lng, undefined)

  try {
    const res = await fetch(
      `${NOMINATIM_URL}/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`,
      { headers: { 'User-Agent': 'masa-app/1.0' } },
    )
    if (!res.ok) return
    const data = await res.json()
    const direccion = data.display_name || ''
    onLocationChange(lat, lng, direccion)
  } catch {
    // Silently fail — coordinates are already set
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

async function forwardGeocode(
  query: string,
  onResult: (lat: number, lng: number, direccion: string) => void,
  onError?: () => void,
) {
  try {
    const res = await fetch(
      `${NOMINATIM_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=es`,
      { headers: { 'User-Agent': 'masa-app/1.0' } },
    )
    if (!res.ok) {
      onError?.()
      return
    }
    const data = await res.json()
    if (data.length > 0) {
      const lat = parseFloat(data[0].lat)
      const lng = parseFloat(data[0].lon)
      onResult(lat, lng, data[0].display_name || query)
    }
  } catch {
    onError?.()
  }
}

export default function MapaUbicacionInner({
  latitud,
  longitud,
  direccion,
  onLocationChange,
  readonly = false,
}: MapaUbicacionProps) {
  const [searchQuery, setSearchQuery] = useState(direccion || '')
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState(false)
  const [geolocating, setGeolocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [center, setCenter] = useState<[number, number]>(
    latitud && longitud ? [latitud, longitud] : COLOMBIA_CENTER,
  )
  const prevDireccionRef = useRef(direccion)

  // Sync search input with direccion prop
  useEffect(() => {
    if (direccion !== prevDireccionRef.current) {
      setSearchQuery(direccion || '')
      prevDireccionRef.current = direccion
    }
  }, [direccion])

  // Debounced forward geocode
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value)
      setGeocodeError(false)

      if (debounceTimer) clearTimeout(debounceTimer)

      if (!value.trim()) return

      setGeocoding(true)
      debounceTimer = setTimeout(() => {
        forwardGeocode(
          value,
          (lat, lng, dir) => {
            setCenter([lat, lng])
            onLocationChange?.(lat, lng, dir)
            setGeocoding(false)
          },
          () => {
            setGeocodeError(true)
            setGeocoding(false)
          },
        )
      }, 500)
    },
    [onLocationChange],
  )

  const handleGeoLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocalización no disponible en este navegador')
      return
    }
    setGeolocating(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setCenter([lat, lng])
        setMarkerPlaced(true)
        reverseGeocode(lat, lng, onLocationChange)
        setGeolocating(false)
      },
      (err) => {
        setGeolocating(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError('Permiso de ubicación denegado. Activá la ubicación en el navegador o marcá en el mapa.')
            break
          case err.POSITION_UNAVAILABLE:
            setGeoError('No se pudo obtener la ubicación. Probá marcando en el mapa.')
            break
          case err.TIMEOUT:
            setGeoError('La solicitud de ubicación tardó mucho. Probá de nuevo.')
            break
          default:
            setGeoError('Error al obtener la ubicación.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [onLocationChange])

  const hasCoords = latitud != null && longitud != null
  const [markerPlaced, setMarkerPlaced] = useState(hasCoords)

  return (
    <div className="space-y-2">
      {!readonly && (
        <>
          <div className="relative">
            <input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscá una dirección o hace clic en el mapa..."
              className="w-full p-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="direccion-search"
            />
            {geocoding && (
              <Loader2
                size={16}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-600 animate-spin"
                data-testid="geocoding-spinner"
              />
            )}
          </div>

          <button
            type="button"
            onClick={handleGeoLocate}
            disabled={geolocating}
            className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {geolocating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <MapPin size={16} />
            )}
            {geolocating ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
          </button>

          {!markerPlaced && !geocoding && !geolocating && (
            <p className="text-xs text-blue-600 flex items-center gap-1">
              <span>💡</span> Hacé clic en el mapa, escribí una dirección, o usá el botón de arriba
            </p>
          )}
        </>
      )}

      {geocodeError && (
        <p className="text-xs text-red-600">No se encontró esa dirección. Probá haciendo clic en el mapa.</p>
      )}

      {geoError && (
        <p className="text-xs text-red-600">{geoError}</p>
      )}

      <div className="h-48 sm:h-72 rounded-lg overflow-hidden border border-gray-200" data-testid="map-wrapper">
        <MapContainer
          center={center}
          zoom={15}
          className="h-full w-full"
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {!readonly && (
            <MapClickHandler
              readonly={readonly}
              onLocationChange={onLocationChange}
              onPlaced={() => setMarkerPlaced(true)}
            />
          )}
          {(hasCoords || markerPlaced) && (
            <DraggableMarker
              position={hasCoords ? [latitud!, longitud!] : center}
              readonly={readonly}
              onLocationChange={onLocationChange}
            />
          )}
        </MapContainer>
      </div>

      {direccion && readonly && (
        <p className="text-xs text-gray-500 truncate">{direccion}</p>
      )}
    </div>
  )
}
