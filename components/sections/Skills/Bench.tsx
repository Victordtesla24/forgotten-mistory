'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import {
  capabilities,
  sources,
  statusLegend,
  type Capability,
  type EvidenceStatus,
} from '@/app/data/portfolio/skills';

import styles from './Bench.module.css';

/**
 * The bench — where each capability was measured.
 *
 * This is the section's argument drawn rather than asserted. Thirteen sources
 * on the left, seventeen capabilities on the right, and a hairline between
 * every pair that a line of the CV or a line of a repository actually connects.
 * A skills section that could not draw this graph would be a list of adjectives;
 * this one can, and the drawing is the proof.
 *
 * Three decisions hold it up.
 *
 * **The rails are HTML, the wires are SVG.** Labels rendered as SVG `<text>`
 * hint differently from the rest of the page and cannot be selected, tabbed to
 * or read by a screen reader as the buttons they behave like. So the two rails
 * are real `<button>` elements in normal flow, their anchor points are measured
 * from layout, and only the curves are drawn — which is the one thing HTML
 * cannot do.
 *
 * **Gold is still a claim.** A wire is gold only where the evidence at its end
 * was measured in production. Grey where it was measured somewhere that was
 * not. The one capability with no evidence yet has no wire at all, because a
 * line to nowhere would be exactly the dishonesty the rest of the section is
 * built to avoid.
 *
 * **Nothing is hidden behind the interaction.** Hovering or focusing a node
 * dims what it is not connected to, which is a reading aid, not a disclosure —
 * every wire and every label is present and legible before anyone touches it,
 * and the full record with its evidence sits directly beneath.
 */

type NodeRef = { kind: 'source' | 'capability'; id: string } | null;

interface Point {
  x: number;
  y: number;
}

interface Wire {
  key: string;
  sourceId: string;
  capabilityIndex: number;
  status: EvidenceStatus;
  d: string;
}

/** Every (source → capability) pair the data actually asserts. */
const LINKS: Array<{ sourceId: string; capabilityIndex: number; status: EvidenceStatus }> =
  capabilities.flatMap((row, index) =>
    row.sources.map((sourceId) => ({ sourceId, capabilityIndex: index, status: row.status })),
  );

const KIND_LABEL: Record<string, string> = {
  programme: 'Programmes',
  repository: 'Repositories',
  credential: 'Credentials',
};

/** The source rail, split into its three bands in registry order. */
const BANDS = (['programme', 'repository', 'credential'] as const).map((kind) => ({
  kind,
  label: KIND_LABEL[kind],
  items: sources.filter((source) => source.kind === kind),
}));

function statusClass(status: EvidenceStatus) {
  if (status === 'production') return styles.production;
  if (status === 'non-production') return styles.nonProduction;
  return styles.pending;
}

export default function Bench({
  onSelect,
}: {
  /** Told which capability is under the reader's attention, so the record below can follow. */
  onSelect?: (index: number | null) => void;
}) {
  // A literal, not `useId()`: React's generated ids contain colons, which are
  // legal in an `id` attribute and illegal inside `url(#…)`, so every wire
  // referenced a gradient that did not resolve and drew with no stroke at all.
  // There is one bench on the page.
  const gradientId = 'bench-wire';
  const benchRef = useRef<HTMLDivElement>(null);
  const sourceRefs = useRef(new Map<string, HTMLElement>());
  const capabilityRefs = useRef(new Map<number, HTMLElement>());

  const [wires, setWires] = useState<Wire[]>([]);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [active, setActive] = useState<NodeRef>(null);
  const [drawn, setDrawn] = useState(false);
  // The trace runs once. After it, the animation is taken off the wires
  // entirely: a CSS animation whose delay is re-declared on re-render replays
  // from the start, so any later resize — a window drag, an orientation
  // change — had the whole board redraw itself under the reader.
  const [settled, setSettled] = useState(false);

  // ── Geometry ──────────────────────────────────────────────────────────────
  // Anchor points come from layout, so the curves follow the type wherever it
  // wraps rather than from a hand-kept table of coordinates that would be wrong
  // at the first font swap.
  const measure = useCallback(() => {
    const bench = benchRef.current;
    if (!bench) return;
    const origin = bench.getBoundingClientRect();
    if (origin.width === 0) return;

    const anchor = (el: HTMLElement, side: 'right' | 'left'): Point => {
      const r = el.getBoundingClientRect();
      return {
        x: (side === 'right' ? r.right : r.left) - origin.left,
        y: r.top + r.height / 2 - origin.top,
      };
    };

    const next: Wire[] = [];
    for (const link of LINKS) {
      const from = sourceRefs.current.get(link.sourceId);
      const to = capabilityRefs.current.get(link.capabilityIndex);
      if (!from || !to) continue;
      const a = anchor(from, 'right');
      const b = anchor(to, 'left');
      // A flat-tangent cubic: the wire leaves the source horizontally and
      // arrives horizontally, so the bundle reads as cabling rather than as a
      // spray of diagonals.
      const bow = Math.max(48, (b.x - a.x) * 0.46);
      const d = `M ${a.x} ${a.y} C ${a.x + bow} ${a.y}, ${b.x - bow} ${b.y}, ${b.x} ${b.y}`;
      next.push({
        key: `${link.sourceId}-${link.capabilityIndex}`,
        sourceId: link.sourceId,
        capabilityIndex: link.capabilityIndex,
        status: link.status,
        d,
      });
    }
    setWires(next);
    setBox({ width: origin.width, height: origin.height });
  }, []);

  useLayoutEffect(() => {
    measure();
    const bench = benchRef.current;
    if (!bench) return undefined;
    // Two frames after the resize, not one. A ResizeObserver fires with the
    // box that triggered it, and on a viewport change the rails have not yet
    // re-wrapped — the anchors read then are the old ones, and the wires end
    // short of the labels they belong to. Waiting a frame lets layout settle
    // and re-reads it.
    let frame = 0;
    const settle = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(measure);
      });
    };
    const observer = new ResizeObserver(() => {
      measure();
      settle();
    });
    observer.observe(bench);
    // The rails wrap differently once the real faces land, which moves every
    // anchor point on the board.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [measure]);

  // ── The draw-in ───────────────────────────────────────────────────────────
  // The wires trace themselves once, when the board first comes into view, and
  // never again. Under reduced motion they are simply there.
  useEffect(() => {
    const bench = benchRef.current;
    if (!bench) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDrawn(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setDrawn(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(bench);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!drawn || settled) return undefined;
    const total = 120 + LINKS.length * 38 + 820 + 80;
    const timer = window.setTimeout(() => setSettled(true), total);
    return () => window.clearTimeout(timer);
  }, [drawn, settled]);

  // ── What the current attention connects to ────────────────────────────────
  const lit = useMemo(() => {
    if (!active) return null;
    const litSources = new Set<string>();
    const litCapabilities = new Set<number>();
    const litWires = new Set<string>();
    for (const link of LINKS) {
      const hit =
        active.kind === 'source'
          ? link.sourceId === active.id
          : link.capabilityIndex === Number(active.id);
      if (!hit) continue;
      litSources.add(link.sourceId);
      litCapabilities.add(link.capabilityIndex);
      litWires.add(`${link.sourceId}-${link.capabilityIndex}`);
    }
    // A node with no wires — the capability with no evidence yet — still lights
    // itself when it is the one being read.
    if (active.kind === 'capability') litCapabilities.add(Number(active.id));
    else litSources.add(active.id);
    return { litSources, litCapabilities, litWires };
  }, [active]);

  const focus = useCallback(
    (next: NodeRef) => {
      setActive(next);
      onSelect?.(next && next.kind === 'capability' ? Number(next.id) : null);
    },
    [onSelect],
  );

  const readout: Capability | null =
    active?.kind === 'capability' ? (capabilities[Number(active.id)] ?? null) : null;
  const readoutSource =
    active?.kind === 'source' ? (sources.find((s) => s.id === active.id) ?? null) : null;
  const readoutSourceCount =
    readoutSource != null
      ? LINKS.filter((link) => link.sourceId === readoutSource.id).length
      : 0;

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.caption}>
        Every capability, wired to the programme, repository or issuing body its evidence
        came from. Gold where that evidence was taken in production.
      </figcaption>

      <div
        ref={benchRef}
        className={styles.bench}
        data-dimmed={active ? '' : undefined}
        onMouseLeave={() => focus(null)}
      >
        <svg
          className={styles.wires}
          viewBox={`0 0 ${Math.max(1, box.width)} ${Math.max(1, box.height)}`}
          width={box.width || undefined}
          height={box.height || undefined}
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            {/* The wire fades out of its source rather than butting into the
                label — a hard join reads as a diagram of boxes, and this is a
                drawing of cabling. */}
            {/* userSpaceOnUse, not the default. A near-horizontal wire has a
                bounding box of almost no height, and an objectBoundingBox
                gradient on a zero-area box is not rendered at all — which is
                why every short wire between the repository rail and the
                capabilities beside it drew nothing while the long diagonals
                from the programmes drew fine. Anchoring the ramp to the board
                also makes the fade land at the rails on every wire rather than
                at each wire's own ends. */}
            <linearGradient
              id={`${gradientId}-gold`}
              gradientUnits="userSpaceOnUse"
              x1="0"
              x2={Math.max(1, box.width)}
              y1="0"
              y2="0"
            >
              {/* The ramp carries the shape of the fade and nothing else: its
                  body is opaque and the level the strand is drawn at lives in
                  `stroke-opacity` (Bench.module.css), which is the property the
                  attention state animates. Baking a level into both meant the
                  two multiplied, and a wire asked to come to full strength on
                  hover arrived at 0.62 of it. */}
              <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.1" />
              <stop offset="14%" stopColor="var(--gold)" stopOpacity="1" />
              <stop offset="86%" stopColor="var(--gold)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient
              id={`${gradientId}-grey`}
              gradientUnits="userSpaceOnUse"
              x1="0"
              x2={Math.max(1, box.width)}
              y1="0"
              y2="0"
            >
              <stop offset="0%" stopColor="var(--mist-400)" stopOpacity="0.08" />
              <stop offset="14%" stopColor="var(--mist-400)" stopOpacity="1" />
              <stop offset="86%" stopColor="var(--mist-400)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--mist-400)" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          {wires.map((wire, index) => (
            <path
              key={wire.key}
              className={`${styles.wire} ${statusClass(wire.status)}`}
              d={wire.d}
              // The dash animation runs in normalised units. Estimating a
              // curve's length from its chord got it wrong by enough that the
              // dash array came out shorter than the path, and every wire drew
              // part of the way across and then stopped in mid-air.
              pathLength={1}
              stroke={`url(#${gradientId}-${wire.status === 'production' ? 'gold' : 'grey'})`}
              fill="none"
              data-lit={lit ? (lit.litWires.has(wire.key) ? '' : undefined) : undefined}
              data-drawn={drawn ? '' : undefined}
              data-settled={settled ? '' : undefined}
              style={
                {
                  '--delay': `${120 + index * 38}ms`,
                } as React.CSSProperties
              }
            />
          ))}
        </svg>

        <div className={styles.rail} data-side="sources">
          {BANDS.map((band) => (
            <div key={band.kind} className={styles.band}>
              <p className={styles.bandLabel}>{band.label}</p>
              {band.items.map((source) => {
                const count = LINKS.filter((link) => link.sourceId === source.id).length;
                return (
                  <button
                    key={source.id}
                    type="button"
                    ref={(el) => {
                      if (el) sourceRefs.current.set(source.id, el);
                      else sourceRefs.current.delete(source.id);
                    }}
                    className={styles.node}
                    data-lit={lit ? (lit.litSources.has(source.id) ? '' : undefined) : undefined}
                    onMouseEnter={() => focus({ kind: 'source', id: source.id })}
                    onFocus={() => focus({ kind: 'source', id: source.id })}
                    onBlur={() => focus(null)}
                    aria-label={`${source.label} — ${count} ${count === 1 ? 'capability' : 'capabilities'}`}
                  >
                    <span className={styles.nodeLabel}>{source.label}</span>
                    <span className={styles.nodeCount} aria-hidden="true">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className={styles.rail} data-side="capabilities">
          {capabilities.map((row, index) => (
            <button
              key={row.capability}
              type="button"
              ref={(el) => {
                if (el) capabilityRefs.current.set(index, el);
                else capabilityRefs.current.delete(index);
              }}
              className={styles.node}
              data-lit={lit ? (lit.litCapabilities.has(index) ? '' : undefined) : undefined}
              onMouseEnter={() => focus({ kind: 'capability', id: String(index) })}
              onFocus={() => focus({ kind: 'capability', id: String(index) })}
              onBlur={() => focus(null)}
              aria-label={`${row.capability}. ${row.evidence}. ${statusLegend[row.status].label}.${
                row.caveat ? ` ${row.caveat}.` : ''
              }`}
            >
              <span
                className={`${styles.mark} ${statusClass(row.status)}`}
                aria-hidden="true"
              />
              <span className={styles.nodeLabel}>{row.short}</span>
            </button>
          ))}
        </div>
      </div>

      {/* The readout. It holds its height whether or not anything is being read,
          so the record below never jumps as the reader moves across the board.
          Deliberately not a live region: it changes on every hover, and a
          section that announced itself on each one would be unusable with a
          screen reader — the evidence it shows is on each node's own label, so
          it is spoken on focus, once, by the thing being focused. */}
      <p className={styles.readout}>
        {readout ? (
          <>
            <span className={styles.readoutTitle}>{readout.capability}</span>
            <span className={styles.readoutEvidence}>{readout.evidence}</span>
            {readout.caveat ? (
              <span className={styles.readoutCaveat}>{readout.caveat}</span>
            ) : null}
          </>
        ) : readoutSource ? (
          <>
            <span className={styles.readoutTitle}>{readoutSource.label}</span>
            <span className={styles.readoutEvidence}>
              {readoutSourceCount} {readoutSourceCount === 1 ? 'capability' : 'capabilities'} take
              their evidence from here.
            </span>
          </>
        ) : (
          <span className={styles.readoutRest}>
            {LINKS.length} links · {sources.length} sources · {capabilities.length} capabilities.
            Hover or tab a node to trace it.
          </span>
        )}
      </p>
    </figure>
  );
}
