# Proposal: Ubicación de Clientes

## Intent

Agregar dirección geográfica y mapa interactivo al módulo de clientes, permitiendo ver y editar ubicación con geocodificación automática.

## Scope

### In Scope
- Schema: `direccion`, `latitud`, `longitud` en Cliente
- API: POST/PATCH aceptan los 3 campos nuevos
- Componente `MapaUbicacion` con mapa, marcador draggeable y geocoding Nominatim
- Formularios: campo de dirección + mapa en create/edit
- Vista detalle: mapa embebido + datos de ubicación

### Out of Scope
- Clustering de marcadores en lista
- Geocoding batch / importación masiva
- Cálculo de rutas o distancias entre clientes
- Google Maps u otros proveedores de mapas

## Capabilities

### New Capabilities
- `cliente-ubicacion`: Almacenar dirección y coordenadas (lat/lng) por cliente; visualizar y editar ubicación en mapa interactivo con geocoding

### Modified Capabilities
- None

## Approach

`react-leaflet` + `leaflet` con importación dinámica (`{ ssr: false }`). Nominatim para forward/reverse geocoding con debounce (1 req/s). Marcador draggeable actualiza coordenadas; reverse geocoding completa dirección automáticamente. Tiles de OpenStreetMap (gratuito, sin API key).

## Affected Areas

| Area | Change |
|---|---|
| `prisma/schema.prisma` | + `direccion String?`, `latitud Float?`, `longitud Float?` |
| `app/api/clientes/route.ts` | POST acepta nuevos campos |
| `app/api/clientes/[id]/route.ts` | PATCH opera con `data: body` (ya funcional) |
| `components/MapaUbicacion.tsx` | NEW — mapa + marcador + geocoding |
| `app/clientes/page.tsx` | Vista previa de dirección en cards; campo en formulario |
| `app/clientes/[id]/page.tsx` | Mapa en detalle; campos en edición |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Icono default de Leaflet roto en webpack | High | Fix conocido de 5 líneas (`default icon import`) |
| react-leaflet v5 incompatible con React 19 | Medium | Verificar en instalación; tener `@react-leaflet/core` como fallback |
| Rate limiting de Nominatim (1 req/s) | Medium | Debounce de 1s en búsqueda; cachear resultados en sesión |
| Hydration mismatch por Leaflet en SSR | High | Dynamic import con `{ ssr: false }` |

## Rollback Plan

Revertir commit de schema; `prisma migrate down` o regenerar migración. Eliminar `MapaUbicacion.tsx`, limpiar imports en páginas. Remover `react-leaflet` y `leaflet` de dependencias.

## Dependencies

- `react-leaflet` + `leaflet` + `@types/leaflet` (npm)
- Nominatim API (https, sin clave)
- OpenStreetMap tiles (CDN)

## Success Criteria

- [ ] Cliente se crea/edita con dirección y coordenadas
- [ ] Mapa muestra marcador en ubicación guardada
- [ ] Marcador draggeable actualiza coordenadas
- [ ] Geocoding completa dirección al soltar marcador
- [ ] Búsqueda por texto posiciona marcador en el mapa
- [ ] SSR no produce errores de hidratación
