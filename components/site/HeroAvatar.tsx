'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const VIDEO_SRC = '/assets/my-hero-avatar.mp4';

/**
 * Hero avatar: static picture that crossfades to a silent looping video once
 * the element is on screen and the video has enough data. The video element
 * pauses whenever the hero scrolls out of view to save main-thread and
 * battery budget.
 */
export default function HeroAvatar() {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);

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

  return (
    <div className="avatar-placeholder" id="avatar-container" ref={containerRef}>
      {/* HUD chrome tying the portrait to the JARVIS signature motif — corner
          brackets + a scan label so the right column carries real weight. */}
      <span className="avatar-frame" aria-hidden="true">
        <span className="hud-frame__corner hud-frame__corner--tl" />
        <span className="hud-frame__corner hud-frame__corner--tr" />
        <span className="hud-frame__corner hud-frame__corner--bl" />
        <span className="hud-frame__corner hud-frame__corner--br" />
      </span>
      <span className="avatar-tag" aria-hidden="true">SUBJECT · LIVE</span>
      <div className="avatar-circle relative overflow-hidden">
        <picture>
          <source srcSet="/assets/my_avatar.avif" type="image/avif" />
          <source srcSet="/assets/my_avatar.webp" type="image/webp" />
          <img
            src="/assets/my_avatar.png"
            alt="Portrait of Vikram Deshpande"
            className="avatar-img absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-700"
            style={{ opacity: videoReady ? 0 : 1 }}
            loading="eager"
            decoding="async"
          />
        </picture>
        <video
          ref={videoRef}
          className="avatar-img absolute inset-0 w-full h-full object-cover z-0"
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
