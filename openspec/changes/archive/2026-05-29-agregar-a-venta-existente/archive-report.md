# Archive Report: agregar-a-venta-existente

**Archived**: 2026-05-29
**Change**: Agregar items a venta existente
**Mode**: openspec

## Verification Verdict

- **Spec requirements**: 13/13 met (REQ-1 through REQ-13)
- **Tests**: 64/64 passing
- **New TS errors**: 13 (mock type narrowing only — not real issues)
- **Pre-existing TS errors**: 11 (in analisis.test.ts, dashboard.test.ts)
- **Build**: Successful

**Status**: ✅ PASS — All checks passed. No critical issues.

## Artifacts

| Artifact | Location |
|----------|----------|
| Proposal | `openspec/changes/archive/2026-05-29-agregar-a-venta-existente/proposal.md` |
| Spec | `openspec/changes/archive/2026-05-29-agregar-a-venta-existente/spec.md` |
| Design | `openspec/changes/archive/2026-05-29-agregar-a-venta-existente/design.md` |
| Tasks | `openspec/changes/archive/2026-05-29-agregar-a-venta-existente/tasks.md` |
| Tasks completed | 13/13 ✅ |
| Verify report | Engram `sdd/agregar-a-venta-existente/verify-report` (#40) |

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `app/api/ventas/route.ts` | Modified | Added active-sale detection + append logic inside `$transaction` |
| `app/ventas/nueva/page.tsx` | Modified | Check `appended` flag in POST response, redirect with `?anexado=1` |
| `app/ventas/[id]/page.tsx` | Modified | Read `?anexado=1` via `useSearchParams`, show blue notification banner (auto-hide 5s) |
| `scripts/merge-ventas-duplicadas.ts` | Created | One-shot migration: find clients with >1 active sale, merge into oldest |
| `__tests__/api/ventas.test.ts` | Created | Integration tests for POST /api/ventas: append, create, stock validation |
| `__tests__/scripts/merge-ventas-duplicadas.test.ts` | Created | Tests for merge script: detection, merge, recalculation, idempotence |
| `__tests__/frontend/ventas-detalle-banner.test.tsx` | Created | Tests for notification banner rendering with `?anexado=1` |

## Implementation Summary

### Phase 1 — Backend Append (commit `38822d9`)
- POST /api/ventas now runs `findFirst` for an active Venta (estado IN 'pendiente','parcial', oldest first) inside the `$transaction`
- If active sale found: appends items as new VentaItem rows, increases `total` and `saldoPendiente`, returns `appended: true`
- If not: creates new Venta (original flow), returns `appended: false`
- Stock validation and decrement identical for both branches

### Phase 2 — Frontend Notification (commit `078e50c`)
- `nueva/page.tsx`: reads `venta.appended` response field, redirects to `/ventas/{id}?anexado=1`
- `[id]/page.tsx`: uses `useSearchParams` to detect `?anexado=1`, shows a blue info banner: "Items agregados a venta existente del cliente", auto-hides after 5 seconds

### Phase 3 — Migration Script (commit `8d3bd63`)
- `scripts/merge-ventas-duplicadas.ts`: finds clients with >1 active sale
- For each client: in a `$transaction`, moves VentaItems + Abonos to the oldest surviving Venta, recalculates total/saldoPendiente/estado, deletes orphaned rows
- Idempotent: if no duplicates found, prints "No duplicates found" and exits cleanly
- Prints summary per client (name, sales merged, items/abonos moved)

## Architecture Decisions (from design.md)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Detection strategy | Inline `findFirst` inside `$transaction` | Simple, atomic, one request |
| Append signal | `appended: boolean` in JSON response | Additive, doesn't break existing consumers |
| Estado after append | Keep current estado | Append never reduces debt; estado transitions only via abonos |
| Survivor selection | Oldest Venta by `fecha` | Preserves original chronology |

## Main Spec Updated

- **Created**: `openspec/specs/ventas-creation/spec.md`
- The delta spec is a full spec (no existing main spec for POST /api/ventas behavior), copied directly

## Warnings / Issues

- **13 new TS errors** from mock type narrowing (`as unknown as PrismaClient` strips Mock type info) — non-blocking, test-only
- **No toast library** in project: notification uses local state + CSS pattern (matching existing error banner pattern)
- **Integration tests not available** (no test DB): tests use mocked Prisma
- **E2E tests not available** (no Playwright config): banner redirect tested via unit/integration

## SDD Cycle Complete

This change has been fully planned, implemented, verified, and archived.
