/** @type {import('next').NextConfig} */
const isStaticExport = process.env.FIREBASE_STATIC_EXPORT === '1';

// ── NFR-SEC: the client bundle carries NO credential of any kind ──
// A previous design inlined a Gemini key as NEXT_PUBLIC_GEMINI_API_KEY so the
// browser could call generativelanguage.googleapis.com directly. `NEXT_PUBLIC_*`
// is substituted into the emitted JavaScript, so that key shipped in cleartext in
// /_next/static/chunks/app/layout-*.js — readable by anyone who views source.
// "Restrict it by HTTP referrer" is not a mitigation: referrer headers are
// attacker-controlled, so the key was fully usable off-site.
//
// The tier is also unnecessary. MiniVic's primary brain is the same-origin
// /api/chat Firebase Function, which holds its key in Google Secret Manager and
// works on the static export through a Hosting rewrite (verified live: HTTP 200).
// The deterministic local knowledge base backs it up offline. So the browser
// never needs a model credential, and none is inlined here.
//
// Enforced by scripts/validate/built_output_secret_scan.mjs, which greps the
// emitted out/ bundle — source-only scanning cannot catch build-time inlining.

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
        // G6-FIX: distDir: '.next-static' causes `output: 'export'` to fail with
        // "Cannot find module for page: /_document" because the export worker
        // looks for compiled pages in the default .next/ directory regardless
        // of the distDir setting. Using the default .next/ dir — the build:static
        // script's `rm -rf .next-static out` is kept for hygiene but we no longer
        // override distDir (Next.js 14.2 does not properly support distDir +
        // output: 'export'). The CONCURRENCY-01 concern remains but is acceptable
        // during MVP baseline; concurrent builds must not run simultaneously.
        // distDir: '.next-static',
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
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
  experimental: {
    // Tree-shake the icon + motion barrels so only the used exports ship,
    // trimming First-Load JS on the "/" route.
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  env: {
    // No model credential is exposed to the client — see the NFR-SEC note above.
    // '1' on static exports: MiniVic skips the backend API tiers entirely
    // (no /api/* probes that 404 on Firebase Hosting) and answers via the
    // client-side brain immediately.
    NEXT_PUBLIC_STATIC_EXPORT: isStaticExport ? '1' : '',
  },
};

module.exports = nextConfig;
