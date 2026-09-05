'use client';

/**
 * not-found.tsx — Next.js App Router custom 404 page.
 *
 * Monochrome HUD motif consistent with SPEC §3.1 and app/error.tsx.
 * Renders when a route segment is not found (HTTP 404 equivalent).
 * No heavy dependencies — pure DOM + CSS custom properties from the root layout.
 */

export default function NotFound() {
  return (
    <html lang="en">
      <body>
        <div className="notfound-page">
          <div className="notfound-card">
            {/* NN-2 monochrome HUD motif — corner ticks frame the message */}
            <div className="notfound-frame" aria-hidden="true">
              <span className="notfound-tick notfound-tick--tl" />
              <span className="notfound-tick notfound-tick--tr" />
              <span className="notfound-tick notfound-tick--bl" />
              <span className="notfound-tick notfound-tick--br" />
            </div>

            <div className="notfound-content">
              <p className="notfound-eyebrow">Signal Lost</p>
              <h1 className="notfound-heading">404 — Page not found</h1>
              <p className="notfound-message">
                This route drifted beyond the warp corridor.
                The page you requested does not exist or has been relocated.
              </p>

              <a
                href="/"
                className="notfound-home-btn"
              >
                Return home
              </a>
            </div>
          </div>
        </div>

        <style jsx global>{`
          /* ── 404 page — monochrome, consistent with app/error.tsx ── */
          .notfound-page {
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--ink-900, #0A0A0A);
            color: var(--white, #F6F6F6);
            font-family: var(--font-inter, system-ui, sans-serif);
            padding: 2rem;
          }

          .notfound-card {
            position: relative;
            max-width: 520px;
            width: 100%;
            background: var(--ink-800, #131313);
            border: 1px solid rgba(174, 182, 194, 0.12);
            border-radius: 16px;
            padding: 2.5rem 2rem;
          }

          /* Corner ticks — NN-2 signature motif */
          .notfound-frame {
            position: absolute;
            inset: 12px;
            pointer-events: none;
          }

          .notfound-tick {
            position: absolute;
            display: block;
            width: 16px;
            height: 16px;
            border-color: var(--steel, #B8B8B8);
            border-style: solid;
            border-width: 0;
            opacity: 0.4;
          }

          .notfound-tick--tl { top: 0; left: 0; border-top-width: 1px; border-left-width: 1px; }
          .notfound-tick--tr { top: 0; right: 0; border-top-width: 1px; border-right-width: 1px; }
          .notfound-tick--bl { bottom: 0; left: 0; border-bottom-width: 1px; border-left-width: 1px; }
          .notfound-tick--br { bottom: 0; right: 0; border-bottom-width: 1px; border-right-width: 1px; }

          .notfound-content {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            align-items: center;
            text-align: center;
          }

          .notfound-eyebrow {
            font-family: var(--font-plex-mono, ui-monospace, monospace);
            font-size: 0.7rem;
            font-weight: 500;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: var(--steel, #B8B8B8);
            margin: 0;
          }

          .notfound-heading {
            font-family: var(--font-serif, ui-serif, Georgia, serif);
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--white, #F6F6F6);
            margin: 0;
            line-height: 1.3;
          }

          .notfound-message {
            font-size: 0.9rem;
            line-height: 1.6;
            color: var(--steel, #B8B8B8);
            margin: 0;
            max-width: 380px;
          }

          .notfound-home-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.6rem 1.5rem;
            margin-top: 0.5rem;
            font-family: var(--font-inter, system-ui, sans-serif);
            font-size: 0.85rem;
            font-weight: 500;
            color: var(--ink-900, #0A0A0A);
            background: var(--accent, #EBEBEB);
            border: none;
            border-radius: 8px;
            cursor: pointer;
            text-decoration: none;
            transition: opacity 150ms var(--motion-ease-standard, ease-out);
          }

          .notfound-home-btn:hover {
            opacity: 0.85;
          }

          .notfound-home-btn:focus-visible {
            outline: 2px solid var(--accent, #EBEBEB);
            outline-offset: 2px;
          }
        `}</style>
      </body>
    </html>
  );
}
