import type { HTMLAttributes } from 'react';

/** Text for assistive technology only. */
export function VisuallyHidden(props: HTMLAttributes<HTMLSpanElement>) {
  return <span className="sr-only" {...props} />;
}
