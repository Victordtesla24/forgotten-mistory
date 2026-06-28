'use client';

import React, { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  motesVertex,
  motesFragment,
  glowVertex,
  glowFragment,
} from '@/components/fx/shaders/panelDepth';
import { PALETTE } from '@/lib/palette';

/**
 * PanelDepthScene — System A "real 3D" depth surround behind the telemetry panel.
 *
 * A perspective camera looks at three Z-layers of instanced point motes. A pointer-
 * tilted parent group makes the near layer parallax more than the far one (genuine
 * depth, not a flat CSS tilt), and a billboard light cone tracks the pointer in panel
 * space. The DOM telemetry content sits on top and stays crisp.
 *
 * The backdrop is transparent so the panel's content shows through, so the "bloom"
 * is delivered with additive emissive glow (motes + cone) rather than a full-frame
 * post-process Bloom — full-frame Bloom needs an opaque target and would black out the
 * panel. True post-process Bloom is used in the opaque DetailMaterialize scene instead.
 *
 * Perf: ≤90 points, one draw per material, demand loop paused off-screen / hidden tab,
 * capped DPR, refs-not-setState, palette-sourced uniforms (monochrome).
 */

const hexToVec3 = (hex: string): THREE.Vector3 =>
  new THREE.Vector3(
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  );

/** mulberry32 — deterministic PRNG (no Math.random), matching the starfield generator. */
const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const MOTE_COUNT = 90;
const Z_LAYERS = [-2.4, 0.1, 1.7];

interface Targets {
  nx: number;
  ny: number;
  intensity: number;
}

function DepthField({
  targetsRef,
  active,
}: {
  targetsRef: MutableRefObject<Targets>;
  active: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const { invalidate } = useThree();

  const dpr = typeof window !== 'undefined' ? Math.min(1.5, window.devicePixelRatio) : 1;

  const geometry = useMemo(() => {
    const rand = mulberry32(0x5bd1e995);
    const positions = new Float32Array(MOTE_COUNT * 3);
    const sizes = new Float32Array(MOTE_COUNT);
    const seeds = new Float32Array(MOTE_COUNT);
    for (let i = 0; i < MOTE_COUNT; i++) {
      const layer = i % 3;
      positions[i * 3] = (rand() * 2 - 1) * 3.4;
      positions[i * 3 + 1] = (rand() * 2 - 1) * 1.15;
      positions[i * 3 + 2] = Z_LAYERS[layer] + (rand() * 2 - 1) * 0.3;
      sizes[i] = (layer === 2 ? 2.2 : layer === 1 ? 1.5 : 1.0) * (0.55 + rand() * 0.8);
      seeds[i] = rand();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    return geo;
  }, []);

  const moteUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: hexToVec3(PALETTE.white) },
      uOpacity: { value: 0.85 },
      uPixelRatio: { value: dpr },
    }),
    [dpr],
  );

  const glowUniforms = useMemo(
    () => ({
      uColor: { value: hexToVec3(PALETTE.accent) },
      uIntensity: { value: 0.14 },
    }),
    [],
  );

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  useEffect(() => {
    if (active) invalidate();
  }, [active, invalidate]);

  useFrame((_, delta) => {
    if (!active) return;
    const t = targetsRef.current;
    moteUniforms.uTime.value += Math.min(delta, 0.05);

    const g = groupRef.current;
    if (g) {
      g.rotation.y += (t.nx * 0.24 - g.rotation.y) * 0.08;
      g.rotation.x += (-t.ny * 0.16 - g.rotation.x) * 0.08;
    }
    const glow = glowRef.current;
    if (glow) {
      glow.position.x += (t.nx * 2.8 - glow.position.x) * 0.12;
      glow.position.y += (t.ny * 1.0 - glow.position.y) * 0.12;
      glowUniforms.uIntensity.value += (t.intensity - glowUniforms.uIntensity.value) * 0.1;
    }
    invalidate();
  });

  return (
    <group ref={groupRef}>
      <points geometry={geometry}>
        <shaderMaterial
          vertexShader={motesVertex}
          fragmentShader={motesFragment}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={moteUniforms as unknown as Record<string, THREE.IUniform>}
        />
      </points>
      <mesh ref={glowRef} position={[0, 0, 1.2]}>
        <planeGeometry args={[2.6, 2.6]} />
        <shaderMaterial
          vertexShader={glowVertex}
          fragmentShader={glowFragment}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
          uniforms={glowUniforms as unknown as Record<string, THREE.IUniform>}
        />
      </mesh>
    </group>
  );
}

export default React.memo(function PanelDepthScene() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const targetsRef = useRef<Targets>({ nx: 0, ny: 0, intensity: 0.14 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      const over = nx >= -1.15 && nx <= 1.15 && ny >= -1.15 && ny <= 1.15;
      targetsRef.current.nx = Math.max(-1.2, Math.min(1.2, nx));
      targetsRef.current.ny = Math.max(-1.2, Math.min(1.2, ny));
      targetsRef.current.intensity = over ? 0.8 : 0.14;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    let onScreen = false;
    const sync = () => setActive(onScreen && !document.hidden);
    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              onScreen = entries.some((en) => en.isIntersecting);
              sync();
            },
            { threshold: 0.05 },
          )
        : null;
    if (io) io.observe(el);
    else setActive(true);
    document.addEventListener('visibilitychange', sync);

    return () => {
      window.removeEventListener('pointermove', onMove);
      if (io) io.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  return (
    <div ref={wrapRef} className="telemetry-depth" data-panel-depth="" aria-hidden="true">
      <Canvas
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance', stencil: false, depth: false }}
        dpr={Math.min(1.5, typeof window !== 'undefined' ? window.devicePixelRatio : 1)}
        frameloop="demand"
        camera={{ position: [0, 0, 4.2], fov: 40, near: 0.1, far: 30 }}
        style={{ display: 'block', width: '100%', height: '100%' }}
        onCreated={() => wrapRef.current?.setAttribute('data-gl', 'webgl')}
      >
        <DepthField targetsRef={targetsRef} active={active} />
      </Canvas>
    </div>
  );
});
