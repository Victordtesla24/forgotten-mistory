#!/usr/bin/env node
/**
 * tone-linter.mjs — SPEC §3.4 Tone linter covering ALL 4 human-readable text
 * surfaces.  Zero runtime dependencies; runs against the source tree.
 *
 * SURFACES:
 *   1. Visible DOM copy — JSX text content + string literals in app/ + components/
 *   2. Visualization metadata — chart titles, axis/series labels, tooltips,
 *      figure captions, dataset descriptions in fx/ components
 *   3. Alt / aria-label / aria-description attribute text
 *   4. meta / OpenGraph / Twitter descriptions + JSON-LD description fields
 *      in app/layout.tsx
 *
 * BANNED WORDS (SPEC §3.4) — mapped to practical patterns that catch boastful/
 * superlative tone while avoiding false positives on conversational usage.
 * "best" and "leading" are phrase-matched to avoid false positives in
 * conversational contexts; the unambiguous hype words are whole-word matched.
 *
 * Usage:  node scripts/validate/tone-linter.mjs
 * Exit:   0 if zero banned words across all surfaces, 1 otherwise.
 *         Reports each hit as:  file:line :: "word" (surface N)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

// ── Banned patterns ─────────────────────────────────────────────────────────
// Each entry is { word: display-name, re: RegExp }.
// Patterns use word boundaries and are case-insensitive.
const BANNED_PATTERNS = [
  // Unambiguous hype / persona words — flag anywhere in human-readable text
  { word: 'ninja',              re: /\bninja(s)?\b/i },
  { word: 'guru',               re: /\bguru(s)?\b/i },
  { word: 'rockstar',           re: /\brockstar(s)?\b/i },
  { word: 'unparalleled',       re: /\bunparalleled\b/i },
  { word: 'revolutionary',      re: /\brevolutionary\b/i },
  { word: 'world-class',        re: /\bworld[- ]class\b/i },
  { word: 'cutting-edge',       re: /\bcutting[- ]edge\b/i },
  { word: 'exceptional',        re: /\bexceptional\b/i },
  { word: 'amazing',            re: /\bamazing\b/i },
  { word: 'visionary',          re: /\bvisionary\b/i },
  { word: 'unmatched',          re: /\bunmatched\b/i },
  { word: 'genius',             re: /\bgenius\b/i },
  { word: 'game-changing',      re: /\bgame[- ]changing\b/i },
  { word: 'second to none',     re: /\bsecond to none\b/i },

  // "best" — boastful compound phrases only (not conversational "best way")
  { word: 'best-in-class',      re: /\bbest[- ]in[- ]class\b/i },
  { word: 'best-of-breed',      re: /\bbest[- ]of[- ]breed\b/i },

  // "leading" — boastful compound phrases only
  { word: 'industry-leading',   re: /\bindustry[- ]leading\b/i },
  { word: 'market-leading',     re: /\bmarket[- ]leading\b/i },
  { word: 'world-leading',      re: /\bworld[- ]leading\b/i },
  { word: 'leading expert',     re: /\bleading\s+expert\b/i },

  // "expert" in boastful contexts
  { word: 'renowned expert',    re: /\brenowned\s+expert\b/i },
  { word: 'world-renowned',     re: /\bworld[- ]renowned\b/i },

  // "passionate"
  { word: 'passionate',         re: /\bpassionate\b/i },

  // Sci-fi / military persona terms (NN-3 closure)
  { word: 'commander',          re: /\bcommander\b/i },
  { word: 'fleet',              re: /\bfleet\b/i },
  { word: 'decorated',          re: /\bdecorated\b/i },
  { word: 'squadron',           re: /\bsquadron\b/i },
  { word: 'sci-fi',             re: /\bsci[- ]fi\b/i },
  { word: 'scifi',              re: /\bscifi\b/i },
  { word: 'star wars',          re: /\bstar wars\b/i },
  { word: 'star trek',          re: /\bstar trek\b/i },
  { word: 'starship',           re: /\bstarship\b/i },
  { word: 'jedi',               re: /\bjedi\b/i },
];

// Known false-positive patterns. A text segment matching any of these is
// excluded from ALL banned-word checks for that segment.
const ALLOW_PATTERNS = [
  /\bbest-practices\b/i,                      // Lighthouse categories
  /\bleading-[a-z\[]/i,                       // CSS/Tailwind: leading-tight, leading-[1.7]
  /\bleading\s+edge\b/i,                      // Animation: "leading edge"
  /\bleading\s+arm\b/i,                       // Graphics: "leading arm"
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function walk(dir, acc = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    if (['node_modules', '.next', 'out', '.git', 'coverage', 'reports',
         '.turbo', 'dist', 'build', '.cache', 'test-results',
         'playwright-report'].includes(e.name))
      continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const read = (p) => { try { return readFileSync(p, 'utf8'); } catch { return ''; } };

function checkSegment(text) {
  // If the whole segment matches a known false positive, skip it entirely.
  for (const allowRe of ALLOW_PATTERNS) {
    if (allowRe.test(text)) return [];
  }
  const hits = [];
  for (const { word, re } of BANNED_PATTERNS) {
    if (re.test(text)) hits.push(word);
  }
  return hits;
}

function checkExclamation(text) {
  return /[a-z]!\s*$/i.test(text) || /[a-z]!\s*["'`]/i.test(text) || /[a-z]![.?!]/i.test(text);
}

// ── Text extraction ─────────────────────────────────────────────────────────

function extractStringLiterals(line) {
  const results = [];
  for (const m of line.matchAll(/'([^'\\]*(?:\\.[^'\\]*)*)'/g)) {
    if (m[1].trim()) results.push(m[1]);
  }
  for (const m of line.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"/g)) {
    if (m[1].trim()) results.push(m[1]);
  }
  for (const m of line.matchAll(/`([^`\\]*(?:\\.[^`\\]*)*)`/g)) {
    if (m[1].trim() && !m[1].includes('${')) results.push(m[1]);
  }
  return results;
}

function extractJSXText(line) {
  const results = [];
  const re = />([^<>]{2,})</g;
  for (const m of line.matchAll(re)) {
    const text = m[1].trim();
    if (text && !/[="']/.test(text) && !/^\s*\{/.test(text) && !/^\s*\//.test(text)) {
      results.push(text);
    }
  }
  return results;
}

function extractAriaAttrs(line) {
  const results = [];
  const attrRe = /(alt|aria-label|aria-description|aria-roledescription)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/g;
  for (const m of line.matchAll(attrRe)) {
    const val = m[2] || m[3] || m[4] || '';
    if (val.trim()) results.push(val);
  }
  return results;
}

function extractMetaDescriptions(content) {
  const results = [];
  const descRe = /description\s*:\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`)/g;
  for (const m of content.matchAll(descRe)) {
    const val = m[1] || m[2] || m[3] || '';
    if (val.trim()) results.push(val);
  }
  return results;
}

// ── Scan ─────────────────────────────────────────────────────────────────────

const SURFACE_NAMES = { 0: 'exclamation', 1: 'DOM copy', 2: 'viz metadata', 3: 'alt/aria', 4: 'meta/OG/JSON-LD' };
const allHits = [];

function scanFile(filepath) {
  const rel = relative(ROOT, filepath);
  const content = read(filepath);
  const lines = content.split('\n');
  const isTSX = filepath.endsWith('.tsx');
  const isLayout = rel === 'app/layout.tsx';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineno = i + 1;

    // Determine surface for this file's text content.
    // FX components → surface 2 (viz metadata); everything else → surface 1 (DOM copy).
    const textSurface = rel.includes('/fx/') || rel.includes('\\fx\\') ? 2 : 1;

    // Surface 1 & 2: String literals
    for (const text of extractStringLiterals(line)) {
      for (const word of checkSegment(text)) {
        allHits.push({ file: rel, line: lineno, word, surface: textSurface });
      }
    }

    // Surface 1 & 2: JSX text content (TSX files only)
    if (isTSX) {
      for (const text of extractJSXText(line)) {
        for (const word of checkSegment(text)) {
          allHits.push({ file: rel, line: lineno, word, surface: textSurface });
        }
      }
    }

    // Surface 3: Alt / aria attributes
    for (const text of extractAriaAttrs(line)) {
      for (const word of checkSegment(text)) {
        allHits.push({ file: rel, line: lineno, word, surface: 3 });
      }
    }

    // Exclamation hype check — string literals
    for (const text of extractStringLiterals(line)) {
      if (checkExclamation(text)) {
        allHits.push({ file: rel, line: lineno, word: 'exclamation-hype', surface: 0 });
        break;
      }
    }
    // Exclamation hype check — JSX text
    if (isTSX) {
      for (const text of extractJSXText(line)) {
        if (checkExclamation(text)) {
          allHits.push({ file: rel, line: lineno, word: 'exclamation-hype', surface: 0 });
          break;
        }
      }
    }
  }

  // Surface 4: meta/OG/Twitter/JSON-LD descriptions (app/layout.tsx only)
  if (isLayout) {
    for (const desc of extractMetaDescriptions(content)) {
      for (const word of checkSegment(desc)) {
        allHits.push({ file: rel, line: null, word, surface: 4 });
      }
    }
  }
}

// ── Run ──────────────────────────────────────────────────────────────────────

const sourceFiles = [
  ...walk(join(ROOT, 'app')).filter((p) => /\.(tsx?)$/.test(p)),
  ...walk(join(ROOT, 'components')).filter((p) => /\.tsx$/.test(p)),
];

for (const f of sourceFiles) {
  scanFile(f);
}

// Deduplicate (same file + line + word)
const seen = new Set();
const uniqueHits = allHits.filter((h) => {
  const key = `${h.file}:${h.line}:${h.word}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

// ── Report ───────────────────────────────────────────────────────────────────
if (uniqueHits.length === 0) {
  console.log('\n  TONE LINTER — all 4 surfaces');
  console.log('  ' + '-'.repeat(60));
  console.log('  [PASS]  Zero banned words across all text surfaces.');
  console.log(`  Scanned ${sourceFiles.length} source files in app/ + components/.`);
  console.log('  Surfaces covered: DOM copy, viz metadata, alt/aria, meta/OG/JSON-LD\n');
  process.exit(0);
} else {
  console.log('\n  TONE LINTER — violations found');
  console.log('  ' + '-'.repeat(60));
  for (const h of uniqueHits) {
    const surfaceLabel = SURFACE_NAMES[h.surface] || `surface-${h.surface}`;
    const loc = h.line ? `${h.file}:${h.line}` : h.file;
    console.log(`  [FAIL]  ${loc} :: "${h.word}"  (${surfaceLabel})`);
  }
  console.log(`\n  ${uniqueHits.length} violation(s) across ${new Set(uniqueHits.map((h) => h.file)).size} file(s).\n`);
  process.exit(1);
}
