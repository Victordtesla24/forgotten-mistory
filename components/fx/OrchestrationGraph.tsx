'use client';

/**
 * OrchestrationGraph — R3F signature scene for the multi-agent orchestration
 * skill group (SPEC §7 #12). Instanced nodes + agentGraphPulse shader edges
 * with a coordinated cascade of agent-to-agent message propagation.
 * Meta-narrative: how this site was built via Hermes profile orchestration.
 *
 * Props contract (SPEC §9.3): { active, reducedMotion, dpr, palette }
 *
 * Hardened R2: DPR cap 1.5; no per-frame alloc; post-FX off on
 * reduced-motion; pause off-screen via visibilitychange; poster fallback.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import { PALETTE } from '@/lib/palette';
import { agentGraphPulseFragment, agentGraphVertex } from './shaders/agentGraphPulse.glsl';

// ── Résumé-sourced real data (R3 — NEVER random) ──
// Meta: this site is built by a 6-profile Hermes orchestration system
const AGENT_PROFILE_COUNT = 6;
const AGENT_LABEL = 'real-time agent orchestration';

const ACCENT = new THREE.Color(PALETTE.accent);

// ── Deterministic node positions matching the shader ──
// These mirror the hash21-based positions in the agentGraphPulse fragment shader.
function hash21(x: number, y: number): number {
  const h = x * 127.1 + y * 311.7;
  return ((Math.sin(h) * 43758.5453) % 1 + 1) % 1;
}

const NODE_COUNT = 6;
function computeNodePositions(): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    const angle = (i / NODE_COUNT) * Math.PI * 2 - 1.2;
    const radius = 0.28 + hash21(i * 0.37, 0) * 0.18;
    // Convert from uv-space (0..1) to clip-space centered
    const u = 0.5 + Math.cos(angle) * radius;
    const v = 0.5 + Math.sin(angle) * radius;
    // Map to 3D space matching the shader plane (planeGeometry 3x3 at z=0)
    positions.push(new THREE.Vector3((u - 0.5) * 3.0, (v - 0.5) * 3.0, 0.01));
  }
  return positions;
}

// ── Hooks ──

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return inView;
}

function usePageVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const handler = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);
  return visible;
}

// ── R3F sub-components ──

/** Full-screen quad with the agentGraphPulse shader (edges + coordinated cascade). */
function GraphPlane({ frozen }: { frozen: boolean }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const accRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uActiveEdge: { value: 1.0 },
      uColorStroke: { value: ACCENT.clone() },
    }),
    [],
  );

  useFrame((_, dt) => {
    if (frozen || !matRef.current) return;
    // 30 Hz throttle — no per-frame alloc
    accRef.current += dt;
    if (accRef.current < 1.0 / 30.0) return;
    matRef.current.uniforms.uTime.value += accRef.current;
    accRef.current = 0;
  });

  return (
    <mesh>
      <planeGeometry args={[3.0, 3.0]} />
      <shaderMaterial
        ref={matRef}
        args={[{
          uniforms,
          vertexShader: agentGraphVertex,
          fragmentShader: agentGraphPulseFragment,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }]}
      />
    </mesh>
  );
}

/** Instanced spheres at node positions — matches the shader's node topology. */
function InstancedNodes({ frozen }: { frozen: boolean }) {
  const nodePositions = useMemo(() => computeNodePositions(), []);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    if (frozen || !groupRef.current) return;
    groupRef.current.rotation.z += dt * 0.05;
  });

  return (
    <group ref={groupRef}>
      {nodePositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.7} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Travelling edge-pulse indicators — small particles that follow the cascade. */
function PulseParticles({ frozen }: { frozen: boolean }) {
  const nodePositions = useMemo(() => computeNodePositions(), []);
  const refs = useRef<THREE.Mesh[]>([]);

  useFrame((_, dt) => {
    if (frozen) return;
    for (let i = 0; i < NODE_COUNT; i++) {
      const ref = refs.current[i];
      if (!ref) continue;
      const j = (i + 1) % NODE_COUNT;
      const from = nodePositions[i];
      const to = nodePositions[j];
      const phase = ((performance.now() * 0.001 * 1.3 + i * 0.5) % 1.0);
      ref.position.copy(from).lerp(to, phase);
    }
  });

  return (
    <group>
      {nodePositions.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) refs.current[i] = el; }}
        >
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.6} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ frozen }: { frozen: boolean }) {
  return (
    <group>
      <GraphPlane frozen={frozen} />
      <InstancedNodes frozen={frozen} />
      <PulseParticles frozen={frozen} />
    </group>
  );
}

// ── Poster fallback ──
function PosterFallback() {
  return (
    <div className="og-poster" aria-label="Orchestration graph (static)">
      <svg viewBox="0 0 200 200" className="og-poster-svg" role="img">
        {/* 6 nodes in a ring */}
        {Array.from({ length: NODE_COUNT }).map((_, i) => {
          const angle = (i / NODE_COUNT) * Math.PI * 2 - 1.2;
          const r = 60;
          const cx = 100 + Math.cos(angle) * r;
          const cy = 100 + Math.sin(angle) * r;
          return <circle key={i} cx={cx} cy={cy} r="5" fill="var(--accent)" opacity="0.6" />;
        })}
        {/* Edges */}
        {Array.from({ length: NODE_COUNT }).map((_, i) => {
          const j = (i + 1) % NODE_COUNT;
          const a1 = (i / NODE_COUNT) * Math.PI * 2 - 1.2;
          const a2 = (j / NODE_COUNT) * Math.PI * 2 - 1.2;
          const r = 60;
          const x1 = 100 + Math.cos(a1) * r;
          const y1 = 100 + Math.sin(a1) * r;
          const x2 = 100 + Math.cos(a2) * r;
          const y2 = 100 + Math.sin(a2) * r;
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--steel)" strokeWidth="0.8" opacity="0.35" />
          );
        })}
        {/* Center label */}
        <text x="100" y="115" textAnchor="middle" fill="var(--steel)" fontSize="10" fontFamily="var(--font-mono)">
          orchestration
        </text>
      </svg>
      <div className="og-readout-static">
        <span>{AGENT_PROFILE_COUNT} agent profiles</span>
        <span className="og-sep">·</span>
        <span>Coordinated cascade</span>
      </div>
    </div>
  );
}

// ── Component ──

interface OrchestrationGraphProps {
  className?: string;
}

export default function OrchestrationGraph({ className = '' }: OrchestrationGraphProps) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef);
  const pageVisible = usePageVisible();
  const [webglError, setWebglError] = useState(false);

  const frozen = prefersReducedMotion || !inView || !pageVisible || webglError;

  const handleCanvasError = useCallback(() => setWebglError(true), []);

  return (
    <div
      ref={containerRef}
      className={className}
      data-testid="orchestration-graph"
      {...(frozen ? { 'data-frozen': 'true' } : {})}
    >
      {frozen ? (
        <PosterFallback />
      ) : (
        <>
          <Canvas
            camera={{ position: [0, 0, 2.8], fov: 50 }}
            gl={{ antialias: false, alpha: true, preserveDrawingBuffer: false }}
            dpr={[1, 1.5]}
            frameloop={frozen ? 'demand' : 'always'}
            onError={handleCanvasError}
            onCreated={() => setWebglError(false)}
          >
            <Scene frozen={frozen} />
            <EffectComposer>
              <Bloom intensity={0.4} luminanceThreshold={0.2} luminanceSmoothing={0.2} mipmapBlur />
              <Vignette eskil={false} offset={0.28} darkness={0.68} />
            </EffectComposer>
          </Canvas>
          {/* DOM overlay — text OUT of bloom */}
          <div className="og-readout" aria-hidden="true">
            <span>{AGENT_PROFILE_COUNT} agent profiles</span>
            <span className="og-sep">·</span>
            <span>Coordinated cascade</span>
          </div>
        </>
      )}
      <style jsx>{`
        div[data-testid="orchestration-graph"] {
          width: 100%;
          max-width: 340px;
          aspect-ratio: 1 / 1;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          position: relative;
          overflow: hidden;
        }
        .og-readout {
          position: absolute;
          bottom: 0.6rem;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--steel);
          pointer-events: none;
          z-index: 2;
        }
        .og-sep {
          opacity: 0.5;
        }
        .og-poster {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
        }
        .og-poster-svg {
          width: 80%;
          max-width: 180px;
          height: auto;
        }
        .og-readout-static {
          display: flex;
          gap: 0.5rem;
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--steel);
        }
      `}</style>
    </div>
  );
}
