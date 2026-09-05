import { test, expect, type Page, type Request } from '@playwright/test';

/**
 * G-M1 — what MiniVic actually puts on the wire when a visitor sends a message.
 *
 * The send path used to be a ladder: POST /api/realtime/session → open a
 * WebSocket → POST /api/chat-with-vic → poll /api/chat-with-vic?taskId= → and
 * only at the end of all that, the client brain's POST /api/chat. On the static
 * export the first branch threw before any of it ran, so every rung was dead
 * code downloaded by every visitor — and the independent reviewer found the
 * poller still sitting in the served bundle.
 *
 * This spec asserts the wire, not the source: one request to /api/ per send,
 * and it is /api/chat. On the static server /api/chat 404s and the brain's
 * deterministic tier answers — that is the intended degradation, and the reply
 * still has to render.
 *
 * The panel is opened the way tests/monochrome/minivic-launcher.spec.ts opens
 * it — wait for React to hydrate the launcher, scroll past the hero (the dock
 * only fades in past it), then click through the element. A plain
 * `click()` on the launcher before hydration is what left the reviewer with a
 * panel that never opened and zero /api/* requests to measure.
 */

const SEND_TIMEOUT = 20000;

async function openMiniVic(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('[data-testid="minivic-toggle"]');
      if (!btn) return false;
      return Object.keys(btn).some(
        (key) => key.startsWith('__reactFiber') || key.startsWith('__reactProps'),
      );
    },
    { timeout: 30000 },
  );
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
  await page.waitForTimeout(400);

  await page.locator('[data-testid="minivic-toggle"]').evaluate((el: HTMLElement) => el.click());
  const panel = page.locator('[data-testid="minivic-panel"]');
  await expect(panel).toBeVisible();
  const input = panel.locator('[data-testid="minivic-input"]');
  await expect(input).toBeVisible();
  return { panel, input };
}

/** Path (no query) of any request this page makes to an API route. */
function apiPath(request: Request): string | null {
  const url = new URL(request.url());
  return url.pathname.startsWith('/api/') ? url.pathname : null;
}

test.describe('MiniVic send path', () => {
  test.describe.configure({ timeout: 120000 });

  test('MV-WIRE-01: one send makes exactly one /api request, and it is /api/chat', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const { panel, input } = await openMiniVic(page);

    // Mute first: an unmuted reply is also voiced through /api/tts, and this
    // spec is measuring the send path alone. Muting is the visitor-facing
    // control, not a test hook.
    await panel.getByRole('button', { name: 'Mute voice' }).click();
    await expect(panel.getByRole('button', { name: 'Unmute voice' })).toBeVisible();

    // Only requests made from here on belong to the send.
    const apiRequests: string[] = [];
    const socketUrls: string[] = [];
    page.on('request', (request) => {
      const path = apiPath(request);
      if (path) apiRequests.push(path);
    });
    page.on('websocket', (ws) => socketUrls.push(ws.url()));

    const question = 'What did Vikram do at the ATO?';
    await input.fill(question);
    await input.press('Enter');

    // The visitor's own message lands first, then the reply.
    await expect(panel.getByText(question, { exact: false }).first()).toBeVisible();
    await expect
      .poll(
        async () =>
          panel.locator('[data-testid="minivic-loading"]').count().then((n) => n === 0),
        { timeout: SEND_TIMEOUT },
      )
      .toBe(true);

    // A real answer rendered — the deterministic tier's, on this static server.
    const replies = panel.locator('[data-minivic-message][data-minivic-role="bot"]');
    await expect
      .poll(async () => (await replies.count()) >= 2, { timeout: SEND_TIMEOUT })
      .toBe(true);
    const lastReply = (await replies.last().innerText()).trim();
    expect(lastReply.length, `the reply was empty:\n${lastReply}`).toBeGreaterThan(40);

    // The wire. One API request for the send, and it is the chat endpoint.
    expect(
      apiRequests.filter((p) => p.startsWith('/api/realtime')),
      'the dead realtime ladder is still being called',
    ).toEqual([]);
    expect(
      apiRequests.filter((p) => p.includes('chat-with-vic')),
      'the dead chat-with-vic route is still being called',
    ).toEqual([]);
    expect(
      socketUrls,
      `the send opened a WebSocket:\n${socketUrls.join('\n')}`,
    ).toEqual([]);
    expect(
      apiRequests,
      `the send should touch /api/chat and nothing else, but made:\n${apiRequests.join('\n')}`,
    ).toEqual(['/api/chat']);

    expect(pageErrors, `uncaught page errors:\n${pageErrors.join('\n')}`).toEqual([]);
    const crashes = consoleErrors.filter((e) => /uncaught|is not a function|undefined is not/i.test(e));
    expect(crashes, `console crashes:\n${crashes.join('\n')}`).toEqual([]);
  });

  test('MV-WIRE-02: no poller keeps running after the reply lands', async ({ page }) => {
    const { panel, input } = await openMiniVic(page);
    await panel.getByRole('button', { name: 'Mute voice' }).click();

    await input.fill('How do you lead a squad?');
    await input.press('Enter');
    await expect
      .poll(
        async () =>
          panel.locator('[data-testid="minivic-loading"]').count().then((n) => n === 0),
        { timeout: SEND_TIMEOUT },
      )
      .toBe(true);

    // The old ladder left a 3-second setInterval polling /api/chat-with-vic
    // for a video that never arrives. Watch a window wider than that interval
    // and require silence.
    const late: string[] = [];
    page.on('request', (request) => {
      const path = apiPath(request);
      if (path) late.push(path);
    });
    await page.waitForTimeout(7000);
    expect(late, `something is still polling after the reply:\n${late.join('\n')}`).toEqual([]);
  });
});
