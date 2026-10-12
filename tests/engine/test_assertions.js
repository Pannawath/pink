const assert = require('node:assert');

class TestFailureError extends Error {
  constructor(failureMessage) {
    super(failureMessage);
    this.name = 'TestFailureError';
  }
}

function assertEqual(actualValue, expectedValue, assertionText) {
  if (actualValue === expectedValue) {
    return;
  }
  const detailMessage = `${assertionText} - Expected: ${expectedValue}, Actual: ${actualValue}`;
  throw new TestFailureError(detailMessage);
}

function assertTrue(conditionExpression, assertionText) {
  if (conditionExpression) {
    return;
  }
  throw new TestFailureError(`${assertionText} - Condition evaluated to false`);
}

function assertFalse(conditionExpression, assertionText) {
  if (!conditionExpression) {
    return;
  }
  throw new TestFailureError(`${assertionText} - Condition evaluated to true`);
}

function assertNotNull(targetNode, assertionText) {
  if (targetNode !== null && targetNode !== undefined) {
    return;
  }
  throw new TestFailureError(`${assertionText} - Target node is null or undefined`);
}

function assertIncludes(sourceText, targetSubstring, assertionText) {
  if (typeof sourceText === 'string' && sourceText.includes(targetSubstring)) {
    return;
  }
  const detailMessage = `${assertionText} - Target substring not found: ${targetSubstring}`;
  throw new TestFailureError(detailMessage);
}

function assertBetween(actualNumeric, minNumeric, maxNumeric, assertionText) {
  if (actualNumeric >= minNumeric && actualNumeric <= maxNumeric) {
    return;
  }
  const detailMessage = `${assertionText} - Value ${actualNumeric} outside range [${minNumeric}, ${maxNumeric}]`;
  throw new TestFailureError(detailMessage);
}

module.exports = {
  TestFailureError,
  assertEqual,
  assertTrue,
  assertFalse,
  assertNotNull,
  assertIncludes,
  assertBetween
};
