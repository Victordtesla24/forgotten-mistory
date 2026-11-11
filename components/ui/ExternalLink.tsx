import { ArrowUpRight } from 'lucide-react';
import type { AnchorHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

import { VisuallyHidden } from './VisuallyHidden';

/**
 * A link to somewhere else. http(s) links open in a new tab and say so to
 * assistive technology; mailto: and tel: links are left alone.
 */
export function ExternalLink({
  href,
  className,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const newTab = /^https?:/.test(href);
  return (
    <a
      href={href}
      className={cn(
        'inline-flex items-center gap-1 text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent active:opacity-70',
        className,
      )}
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {children}
      {newTab ? (
        <>
          <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
          <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
        </>
      ) : null}
    </a>
  );
}
