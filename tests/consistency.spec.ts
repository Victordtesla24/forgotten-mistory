import { readFileSync, readdirSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import { THEME_KEY } from '@/components/site/theme';
import { contact } from '@/content/contact';
import { copyright } from '@/content/legal';
import { site } from '@/content/site';

import { SECTION_IDS } from './support';

const COUNT_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

/** Every text file of the static export, concatenated. */
function builtText(directory = 'out'): string {
  return readdirSync(directory, { withFileTypes: true })
    .map((entry) => {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) return builtText(path);
      return /\.(html|css|js|txt|json|xml)$/.test(entry.name) ? readFileSync(path, 'utf8') : '';
    })
    .join('\n');
}

/** The URL paths of every file in a folder of `public/`, for example `/assets/og-image.png`. */
function publicPaths(folder: string): string[] {
  return readdirSync(`public/${folder}`).map((name) => `/${folder}/${name}`);
}

// What the site says about itself has to match what it ships. Each check here guards a
// sentence that once outlived the thing it described.
test.describe('what the site says matches what it has', { tag: '@desktop' }, () => {
  test('the privacy policy and the terms name only the links and media the home page has', async ({
    page,
  }) => {
    await page.goto('/');
    const hosts = await page
      .locator('a[href^="http"]')
      .evaluateAll((links) => links.map((link) => new URL((link as HTMLAnchorElement).href).hostname));
    const embeds = await page.locator('iframe, video, audio').count();
    const claims = [
      { word: 'youtube', present: hosts.some((host) => host.includes('youtube')) },
      { word: 'github', present: hosts.some((host) => host.includes('github')) },
      { word: 'linkedin', present: hosts.some((host) => host.includes('linkedin')) },
      { word: 'video', present: embeds > 0 },
    ];

    for (const path of ['/privacy', '/terms']) {
      await page.goto(path);
      const text = (await page.locator('main').innerText()).toLowerCase();
      for (const { word, present } of claims) {
        if (text.includes(word)) expect(present, `${path} mentions ${word}, which the home page does not have`).toBe(true);
      }
    }
  });

  test('the home page claims no stack and no section count the build does not have', async ({ page }) => {
    await page.goto('/');
    const text = (await page.locator('main').textContent()) ?? '';
    const { dependencies } = JSON.parse(readFileSync('package.json', 'utf8')) as {
      dependencies: Record<string, string>;
    };

    if (!('three' in dependencies)) expect(text).not.toMatch(/three\.js/i);
    if (!('@react-three/fiber' in dependencies)) expect(text).not.toMatch(/react three fiber|\bR3F\b/i);

    const counted = [...text.matchAll(new RegExp(`\\b(${COUNT_WORDS.join('|')})[- ]sections?\\b`, 'gi'))];
    for (const [phrase, word] of counted) {
      expect(word.toLowerCase(), phrase).toBe(COUNT_WORDS[SECTION_IDS.length - 1]);
    }
  });

  test('a page load stores nothing, and the policy names the one key the theme toggle writes', async ({
    page,
  }) => {
    await page.goto('/');
    expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
    expect(await page.evaluate(() => document.cookie)).toBe('');

    await page.getByRole('button', { name: 'Switch colour theme' }).first().click();
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([THEME_KEY]);

    await page.goto('/privacy');
    const policy = await page.locator('main').innerText();
    expect(policy).toContain(`under the key ${THEME_KEY}`);
  });

  test('the structured data names every profile the page links, and no unheld certification', async ({
    page,
  }) => {
    await page.goto('/');
    const graphs = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent ?? '{}')));
    const person = graphs.find((graph) => graph['@type'] === 'Person');
    expect(person.sameAs).toEqual(
      expect.arrayContaining([site.channels.linkedin, site.channels.github]),
    );
    const held = (person.hasCredential as { name: string }[]).map((entry) => entry.name);
    expect(held).toEqual(['Certified Scrum Master (CSM)']);
    for (const href of [site.channels.linkedin, site.channels.github]) {
      await expect(page.locator(`a[href="${href}"]`).first()).toBeAttached();
    }
  });

  test('each legal page prints the copyright line once, in the footer', async ({ page }) => {
    for (const path of ['/privacy', '/terms']) {
      await page.goto(path);
      const text = await page.locator('body').innerText();
      expect(text.split(copyright).length - 1, path).toBe(1);
      await expect(page.getByRole('contentinfo')).toContainText(copyright);
    }
  });

  test('the footer prints no build id and names its fault link for what it does; the build id stays in the head', async ({ page }) => {
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await expect(footer).not.toContainText(/\bbuild\b/i);
    await expect(footer.getByRole('link', { name: contact.support.label })).toHaveAttribute('href', contact.support.href);
    await expect(page.locator('meta[name="build-commit"]')).toHaveAttribute('content', /^[0-9a-f]{8}$|^dev$/);
  });

  test('every file in public/assets and public/docs is used by the build', () => {
    const built = builtText();
    for (const path of [...publicPaths('assets'), ...publicPaths('docs')]) {
      expect(built, path).toContain(path);
    }
  });

  test('About shows the portrait in every format, with its alt text', async ({ page }) => {
    await page.goto('/');
    const portrait = page.locator('#about picture');
    await portrait.scrollIntoViewIfNeeded();
    await expect(portrait.locator('source').first()).toHaveAttribute('type', 'image/avif');
    await expect(portrait.locator('source[type="image/webp"]')).toHaveCount(1);

    const image = portrait.getByRole('img', { name: 'Portrait of Vikram Deshpande', exact: true });
    await expect(image).toBeVisible();
    await expect
      .poll(() => image.evaluate((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  });
});
