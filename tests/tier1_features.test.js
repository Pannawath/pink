const path = require('node:path');
const {
  assertEqual,
  assertTrue,
  assertNotNull,
  assertIncludes,
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
  computeStageOverlapMetrics
} = require('./engine/layout_evaluator.js');

const rootDirectory = path.resolve(__dirname, '..');
const htmlDocumentPath = path.join(rootDirectory, 'index.html');
const primaryStylePath = path.join(rootDirectory, 'css', 'style.css');

function loadTestContext() {
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

function findConfiguratorCardNode(parsedDocument) {
  const cardNodes = collectNodesByClass(parsedDocument, 'apple-glass-card');
  for (const candidateCard of cardNodes) {
    if (findNodeById(candidateCard, 'inputEmail')) {
      return candidateCard;
    }
  }
  return null;
}

function testR1_01_MobileGridFlexColumn(contextRecord) {
  const matchingRules = findRulesForSelector(contextRecord.mobileRules, '.grid.lg\\:grid-cols-12');
  assertTrue(matchingRules.length > 0, 'Mobile grid rule must exist');
  const declarationRecord = matchingRules[0].declarations;
  assertEqual(declarationRecord.display, 'flex', 'Grid display must be flex on mobile');
  assertEqual(declarationRecord['flex-direction'], 'column', 'Flex direction must be column');
}

function testR1_02_StageColumnStickyTop70px(contextRecord) {
  const matchingRules = findRulesForSelector(contextRecord.mobileRules, '.grid.lg\\:grid-cols-12 > div:first-child');
  assertTrue(matchingRules.length > 0, 'Stage column sticky rule must exist');
  const declarationRecord = matchingRules[0].declarations;
  assertEqual(declarationRecord.position, 'sticky', 'Stage column position must be sticky');
  assertEqual(declarationRecord.top, '70px', 'Stage column top anchor must be 70px');
  assertEqual(declarationRecord['z-index'], '10', 'Stage column z-index must be 10');
}

function testR1_03_JerseyStageResponsiveHeight(contextRecord) {
  const matchingRules = findRulesForSelector(contextRecord.mobileRules, '.jersey-stage-container');
  assertTrue(matchingRules.length > 0, 'Jersey stage container rule must exist');
  const declarationRecord = matchingRules[0].declarations;
  assertEqual(declarationRecord['max-height'], '420px', 'Stage max-height must be capped at 420px');
}

function testR1_04_CardStickyAnchorTop270px(contextRecord) {
  const matchingRules = findRulesForSelector(contextRecord.mobileRules, '.apple-glass-card');
  assertTrue(matchingRules.length > 0, 'Apple glass card rule must exist on mobile');
  const declarationRecord = matchingRules[0].declarations;
  assertEqual(declarationRecord.position, 'sticky', 'Card position must be sticky');
  assertIncludes(declarationRecord.top, '200px', 'Card top must anchor at calc(70px + 200px)');
  assertEqual(declarationRecord['z-index'], '20', 'Card z-index must be 20');
}

function testR1_05_UpperJerseyStage50PercentExposed() {
  const metricsRecord = computeStageOverlapMetrics(420, 70, 270);
  assertBetween(metricsRecord.overlapRatio, 0.45, 0.55, 'Overlap ratio must be approximately 50%');
  assertEqual(metricsRecord.exposedStageHeight, 200, 'Exposed stage height must be 200px');
}

function testR1_06_ZIndexHierarchyEnforced(contextRecord) {
  const stageRules = findRulesForSelector(contextRecord.mobileRules, '.grid.lg\\:grid-cols-12 > div:first-child');
  const cardRules = findRulesForSelector(contextRecord.mobileRules, '.apple-glass-card');
  const stageZIndex = Number.parseInt(stageRules[0].declarations['z-index'], 10);
  const cardZIndex = Number.parseInt(cardRules[0].declarations['z-index'], 10);
  assertTrue(cardZIndex > stageZIndex, 'Card z-index must exceed stage z-index for floating overlap');
}

function testR2_01_HandleContainerPresentInCard(contextRecord) {
  const handleContainers = collectNodesByClass(contextRecord.parsedDocument, 'mobile-sheet-handle-container');
  assertTrue(handleContainers.length > 0, 'Handle container must exist in DOM');
}

function testR2_02_HandlePillElementPresent(contextRecord) {
  const handlePills = collectNodesByClass(contextRecord.parsedDocument, 'mobile-sheet-handle');
  assertTrue(handlePills.length > 0, 'Handle pill element must exist in DOM');
}

function testR2_03_HandlePrecedesCardHeader(contextRecord) {
  const configuratorCard = findConfiguratorCardNode(contextRecord.parsedDocument);
  assertNotNull(configuratorCard, 'Configurator card node must exist');
  const firstChildNode = configuratorCard.children[0];
  assertNotNull(firstChildNode, 'Card must have at least one child node');
  assertTrue(firstChildNode.classList.includes('mobile-sheet-handle-container'), 'First child of card must be handle container');
}

function testR2_04_HandlePillGlassStylingTokens(contextRecord) {
  const matchingRules = findRulesForSelector(contextRecord.parsedStyleSheet.globalRules, '.mobile-sheet-handle');
  assertTrue(matchingRules.length > 0, 'Handle pill global styling must exist');
  const declarationRecord = matchingRules[0].declarations;
  assertIncludes(declarationRecord.background, '255, 255, 255', 'Handle pill must use translucent glass background');
  assertIncludes(declarationRecord['backdrop-filter'], 'blur', 'Handle pill must feature backdrop blur');
}

function testR2_05_HandlePillCapsuleDimensions(contextRecord) {
  const matchingRules = findRulesForSelector(contextRecord.parsedStyleSheet.globalRules, '.mobile-sheet-handle');
  const declarationRecord = matchingRules[0].declarations;
  assertEqual(declarationRecord.width, '44px', 'Handle pill width must be 44px');
  assertEqual(declarationRecord.height, '5px', 'Handle pill height must be 5px');
  assertEqual(declarationRecord['border-radius'], '9999px', 'Handle pill must be capsule shaped with 9999px radius');
}

function testR2_06_HandleAriaHiddenAttribute(contextRecord) {
  const handleContainers = collectNodesByClass(contextRecord.parsedDocument, 'mobile-sheet-handle-container');
  const targetAttribute = handleContainers[0].attributes['aria-hidden'];
  assertEqual(targetAttribute, 'true', 'Handle container must declare aria-hidden true');
}

function testR3_01_CardInternalOverflowScroll(contextRecord) {
  const matchingRules = findRulesForSelector(contextRecord.mobileRules, '.apple-glass-card');
  const declarationRecord = matchingRules[0].declarations;
  assertEqual(declarationRecord['overflow-y'], 'auto', 'Card must have internal overflow-y auto');
}

function testR3_02_CardTouchActionPanY(contextRecord) {
  const matchingRules = findRulesForSelector(contextRecord.mobileRules, '.apple-glass-card');
  const declarationRecord = matchingRules[0].declarations;
  assertEqual(declarationRecord['touch-action'], 'pan-y', 'Card must allow vertical touch scrolling via pan-y');
}

function testR3_03_CardMaxHeightBoundedToViewport(contextRecord) {
  const matchingRules = findRulesForSelector(contextRecord.mobileRules, '.apple-glass-card');
  const declarationRecord = matchingRules[0].declarations;
  assertIncludes(declarationRecord['max-height'], '- 270px', 'Card max-height must be bounded by viewport minus 270px');
}

function testR3_04_3DCanvasTouchActionNone(contextRecord) {
  const canvasNode = findNodeById(contextRecord.parsedDocument, 'jersey3DCanvas');
  assertNotNull(canvasNode, 'Jersey 3D canvas must exist in DOM');
  const canvasRules = findRulesForSelector(contextRecord.parsedStyleSheet.globalRules, '#jersey3DCanvas');
  assertTrue(canvasRules.length > 0, 'Canvas rule must exist');
  assertEqual(canvasRules[0].declarations['touch-action'], 'none', 'Canvas must retain touch-action none for OrbitControls');
}

function testR3_05_FormInputsAccessibleInDom(contextRecord) {
  assertNotNull(findNodeById(contextRecord.parsedDocument, 'inputEmail'), 'Email input must exist');
  assertNotNull(findNodeById(contextRecord.parsedDocument, 'inputScreenName'), 'Screen name input must exist');
  assertNotNull(findNodeById(contextRecord.parsedDocument, 'inputScreenNumber'), 'Screen number input must exist');
}

function testR3_06_SizeButtonsMeetTouchTargetRequirements(contextRecord) {
  const sizeButtonNodes = collectNodesByClass(contextRecord.parsedDocument, 'size-btn');
  assertEqual(sizeButtonNodes.length, 9, 'Must have 9 athletic size selection buttons');
}

function testR4_01_DesktopGridLayout12Columns(contextRecord) {
  const matchingRules = findRulesForSelector(contextRecord.desktopRules, '.grid.lg\\:grid-cols-12');
  assertTrue(matchingRules.length > 0, 'Desktop grid rule must exist');
  assertEqual(matchingRules[0].declarations.display, 'grid !important', 'Desktop must strictly preserve display grid');
}

function testR4_02_HandleHiddenOnDesktop(contextRecord) {
  const matchingRules = findRulesForSelector(contextRecord.desktopRules, '.mobile-sheet-handle-container');
  assertTrue(matchingRules.length > 0, 'Desktop handle concealment rule must exist');
  assertEqual(matchingRules[0].declarations.display, 'none !important', 'Handle must be hidden on desktop >= 1024px');
}

function testR4_03_CardPositionStaticOnDesktop(contextRecord) {
  const matchingRules = findRulesForSelector(contextRecord.desktopRules, '.apple-glass-card');
  assertTrue(matchingRules.length > 0, 'Desktop card rule must exist');
  assertEqual(matchingRules[0].declarations.position, 'static !important', 'Card must have static position on desktop');
}

function testR4_04_CardOverflowVisibleOnDesktop(contextRecord) {
  const matchingRules = findRulesForSelector(contextRecord.desktopRules, '.apple-glass-card');
  assertEqual(matchingRules[0].declarations['overflow-y'], 'visible !important', 'Card overflow-y must be visible on desktop');
}

function testR4_05_CardMaxHeightNoneOnDesktop(contextRecord) {
  const matchingRules = findRulesForSelector(contextRecord.desktopRules, '.apple-glass-card');
  assertEqual(matchingRules[0].declarations['max-height'], 'none !important', 'Card max-height must be none on desktop');
}

function testR4_06_StageColumnsStaticOnDesktop(contextRecord) {
  const matchingRules = findRulesForSelector(contextRecord.desktopRules, '.grid.lg\\:grid-cols-12 > div:first-child');
  assertTrue(matchingRules.length > 0, 'Desktop stage column reset rule must exist');
  assertEqual(matchingRules[0].declarations.position, 'static !important', 'Desktop stage column position must be static');
}

function runTier1Tests() {
  const contextRecord = loadTestContext();
  const testSuiteDefinitions = [
    { testIdentifier: 'T1.1_MobileGridFlexColumn', testRunner: () => testR1_01_MobileGridFlexColumn(contextRecord) },
    { testIdentifier: 'T1.2_StageColumnStickyTop70px', testRunner: () => testR1_02_StageColumnStickyTop70px(contextRecord) },
    { testIdentifier: 'T1.3_JerseyStageResponsiveHeight', testRunner: () => testR1_03_JerseyStageResponsiveHeight(contextRecord) },
    { testIdentifier: 'T1.4_CardStickyAnchorTop270px', testRunner: () => testR1_04_CardStickyAnchorTop270px(contextRecord) },
    { testIdentifier: 'T1.5_UpperJerseyStage50PercentExposed', testRunner: () => testR1_05_UpperJerseyStage50PercentExposed() },
    { testIdentifier: 'T1.6_ZIndexHierarchyEnforced', testRunner: () => testR1_06_ZIndexHierarchyEnforced(contextRecord) },
    { testIdentifier: 'T2.1_HandleContainerPresentInCard', testRunner: () => testR2_01_HandleContainerPresentInCard(contextRecord) },
    { testIdentifier: 'T2.2_HandlePillElementPresent', testRunner: () => testR2_02_HandlePillElementPresent(contextRecord) },
    { testIdentifier: 'T2.3_HandlePrecedesCardHeader', testRunner: () => testR2_03_HandlePrecedesCardHeader(contextRecord) },
    { testIdentifier: 'T2.4_HandlePillGlassStylingTokens', testRunner: () => testR2_04_HandlePillGlassStylingTokens(contextRecord) },
    { testIdentifier: 'T2.5_HandlePillCapsuleDimensions', testRunner: () => testR2_05_HandlePillCapsuleDimensions(contextRecord) },
    { testIdentifier: 'T2.6_HandleAriaHiddenAttribute', testRunner: () => testR2_06_HandleAriaHiddenAttribute(contextRecord) },
    { testIdentifier: 'T3.1_CardInternalOverflowScroll', testRunner: () => testR3_01_CardInternalOverflowScroll(contextRecord) },
    { testIdentifier: 'T3.2_CardTouchActionPanY', testRunner: () => testR3_02_CardTouchActionPanY(contextRecord) },
    { testIdentifier: 'T3.3_CardMaxHeightBoundedToViewport', testRunner: () => testR3_03_CardMaxHeightBoundedToViewport(contextRecord) },
    { testIdentifier: 'T3.4_3DCanvasTouchActionNone', testRunner: () => testR3_04_3DCanvasTouchActionNone(contextRecord) },
    { testIdentifier: 'T3.5_FormInputsAccessibleInDom', testRunner: () => testR3_05_FormInputsAccessibleInDom(contextRecord) },
    { testIdentifier: 'T3.6_SizeButtonsMeetTouchTargetRequirements', testRunner: () => testR3_06_SizeButtonsMeetTouchTargetRequirements(contextRecord) },
    { testIdentifier: 'T4.1_DesktopGridLayout12Columns', testRunner: () => testR4_01_DesktopGridLayout12Columns(contextRecord) },
    { testIdentifier: 'T4.2_HandleHiddenOnDesktop', testRunner: () => testR4_02_HandleHiddenOnDesktop(contextRecord) },
    { testIdentifier: 'T4.3_CardPositionStaticOnDesktop', testRunner: () => testR4_03_CardPositionStaticOnDesktop(contextRecord) },
    { testIdentifier: 'T4.4_CardOverflowVisibleOnDesktop', testRunner: () => testR4_04_CardOverflowVisibleOnDesktop(contextRecord) },
    { testIdentifier: 'T4.5_CardMaxHeightNoneOnDesktop', testRunner: () => testR4_05_CardMaxHeightNoneOnDesktop(contextRecord) },
    { testIdentifier: 'T4.6_StageColumnsStaticOnDesktop', testRunner: () => testR4_06_StageColumnsStaticOnDesktop(contextRecord) }
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
  runTier1Tests
};
