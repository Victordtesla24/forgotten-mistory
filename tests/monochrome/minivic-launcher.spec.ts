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
