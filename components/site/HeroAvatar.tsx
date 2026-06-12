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

    const onCanPlay = () => {
      if (cancelled) return;
      setVideoReady(true);
      video.play().catch(() => {
        /* Autoplay rejection is non-fatal; the static image remains. */
      });
    };
    video.addEventListener('canplay', onCanPlay);

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
      video.removeEventListener('canplay', onCanPlay);
      observer.disconnect();
      video.pause();
    };
  }, [prefersReducedMotion]);

  return (
    <div className="avatar-placeholder" id="avatar-container" ref={containerRef}>
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
