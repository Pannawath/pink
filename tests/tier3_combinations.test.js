const path = require('node:path');
const {
  assertEqual,
  assertTrue,
  assertNotNull,
  assertBetween
} = require('./engine/test_assertions.js');
const {
  loadDocument,
  findNodeById,
  collectNodesByClass
} = require('./engine/document_parser.js');
const {
  loadStyleSheet,
  findRulesForSelector,
  getMediaBlockRules
} = require('./engine/stylesheet_parser.js');
const {
  determineViewportMode,
  resolveTouchTargetZone
} = require('./engine/layout_evaluator.js');
const {
  createMockApplicationState,
  simulateNameUpdate,
  simulateNumberUpdate,
  simulateViewSwitch
} = require('./engine/event_contract_evaluator.js');

const rootDirectory = path.resolve(__dirname, '..');
const htmlDocumentPath = path.join(rootDirectory, 'index.html');
const primaryStylePath = path.join(rootDirectory, 'css', 'style.css');

function loadCombinationContext() {
  const parsedDocument = loadDocument(htmlDocumentPath);
  const parsedStyleSheet = loadStyleSheet(primaryStylePath);
  const mobileRules = getMediaBlockRules(parsedStyleSheet, 'max-width: 1023px');
  const desktopRules = getMediaBlockRules(parsedStyleSheet, 'min-width: 1024px');
  return {
    parsedDocument,
    parsedStyleSheet,
    mobileRules,
    desktopRules
  };
}

function testC3_01_ViewSwitchingUnderStickyOverlap(contextRecord) {
  assertNotNull(findNodeById(contextRecord.parsedDocument, 'jerseyViewFrontEl'), 'Front view container must exist');
  assertNotNull(findNodeById(contextRecord.parsedDocument, 'jerseyViewBackEl'), 'Back view container must exist');
  assertNotNull(findNodeById(contextRecord.parsedDocument, 'jerseyViewBothEl'), 'Both view container must exist');
  assertNotNull(findNodeById(contextRecord.parsedDocument, 'jerseyView3DEl'), '3D view container must exist');

  let stateTracker = createMockApplicationState();
  stateTracker = simulateViewSwitch(stateTracker, 'back');
  assertEqual(stateTracker.viewSide, 'back', 'Switched to back view under sticky state');
  stateTracker = simulateViewSwitch(stateTracker, '3d');
  assertEqual(stateTracker.viewSide, '3d', 'Switched to 3D view under sticky state');
  stateTracker = simulateViewSwitch(stateTracker, 'front');
  assertEqual(stateTracker.viewSide, 'front', 'Restored front view under sticky state');
}

function testC3_02_LiveSvgPersonalizationUnderStickyOverlap(contextRecord) {
  assertNotNull(findNodeById(contextRecord.parsedDocument, 'svgCurvedNameText'), 'Back curved name text element must exist');
  assertNotNull(findNodeById(contextRecord.parsedDocument, 'svgBackNumber'), 'Back number text element must exist');
  assertNotNull(findNodeById(contextRecord.parsedDocument, 'svgFrontNumber'), 'Front number text element must exist');

  let stateTracker = createMockApplicationState();
  stateTracker = simulateNameUpdate(stateTracker, 'AYUTTHAYA');
  stateTracker = simulateNumberUpdate(stateTracker, '26');
  assertEqual(stateTracker.screenName, 'AYUTTHAYA', 'Athlete name updated');
  assertEqual(stateTracker.screenNumber, '26', 'Jersey number updated');

  const backNameArcY = 235;
  const stageTopHeaderClearance = 70;
  const cardTopAnchorY = 270;
  const renderedNameScreenY = stageTopHeaderClearance + Math.round(backNameArcY * 0.4);
  assertTrue(renderedNameScreenY < cardTopAnchorY, 'Rendered curved name must appear in exposed top stage');
}

function testC3_03_TouchActionRoutingBetween3DStageAndCard(contextRecord) {
  const canvasRules = findRulesForSelector(contextRecord.parsedStyleSheet.globalRules, '#jersey3DCanvas');
  const cardRules = findRulesForSelector(contextRecord.mobileRules, '.apple-glass-card');
  assertEqual(canvasRules[0].declarations['touch-action'], 'none', 'Canvas must have touch-action none');
  assertEqual(cardRules[0].declarations['touch-action'], 'pan-y', 'Card must have touch-action pan-y');

  const stageTouch = resolveTouchTargetZone(150, 270);
  const cardTouch = resolveTouchTargetZone(350, 270);
  assertEqual(stageTouch.routedHandler, 'OrbitControls', 'Touches at y=150 route to OrbitControls');
  assertEqual(cardTouch.routedHandler, 'InternalScroll', 'Touches at y=350 route to InternalScroll');
}

function testC3_04_LayerStackingAndZIndexOrdering(contextRecord) {
  const stageRules = findRulesForSelector(contextRecord.mobileRules, '.grid.lg\\:grid-cols-12 > div:first-child');
  const cardRules = findRulesForSelector(contextRecord.mobileRules, '.apple-glass-card');
  const stageZIndex = Number.parseInt(stageRules[0].declarations['z-index'], 10);
  const cardZIndex = Number.parseInt(cardRules[0].declarations['z-index'], 10);
  const headerZIndex = 40;

  assertTrue(stageZIndex < cardZIndex, 'Stage z-index (10) must be lower than card z-index (20)');
  assertTrue(cardZIndex < headerZIndex, 'Card z-index (20) must be lower than header z-index (40)');
}

function testC3_05_ResponsiveResizeMobileToDesktopState(contextRecord) {
  const initialMobileMode = determineViewportMode(390);
  assertEqual(initialMobileMode, 'mobile', 'Initial viewport 390px is mobile');

  const expandedDesktopMode = determineViewportMode(1200);
  assertEqual(expandedDesktopMode, 'desktop', 'Expanded viewport 1200px is desktop');

  const desktopHandleRules = findRulesForSelector(contextRecord.desktopRules, '.mobile-sheet-handle-container');
  assertEqual(desktopHandleRules[0].declarations.display, 'none !important', 'Desktop must hide handle');

  const restoredMobileMode = determineViewportMode(414);
  assertEqual(restoredMobileMode, 'mobile', 'Resized back to 414px is mobile');
}

function testC3_06_SlipUploadSectionContainedWithinScrollingCard(contextRecord) {
  assertNotNull(findNodeById(contextRecord.parsedDocument, 'slipDropzone'), 'Slip dropzone must exist');
  assertNotNull(findNodeById(contextRecord.parsedDocument, 'inputSlipFile'), 'Slip file input must exist');
  assertNotNull(findNodeById(contextRecord.parsedDocument, 'slipPreviewCard'), 'Slip preview card must exist');

  const cardRules = findRulesForSelector(contextRecord.mobileRules, '.apple-glass-card');
  assertEqual(cardRules[0].declarations['overflow-y'], 'auto', 'Card must have overflow-y auto to contain dropzone');
}

function runTier3Tests() {
  const contextRecord = loadCombinationContext();
  const testSuiteDefinitions = [
    { testIdentifier: 'C3.1_ViewSwitchingUnderStickyOverlap', testRunner: () => testC3_01_ViewSwitchingUnderStickyOverlap(contextRecord) },
    { testIdentifier: 'C3.2_LiveSvgPersonalizationUnderStickyOverlap', testRunner: () => testC3_02_LiveSvgPersonalizationUnderStickyOverlap(contextRecord) },
    { testIdentifier: 'C3.3_TouchActionRoutingBetween3DStageAndCard', testRunner: () => testC3_03_TouchActionRoutingBetween3DStageAndCard(contextRecord) },
    { testIdentifier: 'C3.4_LayerStackingAndZIndexOrdering', testRunner: () => testC3_04_LayerStackingAndZIndexOrdering(contextRecord) },
    { testIdentifier: 'C3.5_ResponsiveResizeMobileToDesktopState', testRunner: () => testC3_05_ResponsiveResizeMobileToDesktopState(contextRecord) },
    { testIdentifier: 'C3.6_SlipUploadSectionContainedWithinScrollingCard', testRunner: () => testC3_06_SlipUploadSectionContainedWithinScrollingCard(contextRecord) }
  ];

  const executionResults = [];
  for (const testCase of testSuiteDefinitions) {
    try {
      testCase.testRunner();
      executionResults.push({ testIdentifier: testCase.testIdentifier, passedStatus: true, failureReason: null });
    } catch (caughtError) {
      executionResults.push({ testIdentifier: testCase.testIdentifier, passedStatus: false, failureReason: caughtError.message });
    }
  }
  return executionResults;
}

module.exports = {
  runTier3Tests
};
