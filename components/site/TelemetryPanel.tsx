'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useReducedMotion } from 'framer-motion';
import { ScrollTrigger } from '@/lib/gsap';
import { PALETTE } from '@/lib/palette';

const PanelDepthScene = dynamic(() => import('@/components/fx/PanelDepthScene'), {
  loading: () => <div className="r3f-loading-placeholder" />,
  ssr: false,
});
const SparklineGL = dynamic(() => import('@/components/fx/SparklineGL'), {
  loading: () => <div className="r3f-loading-placeholder" />,
  ssr: false,
});
import JarvisTelemetry from '@/components/fx/JarvisTelemetry';
import TeslaDashboard from '@/components/fx/TeslaDashboard';
const LOCATION_SETS: string[][] = [
  ['Melbourne \u00b7 Edge POP', 'Sydney \u00b7 API Gateway', 'Adelaide \u00b7 Vector cache'],
  ['Brisbane \u00b7 Edge POP', 'Perth \u00b7 Metric bus', 'Canberra \u00b7 Policy gate'],
  ['Auckland \u00b7 Edge POP', 'Melbourne \u00b7 Inference core', 'Sydney \u00b7 Vector cache'],
  ['Hobart \u00b7 Edge POP', 'Adelaide \u00b7 API Gateway', 'Darwin \u00b7 Heartbeat feed'],
];

const TICK_MS = 3200;
const ROLLING_WINDOW = 60;
const SPARK_W = 160;
const SPARK_H = 40;

function TelemetryValue({ value, format }: { value: number; format: (n: number) => string }) {
  return <>{format(value)}</>;
}

function useRealTelemetry(enabled: boolean) {
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(16.7);
  const [sparkHistory, setSparkHistory] = useState<number[]>(
    () => Array.from({ length: 28 }, () => 60),
  );

  useEffect(() => {
    if (!enabled) return;
    let raf: number;
    let last = performance.now();
    const fpsHistory: number[] = [];
    let running = true;

    const tick = (now: number) => {
      if (!running) return;
      const delta = now - last;
      last = now;
      if (delta > 0) {
        const instantFps = Math.round(1000 / delta);
        fpsHistory.push(Math.min(instantFps, 144));
        if (fpsHistory.length > ROLLING_WINDOW) fpsHistory.shift();
        const avgFps = Math.round(
          fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length,
        );
        setFps(avgFps);
        setFrameTime(Math.round(delta * 10) / 10);
        if (fpsHistory.length % 4 === 0) {
          setSparkHistory((prev) => [...prev.slice(1), avgFps]);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  return { fps, frameTime, sparkHistory };
}

function CanvasSparkline({
  data,
  width,
  height,
  className,
}: {
  data: number[];
  width: number;
  height: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef(data);
  const lastDrawRef = useRef(0);

  dataRef.current = data;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(
      typeof window !== 'undefined' ? window.devicePixelRatio : 1,
      1.5,
    );
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    let running = true;

    const draw = (now: number) => {
      if (!running) return;
      if (now - lastDrawRef.current < 1000 / 30) {
        requestAnimationFrame(draw);
        return;
      }
      lastDrawRef.current = now;

      const points = dataRef.current;
      ctx.clearRect(0, 0, width, height);

      if (points.length < 2) {
        requestAnimationFrame(draw);
        return;
      }

      const max = Math.max(...points);
      const min = Math.min(...points);
      const range = max - min || 1;

      ctx.beginPath();
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, PALETTE.accent + '47');
      grad.addColorStop(1, PALETTE.accent + '00');
      ctx.fillStyle = grad;
      ctx.moveTo(0, height);
      for (let i = 0; i < points.length; i++) {
        const x = (i / (points.length - 1)) * width;
        const y = height - ((points[i] - min) / range) * (height - 8) - 4;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = PALETTE.accent;
      ctx.lineWidth = 1.2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      for (let i = 0; i < points.length; i++) {
        const x = (i / (points.length - 1)) * width;
        const y = height - ((points[i] - min) / range) * (height - 8) - 4;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);

    return () => {
      running = false;
    };
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="panel-sparkline"
      width={width}
      height={height}
      className={className}
      aria-hidden="true"
    />
  );
}

const PHASE_TIMINGS = [0, 1200, 3500];

export default function TelemetryPanel() {
  const prefersReducedMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  const { fps, frameTime, sparkHistory } = useRealTelemetry(!prefersReducedMotion);

  const [locationIndex, setLocationIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const interval = window.setInterval(() => {
      setLocationIndex((prev) => (prev + 1) % LOCATION_SETS.length);
    }, TICK_MS);
    return () => window.clearInterval(interval);
  }, [prefersReducedMotion]);

  const uLoadRef = useRef(0);
  const [, redraw] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      uLoadRef.current = 1;
      return;
    }
    const section = document.getElementById('hero');
    if (!section) return;

    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top 60%',
      end: 'bottom 20%',
      scrub: 0.5,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        uLoadRef.current = self.progress;
      },
    });

    let running = true;
    let lastTick = 0;
    const poll = (now: number) => {
      if (!running) return;
      if (now - lastTick >= 1000 / 30) {
        lastTick = now;
        redraw((n) => n + 1);
      }
      requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);

    return () => {
      running = false;
      st.kill();
    };
  }, [prefersReducedMotion]);

  const [disclosurePhase, setDisclosurePhase] = useState(0);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    let visibleSince: number | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]!.isIntersecting) {
          if (visibleSince === null) visibleSince = performance.now();
        } else {
          visibleSince = null;
          setDisclosurePhase(0);
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);

    const timer = window.setInterval(() => {
      if (visibleSince === null) return;
      const elapsed = performance.now() - visibleSince;
      if (elapsed > PHASE_TIMINGS[2]) setDisclosurePhase(2);
      else if (elapsed > PHASE_TIMINGS[1]) setDisclosurePhase(1);
    }, 200);

    return () => {
      io.disconnect();
      window.clearInterval(timer);
    };
  }, []);

  const displayFps = prefersReducedMotion ? 60 : fps;
  const displayFt = prefersReducedMotion ? 16.7 : frameTime;
  const loadPct = Math.round(22 + uLoadRef.current * 63);
  const locations = LOCATION_SETS[locationIndex];

  const glSparkValues = useMemo(
    () =>
      sparkHistory.length >= 9
        ? sparkHistory
        : [...Array(9 - sparkHistory.length).fill(60), ...sparkHistory],
    [sparkHistory],
  );

  return (
    <div
      ref={panelRef}
      className="telemetry-panel glass-card"
      id="telemetry-panel"
      data-disclosure={disclosurePhase}
    >
      {!prefersReducedMotion && (
        <ErrorBoundary>
          <PanelDepthScene />
        </ErrorBoundary>
      )}
      <div className="telemetry-header">
        <div>
          <p className="eyebrow">Live Telemetry</p>
          <h3>System Status</h3>
        </div>
        <div className="telemetry-badges">
          <span className="pill soft">Demo data</span>
          <span className="pill accent">
            {displayFps} FPS \u00b7 {displayFt.toFixed(1)} ms
          </span>
        </div>
      </div>
      <div className="telemetry-grid">
        <div className="telemetry-card">
          <div className="telemetry-label">Browser render FPS</div>
          <div className="telemetry-value">
            {displayFps} <span className="telemetry-unit">fps</span>
          </div>
          {disclosurePhase >= 1 && (
            <div className="telemetry-spark-stack">
              <CanvasSparkline
                data={sparkHistory}
                width={SPARK_W}
                height={SPARK_H}
                className="telemetry-spark"
              />
              {!prefersReducedMotion && (
                <ErrorBoundary>
                  <SparklineGL values={glSparkValues} />
                </ErrorBoundary>
              )}
              <p className="telemetry-note">
                Real browser rAF delta \u2014 rolling {ROLLING_WINDOW}-frame window
              </p>
            </div>
          )}
          {disclosurePhase < 1 && (
            <div className="telemetry-spark-placeholder" aria-hidden="true">
              <p className="telemetry-note">Linger to reveal real-time FPS sparkline\u2026</p>
            </div>
          )}
        </div>

        <div className="telemetry-card">
          <div className="telemetry-label">Active visitors by region</div>
          <ul className="telemetry-list">
            {locations.map((location) => (
              <li key={location}>{location}</li>
            ))}
          </ul>
          <p className="telemetry-note">
            Simulated geo-feed rotates every few seconds.
          </p>
        </div>

        <div className="telemetry-card telemetry-dual">
          <div className="telemetry-dual-row">
            <div>
              <div className="telemetry-label">Server load</div>
              <div className="telemetry-value">
                <TelemetryValue value={loadPct} format={(n) => `${Math.round(n)}%`} />
              </div>
            </div>
            <div>
              <div className="telemetry-label">Frame time</div>
              <div className="telemetry-value">
                {displayFt.toFixed(1)}{' '}
                <span className="telemetry-unit">ms</span>
              </div>
            </div>
          </div>
          <div className="telemetry-meter">
            <span style={{ width: `${loadPct}%` }} />
          </div>
          <p className="telemetry-note">
            Load scrubbed by scroll progress \u2014 simulates system under demand.
          </p>
        </div>
      </div>

      {/* G2 — Project-bound telemetry: JARVIS Error-Management-System + Tesla App Dashboard.
           Both use deterministic sine-based live feeds (ZERO Math.random()), rendered
           alongside the browser perf-counter HUD in a composing layout (C3). */}
      <div className="telemetry-grid project-telemetry-grid">
        <JarvisTelemetry />
        <TeslaDashboard />
      </div>

      {disclosurePhase >= 2 && (
        <div className="telemetry-extra" data-testid="telemetry-extra">
          <div className="telemetry-extra-row">
            <span className="telemetry-extra-label">
              Render budget (30 Hz throttle)
            </span>
            <span className="telemetry-extra-value">active</span>
          </div>
          <div className="telemetry-extra-row">
            <span className="telemetry-extra-label">DPR cap</span>
            <span className="telemetry-extra-value">1.5\u00d7</span>
          </div>
          <div className="telemetry-extra-row">
            <span className="telemetry-extra-label">Post-FX</span>
            <span className="telemetry-extra-value">
              {prefersReducedMotion ? 'disabled (reduced motion)' : 'active'}
            </span>
          </div>
          <div className="telemetry-extra-row">
            <span className="telemetry-extra-label">Shader pipeline</span>
            <span className="telemetry-extra-value">
              holoRing + volumetricShaft
            </span>
          </div>
          <div className="telemetry-extra-row">
            <span className="telemetry-extra-label">WebGL errors</span>
            <span className="telemetry-extra-value">
              {prefersReducedMotion ? 'N/A (frozen)' : '0 \u2014 clean'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
