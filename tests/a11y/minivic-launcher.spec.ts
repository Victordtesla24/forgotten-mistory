import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * The MiniVic launcher, as a keyboard user and a screen reader meet it.
 *
 * Two findings from the v9 adversarial pass are closed here.
 *
 * ADV-F-3 (R-c8 item 12) was an instrument disagreement: the attack script's
 * `el.closest('[aria-hidden="true"]')` said the launcher sat inside a hidden
 * subtree, while axe reported no `aria-hidden-focus` violation. Both were
 * right about different moments — the dock carried `aria-hidden` until the
 * reader scrolled past the hero, so a focusable button really was inside an
 * `aria-hidden="true"` subtree at scroll top, which is a WCAG 4.1.2 failure
 * however briefly it lasts. The rule is absolute and stated as such: at no
 * scroll position, at either viewport, is there an `aria-hidden="true"`
 * between the launcher and `<html>`.
 *
 * ADV-F-2 (R-c8 item 13) was measured, not inferred: the launcher was the 93rd
 * of 100 tab stops. The chatbot is the channel the brief names for employers
 * and clients, and a keyboard user had to traverse the entire page to reach
 * it. The fix extends the bypass-block pattern that already exists rather than
 * reordering the DOM: a second skip control, off-canvas until focused, that
 * opens the panel and leaves focus on the launcher so the reader is oriented at
 * the control they just operated.
 */

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
}

/** {tag, class, aria-hidden} for every ancestor between the launcher and <html>. */
async function ancestorChain(page: Page) {
  return page.evaluate(() => {
    const el = document.querySelector('[data-testid="minivic-toggle"]');
    if (!el) return [{ tag: 'MISSING', cls: '', ariaHidden: 'launcher not found' }];
    const chain: { tag: string; cls: string; ariaHidden: string | null }[] = [];
    let node: Element | null = el.parentElement;
    while (node) {
      chain.push({
        tag: node.tagName,
        cls: String((node as HTMLElement).className ?? '').slice(0, 48),
        ariaHidden: node.getAttribute('aria-hidden'),
      });
      node = node.parentElement;
    }
    return chain;
  });
}

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];

test.describe('A11y: the MiniVic launcher', () => {
  test.describe.configure({ timeout: 120000 });

  for (const { width, height } of VIEWPORTS) {
    test(`TC-MV-ARIA-01 @ ${width}: no aria-hidden ancestor, and axe finds no aria-hidden-focus`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await gotoHome(page);

      // Scroll top — the position the dock used to hide itself from the
      // accessibility tree while leaving its button in the tab order.
      for (const y of [0, 1200, 4000]) {
        await page.evaluate((to) => window.scrollTo(0, to), y);
        await page.waitForTimeout(350);
        const chain = await ancestorChain(page);
        const hidden = chain.filter((a) => a.ariaHidden === 'true');
        expect(
          hidden,
          `at scrollY ${y} the launcher sits inside ${hidden.length} aria-hidden="true" ancestor(s): ` +
            JSON.stringify(hidden),
        ).toEqual([]);
      }

      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .withRules(['aria-hidden-focus', 'aria-hidden-body'])
        .analyze();
      expect(
        results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`),
        JSON.stringify(results.violations, null, 2),
      ).toEqual([]);
    });
  }

  test('TC-MV-LABEL-01: the accessible name starts with the visible label (WCAG 2.5.3)', async ({
    page,
  }) => {
    // V-c16 §4. The launcher shows the words "Ask Mini Vic" at every width —
    // phones included, from 390px up (G-MV1) — while its accessible name once
    // said "Open Mini Vic assistant": a speech-input user reading the pill
    // aloud addressed a control that does not answer to it. axe cannot see
    // this — `label-content-name-mismatch` is an experimental rule and is not
    // in the wcag2a/2aa/21a/21aa tag set this suite runs — so the rule is
    // stated here directly, in both panel states.
    //
    // The label used to be painted only from 52.125rem (834px) up, which left
    // the phone with a bare, unlabelled disc. The pill is now
    // display:inline-block at every breakpoint and must never be display:none;
    // that freeze is asserted first, at 390 and 1440, before the name-in-label
    // rule that depends on the label actually being on screen.
    const readPill = () =>
      page.evaluate(() => {
        const el = document.querySelector('[data-testid="minivic-toggle"]');
        const pill = el?.querySelector('.minivic-launcher__pill') ?? null;
        if (!pill) return { display: 'missing', text: '' };
        return {
          display: getComputedStyle(pill).display,
          text: (pill.textContent || '').replace(/\s+/g, ' ').trim(),
        };
      });

    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await gotoHome(page);
      const pill = await readPill();
      expect(
        pill.display,
        `the pill is display:${pill.display} at ${width} — G-MV1 freezes it as inline-block at every width, never none`,
      ).not.toBe('none');
      expect(pill.display, `the pill must be laid out at ${width}`).not.toBe('missing');
      expect(pill.text, `the launcher must carry the visible label at ${width}`).toBe('Ask Mini Vic');
    }

    // The name-in-label rule is read at 1440 (both panel states); the page is
    // already loaded at 1440, closed, from the freeze loop above.
    const toggle = page.locator('[data-testid="minivic-toggle"]');
    const visibleLabel = (await readPill()).text;
    expect(visibleLabel, 'the launcher must carry a visible label at 1440').not.toBe('');

    for (const state of ['closed', 'open'] as const) {
      if (state === 'open') {
        await toggle.evaluate((el: HTMLElement) => el.click());
        await expect(page.locator('[data-testid="minivic-panel"]')).toBeVisible();
      }
      const name = (await toggle.getAttribute('aria-label')) ?? '';
      expect(
        name.toLowerCase().startsWith(visibleLabel.toLowerCase()),
        `${state}: accessible name "${name}" must start with the visible label "${visibleLabel}"`,
      ).toBe(true);
      expect(name).toMatch(/ask mini vic/i);
      await expect(toggle).toHaveAttribute('aria-expanded', state === 'open' ? 'true' : 'false');
    }
  });

  for (const { width, height } of VIEWPORTS) {
    test(`TC-MV-MARK-01 @ ${width}: the resting launcher paints a mark, and no video is source-less`, async ({
      page,
    }) => {
      // R-c13 CC-03a: the launcher was "a ring around emptiness" — `innerText`
      // empty, 0 svg, 0 img, and one `<video>` with no src, no <source> and no
      // poster (`readyState: 0`). A control that paints nothing advertises
      // nothing, and a source-less <video> is not a fallback, it is a hole.
      // The resting state has to be drawn by the document itself: a mark that
      // is there before any network request resolves, at every width.
      await page.setViewportSize({ width, height });
      await gotoHome(page);
      await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2));
      await page.waitForTimeout(400);

      const state = await page.evaluate(() => {
        const el = document.querySelector('[data-testid="minivic-toggle"]') as HTMLElement;
        const marks = Array.from(el.querySelectorAll('svg')).map((s) => {
          const r = s.getBoundingClientRect();
          const cs = getComputedStyle(s);
          return {
            w: Math.round(r.width),
            h: Math.round(r.height),
            visible: (s as SVGElement).checkVisibility?.() ?? true,
            color: cs.color,
            opacity: Number(cs.opacity),
          };
        });
        return {
          marks,
          text: (el.innerText || '').replace(/\s+/g, ' ').trim(),
          videos: Array.from(el.querySelectorAll('video')).map((v) => ({
            currentSrc: v.currentSrc,
            src: v.getAttribute('src') ?? '',
            poster: v.getAttribute('poster') ?? '',
            sources: v.querySelectorAll('source').length,
          })),
        };
      });

      const painted = state.marks.filter((m) => m.visible && m.w >= 20 && m.h >= 20 && m.opacity > 0);
      expect(
        painted.length,
        `the launcher must paint at least one mark of its own at ${width}: svgs=${JSON.stringify(
          state.marks,
        )}, innerText="${state.text}"`,
      ).toBeGreaterThan(0);
      // The mark is the site's one non-negotiable ink, not a tinted glyph.
      for (const mark of painted) {
        const rgb = mark.color.match(/\d+/g)!.map(Number);
        expect(
          rgb[0] === rgb[1] && rgb[1] === rgb[2],
          `the mark is painted ${mark.color}, which is not achromatic`,
        ).toBe(true);
      }

      const sourceless = state.videos.filter(
        (v) => !v.currentSrc && !v.src && !v.sources && !v.poster,
      );
      expect(
        sourceless,
        `every <video> in the launcher needs a resolved source or a poster: ${JSON.stringify(state.videos)}`,
      ).toEqual([]);
    });
  }

  test('TC-MV-SKIP-01: the launcher is reachable in three tab stops and opens from the keyboard', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHome(page);

    // Start from the very top of the document order, as a reader arriving on
    // the page does.
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      (document.activeElement as HTMLElement | null)?.blur();
    });

    const names: string[] = [];
    let found = -1;
    for (let stop = 1; stop <= 3; stop += 1) {
      await page.keyboard.press('Tab');
      const name = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return '';
        return (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim();
      });
      names.push(`${stop}: "${name}"`);
      if (name === 'Ask Mini Vic') {
        found = stop;
        break;
      }
    }
    expect(found, `first three tab stops were ${names.join(', ')}`).toBeGreaterThan(0);

    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="minivic-panel"]')).toBeVisible();

    const landed = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.getAttribute('data-testid') ?? null,
    );
    expect(landed, 'Enter on the skip control must leave focus on the launcher').toBe(
      'minivic-toggle',
    );
  });
});
