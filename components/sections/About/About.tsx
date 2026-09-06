'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import Caliper from '@/components/marks/Caliper';
import { aboutContent } from '@/app/data/portfolio/about';

import styles from './About.module.css';

/**
 * About — the ten dimensions his own job-fit engine scores a candidate on,
 * answered one at a time.
 *
 * INTERIM FRAME (docs/architecture/INTERIM-FRAME.md, Owner 2026-09-06T05:51Z).
 * The compass, the shader field it stood on, the reading caption under its face
 * and the two-line key are removed; the section is the heading, the two
 * paragraphs, the provenance line and the ten rows on a near-black ground. Not
 * one word of `app/data/portfolio/about.ts` changed, and every caliper mark on
 * the three role-side dimensions is unchanged.
 *
 * The row the reader is on still marks itself — the item crossing the middle of
 * the viewport as they scroll, and the item under the pointer, which overrides
 * the scroll while it is there. That is a reading aid on the type itself, not
 * an instrument: with reduced motion, with no WebGL, or with JavaScript off it
 * is ten headings and ten answers, which is the content.
 *
 * Keyboard: the ten items are not tab stops. Nothing inside an item is
 * interactive (the answers are prose, the caliper is a mark), so there is
 * nothing honest to make focusable; the only focusable element in the section is
 * the provenance link, and it has its own name.
 */
/**
 * The band, as a fraction of the viewport trimmed off each end, inside which
 * an item counts as "being read". 45 % off the top and 45 % off the bottom
 * leaves the middle tenth.
 */
const CENTRE_BAND = '-45% 0px -45% 0px';
export default function About() {
  // The item under the pointer, or -1. Wins over the scroll index while live.
  const [hovered, setHovered] = useState(-1);
  // The item crossing the viewport's centre band, or -1 when none is.
  const [centred, setCentred] = useState(-1);
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

  const active = hovered >= 0 ? hovered : centred;

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
                  {/* Gold is the site's one claim mark: this line names the
                      record behind the answer above it, so where that record
                      is checkable the line carries the mark. Where the
                      "evidence" is an intention rather than a record it stays
                      grey — the flag is on the data, not the styling, so the
                      two can never drift apart. */}
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
