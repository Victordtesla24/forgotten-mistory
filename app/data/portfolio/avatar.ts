/**
 * avatar.ts — the photograph, its loop, and the words printed beside it.
 *
 * Owner instruction, 2026-09-05 09:10Z: "Integrate my Photo with full size,
 * colours and dimension with creative decorations that match the website UI/UX
 * Design. Include a hover effect that plays the hero video avatar and not by
 * default." That instruction supersedes the site's grayscale treatment for this
 * one element (CLAUDE.md prime directive 4 governs *inks*; gold still means
 * "sourced" and appears nowhere in or around the figure).
 *
 * Every string the portrait prints lives here — the component holds none.
 */

export const avatarContent = {
  still: {
    /** 1480x826, measured with ffprobe. AVIF 41 kB → WebP 66 kB → PNG 179 kB. */
    avif: '/assets/my_avatar.avif',
    webp: '/assets/my_avatar.webp',
    png: '/assets/my_avatar.png',
    width: 1480,
    height: 826,
    alt: 'Portrait of Vikram Deshpande',
  },
  loop: {
    /**
     * 1280x720, 24 fps, 12.3 s, 1.1 MB — the same composition as the still
     * (landmarks measured frame-for-frame), at twice the pixels of the 640x360
     * hero loop. It is never on the critical path: `preload="none"`, and the
     * `src` is assigned on the reader's first hover, focus or press.
     */
    src: '/assets/my-avatar.mp4',
    width: 1280,
    height: 720,
  },
  /**
   * The caption plate under the frame. The city is the same one the hero's
   * eyebrow prints (app/data/portfolio/hero.ts → `location`).
   */
  caption: 'Photograph · Melbourne',
} as const;
