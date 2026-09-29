'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';

import Caliper from '@/components/marks/Caliper';
import {
  NOW,
  TIMELINE_START,
  experienceContent,
  roles,
} from '@/app/data/portfolio/experience';
import { experienceVisual } from '@/app/data/portfolio/experienceVisual';

import styles from './Experience.module.css';

/** Percentage offsets for the DOM timeline, which is the accessible one. */
function track(start: number, end: number | null) {
  const span = NOW - TIMELINE_START;
  const left = ((start - TIMELINE_START) / span) * 100;
  const width = Math.max((((end ?? NOW) - start) / span) * 100, 0.6);
  return {
    left: `${left}%`,
    width: `${width}%`,
    /** Where the duration readout starts: a hair past the bar's own end. */
    end: `calc(${left + width}% + var(--space-1))`,
  };
}

const DECADES = [2010, 2015, 2020, 2025];
/**
 * The employer column's width, as the track grid declares it, plus its gap. The
 * gridlines are positioned across the whole chart, so they have to skip that
 * column by hand to line up with the bars they are there to measure.
 */
const LABEL_COLUMN = 'clamp(7rem, 22%, 14rem) + var(--space-2)';

function midpoint(start: number, end: number | null) {
  const resolvedEnd = end ?? NOW;
  return ((start + (resolvedEnd - start) / 2 - TIMELINE_START) / (NOW - TIMELINE_START)) * 100;
}

function durationLabel(years: number) {
  return years < 1 ? `${Math.round(years * 12)} mo` : `${years.toFixed(1)} yr`;
}

/**
 * Experience — sixteen years on one axis, then the detail.
 *
 * The chart is real markup: every bar is positioned and sized in percentages of
 * the same sixteen-year axis, so the proportions survive a screen reader, a
 * printed page and a browser with no WebGL. The scene behind it draws texture,
 * not data — an earlier version drew the roles a second time in 3D and the two
 * copies could not be kept in alignment, which read as a rendering fault.
 *
 * A bar's length is its role's real duration and encodes nothing else. Sizing
 * bars by seniority or importance would make the picture unfalsifiable, which
 * is the opposite of what this section is for.
 */
export default function Experience() {
  const [active, setActive] = useState(-1);
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState<string | null>(roles[0]?.id ?? null);
  const [entered, setEntered] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const selectedRole = roles[selected] ?? roles[0];
  const selectedMidpoint = selectedRole ? midpoint(selectedRole.span.start, selectedRole.span.end) : 0;

  const inspectRole = useCallback((index: number) => {
    const bounded = Math.min(Math.max(index, 0), roles.length - 1);
    setSelected(bounded);
    setOpen(roles[bounded]?.id ?? null);
  }, []);

  const toggle = useCallback(
    (id: string) => setOpen((current) => (current === id ? null : id)),
    [],
  );

  // The entry beat. The static document paints the bars at their real length.
  // Hydration does not hide them; the observer only marks the chart entered
  // when it actually arrives (or when a restored/deep-link scroll is already
  // below it), and CSS plays the one-shot draw from keyframes.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return undefined;

    let observer: IntersectionObserver | null = null;
    const commit = () => {
      setEntered(true);
      observer?.disconnect();
    };

    if (typeof IntersectionObserver === 'undefined') {
      commit();
      return undefined;
    }

    observer = new IntersectionObserver(
      (entries) => {
        // Either a third of the chart has arrived, or the reader has already
        // gone past it — a deep link to a role, or a restored scroll position.
        // A chart that is behind you is a chart that has finished being drawn.
        const shouldCommit = entries.some(
          (entry) => entry.isIntersecting || entry.boundingClientRect.bottom < 0,
        );
        if (shouldCommit) commit();
      },
      { threshold: 0.35 },
    );
    observer.observe(chart);
    return () => {
      observer?.disconnect();
    };
  }, []);

  return (
    <section id="experience" className={styles.experience} aria-labelledby="experience-title" data-testid="experience-explorer">
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.kicker}>{experienceContent.kicker}</p>
          <h2 id="experience-title" className={styles.title}>
            {experienceContent.title}
            {/* The claim's own arithmetic, inside the claim. */}
            <span className={styles.titleDerivation}>{experienceContent.derivation}</span>
          </h2>
          <p className={styles.lede}>{experienceContent.lede}</p>
        </header>

        <div className={styles.chart} ref={chartRef} data-chart>
          {/* The chart itself. These percentages are the only encoding of the
              career on the page; nothing else may restate them. */}
          {/* The same years the axis labels, drawn through the tracks and
              stopping with them. The chart's claim is that the bars are to
              scale; a reader can only check that against something. */}
          <div
            className={styles.trackField}
            data-track-field
            data-entered={entered || undefined}
            style={{ '--inspection': `${selectedMidpoint}%` } as CSSProperties}
          >
          {/* Today. A 1 px rule and a 4 px tick at the axis's right edge, so
              the eye can see what every bar is measured up to without reading
              the word "now" first. It is --white, never --gold: the dates it
              marks are graded self-reported (see the caliper on each role),
              and gold on this site means the figure has a source. */}
          <span className={styles.playhead} data-playhead aria-hidden="true" />
          <span className={styles.inspectionHairline} aria-hidden="true" />

          <div className={styles.grid} aria-hidden="true">
            {DECADES.map((year) => (
              <span
                key={`grid-${year}`}
                className={styles.gridLine}
                style={{
                  left: `calc(${LABEL_COLUMN} + (100% - (${LABEL_COLUMN})) * ${(
                    (year - TIMELINE_START) /
                    (NOW - TIMELINE_START)
                  ).toFixed(4)})`,
                }}
              />
            ))}
          </div>

          <ol className={styles.tracks} onMouseLeave={() => setActive(-1)}>
            {roles.map((role, index) => {
              const geometry = track(role.span.start, role.span.end);
              return (
              <li key={role.id} className={styles.trackRow}>
                <button
                  type="button"
                  className={styles.trackButton}
                  data-active={active === index || selected === index || undefined}
                  data-selected={selected === index || undefined}
                  aria-label={`${role.role}, ${role.company}, ${role.dates}`}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => {
                    setActive(index);
                    inspectRole(index);
                  }}
                  onBlur={() => setActive(-1)}
                  onClick={() => {
                    inspectRole(index);
                  }}
                >
                  {/* Gold is the site's one claim mark: an employer a reader
                      can open and check carries it, on the name itself and
                      never on the dates. Recessed at rest (--gold-pale) so a
                      chart of eight employers is not eight "look here"s; the
                      active row's employer steps up to saturated --gold. The
                      flag is on the data (experience.ts), so the grade and the
                      colour cannot drift apart. */}
                  <span className={styles.trackCompany} data-sourced={role.sourced || undefined}>
                    {role.company}
                  </span>
                  <span className={styles.trackLine}>
                    {/* The bar grows from nothing about its own left edge, one
                        row behind the last. The readout is its sibling, not its
                        child: a child would be squashed by the same scaleX that
                        draws the bar, and would arrive unreadable. */}
                    <span
                      className={styles.trackBar}
                      style={
                        {
                          left: geometry.left,
                          width: geometry.width,
                          '--row': index,
                        } as CSSProperties
                      }
                    />
                    <span className={styles.trackYears} style={{ left: geometry.end }}>
                      {durationLabel(role.years)}
                    </span>
                  </span>
                </button>
              </li>
              );
            })}
          </ol>
          </div>

          <div className={styles.inspectorPanel}>
            <label className={styles.scrubberLabel} htmlFor="career-scrubber">
              {experienceVisual.scrubberLabel}
            </label>
            <input
              id="career-scrubber"
              data-testid="career-scrubber"
              className={styles.scrubber}
              type="range"
              min="0"
              max={String(roles.length - 1)}
              step="1"
              value={selected}
              aria-label={experienceVisual.scrubberLabel}
              onInput={(event) => inspectRole(Number(event.currentTarget.value))}
              onChange={(event) => inspectRole(Number(event.currentTarget.value))}
            />
            {selectedRole ? (
              <output className={styles.inspection} data-testid="career-inspection" htmlFor="career-scrubber">
                <span className={styles.inspectionEyebrow}>{experienceVisual.selectionEyebrow}</span>
                <strong>{selectedRole.company}</strong>
                <span>{selectedRole.role}</span>
                <span>
                  {selectedRole.dates} · {selectedRole.years.toFixed(1)} yr
                </span>
              </output>
            ) : null}
          </div>

          {/* Printed once. Five roles carry an open bracket below, and this is
              what all five of them mean. */}
          <p className={styles.openNote}>{experienceVisual.openFigureNote}</p>

          <div className={styles.axis} aria-hidden="true">
            {DECADES.map((year) => (
              <span
                key={year}
                className={styles.axisTick}
                style={{ left: `${((year - TIMELINE_START) / (NOW - TIMELINE_START)) * 100}%` }}
              >
                {year}
              </span>
            ))}
            <span className={styles.axisTick} style={{ left: '100%' }}>
              now
            </span>
          </div>
        </div>

        <ol className={styles.roles}>
          {roles.map((role) => {
            const isOpen = open === role.id;
            return (
              <li key={role.id} id={`role-${role.id}`} className={styles.role} data-open={isOpen || undefined}>
                <h3 className={styles.roleHeading}>
                  <button
                    type="button"
                    className={styles.roleToggle}
                    aria-expanded={isOpen}
                    aria-controls={`role-body-${role.id}`}
                    onClick={() => toggle(role.id)}
                  >
                    <span className={styles.roleTitle}>{role.role}</span>
                    <span className={styles.roleMeta}>
                      <span className={styles.roleCompany} data-sourced={role.sourced || undefined}>
                        {role.company}
                      </span>
                      <span className={styles.roleDates}>{role.dates}</span>
                    </span>
                    <span className={styles.roleChevron} aria-hidden="true" />
                  </button>
                </h3>

                {role.span.headline ? (
                  <p className={styles.roleHeadline}>
                    <Caliper state="self-reported" className={styles.roleHeadlineValue}>
                      {role.span.headline.value}
                    </Caliper>
                    <span className={styles.roleHeadlineLabel}>{role.span.headline.label}</span>
                  </p>
                ) : (
                  /* Five of the eight roles state no figure in the CV. The open
                     bracket says so on each of them; the reason is printed once,
                     under the chart, rather than five times in identical words. */
                  <p className={styles.roleHeadline}>
                    <Caliper state="open" className={styles.roleHeadlineOpen}>
                      no published figure
                    </Caliper>
                  </p>
                )}

                <div
                  id={`role-body-${role.id}`}
                  className={styles.roleBody}
                  hidden={!isOpen}
                >
                  <ul className={styles.bullets}>
                    {role.bullets.map((bullet) => (
                      <li key={bullet.slice(0, 40)}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>

      </div>
    </section>
  );
}
