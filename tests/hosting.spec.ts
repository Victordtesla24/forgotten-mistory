import { readdirSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import { cacheControlFor } from './support';

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
    if (entry.name === '404.html') return [path];
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
      expect.arrayContaining(['/', '/privacy', '/terms', '/index.txt', '/privacy.txt', '/terms.txt']),
    );
    for (const path of paths) expect(cacheControlFor(path), path).toBe(REVALIDATE);
  });
});
