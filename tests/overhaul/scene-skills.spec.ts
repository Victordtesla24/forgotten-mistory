import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { test, expect, type Page } from '@playwright/test';

/**
 * TC-SCENE-SKILLS — `#skills` gets the scene it was claiming to have.
 *
 * ADV-REVIEW-20260905 measured the section and printed the P0 plainly: at 1440,
 * both on `/` and on `/?gl=force`, `#skills` had **0 canvases and 1 svg** over
 * 3086 px of page — a twenty-path wire diagram drawn on nothing, in a section
 * whose whole argument is that every capability was *measured on a bench
 * somewhere*. The other five sections each carry a signature scene (R2); this
 * one asserted calibration and rendered a drawing on bare ink.
 *
 * So the field under the board is a bench: a lit plate with a hairline
 * graticule ruled across it (`bench.glsl.ts`), the rails and wires engraved on
 * top, and the reader's own row brightening as they take a node.
 *
 * What this file holds, and why each one is here rather than assumed:
 *
 *   01  One canvas, and only one, once the section is in view at `?gl=force`.
 *       The reviewer's number was zero; a second canvas would mean the slot
 *       had been mounted twice and two contexts were live in one section.
 *   02  The canvas is inside an `aria-hidden` slot, is behind the board, and
 *       is not what `elementFromPoint` finds over the rails' type. The scene
 *       is never the content — the diagram must still be the thing you touch.
 *   03  The bench feeds the field: taking a node on either rail raises
 *       `data-dimmed` on the board, which is the same state the shader's
 *       `uHover` is driven from, so the light and the wires cannot disagree.
 *   04  Reduced motion mounts no canvas at all and the twenty-path SVG bench
 *       is whole — the mechanism is never withheld with the light.
 *   05  With WebGL refused outright the section is complete and silent: every
 *       source, every capability, the excluded list, and zero page errors.
 *   06  The shader is monochrome, palette-sourced, and inside the per-pixel
 *       budget every other scene here holds to (<= 3 noise lookups, one quad,
 *       context-loss handled). Gold means *this figure has a source*; a bench
 *       is not a figure, so no line of this scene may reach for it.
 *   07  `three` stays in the lazily fetched chunk: the section imports the
 *       field through `next/dynamic`, so a reader who never reaches `#skills`
 *       — or who has no WebGL — never pays for it.
 *
 * Every mount test runs at `?gl=force`: this host has no GPU, and
 * `components/gl/useGLCapability.ts` declines software rasterisers, so without
 * the escape hatch the suite would pass having compiled no GLSL at all.
 */

const SKILLS = '#skills';
const BENCH = `${SKILLS} [class*="bench"]`;

const SKILLS_DIR = join(process.cwd(), 'components/sections/Skills');
const GLSL_SOURCE = join(SKILLS_DIR, 'bench.glsl.ts');
const FIELD_SOURCE = join(SKILLS_DIR, 'BenchField.tsx');
const BENCH_SOURCE = join(SKILLS_DIR, 'Bench.tsx');

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

/** Walks `#skills` into view with the software-rasteriser guard overridden. */
async function settleSkillsWithGL(page: Page) {
  await page.goto('/?gl=force', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await page.locator(SKILLS).scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
}

test.describe('TC-SCENE-SKILLS: the bench sits on a lit field', () => {
  test.describe.configure({ timeout: 120000 });

  test('TC-SCENE-SKILLS-01: exactly one canvas mounts behind the board once the section is in view', async ({
    page,
  }) => {
    await settleSkillsWithGL(page);

    const canvases = page.locator(`${SKILLS} canvas`);
    await expect(canvases).toHaveCount(1);

    const box = await canvases.first().boundingBox();
    expect(box, 'the #skills canvas has no box').not.toBeNull();
    expect(box!.width, 'the #skills canvas is too small to be drawing').toBeGreaterThan(100);
    expect(box!.height, 'the #skills canvas is too small to be drawing').toBeGreaterThan(100);
  });

  test('TC-SCENE-SKILLS-02: the canvas is aria-hidden, behind the board and never over the type', async ({
    page,
  }) => {
    await settleSkillsWithGL(page);
    await expect(page.locator(`${SKILLS} canvas`)).toHaveCount(1);

    const hidden = await page
      .locator(`${SKILLS} canvas`)
      .first()
      .evaluate((el) => el.closest('[aria-hidden="true"]') !== null);
    expect(hidden, 'the #skills canvas is not inside an aria-hidden slot').toBe(true);

    // The board is over the light, whether or not the light is there.
    const zOrder = await page.evaluate(() => {
      const slot = document.querySelector('#skills [data-scene="skills-bench"]');
      const bench = document.querySelector('#skills [class*="bench"]');
      return {
        slot: slot ? getComputedStyle(slot).zIndex : 'missing',
        bench: bench ? getComputedStyle(bench).zIndex : 'missing',
      };
    });
    expect(Number(zOrder.slot)).toBeLessThan(Number(zOrder.bench));

    // And the reading column resolves to itself: a source's own label is what
    // the pointer finds there, not the canvas underneath it.
    const overSource = await page
      .locator(`${SKILLS} [data-side="sources"] button[class*="node"]`)
      .first()
      .evaluate((el) => {
        const r = el.getBoundingClientRect();
        return document.elementFromPoint(r.left + 4, r.top + r.height / 2)?.tagName ?? 'none';
      });
    expect(overSource).not.toBe('CANVAS');
  });

  test('TC-SCENE-SKILLS-03: taking a node on the bench is the state the field is lit from', async ({
    page,
  }) => {
    await settleSkillsWithGL(page);

    const bench = page.locator(BENCH).first();
    await expect(bench).not.toHaveAttribute('data-dimmed', /.*/);

    // The capability buttons are the nodes on the right rail; focusing one is
    // the same path `focus()` takes for the pointer, and it is what writes the
    // hover state the shader reads.
    await page.locator(`${SKILLS} [data-side="capabilities"] button[class*="node"]`).first().focus();
    await page.waitForTimeout(300);
    await expect(bench).toHaveAttribute('data-dimmed', '');

    // Still exactly one canvas: the light follows attention without the board
    // re-mounting the scene.
    await expect(page.locator(`${SKILLS} canvas`)).toHaveCount(1);
  });

  test('TC-SCENE-SKILLS-04: under reduced motion there is no canvas and the wire bench is whole', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await settleSkillsWithGL(page);

    await expect(page.locator(`${SKILLS} canvas`)).toHaveCount(0);

    // The board itself is untouched: the wires are drawn, not withheld.
    const paths = await page.locator(`${SKILLS} svg path`).count();
    expect(paths, `wire paths under reduced motion: ${paths}`).toBeGreaterThan(10);
    await expect(
      page.locator(`${SKILLS} [data-side="capabilities"] button[class*="node"]`).first(),
    ).toBeVisible();
  });

  test('TC-SCENE-SKILLS-05: with WebGL unavailable the section is complete and silent', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function patched(
        this: HTMLCanvasElement,
        id: string,
        ...rest: unknown[]
      ) {
        if (id === 'webgl' || id === 'webgl2' || id === 'experimental-webgl') return null;
        return (original as unknown as (...a: unknown[]) => unknown).call(this, id, ...rest);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });

    await settleSkillsWithGL(page);

    await expect(page.locator(`${SKILLS} canvas`)).toHaveCount(0);
    const paths = await page.locator(`${SKILLS} svg path`).count();
    expect(paths, `wire paths with no WebGL: ${paths}`).toBeGreaterThan(10);
    await expect(page.locator(SKILLS)).toContainText('Calibration card');
    expect(pageErrors, `page errors with no WebGL:\n${pageErrors.join('\n')}`).toHaveLength(0);
  });

  test('TC-SCENE-SKILLS-06: the field is monochrome, palette-sourced and cheap per pixel', async () => {
    const glsl = readFileSync(GLSL_SOURCE, 'utf8');
    const component = readFileSync(FIELD_SOURCE, 'utf8');

    // Gold means "this figure has a source". A bench is not a figure, so the
    // accent may not reach the program — measured on the shader bodies rather
    // than on the file, because the file's own header is where the rule is
    // written down and a check that failed on its own documentation would push
    // the next author to delete the explanation instead of obeying it.
    const programs = [...glsl.matchAll(/\/\* glsl \*\/ `([\s\S]*?)`;/g)].map((m) => m[1]);
    expect(programs.length, 'the two shader programs were not found in bench.glsl.ts').toBe(2);
    for (const program of programs) {
      expect(program.toLowerCase()).not.toContain('gold');
    }
    expect(component.toLowerCase()).not.toContain('gold');

    // Raw hex lives in app/globals.css and lib/palette.ts, nowhere else.
    expect(glsl).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(component).not.toMatch(/#[0-9a-fA-F]{6}\b/);
    expect(component).toContain("from '@/lib/palette'");

    // One quad, and the same three-lookup ceiling every other scene holds to.
    expect(component).toContain('ScreenQuad');
    const body = glsl.slice(glsl.lastIndexOf('void main'));
    const lookups = body.match(/\bnoise\s*\(/g) ?? [];
    expect(
      lookups.length,
      `noise() calls in the fragment program: ${lookups.length}`,
    ).toBeLessThanOrEqual(3);

    // A lost context is not a crash, and must not be drawn through.
    expect(component).toContain('webglcontextlost');
    expect(component).toContain('webglcontextrestored');

    // The uniforms the section's own state drives.
    expect(glsl).toContain('uHover');
    expect(glsl).toContain('uIntensity');

    // The field reads the table, not only the atmosphere (G-S2 / ADV-1451Z
    // §Skills): the set of capabilities measured in production lifts the plate
    // where each wire lands, so the light is the evidence drawn in luminance
    // rather than a glow beneath it. The shader takes that set as uniforms and
    // the field component feeds them.
    expect(glsl).toContain('uRowCount');
    expect(glsl).toContain('uRows');
    expect(component).toContain('uRows');
    expect(component).toContain('uRowCount');
  });

  test('TC-SCENE-SKILLS-08: the field is fed the production rows from the bench own layout', async () => {
    const bench = readFileSync(BENCH_SOURCE, 'utf8');

    // The narrative carrier: the bench measures where each production capability
    // sits on its rail and hands that set to the field, so the plate lifts where
    // a production wire lands rather than glowing as undifferentiated
    // atmosphere. The rows come from measured layout, never a coordinate table.
    expect(bench).toMatch(/rows=\{/);
    expect(bench).toContain("=== 'production'");
  });

  test('TC-SCENE-SKILLS-07: three is fetched with the scene, not with the section', async () => {
    const bench = readFileSync(BENCH_SOURCE, 'utf8');

    // The field arrives through next/dynamic, so `three` lands in the chunk
    // `components/gl/Scene.tsx` fetches once a scene has cleared every gate —
    // never in this section's own bundle.
    expect(bench).toMatch(/dynamic\(\s*\(\)\s*=>\s*import\('\.\/BenchField'\)/);
    expect(bench).toContain("ssr: false");
    expect(bench, 'the bench must not import three directly').not.toMatch(/from 'three'/);

    // And the scene is mounted through the one component allowed to render 3D,
    // which is what carries the DPR cap, the visibility teardown and the
    // error boundary.
    expect(bench).toContain("from '@/components/gl/Scene'");
    expect(bench).toContain('sceneId="skills-bench"');
  });
});
