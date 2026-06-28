'use client';

/**
 * TeslaDashboard — Tesla App Dashboard telemetry block.
 *
 * Renders a Tesla-style vehicle dashboard telemetry block (speed/charge/power/
 * range-style gauges) driven by a deterministic simulated live feed from
 * lib/telemetryFeed.ts.
 *
 * DATA BINDING: generateTeslaTelemetry() — sine-based live feed, ZERO Math.random().
 * Grounded in app/data/siteContent.ts featuredRepos[]:
 *   telemetry-server → tesla-api → ride-with-vic-app cluster.
 *
 * STABILISED: 30 Hz rAF throttle, no per-frame alloc, clean teardown.
 * Uses existing .telemetry-card / .telemetry-label / .telemetry-value classes
 * from globals.css to stay monochrome and consistent with TelemetryPanel (C1, C3).
 */

import React, { useEffect, useState } from 'react';
import { generateTeslaTelemetry, type TeslaReadout } from '@/lib/telemetryFeed';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';

const THROTTLE_MS = 1000 / 30; // 30 Hz

export function useTeslaTelemetry(enabled: boolean): TeslaReadout {
  const [state, setState] = useState<TeslaReadout>(() =>
    generateTeslaTelemetry(0),
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
        setState(generateTeslaTelemetry(t));
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

/** Simple CSS bar gauge driven by a 0–100 value. */
function BarGauge({
  value,
  max,
  label,
  unit,
  color = 'var(--accent-color)',
}: {
  value: number;
  max: number;
  label: string;
  unit: string;
  color?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ marginBottom: '0.6rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.2rem',
        }}
      >
        <span className="telemetry-label" style={{ marginBottom: 0 }}>
          {label}
        </span>
        <span
          style={{
            fontSize: '0.8rem',
            color: 'var(--white)',
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 600,
          }}
        >
          {value}{' '}
          <span style={{ fontSize: '0.65rem', color: 'var(--secondary-text)' }}>
            {unit}
          </span>
        </span>
      </div>
      <div className="telemetry-meter" style={{ height: '6px' }}>
        <span
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: '3px',
            transition: 'width 200ms var(--motion-ease-standard)',
          }}
        />
      </div>
    </div>
  );
}

export default React.memo(function TeslaDashboard({ project }: { project?: string }) {
  const prefersReducedMotion = useReducedMotionSafe();
  const telemetry = useTeslaTelemetry(!prefersReducedMotion);

  const displayData = prefersReducedMotion
    ? generateTeslaTelemetry(0)
    : telemetry;

  const { speed, charge, power, range, odometer } = displayData;

  return (
    <div
      className="telemetry-card tesla-dashboard"
      data-testid="tesla-dashboard"
      data-project={project}
    >
      <div className="telemetry-header">
        <div>
          <p className="eyebrow">Tesla App Dashboard</p>
          <h3 style={{ fontSize: '0.95rem', margin: '0.1rem 0 0', color: 'var(--white)' }}>
            Live Vehicle Telemetry
          </h3>
        </div>
        <div className="telemetry-badges">
          <span className="pill live">Live</span>
          <span className="pill accent">
            {speed} km/h
          </span>
        </div>
      </div>

      <div style={{ marginTop: '0.75rem' }}>
        <BarGauge
          value={speed}
          max={140}
          label="Speed"
          unit="km/h"
          data-testid="tesla-speed"
        />

        {/* Speed big readout */}
        <div
          style={{
            textAlign: 'center',
            margin: '0.75rem 0',
            padding: '0.5rem',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <span
            data-testid="tesla-speed"
            style={{
              fontSize: '2.2rem',
              fontWeight: 700,
              color: 'var(--white)',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            {speed}
          </span>
          <span
            style={{
              fontSize: '0.8rem',
              color: 'var(--secondary-text)',
              marginLeft: '0.3rem',
            }}
          >
            km/h
          </span>
          <div style={{ fontSize: '0.65rem', color: 'var(--secondary-text)', marginTop: '0.15rem' }}>
            Odometer: {odometer.toLocaleString()} km
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '0.5rem',
            marginTop: '0.5rem',
          }}
        >
          <div
            data-testid="tesla-charge"
            style={{
              textAlign: 'center',
              padding: '0.4rem',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '6px',
            }}
          >
            <div className="telemetry-label" style={{ marginBottom: '0.15rem' }}>
              Charge
            </div>
            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--white)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {charge}%
            </div>
            <div className="telemetry-meter" style={{ height: '3px', marginTop: '0.3rem' }}>
              <span
                style={{
                  width: `${charge}%`,
                  height: '100%',
                  background: 'var(--accent-color)',
                  borderRadius: '2px',
                  transition: 'width 200ms var(--motion-ease-standard)',
                }}
              />
            </div>
          </div>

          <div
            data-testid="tesla-power"
            style={{
              textAlign: 'center',
              padding: '0.4rem',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '6px',
            }}
          >
            <div className="telemetry-label" style={{ marginBottom: '0.15rem' }}>
              Power
            </div>
            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: power < 0 ? 'var(--steel)' : 'var(--white)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {power} kW
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--secondary-text)', marginTop: '0.15rem' }}>
              {power < 0 ? 'Regen' : 'Discharge'}
            </div>
          </div>

          <div
            data-testid="tesla-range"
            style={{
              textAlign: 'center',
              padding: '0.4rem',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '6px',
            }}
          >
            <div className="telemetry-label" style={{ marginBottom: '0.15rem' }}>
              Range
            </div>
            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--white)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {range}
            </div>
            <div
              style={{ fontSize: '0.65rem', color: 'var(--secondary-text)', marginTop: '0.15rem' }}
            >
              km est.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
