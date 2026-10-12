/**
 * =========================================================================
 * OPAL STUDIO 3D ENGINE - REAL WEBGL GLB VIEWER
 * Renders 3dmodel/shirt.glb with luxury studio lighting and parallax float
 * =========================================================================
 */

function createStudioCamera() {
  const camera = new THREE.PerspectiveCamera(
    38,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 4.2);
  return camera;
}

function createStudioRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputEncoding = THREE.sRGBEncoding;
  return renderer;
}

function setupStudioLighting(scene) {
  const keyLight = new THREE.DirectionalLight(0xfff8f2, 2.5);
  keyLight.position.set(3.5, 4.5, 3.5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xe8f0fe, 1.6);
  fillLight.position.set(-3.5, 2.5, 2.5);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffe4e6, 3.2);
  rimLight.position.set(-1.0, 4.0, -3.5);
  scene.add(rimLight);

  const bounceLight = new THREE.DirectionalLight(0xf8fafc, 1.2);
  bounceLight.position.set(0, -4.0, 1.5);
  scene.add(bounceLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);
}

function centerAndScaleMesh(model, modelGroup) {
  const boundingBox = new THREE.Box3().setFromObject(model);
  const modelSize = new THREE.Vector3();
  const modelCenter = new THREE.Vector3();
  boundingBox.getSize(modelSize);
  boundingBox.getCenter(modelCenter);

  model.position.x = -modelCenter.x;
  model.position.y = -modelCenter.y;
  model.position.z = -modelCenter.z;

  model.traverse((meshChild) => {
    if (!meshChild.isMesh) return;
    meshChild.castShadow = true;
    meshChild.receiveShadow = true;
    if (meshChild.material) {
      meshChild.material.roughness = Math.min(meshChild.material.roughness, 0.75);
      meshChild.material.metalness = 0.05;
      meshChild.material.needsUpdate = true;
    }
  });

  const maxAxisDimension = Math.max(modelSize.x, modelSize.y, modelSize.z);
  const normalizedScale = 2.4 / maxAxisDimension;
  modelGroup.scale.set(normalizedScale, normalizedScale, normalizedScale);
  modelGroup.position.set(-1.42, 0.02, 0);
  modelGroup.rotation.set(0.18, -0.42, -0.16);
}

function loadShirtModel(modelGroup, onModelReady) {
  const loader = new THREE.GLTFLoader();
  loader.load(
    'assets/models/shirt.glb',
    (gltf) => {
      const model = gltf.scene;
      centerAndScaleMesh(model, modelGroup);
      modelGroup.add(model);
      onModelReady(model);
    },
    undefined,
    () => {}
  );
}

function createInteractionController(modelGroup, camera, renderer) {
  let targetRotationX = 0.12;
  let targetRotationY = -0.35;
  let halfWidth = window.innerWidth / 2;
  let halfHeight = window.innerHeight / 2;

  const adjustLayout = () => {
    const isMobile = window.innerWidth < 1024;
    modelGroup.position.set(isMobile ? 0 : -1.25, isMobile ? 0.25 : -0.05, isMobile ? -0.5 : 0);
    camera.position.z = isMobile ? 4.8 : 4.2;
  };

  window.addEventListener('mousemove', (event) => {
    const mouseX = (event.clientX - halfWidth) / halfWidth;
    const mouseY = (event.clientY - halfHeight) / halfHeight;
    const rotY = (typeof CONFIG !== 'undefined' && CONFIG.studio3D) ? CONFIG.studio3D.rotationRangeY : 0.15;
    const rotX = (typeof CONFIG !== 'undefined' && CONFIG.studio3D) ? CONFIG.studio3D.rotationRangeX : 0.10;
    targetRotationY = -0.35 + mouseX * rotY;
    targetRotationX = 0.12 + mouseY * rotX;
  });

  window.addEventListener('resize', () => {
    halfWidth = window.innerWidth / 2;
    halfHeight = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    adjustLayout();
  });

  return {
    getTargetX: () => targetRotationX,
    getTargetY: () => targetRotationY,
    adjustLayout
  };
}

function startStudioAnimationLoop(renderer, scene, camera, modelGroup, interaction, getShirtMesh) {
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    if (getShirtMesh()) {
      const floatOffsetY = Math.sin(elapsedTime * 1.0) * 0.05;
      const floatRotZ = -0.15 + Math.sin(elapsedTime * 0.7) * 0.02;
      modelGroup.position.y = (window.innerWidth < 1024 ? 0.25 : -0.05) + floatOffsetY;

      const lerpSpeed = (typeof CONFIG !== 'undefined' && CONFIG.studio3D) ? CONFIG.studio3D.lerpSpeed : 0.025;
      modelGroup.rotation.y += (interaction.getTargetY() - modelGroup.rotation.y) * lerpSpeed;
      modelGroup.rotation.x += (interaction.getTargetX() - modelGroup.rotation.x) * lerpSpeed;
      modelGroup.rotation.z += (floatRotZ - modelGroup.rotation.z) * lerpSpeed;
    }

    renderer.render(scene, camera);
  }

  animate();
}

function initStudio3D() {
  const canvas = document.getElementById('bg3dCanvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = createStudioCamera();
  const renderer = createStudioRenderer(canvas);
  setupStudioLighting(scene);

  const modelGroup = new THREE.Group();
  scene.add(modelGroup);

  let shirtMesh = null;
  const interaction = createInteractionController(modelGroup, camera, renderer);

  loadShirtModel(modelGroup, (loadedMesh) => {
    shirtMesh = loadedMesh;
    interaction.adjustLayout();
  });

  startStudioAnimationLoop(renderer, scene, camera, modelGroup, interaction, () => shirtMesh);
}

initStudio3D();
