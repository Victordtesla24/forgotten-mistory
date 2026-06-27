'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { materializeVertex, materializeFragment } from '@/components/fx/shaders/materializeParticles';

/**
 * DetailMaterialize — the FloatingDetailBox entrance, upgraded from the old 2-D canvas
 * to a self-contained R3F instanced particle system. Points stream along real 3D
 * trajectories (perspective camera) from the originating card to a shell around the panel
 * centre, converging as the panel forms. Additive soft sprites deliver the volumetric
 * bloom on a transparent overlay so the existing blurred scrim still shows through.
 *
 * Fully self-contained and camera-independent (no window.spaceApp): a fresh Canvas per
 * dialog instance, torn down on unmount. The convergence runs once then idles (loop
 * halts) to respect the FPS budget. Rendered only when motion is allowed.
 */

const MATERIALIZE_MS = 1200;
const PARTICLE_COUNT = 150;
const CAM_Z = 2.144; // half-height = 1 at z=0 for fov 50° → world y ∈ [-1,1] fills height

const hexToVec3 = (hex: string): THREE.Vector3 =>
  new THREE.Vector3(
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  );

const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

interface Origin {
  x: number;
  y: number;
}

function ParticleField({ origin, color }: { origin: Origin; color: string }) {
  const { invalidate } = useThree();
  const elapsed = useRef(0);
  const [running, setRunning] = useState(true);

  const dpr = typeof window !== 'undefined' ? Math.min(1.5, window.devicePixelRatio) : 1;

  const geometry = useMemo(() => {
    const W = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const H = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const aspect = W / H;
    const ndcx = (origin.x / W) * 2 - 1;
    const ndcy = -((origin.y / H) * 2 - 1);
    const sx = ndcx * aspect;
    const sy = ndcy;

    const rand = mulberry32(((Math.round(origin.x) * 73856093) ^ (Math.round(origin.y) * 19349663)) >>> 0);
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const targets = new Float32Array(PARTICLE_COUNT * 3);
    const seeds = new Float32Array(PARTICLE_COUNT);
    const sizes = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = sx + (rand() * 2 - 1) * 0.55;
      positions[i * 3 + 1] = sy + (rand() * 2 - 1) * 0.55;
      positions[i * 3 + 2] = (rand() * 2 - 1) * 0.4;

      const a1 = rand() * Math.PI * 2;
      const rr = 0.12 + rand() * 0.52;
      targets[i * 3] = Math.cos(a1) * rr * aspect * 0.55;
      targets[i * 3 + 1] = Math.sin(a1) * rr * 0.55;
      targets[i * 3 + 2] = (rand() * 2 - 1) * 0.7;

      seeds[i] = rand();
      sizes[i] = 5 + rand() * 12;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aTarget', new THREE.BufferAttribute(targets, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [origin]);

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uColor: { value: hexToVec3(color) },
      uPixelRatio: { value: dpr },
    }),
    [color, dpr],
  );

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  useFrame((_, delta) => {
    if (!running) return;
    elapsed.current += delta;
    const p = Math.min(1, elapsed.current / (MATERIALIZE_MS / 1000));
    uniforms.uProgress.value = p;
    uniforms.uTime.value += Math.min(delta, 0.05);
    if (p >= 1) {
      setRunning(false); // converged → idle, halt the loop
      return;
    }
    invalidate();
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        vertexShader={materializeVertex}
        fragmentShader={materializeFragment}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms as unknown as Record<string, THREE.IUniform>}
      />
    </points>
  );
}

export default React.memo(function DetailMaterialize({ origin, color }: { origin: Origin; color: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={wrapRef} className="detail-materialize" data-detail-canvas="" data-detail-fx="r3f" aria-hidden="true">
      <Canvas
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance', stencil: false, depth: false }}
        dpr={Math.min(1.5, typeof window !== 'undefined' ? window.devicePixelRatio : 1)}
        frameloop="demand"
        camera={{ position: [0, 0, CAM_Z], fov: 50, near: 0.1, far: 20 }}
        style={{ display: 'block', width: '100%', height: '100%' }}
        onCreated={({ invalidate }) => {
          wrapRef.current?.setAttribute('data-gl', 'webgl');
          invalidate();
        }}
      >
        <ParticleField origin={origin} color={color} />
      </Canvas>
    </div>
  );
}
