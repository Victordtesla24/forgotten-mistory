/** @type {import('next').NextConfig} */
const isStaticExport = process.env.FIREBASE_STATIC_EXPORT === '1';

const nextConfig = {
  ...(isStaticExport
    ? {
        output: 'export',
        images: { unoptimized: true },
      }
    : {}),
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    // Inlined at build time for the client-side MiniVic brain. Next.js
    // auto-loads .env.production during `next build`. Restrict this key by
    // HTTP referrer (https://forgotten-mistory.web.app/*) in Google AI
    // Studio so it is only usable from the production site.
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? '',
    NEXT_PUBLIC_GEMINI_MODEL: process.env.NEXT_PUBLIC_GEMINI_MODEL ?? '',
  },
};

module.exports = nextConfig;
