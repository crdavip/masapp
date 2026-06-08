# Spec: User Dropdown

## Description

Dropdown de usuario en el header con avatar circular (inicial del email), email, y opción de cerrar sesión. Funcional en desktop y mobile.

## Requirements

### R1 — Avatar con inicial
The system SHALL display a circular avatar showing the first character of the user's email, uppercased, as a fallback when no `name` field exists.

### R2 — Dropdown toggle
The dropdown SHALL open on click of the avatar area and close on:
- Click outside the dropdown
- Click on "Salir"
- Click on the avatar again (toggle)

### R3 — User info display
The dropdown SHALL display:
- The user's email address
- The avatar with the initial

### R4 — Logout action
The dropdown SHALL include a "Salir" button that calls `signOut()` from next-auth/react.

### R5 — Mobile responsive
The dropdown SHALL work on mobile viewports (< 768px). The previous email text (hidden on mobile) is replaced by the dropdown which works on all sizes.

### R6 — Open/close on same click
Clicking the avatar when the dropdown is open SHALL close it.

## Scenarios

### Scenario 1: Open and see user info
GIVEN the user is authenticated
WHEN they click the avatar in the header
THEN a dropdown appears showing the avatar, email, and "Salir" button

### Scenario 2: Close by clicking outside
GIVEN the dropdown is open
WHEN the user clicks outside the dropdown
THEN the dropdown closes

### Scenario 3: Logout
GIVEN the dropdown is open
WHEN the user clicks "Salir"
THEN `signOut()` is called and the session ends

### Scenario 4: Mobile viewport
GIVEN the viewport is < 768px
WHEN the user clicks the avatar
THEN the dropdown appears with the same content as desktop

## Edge Cases

- **No email in session**: If session.user.email is undefined, show "?" as avatar initial (should not happen in normal flow).
- **Rapid double-click**: Toggle behavior prevents issues — second click closes.
