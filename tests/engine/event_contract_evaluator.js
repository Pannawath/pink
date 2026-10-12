function createMockApplicationState() {
  return {
    mode: 'new',
    viewSide: 'front',
    email: '',
    size: 'L',
    screenName: '',
    screenNumber: '10',
    orderStatus: 'รอชำระเงิน',
    slipImage: null
  };
}

function simulateNameUpdate(currentState, rawScreenName) {
  const sanitizedName = (rawScreenName || '').trim().toUpperCase();
  return {
    ...currentState,
    screenName: sanitizedName
  };
}

function simulateNumberUpdate(currentState, rawScreenNumber) {
  const sanitizedNumber = (rawScreenNumber || '').replace(/[^0-9]/g, '').slice(0, 2);
  return {
    ...currentState,
    screenNumber: sanitizedNumber
  };
}

function simulateViewSwitch(currentState, targetViewMode) {
  const validViews = new Set(['front', 'back', 'both', '3d']);
  if (!validViews.has(targetViewMode)) {
    return currentState;
  }
  return {
    ...currentState,
    viewSide: targetViewMode
  };
}

function simulateSizeSelection(currentState, selectedSizeCode) {
  const validSizes = new Set(['2S', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']);
  if (!validSizes.has(selectedSizeCode)) {
    return currentState;
  }
  return {
    ...currentState,
    size: selectedSizeCode
  };
}

function simulateEmailLookupSuccess(currentState, verifiedEmail) {
  return {
    ...currentState,
    email: verifiedEmail,
    mode: 'new'
  };
}

module.exports = {
  createMockApplicationState,
  simulateNameUpdate,
  simulateNumberUpdate,
  simulateViewSwitch,
  simulateSizeSelection,
  simulateEmailLookupSuccess
};
