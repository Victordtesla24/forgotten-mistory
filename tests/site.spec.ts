import { test, expect, type Page } from '@playwright/test';

const OUTCOME_LABELS = [
  'Test Automation at Scale',
  'Cloud Modernisation',
  'Realtime Reliability',
  'AI Quality & Risk',
  'Leadership Scale',
  'Portfolio Value',
];

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const preloader = page.locator('.preloader');
  if (await preloader.count()) {
    await preloader.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
}

test.describe('Portfolio site — React/Framer Motion runtime', () => {
  test.describe.configure({ timeout: 90000 });

  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
  });

  test('hero renders identity, value statement, and CTAs', async ({ page }) => {
    await expect(page.locator('.logo')).toHaveText('VIKRAM.');
    await expect(page.locator('.hero-title')).toContainText('Vikram.');
    await expect(page.locator('.hero-subtitle')).toContainText('Australian Taxation Office');
    await expect(page.locator('.hero-links .btn-primary')).toHaveText("Let's Talk");
    await expect(page.locator('.hero-links a[href="/docs/Vik_Resume_Final.pdf"]')).toBeVisible();
  });

  test('navigation overlay opens, lists sections, and closes', async ({ page }) => {
    const toggle = page.locator('.menu-toggle');
    await expect(toggle).toHaveText('Menu');
    await toggle.click();

    const overlay = page.locator('.nav-overlay');
    await expect(overlay).toHaveClass(/open/);
    for (const label of ['Home', 'About', 'Experience', 'Skills', 'Architecture', 'Work', 'Resume', 'Contact']) {
      await expect(page.locator(`.nav-links a:has-text("${label}")`)).toBeVisible();
    }

    await page.keyboard.press('Escape');
    await expect(overlay).not.toHaveClass(/open/);
  });

  test('all six outcome cards render with current labels', async ({ page }) => {
    const cards = page.locator('[data-outcome-card="true"]');
    await expect(cards).toHaveCount(6);
    for (const label of OUTCOME_LABELS) {
      await expect(page.locator('.meta-label', { hasText: label })).toBeVisible();
    }
  });

  test('experience accordion lists the ATO role first and is expanded by default', async ({ page }) => {
    const firstItem = page.locator('.accordion-item').first();
    await expect(firstItem).toHaveClass(/active/);
    await expect(firstItem).toContainText('Australian Taxation Office');
    await expect(firstItem).toContainText('March 2026 - Present');
    await expect(firstItem).toContainText('Agile Kookaburras');

    // Toggle closed, then open another role.
    await firstItem.locator('.accordion-header').click();
    await expect(firstItem).not.toHaveClass(/active/);

    const anzItem = page.locator('.accordion-item', { hasText: 'ANZ Banking Group' });
    await anzItem.locator('.accordion-header').click();
    await expect(anzItem).toHaveClass(/active/);
    await expect(anzItem).toContainText('P95 latency under 200 ms');
  });

  test('experience content matches the standalone CV (parity check)', async ({ page }) => {
    const accordion = page.locator('.accordion-group');
    await expect(accordion).toContainText('Scrum Master / Project Manager');
    await expect(accordion).toContainText('200+ SIT/E2E scenarios');
    await expect(accordion).toContainText('≈92% reduction');
    await expect(accordion).toContainText('Jun 2025 - Feb 2026'); // Independent role end date
    await expect(accordion).toContainText('Sept 2017 - Jun 2025'); // ANZ
  });

  test('skills cards expand on demand', async ({ page }) => {
    const skillCard = page.locator('.skill-card', { hasText: 'Program Delivery & Management' });
    await skillCard.locator('.skill-header').click();
    await expect(skillCard).toHaveClass(/open/);
    await expect(skillCard).toContainText('Agile/Scrum/SAFe & PI Planning');
  });

  test('architecture map switches flows and updates metrics', async ({ page }) => {
    const telemetryButton = page.locator('.arch-btn', { hasText: 'Telemetry Stream' });
    await telemetryButton.scrollIntoViewIfNeeded();
    await telemetryButton.click();
    await expect(telemetryButton).toHaveClass(/active/);
    await expect(page.locator('.arch-explainer-title')).toHaveText('Telemetry Stream');
    await expect(page.locator('.arch-metric-value').nth(1)).toContainText('85k');

    const governanceButton = page.locator('.arch-btn', { hasText: 'Governance & Quality' });
    await governanceButton.click();
    await expect(page.locator('.arch-explainer-title')).toHaveText('Governance & Quality');
  });

  test('hidden terminal opens from the footer and answers commands', async ({ page }) => {
    await page.locator('.terminal-trigger').click();
    const overlay = page.locator('#terminal-overlay');
    await expect(overlay).toHaveClass(/open/);

    await page.locator('#terminal-input').fill('stack');
    await page.locator('#terminal-input').press('Enter');
    await expect(page.locator('#terminal-log')).toContainText('Framer Motion');

    await page.locator('#terminal-input').fill('sudo hire vic');
    await page.locator('#terminal-input').press('Enter');
    await expect(page.locator('#terminal-log')).toContainText('sarkar.vikram@gmail.com');

    await page.keyboard.press('Escape');
    await expect(overlay).not.toHaveClass(/open/);
  });

  test('github feed renders repositories or a graceful fallback', async ({ page }) => {
    const feed = page.locator('#github-projects');
    await feed.scrollIntoViewIfNeeded();
    await expect(feed.locator('.repo-card, .repo-status').first()).toBeVisible({ timeout: 20000 });
  });

  test('contact section exposes direct channels', async ({ page }) => {
    await expect(page.locator('a[href="mailto:sarkar.vikram@gmail.com"]')).toBeVisible();
    await expect(page.locator('a[href="tel:+61433224556"]')).toBeVisible();
  });

  test('legacy runtime is fully retired', async ({ page }) => {
    // No GSAP/Lenis globals, no edit-mode controls, no Font Awesome.
    const legacyGlobals = await page.evaluate(() => ({
      gsap: typeof (window as unknown as { gsap?: unknown }).gsap,
      lenis: typeof (window as unknown as { Lenis?: unknown }).Lenis,
    }));
    expect(legacyGlobals.gsap).toBe('undefined');
    expect(legacyGlobals.lenis).toBe('undefined');
    await expect(page.locator('.admin-controls')).toHaveCount(0);
    await expect(page.locator('link[href*="font-awesome"]')).toHaveCount(0);
  });
});
