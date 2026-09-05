'use client';

import { ScreenQuad } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { PALETTE } from '@/lib/palette';
import { benchFieldFragmentShader, benchFieldVertexShader } from './bench.glsl';

/**
 * The bench's own light. See `bench.glsl.ts` for why it is a ruled plate rather
 * than an atmosphere, and why it stops before both rails.
 *
 * Everything that moves comes from the bench: `hover` is the node the reader
 * has taken and where it sits, carried as a ref rather than as state — a board
 * that re-rendered twenty wires on every pointer move would be paying for the
 * light with the diagram. The shader reads the ref in `useFrame`, which is the
 * only place a per-frame value belongs.
 */

/** Seconds for the field to arrive, and to leave — the same ramp `AboutField` uses. */
const RAMP_IN = 0.72;
const RAMP_OUT = 0.36;

/** What the reader currently has under attention, written by `Bench`'s focus handler. */
export interface HoverState {
  /** 1 while a node on either rail is taken, 0 otherwise. */
  active: number;
  /** That node's height within the bench, 0 (top) → 1 (bottom). */
  y: number;
}

interface BenchFieldProps {
  /** Live attention state, updated without a render. */
  hover: { current: HoverState };
}

export default function BenchField({ hover }: BenchFieldProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  /** The attention level actually being drawn, eased toward the bench's own. */
  const lit = useRef(0);
  const contextLost = useRef(false);
  const { gl, size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uHover: { value: 0 },
      uHoverY: { value: 0.5 },
      uIntensity: { value: 0 },
      uInk: { value: new THREE.Color(PALETTE.ink900) },
      uLight: { value: new THREE.Color(PALETTE.white) },
    }),
    [],
  );

  // A lost context is not a crash and must not be drawn through: the browser
  // keeps presenting the last frame, which would leave a rule frozen at a row
  // the reader has long since left. Ramp the field out instead, and back in if
  // the context is restored.
  useEffect(() => {
    const canvas = gl.domElement;
    const onLost = () => {
      contextLost.current = true;
    };
    const onRestored = () => {
      contextLost.current = false;
    };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    return () => {
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
    };
  }, [gl]);

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;
    const u = material.uniforms;

    u.uTime.value = state.clock.elapsedTime;
    u.uResolution.value.set(size.width, size.height);

    // Eased rather than snapped, at about the rate the wires' own 200 ms
    // stroke-opacity transition settles: the bench comes up under the strands
    // as they come forward, not before them.
    const target = hover.current.active;
    lit.current += (target - lit.current) * Math.min(delta * 6.0, 1);
    u.uHover.value = lit.current;
    // The row itself is snapped, because it only matters while `uHover` is up
    // and sliding the rule between two nodes would draw the eye to the travel
    // rather than to the row.
    u.uHoverY.value = hover.current.y;

    const intensity = u.uIntensity;
    intensity.value = contextLost.current
      ? Math.max(intensity.value - delta / RAMP_OUT, 0)
      : Math.min(intensity.value + delta / RAMP_IN, 1);
  });

  return (
    <ScreenQuad>
      <shaderMaterial
        ref={materialRef}
        args={[
          {
            uniforms,
            vertexShader: benchFieldVertexShader,
            fragmentShader: benchFieldFragmentShader,
            transparent: true,
            depthTest: false,
            depthWrite: false,
          },
        ]}
      />
    </ScreenQuad>
  );
}
