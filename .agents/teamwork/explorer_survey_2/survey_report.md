# Styling, CSS Architecture, and Layout Survey Report

## Executive Summary
This investigation surveys the styling architecture, Tailwind configuration, glass design tokens, and responsive layout rules for the Pink configurator project in `d:\antigravity\pink`. It provides exact technical coordinates and specifications for implementing the mobile sticky stage with ~50% overlap anchor and the translucent Apple Glass pull handle pill (`.mobile-sheet-handle`), while preserving the desktop side-by-side 2-column layout with zero regressions.

---

## 1. CSS & Tailwind Architecture Overview

### 1.1 Stylesheet Pipeline & Precedence
The application loads stylesheets and style definitions in the following order:

| Source | File / Location | Scope & Precedence |
|---|---|---|
| Tailwind CSS CDN | `index.html:29` (`https://cdn.tailwindcss.com`) | Utility engine with custom color extension |
| FontAwesome 6.5.1 | `index.html:49` (CDN) | Icon library |
| Custom Stylesheet | `css/style.css` (`index.html:61`) | Primary design system, glass tokens, 3D studio, component styles (1054 lines) |
| Accessibility Fixes | `css/accessibility-fixes.css` (`index.html:64`) | Focus visible outlines, mobile touch target sizes (min 44px), glass blur tweaks (180 lines) |
| Inline Mobile Lock Style | `index.html:67-117` (`<style>` in `<head>`) | Prevents rubber-band zooming, sets fixed viewport, designates `<main>` as scroll container |

### 1.2 Tailwind Configuration (`index.html:30-46`)
Tailwind is loaded via CDN script with inline theme extension:
```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        apple: {
          pink: '#db2777',
          rose: '#f43f5e',
          dark: '#0f172a',
          slate: '#475569',
          light: '#f8fafc'
        }
      }
    }
  }
}
```
Default responsive breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### 1.3 Active Media Queries Across Project
Existing media query breakpoints in the CSS codebase:

| Breakpoint | File & Line | Target Components |
|---|---|---|
| `@media (min-width: 1024px)` | `css/style.css:985-998` | Desktop container padding, `.mobile-liquid-status` hidden, `.apple-glass-nav` max-width 620px |
| `@media (max-width: 1024px)` | `css/style.css:130-140` | 3D background polo scaling |
| `@media (max-width: 1023px)` | `css/style.css:1000-1036` | Mobile sticky header (`top: 14px`), `.apple-glass-nav` width, grid gap (18px), jersey container min-height (420px), card border-radius (28px) |
| `@media (max-width: 768px)` | `css/accessibility-fixes.css:168-174` | Mobile glass blur (`blur(36px) saturate(200%)`) |
| `@media (max-width: 520px)` | `css/style.css:1038-1053` | Mobile main horizontal padding (14px), jersey container min-height (330px), segmented button font-size |
| `@media (max-width: 520px)` | `css/accessibility-fixes.css:81-87` | Mobile segmented button touch height (min-height 44px) |

---

## 2. Component Analysis & Rule Locations

### 2.1 Floating Header (`.apple-glass-nav` & `<header>`)

#### HTML Coordinates (`index.html:133-147`)
```html
<header class="sticky top-4 z-40 px-4 sm:px-6 max-w-5xl mx-auto w-full">
  <div class="apple-glass-nav px-5 py-3 flex items-center justify-center">
    <!-- Brand Minimal Logo & Title -->
  </div>
</header>
```

#### CSS Rules & Dimensions
- `css/style.css:577-590`:
  ```css
  .apple-glass-nav {
    min-height: 70px;
    color: #0f172a;
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.04) 100%),
      rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.75);
    box-shadow:
      0 16px 40px -8px rgba(244, 114, 182, 0.10),
      inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.90);
    backdrop-filter: blur(14px) saturate(180%);
    -webkit-backdrop-filter: blur(14px) saturate(180%);
    border-radius: 9999px;
  }
  ```
- Inline `<style>` (`index.html:109-116`):
  ```css
  header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 40;
    width: 100%;
  }
  ```
- Height Analysis: The header has an explicit `min-height: 70px`. Positioned at `top: 0` (or `top: 14px`), it occupies the top 70px to 84px of the screen.
- Sticky Offset Relationship: The stage offset requirement `top: 70px` corresponds precisely to positioning elements immediately below this floating header bar.

### 2.2 Scroll Container Architecture (`<main>`)

#### Coordinates (`index.html:100-106`, `index.html:150`)
- In `<style>` (`index.html:101-106`):
  ```css
  main {
    overflow-y: auto !important;
    overflow-x: hidden !important;
    height: calc(100vh - 100px) !important;
    touch-action: pan-y !important;
  }
  ```
- In HTML (`index.html:150`):
  ```html
  <main class="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 relative z-10">
  ```
- Significance: Because `body` is `position: fixed; overflow: hidden`, `<main>` functions as the scroll container. Any element using `position: sticky` inside `<main>` sticks relative to `<main>`'s scrolling viewport.

### 2.3 Jersey Stage Container (`.jersey-stage-container` & `#jerseyCardWrapper`)

#### HTML Coordinates (`index.html:178-287`)
```html
<div class="lg:col-span-6 flex flex-col items-center justify-center space-y-4">
  <!-- View mode controls (Segmented View Switcher) -->
  <div class="w-full flex items-center justify-between px-2 mb-2">
    <div class="apple-segmented-control relative">...</div>
  </div>

  <!-- Floating Transparent Jersey Canvas -->
  <div class="jersey-stage-container w-full flex items-center justify-center py-2">
    <div id="jerseyCardWrapper" class="jersey-card-wrapper relative">
      <div id="jerseyViewBackEl" class="jersey-hd-back hidden">...</div>
      <div id="jerseyViewFrontEl" class="jersey-hd-front hidden">...</div>
      <div id="jerseyViewBothEl" class="jersey-hd-both-container">...</div>
      <div id="jerseyView3DEl" class="jersey-3d-stage-container hidden">
        <canvas id="jersey3DCanvas"></canvas>
      </div>
    </div>
  </div>
</div>
```

#### CSS Rules & Dimensions
- `css/style.css:708-726`:
  ```css
  .jersey-stage-container {
    min-height: 540px;
    height: 540px;
    border-radius: 34px;
    padding: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background:
      linear-gradient(150deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.05) 100%),
      rgba(255, 255, 255, 0.08) !important;
    border: 1px solid rgba(255, 255, 255, 0.80);
    box-shadow:
      inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95),
      0 16px 40px -12px rgba(244, 114, 182, 0.15);
    backdrop-filter: blur(14px) saturate(180%);
    -webkit-backdrop-filter: blur(14px) saturate(180%);
  }
  ```
- `css/style.css:728-739`:
  ```css
  .jersey-card-wrapper {
    width: 100%;
    max-width: 440px;
    height: 100%;
    max-height: 480px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: max-width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    filter: drop-shadow(0 26px 40px rgba(108, 23, 64, 0.22));
  }
  ```
- `css/style.css:1024-1027` (`@media (max-width: 1023px)`):
  ```css
  .jersey-stage-container {
    min-height: 420px;
    padding: 18px;
  }
  ```
- `css/style.css:1044-1046` (`@media (max-width: 520px)`):
  ```css
  .jersey-stage-container {
    min-height: 330px;
  }
  ```
- Important Bug / Finding: Line 710 defines an absolute `height: 540px;`. In media queries lines 1024 and 1044, `min-height` is specified, but `height` is not reset to `auto` or calibrated for mobile. On phone screens, this causes excessive stage vertical span.

### 2.4 Configurator Card (`.apple-glass-card`)

#### HTML Coordinates (`index.html:289-560`)
```html
<div class="lg:col-span-6 space-y-4">
  <div class="apple-glass-card p-6 sm:p-7 space-y-5">
    <!-- Header Title & Price -->
    <!-- 1. Email Address (Account Lookup) -->
    <!-- 2. Form Content (Hidden until email is valid) -->
    <!--    2.1 Personalization: Screen Name & Number -->
    <!--    2.2 Size Selector Grid -->
    <!--    2.3 Slip Upload Dropzone -->
    <!--    2.4 Submit Buttons -->
  </div>
</div>
```

#### CSS Rules (`css/style.css:623-636`, `css/accessibility-fixes.css:168-174`)
- Primary glass style (`css/style.css:623-636`):
  ```css
  .apple-glass-card {
    background:
      linear-gradient(145deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.05) 100%),
      rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.85);
    box-shadow:
      0 16px 40px -12px rgba(244, 114, 182, 0.14),
      0 8px 24px -4px rgba(15, 23, 42, 0.03),
      inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(14px) saturate(180%);
    -webkit-backdrop-filter: blur(14px) saturate(180%);
    border-radius: 32px;
    color: var(--liquid-ink);
  }
  ```
- Mobile blur override (`css/accessibility-fixes.css:168-174`):
  ```css
  @media (max-width: 768px) {
    .apple-glass-card,
    .apple-glass-nav {
      backdrop-filter: blur(36px) saturate(200%) !important;
      -webkit-backdrop-filter: blur(36px) saturate(200%) !important;
    }
  }
  ```
- Border-radius override (`css/style.css:1033-1035`):
  ```css
  @media (max-width: 1023px) {
    .apple-glass-card {
      border-radius: 28px;
    }
  }
  ```

---

## 3. Glass Design Tokens & Pill Handle Affordance

### 3.1 Design System Tokens Mapping

| Property | Token Name (DESIGN.md / CSS) | Value | Implementation Context |
|---|---|---|---|
| Primary Accent | `primary` / `--liquid-hot-pink` | `#ef4fa3` | Active indicators, focus rings, submit CTA |
| Pastel Accent | `accentRose` / `--liquid-rose` | `#ff8fbe` | Soft highlights, focus tints |
| Surface Ink | `textDark` / `--liquid-ink` | `#1e293b` | Form headings, labels, crisp contrast |
| Glass Border | `glassBorder` / `--liquid-border` | `rgba(255, 255, 255, 0.88)` | Sharp light specular rim |
| Inset Reflection | `--liquid-inner` | `inset 0 1.5px 2px rgba(255, 255, 255, 0.95)` | Apple top-edge bezel highlight |
| Elevation Shadow | `shadowLiquid` / `--liquid-shadow` | `0 30px 75px -12px rgba(15, 23, 42, 0.22), 0 15px 35px -10px rgba(153, 27, 88, 0.28)` | Multi-layer 3D bottom sheet depth |
| Capsule Radius | `pill` | `9999px` | Buttons, segmented control, pull handle |
| Card Radius | `lg` / `cardBorderRadius` | `28px` - `32px` | Configurator card perimeter |

### 3.2 Translucent Apple Glass Pull Handle Specification (`.mobile-sheet-handle`)

#### Requirement
Provide an unmistakable visual affordance of an elevated floating bottom sheet on mobile screens (< 1024px) while hiding it on desktop (>= 1024px).

#### Proposed HTML Placement (`index.html:293`)
Directly inside `.apple-glass-card` before the title row:
```html
<div class="apple-glass-card p-6 sm:p-7 space-y-5">
  <!-- Mobile Apple Glass Pull Handle Pill -->
  <div class="mobile-sheet-handle-container" aria-hidden="true">
    <div class="mobile-sheet-handle"></div>
  </div>

  <!-- Header Title & Price -->
  ...
```

#### Proposed CSS Rules
```css
/* ========================================================
   APPLE GLASS MOBILE SHEET PULL HANDLE
   ======================================================== */
.mobile-sheet-handle-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding-top: 2px;
  padding-bottom: 12px;
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
}

.mobile-sheet-handle {
  width: 44px;
  height: 5px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.90);
  border-radius: 9999px;
  box-shadow:
    0 2px 8px rgba(15, 23, 42, 0.12),
    inset 0 1px 1.5px rgba(255, 255, 255, 1);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.mobile-sheet-handle-container:hover .mobile-sheet-handle,
.mobile-sheet-handle-container:active .mobile-sheet-handle {
  width: 52px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow:
    0 3px 12px rgba(239, 79, 163, 0.25),
    inset 0 1px 2px rgba(255, 255, 255, 1);
}

@media (min-width: 1024px) {
  .mobile-sheet-handle-container,
  .mobile-sheet-handle {
    display: none !important;
  }
}
```

---

## 4. Mobile Sticky Stage & 50% Overlap Architecture

### 4.1 Structural Mechanics of the Overlap Anchor

```text
===========================================================
MOBILE VIEWPORT (< 1024px) SCHEMATIC
===========================================================
+---------------------------------------------------------+
| Fixed/Sticky Header: .apple-glass-nav (height: ~70px)   | y = 0px to 70px
+---------------------------------------------------------+
| STICKY JERSEY STAGE CONTAINER (position: sticky; top:70)| y = 70px to 270px (exposed 200px)
| - Apple Segmented View Switcher (Back, Front, Both, 3D) |
| - Upper 50% of Jersey:                                  |
|   * Collar, Ribbing                                     |
|   * School Crest Badge                                  |
|   * Front Chest Number (svgFrontNumber, y: 300)         |
|   * Back Curved Name (svgCurvedNameText, y: 195-310)    |
|   * Back Number Top Half (svgBackNumber, y: 505)        |
|   * 3D Torso Mesh & OrbitControls Dragging Area         |
+=========================================================+ y = 270px (Anchor Point)
| [ ==== Apple Glass Pull Handle (.mobile-sheet-handle) =]|
| ELEVATED APPLE GLASS CONFIGURATOR CARD                  | y = 270px to 100vh
| - Header & Price (฿390)                                 |
| - Email Account Lookup Field                            |
| - Personalization: Screen Name & Number Fields          |
| - Size Selection Buttons (XS to 4XL)                    |
| - Slip Upload & Order Confirmation Actions              |
| (Scrollable internal form: overflow-y: auto)            |
+---------------------------------------------------------+
```

### 4.2 Key Invariants & Calculations
1. **Header Clear**: Header is fixed at `top: 0` with `min-height: 70px`.
2. **Sticky Stage Clearance**: Stage sticks at `top: 70px`, leaving 0px gap between floating header bottom and stage top.
3. **Stage Height Calibration**:
   - Total stage height on mobile: ~380px to 400px (including view switcher).
   - 50% stage height: ~190px to 200px.
   - Anchor Point calculation: `top: calc(70px + 200px) = 270px`.
4. **Content Placement Verification within Exposed 50% (70px - 270px)**:
   - View mode buttons: ~44px.
   - SVG ViewBox total height: 1019 units.
   - Curved name arc: y = 195 to 310 (19% to 30% from top).
   - Front number: y = 300 (29% from top).
   - Back number: center y = 505, font-size = 380 (extends from y = 315 to y = 695). Top half is completely exposed.
   - 3D Shirt Model: centered at (0, 0, 0), upper chest and collar occupy upper 55% of canvas. Fully draggable via OrbitControls in exposed zone.

### 4.3 Overcoming CSS Grid Sticky Confinement
In CSS Grid (`grid grid-cols-1 lg:grid-cols-12`):
- When a grid item is in Row 1 of a single-column grid, its sticky boundary is limited to Row 1. Once Row 1 scrolls past, the sticky element is pushed off-screen.
- **Solution for `< 1024px`**: Set the container to block/flex display within `@media (max-width: 1023px)`.
  ```css
  @media (max-width: 1023px) {
    .grid.lg\:grid-cols-12 {
      display: flex;
      flex-direction: column;
      gap: 0;
      position: relative;
    }
  }
  ```
- This unites both columns into a single shared containing block on mobile, enabling:
  1. The Left Column (Stage) to remain `position: sticky; top: 70px; z-index: 10;`.
  2. The Right Column (Configurator Card) to scroll up and float over the Left Column with `position: relative; z-index: 20;`.
  3. The Configurator Card to anchor at `top: 270px` (or `top: calc(70px + 200px)`) with `position: sticky; top: 270px; z-index: 20;`.
  4. On desktop (`>= 1024px`), Tailwind's `lg:grid` and `lg:grid-cols-12` maintain standard grid layout with `display: grid`.

---

## 5. Form Scrollability & Touch Interactivity (R3)

### 5.1 Internal Form Scrolling
To ensure all form elements (name, number, size guide, slip upload) remain accessible without layout clipping or screen overflow:
```css
@media (max-width: 1023px) {
  .apple-glass-card {
    position: sticky;
    top: calc(70px + var(--mobile-stage-anchor, 200px));
    max-height: calc(100vh - 70px - var(--mobile-stage-anchor, 200px));
    max-height: calc(100dvh - 70px - var(--mobile-stage-anchor, 200px));
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
  }
}
```

### 5.2 3D Canvas Event Segregation
In `js/stage3d.js` and `css/style.css:751-760`:
```css
#jersey3DCanvas {
  width: 100% !important;
  height: 100% !important;
  outline: none;
  cursor: grab;
  touch-action: none;
}
```
- `#jersey3DCanvas` has `touch-action: none;` and intercepts pointer drag events for OrbitControls rotation.
- Because the card has `z-index: 20` and the stage has `z-index: 10`:
  - Touches on the card interact strictly with form elements.
  - Touches on the exposed top 50% stage interact with OrbitControls and view switcher buttons.
  - Zero pointer event crosstalk or touch contention.

---

## 6. Zero Desktop Regressions Assurance (R4)

### 6.1 Desktop Grid Integrity (`>= 1024px`)
The desktop layout is governed by:
- `index.html:176`: `<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">`
- Left column: `lg:col-span-6`
- Right column: `lg:col-span-6`
- Gap: `gap-8` (32px)
- Items alignment: `items-start`

### 6.2 Scoping Invariants
To guarantee zero desktop regressions:
1. All mobile sticky, flex column, and sheet handle styles MUST be bounded strictly inside `@media (max-width: 1023px)`.
2. `@media (min-width: 1024px)` explicitly enforces:
   ```css
   @media (min-width: 1024px) {
     .grid.lg\:grid-cols-12 {
       display: grid !important;
     }
     .mobile-sheet-handle-container,
     .mobile-sheet-handle {
       display: none !important;
     }
     .apple-glass-card {
       max-height: none !important;
       overflow-y: visible !important;
       position: static !important;
     }
   }
   ```
3. Existing desktop styles in `css/style.css:985-998` remain bit-for-bit preserved.

---

## 7. Concrete Style Recommendations Summary

| Component | Target File & Selector | Proposed Style Change |
|---|---|---|
| Glass Pull Handle | `css/style.css` (`.mobile-sheet-handle-container`, `.mobile-sheet-handle`) | Add 44px x 5px pill, translucent glass background (`rgba(255,255,255,0.72)`), 1px specular border, 16px backdrop blur, hidden on `>= 1024px` |
| Mobile Grid Layout | `css/style.css:1000` (`@media (max-width: 1023px) .grid.lg\:grid-cols-12`) | Change to `display: flex; flex-direction: column; gap: 0;` to enable cross-column sticky behavior |
| Sticky Stage Column | `css/style.css:1000` (`@media (max-width: 1023px) .grid.lg\:grid-cols-12 > div:first-child`) | Apply `position: sticky; top: 70px; z-index: 10;` |
| Stage Container Height | `css/style.css:1024` (`@media (max-width: 1023px) .jersey-stage-container`) | Reset `height: auto; max-height: 420px;` (clearing line 710's hardcoded 540px) |
| Sticky Configurator Card | `css/style.css:1000` (`@media (max-width: 1023px) .apple-glass-card`) | Apply `position: sticky; top: calc(70px + 200px); z-index: 20; max-height: calc(100vh - 270px); overflow-y: auto;` with top-elevation shadow |
| Desktop Regression Shield | `css/style.css:985` (`@media (min-width: 1024px)`) | Ensure `.mobile-sheet-handle` is `display: none !important;` and card is `position: static` |
