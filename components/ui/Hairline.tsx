import { cn } from '@/lib/cn';

/**
 * The divider above a section's heading and under a page's title: a plain hairline, with no ticks
 * and no numerals. The only scale on the site is the Experience timeline's, so nothing else is
 * allowed to look like one.
 */
export function Hairline({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('h-px w-full bg-line-strong', className)} />;
}
