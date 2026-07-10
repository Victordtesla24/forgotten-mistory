'use client';

/**
 * SkillVizEngineering — compact R3F visualization for the Engineering skill group.
 *
 * Renders a CI/CD pipeline topology: geometric blocks (build → test → deploy)
 * connected by flowing data lines. Blocks are extruded boxes arranged in a
 * pipeline pattern. A small particle travels the pipeline route.
 */

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from '@/lib/palette';

const ACCENT = new THREE.Color(PALETTE.accent);
const STEEL = new THREE.Color(PALETTE.steel);
const INK800 = new THREE.Color(PALETTE.ink800);

// 4 pipeline stages
const PIPELINE: { label: string; pos: [number, number, number]; size: [number, number, number] }[] = [
  { label: 'Build', pos: [-0.75, 0.15, 0], size: [0.32, 0.16, 0.08] },
  { label: 'Test', pos: [-0.25, -0.05, 0], size: [0.32, 0.16, 0.08] },
  { label: 'Scan', pos: [0.25, 0.15, 0], size: [0.32, 0.16, 0.08] },
  { label: 'Deploy', pos: [0.75, -0.05, 0], size: [0.32, 0.16, 0.08] },
];

function PipelineScene({ frozen }: { frozen: boolean }) {
  const particleRef = useRef<THREE.Mesh>(null);
  const accRef = useRef(0);
  const { invalidate } = useThree();
  const travelPath = useMemo(() => {
    const start = -0.75;
    const end = 0.75;
    return { start, end };
  }, []);

  useFrame((_, dt) => {
    if (frozen) return;
    accRef.current += dt;
    if (accRef.current < 1.0 / 20.0) return;
    if (particleRef.current) {
      const t = (performance.now() * 0.0004) % 1;
      const x = travelPath.start + (travelPath.end - travelPath.start) * t;
      particleRef.current.position.x = x;
      particleRef.current.position.y = Math.sin(t * Math.PI) * 0.12;
    }
    accRef.current = 0;
    invalidate();
  });

  const boxGeom = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const particleGeom = useMemo(() => new THREE.SphereGeometry(0.025, 8, 8), []);

  return (
    <group>
      {/* Pipeline blocks */}
      {PIPELINE.map((stage, i) => (
        <group key={stage.label} position={stage.pos}>
          <mesh geometry={boxGeom} scale={stage.size}>
            <meshStandardMaterial color={INK800} roughness={0.9} metalness={0.05} />
          </mesh>
          {/* Wireframe outline */}
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
            <lineBasicMaterial color={STEEL} transparent opacity={0.4} toneMapped={false} />
          </lineSegments>
          <mesh geometry={boxGeom} scale={[stage.size[0] * 1.02, stage.size[1] * 1.02, stage.size[2] * 1.05]} position={[0, 0, -0.05]}>
            <meshBasicMaterial color={ACCENT} transparent opacity={0.06} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* Traveling particle */}
      <mesh ref={particleRef} geometry={particleGeom} position={[travelPath.start, 0, 0.06]}>
        <meshBasicMaterial color={ACCENT} transparent opacity={0.9} toneMapped={false} />
      </mesh>
      {/* Connection lines */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([
              -0.59, 0.15, 0, -0.41, -0.05, 0,
              -0.09, -0.05, 0, 0.09, 0.15, 0,
              0.41, 0.15, 0, 0.59, -0.05, 0,
            ]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={STEEL} transparent opacity={0.25} toneMapped={false} />
      </lineSegments>
    </group>
  );
}

function PosterFallback() {
  const blocks = [
    { x: 32, y: 48, w: 40, h: 22, label: 'Build' },
    { x: 90, y: 72, w: 40, h: 22, label: 'Test' },
    { x: 148, y: 48, w: 40, h: 22, label: 'Scan' },
    { x: 206, y: 72, w: 40, h: 22, label: 'Deploy' },
  ];
  return (
    <svg viewBox="0 0 260 160" className="skill-viz-poster" role="img" aria-label="CI/CD pipeline (static)">
      {blocks.map((b) => (
        <g key={b.label}>
          <rect x={b.x - b.w / 2} y={b.y - b.h / 2} width={b.w} height={b.h} rx="3" fill="var(--ink-800)" stroke="var(--steel)" strokeWidth="0.8" />
          <text x={b.x} y={b.y + 4} textAnchor="middle" fill="var(--steel)" fontSize="9" fontFamily="var(--font-mono)">{b.label}</text>
        </g>
      ))}
      <line x1={52} y1={59} x2={70} y2={61} stroke="var(--steel)" strokeWidth="0.6" opacity="0.4" />
      <line x1={110} y1={61} x2={128} y2={59} stroke="var(--steel)" strokeWidth="0.6" opacity="0.4" />
      <line x1={168} y1={59} x2={186} y2={61} stroke="var(--steel)" strokeWidth="0.6" opacity="0.4" />
      <circle cx={134} cy={60} r="2.5" fill="var(--accent)" opacity="0.8" />
    </svg>
  );
}

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return inView;
}

export default function SkillVizEngineering() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef);

  return (
    <div
      ref={containerRef}
      className="skill-viz skill-viz--engineering"
      data-testid="skill-viz-engineering"
      aria-hidden="true"
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, background: 'transparent', pointerEvents: 'none' }}
    >
      {inView ? (
        <Canvas
          camera={{ position: [0, 0, 1.6], fov: 45 }}
          gl={{ antialias: false, alpha: true, preserveDrawingBuffer: false }}
          dpr={[1, 1]}
          frameloop="demand"
          style={{ width: 260, height: 160 }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 1, 3]} intensity={0.4} />
          <PipelineScene frozen={false} />
        </Canvas>
      ) : (
        <PosterFallback />
      )}
    </div>
  );
}
