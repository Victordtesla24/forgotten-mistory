'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';

import Caliper from '@/components/marks/Caliper';
import Scene from '@/components/gl/Scene';
import {
  NOW,
  TIMELINE_START,
  experienceContent,
  roles,
} from '@/app/data/portfolio/experience';

import styles from './Experience.module.css';

const CareerStrata = dynamic(() => import('./CareerStrata'), { ssr: false });

/** Percentage offsets for the DOM timeline, which is the accessible one. */
function track(start: number, end: number | null) {
  const span = NOW - TIMELINE_START;
  const left = ((start - TIMELINE_START) / span) * 100;
  const width = (((end ?? NOW) - start) / span) * 100;
  return { left: `${left}%`, width: `${Math.max(width, 0.6)}%` };
}

const DECADES = [2010, 2015, 2020, 2025];

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
  const [open, setOpen] = useState<string | null>(roles[0]?.id ?? null);

  const toggle = useCallback(
    (id: string) => setOpen((current) => (current === id ? null : id)),
    [],
  );

  return (
    <section id="experience" className={styles.experience} aria-labelledby="experience-title">
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.kicker}>{experienceContent.kicker}</p>
          <h2 id="experience-title" className={styles.title}>
            {experienceContent.title}
          </h2>
          <p className={styles.lede}>{experienceContent.lede}</p>
        </header>

        <div className={styles.chart}>
          <Scene className={styles.chartScene}>
            <CareerStrata />
          </Scene>

          {/* The chart itself. These percentages are the only encoding of the
              career on the page; nothing else may restate them. */}
          <ol className={styles.tracks} onMouseLeave={() => setActive(-1)}>
            {roles.map((role, index) => (
              <li key={role.id} className={styles.trackRow}>
                <button
                  type="button"
                  className={styles.trackButton}
                  data-active={active === index || undefined}
                  aria-label={`${role.role}, ${role.company}, ${role.dates}`}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(-1)}
                  onClick={() => {
                    setOpen(role.id);
                    document.getElementById(`role-${role.id}`)?.scrollIntoView({
                      block: 'center',
                      behavior: 'smooth',
                    });
                  }}
                >
                  <span className={styles.trackCompany}>{role.company}</span>
                  <span className={styles.trackLine}>
                    <span className={styles.trackBar} style={track(role.span.start, role.span.end)}>
                      <span className={styles.trackYears}>
                        {role.years < 1
                          ? `${Math.round(role.years * 12)} mo`
                          : `${role.years.toFixed(1)} yr`}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>

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
                      <span className={styles.roleCompany}>{role.company}</span>
                      <span className={styles.roleDates}>{role.dates}</span>
                    </span>
                    <span className={styles.roleChevron} aria-hidden="true" />
                  </button>
                </h3>

                {role.span.headline ? (
                  <p className={styles.roleHeadline}>
                    <Caliper state="sourced" className={styles.roleHeadlineValue}>
                      {role.span.headline.value}
                    </Caliper>
                    <span className={styles.roleHeadlineLabel}>{role.span.headline.label}</span>
                  </p>
                ) : (
                  /* Five of the eight roles state no figure in the CV. Rather
                     than invent one — or leave a silence a reader could read as
                     an oversight — the bracket stays open and says why. */
                  <p className={styles.roleHeadline}>
                    <Caliper state="open" className={styles.roleHeadlineOpen}>
                      no published figure
                    </Caliper>
                    <span className={styles.roleHeadlineLabel}>
                      the CV states none for this role, and none was invented
                    </span>
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
