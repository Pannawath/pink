/**
 * =========================================================================
 * OPAL STUDIO 3D ENGINE - REAL WEBGL GLB VIEWER
 * Renders 3dmodel/shirt.glb with luxury studio lighting and parallax float
 * =========================================================================
 */

(function initStudio3D() {
  const canvas = document.getElementById('bg3dCanvas');
  if (!canvas) return;

  // 1. Scene & Camera Setup
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    38,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 4.2);

  // 2. WebGL Renderer with High Dynamic Range settings
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

  // 3. Luxury Studio Lighting System
  // Key Light (Warm Studio Key)
  const keyLight = new THREE.DirectionalLight(0xfff8f2, 2.5);
  keyLight.position.set(3.5, 4.5, 3.5);
  scene.add(keyLight);

  // Fill Light (Soft Cool Opal Fill)
  const fillLight = new THREE.DirectionalLight(0xe8f0fe, 1.6);
  fillLight.position.set(-3.5, 2.5, 2.5);
  scene.add(fillLight);

  // Back Rim Light (Sharp Specular Edge Light)
  const rimLight = new THREE.DirectionalLight(0xffe4e6, 3.2);
  rimLight.position.set(-1.0, 4.0, -3.5);
  scene.add(rimLight);

  // Bottom Bounce Light (Reflective White Floor)
  const bounceLight = new THREE.DirectionalLight(0xf8fafc, 1.2);
  bounceLight.position.set(0, -4.0, 1.5);
  scene.add(bounceLight);

  // Ambient Studio Dome
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  // 4. Model Container & State
  const modelGroup = new THREE.Group();
  scene.add(modelGroup);

  let shirtMesh = null;
  let targetRotationX = 0.12;
  let targetRotationY = -0.35;
  let targetRotationZ = -0.15;
  let mouseX = 0;
  let mouseY = 0;
  let windowHalfX = window.innerWidth / 2;
  let windowHalfY = window.innerHeight / 2;

  // 5. Load assets/models/shirt.glb via Three.js GLTFLoader
  const loader = new THREE.GLTFLoader();
  loader.load(
    'assets/models/shirt.glb',
    function onModelLoaded(gltf) {
      const model = gltf.scene;

      // Calculate Bounding Box to perfectly center and normalize scale
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      // Re-center geometry at origin
      model.position.x = -center.x;
      model.position.y = -center.y;
      model.position.z = -center.z;

      // Enhance PBR Material parameters for studio realism
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.roughness = Math.min(child.material.roughness, 0.75);
            child.material.metalness = 0.05;
            child.material.needsUpdate = true;
          }
        }
      });

      // Fit into target scale (normalized height ~ 2.4 units)
      const maxAxis = Math.max(size.x, size.y, size.z);
      const scaleFactor = 2.4 / maxAxis;
      modelGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);

      // Default Studio Pose (Angled isometric view similar to user mockup)
      modelGroup.position.set(-1.42, 0.02, 0); // Positioned on left background
      modelGroup.rotation.set(0.18, -0.42, -0.16);

      shirtMesh = model;
      modelGroup.add(model);

      console.log('[STUDIO 3D] Model loaded and centered successfully');
      adjustLayoutForScreen();
    },
    function onProgress(xhr) {
      if (xhr.lengthComputable) {
        const percent = Math.round((xhr.loaded / xhr.total) * 100);
        console.log(`[STUDIO 3D] Loading GLB: ${percent}%`);
      }
    },
    function onError(error) {
      console.error('[STUDIO 3D] Error loading 3dmodel/shirt.glb:', error);
    }
  );

  // 6. Responsive Screen Adaptation
  function adjustLayoutForScreen() {
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      modelGroup.position.set(0, 0.25, -0.5);
      camera.position.z = 4.8;
    } else {
      modelGroup.position.set(-1.25, -0.05, 0);
      camera.position.z = 4.2;
    }
  }

  // 7. Interactive Mouse & Gyroscope (DeviceOrientation) Parallax Tracking
  // Slower, smaller angle interaction (mouseX * 0.15 instead of 0.45)
  window.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX) / windowHalfX;
    mouseY = (event.clientY - windowHalfY) / windowHalfY;

    targetRotationY = -0.35 + mouseX * 0.15;
    targetRotationX = 0.12 + mouseY * 0.10;
  });

  // DeviceOrientation Gyroscope Handler for Mobile Devices (Android & iOS & iPad)
  function handleDeviceOrientation(event) {
    if (event.gamma === null || event.beta === null) return;

    // Clamp gamma (roll left/right -90 to 90) and beta (pitch front/back -180 to 180)
    let normGamma = Math.max(-45, Math.min(45, event.gamma)) / 45; // -1 to 1
    let normBeta = Math.max(-45, Math.min(45, event.beta)) / 45;   // -1 to 1

    targetRotationY = -0.35 + normGamma * 0.18;
    targetRotationX = 0.12 + normBeta * 0.12;
  }

  // Request Gyro Permission on iOS 13+ / iPadOS or listen directly on Android
  function enableGyroscope() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ Devices & iPads requiring user gesture permission
      const requestGyroOnInteraction = () => {
        DeviceOrientationEvent.requestPermission()
          .then((response) => {
            if (response === 'granted') {
              window.addEventListener('deviceorientation', handleDeviceOrientation, true);
            }
          })
          .catch(console.error);
        window.removeEventListener('touchstart', requestGyroOnInteraction);
        window.removeEventListener('click', requestGyroOnInteraction);
      };
      window.addEventListener('touchstart', requestGyroOnInteraction, { once: true });
      window.addEventListener('click', requestGyroOnInteraction, { once: true });
    } else if (window.DeviceOrientationEvent) {
      // Android and standard Web API devices
      window.addEventListener('deviceorientation', handleDeviceOrientation, true);
    }
  }

  enableGyroscope();

  // 8. Viewport Resize Handler
  window.addEventListener('resize', () => {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    adjustLayoutForScreen();
  });

  // 9. Studio Animation Loop (Ultra-smooth Floating Levitation + Slow Damping Lerp)
  let clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    if (shirtMesh) {
      // Gentle sinusoidal studio floating animation
      const floatOffsetY = Math.sin(elapsedTime * 1.0) * 0.05;
      const floatRotZ = -0.15 + Math.sin(elapsedTime * 0.7) * 0.02;

      modelGroup.position.y = (window.innerWidth < 1024 ? 0.25 : -0.05) + floatOffsetY;

      // Slower lerp speed (0.025 instead of 0.05) for smooth gradual rotation
      modelGroup.rotation.y += (targetRotationY - modelGroup.rotation.y) * 0.025;
      modelGroup.rotation.x += (targetRotationX - modelGroup.rotation.x) * 0.025;
      modelGroup.rotation.z += (floatRotZ - modelGroup.rotation.z) * 0.025;
    }

    renderer.render(scene, camera);
  }

  animate();
})();
