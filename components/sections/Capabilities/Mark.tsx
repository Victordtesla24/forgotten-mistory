import type { Source } from '@/content/capabilities';

import styles from './Capabilities.module.css';

/** What each kind of source looks like: a program a disc, a repository a square, a qualification a diamond. */
export const KIND_NAME: Record<Source['kind'], string> = {
  program: 'Program',
  repository: 'Repository',
  credential: 'Qualification',
};

interface MarkProps {
  kind: Source['kind'];
  x: number;
  y: number;
}

/** The mark of a source, centred on (x, y), inside an SVG. */
export function Mark({ kind, x, y }: MarkProps) {
  if (kind === 'program') return <circle cx={x} cy={y} r={5.5} className={styles.mark} />;
  if (kind === 'repository') return <rect x={x - 4.5} y={y - 4.5} width={9} height={9} rx={1.5} className={styles.mark} />;
  return <path d={`M${x} ${y - 6.5}L${x + 6.5} ${y}L${x} ${y + 6.5}L${x - 6.5} ${y}Z`} className={styles.mark} />;
}

/** The hollow mark of a certification still in progress, centred on (x, y), inside an SVG. */
export function PendingMark({ x, y }: Pick<MarkProps, 'x' | 'y'>) {
  return <circle cx={x} cy={y} r={4} className={styles.pending} />;
}

/** A mark on its own, for a key or a list, in the text's line. */
export function MarkIcon({ kind }: { kind: Source['kind'] | 'pending' }) {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden="true" className={styles.icon}>
      {kind === 'pending' ? <PendingMark x={7} y={7} /> : <Mark kind={kind} x={7} y={7} />}
    </svg>
  );
}
