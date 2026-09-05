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
const MEMO = join(ROOT, 'docs', 'architecture', 'PALETTE-EXCEPTIONS.md');
const AVATAR = join(ROOT, 'app', 'data', 'portfolio', 'avatar.ts');
const AUDIT = join(ROOT, 'scripts', 'validate', 'overhaul_static_audit.mjs');
const HERO_SPEC = join(ROOT, 'tests', 'e2e', 'hero.spec.ts');

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

describe('Palette exceptions register (G-H6)', () => {
  // §0.3-2 / C-8 / CLAUDE.md Prime Directive 4 say black, white and gold only.
  // The 09:10Z Owner correction (pinned as TC-HERO-18) says the hero photograph
  // is in colour. docs/architecture/PALETTE-EXCEPTIONS.md is the register that
  // resolves the two: exactly one chromatic exception — the photograph, a
  // person, not chrome. This block pins that memo against the code so the
  // exception cannot silently widen, and so the colour cannot ship without the
  // memo (colour-without-memo = FAIL). It is the `node --test` half of the
  // pairing "TC-HERO-18 + the palette bundle scan excluding the photo box".
  const memo = () => {
    assert.ok(existsSync(MEMO), `${relative(ROOT, MEMO)} is missing — the exception must be documented`);
    return readFileSync(MEMO, 'utf8');
  };

  it('names exactly one chromatic exception: the hero photograph, a person not chrome', () => {
    const text = memo();
    assert.match(text, /single chromatic element/i, 'memo must state the photograph is the single chromatic element');
    assert.match(text, /photograph/i, 'memo must name the photograph');
    assert.match(text, /a person,? not chrome/i, 'memo must frame the exception as a person, not chrome');
    // No second exception may be smuggled in: the word "exception" appears, but
    // the register asserts singularity in words the guard can check.
    assert.match(text, /There is no second exception\./, 'memo must assert there is no second exception');
  });

  it('cites both binding sources and the reversal cost', () => {
    const text = memo();
    assert.match(text, /§0\.3-2/, 'memo must cite docs/prompt.md §0.3-2');
    assert.match(text, /TC-HERO-18/, 'memo must cite TC-HERO-18');
    assert.match(text, /Reversal cost/i, 'memo must state the reversal cost of desaturating');
    assert.match(text, /desaturate/i, 'memo must record the desaturate alternative');
  });

  it('depends only on raster assets that actually ship', () => {
    // The exception is the PIXELS of the photograph. Prove the pixels exist:
    // every asset the portrait references from avatar.ts is on disk under
    // public/. A memo that documents an exception for a missing file is a lie.
    const avatar = readFileSync(AVATAR, 'utf8');
    const refs = [...avatar.matchAll(/['"](\/assets\/[^'"]+\.(?:avif|webp|png|mp4))['"]/g)].map((m) => m[1]);
    assert.ok(refs.length >= 4, `avatar.ts should reference the still (avif/webp/png) and the loop (mp4); found ${refs.length}`);
    for (const ref of refs) {
      const onDisk = join(ROOT, 'public', ref.replace(/^\//, ''));
      assert.ok(existsSync(onDisk), `${ref} is referenced by avatar.ts but missing at ${relative(ROOT, onDisk)}`);
    }
    // And the memo names those same raster formats, so the register and the
    // component cannot describe different files.
    const text = memo();
    for (const ext of ['avif', 'webp', 'png', 'mp4']) {
      assert.match(text, new RegExp(`\\.${ext}\\b`), `memo must reference the .${ext} media`);
    }
  });

  it('the photo box is excluded from the palette scan by construction, not a skip-list', () => {
    // The exception costs nothing at the gate because every palette scanner
    // reads code, never raster bytes. Pin that invariant on the static audit:
    // checkMono walks app/ and components/ and filters to .ts/.tsx/.css only.
    // If someone ever makes it read raster (or a wider set), this fails and the
    // memo's "excluded by construction" claim must be re-proven.
    const audit = readFileSync(AUDIT, 'utf8');
    assert.match(audit, /walk\(join\(ROOT, 'app'\)\)/, 'checkMono must walk app/');
    assert.match(audit, /walk\(join\(ROOT, 'components'\)\)/, 'checkMono must walk components/');
    assert.match(audit, /\/\\\.\(ts\|tsx\|css\)\$\//, 'checkMono must restrict to .ts/.tsx/.css source');
    // The served-CSS scan (the other describe in this file) reads only
    // out/_next/static/css — assert this test file targets that CSS directory
    // and not any raster path, so the two gates cannot start reading pixels.
    assert.match(CSS_DIR, /out[\\/]_next[\\/]static[\\/]css$/, 'the bundle scan reads the CSS export, not raster assets');
  });

  it('TC-HERO-18 still guards colour + achromatic chrome (the exception is not weakened)', () => {
    // The memo rests on TC-HERO-18. If that test is weakened, the exception is
    // no longer pinned. Read the spec and require the two halves survive.
    const spec = readFileSync(HERO_SPEC, 'utf8');
    // Anchor on the test declaration, not the first mention (the file discusses
    // TC-HERO-18 in a comment above the test). The title itself carries the
    // colour assertion, so matching it proves the guard is not weakened there.
    const title = "TC-HERO-18: the photograph is in colour and its chrome is achromatic";
    const start = spec.indexOf(title);
    assert.ok(start >= 0, `TC-HERO-18 must still exist in tests/e2e/hero.spec.ts with its colour title`);
    const block = spec.slice(start, start + 2000);
    assert.match(block, /not\.toContain\(['"]grayscale['"]\)/, 'TC-HERO-18 must still forbid a grayscale filter');
    assert.match(
      block,
      /chromaticOffenders\(page, PORTRAIT, \[\]\)/,
      'TC-HERO-18 must still sweep the figure chrome with an EMPTY allow-list',
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
