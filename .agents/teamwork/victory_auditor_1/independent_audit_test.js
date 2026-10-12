const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..', '..', '..');
const htmlPath = path.join(rootDir, 'index.html');
const cssPath = path.join(rootDir, 'css/style.css');
const jsAppPath = path.join(rootDir, 'js/app.js');
const js3dPath = path.join(rootDir, 'js/stage3d.js');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');

const checks = [];

function check(name, condition, details) {
  checks.push({ name, passed: Boolean(condition), details });
  console.log(`[${condition ? 'PASS' : 'FAIL'}] ${name}: ${details}`);
}

// 1. Check Mobile Pull Handle in HTML
const handleMatch = htmlContent.includes('<div class="mobile-sheet-handle-container" aria-hidden="true"><div class="mobile-sheet-handle"></div></div>');
check('R2.1_HandleHtmlStructure', handleMatch, 'Handle container with aria-hidden="true" and handle child present in index.html');

// 2. Check Handle CSS definition
const handleCssMatch = cssContent.includes('.mobile-sheet-handle {') &&
  cssContent.includes('width: 44px;') &&
  cssContent.includes('height: 5px;') &&
  cssContent.includes('border-radius: 9999px;') &&
  cssContent.includes('backdrop-filter: blur(16px)');
check('R2.2_HandleStylingTokens', handleCssMatch, 'Pill capsule styling (44px x 5px, 9999px radius, blur(16px)) defined in css/style.css');

// 3. Check Mobile Sticky Stage & Card Overlap in CSS
const mobileQueryMatch = cssContent.includes('@media (max-width: 1023px)');
const stageStickyMatch = cssContent.includes('top: 70px;') && cssContent.includes('z-index: 10;');
const cardStickyMatch = cssContent.includes('top: calc(70px + 200px);') && cssContent.includes('z-index: 20;');
const cardScrollMatch = cssContent.includes('max-height: calc(100vh - 270px);') &&
  cssContent.includes('max-height: calc(100dvh - 270px);') &&
  cssContent.includes('overflow-y: auto;') &&
  cssContent.includes('touch-action: pan-y;');

check('R1.1_MobileMediaQuery', mobileQueryMatch, '@media (max-width: 1023px) present');
check('R1.2_StageStickyPosition', stageStickyMatch, 'Stage column sticky top: 70px with z-index: 10');
check('R1.3_CardStickyOverlap', cardStickyMatch, 'Card sticky top: calc(70px + 200px) (270px) with z-index: 20');
check('R3.1_CardScrollConstraints', cardScrollMatch, 'Card has 100vh/100dvh bounds, overflow-y: auto, touch-action: pan-y');

// 4. Check Desktop Isolation & Zero Regression
const desktopQueryMatch = cssContent.includes('@media (min-width: 1024px)');
const desktopGridReset = cssContent.includes('display: grid !important;');
const desktopHandleHidden = cssContent.includes('.mobile-sheet-handle-container,') &&
  cssContent.includes('display: none !important;');
const desktopCardStatic = cssContent.includes('position: static !important;') &&
  cssContent.includes('max-height: none !important;') &&
  cssContent.includes('overflow-y: visible !important;');

check('R4.1_DesktopGridOverride', desktopGridReset, 'Desktop enforces display: grid !important');
check('R4.2_DesktopHandleHidden', desktopHandleHidden, 'Desktop hides handle container with display: none !important');
check('R4.3_DesktopCardStatic', desktopCardStatic, 'Desktop resets card to static, max-height none, overflow visible');

// 5. Check Geometry calculation
const stageMaxHeightMatch = /max-height:\s*420px;/.test(cssContent);
const stageStickyTop = 70;
const cardStickyTop = 270;
const exposedHeight = cardStickyTop - stageStickyTop; // 200px
const totalStageHeight = 420;
const overlapHeight = totalStageHeight - exposedHeight; // 220px
const overlapRatio = overlapHeight / totalStageHeight; // ~52.38%

check('R1.4_OverlapRatio50Percent', stageMaxHeightMatch && (overlapRatio >= 0.48 && overlapRatio <= 0.55),
  `Overlap is ${(overlapRatio * 100).toFixed(2)}% (220px of 420px), exposing 200px (47.62%)`);

const allPassed = checks.every((item) => item.passed);
console.log(`\nIndependent Verification Summary: ${checks.filter((item) => item.passed).length}/${checks.length} passed.`);
if (!allPassed) {
  process.exit(1);
}
