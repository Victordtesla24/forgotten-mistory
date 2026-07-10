'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';

/**
 * InboxTriage — Framer/SVG inbox triage funnel effect for the AI Gmail Manager
 * project card (SPEC §7 #5). Messages enter from the top in a scattered/raw
 * state, flow through a classification funnel, and settle into labelled
 * categories (Urgent, Action, FYI, Archive). Emulates the LLM-driven triage
 * pipeline from the AI-Gmail-Mailbox-Manager project.
 *
 * Data is static, project-sourced (AI Gmail Manager: autonomous inbox triage,
 * sentiment analysis, draft generation). Colours: CSS tokens only.
 * Reduced-motion fallback shows the final classified state.
 */

interface Message {
  id: string;
  subject: string;
  label: 'Urgent' | 'Action' | 'FYI' | 'Archive';
}

const MESSAGES: Message[] = [
  { id: 'm1', subject: 'Prod outage — payment gateway', label: 'Urgent' },
  { id: 'm2', subject: 'Sprint retro notes — final call', label: 'Action' },
  { id: 'm3', subject: 'Q3 roadmap review deck', label: 'Action' },
  { id: 'm4', subject: 'Weekly team standup summary', label: 'FYI' },
  { id: 'm5', subject: 'Security patch KB5032190', label: 'Urgent' },
  { id: 'm6', subject: 'Newsletter: DevOps Weekly No.142', label: 'Archive' },
  { id: 'm7', subject: 'Contract renewal — vendor X', label: 'Action' },
  { id: 'm8', subject: 'Coffee machine maintenance', label: 'Archive' },
  { id: 'm9', subject: 'Client escalation — SLA breach', label: 'Urgent' },
  { id: 'm10', subject: 'CI pipeline health report', label: 'FYI' },
  { id: 'm11', subject: 'Offsite planning — dates poll', label: 'Action' },
  { id: 'm12', subject: 'Promo: 50% off cloud certs', label: 'Archive' },
];

const LABELS = ['Urgent', 'Action', 'FYI', 'Archive'] as const;

export default React.memo(function InboxTriage({ className = '', project }: { className?: string; project?: string }) {
  const prefersReducedMotion = useReducedMotionSafe();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [phase, setPhase] = useState<'incoming' | 'classifying' | 'settled'>('incoming');
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const pausedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || prefersReducedMotion) return;

    // D-KEYS-01 / D-CRASH-01: NEVER clear+re-append the same msg.id under
    // AnimatePresence. Clearing schedules exit nodes that still hold m3/m5;
    // a Strict Mode (or inView flicker) re-run that re-adds those ids produces
    // "Encountered two children with the same key". Append from prev.length
    // and skip ids already present — keys stay unique across siblings.
    let cancelled = false;
    const interval = setInterval(() => {
      if (cancelled || pausedRef.current) return;

      setVisibleMessages((prev) => {
        if (prev.length >= MESSAGES.length) return prev;
        const next = MESSAGES[prev.length];
        if (!next || prev.some((m) => m.id === next.id)) return prev;

        const updated = [...prev, next];
        if (updated.length === MESSAGES.length) {
          clearInterval(interval);
          intervalRef.current = null;
          queueMicrotask(() => {
            if (cancelled) return;
            setPhase('classifying');
            timerRef.current = setTimeout(() => {
              if (!cancelled) setPhase('settled');
            }, 800);
          });
        }
        return updated;
      });
    }, 160);
    intervalRef.current = interval;

    return () => {
      cancelled = true;
      clearInterval(interval);
      intervalRef.current = null;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [inView, prefersReducedMotion]);

  const isSettled = phase === 'settled' || prefersReducedMotion;
  const showAll = prefersReducedMotion;

  return (
    <div
      ref={containerRef}
      data-testid="inbox-triage" data-project={project}
      className={`inbox-triage ${className}`.trim()}
      {...(prefersReducedMotion ? { 'data-reduced-motion': 'true' } : {})}
    >
      {/* Funnel SVG */}
      <div className="inbox-funnel-area">
        <svg
          viewBox="0 0 200 40"
          className="inbox-funnel-svg"
          role="img"
          aria-label="Inbox triage funnel"
        >
          {/* Funnel shape */}
          <motion.polygon
            points="10,2 190,2 150,38 50,38"
            fill="none"
            stroke="var(--steel)"
            strokeWidth="0.8"
            strokeOpacity="0.4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: inView ? 1 : 0 }}
            transition={{ duration: 1, ease: 'easeInOut', delay: 0.3 }}
          />

          {/* Flow lines inside funnel */}
          {[0.2, 0.5, 0.8].map((frac, i) => (
            <motion.line
              key={i}
              x1={10 + frac * 180}
              y1={4}
              x2={50 + frac * 100}
              y2={36}
              stroke="var(--mist-400)"
              strokeWidth="0.5"
              strokeOpacity="0.3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: inView ? 1 : 0, opacity: inView ? 0.3 : 0 }}
              transition={{ duration: 0.7, ease: 'easeInOut', delay: 0.6 + i * 0.2 }}
            />
          ))}

          {/* Output labels */}
          {LABELS.map((label, i) => (
            <motion.text
              key={label}
              x={12 + i * 48}
              y={34}
              fill="var(--steel)"
              fontSize="5"
              fontFamily="var(--font-mono)"
              textAnchor="start"
              initial={{ opacity: 0 }}
              animate={{ opacity: isSettled ? 1 : 0.2 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
            >
              {label}
            </motion.text>
          ))}
        </svg>
      </div>

      {/* Message stream */}
      <div className="inbox-messages" data-testid="inbox-messages">
        {showAll ? (
          MESSAGES.map((msg) => {
            return (
              <div
                key={msg.id}
                data-testid="inbox-message"
                className={`inbox-msg inbox-msg--${msg.label.toLowerCase()}`}
                data-label={msg.label}
              >
                <span className="inbox-msg-subject">{msg.subject}</span>
                <span
                  className={`inbox-msg-label inbox-msg-label--${msg.label.toLowerCase()}`}
                >
                  {msg.label}
                </span>
              </div>
            );
          })
        ) : (
          // Append-only stream — no AnimatePresence. Exit nodes + re-append of
          // the same msg.id (Strict Mode / inView flicker) was the D-KEYS-01
          // "same key, m3/m5" warning under AnimatePresence.
          <div className="inbox-messages-stream">
            {visibleMessages.map((msg) => {
              const labelIndex = LABELS.indexOf(msg.label);
              return (
                <motion.div
                  key={msg.id}
                  data-testid="inbox-message"
                  className={`inbox-msg inbox-msg--${msg.label.toLowerCase()}`}
                  data-label={msg.label}
                  initial={{ opacity: 0, x: -8, height: 0, marginBottom: 0 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    height: 'auto',
                    marginBottom: isSettled ? 2 : 4,
                  }}
                  transition={{
                    duration: 0.3,
                    delay: isSettled ? labelIndex * 0.05 : 0,
                  }}
                >
                  <span className="inbox-msg-subject">{msg.subject}</span>
                  <motion.span
                    className={`inbox-msg-label inbox-msg-label--${msg.label.toLowerCase()}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: isSettled ? 1 : 0.5,
                      scale: isSettled ? 1 : 0.9,
                    }}
                    transition={{ delay: isSettled ? 0.3 + labelIndex * 0.1 : 0, duration: 0.25 }}
                  >
                    {msg.label}
                  </motion.span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer stats */}
      <motion.div
        className="inbox-stats"
        initial={{ opacity: 0 }}
        animate={{ opacity: isSettled ? 1 : 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <span className="inbox-stat">
          {MESSAGES.length} messages triaged
        </span>
        <span className="inbox-stat-sep">·</span>
        <span className="inbox-stat">
          LLM sentiment + labels
        </span>
      </motion.div>

      <style jsx>{`
        .inbox-triage {
          width: 100%;
          max-width: 340px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .inbox-funnel-area {
          width: 100%;
        }
        .inbox-funnel-svg {
          width: 100%;
          height: auto;
        }
        .inbox-messages {
          display: flex;
          flex-direction: column;
          gap: 0;
          min-height: 60px;
        }
        .inbox-msg {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.2rem 0.4rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          overflow: hidden;
        }
        .inbox-msg-subject {
          font-family: var(--font-mono);
          font-size: 0.58rem;
          color: var(--mist-200);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          margin-right: 0.4rem;
        }
        .inbox-msg-label {
          font-family: var(--font-mono);
          font-size: 0.5rem;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .inbox-msg-label--urgent {
          color: var(--white);
          border: 1px solid var(--white);
          background: rgba(255, 255, 255, 0.1);
        }
        .inbox-msg-label--action {
          color: var(--steel);
          border: 1px solid var(--steel);
          opacity: 0.9;
        }
        .inbox-msg-label--fyi {
          color: var(--mist-400);
          border: 1px solid var(--mist-400);
          opacity: 0.7;
        }
        .inbox-msg-label--archive {
          color: var(--ink-700);
          border: 1px solid var(--ink-700);
          opacity: 0.5;
        }
        .inbox-stats {
          display: flex;
          justify-content: center;
          gap: 0.4rem;
          font-family: var(--font-mono);
          font-size: 0.6rem;
          color: var(--steel);
          opacity: 0.8;
        }
        .inbox-stat-sep {
          opacity: 0.4;
        }
        @media (prefers-reduced-motion: reduce) {
          .inbox-msg {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
});
