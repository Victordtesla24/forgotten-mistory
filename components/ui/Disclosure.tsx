import { ChevronDown } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface DisclosureProps extends Omit<HTMLAttributes<HTMLDetailsElement>, 'title'> {
  /** What is always on screen: the whole row that opens the detail. */
  summary: ReactNode;
  /** Classes for the summary row. */
  summaryClassName?: string;
  /** Classes for the detail panel. */
  panelClassName?: string;
  children: ReactNode;
}

/**
 * The detail level of an item: a native disclosure, closed by default, with its content
 * in the HTML whether or not script runs. The summary is a full-width row at least 44 px
 * tall, so it is a touch target as well as a label.
 */
export function Disclosure({
  summary,
  summaryClassName,
  panelClassName,
  className,
  children,
  ...rest
}: DisclosureProps) {
  return (
    <details className={cn('group', className)} {...rest}>
      <summary
        className={cn(
          'flex min-h-11 w-full list-none items-start justify-between gap-3 marker:content-none [&::-webkit-details-marker]:hidden',
          summaryClassName,
        )}
      >
        <div className="min-w-0 flex-1">{summary}</div>
        <ChevronDown
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
        />
      </summary>
      <div className={panelClassName}>{children}</div>
    </details>
  );
}
