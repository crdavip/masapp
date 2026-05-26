# Design: Client-Side Sort Controls for List Pages

## Technical Approach

Add a generic `sortData()` utility and a reusable `<SortControls>` component. Three list pages (productos, clientes, ventas) wire them in — each adds two state variables (`sortField`, `sortDir`) and a `useMemo` that sorts the displayed array. No API or data-fetching changes.

## Architecture Decisions

| Decision | Options | Tradeoff | Chosen |
|---|---|---|---|
| Sort field type enum | `'string'\|'number'\|'date'` vs runtime inference | Inference adds complexity for edge cases (nulls, string-prices) | Explicit `SortType` — caller knows the data shape |
| Dot-path access | Split & reduce vs `_.get()` vs eval | Lodash adds dep; eval is dangerous | `key.split('.').reduce((o, k) => o?.[k], item)` — zero deps, safe |
| Estado sort order | Custom map vs alphabetical | Alphabetical = pagada < parcial < pendiente (wrong business sense) | `{pendiente:0, parcial:1, pagada:2}` map — matches business workflow |
| When to hide controls | `length ≤ 1` vs `length < 2` | 0 or 1 items makes sort meaningless | Hide when `array.length ≤ 1` |
| Immutability | `[...data].sort()` vs `data.toSorted()` | `toSorted()` is ES2023 (may need polyfill) | `[...data].sort(compareFn)` — safe, no polyfill needed |

## Component Tree & Data Flow

```
Page (fetch) → raw array → [filter] → [sorted via useMemo] → cards
                                     ↕
                              <SortControls>
                                field + direction state
```

- **Fetch phase**: unchanged — `useEffect` fetches into state
- **Filter phase**: existing search logic (clientes, ventas) — unchanged
- **Sort phase**: `useMemo([...displayList].sort(...), [displayList, sortField, sortDir])`
- **Render phase**: `sortField`/`sortDir` state → `<SortControls>` + sorted list → cards

Productos skips the filter phase (no search input) — sorts `productos` directly.

## File Changes

| File | Action | Description |
|---|---|---|
| `lib/sort.ts` | Create | Generic `sortData<T>()` with dot-path access, null-safety, custom estado order |
| `components/SortControls.tsx` | Create | Field `<select>` + direction toggle, hidden when ≤1 item, matching existing styles |
| `app/productos/page.tsx` | Modify | Add sort state + `useMemo` + render `<SortControls>` after title bar |
| `app/clientes/page.tsx` | Modify | Add sort state + `useMemo` after filter + render `<SortControls>` after search |
| `app/ventas/page.tsx` | Modify | Add sort state + `useMemo` after filter + render `<SortControls>` after search |

## Interfaces

```ts
// lib/sort.ts
type SortType = 'string' | 'number' | 'date'

function sortData<T>(
  data: T[],
  field: string,            // key or dot-path e.g. "cliente.nombre"
  direction: 'asc' | 'desc',
  type: SortType,
): T[]

// components/SortControls.tsx
type SortOption = { label: string; value: string; type: SortType }

type SortControlsProps = {
  options: SortOption[]
  field: string
  direction: 'asc' | 'desc'
  onChange: (field: string, direction: 'asc' | 'desc') => void
}
```

### Estado sort map (internal to sortData)

```ts
const ESTADO_ORDER: Record<string, number> = {
  pendiente: 0,
  parcial:   1,
  pagada:    2,
}
```

When `field === 'estado'` and both values are in the map, compare by map index. Unknown values sort last.

## States per Component

| Component | States |
|---|---|
| `sortData` | Normal, empty array (returns `[]`), null/undefined values (sorted to end) |
| `SortControls` | Visible (data.length > 1), Hidden (data.length ≤ 1) |
| Each page | Existing (loading, error, empty) unchanged — sort applied transparently |

## Test Strategy

| Layer | What | How |
|---|---|---|
| Unit — sortData | String, number, date sorting; dot-path; null safety; empty array; estado order | Pure function tests with vitest |
| Unit — SortControls | Renders options, fires onChange on select/click, hidden when ≤1 items | @testing-library/react + jsdom |
| Integration | Pages render sorted data (snapshot or DOM assertions) | Omitted for now — config shows no integration tooling available |

## Migration / Rollout

No migration required. Pure client-side addition — existing data untouched.

## Open Questions

None.
