import * as THREE from "three";

const PARTICLE_COUNT = 150;
const FIELD_RADIUS = 3.5;
const LINK_DISTANCE = 0.65;
const POINTER_RADIUS = 1.25;

export function initBackground() {
  const canvas = document.getElementById("webgl-bg") as HTMLCanvasElement | null;
  if (!canvas) return () => {};

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.z = 5;

  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() * 2 - 1) * FIELD_RADIUS;
    positions[i3 + 1] = (Math.random() * 2 - 1) * FIELD_RADIUS;
    positions[i3 + 2] = (Math.random() * 2 - 1) * FIELD_RADIUS;
  }
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.035,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    })
  );
  scene.add(particles);

  const maxSegments = PARTICLE_COUNT * PARTICLE_COUNT;
  const linePositions = new Float32Array(maxSegments * 3 * 2);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
  const lines = new THREE.LineSegments(
    lineGeometry,
    new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
      linewidth: 1,
    })
  );
  scene.add(lines);

  const tempA = new THREE.Vector3();
  const tempB = new THREE.Vector3();
  const pointer = new THREE.Vector3();
  let hasPointer = false;

  const toWorldFromClient = (x: number, y: number) => {
    const ndc = new THREE.Vector3(
      (x / window.innerWidth) * 2 - 1,
      -(y / window.innerHeight) * 2 + 1,
      0.5
    );
    ndc.unproject(camera);
    const dir = ndc.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    return camera.position.clone().add(dir.multiplyScalar(distance));
  };

  const onPointerMove = (event: PointerEvent) => {
    const worldPoint = toWorldFromClient(event.clientX, event.clientY);
    pointer.copy(worldPoint);
    hasPointer = true;
  };

  const onResize = () => {
    const { innerWidth, innerHeight } = window;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  };

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("resize", onResize);

  let frameId = 0;
  const animate = () => {
    frameId = requestAnimationFrame(animate);

    particles.rotation.y += 0.0008;
    particles.rotation.x += 0.0005;

    let segmentIndex = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ia = i * 3;
      tempA.fromArray(positions, ia);

    for (let j = i + 1; j < PARTICLE_COUNT; j++) {
      const ja = j * 3;
      tempB.fromArray(positions, ja);

      if (!hasPointer) continue;
      if (tempA.distanceTo(tempB) > LINK_DISTANCE) continue;

      const closeA = pointer.distanceTo(tempA) < POINTER_RADIUS;
      const closeB = pointer.distanceTo(tempB) < POINTER_RADIUS;
      if (!closeA || !closeB) continue;

        const idx = segmentIndex * 6;
        linePositions[idx] = tempA.x;
        linePositions[idx + 1] = tempA.y;
        linePositions[idx + 2] = tempA.z;
        linePositions[idx + 3] = tempB.x;
        linePositions[idx + 4] = tempB.y;
        linePositions[idx + 5] = tempB.z;
        segmentIndex++;
      }
    }

    lines.geometry.setDrawRange(0, segmentIndex * 2);
    (lines.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;

    renderer.render(scene, camera);
  };

  animate();

  return () => {
    cancelAnimationFrame(frameId);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("resize", onResize);
    particleGeometry.dispose();
    lineGeometry.dispose();
    (particles.material as THREE.Material).dispose();
    (lines.material as THREE.Material).dispose();
    renderer.dispose();
  };
}

export default initBackground;
