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

  test('panel layout is clean: no inherited section padding, input not clipped (TC-FR-MINIVIC-LAYOUT)', async ({ page }) => {
    // Regression for the `section { padding: 10rem 0 }` bleed: the panel used a bare
    // <section>, inheriting 160px of page-section padding → a huge dead band at the
    // top and the input/quick-prompts clipped off the bottom by overflow-hidden.
    // A short-ish desktop viewport is where the clip bit hardest.
    await page.setViewportSize({ width: 1280, height: 720 });
    await gotoHome(page);

    const toggle = page.locator('[data-testid="minivic-toggle"]');
    await toggle.click();

    const panel = page.locator('[data-testid="minivic-panel"]');
    await expect(panel).toBeVisible({ timeout: 5000 });

    // 1) No stray page-section vertical padding bleeding onto the widget.
    const padTop = await panel.evaluate((el) => parseFloat(getComputedStyle(el).paddingTop) || 0);
    expect(padTop, 'panel must not inherit the global section vertical padding (160px bug)').toBeLessThan(24);

    const panelBox = await panel.boundingBox();
    expect(panelBox, 'panel must have a bounding box').toBeTruthy();

    // 2) The panel must fit inside the viewport (no clip against the window edge).
    expect(panelBox!.y).toBeGreaterThanOrEqual(-1);
    expect(panelBox!.y + panelBox!.height, 'panel must fit within the viewport').toBeLessThanOrEqual(721);

    // 3) Input and quick-prompts must sit INSIDE the panel — the whole point of a chat
    //    widget is being able to type. overflow-hidden must never clip them away.
    const inputBox = await page.locator('[data-testid="minivic-input"]').boundingBox();
    expect(inputBox, 'input must render').toBeTruthy();
    expect(inputBox!.y, 'input top within panel').toBeGreaterThanOrEqual(panelBox!.y - 1);
    expect(
      inputBox!.y + inputBox!.height,
      'input bottom must sit within the panel (not clipped by overflow-hidden)',
    ).toBeLessThanOrEqual(panelBox!.y + panelBox!.height + 1);

    // 4) No dead band: the hero/header must start near the top of the panel, not 160px down.
    const firstChildTop = await panel.evaluate((el) => {
      const first = el.firstElementChild as HTMLElement | null;
      if (!first) return Infinity;
      return first.getBoundingClientRect().top - el.getBoundingClientRect().top;
    });
    expect(firstChildTop, 'first row must hug the panel top (no dead band)').toBeLessThan(24);
  });

  test('panel closes on Escape and returns focus to the toggle (TC-FR-MINIVIC-A11Y)', async ({ page }) => {
    await gotoHome(page);

    const toggle = page.locator('[data-testid="minivic-toggle"]');
    await toggle.click();

    const panel = page.locator('[data-testid="minivic-panel"]');
    await expect(panel).toBeVisible({ timeout: 5000 });

    // A keyboard user must be able to dismiss the dialog and land back on the trigger.
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(toggle).toBeFocused();
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
    // Active persona segment is the filled white pill (redesigned segmented control).
    await expect(engineerMode).toHaveClass(/bg-white/);
  });

  test('avatar video + cloned-voice greeting assets resolve within budget and wire to the panel (TC-FR-VOICE)', async ({ page, request }) => {
    // The HiggsField video avatar (silent loop) and the ElevenLabs cloned-voice
    // greeting must ship as real, non-placeholder assets inside the perf budget
    // (video ≤2.5MB, audio ≤1MB) — and the panel's <video> must point at the avatar.
    const video = await request.get('/assets/my-avatar.mp4');
    expect(video.status()).toBe(200);
    expect(video.headers()['content-type'] || '').toContain('video');
    const videoLen = (await video.body()).byteLength;
    expect(videoLen, 'avatar video must not be an empty placeholder').toBeGreaterThan(50_000);
    expect(videoLen, 'avatar video must stay within the 2.5MB perf budget').toBeLessThan(2_500_000);

    const audio = await request.get('/assets/minivic-greeting.mp3');
    expect(audio.status()).toBe(200);
    expect(audio.headers()['content-type'] || '').toMatch(/audio|mpeg/);
    const audioLen = (await audio.body()).byteLength;
    expect(audioLen, 'greeting audio must not be an empty placeholder').toBeGreaterThan(10_000);
    expect(audioLen, 'greeting audio must stay within the 1MB budget').toBeLessThan(1_000_000);

    await gotoHome(page);
    await page.locator('[data-testid="minivic-toggle"]').click();
    await expect(page.locator('[data-testid="minivic-panel"]')).toBeVisible({ timeout: 5000 });
    const src = await page.locator('[data-testid="minivic-panel"] video').getAttribute('src');
    expect(src || '', 'panel avatar <video> must source the bundled HiggsField avatar').toContain('my-avatar.mp4');
  });

  test('dynamic answers are voiced through the /api/tts cloned-voice endpoint (TC-FR-VOICE-DYN)', async ({ page }) => {
    // Wiring test only (no real ElevenLabs call): intercept /api/tts and assert the
    // chatbot routes a generated answer's audio through it. A minimal MP3 stub keeps
    // playback from blocking; we assert the request was made.
    let ttsHits = 0;
    const STUB_MP3 = Buffer.from('SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQxAADwAAAAAAAAAAAAAAAAAAAAAA=', 'base64');
    await page.route('**/api/tts', async (route) => {
      ttsHits += 1;
      await route.fulfill({ status: 200, contentType: 'audio/mpeg', body: STUB_MP3 });
    });

    await gotoHome(page);
    await page.locator('[data-testid="minivic-toggle"]').click();
    await expect(page.locator('[data-testid="minivic-panel"]')).toBeVisible({ timeout: 5000 });

    const input = page.locator('[data-testid="minivic-input"]');
    await input.fill('In one sentence, what do you do?');
    await page.locator('button[aria-label="Send message"]').click();

    // The brain answers (Gemini or local fallback) → speakReply → POST /api/tts.
    await expect.poll(() => ttsHits, { timeout: 25000 }).toBeGreaterThan(0);
  });
});
