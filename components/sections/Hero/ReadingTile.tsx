'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import type { ReadingId, ReadingPlace } from '@/lib/readings';

interface ReadingTileProps {
  id: ReadingId;
  /** A card's tile, or the enlarged reading that leads its panel. */
  place: ReadingPlace;
  /** Telemetry only: 100 blocks (a card) or all 10,000 points (the panel), as the key under it says. */
  mode?: 'points' | 'blocks';
  className?: string;
  children: ReactNode;
}

/**
 * The tile a reading is drawn in. Once the page is up it loads `lib/place-reading`, which
 * measures the tile and hands the DOM drawing the very layout the stage's view draws
 * (`readingLayout` in lib/readings.ts), so the two coincide to the pixel. Until then, and
 * without script, the stylesheet's own defaults draw a smaller, countable version. Where script
 * runs the drawing waits, hidden (`data-laid` not yet set), for its layout, so it appears where
 * it stays and no mark is ever seen to move. Every tile ends in the same line of key (`ReadingKey`,
 * written by the page that has the figures, so that this component carries none of them); telemetry's
 * tile says whether it draws 100 blocks or all 10,000 points (`data-mode`).
 */
export function ReadingTile({ id, place, mode, className, children }: ReadingTileProps) {
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
    <span ref={tile} className={className} data-reading={id} data-place={place} data-mode={mode}>
      {children}
    </span>
  );
}
