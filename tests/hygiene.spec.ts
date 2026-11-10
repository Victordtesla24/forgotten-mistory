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

/**
 * The labels, hedges, self-references and clichés the copy style guide (docs/COPY-STYLE.md,
 * section 8) bans. Any of them in the built home page is a defect, whether it is on screen
 * or inside a disclosure. "Customer journey" is a business-analysis term, not the cliché.
 */
const BANNED_WORDING: readonly { name: string; pattern: RegExp }[] = [
  { name: 'the label "Evidence"', pattern: /\bEvidence\b/ },
  { name: 'the label "Known limits"', pattern: /\bKnown limits?\b/i },
  { name: 'the label "Limits"', pattern: /\bLimits\b/ },
  { name: 'the label "Caveat"', pattern: /\bCaveats?\b/i },
  { name: 'the label "Provenance"', pattern: /\bProvenance\b/i },
  { name: '"What it does not do"', pattern: /what it does not do/i },
  { name: '"Where a reader can check it"', pattern: /where a reader can check it/i },
  { name: '"What I look for"', pattern: /what i look for/i },
  { name: '"self-reported"', pattern: /self-reported/i },
  { name: '"measured in/outside production"', pattern: /measured (?:in|outside) production/i },
  { name: 'self-reference to the site', pattern: /\bthis site\b|the page you are reading/i },
  { name: 'a note on how the page was made', pattern: /quoted from a CV|taken verbatim|no score is printed/i },
  { name: '"not live activity"', pattern: /not live activity|Schematic ·/ },
  { name: 'a hedge', pattern: /\b(?:arguably|somewhat|hopefully|not a product)\b|\b(?:tries|aims) to\b|\bI believe\b/i },
  { name: '"honest" or "genuinely"', pattern: /\bhonest(?:ly)?\b|\bgenuinely\b/i },
  {
    name: 'a cliché',
    pattern:
      /\b(?:passionate|results-driven|dynamic|seasoned|synergy|leverag(?:e|es|ed|ing)|spearhead(?:ed|ing)?|cutting-edge|best-in-class|world-class|thought leader|ninja|game-changing|robust|seamless(?:ly)?|holistic|unlock(?:s|ed|ing)?|empower(?:s|ed|ing)?|transformative|proven track record)\b|(?<!customer[- ])\bjourneys?\b/i,
  },
  { name: '"programme"', pattern: /\bprogramme/i },
];

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

  test('the built home page carries none of the wording the copy style guide bans', () => {
    const html = readFileSync('out/index.html', 'utf8');
    for (const { name, pattern } of BANNED_WORDING) {
      const found = pattern.exec(html);
      expect(found, `out/index.html contains ${name}: "${found?.[0]}"`).toBeNull();
    }
  });

  test('the home page has no exclamation mark and no sentence with two em dashes', async ({
    page,
  }) => {
    await open(page, '/');
    const text = (await page.locator('main').textContent()) ?? '';
    expect(text).not.toContain('!');
    for (const sentence of text.split(/(?<=[.?])\s+/)) {
      expect(sentence.split('—').length - 1, sentence).toBeLessThanOrEqual(1);
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
