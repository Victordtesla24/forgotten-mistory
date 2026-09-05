import { test, expect, type Page } from '@playwright/test';

/**
 * hero-plates.spec.ts — the contrast is bought on the type, not on the frame.
 *
 * Binding source: docs/architecture/HERO-FOLD-v2.md §2 M1 / §9 D-1, board task
 * t_h2_02. `Hero.module.css` `.stage::after` used to paint a half-frame wash
 * over the shader — `rgb(10 10 10 / 0.88)` from 0% to 44%, `0.86 → 0.45` out to
 * 56% — so the half of the frame the eye enters through was switched off. That
 * wash is retired above 700 px and every run of copy carries its own plate
 * instead, exactly as the phone already did (`@media (max-width: 700px)`:
 * `rgb(10 10 10 / 0.90)`, radius 3 px, `padding-inline .45rem`,
 * `margin-inline -.45rem`). The three clauses this file enforces:
 *
 *   TC-HERO-PLATE-01  the scrim is gone. Nothing painted over the scene that
 *                     covers more than 30% of the fold has a background alpha
 *                     of 0.5 or more. The section's own ground and the stage's
 *                     own backdrop (the poster and the gradients UNDER the
 *                     canvas) are not washes and are not counted; every
 *                     pseudo-element — including the stage's own `::after`,
 *                     which paints OVER the canvas — is.
 *   TC-HERO-PLATE-02  each copy run has its own plate: background alpha
 *                     ≥ 0.85, and the plate's box hugs the run's own text box
 *                     within 8 px on the left, top and bottom. On the right the
 *                     same 8 px holds for a single-line run; a wrapped run's
 *                     plate ends at its measure and shows a rag, which is
 *                     bounded to under half its widest line so a band ruled
 *                     across the fold can never pass as a rag.
 *   TC-HERO-PLATE-03  the AA walk over `#hero`, on `?gl=force` and on the
 *                     reduced-motion still, at 1440 and 390: the ten worst text
 *                     nodes are printed with their numbers and the worst must
 *                     clear 4.5:1. `tests/a11y/text-contrast.spec.ts` asserts
 *                     the same thing over the whole page; this one records the
 *                     figures for the hero so that a plate alpha can never be
 *                     changed without the ten worst nodes being re-measured
 *                     (HERO-FOLD-v2 §8, "the AA interlock").
 *
 * Nothing here reads a CSS-module hash. The runs are addressed by structure —
 * the fold's `h1` and its sibling paragraphs, and the action group's second
 * link — so the contract survives a restyle.
 */

const FOLD = '[data-testid="hero-fold"]';
const SECONDARY_ACTION = '[data-testid="hero-actions"] a[href$=".pdf"]';
const STAGE = '[data-scene="hero-atmosphere"]';

/** The alpha at or above which a background is a wash, not a tint. */
const WASH_ALPHA = 0.5;
/** A wash is a wash when it covers more than this share of the fold. */
const WASH_COVERAGE = 0.3;
/** The plate alpha the phone instrument ships with, less a rounding margin. */
const PLATE_ALPHA_MIN = 0.85;
/** How far a plate's edge may sit from the text run's edge (`.45rem` = 7.2 px). */
const PLATE_TOLERANCE_PX = 8;
/** AA for normal text; asserted for every hero node, large type included. */
const AA_MIN = 4.5;

/**
 * Software rasteriser, explicitly enabled — the same flags
 * `tests/a11y/text-contrast.spec.ts` uses, for the same reason: this host has
 * no GPU, and without them plus `?gl=force` no line of GLSL is ever compiled.
 */
const GL_ARGS = [
  '--no-sandbox',
  '--use-gl=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
];

test.use({ launchOptions: { args: GL_ARGS } });

const VIEWPORTS = [
  { label: '1440×900', width: 1440, height: 900 },
  { label: '1280×800', width: 1280, height: 800 },
  { label: '834×1194', width: 834, height: 1194 },
  { label: '390×844', width: 390, height: 844 },
] as const;

const AA_VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
] as const;

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

async function settle(page: Page, path: string, settleMs: number) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.locator('#hero h1').waitFor({ state: 'visible', timeout: 15000 });
  // The entrance is a staggered CSS animation and the shader ramps its fog in;
  // both are well inside this by the time a box or a pixel is read.
  await page.waitForTimeout(settleMs);
}

test.describe('Hero — the plates carry the contrast, not the frame', () => {
  test.describe.configure({ timeout: 120000 });

  test('TC-HERO-PLATE-01: no wash covers the fold at 1440 on ?gl=force', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await settle(page, '/?gl=force', 2500);

    const washes = await page.evaluate(
      ([stageSel, alphaMin, coverageMin]) => {
        /** Max alpha of any colour named in an element's (or pseudo-element's) backgrounds. */
        const maxAlpha = (cs: CSSStyleDeclaration) => {
          const src = `${cs.backgroundColor} ${cs.backgroundImage}`;
          let max = 0;
          const re = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*([\d.]+))?\s*\)/g;
          let m: RegExpExecArray | null;
          while ((m = re.exec(src))) {
            const a = m[1] === undefined ? 1 : parseFloat(m[1]);
            if (a > max) max = a;
          }
          return max;
        };
        const hero = document.querySelector('#hero')!;
        const stage = hero.querySelector(stageSel as string);
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const foldArea = vw * vh;
        const clipArea = (r: { left: number; top: number; right: number; bottom: number }) => {
          const l = Math.max(0, r.left);
          const t = Math.max(0, r.top);
          const rr = Math.min(vw, r.right);
          const b = Math.min(vh, r.bottom);
          return rr > l && b > t ? (rr - l) * (b - t) : 0;
        };
        const found: { what: string; alpha: number; coverage: number }[] = [];
        const describe = (el: Element) =>
          el.tagName.toLowerCase() +
          (el.id ? `#${el.id}` : '') +
          ((el as HTMLElement).dataset?.testid ? `[data-testid="${(el as HTMLElement).dataset.testid}"]` : '') +
          ((el as HTMLElement).dataset?.scene ? `[data-scene="${(el as HTMLElement).dataset.scene}"]` : '');

        for (const el of [hero, ...Array.from(hero.querySelectorAll('*'))]) {
          const rect = el.getBoundingClientRect();
          // The section's own ground and the slot's own backdrop sit UNDER the
          // canvas: they are the picture on the no-GL path, not a wash over it.
          // Everything else — and every pseudo-element, the slot's included,
          // since `::after` paints after the canvas — is measured.
          if (el !== hero && el !== stage) {
            const cs = getComputedStyle(el);
            const alpha = maxAlpha(cs);
            const coverage = clipArea(rect) / foldArea;
            if (alpha >= alphaMin && coverage > coverageMin) {
              found.push({ what: describe(el), alpha, coverage });
            }
          }
          for (const pseudo of ['::before', '::after'] as const) {
            const cs = getComputedStyle(el, pseudo);
            if (cs.content === 'none' || cs.display === 'none') continue;
            const w = parseFloat(cs.width);
            const h = parseFloat(cs.height);
            if (!Number.isFinite(w) || !Number.isFinite(h)) continue;
            let box: { left: number; top: number; right: number; bottom: number };
            if (cs.position === 'absolute' || cs.position === 'fixed') {
              const left = rect.left + (parseFloat(cs.left) || 0);
              const top = rect.top + (parseFloat(cs.top) || 0);
              box = { left, top, right: left + w, bottom: top + h };
            } else {
              // A static pseudo-element has no readable offset; its own area
              // is the conservative measure, placed on its owner's box.
              box = { left: rect.left, top: rect.top, right: rect.left + w, bottom: rect.top + h };
            }
            const alpha = maxAlpha(cs);
            const coverage = clipArea(box) / foldArea;
            if (alpha >= alphaMin && coverage > coverageMin) {
              found.push({ what: `${describe(el)}${pseudo}`, alpha, coverage });
            }
          }
        }
        return found;
      },
      [STAGE, WASH_ALPHA, WASH_COVERAGE] as const,
    );

    const described = washes
      .map((w) => `${w.what} alpha=${w.alpha.toFixed(2)} covers ${(w.coverage * 100).toFixed(1)}% of the fold`)
      .join('\n  ');
    console.log(`[TC-HERO-PLATE-01] washes over the scene at 1440: ${washes.length}${described ? `\n  ${described}` : ''}`);
    expect(
      washes,
      `a wash is painted over the scene — background alpha ≥ ${WASH_ALPHA} covering more than ` +
        `${WASH_COVERAGE * 100}% of the fold:\n  ${described}`,
    ).toEqual([]);
  });

  for (const vp of VIEWPORTS) {
    test(`TC-HERO-PLATE-02: every copy run carries its own plate at ${vp.label}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await settle(page, '/?gl=force', 2500);

      const runs = await page.evaluate(
        ([foldSel, secondarySel]) => {
          const fold = document.querySelector(foldSel as string)!;
          const h1 = fold.querySelector('h1')!;
          const copy = h1.parentElement!;
          const targets: { name: string; el: Element }[] = [];
          for (const child of Array.from(copy.children)) {
            if (child.tagName === 'H1' || child.tagName === 'P') {
              targets.push({ name: `${child.tagName.toLowerCase()} "${(child.textContent ?? '').trim().slice(0, 24)}"`, el: child });
            }
          }
          const secondary = fold.querySelector(secondarySel as string);
          if (secondary) targets.push({ name: 'a "Download CV"', el: secondary });

          const parseAlpha = (color: string) => {
            const m = color.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*([\d.]+))?\s*\)/);
            if (!m) return 0;
            return m[1] === undefined ? 1 : parseFloat(m[1]);
          };

          return targets.map(({ name, el }) => {
            const cs = getComputedStyle(el);
            const plate = el.getBoundingClientRect();
            // The run: the union of every line box the element's own text draws,
            // plus any decoration set inline with it — the eyebrow's location
            // dot stands at the head of its run and the plate is for both.
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
            let node: Node | null;
            const lines: DOMRect[] = [];
            while ((node = walker.nextNode())) {
              if (!(node.textContent ?? '').trim()) continue;
              const range = document.createRange();
              range.selectNodeContents(node);
              for (const r of Array.from(range.getClientRects())) {
                if (r.width > 1 && r.height > 1) lines.push(r);
              }
            }
            const decorations: DOMRect[] = [];
            for (const child of Array.from(el.querySelectorAll('*'))) {
              if ((child.textContent ?? '').trim()) continue;
              const r = child.getBoundingClientRect();
              if (r.width > 0 && r.height > 0) decorations.push(r);
            }
            const text = [...lines, ...decorations].reduce(
              (acc, r) => ({
                left: Math.min(acc.left, r.left),
                top: Math.min(acc.top, r.top),
                right: Math.max(acc.right, r.right),
                bottom: Math.max(acc.bottom, r.bottom),
              }),
              { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity },
            );
            // Distinct line boxes, by their vertical position.
            const lineTops = Array.from(new Set(lines.map((r) => Math.round(r.top))));
            const widestLine = lines.reduce((w, r) => Math.max(w, r.width), 0);
            return {
              name,
              isAction: el.tagName === 'A',
              alpha: parseAlpha(cs.backgroundColor),
              plate: { left: plate.left, top: plate.top, right: plate.right, bottom: plate.bottom },
              height: plate.height,
              text,
              lineCount: lineTops.length,
              widestLine,
              lineHeight: parseFloat(cs.lineHeight),
              paddingTop: parseFloat(cs.paddingTop),
              paddingBottom: parseFloat(cs.paddingBottom),
            };
          });
        },
        [FOLD, SECONDARY_ACTION] as const,
      );

      expect(runs.length, 'the fold exposes the eyebrow, the name, the role, the statement and the secondary action').toBeGreaterThanOrEqual(5);

      for (const run of runs) {
        const dl = run.plate.left - run.text.left;
        const dt = run.plate.top - run.text.top;
        const db = run.text.bottom - run.plate.bottom;
        const dr = run.plate.right - run.text.right;
        const blockSlack = run.height - run.lineCount * run.lineHeight;
        console.log(
          `[TC-HERO-PLATE-02] ${vp.label} ${run.name}: alpha=${run.alpha.toFixed(2)} lines=${run.lineCount} ` +
            `Δleft=${dl.toFixed(1)} Δtop=${dt.toFixed(1)} Δbottom=${db.toFixed(1)} Δright=${dr.toFixed(1)} ` +
            `height=${run.height.toFixed(1)} (${run.lineCount}×${run.lineHeight.toFixed(1)} line-height, ` +
            `block slack ${blockSlack.toFixed(1)}; widest line ${run.widestLine.toFixed(0)} px)`,
        );
        expect(run.alpha, `${run.name} at ${vp.label}: plate alpha`).toBeGreaterThanOrEqual(PLATE_ALPHA_MIN);

        // ── the block axis: the plate is the run's own line boxes and nothing
        // more. No block padding, and the box is exactly its lines' leading —
        // which is the CLS clause of the task: a plate is a background on an
        // existing box and must not change any box's size. The glyph rects sit
        // inside the line box by half the leading, so they are not the measure
        // here; the line-height is. (A pill is its own box already — its height
        // is its `min-height`, and the clause it must meet is block padding 0.)
        expect(run.paddingTop, `${run.name} at ${vp.label}: block padding-top`).toBe(0);
        expect(run.paddingBottom, `${run.name} at ${vp.label}: block padding-bottom`).toBe(0);
        if (!run.isAction) {
          expect(
            Math.abs(blockSlack),
            `${run.name} at ${vp.label}: the plate is ${blockSlack.toFixed(1)} px taller than its ${run.lineCount} line box(es)`,
          ).toBeLessThanOrEqual(2);
        }
        // (Δtop / Δbottom are logged, not asserted: a text Range rect is the
        // font's content area, and for the display face at 1.05 leading that
        // area is taller than the line box — the h1 reports Δtop ≈ 20 px at
        // 1440 with every glyph's ink well inside the plate. The line-box
        // clause above is the honest measure of the block axis.)

        // ── the inline axis: the plate hugs the run — the `.45rem` the padding
        // stands proud of the glyphs, and no more. A pill is its own box: at
        // ≤ 600 px both actions grow to share the row (`flex: 1 1 auto`) with
        // their labels centred, so its ground is the pill and the clause it
        // meets here is the plate alpha and the block padding above.
        if (run.isAction) continue;
        expect(Math.abs(dl), `${run.name} at ${vp.label}: left edge of the plate vs the text`).toBeLessThanOrEqual(PLATE_TOLERANCE_PX);
        expect(dr, `${run.name} at ${vp.label}: the text overruns its plate on the right`).toBeGreaterThanOrEqual(-PLATE_TOLERANCE_PX);
        if (run.lineCount <= 1) {
          expect(dr, `${run.name} at ${vp.label}: right edge of the plate vs the text (single line)`).toBeLessThanOrEqual(PLATE_TOLERANCE_PX);
        } else {
          // A wrapped run's plate ends at the measure and its last lines leave
          // a rag. The rag is at most a word; a band across the fold is not.
          expect(
            dr,
            `${run.name} at ${vp.label}: the plate's rag (${dr.toFixed(0)} px) is not a rag — it is wider than half the widest line (${run.widestLine.toFixed(0)} px)`,
          ).toBeLessThan(run.widestLine * 0.5);
        }
      }
    });
  }
});

/* ── TC-HERO-PLATE-03: the AA walk over #hero, with the numbers recorded ──── */

const GLYPH_MASK_ID = '__hero_plates_glyph_mask__';

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

interface HeroNode {
  path: string;
  text: string;
  color: string;
  opacity: number;
  fontSize: number;
  points: [number, number][];
}

/** Visible hero text nodes inside the current viewport, with sample points clear of any cover. */
async function collectHeroNodes(page: Page): Promise<HeroNode[]> {
  return page.evaluate(() => {
    const hero = document.querySelector('#hero')!;
    const out: HeroNode[] = [];
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const effectiveOpacity = (el: Element) => {
      let o = 1;
      let n: Element | null = el;
      while (n && n !== document.documentElement) {
        o *= parseFloat(getComputedStyle(n).opacity) || 0;
        n = n.parentElement;
      }
      return o;
    };
    const cssPath = (el: Element) => {
      const parts: string[] = [];
      let n: Element | null = el;
      while (n && n !== hero && parts.length < 4) {
        let part = n.tagName.toLowerCase();
        if (n.id) part += `#${n.id}`;
        const tid = n.getAttribute('data-testid');
        if (tid) part += `[data-testid="${tid}"]`;
        parts.unshift(part);
        n = n.parentElement;
      }
      return parts.join(' > ');
    };
    const covered = (el: Element, x: number, y: number) => {
      const stack = document.elementsFromPoint(x, y);
      const idx = stack.indexOf(el);
      if (idx < 0) return true;
      return stack.slice(0, idx).some((over) => !el.contains(over));
    };
    const walker = document.createTreeWalker(hero, NodeFilter.SHOW_TEXT);
    let tn: Node | null;
    while ((tn = walker.nextNode())) {
      const text = (tn.textContent || '').replace(/\s+/g, ' ').trim();
      if (text.length < 2) continue;
      const el = tn.parentElement;
      if (!el) continue;
      if (el.closest('script,style,noscript,template,[hidden],[aria-hidden="true"]')) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility !== 'visible' || cs.display === 'none') continue;
      const opacity = effectiveOpacity(el);
      if (opacity < 0.05) continue;
      const box = el.getBoundingClientRect();
      if (box.width <= 1 || box.height <= 1) continue;
      const range = document.createRange();
      range.selectNodeContents(tn);
      const rects = Array.from(range.getClientRects()).filter((r) => r.width > 1 && r.height > 1);
      const points: [number, number][] = [];
      for (const r of rects.slice(0, 3)) {
        const y = r.top + r.height / 2;
        for (const f of [0.15, 0.5, 0.85]) {
          const x = r.left + r.width * f;
          if (x < 0 || x >= vw || y < 0 || y >= vh) continue;
          const px = Math.round(x);
          const py = Math.round(y);
          if (covered(el, px, py)) continue;
          points.push([px, py]);
        }
      }
      if (!points.length) continue;
      out.push({ path: cssPath(el), text: text.slice(0, 40), color: cs.color, opacity, fontSize: parseFloat(cs.fontSize), points });
    }
    return out;
  });
}

async function samplePixels(page: Page, png: Buffer, points: [number, number][]) {
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
          Math.min(canvas.width - 1, Math.round(x * scale)),
          Math.min(canvas.height - 1, Math.round(y * scale)),
          1,
          1,
        ).data;
        return [d[0], d[1], d[2]] as [number, number, number];
      });
    },
    [png.toString('base64'), points] as const,
  );
}

interface Measured {
  path: string;
  text: string;
  ratio: number;
  fg: string;
  bg: string;
  fontSize: number;
}

/** Walk the hero in two bands — the fold, and the band ending at the section's foot. */
async function walkHero(page: Page): Promise<Measured[]> {
  const heroBottom = await page.evaluate(() => document.querySelector('#hero')!.getBoundingClientRect().bottom + window.scrollY);
  const vh = page.viewportSize()!.height;
  const bands = Array.from(new Set([0, Math.max(0, Math.round(heroBottom - vh))]));
  const seen = new Set<string>();
  const measured: Measured[] = [];
  for (const top of bands) {
    await page.evaluate((y) => window.scrollTo(0, y), top);
    await page.waitForTimeout(700);
    const nodes = (await collectHeroNodes(page)).filter((n) => !seen.has(`${n.path}|${n.text}`));
    if (!nodes.length) continue;
    await maskGlyphs(page, true);
    const png = await page.screenshot({ fullPage: false, animations: 'disabled' });
    await maskGlyphs(page, false);
    const pixels = await samplePixels(page, png, nodes.flatMap((n) => n.points));
    let cursor = 0;
    for (const node of nodes) {
      seen.add(`${node.path}|${node.text}`);
      const fg = parseColor(node.color);
      const samples = pixels.slice(cursor, cursor + node.points.length);
      cursor += node.points.length;
      if (!fg) continue;
      let worst = Infinity;
      let worstBg: [number, number, number] = [0, 0, 0];
      let worstFg: [number, number, number] = [fg[0], fg[1], fg[2]];
      for (const bg of samples) {
        const painted = composite([fg[0], fg[1], fg[2]], fg[3] * node.opacity, bg);
        const ratio = contrast(painted, bg);
        if (ratio < worst) {
          worst = ratio;
          worstBg = bg;
          worstFg = painted;
        }
      }
      measured.push({
        path: node.path,
        text: node.text,
        ratio: worst,
        fg: `rgb(${worstFg.join(',')})`,
        bg: `rgb(${worstBg.join(',')})`,
        fontSize: node.fontSize,
      });
    }
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  return measured.sort((a, b) => a.ratio - b.ratio);
}

for (const path of [
  { url: '/?gl=force', reducedMotion: 'no-preference' as const, name: 'gl', settleMs: 2500 },
  { url: '/', reducedMotion: 'reduce' as const, name: 'still', settleMs: 1200 },
]) {
  test.describe(`Hero — AA over #hero, ${path.name}`, () => {
    test.describe.configure({ timeout: 180000 });

    for (const vp of AA_VIEWPORTS) {
      test(`TC-HERO-PLATE-03 [${vp.width}, ${path.name}]: the ten worst hero text nodes clear ${AA_MIN}:1`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.emulateMedia({ reducedMotion: path.reducedMotion });
        await settle(page, path.url, path.settleMs);
        if (path.reducedMotion === 'reduce') {
          expect(
            await page.locator(`${STAGE} canvas`).count(),
            'a canvas mounted under prefers-reduced-motion — this is meant to be the still',
          ).toBe(0);
        } else {
          await expect(page.locator(`${STAGE} canvas`)).toHaveCount(1, { timeout: 15000 });
        }

        const measured = await walkHero(page);
        expect(measured.length, 'the hero rendered text to measure').toBeGreaterThanOrEqual(10);
        const worstTen = measured.slice(0, 10);
        console.log(
          `[TC-HERO-PLATE-03] ${vp.width} ${path.name}: ${measured.length} nodes, worst ten:\n  ` +
            worstTen
              .map((m) => `${m.ratio.toFixed(2)}:1 ${m.path} — "${m.text}" fg ${m.fg} on bg ${m.bg} @ ${m.fontSize}px`)
              .join('\n  '),
        );
        expect(
          worstTen[0].ratio,
          `the worst hero text node on ${path.name} at ${vp.width} is ${worstTen[0].ratio.toFixed(2)}:1 — ` +
            `${worstTen[0].path} "${worstTen[0].text}" ${worstTen[0].fg} on ${worstTen[0].bg}`,
        ).toBeGreaterThanOrEqual(AA_MIN);
      });
    }
  });
}
