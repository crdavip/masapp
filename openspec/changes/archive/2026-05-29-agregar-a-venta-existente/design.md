# Design: Agregar items a venta existente

## Technical Approach

Modificar `POST /api/ventas` para detectar si el cliente ya tiene una venta activa (`pendiente`/`parcial`) y, en vez de crear un registro nuevo, anexar los items a esa venta existente dentro de la misma transacción. El frontend recibe un flag `appended` y muestra un toast informativo. Script independiente para migrar duplicados históricos (REQ-6 a REQ-13).

## Architecture Decisions

### Decision 1: Append detection dentro del POST

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| Nuevo endpoint `clientes/[id]/ventas-activas` + POST condicional | Dos requests, complejidad extra de estado en frontend | ❌ |
| `findFirst` inline dentro del `$transaction` | Simple, una request, mismo patrón existente | ✅ |

**Rationale**: El spec (REQ-1) y el código actual ya usan `$transaction`. Añadir un `findFirst` al inicio de la transacción es el cambio mínimo y evita un endpoint nuevo. La detection es atómica por la transacción.

### Decision 2: Señal de append en response

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| Campo `appended: boolean` en JSON | Mínimo, no rompe response shape | ✅ |
| Comparar timestamps en frontend | Frágil, requiere lógica extra | ❌ |

**Rationale**: REQ-4 exige misma forma de response. Añadir `appended` es aditivo — el frontend existente ignora campos desconocidos.

### Decision 3: Estado tras append

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| Recalcular estado como en abonos | Innecesario — append aumenta deuda | ❌ |
| Mantener estado actual | No cambia la semántica de deuda vs pagos | ✅ |

**Rationale**: Agregar items NUNCA reduce la deuda. Si era `parcial` sigue siéndolo (siguen existiendo abonos, ahora proporcionalmente menores). Si era `pendiente` sigue `pendiente`. Estado solo transiciona via abonos (misma lógica en `POST /api/abonos`).

### Decision 4: Survivor = más antigua (merge script)

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| Más antigua (min fecha) | Coherente con propuesta, preserva historial original | ✅ |
| Más items o más abonos | Subjetivo, complejidad extra | ❌ |

**Rationale**: La venta más antigua es la deuda original. Mover items/abonos a ella preserva la cronología real.

## Data Flow

```
POST /api/ventas { clienteId, items }
       │
       ▼
  ┌─ $transaction ──────────────────────────┐
  │                                          │
  │  findFirst Venta WHERE                   │
  │    clienteId AND estado IN (parcial,pend)│
  │       │                                  │
  │   ¿Existe? ── sí ──► venta = existing    │
  │       │ no              │                │
  │       ▼                 ▼                │
  │  create Venta     append items:          │
  │  (flow actual)    create VentaItem[]     │
  │                     │                    │
  │                     ▼                    │
  │             update Venta:                │
  │               total += ∑subtotals        │
  │               saldoPendiente += ∑subt    │
  │                                          │
  │  stock per item: validate + decrement    │
  │                                          │
  └──────────────────────────────────────────┘
       │
       ▼
  Response: { ...venta, appended: bool }
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `app/api/ventas/route.ts` | Modify | Añadir `findFirst` de venta activa; bifurcar create vs append |
| `app/ventas/nueva/page.tsx` | Modify | Leer `venta.appended`, mostrar toast, redirect a `/ventas/${id}` |
| `scripts/merge-ventas-duplicadas.ts` | Create | Migración one-shot de duplicados históricos |

## Interfaces / Contracts

```typescript
// Response shape (POST /api/ventas) — same as now + appended flag
type CreateVentaResponse = VentaWithIncludes & {
  appended: boolean
}

// Contract: si appended=true, no se creó nueva fila Venta
// sino que se anexaron items a la existente.
```

Estado append: mantener el `estado` actual de la venta existente sin recalcular. La lógica de transición (`pagada`/`parcial`/`pendiente`) es exclusiva de abonos.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Lógica de detection + append | Mockear `findFirst`, verificar `ventaItem.create` vs `venta.create` |
| Integration | POST endpoint completo | Request real con transacciones, verificar saldoPendiente y `appended` |
| Integration | Merge script | Base con duplicados, verificar survivor, totals, cleanup |
| E2E | Frontend toast + redirect | Playwright: submit con cliente con venta activa, ver toast y URL |

## Migration / Rollout

- Script `scripts/merge-ventas-duplicadas.ts`: ejecutar con `npx tsx scripts/merge-ventas-duplicadas.ts` ANTES del deploy del backend modificado.
- El script es idempotente (REQ-13). Si ya se ejecutó, "No duplicates found".
- No requiere feature flag. El cambio en POST es compatible hacia atrás: si no hay venta activa, el comportamiento es idéntico al actual.

## Open Questions

- [ ] ¿Usar `appended` o un header HTTP? (decidido: campo JSON por simplicidad frontend)
- [ ] ¿Toast de qué librería? El proyecto no tiene toast library — implementar con state local + CSS (ya existe patrón de error banner) o añadir `react-hot-toast` / `sonner`
