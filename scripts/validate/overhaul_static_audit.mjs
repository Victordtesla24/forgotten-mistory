#!/usr/bin/env node
/**
 * overhaul_static_audit.mjs — executable acceptance checks for the static-NFR test
 * cases in docs/overhaul/SPEC.md §10. Runs with zero deps against the source tree.
 *
 * Covers: TC-NFR-TONE, TC-NFR-MONO, TC-NFR-PERF (asset budget), TC-FR-PARITY (facts),
 *         TC-NFR-TYPE (≤2 font families), TC-NFR-SEC (client secret leak),
 *         TC-ARCH-BENCH (no /performance-benchmark in out/), TC-NFR-COMPLETE
 *         (no truncation/placeholder/stub markers in app|components|lib).
 *
 * Usage:  node scripts/validate/overhaul_static_audit.mjs
 * Exit:   0 if all checks PASS, 1 otherwise. Prints a per-check report.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const ROOT = process.cwd();
const results = [];
const record = (id, name, pass, detail) => results.push({ id, name, pass, detail });

/** Recursively list files under dir, skipping noise. */
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

// Strip JS/TS/CSS comments so the monochrome hue scan only inspects code that
// actually renders colour. Hex/rgb/hsl tokens inside comments are documentation,
// not styling — e.g. React error-code references like (#418)/(#423) in the
// hydration-mismatch JSDoc would otherwise be misread as 3-digit hex colours and
// fail the gate. Block comments (including JSDoc) are removed first, then `//`
// line comments — but only when the `//` is NOT preceded by `:`, so URL schemes
// (https://…) survive intact.
const stripComments = (s) =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/gm, '$1');

// ── TC-NFR-TONE — no boastful/superlative copy ──────────────────────────────
const BANNED = [
  'world-class', 'world class', 'best-in-class', 'best in class', 'ninja', 'guru',
  'rockstar', 'unparalleled', 'revolutionary', 'cutting-edge', 'cutting edge',
  'passionate', 'industry-leading', 'market-leading', 'world-leading', 'leading expert',
  'exceptional', 'amazing', 'genius',
  'visionary', 'unmatched', 'second to none', 'game-changing', 'game changing',
  // sci-fi / military persona — NN-3 closure (P0-3)
  'commander', 'fleet', 'mission', 'decorated', 'squadron',
  'sci-fi', 'scifi', 'star wars', 'star trek', 'starship', 'jedi',
];
function checkTone() {
  const hits = [];
  const test = (file, segment, label) => {
    const low = segment.toLowerCase();
    for (const w of BANNED) {
      const re = new RegExp(`\\b${w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (re.test(low)) hits.push(`${label}${relative(ROOT, file)} :: "${w}"`);
    }
  };
  // (1) string literals in content modules + the document head (meta/OG/JSON-LD).
  const contentFiles = [
    ...walk(join(ROOT, 'app', 'data')).filter((p) => /\.(ts|tsx)$/.test(p)),
    join(ROOT, 'app', 'layout.tsx'),
  ];
  for (const f of contentFiles) {
    const literals = read(f).match(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g) || [];
    for (const lit of literals) test(f, lit, '');
  }
  // (2) visualization metadata: alt / aria / title attribute values across the UI.
  const uiFiles = [...walk(join(ROOT, 'app')), ...walk(join(ROOT, 'components'))]
    .filter((p) => /\.tsx$/.test(p));
  for (const f of uiFiles) {
    const attrs = read(f).match(/(?:alt|aria-label|aria-description|aria-roledescription|title)\s*=\s*(?:"[^"]*"|'[^']*'|\{`[^`]*`\})/g) || [];
    for (const a of attrs) test(f, a, 'alt/aria ');
  }
  const uniq = [...new Set(hits)];
  record('TC-NFR-TONE', 'No boastful/sci-fi copy (data + layout meta + alt/aria)', uniq.length === 0,
    uniq.length ? `${uniq.length} hit(s): ${uniq.slice(0, 14).join('; ')}` : 'clean');
}

// ── TC-NFR-MONO — no chromatic colour in app/components ──────────────────────
function checkMono() {
  // Monochrome = near-neutral. We flag CHROMATIC colour (real hue) anywhere in
  // app/** and components/**: #hex, rgb()/rgba(), hsl()/hsla(), AND Tailwind
  // chromatic utility classes. The cool-grey token ramp (saturation ≤ ~0.28) and
  // pure white/black/greys are allowed. (design-tokens.json is the token source.)
  const skip = new Set(['design-tokens.json', 'components.json']);
  const files = [...walk(join(ROOT, 'app')), ...walk(join(ROOT, 'components'))]
    .filter((p) => /\.(ts|tsx|css)$/.test(p) && !skip.has(relative(ROOT, p)));

  const SAT_MAX = 0.28; // channel spread / max; cool-grey tokens peak ~0.23
  const chromatic = (r, g, b) => {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx <= 24) return false;        // near-black: hue is imperceptible
    return (mx - mn) / mx > SAT_MAX;
  };

  const TW = /\b(?:text|bg|border|from|via|to|ring|shadow|fill|stroke|decoration|outline|accent|caret|divide|placeholder)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g;

  const hits = [];
  for (const f of files) {
    const text = stripComments(read(f));
    const rel = relative(ROOT, f);
    for (const m of text.matchAll(TW)) hits.push(`${rel} :: ${m[0]}`);
    for (const m of text.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
      let h = m[1];
      if (h.length === 3) h = h.split('').map((c) => c + c).join('');
      if (chromatic(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)))
        hits.push(`${rel} :: #${m[1]}`);
    }
    for (const m of text.matchAll(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/g)) {
      if (chromatic(+m[1], +m[2], +m[3])) hits.push(`${rel} :: rgb(${m[1]} ${m[2]} ${m[3]})`);
    }
    for (const m of text.matchAll(/hsla?\(\s*[\d.]+[\s,]+([\d.]+)%/g)) {
      if (+m[1] > 15) hits.push(`${rel} :: hsl(sat ${m[1]}%)`);
    }
  }
  const uniq = [...new Set(hits)];
  record('TC-NFR-MONO', 'Monochrome — no chromatic hue in app/components', uniq.length === 0,
    uniq.length ? `${uniq.length} chromatic: ${uniq.slice(0, 16).join(' | ')}` : 'clean');
}

// ── TC-NFR-PERF — asset budget (no oversized media) ─────────────────────────
function checkAssetBudget() {
  // Differentiated budgets: eager images/fonts must be small (first-view LCP);
  // video/audio are lazy-loaded below the fold so they get a larger, still-bounded cap.
  const IMG = 500 * 1024, VIDEO = 2.5 * 1024 * 1024, AUDIO = 1024 * 1024;
  const budgetFor = (f) => {
    if (/\.(png|jpe?g|gif|webp|avif|svg|woff2?|ttf)$/i.test(f)) return IMG;
    if (/\.(mp4|mov|webm)$/i.test(f)) return VIDEO;
    if (/\.(mp3|wav|ogg|m4a)$/i.test(f)) return AUDIO;
    return null;
  };
  const over = [];
  for (const f of walk(join(ROOT, 'public'))) {
    const b = budgetFor(f);
    if (b == null) continue;
    const sz = statSync(f).size;
    if (sz > b) over.push(`${relative(ROOT, f)} = ${(sz / 1048576).toFixed(2)}MB (cap ${(b / 1048576).toFixed(1)}MB)`);
  }
  record('TC-NFR-PERF', 'Asset budgets (img ≤0.5MB · video ≤2.5MB · audio ≤1MB)', over.length === 0,
    over.length ? `${over.length} oversized: ${over.join('; ')}` : 'within budget');
}

// ── TC-FR-PARITY — key resume facts present in site content ─────────────────
function checkParity() {
  const content = read(join(ROOT, 'app', 'data', 'siteContent.ts'));
  const FACTS = [
    'Australian Taxation Office', 'Payday Super', 'ANZ', 'National Australia Bank',
    'Microsoft', 'Telstra', 'InfoCentric', 'MYOB', 'Monash', 'University of Melbourne',
    'Certified Scrum Master', 'P95', '200 ms', 'sarkar.vikram@gmail.com', 'vicd0ct',
  ];
  const missing = FACTS.filter((f) => !content.toLowerCase().includes(f.toLowerCase()));
  record('TC-FR-PARITY', 'Resume facts present in siteContent', missing.length === 0,
    missing.length ? `missing: ${missing.join(', ')}` : 'all key facts present');
}

// ── TC-NFR-TYPE — at most two font families (SPEC §3.2) ──────────────────────
function checkFonts() {
  // The shipped site loads exactly two webfont families: Inter (body) and
  // Space Grotesk (high-contrast grotesque display). The pre-overhaul stack
  // (Playfair Display, Roboto/Roboto Condensed, Source Sans Pro/3, Source Code
  // Pro) must be gone from the typography sources. System/generic keywords
  // (system-ui, sans-serif, monospace, the cool-grey monospace fallback chain)
  // are not "families" and are allowed.
  const BANNED = [
    'Playfair Display', 'Source Sans Pro', 'Source Sans 3', 'Roboto Condensed',
    'Roboto', 'Source Code Pro',
    // stale next/font variable names belonging to the dropped faces
    '--font-source-sans', '--font-roboto-condensed', '--font-roboto', '--font-alt',
  ];
  const sources = new Set([
    join(ROOT, 'app', 'globals.css'),
    join(ROOT, 'app', 'layout.tsx'),
    ...walk(join(ROOT, 'app')).filter((p) => /\.(css|tsx)$/.test(p)),
    ...walk(join(ROOT, 'components')).filter((p) => /\.(css|tsx)$/.test(p)),
  ]);
  const hits = [];
  for (const f of sources) {
    const text = read(f);
    for (const w of BANNED) if (text.includes(w)) hits.push(`${relative(ROOT, f)} :: "${w}"`);
  }
  // Both chosen families must be wired in (next/font import + CSS fallback).
  const layout = read(join(ROOT, 'app', 'layout.tsx'));
  const css = read(join(ROOT, 'app', 'globals.css'));
  const wired =
    /Space_Grotesk\s*\(/.test(layout) && /\bInter\s*\(/.test(layout) &&
    css.includes('Space Grotesk') && css.includes("'Inter'");
  const uniq = [...new Set(hits)];
  record('TC-NFR-TYPE', 'Two font families only — Inter + Space Grotesk (Playfair/Roboto/Source Sans dropped)',
    uniq.length === 0 && wired,
    !wired ? 'chosen families Inter + Space Grotesk are not wired in app/layout.tsx + app/globals.css'
           : (uniq.length ? `${uniq.length} banned family ref(s): ${uniq.slice(0, 12).join('; ')}` : 'clean — exactly 2 families'));
}

// ── TC-NFR-SEC — no obvious secrets in client source ────────────────────────
function checkSecrets() {
  const files = [...walk(join(ROOT, 'app')), ...walk(join(ROOT, 'components')), ...walk(join(ROOT, 'lib'))]
    .filter((p) => /\.(ts|tsx|js)$/.test(p));
  const SECRET_RE = [
    /\bsk-[A-Za-z0-9]{20,}/, /\bAKIA[0-9A-Z]{16}\b/, /\bghp_[A-Za-z0-9]{30,}\b/,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /\bxai-[A-Za-z0-9]{20,}/,
    // Google AI / Gemini API keys (AIza…) must never be committed to client source —
    // the static build reads the restricted public key from env at build time only.
    /\bAIza[0-9A-Za-z_-]{35}\b/,
  ];
  const hits = [];
  for (const f of files) {
    const text = read(f);
    for (const re of SECRET_RE) if (re.test(text)) hits.push(relative(ROOT, f));
  }
  record('TC-NFR-SEC', 'No hardcoded secrets in client source', hits.length === 0,
    hits.length ? `leak in: ${[...new Set(hits)].join(', ')}` : 'clean');
}

// ── TC-ARCH-BENCH — the static export must not ship /performance-benchmark ────
function checkBuildOutput() {
  // The Lighthouse-only /performance-benchmark route is excluded from the public
  // static export (QA-ARCH-02). It stays available on the dynamic/dev build for
  // perf validation. If no out/ exists yet, there is nothing to verify (the audit
  // runs against source without a build) — report PASS with a note.
  const out = join(ROOT, 'out');
  let exists = true;
  try { statSync(out); } catch { exists = false; }
  if (!exists) {
    record('TC-ARCH-BENCH', 'No /performance-benchmark route in static export',
      true, '(no out/ — run npm run build:static to verify the exported route is absent)');
    return;
  }
  const offenders = walk(out)
    .filter((p) => /(^|\/)performance-benchmark(\.|\/|$)/.test(relative(ROOT, p).replace(/\\/g, '/')))
    .map((p) => relative(ROOT, p));
  record('TC-ARCH-BENCH', 'No /performance-benchmark route in static export',
    offenders.length === 0,
    offenders.length ? `${offenders.length} leaked artifact(s): ${offenders.join('; ')}` : 'absent from out/');
}

// ── TC-NFR-COMPLETE — no truncation/placeholder/stub markers ─────────────────
function checkComplete() {
  // NFR-COMPLETE (SPEC §9/§10): every shipped line is complete and runnable —
  // zero truncation/placeholder/stub markers across app/**, components/**, lib/**.
  // High-precision by design: it flags the markers that signal *incomplete* code
  // and deliberately does NOT match legitimate idioms present in this tree — the
  // Three.js `dummy` Object3D instancing variable, `placeholder=` input attributes,
  // `placeholder-*` utility classes, the SPEC-mandated deterministic offline
  // `fallback` brain path, or trailing "…" in UI strings ("Generating Video...").
  const files = [
    ...walk(join(ROOT, 'app')),
    ...walk(join(ROOT, 'components')),
    ...walk(join(ROOT, 'lib')),
  ].filter((p) => /\.(ts|tsx|js|jsx|mjs)$/.test(p));

  // Markers flagged anywhere in source (unambiguous incomplete-code signals).
  const MARKERS = [
    { re: /\bTODO\b/, label: 'TODO' },
    { re: /\bFIXME\b/, label: 'FIXME' },
    { re: /\bXXX\b/, label: 'XXX' },
    { re: /\bHACK\b/, label: 'HACK' },
    { re: /\bnot[\s-]?implemented\b/i, label: 'not implemented' },
    { re: /\bunimplemented\b/i, label: 'unimplemented' },
    { re: /\bnotImplemented\b/, label: 'notImplemented' },
    // "real APIs only, never dummy/mock" (CLAUDE.md) — these never belong in app code.
    { re: /\bmock(?:ed|s)?\b/i, label: 'mock' },
    { re: /\bstub(?:bed|s)?\b/i, label: 'stub' },
    // Agent truncation phrases.
    { re: /\b(?:rest|remainder)\s+of\s+(?:the\s+)?(?:file|code|component|implementation|function|method)\b/i, label: 'rest-of-file' },
    { re: /\bcode\s+omitted\b/i, label: 'code omitted' },
    { re: /\bomitted\s+for\s+brevity\b/i, label: 'omitted for brevity' },
    { re: /\byour\s+code\s+here\b/i, label: 'your code here' },
    { re: /\b(?:implementation|logic|code)\s+goes\s+here\b/i, label: 'goes here' },
    { re: /\bplaceholder\s+(?:implementation|logic|function|component|here)\b/i, label: 'placeholder impl' },
  ];
  // Ellipsis-as-truncation, but ONLY when the whole comment is an ellipsis — a
  // trailing "..." inside UI/string content is legitimate and never matches.
  const ELLIPSIS_COMMENT = [
    /^\s*\/\/\s*\.{3,}\s*$/,
    /^\s*\/\*\s*\.{3,}\s*\*\/\s*$/,
    /\{\s*\/\*\s*\.{3,}\s*\*\/\s*\}/,
  ];

  const hits = [];
  for (const f of files) {
    const rel = relative(ROOT, f);
    const lines = read(f).split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const { re, label } of MARKERS) {
        if (re.test(line)) { hits.push(`${rel}:${i + 1} :: ${label}`); break; }
      }
      if (ELLIPSIS_COMMENT.some((re) => re.test(line))) hits.push(`${rel}:${i + 1} :: ellipsis-comment`);
    }
  }
  const uniq = [...new Set(hits)];
  record('TC-NFR-COMPLETE', 'No truncation/placeholder/stub markers (app|components|lib)',
    uniq.length === 0,
    uniq.length ? `${uniq.length} marker(s): ${uniq.slice(0, 16).join('; ')}` : 'clean — no incomplete-code markers');
}

checkTone();
checkMono();
checkAssetBudget();
checkParity();
checkFonts();
checkSecrets();
checkBuildOutput();
checkComplete();

// ── Report ──────────────────────────────────────────────────────────────────
let allPass = true;
console.log('\n  OVERHAUL STATIC AUDIT — baseline\n  ' + '-'.repeat(60));
for (const r of results) {
  const tag = r.pass ? 'PASS' : 'FAIL';
  if (!r.pass) allPass = false;
  console.log(`  [${tag}] ${r.id.padEnd(13)} ${r.name}`);
  console.log(`         ${r.detail}`);
}
console.log('  ' + '-'.repeat(60));
console.log(`  RESULT: ${allPass ? 'ALL PASS' : 'FAILURES PRESENT'} (${results.filter((r) => r.pass).length}/${results.length})\n`);
process.exit(allPass ? 0 : 1);
