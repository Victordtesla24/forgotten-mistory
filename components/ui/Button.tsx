'use client';

import Link from 'next/link';
import {
  useRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type PointerEvent,
} from 'react';

import { cn } from '@/lib/cn';
import { reducedMotion } from '@/lib/motion';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'lg';

interface Shared {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** A subtle pull towards the pointer. Fine pointers only, never under reduced motion. */
  magnetic?: boolean;
}

const base =
  'relative inline-flex select-none items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-[background-color,border-color,color,translate] disabled:pointer-events-none disabled:opacity-50';

const sizes: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 text-[0.9375rem]',
  lg: 'min-h-12 px-6 text-[1.0625rem]',
};

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-bg hover:bg-[color-mix(in_oklab,var(--accent),var(--text)_12%)]',
  secondary: 'border border-line-strong bg-surface text-text hover:border-muted hover:bg-raised',
  ghost: 'text-text hover:bg-raised',
};

const PULL = 0.2;
const MAX_PULL = 6;

/** Handlers that nudge an element towards a fine pointer through CSS custom properties. */
function useMagnetic(enabled: boolean | undefined) {
  const ref = useRef<HTMLElement | null>(null);

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!enabled || !el || event.pointerType !== 'mouse') return;
    if (reducedMotion()) return;
    const box = el.getBoundingClientRect();
    const dx = (event.clientX - (box.left + box.width / 2)) * PULL;
    const dy = (event.clientY - (box.top + box.height / 2)) * PULL;
    const clamp = (v: number) => Math.max(-MAX_PULL, Math.min(MAX_PULL, v));
    el.style.setProperty('translate', `${clamp(dx)}px ${clamp(dy)}px`);
  };

  const onPointerLeave = () => {
    ref.current?.style.removeProperty('translate');
  };

  return { ref, onPointerMove, onPointerLeave };
}

function styles({ variant = 'primary', size = 'md' }: Shared, className?: string) {
  return cn(base, sizes[size], variants[variant], className);
}

export function Button({
  variant,
  size,
  magnetic,
  className,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & Shared) {
  const pull = useMagnetic(magnetic);
  return (
    <button
      type={type}
      className={styles({ variant, size }, className)}
      ref={(el) => {
        pull.ref.current = el;
      }}
      onPointerMove={pull.onPointerMove}
      onPointerLeave={pull.onPointerLeave}
      {...rest}
    />
  );
}

/** Routes inside the app, but not files such as the CV, go through next/link. */
function isAppRoute(href: string) {
  return href.startsWith('/') && !href.startsWith('//') && !/\.[a-z0-9]+$/i.test(href);
}

export function ButtonLink({
  variant,
  size,
  magnetic,
  className,
  href,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & Shared & { href: string }) {
  const pull = useMagnetic(magnetic);
  const external = /^https?:/.test(href);
  const props = {
    className: styles({ variant, size }, className),
    ref: (el: HTMLAnchorElement | null) => {
      pull.ref.current = el;
    },
    onPointerMove: pull.onPointerMove,
    onPointerLeave: pull.onPointerLeave,
    ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
    ...rest,
  };
  return isAppRoute(href) ? <Link href={href} {...props} /> : <a href={href} {...props} />;
}
