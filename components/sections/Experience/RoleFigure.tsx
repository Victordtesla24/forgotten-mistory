import type { RoleHeadline } from '@/content/experience';

import styles from './RoleFigure.module.css';

/** A figure is drawn as a field of 100 marks, ten by ten, so every mark can be counted. */
const SIDE = 10;
const CELL = 8;
const GAP = 2;
const EXTENT = SIDE * CELL + (SIDE - 1) * GAP;

/** What one mark of a count stands for: 100 marks make 10,000. */
const MARK_DEVICES = 100;

type Drawing = { kind: 'share'; of: number } | { kind: 'count'; marks: number; each: number };

/** What the value states, when it is a share ("≈92%", "−38%") or a count ("10,000+"). Anything else is not drawn. */
function drawingOf(value: string): Drawing | null {
  const share = /^[≈−-]?(\d+(?:\.\d+)?)%$/.exec(value);
  if (share?.[1]) return { kind: 'share', of: Number(share[1]) };
  const count = /^(\d[\d,]*)\+?$/.exec(value);
  if (count?.[1]) {
    const devices = Number(count[1].replaceAll(',', ''));
    return { kind: 'count', marks: Math.min(devices / MARK_DEVICES, SIDE * SIDE), each: MARK_DEVICES };
  }
  return null;
}

/** The path of the squares `first` up to (not including) `last`, counted along the rows from the top left. */
function squares(first: number, last: number): string {
  let path = '';
  for (let index = first; index < last; index += 1) {
    const x = (index % SIDE) * (CELL + GAP);
    const y = Math.floor(index / SIDE) * (CELL + GAP);
    path += `M${x} ${y}h${CELL}v${CELL}h-${CELL}z`;
  }
  return path;
}

interface RoleFigureProps {
  headline: RoleHeadline;
  /** Where it sits: a role's card, or the lead of its panel. */
  place: 'card' | 'panel';
}

/**
 * A role's one figure: the number, what it measures with its scope, and a field of 100 marks
 * that draws exactly what the number states. A share is that many marks of the hundred, solid,
 * the rest outlined; a count is its marks, each standing for 100. A figure the content states in
 * any other form is shown as its number and its words alone.
 */
export function RoleFigure({ headline, place }: RoleFigureProps) {
  const drawing = drawingOf(headline.value);
  const solid = drawing?.kind === 'share' ? Math.round(drawing.of) : (drawing?.marks ?? 0);
  return (
    <div className={styles.figure} data-place={place} data-figure={drawing?.kind}>
      {drawing ? (
        <svg aria-hidden="true" focusable="false" viewBox={`0 0 ${EXTENT} ${EXTENT}`} className={styles.field}>
          <path d={squares(0, solid)} className={styles.solid} />
          <path d={squares(solid, SIDE * SIDE)} className={styles.rest} />
        </svg>
      ) : null}
      <p className={styles.reading}>
        <span className={`type-figure ${styles.value}`}>{headline.value}</span>
        <span className={styles.label}>{headline.label}</span>
        {drawing?.kind === 'count' ? <span className={styles.key}>×{drawing.each}</span> : null}
      </p>
    </div>
  );
}
