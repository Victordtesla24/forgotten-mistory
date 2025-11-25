import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const canvas = document.querySelector('#webgl');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Particles
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 3000; // Increased count for "starry" feel

const posArray = new Float32Array(particlesCount * 3);

for(let i = 0; i < particlesCount * 3; i++) {
    // Spread them out more for depth
    posArray[i] = (Math.random() - 0.5) * 10; 
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

// Material
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.008,
    color: '#ffffff',
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true // Makes distant particles smaller
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

camera.position.z = 3;

// Mouse interaction
let mouseX = 0;
let mouseY = 0;

// Target rotation for smooth interpolation
let targetRotationX = 0;
let targetRotationY = 0;

document.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

// Scroll interaction
let scrollY = 0;
window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
});

// Animation
const clock = new THREE.Clock();

function animate() {
    const elapsedTime = clock.getElapsedTime();

    // Smooth mouse follow
    targetRotationY = mouseX * 0.0001;
    targetRotationX = mouseY * 0.0001;

    // Apply rotation with dampening
    particlesMesh.rotation.y += 0.001; // Constant slow rotation
    particlesMesh.rotation.x += (targetRotationX - particlesMesh.rotation.x) * 0.05;
    particlesMesh.rotation.y += (targetRotationY - (particlesMesh.rotation.y - elapsedTime * 0.05)) * 0.05;

    // Scroll Parallax Effect: Move particles up/down or zoom based on scroll
    // This gives the feeling of traveling through the stars
    camera.position.y = -scrollY * 0.001; 

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
