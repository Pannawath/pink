/**
 * Independent Victory Audit Verification Script
 * Validates all 6 criteria from ORIGINAL_REQUEST.md (follow-up 2026-10-14T15:24:18Z)
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..', '..');
const appJsPath = path.join(projectRoot, 'js', 'app.js');
const styleCssPath = path.join(projectRoot, 'css', 'style.css');
const indexHtmlPath = path.join(projectRoot, 'index.html');

console.log('=== INDEPENDENT VICTORY AUDIT TEST RUNNER ===');
console.log('Target project:', projectRoot);

const appJs = fs.readFileSync(appJsPath, 'utf8').replace(/\r\n/g, '\n');
const styleCss = fs.readFileSync(styleCssPath, 'utf8').replace(/\r\n/g, '\n');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8').replace(/\r\n/g, '\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log('[PASS] ' + message);
    passCount++;
  } else {
    console.error('[FAIL] ' + message);
    failCount++;
  }
}

// 1. Emoji check
const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
assert(!emojiRegex.test(appJs) && !emojiRegex.test(styleCss) && !emojiRegex.test(indexHtml), 'Strictly zero emojis present in source files');

// 2. Anti-cheat / facade check
assert(!appJs.includes('// TODO') && !appJs.includes('// FIXME'), 'Zero lazy TODO/FIXME stubs in app.js');
assert(!/catch\s*\([^)]*\)\s*\{\s*\}/.test(appJs), 'Zero empty catch blocks in app.js');

// 3. Jitter-free mobile scroll transition (non-layout-shifting properties)
assert(!styleCss.includes('.mobile-scrolled-collapsed #stageSegmentedWrapper {\n    opacity: 0 !important;\n    max-height: 0px'), 'Deprecated layout-shifting max-height: 0px removed from stageSegmentedWrapper');
assert(styleCss.includes('.mobile-scrolled-collapsed #stageSegmentedWrapper') &&
       styleCss.includes('transform: translateY(-8px) scale(0.95);') &&
       styleCss.includes('visibility: hidden !important;'), 'stageSegmentedWrapper uses transform, visibility, and opacity instead of height collapsing');
assert(styleCss.includes('.mobile-scrolled-collapsed .jersey-stage-container {\n    transform: translateY(-44px);'), 'jersey-stage-container uses translateY(-44px) instead of top or margin collapses');

// 4. Header switcher reveal styles
assert(styleCss.includes('.mobile-scrolled-collapsed #headerSegmentedControl {\n    opacity: 1;\n    visibility: visible;\n    pointer-events: auto;'), 'headerSegmentedControl reveals with opacity 1, visibility visible, pointer-events auto');

// 5. Desktop isolation
assert(styleCss.includes('@media (min-width: 1024px)') &&
       styleCss.includes('#headerSegmentedControl {\n    display: none !important;\n    visibility: hidden !important;'), 'Desktop media query hides header switcher completely with display none and visibility hidden');
assert(styleCss.includes('#stageSegmentedWrapper {\n    display: flex !important;\n    opacity: 1 !important;\n    visibility: visible !important;'), 'Desktop media query preserves stage switcher with display flex and visibility visible');

// 6. Code complexity & modularity checks
const modularFunctions = [
  'transferSwitcherFocus',
  'syncSwitcherAccessibility',
  'getActiveScrollOffset',
  'applyCollapsedState',
  'evaluateMobileScroll',
  'scheduleScrollEvaluation',
  'bindMobileScrollCollapse',
  'shouldBypassTouchDrag',
  'bindGlobalTouchScroll'
];

modularFunctions.forEach(fnName => {
  assert(appJs.includes('function ' + fnName), 'Modular function ' + fnName + ' is implemented');
});

// 7. Hysteresis threshold verification
assert(appJs.includes('const ENTER_THRESHOLD = 40;') && appJs.includes('const EXIT_THRESHOLD = 15;'), 'Hysteresis buffer implemented with ENTER_THRESHOLD 40 and EXIT_THRESHOLD 15');

// 8. Desktop innerWidth guard in scroll evaluation
assert(appJs.includes('if (window.innerWidth >= 1024) {\n    applyCollapsedState(false);\n    return;\n  }'), 'Desktop scroll guard prevents collapsed state on viewports >= 1024px');

// 9. Accessibility ARIA attributes in HTML
assert(indexHtml.includes('id="headerSegmentedControl"') && indexHtml.includes('role="group"') && indexHtml.includes('aria-label="มุมมองเสื้อด้านบน"'), 'headerSegmentedControl declares accessibility role and Thai aria-label');
assert(indexHtml.includes('id="stageSegmentedControl"') && indexHtml.includes('role="group"') && indexHtml.includes('aria-label="มุมมองเสื้อ"'), 'stageSegmentedControl declares accessibility role and Thai aria-label');

console.log('----------------------------------------------------');
console.log(`Results: ${passCount} passed, ${failCount} failed`);

if (failCount > 0) {
  process.exit(1);
}
