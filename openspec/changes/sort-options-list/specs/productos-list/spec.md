# Spec: Sort Controls — Productos List

## Purpose

Adds client-side sort to the `/productos` page. Currently renders cards in API order (creation date desc). This spec adds sort controls for 5 fields.

## ADDED Requirements

### Requirement: Products sortable by 5 fields

The Productos page MUST sort its `productos` array via `useMemo`, keyed by `[sortField, sortDirection]`. Sortable fields: `nombre` (string), `precioVenta` (number), `precioCompra` (number), `cantidadStock` (number), `createdAt` (date). Default: `createdAt` desc.

#### Scenario: Sort by stock ascending

- GIVEN productos page with stock levels 2, 10, 5
- WHEN user selects "Stock" sort ascending
- THEN cards render in order 2 → 5 → 10

#### Scenario: Sort by name descending

- GIVEN productos with names A, B, C
- WHEN user selects "Nombre" sort descending
- THEN cards render Z → A

#### Scenario: After creating new product

- GIVEN products sorted by createdAt desc (default)
- WHEN user creates a new product
- THEN new product appears first (most recent)

### Requirement: Sort controls placement

The SortControls MUST render below the header row (`<h1>` + "Nuevo" button), inside the PageLayout, using a single row layout with flex-wrap.
