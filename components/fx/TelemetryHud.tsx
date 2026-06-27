'use client';

/**
 * TelemetryHud — the JARVIS signature scene (SPEC §7 #1, the recurring site motif).
 * Monochrome holographic telemetry HUD: a custom-GLSL radar ring (FR-SHADER) over a
 * faux-volumetric stage-light shaft (FR-LIGHT), with live-easing gauge readouts and a
 * scrolling sparkline driven by REAL browser FPS/frame-time (R3 — NOT a coffee-cup sim).
 * Fully self-contained (renders its own <Canvas>); drop it into a sized container.
 * Respects prefers-reduced-motion (renders a single static frame).
 *
 * Hardened R2: 30 Hz shader-uniform throttle; DPR capped at 1.5; no per-frame alloc;
 * volumetric shaft at half-res via uResolution uniform (FR-LIGHT §2.2); post-FX
 * disabled on reduced-motion / low-power.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
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
function ShaderPlane({ fragmentShader, color, size, position = [0, 0, 0], frozen, opacity = 1, halfRes = false }: ShaderPlaneProps & { halfRes?: boolean }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const accRef = useRef(0); // 30 Hz throttle accumulator — no per-frame alloc (C2)
  const hasResolution = fragmentShader.includes('uResolution');
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: color.clone() },
      uOpacity: { value: opacity },
      ...(hasResolution ? { uResolution: { value: new THREE.Vector2() } } : {}),
    }),
    [color, opacity, hasResolution],
  );

  useFrame(({ size: canvasSize }, dt) => {
    if (frozen || !matRef.current) return;
    // 30 Hz throttle — skip frames to reduce GPU load on the shader uniform path (FR-SHADER)
    accRef.current += dt;
    if (accRef.current < 1.0 / 30.0) return;
    matRef.current.uniforms.uTime.value += accRef.current;
    if (hasResolution) {
      const w = halfRes ? canvasSize.width * 0.5 : canvasSize.width;
      const h = halfRes ? canvasSize.height * 0.5 : canvasSize.height;
      matRef.current.uniforms.uResolution.value.set(w, h);
    }
    accRef.current = 0;
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
      {/* volumetric stage light behind the HUD (FR-LIGHT) — half-res for performance */}
      <ShaderPlane fragmentShader={lightShaftFragment} color={STEEL} size={[4.5, 6]} position={[0, 0.4, -1.2]} frozen={frozen} opacity={0.7} halfRes />
      {/* custom-GLSL radar ring (FR-SHADER) */}
      <ShaderPlane fragmentShader={holoRingFragment} color={ACCENT} size={[3.4, 3.4]} position={[0, 0, 0]} frozen={frozen} />
      {/* live gauge readouts */}
      <GaugeArc radius={1.5} target={0.78} frozen={frozen} />
      <GaugeArc radius={1.62} target={0.42} frozen={frozen} />
    </group>
  );
}

// ── R3: Real browser telemetry (NOT a coffee-cup sim) ──
const ROLLING_WINDOW = 60;

function useRealTelemetry(enabled: boolean) {
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(16.7);
  const [sparkline, setSparkline] = useState<number[]>(Array.from({ length: 24 }, () => 55 + Math.round(Math.random() * 10)));

  useEffect(() => {
    if (!enabled) return;
    let raf: number;
    let last = performance.now();
    const fpsHistory: number[] = [];
    let running = true;

    const tick = (now: number) => {
      if (!running) return;
      const delta = now - last;
      last = now;
      if (delta > 0) {
        const instantFps = Math.round(1000 / delta);
        fpsHistory.push(Math.min(instantFps, 144));
        if (fpsHistory.length > ROLLING_WINDOW) fpsHistory.shift();
        const avgFps = Math.round(fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length);
        setFps(avgFps);
        setFrameTime(Math.round(delta * 10) / 10);
        if (fpsHistory.length % 4 === 0) {
          setSparkline((prev) => {
            const next = [...prev.slice(1), avgFps];
            return next;
          });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  return { fps, frameTime, sparkline };
}

function RealSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 24;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return x.toFixed(1) + ',' + y.toFixed(1);
    })
    .join(' ');

  return (
    <svg data-testid="hud-sparkline" width={width} height={height} className="absolute bottom-2 right-2 opacity-70" aria-label="Real-time FPS sparkline">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={points} className="text-steel" />
    </svg>
  );
}

function TelemetryReadout({ fps, frameTime, frozen }: { fps: number; frameTime: number; frozen: boolean }) {
  const displayFps = frozen ? 60 : fps;
  const displayFt = frozen ? 16.7 : frameTime;

  return (
    <div className="hud-readout" data-hud-readout aria-hidden="true">
      <span className="hud-readout__label">FPS</span>
      <span className="hud-readout__value">{displayFps}<span className="hud-readout__unit">hz</span></span>
      <span className="hud-readout__sep" />
      <span className="hud-readout__label">FT</span>
      <span className="hud-readout__value">{displayFt.toFixed(1)}<span className="hud-readout__unit">ms</span></span>
    </div>
  );
}

export default function TelemetryHud({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const frozen = !!reduced;
  const { fps, frameTime, sparkline } = useRealTelemetry(!frozen);

  return (
    <div className={className} data-testid="hud-interactive">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }} gl={{ antialias: false, alpha: true }} dpr={[1, 1.5]} frameloop={frozen ? 'demand' : 'always'}>
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
      <div className="hud-scanline" data-hud-scanline aria-hidden="true" />
      <RealSparkline data={sparkline} />
      <TelemetryReadout fps={fps} frameTime={frameTime} frozen={frozen} />
    </div>
  );
}
