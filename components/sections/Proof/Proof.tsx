import type { CSSProperties } from 'react';

import { Disclosure } from '@/components/ui/Disclosure';
import { Figure } from '@/components/ui/Figure';
import { Ruler } from '@/components/ui/Ruler';
import { headlineFigures, type HeadlineFigure } from '@/content/proof';

/** One figure with its label and scope; opening it shows the work behind the number. */
function FigureCard({ figure }: { figure: HeadlineFigure }) {
  return (
    <Disclosure
      id={`figure-${figure.id}`}
      summaryClassName="px-4 py-1.5 md:p-5"
      panelClassName="type-small border-t border-line px-4 py-3 text-muted md:px-5 md:py-4"
      summary={
        <span className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 md:grid-cols-1">
          <Figure
            value={figure.value}
            prefix={figure.prefix}
            suffix={figure.suffix}
            className="text-proof md:mb-2"
          />
          <span className="text-[1.0625rem] leading-snug font-medium">{figure.label}</span>
          <span className="type-meta col-span-2 text-muted md:col-span-1 md:mt-1.5">
            {figure.scope}
          </span>
        </span>
      }
    >
      <p className="max-w-none">{figure.story}</p>
    </Disclosure>
  );
}

/**
 * The three headline figures. It lives inside the hero's grid, so it takes no container
 * of its own. On a phone each figure is one compact row; from 768px they are three columns.
 */
export function Proof({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <section id="proof" aria-labelledby="proof-title" className={className} style={style}>
      <Ruler min={0} max={60} step={1} />
      <h2 id="proof-title" className="sr-only">
        Headline figures
      </h2>

      <ul className="mt-3 grid items-start divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface/70 shadow-card md:grid-cols-3 md:divide-x md:divide-y-0">
        {headlineFigures.map((figure) => (
          <li key={figure.id}>
            <FigureCard figure={figure} />
          </li>
        ))}
      </ul>
    </section>
  );
}
