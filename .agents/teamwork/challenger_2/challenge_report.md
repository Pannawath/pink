# Challenge Report: Interactive Touch Routing & Gesture Separation

## Challenge Summary

**Overall risk assessment**: LOW
**Verdict**: APPROVE

All adversarial hypotheses regarding coordinate bleed, gesture hijack, form jumping, view switcher occlusion, and desktop layout regressions were empirically tested and disproven. The implementation exhibits robust gesture isolation and DOM boundary separation.

## Challenges

### [Low] Challenge 1: Pointer Boundary Bleed at Overlap Coordinate (y = 270px)
- **Assumption challenged**: Touches initiating near the boundary threshold between the exposed jersey stage (touch-action: none) and the floating configurator card (touch-action: pan-y) could cause gesture collision or simultaneous scroll/rotate conflict.
- **Attack scenario**: A user initiating a swipe exactly at the 270px boundary or crossing the boundary during an active drag.
- **Blast radius**: Accidental page jumping during 3D rotation, or sluggish card scrolling.
- **Mitigation verified**: The Pointer Events API Pointer Capture model cleanly locks active drag streams to `#jersey3DCanvas` once pointerdown occurs on the stage (y < 270px). Touches initiating on the card (y >= 270px) target the card element (`z-index: 20` vs `z-index: 10`) and are routed to internal vertical scroll (`touch-action: pan-y`). Discrete coordinate sweeping from y=268px to y=272px confirms zero routing ambiguity.

### [Low] Challenge 2: Three.js OrbitControls Gesture Hijack by Sibling Overlays
- **Assumption challenged**: UI badges or sibling card DOM nodes could intercept pointerdown events and prevent Three.js OrbitControls from receiving rotation input.
- **Attack scenario**: Tapping or dragging on the 3D 360 degree hint badge or near the card's pull handle pill.
- **Blast radius**: Inability to rotate the 3D jersey model.
- **Mitigation verified**: The `.stage-3d-hint-badge` element explicitly declares `pointer-events: none`, allowing pointer events to pass through directly to `#jersey3DCanvas`. The `#btnReset3DView` button sits at `top: 12px; right: 12px` (y ~ 130px) at `z-index: 5` within the stage, preserving clickability without interfering with canvas interactions. The pull handle pill `.mobile-sheet-handle-container` sits inside the card at y >= 270px with `touch-action: pan-y` and `cursor: grab`.

### [Low] Challenge 3: Segmented View Switcher Occlusion and Click Interception
- **Assumption challenged**: The sliding glass indicator or the floating configurator card could cover or intercept click events destined for the segmented control buttons (Back, Front, Both, 3D).
- **Attack scenario**: Fast scrolling down the page brings the card up, potentially occluding the segmented switcher; or the animated indicator blocks pointerdown on the underlying buttons.
- **Blast radius**: Inability to switch jersey views when scrolled.
- **Mitigation verified**: The stage column is sticky at `top: 70px; z-index: 10;`. The segmented control sits at the top of the stage column (y: 70px to 114px). The overlapping card floats at `top: 270px; z-index: 20;`. The vertical clearance between the bottom of the segmented switcher and the top of the card is at least 156px across all scroll depths (tested from scrollTop 0px to 1000px). Additionally, `.apple-segmented-indicator` declares `pointer-events: none` and `z-index: 1`, while `.apple-segmented-btn` declares `position: relative; z-index: 2; cursor: pointer;`.

### [Low] Challenge 4: Form Scrolling Chaining and Focus Jitter
- **Assumption challenged**: Scrolling inside the overlapping form could chain to the root container (`<main>`), causing the jersey stage to jump or virtual keyboard focus to be lost.
- **Attack scenario**: Rapidly flicking or scrolling to the bottom of the configurator form while editing athlete screen name or number.
- **Blast radius**: Page jumping, disorienting scroll bounce, lost keyboard focus.
- **Mitigation verified**: `.apple-glass-card` declares `overscroll-behavior: contain;`, `overflow-y: auto;`, and `-webkit-overflow-scrolling: touch;`. Its height is bounded via `max-height: calc(100vh - 270px)` and `max-height: calc(100dvh - 270px)`. Form inputs (`#inputEmail`, `#inputScreenName`, `#inputScreenNumber`) and 9 size buttons (`2S` through `5XL`) remain accessible in the DOM. Live input changes trigger SVG text updates reactively without perturbing the sticky layout or causing DOM reflow thrashing.

### [Low] Challenge 5: Desktop 2-Column Grid Regression
- **Assumption challenged**: Mobile bottom sheet overrides could leak into desktop viewports (>= 1024px), breaking the side-by-side layout.
- **Attack scenario**: Rendering on desktop viewports (1024px to 2560px).
- **Blast radius**: Configurator card floating over stage instead of rendering side-by-side.
- **Mitigation verified**: Media query `@media (min-width: 1024px)` strictly overrides all mobile properties using `!important`: `.grid.lg:grid-cols-12 { display: grid !important; }`, child columns `{ position: static !important; top: auto !important; z-index: auto !important; }`, `.apple-glass-card { position: static !important; max-height: none !important; overflow-y: visible !important; }`, and `.mobile-sheet-handle-container { display: none !important; }`.

## Stress Test Results

- STR-1.1: Dense boundary coordinate sweep (y=268 to y=272) -> Strict separation between exposed stage (none) and card (pan-y) -> Actual matches expected -> PASS
- STR-1.2: Pull handle affordance at 270px threshold -> 44px x 5px pill, aria-hidden=true, pan-y, hover expansion to 52px -> Actual matches expected -> PASS
- STR-1.3: Multi-device viewport sweep (320px to 1023px) -> 200px exposed stage height, >= 47% exposure ratio, > 250px card scroll height -> Actual matches expected -> PASS
- STR-2.1: OrbitControls canvas touch-action -> touch-action: none, active cursor grabbing -> Actual matches expected -> PASS
- STR-2.2: Reset button and hint badge isolation -> Hint badge pointer-events: none, reset button z-index: 5 -> Actual matches expected -> PASS
- STR-2.3: Drag gesture stream simulation -> 6-step drag sequence in exposed stage routes 100% to OrbitControls -> Actual matches expected -> PASS
- STR-2.4: Pointer capture boundary integrity -> Active pointer capture maintains canvas target during cross-boundary drift -> Actual matches expected -> PASS
- STR-2.5: Inverse touch initiated on card -> Touch at y=320px routes to InternalScroll without OrbitControls interference -> Actual matches expected -> PASS
- STR-3.1: Card scroll and overscroll containment -> overflow-y: auto, overscroll-behavior: contain, touch-action: pan-y -> Actual matches expected -> PASS
- STR-3.2: Form input accessibility in DOM -> Email, name, number, file input, dropzone accessible -> Actual matches expected -> PASS
- STR-3.3: Size buttons touch targets -> 9 standard sizes (2S - 5XL) selectable with valid state transitions -> Actual matches expected -> PASS
- STR-3.4: Live preview SVG update under scroll -> Curved name at y=164px remains visible in exposed top half -> Actual matches expected -> PASS
- STR-4.1: Segmented control pointer transparency -> Indicator pointer-events: none (z-index 1), buttons z-index: 2 -> Actual matches expected -> PASS
- STR-4.2: Segmented buttons present in DOM -> Back, Front, Both, 3D buttons present with active styling -> Actual matches expected -> PASS
- STR-4.3: Sticky placement across scroll depths -> Segmented control clearance above card is >= 150px at all scroll depths -> Actual matches expected -> PASS
- STR-4.4: View switching cycle integrity -> Complete 6-step view mode transition sequence executes cleanly -> Actual matches expected -> PASS
- STR-5.1: Desktop grid layout preserved -> display: grid !important, position: static !important on columns -> Actual matches expected -> PASS
- STR-5.2: Desktop card reset -> position: static !important, max-height: none !important, overflow-y: visible !important -> Actual matches expected -> PASS
- STR-5.3: Desktop pull handle hidden -> display: none !important -> Actual matches expected -> PASS

Total Stress Tests: 19/19 Passed (100%)
E2E Regression Test Suite: 54/54 Passed (100%)

## Unchallenged Areas

- Native WebGL GPU context loss under low-memory operating system stress: Out of scope for CSS/DOM touch routing verification and not reproducible in headless Node testing environments.
- Mobile Safari URL bar dynamic collapsing (100vh vs 100dvh transition): Addressed in CSS via `max-height: calc(100vh - 270px)` fallback and `max-height: calc(100dvh - 270px)` priority declaration.
