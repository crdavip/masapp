# Specification: Editar Items de Venta

## Capability: venta-item-editing

**Purpose**: Allow users to add, remove, and change quantities of items in existing ventas, with stock reconciliation and total/saldoPendiente/estado recalculation.

### REQ-1: Batch Item Operations via PATCH /api/ventas/[id]/items
PATCH endpoint MUST accept `{ operations: [...] }` where each operation has `op` (add|remove|update).

#### Scenario: Add item
- GIVEN venta with estado pendiente/parcial
- WHEN PATCH with operation `{ op: "add", productoId: "X", cantidad: 2 }`
- THEN new VentaItem created, stock decremented by 2, total/saldoPendiente increased

#### Scenario: Remove item
- GIVEN venta with existing VentaItem "Y"
- WHEN PATCH with operation `{ op: "remove", ventaItemId: "Y" }`
- THEN VentaItem "Y" deleted, stock restored

#### Scenario: Update quantity
- GIVEN venta with VentaItem "Y" currently cantidad=5
- WHEN PATCH with operation `{ op: "update", ventaItemId: "Y", cantidad: 3 }`
- THEN VentaItem.cantidad=3, stock delta applied (restored 2 units)

#### Scenario: Invalid op
- WHEN PATCH with unknown op
- THEN 400 error, no data modified

### REQ-2: Atomic Transaction
All operations in one request MUST succeed or fail together.

#### Scenario: Partial failure rolls back all
- GIVEN add (valid) + add (insufficient stock) in same request
- WHEN PATCH called
- THEN 400 error, no data modified

### REQ-3: Stock Validation and Deltas
Stock MUST validate sufficient stock for adds/updates, and restore on removes/reductions.

#### Scenario: Insufficient stock on add
- WHEN add operation with cantidad > stock
- THEN 400 error

#### Scenario: Stock restored on remove
- GIVEN VentaItem with cantidad=2
- WHEN remove operation
- THEN Producto.cantidadStock incremented by 2

### REQ-4: Total and saldoPendiente Recalculation
After operations, total = sum of all VentaItem subtotals. saldoPendiente = total - sum(abonos).

#### Scenario: After remove
- WHEN remove reduces total by 10000
- THEN new total = old total - 10000, saldoPendiente reduced accordingly

### REQ-5: saldoPendiente Floor
Server MUST reject operations that would make saldoPendiente < 0.

#### Scenario: Cannot remove more than unpaid
- GIVEN venta total=100000, sumAbonos=80000, saldoPendiente=20000
- WHEN remove items worth 30000
- THEN 400 error (saldoPendiente would be -10000)

#### Scenario: Can remove up to saldoPendiente
- WHEN remove items worth exactly 20000
- THEN 200 OK, saldoPendiente=0, estado='pagada'

### REQ-6: Estado Recalculation
Server MUST recalculate estado after operations: sumAbonos >= total → 'pagada', sumAbonos > 0 → 'parcial', else 'pendiente'.

#### Scenario: Estado changes to pagada
- GIVEN venta total=50000, sumAbonos=50000, saldoPendiente=0
- WHEN any operation keeps saldoPendiente=0
- THEN estado='pagada'

### REQ-7: Price on Add
When adding items, if precioUnitario is not provided in the operation, use producto.precioVenta at time of request.

#### Scenario: Current price on add
- WHEN add operation without precioUnitario
- THEN precioUnitario = producto.precioVenta

### REQ-8: UI Edit Mode
Detail page MUST have an edit toggle that switches items between read-only and editable mode.

#### Scenario: Edit mode shows controls
- GIVEN venta detail page
- WHEN user clicks "Editar"
- THEN items show quantity inputs, remove buttons, add-item search
- AND "Guardar cambios" / "Cancelar" buttons appear

#### Scenario: Save changes
- WHEN user modifies items and clicks "Guardar cambios"
- THEN PATCH /api/ventas/[id]/items called
- AND page refreshes with updated data

#### Scenario: Cancel resets
- WHEN user clicks "Cancelar" after modifying
- THEN items revert to original state

### REQ-9: Append vs Edit Consistency
Adding items via the new PATCH endpoint MUST behave consistently with POST append (same stock validation, same price freezing convention).

#### Scenario: Consistent add behavior
- WHEN add operation via PATCH
- THEN same behavior as POST /api/ventas append (stock deducted, price frozen, same response shape)

## Validation
- `npm test`
- `npm run lint`
- `npx tsc --noEmit`
