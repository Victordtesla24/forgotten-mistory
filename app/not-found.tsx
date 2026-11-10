import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { navItems } from '@/components/site/nav';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Ruler } from '@/components/ui/Ruler';
import { site } from '@/content/site';

export const metadata: Metadata = {
  title: `Page not found — ${site.name}`,
  robots: { index: false },
};

/** Shown for any address that does not exist: says so plainly and offers the way back in. */
export default function NotFound() {
  return (
    <Container className="pt-[clamp(2rem,6vw,5rem)]">
      <Ruler min={0} max={60} step={1} className="mb-10" />
      <p className="type-eyebrow text-muted">Error 404</p>
      <h1 className="mt-4 max-w-[18ch]">
        Page <em className="type-serif-em">not found</em>
      </h1>
      <p className="type-body mt-6 max-w-[52ch] text-muted">
        There is nothing at this address. It may have been mistyped, or the page may have moved.
        These links go straight to the parts of the portfolio.
      </p>

      <nav aria-label="Portfolio sections" className="mt-10">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {navItems.map((item) => (
            <li key={item.id}>
              <Link
                href={`/#${item.id}`}
                className="group flex min-h-14 items-center justify-between gap-3 rounded-md border border-line bg-surface px-4 font-medium shadow-card transition-colors hover:border-line-strong hover:bg-raised"
              >
                {item.label}
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <ButtonLink href="/" size="lg" variant="secondary" className="mt-10">
        Back to the start
      </ButtonLink>
    </Container>
  );
}
