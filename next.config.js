/** @type {import('next').NextConfig} */
const isStaticExport = process.env.FIREBASE_STATIC_EXPORT === '1';
const isProduction = process.env.NODE_ENV === 'production';

// ── Fail loud, not fail safe (SPEC NFR-SEC / §0.1 DEV-8 / CLAUDE.md rule 6) ──
// The static Firebase export inlines a RESTRICTED, HTTP-referrer-locked *public*
// Gemini key for the client-side MiniVic brain (the true secret is reserved for
// the services/ gateway deployment — a static client cannot hold a real secret).
// That public key is still REQUIRED at build time: a missing key must crash the
// build naming the variable rather than silently inlining an empty string that
// ships a broken brain tier. (Workspace rule: never silently degrade.)
if (isStaticExport && isProduction && !process.env.GEMINI_API_KEY) {
  throw new Error(
    '[fail-loud] Missing required environment variable GEMINI_API_KEY for the ' +
      'static export (FIREBASE_STATIC_EXPORT=1). Set it in .env.production. ' +
      'Refusing to build a degraded MiniVic brain. See SPEC §0.1 DEV-8 / NFR-SEC.',
  );
}

// ── Security headers (TC-NFR-SEC). Emitted by `next dev` / the dynamic runtime via
// headers(); `output: 'export'` strips headers(), so production (static Firebase)
// mirrors these in firebase.json. Both must stay in sync. ──
const SECURITY_HEADERS = [
  {
    key: 'Content-Security-Policy',
    value:
      "default-src 'self'; base-uri 'self'; object-src 'none'; " +
      "img-src 'self' data: blob: https:; media-src 'self' blob:; font-src 'self' data:; " +
      "style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "worker-src 'self'; " +
      "connect-src 'self' ws: wss: https://api.github.com https://generativelanguage.googleapis.com https://*.googleapis.com; " +
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com; frame-ancestors 'none'",
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(), browsing-topics=()' },
];

const nextConfig = {
  ...(isStaticExport
    ? {
        output: 'export',
        images: { unoptimized: true },
      }
    : {
        async headers() {
          return [
            { source: '/:path*', headers: SECURITY_HEADERS },
            // The service worker (NFR-DURABLE) must always be revalidated so a new
            // version is picked up promptly, and must be allowed to claim root scope.
            // Mirrored for the static export in firebase.json.
            {
              source: '/sw.js',
              headers: [
                { key: 'Cache-Control', value: 'no-cache' },
                { key: 'Service-Worker-Allowed', value: '/' },
              ],
            },
          ];
        },
      }),
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Tree-shake the icon + motion barrels so only the used exports ship,
    // trimming First-Load JS on the "/" route.
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
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
