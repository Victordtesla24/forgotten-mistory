import type { Metadata } from 'next';
import { IBM_Plex_Mono, Inter, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import MiniVicBot from '../components/MiniVicBot';
import MotionProvider from '../components/MotionProvider';
import ServiceWorkerRegister from '../components/site/ServiceWorkerRegister';
import { AvatarSpeakingProvider } from '@/lib/avatarContext';

// Three faces, each with one job (design direction §1.1).
//
// The display face is a document serif, not a grotesque. Every rival portfolio in
// this category sets its headings in a geometric sans with a mono accent; a serif
// at display size reads as institutional record rather than as product marketing,
// which is the register this site is arguing in. The geometric grotesque this
// replaced was dropped for exactly that reason — it was the trend-following tell.
//
// All three self-host their woff2 at build time through next/font (mandatory under
// a static export: no runtime font request), and `adjustFontFallback` generates the
// metric-matched fallback, so there is no layout shift when the real face lands.
// One normal weight. Every heading, title and role line on the site is set at
// 400; nothing uses the light. The 300 was 47 kB of preload — on the critical
// path, ahead of the face the hero's own name is drawn in — for a weight zero
// elements resolved to.
const displayFont = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal'],
  variable: '--font-serif',
  display: 'swap',
  preload: true,
});

// The italic is loaded separately and NOT preloaded. It is used exactly once on
// the site — the closing sentence, five screens down — and preloading it cost
// 50 kB on the critical path for a face nobody sees until the end.
const displayItalic = Source_Serif_4({
  subsets: ['latin'],
  weight: ['300'],
  style: ['italic'],
  variable: '--font-serif-italic',
  display: 'swap',
  preload: false,
});

const bodyFont = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

// Every provenance line, date stamp, axis readout and repository metric. One
// weight only: this face carries data, and data does not need emphasis.
const dataFont = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: 'Vikram Deshpande — Scrum Master / Project Manager · AI Solutions Architect',
  description:
    'Scrum Master / Project Manager at the Australian Taxation Office and AI Solutions Architect based in Melbourne.',
  metadataBase: new URL('https://forgotten-mistory.web.app'),
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Vikram Deshpande — Scrum Master / Project Manager · AI Solutions Architect',
    description:
      'Scrum Master / Project Manager at the Australian Taxation Office and AI Solutions Architect based in Melbourne.',
    url: 'https://forgotten-mistory.web.app',
    siteName: 'Forgotten Mistory',
    type: 'website',
    // Static social card (1200×630, monochrome). Served from public/ so it works
    // under the Firebase static export — no app/opengraph-image.tsx runtime route.
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vikram Deshpande — Scrum Master / Project Manager · AI Solutions Architect',
    description:
      'Scrum Master / Project Manager at the Australian Taxation Office and AI Solutions Architect based in Melbourne.',
    // Same static card drives the summary_large_image Twitter preview.
    images: ['/assets/og-image.png'],
  },
};

const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Forgotten Mistory',
  url: 'https://forgotten-mistory.web.app',
  description: 'Portfolio and AI systems showcase for Vikram Deshpande.',
};

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Vikram Deshpande',
  jobTitle: 'Scrum Master / Project Manager — Australian Taxation Office',
  worksFor: {
    '@type': 'Organization',
    name: 'Australian Taxation Office',
  },
  url: 'https://forgotten-mistory.web.app',
  image: 'https://forgotten-mistory.web.app/assets/my_avatar.png',
  sameAs: ['https://github.com/Victordtesla24', 'https://youtube.com/@vicd0ct'],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Melbourne',
    addressCountry: 'AU',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Font variables live on <html> so the :root --font-body/--font-heading
    // tokens (which reference these next/font vars) resolve at :root. Placing
    // them on <body> would leave :root unable to see them — the tokens would
    // compute to empty and headings would fall back to the UA sans stack.
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable} ${displayItalic.variable} ${dataFont.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      </head>
      <body suppressHydrationWarning>
        <AvatarSpeakingProvider>
          <MotionProvider>
            {children}
            <MiniVicBot />
          </MotionProvider>
        </AvatarSpeakingProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
