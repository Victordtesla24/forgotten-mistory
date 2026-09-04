#!/usr/bin/env node
/**
 * reduced_motion_audit.mjs — the static half of the parallel reduced-motion
 * choreography (R-46, R-101, SC-27.1, T-39).
 *
 *   TC-RM-BLANKET   no universal-selector rule inside `prefers-reduced-motion`
 *                   crushes `animation-duration` / `transition-duration`
 *   TC-RM-SCORE     every one of the six sections re-scores its entrance under
 *                   reduced motion with a named opacity keyframe
 *   TC-RM-SAFE      every keyframe a reduced-motion block references animates
 *                   only safe properties — never transform, size or inset
 *   TC-RM-AFFORD    no reduced-motion block removes a colour transition the
 *                   same selector declares outside it
 *
 * Lock: docs/delivery/evidence/v6-20260903T195241Z/design-system-lock.md §4.3.
 * The runtime half — computed values on rendered elements under emulated
 * `prefers-reduced-motion: reduce` — lives in
 * tests/a11y/reduced-motion-choreography.spec.ts.
 *
 * The duration bands, bezier discipline and compositor safety of the *default*
 * motion mode are audited by scripts/validate/grid_motion_type_audit.mjs
 * (TC-NFR-MOTION), which explicitly leaves §4.3 to this script.
 *
 * Scope: the authored CSS modules under components/** plus app/globals.css.
 * Runs with zero deps against the source tree — no build, no browser.
 *
 * Usage:  node scripts/validate/reduced_motion_audit.mjs
 * Exit:   0 if every check PASSes, 1 otherwise.
 * Writes: reports/reduced-motion-audit.json
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

/** Replace comment bodies with spaces so offsets, and therefore line numbers, survive. */
function blankComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

const MODULE_CSS = walk(join(ROOT, 'components')).filter((p) => p.endsWith('.css')).sort();
const GLOBALS = join(ROOT, 'app', 'globals.css');
const ALL_CSS = [...MODULE_CSS, GLOBALS];
const rel = (p) => relative(ROOT, p);

/**
 * Parse a stylesheet into style blocks and keyframe definitions.
 *
 * Returns { blocks, keyframes }:
 *   blocks    — { file, line, selector, decls: [{prop, value}], inReducedMotion }
 *   keyframes — { file, line, name, properties: Set<string> }
 *
 * Block-shaped, not declaration-shaped: this audit reasons about whole rules
 * (a selector's full declaration list, and whether it sits inside a reduced-motion
 * media block), which is a different cut of the same CSS from the declaration
 * stream grid_motion_type_audit.mjs walks.
 */
function parse(file) {
  const src = blankComments(read(file));
  const blocks = [];
  const keyframes = [];
  const lineOf = (index) => src.slice(0, index).split('\n').length;

  let i = 0;
  const stack = [];              // open at-rule / selector preludes
  let prelude = '';
  let preludeStart = 0;
  let body = '';                 // declaration text of the innermost open block
  let bodyIsStyleRule = false;

  const reducedOpen = () => stack.some((s) => /@media[^{]*prefers-reduced-motion/i.test(s.prelude));
  const keyframesOpen = () => stack.find((s) => /^@(-\w+-)?keyframes\b/i.test(s.prelude.trim()));

  const flushBody = () => {
    if (!bodyIsStyleRule) { body = ''; return; }
    const top = stack[stack.length - 1];
    if (!top) { body = ''; return; }
    const decls = [];
    for (const chunk of body.split(';')) {
      const m = /^\s*([-A-Za-z]+)\s*:\s*([\s\S]+)$/.exec(chunk);
      if (m) decls.push({ prop: m[1].toLowerCase(), value: m[2].trim().replace(/\s+/g, ' ') });
    }
    const kf = keyframesOpen();
    if (kf) {
      kf.properties ??= new Set();
      for (const d of decls) kf.properties.add(d.prop);
    } else {
      blocks.push({
        file,
        line: top.line,
        selector: top.prelude.trim().replace(/\s+/g, ' '),
        decls,
        inReducedMotion: stack.slice(0, -1).some((s) => /@media[^{]*prefers-reduced-motion/i.test(s.prelude))
          || /prefers-reduced-motion/i.test(top.prelude),
      });
    }
    body = '';
  };

  for (; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') {
      const trimmed = prelude.trim();
      stack.push({ prelude: trimmed, line: lineOf(preludeStart) });
      bodyIsStyleRule = !/^@/.test(trimmed);
      if (/^@(-\w+-)?keyframes\b/i.test(trimmed)) {
        const name = trimmed.replace(/^@(-\w+-)?keyframes\s+/i, '').trim();
        const frame = stack[stack.length - 1];
        frame.keyframeName = name;
        frame.properties = new Set();
      }
      prelude = '';
      body = '';
    } else if (ch === '}') {
      flushBody();
      const closed = stack.pop();
      if (closed?.keyframeName) {
        keyframes.push({
          file,
          line: closed.line,
          name: closed.keyframeName,
          properties: [...(closed.properties ?? [])],
          inReducedMotion: reducedOpen(),
        });
      }
      // A keyframe selector block (`from`/`to`/`50%`) closes into its @keyframes parent.
      bodyIsStyleRule = stack.length > 0 && !/^@/.test(stack[stack.length - 1].prelude);
      prelude = '';
    } else if (ch === ';' && stack.length > 0 && bodyIsStyleRule) {
      body += prelude + ';';
      prelude = '';
      if (preludeStart <= i) preludeStart = i + 1;
    } else {
      if (prelude.trim() === '') preludeStart = i;
      prelude += ch;
    }
  }
  // Trailing declaration with no closing `;`.
  return { blocks, keyframes };
}

const PARSED = ALL_CSS.map((file) => ({ file, ...parse(file) }));
const ALL_BLOCKS = PARSED.flatMap((p) => p.blocks);
const ALL_KEYFRAMES = PARSED.flatMap((p) => p.keyframes);
const KEYFRAME_BY_NAME = new Map(ALL_KEYFRAMES.map((k) => [k.name, k]));

const SAFE_PROPERTIES = new Set([
  'opacity', 'visibility', 'color', 'background', 'background-color', 'border-color',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'outline-color', 'box-shadow', 'fill', 'stroke', 'fill-opacity', 'stroke-opacity',
  'text-decoration-color', 'filter',
]);

const COLOUR_PROPERTIES = new Set([
  'color', 'background', 'background-color', 'border-color', 'border-top-color',
  'border-right-color', 'border-bottom-color', 'border-left-color', 'outline-color',
  'box-shadow', 'fill', 'stroke', 'fill-opacity', 'stroke-opacity', 'text-decoration-color',
]);

/** The six sections of the page, keyed to the module that owns each entrance. */
const SECTION_MODULES = {
  Hero: 'components/sections/Hero/Hero.module.css',
  About: 'components/sections/About/About.module.css',
  Experience: 'components/sections/Experience/Experience.module.css',
  Skills: 'components/sections/Skills/Skills.module.css',
  Vitrine: 'components/sections/Vitrine/Vitrine.module.css',
  Listen: 'components/sections/Listen/Listen.module.css',
};

// ─────────────────────────────────────────────────────────────────────────────
// TC-RM-BLANKET — lock §4.3: "replace the two blanket !important blocks"
// ─────────────────────────────────────────────────────────────────────────────
{
  const isUniversal = (selector) =>
    selector
      .split(',')
      .map((s) => s.trim())
      .some((s) => /^\*(\s*::?[A-Za-z-]+)?$/.test(s) || /^::?(before|after)$/.test(s));

  const failures = [];
  for (const b of ALL_BLOCKS) {
    if (!b.inReducedMotion || !isUniversal(b.selector)) continue;
    for (const d of b.decls) {
      if (d.prop === 'animation-duration' || d.prop === 'transition-duration' || d.prop === 'transition') {
        failures.push(`${rel(b.file)}:${b.line} — ${b.selector} { ${d.prop}: ${d.value} }`);
      }
    }
  }
  record(
    'TC-RM-BLANKET',
    'No universal-selector duration override inside prefers-reduced-motion',
    failures,
    'A global duration crush amputates motion instead of re-scoring it (R-46, lock §4.3).',
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-RM-SCORE — every section re-scores its entrance, as Hero.module.css does
// ─────────────────────────────────────────────────────────────────────────────
{
  const failures = [];
  for (const [name, modulePath] of Object.entries(SECTION_MODULES)) {
    const file = join(ROOT, modulePath);
    const blocks = ALL_BLOCKS.filter((b) => b.file === file && b.inReducedMotion);
    const scored = [];
    for (const b of blocks) {
      for (const d of b.decls) {
        if (d.prop !== 'animation' && d.prop !== 'animation-name') continue;
        const value = d.value.trim();
        if (/^none\b/.test(value)) continue;
        const keyframeName = d.prop === 'animation-name'
          ? value.split(',')[0].trim()
          : value.split(/\s+/).find((t) => KEYFRAME_BY_NAME.has(t));
        if (keyframeName && KEYFRAME_BY_NAME.has(keyframeName)) {
          scored.push({ selector: b.selector, keyframeName });
        }
      }
    }
    if (scored.length === 0) {
      failures.push(
        `${modulePath} — no reduced-motion entrance: the section has no named opacity keyframe ` +
        `inside @media (prefers-reduced-motion: reduce). R-46 requires a parallel choreography in every section.`,
      );
    }
  }
  record(
    'TC-RM-SCORE',
    'Every section re-scores its entrance under reduced motion',
    failures,
    'Lock §4.3 instrument 1: generalise Hero.module.css:389-398 to all six sections.',
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-RM-SAFE — keyframes reachable under reduced motion animate safe properties
// ─────────────────────────────────────────────────────────────────────────────
{
  const failures = [];
  for (const b of ALL_BLOCKS) {
    if (!b.inReducedMotion) continue;
    for (const d of b.decls) {
      if (d.prop !== 'animation' && d.prop !== 'animation-name') continue;
      const value = d.value.trim();
      if (/^none\b/.test(value)) continue;
      const tokens = d.prop === 'animation-name'
        ? value.split(',').map((t) => t.trim())
        : value.split(/[\s,]+/);
      for (const token of tokens) {
        const kf = KEYFRAME_BY_NAME.get(token);
        if (!kf) continue;
        const unsafe = kf.properties.filter((p) => !SAFE_PROPERTIES.has(p));
        if (unsafe.length > 0) {
          failures.push(
            `${rel(b.file)}:${b.line} — ${b.selector} runs @keyframes ${token} ` +
            `(${rel(kf.file)}:${kf.line}) which animates ${unsafe.join(', ')}`,
          );
        }
      }
    }
  }
  record(
    'TC-RM-SAFE',
    'Reduced-motion keyframes animate no position or size',
    failures,
    'Nothing may animate position or size under reduced motion (R-46, vestibular safety).',
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-RM-AFFORD — a colour transition declared outside the block survives inside it
// ─────────────────────────────────────────────────────────────────────────────
{
  /** Split a `transition` shorthand into the properties it names. */
  const transitionProps = (value) =>
    value
      .split(',')
      .map((part) => part.trim().split(/\s+/)[0])
      .filter(Boolean)
      .map((p) => p.toLowerCase());

  // selector → the colour properties it transitions in the default motion mode.
  const baseColour = new Map();
  for (const b of ALL_BLOCKS) {
    if (b.inReducedMotion) continue;
    for (const d of b.decls) {
      if (d.prop !== 'transition' && d.prop !== 'transition-property') continue;
      const props = transitionProps(d.value).filter((p) => COLOUR_PROPERTIES.has(p));
      if (props.length === 0) continue;
      for (const sel of b.selector.split(',').map((s) => s.trim())) {
        const key = `${b.file}|${sel}`;
        const set = baseColour.get(key) ?? new Set();
        props.forEach((p) => set.add(p));
        baseColour.set(key, set);
      }
    }
  }

  const failures = [];
  for (const b of ALL_BLOCKS) {
    if (!b.inReducedMotion) continue;
    for (const d of b.decls) {
      const removesAll =
        (d.prop === 'transition' && /^none\b/.test(d.value.trim())) ||
        (d.prop === 'transition-property' && /^none\b/.test(d.value.trim())) ||
        (d.prop === 'transition-duration' && /^0m?s$/.test(d.value.trim()));
      if (!removesAll) continue;
      for (const sel of b.selector.split(',').map((s) => s.trim())) {
        const killed = baseColour.get(`${b.file}|${sel}`);
        if (killed && killed.size > 0) {
          failures.push(
            `${rel(b.file)}:${b.line} — ${sel} { ${d.prop}: ${d.value} } removes the ` +
            `${[...killed].join(', ')} transition it declares outside the block`,
          );
        }
      }
    }
  }
  record(
    'TC-RM-AFFORD',
    'Colour affordances survive under reduced motion',
    failures,
    'Lock §4.3 instrument 3: a colour or weight transition causes no vestibular response and is the ' +
      'primary affordance signal; killing it makes the interface feel broken rather than calm.',
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Report
// ─────────────────────────────────────────────────────────────────────────────
const passed = results.filter((r) => r.pass).length;
console.log('reduced-motion audit — R-46 / R-101 / SC-27.1 (design-system lock §4.3)\n');
for (const r of results) {
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.id}  ${r.name}`);
  console.log(`      ${r.detail}`);
  if (!r.pass) {
    for (const f of r.failures.slice(0, 30)) console.log(`      · ${f}`);
    if (r.failures.length > 30) console.log(`      · … and ${r.failures.length - 30} more`);
  }
  console.log('');
}
console.log(`${passed}/${results.length} checks passed`);

const reportPath = join(ROOT, 'reports', 'reduced-motion-audit.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`);
console.log(`report: ${relative(ROOT, reportPath)}`);

process.exit(passed === results.length ? 0 : 1);
