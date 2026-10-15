import { test, expect, devices } from '@playwright/test';

test.use({
  ...devices['Moto G Power'],
});

test('measure lcp on production throttled', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'CDP is only available in Chromium');
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: 1.6 * 1024 * 1024 / 8,
    uploadThroughput: 750 * 1024 / 8,
  });

  await page.addInitScript(() => {
    window.lcpPromise = new Promise((resolve) => {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) resolve(lastEntry.startTime);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
  });

  await page.goto('https://forgotten-mistory.web.app/', { waitUntil: 'load' });
  const lcp = await page.evaluate(() => window.lcpPromise);
  console.log(`LCP_PROD: ${lcp}ms`);
});
