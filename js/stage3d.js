/**
 * Real WebGL 3D Jersey Stage Viewer
 * High-performance Three.js OrbitControls canvas for assets/models/shirt.glb
 */

const Stage3DState = {
  isInitialized: false,
  renderer: null,
  scene: null,
  camera: null,
  controls: null,
  shirtModel: null,
  animationId: null
};

function setupStageLighting(scene) {
  const keyLight = new THREE.DirectionalLight(0xfff8f2, 2.8);
  keyLight.position.set(3.5, 4.5, 3.5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xe8f0fe, 1.8);
  fillLight.position.set(-3.5, 2.5, 2.5);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffe4e6, 3.2);
  rimLight.position.set(-1.0, 4.0, -3.5);
  scene.add(rimLight);

  const bounceLight = new THREE.DirectionalLight(0xf8fafc, 1.4);
  bounceLight.position.set(0, -4.0, 1.5);
  scene.add(bounceLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
  scene.add(ambientLight);
}

function normalizeStageShirtMesh(modelScene) {
  const boundingBox = new THREE.Box3().setFromObject(modelScene);
  const sizeVector = new THREE.Vector3();
  const centerVector = new THREE.Vector3();
  boundingBox.getSize(sizeVector);
  boundingBox.getCenter(centerVector);

  modelScene.position.x = -centerVector.x;
  modelScene.position.y = -centerVector.y;
  modelScene.position.z = -centerVector.z;

  modelScene.traverse((childNode) => {
    if (!childNode.isMesh) return;
    childNode.castShadow = true;
    childNode.receiveShadow = true;
    if (childNode.material) {
      childNode.material.roughness = Math.min(childNode.material.roughness, 0.72);
      childNode.material.metalness = 0.05;
      childNode.material.needsUpdate = true;
    }
  });

  const maxDimension = Math.max(sizeVector.x, sizeVector.y, sizeVector.z);
  const scaleRatio = 2.4 / maxDimension;
  modelScene.scale.set(scaleRatio, scaleRatio, scaleRatio);
}

function configureStageControls(camera, canvasElement) {
  const controls = new THREE.OrbitControls(camera, canvasElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.85;
  controls.zoomSpeed = 0.9;
  controls.minDistance = 1.8;
  controls.maxDistance = 6.5;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.5;
  controls.target.set(0, 0, 0);

  canvasElement.addEventListener('pointerdown', () => {
    controls.autoRotate = false;
  });

  return controls;
}

function reset3DCameraView() {
  if (!Stage3DState.camera || !Stage3DState.controls) return;
  Stage3DState.camera.position.set(0, 0, 3.8);
  Stage3DState.controls.target.set(0, 0, 0);
  Stage3DState.controls.autoRotate = true;
  Stage3DState.controls.update();
}

function resizeStage3DViewer() {
  const canvasElement = document.getElementById('jersey3DCanvas');
  if (!canvasElement || !Stage3DState.renderer || !Stage3DState.camera) return;

  const rectBounds = canvasElement.parentElement.getBoundingClientRect();
  const canvasWidth = rectBounds.width || 440;
  const canvasHeight = rectBounds.height || 480;

  Stage3DState.camera.aspect = canvasWidth / canvasHeight;
  Stage3DState.camera.updateProjectionMatrix();
  Stage3DState.renderer.setSize(canvasWidth, canvasHeight, false);
}

function startStage3DLoop() {
  function renderFrame() {
    Stage3DState.animationId = requestAnimationFrame(renderFrame);
    if (Stage3DState.controls) {
      Stage3DState.controls.update();
    }
    if (Stage3DState.renderer && Stage3DState.scene && Stage3DState.camera) {
      Stage3DState.renderer.render(Stage3DState.scene, Stage3DState.camera);
    }
  }
  renderFrame();
}

function loadStageShirtModel(scene) {
  const loader = new THREE.GLTFLoader();
  loader.load(
    'assets/models/shirt.glb',
    (gltfRecord) => {
      const shirtScene = gltfRecord.scene;
      normalizeStageShirtMesh(shirtScene);
      scene.add(shirtScene);
      Stage3DState.shirtModel = shirtScene;
      resizeStage3DViewer();
    },
    undefined,
    (loadError) => {
      console.warn('Failed to load 3D shirt model:', loadError);
    }
  );
}

function initJersey3DViewer() {
  if (Stage3DState.isInitialized) return;
  const canvasElement = document.getElementById('jersey3DCanvas');
  if (!canvasElement) return;

  const scene = new THREE.Scene();
  setupStageLighting(scene);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  camera.position.set(0, 0, 3.8);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvasElement,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.outputEncoding = THREE.sRGBEncoding;

  const controls = configureStageControls(camera, canvasElement);

  Stage3DState.isInitialized = true;
  Stage3DState.scene = scene;
  Stage3DState.camera = camera;
  Stage3DState.renderer = renderer;
  Stage3DState.controls = controls;

  loadStageShirtModel(scene);
  startStage3DLoop();

  const resetBtn = document.getElementById('btnReset3DView');
  if (resetBtn) resetBtn.addEventListener('click', reset3DCameraView);

  window.addEventListener('resize', resizeStage3DViewer);
  resizeStage3DViewer();
}

window.onJersey3DVisible = function () {
  if (!Stage3DState.isInitialized) {
    initJersey3DViewer();
  } else {
    resizeStage3DViewer();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('jersey3DCanvas')) {
    initJersey3DViewer();
  }
});
