'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { avatarContent } from '@/app/data/portfolio/avatar';
import { useAvatarSpeaking } from '@/lib/avatarContext';
import { selectLoopSrc } from '@/lib/videoRung';

import styles from './Hero.module.css';

/**
 * HeroPortrait — the photograph, at full size and in the site's own monochrome,
 * with the loop on the reader's intent and never before it.
 *
 * Owner instruction, 2026-09-05 09:10Z: "Integrate my Photo with full size,
 * colours and dimension with creative decorations that match the website UI/UX
 * Design. Include a hover effect that plays the hero video avatar and not by
 * default." That supersedes two earlier rules for this one element — the
 * grayscale filter (docs/delivery/evidence/v9-…/B-research/02-hero-avatar-
 * placement.md §4 "Monochrome") and the autoplay gate (§4 "Playback").
 *
 * Five rules now govern the file:
 *
 * 1. **The still is the content.** A `<picture>` (AVIF → WebP → PNG) is
 *    server-rendered at full opacity with its intrinsic 1480×826 on the `<img>`
 *    and an aspect box around it, so it is the LCP candidate, it costs no
 *    layout shift, and it is what every reader sees with or without JavaScript.
 * 2. **Nothing plays by default.** The `<video>` ships with no `src`, no
 *    `autoplay` and `preload="none"`. The source is assigned on the first
 *    pointer-enter over the figure or press of the control — never on load,
 *    never on scroll.
 *    A reader who only reads never fetches the 1.1 MB loop.
 * 3. **The photograph is monochrome, and so is everything around it.** The
 *    chromatic exception this figure held is retired (G-H6, 2026-09-06): the
 *    stills and the loop are re-encoded greyscale assets, so no filter greys
 *    anything at render time — a `grayscale()` here would leave a colour file
 *    on the wire and TC-HERO-18 fails on one. Every rule, tick, plate and
 *    control around the frames is drawn in the site's achromatic inks. Gold is
 *    absent — it means "this figure has a source", and a portrait is not a
 *    sourced figure.
 * 4. **Reduced motion means no motion without a press.** Hover does nothing
 *    there; the control still works, because a user's own action is allowed
 *    (WCAG 2.2.2), and it starts the loop with no fade.
 * 5. **The figure is a figure, not a second call to action.** An independent
 *    reviewer measured the first fold on live `9b864752` and found two
 *    competing CTA groups in it — `hero-actions` and a `Play the portrait`
 *    button stamped on the photograph. A reader scanning the first screen was
 *    offered two things to press, and at 1440 and 1280 the one they could see
 *    was the wrong one. The photograph now carries no control at all: the loop
 *    follows the pointer over the figure, and the explicit, named play/pause
 *    control — the keyboard and touch path — stands in the proof band below
 *    the fold, beside the evidence. `PortraitIntentProvider` is what lets one
 *    state serve both places.
 */

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

// React 18.2 does not know the camelCase `fetchPriority` prop; the lowercase
// attribute reaches the DOM unchanged and Chromium honours it.
const PRIORITY_HINT = { fetchpriority: 'high' } as const;

/** `null` = follow the pointer; `'on'`/`'off'` = the reader pressed the control. */
type Latch = 'on' | 'off' | null;

function motionAllowed(): boolean {
  return !window.matchMedia(REDUCE_QUERY).matches;
}

function usePortraitOnIntent(speaking: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  /** What the reader has asked for. Drives the control's `aria-pressed`. */
  const [wanted, setWanted] = useState(false);
  /** What the element is actually doing. Drives the crossfade. */
  const [live, setLive] = useState(false);

  const wantedRef = useRef(false);
  const hoverRef = useRef(false);
  const latchRef = useRef<Latch>(null);
  const speakingRef = useRef(speaking);

  const resolve = useCallback(() => {
    const latch = latchRef.current;
    const asked = latch === 'on' ? true : latch === 'off' ? false : hoverRef.current;
    const next = asked && !speakingRef.current;
    wantedRef.current = next;
    setWanted(next);
  }, []);

  /** The pointer over the figure is intent — but not for a reader who asked for less motion. */
  const arm = useCallback(() => {
    if (!motionAllowed()) return;
    hoverRef.current = true;
    latchRef.current = null;
    resolve();
  }, [resolve]);

  const disarm = useCallback(() => {
    hoverRef.current = false;
    latchRef.current = null;
    resolve();
  }, [resolve]);

  /** The control is authoritative: it overrides the pointer until the pointer leaves. */
  const toggle = useCallback(() => {
    latchRef.current = wantedRef.current ? 'off' : 'on';
    resolve();
  }, [resolve]);

  // Intent → the element. The source is assigned here, on the first `true`.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    if (!wanted) {
      video.pause();
      return undefined;
    }

    video.muted = true;
    video.defaultMuted = true;
    if (!video.getAttribute('src')) {
      // G-H5: the rung is chosen here, at the moment of play, because only now
      // does the box have a measured height — the 720p file is the default and
      // the fallback, and a hi-DPI or save-data reader is answered by
      // lib/videoRung.ts rather than by a single one-size-fits-none encode.
      video.src = selectLoopSrc(avatarContent.loop.ladder, video);
      video.load();
    }

    const start = () => {
      if (!wantedRef.current) return;
      video.muted = true;
      video.play().catch(() => {
        // The still is already showing; a refused play() changes nothing.
      });
    };
    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) start();
    else video.addEventListener('canplay', start, { once: true });

    return () => video.removeEventListener('canplay', start);
  }, [wanted]);

  // Playback state → the crossfade. `live` is only true with decoded pixels on
  // screen, so the fade never reveals an empty layer.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    const on = () => setLive(!video.paused && video.videoWidth > 0);
    const off = () => setLive(false);
    video.addEventListener('playing', on);
    video.addEventListener('timeupdate', on);
    video.addEventListener('pause', off);
    video.addEventListener('ended', off);
    video.addEventListener('error', off);
    video.addEventListener('stalled', off);
    video.addEventListener('emptied', off);
    return () => {
      video.removeEventListener('playing', on);
      video.removeEventListener('timeupdate', on);
      video.removeEventListener('pause', off);
      video.removeEventListener('ended', off);
      video.removeEventListener('error', off);
      video.removeEventListener('stalled', off);
      video.removeEventListener('emptied', off);
    };
  }, []);

  // A hidden tab stops it; the reader's intent survives the trip.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) videoRef.current?.pause();
      else if (wantedRef.current) videoRef.current?.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // One face does not talk in two places: while the MiniVic panel speaks, the
  // loop rests on the still.
  useEffect(() => {
    speakingRef.current = speaking;
    resolve();
  }, [speaking, resolve]);

  return { videoRef, wanted, live, arm, disarm, toggle };
}

type PortraitIntent = ReturnType<typeof usePortraitOnIntent>;

/**
 * One state, two places in the DOM. The figure stands in the fold and the named
 * control stands in the proof band below it, so the state that joins them
 * cannot live in either — it lives here, in a provider that wraps both bands
 * and nothing else. `<Scene>` is deliberately left outside it in Hero.tsx: a
 * pointer crossing the photograph must not re-render the shader's React tree.
 */
const PortraitIntentContext = createContext<PortraitIntent | null>(null);

function usePortraitIntent(): PortraitIntent {
  const value = useContext(PortraitIntentContext);
  if (!value) {
    throw new Error('HeroPortrait and HeroPortraitControl must sit inside <PortraitIntentProvider>.');
  }
  return value;
}

export function PortraitIntentProvider({ children }: { children: ReactNode }) {
  const speaking = useAvatarSpeaking();
  const { videoRef, wanted, live, arm, disarm, toggle } = usePortraitOnIntent(speaking);
  // Identity changes only when something a consumer renders changes.
  const value = useMemo(
    () => ({ videoRef, wanted, live, arm, disarm, toggle }),
    [videoRef, wanted, live, arm, disarm, toggle],
  );
  return <PortraitIntentContext.Provider value={value}>{children}</PortraitIntentContext.Provider>;
}

/**
 * The play/pause control — a named, keyboard-operable button standing in the
 * proof band, under the fold, beside the evidence rather than stamped on the
 * face. It is the keyboard and touch path to the loop; the pointer path is the
 * figure itself. It is rendered at every width and under reduced motion: a
 * reader's own press is allowed however little motion they asked for
 * (WCAG 2.2.2).
 */
export function HeroPortraitControl() {
  const { wanted, toggle } = usePortraitIntent();
  const label = wanted ? 'Pause the portrait' : 'Play the portrait';

  return (
    <p className={styles.portraitControlRow}>
      <button
        type="button"
        className={styles.portraitControl}
        data-testid="portrait-control"
        aria-pressed={wanted}
        aria-label={label}
        onClick={toggle}
      >
        <svg className={styles.portraitControlGlyph} viewBox="0 0 14 14" aria-hidden="true" focusable="false">
          {wanted ? (
            <>
              <rect x="3" y="2" width="3" height="10" />
              <rect x="8" y="2" width="3" height="10" />
            </>
          ) : (
            <path d="M4 2 L12 7 L4 12 Z" />
          )}
        </svg>
        <span aria-hidden="true">{label}</span>
      </button>
    </p>
  );
}

export default function HeroPortrait() {
  const { videoRef, live, arm, disarm } = usePortraitIntent();
  const { still, loop, caption } = avatarContent;

  return (
    <figure
      className={styles.portrait}
      data-testid="hero-portrait"
      onPointerEnter={arm}
      onPointerLeave={disarm}
    >
      <div className={styles.portraitStage}>
        {/* The light the photograph sits in: one achromatic bloom behind the
            frame and the plate, so the figure reads as lit rather than pasted
            onto black. Tokens only — no hue enters here. */}
        <span className={styles.portraitGlow} data-testid="portrait-glow" aria-hidden="true" />

        <div className={styles.portraitMedia}>
          <picture>
            <source srcSet={still.avif} type="image/avif" />
            <source srcSet={still.webp} type="image/webp" />
            <img
              src={still.png}
              width={still.width}
              height={still.height}
              alt={still.alt}
              loading="eager"
              decoding="async"
              {...PRIORITY_HINT}
            />
          </picture>

          <video
            ref={videoRef}
            className={[styles.portraitVideo, live ? styles.portraitVideoLive : ''].filter(Boolean).join(' ')}
            width={loop.width}
            height={loop.height}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            tabIndex={-1}
            disablePictureInPicture
            disableRemotePlayback
          />

          {/* HERO-FOLD-v2 §5.1 / decision D-3 (g2h1-04): the photograph loses
              its card. The hairline rule, the four caliper ticks and the
              registration cross are gone from the fold — a closed rectangle with
              registration marks is a card beside a column, which is exactly what
              the 1451Z reviewer called out. The drafting language survives where
              it belongs, on the caliper mark and in the proof band; here the
              media box's outer edges dissolve into the light through a composite
              mask on `.portraitMedia` (Hero.module.css), so the figure reads as a
              body standing in the plane rather than an object framed beside it.
              Nothing pressable is added: the figure is a figure, not a call. */}
        </div>
      </div>

      <figcaption className={styles.portraitCaption} data-testid="portrait-caption">
        {caption}
      </figcaption>
    </figure>
  );
}
