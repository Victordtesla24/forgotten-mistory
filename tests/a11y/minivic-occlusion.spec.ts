import { test, expect, type Page } from '@playwright/test';

/**
 * What the floating launcher is allowed to do to the prose underneath it (390).
 *
 * V-C11 F-1 left cycle 11 with exactly one node below AA, and it was not a
 * token mistake anywhere in the page: the failing node was
 * `#role-body-ato > ul.Experience_bullets > li:nth-of-type(1)` at 1.79:1,
 * rgb(205,205,205) ink on a *sampled* ground of rgb(153,153,157) — the MiniVic
 * launcher's pale disc and its rgba(201,205,214,0.45) glow, painted over the
 * reading column at 390 (`elementsFromPoint` at [304,779] resolved to the
 * launcher button inside `div.fixed.bottom-6`, box {l:302,t:756,r:366,b:820},
 * z-index 10030).
 *
 * `tests/a11y/text-contrast.spec.ts` caught that, but only because a sample
 * point happened to land on the disc: it takes three points per text rect, so a
 * launcher two pixels narrower would have slipped through the same gate. This
 * file states the rule the launcher itself has to keep, densely and directly.
 *
 * TC-MV-OCCLUDE-01 walks the page at 390x844 and, wherever the launcher's
 * painted box overlaps a visible text box inside `<main>`, samples *every*
 * pixel of that overlap out of the composited screenshot and requires the text
 * to still clear WCAG AA against it.
 *
 * TC-MV-OCCLUDE-02 is the absolute form of the same rule, and does not depend
 * on which paragraph happens to be under the launcher on the day: on a phone
 * the launcher may never paint a light surface at all. The ceiling is derived,
 * not chosen — it is the brightest ground that still carries the site's body
 * ink (`--mist-200`, #CDCDCD) at 4.5:1 — so if the body ink is ever re-tokened
 * the ceiling follows it instead of going stale.
 *
 * Both are phone-only by design. At 1440 the page's own gutter is 96px and the
 * launcher sits inside it, clear of the measure; below that it floats over the
 * column, which is why the dark plate is a phone requirement and not a
 * stylistic preference.
 */

const VIEWPORT = { width: 390, height: 844 };

/** The site's body ink, the colour the failing node was set in. */
const BODY_INK: [number, number, number] = [205, 205, 205];

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const luminance = ([r, g, b]: [number, number, number]) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const contrast = (a: [number, number, number], b: [number, number, number]) => {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};
const parseColor = (value: string): [number, number, number, number] | null => {
  const m = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!m) return null;
  return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
};
const composite = (fg: [number, number, number], alpha: number, bg: [number, number, number]) =>
  [0, 1, 2].map((i) => Math.round(bg[i] + (fg[i] - bg[i]) * alpha)) as [number, number, number];

/** The brightest ground that still carries BODY_INK at AA (4.5:1). */
const GROUND_CEILING = (luminance(BODY_INK) + 0.05) / 4.5 - 0.05;

const GLYPH_MASK_ID = '__minivic_occlusion_glyph_mask__';

async function maskGlyphs(page: Page, on: boolean) {
  await page.evaluate(
    ([id, enable]) => {
      document.getElementById(id as string)?.remove();
      if (!enable) return;
      const style = document.createElement('style');
      style.id = id as string;
      style.textContent =
        '*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;' +
        'text-shadow:none!important;caret-color:transparent!important;transition:none!important}';
      document.head.appendChild(style);
    },
    [GLYPH_MASK_ID, on] as const,
  );
}

/** Decode a viewport PNG inside the page and read the pixels at the requested points. */
async function samplePixels(page: Page, png: Buffer, points: [number, number][]) {
  if (!points.length) return [] as [number, number, number][];
  return page.evaluate(
    async ([b64, pts]) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      const scale = img.naturalWidth / window.innerWidth;
      return (pts as [number, number][]).map(([x, y]) => {
        const d = ctx.getImageData(
          Math.min(canvas.width - 1, Math.max(0, Math.round(x * scale))),
          Math.min(canvas.height - 1, Math.max(0, Math.round(y * scale))),
          1,
          1,
        ).data;
        return [d[0], d[1], d[2]] as [number, number, number];
      });
    },
    [png.toString('base64'), points] as const,
  );
}

type Overlap = {
  path: string;
  text: string;
  color: string;
  opacity: number;
  fontSize: number;
  fontWeight: number;
  points: [number, number][];
};

/**
 * The launcher's own box, and every visible text box in `<main>` it overlaps at
 * the current scroll position. The launcher box is inflated by its own shadow
 * blur so a glow that spills past the button is measured too — that glow was
 * half of the V-C11 failure.
 */
async function overlapsNow(page: Page) {
  return page.evaluate(() => {
    const btn = document.querySelector('[data-testid="minivic-toggle"]') as HTMLElement | null;
    if (!btn) return { launcher: null, overlaps: [] as Overlap[] };

    const effectiveOpacity = (el: Element) => {
      let o = 1;
      let node: Element | null = el;
      while (node && node !== document.documentElement) {
        o *= parseFloat(getComputedStyle(node).opacity) || 0;
        node = node.parentElement;
      }
      return o;
    };

    // An invisible dock paints nothing, so it occludes nothing.
    if (effectiveOpacity(btn) < 0.05) return { launcher: null, overlaps: [] as Overlap[] };

    const box = btn.getBoundingClientRect();
    const shadow = getComputedStyle(btn).boxShadow;
    const blurs = Array.from(shadow.matchAll(/(-?[\d.]+)px/g)).map((m) => Math.abs(Number(m[1])));
    // Capped: a shadow may be declared with a large blur, but only the band
    // immediately around the button is dense enough to change a sampled ground.
    const spill = blurs.length ? Math.min(16, Math.max(...blurs)) : 0;
    const zone = {
      left: box.left - spill,
      top: box.top - spill,
      right: box.right + spill,
      bottom: box.bottom + spill,
    };

    const main = document.querySelector('main');
    const out: Overlap[] = [];
    if (!main) return { launcher: { ...zone, box: box.toJSON() }, overlaps: out };

    const cssPath = (el: Element) => {
      const parts: string[] = [];
      let node: Element | null = el;
      while (node && node !== document.body && parts.length < 5) {
        let part = node.tagName.toLowerCase();
        if (node.id) {
          parts.unshift(`${part}#${node.id}`);
          break;
        }
        const cls = Array.from(node.classList).slice(0, 2).join('.');
        if (cls) part += `.${cls}`;
        parts.unshift(part);
        node = node.parentElement;
      }
      return parts.join(' > ');
    };

    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    let textNode: Node | null;
    while ((textNode = walker.nextNode())) {
      const text = (textNode.textContent || '').replace(/\s+/g, ' ').trim();
      if (text.length < 2) continue;
      const el = textNode.parentElement;
      if (!el) continue;
      if (el.closest('script,style,noscript,template,[hidden],[aria-hidden="true"]')) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility !== 'visible' || cs.display === 'none') continue;
      const opacity = effectiveOpacity(el);
      if (opacity < 0.05) continue;

      const range = document.createRange();
      range.selectNodeContents(textNode);
      const points: [number, number][] = [];
      for (const r of Array.from(range.getClientRects())) {
        if (r.width < 1 || r.height < 1) continue;
        const left = Math.max(r.left, zone.left, 0);
        const right = Math.min(r.right, zone.right, window.innerWidth - 1);
        const top = Math.max(r.top, zone.top, 0);
        const bottom = Math.min(r.bottom, zone.bottom, window.innerHeight - 1);
        if (right <= left || bottom <= top) continue;
        // Every pixel of the overlap on a 2px lattice, capped so one very wide
        // line cannot make the screenshot round-trip unbounded.
        for (let y = top; y <= bottom && points.length < 400; y += 2) {
          for (let x = left; x <= right && points.length < 400; x += 2) {
            points.push([Math.round(x), Math.round(y)]);
          }
        }
      }
      if (!points.length) continue;
      out.push({
        path: cssPath(el),
        text: text.slice(0, 48),
        color: cs.color,
        opacity,
        fontSize: parseFloat(cs.fontSize),
        fontWeight: parseInt(cs.fontWeight, 10) || 400,
        points,
      });
    }
    return { launcher: { ...zone, box: box.toJSON() }, overlaps: out };
  });
}

async function settle(page: Page) {
  await page.setViewportSize(VIEWPORT);
  await page.goto('/');
  await page.locator('#hero h1').waitFor({ state: 'visible', timeout: 15000 });
  const total = await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    return document.documentElement.scrollHeight;
  });
  await page.waitForTimeout(2000);
  return total;
}

test.describe('The MiniVic launcher over the reading column (390)', () => {
  test.describe.configure({ timeout: 240000 });

  test('TC-MV-OCCLUDE-01: text under the launcher still clears AA at every scroll step', async ({
    page,
  }) => {
    const total = await settle(page);

    const failures: string[] = [];
    let checked = 0;

    for (let top = 0; top < total; top += VIEWPORT.height) {
      await page.evaluate((y) => window.scrollTo(0, y), top);
      await page.waitForTimeout(300);

      const { overlaps } = await overlapsNow(page);
      if (!overlaps.length) continue;

      await maskGlyphs(page, true);
      const png = await page.screenshot({ fullPage: false, animations: 'disabled' });
      await maskGlyphs(page, false);

      const allPoints = overlaps.flatMap((o) => o.points);
      const pixels = await samplePixels(page, png, allPoints);

      let cursor = 0;
      for (const node of overlaps) {
        const fg = parseColor(node.color);
        const samples = pixels.slice(cursor, cursor + node.points.length);
        cursor += node.points.length;
        if (!fg) continue;
        checked += 1;
        const large =
          node.fontSize >= 24 || (node.fontSize >= 18.66 && node.fontWeight >= 700);
        const need = large ? 3 : 4.5;
        let worst = Infinity;
        let worstBg: [number, number, number] = [0, 0, 0];
        for (const bg of samples) {
          const painted = composite([fg[0], fg[1], fg[2]], fg[3] * node.opacity, bg);
          const ratio = contrast(painted, bg);
          if (ratio < worst) {
            worst = ratio;
            worstBg = bg;
          }
        }
        if (worst < need) {
          failures.push(
            `scrollY ${top}: ${worst.toFixed(2)}:1 (needs ${need}) ${node.path} — "${node.text}" ` +
              `ink ${node.color} on launcher-painted ground rgb(${worstBg.join(',')})`,
          );
        }
      }
    }

    expect(
      failures,
      `${failures.length} of ${checked} text node(s) under the launcher fall below AA:\n${failures
        .slice(0, 10)
        .join('\n')}`,
    ).toEqual([]);
  });

  test('TC-MV-OCCLUDE-02: the closed launcher never paints a light surface on a phone', async ({
    page,
  }) => {
    await settle(page);
    // Past the hero, where the dock is opaque and floating over the column.
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2));
    await page.waitForTimeout(500);

    const box = await page.locator('[data-testid="minivic-toggle"]').boundingBox();
    expect(box, 'launcher must be on screen past the hero').not.toBeNull();

    const points: [number, number][] = [];
    for (let y = box!.y + 1; y < box!.y + box!.height - 1; y += 2) {
      for (let x = box!.x + 1; x < box!.x + box!.width - 1; x += 2) {
        points.push([Math.round(x), Math.round(y)]);
      }
    }

    const png = await page.screenshot({ fullPage: false, animations: 'disabled' });
    const pixels = await samplePixels(page, png, points);

    let brightest: [number, number, number] = [0, 0, 0];
    let maxL = -1;
    for (const p of pixels) {
      const l = luminance(p);
      if (l > maxL) {
        maxL = l;
        brightest = p;
      }
    }

    expect(
      maxL,
      `the brightest pixel the closed launcher paints at 390 is rgb(${brightest.join(',')}) ` +
        `(relative luminance ${maxL.toFixed(4)}); the ceiling that keeps rgb(${BODY_INK.join(',')}) ` +
        `body ink at 4.5:1 is ${GROUND_CEILING.toFixed(4)}`,
    ).toBeLessThanOrEqual(GROUND_CEILING);
  });
});
