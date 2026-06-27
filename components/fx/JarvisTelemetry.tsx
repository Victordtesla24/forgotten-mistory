'use client';

/**
 * JarvisTelemetry — JARVIS Error-Management-System telemetry block.
 *
 * Renders a live event stream of detect→diagnose→repair cycles from the
 * Error-Management-System autonomous AI agent, with system-health readouts.
 *
 * DATA BINDING: generateJarvisTelemetry() from lib/telemetryFeed.ts
 *   — deterministic sine-based live feed, ZERO Math.random().
 *
 * STABILISED: 30 Hz rAF throttle, no per-frame alloc, clean teardown.
 * Uses existing .telemetry-card / .telemetry-label / .telemetry-value classes
 * from globals.css to stay monochrome and consistent with TelemetryPanel (C1, C3).
 */

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  generateJarvisTelemetry,
  TELEMETRY_SOURCE_LABEL,
  type JarvisReadout,
} from '@/lib/telemetryFeed';

const THROTTLE_MS = 1000 / 30; // 30 Hz

export function useJarvisTelemetry(enabled: boolean): JarvisReadout {
  const [state, setState] = useState<JarvisReadout>(() =>
    generateJarvisTelemetry(0),
  );

  useEffect(() => {
    if (!enabled) return;
    let raf: number;
    let lastTick = 0;
    const start = performance.now();
    let running = true;

    const tick = (now: number) => {
      if (!running) return;
      if (now - lastTick >= THROTTLE_MS) {
        lastTick = now;
        const t = (now - start) / 1000;
        setState(generateJarvisTelemetry(t));
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  return state;
}

const PHASE_ICONS: Record<string, string> = {
  detect: '\u25C9',   // ◉
  diagnose: '\u25CE', // ◎
  repair: '\u25C8',   // ◈
};

export default function JarvisTelemetry() {
  const prefersReducedMotion = useReducedMotion();
  const telemetry = useJarvisTelemetry(!prefersReducedMotion);

  const displayData = prefersReducedMotion
    ? generateJarvisTelemetry(0)
    : telemetry;

  const {
    events,
    systemHealth,
    activeAgents,
    errorsDetected,
    errorsRepaired,
    avgRepairTimeMs,
  } = displayData;

  return (
    <div
      className="telemetry-card jarvis-telemetry"
      data-testid="jarvis-telemetry"
    >
      <div className="telemetry-header">
        <div>
          <p className="eyebrow">JARVIS System</p>
          <h3 style={{ fontSize: '0.95rem', margin: '0.1rem 0 0', color: 'var(--white)' }}>
            Error-Management-System
          </h3>
        </div>
        <div className="telemetry-badges">
          <span className="pill live">Live</span>
          <span className="pill accent">
            Health {systemHealth}%
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          marginTop: '0.75rem',
        }}
      >
        <div>
          <div className="telemetry-label">Active Agents</div>
          <div className="telemetry-value" style={{ fontSize: '1.1rem' }}>
            {activeAgents}
          </div>
        </div>
        <div>
          <div className="telemetry-label">System Health</div>
          <div className="telemetry-value" style={{ fontSize: '1.1rem' }}>
            {systemHealth}%
          </div>
        </div>
        <div>
          <div className="telemetry-label">Errors Detected</div>
          <div className="telemetry-value" style={{ fontSize: '1.1rem' }}>
            {errorsDetected}
          </div>
        </div>
        <div>
          <div className="telemetry-label">Repairs Completed</div>
          <div className="telemetry-value" style={{ fontSize: '1.1rem' }}>
            {errorsRepaired}
          </div>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <div className="telemetry-label">Avg Repair Time</div>
          <div className="telemetry-value" style={{ fontSize: '1.1rem' }}>
            {avgRepairTimeMs}{' '}
            <span className="telemetry-unit" style={{ fontSize: '0.7rem' }}>ms</span>
          </div>
        </div>
      </div>

      {/* Event stream — detect → diagnose → repair cycles */}
      <div style={{ marginTop: '0.75rem' }}>
        <div className="telemetry-label">Live Event Stream</div>
        <div
          style={{
            maxHeight: '120px',
            overflowY: 'auto',
            fontSize: '0.7rem',
            color: 'var(--secondary-text)',
            fontFamily: 'var(--font-mono)',
            lineHeight: '1.6',
            marginTop: '0.25rem',
          }}
        >
          {events.slice().reverse().map((evt) => (
            <div key={evt.id} style={{ marginBottom: '2px' }}>
              <span style={{ color: 'var(--steel)', marginRight: '0.35rem' }}>
                {PHASE_ICONS[evt.phase] || '\u25CB'}
              </span>
              <span
                style={{
                  color: evt.phase === 'repair' ? 'var(--accent-color)' : 'var(--secondary-text)',
                  fontWeight: evt.phase === 'repair' ? 600 : 400,
                }}
              >
                [{evt.phase.toUpperCase()}]
              </span>{' '}
              <span>{evt.project}</span>{' '}
              <span style={{ opacity: 0.5 }}>— {evt.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Source label — always visible to prove it's not random noise */}
      <p
        className="telemetry-note"
        data-testid="telemetry-source-label"
        style={{ marginTop: '0.5rem', fontSize: '0.6rem', opacity: 0.5 }}
      >
        {TELEMETRY_SOURCE_LABEL}
      </p>
    </div>
  );
}
