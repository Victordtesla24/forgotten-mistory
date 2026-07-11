import { test, expect, type Page } from '@playwright/test';

/**
 * Overhaul — Cinematic-Monochrome Design Language (Increment 1)
 *
 * Verifies the cinematic primitives introduced by the ground-up UI/UX overhaul:
 *   - the hero volumetric stage (cursor-tracked spotlight + vignette light-planes),
 *   - the transparent→frosted-on-scroll navigation,
 *   - and that none of the new decorative planes regress interaction, the hero
 *     name-render contract (D-NAME-01), the monochrome palette, or reduced motion.
 *
 * These are the R1/R7 (posh, Disney+/Marvel-grade cinematic) acceptance tests.
 * Ref: docs/execution-log OVERHAUL-INC1.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  // Skip the boot wipe so runs are not gated on the ~1.9s preloader.
  await page
    .evaluate(() => {
      const skip = document.querySelector('button.preloader-skip') as HTMLButtonElement | null;
      skip?.click();
      document.querySelector('.preloader')?.remove();
    })
    .catch(() => {});
  await page.locator('#hero').first().waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(300);
}

test.describe('Overhaul: Cinematic-Monochrome Design Language', () => {
  test.describe.configure({ timeout: 90000 });

  test('TC-CINE-01: hero is a cinematic stage with spotlight + vignette light-planes', async ({ page }) => {
    await gotoHome(page);
    const hero = page.locator('#hero');
    await expect(hero).toHaveClass(/cine-stage/);

    const spotlight = page.locator('#hero .cine-spotlight');
    const vignette = page.locator('#hero .cine-vignette');
    await expect(spotlight).toHaveCount(1);
    await expect(vignette).toHaveCount(1);

    // Decorative only: hidden from assistive tech and never a pointer target.
    await expect(spotlight).toHaveAttribute('aria-hidden', 'true');
    await expect(vignette).toHaveAttribute('aria-hidden', 'true');
    for (const plane of [spotlight, vignette]) {
      const pe = await plane.evaluate((el) => getComputedStyle(el).pointerEvents);
      expect(pe).toBe('none');
    }
  });

  test('TC-CINE-02: light-planes never intercept clicks on hero CTAs', async ({ page }) => {
    await gotoHome(page);
    const pillar = page.locator('[data-pillar="employer"]');
    await expect(pillar).toBeVisible();
    // The element at the CTA's centre must be the CTA (or its child), not a plane.
    const hit = await pillar.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return top?.closest('[data-pillar="employer"]') ? 'pillar' : (top?.className ?? 'other');
    });
    expect(hit).toBe('pillar');
  });

  test('TC-CINE-03: nav is transparent at top and frosts (data-scrolled) after scroll', async ({ page }) => {
    await gotoHome(page);
    const nav = page.locator('nav').first();
    await expect(nav).not.toHaveAttribute('data-scrolled', 'true');

    await page.evaluate(() => window.scrollTo(0, 600));
    await expect(nav).toHaveAttribute('data-scrolled', 'true');

    const bg = await nav.evaluate((el) => getComputedStyle(el).backgroundColor);
    // Once scrolled a frosted near-black wash appears (no longer fully transparent).
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    expect(bg).not.toBe('transparent');
  });

  test('TC-CINE-04: :root publishes an achromatic --spot-x/--spot-y spotlight anchor', async ({ page }) => {
    await gotoHome(page);
    // The static default anchor exists even without pointer movement (touch/no-JS safe).
    const vars = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return { x: s.getPropertyValue('--spot-x').trim(), y: s.getPropertyValue('--spot-y').trim() };
    });
    expect(vars.x).not.toBe('');
    expect(vars.y).not.toBe('');
  });

  test('TC-CINE-05: cinematic title class adds no glyph-masking clip-path (D-NAME-01)', async ({ page }) => {
    await gotoHome(page);
    const name = page.locator('#hero .hero-title .reveal-text, #hero .hero-title .glitch-text').first();
    await expect(name).toHaveText('Vikram.');
    const clip = await name.evaluate((el) => {
      const line = (el as HTMLElement).closest('.line') ?? el;
      return getComputedStyle(line as Element).clipPath;
    });
    const c = (clip || 'none').toLowerCase();
    expect(c === 'none' || (c.includes('inset(0') && (c.includes('0%') || c.includes('0px')))).toBeTruthy();
  });

  test('TC-CINE-06: under reduced motion the spotlight is static (transition suppressed)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    const spotlight = page.locator('#hero .cine-spotlight');
    await expect(spotlight).toHaveCount(1);
    // The base god-ray eases its gradient over --motion-slow (520ms). Under reduced
    // motion that must collapse to ~0 — both via the .cine-spotlight override and the
    // site-wide `transition-duration: 0.01ms !important` reset — so the spotlight is
    // effectively static. Parse to ms so "0s" / "0.01ms" / "0.001ms" all count.
    const durMs = await spotlight.evaluate((el) => {
      const first = (getComputedStyle(el).transitionDuration.split(',')[0] || '').trim();
      if (first.endsWith('ms')) return parseFloat(first);
      if (first.endsWith('s')) return parseFloat(first) * 1000;
      return parseFloat(first) || 0;
    });
    expect(durMs).toBeLessThan(20);
  });

  test('TC-CINE-07: content sections use the .beat letterbox primitive and JS arms it', async ({ page }) => {
    await gotoHome(page);
    const beats = page.locator('section.beat');
    expect(await beats.count()).toBeGreaterThanOrEqual(5);
    // SectionBeats sets the progressive-enhancement flag on <html> once armed.
    await expect(page.locator('html')).toHaveAttribute('data-beats-armed', 'true');
  });

  test('TC-CINE-08: a beat section reveals (data-inview) when scrolled into view', async ({ page }) => {
    await gotoHome(page);
    const about = page.locator('#about');
    await about.scrollIntoViewIfNeeded();
    await expect(about).toHaveAttribute('data-inview', 'true');
    // Letterbox bars are decorative — content is never trapped behind them.
    await expect(about).toContainText('About Me');
  });

  test('TC-CINE-09: under reduced motion beat curtains render open (content visible)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    const about = page.locator('#about');
    await about.scrollIntoViewIfNeeded();
    await expect(about).toContainText('About Me');
    await expect(about).toBeVisible();
  });
});
