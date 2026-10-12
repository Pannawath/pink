# Handoff Report: Explorer Survey 3

Date: 2026-10-12
Sender: Explorer Survey 3 (teamwork_preview_explorer)
Recipient: Project Orchestrator (5d58ae1e-b8e4-4e2e-aef5-458743e96e3a)
Handoff Type: Hard (Survey Complete)

---

## 1. Observation

1. **3D Stage Architecture & Canvas:**
   - `index.html` lines 56-58 load Three.js r128, GLTFLoader, OrbitControls.
   - `index.html` lines 274-282 declare `#jerseyView3DEl` containing `<canvas id="jersey3DCanvas"></canvas>`, `.stage-3d-hint-badge`, and `#btnReset3DView`.
   - `index.html` line 847 loads `js/stage3d.js?v=3`.
   - `js/stage3d.js` lines 72-89 configure OrbitControls directly on `canvasElement` (`#jersey3DCanvas`).
   - `css/style.css` line 756 sets `#jersey3DCanvas { touch-action: none; cursor: grab; }`.

2. **View Switcher:**
   - `index.html` lines 183-190 define `.apple-segmented-control` with buttons `#btnViewBack`, `#btnViewFront`, `#btnViewBoth`, `#btnView3D`.
   - `js/app.js` lines 768-793 define `transitionJerseyView(targetSide)` which unhides the selected view and calls `window.onJersey3DVisible()` when switching to `'3d'`.

3. **DOM Layout & Hierarchy:**
   - `index.html` line 176 has `<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">`.
   - Left column: `index.html` line 179 `<div class="lg:col-span-6 flex flex-col items-center justify-center space-y-4">` contains view switcher and `.jersey-stage-container`.
   - Right column: `index.html` line 290 `<div class="lg:col-span-6 space-y-4">` contains `.apple-glass-card`.

4. **Existing Mobile Layout CSS:**
   - `index.html` lines 101-106: `main { overflow-y: auto !important; height: calc(100vh - 100px) !important; touch-action: pan-y !important; }`.
   - `css/style.css` lines 1024-1027: `@media (max-width: 1023px) { .jersey-stage-container { min-height: 420px; padding: 18px; } }`.
   - `css/style.css` line 1044: `@media (max-width: 520px) { .jersey-stage-container { min-height: 330px; } }`.

5. **Gatekeeper Scan & Tool Execution:**
   - Executed `call_mcp_tool(ServerName="godkiller-zero", ToolName="gk_gatekeeper_scan", Arguments={"path": "d:/antigravity/pink"})`.
   - Result: `[OK] [GATEKEEPER PASS] Scanned 8 files. Zero invariant violations detected.`
   - Executed `node --check js/app.js; node --check js/stage3d.js; node --check configUI.js; node --check js/security.js`.
   - Result: Exit code 0, no syntax errors.
   - Python regex scan for Unicode emoji ranges confirmed 0 emojis across all files.

---

## 2. Logic Chain

1. From Observation 1, OrbitControls binds strictly to `#jersey3DCanvas`, which has `touch-action: none;`. OrbitControls does not bind to `window` or any parent container for pointer initiation.
2. From Observation 3, the DOM structure has the stage column (left) followed by the configurator card column (right).
3. When the card floats over the bottom 50% of the stage container on mobile (< 1024px), standard CSS stacking context dictates that the card sits above the lower half of the stage.
4. Therefore, any pointer/touch event hitting the top exposed 50% hits `#jersey3DCanvas` directly. OrbitControls receives the event and handles 360-degree rotation without interference.
5. Concurrently, any pointer/touch event hitting the lower 50% hits `.apple-glass-card`. The card captures the touch for form interaction and internal scrolling, shielding OrbitControls from unintended input.
6. From Observation 2, because the view switcher is in the left column above `.jersey-stage-container`, the sticky mobile rule must be placed on the left column container (or a shared wrapper) at `top: 70px` so that both the switcher and the stage stay pinned below the header.
7. From Observation 5, all 8 existing JS files pass gatekeeper analysis. Future modifications must maintain CC <= 7, span <= 50 lines, no banned generic names, and strictly zero emojis.

---

## 3. Caveats

- `js/studio3d.js` and `js/silk3d.js` are unreferenced in `index.html`. They are legacy or prototype scripts; all modifications must focus on `js/stage3d.js` and `index.html`.
- `js/security.js` triggers debugger loops if DevTools is opened without typing the password (`28052552`). Automated browser tests must run without devtools window opening or must account for this modal.
- On very short mobile devices (height < 600px), a 50% stage overlap leaves ~160px visible stage height. The 3D model scales uniformly inside `normalizeStageShirtMesh`, so collar and chest remain visible, but camera zoom limits (minDistance 1.8) prevent clipping.

---

## 4. Conclusion

1. **3D Canvas & OrbitControls:** Ready for mobile sticky overlap. OrbitControls will remain fully draggable and interactive in the exposed top 50% region of `#jersey3DCanvas` with zero conflict with form touches.
2. **View Switcher:** Must be included within the sticky anchor on `< 1024px` at `top: 70px; z-index: 20;` so users can change views between Front, Back, Both, and 3D while scrolled.
3. **Bottom Sheet & Handle:** Add `.mobile-sheet-handle` pill inside `.apple-glass-card` (hidden on `>= 1024px`). Position `.apple-glass-card` with `z-index: 30;` to smoothly overlay the stage on mobile scroll.
4. **Desktop Layout:** Strictly preserve `>= 1024px` grid layout without sticky overlap or pull handle.
5. **Gatekeeper:** Ready for implementation. Must maintain AST compliance (CC <= 7, span <= 50 lines, no banned generic names, zero emojis).

---

## 5. Verification Method

1. **Gatekeeper Verification:**
   Call MCP tool `gk_gatekeeper_scan`:
   `call_mcp_tool(ServerName="godkiller-zero", ToolName="gk_gatekeeper_scan", Arguments={"path": "d:/antigravity/pink"})`
   Invalidation condition: Any invariant violation reported.

2. **JavaScript Syntax Check:**
   Execute via PowerShell:
   `node --check js/app.js; node --check js/stage3d.js; node --check configUI.js; node --check js/security.js`
   Invalidation condition: Non-zero exit code or syntax parse error.

3. **Codebase Emoji Scan:**
   Execute Python regex script checking for emoji Unicode points across all repository files.
   Invalidation condition: Any emoji detected in any file.

4. **DOM & CSS Inspection:**
   - Inspect `index.html` to confirm `.mobile-sheet-handle` is present with `lg:hidden`.
   - Inspect `css/style.css` to confirm `@media (max-width: 1023px)` applies sticky positioning at `top: 70px` and `@media (min-width: 1024px)` retains untouched 2-column grid.
