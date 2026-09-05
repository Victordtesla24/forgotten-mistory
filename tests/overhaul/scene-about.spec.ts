import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { test, expect, type Page } from '@playwright/test';

/**
 * SPEC-v10 §R2 / c16 — `#about` carries a flagship scene.
 *
 * Before this file, `#about` was the one section whose argument was built as an
 * instrument and whose instrument had nothing behind it: an inline SVG rose on
 * bare ink, `canvases: 0` at `?gl=force` (SPEC-v10 §1, probe P-2). R2 asks for
 * a signature GLSL scene per section and M1 for exactly one flagship
 * visualisation in each; this is `#about`'s.
 *
 * What the scene must be, and what these tests pin:
 *
 * 1. **One canvas, only when the hardware earns it.** `components/gl/Scene.tsx`
 *    is the only way a section may render 3D, and on a software rasteriser it
 *    mounts nothing at all. Every CI machine here is a software rasteriser, so
 *    the mount tests use `?gl=force` — the escape hatch in
 *    `components/gl/useGLCapability.ts` — otherwise this suite would pass by
 *    testing the fallback and never compile a line of GLSL.
 *
 * 2. **The compass keeps its meaning.** The field is the same idea as the rose:
 *    ten sectors, turning so the dimension being read sits at twelve o'clock.
 *    Cycle 12's scroll-drive is the single source of that index — the field
 *    reads the same `active` the SVG does, which is what TC-SCENE-ABOUT-03
 *    asserts through `data-axis`.
 *
 * 3. **The scene is never the content.** Reduced motion and a browser with no
 *    WebGL both leave the section whole: zero canvases, the SVG rose and all
 *    ten dimensions still there. `prefers-reduced-motion` is not optional
 *    (CLAUDE.md), and this is where that is proved for `#about`.
 *
 * 4. **Behind, and silent.** The canvas sits under the SVG and under the
 *    reading column, and is `aria-hidden` — a field of light is not something
 *    a screen reader should be asked to imagine.
 *
 * 5. **Monochrome.** Gold means one thing on this site: this figure has a
 *    source. A shader is not a figure, so the field's source may not name gold
 *    and may not carry raw hex — colour comes from `lib/palette.ts` only.
 */

const ABOUT = '#about';
const FIELD = `${ABOUT} [data-axis]`;
const ROSE = `${ABOUT} svg[class*="compass"]`;

const ABOUT_DIR = join(process.cwd(), 'components/sections/About');
const GLSL_SOURCE = join(ABOUT_DIR, 'field.glsl.ts');
const FIELD_SOURCE = join(ABOUT_DIR, 'AboutField.tsx');

async function waitForPageReady(page: Page) {
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
}

/**
 * Loads the page with the software-rasteriser guard overridden and walks
 * `#about` into view, then gives `Scene` the load + idle callback it waits for
 * before it fetches anything 3D.
 */
async function settleAboutWithGL(page: Page) {
  await page.goto('/?gl=force', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await page.locator(ABOUT).scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
}

/** Scroll item `n` (1-based) so its centre sits at the viewport's centre. */
async function centreItem(page: Page, n: number) {
  await page.mouse.move(2, 2);
  await page
    .locator(`${ABOUT} ol li`)
    .nth(n - 1)
    .evaluate((el) => {
      const r = el.getBoundingClientRect();
      window.scrollTo(0, window.scrollY + r.top + r.height / 2 - window.innerHeight / 2);
    });
  await page.waitForTimeout(900);
}

test.describe('TC-SCENE-ABOUT: the compass turns over a field of light', () => {
  test.describe.configure({ timeout: 120000 });

  test('TC-SCENE-ABOUT-01: exactly one canvas mounts in #about once the section is in view', async ({
    page,
  }) => {
    await settleAboutWithGL(page);

    const canvases = page.locator(`${ABOUT} canvas`);
    await expect(canvases).toHaveCount(1);

    const box = await canvases.first().boundingBox();
    expect(box, 'the #about canvas has no box').not.toBeNull();
    expect(box!.width, 'the #about canvas is too small to be drawing').toBeGreaterThan(100);
    expect(box!.height, 'the #about canvas is too small to be drawing').toBeGreaterThan(100);
  });

  test('TC-SCENE-ABOUT-02: the canvas is aria-hidden and sits behind the rose and the column', async ({
    page,
  }) => {
    await settleAboutWithGL(page);
    await expect(page.locator(`${ABOUT} canvas`)).toHaveCount(1);

    // Silent to assistive technology: the field is texture, not testimony.
    const hidden = await page
      .locator(`${ABOUT} canvas`)
      .first()
      .evaluate((el) => el.closest('[aria-hidden="true"]') !== null);
    expect(hidden, 'the #about canvas is not inside an aria-hidden slot').toBe(true);

    // Behind the instrument: the point at the centre of the compass face
    // resolves to the SVG, never to the canvas.
    const onTop = await page.locator(ROSE).evaluate((svg) => {
      const r = svg.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { tag: hit?.tagName ?? 'none', insideSvg: hit ? svg.contains(hit) : false };
    });
    expect(onTop.tag).not.toBe('CANVAS');
    expect(onTop.insideSvg, 'the compass face is not the topmost element over itself').toBe(true);

    // Behind the reading column: the heading never resolves to the canvas.
    const overHeading = await page.locator('#about-title').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return document.elementFromPoint(r.left + 4, r.top + r.height / 2)?.tagName ?? 'none';
    });
    expect(overHeading).not.toBe('CANVAS');

    // And the stacking says so too, not just the hit test.
    const zOrder = await page.evaluate(() => {
      const field = document.querySelector('#about [data-axis]');
      const rose = document.querySelector('#about svg[class*="compass"]');
      return {
        field: field ? getComputedStyle(field).zIndex : 'missing',
        rose: rose ? getComputedStyle(rose).zIndex : 'missing',
      };
    });
    expect(Number(zOrder.field)).toBeLessThan(Number(zOrder.rose));
  });

  test('TC-SCENE-ABOUT-03: the field is driven by the same scroll index as the rose', async ({
    page,
  }) => {
    await settleAboutWithGL(page);

    await centreItem(page, 6);
    await expect(page.locator(FIELD)).toHaveAttribute('data-axis', '5');
    await expect(page.locator(`${ABOUT} ol li`).nth(5)).toHaveAttribute('data-active', 'true');

    await centreItem(page, 2);
    await expect(page.locator(FIELD)).toHaveAttribute('data-axis', '1');
    await expect(page.locator(`${ABOUT} ol li`).nth(1)).toHaveAttribute('data-active', 'true');
  });

  test('TC-SCENE-ABOUT-04: under reduced motion there is no canvas, and the rose is still the instrument', async ({
    page,
  }) => {
    // Set before navigation: `Scene` reads the query on mount, so a reader who
    // has asked for reduced motion never has a context allocated for them at
    // all — the scene is not started and then stopped.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await settleAboutWithGL(page);

    await expect(page.locator(`${ABOUT} canvas`)).toHaveCount(0);
    await expect(page.locator(ROSE)).toBeVisible();

    // 138 drawn elements: 32 paths (10 sectors, 21 graduation arcs, the index
    // caret), 102 lines (100 bezel ticks, the index stem, the hatch) and 4
    // circles (hub glow, bezel, bezel inner, hub ring). That is the instrument
    // SPEC-v10's probe counted, and it must survive with the scene absent.
    const drawn = await page
      .locator(`${ABOUT} svg path, ${ABOUT} svg line, ${ABOUT} svg circle`)
      .count();
    expect(drawn, 'the compass rose lost its geometry under reduced motion').toBeGreaterThanOrEqual(
      130,
    );

    await expect(page.locator(`${ABOUT} ol li`)).toHaveCount(10);
    await expect(page.locator(ABOUT)).toContainText('Ten axes · no scores');
  });

  test('TC-SCENE-ABOUT-05: with WebGL unavailable the section is whole and silent', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    // A browser that cannot give out a WebGL context at all — not a software
    // rasteriser, no context. `useGLCapability` must report `unsupported` and
    // `Scene` must mount nothing.
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

    await settleAboutWithGL(page);

    await expect(page.locator(`${ABOUT} canvas`)).toHaveCount(0);
    await expect(page.locator(`${ABOUT} ol li`)).toHaveCount(10);
    await expect(page.locator(ROSE)).toBeVisible();
    await expect(page.locator(ABOUT)).toContainText('Ten axes · no scores');
    expect(pageErrors, `page errors with no WebGL:\n${pageErrors.join('\n')}`).toHaveLength(0);
  });

  test('TC-SCENE-ABOUT-06: the field is monochrome, palette-sourced and cheap per pixel', async () => {
    const glsl = readFileSync(GLSL_SOURCE, 'utf8');
    const component = readFileSync(FIELD_SOURCE, 'utf8');

    // Gold marks a figure with a source. A shader is not a figure.
    expect(glsl.toLowerCase()).not.toContain('gold');
    expect(component).not.toContain('gold');

    // Raw hex outside app/globals.css and lib/palette.ts fails the static
    // audit; the field takes its two colours from the palette module.
    expect(glsl).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(component).not.toMatch(/#[0-9a-fA-F]{6}\b/);
    expect(component).toContain("from '@/lib/palette'");

    // The fill budget: one full-screen quad, at most three noise lookups per
    // pixel — the same ceiling CareerStrata holds itself to. Counted from the
    // fragment program's own `void main` (the last one in the file; the first
    // belongs to the vertex shader) so the noise function's declaration above
    // it is not mistaken for a call site.
    const body = glsl.slice(glsl.lastIndexOf('void main'));
    const lookups = body.match(/\bnoise\s*\(/g) ?? [];
    expect(
      lookups.length,
      `noise() calls in the fragment program: ${lookups.length}`,
    ).toBeLessThanOrEqual(3);

    // One quad. Not a mesh, not a particle system.
    expect(component).toContain('ScreenQuad');
    // A context that goes away must take the field with it, not freeze it.
    expect(component).toContain('webglcontextlost');
  });

  test('TC-SCENE-ABOUT-07: the field is driven by the section data — answered/role/sourced, not scroll alone', () => {
    const glsl = readFileSync(GLSL_SOURCE, 'utf8');
    const component = readFileSync(FIELD_SOURCE, 'utf8');

    // G-A3: a recruiter's recall of #about must be the GL field carrying the
    // story, not the SVG widget. That only holds if the light knows the three
    // states the ten dimensions are actually in — answered from the candidate,
    // computed from the role (open), and sourced (a record a reader can open) —
    // rather than lighting every sector identically and only moving the index.

    // Two state masks reach the shader as uniforms and are read per sector.
    expect(glsl).toContain('uniform float uAnsweredMask;');
    expect(glsl).toContain('uniform float uSourcedMask;');

    // Read without indexing a uniform array (unreliable in a WebGL1 fragment
    // shader): a bit test with exp2, applied to this pixel's own sector.
    const body = glsl.slice(glsl.lastIndexOf('void main'));
    expect(body).toMatch(/maskBit\s*\(\s*uAnsweredMask/);
    expect(body).toMatch(/maskBit\s*\(\s*uSourcedMask/);
    expect(glsl).toMatch(/float\s+maskBit\s*\([^)]*\)\s*\{[\s\S]*?exp2\(/);

    // Both states must actually shape the light, and additively — the light may
    // gain from the data but never drop a sector below its floor. The answered
    // bloom and the sourced lift are both `+=` onto `sector`.
    expect(body).toMatch(/sector\s*\+=\s*answered\b/);
    expect(body).toMatch(/sector\s*\+=\s*sourced\b/);

    // The section, not the shader, owns which sectors those are: the masks are
    // reduced from about.ts (the same source the rose and the list read), so
    // the field can never disagree with the chrome about a sector's state.
    expect(component).toContain("from '@/app/data/portfolio/about'");
    expect(component).toMatch(/ANSWERED_MASK[\s\S]*?dimension\.side === 'candidate'/);
    expect(component).toMatch(/SOURCED_MASK[\s\S]*?dimension\.sourced/);
    expect(component).toContain('uAnsweredMask: { value: ANSWERED_MASK }');
    expect(component).toContain('uSourcedMask: { value: SOURCED_MASK }');

    // The masks are integer bitfields, not colour: the site's one accent marks
    // a sourced figure in the DOM and never enters the shader (TC-SCENE-ABOUT-06
    // pins the absence of the accent by name; this pins that the data path added
    // here did not smuggle it back in as a hex).
    expect(glsl).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(component).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });
});
