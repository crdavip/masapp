# Tasks: Agregar items a venta existente

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~300-400 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Decision needed before apply | No |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

## Phase 1: Backend — Append logic en POST /api/ventas

- [x] 1.1 Añadir `findFirst` de venta activa (estado IN 'pendiente','parcial', más antigua) al inicio de la transacción en `app/api/ventas/route.ts`
- [x] 1.2 Bifurcar flujo: si existe venta activa → actualizar total + saldoPendiente (sumar), crear VentaItems con su ventaId; si no → crear Venta nueva (flow actual)
- [x] 1.3 Agregar campo `appended: boolean` al response para señalizar al frontend
- [x] 1.4 Verificar que stock se valida y decrementa igual en ambos flujos (idéntico al actual)

## Phase 2: Frontend — Notificación de append

- [x] 2.1 En `app/ventas/nueva/page.tsx`, detectar `venta.appended` en POST response y redirigir con query param `?anexado=1`
- [x] 2.2 En `app/ventas/[id]/page.tsx`, importar `useSearchParams`, leer `?anexado=1` y mostrar banner azul "Items agregados a venta existente del cliente" (mismo patrón que error banner, auto-ocultar tras 5s con setTimeout)

## Phase 3: Migración — Script de merge de duplicados

- [x] 3.1 Crear `scripts/merge-ventas-duplicadas.ts`: encontrar clientes con >1 venta activa (pendiente/parcial)
- [x] 3.2 Por cliente en `$transaction`: mover VentaItems + Abonos a venta más antigua (survivor, min fecha)
- [x] 3.3 Recalcular survivor: total = suma subtotales items, saldoPendiente = total - suma abonos, estado según regla (sumAbonos >= total → pagada, >0 → parcial, else pendiente)
- [x] 3.4 Eliminar ventas huérfanas (las que ya no tienen items ni abonos)
- [x] 3.5 Imprimir resumen por cliente: nombre, ventas fusionadas, items/abonos movidos
- [x] 3.6 Idempotente: si no hay duplicados, imprimir "No duplicates found" y exit 0

## Phase 4: Tests

- [x] 4.1 Test: POST /api/ventas con venta activa → items creados en venta existente, stock decrementado, `appended: true`
- [x] 4.2 Test: POST /api/ventas sin venta activa → nueva venta creada, `appended: false`
- [x] 4.3 Test: POST /api/ventas con cliente con solo ventas 'pagada' → nueva venta creada
- [x] 4.4 Test: POST /api/ventas con stock insuficiente en append → error 500, rollback total
- [x] 4.5 Test: Merge script con duplicados → survivor hereda items+abonos, huérfanas eliminadas, total y estado recalculados
- [x] 4.6 Test: Frontend banner se renderiza cuando `?anexado=1` está presente (mock useSearchParams)
