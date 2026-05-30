# Specification: Agregar a Venta Existente

## Capability: venta-creation

**Purpose**: POST /api/ventas detects active sales and appends items instead of creating new rows. UI notifies on append.

### REQ-1: Active Sale Detection
POST /api/ventas MUST detect if `clienteId` has a Venta with estado IN ('pendiente','parcial').

#### Scenario: Found — append to oldest
- GIVEN client with >=1 Venta where estado is 'pendiente' or 'parcial'
- WHEN POST /api/ventas is called
- THEN items MUST append to the oldest active sale
- AND saldoPendiente MUST increase by new items' total
- AND no new Venta row created

#### Scenario: Not found — create new
- GIVEN client where all Ventas are 'pagada' or none exist
- WHEN POST /api/ventas is called
- THEN a new Venta MUST be created

### REQ-2: Stock Per Item
Stock MUST validate and decrement per-item whether appending or creating.

#### Scenario: Insufficient stock
- GIVEN active sale and product with stock = 1
- WHEN POST adds item with cantidad = 2
- THEN reject with error, no data modified

### REQ-3: Same Product Separate Rows
Multiple items with same productoId SHOULD be separate VentaItem rows.

#### Scenario: Duplicate productoId
- GIVEN POST with two items for productoId "X"
- WHEN processed against active sale
- THEN two separate VentaItem rows SHOULD reference the sale

### REQ-4: Consistent Response Shape
Endpoint MUST return same shape (id, cliente, items, abonos, total, saldoPendiente, estado) for append or create.

#### Scenario: Same shape
- GIVEN any valid POST
- WHEN response returned
- THEN status 201 with all standard Venta fields

### REQ-5: Frontend Notification
New-sale form SHOULD notify when items appended to existing sale.

#### Scenario: Toast on append
- GIVEN client with active sale selected
- WHEN POST returns as append
- THEN UI SHOULD show "Items agregados a venta existente"
- AND redirect to /ventas/{venta.id}

## Capability: venta-merge

**Purpose**: Migration script merging duplicate active sales into the oldest one.

### REQ-6: Detect Duplicates
Script MUST find clients with >1 Venta where estado IN ('pendiente','parcial').

#### Scenario: Detection
- GIVEN client A with 3 active ventas, client B with 1
- WHEN script runs
- THEN only client A in merge set

### REQ-7: Merge into Oldest
For each client, merge all active sales into the oldest (by fecha).

#### Scenario: Survivor selection
- GIVEN client with sales: Jan 1 and Jan 15
- WHEN merged
- THEN Jan 1 is survivor, Jan 15 deleted

### REQ-8: Move Items and Abonos
VentaItems and Abonos from non-survivors MUST re-associate to survivor.

#### Scenario: Data moved
- GIVEN non-survivor with 3 items, 2 abonos
- WHEN script runs
- THEN all 3 items and 2 abonos reference survivor ventaId

### REQ-9: Recalculate Totals and Estado
Survivor total MUST be sum of all item subtotals. Estado: sumAbonos >= total -> 'pagada', >0 -> 'parcial', else 'pendiente'.

#### Scenario: Recalculation
- GIVEN survivor (total:100, 1 abono:20) + non-survivor (total:50)
- WHEN merged
- THEN total=150, saldoPendiente=130, estado='parcial'

### REQ-10: Delete Non-Survivors
Non-survivor sales MUST be deleted after data moved.

#### Scenario: Cleanup
- GIVEN non-survivor with all data moved
- WHEN script finishes for client
- THEN non-survivor Venta row deleted

### REQ-11: Transactional Atomicity
Script MUST run within Prisma $transaction per client.

#### Scenario: Rollback
- GIVEN error mid-merge
- WHEN $transaction aborts
- THEN no data for that client modified

### REQ-12: Summary Output
Script MUST print client name, sales merged, items moved, abonos moved.

### REQ-13: Idempotent
Script MUST be safe to run multiple times.

#### Scenario: Second run
- GIVEN database already merged
- WHEN script runs again
- THEN prints "No duplicates found" and exits cleanly
