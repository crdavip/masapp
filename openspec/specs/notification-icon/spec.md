# Spec: Notification Icon

## Description

Icono de campana (Bell) en el header, ubicado a la izquierda del dropdown de usuario. Funciona como placeholder visual sin lógica de notificaciones activa.

## Requirements

### R1 — Icon placement
The Bell icon SHALL be placed immediately to the left of the user dropdown in the header.

### R2 — Visual appearance
The icon SHALL use the `Bell` icon from lucide-react, sized at 18px, with gray color matching the header's secondary text style.

### R3 — Non-interactive (placeholder)
The icon SHALL NOT have any click behavior, badge, or notification logic. It exists as a visual placeholder for future notification functionality.

### R4 — Mobile visibility
The icon SHALL remain visible on mobile viewports and MUST NOT break the header layout.

### R5 — Accessibility
The icon SHALL have `aria-label="Notificaciones"` for screen reader support.

## Scenarios

### Scenario 1: Desktop display
GIVEN the viewport is >= 768px
WHEN the header renders
THEN the Bell icon appears to the left of the user dropdown

### Scenario 2: Mobile display
GIVEN the viewport is < 768px
WHEN the header renders
THEN the Bell icon is visible and does not overlap with other elements
