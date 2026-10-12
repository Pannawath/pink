const { runTier1Tests } = require('./tier1_features.test.js');
const { runTier2Tests } = require('./tier2_boundaries.test.js');
const { runTier3Tests } = require('./tier3_combinations.test.js');
const { runTier4Tests } = require('./tier4_scenarios.test.js');

function formatTestRow(testIdentifier, passedStatus, failureReason) {
  const statusToken = passedStatus ? '[PASS]' : '[FAIL]';
  if (passedStatus) {
    return `  ${statusToken} ${testIdentifier}`;
  }
  return `  ${statusToken} ${testIdentifier} -> ${failureReason}`;
}

function executeTierSuite(suiteTitle, tierExecutionFunction) {
  console.log(`\n--- ${suiteTitle} ---`);
  const tierResults = tierExecutionFunction();
  let passCount = 0;
  for (const executionRecord of tierResults) {
    if (executionRecord.passedStatus) {
      passCount += 1;
    }
    const formattedRow = formatTestRow(
      executionRecord.testIdentifier,
      executionRecord.passedStatus,
      executionRecord.failureReason
    );
    console.log(formattedRow);
  }
  console.log(`Summary: ${passCount}/${tierResults.length} passed`);
  return tierResults;
}

function aggregateSummary(allTierResults, durationMilliseconds) {
  let totalTests = 0;
  let totalPassed = 0;
  const failureList = [];

  for (const singleRecord of allTierResults) {
    totalTests += 1;
    if (singleRecord.passedStatus) {
      totalPassed += 1;
    } else {
      failureList.push(singleRecord);
    }
  }

  console.log('\n========================================================');
  console.log('              E2E TEST SUITE EXECUTION REPORT           ');
  console.log('========================================================');
  console.log(`Total Test Cases: ${totalTests}`);
  console.log(`Passed:           ${totalPassed}`);
  console.log(`Failed:           ${failureList.length}`);
  console.log(`Duration:         ${durationMilliseconds}ms`);

  if (failureList.length === 0) {
    console.log('\n[PASS] All 4 Tiers Passed Successfully with Zero Regressions.');
  } else {
    console.log(`\n[FAIL] ${failureList.length} test failure(s) detected.`);
  }
  console.log('========================================================\n');

  return failureList.length === 0;
}

function main() {
  const startTimestamp = Date.now();
  console.log('Starting Pink Configurator E2E Test Suite (4-Tier Architecture)');

  const tier1Records = executeTierSuite('Tier 1: Feature Coverage (R1 - R4)', runTier1Tests);
  const tier2Records = executeTierSuite('Tier 2: Boundary & Corner Cases', runTier2Tests);
  const tier3Records = executeTierSuite('Tier 3: Cross-Feature Combinations', runTier3Tests);
  const tier4Records = executeTierSuite('Tier 4: Real-World Scenarios', runTier4Tests);

  const combinedRecords = [
    ...tier1Records,
    ...tier2Records,
    ...tier3Records,
    ...tier4Records
  ];

  const executionDuration = Date.now() - startTimestamp;
  const isAllPassed = aggregateSummary(combinedRecords, executionDuration);

  if (!isAllPassed) {
    process.exit(1);
  }
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = {
  executeTierSuite,
  aggregateSummary
};
