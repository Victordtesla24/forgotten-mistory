'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { PALETTE } from '@/lib/palette';

/**
 * PanelDepthScene — 3D depth backdrop for the TelemetryPanel.
 * Renders a subtle canvas-based volumetric layer behind panel content
 * using monochrome particles that drift slowly. Purely decorative;
 * pointer-events: none so it doesn't interfere with interactions.
 */
export default function PanelDepthScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let width = 0;
    let height = 0;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const PARTICLE_COUNT = 20;
    const positions = new Float32Array(PARTICLE_COUNT * 2);
    const speeds = new Float32Array(PARTICLE_COUNT * 2);
    const opacities = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 2] = Math.random() * width;
      positions[i * 2 + 1] = Math.random() * height;
      speeds[i * 2] = (Math.random() - 0.5) * 0.3;
      speeds[i * 2 + 1] = (Math.random() - 0.5) * 0.3;
      opacities[i] = 0.03 + Math.random() * 0.07;
    }

    let raf = 0;
    let alive = true;
    const step = () => {
      if (!alive) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = PALETTE.white;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x = positions[i * 2];
        const y = positions[i * 2 + 1];
        ctx.globalAlpha = opacities[i];
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
        positions[i * 2] = (positions[i * 2] + speeds[i * 2] + width) % width;
        positions[i * 2 + 1] = (positions[i * 2 + 1] + speeds[i * 2 + 1] + height) % height;
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    const resizeObserver = new ResizeObserver(() => resize());
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="telemetry-depth"
      aria-hidden="true"
    />
  );
}
