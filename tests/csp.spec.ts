import { expect, test, type Page } from '@playwright/test';

import { MINIVIC_CHAT_ORIGIN } from '@/lib/assistant/origin';

import { enforceProductionCsp, open, readProductionCsp } from './support';

/** Every page a reader can land on: the home page, both legal pages and the not-found page. */
const ROUTES = ['/', '/privacy', '/terms', '/no-such-page'] as const;

/**
 * Serves firebase.json's policy with every document and records every way the browser
 * can report a breach of it: the `securitypolicyviolation` event, and any console
 * message that mentions the Content Security Policy.
 */
async function watchPolicy(page: Page): Promise<string[]> {
  const breaches: string[] = [];
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      console.log(
        `securitypolicyviolation: ${event.violatedDirective} blocked ${event.blockedURI || 'inline code'}`,
      );
    });
  });
  page.on('console', (message) => {
    if (/content security policy|securitypolicyviolation/i.test(message.text())) {
      breaches.push(`${message.type()}: ${message.text()}`);
    }
  });
  await enforceProductionCsp(page);
  return breaches;
}

/** Scrolls the whole page so that everything loaded lazily on the way has loaded. */
async function scrollThrough(page: Page): Promise<void> {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForLoadState('networkidle');
}

/**
 * Stands in for the chat function's Cloud Run origin, so the test never calls the real
 * backend. The browser still checks the request against connect-src before it is routed,
 * so a policy that does not name the origin is reported as a violation.
 */
async function answerFromOrigin(page: Page, answer: string): Promise<void> {
  const cors = { 'access-control-allow-origin': '*' };
  await page.route(`${MINIVIC_CHAT_ORIGIN}/**`, async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        headers: { ...cors, 'content-type': 'text/event-stream' },
        body: `data: ${JSON.stringify({ delta: answer })}\n\ndata: ${JSON.stringify({ done: true })}\n\n`,
      });
    } else {
      await route.fulfill({ status: 204, headers: cors });
    }
  });
}

for (const path of ROUTES) {
  test(`${path} loads under the production policy without a violation`, async ({ page }) => {
    const breaches = await watchPolicy(page);

    const response = await open(page, path);
    expect(response?.status()).toBe(path === '/no-such-page' ? 404 : 200);
    expect(response?.headers()['content-security-policy']).toBe(readProductionCsp());

    await scrollThrough(page);
    expect(breaches).toEqual([]);
  });
}

test('the theme toggle, the assistant and a question stay within the policy', async ({ page }) => {
  const breaches = await watchPolicy(page);
  await answerFromOrigin(page, 'Delivery and AI, from the chat function.');
  await open(page, '/');

  const root = page.locator('html');
  const toggle = page.getByRole('button', { name: 'Switch colour theme' });
  await toggle.click();
  await expect(root).toHaveAttribute('data-theme', 'light');
  await toggle.click();
  await expect(root).toHaveAttribute('data-theme', 'dark');

  await page.getByRole('button', { name: 'Ask Mini Vic' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByRole('textbox', { name: 'Your question for Mini Vic' }).fill('What is your current role?');
  await page.keyboard.press('Enter');
  await expect(dialog.getByText('Delivery and AI, from the chat function.')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  expect(breaches).toEqual([]);
});

// The menu button only exists below 900px, so this runs in the mobile project only.
test.describe('on small screens', { tag: '@mobile' }, () => {
  test('the mobile menu opens within the policy', async ({ page }) => {
    const breaches = await watchPolicy(page);
    await open(page, '/');

    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    const menu = page.getByRole('dialog', { name: 'Site menu', exact: true });
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();

    expect(breaches).toEqual([]);
  });
});

/** The production policy as a map from directive name to its sources. */
function policyDirectives(): Map<string, readonly string[]> {
  return new Map(
    readProductionCsp()
      .split(';')
      .map((directive) => directive.trim().split(/\s+/))
      .map(([name, ...sources]) => [name, sources] as const),
  );
}

// The policy is the same for every viewport, so it is read once, in the desktop project.
test.describe('the policy itself', { tag: '@desktop' }, () => {
  test('names the chat origin in connect-src and allows nothing else off-site', () => {
    const directives = policyDirectives();
    expect(directives.get('connect-src')).toEqual(["'self'", MINIVIC_CHAT_ORIGIN]);
    for (const [name, sources] of directives) {
      const offSite = sources.filter((source) => /^(https?|wss?):/.test(source));
      expect(offSite, name).toEqual(name === 'connect-src' ? [MINIVIC_CHAT_ORIGIN] : []);
    }
  });

  // The pages load no blob, no worker and no media, so the policy allows none; the one
  // data: source is the noise texture the stylesheet draws as an SVG image.
  test('allows data: only for images, and no blob, worker or media source', () => {
    const directives = policyDirectives();
    expect(directives.get('img-src')).toEqual(["'self'", 'data:']);
    for (const [name, sources] of directives) {
      expect(sources, name).not.toContain('blob:');
      if (name !== 'img-src') expect(sources, name).not.toContain('data:');
    }
    expect(directives.has('media-src')).toBe(false);
    expect(directives.has('worker-src')).toBe(false);
  });
});
