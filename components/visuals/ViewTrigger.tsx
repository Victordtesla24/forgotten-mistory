'use client';

import type { ComponentProps, FocusEvent, SyntheticEvent } from 'react';

import { DetailTrigger } from '@/components/ui/DetailPanel';
import { setActive } from '@/lib/gl/signal';

type ViewTriggerProps = ComponentProps<typeof DetailTrigger> & {
  /** The stage view this control belongs to. */
  view: string;
  /** What the view is told while a reader is on the control: a role id, a figure id. */
  value: string;
};

/**
 * Lights the DOM that stands for `value`: the control's nearest `[data-marks]` scope gets
 * `data-active` (the value), and every `[data-mark]` of that value inside it gets `data-on`
 * ("key" for a keyboard focus, "point" otherwise), so a stylesheet can answer a control that is
 * somewhere else in the layout (a chip lights its bar and its caption) without the stage and
 * without a render. Both are gone with the reader.
 */
function mark(control: HTMLElement, value: string, on: 'key' | 'point' | null): void {
  const scope = control.closest<HTMLElement>('[data-marks]');
  if (!scope) return;
  if (on === null) delete scope.dataset.active;
  else scope.dataset.active = value;
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
 * The handlers that tell a stage view when a reader is on a control, by pointer, keyboard or
 * touch, so the view's light can answer, and that mark the DOM the control stands for as above.
 * A press answers before whatever it opens, on touch as much as with a mouse.
 */
export function viewMarks(view: string, value: string) {
  const on = (event: SyntheticEvent<HTMLElement>) => {
    setActive(view, value);
    mark(event.currentTarget, value, 'point');
  };
  return {
    onPointerEnter: on,
    onPointerDown: on,
    onPointerLeave: (event: SyntheticEvent<HTMLElement>) => {
      setActive(view, null);
      mark(event.currentTarget, value, resting(event.currentTarget));
    },
    onFocus: (event: FocusEvent<HTMLElement>) => {
      setActive(view, value);
      mark(event.currentTarget, value, event.currentTarget.matches(':focus-visible') ? 'key' : 'point');
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      setActive(view, null);
      mark(event.currentTarget, value, null);
    },
  };
}

/**
 * A control that opens a detail panel and tells a stage view when a reader is on it. The
 * interaction is on the real element; the view only reads the signal.
 */
export function ViewTrigger({ view, value, ...rest }: ViewTriggerProps) {
  return <DetailTrigger {...rest} {...viewMarks(view, value)} />;
}
