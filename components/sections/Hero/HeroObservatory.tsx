'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { heroVisualContent } from '@/app/data/portfolio/heroVisual';
import styles from './Hero.module.css';

type ObservatoryState = 'idle' | 'sampling' | 'complete' | 'unavailable';

interface TelemetrySnapshot {
  meanIntervalMs: number;
  elapsedSeconds: number;
  viewportWidth: number;
  viewportHeight: number;
  resourceCount: number | null;
  samples: number;
}

const MAX_FRAME_SAMPLES = 120;
const MAX_SAMPLE_MS = 5000;
const UI_UPDATE_MS = 250;

function readSessionSnapshot(meanIntervalMs: number, elapsedMs: number, samples: number): TelemetrySnapshot {
  const resources =
    typeof performance.getEntriesByType === 'function'
      ? performance.getEntriesByType('resource').length
      : null;
  return {
    meanIntervalMs,
    elapsedSeconds: elapsedMs / 1000,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    resourceCount: resources,
    samples,
  };
}

function formatTelemetry(snapshot: TelemetrySnapshot): string {
  return [
    'browser local sample from performance.now + requestAnimationFrame (rAF)',
    `mean frame interval ${snapshot.meanIntervalMs.toFixed(1)} ms`,
    `elapsed ${snapshot.elapsedSeconds.toFixed(2)} s`,
    `viewport ${snapshot.viewportWidth} × ${snapshot.viewportHeight} px`,
    snapshot.resourceCount === null
      ? heroVisualContent.observatory.resourceCountUnavailable
      : `session resource count ${snapshot.resourceCount}`,
    `${snapshot.samples} rAF intervals sampled`,
    heroVisualContent.observatory.sourceLabel,
  ].join(' · ');
}

export default function HeroObservatory() {
  const [state, setState] = useState<ObservatoryState>('idle');
  const [status, setStatus] = useState<string>(heroVisualContent.observatory.initialStatus);
  const stateRef = useRef<ObservatoryState>('idle');
  const rafRef = useRef<number | null>(null);
  const watchdogRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const lastFrameRef = useRef(0);
  const intervalSumRef = useRef(0);
  const intervalCountRef = useRef(0);
  const lastUiRef = useRef(0);
  const observatoryRef = useRef<HTMLDivElement | null>(null);

  const cancelSample = useCallback(() => {
    if (rafRef.current !== null && typeof window.cancelAnimationFrame === 'function') {
      window.cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = null;
    if (watchdogRef.current !== null) {
      window.clearTimeout(watchdogRef.current);
    }
    watchdogRef.current = null;
  }, []);

  const setSampleState = useCallback((next: ObservatoryState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const publish = useCallback((now: number, complete: boolean) => {
    const elapsed = now - startRef.current;
    const intervals = intervalCountRef.current;
    if (intervals <= 0) {
      setStatus(
        complete
          ? 'browser local sample ended before two requestAnimationFrame ticks; no interval value available.'
          : heroVisualContent.observatory.initialStatus,
      );
      return;
    }
    const snapshot = readSessionSnapshot(intervalSumRef.current / intervals, elapsed, intervals);
    setStatus(formatTelemetry(snapshot));
  }, []);

  const finish = useCallback(
    (now: number) => {
      cancelSample();
      publish(now, true);
      setSampleState('complete');
    },
    [cancelSample, publish, setSampleState],
  );

  const expireSample = useCallback(() => {
    if (stateRef.current !== 'sampling') return;
    cancelSample();
    const now = performance.now();
    const intervals = intervalCountRef.current;
    if (intervals <= 0) {
      setStatus('browser local sample reached the five-second limit before two requestAnimationFrame ticks; no interval value available.');
    } else {
      publish(now, true);
    }
    setSampleState('complete');
  }, [cancelSample, publish, setSampleState]);

  const tick = useCallback(
    (now: number) => {
      if (stateRef.current !== 'sampling') return;
      if (lastFrameRef.current > 0) {
        intervalSumRef.current += now - lastFrameRef.current;
        intervalCountRef.current += 1;
      }
      lastFrameRef.current = now;

      if (now - lastUiRef.current >= UI_UPDATE_MS) {
        publish(now, false);
        lastUiRef.current = now;
      }

      const elapsed = now - startRef.current;
      if (intervalCountRef.current >= MAX_FRAME_SAMPLES || elapsed >= MAX_SAMPLE_MS) {
        finish(now);
        return;
      }
      rafRef.current = window.requestAnimationFrame(tick);
    },
    [finish, publish],
  );

  const stop = useCallback(() => {
    if (stateRef.current !== 'sampling') return;
    finish(performance.now());
  }, [finish]);

  const start = useCallback(() => {
    if (
      typeof window.requestAnimationFrame !== 'function' ||
      typeof window.cancelAnimationFrame !== 'function' ||
      typeof performance.now !== 'function'
    ) {
      cancelSample();
      setStatus(heroVisualContent.observatory.unavailable);
      setSampleState('unavailable');
      return;
    }

    cancelSample();
    startRef.current = performance.now();
    lastFrameRef.current = 0;
    intervalSumRef.current = 0;
    intervalCountRef.current = 0;
    lastUiRef.current = startRef.current;
    setStatus('Sampling browser local requestAnimationFrame intervals…');
    setSampleState('sampling');
    watchdogRef.current = window.setTimeout(expireSample, MAX_SAMPLE_MS);
    rafRef.current = window.requestAnimationFrame(tick);
  }, [cancelSample, expireSample, setSampleState, tick]);

  const toggle = useCallback(() => {
    if (stateRef.current === 'sampling') stop();
    else start();
  }, [start, stop]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && stateRef.current === 'sampling') stop();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [stop]);

  useEffect(() => {
    const node = observatoryRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry && !entry.isIntersecting && stateRef.current === 'sampling') stop();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [stop]);

  useEffect(() => cancelSample, [cancelSample]);

  const label = state === 'sampling' ? heroVisualContent.observatory.stopLabel : heroVisualContent.observatory.startLabel;

  return (
    <div
      ref={observatoryRef}
      className={styles.observatory}
      data-testid="hero-observatory"
      data-state={state}
      role="region"
      aria-label={heroVisualContent.observatory.title}
    >
      <div className={styles.observatoryHeader}>
        <p className={styles.observatoryKicker}>{heroVisualContent.observatory.title}</p>
        <button
          type="button"
          className={styles.telemetryToggle}
          data-testid="telemetry-toggle"
          aria-label={label}
          onClick={toggle}
        >
          {label}
        </button>
      </div>
      <p className={styles.observatoryDescription}>{heroVisualContent.observatory.description}</p>
      <output className={styles.telemetryStatus} data-testid="telemetry-status">
        {status}
      </output>
    </div>
  );
}
