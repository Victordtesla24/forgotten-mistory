'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { avatarContent } from '@/app/data/portfolio/avatar';
import { useAvatarSpeaking } from '@/lib/avatarContext';

import styles from './Hero.module.css';

/**
 * HeroPortrait — the photograph, at full size and in full colour, with the loop
 * on the reader's intent and never before it.
 *
 * Owner instruction, 2026-09-05 09:10Z: "Integrate my Photo with full size,
 * colours and dimension with creative decorations that match the website UI/UX
 * Design. Include a hover effect that plays the hero video avatar and not by
 * default." That supersedes two earlier rules for this one element — the
 * grayscale filter (docs/delivery/evidence/v9-…/B-research/02-hero-avatar-
 * placement.md §4 "Monochrome") and the autoplay gate (§4 "Playback").
 *
 * Four rules now govern the file:
 *
 * 1. **The still is the content.** A `<picture>` (AVIF → WebP → PNG) is
 *    server-rendered at full opacity with its intrinsic 1480×826 on the `<img>`
 *    and an aspect box around it, so it is the LCP candidate, it costs no
 *    layout shift, and it is what every reader sees with or without JavaScript.
 * 2. **Nothing plays by default.** The `<video>` ships with no `src`, no
 *    `autoplay` and `preload="none"`. The source is assigned on the first
 *    pointer-enter, keyboard focus or press — never on load, never on scroll.
 *    A reader who only reads never fetches the 1.1 MB loop.
 * 3. **Colour is the photograph, and only the photograph.** No filter greys the
 *    frames; every rule, tick, plate and control around them is drawn in the
 *    site's achromatic inks. Gold is absent — it means "this figure has a
 *    source", and a portrait is not a sourced figure.
 * 4. **Reduced motion means no motion without a press.** Hover and focus do
 *    nothing there; the button still works, because a user's own action is
 *    allowed (WCAG 2.2.2), and it starts the loop with no fade.
 */

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

/** Corner order is drawing order, clockwise from the top-left. */
const CORNERS = ['tl', 'tr', 'br', 'bl'] as const;

// React 18.2 does not know the camelCase `fetchPriority` prop; the lowercase
// attribute reaches the DOM unchanged and Chromium honours it.
const PRIORITY_HINT = { fetchpriority: 'high' } as const;

/** `null` = follow hover/focus; `'on'`/`'off'` = the reader pressed the button. */
type Latch = 'on' | 'off' | null;

function motionAllowed(): boolean {
  return !window.matchMedia(REDUCE_QUERY).matches;
}

function usePortraitOnIntent(speaking: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  /** What the reader has asked for. Drives the button's `aria-pressed`. */
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

  /** Hover and focus are intent — but not for a reader who asked for less motion. */
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

  /** The button is authoritative: it overrides the pointer until the pointer leaves. */
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
      video.src = avatarContent.loop.src;
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

export default function HeroPortrait() {
  const speaking = useAvatarSpeaking();
  const { videoRef, wanted, live, arm, disarm, toggle } = usePortraitOnIntent(speaking);
  const { still, loop, caption } = avatarContent;

  return (
    <figure
      className={styles.portrait}
      data-testid="hero-portrait"
      onPointerEnter={arm}
      onPointerLeave={disarm}
      onFocus={(event) => {
        // Only keyboard focus arms the loop. A mouse press on the button is
        // handled by the button itself, and must not re-arm what it just stopped.
        const target = event.target as HTMLElement;
        if (typeof target.matches === 'function' && target.matches(':focus-visible')) arm();
      }}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        disarm();
      }}
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

          {/* The drafting frame: one hairline rule inset from the edge, with a
              caliper tick opening each corner, and a registration cross at the
              top right — the same language the caliper mark speaks. */}
          <span className={styles.portraitFrame} aria-hidden="true">
            {CORNERS.map((corner) => (
              <span
                key={corner}
                className={styles.portraitTick}
                data-testid="portrait-tick"
                data-corner={corner}
              />
            ))}
          </span>
          <span className={styles.portraitCross} aria-hidden="true" />

          <button
            type="button"
            className={styles.portraitToggle}
            aria-pressed={wanted}
            aria-label={wanted ? 'Pause the portrait' : 'Play the portrait'}
            onClick={toggle}
          >
            <svg viewBox="0 0 14 14" aria-hidden="true" focusable="false">
              {wanted ? (
                <>
                  <rect x="3" y="2" width="3" height="10" />
                  <rect x="8" y="2" width="3" height="10" />
                </>
              ) : (
                <path d="M4 2 L12 7 L4 12 Z" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <figcaption className={styles.portraitCaption} data-testid="portrait-caption">
        {caption}
      </figcaption>
    </figure>
  );
}
