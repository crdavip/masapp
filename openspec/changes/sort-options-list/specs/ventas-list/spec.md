# Spec: Sort Controls — Ventas List

## Purpose

Adds client-side sort to the `/ventas` page. Currently renders cards in API order with a client-name search filter. This spec adds sort controls for 5 fields, applied AFTER the search filter.

## ADDED Requirements

### Requirement: Sales sortable by 5 fields

The Ventas page MUST sort its `filtered` array via `useMemo`. Sortable fields: `fecha` (date), `cliente.nombre` (nested string), `total` (number), `saldoPendiente` (number), `estado` (string). Default: `fecha` desc (most recent first).

#### Scenario: Sort sales by total ascending

- GIVEN ventas page with varied totals
- WHEN user selects "Total" sort ascending
- THEN sales ordered smallest total first

#### Scenario: Sort sales by estado

- GIVEN ventas with estados pagada, parcial, pendiente
- WHEN user sorts by estado ascending
- THEN sales ordered alphabetically: pagada → parcial → pendiente

#### Scenario: Sort with active search filter

- GIVEN ventas page with client name search active
- WHEN user sorts by fecha ascending
- THEN only matching sales appear, earliest first

### Requirement: Sort controls placement

The SortControls MUST render below the search input, using the same `mb-4` spacing pattern as clientes.
