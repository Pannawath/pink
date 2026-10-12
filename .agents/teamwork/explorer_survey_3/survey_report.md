# Survey Report: 3D Canvas Interaction, Touch Events, Form Scrolling, Test Setup, and Gatekeeper Invariants

Author: Explorer Survey 3 (teamwork_preview_explorer)
Date: 2026-10-12
Workspace: d:\antigravity\pink
Integrity Mode: Development / Read-Only

---

## 1. Executive Summary

This survey report provides a detailed technical mapping of the 3D model canvas, Three.js OrbitControls, touch/pointer event interactions, mobile form scrolling mechanics, test infrastructure, and Godkiller Zero invariant enforcement for the Pink Jersey Studio project.

Key conclusions:
- The active 3D stage engine is implemented in `js/stage3d.js` using Three.js r128, OrbitControls, and GLTFLoader to render `assets/models/shirt.glb` inside `#jersey3DCanvas`.
- `#jersey3DCanvas` is explicitly configured with `touch-action: none;`. OrbitControls binds exclusively to this canvas element.
- When `.apple-glass-card` overlaps the bottom 50% of the stage container on mobile viewports (< 1024px), standard DOM stacking rules route touches on the upper 50% directly to `#jersey3DCanvas` (enabling 360-degree rotation) and touches on the lower 50% directly to `.apple-glass-card` (enabling smooth form scrolling and input interaction) with zero gesture collision.
- The view switcher (`.apple-segmented-control`) sits above the canvas in DOM order and must be pinned alongside the stage at `top: 70px` on mobile so view modes (Front, Back, Both, 3D) remain switchable at all scroll depths.
- Automated gatekeeper scans via `gk_gatekeeper_scan` currently pass on all 8 indexed JavaScript files with 0 violations.
- Strictly 0 emojis and 0 invariant violations exist in the current codebase.

---

## 2. 3D Model, Canvas, and View Switcher Architecture

### 2.1 Dependencies and Asset Pipeline
The 3D pipeline relies on CDN scripts declared in `index.html` lines 56-58:
- Three.js core: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`
- GLTF Loader: `https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js`
- OrbitControls: `https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js`
- Model asset: `assets/models/shirt.glb` (normalized and scaled in runtime)

Note on legacy files:
`js/studio3d.js` and `js/silk3d.js` exist in the repository but are NOT referenced in `index.html`. The canonical, production 3D script is `js/stage3d.js`.

### 2.2 Scene Graph and Normalization (`js/stage3d.js`)
- State Object: `Stage3DState` tracks `isInitialized`, `renderer`, `scene`, `camera`, `controls`, `shirtModel`, `animationId`.
- Normalization Function: `normalizeStageShirtMesh(modelScene)` (lines 37-70)
  - Computes `THREE.Box3` bounding box.
  - Scales model uniformly so max axis is 2.4 units (`scaleRatio = 2.4 / maxDimension`).
  - Offsets model position to `-centerVector` so the geometry pivot is centered at `(0, 0, 0)`.
  - Traversing mesh: caps roughness at 0.72, metalness at 0.05, enables shadows.
- Camera: `PerspectiveCamera(40, aspect, 0.1, 50)` positioned at `(0, 0, 3.8)`.
- Studio Lighting: `setupStageLighting(scene)` (lines 16-35)
  - Key light: DirectionalLight(0xfff8f2, 1.25) at (3.5, 4.5, 3.5)
  - Fill light: DirectionalLight(0xe8f0fe, 0.85) at (-3.5, 2.5, 2.5)
  - Rim light: DirectionalLight(0xffe4e6, 1.10) at (-1.0, 4.0, -3.5)
  - Bounce light: DirectionalLight(0xf8fafc, 0.50) at (0, -4.0, 1.5)
  - Ambient light: AmbientLight(0xffffff, 0.65)
- Renderer:
  - `WebGLRenderer` targeting `#jersey3DCanvas` with `alpha: true`, `antialias: true`, `powerPreference: 'high-performance'`.
  - Pixel ratio capped at `Math.min(window.devicePixelRatio, 2)`.
  - Tone mapping: `THREE.ACESFilmicToneMapping` with exposure 0.90.

### 2.3 OrbitControls Configuration (`js/stage3d.js` lines 72-89)
```javascript
function configureStageControls(camera, canvasElement) {
  const controls = new THREE.OrbitControls(camera, canvasElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.85;
  controls.zoomSpeed = 0.9;
  controls.minDistance = 1.8;
  controls.maxDistance = 6.5;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.5;
  controls.target.set(0, 0, 0);

  canvasElement.addEventListener('pointerdown', () => {
    controls.autoRotate = false;
  });

  return controls;
}
```
Key properties:
- Binds to `canvasElement` (`#jersey3DCanvas`).
- Smooth inertia damping (dampingFactor = 0.06).
- Distance clamp between 1.8 and 6.5 prevents camera from clipping through shirt mesh.
- Auto-rotation active until user initiates `pointerdown` on canvas.
- Reset button `#btnReset3DView` positioned at `top: 12px; right: 12px;` restores camera to `(0, 0, 3.8)` and re-enables `autoRotate`.

### 2.4 Canvas Resizing and Bounding Box
In `resizeStage3DViewer()` (lines 99-110):
```javascript
const rectBounds = canvasElement.parentElement.getBoundingClientRect();
const canvasWidth = rectBounds.width || 440;
const canvasHeight = rectBounds.height || 480;
Stage3DState.camera.aspect = canvasWidth / canvasHeight;
Stage3DState.camera.updateProjectionMatrix();
Stage3DState.renderer.setSize(canvasWidth, canvasHeight, false);
```
- Canvas size is determined by `#jerseyView3DEl` bounding rect.
- Parent container hierarchy:
  `main` -> `.grid` -> left column -> `.jersey-stage-container` -> `#jerseyCardWrapper` -> `#jerseyView3DEl` -> `#jersey3DCanvas`.
- In CSS (`css/style.css` lines 741-757):
  - `.jersey-3d-stage-container` has `position: absolute; inset: 0;`.
  - `#jersey3DCanvas` has `width: 100% !important; height: 100% !important; touch-action: none; cursor: grab;`.

### 2.5 View Switcher Mechanics (`js/app.js` lines 768-825)
- Active view mapped via `AppState.viewSide` in `js/app.js`.
- Four views supported:
  1. `back`: `#jerseyViewBackEl` (SVG, maxWidth: 440px)
  2. `front`: `#jerseyViewFrontEl` (SVG, maxWidth: 440px)
  3. `both`: `#jerseyViewBothEl` (dual SVG, maxWidth: 600px)
  4. `3d`: `#jerseyView3DEl` (WebGL canvas, maxWidth: 480px)
- When transitioning to `3d`:
  - `transitionJerseyView('3d')` unhides `#jerseyView3DEl`, sets opacity 1, and triggers `window.onJersey3DVisible()`.
  - `window.onJersey3DVisible` initializes `initJersey3DViewer()` if not already initialized, or invokes `resizeStage3DViewer()`.

---

## 3. Mobile Touch Events, Form Scrolling, and 50% Overlap Analysis

### 3.1 Pointer Event Routing and Event Boundary
When mobile scrolling elevates `.apple-glass-card` over `.jersey-stage-container` by ~50%:

```text
+-------------------------------------------------------+
| Mobile Viewport (Header top: 0 to ~70px)             |
+-------------------------------------------------------+
| STICKY STAGE CONTAINER (top: 70px, z-index: 20)      |
|                                                       |
|  [ View Switcher: Back | Front | Both | 3D 360 ]     |
|                                                       |
|  EXPOSED UPPER 50% STAGE REGION:                      |
|  - Collar, Chest, Number (SVG) or 3D Shirt Model      |
|  - Canvas #jersey3DCanvas (touch-action: none)        |
|  --> Direct pointer/touch events hit canvas           |
|  --> OrbitControls captures pitch/yaw/damping 360 deg  |
|                                                       |
+=======================================================+ <- Overlap Seam
| FLOATING GLASS BOTTOM SHEET (.apple-glass-card)       |
| (z-index: 30, backdrop blur, top pill handle)         |
|                                                       |
|  OVERLAPPED LOWER 50% STAGE REGION:                   |
|  - Bottom half of stage blurred behind glass card     |
|  - All pointer/touch events hit .apple-glass-card     |
|  - Form inputs, buttons, slip dropzone fully scrollable|
|  - OrbitControls underneath receives 0 touch events   |
|                                                       |
+-------------------------------------------------------+
```

### 3.2 Touch Action and Gesture Collision Prevention
1. **Upper Exposed Stage (0% - 50%):**
   - `#jersey3DCanvas` has `touch-action: none`.
   - Browser suppresses default panning/scrolling on this element.
   - When user touches the canvas in this upper area, OrbitControls handles single-touch drag (rotation) and two-finger pinch (zoom) smoothly.
2. **Lower Overlapped Stage (50% - 100%):**
   - `.apple-glass-card` has `z-index: 30` (higher than the stage's `z-index: 20`).
   - Browser event dispatch targets the uppermost DOM element in the hit test.
   - Touches within `.apple-glass-card` trigger form scrolling (`touch-action: pan-y`) and form element interaction.
   - OrbitControls does NOT intercept touches happening on `.apple-glass-card`.
3. **Seam Drag Behavior:**
   - Three.js OrbitControls attaches temporary `pointermove` and `pointerup` listeners to `ownerDocument` only AFTER a valid `pointerdown` begins on `#jersey3DCanvas`.
   - If a drag starts in the upper half on `#jersey3DCanvas` and crosses into the lower half, OrbitControls continues tracking the drag until release.
   - If a drag starts in the card, `pointerdown` is fired on the card, so OrbitControls is never engaged.
   - This provides natural, zero-glitch mobile UX.

### 3.3 Critical Traps and Safeguards
1. **Trap 1: Accidental Transparent Overlay Bleed:**
   - If `.apple-glass-card` or a wrapper element has transparent padding or invisible pseudo-elements projecting above the card seam without `pointer-events: none`, it would intercept clicks meant for the 3D canvas or view switcher buttons.
   - *Safeguard:* Bounding box of `.apple-glass-card` and `.mobile-sheet-handle` must remain strictly within the card envelope.
2. **Trap 2: View Switcher Sticking Requirement:**
   - In `index.html`, `.apple-segmented-control` is outside `.jersey-stage-container` but inside the left column.
   - If only `.jersey-stage-container` is made sticky, the view switcher would scroll offscreen.
   - *Safeguard:* The sticky mobile container must include both the view switcher and `.jersey-stage-container` (or the entire left column wrapper is made sticky at `top: 70px`), ensuring view mode switching is accessible at all scroll positions.
3. **Trap 3: Hint Badge Clipping:**
   - `.stage-3d-hint-badge` is positioned at `bottom: 12px` of `#jerseyView3DEl`.
   - When the bottom 50% is overlapped, this hint badge will be concealed under the card.
   - *Safeguard:* On mobile (`< 1024px`), adjust badge position to `top: 12px; left: 14px; transform: none;` or leave under blurred glass if non-essential. The reset button `#btnReset3DView` is already at `top: 12px; right: 12px` and remains accessible.
4. **Trap 4: Mobile Viewport Height / Scroll Container:**
   - In `index.html` lines 101-106:
     `main { overflow-y: auto !important; height: calc(100vh - 100px) !important; touch-action: pan-y !important; }`
   - Sticky positioning functions relative to its scrolling ancestor (`main`).
   - `top: 70px` sticky offset aligns perfectly with the sticky header height (~64px + margin).

---

## 4. Implementation Blueprint for Mobile Sticky Overlap

### 4.1 Requirement Alignment
- **R1: Mobile Sticky Stage with 50% Overlap Anchor:**
  - Breakpoint: `< 1024px`.
  - Left column or stage wrapper: `position: sticky; top: 70px; z-index: 20;`.
  - Configurator card (`.apple-glass-card`): `position: relative; z-index: 30;`.
  - Margin/anchor calibration:
    On mobile, initial view shows stage with top section of card below it. Scrolling down brings card up to cover ~50% of stage, locking preview in upper half.
- **R2: Apple Glass Pull Handle Gimmick:**
  - Class: `.mobile-sheet-handle`
  - Position: centered at top of `.apple-glass-card`.
  - Display: visible on `< 1024px` (`flex`), hidden on `>= 1024px` (`display: none !important;`).
  - Pill dimensions: width 40px, height 4px, border-radius 9999px.
  - Background: `rgba(255, 255, 255, 0.65)` with subtle drop shadow.
- **R3: Form Scroll & Touch Interactivity:**
  - Card internal form scrollable with `-webkit-overflow-scrolling: touch;`.
  - Inputs (email, screen name, number, size selector, slip upload) remain 100% interactive.
- **R4: Zero Desktop Regressions:**
  - Breakpoint `>= 1024px` remains bit-for-bit unchanged as side-by-side 2-column layout (`grid-cols-12`).
  - Pull handle hidden on desktop.
  - Sticky overlap disabled on desktop.

---

## 5. Test Setup and Gatekeeper Verification

### 5.1 Existing Testing Landscape
- There is no npm `package.json`, Jest, Mocha, or Vitest suite.
- The project is pure static HTML5/Vanilla JS/CSS.
- Verified environments on host:
  - Node: v24.21.0
  - Python: 3.14.7

### 5.2 Verification Commands
1. **Gatekeeper Scan (MCP Tool):**
   ```bash
   call_mcp_tool(ServerName="godkiller-zero", ToolName="gk_gatekeeper_scan", Arguments={"path": "d:/antigravity/pink"})
   ```
   Current Result: `[OK] [GATEKEEPER PASS] Scanned 8 files. Zero invariant violations detected.`
2. **JavaScript Syntax Verification:**
   ```powershell
   node --check js/app.js; node --check js/stage3d.js; node --check configUI.js; node --check js/security.js
   ```
   Current Result: All files pass with exit code 0.
3. **Repository Radar Map:**
   ```bash
   call_mcp_tool(ServerName="godkiller-zero", ToolName="gk_get_repo_map", Arguments={"workspace_path": "d:/antigravity/pink"})
   ```
   Indexed 8 files, 124 symbols across project.

### 5.3 DevTools Security Guardrail Note (`js/security.js`)
- `js/security.js` binds window keydown/contextmenu handlers to intercept F12 and DevTools shortcuts, displaying a password modal (password: `28052552`).
- If DevTools is opened without authentication, `freezeDevTools()` triggers `debugger` loops.
- In headless automated testing (e.g. Chrome DevTools Protocol / Puppeteer), DevTools window resize checks can be bypassed or testing should run without resizing `window.outerWidth - window.innerWidth > 160`.

---

## 6. Godkiller Zero Invariant Compliance Audit

| Invariant Rule | Requirement | Current Status | Audit Finding |
|---|---|---|---|
| Cyclomatic Complexity | CC <= 7 per function | PASS | All functions in scanned files adhere to CC <= 7. |
| Function Span Limit | Span <= 50 lines (business logic) | PASS | No business logic function exceeds 50 lines. |
| Generic Identifiers | Forbidden: [data, res, req, item, val, temp, obj, info, payload, result, handleData, processData, doAction] in domain models/state | PASS | Zero forbidden generic identifiers in domain models or declarations. (HTML attributes like `data-size` are exempt framework attributes). |
| Junk Drawers | Forbidden utils/, helpers/, common/ | PASS | No junk drawers exist. Feature logic is modularized. |
| Zero Emojis | Strictly NO emojis anywhere | PASS | Python regex scan confirmed 0 emojis across all project files. |
| Vibe-Coding Comments | No narrative code comments | PASS | Clean code, no mechanic narration comments. |
| Lazy Stubs | No TODO / unwrap stubs | PASS | Zero stubs found. |

---

## 7. Next Steps for Implementation

1. **Worker Implementation:**
   - Add `.mobile-sheet-handle` element to `.apple-glass-card` in `index.html`.
   - Update `css/style.css` (or `css/accessibility-fixes.css`) with mobile sticky positioning (`top: 70px`, `z-index: 20`) for the stage column and overlap styling for `.apple-glass-card` (`z-index: 30`).
   - Add `.stage-3d-hint-badge` mobile positioning adjustment.
2. **Verification & Audit:**
   - Execute `node --check` syntax verification.
   - Run `gk_gatekeeper_scan`.
   - Verify desktop viewports (`>= 1024px`) retain side-by-side grid with 0 regressions.
   - Hand off to Sentinel.
