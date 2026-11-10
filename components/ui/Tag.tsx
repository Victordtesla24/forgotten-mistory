import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'accent' | 'proof';

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  neutral: 'border-line-strong text-muted',
  accent: 'border-accent/50 text-accent',
  proof: 'border-proof/50 text-proof',
};

/** A small mono label: a stack, a status, a category. */
export function Tag({ tone = 'neutral', className, ...rest }: TagProps) {
  return (
    <span
      className={cn(
        'type-meta inline-flex items-center rounded-sm border px-2 py-0.5 whitespace-nowrap',
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
