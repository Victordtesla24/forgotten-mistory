'use client';

/**
 * SkillVizAI — compact R3F visualization for the AI/ML & Data skill group.
 *
 * Renders a pulsing neural-network node graph: instanced spheres connected by
 * monochrome edge lines. Nodes pulse subtly (scale oscillation) using
 * sine-based modulation — no random values.
 *
 * Dimensions: ~260×160 canvas, dpr capped at 1. Frameloop="demand" with
 * periodic invalidation for power efficiency. Monochrome only.
 */

import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from '@/lib/palette';

const ACCENT = new THREE.Color(PALETTE.accent);
const STEEL = new THREE.Color(PALETTE.steel);
const NODE_COUNT = 7;
const EDGES: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 3], [2, 4],
  [3, 5], [4, 5], [4, 6], [5, 6], [0, 6],
];

// Deterministic node layout
function computePositions(): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    const angle = (i / NODE_COUNT) * Math.PI * 2;
    const radius = 0.55 + (i % 2) * 0.18;
    positions.push(new THREE.Vector3(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius * 0.6,
      0,
    ));
  }
  return positions;
}

function NodesAndEdges({ frozen }: { frozen: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const accRef = useRef(0);

  const positions = useMemo(computePositions, []);
  const nodeGeom = useMemo(() => new THREE.SphereGeometry(0.04, 16, 16), []);
  const nodeMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: ACCENT, transparent: true, opacity: 0.85, toneMapped: false,
  }), []);
  const edgeMat = useMemo(() => new THREE.LineBasicMaterial({
    color: STEEL, transparent: true, opacity: 0.3, toneMapped: false,
  }), []);

  // Build edge geometries
  const edgeLines = useMemo(() => {
    const lines: { geom: THREE.BufferGeometry; key: string }[] = [];
    EDGES.forEach(([a, b], idx) => {
      const geom = new THREE.BufferGeometry();
      geom.setFromPoints([positions[a], positions[b]]);
      lines.push({ geom, key: `e-${idx}` });
    });
    return lines;
  }, [positions]);

  const { invalidate } = useThree();

  useFrame((_, dt) => {
    if (frozen) return;
    accRef.current += dt;
    if (accRef.current < 1.0 / 20.0) return;
    if (groupRef.current) {
      const t = performance.now() * 0.001;
      groupRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const s = 1 + Math.sin(t * 2.5 + i * 0.9) * 0.25;
          child.scale.setScalar(s);
        }
      });
    }
    accRef.current = 0;
    invalidate();
  });

  return (
    <group ref={groupRef}>
      {edgeLines.map(({ geom, key }) => (
        <lineSegments key={key} geometry={geom} material={edgeMat} />
      ))}
      {positions.map((pos, i) => (
        <mesh key={`n-${i}`} geometry={nodeGeom} material={nodeMat} position={pos} />
      ))}
    </group>
  );
}

function PosterFallback() {
  return (
    <svg viewBox="0 0 260 160" className="skill-viz-poster" role="img" aria-label="Neural network nodes (static)">
      {EDGES.map(([a, b], i) => {
        const pa = computeAnglePos(a, 130, 80, 55, 0.6);
        const pb = computeAnglePos(b, 130, 80, 55, 0.6);
        return <line key={`pe-${i}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="var(--steel)" strokeWidth="0.5" opacity="0.3" />;
      })}
      {Array.from({ length: NODE_COUNT }).map((_, i) => {
        const p = computeAnglePos(i, 130, 80, 55, 0.6);
        return <circle key={`pn-${i}`} cx={p.x} cy={p.y} r="3" fill="var(--accent)" opacity="0.7" />;
      })}
    </svg>
  );
}

function computeAnglePos(i: number, cx: number, cy: number, r: number, ratio: number) {
  const angle = (i / NODE_COUNT) * Math.PI * 2;
  return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r * ratio };
}

// ── Lazy mount hook ──
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

export default function SkillVizAI() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef);

  return (
    <div
      ref={containerRef}
      className="skill-viz skill-viz--ai"
      data-testid="skill-viz-ai"
      aria-hidden="true"
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, background: 'transparent', pointerEvents: 'none' }}
    >
      {inView ? (
        <Canvas
          camera={{ position: [0, 0, 1.4], fov: 45 }}
          gl={{ antialias: false, alpha: true, preserveDrawingBuffer: false }}
          dpr={[1, 1]}
          frameloop="demand"
          style={{ width: 260, height: 160 }}
        >
          <NodesAndEdges frozen={false} />
        </Canvas>
      ) : (
        <PosterFallback />
      )}
    </div>
  );
}
