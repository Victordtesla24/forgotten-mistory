import { test, expect, type Page } from '@playwright/test';
import sharp from 'sharp';

/**
 * WCAG 2.1 AA contrast, measured from the pixels the browser actually painted.
 *
 * The site's colour rule is that gold means one thing — "this figure has a
 * source you can go and check" — and that everything else is achromatic. Both
 * halves of that rule have a contrast consequence, and neither is visible to a
 * check that reads the stylesheet:
 *
 *   · `components/sections/Vitrine/Vitrine.module.css:243` sets the live
 *     repository URL in `--gold`, which is 8.62:1 on `--ink-900`. But
 *     `Vitrine.module.css:89` puts every *unlit* plate at `opacity: 0.42`, and
 *     opacity composites the text along with the plate. The URL a reader sees
 *     on an unlit plate is not `#c9a84c` — it is `#c9a84c` at 42% over the page
 *     ground, and that is a different colour with a different ratio.
 *
 *   · `components/sections/Skills/Skills.module.css:279` sets `.statusLabel` in
 *     `--ink-300`, which is 4.03:1 — under AA's 4.5:1 for text below 24px, and
 *     the label is 0.66rem mono.
 *
 * A stylesheet check cannot see either number, because neither is written in
 * the stylesheet: one is the product of an ancestor's opacity, the other is the
 * product of a token whose ratio nobody recomputed. So these tests measure the
 * rendered page instead.
 *
 * How the measurement works, and why it is trustworthy:
 *   1. every probe's computed `color` and its full ancestor opacity chain are
 *      read from the live DOM;
 *   2. the glyphs are then made transparent and ONE viewport screenshot is
 *      taken, so the pixels inside each probe's box are its true composited
 *      background — gradients, translucent parents, backdrop filters and all;
 *   3. the foreground is composited analytically (colour × alpha × opacity
 *      chain) over that measured background;
 *   4. contrast is the WCAG 2.1 relative-luminance ratio, evaluated at the
 *      lightest and the darkest background pixel in the box, and the worse of
 *      the two is the one asserted on.
 *
 * Nothing here asserts on a class name or a token: a fix that keeps the class
 * and moves the colour passes, and a fix that renames the class but leaves the
 * ratio at 2.37:1 still fails. That is the point.
 *
 * These probes are deliberately narrow — the two marks the design-system lock
 * names, plus a page-wide sweep for the one ground gold is forbidden to sit on.
 * The wider `--ink-300`-as-text problem is a source-level property and is
 * asserted statically by `scripts/validate/gold_contrast_audit.mjs`.
 */

/** WCAG 2.1 AA: text under 24px (or under 18.66px bold) needs 4.5:1. */
const AA_TEXT = 4.5;

/** The four sanctioned golds, as the browser reports them. */
const GOLD_RGB: Record<string, [number, number, number]> = {
  '--gold': [201, 168, 76],
  '--gold-light': [212, 182, 92],
  '--gold-pale': [232, 213, 163],
  '--gold-dark': [176, 146, 63],
};

type Rgb = [number, number, number];

interface Probe {
  index: number;
  label: string;
  /** viewport-relative CSS px */
  box: { x: number; y: number; width: number; height: number };
  /** computed colour, r/g/b 0-255 plus its own alpha */
  color: [number, number, number, number];
  /** product of `opacity` on the element and every ancestor */
  opacityChain: number;
  fontPx: number;
  fontWeight: number;
  /** computed backgroundColor of the nearest ancestor that paints one */
  groundToken: string;
}

interface Measured extends Probe {
  ratio: number;
  ratioAtLightest: number;
  ratioAtDarkest: number;
  fg: Rgb;
  bgMean: Rgb;
}

const relLum = ([r, g, b]: Rgb): number => {
  const f = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
};
const contrast = (a: Rgb, b: Rgb): number => {
  const la = relLum(a);
  const lb = relLum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};
const over = (fg: Rgb, alpha: number, bg: Rgb): Rgb =>
  [0, 1, 2].map((i) => fg[i] * alpha + bg[i] * (1 - alpha)) as Rgb;
const r2 = (n: number) => Math.round(n * 100) / 100;
const hex = (c: Rgb) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
}

/**
 * Section entrance animations move opacity, and opacity is exactly what is
 * being measured. Sampled mid-rise, a settled 8.62:1 mark reads as a failure
 * that is a measurement artefact rather than a defect — so wait the finite
 * animations out. Looping animations never resolve, hence the filter and the
 * ceiling.
 */
async function settle(page: Page) {
  await page
    .evaluate(() => {
      const finite = document
        .getAnimations()
        .filter((a) => Number.isFinite((a.effect?.getComputedTiming().iterations ?? 1) as number))
        .map((a) => a.finished.catch(() => undefined));
      return Promise.race([
        Promise.all(finite),
        new Promise((resolve) => window.setTimeout(resolve, 3000)),
      ]).then(() => undefined);
    })
    .catch(() => undefined);
}

/**
 * Collects every element matching `selector` that is on screen, hides its
 * glyphs, captures one viewport screenshot, restores the page, and computes the
 * composited contrast of each.
 */
async function measure(page: Page, selector: string, labelAttr = 'textContent'): Promise<Measured[]> {
  const probes: Probe[] = await page.evaluate(
    ({ sel, labelAttr }) => {
      const parse = (s: string): [number, number, number, number] => {
        const m = s.match(/rgba?\(([^)]+)\)/);
        if (!m) return [0, 0, 0, 0];
        const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
        return [p[0] || 0, p[1] || 0, p[2] || 0, p.length > 3 ? p[3] : 1];
      };
      const out: unknown[] = [];
      const els = Array.from(document.querySelectorAll(sel));
      els.forEach((el, index) => {
        const box = el.getBoundingClientRect();
        if (box.width < 2 || box.height < 2) return;
        if (box.bottom <= 0 || box.top >= window.innerHeight) return;
        if (box.right <= 0 || box.left >= window.innerWidth) return;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') return;
        let chain = 1;
        let ground = 'transparent';
        let walk: Element | null = el;
        while (walk) {
          const s = getComputedStyle(walk);
          chain *= parseFloat(s.opacity || '1');
          if (ground === 'transparent' && parse(s.backgroundColor)[3] > 0) ground = s.backgroundColor;
          walk = walk.parentElement;
        }
        out.push({
          index,
          label:
            (labelAttr === 'textContent' ? (el.textContent || '').trim() : el.getAttribute(labelAttr) || '')
              .replace(/\s+/g, ' ')
              .slice(0, 60) || `<${el.tagName.toLowerCase()}>`,
          box: { x: box.x, y: box.y, width: box.width, height: box.height },
          color: parse(cs.color),
          opacityChain: chain,
          fontPx: parseFloat(cs.fontSize),
          fontWeight: parseInt(cs.fontWeight, 10) || 400,
          groundToken: ground,
        });
      });
      return out;
    },
    { sel: selector, labelAttr },
  ) as Probe[];

  if (probes.length === 0) return [];

  // Hide only the glyphs. Backgrounds, borders and every ancestor stay exactly
  // as painted, so the screenshot is the real backdrop of this text.
  await page.evaluate((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      const e = el as HTMLElement;
      e.dataset.contrastProbePrev = e.getAttribute('style') || '';
      e.style.setProperty('color', 'transparent', 'important');
      e.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
      e.style.setProperty('text-shadow', 'none', 'important');
    });
  }, selector);

  const shot = await page.screenshot({ animations: 'disabled' });

  await page.evaluate((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      const e = el as HTMLElement;
      const prev = e.dataset.contrastProbePrev ?? '';
      if (prev) e.setAttribute('style', prev);
      else e.removeAttribute('style');
      delete e.dataset.contrastProbePrev;
    });
  }, selector);

  const decoded = await sharp(shot).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const png = { data: decoded.data, width: decoded.info.width, height: decoded.info.height };
  const dpr = await page.evaluate(() => window.devicePixelRatio);

  return probes.map((p) => {
    // Inset so the box's own border and any antialiased edge are not sampled.
    const inset = 2;
    const x0 = Math.max(0, Math.round((p.box.x + inset) * dpr));
    const y0 = Math.max(0, Math.round((p.box.y + inset) * dpr));
    const x1 = Math.min(png.width, Math.round((p.box.x + p.box.width - inset) * dpr));
    const y1 = Math.min(png.height, Math.round((p.box.y + p.box.height - inset) * dpr));
    let lightest: Rgb = [0, 0, 0];
    let darkest: Rgb = [255, 255, 255];
    let lightestLum = -1;
    let darkestLum = 2;
    const tally = new Map<string, { rgb: Rgb; n: number }>();
    for (let y = y0; y < Math.max(y0 + 1, y1); y++) {
      for (let x = x0; x < Math.max(x0 + 1, x1); x++) {
        const i = (png.width * y + x) << 2;
        const px: Rgb = [png.data[i], png.data[i + 1], png.data[i + 2]];
        const l = relLum(px);
        if (l > lightestLum) { lightestLum = l; lightest = px; }
        if (l < darkestLum) { darkestLum = l; darkest = px; }
        const key = `${px[0]},${px[1]},${px[2]}`;
        const seen = tally.get(key);
        if (seen) seen.n += 1;
        else tally.set(key, { rgb: px, n: 1 });
      }
    }
    // The ground the glyphs actually sit on is the box's modal colour, not its
    // mean: a mean is dragged by whatever else clips into the box (a neighbour's
    // rule, a border, the traced row's inset bar) and would report a contrast no
    // reader ever experiences. The lightest and darkest pixels are printed
    // alongside so a reviewer can see the spread the modal value stands for.
    let bg: Rgb = [0, 0, 0];
    let best = -1;
    tally.forEach(({ rgb: candidate, n }) => { if (n > best) { best = n; bg = candidate; } });
    const alpha = p.color[3] * p.opacityChain;
    const rgb: Rgb = [p.color[0], p.color[1], p.color[2]];
    const fgOn = (b: Rgb) => over(rgb, alpha, b);
    return {
      ...p,
      fg: fgOn(bg),
      bgMean: bg,
      ratioAtLightest: contrast(fgOn(lightest), lightest),
      ratioAtDarkest: contrast(fgOn(darkest), darkest),
      ratio: contrast(fgOn(bg), bg),
    };
  });
}

/**
 * Brings the vitrine's link row into the viewport. `#vitrine` alone is not
 * enough: each plate is 696px tall inside a 720px viewport, so aligning the
 * section top leaves the links — and the gold URL that is the subject here —
 * exactly at the fold.
 */
async function revealVitrineLinks(page: Page) {
  await page.locator('#vitrine').scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const link = document.querySelector('#vitrine a[class*="live"]');
    link?.scrollIntoView({ block: 'center', inline: 'nearest' });
  });
  await settle(page);
}

function report(title: string, rows: Measured[]) {
  console.log(`\n=== ${title} ===`);
  for (const m of rows) {
    console.log(
      `  "${m.label}"  ${r2(m.ratio)}:1  ` +
        `(fg ${hex(m.fg)} on modal bg ${hex(m.bgMean)}, ${r2(m.fontPx)}px/${m.fontWeight}, ` +
        `opacity chain ${r2(m.opacityChain)}, ground ${m.groundToken}; ` +
        `spread ${r2(m.ratioAtDarkest)}–${r2(m.ratioAtLightest)}:1)`,
    );
  }
}

test.describe('WCAG 2.1 AA — composited contrast of the gold and grey marks', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
  });

  test('GC-01: every live repository URL clears 4.5:1 as composited', async ({ page }) => {
    // The links sit at the foot of a 696px plate, so scrolling the section into
    // view leaves them one pixel below the fold. Scroll the first one to the
    // middle of the viewport instead, which is where a reader reads it.
    await revealVitrineLinks(page);

    // Only one plate can be lit at a time, so the rail is swept from both ends:
    // whichever live URL is not the lit one is measured in the state a reader
    // meets it in. Results are keyed by href so the lit plate is not counted
    // twice with two different readings.
    const seen = new Map<string, Measured>();
    for (const position of ['start', 'end'] as const) {
      await page.evaluate((pos) => {
        const rail = document.querySelector('#vitrine [class*="rail"]') as HTMLElement | null;
        if (rail) rail.scrollLeft = pos === 'start' ? 0 : rail.scrollWidth;
      }, position);
      await settle(page);
      await page.waitForTimeout(400); // the raking light re-resolves on rail scroll
      for (const m of await measure(page, '#vitrine a[class*="live"]', 'href')) {
        const prior = seen.get(m.label);
        if (!prior || m.ratio < prior.ratio) seen.set(m.label, m);
      }
    }
    const rows: Measured[] = [];
    seen.forEach((m) => rows.push(m));
    report('GC-01 live repository URLs (#vitrine)', rows);

    expect(rows.length, 'the vitrine rail must render at least one live URL to measure').toBeGreaterThan(0);
    const failures = rows.filter((m) => m.ratio < AA_TEXT);
    expect(
      failures.map((m) => `${m.label} = ${r2(m.ratio)}:1 (needs ${AA_TEXT}:1)`),
      'gold is the site\'s evidence mark; a reader who cannot read it cannot check the evidence',
    ).toEqual([]);
  });

  test('GC-02: every skills status label clears 4.5:1', async ({ page }) => {
    await page.locator('#skills').scrollIntoViewIfNeeded();
    await settle(page);

    const rows = await measure(page, '#skills [class*="statusLabel"]');
    report('GC-02 status labels (#skills)', rows);

    expect(rows.length, 'the calibration card must render status labels to measure').toBeGreaterThan(0);
    const failures = rows.filter((m) => m.ratio < AA_TEXT);
    expect(
      failures.map((m) => `${m.label} = ${r2(m.ratio)}:1 (needs ${AA_TEXT}:1)`),
      'the status label is the text half of the gold mark — 1.4.1 depends on it being readable',
    ).toEqual([]);
  });

  test('GC-03: no gold text is ever painted on an --ink-500 ground', async ({ page }) => {
    // --gold on --ink-500 computes 4.75:1: AA, but with no headroom for the
    // dimming, hover and alpha the site applies elsewhere. The lock bans it
    // outright for text under 24px. This sweeps every section for it.
    const offenders: string[] = [];
    for (const id of ['#hero', '#about', '#experience', '#skills', '#vitrine', '#listen']) {
      await page.locator(id).scrollIntoViewIfNeeded();
      await settle(page);
      const found = await page.evaluate(
        ({ sectionId, golds, ink500 }) => {
          const parse = (s: string) => {
            const m = s.match(/rgba?\(([^)]+)\)/);
            if (!m) return null;
            const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
            return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
          };
          const same = (c: { r: number; g: number; b: number }, t: number[]) =>
            Math.abs(c.r - t[0]) <= 1 && Math.abs(c.g - t[1]) <= 1 && Math.abs(c.b - t[2]) <= 1;
          const out: string[] = [];
          const root = document.querySelector(sectionId);
          if (!root) return out;
          for (const el of Array.from(root.querySelectorAll('*'))) {
            const cs = getComputedStyle(el);
            const col = parse(cs.color);
            if (!col || !golds.some((g: number[]) => same(col, g))) continue;
            const px = parseFloat(cs.fontSize);
            if (px >= 24) continue;
            const hasText = Array.from(el.childNodes).some(
              (n) => n.nodeType === 3 && (n.textContent || '').trim().length > 0,
            );
            if (!hasText) continue;
            let walk: Element | null = el;
            while (walk) {
              const bg = parse(getComputedStyle(walk).backgroundColor);
              if (!bg || bg.a === 0) {
                walk = walk.parentElement;
                continue;
              }
              if (same(bg, ink500)) {
                out.push(
                  `${sectionId} ${el.tagName.toLowerCase()}.${(el.className || '').toString().slice(0, 40)} ` +
                    `"${(el.textContent || '').trim().slice(0, 40)}" — gold at ${px}px on --ink-500`,
                );
              }
              break;
            }
          }
          return out;
        },
        { sectionId: id, golds: Object.values(GOLD_RGB), ink500: [58, 61, 70] },
      );
      offenders.push(...found);
    }
    console.log(`\n=== GC-03 gold-on---ink-500 sweep === ${offenders.length} offender(s)`);
    for (const o of offenders) console.log(`  ${o}`);
    expect(offenders, 'gold on --ink-500 is 4.75:1 — the lock prohibits it for text under 24px').toEqual([]);
  });
});
