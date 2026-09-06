import { test, expect } from '@playwright/test';
import { PNG } from 'pngjs';

/**
 * TC-HERO-PAL-01 — the fold is monochrome, and the gold has moved below it.
 *
 * Binding source: docs/architecture/HERO-SETPIECE-v3.md §8 (slice S4,
 * `g2h1v3-04`) and CLAUDE.md prime directive 4: gold means one thing only —
 * *this figure has a source*. S1 moved the three graded figures and their
 * provenance out of the first screen and into `.proof`, which now begins at
 * exactly `100svh` (TC-HERO-SET-02). So the only gold that ever lived inside
 * `#hero` is no longer in the fold, and this case is what stops it coming back:
 *
 *   max sRGB chroma across the fold capture   ≤ 2/255
 *   gold rects in the fold                    0
 *
 * Both thresholds are §8's verbatim.
 *
 * ## Why a new file next to `tests/monochrome/monochrome.spec.ts`
 *
 * `monochrome.spec.ts` and `tests/palette_bundle.test.mjs` answer a *source*
 * question — no raw hex outside `app/globals.css` / `lib/palette.ts`, and the
 * declared tokens are neutral. Neither reads pixels, and neither is scoped to
 * the fold. A shader can emit a warm cast that no declared token contains, and
 * a gold border can be inherited into the fold by a rule written elsewhere; only
 * a capture of the first screen can see either. `palette_bundle.test.mjs` is a
 * `node --test` file with no browser, so extending it was not an option that
 * could take a screenshot: decided in-session per docs/prompt.md §0.1 and
 * recorded here rather than asked.
 *
 * ## Measurement
 *
 *  - Chroma per pixel is `max(r,g,b) − min(r,g,b)` in raw sRGB bytes. A perfect
 *    grey is 0; the token `--gold: #c9a84c` is 125. The 2/255 allowance is for
 *    PNG/AVIF round-tripping, nothing else, so the *maximum* is asserted rather
 *    than a mean — a mean would let a saturated badge hide in a grey frame.
 *  - `--disable-lcd-text` is set for the same reason the SPD instrument sets it:
 *    subpixel antialiasing paints coloured fringes on every glyph edge and would
 *    put chroma ≈ 60 into an otherwise perfectly neutral fold.
 *  - The gold sweep reads computed `color`, `background-color`, `border-*-color`
 *    and `fill`/`stroke` on every element whose rect intersects the fold, and
 *    flags any that is chromatic at all (chroma ≥ 8/255, i.e. unambiguously not
 *    a neutral) with an alpha that can be seen (≥ 0.05).
 *  - Both paths: `/?gl=force` settled, and the `prefers-reduced-motion` still.
 *    A GPU-only number is not evidence for the reader who never gets one.
 */

const CHROMA_MAX = 2; // 2/255, §8
const GOLD_RECTS_MAX = 0; // §8

/** §3.2 / §8 — the four widths, in the brief's order. */
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 834, height: 1194 },
  { width: 390, height: 844 },
] as const;

/** §8 — both paths. Mirrors `PATHS` in `scripts/validate/hero_plane_dominance.mjs`. */
const PATHS = [
  { id: 'gl', label: '/?gl=force (shader, settled)', url: '/?gl=force', reducedMotion: false },
  { id: 'still', label: 'prefers-reduced-motion still', url: '/', reducedMotion: true },
] as const;

test.use({
  deviceScaleFactor: 1,
  launchOptions: {
    args: [
      '--no-sandbox',
      '--use-gl=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
      '--disable-lcd-text',
    ],
  },
});

for (const viewport of VIEWPORTS) {
  const size = `${viewport.width}×${viewport.height}`;

  test.describe(`TC-HERO-PAL @ ${size} — the fold is monochrome`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of PATHS) {
      test(`TC-HERO-PAL-01 @ ${size} [${route.id}] — max chroma ≤ ${CHROMA_MAX}/255 and 0 gold rects`, async ({
        page,
        baseURL,
      }) => {
        test.setTimeout(120000);

        if (route.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(new URL(route.url, baseURL ?? 'http://127.0.0.1:5610').toString(), {
          waitUntil: 'domcontentloaded',
        });

        const preloader = page.locator('.preloader');
        if (await preloader.isVisible().catch(() => false)) {
          const skip = page.locator('button.preloader-skip');
          if (await skip.isVisible().catch(() => false))
            await skip.click({ timeout: 5000 }).catch(() => {});
          await preloader.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
        }
        await page.locator('#hero h1').waitFor({ state: 'visible', timeout: 20000 });
        await page
          .waitForFunction(() => document.body.classList.contains('page-ready'), null, {
            timeout: 20000,
          })
          .catch(() => {});
        if (route.reducedMotion) {
          await page.waitForTimeout(1500);
        } else {
          await page
            .locator('[data-scene="hero-atmosphere"] canvas')
            .waitFor({ state: 'attached', timeout: 30000 });
          await page.waitForTimeout(3000);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(100);

        // --- the pixels -----------------------------------------------------
        const capture = await page.screenshot({ type: 'png', fullPage: false });
        const png = PNG.sync.read(capture);
        expect(
          `${png.width}×${png.height}`,
          'deviceScaleFactor must be 1 so the capture is the fold',
        ).toBe(size.replace('×', '×'));

        let maxChroma = 0;
        let worst = { x: 0, y: 0, r: 0, g: 0, b: 0 };
        let overBudget = 0;
        for (let y = 0; y < png.height; y += 1) {
          for (let x = 0; x < png.width; x += 1) {
            const o = (y * png.width + x) * 4;
            const r = png.data[o];
            const g = png.data[o + 1];
            const b = png.data[o + 2];
            const chroma = Math.max(r, g, b) - Math.min(r, g, b);
            if (chroma > CHROMA_MAX) overBudget += 1;
            if (chroma > maxChroma) {
              maxChroma = chroma;
              worst = { x, y, r, g, b };
            }
          }
        }

        // --- the DOM --------------------------------------------------------
        const goldRects = await page.evaluate(() => {
          const W = window.innerWidth;
          const H = window.innerHeight;
          const parse = (value: string): { r: number; g: number; b: number; a: number } | null => {
            const m = value.match(
              /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.%]+))?\s*\)/i,
            );
            if (!m) return null;
            const rawAlpha = m[4];
            const a = rawAlpha
              ? rawAlpha.endsWith('%')
                ? Number(rawAlpha.slice(0, -1)) / 100
                : Number(rawAlpha)
              : 1;
            return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a };
          };
          const describe = (el: Element) => {
            const tag = el.tagName.toLowerCase();
            const cls =
              typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean)[0] : '';
            return `${tag}${el.id ? `#${el.id}` : cls ? `.${cls}` : ''}`;
          };
          const props = [
            'color',
            'backgroundColor',
            'borderTopColor',
            'borderRightColor',
            'borderBottomColor',
            'borderLeftColor',
            'outlineColor',
            'fill',
            'stroke',
          ] as const;
          const found: string[] = [];
          for (const el of Array.from(document.body.querySelectorAll('*'))) {
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) continue;
            if (rect.bottom <= 0 || rect.top >= H || rect.right <= 0 || rect.left >= W) continue;
            const cs = getComputedStyle(el);
            if (cs.visibility === 'hidden' || cs.display === 'none') continue;
            if (Number(cs.opacity) < 0.05) continue;
            for (const prop of props) {
              const colour = parse(cs[prop] as string);
              if (!colour || colour.a < 0.05) continue;
              const chroma =
                Math.max(colour.r, colour.g, colour.b) - Math.min(colour.r, colour.g, colour.b);
              if (chroma < 8) continue;
              found.push(
                `${describe(el)} ${prop}=rgb(${colour.r},${colour.g},${colour.b})/${colour.a} ` +
                  `chroma=${chroma.toFixed(0)}`,
              );
            }
          }
          return found;
        });

        // eslint-disable-next-line no-console
        console.log(
          `[TC-HERO-PAL-01] ${size} ${route.label}: max chroma ${maxChroma}/255 at ` +
            `(${worst.x},${worst.y}) rgb(${worst.r},${worst.g},${worst.b}); ` +
            `${overBudget} px over ${CHROMA_MAX}/255; gold/chromatic rects ${goldRects.length}` +
            (goldRects.length ? `\n    ${goldRects.join('\n    ')}` : ''),
        );

        expect(
          maxChroma,
          `PAL-01 fails at ${size} on ${route.label}: max sRGB chroma ${maxChroma}/255 > ` +
            `${CHROMA_MAX}/255 at (${worst.x},${worst.y}) = rgb(${worst.r},${worst.g},${worst.b}); ` +
            `${overBudget} px are over budget. The fold is monochrome by directive — gold is a ` +
            'claim, never a colour.',
        ).toBeLessThanOrEqual(CHROMA_MAX);

        expect(
          goldRects,
          `PAL-01 fails at ${size} on ${route.label}: ${goldRects.length} chromatic rect(s) in the ` +
            'fold. The graded figures and their provenance live in .proof, below 100svh.',
        ).toHaveLength(GOLD_RECTS_MAX);
      });
    }
  });
}
