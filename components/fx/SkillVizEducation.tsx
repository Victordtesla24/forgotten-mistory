'use client';

/**
 * SkillVizEducation — compact R3F visualization for the Education skill group.
 *
 * Renders stacked academic tiers: two platforms (undergraduate → masters)
 * with a subtle upward light beam connecting them. The geometry conveys
 * progressive achievement in a restrained, monochrome language.
 */

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from '@/lib/palette';

const ACCENT = new THREE.Color(PALETTE.accent);
const STEEL = new THREE.Color(PALETTE.steel);
const INK700 = new THREE.Color(PALETTE.ink700);

// Two academic tiers: undergrad → masters
const TIERS = [
  { y: -0.3, w: 0.7, d: 0.35, h: 0.08, label: 'B.Eng CS', institution: 'U. Melbourne' },
  { y: 0.2, w: 0.55, d: 0.3, h: 0.08, label: 'M.CS Hons', institution: 'Monash' },
];

function AcademicTiers({ frozen }: { frozen: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const accRef = useRef(0);
  const { invalidate } = useThree();

  const boxGeom = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  useFrame((_, dt) => {
    if (frozen || !groupRef.current) return;
    accRef.current += dt;
    if (accRef.current < 1.0 / 20.0) return;
    groupRef.current.rotation.y += dt * 0.06;
    accRef.current = 0;
    invalidate();
  });

  return (
    <group ref={groupRef}>
      {/* Light beam between tiers */}
      <mesh position={[0, -0.05, -0.01]}>
        <boxGeometry args={[0.04, 0.45, 0.02]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.18} toneMapped={false} />
      </mesh>

      {TIERS.map((tier, i) => (
        <group key={tier.label} position={[0, tier.y, 0]}>
          {/* Platform */}
          <mesh geometry={boxGeom} scale={[tier.w, tier.h, tier.d]}>
            <meshStandardMaterial color={INK700} roughness={0.8} metalness={0.05} />
          </mesh>
          {/* Top surface glow */}
          <mesh geometry={boxGeom} scale={[tier.w * 0.98, 0.005, tier.d * 0.98]} position={[0, tier.h / 2 + 0.003, 0]}>
            <meshBasicMaterial color={ACCENT} transparent opacity={i === 0 ? 0.08 : 0.14} toneMapped={false} />
          </mesh>
          {/* Wireframe */}
          <lineSegments scale={[tier.w, tier.h * 1.2, tier.d]}>
            <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
            <lineBasicMaterial color={STEEL} transparent opacity={0.3 + i * 0.15} toneMapped={false} />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}

function PosterFallback() {
  return (
    <svg viewBox="0 0 260 160" className="skill-viz-poster" role="img" aria-label="Academic tiers (static)">
      {/* Light line */}
      <line x1="130" y1="35" x2="130" y2="125" stroke="var(--accent)" strokeWidth="1" opacity="0.15" />
      {/* Tier "M.CS Hons — Monash" */}
      <rect x="58" y="30" width="144" height="16" rx="2" fill="var(--ink-700)" stroke="var(--steel)" strokeWidth="0.7" />
      <text x="130" y="41" textAnchor="middle" fill="var(--accent)" fontSize="9" fontFamily="var(--font-mono)" opacity="0.9">M.CS Hons — Monash</text>
      {/* Tier "B.Eng CS — U. Melbourne" */}
      <rect x="40" y="114" width="180" height="16" rx="2" fill="var(--ink-700)" stroke="var(--steel)" strokeWidth="0.7" />
      <text x="130" y="125" textAnchor="middle" fill="var(--steel)" fontSize="9" fontFamily="var(--font-mono)" opacity="0.8">B.Eng CS — U. Melbourne</text>
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

export default function SkillVizEducation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef);

  return (
    <div
      ref={containerRef}
      className="skill-viz skill-viz--education"
      data-testid="skill-viz-education"
      aria-hidden="true"
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, background: 'transparent', pointerEvents: 'none' }}
    >
      {inView ? (
        <Canvas
          camera={{ position: [0, 0.05, 1.3], fov: 42 }}
          gl={{ antialias: false, alpha: true, preserveDrawingBuffer: false }}
          dpr={[1, 1]}
          frameloop="demand"
          style={{ width: 260, height: 160 }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[2, 2, 4]} intensity={0.3} />
          <AcademicTiers frozen={false} />
        </Canvas>
      ) : (
        <PosterFallback />
      )}
    </div>
  );
}
