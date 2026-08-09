"use client";

import { useState } from "react";

/**
 * Privacy-first, click-to-load YouTube facade (the "lite-youtube" pattern).
 *
 * A raw <iframe src="youtube.com/embed/…"> loads YouTube's full player plus
 * googleads.g.doubleclick.net / static.doubleclick.net ad-tracking scripts on
 * mount — off-brand for a restrained monochrome portfolio, a privacy leak for
 * visitors, and the source of the ERR_ABORTED request churn observed on load.
 *
 * Instead we render a monochrome poster button and only mount the iframe on an
 * explicit click, using the cookie-less `youtube-nocookie.com` host. Result: no
 * third-party tracker requests until the visitor opts in, faster first load, and
 * the section stays in palette until played. The facade is a real <button> so it
 * is keyboard-focusable and screen-reader labelled.
 */
export default function LiteYouTube({
  playlistId,
  title,
}: {
  playlistId: string;
  title: string;
}) {
  const [activated, setActivated] = useState(false);

  if (activated) {
    return (
      <iframe
        title={title}
        src={`https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}&autoplay=1&rel=0&modestbranding=1`}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      className="lite-yt-facade"
      aria-label={`Play ${title} — loads YouTube`}
      onClick={() => setActivated(true)}
    >
      <span className="lite-yt-play" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      <span className="lite-yt-label">Watch latest uploads</span>
    </button>
  );
}
