import { test, expect, type Page } from '@playwright/test';

/**
 * WAVE 5 — Content surfaces: Dossier (#10), ProofBar (#11), ExpandableCard (#14).
 * Studio-grade, restrained, monochrome motion that MUST flatten under
 * prefers-reduced-motion and stay readable.
 *
 *   #10 Dossier       — glassmorphism surface, staggered (clip) section reveal,
 *                       magnetic download + clone CTAs with cursor labels.
 *   #11 ProofBar      — spring count-up, clip-stagger entry, tabular monospace
 *                       digits; reduced motion renders finals instantly.
 *   #14 ExpandableCard— data-open state reflection, spring height, staggered
 *                       content reveal on expand, glassmorphism surface.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
}

/** True when the element's computed backdrop-filter (or -webkit-) blurs. */
async function hasBackdropBlur(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) return false;
    const cs = getComputedStyle(el);
    const bf = `${cs.backdropFilter} ${(cs as unknown as Record<string, string>).webkitBackdropFilter ?? ''}`;
    return /blur\(/.test(bf);
  }, selector);
}

// ── #11 ProofBar ────────────────────────────────────────────────────────────────
test.describe('WAVE5 #11 — ProofBar spring count-up + clip-stagger + mono digits', () => {
  test.describe.configure({ timeout: 90000 });

  test('proof grid enters via a clip-variant staggered reveal that resolves visible', async ({ page }) => {
    await gotoHome(page);
    const group = page.locator('#proof [data-reveal-stagger]').first();
    await expect(group, 'proof metrics must enter as a staggered Reveal group').toBeAttached();
    await expect(group).toHaveAttribute('data-reveal-variant', 'clip');

    await page.evaluate(() => document.getElementById('proof')?.scrollIntoView({ block: 'center' }));
    const children = group.locator(':scope > *');
    expect(await children.count(), 'stagger group must carry ≥2 metric children').toBeGreaterThanOrEqual(2);
    await expect
      .poll(
        async () =>
          children.evaluateAll((els) =>
            els.every((el) => Number(getComputedStyle(el as HTMLElement).opacity) > 0.9),
          ),
        { timeout: 9000 },
      )
      .toBe(true);
  });

  test('proof values use tabular-nums monospace digits and reach resume finals', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('proof')?.scrollIntoView({ block: 'center' }));

    const value = page.locator('#proof .proof-value').first();
    const { variant, family } = await value.evaluate((el) => {
      const cs = getComputedStyle(el as HTMLElement);
      return { variant: cs.fontVariantNumeric, family: cs.fontFamily };
    });
    expect(variant, 'digits must be tabular').toContain('tabular-nums');
    expect(family.toLowerCase(), 'digits must render in a monospace family').toContain('monospace');

    // The spring counter settles on the resume-accurate finals.
    await expect(page.locator('#proof .proof-value', { hasText: '92' })).toBeVisible({ timeout: 8000 });
    await expect(page.locator('#proof')).toContainText('15');
  });

  test('reduced motion: proof finals render immediately (no count-up from zero)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    await expect(page.locator('#proof .proof-value', { hasText: '92' })).toBeVisible({ timeout: 12000 });
  });
});

// ── #10 Dossier ─────────────────────────────────────────────────────────────────
test.describe('WAVE5 #10 — Dossier glassmorphism + magnetic CTAs + stagger', () => {
  test.describe.configure({ timeout: 90000 });

  test('dossier card is a glassmorphic surface with a staggered section reveal', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('dossier')?.scrollIntoView({ block: 'center' }));

    expect(await hasBackdropBlur(page, '.dossier-card'), 'dossier card must use a backdrop blur').toBe(true);

    const group = page.locator('#dossier [data-reveal-stagger]').first();
    await expect(group, 'dossier sections must enter as a staggered reveal').toBeAttached();
    const children = group.locator(':scope > *');
    expect(await children.count()).toBeGreaterThanOrEqual(2);
    await expect
      .poll(
        async () =>
          children.evaluateAll((els) =>
            els.every((el) => Number(getComputedStyle(el as HTMLElement).opacity) > 0.9),
          ),
        { timeout: 9000 },
      )
      .toBe(true);
  });

  test('download + clone CTAs are magnetic zones carrying cursor labels', async ({ page }) => {
    await gotoHome(page);
    const download = page.locator('#dossier [data-dossier-download]').first();
    const clone = page.locator('#dossier [data-dossier-clone]');

    await expect(download).toHaveAttribute('data-magnetic', '');
    await expect(clone).toHaveAttribute('data-magnetic', '');
    const dlLabel = await download.getAttribute('data-cursor-label');
    const cloneLabel = await clone.getAttribute('data-cursor-label');
    expect((dlLabel ?? '').trim().length, 'download CTA needs a cursor label').toBeGreaterThan(0);
    expect((cloneLabel ?? '').trim().length, 'clone CTA needs a cursor label').toBeGreaterThan(0);
  });
});

// ── #14 ExpandableCard ────────────────────────────────────────────────────────────
test.describe('WAVE5 #14 — ExpandableCard state + content stagger + glass', () => {
  test.describe.configure({ timeout: 90000 });

  test('card reflects open state via data-open and reveals a staggered content layer', async ({ page }) => {
    await gotoHome(page);
    const about = page.locator('#about');
    await about.scrollIntoViewIfNeeded();

    const card = about.locator('.snap-card').first();
    const header = card.locator('.snap-header');

    await expect(card).toHaveAttribute('data-open', 'false');
    await header.click();
    await expect(card).toHaveAttribute('data-open', 'true');

    // The expanded body carries a staggered content layer that resolves to visible.
    const content = card.locator('[data-expand-content]');
    await expect(content).toBeAttached();
    await expect
      .poll(async () => content.evaluate((el) => Number(getComputedStyle(el as HTMLElement).opacity)), {
        timeout: 6000,
      })
      .toBeGreaterThan(0.9);

    // Collapsing flips the state back and unmounts the body content.
    await header.click();
    await expect(card).toHaveAttribute('data-open', 'false');
    await expect(content).toHaveCount(0);
  });

  test('expandable card surface is glassmorphic (backdrop blur)', async ({ page }) => {
    await gotoHome(page);
    const about = page.locator('#about');
    await about.scrollIntoViewIfNeeded();
    expect(await hasBackdropBlur(page, '.snap-card'), 'snap-card must use a backdrop blur').toBe(true);
  });
});
