# Tasks: Editar Items de Venta

## Review Workload Forecast
- Estimated changed lines: ~350
- 400-line budget risk: Low
- Decision needed before apply: No

## Task Group 1: Backend — PATCH /api/ventas/[id]/items

- [x] 1.1 Create route file with PATCH handler and input validation
- [x] 1.2 Implement add operation (stock check, VentaItem create, stock decrement)
- [x] 1.3 Implement remove operation (VentaItem delete, stock restore)
- [x] 1.4 Implement update operation (cantidad change, stock delta)
- [x] 1.5 Implement atomic transaction wrapper (prisma.$transaction)
- [x] 1.6 Implement recalculation (total, saldoPendiente, estado, ultimoMovimiento)
- [x] 1.7 Implement saldoPendiente floor validation

## Task Group 2: Frontend — Edit Mode UI

### 2.1 Add edit mode state and toggle
- [x] Add state to `app/ventas/[id]/page.tsx`:
  - `editMode: boolean` — toggle edit mode on/off
  - `editedItems: EditedItem[]` — deep copy of `venta.items` while editing
  - `savingItems: boolean` — loading state during save
  - `newItem: { productoId, cantidad, precioUnitario }` — add-item form state
  - `error: string | null` — error message display
- [x] "Editar items" button next to "Productos" heading (Lucide `Edit` icon)
- [x] Hidden when `estado === 'pagada'`
- [x] Toggle `editMode` on click

### 2.2 Implement editable item rows
- [x] In edit mode, each item row shows:
  - Quantity: `<input type="number" min="1">`
  - Remove button: Lucide `X` icon button
- [x] Remove button with title "Eliminar item"
- [x] Changes update `editedItems` state locally (no API call yet)
- [x] Subtotal display updates live based on local quantity

### 2.3 Implement add-item section
- [x] `SearchableSelect` for product search (reuse from `@/components/SearchableSelect`)
- [x] Quantity input: `type="number"`, `min="1"`
- [x] Price input: `type="number"`, defaults to selected product's `precioVenta`
- [x] "Agregar" button pushes new item to `editedItems` array
- [x] Validate all fields before adding

### 2.4 Implement save/cancel actions
- [x] **Save ("Guardar cambios")**:
  - Build operations array by diffing `editedItems` vs original `venta.items`:
    - Items in `editedItems` with `isNew` → `add` ops
    - Items missing from `editedItems` that were in original → `remove` ops
    - Items with changed `cantidad` → `update` ops
  - Call `PATCH /api/ventas/[id]/items` with `{ operations }`
  - On success: re-fetch venta via `load()`, exit edit mode
  - On error: show error, stay in edit mode
- [x] **Cancel ("Cancelar")**:
  - Reset `editedItems` to empty, clear `newItem` state and error
  - Exit edit mode

### 2.5 Handle edge cases
- [x] No changes (empty diff) → disable "Guardar cambios" button
- [x] `estado === 'pagada'` → hide edit button entirely
- [x] Loading state while saving → disable all edit controls
- [x] Error display → reuse existing error banner above items section

## Task Group 3: Testing

### 3.1 Backend integration tests
- [x] Add operation: stock decremented, item created, total increased
- [x] Remove operation: stock restored, item deleted, total decreased
- [x] Update operation: quantity changed, stock delta correct
- [x] Insufficient stock on add: returns 400, no data modified
- [x] Insufficient stock on update: returns 400, no data modified
- [x] Saldo floor on remove: removal making saldo < 0 returns 400
- [x] Atomicity: mixed valid+invalid ops rolls back everything
- [x] Estado recalculation: parcial to pagada transition
- [x] Multiple operations in single request: mixed add/remove/update
- [x] Price fallback: add without precioUnitario uses producto.precioVenta
- [x] Venta not found: 404
- [x] Empty operations array: 400
- [x] Invalid op field: 400
- [x] Missing productoId: 400
- [x] Missing ventaItemId: 400

### 3.2 UI tests (if test infrastructure exists)
- Test edit mode toggle renders quantity inputs, remove buttons, add section
- Test remove button calls PATCH with correct remove op
- Test quantity change calls PATCH with correct update op
- Test add item calls PATCH with correct add op
- Test cancel reverts all local changes
- Test empty diff disables save button
- Test error response keeps edit mode active with error visible
- Test edit button hidden when estado='pagada'

## Chain Strategy
- PR 1: Task Group 1 (backend — route + transaction logic)
- PR 2: Task Group 2 (frontend — edit mode UI)
- PR 3: Task Group 3 (tests)

## Task Dependencies
- 1.x must be complete before 2.x (frontend needs the endpoint to exist)
- 3.x can run after 1.x is stable (backend tests depend on the route; UI tests depend on the frontend changes)
- Within each group, tasks are sequential (e.g., 1.2 depends on 1.1, 1.3 depends on 1.2 & 1.1, etc.)
