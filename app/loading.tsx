/**
 * loading.tsx — Next.js App Router loading state, and the page's height reservation.
 *
 * Renders immediately as a Suspense fallback while the page chunk (and its async
 * dependencies: R3F Canvas components loaded via next/dynamic, GSAP registration,
 * etc.) resolve on the client.
 *
 * PERF-03 / TC-HERO-15 — why the styles are not in this file.
 *
 * This component used to carry its own `<style jsx>` block, and in a static export
 * that block is emitted by styled-jsx's *client* runtime — never into the exported
 * HTML. `out/index.html` closes `</head>` at byte 4277 and the string `loading-shell`
 * appears exactly once after it, as a class attribute with no rule anywhere to match
 * it. So the fallback shipped unstyled: `min-height: 100vh` did not apply, the shell
 * painted 24 px tall, and `<footer>` — which the streaming shell emits *before*
 * `<main>` (byte 4744 against 8993) — painted at y = 24, inside the fold. When the
 * streamed page arrived the footer was pushed 11 600 px down and out of the viewport:
 * one layout-shift entry, sole source `footer.Footer_footer`, worth 0.1556 at 1440,
 * 0.1764 at 1280 and 0.2559 at 390 — three to five times the 0.05 budget, on every
 * cold visit, measured on an unskipped boot under a 6x CPU throttle.
 *
 * The reservation therefore has to come from a render-blocking stylesheet that is in
 * `<head>` before the first byte of `<body>` is laid out. `app/globals.css` owns the
 * `.loading-*` rules now, so the shell is a full viewport tall in the very first
 * painted frame and the footer starts below the fold — where moving it costs nothing,
 * because a shift is only scored for the part of an element inside the viewport.
 *
 * Keep this component free of `<style jsx>`. A style that arrives after the element
 * it sizes is not a style, it is a shift.
 */
export default function Loading() {
  return (
    <div className="loading-shell">
      {/* Subtle indeterminate progress bar pinned top — matches the
          scroll-progress motif on the live page */}
      <div className="loading-bar-track" aria-hidden="true">
        <div className="loading-bar-fill" />
      </div>

      {/* Lightweight placeholder — no heavy markup, no R3F context */}
      <div className="loading-center">
        <p className="loading-label">Loading portfolio</p>
      </div>
    </div>
  );
}
