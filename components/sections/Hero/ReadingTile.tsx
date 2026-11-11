'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import type { ReadingId, ReadingPlace } from '@/lib/readings';

interface ReadingTileProps {
  id: ReadingId;
  /** A card's tile, or the enlarged reading that leads its panel. */
  place: ReadingPlace;
  className?: string;
  children: ReactNode;
}

/**
 * The tile a reading is drawn in. Once the page is up it loads `lib/place-reading`, which
 * measures the tile and hands the DOM drawing the very layout the stage's view draws
 * (`readingLayout` in lib/readings.ts), so the two coincide to the pixel. Until then, and
 * without script, the stylesheet's own defaults draw a smaller, countable version. Where script
 * runs the drawing waits, hidden (`data-laid` not yet set), for its layout, so it appears where
 * it stays and no mark is ever seen to move. Where telemetry's points cannot be told apart the
 * tile says so (`data-mode="blocks"`) and its key is shown.
 */
export function ReadingTile({ id, place, className, children }: ReadingTileProps) {
  const tile = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = tile.current;
    if (!element) return undefined;
    let current = true;
    let stop = (): void => undefined;
    void import('@/lib/place-reading').then(
      ({ placeReading }) => {
        if (current) stop = placeReading(element, id, place);
      },
      () => {
        // Without the layout code the stylesheet's own drawing stands.
        element.dataset.laid = '';
      },
    );
    return () => {
      current = false;
      stop();
    };
  }, [id, place]);

  return (
    <span ref={tile} className={className} data-reading={id} data-place={place}>
      {children}
    </span>
  );
}
