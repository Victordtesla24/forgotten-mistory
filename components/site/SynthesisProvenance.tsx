'use client';

import Reveal from '@/components/site/Reveal';
import { synthesisSources } from '@/app/data/siteContent';

/**
 * SynthesisProvenance — #synthesis section (FR-SYNTH, prompt §4). Makes the
 * multi-source synthesis visible: every §6 source that was mined is listed with
 * a concrete fact rendered elsewhere on the site that traces back to it, so the
 * profile is evidence-led and never the résumé alone (NN-3 / TC-FR-SYNTH).
 */
export default function SynthesisProvenance() {
  return (
    <section id="synthesis" className="synthesis-section" aria-labelledby="synthesis-title">
      <div className="container">
        <Reveal className="section-header">
          <h2 className="section-title" id="synthesis-title">
            How this profile is sourced
          </h2>
          <p className="section-subhead">
            Every claim traces to a primary source — the résumé, the code, and the record — not
            the résumé alone.
          </p>
        </Reveal>
        <ul className="synthesis-grid" role="list">
          {synthesisSources.map((source, index) => (
            <li key={source.kind} className="synthesis-card" data-source-kind={source.kind}>
              <Reveal delay={index * 0.05}>
                <p className="synthesis-source">{source.label}</p>
                <p className="synthesis-mined">{source.mined}</p>
                <p className="synthesis-fact">{source.tracedFact}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
