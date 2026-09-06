import { test, expect, type Page } from '@playwright/test';

/**
 * TC-MV-CVTAP-01 — on the first fold at 390, the hero's own CTAs own their pixels.
 *
 * ADV rev7 F-1 (P0). At 390x844 the Mini Vic dock is deliberately *unpainted*
 * over the hero — `tests/monochrome/minivic-launcher.spec.ts` MONO-MV-02 requires
 * `opacity < 0.05` at scrollY 0, because at phone widths the hero portrait runs
 * full-bleed to the bottom of the fold and no bottom-anchored dock can clear it
 * (G-E2). But `.minivic-dock .minivic-launcher { pointer-events: auto }` handed
 * the *button* its pixels back, and at 390 the launcher's box
 * (`x208 y776 158x44`) lands on the hero's action row (`x213 y780 153x48`):
 *
 *     elementFromPoint(Download CV centre) → SPAN.minivic-launcher-label
 *     downloadReachable                    → false
 *
 * A reader who taps "Download CV" opened the chat panel instead — an invisible
 * control eating the fold's only conversion. This file asserts the visitor's
 * side of that: at 390, with the dock unpainted, every control in the hero's
 * action group receives a real, hit-tested tap at its own centre.
 *
 * It is the counterpart of `minivic-first-fold-click.spec.ts` TC-MV-CLICK-01,
 * which asserts the launcher takes the pointer wherever it *is* painted. The
 * two together are the whole contract: the dock is a control where it paints
 * and inert where it does not.
 */

const CV_HREF = '/docs/Vik_Resume_Final.pdf';

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  // A tap that lands before React attaches its handlers proves nothing, so wait
  // for the launcher's fiber rather than for a timeout.
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

test.describe('ADV rev7 F-1: the unpainted dock does not swallow the first fold', () => {
  test.describe.configure({ timeout: 90000 });

  test('TC-MV-CVTAP-01 @ 390: the hero actions receive the tap at their own centres', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoHome(page);

    expect(await page.evaluate(() => window.scrollY), 'the test must not scroll').toBe(0);

    // The premise: the dock is not painted here. If this ever stops being true
    // the rest of the test is measuring a different page, and MONO-MV-02 is the
    // contract that would have moved.
    const dockOpacity = await page.evaluate(() => {
      const dock = document.querySelector('.minivic-dock');
      return dock ? Number(getComputedStyle(dock).opacity) : -1;
    });
    expect(
      dockOpacity,
      'the premise of this test is an unpainted dock over the fold (MONO-MV-02)',
    ).toBeLessThan(0.05);

    const actions = await page.evaluate(() => {
      const group = document.querySelector('[data-testid="hero-actions"]');
      if (!group) return null;
      return Array.from(group.querySelectorAll('a')).map((a) => {
        const r = a.getBoundingClientRect();
        return {
          href: a.getAttribute('href') ?? '',
          label: (a.textContent ?? '').trim(),
          cx: r.left + r.width / 2,
          cy: r.top + r.height / 2,
          w: r.width,
          h: r.height,
        };
      });
    });

    expect(actions, 'the hero must render its action group').not.toBeNull();
    expect(actions!.length, 'the hero fold carries both actions').toBeGreaterThanOrEqual(2);

    const download = actions!.find((a) => a.href.endsWith(CV_HREF));
    expect(
      download,
      `the fold must carry the CV action (${CV_HREF}); found ${JSON.stringify(actions)}`,
    ).toBeTruthy();
    expect(download!.cy, 'the CV action must sit inside the first fold').toBeLessThan(844);

    // 1. Every action owns the pixels it paints — the hit test, not a computed
    //    style, because the launcher's own computed style always read "visible".
    for (const action of actions!) {
      const hit = await page.evaluate(
        ([x, y]) => {
          const el = document.elementFromPoint(x as number, y as number);
          const anchor = el ? (el as HTMLElement).closest('a') : null;
          return {
            tag: el ? el.tagName.toLowerCase() : null,
            cls: el ? String((el as HTMLElement).className ?? '') : null,
            href: anchor ? anchor.getAttribute('href') : null,
          };
        },
        [action.cx, action.cy],
      );
      expect(
        hit.href,
        `elementFromPoint(${action.cx.toFixed(1)}, ${action.cy.toFixed(1)}) — the centre of ` +
          `"${action.label}" — resolved to <${hit.tag} class="${hit.cls}">, not the action ` +
          'itself: something unpainted is intercepting the fold’s CTAs',
      ).toBe(action.href);
    }

    // 2. A real, hit-tested tap at the CV button's centre reaches that anchor
    //    and does not open the chat panel. The navigation is recorded and
    //    cancelled rather than followed, so the assertion is about which
    //    control received the gesture, which is exactly what F-1 got wrong.
    await page.evaluate(() => {
      (window as unknown as { __tapped: string | null }).__tapped = null;
      document.addEventListener(
        'click',
        (event) => {
          const anchor = (event.target as HTMLElement | null)?.closest('a');
          if (!anchor) return;
          (window as unknown as { __tapped: string | null }).__tapped =
            anchor.getAttribute('href');
          event.preventDefault();
        },
        true,
      );
    });

    const panel = page.locator('[data-testid="minivic-panel"]');
    await expect(panel).toHaveCount(0);
    await page.mouse.click(download!.cx, download!.cy);

    const tapped = await page.evaluate(
      () => (window as unknown as { __tapped: string | null }).__tapped,
    );
    expect(
      tapped,
      'a real tap at the centre of "Download CV" must reach the CV anchor',
    ).toBe(download!.href);
    expect(tapped, 'the CV action must still point at the CV').toContain(CV_HREF);

    await expect(
      panel,
      'a tap on the hero CTA must not open the Mini Vic panel',
    ).toHaveCount(0);
    expect(await page.evaluate(() => window.scrollY), 'the tap must not scroll the page').toBe(0);
  });
});
