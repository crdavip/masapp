# Tasks: Header y Recordatorios de Cobro

## PR 1 — Header Dropdown + Notificaciones

### 1.1 Create UserDropdown component
- Extract dropdown logic from Header into `components/UserDropdown.tsx`
- Uses `useSession()` for email
- Avatar: first char of email, uppercased, in a blue circle
- Click toggle, click-outside-to-close via ref + mousedown listener
- "Salir" button calls `signOut()`

**Files**: `components/UserDropdown.tsx` (NEW)

### 1.2 Update Header with Bell icon + UserDropdown
- Replace the right section of Header.tsx:
  - Remove `<span>{email}</span>` and `<button>LogOut</button>`
  - Add `Bell` icon from lucide-react with `aria-label="Notificaciones"`
  - Add `<UserDropdown />`
- Ensure mobile layout is clean

**Files**: `components/Header.tsx` (MODIFY)

## PR 2 — Widget Cobros Pendientes

### 2.1 Create API endpoint
- New file `app/api/cobros/pendientes/route.ts`
- `GET` handler that queries Prisma:
  - `Cliente.findMany` where ventas have `estado != 'pagada'` AND `saldoPendiente > 0`
  - Select: id, nombre, telefono, ventas (id, total, saldoPendiente, fecha)
  - Order ventas by fecha asc
  - Post-process: sum saldoPendiente per client, find oldest venta, sort by oldest date
  - Limit to 10
- Handle Decimal → Number conversion

**Files**: `app/api/cobros/pendientes/route.ts` (NEW)

### 2.2 Create CobrosPendientes component
- New file `components/CobrosPendientes.tsx`
- Fetch from `/api/cobros/pendientes` on mount
- States: loading, error, data, empty
- Card with title "Pendientes de cobro" and DollarSign icon
- List clientes with nombre, totalPendiente (formatCOP), fecha oldest
- Each row links to `/clientes/[id]`
- Empty state: "No hay cobros pendientes"

**Files**: `components/CobrosPendientes.tsx` (NEW)

### 2.3 Integrate in Dashboard
- Import `CobrosPendientes` in `app/page.tsx`
- Add `<CobrosPendientes />` below the stats grid

**Files**: `app/page.tsx` (MODIFY)
