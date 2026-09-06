import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PNG } from 'pngjs';
import { test, expect, type Page } from '@playwright/test';

import { aboutContent } from '../../app/data/portfolio/about';

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

/* ── Measuring the field itself ──────────────────────────────────────────── */

/** The ten, in the order the SVG numbers them and the shader indexes them. */
const SECTORS = aboutContent.dimensions.length;
/** Which of the ten the engine answers from the candidate — the lit ones. */
const ANSWERED = aboutContent.dimensions.map((d) => d.side === 'candidate');
const TAU = Math.PI * 2;

/** Relative luminance (WCAG) of one 8-bit sRGB triple. */
function luminance(r: number, g: number, b: number): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Hue in degrees and saturation 0..1 — enough to name gold and nothing else. */
function hueSaturation(r: number, g: number, b: number): { hue: number; saturation: number } {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0 || max === 0) return { hue: 0, saturation: 0 };
  let hue: number;
  if (max === r) hue = 60 * (((g - b) / delta + 6) % 6);
  else if (max === g) hue = 60 * ((b - r) / delta + 2);
  else hue = 60 * ((r - g) / delta + 4);
  return { hue, saturation: delta / max };
}

interface Shot {
  png: ReturnType<typeof PNG.sync.read>;
  /** Image pixels per CSS pixel — a screenshot may be taken at a scale factor. */
  scale: number;
}

interface FieldGeometry {
  /** The engraving's centre, in CSS pixels inside the canvas box. */
  centreX: number;
  centreY: number;
  /** The engraving's radius, same units. The shader's `rr = 1` is this. */
  roseRadius: number;
  width: number;
  height: number;
  /** The dimension the section says is being read, or -1. */
  active: number;
}

/**
 * Where the engraving falls inside the canvas, and which dimension is indexed —
 * read from the DOM rather than assumed, because the instrument is sticky and
 * the plane travels with the reader (see `AboutField.tsx`, same measurement).
 */
async function readFieldGeometry(page: Page): Promise<FieldGeometry> {
  return page.evaluate(() => {
    const canvas = document.querySelector('#about canvas');
    const stage = document.querySelector('#about [class*="instrumentStage"]');
    const slot = document.querySelector('#about [data-axis]');
    if (!canvas || !stage || !slot) throw new Error('#about: no canvas, stage or field slot');
    const c = canvas.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const axis = Number((slot as HTMLElement).dataset.axis ?? '-1');
    return {
      centreX: s.left + s.width / 2 - c.left,
      centreY: s.top + s.height / 2 - c.top,
      roseRadius: s.width / 2,
      width: c.width,
      height: c.height,
      active: Number.isFinite(axis) ? axis : -1,
    };
  });
}

/** The canvas, alone: the SVG engraving and every word of the section hidden. */
async function hideEverythingButTheField(page: Page) {
  await page.addStyleTag({
    content: `#about header, #about ol, #about [class*="instrument"] {
      visibility: hidden !important;
    }`,
  });
  await page.waitForTimeout(500);
}

/** One pixel of a screenshot at CSS coordinates, or null when outside it. */
function pixelAt(shot: Shot, x: number, y: number): [number, number, number] | null {
  const px = Math.round(x * shot.scale);
  const py = Math.round(y * shot.scale);
  if (px < 0 || py < 0 || px >= shot.png.width || py >= shot.png.height) return null;
  const o = (py * shot.png.width + px) * 4;
  return [shot.png.data[o], shot.png.data[o + 1], shot.png.data[o + 2]];
}

/**
 * The sector geometry the shader draws, restated in screen coordinates so the
 * test measures the picture rather than the source.
 *
 * `field.glsl.ts`: `a = atan(p.x, p.y) - uRotation`, `s = a / TAU * SECTORS +
 * 0.5`, `idx = floor(s)`. `uRotation` is `-active * TAU / SECTORS`
 * (`AboutField.tsx::indexAngle`), which carries the dimension being read to
 * twelve o'clock. So sector `i` is centred at `uRotation + i * TAU / SECTORS`
 * measured clockwise from up, and its two boundaries sit half a sector either
 * side of that.
 */
function sectorAngle(active: number, index: number, within: number): number {
  const rotation = active < 0 ? 0 : (-active * TAU) / SECTORS;
  return rotation + ((index + within - 0.5) * TAU) / SECTORS;
}

interface AnnulusReading {
  /** Mean luminance per sector, indexed as the section indexes its ten. */
  sectorMean: number[];
  /** Mean luminance along each sector's leading boundary. */
  boundaryMean: number[];
  /** Pixels actually sampled per sector. A sector off the canvas has none. */
  sectorSamples: number[];
  /** The brightest gold-ish pixel found, or null. Gold may never be here. */
  gold: { hue: number; saturation: number } | null;
  /** The radii the annulus actually covered, in units of the rose's radius. */
  band: [number, number];
}

/**
 * Samples ten 36° sectors on an annulus around the engraving's centre.
 *
 * The task's nominal band is `r ∈ [0.26, 0.42]·min(w, h)`. That band assumes an
 * instrument at the middle of its plane; here the plane is the whole body and
 * the engraving sits in the left column at 1440, so a band that wide runs off
 * the canvas on the left and half the ten could not be measured at all. The
 * band is therefore written in the rose's own frame — the frame the shader
 * writes its sector ring in — and clipped to what is actually inside the
 * canvas, which is the strongest annulus a reader's eye can be shown.
 */
function readAnnulus(
  shot: Shot,
  geometry: FieldGeometry,
  band: [number, number] = [0.4, 0.96],
): AnnulusReading {
  const rInner = band[0] * geometry.roseRadius;
  const rOuter = band[1] * geometry.roseRadius;
  const steps = 24;
  const arcSamples = 7;
  const sectorMean: number[] = [];
  const boundaryMean: number[] = [];
  const sectorSamples: number[] = [];
  let gold: { hue: number; saturation: number } | null = null;

  const sampleAlong = (angle: number): number[] => {
    const values: number[] = [];
    for (let s = 0; s < steps; s += 1) {
      const r = rInner + ((rOuter - rInner) * s) / (steps - 1);
      const x = geometry.centreX + r * Math.sin(angle);
      const y = geometry.centreY - r * Math.cos(angle);
      const pixel = pixelAt(shot, x, y);
      if (!pixel) continue;
      const [red, green, blue] = pixel;
      const hs = hueSaturation(red, green, blue);
      if (hs.hue >= 35 && hs.hue <= 60 && hs.saturation > 0.25) gold = hs;
      values.push(luminance(red, green, blue));
    }
    return values;
  };

  for (let i = 0; i < SECTORS; i += 1) {
    const inside: number[] = [];
    for (let a = 0; a < arcSamples; a += 1) {
      // Across the sector's own width, clear of both boundaries.
      const within = 0.25 + (0.5 * a) / (arcSamples - 1);
      inside.push(...sampleAlong(sectorAngle(geometry.active, i, within)));
    }
    sectorMean.push(inside.reduce((sum, v) => sum + v, 0) / Math.max(inside.length, 1));
    sectorSamples.push(inside.length);

    // The seam between sector i-1 and sector i: `within = 0`.
    const seam = sampleAlong(sectorAngle(geometry.active, i, 0));
    boundaryMean.push(seam.reduce((sum, v) => sum + v, 0) / Math.max(seam.length, 1));
  }

  return { sectorMean, boundaryMean, sectorSamples, gold, band };
}

/** The widest fan band that fits inside the canvas, or null when none does. */
function fanBand(geometry: FieldGeometry): [number, number] | null {
  const reach =
    Math.max(
      geometry.centreX,
      geometry.centreY,
      geometry.width - geometry.centreX,
      geometry.height - geometry.centreY,
    ) / geometry.roseRadius;
  const outer = Math.min(1.6, reach);
  return outer > 1.2 ? [1.12, outer] : null;
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

  /**
   * G-A3, the finding this file could not previously catch.
   *
   * ADV-REVIEW-20260905T2315Z §About: on live `9136bc59` a recruiter's recall of
   * `#about` is still the SVG compass — "01–10, hub 01/04 ANSWERED" — even
   * though the field is now the section's whole plane. Every test above this
   * one measures the field's *source* or its *mount*; none of them looks at the
   * picture and asks whether the light says anything a reader could read. So a
   * field could be a smooth wash of haze and pass, which is roughly what it
   * was: the ten sectors existed in the shader but not in the eye.
   *
   * These two measure the picture. The first hides the engraving and the type
   * and asks the remaining light to tell the ten dimensions on its own. The
   * second puts everything back and asks which object the section is actually
   * made of.
   */
  for (const viewport of [
    { label: '1440x900', width: 1440, height: 900, item: 4 },
    { label: '390x844', width: 390, height: 844, item: 0 },
  ]) {
    test(`TC-SCENE-ABOUT-10: the field alone tells ten sectors at ${viewport.label}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await settleAboutWithGL(page);
      if (viewport.item > 0) {
        // The k-th dimension is the one being read (k = 4, `Role Alignment`).
        await centreItem(page, viewport.item);
      } else {
        // At 390 the instrument is a header ornament in flow, so the plane is a
        // band at the head of the body: put that band on screen instead.
        await page.locator(ABOUT).evaluate((el) => {
          window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top);
        });
        await page.waitForTimeout(900);
      }
      await expect(page.locator(`${ABOUT} canvas`)).toHaveCount(1);

      const geometry = await readFieldGeometry(page);
      await hideEverythingButTheField(page);
      const buffer = await page.locator(`${ABOUT} canvas`).screenshot();
      const png = PNG.sync.read(buffer);
      const shot: Shot = { png, scale: png.width / geometry.width };

      // The ring the engraving stands on, and — where the plane is wide enough
      // to hold it — the same ten carried out past the bezel as a fan. The fan
      // is the half of this that matters most: the bezel covers the ring, so
      // the light a reader actually sees is the light outside it, and it has to
      // say the same ten things.
      const ring = readAnnulus(shot, geometry);
      const fanExtent = fanBand(geometry);
      const fan = fanExtent ? readAnnulus(shot, geometry, fanExtent) : null;

      /** (i) and (ii), against one annulus. */
      const assertTellsTen = (reading: AnnulusReading, where: string, minSectors: number) => {
        const measured = reading.sectorSamples
          .map((count, i) => ({ count, i }))
          .filter(({ count }) => count >= 12)
          .map(({ i }) => i);
        expect(
          measured.length,
          `${where}: only ${measured.length} of the ten sectors on the annulus ` +
            `${JSON.stringify(reading.band)} are inside the canvas at all`,
        ).toBeGreaterThanOrEqual(minSectors);

        // Ten lobes, not one smooth wash. Each seam between neighbours has to
        // sit at least 12% below the light either side of it, or the "sectors"
        // are a gradient a reader cannot count.
        const seams = measured.filter((i) => measured.includes((i + SECTORS - 1) % SECTORS));
        const steps = seams.map((i) => {
          const flank = (reading.sectorMean[(i + SECTORS - 1) % SECTORS] + reading.sectorMean[i]) / 2;
          return flank <= 0 ? 0 : 1 - reading.boundaryMean[i] / flank;
        });
        const legible = steps.filter((step) => step >= 0.12).length;
        expect(
          legible,
          `${where}: only ${legible} of ${steps.length} sector boundaries show a 12% luminance ` +
            `step — steps ${steps.map((s) => s.toFixed(3)).join(', ')}`,
        ).toBeGreaterThanOrEqual(steps.length - 1);

        // Answered brighter than open, in the order the SVG numbers them. The
        // task's shorthand is "sectors 1..k against k+1..10"; the ten are not
        // ordered that way — the three role-side dimensions are 6, 7 and 9 — so
        // the mask from `about.ts` is what is asserted, which is the same claim
        // against the real data and cannot pass by an accident of ordering.
        const answered = measured.filter((i) => ANSWERED[i]).map((i) => reading.sectorMean[i]);
        const open = measured.filter((i) => !ANSWERED[i]).map((i) => reading.sectorMean[i]);
        expect(answered.length, `${where}: no answered sector measured`).toBeGreaterThan(0);
        expect(open.length, `${where}: no open sector measured`).toBeGreaterThan(0);
        const answeredMean = answered.reduce((s, v) => s + v, 0) / answered.length;
        const openMean = open.reduce((s, v) => s + v, 0) / open.length;
        expect(
          answeredMean / openMean,
          `${where}: answered ${answeredMean.toFixed(4)} vs open ${openMean.toFixed(4)} — the ` +
            `light does not say which of the ten are answered (per-sector ${reading.sectorMean
              .map((v) => v.toFixed(4))
              .join(', ')})`,
        ).toBeGreaterThanOrEqual(1.6);
      };

      assertTellsTen(ring, 'the ring under the engraving', SECTORS);
      if (fan) assertTellsTen(fan, 'the fan outside the bezel', 6);

      // (iii) Gold is a claim mark and a field of light is not a claim.
      expect(ring.gold, 'a gold pixel was sampled inside the field').toBeNull();
      expect(fan?.gold ?? null, 'a gold pixel was sampled in the fan').toBeNull();
    });
  }

  test('TC-SCENE-ABOUT-11: the compass is chrome — the plane carries the section', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await settleAboutWithGL(page);
    // The section's *first* viewport: the screen a reader arrives on, with the
    // plane's core and the engraving on it, rather than a screen deep in the
    // ten where the reading column is most of what is on the glass.
    await page.locator(ABOUT).evaluate((el) => {
      window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top);
    });
    await page.waitForTimeout(1200);
    await expect(page.locator(`${ABOUT} canvas`)).toHaveCount(1);

    const clip = await page.locator(FIELD).evaluate((el) => {
      const r = el.getBoundingClientRect();
      return {
        x: Math.max(r.left, 0),
        y: Math.max(r.top, 0),
        width: Math.min(r.width, window.innerWidth),
        height: Math.min(r.height, window.innerHeight - Math.max(r.top, 0)),
      };
    });
    const withField = PNG.sync.read(await page.screenshot({ clip }));
    // The same frame with the plane's light taken away. The still underneath is
    // `:has(canvas)`-suppressed and stays suppressed — the canvas is still in
    // the DOM — so this is the section with its type and its engraving alone.
    await page.addStyleTag({ content: '#about canvas { visibility: hidden !important; }' });
    await page.waitForTimeout(400);
    const withoutField = PNG.sync.read(await page.screenshot({ clip }));

    const ground = await page.evaluate(() => {
      const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink-900').trim();
      const probe = document.createElement('span');
      probe.style.color = ink;
      document.body.appendChild(probe);
      const rgb = getComputedStyle(probe).color;
      probe.remove();
      const parts = rgb.match(/[\d.]+/g)!.map(Number);
      return [parts[0], parts[1], parts[2]] as [number, number, number];
    });
    const groundLuma = luminance(ground[0], ground[1], ground[2]);

    let total = 0;
    let fromField = 0;
    for (let i = 0; i < withField.width * withField.height; i += 1) {
      const o = i * 4;
      const lit = luminance(withField.data[o], withField.data[o + 1], withField.data[o + 2]);
      const bare = luminance(
        withoutField.data[o],
        withoutField.data[o + 1],
        withoutField.data[o + 2],
      );
      total += Math.max(0, lit - groundLuma);
      fromField += Math.max(0, lit - bare);
    }
    const dominance = total === 0 ? 0 : fromField / total;
    expect(
      dominance,
      `the canvas contributes ${(dominance * 100).toFixed(1)}% of the light above the section ` +
        'ground — the engraving and the type are what the reader is looking at',
    ).toBeGreaterThanOrEqual(0.75);

    // And the engraving is drawn as chrome: nothing in it is painted brighter
    // than --mist-400, the site's secondary ink. The claim mark is not affected
    // — gold lives on the caliper in the reading column, not on the dial.
    const brightest = await page.evaluate(() => {
      const channel = (v: number) => {
        const c = v / 255;
        return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      };
      const luma = (rgb: string) => {
        const parts = rgb.match(/[\d.]+/g)?.map(Number);
        if (!parts || parts.length < 3) return 0;
        const alpha = parts.length > 3 ? parts[3] : 1;
        return (
          alpha *
          (0.2126 * channel(parts[0]) + 0.7152 * channel(parts[1]) + 0.0722 * channel(parts[2]))
        );
      };
      const svg = document.querySelector('#about svg[class*="compass"]')!;
      const limit = (() => {
        const probe = document.createElement('span');
        probe.style.color = getComputedStyle(document.documentElement)
          .getPropertyValue('--mist-400')
          .trim();
        document.body.appendChild(probe);
        const value = luma(getComputedStyle(probe).color);
        probe.remove();
        return value;
      })();
      let max = 0;
      let worst = '';
      for (const node of [svg, ...Array.from(svg.querySelectorAll('*'))]) {
        const style = getComputedStyle(node as Element);
        // Opacity compounds down the tree, so the paint that actually lands is
        // the colour's luminance times every opacity above it.
        let opacity = 1;
        let walk: Element | null = node as Element;
        while (walk && walk !== svg.parentElement) {
          opacity *= Number(getComputedStyle(walk).opacity || '1');
          walk = walk.parentElement;
        }
        // Stroke and fill are what the dial actually paints; `color` only
        // counts on a <text>, where the numerals paint through `currentColor`.
        // Reading `color` off every node would measure inheritance from the
        // page rather than ink that lands.
        const paints = [style.stroke, style.fill];
        if ((node as Element).tagName.toLowerCase() === 'text') paints.push(style.color);
        for (const paint of paints) {
          if (!paint || paint === 'none' || paint.startsWith('url')) continue;
          const value = luma(paint) * opacity;
          if (value > max) {
            max = value;
            worst = `${(node as Element).getAttribute('class') ?? node.nodeName}: ${paint} @ ${opacity.toFixed(2)}`;
          }
        }
      }
      return { max, limit, worst };
    });
    expect(
      brightest.max,
      `the engraving paints brighter than --mist-400 (${brightest.limit.toFixed(3)}): ${brightest.worst}`,
    ).toBeLessThanOrEqual(brightest.limit + 0.005);
  });
});
