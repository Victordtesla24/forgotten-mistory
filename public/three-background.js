import * as THREE from '/vendor/three.module.js';

// --- Configuration ---
const CONFIG = {
    starCount: 2000,
    nebulaCount: 20,
    baseSpeed: 0.2,
    scrollMultiplier: 0.15,
    starColor: 0xffffff,
    nebulaColor: 0x3d00ff // Deep purple/blue
};

// --- Setup ---
const canvas = document.querySelector('#webgl');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.001);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 1;
camera.rotation.x = Math.PI / 2; // Point camera up/down for tunnel effect

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: false, // Solid black background for better blending
    antialias: true,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- State ---
let scrollY = 0;
let lastScrollY = 0;
let scrollVelocity = 0;
let mouse = new THREE.Vector2(0, 0);
let targetMouse = new THREE.Vector2(0, 0);

// --- Star Tunnel System ---
const starGeo = new THREE.BufferGeometry();
const starPos = [];
const starVel = []; // Store individual velocities

for(let i = 0; i < CONFIG.starCount; i++) {
    starPos.push(
        (Math.random() - 0.5) * 600, // x
        (Math.random() - 0.5) * 600, // y
        (Math.random() - 0.5) * 600  // z
    );
    starVel.push(Math.random());
}
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
starGeo.setAttribute('velocity', new THREE.Float32BufferAttribute(starVel, 1));

// Custom Shader for "Warp" effect
const starMat = new THREE.ShaderMaterial({
    uniforms: {
        color: { value: new THREE.Color(CONFIG.starColor) },
        time: { value: 0 },
        speed: { value: 0 }
    },
    vertexShader: `
        uniform float time;
        uniform float speed;
        attribute float velocity;
        varying float vAlpha;
        
        void main() {
            vec3 pos = position;
            
            // Move stars along Y axis (tunnel direction) based on time and scroll speed
            // The 'velocity' attribute makes some stars faster for parallax
            float movement = time * (20.0 + speed * 50.0) * velocity;
            
            // Wrap around logic
            pos.y = mod(pos.y - movement, 600.0) - 300.0;
            
            // Warp stretch effect: Stretch Z based on speed
            // We simply use point size for now, but line distortion can happen in simple motion blur via opacity
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            
            // Size attenuation
            gl_PointSize = (2.0 + speed * 0.5) * (300.0 / -mvPosition.z);
            
            // Fade out at edges
            vAlpha = smoothstep(300.0, 200.0, abs(pos.y));
        }
    `,
    fragmentShader: `
        uniform vec3 color;
        varying float vAlpha;
        
        void main() {
            // Soft circle particle
            vec2 coord = gl_PointCoord - vec2(0.5);
            float dist = length(coord);
            if (dist > 0.5) discard;
            
            float alpha = (0.5 - dist) * 2.0 * vAlpha;
            gl_FragColor = vec4(color, alpha);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const starSystem = new THREE.Points(starGeo, starMat);
scene.add(starSystem);

// --- Nebula Smoke (Simple Sprites) ---
// Create soft smoke textures programmatically
const canvasSize = 64;
const canvasSprite = document.createElement('canvas');
canvasSprite.width = canvasSize;
canvasSprite.height = canvasSize;
const ctx = canvasSprite.getContext('2d');
const grad = ctx.createRadialGradient(canvasSize/2, canvasSize/2, 0, canvasSize/2, canvasSize/2, canvasSize/2);
grad.addColorStop(0, 'rgba(100, 100, 255, 0.5)');
grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, canvasSize, canvasSize);

const smokeTexture = new THREE.CanvasTexture(canvasSprite);
const smokeGeo = new THREE.BufferGeometry();
const smokePos = [];

for(let i = 0; i < CONFIG.nebulaCount; i++) {
    smokePos.push(
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 800, // Spread along tunnel
        (Math.random() - 0.5) * 200
    );
}
smokeGeo.setAttribute('position', new THREE.Float32BufferAttribute(smokePos, 3));

const smokeMat = new THREE.PointsMaterial({
    size: 150,
    map: smokeTexture,
    transparent: true,
    opacity: 0.05,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: CONFIG.nebulaColor
});

const smokeSystem = new THREE.Points(smokeGeo, smokeMat);
scene.add(smokeSystem);

// --- Event Listeners ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

document.addEventListener('mousemove', (e) => {
    targetMouse.x = (e.clientX - window.innerWidth / 2) * 0.001;
    targetMouse.y = (e.clientY - window.innerHeight / 2) * 0.001;
});

window.addEventListener('scroll', () => {
    lastScrollY = scrollY;
    scrollY = window.scrollY;
    // Calculate momentary velocity
    const delta = Math.abs(scrollY - lastScrollY);
    scrollVelocity += delta * 0.05; // Add impulse
});

// --- Animation Loop ---
const clock = new THREE.Clock();

function animate() {
    const time = clock.getElapsedTime();
    
    // Smoothly decay velocity back to 0
    scrollVelocity *= 0.95;
    const effectiveSpeed = CONFIG.baseSpeed + scrollVelocity * 0.01;
    
    // Smooth mouse follow
    mouse.x += (targetMouse.x - mouse.x) * 0.05;
    mouse.y += (targetMouse.y - mouse.y) * 0.05;
    
    // Update Star Shader Uniforms
    starMat.uniforms.time.value = time;
    starMat.uniforms.speed.value = Math.max(0, scrollVelocity); // Warp intensity
    
    // Rotate entire system slightly based on mouse
    scene.rotation.z = mouse.x * 0.5;
    scene.rotation.x = mouse.y * 0.2;
    
    // Animate Smoke
    const smokePositions = smokeSystem.geometry.attributes.position.array;
    for(let i=0; i < CONFIG.nebulaCount; i++) {
        // Slowly drift smoke
        smokePositions[i*3+1] -= 0.2; // Move down tunnel
        if(smokePositions[i*3+1] < -400) smokePositions[i*3+1] = 400; // Reset
        
        // Gentle sway
        smokePositions[i*3] += Math.sin(time * 0.5 + i) * 0.1;
    }
    smokeSystem.geometry.attributes.position.needsUpdate = true;

    // Camera gentle bob
    camera.position.y = Math.sin(time * 0.5) * 2;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();