'use client';

import { ScreenQuad } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
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

/**
 * The ceilings the field holds itself to where the section's type is.
 *
 * The plane is the width of both columns, so unlike every earlier version of
 * this scene it is drawn *under text*, and the light has to be bounded there
 * rather than merely aimed away. Two boxes are measured every frame and handed
 * to the shader, and inside each the light is compressed toward a ceiling —
 * smoothly, so no plateau shows where the compression starts.
 *
 * The numbers are the grounds the two type colours in this section carry at
 * 4.5:1, from `app/globals.css`: `--mist-400` (`.evidence`, the caption grey in
 * the reading column) holds to about rgb(42 42 42), which is 0.136 of the light
 * over `--ink-900`; `--mist-200` (the instrument's caption and key, which sit
 * inside the field's brightest region) holds to rgb(87 87 87), which is 0.326.
 * Both ceilings are set below their limit, not at it.
 */
const READING_CEILING = 0.1;
const INSTRUMENT_CEILING = 0.24;

/**
 * How far past the plane's own edge the fan's origin is allowed to travel.
 * Far enough that the light still arrives from the right direction, near
 * enough that the section is never left with only its haze.
 */
const CENTRE_OVERSHOOT = 0.18;

/** Holds a UV coordinate to the plane, plus that overshoot on either side. */
function clamp(uv: number): number {
  return Math.min(Math.max(uv, -CENTRE_OVERSHOOT), 1 + CENTRE_OVERSHOOT);
}

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
  /** The plane itself — one screen of the body, sticky, travelling. */
  hostRef: RefObject<HTMLDivElement | null>;
  /** The engraving's box. Sticky inside the plane, so it moves as they read. */
  stageRef: RefObject<HTMLDivElement | null>;
  /** The instrument's caption. Everything below it in the column is type. */
  captionRef: RefObject<HTMLParagraphElement | null>;
  /** The ten. Its top-left corner is where the reading column's ceiling starts. */
  listRef: RefObject<HTMLOListElement | null>;
}

export default function AboutField({
  active,
  hostRef,
  stageRef,
  captionRef,
  listRef,
}: AboutFieldProps) {
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
      // The three measurements, in the plane's own UV (origin bottom-left).
      // None of them is a constant: the instrument is sticky, the plane travels
      // with the reader, and the reading column is a different box on a phone
      // than beside the list. They are read from the DOM in the frame loop.
      uCentre: { value: new THREE.Vector2(0.5, 0.5) },
      uRoseRadius: { value: 0.4 },
      // x: where the reading column starts. y: where it starts, downward. The
      // pair describes one corner, and the shader treats the quadrant past it
      // as type. z: where the instrument's own caption starts, downward.
      uGuard: { value: new THREE.Vector3(1, 0, 0) },
      uReadingCeiling: { value: READING_CEILING },
      uInstrumentCeiling: { value: INSTRUMENT_CEILING },
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

    // Where the instrument, its caption and the ten actually are, this frame.
    //
    // The plane is one screen tall and sticky; the instrument is sticky inside
    // it; the reading column is beside the instrument at 1440 and below it at
    // 390. Nothing in that is a constant the shader could be given once, and
    // guessing at it is how the previous two attempts at this scene ended up
    // drawing light that had no relationship to the section it was under. Four
    // rect reads, no writes between them, so the layout is measured once and
    // the browser answers the rest from the same flush.
    const host = hostRef.current;
    const stage = stageRef.current;
    if (host && stage) {
      const hostRect = host.getBoundingClientRect();
      if (hostRect.width > 0 && hostRect.height > 0) {
        const stageRect = stage.getBoundingClientRect();
        // Held to the plane's own edge, and a little past it. The instrument is
        // the fan's origin, but the field is the section's and not the
        // instrument's: at 390 the ten run for several screens and the compass
        // is a header ornament the reader leaves behind, and an origin that
        // followed it off the plane took the section's light with it — measured
        // 7.6% coverage where the same scene holds 16% at 1440 (c24 probe). The
        // origin rides the edge instead, so the spokes keep arriving from where
        // the instrument was.
        u.uCentre.value.set(
          clamp((stageRect.left + stageRect.width / 2 - hostRect.left) / hostRect.width),
          // UV runs from the bottom, the page runs from the top.
          clamp(1 - (stageRect.top + stageRect.height / 2 - hostRect.top) / hostRect.height),
        );
        // In the squared frame the shader measures in, where 1.0 is half the
        // plane's height: a length of L device-independent pixels is
        // L / (height / 2).
        u.uRoseRadius.value = Math.max(stageRect.width / hostRect.height, 0.001);

        const listRect = listRef.current?.getBoundingClientRect() ?? null;
        const captionRect = captionRef.current?.getBoundingClientRect() ?? null;
        const guard = u.uGuard.value;
        guard.x = listRect ? (listRect.left - hostRect.left) / hostRect.width : 1;
        guard.y = listRect ? 1 - (listRect.top - hostRect.top) / hostRect.height : 0;
        guard.z = captionRect ? 1 - (captionRect.top - hostRect.top) / hostRect.height : 0;
      }
    }

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
