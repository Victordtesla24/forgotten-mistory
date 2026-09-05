'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';

import Scene from '@/components/gl/Scene';
import Caliper from '@/components/marks/Caliper';
import {
  engagement,
  exclusions,
  metricsFor,
  plates,
  vitrineContent,
} from '@/app/data/portfolio/vitrine';

import Drawing from './Drawings';
import type { RailState } from './VitrineField';
import styles from './Vitrine.module.css';

// The field under the rail. Dynamic so `three` lands in the chunk `Scene`
// fetches when a scene actually mounts, not in this section's own bundle.
const VitrineField = dynamic(() => import('./VitrineField'), { ssr: false });

/**
 * What is keeping me busy — a long vitrine of six plates.
 *
 * The sensation the section is built around is the raking light: as a plate
 * reaches the centre of the viewport, the light tracks to it and its neighbours
 * fall into shadow, exactly like a gallery spot following the piece you are
 * standing in front of. It is caused entirely by the reader's own scroll —
 * there is no autoplay, no drag physics, no scroll hijack and no progress dots.
 *
 * The rail is native `scroll-snap`, which means it works with a trackpad, a
 * touchscreen, a scrollbar and the keyboard without any of them being
 * simulated. The light is a CSS gradient driven by an IntersectionObserver, so
 * it survives on a phone and on a machine with no WebGL — the section's
 * signature is not something only a desktop GPU gets to see.
 */
export default function Vitrine() {
  const railRef = useRef<HTMLOListElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const plateRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [lit, setLit] = useState(0);
  // The continuous half of the rail's state — where the lit plate sits across
  // the stage, and how far the rail has travelled. A ref, not state: the rail
  // scrolls at frame rate and re-rendering six plates for each frame of it
  // would cost more than the light it feeds. `VitrineField` reads it inside
  // `useFrame`, which is where a per-frame value belongs.
  const railState = useRef<RailState>({ centre: 0.5, scroll: 0 });
  // A plate's drawing is traced the first time the light reaches it and stays
  // drawn after the light has moved on (Drawings.module.css `[data-drawn]`).
  const [drawn, setDrawn] = useState<boolean[]>(() => plates.map((_, index) => index === 0));

  useEffect(() => {
    setDrawn((previous) =>
      previous[lit] ? previous : previous.map((was, index) => was || index === lit),
    );
  }, [lit]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;

    // The lit plate is whichever is nearest the rail's own centre, recomputed on
    // scroll. An IntersectionObserver alone cannot answer "which is most
    // central" — it answers "which is visible", and with six plates on a wide
    // screen that is most of them.
    let frame = 0;
    const update = () => {
      frame = 0;
      const bounds = rail.getBoundingClientRect();
      const centre = bounds.left + bounds.width / 2;
      const current = rail.scrollLeft;
      const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
      let best = 0;
      let bestDistance = Infinity;
      plateRefs.current.forEach((plate, index) => {
        if (!plate) return;
        const box = plate.getBoundingClientRect();
        // The lit plate is the one the rail has snapped to: the scroll position
        // that would centre it, clamped to what the rail can actually reach.
        // Measuring raw distance to the centre instead lit card 02 at rest on
        // a wide screen — at scrollLeft 0 the snap cannot centre card 01, so
        // its neighbour sat nearer the middle and took the light while the
        // reader was looking at the first card (council R-c8, C-02). The same
        // clamp keeps the light on the last plate at the far end.
        const ideal = Math.min(maxScroll, Math.max(0, current + box.left + box.width / 2 - centre));
        const distance = Math.abs(ideal - current);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      });
      setLit(best);

      // The same measurement, carried to the field: where the lit plate
      // actually is across the stage, and how far the rail has travelled. The
      // field's frame is the stage, not the rail — the rail bleeds out through
      // the section's gutter and the light does not follow it out there.
      const stage = stageRef.current;
      const plate = plateRefs.current[best];
      if (stage && plate) {
        const stageBox = stage.getBoundingClientRect();
        const plateBox = plate.getBoundingClientRect();
        railState.current.centre =
          stageBox.width > 0
            ? Math.min(
                1,
                Math.max(0, (plateBox.left + plateBox.width / 2 - stageBox.left) / stageBox.width),
              )
            : 0.5;
      }
      railState.current.scroll = rail.scrollWidth > 0 ? current / rail.scrollWidth : 0;
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    rail.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      rail.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const focusPlate = useCallback((index: number) => {
    const plate = plateRefs.current[index];
    if (!plate) return;
    plate.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    plate.focus({ preventScroll: true });
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLOListElement>, index: number) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const next = event.key === 'ArrowRight'
          ? Math.min(index + 1, plates.length - 1)
          : Math.max(index - 1, 0);
        focusPlate(next);
      }
    },
    [focusPlate],
  );

  return (
    <section id="vitrine" className={styles.vitrine} aria-labelledby="vitrine-title">
      <div className={styles.head}>
        <p className={styles.kicker}>{vitrineContent.kicker}</p>
        <h2 id="vitrine-title" className={styles.title}>
          {vitrineContent.title}
        </h2>
        <p className={styles.lede}>{vitrineContent.lede}</p>
      </div>

      <div ref={stageRef} className={styles.railStage}>
        {/* The light the cabinet stands in: the same lit plate the rail reads,
            as a pool under it. With no WebGL, reduced motion, or the section
            off screen, `Scene` mounts nothing and the cabinet is unchanged —
            the raking light on the plates is CSS and always has been. */}
        <div className={styles.field} data-lit-index={lit}>
          <Scene className={styles.fieldSlot}>
            <VitrineField lit={lit} rail={railState} />
          </Scene>
        </div>

        <ol
          ref={railRef}
          className={styles.rail}
          role="list"
          aria-label="Six repositories, scrollable horizontally"
        >
          {plates.map((plate, index) => {
            const metrics = metricsFor(plate.repo);
            return (
              <li
                key={plate.repo}
                ref={(node) => {
                  plateRefs.current[index] = node;
                }}
                className={styles.plate}
                data-lit={index === lit || undefined}
                data-drawn={drawn[index] || undefined}
                aria-roledescription="plate"
                tabIndex={0}
                onKeyDown={(event) => onKeyDown(event as never, index)}
                onFocus={() => setLit(index)}
              >
                <div className={styles.plateHead}>
                  <span className={styles.accession}>{plate.accession}</span>
                  <span className={styles.repo}>{plate.repo}</span>
                </div>

                <h3 className={styles.plateTitle}>{plate.title}</h3>
                <p className={styles.description}>{plate.description}</p>

                <div className={styles.drawingFrame}>
                  <Drawing id={plate.drawing} />
                </div>

                <dl className={styles.metrics}>
                  {metrics.map((metric) => (
                    <div key={metric.label} className={styles.metric}>
                      <dt>{metric.label}</dt>
                      <dd>
                        {metric.value === null ? (
                          // Never a blank cell: a value that was sought and not
                          // found is a fact, and it is drawn as one.
                          <Caliper state="open">not harvested</Caliper>
                        ) : (
                          metric.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>

                <p className={styles.limits}>
                  <span className={styles.limitsLabel}>Limits</span>
                  {plate.limits}
                </p>

                <div className={styles.links}>
                  <a className={styles.source} href={plate.href} target="_blank" rel="noreferrer noopener">
                    Source
                  </a>
                  {plate.live ? (
                    <a
                      className={styles.live}
                      href={plate.live.href}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {plate.live.label}
                    </a>
                  ) : (
                    /* Three of the six have nothing running to link to. Saying so
                       is better than leaving the row half-empty and letting a
                       reader wonder whether a link failed to render. */
                    <span className={styles.notDeployed}>no public deployment</span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* The route out of the work (G-V2, R4). A client who has just read the
          six plates can act on them here rather than having to reach #listen
          two sections down. It is chrome, not a claim, so it is achromatic —
          the gold in this section belongs to the plates' live URLs, which are
          the only figures here with a source a reader can go and check. */}
      <div className={styles.engagement}>
        <p className={styles.engagementNote}>{engagement.note}</p>
        <a className={styles.engage} data-cta="engage" href={engagement.href}>
          {engagement.label}
        </a>
      </div>

      <div className={styles.foot}>
        <div className={styles.exclusions}>
          <h3 className={styles.exclusionsTitle}>Excluded, and why</h3>
          <dl className={styles.exclusionList}>
            {exclusions.map((item) => (
              <div key={item.repo} className={styles.exclusion}>
                <dt>{item.repo}</dt>
                <dd>{item.reason}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className={styles.stamp}>
          {vitrineContent.publicRepoCount} public repositories · metrics harvested{' '}
          {vitrineContent.harvestedAt} from the GitHub API, not live
        </p>
      </div>
    </section>
  );
}
