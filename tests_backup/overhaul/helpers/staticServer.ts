import http from 'node:http';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { extname, join, normalize } from 'node:path';
import { gzipSync } from 'node:zlib';

/**
 * Shared gzip static-`out/` server for the overhaul suite.
 *
 * Both TC-NFR-PERF (`perf.spec.ts`) and TC-NFR-DURABLE (`durable.spec.ts`) must
 * exercise the PRODUCTION static export (`out/`) — the dev bundle is unminified
 * and unrepresentative. Firebase Hosting serves gzip/brotli, so this server
 * gzips compressible responses to mirror production transfer sizes; otherwise
 * uncompressed minified JS would over-count and fail the payload budget.
 *
 * Extracted from perf.spec.ts (single source of truth) so durable.spec.ts can
 * reuse the identical origin without duplicating the server. 127.0.0.1 is a
 * potentially-trustworthy origin, so it is a secure context — service-worker
 * registration works against it without TLS.
 */

export const OUT = join(process.cwd(), 'out');

const MIME: Record<string, string> = {
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
const COMPRESSIBLE = new Set([
  '.html', '.js', '.mjs', '.css', '.json', '.svg', '.txt', '.xml', '.webmanifest', '.map',
]);

function resolveFile(urlPath: string): string | null {
  const clean = decodeURIComponent((urlPath.split('?')[0] || '/'));
  let rel = normalize(clean).replace(/^(\.\.[/\\])+/, '');
  if (rel.endsWith('/')) rel += 'index.html';
  let abs = join(OUT, rel);
  if (existsSync(abs) && statSync(abs).isDirectory()) abs = join(abs, 'index.html');
  if (!existsSync(abs) && existsSync(`${abs}.html`)) abs = `${abs}.html`; // Next clean URL
  return existsSync(abs) && statSync(abs).isFile() ? abs : null;
}

export interface StaticServer {
  origin: string;
  close: () => Promise<void>;
}

// Source trees/files whose changes invalidate a prior `out/`. `tests/` and `docs/`
// are deliberately excluded — editing a spec must not force a rebuild.
const SOURCE_DIRS = ['app', 'components', 'lib', 'public'];
const SOURCE_FILES = [
  'package.json',
  'package-lock.json',
  'next.config.ts',
  'next.config.mjs',
  'next.config.js',
  'tailwind.config.ts',
  'postcss.config.mjs',
  'tsconfig.json',
];

/** Newest mtime (ms) under a path, skipping node_modules/dotfiles. */
function newestMtime(path: string): number {
  const stat = statSync(path);
  if (!stat.isDirectory()) return stat.mtimeMs;
  let newest = stat.mtimeMs;
  for (const entry of readdirSync(path)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    newest = Math.max(newest, newestMtime(join(path, entry)));
  }
  return newest;
}

/**
 * Build the static export if it is absent OR stale relative to the source tree.
 *
 * The mtime guard is load-bearing: a prior `ensureStaticBuild()` that only checked
 * for `out/index.html` served a stale export after in-tree source edits, which
 * surfaced as phantom React #418 hydration errors (the cached build predated the
 * SSR-hydration fixes). Rebuilding when any source file is newer than the export
 * keeps every spec that boots `out/` honest against the working tree.
 *
 * Concurrency: this MUST NOT build from multiple processes at once — two parallel
 * `npm run build:static` runs (`rm -rf .next out`) corrupt each other's build dir (the
 * old CI cascade). `tests/global-setup.ts` builds `out/` once before the worker pool
 * spawns (and CI prebuilds it as a step), so by the time a spec's beforeAll calls this
 * the export is already fresh and the mtime guard makes every per-worker call a no-op.
 * Keep it that way.
 */
export function ensureStaticBuild(): void {
  const indexHtml = join(OUT, 'index.html');
  const builtAt = existsSync(indexHtml) ? statSync(indexHtml).mtimeMs : 0;

  let sourceNewest = 0;
  const root = process.cwd();
  for (const dir of SOURCE_DIRS) {
    const p = join(root, dir);
    if (existsSync(p)) sourceNewest = Math.max(sourceNewest, newestMtime(p));
  }
  for (const file of SOURCE_FILES) {
    const p = join(root, file);
    if (existsSync(p)) sourceNewest = Math.max(sourceNewest, statSync(p).mtimeMs);
  }

  if (builtAt === 0 || sourceNewest > builtAt) {
    execSync('npm run build:static', { stdio: 'inherit', timeout: 300000 });
  }
}

/** Serve `out/` over loopback with production-faithful gzip + MIME types. */
export function startStaticServer(): Promise<StaticServer> {
  const server = http.createServer((req, res) => {
    const file = resolveFile(req.url || '/');
    if (!file) {
      res.statusCode = 404;
      res.end('not found');
      return;
    }
    const ext = extname(file).toLowerCase();
    const body = readFileSync(file);
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    const acceptsGzip = (req.headers['accept-encoding'] || '').includes('gzip');
    if (acceptsGzip && COMPRESSIBLE.has(ext)) {
      const gz = gzipSync(body);
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Length', String(gz.length));
      res.end(gz);
    } else {
      res.setHeader('Content-Length', String(body.length));
      res.end(body);
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      resolve({
        origin: `http://127.0.0.1:${port}`,
        close: () => new Promise<void>((r) => server.close(() => r())),
      });
    });
  });
}
