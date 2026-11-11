import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type Columns = 3 | 4 | 5 | 6;

/** Written out in full so Tailwind finds each class. */
const grid: Record<Columns, string> = {
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4',
  5: 'xl:grid-cols-5',
  6: 'xl:grid-cols-6',
};

type SnapRowProps = HTMLAttributes<HTMLOListElement | HTMLUListElement> & {
  as?: 'ul' | 'ol';
} & (
    | {
        /** Columns of the grid the row becomes from 1280 px. */
        columns: Columns;
        strip?: never;
      }
    | {
        columns?: never;
        /** A row of controls that stays one row at every width, however many there are. */
        strip: true;
      }
  );

/**
 * A set laid out sideways. On a phone or a tablet it is one horizontally snapping row that
 * bleeds to the screen edges, with the next card peeking; from 1280 px it is a grid, so a
 * set never becomes a long vertical stack. A `strip` is a row of small controls (the role
 * chips): one row at every width, each item its own width, a gap of 8 px between them, and
 * a fade over the gutter at each end so a row that goes on past the edge shows that it does.
 */
export function SnapRow({ as: Tag = 'ul', columns, strip, className, ...rest }: SnapRowProps) {
  return (
    <Tag
      className={cn(
        strip
          ? [
              'flex snap-x snap-proximity items-center gap-2 overflow-x-auto overscroll-x-contain px-gutter scroll-px-gutter',
              '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden *:shrink-0 *:snap-start',
              '[mask-image:linear-gradient(to_right,transparent,#000_1.25rem,#000_calc(100%_-_1.25rem),transparent)]',
            ]
          : [
              '-mx-gutter flex snap-x snap-mandatory items-start gap-4 overflow-x-auto px-gutter pb-2 scroll-px-gutter',
              '*:shrink-0 *:basis-[min(84%,21rem)] *:snap-start',
              'xl:mx-0 xl:grid xl:overflow-visible xl:px-0 xl:pb-0 xl:*:basis-auto',
              columns ? grid[columns] : undefined,
            ],
        className,
      )}
      {...rest}
    />
  );
}
