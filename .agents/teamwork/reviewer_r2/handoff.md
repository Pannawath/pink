# Review Round 2 Handoff Report: Mobile Scroll Jitter & Dual Switcher Verification

> [!WARNING] **Skepticism Disclaimer**
> Verified across mobile (390x844, 430x932) and desktop (1280x800) live Chrome DevTools CDP runtimes, including boundary stress testing and layout shift metrics; however, physical iPhone Safari dynamic address bar animations and tactile hardware rubber-band inertia remain untestable in virtual CDP emulation.

## 1. What the prior attempt got wrong

### Issue 1: Brand Logo Return-to-Top Trapped in Collapsed State on Scrolled Card
- **Input:** User scrolls both `main` and `#configuratorCard` internally on mobile (`card.scrollTop = 100`, `main.scrollTop = 100`), then taps the brand logo in the header.
- **Expected:** Page smoothly returns to top, `#configuratorCard` resets to top, `isCollapsed` becomes `false`, restoring `#stageSegmentedWrapper` and hiding `#headerSegmentedControl`.
- **Actual:** `main.scrollTop` returned to 0, but `#configuratorCard.scrollTop` remained at 100. Because `evaluateScrollTransition` evaluates `Math.max(mainScrollOffset, cardScrollOffset)`, the resulting offset was 100 (> 15). `isCollapsed` remained `true`, keeping `#headerSegmentedControl` visible in the navbar and leaving `#stageSegmentedWrapper` concealed (`opacity: 0`).
- **Root Cause:** In `index.html`, the brand logo `href` only scrolled `main` and `window`, ignoring `configuratorCard`:
  `javascript:(document.querySelector('main')?.scrollTo({top:0,behavior:'smooth'}),window.scrollTo({top:0,behavior:'smooth'}))`
  Additionally, `resetToNewMode()` in `js/app.js` did not reset `DOM.configuratorCard.scrollTop = 0`.

### Issue 2: Missing `100dvh` Viewport Resilience on Main Scroll Container
- **Input:** Mobile browser (iOS Safari / Android Chrome) displays virtual keyboard or dynamic URL bar expands/collapses.
- **Expected:** `<main>` adapts dynamically to the visible viewport height without pushing bottom sheet controls below the fold or clipping.
- **Actual:** In `index.html` line 112, `main` declared only `height: calc(100vh - 60px) !important;`. Because `100vh` on mobile reflects the static large viewport height (`100lvh`), keyboard emergence or URL bar expansion causes `main` to overflow the screen.
- **Root Cause:** Missing `height: calc(100dvh - 60px) !important;` progressive enhancement override (which `.apple-glass-card` already has in `style.css` lines 1184-1185).

### Issue 3: Stale Historical Unit Test Suite in `tests/`
- **Input:** Running `node tests/run_all.js`.
- **Expected:** Test runner executes against current production DOM and styles.
- **Actual:** 8 tests failed in `tier1_features.test.js` and `tier3_combinations.test.js`.
- **Root Cause:** `tests/` was authored against commit `03fd272` (Oct 13), when 3D canvas existed, stage height was 420px, and sticky top was 70px. Subsequent repo owner commits (`68f8138` removing 3D, `382aaf3` setting 500px stage, `53931c` setting 18px gap) updated the production UI without updating `tests/`. Under Rule 10 (Ghost Edit Shield: "FORBIDDEN modifying or refactoring files/symbols not explicitly targeted"), `tests/` must remain untampered; live CDP verification serves as the ground truth.

## 2. What I changed

### Files Modified:
1. `index.html`:
   - Updated brand logo return-to-top handler to include `#configuratorCard`:
     `href="javascript:(document.querySelector('main')?.scrollTo({top:0,behavior:'smooth'}),document.getElementById('configuratorCard')?.scrollTo({top:0,behavior:'smooth'}),window.scrollTo({top:0,behavior:'smooth'}))"`.
   - Added `height: calc(100dvh - 60px) !important;` directly below `height: calc(100vh - 60px) !important;` on `main`.
   - Bumped cache bust parameters: `style.css?v=25`, `app.js?v=13`.
2. `js/app.js`:
   - Added `if (DOM.configuratorCard) { DOM.configuratorCard.scrollTop = 0; }` inside `resetToNewMode()`.

## 3. Verification Record

### Deep Verification (ran actual tests):
- **Gatekeeper Scan (`gk_gatekeeper_scan`):**
  - Command: `gk_gatekeeper_scan(path="d:\\antigravity\\pink")`
  - Result: `[OK] [GATEKEEPER PASS] Scanned 20 files. Zero invariant violations detected.`
- **Gatekeeper Claim (`gk_claim_done`):**
  - Command: `gk_claim_done(workspace_path="d:\\antigravity\\pink")`
  - Result: `[OK] [CLAIM_DONE GRANTED] Gatekeeper verification passed. 20 files scanned with zero invariant violations.`
- **Live Chrome DevTools CDP Test Suite:**
  - **Scroll Down Layout Shift Trace across 19 boundary steps [0, 10, 20, 35, 45, 60, 100, 200, 300, 400, 300, 200, 100, 50, 35, 20, 15, 10, 0]:**
    - `scrollHeightBefore`: 1218px across all steps.
    - `scrollHeightAfter`: 1218px across all steps.
    - `heightShift`: Exactly 0px across all steps (zero layout bounce, zero scroll height thrashing).
  - **Hysteresis Threshold Enforcement:**
    - Enter threshold (> 40px): activates `.mobile-scrolled-collapsed` at 45px.
    - Exit threshold (<= 15px): deactivates `.mobile-scrolled-collapsed` at 15px.
    - Rapid random oscillation test (100 iterations between 10px and 50px): 19 clean state transitions, zero flapping or jitter loops in the 16px-40px buffer zone.
  - **Brand Logo Return-to-Top Verification:**
    - Before click: `main.scrollTop = 105`, `card.scrollTop = 150`, `isCollapsed = true`.
    - After click: `main.scrollTop = 0`, `card.scrollTop = 0`, `isCollapsed = false`, `headerOpacity = 0`, `stageOpacity = 1`.
  - **Form Reset (`resetToNewMode`) Verification:**
    - Before reset: `card.scrollTop = 150`.
    - After reset: `card.scrollTop = 0`.
  - **Live Preview Under Overlap:**
    - Screen Name "PETER" and Screen Number "99" verified rendered on back SVG while form is scrolled up 250px over the jersey stage.
  - **Desktop Viewport Verification (1280x800):**
    - `headerSwitcherDisplay`: "none"
    - `stageSwitcherDisplay`: "flex", `stageSwitcherOpacity`: "1"
    - `gridDisplay`: "grid"
    - `handleContainerDisplay`: "none"
    - `cardPosition`: "static", `cardMaxHeight`: "none", `cardOverflowY`: "visible"
    - `stageColPosition`: "static"

### Shallow Verification (manual only):
- Visual screenshots captured via CDP and inspected at `scrollTop = 0`, `scrollTop = 60`, `scrollTop = 250` (front and back view).

### Unverified aspects:
- Real hardware iOS Safari rubber-band tactile overscroll momentum and physical finger flings on actual iPhones.
- Physical Android Chrome dynamic URL bar address bar collapse/expand on a physical handset.

## 4. Known Issues
- `Minor Robustness Risk`: The historical unit test suite in `tests/` is unmaintained and tied to obsolete Oct 13 3D canvas and 70px coordinates. Live CDP tests verify current runtime behavior.
- `Shallow Verification`: Testing was performed via Chrome DevTools CDP emulation rather than physical device hardware screens.

## 5. Remaining risk & next step
All requirements (R1 jitter-free transition, R2 header switcher reveal, R3 smooth reversion, R4 desktop isolation) are verified, tested, and passing Gatekeeper invariants. The task is complete.
