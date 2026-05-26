# Tasks: Client-Side Sort Controls for List Pages

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~300 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

## Phase 1: Sort Utility — `lib/sort.ts`

- [x] 1.1 RED: Write failing tests in `__tests__/lib/sort.test.ts` — empty array, strings (localeCompare es), numbers (Decimal string coercion), dates (ISO parsing), null/undefined sort-to-end, estado custom order, dot-path access ("cliente.nombre")
- [x] 1.2 GREEN: Implement `lib/sort.ts` — `SortType`, `sortData<T>()` with dot-path via `split('.').reduce()`, ESTADO_ORDER map, localeCompare('es'), Number() coercion, new Date() parsing, `[...data].sort()`
- [x] 1.3 REFACTOR: Verify `npm test` passes for sort tests, clean up edge cases

## Phase 2: SortControls Component — `components/SortControls.tsx`

- [x] 2.1 RED: Write failing tests in `__tests__/components/SortControls.test.tsx` — renders select options, fires onChange on field select, fires onChange on direction toggle, hidden when data length ≤ 1, responsive < 640px layout
- [x] 2.2 GREEN: Implement `SortControls.tsx` — `<select>` with SortOption labels/values, direction toggle button with `ArrowUpDown` Lucide icon cycling asc→desc→asc, conditional render `displayCount > 1`, styles matching `border-gray-300 rounded-lg text-sm px-3 py-2`
- [x] 2.3 REFACTOR: Verify `npm test` passes for SortControls tests, align Tailwind classes with existing inputs pattern

## Phase 3: Integrate Sort on Productos Page

- [x] 3.1 Add `sortField`/`sortDir` useState (default: `'createdAt'`/`'desc'`), import `useMemo`, `sortData`, `SortControls`
- [x] 3.2 Add `useMemo` sorted list from `productos`, render `<SortControls>` below the header row (after `mb-4` flex div), use sorted array for card `.map()`

## Phase 4: Integrate Sort on Clientes Page

- [x] 4.1 Add `sortField`/`sortDir` useState (default: `'createdAt'`/`'desc'`), import `sortData`, `SortControls`
- [x] 4.2 Add `useMemo` sorted list from `filtered`, render `<SortControls>` below search input, use sorted array for card `.map()` — pipeline: fetch → filter → sort → render

## Phase 5: Integrate Sort on Ventas Page

- [x] 5.1 Add `sortField`/`sortDir` useState (default: `'fecha'`/`'desc'`), import `sortData`, `SortControls`
- [x] 5.2 Add `useMemo` sorted list from `filtered`, render `<SortControls>` below search input, use sorted array for card `.map()` — pipeline: fetch → filter → sort → render
