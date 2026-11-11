import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';

import Assistant from '@/components/assistant/Assistant';
import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { DisclosureLinks } from '@/components/site/DisclosureLinks';
import { Providers } from '@/components/site/Providers';
import { themeInitScript } from '@/components/site/theme';
import { StageMount } from '@/components/visuals/StageMount';
import { about, type Credential } from '@/content/about';
import { SITE_URL, site } from '@/content/site';
import { motionInitScript } from '@/lib/motion';

import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });

// The first screen is set in all three faces (the eyebrow and the figures in the mono, the
// emphasised phrase of the headline in the serif), so all three are preloaded: a face that
// arrives after the first layout swaps in with slightly different metrics and moves the type.
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

const { seo } = site;

/** Certifications the CV lists as held; one still in progress is not yet a certification. */
const heldCertifications: readonly Credential[] = about.credentials.filter(
  (entry: Credential) => entry.status === undefined,
);

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
    description: seo.personDescription,
    worksFor: { '@type': 'Organization', name: site.employer },
    url: SITE_URL,
    image: site.image,
    sameAs: [site.channels.linkedin, site.channels.github, site.channels.youtube],
    alumniOf: about.education.map((qualification) => ({
      '@type': 'CollegeOrUniversity',
      name: qualification.institution,
    })),
    hasCredential: heldCertifications.map((entry) => ({
      '@type': 'EducationalOccupationalCredential',
      name: entry.name,
      credentialCategory: 'certification',
      recognizedBy: { '@type': 'Organization', name: entry.institution },
    })),
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
        {/* The first paint waits until the header and the hero are parsed, so a slow device never paints them half built and moves them. */}
        <link rel="expect" href="#top-title" blocking="render" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: motionInitScript }} />
        {structuredData.map((html) => (
          <script key={html.__html} type="application/ld+json" dangerouslySetInnerHTML={html} />
        ))}
      </head>
      <body className="font-sans text-text antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-4 focus:py-3 focus:font-medium focus:text-bg"
        >
          Skip to content
        </a>
        <Providers>
          <StageMount />
          <Header />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer />
          <Assistant />
          <DisclosureLinks />
        </Providers>
      </body>
    </html>
  );
}
