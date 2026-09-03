'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import Caliper from '@/components/marks/Caliper';
import {
  exclusions,
  metricsFor,
  plates,
  vitrineContent,
} from '@/app/data/portfolio/vitrine';

import Drawing from './Drawings';
import styles from './Vitrine.module.css';

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
  const plateRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [lit, setLit] = useState(0);

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
      let best = 0;
      let bestDistance = Infinity;
      plateRefs.current.forEach((plate, index) => {
        if (!plate) return;
        const box = plate.getBoundingClientRect();
        const distance = Math.abs(box.left + box.width / 2 - centre);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      });
      setLit(best);
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
