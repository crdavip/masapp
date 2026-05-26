# Spec: Sort Controls — Shared Infrastructure

## Purpose

Provides reusable client-side sorting for list pages. A generic `sortBy` utility handles string, number, and date comparison. A `SortControls` component renders the field dropdown and direction toggle with existing UI styling.

## ADDED Requirements

### Requirement: Generic sortBy utility

The system MUST provide a `sortBy<T>(items, key, direction)` function that sorts arrays by a specified key, handling:
- **string**: case-insensitive locale comparison
- **number**: numeric comparison (including Decimal strings like `'15000'`)
- **date**: ISO 8601 string comparison

(Previously: none — new capability)

#### Scenario: Sort strings case-insensitively

- GIVEN `[{nombre:'Zeta'},{nombre:'álfa'}]`
- WHEN sorting ascending by `nombre`
- THEN order is álfa → Zeta

#### Scenario: Sort Decimal strings as numbers

- GIVEN items with `precioVenta: '8000'` and `'15000'`
- WHEN sorting ascending by `precioVenta`
- THEN `8000` precedes `15000`

#### Scenario: Safe on empty array

- GIVEN an empty array
- WHEN sorting by any key
- THEN returns empty array (no error)

### Requirement: SortControls component

The system MUST provide a `SortControls` component rendering a `<select>` for sortable fields and a direction toggle button. Styling MUST match existing inputs: `border border-gray-300 rounded-lg text-sm`. The toggle MUST cycle asc → desc → asc and show current direction via ArrowUpDown icon.

#### Scenario: Select sort field

- GIVEN SortControls with field options
- WHEN user selects a field from dropdown
- THEN the onChange callback fires with `{field, direction}`

#### Scenario: Toggle direction

- GIVEN SortControls with active field
- WHEN user clicks direction toggle
- THEN direction flips and onChange fires with updated direction

#### Scenario: Mobile responsive

- GIVEN a viewport < 640px
- WHEN SortControls renders
- THEN dropdown spans available width; toggle button is right-aligned
