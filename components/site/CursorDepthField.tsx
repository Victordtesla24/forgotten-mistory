'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import { cursorDepthVertex, cursorDepthFragment } from '@/components/fx/shaders/cursorDepth';
import { PALETTE } from '@/lib/palette';

/**
 * CursorDepthField — volumetric midground layer between the starfield and content.
 *
 * Renders a single full-screen quad with a custom GLSL ShaderMaterial that creates:
 *   1. Volumetric god-rays radiating from the cursor position
 *   2. Floating depth particles across 3 parallax layers
 *   3. Ambient vignette halo for cohesion
 *
 * Hyperframe-optimised:
 *   - Single draw call (one plane, one material)
 *   - uniforms mutated via refs (no per-frame React state)
 *   - Throttled to ~30 Hz via useFrame delta gate
 *   - Capped DPR for mobile performance
 *   - Automatically disabled under reduced-motion
 *
 * Palette discipline: uColor sourced from lib/palette.ts PASSTHROUGH only.
 */

interface DepthUniforms {
  uTime: { value: number };
  uColor: { value: THREE.Vector3 };
  uOpacity: { value: number };
  uCursor: { value: THREE.Vector2 };
  uResolution: { value: THREE.Vector2 };
  uScroll: { value: number };
}

function DepthPlane() {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const uniformsRef = useRef<DepthUniforms | null>(null);
  const { invalidate } = useThree();
  const frameAccum = useRef(0);

  // Parse palette token → vec3 once
  const colorVec = useRef(
    new THREE.Vector3(
      parseInt(PALETTE.accent.slice(1, 3), 16) / 255,
      parseInt(PALETTE.accent.slice(3, 5), 16) / 255,
      parseInt(PALETTE.accent.slice(5, 7), 16) / 255,
    ),
  );

  const updateCursor = useCallback((e: PointerEvent) => {
    const u = uniformsRef.current;
    if (!u) return;
    u.uCursor.value.set(
      e.clientX / window.innerWidth,
      1.0 - e.clientY / window.innerHeight,
    );
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const u = uniformsRef.current;
      if (!u) return;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight || 1;
      u.uScroll.value = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    };
    const onResize = () => {
      const u = uniformsRef.current;
      if (!u) return;
      u.uResolution.value.set(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('pointermove', updateCursor, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('pointermove', updateCursor);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [updateCursor]);

  useFrame((_, delta) => {
    const mat = matRef.current;
    const u = uniformsRef.current;
    if (!mat || !u) return;

    // Hyperframe: throttle to ~30 fps — the depth field is atmospheric,
    // not precision-timed. Below 33ms we accumulate and skip.
    frameAccum.current += delta;
    if (frameAccum.current < 0.033) return;
    frameAccum.current = 0;

    u.uTime.value += Math.min(delta, 0.05);
    invalidate();
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={cursorDepthVertex}
        fragmentShader={cursorDepthFragment}
        transparent={true}
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        uniforms={
          ((uniformsRef.current = {
            uTime: { value: 0 },
            uColor: { value: colorVec.current },
            uOpacity: { value: 0.72 },
            uCursor: { value: new THREE.Vector2(0.5, 0.5) }, // centre until first move
            uResolution: {
              value: new THREE.Vector2(
                typeof window !== 'undefined' ? window.innerWidth : 1920,
                typeof window !== 'undefined' ? window.innerHeight : 1080,
              ),
            },
            uScroll: { value: 0 },
          }),
          uniformsRef.current) as unknown as Record<string, { value: unknown }>
        }
      />
    </mesh>
  );
}

/**
 * Tracks scroll position to disable the depth field once the user scrolls
 * past the hero area. Frees a WebGL context for VFX gallery components
 * deeper in the page (fixes "Canvas has an existing context of a different
 * type" errors from context exhaustion — R2 WebGL context conflict fix).
 */
function useScrollPastHero(): boolean {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const check = () => {
      // Disable once scrolled past 1.5× viewport height (~ hero + proof)
      setPast(window.scrollY > window.innerHeight * 1.5);
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, []);
  return past;
}

export default function CursorDepthField() {
  const prefersReducedMotion = useReducedMotion();
  const pastHero = useScrollPastHero();

  // No-op: reduced-motion OR scrolled past hero area
  // (frees WebGL context for VFX gallery — R2 context conflict fix)
  if (prefersReducedMotion || pastHero) return null;

  return (
    <div
      className="cursor-depth-field"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: false,
        }}
        dpr={Math.min(1.25, typeof window !== 'undefined' ? window.devicePixelRatio : 1)}
        frameloop="demand"
        style={{ display: 'block' }}
      >
        <DepthPlane />
      </Canvas>
    </div>
  );
}
