'use client';

import { ScreenQuad } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';

import { PALETTE } from '@/lib/palette';
import { deterministicIdleViseme, lerpVisemeShapes, type VisemeShape } from '@/lib/visemeMap';
import { visemeStageFragmentShader, visemeStageVertexShader } from './viseme.glsl';

/**
 * S7 — the stage the avatar answers from (SIGNATURE-SCENES-v1 §4.7, D8).
 *
 * This component *reads* the lip-sync; it does not own any part of it.
 * `components/MiniVicBot.tsx` computes the viseme stream exactly as it always
 * has — an `AnalyserNode` into `heuristicVisemeFromFrequency`, smoothed through
 * `lerpVisemeShapes` — and draws it on a 2D canvas. The three refs that carry
 * that state are handed here unchanged, and every frame this shader resolves
 * them with the *same* `lerpVisemeShapes` call the mouth resolves them with.
 *
 * The consequence is the one D8 asked for: there is exactly one lip-sync
 * implementation on this page, the 2D one, and it is the one a reader with no
 * WebGL or with reduced motion sees in full. This stage can be deleted in one
 * commit and nothing about what MiniVic says or how his mouth moves changes.
 */

export interface VisemeStageProps {
  /** The mouth's current shape — `MiniVicBot`'s `currentVisemeRef`. */
  currentViseme: MutableRefObject<VisemeShape>;
  /** The shape it is lerping toward — `MiniVicBot`'s `targetVisemeRef`. */
  targetViseme: MutableRefObject<VisemeShape>;
  /** Progress between the two, 0 → 1 — `MiniVicBot`'s `visemeLerpRef`. */
  visemeLerp: MutableRefObject<number>;
  /** True while audio is actually playing. */
  speaking: boolean;
}

/** Seconds for the stage to arrive, and to leave — the ramp every field uses. */
const RAMP_IN = 0.72;
const RAMP_OUT = 0.36;

/** How fast the light follows the mouth: full travel in about 90 ms. */
const FOLLOW_PER_SECOND = 11;

/** Frame-rate-independent approach toward a target. */
function follow(value: number, target: number, delta: number): number {
  const t = 1 - Math.exp(-FOLLOW_PER_SECOND * Math.max(delta, 0));
  return value + (target - value) * t;
}

export default function VisemeStage({
  currentViseme,
  targetViseme,
  visemeLerp,
  speaking,
}: VisemeStageProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const contextLost = useRef(false);
  const { gl, size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uOpen: { value: 0 },
      uWide: { value: 1 },
      uRound: { value: 0 },
      uSpeak: { value: 0 },
      uIntensity: { value: 0 },
      uInk: { value: new THREE.Color(PALETTE.ink900) },
      uLight: { value: new THREE.Color(PALETTE.white) },
    }),
    [],
  );

  // A lost context is not a crash and must not be drawn through: the browser
  // keeps presenting the last frame, which would leave the stage frozen open on
  // a phoneme that finished a minute ago. Ramp the light out instead, and back
  // in if the context is restored.
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

    // While he is speaking, the shape is the mouth's own shape, resolved the
    // way the mouth resolves it. While he is not, it is `deterministicIdleViseme`
    // — the same pure function of elapsed time `MiniVicBot` already breathes the
    // 2D mouth on when there is no waveform to analyse (`startSyntheticMouth`),
    // never `Math.random()` and never a fabricated phoneme (NN-3). A stage that
    // held perfectly still between answers would read as switched off.
    const shape: VisemeShape = speaking
      ? lerpVisemeShapes(
          currentViseme.current,
          targetViseme.current,
          Math.min(Math.max(visemeLerp.current, 0), 1),
        )
      : deterministicIdleViseme(state.clock.elapsedTime);

    u.uOpen.value = follow(u.uOpen.value as number, shape.jawDrop, delta);
    u.uWide.value = follow(u.uWide.value as number, shape.lipWidth, delta);
    u.uRound.value = follow(u.uRound.value as number, shape.lipRound, delta);
    u.uSpeak.value = follow(u.uSpeak.value as number, speaking ? 1 : 0, delta);

    const intensity = u.uIntensity;
    intensity.value = contextLost.current
      ? Math.max((intensity.value as number) - delta / RAMP_OUT, 0)
      : Math.min((intensity.value as number) + delta / RAMP_IN, 1);
  });

  return (
    <ScreenQuad>
      <shaderMaterial
        ref={materialRef}
        args={[
          {
            uniforms,
            vertexShader: visemeStageVertexShader,
            fragmentShader: visemeStageFragmentShader,
            transparent: true,
            depthTest: false,
            depthWrite: false,
          },
        ]}
      />
    </ScreenQuad>
  );
}
