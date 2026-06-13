'use client';

/**
 * TelemetryHud — the JARVIS signature scene (SPEC §7 #1, the recurring site motif).
 * Monochrome holographic telemetry HUD: a custom-GLSL radar ring (FR-SHADER) over a
 * faux-volumetric stage-light shaft (FR-LIGHT), with live-easing gauge readouts and a
 * scrolling sparkline. Fully self-contained (renders its own <Canvas>); drop it into a
 * sized container. Respects prefers-reduced-motion (renders a single static frame).
 */

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import { PALETTE } from '@/lib/palette';
import { holoRingFragment, hudVertex, lightShaftFragment } from './shaders/hud';

const ACCENT = new THREE.Color(PALETTE.accent);
const STEEL = new THREE.Color(PALETTE.steel);

interface ShaderPlaneProps {
  fragmentShader: string;
  color: THREE.Color;
  size: [number, number];
  position?: [number, number, number];
  frozen: boolean;
  opacity?: number;
}

/** A unit plane driven by one of the HUD fragment shaders. */
function ShaderPlane({ fragmentShader, color, size, position = [0, 0, 0], frozen, opacity = 1 }: ShaderPlaneProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: color.clone() },
      uOpacity: { value: opacity },
    }),
    [color, opacity],
  );

  useFrame((_, dt) => {
    if (frozen || !matRef.current) return;
    matRef.current.uniforms.uTime.value += dt;
  });

  return (
    <mesh position={position}>
      <planeGeometry args={[size[0], size[1]]} />
      <shaderMaterial
        ref={matRef}
        args={[
          {
            uniforms,
            vertexShader: hudVertex,
            fragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          },
        ]}
      />
    </mesh>
  );
}

/** A radial gauge arc that eases toward a target fill (0..1). */
function GaugeArc({ radius, target, frozen }: { radius: number; target: number; frozen: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const fill = useRef(frozen ? target : 0);
  const geom = useMemo(
    () => new THREE.RingGeometry(radius, radius + 0.035, 64, 1, -Math.PI / 2, Math.PI * 1.5),
    [radius],
  );

  useFrame((_, dt) => {
    if (!ref.current) return;
    if (!frozen) fill.current += (target - fill.current) * Math.min(1, dt * 1.8);
    const arc = THREE.MathUtils.clamp(fill.current, 0, 1) * Math.PI * 1.5;
    const g = ref.current.geometry as THREE.RingGeometry;
    g.dispose();
    ref.current.geometry = new THREE.RingGeometry(radius, radius + 0.035, 64, 1, -Math.PI / 2, arc);
  });

  return (
    <mesh ref={ref} geometry={geom}>
      <meshBasicMaterial color={STEEL} transparent opacity={0.85} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Hud({ frozen }: { frozen: boolean }) {
  return (
    <group>
      {/* volumetric stage light behind the HUD (FR-LIGHT) */}
      <ShaderPlane fragmentShader={lightShaftFragment} color={STEEL} size={[4.5, 6]} position={[0, 0.4, -1.2]} frozen={frozen} opacity={0.7} />
      {/* custom-GLSL radar ring (FR-SHADER) */}
      <ShaderPlane fragmentShader={holoRingFragment} color={ACCENT} size={[3.4, 3.4]} position={[0, 0, 0]} frozen={frozen} />
      {/* live gauge readouts */}
      <GaugeArc radius={1.5} target={0.78} frozen={frozen} />
      <GaugeArc radius={1.62} target={0.42} frozen={frozen} />
    </group>
  );
}

export default function TelemetryHud({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const frozen = !!reduced;

  return (
    <div className={className} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        gl={{ antialias: false, alpha: true }}
        dpr={[1, 1.5]}
        frameloop={frozen ? 'demand' : 'always'}
      >
        <Hud frozen={frozen} />
        {!frozen ? (
          <EffectComposer>
            <Bloom intensity={0.7} luminanceThreshold={0.12} luminanceSmoothing={0.3} mipmapBlur />
            <Vignette eskil={false} offset={0.2} darkness={0.7} />
          </EffectComposer>
        ) : (
          <></>
        )}
      </Canvas>
    </div>
  );
}
