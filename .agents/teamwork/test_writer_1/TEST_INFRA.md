# E2E Test Infrastructure & Architecture Specification

## Project: Pink Jersey Configurator - Mobile Layered Glass Bottom Sheet

### 1. Overview & Test Architecture

The Pink configurator E2E test suite validates the mobile layered floating glass bottom sheet and sticky overlap interaction while enforcing strict zero-regression shields for desktop viewports. The test suite is implemented in Node.js (v24 native runtime) with zero external dependencies to ensure fast execution, deterministic evaluations, and complete test isolation.

The architecture follows the 4-tier testing methodology:
- Tier 1: Feature Coverage (R1 - R4)
- Tier 2: Boundary & Corner Cases
- Tier 3: Cross-Feature Combinations
- Tier 4: Real-World Scenarios

Total Test Cases: 54 automated assertions across 4 tiers.

---

### 2. Four-Tier Test Hierarchy

```text
tests/
├── run_all.js                     # Master test suite runner & CLI reporter
├── tier1_features.test.js         # Tier 1: Primary feature coverage (24 tests)
├── tier2_boundaries.test.js       # Tier 2: Boundary & corner cases (21 tests)
├── tier3_combinations.test.js     # Tier 3: Cross-feature combinations (6 tests)
├── tier4_scenarios.test.js        # Tier 4: Real-world user scenarios (3 tests)
└── engine/
    ├── test_assertions.js         # Strict assertion primitives with clear error diffs
    ├── document_parser.js         # Zero-dependency DOM parser for HTML hierarchies
    ├── stylesheet_parser.js       # CSS AST & media query rule extractor
    ├── layout_evaluator.js        # Mathematical geometry & touch routing engine
    └── event_contract_evaluator.js# Configurator state & SVG preview contract model
```

---

### 3. Tier Specifications

#### Tier 1: Feature Coverage (24 Tests)
Validates primary requirements defined in ORIGINAL_REQUEST.md:
- R1: Mobile Sticky Stage with 50% Overlap Anchor (< 1024px)
  - T1.1: Mobile grid container switches from CSS Grid to Flex Column
  - T1.2: Stage column pins at top: 70px with z-index: 10
  - T1.3: Jersey stage container resets fixed 540px desktop height to max-height: 420px
  - T1.4: Configurator card pins at top: calc(70px + 200px) with z-index: 20
  - T1.5: Mathematical geometry exposes top 200px (47.6%) of jersey stage
  - T1.6: Z-index layering: Card (20) floats over stage (10)
- R2: Apple Glass Pull Handle Gimmick (.mobile-sheet-handle)
  - T2.1: Container element .mobile-sheet-handle-container present in DOM
  - T2.2: Handle pill element .mobile-sheet-handle present in DOM
  - T2.3: Semantic hierarchy: Handle container precedes card header
  - T2.4: Translucent glass styling: White translucent background & backdrop-filter blur
  - T2.5: Physical pill dimensions: 44px width, 5px height, 9999px border-radius
  - T2.6: Accessibility contract: Container marked with aria-hidden="true"
- R3: Form Scroll & Touch Interactivity
  - T3.1: Card internal vertical scrolling enabled (overflow-y: auto)
  - T3.2: Card touch action configured to pan-y for smooth swipe scrolling
  - T3.3: Card max-height bounded to viewport minus 270px anchor offset
  - T3.4: 3D canvas (#jersey3DCanvas) preserves touch-action: none for OrbitControls
  - T3.5: All form inputs (#inputEmail, #inputScreenName, #inputScreenNumber) accessible
  - T3.6: All 9 athletic size selection buttons exist and meet touch target standards
- R4: Zero Desktop Regressions (>= 1024px)
  - T4.1: Desktop layout preserves display: grid !important with 12 columns
  - T4.2: Pull handle hidden on desktop via display: none !important
  - T4.3: Card resets to position: static !important on desktop
  - T4.4: Card resets overflow-y: visible !important on desktop
  - T4.5: Card resets max-height: none !important on desktop
  - T4.6: Stage column resets position: static !important on desktop

#### Tier 2: Boundary & Corner Cases (21 Tests)
Validates edge cases, breakpoints, and extreme scroll bounds:
- R1 Boundaries:
  - B1.1: Exact breakpoint boundary 1023px evaluates as mobile mode
  - B1.2: Compact mobile width 320px (iPhone SE) computes non-negative overlap bounds
  - B1.3: Intermediate tablet width 768px (iPad) preserves bottom sheet layout
  - B1.4: Extreme scroll depth (500px+) preserves 200px relative sticky clearance
  - B1.5: Initial scroll position 0 anchors stage cleanly below fixed header
  - B1.6: Tall mobile viewport (900px) dynamically calculates 630px card height
- R2 Boundaries:
  - B2.1: Breakpoint transition 1023px (flex) vs 1024px (none !important) verified
  - B2.2: 320px viewport centers handle container horizontally and vertically
  - B2.3: Screen readers bypass decorative handle (aria-hidden="true", no tabindex)
  - B2.4: Specular highlight inset shadow present in CSS box-shadow declarations
  - B2.5: Active/hover state expands pill width to 52px with accent pink glow
- R3 Boundaries:
  - B3.1: Card declares overscroll-behavior: contain to prevent parent scroll chaining
  - B3.2: Card declares 100dvh for dynamic mobile URL bar shifts
  - B3.3: Touch routing boundary at y = 270px divides OrbitControls from sheet scroll
  - B3.4: Athlete screen name sanitization supports long names up to boundary limits
  - B3.5: Screen number input sanitization truncates to max 2 digits
- R4 Boundaries:
  - B4.1: Exact desktop breakpoint 1024px evaluates as desktop mode
  - B4.2: Ultra-wide 2560px 2K display centers layout within max-w-5xl
  - B4.3: Mid-desktop 1280px viewport enforces 50/50 side-by-side grid columns
  - B4.4: High-DPI browser zoom factors (125%, 150%) maintain desktop grid mode
  - B4.5: Specificity overrides use !important guards to block mobile style leakage

#### Tier 3: Cross-Feature Combinations (6 Tests)
Validates interaction between multiple concurrent features:
- C3.1: Segmented view switching (Front, Back, Both, 3D) active under sticky overlap
- C3.2: Live SVG curved text and number rendering visible in top stage during form input
- C3.3: Touch action routing coordinates between #jersey3DCanvas (none) and card (pan-y)
- C3.4: Layer stacking order verified: Stage (10) < Card (20) < Header (40)
- C3.5: Dynamic viewport resize between mobile (390px) and desktop (1200px) transitions cleanly
- C3.6: Slip upload dropzone and preview card remain fully contained within scrolling card

#### Tier 4: Real-World Scenarios (3 Tests)
Validates complete user journeys from end to end:
- S4.1: Complete student mobile ordering journey (load -> sticky scroll -> email lookup -> personalization -> size selection -> 3D view toggle -> order submission)
- S4.2: Returning student order lookup in edit mode preserves mobile sticky layout
- S4.3: Reset form interaction restores pristine default state and baseline layout

---

### 4. Authoritative Expected Output Derivation

1. DOM Elements: Verified against index.html node trees parsed by document_parser.
2. Styling & Media Queries: Verified against css/style.css parsed by stylesheet_parser.
3. Overlap Geometry: Derived mathematically from layout specifications:
   - Header height: 70px
   - Mobile stage container max-height: 420px
   - Card sticky top anchor: calc(70px + 200px) = 270px
   - Exposed stage height: 270px - 70px = 200px (47.6%)
   - Overlapped stage height: (70px + 420px) - 270px = 220px (52.4%)
4. Touch Routing: Derived from browser touch action specifications:
   - Upper region (y: 70px - 270px): touch-action: none for Three.js OrbitControls
   - Lower region (y: 270px+): touch-action: pan-y for form scrolling

---

### 5. Execution Instructions

Run full E2E test suite:
```powershell
node tests/run_all.js
```

Run individual test tiers:
```powershell
node -e "const { runTier1Tests } = require('./tests/tier1_features.test.js'); console.log(runTier1Tests());"
node -e "const { runTier2Tests } = require('./tests/tier2_boundaries.test.js'); console.log(runTier2Tests());"
node -e "const { runTier3Tests } = require('./tests/tier3_combinations.test.js'); console.log(runTier3Tests());"
node -e "const { runTier4Tests } = require('./tests/tier4_scenarios.test.js'); console.log(runTier4Tests());"
```

Verify Gatekeeper compliance:
```powershell
# MCP Tool: gk_gatekeeper_scan path="d:/antigravity/pink"
```
