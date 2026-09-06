/**
 * avatar.ts — the photograph, its loop, and the words printed beside it.
 *
 * MONOCHROME, 2026-09-06 (G-H6). docs/prompt.md §0.3-2 / C-8 allow black, white
 * and gold only, and gold means one thing: this figure has a source. The
 * chromatic exception this portrait held under the 09:10Z Owner instruction of
 * 2026-09-05 was failed by ADV-REVIEW-20260905T2315Z and is now RETIRED
 * (docs/architecture/PALETTE-EXCEPTIONS.md; orchestrator decision t_w1_h6h5
 * under §0.1). The grade lives in the shipped bytes — the stills and the loop
 * are re-encoded greyscale by scripts/assets/generate_hero_formats.mjs and
 * ffmpeg — never in a CSS filter over a colour file, because every palette gate
 * on this site reads code and none of them can see a raster asset.
 * tests/hero_assets_monochrome.test.mjs decodes the pixels and is what proves
 * it.
 *
 * Every string the portrait prints lives here — the component holds none.
 */

export const avatarContent = {
  still: {
    /**
     * 1480x826 greyscale master, measured with `identify`. AVIF 36 kB → WebP
     * 50 kB → PNG 472 kB, all three encoded from the same decoded buffer by
     * scripts/assets/generate_hero_formats.mjs so the formats cannot drift.
     * The PNG is the no-modern-format fallback and the schema image, held under
     * the 500 kB image budget by a 256-entry greyscale palette. 1480x826 is the
     * honest still ceiling on this host: no larger portrait still exists, and
     * nothing here is upscaled — see
     * docs/delivery/evidence/v10-20260905T0515Z/G2-H5/asset-ladder.md.
     */
    avif: '/assets/my_avatar.avif',
    webp: '/assets/my_avatar.webp',
    png: '/assets/my_avatar.png',
    width: 1480,
    height: 826,
    alt: 'Portrait of Vikram Deshpande',
  },
  loop: {
    /**
     * `/assets/my-hero-avatar.mp4` — the name docs/prompt.md §0.3-3 gives the
     * owner's hero video avatar, and now the canonical path for the real loop.
     * 1280x720, 24 fps, 12.29 s, 1.9 MB, H.264, greyscale, no audio, encoded
     * from the genuine 3840x2160@24 master on this host
     * (artifacts/masters/minivic-greeting-2160p-master.mp4) — a downscale, never
     * an upscale. 720p is the shipped rung because the site's video budget is
     * 2.5 MB (TC-NFR-PERF) and 1080p of this clip measures 4.36 MB; R5
     * (≥3840x2160 @ 60 fps) stays OPEN because the master is 24 fps. The old
     * `/assets/my-avatar.mp4` name is a 301 in firebase.json — one binary, one
     * URL. It is never on the critical path: `preload="none"`, and the `src` is
     * assigned on the reader's first hover, focus or press.
     */
    src: '/assets/my-hero-avatar.mp4',
    width: 1280,
    height: 720,
  },
  /**
   * The caption plate under the frame. The city is the same one the hero's
   * eyebrow prints (app/data/portfolio/hero.ts → `location`).
   */
  caption: 'Photograph · Melbourne',
} as const;
