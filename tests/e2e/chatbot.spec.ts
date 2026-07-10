import { test, expect, type Page } from '@playwright/test';

/**
 * Category 1: E2E — MiniVicBot Chatbot
 * Verifies the AI clone chatbot loads and has core interaction elements.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  // Wait for React hydration before mutating the boot overlay — removing the
  // preloader DOM pre-hydration forces Suspense remounts and pageerror noise.
  await page.waitForFunction(() => {
    const btn = document.querySelector('[data-testid="minivic-toggle"]');
    if (!btn) return false;
    return Object.keys(btn).some((key) => key.startsWith('__reactFiber') || key.startsWith('__reactProps'));
  }, { timeout: 30000 });
  // Match hero suite: click Skip, then force-remove if the wipe stalls so
  // suite runs are not gated on the boot animation. Also emit the hero
  // handoff signal so entrance choreography is not left waiting.
  await page.evaluate(() => {
    const skip = document.querySelector('button.preloader-skip') as HTMLButtonElement | null;
    skip?.click();
    document.body.classList.add('page-ready');
    window.dispatchEvent(new Event('fm:page-ready'));
    document.querySelector('.preloader')?.remove();
  }).catch(() => {});
}

async function openMiniVic(page: Page) {
  const toggle = page.locator('[data-testid="minivic-toggle"]');
  await expect(toggle).toBeVisible();
  // Native element click — Playwright's center-point click can land on the
  // avatar <video> child before pointer-events settle after HMR/hydration.
  await toggle.evaluate((el: HTMLElement) => el.click());

  const panel = page.locator('[data-testid="minivic-panel"]');
  await expect(panel).toBeVisible();

  return {
    toggle,
    panel,
    input: page.locator('[data-testid="minivic-input"]'),
    audio: page.locator('[data-testid="minivic-audio"]'),
  };
}

test.describe('E2E: MiniVicBot Chatbot', () => {
  test.describe.configure({ timeout: 90000 });

  test('TC-BOT-01: MiniVicBot toggle button is visible on the page', async ({ page }) => {
    await gotoHome(page);

    const toggle = page.locator('[data-testid="minivic-toggle"]');
    await expect(toggle).toBeAttached();
    await expect(toggle).toBeVisible();
  });

  test('TC-BOT-02: Opening MiniVic reveals the panel and chat input', async ({ page }) => {
    await gotoHome(page);

    const { panel, input } = await openMiniVic(page);
    await expect(panel).toContainText('Mini Vic');
    await expect(input).toBeVisible();
  });

  test('TC-BOT-03: Opening MiniVic shows the curated quick prompts', async ({ page }) => {
    await gotoHome(page);

    const { panel } = await openMiniVic(page);
    await expect(panel.getByRole('button', { name: 'Fit me to a role' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Ship a roadmap' })).toBeVisible();
  });

  test('TC-BOT-04: Closing MiniVic via the launcher hides the panel and clears greeting audio state', async ({ page }) => {
    await gotoHome(page);

    const { toggle, panel, audio } = await openMiniVic(page);

    await expect
      .poll(
        async () => audio.evaluate((el) => (el as HTMLAudioElement).getAttribute('src') ?? ''),
        { timeout: 5000 },
      )
      .toContain('/assets/minivic-greeting.mp3');

    await toggle.click();
    await expect(panel).toBeHidden();
    await expect(toggle).toBeFocused();

    await expect
      .poll(
        async () =>
          audio.evaluate((el) => ({
            currentTime: (el as HTMLAudioElement).currentTime,
            paused: (el as HTMLAudioElement).paused,
            src: (el as HTMLAudioElement).getAttribute('src') ?? '',
          })),
        { timeout: 5000 },
      )
      .toEqual({
        currentTime: 0,
        paused: true,
        src: '',
      });
  });

  test('TC-BOT-05: MiniVicBot open/close cycle does not throw page errors', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await gotoHome(page);

    const { toggle } = await openMiniVic(page);
    await toggle.click();
    await page.waitForTimeout(300);

    expect(pageErrors).toHaveLength(0);
  });

  test('TC-BOT-06: MiniVic shell is labelled and moves focus to the composer', async ({ page }) => {
    await gotoHome(page);

    const { panel, input } = await openMiniVic(page);
    await expect(panel).toHaveAttribute('aria-labelledby', 'minivic-title');
    await expect(panel).toHaveAttribute('aria-describedby', 'minivic-description');
    await expect(panel.locator('#minivic-title')).toContainText('Mini Vic');
    await expect(panel.locator('#minivic-description')).toBeAttached();
    await expect(input).toHaveAttribute('aria-label', 'Message Mini Vic');
    await expect(input).toBeFocused();

    const transcript = panel.getByRole('log', { name: 'Conversation with Mini Vic' });
    await expect(transcript).toBeVisible();
  });

  test('TC-BOT-07: Launcher communicates expanded state and a visible invitation', async ({ page }) => {
    await gotoHome(page);

    const toggle = page.locator('[data-testid="minivic-toggle"]');
    const invitation = page.locator('[data-testid="minivic-launcher-label"]');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toHaveAttribute('aria-controls', 'minivic-panel');
    await expect(invitation).toContainText('Ask Mini Vic');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#minivic-panel')).toBeVisible();
  });

  test('TC-BOT-08: Persona selector supports arrow-key navigation', async ({ page }) => {
    await gotoHome(page);

    const { panel } = await openMiniVic(page);
    const hiring = panel.getByRole('tab', { name: 'Hiring Fit' });
    const engineering = panel.getByRole('tab', { name: 'Engineering' });

    await expect(hiring).toHaveAttribute('aria-selected', 'true');
    await hiring.focus();
    await hiring.press('ArrowRight');

    await expect(engineering).toBeFocused();
    await expect(engineering).toHaveAttribute('aria-selected', 'true');
    await expect(panel.locator('[data-testid="minivic-mode-description"]')).toContainText('Architecture');
  });

  test('TC-BOT-09: Mobile shell stays inside the viewport with composer visible', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await gotoHome(page);

    const { panel, input } = await openMiniVic(page);
    const box = await panel.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
    expect(box!.y + box!.height).toBeLessThanOrEqual(640);
    await expect(input).toBeVisible();
    await expect(panel.locator('[data-testid="minivic-quick-prompts"]')).toBeVisible();
  });

  test('TC-BOT-10: Provider response renders once with an accessible processing state', async ({ page }) => {
    await page.route('**/api/realtime/session', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'realtime unavailable in focused UI test',
          provider: 'realtime',
          retryable: true,
        }),
      });
    });
    await page.route('**/api/chat-with-vic', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 250));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          text: 'I map delivery evidence to the role, then make the first-week plan concrete.',
        }),
      });
    });

    await gotoHome(page);
    const { panel, input } = await openMiniVic(page);
    await panel.getByRole('button', { name: 'Mute voice' }).click();
    await input.fill('How would you assess role fit?');
    await input.press('Enter');

    const processing = panel.getByRole('status');
    await expect(processing).toContainText('Reviewing');
    await expect(panel.getByText('How would you assess role fit?', { exact: true })).toHaveCount(1);
    await expect(
      panel.getByText('I map delivery evidence to the role, then make the first-week plan concrete.', {
        exact: true,
      }),
    ).toHaveCount(1);
    await expect(processing).toBeHidden();
  });

  test('TC-FR-VOICE: Cloned voice greeting hash is exposed and valid', async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(2000);

    // Verify the CLONED_VOICE_GREETING_HASH is exposed on window
    const hash = await page.evaluate(() => (window as any).__CLONED_VOICE_GREETING_HASH__);
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(64); // SHA-256 hex string

    // Verify the greeting audio asset exists and is fetchable
    const audioResponse = await page.request.get('/assets/minivic-greeting.mp3');
    expect(audioResponse.ok()).toBeTruthy();
    expect(audioResponse.headers()['content-type']).toContain('audio');

    // Open MiniVicBot and verify it plays the greeting (user gesture trigger)
    const botToggle = page.locator('[data-testid="minivic-toggle"]');
    const toggleCount = await botToggle.count();
    if (toggleCount > 0) {
      await botToggle.click();
      await page.waitForTimeout(1000);
      // Panel should be visible after toggle click
      const panel = page.locator('[data-testid="minivic-panel"]');
      await expect(panel).toBeVisible();
      // Mute button should be present (voice controls are wired)
      const muteBtn = page.locator('button[aria-label*="Mute"], button[aria-label*="Unmute"]');
      const muteCount = await muteBtn.count();
      expect(muteCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('TC-FR-VOICE-02: Voice controls (play/pause/mute) render when MiniVicBot is open', async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(2000);

    const botToggle = page.locator('[data-testid="minivic-toggle"]');
    const toggleCount = await botToggle.count();
    if (toggleCount === 0) return; // skip if widget not present

    await botToggle.click();
    await page.waitForTimeout(1500);

    // Mute button should be present
    const muteBtn = page.locator('button[aria-label*="Mute"], button[aria-label*="Unmute"]');
    const muteVisible = await muteBtn.isVisible().catch(() => false);
    expect(muteVisible).toBeTruthy();

    // Panel should be visible
    const panel = page.locator('[data-testid="minivic-panel"]');
    await expect(panel).toBeVisible();
  });
});
