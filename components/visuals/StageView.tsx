import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

import styles from './StageView.module.css';

interface StageViewProps {
  /** The id of the view in `lib/gl/views`. */
  view: string;
  /** Draws the CSS poster: what first paint, no-WebGL and lost-context readers see. */
  posterClassName?: string;
  className?: string;
  /** For a reading: how many marks it draws and in how many groups, as the figure's content states. */
  marks?: { count: number; groups: number };
  /** The semantic fallback: a drawing or text of the same data, shown until the stage has drawn. */
  children?: ReactNode;
}

/**
 * A placeholder the stage draws into. Its rectangle becomes the view's viewport; what it
 * contains is the layer beneath the light, which fades once the stage has drawn the view
 * and returns if the stage gives up. It is decorative and hidden from assistive technology.
 */
export function StageView({ view, posterClassName, className, marks, children }: StageViewProps) {
  return (
    <div
      data-stage-view={view}
      data-marks={marks?.count}
      data-groups={marks?.groups}
      aria-hidden="true"
      className={cn(styles.view, className)}
    >
      <div className={styles.fallback}>
        <div className={cn(styles.poster, posterClassName)} />
        {children}
      </div>
    </div>
  );
}
