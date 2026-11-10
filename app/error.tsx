'use client';

import { Button, ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="py-[clamp(4rem,12vw,9rem)]">
      <p className="type-eyebrow text-muted">Error</p>
      <h1 className="mt-4">Something went wrong</h1>
      <p className="type-body mt-4 text-muted">
        An unexpected error occurred while rendering this page. You can try again, or head back to
        the start.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
        <ButtonLink href="/" size="lg" variant="secondary">
          Back to the portfolio
        </ButtonLink>
      </div>
    </Container>
  );
}
