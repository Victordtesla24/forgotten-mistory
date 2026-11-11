'use client';

import type { ComponentProps, KeyboardEvent } from 'react';

const KEYS = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];

/** Left and right arrows, Home and End move focus between the links of the list; Enter on one opens its role. */
function moveBetweenBars(event: KeyboardEvent<HTMLOListElement>): void {
  if (!KEYS.includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
  const bars = Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>('a'));
  const here = bars.indexOf(document.activeElement as HTMLAnchorElement);
  if (here < 0) return;
  const target =
    event.key === 'Home' ? 0 : event.key === 'End' ? bars.length - 1 : here + (event.key === 'ArrowRight' ? 1 : -1);
  const next = bars[Math.min(Math.max(target, 0), bars.length - 1)];
  if (!next) return;
  event.preventDefault();
  next.focus();
}

/** A list of role links, the bars of the career scale or the chips of a phone's row, with arrow-key movement between them. */
export function BarList({ children, ...rest }: Omit<ComponentProps<'ol'>, 'onKeyDown'>) {
  return (
    <ol {...rest} onKeyDown={moveBetweenBars}>
      {children}
    </ol>
  );
}
