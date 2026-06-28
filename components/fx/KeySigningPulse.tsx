'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';

/**
 * KeySigningPulse — SVG key-signing handshake pulse effect for the
 * public-key-server project (SPEC §7 #13). Shows two cryptographic key
 * icons (public/private pair) that approach each other, a verification
 * pulse radiates outward, then keys separate with a signed badge.
 *
 * Data is static, project-sourced (Node.js/Express public-key server,
 * API signing, Mocha/Chai test coverage). Colours: CSS tokens only.
 * Reduced-motion fallback shows final signed state.
 */


export default React.memo(function KeySigningPulse({
  className = '',
  project = 'public-key-server',
}: {
  className?: string;
  project?: string;
}) {
  const prefersReducedMotion = useReducedMotionSafe();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [phase, setPhase] = useState<'approaching' | 'signing' | 'signed'>('approaching');
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
    timerRef.current = setTimeout(() => setPhase('signing'), 600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [inView, prefersReducedMotion]);

  useEffect(() => {
    if (phase !== 'signing' || prefersReducedMotion) return;
    timerRef.current = setTimeout(() => setPhase('signed'), 1400);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, prefersReducedMotion]);

  const isSigned = phase === 'signed' || prefersReducedMotion;
  const isSigning = phase === 'signing';

  return (
    <div
      ref={containerRef}
      data-testid="key-signing-pulse"
      data-project={project}
      className={`key-signing-pulse ${className}`.trim()}
      {...(prefersReducedMotion ? { 'data-reduced-motion': 'true' } : {})}
    >
      {/* Header */}
      <motion.div
        className="keysigning-header"
        initial={{ opacity: 0 }}
        animate={{ opacity: inView ? 1 : 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <span className="keysigning-title">API Key Signing Handshake</span>
        <span className="keysigning-subtitle">RSA-2048 · Mocha/Chai verified</span>
      </motion.div>

      {/* Key diagram */}
      <div className="keysigning-canvas">
        <svg
          viewBox="0 0 300 120"
          className="keysigning-svg"
          role="img"
          aria-label="Public-private key signing handshake"
        >
          {/* Centre line */}
          <motion.line
            x1="150"
            y1="10"
            x2="150"
            y2="110"
            stroke="var(--steel)"
            strokeWidth="0.5"
            strokeDasharray="4 6"
            opacity="0.3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: inView ? 1 : 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />

          {/* Left key (public) */}
          <motion.g
            initial={{ x: -30, opacity: 0 }}
            animate={{
              x: isSigning || isSigned ? 0 : -30,
              opacity: inView ? 1 : 0,
            }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
          >
            {/* Key bow (circle) */}
            <circle
              cx="90"
              cy="60"
              r="16"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.2"
              opacity="0.8"
            />
            <circle cx="90" cy="60" r="8" fill="var(--accent)" opacity="0.15" />
            {/* Key shaft */}
            <line
              x1="106"
              y1="60"
              x2="148"
              y2="60"
              stroke="var(--accent)"
              strokeWidth="1.2"
              opacity="0.8"
            />
            {/* Key teeth */}
            <line x1="140" y1="60" x2="140" y2="52" stroke="var(--accent)" strokeWidth="1" opacity="0.7" />
            <line x1="145" y1="60" x2="145" y2="54" stroke="var(--accent)" strokeWidth="1" opacity="0.7" />
            {/* Label */}
            <text x="90" y="91" textAnchor="middle" fontSize="6" fill="var(--steel)" fontFamily="var(--font-mono)">
              PUBLIC KEY
            </text>
          </motion.g>

          {/* Right key (private) */}
          <motion.g
            initial={{ x: 30, opacity: 0 }}
            animate={{
              x: isSigning || isSigned ? 0 : 30,
              opacity: inView ? 1 : 0,
            }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
          >
            {/* Key bow (circle with cross) */}
            <circle
              cx="210"
              cy="60"
              r="16"
              fill="none"
              stroke="var(--white)"
              strokeWidth="1.2"
              opacity="0.8"
            />
            <circle cx="210" cy="60" r="8" fill="var(--white)" opacity="0.1" />
            {/* Lock symbol inside */}
            <line x1="210" y1="56" x2="210" y2="62" stroke="var(--white)" strokeWidth="1.2" opacity="0.6" />
            <path
              d="M 206 56 A 4 4 0 0 1 214 56"
              fill="none"
              stroke="var(--white)"
              strokeWidth="1"
              opacity="0.6"
            />
            {/* Key shaft */}
            <line
              x1="152"
              y1="60"
              x2="194"
              y2="60"
              stroke="var(--white)"
              strokeWidth="1.2"
              opacity="0.8"
            />
            {/* Label */}
            <text x="210" y="91" textAnchor="middle" fontSize="6" fill="var(--steel)" fontFamily="var(--font-mono)">
              PRIVATE KEY
            </text>
          </motion.g>

          {/* Verification pulse — concentric rings */}
          {isSigning && !prefersReducedMotion && (
            <motion.circle
              cx="150"
              cy="60"
              r="4"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.5"
              initial={{ r: 4, opacity: 1 }}
              animate={{ r: 40, opacity: 0 }}
              transition={{ duration: 1.2, repeat: 2, ease: 'easeOut' }}
            />
          )}

          {/* Signed checkmark badge */}
          <motion.g
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: isSigned ? 1 : 0,
              scale: isSigned ? 1 : 0.5,
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <circle
              cx="150"
              cy="60"
              r="10"
              fill="var(--ink-700)"
              stroke="var(--accent)"
              strokeWidth="1"
            />
            <motion.path
              d="M 146 60 L 149 63 L 155 57"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: isSigned ? 1 : 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            />
          </motion.g>

          {/* Data flow particles along center line */}
          {isSigning && !prefersReducedMotion && (
            <>
              {[20, 40, 60, 80, 100].map((y, i) => (
                <motion.circle
                  key={`particle-${i}`}
                  cx="150"
                  cy={y}
                  r="1"
                  fill="var(--accent)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.8, 0] }}
                  transition={{
                    duration: 1,
                    delay: i * 0.12,
                    repeat: 2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </>
          )}

          {/* Fingerprint labels at bottom */}
          <motion.text
            x="90"
            y="106"
            textAnchor="middle"
            fontSize="4.5"
            fill="var(--mist-400)"
            fontFamily="var(--font-mono)"
            initial={{ opacity: 0 }}
            animate={{ opacity: isSigned ? 0.6 : 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            a1:b2:c3:d4:e5:f6
          </motion.text>
          <motion.text
            x="210"
            y="106"
            textAnchor="middle"
            fontSize="4.5"
            fill="var(--mist-400)"
            fontFamily="var(--font-mono)"
            initial={{ opacity: 0 }}
            animate={{ opacity: isSigned ? 0.6 : 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            7g:8h:9i:0j:1k:2l
          </motion.text>
        </svg>
      </div>

      {/* Footer status */}
      <motion.div
        className="keysigning-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: isSigned ? 1 : 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <span className="keysigning-status keysigning-status--signed">
          ✓ Request signed
        </span>
        <span className="keysigning-stat-sep">·</span>
        <span className="keysigning-stat">HMAC-SHA256</span>
        <span className="keysigning-stat-sep">·</span>
        <span className="keysigning-stat">TTL 300s</span>
      </motion.div>

      <style jsx>{`
        .key-signing-pulse {
          width: 100%;
          max-width: 420px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .keysigning-header {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .keysigning-title {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: var(--white);
          letter-spacing: 0.03em;
        }
        .keysigning-subtitle {
          font-family: var(--font-mono);
          font-size: 0.5rem;
          color: var(--mist-400);
        }
        .keysigning-canvas {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          background: var(--ink-800);
          overflow: hidden;
        }
        .keysigning-svg {
          width: 100%;
          height: auto;
          display: block;
        }
        .keysigning-footer {
          display: flex;
          justify-content: center;
          gap: 0.4rem;
          font-family: var(--font-mono);
          font-size: 0.55rem;
          align-items: center;
        }
        .keysigning-status {
          color: var(--accent);
        }
        .keysigning-stat-sep {
          opacity: 0.4;
          color: var(--steel);
        }
        .keysigning-stat {
          color: var(--steel);
          opacity: 0.7;
        }
        @media (prefers-reduced-motion: reduce) {
          .keysigning-footer {
            opacity: 1 !important;
          }
          .keysigning-svg g {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
});
