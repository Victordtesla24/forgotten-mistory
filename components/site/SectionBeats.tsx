'use client';

import { useEffect } from 'react';

/**
 * SectionBeats — the Marvel title-sequence "beat" (overhaul INC2).
 *
 * Reveals each `.beat` section once as it scrolls into view: a monochrome
 * letterbox curtain (top+bottom bars) retracts to unveil the content. The CSS
 * (globals.css `.beat`) is gated behind `data-beats-armed` on <html> so that if
 * this JS never runs the sections render fully open — progressive enhancement,
 * never a hidden-content trap. Fire-once (unobserve after first reveal) so a
 * section never re-curtains on scroll-back.
 */
export default function SectionBeats() {
  useEffect(() => {
    const root = document.documentElement;
    const beats = Array.from(document.querySelectorAll<HTMLElement>('.beat'));
    if (!beats.length) return;

    root.setAttribute('data-beats-armed', 'true');
    const reveal = (el: HTMLElement) => el.setAttribute('data-inview', 'true');

    // No IntersectionObserver (or reduced-motion is handled purely in CSS): reveal all.
    if (!('IntersectionObserver' in window)) {
      beats.forEach(reveal);
      return () => root.removeAttribute('data-beats-armed');
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal(entry.target as HTMLElement);
            io.unobserve(entry.target);
          }
        }
      },
      // threshold 0 → reveal the moment any part of the section enters; the negative
      // bottom margin fires it slightly before full entry so the curtain retract reads
      // as the section arrives (deterministic regardless of section height/scroll speed).
      { threshold: 0, rootMargin: '0px 0px -10% 0px' },
    );
    beats.forEach((b) => io.observe(b));

    return () => {
      io.disconnect();
      root.removeAttribute('data-beats-armed');
    };
  }, []);

  return null;
}
