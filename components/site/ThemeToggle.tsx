'use client';

import { SunMoon } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { reducedMotion } from '@/lib/motion';

import { THEME_KEY } from './theme';

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => unknown;
};

/**
 * Switches between the light and dark themes and remembers the choice. The icon
 * is the same in both states so the server render never disagrees with the page.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const toggle = () => {
    const root = document.documentElement;
    const current =
      root.dataset.theme ??
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    const next = current === 'light' ? 'dark' : 'light';
    const apply = () => {
      root.dataset.theme = next;
    };

    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage is unavailable: the choice applies to this visit only.
    }

    const doc = document as ViewTransitionDocument;
    if (doc.startViewTransition && !reducedMotion()) {
      doc.startViewTransition(apply);
    } else {
      apply();
    }
  };

  return (
    <Button
      variant="ghost"
      aria-label="Switch colour theme"
      onClick={toggle}
      className={cn('size-11 px-0', className)}
    >
      <SunMoon aria-hidden="true" className="size-5" />
    </Button>
  );
}
