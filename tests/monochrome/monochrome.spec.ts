import { test, expect, type Page } from '@playwright/test';

/**
 * Colour discipline — achromatic, plus exactly one sanctioned accent.
 *
 * The rule the site is built on is not "no colour": it is *one* hue, with one
 * meaning. The near-black inks and cool greys carry the page; the Aether brand
 * gold (`--gold`, `--gold-light`, `--gold-pale`, `--gold-dark`, defined only in
 * `app/globals.css` and `lib/palette.ts`) marks a figure whose source is
 * printed beside it, and marks nothing else. Any other hue is a defect.
 *
 * `scripts/validate/overhaul_static_audit.mjs` already encodes that rule
 * against the *source* tree, and this file deliberately reuses its exact
 * arithmetic — channel spread over max channel, a 0.28 ceiling, near-black
 * (max ≤ 24) exempted because hue is imperceptible there — so the two gates
 * cannot drift apart and disagree about what counts as chromatic. The
 * difference is what they can see: the audit reads literals in the source and
 * therefore cannot follow `var()` indirection or a computed cascade, while
 * these checks read `getComputedStyle` on the rendered page and therefore catch
 * a hue that only appears after the cascade resolves.
 *
 * The old MONO-03/04/05 were tolerance-based ("at most twenty inline hexes",
 * "channels within 20 of each other") which both let real hues through and had
 * no way to express the one permitted exception. They are replaced with the
 * audit's predicate and an explicit allow-list of the four golds. MONO-07 no
 * longer tests the deleted `<footer>`; it now proves the predicate itself still
 * rejects an unsanctioned hue, so none of the checks above it can pass by being
 * quietly blind.
 */

/** The Aether brand golds as rendered RGB triples, and nothing else. */
const SANCTIONED_ACCENTS = ['201,168,76', '212,182,92', '232,213,163', '176,146,63'];

/** Every colour-bearing longhand a section can paint with. */
const COLOUR_PROPERTIES = [
  'color',
  'backgroundColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'textDecorationColor',
  'columnRuleColor',
  'caretColor',
  'fill',
  'stroke',
] as const;

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
}

/** Walks every section once so lazily-styled content has actually been laid out. */
async function visitEverySection(page: Page) {
  for (const id of ['#hero', '#about', '#experience', '#skills', '#vitrine', '#listen']) {
    await page.locator(id).scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

/**
 * Collects every rendered colour under `scope` that is neither achromatic nor a
 * sanctioned accent. Returns a describable string per offender so a failure
 * names the element and the property rather than only a count.
 */
async function chromaticOffenders(page: Page, scope: string, accents: string[]): Promise<string[]> {
  return page.evaluate(
    ({ scope: selector, accents: allowed, properties }) => {
      const allowedSet = new Set(allowed);

      const parse = (value: string): [number, number, number] | null => {
        const m = value.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
        return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
      };

      // Verbatim from scripts/validate/overhaul_static_audit.mjs::checkMono.
      const chromatic = ([r, g, b]: [number, number, number]) => {
        const mx = Math.max(r, g, b);
        const mn = Math.min(r, g, b);
        if (mx <= 24) return false; // near-black: hue is imperceptible
        return (mx - mn) / mx > 0.28;
      };

      const roots = Array.from(document.querySelectorAll(selector));
      const elements = roots.flatMap((root) => [root, ...Array.from(root.querySelectorAll('*'))]);

      const hits = new Set<string>();
      for (const el of elements) {
        const cs = getComputedStyle(el as Element) as unknown as Record<string, string>;
        for (const property of properties) {
          const raw = cs[property];
          if (!raw || raw === 'none') continue;
          const rgb = parse(raw);
          if (!rgb) continue;
          if (allowedSet.has(rgb.join(','))) continue;
          if (!chromatic(rgb)) continue;
          const name = (el as Element).tagName.toLowerCase();
          const cls = String((el as HTMLElement).className ?? '').slice(0, 40);
          hits.add(`${name}${cls ? `.${cls}` : ''} ${property}=${raw}`);
        }
      }
      return Array.from(hits);
    },
    { scope, accents, properties: COLOUR_PROPERTIES as unknown as string[] },
  );
}

test.describe('Monochrome Compliance', () => {
  test.describe.configure({ timeout: 90000 });

  test('MONO-01: :root publishes the grey ramp and exactly the four sanctioned gold tokens', async ({ page }) => {
    await gotoHome(page);
    const tokens = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      const read = (name: string) => s.getPropertyValue(name).trim();
      return {
        greys: ['--ink-900', '--ink-800', '--ink-700', '--white', '--accent', '--steel'].map(
          (n) => [n, read(n)] as const,
        ),
        golds: ['--gold', '--gold-light', '--gold-pale', '--gold-dark'].map(
          (n) => [n, read(n).toLowerCase()] as const,
        ),
      };
    });

    for (const [name, value] of tokens.greys) {
      expect(value, `${name} is not declared on :root`).toBeTruthy();
    }
    // The accent is a fixed brand value, not a free variable. If one of these
    // changes, the meaning "this figure has a source" has changed with it.
    expect(tokens.golds).toEqual([
      ['--gold', '#c9a84c'],
      ['--gold-light', '#d4b65c'],
      ['--gold-pale', '#e8d5a3'],
      ['--gold-dark', '#b0923f'],
    ]);
  });

  test('MONO-02: Body background is achromatic', async ({ page }) => {
    await gotoHome(page);
    const offenders = await chromaticOffenders(page, 'body', SANCTIONED_ACCENTS);
    const bodyOnly = offenders.filter((o) => o.startsWith('body '));
    expect(bodyOnly).toEqual([]);
  });

  test('MONO-03: No inline style declares a colour outside the palette', async ({ page }) => {
    await gotoHome(page);
    await visitEverySection(page);

    // Inline styles are where a hue sneaks past the source audit, because they
    // are often composed at runtime from values the static scan never sees.
    const offenders = await page.evaluate((accents) => {
      const allowed = new Set(accents);
      const chromatic = (r: number, g: number, b: number) => {
        const mx = Math.max(r, g, b);
        const mn = Math.min(r, g, b);
        if (mx <= 24) return false;
        return (mx - mn) / mx > 0.28;
      };
      const hits: string[] = [];
      for (const el of Array.from(document.querySelectorAll('[style]'))) {
        const style = el.getAttribute('style') ?? '';
        const tag = el.tagName.toLowerCase();

        for (const m of Array.from(style.match(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g) ?? [])) {
          let h = m.slice(1);
          if (h.length === 3) {
            h = h
              .split('')
              .map((c: string) => c + c)
              .join('');
          }
          const rgb: [number, number, number] = [
            parseInt(h.slice(0, 2), 16),
            parseInt(h.slice(2, 4), 16),
            parseInt(h.slice(4, 6), 16),
          ];
          if (allowed.has(rgb.join(','))) continue;
          if (chromatic(rgb[0], rgb[1], rgb[2])) hits.push(`${tag} :: ${m}`);
        }

        for (const m of Array.from(style.match(/rgba?\([^)]*\)/g) ?? [])) {
          const parts = m.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
          if (!parts) continue;
          const rgb: [number, number, number] = [
            Number(parts[1]),
            Number(parts[2]),
            Number(parts[3]),
          ];
          if (allowed.has(rgb.join(','))) continue;
          if (chromatic(rgb[0], rgb[1], rgb[2])) hits.push(`${tag} :: rgb(${rgb.join(' ')})`);
        }
      }
      return Array.from(new Set(hits));
    }, SANCTIONED_ACCENTS);

    expect(offenders).toEqual([]);
  });

  test('MONO-04: Every rendered colour in every section is achromatic or the sanctioned gold', async ({ page }) => {
    await gotoHome(page);
    await visitEverySection(page);
    const offenders = await chromaticOffenders(
      page,
      '#hero, #about, #experience, #skills, #vitrine, #listen',
      SANCTIONED_ACCENTS,
    );
    expect(offenders, `chromatic colours in the six sections:\n${offenders.join('\n')}`).toEqual([]);
  });

  test('MONO-05: The sanctioned accent is actually in use, and only as the accent', async ({ page }) => {
    await gotoHome(page);
    await visitEverySection(page);

    // A monochrome check that passes because the accent was silently dropped is
    // worthless — the gold is the one hue the design *requires*, and the caliper
    // mark is meaningless without it. So: it must be present.
    const rendered = await page.evaluate((accents) => {
      const allowed = new Set(accents);
      const found = new Set<string>();
      for (const el of Array.from(document.querySelectorAll('#hero *, #skills *, #vitrine *, #listen *'))) {
        const cs = getComputedStyle(el);
        for (const raw of [cs.color, cs.backgroundColor, cs.borderTopColor, cs.borderLeftColor]) {
          const m = raw?.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
          if (!m) continue;
          const key = `${Number(m[1])},${Number(m[2])},${Number(m[3])}`;
          if (allowed.has(key)) found.add(key);
        }
      }
      return Array.from(found);
    }, SANCTIONED_ACCENTS);

    expect(rendered.length, 'the gold accent renders nowhere on the page').toBeGreaterThan(0);
    for (const value of rendered) expect(SANCTIONED_ACCENTS).toContain(value);
  });

  test('MONO-06: Navigation overlay is achromatic when open', async ({ page }) => {
    await gotoHome(page);
    await page.locator('.menu-toggle').click();
    await expect(page.locator('#site-nav-overlay')).toHaveClass(/open/);
    const offenders = await chromaticOffenders(page, '#site-nav-overlay', SANCTIONED_ACCENTS);
    expect(offenders).toEqual([]);
  });

  test('MONO-07: The check still rejects an unsanctioned hue', async ({ page }) => {
    await gotoHome(page);

    // Everything above passes today. This proves that is because the page is
    // clean rather than because the predicate stopped seeing colour: paint one
    // element a hue that is neither grey nor gold and require it to be caught,
    // then paint it a gold and require it to be let through.
    await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.id = 'mono-negative-control';
      probe.style.color = '#c0392b';
      document.querySelector('#listen')?.appendChild(probe);
    });
    const caught = await chromaticOffenders(page, '#listen', SANCTIONED_ACCENTS);
    expect(caught.some((o) => o.includes('192, 57, 43'))).toBe(true);

    await page.evaluate(() => {
      const probe = document.querySelector('#mono-negative-control') as HTMLElement | null;
      if (probe) probe.style.color = '#c9a84c';
    });
    const clean = await chromaticOffenders(page, '#listen', SANCTIONED_ACCENTS);
    expect(clean).toEqual([]);
  });
});
