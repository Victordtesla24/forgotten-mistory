'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import Caliper from '@/components/marks/Caliper';
import { mechanismFacts, type MechanismFact } from '@/app/data/portfolio/mechanisms';
import {
  engagement,
  exclusions,
  metricsFor,
  plates,
  vitrineContent,
  type DrawingId,
} from '@/app/data/portfolio/vitrine';

import styles from './Vitrine.module.css';

function MechanismSvg({ drawing, stage }: { drawing: DrawingId; stage: string }) {
  const active = (id: string) => (id === stage ? '' : undefined);
  switch (drawing) {
    case 'pipeline-gate':
      return (
        <svg viewBox="0 0 360 170" aria-hidden="true" focusable="false" className={styles.mechanismSvg}>
          <path className={styles.guide} d="M24 86 H112 L146 48 H238 L272 86 H336" />
          <path className={styles.trace} d="M24 86 H112" data-active={active('claim')} />
          <path className={styles.trace} d="M112 86 L146 48 H238 L272 86" data-active={active('resume-guard')} />
          <path className={styles.trace} d="M238 122 H126 L96 96" data-active={active('revert')} />
          <path className={styles.gilt} d="M146 48 L192 24 L238 48 L222 92 H162 Z" data-active={active('resume-guard')} />
          <path className={styles.trace} d="M272 86 H336" data-active={active('resume-guard')} />
          <circle className={styles.node} cx="58" cy="86" r="9" data-active={active('claim')} />
          <circle className={styles.node} cx="192" cy="58" r="11" data-active={active('resume-guard')} />
          <path className={styles.node} d="M113 121 h30 m-15 -15 v30" data-active={active('revert')} />
        </svg>
      );
    case 'rebuild-loop':
      return (
        <svg viewBox="0 0 360 170" aria-hidden="true" focusable="false" className={styles.mechanismSvg}>
          <path className={styles.guide} d="M72 45 H246 Q306 45 306 86 Q306 127 246 127 H98 Q54 127 54 92" />
          <path className={styles.trace} d="M72 45 H152" data-active={active('push')} />
          <path className={styles.gilt} d="M152 32 h72 l22 13 -22 13 h-72 l-22 -13 Z" data-active={active('container')} />
          <path className={styles.trace} d="M246 45 Q306 45 306 86 Q306 127 246 127" data-active={active('container')} />
          <path className={styles.trace} d="M246 127 H98 Q54 127 54 92" data-active={active('site')} />
          <path className={styles.node} d="M48 34 h48 v22 H48 Z M58 28 v6 M86 28 v6" data-active={active('push')} />
          <path className={styles.node} d="M214 108 h58 v30 h-58 Z M224 118 h38 M224 128 h26" data-active={active('site')} />
        </svg>
      );
    case 'verifier-loop':
      return (
        <svg viewBox="0 0 360 170" aria-hidden="true" focusable="false" className={styles.mechanismSvg}>
          <path className={styles.guide} d="M180 36 C260 36 302 86 258 124 C214 162 96 144 80 92 C66 46 118 28 180 36 Z" />
          <path className={styles.trace} d="M82 90 C66 48 118 28 180 36 C222 38 256 54 272 78" data-active={active('work')} />
          <path className={styles.gilt} d="M246 90 l27 -18 l27 18 l-10 32 h-34 Z" data-active={active('verifier')} />
          <path className={styles.trace} d="M255 126 C212 162 100 145 82 94" data-active={active('verifier')} />
          <path className={styles.trace} d="M292 104 H338" data-active={active('exit')} />
          <path className={styles.node} d="M120 70 h66 v44 h-66 Z M132 84 h42 M132 99 h28" data-active={active('work')} />
          <path className={styles.node} d="M324 94 l16 10 l-16 10" data-active={active('exit')} />
        </svg>
      );
    case 'reconstruction-bands':
      return (
        <svg viewBox="0 0 360 170" aria-hidden="true" focusable="false" className={styles.mechanismSvg}>
          <path className={styles.trace} d="M34 44 H170" data-active={active('raw-prompt')} />
          <path className={styles.trace} d="M34 84 H222" data-active={active('spec')} />
          <path className={styles.trace} d="M34 124 H154" data-active={active('provider-failover')} />
          <path className={styles.guide} d="M170 44 C218 52 238 68 222 84 C206 100 172 104 154 124" />
          <path className={styles.gilt} d="M232 62 h84 l18 22 -18 22 h-84 l18 -22 Z" data-active={active('spec')} />
          <path className={styles.node} d="M42 32 v24 M62 32 v24 M82 32 v24" data-active={active('raw-prompt')} />
          <path className={styles.node} d="M258 76 h48 M258 88 h36" data-active={active('spec')} />
          <path className={styles.node} d="M150 112 l22 12 -22 12 M172 124 h70" data-active={active('provider-failover')} />
        </svg>
      );
    case 'diamond-chart':
      return (
        <svg viewBox="0 0 360 170" aria-hidden="true" focusable="false" className={styles.mechanismSvg}>
          <path className={styles.guide} d="M180 24 L310 86 L180 148 L50 86 Z M180 24 V148 M50 86 H310" />
          <path className={styles.trace} d="M82 86 C110 44 150 28 180 24" data-active={active('ephemeris')} />
          <path className={styles.gilt} d="M180 48 L258 86 L180 124 L102 86 Z" data-active={active('gate')} />
          <path className={styles.trace} d="M258 86 H326" data-active={active('positions')} />
          <circle className={styles.node} cx="112" cy="58" r="8" data-active={active('ephemeris')} />
          <path className={styles.node} d="M168 82 l9 9 l19 -23" data-active={active('gate')} />
          <path className={styles.node} d="M322 74 v24 M310 86 h24" data-active={active('positions')} />
        </svg>
      );
    case 'scroll-rail':
      return (
        <svg viewBox="0 0 360 170" aria-hidden="true" focusable="false" className={styles.mechanismSvg}>
          <path className={styles.guide} d="M36 54 H324 M36 116 H324" />
          <path className={styles.trace} d="M48 54 V116" data-active={active('static')} />
          <path className={styles.trace} d="M76 70 h208" data-active={active('six-section')} />
          <path className={styles.trace} d="M312 54 V116" data-active={active('rail')} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} className={styles.gilt} d={`M${82 + i * 34} 68 h22 v50 h-22 Z`} data-active={active('six-section')} />
          ))}
          <path className={styles.node} d="M40 44 h16 M40 126 h16" data-active={active('static')} />
          <path className={styles.node} d="M304 44 h16 M304 126 h16" data-active={active('rail')} />
        </svg>
      );
  }
}

function MechanismPanel({ fact, stage, onStage }: { fact: MechanismFact; stage: string; onStage: (stage: string) => void }) {
  return (
    <figure
      className={styles.mechanism}
      data-testid="mechanism-diagram"
      data-mechanism={fact.drawing}
      role="region"
      aria-label={`${fact.label} schematic`}
    >
      <MechanismSvg drawing={fact.drawing} stage={stage} />
      <figcaption className={styles.mechanismCaption}>
        <span>{fact.label}</span>
        <span>{fact.provenance}</span>
      </figcaption>
      <div className={styles.stageButtons} aria-label={`${fact.label} trace stages`}>
        {fact.stages.map((item) => (
          <button
            key={item.id}
            type="button"
            className={styles.stageButton}
            data-active={item.id === stage ? '' : undefined}
            aria-pressed={item.id === stage}
            onClick={() => onStage(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </figure>
  );
}

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
  const [inspected, setInspected] = useState<Record<string, boolean>>({});
  const [stages, setStages] = useState<Record<string, string>>({});
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
      if (event.target !== event.currentTarget) return;
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

      <div className={styles.railStage}>
        <ol
          ref={railRef}
          className={styles.rail}
          role="list"
          aria-label="Six repositories in the vitrine"
        >
          {plates.map((plate, index) => {
            const metrics = metricsFor(plate.repo);
            const fact = mechanismFacts[plate.drawing];
            const activeStage = stages[plate.drawing] ?? fact.stages[0].id;
            const detailId = `mechanism-detail-${plate.drawing}`;
            const isInspected = Boolean(inspected[plate.drawing]);
            return (
              <li
                key={plate.repo}
                ref={(node) => {
                  plateRefs.current[index] = node;
                }}
                className={styles.plate}
                data-lit={index === lit || undefined}
                data-mechanism={plate.drawing}
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

                <MechanismPanel
                  fact={fact}
                  stage={activeStage}
                  onStage={(stage) => {
                    setStages((current) => ({ ...current, [plate.drawing]: stage }));
                    setLit(index);
                  }}
                />

                <button
                  type="button"
                  className={styles.inspect}
                  data-testid="mechanism-inspect"
                  aria-expanded={isInspected}
                  aria-controls={detailId}
                  onClick={() => {
                    setInspected((current) => ({ ...current, [plate.drawing]: !current[plate.drawing] }));
                    const currentIndex = fact.stages.findIndex((item) => item.id === activeStage);
                    const next = fact.stages[(currentIndex + 1) % fact.stages.length];
                    setStages((current) => ({ ...current, [plate.drawing]: next.id }));
                    setLit(index);
                  }}
                >
                  Inspect {plate.title} mechanism
                </button>

                <details className={styles.mechanismDetail} open={isInspected}>
                  <summary className={styles.detailSummary}>Source and limits</summary>
                  <div id={detailId} data-testid="mechanism-detail" className={styles.detailBody}>
                    <p>{fact.schematic}</p>
                    <p>{fact.source}</p>
                    <p>{fact.limit}</p>
                    <p>Highlighted stage: {fact.stages.find((item) => item.id === activeStage)?.note}</p>
                  </div>
                </details>

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
