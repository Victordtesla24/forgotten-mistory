import { Plus } from 'lucide-react';
import type { CSSProperties } from 'react';

import type { DetailItem } from '@/components/ui/DetailPanel';
import { Figure } from '@/components/ui/Figure';
import { StageView } from '@/components/visuals/StageView';
import { ViewTrigger } from '@/components/visuals/ViewTrigger';
import { headlineFigures, type HeadlineFigure } from '@/content/proof';
import { cn } from '@/lib/cn';
import { keyOf, readingView, visualStart } from '@/lib/readings';

import { ReadingTile } from './ReadingTile';
import { ReadingVisual } from './ReadingVisual';
import styles from './Readings.module.css';

const panelId = (figure: HeadlineFigure) => `figure-${figure.id}`;

/** The last line of every tile: what one mark stands for and, where there is room, the count the figure states beyond what is drawn. */
function ReadingKey({ figure, mode }: { figure: HeadlineFigure; mode: 'points' | 'blocks' }) {
  return (
    <span className={cn(styles.key, 'type-meta text-muted')}>
      {keyOf(figure.id, mode)}
      <span className={styles.bound}> · {figure.bound}</span>
    </span>
  );
}

/** One panel for each figure: its own reading, enlarged, leads; the number and the story follow. */
export const figureItems: readonly DetailItem[] = headlineFigures.map((figure) => ({
  id: panelId(figure),
  eyebrow: figure.scope,
  title: figure.label,
  lead: (
    <figure className="grid gap-3">
      <ReadingTile id={figure.id} place="panel" mode={figure.id === 'telemetry' ? 'points' : undefined} className={styles.panelTile}>
        <ReadingVisual id={figure.id} />
        <ReadingKey figure={figure} mode="points" />
      </ReadingTile>
      <figcaption className="type-meta max-w-none text-muted">{figure.note}</figcaption>
    </figure>
  ),
  children: (
    <>
      <p>
        <Figure value={figure.value} prefix={figure.prefix} suffix={figure.suffix} className="text-proof" />
      </p>
      <p className="max-w-[62ch]">{figure.story}</p>
    </>
  ),
}));

/**
 * The three headline figures as live readings. Each card is a visual whose marks are the
 * number, drawn by the stage from the figure's own counts, with the figure, its label and
 * its scope under it; opening it shows its panel. `#proof` is the anchor of the group. Their
 * panels are set up in `Hero`, around the whole first screen, so that without script every
 * story is read at the page's own width after the scale rather than inside the cards. On a
 * phone the cards are a row to move along; from 700 px they are three side by side, and on a
 * wide screen they are the row under the headline.
 */
export function Readings({ className }: { className?: string }) {
  return (
    <section id="proof" aria-labelledby="proof-title" className={className}>
      <h2 id="proof-title" className="sr-only">
        Headline figures
      </h2>

      <ul className={styles.row}>
        {headlineFigures.map((figure, index) => (
          <li
            key={figure.id}
            className={styles.reading}
            style={{ '--i': index, '--vs': `${visualStart(figure.id)}ms` } as CSSProperties}
          >
            <ViewTrigger
              view={readingView(figure.id)}
              value={figure.id}
              panel={panelId(figure)}
              className={cn(
                '@container group relative flex h-full flex-col overflow-hidden rounded-lg border border-line shadow-card',
                'transition-[border-color] hover:border-accent/50 focus-visible:outline-offset-[-3px]',
              )}
            >
              <ReadingTile
                id={figure.id}
                place="card"
                mode={figure.id === 'telemetry' ? 'blocks' : undefined}
                className={cn(styles.visual, 'border-b border-line')}
              >
                <StageView
                  view={readingView(figure.id)}
                  marks={figure.marks}
                  posterClassName="bg-surface"
                  className="[--stage-fade:var(--duration-state)]"
                >
                  <ReadingVisual id={figure.id} />
                </StageView>
                <ReadingKey figure={figure} mode="blocks" />
              </ReadingTile>
              <span className={styles.text}>
                <Figure
                  value={figure.value}
                  prefix={figure.prefix}
                  suffix={figure.suffix}
                  countUp={false}
                  className="text-[1.75rem]! text-proof"
                />
                <span className="pr-7 text-[0.9375rem] leading-snug font-medium">{figure.label}</span>
                <span className="type-meta text-muted">{figure.scope}</span>
                <Plus
                  aria-hidden="true"
                  className="absolute top-3.5 right-4 size-4 text-muted transition-[color,rotate] group-hover:rotate-90 group-hover:text-accent"
                />
              </span>
            </ViewTrigger>
          </li>
        ))}
      </ul>
    </section>
  );
}
