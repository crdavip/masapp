# Propuesta: Agregar items a venta existente

## Intención

Cada "Nueva venta" crea un registro independiente aunque el cliente ya tenga una venta activa. Esto acumula mini-ventas innecesarias. Los items nuevos deben sumarse a la deuda vigente más antigua. Además, hay duplicados históricos que requieren una migración única.

## Alcance

### Incluye
- Modificar `POST /api/ventas` para detectar venta activa del cliente y agregar items allí
- Notificación en UI cuando se anexe
- Script `scripts/merge-duplicate-ventas.ts` para fusionar duplicados

### Excluye
- Cambios en modelo de datos
- Modificar lógica de abonos o stock
- UI para elegir a qué venta agregar

## Capacidades

### Nuevas
- `venta-creation`: Creación con detección y anexo a venta activa
- `venta-merge`: Migración única de fusión de duplicados

### Modificadas
Ninguna

## Enfoque

**POST /api/ventas**: Dentro de la transacción, buscar venta activa del cliente (estado IN `pendiente`,`parcial`, más antigua primero). Si existe, agregar items y actualizar total + saldoPendiente. Si no, crear nueva (flow actual).

**Frontend**: Al seleccionar cliente, verificar venta activa vía nuevo endpoint y mostrar callout.

**Migración**: Por cada cliente con múltiples ventas activas: survivor = más antigua, mover items y abonos, recalcular total/saldo/estado, eliminar huérfanas.

## Areas afectadas

| Area | Impacto |
|------|---------|
| `app/api/ventas/route.ts` | Modificado |
| `app/ventas/nueva/page.tsx` | Modificado |
| `app/api/clientes/[id]/ventas-activas/route.ts` | Nuevo |
| `scripts/merge-duplicate-ventas.ts` | Nuevo |

## Riesgos

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| Precios congelados distintos | Alta | Usar precioUnitario individual |
| Race condition en POST simultáneos | Baja | Todo en transacción Prisma |

## Rollback

Backend: revertir commit. Migración: backup de tablas antes de ejecutar.

## Criterios de éxito

- [ ] Items se agregan a venta activa existente, no a una nueva
- [ ] UI notifica cuando se anexa
- [ ] Script fusiona todos los duplicados sin errores
