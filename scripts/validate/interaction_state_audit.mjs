#!/usr/bin/env node
/**
 * interaction_state_audit.mjs — the static half of the interaction-state
 * library (R-49, R-90, SC-30.1).
 *
 * SC-30.1 requires designed hover, focus, active, disabled, loading and empty
 * states on every interactive element and zero browser-default states. R-90
 * names an unstyled focus ring as a prohibited anti-pattern.
 *
 * Three of those properties are static — they are facts about the source, not
 * about a rendered frame — and this is where they are checked:
 *
 *   IS-01  no focus indicator is removed without a designed replacement
 *   IS-02  state styling hangs off `:focus-visible`, never bare `:focus`
 *   IS-03  the state library exists: `:active` and disabled rules, token-valued
 *   IS-04  the two collections that can render zero items have an empty branch
 *
 * The rendered half — the ring the browser actually paints, the press, the
 * hover, the disabled treatment, the loading window and the cursor — is
 * asserted against computed values in tests/a11y/interaction-states.spec.ts
 * and tests/e2e/interaction-states.spec.ts. Neither half is sufficient alone:
 * a rule can exist and never apply, and a state can be observed on one element
 * while the source still carries the anti-pattern on another.
 *
 * Usage:  node scripts/validate/interaction_state_audit.mjs
 * Exit:   0 if every check passes, 1 otherwise. Prints a per-check report to
 *         stdout and writes nothing to disk.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const ROOT = process.cwd();
const results = [];
const record = (id, name, pass, detail) => results.push({ id, name, pass, detail });

function walk(dir, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    if (['node_modules', '.next', 'out', '.git', 'coverage', 'reports'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const read = (p) => {
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return '';
  }
};

const SOURCE_DIRS = ['app', 'components'].map((d) => join(ROOT, d));
const sources = SOURCE_DIRS.flatMap((d) => walk(d));
const cssFiles = sources.filter((p) => extname(p) === '.css');
const tsxFiles = sources.filter((p) => ['.tsx', '.ts'].includes(extname(p)));

/** Line number of a character offset, 1-based. */
const lineOf = (text, index) => text.slice(0, index).split('\n').length;

/** Split a stylesheet into { selector, body, line } rules, ignoring comments. */
function rulesOf(css) {
  // Blank the comments but keep every newline, so reported line numbers are the
  // line numbers of the file on disk.
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(clean))) {
    // Point the line number at the first character of the selector, not at the
    // whitespace the regex started matching from after the previous rule.
    const lead = m[1].length - m[1].replace(/^\s+/, '').length;
    out.push({ selector: m[1].trim().replace(/\s+/g, ' '), body: m[2], line: lineOf(clean, m.index + lead) });
  }
  return out;
}

// ── IS-01 — no focus indicator removed without a designed replacement ────────
//
// Two shapes carry the anti-pattern. In CSS, a rule that sets `outline: none`
// (or `0`) on something focusable. In Tailwind class strings, the
// `focus:outline-none` / `focus-visible:outline-none` utility. Either is only
// acceptable when the very same rule or class string paints a replacement the
// reader can see — a ring drawn with `box-shadow`, or an outline re-declared at
// a real width.
function checkFocusKill() {
  const offenders = [];

  const FOCUSABLE_SELECTOR = /(:focus|:focus-visible|:focus-within|\binput\b|\btextarea\b|\bselect\b|\bbutton\b|\ba\b|\[tabindex|\[contenteditable)/;
  const KILLS_OUTLINE = /outline\s*:\s*(none|0(px)?)\s*(!important)?\s*;/;
  const REPLACEMENT = /box-shadow\s*:\s*(?!none)|outline\s*:\s*[^;]*\b([2-9]|[1-9]\d)px/;

  for (const file of cssFiles) {
    const css = read(file);
    for (const rule of rulesOf(css)) {
      if (!KILLS_OUTLINE.test(rule.body)) continue;
      if (!FOCUSABLE_SELECTOR.test(rule.selector)) continue;
      if (REPLACEMENT.test(rule.body)) continue;
      offenders.push(`${relative(ROOT, file)}:${rule.line} — \`${rule.selector}\` removes the outline and paints no replacement`);
    }
  }

  const CLASS_STRING = /(?:className\s*=\s*|class\s*=\s*)(?:"([^"]*)"|'([^']*)'|\{`([\s\S]*?)`\}|\{"([^"]*)"\}|\{'([^']*)'\})/g;
  for (const file of tsxFiles) {
    const src = read(file);
    let m;
    while ((m = CLASS_STRING.exec(src))) {
      const classes = m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5] ?? '';
      if (!/(?:^|\s|:)(?:focus|focus-visible):outline-none/.test(classes)) continue;
      const hasRing = /focus-visible:(?:ring|outline-(?!none)|shadow)/.test(classes);
      if (hasRing) continue;
      offenders.push(
        `${relative(ROOT, file)}:${lineOf(src, m.index)} — \`focus:outline-none\` with no \`focus-visible:\` ring on the same element`,
      );
    }
  }

  record(
    'IS-01',
    'no focus indicator removed without a designed replacement (R-90)',
    offenders.length === 0,
    offenders.length ? offenders.join('\n         ') : 'no focus indicator is removed anywhere in app/ or components/',
  );
}

// ── IS-02 — state styling hangs off :focus-visible, never bare :focus ────────
//
// The lock (§5.1) records `:focus-visible` throughout as PRESENT and correct —
// a pointer click should not leave a ring behind. The exceptions it names are
// `#mini-vic-input:focus` (globals.css) and `focus:` utilities in the clone
// panel. A bare `:focus` rule that paints anything is the regression this
// check exists to stop.
function checkBareFocus() {
  const offenders = [];
  for (const file of cssFiles) {
    const css = read(file);
    for (const rule of rulesOf(css)) {
      const selectors = rule.selector.split(',').map((s) => s.trim());
      for (const sel of selectors) {
        if (!/:focus(?![-\w])/.test(sel)) continue;
        if (rule.body.trim().length === 0) continue;
        offenders.push(`${relative(ROOT, file)}:${rule.line} — \`${sel}\` styles bare :focus; use :focus-visible`);
      }
    }
  }

  const CLASS_STRING = /(?:className\s*=\s*|class\s*=\s*)(?:"([^"]*)"|'([^']*)'|\{`([\s\S]*?)`\}|\{"([^"]*)"\}|\{'([^']*)'\})/g;
  for (const file of tsxFiles) {
    const src = read(file);
    let m;
    while ((m = CLASS_STRING.exec(src))) {
      const classes = m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5] ?? '';
      const bare = (classes.match(/(?:^|\s)focus:[\w[\]/.-]+/g) || []).map((s) => s.trim());
      if (!bare.length) continue;
      offenders.push(`${relative(ROOT, file)}:${lineOf(src, m.index)} — bare focus utilities ${bare.join(' ')}; use focus-visible:`);
    }
  }

  record(
    'IS-02',
    'state styling uses :focus-visible, never bare :focus (SC-30.1)',
    offenders.length === 0,
    offenders.length ? offenders.join('\n         ') : 'every focus treatment in app/ and components/ is :focus-visible',
  );
}

// ── IS-03 — the state library exists, and is token-valued ───────────────────
//
// §5.3 locks six states. Two of them — `active` and `disabled` — have no rule
// anywhere in the authored stylesheets today, so there is nothing for any
// element to inherit. This check requires that both exist and that every value
// inside them comes from a token, so the library cannot be landed as a pile of
// literals that TC-NFR-MONO would then have to chase.
function checkStateLibrary() {
  const findings = [];
  const activeRules = [];
  const disabledRules = [];

  for (const file of cssFiles) {
    const css = read(file);
    for (const rule of rulesOf(css)) {
      const sel = rule.selector;
      if (/:active(?![-\w])/.test(sel)) activeRules.push({ file, rule });
      if (/:disabled(?![-\w])|\[aria-disabled=("|')?true/.test(sel)) disabledRules.push({ file, rule });
    }
  }

  if (activeRules.length === 0) findings.push('no `:active` rule exists in app/ or components/ — the pressed state is undefined site-wide');
  if (disabledRules.length === 0)
    findings.push('no `:disabled` / `[aria-disabled="true"]` rule exists in app/ or components/ — the disabled state is undefined site-wide');

  // Colour literals inside the state rules that should be tokens.
  const LITERAL_COLOUR = /(#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(|\boklch\s*\(|\boklab\s*\()/;
  for (const { file, rule } of [...activeRules, ...disabledRules]) {
    for (const decl of rule.body.split(';')) {
      if (!decl.trim()) continue;
      if (!LITERAL_COLOUR.test(decl)) continue;
      findings.push(`${relative(ROOT, file)}:${rule.line} — \`${decl.trim()}\` inside \`${rule.selector}\` is a literal colour, not a token`);
    }
  }

  record(
    'IS-03',
    'the locked state library exists as token-valued :active and disabled rules (SC-30.1 §5.3)',
    findings.length === 0,
    findings.length
      ? findings.join('\n         ')
      : `${activeRules.length} :active rule(s) and ${disabledRules.length} disabled rule(s), all token-valued`,
  );
}

// ── IS-04 — the collections that can render zero items have an empty branch ──
//
// §5.3: "Never a blank region." Two surfaces on this site render a collection
// whose length is decided at runtime and can reach zero — the filtered
// capability table and the clone's transcript. Neither has a branch for it, so
// each would render an empty box with no explanation. The static content
// arrays (the lede, the ten dimensions, the six plates) are compiled in and
// cannot be empty, so they are deliberately out of scope: an empty state that
// can never be reached is dead code, and TC-NFR-DEADCSS exists to keep dead
// code off this site.
const VARIABLE_COLLECTIONS = [
  {
    file: 'components/sections/Skills/Skills.tsx',
    identifier: 'visible',
    surface: 'the capability table under the status filters (lock §5.3, "Skills filter returning no rows")',
  },
  {
    file: 'components/MiniVicBot.tsx',
    identifier: 'messages',
    surface: 'the clone transcript log (lock §5.3, "any surface whose fetch returns nothing")',
  },
];

function checkEmptyBranches() {
  const offenders = [];
  for (const { file, identifier, surface } of VARIABLE_COLLECTIONS) {
    const src = read(join(ROOT, file));
    if (!src) {
      offenders.push(`${file} — file not found; the empty-state audit has no subject`);
      continue;
    }
    if (!new RegExp(`\\b${identifier}\\b`).test(src)) {
      offenders.push(`${file} — \`${identifier}\` no longer exists in this file; this audit entry needs re-pointing`);
      continue;
    }
    const guard = new RegExp(
      `(!\\s*${identifier}\\.length|${identifier}\\.length\\s*(===|==|<|<=)\\s*[01]\\b|${identifier}\\.length\\s*\\?|${identifier}\\.length\\s*&&)`,
    ).test(src);
    if (!guard) offenders.push(`${file} — no zero-length branch for \`${identifier}\`: ${surface} renders a blank region when it is empty`);
  }

  record(
    'IS-04',
    'every runtime-variable collection has a designed empty state (SC-30.1 §5.3)',
    offenders.length === 0,
    offenders.length ? offenders.join('\n         ') : 'both variable collections carry a zero-length branch',
  );
}

checkFocusKill();
checkBareFocus();
checkStateLibrary();
checkEmptyBranches();

const passed = results.filter((r) => r.pass).length;
console.log('\nInteraction-state static audit — R-49 / R-90 / SC-30.1\n');
for (const r of results) {
  console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.id}  ${r.name}`);
  console.log(`         ${r.detail}\n`);
}
console.log(`  ${passed}/${results.length} checks passed\n`);
process.exit(passed === results.length ? 0 : 1);
