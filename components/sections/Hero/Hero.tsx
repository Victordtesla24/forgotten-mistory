import type { CSSProperties } from 'react';

import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { StageView } from '@/components/visuals/StageView';
import { hero } from '@/content/hero';
import { cn } from '@/lib/cn';

import { Proof } from '../Proof/Proof';
import { CareerScale } from './CareerScale';
import styles from './Hero.module.css';

/** Entrance delays in milliseconds. The headline needs none; the last element lands before 900 ms. */
const ENTER = { eyebrow: 60, statement: 140, actions: 220, proof: 300, panel: 100 } as const;

function after(delay: number): CSSProperties {
  return { animationDelay: `${delay}ms` };
}

/**
 * The front door: who, one line of positioning, one next action and the headline figures,
 * then the career drawn to scale. The sections of the first screen share one grid. In
 * reading order they are the introduction, the figures and the career scale; from 1024px
 * the career scale moves up beside the introduction and the figures run underneath both,
 * so on every screen the three figures sit in the first view.
 */
export function Hero() {
  const { headline } = hero;
  return (
    <div className="relative isolate pt-[clamp(1rem,2.5vw,2rem)] pb-[clamp(1.75rem,3.5vw,2.5rem)]">
      <StageView view="hero-field" posterClassName={styles.poster} />
      <Container className="grid grid-cols-[minmax(0,1fr)] gap-y-4 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-x-12">
        <section
          id="top"
          aria-labelledby="top-title"
          className="lg:col-start-1 lg:row-start-1 lg:self-center"
        >
          <div className={styles.rise} style={after(ENTER.eyebrow)}>
            <p className="type-eyebrow @container max-w-none text-muted">
              <span className="@max-[21.75rem]:block">{hero.eyebrow.name}</span>
              <span className="@max-[21.75rem]:hidden"> · </span>
              <span className="@max-[21.75rem]:block">{hero.eyebrow.location}</span>
            </p>
          </div>
          <h1 id="top-title" className={cn(styles.title, 'type-hero mt-3 sm:mt-5')}>
            {headline.lead}
            <em className="type-serif-em text-accent">{headline.emphasis}</em>
            {headline.tail}
          </h1>
          <p
            className={cn(
              styles.lift,
              'mt-3 max-w-[52ch] text-base leading-normal text-muted sm:mt-6 sm:text-[1.1875rem] sm:leading-relaxed',
            )}
            style={after(ENTER.statement)}
          >
            {hero.positioning}
          </p>

          <div
            className={cn(styles.rise, 'mt-4 flex flex-wrap items-center gap-x-3 sm:mt-6')}
            style={after(ENTER.actions)}
          >
            <ButtonLink
              href={hero.actions.primary.href}
              size="lg"
              magnetic
              className="max-sm:min-h-11 max-sm:px-4 max-sm:text-[0.9375rem]"
            >
              {hero.actions.primary.label}
            </ButtonLink>
            <ButtonLink
              href={hero.actions.secondary.href}
              size="lg"
              variant="secondary"
              download
              className="max-sm:min-h-11 max-sm:px-4 max-sm:text-[0.9375rem]"
            >
              {hero.actions.secondary.label}
            </ButtonLink>
            <ul className="flex flex-wrap items-center gap-x-3">
              {hero.links.map((link) => (
                <li key={link.label}>
                  <ExternalLink href={link.href} className="type-small min-h-11 min-w-11">
                    {link.label}
                  </ExternalLink>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Proof
          className={cn(styles.rise, 'lg:col-span-2 lg:row-start-2')}
          style={after(ENTER.proof)}
        />

        <div
          className={cn(styles.rise, 'w-full lg:col-start-2 lg:row-start-1 lg:self-center')}
          style={after(ENTER.panel)}
        >
          <CareerScale />
        </div>
      </Container>
    </div>
  );
}
