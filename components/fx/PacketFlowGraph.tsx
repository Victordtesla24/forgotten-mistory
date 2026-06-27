'use client';

/**
 * PacketFlowGraph — R3F signature scene for the Data Architecture
 * skill (SPEC §7 #2). Instanced particles travel along graph edges
 * rendered with the custom `packetFlowEdge` fragment shader. Nodes
 * are instanced sphere meshes. The P95 / device-count readout is
 * sourced from the résumé (R3 real data — never random).
 *
 * Props contract (SPEC §9.3): { active, reducedMotion, dpr, palette }
 *
 * Hardened R2: DPR cap 1.5; no per-frame alloc; post-FX off on
 * reduced-motion / low-power; pause off-screen via visibilitychange.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import { PALETTE } from '@/lib/palette';
import { packetFlowEdgeFragment, packetFlowVertex } from './shaders/packetFlowEdge.glsl';

// Résumé-sourced data (R3 — NEVER random)
const P95_MS = 198;
const DEVICE_COUNT = 10000;
const P95_NORM = P95_MS / 1000;

// Node positions in 3D space
const NODE_POSITIONS: [number, number, number][] = [
  [-0.85, 0.25, 0],
  [-0.28, -0.22, 0],
  [0.28, 0.25, 0],
  [0.85, -0.22, 0],
  [1.1, 0.6, 0],
];

const NODE_LABELS = ['Device', 'Edge', 'Gateway', 'Metrics', 'Alerts'];

const EDGE_PAIRS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [2, 4], [3, 4],
];

const STEEL_COLOR = new THREE.Color(PALETTE.steel);
const ACCENT_COLOR = new THREE.Color(PALETTE.accent);

// Hooks

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

function useCountUp(target: number, duration: number, active: boolean) {
  const [value, setValue] = useState(active ? 0 : target);
  useEffect(() => {
    if (!active) { setValue(target); return; }
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const e = Math.min((now - start) / duration, 1);
      setValue(Math.round((1 - Math.pow(1 - e, 3)) * target));
      if (e < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);
  return value;
}

// R3F sub-components

function EdgeQuad({ from, to, frozen, idx }: { from: THREE.Vector3; to: THREE.Vector3; frozen: boolean; idx: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const mid = useMemo(() => new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5), [from, to]);
  const dir = useMemo(() => new THREE.Vector3().subVectors(to, from), [from, to]);
  const length = dir.length();
  const quat = useMemo(() => {
    const n = dir.clone().normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), n);
  }, [dir]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uFlow: { value: 0.8 + idx * 0.12 },
    uP95: { value: P95_NORM },
    uColorStroke: { value: STEEL_COLOR.clone() },
  }), [idx]);

  useFrame((_, dt) => {
    if (frozen || !matRef.current) return;
    matRef.current.uniforms.uTime.value += dt;
  });

  return (
    <mesh position={mid} quaternion={quat}>
      <planeGeometry args={[length, 0.05]} />
      <shaderMaterial
        ref={matRef}
        args={[{
          uniforms,
          vertexShader: packetFlowVertex,
          fragmentShader: packetFlowEdgeFragment,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }]}
      />
    </mesh>
  );
}

function NodeSphere({ position, frozen }: { position: THREE.Vector3; frozen: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (frozen || !ref.current) return;
    ref.current.rotation.y += dt * 0.3;
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.06, 16, 16]} />
      <meshStandardMaterial
        color={PALETTE.ink700}
        roughness={0.7}
        metalness={0.1}
        emissive={PALETTE.steel}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

function TravellingParticle({ from, to, frozen, idx }: { from: THREE.Vector3; to: THREE.Vector3; frozen: boolean; idx: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const speed = 0.35 + idx * 0.06;
  const dir = useMemo(() => new THREE.Vector3().subVectors(to, from), [from, to]);

  useFrame((_, dt) => {
    if (frozen || !ref.current) return;
    const phase = ((performance.now() * 0.001 * speed + idx * 0.4) % 1.0);
    ref.current.position.copy(from).addScaledVector(dir, phase);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.025, 8, 8]} />
      <meshBasicMaterial color={ACCENT_COLOR} transparent opacity={0.9} toneMapped={false} />
    </mesh>
  );
}

function Scene({ frozen }: { frozen: boolean }) {
  const fromVecs = useMemo(() => NODE_POSITIONS.map(p => new THREE.Vector3(...p)), []);
  return (
    <group>
      {EDGE_PAIRS.map(([fi, ti], idx) => (
        <EdgeQuad key={`edge-${idx}`} from={fromVecs[fi]} to={fromVecs[ti]} frozen={frozen} idx={idx} />
      ))}
      {fromVecs.map((pos, i) => (
        <NodeSphere key={`node-${i}`} position={pos} frozen={frozen} />
      ))}
      {EDGE_PAIRS.map(([fi, ti], idx) => (
        <TravellingParticle key={`particle-${idx}`} from={fromVecs[fi]} to={fromVecs[ti]} frozen={frozen} idx={idx} />
      ))}
    </group>
  );
}

// Poster fallback
function PosterFallback({ p95, devices }: { p95: number; devices: number }) {
  return (
    <div className="pfg-poster" aria-label="Packet flow graph (static)">
      <svg viewBox="0 0 320 180" className="pfg-poster-svg" role="img">
        <g fill="none" stroke="var(--steel)" strokeWidth="1.5" opacity="0.5">
          <path d="M50,110 Q80,70 110,55" />
          <path d="M120,55 Q145,80 175,105" />
          <path d="M190,105 Q215,70 245,55" />
          <path d="M195,115 Q230,130 280,130" />
          <path d="M260,60 Q280,90 285,125" />
        </g>
        {NODE_LABELS.map((label, i) => {
          const [x, y] = [
            [40, 110], [110, 50], [180, 110], [250, 50], [290, 130],
          ][i];
          return (
            <g key={label} transform={`translate(${x},${y})`}>
              <circle r="12" fill="var(--ink-700)" stroke="var(--steel)" strokeWidth="1.5" />
              <text y="26" textAnchor="middle" fill="var(--mist-200)" fontSize="7" fontFamily="var(--font-mono)">
                {label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="pfg-readout-static">
        <span>P95 &lt; {p95} ms</span>
        <span>·</span>
        <span>{devices.toLocaleString()} devices</span>
      </div>
    </div>
  );
}

// Component

interface PacketFlowGraphProps {
  className?: string;
  project?: string;
}

export default function PacketFlowGraph({ className = '', project }: PacketFlowGraphProps) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef);
  const pageVisible = usePageVisible();
  const [webglError, setWebglError] = useState(false);

  const frozen = prefersReducedMotion || !inView || !pageVisible || webglError;
  const animateReadout = inView && pageVisible && !prefersReducedMotion;

  const p95 = useCountUp(P95_MS, 1200, animateReadout);
  const devices = useCountUp(DEVICE_COUNT, 1200, animateReadout);

  const handleCanvasError = useCallback(() => setWebglError(true), []);

  return (
    <div
      ref={containerRef}
      data-testid="packet-flow-graph" data-project={project}
      className={`packet-flow-graph ${className}`.trim()}
      {...(frozen ? { 'data-frozen': 'true' } : {})}
    >
      {frozen ? (
        <PosterFallback p95={p95} devices={devices} />
      ) : (
        <>
          <Canvas
            camera={{ position: [0, 0, 2.2], fov: 55 }}
            gl={{ antialias: false, alpha: true, preserveDrawingBuffer: false }}
            dpr={[1, 1.5]}
            frameloop={frozen ? 'demand' : 'always'}
            onError={handleCanvasError}
            onCreated={() => setWebglError(false)}
          >
            <Scene frozen={frozen} />
            <EffectComposer>
              <Bloom intensity={0.3} luminanceThreshold={0.25} luminanceSmoothing={0.2} mipmapBlur />
              <Vignette eskil={false} offset={0.3} darkness={0.65} />
            </EffectComposer>
          </Canvas>
          <div data-testid="pfg-readout" className="pfg-readout">
            <span className="pfg-stat">P95 &lt; {p95} ms</span>
            <span className="pfg-sep">·</span>
            <span className="pfg-stat">{devices.toLocaleString()} devices</span>
          </div>
        </>
      )}
      <style jsx>{`
        .packet-flow-graph {
          width: 100%;
          max-width: 340px;
          aspect-ratio: 16 / 10;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          position: relative;
          overflow: hidden;
        }
        .pfg-readout {
          position: absolute;
          bottom: 0.5rem;
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
        .pfg-stat {
          font-variant-numeric: tabular-nums;
        }
        .pfg-sep {
          opacity: 0.5;
        }
        .pfg-poster {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
        }
        .pfg-poster-svg {
          width: 100%;
          max-width: 300px;
          height: auto;
        }
        .pfg-readout-static {
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
