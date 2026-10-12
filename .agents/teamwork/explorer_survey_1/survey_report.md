# Comprehensive Codebase & DOM Survey Report
Project: Pink Jersey Configurator (Ayutthaya Sarakhampittayakhom Studio 2026)
Surveyor: Explorer Survey 1 (teamwork_preview_explorer)
Date: 2026-10-12
Integrity Mode: Development / Read-Only

---

## 1. Executive Summary

This report maps the codebase architecture, file tree, entry points, DOM hierarchy, and styling models for the Pink Jersey Studio project. It provides coordinate-accurate references (file paths, line numbers, CSS rules, DOM selectors) to support implementing the mobile layered floating glass bottom sheet and sticky overlap interaction (Requirements R1, R2, R3, R4 in ORIGINAL_REQUEST.md) with zero desktop regressions.

---

## 2. Technology Stack & Workspace Structure

### 2.1 Workspace Overview
- Root directory: `d:\antigravity\pink`
- Architecture: Client-side static single-page application (SPA) backed by Google Apps Script serverless API and Google Sheets.
- Build system: No Node.js build step or bundler; browser-native ES6+ and CDN-loaded dependencies.

### 2.2 File Inventory

| Path | Size (Bytes) | Role / Content |
|---|---|---|
| `index.html` | 46,028 | Primary entry point, full DOM structure, inline mobile scroll lock styles |
| `css/style.css` | 25,877 | Primary stylesheet (1,054 lines), Apple glassmorphic design tokens, stage styling, responsive media queries |
| `css/accessibility-fixes.css` | 5,531 | Accessibility enhancements (180 lines), focus rings, mobile touch target sizes |
| `js/app.js` | 62,688 | Core application logic (1,582 lines), state store, live SVG updates, form validation, order sync |
| `js/stage3d.js` | 5,777 | Three.js WebGL 3D viewer (196 lines), OrbitControls, model loader |
| `js/security.js` | 7,054 | DevTools detection and shortcut protection |
| `config.js` | 320 | Google Apps Script URL and Spreadsheet ID configuration |
| `configUI.js` | 10,203 | UI text strings and theme definitions |
| `DESIGN.md` | 7,318 | Design tokens and component specification |
| `Code.gs` | 16,685 | Google Apps Script backend implementation |
| `assets/models/shirt.glb` | Binary | 3D GLTF jersey mesh |
| `assets/images/` | Assets | Jersey back/front/both PNG textures, crest, QR PromptPay image |
| `assets/fonts/` | Fonts | BebasNeue, JerseyMiami custom athletic number fonts |

### 2.3 Dependencies Loaded in `index.html`
- Tailwind CSS CDN v3 (`https://cdn.tailwindcss.com`) with custom color palette (`apple.pink`, `apple.rose`, etc.)
- FontAwesome 6.5.1 (`cdnjs.cloudflare.com`)
- Canvas Confetti 1.9.3 & html2canvas 1.4.1
- Three.js r128, GLTFLoader, OrbitControls (`cdnjs.cloudflare.com`, `jsdelivr.net`)

---

## 3. DOM & Layout Hierarchy

### 3.1 Document Tree Coordinates

```text
body (index.html:120)
├── div.luxury-2k-bg-container (index.html:125)
│   ├── video#bgSilkVideo (index.html:126)
│   └── div.luxury-2k-fallback (index.html:129)
├── header.sticky.top-4.z-40 (index.html:133)
│   └── div.apple-glass-nav (index.html:134)
│       └── a (index.html:137) [Logo & Title: "จองเสื้อกีฬาสี"]
├── main.flex-grow.max-w-5xl (index.html:150) [Primary Scroll Viewport]
│   ├── div#modeStatusBanner.apple-glass-card.hidden (index.html:153)
│   └── div.grid.grid-cols-1.lg:grid-cols-12.gap-8.items-start (index.html:176) [Studio Grid]
│       ├── Column 1 (Left / Preview Stage): div.lg:col-span-6 (index.html:179)
│       │   ├── div.w-full.flex.items-center.justify-between.px-2.mb-2 (index.html:182)
│       │   │   └── div.apple-segmented-control.relative (index.html:183)
│       │   │       ├── div#segmentedIndicator.apple-segmented-indicator (index.html:184)
│       │   │       ├── button#btnViewBack.apple-segmented-btn (index.html:185) ["ด้านหลัง"]
│       │   │       ├── button#btnViewFront.apple-segmented-btn.active (index.html:186) ["ด้านหน้า"]
│       │   │       ├── button#btnViewBoth.apple-segmented-btn (index.html:187) ["คู่หน้า-หลัง"]
│       │   │       └── button#btnView3D.apple-segmented-btn (index.html:188) ["3D 360°"]
│       │   └── div.jersey-stage-container.w-full.flex.py-2 (index.html:193)
│       │       └── div#jerseyCardWrapper.jersey-card-wrapper.relative (index.html:194)
│       │           ├── div#jerseyViewBackEl.jersey-hd-back.hidden (index.html:197)
│       │           │   └── svg#svgJerseyBack (index.html:198) [viewBox 0 0 780 1019]
│       │           │       ├── path#nameArcPath (index.html:201) [y=235-310]
│       │           │       ├── textPath#svgCurvedNameText (index.html:208)
│       │           │       └── text#svgBackNumber (index.html:215) [y=505, font-size=380]
│       │           ├── div#jerseyViewFrontEl.jersey-hd-front.hidden (index.html:222)
│       │           │   └── svg#svgJerseyFront (index.html:223) [viewBox 0 0 780 1019]
│       │           │       └── text#svgFrontNumber (index.html:225) [y=300, font-size=85]
│       │           ├── div#jerseyViewBothEl.jersey-hd-both-container (index.html:232)
│       │           │   ├── div.jersey-both-side-card [Front] (index.html:234)
│       │           │   └── div.jersey-both-side-card [Back] (index.html:246)
│       │           └── div#jerseyView3DEl.jersey-3d-stage-container.hidden (index.html:274)
│       │               ├── canvas#jersey3DCanvas (index.html:275)
│       │               ├── div.stage-3d-hint-badge (index.html:276)
│       │               └── button#btnReset3DView.stage-3d-reset-btn (index.html:279)
│       └── Column 2 (Right / Form): div.lg:col-span-6.space-y-4 (index.html:290)
│           └── div.apple-glass-card.p-6.sm:p-7.space-y-5 (index.html:292) [Configurator Card]
│               ├── Header: Title & Price (index.html:295-305)
│               │   ├── h1.text-xl.font-bold (index.html:297) ["เสื้อกีฬาสี สีชมพู"]
│               │   └── span.text-2xl.font-black (index.html:303) ["฿390"]
│               ├── Section 1: Email Lookup (index.html:307-337)
│               │   ├── div.onboarding-hint (index.html:310)
│               │   ├── input#inputEmail (index.html:324)
│               │   └── span#emailStatusBadge (index.html:319)
│               ├── Section 2: Form Content div#formContentSection.hidden (index.html:340-518)
│               │   ├── Personalization Inputs (index.html:343-383)
│               │   │   ├── input#inputScreenName (index.html:356)
│               │   │   ├── button#btnCapsName (index.html:351)
│               │   │   ├── input#inputScreenNumber (index.html:375)
│               │   │   └── button#btnRandomNumber (index.html:370)
│               │   ├── Size Selector Buttons (index.html:386-417)
│               │   │   ├── button#btnOpenSizeGuideLink (index.html:391)
│               │   │   └── button.size-btn.apple-size-btn (index.html:398-415) [2S..5XL]
│               │   └── Slip Upload Section div#slipUploadSection (index.html:420-516)
│               │       ├── Account Capsule & button#btnCopyAccount (index.html:438-454)
│               │       ├── div#slipDropzone & input#inputSlipFile (index.html:459-474)
│               │       └── div#slipPreviewCard.hidden (index.html:477-514)
│               ├── Section 3: Order Status div#orderStatusSection.hidden (index.html:522-541)
│               └── Section 4: CTA Buttons div#submitButtonSection.hidden (index.html:544-553)
│                   ├── button#btnResetForm.apple-btn-secondary (index.html:545)
│                   └── button#btnSubmit.apple-btn-primary (index.html:548)
├── Modal: div#modalSizeGuide (index.html:564)
├── Modal: div#modalConfig (index.html:677)
├── Modal: div#modalDatabase (index.html:738)
├── Modal: div#modalSlipLightbox (index.html:770)
├── Modal: div#qrPromptPayModal (index.html:792)
└── Container: div#toastContainer (index.html:790)
```

### 3.2 Scroll Container Mechanics
In `index.html` lines 67-117, an inline `<style>` block establishes the scroll container:
- `html`: `overflow: hidden; touch-action: none; overscroll-behavior: none;` (lines 71-77)
- `body`: `overflow: hidden; position: fixed; width: 100%; height: 100vh; touch-action: none; overscroll-behavior: none;` (lines 79-89)
- `main`: `overflow-y: auto !important; overflow-x: hidden !important; height: calc(100vh - 100px) !important; touch-action: pan-y !important;` (lines 101-106)
- `header`: `position: fixed; top: 0; left: 0; right: 0; z-index: 40; width: 100%;` (lines 109-116)

Key implication: The root viewport scroll is assigned directly to the `<main>` element, not `window` or `document.body`. Any sticky positioning (`position: sticky`) is computed relative to `<main>` as its scroll container.

---

## 4. Requirement Element Mapping

### 4.1 Requirement R1: Mobile Sticky Stage with 50% Overlap Anchor
- Target viewport: Screen widths `< 1024px` (`@media (max-width: 1023px)`).
- Anchor position: `top: 70px` (directly underneath the fixed floating header).
- Affected DOM nodes:
  1. `div.grid.grid-cols-1.lg:grid-cols-12` (`index.html:176`) - Grid container.
  2. `div.lg:col-span-6` (`index.html:179`) - Left column containing view switcher and stage.
  3. `div.jersey-stage-container` (`index.html:193`) - Stage container.
  4. `div.lg:col-span-6` (`index.html:290`) - Right column containing configurator card.
  5. `div.apple-glass-card` (`index.html:292`) - Configurator card.
- Current styling in `css/style.css`:
  - Lines 1020-1027:
    ```css
    @media (max-width: 1023px) {
      .grid.lg\:grid-cols-12 {
        gap: 18px;
      }
      .jersey-stage-container {
        min-height: 420px;
        padding: 18px;
      }
      .apple-glass-card {
        border-radius: 28px;
      }
    }
    ```
  - Lines 1044-1046:
    ```css
    @media (max-width: 520px) {
      .jersey-stage-container {
        min-height: 330px;
      }
    }
    ```
- Gap Analysis:
  - Currently, neither `.jersey-stage-container` nor the left column has `position: sticky`.
  - When scrolling on mobile, the entire preview scrolls away out of view.
  - In a standard CSS Grid with `grid-cols-1`, grid item row 1 has a track height equal to its own content, meaning a sticky child cannot stick beyond row 1 without layout adjustments (e.g. converting the grid to block display on mobile `< 1024px` or applying sticky stacking to the stage and floating sheet).
  - 50% Overlap Geometry:
    - Stage height on mobile is between 330px and 420px.
    - Top half contains: Segmented control (`y: 0`), collar (`y: 100-200`), curved name (`y: 235-310`), front chest number (`y: 300`), back number center (`y: 505`), and 3D canvas top half.
    - An overlap of ~50% from the bottom of the stage keeps all upper personalization coordinates and 3D interaction unobstructed.

### 4.2 Requirement R2: Apple Glass Pull Handle Gimmick
- Target element: `.mobile-sheet-handle` inside `.apple-glass-card` (`index.html:292`).
- Current state: Element does not exist in `index.html` or `css/style.css`.
- Required specifications:
  - DOM location: Inserted as the very first child of `.apple-glass-card` (`index.html:292`), immediately before the Title & Price Header (`index.html:295`).
  - Desktop behavior: Must remain hidden (`display: none` or Tailwind `lg:hidden`) for screens `>= 1024px`.
  - Mobile behavior: Visible on screens `< 1024px`.
  - Visual attributes: Centered pill, dimensions approximately 40px width by 4px-5px height, border-radius `9999px`, translucent glass styling (`rgba(255, 255, 255, 0.7)`), subtle glow/shadow (`0 1px 3px rgba(0, 0, 0, 0.12)`), margin `0 auto 12px auto`.

### 4.3 Requirement R3: Form Scroll & Touch Interactivity
- Form elements involved:
  - Email lookup: `input#inputEmail` (line 324)
  - Screen name: `input#inputScreenName` (line 356)
  - Screen number: `input#inputScreenNumber` (line 375)
  - Size buttons: 9 buttons `button.size-btn` (lines 398-415)
  - Slip file input: `input#inputSlipFile` (line 461)
  - Submit CTA: `button#btnSubmit` (line 548)
- Live preview bindings in `js/app.js`:
  - `updateLivePreview()` updates SVG text:
    - Back curved name: `svgCurvedNameText.textContent` (line 208)
    - Back number: `svgBackNumber.textContent` (line 215)
    - Front number: `svgFrontNumber.textContent` (line 225)
    - Both sides: `svgCurvedNameBoth`, `svgBothNumber`, `svgBothFrontNumber`
- 3D Canvas Interactivity in `js/stage3d.js`:
  - Canvas: `canvas#jersey3DCanvas` (line 275)
  - Control listener: `OrbitControls` on canvas element (line 73)
  - CSS rule: `touch-action: none` (style.css:756)
  - Requirement: The top half of the canvas must remain exposed above the overlapping sheet so user touches/drags can orbit the 3D model without interference.
- Touch Target Sizes:
  - Already enforced in `css/accessibility-fixes.css` (lines 67-87) with `min-height: 44px` for buttons.

### 4.4 Requirement R4: Zero Desktop Regressions
- Target viewport: Screen widths `>= 1024px`.
- Existing rules in `css/style.css`:
  - Lines 985-998:
    ```css
    @media (min-width: 1024px) {
      body {
        padding-bottom: 36px;
      }
      .mobile-liquid-status {
        display: none;
      }
      .apple-glass-nav {
        max-width: 620px;
        margin: 0 auto;
      }
    }
    ```
- Layout integrity:
  - The side-by-side layout uses Tailwind classes `grid grid-cols-1 lg:grid-cols-12` and `lg:col-span-6`.
  - All mobile sticky overlap CSS and pull handle styles MUST be wrapped in `@media (max-width: 1023px)`.
  - Zero overrides or layout changes may leak into the `>= 1024px` breakpoint.

---

## 5. Gatekeeper & Code Hygiene Status

- Tool: `gk_gatekeeper_scan`
- Scan result: `[OK] [GATEKEEPER PASS] Scanned 8 files. Zero invariant violations detected.`
- Key invariants to maintain during implementation:
  1. Maximum cyclomatic complexity <= 7 per function.
  2. Maximum line span <= 50 lines per function.
  3. No banned generic identifiers: `[data, res, req, item, val, temp, obj, info, payload, result, handleData, processData, doAction]`.
  4. Strictly zero emojis across code, comments, and markup.

---

## 6. Implementation Architecture Recommendation

To achieve the mobile sticky stage with 50% overlap anchor without breaking desktop or JavaScript bindings:

1. **DOM Adjustment (`index.html`)**:
   - Insert `<div class="mobile-sheet-handle" aria-hidden="true"></div>` directly inside `div.apple-glass-card` (at line 293).

2. **CSS Layout Adjustments (`css/style.css` under `@media (max-width: 1023px)`)**:
   - Set `.grid.lg\:grid-cols-12` to `display: block; position: relative;` on mobile so that the left column's containing block encompasses the entire grid height.
   - Configure the left column (`.lg\:col-span-6:first-child` or dedicated class) with:
     - `position: sticky; top: 70px; z-index: 10;`
   - Configure `.apple-glass-card` with:
     - `position: relative; z-index: 20;`
     - Margin and scroll anchoring to overlap ~50% of the stage frame.
     - Elevated glass shadow and smooth backdrop blur to present an unmistakable floating glass bottom sheet layer.
   - Configure `.mobile-sheet-handle`:
     - Displayed on mobile, hidden on desktop (`@media (min-width: 1024px) { display: none; }`).
     - Width: 40px, height: 4px, border-radius: 9999px, translucent white opal finish.
   - Ensure pointer events on the exposed top half of the stage (and `#jersey3DCanvas`) remain fully interactive.

---
Survey completed by Explorer Survey 1. Report is ready for handoff.
