'use client';

import type { ComponentProps } from 'react';

import { DetailTrigger } from '@/components/ui/DetailPanel';
import { setActive } from '@/lib/gl/signal';

type ViewTriggerProps = ComponentProps<typeof DetailTrigger> & {
  /** The stage view this control belongs to. */
  view: string;
  /** What the view is told while a reader is on the control: a role id, a figure id. */
  value: string;
};

/**
 * A control that opens a detail panel and tells a stage view when a reader is on it, by
 * pointer, keyboard or touch, so the view's light can answer. The interaction is on the real
 * element; the view only reads the signal.
 */
export function ViewTrigger({ view, value, ...rest }: ViewTriggerProps) {
  return (
    <DetailTrigger
      {...rest}
      onPointerEnter={() => setActive(view, value)}
      onPointerLeave={() => setActive(view, null)}
      onFocus={() => setActive(view, value)}
      onBlur={() => setActive(view, null)}
    />
  );
}
