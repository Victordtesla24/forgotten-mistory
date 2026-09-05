import { test, expect } from '@playwright/test';

import { greetingEnvelope } from '../../app/data/generated/greeting-envelope';

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
    // Pinned to a channel rather than to the section's first anchor: the
    // engagement plate now leads the routes and carries no underline, so
    // `a:first` would have quietly stopped testing the gesture it names.
    const link = page.locator(`${LISTEN} a[href^="tel:"]`).first();
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

    // The reading is the greeting's measured length, in the mono face, read
    // from the generated envelope (LISTEN-FLAGSHIP.md §2 C5) — no longer '—'.
    await expect(caliper.locator('text')).toHaveText(
      `${greetingEnvelope.durationSeconds.toFixed(2)} s`,
    );
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

  test('TC-LISTEN-08: exactly the two record marks are gold and nothing else', async ({ page }) => {
    // AMENDED — t_l1_04, G-L1 clause C3. This assertion used to read "nothing in
    // #listen is gold" (toEqual([]) over every chromatic colour). It was
    // inverted because the site's one semantic colour had never appeared in its
    // closing frame, so the grammar the whole page teaches — gold means "this
    // figure has a source you can OPEN and CHECK" (SIGNATURE-SCENES-v1,
    // LISTEN-FLAGSHIP.md §2 C3) — was absent exactly where it lands last. Of the
    // four channels precisely two are checkable records: linkedin.com/in/
    // vikramd-profile and github.com/Victordtesla24, the kind === 'external'
    // ones. The email and phone are addresses — there is nothing at mailto:/tel:
    // to verify — so they stay achromatic. The rule is now: the two external
    // arrival marks are gold, they are derived from channel.kind (never an index
    // literal), and nothing else in the section is chromatic. Gold stays in the
    // DOM; the shader stays gold-free (TC-SCENE-LISTEN-06). Reversal cost: one
    // commit returns this to the achromatic sweep asserting toHaveCount(0).
    const probe = await page.evaluate(() => {
      const props = ['color', 'backgroundColor', 'stroke', 'fill', 'borderTopColor', 'borderBottomColor'] as const;
      const root = document.querySelector('#listen')!;
      const stray: string[] = [];
      const goldMarks = new Set<Element>();
      for (const el of [root, ...Array.from(root.querySelectorAll('*'))]) {
        const cs = getComputedStyle(el);
        let chromatic = false;
        for (const p of props) {
          const raw = cs[p] as string;
          const m = raw?.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?/);
          if (!m) continue;
          if (m[4] !== undefined && Number(m[4]) === 0) continue;
          const rgb = [Number(m[1]), Number(m[2]), Number(m[3])];
          if (Math.max(...rgb) - Math.min(...rgb) > 8) chromatic = true;
        }
        if (!chromatic) continue;
        // Every chromatic stroke must belong to a record arrival — the
        // kind === 'external' marks and only those.
        const mark = el.closest('[data-arrival]');
        if (mark && mark.getAttribute('data-arrival') === 'external') {
          goldMarks.add(mark);
        } else {
          stray.push(`${el.tagName.toLowerCase()} chromatic outside an external arrival mark`);
        }
      }
      return {
        stray: Array.from(new Set(stray)),
        goldMarkCount: goldMarks.size,
        externalCount: root.querySelectorAll('[data-arrival="external"]').length,
        arrivalCount: root.querySelectorAll('[data-arrival]').length,
      };
    });
    // Nothing chromatic anywhere except the record arrivals.
    expect(probe.stray).toEqual([]);
    // There are four arrivals — one per channel — and exactly two are the
    // checkable records, so the email and phone marks cannot have leaked gold.
    expect(probe.arrivalCount).toBe(4);
    expect(probe.externalCount).toBe(2);
    // And precisely those two record marks carry the gold ink.
    expect(probe.goldMarkCount).toBe(2);
  });

  /**
   * The weight of the business end (R-c13 CC-05, R-c8 C-09).
   *
   * The four routes were 14 px of --mist-400 under a 54 px pull-quote: a 3.9×
   * ratio pointing away from the one thing on the page a visitor is meant to
   * act on. The mono stays — it is the right face for an address — the
   * greyness does not, and the quote comes down the scale until the two are
   * within reading distance of each other.
   */
  test('TC-LISTEN-09: the contact routes are read-weight type, not caption grey', async ({ page }) => {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.locator(LISTEN).scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);

      const probe = await page.evaluate(() => {
        const section = document.querySelector('#listen')!;
        const channels = Array.from(section.querySelectorAll<HTMLElement>('a[class*="channel"]'));
        const quote = section.querySelector<HTMLElement>('p[class*="sentence"]');
        return {
          channels: channels.map((el) => {
            const cs = getComputedStyle(el);
            return {
              text: (el.textContent || '').trim().slice(0, 32),
              fontSize: parseFloat(cs.fontSize),
              color: cs.color,
              family: cs.fontFamily,
              height: el.getBoundingClientRect().height,
            };
          }),
          quoteSize: quote ? parseFloat(getComputedStyle(quote).fontSize) : 0,
        };
      });

      expect(probe.channels.length, `${viewport.width}: no .channel anchors`).toBeGreaterThanOrEqual(3);
      for (const channel of probe.channels) {
        expect(channel.fontSize, `${viewport.width} "${channel.text}" font-size`).toBeGreaterThanOrEqual(16);
        expect(channel.color, `${viewport.width} "${channel.text}" colour`).toBe('rgb(246, 246, 246)');
        expect(channel.height, `${viewport.width} "${channel.text}" hit box`).toBeGreaterThanOrEqual(44);
        expect(channel.family.toLowerCase(), `${viewport.width} "${channel.text}" face`).toContain('mono');
      }

      expect(probe.quoteSize, `${viewport.width}: no pull-quote found`).toBeGreaterThan(0);
      const ratio = probe.quoteSize / probe.channels[0].fontSize;
      expect(ratio, `${viewport.width}: quote ${probe.quoteSize}px vs channel ${probe.channels[0].fontSize}px`).toBeLessThanOrEqual(1.6);
    }
  });

  /**
   * The routes hold the column (R-c8 C-09).
   *
   * The four contact lines used to stack in a single narrow file with the whole
   * right half of a 1440 frame empty. They are laid across the page's own
   * column now, and the email — the route a client will actually take — is a
   * filled plate rather than another grey line.
   */
  test('TC-LISTEN-10: the routes span the column and the email is a filled plate', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.locator(LISTEN).scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    const probe = await page.evaluate(() => {
      const section = document.querySelector('#listen')!;
      const list = section.querySelector<HTMLElement>('ul[class*="channels"]')!;
      const items = Array.from(list.querySelectorAll<HTMLElement>('li > a'));
      const email = section.querySelector<HTMLElement>('a[href^="mailto:"]')!;
      const cs = getComputedStyle(email);
      const listCs = getComputedStyle(list);
      return {
        rightEdge: Math.max(...items.map((el) => el.getBoundingClientRect().right)),
        innerWidth: window.innerWidth,
        email: {
          background: cs.backgroundColor,
          color: cs.color,
          padding: `${cs.paddingTop} ${cs.paddingRight}`,
          radius: cs.borderTopLeftRadius,
        },
        list: {
          display: listCs.display,
          columns: listCs.gridTemplateColumns.split(/\s+/).length,
          gap: listCs.columnGap,
        },
      };
    });

    expect(probe.rightEdge, `rightmost route ends at ${probe.rightEdge} of ${probe.innerWidth}`).toBeGreaterThan(
      0.7 * probe.innerWidth,
    );
    // The filled pill: --white on --ink-900 text, --space-2/--space-4, fully round.
    expect(probe.email.background).toBe('rgb(246, 246, 246)');
    expect(probe.email.color).toBe('rgb(10, 10, 10)');
    expect(probe.email.padding).toBe('16px 32px');
    expect(parseFloat(probe.email.radius)).toBeGreaterThanOrEqual(999);
    // repeat(auto-fit, minmax(16rem, 1fr)) at 1440 resolves to four tracks.
    expect(probe.list.display).toBe('grid');
    expect(probe.list.columns).toBeGreaterThanOrEqual(2);
    expect(probe.list.gap).toBe('32px');
  });

  /**
   * The page closes the way it opens (R-c13 CC-09).
   *
   * #listen ran 126 px of air on top and 45 px underneath, so the last section
   * stopped rather than closed. Its block padding is the same clamp the four
   * middle sections use.
   */
  test('TC-LISTEN-11: the closing section is vertically symmetric at every width', async ({ page }) => {
    for (const width of [390, 834, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.locator(LISTEN).scrollIntoViewIfNeeded();
      const pad = await page.evaluate(() => {
        const cs = getComputedStyle(document.querySelector('#listen')!);
        return { top: parseFloat(cs.paddingTop), bottom: parseFloat(cs.paddingBottom) };
      });
      expect(
        Math.abs(pad.top - pad.bottom),
        `${width}: #listen padding ${pad.top} / ${pad.bottom}`,
      ).toBeLessThanOrEqual(2);
    }
  });
});
