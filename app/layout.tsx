import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import MiniVicBot from '../components/MiniVicBot';
import MotionProvider from '../components/MotionProvider';
import ServiceWorkerRegister from '../components/site/ServiceWorkerRegister';
import { AvatarSpeakingProvider } from '@/lib/avatarContext';

// Two families only (SPEC §3.2). Both are variable fonts self-hosted by
// next/font at build time (no runtime Google Fonts request):
//   • Inter — body / UI text.
//   • Space Grotesk — high-contrast grotesque display/heading face.
const bodyFont = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const headingFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Vikram Deshpande | Scrum Master · Project Manager · AI Delivery Leader',
  description:
    'Scrum Master / Project Manager at the Australian Taxation Office and AI Solutions Architect based in Melbourne.',
  metadataBase: new URL('https://forgotten-mistory.web.app'),
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Vikram Deshpande | Scrum Master · Project Manager · AI Delivery Leader',
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
    title: 'Vikram Deshpande | Scrum Master · Project Manager · AI Delivery Leader',
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
    <html lang="en" className={`${bodyFont.variable} ${headingFont.variable}`}>
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
      <body>
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
