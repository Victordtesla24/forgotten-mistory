import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/content/site';

export const dynamic = 'force-static';

/** Everything is open to crawlers except the chat endpoint that Firebase rewrites to a function. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
