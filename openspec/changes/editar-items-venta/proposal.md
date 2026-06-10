# Proposal: Editar Items de Venta

## Intent

Today items are write-once: POST creates or appends, PATCH does a blind `venta.update` with no item support, and the detail page is read-only for items. Users can't fix mistakes (wrong quantity, wrong product) or add items to an existing sale without going through the append flow. We need edit capability directly on the sale detail.

## Scope

### In Scope

- PATCH `/api/ventas/[id]/items` with batch `{ operations: [...] }` supporting add, remove, update quantity — all in a single `$transaction` with stock validation and deltas, total/saldoPendiente/estado recalculation, and rejection of ops that would make `saldoPendiente < 0`.
- UI edit mode on `app/ventas/[id]/page.tsx` with inline quantity controls, remove buttons, and a product search combobox to add new items.

### Out of Scope

- Price editing for existing items (price is frozen at sale time; new items use current `precioVenta` or user-supplied value).
- Item reordering or grouping.
- Batch operations across multiple ventas.
- Undo/redo for item edits.

## Capabilities

### New Capabilities

- `venta-item-editing`: Edit items in existing sales — add, remove, change quantities with stock reconciliation and total/estado recalculation.

### Modified Capabilities

- `venta-creation`: No spec-level changes (POST append continues as-is, no conflicts with item editing).

## Approach

Dedicated PATCH endpoint receives batch operations, processes them inside Prisma `$transaction` with serializable isolation: validate stock for adds/updates, compute stock deltas, apply mutations, recalculate `total` (sum of subtotals), `saldoPendiente` (total - sumAbonos), and `estado` (pagada/parcial/pendiente). UI adds an edit toggle on the detail page switching items from read-only to editable with inline controls and a product search combobox.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/api/ventas/[id]/items/route.ts` | NEW | PATCH endpoint for batch item operations in `$transaction` |
| `app/ventas/[id]/page.tsx` | MODIFIED | Edit mode with inline quantity, remove, add-item via product search |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Stock race condition | Low (single-user) | `$transaction` with serializable isolation |
| `saldoPendiente` goes negative | Medium | Server-side validation rejecting ops that would make it < 0 |

## Rollback Plan

Revert: `git revert` the commit. Data recovery: restore stock manually if transaction completed mid-error (low risk given single-user + `$transaction`).

## Success Criteria

- [ ] Can remove item from sale and stock is restored to producto
- [ ] Can change item quantity and stock delta is correct
- [ ] Can add new item to existing sale
- [ ] `total` recalculated after any item change
- [ ] `saldoPendiente` recalculated, never below 0
- [ ] `estado` updated correctly (pendiente/parcial/pagada)
- [ ] 400 error on invalid operations or constraint violations

## Dependencies

None

## Validation

- `npm test` passes
- `npm run lint` passes
- `npx tsc --noEmit` passes
