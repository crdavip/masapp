# Design: Editar Items de Venta

## Architecture Overview

New PATCH endpoint at `app/api/ventas/[id]/items/route.ts` receives batch operations, processes them inside a single Prisma `$transaction` with stock validation and deltas, then recalculates `total`, `saldoPendiente`, and `estado`. The UI adds an edit toggle on the detail page switching items from read-only to editable with inline quantity controls, remove buttons, and a product search combobox to add new items.

## Data Flow

### PATCH /api/ventas/[id]/items

1. Parse and validate the operations array from request body
2. Enter `prisma.$transaction`:
   a. Read current `Venta` with `items` (include `producto` for stock) and `abonos`
   b. Validate each operation against current state:
      - **add**: `productoId` exists, `cantidad > 0`, stock check (`Producto.cantidadStock - cantidad >= 0`)
      - **remove**: `ventaItemId` exists and belongs to this venta
      - **update**: `ventaItemId` exists, `cantidad > 0`, stock check (current stock + current item cantidad - new cantidad >= 0)
   c. Accumulate stock deltas per `productoId` across all operations
   d. Apply stock changes to `Producto` (increment/decrement `cantidadStock`)
   e. Apply `VentaItem` mutations (create for add, delete for remove, update cantidad+subtotal for update)
   f. Recalculate `total` = SUM(all `VentaItem.subtotal`), `saldoPendiente` = `total` - SUM(`Abono.monto`), `estado` based on saldo
   g. Return updated venta with items and abonos
3. On any validation failure: throw a structured error that Prisma transaction rolls back automatically

### UI Edit Mode

1. User clicks "Editar items" button → `editMode = true`, `editedItems` initialized as deep copy of current `venta.items`
2. Each item row switches to editable controls (quantity input, remove button)
3. "Agregar producto" section appears with `SearchableSelect` (reused from `app/ventas/nueva/page.tsx`) + cantidad/price inputs
4. User modifies items locally in `editedItems` state
5. **Save**: build operations array by diffing `editedItems` vs original `venta.items`, call `PATCH /api/ventas/[id]/items`
6. **Cancel**: reset `editedItems` to original, exit edit mode

## API Contract

### PATCH /api/ventas/[id]/items

**Request:**
```json
{
  "operations": [
    { "op": "add", "productoId": "uuid", "cantidad": 2, "precioUnitario": 10000 },
    { "op": "remove", "ventaItemId": "uuid" },
    { "op": "update", "ventaItemId": "uuid", "cantidad": 5 }
  ]
}
```

**Response 200:**
```json
{
  "id": "venta-uuid",
  "total": "150000.00",
  "saldoPendiente": "50000.00",
  "estado": "parcial",
  "items": [...],
  "abonos": [...]
}
```

**Error 400:**
```json
{ "error": "Stock insuficiente para Producto X" }
```

**Error 400 on saldo floor:**
```json
{ "error": "La eliminación reduciría el saldo pendiente por debajo de 0" }
```

### Validation Rules

- `operations` array MUST NOT be empty
- Each op MUST have valid `op` field (`add` | `remove` | `update`)
- **add**: requires `productoId` (valid UUID referencing existing `Producto`), `cantidad > 0`, `precioUnitario > 0`
- **remove**: requires `ventaItemId` that exists and belongs to this venta
- **update**: requires `ventaItemId` + `cantidad > 0`
- Stock validation for add/update: `cantidad` must not exceed `current stock + current item cantidad` (if update)
- `saldoPendiente` MUST NOT go below 0 after applying all operations

### Estado Logic

```
sumAbonos = SUM(abonos.monto) for this venta
newTotal = SUM(all VentaItem.subtotal after operations)
newSaldo = newTotal - sumAbonos
newEstado = newSaldo <= 0 ? 'pagada' : sumAbonos > 0 ? 'parcial' : 'pendiente'
```

### Stock Delta Logic

For each operation, compute a stock delta per `productoId`:
- **add**: `stockDelta -= cantidad`
- **remove**: `stockDelta += currentItem.cantidad`
- **update**: `stockDelta += (currentItem.cantidad - newCantidad)`

After accumulating all deltas grouped by `productoId`, validate that `Producto.cantidadStock + stockDelta >= 0` for each producto. Apply all deltas atomically within the transaction.

### Transaction Boundary

```
prisma.$transaction(async (tx) => {
  1. Read current venta + items (with producto stock) + abonos
  2. Validate all operations (stock availability, item existence, saldo floor)
  3. Apply stock changes to Producto (increment/decrement cantidadStock)
  4. Apply VentaItem mutations (create for add, delete for remove, update cantidad/subtotal for update)
  5. Recalculate venta total, saldoPendiente, estado
  6. Return updated venta with items (include producto.nombre) and abonos
})
```

## Component Changes

### app/ventas/[id]/page.tsx

**New State:**
- `editMode: boolean` — toggle edit mode
- `editedItems: EditedItem[]` — local copy of items while editing (deep copy of `venta.items`)
- `savingItems: boolean` — loading state during save
- `newItem: { productoId: string | null, cantidad: number, precioUnitario: number }` — add-item form state

**New UI in edit mode:**
- "Editar items" button next to "Productos" heading (visible when `estado !== 'pagada'`)
- Each item row transforms to editable controls:
  - Quantity: `<input type="number" min="1" max={stock + currentCantidad} value={item.cantidad} onChange={...}/>`
  - Remove: button with `X` icon (Lucide `X`), hidden if removing would make `saldoPendiente < 0`
- "Agregar producto" section with:
  - `SearchableSelect` for product search (reuse from `@/components/SearchableSelect`)
  - Quantity input (type=number, min=1)
  - Price input (type=number, defaults to producto's `precioVenta`)
  - "Agregar" button — pushes new item to `editedItems` array locally
- Bottom action bar with:
  - "Guardar cambios" button (primary, disabled while saving)
  - "Cancelar" button (secondary, resets and exits edit mode)

**On Save:**
1. Build operations array from diff between `editedItems` and original `venta.items`:
   - Items in `editedItems` with no matching `ventaItemId` → `add` ops
   - Items missing from `editedItems` that were in original → `remove` ops
   - Items with changed `cantidad` → `update` ops
2. POST `PATCH /api/ventas/[id]/items` with the operations array
3. On success: re-fetch venta data via `load()`, exit edit mode
4. On error: show error message in the error banner, stay in edit mode

**On Cancel:**
1. Reset `editedItems` to deep copy of `venta.items`
2. Clear `newItem` state
3. Exit edit mode

**Changes to imports:**
- Add `SearchableSelect` from `@/components/SearchableSelect`
- Add `X`, `Plus`, `Save`, `Edit` from `lucide-react`

### app/api/ventas/[id]/items/route.ts (NEW)

New file with a single `PATCH` export following the transaction boundary described above.

## Error States

- **Stock insufficient** on save → show error "Stock insuficiente para {producto.nombre}"
- **saldoPendiente floor violation** → show error "La operación reduciría el saldo pendiente por debajo de 0"
- **Network error** → show generic error "Error al guardar cambios", keep edits intact
- **Validation error** (empty operations, invalid op) → show server error message

## Empty States

- Venta with no items: not applicable (venta always has items when created)
- Product search with no matching products: `SearchableSelect` shows "Sin resultados"
- Edit mode with no changes: "Guardar cambios" button disabled (no diff = no operations)

## Testing Strategy

### Unit/Integration Tests
- PATCH endpoint: each operation type (add, remove, update) as individual test cases
- Stock validation: sufficient stock, insufficient stock, exact stock boundary
- saldoPendiente floor validation: removal that would make saldo < 0 rejected
- Multiple operations in single request: mixed add/remove/update
- Estado recalculation after operations: pendiente → parcial → pagada transitions
- Atomic rollback: simulate partial failure, verify no stock or item changes persisted

### UI Tests
- Edit mode toggle renders correct controls (quantity inputs, remove buttons, add section)
- Remove button calls PATCH with correct `remove` op
- Quantity change calls PATCH with correct `update` op
- Adding item calls PATCH with correct `add` op
- Cancel reverts all local changes
- Empty diff disables save button
- Error response keeps edit mode active with error visible

## Performance Considerations

- Single `$transaction` ensures consistency — all ops succeed or none do
- Single-user app, no concurrent edit concerns
- Stock validation within `$transaction` prevents race conditions even under concurrent access
- Operations array kept reasonably small (typical sale has < 50 items)
