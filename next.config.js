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
    // '1' on static exports: MiniVic skips the backend API tiers entirely
    // (no /api/* probes that 404 on Firebase Hosting) and answers via the
    // client-side brain immediately.
    NEXT_PUBLIC_STATIC_EXPORT: isStaticExport ? '1' : '',
  },
};

module.exports = nextConfig;
