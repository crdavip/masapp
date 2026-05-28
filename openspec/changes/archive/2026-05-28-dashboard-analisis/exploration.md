## Exploration: Dashboard — Separar indicadores analíticos

### Current State

The dashboard (`app/page.tsx`) is a single-page client component that fetches **all** data from `/api/dashboard` in one request and displays everything mixed together:

**9 StatCards** in a 3-column grid:
| Card | Type | Notes |
|------|------|-------|
| Clientes activos | **Operational** | Active client count |
| Ventas pendientes | **Operational** | Pending sales needing action |
| Total por cobrar | **Operational** | Outstanding to collect |
| Total recuperado | Analytical | Lifetime recovered |
| Recuperado este mes | Analytical | Current month recovered |
| % Recuperación | Analytical | Recovery rate |
| Ventas totales | Analytical | All-time sales |
| Ventas hoy | **Operational** | Today's pulse |
| Clientes con deuda | Analytical | Debtor count |

**2 additional sections:**
- **Stock bajo** (operational) — products with stock ≤ 5
- **Top 3 deudores** (analytical) — ranking by outstanding balance

**3 quick links** — Clientes, Productos, Ventas (navigation — keep on dashboard)

**Navigation:**
- `Header.tsx` (desktop): Logo + [Clientes, Productos, Ventas]
- `BottomNav.tsx` (mobile): [Dashboard(/), Clientes, Productos, Ventas]

**API:** Single `GET /api/dashboard` — runs 10 Prisma queries in parallel, assembles response.

**Routing:** Dashboard is at root `/` via `app/page.tsx`. An empty `app/dashboard/` directory exists but has no `page.tsx`. No `app/indicadores/` or `app/analisis/` exists.

### Name Recommendation

**"Indicadores"** — over "Análisis", "Estadísticas", or "Reportes":

| Name | Reasoning | Verdict |
|------|-----------|---------|
| Indicadores | Direct business term for KPIs — what these stats actually are. Widely understood in Colombian business context. Professional and precise. | ✅ **Recommended** |
| Análisis | Too broad — could imply data analysis features that don't exist yet. Creates expectations. | ❌ |
| Estadísticas | Feels like raw numbers/computation, not curated business indicators. | ❌ |
| Reportes | Implies downloadable/printable reports, not a screen you browse. | ❌ |

**Route:** `/indicadores` — clean, matches section name.

### Affected Areas

| File | What changes |
|------|-------------|
| `app/page.tsx` | Remove analytical StatCards + Top 3 deudores. Keep operational cards + Stock bajo + Ventas hoy + quick links. |
| `components/Header.tsx` | Add "Indicadores" link between existing links (desktop nav). |
| `components/BottomNav.tsx` | Add Indicadores tab (5 items total). Adjust layout if needed. |
| `app/indicadores/page.tsx` | **NEW** — Client component with SectionTitle + analytical StatCards + Top deudores. Reuses StatCard component. |
| `app/api/dashboard/route.ts` | Remove analytical queries (totalRecuperado, recuperadoEsteMes, ventasTotales, pctRecuperacion, ventasConSaldo/topDeudores). |
| `app/api/indicadores/route.ts` | **NEW** — API route with analytical queries only. |
| `__tests__/StatCard.test.tsx` | Already exists — no changes needed (component reuse). |
| `openspec/specs/` | Add `indicadores/` domain spec in archive step. |

### Approaches

1. **Approach A: Dedicated API + new page** — Create `/api/indicadores` with analytical queries, new `/indicadores` page, update nav. Dashboard API reduces scope.
   - **Pros**: Clean separation of concerns. Each page fetches only what it needs. Dashboard loads faster. API endpoints are single-responsibility.
   - **Cons**: Slightly more code. Two API calls if someone visits both pages (unlikely in same session).
   - **Effort**: Medium (3 files to create + 3 to modify)

2. **Approach B: Reuse dashboard API** — Keep monolithic API. New page calls same endpoint and filters client-side.
   - **Pros**: Fewer files changed. 0 new API routes.
   - **Cons**: Dashboard/Indicadores both fetch ALL data (wasteful). Coupled API. Harder to evolve independently. Wrong abstraction.
   - **Effort**: Low (2 files to create + 3 to modify)

### Recommendation

**Approach A** — dedicated API and page. 

The effort difference between A and B is minimal (one extra API route file), but the architectural benefit is significant. The dashboard API was already doing too much — this split is overdue. Each endpoint should serve one concern. Plus, the analytical queries (aggregations across all sales/abonos) are heavier than operational ones; keeping them separate means the dashboard stays fast.

### Risks

- **BottomNav at 5 items**: Mobile nav currently has 4 items with `justify-around`. Adding a 5th works but the labels are already small (10px). May need to reduce icon size or switch to `justify-between` with narrower items. Low risk.
- **Header real estate**: On desktop, adding a 4th nav link is fine — the Header currently has plenty of room. No risk.
- **TCS note**: The config says PostgreSQL, but the prompt says SQLite. Need to confirm which is the real DB — affects Prisma query differences (e.g., `aggregate` works in both, but timezone handling differs).
- **No existing tests for dashboard API**: The API route has no tests. Adding new endpoint is a good opportunity to start testing the API layer. Not a blocker, but worth noting.

### Ready for Proposal

**Yes** — the scope is clear, the split is well-understood, and the name "Indicadores" is validated. The proposal phase can proceed with exact file-by-file breakdown, API contract, and component tree.
