'use client';

import { ScreenQuad } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { NOW, TIMELINE_START, roles } from '@/app/data/portfolio/experience';
import { PALETTE } from '@/lib/palette';

import { descentFragmentShader, descentVertexShader } from './descent.glsl';

/** The shader declares `vec4 uSpans[8]`; the array length is part of that contract. */
const MAX_SPANS = 8;

/**
 * Fraction of a viewport of scroll that carries the camera from the surface to
 * the floor. The band is 160vh around a sticky 100vh stage, so 60vh is exactly
 * the travel the sticky element has, and `uDescent` is normalised against it —
 * shrinking the band (v2 §5 R-1 allows 130vh) changes the tax, never the
 * composition.
 */
const TRAVEL_FRACTION = 0.6;

/** Below this width the third depth layer is dropped (v2 §3.2 `uQuality`). */
const PHONE_MAX_WIDTH = 640;

/**
 * The eight role spans, normalised onto the chart's own axis.
 *
 * `(startNorm, endNorm, depth, sourced)` where 0 is `TIMELINE_START` and 1 is
 * `NOW` — the same two constants `Experience.tsx` measures the bars against,
 * imported from the same module rather than restated here, so the descent and
 * the Gantt cannot drift apart the day the CV is updated. `depth` is the role's
 * own distance from the surface (0 = the current engagement, 1 = the oldest),
 * which is what lets the shader brighten the layers on the way up without a
 * second copy of a date reaching the GPU.
 */
function spanUniforms(): THREE.Vector4[] {
  const axis = NOW - TIMELINE_START;
  const oldest = roles.reduce((lowest, role) => Math.min(lowest, role.span.start), NOW);
  const spread = Math.max(NOW - oldest, Number.EPSILON);

  return Array.from({ length: MAX_SPANS }, (_, index) => {
    const role = roles[index];
    if (!role) return new THREE.Vector4(0, 0, 0, 0);

    // 0 at NOW, 1 at TIMELINE_START: the reader falls from the surface down.
    const startNorm = (NOW - (role.span.end ?? NOW)) / axis;
    const endNorm = (NOW - role.span.start) / axis;
    const depth = (NOW - role.span.start) / spread;
    return new THREE.Vector4(startNorm, endNorm, depth, role.sourced ? 1 : 0);
  });
}

export interface CareerDescentProps {
  /**
   * Row index under the pointer in the chart above, or -1. Lerped here on the
   * CPU rather than in the shader, so the answer arrives as a swell and not a
   * switch — the discipline `CareerStrata` already keeps.
   */
  hover: number;
}

/**
 * career-descent — the seventh scene, and the one a recruiter repeats.
 *
 * "There is a bit where you scroll and you are falling down sixteen years of
 * his career like a core sample — each job is a layer, and the layers get
 * brighter as you come up to now."
 * (`docs/architecture/SIGNATURE-SCENES-v2.md` §2.2.)
 *
 * The camera is the reader's own scroll. This component reads the band's rect
 * once per frame — one layout read of one element, the same cost `CareerStrata`
 * already pays — and turns it into `uDescent`. It is not a seventh section: the
 * six-id information architecture in `CLAUDE.md` is unchanged, and this is a
 * band inside `#experience`, after the chart and after the accordion, so the CV
 * is read before the reader is asked to look at anything.
 *
 * One `ScreenQuad`, one fragment program, zero geometry, zero textures, zero
 * instances — the pattern every shipped scene on this site keeps. See
 * `descent.glsl.ts` for what the fragment program argues and what it refuses.
 */
export default function CareerDescent({ hover }: CareerDescentProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const bandRef = useRef<HTMLElement | null>(null);
  const hoverSmoothed = useRef(-1);
  const { size } = useThree();

  const uniforms = useMemo(() => {
    // A reader who has asked for reduced motion never reaches this component —
    // `Scene` mounts nothing at all in that case — but if the gate ever moves,
    // the field must arrive composed rather than at the surface with no travel.
    const still =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const phone = typeof window !== 'undefined' && window.innerWidth <= PHONE_MAX_WIDTH;

    return {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      // 0.62 is the composed frame the poster is rendered at (v2 §3.4), so a
      // scene that somehow never receives a scroll still shows the picture the
      // reduced-motion path shows.
      uDescent: { value: still ? 0.62 : 0 },
      uSpans: { value: spanUniforms() },
      uSpanCount: { value: Math.min(roles.length, MAX_SPANS) },
      uHover: { value: -1 },
      uQuality: { value: phone ? 0 : 1 },
      uIntensity: { value: 0 },
      uInk: { value: new THREE.Color(PALETTE.ink900) },
      uLight: { value: new THREE.Color(PALETTE.white) },
    };
  }, []);

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;

    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uResolution.value.set(size.width, size.height);

    hoverSmoothed.current += (hover - hoverSmoothed.current) * Math.min(delta * 1.4, 1);
    material.uniforms.uHover.value = hoverSmoothed.current;

    // The camera. The stage is sticky inside a taller band, so the band's own
    // top edge is the reader's position in the fall: 0 while the band's top is
    // still on screen, 1 once the sticky stage has used all of its travel.
    if (!bandRef.current) {
      bandRef.current = state.gl.domElement.closest<HTMLElement>('[data-descent-band]');
    }
    const band = bandRef.current;
    if (band) {
      const viewport = window.innerHeight || 1;
      const travelled = -band.getBoundingClientRect().top;
      const progress = travelled / (viewport * TRAVEL_FRACTION);
      material.uniforms.uDescent.value = Math.min(Math.max(progress, 0), 1);
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
            vertexShader: descentVertexShader,
            fragmentShader: descentFragmentShader,
            transparent: true,
            depthTest: false,
            depthWrite: false,
          },
        ]}
      />
    </ScreenQuad>
  );
}
