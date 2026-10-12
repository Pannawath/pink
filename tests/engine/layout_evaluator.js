function determineViewportMode(screenWidthPixels) {
  if (screenWidthPixels < 1024) {
    return 'mobile';
  }
  return 'desktop';
}

function computeStageOverlapMetrics(stageHeightPixels, headerTopPixels, cardTopPixels) {
  const exposedStageHeight = cardTopPixels - headerTopPixels;
  const stageBottomPixels = headerTopPixels + stageHeightPixels;
  const overlappedStageHeight = Math.max(0, stageBottomPixels - cardTopPixels);
  const overlapRatio = overlappedStageHeight / stageHeightPixels;
  const exposureRatio = exposedStageHeight / stageHeightPixels;

  return {
    exposedStageHeight,
    overlappedStageHeight,
    overlapRatio,
    exposureRatio
  };
}

function resolveTouchTargetZone(touchCoordinateY, sheetAnchorY) {
  if (touchCoordinateY < sheetAnchorY) {
    return {
      targetRegion: 'exposed_stage',
      expectedTouchAction: 'none',
      routedHandler: 'OrbitControls'
    };
  }
  return {
    targetRegion: 'floating_card',
    expectedTouchAction: 'pan-y',
    routedHandler: 'InternalScroll'
  };
}

function computeCardMaxHeight(viewportHeightPixels, sheetTopAnchorPixels) {
  const availableScrollHeight = viewportHeightPixels - sheetTopAnchorPixels;
  return Math.max(0, availableScrollHeight);
}

function verifyCoordinateCoverage(targetFeatureY, sheetAnchorY) {
  const isFeatureUncovered = targetFeatureY < sheetAnchorY;
  return isFeatureUncovered;
}

module.exports = {
  determineViewportMode,
  computeStageOverlapMetrics,
  resolveTouchTargetZone,
  computeCardMaxHeight,
  verifyCoordinateCoverage
};
