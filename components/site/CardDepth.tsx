'use client';

import { useEffect } from 'react';
import gsap from 'gsap';

/**
 * CardDepth — System C / hover-effects controller for the hero outcome cards.
 *
 * CursorGlow already writes the pointer tilt (--rx/--ry) and magnetic offset (--tx/--ty).
 * This adds the GSAP-driven hover *timeline*: a real physical Z-lift (--depth → translateZ),
 * parallax inner layers (the icon lifts further than the text), and a hairline edge glow
 * (--edge-glow). One controller mounts once and wires every [data-outcome-card]; the
 * gestures compose in the card's single CSS transform so nothing fights.
 *
 * Reduced-motion: the controller renders nothing and attaches no listeners — the cards
 * stay flat (the global reduced-motion guard also forces transform:none).
 */

const LIFT_PX = 26; // translateZ at full hover — the "physical Z-lift"

export default function CardDepth() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(pointer: fine)');
    if (reduce.matches || !finePointer.matches) return;

    const cards = Array.from(
      document.querySelectorAll<HTMLElement>('[data-outcome-card="true"]'),
    );
    if (cards.length === 0) return;

    const cleanups: Array<() => void> = [];

    for (const card of cards) {
      const state = { depth: 0, glow: 0 };
      const apply = () => {
        card.style.setProperty('--depth', `${state.depth.toFixed(2)}px`);
        card.style.setProperty('--edge-glow', state.glow.toFixed(3));
      };
      const enter = () => {
        gsap.to(state, {
          depth: LIFT_PX,
          glow: 1,
          duration: 0.42,
          ease: 'power3.out',
          overwrite: true,
          onUpdate: apply,
        });
      };
      const leave = () => {
        gsap.to(state, {
          depth: 0,
          glow: 0,
          duration: 0.5,
          ease: 'power2.out',
          overwrite: true,
          onUpdate: apply,
        });
      };

      card.addEventListener('pointerenter', enter);
      card.addEventListener('pointerleave', leave);
      card.addEventListener('focus', enter);
      card.addEventListener('blur', leave);
      cleanups.push(() => {
        card.removeEventListener('pointerenter', enter);
        card.removeEventListener('pointerleave', leave);
        card.removeEventListener('focus', enter);
        card.removeEventListener('blur', leave);
        gsap.killTweensOf(state);
        card.style.removeProperty('--depth');
        card.style.removeProperty('--edge-glow');
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
