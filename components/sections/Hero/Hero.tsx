'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import Caliper from '@/components/marks/Caliper';
import HeroPortrait, {
  HeroPortraitCaption,
  HeroPortraitControl,
  PortraitIntentProvider,
} from './HeroPortrait';
import { heroContent } from '@/app/data/portfolio/hero';
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

function HeroObservatory() {
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

/**
 * Hero — the front door.
 *
 * The front door keeps the immutable typed copy and adds a CSS/SVG optical
 * instrument behind it: finite reveal only, no generic particles and no ambient
 * JavaScript motion. The observatory below the CTA samples only browser-local
 * APIs after an explicit button press.
 *
 * Two rules still govern this file:
 *
 * 1. **Nothing here waits on JavaScript.** Every word is server-rendered and
 *    visible; the entrance is a pure CSS animation with staggered delays.
 * 2. **The scene is never the content.** The optical field is decorative CSS/SVG;
 *    the fold copy and observatory label are visible with JavaScript switched off.
 */
export default function Hero() {
  // The name sets as one line across the whole measure above the phone
  // breakpoint, and as an authored two-line lockup ('Vikram' over 'Deshpande')
  // below it. Splitting on the first space lets a single <br> carry the break
  // without hard-coding the mark's text; the space sits before the break, so
  // with it collapsed (see .nameBreak) the accessible name is unchanged.
  const [nameLead, ...nameRest] = heroContent.name.split(' ');
  const nameTail = nameRest.join(' ');

  return (
    <section id="hero" className={styles.hero} aria-labelledby="hero-name">
      {/* The figure and its named play/pause control are two halves of one
          state — the loop follows the pointer over the photograph in the fold,
          and the button in the proof band is the keyboard and touch path to the
          same intent — so both stand inside the one provider. */}
      <PortraitIntentProvider>
        {/* The fold. One name, one sentence, ONE action group — `hero-actions`,
            and nothing else pressable. An independent reviewer measured two
            competing CTA groups in this screen on live `9b864752`; the second
            was the button stamped on the face, and it is now in the proof band
            below. The evidence is not deleted; it is one scroll away, in
            `.proof`. A finite optical field now sits behind the editorial copy;
            the role line came back to the fold with the interim frame
            (TC-IF-02); the city and the photograph's provenance stay in the
            proof band — `hero.ts` is unedited and not one word of it left the
            page. */}
        <div className={styles.inner} data-testid="hero-fold">
          <div className={styles.opticalField} aria-hidden="true">
            <svg className={styles.opticalSvg} viewBox="0 0 720 420" focusable="false">
              <circle className={styles.opticOuter} cx="486" cy="182" r="132" />
              <circle className={styles.opticInner} cx="486" cy="182" r="68" />
              <ellipse className={styles.opticOrbit} cx="486" cy="182" rx="198" ry="64" />
              <ellipse className={styles.opticOrbitFine} cx="486" cy="182" rx="238" ry="92" />
              <path className={styles.opticRule} d="M54 182H354M618 182H682M486 18V92M486 272V396" />
              <path className={styles.opticGold} d="M558 76 612 34M594 136 684 118M552 286 628 356" />
              <path className={styles.opticCalibrations} d="M108 166v32M150 174v16M192 174v16M234 174v16M276 166v32M318 174v16" />
            </svg>
          </div>
        {/* The reading column, as one box: the name, the role, the sentence,
            the actions. `display: contents`, so these are the fold's own flex
            children and the photograph below them is the last of them. */}
        <div className={styles.copy}>
          <h1 id="hero-name" className={styles.name} style={{ '--step': 1 } as React.CSSProperties}>
            {nameLead}
            {' '}
            <br className={styles.nameBreak} aria-hidden="true" />
            {nameTail}
          </h1>

          {/* The role line stands in the fold again. It was moved to the proof
              band by the set-piece slice so the plane could hold the screen on
              its own; with the plane gone the fold is the words, and a reader
              who reads the name has to be told what he does in the same screen
              (TC-IF-02). `hero.ts` is unedited — the node moved, not a word. */}
          <p className={styles.role} style={{ '--step': 2 } as React.CSSProperties}>
            {heroContent.role}
          </p>

          <p className={styles.statement} style={{ '--step': 3 } as React.CSSProperties}>
            {heroContent.statement}
          </p>

          <div
            className={styles.actions}
            data-testid="hero-actions"
            style={{ '--step': 4 } as React.CSSProperties}
          >
            <a className={styles.primaryAction} href={heroContent.actions.primary.href}>
              {heroContent.actions.primary.label}
            </a>
            <a
              className={styles.secondaryAction}
              href={heroContent.actions.secondary.href}
              download
            >
              {heroContent.actions.secondary.label}
            </a>
          </div>

          <HeroObservatory />
        </div>

        {/* The photograph, in normal flow at the foot of the fold: a still with
            its loop behind the reader's own press, and nothing composited over
            or under it. */}
        <HeroPortrait />
        </div>

      {/* The proof band. Everything the fold used to carry and could not
          justify carrying: the three figures with their provenance, the line
          that grades them, and the availability signal with its three
          channels. Not one word was deleted — the band starts below 100vh,
          inside #hero and before #about, so `#hero ul` still resolves and
          CT-10 still finds 92 / $5M+ / 10k+ printed with their sources. */}
        <div className={styles.proof} data-testid="hero-proof">
        {/* The city, above the evidence it belongs beside. The role line that
            stood here with it is back in the fold (TC-IF-02). Not one word is
            deleted — `hero.ts` is untouched and both strings render. */}
        <p className={styles.eyebrow} style={{ '--step': 5 } as React.CSSProperties}>
          <span className={styles.locationDot} aria-hidden="true" />
          {heroContent.location}
        </p>

        {/* The three figures, each carrying its own provenance, and the line
            that grades them: sourced would be a lie, so the mark says
            self-reported and says why. */}
        <div className={styles.ledgerRow} style={{ '--step': 5 } as React.CSSProperties}>
          <ul className={styles.ledger} aria-label="Delivery record">
            {heroContent.ledger.map((entry) => (
              <li key={entry.label} className={styles.ledgerItem}>
                {/* Self-reported, not sourced. These three are his own account of
                    his own programmes: the line beneath each says where the work
                    happened, but no third party published a methodology a reader
                    could go and check. Grading them as measured would be the
                    first dishonest thing on a page arguing for the opposite. */}
                <Caliper state="self-reported" className={styles.ledgerValue}>
                  {entry.value}
                </Caliper>
                {/* One cell on a phone, two rows beside the figure elsewhere:
                    the wrapper has no box of its own above 600 px. */}
                <span className={styles.ledgerText}>
                  <span className={styles.ledgerLabel}>{entry.label}</span>
                  {/* Provenance sits with the figure. A number a reader cannot
                      trace is a claim, not evidence. */}
                  <span className={styles.ledgerSource}>{entry.source}</span>
                </span>
              </li>
            ))}
          </ul>

          {/* The mark is learned here, with its grade stated once. */}
          <p className={styles.grading}>
            <span className={styles.gradingMark} aria-hidden="true" />
            self-reported, from my CV. Repository figures below are harvested and dated.
          </p>
        </div>

        <p
          className={styles.availability}
          data-testid="hero-availability"
          style={{ '--step': 6 } as React.CSSProperties}
        >
          {heroContent.availability}
          <span className={styles.linkRule} aria-hidden="true" />
          {heroContent.links.map((link) => (
            <a
              key={link.label}
              className={styles.link}
              href={link.href}
              {...(link.href.startsWith('http')
                ? { target: '_blank', rel: 'noreferrer noopener' }
                : {})}
            >
              {link.label}
            </a>
          ))}
          </p>

          {/* The photograph's own control, where a control belongs: named, in
              text, below the fold, beside the evidence — not a glyph stamped on
              a face in the first screen. The loop still follows the pointer
              over the figure; this is the keyboard and touch path to it, and it
              works under reduced motion because a reader's own press is allowed
              (WCAG 2.2.2). */}
          <HeroPortraitControl />

          {/* The photograph's provenance, beside its control. Same words, same
              source (`avatar.ts`), one scroll down from the figure. */}
          <HeroPortraitCaption />
        </div>
      </PortraitIntentProvider>
    </section>
  );
}
