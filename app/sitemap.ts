import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/content/site';

export const dynamic = 'force-static';

/** The portfolio is a single canonical page, so the inventory is one entry. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL, changeFrequency: 'monthly', priority: 1 }];
}
