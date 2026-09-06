import { test, expect, type Page } from '@playwright/test';

/**
 * Colour discipline for the one control that floats over every section.
 *
 * `tests/monochrome/monochrome.spec.ts` reuses the static audit's arithmetic —
 * channel spread over max channel, ceiling 0.28 — which is the right predicate
 * for a section painted in the grey ramp: it tolerates the rounding a browser
 * introduces on a gradient. The MiniVic launcher is held to the stricter rule
 * the design council wrote for it (R-c8 item 7, C-04 merged with Motion F-7):
 * *every* computed colour inside `[data-testid="minivic-toggle"]` is literally
 * achromatic, R == G == B, and none of them is the gold.
 *
 * The launcher failed that rule for the whole of v9 and cycle 11 without any
 * gate noticing, because Tailwind's zinc ramp passes the 0.28 spread test:
 * `bg-zinc-400` is #a1a1aa — (170-161)/170 = 0.053 — and `bg-zinc-500` is
 * #71717a, both a blue-leaning grey rather than a neutral one, and the
 * launcher's glow was `rgba(201,205,214,0.45)`. Nothing on this site is allowed
 * to carry a hue that is not the sourced-figure gold, and the launcher is not
 * allowed to carry the gold either: gold means "this figure has a source", and
 * a chat button is not a figure.
 *
 * Colours are read off the rendered page rather than the source, so a hue that
 * only appears once the cascade resolves — a Tailwind utility, a var() chain, a
 * shadow written in a bracket class — is caught here and not in the audit.
 */

/** The Aether gold, which the launcher may never wear in any of its forms. */
const GOLD_TRIPLES = ['201,168,76', '212,182,92', '232,213,163', '176,146,63'];

/**
 * Every longhand that can put paint on screen, plus the two shorthand
 * properties that smuggle colour in as part of a larger value (`box-shadow`
 * carried the launcher's chromatic glow; `background-image` would carry a
 * gradient).
 */
const COLOUR_PROPERTIES = [
  'color',
  'backgroundColor',
  'backgroundImage',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'textDecorationColor',
  'columnRuleColor',
  'caretColor',
  'boxShadow',
  'textShadow',
  'fill',
  'stroke',
] as const;

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('[data-testid="minivic-toggle"]');
      if (!btn) return false;
      return Object.keys(btn).some(
        (key) => key.startsWith('__reactFiber') || key.startsWith('__reactProps'),
      );
    },
    { timeout: 30000 },
  );
  // The dock only fades in past the hero; styles resolve either way, but the
  // launcher is read in the state a visitor actually sees it in.
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
  await page.waitForTimeout(400);
}

/**
 * Returns one description per offending colour found on the launcher or any of
 * its descendants: a colour that is not R == G == B, or is the gold.
 */
async function launcherOffenders(page: Page, golds: string[], properties: string[]) {
  return page.evaluate(
    ({ golds: goldSet, properties: props }) => {
      const root = document.querySelector('[data-testid="minivic-toggle"]');
      if (!root) return ['[data-testid="minivic-toggle"] is not in the document'];

      const elements = [root, ...Array.from(root.querySelectorAll('*'))];
      const hits = new Set<string>();
      const golds = new Set(goldSet);

      for (const el of elements) {
        const cs = getComputedStyle(el as Element) as unknown as Record<string, string>;
        for (const property of props) {
          const raw = cs[property];
          if (!raw || raw === 'none') continue;
          // One declaration can carry several colours (a shadow list, a
          // gradient); every one of them is held to the rule.
          const matches = raw.matchAll(
            /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.%]+))?\s*\)/g,
          );
          for (const m of matches) {
            const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
            const alphaRaw = m[4];
            const alpha =
              alphaRaw === undefined
                ? 1
                : alphaRaw.endsWith('%')
                  ? Number(alphaRaw.slice(0, -1)) / 100
                  : Number(alphaRaw);
            if (alpha === 0) continue; // fully transparent paints nothing
            const triple = `${r},${g},${b}`;
            const name = (el as Element).tagName.toLowerCase();
            const cls = String((el as HTMLElement).className ?? '').slice(0, 48);
            if (golds.has(triple)) {
              hits.add(`GOLD ${name}${cls ? `.${cls}` : ''} ${property}=rgb(${triple})`);
              continue;
            }
            if (r !== g || g !== b) {
              hits.add(`HUE ${name}${cls ? `.${cls}` : ''} ${property}=rgb(${triple})`);
            }
          }
        }
      }
      return Array.from(hits);
    },
    { golds, properties },
  );
}

test.describe('Monochrome: the MiniVic launcher', () => {
  test.describe.configure({ timeout: 90000 });

  for (const { width, height } of [
    { width: 1440, height: 900 },
    { width: 640, height: 900 },
    { width: 390, height: 844 },
  ]) {
    test(`MONO-MV-01 @ ${width}: every colour inside the launcher is R==G==B and never gold`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await gotoHome(page);

      const closed = await launcherOffenders(page, GOLD_TRIPLES, COLOUR_PROPERTIES as unknown as string[]);
      expect(
        closed,
        `closed launcher carries ${closed.length} non-achromatic or gold colour(s):\n${closed.join('\n')}`,
      ).toEqual([]);

      // Open state too: the launcher keeps its ring and pip while the panel is
      // up, and that state is on screen for as long as a conversation lasts.
      await page.locator('[data-testid="minivic-toggle"]').evaluate((el: HTMLElement) => el.click());
      await expect(page.locator('[data-testid="minivic-panel"]')).toBeVisible();
      await page.waitForTimeout(300);

      const open = await launcherOffenders(page, GOLD_TRIPLES, COLOUR_PROPERTIES as unknown as string[]);
      expect(
        open,
        `open-state launcher carries ${open.length} non-achromatic or gold colour(s):\n${open.join('\n')}`,
      ).toEqual([]);
    });
  }
});

/* ── G-MV1: the launcher says what it is on a phone ─────────────────────────
   ADV-REVIEW-20260905T1451Z §Chrome/Hero, P0. The pill carrying the words
   "Ask Mini Vic" was painted only from 52.125rem up, so on a 390px phone the
   control was an unlabelled disc floating over the page — legible only to
   someone who already knew what it was, which is nobody arriving from a job
   ad. The name is now carried at every width.

   Two things have to be true at once and they are measured separately here:
   the label has to be *visible* (a real box, real ink, not an aria-label), and
   it has to clear AA against the plate it is set on. The plate is required to
   be fully opaque, so that ratio is the one a visitor actually sees rather
   than one that depends on whatever the pill happens to be floating over, and
   so the prose underneath is covered rather than showing through the type.
   What the launcher is allowed to do to that prose is a separate rule and it
   is unchanged: tests/a11y/minivic-occlusion.spec.ts. */

const AA_NORMAL = 4.5;

const srgbChannel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const relLuminance = ([r, g, b]: [number, number, number]) =>
  0.2126 * srgbChannel(r) + 0.7152 * srgbChannel(g) + 0.0722 * srgbChannel(b);
const contrastRatio = (a: [number, number, number], b: [number, number, number]) => {
  const l1 = relLuminance(a);
  const l2 = relLuminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};
const rgbaParts = (value: string): [number, number, number, number] | null => {
  const m = value.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)/);
  if (!m) return null;
  return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
};

type LabelReading = {
  text: string;
  display: string;
  visibility: string;
  opacity: number;
  color: string;
  background: string;
  rect: { x: number; y: number; width: number; height: number };
  target: { width: number; height: number };
};

async function readLabel(page: Page): Promise<LabelReading | null> {
  return page.evaluate(() => {
    const label = document.querySelector('[data-testid="minivic-launcher-label"]');
    const button = document.querySelector('[data-testid="minivic-toggle"]');
    if (!label || !button) return null;
    const cs = getComputedStyle(label);
    let opacity = 1;
    let node: Element | null = label;
    while (node && node !== document.documentElement) {
      opacity *= parseFloat(getComputedStyle(node).opacity) || 0;
      node = node.parentElement;
    }
    const r = label.getBoundingClientRect();
    const b = button.getBoundingClientRect();
    return {
      text: (label.textContent || '').replace(/\s+/g, ' ').trim(),
      display: cs.display,
      visibility: cs.visibility,
      opacity,
      color: cs.color,
      background: cs.backgroundColor,
      rect: { x: r.x, y: r.y, width: r.width, height: r.height },
      target: { width: b.width, height: b.height },
    };
  });
}

/** Rects of the launcher and of the two hero elements it must never sit on. */
async function foldGeometry(page: Page) {
  return page.evaluate(() => {
    const rectOf = (selector: string) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    };
    const dock = document.querySelector('.minivic-dock');
    let painted = 1;
    let node: Element | null = dock;
    while (node && node !== document.documentElement) {
      painted *= parseFloat(getComputedStyle(node).opacity) || 0;
      node = node.parentElement;
    }
    return {
      painted,
      launcher: rectOf('[data-testid="minivic-toggle"]'),
      portrait: rectOf('[data-testid="hero-portrait"]'),
      actions: rectOf('[data-testid="hero-actions"]'),
    };
  });
}

const intersects = (
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number },
) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

test.describe('G-MV1: the MiniVic launcher carries its name at phone widths', () => {
  test.describe.configure({ timeout: 90000 });

  for (const { width, height } of [
    { width: 390, height: 844 },
    { width: 640, height: 900 },
  ]) {
    test(`MONO-MV-02 @ ${width}: the launcher shows a visible "Ask Mini Vic" label at AA`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await gotoHome(page);
      // The dock only paints once the hero has been read, and the hero is
      // taller than 1.5 viewports on a phone: scroll until it is actually on
      // screen, which is the state this test is about.
      // The dock arrives on the same 300ms opacity transition it leaves on, and
      // that transition only starts a frame or more after the scroll, once the
      // IntersectionObserver has re-reported #hero. A fixed 400ms per step sits
      // right on that boundary: under load the read lands mid-fade and the loop
      // scrolls on, and after twelve steps the label is read as unpainted even
      // though the product painted it (observed once at 640 on b9f5195 while
      // this file ran behind tests/a11y/minivic-occlusion.spec.ts). So each step
      // waits for the paint to settle rather than for the clock, with a budget.
      const dockOpacity = () =>
        page.evaluate(() => {
          const dock = document.querySelector('.minivic-dock');
          return dock ? parseFloat(getComputedStyle(dock).opacity) || 0 : 0;
        });
      for (let step = 0; step < 12; step += 1) {
        if ((await dockOpacity()) > 0.9) break;
        await page.evaluate((h) => window.scrollBy(0, h), height);
        await page.waitForTimeout(400);
      }
      // The last step's reading can still be mid-fade, so the paint is waited
      // for rather than slept for. The poll runs out of process, on a fixed
      // interval, so it does not depend on the page's own rAF — on a loaded
      // machine, with this file running behind the pixel-heavy occlusion suite,
      // an in-page rAF poll is exactly what stalls. Nothing here is relaxed: if
      // the dock never paints past the hero the wait fails, which is the same
      // failure the old fixed sleep produced, only now it is not a coin flip.
      await expect
        .poll(dockOpacity, {
          timeout: 8000,
          message: 'the dock never painted past the hero — the launcher is unreachable',
        })
        .toBeGreaterThan(0.9);

      const label = await readLabel(page);
      expect(label, '[data-testid="minivic-launcher-label"] is not in the document').not.toBeNull();

      expect(label!.text, 'the launcher label must read "Ask Mini Vic"').toBe('Ask Mini Vic');
      expect(
        label!.display,
        `the label is display:${label!.display} at ${width} — an aria-only name is not a visible affordance`,
      ).not.toBe('none');
      expect(label!.visibility, 'the label must be visible').toBe('visible');
      expect(label!.opacity, 'the label must be painted, not faded out').toBeGreaterThan(0.9);
      expect(label!.rect.width, 'the label must occupy real width').toBeGreaterThan(40);
      expect(label!.rect.height, 'the label must occupy real height').toBeGreaterThan(10);

      // ≥ 44 × 44 for the control the label belongs to.
      expect(label!.target.width, 'launcher target width').toBeGreaterThanOrEqual(44);
      expect(label!.target.height, 'launcher target height').toBeGreaterThanOrEqual(44);

      // AA on its own ground, and the ground is opaque so that ratio is real.
      const ink = rgbaParts(label!.color);
      const plate = rgbaParts(label!.background);
      expect(ink, `unreadable label colour ${label!.color}`).not.toBeNull();
      expect(plate, `unreadable label background ${label!.background}`).not.toBeNull();
      expect(
        plate![3],
        `the label plate is ${label!.background} — a translucent plate makes its contrast depend on whatever it floats over`,
      ).toBe(1);
      const ratio = contrastRatio([ink![0], ink![1], ink![2]], [plate![0], plate![1], plate![2]]);
      expect(
        ratio,
        `label ${label!.color} on ${label!.background} is ${ratio.toFixed(2)}:1, below AA`,
      ).toBeGreaterThanOrEqual(AA_NORMAL);

      // Nothing of the launcher — least of all a wider, labelled one — is
      // allowed on top of the hero's portrait or its one action group in the
      // first viewport. At 390 the portrait is a full-bleed block that reaches
      // both edges and runs to the bottom of the fold, so *no* bottom-anchored
      // dock can clear it geometrically; what keeps it off is the pastHero
      // gate (MiniVicBot.tsx), which paints nothing until the hero has been
      // read. Both halves of that are asserted: the gate holds, and if the
      // gate were ever removed the boxes would have to be clear anyway.
      await page.evaluate(() => window.scrollTo(0, 0));
      // The dock withdraws on a 300ms opacity transition
      // (`transition-opacity duration-300`, computed
      // `opacity 0.3s cubic-bezier(0.4,0,0.2,1)`) that only starts once the
      // IntersectionObserver has re-reported #hero and React has re-rendered
      // with `pastHero` false. A single sample 400ms after the scroll therefore
      // lands *inside* the fade rather than after it — measured on the b9f5195
      // export at 0.115637 (390) and 0.0791977 (640), both still falling. The
      // rule is about the state the fold is actually read in, so the
      // withdrawal is given a stated budget instead of one arbitrary instant:
      // it has to reach unpainted within 1000ms — more than three times the
      // transition — and the settled reading is then held to the same 0.05
      // ceiling below, which is not relaxed.
      const WITHDRAWAL_BUDGET_MS = 1000;
      const withdrawalMs = await page.evaluate(async (budget) => {
        const painted = () => {
          let value = 1;
          let node: Element | null = document.querySelector('.minivic-dock');
          if (!node) return 0;
          while (node && node !== document.documentElement) {
            value *= parseFloat(getComputedStyle(node).opacity) || 0;
            node = node.parentElement;
          }
          return value;
        };
        const started = performance.now();
        for (;;) {
          const elapsed = performance.now() - started;
          if (painted() < 0.05) return elapsed;
          if (elapsed >= budget) return -1;
          await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
        }
      }, WITHDRAWAL_BUDGET_MS);
      expect(
        withdrawalMs,
        `the dock is still painted over the fold at ${width} ${WITHDRAWAL_BUDGET_MS}ms after ` +
          'scrolling back to it — the withdrawal never completes',
      ).toBeGreaterThanOrEqual(0);

      const geometry = await foldGeometry(page);
      expect(geometry.launcher, 'launcher must have a box').not.toBeNull();
      expect(
        geometry.painted,
        `the dock is painted (opacity ${geometry.painted}) over the fold at ${width} — ` +
          'the pastHero gate is the only thing keeping it off the portrait and the CV button',
      ).toBeLessThan(0.05);
      const covering = geometry.painted >= 0.05;
      if (geometry.portrait) {
        expect(
          covering && intersects(geometry.launcher!, geometry.portrait),
          `the docked launcher paints over [data-testid="hero-portrait"] at ${width}: ` +
            `launcher ${JSON.stringify(geometry.launcher)} vs portrait ${JSON.stringify(geometry.portrait)}`,
        ).toBe(false);
      }
      if (geometry.actions) {
        expect(
          covering && intersects(geometry.launcher!, geometry.actions),
          `the docked launcher paints over [data-testid="hero-actions"] at ${width}: ` +
            `launcher ${JSON.stringify(geometry.launcher)} vs actions ${JSON.stringify(geometry.actions)}`,
        ).toBe(false);
      }
    });
  }
});
