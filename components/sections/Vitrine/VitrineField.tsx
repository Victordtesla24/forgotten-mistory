'use client';

import { ScreenQuad } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { PALETTE } from '@/lib/palette';
import { vitrineFieldFragmentShader, vitrineFieldVertexShader } from './vitrine.glsl';

/**
 * The field the cabinet stands in. See `vitrine.glsl.ts` for why it draws the
 * light around the rail rather than a seventh plate inside it.
 *
 * Everything that moves comes from the rail: `lit` is the plate index the
 * section already computes for its raking light, and `rail` is the same rAF
 * measurement carried as a ref rather than as state — the rail's scroll is
 * continuous and React must not re-render six plates on every frame of it. The
 * shader reads the ref in `useFrame`, which is the only place a per-frame value
 * belongs.
 */

/** Seconds for the field to arrive, and to leave — the same ramp `AboutField` uses. */
const RAMP_IN = 0.72;
const RAMP_OUT = 0.36;

/** The continuous half of the rail's state, written by `Vitrine`'s scroll loop. */
export interface RailState {
  /** The lit plate's centre across the field, 0 → 1. */
  centre: number;
  /** `scrollLeft / scrollWidth`, 0 → 1. */
  scroll: number;
}

interface VitrineFieldProps {
  /** The plate the rail has snapped to, 0 → 5. The same index the plates read. */
  lit: number;
  /** Live rail measurements, updated without a render. */
  rail: { current: RailState };
}

export default function VitrineField({ lit, rail }: VitrineFieldProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  /** The centre actually being drawn, eased toward the rail's own. */
  const centre = useRef(0.5);
  const contextLost = useRef(false);
  const { gl, size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uLit: { value: 0 },
      uCentre: { value: 0.5 },
      uScroll: { value: 0 },
      uIntensity: { value: 0 },
      uInk: { value: new THREE.Color(PALETTE.ink900) },
      uLight: { value: new THREE.Color(PALETTE.white) },
    }),
    [],
  );

  // A lost context is not a crash and must not be drawn through: the browser
  // keeps presenting the last frame, which would leave a pool of light frozen
  // under a rail that is still moving. Ramp the field out instead, and back in
  // if the context is restored.
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

    // Eased rather than snapped, at a rate that settles over about the same
    // half-second the rail's own snap takes: the light travels to the plate
    // that has just taken it instead of cutting to it.
    const target = rail.current.centre;
    centre.current += (target - centre.current) * Math.min(delta * 5.4, 1);
    u.uCentre.value = centre.current;
    u.uScroll.value = rail.current.scroll;
    u.uLit.value = lit;

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
            vertexShader: vitrineFieldVertexShader,
            fragmentShader: vitrineFieldFragmentShader,
            transparent: true,
            depthTest: false,
            depthWrite: false,
          },
        ]}
      />
    </ScreenQuad>
  );
}
