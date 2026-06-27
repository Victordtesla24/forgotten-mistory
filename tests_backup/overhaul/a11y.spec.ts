import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * TC-NFR-A11Y — zero critical accessibility violations on the home page (WCAG 2.1 A/AA).
 * Runs in the overhaul suite on the configured browser (system Chrome locally; the CI
 * `axe` job additionally runs scripts/validate/phase06 against the built export).
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
  // let reveals/animations settle so axe sees the resting DOM
  await page.waitForTimeout(800);
}

test.describe('TC-NFR-A11Y — accessibility', () => {
  test.describe.configure({ timeout: 90000 });

  test('zero critical axe violations on the home page', async ({ page }) => {
    await gotoHome(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical');
    const serious = results.violations.filter((v) => v.impact === 'serious');

    // Surface the full picture in the failure message for triage.
    const fmt = (v: (typeof results.violations)[number]) =>
      `${v.impact}:${v.id} ×${v.nodes.length} (${v.help})`;
    const withNodes = [...critical, ...serious]
      .map((v) => `${v.impact}:${v.id} :: ${v.nodes.map((n) => n.target.join(' ')).join(' || ')}`)
      .join('\n');
    if (withNodes) console.log('AXE_NODES\n' + withNodes);

    // Executive AA bar: gate on BOTH critical and serious (zero tolerance).
    expect([...critical, ...serious].map(fmt), 'critical/serious axe violations').toEqual([]);
  });
});
