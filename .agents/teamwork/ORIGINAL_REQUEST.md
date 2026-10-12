# Original User Request

## Initial Request — 2026-10-12T18:54:54Z

Implement a mobile-specific layered floating glass bottom sheet / sticky overlap interaction where scrolling on mobile elevates the configurator card into an independent glass layer that slides up over the jersey preview stage by approximately 50%, featuring an Apple Glass pull handle pill and keeping the upper half of the jersey visible and interactive at all times.

Working directory: d:\antigravity\pink
Integrity mode: development

## Requirements

### R1. Mobile Sticky Stage with 50% Overlap Anchor
On mobile viewports (< 1024px), the jersey stage container sticks smoothly near the top below the header (top: 70px). When scrolling down, the configurator card (.apple-glass-card) floats over the jersey stage, overlapping approximately 50% of the shirt frame so the top half of the jersey (collar, chest, number, 3D model, view switcher) remains clearly visible and interactive.

### R2. Apple Glass Pull Handle Gimmick
Add a sleek, translucent Apple Glass pull handle pill (.mobile-sheet-handle) at the top of the configurator card on mobile viewports to provide an unmistakable visual affordance of an elevated, floating bottom sheet layer.

### R3. Form Scroll & Touch Interactivity
Ensure the form content inside the overlapping card is fully scrollable, inputs remain accessible and touch-friendly, and all actions (email lookup, name/number inputs, size buttons, slip upload) work smoothly without layout clipping or jumpiness.

### R4. Zero Desktop Regressions
The desktop experience (>= 1024px) must remain 100% untouched as a side-by-side 2-column layout.

## Acceptance Criteria

### Visual & Interactive Behavior
- [ ] On mobile viewport, initial page load displays the full jersey stage with the top section of the configurator card visible below it.
- [ ] Scrolling on mobile brings the configurator card up to cover roughly 50% of the jersey stage, locking the preview in the upper half.
- [ ] An Apple Glass pull handle pill appears at the top center of the card on mobile.
- [ ] Live preview updates (name, number) remain visible in the top half of the shirt while typing in the overlapping form.
- [ ] 3D canvas and OrbitControls remain draggable and interactive in the exposed top half.
- [ ] On desktop (>= 1024px), the side-by-side grid is completely preserved.
- [ ] Passes Gatekeeper scan (gk_gatekeeper_scan) with zero invariant violations, complexity <= 7, span <= 50 lines, and strictly zero emojis.
