import type { ElementType, HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

interface ContainerProps extends HTMLAttributes<HTMLElement> {
  /** The element to render. Defaults to a div. */
  as?: ElementType;
}

/** Centres content at the site width with the fluid gutters. */
export function Container({ as: Tag = 'div', className, ...rest }: ContainerProps) {
  return <Tag className={cn('mx-auto w-full max-w-content px-gutter', className)} {...rest} />;
}
