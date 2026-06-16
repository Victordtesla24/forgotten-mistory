import { test, expect, type Page } from '@playwright/test';

/**
 * TC-FR-MINIVIC — Tests for MiniVicBot to ensure no prompt scaffolding leak (IV-5).
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
}

test.describe('TC-FR-MINIVIC — MiniVicBot scaffold leak guard', () => {
  test.describe.configure({ timeout: 90000 });

  test('MiniVicBot response does NOT contain rubric tokens (IV-5)', async ({ page }) => {
    await gotoHome(page);

    const toggle = page.locator('[data-testid="minivic-toggle"]');
    await expect(toggle).toBeVisible({ timeout: 10000 });
    await toggle.click();

    const panel = page.locator('[data-testid="minivic-panel"]');
    await expect(panel).toBeVisible({ timeout: 5000 });

    const input = page.locator('[data-testid="minivic-input"]');
    await expect(input).toBeVisible();
    await input.fill('What is your AI stack?');

    await page.locator('button[aria-label="Send message"]').click();

    await page.waitForTimeout(10000);

    const chatLog = page.locator('[data-testid="minivic-panel"] [role="log"]');
    const allText = await chatLog.textContent() || '';

    const rubricTokens = ['sentences?', 'No bullet lists', 'Yes (', '2-5 sentences'];
    for (const token of rubricTokens) {
      expect(allText).not.toContain(token);
    }

    expect(allText.length).toBeGreaterThan(50);
  });

  test('MiniVicBot opens and shows greeting', async ({ page }) => {
    await gotoHome(page);

    const toggle = page.locator('[data-testid="minivic-toggle"]');
    await toggle.click();

    const panel = page.locator('[data-testid="minivic-panel"]');
    await expect(panel).toBeVisible({ timeout: 5000 });

    const greeting = page.locator('[data-testid="minivic-panel"] [role="log"]');
    await expect(greeting).toContainText(/MiniVic|hiring|delivery|Vikram/i);
  });

  test('MiniVicBot persona modes are selectable', async ({ page }) => {
    await gotoHome(page);

    const toggle = page.locator('[data-testid="minivic-toggle"]');
    await toggle.click();

    const panel = page.locator('[data-testid="minivic-panel"]');
    await expect(panel).toBeVisible({ timeout: 5000 });

    const engineerMode = page.locator('[data-testid="minivic-mode-engineer"]');
    await expect(engineerMode).toBeVisible();
    await engineerMode.click();
    await expect(engineerMode).toHaveClass(/bg-zinc-500|border-zinc-200/);
  });
});
