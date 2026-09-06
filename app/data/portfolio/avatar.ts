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
     * docs/architecture/ASSET-LADDER.md.
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
     * owner's hero video avatar, and the canonical path for the real loop.
     * 1280x720, 24 fps, 12.29 s, 1.9 MB, H.264, greyscale, no audio, encoded
     * from the genuine 3840x2160@24 master on this host
     * (artifacts/masters/minivic-greeting-2160p-master.mp4) — a downscale, never
     * an upscale. It stays the default and the fallback: it is the only rung on
     * the critical-path 2.5 MB video budget (TC-NFR-PERF), it is what a
     * save-data reader and a browser with no AV1 decoder receive, and it is
     * never on the critical path either — `preload="none"`, `src` assigned on
     * the reader's first hover, focus or press. The old `/assets/my-avatar.mp4`
     * name is a 301 in firebase.json — one binary, one URL.
     */
    src: '/assets/my-hero-avatar.mp4',
    width: 1280,
    height: 720,
    /**
     * The rungs, smallest first. `ladder[0]` is the base above; the two larger
     * encodes live under `public/assets/avatar/`, which the audit gives a 5 MB
     * on-demand budget because that `<video>` has no `src` until a reader asks
     * to play (scripts/validate/overhaul_static_audit.mjs, TC-NFR-PERF). All
     * three come from the one 2160p master by downscale — 2160p is the master's
     * own size, so nothing here is upscaled and no rung above it is claimed.
     * lib/videoRung.ts picks between them at play time by rendered height x DPR;
     * measured sizes, encoder settings and the R5 position are printed in
     * docs/architecture/ASSET-LADDER.md.
     *
     * R5 (3840x2160 @ 60 fps) remains OPEN: the master is 24 fps, and 24 real
     * frames are not made into 60 by interpolation.
     */
    ladder: [
      {
        height: 720,
        width: 1280,
        src: '/assets/my-hero-avatar.mp4',
        // H.264 High@3.1 — the floor every browser that plays video at all clears.
        type: 'video/mp4; codecs="avc1.64001F"',
      },
      {
        height: 1080,
        width: 1920,
        src: '/assets/avatar/my-hero-avatar-1080.mp4',
        // H.264 High@5.0, CRF 21 preset slow, greyscale, 3.52 MB measured.
        type: 'video/mp4; codecs="avc1.640032"',
      },
      {
        height: 2160,
        width: 3840,
        src: '/assets/avatar/my-hero-avatar-2160.webm',
        // AV1 Main@5.0, SVT-AV1 CRF 40 preset 8, greyscale, 2.78 MB measured —
        // the master's own resolution at a third of the 1080p H.264 bitrate.
        type: 'video/webm; codecs="av01.0.12M.08"',
      },
    ],
  },
  /**
   * The caption plate under the frame. The city is the same one the hero's
   * eyebrow prints (app/data/portfolio/hero.ts → `location`).
   */
  caption: 'Photograph · Melbourne',
} as const;
