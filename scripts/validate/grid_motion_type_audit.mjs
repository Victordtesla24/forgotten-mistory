#!/usr/bin/env node
/**
 * grid_motion_type_audit.mjs — executable acceptance checks for the three
 * static halves of the v6 design-system lock's spatial / motion / type items.
 *
 *   TC-NFR-GRID   R-48 / SC-29.1 — every spacing value resolves to the 8-point scale
 *   TC-NFR-MOTION R-46 / SC-27.1 — 200–450 ms interface, 600–1200 ms cinematic,
 *                                  custom cubic-bezier only, compositor-safe only
 *   TC-NFR-SCALE  R-47 / SC-28.1 — a modular type scale exists and every module
 *                                  consumes it (no literal font sizes)
 *   TC-NFR-TOKENS R-47 / R-48    — design-tokens.json describes the shipped system
 *
 * Lock: docs/delivery/evidence/v6-20260903T195241Z/design-system-lock.md §2.2, §3, §4.
 *
 * Scope: the eleven authored CSS modules under components/** plus app/globals.css.
 * Runs with zero deps against the source tree — no build, no browser.
 *
 * Usage:  node scripts/validate/grid_motion_type_audit.mjs
 * Exit:   0 if every check PASSes, 1 otherwise.
 * Writes: reports/grid-motion-type-audit.json
 */
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

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
const blankComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

/**
 * Collapse every `var(...)` call — including a fallback that itself contains
 * parentheses, e.g. `var(--motion-ease-emphasized, cubic-bezier(0.2, 0, 0, 1))`
 * — to whitespace, so only values authored *outside* the token set remain.
 * Paren-matched rather than regex-matched: a regex cannot balance nesting, and
 * a half-stripped `var(--motion-ease-standard` leaves the substring "ease"
 * behind, which the timing-keyword scan would then read as a keyword.
 */
function stripVar(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (s.startsWith('var(', i)) {
      let depth = 0, j = i;
      for (; j < s.length; j++) {
        if (s[j] === '(') depth++;
        else if (s[j] === ')') { depth--; if (depth === 0) break; }
      }
      out += ' ';
      i = j;
      continue;
    }
    out += s[i];
  }
  return out;
}

const MODULE_CSS = walk(join(ROOT, 'components')).filter((p) => p.endsWith('.css')).sort();
const GLOBALS = join(ROOT, 'app', 'globals.css');
const ALL_CSS = [...MODULE_CSS, GLOBALS];

/**
 * Flatten a stylesheet into { file, line, prop, value, selector, inReducedMotion }.
 * A hand-rolled walker is enough: these files are authored CSS, not minified.
 */
function declarations(file) {
  const src = blankComments(read(file));
  const out = [];
  const lines = src.split('\n');
  let selector = '';
  let pendingSelector = '';
  let reducedDepth = -1;
  let depth = 0;
  let buf = null;
  const atStack = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // Track block open/close and at-rules on this line before reading declarations.
    for (const ch of line) {
      if (ch === '{') {
        depth++;
        if (/@media[^{]*prefers-reduced-motion/i.test(pendingSelector) && reducedDepth === -1) reducedDepth = depth;
        atStack.push(pendingSelector.trim());
        if (!/^@/.test(pendingSelector.trim())) selector = pendingSelector.trim();
        pendingSelector = '';
      } else if (ch === '}') {
        if (reducedDepth === depth) reducedDepth = -1;
        depth--;
        atStack.pop();
        selector = atStack.filter((s) => s && !/^@/.test(s)).slice(-1)[0] || '';
        pendingSelector = '';
      } else if (ch === ';') {
        pendingSelector = '';
      } else {
        pendingSelector += ch;
      }
    }
    // Declarations: a multi-line value is joined forward until its `;`.
    const declRe = /(^|[;{])\s*([A-Za-z-]+)\s*:\s*([^;{}]*)(;|$)/g;
    let m;
    while ((m = declRe.exec(line)) !== null) {
      const prop = m[2].toLowerCase();
      let value = m[3];
      let endLine = i;
      if (!m[4]) { // value continues onto following lines
        for (let j = i + 1; j < lines.length && j < i + 12; j++) {
          const chunk = lines[j];
          const stop = chunk.search(/[;{}]/);
          value += ' ' + (stop === -1 ? chunk : chunk.slice(0, stop));
          endLine = j;
          if (stop !== -1) break;
        }
      }
      out.push({
        file, line: i + 1, endLine, prop, value: value.trim(), selector,
        inReducedMotion: reducedDepth !== -1,
      });
    }
  }
  return out;
}

const ALL_DECLS = ALL_CSS.flatMap(declarations);
const MODULE_DECLS = ALL_DECLS.filter((d) => d.file !== GLOBALS);

// ─────────────────────────────────────────────────────────────────────────────
// TC-NFR-GRID — R-48 / SC-29.1
// Lock §3.3 rule 5: "fail on any literal length that is not a multiple of 8px,
// allowing the Class C exemptions and --space-05."
// Relative units (em/%/vh/vw/ch/vmin/vmax) are excluded exactly as the lock's own
// audit excluded them: they do not resolve to a fixed pixel step.
// ─────────────────────────────────────────────────────────────────────────────
const SPACING_PROPS = new Set([
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'margin-block', 'margin-block-start', 'margin-block-end',
  'margin-inline', 'margin-inline-start', 'margin-inline-end',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'padding-block', 'padding-block-start', 'padding-block-end',
  'padding-inline', 'padding-inline-start', 'padding-inline-end',
  'gap', 'row-gap', 'column-gap',
  'top', 'right', 'bottom', 'left',
  'inset', 'inset-block', 'inset-block-start', 'inset-block-end',
  'inset-inline', 'inset-inline-start', 'inset-inline-end',
]);
const SPACE_TOKENS = [
  ['--space-0', '0'], ['--space-05', '0.25rem'], ['--space-1', '0.5rem'],
  ['--space-2', '1rem'], ['--space-3', '1.5rem'], ['--space-4', '2rem'],
  ['--space-5', '2.5rem'], ['--space-6', '3rem'], ['--space-8', '4rem'],
  ['--space-10', '5rem'], ['--space-14', '7rem'], ['--space-20', '10rem'],
];

function checkGrid() {
  const failures = [];
  for (const d of MODULE_DECLS) {
    if (!SPACING_PROPS.has(d.prop)) continue;
    const bare = stripVar(d.value);
    const lengths = bare.match(/-?\d*\.?\d+(?:px|rem)\b/g) || [];
    for (const lit of lengths) {
      const n = parseFloat(lit);
      const px = lit.endsWith('rem') ? n * 16 : n;
      // Class C exemption (lock §3.2): 1px hairline rules and the -1px
      // visually-hidden clip are optical, one device pixel, not rhythm.
      if (Math.abs(px) === 1) continue;
      if (px % 8 === 0) continue;
      failures.push(
        `${rel(d.file)}:${d.line}  ${d.prop}: ${d.value}  -> ${lit} = ${px}px  ` +
        `[${px % 4 === 0 ? '4pt half-step' : 'OFF-GRID'}]`
      );
    }
  }
  record('TC-NFR-GRID', 'R-48/SC-29.1 — every spacing literal resolves to the 8-point scale',
    failures, `${failures.length} non-conforming spacing value(s) across ${MODULE_CSS.length} module(s)`);

  // The scale must exist as consumable custom properties, or no module *can* be
  // on-grid without typing a literal (lock §3.1, §3.3).
  const globals = blankComments(read(GLOBALS));
  const missing = SPACE_TOKENS
    .filter(([name]) => !new RegExp(`^\\s*${name}\\s*:`, 'm').test(globals))
    .map(([name, value]) => `app/globals.css :root is missing ${name} (expected ${value})`);
  record('TC-NFR-GRID-TOKENS', 'R-48/SC-29.1 — the 8-point scale is declared as --space-* custom properties',
    missing, `${SPACE_TOKENS.length - missing.length}/${SPACE_TOKENS.length} --space-* tokens declared`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-NFR-MOTION — R-46 / SC-27.1
// ─────────────────────────────────────────────────────────────────────────────
const toMs = (lit) => {
  const n = parseFloat(lit);
  return /ms$/.test(lit) ? n : n * 1000;
};
const inBand = (ms) => (ms >= 200 && ms <= 450) || (ms >= 600 && ms <= 1200);
const DURATION_PROPS = new Set(['transition', 'transition-duration', 'animation', 'animation-duration']);
const EASING_KEYWORDS = /\b(ease|ease-in|ease-out|ease-in-out|linear|step-start|step-end)\b/;
// `linear-gradient` / `steps()` must not be mistaken for a timing keyword.
const stripNonTiming = (s) => s.replace(/linear-gradient/g, ' ').replace(/steps\([^)]*\)/g, ' ');

function checkMotionTokens() {
  const failures = [];
  for (const d of ALL_DECLS) {
    if (d.file !== GLOBALS) continue;
    if (!/^--motion-[a-z-]*(fast|base|slow|emphatic|cine[a-z-]*)$/.test(d.prop)) continue;
    const lit = (d.value.match(/-?\d*\.?\d+m?s\b/) || [])[0];
    if (!lit) continue;
    const ms = toMs(lit);
    if (!inBand(ms)) {
      failures.push(
        `${rel(d.file)}:${d.line}  ${d.prop}: ${d.value}  -> ${ms}ms is in neither R-46 band ` +
        `(interface 200–450ms, cinematic 600–1200ms)`
      );
    }
  }
  record('TC-NFR-MOTION-TOKENS', 'R-46/SC-27.1 — every --motion-* duration token sits inside an R-46 band',
    failures, `${failures.length} out-of-band motion token(s)`);
}

function checkMotionBands() {
  const failures = [];
  for (const d of ALL_DECLS) {
    if (!DURATION_PROPS.has(d.prop)) continue;
    // The prefers-reduced-motion neutralisation blocks are governed by the lock's
    // separate reduced-motion item (§4.3), not by the R-46 duration bands.
    if (d.inReducedMotion) continue;
    const bare = stripVar(d.value);
    // In `transition`/`animation` shorthand the FIRST time value is the duration
    // and the second is the delay; `animation-delay`/`transition-delay` are not
    // durations at all and never reach here.
    const times = bare.match(/-?\d*\.?\d+m?s\b/g) || [];
    if (times.length === 0) continue;
    // Multi-value shorthands are comma-separated; take the first time of each part.
    const parts = bare.split(',');
    for (const part of parts) {
      const t = (part.match(/-?\d*\.?\d+m?s\b/) || [])[0];
      if (!t) continue;
      const ms = toMs(t);
      if (!inBand(ms)) {
        failures.push(
          `${rel(d.file)}:${d.line}  ${d.prop}: ${d.value.replace(/\s+/g, ' ')}  -> ${ms}ms ` +
          `outside R-46 bands (interface 200–450ms, cinematic 600–1200ms)`
        );
      }
    }
  }
  record('TC-NFR-MOTION-BAND', 'R-46/SC-27.1 — every authored duration sits inside an R-46 band',
    failures, `${failures.length} out-of-band duration(s)`);
}

function checkMotionEasing() {
  const failures = [];
  for (const d of ALL_DECLS) {
    if (!/^(transition|animation|transition-timing-function|animation-timing-function)$/.test(d.prop)) continue;
    if (d.inReducedMotion) continue;
    // var() must go first: `--motion-ease-standard` contains the substring
    // "ease" between hyphens, which are word boundaries. A keyword written as a
    // var() *fallback* is dead code (the token is always defined) and is not a
    // violation of what actually runs.
    const bare = stripNonTiming(stripVar(d.value));
    if (EASING_KEYWORDS.test(bare)) {
      const kw = bare.match(EASING_KEYWORDS)[0];
      failures.push(
        `${rel(d.file)}:${d.line}  ${d.prop}: ${d.value.replace(/\s+/g, ' ')}  -> timing keyword ` +
        `"${kw}"; R-46 permits custom cubic-bezier only`
      );
      continue;
    }
    // A shorthand carrying a duration but no timing function silently falls back
    // to the `ease` keyword — the same violation, written by omission.
    if (/^(transition|animation)$/.test(d.prop) && /\d\s*m?s\b/.test(stripVar(d.value))) {
      for (const part of stripVar(d.value).split(',')) {
        if (!/\d\s*m?s\b/.test(part)) continue;
        const hadVar = d.value.split(',').some((p) => /var\(\s*--motion-ease/.test(p));
        if (!/cubic-bezier\(/.test(part) && !hadVar) {
          failures.push(
            `${rel(d.file)}:${d.line}  ${d.prop}: ${d.value.replace(/\s+/g, ' ')}  -> no timing ` +
            `function declared; the initial value is the "ease" keyword, which R-46 forbids`
          );
          break;
        }
      }
    }
  }
  record('TC-NFR-MOTION-EASE', 'R-46/SC-27.1 — custom cubic-bezier only, no timing keywords',
    failures, `${failures.length} keyword-eased or unspecified timing function(s)`);
}

function checkMotionTokenised() {
  const failures = [];
  for (const d of ALL_DECLS) {
    if (!DURATION_PROPS.has(d.prop)) continue;
    if (d.inReducedMotion) continue;
    // A literal that survives stripVar() is authored outside the token set.
    // Only the FIRST time value of each comma-separated part is a duration; a
    // second one is a delay, which R-46's bands and token set treat separately.
    const lits = stripVar(d.value).split(',')
      .map((part) => (part.match(/-?\d*\.?\d+m?s\b/) || [])[0])
      .filter(Boolean);
    // A literal *inside* a var() fallback is dead code but still an untokenised
    // duration the next author will copy; report it separately.
    const fallbackLits = (d.value.match(/var\(\s*--motion-[A-Za-z0-9_-]+\s*,\s*(-?\d*\.?\d+m?s)\b/g) || []);
    for (const lit of lits) {
      failures.push(`${rel(d.file)}:${d.line}  ${d.prop}: ${d.value.replace(/\s+/g, ' ')}  -> literal ${lit} is not a --motion-* token`);
    }
    for (const fb of fallbackLits) {
      failures.push(`${rel(d.file)}:${d.line}  ${d.prop}: ${d.value.replace(/\s+/g, ' ')}  -> literal duration in a var() fallback (${fb.trim()})`);
    }
  }
  record('TC-NFR-MOTION-TOKENISED', 'R-46/SC-27.1 — every duration is a --motion-* token, never a literal',
    failures, `${failures.length} untokenised duration(s)`);
}

const COMPOSITOR_SAFE = new Set([
  'transform', 'opacity', 'filter', 'backdrop-filter',
  'color', 'background', 'background-color', 'border-color', 'box-shadow', 'outline-color',
  // SVG paint properties: they repaint the shape, they do not reflow the
  // document — the same cost class as `color` or `background`.
  'fill', 'stroke', 'fill-opacity', 'stroke-opacity', 'stroke-dashoffset',
  'stroke-width', 'stroke-dasharray',
  'text-decoration-color', 'border-bottom-color', 'border-top-color',
  'visibility', 'none',
]);
function checkCompositorSafe() {
  const failures = [];
  for (const d of ALL_DECLS) {
    if (d.prop !== 'transition' && d.prop !== 'transition-property') continue;
    for (const part of stripVar(d.value).split(',')) {
      const first = part.trim().split(/\s+/)[0];
      if (!first || /^\d/.test(first) || /cubic-bezier|^\)/.test(first)) continue;
      if (!COMPOSITOR_SAFE.has(first)) {
        failures.push(
          `${rel(d.file)}:${d.line}  ${d.prop}: ${d.value.replace(/\s+/g, ' ')}  -> transitions ` +
          `"${first}", which is not compositor-safe (R-46 permits transform/opacity and paint-only properties)`
        );
      }
    }
  }
  record('TC-NFR-MOTION-COMPOSITOR', 'R-46/SC-27.1 — transitions target compositor-safe properties only',
    failures, `${failures.length} layout-triggering transition(s)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-NFR-SCALE — R-47 / SC-28.1
// ─────────────────────────────────────────────────────────────────────────────
const FS_TOKENS = ['--fs-micro', '--fs-caption', '--fs-small', '--fs-body', '--fs-lede',
  '--fs-h3', '--fs-h2', '--fs-title', '--fs-display', '--fs-name'];
const MEASURE_TOKENS = ['--measure-read', '--measure-display'];

/** Class names that a module's sibling TSX applies to an SVG <text>/<tspan>. */
function svgTextClasses(cssFile) {
  const dir = dirname(cssFile);
  const set = new Set();
  for (const f of walk(dir).filter((p) => /\.tsx$/.test(p))) {
    const src = read(f);
    const tagRe = /<(?:text|tspan)\b[\s\S]{0,400}?>/g;
    let m;
    while ((m = tagRe.exec(src)) !== null) {
      for (const c of m[0].match(/styles\.([A-Za-z0-9_]+)/g) || []) set.add(c.split('.')[1]);
    }
  }
  return set;
}

function checkTypeScale() {
  const globals = blankComments(read(GLOBALS));
  const missing = FS_TOKENS
    .filter((name) => !new RegExp(`^\\s*${name}\\s*:`, 'm').test(globals))
    .map((name) => `app/globals.css :root is missing type-scale token ${name}`);
  record('TC-NFR-SCALE-TOKENS', 'R-47/SC-28.1 — a 10-step modular type scale is declared as --fs-* tokens',
    missing, `${FS_TOKENS.length - missing.length}/${FS_TOKENS.length} --fs-* tokens declared`);

  const missingMeasure = MEASURE_TOKENS
    .filter((name) => !new RegExp(`^\\s*${name}\\s*:`, 'm').test(globals))
    .map((name) => `app/globals.css :root is missing measure token ${name}`);
  record('TC-NFR-SCALE-MEASURE-TOKENS', 'R-47/SC-28.1 — the 55–75ch measure is declared as a token',
    missingMeasure, `${MEASURE_TOKENS.length - missingMeasure.length}/${MEASURE_TOKENS.length} measure tokens declared`);

  // Every module font-size consumes the scale. Exemptions, both mechanical:
  //  · a class applied only to an SVG <text>/<tspan> is sized in viewBox user
  //    units, not on a rem type scale;
  //  · an `em` font-size is a ratio of an already-established step, so it adds
  //    no new absolute size to the scale.
  const failures = [];
  const distinct = new Set();
  for (const file of MODULE_CSS) {
    const svgClasses = svgTextClasses(file);
    for (const d of declarations(file)) {
      if (d.prop !== 'font-size') continue;
      const selClasses = (d.selector.match(/\.([A-Za-z0-9_-]+)/g) || []).map((s) => s.slice(1));
      if (selClasses.length > 0 && selClasses.every((c) => svgClasses.has(c))) continue;
      if (/^\s*[\d.]+em\s*$/.test(d.value)) continue;
      const bare = stripVar(d.value);
      if (!/\d/.test(bare)) continue; // fully tokenised
      distinct.add(d.value.trim());
      failures.push(`${rel(d.file)}:${d.line}  font-size: ${d.value.trim()}  (selector ${d.selector || '?'}) -> literal, not var(--fs-*)`);
    }
  }
  record('TC-NFR-SCALE-CONSUMED', 'R-47/SC-28.1 — every module font-size consumes the scale, never a literal',
    failures, `${failures.length} literal font-size declaration(s), ${distinct.size} distinct value(s)`);

  // Line-height collapses to the six values the scale binds (lock §2.2).
  const LOCKED_LH = new Set(['1.05', '1.2', '1.35', '1.5', '1.55', '1.68']);
  const lhFailures = [];
  for (const file of MODULE_CSS) {
    const svgClasses = svgTextClasses(file);
    for (const d of declarations(file)) {
      if (d.prop !== 'line-height') continue;
      const selClasses = (d.selector.match(/\.([A-Za-z0-9_-]+)/g) || []).map((s) => s.slice(1));
      if (selClasses.length > 0 && selClasses.every((c) => svgClasses.has(c))) continue;
      const v = d.value.trim();
      if (!/^\d*\.?\d+$/.test(v)) continue; // var() or a unit — judged elsewhere
      if (LOCKED_LH.has(String(parseFloat(v)))) continue;
      lhFailures.push(`${rel(d.file)}:${d.line}  line-height: ${v}  -> not one of the six step-bound values (1.05/1.20/1.35/1.50/1.55/1.68)`);
    }
  }
  record('TC-NFR-SCALE-LEADING', 'R-47/SC-28.1 — line-height is bound to the step, collapsing to six values',
    lhFailures, `${lhFailures.length} unbound line-height value(s)`);

  // Measure (lock §2.3). Two classes, both tokenised: --measure-read for running
  // prose (55–75ch) and --measure-display for a display-size single sentence.
  // A literal `Nch` is therefore a finding whichever class it belongs to — an
  // out-of-band prose measure, or a display measure that has not been declared
  // as one.
  const measureFailures = [];
  for (const file of MODULE_CSS) {
    for (const d of declarations(file)) {
      if (!/^(max-width|width|inline-size|max-inline-size)$/.test(d.prop)) continue;
      const lit = (stripVar(d.value).match(/([\d.]+)ch\b/) || [])[1];
      if (!lit) continue;
      const ch = parseFloat(lit);
      const band = ch >= 55 && ch <= 75;
      measureFailures.push(
        `${rel(d.file)}:${d.line}  ${d.prop}: ${d.value.trim()}  (selector ${d.selector || '?'}) -> ` +
        (band
          ? `in the 55–75ch band but written as a literal; it must read var(--measure-read)`
          : `${ch}ch is outside R-47's 55–75ch band; running prose moves to var(--measure-read), ` +
            `a display-size single sentence to var(--measure-display)`)
      );
    }
  }
  record('TC-NFR-SCALE-MEASURE', 'R-47/SC-28.1 — every measure is a token, and prose sits in the 55–75ch band',
    measureFailures, `${measureFailures.length} literal ch measure(s)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-NFR-TOKENS-FILE — design-tokens.json must describe the shipped system
// ─────────────────────────────────────────────────────────────────────────────
function checkTokensFile() {
  const failures = [];
  let tokens;
  try { tokens = JSON.parse(read(join(ROOT, 'design-tokens.json'))); }
  catch (e) { record('TC-NFR-TOKENS-FILE', 'design-tokens.json parses', [`design-tokens.json: ${e.message}`], 'unparseable'); return; }

  // The site loads Source Serif 4 (display), Inter (body), IBM Plex Mono (data)
  // — app/layout.tsx. Nothing named "Inter Variable" is loaded, and no face is
  // loaded above weight 600.
  const layout = read(join(ROOT, 'app', 'layout.tsx'));
  const loadedFamilies = ['Source Serif 4', 'Inter', 'IBM Plex Mono']
    .filter((f) => layout.includes(f.replace(/ /g, '_')) || layout.includes(f));
  const loadedWeights = new Set(
    (layout.match(/weight:\s*\[[^\]]*\]/g) || [])
      .flatMap((m) => m.match(/\d{3}/g) || [])
  );
  for (const [role, spec] of Object.entries(tokens.typography || {})) {
    const v = spec.value || {};
    if (v.fontFamily && !loadedFamilies.includes(v.fontFamily)) {
      failures.push(`design-tokens.json typography.${role}.fontFamily = "${v.fontFamily}" — not a family app/layout.tsx loads (${loadedFamilies.join(', ')})`);
    }
    if (v.fontWeight && !loadedWeights.has(String(v.fontWeight))) {
      failures.push(`design-tokens.json typography.${role}.fontWeight = ${v.fontWeight} — not a weight app/layout.tsx loads (${[...loadedWeights].sort().join(', ')})`);
    }
  }

  // The file claims an 8pt grid; every listed step must actually be one.
  if ((tokens.metadata || {}).grid === '8pt') {
    for (const [step, spec] of Object.entries(tokens.spacing || {})) {
      const px = parseFloat(spec.value) * (String(spec.value).endsWith('rem') ? 16 : 1);
      if (px !== 0 && px % 8 !== 0) {
        failures.push(`design-tokens.json spacing.${step} = ${spec.value} (${px}px) — not a step of the 8pt grid the file declares`);
      }
    }
  }
  record('TC-NFR-TOKENS-FILE', 'R-47/R-48 — design-tokens.json describes the shipped type and grid',
    failures, `${failures.length} stale token declaration(s)`);
}

// ── Run ─────────────────────────────────────────────────────────────────────
checkGrid();
checkMotionTokens();
checkMotionBands();
checkMotionEasing();
checkMotionTokenised();
checkCompositorSafe();
checkTypeScale();
checkTokensFile();

let allPass = true;
console.log('\n  GRID · MOTION · TYPE AUDIT — R-46 / R-47 / R-48\n  ' + '-'.repeat(72));
for (const r of results) {
  if (!r.pass) allPass = false;
  console.log(`  [${r.pass ? 'PASS' : 'FAIL'}] ${r.id.padEnd(30)} ${r.name}`);
  console.log(`         ${r.detail}`);
  for (const f of r.failures) console.log(`           · ${f}`);
}
console.log('  ' + '-'.repeat(72));
const passed = results.filter((r) => r.pass).length;
console.log(`  RESULT: ${allPass ? 'ALL PASS' : 'FAILURES PRESENT'} (${passed}/${results.length} checks, ` +
  `${results.reduce((n, r) => n + r.count, 0)} assertion failures)\n`);

const REPORT_DIR = join(ROOT, 'reports');
try { mkdirSync(REPORT_DIR, { recursive: true }); } catch { /* exists */ }
writeFileSync(join(REPORT_DIR, 'grid-motion-type-audit.json'), JSON.stringify({
  timestamp: new Date().toISOString(),
  result: allPass ? 'PASS' : 'FAIL',
  summary: { total: results.length, passed, failed: results.length - passed,
    assertionFailures: results.reduce((n, r) => n + r.count, 0) },
  checks: results,
}, null, 2) + '\n');
console.log('  📄 JSON report → reports/grid-motion-type-audit.json\n');

process.exit(allPass ? 0 : 1);
