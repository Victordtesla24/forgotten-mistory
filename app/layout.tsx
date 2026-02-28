import type { Metadata } from "next";
import { Roboto, Roboto_Condensed, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import MiniVicBot from "../components/MiniVicBot";
import MotionProvider from "../components/MotionProvider";

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-source-sans",
});

const headingFont = Roboto_Condensed({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-roboto-condensed",
});

const altFont = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Vikram Deshpande | AI Delivery & Program Leader",
  description: "AI Solution Architect & Technical Delivery Leader based in Melbourne.",
  metadataBase: new URL("https://forgotten-mistory.web.app"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "Vikram Deshpande | AI Delivery & Program Leader",
    description: "AI Solution Architect & Technical Delivery Leader based in Melbourne.",
    url: "https://forgotten-mistory.web.app",
    siteName: "Forgotten Mistory",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Vikram Deshpande | AI Delivery & Program Leader",
    description: "AI Solution Architect & Technical Delivery Leader based in Melbourne."
  }
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Forgotten Mistory",
  "url": "https://forgotten-mistory.web.app",
  "description": "Portfolio and AI systems showcase for Vikram Deshpande."
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Vikram Deshpande",
  "jobTitle": "Senior Technical Delivery Leader & AI/ML Solutions Architect",
  "url": "https://forgotten-mistory.web.app",
  "sameAs": [
    "https://github.com/Victordtesla24",
    "https://youtube.com/@vicd0ct"
  ],
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Melbourne",
    "addressCountry": "AU"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          referrerPolicy="no-referrer"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      </head>
      <body className={`${bodyFont.variable} ${headingFont.variable} ${altFont.variable}`}>
        <MotionProvider>
          {children}
          <MiniVicBot />
        </MotionProvider>
      </body>
    </html>
  );
}
