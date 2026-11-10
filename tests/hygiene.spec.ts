import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';

import { MINIVIC_CHAT_ORIGIN } from '@/lib/assistant/origin';

import { open } from './support';

/**
 * Wording that belongs to a previous version of the site, or to a feature the page does
 * not have. Each one shipped once; finding any of them in a built page is a defect.
 */
const BANNED_PHRASES = [
  'Ten dimensions, answered',
  'all ten of them',
  'one WebGL context per section',
  'model-generated likeness',
  'voice, cloned',
] as const;

/** Every HTML file under `dir`, which includes the page data the framework inlines. */
function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((name) => name.endsWith('.html'))
    .map((name) => join(dir, name));
}

// Nothing here depends on the viewport, so it runs once, in the desktop project.
test.describe('checked once, because the viewport does not matter', { tag: '@desktop' }, () => {
  test('no built page carries wording from the previous site', () => {
    const files = htmlFiles('out');
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const html = readFileSync(file, 'utf8');
      for (const phrase of BANNED_PHRASES) {
        expect(html.includes(phrase), `${file} contains "${phrase}"`).toBe(false);
      }
    }
  });

  test('the privacy policy names every host the page contacts when the assistant opens', async ({
    page,
  }) => {
    // The warm-up the panel sends on opening is answered here, so the test never calls the backend.
    await page.route('**/*warm=1*', (route) => route.fulfill({ status: 204 }));

    const hosts = new Set<string>();
    page.on('request', (request) => hosts.add(new URL(request.url()).host));
    await open(page, '/');
    const own = new URL(page.url()).host;

    await page.getByRole('button', { name: 'Ask Mini Vic' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const chatHost = new URL(MINIVIC_CHAT_ORIGIN).host;
    await expect.poll(() => hosts.has(chatHost), 'opening the panel warms the chat host').toBe(true);

    const policy = await (await page.request.get('/privacy')).text();
    for (const host of hosts) {
      if (host !== own) expect(policy, `/privacy names ${host}`).toContain(host);
    }
  });
});
