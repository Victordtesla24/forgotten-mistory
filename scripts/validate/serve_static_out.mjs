// Zero-dependency static server for the Next.js static export (`out/`).
//
// Serves the SAME artifact Firebase Hosting publishes (the static `out/` export),
// not the SSR dev/`next start` server. Used as the CI Playwright webServer and by
// the visual-regression / headless-FPS jobs, so every check exercises the real
// shipped artifact. Mirrors Next clean-URL resolution (`/foo` -> `/foo.html` /
// `/foo/index.html`) AND firebase.json's response headers, so HTTP-level assertions
// (e.g. security.spec.ts CSP/HSTS) see the same surface production serves.
//
// Env:
//   STATIC_DIR  directory to serve (default: "out")
//   PORT        port (default: 4321)
//   HOST        bind address (default: 127.0.0.1 — a potentially-trustworthy origin)

import http from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const STATIC_DIR = process.env.STATIC_DIR || 'out';
const PORT = Number(process.env.PORT || 4321);
const HOST = process.env.HOST || '127.0.0.1';
const root = join(process.cwd(), STATIC_DIR);

if (!existsSync(root)) {
  console.error(
    `[serve_static_out] directory not found: ${root} — run "npm run build:static" ` +
      'or download the "static-site" artifact before serving.',
  );
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.pdf': 'application/pdf',
  '.webmanifest': 'application/manifest+json',
  '.map': 'application/json; charset=utf-8',
};

// Firebase Hosting emits these on every response via firebase.json `hosting.headers`.
// `output: 'export'` strips next.config `headers()`, so the static artifact has none of
// its own — production gets them from the host. Mirror them here. Keep in lockstep with
// firebase.json.
const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; base-uri 'self'; object-src 'none'; " +
    "img-src 'self' data: blob: https:; media-src 'self' blob:; font-src 'self' data:; " +
    "style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "worker-src 'self'; " +
    "connect-src 'self' ws: wss: https://api.github.com https://generativelanguage.googleapis.com https://*.googleapis.com; " +
    "frame-src https://www.youtube.com https://www.youtube-nocookie.com; frame-ancestors 'none'",
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(self), geolocation=(), browsing-topics=()',
};

/** Path-scoped headers, mirroring firebase.json `hosting.headers` source globs. */
function pathHeaders(reqPath) {
  if (reqPath === '/sw.js') {
    return { 'Cache-Control': 'no-cache', 'Service-Worker-Allowed': '/' };
  }
  if (reqPath.startsWith('/_next/static/')) {
    return { 'Cache-Control': 'public, max-age=31536000, immutable' };
  }
  if (reqPath.startsWith('/assets/')) {
    return { 'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400' };
  }
  if (reqPath.startsWith('/docs/')) {
    return { 'Cache-Control': 'public, max-age=0, must-revalidate' };
  }
  return {};
}

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0] || '/');
  let rel = normalize(clean).replace(/^(\.\.[/\\])+/, '');
  if (rel.endsWith('/')) rel += 'index.html';
  let abs = join(root, rel);
  if (existsSync(abs) && statSync(abs).isDirectory()) abs = join(abs, 'index.html');
  if (!existsSync(abs) && existsSync(`${abs}.html`)) abs = `${abs}.html`;
  return existsSync(abs) && statSync(abs).isFile() ? abs : null;
}

const server = http.createServer((req, res) => {
  const reqPath = (req.url || '/').split('?')[0] || '/';
  // Production-faithful headers on every response (Firebase's `source: "**"`).
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
  for (const [k, v] of Object.entries(pathHeaders(reqPath))) res.setHeader(k, v);

  const file = resolveFile(req.url || '/');
  if (!file) {
    res.statusCode = 404;
    res.end('not found');
    return;
  }
  const body = readFileSync(file);
  res.setHeader('Content-Type', MIME[extname(file).toLowerCase()] || 'application/octet-stream');
  res.setHeader('Content-Length', String(body.length));
  res.end(body);
});

server.listen(PORT, HOST, () => {
  console.log(`[serve_static_out] serving ${root} at http://${HOST}:${PORT}`);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => server.close(() => process.exit(0)));
}
