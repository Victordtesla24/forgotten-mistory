'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useAvatarSpeaking } from '@/lib/avatarContext';

import styles from './Hero.module.css';

/**
 * HeroPortrait — the original video portrait, mounted poster-first beside the
 * pitch (docs/delivery/evidence/v9-20260904T2312Z/B-research/02-hero-avatar-placement.md §4).
 *
 * Three rules:
 *
 * 1. **The poster is the content.** A `<picture>` (AVIF → WebP → PNG) is
 *    server-rendered at full opacity and never takes the hero's entrance, so
 *    it is the LCP candidate and it is what every reader sees, with or without
 *    JavaScript.
 * 2. **The loop is earned, never assumed.** The `<video>` ships with no `src`
 *    and no `autoplay`. A gate assigns the source only at ≥720 px, without
 *    `prefers-reduced-motion`, without `saveData`, after `load` and an idle
 *    slot, and only once the figure is a quarter in view. Out of view, a hidden
 *    tab, a reader's pause, or the MiniVic panel speaking all pause it.
 * 3. **Grey, always.** Both layers sit under one `filter: grayscale(1)` on the
 *    wrapper — the frames are warm sunset colour, and gold on this site means
 *    "this figure has a source".
 */

const LOOP_SRC = '/assets/my-hero-avatar.mp4';
const WIDE_QUERY = '(min-width: 720px)';
const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';
const IDLE_TIMEOUT_MS = 1200;
const IN_VIEW_RATIO = 0.25;
const FIRST_FRAME_S = 0.04;
const SEAM_WINDOW_S = 0.25;

// React 18.2 does not know the camelCase `fetchPriority` prop; the lowercase
// attribute reaches the DOM unchanged and Chromium honours it.
const PRIORITY_HINT = { fetchpriority: 'high' } as const;

type ConnectionLike = {
  saveData?: boolean;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
};

function connection(): ConnectionLike | undefined {
  return (navigator as Navigator & { connection?: ConnectionLike }).connection;
}

/** The gate's first condition: wide enough, motion allowed, no data saver. */
function loopAllowed(): boolean {
  return (
    window.matchMedia(WIDE_QUERY).matches &&
    !window.matchMedia(REDUCE_QUERY).matches &&
    connection()?.saveData !== true
  );
}

function afterLoad(callback: () => void): () => void {
  if (document.readyState === 'complete') {
    callback();
    return () => {};
  }
  window.addEventListener('load', callback, { once: true });
  return () => window.removeEventListener('load', callback);
}

function whenIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(() => callback(), { timeout: IDLE_TIMEOUT_MS });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, IDLE_TIMEOUT_MS);
  return () => window.clearTimeout(id);
}

function usePortraitPlayback(speaking: boolean) {
  const figureRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // `wide` keeps the <video> element mounted. It is true on the server so the
  // element is in the static HTML at ≥720 px; a phone drops it after mount.
  const [wide, setWide] = useState(true);
  // `eligible` renders the pause button: only a reader who can get motion
  // has anything to stop.
  const [eligible, setEligible] = useState(false);
  // `live` is the crossfade guard — playing, not paused, past the first frame,
  // with decoded pixels. `seam` dips the layer across the loop's join.
  const [live, setLive] = useState(false);
  const [seam, setSeam] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  const userPausedRef = useRef(false);
  const speakingRef = useRef(speaking);
  const inViewRef = useRef(false);
  const armedRef = useRef(false);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const dropSource = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    if (video.hasAttribute('src')) {
      video.removeAttribute('src');
      video.load();
    }
    setLive(false);
    setSeam(false);
  }, []);

  const tryPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !armedRef.current || !inViewRef.current) return;
    const blocked = () =>
      userPausedRef.current || speakingRef.current || document.hidden || !loopAllowed();
    if (blocked()) return;

    if (!video.hasAttribute('src')) {
      video.muted = true;
      video.defaultMuted = true;
      video.src = LOOP_SRC;
      video.load();
    }

    const start = () => {
      if (blocked() || !inViewRef.current) return;
      video.muted = true;
      video.play().catch(() => {
        // The poster is already showing; a refused play() changes nothing.
      });
    };
    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) start();
    else video.addEventListener('canplay', start, { once: true });
  }, []);

  // Eligibility, re-evaluated whenever a condition changes.
  useEffect(() => {
    const wideMq = window.matchMedia(WIDE_QUERY);
    const reduceMq = window.matchMedia(REDUCE_QUERY);
    const conn = connection();
    const evaluate = () => {
      setWide(wideMq.matches);
      const allowed = loopAllowed();
      setEligible(allowed);
      if (!allowed) dropSource();
    };
    evaluate();
    wideMq.addEventListener('change', evaluate);
    reduceMq.addEventListener('change', evaluate);
    conn?.addEventListener?.('change', evaluate);
    return () => {
      wideMq.removeEventListener('change', evaluate);
      reduceMq.removeEventListener('change', evaluate);
      conn?.removeEventListener?.('change', evaluate);
    };
  }, [dropSource]);

  // The gate: load → idle → intersection.
  useEffect(() => {
    if (!eligible || !wide) return undefined;
    const figure = figureRef.current;
    if (!figure) return undefined;

    let observer: IntersectionObserver | null = null;
    let cancelIdle = () => {};
    const cancelLoad = afterLoad(() => {
      cancelIdle = whenIdle(() => {
        armedRef.current = true;
        observer = new IntersectionObserver(
          (entries) => {
            const entry = entries[entries.length - 1];
            inViewRef.current = entry.isIntersecting && entry.intersectionRatio >= IN_VIEW_RATIO;
            if (inViewRef.current) tryPlay();
            else pause();
          },
          { threshold: [0, IN_VIEW_RATIO] },
        );
        observer.observe(figure);
      });
    });

    return () => {
      cancelLoad();
      cancelIdle();
      observer?.disconnect();
      armedRef.current = false;
      inViewRef.current = false;
    };
  }, [eligible, wide, tryPlay, pause]);

  // A hidden tab pauses; coming back resumes through the same gate.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) pause();
      else tryPlay();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [pause, tryPlay]);

  // One face does not talk in two places: while the panel speaks, the loop
  // rests on the poster.
  useEffect(() => {
    speakingRef.current = speaking;
    if (speaking) pause();
    else tryPlay();
  }, [speaking, pause, tryPlay]);

  // Playback state → crossfade. Re-bound when the element mounts or unmounts.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    video.muted = true;
    video.defaultMuted = true;

    const check = () => {
      const ok = !video.paused && video.currentTime > FIRST_FRAME_S && video.videoWidth > 0;
      setLive(ok);
      setSeam(
        ok &&
          Number.isFinite(video.duration) &&
          video.duration > 0 &&
          video.currentTime > video.duration - SEAM_WINDOW_S,
      );
    };
    const off = () => {
      setLive(false);
      setSeam(false);
    };
    video.addEventListener('playing', check);
    video.addEventListener('timeupdate', check);
    video.addEventListener('pause', off);
    video.addEventListener('ended', off);
    video.addEventListener('error', off);
    video.addEventListener('stalled', off);
    video.addEventListener('emptied', off);
    return () => {
      video.removeEventListener('playing', check);
      video.removeEventListener('timeupdate', check);
      video.removeEventListener('pause', off);
      video.removeEventListener('ended', off);
      video.removeEventListener('error', off);
      video.removeEventListener('stalled', off);
      video.removeEventListener('emptied', off);
    };
  }, [wide]);

  // The reader's pause wins over the observer's re-entry.
  const toggle = useCallback(() => {
    const next = !userPausedRef.current;
    userPausedRef.current = next;
    setUserPaused(next);
    if (next) pause();
    else tryPlay();
  }, [pause, tryPlay]);

  return { figureRef, videoRef, wide, eligible, live, seam, userPaused, toggle };
}

export default function HeroPortrait() {
  const speaking = useAvatarSpeaking();
  const { figureRef, videoRef, wide, eligible, live, seam, userPaused, toggle } =
    usePortraitPlayback(speaking);

  const videoClass = [
    styles.portraitVideo,
    live ? styles.portraitVideoLive : '',
    seam ? styles.portraitVideoSeam : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <figure ref={figureRef} className={styles.portrait} data-testid="hero-portrait">
      <div className={styles.portraitMedia}>
        <picture>
          <source srcSet="/assets/my_avatar.avif" type="image/avif" />
          <source srcSet="/assets/my_avatar.webp" type="image/webp" />
          <img
            src="/assets/my_avatar.png"
            width={1480}
            height={826}
            alt="Portrait of Vikram Deshpande"
            loading="eager"
            decoding="async"
            {...PRIORITY_HINT}
          />
        </picture>
        {wide && (
          <video
            ref={videoRef}
            className={videoClass}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            tabIndex={-1}
            disablePictureInPicture
            disableRemotePlayback
          />
        )}
      </div>
      {eligible && wide && (
        <button
          type="button"
          className={styles.portraitToggle}
          aria-pressed={userPaused}
          aria-label={userPaused ? 'Play the portrait' : 'Pause the portrait'}
          onClick={toggle}
        >
          <svg viewBox="0 0 14 14" aria-hidden="true" focusable="false">
            {userPaused ? (
              <path d="M4 2 L12 7 L4 12 Z" />
            ) : (
              <>
                <rect x="3" y="2" width="3" height="10" />
                <rect x="8" y="2" width="3" height="10" />
              </>
            )}
          </svg>
        </button>
      )}
    </figure>
  );
}
