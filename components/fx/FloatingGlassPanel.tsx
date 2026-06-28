'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { PALETTE } from '@/lib/palette';

/**
 * FloatingGlassPanel — a self-contained R3F glass-refraction plane with
 * pointer-driven tilt physics.  Rendered as a transparent overlay inside the
 * FloatingDetailBox dialog.  Damped-spring tilt (no physics engine), depth-aware
 * shadow, and MeshTransmissionMaterial for glass refraction.
 *
 * Self-contained per dialog instance (no shared SpaceScene).  Torn down on
 * unmount.  Monochrome only (palette-sourced).  Renders nothing under reduced
 * motion.
 */

const MAX_TILT_DEG = 8;
const SPRING = 0.15; // damped-spring lerp factor — tuned for ~200ms settle
const PANEL_WIDTH = 2.4;
const PANEL_HEIGHT = 1.6;
const CAM_Z = 2.0;

/* ─── convert palette hex → THREE.Color ─── */
const hexColor = (hex: string): THREE.Color =>
  new THREE.Color(
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  );

/* ─── Clamp a value into [-limit, limit] ─── */
const clamp = (v: number, limit: number): number =>
  Math.max(-limit, Math.min(limit, v));

function GlassPlane({ colorHex }: { colorHex: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentTilt = useRef(new THREE.Vector2(0, 0));
  const targetTilt = useRef(new THREE.Vector2(0, 0));
  const glassEl = useRef<HTMLElement | null>(null);
  const { invalidate } = useThree();
  const invRef = useRef(invalidate);
  invRef.current = invalidate;

  // Kick the demand loop on mount.
  useEffect(() => {
    invalidate();
  }, [invalidate]);

  // Mouse handler: compute desired tilt + write CSS custom props immediately.
  const onPointer = useCallback((e: MouseEvent) => {
    const el = glassEl.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const hw = rect.width / 2;
    const hh = rect.height / 2;
    const rx = clamp(((e.clientY - (rect.top + hh)) / hh) * MAX_TILT_DEG, MAX_TILT_DEG);
    const ry = clamp(((e.clientX - (rect.left + hw)) / hw) * -MAX_TILT_DEG, MAX_TILT_DEG);
    targetTilt.current.set(rx, ry);
    el.style.setProperty('--tilt-x', rx.toFixed(2));
    el.style.setProperty('--tilt-y', ry.toFixed(2));
    // Kick the demand loop so useFrame lerps the mesh rotation.
    invRef.current();
  }, []);

  useEffect(() => {
    const el = document.querySelector('[data-detail-glass]') as HTMLElement | null;
    if (!el) return;
    glassEl.current = el;

    document.addEventListener('mousemove', onPointer, { passive: true });
    return () => {
      document.removeEventListener('mousemove', onPointer);
    };
  }, [onPointer]);

  useFrame(() => {
    const c = currentTilt.current;
    const t = targetTilt.current;
    const dx = t.x - c.x;
    const dy = t.y - c.y;
    c.x += dx * SPRING;
    c.y += dy * SPRING;
    if (meshRef.current) {
      meshRef.current.rotation.x = THREE.MathUtils.degToRad(c.x);
      meshRef.current.rotation.y = THREE.MathUtils.degToRad(c.y);
    }
    // Keep the demand loop alive while tilt is in motion.
    if (Math.abs(dx) > 0.005 || Math.abs(dy) > 0.005) {
      invalidate();
    }
  });

  const tint = hexColor(colorHex);

  return (
    <group>
      {/* Glass-refraction plane */}
      <mesh ref={meshRef}>
        <planeGeometry args={[PANEL_WIDTH, PANEL_HEIGHT]} />
        <MeshTransmissionMaterial
          background={hexColor(PALETTE.ink900)}
          transmission={0.95}
          thickness={0.4}
          roughness={0.05}
          ior={1.5}
          chromaticAberration={0.06}
          anisotropy={0.2}
          distortion={0.15}
          distortionScale={0.2}
          temporalDistortion={0.05}
          color={tint}
          metalness={0.0}
        />
      </mesh>

      {/* Contact shadow beneath the panel */}
      <mesh
        position={[0, -PANEL_HEIGHT / 2 - 0.05, -0.02]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[PANEL_WIDTH * 1.15, PANEL_HEIGHT * 0.3]} />
        <meshBasicMaterial
          color={PALETTE.black}
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

interface FloatingGlassPanelProps {
  color: string;
  reduced: boolean;
}

export default React.memo(function FloatingGlassPanel({ color, reduced }: FloatingGlassPanelProps) {
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (reduced || !mounted) return null;

  const dpr = typeof window !== 'undefined' ? Math.min(1.5, window.devicePixelRatio) : 1;

  return (
    <div
      ref={wrapRef}
      data-detail-glass=""
      data-gl="webgl"
      data-detail-fx="r5-glass"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: true,
          depth: true,
        }}
        dpr={dpr}
        frameloop="demand"
        camera={{ position: [0, 0, CAM_Z], fov: 50, near: 0.1, far: 20 }}
        style={{ display: 'block', width: '100%', height: '100%' }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          wrapRef.current?.setAttribute('data-gl', 'webgl');
        }}
      >
        <GlassPlane colorHex={color} />
      </Canvas>
    </div>
  );
});
