# Design: Dashboard — Separar análisis completo a /analisis

## Technical Approach

Crear una nueva ruta `/analisis` con API y página dedicadas que muestren **todas** las estadísticas existentes (operacionales + analíticas). El dashboard en `/` se reduce a 3 cards resumen (Ventas Hoy, Total Recuperado, Total por Cobrar) + stock bajo + accesos directos. Las navegaciones desktop y mobile agregan enlace "Análisis".

Sigue el patrón existente: página client-side con `useEffect` → fetch → render con `StatCard`. Sin cambios de esquema ni librerías nuevas.

## Architecture Decisions

### API Split: `/api/analisis` con TODAS las queries vs solo analíticas

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| Analisis API con todas las queries | Duplicación de queries operacionales (clientesActivos, ventasPendientes, etc.) en ambos endpoints | ✅ Elegido |
| Analisis API solo queries analíticas | Analisis page necesitaría 2 fetches (dashboard + analisis) o composición del lado servidor | ❌ Rechazado |

**Por qué**: La page de análisis debe mostrar el panorama completo con una sola llamada. La duplicación es mínima (5 queries ligeras) y cada endpoint mantiene su contrato independiente.

### Nav: Orden de enlaces

**Decisión**: Insertar "Análisis" después de Ventas en Header y BottomNav. En BottomNav queda: Dashboard, Clientes, Productos, Ventas, Análisis — mismo orden lógico, el nuevo item al final.

**Alternativa**: Poner Análisis antes de Clientes. **Rechazado**: rompe el flujo natural de navegación.

### BottomNav: 5 items en mobile

**Decisión**: Reducir `min-w-[64px]` a `min-w-[56px]` para asegurar que 5 items quepan en viewports angostos (320px+). El `justify-around` existente distribuye el espacio uniformemente.

## Data Flow

```
[Browser]                    [Next.js Server]
    │                             │
    ├─ GET / ────────────────────→│  app/page.tsx
    │                             │  └─ fetch /api/dashboard
    │                             │      └─ Prisma (total por cobrar, ventas hoy,
    │                             │         total recuperado, stock bajo)
    │                             │  └─ Render: 3 StatCards + StockBajo + Links
    │                             │
    ├─ GET /analisis ────────────→│  app/analisis/page.tsx
    │                             │  └─ fetch /api/analisis
    │                             │      └─ Prisma (TODAS las queries:
    │                             │         operacionales + analíticas + deudores)
    │                             │  └─ Render: 9 StatCards + StockBajo + TopDeudores
    │                             │
    └─ /api/dashboard ───────────→│  Solo queries operacionales (4-5)
    └─ /api/analisis ────────────→│  Todas las queries (~10)
```

## File Changes

| File | Acción | Descripción |
|------|--------|-------------|
| `app/api/analisis/route.ts` | Crear | GET endpoint con TODAS las queries (copia del dashboard actual) |
| `app/analisis/page.tsx` | Crear | Client component, fetch `/api/analisis`, render ALL StatCards + StockBajo + TopDeudores |
| `app/api/dashboard/route.ts` | Modificar | Solo 3 queries: totalPorCobrar, ventasHoy, totalRecuperado + stockBajo |
| `app/page.tsx` | Modificar | 3 StatCards resumen (Ventas Hoy, Total Recuperado, Total por Cobrar) + StockBajo + Links |
| `components/Header.tsx` | Modificar | Agregar link "Análisis" con icono `BarChart3` después de Ventas |
| `components/BottomNav.tsx` | Modificar | Agregar item "Análisis" con icono `BarChart3`. Reducir `min-w-[64px]` a `min-w-[56px]` |

## Interfaces / Contracts

```typescript
// API /api/dashboard → DashboardData (summary — 3 cards)
interface DashboardData {
  totalPorCobrar: number
  ventasHoy: number
  totalRecuperado: number
  stockBajo: { nombre: string; cantidadStock: number }[]
}

// API /api/analisis → AnalisisData (all stats)
interface AnalisisData {
  clientesActivos: number
  ventasPendientes: number
  totalPorCobrar: number
  ventasHoy: number
  totalRecuperado: number
  recuperadoEsteMes: number
  ventasTotales: number
  pctRecuperacion: number
  clientesConDeuda: number
  topDeudores: { nombre: string; total: number }[]
  stockBajo: { nombre: string; cantidadStock: number }[]
}
```

## Testing Strategy

| Capa | Qué probar | Cómo |
|------|-----------|------|
| Unit | `StatCard` | Ya existe test en `__tests__/StatCard.test.tsx` — sin cambios |
| Integration | `GET /api/analisis` | Nuevo test en `__tests__/api/analisis.test.ts` — mock Prisma o test contra DB de prueba. Verificar que devuelve todos los campos del contrato |
| Integration | `GET /api/dashboard` | Modificar test existente o crear nuevo que verifique que NO devuelve campos analíticos |
| E2E | `/analisis` page render | Render con `@testing-library/react`, mock fetch, verificar que aparecen los 9 StatCards + títulos de sección |

## Migration / Rollout

No requiere migración de datos. Rollback: `git checkout` de los 6 archivos + `rm -rf app/analisis app/api/analisis`.

## Open Questions

- [ ] ¿El BottomNav con 5 items `min-w-[56px]` funciona en todos los móviles target? Verificar con Chrome DevTools en iPhone SE (320px).
