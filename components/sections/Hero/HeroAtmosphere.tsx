'use client';

import { ScreenQuad } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
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
 */
export default function HeroAtmosphere() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const pointerTarget = useRef(new THREE.Vector2(0, 0));
  const pointerSmoothed = useRef(new THREE.Vector2(0, 0));
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2(0, 0) },
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

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;

    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uResolution.value.set(size.width, size.height);
    material.uniforms.uQuality.value = size.width >= 900 ? 1 : 0;

    // Pointer in -1..1, then a critically-damped follow so the parallax lags the
    // cursor by a beat instead of snapping to it.
    pointerTarget.current.set(state.pointer.x, state.pointer.y);
    pointerSmoothed.current.lerp(pointerTarget.current, Math.min(delta * 1.6, 1));
    material.uniforms.uPointer.value.copy(pointerSmoothed.current);

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
