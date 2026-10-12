/**
 * REAL WEBGL 3D VOLUMETRIC LIQUID SILK ENGINE (Three.js)
 * Smooth parallel-transport cushion ribbons and floating liquid bubbles
 */

(function initLiquidSilkEngine() {
  const silkCanvas = document.getElementById('liquidSilkCanvas');
  if (!silkCanvas) return;

  const silkScene = new THREE.Scene();
  const silkCamera = new THREE.PerspectiveCamera(
    38,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  silkCamera.position.set(0, 0, 7.6);

  const silkRenderer = new THREE.WebGLRenderer({
    canvas: silkCanvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  silkRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  silkRenderer.setSize(window.innerWidth, window.innerHeight);
  silkRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  silkRenderer.toneMappingExposure = 1.3;

  setupStudioLights(silkScene);

  const ribbonCollection = createRibbonCollection(silkScene);
  const bubbleCollection = createFloatingLiquidBubbles(silkScene);

  window.addEventListener('resize', () => {
    handleCanvasResize(silkCamera, silkRenderer);
  });

  const clockTimer = new THREE.Clock();

  function renderAnimationLoop() {
    requestAnimationFrame(renderAnimationLoop);
    const elapsedSeconds = clockTimer.getElapsedTime();
    updateRibbonPositions(ribbonCollection, elapsedSeconds);
    updateBubblePositions(bubbleCollection, elapsedSeconds);
    silkRenderer.render(silkScene, silkCamera);
  }

  renderAnimationLoop();
})();

function setupStudioLights(targetScene) {
  const primaryKeyLight = new THREE.DirectionalLight(0xffffff, 4.2);
  primaryKeyLight.position.set(4.0, 5.0, 5.0);
  targetScene.add(primaryKeyLight);

  const secondaryFillLight = new THREE.DirectionalLight(0xfce7f3, 2.8);
  secondaryFillLight.position.set(-4.0, -2.0, 3.5);
  targetScene.add(secondaryFillLight);

  const specularRimLight = new THREE.DirectionalLight(0xffffff, 4.8);
  specularRimLight.position.set(-1.0, 4.0, 2.0);
  targetScene.add(specularRimLight);

  const accentPointLight = new THREE.PointLight(0xf472b6, 2.2, 15);
  accentPointLight.position.set(0.0, 0.0, 3.0);
  targetScene.add(accentPointLight);

  const ambientDome = new THREE.AmbientLight(0xfff0f5, 2.0);
  targetScene.add(ambientDome);
}

function createSatinMaterial(baseHue, emissiveHue) {
  return new THREE.MeshPhysicalMaterial({
    color: baseHue,
    emissive: emissiveHue,
    roughness: 0.14,
    metalness: 0.03,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    transmission: 0.04,
    ior: 1.5,
    reflectivity: 0.98,
    side: THREE.DoubleSide
  });
}

function buildCushionRibbonGeometry(splinePoints, ribbonWidth, ribbonThickness, lengthSteps, radialSteps) {
  const splineCurve = new THREE.CatmullRomCurve3(splinePoints);
  const curveFrames = splineCurve.computeFrenetFrames(lengthSteps, false);
  const positionList = [];
  const normalList = [];
  const uvList = [];
  const indexList = [];

  for (let stepI = 0; stepI <= lengthSteps; stepI += 1) {
    const progressFactor = stepI / lengthSteps;
    const centerPoint = splineCurve.getPointAt(progressFactor);
    const lateralVector = curveFrames.binormals[stepI];
    const normalVector = curveFrames.normals[stepI];

    const taperEnvelope = Math.pow(Math.sin(progressFactor * Math.PI), 0.35);
    const effectiveWidth = ribbonWidth * taperEnvelope;
    const effectiveThickness = ribbonThickness * taperEnvelope;

    for (let stepJ = 0; stepJ <= radialSteps; stepJ += 1) {
      const angleRadian = (stepJ / radialSteps) * Math.PI * 2;
      const cosAngle = Math.cos(angleRadian);
      const sinAngle = Math.sin(angleRadian);
      const lateralShift = cosAngle * (effectiveWidth * 0.5);
      const normalShift = sinAngle * (effectiveThickness * 0.5);

      const vertexCoord = centerPoint.clone()
        .addScaledVector(lateralVector, lateralShift)
        .addScaledVector(normalVector, normalShift);

      const surfaceNormal = lateralVector.clone().multiplyScalar(cosAngle)
        .addScaledVector(normalVector, sinAngle).normalize();

      positionList.push(vertexCoord.x, vertexCoord.y, vertexCoord.z);
      normalList.push(surfaceNormal.x, surfaceNormal.y, surfaceNormal.z);
      uvList.push(stepJ / radialSteps, progressFactor);

      if (stepI < lengthSteps && stepJ < radialSteps) {
        const rowStride = radialSteps + 1;
        const currentIdx = stepI * rowStride + stepJ;
        const nextIdx = currentIdx + 1;
        const lowerIdx = (stepI + 1) * rowStride + stepJ;
        const lowerNextIdx = lowerIdx + 1;
        indexList.push(currentIdx, lowerIdx, nextIdx);
        indexList.push(nextIdx, lowerIdx, lowerNextIdx);
      }
    }
  }

  const ribbonGeometry = new THREE.BufferGeometry();
  ribbonGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positionList, 3));
  ribbonGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normalList, 3));
  ribbonGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvList, 2));
  ribbonGeometry.setIndex(indexList);

  return {
    geometry: ribbonGeometry,
    initialCoords: new Float32Array(positionList)
  };
}

function createRibbonCollection(targetScene) {
  const ribbonEntries = [];

  const topWavePoints = [
    new THREE.Vector3(-4.8, 2.3, -0.6),
    new THREE.Vector3(-1.8, 1.8, 0.4),
    new THREE.Vector3(1.6, 2.2, -0.2),
    new THREE.Vector3(4.8, 2.4, -0.5)
  ];
  const topRecord = buildCushionRibbonGeometry(topWavePoints, 1.8, 0.35, 72, 12);
  const topMesh = new THREE.Mesh(topRecord.geometry, createSatinMaterial(0xfbcfe8, 0x42132d));
  targetScene.add(topMesh);
  ribbonEntries.push({ mesh: topMesh, record: topRecord, motionRate: 0.70, waveIntensity: 0.18 });

  const diagonalFlowPoints = [
    new THREE.Vector3(4.6, 1.6, -0.4),
    new THREE.Vector3(1.8, 0.4, 0.5),
    new THREE.Vector3(-1.2, -0.6, -0.3),
    new THREE.Vector3(-4.6, -1.8, 0.4)
  ];
  const diagonalRecord = buildCushionRibbonGeometry(diagonalFlowPoints, 2.2, 0.40, 72, 12);
  const diagonalMesh = new THREE.Mesh(diagonalRecord.geometry, createSatinMaterial(0xf9a8d4, 0x4f1737));
  targetScene.add(diagonalMesh);
  ribbonEntries.push({ mesh: diagonalMesh, record: diagonalRecord, motionRate: 0.85, waveIntensity: 0.16 });

  const bottomWavePoints = [
    new THREE.Vector3(-4.8, -2.1, -0.5),
    new THREE.Vector3(-1.6, -1.6, 0.4),
    new THREE.Vector3(1.8, -2.0, -0.2),
    new THREE.Vector3(4.8, -1.9, -0.6)
  ];
  const bottomRecord = buildCushionRibbonGeometry(bottomWavePoints, 1.9, 0.36, 72, 12);
  const bottomMesh = new THREE.Mesh(bottomRecord.geometry, createSatinMaterial(0xf472b6, 0x5c1b40));
  targetScene.add(bottomMesh);
  ribbonEntries.push({ mesh: bottomMesh, record: bottomRecord, motionRate: 0.65, waveIntensity: 0.15 });

  const sideSwirlPoints = [
    new THREE.Vector3(3.8, 2.2, -0.4),
    new THREE.Vector3(3.2, 0.0, 0.6),
    new THREE.Vector3(3.9, -2.2, -0.3)
  ];
  const sideRecord = buildCushionRibbonGeometry(sideSwirlPoints, 1.6, 0.32, 60, 12);
  const sideMesh = new THREE.Mesh(sideRecord.geometry, createSatinMaterial(0xfce7f3, 0x3a0f26));
  targetScene.add(sideMesh);
  ribbonEntries.push({ mesh: sideMesh, record: sideRecord, motionRate: 0.78, waveIntensity: 0.14 });

  return ribbonEntries;
}

function createFloatingLiquidBubbles(targetScene) {
  const bubbleEntries = [];
  const bubbleConfigs = [
    { radius: 0.36, origin: new THREE.Vector3(3.3, 1.9, 0.8), rate: 0.85, hue: 0xfdf2f8 },
    { radius: 0.28, origin: new THREE.Vector3(-3.2, 2.0, 0.6), rate: 1.05, hue: 0xfce7f3 },
    { radius: 0.42, origin: new THREE.Vector3(3.4, -1.8, 1.0), rate: 0.70, hue: 0xfbcfe8 },
    { radius: 0.30, origin: new THREE.Vector3(-3.3, -1.9, 0.7), rate: 1.20, hue: 0xf9a8d4 },
    { radius: 0.22, origin: new THREE.Vector3(3.7, 0.2, 0.5), rate: 0.90, hue: 0xffffff }
  ];

  bubbleConfigs.forEach((bubbleParam) => {
    const bubbleGeo = new THREE.SphereGeometry(bubbleParam.radius, 28, 28);
    const bubbleMat = createSatinMaterial(bubbleParam.hue, 0x2a0d1c);
    const bubbleMesh = new THREE.Mesh(bubbleGeo, bubbleMat);
    bubbleMesh.position.copy(bubbleParam.origin);
    targetScene.add(bubbleMesh);
    bubbleEntries.push({
      mesh: bubbleMesh,
      origin: bubbleParam.origin.clone(),
      motionRate: bubbleParam.rate
    });
  });

  return bubbleEntries;
}

function updateRibbonPositions(ribbonEntries, totalElapsedSeconds) {
  ribbonEntries.forEach((entryElement) => {
    const positionAttribute = entryElement.mesh.geometry.attributes.position;
    const initialCoords = entryElement.record.initialCoords;
    const totalPoints = positionAttribute.count;

    for (let pointIdx = 0; pointIdx < totalPoints; pointIdx += 1) {
      const positionStride = pointIdx * 3;
      const coordX = initialCoords[positionStride];
      const coordY = initialCoords[positionStride + 1];
      const coordZ = initialCoords[positionStride + 2];

      const spatialPhase = (coordX * 0.28) + (coordY * 0.20);
      const waveShiftY = Math.sin((totalElapsedSeconds * entryElement.motionRate) + spatialPhase * 1.2);
      const waveShiftZ = Math.cos((totalElapsedSeconds * (entryElement.motionRate * 0.8)) + spatialPhase);

      positionAttribute.setY(pointIdx, coordY + waveShiftY * entryElement.waveIntensity);
      positionAttribute.setZ(pointIdx, coordZ + waveShiftZ * (entryElement.waveIntensity * 0.7));
    }

    positionAttribute.needsUpdate = true;
    entryElement.mesh.geometry.computeVertexNormals();
    entryElement.mesh.rotation.z = Math.sin(totalElapsedSeconds * 0.10) * 0.02;
  });
}

function updateBubblePositions(bubbleEntries, totalElapsedSeconds) {
  bubbleEntries.forEach((bubbleElement) => {
    const verticalBob = Math.sin(totalElapsedSeconds * bubbleElement.motionRate) * 0.25;
    const lateralSway = Math.cos(totalElapsedSeconds * (bubbleElement.motionRate * 0.75)) * 0.16;
    bubbleElement.mesh.position.y = bubbleElement.origin.y + verticalBob;
    bubbleElement.mesh.position.x = bubbleElement.origin.x + lateralSway;
  });
}

function handleCanvasResize(activeCamera, activeRenderer) {
  activeCamera.aspect = window.innerWidth / window.innerHeight;
  activeCamera.updateProjectionMatrix();
  activeRenderer.setSize(window.innerWidth, window.innerHeight);
  activeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
