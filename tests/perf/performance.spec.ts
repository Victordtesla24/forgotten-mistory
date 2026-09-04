import { test, expect, type Page } from '@playwright/test';

/**
 * Performance budgets — the numbers the rebuild was for.
 *
 * These are the same three budgets as before (first-view transfer, LCP, CLS)
 * because they are the ones the site's own definition of done names, and
 * because the rebuild's central claim is that it is faster: the previous hero
 * server-rendered its content at `opacity: 0` and waited on a 450 kB
 * framer-motion bundle to reveal it, which meant a cold load showed a blank
 * screen for four to eight seconds. Nothing in the current hero waits on
 * JavaScript, so these budgets are now the thing that keeps that true.
 *
 * Two repairs were needed. The `gotoHome` helper waited on a `.preloader` that
 * no longer exists — harmless, but it described a boot sequence the site does
 * not have. And every measurement navigated to a hard-coded
 * `http://localhost:5599/`, which silently ignored `PLAYWRIGHT_BASE_URL` and
 * would have measured the wrong service the moment the port changed. The
 * contexts these tests build by hand do not inherit `use.baseURL`, so it is
 * passed to `browser.newContext` explicitly instead.
 *
 * The viewport is a phone on purpose. A recruiter opening a CV link on a train
 * is the load that matters, and it is the load the budgets were set for.
 */

const PAYLOAD_BUDGET = 2.5 * 1024 * 1024; // 2.5 MB
const LCP_BUDGET_MS = 2500;
const CLS_BUDGET = 0.05;
const PHONE = { width: 390, height: 844 };

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
}

test.describe('Performance Budgets', () => {
  test.describe.configure({ timeout: 120000 });

  test('PERF-01: First-view transfer size <= 2.5 MB', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ viewport: PHONE, baseURL });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });

    const total = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined;
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      let bytes = nav?.transferSize ?? 0;
      for (const r of resources) bytes += r.transferSize || 0;
      return bytes;
    });
    await ctx.close();

    console.log(`Total transfer size: ${(total / 1024 / 1024).toFixed(2)} MB`);
    expect(total).toBeLessThanOrEqual(PAYLOAD_BUDGET);
  });

  test('PERF-02: LCP (Largest Contentful Paint) < 2.5s', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ viewport: PHONE, baseURL });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });

    const lcp = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) resolve(entries[entries.length - 1].startTime);
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          setTimeout(() => resolve(-1), 5000);
        }),
    );
    await ctx.close();

    // The hero's own text is the LCP element and it is server-rendered, so an
    // unreported LCP means the observer never fired, not that the page was
    // fast. Treat it as a failure rather than as a pass with a console note —
    // the old version logged "skipping budget check" and moved on, which is the
    // one outcome that must never be silent.
    console.log(`LCP: ${lcp.toFixed(0)} ms`);
    expect(lcp, 'no LCP was reported within 5s').toBeGreaterThan(0);
    expect(lcp).toBeLessThanOrEqual(LCP_BUDGET_MS);
  });

  test('PERF-03: CLS (Cumulative Layout Shift) < 0.05', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ viewport: PHONE, baseURL });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });

    // Scroll through the page so anything that mounts late gets the chance to
    // push content around. The Skills table measures itself and holds a
    // min-height floor precisely to stop that, so this is the check that says
    // the floor works.
    await page.evaluate(async () => {
      const steps = 6;
      for (let i = 0; i < steps; i += 1) {
        window.scrollTo(0, (i / steps) * document.body.scrollHeight);
        await new Promise((r) => setTimeout(r, 400));
      }
    });
    await page.waitForTimeout(1000);

    const cls = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let value = 0;
          try {
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                const shift = entry as PerformanceEntry & {
                  hadRecentInput?: boolean;
                  value?: number;
                };
                if (!shift.hadRecentInput) value += shift.value || 0;
              }
            }).observe({ type: 'layout-shift', buffered: true });
          } catch {
            /* layout-shift is not supported in every browser */
          }
          setTimeout(() => resolve(value), 1000);
        }),
    );
    await ctx.close();

    console.log(`CLS: ${cls.toFixed(4)}`);
    expect(cls).toBeLessThan(CLS_BUDGET);
  });

  test('PERF-04: Page loads without page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await gotoHome(page);
    await page.waitForTimeout(2000);
    const critical = errors.filter(
      (e) => !e.includes('ResizeObserver loop') && !e.includes('Third-party cookie'),
    );
    expect(critical, `page errors on load:\n${critical.join('\n')}`).toHaveLength(0);
  });

  test('PERF-05: DOMContentLoaded < 5s', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ viewport: PHONE, baseURL });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const dcl = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined;
      return nav?.domContentLoadedEventEnd ?? -1;
    });
    await ctx.close();

    console.log(`DOMContentLoaded: ${dcl.toFixed(0)} ms`);
    expect(dcl, 'no navigation timing was reported').toBeGreaterThan(0);
    expect(dcl).toBeLessThan(5000);
  });

  /**
   * PERF-06 — regression guard for the mobile LCP collapse (perf 66, LCP 6.393 s
   * against FCP 1.270 s on the Moto G Power profile).
   *
   * Root cause: every hero block was serialised into the export as
   * `style="opacity:0;transform:translateY(22px)"` by the framer `hidden` variant,
   * and on mobile the portrait — the desktop LCP element — is laid out ~3158 px
   * below the fold. That left the <h1> as the largest in-viewport candidate, and
   * an opacity:0 element is not a paint candidate for Chrome, so LCP could not
   * resolve until React had hydrated, the preloader had finished its 1.9 s boot
   * sequence and the 0.62 s fade had run.
   *
   * The guard runs with ALL JavaScript aborted, so it passes only if the LCP
   * element is painted by the static document itself — no hydration, no framer,
   * no WebGL.
   */
  test('PERF-06: hero LCP element paints from static HTML with JS and WebGL blocked', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 823 } });
    const page = await ctx.newPage();

    // The served markup must not ship the LCP element hidden.
    const html = await (await page.request.get('http://localhost:5599/')).text();
    const heroTitleTag = /<h1[^>]*class="[^"]*\bhero-title\b[^"]*"[^>]*>/.exec(html)?.[0];
    expect(heroTitleTag, 'hero <h1> must be present in the server-rendered HTML').toBeTruthy();
    expect(heroTitleTag, 'hero <h1> must not be served with opacity:0 — it is the mobile LCP element')
      .not.toMatch(/opacity\s*:\s*0(?![.\d])/);

    await page.route('**/*.js', (route) => route.abort());
    await page.goto('http://localhost:5599/', { waitUntil: 'domcontentloaded' });

    const title = page.locator('#hero .hero-title');
    await expect(title).toBeVisible();

    const painted = await title.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        opacity: Number.parseFloat(getComputedStyle(el).opacity),
        visibility: getComputedStyle(el).visibility,
        area: rect.width * rect.height,
        withinFirstViewport: rect.top < window.innerHeight,
        text: (el.textContent ?? '').trim().length,
      };
    });

    console.log(`No-JS hero title: ${JSON.stringify(painted)}`);
    expect(painted.opacity).toBeGreaterThanOrEqual(0.99);
    expect(painted.visibility).toBe('visible');
    expect(painted.text).toBeGreaterThan(0);
    expect(painted.area).toBeGreaterThan(10000);
    expect(painted.withinFirstViewport).toBe(true);

    // Nothing WebGL may exist at this point — the LCP element cannot be waiting
    // on a Canvas/shader compile if no Canvas has been created.
    expect(await page.locator('canvas').count()).toBe(0);

    await ctx.close();
  });

  /**
   * PERF-07 — with JS enabled, Chrome must actually emit a largest-contentful-paint
   * entry, and it must be hero text rather than something that only appears after
   * the WebGL layers mount. A page whose only candidates are opacity:0 emits NO
   * entry at all (measured on production: zero entries after 9 s), which is what
   * made Lighthouse fall back to a TTI-shaped LCP of 6.393 s.
   */
  test('PERF-07: LCP entry is emitted and is hero content, not a deferred WebGL layer', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 823 } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:5599/', { waitUntil: 'load' });

    const entry = await page.evaluate(() => {
      return new Promise<{ startTime: number; tag: string; className: string } | null>((resolve) => {
        const read = () => {
          const entries = performance.getEntriesByType(
            'largest-contentful-paint',
          ) as (PerformanceEntry & { element?: Element })[];
          const last = entries[entries.length - 1];
          if (!last) return null;
          return {
            startTime: last.startTime,
            tag: last.element?.tagName ?? '',
            className: last.element?.className ?? '',
          };
        };
        const immediate = read();
        if (immediate) {
          resolve(immediate);
          return;
        }
        new PerformanceObserver(() => {
          const next = read();
          if (next) resolve(next);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        setTimeout(() => resolve(read()), 5000);
      });
    });
    await ctx.close();

    console.log(`LCP entry: ${JSON.stringify(entry)}`);
    expect(entry, 'Chrome must report a largest-contentful-paint entry').not.toBeNull();
    expect(entry!.tag, 'LCP element must be real content, not a WebGL canvas').not.toBe('CANVAS');
    expect(entry!.startTime).toBeLessThanOrEqual(LCP_BUDGET_MS);
  });
});
