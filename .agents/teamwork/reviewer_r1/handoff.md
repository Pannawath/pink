# Review Round 1 Handoff Report: Mobile Scroll Jitter & Dual Switcher Verification

> [!WARNING] **Skepticism Disclaimer**
> Verified via live Chrome DevTools CDP emulation across mobile (390x844) and desktop (1280x800) viewports, including scroll hysteresis traces, internal form scroll events, and touch bypass contracts. However, real physical touchscreen gesture flings and iOS Safari rubber-band hardware momentum remain unverified on physical hardware.

## 1. What the prior attempt got wrong

### Issue 1: Configurator Form Card Selector Mismatch
- **Input:** User scrolls the configurator form card internally on mobile (`formCard.scrollTop = 100`).
- **Expected:** `isCollapsed` activates, `#headerSegmentedControl` becomes visible, and stage collapses cleanly.
- **Actual:** `isCollapsed` remained `false`. The scroll event listener was never fired, and the header switcher remained hidden.
- **Root Cause:** In `js/app.js`, `document.querySelector('.apple-glass-card')` was used. Because `#modeStatusBanner` is the first element with `.apple-glass-card` in `<main>`, the reference resolved to `#modeStatusBanner` (which is `display: none; scrollTop: 0`). The actual configurator form card was never attached to the scroll listener and its scroll offset was completely ignored.

### Issue 2: Accidental Drag Capture on Interactive Button/Link Child Elements
- **Input:** User taps an icon or text inside a button or link (e.g. `<i>` in `#btnRandomNumber`, `<img>` or `<span>` in brand logo link).
- **Expected:** Click/tap event executes natively without initiating background touch drag.
- **Actual:** `bindGlobalTouchScroll` checked `IGNORED_TAG_NAMES.has(targetElement.tagName)`. Because the child element tag was `I`, `IMG`, or `SPAN`, the guard failed, initiating an unintended drag on `mainElement`.
- **Root Cause:** Naive tag name lookup on `event.target` instead of hierarchy check (`targetElement.closest('button, a, input, textarea, select, canvas, label')`).

### Issue 3: Missing Boundary Guards for Modals, Desktop, and Multi-touch Gestures
- **Input:** (a) User touches during open modal; (b) User performs 2-finger pinch/zoom; (c) User returns to top within subpixel distance (e.g., 12px or 14px).
- **Expected:** (a) Background drag disabled during modal; (b) Multi-touch preserved for native zoom; (c) Stage switcher cleanly restored.
- **Actual:** (a) Background page dragged behind modal dialogs; (b) Multi-touch gestures conflicted with single-touch drag math; (c) In `app.js`, `currentScrollOffset < 10` failed to restore if momentum stopped between 10px and 15px.
- **Root Cause:** Missing `document.body.classList.contains('overflow-hidden')` guard, missing `touches.length > 1` cancellation, and overly strict exit threshold (< 10).

### Issue 4: Broken Brand Logo Return-to-Top Link
- **Input:** User taps the brand logo in the top navbar.
- **Expected:** Page smoothly scrolls back to the top (`main.scrollTop = 0`), restoring the stage switcher.
- **Actual:** Nothing scrolled.
- **Root Cause:** `index.html` had `href="javascript:window.scrollTo({top:0,behavior:'smooth'})"`. Because `<main>` is the scroll container with `overflow-y: auto`, `window.scrollTo` has zero effect on `main.scrollTop`.

## 2. What I changed

### Files Modified:
1. `index.html`:
   - Added explicit `id="configuratorCard"` to `<div id="configuratorCard" class="apple-glass-card p-6 sm:p-7 space-y-5">`.
   - Updated brand logo link to scroll both `main` and `window`: `href="javascript:(document.querySelector('main')?.scrollTo({top:0,behavior:'smooth'}),window.scrollTo({top:0,behavior:'smooth'}))"`.
   - Bumped cache bust query parameters: `style.css?v=24`, `app.js?v=12`.
2. `css/style.css`:
   - Added `#modeStatusBanner { position: static !important; max-height: none !important; overflow-y: visible !important; }` in mobile media query so the alert banner does not inherit sticky bottom sheet positioning.
3. `js/app.js`:
   - Cached `configuratorCard: document.getElementById('configuratorCard')` in `DOM` object.
   - Refactored `bindMobileScrollCollapse` to attach scroll listener and read `scrollTop` from `DOM.configuratorCard || document.getElementById('configuratorCard')`.
   - Adjusted `SCROLL_EXIT_THRESHOLD = 15` and condition `currentScrollOffset <= SCROLL_EXIT_THRESHOLD` for reliable subpixel restoration.
   - Extracted `shouldBypassTouchDrag(touchEvent)` with cognitive complexity <= 5 to cleanly handle desktop bypass, modal lock, multi-touch cancellation, interactive element delegation, and card internal scroll preservation.
   - Added `touchcancel` event listener to cleanly abort dragging states.

## 3. Verification Record

### Deep Verification (ran actual tests):
- **Gatekeeper Scan (`gk_gatekeeper_scan`):**
  - Result: `[OK] [GATEKEEPER PASS] Scanned 20 files. Zero invariant violations detected.`
- **Gatekeeper Claim (`gk_claim_done`):**
  - Result: `[OK] [CLAIM_DONE GRANTED] Gatekeeper verification passed.`
- **Live Chrome DevTools CDP Test Suite:**
  - **Initial Mobile State (390x844, scrollTop=0):**
    - `cardExists: true`, `cardMatchesDOM: true`, `mainScrollTop: 0`, `headerOpacity: 0`, `headerPointerEvents: none`, `stageOpacity: 1`, `stagePointerEvents: auto`, `stageTransform: none`.
  - **Scroll Down Past Threshold (scrollTop=50):**
    - `scrollHeightBefore: 879`, `scrollHeightAfter: 879` (`heightDelta: 0`, zero layout shift).
    - `hasCollapsedClass: true`, `headerOpacity: 1`, `headerPointerEvents: auto`, `stageOpacity: 0`, `stagePointerEvents: none`, `stageTransform: translateY(-44px)`.
  - **Scroll Back to Top (scrollTop=0):**
    - `hasCollapsedClass: false`, `headerOpacity: 0`, `headerPointerEvents: none`, `stageOpacity: 1`, `stagePointerEvents: auto`, `stageTransform: none`.
  - **Hysteresis Step Trace across Boundary Points [0, 25, 45, 30, 16, 14, 0.4]:**
    - Step 0 (scroll=0) -> collapsed: false (PASS)
    - Step 1 (scroll=25) -> collapsed: false (PASS)
    - Step 2 (scroll=45) -> collapsed: true (PASS)
    - Step 3 (scroll=30) -> collapsed: true (PASS, held by hysteresis)
    - Step 4 (scroll=16) -> collapsed: true (PASS, held by hysteresis)
    - Step 5 (scroll=14) -> collapsed: false (PASS, cleanly restored below 15px)
    - Step 6 (scroll=0.4) -> collapsed: false (PASS, subpixel top verified)
  - **Form Card Internal Scroll:**
    - Scrolled `configuratorCard.scrollTop = 60` -> `collapsedOnCardScroll: true`.
    - Scrolled `configuratorCard.scrollTop = 5` -> `restoredOnCardReturn: true`.
  - **Touch Drag Contract Evaluation:**
    - Input element: bypass=true
    - Icon inside button: bypass=true
    - Pull handle: bypass=false (drag allowed)
    - Card body: bypass=true (native internal scroll preserved)
    - Stage background: bypass=false (drag allowed)
    - Multi-touch (2 fingers): bypass=true
    - Modal open: bypass=true
  - **Dual Switcher Synchronization:**
    - Header Back click -> active on both, back SVG shown.
    - Header Both click -> active on both, both SVG shown.
    - Header Front click -> active on both, front SVG shown.
  - **Desktop Viewport Verification (1280x800):**
    - `headerDisplay: none`, `stageDisplay: flex`, `stageOpacity: 1`, `stageTransform: none`, `gridDisplay: grid`, `cardPosition: static`, `cardMaxHeight: none`, `cardOverflowY: visible`, `handleDisplay: none`.

### Shallow Verification (manual only):
- Visual inspection of transitions in Chrome DevTools viewport.

### Unverified aspects:
- Physical iOS Safari rubber-band hardware overscroll momentum on a real physical iPhone device.
- Physical Android Chrome dynamic URL bar address bar collapse/expand.

## 4. Known Issues
- `Minor Robustness Risk`: On devices with physical keyboards, virtual keyboard emergence on mobile may adjust `100dvh` units dynamically; internal card scroll maintains accessibility.
- `Shallow Verification`: Testing was performed via Chrome DevTools CDP emulation rather than physical device touch screens.

## 5. Remaining risk & next step
The implementation is solid, hardened, and verified with zero invariant violations and zero layout-shifting scroll jitter. The task is complete.
