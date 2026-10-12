# Handoff Report - Explorer Survey 1

## 1. Observation

- **Project Tech Stack**:
  - `index.html` (851 lines): Single-page static application with Tailwind CSS CDN, FontAwesome 6.5.1, Three.js r128, OrbitControls, and Canvas Confetti.
  - `css/style.css` (1,054 lines): Custom styling containing Apple glassmorphism tokens and responsive media queries (`@media (min-width: 1024px)` at line 985, `@media (max-width: 1023px)` at line 1000, and `@media (max-width: 520px)` at line 1038).
  - `css/accessibility-fixes.css` (180 lines): Focus states and mobile touch targets (`min-height: 44px`).
  - `js/app.js` (1,582 lines): Vanilla JavaScript managing live SVG preview updates, form validation, size selection, and Google Sheets synchronization.
  - `js/stage3d.js` (196 lines): Three.js WebGL renderer initializing `OrbitControls` on `#jersey3DCanvas` with `touch-action: none`.

- **Scroll and Viewport Constraints**:
  - In `index.html` lines 71-117, an inline `<style>` establishes:
    - Line 79-89: `body { overflow: hidden; position: fixed; width: 100%; height: 100vh; }`
    - Line 101-106: `main { overflow-y: auto !important; overflow-x: hidden !important; height: calc(100vh - 100px) !important; touch-action: pan-y !important; }`
    - Line 109-116: `header { position: fixed; top: 0; left: 0; right: 0; z-index: 40; width: 100%; }`

- **DOM Coordinates for Key Elements**:
  - Fixed floating header: `index.html:133-147` (`header.sticky.top-4.z-40`, `.apple-glass-nav`).
  - Studio grid layout: `index.html:176` (`div.grid.grid-cols-1.lg:grid-cols-12.gap-8.items-start`).
  - Left column (Product Stage): `index.html:179` (`div.lg:col-span-6`).
  - View mode segmented switcher: `index.html:183` (`div.apple-segmented-control.relative`).
  - Jersey stage container: `index.html:193` (`div.jersey-stage-container`).
  - Jersey card wrapper: `index.html:194` (`div#jerseyCardWrapper.jersey-card-wrapper.relative`).
  - SVG preview coordinates:
    - Back curved name: `index.html:201` (`path#nameArcPath`, y=235-310).
    - Back number: `index.html:215` (`text#svgBackNumber`, y=505, font-size=380).
    - Front chest number: `index.html:225` (`text#svgFrontNumber`, y=300, font-size=85).
  - 3D stage canvas: `index.html:275` (`canvas#jersey3DCanvas`).
  - Right column (Configurator): `index.html:290` (`div.lg:col-span-6.space-y-4`).
  - Configurator card: `index.html:292` (`div.apple-glass-card.p-6.sm:p-7.space-y-5`).
  - Pull handle pill: Missing (`grep_search` returned 0 matches for `mobile-sheet-handle`).

- **Gatekeeper Scan Result**:
  - Command: `gk_gatekeeper_scan` with path `d:\antigravity\pink`.
  - Output: `[OK] [GATEKEEPER PASS] Scanned 8 files. Zero invariant violations detected.`

## 2. Logic Chain

1. From Observation of `index.html:101-106`, `<main>` is the primary scroll container with `overflow-y: auto !important; height: calc(100vh - 100px) !important;`. Therefore, sticky positioning (`position: sticky`) must anchor inside `<main>`.
2. From Observation of `index.html:176`, the grid uses `grid-cols-1 lg:grid-cols-12`. On mobile viewports (`< 1024px`), CSS Grid tracks isolate row 1 (left column) and row 2 (right column). In pure CSS Grid row tracks, sticky elements inside row 1 cannot stick past row 1's boundary into row 2's scroll area.
3. Therefore, to allow the left column's stage to stick while the right column's card scrolls past and overlaps it, the mobile layout (`@media (max-width: 1023px)`) should convert the grid container (`div.grid.lg\:grid-cols-12`) to block or flex column layout where the containing block encompasses both columns.
4. From Observation of SVG coordinates (`y=235-310` for curved name, `y=300` for chest number, `y=505` for back number center), overlapping the jersey stage container by approximately 50% from the bottom leaves the upper collar, name arc, numbers, view switcher, and upper 3D canvas unobstructed.
5. From Observation of `grep_search` for `mobile-sheet-handle`, the handle pill requested in R2 does not exist and must be added as a child of `.apple-glass-card` (`index.html:292`), displayed only on mobile (`< 1024px`) and hidden on desktop (`>= 1024px`).
6. From Observation of `css/style.css:985-998`, desktop styling is guarded by `@media (min-width: 1024px)`. Wrapping all sticky overlap styles and pull handle rules within `@media (max-width: 1023px)` guarantees zero regressions for desktop viewports (R4).

## 3. Caveats

- The Google Apps Script endpoint (`Code.gs`) operates on remote Google infrastructure and cannot be verified via offline local unit tests. Local testing relies on mock or standard DOM event firing.
- The 3D canvas requires WebGL context support. In headless environments without hardware acceleration, WebGL canvas falls back to standard rendering or mock context.
- No other caveats.

## 4. Conclusion

The Pink Jersey Studio codebase is fully analyzed and structurally ready for implementation.
1. The tech stack is vanilla HTML5/CSS3/JavaScript with Tailwind CDN and Three.js r128.
2. The exact insertion point for R2 (`.mobile-sheet-handle`) is at `index.html:293` inside `.apple-glass-card`.
3. The exact CSS breakpoint for R1, R2, R4 is `@media (max-width: 1023px)` in `css/style.css`.
4. R1 requires setting the mobile grid container to block display, applying `position: sticky; top: 70px; z-index: 10;` to the left stage column, and styling `.apple-glass-card` as an elevated floating layer (`z-index: 20`) with 50% overlap.
5. Zero desktop regressions (R4) is guaranteed by isolating all changes inside the mobile media query.

## 5. Verification Method

1. Inspect report: Verify `d:\antigravity\pink\.agents\teamwork\explorer_survey_1\survey_report.md` exists and contains complete coordinates.
2. Verify Gatekeeper compliance: Run `gk_gatekeeper_scan` with path `d:\antigravity\pink` to confirm zero violations.
3. DOM check: Confirm all listed selectors (`.jersey-stage-container`, `.apple-glass-card`, `#jersey3DCanvas`, `#inputScreenName`, `#inputScreenNumber`) match `index.html` lines.
