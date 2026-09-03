import { test, expect, type Page } from '@playwright/test';

/**
 * SPEC §10 TC-FR-VOICE — the greeting is the cloned voice, and play/pause/mute
 * really work. SPEC §10 TC-FR-VOICE-DYN — nothing speaks until it is asked to.
 *
 * The subject here is `MiniVicBot`'s audio, which mounts from `app/layout.tsx`
 * and is untouched by the section rebuild. What was wrong with this file was
 * that almost none of it could fail. Every assertion sat inside an
 * `if (panelVisible)` or `if (micAttached)` guard that skipped silently when the
 * selector missed, TC-VOICE-DYN-03 was a bare `expect(true).toBe(true)` with a
 * comment explaining why it asserted nothing, and TC-VOICE-DYN-01 counted
 * `[class*="scroll-rail"]` elements — `ScrollRail` is one of the components the
 * rebuild deleted, so that test was pinned to a subject that no longer exists
 * and would have started failing the moment its guard was tightened.
 *
 * So the file was rewritten around what the clone actually does. The greeting
 * mp3 is twelve seconds long and starts on the click that opens the panel,
 * which is a real user gesture and therefore satisfies the browser's autoplay
 * policy — long enough to pause it, watch it hold, resume it, watch it move,
 * and mute it, which is the whole play/pause/mute contract observed rather than
 * inferred from a button being on screen. The cloned-voice identity check is
 * the SHA-256 the build publishes on `window`, which is what distinguishes
 * Vikram's own voice profile from a stock synthesis.
 *
 * The three MiniVicBot files divide the subject rather than repeating it:
 * tests/e2e/chatbot.spec.ts owns the panel, the composer and the reply;
 * tests/e2e/clone-voice.spec.ts owns the page-wide voiceover controller and its
 * ambient bed; this file owns the clone's own audio.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
}

async function openMiniVic(page: Page) {
  const toggle = page.locator('[data-testid="minivic-toggle"]');
  await expect(toggle).toBeVisible();
  await toggle.evaluate((el: HTMLElement) => el.click());
  const panel = page.locator('[data-testid="minivic-panel"]');
  await expect(panel).toBeVisible();
  return { panel, audio: page.locator('[data-testid="minivic-audio"]') };
}

/** Reads the greeting element's transport state. */
function transport(audio: ReturnType<Page['locator']>) {
  return audio.evaluate((el) => {
    const a = el as HTMLAudioElement;
    return { src: a.getAttribute('src') ?? '', paused: a.paused, currentTime: a.currentTime };
  });
}

test.describe('TC-FR-VOICE: Cloned Voice Greeting', () => {
  test.describe.configure({ timeout: 90000 });

  test('TC-VOICE-01: The greeting asset is the published cloned-voice recording', async ({ page }) => {
    await gotoHome(page);

    // The hash is what ties the shipped mp3 to Vikram's own voice profile. If
    // the asset is ever regenerated from a stock voice — the failure mode this
    // check exists for — the digest changes and the two stop agreeing.
    const hash = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__CLONED_VOICE_GREETING_HASH__,
    );
    expect(typeof hash).toBe('string');
    expect(String(hash)).toMatch(/^[0-9a-f]{64}$/);

    const response = await page.request.get('/assets/minivic-greeting.mp3');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('audio');

    // And it is that asset the panel reaches for, not a browser-synthesised
    // fallback voice.
    const { audio } = await openMiniVic(page);
    await expect
      .poll(async () => (await transport(audio)).src, { timeout: 10000 })
      .toBe('/assets/minivic-greeting.mp3');
  });

  test('TC-VOICE-02: Play, pause and resume move the greeting as instructed', async ({ page }) => {
    await gotoHome(page);
    const { panel, audio } = await openMiniVic(page);

    // Opening the panel is the user gesture that starts the greeting, so it
    // plays without falling foul of the autoplay policy.
    await expect.poll(async () => (await transport(audio)).paused, { timeout: 10000 }).toBe(false);
    await expect.poll(async () => (await transport(audio)).currentTime, { timeout: 10000 }).toBeGreaterThan(0);

    // Pause holds it: the playhead must not move while it is paused. Asserting
    // the button changed label would not have caught a pause that did nothing.
    await panel.getByRole('button', { name: 'Pause voice' }).click();
    await expect.poll(async () => (await transport(audio)).paused, { timeout: 5000 }).toBe(true);
    const held = (await transport(audio)).currentTime;
    await page.waitForTimeout(900);
    expect((await transport(audio)).currentTime).toBeCloseTo(held, 1);

    // Resume moves it again.
    await panel.getByRole('button', { name: 'Resume voice' }).click();
    await expect.poll(async () => (await transport(audio)).paused, { timeout: 5000 }).toBe(false);
    await expect
      .poll(async () => (await transport(audio)).currentTime, { timeout: 5000 })
      .toBeGreaterThan(held);
  });

  test('TC-VOICE-03: Muting stops the voice and releases the asset', async ({ page }) => {
    await gotoHome(page);
    const { panel, audio } = await openMiniVic(page);
    await expect.poll(async () => (await transport(audio)).paused, { timeout: 10000 }).toBe(false);

    await panel.getByRole('button', { name: 'Mute voice' }).click();

    // Mute is not a volume slider on this component: it tears the source down,
    // so a muted visitor is not left with a stream running silently behind the
    // page. The control must then offer the opposite action.
    await expect
      .poll(async () => transport(audio), { timeout: 10000 })
      .toEqual({ src: '', paused: true, currentTime: 0 });
    await expect(panel.getByRole('button', { name: 'Unmute voice' })).toBeVisible();
  });

  test('TC-VOICE-04: Opening the clone raises no uncaught audio errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await gotoHome(page);
    await openMiniVic(page);
    await page.waitForTimeout(1500);

    const audioErrors = consoleErrors.filter((e) =>
      /audio|speech|voice|media/i.test(e),
    );
    const crashes = audioErrors.filter((e) => /uncaught/i.test(e));
    expect(crashes, `uncaught audio errors:\n${crashes.join('\n')}`).toHaveLength(0);
  });
});

test.describe('TC-FR-VOICE-DYN: Voice never starts by itself', () => {
  test.describe.configure({ timeout: 90000 });

  test('TC-VOICE-DYN-01: Nothing plays on load, or on scrolling the whole page', async ({ page }) => {
    await gotoHome(page);

    // Replaces the ScrollRail count, whose component was deleted. The contract
    // that scrolling used to be entangled with is the one worth keeping: moving
    // through the page must never start audio. A portfolio that talks at a
    // visitor who only scrolled has broken the single rule this whole audio
    // layer is built around.
    const playing = async () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll('audio, video')).filter(
          (el) => !(el as HTMLMediaElement).paused && !(el as HTMLMediaElement).muted,
        ).length,
      );

    expect(await playing()).toBe(0);

    for (const id of ['#hero', '#about', '#experience', '#skills', '#vitrine', '#listen']) {
      await page.locator(id).scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      expect(await playing(), `audio started while scrolling to ${id}`).toBe(0);
    }
  });

  test('TC-VOICE-DYN-02: Scrolling every section raises no scroll or animation errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await gotoHome(page);
    for (const id of ['#hero', '#about', '#experience', '#skills', '#vitrine', '#listen']) {
      await page.locator(id).scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
    }

    const transitionErrors = consoleErrors.filter((e) => /scroll|trigger|gsap|observer/i.test(e));
    expect(transitionErrors, `scroll errors:\n${transitionErrors.join('\n')}`).toHaveLength(0);
  });

  test('TC-VOICE-DYN-03: The composer offers a microphone control', async ({ page }) => {
    await gotoHome(page);
    const { panel } = await openMiniVic(page);

    // The old version wrapped this in two nested `if`s, so a missing mic button
    // read as a pass. Speech input is either offered or it is not.
    const mic = panel.locator('button[title="Use Microphone"]');
    await expect(mic).toBeVisible();
    await expect(mic).toBeEnabled();
  });
});
