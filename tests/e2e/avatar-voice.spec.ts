import { test, expect, type Page } from '@playwright/test';

/**
 * R3a — the voice speaks again, and it says what it is.
 *
 * Two assertions, and they are deliberately different in kind.
 *
 * 1. `POST /api/tts` must return real MP3 bytes. The endpoint is a Cloud
 *    Function behind a Hosting rewrite (`firebase.json` → `elevenLabsTts`), so
 *    it exists only on the deployed origin — never in a local static export.
 *    This test therefore names that origin absolutely rather than following
 *    `baseURL`, so it measures production whichever server the rest of the
 *    suite is pointed at. Override with `TTS_ORIGIN` to aim it elsewhere.
 *
 *    The failure it was written against: the function asked ElevenLabs for
 *    Vikram's *cloned* voice, which the account's `payg` plan refuses
 *    (`ivc_not_permitted`), so every request 401'd upstream and 502'd here —
 *    `{"error":"tts_upstream_failed","status":401}`
 *    (`docs/delivery/evidence/v10-20260905T0515Z/C14a-tts/01-diagnosis.md`).
 *    8 kB is the floor a genuine MP3 clears easily and a JSON error body never
 *    can, so the size check cannot be satisfied by a 502 that happens to be
 *    labelled `audio/mpeg`.
 *
 * 2. Wherever that audio can be heard, the UI must say the voice is synthetic.
 *    The site speaks with a stock ElevenLabs voice, not with Vikram's own, and
 *    the one thing this portfolio may never do is let a visitor believe they
 *    are hearing him. The label is asserted on the panel that plays the audio
 *    (`[data-testid="minivic-audio"]` lives inside it), so deleting the label
 *    while keeping the player fails here.
 */

const TTS_ORIGIN = process.env.TTS_ORIGIN ?? 'https://forgotten-mistory.web.app';

/** The floor a real MP3 clears and an error body cannot. */
const MIN_AUDIO_BYTES = 8 * 1024;

async function openMiniVicPanel(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const toggle = page.locator('[data-testid="minivic-toggle"]');
  await toggle.waitFor({ state: 'attached', timeout: 20000 });
  // `evaluate(click)` rather than `toggle.click()`: the launcher sits under the
  // fixed chrome on narrow viewports and Playwright's actionability check can
  // time out on an element that is perfectly clickable for a real visitor.
  await toggle.evaluate((el: HTMLElement) => el.click());
  const panel = page.locator('[data-testid="minivic-panel"]');
  await expect(panel).toBeVisible({ timeout: 15000 });
  return panel;
}

test.describe('R3a: the synthetic voice', () => {
  test.describe.configure({ timeout: 60000 });

  test('POST /api/tts returns MP3 audio, not a 502', async ({ request }) => {
    const response = await request.post(`${TTS_ORIGIN}/api/tts`, {
      data: { text: 'probe' },
      headers: { 'content-type': 'application/json' },
      timeout: 30000,
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('audio/mpeg');

    const audio = await response.body();
    expect(audio.byteLength).toBeGreaterThanOrEqual(MIN_AUDIO_BYTES);
  });

  test('the panel that plays the voice labels it synthetic', async ({ page }) => {
    const panel = await openMiniVicPanel(page);

    // The element the voice plays through must exist — a label with no player
    // behind it would pass on a page that cannot speak at all.
    await expect(page.locator('[data-testid="minivic-audio"]')).toBeAttached();

    const label = panel.getByText(/synthetic/i).first();
    await expect(label).toBeVisible();
  });
});
