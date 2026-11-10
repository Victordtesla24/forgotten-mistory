import type { CSSProperties } from 'react';

import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { HeroBackdrop } from '@/components/visuals/HeroBackdrop';
import { hero } from '@/content/hero';
import { cn } from '@/lib/cn';

import { CareerScale } from './CareerScale';
import styles from './Hero.module.css';

/** Entrance delays in milliseconds. The headline needs none; the last element lands before 900 ms. */
const ENTER = { eyebrow: 60, statement: 140, actions: 220, links: 300, panel: 100 } as const;

function after(delay: number): CSSProperties {
  return { animationDelay: `${delay}ms` };
}

/** The front door: who, what, one next action, and the career drawn to scale beside it. */
export function Hero() {
  const { headline } = hero;
  return (
    <section
      id="top"
      aria-labelledby="top-title"
      className="relative isolate pt-[clamp(2.25rem,4.5vw,3.5rem)] pb-[clamp(1.75rem,3.5vw,2.5rem)]"
    >
      <HeroBackdrop />
      <Container className="grid grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-14">
        <div>
          <p
            className={cn(styles.rise, 'type-eyebrow max-w-none text-muted')}
            style={after(ENTER.eyebrow)}
          >
            <span className="sm:whitespace-nowrap">
              {hero.name} · {hero.location} ·
            </span>{' '}
            <span className="sm:whitespace-nowrap">{hero.availability}</span>
          </p>
          <h1
            id="top-title"
            className={cn(
              styles.title,
              'type-hero mt-6 lg:text-[clamp(2.75rem,0.9rem+4.8vw,5.25rem)]',
            )}
          >
            {headline.lead}
            <em className="type-serif-em text-accent">{headline.emphasis}</em>
            {headline.tail}
          </h1>
          <p
            className={cn(
              styles.rise,
              'mt-7 max-w-[52ch] text-[1.1875rem] leading-relaxed text-muted',
            )}
            style={after(ENTER.statement)}
          >
            {hero.statement}
          </p>

          <div
            className={cn(styles.rise, 'mt-8 flex flex-wrap items-center gap-3')}
            style={after(ENTER.actions)}
          >
            <ButtonLink href={hero.actions.primary.href} size="lg" magnetic>
              {hero.actions.primary.label}
            </ButtonLink>
            <ButtonLink href={hero.actions.secondary.href} size="lg" variant="secondary" download>
              {hero.actions.secondary.label}
            </ButtonLink>
          </div>

          <ul
            className={cn(styles.rise, 'mt-3 flex flex-wrap items-center gap-x-6 gap-y-1')}
            style={after(ENTER.links)}
          >
            {hero.links.map((link) => (
              <li key={link.label}>
                <ExternalLink href={link.href} className="type-small min-h-11">
                  {link.label}
                </ExternalLink>
              </li>
            ))}
          </ul>
        </div>

        <div
          className={cn(styles.rise, 'w-full')}
          style={after(ENTER.panel)}
        >
          <CareerScale />
        </div>
      </Container>
    </section>
  );
}
