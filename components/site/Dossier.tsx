'use client';

import Reveal from '@/components/site/Reveal';
import { dossier } from '@/app/data/siteContent';

/**
 * Dossier — the #dossier "leave-behind" section (NN-2 / TC-NN-2, prompt §2). Closes
 * the page so a visitor leaves with something concrete: a downloadable CV
 * dossier (the PDF) for BOTH first-class personas (employer + client), the
 * recurring monochrome signature motif, and a one-tap path to the live clone. Every
 * recall signature is number-led and traces back to the résumé-sourced proof data.
 */
export default function Dossier() {
  // Reach the always-mounted MiniVic clone launcher without prop-drilling: open it
  // only if its panel isn't already showing (idempotent).
  const openClone = () => {
    if (document.querySelector('[data-testid="minivic-panel"]')) return;
    document.querySelector<HTMLButtonElement>('[data-testid="minivic-toggle"]')?.click();
  };

  return (
    <section id="dossier" className="dossier-section" aria-labelledby="dossier-title">
      <div className="container">
        <Reveal className="section-header">
          <h2 className="section-title" id="dossier-title">
            Take the dossier with you
          </h2>
          <p className="section-subhead">
            One record, two audiences — download the CV, or ask the clone.
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="dossier-card">
            {/* Decorative HUD frame — corner brackets + a document label drawn AROUND
                the real content (the previous build rendered an empty 16:10 panel here,
                a ~740px void that read as a broken/unloaded screen). */}
            <span className="dossier-frame" aria-hidden="true">
              <span className="hud-frame__corner hud-frame__corner--tl" />
              <span className="hud-frame__corner hud-frame__corner--tr" />
              <span className="hud-frame__corner hud-frame__corner--bl" />
              <span className="hud-frame__corner hud-frame__corner--br" />
              <span className="dossier-frame__sheen" />
            </span>
            <p className="dossier-frame-label" aria-hidden="true">
              VIKRAM DESHPANDE · SCRUM MASTER / PROJECT MANAGER · DOSSIER
            </p>
            <div className="dossier-body">
              <Reveal stagger={0.08} variant="clip">
                <div className="dossier-headline">
                  <p className="dossier-name">{dossier.name}</p>
                  <p className="dossier-role">{dossier.role}</p>
                  <p className="dossier-summary">{dossier.summary}</p>
                </div>

                <ul className="dossier-highlights" role="list">
                  {dossier.highlights.map((highlight) => (
                    <li key={highlight} className="dossier-highlight">
                      {highlight}
                    </li>
                  ))}
                </ul>

                <div className="dossier-editions">
                  {dossier.editions.map((edition) => (
                    <div
                      key={edition.persona}
                      className="dossier-edition"
                      data-persona={edition.persona}
                    >
                      <p className="dossier-edition-label">{edition.label}</p>
                      <p className="dossier-edition-takeaway">{edition.takeaway}</p>
                      <a
                        href={dossier.downloadHref}
                        className="btn-link dossier-download"
                        data-dossier-download="true"
                        data-magnetic=""
                        data-cursor-label="Download"
                        download
                        target="_blank"
                        rel="noreferrer"
                      >
                        {dossier.downloadLabel}
                      </a>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn-primary dossier-clone"
                  data-dossier-clone="true"
                  data-magnetic=""
                  data-cursor-label="Ask the twin"
                  onClick={openClone}
                >
                  Ask my digital twin
                  <span className="dossier-clone-spark" aria-hidden="true" />
                </button>
              </Reveal>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
