'use client';

import { useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * CardDepth — multi-tier pointer parallax for the hero outcome cards. A spring
 * (per-card, velocity-integrated) eases the normalised pointer offset toward its
 * target so the layers drift with inertia instead of snapping. It writes:
 *   --card-px / --card-py  normalised pointer offset (−0.5…0.5) the CSS maps onto
 *                          three depth tiers (icon lifts most, shell least);
 *   --card-depth           overall tilt magnitude (drives the lit edge);
 *   --card-lift            shadow depth in px (closer card → deeper shadow).
 * Composes with CursorGlow's --rx/--ry/--tx/--ty (which own the card's own
 * transform); these vars drive the inner tiers + shadow only, so the gestures
 * never fight. Gated on (prefers-reduced-motion: reduce) and (pointer: fine);
 * under reduced motion no depth vars are ever written.
 */
export default function CardDepth() {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(pointer: fine)');
    if (prefersReducedMotion || reduceMQ.matches || !finePointer.matches) return;

    const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-outcome-card]'));
    if (!cards.length) return;

    // Discrete spring: each value integrates velocity toward its target. STIFF/DAMP
    // tuned for a quick, near-critically-damped settle (a hair of inertia, no jitter).
    const STIFF = 0.14;
    const DAMP = 0.72;
    type Axis = { v: number; t: number; vel: number };
    const mk = (): Axis => ({ v: 0, t: 0, vel: 0 });
    const state = cards.map(() => ({ px: mk(), py: mk(), depth: mk() }));

    let raf = 0;
    const settled = (a: Axis) => Math.abs(a.t - a.v) < 0.0008 && Math.abs(a.vel) < 0.0008;
    const integrate = (a: Axis) => {
      a.vel += (a.t - a.v) * STIFF;
      a.vel *= DAMP;
      a.v += a.vel;
    };

    const frame = () => {
      let active = false;
      for (let i = 0; i < cards.length; i += 1) {
        const card = cards[i];
        const s = state[i];
        integrate(s.px);
        integrate(s.py);
        integrate(s.depth);
        card.style.setProperty('--card-px', s.px.v.toFixed(4));
        card.style.setProperty('--card-py', s.py.v.toFixed(4));
        card.style.setProperty('--card-depth', s.depth.v.toFixed(4));
        card.style.setProperty('--card-lift', `${(Math.abs(s.depth.v) * 26).toFixed(2)}px`);
        if (!(settled(s.px) && settled(s.py) && settled(s.depth))) active = true;
      }
      raf = active ? requestAnimationFrame(frame) : 0;
    };
    const ensureFrame = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      for (let i = 0; i < cards.length; i += 1) {
        const rect = cards[i].getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;
        const inside = nx >= -0.12 && nx <= 1.12 && ny >= -0.12 && ny <= 1.12;
        const s = state[i];
        if (inside) {
          s.px.t = nx - 0.5;
          s.py.t = ny - 0.5;
          s.depth.t = (nx - 0.5) * (ny - 0.5);
        } else {
          s.px.t = 0;
          s.py.t = 0;
          s.depth.t = 0;
        }
      }
      ensureFrame();
    };

    const onLeave = () => {
      for (const s of state) {
        s.px.t = 0;
        s.py.t = 0;
        s.depth.t = 0;
      }
      ensureFrame();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
      for (const card of cards) {
        card.style.removeProperty('--card-px');
        card.style.removeProperty('--card-py');
        card.style.removeProperty('--card-depth');
        card.style.removeProperty('--card-lift');
      }
    };
  }, [prefersReducedMotion]);

  return null;
}
