'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import Caliper from '@/components/marks/Caliper';
import Bench from './Bench';
import { cvFingerprint } from '@/app/data/generated/cv-fingerprint';
import {
  capabilities,
  skillsContent,
  statusLegend,
  type EvidenceStatus,
} from '@/app/data/portfolio/skills';

import styles from './Skills.module.css';

type Filter = 'all' | 'production' | 'pending';

/**
 * Skills & Certifications — a calibration card, not a skill cloud.
 *
 * The section is a real `<table>`: capability, the evidence, where it was
 * measured, and a status that describes the *environment* the evidence comes
 * from rather than how good he is at the thing. A row without evidence does not
 * appear at all.
 *
 * The row that does the most work is the last one. `AWS and GCP — studying; no
 * certificate issued` is on the CV, and printing it as an open bracket rather
 * than blurring it into the list is what makes every row above it credible.
 *
 * Motion here is deliberately nil beyond the card's own fade. The section before
 * this one scrubs a sixteen-year chart; this one is meant to be flat, dense and
 * silent. Filtering hides rows with the `hidden` attribute inside a fixed-height
 * container, so nothing on the page moves when the reader uses it.
 */
export default function Skills() {
  const [filter, setFilter] = useState<Filter>('all');
  // Which capability the bench above currently has under attention. The record
  // marks that row rather than filtering to it: a table that emptied itself as
  // the reader moved across a diagram would be unusable.
  const [traced, setTraced] = useState<number | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [floor, setFloor] = useState<number>();

  // Filtering hides rows, which would shorten the card and pull the rest of the
  // page up under the reader's cursor. The unfiltered table is by definition the
  // tallest state, so its height is measured and held as a floor on the WRAPPER,
  // not on the table itself: a min-height on the measured element inflates the
  // very number being measured, and the floor then ratchets upward every time
  // the observer fires. Re-measured on resize, because the row heights depend on
  // how the evidence text wraps — and on whether the web font has landed yet.
  useLayoutEffect(() => {
    const table = tableRef.current;
    if (!table) return undefined;

    const measure = () => {
      if (filter !== 'all') return;
      setFloor(table.getBoundingClientRect().height);
    };
    measure();

    // The first measurement happens before the web fonts land, and the fallback
    // face wraps the evidence column differently — so the floor taken at mount
    // can be several rows too tall. Re-measure once the real faces are ready.
    let cancelled = false;
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        if (!cancelled) measure();
      });
    }

    const observer = new ResizeObserver(measure);
    observer.observe(table);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [filter]);

  const visible = useMemo(
    () =>
      capabilities.filter((row) => {
        if (filter === 'all') return true;
        if (filter === 'production') return row.status === 'production';
        return row.status === 'pending';
      }),
    [filter],
  );

  return (
    <section id="skills" className={styles.skills} aria-labelledby="skills-title">
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.kicker}>{skillsContent.kicker}</p>
          <h2 id="skills-title" className={styles.title}>
            {skillsContent.title}
          </h2>
          <p className={styles.lede}>{skillsContent.lede}</p>
        </header>

        {/* The instrument, then the certificate. The board draws the claim the
            section makes — every capability wired to the place its evidence
            came from — and the record beneath it holds the evidence itself.
            Reading either one alone is enough; the board is what makes anyone
            want to read the other. */}
        <Bench onSelect={setTraced} />

        <div className={styles.card}>
          <div className={styles.controls}>
            <ul className={styles.legend} aria-label="Status legend">
              {(Object.keys(statusLegend) as EvidenceStatus[]).map((status) => (
                <li key={status} className={styles.legendItem} data-status={status}>
                  {status === 'pending' ? (
                    <Caliper state="open" className={styles.legendGlyph} label="">
                      {statusLegend[status].glyph}
                    </Caliper>
                  ) : (
                    <span
                      // The production swatch is the site's "measured in
                      // production" mark, and the key is the one place it is
                      // drawn at full strength — so it is named for what it is
                      // rather than reached by position.
                      className={`${styles.legendGlyph}${status === 'production' ? ` ${styles.measuredMark}` : ''}`}
                      aria-hidden="true"
                    >
                      {statusLegend[status].glyph}
                    </span>
                  )}
                  <span className={styles.legendLabel}>{statusLegend[status].label}</span>
                </li>
              ))}
            </ul>

            <div className={styles.filters} role="group" aria-label="Filter capabilities by status">
              {skillsContent.filters.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={styles.filter}
                  aria-pressed={filter === option.id}
                  onClick={() => setFilter(option.id as Filter)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* The count is announced, so a reader using the filters without sight
              of the table still knows what happened. */}
          <p className={styles.count} role="status">
            {visible.length} of {capabilities.length} capabilities shown
          </p>

          <div
            className={styles.tableWrap}
            style={floor ? { minHeight: `${Math.round(floor)}px` } : undefined}
          >
          {/* A filter that matches nothing is still an answer, and a blank box
              is not how to give it (lock §5.3). The line says what is absent
              and why, inside the container that already holds the table's
              measured height, so nothing below it moves. */}
          {visible.length === 0 ? (
            <p className={styles.empty} role="status">
              No capability carries that status. The filter is working; there is nothing
              under it to show.
            </p>
          ) : null}
          <table ref={tableRef} className={styles.table}>
            <caption className={styles.caption}>
              Capabilities, the evidence for each, and where that evidence was measured.
            </caption>
            <thead>
              <tr>
                <th scope="col">Capability</th>
                <th scope="col">Evidence</th>
                <th scope="col">Where</th>
                <th scope="col" className={styles.statusHead}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {capabilities.map((row, index) => {
                const shown = visible.includes(row);
                return (
                  <tr
                    key={row.capability}
                    hidden={!shown}
                    data-status={row.status}
                    data-traced={traced === index ? '' : undefined}
                  >
                    <th scope="row" className={styles.capability}>
                      {row.capability}
                    </th>
                    <td className={styles.evidence}>
                      {row.evidence}
                      {row.caveat && <span className={styles.caveat}>{row.caveat}</span>}
                    </td>
                    <td className={styles.where}>{row.where}</td>
                    <td className={styles.status}>
                      <span className={styles.statusGlyph} aria-hidden="true">
                        {statusLegend[row.status].glyph}
                      </span>
                      {/* Never glyph-only: the meaning is spoken as well as drawn. */}
                      <span className={styles.statusLabel}>{statusLegend[row.status].label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>

          <p className={styles.footer}>
            Calibrated against <code>public/docs/Vik_Resume_Final.pdf</code> · MD5{' '}
            <code>{cvFingerprint.short}</code> · {cvFingerprint.bytes.toLocaleString()} bytes.
            Run <code>md5sum</code> against the PDF this page links to and you should get the
            same eight characters.
          </p>
        </div>
      </div>
    </section>
  );
}
