import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type Columns = 3 | 4 | 5;

/** Written out in full so Tailwind finds each class. */
const grid: Record<Columns, string> = {
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4',
  5: 'xl:grid-cols-5',
};

interface SnapRowProps extends HTMLAttributes<HTMLOListElement | HTMLUListElement> {
  as?: 'ul' | 'ol';
  /** Columns of the grid the row becomes from 1280 px. */
  columns: Columns;
}

/**
 * A set laid out sideways. On a phone or a tablet it is one horizontally snapping row that
 * bleeds to the screen edges, with the next card peeking; from 1280 px it is a grid, so a
 * set never becomes a long vertical stack.
 */
export function SnapRow({ as: Tag = 'ul', columns, className, ...rest }: SnapRowProps) {
  return (
    <Tag
      className={cn(
        '-mx-gutter flex snap-x snap-mandatory items-start gap-4 overflow-x-auto px-gutter pb-2 scroll-px-gutter',
        '*:shrink-0 *:basis-[min(84%,21rem)] *:snap-start',
        'xl:mx-0 xl:grid xl:overflow-visible xl:px-0 xl:pb-0 xl:*:basis-auto',
        grid[columns],
        className,
      )}
      {...rest}
    />
  );
}
