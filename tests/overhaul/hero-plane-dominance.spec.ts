import { test, expect } from '@playwright/test';

import type * as Instrument from '../../scripts/validate/hero_plane_dominance.mjs';

/**
 * TC-HERO-PLANE — the plane dominates the fold, as a number.
 *
 * Binding source: docs/architecture/HERO-FOLD-v2.md §3 (t_g2_h1 → t_h2_01). The
 * independent 1451Z review overturned the fold's composition — "polished hire
 * landing, not cinematic stage" — while every density clause passed. This file
 * is the acceptance that cannot be overturned by taste, because it prints the
 * derivation: ground `G`, `Σ_fold m`, `Σ_P m`, SPD, and every rect it excluded.
 *
 *   TC-HERO-PLANE-01   SPD = Σ_P m / Σ_fold m  ≥ 0.75      (PLANE-1; ship ≥ 0.78, PLANE-3)
 *   TC-HERO-PLANE-02   Σ_fold m / (W·H)        ≥ 0.045     (PLANE-2 — a black fold cannot score 1.0)
 *
 * where L is WCAG relative luminance per pixel, G is the 10th-percentile L of the
 * fold, m = max(0, L − G), the ink set I is every fold text-leaf rect + every
 * media rect (img/video/svg) + every element whose computed background-color
 * alpha ≥ 0.5, each dilated 8 px and read from the live DOM, and P = fold ∖ I.
 * The measurement lives in `scripts/validate/hero_plane_dominance.mjs` so the
 * standalone CLI (`--base <url>`) and this spec cannot disagree.
 *
 * Both gates are asked at 1440×900, 1280×800, 834×1194 and 390×844, on **both**
 * paths: `/?gl=force` with the shader settled, and the `prefers-reduced-motion`
 * still. A GPU-only number is not evidence for the reader who never gets one.
 *
 * ## Why the instrument is loaded with `import()` and not `import`
 *
 * This package is CommonJS, so Playwright transpiles the spec to CJS and routes a
 * static `import` of an `.mjs` through Node's `require(esm)` — after its own
 * `.mjs` require hook has rewritten the module to CJS. Node then compiles that
 * CJS text as an ES module: `ReferenceError: exports is not defined in ES module
 * scope`. A dynamic `import()` goes through the ESM loader, which keeps the
 * module ESM (measured: `zz-tmp-import-probe` passed 1/1 before this file was
 * written). Hence the collection-time constants below — the four widths, the
 * two paths and the launch flags — are declared here as the brief's
 * specification, and the thresholds are pinned by assertion against the module
 * so neither file can be relaxed without the other noticing.
 *
 * ## HERO_PLANE_GATE — why this spec is armed by an environment flag
 *
 * The baseline on the build this file was written against is **red by design**
 * (docs/delivery/evidence/v10-20260905T0515Z/t_h2_01/02-baseline-red.log): the
 * instrument lands first, the four composition moves (t_h2_02 … t_h2_06) land
 * after it, and each is measured against this number. Until they do, the shared
 * battery would carry a permanent, expected red — which trains everyone to
 * ignore red. So:
 *
 *   - unset             → every case is `test.skip`ped with the reason printed.
 *                         The battery stays green and nothing is silently passed.
 *   - HERO_PLANE_GATE=1 → every case runs and asserts at the real thresholds.
 *
 *     HERO_PLANE_GATE=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:5636 \
 *       npx playwright test tests/overhaul/hero-plane-dominance.spec.ts --workers=1
 *
 * The thresholds are 0.75 and 0.045 exactly. Lowering either to make a run
 * green is a violation (t_h2_01 QUALITY GATES). The flag is the one permitted
 * way to keep the battery green, and it is to be removed — the spec made
 * unconditional — in the lane that brings SPD over 0.78 on every case.
 */

const GATE = process.env.HERO_PLANE_GATE === '1';
const SKIP_REASON =
  'HERO_PLANE_GATE=1 is not set — the SPD gate is armed only once the HERO-FOLD-v2 ' +
  'moves (t_h2_02…t_h2_06) land; the baseline is red by design (t_h2_01 02-baseline-red.log)';

/** The thresholds the brief fixes. The module must agree exactly (pinned below). */
const SPD_MIN = 0.75;
const SPD_SHIP = 0.78;
const LIT_FLOOR = 0.045;

/** §3.2 — the four widths, in the brief's order. Mirrors `VIEWPORTS` in the module. */
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 834, height: 1194 },
  { width: 390, height: 844 },
] as const;

/** §3.2 — both paths. Mirrors `PATHS` in the module. */
const PATHS = [
  { id: 'gl', label: '/?gl=force (shader, settled)', url: '/?gl=force', reducedMotion: false },
  { id: 'still', label: 'prefers-reduced-motion still', url: '/', reducedMotion: true },
] as const;

/**
 * File-level, because `launchOptions` is worker-scoped and Playwright refuses it
 * inside a `describe`. SwiftShader is enabled explicitly — this host has no GPU —
 * and `--disable-lcd-text` keeps subpixel fringing out of a luminance measure.
 * Mirrors `GL_ARGS` in the module.
 */
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
  const mod = await import('../../scripts/validate/hero_plane_dominance.mjs');
  // The pin: the module's constants are the brief's, or this file refuses to
  // measure with them. A relaxed threshold cannot hide in either place.
  expect(mod.SPD_MIN, 'PLANE-1 threshold in the module').toBe(SPD_MIN);
  expect(mod.SPD_SHIP, 'PLANE-3 ship margin in the module').toBe(SPD_SHIP);
  expect(mod.LIT_FLOOR, 'PLANE-2 floor in the module').toBe(LIT_FLOOR);
  expect(mod.DILATE_PX, 'ink dilation in px').toBe(8);
  expect(mod.PLATE_ALPHA_MIN, 'plate alpha threshold').toBe(0.5);
  expect(mod.GROUND_PERCENTILE, 'ground percentile').toBe(0.1);
  expect(
    mod.VIEWPORTS.map((v) => `${v.width}x${v.height}`),
    'the module measures the same four widths',
  ).toEqual(VIEWPORTS.map((v) => `${v.width}x${v.height}`));
  expect(mod.PATHS.map((p) => p.id), 'the module measures the same two paths').toEqual(
    PATHS.map((p) => p.id),
  );
  return mod;
}

for (const viewport of VIEWPORTS) {
  const size = `${viewport.width}×${viewport.height}`;

  test.describe(`TC-HERO-PLANE @ ${size} — the plane dominates the fold`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of PATHS) {
      test(`TC-HERO-PLANE-01 @ ${size} [${route.id}] — SPD ≥ ${SPD_MIN}: the plane carries the light`, async ({
        page,
        baseURL,
      }) => {
        test.skip(!GATE, SKIP_REASON);
        test.setTimeout(120000);
        const spd = await instrument();

        const { canvases } = await spd.preparePage(page, baseURL ?? 'http://127.0.0.1:5636', route);
        if (route.reducedMotion) {
          expect(canvases, `${route.label}: reduced motion must mount no canvas`).toBe(0);
        } else {
          expect(
            canvases,
            `${route.label}: the shader must be on screen before it is measured`,
          ).toBeGreaterThan(0);
        }

        const d = await spd.measureFold(page);
        const report = spd.formatReport(`${size} ${route.label}`, d);
        // eslint-disable-next-line no-console
        console.log(report);

        expect(
          d.spd,
          `PLANE-1 fails at ${size} on ${route.label}: SPD = ${d.spd.toFixed(4)} < ${SPD_MIN} ` +
            `(ship target ${SPD_SHIP}). The ink set carries ${((1 - d.spd) * 100).toFixed(1)}% of ` +
            `the light the eye is pulled toward; the plane is not dominant.\n${report}`,
        ).toBeGreaterThanOrEqual(SPD_MIN);
      });

      /**
       * TC-HERO-PLANE-03 — the fence on the declared plane (HERO-SETPIECE-v3 §4
       * D-4). The instrument's ground chain is an exemption from the ink set,
       * and an exemption that can grow is an exemption that gets abused: the
       * moment a headline or a CTA could be moved inside `[data-plane="hero"]`,
       * SPD would be raised by hiding ink rather than by lighting the plane.
       * So the declared subtree may hold no text leaf and nothing pressable,
       * and it must actually cover the fold it is exempted over. This case is
       * **not** behind HERO_PLANE_GATE: it fences the exemption, it does not
       * measure the composition, and it must hold on every build from S1 on.
       */
      test(`TC-HERO-PLANE-03 @ ${size} [${route.id}] — the declared plane is fenced: no type, nothing pressable, ≥ 0.98 of the fold`, async ({
        page,
        baseURL,
      }) => {
        test.setTimeout(120000);
        const spd = await instrument();
        await spd.preparePage(page, baseURL ?? 'http://127.0.0.1:5636', route);

        const fence = await page.evaluate(() => {
          const W = window.innerWidth;
          const H = window.innerHeight;
          const plane = document.querySelector('[data-plane="hero"]');
          if (!plane) return null;
          const describe = (el: Element) => {
            const tag = el.tagName.toLowerCase();
            const testid = el.getAttribute('data-testid');
            if (el.id) return `${tag}#${el.id}`;
            if (testid) return `${tag}[data-testid=${testid}]`;
            const cls =
              typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean)[0] : '';
            return cls ? `${tag}.${cls}` : tag;
          };
          const texts: string[] = [];
          for (const el of Array.from(plane.querySelectorAll('*'))) {
            const owns = Array.from(el.childNodes).some(
              (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim().length > 0,
            );
            if (owns) texts.push(`${describe(el)} "${(el.textContent || '').trim().slice(0, 40)}"`);
          }
          const pressables = Array.from(
            plane.querySelectorAll('a, button, [role="button"], input, select, textarea'),
          ).map(describe);
          const r = plane.getBoundingClientRect();
          const x1 = Math.max(0, r.left);
          const y1 = Math.max(0, r.top);
          const x2 = Math.min(W, r.right);
          const y2 = Math.min(H, r.bottom);
          const covered = x2 > x1 && y2 > y1 ? (x2 - x1) * (y2 - y1) : 0;
          return { texts, pressables, coverage: covered / (W * H) };
        });

        expect(fence, `${route.label}: [data-plane="hero"] must be declared in the DOM`).not.toBeNull();
        const f = fence as { texts: string[]; pressables: string[]; coverage: number };

        expect(
          f.texts,
          `PLANE-3 fence at ${size} on ${route.label}: the declared plane may not carry type — ` +
            'the ground-chain exemption would then hide ink from the measure',
        ).toEqual([]);
        expect(
          f.pressables,
          `PLANE-3 fence at ${size} on ${route.label}: the declared plane may carry no control`,
        ).toEqual([]);
        expect(
          f.coverage,
          `PLANE-3 fence at ${size} on ${route.label}: the plane covers ${(f.coverage * 100).toFixed(
            1,
          )}% of the fold; an exemption narrower than the fold is not "the plane"`,
        ).toBeGreaterThanOrEqual(0.98);
      });

      test(`TC-HERO-PLANE-02 @ ${size} [${route.id}] — Σ_fold m / (W·H) ≥ ${LIT_FLOOR}: the frame is lit`, async ({
        page,
        baseURL,
      }) => {
        test.skip(!GATE, SKIP_REASON);
        test.setTimeout(120000);
        const spd = await instrument();

        const { canvases } = await spd.preparePage(page, baseURL ?? 'http://127.0.0.1:5636', route);
        if (route.reducedMotion) {
          expect(canvases, `${route.label}: reduced motion must mount no canvas`).toBe(0);
        } else {
          expect(
            canvases,
            `${route.label}: the shader must be on screen before it is measured`,
          ).toBeGreaterThan(0);
        }

        const d = await spd.measureFold(page);
        const report = spd.formatReport(`${size} ${route.label}`, d);
        // eslint-disable-next-line no-console
        console.log(report);

        expect(
          d.litDensity,
          `PLANE-2 fails at ${size} on ${route.label}: Σ_fold m / (W·H) = ` +
            `${d.litDensity.toFixed(4)} < ${LIT_FLOOR}. A frame this dark could score SPD 1.0 ` +
            `without being dominant; it has to be lit first.\n${report}`,
        ).toBeGreaterThanOrEqual(LIT_FLOOR);
      });
    }
  });
}
