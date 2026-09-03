'use client';

import { useCallback, useState } from 'react';

import Caliper from '@/components/marks/Caliper';
import { aboutContent } from '@/app/data/portfolio/about';

import Compass from './Compass';
import styles from './About.module.css';

/**
 * About — the ten dimensions his own job-fit engine scores a candidate on,
 * answered one at a time.
 *
 * The interaction is a reading aid, not a toy: moving through the list turns
 * the compass so the current dimension sits at top-centre. Everything the
 * reader needs is in the list itself, so the section is complete with reduced
 * motion or with JavaScript switched off — in which case it is ten headings,
 * ten answers and a compass sitting at rest, which is the content.
 */
const DIMENSION_NAMES = aboutContent.dimensions.map((dimension) => dimension.name);
// Which side of the match each dimension is computed from. Seven from the
// candidate, three from the role — and the instrument draws that difference
// rather than flattening ten axes into one uniform ring.
const DIMENSION_SIDES = aboutContent.dimensions.map((dimension) => dimension.side);

export default function About() {
  const [active, setActive] = useState(-1);

  const clear = useCallback(() => setActive(-1), []);

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
          {/* The instrument. Sticky beside the list on a wide screen; on a phone
              it sits above the list and stops being sticky. */}
          <div className={styles.instrument}>
            <div className={styles.instrumentStage}>
              <Compass active={active} labels={DIMENSION_NAMES} sides={DIMENSION_SIDES} />
            </div>
            <p className={styles.instrumentCaption}>
              {active >= 0
                ? aboutContent.dimensions[active].name
                : 'Ten axes · no scores'}
            </p>

            {/* Two states, stated once, so nothing on the face has to be
                inferred. */}
            <dl className={styles.key}>
              <div className={styles.keyRow}>
                <dt className={styles.keySwatch} data-state="answered" aria-hidden="true" />
                <dd style={{ margin: 0 }}>
                  Seven axes the engine computes from the candidate — answered on this page.
                </dd>
              </div>
              <div className={styles.keyRow}>
                <dt className={styles.keySwatch} data-state="role" aria-hidden="true" />
                <dd style={{ margin: 0 }}>
                  Three it computes from the role. Nothing about a person to measure, so the
                  sector stays open.
                </dd>
              </div>
            </dl>
          </div>

          <ol className={styles.list} onMouseLeave={clear}>
            {aboutContent.dimensions.map((dimension, index) => (
              <li
                key={dimension.name}
                className={styles.item}
                data-active={active === index || undefined}
                data-side={dimension.side}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onBlur={clear}
                tabIndex={0}
              >
                <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
                <div className={styles.itemBody}>
                  <h3 className={styles.name}>
                    {dimension.name}
                    {dimension.side === 'role' && (
                      /* An open caliper: this dimension is computed from the job,
                         not the candidate, so there is nothing here that could
                         honestly be measured about a person. The mark says so
                         rather than leaving a gap that reads as an omission. */
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
                  <p className={styles.evidence}>{dimension.evidence}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
