import type { CSSProperties } from 'react';

import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { DetailSet } from '@/components/ui/DetailPanel';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { StageView } from '@/components/visuals/StageView';
import { hero } from '@/content/hero';
import { cn } from '@/lib/cn';
import { entranceVars } from '@/lib/entrance';
import { LABEL_LANES } from '@/lib/timeline';

import { Career } from './Career';
import styles from './Hero.module.css';
import { figureItems, Readings } from './Readings';

const step = (index: number): CSSProperties => ({ '--i': index }) as CSSProperties;

/** The hero's custom properties: the entrance table, and the number of lanes the scale reserves above its bars. */
const rootVars = { ...entranceVars, '--lane-count': LABEL_LANES } as unknown as CSSProperties;

/**
 * The front door, one screen from 1280 by 720 up: who, one line of positioning, two actions and
 * three links; under them the three headline figures as live readings; and along the bottom
 * edge the career drawn to scale, edge to edge. They arrive in a written order (`lib/entrance.ts`):
 * the field, the headline, the line, the actions, the readings, the scale. From 1024 px with a
 * mouse the hero is one grid whose rows are sized in CSS (`Hero.module.css`), so no row moves
 * when the one after it is parsed.
 */
export function Hero() {
  const { headline } = hero;
  return (
    <div style={rootVars} className={cn(styles.root, 'relative isolate flex flex-col')}>
      <StageView view="hero-field" posterClassName={styles.poster} className="-z-10" />
      <DetailSet label="Headline figures" items={figureItems}>
        <div className={styles.first}>
          <Container className={styles.top}>
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

              <div className={cn(styles.buttons, 'mt-4 flex flex-wrap items-center gap-x-3 sm:mt-6')}>
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
          </Container>
          <Container className={styles.proof}>
            <Readings />
          </Container>
        </div>
      </DetailSet>
      <Career />
    </div>
  );
}
