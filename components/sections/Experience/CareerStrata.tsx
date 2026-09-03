'use client';

import { ScreenQuad } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { PALETTE } from '@/lib/palette';
import { strataFragmentShader, strataVertexShader } from './strata.glsl';

/**
 * The field behind the experience chart. See `strata.glsl.ts` for why this
 * draws texture rather than the roles themselves — the DOM chart is the data,
 * and a second, subtly misaligned copy of it in 3D was actively misleading.
 *
 * One full-screen quad, one fragment program, no geometry and no textures.
 */
export default function CareerStrata() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const pointerSmoothed = useRef(new THREE.Vector2(0, 0));
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uIntensity: { value: 0 },
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

    pointerSmoothed.current.lerp(state.pointer, Math.min(delta * 1.4, 1));
    material.uniforms.uPointer.value.copy(pointerSmoothed.current);

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
