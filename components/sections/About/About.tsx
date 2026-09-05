'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';

import Caliper from '@/components/marks/Caliper';
import Scene from '@/components/gl/Scene';
import { aboutContent } from '@/app/data/portfolio/about';

import Compass from './Compass';
import styles from './About.module.css';

// The shader field behind the rose. Dynamic so `three` lands in the chunk
// `Scene` fetches when a scene actually mounts, not in this section's own
// module graph — the same arrangement `#experience` uses for CareerStrata.
const AboutField = dynamic(() => import('./AboutField'), { ssr: false });

/**
 * About — the ten dimensions his own job-fit engine scores a candidate on,
 * answered one at a time.
 *
 * The interaction is a reading aid, not a toy: the compass turns so the
 * dimension being read sits at top-centre. It follows the reader two ways —
 * the item crossing the middle of the viewport as they scroll, and the item
 * under the pointer, which overrides the scroll while it is there. Everything
 * the reader needs is in the list itself, so the section is complete with
 * reduced motion or with JavaScript switched off — in which case it is ten
 * headings, ten answers and a compass sitting at rest, which is the content.
 *
 * Keyboard: the ten items are not tab stops. They used to carry tabindex=0
 * with no role and no accessible name — ten dead stops between the heading
 * and the next real control. Nothing inside an item is interactive (the
 * answers are prose, the caliper is a mark), so there is nothing honest to
 * make focusable; the compass follows scroll instead, which is what a keyboard
 * reader does anyway. The only focusable element in the section is the
 * provenance link, and it has its own name.
 */
const DIMENSION_NAMES = aboutContent.dimensions.map((dimension) => dimension.name);
// Which side of the match each dimension is computed from. Seven from the
// candidate, three from the role — and the instrument draws that difference
// rather than flattening ten axes into one uniform ring.
const DIMENSION_SIDES = aboutContent.dimensions.map((dimension) => dimension.side);

/**
 * The band, as a fraction of the viewport trimmed off each end, inside which
 * an item counts as "being read". 45 % off the top and 45 % off the bottom
 * leaves the middle tenth.
 */
const CENTRE_BAND = '-45% 0px -45% 0px';
/**
 * How much of the *viewport* the section has to cover before the bezel sweeps
 * once. Expressed as a root margin rather than an intersection threshold,
 * because a threshold is a fraction of the section — and on a phone the list
 * runs to several screens, so 30 % of it can never be on screen at once and
 * the beat would never fire. Trimming 30 % off the bottom of the root means
 * "the section has climbed 30 % of the way up the screen", on any viewport.
 */
const ENTRY_MARGIN = '0px 0px -30% 0px';

export default function About() {
  // The item under the pointer, or -1. Wins over the scroll index while live.
  const [hovered, setHovered] = useState(-1);
  // The item crossing the viewport's centre band, or -1 when none is.
  const [centred, setCentred] = useState(-1);
  // Set once, the first time the section is 30 % on screen; never cleared.
  const [swept, setSwept] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const clearHover = useCallback(() => setHovered(-1), []);

  // Scroll-driven index. Each item is observed against a root shrunk to the
  // middle tenth of the viewport; of the items inside that band, the one whose
  // centre is nearest the viewport's centre is the one being read.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const items = itemRefs.current.filter((el): el is HTMLLIElement => el !== null);
    if (items.length === 0) return undefined;
    const inBand = new Set<HTMLLIElement>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const item = entry.target as HTMLLIElement;
          if (entry.isIntersecting) inBand.add(item);
          else inBand.delete(item);
        }
        const middle = window.innerHeight / 2;
        let nearest = -1;
        let nearestDistance = Number.POSITIVE_INFINITY;
        inBand.forEach((item) => {
          const rect = item.getBoundingClientRect();
          const distance = Math.abs((rect.top + rect.bottom) / 2 - middle);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = items.indexOf(item);
          }
        });
        setCentred(nearest);
      },
      { rootMargin: CENTRE_BAND, threshold: 0 },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  // One cinematic beat, once: the bezel sweeps a full turn the first time the
  // section comes into view, then settles on whatever the scroll says. The
  // `swept` flag is never reset, so leaving and returning does not replay it.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setSwept(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSwept(true);
          observer.disconnect();
        }
      },
      { rootMargin: ENTRY_MARGIN, threshold: 0 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const active = hovered >= 0 ? hovered : centred;

  return (
    <section
      id="about"
      ref={sectionRef}
      className={styles.about}
      aria-labelledby="about-title"
      data-swept={swept || undefined}
    >
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
              {/* The field the rose turns over: the same ten sectors, lit, on
                  the same index. It is behind the engraving and aria-hidden,
                  and it is not the content — with reduced motion or no WebGL
                  `Scene` mounts nothing and the instrument is unchanged. */}
              <div className={styles.field} data-axis={active}>
                <Scene className={styles.fieldSlot} sceneId="about-field">
                  <AboutField active={active} />
                </Scene>
              </div>
              <Compass active={active} labels={DIMENSION_NAMES} sides={DIMENSION_SIDES} sweep={swept} />
            </div>
            {/* The reading, then the constant. The argument — no scores — stays
                printed under the face whichever axis is being read. */}
            <p className={styles.instrumentCaption}>
              <span className={styles.instrumentReading}>
                {active >= 0 ? aboutContent.dimensions[active].name : '—'}
              </span>
              <span className={styles.instrumentConstant}>Ten axes · no scores</span>
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

          <ol className={styles.list} onMouseLeave={clearHover}>
            {aboutContent.dimensions.map((dimension, index) => (
              <li
                key={dimension.name}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                className={styles.item}
                data-active={active === index || undefined}
                data-side={dimension.side}
                onMouseEnter={() => setHovered(index)}
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
