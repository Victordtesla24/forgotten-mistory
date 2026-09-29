import { expect, test, type Page } from '@playwright/test';

const NAV_LINKS = '#site-nav-overlay .nav-link';

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => undefined);
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
}

async function openMenuAndChoose(page: Page, hash: string) {
  const toggle = page.locator('.menu-toggle');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.locator(`${NAV_LINKS}[href="${hash}"]`).click();
  await expect(page).toHaveURL(new RegExp(`${hash}$`));
}

async function expectCurrent(page: Page, hash: string, label: string) {
  await expect.soft(page.locator(`${NAV_LINKS}[href="${hash}"]`), label).toHaveAttribute('aria-current', 'location');
  await expect
    .soft(page.locator(`${NAV_LINKS}[aria-current="location"]`), `${label}; exactly one current nav link`)
    .toHaveCount(1);
}

test.describe('UI/UX regressions: reflow and navigation state', () => {
  test('UX-P1-001: 320px Listen CTA is contained without page-level horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await gotoHome(page);

    await page.locator('#listen').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const viewport = page.viewportSize()!;
    const cta = page.locator('#listen a[data-cta="engage"]');
    await expect(cta).toBeVisible();

    const ctaBox = await cta.boundingBox();
    expect(ctaBox, 'Listen engage CTA must have a measurable box').not.toBeNull();
    expect(ctaBox!.x, 'Listen engage CTA left edge is clipped off-screen').toBeGreaterThanOrEqual(0);
    expect(
      ctaBox!.x + ctaBox!.width,
      'Listen engage CTA right edge must remain inside the 320px viewport',
    ).toBeLessThanOrEqual(viewport.width);

    const scroll = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(scroll.scrollWidth, '320px reflow must not create page-level horizontal scrolling').toBe(
      scroll.clientWidth,
    );
  });

  test('UX-P1-001: 320px Skills table cells remain visible/reachable without hidden overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await gotoHome(page);

    await page.locator('#skills').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const clippingAncestors = await page.locator('#skills table').evaluate((table) => {
      const offenders: string[] = [];
      let node: HTMLElement | null = table as HTMLElement;
      while (node && node.id !== 'skills') {
        const style = getComputedStyle(node);
        if (style.overflowX === 'hidden' || style.overflowX === 'clip') {
          offenders.push(`${node.tagName.toLowerCase()}${node.className ? `.${String(node.className).split(/\s+/).join('.')}` : ''}`);
        }
        node = node.parentElement;
      }
      return offenders;
    });
    expect(clippingAncestors, 'Skills reflow must not hide clipped table content').toEqual([]);

    const cells = page.locator('#skills tbody tr:first-child th, #skills tbody tr:first-child td');
    await expect(cells).toHaveCount(4);
    const cellBoxes = await cells.evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          text: element.textContent?.trim() ?? '',
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height,
          display: style.display,
          visibility: style.visibility,
        };
      }),
    );

    for (const cell of cellBoxes) {
      expect(cell.text.length, 'Skills cell text must remain available').toBeGreaterThan(0);
      expect(cell.display, `Skills cell is removed from layout: ${cell.text}`).not.toBe('none');
      expect(cell.visibility, `Skills cell is hidden: ${cell.text}`).toBe('visible');
      expect(cell.width, `Skills cell has no reachable width: ${cell.text}`).toBeGreaterThan(0);
      expect(cell.height, `Skills cell has no reachable height: ${cell.text}`).toBeGreaterThan(0);
      expect(cell.left, `Skills cell left edge is clipped: ${cell.text}`).toBeGreaterThanOrEqual(0);
      expect(cell.right, `Skills cell right edge is clipped: ${cell.text}`).toBeLessThanOrEqual(320);
    }
  });

  for (const viewport of [
    { name: 'mobile', width: 320, height: 640 },
    { name: 'desktop', width: 1440, height: 900 },
  ]) {
    test(`UX-P2-002: nav aria-current tracks anchor click, manual scroll and history on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoHome(page);

      await openMenuAndChoose(page, '#skills');
      await expectCurrent(page, '#skills', `${viewport.name}: clicked Skills anchor is current`);

      await openMenuAndChoose(page, '#about');
      await expectCurrent(page, '#about', `${viewport.name}: clicked About anchor is current`);

      await page.goBack();
      await expect(page).toHaveURL(/#skills$/);
      await expectCurrent(page, '#skills', `${viewport.name}: browser Back restores Skills current state`);

      await page.locator('#listen').scrollIntoViewIfNeeded();
      await expect
        .poll(() => page.locator('#listen').evaluate((el) => Math.abs(el.getBoundingClientRect().top)), {
          timeout: 5000,
        })
        .toBeLessThan(160);
      await expect(page, `${viewport.name}: manually scrolled Listen updates URL hash`).toHaveURL(/#listen$/);
      await expectCurrent(page, '#listen', `${viewport.name}: manually scrolled Listen section is current`);
    });
  }
});
