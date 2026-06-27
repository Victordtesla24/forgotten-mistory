'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { useAvatarSpeaking } from '@/lib/avatarContext';

const VIDEO_SRC = '/assets/my-hero-avatar.mp4';

// Cinematic entrance: the chrome (frame → label) settles first, then the portrait
// rises into its lit frame. Crucially the portrait animates SCALE + Y only — never
// opacity-to-zero — because it is the hero LCP candidate (TC-UIUX-HERO-AVATAR).
const FRAME_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.05 } },
};
const TAG_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 8, x: '-50%' },
  show: { opacity: 1, y: 0, x: '-50%', transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.18 } },
};
const PORTRAIT_VARIANTS: Variants = {
  hidden: { opacity: 1, scale: 1.06, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 20, delay: 0.1 } },
};

// Magnetic hover tilt envelope (±5deg) written to CSS custom props the .avatar-tilt
// transform reads. Kept tiny so the portrait feels responsive, not gimmicky.
const TILT_MAX_DEG = 5;

/**
 * R1 AVATAR — HeroAvatar with 3-tier video-avatar + speaking pulse hook.
 *
 * Zero-CLS: the .avatar-placeholder container has fixed dimensions (520×650 px
 * desktop, 340×440 px mobile) set in globals.css at layout time — the browser
 * reserves the box before any asset loads.
 *
 * Still→MP4 crossfade: the static <picture> renders at opacity 1 on LCP; once
 * the <video> genuinely plays past its first frame (>0.04 s), a spring animation
 * crossfades the still to 0 and the video to 1. On pause/error/scroll-out the
 * still returns.
 *
 * Speaking pulse: consumes AvatarSpeakingContext. When `speaking === true`,
 * a subtle ring glow pulses around the avatar circle. Disabled under
 * prefers-reduced-motion. MiniVicBot sets this via useSetAvatarSpeaking().
 */
export default function HeroAvatar() {
  const speaking = useAvatarSpeaking();
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tiltRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  // With reduced motion, skip the entrance entirely (`initial={false}` renders each
  // layer directly at its `show` state) so the audit/a11y path sees opacity:1 at once.
  const initial = prefersReducedMotion ? false : 'hidden';

  useEffect(() => {
    if (prefersReducedMotion) return;
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    let cancelled = false;

    // Only cross-fade FROM the still portrait TO the video once the video is
    // genuinely playing AND has advanced past its first frame. The previous
    // 'canplay' → ready flip fired far too early: the portrait faded to opacity 0
    // before the video had painted (and sometimes before it even had a src),
    // leaving a dark empty panel with no portrait at all. If the video stalls,
    // errors, or pauses (scrolled out of view), the still portrait returns.
    const startPlay = () =>
      video.play().catch(() => {
        /* Autoplay rejection is non-fatal; the static image remains. */
      });
    const showVideo = () => {
      if (!cancelled && !video.paused && video.currentTime > 0.04 && video.videoWidth > 0) {
        setVideoReady(true);
      }
    };
    const showImage = () => {
      if (!cancelled) setVideoReady(false);
    };
    video.addEventListener('canplay', startPlay);
    video.addEventListener('timeupdate', showVideo);
    video.addEventListener('pause', showImage);
    video.addEventListener('error', showImage);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!video.src) {
            video.src = VIDEO_SRC;
            video.load();
          } else {
            video.play().catch(() => {});
          }
        } else {
          video.pause();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(container);

    return () => {
      cancelled = true;
      video.removeEventListener('canplay', startPlay);
      video.removeEventListener('timeupdate', showVideo);
      video.removeEventListener('pause', showImage);
      video.removeEventListener('error', showImage);
      observer.disconnect();
      video.pause();
    };
  }, [prefersReducedMotion]);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (prefersReducedMotion) return;
      const tilt = tiltRef.current;
      const container = containerRef.current;
      if (!tilt || !container) return;
      const rect = container.getBoundingClientRect();
      // Normalise pointer to [-1, 1] across the panel, then map to ±TILT_MAX_DEG.
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      tilt.style.setProperty('--rx', `${(nx * TILT_MAX_DEG).toFixed(2)}deg`);
      tilt.style.setProperty('--ry', `${(-ny * TILT_MAX_DEG).toFixed(2)}deg`);
    },
    [prefersReducedMotion],
  );

  const handlePointerLeave = useCallback(() => {
    const tilt = tiltRef.current;
    if (!tilt) return;
    tilt.style.setProperty('--rx', '0deg');
    tilt.style.setProperty('--ry', '0deg');
  }, []);

  const showPulse = speaking && !prefersReducedMotion;

  return (
    <div
      className="avatar-placeholder"
      id="avatar-container"
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      data-speaking={speaking ? 'true' : 'false'}
    >
      {/* HUD chrome tying the portrait to the JARVIS signature motif — corner
          brackets + a glass scan label so the right column carries real weight. */}
      <motion.span className="avatar-frame" aria-hidden="true" variants={FRAME_VARIANTS} initial={initial} animate="show">
        <span className="hud-frame__corner hud-frame__corner--tl" />
        <span className="hud-frame__corner hud-frame__corner--tr" />
        <span className="hud-frame__corner hud-frame__corner--bl" />
        <span className="hud-frame__corner hud-frame__corner--br" />
      </motion.span>
      <motion.span className="avatar-tag" aria-hidden="true" variants={TAG_VARIANTS} initial={initial} animate="show">
        SUBJECT · LIVE
        <span className="avatar-tag__scan" aria-hidden="true" />
      </motion.span>
      <motion.div className="avatar-tilt-entrance" variants={PORTRAIT_VARIANTS} initial={initial} animate="show">
        <div className="avatar-tilt" ref={tiltRef}>
          <div className="avatar-glass" aria-hidden="true" />
          {/* R1 speaking pulse ring — a subtle glow that fades in when MiniVicBot
              is producing voice output. ZERO layout impact: absolutely positioned
              and sized 100% of the parent so it never shifts the reserved box. */}
          <div
            className="avatar-pulse-ring"
            data-testid="avatar-pulse-ring"
            aria-hidden="true"
            style={{ opacity: showPulse ? 1 : 0 }}
          />
          <div className="avatar-circle relative overflow-hidden">
            <picture>
              <source srcSet="/assets/my_avatar.avif" type="image/avif" />
              <source srcSet="/assets/my_avatar.webp" type="image/webp" />
              <motion.img
                src="/assets/my_avatar.png"
                alt="Portrait of Vikram Deshpande"
                className="avatar-img absolute inset-0 w-full h-full object-cover z-10"
                initial={false}
                animate={{ opacity: videoReady ? 0 : 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </picture>
            <motion.video
              ref={videoRef}
              className="avatar-img absolute inset-0 w-full h-full object-cover z-0"
              initial={false}
              animate={{ opacity: videoReady ? 1 : 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              muted
              loop
              playsInline
              preload="none"
              aria-hidden="true"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
