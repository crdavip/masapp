# Proposal: Geolocalización de Clientes

## Intent
Reemplazar el campo de texto obligatorio `direccion` en la creación de clientes por un botón de geolocalización que capture latitud/longitud mediante la API del navegador. En el detalle del cliente, mostrar un mapa con la ubicación. Esto elimina el error 422 cuando no se ingresa dirección y agrega valor real al saber dónde están los clientes.

## Scope

### In Scope
- Eliminar validación obligatoria de `direccion` en POST /api/clientes
- Agregar botón "📍 Capturar ubicación" en el formulario de crear cliente
- Guardar `latitud`/`longitud` al crear el cliente
- Mostrar mapa en la página de detalle del cliente
- Mantener `direccion` como campo editable en el formulario de editar (no obligatorio)

### Out of Scope
- Eliminar `direccion` de la base de datos
- Geolocalización masiva o backfill para clientes existentes
- Mapas con clustering o features avanzadas

## Capabilities

### New Capabilities
- `client-management`: Gestión de clientes con ubicación geográfica

### Modified Capabilities
None

## Approach
- API: remover el bloque `if (!direccion) return 422` del POST handler. Mantener `direccion` en el destructure para pasarlo opcionalmente.
- Formulario crear: reemplazar el `<input>` de dirección por un botón + texto de estado. Al hacer clic, llamar `navigator.geolocation.getCurrentPosition()`, guardar lat/lng en estado, mostrar coordenadas.
- Detalle: agregar un mapa Leaflet que muestre `[latitud, longitud]` cuando existan.
- Dependencia: agregar `leaflet` y `@types/leaflet` a package.json.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/api/clientes/route.ts` | Modified | Remove direccion required validation |
| `app/clientes/page.tsx` | Modified | Replace input with geolocation button |
| `app/clientes/[id]/page.tsx` | Modified | Add map display |
| `package.json` | Modified | Add leaflet dependency |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Geolocation solo funciona en HTTPS | Medium | Localhost funciona; en prod debe servirse con HTTPS |
| Usuario deniega permiso de ubicación | Medium | Mostrar mensaje claro y no bloquear la creación |
| Leaflet aumenta bundle size | Low | Usar import dinámico o iframe de Google Maps como alternativa |

## Rollback Plan
Revertir cambios en los 3 archivos modificados y remover leaflet de package.json.

## Success Criteria
- [ ] Crear cliente sin ubicación funciona (no 422)
- [ ] Botón de geolocalización captura lat/lng y se guarda en DB
- [ ] Página de detalle muestra mapa con pin cuando hay lat/lng
- [ ] Página de detalle no muestra mapa cuando lat/lng son null

## Dependencies
- `leaflet` y `@types/leaflet` (npm)

## Delivery Strategy
Chained PRs (stacked-to-main), review budget 400 lines.
