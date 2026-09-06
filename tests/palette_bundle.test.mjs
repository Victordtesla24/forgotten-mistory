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

describe('Palette exceptions register (G-H6) — RETIRED, the register is empty', () => {
  // §0.3-2 / C-8 / CLAUDE.md Prime Directive 4 say black, white and gold only.
  // Between 2026-09-05 and 2026-09-06 docs/architecture/PALETTE-EXCEPTIONS.md
  // carried exactly one chromatic exception — the hero photograph, under the
  // 09:10Z Owner instruction. ADV-REVIEW-20260905T2315Z failed the hero on that
  // exception, and the orchestrator decided under §0.1 that the option which
  // preserves the §14 bar is the mandate's literal palette. The register is now
  // RETIRED and EMPTY, and this block is inverted to enforce that: no exception
  // may be re-declared without the memo being rewritten, and the photograph's
  // monochrome must live in the asset bytes, never in a CSS filter.
  const memo = () => {
    assert.ok(existsSync(MEMO), `${relative(ROOT, MEMO)} is missing — the retirement must stay documented`);
    return readFileSync(MEMO, 'utf8');
  };

  it('declares zero active exceptions and a retired status', () => {
    const text = memo();
    assert.match(text, /\*\*Status:\*\*\s*RETIRED/i, 'the memo header must read Status: RETIRED');
    assert.match(text, /register is empty/i, 'the memo must state the register is empty');
    assert.match(
      text,
      /There are (?:no|zero) active exceptions\./i,
      'the memo must assert there are no active exceptions',
    );
    // A re-declared exception would need one of these words in the present
    // tense; the memo may only speak of the retired one in the past.
    assert.doesNotMatch(
      text,
      /single chromatic element/i,
      'the memo must not still describe the photograph as the site\'s single chromatic element',
    );
  });

  it('records why the exception was retired, and how to reopen one honestly', () => {
    const text = memo();
    assert.match(text, /§0\.3-2/, 'memo must cite docs/prompt.md §0.3-2');
    assert.match(text, /TC-HERO-18/, 'memo must cite the render-time guard TC-HERO-18');
    assert.match(text, /t_w1_h6h5/, 'memo must cite the orchestrator decision that retired it');
    assert.match(text, /ADV-REVIEW-20260905T2315Z/, 'memo must cite the adversarial review that failed the exception');
    assert.match(text, /Reopening/i, 'memo must state what reopening an exception would require');
  });

  it('depends only on raster assets that actually ship', () => {
    // Every asset the portrait references from avatar.ts is on disk under
    // public/. A memo that reasons about missing files is a lie.
    const avatar = readFileSync(AVATAR, 'utf8');
    const refs = [...avatar.matchAll(/['"](\/assets\/[^'"]+\.(?:avif|webp|png|mp4))['"]/g)].map((m) => m[1]);
    assert.ok(refs.length >= 4, `avatar.ts should reference the still (avif/webp/png) and the loop (mp4); found ${refs.length}`);
    for (const ref of refs) {
      const onDisk = join(ROOT, 'public', ref.replace(/^\//, ''));
      assert.ok(existsSync(onDisk), `${ref} is referenced by avatar.ts but missing at ${relative(ROOT, onDisk)}`);
    }
    // The canonical hero video avatar name from docs/prompt.md §0.3-3 is the
    // one the data file points at; the retired duplicate ships no binary.
    assert.ok(
      refs.includes('/assets/my-hero-avatar.mp4'),
      `avatar.ts must point the loop at the canonical /assets/my-hero-avatar.mp4; found ${refs.join(', ')}`,
    );
    assert.equal(
      existsSync(join(ROOT, 'public', 'assets', 'my-avatar.mp4')),
      false,
      'public/assets/my-avatar.mp4 must be gone — the old name is a 301 in firebase.json, not a second binary',
    );
  });

  it('the palette gates still read code, never raster — so the photo is proven elsewhere', () => {
    // Every palette scanner reads code: that is why the photograph's colour
    // could ship past all three, and why the retirement is enforced in the
    // BYTES by tests/hero_assets_monochrome.test.mjs instead. Pin the invariant
    // on the static audit so no one "fixes" this by making a CSS gate guess at
    // pixels.
    const audit = readFileSync(AUDIT, 'utf8');
    assert.match(audit, /walk\(join\(ROOT, 'app'\)\)/, 'checkMono must walk app/');
    assert.match(audit, /walk\(join\(ROOT, 'components'\)\)/, 'checkMono must walk components/');
    assert.match(audit, /\/\\\.\(ts\|tsx\|css\)\$\//, 'checkMono must restrict to .ts/.tsx/.css source');
    assert.match(CSS_DIR, /out[\\/]_next[\\/]static[\\/]css$/, 'the bundle scan reads the CSS export, not raster assets');
    assert.ok(
      existsSync(join(ROOT, 'tests', 'hero_assets_monochrome.test.mjs')),
      'the byte-level portrait guard must exist — it is what replaces the retired exception',
    );
  });

  it('TC-HERO-18 guards monochrome pixels AND forbids a CSS filter standing in for them', () => {
    const spec = readFileSync(HERO_SPEC, 'utf8');
    const title = 'TC-HERO-18: the photograph is monochrome and its chrome is achromatic';
    const start = spec.indexOf(title);
    assert.ok(start >= 0, 'TC-HERO-18 must exist in tests/e2e/hero.spec.ts with its monochrome title');
    const block = spec.slice(start, start + 3500);
    assert.match(block, /not\.toContain\(['"]grayscale['"]\)/, 'TC-HERO-18 must still forbid a grayscale filter');
    assert.match(
      block,
      /chromaticOffenders\(page, PORTRAIT, \[\]\)/,
      'TC-HERO-18 must still sweep the figure chrome with an EMPTY allow-list',
    );
    assert.match(
      block,
      /saturation[\s\S]{0,400}toBeLessThan\(0\.0\d\)/,
      'TC-HERO-18 must assert the painted portrait pixels are unsaturated',
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
