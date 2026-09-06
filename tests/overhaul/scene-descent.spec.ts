import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PNG } from 'pngjs';
import { test, expect, type Page } from '@playwright/test';

import { NOW, roles } from '../../app/data/portfolio/experience';

/**
 * S7 `career-descent` — the seventh scene, and the mount contract behind it.
 *
 * ADV-2315Z graded R2 FAIL: six sections each carrying a field of light behind
 * their own copy, and no cinematic beat anywhere a recruiter would repeat.
 * `docs/architecture/SIGNATURE-SCENES-v2.md` §2.2 names the sentence the fix has
 * to earn — *"there is a bit where you scroll and you are falling down sixteen
 * years of his career like a core sample"* — and §3 turns it into a build
 * contract. This file is the part of that contract a machine can check on the
 * mount slice (`x2-s1-career-descent-mount`).
 *
 * What is pinned here, and why each one is a thing that has actually gone wrong
 * on this site before:
 *
 * 1. **The scene is in the STATIC export.** `minivic-viseme` is mounted behind
 *    an interaction and therefore never appears in `out/index.html` (v1 §0.6);
 *    `career-descent` must, because a scene that only exists after a click is a
 *    scene a reviewer's first-paint census cannot find. Asserted against the
 *    built file on disk, not against the live DOM, so a client-side injection
 *    cannot satisfy it.
 *
 * 2. **Zero `pageerror`s under `?gl=force` at 1440 and 390.** This project
 *    shipped a page-wide React-19/R3F crash to every GPU visitor once
 *    (`next 15.5.25`, 18c6beb) while every headless probe stayed green. Any new
 *    scene compiles its GLSL under SwiftShader here before it is allowed near
 *    `main`.
 *
 * 3. **Nothing but the caption and the year ticks over the canvas.** v2 §2.2:
 *    the descent earns its 160vh by being the one place on the page a reader is
 *    asked to look rather than read. A heading, a paragraph or a CTA laid over
 *    a moving field would be the *"never add light over type"* immovable broken
 *    from the other side — so the stage carries one caption line, the ticks, and
 *    nothing else. (`TC-STORY-DESCENT-02` in `story-contract.spec.ts` measures
 *    the stricter geometric form of this; here it is the composition rule.)
 *
 * 4. **No hex, no gold.** Gold marks a figure with a source. A field of light is
 *    not a figure, so the string never appears in this scene's source, and the
 *    colours come from `lib/palette.ts` like every other shader's.
 *
 * 5. **Still six sections.** The IA in CLAUDE.md is six ids in one order. The
 *    descent is a band *inside* `#experience`, after the chart and the
 *    accordion — never a seventh section.
 */

const STAGE = '#experience [data-descent-stage]';
const BAND = '#experience [data-descent-band]';

const DESCENT_TSX = join(
  process.cwd(),
  'components/sections/Experience/CareerDescent.tsx',
);
const DESCENT_GLSL = join(
  process.cwd(),
  'components/sections/Experience/descent.glsl.ts',
);
const INDEX_HTML = join(process.cwd(), 'out/index.html');

/** The six ids CLAUDE.md fixes, in order. */
const SECTIONS = ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen'];

/**
 * This host has no GPU. `useGLCapability` classifies SwiftShader as
 * `unsupported` and mounts no canvas at all, so a scene test run without these
 * flags plus `?gl=force` would pass by testing the fallback and never compile a
 * line of GLSL.
 */
test.use({
  launchOptions: {
    args: [
      '--no-sandbox',
      '--use-gl=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
    ],
  },
});

async function waitForPageReady(page: Page) {
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
}

/** Scrolls the descent band through its own travel and lets the scene mount. */
async function scrollThroughBand(page: Page) {
  await page.locator(BAND).scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 0.6)));
  await page.waitForTimeout(900);
}

test.describe('TC-SCENE-DESCENT — S7 career-descent mount', () => {
  test('TC-SCENE-DESCENT-01 — data-scene="career-descent" is in the static export', () => {
    const html = readFileSync(INDEX_HTML, 'utf8');
    const scenes = [...html.matchAll(/data-scene="([^"]+)"/g)].map((match) => match[1]);

    expect(
      scenes,
      'career-descent must ship in out/index.html, not be injected after an interaction (v1 §0.6)',
    ).toContain('career-descent');
  });

  test('TC-SCENE-DESCENT-02 — the band sits after the chart and the accordion, inside #experience', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?gl=force');
    await waitForPageReady(page);

    const order = await page.evaluate(() => {
      const section = document.querySelector('#experience');
      if (!section) return null;
      const band = section.querySelector('[data-descent-band]');
      const chart = section.querySelector('[data-chart]');
      const accordion = section.querySelector('ol[class*="roles"]');
      if (!band || !chart || !accordion) return null;
      const top = (el: Element) => el.getBoundingClientRect().top + window.scrollY;
      return { band: top(band), chart: top(chart), accordion: top(accordion) };
    });

    expect(order, 'the band, the chart and the roles accordion must all live in #experience').not.toBeNull();
    expect(order!.band).toBeGreaterThan(order!.chart);
    expect(order!.band).toBeGreaterThan(order!.accordion);
  });

  test('TC-SCENE-DESCENT-03 — the stage is sticky, one viewport tall, in a taller band', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?gl=force');
    await waitForPageReady(page);

    const geometry = await page.evaluate(() => {
      const band = document.querySelector('[data-descent-band]');
      const stage = document.querySelector('[data-descent-stage]');
      if (!band || !stage) return null;
      return {
        bandHeight: band.getBoundingClientRect().height,
        stageHeight: stage.getBoundingClientRect().height,
        position: getComputedStyle(stage).position,
        viewport: window.innerHeight,
      };
    });

    expect(geometry, 'the descent band and its sticky stage must both exist').not.toBeNull();
    expect(geometry!.position).toBe('sticky');
    // 100vh stage inside a band at least 1.3x taller — v2 §3 asks for 160vh and
    // R-1 allows a shrink to 130vh; below that there is no travel to fall down.
    expect(geometry!.stageHeight).toBeGreaterThanOrEqual(geometry!.viewport * 0.95);
    expect(geometry!.bandHeight).toBeGreaterThanOrEqual(geometry!.stageHeight * 1.3);
  });

  for (const viewport of [
    { name: '1440', width: 1440, height: 900 },
    { name: '390', width: 390, height: 844 },
  ]) {
    test(`TC-SCENE-DESCENT-04 — zero pageerrors under ?gl=force at ${viewport.name}`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/?gl=force');
      await waitForPageReady(page);
      await scrollThroughBand(page);

      const canvases = await page.locator('canvas').count();

      expect(errors, `pageerrors at ${viewport.name}: ${errors.join(' | ')}`).toHaveLength(0);
      expect(canvases, 'at least one canvas must be live once the band is on screen').toBeGreaterThanOrEqual(1);
    });
  }

  test('TC-SCENE-DESCENT-05 — one caption line over the canvas, and no heading, paragraph or CTA', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?gl=force');
    await waitForPageReady(page);
    await scrollThroughBand(page);

    const overlay = await page.evaluate(() => {
      const stage = document.querySelector('[data-descent-stage]');
      if (!stage) return null;
      const forbidden = stage.querySelectorAll('h1, h2, h3, h4, p, a, button');
      const captions = stage.querySelectorAll('[data-descent-caption]');
      const ticks = stage.querySelectorAll('[data-descent-tick]');
      return {
        forbidden: forbidden.length,
        captions: captions.length,
        ticks: ticks.length,
        captionText: captions[0]?.textContent?.trim() ?? '',
      };
    });

    expect(overlay, 'the stage must exist before its overlay can be counted').not.toBeNull();
    expect(overlay!.forbidden, 'no heading, paragraph, link or button may sit over the descent').toBe(0);
    expect(overlay!.captions, 'exactly one caption line').toBe(1);
    expect(overlay!.captionText.length).toBeGreaterThan(0);
    expect(overlay!.ticks, 'the year ticks are the only other mark on the stage').toBeGreaterThanOrEqual(2);
  });

  test('TC-SCENE-DESCENT-06 — no raw hex and no gold in the scene source', () => {
    for (const path of [DESCENT_TSX, DESCENT_GLSL]) {
      const source = readFileSync(path, 'utf8');
      expect(source, `${path} must not carry a raw hex colour — colours come from lib/palette.ts`).not.toMatch(
        /#[0-9a-fA-F]{3,8}\b/,
      );
      expect(
        source.toLowerCase(),
        `${path} must not mention gold — gold marks a sourced figure, and a field of light is not a figure`,
      ).not.toContain('gold');
    }
  });

  test('TC-SCENE-DESCENT-07 — the six-section IA is unchanged', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await waitForPageReady(page);

    const ids = await page.evaluate(() =>
      Array.from(document.querySelectorAll('main section[id]')).map((section) => section.id),
    );

    expect(ids).toEqual(SECTIONS);
  });

  test('TC-SCENE-DESCENT-08 — uSpans is read from experience.ts, never re-derived', () => {
    const source = readFileSync(DESCENT_TSX, 'utf8');

    expect(source, 'the descent must import the same roles the Gantt draws').toMatch(
      /from '@\/app\/data\/portfolio\/experience'/,
    );
    expect(source, 'TIMELINE_START and NOW come from that module — never a second copy of a date').toMatch(
      /TIMELINE_START/,
    );
    expect(source).toMatch(/NOW/);
    expect(
      source,
      'uSpanCount is roles.length; a hard-coded 8 would silently drop the ninth role',
    ).toMatch(/uSpanCount/);
  });
});

/* ────────────────────────────── depth (x2-s2) ──────────────────────────────
 *
 * `x2-s1` mounted the scene. This block is the part of the contract slice
 * `x2-s2-career-descent-depth` has to satisfy, stated with the thresholds
 * `SIGNATURE-SCENES-v2.md` §5 gives them — nothing here is a softened copy:
 *
 * - `DESCENT_MIN_EDGES = 8` and `DESCENT_RANK_R = 0.9` are §5 row 7
 *   (`TC-STORY-DESCENT-01`) verbatim: eight stratum edges have to be countable
 *   in ONE frame, and their spacing has to be the role durations. A nine-year
 *   band and a six-month seam are the same fact in a different projection, so
 *   if the layers are evenly spaced the scene is decoration.
 * - `EXP_MIN_BAND_GROUPS = 2` is §5 row 3 (`TC-STORY-EXP-01`) verbatim: the
 *   peaks have to move by DIFFERENT pixel counts between scroll t₀ and t₁.
 *   One pixel count is a gradient sliding; three is a camera.
 *
 * The measurement is a vertical luminance profile of the canvas with the ticks
 * and the caption hidden, so the only thing in the picture is the shader. A
 * peak is only counted as a stratum edge if it is visible — at least
 * `EDGE_VISIBILITY` of the way from the field's floor to its brightest point —
 * because an edge a reader cannot see is not an edge a reader can count.
 */

const DESCENT_MIN_EDGES = 8;
const DESCENT_RANK_R = 0.9;
const EXP_MIN_BAND_GROUPS = 2;
/** A stratum edge has to stand this far above the field floor to be counted. */
const EDGE_VISIBILITY = 0.18;
/** The two planes must disagree by at least this many pixels, or it is one plane. */
const MIN_PLANE_SEPARATION_PX = 3;

type Profile = Float64Array;

/** Row means (y → mean luminance, 0..1) of an RGBA screenshot. */
function rowProfile(png: { width: number; height: number; data: Buffer }): Profile {
  const out = new Float64Array(png.height);
  for (let y = 0; y < png.height; y += 1) {
    let sum = 0;
    for (let x = 0; x < png.width; x += 1) {
      const i = (y * png.width + x) * 4;
      sum += (0.2126 * png.data[i] + 0.7152 * png.data[i + 1] + 0.0722 * png.data[i + 2]) / 255;
    }
    out[y] = sum / png.width;
  }
  return out;
}

/** A boxcar smooth, so pixel noise does not read as a stratum edge. */
function smooth(series: Profile, radius: number): Profile {
  const out = new Float64Array(series.length);
  for (let i = 0; i < series.length; i += 1) {
    let sum = 0;
    let count = 0;
    for (let k = -radius; k <= radius; k += 1) {
      const j = i + k;
      if (j < 0 || j >= series.length) continue;
      sum += series[j];
      count += 1;
    }
    out[i] = sum / count;
  }
  return out;
}

/**
 * The stratum edges in a vertical luminance profile.
 *
 * A stratum edge is a local maximum that (a) is visible at all — at least
 * `EDGE_VISIBILITY` of the way from the field's floor to its brightest point —
 * and (b) stands `depth` of the field's own range above BOTH of its flanking
 * valleys. (b) is topographic prominence, and it is the strict reading: a peak
 * that only clears the valley on one side is a shoulder on a brighter edge, not
 * an edge of its own, and counting shoulders would let a scene claim eight
 * strata it never drew.
 */
function edges(series: Profile, depth: number): number[] {
  let low = Infinity;
  let high = -Infinity;
  for (let i = 0; i < series.length; i += 1) {
    low = Math.min(low, series[i]);
    high = Math.max(high, series[i]);
  }
  const range = high - low;
  if (range <= 0) return [];
  const visible = low + range * EDGE_VISIBILITY;
  const bar = range * depth;

  const kept: number[] = [];
  for (let i = 1; i < series.length - 1; i += 1) {
    if (!(series[i] > series[i - 1] && series[i] >= series[i + 1])) continue;
    if (series[i] < visible) continue;

    let leftValley = series[i];
    for (let j = i - 1; j >= 0; j -= 1) {
      if (series[j] > series[i]) break;
      leftValley = Math.min(leftValley, series[j]);
    }
    let rightValley = series[i];
    for (let j = i + 1; j < series.length; j += 1) {
      if (series[j] > series[i]) break;
      rightValley = Math.min(rightValley, series[j]);
    }
    if (series[i] - Math.max(leftValley, rightValley) >= bar) kept.push(i);
  }
  return kept;
}

/** Ranks, average-tied. */
function ranks(values: readonly number[]): number[] {
  const order = values.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
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

function pearson(a: readonly number[], b: readonly number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ma = a.slice(0, n).reduce((s, v) => s + v, 0) / n;
  const mb = b.slice(0, n).reduce((s, v) => s + v, 0) / n;
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

const spearman = (a: readonly number[], b: readonly number[]) => pearson(ranks(a), ranks(b));

/** Scrolls so the band's top edge is exactly at the viewport top: uDescent = 0. */
async function parkAtSurface(page: Page) {
  await page.evaluate(() => {
    const band = document.querySelector('[data-descent-band]');
    if (!band) throw new Error('no [data-descent-band]');
    window.scrollTo(0, window.scrollY + band.getBoundingClientRect().top);
  });
  await page.waitForTimeout(900);
}

/**
 * The canvas alone.
 *
 * Everything on the page that is not the scene slot or one of its ancestors is
 * hidden first. A `<canvas>` on this site is transparent — `uIntensity` is the
 * alpha — so an element screenshot of it composites whatever is behind it, and
 * the persistent navigation sitting across the top of a sticky stage arrived in
 * the luminance profile as a bright band 40 px down, i.e. as a stratum older
 * than the current engagement. The shader is the only thing being measured.
 */
async function descentField(page: Page) {
  await page.evaluate(() => {
    const slot = document.querySelector('[data-scene="career-descent"]');
    if (!slot) throw new Error('no [data-scene="career-descent"]');
    const keep = new Set<Element>();
    for (let el: Element | null = slot; el; el = el.parentElement) keep.add(el);
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      if (keep.has(el) || slot.contains(el)) continue;
      (el as HTMLElement).dataset.descentHidden = '1';
      (el as HTMLElement).style.visibility = 'hidden';
    }
  });
  const canvas = page.locator('[data-scene="career-descent"] canvas').first();
  const shot = await canvas.screenshot();
  await page.evaluate(() => {
    for (const el of Array.from(document.querySelectorAll('[data-descent-hidden]'))) {
      (el as HTMLElement).style.visibility = '';
      delete (el as HTMLElement).dataset.descentHidden;
    }
  });
  return smooth(rowProfile(PNG.sync.read(shot)), 3);
}

async function readyDescent(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto('/?gl=force');
  await waitForPageReady(page);
  await page.locator(BAND).scrollIntoViewIfNeeded();
  await page.locator('[data-scene="career-descent"] canvas').waitFor({ state: 'attached', timeout: 30000 });
  await parkAtSurface(page);
  await page.waitForTimeout(1600);
}

test.describe('TC-SCENE-DESCENT — S7 depth (slice x2-s2)', () => {
  for (const viewport of [
    { name: '1440', width: 1440, height: 900 },
    { name: '390', width: 390, height: 844 },
  ]) {
    test(`TC-SCENE-DESCENT-09 @ ${viewport.name} — eight stratum edges, spaced by role duration`, async ({
      page,
    }) => {
      test.setTimeout(150000);
      await readyDescent(page, viewport.width, viewport.height);

      const profile = await descentField(page);
      const found = edges(profile, 0.08).sort((a, b) => a - b);
      const gaps: number[] = [];
      for (let i = 1; i < found.length; i += 1) gaps.push(found[i] - found[i - 1]);

      // Screen order is the CV's order: the surface (the current engagement) is
      // at the top of the frame and 2010 is at its foot, so gap i is role i's
      // own thickness. `roles` is newest-first, which is the same list.
      const durations = roles.map((role) => (role.span.end ?? NOW) - role.span.start);
      const pairs = Math.min(gaps.length, durations.length);
      const r = spearman(gaps.slice(0, pairs), durations.slice(0, pairs));

      // eslint-disable-next-line no-console
      console.log(
        `[descent-09@${viewport.name}] edges=${found.length} at=[${found.join(',')}] ` +
          `gaps=[${gaps.join(',')}] durations=[${durations.map((d) => d.toFixed(2)).join(',')}] r=${r.toFixed(3)}`,
      );

      expect(
        found.length,
        `only ${found.length} stratum edges are visible in one frame (bar: ${DESCENT_MIN_EDGES}) — ` +
          'a reader cannot count eight jobs in it.',
      ).toBeGreaterThanOrEqual(DESCENT_MIN_EDGES);
      expect(
        r,
        `stratum spacing tracks role duration at rank r=${r.toFixed(3)} (bar: ${DESCENT_RANK_R}) — ` +
          'evenly spaced layers are decoration, not the CV drawn as depth.',
      ).toBeGreaterThanOrEqual(DESCENT_RANK_R);
    });
  }

  /**
   * Three planes are only live at `uQuality = 1`. The phone branch deliberately
   * drops the far floor (v2 §3.2, and the slice's own gate), so the three-rate
   * assertion is desktop-scoped and says so — v2 §5 R-4's rule for a viewport a
   * measurement cannot honestly be made at.
   */
  test('TC-SCENE-DESCENT-10 @ 1440 — the planes answer one scroll with different pixel counts', async ({
    page,
  }) => {
    test.setTimeout(150000);
    await readyDescent(page, 1440, 900);

    const before = edges(await descentField(page), 0.08).sort((a, b) => a - b);
    await page.evaluate(() => window.scrollBy(0, 240));
    await page.waitForTimeout(1200);
    const after = edges(await descentField(page), 0.08).sort((a, b) => a - b);

    const shifts: number[] = [];
    for (const y of before) {
      let best = Infinity;
      for (const z of after) if (Math.abs(z - y) < Math.abs(best)) best = z - y;
      if (Number.isFinite(best)) shifts.push(best);
    }
    const distinct = new Set(shifts.map((s) => Math.round(s))).size;
    const spread = shifts.length === 0 ? 0 : Math.max(...shifts) - Math.min(...shifts);

    // eslint-disable-next-line no-console
    console.log(
      `[descent-10@1440] before=${before.length} after=${after.length} ` +
        `shifts=[${shifts.join(',')}] distinct=${distinct} spread=${spread}`,
    );

    expect(
      before.length,
      `the descent's vertical luminance profile has ${before.length} band groups — ` +
        'fewer than two planes cannot show depth.',
    ).toBeGreaterThanOrEqual(EXP_MIN_BAND_GROUPS);
    expect(
      distinct,
      `every band group moved by the same ${shifts[0] ?? 0} px between scroll t₀ and t₁ — ` +
        'that is a gradient sliding, not parallax.',
    ).toBeGreaterThanOrEqual(EXP_MIN_BAND_GROUPS);
    expect(
      spread,
      `the fastest and slowest band groups differ by only ${spread} px (bar: ` +
        `${MIN_PLANE_SEPARATION_PX}) — one camera move, one pixel count, one plane.`,
    ).toBeGreaterThanOrEqual(MIN_PLANE_SEPARATION_PX);
  });
});
