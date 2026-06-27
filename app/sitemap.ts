import type { MetadataRoute } from 'next';

// Emitted to out/sitemap.xml at build (static export). The portfolio is a single
// canonical page, so the inventory is one entry crawlers can rely on.
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://forgotten-mistory.web.app',
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
