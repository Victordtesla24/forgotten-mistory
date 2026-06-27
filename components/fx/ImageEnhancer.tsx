'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * ImageEnhancer — Before/after upscale reveal slider effect for the
 * Image-Enhancer project (SPEC §7 #11). Shows a split-panel comparison:
 * left side = pixelated/blocky "before" (low-res grid), right side =
 * smooth "after" (high-res gradient). A draggable divider slides across
 * to reveal the enhanced result.
 *
 * Data is static, project-sourced (image upscaling, before/after comparison).
 * Colours: CSS tokens only. Reduced-motion fallback shows final state with
 * divider at midpoint.
 */

const GRID_SIZE = 8;
const CELL_SIZE = 12;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

function generateGrid(): number[][] {
  const grid: number[][] = [];
  const pattern = [
    0x1a, 0x2c, 0x3e, 0x4f, 0x5d, 0x6b, 0x78, 0x84,
    0x22, 0x35, 0x47, 0x58, 0x67, 0x74, 0x80, 0x8a,
    0x2e, 0x40, 0x51, 0x61, 0x6f, 0x7b, 0x86, 0x8f,
    0x3a, 0x4b, 0x5b, 0x6a, 0x77, 0x82, 0x8b, 0x93,
    0x46, 0x56, 0x65, 0x73, 0x7e, 0x88, 0x90, 0x96,
    0x52, 0x60, 0x6e, 0x7a, 0x84, 0x8c, 0x93, 0x98,
    0x5c, 0x69, 0x75, 0x80, 0x89, 0x90, 0x95, 0x9a,
    0x64, 0x70, 0x7b, 0x84, 0x8c, 0x92, 0x97, 0x9b,
  ];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: number[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push(pattern[y * GRID_SIZE + x] / 0x9b);
    }
    grid.push(row);
  }
  return grid;
}

const PIXEL_GRID = generateGrid();

export default function ImageEnhancer({
  className = '',
  project = 'image-enhancer',
}: {
  className?: string;
  project?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [dividerPos, setDividerPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [phase, setPhase] = useState<'before' | 'revealing' | 'settled'>('before');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || prefersReducedMotion) return;
    timerRef.current = setTimeout(() => setPhase('revealing'), 400);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [inView, prefersReducedMotion]);

  useEffect(() => {
    if (phase !== 'revealing' || prefersReducedMotion) return;
    const start = performance.now();
    const duration = 1800;
    let raf: number;
    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDividerPos(eased * 100);
      if (t < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        setPhase('settled');
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [phase, prefersReducedMotion]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      setDividerPos(Math.max(5, Math.min(95, x)));
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isDragging]);

  const isSettled = phase === 'settled' || prefersReducedMotion;

  return (
    <div
      ref={containerRef}
      data-testid="image-enhancer"
      data-project={project}
      className={`image-enhancer ${className}`.trim()}
      {...(prefersReducedMotion ? { 'data-reduced-motion': 'true' } : {})}
    >
      <motion.div
        className="enhancer-labels"
        initial={{ opacity: 0 }}
        animate={{ opacity: inView ? 1 : 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <span className="enhancer-label enhancer-label--before">Before</span>
        <span className="enhancer-label enhancer-label--after">Enhanced</span>
      </motion.div>

      <div className="enhancer-canvas-area">
        <svg
          viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
          className="enhancer-canvas enhancer-canvas--before"
          role="img"
          aria-label="Original low-resolution image"
          style={{ clipPath: `inset(0 ${100 - dividerPos}% 0 0)` }}
        >
          {PIXEL_GRID.map((row, y) =>
            row.map((value, x) => (
              <rect
                key={`${y}-${x}`}
                x={x * CELL_SIZE}
                y={y * CELL_SIZE}
                width={CELL_SIZE}
                height={CELL_SIZE}
                fill="var(--steel)"
                opacity={0.15 + value * 0.55}
                rx="0"
              >
                {inView && !prefersReducedMotion && (
                  <animate
                    attributeName="opacity"
                    from="0.05"
                    to={0.15 + value * 0.55}
                    dur="0.4s"
                    begin={`${(y * GRID_SIZE + x) * 0.015}s`}
                    fill="freeze"
                  />
                )}
              </rect>
            )),
          )}
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1={0}
              y1={i * CELL_SIZE}
              x2={CANVAS_SIZE}
              y2={i * CELL_SIZE}
              stroke="var(--ink-700)"
              strokeWidth="0.5"
              opacity="0.4"
            />
          ))}
        </svg>

        <svg
          viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
          className="enhancer-canvas enhancer-canvas--after"
          role="img"
          aria-label="Enhanced high-resolution image"
          style={{ clipPath: `inset(0 0 0 ${dividerPos}%)` }}
        >
          <defs>
            <radialGradient id="enhanced-grad" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="var(--white)" stopOpacity="0.9" />
              <stop offset="50%" stopColor="var(--steel)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--ink-800)" stopOpacity="0.2" />
            </radialGradient>
          </defs>
          <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#enhanced-grad)" />
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={`detail-${i}`}
              x1={i * 8 + 4}
              y1={0}
              x2={i * 8 + 4}
              y2={CANVAS_SIZE}
              stroke="var(--mist-200)"
              strokeWidth="0.3"
              opacity="0.25"
            />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={`hdetail-${i}`}
              x1={0}
              y1={i * 8 + 4}
              x2={CANVAS_SIZE}
              y2={i * 8 + 4}
              stroke="var(--mist-200)"
              strokeWidth="0.3"
              opacity="0.25"
            />
          ))}
          <path
            d={`M ${CANVAS_SIZE * 0.2} ${CANVAS_SIZE * 0.8} Q ${CANVAS_SIZE * 0.5} ${CANVAS_SIZE * 0.3} ${CANVAS_SIZE * 0.8} ${CANVAS_SIZE * 0.7}`}
            fill="none"
            stroke="var(--white)"
            strokeWidth="0.8"
            opacity="0.5"
          >
            {inView && !prefersReducedMotion && (
              <animate
                attributeName="opacity"
                from="0"
                to="0.5"
                dur="0.6s"
                begin="0.8s"
                fill="freeze"
              />
            )}
          </path>
        </svg>

        <motion.div
          className={`enhancer-divider${isDragging ? ' enhancer-divider--dragging' : ''}`}
          style={{ left: `${dividerPos}%` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: inView ? 1 : 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          onPointerDown={handlePointerDown}
        >
          <div className="enhancer-divider-line" />
          <div className="enhancer-divider-grip">
            <span className="grip-dot" />
            <span className="grip-dot" />
            <span className="grip-dot" />
          </div>
        </motion.div>
      </div>

      <motion.div
        className="enhancer-stats"
        initial={{ opacity: 0 }}
        animate={{ opacity: isSettled ? 1 : 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <span className="enhancer-stat">2× upscale</span>
        <span className="enhancer-stat-sep">·</span>
        <span className="enhancer-stat">ML super-resolution</span>
        <span className="enhancer-stat-sep">·</span>
        <span className="enhancer-stat">Detail restoration</span>
      </motion.div>

      <style jsx>{`
        .image-enhancer {
          width: 100%;
          max-width: 380px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .enhancer-labels {
          display: flex;
          justify-content: space-between;
          padding: 0 0.2rem;
        }
        .enhancer-label {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .enhancer-label--before {
          color: var(--mist-400);
        }
        .enhancer-label--after {
          color: var(--accent);
        }
        .enhancer-canvas-area {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .enhancer-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .enhancer-canvas--before {
          background: var(--ink-800);
        }
        .enhancer-canvas--after {
          background: var(--ink-900);
        }
        .enhancer-divider {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 3px;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: ew-resize;
          z-index: 2;
          transition: opacity 0.2s;
        }
        .enhancer-divider-line {
          flex: 1;
          width: 1px;
          background: var(--white);
        }
        .enhancer-divider-grip {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 3px;
          background: var(--ink-700);
          border: 1px solid var(--white);
          border-radius: 6px;
          padding: 4px 2px;
        }
        .enhancer-divider--dragging .enhancer-divider-grip {
          background: var(--ink-500);
        }
        .grip-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--white);
        }
        .enhancer-stats {
          display: flex;
          justify-content: center;
          gap: 0.4rem;
          font-family: var(--font-mono);
          font-size: 0.58rem;
          color: var(--steel);
          opacity: 0.8;
        }
        .enhancer-stat-sep {
          opacity: 0.4;
        }
        @media (prefers-reduced-motion: reduce) {
          .enhancer-label {
            opacity: 1 !important;
          }
          .enhancer-divider {
            left: 50% !important;
          }
          .enhancer-stats {
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
