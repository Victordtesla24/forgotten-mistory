'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

interface DetailMaterializeProps {
  origin: { x: number; y: number };
  color: string;
}

/** Hex → "r, g, b" channel triple (kept local so no lib import needed). */
const rgbTriple = (hex: string): string => {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return `${parseInt(n.slice(0, 2), 16)}, ${parseInt(n.slice(2, 4), 16)}, ${parseInt(n.slice(4, 6), 16)}`;
};

/** Deterministic PRNG (mulberry32). */
const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const PARTICLE_COUNT = 120;
const MATERIALIZE_MS = 900;

/**
 * DetailMaterialize — self-contained convergence canvas that replaces the old
 * MaterializeCanvas. Monochrome particles stream from the originating card
 * toward the viewport centre, brightest mid-flight, fading as they merge.
 * The canvas is viewport-fixed and torn down on unmount / motion reduction.
 */
export default function DetailMaterialize({ origin, color }: DetailMaterializeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let width = window.innerWidth;
    let height = window.innerHeight;
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const rgb = rgbTriple(color);

    // Pre-render one sprite
    const sprite = document.createElement('canvas');
    sprite.width = 64;
    sprite.height = 64;
    const sctx = sprite.getContext('2d');
    if (sctx) {
      const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, `rgba(${rgb}, 1)`);
      grad.addColorStop(0.3, `rgba(${rgb}, 0.6)`);
      grad.addColorStop(1, `rgba(${rgb}, 0)`);
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 64, 64);
    }

    const rand = mulberry32(0x7e57ab1f);
    const sx = new Float32Array(PARTICLE_COUNT);
    const sy = new Float32Array(PARTICLE_COUNT);
    const bx = new Float32Array(PARTICLE_COUNT); // burst control point (outward from origin)
    const by = new Float32Array(PARTICLE_COUNT);
    const tx = new Float32Array(PARTICLE_COUNT);
    const ty = new Float32Array(PARTICLE_COUNT);
    const ph = new Float32Array(PARTICLE_COUNT);
    const sz = new Float32Array(PARTICLE_COUNT);

    const cx = width / 2;
    const cy = height / 2;
    const frameR = Math.min(width, height) * 0.28;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const a0 = rand() * Math.PI * 2;
      const spread = 70 + rand() * 240;
      sx[i] = origin.x + Math.cos(a0) * spread * (0.3 + rand());
      sy[i] = origin.y + Math.sin(a0) * spread * (0.3 + rand());
      // Burst point: flung further outward along the spawn bearing before it reverses.
      bx[i] = origin.x + Math.cos(a0) * spread * (1.3 + rand() * 0.6);
      by[i] = origin.y + Math.sin(a0) * spread * (1.3 + rand() * 0.6);
      const a1 = rand() * Math.PI * 2;
      const rr = frameR * (0.65 + rand() * 0.55);
      tx[i] = cx + Math.cos(a1) * rr;
      ty[i] = cy + Math.sin(a1) * rr * 0.6;
      ph[i] = rand() * 0.22;
      sz[i] = 0.7 + rand() * 1.8;
    }

    // Three phases per particle: BURST outward, CONVERGE toward the panel centre,
    // then SETTLE (fade) as they merge. Speeds vary per particle via `ph` + easing.
    const BURST_END = 0.3;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    let raf = 0;
    let alive = true;
    let start = 0;

    const step = (now: number) => {
      if (!alive) return;
      if (start === 0) start = now;
      const g = Math.min(1, (now - start) / MATERIALIZE_MS);
      ctx.clearRect(0, 0, width, height);
      if (g >= 1) {
        alive = false;
        return;
      }
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const local = Math.max(0, Math.min(1, (g - ph[i]) / (1 - ph[i])));
        let x: number;
        let y: number;
        if (local < BURST_END) {
          // BURST — fling outward along the spawn bearing.
          const t = easeOutCubic(local / BURST_END);
          x = sx[i] + (bx[i] - sx[i]) * t;
          y = sy[i] + (by[i] - sy[i]) * t;
        } else {
          // CONVERGE — reverse and stream toward the panel centre.
          const t = easeInOutCubic((local - BURST_END) / (1 - BURST_END));
          x = bx[i] + (tx[i] - bx[i]) * t;
          y = by[i] + (ty[i] - by[i]) * t;
        }
        // SETTLE — brighten mid-flight, fade as the particle merges into the panel.
        const alpha = Math.sin(local * Math.PI) * 0.55;
        if (alpha <= 0.01) continue;
        const s = sz[i] * (10 - 3 * easeOutCubic(local));
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, x - s / 2, y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      // Restore the default blend so the additive 'lighter' pass never leaks into any
      // other 2-D context drawing that may share this canvas's compositor state.
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    window.addEventListener('resize', resize);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      ctx.clearRect(0, 0, width, height);
    };
  }, [origin, color, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      data-detail-canvas=""
      aria-hidden="true"
      className="detail-materialize"
    />
  );
}
