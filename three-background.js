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
const PARTICLE_COUNT = 140;   // Increased slightly
const CONNECT_DISTANCE = 6.0; // Slightly increased
const PARTICLE_SIZE = 0.15;

// --- Particles (Nodes) ---
const particlesGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
const particleVelocities = []; 

for(let i = 0; i < PARTICLE_COUNT; i++) {
    const x = (Math.random() - 0.5) * 35;
    const y = (Math.random() - 0.5) * 35;
    const z = (Math.random() - 0.5) * 35;

    particlePositions[i * 3] = x;
    particlePositions[i * 3 + 1] = y;
    particlePositions[i * 3 + 2] = z;

    particleVelocities.push({
        x: (Math.random() - 0.5) * 0.04,
        y: (Math.random() - 0.5) * 0.04,
        z: (Math.random() - 0.5) * 0.04
    });
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

const particlesMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: PARTICLE_SIZE,
    transparent: true,
    opacity: 0.9,
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// --- Lines (Neural Connections) ---
const linesGeometry = new THREE.BufferGeometry();
const linesMaterial = new THREE.LineBasicMaterial({
    color: 0xff7350, 
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending
});

const linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial);
scene.add(linesMesh);

// --- Data Packets (Pulses) ---
const MAX_PACKETS = 50;
const packets = []; // { active: bool, startIdx: int, endIdx: int, progress: float, speed: float }
const packetGeometry = new THREE.BufferGeometry();
const packetPositions = new Float32Array(MAX_PACKETS * 3);
packetGeometry.setAttribute('position', new THREE.BufferAttribute(packetPositions, 3));

const packetMaterial = new THREE.PointsMaterial({
    color: 0x00f2fe, // Cyan/Blue for contrast with orange lines
    size: 0.25,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending
});

const packetMesh = new THREE.Points(packetGeometry, packetMaterial);
scene.add(packetMesh);

// Initialize packets pool
for(let i=0; i<MAX_PACKETS; i++) {
    packets.push({ active: false, startIdx: -1, endIdx: -1, progress: 0, speed: 0 });
}

// --- Interaction State ---
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;

// Raycaster for more precise interaction (optional, but good for 3D)
const mouse = new THREE.Vector2();

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    
    mouse.x = mouseX;
    mouse.y = mouseY;
});

let scrollY = 0;
window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
});

// --- Animation Loop ---
const clock = new THREE.Clock();

function animate() {
    const elapsedTime = clock.getElapsedTime();
    
    // Pulse particle size
    particlesMaterial.size = PARTICLE_SIZE + Math.sin(elapsedTime * 2.5) * 0.05;
    
    // 1. Update Particle Positions
    const positions = particlesMesh.geometry.attributes.position.array;
    
    for(let i = 0; i < PARTICLE_COUNT; i++) {
        // Apply Velocity
        positions[i*3]     += particleVelocities[i].x;
        positions[i*3 + 1] += particleVelocities[i].y;
        positions[i*3 + 2] += particleVelocities[i].z;

        // Boundary Check (Bounce)
        if(Math.abs(positions[i*3]) > 25) particleVelocities[i].x *= -1;
        if(Math.abs(positions[i*3+1]) > 25) particleVelocities[i].y *= -1;
        if(Math.abs(positions[i*3+2]) > 25) particleVelocities[i].z *= -1;
    }
    
    particlesMesh.geometry.attributes.position.needsUpdate = true;

    // 2. Update Lines & Manage Packets
    const linePositions = [];
    const connectedPairs = []; // Store indices of connected particles
    
    // Rotate scene slowly
    const rotationSpeed = 0.0008;
    particlesMesh.rotation.y += rotationSpeed;
    linesMesh.rotation.y += rotationSpeed;
    packetMesh.rotation.y += rotationSpeed; // Rotate packets with the group
    
    // We need to work in local space for connections since everything rotates together.
    
    for(let i = 0; i < PARTICLE_COUNT; i++) {
        for(let j = i + 1; j < PARTICLE_COUNT; j++) {
            const dx = positions[i*3] - positions[j*3];
            const dy = positions[i*3+1] - positions[j*3+1];
            const dz = positions[i*3+2] - positions[j*3+2];
            const distSq = dx*dx + dy*dy + dz*dz;

            if(distSq < CONNECT_DISTANCE * CONNECT_DISTANCE) {
                linePositions.push(
                    positions[i*3], positions[i*3+1], positions[i*3+2],
                    positions[j*3], positions[j*3+1], positions[j*3+2]
                );
                connectedPairs.push([i, j]);
            }
        }
    }

    linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

    // 3. Data Packets Logic
    // Spawn new packets randomly on existing connections
    if(Math.random() < 0.08) { // Spawn rate
        const inactivePacket = packets.find(p => !p.active);
        if(inactivePacket && connectedPairs.length > 0) {
            const pair = connectedPairs[Math.floor(Math.random() * connectedPairs.length)];
            inactivePacket.active = true;
            inactivePacket.startIdx = pair[0];
            inactivePacket.endIdx = pair[1];
            inactivePacket.progress = 0;
            inactivePacket.speed = 0.01 + Math.random() * 0.02; // Random speed
            
            // Randomly swap start/end so they travel both ways
            if(Math.random() > 0.5) {
                [inactivePacket.startIdx, inactivePacket.endIdx] = [inactivePacket.endIdx, inactivePacket.startIdx];
            }
        }
    }

    // Update packet positions
    const packetPosArray = packetMesh.geometry.attributes.position.array;
    // Reset all to far away/hidden
    for(let i=0; i<MAX_PACKETS*3; i++) packetPosArray[i] = 9999;

    packets.forEach((p, idx) => {
        if(p.active) {
            p.progress += p.speed;
            
            if(p.progress >= 1) {
                p.active = false;
            } else {
                const s = p.startIdx * 3;
                const e = p.endIdx * 3;
                
                // Lerp
                const x = positions[s] + (positions[e] - positions[s]) * p.progress;
                const y = positions[s+1] + (positions[e+1] - positions[s+1]) * p.progress;
                const z = positions[s+2] + (positions[e+2] - positions[s+2]) * p.progress;
                
                packetPosArray[idx*3] = x;
                packetPosArray[idx*3+1] = y;
                packetPosArray[idx*3+2] = z;
            }
        }
    });
    packetMesh.geometry.attributes.position.needsUpdate = true;


    // 4. Interaction & Camera
    targetRotationY = mouseX * 0.2;
    targetRotationX = mouseY * 0.2;
    
    scene.rotation.y += 0.05 * (targetRotationY - scene.rotation.y);
    scene.rotation.x += 0.05 * (targetRotationX - scene.rotation.x);

    // Scroll parallax
    camera.position.y = -scrollY * 0.008; 

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});