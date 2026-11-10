import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';

import Assistant from '@/components/assistant/Assistant';
import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { Providers } from '@/components/site/Providers';
import { themeInitScript } from '@/components/site/theme';
import { SITE_URL, site } from '@/content/site';

import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
  preload: false,
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
  preload: false,
});

const { seo } = site;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: seo.title,
  description: seo.description,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: seo.title,
    description: seo.description,
    url: SITE_URL,
    siteName: site.siteName,
    type: 'website',
    images: [seo.ogImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: seo.title,
    description: seo.description,
    images: [seo.ogImage.url],
  },
  other: { 'build-commit': process.env.NEXT_PUBLIC_BUILD_COMMIT ?? 'dev' },
};

export const viewport: Viewport = { colorScheme: 'dark light' };

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.siteName,
    url: SITE_URL,
    description: seo.siteDescription,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    jobTitle: site.jobTitle,
    worksFor: { '@type': 'Organization', name: site.employer },
    url: SITE_URL,
    image: site.image,
    sameAs: [site.channels.github, site.channels.youtube],
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.location.locality,
      addressCountry: site.location.country,
    },
  },
]
  .map((entry) => JSON.stringify(entry).replace(/</g, '\\u003c'))
  .map((json) => ({ __html: json }));

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {structuredData.map((html) => (
          <script key={html.__html} type="application/ld+json" dangerouslySetInnerHTML={html} />
        ))}
      </head>
      <body className="bg-bg font-sans text-text antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-4 focus:py-3 focus:font-medium focus:text-bg"
        >
          Skip to content
        </a>
        <Providers>
          <Header />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer />
          <Assistant />
        </Providers>
      </body>
    </html>
  );
}
