'use client';

/**
 * SkillVizCertifications — compact R3F visualization for the Certifications skill group.
 *
 * Renders three concentric credential rings with verification badges orbiting
 * between them. Rings rotate slowly at different rates. Badge markers pulse
 * at verification positions. Monochrome only.
 */

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from '@/lib/palette';

const ACCENT = new THREE.Color(PALETTE.accent);
const STEEL = new THREE.Color(PALETTE.steel);

const RINGS = [
  { radius: 0.5, segments: 96, speed: 0.03, opacity: 0.6 },
  { radius: 0.38, segments: 80, speed: -0.04, opacity: 0.45 },
  { radius: 0.26, segments: 64, speed: 0.05, opacity: 0.35 },
];

// Badge positions at verification points on rings
const BADGES = [
  { ringIdx: 0, angle: 0.3 },
  { ringIdx: 1, angle: 2.1 },
  { ringIdx: 2, angle: 4.5 },
];

function CredentialRings({ frozen }: { frozen: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const accRef = useRef(0);
  const { invalidate } = useThree();

  const ringGeoms = useMemo(() =>
    RINGS.map(r => new THREE.TorusGeometry(r.radius, 0.006, 16, r.segments)),
  []);
  const ringMats = useMemo(() =>
    RINGS.map(() => new THREE.MeshBasicMaterial({ color: STEEL, transparent: true, toneMapped: false })),
  []);
  const badgeGeom = useMemo(() => new THREE.TorusGeometry(0.022, 0.006, 8, 16), []);
  const badgeMat = useMemo(() =>
    new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.9, toneMapped: false }),
  []);

  useFrame((_, dt) => {
    if (frozen || !groupRef.current) return;
    accRef.current += dt;
    if (accRef.current < 1.0 / 20.0) return;
    const t = performance.now() * 0.001;
    // Rotate each ring
    groupRef.current.children.forEach((child) => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.TorusGeometry) {
        const idx = ringGeoms.indexOf(child.geometry as THREE.TorusGeometry);
        if (idx >= 0) child.rotation.z += RINGS[idx].speed * 2;
      }
    });
    // Pulse badges
    const pulse = 1 + Math.sin(t * 3) * 0.15;
    BADGES.forEach((_, i) => {
      const badgeGroup = groupRef.current?.children[ringGeoms.length + i];
      if (badgeGroup instanceof THREE.Group) {
        const mesh = badgeGroup.children[0] as THREE.Mesh;
        if (mesh?.material instanceof THREE.MeshBasicMaterial) {
          mesh.material.opacity = 0.7 + Math.sin(t * 4 + i * 1.2) * 0.3;
        }
        badgeGroup.scale.setScalar(pulse);
      }
    });
    accRef.current = 0;
    invalidate();
  });

  return (
    <group ref={groupRef}>
      {ringGeoms.map((geom, i) => (
        <mesh key={`r-${i}`} geometry={geom} material={ringMats[i]} />
      ))}
      {BADGES.map((badge, i) => {
        const r = RINGS[badge.ringIdx].radius;
        const x = Math.cos(badge.angle) * r;
        const y = Math.sin(badge.angle) * r;
        return (
          <group key={`b-${i}`} position={[x, y, 0.01]}>
            <mesh geometry={badgeGeom} material={badgeMat} />
          </group>
        );
      })}
      {/* Center shield */}
      <mesh position={[0, 0, -0.01]}>
        <circleGeometry args={[0.1, 32]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.12} toneMapped={false} />
      </mesh>
    </group>
  );
}

function PosterFallback() {
  return (
    <svg viewBox="0 0 260 160" className="skill-viz-poster" role="img" aria-label="Credential rings (static)">
      {[0.48, 0.36, 0.26].map((r, i) => (
        <circle key={i} cx="130" cy="80" r={r * 130} fill="none" stroke="var(--steel)" strokeWidth="0.7" opacity={0.6 - i * 0.15} />
      ))}
      {[0.3, 2.1, 4.5].map((angle, i) => {
        const r = [0.48, 0.36, 0.26][i] * 130;
        return <circle key={`b-${i}`} cx={130 + Math.cos(angle) * r} cy={80 + Math.sin(angle) * r} r="3" fill="var(--accent)" opacity="0.8" />;
      })}
      <circle cx="130" cy="80" r="10" fill="var(--accent)" opacity="0.1" />
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

export default function SkillVizCertifications() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef);

  return (
    <div
      ref={containerRef}
      className="skill-viz skill-viz--certifications"
      data-testid="skill-viz-certifications"
      aria-hidden="true"
      style={{ width: 260, height: 160, position: 'relative', overflow: 'hidden', borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}
    >
      {inView ? (
        <Canvas
          camera={{ position: [0, 0, 1.2], fov: 45 }}
          gl={{ antialias: false, alpha: true, preserveDrawingBuffer: false }}
          dpr={[1, 1]}
          frameloop="demand"
          style={{ width: 260, height: 160 }}
        >
          <CredentialRings frozen={false} />
        </Canvas>
      ) : (
        <PosterFallback />
      )}
    </div>
  );
}
