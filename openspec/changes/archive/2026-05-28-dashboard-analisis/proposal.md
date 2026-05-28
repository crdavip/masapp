# Proposal: Dashboard — Extraer análisis completo a /analisis

## Intent

Dashboard at `/` mixes operational stats (clientes activos, stock bajo) with analytical KPIs (total recuperado, % recuperación). This overloads the surface. Create `/analisis` as the **full stats page** (all metrics), while dashboard becomes a **summary operations center** (only at-a-glance ops data + stock bajo + quick links).

## Scope

### In Scope
- New `/analisis` page with **ALL** existing StatCards + Top deudores (complete stats view)
- New `/api/analisis` endpoint with ALL queries (operational + analytical)
- Dashboard removes analytical cards + Top deudores, keeps operational + stock bajo + quick links
- Desktop Header + mobile BottomNav get "Análisis" link
- Dedicated API approach (separate endpoints, clean contracts)

### Out of Scope
- No new analytics or metrics beyond what already exists
- Dashboard stays at root `/` (no route change)
- No schema or DB changes

## Capabilities

### New Capabilities
None — restructuring existing stats into a separate surface, not introducing new spec-level behavior.

### Modified Capabilities
None — no existing dashboard spec in `openspec/specs/`.

## Approach

**Approach A: Dedicated API + new page.** Create `/api/analisis/route.ts` with ALL queries (operational + analytical): clientesActivos, ventasPendientes, totalPorCobrar, ventasHoy, stockBajo, totalRecuperado, recuperadoEsteMes, ventasTotales, pctRecuperacion, clientesConDeuda, topDeudores. Create `app/analisis/page.tsx` as client component reusing `StatCard` — renders ALL cards + Top deudores. Dashboard (`app/page.tsx`) keeps only operational cards + stock bajo + quick links; its API (`/api/dashboard/route.ts`) keeps only operational queries. Minor query duplication between endpoints is acceptable for clean separation. Add "Análisis" to Header.tsx and BottomNav.tsx.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/analisis/page.tsx` | New | Client component, ALL StatCards + Top deudores (full view) |
| `app/api/analisis/route.ts` | New | GET endpoint with ALL queries (operational + analytical) |
| `app/page.tsx` | Modified | Remove analytical cards + Top deudores — keep only operational + stock bajo + quick links |
| `app/api/dashboard/route.ts` | Modified | Remove analytical query blocks — keep only operational queries |
| `components/Header.tsx` | Modified | Add "Análisis" link to desktop nav |
| `components/BottomNav.tsx` | Modified | Add "Análisis" item (5 items — may need layout tweak) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| BottomNav at 5 items — layout break | Low | Test on mobile widths; adjust justify/gap if needed |
| Header nav link order feels off | Low | Insert Análisis after Ventas, keep logical flow |

## Rollback Plan

Restore `app/page.tsx` and `app/api/dashboard/route.ts` from git. Delete `app/analisis/` and `app/api/analisis/`. Revert Header.tsx and BottomNav.tsx.

## Dependencies

- None external. Icons from lucide-react (already installed).

## Success Criteria

- [ ] Dashboard loads only operational cards + stock bajo + quick links — no analytical stats
- [ ] `/analisis` renders ALL StatCards (operational + analytical) + Top deudores — complete view
- [ ] Both pages render correctly on mobile and desktop
- [ ] Desktop Header shows "Análisis" link; BottomNav shows "Análisis" tab
- [ ] No TypeScript or build errors
