'use client';

import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const LOCATION_SETS: string[][] = [
  ['Melbourne · Edge POP', 'Sydney · API Gateway', 'Adelaide · Vector cache'],
  ['Brisbane · Edge POP', 'Perth · Metric bus', 'Canberra · Policy gate'],
  ['Auckland · Edge POP', 'Melbourne · Inference core', 'Sydney · Vector cache'],
  ['Hobart · Edge POP', 'Adelaide · API Gateway', 'Darwin · Heartbeat feed'],
];

const TICK_MS = 3200;
const SPARK_POINTS = 9;

/** Deterministic pseudo-random walk so renders stay stable per session. */
function nextValue(previous: number, min: number, max: number, step: number, seed: number): number {
  const direction = Math.sin(seed * 12.9898) * 43758.5453;
  const fraction = direction - Math.floor(direction);
  const delta = (fraction - 0.5) * 2 * step;
  return Math.min(max, Math.max(min, previous + delta));
}

function buildSparkPath(values: number[], width = 160, height = 40): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = height - ((value - min) / range) * (height - 8) - 4;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

/**
 * Simulated system telemetry panel. All state lives in React with proper
 * interval cleanup; values follow a bounded random walk so the panel reads
 * as live without ever drifting out of its labelled envelope.
 */
export default function TelemetryPanel() {
  const prefersReducedMotion = useReducedMotion();
  const [latencyMs, setLatencyMs] = useState(180);
  const [loadPct, setLoadPct] = useState(32);
  const [coffee, setCoffee] = useState(1.0);
  const [locationIndex, setLocationIndex] = useState(0);
  const [sparkValues, setSparkValues] = useState<number[]>(
    () => Array.from({ length: SPARK_POINTS }, (_, i) => 175 + ((i * 7) % 18)),
  );

  useEffect(() => {
    if (prefersReducedMotion) return;
    let tick = 0;
    const interval = window.setInterval(() => {
      tick += 1;
      setLatencyMs((prev) => {
        const next = Math.round(nextValue(prev, 158, 204, 9, tick));
        setSparkValues((values) => [...values.slice(1), next]);
        return next;
      });
      setLoadPct((prev) => Math.round(nextValue(prev, 22, 58, 6, tick + 31)));
      setCoffee((prev) => Math.min(9.9, prev + 0.1));
      setLocationIndex((prev) => (prev + 1) % LOCATION_SETS.length);
    }, TICK_MS);
    return () => window.clearInterval(interval);
  }, [prefersReducedMotion]);

  const sparkPath = useMemo(() => buildSparkPath(sparkValues), [sparkValues]);
  const locations = LOCATION_SETS[locationIndex];

  return (
    <div className="telemetry-panel glass-card" id="telemetry-panel">
      <div className="telemetry-header">
        <div>
          <p className="eyebrow">Live Telemetry</p>
          <h3>System Status</h3>
        </div>
        <div className="telemetry-badges">
          <span className="pill soft">Simulated</span>
          <span className="pill accent">P95 {latencyMs} ms</span>
        </div>
      </div>
      <div className="telemetry-grid">
        <div className="telemetry-card">
          <div className="telemetry-label">Edge latency (ANZ)</div>
          <div className="telemetry-value">{(latencyMs / 1000).toFixed(3)} s</div>
          <svg className="telemetry-spark" viewBox="0 0 160 40" preserveAspectRatio="none" aria-hidden="true">
            <path d={sparkPath} />
          </svg>
          <p className="telemetry-note">Targets &lt; 200 ms at 10k+ device concurrency.</p>
        </div>
        <div className="telemetry-card">
          <div className="telemetry-label">Active visitors by region</div>
          <ul className="telemetry-list">
            {locations.map((location) => (
              <li key={location}>{location}</li>
            ))}
          </ul>
          <p className="telemetry-note">Geo feed rotates every few seconds.</p>
        </div>
        <div className="telemetry-card telemetry-dual">
          <div className="telemetry-dual-row">
            <div>
              <div className="telemetry-label">Server load</div>
              <div className="telemetry-value">{loadPct}%</div>
            </div>
            <div>
              <div className="telemetry-label">Coffee consumed</div>
              <div className="telemetry-value">{coffee.toFixed(1)} cups</div>
            </div>
          </div>
          <div className="telemetry-meter">
            <span style={{ width: `${loadPct}%` }} />
          </div>
          <p className="telemetry-note">Load is synthetic; caffeine is not.</p>
        </div>
      </div>
    </div>
  );
}
