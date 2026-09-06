import { test, expect } from '@playwright/test';

import type * as Instrument from '../../scripts/validate/hero_plane_dominance.mjs';

/**
 * TC-HERO-SET — the fold is one set piece, measured.
 *
 * Binding source: docs/architecture/HERO-SETPIECE-v3.md §8 (task t_w2_h1sa,
 * slice S1 `g2h1v3-01`). The sentence the fold exists to produce is one clause —
 * "His face is standing in the shaft of light that his name is written across" —
 * and these cases are the only way to tell whether it did, because the alternative
 * is taste, and taste is what ADV-1451Z and ADV-2315Z each overturned.
 *
 *   TC-HERO-SET-01  fold text-leaf blocks ≤ 3, exactly 1 CTA group, 0 other pressables
 *   TC-HERO-SET-02  [data-testid="hero-proof"].top ≥ innerHeight — the ledger is off the first screen
 *   TC-HERO-SET-03  the figure is inside the plane, ≤ 846 CSS px wide, and never upscaled (1480×826)
 *   TC-HERO-SET-05  no text leaf touches the face-safe box; the H1 crosses the dissolve band
 *
 * Blocks are counted inside `#hero` only: the brand mark is the navigation's,
 * not the section's, so scoping to the section and still allowing §8's three is
 * the conservative reading — the fold may carry the name and the sentence, and
 * one block of headroom that this slice does not spend.
 *
 * Every case is asked at 1440×900, 1280×800, 834×1194 and 390×844 and on both
 * paths (§8 ⇄): `/?gl=force` with the shader settled, and the
 * `prefers-reduced-motion` still. A number measured only where a GPU exists is
 * not evidence for the reader who never gets one.
 *
 * The page is prepared through the SPD instrument's own `preparePage`, so this
 * file and `hero-plane-dominance.spec.ts` cannot disagree about when the fold is
 * at rest. It is loaded with `import()` for the reason that file documents: this
 * package is CommonJS and a static import of the `.mjs` is rewritten to CJS and
 * then compiled as ESM.
 *
 * Thresholds below are §8's, exactly. Lowering one to make a run green is a
 * violation (t_w2_h1s1 QUALITY GATES).
 */

/** §8 SET-01 — brand mark, H1, statement. */
const MAX_FOLD_TEXT_BLOCKS = 3;
/** §3 FIG-CAP — 1480 device px ÷ the site's 1.75 DPR cap = 845.7 → 846. */
const FIGURE_MAX_CSS_WIDTH = 846;
/** avatar.ts — the honest still ceiling on this host; nothing is upscaled. */
const STILL_INTRINSIC = { width: 1480, height: 826 };
/** §8 SET-05 — the name has to *cross* the dissolve, not graze it. */
const MIN_DISSOLVE_OVERLAP_PX = 40;
/** §3 — the dissolve band is the figure's lower edge; the face-safe box its inner 60%. */
const DISSOLVE_BAND_FRACTION = 0.18;
const FACE_SAFE_FRACTION = 0.6;

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 834, height: 1194 },
  { width: 390, height: 844 },
] as const;

const PATHS = [
  { id: 'gl', label: '/?gl=force (shader, settled)', url: '/?gl=force', reducedMotion: false },
  { id: 'still', label: 'prefers-reduced-motion still', url: '/', reducedMotion: true },
] as const;

test.use({
  deviceScaleFactor: 1,
  launchOptions: {
    args: [
      '--no-sandbox',
      '--use-gl=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
      '--disable-lcd-text',
    ],
  },
});

async function instrument(): Promise<typeof Instrument> {
  return import('../../scripts/validate/hero_plane_dominance.mjs');
}

type Box = { x: number; y: number; w: number; h: number };

type FoldReading = {
  viewport: { w: number; h: number };
  /** One entry per element in `#hero` that owns text and paints inside the fold. */
  textBlocks: { handle: string; text: string; rects: Box[] }[];
  ctaGroups: string[];
  strayPressables: { handle: string; text: string }[];
  proofTop: number | null;
  plane: Box | null;
  figure: Box | null;
  figureNatural: { width: number; height: number } | null;
  h1: Box | null;
};

/**
 * Read the fold from the live DOM. Self-contained: it is serialised into the
 * page. "In the fold" means the rect starts above `innerHeight` — the screen the
 * reader opens on, scrolled to the top.
 */
function readFold(): FoldReading {
  const W = window.innerWidth;
  const H = window.innerHeight;

  const describe = (el: Element): string => {
    const tag = el.tagName.toLowerCase();
    const testid = el.getAttribute('data-testid');
    if (el.id) return `${tag}#${el.id}`;
    if (testid) return `${tag}[data-testid=${testid}]`;
    const cls = typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean)[0] : '';
    return cls ? `${tag}.${cls}` : tag;
  };

  const clip = (r: DOMRect | { left: number; top: number; right: number; bottom: number }): Box | null => {
    const x1 = Math.max(0, r.left);
    const y1 = Math.max(0, r.top);
    const x2 = Math.min(W, r.right);
    const y2 = Math.min(H, r.bottom);
    if (x2 <= x1 || y2 <= y1) return null;
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  };

  const painted = (el: Element): boolean => {
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
  };

  const hero = document.querySelector('#hero');
  const textBlocks: FoldReading['textBlocks'] = [];
  const ctaGroups: string[] = [];
  const strayPressables: FoldReading['strayPressables'] = [];

  if (hero) {
    for (const el of Array.from(hero.querySelectorAll('*'))) {
      const tag = el.tagName.toLowerCase();
      if (['script', 'style', 'template', 'noscript'].includes(tag)) continue;
      if (!painted(el)) continue;
      const box = clip(el.getBoundingClientRect());
      if (!box) continue;

      const ownsText = Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim().length > 0,
      );
      // The action bar's own labels are counted as the group, not as blocks:
      // §8 lists the fold's blocks as brand, H1, statement and counts the CTA
      // group separately, on its own "exactly 1" clause.
      if (ownsText && !el.closest('[data-testid="hero-actions"]')) {
        const rects: Box[] = [];
        for (const node of Array.from(el.childNodes)) {
          if (node.nodeType !== Node.TEXT_NODE || !(node.textContent || '').trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const r of Array.from(range.getClientRects())) {
            const line = clip(r);
            if (line) rects.push(line);
          }
        }
        if (rects.length === 0) rects.push(box);
        textBlocks.push({
          handle: describe(el),
          text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
          rects,
        });
      }

      if (el.matches('a, button, [role="button"], input, select, textarea')) {
        const group = el.closest('[data-testid="hero-actions"]');
        if (group) {
          const handle = describe(group);
          if (!ctaGroups.includes(handle)) ctaGroups.push(handle);
        } else {
          strayPressables.push({
            handle: describe(el),
            text: (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
          });
        }
      }
    }
  }

  const proof = document.querySelector('[data-testid="hero-proof"]');
  const planeEl = document.querySelector('[data-plane="hero"]');
  const figureEl = document.querySelector('[data-testid="hero-portrait"]');
  const img = figureEl?.querySelector('img') as HTMLImageElement | null;
  const h1El = document.querySelector('#hero h1');

  const raw = (el: Element | null): Box | null => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  };

  return {
    viewport: { w: W, h: H },
    textBlocks,
    ctaGroups,
    strayPressables,
    proofTop: proof ? proof.getBoundingClientRect().top : null,
    plane: raw(planeEl),
    figure: raw(figureEl),
    figureNatural: img ? { width: img.naturalWidth, height: img.naturalHeight } : null,
    h1: raw(h1El),
  };
}

/** Text blocks whose first rect starts inside the fold. */
function foldTextBlocks(d: FoldReading) {
  return d.textBlocks.filter((b) => b.rects.some((r) => r.y < d.viewport.h));
}

function intersect(a: Box, b: Box): Box | null {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  if (x2 <= x1 || y2 <= y1) return null;
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

for (const viewport of VIEWPORTS) {
  const size = `${viewport.width}×${viewport.height}`;

  test.describe(`TC-HERO-SET @ ${size} — the fold is one set piece`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of PATHS) {
      test(`TC-HERO-SET-01/02 @ ${size} [${route.id}] — one name, one sentence, one action group, no ledger`, async ({
        page,
        baseURL,
      }) => {
        test.setTimeout(120000);
        const spd = await instrument();
        await spd.preparePage(page, baseURL ?? 'http://127.0.0.1:5607', route);
        const d = (await page.evaluate(readFold)) as FoldReading;

        const blocks = foldTextBlocks(d);
        expect(
          blocks.length,
          `SET-01 at ${size} on ${route.label}: the fold carries ${blocks.length} text blocks — ` +
            `${blocks.map((b) => `${b.handle} "${b.text}"`).join(' | ')}`,
        ).toBeLessThanOrEqual(MAX_FOLD_TEXT_BLOCKS);

        expect(
          d.ctaGroups.length,
          `SET-01 at ${size} on ${route.label}: exactly one CTA group belongs in the fold, found ` +
            `${d.ctaGroups.join(', ') || 'none'}`,
        ).toBe(1);

        expect(
          d.strayPressables,
          `SET-01 at ${size} on ${route.label}: nothing else in #hero's first screen may be pressable`,
        ).toEqual([]);

        expect(d.proofTop, 'the proof band must exist').not.toBeNull();
        expect(
          d.proofTop as number,
          `SET-02 at ${size} on ${route.label}: the proof band starts at ${Math.round(
            d.proofTop as number,
          )} px, inside a ${d.viewport.h} px fold — the ledger is in the first screen again`,
        ).toBeGreaterThanOrEqual(d.viewport.h);
      });

      test(`TC-HERO-SET-03/05 @ ${size} [${route.id}] — the figure stands in the plane and the name crosses its dissolve`, async ({
        page,
        baseURL,
      }) => {
        test.setTimeout(120000);
        const spd = await instrument();
        await spd.preparePage(page, baseURL ?? 'http://127.0.0.1:5607', route);
        const d = (await page.evaluate(readFold)) as FoldReading;

        expect(d.plane, 'SET-03: [data-plane="hero"] must exist').not.toBeNull();
        expect(d.figure, 'SET-03: the figure must exist').not.toBeNull();
        const plane = d.plane as Box;
        const figure = d.figure as Box;

        // Containment, to the pixel a sub-pixel layout can produce.
        const eps = 1;
        expect(
          [figure.x >= plane.x - eps, figure.y >= plane.y - eps,
            figure.x + figure.w <= plane.x + plane.w + eps,
            figure.y + figure.h <= plane.y + plane.h + eps].every(Boolean),
          `SET-03 at ${size} on ${route.label}: figure ${JSON.stringify(figure)} is not inside plane ` +
            `${JSON.stringify(plane)} — the photograph is an object on the backdrop, not part of it`,
        ).toBe(true);

        expect(
          figure.w,
          `SET-03 at ${size} on ${route.label}: the figure renders ${figure.w.toFixed(1)} CSS px wide; ` +
            `above ${FIGURE_MAX_CSS_WIDTH} px the 1480 px still is upscaled at the 1.75 DPR cap`,
        ).toBeLessThanOrEqual(FIGURE_MAX_CSS_WIDTH);

        expect(
          d.figureNatural,
          `SET-03 at ${size} on ${route.label}: the still's intrinsic size is the honest ceiling`,
        ).toEqual(STILL_INTRINSIC);

        // SET-05 — the face is never written on.
        const faceSafe: Box = {
          x: figure.x + (figure.w * (1 - FACE_SAFE_FRACTION)) / 2,
          y: figure.y + (figure.h * (1 - FACE_SAFE_FRACTION)) / 2,
          w: figure.w * FACE_SAFE_FRACTION,
          h: figure.h * FACE_SAFE_FRACTION,
        };
        const trespass = foldTextBlocks(d)
          .flatMap((b) => b.rects.map((r) => ({ handle: b.handle, text: b.text, hit: intersect(r, faceSafe) })))
          .filter((t) => t.hit !== null)
          .map((t) => `${t.handle} "${t.text}"`);
        expect(
          trespass,
          `SET-05 at ${size} on ${route.label}: type is standing on the face-safe box ${JSON.stringify(faceSafe)}`,
        ).toEqual([]);

        // …and the name does cross the dissolve band.
        expect(d.h1, 'SET-05: the H1 must exist').not.toBeNull();
        const h1 = d.h1 as Box;
        const dissolve: Box = {
          x: figure.x,
          y: figure.y + figure.h * (1 - DISSOLVE_BAND_FRACTION),
          w: figure.w,
          h: figure.h * DISSOLVE_BAND_FRACTION,
        };
        const touch = intersect(h1, dissolve);
        expect(
          touch,
          `SET-05 at ${size} on ${route.label}: the H1 ${JSON.stringify(h1)} does not reach the dissolve ` +
            `band ${JSON.stringify(dissolve)} — the name and the picture read as two zones, not one surface`,
        ).not.toBeNull();
        expect(
          Math.min((touch as Box).w, 1e9),
          `SET-05 at ${size} on ${route.label}: the name overlaps the dissolve by only ` +
            `${(touch as Box).w.toFixed(1)} px of width`,
        ).toBeGreaterThanOrEqual(MIN_DISSOLVE_OVERLAP_PX);
      });
    }
  });
}
