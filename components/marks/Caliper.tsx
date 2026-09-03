'use client';

import type { ReactNode } from 'react';

import styles from './Caliper.module.css';

export type CaliperState = 'sourced' | 'self-reported' | 'open';

interface CaliperProps {
  state: CaliperState;
  children: ReactNode;
  /** Overrides the screen-reader gloss when the surrounding copy already says it. */
  label?: string;
  className?: string;
}

/**
 * The caliper bracket — the one mark this site asks a reader to learn.
 *
 * Two hairline arms closing onto a value, in three states:
 *
 *   sourced        solid arms, luminous value    the figure was measured, and its
 *                                                source is printed beneath it
 *   self-reported  solid arms, grey value        a CV figure with no published
 *                                                methodology behind it
 *   open           dashed arms that do not meet  measured, and found honestly
 *                                                unmeasurable — the reason stands
 *                                                where the value would be
 *
 * The open bracket is a positive mark, not a hole. That distinction is the whole
 * point of the device: it is the difference between "I could not honestly
 * measure this" and "I forgot to fill this in". A reader meets all three in the
 * hero and the ledger without a legend, and reads the rest of the page through
 * them.
 *
 * The state is announced to assistive technology as well as drawn, because a
 * mark that only exists visually would make the same claim to sighted readers
 * and no claim at all to everyone else.
 */
export default function Caliper({ state, children, label, className }: CaliperProps) {
  const gloss =
    label ??
    {
      sourced: 'Measured; source given.',
      'self-reported': 'Self-reported figure.',
      open: 'Not measurable; reason given.',
    }[state];

  return (
    <span className={[styles.caliper, className].filter(Boolean).join(' ')} data-state={state}>
      <span className={`${styles.arm} ${styles.armLeft}`} aria-hidden="true" />
      <span className={styles.value}>{children}</span>
      <span className={`${styles.arm} ${styles.armRight}`} aria-hidden="true" />
      <span className={styles.gloss}>{` (${gloss})`}</span>
    </span>
  );
}
