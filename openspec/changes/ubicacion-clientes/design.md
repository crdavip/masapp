# Design: Ubicación de Clientes

## Technical Approach

Agregar `direccion` (String?), `latitud` (Float?), `longitud` (Float?) al modelo `Cliente`. Componente `MapaUbicacion` con `react-leaflet` (dynamic import + `ssr: false`) para mapa, marcador draggeable y geocoding via Nominatim. Tiles gratuitos de OpenStreetMap. Sin API key.

## Architecture Decisions

| Decisión | Opciones | Tradeoff | Decisión |
|---|---|---|---|
| Librería de mapa | **react-leaflet** vs Leaflet vanilla vs Google Maps | react-leaflet es declarativo, encaja con el patrón React existente; vanilla Leaflet da más control pero más boilerplate; Google Maps requiere API key y billing | **react-leaflet** |
| Proveedor de geocoding | **Nominatim** vs Google Maps vs Mapbox | Nominatim es gratuito sin clave, suficiente para app monousuario; Google/Mapbox requieren registro y billing | **Nominatim** (1 req/s, debounce 1s) |
| SSR safety | **dynamic import + `{ ssr: false }`** vs condition check | Dynamic import es más limpio y evita hydration mismatch; conditional rendering requiere `typeof window` en cada uso | **Dynamic import** |
| Interacción marcador | **Draggeable + reverse geocoding** vs solo click | Drag actualiza coordenadas automáticamente; reverse geocoding completa dirección al soltar — UX mínima | **Draggeable** |
| Ubicación del mapa | **Inline en detalle/edición** vs modal | Inline sigue el patrón existente de formularios en la página; modal agrega anidamiento innecesario | **Inline** |

## Data Flow

```
Create:
  Form (dirección) ──→ Nominatim forward geocode ──→ {lat, lng} ──→ POST /api/clientes ──→ Prisma ──→ DB
       ↑                                                                                         │
       └─────────────────────── MapaUbicacion muestra marker ←────────────────────────────────────┘

Edit:
  GET /api/clientes/:id ──→ {lat, lng} ──→ MapaUbicacion (marker posicionado)
       ↓
  User arrastra marker ──→ reverse geocode ──→ direccion ──→ PATCH /api/clientes/:id ──→ Prisma ──→ DB

Detail:
  GET /api/clientes/:id ──→ {lat, lng, direccion} ──→ MapaUbicacion (readonly, marker fijo)
```

## Component Tree

```
PageLayout
├── ClientesPage (lista)
│   ├── CreateForm (inline)
│   │   ├── inputs: nombre, telefono, email, notas
│   │   └── input + MapaUbicacion (direccion + geocoding)
│   └── ClienteCard ──→ Link to /clientes/:id
│       └── (nuevo) preview de direccion
│
└── ClienteDetallePage
    ├── DetailView
    │   ├── datos cliente
    │   └── (nuevo) MapaUbicacion readonly con marker
    └── EditForm
        ├── inputs: nombre, telefono, email, notas
        └── (nuevo) input direccion + MapaUbicacion editable
```

### States

| Componente | Loading | Empty | Error |
|---|---|---|---|
| MapaUbicacion | Spinner mientras se carga Leaflet | "Ubicación no disponible" si no hay datos | Mensaje si geocoding falla |
| CreateForm | — | Mapa centrado en ubicación default (Bogotá) | Toast si Nominatim falla |
| DetailView | — | Ocultar sección de mapa si no hay datos | — |

## File Changes

| File | Action | Description |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add `direccion String?`, `latitud Float?`, `longitud Float?` a modelo Cliente |
| `app/api/clientes/route.ts` | Modify | POST: destructure + persist `direccion`, `latitud`, `longitud` |
| `components/MapaUbicacion.tsx` | Create | Map component with Leaflet map, draggable marker, Nominatim geocoding |
| `app/clientes/page.tsx` | Modify | Add `direccion` field to Cliente type, create form, and card preview |
| `app/clientes/[id]/page.tsx` | Modify | Add fields to Cliente type, render MapaUbicacion in detail + edit form |

## Interfaces / Contracts

```typescript
type MapaUbicacionProps = {
  latitud?: number | null
  longitud?: number | null
  direccion?: string | null
  onLocationChange?: (lat: number, lng: number, direccion?: string) => void
  readonly?: boolean
}
```

`MapaUbicacion` se consume via dynamic import:

```typescript
const MapaUbicacion = dynamic(() => import('@/components/MapaUbicacion'), { ssr: false })
```

## Testing Strategy

| Capa | Qué probar | Cómo |
|---|---|---|
| Unit | MapaUbicacion renderiza sin crash (con mock de Leaflet) | @testing-library/react + jsdom, mock `leaflet` y `react-leaflet` |
| Integration | POST/PATCH incluyen direccion, latitud, longitud en el body | Test de API route con Prisma mock |
| Manual | Marker drag updatea coordenadas; geocoding completa dirección | Navegador: crear/editar cliente con ubicación |

## Migration / Rollout

Sin migración de datos — todos los campos nuevos son opcionales. Ejecutar `prisma migrate dev` para generar migración. Agregar dependencias: `react-leaflet`, `leaflet`, `@types/leaflet`.
