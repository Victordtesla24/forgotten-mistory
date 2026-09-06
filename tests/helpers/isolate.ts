import { PNG } from 'pngjs';
import { expect, type Page } from '@playwright/test';

import { settleBoot } from './boot';

/**
 * The chrome-hidden capture instrument, lifted out of
 * `tests/overhaul/flagship-visibility.spec.ts` so a second suite can measure the
 * *same picture* instead of forking the isolation.
 *
 * ## Why this file exists
 *
 * `flagship-visibility.spec.ts` answers "is there light?" (coverage / peak /
 * motion) on a capture where every element except one scene slot is hidden.
 * `tests/overhaul/story-contract.spec.ts` (SIGNATURE-SCENES-v2 §5) asks the
 * third question — "with every word on the page hidden, can a stranger tell
 * which section this is?" — and it has to ask it of *that* capture, not of a
 * lookalike. Two copies of `isolateScene` that drift by one CSS rule would make
 * the two suites disagree about what they photographed, which is precisely the
 * failure mode SIGNATURE-SCENES-v2 §0.2 records.
 *
 * The bodies below are verbatim from `flagship-visibility.spec.ts:57-300`
 * (`relativeLuminance`, `decodeLuma`, `bootAt`, `groundLuminance`,
 * `isolateScene`, `restorePage`, `slotClip`) with only their `export` added.
 *
 * `flagship-visibility.spec.ts` is deliberately **not** edited to import from
 * here in this slice: it is a live gate and a parallel lane is inside it this
 * cycle (SIGNATURE-SCENES-v2 §7 slices X2-F1…F5), and a merge conflict in a
 * gate is worse than one cycle of duplication. Adopting this module there is a
 * one-import change and belongs to whichever of those slices lands last.
 */

/** Relative luminance (WCAG) of one 8-bit sRGB triple. */
export function relativeLuminance(r: number, g: number, b: number): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export interface LumaField {
  /** Per-pixel relative luminance, row-major. */
  values: Float64Array;
  width: number;
  height: number;
}

/** Decodes a PNG buffer to a luminance field. */
export function decodeLuma(buffer: Buffer): LumaField {
  const png = PNG.sync.read(buffer);
  const values = new Float64Array(png.width * png.height);
  for (let i = 0; i < values.length; i += 1) {
    const o = i * 4;
    values[i] = relativeLuminance(png.data[o], png.data[o + 1], png.data[o + 2]);
  }
  return { values, width: png.width, height: png.height };
}

/** Luminance at one pixel. Out-of-range reads return 0 rather than `NaN`. */
export function at(field: LumaField, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= field.width || y >= field.height) return 0;
  return field.values[y * field.width + x];
}

export async function bootAt(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await settleBoot(page);
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
}

/**
 * The luminance of the ground the scene is drawn on: the nearest painted
 * background-color at or above the section, falling back to the document.
 */
export async function groundLuminance(page: Page, section: string): Promise<number> {
  const rgb = await page.evaluate((id) => {
    let node: Element | null = document.getElementById(id);
    while (node) {
      const bg = getComputedStyle(node).backgroundColor;
      const m = bg.match(/rgba?\(([^)]+)\)/);
      if (m) {
        const parts = m[1]
          .split(/[,\s/]+/)
          .filter(Boolean)
          .map(Number);
        const alpha = parts.length > 3 ? parts[3] : 1;
        if (alpha > 0.5) return [parts[0], parts[1], parts[2]] as [number, number, number];
      }
      node = node.parentElement;
    }
    const body = getComputedStyle(document.body).backgroundColor;
    const bm = body.match(/rgba?\(([^)]+)\)/);
    if (bm) {
      const p = bm[1]
        .split(/[,\s/]+/)
        .filter(Boolean)
        .map(Number);
      return [p[0], p[1], p[2]] as [number, number, number];
    }
    return [0, 0, 0] as [number, number, number];
  }, section);
  return relativeLuminance(rgb[0], rgb[1], rgb[2]);
}

/**
 * Hides everything on the page except the named scene slot and its subtree.
 * `visibility` rather than `display`: it takes no element out of flow, so the
 * slot's box does not move between the isolated capture and the real page.
 */
export async function isolateScene(page: Page, scene: string) {
  await page.evaluate((id) => {
    const style = document.createElement('style');
    style.id = 'flagship-visibility-isolate';
    style.textContent = `
      body * { visibility: hidden !important; }
      [data-scene="${id}"], [data-scene="${id}"] * { visibility: visible !important; }
    `;
    document.head.appendChild(style);
  }, scene);
}

export async function restorePage(page: Page) {
  await page.evaluate(() => {
    document.getElementById('flagship-visibility-isolate')?.remove();
  });
}

export interface Clip {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The slot's box, clamped to the viewport so `clip` is always capturable. */
export async function slotClip(page: Page, scene: string): Promise<Clip> {
  const slot = page.locator(`[data-scene="${scene}"]`);
  await slot.waitFor({ state: 'attached', timeout: 15000 });
  await slot.evaluate((el) =>
    el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior }),
  );
  await page.waitForTimeout(250);
  const box = await slot.boundingBox();
  expect(box, `${scene}: slot has no box`).not.toBeNull();
  const viewport = page.viewportSize();
  const vw = viewport?.width ?? 1440;
  const vh = viewport?.height ?? 900;
  const x = Math.max(0, Math.min(box!.x, vw - 4));
  const y = Math.max(0, Math.min(box!.y, vh - 4));
  return {
    x,
    y,
    width: Math.max(4, Math.min(box!.width, vw - x)),
    height: Math.max(4, Math.min(box!.height, vh - y)),
  };
}

/**
 * An element's viewport box, clamped the same way `slotClip` clamps the slot.
 *
 * `count()` first, because `boundingBox()` on a locator that matches nothing
 * waits out the whole actionability timeout: probing five candidate selectors
 * for a hook that does not exist yet would burn 150 s and report itself as a
 * test timeout rather than as the missing element it is.
 */
export async function elementClip(page: Page, selector: string): Promise<Clip | null> {
  if ((await page.locator(selector).count()) === 0) return null;
  const box = await page
    .locator(selector)
    .first()
    .boundingBox({ timeout: 2000 })
    .catch(() => null);
  if (!box) return null;
  const viewport = page.viewportSize();
  const vw = viewport?.width ?? 1440;
  const vh = viewport?.height ?? 900;
  const x = Math.max(0, Math.min(box.x, vw - 4));
  const y = Math.max(0, Math.min(box.y, vh - 4));
  return {
    x,
    y,
    width: Math.max(4, Math.min(box.width, vw - x)),
    height: Math.max(4, Math.min(box.height, vh - y)),
  };
}

/** The browser args every scene suite launches with: this host has no GPU. */
export const GL_ARGS = [
  '--no-sandbox',
  '--use-gl=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
];

/** Both widths every floor is asked at. A scene is not a desktop feature. */
export const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
] as const;
