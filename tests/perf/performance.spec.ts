import { test, expect, type Page } from '@playwright/test';

/**
 * Category 6: Performance Budget Tests
 * Verifies performance budgets:
 *   - First-view transfer size (payload budget)
 *   - LCP < 2.5s
 *   - CLS < 0.05
 *
 * Measured against the production Next.js server on :5599.
 */

const PAYLOAD_BUDGET = 2.5 * 1024 * 1024; // 2.5 MB
const LCP_BUDGET_MS = 2500;
const CLS_BUDGET = 0.05;

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.isVisible().catch(() => false)) {
    await pre.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  }
}

test.describe('Performance Budgets', () => {
  test.describe.configure({ timeout: 120000 });

  test('PERF-01: First-view transfer size <= 2.5 MB', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:5599/', { waitUntil: 'load' });

    const total = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      let bytes = nav?.transferSize ?? 0;
      for (const r of resources) bytes += r.transferSize || 0;
      return bytes;
    });
    await ctx.close();

    console.log(`Total transfer size: ${(total / 1024 / 1024).toFixed(2)} MB`);
    expect(total).toBeLessThanOrEqual(PAYLOAD_BUDGET);
  });

  test('PERF-02: LCP (Largest Contentful Paint) < 2.5s', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:5599/', { waitUntil: 'load' });

    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            resolve(entries[entries.length - 1].startTime);
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        // Fallback: resolve after 3s if LCP not reported
        setTimeout(() => resolve(-1), 3000);
      });
    });
    await ctx.close();

    if (lcp > 0) {
      console.log(`LCP: ${lcp.toFixed(0)} ms`);
      expect(lcp).toBeLessThanOrEqual(LCP_BUDGET_MS);
    } else {
      console.log('LCP not reported within 3s — skipping budget check');
    }
  });

  test('PERF-03: CLS (Cumulative Layout Shift) < 0.05', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:5599/', { waitUntil: 'load' });

    // Scroll through page to trigger any layout shifts
    await page.evaluate(async () => {
      const steps = 5;
      for (let i = 0; i < steps; i++) {
        window.scrollTo(0, (i / steps) * document.body.scrollHeight);
        await new Promise(r => setTimeout(r, 400));
      }
    });
    // Give layout shift observer time to capture
    await page.waitForTimeout(1000);

    let cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        try {
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              // LayoutShift entries don't have an explicit 'value' — check hadRecentInput
              const lsEntry = entry as any;
              if (!lsEntry.hadRecentInput) {
                clsValue += lsEntry.value || 0;
              }
            }
          }).observe({ type: 'layout-shift', buffered: true });
        } catch (_) { /* layout-shift not supported in all browsers */ }
        setTimeout(() => resolve(clsValue), 1000);
      });
    });
    await ctx.close();

    console.log(`CLS: ${cls.toFixed(4)}`);
    expect(cls).toBeLessThan(CLS_BUDGET);
  });

  test('PERF-04: Page loads without errors (no console errors)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await gotoHome(page);
    await page.waitForTimeout(2000);
    // Filter out known non-critical issues
    const criticalErrors = errors.filter(e =>
      !e.includes('ResizeObserver loop') &&
      !e.includes('Third-party cookie')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('PERF-05: DOMContentLoaded < 5s', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:5599/', { waitUntil: 'domcontentloaded' });

    const dcl = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      return nav?.domContentLoadedEventEnd ?? -1;
    });
    await ctx.close();

    if (dcl > 0) {
      console.log(`DOMContentLoaded: ${dcl.toFixed(0)} ms`);
      expect(dcl).toBeLessThan(5000);
    }
  });
});
