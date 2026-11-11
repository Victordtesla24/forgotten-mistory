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
 * Lights the DOM that stands for `value`: every `[data-mark]` of that value inside the control's
 * nearest `[data-marks]` scope gets `data-on` ("key" for a keyboard focus, "point" otherwise), so
 * a stylesheet can answer a control that is somewhere else in the layout (a chip lights its bar
 * and its caption) without the stage and without a render. The attribute is gone with the reader.
 */
function mark(control: HTMLElement, value: string, on: 'key' | 'point' | null): void {
  const scope = control.closest('[data-marks]');
  if (!scope) return;
  for (const element of scope.querySelectorAll<HTMLElement>(`[data-mark="${CSS.escape(value)}"]`)) {
    if (on === null) delete element.dataset.on;
    else element.dataset.on = on;
  }
}

/** What a control that a reader leaves still shows: a keyboard focus stays marked. */
function resting(control: HTMLElement): 'key' | null {
  return control === document.activeElement && control.matches(':focus-visible') ? 'key' : null;
}

/**
 * A control that opens a detail panel and tells a stage view when a reader is on it, by
 * pointer, keyboard or touch, so the view's light can answer. The interaction is on the real
 * element; the view only reads the signal, and the DOM it stands for is marked as above.
 */
export function ViewTrigger({ view, value, ...rest }: ViewTriggerProps) {
  return (
    <DetailTrigger
      {...rest}
      onPointerEnter={(event) => {
        setActive(view, value);
        mark(event.currentTarget, value, 'point');
      }}
      onPointerLeave={(event) => {
        setActive(view, null);
        mark(event.currentTarget, value, resting(event.currentTarget));
      }}
      onFocus={(event) => {
        setActive(view, value);
        mark(event.currentTarget, value, event.currentTarget.matches(':focus-visible') ? 'key' : 'point');
      }}
      onBlur={(event) => {
        setActive(view, null);
        mark(event.currentTarget, value, null);
      }}
    />
  );
}
