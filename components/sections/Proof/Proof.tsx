import type { CSSProperties } from 'react';

import { Figure } from '@/components/ui/Figure';
import { Ruler } from '@/components/ui/Ruler';
import { proofEmployers, proofFigures } from '@/content/proof';

/**
 * The three headline figures, each with its scope, and the employers they were earned
 * with. It lives inside the hero's grid, so it takes no container of its own. On a
 * phone each figure is one compact row; from 768px they are three columns.
 */
export function Proof({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <section id="proof" aria-labelledby="proof-title" className={className} style={style}>
      <Ruler min={0} max={60} step={1} />
      <h2 id="proof-title" className="sr-only">
        Headline figures
      </h2>

      <ul className="mt-3 grid divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface/70 shadow-card md:grid-cols-3 md:divide-x md:mt-4 md:divide-y-0">
        {proofFigures.map((figure) => (
          <li
            key={figure.id}
            className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 px-4 py-1.5 md:grid-cols-1 md:p-5"
          >
            <Figure
              value={figure.value}
              prefix={figure.prefix}
              suffix={figure.suffix}
              className="text-proof md:mb-2"
            />
            <p className="text-[1.0625rem] leading-snug font-medium">{figure.label}</p>
            <p className="type-meta col-span-2 max-w-none text-muted md:col-span-1 md:mt-1.5">
              {figure.scope}
            </p>
          </li>
        ))}
      </ul>

      <div className="reveal mt-8 grid gap-3 md:mt-10">
        <p className="type-eyebrow max-w-none text-muted">{proofEmployers.label}</p>
        <ul className="flex flex-wrap gap-x-10 gap-y-2">
          {proofEmployers.names.map((name) => (
            <li key={name} className="text-[1.25rem] font-semibold tracking-tight text-text/70">
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
