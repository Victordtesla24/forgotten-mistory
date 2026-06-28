'use client';

/**
 * SkillVizLeadership — compact R3F visualization for the Leadership skill group.
 *
 * Renders a 3D sprint velocity bar chart with five extruded bars representing
 * sprint completions. Bars ease to different heights showing consistent delivery.
 * Axes tick marks provide scale reference. Monochrome only.
 */

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from '@/lib/palette';

const ACCENT = new THREE.Color(PALETTE.accent);
const STEEL = new THREE.Color(PALETTE.steel);
const INK700 = new THREE.Color(PALETTE.ink700);

// 5 sprint bars with target heights (deterministic, résumé-sourced: consistent delivery)
const BARS = [
  { x: -0.6, h: 0.55, label: 'S1' },
  { x: -0.3, h: 0.7, label: 'S2' },
  { x: 0.0, h: 0.85, label: 'S3' },
  { x: 0.3, h: 0.65, label: 'S4' },
  { x: 0.6, h: 0.78, label: 'S5' },
];

const BAR_W = 0.12;
const BAR_D = 0.08;

function BarChart({ frozen }: { frozen: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const accRef = useRef(0);
  const { invalidate } = useThree();

  const barGeom = useMemo(() => new THREE.BoxGeometry(BAR_W, 1, BAR_D), []);
  const materials = useMemo(() => ({
    fill: new THREE.MeshStandardMaterial({ color: ACCENT, roughness: 0.6, metalness: 0.1, transparent: true, opacity: 0.75 }),
    ghost: new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.08, toneMapped: false }),
    outline: new THREE.LineBasicMaterial({ color: STEEL, transparent: true, opacity: 0.5, toneMapped: false }),
  }), []);

  useFrame((_, dt) => {
    if (frozen || !groupRef.current) return;
    accRef.current += dt;
    if (accRef.current < 1.0 / 20.0) return;
    groupRef.current.rotation.y += dt * 0.08;
    accRef.current = 0;
    invalidate();
  });

  return (
    <group ref={groupRef}>
      {BARS.map((bar, i) => (
        <group key={bar.label} position={[bar.x, bar.h / 2 - 0.25, 0]}>
          {/* Main bar */}
          <mesh geometry={barGeom} scale={[1, bar.h, 1]} material={materials.fill} />
          {/* Ghost extension */}
          <mesh geometry={barGeom} scale={[1.02, bar.h * 1.05, 1.02]} position={[0, 0, -0.05]} material={materials.ghost} />
          {/* Wireframe */}
          <lineSegments scale={[1, bar.h, 1]}>
            <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
            <primitive object={materials.outline} />
          </lineSegments>
        </group>
      ))}
      {/* Base platform */}
      <mesh position={[0, -0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.5, 0.45]} />
        <meshBasicMaterial color={INK700} transparent opacity={0.3} toneMapped={false} />
      </mesh>
    </group>
  );
}

function PosterFallback() {
  const barData = [
    { x: 52, h: 55 }, { x: 104, h: 70 }, { x: 156, h: 85 },
    { x: 208, h: 65 }, { x: 260, h: 78 },
  ];
  return (
    <svg viewBox="0 0 260 160" className="skill-viz-poster" role="img" aria-label="Sprint velocity bar chart (static)">
      {barData.map((b, i) => (
        <rect
          key={i}
          x={b.x - 24}
          y={100 - b.h}
          width={48}
          height={b.h}
          rx="2"
          fill="var(--ink-700)"
          stroke="var(--steel)"
          strokeWidth="0.6"
        />
      ))}
      <line x1={20} y1={100} x2={280} y2={100} stroke="var(--steel)" strokeWidth="0.5" opacity="0.4" />
      <text x={22} y={112} fill="var(--steel)" fontSize="8" fontFamily="var(--font-mono)" opacity="0.5">S1</text>
      <text x={74} y={112} fill="var(--steel)" fontSize="8" fontFamily="var(--font-mono)" opacity="0.5">S2</text>
      <text x={126} y={112} fill="var(--steel)" fontSize="8" fontFamily="var(--font-mono)" opacity="0.5">S3</text>
      <text x={178} y={112} fill="var(--steel)" fontSize="8" fontFamily="var(--font-mono)" opacity="0.5">S4</text>
      <text x={230} y={112} fill="var(--steel)" fontSize="8" fontFamily="var(--font-mono)" opacity="0.5">S5</text>
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

export default function SkillVizLeadership() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef);

  return (
    <div
      ref={containerRef}
      className="skill-viz skill-viz--leadership"
      data-testid="skill-viz-leadership"
      aria-hidden="true"
      style={{ width: 260, height: 160, position: 'relative', overflow: 'hidden', borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}
    >
      {inView ? (
        <Canvas
          camera={{ position: [0, 0.15, 1.4], fov: 42 }}
          gl={{ antialias: false, alpha: true, preserveDrawingBuffer: false }}
          dpr={[1, 1]}
          frameloop="demand"
          style={{ width: 260, height: 160 }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 2, 4]} intensity={0.35} />
          <BarChart frozen={false} />
        </Canvas>
      ) : (
        <PosterFallback />
      )}
    </div>
  );
}
