import type { Metadata } from 'next';

import { LegalPage } from '@/components/site/LegalPage';
import { privacy } from '@/content/legal';
import { site } from '@/content/site';

export const metadata: Metadata = {
  title: `${privacy.title} — ${site.name}`,
  description: privacy.description,
  alternates: { canonical: '/privacy' },
  robots: { index: true, follow: true },
};

export default function PrivacyPolicy() {
  return <LegalPage legal={privacy} />;
}
