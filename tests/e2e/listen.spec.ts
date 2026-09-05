import { test, expect } from '@playwright/test';

/**
 * Always willing to listen — the closing screen.
 *
 * Two invariants matter here and both are about restraint. The section must
 * stay nearly empty — it is the silence after five screens of instrumentation,
 * and that contrast is the thing a visitor is meant to leave holding. And there
 * must be no contact form: on a static export a form either lies about where
 * the message goes or hands the visitor to a third party, and neither is a good
 * last impression.
 */

const LISTEN = '#listen';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator(LISTEN).scrollIntoViewIfNeeded();
});

test.describe('Listen', () => {
  test('TC-LISTEN-01: the closing sentence is the only italic on the page', async ({ page }) => {
    const italics = await page.evaluate(() =>
      Array.from(document.querySelectorAll('main *'))
        .filter((el) => getComputedStyle(el).fontStyle === 'italic' && el.textContent?.trim())
        .map((el) => el.textContent!.trim().slice(0, 60)),
    );
    expect(italics).toHaveLength(1);
    expect(italics[0]).toContain('I have been wrong often enough');
  });

  test('TC-LISTEN-02: the closing copy stays under sixty-five words', async ({ page }) => {
    // Measured on the closing copy itself — the sentence, the four channels and
    // the coffee line. What this budget guards is the invitation, which is the
    // thing that has to stay short.
    const words = await page.evaluate(() => {
      const section = document.querySelector('#listen')!;
      const clone = section.cloneNode(true) as HTMLElement;
      clone.querySelector('figure')?.remove();
      clone.querySelector('section')?.remove();
      clone.lastElementChild?.remove();
      return clone.textContent!.trim().split(/\s+/).length;
    });
    // The emptiest screen on the site, immediately after the densest.
    expect(words).toBeLessThanOrEqual(65);
  });

  test('TC-LISTEN-03: no form, no input, no third-party embed', async ({ page }) => {
    await expect(page.locator('form')).toHaveCount(0);
    await expect(page.locator('input, textarea, select')).toHaveCount(0);
    await expect(page.locator('iframe')).toHaveCount(0);
  });

  test('TC-LISTEN-04: all four channels are real anchors matching the CV', async ({ page }) => {
    await expect(page.locator(`${LISTEN} a[href="mailto:sarkar.vikram@gmail.com"]`)).toBeVisible();
    await expect(page.locator(`${LISTEN} a[href="tel:+61433224556"]`)).toBeVisible();
    await expect(
      page.locator(`${LISTEN} a[href="https://www.linkedin.com/in/vikramd-profile"]`),
    ).toBeVisible();
    await expect(
      page.locator(`${LISTEN} a[href="https://github.com/Victordtesla24"]`),
    ).toBeVisible();
  });

  test('TC-LISTEN-05: hover and focus produce the identical underline', async ({ page }) => {
    const link = page.locator(`${LISTEN} a`).first();
    const scaleOf = () =>
      link.evaluate((el) => {
        const style = getComputedStyle(el, '::after');
        return style.transform;
      });

    await link.hover();
    await page.waitForTimeout(200);
    const hovered = await scaleOf();

    await page.mouse.move(0, 0);
    await link.focus();
    await page.waitForTimeout(200);
    const focused = await scaleOf();

    expect(focused).toBe(hovered);
    expect(hovered).not.toContain('0, 0, 0, 0');
  });

  /**
   * The section's one beat: the caliper closes (design council R-c1).
   *
   * The instrument that graded every figure above is set down here, still
   * honest, with nothing to measure. Its jaws open at full width on entry and
   * close over the long cinematic beat to the width of the sentence's first
   * word; the reading between them stays '—' because the section makes no
   * claim. Then the hairline draws as the last stroke. Silent, once, and never
   * gold.
   */
  test('TC-LISTEN-06: the caliper closes once, on entry, over the long cinematic beat', async ({ page }) => {
    const section = page.locator(LISTEN);
    const caliper = page.locator(`${LISTEN} svg[data-caliper]`);
    await expect(caliper).toHaveCount(1);
    await expect(caliper).toHaveAttribute('aria-hidden', 'true');

    // Entry arms the beat. beforeEach scrolled the section into view, so the
    // observer has a frame to fire; the wait is bounded well under the beat.
    await expect(section).toHaveAttribute('data-closed', '', { timeout: 1500 });

    const jaw = caliper.locator('[data-jaw="left"]');
    await expect(jaw).toHaveCount(1);
    const timing = await jaw.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { duration: cs.animationDuration, easing: cs.animationTimingFunction };
    });
    expect(timing.duration).toBe('1.16s');
    expect(timing.easing).toBe('cubic-bezier(0.16, 1, 0.3, 1)');

    // The hairline is the last stroke: it waits for the caliper's full beat.
    const ruleDelay = await section
      .locator('span[aria-hidden="true"]')
      .first()
      .evaluate((el) => getComputedStyle(el).animationDelay);
    expect(ruleDelay).toBe('1.16s');

    // After the beat the section still carries the attribute and the jaws
    // have settled on the closed geometry the section measured for itself.
    await page.waitForTimeout(1500);
    await expect(section).toHaveAttribute('data-closed', '');
    const settled = await caliper.evaluate((svg) => {
      const half = parseFloat(getComputedStyle(svg).getPropertyValue('--caliper-half'));
      const tx = (sel: string) => {
        const m = getComputedStyle(svg.querySelector(sel)!).transform.match(/matrix\(([^)]+)\)/);
        return m ? parseFloat(m[1].split(',')[4]) : NaN;
      };
      return { half, left: tx('[data-jaw="left"]'), right: tx('[data-jaw="right"]') };
    });
    expect(settled.half).toBeGreaterThan(0);
    expect(Math.abs(settled.left + settled.half)).toBeLessThan(0.5);
    expect(Math.abs(settled.right - settled.half)).toBeLessThan(0.5);

    // The reading is '—', in the mono face, and stays '—'.
    await expect(caliper.locator('text')).toHaveText('—');
  });

  test('TC-LISTEN-07: under reduced motion the caliper is drawn closed and nothing moves', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator(LISTEN).scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    const caliper = page.locator(`${LISTEN} svg[data-caliper]`);
    await expect(caliper).toHaveCount(1);

    const state = await caliper.evaluate((svg) => {
      const half = parseFloat(getComputedStyle(svg).getPropertyValue('--caliper-half'));
      const read = (sel: string) => {
        const cs = getComputedStyle(svg.querySelector(sel)!);
        const m = cs.transform.match(/matrix\(([^)]+)\)/);
        return { duration: cs.animationDuration, name: cs.animationName, tx: m ? parseFloat(m[1].split(',')[4]) : NaN };
      };
      return { half, left: read('[data-jaw="left"]'), right: read('[data-jaw="right"]') };
    });
    expect(state.left.duration).toBe('0s');
    expect(state.right.duration).toBe('0s');
    expect(state.left.name).toBe('none');
    expect(state.half).toBeGreaterThan(0);
    // Same final state as the motion path: jaws on the closed geometry.
    expect(Math.abs(state.left.tx + state.half)).toBeLessThan(0.5);
    expect(Math.abs(state.right.tx - state.half)).toBeLessThan(0.5);

    // The rule is drawn, not animated.
    const rule = await page
      .locator(`${LISTEN} span[aria-hidden="true"]`)
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return { name: cs.animationName, transform: cs.transform };
      });
    expect(rule.name).toBe('none');
    expect(rule.transform).toBe('none');
  });

  test('TC-LISTEN-08: nothing in the closing section is gold', async ({ page }) => {
    // Gold means "this figure has a source". The closing section makes no
    // claim, so every colour it renders — text, background, and the caliper's
    // strokes — must be achromatic: channel spread of eight or less.
    const offenders = await page.evaluate(() => {
      const props = ['color', 'backgroundColor', 'stroke', 'fill', 'borderTopColor', 'borderBottomColor'] as const;
      const root = document.querySelector('#listen')!;
      const hits: string[] = [];
      for (const el of [root, ...Array.from(root.querySelectorAll('*'))]) {
        const cs = getComputedStyle(el);
        for (const p of props) {
          const raw = cs[p] as string;
          const m = raw?.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?/);
          if (!m) continue;
          if (m[4] !== undefined && Number(m[4]) === 0) continue;
          const rgb = [Number(m[1]), Number(m[2]), Number(m[3])];
          if (Math.max(...rgb) - Math.min(...rgb) > 8) {
            hits.push(`${el.tagName.toLowerCase()} ${p}=${raw}`);
          }
        }
      }
      return Array.from(new Set(hits));
    });
    expect(offenders).toEqual([]);
  });

});
