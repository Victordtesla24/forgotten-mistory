import type { Metadata } from "next";
import { Roboto, Roboto_Condensed, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import MiniVicBot from "../components/MiniVicBot";

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
      </head>
      <body className={`${bodyFont.variable} ${headingFont.variable} ${altFont.variable}`}>
        {children}
        <MiniVicBot />
      </body>
    </html>
  );
}
