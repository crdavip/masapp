// Dynamic wrapper for SSR-safe Leaflet import
// The actual implementation is in MapaUbicacionInner
// See usage: const MapaUbicacion = dynamic(() => import('@/components/MapaUbicacion'), { ssr: false })

import MapaUbicacionInner from './MapaUbicacionInner'
import type { MapaUbicacionProps } from './MapaUbicacionInner'

export type { MapaUbicacionProps }
export default MapaUbicacionInner
