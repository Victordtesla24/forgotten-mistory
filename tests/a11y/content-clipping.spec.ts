import { expect, test, type Locator, type Page } from '@playwright/test';

type Box = { left: number; right: number; top: number; bottom: number; width: number; height: number };
type Issue = { label: string; text: string; rect?: Box; clippingAncestors: Array<{ tag: string; id: string; overflowX: string; overflowY: string; rect: Box }> };

const VIEWPORTS = [
  { width: 320, height: 740 },
  { width: 390, height: 844 },
] as const;
const PROD = process.env.PLAYWRIGHT_BASE_URL || 'https://forgotten-mistory.web.app/';

async function openProd(page: Page) {
  await page.goto(PROD, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForLoadState('networkidle').catch(() => undefined);
}

async function textBoundIssues(locator: Locator, label: string): Promise<Issue[]> {
  return locator.evaluateAll((nodes, label) => {
    const toBox = (r: DOMRect): Box => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height });
    const vw = window.innerWidth;
    const clipValues = new Set(['hidden', 'clip', 'auto', 'scroll']);
    const issues: Issue[] = [];
    const visibleElement = (el: Element) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    };
    const clippers = (owner: Element) => {
      const list: Issue['clippingAncestors'] = [];
      for (let el = owner.parentElement; el; el = el.parentElement) {
        const s = getComputedStyle(el);
        if (clipValues.has(s.overflowX) || clipValues.has(s.overflowY)) list.push({ tag: el.tagName.toLowerCase(), id: el.id, overflowX: s.overflowX, overflowY: s.overflowY, rect: toBox(el.getBoundingClientRect()) });
      }
      return list;
    };
    for (const root of nodes as Element[]) {
      const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
          const text = n.textContent?.replace(/\s+/g, ' ').trim() ?? '';
          const owner = n.parentElement;
          return text && owner && visibleElement(owner) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
      });
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        const text = n.textContent?.replace(/\s+/g, ' ').trim() ?? '';
        const owner = n.parentElement!;
        const ancestors = clippers(owner);
        const range = document.createRange();
        range.selectNodeContents(n);
        const rects = Array.from(range.getClientRects()).map(toBox).filter((r) => r.width > 0 && r.height > 0);
        if (rects.length === 0) issues.push({ label: String(label), text, clippingAncestors: ancestors });
        for (const r of rects) {
          const outsideViewport = r.left < -1 || r.right > vw + 1;
          const clippedByAncestor = ancestors.some((a) => {
            const x = clipValues.has(a.overflowX) && (r.left < a.rect.left - 1 || r.right > a.rect.right + 1);
            const y = clipValues.has(a.overflowY) && a.tag !== 'html' && a.tag !== 'body' && (r.top < a.rect.top - 1 || r.bottom > a.rect.bottom + 1);
            return x || y;
          });
          if (outsideViewport || clippedByAncestor) issues.push({ label: String(label), text, rect: r, clippingAncestors: ancestors });
        }
      }
    }
    return issues;
  }, label);
}

async function expectNoTextBoundIssues(locator: Locator, label: string) {
  const issues = await textBoundIssues(locator, label);
  expect(issues, `${label} text must fit viewport and must not be clipped by overflow ancestors`).toEqual([]);
}

test.describe('mobile content clipping guards against hidden horizontal overflow', () => {
  for (const viewport of VIEWPORTS) {
    test(`Skills real table headers are fully readable at ${viewport.width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await openProd(page);
      await page.locator('#skills').scrollIntoViewIfNeeded();
      await page.screenshot({ path: testInfo.outputPath(`skills-${viewport.width}.png`), fullPage: false });

      const headers = page.locator('#skills table thead th');
      await expect(headers).toHaveCount(4);
      for (const text of ['Capability', 'Evidence', 'Where', 'Status']) await expect(headers.filter({ hasText: text })).toHaveCount(1);
      const badHeaders = await headers.evaluateAll((ths) => ths.map((th) => ({ text: th.textContent?.replace(/\s+/g, ' ').trim(), rect: th.getBoundingClientRect().toJSON(), viewport: window.innerWidth })).filter((h) => h.rect.width <= 1 || h.rect.right > h.viewport + 1));
      expect(badHeaders, 'each real #skills thead th must have width > 1 and right edge inside viewport').toEqual([]);
      await expectNoTextBoundIssues(headers, `#skills table thead headers ${viewport.width}`);
    });

    test(`Vitrine cards are vertical-only with fully readable metrics at ${viewport.width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await openProd(page);
      await page.locator('#vitrine').scrollIntoViewIfNeeded();
      await page.screenshot({ path: testInfo.outputPath(`vitrine-${viewport.width}.png`), fullPage: false });

      const rail = page.locator('#vitrine ol').first();
      const cards = page.locator('#vitrine ol > li');
      await expect(rail).toBeVisible();
      await expect(cards).toHaveCount(6);
      const railOverflow = await rail.evaluate((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
      expect(railOverflow.scrollWidth, 'Vitrine rail must not expose horizontal scrolling').toBeLessThanOrEqual(railOverflow.clientWidth + 1);

      const badCards = await cards.evaluateAll((els) => els.map((el, index) => ({ index, rect: el.getBoundingClientRect().toJSON(), viewport: window.innerWidth })).filter((c) => c.rect.left < -1 || c.rect.right > c.viewport + 1));
      expect(badCards, 'each Vitrine card must fit horizontal viewport without horizontal scrolling').toEqual([]);

      for (const term of [/^commits$/i, /^active$/i, /^stack$/i]) await expect(cards.locator('dt').filter({ hasText: term })).toHaveCount(6);
      await expectNoTextBoundIssues(cards.locator('dl'), `Vitrine metric text ${viewport.width}`);
      const pageOverflow = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
      expect(pageOverflow.scrollWidth, 'document must not require horizontal scrolling').toBeLessThanOrEqual(pageOverflow.clientWidth + 1);
    });
  }
});
