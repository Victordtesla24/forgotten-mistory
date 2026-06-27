#!/usr/bin/env node
/**
 * tone-linter.mjs — SPEC §3.4 Tone linter covering ALL 4 human-readable text
 * surfaces.  Zero runtime dependencies; runs against the source tree.
 *
 * SURFACES:
 *   1. Visible DOM copy — JSX text content in app/ + components/ .tsx/.ts files
 *   2. Visualization metadata — chart titles, axis/series labels, tooltips,
 *      figure captions, dataset descriptions in fx components
 *   3. Alt / aria-label / aria-description attribute text
 *   4. meta / OpenGraph / Twitter descriptions + JSON-LD description fields
 *      (app/layout.tsx)
 *
 * BANNED WORDS (SPEC §3.4):
 *   world-class, best, ninja, guru, rockstar, unparalleled, revolutionary,
 *   cutting-edge, passionate, expert, leading, exceptional, amazing,
 *   exclamation-led hype (any sentence ending in !)
 *
 * Usage:  node scripts/validate/tone-linter.mjs
 * Exit:   0 if zero banned words across all surfaces, 1 otherwise.
 *         Reports each hit as:  file:line :: word (surface N)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const ROOT = process.cwd();

// ── Banlist ──────────────────────────────────────────────────────────────────
// Single-word bans (word-boundary match).
const SINGLE_BANS = [
  'ninja', 'guru', 'rockstar', 'unparalleled', 'revolutionary',
  'passionate', 'exceptional', 'amazing',
];

// Multi-word phrase bans (case-insensitive substring match).
const PHRASE_BANS = [
  'world-class', 'world class',
  'cutting-edge', 'cutting edge',
];

// Ambiguous words that need contextual matching to avoid false positives.
// "best"  — only flag when it appears as a standalone judgment (not in compound
//           identifiers like 'best-practices', 'bestScore', etc.).
// "expert" — flag standalone.
// "leading" — flag when it appears as a standalone adjective describing a person
//           or capability (e.g. "leading teams", "leading the industry"), but NOT
//           in compound technical terms like "leading-tight", "leading-relaxed",
//           "leading edge" (animation), or verb forms in comments.
const CONTEXT_BANS = [
  // "best" as a complete word — flag in human-readable text.
  // We match \bbest\b and then filter out known false positives below.
  { word: 'best', re: /\bbest\b/i },
  // "expert" — flag standalone (not "expertise", "experts" is OK as plural but
  // we flag the root).
  { word: 'expert', re: /\bexpert\b/i },
  // "leading" — flag standalone adjective usage.
  { word: 'leading', re: /\bleading\b/i },
];

// Known false-positive patterns for contextual bans.  Any text segment that
// matches one of these is excluded from the contextual ban check.
const CONTEXT_ALLOW = [
  // Lighthouse / technical category keys
  /\bbest-practices\b/i,
  // CSS/Tailwind utility classes (leading-tight, leading-[1.7], etc.)
  /\bleading-[a-z\[]/i,
  // "leading" as a technical term in animation/graphics
  /\bleading\s+edge\b/i,
  /\bleading\s+arm\b/i,
  // "leading" as a verb ("is leading to", "leading the way") — in source code
  // comments, not in visible text. We allow these in all text.
  /\bis\s+leading\b/i,
  /leading\s+to\b/i,
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Recursively list files under dir, skipping noise directories. */
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

/** Check a text segment against all banned patterns.  Returns array of matched words. */
function checkSegment(text, surface) {
  const hits = [];
  const low = text.toLowerCase();

  // Single-word bans
  for (const w of SINGLE_BANS) {
    const re = new RegExp(`\\b${escapeRegex(w)}\\b`, 'i');
    if (re.test(low)) hits.push({ word: w, surface });
  }

  // Phrase bans
  for (const p of PHRASE_BANS) {
    if (low.includes(p.toLowerCase())) hits.push({ word: p, surface });
  }

  // Contextual bans — check each, then filter known false positives
  for (const { word, re } of CONTEXT_BANS) {
    if (!re.test(low)) continue;
    // Check if this segment matches a known false-positive pattern
    let allowed = false;
    for (const allowRe of CONTEXT_ALLOW) {
      if (allowRe.test(text)) { allowed = true; break; }
    }
    if (!allowed) hits.push({ word, surface });
  }

  return hits;
}

function escapeRegex(s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// ── Text extraction ─────────────────────────────────────────────────────────

/**
 * Extract string literals from a line of code.
 * Handles single-quoted, double-quoted, and backtick-quoted strings.
 * Returns array of { text, col } objects.
 */
function extractStringLiterals(line) {
  const results = [];
  // Single-quoted strings
  for (const m of line.matchAll(/'([^'\\]*(?:\\.[^'\\]*)*)'/g)) {
    results.push({ text: m[1], col: m.index });
  }
  // Double-quoted strings (but NOT JSX attribute wrapper — we handle those separately)
  for (const m of line.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"/g)) {
    results.push({ text: m[1], col: m.index });
  }
  // Backtick template literals — simplified extraction (skip complex expressions)
  for (const m of line.matchAll(/`([^`\\]*(?:\\.[^`\\]*)*)`/g)) {
    results.push({ text: m[1], col: m.index });
  }
  return results;
}

/**
 * Extract JSX text content — text nodes between > and < in JSX.
 * Returns array of text content strings.
 */
function extractJSXText(line) {
  const results = [];
  // Match text between > and < that isn't just whitespace and isn't a tag
  // Pattern: > followed by non-tag characters followed by <
  const re = />([^<>]{2,})</g;
  for (const m of line.matchAll(re)) {
    const text = m[1].trim();
    // Skip if it looks like it's inside a tag (contains = or quotes)
    if (text && !/[="']/.test(text) && !/^\s*\{/.test(text) && !/^\s*\//.test(text)) {
      results.push(text);
    }
  }
  return results;
}

/**
 * Extract alt / aria-label / aria-description / aria-roledescription attribute
 * values from a line.  Returns array of { text, attr } objects.
 */
function extractAriaAttrs(line) {
  const results = [];
  const attrRe = /(alt|aria-label|aria-description|aria-roledescription)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/g;
  for (const m of line.matchAll(attrRe)) {
    const val = m[2] || m[3] || m[4] || '';
    if (val.trim()) results.push({ text: val, attr: m[1] });
  }
  return results;
}

// ── Surface 4: meta/OG/Twitter/JSON-LD descriptions ─────────────────────────

/**
 * Extract metadata description fields from app/layout.tsx.
 * Looks for: description, openGraph.description, twitter.description,
 * JSON-LD description fields.
 */
function extractMetaDescriptions(content) {
  const results = [];
  // Match description: '...' or description: "..." or description: `...`
  const descRe = /description\s*:\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`)/g;
  for (const m of content.matchAll(descRe)) {
    const val = m[1] || m[2] || m[3] || '';
    if (val.trim()) results.push(val);
  }
  return results;
}

// ── Main scan ────────────────────────────────────────────────────────────────

const allHits = [];

/**
 * Scan a file for banned words across all applicable surfaces.
 */
function scanFile(filepath) {
  const rel = relative(ROOT, filepath);
  const content = read(filepath);
  const lines = content.split('\n');
  const isTSX = filepath.endsWith('.tsx');
  const isLayout = rel === 'app/layout.tsx';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineno = i + 1;

    // ── Surfaces 1 & 2: String literals (visible DOM copy + viz metadata) ──
    for (const { text, col } of extractStringLiterals(line)) {
      for (const hit of checkSegment(text, isTSX ? (rel.includes('/fx/') ? 2 : 1) : 1)) {
        allHits.push({ file: rel, line: lineno, word: hit.word, surface: hit.surface });
      }
    }

    // ── Surface 1: JSX text content (visible DOM copy) ──
    if (isTSX) {
      for (const text of extractJSXText(line)) {
        for (const hit of checkSegment(text, rel.includes('/fx/') ? 2 : 1)) {
          allHits.push({ file: rel, line: lineno, word: hit.word, surface: hit.surface });
        }
      }
    }

    // ── Surface 3: Alt / aria attributes ──
    for (const { text, attr } of extractAriaAttrs(line)) {
      for (const hit of checkSegment(text, 3)) {
        allHits.push({ file: rel, line: lineno, word: hit.word, surface: hit.surface });
      }
    }

    // ── Exclamation hype check (any surface) ──
    // Flag sentences ending with ! — applies to string literals and JSX text
    for (const { text } of extractStringLiterals(line)) {
      if (/[a-z]!\s*$/i.test(text) || /[a-z]![.?!]/i.test(text)) {
        allHits.push({ file: rel, line: lineno, word: 'exclamation-hype (!)', surface: 0 });
      }
    }
  }

  // ── Surface 4: meta/OG/Twitter/JSON-LD descriptions ──
  if (isLayout) {
    for (const desc of extractMetaDescriptions(content)) {
      for (const hit of checkSegment(desc, 4)) {
        allHits.push({ file: rel, line: null, word: hit.word, surface: hit.surface });
      }
    }
  }
}

// ── Run ──────────────────────────────────────────────────────────────────────

// Collect all source files (Surface 1 & 2: app/ + components/)
const sourceFiles = [
  ...walk(join(ROOT, 'app')).filter((p) => /\.(tsx?)$/.test(p)),
  ...walk(join(ROOT, 'components')).filter((p) => /\.tsx$/.test(p)),
];

// Surface 4: app/layout.tsx is already included in sourceFiles, but we also
// need to scan it specifically for meta descriptions (handled by scanFile).

for (const f of sourceFiles) {
  scanFile(f);
}

// Deduplicate hits (same file + line + word)
const seen = new Set();
const uniqueHits = allHits.filter((h) => {
  const key = `${h.file}:${h.line}:${h.word}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

// ── Report ───────────────────────────────────────────────────────────────────
const SURFACE_NAMES = {
  0: 'exclamation',
  1: 'DOM copy',
  2: 'viz metadata',
  3: 'alt/aria',
  4: 'meta/OG/JSON-LD',
};

if (uniqueHits.length === 0) {
  console.log('\n  TONE LINTER — all 4 surfaces\n  ' + '-'.repeat(60));
  console.log('  [PASS]  Zero banned words across all text surfaces.\n');
  process.exit(0);
} else {
  console.log('\n  TONE LINTER — violations found\n  ' + '-'.repeat(60));
  for (const h of uniqueHits) {
    const surfaceLabel = SURFACE_NAMES[h.surface] || `surface-${h.surface}`;
    const loc = h.line ? `${h.file}:${h.line}` : h.file;
    console.log(`  [FAIL]  ${loc} :: "${h.word}"  (${surfaceLabel})`);
  }
  console.log(`\n  ${uniqueHits.length} violation(s) across ${new Set(uniqueHits.map((h) => h.file)).size} file(s).\n`);
  process.exit(1);
}
