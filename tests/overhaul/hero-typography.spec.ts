import { test, expect } from '@playwright/test';

/**
 * TC-HERO-TYPE-01 / TYPE-02 — the brand is not dwarfed, and the mark sets in
 * the number of lines it was authored for (HERO-SETPIECE-v3 §6, §8; slice S3).
 *
 * ADV-2315Z's hero finding was a ratio, not an opinion: "Brand 16–18 px vs H1
 * ~60–131 px — H1 owns the fold." §6 answers it with two bounded moves — the
 * nav mark lifted to 1.25 rem / 1.125 rem, and the H1 bounded to
 * `clamp(3.25rem, 8vw, 7rem)` — and this file is the instrument that holds
 * both. It reads *computed* pixels off the shipped page, so a token renamed or
 * a media query that never matches fails here rather than in a screenshot
 * nobody takes.
 *
 * TYPE-02 counts real line boxes with a Range over the H1's own text nodes,
 * not `scrollHeight ÷ lineHeight`: the authored `.nameBreak` produces exactly
 * two boxes below 720 px, and a name that *wrapped* into two boxes above it
 * would be the failure this case catches.
 *
 * Thresholds are §8's exactly. Lowering one to make a run green is a violation
 * (t_w2_h1s3 QUALITY GATES).
 */

/** §8 TYPE-01 — the H1 may lead the nav mark, but not by an order of magnitude. */
const RATIO_MIN = 2.5;
const RATIO_MAX = 6.0;
/** §6 — one line where the measure holds it, the authored two-line lockup below. */
const ONE_LINE_ABOVE_PX = 720;

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 834, height: 1194 },
  { width: 390, height: 844 },
] as const;

test.use({
  deviceScaleFactor: 1,
  launchOptions: { args: ['--no-sandbox'] },
});

type TypeReading = {
  h1Px: number;
  brandPx: number;
  brandText: string;
  lineTops: number[];
  h1Width: number;
  columnWidth: number;
};

/** Settle the page the way every other hero spec does: dismiss the boot overlay
 *  through its own control, then wait for the H1 to be visible. */
async function settle(page: import('@playwright/test').Page, baseURL: string): Promise<void> {
  await page.goto(new URL('/', baseURL).toString(), { waitUntil: 'domcontentloaded' });
  const preloader = page.locator('.preloader');
  if (await preloader.isVisible().catch(() => false)) {
    const skip = page.locator('button.preloader-skip');
    if (await skip.isVisible().catch(() => false)) await skip.click({ timeout: 5000 }).catch(() => {});
    await preloader.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  }
  await page.locator('#hero h1').waitFor({ state: 'visible', timeout: 20000 });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  // Fonts decide the advance, and the advance decides the line count.
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForTimeout(250);
}

const readType = (): TypeReading => {
  const h1 = document.querySelector<HTMLElement>('#hero h1');
  const brand = document.querySelector<HTMLElement>('nav a.logo');
  if (!h1 || !brand) throw new Error('hero H1 and the nav brand mark must both exist');

  // Real line boxes: one Range per text node, every client rect collected, then
  // grouped by top. A <br> contributes no rect of its own, so the grouping is
  // what reports the authored break.
  const tops: number[] = [];
  const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if ((node.textContent ?? '').trim().length > 0) {
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of Array.from(range.getClientRects())) {
        if (r.width > 0 && r.height > 0) tops.push(Math.round(r.top));
      }
      range.detach?.();
    }
    node = walker.nextNode();
  }
  // Two rects whose tops differ by less than a third of the font size are the
  // same line box (sub-pixel, and inline descenders).
  const fontPx = parseFloat(getComputedStyle(h1).fontSize);
  const lineTops: number[] = [];
  for (const t of tops.sort((a, b) => a - b)) {
    if (lineTops.length === 0 || Math.abs(t - lineTops[lineTops.length - 1]) > fontPx / 3) lineTops.push(t);
  }

  // The reading column: the nearest ancestor that actually lays out. The H1's
  // own parent can be a `display: contents` wrapper (zero rect), and the H1
  // itself is `width: fit-content` because of its plate — so neither is the
  // measure the mark has to fit inside.
  let column: HTMLElement = h1;
  for (let p = h1.parentElement; p; p = p.parentElement) {
    if (p.getBoundingClientRect().width > 0) {
      column = p;
      break;
    }
  }
  return {
    h1Px: fontPx,
    brandPx: parseFloat(getComputedStyle(brand).fontSize),
    brandText: (brand.textContent ?? '').trim(),
    lineTops,
    h1Width: h1.getBoundingClientRect().width,
    columnWidth: column.getBoundingClientRect().width,
  };
};

for (const vp of VIEWPORTS) {
  const size = `${vp.width}x${vp.height}`;

  test(`TC-HERO-TYPE-01 @ ${size} — H1 ÷ nav mark ∈ [${RATIO_MIN}, ${RATIO_MAX}]`, async ({
    page,
    baseURL,
  }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await settle(page, baseURL ?? 'http://127.0.0.1:5609');
    const d = await page.evaluate(readType);

    expect(d.brandText, 'TYPE-01: the nav mark must still be the wordmark').toContain('VIKRAM');
    const ratio = d.h1Px / d.brandPx;
    // eslint-disable-next-line no-console
    console.log(
      `TYPE-01 ${size}: H1 ${d.h1Px.toFixed(1)}px ÷ brand ${d.brandPx.toFixed(1)}px = ${ratio.toFixed(2)}`,
    );
    expect(
      ratio,
      `TYPE-01 at ${size}: H1 ${d.h1Px.toFixed(1)} px against a ${d.brandPx.toFixed(1)} px nav mark is ` +
        `${ratio.toFixed(2)}:1 — outside [${RATIO_MIN}, ${RATIO_MAX}], the name owns the fold ` +
        '(ADV-2315Z) or the mark has swallowed it',
    ).toBeGreaterThanOrEqual(RATIO_MIN);
    expect(
      ratio,
      `TYPE-01 at ${size}: ratio ${ratio.toFixed(2)} exceeds ${RATIO_MAX}`,
    ).toBeLessThanOrEqual(RATIO_MAX);
  });

  test(`TC-HERO-TYPE-02 @ ${size} — the mark sets in ${vp.width >= ONE_LINE_ABOVE_PX ? 1 : 2} line(s)`, async ({
    page,
    baseURL,
  }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await settle(page, baseURL ?? 'http://127.0.0.1:5609');
    const d = await page.evaluate(readType);

    const expected = vp.width >= ONE_LINE_ABOVE_PX ? 1 : 2;
    // eslint-disable-next-line no-console
    console.log(
      `TYPE-02 ${size}: ${d.lineTops.length} line box(es) at tops [${d.lineTops.join(', ')}], ` +
        `H1 width ${d.h1Width.toFixed(1)} of column ${d.columnWidth.toFixed(1)}`,
    );
    expect(
      d.lineTops.length,
      `TYPE-02 at ${size}: the name sets in ${d.lineTops.length} line box(es), not ${expected} — ` +
        `§6 authors one line at ≥ ${ONE_LINE_ABOVE_PX} px and the two-line lockup below it`,
    ).toBe(expected);
    // A one-line mark that overflowed its own column is not one line, it is a
    // clipped line: the measure has to hold it.
    expect(
      d.h1Width,
      `TYPE-02 at ${size}: the name renders ${d.h1Width.toFixed(1)} px wide inside a ` +
        `${d.columnWidth.toFixed(1)} px column`,
    ).toBeLessThanOrEqual(d.columnWidth + 1);
  });
}
