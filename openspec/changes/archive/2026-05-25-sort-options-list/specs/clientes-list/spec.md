# Spec: Sort Controls — Clientes List

## Purpose

Adds client-side sort to the `/clientes` page. Currently renders cards in API order with a search filter. This spec adds sort controls for 2 fields, applied AFTER the search filter.

## ADDED Requirements

### Requirement: Clients sortable by 2 fields

The Clientes page MUST sort its `filtered` array via `useMemo`. Sortable fields: `nombre` (string), `createdAt` (date). Default: `createdAt` desc. Filtering MUST happen before sorting — `filtered` is the intermediate result.

#### Scenario: Sort filtered clients by name

- GIVEN clientes page with search "mar" active
- WHEN user sorts by nombre ascending
- THEN only matching clients appear, ordered A–Z

#### Scenario: Default sort by creation date

- GIVEN clientes page with no sort selection
- WHEN page loads
- THEN clients ordered by createdAt descending (most recent first)

#### Scenario: Sort with no active filter

- GIVEN clientes page with empty search
- WHEN user sorts by nombre descending
- THEN all clients ordered Z–A

### Requirement: Sort controls placement

The SortControls MUST render below the search input, separated by `mb-4` spacing, matching the search bar's layout width.
