#!/usr/bin/env node
/**
 * gold_contrast_audit.mjs — executable acceptance checks for the static half of
 * the v6 design-system lock's colour item: what gold is allowed to mean, and
 * which text colours clear WCAG 2.1 AA.
 *
 *   TC-GOLD-SEM     R-21 / R-110 — gold marks a figure with a checkable source,
 *                                  and nothing else. Every gold declaration in
 *                                  the tree must be on the sanctioned evidence
 *                                  inventory (lock §1.3).
 *   TC-GOLD-GROUND  7.2          — gold text is never set on `--ink-500`
 *                                  (4.75:1 — AA-only, and below AA once the
 *                                  mark is dimmed or drawn under 24 px).
 *   TC-AA-INK300    7.2          — `--ink-300` (#6E7178, 4.03:1 on `--ink-900`)
 *                                  is a non-text token. Any text under 24 px
 *                                  painted with it fails 1.4.3 Contrast
 *                                  (Minimum). Disabled controls are exempt
 *                                  (1.4.3 exempts them explicitly).
 *   TC-GUARD-NEG                 — negative corpus: each predicate above is run
 *                                  against a synthetic violation and must flag
 *                                  it. A guard that only ever passes proves
 *                                  nothing.
 *
 * Lock: docs/delivery/evidence/v6-20260903T195241Z/design-system-lock.md §1.1–§1.4.
 * Every ratio printed here is recomputed from the literal token values in
 * app/globals.css with the WCAG 2.1 relative-luminance formula — nothing is
 * copied from the lock.
 *
 * Scope: every authored CSS module under components/**, app/globals.css, and
 * every .ts/.tsx under app/** components/** lib/** that names a gold token.
 * Runs with zero deps against the source tree — no build, no browser.
 *
 * Usage:  node scripts/validate/gold_contrast_audit.mjs
 * Exit:   0 if every check PASSes, 1 otherwise.
 * Writes: reports/gold-contrast-audit.json
 */
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const results = [];
const record = (id, name, failures, detail) =>
  results.push({ id, name, pass: failures.length === 0, count: failures.length, failures, detail });

function walk(dir, acc = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    if (['node_modules', '.next', 'out', '.git', 'coverage', 'reports'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}
const read = (p) => { try { return readFileSync(p, 'utf8'); } catch { return ''; } };
const rel = (p) => relative(ROOT, p);
/** Replace comments with equal-length whitespace so line numbers survive. */
const blankComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

// ── WCAG 2.1 contrast, recomputed from the tokens ───────────────────────────
const hexToRgb = (h) => {
  const s = h.replace('#', '');
  const full = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};
const relLum = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const la = relLum(a), lb = relLum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};
const r2 = (n) => Math.round(n * 100) / 100;

/** Token literals, read out of app/globals.css rather than hard-coded here. */
const GLOBALS = join(ROOT, 'app', 'globals.css');
function readTokens() {
  const src = blankComments(read(GLOBALS));
  const out = {};
  for (const m of src.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) out[m[1]] = m[2];
  return out;
}
const TOKENS = readTokens();
const tokenRgb = (name) => (TOKENS[name] ? hexToRgb(TOKENS[name]) : null);

// ── A rule-block parser for authored CSS ────────────────────────────────────
/** @returns {{file,selector,line,decls:{prop,value,line}[]}[]} */
function rules(file) {
  const src = blankComments(read(file));
  const out = [];
  const stack = [];
  let buf = '';
  let line = 1;
  let selLine = 1;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '\n') { line++; if (!buf.trim()) selLine = line; continue; }
    if (ch === '{') {
      const sel = buf.trim().replace(/\s+/g, ' ');
      stack.push({ selector: sel, line: selLine, decls: [] });
      buf = '';
      selLine = line;
      continue;
    }
    if (ch === '}') {
      const block = stack.pop();
      if (block && !block.selector.startsWith('@')) out.push({ file, ...block });
      buf = '';
      selLine = line;
      continue;
    }
    if (ch === ';') {
      const decl = buf.trim();
      const idx = decl.indexOf(':');
      if (idx > 0 && stack.length) {
        stack[stack.length - 1].decls.push({
          prop: decl.slice(0, idx).trim().toLowerCase(),
          value: decl.slice(idx + 1).trim().replace(/\s+/g, ' '),
          line: selLine,
        });
      }
      buf = '';
      selLine = line;
      continue;
    }
    buf += ch;
  }
  return out;
}

const CSS_FILES = [...walk(join(ROOT, 'components')).filter((p) => p.endsWith('.css')).sort(), GLOBALS];
const SCRIPT_FILES = ['app', 'components', 'lib']
  .flatMap((d) => walk(join(ROOT, d)))
  .filter((p) => /\.(ts|tsx)$/.test(p) && !p.endsWith('.d.ts'))
  .sort();

// ── Predicates (exported shape so the negative corpus can exercise them) ────

const GOLD_TOKEN_RE = /var\(\s*--gold[a-z-]*\s*[,)]/i;
const GOLD_HEX_RE = /#(?:c9a84c|d4b65c|e8d5a3|b0923f)\b/i;
const GOLD_RGB_RE = /rgb\(\s*201\s+168\s+76/i;
const isGoldValue = (v) => GOLD_TOKEN_RE.test(v) || GOLD_HEX_RE.test(v) || GOLD_RGB_RE.test(v);
/** The `--gold*: …` definitions themselves are not usages. */
const isGoldDefinition = (prop) => /^--gold/.test(prop);

const INK300_RE = /var\(\s*--ink-300\s*[,)]/i;
const INK500_RE = /var\(\s*--ink-500\s*[,)]/i;
const TEXT_COLOUR_PROPS = new Set(['color', '-webkit-text-fill-color']);
const DISABLED_SELECTOR_RE = /(^|[^a-z-])(disabled|aria-disabled|:disabled|\[disabled)/i;

/** px of a font-size declaration, or null when it cannot be resolved statically. */
function fontSizePx(value) {
  const v = value.trim();
  let m = v.match(/^([\d.]+)rem$/); if (m) return parseFloat(m[1]) * 16;
  m = v.match(/^([\d.]+)px$/); if (m) return parseFloat(m[1]);
  // clamp(min, pref, max): the smallest rendered size is the one that must clear AA.
  m = v.match(/^clamp\(\s*([\d.]+)(rem|px)\s*,/);
  if (m) return parseFloat(m[1]) * (m[2] === 'rem' ? 16 : 1);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-GOLD-SEM — R-21 / R-110
// Lock §1.3 enumerates every gold surface the site is permitted to carry. Gold
// is a claim ("this figure has a source you can go and check"), so the check is
// semantic, not syntactic: TC-NFR-MONO already proves the *token* discipline
// (no raw hex outside globals.css / palette.ts) and passes today even on a
// declaration that spends gold on a liveness dot. This one proves the *meaning*
// discipline by pinning the inventory.
// ─────────────────────────────────────────────────────────────────────────────
const SANCTIONED = [
  { file: 'components/marks/Caliper.module.css', selector: /\[data-state="sourced"\].*\.arm::(before|after)/, why: 'lock §1.3 #1 — the sourced caliper jaw, the canonical use' },
  { file: 'components/sections/Skills/Skills.module.css', selector: /^\.legendItem:first-child \.legendGlyph$/, why: 'lock §1.3 #3 — the key drawn as the thing it explains' },
  { file: 'components/sections/Skills/Skills.module.css', selector: /^tr\[data-status="production"\] \.statusGlyph$/, why: 'lock §1.3 #2 — "measured in production"' },
  { file: 'components/sections/Skills/Skills.module.css', selector: /^\.table tbody tr\[data-traced\]$/, why: 'lock §1.3 #4 — a 2px inset rule pointing at a sourced row' },
  { file: 'components/sections/Skills/Bench.module.css', selector: /^\.mark\.production$/, why: 'lock §1.3 #5 — the production status dot' },
  { file: 'components/sections/Vitrine/Vitrine.module.css', selector: /^\.live(:hover)?$/, why: 'lock §1.3 #7 — the live repository URL, evidence a reader can click' },
  { file: 'components/sections/Listen/Listen.module.css', selector: /^\.rule$/, why: 'lock §1.3 #8 — the closing hairline, the caliper at one pixel' },
];
const SANCTIONED_SCRIPTS = [
  { file: 'components/sections/Skills/Bench.tsx', match: /stopColor="var\(--gold\)"/, why: 'lock §1.3 #6 — the lit wire, source → capability' },
];

function goldUsages() {
  const uses = [];
  for (const file of CSS_FILES) {
    for (const block of rules(file)) {
      for (const d of block.decls) {
        if (isGoldDefinition(d.prop) || !isGoldValue(d.value)) continue;
        uses.push({ file: rel(file), line: d.line, selector: block.selector, prop: d.prop, value: d.value, kind: 'css' });
      }
    }
  }
  for (const file of SCRIPT_FILES) {
    const lines = read(file).split('\n');
    lines.forEach((text, i) => {
      if (!isGoldValue(text)) return;
      if (/^\s*(\/\/|\*|\/\*)/.test(text)) return; // prose about gold is not a usage
      uses.push({ file: rel(file), line: i + 1, selector: text.trim().slice(0, 120), prop: '(inline)', value: text.trim().slice(0, 120), kind: 'script' });
    });
  }
  return uses;
}

function unsanctionedGold(uses) {
  return uses.filter((u) => {
    if (u.file === 'lib/palette.ts' || u.file === 'app/globals.css' && isGoldDefinition(u.prop)) return false;
    if (u.kind === 'script') {
      if (u.file === 'lib/palette.ts') return false;
      return !SANCTIONED_SCRIPTS.some((s) => s.file === u.file && s.match.test(u.value));
    }
    return !SANCTIONED.some((s) => s.file === u.file && s.selector.test(u.selector));
  });
}

function checkGoldSemantics() {
  const uses = goldUsages().filter((u) => !(u.file === 'lib/palette.ts'));
  const bad = unsanctionedGold(uses);
  const failures = bad.map((u) =>
    `${u.file}:${u.line}  ${u.kind === 'css' ? `${u.selector} { ${u.prop}: ${u.value} }` : u.value}` +
    `  -> gold spent on something that is not a figure with a checkable source`);
  record('TC-GOLD-SEM', 'R-21/R-110 — every gold declaration is on the sanctioned evidence inventory',
    failures, `${uses.length} gold usage(s) found, ${bad.length} outside lock §1.3's inventory`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-GOLD-GROUND — 7.2, lock §1.4 rule 4
// Gold on --ink-500 computes AA-only; the lock bans it for text under 24 px.
// ─────────────────────────────────────────────────────────────────────────────
function goldOnInk500(fileRules) {
  const failures = [];
  for (const block of fileRules) {
    const decls = block.decls;
    const gold = decls.find((d) => TEXT_COLOUR_PROPS.has(d.prop) && isGoldValue(d.value));
    if (!gold) continue;
    const ground = decls.find((d) => /^background(-color)?$/.test(d.prop) && INK500_RE.test(d.value));
    if (!ground) continue;
    const fs = decls.find((d) => d.prop === 'font-size');
    const px = fs ? fontSizePx(fs.value) : 16;
    if (px !== null && px >= 24) continue;
    const ratio = contrast(tokenRgb('--gold') || [201, 168, 76], tokenRgb('--ink-500') || [58, 61, 70]);
    failures.push(`${rel(block.file)}:${gold.line}  ${block.selector} { ${gold.prop}: ${gold.value}; ${ground.prop}: ${ground.value} }` +
      `  -> ${r2(ratio)}:1 at ${px ?? 16}px, below the 4.5:1 floor the lock sets for gold text`);
  }
  return failures;
}

function checkGoldGround() {
  const all = CSS_FILES.flatMap((f) => rules(f));
  const failures = goldOnInk500(all);
  const ratio = r2(contrast(tokenRgb('--gold'), tokenRgb('--ink-500')));
  record('TC-GOLD-GROUND', '7.2 — gold text is never set on --ink-500',
    failures, `--gold on --ink-500 recomputes to ${ratio}:1 (AA only, banned for text under 24px); ${failures.length} rule(s) do it`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-AA-INK300 — 7.2, lock §1.1 + §1.4 rule 6
// ─────────────────────────────────────────────────────────────────────────────
function ink300AsText(fileRules) {
  const failures = [];
  for (const block of fileRules) {
    if (DISABLED_SELECTOR_RE.test(block.selector)) continue;
    for (const d of block.decls) {
      if (!TEXT_COLOUR_PROPS.has(d.prop) || !INK300_RE.test(d.value)) continue;
      const fs = block.decls.find((x) => x.prop === 'font-size');
      const px = fs ? fontSizePx(fs.value) : 16;
      if (px !== null && px >= 24) continue;
      failures.push({ file: rel(block.file), line: d.line, selector: block.selector, px: px ?? 16 });
    }
  }
  return failures;
}

function checkInk300() {
  const all = CSS_FILES.flatMap((f) => rules(f));
  const hits = ink300AsText(all);
  const ratio = r2(contrast(tokenRgb('--ink-300'), tokenRgb('--ink-900')));
  const alt = r2(contrast(tokenRgb('--mist-400'), tokenRgb('--ink-900')));
  const failures = hits.map((h) =>
    `${h.file}:${h.line}  ${h.selector} { color: var(--ink-300) }  -> ${ratio}:1 at ~${h.px}px, needs 4.5:1`);
  record('TC-AA-INK300', '7.2 — --ink-300 is a non-text token (4.03:1 fails 1.4.3 under 24px)',
    failures,
    `--ink-300 on --ink-900 recomputes to ${ratio}:1; the lock's replacement --mist-400 is ${alt}:1; ` +
    `${hits.length} text declaration(s) still on --ink-300`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-GUARD-NEG — negative corpus
// "A guard that only ever passes proves nothing." Each predicate is fed a
// synthetic violation held only in memory (nothing is written to the tree) and
// must flag it.
// ─────────────────────────────────────────────────────────────────────────────
function checkNegativeCorpus() {
  const failures = [];

  // 1. TC-GOLD-SEM must reject gold spent on an arbitrary selector.
  const fakeUse = [{ file: 'components/sections/Hero/Hero.module.css', line: 1, selector: '.decorativeFlourish', prop: 'background', value: 'var(--gold)', kind: 'css' }];
  if (unsanctionedGold(fakeUse).length !== 1) {
    failures.push('TC-GOLD-SEM did not flag a synthetic `.decorativeFlourish { background: var(--gold) }` — the inventory predicate is blind');
  }
  // …and must still accept a genuinely sanctioned one.
  const goodUse = [{ file: 'components/sections/Vitrine/Vitrine.module.css', line: 1, selector: '.live', prop: 'color', value: 'var(--gold)', kind: 'css' }];
  if (unsanctionedGold(goodUse).length !== 0) {
    failures.push('TC-GOLD-SEM flagged the sanctioned `.live { color: var(--gold) }` — the inventory predicate over-fires');
  }

  // 2. TC-GOLD-GROUND must reject gold text on an --ink-500 ground.
  const fakeGround = [{
    file: join(ROOT, 'synthetic.css'), selector: '.badge', line: 1,
    decls: [
      { prop: 'color', value: 'var(--gold)', line: 1 },
      { prop: 'background', value: 'var(--ink-500)', line: 2 },
      { prop: 'font-size', value: '0.7rem', line: 3 },
    ],
  }];
  if (goldOnInk500(fakeGround).length !== 1) {
    failures.push('TC-GOLD-GROUND did not flag synthetic gold text on an --ink-500 ground — the predicate is blind');
  }
  const okGround = [{
    file: join(ROOT, 'synthetic.css'), selector: '.badge', line: 1,
    decls: [
      { prop: 'color', value: 'var(--gold)', line: 1 },
      { prop: 'background', value: 'var(--ink-900)', line: 2 },
    ],
  }];
  if (goldOnInk500(okGround).length !== 0) {
    failures.push('TC-GOLD-GROUND flagged gold on --ink-900 (8.62:1) — the predicate over-fires');
  }

  // 3. TC-AA-INK300 must reject small --ink-300 text and accept a disabled control.
  const fakeInk = [{
    file: join(ROOT, 'synthetic.css'), selector: '.caption', line: 1,
    decls: [{ prop: 'color', value: 'var(--ink-300)', line: 1 }, { prop: 'font-size', value: '0.7rem', line: 2 }],
  }];
  if (ink300AsText(fakeInk).length !== 1) {
    failures.push('TC-AA-INK300 did not flag synthetic 0.7rem --ink-300 text — the predicate is blind');
  }
  const okInk = [{
    file: join(ROOT, 'synthetic.css'), selector: '.button:disabled', line: 1,
    decls: [{ prop: 'color', value: 'var(--ink-300)', line: 1 }],
  }];
  if (ink300AsText(okInk).length !== 0) {
    failures.push('TC-AA-INK300 flagged a disabled control, which 1.4.3 exempts — the predicate over-fires');
  }

  // 4. The contrast arithmetic itself must reproduce two values that can be
  //    checked by hand against the WCAG 2.1 formula.
  const white = contrast([255, 255, 255], [0, 0, 0]);
  if (Math.abs(white - 21) > 0.01) failures.push(`relative-luminance contrast() returned ${r2(white)}:1 for white-on-black; WCAG 2.1 defines 21:1`);
  const self = contrast([120, 120, 120], [120, 120, 120]);
  if (Math.abs(self - 1) > 0.001) failures.push(`contrast() returned ${r2(self)}:1 for a colour against itself; must be 1:1`);

  record('TC-GUARD-NEG', 'negative corpus — every predicate above flags a deliberate violation',
    failures, `${failures.length} predicate(s) failed to detect or over-fired on the synthetic corpus`);
}

// ── Run ─────────────────────────────────────────────────────────────────────
checkGoldSemantics();
checkGoldGround();
checkInk300();
checkNegativeCorpus();

let allPass = true;
console.log('\n  GOLD SEMANTICS · WCAG AA CONTRAST AUDIT — R-21 / R-110 / 7.2\n  ' + '-'.repeat(72));
for (const r of results) {
  if (!r.pass) allPass = false;
  console.log(`  [${r.pass ? 'PASS' : 'FAIL'}] ${r.id.padEnd(16)} ${r.name}`);
  console.log(`         ${r.detail}`);
  for (const f of r.failures) console.log(`           · ${f}`);
}
console.log('  ' + '-'.repeat(72));
const passed = results.filter((r) => r.pass).length;
console.log(`  RESULT: ${allPass ? 'ALL PASS' : 'FAILURES PRESENT'} (${passed}/${results.length} checks, ` +
  `${results.reduce((n, r) => n + r.count, 0)} assertion failures)\n`);

const REPORT_DIR = join(ROOT, 'reports');
try { mkdirSync(REPORT_DIR, { recursive: true }); } catch { /* exists */ }
writeFileSync(join(REPORT_DIR, 'gold-contrast-audit.json'), JSON.stringify({
  timestamp: new Date().toISOString(),
  result: allPass ? 'PASS' : 'FAIL',
  tokens: { '--gold': TOKENS['--gold'], '--ink-300': TOKENS['--ink-300'], '--ink-500': TOKENS['--ink-500'], '--ink-900': TOKENS['--ink-900'], '--mist-400': TOKENS['--mist-400'] },
  summary: { total: results.length, passed, failed: results.length - passed,
    assertionFailures: results.reduce((n, r) => n + r.count, 0) },
  checks: results,
}, null, 2) + '\n');
console.log('  JSON report -> reports/gold-contrast-audit.json\n');

process.exit(allPass ? 0 : 1);
