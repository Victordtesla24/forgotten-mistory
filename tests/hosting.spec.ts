import { existsSync, readdirSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import { site } from '@/content/site';

import { cacheControlFor, readHostingRedirects } from './support';

const REVALIDATE = 'public, max-age=0, must-revalidate';

/**
 * Every path whose cached copy would go stale on a release: each page at its clean URL
 * (Firebase Hosting serves /privacy, not /privacy.html) and each .txt file, which is the
 * React Server Components payload the client router fetches for a page.
 */
function documentPaths(directory = 'out', prefix = ''): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      return entry.name === '_next' ? [] : documentPaths(`${directory}/${entry.name}`, path);
    }
    if (entry.name === 'index.html') return [prefix || '/'];
    if (entry.name.endsWith('.html')) return [path.slice(0, -'.html'.length)];
    return entry.name.endsWith('.txt') ? [path] : [];
  });
}

// Firebase's own default is an hour, so a page without a rule stays in a reader's cache
// for an hour after a release, still pointing at scripts the release deleted.
test.describe('the hosting headers', { tag: '@desktop' }, () => {
  test('every page and every payload the client router fetches revalidates on each load', () => {
    const paths = documentPaths();
    expect(paths).toEqual(
      expect.arrayContaining(['/', '/privacy', '/terms', '/404', '/index.txt', '/privacy.txt', '/terms.txt']),
    );
    for (const path of paths) expect(cacheControlFor(path), path).toBe(REVALIDATE);
  });
});

// The CV used to be served at /docs/Vik_Resume_Final.pdf; links that were shared with that
// name keep working by a permanent redirect to the file the site serves now.
test.describe('the old CV address', { tag: '@desktop' }, () => {
  test('redirects permanently to the CV the Download CV action serves', () => {
    const rule = readHostingRedirects().find((entry) => entry.source === '/docs/Vik_Resume_Final.pdf');
    expect(rule?.type).toBe(301);
    expect(rule?.destination).toBe(site.cvHref);
    expect(existsSync(`public${rule?.destination}`)).toBe(true);
    expect(existsSync('public/docs/Vik_Resume_Final.pdf')).toBe(false);
  });
});
