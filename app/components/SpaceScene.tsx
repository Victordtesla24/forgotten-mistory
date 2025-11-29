'use client';

import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree, extend, Object3DNode } from '@react-three/fiber';
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing';
import { Trail, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

// --- Constants ---
const STAR_COUNT = 8000;
const STAR_SEED = 1337;
// Using realistic star colors (white/blue-white/yellow-white/orange-white)
const STAR_COLORS = [
  new THREE.Color('#ffffff'), // White
  new THREE.Color('#d0e0ff'), // Blue-white
  new THREE.Color('#ffeebb'), // Yellow-white
  new THREE.Color('#ffddaa')  // Orange-white
];

const mulberry32 = (a: number) => {
  return () => {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};

// --- Nebula Shader Material ---
const NebulaMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0.1, 0.1, 0.2), // Darker base color for realism
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float time;
    uniform vec3 color;
    varying vec2 vUv;

    // Simple noise function
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    float fbm(vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 5; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec2 uv = vUv;
      
      // Moving noise
      float n = fbm(uv * 3.0 + time * 0.05);
      float n2 = fbm(uv * 6.0 - time * 0.02);
      
      float cloud = n * n2;
      
      // Soft edges
      float alpha = smoothstep(0.3, 0.7, cloud);
      float dist = distance(uv, vec2(0.5));
      alpha *= 1.0 - smoothstep(0.0, 0.5, dist);

      gl_FragColor = vec4(color + vec3(n * 0.2), alpha * 0.3);
    }
  `
);

extend({ NebulaMaterial });

// Add type definition for the custom shader material
declare global {
  namespace JSX {
    interface IntrinsicElements {
      nebulaMaterial: Object3DNode<THREE.ShaderMaterial, typeof NebulaMaterial> & {
        time?: number;
        color?: THREE.Color | string;
      };
    }
  }
}

// --- Nebula Component ---
interface NebulaCloudProps {
  position: [number, number, number];
  color: string;
  scale: [number, number, number];
}

function NebulaCloud({ position, color, scale }: NebulaCloudProps) {
  // Cast to any because the shader material adds the 'time' uniform property which isn't on standard ShaderMaterial type
  const materialRef = useRef<any>(null);
  
  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.time += delta;
    }
  });

  return (
    <mesh position={position} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <nebulaMaterial ref={materialRef} color={color} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

// --- Shooting Star Component ---
function ShootingStar() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [active, setActive] = useState(false);
  const { viewport } = useThree();
  
  // State for current trajectory
  const startPos = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());
  const timer = useRef(0);
  const nextSpawnTime = useRef(Math.random() * 5 + 3); // 3-8 seconds

  useFrame((state, delta) => {
    timer.current += delta;

    if (!active) {
      if (timer.current > nextSpawnTime.current) {
        // Spawn logic
        setActive(true);
        timer.current = 0;
        
        // Random start position (top-left/right area mostly)
        const x = (Math.random() - 0.5) * viewport.width * 1.5;
        const y = (Math.random() - 0.5) * viewport.height * 1.5;
        startPos.current.set(x, y, -Math.random() * 20);
        
        if (meshRef.current) {
            meshRef.current.position.copy(startPos.current);
        }

        // Random direction (generally downward/diagonal)
        velocity.current.set(
          (Math.random() - 0.5) * 20, 
          -Math.random() * 10 - 10, 
          0
        );
        
        // Reset spawn timer for next time
        nextSpawnTime.current = Math.random() * 5 + 3;
      }
    } else {
      // Move star
      if (meshRef.current) {
        meshRef.current.position.addScaledVector(velocity.current, delta);
        
        // Check bounds to deactivate
        if (
           Math.abs(meshRef.current.position.x) > viewport.width ||
           Math.abs(meshRef.current.position.y) > viewport.height
        ) {
          setActive(false);
        }
      }
    }
  });

  if (!active) return null;

  return (
    <Trail
        width={2}
        length={8}
        color={new THREE.Color('#ffffff')}
        attenuation={(t) => t * t}
    >
        <mesh ref={meshRef} position={startPos.current}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
    </Trail>
  );
}

// --- Enhanced StarField ---
function StarField() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport } = useThree();
  
  // Generate random positions and initial data
  const [colors, baseColors, sizes, twinklePhase, twinkleSpeed, initialPositions] = useMemo(() => {
    const rand = mulberry32(STAR_SEED);
    const initialPositions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);
    const baseColors = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const twinklePhase = new Float32Array(STAR_COUNT);
    const twinkleSpeed = new Float32Array(STAR_COUNT);
    
    const tempColor = new THREE.Color();
    
    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      // Position - balanced spread with all stars behind camera for consistency
      const x = (rand() - 0.5) * 240;
      const y = (rand() - 0.5) * 240;
      const z = -40 - rand() * 180; // Keep depth negative so they sit behind content
      
      initialPositions[i3] = x;
      initialPositions[i3 + 1] = y;
      initialPositions[i3 + 2] = z;
      
      // Color with subtle brightness variation
      const colorIndex = Math.floor(rand() * STAR_COLORS.length);
      tempColor.copy(STAR_COLORS[colorIndex]);
      const brightness = 0.55 + rand() * 0.45;
      
      baseColors[i3] = tempColor.r * brightness;
      baseColors[i3 + 1] = tempColor.g * brightness;
      baseColors[i3 + 2] = tempColor.b * brightness;
      
      colors[i3] = baseColors[i3];
      colors[i3 + 1] = baseColors[i3 + 1];
      colors[i3 + 2] = baseColors[i3 + 2];
      
      // Size gently tied to depth for distant speck feel
      const depthFactor = 1 - Math.min(1, Math.abs(z) / 220);
      sizes[i] = 0.15 + rand() * 0.35 + depthFactor * 0.05;
      
      // Twinkle speed/phase
      twinklePhase[i] = rand() * Math.PI * 2;
      twinkleSpeed[i] = 0.4 + rand() * 0.8;
    }
    
    return [colors, baseColors, sizes, twinklePhase, twinkleSpeed, initialPositions];
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const mouseVec = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const colorAttr = meshRef.current.geometry.getAttribute('color') as THREE.InstancedBufferAttribute;

    // Map mouse to world space roughly at z=0
    // Note: unproject is more accurate but simple mapping works for background effects
    mouseVec.set(
        (state.mouse.x * viewport.width) / 2,
        (state.mouse.y * viewport.height) / 2,
        0
    );

    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      const baseX = initialPositions[i3];
      const baseY = initialPositions[i3 + 1];
      const baseZ = initialPositions[i3 + 2];

      // Subtle orbital drift plus mouse parallax so field feels alive but stable
      const depthFactor = 1 - Math.min(1, Math.abs(baseZ) / 220);
      const driftX = Math.sin(time * 0.12 + twinklePhase[i]) * 0.25 * depthFactor;
      const driftY = Math.cos(time * 0.15 + twinklePhase[i]) * 0.25 * depthFactor;
      const parallaxX = mouseVec.x * 0.02 * depthFactor;
      const parallaxY = mouseVec.y * 0.02 * depthFactor;

      const x = baseX + driftX + parallaxX;
      const y = baseY + driftY + parallaxY;
      const z = baseZ;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(sizes[i]);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Gentle per-star twinkle for realism
      const twinkle = 0.75 + Math.sin(time * twinkleSpeed[i] + twinklePhase[i]) * 0.2;
      colors[i3] = baseColors[i3] * twinkle;
      colors[i3 + 1] = baseColors[i3 + 1] * twinkle;
      colors[i3 + 2] = baseColors[i3 + 2] * twinkle;
    }
    
    if (colorAttr) {
      colorAttr.needsUpdate = true;
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, STAR_COUNT]}>
      <sphereGeometry args={[0.15, 8, 8]}>
        <instancedBufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </sphereGeometry>
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={1.0}
      />
    </instancedMesh>
  );
}

// --- Main Scene ---
function SceneContent() {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (groupRef.current) {
            // Orbital drift
            groupRef.current.rotation.y += delta * 0.05;
            groupRef.current.rotation.z += delta * 0.01;
        }
    });

    return (
        <group ref={groupRef}>
            <StarField />
            {/* More subtle, realistic nebula colors (Deep blues, purples) */}
            <NebulaCloud position={[0, 0, -50]} color="#1a1a2e" scale={[100, 100, 1]} />
            <NebulaCloud position={[-30, 20, -80]} color="#16213e" scale={[120, 120, 1]} />
            <NebulaCloud position={[30, -20, -60]} color="#1f1b2e" scale={[90, 90, 1]} />
            <ShootingStar />
            <ShootingStar />
        </group>
    );
}

export default function SpaceScene() {
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 bg-black">
      <Canvas
        camera={{ position: [0, 0, 20], fov: 60 }}
        gl={{ antialias: false, alpha: false }}
        dpr={[1, 2]} 
      >
        <color attach="background" args={['#000000']} /> {/* Deep black background */}
        
        <SceneContent />

        <EffectComposer>
          <Bloom intensity={1.0} luminanceThreshold={0.5} mipmapBlur />
          <Noise opacity={0.05} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
