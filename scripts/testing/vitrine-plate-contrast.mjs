#!/usr/bin/env node
/**
 * Vitrine plate contrast gate (G-V3 CORRECTION, task t_g2_v3).
 *
 * The adversarial reviewer failed G-V3 live on b0513692: through the plate's
 * rest opacity an independent reviewer could not certify that the *primary*
 * (load-bearing) strokes of the six mechanism drawings composite to >= 4.5:1,
 * and two plates (verifier-loop, scroll-rail) drew their whole mechanism in
 * <line>/<circle> with no <path>, so a path-sampling probe measured nothing.
 *
 * This script is the standing gate that stops that regressing. It reads the
 * real source of truth — the palette tokens, the plate's rest opacity, the
 * three drawing contrast tiers, and the per-plate class usage — then rasterises
 * each tier's stroke with a supersampling pixel sampler and composites it
 * exactly the way the browser does (stroke over the plate's ink ground, then
 * the whole plate at its rest opacity over the page, and again over a
 * deliberately brightened "live" ground to model the field/shader bleed the
 * ADV review measured against). It asserts, per plate:
 *
 *   - every plate has >= 1 primary stroke and >= 1 label  (the missing-<path>
 *     failure cannot recur: the check is on the tier class, not the tag);
 *   - primary strokes composite >= 4.5:1 on both the rest and the brightened
 *     ground, at the worst pixel alignment;
 *   - labels composite >= 4.5:1;
 *   - guide strokes stay subordinate to the primaries but still clear 3:1.
 *
 * No external dependency: the sampler is a few dozen lines of area coverage.
 * Run: node scripts/testing/vitrine-plate-contrast.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');
const read = (p) => readFileSync(resolve(ROOT, p), 'utf8');

const GLOBALS = read('app/globals.css');
const VITRINE_CSS = read('components/sections/Vitrine/Vitrine.module.css');
const DRAW_CSS = read('components/sections/Vitrine/Drawings.module.css');
const DRAW_TSX = read('components/sections/Vitrine/Drawings.tsx');

// ── Colour + contrast primitives ────────────────────────────────────────────
const hexToRgb = (hex) => {
  const h = hex.replace('#', '').trim();
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
};

const srgbToLin = (c8) => {
  const c = c8 / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminance = ([r, g, b]) =>
  0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);

const contrast = (fg, bg) => {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a >= b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
};

// Composite a source colour with alpha `a` over a `bg` colour (both rgb).
const over = (src, a, bg) => src.map((c, i) => c * a + bg[i] * (1 - a));

// ── Token + CSS extraction (source is the single point of truth) ─────────────
const cssVar = (css, name) => {
  const m = css.match(new RegExp(`--${name}\\s*:\\s*(#[0-9a-fA-F]{3,6})`));
  if (!m) throw new Error(`token --${name} not found`);
  return hexToRgb(m[1]);
};

const WHITE = cssVar(GLOBALS, 'white');
const MIST200 = cssVar(GLOBALS, 'mist-200');
const INK900 = cssVar(GLOBALS, 'ink-900');

// Plate rest opacity: the FIRST `.plate { ... opacity: X }` block (the lit
// state is `.plate[data-lit]`, later and separately selected).
const plateBlock = VITRINE_CSS.match(/\.plate\s*\{[^}]*\}/);
if (!plateBlock) throw new Error('.plate block not found');
const plateOpacity = Number(plateBlock[0].match(/opacity:\s*([0-9.]+)/)[1]);

// Tier declarations from Drawings.module.css.
const tierBlock = (name) => {
  const m = DRAW_CSS.match(new RegExp(`\\.${name}\\s*\\{([^}]*)\\}`));
  if (!m) throw new Error(`.${name} block not found`);
  return m[1];
};
const decl = (block, prop, dflt) => {
  const m = block.match(new RegExp(`(?:^|[;{\\s])${prop}\\s*:\\s*([0-9.]+)`));
  return m ? Number(m[1]) : dflt;
};

const primaryCss = tierBlock('primary');
const guideCss = tierBlock('guide');
const labelCss = tierBlock('label');

const TIERS = {
  primary: {
    colour: WHITE, // currentColor === .drawing color (var(--white))
    width: decl(primaryCss, 'stroke-width', NaN),
    strokeOpacity: decl(primaryCss, 'stroke-opacity', 1),
    elementOpacity: decl(primaryCss, 'opacity', 1),
    floor: 4.5,
  },
  guide: {
    colour: WHITE,
    width: decl(guideCss, 'stroke-width', NaN),
    strokeOpacity: decl(guideCss, 'stroke-opacity', 1),
    elementOpacity: decl(guideCss, 'opacity', 1),
    floor: 3.0,
  },
  // A label is a filled glyph, not a stroked line: its ink covers whole pixels,
  // so coverage is 1. It is modelled here to certify the >= 4.5:1 floor.
  label: {
    colour: WHITE,
    width: Infinity,
    strokeOpacity: 1,
    elementOpacity: decl(labelCss, 'opacity', 1),
    floor: 4.5,
  },
};

// ── Pixel sampler ────────────────────────────────────────────────────────────
// A straight stroke of device width `w` renders as an anti-aliased band. The
// coverage of a single pixel is the fraction of its 1px cell the band overlaps.
// A pixel-wide sampler across every sub-pixel phase returns the WORST (lowest)
// peak coverage any single alignment can produce, because a horizontal/vertical
// stroke lands on ONE phase for its whole length and a reviewer sampling it
// reads exactly that value. SS sub-samples per axis.
const worstPeakCoverage = (w, ss = 64) => {
  if (!isFinite(w)) return 1; // filled glyph
  let worst = 1;
  for (let phase = 0; phase < ss; phase++) {
    const centre = phase / ss; // band centre within [0,1)
    const lo = centre - w / 2;
    const hi = centre + w / 2;
    // Peak coverage = the most-covered integer pixel cell the band touches.
    let peak = 0;
    for (let px = Math.floor(lo) - 1; px <= Math.ceil(hi) + 1; px++) {
      const cover = Math.max(0, Math.min(hi, px + 1) - Math.max(lo, px));
      if (cover > peak) peak = cover;
    }
    if (peak < worst) worst = peak;
  }
  return worst;
};

// Compose a tier's stroke to a final on-screen colour and its background, on a
// given field colour bleeding through the plate's rest opacity.
const composite = (tier, field) => {
  const cov = worstPeakCoverage(tier.width);
  const a = cov * tier.strokeOpacity * tier.elementOpacity;
  // Within the plate layer the ground is the opaque plate background (ink-900).
  const layerStroke = over(tier.colour, a, INK900);
  const layerGround = INK900;
  // The plate is drawn at its rest opacity over the page/field.
  const finalStroke = over(layerStroke, plateOpacity, field);
  const finalGround = over(layerGround, plateOpacity, field);
  return contrast(finalStroke, finalGround);
};

// Two grounds: the page itself (ink-900) and a brightened live ground that
// models the WebGL field + shader light the ADV review measured against.
const GROUNDS = {
  rest: INK900,
  'live-field': [120, 120, 120],
};

// ── Per-plate class usage from Drawings.tsx ──────────────────────────────────
// Each plate is one function; split on the numbered banner comments so a class
// is attributed to the plate it is drawn in.
const PLATES = [
  ['01 pipeline-gate', 'function PipelineGate'],
  ['02 rebuild-loop', 'function RebuildLoop'],
  ['03 verifier-loop', 'function VerifierLoop'],
  ['04 reconstruction-bands', 'function ReconstructionBands'],
  ['05 diamond-chart', 'function DiamondChart'],
  ['06 scroll-rail', 'function ScrollRail'],
];

const plateSource = (marker, next) => {
  const start = DRAW_TSX.indexOf(marker);
  if (start < 0) throw new Error(`plate ${marker} not found`);
  const end = next ? DRAW_TSX.indexOf(next, start + marker.length) : DRAW_TSX.length;
  return DRAW_TSX.slice(start, end < 0 ? DRAW_TSX.length : end);
};

const count = (src, cls) => (src.match(new RegExp(`styles\\.${cls}\\b`, 'g')) || []).length;

// ── Run ──────────────────────────────────────────────────────────────────────
let failed = 0;
const rows = [];

// Tier-level contrast, computed once (tiers are uniform across plates).
const tierContrast = {};
for (const [name, tier] of Object.entries(TIERS)) {
  tierContrast[name] = {};
  for (const [g, field] of Object.entries(GROUNDS)) {
    tierContrast[name][g] = composite(tier, field);
  }
}

// Assert the hierarchy holds: a guide is never brighter than a primary.
const hierarchyOk = tierContrast.guide.rest < tierContrast.primary.rest;

for (let i = 0; i < PLATES.length; i++) {
  const [label, marker] = PLATES[i];
  const next = PLATES[i + 1]?.[1];
  const src = plateSource(marker, next);
  const nPrimary = count(src, 'primary');
  const nGuide = count(src, 'guide');
  const nLabel = count(src, 'label');

  const checks = [];
  checks.push(['>=1 primary', nPrimary >= 1]);
  checks.push(['>=1 label', nLabel >= 1]);
  checks.push([
    `primary rest ${tierContrast.primary.rest.toFixed(2)}:1 >= 4.5`,
    tierContrast.primary.rest >= TIERS.primary.floor,
  ]);
  checks.push([
    `primary live ${tierContrast.primary['live-field'].toFixed(2)}:1 >= 4.5`,
    tierContrast.primary['live-field'] >= TIERS.primary.floor,
  ]);
  checks.push([
    `label ${tierContrast.label.rest.toFixed(2)}:1 >= 4.5`,
    tierContrast.label.rest >= TIERS.label.floor,
  ]);
  if (nGuide > 0) {
    checks.push([
      `guide rest ${tierContrast.guide.rest.toFixed(2)}:1 >= 3.0`,
      tierContrast.guide.rest >= TIERS.guide.floor,
    ]);
  }

  const ok = checks.every(([, pass]) => pass) && hierarchyOk;
  if (!ok) failed++;
  rows.push({ label, nPrimary, nGuide, nLabel, ok, checks });
}

// ── Report ───────────────────────────────────────────────────────────────────
console.log('Vitrine plate contrast gate — G-V3 CORRECTION (t_g2_v3)');
console.log('');
console.log(`  palette      white=${WHITE} mist200=${MIST200} ink900=${INK900}`);
console.log(`  plate rest   opacity ${plateOpacity}`);
console.log(
  `  primary      w=${TIERS.primary.width} strokeOpacity=${TIERS.primary.strokeOpacity} ` +
    `-> rest ${tierContrast.primary.rest.toFixed(2)}:1  live ${tierContrast.primary['live-field'].toFixed(2)}:1`,
);
console.log(
  `  guide        w=${TIERS.guide.width} strokeOpacity=${TIERS.guide.strokeOpacity} ` +
    `-> rest ${tierContrast.guide.rest.toFixed(2)}:1  live ${tierContrast.guide['live-field'].toFixed(2)}:1`,
);
console.log(
  `  label        opacity=${TIERS.label.elementOpacity} ` +
    `-> rest ${tierContrast.label.rest.toFixed(2)}:1`,
);
console.log(`  hierarchy    guide < primary at rest: ${hierarchyOk ? 'yes' : 'NO'}`);
console.log('');

for (const r of rows) {
  console.log(
    `  ${r.ok ? 'PASS' : 'FAIL'}  plate ${r.label}  ` +
      `(primary ${r.nPrimary}, guide ${r.nGuide}, label ${r.nLabel})`,
  );
  for (const [desc, pass] of r.checks) {
    if (!pass) console.log(`          ✗ ${desc}`);
  }
}

console.log('');
if (failed === 0) {
  console.log(`All ${rows.length} plates pass the rest-primary contrast gate.`);
  process.exit(0);
} else {
  console.log(`${failed}/${rows.length} plates FAILED the contrast gate.`);
  process.exit(1);
}
