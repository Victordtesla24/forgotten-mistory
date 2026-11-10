import { readFileSync, readdirSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import { copyright } from '@/content/legal';

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

  test('each legal page prints the copyright line once, in the footer', async ({ page }) => {
    for (const path of ['/privacy', '/terms']) {
      await page.goto(path);
      const text = await page.locator('body').innerText();
      expect(text.split(copyright).length - 1, path).toBe(1);
      await expect(page.getByRole('contentinfo')).toContainText(copyright);
    }
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
