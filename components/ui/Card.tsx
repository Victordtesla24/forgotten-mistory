'use client';

import type { HTMLAttributes, PointerEvent } from 'react';

import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'article' | 'li' | 'section';
  /** Follows a fine pointer with a soft glow. On by default. */
  spotlight?: boolean;
}

/** A surface with a hairline border. The spotlight is pure CSS once the offsets are set. */
export function Card({
  as: Tag = 'div',
  spotlight = true,
  className,
  onPointerMove,
  ...rest
}: CardProps) {
  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    onPointerMove?.(event);
    if (!spotlight || event.pointerType !== 'mouse') return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--mx', `${event.clientX - box.left}px`);
    event.currentTarget.style.setProperty('--my', `${event.clientY - box.top}px`);
  };

  return (
    <Tag
      className={cn(
        'relative rounded-md border border-line bg-surface p-6 shadow-card transition-colors hover:border-line-strong',
        spotlight && 'spotlight',
        className,
      )}
      onPointerMove={handlePointerMove}
      {...rest}
    />
  );
}
