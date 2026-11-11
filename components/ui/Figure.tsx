'use client';

import NumberFlow from '@number-flow/react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';
import { reducedMotion } from '@/lib/motion';

import { VisuallyHidden } from './VisuallyHidden';

interface FigureProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * A measured figure. The server HTML and the accessible text always carry the
 * final value; the count-up plays once, only when the figure scrolls into view
 * below the fold, and never under reduced motion.
 */
export function Figure({ value, prefix = '', suffix = '', className }: FigureProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (reducedMotion()) return;
    // Already on screen: the final value stays put rather than flashing to zero.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    setShown(0);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setAnimated(true);
        setShown(value);
        observer.disconnect();
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    // NumberFlow pads its digits by a quarter em above and below for the roll; the figure's own box is the glyphs'.
    <span ref={ref} className={cn('type-figure inline-block -my-[0.25em]', className)}>
      <VisuallyHidden>
        {prefix}
        {value.toLocaleString('en-AU')}
        {suffix}
      </VisuallyHidden>
      <NumberFlow
        aria-hidden="true"
        value={shown}
        prefix={prefix}
        suffix={suffix}
        animated={animated}
        format={{ maximumFractionDigits: 0 }}
      />
    </span>
  );
}
