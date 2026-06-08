# Tasks: Ubicación de Clientes

> Design discrepancy: spec marks `direccion` as required (text, required); design uses `String?` (optional). Tasks follow the design — optional schema + API-level 422 validation. Raise if schema should make it required instead.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~280 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | All tasks | PR 1 | Single PR targeting main; all tests included with code |

## Phase 1: Foundation — Schema & Dependencies

- [x] **T1.1** Install `react-leaflet`, `leaflet`, `@types/leaflet` — `app/package.json`
- [x] **T1.2** Add `direccion String?`, `latitud Float?`, `longitud Float?` to Cliente model — `prisma/schema.prisma`
- [x] **T1.3** Run `prisma migrate dev --name add_cliente_ubicacion`
- [x] **T1.4** Import Leaflet CSS (`node_modules/leaflet/dist/leaflet.css`) in layout or via `_app` equivalent

## Phase 2: Core — API & Component

- [x] **T2.1** Update `POST /api/clientes`: destructure `direccion`, `latitud`, `longitud` from body; include in `prisma.cliente.create` data; return 422 if `direccion` missing — `app/api/clientes/route.ts`
- [x] **T2.2** Write API integration test: POST with full location persists; POST without `direccion` returns 422
- [x] **T3.1** Create `components/MapaUbicacion.tsx`: react-leaflet `MapContainer` + `TileLayer` (OSM) + draggable `Marker` + `useMapEvents`; Nominatim forward/reverse geocoding with 1s debounce; default center Colombia (~4.57, -74.30); loading spinner during geocoding; receives `MapaUbicacionProps` interface from design
- [x] **T3.2** Write unit test: MapaUbicacion renders without crash (mocked Leaflet); shows "Ubicación no disponible" when coords are null

## Phase 3: Integration — List & Detail Pages

- [x] **T4.1** Extend `Cliente` type in list page: add `direccion`, `latitud`, `longitud` — `app/clientes/page.tsx`
- [x] **T4.2** Add `direccion` text input to create form between `email` and `notas` — `app/clientes/page.tsx`
- [x] **T4.3** Show truncated direccion (≤50 chars + ellipsis) in client cards below contacto — `app/clientes/page.tsx`
- [x] **T5.1** Extend `Cliente` type in detail page: add `direccion`, `latitud`, `longitud` — `app/clientes/[id]/page.tsx`
- [x] **T5.2** Add readonly `MapaUbicacion` in detail view section (after datos cliente, before saldo) — `app/clientes/[id]/page.tsx`
- [x] **T5.3** Add `direccion` input + editable `MapaUbicacion` (draggable marker, geocoding) to edit form — `app/clientes/[id]/page.tsx`

## Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1 — Foundation | 4 | Schema, migration, deps, CSS |
| 2 — Core | 4 | API route + MapaUbicacion component + tests |
| 3 — Integration | 5 | List page cards/form + Detail page map/form |
| **Total** | **13** | ~280 lines, single PR |
