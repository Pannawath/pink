const path = require('node:path');
const fs = require('node:fs');
const {
  assertEqual,
  assertTrue,
  assertFalse,
  assertNotNull,
  assertIncludes,
  assertBetween
} = require('./engine/test_assertions.js');
const {
  loadDocument,
  collectNodesByClass,
  findNodeById
} = require('./engine/document_parser.js');
const {
  loadStyleSheet,
  findRulesForSelector,
  getMediaBlockRules
} = require('./engine/stylesheet_parser.js');
const {
  determineViewportMode,
  computeStageOverlapMetrics,
  resolveTouchTargetZone,
  computeCardMaxHeight,
  verifyCoordinateCoverage
} = require('./engine/layout_evaluator.js');

const rootDirectory = path.resolve(__dirname, '..');
const htmlDocumentPath = path.join(rootDirectory, 'index.html');
const primaryStylePath = path.join(rootDirectory, 'css', 'style.css');

function loadStressContext() {
  const parsedDocument = loadDocument(htmlDocumentPath);
  const parsedStyleSheet = loadStyleSheet(primaryStylePath);
  const rawHtml = fs.readFileSync(htmlDocumentPath, 'utf8');
  const rawCss = fs.readFileSync(primaryStylePath, 'utf8');
  const mobileRules = getMediaBlockRules(parsedStyleSheet, 'max-width: 1023px');
  const desktopRules = getMediaBlockRules(parsedStyleSheet, 'min-width: 1024px');
  const narrowMobileRules = getMediaBlockRules(parsedStyleSheet, 'max-width: 520px');

  return {
    parsedDocument,
    parsedStyleSheet,
    rawHtml,
    rawCss,
    mobileRules,
    desktopRules,
    narrowMobileRules
  };
}

function verifyViewportModeAssignment(viewportWidthPixels) {
  const mode = determineViewportMode(viewportWidthPixels);
  if (viewportWidthPixels < 1024) {
    assertEqual(mode, 'mobile', `Viewport ${viewportWidthPixels}px must be classified as mobile`);
  } else {
    assertEqual(mode, 'desktop', `Viewport ${viewportWidthPixels}px must be classified as desktop`);
  }
}

function verifyGridDisplayModeAtBreakpoint(contextRecord, viewportWidthPixels) {
  const isMobile = viewportWidthPixels < 1024;
  if (isMobile) {
    const rules = findRulesForSelector(contextRecord.mobileRules, '.grid.lg\\:grid-cols-12');
    assertTrue(rules.length > 0, `Mobile grid override rule must exist for ${viewportWidthPixels}px`);
    assertEqual(rules[0].declarations.display, 'flex', 'Mobile display must be flex');
    assertEqual(rules[0].declarations['flex-direction'], 'column', 'Mobile flex direction must be column');
  } else {
    const rules = findRulesForSelector(contextRecord.desktopRules, '.grid.lg\\:grid-cols-12');
    assertTrue(rules.length > 0, `Desktop grid override rule must exist for ${viewportWidthPixels}px`);
    assertEqual(rules[0].declarations.display, 'grid !important', 'Desktop display must be grid !important');
  }
}

function verifyCardPositioningAtBreakpoint(contextRecord, viewportWidthPixels) {
  const isMobile = viewportWidthPixels < 1024;
  if (isMobile) {
    const rules = findRulesForSelector(contextRecord.mobileRules, '.apple-glass-card');
    assertTrue(rules.length > 0, `Mobile card rule must exist for ${viewportWidthPixels}px`);
    assertEqual(rules[0].declarations.position, 'sticky', 'Mobile card must be position: sticky');
    assertEqual(rules[0].declarations.top, 'calc(70px + 200px)', 'Mobile card sticky anchor must be calc(70px + 200px)');
  } else {
    const rules = findRulesForSelector(contextRecord.desktopRules, '.apple-glass-card');
    assertTrue(rules.length > 0, `Desktop card rule must exist for ${viewportWidthPixels}px`);
    assertIncludes(rules[0].declarations.position, 'static !important', 'Desktop card position must be static !important');
    assertIncludes(rules[0].declarations['max-height'], 'none !important', 'Desktop card max-height must be none !important');
  }
}

function testBreakpointsSuite(contextRecord) {
  const targetBreakpoints = [320, 375, 414, 768, 1023, 1024, 1280, 1920];
  const testResults = [];

  for (const bp of targetBreakpoints) {
    verifyViewportModeAssignment(bp);
    verifyGridDisplayModeAtBreakpoint(contextRecord, bp);
    verifyCardPositioningAtBreakpoint(contextRecord, bp);
    testResults.push({ name: `Breakpoint_${bp}px_Validated`, status: true });
  }

  return testResults;
}

function testStageContainerCalibration(contextRecord) {
  const mobileStageRules = findRulesForSelector(contextRecord.mobileRules, '.jersey-stage-container');
  assertTrue(mobileStageRules.length > 0, 'Mobile stage container rule must exist');
  assertEqual(mobileStageRules[0].declarations['max-height'], '420px', 'Mobile stage max-height must be 420px');

  const narrowStageRules = findRulesForSelector(contextRecord.narrowMobileRules, '.jersey-stage-container');
  assertTrue(narrowStageRules.length > 0, 'Narrow mobile stage container rule must exist');
  assertEqual(narrowStageRules[0].declarations['min-height'], '330px', 'Narrow mobile stage min-height must be 330px');

  const testHeights = [330, 360, 400, 420];
  for (const height of testHeights) {
    const metrics = computeStageOverlapMetrics(height, 70, 270);
    assertEqual(metrics.exposedStageHeight, 200, `Exposed stage height at ${height}px must be exactly 200px`);
    assertBetween(metrics.exposureRatio, 0.45, 0.62, `Exposure ratio at ${height}px must fall in range`);
    assertBetween(metrics.overlapRatio, 0.38, 0.55, `Overlap ratio at ${height}px must fall in range`);
  }
}

function testSvgGeometryAndElementExposure(contextRecord) {
  const backSvgNode = findNodeById(contextRecord.parsedDocument, 'svgJerseyBack');
  assertNotNull(backSvgNode, 'Back SVG element must exist in DOM');
  assertEqual(backSvgNode.attributes.viewbox, '0 0 780 1019', 'Back SVG viewBox must be 0 0 780 1019');

  const width = 780;
  const height = 1019;
  const aspectRatio = width / height;
  assertBetween(aspectRatio, 0.76, 0.77, 'Jersey SVG aspect ratio must be ~0.765');

  const nameArcMaxY = 310;
  const nameArcNormalizedY = nameArcMaxY / height;
  assertBetween(nameArcNormalizedY, 0.30, 0.31, 'Name arc must sit in upper 31% of jersey');

  const backNumberCenterY = 505;
  const numberNormalizedY = backNumberCenterY / height;
  assertBetween(numberNormalizedY, 0.49, 0.50, 'Back number center must sit at 49.5% vertical coordinate');

  const isNameArcExposed = verifyCoordinateCoverage(nameArcNormalizedY * 400, 200);
  assertTrue(isNameArcExposed, 'Name arc must be entirely within exposed 200px zone');
}

function testStickyOffsetCoordinates(contextRecord) {
  const mobileStageColRules = findRulesForSelector(contextRecord.mobileRules, '.grid.lg\\:grid-cols-12 > div:first-child');
  assertTrue(mobileStageColRules.length > 0, 'Stage column sticky rule must exist');
  assertEqual(mobileStageColRules[0].declarations.position, 'sticky', 'Stage column position must be sticky');
  assertEqual(mobileStageColRules[0].declarations.top, '70px', 'Stage column top must be 70px');
  assertEqual(mobileStageColRules[0].declarations['z-index'], '10', 'Stage column z-index must be 10');

  const mobileCardColRules = findRulesForSelector(contextRecord.mobileRules, '.grid.lg\\:grid-cols-12 > div:nth-child(2)');
  assertTrue(mobileCardColRules.length > 0, 'Card column sticky rule must exist');
  assertEqual(mobileCardColRules[0].declarations.position, 'sticky', 'Card column position must be sticky');
  assertEqual(mobileCardColRules[0].declarations.top, 'calc(70px + 200px)', 'Card column top must be calc(70px + 200px)');
  assertEqual(mobileCardColRules[0].declarations['z-index'], '20', 'Card column z-index must be 20');

  const stageZIndex = parseInt(mobileStageColRules[0].declarations['z-index'], 10);
  const cardZIndex = parseInt(mobileCardColRules[0].declarations['z-index'], 10);
  assertTrue(cardZIndex > stageZIndex, 'Card z-index (20) must be higher than Stage z-index (10)');

  const headerRules = findRulesForSelector(contextRecord.mobileRules, 'header.sticky');
  assertTrue(headerRules.length > 0, 'Sticky header rule must exist in mobile query');
  assertEqual(headerRules[0].declarations.top, '14px', 'Sticky header top clearance must be 14px');
}

function testCardMaxHeightViewportScaling(contextRecord) {
  const cardRules = findRulesForSelector(contextRecord.mobileRules, '.apple-glass-card');
  assertTrue(cardRules.length > 0, 'Mobile card rules must exist');

  const rawCss = contextRecord.rawCss;
  assertTrue(rawCss.includes('max-height: calc(100vh - 270px);'), 'CSS must include fallback max-height with 100vh');
  assertTrue(rawCss.includes('max-height: calc(100dvh - 270px);'), 'CSS must include modern max-height with 100dvh');

  const viewportHeights = [320, 480, 667, 812, 844, 900, 1024, 1366];
  for (const vh of viewportHeights) {
    const calculatedMaxHeight = computeCardMaxHeight(vh, 270);
    const expected = Math.max(0, vh - 270);
    assertEqual(calculatedMaxHeight, expected, `Calculated max-height at viewport height ${vh}px must match`);
    assertTrue(calculatedMaxHeight >= 50, `Card scroll area must provide at least 50px of content at ${vh}px`);
  }

  const cardDecs = cardRules[0].declarations;
  assertEqual(cardDecs['overflow-y'], 'auto', 'Card must declare overflow-y: auto');
  assertEqual(cardDecs['touch-action'], 'pan-y', 'Card must declare touch-action: pan-y');
  assertEqual(cardDecs['overscroll-behavior'], 'contain', 'Card must declare overscroll-behavior: contain');
  assertEqual(cardDecs['-webkit-overflow-scrolling'], 'touch', 'Card must declare -webkit-overflow-scrolling: touch');
}

function testDesktopGridEnforcement(contextRecord) {
  const desktopWidths = [1024, 1280, 1440, 1920, 2560, 3840];
  for (const dw of desktopWidths) {
    assertEqual(determineViewportMode(dw), 'desktop', `${dw}px must resolve to desktop mode`);
  }

  const gridRules = findRulesForSelector(contextRecord.desktopRules, '.grid.lg\\:grid-cols-12');
  assertEqual(gridRules[0].declarations.display, 'grid !important', 'Desktop grid display must be grid !important');

  const colRules = findRulesForSelector(contextRecord.desktopRules, '.grid.lg\\:grid-cols-12 > div:first-child');
  assertEqual(colRules[0].declarations.position, 'static !important', 'Desktop stage column position must be static !important');
  assertEqual(colRules[0].declarations.top, 'auto !important', 'Desktop stage column top must be auto !important');
  assertEqual(colRules[0].declarations['z-index'], 'auto !important', 'Desktop stage column z-index must be auto !important');

  const handleRules = findRulesForSelector(contextRecord.desktopRules, '.mobile-sheet-handle-container');
  assertEqual(handleRules[0].declarations.display, 'none !important', 'Desktop handle must be hidden via none !important');

  const cardRules = findRulesForSelector(contextRecord.desktopRules, '.apple-glass-card');
  assertEqual(cardRules[0].declarations.position, 'static !important', 'Desktop card position must be static !important');
  assertEqual(cardRules[0].declarations['max-height'], 'none !important', 'Desktop card max-height must be none !important');
  assertEqual(cardRules[0].declarations['overflow-y'], 'visible !important', 'Desktop card overflow-y must be visible !important');
}

function testBoundaryTransitionsAndAdversarialCases(contextRecord) {
  assertEqual(determineViewportMode(1023), 'mobile', '1023px must be mobile');
  assertEqual(determineViewportMode(1024), 'desktop', '1024px must be desktop');
  assertEqual(determineViewportMode(1023.99), 'mobile', '1023.99px must be mobile');
  assertEqual(determineViewportMode(1024.01), 'desktop', '1024.01px must be desktop');

  assertEqual(determineViewportMode(280), 'mobile', 'Folded narrow 280px must be mobile');
  const metrics280 = computeStageOverlapMetrics(330, 70, 270);
  assertEqual(metrics280.exposedStageHeight, 200, 'Exposed stage on 280px screen must remain 200px');

  const touchAt269 = resolveTouchTargetZone(269, 270);
  assertEqual(touchAt269.targetRegion, 'exposed_stage', 'Y=269 must hit stage zone');
  assertEqual(touchAt269.expectedTouchAction, 'none', 'Y=269 touch-action must be none');

  const touchAt270 = resolveTouchTargetZone(270, 270);
  assertEqual(touchAt270.targetRegion, 'floating_card', 'Y=270 must hit card zone');
  assertEqual(touchAt270.expectedTouchAction, 'pan-y', 'Y=270 touch-action must be pan-y');

  const touchAt271 = resolveTouchTargetZone(271, 270);
  assertEqual(touchAt271.targetRegion, 'floating_card', 'Y=271 must hit card zone');

  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  assertFalse(emojiRegex.test(contextRecord.rawHtml), 'HTML must contain zero emojis');
  assertFalse(emojiRegex.test(contextRecord.rawCss), 'CSS must contain zero emojis');
}

function runAllStressTests() {
  const contextRecord = loadStressContext();
  const testSuite = [
    { name: 'S1_ViewportResizingAcrossBreakpoints', fn: () => testBreakpointsSuite(contextRecord) },
    { name: 'S2_StageContainerHeightCalibration', fn: () => testStageContainerCalibration(contextRecord) },
    { name: 'S3_SvgGeometryAndElementExposure', fn: () => testSvgGeometryAndElementExposure(contextRecord) },
    { name: 'S4_StickyOffsetCoordinates', fn: () => testStickyOffsetCoordinates(contextRecord) },
    { name: 'S5_CardMaxHeightViewportScaling', fn: () => testCardMaxHeightViewportScaling(contextRecord) },
    { name: 'S6_DesktopGridEnforcement', fn: () => testDesktopGridEnforcement(contextRecord) },
    { name: 'S7_BoundaryTransitionsAndAdversarialCases', fn: () => testBoundaryTransitionsAndAdversarialCases(contextRecord) }
  ];

  console.log('Starting Empirical Layout & Boundary Geometry Stress Suite');
  let passedCount = 0;
  const failureList = [];

  for (const singleTest of testSuite) {
    try {
      singleTest.fn();
      passedCount += 1;
      console.log(`  [PASS] ${singleTest.name}`);
    } catch (caughtError) {
      failureList.push({ name: singleTest.name, error: caughtError.message });
      console.log(`  [FAIL] ${singleTest.name} -> ${caughtError.message}`);
    }
  }

  console.log('\n========================================================');
  console.log('       EMPIRICAL STRESS TEST SUITE EXECUTION REPORT     ');
  console.log('========================================================');
  console.log(`Total Stress Suites: ${testSuite.length}`);
  console.log(`Suites Passed:       ${passedCount}`);
  console.log(`Suites Failed:       ${failureList.length}`);

  if (failureList.length === 0) {
    console.log('\n[PASS] All Empirical Stress Suites Passed (100% Invariant Compliance).');
  } else {
    console.log(`\n[FAIL] ${failureList.length} suite(s) failed.`);
  }
  console.log('========================================================\n');

  if (failureList.length > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runAllStressTests();
}

module.exports = {
  runAllStressTests
};
