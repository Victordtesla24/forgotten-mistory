'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

const STAR_COUNT = 4000;
const COMFORT_COLOR = new THREE.Color('#ff7350'); // Accent
const CYBER_COLOR = new THREE.Color('#00f2fe');   // Cyan

// --- Custom Hook for Warp Effect ---
function useWarpEffect() {
  const scrollRef = useRef(0);
  
  useEffect(() => {
    const handleScroll = () => {
      scrollRef.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollRef;
}

function StarField() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport } = useThree();
  const scrollRef = useWarpEffect();
  
  // Generate random positions and initial data
  const [positions, colors, sizes, speeds] = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const speeds = new Float32Array(STAR_COUNT);
    
    const tempColor = new THREE.Color();
    
    for (let i = 0; i < STAR_COUNT; i++) {
      // Position
      positions[i * 3] = (Math.random() - 0.5) * 200;     // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200; // z
      
      // Color
      const isCyber = Math.random() > 0.5;
      tempColor.copy(isCyber ? CYBER_COLOR : COMFORT_COLOR);
      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
      
      // Size
      sizes[i] = Math.random() * 0.5 + 0.1;
      
      // Speed factor
      speeds[i] = Math.random() * 0.2 + 0.05;
    }
    
    return [positions, colors, sizes, speeds];
  }, []);

  // Dummy object for matrix updates
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Calculate warp speed based on scroll
    // Base speed + scroll factor (WarpEffect logic)
    const warpFactor = 1 + (scrollRef.current * 0.005);
    
    // Parallax effect from mouse (Reactive Camera logic)
    const mouseX = (state.mouse.x * viewport.width) / 50;
    const mouseY = (state.mouse.y * viewport.height) / 50;

    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      
      // Move star towards camera (Z axis)
      let z = positions[i3 + 2];
      z += speeds[i] * 10 * delta * warpFactor;
      
      // Reset if too close
      if (z > 50) {
        z = -150;
        // Randomize X/Y again on reset to prevent tunneling patterns
        positions[i3] = (Math.random() - 0.5) * 200;
        positions[i3 + 1] = (Math.random() - 0.5) * 200;
      }
      positions[i3 + 2] = z;

      // Apply parallax
      dummy.position.set(
        positions[i3] + mouseX * z * 0.05, 
        positions[i3 + 1] + mouseY * z * 0.05,
        z
      );
      
      dummy.scale.setScalar(sizes[i]);
      dummy.updateMatrix();
      
      meshRef.current.setMatrixAt(i, dummy.matrix);
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
        opacity={0.8}
      />
    </instancedMesh>
  );
}

export default function SpaceScene() {
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10">
      <Canvas
        camera={{ position: [0, 0, 20], fov: 60 }}
        gl={{ antialias: false, alpha: true }}
        dpr={[1, 2]} // Optimization for high DPI screens
      >
        <color attach="background" args={['#050505']} />
        <StarField />
        <EffectComposer>
          <Bloom intensity={1.5} luminanceThreshold={0.2} mipmapBlur />
          <Noise opacity={0.02} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
