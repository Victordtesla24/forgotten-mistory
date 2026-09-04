'use client';

import { ScreenQuad } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { PALETTE } from '@/lib/palette';
import { atmosphereFragmentShader, atmosphereVertexShader } from './atmosphere.glsl';

/**
 * The hero's only moving part. Renders inside the shared GL stage (see
 * `components/gl/GLStage.tsx`) — it never creates a context of its own.
 *
 * Cost: one full-screen quad, one fragment program, no textures, no geometry
 * uploads, no post-processing pass. The pointer is lerped on the CPU so the
 * shader never has to smooth anything itself.
 *
 * Deep-space parallax: pointer + scroll depth drive layered mist/stars at
 * different rates. Disabled under prefers-reduced-motion.
 */
export default function HeroAtmosphere() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const pointerTarget = useRef(new THREE.Vector2(0, 0));
  const pointerSmoothed = useRef(new THREE.Vector2(0, 0));
  const scrollTarget = useRef(0);
  const scrollSmoothed = useRef(0);
  const reduceMotion = useRef(false);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: new THREE.Vector2(0, 0) },
      uIntensity: { value: 0 },
      // Full strata above the width where a phone stops being a phone. Below
      // it the ridged near layer and the shafts are dropped: sixteen noise
      // lookups a pixel is the wrong budget for a backdrop on a device whose
      // whole frame is the width of one of these light shafts.
      uQuality: { value: 1 },
      // Colours come from lib/palette.ts — the single place raw hex is allowed
      // to live for WebGL, so the scene can never drift off the ink palette.
      uInk: { value: new THREE.Color(PALETTE.ink900) },
      uLight: { value: new THREE.Color(PALETTE.white) },
    }),
    [],
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      reduceMotion.current = mq.matches;
      if (mq.matches) {
        pointerTarget.current.set(0, 0);
        pointerSmoothed.current.set(0, 0);
        scrollTarget.current = 0;
        scrollSmoothed.current = 0;
      }
    };
    sync();
    mq.addEventListener('change', sync);

    const onScroll = () => {
      if (reduceMotion.current) return;
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      scrollTarget.current = Math.min(Math.max(window.scrollY / max, 0), 1);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      mq.removeEventListener('change', sync);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;

    material.uniforms.uTime.value = reduceMotion.current ? 0 : state.clock.elapsedTime;
    material.uniforms.uResolution.value.set(size.width, size.height);
    material.uniforms.uQuality.value = size.width >= 900 ? 1 : 0;

    // Pointer in -1..1, then a critically-damped follow so the parallax lags the
    // cursor by a beat instead of snapping to it.
    if (!reduceMotion.current) {
      pointerTarget.current.set(state.pointer.x, state.pointer.y);
    } else {
      pointerTarget.current.set(0, 0);
    }
    pointerSmoothed.current.lerp(pointerTarget.current, Math.min(delta * 1.6, 1));
    material.uniforms.uPointer.value.copy(pointerSmoothed.current);

    scrollSmoothed.current += (scrollTarget.current - scrollSmoothed.current) * Math.min(delta * 1.4, 1);
    material.uniforms.uScroll.value.set(scrollSmoothed.current, 0);

    // Entrance: the atmosphere fades up over roughly a second and a half once
    // the scene mounts, so it arrives behind the type rather than with it.
    const intensity = material.uniforms.uIntensity;
    intensity.value = Math.min(intensity.value + delta * 0.65, 1);
  });

  return (
    <ScreenQuad>
      <shaderMaterial
        ref={materialRef}
        args={[
          {
            uniforms,
            vertexShader: atmosphereVertexShader,
            fragmentShader: atmosphereFragmentShader,
            transparent: true,
            depthTest: false,
            depthWrite: false,
          },
        ]}
      />
    </ScreenQuad>
  );
}
