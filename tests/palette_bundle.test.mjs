/**
 * palette_bundle.test.mjs — the palette contract, checked where a reader
 * actually meets it: the CSS that ships.
 *
 * docs/prompt.md §0.3-2 / C-8: black, white and gold only, and gold means one
 * thing — this figure has a source. TC-NFR-MONO in the static audit enforces
 * that over app/** and components/** SOURCE. Two classes of violation get past
 * it, and both were live on 9ba97a5c:
 *
 *   1. Colour we never wrote. Tailwind v4 auto-detects its own sources; before
 *      this test, `@import "tailwindcss"` let it scan the whole repository, so
 *      class names quoted in reports/post-prod/lighthouse-production.json and
 *      similar compiled `.bg-red-500`, `.text-blue-500`, `.stroke-amber-400`
 *      and friends into the served bundle. No component rendered any of them.
 *   2. Hue too faint for a saturation *ratio* to catch. `rgb(232 235 240)` is
 *      3% saturation by that measure — under the source gate's 28% bar — and a
 *      visible blue cast when it is a 26%-alpha rim light over near-black.
 *
 * So this test reads out/_next/static/css/*.css and applies the absolute rule:
 * channel spread > 6 is a hue, and gold is the only hue allowed.
 *
 * Usage:  npm run build:static && node --test tests/palette_bundle.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { scanCss, collectCss, SPREAD_MAX } from '../scripts/validate/css_chroma_scan.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CSS_DIR = join(ROOT, 'out', '_next', 'static', 'css');
const GLOBALS = join(ROOT, 'app', 'globals.css');

const BUILD_HINT = 'run `npm run build:static` first — this test reads the static export, not the source';

describe('Served CSS palette (bundle level)', () => {
  it('the static export ships stylesheets to scan', () => {
    assert.ok(existsSync(CSS_DIR), `${relative(ROOT, CSS_DIR)} is missing — ${BUILD_HINT}`);
    assert.ok(collectCss(CSS_DIR).length > 0, `no .css under ${relative(ROOT, CSS_DIR)} — ${BUILD_HINT}`);
  });

  it('carries no chromatic non-gold colour and no Tailwind hue utility', () => {
    const findings = [];
    for (const file of collectCss(CSS_DIR)) {
      const result = scanCss(readFileSync(file, 'utf8'), relative(ROOT, file));
      findings.push(...result.findings);
    }
    assert.deepEqual(
      findings,
      [],
      `${findings.length} chromatic value(s) in the served CSS `
      + `(rule: sRGB channel spread > ${SPREAD_MAX}, OKLCH chroma, HSL saturation, or a hue utility; `
      + `gold is the one sanctioned hue):\n  ${findings.join('\n  ')}`,
    );
  });
});

describe('Tailwind source detection', () => {
  it('scans only the directories that render markup', () => {
    // Tailwind v4 ignores the v3 `content` array and auto-detects sources from
    // the repository root. Every JSON report, markdown note and kanban task
    // that happens to quote a class name then becomes a rule in the bundle.
    // `source(none)` turns that off; the @source lines put it back, narrowly.
    const css = readFileSync(GLOBALS, 'utf8');
    assert.match(
      css,
      /@import\s+["']tailwindcss["']\s+source\(none\)\s*;/,
      'app/globals.css must import Tailwind with source(none) — a bare '
      + '`@import "tailwindcss"` lets v4 scan the whole repository',
    );
    for (const dir of ['../app', '../components']) {
      assert.match(
        css,
        new RegExp(`@source\\s+["']${dir.replace('.', '\\.')}["']\\s*;`),
        `app/globals.css must declare @source "${dir}"`,
      );
    }
  });
});
