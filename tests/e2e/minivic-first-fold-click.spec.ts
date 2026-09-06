import { test, expect, type Page } from '@playwright/test';

/**
 * TC-MV-CLICK-01 — the launcher answers a real pointer on the first fold.
 *
 * The v10 adversarial pass at `ec53e2b4` graded this a REGRESSION and it is the
 * kind that no existing suite could see, because every instrument agreed with
 * the component instead of with the visitor:
 *
 *   panel-probe-1440.json / panel-probe-390.json
 *     launcher.computed = { display: "block", visibility: "visible",
 *                           opacity: "1", clip: "none" }   → "the pill is fine"
 *     openPath          = [ "first-fold click BLOCKED: locator.click:
 *                            Timeout 6000ms exceeded.",
 *                           "after-hero-scroll click OK" ]
 *     firstFoldBlocker  = 1440: <div data-testid="hero-fold">
 *                          390: <video class="Hero_portraitVideo…">
 *
 * `isVisible()` and `getComputedStyle` are both read on the pill itself, and
 * the pill is opaque — what is transparent and inert is the *dock* around it
 * (`opacity: 0` + `pointer-events: none` until `pastHero`). Playwright reported
 * whatever the hit test actually found under the cursor, which is why the
 * blocker reads as a Hero node: nothing was stacked over the launcher, the
 * launcher simply was not in the hit test at all.
 *
 * `tests/e2e/chatbot.spec.ts` cannot catch it either — it opens the panel with
 * `el.click()`, a synthetic dispatch straight at the node, which bypasses hit
 * testing entirely. So this file asserts the two things a visitor's finger
 * needs and nothing else does:
 *
 *   1. `document.elementFromPoint` at the pill's own centre resolves inside the
 *      launcher button — i.e. the control owns the pixels it paints;
 *   2. a real `page.mouse.click` there (move → down → up, hit-tested like any
 *      other click) opens the dialog — at 1440 on the first fold, and at 390
 *      the moment the dock paints (see the F-1 note below).
 *
 * The fix belongs on the launcher side: the dock may stay unpainted over the
 * hero — `tests/monochrome/minivic-launcher.spec.ts` MONO-MV-02 requires that,
 * so the disc never lands on the hero portrait at phone widths — but the button
 * inside it re-enables its own pointer events wherever it may paint, and the
 * dock paints while the pointer is on it, so the control is never an invisible
 * interceptor. The pill is never hidden at any width (G-MV1).
 */

/**
 * ADV rev7 F-1 (P0) narrowed this contract to what it always meant.
 *
 * "The launcher answers a real pointer" and "the launcher is not an invisible
 * interceptor" are the same sentence read from two sides, and at 390 they had
 * come apart: the launcher's box (`x208 y776 158x44`) is the hero's action row
 * (`x213 y780 153x48`), the dock there is required to be unpainted over the
 * fold (MONO-MV-02 / G-E2), and the pointer-events re-enabler handed those
 * pixels to a button no one can see. `elementFromPoint` at the centre of
 * "Download CV" answered `span.minivic-launcher__pill`.
 *
 * So the assertion is now keyed on paint, not on width: wherever the dock is
 * painted on the first fold the launcher owns its pixels and a real click opens
 * the dialog (1440, unchanged — 834px and up is untouched); where it is not, it
 * is inert, the hero's CTA receives the tap
 * (`minivic-first-fold-cv-tap.spec.ts` TC-MV-CVTAP-01), and the launcher takes
 * the pointer back the moment it paints — which is asserted here too, at 390,
 * past the hero. The pill is still never hidden at any width (G-MV1).
 */
const VIEWPORTS = [
  { label: '1440', width: 1440, height: 900, paintedOnFirstFold: true },
  { label: '390', width: 390, height: 844, paintedOnFirstFold: false },
] as const;

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  // A click that lands before React attaches its handlers is a click that does
  // nothing, so wait for the launcher's fiber rather than for a timeout.
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
}

test.describe('G-MV1 / REGRESSION rev-ec53e2b4: the first-fold launcher is a real control', () => {
  test.describe.configure({ timeout: 90000 });

  for (const vp of VIEWPORTS) {
    test(`TC-MV-CLICK-01 @ ${vp.label}: a real click where the dock paints opens the panel`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoHome(page);

      // The whole point is the first fold: nothing here may scroll.
      expect(await page.evaluate(() => window.scrollY), 'the test must not scroll').toBe(0);

      const label = page.locator('[data-testid="minivic-launcher-label"]');
      await expect(label, 'the launcher label must be in the document at every width').toBeAttached();

      const pill = await label.evaluate((el) => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          display: style.display,
          visibility: style.visibility,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        };
      });

      // G-MV1: never hidden, at any width.
      expect(pill.display, 'the pill must never be display:none (G-MV1)').not.toBe('none');
      expect(pill.visibility, 'the pill must never be visibility:hidden (G-MV1)').toBe('visible');
      expect(pill.rect.width, 'the pill must occupy real width').toBeGreaterThan(40);
      expect(pill.rect.height, 'the pill must occupy real height').toBeGreaterThan(10);

      const cx = pill.rect.x + pill.rect.width / 2;
      const cy = pill.rect.y + pill.rect.height / 2;
      expect(cy, 'the pill must sit inside the first fold').toBeLessThan(vp.height);
      expect(cx, 'the pill must sit inside the viewport').toBeLessThan(vp.width);

      // Where the dock does not paint on the first fold, the launcher must not
      // take the pointer there (ADV rev7 F-1) — it takes it back once painted,
      // which is what the rest of this test then asserts, past the hero.
      if (!vp.paintedOnFirstFold) {
        const inert = await page.evaluate(
          ([x, y]) => {
            const el = document.elementFromPoint(x as number, y as number);
            const toggle = document.querySelector('[data-testid="minivic-toggle"]');
            const dock = document.querySelector('.minivic-dock');
            return {
              tag: el ? el.tagName.toLowerCase() : null,
              cls: el ? String((el as HTMLElement).className ?? '') : null,
              inLauncher: !!(el && toggle && (el === toggle || toggle.contains(el))),
              dockOpacity: dock ? Number(getComputedStyle(dock).opacity) : -1,
            };
          },
          [cx, cy],
        );
        expect(
          inert.dockOpacity,
          'the premise at this width is an unpainted dock over the fold (MONO-MV-02)',
        ).toBeLessThan(0.05);
        expect(
          inert.inLauncher,
          `the unpainted launcher must not own the pixels it does not paint — ` +
            `elementFromPoint(${cx.toFixed(1)}, ${cy.toFixed(1)}) resolved to ` +
            `<${inert.tag} class="${inert.cls}">`,
        ).toBe(false);

        // Past the hero the dock paints, and everything below is asserted there.
        await page.evaluate(() => {
          const hero = document.querySelector('#hero');
          window.scrollTo(0, hero ? hero.getBoundingClientRect().height + 1 : window.innerHeight + 1);
        });
        await expect
          .poll(
            () => page.evaluate(() => {
              const dock = document.querySelector('.minivic-dock');
              return dock ? Number(getComputedStyle(dock).opacity) : -1;
            }),
            { timeout: 15000, message: 'the dock must paint once the reader is past the hero' },
          )
          .toBeGreaterThan(0.95);
      }

      const painted = await label.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      });
      const px = painted.x + painted.width / 2;
      const py = painted.y + painted.height / 2;

      // 1. The control owns the pixels it paints.
      const hit = await page.evaluate(
        ([x, y]) => {
          const el = document.elementFromPoint(x as number, y as number);
          const toggle = document.querySelector('[data-testid="minivic-toggle"]');
          return {
            found: !!el,
            tag: el ? el.tagName.toLowerCase() : null,
            cls: el ? String((el as HTMLElement).className ?? '') : null,
            testid: el ? el.getAttribute('data-testid') : null,
            inLauncher: !!(el && toggle && (el === toggle || toggle.contains(el))),
          };
        },
        [px, py],
      );

      expect(
        hit.inLauncher,
        `elementFromPoint(${px.toFixed(1)}, ${py.toFixed(1)}) resolved to ` +
          `<${hit.tag} class="${hit.cls}" data-testid="${hit.testid}"> — the launcher does not ` +
          'receive the pointer over the pixels it paints',
      ).toBe(true);

      // 2. A real, hit-tested click opens the dialog.
      const panel = page.locator('[data-testid="minivic-panel"]');
      await expect(panel).toHaveCount(0);
      const scrollBefore = await page.evaluate(() => window.scrollY);
      await page.mouse.click(px, py);
      await expect(
        panel,
        'a real click at the launcher’s centre must open the panel where the dock is painted',
      ).toBeVisible({ timeout: 15000 });

      expect(await page.evaluate(() => window.scrollY), 'opening must not scroll the page').toBe(
        scrollBefore,
      );
    });
  }
});
