'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';

interface TimelineEvent {
  id: string; year: string; label: string; company: string; x: number; tier: 'top' | 'bottom';
}
const EVENTS: TimelineEvent[] = [
  { id: 'e1', year: '2010', label: 'Dev Support', company: 'MYOB', x: 8, tier: 'top' },
  { id: 'e2', year: '2011', label: 'Senior BA', company: 'InfoCentric', x: 18, tier: 'bottom' },
  { id: 'e3', year: '2014', label: 'BA Coord', company: 'Telstra', x: 30, tier: 'top' },
  { id: 'e4', year: '2015', label: 'Lead BA', company: 'Microsoft', x: 42, tier: 'bottom' },
  { id: 'e5', year: '2016', label: 'PM / BA', company: 'NAB', x: 54, tier: 'top' },
  { id: 'e6', year: '2017', label: 'Delivery Lead', company: 'ANZ', x: 66, tier: 'bottom' },
  { id: 'e7', year: '2025', label: 'AI Consultant', company: 'Independent', x: 82, tier: 'top' },
  { id: 'e8', year: '2026', label: 'Scrum Master', company: 'ATO', x: 94, tier: 'bottom' },
];
const TW = 300; const TH = 120; const TY = 55;

export default React.memo(function JourneyTimeline({ className = '', project }: { className?: string; project?: string }) {
  const prefersReducedMotion = useReducedMotionSafe();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const pausedRef = useRef(false);

  // Visibility change: pause/resume
  useEffect(() => {
    const handleVisibility = () => {
      pausedRef.current = document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={containerRef} data-testid="journey-timeline" data-project={project}
      className={`journey-timeline ${className}`.trim()}
      {...(prefersReducedMotion ? { 'data-reduced-motion': 'true' } : {})}>
      <div className="tl-header">
        <span className="tl-kicker">Career Journey</span>
        <span className="tl-title">15+ Years Across Government, Finance & Telecom</span>
      </div>
      <svg viewBox={`0 0 ${TW} ${TH}`} className="tl-svg" role="img" aria-label="Career timeline 2010-2026">
        <motion.line x1={12} y1={TY} x2={TW - 12} y2={TY}
          stroke="var(--ink-700)" strokeWidth="1.5"
          initial={{ pathLength: prefersReducedMotion ? 1 : 0 }}
          animate={{ pathLength: inView ? 1 : 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }} />
        {EVENTS.map((ev, idx) => {
          const isActive = activeNode === ev.id;
          const ny = ev.tier === 'top' ? TY - 28 : TY + 28;
          return (
            <g key={ev.id}>
              <motion.line x1={ev.x} y1={TY} x2={ev.x} y2={ev.tier === 'top' ? TY - 20 : TY + 20}
                stroke="var(--ink-700)" strokeWidth="1" strokeDasharray="2 2"
                initial={{ opacity: 0 }} animate={{ opacity: inView ? 0.5 : 0 }}
                transition={{ delay: 0.5 + idx * 0.08, duration: 0.3 }} />
              <motion.circle data-testid="timeline-node" cx={ev.x} cy={ny}
                r={isActive ? 8 : 5} fill={isActive ? 'var(--white)' : 'var(--ink-800)'}
                stroke={isActive ? 'var(--white)' : 'var(--steel)'} strokeWidth="1.2"
                initial={prefersReducedMotion ? false : { scale: 0 }}
                animate={{ scale: inView ? 1 : 0 }}
                transition={{ delay: 0.3 + idx * 0.08, duration: 0.35, type: 'spring', stiffness: 300 }}
                onMouseEnter={() => setActiveNode(ev.id)}
                onMouseLeave={() => setActiveNode(null)} style={{ cursor: 'pointer' }} />
              {isActive && !prefersReducedMotion && (
                <motion.circle cx={ev.x} cy={ny} r={5} fill="none" stroke="var(--white)" strokeWidth="1"
                  initial={{ r: 5, opacity: 0.5 }} animate={{ r: 14, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity }} />
              )}
              <motion.text x={ev.x} y={ev.tier === 'top' ? ny - 10 : ny + 16}
                textAnchor="middle" fill={isActive ? 'var(--white)' : 'var(--steel)'}
                fontSize="8" fontFamily="var(--font-mono)"
                initial={{ opacity: 0 }} animate={{ opacity: inView ? 1 : 0 }}
                transition={{ delay: 0.6 + idx * 0.08, duration: 0.3 }}>{ev.year}</motion.text>
            </g>
          );
        })}
        {!prefersReducedMotion && inView && (<>
          <motion.path
            d={`M${EVENTS[5].x},${TY + 28} Q${(EVENTS[5].x + EVENTS[6].x) / 2},${TY - 42} ${EVENTS[6].x},${TY - 28}`}
            fill="none" stroke="var(--steel)" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="4 3"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }} />
          <motion.path
            d={`M${EVENTS[6].x},${TY - 28} Q${(EVENTS[6].x + EVENTS[7].x) / 2},${TY + 42} ${EVENTS[7].x},${TY + 28}`}
            fill="none" stroke="var(--steel)" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="4 3"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ delay: 2.0, duration: 0.6 }} />
        </>)}
      </svg>
      <motion.div className="tl-detail"
        animate={{ opacity: activeNode ? 1 : 0, height: activeNode ? 'auto' : 0, marginTop: activeNode ? 4 : 0 }}
        transition={{ duration: 0.3 }}>
        {activeNode && (() => {
          const ev = EVENTS.find((e) => e.id === activeNode);
          return ev ? <span className="tl-detail-text">{ev.label} · {ev.company} ({ev.year})</span> : null;
        })()}
      </motion.div>
      <style jsx>{`
        .journey-timeline{width:100%;max-width:360px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:1rem;display:flex;flex-direction:column;gap:.4rem}
        .tl-header{display:flex;flex-direction:column;gap:.1rem}
        .tl-kicker{font-family:var(--font-mono);font-size:.55rem;text-transform:uppercase;letter-spacing:.5px;color:var(--mist-400)}
        .tl-title{font-family:var(--font-mono);font-size:.65rem;color:var(--mist-200);line-height:1.3}
        .tl-svg{width:100%;height:auto}
        .tl-detail{overflow:hidden;text-align:center}
        .tl-detail-text{font-family:var(--font-mono);font-size:.6rem;color:var(--white)}
      `}</style>
    </div>
  );
});
