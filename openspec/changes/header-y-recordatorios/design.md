# Design: Header y Recordatorios de Cobro

## PR 1 — Header Dropdown + Notificaciones

### Component Tree

```
Header (component)
├── Nav links (izquierda)
├── Right section (derecha)
│   ├── BellIcon (placeholder)
│   └── UserDropdown (nuevo)
│       ├── Avatar (div circular con inicial)
│       ├── Email
│       └── LogoutButton → signOut()
```

### Data Flow

- **UserDropdown** usa `useSession()` de next-auth/react para obtener `session.user.email`.
- No hay fetching adicional. Todo es state local (useState para open/close).
- `signOut()` es llamado directamente desde el onClick del botón "Salir".

### State

| State | Tipo | Descripción |
|-------|------|-------------|
| `open` | `boolean` | Toggle del dropdown (useState) |

### Event Flow

```
Click avatar → setOpen(!open)
Click "Salir" → signOut()
Click outside → setOpen(false) [via useRef + useEffect con mousedown]
```

### Styling

- Avatar: `w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-sm font-bold`
- Dropdown: `absolute right-0 top-full mt-2 bg-white border rounded-xl shadow-lg p-3 min-w-[200px] z-50`
- Mobile: mismo componente, no hay hidden classes. El dropdown funciona igual en todos los viewports.

### Mobile Strategy

El header actual oculta el email en mobile (`hidden sm:inline`). Con el dropdown:
- El avatar y la campana son visibles en todos los tamaños
- El menú dropdown se abre igual en mobile (click, no hover)
- No hay cambios en BottomNav

## PR 2 — Widget Cobros Pendientes

### API Design

**`GET /api/cobros/pendientes`**

```typescript
// Response
interface CobroPendiente {
  clienteId: string
  nombre: string
  telefono: string | null
  totalPendiente: number
  ventaMasAntigua: string | null  // ISO date
  ventasCount: number
}
```

### Component Tree

```
DashboardPage (app/page.tsx)
├── StatCards (existentes)
├── CobrosPendientes (nuevo)
│   └── ClienteRow → Link a /clientes/[id]
├── StockBajo (existente)
└── QuickLinks (existentes)
```

### Data Flow

```
DashboardPage mount
  → CobrosPendientes mount
    → fetch /api/cobros/pendientes
    → setState(data | error | loading)
    → render
```

### State (local en componente)

| State | Tipo | Descripción |
|-------|------|-------------|
| `data` | `CobroPendiente[] \| null` | Datos del endpoint |
| `error` | `boolean` | Error flag |

### DB Query

```sql
-- Prisma equivalente
prisma.cliente.findMany({
  where: {
    ventas: {
      some: {
        estado: { not: 'pagada' },
        saldoPendiente: { gt: 0 }
      }
    }
  },
  select: {
    id: true,
    nombre: true,
    telefono: true,
    ventas: {
      where: { estado: { not: 'pagada' }, saldoPendiente: { gt: 0 } },
      select: { total: true, saldoPendiente: true, fecha: true },
      orderBy: { fecha: 'asc' }
    }
  }
})
// Post-process: map, reduce saldos, sort by fecha, limit 10
```

### Error/Loading/Empty

| State | UI |
|-------|-----|
| Loading | Texto "Cargando..." o skeleton |
| Error | "Error al cargar pendientes" (no bloqueante) |
| Empty (data=[]) | "No hay cobros pendientes" con icono |
| Data | Lista de clientes con sus montos |
