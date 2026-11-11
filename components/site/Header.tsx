'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button, ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { site } from '@/content/site';
import { cn } from '@/lib/cn';

import { MobileMenu } from './MobileMenu';
import { navItems } from './nav';
import { openAssistant } from './openAssistant';
import { ThemeToggle } from './ThemeToggle';

/** The id of the section crossing the middle of the viewport, or null above the first one. */
function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = ids.flatMap((id) => {
      const el = document.getElementById(id);
      return el ? [el] : [];
    });
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) setActive(id);
          else setActive((current) => (current === id ? null : current));
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

const sectionIds = navItems.map((item) => item.id);
const desktopItems = navItems.filter((item) => item.id !== 'contact');

/** The sticky bar: wordmark, section anchors, theme, assistant and the contact action. */
export function Header() {
  const active = useActiveSection(sectionIds);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95 supports-[backdrop-filter]:bg-bg/75 supports-[backdrop-filter]:backdrop-blur-md">
      <Container className="flex h-header items-center justify-between gap-4">
        <Link
          href="/#top"
          className="inline-flex min-h-11 items-center font-semibold tracking-tight whitespace-nowrap"
        >
          {site.name}
        </Link>

        <nav aria-label="Primary" className="hidden min-[900px]:block">
          <ul className="flex items-center gap-1">
            {desktopItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`/#${item.id}`}
                  aria-current={active === item.id ? 'location' : undefined}
                  className={cn(
                    'type-small inline-flex min-h-11 items-center rounded-md px-3 transition-colors hover:bg-raised',
                    active === item.id ? 'text-accent' : 'text-muted hover:text-text',
                  )}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            id="assistant-header-button"
            variant="ghost"
            onClick={openAssistant}
            className="js-only hidden min-[900px]:inline-flex"
          >
            Ask Mini Vic
          </Button>
          <ThemeToggle />
          <ButtonLink
            href="/#contact"
            magnetic
            aria-current={active === 'contact' ? 'location' : undefined}
            className="hidden min-[900px]:inline-flex"
          >
            Contact
          </ButtonLink>
          <MobileMenu active={active} className="min-[900px]:hidden" />
        </div>
      </Container>
      <div
        aria-hidden="true"
        className="scroll-progress absolute inset-x-0 -bottom-px h-0.5 bg-accent"
      />
    </header>
  );
}
