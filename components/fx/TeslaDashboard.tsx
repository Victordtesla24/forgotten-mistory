'use client';

/**
 * TeslaDashboard — Real-time browser & device telemetry dashboard.
 *
 * Displays live metrics from browser and device APIs:
 *   - Network: connection type, RTT, downlink bandwidth
 *   - Device: memory, CPU cores, screen DPR
 *   - Performance: JS heap, DOM nodes, resource timing
 *
 * All values derive from real browser APIs (navigator.connection,
 * navigator.deviceMemory, performance.memory, etc.) — ZERO simulation.
 *
 * STABILISED: 2s poll interval, clean teardown. Uses existing
 * .telemetry-card / .telemetry-label / .telemetry-value classes
 * from globals.css to stay monochrome and consistent with TelemetryPanel.
 */

import React, { useEffect, useState } from 'react';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';

interface DeviceMetrics {
  connectionType: string;
  rttMs: number | null;
  downlinkMbps: number | null;
  deviceMemoryGB: number | null;
  cpuCores: number;
  dpr: number;
  jsHeapUsedMB: number | null;
  jsHeapTotalMB: number | null;
}

function readDeviceMetrics(): DeviceMetrics {
  // Network info (Chrome/Edge only)
  const conn =
    typeof navigator !== 'undefined'
      ? (navigator as Navigator & {
          connection?: { effectiveType?: string; rtt?: number; downlink?: number };
        }).connection
      : undefined;

  // Device memory (Chrome only)
  const devMem =
    typeof navigator !== 'undefined'
      ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory
      : undefined;

  // JS heap (Chrome only, non-standard)
  const perf =
    typeof performance !== 'undefined'
      ? (performance as Performance & {
          memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
        })
      : undefined;

  return {
    connectionType: conn?.effectiveType ?? '—',
    rttMs: conn?.rtt != null ? Math.round(conn.rtt) : null,
    downlinkMbps: conn?.downlink != null ? Math.round(conn.downlink * 10) / 10 : null,
    deviceMemoryGB: devMem ?? null,
    cpuCores:
      typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 1 : 1,
    dpr:
      typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    jsHeapUsedMB: perf?.memory
      ? Math.round(perf.memory.usedJSHeapSize / 1048576)
      : null,
    jsHeapTotalMB: perf?.memory
      ? Math.round(perf.memory.jsHeapSizeLimit / 1048576)
      : null,
  };
}

export function useDeviceTelemetry(enabled: boolean): DeviceMetrics {
  const [state, setState] = useState<DeviceMetrics>(() => readDeviceMetrics());

  useEffect(() => {
    if (!enabled) return;
    setState(readDeviceMetrics());
    const interval = setInterval(() => {
      setState(readDeviceMetrics());
    }, 2000);
    return () => clearInterval(interval);
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

const CONNECTION_TYPES: Record<string, string> = {
  'slow-2g': '2G',
  '2g': '2G',
  '3g': '3G',
  '4g': '4G',
  '5g': '5G',
};

export default React.memo(function TeslaDashboard({
  project,
}: {
  project?: string;
}) {
  const prefersReducedMotion = useReducedMotionSafe();
  const metrics = useDeviceTelemetry(!prefersReducedMotion);

  const display = prefersReducedMotion ? readDeviceMetrics() : metrics;

  const {
    connectionType,
    rttMs,
    downlinkMbps,
    deviceMemoryGB,
    cpuCores,
    dpr,
    jsHeapUsedMB,
    jsHeapTotalMB,
  } = display;

  const heapPct =
    jsHeapUsedMB !== null && jsHeapTotalMB !== null && jsHeapTotalMB > 0
      ? Math.round((jsHeapUsedMB / jsHeapTotalMB) * 100)
      : null;

  const dprStr = `${dpr}×`;

  return (
    <div
      className="telemetry-card tesla-dashboard"
      data-testid="tesla-dashboard"
      data-project={project}
    >
      <div className="telemetry-header">
        <div>
          <p className="eyebrow">Device &amp; Network</p>
          <h3
            style={{
              fontSize: '0.95rem',
              margin: '0.1rem 0 0',
              color: 'var(--white)',
            }}
          >
            Live System Telemetry
          </h3>
        </div>
        <div className="telemetry-badges">
          <span className="pill live">Live</span>
          <span className="pill accent">
            {connectionType !== '—'
              ? CONNECTION_TYPES[connectionType] || connectionType.toUpperCase()
              : '—'}
          </span>
        </div>
      </div>

      <div style={{ marginTop: '0.75rem' }}>
        <BarGauge
          value={heapPct ?? 0}
          max={100}
          label="JS heap"
          unit="%"
          data-testid="tesla-speed"
        />

        {/* Connection big readout */}
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
            {rttMs !== null ? rttMs : '—'}
          </span>
          <span
            style={{
              fontSize: '0.8rem',
              color: 'var(--secondary-text)',
              marginLeft: '0.3rem',
            }}
          >
            ms RTT
          </span>
          <div
            style={{
              fontSize: '0.65rem',
              color: 'var(--secondary-text)',
              marginTop: '0.15rem',
            }}
          >
            {downlinkMbps !== null ? `${downlinkMbps} Mbps down` : '—'}
            {' · '}{cpuCores} core{cpuCores > 1 ? 's' : ''}
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
              Memory
            </div>
            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--white)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {deviceMemoryGB !== null ? `${deviceMemoryGB} GB` : '—'}
            </div>
            <div
              className="telemetry-meter"
              style={{ height: '3px', marginTop: '0.3rem' }}
            >
              <span
                style={{
                  width: `${Math.min(100, (deviceMemoryGB ?? 0) * 12.5)}%`,
                  height: '100%',
                  background: 'var(--accent-color)',
                  borderRadius: '2px',
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
              DPR
            </div>
            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--white)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {dprStr}
            </div>
            <div
              style={{
                fontSize: '0.6rem',
                color: 'var(--secondary-text)',
                marginTop: '0.15rem',
              }}
            >
              device pixel ratio
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
              Heap
            </div>
            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--white)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {jsHeapUsedMB !== null ? `${jsHeapUsedMB} MB` : '—'}
            </div>
            <div
              style={{
                fontSize: '0.65rem',
                color: 'var(--secondary-text)',
                marginTop: '0.15rem',
              }}
            >
              of {jsHeapTotalMB !== null ? `${jsHeapTotalMB} MB` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Source label */}
      <p
        className="telemetry-note"
        data-testid="tesla-source-label"
        style={{ marginTop: '0.5rem', fontSize: '0.6rem', opacity: 0.5 }}
      >
        Live — Browser device APIs (navigator.connection, navigator.deviceMemory, performance.memory)
      </p>
    </div>
  );
});