import { test, expect, type Page } from '@playwright/test';

import { aboutContent } from '../../app/data/portfolio/about';
import { NOW, TIMELINE_START, roles } from '../../app/data/portfolio/experience';
import { greetingEnvelope } from '../../app/data/generated/greeting-envelope';
import { capabilities } from '../../app/data/portfolio/skills';
import { plates } from '../../app/data/portfolio/vitrine';
import {
  at,
  bootAt,
  decodeLuma,
  elementClip,
  groundLuminance,
  isolateScene,
  restorePage,
  slotClip,
  GL_ARGS,
  VIEWPORTS,
  type Clip,
  type LumaField,
} from '../helpers/isolate';

/**
 * TC-STORY-* — the story contract (`docs/architecture/SIGNATURE-SCENES-v2.md` §5).
 *
 * ## The question this file asks, and why nothing else asks it
 *
 * ADV-REVIEW-20260905T2315Z failed R2 with "six `data-scene` slots; GL is
 * wallpaper". Two suites already photograph these scenes and both pass:
 *
 *   - `flagship-visibility.spec.ts` asks **"is there light?"** — coverage,
 *     peak, motion, on the chrome-hidden capture.
 *   - `scene-about.spec.ts` `TC-SCENE-ABOUT-08` asks **"is it wired to the
 *     data?"** — the fan carries ten sectors, the light is bounded under type.
 *
 * Neither asks the question the reviewer is actually asking: **hide every word
 * on the page, photograph the slot, and can a stranger tell which section they
 * are looking at?** A field can be bright, moving, and correctly wired, and
 * still say nothing — that is the definition of wallpaper, and it is why six
 * passing scenes still failed R2.
 *
 * So every assertion below is **structural** — a histogram, a profile, a
 * centroid, a correlation. None of them asks for more light, and that is a
 * constraint rather than a style: SIGNATURE-SCENES-v1 §0.5 records three
 * sub-threshold margins (M-1 listen motion ×1.07, M-2 vitrine peak ×1.08,
 * M-3 vitrine AA ×1.04) where there is no brightness left to spend, and
 * `#experience`'s own fallback floor is already relaxed because `.roleDates`
 * would drop under 4.5:1 if the ground under it were lifted. **Type contrast
 * first, story second.**
 *
 * Every case runs at **both** `VIEWPORTS` (1440×900 and 390×844). A gate that
 * only asks at desktop ships a black rectangle to every phone — the defect
 * `flagship-visibility.spec.ts`'s own header records.
 *
 * ## This file is a TDD gate, and it is red on purpose
 *
 * SIGNATURE-SCENES-v2 §6.1: *"X2-T1 authors every `TC-STORY-*` assertion in §5
 * — including the two that cannot pass. A story contract with no red in it was
 * written after the fact."* Three groups are expected red when this lands:
 *
 *   1. **`TC-STORY-HERO-01`** — `atmosphere.glsl.ts` declares `poolPlate` and
 *      leaves it **unbound** (W2-RESEARCH §0). Binding it is owned by
 *      `HERO-SETPIECE-v3` §4.2 / `HERO-FOLD-v2` M4, **not by this lane** — this
 *      slice touches zero hero files and hands that lane a red target.
 *   2. **`TC-STORY-EXP-01`** — `strata.glsl.ts` draws "three drifting bands" at
 *      **one** depth; there is no parallax term, so the assertion is
 *      unsatisfiable today. Owned by slice **X2-F1** (G-E2).
 *   3. **`TC-STORY-DESCENT-01/02`** — the seventh scene `career-descent` is
 *      landed by slices **X2-S1…S3**; on a checkout without it the slot does
 *      not exist and these fail by name.
 *
 * None of them is `test.skip`ped, none is softened, and every threshold is
 * verbatim from SIGNATURE-SCENES-v2 §5. Weakening one to make this file green
 * is the violation this file exists to prevent.
 */

/* ────────────────────────── thresholds, verbatim from v2 §5 ───────────────── */

/** §5-1 — the hero's luminance centroid, as a share of the frame diagonal. */
const HERO_CENTROID_MAX_DIAG = 0.12;
/** §5-2 — the about fan's lobes, and how deep the minima between them cut. */
const ABOUT_MIN_LOBES = 8;
const ABOUT_MINIMA_DEPTH = 0.25;
/** §5-2 — the three role-side sectors sit this far under the seven answered. */
const ABOUT_ROLE_DEFICIT = 0.15;
/** §5-3 — depth planes, and the tolerance on a recovered span. */
const EXP_MIN_BAND_GROUPS = 2;
const EXP_SPANS_REQUIRED = 6;
const EXP_SPAN_TOLERANCE = 0.08;
/** §5-4 — `COVERAGE_DELTA`'s own step, reused as the production/bench split. */
const SKILLS_SPLIT_DELTA = 0.06;
/** §5-5 — six lights, monotonic, spanning this share of the slot. */
const VITRINE_CENTROID_SPAN = 0.55;
const VITRINE_TRANSLATION_DELTA = 0.01;
/** §5-6 — the band is the greeting, not an animation. */
const LISTEN_ENVELOPE_R = 0.7;
const LISTEN_SINE_R_MAX = 0.5;
/** §5-7 — the descent's strata, and how tightly spacing tracks duration. */
const DESCENT_MIN_EDGES = 8;
const DESCENT_RANK_R = 0.9;
/** §6.3 — the SPD instrument reused per section, at a floor below the fold's. */
const PLANE_SHARE_MIN = 0.5;

/* ───────────────────────────────── measurement ───────────────────────────── */

/** Column means (x → mean luminance) of a capture. */
function columnProfile(field: LumaField): Float64Array {
  const out = new Float64Array(field.width);
  for (let x = 0; x < field.width; x += 1) {
    let sum = 0;
    for (let y = 0; y < field.height; y += 1) sum += at(field, x, y);
    out[x] = sum / field.height;
  }
  return out;
}

/** Row means (y → mean luminance) of a capture. */
function rowProfile(field: LumaField): Float64Array {
  const out = new Float64Array(field.height);
  for (let y = 0; y < field.height; y += 1) {
    let sum = 0;
    for (let x = 0; x < field.width; x += 1) sum += at(field, x, y);
    out[y] = sum / field.width;
  }
  return out;
}

/** Luminance-weighted x centroid, 0..1 of the field's width. */
function xCentroid(field: LumaField, ground: number): number {
  let weight = 0;
  let moment = 0;
  for (let y = 0; y < field.height; y += 1) {
    for (let x = 0; x < field.width; x += 1) {
      const m = Math.max(0, at(field, x, y) - ground);
      weight += m;
      moment += m * x;
    }
  }
  return weight === 0 ? 0.5 : moment / weight / Math.max(1, field.width - 1);
}

/** Luminance-weighted centroid in pixels, for the hero's "light on the man". */
function centroid(field: LumaField, ground: number): { x: number; y: number; weight: number } {
  let weight = 0;
  let mx = 0;
  let my = 0;
  for (let y = 0; y < field.height; y += 1) {
    for (let x = 0; x < field.width; x += 1) {
      const m = Math.max(0, at(field, x, y) - ground);
      weight += m;
      mx += m * x;
      my += m * y;
    }
  }
  if (weight === 0) return { x: field.width / 2, y: field.height / 2, weight: 0 };
  return { x: mx / weight, y: my / weight, weight };
}

/** A boxcar smooth, so pixel noise does not read as a lobe or a stratum edge. */
function smooth(series: ArrayLike<number>, radius: number): Float64Array {
  const n = series.length;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    let sum = 0;
    let count = 0;
    for (let k = -radius; k <= radius; k += 1) {
      const j = i + k;
      if (j < 0 || j >= n) continue;
      sum += series[j];
      count += 1;
    }
    out[i] = count === 0 ? 0 : sum / count;
  }
  return out;
}

/**
 * Local maxima of a series, each required to stand `depth` (as a share of its
 * own height above the series floor) clear of the minimum separating it from
 * its neighbour. `wrap` closes the series into a circle — which is what an
 * angular histogram is.
 */
function lobes(series: ArrayLike<number>, depth: number, wrap: boolean): number[] {
  const n = series.length;
  const idx = (i: number) => (wrap ? (i + n) % n : Math.min(Math.max(i, 0), n - 1));
  const peaks: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const v = series[idx(i)];
    if (v > series[idx(i - 1)] && v >= series[idx(i + 1)]) peaks.push(i);
  }
  if (peaks.length < 2) return peaks;
  const kept: number[] = [];
  for (let p = 0; p < peaks.length; p += 1) {
    const here = peaks[p];
    const next = peaks[(p + 1) % peaks.length];
    // The minimum on the arc from `here` to `next`.
    let valley = Infinity;
    for (let i = here; ; i += 1) {
      const j = idx(i);
      valley = Math.min(valley, series[j]);
      if (j === idx(next)) break;
      if (!wrap && j === n - 1) break;
    }
    const peakValue = Math.max(series[idx(here)], series[idx(next)]);
    if (peakValue > 0 && valley <= peakValue * (1 - depth)) kept.push(here);
  }
  return kept;
}

/** Pearson product-moment correlation. */
function pearson(a: ArrayLike<number>, b: ArrayLike<number>): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  let ma = 0;
  let mb = 0;
  for (let i = 0; i < n; i += 1) {
    ma += a[i];
    mb += b[i];
  }
  ma /= n;
  mb /= n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i += 1) {
    const x = a[i] - ma;
    const y = b[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  const den = Math.sqrt(da * db);
  return den === 0 ? 0 : num / den;
}

/** Ranks, average-tied — the input to Spearman. */
function ranks(values: readonly number[]): number[] {
  const order = values.map((v, i) => ({ v, i })).sort((p, q) => p.v - q.v);
  const out = new Array<number>(values.length).fill(0);
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j + 1 < order.length && order[j + 1].v === order[i].v) j += 1;
    const mean = (i + j) / 2 + 1;
    for (let k = i; k <= j; k += 1) out[order[k].i] = mean;
    i = j + 1;
  }
  return out;
}

/** Spearman rank correlation. */
function spearman(a: readonly number[], b: readonly number[]): number {
  return pearson(ranks(a), ranks(b));
}

/** Resamples a series onto `n` evenly spaced points (nearest-neighbour). */
function resample(series: ArrayLike<number>, n: number): Float64Array {
  const out = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const t = series.length === 1 ? 0 : (i / (n - 1)) * (series.length - 1);
    out[i] = series[Math.round(t)];
  }
  return out;
}

/**
 * Mean |Δ| between two column profiles after the best-fit x shift, which is
 * what "not a translation of one another" means: slide one over the other and
 * take the *smallest* residual it can reach.
 */
function residualAfterBestShift(a: Float64Array, b: Float64Array, maxShift: number): number {
  let best = Infinity;
  for (let s = -maxShift; s <= maxShift; s += 1) {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < a.length; i += 1) {
      const j = i + s;
      if (j < 0 || j >= b.length) continue;
      sum += Math.abs(a[i] - b[j]);
      count += 1;
    }
    if (count > 0) best = Math.min(best, sum / count);
  }
  return best === Infinity ? 0 : best;
}

/** Contiguous runs of a profile above `floor`, returned as normalised extents. */
function extents(profile: Float64Array, floor: number): Array<{ from: number; to: number }> {
  const found: Array<{ from: number; to: number }> = [];
  let start = -1;
  for (let i = 0; i < profile.length; i += 1) {
    if (profile[i] >= floor) {
      if (start < 0) start = i;
    } else if (start >= 0) {
      found.push({ from: start / profile.length, to: i / profile.length });
      start = -1;
    }
  }
  if (start >= 0) found.push({ from: start / profile.length, to: 1 });
  return found;
}

/* ─────────────────────────────── page plumbing ───────────────────────────── */

test.use({ deviceScaleFactor: 1, launchOptions: { args: GL_ARGS } });

/** Every capture in this file is taken through the same door. */
async function captureScene(page: Page, scene: string, clip?: Clip): Promise<LumaField> {
  const box = clip ?? (await slotClip(page, scene));
  await isolateScene(page, scene);
  const shot = await page.screenshot({ clip: box });
  await restorePage(page);
  return decodeLuma(shot);
}

/**
 * Waits for the scene's canvas and lets the shader settle, as §5's capture does.
 *
 * The scroll comes **first** and is not optional: every section below the fold
 * is behind `InViewGate`, so a canvas that is waited for before its slot has
 * been scrolled to never attaches and the wait reports a 30 s timeout instead
 * of the truth. `flagship-visibility.spec.ts` gets this right by calling
 * `slotClip` (which scrolls) before its own `canvas.waitFor`; this is the same
 * order, stated explicitly so it cannot be reordered by accident.
 */
async function readyScene(page: Page, scene: string) {
  await slotClip(page, scene);
  const canvas = page.locator(`[data-scene="${scene}"] canvas`);
  await canvas.waitFor({ state: 'attached', timeout: 30000 });
  await page.waitForTimeout(2500);
}

/** A slot's presence, reported by name rather than as a timeout. */
async function requireSlot(page: Page, scene: string, owner: string) {
  const count = await page.locator(`[data-scene="${scene}"]`).count();
  expect(
    count,
    `no [data-scene="${scene}"] on the page — the scene has not landed yet. Owning lane: ${owner}.`,
  ).toBeGreaterThan(0);
}

for (const viewport of VIEWPORTS) {
  const w = viewport.width;

  test.describe(`TC-STORY @ ${w} — every field says its own section`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    /* ── §5-1 #hero — the light is on the man ─────────────────────────────── */

    test(`TC-STORY-HERO-01 @ ${w} — the plane's brightest region is where the figure is`, async ({
      page,
    }) => {
      test.setTimeout(120000);
      await bootAt(page, '/?gl=force');
      await requireSlot(page, 'hero-atmosphere', 'HERO-SETPIECE-v3 §4.2 / HERO-FOLD-v2 M4');
      await readyScene(page, 'hero-atmosphere');

      const ground = await groundLuminance(page, 'hero');
      const clip = await slotClip(page, 'hero-atmosphere');

      // The figure's box is read from the DOM at runtime and never hard-coded:
      // the fold reflows at four viewports and this lane is forbidden from
      // touching a hero file to add a hook. Candidates in priority order — the
      // first that resolves to a box wins.
      const FIGURE_SELECTORS = [
        '#hero [data-hero-figure]',
        '#hero [data-portrait]',
        '#hero picture img',
        '#hero img',
        '#hero figure',
        '#hero [class*="portrait"]',
        '#hero [class*="figure"]',
      ];
      let figure: Clip | null = null;
      let usedSelector = '';
      for (const selector of FIGURE_SELECTORS) {
        // eslint-disable-next-line no-await-in-loop
        const box = await elementClip(page, selector);
        if (box && box.width > 8 && box.height > 8) {
          figure = box;
          usedSelector = selector;
          break;
        }
      }
      expect(
        figure,
        'the hero fold exposes no figure box to measure against ' +
          `(tried ${FIGURE_SELECTORS.join(', ')}). The light-on-the-man contract cannot be ` +
          'evaluated until HERO-SETPIECE-v3 §4.2 lands the figure inside the plane.',
      ).not.toBeNull();

      const field = await captureScene(page, 'hero-atmosphere', clip);
      const c = centroid(field, ground);
      // Both points in the slot's own pixel frame.
      const figureCx = figure!.x + figure!.width / 2 - clip.x;
      const figureCy = figure!.y + figure!.height / 2 - clip.y;
      const diagonal = Math.hypot(field.width, field.height);
      const offset = Math.hypot(c.x - figureCx, c.y - figureCy) / diagonal;

      // eslint-disable-next-line no-console
      console.log(
        `[story:hero@${w}] selector=${usedSelector} centroid=(${c.x.toFixed(1)},${c.y.toFixed(1)}) ` +
          `figure=(${figureCx.toFixed(1)},${figureCy.toFixed(1)}) offset=${offset.toFixed(4)} diag`,
      );

      expect(
        offset,
        `the plane's luminance centroid sits ${(offset * 100).toFixed(1)}% of the frame diagonal ` +
          `from the figure's centre (bar: ${HERO_CENTROID_MAX_DIAG * 100}%) — plane and portrait ` +
          'read as two objects, not one. `poolPlate` is declared and unbound in ' +
          'atmosphere.glsl.ts; binding it is owned by HERO-SETPIECE-v3 §4.2 / HERO-FOLD-v2 M4, ' +
          'not by SIGNATURE-SCENES-v2. TC-HERO-PLANE-01 SPD ≥ 0.75 is a different question and ' +
          'is untouched by this assertion.',
      ).toBeLessThanOrEqual(HERO_CENTROID_MAX_DIAG);
    });

    /* ── §5-2 #about — ten dimensions, and they are not interchangeable ───── */

    test(`TC-STORY-ABOUT-01 @ ${w} — the fan is a ring of ten, not one glow`, async ({ page }) => {
      test.setTimeout(120000);
      await bootAt(page, '/?gl=force');
      await readyScene(page, 'about-field');

      const ground = await groundLuminance(page, 'about');
      const clip = await slotClip(page, 'about-field');
      const instrument = await elementClip(page, '#about svg');
      const field = await captureScene(page, 'about-field', clip);

      // `uCentre` is set from the instrument's own rect every frame
      // (AboutField.tsx:199). The histogram is taken about the same point, read
      // from the DOM, so a reflow moves both together.
      const cx = instrument ? instrument.x + instrument.width / 2 - clip.x : field.width / 2;
      const cy = instrument ? instrument.y + instrument.height / 2 - clip.y : field.height / 2;

      const bins = new Float64Array(360);
      const counts = new Float64Array(360);
      for (let y = 0; y < field.height; y += 1) {
        for (let x = 0; x < field.width; x += 1) {
          const dx = x - cx;
          const dy = y - cy;
          const r = Math.hypot(dx, dy);
          if (r < 8) continue;
          // Clockwise from twelve o'clock — the frame `field.glsl.ts:219`
          // (`atan(p.x, p.y)`) and `Compass.tsx:44` (`angleDeg - 90`) share.
          let a = (Math.atan2(dx, -dy) * 180) / Math.PI;
          if (a < 0) a += 360;
          const bin = Math.min(359, Math.floor(a));
          bins[bin] += Math.max(0, at(field, x, y) - ground);
          counts[bin] += 1;
        }
      }
      for (let i = 0; i < 360; i += 1) bins[i] = counts[i] > 0 ? bins[i] / counts[i] : 0;
      const histogram = smooth(bins, 4);
      const found = lobes(histogram, ABOUT_MINIMA_DEPTH, true);

      // eslint-disable-next-line no-console
      console.log(
        `[story:about-01@${w}] centre=(${cx.toFixed(1)},${cy.toFixed(1)}) lobes=${found.length} ` +
          `peak=${Math.max(...histogram).toFixed(5)}`,
      );

      expect(
        found.length,
        `the about field's 360-bin angular histogram has ${found.length} lobes separated by ` +
          `minima ≥${ABOUT_MINIMA_DEPTH * 100}% below their peaks — a reader cannot count ten ` +
          'dimensions in it. The section is "Ten dimensions, answered"; the field has to be ' +
          'able to say ten.',
      ).toBeGreaterThanOrEqual(ABOUT_MIN_LOBES);
    });

    test(`TC-STORY-ABOUT-02 @ ${w} — the three role-side sectors read open`, async ({ page }) => {
      test.setTimeout(120000);
      await bootAt(page, '/?gl=force');
      await readyScene(page, 'about-field');

      const ground = await groundLuminance(page, 'about');
      const clip = await slotClip(page, 'about-field');
      const instrument = await elementClip(page, '#about svg');
      const field = await captureScene(page, 'about-field', clip);

      const cx = instrument ? instrument.x + instrument.width / 2 - clip.x : field.width / 2;
      const cy = instrument ? instrument.y + instrument.height / 2 - clip.y : field.height / 2;

      const bins = new Float64Array(360);
      const counts = new Float64Array(360);
      for (let y = 0; y < field.height; y += 1) {
        for (let x = 0; x < field.width; x += 1) {
          const dx = x - cx;
          const dy = y - cy;
          if (Math.hypot(dx, dy) < 8) continue;
          let a = (Math.atan2(dx, -dy) * 180) / Math.PI;
          if (a < 0) a += 360;
          const bin = Math.min(359, Math.floor(a));
          bins[bin] += Math.max(0, at(field, x, y) - ground);
          counts[bin] += 1;
        }
      }
      for (let i = 0; i < 360; i += 1) bins[i] = counts[i] > 0 ? bins[i] / counts[i] : 0;
      const histogram = smooth(bins, 4);

      // `uRotation` is live (the rose turns as the reader scrolls), so the ten
      // sector centres are found rather than assumed: the offset that best
      // aligns ten evenly spaced spokes to the measured histogram.
      let bestPhi = 0;
      let bestScore = -Infinity;
      for (let phi = 0; phi < 36; phi += 0.5) {
        let score = 0;
        for (let k = 0; k < 10; k += 1) {
          score += histogram[Math.round(phi + k * 36) % 360];
        }
        if (score > bestScore) {
          bestScore = score;
          bestPhi = phi;
        }
      }

      const sectorMean = (k: number) => {
        let sum = 0;
        let n = 0;
        for (let d = -14; d <= 14; d += 1) {
          const a = Math.round(bestPhi + k * 36 + d + 720) % 360;
          sum += histogram[a];
          n += 1;
        }
        return sum / n;
      };

      const sides = aboutContent.dimensions.map((d) => d.side);
      expect(sides.length, 'the about section is a ten-dimension instrument').toBe(10);
      const roleSectors = sides.map((s, i) => (s === 'role' ? i : -1)).filter((i) => i >= 0);
      const candidateSectors = sides.map((s, i) => (s === 'candidate' ? i : -1)).filter((i) => i >= 0);
      expect(roleSectors.length, 'three of the ten are measured from the role').toBe(3);

      const roleMean = roleSectors.reduce((sum, k) => sum + sectorMean(k), 0) / roleSectors.length;
      const candidateMean =
        candidateSectors.reduce((sum, k) => sum + sectorMean(k), 0) / candidateSectors.length;
      const deficit = candidateMean === 0 ? 0 : (candidateMean - roleMean) / candidateMean;

      // eslint-disable-next-line no-console
      console.log(
        `[story:about-02@${w}] phi=${bestPhi} role=${roleMean.toFixed(5)} ` +
          `candidate=${candidateMean.toFixed(5)} deficit=${deficit.toFixed(4)}`,
      );

      expect(
        deficit,
        `the three role-side sectors sit only ${(deficit * 100).toFixed(1)}% under the seven ` +
          `answered ones (bar: ${ABOUT_ROLE_DEFICIT * 100}%) — the field grades an open ` +
          'dimension the same as an answered one, which is the caliper rule broken in light.',
      ).toBeGreaterThanOrEqual(ABOUT_ROLE_DEFICIT);
    });

    /* ── §5-3 #experience — sixteen years have depth ──────────────────────── */

    test(`TC-STORY-EXP-01 @ ${w} — the strata are at ≥ 2 depths, not one gradient`, async ({
      page,
    }) => {
      test.setTimeout(150000);
      await bootAt(page, '/?gl=force');
      await readyScene(page, 'career-strata');

      const ground = await groundLuminance(page, 'experience');
      const clip = await slotClip(page, 'career-strata');

      const first = await captureScene(page, 'career-strata', clip);
      // The camera moves: a parallax field answers a scroll delta with *different*
      // pixel motion per plane; a gradient answers it with one.
      await page.mouse.wheel(0, 240);
      await page.waitForTimeout(900);
      const clipAfter = await slotClip(page, 'career-strata');
      const second = await captureScene(page, 'career-strata', clipAfter);

      const peaksOf = (f: LumaField) =>
        lobes(smooth(rowProfile(f), 3), 0.08, false).filter((y) => y > 2 && y < f.height - 3);
      const before = peaksOf(first);
      const after = peaksOf(second);

      // Pair each band with its nearest neighbour in the second capture and read
      // how far it travelled.
      const shifts: number[] = [];
      for (const y of before) {
        let best = Infinity;
        for (const z of after) if (Math.abs(z - y) < Math.abs(best)) best = z - y;
        if (Number.isFinite(best)) shifts.push(best);
      }
      const distinct = new Set(shifts.map((s) => Math.round(s))).size;

      // eslint-disable-next-line no-console
      console.log(
        `[story:exp-01@${w}] bands before=${before.length} after=${after.length} ` +
          `shifts=[${shifts.map((s) => s.toFixed(0)).join(',')}] distinct=${distinct}`,
      );

      expect(
        before.length,
        `the strata field's vertical luminance profile has ${before.length} band groups — ` +
          'fewer than two planes cannot show depth.',
      ).toBeGreaterThanOrEqual(EXP_MIN_BAND_GROUPS);
      expect(
        distinct,
        `every band group moved by the same ${shifts[0] ?? 0} px between scroll t₀ and t₁ — ` +
          'that is a gradient sliding, not parallax. strata.glsl.ts draws three drifting bands ' +
          'at ONE depth and has no parallax term; the term is owned by slice X2-F1 (G-E2).',
      ).toBeGreaterThanOrEqual(EXP_MIN_BAND_GROUPS);
    });

    test(`TC-STORY-EXP-02 @ ${w} — ≥ 6 of 8 role spans are findable in the light`, async ({
      page,
    }) => {
      test.setTimeout(120000);
      await bootAt(page, '/?gl=force');
      await readyScene(page, 'career-strata');

      const ground = await groundLuminance(page, 'experience');
      const clip = await slotClip(page, 'career-strata');
      const field = await captureScene(page, 'career-strata', clip);

      const profile = smooth(columnProfile(field), 3);
      let maxima = 0;
      for (let i = 0; i < profile.length; i += 1) maxima = Math.max(maxima, profile[i]);
      const floor = ground + (maxima - ground) * 0.4;
      const found = extents(profile, floor);

      // The same normalisation the chart uses, imported from the same module so
      // the descent and the Gantt can never disagree about a date.
      const span = NOW - TIMELINE_START;
      const wanted = roles.map((r) => ({
        id: r.id,
        from: (r.span.start - TIMELINE_START) / span,
        to: ((r.span.end ?? NOW) - TIMELINE_START) / span,
      }));
      const recovered = wanted.filter((role) =>
        found.some(
          (e) =>
            Math.abs(e.from - role.from) <= EXP_SPAN_TOLERANCE &&
            Math.abs(e.to - role.to) <= EXP_SPAN_TOLERANCE,
        ),
      );

      // eslint-disable-next-line no-console
      console.log(
        `[story:exp-02@${w}] extents=${found.length} recovered=${recovered.length}/${wanted.length} ` +
          `[${recovered.map((r) => r.id).join(',')}]`,
      );

      expect(wanted.length, 'the CV holds eight role spans').toBe(8);
      expect(
        recovered.length,
        `only ${recovered.length} of ${wanted.length} role spans are recoverable from the field ` +
          `as horizontal light extents within ±${EXP_SPAN_TOLERANCE * 100}% of their normalised ` +
          'positions — the light under the chart is not drawing the chart\'s own data.',
      ).toBeGreaterThanOrEqual(EXP_SPANS_REQUIRED);
    });

    /* ── §5-4 #skills — the bench light reads the split ───────────────────── */

    test(`TC-STORY-SKILLS-01 @ ${w} — production rows are lit above the rest`, async ({ page }) => {
      test.setTimeout(120000);
      await bootAt(page, '/?gl=force');
      await readyScene(page, 'skills-bench');

      const clip = await slotClip(page, 'skills-bench');
      const field = await captureScene(page, 'skills-bench', clip);

      // The rails carry type and their own marks; the split is measured on the
      // plate between them, never on the columns the rows are printed in.
      const rails = await page.evaluate(() => {
        const out: Array<{ x: number; width: number }> = [];
        document.querySelectorAll('#skills [data-side]').forEach((el) => {
          const b = el.getBoundingClientRect();
          if (b.width > 0) out.push({ x: b.x, width: b.width });
        });
        return out;
      });
      const excluded = (x: number) =>
        rails.some((r) => x + clip.x >= r.x - 2 && x + clip.x <= r.x + r.width + 2);

      const rows = await page.evaluate(() => {
        const nodes = Array.from(
          document.querySelectorAll('#skills [data-side="capabilities"] > *'),
        );
        return nodes.map((el) => {
          const b = el.getBoundingClientRect();
          return b.y + b.height / 2;
        });
      });
      expect(
        rows.length,
        'the capability rail must expose one node per capability to sample against',
      ).toBe(capabilities.length);

      const meanAtRow = (pageY: number) => {
        const y = Math.round(pageY - clip.y);
        if (y < 0 || y >= field.height) return null;
        let sum = 0;
        let n = 0;
        for (let dy = -3; dy <= 3; dy += 1) {
          for (let x = 0; x < field.width; x += 1) {
            if (excluded(x)) continue;
            sum += at(field, x, y + dy);
            n += 1;
          }
        }
        return n === 0 ? null : sum / n;
      };

      const production: number[] = [];
      const nonProduction: number[] = [];
      capabilities.forEach((row, i) => {
        const value = meanAtRow(rows[i]);
        if (value === null) return;
        if (row.status === 'production') production.push(value);
        else if (row.status === 'non-production') nonProduction.push(value);
      });

      expect(production.length, 'some rows were measured in production').toBeGreaterThan(0);
      expect(nonProduction.length, 'and some were not — that is the split').toBeGreaterThan(0);

      const mean = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length;
      const delta = mean(production) - mean(nonProduction);

      // eslint-disable-next-line no-console
      console.log(
        `[story:skills@${w}] production=${mean(production).toFixed(5)} ` +
          `non-production=${mean(nonProduction).toFixed(5)} delta=${delta.toFixed(5)} ` +
          `rails=${rails.length}`,
      );

      expect(
        delta,
        `the bench lifts the production rows only ${delta.toFixed(4)} above the non-production ` +
          `ones (bar: ${SKILLS_SPLIT_DELTA}) — the calibration card's own distinction is ` +
          'invisible in the light it stands in.',
      ).toBeGreaterThanOrEqual(SKILLS_SPLIT_DELTA);
    });

    /* ── §5-5 #vitrine — six plates, six different lights ─────────────────── */

    test(`TC-STORY-VITRINE-01 @ ${w} — the pool moves with the rail, six ways`, async ({ page }) => {
      test.setTimeout(180000);
      await bootAt(page, '/?gl=force');
      await readyScene(page, 'vitrine-field');

      const ground = await groundLuminance(page, 'vitrine');
      const clip = await slotClip(page, 'vitrine-field');
      const centroids: number[] = [];
      const profiles: Float64Array[] = [];

      for (let i = 0; i < plates.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await page.evaluate((index) => {
          const rail = document.querySelector('#vitrine ol');
          const item = rail?.children[index] as HTMLElement | undefined;
          if (!rail || !item) return;
          rail.scrollTo({
            left: item.offsetLeft - (rail.clientWidth - item.clientWidth) / 2,
            behavior: 'instant' as ScrollBehavior,
          });
        }, i);
        // eslint-disable-next-line no-await-in-loop
        await page.waitForTimeout(900);
        // eslint-disable-next-line no-await-in-loop
        const field = await captureScene(page, 'vitrine-field', clip);
        centroids.push(xCentroid(field, ground));
        profiles.push(smooth(columnProfile(field), 3));
      }

      const spanOfCentroids = Math.max(...centroids) - Math.min(...centroids);
      const distinct = new Set(centroids.map((c) => Math.round(c * 200))).size;
      let monotonic = true;
      for (let i = 1; i < centroids.length; i += 1) {
        if (centroids[i] <= centroids[i - 1]) monotonic = false;
      }

      // eslint-disable-next-line no-console
      console.log(
        `[story:vitrine-01@${w}] centroids=[${centroids.map((c) => c.toFixed(4)).join(',')}] ` +
          `span=${spanOfCentroids.toFixed(4)} distinct=${distinct} monotonic=${monotonic}`,
      );

      expect(plates.length, 'the vitrine shows six of thirty-eight').toBe(6);
      expect(
        distinct,
        `the pool's x-centroid takes only ${distinct} distinct values across the six rail ` +
          'positions — the cabinet is lit once, not six ways.',
      ).toBe(plates.length);
      expect(
        monotonic,
        `the pool's x-centroid is not monotonic in the lit plate ` +
          `([${centroids.map((c) => c.toFixed(3)).join(', ')}]) — the light does not follow the rail.`,
      ).toBe(true);
      expect(
        spanOfCentroids,
        `the pool travels only ${(spanOfCentroids * 100).toFixed(1)}% of the slot width across ` +
          `all six plates (bar: ${VITRINE_CENTROID_SPAN * 100}%) — it is one gradient nudged, ` +
          'not a cabinet lit plate by plate.',
      ).toBeGreaterThanOrEqual(VITRINE_CENTROID_SPAN);

      // -02, measured on the same six captures rather than re-photographing them.
      let worst = Infinity;
      for (let i = 1; i < profiles.length; i += 1) {
        worst = Math.min(
          worst,
          residualAfterBestShift(profiles[i - 1], profiles[i], Math.round(profiles[i].length / 3)),
        );
      }
      // eslint-disable-next-line no-console
      console.log(`[story:vitrine-02@${w}] min residual after best-fit shift=${worst.toFixed(5)}`);
      expect(
        worst,
        `after the best-fit x alignment two plate captures differ by only ${worst.toFixed(4)} ` +
          `mean |Δ| (bar: ${VITRINE_TRANSLATION_DELTA}) — the six lights are one light slid ` +
          'sideways.',
      ).toBeGreaterThanOrEqual(VITRINE_TRANSLATION_DELTA);
    });

    /* ── §5-6 #listen — this is his voice, drawn ──────────────────────────── */

    test(`TC-STORY-LISTEN-01 @ ${w} — the band is the greeting's own loudness`, async ({ page }) => {
      test.setTimeout(120000);
      await bootAt(page, '/?gl=force');
      await readyScene(page, 'listen-field');

      const ground = await groundLuminance(page, 'listen');
      const clip = await slotClip(page, 'listen-field');
      const field = await captureScene(page, 'listen-field', clip);

      // The band's height at each x is the greeting's loudness at that moment
      // (`greeting-envelope.ts` header): amplitude per column is the reading.
      const amplitude = new Float64Array(field.width);
      for (let x = 0; x < field.width; x += 1) {
        let sum = 0;
        for (let y = 0; y < field.height; y += 1) sum += Math.max(0, at(field, x, y) - ground);
        amplitude[x] = sum;
      }

      const envelope = greetingEnvelope.envelope as readonly number[];
      const n = Math.min(256, field.width);
      const measured = resample(amplitude, n);
      const expected = resample(envelope, n);
      const sine = new Float64Array(n);
      for (let i = 0; i < n; i += 1) sine[i] = 0.5 + 0.5 * Math.sin((i / n) * Math.PI * 2);

      const rEnvelope = pearson(measured, expected);
      const rSine = pearson(measured, sine);

      // eslint-disable-next-line no-console
      console.log(
        `[story:listen@${w}] samples=${n} envelope_len=${envelope.length} ` +
          `r_envelope=${rEnvelope.toFixed(4)} r_sine=${rSine.toFixed(4)}`,
      );

      expect(envelope.length, 'the envelope is a 256-bucket reading of the MP3').toBe(256);
      expect(
        rEnvelope,
        `the band correlates with the greeting's envelope at r=${rEnvelope.toFixed(3)} ` +
          `(bar: ${LISTEN_ENVELOPE_R}) — the closing light is not the shape of him speaking.`,
      ).toBeGreaterThanOrEqual(LISTEN_ENVELOPE_R);
      expect(
        Math.abs(rSine),
        `the band correlates with a plain same-period sine at r=${rSine.toFixed(3)} ` +
          `(ceiling: ${LISTEN_SINE_R_MAX}) — an animation dressed as a voice.`,
      ).toBeLessThan(LISTEN_SINE_R_MAX);
    });

    /* ── §5-7 #experience (S7) — sixteen years is one object ──────────────── */

    test(`TC-STORY-DESCENT-01 @ ${w} — the strata spacing is the role durations`, async ({
      page,
    }) => {
      test.setTimeout(150000);
      await bootAt(page, '/?gl=force');
      await requireSlot(page, 'career-descent', 'SIGNATURE-SCENES-v2 §2.2, slices X2-S1…S3');
      await readyScene(page, 'career-descent');

      const ground = await groundLuminance(page, 'experience');
      const clip = await slotClip(page, 'career-descent');
      const field = await captureScene(page, 'career-descent', clip);

      const profile = smooth(rowProfile(field), 2);
      const edges = lobes(profile, 0.08, false).filter((y) => y > 1 && y < field.height - 2);
      edges.sort((a, b) => a - b);

      const durations = roles
        .map((r) => (r.span.end ?? NOW) - r.span.start)
        // Deepest = oldest: the descent stacks them the way the CV runs.
        .slice()
        .reverse();
      const gaps: number[] = [];
      for (let i = 1; i < edges.length; i += 1) gaps.push(edges[i] - edges[i - 1]);

      // eslint-disable-next-line no-console
      console.log(
        `[story:descent-01@${w}] edges=${edges.length} gaps=[${gaps.join(',')}] ` +
          `durations=[${durations.map((d) => d.toFixed(2)).join(',')}]`,
      );

      expect(
        edges.length,
        `only ${edges.length} stratum edges are detectable in the descent (bar: ` +
          `${DESCENT_MIN_EDGES}) — a reader cannot count eight jobs in it.`,
      ).toBeGreaterThanOrEqual(DESCENT_MIN_EDGES);

      const pairs = Math.min(gaps.length, durations.length);
      const r = spearman(gaps.slice(0, pairs), durations.slice(0, pairs));
      expect(
        r,
        `stratum spacing tracks role duration at rank r=${r.toFixed(3)} (bar: ${DESCENT_RANK_R}) — ` +
          'the layers are evenly spaced decoration, not the CV drawn as depth. A nine-year band ' +
          'and a six-month seam have to be different thicknesses.',
      ).toBeGreaterThanOrEqual(DESCENT_RANK_R);
    });

    test(`TC-STORY-DESCENT-02 @ ${w} — nothing is written over the stage`, async ({ page }) => {
      test.setTimeout(120000);
      await bootAt(page, '/?gl=force');
      await requireSlot(page, 'career-descent', 'SIGNATURE-SCENES-v2 §2.2, slices X2-S1…S3');
      await readyScene(page, 'career-descent');
      await slotClip(page, 'career-descent');

      const intruders = await page.evaluate(() => {
        const slot = document.querySelector('[data-scene="career-descent"]');
        if (!slot) return ['no slot'];
        const box = slot.getBoundingClientRect();
        const found: string[] = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode();
        while (node) {
          const text = (node.textContent ?? '').trim();
          const parent = node.parentElement;
          if (text.length > 0 && parent && !slot.contains(parent)) {
            const style = getComputedStyle(parent);
            if (style.visibility !== 'hidden' && style.display !== 'none') {
              const range = document.createRange();
              range.selectNodeContents(node);
              const r = range.getBoundingClientRect();
              const overlaps =
                r.width > 0 &&
                r.height > 0 &&
                r.left < box.right &&
                r.right > box.left &&
                r.top < box.bottom &&
                r.bottom > box.top;
              if (overlaps) found.push(text.slice(0, 40));
            }
          }
          node = walker.nextNode();
        }
        return found;
      });

      // The section's own caption and year ticks live *inside* the stage and are
      // excluded above; anything else over it makes the set piece wallpaper by
      // construction (SIGNATURE-SCENES-v2 §2.2(4)).
      // eslint-disable-next-line no-console
      console.log(`[story:descent-02@${w}] intruding text nodes=${intruders.length}`);
      expect(
        intruders,
        `text is composited over the descent stage (${intruders.join(' | ')}) — a field with ` +
          'type over it is background by construction, which is the definition R2 failed on.',
      ).toEqual([]);
    });

    /* ── §6.3 — the plane carries the section, per section ────────────────── */

    for (const item of [
      { section: 'about', scene: 'about-field' },
      { section: 'experience', scene: 'career-strata' },
      { section: 'skills', scene: 'skills-bench' },
      { section: 'vitrine', scene: 'vitrine-field' },
      { section: 'listen', scene: 'listen-field' },
    ]) {
      test(`TC-STORY-PLANE-01 @ ${w} — #${item.section}: the scene carries ≥ ${PLANE_SHARE_MIN * 100}% of the light`, async ({
        page,
      }) => {
        test.setTimeout(120000);
        await bootAt(page, '/?gl=force');
        await readyScene(page, item.scene);

        const ground = await groundLuminance(page, item.section);
        const slot = await slotClip(page, item.scene);
        const section = await elementClip(page, `#${item.section}`);
        expect(section, `#${item.section} has no box`).not.toBeNull();

        // SPD, the hero instrument's own form (`hero_plane_dominance.mjs`:
        // Σ_P m / Σ_fold m) — **one** capture, two regions — asked of one
        // section at a floor below the fold's 0.75, because sections carry
        // prose and cannot meet the fold's bar.
        //
        // Two regions of one frame, never two frames: an earlier draft divided
        // an isolated capture by a full one and scored 1.06, 6.54, 14.56 —
        // above 1.0, because the chrome the denominator adds is *darker* than
        // the light it covers. A ratio that cannot fail is a false positive,
        // which is the one result this suite may not produce.
        const frame = decodeLuma(await page.screenshot({ clip: section! }));
        let inSlot = 0;
        let total = 0;
        for (let y = 0; y < frame.height; y += 1) {
          for (let x = 0; x < frame.width; x += 1) {
            const m = Math.max(0, at(frame, x, y) - ground);
            if (m <= 0) continue;
            total += m;
            const px = x + section!.x;
            const py = y + section!.y;
            if (
              px >= slot.x &&
              px < slot.x + slot.width &&
              py >= slot.y &&
              py < slot.y + slot.height
            ) {
              inSlot += m;
            }
          }
        }
        const share = total === 0 ? 0 : inSlot / total;

        // eslint-disable-next-line no-console
        console.log(
          `[story:plane@${w}] ${item.section}: slot=${inSlot.toFixed(1)} ` +
            `section=${total.toFixed(1)} share=${share.toFixed(4)} ` +
            `slotbox=${Math.round(slot.width)}x${Math.round(slot.height)} ` +
            `sectionbox=${Math.round(section!.width)}x${Math.round(section!.height)}`,
        );

        expect(
          share,
          `#${item.section}: the scene carries ${(share * 100).toFixed(1)}% of the light in its ` +
            `own slot (bar: ${PLANE_SHARE_MIN * 100}%) — what a reader sees there is chrome, ` +
            'and the field behind it is wallpaper.',
        ).toBeGreaterThanOrEqual(PLANE_SHARE_MIN);
      });
    }
  });
}
