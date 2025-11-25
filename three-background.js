import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const canvas = document.querySelector('#webgl');
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 20;

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true, 
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- Configuration ---
const PARTICLE_COUNT = 120;   // Number of nodes
const CONNECT_DISTANCE = 5.5; // Max distance to draw a line
const MOUSE_RADIUS = 8;       // Radius of mouse influence
const PARTICLE_SIZE = 0.15;

// --- Particles (Nodes) ---
const particlesGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
const particleVelocities = []; // Store velocity vectors
const particleOriginalPos = []; // To allow them to drift but stay generally bounded? No, free floating is better.

for(let i = 0; i < PARTICLE_COUNT; i++) {
    // Spread them out in a volume
    const x = (Math.random() - 0.5) * 35;
    const y = (Math.random() - 0.5) * 35;
    const z = (Math.random() - 0.5) * 35;

    particlePositions[i * 3] = x;
    particlePositions[i * 3 + 1] = y;
    particlePositions[i * 3 + 2] = z;

    // Random slow drift velocity
    particleVelocities.push({
        x: (Math.random() - 0.5) * 0.04,
        y: (Math.random() - 0.5) * 0.04,
        z: (Math.random() - 0.5) * 0.04
    });
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

// Material: Glowing orange/white nodes
const particlesMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: PARTICLE_SIZE,
    transparent: true,
    opacity: 0.9,
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// --- Lines (Neural Connections) ---
// We'll use LineSegments which requires pairs of vertices
const linesGeometry = new THREE.BufferGeometry();
const linesMaterial = new THREE.LineBasicMaterial({
    color: 0xff7350, // The accent color from your CSS
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending
});

const linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial);
scene.add(linesMesh);

// --- Interaction State ---
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;

// Mouse movement tracker
document.addEventListener('mousemove', (event) => {
    // Normalize mouse -1 to 1
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Scroll tracker
let scrollY = 0;
window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
});

// --- Animation Loop ---
const clock = new THREE.Clock();

function animate() {
    const elapsedTime = clock.getElapsedTime();
    
    // Pulse particle size
    particlesMaterial.size = PARTICLE_SIZE + Math.sin(elapsedTime * 2) * 0.03;
    
    // 1. Update Particle Positions
    const positions = particlesMesh.geometry.attributes.position.array;
    
    for(let i = 0; i < PARTICLE_COUNT; i++) {
        // Apply Velocity
        positions[i*3]     += particleVelocities[i].x;
        positions[i*3 + 1] += particleVelocities[i].y;
        positions[i*3 + 2] += particleVelocities[i].z;

        // Boundary Check (Bounce)
        if(Math.abs(positions[i*3]) > 20) particleVelocities[i].x *= -1;
        if(Math.abs(positions[i*3+1]) > 20) particleVelocities[i].y *= -1;
        if(Math.abs(positions[i*3+2]) > 20) particleVelocities[i].z *= -1;
    }
    
    // Notify Three.js that positions changed
    particlesMesh.geometry.attributes.position.needsUpdate = true;

    // 2. Update Lines (The "Neural" Logic)
    // Calculate distances between all points. Expensive O(N^2), but okay for N=120
    const linePositions = [];
    
    // To make the lines pulse or look active, we could modulate opacity, but LineBasicMaterial is constant.
    // Instead, we dynamically rebuild the geometry every frame.
    
    // Apply a slow global rotation to the mesh group for dynamism
    const rotationSpeed = 0.001;
    particlesMesh.rotation.y += rotationSpeed;
    linesMesh.rotation.y += rotationSpeed;
    
    // We need world positions to calculate connections if we rotate the group? 
    // Actually, if we rotate both meshes identically, their relative local space remains valid.
    // So we can calculate distance in local space.

    for(let i = 0; i < PARTICLE_COUNT; i++) {
        for(let j = i + 1; j < PARTICLE_COUNT; j++) {
            const dx = positions[i*3] - positions[j*3];
            const dy = positions[i*3+1] - positions[j*3+1];
            const dz = positions[i*3+2] - positions[j*3+2];
            const distSq = dx*dx + dy*dy + dz*dz;

            if(distSq < CONNECT_DISTANCE * CONNECT_DISTANCE) {
                // Add a connection
                linePositions.push(
                    positions[i*3], positions[i*3+1], positions[i*3+2],
                    positions[j*3], positions[j*3+1], positions[j*3+2]
                );
            }
        }
    }

    linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

    // 3. Interaction & Camera
    // Smooth rotation based on mouse
    targetRotationY = mouseX * 0.2;
    targetRotationX = mouseY * 0.2;
    
    // Lerp camera slightly for parallax feel
    scene.rotation.y += 0.05 * (targetRotationY - scene.rotation.y);
    scene.rotation.x += 0.05 * (targetRotationX - scene.rotation.x);

    // Scroll effect: Move camera vertically
    camera.position.y = -scrollY * 0.005; 

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

// --- Resize Handling ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});