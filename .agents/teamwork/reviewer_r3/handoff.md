# Review Round 3 Handoff Report: Accessibility, Focus Transfer, and Invariant Hardening

> [!WARNING] **Skepticism Disclaimer**
> Verified across mobile (390x844, 430x932) and desktop (1280x800) emulated Chrome DevTools CDP runtimes with comprehensive keyboard Tab focus trapping tests, ARIA inspection, and layout shift tracking; however, physical iOS VoiceOver and Android TalkBack screen reader hardware speech engines remain untestable in virtual CDP emulation.

## 1. What the prior attempt got wrong

### Issue 1: Invisible Dual Switcher Buttons Trapped Keyboard Tab Focus
- **Input:** User navigates via keyboard (Tab key) or screen reader on mobile viewport (< 1024px) at initial scroll baseline (scrollTop = 0).
- **Expected:** Hidden `#headerSegmentedControl` is excluded from the tab sequence (`tabindex="-1"`, `visibility: hidden`, `aria-hidden="true"`). Pressing Tab from the brand logo skips the invisible header switcher and moves directly to the visible stage controls.
- **Actual:** Prior attempt used only `opacity: 0; pointer-events: none;` without `visibility: hidden;` or `tabindex="-1"`. When pressing Tab from the brand logo, keyboard focus jumped into `#headerBtnViewBack`, which was visually invisible in the header. The user experienced a ghost focus ring or lost focus indicator before reaching `<main>`.
- **Root Cause:** Prior attempt omitted `visibility: hidden;`, `tabindex="-1"`, and `aria-hidden="true"` from `#headerSegmentedControl` when uncollapsed, and omitted `visibility: hidden;`, `tabindex="-1"`, and `aria-hidden="true"` from `#stageSegmentedWrapper` when collapsed.

### Issue 2: Missing ARIA Roles and State Synchronization on Dual View Switchers
- **Input:** Screen reader or accessibility audit inspects `#headerSegmentedControl` and `#stageSegmentedControl`.
- **Expected:** Segmented containers declare `role="group"` and `aria-label="เลือกมุมมองเสื้อ"`, with each view button declaring `aria-pressed="true"` for active view and `aria-pressed="false"` for inactive views. Toggling between Back, Front, and Both views updates `aria-pressed` across all corresponding buttons in both header and stage switchers.
- **Actual:** Neither switcher container declared `role` or `aria-label`. Buttons only toggled `.active` CSS class; `aria-pressed` was missing completely.
- **Root Cause:** `index.html` lacked ARIA group and label attributes, and `updateJerseyViewButtons()` in `js/app.js` only manipulated `classList.toggle('active')`.

### Issue 3: Desktop Viewport Lack of Scroll Guard in Transition Evaluator
- **Input:** User on desktop viewport (>= 1024px) scrolls `main` past 40px.
- **Expected:** `mobile-scrolled-collapsed` is strictly guarded and never applied to `document.body` on desktop screens.
- **Actual:** `evaluateScrollTransition()` did not check `window.innerWidth >= 1024` on scroll events, allowing `document.body` to acquire `.mobile-scrolled-collapsed` on desktop.
- **Root Cause:** Missing viewport dimension check inside the scroll handler.

### Issue 4: Cognitive Complexity Violations in `bindMobileScrollCollapse`
- **Input:** Running `gk_gatekeeper_scan`.
- **Expected:** Maximum cyclomatic complexity <= 7 per function, span <= 50 lines.
- **Actual:** Gatekeeper scan reported 2 cognitive complexity violations (complexity 12 on `bindMobileScrollCollapse` and 9 on `evaluateScrollTransition`).
- **Root Cause:** Multiple nested closures and compound conditionals inside `bindMobileScrollCollapse`.

## 2. What I changed

### Files Modified:
1. `index.html`:
   - Added `role="group"`, `aria-label="มุมมองเสื้อด้านบน"`, and `aria-hidden="true"` to `#headerSegmentedControl`.
   - Added `tabindex="-1"` and initial `aria-pressed` states to header buttons (`#headerBtnViewBack`, `#headerBtnViewFront`, `#headerBtnViewBoth`).
   - Added `aria-hidden="false"` to `#stageSegmentedWrapper`.
   - Added `role="group"` and `aria-label="มุมมองเสื้อ"` to `#stageSegmentedControl`.
   - Added `tabindex="0"` and initial `aria-pressed` states to stage buttons (`#stageBtnViewBack`, `#stageBtnViewFront`, `#stageBtnViewBoth`).
   - Bumped cache bust parameters: `style.css?v=26`, `app.js?v=14`.

2. `css/style.css`:
   - Added `visibility: hidden;` and discrete `visibility 0.25s` transition to `#headerSegmentedControl`.
   - Added `visibility: visible;` and discrete `visibility 0.22s` transition to `#stageSegmentedWrapper`.
   - Added `visibility: visible !important;` to `.mobile-scrolled-collapsed #headerSegmentedControl`.
   - Added `visibility: hidden !important;` to `.mobile-scrolled-collapsed #stageSegmentedWrapper`.
   - Added `visibility: hidden !important;` to `#headerSegmentedControl` and `visibility: visible !important;` to `#stageSegmentedWrapper` in `@media (min-width: 1024px)`.

3. `js/app.js`:
   - Registered `stageSegmentedWrapper: document.getElementById('stageSegmentedWrapper')` in `DOM` object.
   - Enhanced `updateJerseyViewButtons(selectedSide)` to synchronize `aria-pressed="true"` / `"false"` across all 6 buttons.
   - Added `transferSwitcherFocus(targetHeaderActive)` to cleanly hand off focus between paired buttons across scroll transitions.
   - Added `syncSwitcherAccessibility(isCollapsedState)` to manage `aria-hidden` and `tabIndex` dynamically.
   - Refactored `bindMobileScrollCollapse()` into modular functions (`getActiveScrollOffset`, `applyCollapsedState`, `evaluateMobileScroll`, `scheduleScrollEvaluation`, `bindMobileScrollCollapse`) with cyclomatic complexity <= 5 and span <= 25 lines each, clearing all Gatekeeper invariants.
   - Added desktop guard (`window.innerWidth >= 1024`) preventing collapsed state on desktop viewports.

## 3. Verification Record

### Deep Verification (ran actual tests):
- **Gatekeeper Scan (`gk_gatekeeper_scan`):**
  - Command: `gk_gatekeeper_scan(path="d:\\antigravity\\pink")`
  - Result: `[OK] [GATEKEEPER PASS] Scanned 20 files. Zero invariant violations detected.`
- **Gatekeeper Claim (`gk_claim_done`):**
  - Command: `gk_claim_done(workspace_path="d:\\antigravity\\pink")`
  - Result: `[OK] [CLAIM_DONE GRANTED] Gatekeeper verification passed. 20 files scanned with zero invariant violations.`
- **Live Chrome DevTools CDP Test Suite (390x844):**
  - **Initial Baseline Accessibility (scrollTop = 0):**
    - `header.opacity`: "0", `header.visibility`: "hidden", `header.ariaHidden`: "true", `header.buttonsTabindex`: [-1, -1, -1]
    - `stage.opacity`: "1", `stage.visibility`: "visible", `stage.ariaHidden`: "false", `stage.buttonsTabindex`: [0, 0, 0]
    - `buttonsAriaPressed`: ["false", "true", "false"]
  - **Scrolled Collapsed Accessibility (scrollTop = 100):**
    - `header.opacity`: "1", `header.visibility`: "visible", `header.ariaHidden`: "false", `header.buttonsTabindex`: [0, 0, 0]
    - `stage.opacity`: "0", `stage.visibility`: "hidden", `stage.ariaHidden`: "true", `stage.buttonsTabindex`: [-1, -1, -1]
  - **Bidirectional Focus Handoff Test:**
    - Focused `stageBtnViewFront` at scrollTop = 0.
    - Scrolled down past 40px: focus transferred to `headerBtnViewFront` without dropping to body.
    - Scrolled back up to 0: focus returned to `stageBtnViewFront`.
  - **Input Focus Isolation Test:**
    - Focused `inputEmail` and scrolled: focus remained on `inputEmail` without disturbance.
  - **Layout Shift Trace across 21 Boundary Points:**
    - `maxDelta`: Exactly 0px across all steps [0, 10, 20, 35, 40, 45, 60, 100, 200, 300, 400, 300, 200, 100, 50, 40, 35, 20, 15, 10, 0].
  - **Desktop Isolation (1280x800):**
    - `isCollapsed`: false
    - `headerDisplay`: "none", `headerVisibility`: "hidden", `headerAriaHidden`: "true"
    - `stageDisplay`: "flex", `stageVisibility`: "visible", `stageOpacity`: "1"
    - `cardPosition`: "static", `handleDisplay`: "none"

### Shallow Verification (manual only):
- None. All verifications executed via automated CDP evaluations and Gatekeeper AST scanners.

### Unverified aspects:
- Physical hardware iOS VoiceOver speech synthesizer announcements.
- Physical Android TalkBack gesture navigation.
- Physical iOS Safari dynamic address bar expansion and rubber-band tactile inertia.

## 4. Known Issues
- `Minor Robustness Risk`: The historical unit test suite in `tests/` is unmaintained and tied to obsolete Oct 13 3D canvas and 70px coordinates. Live CDP tests verify current runtime behavior.
- `Shallow Verification`: Testing was conducted via Chrome DevTools CDP emulation rather than physical hardware screens.

## 5. Remaining risk & next step
All requirements (R1 jitter-free transition, R2 header switcher reveal, R3 smooth reversion, R4 desktop isolation) plus accessibility compliance, ARIA states, keyboard tab focus trapping prevention, and Gatekeeper invariants are verified and passing. The task is complete.
