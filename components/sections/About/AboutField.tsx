'use client';

import { ScreenQuad } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { PALETTE } from '@/lib/palette';
import { aboutContent } from '@/app/data/portfolio/about';
import { aboutFieldFragmentShader, aboutFieldVertexShader } from './field.glsl';

/**
 * The field the compass turns over. See `field.glsl.ts` for why it draws the
 * rose's own ten sectors rather than a second instrument beside them.
 *
 * One full-screen quad, one fragment program, no geometry and no textures.
 * Everything that moves is driven from `active` — the index cycle 12's
 * scroll-drive already computes in `About.tsx` and hands to `Compass` — so the
 * field and the engraving above it can never disagree about which dimension is
 * being read.
 */

const SECTORS = 10;

/**
 * The two facts the field draws besides "which one is being read", packed one
 * bit per dimension so the fragment program reads a sector's state without
 * indexing a uniform array (unreliable in a WebGL1 fragment shader). These come
 * straight from `about.ts`, the same source the SVG rose and the list read, so
 * the light can never disagree with the chrome about which sectors are answered
 * or which carry a source.
 *
 * `uAnsweredMask`: the seven the engine computes from the candidate and that are
 * answered on the page (`side === 'candidate'`); the three role-side sectors the
 * rose draws open are clear. `uSourcedMask`: the sectors whose answer names a
 * record a reader can open — the ones the DOM marks with the site's one accent.
 * The field lifts their light; the accent itself never leaves the SVG chrome.
 */
const ANSWERED_MASK = aboutContent.dimensions.reduce(
  (mask, dimension, index) => (dimension.side === 'candidate' ? mask | (1 << index) : mask),
  0,
);
const SOURCED_MASK = aboutContent.dimensions.reduce(
  (mask, dimension, index) => (dimension.sourced ? mask | (1 << index) : mask),
  0,
);

/** The angle, in radians, that carries dimension `index` to twelve o'clock. */
function indexAngle(index: number): number {
  return index < 0 ? 0 : (-index * 2 * Math.PI) / SECTORS;
}

/**
 * Seconds for the field to arrive, and to leave. In is the long cinematic
 * band the rest of the section uses; out is half that, because a context that
 * has gone away should not be watched fading for the same length of time.
 */
const RAMP_IN = 0.72;
const RAMP_OUT = 0.36;

interface AboutFieldProps {
  /** The dimension being read, 0..9, or -1. The same index the rose turns to. */
  active: number;
}

export default function AboutField({ active }: AboutFieldProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  /** The angle actually being drawn, eased toward the index's angle. */
  const rotation = useRef(0);
  const contextLost = useRef(false);
  const { gl, size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uRotation: { value: 0 },
      uActive: { value: -1 },
      uIntensity: { value: 0 },
      uInk: { value: new THREE.Color(PALETTE.ink900) },
      uLight: { value: new THREE.Color(PALETTE.white) },
      // Section data, one bit per dimension. Constant for the section's life —
      // the ten dimensions do not change — so these are set once and never
      // touched in the frame loop.
      uAnsweredMask: { value: ANSWERED_MASK },
      uSourcedMask: { value: SOURCED_MASK },
    }),
    [],
  );

  // A lost context is not a crash and must not be drawn through: the browser
  // keeps presenting the last frame, which would leave a bright ring frozen
  // under an instrument that is still turning. Ramp the field out instead, and
  // back in if the context is restored.
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

    // Eased toward the rose's angle rather than snapped to it, at a rate that
    // settles over about the same 720 ms the SVG's own transition takes.
    const target = indexAngle(active);
    rotation.current += (target - rotation.current) * Math.min(delta * 4.2, 1);
    u.uRotation.value = rotation.current;
    u.uActive.value = active;

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
            vertexShader: aboutFieldVertexShader,
            fragmentShader: aboutFieldFragmentShader,
            transparent: true,
            depthTest: false,
            depthWrite: false,
          },
        ]}
      />
    </ScreenQuad>
  );
}
