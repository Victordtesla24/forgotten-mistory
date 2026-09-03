'use client';

/**
 * error.tsx — Next.js App Router error boundary.
 *
 * Catches any unhandled runtime error in the route segment and renders a
 * monochrome recovery UI consistent with SPEC §3.1 (#0A0B0D ink, #F4F6FA
 * white, #AEB6C2 steel). The `reset` callback retries rendering the page
 * without a full browser reload (React ErrorBoundary semantics).
 *
 * This file MUST be a Client Component (Next.js enforces it).
 * Placed at app/error.tsx so it isolates errors to the root segment;
 * nested error.tsx files can provide finer-grained boundaries if needed.
 */

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to console in dev; in production a real error-reporting service
    // would be wired here (Sentry, Datadog RUM, etc.).
    console.error('[app/error.tsx] Unhandled error:', error);

    // Auto-recover once from *transient* errors (hydration/render races often
    // succeed on a pure client re-render). Guarded via sessionStorage so a
    // deterministic error can't loop: at most one silent retry per 10s window —
    // after that the visible "Try again" UI is shown. This stops a one-off
    // glitch from stranding a recruiter on "Something went wrong".
    try {
      const KEY = '__fm_error_autoretry_at';
      const now = Date.now();
      const last = Number(window.sessionStorage.getItem(KEY) || '0');
      if (now - last > 10_000) {
        window.sessionStorage.setItem(KEY, String(now));
        const t = window.setTimeout(() => reset(), 150);
        return () => window.clearTimeout(t);
      }
    } catch {
      // sessionStorage unavailable (private mode / blocked) — fall through to
      // the manual recovery UI below.
    }
  }, [error, reset]);

  return (
    <html lang="en">
      <body>
        <div className="error-boundary-page">
          <div className="error-boundary-card">
            {/* NN-2 monochrome HUD motif — corner ticks frame the message */}
            <div className="error-boundary-frame" aria-hidden="true">
              <span className="error-tick error-tick--tl" />
              <span className="error-tick error-tick--tr" />
              <span className="error-tick error-tick--bl" />
              <span className="error-tick error-tick--br" />
            </div>

            <div className="error-boundary-content">
              <p className="error-eyebrow">System interrupt</p>
              <h1 className="error-heading">Something went wrong</h1>
              <p className="error-message">
                An unexpected error occurred while rendering this page.
                The system state has been preserved and a recovery attempt
                is available.
              </p>

              {error.digest && (
                <p className="error-digest">
                  Ref: {error.digest}
                </p>
              )}

              <button
                className="error-reset-btn"
                onClick={() => reset()}
                type="button"
              >
                Try again
              </button>
            </div>
          </div>
        </div>

        <style jsx global>{`
          /* ── Error page — monochrome, consistent with SPEC §3.1 ── */
          .error-boundary-page {
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--ink-900, #0A0B0D);
            color: var(--white, #F4F6FA);
            font-family: var(--font-inter, system-ui, sans-serif);
            padding: 2rem;
          }

          .error-boundary-card {
            position: relative;
            max-width: 520px;
            width: 100%;
            background: var(--ink-800, #121317);
            border: 1px solid rgba(174, 182, 194, 0.12);
            border-radius: 16px;
            padding: 2.5rem 2rem;
          }

          /* Corner ticks — NN-2 signature motif */
          .error-boundary-frame {
            position: absolute;
            inset: 12px;
            pointer-events: none;
          }

          .error-tick {
            position: absolute;
            display: block;
            width: 16px;
            height: 16px;
            border-color: var(--steel, #AEB6C2);
            border-style: solid;
            border-width: 0;
            opacity: 0.4;
          }

          .error-tick--tl { top: 0; left: 0; border-top-width: 1px; border-left-width: 1px; }
          .error-tick--tr { top: 0; right: 0; border-top-width: 1px; border-right-width: 1px; }
          .error-tick--bl { bottom: 0; left: 0; border-bottom-width: 1px; border-left-width: 1px; }
          .error-tick--br { bottom: 0; right: 0; border-bottom-width: 1px; border-right-width: 1px; }

          .error-boundary-content {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            align-items: center;
            text-align: center;
          }

          .error-eyebrow {
            font-family: var(--font-plex-mono, ui-monospace, monospace);
            font-size: 0.7rem;
            font-weight: 500;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: var(--steel, #AEB6C2);
            margin: 0;
          }

          .error-heading {
            font-family: var(--font-serif, ui-serif, Georgia, serif);
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--white, #F4F6FA);
            margin: 0;
            line-height: 1.3;
          }

          .error-message {
            font-size: 0.9rem;
            line-height: 1.6;
            color: var(--steel, #AEB6C2);
            margin: 0;
            max-width: 380px;
          }

          .error-digest {
            font-family: var(--font-mono, monospace);
            font-size: 0.7rem;
            color: var(--steel, #AEB6C2);
            opacity: 0.6;
            margin: 0;
            word-break: break-all;
          }

          .error-reset-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.6rem 1.5rem;
            margin-top: 0.5rem;
            font-family: var(--font-inter, system-ui, sans-serif);
            font-size: 0.85rem;
            font-weight: 500;
            color: var(--ink-900, #0A0B0D);
            background: var(--accent, #E8EBF0);
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: opacity 150ms var(--motion-ease-standard, ease-out);
          }

          .error-reset-btn:hover {
            opacity: 0.85;
          }

          .error-reset-btn:focus-visible {
            outline: 2px solid var(--accent, #E8EBF0);
            outline-offset: 2px;
          }
        `}</style>
      </body>
    </html>
  );
}
