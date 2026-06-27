import type { MetadataRoute } from 'next';

// Emitted to out/robots.txt at build (static export). Gives crawlers an explicit
// allow + a pointer to the sitemap so the canonical URL inventory is discoverable.
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://forgotten-mistory.web.app/sitemap.xml',
    host: 'https://forgotten-mistory.web.app',
  };
}
