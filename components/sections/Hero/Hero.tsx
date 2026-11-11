import type { CSSProperties } from 'react';

import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { DetailSet } from '@/components/ui/DetailPanel';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { StageView } from '@/components/visuals/StageView';
import { hero } from '@/content/hero';
import { cn } from '@/lib/cn';
import { entranceVars } from '@/lib/entrance';

import { Career } from './Career';
import styles from './Hero.module.css';
import { figureItems, Readings } from './Readings';

const step = (index: number): CSSProperties => ({ '--i': index }) as CSSProperties;

/**
 * The front door, one screen at 1440 by 900: who, one line of positioning, two actions and
 * three links; beside them the three headline figures as live readings; and along the bottom
 * edge the career drawn to scale, edge to edge. They arrive in a written order (`lib/entrance.ts`):
 * the field, the headline, the line, the actions, the readings, the scale.
 */
export function Hero() {
  const { headline } = hero;
  return (
    <div
      style={entranceVars as unknown as CSSProperties}
      className="relative isolate flex flex-col pt-[clamp(1rem,2.5vw,2rem)] md:pb-6 lg:min-h-[calc(100svh-var(--header-height)-1px)]"
    >
      <StageView view="hero-field" posterClassName={styles.poster} className="-z-10" />
      <DetailSet label="Headline figures" items={figureItems}>
        <Container className="grid flex-1 grid-cols-[minmax(0,1fr)] content-center gap-y-5 pb-4 md:pb-6 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-center lg:gap-x-12 xl:grid-cols-[minmax(0,1fr)_30rem]">
          <section id="top" aria-labelledby="top-title">
            <p className={cn(styles.eyebrow, 'type-eyebrow @container max-w-none text-muted')}>
              <span className="@max-[21.75rem]:block">{hero.eyebrow.name}</span>
              <span className="@max-[21.75rem]:hidden"> · </span>
              <span className="@max-[21.75rem]:block">{hero.eyebrow.location}</span>
            </p>
            <h1 id="top-title" className={cn(styles.headline, 'type-hero mt-3 sm:mt-5')}>
              {headline.lead}
              <em className="type-serif-em text-accent">{headline.emphasis}</em>
              {headline.tail}
            </h1>
            <p
              className={cn(
                styles.line,
                'mt-3 max-w-[52ch] text-base leading-normal text-muted sm:mt-6 sm:text-[1.1875rem] sm:leading-relaxed',
              )}
            >
              {hero.positioning}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 sm:mt-6">
              <ButtonLink
                href={hero.actions.primary.href}
                size="lg"
                magnetic
                className={cn(styles.action, 'max-sm:min-h-11 max-sm:px-4 max-sm:text-[0.9375rem]')}
                style={step(0)}
              >
                {hero.actions.primary.label}
              </ButtonLink>
              <ButtonLink
                href={hero.actions.secondary.href}
                size="lg"
                variant="secondary"
                download
                className={cn(styles.action, 'max-sm:min-h-11 max-sm:px-4 max-sm:text-[0.9375rem]')}
                style={step(1)}
              >
                {hero.actions.secondary.label}
              </ButtonLink>
              <ul className={cn(styles.action, 'flex flex-wrap items-center gap-x-3')} style={step(2)}>
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

          <Readings />
        </Container>
      </DetailSet>
      <Career />
    </div>
  );
}
