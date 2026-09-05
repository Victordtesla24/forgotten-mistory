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
const ABOUT_CSS = join(ABOUT_DIR, 'About.module.css');
const CAPABILITY_SOURCE = join(process.cwd(), 'components/gl/useGLCapability.ts');

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

  test('TC-SCENE-ABOUT-08: the field is the section’s plane, not the instrument’s backing', () => {
    const css = readFileSync(ABOUT_CSS, 'utf8');
    const component = readFileSync(FIELD_SOURCE, 'utf8');
    const markup = readFileSync(join(ABOUT_DIR, 'About.tsx'), 'utf8');
    const glsl = readFileSync(GLSL_SOURCE, 'utf8');

    // G-A3, twice over. Through c22 the slot and the rose were the same 384 px
    // box; c23 grew the slot to a 30rem stage with the engraving inset at 0.78.
    // Both shipped, both were reviewed on live, and both came back with the
    // section's recall recorded as the SVG radar — a halo around the widget is
    // the widget. The canvas is no longer in the instrument at all.
    const stageBlock = css.slice(css.indexOf('.instrumentStage {'));
    const stageRule = stageBlock.slice(0, stageBlock.indexOf('}'));
    expect(stageRule, 'the halo fraction is back in .instrumentStage').not.toContain(
      '--about-rose-fraction',
    );
    // The engraving fills its own stage again. Any inset here is the halo.
    expect(css).toMatch(/\.instrumentStage > svg \{[^}]*width:\s*100%/);

    // The plane spans the body — both columns — and is one screen tall,
    // travelling with the reader. `.body` is its containing block, so it can
    // never push a grid column around.
    expect(css).toMatch(/\.body \{[^}]*position:\s*relative/);
    const fieldRule = css.slice(css.indexOf('.field {'));
    expect(fieldRule.slice(0, fieldRule.indexOf('}'))).toMatch(/position:\s*absolute;\s*inset:\s*0/);
    const viewportRule = css.slice(css.indexOf('.fieldViewport {'));
    expect(viewportRule.slice(0, viewportRule.indexOf('}'))).toMatch(/height:\s*100vh/);
    // It travels with the reader when the shader is live, and only then: the
    // still is a fixed gradient that cannot know where the type is, so pinning
    // it to the screen puts it over the ten (c24 probe, 390: 1.91:1).
    expect(css).toMatch(/\.fieldViewport:has\(canvas\) \{[^}]*position:\s*sticky/);
    // ...and the two lights never add. The still is the no-GL path, full stop.
    expect(css).toMatch(/\.fieldSlot:has\(canvas\) \{[^}]*background:\s*none/);

    // ...and it is mounted outside the instrument in the markup, not merely
    // sized past it in CSS. The engraving is chrome standing on the plane.
    const fieldAt = markup.indexOf('className={styles.field}');
    const instrumentAt = markup.indexOf('className={styles.instrument}');
    expect(fieldAt).toBeGreaterThan(-1);
    expect(instrumentAt).toBeGreaterThan(-1);
    expect(fieldAt, 'the field is still mounted inside the instrument').toBeLessThan(instrumentAt);
    expect(markup).not.toMatch(/styles\.instrumentStage[\s\S]{0,400}styles\.fieldSlot/);

    // The instrument is sticky inside a plane that is itself sticky, so where
    // the engraving is, how big it is, and where the section's type sits are
    // all measured from the DOM rather than assumed.
    expect(component).toContain('getBoundingClientRect()');
    expect(component).toMatch(/uCentre:\s*\{ value: new THREE\.Vector2/);
    expect(component).toMatch(/uRoseRadius:\s*\{ value:/);
    expect(component).toMatch(/uGuard:\s*\{ value: new THREE\.Vector3/);

    const body = glsl.slice(glsl.lastIndexOf('void main'));
    // Polar about the instrument wherever it is, and the engraving's own frame
    // is still what every rose-locked radius is written in.
    expect(body).toMatch(/vec2\s+p\s*=\s*\(vUv - uCentre\)/);
    expect(body).toMatch(/float\s+rr\s*=\s*r\s*\/\s*max\(uRoseRadius/);
    expect(body).toMatch(/ring\s*=\s*smoothstep\([^)]*rr\)/);

    // The fan is what makes this the section's surface: the same ten sectors,
    // the same reading, the same two data states, carried across the plane.
    expect(body).toMatch(/float\s+fan\s*=/);
    expect(body).toMatch(/sector\s*\+=\s*fan[\s\S]*?lit/);
    expect(body).toMatch(/sector\s*\+=\s*fan[\s\S]*?answered[\s\S]*?sourced/);
    // And a plane drawn under type has to bound its light there, not just aim
    // it elsewhere — asymptotically, so the bound leaves no edge of its own.
    expect(body).toMatch(/float\s+ceiling\s*=/);
    expect(body).toMatch(/1\.0 - exp\(-luma \/ max\(ceiling/);
    expect(component).toMatch(/READING_CEILING\s*=\s*0?\.1/);
    expect(component).toMatch(/INSTRUMENT_CEILING\s*=\s*0?\.24/);

    // Still the light only: no accent smuggled in with the new area.
    expect(glsl.toLowerCase()).not.toContain('gold');
  });

  test('TC-SCENE-ABOUT-09: a renderer the name test refuses is measured, not simply turned away', () => {
    const source = readFileSync(CAPABILITY_SOURCE, 'utf8');

    // The reviewer's second finding on 64404134: the gate decides from a string
    // match on the renderer's name, so a renderer that would hold the frame
    // budget is refused for being called the wrong thing. The name test stays —
    // it is cheap and right about the common cases — but it is no longer the
    // verdict: a refused renderer gets to prove itself by measurement.
    expect(source).toMatch(/function projectedFrameMs\(\): number \| null/);
    expect(source).toMatch(/if \(refused\) \{[\s\S]*?projectedFrameMs\(\)/);
    expect(source).toMatch(/projected <= FRAME_BUDGET_MS.*refused = false/s);

    // The measurement blocks on the driver, or it is timing the queue and not
    // the work.
    expect(source).toContain('gl.finish()');
    // It is projected onto the viewport at the resolution GLCanvas renders at,
    // because these scenes are fill-bound: a 256px square proves nothing on its
    // own about a 1440x900 frame.
    expect(source).toContain('viewportFragments');
    expect(source).toMatch(/DPR_CEILING\s*=\s*1\.75/);

    // It is an appeal, not an amnesty. A renderer that misses the budget is
    // still refused, and a measurement that cannot be taken leaves the name
    // test standing rather than defaulting to 'supported'.
    expect(source).toMatch(/projected !== null/);
    expect(source).toContain("cached = refused ? 'unsupported' : 'supported'");
    // And it is not the `?gl=force` hatch in another shape: force is still the
    // only thing that skips the question.
    expect(source).toContain("window.location.search.includes('gl=force')");
  });
});
