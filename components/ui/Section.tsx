import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { Container } from './Container';
import { Ruler } from './Ruler';

interface SectionProps {
  id: string;
  eyebrow: string;
  title: string;
  /** A phrase inside `title` to set in the serif italic. At most one per heading. */
  accent?: string;
  lede?: ReactNode;
  className?: string;
  children?: ReactNode;
}

function renderTitle(title: string, accent?: string): ReactNode {
  const at = accent ? title.indexOf(accent) : -1;
  if (!accent || at < 0) return title;
  return (
    <>
      {title.slice(0, at)}
      <em className="type-serif-em">{accent}</em>
      {title.slice(at + accent.length)}
    </>
  );
}

/** A page section: a ruler divider, an eyebrow, a heading and an optional lede, then the content. */
export function Section({ id, eyebrow, title, accent, lede, className, children }: SectionProps) {
  const headingId = `${id}-title`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn('pt-[clamp(3rem,6vw,5rem)]', className)}
    >
      <Container>
        <Ruler min={0} max={60} step={1} className="mb-6" />
        <header className="mb-6 grid gap-3 md:mb-8">
          <p className="type-eyebrow text-muted reveal">{eyebrow}</p>
          <h2 id={headingId} className="reveal max-w-[22ch]">
            {renderTitle(title, accent)}
          </h2>
          {lede ? <div className="type-body reveal max-w-[62ch] text-muted">{lede}</div> : null}
        </header>
        {children}
      </Container>
    </section>
  );
}
