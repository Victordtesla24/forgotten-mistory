import * as THREE from '/vendor/three.module.js';

const canvas = document.querySelector('#webgl');

// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505); // Deep space black

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 50);

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- Group 1: Network (Foreground) ---
// Nodes and connections representing "AI/Neural Network"
const NETWORK_COUNT = 150;
const networkGeo = new THREE.BufferGeometry();
const networkPos = new Float32Array(NETWORK_COUNT * 3);
const networkVel = [];

for(let i = 0; i < NETWORK_COUNT; i++) {
    networkPos[i*3] = (Math.random() - 0.5) * 80;
    networkPos[i*3+1] = (Math.random() - 0.5) * 80;
    networkPos[i*3+2] = (Math.random() - 0.5) * 40; // Closer to camera
    
    networkVel.push({
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
        z: (Math.random() - 0.5) * 0.02
    });
}
networkGeo.setAttribute('position', new THREE.BufferAttribute(networkPos, 3));
const networkMat = new THREE.PointsMaterial({
    color: 0x00f2fe, // Cyan/Teal for tech feel
    size: 0.4,
    transparent: true,
    opacity: 0.8
});
const networkMesh = new THREE.Points(networkGeo, networkMat);
scene.add(networkMesh);

// Lines for Network
const linesGeo = new THREE.BufferGeometry();
const linesMat = new THREE.LineBasicMaterial({
    color: 0x00f2fe,
    transparent: true,
    opacity: 0.15
});
const linesMesh = new THREE.LineSegments(linesGeo, linesMat);
scene.add(linesMesh);

// --- Group 2: Deep Stars (Background) ---
// High count, small size, slow movement
const STAR_COUNT = 1500;
const starsGeo = new THREE.BufferGeometry();
const starsPos = new Float32Array(STAR_COUNT * 3);

for(let i = 0; i < STAR_COUNT; i++) {
    starsPos[i*3] = (Math.random() - 0.5) * 300;
    starsPos[i*3+1] = (Math.random() - 0.5) * 300;
    starsPos[i*3+2] = -50 - Math.random() * 100; // Far behind
}
starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
const starsMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.6,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8
});
const starsMesh = new THREE.Points(starsGeo, starsMat);
scene.add(starsMesh);

// --- Group 3: Twinkling Stars (Active) ---
const TWINKLE_COUNT = 300;
const twinkleGeo = new THREE.BufferGeometry();
const twinklePos = new Float32Array(TWINKLE_COUNT * 3);
// Add random phase for twinkling
const twinklePhase = new Float32Array(TWINKLE_COUNT); 

for(let i = 0; i < TWINKLE_COUNT; i++) {
    twinklePos[i*3] = (Math.random() - 0.5) * 200;
    twinklePos[i*3+1] = (Math.random() - 0.5) * 200;
    twinklePos[i*3+2] = -20 - Math.random() * 80;
    twinklePhase[i] = Math.random() * Math.PI * 2;
}
twinkleGeo.setAttribute('position', new THREE.BufferAttribute(twinklePos, 3));
twinkleGeo.setAttribute('phase', new THREE.BufferAttribute(twinklePhase, 1));

// Use a custom shader for true per-particle twinkling efficiently
const twinkleMat = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0xffaa80) } // Slight orange tint for warmth/contrast
    },
    vertexShader: `
        attribute float phase;
        varying float vAlpha;
        uniform float time;
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = (40.0 / -mvPosition.z); // Size attenuation
            
            // Twinkle math: sine wave based on time + random phase
            float twinkle = sin(time * 2.0 + phase);
            vAlpha = 0.5 + 0.5 * twinkle; 
        }
    `,
    fragmentShader: `
        uniform vec3 color;
        varying float vAlpha;
        void main() {
            if (length(gl_PointCoord - vec2(0.5, 0.5)) > 0.475) discard; // Circular particle
            gl_FragColor = vec4(color, vAlpha);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});

const twinkleMesh = new THREE.Points(twinkleGeo, twinkleMat);
scene.add(twinkleMesh);


// --- Interaction & Parallax ---
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX) * 0.001;
    mouseY = (event.clientY - windowHalfY) * 0.001;
});

let scrollY = 0;
window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
});

// --- Animation Loop ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    targetX = mouseX * 0.5;
    targetY = mouseY * 0.5;

    // Update Shader Uniforms
    twinkleMat.uniforms.time.value = elapsedTime;

    // 1. Network Animation (Float + Mouse Interaction)
    const positions = networkGeo.attributes.position.array;
    for(let i = 0; i < NETWORK_COUNT; i++) {
        positions[i*3] += networkVel[i].x;
        positions[i*3+1] += networkVel[i].y;
        
        // Gentle boundary wrap
        if(Math.abs(positions[i*3]) > 40) networkVel[i].x *= -1;
        if(Math.abs(positions[i*3+1]) > 40) networkVel[i].y *= -1;
    }
    networkGeo.attributes.position.needsUpdate = true;

    // Network rotation (Mouse interaction)
    networkMesh.rotation.y += 0.05 * (targetX - networkMesh.rotation.y);
    networkMesh.rotation.x += 0.05 * (targetY - networkMesh.rotation.x);
    linesMesh.rotation.copy(networkMesh.rotation); // Sync lines with nodes

    // Update Connections
    const linePositions = [];
    const connectDist = 12; 
    
    // Optimization: Only check nearby particles or limit checks per frame if needed
    // For 150 particles, brute force is ~11k checks, usually fine for desktop
    // We calculate world positions for accurate distance if we wanted, but local is fine since they rotate together
    
    let connections = 0;
    for(let i = 0; i < NETWORK_COUNT; i++) {
        for(let j = i + 1; j < NETWORK_COUNT; j++) {
            const dx = positions[i*3] - positions[j*3];
            const dy = positions[i*3+1] - positions[j*3+1];
            const dz = positions[i*3+2] - positions[j*3+2];
            const distSq = dx*dx + dy*dy + dz*dz;

            if(distSq < connectDist * connectDist) {
                // Limit connections per node to avoid clutter
                if (connections > 300) break; 
                
                linePositions.push(
                    positions[i*3], positions[i*3+1], positions[i*3+2],
                    positions[j*3], positions[j*3+1], positions[j*3+2]
                );
                connections++;
            }
        }
    }
    linesGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

    // 2. Stars Parallax (Scroll + Mouse)
    // Rotate stars much slower than foreground for depth
    starsMesh.rotation.y += 0.01 * (targetX - starsMesh.rotation.y);
    starsMesh.rotation.x += 0.01 * (targetY - starsMesh.rotation.x);
    
    // Twinkle stars follow similar parallax but slightly different for depth feel
    twinkleMesh.rotation.y += 0.015 * (targetX - twinkleMesh.rotation.y);
    twinkleMesh.rotation.x += 0.015 * (targetY - twinkleMesh.rotation.x);

    // Constant slow rotation
    starsMesh.rotation.z += 0.0005;
    twinkleMesh.rotation.z += 0.0003;

    // Scroll Parallax
    // Move camera Y based on scroll
    camera.position.y = -scrollY * 0.02;
    
    renderer.render(scene, camera);
}

animate();

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
