import type { Metadata } from "next";
import "./globals.css";
import MiniVicBot from "../components/MiniVicBot";

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Roboto+Condensed:wght@400;700&family=Source+Sans+Pro:wght@300;400;600&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" referrerPolicy="no-referrer" />
      </head>
      <body>
        {children}
        <MiniVicBot />
      </body>
    </html>
  );
}

