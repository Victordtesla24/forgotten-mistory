import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/content/site';

export const dynamic = 'force-static';

/** The routes that exist: the portfolio itself and its two legal pages. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
