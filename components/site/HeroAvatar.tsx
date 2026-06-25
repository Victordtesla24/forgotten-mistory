'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

const VIDEO_SRC = '/assets/my-hero-avatar.mp4';

// Cinematic entrance: the chrome (frame → label) settles first, then the portrait
// rises into its lit frame. Crucially the portrait animates SCALE + Y only — never
// opacity-to-zero — because it is the hero LCP candidate (TC-UIUX-HERO-AVATAR).
const FRAME_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.05 } },
};
// x:'-50%' keeps the label centred against its `left:50%` anchor — framer writes the
// inline transform, so the centring lives here, not in CSS.
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
 * Hero avatar: a studio-grade instrument panel, not a flat picture. A still
 * portrait crossfades (spring) to a silent looping video once on-screen and the
 * video has genuinely advanced past its first frame; the video pauses whenever the
 * hero scrolls out of view to save main-thread + battery. Layered on top: a HUD
 * bracket frame, a glass subject label with a scan-line sweep, a cinematic entrance
 * stagger, and a magnetic 3D-tilt that follows the pointer. Every layer resolves to
 * its visible resting state under prefers-reduced-motion.
 */
export default function HeroAvatar() {
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

  return (
    <div
      className="avatar-placeholder"
      id="avatar-container"
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
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
