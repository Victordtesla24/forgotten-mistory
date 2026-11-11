'use client';

import type { KeyboardEvent, ReactNode } from 'react';

const KEYS = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];

/** Left and right arrows, Home and End move focus between the links of the list; Enter on one opens its role. */
function moveBetweenBars(event: KeyboardEvent<HTMLElement>): void {
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

/**
 * The keys of a list of role links, the bars of the career scale or the chips of a phone's row:
 * arrow-key movement between them. The list itself stays in the page's HTML as it is written; this
 * only listens, and takes no box of its own.
 */
export function BarKeys({ children }: { children: ReactNode }) {
  return (
    <div className="contents" onKeyDown={moveBetweenBars}>
      {children}
    </div>
  );
}
