'use client';

import Reveal from '@/components/site/Reveal';
import { projectionDimensions } from '@/app/data/siteContent';

/**
 * MindsetProjection — #mindset section (FR-MINDSET, prompt §4). Projects the
 * balanced persona across four source-traceable dimensions: technical depth,
 * multi-million-dollar program scale, multi-year/decades sustained execution, and
 * multi-layered tangible value (≥2 of time saved / risk reduced / cost avoided).
 * Every claim is number-led and cites its source (NN-3 / TC-FR-MINDSET).
 */
export default function MindsetProjection() {
  return (
    <section id="mindset" className="mindset-section" aria-labelledby="mindset-title">
      <div className="container">
        <Reveal className="section-header">
          <h2 className="section-title" id="mindset-title">
            How I deliver, in numbers
          </h2>
          <p className="section-subhead">
            An outcome-focused, collaborative Agile profile — depth, scale, longevity and value,
            each traceable to the record.
          </p>
        </Reveal>
        <ul className="mindset-grid" role="list">
          {projectionDimensions.map((dimension, index) => (
            <li key={dimension.key} className="mindset-card" data-dimension={dimension.key}>
              <Reveal delay={index * 0.05}>
                <p className="mindset-label">{dimension.label}</p>
                <p className="mindset-claim">{dimension.claim}</p>
                {dimension.values && dimension.values.length > 0 && (
                  <ul className="mindset-values" role="list">
                    {dimension.values.map((value) => (
                      <li key={value} className="mindset-value" data-value-kind={value}>
                        {value}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mindset-source">{dimension.source}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
