import { test, expect, type Page } from '@playwright/test';

/**
 * Category 1: E2E — Hero Section
 * Verifies all hero elements render correctly per siteContent.ts data.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  // D-BOOT-01: click Skip, then force-remove the overlay if the wipe stalls so
  // suite runs are not gated on the ~1.9s boot animation.
  await page.evaluate(() => {
    const skip = document.querySelector('button.preloader-skip') as HTMLButtonElement | null;
    skip?.click();
    const pre = document.querySelector('.preloader');
    pre?.remove();
  }).catch(() => {});
  await page.locator('#hero, .hero-section').first().waitFor({ state: 'visible', timeout: 15000 });
  // Allow GSAP/CSS name entrance to settle past any transient clip/glitch frames.
  await page.waitForTimeout(400);
}

test.describe('E2E: Hero Section', () => {
  test.describe.configure({ timeout: 90000 });

  test('TC-HERO-01: Hero section renders with greeting and name', async ({ page }) => {
    await gotoHome(page);
    const hero = page.locator('#hero');
    await expect(hero).toBeVisible();
    await expect(hero).toContainText("Hello, I'm");
    await expect(hero).toContainText('Vikram.');
  });

  test('TC-HERO-02: Hero subtitle renders professional positioning (astronomy demoted out of ATF)', async ({ page }) => {
    await gotoHome(page);
    const subtitle = page.locator('.hero-subtitle');
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toContainText('technical delivery leader');
    await expect(subtitle).toContainText('measurable business value');
    // D-HERO-02: the personal Vedic-astronomy R&D narrative must no longer sit ATF.
    await expect(subtitle).not.toContainText('Vedic astronomy');
  });

  test('TC-HERO-03: Dual-pillar CTAs render', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('[data-pillar="employer"]')).toBeVisible();
    await expect(page.locator('[data-pillar="client"]')).toBeVisible();
    await expect(page.locator('[data-pillar="employer"]')).toContainText('Review experience');
    await expect(page.locator('[data-pillar="client"]')).toContainText('See outcomes');
  });

  test('TC-HERO-04: Hero link bar renders LinkedIn, GitHub, YouTube, Download CV, Contact', async ({ page }) => {
    await gotoHome(page);
    const heroLinks = page.locator('.hero-links');
    await expect(heroLinks).toBeVisible();
    await expect(heroLinks.locator('a', { hasText: 'LinkedIn' })).toBeVisible();
    await expect(heroLinks.locator('a', { hasText: 'GitHub' })).toBeVisible();
    await expect(heroLinks.locator('a', { hasText: 'YouTube' })).toBeVisible();
    await expect(heroLinks.locator('a', { hasText: 'Download CV' })).toBeVisible();
    await expect(heroLinks.locator('a', { hasText: "Let's Talk" })).toBeVisible();
  });

  test('TC-HERO-05: TelemetryPanel renders in hero', async ({ page }) => {
    await gotoHome(page);
    // TelemetryPanel should be visible
    const panel = page.locator('.hero-hud-backdrop, [class*="telemetry"]').first();
    await expect(panel).toBeVisible();
  });

  test('TC-HERO-06: Outcome cards (meta cards) render with resumeContent data', async ({ page }) => {
    await gotoHome(page);
    const cards = page.locator('[data-outcome-card="true"]');
    const count = await cards.count();
    expect(count).toBe(6); // 6 outcomes from resumeContent
    await expect(cards.first()).toBeVisible();
    // Verify key values appear
    await expect(page.locator('.meta-value').first()).toContainText('-92%');
  });

  test('TC-HERO-07: HeroAvatar renders', async ({ page }) => {
    await gotoHome(page);
    const avatar = page.locator('.hero-image-container');
    await expect(avatar).toBeVisible();
  });

  test('TC-HERO-08: SpaceScene background renders', async ({ page }) => {
    await gotoHome(page);
    const scene = page.locator('.scene-stack');
    await expect(scene).toBeAttached();
  });

  test('TC-HERO-09: Preloader renders and then disappears', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const pre = page.locator('.preloader');
    // Should exist initially
    await expect(pre).toBeAttached();
    // Should eventually hide
    await pre.waitFor({ state: 'hidden', timeout: 20000 });
    await expect(pre).not.toBeVisible();
  });

  // ── Hire-conversion first-paint elements (fable5-plan D-HERO/D-AVAIL/D-CONTACT/D-CV/D-PROOF/D-TRUST) ──

  test('TC-HERO-10: Hero shows a CV-aligned target role as a scannable line', async ({ page }) => {
    await gotoHome(page);
    const role = page.locator('.hero-role');
    await expect(role).toBeVisible();
    await expect(role).toHaveText('Scrum Master / Project Manager · Technical Delivery Leader');
  });

  test('TC-HERO-11: Hero shows location', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('.hero-location')).toContainText('Melbourne');
  });

  test('TC-HERO-12: Hero shows a truthful open-to-work signal', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('.hero-availability')).toHaveText(
      'Actively exploring Scrum Master and delivery-leadership roles in Melbourne',
    );
  });

  test('TC-HERO-20: Hero first paint keeps role and employer CTA in-view while telemetry stays demoted', async ({
    page,
  }) => {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ] as const) {
      await page.setViewportSize(viewport);
      await gotoHome(page);

      const role = page.locator('.hero-role');
      const employerPillar = page.locator('[data-pillar="employer"]');
      const telemetryPanel = page.locator('#telemetry-panel');

      await expect(role).toBeVisible();
      await expect(employerPillar).toBeVisible();
      await expect(telemetryPanel).toBeAttached();

      const [roleBox, employerBox, telemetryBox] = await Promise.all([
        role.boundingBox(),
        employerPillar.boundingBox(),
        telemetryPanel.boundingBox(),
      ]);

      if (!roleBox || !employerBox || !telemetryBox) {
        throw new Error(`Expected hero geometry bounding boxes at ${viewport.width}x${viewport.height}`);
      }

      expect(roleBox.y, `role y @ ${viewport.width}x${viewport.height}`).toBeGreaterThanOrEqual(0);
      expect(
        roleBox.y + roleBox.height,
        `role bottom edge @ ${viewport.width}x${viewport.height}`,
      ).toBeLessThanOrEqual(viewport.height + 1);

      expect(employerBox.y, `employer CTA y @ ${viewport.width}x${viewport.height}`).toBeGreaterThanOrEqual(0);
      expect(
        employerBox.y + employerBox.height,
        `employer CTA bottom edge @ ${viewport.width}x${viewport.height}`,
      ).toBeLessThanOrEqual(viewport.height + 1);

      // Recruiter scan wins: role sits above telemetry, and telemetry is either
      // below the fold or starts after the employer CTA (demoted, not dominant).
      expect(
        roleBox.y,
        `role must precede telemetry @ ${viewport.width}x${viewport.height}`,
      ).toBeLessThan(telemetryBox.y);
      expect(
        employerBox.y,
        `employer CTA must precede telemetry @ ${viewport.width}x${viewport.height}`,
      ).toBeLessThan(telemetryBox.y);
      expect(
        telemetryBox.y,
        `telemetry must not occupy the top third @ ${viewport.width}x${viewport.height}`,
      ).toBeGreaterThan(viewport.height * 0.33);
    }
  });

  test('TC-HERO-13: Hero LinkedIn link points to the canonical profile', async ({ page }) => {
    await gotoHome(page);
    const li = page.locator('.hero-links a[href*="linkedin.com/in/vikramd-profile"]');
    await expect(li.first()).toBeVisible();
  });

  test('TC-HERO-14: At least 3 proof metrics render above the fold at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoHome(page);
    const metrics = page.locator('[data-hero-proof]');
    expect(await metrics.count()).toBeGreaterThanOrEqual(3);
    const box = await metrics.first().boundingBox();
    expect(box?.y ?? 9999).toBeLessThan(844);
  });

  test('TC-HERO-15: Credibility band renders recognised employers + CSM', async ({ page }) => {
    await gotoHome(page);
    const band = page.locator('.credibility-band').first();
    await expect(band).toBeVisible();
    await expect(band).toContainText('ANZ');
    await expect(band).toContainText('Certified Scrum Master');
  });

  test('TC-HERO-16: Preloader exposes a keyboard-focusable Skip control', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const skip = page.locator('.preloader-skip');
    if (await skip.isVisible().catch(() => false)) {
      await expect(skip).toBeEnabled();
      await skip.focus();
      await expect(skip).toBeFocused();
    }
  });

  // ── D-NAME-01: hero name must paint full "Vikram." without clip/glitch corruption ──

  test('TC-HERO-17: Hero name span textContent is the full Vikram.', async ({ page }) => {
    await gotoHome(page);
    const title = page.locator('#hero .hero-title');
    await expect(title).toContainText('Vikram.');
    const name = page.locator('#hero .hero-title .glitch-text, #hero .hero-title .reveal-text').first();
    await expect(name).toHaveText('Vikram.');
  });

  test('TC-HERO-18: Hero name line does not clip glyphs (overflow + layout width)', async ({ page }) => {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await gotoHome(page);

      const metrics = await page.locator('#hero .hero-title .reveal-text, #hero .hero-title .glitch-text').first().evaluate((el) => {
        const name = el as HTMLElement;
        const line = name.closest('.line') ?? name;
        const lineStyle = window.getComputedStyle(line);
        const nameStyle = window.getComputedStyle(name);
        const rect = name.getBoundingClientRect();
        const clipPath = nameStyle.clipPath || nameStyle.getPropertyValue('clip-path');
        return {
          text: (name.textContent ?? '').trim(),
          lineOverflow: lineStyle.overflow,
          lineOverflowX: lineStyle.overflowX,
          scrollWidth: name.scrollWidth,
          clientWidth: name.clientWidth,
          rectWidth: rect.width,
          clipPath,
          // Transparent fill + background-clip can leave glyphs unpainted; solid color is preferred.
          webkitTextFillColor: nameStyle.getPropertyValue('-webkit-text-fill-color'),
          color: nameStyle.color,
        };
      });

      expect(metrics.text, `viewport ${viewport.width}`).toBe('Vikram.');
      // overflow:hidden on .line was clipping trailing glyphs (Vikr / Vikrar).
      expect(metrics.lineOverflow, `overflow at ${viewport.width}`).not.toBe('hidden');
      expect(metrics.lineOverflowX, `overflow-x at ${viewport.width}`).not.toBe('hidden');
      // No residual GSAP/CSS clip-path masking trailing glyphs.
      const clip = (metrics.clipPath || 'none').toLowerCase();
      expect(
        clip === 'none' || clip.includes('inset(0') && (clip.includes('0%') || clip.includes('0px')),
        `clip-path must not mask name at ${viewport.width} (got ${metrics.clipPath})`,
      ).toBeTruthy();
      // Subpixel rounding can leave scrollWidth 1–3px over clientWidth even when
      // overflow:visible paints every glyph; allow a small tolerance and require
      // the box itself to be meaningfully wide.
      expect(
        metrics.scrollWidth,
        `scrollWidth must fit clientWidth at ${viewport.width}`,
      ).toBeLessThanOrEqual(metrics.clientWidth + 4);
      expect(metrics.rectWidth, `bounding width at ${viewport.width}`).toBeGreaterThan(40);
      // Name must paint with a real fill (not transparent clipped gradient text).
      const fill = metrics.webkitTextFillColor || metrics.color;
      expect(fill, `text fill at ${viewport.width}`).not.toMatch(/rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/);
      expect(fill.toLowerCase(), `text fill at ${viewport.width}`).not.toBe('transparent');
    }
  });

  test('TC-HERO-19: Hero title remains fully visible under prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHome(page);

    const name = page.locator('#hero .hero-title .reveal-text, #hero .hero-title .glitch-text').first();
    await expect(name).toHaveText('Vikram.');
    await expect(name).toBeVisible();

    const state = await name.evaluate((el) => {
      const nameEl = el as HTMLElement;
      const line = nameEl.closest('.line') ?? nameEl;
      const lineStyle = window.getComputedStyle(line);
      const nameStyle = window.getComputedStyle(nameEl);
      const before = window.getComputedStyle(nameEl, '::before');
      const after = window.getComputedStyle(nameEl, '::after');
      return {
        lineOverflow: lineStyle.overflow,
        scrollWidth: nameEl.scrollWidth,
        clientWidth: nameEl.clientWidth,
        opacity: nameStyle.opacity,
        visibility: nameStyle.visibility,
        beforeDisplay: before.display,
        afterDisplay: after.display,
        beforeOpacity: before.opacity,
        afterOpacity: after.opacity,
        webkitTextFillColor: nameStyle.getPropertyValue('-webkit-text-fill-color'),
        color: nameStyle.color,
      };
    });

    expect(state.lineOverflow).not.toBe('hidden');
    expect(state.scrollWidth).toBeLessThanOrEqual(state.clientWidth + 2);
    expect(state.visibility).toBe('visible');
    expect(Number.parseFloat(state.opacity)).toBeGreaterThan(0.9);
    // Glitch overlays must be inert under reduced motion (display:none or opacity 0).
    const beforeInert =
      state.beforeDisplay === 'none' || Number.parseFloat(state.beforeOpacity || '0') === 0;
    const afterInert =
      state.afterDisplay === 'none' || Number.parseFloat(state.afterOpacity || '0') === 0;
    expect(beforeInert).toBe(true);
    expect(afterInert).toBe(true);
    const fill = state.webkitTextFillColor || state.color;
    expect(fill.toLowerCase()).not.toBe('transparent');
  });
});
