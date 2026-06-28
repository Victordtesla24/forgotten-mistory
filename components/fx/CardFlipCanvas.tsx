'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { cardFlipVertex, cardFlipFragment } from '@/components/fx/shaders/cardFlip.glsl';
import { PALETTE } from '@/lib/palette';

/**
 * CardFlipCanvas — self-contained R3F overlay that renders a 3D page-turn
 * card-flip effect behind the accessible accordion content. A single plane
 * swings into view from left-hinge edge-on (-90°) to flat (0°), driven by
 * a 0→1 progress animation over FLIP_MS duration.
 *
 * Fully self-contained and camera-independent: a fresh Canvas per accordion
 * item instance, torn down on unmount. The overlay is transparent so the DOM
 * content (bullets, aria semantics) shows through on top.
 *
 * Perf: single plane, demand frameloop, DPR capped, no postprocessing,
 * palette-sourced uniforms only (monochrome). Renders only when active;
 * idle loop is paused.
 *
 * prefers-reduced-motion: the parent ExperienceAccordion handles this — when
 * reduced-motion is set, this component receives active=false immediately
 * without animation, so it never renders the flip.
 */

const FLIP_MS = 500;
const CAM_Z = 2.4;

const hexToVec3 = (hex: string): THREE.Vector3 =>
  new THREE.Vector3(
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  );

interface CardFlipCanvasProps {
  active: boolean;
  /** Accordion content element for size measurement */
  containerEl: HTMLDivElement | null;
}

function FlipPlane({
  containerEl,
  active,
}: {
  containerEl: HTMLDivElement | null;
  active: boolean;
}) {
  const [ready, setReady] = useState(false);
  const startTime = useRef(0);
  const meshRef = useRef<THREE.Mesh>(null!);
  const { invalidate, size, viewport } = useThree();

  // Recalculate plane scale based on container pixel dimensions
  const planeScale = useMemo(() => {
    if (!containerEl) return { sx: 1, sy: 1 };
    const rect = containerEl.getBoundingClientRect();
    // Convert pixel dimensions to world units based on current viewport.
    // PlaneGeometry(2,2) spans [-1,1] in XY, so scaling by w/2, h/2 covers
    // the full rect in world space.
    const w = (rect.width / size.width) * viewport.width;
    const h = (rect.height / size.height) * viewport.height;
    return { sx: Math.max(w / 2, 0.005), sy: Math.max(h / 2, 0.005) };
  }, [containerEl, size, viewport]);

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uColor: { value: hexToVec3(PALETTE.ink700) },
      uOpacity: { value: 1.0 },
    }),
    [],
  );

  // Fixed 2x2 plane — the shader hinge at x=-1 is correct for this geometry.
  const geometry = useMemo(() => new THREE.PlaneGeometry(2, 2, 1, 1), []);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  // Start timing when activated
  useEffect(() => {
    if (active) {
      startTime.current = performance.now();
      setReady(true);
      invalidate();
    } else {
      setReady(false);
      uniforms.uProgress.value = 0;
    }
  }, [active, invalidate, uniforms]);

  useFrame(() => {
    if (!active || !ready) return;
    const elapsed = (performance.now() - startTime.current) / FLIP_MS;
    const progress = Math.min(elapsed, 1.0);
    uniforms.uProgress.value = progress;

    if (progress < 1.0) {
      invalidate();
    }
  });

  if (!active || !ready) return null;

  // Position the mesh so its left edge (hinge at x=-1 before scaling) aligns
  // with the left edge of the viewport's content area.
  // In world space (viewport.width wide, centered at origin), the left edge
  // of the content area is at x = -viewport.width / 2.
  // The mesh center (after scaling) is at origin; its left edge before
  // rotation is at x = -planeScale.sx. To align left edge with viewport
  // left edge: position.x = -viewport.width/2 + planeScale.sx
  const offsetX = -viewport.width / 2 + planeScale.sx;

  return (
    <mesh
      ref={meshRef}
      position={[offsetX, 0, 0]}
      scale={[planeScale.sx, planeScale.sy, 1]}
    >
      <primitive object={geometry} attach="geometry" />
      <shaderMaterial
        vertexShader={cardFlipVertex}
        fragmentShader={cardFlipFragment}
        transparent
        depthWrite={false}
        depthTest={false}
        uniforms={uniforms as unknown as Record<string, THREE.IUniform>}
      />
    </mesh>
  );
}

export default React.memo(function CardFlipCanvas({
  active,
  containerEl,
}: CardFlipCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);

  // When reduced-motion is active, the parent won't trigger animation — this
  // component still renders the Canvas but without the flip, effectively
  // doing a static render.
  if (!active) {
    return null;
  }

  return (
    <div
      ref={wrapRef}
      className="card-flip-overlay"
      data-card-flip=""
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      <Canvas
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: false,
        }}
        dpr={Math.min(
          1.5,
          typeof window !== 'undefined' ? window.devicePixelRatio : 1,
        )}
        frameloop="demand"
        camera={{ position: [0, 0, CAM_Z], fov: 50, near: 0.1, far: 30 }}
        style={{ display: 'block', width: '100%', height: '100%' }}
        onCreated={() =>
          wrapRef.current?.setAttribute('data-gl', 'webgl')
        }
      >
        <FlipPlane containerEl={containerEl} active={active} />
      </Canvas>
    </div>
  );
});
