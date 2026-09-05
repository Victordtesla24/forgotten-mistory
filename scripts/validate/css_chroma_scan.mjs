#!/usr/bin/env node
/**
 * css_chroma_scan.mjs — bundle-level palette scan.
 *
 * TC-NFR-MONO (scripts/validate/overhaul_static_audit.mjs) enforces the palette
 * at SOURCE level, over app/** and components/**, with a saturation *ratio*
 * threshold. That gate cannot see two things:
 *
 *   1. Colour Tailwind generates rather than colour we wrote. Tailwind v4
 *      auto-detects its own sources; a hue utility named in a JSON report or a
 *      markdown note anywhere in the repo is compiled into the served bundle
 *      even though no component renders it.
 *   2. Low-ratio hue. `rgb(232 235 240)` is a cool white — a 8/240 = 3%
 *      saturation ratio, under the source gate's 28% bar, but a visible blue
 *      cast at 26% alpha over near-black.
 *
 * So this scan reads the SERVED CSS and applies the absolute rule the design
 * contract actually states: black, white and gold only. A colour is chromatic
 * when its channel spread exceeds SPREAD_MAX; gold is the one sanctioned hue.
 *
 * Usage: node scripts/validate/css_chroma_scan.mjs <file.css|dir> [...]
 * Exit 0 = clean, 1 = findings. Also imported by tests/palette_bundle.test.mjs.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/** Channel spread (max − min) above which an sRGB colour reads as a hue. */
export const SPREAD_MAX = 6;
/** OKLCH/OKLab chroma above which a colour reads as a hue. */
export const CHROMA_MAX = 0.01;
/** HSL saturation (%) above which a colour reads as a hue. */
export const HSL_SAT_MAX = 3;

/**
 * The Aether golds — the single sanctioned hue, and only as a claim mark
 * (a sourced figure). Same four values the source gate allows, plus the
 * rgb() alpha forms that minify to 8-digit hex.
 */
export const GOLD_RGB = new Set([
  '201,168,76', // --gold        #c9a84c
  '212,182,92', // --gold-light  #d4b65c
  '232,213,163', // --gold-pale  #e8d5a3
  '176,146,63', // --gold-dark   #b0923f
]);

/** Tailwind palette families that carry chroma. `neutral` (chroma 0) is fine. */
const CHROMATIC_FAMILIES = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink',
  'rose', 'slate', 'gray', 'zinc', 'stone',
].join('|');

const UTILITY_PREFIXES = [
  'text', 'bg', 'border', 'from', 'via', 'to', 'ring', 'shadow', 'fill',
  'stroke', 'decoration', 'outline', 'accent', 'caret', 'divide',
  'placeholder',
].join('|');

const HUE_UTILITY = new RegExp(
  `\\.(?:${UTILITY_PREFIXES})-(?:${CHROMATIC_FAMILIES})-\\d{2,3}\\b`,
  'g',
);

const HEX = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-zA-Z_-])/g;
const RGB = /\brgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)/g;
const HSL = /\bhsla?\(\s*[-\d.]+(?:deg|rad|turn)?[\s,]+([\d.]+)%/g;
const OKLCH = /\boklch\(\s*[\d.]+%?[\s,]+([\d.]+%?)/g;
const OKLAB = /\boklab\(\s*[\d.]+%?[\s,]+(-?[\d.]+%?)[\s,]+(-?[\d.]+%?)/g;

/** Expand #abc / #abcd / #aabbcc / #aabbccdd to [r, g, b]. */
function hexToRgb(hex) {
  let h = hex;
  if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map((c) => c + c).join('');
  else h = h.slice(0, 6);
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Percentage-or-number channel to 0–255. */
function channel(raw) {
  return raw.endsWith('%') ? (parseFloat(raw) * 255) / 100 : parseFloat(raw);
}

const isGold = ([r, g, b]) => GOLD_RGB.has(`${Math.round(r)},${Math.round(g)},${Math.round(b)}`);
const spread = ([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b);

/**
 * `@supports (color: color-mix(in lab, red, red))` is a feature probe, not
 * paint. Blank the condition — never the block it guards — so the named
 * colours inside it do not read as findings while the rules still scan.
 */
function blankSupportsConditions(css) {
  return css.replace(/@supports[^{]*/g, (m) => ' '.repeat(m.length));
}

/**
 * Scan one stylesheet.
 * @param {string} css raw stylesheet text
 * @param {string} label how findings identify the file
 * @returns {{label: string, findings: string[]}}
 */
export function scanCss(css, label) {
  // `%23` is `#` inside an inline-SVG data URI — real paint, so normalise it.
  const text = blankSupportsConditions(css).replace(/%23/g, '#');
  const findings = [];

  for (const m of text.matchAll(HUE_UTILITY)) {
    findings.push(`${label} :: hue utility ${m[0]}`);
  }
  for (const m of text.matchAll(HEX)) {
    const rgb = hexToRgb(m[1]);
    if (isGold(rgb)) continue;
    if (spread(rgb) > SPREAD_MAX) {
      findings.push(`${label} :: #${m[1]} (spread ${spread(rgb)})`);
    }
  }
  for (const m of text.matchAll(RGB)) {
    const rgb = [channel(m[1]), channel(m[2]), channel(m[3])];
    if (rgb.some(Number.isNaN)) continue;
    if (isGold(rgb)) continue;
    if (spread(rgb) > SPREAD_MAX) {
      findings.push(`${label} :: rgb(${m[1]} ${m[2]} ${m[3]}) (spread ${spread(rgb).toFixed(0)})`);
    }
  }
  for (const m of text.matchAll(HSL)) {
    if (parseFloat(m[1]) > HSL_SAT_MAX) findings.push(`${label} :: hsl(… ${m[1]}% …)`);
  }
  for (const m of text.matchAll(OKLCH)) {
    const c = m[1].endsWith('%') ? parseFloat(m[1]) / 250 : parseFloat(m[1]);
    if (c > CHROMA_MAX) findings.push(`${label} :: oklch(… ${m[1]} …)`);
  }
  for (const m of text.matchAll(OKLAB)) {
    const a = m[1].endsWith('%') ? parseFloat(m[1]) / 250 : parseFloat(m[1]);
    const b = m[2].endsWith('%') ? parseFloat(m[2]) / 250 : parseFloat(m[2]);
    if (Math.hypot(a, b) > CHROMA_MAX) findings.push(`${label} :: oklab(… ${m[1]} ${m[2]})`);
  }

  return { label, findings: [...new Set(findings)] };
}

/** Every `.css` file under a directory, or the file itself. */
export function collectCss(target) {
  const st = statSync(target);
  if (st.isFile()) return [target];
  const out = [];
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const p = join(target, entry.name);
    if (entry.isDirectory()) out.push(...collectCss(p));
    else if (entry.name.endsWith('.css')) out.push(p);
  }
  return out.sort();
}

/**
 * Scan every stylesheet under the given targets.
 * @param {string[]} targets files or directories
 * @param {string} root path findings are reported relative to
 */
export function scanTargets(targets, root = process.cwd()) {
  const results = [];
  for (const target of targets) {
    for (const file of collectCss(target)) {
      results.push(scanCss(readFileSync(file, 'utf8'), relative(root, file) || file));
    }
  }
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const targets = process.argv.slice(2);
  if (targets.length === 0) {
    console.error('usage: node scripts/validate/css_chroma_scan.mjs <file.css|dir> [...]');
    process.exit(2);
  }
  const results = scanTargets(targets);
  let total = 0;
  for (const { label, findings } of results) {
    total += findings.length;
    console.log(`${findings.length === 0 ? 'PASS' : 'FAIL'}  ${label}  (${findings.length} finding(s))`);
    for (const f of findings) console.log(`      ${f}`);
  }
  console.log(`\n${results.length} stylesheet(s) scanned · ${total} finding(s)`);
  console.log(`rule: channel spread > ${SPREAD_MAX}, OKLCH chroma > ${CHROMA_MAX}, HSL saturation > ${HSL_SAT_MAX}%, or a Tailwind hue utility; gold is the one sanctioned hue`);
  process.exit(total === 0 ? 0 : 1);
}
