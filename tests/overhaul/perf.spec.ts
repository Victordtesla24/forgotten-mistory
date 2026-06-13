import { test, expect } from '@playwright/test';
import http from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { extname, join, normalize } from 'node:path';
import { gzipSync } from 'node:zlib';

/**
 * TC-NFR-PERF (SPEC §10 / §3.5 / NFR-PERF): first-view transfer ≤ 2.5 MB and CLS < 0.05.
 *
 * Measured against the PRODUCTION static export (`out/`), not the dev server — the dev
 * bundle is unminified and unrepresentative. Firebase Hosting serves gzip/brotli, so the
 * local server below gzips compressible responses; otherwise uncompressed minified JS would
 * over-count ~3× and fail the budget unfairly. The render-critical first view is measured at
 * the `load` event, which excludes the post-hydration hero/MiniVic video upgrades (those are
 * deferred — `preload="none"` — and separately capped per-asset by overhaul_static_audit.mjs).
 *
 * The Lighthouse perf/LCP/TBT dimensions of NFR-PERF are captured by the homepage-targeted
 * `validate:phase02` run and recorded in docs/execution-log.md (companion to this gate).
 */

const OUT = join(process.cwd(), 'out');
// Budgets default to SPEC §3.5; overridable via env so CI can tighten without code edits.
const PAYLOAD_BUDGET = Number(process.env.PERF_PAYLOAD_BUDGET ?? 2.5 * 1024 * 1024); // 2,621,440 bytes
const CLS_BUDGET = Number(process.env.PERF_CLS_BUDGET ?? 0.05);

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
  '.webmanifest': 'application/manifest+json',
  '.map': 'application/json; charset=utf-8',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.txt', '.xml', '.webmanifest', '.map']);

function resolveFile(urlPath: string): string | null {
  const clean = decodeURIComponent((urlPath.split('?')[0] || '/'));
  let rel = normalize(clean).replace(/^(\.\.[/\\])+/, '');
  if (rel.endsWith('/')) rel += 'index.html';
  let abs = join(OUT, rel);
  if (existsSync(abs) && statSync(abs).isDirectory()) abs = join(abs, 'index.html');
  if (!existsSync(abs) && existsSync(`${abs}.html`)) abs = `${abs}.html`; // Next clean URL
  return existsSync(abs) && statSync(abs).isFile() ? abs : null;
}

function startStaticServer(): Promise<{ origin: string; close: () => Promise<void> }> {
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

test.describe('TC-NFR-PERF — first-view payload + layout stability (static export)', () => {
  test.describe.configure({ timeout: 240000 });

  let srv: { origin: string; close: () => Promise<void> };

  test.beforeAll(async () => {
    if (!existsSync(join(OUT, 'index.html'))) {
      execSync('npm run build:static', { stdio: 'inherit', timeout: 300000 });
    }
    srv = await startStaticServer();
  });

  test.afterAll(async () => {
    if (srv) await srv.close();
  });

  test('first-view transfer ≤ 2.5 MB (gzip, render-critical to load)', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(`${srv.origin}/`, { waitUntil: 'load' });

    const total: number = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      let bytes = nav?.transferSize ?? 0;
      for (const r of resources) bytes += r.transferSize || 0;
      return bytes;
    });
    await ctx.close();

    // eslint-disable-next-line no-console
    console.log(`[TC-NFR-PERF] first-view transfer = ${(total / 1024).toFixed(1)} KB (budget 2560 KB)`);
    expect(total, `first-view transfer ${(total / 1024).toFixed(1)} KB exceeds 2.5 MB budget`).toBeLessThanOrEqual(PAYLOAD_BUDGET);
  });

  test('cumulative layout shift < 0.05 on first view', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
          if (!entry.hadRecentInput) (window as unknown as { __cls: number }).__cls += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(`${srv.origin}/`, { waitUntil: 'load' });
    await page.waitForTimeout(2000); // settle reveals/fonts/poster without user input
    const cls: number = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    await ctx.close();

    // eslint-disable-next-line no-console
    console.log(`[TC-NFR-PERF] CLS = ${cls.toFixed(4)} (budget < ${CLS_BUDGET})`);
    expect(cls, `CLS ${cls.toFixed(4)} exceeds ${CLS_BUDGET}`).toBeLessThan(CLS_BUDGET);
  });
});
