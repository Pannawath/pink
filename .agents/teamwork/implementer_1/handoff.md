# Implementation Handoff Report: Mobile Scroll Jitter & Dual Switcher Transition Fix

## 1. Summary of Changes
- Eliminated layout-shifting geometry overrides from `.mobile-scrolled-collapsed` in `css/style.css`:
  - Replaced height/max-height/margin collapsing on `#stageSegmentedWrapper` with non-layout-shifting `opacity: 0 !important; pointer-events: none !important; transform: translateY(-8px) scale(0.95);`.
  - Added smooth upward glide transition to `.jersey-stage-container` via `transform: translateY(-44px);` under `.mobile-scrolled-collapsed` to cleanly yield space and frame the jersey under the navbar without creating ghost gaps or altering container scrollHeight.
  - Removed volatile dynamic overrides to sticky `top` on first/second grid columns and `.apple-glass-card`, preserving sticky anchors and 50% stage overlap stability.
  - Added desktop override `transform: none !important;` for `.jersey-stage-container` and `#stageSegmentedWrapper` under `@media (min-width: 1024px)`.
- Replaced naive scroll listeners in `js/app.js` with threshold hysteresis and RAF batching:
  - `SCROLL_ENTER_THRESHOLD = 40` (activation threshold when scrolling down past 40px).
  - `SCROLL_EXIT_THRESHOLD = 10` (deactivation threshold when scrolling back to the top).
  - Batched scroll state evaluations via `window.requestAnimationFrame`.
  - Added touch routing filter to allow pull handle drags to scroll main while preserving native form internal scrolling.
  - Reset mobile scrolled state upon resizing to desktop viewports (>= 1024px).
- Incremented cache query parameters in `index.html` to prevent stale asset cache serving (`style.css?v=23`, `app.js?v=11`).

## 2. Exact Diff
```diff
diff --git a/css/style.css b/css/style.css
index c0d6ac6..371c91c 100644
--- a/css/style.css
+++ b/css/style.css
@@ -1134,6 +1134,7 @@ main.max-w-5xl {
     min-height: 460px;
     padding: 2px 18px 20px;
     overflow: visible;
+    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
   }
 
   .jersey-card-wrapper[data-view="both"] {
@@ -1199,13 +1200,10 @@ main.max-w-5xl {
   }
 
   #stageSegmentedWrapper {
-    max-height: 70px;
-    margin-bottom: 0;
-    overflow: hidden;
-    transition: max-height 0.28s cubic-bezier(0.16, 1, 0.3, 1),
-                margin-bottom 0.28s cubic-bezier(0.16, 1, 0.3, 1),
-                opacity 0.22s ease,
-                transform 0.22s ease;
+    opacity: 1;
+    pointer-events: auto;
+    transform: translateY(0) scale(1);
+    transition: opacity 0.22s ease, transform 0.22s ease;
   }
 
   /* Scrolled State for Bottom Sheet & Header Switcher */
@@ -1217,28 +1215,12 @@ main.max-w-5xl {
 
   .mobile-scrolled-collapsed #stageSegmentedWrapper {
     opacity: 0 !important;
-    max-height: 0px !important;
-    height: 0px !important;
-    padding-top: 0px !important;
-    padding-bottom: 0px !important;
-    margin-top: 0px !important;
-    margin-bottom: -12px !important;
     pointer-events: none !important;
-    transform: scale(0.85);
-  }
-
-  .mobile-scrolled-collapsed .grid.lg\:grid-cols-12 > div:first-child {
-    top: 4px !important;
+    transform: translateY(-8px) scale(0.95);
   }
 
-  .mobile-scrolled-collapsed .grid.lg\:grid-cols-12 > div:nth-child(2) {
-    top: 8px !important;
-  }
-
-  .mobile-scrolled-collapsed .apple-glass-card {
-    top: 8px !important;
-    max-height: calc(100vh - 75px) !important;
-    max-height: calc(100dvh - 75px) !important;
+  .mobile-scrolled-collapsed .jersey-stage-container {
+    transform: translateY(-44px);
   }
 }
 
@@ -1251,6 +1233,11 @@ main.max-w-5xl {
     display: flex !important;
     opacity: 1 !important;
     pointer-events: auto !important;
+    transform: none !important;
+  }
+
+  .jersey-stage-container {
+    transform: none !important;
   }
 }
 
diff --git a/index.html b/index.html
index 696b3ca..471fefc 100644
--- a/index.html
+++ b/index.html
@@ -66,7 +66,7 @@
   <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
 
   <!-- Custom CSS -->
-  <link rel="stylesheet" href="css/style.css?v=22">
+  <link rel="stylesheet" href="css/style.css?v=23">
   
   <!-- Accessibility Fixes CSS -->
   <link rel="stylesheet" href="css/accessibility-fixes.css?v=6">
@@ -853,7 +853,7 @@
   <script src="js/security.js?v=4"></script>
 
   <!-- Main JS -->
-  <script src="js/app.js?v=10"></script>
+  <script src="js/app.js?v=11"></script>
 
   <!-- Real WebGL 3D Jersey Stage Viewer -->
   <script src="js/stage3d.js?v=3"></script>
diff --git a/js/app.js b/js/app.js
index 7e19ceb..98b6133 100644
--- a/js/app.js
+++ b/js/app.js
@@ -864,49 +864,81 @@ window.addEventListener('resize', () => {
 });
 
 function bindMobileScrollCollapse() {
-  const mainEl = document.querySelector('main');
-  if (!mainEl) return;
-
-  const COLLAPSE_THRESHOLD = 30;
-  const updateCollapsedState = () => {
-    const cardEl = document.querySelector('.apple-glass-card');
-    const mainScrolled = mainEl.scrollTop > COLLAPSE_THRESHOLD;
-    const cardScrolled = cardEl && cardEl.scrollTop > COLLAPSE_THRESHOLD;
-    document.body.classList.toggle('mobile-scrolled-collapsed', mainScrolled || cardScrolled);
+  const mainElement = document.querySelector('main');
+  if (!mainElement) return;
+
+  const SCROLL_ENTER_THRESHOLD = 40;
+  const SCROLL_EXIT_THRESHOLD = 10;
+  let isCollapsed = false;
+  let scheduledFrameId = null;
+
+  const evaluateScrollTransition = () => {
+    scheduledFrameId = null;
+    const cardElement = document.querySelector('.apple-glass-card');
+    const mainScrollOffset = mainElement.scrollTop;
+    const cardScrollOffset = cardElement ? cardElement.scrollTop : 0;
+    const currentScrollOffset = Math.max(mainScrollOffset, cardScrollOffset);
+
+    if (!isCollapsed && currentScrollOffset > SCROLL_ENTER_THRESHOLD) {
+      isCollapsed = true;
+      document.body.classList.add('mobile-scrolled-collapsed');
+    } else if (isCollapsed && currentScrollOffset < SCROLL_EXIT_THRESHOLD) {
+      isCollapsed = false;
+      document.body.classList.remove('mobile-scrolled-collapsed');
+    }
   };
 
-  mainEl.addEventListener('scroll', updateCollapsedState, { passive: true });
-  const cardEl = document.querySelector('.apple-glass-card');
-  if (cardEl) {
-    cardEl.addEventListener('scroll', updateCollapsedState, { passive: true });
-  }
-
-  bindGlobalTouchScroll(mainEl);
+  const scheduleScrollEvaluation = () => {
+    if (scheduledFrameId === null) {
+      scheduledFrameId = window.requestAnimationFrame(evaluateScrollTransition);
+    }
+  };
+
+  mainElement.addEventListener('scroll', scheduleScrollEvaluation, { passive: true });
+  const cardElement = document.querySelector('.apple-glass-card');
+  if (cardElement) {
+    cardElement.addEventListener('scroll', scheduleScrollEvaluation, { passive: true });
+  }
+
+  window.addEventListener('resize', () => {
+    if (window.innerWidth >= 1024 && isCollapsed) {
+      isCollapsed = false;
+      document.body.classList.remove('mobile-scrolled-collapsed');
+    }
+  }, { passive: true });
+
+  bindGlobalTouchScroll(mainElement);
 }
 
-function bindGlobalTouchScroll(mainEl) {
-  const SKIP_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'CANVAS', 'LABEL']);
-  let touchStartY = 0;
-  let touchStartScroll = 0;
-  let isDragging = false;
+function bindGlobalTouchScroll(mainElement) {
+  const IGNORED_TAG_NAMES = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'CANVAS', 'LABEL']);
+  let touchStartClientY = 0;
+  let touchStartScrollTop = 0;
+  let isDraggingActive = false;
 
-  document.addEventListener('touchstart', (ev) => {
-    const target = ev.target;
-    if (SKIP_TAGS.has(target.tagName)) return;
-    touchStartY = ev.touches[0].clientY;
-    touchStartScroll = mainEl.scrollTop;
-    isDragging = true;
+  document.addEventListener('touchstart', (touchStartEvent) => {
+    const targetElement = touchStartEvent.target;
+    if (IGNORED_TAG_NAMES.has(targetElement.tagName)) return;
+    const isPullHandle = Boolean(targetElement.closest('.mobile-sheet-handle-container'));
+    const isInsideCard = Boolean(targetElement.closest('.apple-glass-card'));
+    if (!isPullHandle && isInsideCard) return;
+
+    touchStartClientY = touchStartEvent.touches[0].clientY;
+    touchStartScrollTop = mainElement.scrollTop;
+    isDraggingActive = true;
   }, { passive: true });
 
-  document.addEventListener('touchmove', (ev) => {
-    if (!isDragging) return;
-    const target = ev.target;
-    if (SKIP_TAGS.has(target.tagName)) return;
-    const deltaY = touchStartY - ev.touches[0].clientY;
-    mainEl.scrollTop = touchStartScroll + deltaY;
+  document.addEventListener('touchmove', (touchMoveEvent) => {
+    if (!isDraggingActive) return;
+    const targetElement = touchMoveEvent.target;
+    if (IGNORED_TAG_NAMES.has(targetElement.tagName)) return;
+    const dragDistance = touchStartClientY - touchMoveEvent.touches[0].clientY;
+    mainElement.scrollTop = touchStartScrollTop + dragDistance;
   }, { passive: true });
 
-  document.addEventListener('touchend', () => { isDragging = false; }, { passive: true });
+  document.addEventListener('touchend', () => {
+    isDraggingActive = false;
+  }, { passive: true });
 }
 
 function getActiveModalElements() {
```

## 3. Verification Record
- Chrome DevTools Live Verification (Mobile 390x844):
  - Initial state (scrollTop=0): scrollHeight=879px, headerOpacity=0, headerPointerEvents=none, stageOpacity=1, stagePointerEvents=auto.
  - Scrolled down (scrollTop=50): scrollHeight=879px (0px change, zero layout shift), headerOpacity=1, headerPointerEvents=auto, stageOpacity=0, stagePointerEvents=none, stageTransform=translateY(-44px).
  - Scrolled back up (scrollTop=0): scrollHeight=879px, headerOpacity=0, headerPointerEvents=none, stageOpacity=1, stagePointerEvents=auto, stageTransform=none.
  - Hysteresis empirical step trace: points [0, 20, 35, 45, 30, 20, 12, 5] -> isCollapsed state correctly triggered at 45, retained at 30, 20, 12, and cleared at 5. Zero thrashing.
  - Switcher button interactivity: clicking "headerBtnViewBack" synchronized state with "stageBtnViewBack" (active: true on both) and rendered the back preview SVG/3D view correctly.
- Chrome DevTools Live Verification (Desktop 1280x800):
  - headerDisplay: none, stageDisplay: flex, stageOpacity: 1, stageTransform: none, gridDisplay: grid.
- Gatekeeper Scan:
  - `gk_gatekeeper_scan`: [OK] [GATEKEEPER PASS] Scanned 20 files. Zero invariant violations detected.
  - `gk_claim_done`: [OK] [CLAIM_DONE GRANTED] Gatekeeper verification passed.
