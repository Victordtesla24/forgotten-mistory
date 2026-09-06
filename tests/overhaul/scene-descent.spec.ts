import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { test, expect, type Page } from '@playwright/test';

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
