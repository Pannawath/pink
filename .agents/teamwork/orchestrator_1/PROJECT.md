# Project: Pink Mobile Layered Glass Bottom Sheet

## Architecture
- Technology Stack: Vanilla HTML5, CSS3, Tailwind CSS CDN, Three.js r128 OrbitControls.
- Root Scroll Container: `<main>` in `index.html` with `overflow-y: auto !important; height: calc(100vh - 100px) !important;`.
- Floating Header: `header` fixed at `top: 0` with `min-height: 70px`, `.apple-glass-nav`.
- Stage Column: Left column containing view switcher `.apple-segmented-control` and `.jersey-stage-container` (#jerseyCardWrapper, SVG preview layers, #jersey3DCanvas).
- Configurator Card: Right column containing `.apple-glass-card`, email lookup, and interactive form fields.
- Mobile Layout Mechanism (< 1024px):
  - Shared containing block: `@media (max-width: 1023px) { .grid.lg\:grid-cols-12 { display: flex; flex-direction: column; gap: 0; } }`.
  - Sticky stage anchor: Left stage column pinned at `position: sticky; top: 70px; z-index: 10;`.
  - 50% Overlap anchor: `.apple-glass-card` floats at `position: sticky; top: calc(70px + 200px); z-index: 20;`.
  - Glass Pull Handle: `.mobile-sheet-handle` capsule pill centered at top of `.apple-glass-card`, hidden on desktop (`>= 1024px`).
  - Internal form scrolling: `.apple-glass-card { max-height: calc(100vh - 270px); max-height: calc(100dvh - 270px); overflow-y: auto; touch-action: pan-y; }`.
  - 3D Touch Routing: Canvas `#jersey3DCanvas` retains `touch-action: none` in exposed top 50% region with full OrbitControls rotation.
- Desktop Layout Shield (>= 1024px):
  - Strictly side-by-side 2-column grid (`display: grid !important;`).
  - Pull handle hidden (`display: none !important;`).
  - Card static position (`position: static !important; max-height: none !important; overflow-y: visible !important;`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Mobile Sticky Stage Anchor | Jersey stage sticks smoothly near top below header (`top: 70px`) on `< 1024px` | M1 | ORIGINAL_REQUEST §R1 |
| 2 | 50% Overlap Interaction | Configurator card floats over stage by ~50%, keeping top half of jersey visible and interactive | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Apple Glass Pull Handle | Translucent glass pull handle pill (`.mobile-sheet-handle`) at top of card on mobile viewports | M1 | ORIGINAL_REQUEST §R2 |
| 4 | Form Scroll & Touch Interactivity | Form inside card is scrollable, inputs accessible, 3D OrbitControls interactive in exposed top half | M1 | ORIGINAL_REQUEST §R3 |
| 5 | Zero Desktop Regressions | Desktop layout (>= 1024px) remains 100% untouched as side-by-side 2-column grid | M1 | ORIGINAL_REQUEST §R4 |
| 6 | E2E Opaque-Box Test Suite | Comprehensive multi-tier test suite covering mobile sticky overlap, handle, touch, and desktop grid | M2 | Dual Track E2E |
| 7 | Gatekeeper Invariant Compliance | Passes `gk_gatekeeper_scan` with zero violations, CC <= 7, span <= 50, zero emojis | M2 | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Mobile Sticky Stage & Glass Sheet Implementation | Implement sticky stage at `top: 70px`, 50% overlap anchor, `.mobile-sheet-handle`, form scrolling, and desktop shield in `index.html` and `css/style.css` | Survey | DONE (Worker M1, Gate PASS) |
| 2 | E2E Testing, Adversarial Verification & Gatekeeper Scan | Author E2E test suite (`TEST_READY.md`), verify mobile/desktop behavior, run `gk_gatekeeper_scan`, zero emojis check | M1 | DONE (54/54 E2E + 26/26 stress pass) |

## Interface Contracts
### Mobile Grid Container ↔ Child Columns
- Parent container: `.grid.lg\:grid-cols-12` on `< 1024px` switches from grid to `display: flex; flex-direction: column;` to remove grid row track confinement.
- Stage column: `top: 70px; z-index: 10; position: sticky;`.
- Configurator column: `top: 270px; z-index: 20; position: sticky;` (or relative scrolling layer with top anchor).

### Card Container ↔ Pull Handle
- Container: `.mobile-sheet-handle-container` placed as first child inside `.apple-glass-card`.
- Pill element: `.mobile-sheet-handle` styled with glass tokens, hidden via `display: none !important;` on `@media (min-width: 1024px)`.

### Touch Routing Contract
- Exposed Stage (Top 50%, y: 70px - 270px): `touch-action: none;` on `#jersey3DCanvas`, events captured by OrbitControls.
- Overlapping Card (Bottom 50%, y: 270px+): `touch-action: pan-y;` on `.apple-glass-card`, events captured by form elements and internal scrolling.

## Code Layout
- `index.html`: Entry point, header, main layout, segmented view switcher, `#jerseyCardWrapper`, `#jersey3DCanvas`, `.apple-glass-card`.
- `css/style.css`: Primary styling, glass tokens, responsive media queries (`@media (max-width: 1023px)` and `@media (min-width: 1024px)`).
- `css/accessibility-fixes.css`: Accessibility styles and touch target sizing.
- `js/stage3d.js`: Three.js canvas setup and OrbitControls.
- `js/app.js`: Configurator logic, view switching, and SVG text updates.
- `tests/`: 4-tier E2E test suite and empirical stress test harnesses.
