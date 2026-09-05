'use client';

import { ScreenQuad } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { PALETTE } from '@/lib/palette';
import { strataFragmentShader, strataVertexShader } from './strata.glsl';

/** The shader declares `vec4 uSpans[8]`; the array length is part of that contract. */
const MAX_SPANS = 8;

/** Seconds the sediment takes to travel the chart — the bars' own 60 ms × 8 + 900 ms. */
const PROGRESS_SECONDS = 1.38;

export interface CareerStrataProps {
  /**
   * The eight bars in this canvas's 0..1 space: `[left, width, rowCentreY]`,
   * measured from the DOM chart in `Experience.tsx`. Empty until the chart has
   * been laid out; the shader treats a zero width as an absent row.
   */
  spans: readonly (readonly [number, number, number])[];
  /** Row index under the pointer, or -1. Lerped here, not in the shader. */
  hover: number;
  /** True once the section has committed to its entry beat. */
  entered: boolean;
}

/**
 * The field behind the experience chart.
 *
 * It draws no bars — the DOM chart is the data, and a second, subtly misaligned
 * copy of it in 3D was actively misleading. What it does draw is the ground the
 * chart is measured on, lit under each span as that span arrives, so the
 * section's signature scene argues the section's own thesis instead of sitting
 * behind it as texture (council R-c8, MOT-F-1). See `strata.glsl.ts`.
 *
 * One full-screen quad, one fragment program, no geometry and no textures.
 */
export default function CareerStrata({ spans, hover, entered }: CareerStrataProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const pointerSmoothed = useRef(new THREE.Vector2(0, 0));
  const hoverSmoothed = useRef(-1);
  const { size } = useThree();

  const uniforms = useMemo(() => {
    // A reader who has asked for reduced motion never reaches this component —
    // `Scene` mounts nothing at all in that case — but if the query ever stops
    // gating the mount, the field must arrive finished rather than sweep.
    const still =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uIntensity: { value: 0 },
      uInk: { value: new THREE.Color(PALETTE.ink900) },
      uLight: { value: new THREE.Color(PALETTE.white) },
      uSpans: {
        value: Array.from({ length: MAX_SPANS }, () => new THREE.Vector4(0, 0, 0, 0)),
      },
      uProgress: { value: still ? 1 : 0 },
      uHover: { value: -1 },
    };
  }, []);

  // The chart's geometry, copied in whenever it is re-measured (mount, resize,
  // font swap). Writing into the existing Vector4s keeps the uniform array
  // identity stable, which is what three.js uploads against.
  useEffect(() => {
    const value = uniforms.uSpans.value as THREE.Vector4[];
    for (let i = 0; i < MAX_SPANS; i += 1) {
      const span = spans[i];
      if (span) value[i].set(span[0], span[1], span[2], 0);
      else value[i].set(0, 0, 0, 0);
    }
  }, [spans, uniforms]);

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;

    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uResolution.value.set(size.width, size.height);

    pointerSmoothed.current.lerp(state.pointer, Math.min(delta * 1.4, 1));
    material.uniforms.uPointer.value.copy(pointerSmoothed.current);

    // The pointed-at row, eased at the same rate as the parallax so the two
    // responses to a moving pointer feel like one response.
    hoverSmoothed.current +=
      (hover - hoverSmoothed.current) * Math.min(delta * 1.4, 1);
    material.uniforms.uHover.value = hoverSmoothed.current;

    if (entered) {
      const progress = material.uniforms.uProgress;
      progress.value = Math.min(progress.value + delta / PROGRESS_SECONDS, 1);
    }

    const intensity = material.uniforms.uIntensity;
    intensity.value = Math.min(intensity.value + delta * 0.5, 1);
  });

  return (
    <ScreenQuad>
      <shaderMaterial
        ref={materialRef}
        args={[
          {
            uniforms,
            vertexShader: strataVertexShader,
            fragmentShader: strataFragmentShader,
            transparent: true,
            depthTest: false,
            depthWrite: false,
          },
        ]}
      />
    </ScreenQuad>
  );
}
