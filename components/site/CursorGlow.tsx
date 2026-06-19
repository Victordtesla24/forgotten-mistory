'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';

/**
 * Custom cursor system: a dot + trailing outline + a contextual text label, a
 * default→hover→click→drag state machine (mirrored onto `body[data-cursor-state]`
 * so CSS can restyle the cursor per state), and magnetic hover zones that pull
 * toward the pointer via `--mag-x` / `--mag-y`. It ALSO drives the hero floating-
 * panel depth parallax (--rx/--ry/--tx/--ty/--mouse-x/--mouse-y).
 *
 * Only activates on fine-pointer devices when the user has not requested reduced
 * motion; otherwise renders nothing, sets no state attribute, and the native
 * cursor is used.
 */
const INTERACTIVE = 'a, button, [role="button"], [data-magnetic], summary, input, textarea, select, label';

export default function CursorGlow() {
  // SSR-safe: returns false on the server AND the client's first paint, so the
  // initial render matches the server HTML (the cursor nodes are emitted in both),
  // then resolves to the real preference after mount. A raw useReducedMotion() here
  // returned the divs on the server but null on a reduced-motion client's first
  // render — a hard hydration mismatch (#418/#423). See lib/useReducedMotionSafe.
  const prefersReducedMotion = useReducedMotionSafe();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const outlineX = useSpring(x, { stiffness: 260, damping: 28, mass: 0.6 });
  const outlineY = useSpring(y, { stiffness: 260, damping: 28, mass: 0.6 });
  const labelX = useSpring(x, { stiffness: 320, damping: 30, mass: 0.5 });
  const labelY = useSpring(y, { stiffness: 320, damping: 30, mass: 0.5 });
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Gate on a live matchMedia read (not only framer's hook) so emulated /
    // late-applied reduced-motion preferences reliably disable the driver.
    const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(pointer: fine)');
    if (prefersReducedMotion || reduceMQ.matches || !finePointer.matches) return;

    const body = document.body;
    body.classList.add('cursor-enhanced');
    const setState = (s: 'default' | 'hover' | 'click' | 'drag') => {
      body.dataset.cursorState = s;
    };
    setState('default');

    // The hero "floating panels" share one depth-parallax driver: the hovered
    // surface gets a cursor spotlight (--mouse-x/--mouse-y), a normalised tilt
    // (--rx/--ry ∈ [-0.5, 0.5]) and a subtle magnetic offset (--tx/--ty). CSS maps
    // those to perspective rotation + translation. Resetting on surface change keeps
    // a panel from staying tilted after the pointer leaves it.
    const DEPTH_TARGETS = '.meta-card, .skill-card, .project-card, .repo-card, .telemetry-panel';
    let activeSurface: HTMLElement | null = null;
    // Rect cached at the moment the pointer enters a surface, measured while the
    // surface is at rest. Reusing it avoids a feedback loop where reading the
    // already-transformed rect would drag the normalised pointer toward centre.
    let activeRect: DOMRect | null = null;
    const resetDepth = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.setProperty('--rx', '0');
      el.style.setProperty('--ry', '0');
      el.style.setProperty('--tx', '0px');
      el.style.setProperty('--ty', '0px');
    };

    // ── Magnetic zones ──────────────────────────────────────────────────────
    let activeMagnetic: HTMLElement | null = null;
    let magRect: DOMRect | null = null;
    const resetMagnetic = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.setProperty('--mag-x', '0px');
      el.style.setProperty('--mag-y', '0px');
    };
    const setLabel = (text: string) => {
      const el = labelRef.current;
      if (!el) return;
      el.textContent = text;
      el.dataset.show = text ? 'true' : 'false';
    };

    // ── State machine ───────────────────────────────────────────────────────
    let down = false;
    let movedWhileDown = false;
    const evaluateRestState = (target: Element | null) => {
      setState(target?.closest(INTERACTIVE) ? 'hover' : 'default');
    };

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const target = e.target as Element | null;

      // Depth parallax for the hero/skill surfaces.
      const surface = target?.closest?.(DEPTH_TARGETS) as HTMLElement | null;
      if (surface !== activeSurface) {
        resetDepth(activeSurface);
        activeSurface = surface;
        if (surface) {
          resetDepth(surface);
          activeRect = surface.getBoundingClientRect();
        } else {
          activeRect = null;
        }
      }
      if (surface && activeRect && activeRect.width > 0 && activeRect.height > 0) {
        const nx = (e.clientX - activeRect.left) / activeRect.width; // 0..1
        const ny = (e.clientY - activeRect.top) / activeRect.height; // 0..1
        surface.style.setProperty('--mouse-x', `${e.clientX - activeRect.left}px`);
        surface.style.setProperty('--mouse-y', `${e.clientY - activeRect.top}px`);
        surface.style.setProperty('--rx', (nx - 0.5).toFixed(3));
        surface.style.setProperty('--ry', (ny - 0.5).toFixed(3));
        surface.style.setProperty('--tx', `${((nx - 0.5) * 10).toFixed(1)}px`);
        surface.style.setProperty('--ty', `${((ny - 0.5) * 10).toFixed(1)}px`);
      }

      // Magnetic pull toward the pointer for any [data-magnetic] zone.
      const magnetic = target?.closest?.('[data-magnetic]') as HTMLElement | null;
      if (magnetic !== activeMagnetic) {
        resetMagnetic(activeMagnetic);
        activeMagnetic = magnetic;
        magRect = magnetic ? magnetic.getBoundingClientRect() : null;
        setLabel(
          magnetic
            ? magnetic.getAttribute('data-cursor-label') || magnetic.textContent?.trim() || 'Open'
            : '',
        );
      }
      if (magnetic && magRect) {
        const cx = magRect.left + magRect.width / 2;
        const cy = magRect.top + magRect.height / 2;
        magnetic.style.setProperty('--mag-x', `${((e.clientX - cx) * 0.32).toFixed(1)}px`);
        magnetic.style.setProperty('--mag-y', `${((e.clientY - cy) * 0.32).toFixed(1)}px`);
      }

      // State machine: dragging takes over once the pointer moves with a button held.
      if (down) {
        movedWhileDown = true;
        setState('drag');
      } else {
        evaluateRestState(target);
      }
    };

    const onDown = () => {
      down = true;
      movedWhileDown = false;
      setState('click');
    };
    const onUp = (e: PointerEvent) => {
      down = false;
      movedWhileDown = false;
      evaluateRestState(document.elementFromPoint(e.clientX, e.clientY));
    };
    const onLeaveWindow = () => {
      resetDepth(activeSurface);
      resetMagnetic(activeMagnetic);
      activeSurface = null;
      activeMagnetic = null;
      setLabel('');
      setState('default');
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('pointerleave', onLeaveWindow);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeaveWindow);
      resetDepth(activeSurface);
      resetMagnetic(activeMagnetic);
      delete body.dataset.cursorState;
      body.classList.remove('cursor-enhanced');
    };
  }, [prefersReducedMotion, x, y]);

  if (prefersReducedMotion) return null;

  return (
    <>
      <motion.div
        className="cursor-dot"
        aria-hidden="true"
        style={{ x, y, translateX: '-50%', translateY: '-50%' }}
      />
      <motion.div
        className="cursor-outline"
        aria-hidden="true"
        style={{ x: outlineX, y: outlineY, translateX: '-50%', translateY: '-50%' }}
      />
      <motion.div
        ref={labelRef}
        className="cursor-label"
        aria-hidden="true"
        data-show="false"
        style={{ x: labelX, y: labelY }}
      />
    </>
  );
}
