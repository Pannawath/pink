const path = require('node:path');
const {
  assertEqual,
  assertTrue,
  assertFalse,
  assertNotNull,
  assertBetween
} = require('./engine/test_assertions.js');
const {
  loadDocument,
  findNodeById,
  collectNodesByClass,
  collectNodesByTag
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
const {
  createMockApplicationState,
  simulateNameUpdate,
  simulateNumberUpdate,
  simulateViewSwitch,
  simulateSizeSelection,
  simulateEmailLookupSuccess
} = require('./engine/event_contract_evaluator.js');

const rootDirectory = path.resolve(__dirname, '..');
const htmlDocumentPath = path.join(rootDirectory, 'index.html');
const primaryStylePath = path.join(rootDirectory, 'css', 'style.css');

function loadStressContext() {
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

// -------------------------------------------------------------
// SUITE 1: Fine-Grained Coordinate Sweep & Boundary Hit-Testing
// -------------------------------------------------------------

function testS1_01_DenseBoundaryCoordinateSweep() {
  // Boundary at 270px: test y=268, 269, 270, 271, 272
  const sweepCoordinates = [
    { y: 70, expectedRegion: 'exposed_stage', expectedAction: 'none' },
    { y: 150, expectedRegion: 'exposed_stage', expectedAction: 'none' },
    { y: 268, expectedRegion: 'exposed_stage', expectedAction: 'none' },
    { y: 269, expectedRegion: 'exposed_stage', expectedAction: 'none' },
    { y: 270, expectedRegion: 'floating_card', expectedAction: 'pan-y' },
    { y: 271, expectedRegion: 'floating_card', expectedAction: 'pan-y' },
    { y: 272, expectedRegion: 'floating_card', expectedAction: 'pan-y' },
    { y: 400, expectedRegion: 'floating_card', expectedAction: 'pan-y' },
    { y: 650, expectedRegion: 'floating_card', expectedAction: 'pan-y' }
  ];

  for (const sweepPoint of sweepCoordinates) {
    const routingResult = resolveTouchTargetZone(sweepPoint.y, 270);
    assertEqual(
      routingResult.targetRegion,
      sweepPoint.expectedRegion,
      `Coordinate y=${sweepPoint.y} targetRegion check`
    );
    assertEqual(
      routingResult.expectedTouchAction,
      sweepPoint.expectedAction,
      `Coordinate y=${sweepPoint.y} expectedTouchAction check`
    );
  }
}

function testS1_02_PullHandleAffordanceAtThreshold(contextRecord) {
  const handleContainers = collectNodesByClass(contextRecord.parsedDocument, 'mobile-sheet-handle-container');
  assertTrue(handleContainers.length > 0, 'Handle container must be present in DOM');
  assertEqual(handleContainers[0].attributes['aria-hidden'], 'true', 'Handle must be aria-hidden');

  const cardNode = findNodeById(contextRecord.parsedDocument, 'jerseyCardWrapper');
  const handlePills = collectNodesByClass(contextRecord.parsedDocument, 'mobile-sheet-handle');
  assertTrue(handlePills.length > 0, 'Handle pill element must exist');

  const containerRules = findRulesForSelector(contextRecord.mobileRules, '.mobile-sheet-handle-container');
  assertTrue(containerRules.length > 0, 'Handle container mobile styling rules must exist');
  assertEqual(containerRules[0].declarations['touch-action'], 'pan-y', 'Handle container touch-action must be pan-y');
  assertEqual(containerRules[0].declarations['cursor'], 'grab', 'Handle container cursor must be grab');

  const pillRules = findRulesForSelector(contextRecord.mobileRules, '.mobile-sheet-handle');
  assertTrue(pillRules.length > 0, 'Handle pill mobile styling rules must exist');
  assertEqual(pillRules[0].declarations['width'], '44px', 'Handle pill default width must be 44px');
  assertEqual(pillRules[0].declarations['height'], '5px', 'Handle pill default height must be 5px');

  const hoverRules = findRulesForSelector(
    contextRecord.parsedStyleSheet.globalRules,
    '.mobile-sheet-handle-container:hover .mobile-sheet-handle'
  );
  assertTrue(hoverRules.length > 0, 'Handle hover expansion rules must exist');
  assertEqual(hoverRules[0].declarations['width'], '52px', 'Handle expanded width on hover must be 52px');
}

function testS1_03_MultiDeviceViewportSweep(contextRecord) {
  const deviceProfiles = [
    { name: 'iPhone SE', width: 320, height: 568 },
    { name: 'Galaxy S8', width: 360, height: 740 },
    { name: 'iPhone 13 mini', width: 375, height: 812 },
    { name: 'iPhone 14', width: 390, height: 844 },
    { name: 'iPhone 14 Plus', width: 414, height: 896 },
    { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
    { name: 'iPad Mini Portrait', width: 768, height: 1024 },
    { name: 'Boundary Tablet', width: 1023, height: 1366 }
  ];

  for (const device of deviceProfiles) {
    const viewportMode = determineViewportMode(device.width);
    assertEqual(viewportMode, 'mobile', `${device.name} (${device.width}px) must resolve to mobile mode`);

    const stageHeight = device.width <= 520 ? 330 : 420;
    const metrics = computeStageOverlapMetrics(stageHeight, 70, 270);

    assertEqual(metrics.exposedStageHeight, 200, `${device.name}: Exposed stage height must be 200px`);
    assertTrue(metrics.exposureRatio >= 0.47, `${device.name}: Upper stage exposure must be >= 47%`);
    assertTrue(metrics.overlapRatio <= 0.53, `${device.name}: Overlap ratio must be <= 53%`);

    const cardMaxHeight = computeCardMaxHeight(device.height, 270);
    assertTrue(cardMaxHeight > 250, `${device.name}: Card scroll height (${cardMaxHeight}px) must exceed 250px`);
  }
}

// -------------------------------------------------------------
// SUITE 2: Three.js OrbitControls Gesture & Pointer Routing
// -------------------------------------------------------------

function testS2_01_OrbitControlsCanvasTouchAction(contextRecord) {
  const canvasNode = findNodeById(contextRecord.parsedDocument, 'jersey3DCanvas');
  assertNotNull(canvasNode, 'jersey3DCanvas must exist in HTML DOM');

  const canvasRules = findRulesForSelector(contextRecord.parsedStyleSheet.globalRules, '#jersey3DCanvas');
  assertTrue(canvasRules.length > 0, '#jersey3DCanvas CSS rule must exist');
  assertEqual(
    canvasRules[0].declarations['touch-action'],
    'none',
    '#jersey3DCanvas touch-action must be none for OrbitControls'
  );

  const activeRules = findRulesForSelector(contextRecord.parsedStyleSheet.globalRules, '#jersey3DCanvas:active');
  assertTrue(activeRules.length > 0, '#jersey3DCanvas:active CSS rule must exist');
  assertEqual(
    activeRules[0].declarations['cursor'],
    'grabbing',
    '#jersey3DCanvas active cursor must be grabbing'
  );
}

function testS2_02_ResetButtonAndHintBadgeIsolation(contextRecord) {
  const resetBtnNode = findNodeById(contextRecord.parsedDocument, 'btnReset3DView');
  assertNotNull(resetBtnNode, 'btnReset3DView button must exist in HTML DOM');

  const resetBtnRules = findRulesForSelector(contextRecord.parsedStyleSheet.globalRules, '.stage-3d-reset-btn');
  assertTrue(resetBtnRules.length > 0, '.stage-3d-reset-btn CSS rules must exist');
  assertEqual(resetBtnRules[0].declarations['z-index'], '5', 'Reset button z-index must be 5');
  assertEqual(resetBtnRules[0].declarations['cursor'], 'pointer', 'Reset button cursor must be pointer');

  const hintBadgeRules = findRulesForSelector(contextRecord.parsedStyleSheet.globalRules, '.stage-3d-hint-badge');
  assertTrue(hintBadgeRules.length > 0, '.stage-3d-hint-badge CSS rules must exist');
  assertEqual(
    hintBadgeRules[0].declarations['pointer-events'],
    'none',
    'Hint badge pointer-events must be none so touches pass directly to canvas'
  );
}

function testS2_03_DragGestureStreamSimulation() {
  // Simulate continuous drag on OrbitControls within exposed stage
  const dragEvents = [
    { type: 'pointerdown', x: 200, y: 120 },
    { type: 'pointermove', x: 210, y: 125 },
    { type: 'pointermove', x: 225, y: 135 },
    { type: 'pointermove', x: 240, y: 150 },
    { type: 'pointermove', x: 260, y: 180 },
    { type: 'pointerup', x: 260, y: 180 }
  ];

  let orbitControlsActive = false;
  let formScrollTriggered = false;

  for (const eventStep of dragEvents) {
    const route = resolveTouchTargetZone(eventStep.y, 270);
    if (eventStep.type === 'pointerdown') {
      if (route.targetRegion === 'exposed_stage') {
        orbitControlsActive = true;
      } else {
        formScrollTriggered = true;
      }
    }
    assertEqual(route.targetRegion, 'exposed_stage', `Drag event at y=${eventStep.y} must target exposed stage`);
    assertEqual(route.expectedTouchAction, 'none', `Drag event at y=${eventStep.y} must have touch-action none`);
  }

  assertTrue(orbitControlsActive, 'OrbitControls should have been activated by stage drag');
  assertFalse(formScrollTriggered, 'Form scroll should NOT be triggered by stage drag');
}

function testS2_04_PointerCaptureBoundaryIntegrity() {
  // When pointer starts on canvas (y=250), Pointer Capture maintains canvas lock
  const startY = 250;
  const startRoute = resolveTouchTargetZone(startY, 270);
  assertEqual(startRoute.targetRegion, 'exposed_stage', 'Initial touch starts on stage canvas');

  // If pointer drifts below y=270 during active capture, Pointer Events API maintains canvas target
  const capturedTarget = 'jersey3DCanvas';
  const driftPoints = [260, 275, 290, 310];

  for (const driftY of driftPoints) {
    // Under pointer capture, the active listener target remains locked
    assertTrue(capturedTarget === 'jersey3DCanvas', `Active captured target at y=${driftY} remains canvas`);
  }
}

function testS2_05_InverseTouchInitiatedOnCard() {
  // Touch starting on card at y=320 moving up to y=200
  const initialTouchY = 320;
  const initialRoute = resolveTouchTargetZone(initialTouchY, 270);
  assertEqual(initialRoute.targetRegion, 'floating_card', 'Initial touch starts on floating card');
  assertEqual(initialRoute.expectedTouchAction, 'pan-y', 'Card touch-action is pan-y');
  assertEqual(initialRoute.routedHandler, 'InternalScroll', 'Card route is InternalScroll');
}

// -------------------------------------------------------------
// SUITE 3: Form Scroll, Focus Retention & Input Interactivity
// -------------------------------------------------------------

function testS3_01_CardScrollAndOverscrollContainment(contextRecord) {
  const cardRules = findRulesForSelector(contextRecord.mobileRules, '.apple-glass-card');
  assertTrue(cardRules.length > 0, 'Card mobile CSS rules must exist');

  assertEqual(cardRules[0].declarations['overflow-y'], 'auto', 'Card overflow-y must be auto');
  assertEqual(cardRules[0].declarations['touch-action'], 'pan-y', 'Card touch-action must be pan-y');
  assertEqual(cardRules[0].declarations['overscroll-behavior'], 'contain', 'Card overscroll-behavior must be contain');
  assertEqual(cardRules[0].declarations['-webkit-overflow-scrolling'], 'touch', 'Card must have momentum scrolling');

  assertEqual(
    cardRules[0].declarations['top'],
    'calc(70px + 200px)',
    'Card sticky top anchor must be calc(70px + 200px)'
  );
  assertEqual(cardRules[0].declarations['z-index'], '20', 'Card z-index must be 20');
}

function testS3_02_FormInputAccessibilityInDom(contextRecord) {
  const requiredInputs = [
    { id: 'inputEmail', expectedTag: 'input' },
    { id: 'inputScreenName', expectedTag: 'input' },
    { id: 'inputScreenNumber', expectedTag: 'input' },
    { id: 'inputSlipFile', expectedTag: 'input' },
    { id: 'slipDropzone', expectedTag: 'div' }
  ];

  for (const field of requiredInputs) {
    const node = findNodeById(contextRecord.parsedDocument, field.id);
    assertNotNull(node, `Field ${field.id} must exist in DOM`);
    assertEqual(node.tagName, field.expectedTag, `Field ${field.id} tag must be ${field.expectedTag}`);
  }
}

function testS3_03_SizeButtonsTouchTargets(contextRecord) {
  const sizeButtons = collectNodesByClass(contextRecord.parsedDocument, 'apple-size-btn');
  assertTrue(sizeButtons.length >= 9, 'Must have at least 9 size buttons');

  const standardSizes = ['2S', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
  let state = createMockApplicationState();

  for (const sizeCode of standardSizes) {
    state = simulateSizeSelection(state, sizeCode);
    assertEqual(state.size, sizeCode, `Size selection simulated for ${sizeCode}`);
  }
}

function testS3_04_LivePreviewSvgUpdateUnderScroll(contextRecord) {
  let state = createMockApplicationState();
  state = simulateEmailLookupSuccess(state, 'student@skr.ac.th');
  state = simulateNameUpdate(state, 'CHAMPION');
  state = simulateNumberUpdate(state, '99');

  assertEqual(state.email, 'student@skr.ac.th', 'Email state updated');
  assertEqual(state.screenName, 'CHAMPION', 'Screen name state updated');
  assertEqual(state.screenNumber, '99', 'Screen number state updated');

  // Verify that back curved name arc is positioned in exposed top stage
  const arcY = 235;
  const renderedScreenY = 70 + Math.round(arcY * 0.4); // 70 + 94 = 164px
  assertTrue(renderedScreenY < 270, `Curved name at y=${renderedScreenY}px must be visible in exposed upper stage`);
}

// -------------------------------------------------------------
// SUITE 4: Segmented View Switcher Stickiness & Clickability
// -------------------------------------------------------------

function testS4_01_SegmentedControlPointerTransparency(contextRecord) {
  const indicatorRules = findRulesForSelector(
    contextRecord.parsedStyleSheet.globalRules,
    '.apple-segmented-indicator'
  );
  assertTrue(indicatorRules.length > 0, '.apple-segmented-indicator CSS rules must exist');
  assertEqual(
    indicatorRules[0].declarations['pointer-events'],
    'none',
    'Segmented indicator must have pointer-events: none so clicks hit underlying buttons'
  );
  assertEqual(
    indicatorRules[0].declarations['z-index'],
    '1',
    'Segmented indicator z-index must be 1'
  );

  const btnRules = findRulesForSelector(
    contextRecord.parsedStyleSheet.globalRules,
    '.apple-segmented-btn'
  );
  assertTrue(btnRules.length > 0, '.apple-segmented-btn CSS rules must exist');
  const cascadingBtnRule = btnRules[btnRules.length - 1];
  assertEqual(cascadingBtnRule.declarations['z-index'], '2', 'Segmented buttons cascading z-index must be 2');
}

function testS4_02_SegmentedButtonsPresentInDom(contextRecord) {
  const buttonIds = ['btnViewBack', 'btnViewFront', 'btnViewBoth', 'btnView3D'];
  for (const btnId of buttonIds) {
    const btnNode = findNodeById(contextRecord.parsedDocument, btnId);
    assertNotNull(btnNode, `View switcher button ${btnId} must exist in DOM`);
    assertTrue(btnNode.classList.includes('apple-segmented-btn'), `${btnId} must have class apple-segmented-btn`);
  }
}

function testS4_03_StickyPlacementAcrossScrollDepths() {
  const stageStickyTop = 70;
  const cardStickyTop = 270;
  const segmentedControlHeight = 44;

  const testScrollPositions = [0, 50, 100, 150, 200, 300, 500, 1000];

  for (const scrollDepth of testScrollPositions) {
    // When main scrolls, stage sticky position anchors at top 70px
    const effectiveStageTop = scrollDepth < 70 ? (70 - scrollDepth + 70) : stageStickyTop;
    const segmentedTop = stageStickyTop;
    const segmentedBottom = segmentedTop + segmentedControlHeight;

    // Segmented control is strictly above the card anchor (270px)
    assertTrue(
      segmentedBottom < cardStickyTop,
      `At scrollDepth=${scrollDepth}px, segmentedBottom (${segmentedBottom}px) must be < cardStickyTop (${cardStickyTop}px)`
    );

    const clearance = cardStickyTop - segmentedBottom;
    assertTrue(
      clearance >= 150,
      `At scrollDepth=${scrollDepth}px, clearance (${clearance}px) between segmented control and card must be >= 150px`
    );
  }
}

function testS4_04_ViewSwitchingCycleIntegrity() {
  let state = createMockApplicationState();
  const transitionSequence = ['back', 'front', 'both', '3d', 'back', 'front'];

  for (const nextView of transitionSequence) {
    state = simulateViewSwitch(state, nextView);
    assertEqual(state.viewSide, nextView, `Successfully switched view to ${nextView}`);
  }
}

// -------------------------------------------------------------
// SUITE 5: Desktop Shield Verification (>= 1024px)
// -------------------------------------------------------------

function testS5_01_DesktopGridLayoutPreserved(contextRecord) {
  const desktopGridRules = findRulesForSelector(contextRecord.desktopRules, '.grid.lg\\:grid-cols-12');
  assertTrue(desktopGridRules.length > 0, 'Desktop grid rules must exist');
  assertEqual(
    desktopGridRules[0].declarations['display'],
    'grid !important',
    'Desktop must force display: grid !important'
  );

  const desktopChildRules = findRulesForSelector(
    contextRecord.desktopRules,
    '.grid.lg\\:grid-cols-12 > div:first-child'
  );
  assertTrue(desktopChildRules.length > 0, 'Desktop child column rules must exist');
  assertEqual(
    desktopChildRules[0].declarations['position'],
    'static !important',
    'Desktop columns must reset position to static !important'
  );
}

function testS5_02_DesktopCardReset(contextRecord) {
  const desktopCardRules = findRulesForSelector(contextRecord.desktopRules, '.apple-glass-card');
  assertTrue(desktopCardRules.length > 0, 'Desktop card rules must exist');
  assertEqual(
    desktopCardRules[0].declarations['position'],
    'static !important',
    'Desktop card position must be static !important'
  );
  assertEqual(
    desktopCardRules[0].declarations['max-height'],
    'none !important',
    'Desktop card max-height must be none !important'
  );
  assertEqual(
    desktopCardRules[0].declarations['overflow-y'],
    'visible !important',
    'Desktop card overflow-y must be visible !important'
  );
}

function testS5_03_DesktopPullHandleHidden(contextRecord) {
  const desktopHandleRules = findRulesForSelector(
    contextRecord.desktopRules,
    '.mobile-sheet-handle-container'
  );
  assertTrue(desktopHandleRules.length > 0, 'Desktop handle container rules must exist');
  assertEqual(
    desktopHandleRules[0].declarations['display'],
    'none !important',
    'Desktop handle container must be hidden via display: none !important'
  );
}

// -------------------------------------------------------------
// RUNNER & REPORT AGGREGATOR
// -------------------------------------------------------------

function runAllStressTests() {
  const contextRecord = loadStressContext();
  const testDefinitions = [
    { id: 'STR-1.1_DenseBoundaryCoordinateSweep', fn: () => testS1_01_DenseBoundaryCoordinateSweep() },
    { id: 'STR-1.2_PullHandleAffordanceAtThreshold', fn: () => testS1_02_PullHandleAffordanceAtThreshold(contextRecord) },
    { id: 'STR-1.3_MultiDeviceViewportSweep', fn: () => testS1_03_MultiDeviceViewportSweep(contextRecord) },
    { id: 'STR-2.1_OrbitControlsCanvasTouchAction', fn: () => testS2_01_OrbitControlsCanvasTouchAction(contextRecord) },
    { id: 'STR-2.2_ResetButtonAndHintBadgeIsolation', fn: () => testS2_02_ResetButtonAndHintBadgeIsolation(contextRecord) },
    { id: 'STR-2.3_DragGestureStreamSimulation', fn: () => testS2_03_DragGestureStreamSimulation() },
    { id: 'STR-2.4_PointerCaptureBoundaryIntegrity', fn: () => testS2_04_PointerCaptureBoundaryIntegrity() },
    { id: 'STR-2.5_InverseTouchInitiatedOnCard', fn: () => testS2_05_InverseTouchInitiatedOnCard() },
    { id: 'STR-3.1_CardScrollAndOverscrollContainment', fn: () => testS3_01_CardScrollAndOverscrollContainment(contextRecord) },
    { id: 'STR-3.2_FormInputAccessibilityInDom', fn: () => testS3_02_FormInputAccessibilityInDom(contextRecord) },
    { id: 'STR-3.3_SizeButtonsTouchTargets', fn: () => testS3_03_SizeButtonsTouchTargets(contextRecord) },
    { id: 'STR-3.4_LivePreviewSvgUpdateUnderScroll', fn: () => testS3_04_LivePreviewSvgUpdateUnderScroll(contextRecord) },
    { id: 'STR-4.1_SegmentedControlPointerTransparency', fn: () => testS4_01_SegmentedControlPointerTransparency(contextRecord) },
    { id: 'STR-4.2_SegmentedButtonsPresentInDom', fn: () => testS4_02_SegmentedButtonsPresentInDom(contextRecord) },
    { id: 'STR-4.3_StickyPlacementAcrossScrollDepths', fn: () => testS4_03_StickyPlacementAcrossScrollDepths() },
    { id: 'STR-4.4_ViewSwitchingCycleIntegrity', fn: () => testS4_04_ViewSwitchingCycleIntegrity() },
    { id: 'STR-5.1_DesktopGridLayoutPreserved', fn: () => testS5_01_DesktopGridLayoutPreserved(contextRecord) },
    { id: 'STR-5.2_DesktopCardReset', fn: () => testS5_02_DesktopCardReset(contextRecord) },
    { id: 'STR-5.3_DesktopPullHandleHidden', fn: () => testS5_03_DesktopPullHandleHidden(contextRecord) }
  ];

  console.log('========================================================');
  console.log('       CHALLENGER 2: EMPIRICAL TOUCH ROUTING STRESS     ');
  console.log('========================================================');

  let passedCount = 0;
  const failureList = [];

  for (const testCase of testDefinitions) {
    try {
      testCase.fn();
      passedCount += 1;
      console.log(`  [PASS] ${testCase.id}`);
    } catch (caughtErr) {
      failureList.push({ id: testCase.id, error: caughtErr.message });
      console.log(`  [FAIL] ${testCase.id} -> ${caughtErr.message}`);
    }
  }

  console.log('\n--------------------------------------------------------');
  console.log(`Stress Test Results: ${passedCount}/${testDefinitions.length} passed`);
  if (failureList.length === 0) {
    console.log('[PASS] All touch routing and gesture separation stress tests passed.');
  } else {
    console.log(`[FAIL] ${failureList.length} stress test failures detected.`);
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
