import { test, expect } from '@playwright/test';
import { ensureStaticBuild, startStaticServer, type StaticServer } from './helpers/staticServer';

/**
 * TC-NFR-PERF (SPEC §10 / §3.5 / NFR-PERF): first-view transfer ≤ 2.5 MB and CLS < 0.05.
 *
 * Measured against the PRODUCTION static export (`out/`), not the dev server — the dev
 * bundle is unminified and unrepresentative. Firebase Hosting serves gzip/brotli, so the
 * shared static server (./helpers/staticServer) gzips compressible responses; otherwise
 * uncompressed minified JS would over-count ~3× and fail the budget unfairly. The
 * render-critical first view is measured at the `load` event, which excludes the
 * post-hydration hero/MiniVic video upgrades (those are deferred — `preload="none"` — and
 * separately capped per-asset by overhaul_static_audit.mjs). The same gzip static-`out/`
 * server is reused by TC-NFR-DURABLE (durable.spec.ts) — single source of truth.
 *
 * The Lighthouse perf/LCP/TBT dimensions of NFR-PERF are captured by the homepage-targeted
 * `validate:phase02` run and recorded in docs/execution-log.md (companion to this gate).
 */

// Budgets default to SPEC §3.5; overridable via env so CI can tighten without code edits.
const PAYLOAD_BUDGET = Number(process.env.PERF_PAYLOAD_BUDGET ?? 2.5 * 1024 * 1024); // 2,621,440 bytes
const CLS_BUDGET = Number(process.env.PERF_CLS_BUDGET ?? 0.05);

test.describe('TC-NFR-PERF — first-view payload + layout stability (static export)', () => {
  test.describe.configure({ timeout: 240000 });

  let srv: StaticServer;

  test.beforeAll(async () => {
    ensureStaticBuild();
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
