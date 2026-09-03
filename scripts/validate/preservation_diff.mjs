#!/usr/bin/env node
/**
 * T-37 · Baseline preservation diff  →  R-165 … R-171 / SC-87.1 / Gate R
 *
 * The v6 contract's Preservation Register names the things this site already does
 * better than most executive portfolios ever will — the per-metric provenance
 * labels, the three-state calibration with its evidence and qualifying
 * footnotes, the repository *Limits* lines, the *Excluded, and why* list, the
 * ten-dimension framing with its cited source file, the duration-true timeline,
 * the bespoke per-repository diagrams. R-171 is blunt about the consequence:
 * losing, diluting, hiding or softening any of them is a regression that fails
 * Gate R **irrespective of any improvement delivered alongside it**.
 *
 * So this asks one question after every deployment: is anything weaker than it
 * was? A preserved asset that MOVED is fine. One that WEAKENED is a failure.
 *
 * WHY IT DRIVES A BROWSER RATHER THAN GREPPING THE HTML
 * ----------------------------------------------------
 * The first attempt at this diff stripped tags and searched the remaining text.
 * It reported fifty-four losses, and every one of them was a lie: the baseline
 * records `aria-label` values, inline `style` attributes and the geometry of the
 * timeline bars, none of which survive tag-stripping. A diff that cries wolf on
 * its first run gets switched off by the second, so this one reads the rendered
 * DOM the way the baseline capture did — text, attributes and computed geometry
 * together — and compares like with like.
 *
 * USAGE
 *   node scripts/validate/preservation_diff.mjs [--url <target>] [--json <path>]
 *
 * Exit 0 when nothing weakened. Exit 1, loudly and specifically, when something did.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { chromium } from 'playwright';

const ROOT = resolve(import.meta.dirname, '..', '..');
const BASELINE = resolve(
  ROOT,
  'docs/delivery/evidence/v6-20260903T195241Z/T37-baseline-inventory.json',
);

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const TARGET = flag('--url', 'https://forgotten-mistory.web.app/');
const REPORT = flag('--json', null);

/**
 * Values the baseline recorded that are *addresses*, not *content*. A CSS
 * selector, a class-hashed path or a media URL says where something was, and
 * where something is may legitimately change — this diff is about whether the
 * claim survived, not whether the markup was refactored.
 */
const ADDRESS = /^[#.]|>\s|__[A-Za-z0-9_]{4,}|^https?:\/\/|\.(png|jpe?g|mp4|vtt|css|js|webp|avif)$/;
const ADDRESS_KEY = /selector|path|href|src|url|screenshot|file|digest|md5/i;

/** Every human-readable string the baseline asserts, with the key that carried it. */
function claimsIn(node, key = '', out = []) {
  if (typeof node === 'string') {
    const s = node.trim();
    if (s.length >= 25 && !ADDRESS.test(s) && !ADDRESS_KEY.test(key)) out.push({ key, value: s });
  } else if (Array.isArray(node)) {
    for (const v of node) claimsIn(v, key, out);
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) claimsIn(v, k, out);
  }
  return out;
}

/**
 * The haystack: everything a reader or a machine can perceive on the page —
 * visible text, the accessible names that speak to a screen reader, and the
 * inline geometry that makes the timeline duration-true. The baseline captured
 * all three, so all three have to be searchable or the comparison is unfair.
 */
function harvest() {
  const parts = [];
  // BOTH, and the order matters for why:
  //   innerText  — what a sighted reader sees right now, respecting visibility.
  //   textContent — everything the document actually carries, including the
  //                 nine role panels the Experience accordion keeps collapsed.
  // Preservation asks whether a claim still EXISTS, and a claim behind a
  // disclosure control still exists. Reading innerText alone reported all
  // twenty-four collapsed Experience bullets as deleted while every one of them
  // was present in the shipped HTML — the exact false alarm that gets a gate
  // switched off. Whether those claims are *reachable* is a different question,
  // owned by the accessibility suite, and it is not this script's to answer.
  parts.push(document.body.innerText);
  parts.push(document.body.textContent ?? '');
  const ATTRS = ['aria-label', 'aria-description', 'aria-roledescription', 'alt', 'title', 'style', 'datetime', 'href'];
  for (const el of document.querySelectorAll('*')) {
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (v) parts.push(v);
    }
  }
  for (const el of document.querySelectorAll('title, desc')) parts.push(el.textContent ?? '');
  return parts.join('\n');
}

const REGISTER = [
  ['1_metrics_with_provenance', 'R-165 · metric provenance labels'],
  ['2_skills_calibration_semantics', 'R-166 · the calibration card'],
  ['3_vitrine_repository_cards', 'R-167 · Limits and the exclusion list'],
  ['4_ten_dimension_framing', 'R-168 · the ten-dimension framing'],
  ['5_experience_timeline', 'R-169 · the duration-true timeline'],
  ['6_bespoke_diagrams_and_captions', 'R-169 · the bespoke diagrams'],
];

/**
 * Deliberately removed, with the commit that removed it and the requirement that
 * ordered it. Without this the diff would report R-147's shipped removal as a
 * preservation failure for ever — and a check that reports a completed
 * deliverable as a defect is a check nobody will keep running.
 */
const SANCTIONED_REMOVALS = [
  {
    match: /AI-generated: my photograph|Hello\. I['’]m Vikram Deshpande|Read it instead/,
    reason:
      'R-147 removed the self-presentation clip (commit 9733a85). Its accuracy survives as the ' +
      'production credit in the footer, per R-158.',
  },
];

const normalise = (s) =>
  s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\u00a0/g, ' ')
    // Whitespace last, and removed entirely rather than collapsed: the baseline
    // recorded concatenated sibling nodes with no separator between them, and
    // innerText puts one back. The letters are the claim; the spacing is markup.
    .replace(/\s+/g, '')
    .toLowerCase();

const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(TARGET, { waitUntil: 'networkidle', timeout: 60000 });
for (const id of ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen']) {
  await page.evaluate((s) => document.querySelector(`#${s}`)?.scrollIntoView(), id);
  await page.waitForTimeout(700);
}
// Content hidden behind a control is not missing content, so every panel is
// opened before the page is read. Experience is an ACCORDION: opening one role
// closes the previous one, so clicking them all in a single pass leaves exactly
// one open and reports the other eight roles' bullets as deleted. Each control
// is therefore opened on its own, the page is read while it is open, and the
// readings are unioned into one haystack.
const readings = [await page.evaluate(harvest)];
for (const toggle of await page.$$('[aria-expanded]')) {
  try {
    await toggle.click({ timeout: 2000 });
    await page.waitForTimeout(350);
    readings.push(await page.evaluate(harvest));
  } catch {
    // A control that will not accept a click is not hiding content behind one.
  }
}
const haystack = normalise(readings.join('\n'));
await browser.close();

let lost = 0;
let checked = 0;
const findings = [];

for (const [key, label] of REGISTER) {
  const claims = [...new Map(claimsIn(baseline[key]).map((c) => [c.value, c])).values()];
  const missing = claims.filter((c) => !haystack.includes(normalise(c.value)));
  const sanctioned = missing.filter((c) => SANCTIONED_REMOVALS.some((r) => r.match.test(c.value)));
  const real = missing.filter((c) => !sanctioned.includes(c));
  checked += claims.length;
  lost += real.length;

  console.log(`${label}: ${claims.length - missing.length}/${claims.length} preserved` +
    (sanctioned.length ? ` (+${sanctioned.length} removed by an explicit requirement)` : ''));
  for (const c of real) {
    findings.push({ register: label, key: c.key, value: c.value });
    console.log(`   WEAKENED [${c.key}] ${c.value.slice(0, 140)}`);
  }
}

console.log('');
console.log(`Checked ${checked} preserved claims against ${TARGET}`);
console.log(lost === 0
  ? 'PASS — nothing in the Preservation Register is missing, diluted or softened.'
  : `FAIL — ${lost} preserved claim(s) no longer render. R-171: a rebuild that loses a truth is a downgrade wearing better clothes.`);

if (REPORT) {
  writeFileSync(REPORT, JSON.stringify({ target: TARGET, checked, lost, findings }, null, 2));
  console.log(`report → ${REPORT}`);
}

process.exit(lost === 0 ? 0 : 1);
