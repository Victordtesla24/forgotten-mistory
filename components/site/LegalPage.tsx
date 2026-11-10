import Link from 'next/link';
import type { ReactNode } from 'react';

import { Container } from '@/components/ui/Container';
import { Ruler } from '@/components/ui/Ruler';
import { copyright, type Inline, type LegalDocument } from '@/content/legal';

const linkClass =
  'text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent';

function Inlines({ parts }: { parts: readonly Inline[] }): ReactNode {
  return parts.map((part, index) => {
    if (typeof part === 'string') return part;
    if ('term' in part) {
      return (
        <span key={index} className="type-meta text-[0.9375rem] text-text">
          {part.term}
        </span>
      );
    }
    return part.href.startsWith('/') ? (
      <Link key={index} href={part.href} className={linkClass}>
        {part.text}
      </Link>
    ) : (
      <a key={index} href={part.href} className={linkClass}>
        {part.text}
      </a>
    );
  });
}

/** A stable anchor for a section, taken from its heading: "1 · Ownership" becomes "1-ownership". */
function anchorFor(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * A long-form legal document: back link, title, date, lede, a contents list on wide
 * screens, the sections at a comfortable measure and the copyright line.
 */
export function LegalPage({ legal }: { legal: LegalDocument }) {
  const sections = legal.sections.map((section) => ({ ...section, anchor: anchorFor(section.heading) }));

  return (
    <Container className="pt-6 md:pt-10">
      <Link
        href="/"
        className="type-small inline-flex min-h-11 items-center text-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-text"
      >
        ← Back to the portfolio
      </Link>

      <Ruler min={0} max={60} step={1} className="mt-6 mb-10" />

      <header className="grid gap-4">
        <p className="type-eyebrow text-muted">Legal</p>
        <h1 className="max-w-[22ch]">{legal.title}</h1>
        <p className="type-meta text-muted">{legal.updated}</p>
        <p className="type-body mt-4 max-w-[62ch] text-[1.1875rem] text-muted">
          <Inlines parts={legal.lede} />
        </p>
      </header>

      <div className="mt-14 grid gap-12 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-20">
        <nav aria-label="On this page" className="hidden lg:block">
          <div className="sticky top-[calc(var(--header-height)+2rem)]">
            <p className="type-eyebrow text-muted">On this page</p>
            <ol className="mt-4 grid border-l border-line">
              {sections.map((section) => (
                <li key={section.anchor}>
                  <a
                    href={`#${section.anchor}`}
                    className="type-small -ml-px inline-flex min-h-8 items-center border-l border-transparent py-1 pl-4 text-muted transition-colors hover:border-accent hover:text-text"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <div className="grid max-w-[68ch] gap-10">
          {sections.map((section) => {
            const headingId = `${section.anchor}-title`;
            const listAfter = section.list?.after ?? section.body.length;
            return (
              <section
                key={section.anchor}
                id={section.anchor}
                aria-labelledby={headingId}
                className="grid gap-4 border-t border-line pt-8 first:border-t-0 first:pt-0"
              >
                <h2 id={headingId} className="type-h3">
                  {section.heading}
                </h2>
                {section.body.slice(0, listAfter).map((paragraph, at) => (
                  <p key={at} className="type-body">
                    <Inlines parts={paragraph} />
                  </p>
                ))}
                {section.list ? (
                  <ul className="type-body grid list-disc gap-2 pl-5 marker:text-muted">
                    {section.list.items.map((item, at) => (
                      <li key={at} className="pl-1">
                        <Inlines parts={item} />
                      </li>
                    ))}
                  </ul>
                ) : null}
                {section.body.slice(listAfter).map((paragraph, at) => (
                  <p key={at} className="type-body">
                    <Inlines parts={paragraph} />
                  </p>
                ))}
              </section>
            );
          })}
        </div>
      </div>

      <p className="type-meta mt-16 border-t border-line pt-6 text-muted">{copyright}</p>
    </Container>
  );
}
