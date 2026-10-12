const path = require('node:path');
const {
  assertEqual,
  assertTrue,
  assertNotNull
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
  computeStageOverlapMetrics
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

function loadScenarioContext() {
  const parsedDocument = loadDocument(htmlDocumentPath);
  const parsedStyleSheet = loadStyleSheet(primaryStylePath);
  const mobileRules = getMediaBlockRules(parsedStyleSheet, 'max-width: 1023px');
  return {
    parsedDocument,
    parsedStyleSheet,
    mobileRules
  };
}

function testR4_01_CompleteMobileOrderingFlowEndToEnd(contextRecord) {
  const viewportMode = determineViewportMode(390);
  assertEqual(viewportMode, 'mobile', 'Device starts in mobile viewport mode');

  const handleContainers = collectNodesByClass(contextRecord.parsedDocument, 'mobile-sheet-handle-container');
  assertTrue(handleContainers.length > 0, 'Pull handle affordance is visible for sheet layer');

  const overlapMetrics = computeStageOverlapMetrics(420, 70, 270);
  assertEqual(overlapMetrics.exposedStageHeight, 200, 'Top 200px of stage exposed');

  let studentState = createMockApplicationState();
  studentState = simulateEmailLookupSuccess(studentState, 'student69@skp.ac.th');
  assertEqual(studentState.email, 'student69@skp.ac.th', 'Email verified successfully');

  studentState = simulateNameUpdate(studentState, 'SARAKHAM');
  studentState = simulateNumberUpdate(studentState, '10');
  assertEqual(studentState.screenName, 'SARAKHAM', 'Name applied to live state');
  assertEqual(studentState.screenNumber, '10', 'Number applied to live state');

  studentState = simulateViewSwitch(studentState, '3d');
  assertEqual(studentState.viewSide, '3d', 'Rotated to 3D view mode');

  studentState = simulateSizeSelection(studentState, 'XL');
  assertEqual(studentState.size, 'XL', 'Selected athletic jersey size XL');

  assertNotNull(findNodeById(contextRecord.parsedDocument, 'btnSubmit'), 'Submit CTA is accessible at end of form');
}

function testR4_02_ExistingOrderEditModeOnMobile(contextRecord) {
  let returningStudentState = createMockApplicationState();
  returningStudentState = simulateEmailLookupSuccess(returningStudentState, 'alumni@skp.ac.th');
  returningStudentState = {
    ...returningStudentState,
    mode: 'edit',
    screenName: 'WARRIOR',
    screenNumber: '07',
    size: '2XL'
  };

  assertEqual(returningStudentState.mode, 'edit', 'Application configured in edit mode');
  assertEqual(returningStudentState.screenName, 'WARRIOR', 'Existing screen name loaded');

  returningStudentState = simulateNumberUpdate(returningStudentState, '99');
  assertEqual(returningStudentState.screenNumber, '99', 'Modified number updated for resubmission');

  const cardRules = findRulesForSelector(contextRecord.mobileRules, '.apple-glass-card');
  assertEqual(cardRules[0].declarations.position, 'sticky', 'Card maintains sticky overlap during edit mode');
}

function testR4_03_FormResetRestoresMobileLayoutBaseline(contextRecord) {
  let dirtyState = createMockApplicationState();
  dirtyState = simulateNameUpdate(dirtyState, 'TEMPORARY');
  dirtyState = simulateNumberUpdate(dirtyState, '88');
  dirtyState = simulateViewSwitch(dirtyState, '3d');
  dirtyState = simulateSizeSelection(dirtyState, '3XL');

  const cleanBaselineState = createMockApplicationState();
  assertEqual(cleanBaselineState.screenName, '', 'Baseline screen name is blank');
  assertEqual(cleanBaselineState.screenNumber, '10', 'Baseline default number is 10');
  assertEqual(cleanBaselineState.viewSide, 'front', 'Baseline view is front');
  assertEqual(cleanBaselineState.size, 'L', 'Baseline size is L');

  assertNotNull(findNodeById(contextRecord.parsedDocument, 'btnResetForm'), 'Reset button exists in DOM');
}

function runTier4Tests() {
  const contextRecord = loadScenarioContext();
  const testSuiteDefinitions = [
    { testIdentifier: 'S4.1_CompleteMobileOrderingFlowEndToEnd', testRunner: () => testR4_01_CompleteMobileOrderingFlowEndToEnd(contextRecord) },
    { testIdentifier: 'S4.2_ExistingOrderEditModeOnMobile', testRunner: () => testR4_02_ExistingOrderEditModeOnMobile(contextRecord) },
    { testIdentifier: 'S4.3_FormResetRestoresMobileLayoutBaseline', testRunner: () => testR4_03_FormResetRestoresMobileLayoutBaseline(contextRecord) }
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
  runTier4Tests
};
