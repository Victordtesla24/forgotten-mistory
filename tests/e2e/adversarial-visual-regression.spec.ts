import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const sections = [
  ['hero', '[data-testid="hero-observatory"]'],
  ['about', '[data-testid="about-compass"]'],
  ['experience', '[data-testid="experience-explorer"]'],
  ['skills', '[data-testid="skills-trace"]'],
  ['vitrine', '[data-testid="mechanism-diagram"]'],
  ['listen', '[data-testid="listen-resonance"]'],
] as const;

async function gotoProd(page: Page) {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://forgotten-mistory.web.app';
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
}

async function paintedGraphic(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((el) => {
    const root = el as HTMLElement;
    const r = root.getBoundingClientRect();
    const cs = getComputedStyle(root);
    const shapes = Array.from(root.querySelectorAll('path,circle,line,rect,polyline,polygon,ellipse')).map((n) => {
      const nr = n.getBoundingClientRect();
      const ns = getComputedStyle(n);
      return { w: nr.width, h: nr.height, opacity: Number(ns.opacity), fill: ns.fill, stroke: ns.stroke };
    });
    return {
      bbox: { w: r.width, h: r.height },
      visible: r.width > 1 && r.height > 1 && cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0,
      painted: shapes.some((s) => (s.w > 0 || s.h > 0) && s.opacity > 0 && (s.fill !== 'none' || s.stroke !== 'none')) || ((root.textContent || '').trim().length > 0 || Array.from(root.children).some((c) => { const cr = c.getBoundingClientRect(); const ccs = getComputedStyle(c); return cr.width > 0 && cr.height > 0 && ccs.visibility !== 'hidden' && ccs.display !== 'none'; })),
    };
  });
}

test.describe('C4 adversarial visual regressions', () => {
  for (const width of [320, 390, 1440]) {
    test(`all six section instruments visibly render at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 1440 ? 900 : width === 390 ? 844 : 740 });
      await gotoProd(page);
      for (const [id, selector] of sections) {
        await page.locator(`#${id}`).scrollIntoViewIfNeeded();
        await expect(page.locator(selector).first(), `${id} instrument attached`).toBeVisible();
        const measured = await paintedGraphic(page, selector);
        expect(measured.visible, `${id} has visible CSS bbox/opacity`).toBe(true);
        expect(measured.painted, `${id} has rendered SVG/graphic fill or stroke`).toBe(true);
      }
    });
  }

  test('mobile Vitrine cards and global document do not create horizontal clipping', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await gotoProd(page);
    await page.locator('#vitrine').scrollIntoViewIfNeeded();
    const result = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('#vitrine article, #vitrine [class*="plate"], #vitrine [data-mechanism]'))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        })
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { text: (el.textContent || el.getAttribute('data-mechanism') || '').trim().slice(0, 60), left: r.left, right: r.right };
        });
      return { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, cards };
    });
    expect(result.scrollWidth, 'no page-level overflow at 320').toBeLessThanOrEqual(result.clientWidth + 1);
    expect(result.cards.length, 'six Vitrine cards/mechanisms are measurable').toBeGreaterThanOrEqual(6);
  });

  test('axe-core zero serious/critical violations at 390 and 1440', async ({ page }) => {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await gotoProd(page);
      const results = await new AxeBuilder({ page }).analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious, `${width}px serious/critical axe violations`).toEqual([]);
    }
  });
});
