'use client';

import { useState } from 'react';

import Caliper from '@/components/marks/Caliper';
import { aboutContent } from '@/app/data/portfolio/about';
import { aboutVisualContent } from '@/app/data/portfolio/aboutVisual';

import styles from './About.module.css';

const SPOKE_COUNT = aboutContent.dimensions.length;
const COMPASS_RADIUS = 112;
const COMPASS_CENTER = 140;

function spokePoint(index: number, radius = COMPASS_RADIUS) {
  const angle = (index / SPOKE_COUNT) * Math.PI * 2 - Math.PI / 2;
  return {
    x: COMPASS_CENTER + Math.cos(angle) * radius,
    y: COMPASS_CENTER + Math.sin(angle) * radius,
  };
}

export default function About() {
  const [active, setActive] = useState(0);
  const selected = aboutContent.dimensions[active];
  const indicator = spokePoint(active, COMPASS_RADIUS - 8);

  return (
    <section id="about" className={styles.about} aria-labelledby="about-title">
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.kicker}>{aboutContent.kicker}</p>
          <h2 id="about-title" className={styles.title}>
            {aboutContent.title}
          </h2>
          {aboutContent.lede.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className={styles.lede}>
              {paragraph}
            </p>
          ))}
          <p className={styles.provenance}>
            {aboutContent.provenance.label}{' '}
            <a href={aboutContent.provenance.href} target="_blank" rel="noreferrer noopener">
              {aboutContent.provenance.repo}
            </a>
            <span className={styles.provenancePath}>{aboutContent.provenance.path}</span>
          </p>
        </header>

        <div className={styles.body}>
          <div
            className={styles.compass}
            data-testid="about-compass"
            data-active-index={active}
            role="region"
            aria-label={aboutVisualContent.compassLabel}
          >
            <div className={styles.compassPlate} aria-hidden="true">
              <svg className={styles.compassSvg} viewBox="0 0 280 280" focusable="false">
                <circle className={styles.compassOuter} cx={COMPASS_CENTER} cy={COMPASS_CENTER} r="118" />
                <circle className={styles.compassInner} cx={COMPASS_CENTER} cy={COMPASS_CENTER} r="48" />
                {aboutContent.dimensions.map((dimension, index) => {
                  const end = spokePoint(index);
                  const tick = spokePoint(index, COMPASS_RADIUS - 18);
                  return (
                    <g key={dimension.name} className={styles.spokeGroup} data-sourced={dimension.sourced}>
                      <line
                        className={styles.spoke}
                        x1={COMPASS_CENTER}
                        y1={COMPASS_CENTER}
                        x2={end.x}
                        y2={end.y}
                      />
                      <circle className={styles.spokeTick} cx={tick.x} cy={tick.y} r="3" />
                    </g>
                  );
                })}
                <line
                  className={styles.indicatorLine}
                  x1={COMPASS_CENTER}
                  y1={COMPASS_CENTER}
                  x2={indicator.x}
                  y2={indicator.y}
                />
                <circle className={styles.indicatorHub} cx={COMPASS_CENTER} cy={COMPASS_CENTER} r="5" />
                <circle className={styles.indicatorPoint} cx={indicator.x} cy={indicator.y} r="6" />
              </svg>
            </div>

            <div className={styles.compassControls} aria-label={aboutVisualContent.compassInstruction}>
              <p className={styles.compassKicker}>{aboutVisualContent.compassKicker}</p>
              {aboutContent.dimensions.map((dimension, index) => (
                <button
                  key={dimension.name}
                  type="button"
                  className={styles.dimensionButton}
                  data-testid="compass-dimension"
                  data-active={active === index || undefined}
                  data-sourced={dimension.sourced}
                  onPointerEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onClick={() => setActive(index)}
                >
                  <span className={styles.dimensionIndex}>{String(index + 1).padStart(2, '0')}</span>
                  <span>{dimension.name}</span>
                </button>
              ))}
            </div>

            <article className={styles.inspection} data-testid="compass-answer" aria-label={aboutVisualContent.answerLabel}>
              <p className={styles.inspectionMeta} data-sourced={selected.sourced}>
                {selected.sourced ? aboutVisualContent.sourcedLabel : aboutVisualContent.selfReportedLabel}
              </p>
              <h3 className={styles.inspectionTitle}>
                {selected.name}
                {selected.side === 'role' && (
                  <Caliper
                    state="open"
                    className={styles.sideTag}
                    label="Computed from the role, not the candidate; answered as what he looks for."
                  >
                    measured from the role
                  </Caliper>
                )}
              </h3>
              <p className={styles.answer}>{selected.answer}</p>
              <p className={styles.evidence} data-sourced={selected.sourced}>
                {selected.evidence}
              </p>
              <p className={styles.caveat}>
                {selected.side === 'role' ? aboutVisualContent.roleCaveat : aboutVisualContent.candidateCaveat}
              </p>
            </article>
          </div>

          <ol className={styles.list} aria-label={aboutVisualContent.listLabel}>
            {aboutContent.dimensions.map((dimension, index) => (
              <li
                key={dimension.name}
                className={styles.item}
                data-active={active === index || undefined}
                data-side={dimension.side}
              >
                <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
                <div className={styles.itemBody}>
                  <h3 className={styles.name}>
                    {dimension.name}
                    {dimension.side === 'role' && (
                      <Caliper
                        state="open"
                        className={styles.sideTag}
                        label="Computed from the role, not the candidate; answered as what he looks for."
                      >
                        measured from the role
                      </Caliper>
                    )}
                  </h3>
                  <p className={styles.answer}>{dimension.answer}</p>
                  <p className={styles.evidence} data-sourced={dimension.sourced}>
                    {dimension.evidence}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
