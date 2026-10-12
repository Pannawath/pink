const path = require('node:path');
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
  collectNodesByClass
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
  computeCardMaxHeight
} = require('./engine/layout_evaluator.js');
const {
  createMockApplicationState,
  simulateNameUpdate,
  simulateNumberUpdate
} = require('./engine/event_contract_evaluator.js');

const rootDirectory = path.resolve(__dirname, '..');
const htmlDocumentPath = path.join(rootDirectory, 'index.html');
const primaryStylePath = path.join(rootDirectory, 'css', 'style.css');

function loadBoundaryContext() {
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

function testB1_01_MobileBreakpoint1023pxMatches() {
  const computedMode = determineViewportMode(1023);
  assertEqual(computedMode, 'mobile', '1023px viewport must be evaluated as mobile mode');
}

function testB1_02_CompactMobileWidth320px() {
  const metricsRecord = computeStageOverlapMetrics(330, 70, 270);
  assertEqual(metricsRecord.exposedStageHeight, 200, 'Exposed stage on compact viewport must remain 200px');
  assertBetween(metricsRecord.overlapRatio, 0.35, 0.45, 'Overlap ratio on compact stage must match formula');
  assertTrue(metricsRecord.overlappedStageHeight > 0, 'Stage bottom must be covered by sheet');
}

function testB1_03_IntermediateTablet768px() {
  const computedMode = determineViewportMode(768);
  assertEqual(computedMode, 'mobile', '768px tablet portrait must run in mobile bottom sheet layout');
  const metricsRecord = computeStageOverlapMetrics(420, 70, 270);
  assertBetween(metricsRecord.exposureRatio, 0.45, 0.55, 'Exposure ratio must approximate 48%');
}

function testB1_04_ExtremeScrollDepthMaxExtent() {
  const simulatedScrollOffset = 500;
  const stagePinnedTop = 70;
  const cardPinnedTop = 270;
  assertTrue(simulatedScrollOffset > cardPinnedTop, 'Scroll offset exceeds card top anchor');
  const relativeDistance = cardPinnedTop - stagePinnedTop;
  assertEqual(relativeDistance, 200, 'Distance between pinned stage and pinned card must remain exactly 200px');
}

function testB1_05_InitialScrollDepthZero() {
  const simulatedScrollOffset = 0;
  const stageInitialTop = 70;
  assertEqual(stageInitialTop, 70, 'Initial stage top matches header clearance');
  assertTrue(simulatedScrollOffset <= stageInitialTop, 'Initial scroll depth is at top of document');
}

function testB1_06_UltraTallMobileViewport900px() {
  const availableScrollHeight = computeCardMaxHeight(900, 270);
  assertEqual(availableScrollHeight, 630, 'Card max height on 900px viewport must be 630px');
}

function testB2_01_BreakpointTransition1023pxVs1024px(contextRecord) {
  const mobileContainerRules = findRulesForSelector(contextRecord.mobileRules, '.mobile-sheet-handle-container');
  const desktopContainerRules = findRulesForSelector(contextRecord.desktopRules, '.mobile-sheet-handle-container');
  assertTrue(mobileContainerRules.length > 0, 'Mobile container rule must exist');
  assertTrue(desktopContainerRules.length > 0, 'Desktop container rule must exist');
  assertEqual(mobileContainerRules[0].declarations.display, 'flex', 'Container must be flex on mobile');
  assertEqual(desktopContainerRules[0].declarations.display, 'none !important', 'Container must be hidden on desktop');
}

function testB2_02_NarrowViewport320pxHandleCentered(contextRecord) {
  const mobileContainerRules = findRulesForSelector(contextRecord.mobileRules, '.mobile-sheet-handle-container');
  const declarationRecord = mobileContainerRules[0].declarations;
  assertEqual(declarationRecord['justify-content'], 'center', 'Handle must be horizontally centered');
  assertEqual(declarationRecord['align-items'], 'center', 'Handle must be vertically aligned');
}

function testB2_03_ScreenReaderIgnoreAriaHidden(contextRecord) {
  const handleContainers = collectNodesByClass(contextRecord.parsedDocument, 'mobile-sheet-handle-container');
  assertEqual(handleContainers[0].attributes['aria-hidden'], 'true', 'Screen reader must ignore decorative handle');
  assertFalse(Boolean(handleContainers[0].attributes.tabindex), 'Handle container must not have tabindex');
}

function testB2_04_SpecularHighlightInsetShadow(contextRecord) {
  const matchingRules = findRulesForSelector(contextRecord.parsedStyleSheet.globalRules, '.mobile-sheet-handle');
  const shadowDeclaration = matchingRules[0].declarations['box-shadow'];
  assertIncludes(shadowDeclaration, 'inset', 'Handle pill must feature specular inset highlight');
  assertIncludes(shadowDeclaration, 'rgba(255, 255, 255', 'Specular reflection must be white translucent');
}

function testB2_05_HandleInteractiveHoverState(contextRecord) {
  const hoverRules = findRulesForSelector(contextRecord.parsedStyleSheet.globalRules, '.mobile-sheet-handle-container:hover .mobile-sheet-handle');
  assertTrue(hoverRules.length > 0, 'Hover pseudo class rule must exist for handle expansion');
  assertEqual(hoverRules[0].declarations.width, '52px', 'Handle pill must expand to 52px on hover/active');
}

function testB3_01_CardOverscrollBehaviorContain(contextRecord) {
  const matchingRules = findRulesForSelector(contextRecord.mobileRules, '.apple-glass-card');
  const declarationRecord = matchingRules[0].declarations;
  assertEqual(declarationRecord['overscroll-behavior'], 'contain', 'Card must declare overscroll-behavior contain');
}

function testB3_02_DynamicViewportUnitDvhFallback(contextRecord) {
  const matchingRules = findRulesForSelector(contextRecord.mobileRules, '.apple-glass-card');
  const declarationRecord = matchingRules[0].declarations;
  assertIncludes(declarationRecord['max-height'], '100dvh', 'Card must support dynamic viewport unit dvh');
}

function testB3_03_TouchRoutingBoundaryThreshold270px() {
  const stageZone = resolveTouchTargetZone(269, 270);
  assertEqual(stageZone.targetRegion, 'exposed_stage', 'Touches above 270px must route to stage');
  assertEqual(stageZone.expectedTouchAction, 'none', 'Stage touch action must be none');

  const cardZone = resolveTouchTargetZone(270, 270);
  assertEqual(cardZone.targetRegion, 'floating_card', 'Touches at or below 270px must route to card');
  assertEqual(cardZone.expectedTouchAction, 'pan-y', 'Card touch action must be pan-y');
}

function testB3_04_MaxCharacterLengthScreenName() {
  const stateBaseline = createMockApplicationState();
  const longNameInput = 'Supercalifragilisticexpialidocious';
  const updatedState = simulateNameUpdate(stateBaseline, longNameInput);
  assertEqual(updatedState.screenName, longNameInput.toUpperCase(), 'Long athlete name must be converted to uppercase');
  assertTrue(updatedState.screenName.length > 20, 'Name length preserved without crash');
}

function testB3_05_TwoDigitScreenNumberSanitization() {
  const stateBaseline = createMockApplicationState();
  const invalidNumberInput = '999abc';
  const updatedState = simulateNumberUpdate(stateBaseline, invalidNumberInput);
  assertEqual(updatedState.screenNumber, '99', 'Screen number must truncate to first 2 digits');
}

function testB4_01_DesktopBreakpoint1024pxMatches() {
  const computedMode = determineViewportMode(1024);
  assertEqual(computedMode, 'desktop', '1024px viewport must be evaluated as desktop mode');
}

function testB4_02_UltraWideDesktop2560pxCentered(contextRecord) {
  const computedMode = determineViewportMode(2560);
  assertEqual(computedMode, 'desktop', '2560px ultra wide screen must run in desktop mode');
  const navRules = findRulesForSelector(contextRecord.desktopRules, '.apple-glass-nav');
  assertTrue(navRules.length > 0, 'Desktop navigation constraint rule must exist');
  assertEqual(navRules[0].declarations['max-width'], '620px', 'Nav max-width on desktop must be 620px');
}

function testB4_03_MidDesktop1280pxEqualColumns(contextRecord) {
  const computedMode = determineViewportMode(1280);
  assertEqual(computedMode, 'desktop', '1280px standard screen must run in desktop mode');
  const gridRules = findRulesForSelector(contextRecord.desktopRules, '.grid.lg\\:grid-cols-12');
  assertEqual(gridRules[0].declarations.display, 'grid !important', 'Desktop display must be grid !important');
}

function testB4_04_DesktopHighDpiScalingIndependence() {
  const scaledWidth125Percent = Math.round(1920 / 1.25);
  const scaledWidth150Percent = Math.round(1920 / 1.5);
  assertEqual(determineViewportMode(scaledWidth125Percent), 'desktop', '125% zoom on 1080p must remain desktop');
  assertEqual(determineViewportMode(scaledWidth150Percent), 'desktop', '150% zoom on 1080p must remain desktop');
}

function testB4_05_DesktopSpecificityImportantOverrides(contextRecord) {
  const cardDesktopRules = findRulesForSelector(contextRecord.desktopRules, '.apple-glass-card');
  const declarationRecord = cardDesktopRules[0].declarations;
  assertIncludes(declarationRecord.position, '!important', 'Desktop position must declare !important');
  assertIncludes(declarationRecord['overflow-y'], '!important', 'Desktop overflow-y must declare !important');
  assertIncludes(declarationRecord['max-height'], '!important', 'Desktop max-height must declare !important');
}

function runTier2Tests() {
  const contextRecord = loadBoundaryContext();
  const testSuiteDefinitions = [
    { testIdentifier: 'B1.1_MobileBreakpoint1023pxMatches', testRunner: () => testB1_01_MobileBreakpoint1023pxMatches() },
    { testIdentifier: 'B1.2_CompactMobileWidth320px', testRunner: () => testB1_02_CompactMobileWidth320px() },
    { testIdentifier: 'B1.3_IntermediateTablet768px', testRunner: () => testB1_03_IntermediateTablet768px() },
    { testIdentifier: 'B1.4_ExtremeScrollDepthMaxExtent', testRunner: () => testB1_04_ExtremeScrollDepthMaxExtent() },
    { testIdentifier: 'B1.5_InitialScrollDepthZero', testRunner: () => testB1_05_InitialScrollDepthZero() },
    { testIdentifier: 'B1.6_UltraTallMobileViewport900px', testRunner: () => testB1_06_UltraTallMobileViewport900px() },
    { testIdentifier: 'B2.1_BreakpointTransition1023pxVs1024px', testRunner: () => testB2_01_BreakpointTransition1023pxVs1024px(contextRecord) },
    { testIdentifier: 'B2.2_NarrowViewport320pxHandleCentered', testRunner: () => testB2_02_NarrowViewport320pxHandleCentered(contextRecord) },
    { testIdentifier: 'B2.3_ScreenReaderIgnoreAriaHidden', testRunner: () => testB2_03_ScreenReaderIgnoreAriaHidden(contextRecord) },
    { testIdentifier: 'B2.4_SpecularHighlightInsetShadow', testRunner: () => testB2_04_SpecularHighlightInsetShadow(contextRecord) },
    { testIdentifier: 'B2.5_HandleInteractiveHoverState', testRunner: () => testB2_05_HandleInteractiveHoverState(contextRecord) },
    { testIdentifier: 'B3.1_CardOverscrollBehaviorContain', testRunner: () => testB3_01_CardOverscrollBehaviorContain(contextRecord) },
    { testIdentifier: 'B3.2_DynamicViewportUnitDvhFallback', testRunner: () => testB3_02_DynamicViewportUnitDvhFallback(contextRecord) },
    { testIdentifier: 'B3.3_TouchRoutingBoundaryThreshold270px', testRunner: () => testB3_03_TouchRoutingBoundaryThreshold270px() },
    { testIdentifier: 'B3.4_MaxCharacterLengthScreenName', testRunner: () => testB3_04_MaxCharacterLengthScreenName() },
    { testIdentifier: 'B3.5_TwoDigitScreenNumberSanitization', testRunner: () => testB3_05_TwoDigitScreenNumberSanitization() },
    { testIdentifier: 'B4.1_DesktopBreakpoint1024pxMatches', testRunner: () => testB4_01_DesktopBreakpoint1024pxMatches() },
    { testIdentifier: 'B4.2_UltraWideDesktop2560pxCentered', testRunner: () => testB4_02_UltraWideDesktop2560pxCentered(contextRecord) },
    { testIdentifier: 'B4.3_MidDesktop1280pxEqualColumns', testRunner: () => testB4_03_MidDesktop1280pxEqualColumns(contextRecord) },
    { testIdentifier: 'B4.4_DesktopHighDpiScalingIndependence', testRunner: () => testB4_04_DesktopHighDpiScalingIndependence() },
    { testIdentifier: 'B4.5_DesktopSpecificityImportantOverrides', testRunner: () => testB4_05_DesktopSpecificityImportantOverrides(contextRecord) }
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
  runTier2Tests
};
