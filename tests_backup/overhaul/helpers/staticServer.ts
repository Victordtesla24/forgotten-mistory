import http from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
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

/** Build the static export once if it is not already present. */
export function ensureStaticBuild(): void {
  if (!existsSync(join(OUT, 'index.html'))) {
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
