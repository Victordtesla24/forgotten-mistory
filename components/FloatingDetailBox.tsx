'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Database, X } from 'lucide-react';
import { resumeContent } from '@/app/data/resumeContent';
import { PALETTE } from '@/lib/palette';

interface FloatingDetailBoxProps {
  activeKey: string | null;
  triggerRect: DOMRect | null;
  onClose: () => void;
  isLocked?: boolean;
}

/**
 * The hero outcome cards open this capability panel. The previous entrance
 * rendered its FX (600 particles + beam + orbiting star) into the SHARED
 * SpaceScene via `window.spaceApp`, positioned from the camera at click-time —
 * so the continuously-drifting `CameraRig` desynchronised the FX from the DOM
 * modal and the orbiting star wandered off-frame (the stray corner orb).
 *
 * This is a SELF-CONTAINED, camera-independent "HUD materialization":
 *   - Framer-Motion FLIP: the panel lifts off the clicked card and floats to centre.
 *   - A dedicated 2-D <canvas> particle convergence bounded to the dialog's
 *     fixed-viewport layer (it cannot leave an off-frame artifact and is torn
 *     down on close).
 *   - CSS HUD corner brackets (×4) + a single scanline sweep.
 *   - Monochrome only (accent sourced from lib/palette.ts).
 *   - Under reduced motion the canvas + sweep are not rendered and the panel
 *     appears instantly centred.
 */

const THEME_COLORS: Record<string, string> = {
  'Test Automation at Scale': PALETTE.steel,
  'Cloud Modernisation': PALETTE.steel,
  'Realtime Reliability': PALETTE.steel,
  'AI Quality & Risk': PALETTE.steel,
  'Leadership Scale': PALETTE.steel,
  'Portfolio Value': PALETTE.accent,
};
const DEFAULT_COLOR = PALETTE.steel;

const CORNERS = ['tl', 'tr', 'br', 'bl'] as const;

/** Hex → "r, g, b" channel triple. lib/palette.ts is the sanctioned home for raw
 *  hex, so converting tokens here keeps components literal-free (audit/eslint). */
const rgbTriple = (hex: string): string => {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return `${parseInt(n.slice(0, 2), 16)}, ${parseInt(n.slice(2, 4), 16)}, ${parseInt(n.slice(4, 6), 16)}`;
};

/** Deterministic PRNG (mulberry32) — keeps the materialization reproducible and
 *  free of Math.random, matching the SpaceScene starfield generator. */
const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const PARTICLE_COUNT = 96;
const MATERIALIZE_MS = 1100;

interface Origin {
  x: number;
  y: number;
}

/**
 * Self-contained convergence: monochrome particles stream from the originating
 * card toward the panel centre and fade as they merge — brightest mid-flight
 * (visible around the forming panel), gone by the time they reach centre. The
 * canvas is viewport-fixed inside the dialog layer, so nothing can escape frame,
 * and the rAF loop self-halts after MATERIALIZE_MS and is cancelled on unmount.
 */
function MaterializeCanvas({ origin }: { origin: Origin }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
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

    // Pre-render one soft white sprite; per-frame we only drawImage (no allocation).
    const sprite = document.createElement('canvas');
    sprite.width = 64;
    sprite.height = 64;
    const sctx = sprite.getContext('2d');
    if (sctx) {
      const whiteRGB = rgbTriple(PALETTE.white);
      const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, `rgba(${whiteRGB}, 1)`);
      grad.addColorStop(0.35, `rgba(${whiteRGB}, 0.5)`);
      grad.addColorStop(1, `rgba(${whiteRGB}, 0)`);
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 64, 64);
    }

    const rand = mulberry32(0x9e3779b1);
    const sx = new Float32Array(PARTICLE_COUNT);
    const sy = new Float32Array(PARTICLE_COUNT);
    const tx = new Float32Array(PARTICLE_COUNT);
    const ty = new Float32Array(PARTICLE_COUNT);
    const ph = new Float32Array(PARTICLE_COUNT);
    const sz = new Float32Array(PARTICLE_COUNT);

    const cx = width / 2;
    const cy = height / 2;
    const frameR = Math.min(width, height) * 0.26;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const a0 = rand() * Math.PI * 2;
      const spread = 60 + rand() * 220;
      sx[i] = origin.x + Math.cos(a0) * spread * (0.4 + rand());
      sy[i] = origin.y + Math.sin(a0) * spread * (0.4 + rand());
      const a1 = rand() * Math.PI * 2;
      const rr = frameR * (0.7 + rand() * 0.5);
      tx[i] = cx + Math.cos(a1) * rr;
      ty[i] = cy + Math.sin(a1) * rr * 0.62;
      ph[i] = rand() * 0.28;
      sz[i] = 0.8 + rand() * 1.6;
    }

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

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
        const e = easeOutCubic(local);
        const x = sx[i] + (tx[i] - sx[i]) * e;
        const y = sy[i] + (ty[i] - sy[i]) * e;
        const alpha = Math.sin(local * Math.PI) * 0.6;
        if (alpha <= 0.01) continue;
        const s = sz[i] * (10 - 3 * e);
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, x - s / 2, y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
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
  }, [origin]);

  return <canvas ref={canvasRef} data-detail-canvas="" aria-hidden="true" className="detail-materialize" />;
}

export default function FloatingDetailBox({ activeKey, triggerRect, onClose, isLocked = false }: FloatingDetailBoxProps) {
  const [displayKey, setDisplayKey] = useState<string | null>(null);
  const reduced = !!useReducedMotion();

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerElRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const isOpen = !!activeKey;

  const content = useMemo(
    () => (displayKey ? resumeContent[displayKey as keyof typeof resumeContent] : null),
    [displayKey],
  );
  const themeColor = useMemo(
    () => (displayKey ? THEME_COLORS[displayKey] ?? DEFAULT_COLOR : DEFAULT_COLOR),
    [displayKey],
  );
  const origin = useMemo<Origin>(() => {
    if (triggerRect) {
      return { x: triggerRect.left + triggerRect.width / 2, y: triggerRect.top + triggerRect.height / 2 };
    }
    if (typeof window !== 'undefined') return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    return { x: 0, y: 0 };
  }, [triggerRect]);

  // Keep the last opened content available so the exit animation can still render.
  useEffect(() => {
    if (activeKey) setDisplayKey(activeKey);
  }, [activeKey]);

  // Dim the background scene while the panel is open (CSS hooks on body.detail-open).
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('detail-open', isOpen);
    return () => {
      document.body.classList.remove('detail-open');
    };
  }, [isOpen]);

  // Focus management: a click/keyboard (locked) open moves focus into the dialog
  // and restores it to the originating card on close. Hover (unlocked) previews
  // never steal focus.
  useEffect(() => {
    if (isOpen && isLocked) {
      triggerElRef.current = (document.activeElement as HTMLElement) ?? null;
      const t = setTimeout(() => closeButtonRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
    if (!isOpen && triggerElRef.current) {
      triggerElRef.current.focus();
      triggerElRef.current = null;
    }
  }, [isOpen, isLocked]);

  // E3 — hologram depth: while the panel is LOCKED open on a fine pointer, the
  // cursor's position relative to the panel centre drives a subtle parallax tilt
  // (written as --panel-rx/--panel-ry; the CSS maps them to a few degrees of
  // rotateX/rotateY on .detail-panel-depth). Custom props don't shadow Framer's
  // `transform`, so the FLIP entrance and this tilt compose cleanly. Inert under
  // reduced motion or coarse pointers; vars are cleared on close so a re-open
  // starts flat.
  useEffect(() => {
    if (!isOpen || !isLocked || reduced) return;
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const panel = panelRef.current;
    if (!panel) return;

    const onMove = (e: PointerEvent) => {
      const r = panel.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2))) * 0.5;
      const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2))) * 0.5;
      panel.style.setProperty('--panel-rx', nx.toFixed(3));
      panel.style.setProperty('--panel-ry', ny.toFixed(3));
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      panel.style.removeProperty('--panel-rx');
      panel.style.removeProperty('--panel-ry');
    };
    // displayKey is included so the effect re-runs once the panel actually mounts:
    // on the render where isOpen first flips true, content (gated on displayKey) is
    // still null and panelRef is unset — without this dep the listener would never
    // attach to the real panel node.
  }, [isOpen, isLocked, reduced, displayKey]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isLocked || !dialogRef.current) return;
      if (e.key === 'Tab') {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [isLocked],
  );

  const flipInitial = useMemo(() => {
    const halfW = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
    const halfH = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;
    return { opacity: 0, scale: 0.34, x: origin.x - halfW, y: origin.y - halfH };
  }, [origin]);

  if (!content) return null;

  const accentStyle = { ['--detail-accent-rgb']: rgbTriple(themeColor) } as React.CSSProperties;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="detail-overlay"
          ref={dialogRef}
          className="detail-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="capability-modal-title"
          onKeyDown={handleKeyDown}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: reduced ? 0 : 0.22 } }}
          transition={{ duration: reduced ? 0 : 0.26 }}
        >
          <div
            className={`detail-scrim${isLocked ? ' is-interactive' : ''}`}
            aria-label="Close detail view"
            onClick={onClose}
          />

          {!reduced && <MaterializeCanvas key={displayKey} origin={origin} />}

          <motion.div
            ref={panelRef}
            data-detail-panel=""
            data-detail-state={isOpen ? 'open' : 'closing'}
            className={`detail-panel${isLocked ? ' is-interactive' : ''}`}
            style={accentStyle}
            initial={reduced ? false : flipInitial}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={
              reduced
                ? { opacity: 0, transition: { duration: 0 } }
                : { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.24, ease: 'easeIn' } }
            }
            transition={
              reduced
                ? { duration: 0 }
                : { type: 'spring', stiffness: 240, damping: 30, mass: 0.9, opacity: { duration: 0.3 } }
            }
          >
           <div className="detail-panel-depth">
            <span className="detail-accent-bar" aria-hidden="true" />
            {CORNERS.map((c) => (
              <span key={c} data-detail-corner={c} className={`detail-corner detail-corner--${c}`} aria-hidden="true" />
            ))}
            {!reduced && <span data-detail-sweep="" className="detail-sweep" aria-hidden="true" />}

            {isLocked && (
              <button
                ref={closeButtonRef}
                onClick={onClose}
                aria-label="Close capability details"
                className="detail-close"
              >
                <X size={18} strokeWidth={2} aria-hidden="true" />
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-[400px]">
              {/* Left sidebar: stat + title */}
              <div className="detail-sidebar p-8 border-r border-white/10 flex flex-col justify-center relative overflow-hidden">
                <div
                  className="absolute -right-4 -bottom-12 text-9xl font-black text-white/5 select-none z-0 pointer-events-none"
                  aria-hidden="true"
                >
                  {content.stats.value.replace(/\D/g, '')}
                </div>
                <div className="relative z-10">
                  <p
                    className="text-xs font-mono tracking-[0.2em] uppercase mb-4 font-bold"
                    style={{ color: themeColor }}
                  >
                    {content.subtitle}
                  </p>
                  <h2 id="capability-modal-title" className="text-3xl font-bold text-white leading-tight mb-8">
                    {content.title}
                  </h2>
                  <div className="text-5xl font-bold text-white tracking-tight">{content.stats.value}</div>
                  <div className="text-xs text-gray-200 uppercase tracking-wider font-mono mt-2">
                    {content.stats.label}
                  </div>
                </div>
              </div>

              {/* Right content: evidence */}
              <div className="detail-body p-10 flex flex-col justify-between">
                <ul className="space-y-6 text-gray-50 text-lg font-normal leading-[1.7] list-none m-0 p-0">
                  {content.details.map((detail) => (
                    <li key={detail.slice(0, 48)} className="flex items-start gap-4">
                      <span
                        className="mt-2.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: themeColor }}
                        aria-hidden="true"
                      />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-10 pt-8 border-t border-white/15 flex justify-between items-end gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-100 uppercase tracking-widest font-mono">Source</span>
                    <div className="flex items-center gap-2 text-xs text-gray-100 font-mono">
                      <Database size={11} strokeWidth={2} aria-hidden="true" />
                      <span>VIK_RESUME_FINAL.PDF</span>
                    </div>
                  </div>
                  <a
                    href="/docs/Vik_Resume_Final.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="detail-cta group flex items-center gap-3 px-6 py-3 rounded-lg"
                  >
                    <span className="text-sm font-medium text-white">View Full Document</span>
                    <ArrowRight
                      size={14}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="group-hover:translate-x-1 transition-transform"
                      style={{ color: themeColor }}
                    />
                  </a>
                </div>
              </div>
            </div>
           </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
