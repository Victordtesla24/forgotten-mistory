import Link from 'next/link';
import type { ReactNode } from 'react';

import { Container } from '@/components/ui/Container';
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

/** A long-form legal document: title, date, lede, numbered sections and the copyright line. */
export function LegalPage({ legal }: { legal: LegalDocument }) {
  return (
    <Container className="py-[clamp(3rem,8vw,6rem)]">
      <Link
        href="/"
        className="type-small inline-flex min-h-11 items-center text-muted underline decoration-line-strong underline-offset-4 hover:text-text"
      >
        ← Back to the portfolio
      </Link>

      <h1 className="mt-6">{legal.title}</h1>
      <p className="type-meta mt-3 text-muted">{legal.updated}</p>
      <p className="mt-8 text-[1.1875rem] leading-relaxed text-muted">
        <Inlines parts={legal.lede} />
      </p>

      <div className="mt-12 grid max-w-[72ch] gap-10">
        {legal.sections.map((section, index) => {
          const headingId = `section-${index}`;
          const listAfter = section.list?.after ?? section.body.length;
          return (
            <section key={section.heading} aria-labelledby={headingId} className="grid gap-4">
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

      <p className="type-meta mt-16 border-t border-line pt-6 text-muted">{copyright}</p>
    </Container>
  );
}
