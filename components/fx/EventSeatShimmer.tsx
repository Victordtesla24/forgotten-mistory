'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * EventSeatShimmer — SVG seat-map shimmer + event timeline effect for the
 * abentertainment / indian-event-manager project (SPEC §7 #15). Shows a
 * miniature seat-map grid where seats illuminate in sequence (booking flow),
 * plus a timeline strip along the bottom with event milestones.
 *
 * Data is static, project-sourced (event management, seat booking,
 * timeline coordination). Colours: CSS tokens only. Reduced-motion
 * fallback shows all seats illuminated and timeline fully revealed.
 */

const ROWS = 5;
const COLS = 8;
const SEAT_GAP = 4;
const SEAT_SIZE = 5;

// Deterministic seat occupancy pattern (pre-booked vs available)
const SEAT_MAP: ('available' | 'booked' | 'vip')[][] = [
  ['available', 'booked', 'booked', 'available', 'vip', 'vip', 'booked', 'available'],
  ['available', 'available', 'booked', 'available', 'vip', 'vip', 'available', 'booked'],
  ['booked', 'available', 'available', 'available', 'vip', 'vip', 'booked', 'available'],
  ['available', 'available', 'booked', 'booked', 'available', 'vip', 'available', 'booked'],
  ['booked', 'booked', 'available', 'available', 'available', 'available', 'booked', 'available'],
];

interface EventMilestone {
  time: string;
  label: string;
  x: number;
}

const MILESTONES: EventMilestone[] = [
  { time: '6:00 PM', label: 'Doors Open', x: 15 },
  { time: '7:00 PM', label: 'Ceremony', x: 37 },
  { time: '8:30 PM', label: 'Dinner', x: 60 },
  { time: '10:00 PM', label: 'Music', x: 82 },
];

const totalCells = ROWS * COLS;

export default React.memo(function EventSeatShimmer({
  className = '',
  project = 'abentertainment',
}: {
  className?: string;
  project?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'booking' | 'settled'>('loading');
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
    timerRef.current = setTimeout(() => setPhase('booking'), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [inView, prefersReducedMotion]);

  // Sequential seat reveal during booking phase
  useEffect(() => {
    if (phase !== 'booking' || prefersReducedMotion) return;
    const interval = setInterval(() => {
      setRevealedCount((prev) => {
        const next = prev + 1;
        if (next >= totalCells) {
          clearInterval(interval);
          timerRef.current = setTimeout(() => setPhase('settled'), 400);
          return totalCells;
        }
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [phase, prefersReducedMotion]);

  const isSettled = phase === 'settled' || prefersReducedMotion;
  const showAll = prefersReducedMotion;

  return (
    <div
      ref={containerRef}
      data-testid="event-seat-shimmer"
      data-project={project}
      className={`event-seat-shimmer ${className}`.trim()}
      {...(prefersReducedMotion ? { 'data-reduced-motion': 'true' } : {})}
    >
      {/* Header */}
      <motion.div
        className="event-header"
        initial={{ opacity: 0 }}
        animate={{ opacity: inView ? 1 : 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <span className="event-title">Grand Celebration — Seat Map</span>
        <span className="event-subtitle">Indian Event Manager · Live booking</span>
      </motion.div>

      {/* Seat map */}
      <div className="event-seatmap-area">
        <svg
          viewBox={`0 0 ${COLS * (SEAT_SIZE + SEAT_GAP) + SEAT_GAP} ${ROWS * (SEAT_SIZE + SEAT_GAP) + SEAT_GAP + 20}`}
          className="event-seatmap-svg"
          role="img"
          aria-label="Event seat booking map"
        >
          {/* Stage indicator at top */}
          <motion.rect
            x={SEAT_GAP}
            y={2}
            width={COLS * (SEAT_SIZE + SEAT_GAP) - SEAT_GAP}
            height={4}
            rx="2"
            fill="var(--accent)"
            opacity="0.15"
            initial={{ opacity: 0 }}
            animate={{ opacity: inView ? 0.15 : 0 }}
            transition={{ delay: 0.3 }}
          />
          <text
            x={COLS * (SEAT_SIZE + SEAT_GAP) / 2 + SEAT_GAP}
            y={5}
            textAnchor="middle"
            fontSize="2.5"
            fill="var(--steel)"
            fontFamily="var(--font-mono)"
            opacity="0.5"
          >
            STAGE
          </text>

          {/* Seat grid */}
          {SEAT_MAP.map((row, ri) =>
            row.map((type, ci) => {
              const index = ri * COLS + ci;
              const cx = SEAT_GAP + ci * (SEAT_SIZE + SEAT_GAP) + SEAT_SIZE / 2;
              const cy = 16 + ri * (SEAT_SIZE + SEAT_GAP) + SEAT_SIZE / 2;
              const visible = showAll || revealedCount > index;
              const isBooked = type === 'booked';
              const isVip = type === 'vip';

              let fill = 'var(--steel)';
              let opacity = 0.3;
              if (isBooked) { fill = 'var(--mist-400)'; opacity = 0.5; }
              if (isVip) { fill = 'var(--accent)'; opacity = 0.7; }

              return (
                <g key={`${ri}-${ci}`}>
                  <motion.rect
                    x={cx - SEAT_SIZE / 2}
                    y={cy - SEAT_SIZE / 2}
                    width={SEAT_SIZE}
                    height={SEAT_SIZE}
                    rx={isVip ? 2 : 1}
                    fill={fill}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: visible ? opacity : 0,
                      scale: visible ? 1 : 0,
                    }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  />
                  {/* Shimmer for VIP */}
                  {isVip && visible && !prefersReducedMotion && (
                    <motion.rect
                      x={cx - SEAT_SIZE / 2}
                      y={cy - SEAT_SIZE / 2}
                      width={SEAT_SIZE}
                      height={SEAT_SIZE}
                      rx={2}
                      fill="var(--white)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.4, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: index * 0.03,
                        ease: 'easeInOut',
                      }}
                    />
                  )}
                </g>
              );
            }),
          )}
        </svg>
      </div>

      {/* Legend */}
      <motion.div
        className="event-legend"
        initial={{ opacity: 0 }}
        animate={{ opacity: isSettled ? 1 : 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <span className="legend-item">
          <span className="legend-dot legend-dot--available" /> Available
        </span>
        <span className="legend-item">
          <span className="legend-dot legend-dot--booked" /> Booked
        </span>
        <span className="legend-item">
          <span className="legend-dot legend-dot--vip" /> VIP
        </span>
      </motion.div>

      {/* Timeline strip */}
      <div className="event-timeline-area">
        <svg
          viewBox="0 0 300 30"
          className="event-timeline-svg"
          role="img"
          aria-label="Event timeline"
        >
          {/* Timeline baseline */}
          <motion.line
            x1="10"
            y1="18"
            x2="290"
            y2="18"
            stroke="var(--steel)"
            strokeWidth="0.5"
            opacity="0.3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: inView ? 1 : 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          />

          {/* Milestone dots + labels */}
          {MILESTONES.map((milestone, i) => (
            <g key={i}>
              <motion.circle
                cx={milestone.x}
                cy="18"
                r="3"
                fill="var(--accent)"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: isSettled ? 1 : 0,
                  scale: isSettled ? 1 : 0,
                }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
              />
              {isSettled && !prefersReducedMotion && (
                <motion.circle
                  cx={milestone.x}
                  cy="18"
                  r="3"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="0.5"
                  initial={{ r: 3, opacity: 0.8 }}
                  animate={{ r: 8, opacity: 0 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: 'easeOut',
                  }}
                />
              )}
              <text
                x={milestone.x}
                y="10"
                textAnchor="middle"
                fontSize="3.5"
                fill="var(--steel)"
                fontFamily="var(--font-mono)"
                opacity="0.7"
              >
                {milestone.time}
              </text>
              <text
                x={milestone.x}
                y="26"
                textAnchor="middle"
                fontSize="3.5"
                fill="var(--mist-400)"
                fontFamily="var(--font-mono)"
                opacity="0.5"
              >
                {milestone.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Footer stats */}
      <motion.div
        className="event-stats"
        initial={{ opacity: 0 }}
        animate={{ opacity: isSettled ? 1 : 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <span className="event-stat">500+ guests</span>
        <span className="event-stat-sep">·</span>
        <span className="event-stat">Live seat booking</span>
        <span className="event-stat-sep">·</span>
        <span className="event-stat">Event timeline</span>
      </motion.div>

      <style jsx>{`
        .event-seat-shimmer {
          width: 100%;
          max-width: 380px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .event-header {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .event-title {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: var(--white);
        }
        .event-subtitle {
          font-family: var(--font-mono);
          font-size: 0.5rem;
          color: var(--mist-400);
        }
        .event-seatmap-area {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          background: var(--ink-800);
          padding: 0.3rem;
        }
        .event-seatmap-svg {
          width: 100%;
          height: auto;
          display: block;
        }
        .event-legend {
          display: flex;
          justify-content: center;
          gap: 0.8rem;
          font-family: var(--font-mono);
          font-size: 0.5rem;
          color: var(--steel);
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          opacity: 0.7;
        }
        .legend-dot {
          width: 5px;
          height: 5px;
          border-radius: 1px;
          display: inline-block;
        }
        .legend-dot--available {
          background: var(--steel);
          opacity: 0.5;
        }
        .legend-dot--booked {
          background: var(--mist-400);
          opacity: 0.5;
        }
        .legend-dot--vip {
          background: var(--accent);
          opacity: 0.7;
        }
        .event-timeline-area {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          background: var(--ink-800);
          padding: 0.2rem;
        }
        .event-timeline-svg {
          width: 100%;
          height: auto;
          display: block;
        }
        .event-stats {
          display: flex;
          justify-content: center;
          gap: 0.4rem;
          font-family: var(--font-mono);
          font-size: 0.55rem;
          color: var(--steel);
          opacity: 0.8;
        }
        .event-stat-sep {
          opacity: 0.4;
        }
        @media (prefers-reduced-motion: reduce) {
          .event-stats {
            opacity: 1 !important;
          }
          .event-legend {
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
