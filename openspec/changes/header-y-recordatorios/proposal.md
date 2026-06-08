# Proposal: Header y Recordatorios de Cobro

## Intent

Mejorar la experiencia del usuario en el header (dropdown con avatar y notificaciones) y agregar visibilidad de cobros pendientes vía un widget en el dashboard.

## Scope

### In Scope
**PR 1 — Header dropdown + notificaciones**
- Dropdown de usuario con avatar (inicial del email), email, y botón "Salir"
- Funcional en mobile (reemplaza texto oculto)
- Icono de campana (Bell) a la izquierda del dropdown (placeholder)

**PR 2 — Widget recordatorios de cobro**
- Endpoint `GET /api/cobros/pendientes`: devuelve clientes con saldo > 0, agrupados por cliente, ordenados por deuda más antigua
- Componente `CobrosPendientes.tsx`: card tipo widget (mismo patrón que stock bajo)
- Integración en dashboard (`app/page.tsx`)

### Out of Scope
- Sistema completo de notificaciones (badge, polling, WS) → futuro
- Página dedicada `/cobros` → futuro si hay volumen
- Campo `name` en User → no requerido (usamos inicial del email)
- Fecha de vencimiento en Venta → no requerido ahora

## Capabilities

### New Capabilities
- `user-dropdown`: Dropdown de usuario con avatar, email y cierre de sesión. Responsive.
- `notification-icon`: Icono de notificaciones en header (placeholder, sin lógica).
- `cobros-pendientes-widget`: Widget en dashboard con clientes con saldo pendiente.

### Modified Capabilities
- None (no hay specs preexistentes que modificar).

## Approach

**PR 1**: Reescribir la sección derecha de `Header.tsx`. Extraer lógica del dropdown a un subcomponente `UserDropdown` para claridad. Usar `useState` para toggle del menú. El avatar es un `div` circular con la inicial del email en mayúscula.

**PR 2**: Nuevo endpoint que consulta `Cliente` con `ventas` where `estado != 'pagada'` y `saldoPendiente > 0`, agrupa por cliente, ordena por `fecha` más antigua. Nuevo componente `CobrosPendientes` que fetchea y renderiza una card. Se inserta en el dashboard debajo de los stats.

## Affected Areas

| PR | Archivo | Cambio |
|----|---------|--------|
| 1 | `components/Header.tsx` | Modificar — dropdown + icono notif |
| 2 | `app/api/cobros/pendientes/route.ts` | Nuevo endpoint |
| 2 | `components/CobrosPendientes.tsx` | Nuevo componente |
| 2 | `app/page.tsx` | Modificar — agregar widget |

## Risks

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| Dropdown no funciona en mobile por eventos touch | Baja | Usar `onClick` estándar, testear en mobile viewport |
| Saldo 0 con estado no pagado | Baja | Where `saldoPendiente > 0` en query |
| Muchos clientes con deuda | Baja | Limitar a top 10 en el widget |

## Rollback Plan

Por PR:
- **PR 1**: Revertir cambios en `Header.tsx` (1 archivo, diff acotado).
- **PR 2**: Eliminar endpoint, componente, y referencia en dashboard.

## Dependencies

- Ninguna externa. Todo dentro del stack actual.

## Success Criteria

- [ ] Dropdown se abre/cierra al hacer clic en avatar
- [ ] Avatar muestra inicial correcta del email logueado
- [ ] "Salir" cierra sesión correctamente
- [ ] Icono campana visible y no rompe layout en mobile
- [ ] Widget de cobros pendientes muestra clientes con deuda
- [ ] Cada item linkea a `/clientes/[id]`
- [ ] `npm test` pasa sin errores
- [ ] `npm run build` compila sin errores
