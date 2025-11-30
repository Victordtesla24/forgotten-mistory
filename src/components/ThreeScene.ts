import * as THREE from 'three';

export function initScene(): () => void {
  const container = document.getElementById('canvas-container');

  if (!container) {
    console.warn('Canvas container not found for Three.js scene.');
    return () => {};
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1200
  );
  camera.position.set(0, 0, 8);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.inset = '0';

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const particleCount = 3000;
  const spread = 240;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const speeds = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * spread;
    positions[i3 + 1] = (Math.random() - 0.5) * spread;
    positions[i3 + 2] = -Math.random() * spread;
    speeds[i] = 35 + Math.random() * 45;
  }

  const positionAttribute = new THREE.BufferAttribute(positions, 3);
  geometry.setAttribute('position', positionAttribute);
  const positionArray = positionAttribute.array as Float32Array;

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.07,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  const starfield = new THREE.Points(geometry, material);
  scene.add(starfield);

  const mouse = new THREE.Vector2(0, 0);
  const targetRotation = new THREE.Euler();

  const handleMouseMove = (event: MouseEvent) => {
    mouse.x = (event.clientX / window.innerWidth - 0.5) * 2;
    mouse.y = (event.clientY / window.innerHeight - 0.5) * 2;
  };

  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('resize', handleResize);

  const clock = new THREE.Clock();
  let animationId = 0;

  const animate = () => {
    const delta = clock.getDelta();
    for (let i = 0; i < particleCount; i++) {
      const zIndex = i * 3 + 2;
      positionArray[zIndex] += speeds[i] * delta;

      if (positionArray[zIndex] > 60) {
        positionArray[zIndex] = -spread;
        positionArray[zIndex - 1] = (Math.random() - 0.5) * spread;
        positionArray[zIndex - 2] = (Math.random() - 0.5) * spread;
      }
    }

    positionAttribute.needsUpdate = true;

    targetRotation.x += (mouse.y * 0.12 - targetRotation.x) * 0.05;
    targetRotation.y += (mouse.x * 0.12 - targetRotation.y) * 0.05;
    camera.rotation.set(targetRotation.x, targetRotation.y, 0);

    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
  };

  animate();

  return () => {
    cancelAnimationFrame(animationId);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('resize', handleResize);
    geometry.dispose();
    material.dispose();
    renderer.dispose();

    if (renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement);
    }
  };
}
