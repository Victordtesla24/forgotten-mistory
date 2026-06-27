'use client';

/**
 * CelestialSphere — R3F signature scene for the Jyotish/astro cluster
 * (btr-demo, jyotish-shastra, Birth-Time-Rectifier — SPEC §7 #8).
 *
 * A monochrome celestial sphere with orbital trails rendered by the
 * custom `celestialOrbit` fragment shader. Slow, contemplative motion
 * suited to the ancient-astronomy↔modern-AI narrative.
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
import { celestialOrbitFragment, celestialOrbitVertex } from './shaders/celestialOrbit.glsl';

// ── Résumé-sourced real data (R3 — NEVER random) ──
// From siteContent.ts featuredRepos: the astro cluster consists of 3 repos
const ASTRO_REPO_COUNT = 3;
const ASTRO_REPO_NAMES = 'btr-demo · jyotish-shastra · Birth-Time-Rectifier';

const STEEL = new THREE.Color(PALETTE.steel);

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

function OrbitPlane({ frozen }: { frozen: boolean }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const accRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOrbitSpeed: { value: 0.7 },
      uColorSteel: { value: STEEL.clone() },
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
      <planeGeometry args={[2.8, 2.8]} />
      <shaderMaterial
        ref={matRef}
        args={[{
          uniforms,
          vertexShader: celestialOrbitVertex,
          fragmentShader: celestialOrbitFragment,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }]}
      />
    </mesh>
  );
}

/** Central sphere — a dark globe with a subtle rim light for depth. */
function CentralSphere({ frozen }: { frozen: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    if (frozen || !meshRef.current) return;
    meshRef.current.rotation.y += dt * 0.08;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.22, 48, 48]} />
      <meshStandardMaterial
        color={PALETTE.ink800}
        roughness={0.85}
        metalness={0.05}
        emissive={PALETTE.steel}
        emissiveIntensity={0.15}
      />
    </mesh>
  );
}

/** Additional subtle orbit ring meshes for depth (beyond the shader plane). */
function OrbitRings({ frozen }: { frozen: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    if (frozen || !groupRef.current) return;
    groupRef.current.rotation.z += dt * 0.04;
  });

  const rings = useMemo<THREE.RingGeometry[]>(() =>
    [0.32, 0.48, 0.64].map((radius) =>
      new THREE.RingGeometry(radius - 0.003, radius + 0.003, 128),
    ), [],
  );

  return (
    <group ref={groupRef}>
      {rings.map((geom, i) => (
        <mesh key={i} geometry={geom} rotation={[Math.PI / 2 + i * 0.25, i * 0.3, 0]}>
          <meshBasicMaterial color={STEEL} transparent opacity={0.15 - i * 0.04} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ frozen }: { frozen: boolean }) {
  return (
    <group>
      <OrbitPlane frozen={frozen} />
      <CentralSphere frozen={frozen} />
      <OrbitRings frozen={frozen} />
    </group>
  );
}

// ── Poster fallback (static, rendered when reduced-motion / WebGL fail) ──
function PosterFallback() {
  return (
    <div className="cs-poster" aria-label="Celestial sphere (static)">
      <svg viewBox="0 0 200 200" className="cs-poster-svg" role="img">
        <circle cx="100" cy="100" r="18" fill="var(--ink-800)" stroke="var(--steel)" strokeWidth="1" />
        {[0.35, 0.52, 0.69].map((r, i) => (
          <ellipse
            key={i}
            cx="100" cy="100"
            rx={r * 100}
            ry={r * 100 * (0.5 + i * 0.15)}
            fill="none"
            stroke="var(--steel)"
            strokeWidth="0.6"
            opacity={0.35 - i * 0.1}
            transform={`rotate(${i * 22}, 100, 100)`}
          />
        ))}
        {/* Star motes */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const r = 55 + (i % 3) * 18;
          const cx = 100 + Math.cos(angle) * r;
          const cy = 100 + Math.sin(angle) * r * 0.6;
          return <circle key={`s-${i}`} cx={cx} cy={cy} r="1" fill="var(--steel)" opacity="0.5" />;
        })}
      </svg>
      <div className="cs-readout-static">
        <span>{ASTRO_REPO_COUNT} astro repos</span>
        <span className="cs-sep">·</span>
        <span>Vedic astronomy × AI/ML</span>
      </div>
    </div>
  );
}

// ── Component ──

interface CelestialSphereProps {
  className?: string;
}

export default function CelestialSphere({ className = '' }: CelestialSphereProps) {
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
      data-testid="celestial-sphere"
      {...(frozen ? { 'data-frozen': 'true' } : {})}
    >
      {frozen ? (
        <PosterFallback />
      ) : (
        <>
          <Canvas
            camera={{ position: [0, 0, 2.5], fov: 45 }}
            gl={{ antialias: false, alpha: true, preserveDrawingBuffer: false }}
            dpr={[1, 1.5]}
            frameloop={frozen ? 'demand' : 'always'}
            onError={handleCanvasError}
            onCreated={() => setWebglError(false)}
          >
            <Scene frozen={frozen} />
            <EffectComposer>
              <Bloom intensity={0.35} luminanceThreshold={0.25} luminanceSmoothing={0.2} mipmapBlur />
              <Vignette eskil={false} offset={0.25} darkness={0.7} />
            </EffectComposer>
          </Canvas>
          {/* DOM overlay — text OUT of bloom */}
          <div className="cs-readout" aria-hidden="true">
            <span>{ASTRO_REPO_COUNT} astro repos</span>
            <span className="cs-sep">·</span>
            <span>Vedic astronomy × AI/ML</span>
          </div>
        </>
      )}
      <style jsx>{`
        div[data-testid="celestial-sphere"] {
          width: 100%;
          max-width: 340px;
          aspect-ratio: 1 / 1;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          position: relative;
          overflow: hidden;
        }
        .cs-readout {
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
        .cs-sep {
          opacity: 0.5;
        }
        .cs-poster {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
        }
        .cs-poster-svg {
          width: 80%;
          max-width: 180px;
          height: auto;
        }
        .cs-readout-static {
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
