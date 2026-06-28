'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { sparklineVertex, sparklineFragment, SPARK_COUNT } from '@/components/fx/shaders/sparkline';
import { PALETTE } from '@/lib/palette';

/**
 * SparklineGL — System B "living sparkline" rendered with a hand-authored GLSL
 * ShaderMaterial (components/fx/shaders/sparkline.ts). The latency samples are
 * uploaded as the `uValues` uniform array; `uTime` animates the traveling glow,
 * the area-fill, and the pulsing scan node entirely on the GPU.
 *
 * This is an ENHANCEMENT layer drawn over the static SVG sparkline (which remains
 * the structural contract and the reduced-motion fallback). The parent only mounts
 * SparklineGL when motion is allowed, so under reduced motion just the SVG shows.
 *
 * Performance discipline (MOTION-AND-FX-SPEC §7):
 *   - single small quad, one draw call, uniforms mutated via refs (no setState in useFrame)
 *   - capped DPR, `frameloop="demand"` self-sustained only while visible
 *   - paused via IntersectionObserver when off-screen and on tab `visibilitychange`
 *   - palette-sourced uniforms only (monochrome)
 */

const hexToVec3 = (hex: string): THREE.Vector3 =>
  new THREE.Vector3(
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  );

/** Normalise raw samples to padded 0.14..0.88 so the curve never clips the box edges. */
function normalise(values: number[]): number[] {
  if (values.length === 0) return new Array(SPARK_COUNT).fill(0.5);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values.map((v) => 0.14 + ((v - min) / range) * 0.74);
}

interface SparkUniforms {
  uTime: { value: number };
  uValues: { value: number[] };
  uColor: { value: THREE.Vector3 };
  uAccent: { value: THREE.Vector3 };
  uOpacity: { value: number };
  uResolution: { value: THREE.Vector2 };
}

function SparkMesh({ values, active }: { values: number[]; active: boolean }) {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const { invalidate, size } = useThree();

  const uniforms = useMemo<SparkUniforms>(() => {
    const initial = normalise(values);
    const arr = new Array<number>(SPARK_COUNT);
    for (let i = 0; i < SPARK_COUNT; i++) arr[i] = initial[Math.min(i, initial.length - 1)] ?? 0.5;
    return {
      uTime: { value: 0 },
      uValues: { value: arr },
      uColor: { value: hexToVec3(PALETTE.white) },
      uAccent: { value: hexToVec3(PALETTE.steel) },
      uOpacity: { value: 0.95 },
      uResolution: { value: new THREE.Vector2(220, 40) },
    };
    // Built once; contents mutated in effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-upload samples whenever the panel ticks.
  useEffect(() => {
    const norm = normalise(values);
    const v = uniforms.uValues.value;
    for (let i = 0; i < SPARK_COUNT; i++) v[i] = norm[Math.min(i, norm.length - 1)] ?? 0.5;
    invalidate();
  }, [values, uniforms, invalidate]);

  // Track the real pixel size of the sparkline box for px-space glow.
  useEffect(() => {
    uniforms.uResolution.value.set(Math.max(1, size.width), Math.max(1, size.height));
    invalidate();
  }, [size, uniforms, invalidate]);

  // Kick the demand loop whenever we (re)enter the active state.
  useEffect(() => {
    if (active) invalidate();
  }, [active, invalidate]);

  useFrame((_, delta) => {
    if (!active) return; // paused off-screen / hidden tab → loop self-halts
    uniforms.uTime.value += Math.min(delta, 0.05);
    invalidate(); // self-sustain the demand loop while visible
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={sparklineVertex}
        fragmentShader={sparklineFragment}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms as unknown as Record<string, THREE.IUniform>}
      />
    </mesh>
  );
}

export default React.memo(function SparklineGL({ values }: { values: number[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setActive(true);
      return;
    }
    let onScreen = false;
    const sync = () => setActive(onScreen && !document.hidden);
    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((e) => e.isIntersecting);
        sync();
      },
      { threshold: 0.05 },
    );
    io.observe(el);
    document.addEventListener('visibilitychange', sync);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  return (
    <div ref={wrapRef} className="telemetry-spark-gl" data-spark-gl="" aria-hidden="true">
      <Canvas
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance', stencil: false, depth: false }}
        dpr={Math.min(1.5, typeof window !== 'undefined' ? window.devicePixelRatio : 1)}
        frameloop="demand"
        orthographic
        camera={{ position: [0, 0, 1], near: 0.1, far: 10 }}
        style={{ display: 'block', width: '100%', height: '100%' }}
        onCreated={() => wrapRef.current?.setAttribute('data-gl', 'webgl')}
      >
        <SparkMesh values={values} active={active} />
      </Canvas>
    </div>
  );
});
