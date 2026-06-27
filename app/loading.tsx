'use client';

/**
 * loading.tsx — Next.js App Router loading state.
 *
 * Renders immediately as a Suspense fallback while the page chunk (and its
 * async dependencies: R3F Canvas components loaded via next/dynamic, GSAP
 * registration, etc.) resolve on the client.
 *
 * Monochrome, minimal — a single pulsing accent bar anchored to the top
 * edge so it reads as a progress affordance without a spinner. Font
 * tokens use CSS custom properties set by the root layout so they resolve
 * identically to the full page.
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

      <style jsx>{`
        .loading-shell {
          min-height: 100vh;
          min-height: 100dvh;
          background: var(--ink-900, #0A0B0D);
          color: var(--white, #F4F6FA);
          font-family: var(--font-inter, system-ui, sans-serif);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .loading-bar-track {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: rgba(174, 182, 194, 0.08);
          overflow: hidden;
        }

        .loading-bar-fill {
          height: 100%;
          width: 30%;
          background: var(--steel, #AEB6C2);
          border-radius: 0 1px 1px 0;
          animation: loading-slide 1.4s var(--motion-ease-standard, ease-in-out) infinite;
        }

        @keyframes loading-slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }

        .loading-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .loading-label {
          font-family: var(--font-space-grotesk, sans-serif);
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--steel, #AEB6C2);
          margin: 0;
          animation: loading-fade 2s ease-in-out infinite;
        }

        @keyframes loading-fade {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
