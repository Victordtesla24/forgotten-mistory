import type { Metadata } from 'next';

import { LegalPage } from '@/components/site/LegalPage';
import { terms } from '@/content/legal';
import { site } from '@/content/site';

export const metadata: Metadata = {
  title: `${terms.title} — ${site.name}`,
  description: terms.description,
  alternates: { canonical: '/terms' },
  robots: { index: true, follow: true },
};

export default function Terms() {
  return <LegalPage legal={terms} />;
}
