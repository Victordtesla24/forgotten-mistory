import { readFileSync } from 'node:fs';
import path from 'node:path';

import { test, expect, type Page, type Request } from '@playwright/test';

/**
 * The direct chat origin this build ships, read from the same config point the
 * client is generated from (config/minivic-origin.json → app/data/generated/
 * minivic-origin.ts). Reading it here rather than repeating the hostname keeps
 * the spec true when the function is redeployed to a new URL — and correct when
 * the origin is deliberately switched off, which is a supported configuration.
 */
const CHAT_ORIGIN: string = (() => {
  try {
    const raw = readFileSync(path.join(process.cwd(), 'config/minivic-origin.json'), 'utf8');
    return String(JSON.parse(raw).originUrl || '');
  } catch {
    return '';
  }
})();
const CHAT_ORIGIN_HOST = CHAT_ORIGIN ? new URL(CHAT_ORIGIN).host : '';

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
    const foreignHosts: string[] = [];
    const socketUrls: string[] = [];
    const pageHost = new URL(page.url()).host;
    page.on('request', (request) => {
      const path = apiPath(request);
      if (path) apiRequests.push(path);
      const host = new URL(request.url()).host;
      if (host !== pageHost && !foreignHosts.includes(host)) foreignHosts.push(host);
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
      `the send should touch /api/chat and nothing else same-origin, but made:\n${apiRequests.join('\n')}`,
    ).toEqual(['/api/chat']);

    // G-M3b: the send now tries the chat function's own Cloud Run origin before
    // the Hosting rewrite, because Hosting buffers the streamed reply. That is
    // the ONLY host a send may reach besides the site's own — a third one would
    // be a visitor's question leaving for somewhere nobody signed off on.
    expect(
      foreignHosts,
      `the send reached a host that is not the chat origin:\n${foreignHosts.join('\n')}`,
    ).toEqual(CHAT_ORIGIN_HOST ? [CHAT_ORIGIN_HOST] : []);

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

/**
 * G-M3 — what the send costs, not just where it goes.
 *
 * The independent reviewer measured Enter→first visible bot text at P50
 * 2121 ms against R3's < 1500 ms bar, and found the Firebase Function holding
 * the whole budget. Two of the three mechanisms that answer that are visible
 * from the browser and asserted here; the third (streaming) is a property of
 * the deployed function and is measured on live, not on this static server.
 */
test.describe('MiniVic first-token path', () => {
  test.describe.configure({ timeout: 120000 });

  test('MV-WARM-01: opening the panel warms the function, and a send does not', async ({
    page,
  }) => {
    const warmRequests: Array<{ method: string; url: string }> = [];
    const originWarmRequests: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.pathname === '/api/chat' && url.searchParams.has('warm')) {
        warmRequests.push({ method: request.method(), url: request.url() });
      }
      if (CHAT_ORIGIN_HOST && url.host === CHAT_ORIGIN_HOST && url.searchParams.has('warm')) {
        originWarmRequests.push(request.url());
      }
    });

    const { panel, input } = await openMiniVic(page);
    // The warm-up is fired from an effect on open; give it the tick it needs.
    await expect.poll(async () => warmRequests.length, { timeout: 10000 }).toBe(1);
    expect(warmRequests[0].method, 'the warm-up must not be a POST').toBe('GET');
    expect(warmRequests[0].url).toContain('warm=1');

    // G-M3b: the direct origin is the path a send actually takes, so it is the
    // one that most needs to be hot — and it is a host the browser has never
    // opened a connection to, so this pays its DNS/TLS as well as the container
    // start. Warming only the rewrite would leave the fast path cold.
    if (CHAT_ORIGIN_HOST) {
      await expect.poll(async () => originWarmRequests.length, { timeout: 10000 }).toBe(1);
    }

    await panel.getByRole('button', { name: 'Mute voice' }).click();
    const beforeSend = warmRequests.length;

    await input.fill('What did Vikram do at the ATO?');
    await input.press('Enter');
    await expect
      .poll(
        async () => panel.locator('[data-testid="minivic-loading"]').count().then((n) => n === 0),
        { timeout: SEND_TIMEOUT },
      )
      .toBe(true);

    // A warm-up fired on every send would double the request count for no
    // latency gain — the instance is already hot by then.
    expect(
      warmRequests.length,
      `the send fired ${warmRequests.length - beforeSend} extra warm request(s)`,
    ).toBe(beforeSend);
  });

  test('MV-PAYLOAD-01: the send body carries turns and a mode — no provider, model or prompt', async ({
    page,
  }) => {
    const { panel, input } = await openMiniVic(page);
    await panel.getByRole('button', { name: 'Mute voice' }).click();

    const bodies: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.pathname === '/api/chat' && request.method() === 'POST') {
        bodies.push(request.postData() || '');
      }
    });

    await input.fill('What did Vikram do at the ATO?');
    await input.press('Enter');
    await expect.poll(async () => bodies.length, { timeout: SEND_TIMEOUT }).toBe(1);

    const payload = JSON.parse(bodies[0]) as {
      messages?: Array<{ role: string; content: string }>;
      mode?: string;
      provider?: unknown;
      model?: unknown;
    };

    // The server picks the provider and the model. A client that named either
    // would let a visitor choose what the owner's account gets billed for.
    expect(payload.provider, 'the client is naming a provider').toBeUndefined();
    expect(payload.model, 'the client is naming a model').toBeUndefined();

    // The system prompt is server-owned. The function drops any `system` turn a
    // client sends, so shipping one was ~6 kB of wire cost per send that could
    // never have any effect.
    expect(
      (payload.messages ?? []).map((m) => m.role),
      'a system turn is still being shipped and discarded',
    ).not.toContain('system');

    // `mode` is what the server actually needed: without it every reply came
    // back in the hiring persona whichever one the visitor had chosen.
    expect(payload.mode, 'the persona mode is not reaching the server').toBeTruthy();
    expect((payload.messages ?? []).at(-1)?.content).toContain('ATO');
  });
});

/**
 * G-M3b — the direct origin is preferred, and the fallback is real.
 *
 * The send now tries the chat function's own Cloud Run origin first, because
 * Firebase Hosting buffers the function's streamed reply (first byte 1836 ms
 * through Hosting against 665 ms direct, same function, same request —
 * docs/delivery/evidence/v10-20260905T0515Z/G-M3/08-decision-first-token.md).
 *
 * Preferring a cross-origin, deploy-specific hostname is only safe if a visitor
 * who cannot reach it still gets an answer. That is what this asserts, on the
 * wire, by taking the origin away: the request order, and a rendered reply.
 */
test.describe('MiniVic direct-origin route', () => {
  test.describe.configure({ timeout: 120000 });

  test('MV-ORIGIN-01: a blocked origin falls back to /api/chat, and the visitor still gets an answer', async ({
    page,
  }) => {
    test.skip(!CHAT_ORIGIN_HOST, 'no direct chat origin is configured for this build');

    // Every request to the origin fails at the network layer — the shape a
    // corporate proxy, a withdrawn CORS allowance or a retired service URL all
    // take from the browser's point of view.
    await page.route(`${CHAT_ORIGIN}/**`, (route) => route.abort('failed'));

    const { panel, input } = await openMiniVic(page);
    await panel.getByRole('button', { name: 'Mute voice' }).click();
    await expect(panel.getByRole('button', { name: 'Unmute voice' })).toBeVisible();

    // Record only what the send does: the warm ping already fired on open.
    const sends: string[] = [];
    page.on('request', (request) => {
      if (request.method() !== 'POST') return;
      const url = new URL(request.url());
      if (url.searchParams.has('warm')) return;
      if (url.host === CHAT_ORIGIN_HOST) sends.push('origin');
      else if (url.pathname === '/api/chat') sends.push('hosting');
    });

    await input.fill('What did Vikram do at the ATO?');
    await input.press('Enter');

    await expect
      .poll(
        async () => panel.locator('[data-testid="minivic-loading"]').count().then((n) => n === 0),
        { timeout: SEND_TIMEOUT },
      )
      .toBe(true);

    // The order is the whole point: the fast path is tried, and its failure
    // hands the send to the path that always works.
    await expect
      .poll(async () => sends.join(','), { timeout: SEND_TIMEOUT })
      .toBe('origin,hosting');

    // And an answer rendered. On this static server /api/chat 404s too, so the
    // reply is the deterministic tier's — which is the honest end of the ladder,
    // not a fabricated one.
    const replies = panel.locator('[data-minivic-message][data-minivic-role="bot"]');
    await expect.poll(async () => (await replies.count()) >= 2, { timeout: SEND_TIMEOUT }).toBe(true);
    const lastReply = (await replies.last().innerText()).trim();
    expect(lastReply.length, `the fallback produced no answer:\n${lastReply}`).toBeGreaterThan(40);
  });

  test('MV-ORIGIN-02: the origin is tried before the Hosting rewrite on an ordinary send', async ({
    page,
  }) => {
    test.skip(!CHAT_ORIGIN_HOST, 'no direct chat origin is configured for this build');

    const { panel, input } = await openMiniVic(page);
    await panel.getByRole('button', { name: 'Mute voice' }).click();

    const sends: string[] = [];
    page.on('request', (request) => {
      if (request.method() !== 'POST') return;
      const url = new URL(request.url());
      if (url.searchParams.has('warm')) return;
      if (url.host === CHAT_ORIGIN_HOST) sends.push('origin');
      else if (url.pathname === '/api/chat') sends.push('hosting');
    });

    await input.fill('How do you lead a squad?');
    await input.press('Enter');
    await expect
      .poll(
        async () => panel.locator('[data-testid="minivic-loading"]').count().then((n) => n === 0),
        { timeout: SEND_TIMEOUT },
      )
      .toBe(true);

    // From this origin (a local static server) the function's CORS allowance
    // does not cover us, so the direct rung fails and Hosting follows — but the
    // ORDER is the invariant this asserts, and it is the same order a visitor on
    // the live site gets.
    expect(sends[0], `the send did not try the direct origin first: ${sends.join(',')}`).toBe('origin');
  });
});
