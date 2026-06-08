# Spec: Cliente Ubicación

## Purpose

Store geographic address and coordinates per cliente; view and edit location on an interactive map with geocoding.

## Requirements

### Requirement: Address & coordinates on Cliente

The system MUST store `direccion` (text, required), `latitud` (float, optional), `longitud` (float, optional) for each cliente.

#### Scenario: Full location creation

- GIVEN a create request with all three fields
- WHEN submitted
- THEN values are persisted

#### Scenario: Coordinates optional

- GIVEN a create request with `direccion` only
- WHEN submitted
- THEN `latitud`/`longitud` are NULL

#### Scenario: Missing direccion

- GIVEN a create request without `direccion`
- WHEN submitted
- THEN API returns 422 and cliente is NOT created

### Requirement: Interactive map on detail page

The detail page MUST display a map with a marker at saved coordinates. If coordinates are NULL, center on Colombia (~4.57, -74.30) without a marker.

#### Scenario: Coordinates present

- GIVEN a cliente with lat/lng
- WHEN detail page renders
- THEN marker is at saved coordinates

#### Scenario: No coordinates

- GIVEN a cliente with NULL lat/lng
- WHEN detail page renders
- THEN map centers on Colombia with no marker

### Requirement: Location editing with geocoding

Create/edit forms MUST provide: (a) direccion text field with forward geocoding, (b) draggable marker that updates lat/lng, (c) reverse geocoding on marker drag.

#### Scenario: Address search places marker

- GIVEN create/edit form with map visible
- WHEN user types an address and triggers search
- THEN marker moves to geocoded coordinates AND lat/lng update

#### Scenario: Drag marker reverse-geocodes

- GIVEN saved coordinates with visible marker
- WHEN user drags marker
- THEN lat/lng update AND direccion fills from reverse geocoding

#### Scenario: Geocoding failure

- GIVEN geocoding service is unavailable
- WHEN user drags marker
- THEN lat/lng update AND direccion remains unchanged

### Requirement: Geocoding rate limit

The system SHOULD debounce Nominatim requests with a minimum 1-second interval.

#### Scenario: Rapid typing

- GIVEN user types 3 characters <1s apart
- WHEN each triggers a search
- THEN only the last request reaches Nominatim

### Requirement: Address preview in list

The list page SHOULD show direccion truncated to 50 characters with ellipsis.

#### Scenario: Long address

- GIVEN a cliente with a 70-char direccion
- WHEN list page renders
- THEN display shows first 50 chars + "..."

### Requirement: SSR safety

The map component MUST use dynamic import with `{ ssr: false }`.

#### Scenario: Server render

- GIVEN a server request for the detail page
- WHEN the component tree renders
- THEN Leaflet code is NOT executed; a placeholder renders instead
