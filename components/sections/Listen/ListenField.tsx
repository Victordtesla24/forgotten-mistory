'use client';

import { ScreenQuad } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { PALETTE } from '@/lib/palette';
import { listenFieldFragmentShader, listenFieldVertexShader } from './listen.glsl';

/**
 * The bench light under the instrument. See `listen.glsl.ts` for why the
 * section's one beat stays the section's only beat.
 *
 * `uClose` is not a clock: it is the jaws' own progress over the same window
 * `Listen.module.css` gives `caliperCloseLeft`, started by the same `closed`
 * flag the CSS animation is started by. If the beat has already been held —
 * a reader arriving back at the section — the field holds with it.
 */

/**
 * The jaws' window, in seconds: `--motion-cine-long` (app/globals.css), the
 * duration `Listen.module.css` gives `caliperCloseLeft` / `caliperCloseRight`.
 * The field and the jaws must run out together; if that token moves, this
 * moves with it.
 */
const CLOSE_SECONDS = 1.16;

/** Seconds for the field to arrive, and to leave — the same ramp `AboutField` uses. */
const RAMP_IN = 0.72;
const RAMP_OUT = 0.36;

/** Where the instrument lies within the section, written by `Listen`'s own measurement. */
export interface BeatState {
  /** The caliper's centre as a fraction of the section's height, 0 → 1. */
  band: number;
}

interface ListenFieldProps {
  /** True once the section has arrived and the jaws have been told to close. */
  closed: boolean;
  /** Live layout measurement, updated without a render. */
  beat: { current: BeatState };
}

/**
 * The jaws' easing, `cubic-bezier(0.16, 1, 0.3, 1)`, close enough for light:
 * almost all of the travel in the first third, then a long settle. Sampling the
 * curve properly would cost a solver for a difference no eye can find on a
 * band this soft.
 */
function emphasized(t: number): number {
  const clamped = Math.min(Math.max(t, 0), 1);
  return 1 - Math.pow(1 - clamped, 3);
}

export default function ListenField({ closed, beat }: ListenFieldProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  /** Seconds since the jaws were told to close. */
  const elapsed = useRef(0);
  const contextLost = useRef(false);
  const { gl, size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uClose: { value: 0 },
      uBand: { value: 0.5 },
      uIntensity: { value: 0 },
      uInk: { value: new THREE.Color(PALETTE.ink900) },
      uLight: { value: new THREE.Color(PALETTE.white) },
    }),
    [],
  );

  // A lost context is not a crash and must not be drawn through: the browser
  // keeps presenting the last frame, which would leave the bench light frozen
  // under an instrument that has moved. Ramp the field out instead, and back in
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
    u.uBand.value = beat.current.band;

    // The scene can mount after the beat has already run — the section is the
    // last on the page and `Scene` waits for an idle callback — so a field that
    // started its own ramp on mount would close a second time under a caliper
    // that is already shut. Advance only while the jaws are advancing, and if
    // the mount is late, arrive already closed.
    if (closed) elapsed.current = Math.min(elapsed.current + delta, CLOSE_SECONDS);
    u.uClose.value = closed ? emphasized(elapsed.current / CLOSE_SECONDS) : 0;

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
            vertexShader: listenFieldVertexShader,
            fragmentShader: listenFieldFragmentShader,
            transparent: true,
            depthTest: false,
            depthWrite: false,
          },
        ]}
      />
    </ScreenQuad>
  );
}
