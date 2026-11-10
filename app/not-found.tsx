import type { Metadata } from 'next';

import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { site } from '@/content/site';

export const metadata: Metadata = {
  title: `Page not found — ${site.name}`,
  robots: { index: false },
};

export default function NotFound() {
  return (
    <Container className="py-[clamp(4rem,12vw,9rem)]">
      <p className="type-eyebrow text-muted">404</p>
      <h1 className="mt-4">Page not found</h1>
      <p className="type-body mt-4 text-muted">
        The page you asked for does not exist or has moved.
      </p>
      <ButtonLink href="/" size="lg" className="mt-8">
        Back to the portfolio
      </ButtonLink>
    </Container>
  );
}
