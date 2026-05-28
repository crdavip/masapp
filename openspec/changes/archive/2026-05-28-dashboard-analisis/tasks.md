# Tasks: Dashboard — Separar análisis completo a /analisis

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~200-250 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Infrastructure — New API + Page

- [x] 1.1 Create `app/api/analisis/route.ts` — GET endpoint with ALL queries (operational + analytical). Copy from dashboard route, keep all query blocks including totalRecuperado, recuperadoEsteMes, ventasTotales, pctRecuperacion, ventasConSaldo/topDeudores, clientesConDeuda
- [x] 1.2 Create `app/analisis/page.tsx` — Client component fetching from `/api/analisis`. Render 9 StatCards (all stats) + StockBajo section + Top 3 deudores section. Use same pattern as current dashboard: `useEffect` → fetch → render

## Phase 2: Implementation — Update Existing + Nav

- [x] 2.1 Update `app/api/dashboard/route.ts` — Keep only 3 summary queries: totalPorCobrar, ventasHoy, totalRecuperado + stockBajo
- [x] 2.2 Update `app/page.tsx` — 3 summary StatCards (Ventas Hoy, Total Recuperado, Total por Cobrar) + StockBajo + Quick Links
- [x] 2.3 Update `components/Header.tsx` — Add import `BarChart3` from lucide-react. Append `{ href: '/analisis', label: 'Análisis', icon: BarChart3 }` to `links` array after Ventas
- [x] 2.4 Update `components/BottomNav.tsx` — Add import `BarChart3` from lucide-react. Append Análisis item to `items` array. Reduce `min-w-[64px]` to `min-w-[56px]` on the Link className to fit 5 items

## Phase 3: Testing

- [x] 3.1 Create `__tests__/api/analisis.test.ts` — Test GET /api/analisis returns all fields per AnalisisData contract. Mock Prisma responses for each aggregate
- [x] 3.2 Create `__tests__/app/analisis.test.tsx` — Render AnalisisPage with mocked fetch returning full AnalisisData. Verify all 9 StatCards + StockBajo + TopDeudores sections render
- [x] 3.3 Update dashboard test — Verify GET /api/dashboard returns only operational fields (no analytical). Verify dashboard page renders only 4 StatCards (no analytical cards, no TopDeudores)
- [x] 3.4 Run full test suite — `npm test` passes with no regressions
