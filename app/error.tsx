'use client';

import { useEffect, useRef } from 'react';

import { Button, ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';

/** The boundary for a page that failed while rendering: calm wording, one way to retry, one way out. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);

  // Moving focus here tells keyboard and screen-reader users that the page has changed.
  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <Container className="pt-[clamp(2rem,6vw,5rem)]">
      <div className="mb-10 border-t border-line-strong" />
      <p className="type-eyebrow text-muted">Error</p>
      <h1 ref={heading} tabIndex={-1} className="mt-4 max-w-[18ch] outline-none">
        Something went <em className="type-serif-em">wrong</em>
      </h1>
      <p className="type-body mt-6 max-w-[52ch] text-muted">
        This page ran into a problem while loading. Trying again usually clears it. If it does not,
        the start of the portfolio is one click away.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
        <ButtonLink href="/" size="lg" variant="secondary">
          Back to the start
        </ButtonLink>
      </div>
    </Container>
  );
}
