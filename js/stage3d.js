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
  animationId: null,
  textCanvas: null,
  textTexture: null,
  currentNumber: '10',
  currentName: 'YOUR NAME'
};

function setupStageLighting(scene) {
  const keyLight = new THREE.DirectionalLight(0xfff8f2, 1.25);
  keyLight.position.set(3.5, 4.5, 3.5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xe8f0fe, 0.85);
  fillLight.position.set(-3.5, 2.5, 2.5);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffe4e6, 1.10);
  rimLight.position.set(-1.0, 4.0, -3.5);
  scene.add(rimLight);

  const bounceLight = new THREE.DirectionalLight(0xf8fafc, 0.50);
  bounceLight.position.set(0, -4.0, 1.5);
  scene.add(bounceLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambientLight);
}

function normalizeStageShirtMesh(modelScene) {
  modelScene.position.set(0, 0, 0);
  modelScene.scale.set(1, 1, 1);
  modelScene.updateMatrixWorld(true);

  const initialBox = new THREE.Box3().setFromObject(modelScene);
  const sizeVector = new THREE.Vector3();
  initialBox.getSize(sizeVector);

  const maxDimension = Math.max(sizeVector.x, sizeVector.y, sizeVector.z);
  const scaleRatio = 2.4 / maxDimension;
  modelScene.scale.set(scaleRatio, scaleRatio, scaleRatio);
  modelScene.updateMatrixWorld(true);

  const scaledBox = new THREE.Box3().setFromObject(modelScene);
  const centerVector = new THREE.Vector3();
  scaledBox.getCenter(centerVector);

  modelScene.position.x = -centerVector.x;
  modelScene.position.y = -centerVector.y;
  modelScene.position.z = -centerVector.z;
  modelScene.updateMatrixWorld(true);

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
}

function createTextCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  return canvas;
}

function updateTextCanvas(number, name) {
  if (!Stage3DState.textCanvas) {
    Stage3DState.textCanvas = createTextCanvas();
  }
  
  const canvas = Stage3DState.textCanvas;
  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw number (large, centered)
  ctx.fillStyle = '#5C3C2B';
  ctx.font = 'bold 380px Lobster, cursive';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(number || '10', canvas.width / 2, canvas.height / 2 + 50);
  
  // Draw name (curved arc above number)
  ctx.fillStyle = '#5C3C2B';
  ctx.font = '900 70px "Computer Modern Serif", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Simple arc text (straight for now, can be improved)
  const displayName = name || 'YOUR NAME';
  ctx.fillText(displayName, canvas.width / 2, canvas.height / 2 - 200);
  
  // Update texture if exists
  if (Stage3DState.textTexture) {
    Stage3DState.textTexture.needsUpdate = true;
  }
  
  Stage3DState.currentNumber = number;
  Stage3DState.currentName = name;
}

function applyTextTextureToModel() {
  if (!Stage3DState.shirtModel || !Stage3DState.textCanvas) return;
  
  // Create texture from canvas
  if (!Stage3DState.textTexture) {
    Stage3DState.textTexture = new THREE.CanvasTexture(Stage3DState.textCanvas);
    Stage3DState.textTexture.flipY = false;
  }
  
  // Find the shirt mesh and apply texture as decal overlay
  Stage3DState.shirtModel.traverse((childNode) => {
    if (childNode.isMesh && childNode.material) {
      // Clone material to avoid affecting other instances
      if (!childNode.userData.originalMaterial) {
        childNode.userData.originalMaterial = childNode.material.clone();
      }
      
      // Apply texture as emissive map overlay (visible on both sides)
      if (childNode.material.map) {
        // Blend our text with existing texture
        childNode.material.emissiveMap = Stage3DState.textTexture;
        childNode.material.emissiveIntensity = 0.8;
        childNode.material.needsUpdate = true;
      }
    }
  });
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
      
      // Initialize text texture
      updateTextCanvas(Stage3DState.currentNumber, Stage3DState.currentName);
      applyTextTextureToModel();
      
      resizeStage3DViewer();
    },
    undefined,
    (loadError) => {
      console.warn('Failed to load 3D shirt model:', loadError);
    }
  );
}

// Public function to update 3D text from outside
window.update3DJerseyText = function(number, name) {
  if (!Stage3DState.isInitialized || !Stage3DState.shirtModel) {
    // Store for later when model loads
    Stage3DState.currentNumber = number || '10';
    Stage3DState.currentName = name || 'YOUR NAME';
    return;
  }
  
  updateTextCanvas(number, name);
  applyTextTextureToModel();
};

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
  renderer.toneMappingExposure = 0.90;
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
