import { Plus } from 'lucide-react';
import type { CSSProperties } from 'react';

import { DetailSet, type DetailItem } from '@/components/ui/DetailPanel';
import { Figure } from '@/components/ui/Figure';
import { StageView } from '@/components/visuals/StageView';
import { ViewTrigger } from '@/components/visuals/ViewTrigger';
import { headlineFigures, type HeadlineFigure } from '@/content/proof';
import { cn } from '@/lib/cn';
import { readingView, visualStart } from '@/lib/readings';

import { ReadingVisual } from './ReadingVisual';
import styles from './Readings.module.css';

const panelId = (figure: HeadlineFigure) => `figure-${figure.id}`;

const items: readonly DetailItem[] = headlineFigures.map((figure) => ({
  id: panelId(figure),
  eyebrow: figure.scope,
  title: figure.label,
  lead: (
    <Figure value={figure.value} prefix={figure.prefix} suffix={figure.suffix} className="text-proof" />
  ),
  children: <p className="max-w-[62ch]">{figure.story}</p>,
}));

/**
 * The three headline figures as live readings. Each card is a visual whose marks are the
 * number, drawn by the stage from the figure's own counts, with the figure, its label and
 * its scope under it; opening it shows the story behind the number. `#proof` is the anchor
 * of the group. On a phone the cards stack; beside the headline they are a column.
 */
export function Readings({ className }: { className?: string }) {
  return (
    <section id="proof" aria-labelledby="proof-title" className={className}>
      <h2 id="proof-title" className="sr-only">
        Headline figures
      </h2>

      <DetailSet label="Headline figures" items={items}>
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
                  '@container group relative block overflow-hidden rounded-lg border border-line shadow-card',
                  'transition-[border-color] hover:border-accent/50 focus-visible:outline-offset-[-3px]',
                )}
              >
                <span className={cn(styles.visual, 'border-b border-line')}>
                  <StageView
                    view={readingView(figure.id)}
                    marks={figure.marks}
                    posterClassName="bg-surface/70"
                    className="[--stage-fade:var(--duration-state)]"
                  >
                    <ReadingVisual id={figure.id} />
                  </StageView>
                </span>
                <span className="relative grid gap-x-4 gap-y-1 bg-surface/70 px-4 py-3 transition-colors group-hover:bg-raised/90 group-active:bg-raised @[26rem]:grid-cols-[7.5rem_minmax(0,1fr)] @[26rem]:items-center">
                  <Figure
                    value={figure.value}
                    prefix={figure.prefix}
                    suffix={figure.suffix}
                    countUp={false}
                    className="text-[1.75rem]! text-proof"
                  />
                  <span className="pr-7 text-[0.9375rem] leading-snug font-medium">{figure.label}</span>
                  <span className="type-meta text-muted @[26rem]:col-span-2">{figure.scope}</span>
                  <Plus
                    aria-hidden="true"
                    className="absolute top-3.5 right-4 size-4 text-muted transition-[color,rotate] group-hover:rotate-90 group-hover:text-accent"
                  />
                </span>
              </ViewTrigger>
            </li>
          ))}
        </ul>
      </DetailSet>
    </section>
  );
}
