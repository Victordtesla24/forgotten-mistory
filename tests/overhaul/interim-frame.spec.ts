import { test, expect, type Page } from '@playwright/test';
import { PNG } from 'pngjs';

import { gotoHome, settleBoot } from '../helpers/boot';

/**
 * TC-IF-01…10 — the interim frame.
 *
 * Binding source: `artifacts/kanban/INBOX/OWNER-DIRECTIVE-20260906T0529Z.md`
 * §Escalation (Owner, 2026-09-06T05:51Z) and `docs/architecture/INTERIM-FRAME.md`.
 * The hero atmosphere, its poster still, the declared plane, the bloom under the
 * photograph, every opaque plate behind a run of copy, and the About compass and
 * its shader field are removed. What is left has to be *disciplined*, not empty:
 * this file is the contract that says what "disciplined" means, and it replaces
 * every contract that asserted one of the removed elements (the table in
 * INTERIM-FRAME.md maps each superseded case to the case here that took it on).
 *
 * The frame, in ten measurements:
 *
 *   01  no canvas and no declared scene/plane node in #hero or #about
 *   02  the first fold carries the name, the role, the sentence, both actions
 *       and the photograph — with no filter on the photograph and no opaque
 *       plate behind the name
 *   03  the hero ground is near-black: ≤ 0.03 relative luminance at nine sample
 *       points away from the type and the photograph
 *   04  every text node in #hero and #about clears 4.5:1 against its own ground
 *   05  #about prints the heading, both lede paragraphs, the provenance line and
 *       ten rows — seven with an evidence line, three with an open caliper
 *   06  ?gl=force: 0 page errors, and still 0 canvases in #hero / #about
 *   07  prefers-reduced-motion renders the same frame (≤ 0.5 % of pixels differ)
 *   08  every colour declared inside #hero / #about is achromatic, except the
 *       elements that carry the gold claim
 *   09  the three ledger figures render below the fold with their caliper marks
 *   10  the MiniVic launcher still takes a first-fold click at 390
 *
 * Both paths are measured where the measurement can differ between them: the
 * default load (no WebGL asked for) and `?gl=force`. A number taken only on a
 * GPU is not evidence for the reader who never gets one.
 */

/** The four gate viewports, in the brief's order. */
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 834, height: 1194 },
  { width: 390, height: 844 },
] as const;

/** ≤ 0.03 relative luminance — the interim ground (task t_w3_rm1, TC-IF-03). */
const GROUND_LUMA_MAX = 0.03;
/** WCAG AA for body text. */
const CONTRAST_MIN = 4.5;
/** A colour is "chromatic" once its sRGB channels differ by this much. */
const CHROMA_FLOOR = 8;
/** TC-IF-07 — the reduced-motion frame is the same frame. */
const REDUCED_MOTION_DIFF_MAX = 0.005;

function relativeLuminance(r: number, g: number, b: number): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

async function settle(page: Page): Promise<void> {
  await gotoHome(page);
  await settleBoot(page);
}

for (const viewport of VIEWPORTS) {
  const size = `${viewport.width}x${viewport.height}`;

  test.describe(`TC-IF @ ${size} — the interim frame`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    /* ── 01 ───────────────────────────────────────────────────────────────
       The removal itself. `Scene` renders `[data-scene]` and the hero's plane
       rendered `[data-plane]`; neither may exist in these two sections, on the
       default path or any other, and no canvas may mount inside them. */
    test(`TC-IF-01 @ ${size} — no canvas, no scene slot and no plane in #hero or #about`, async ({
      page,
    }) => {
      await settle(page);

      for (const section of ['#hero', '#about']) {
        expect(await page.locator(`${section} canvas`).count(), `${section} canvas`).toBe(0);
        expect(
          await page.locator(`${section} [data-scene]`).count(),
          `${section} [data-scene]`,
        ).toBe(0);
        expect(
          await page.locator(`${section} [data-plane]`).count(),
          `${section} [data-plane]`,
        ).toBe(0);
      }
    });

    /* ── 02 ───────────────────────────────────────────────────────────────
       The fold is the words and the photograph. Every one of the five is in the
       first screen; the photograph carries no CSS filter and no backdrop
       filter; and no ancestor of the H1 paints an opaque ground of its own —
       the page's own ground is the only ground. */
    test(`TC-IF-02 @ ${size} — name, role, sentence, both actions and the photograph, no filter and no plate`, async ({
      page,
    }) => {
      await settle(page);

      const fold = viewport.height;
      const measured = await page.evaluate(() => {
        const box = (selector: string) => {
          const el = document.querySelector(selector);
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          return { top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
        };
        const media = document.querySelector(
          '[data-testid="hero-portrait"] img, [data-testid="hero-portrait"] video',
        ) as HTMLElement | null;
        const mediaStyle = media ? getComputedStyle(media) : null;

        // Every ancestor of the H1 up to the section: does any of them paint an
        // opaque ground of its own? The section's own ground is allowed — it is
        // the page's ground — everything above it is a plate.
        const h1 = document.querySelector('#hero h1');
        const plates: { tag: string; cls: string; background: string }[] = [];
        let node: HTMLElement | null = h1 as HTMLElement | null;
        while (node && node.id !== 'hero') {
          const cs = getComputedStyle(node);
          const alpha = /rgba?\([^)]*?,\s*([0-9.]+)\s*\)$/.exec(cs.backgroundColor);
          const opaque =
            cs.backgroundColor !== 'transparent' &&
            cs.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
            (alpha === null || Number(alpha[1]) > 0.02);
          const shadow = cs.boxShadow && cs.boxShadow !== 'none';
          if (opaque || shadow) {
            plates.push({
              tag: node.tagName.toLowerCase(),
              cls: node.className.toString(),
              background: `${cs.backgroundColor} / ${cs.boxShadow}`,
            });
          }
          node = node.parentElement;
        }
        const h1Style = h1 ? getComputedStyle(h1 as HTMLElement) : null;

        return {
          name: box('#hero h1'),
          role: box('#hero [class*="role"]'),
          statement: box('#hero [class*="statement"]'),
          actions: box('[data-testid="hero-actions"]'),
          actionCount: document.querySelectorAll('[data-testid="hero-actions"] a').length,
          figure: box('[data-testid="hero-portrait"]'),
          mediaTag: media ? media.tagName.toLowerCase() : null,
          mediaFilter: mediaStyle ? mediaStyle.filter : null,
          mediaBackdrop: mediaStyle ? mediaStyle.backdropFilter : null,
          plates,
          h1Background: h1Style ? h1Style.backgroundColor : null,
          h1Shadow: h1Style ? h1Style.boxShadow : null,
        };
      });

      for (const [label, rect] of [
        ['name', measured.name],
        ['role', measured.role],
        ['sentence', measured.statement],
        ['actions', measured.actions],
        ['photograph', measured.figure],
      ] as const) {
        expect(rect, `${label} is rendered`).not.toBeNull();
        expect(rect!.height, `${label} has height`).toBeGreaterThan(0);
        expect(
          rect!.bottom,
          `${label} stands in the first fold (bottom ${rect!.bottom} of ${fold})`,
        ).toBeLessThanOrEqual(fold + 1);
      }

      expect(measured.actionCount, 'both actions').toBe(2);
      expect(measured.mediaTag, 'the photograph is an img or a video').not.toBeNull();
      expect(measured.mediaFilter, 'no CSS filter on the photograph').toBe('none');
      expect(['none', ''], 'no backdrop filter on the photograph').toContain(
        measured.mediaBackdrop ?? 'none',
      );
      expect(
        measured.plates,
        `no plate behind the name (${JSON.stringify(measured.plates)})`,
      ).toEqual([]);
      expect(measured.h1Shadow, 'the name carries no box-shadow plate').toBe('none');
    });

    /* ── 03 ───────────────────────────────────────────────────────────────
       The ground is black. Nine points on a 3x3 lattice inside the fold, each
       nudged away from the type and the photograph: every one of them must be
       at or below 0.03 relative luminance. A single point would be a point; the
       lattice is what makes the claim about the frame. */
    test(`TC-IF-03 @ ${size} — the hero ground is ≤ ${GROUND_LUMA_MAX} at nine points`, async ({
      page,
    }) => {
      await settle(page);

      const boxes = await page.evaluate(() => {
        const rects: { x: number; y: number; w: number; h: number }[] = [];
        const hero = document.querySelector('#hero');
        if (!hero) return rects;
        const walker = document.createTreeWalker(hero, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        let node = walker.nextNode();
        while (node) {
          if ((node.textContent ?? '').trim().length > 0) {
            range.selectNodeContents(node);
            for (const r of Array.from(range.getClientRects())) {
              if (r.width > 0 && r.height > 0) {
                rects.push({ x: r.x, y: r.y, w: r.width, h: r.height });
              }
            }
          }
          node = walker.nextNode();
        }
        for (const selector of ['[data-testid="hero-portrait"]', 'nav', '[data-minivic]']) {
          for (const el of Array.from(document.querySelectorAll(selector))) {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) rects.push({ x: r.x, y: r.y, w: r.width, h: r.height });
          }
        }
        return rects;
      });

      const shot = PNG.sync.read(await page.screenshot({ type: 'png' }));
      const samples: { x: number; y: number; luma: number }[] = [];
      const occupied = (x: number, y: number) =>
        boxes.some(
          (b) => x >= b.x - 12 && x <= b.x + b.w + 12 && y >= b.y - 12 && y <= b.y + b.h + 12,
        );

      for (let row = 1; row <= 3; row += 1) {
        for (let col = 1; col <= 3; col += 1) {
          let x = Math.round((viewport.width * col) / 4);
          let y = Math.round((viewport.height * row) / 4);
          // Walk out along the row until the point is clear of every text rect,
          // the photograph and the chrome. If nothing on the row is clear the
          // sample stands where it is and the assertion speaks for it.
          for (let step = 0; step < 40 && occupied(x, y); step += 1) {
            x = (x + 17) % (viewport.width - 4);
            if (x < 4) x = 4;
          }
          const idx = (shot.width * Math.min(y, shot.height - 1) + Math.min(x, shot.width - 1)) << 2;
          samples.push({
            x,
            y,
            luma: relativeLuminance(shot.data[idx], shot.data[idx + 1], shot.data[idx + 2]),
          });
        }
      }

      console.log(`[TC-IF-03] ${size} samples`, JSON.stringify(samples));
      for (const sample of samples) {
        expect(
          sample.luma,
          `ground at (${sample.x}, ${sample.y}) is ${sample.luma.toFixed(4)}`,
        ).toBeLessThanOrEqual(GROUND_LUMA_MAX);
      }
    });

    /* ── 04 ───────────────────────────────────────────────────────────────
       Every run of type in the two sections clears AA against the ground it is
       actually drawn on. The ground is read from the composited pixels around
       the run rather than from a declared token, because a declared token is
       not what a reader sees. */
    test(`TC-IF-04 @ ${size} — every text node in #hero / #about clears ${CONTRAST_MIN}:1`, async ({
      page,
    }) => {
      await settle(page);

      const runs = await page.evaluate(() => {
        const out: { text: string; colour: string; x: number; y: number; w: number; h: number }[] =
          [];
        for (const section of ['#hero', '#about']) {
          const root = document.querySelector(section);
          if (!root) continue;
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          const range = document.createRange();
          let node = walker.nextNode();
          while (node) {
            const text = (node.textContent ?? '').trim();
            const parent = node.parentElement;
            if (text.length > 0 && parent) {
              const cs = getComputedStyle(parent);
              if (cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05) {
                range.selectNodeContents(node);
                const r = range.getBoundingClientRect();
                if (r.width > 1 && r.height > 1) {
                  out.push({
                    text: text.slice(0, 40),
                    colour: cs.color,
                    x: r.x,
                    y: r.y,
                    w: r.width,
                    h: r.height,
                  });
                }
              }
            }
            node = walker.nextNode();
          }
        }
        return out;
      });

      expect(runs.length, 'the two sections print type').toBeGreaterThan(10);

      const page_ = page;
      const shot = PNG.sync.read(
        await page_.screenshot({ type: 'png', fullPage: true, animations: 'disabled' }),
      );
      const scrollY = await page.evaluate(() => window.scrollY);

      const failures: string[] = [];
      for (const run of runs) {
        const px = Math.round(Math.min(Math.max(run.x - 4, 1), shot.width - 2));
        const py = Math.round(
          Math.min(Math.max(run.y + run.h / 2 + scrollY, 1), shot.height - 2),
        );
        const idx = (shot.width * py + px) << 2;
        const ground = relativeLuminance(shot.data[idx], shot.data[idx + 1], shot.data[idx + 2]);
        const rgb = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(run.colour);
        if (!rgb) continue;
        const ink = relativeLuminance(Number(rgb[1]), Number(rgb[2]), Number(rgb[3]));
        const ratio = (Math.max(ink, ground) + 0.05) / (Math.min(ink, ground) + 0.05);
        if (ratio < CONTRAST_MIN) {
          failures.push(`"${run.text}" ${run.colour} on ${ground.toFixed(4)} = ${ratio.toFixed(2)}:1`);
        }
      }
      expect(failures, `runs under AA: ${failures.join(' · ')}`).toEqual([]);
    });

    /* ── 05 ───────────────────────────────────────────────────────────────
       #about is its content, and nothing else: the heading, both paragraphs of
       lede, the line that says where the ten come from, and the ten themselves
       — seven answered with their evidence line, three with an open caliper
       that says why there is nothing to measure. */
    test(`TC-IF-05 @ ${size} — the heading, the lede, the provenance line and the ten rows`, async ({
      page,
    }) => {
      await settle(page);

      const about = page.locator('#about');
      await expect(about.locator('h2')).toBeVisible();

      const shape = await page.evaluate(() => {
        const root = document.querySelector('#about')!;
        const rows = Array.from(root.querySelectorAll('ol > li'));
        return {
          heading: (root.querySelector('h2')?.textContent ?? '').trim(),
          ledeCount: Array.from(root.querySelectorAll('header p')).filter(
            (p) => (p.textContent ?? '').trim().length > 40,
          ).length,
          provenance: Array.from(root.querySelectorAll('header a')).map((a) =>
            (a.textContent ?? '').trim(),
          ),
          rowCount: rows.length,
          rowsWithHeading: rows.filter((li) => li.querySelector('h3')).length,
          rowsWithEvidence: rows.filter(
            (li) => (li.querySelector('p:last-of-type')?.textContent ?? '').trim().length > 0,
          ).length,
          openCalipers: rows.filter((li) => li.querySelector('[class*="caliper"][data-state="open"]')).length,
          canvases: root.querySelectorAll('canvas').length,
          svgs: root.querySelectorAll('svg').length,
        };
      });

      expect(shape.heading.length, 'the About heading prints').toBeGreaterThan(0);
      expect(shape.ledeCount, 'two paragraphs of lede').toBeGreaterThanOrEqual(2);
      expect(shape.provenance.length, 'the dimensions name their source').toBeGreaterThan(0);
      expect(shape.rowCount, 'ten dimensions').toBe(10);
      expect(shape.rowsWithHeading, 'ten named dimensions').toBe(10);
      expect(shape.rowsWithEvidence, 'ten evidence lines').toBe(10);
      expect(shape.openCalipers, 'three open calipers on the role-side dimensions').toBe(3);
      expect(shape.canvases, 'no canvas in #about').toBe(0);
    });

    /* ── 08 ───────────────────────────────────────────────────────────────
       Monochrome, read off the computed styles rather than off the pixels: the
       photograph is a greyscale raster and a pixel sweep would be a test of the
       encoder, not of the design. Every colour a rule in these two sections
       declares — ink, ground, rule, fill, stroke — is achromatic, except the
       elements that carry the site's one gold claim. */
    test(`TC-IF-08 @ ${size} — every declared colour in #hero / #about is achromatic but the gold claim`, async ({
      page,
    }) => {
      await settle(page);

      const chromatic = await page.evaluate((floor) => {
        const parse = (value: string) => {
          const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/.exec(value);
          if (!m) return null;
          const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
          const alpha = m[4] === undefined ? 1 : Number(m[4]);
          return { chroma: Math.max(r, g, b) - Math.min(r, g, b), alpha };
        };
        const gold = getComputedStyle(document.documentElement)
          .getPropertyValue('--gold')
          .trim()
          .toLowerCase();
        const out: { section: string; tag: string; prop: string; value: string }[] = [];
        for (const section of ['#hero', '#about']) {
          const root = document.querySelector(section);
          if (!root) continue;
          for (const el of Array.from(root.querySelectorAll('*'))) {
            const cs = getComputedStyle(el as Element);
            // The gold claim declares itself: the caliper mark and the sourced
            // evidence line are the only elements allowed to be chromatic.
            const claims =
              (el as HTMLElement).dataset.sourced === 'true' ||
              (el as HTMLElement).closest('[class*="caliper"][data-state]') !== null ||
              (el as HTMLElement).closest('[data-sourced="true"]') !== null;
            for (const prop of [
              'color',
              'backgroundColor',
              'borderTopColor',
              'borderRightColor',
              'borderBottomColor',
              'borderLeftColor',
              'fill',
              'stroke',
            ] as const) {
              const value = cs[prop];
              const parsed = parse(String(value));
              if (!parsed || parsed.alpha < 0.05) continue;
              if (parsed.chroma < floor) continue;
              if (claims) continue;
              out.push({
                section,
                tag: `${el.tagName.toLowerCase()}.${(el as HTMLElement).className}`.slice(0, 60),
                prop,
                value: String(value),
              });
            }
          }
        }
        return { out, gold };
      }, CHROMA_FLOOR);

      expect(
        chromatic.out,
        `chromatic declarations outside the gold claim: ${JSON.stringify(chromatic.out).slice(0, 800)}`,
      ).toEqual([]);
    });

    /* ── 09 ───────────────────────────────────────────────────────────────
       The evidence is unchanged: the three figures print below the fold, each
       still carrying its self-reported caliper. The removal touched the light,
       never the claims. */
    test(`TC-IF-09 @ ${size} — the ledger prints below the fold with its caliper marks`, async ({
      page,
    }) => {
      await settle(page);

      const ledger = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('#hero ul li'));
        return items.map((li) => {
          const rect = li.getBoundingClientRect();
          const caliper = li.querySelector('[class*="caliper"][data-state]') as HTMLElement | null;
          return {
            text: (li.textContent ?? '').trim().slice(0, 40),
            top: rect.top + window.scrollY,
            state: caliper?.dataset.state ?? null,
          };
        });
      });

      expect(ledger.length, 'three figures').toBe(3);
      for (const row of ledger) {
        expect(row.state, `${row.text} carries a caliper`).toBe('self-reported');
        expect(row.top, `${row.text} is below the fold`).toBeGreaterThanOrEqual(viewport.height);
      }
    });
  });
}

/* ── 06 ─────────────────────────────────────────────────────────────────────
   The removal holds on the path that used to mount the scenes. `?gl=force` is
   the switch the site's own capability gate reads; with the components deleted
   there is nothing left to force, and forcing it must still raise no error. */
test.describe('TC-IF-06 — ?gl=force raises nothing and mounts nothing', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('TC-IF-06 — 0 page errors and 0 canvases in #hero / #about under ?gl=force', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/?gl=force');
    await settleBoot(page);
    await page.waitForTimeout(1200);

    expect(await page.locator('#hero canvas').count(), '#hero canvas').toBe(0);
    expect(await page.locator('#about canvas').count(), '#about canvas').toBe(0);
    expect(errors, `page errors: ${errors.join(' · ')}`).toEqual([]);
  });
});

/* ── 07 ─────────────────────────────────────────────────────────────────────
   With nothing animating behind the words, the reduced-motion frame and the
   default frame are the same picture. The entrance is a CSS fade either way, so
   the comparison is taken after both have settled. */
test.describe('TC-IF-07 — reduced motion renders the same frame', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('TC-IF-07 — ≤ 0.5 % of the hero differs between the two paths', async ({ browser }) => {
    const shoot = async (reduced: boolean) => {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        reducedMotion: reduced ? 'reduce' : 'no-preference',
      });
      const page = await context.newPage();
      await gotoHome(page);
      await settleBoot(page);
      await page.waitForTimeout(1500);
      const buffer = await page.locator('#hero').screenshot({ type: 'png', animations: 'disabled' });
      await context.close();
      return PNG.sync.read(buffer);
    };

    const plain = await shoot(false);
    const reduced = await shoot(true);

    expect(reduced.width, 'same width').toBe(plain.width);
    expect(reduced.height, 'same height').toBe(plain.height);

    let differing = 0;
    for (let i = 0; i < plain.data.length; i += 4) {
      const dr = Math.abs(plain.data[i] - reduced.data[i]);
      const dg = Math.abs(plain.data[i + 1] - reduced.data[i + 1]);
      const db = Math.abs(plain.data[i + 2] - reduced.data[i + 2]);
      if (dr > 8 || dg > 8 || db > 8) differing += 1;
    }
    const fraction = differing / (plain.width * plain.height);
    console.log(`[TC-IF-07] differing fraction = ${fraction.toFixed(5)}`);
    expect(fraction, `${(fraction * 100).toFixed(2)} % of the hero differs`).toBeLessThanOrEqual(
      REDUCED_MOTION_DIFF_MAX,
    );
  });
});

/* ── 10 ─────────────────────────────────────────────────────────────────────
   G-MV1 is not this slice's to change: the launcher is reachable and pressable
   in the first fold at 390, exactly as TC-MV-CLICK-01 has it. Restated here
   because the fold's composition changed underneath it. */
test.describe('TC-IF-10 — the MiniVic launcher still takes a first-fold click at 390', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('TC-IF-10 — the launcher is visible and takes a click in the first fold', async ({
    page,
  }) => {
    await settle(page);

    const launcher = page.locator('[data-testid="minivic-toggle"]').first();
    await expect(launcher).toBeVisible();

    const box = await launcher.boundingBox();
    expect(box, 'the launcher has a box').not.toBeNull();
    expect(box!.y, 'the launcher stands in the first fold').toBeLessThan(844);

    const hit = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="minivic-toggle"]') as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { inside: el.contains(top) || top === el, tag: top?.tagName ?? null };
    });
    expect(hit, 'the launcher is in the DOM').not.toBeNull();
    expect(hit!.inside, `the launcher takes its own click (top element ${hit!.tag})`).toBe(true);
  });
});

/* ═════════════════════════════════════════════════════════════════════════════
   TC-IF-11…21 — the interim frame, continued: Experience, Skills, Vitrine,
   Listen.

   Binding source: `artifacts/kanban/tasks/t_w3_rm2.md` and
   `docs/architecture/INTERIM-FRAME.md` §5. The career strata field, the sticky
   career descent stage, the skills bench plate, the vitrine cabinet light and
   its six traced drawings, and the listen beat field are removed. What has to
   survive removal is every fact those decorations stood behind — and that is
   what this block measures. It replaces, by name, every contract that asserted
   one of those fields (the table in INTERIM-FRAME.md §6 maps each one here).

   The frame's second half, in eleven measurements:

     11  no canvas and no declared scene node in #experience, #skills,
         #vitrine or #listen
     12  Experience: heading, date range, lede, eight role rows whose bar
         widths are the real durations to within 2 %, three sourced figures
         with caliper marks and five open brackets
     13  Skills: the calibration card's tested/untested split reads, with no
         proficiency bar and no canvas
     14  Vitrine: six cards, each with title, description, the three metrics,
         its limits and its source — and the rail still reachable by keyboard
     15  Listen: the four routes, the synthetic-introduction label and the
         agenda action, unchanged
     16  the ground under all four sections is ≤ 0.03 relative luminance at
         nine sample points each
     17  every text node in the four sections clears 4.5:1 on the ground it is
         actually drawn on
     18  ?gl=force: 0 page errors, and no canvas anywhere on the page but
         MiniVic's own
     19  prefers-reduced-motion renders the same four sections
     20  every colour declared inside the four sections is achromatic, except
         the elements that carry the gold claim
     21  MiniVic is untouched: the launcher opens and the dock is reachable
   ════════════════════════════════════════════════════════════════════════════ */

/** The four sections this slice strips, in page order. */
const TAIL_SECTIONS = ['#experience', '#skills', '#vitrine', '#listen'] as const;

/** Scroll a section into view and let its own entry beats finish. */
async function reveal(page: Page, section: string): Promise<void> {
  await page.locator(section).scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
}

for (const viewport of VIEWPORTS) {
  const size = `${viewport.width}x${viewport.height}`;

  test.describe(`TC-IF (tail) @ ${size} — Experience, Skills, Vitrine, Listen`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    /* ── 11 ───────────────────────────────────────────────────────────────
       The removal itself. `Scene` renders `[data-scene]`; after this slice
       none of the four sections declares one, and no canvas mounts inside
       them on any path. */
    test(`TC-IF-11 @ ${size} — no canvas and no scene slot in the four tail sections`, async ({
      page,
    }) => {
      await settle(page);

      for (const section of TAIL_SECTIONS) {
        await reveal(page, section);
        expect(await page.locator(`${section} canvas`).count(), `${section} canvas`).toBe(0);
        expect(
          await page.locator(`${section} [data-scene]`).count(),
          `${section} [data-scene]`,
        ).toBe(0);
      }
      // The sticky descent stage went with the field it held.
      expect(await page.locator('[data-descent-stage]').count(), 'descent stage').toBe(0);
      expect(await page.locator('[data-descent-band]').count(), 'descent band').toBe(0);
    });

    /* ── 12 ───────────────────────────────────────────────────────────────
       "Sixteen years, to scale" is a falsifiable claim, and this is where it
       is falsified: every bar's rendered width is checked against the role's
       real duration on the section's own sixteen-year axis. 2 % of the track
       is the tolerance — sub-pixel rounding and the 0.6 % minimum-width floor
       the shortest role sits on. */
    test(`TC-IF-12 @ ${size} — the heading, the derivation, the lede and eight role bars drawn to scale`, async ({
      page,
    }) => {
      await settle(page);
      await reveal(page, '#experience');

      await expect(page.locator('#experience-title')).toBeVisible();
      // The claim's own arithmetic is printed inside the claim.
      const title = (await page.locator('#experience-title').innerText()).trim();
      expect(title.length, 'the heading prints').toBeGreaterThan(4);
      expect(/20\d\d/.test(title), `the derivation states its dates (${title})`).toBe(true);

      // The bars mount collapsed and are measured out once a third of the
      // chart is on screen. Wait for that beat to commit — a bar read mid-
      // transform is 0 px wide and would be graded "off scale" for a reason
      // that has nothing to do with the scale.
      await page.locator('#experience [data-track-field]').scrollIntoViewIfNeeded();
      await page
        .locator('#experience [data-track-field][data-entered]')
        .waitFor({ state: 'attached', timeout: 15000 });
      await page.waitForTimeout(1400);

      const rows = page.locator('#experience [class*="trackRow"]');
      expect(await rows.count(), 'eight role rows').toBe(8);

      // Every bar's width as a fraction of the track, beside the duration the
      // row prints for itself. The bar is the only encoding of the career on
      // the page; the readout beside it is the same number in words.
      const measured = await page.evaluate(() => {
        const out: { years: string; width: number; track: number }[] = [];
        for (const row of Array.from(document.querySelectorAll('#experience [class*="trackRow"]'))) {
          const bar = row.querySelector('[class*="trackBar"]') as HTMLElement | null;
          const years = row.querySelector('[class*="trackYears"]') as HTMLElement | null;
          const line = row.querySelector('[class*="trackLine"]') as HTMLElement | null;
          if (!bar || !years || !line) continue;
          // `offsetWidth`, not the painted rect: the entry beat draws the bar
          // with `scaleX`, and a transformed rect is the animation's width, not
          // the bar's. The layout width is the percentage of the axis the
          // chart declared, which is the thing "to scale" is a claim about.
          out.push({
            years: (years.textContent ?? '').trim(),
            width: bar.offsetWidth,
            track: line.offsetWidth,
          });
        }
        return out;
      });
      expect(measured.length, 'eight bars measured').toBe(8);

      // The axis the chart declares for itself: 2010 → now, from the data.
      const span = await page.evaluate(() => {
        const ticks = Array.from(document.querySelectorAll('#experience [class*="axisTick"]'))
          .map((t) => Number((t.textContent ?? '').trim()))
          .filter((n) => Number.isFinite(n) && n > 1990);
        return ticks.length > 0 ? Math.min(...ticks) : null;
      });
      expect(span, 'the axis prints its earliest year').not.toBeNull();
      const now = new Date().getFullYear() + new Date().getMonth() / 12;
      const axisYears = now - span!;

      const drift: string[] = [];
      for (const bar of measured) {
        const match = /^([\d.]+)\s*(yr|mo)$/.exec(bar.years);
        if (!match) {
          drift.push(`unreadable duration "${bar.years}"`);
          continue;
        }
        const years = match[2] === 'mo' ? Number(match[1]) / 12 : Number(match[1]);
        const expected = years / axisYears;
        const actual = bar.track > 0 ? bar.width / bar.track : 0;
        // The floor the chart applies so a three-month role is still a bar.
        if (expected < 0.006) continue;
        if (Math.abs(actual - expected) > 0.02) {
          drift.push(
            `"${bar.years}" drew ${(actual * 100).toFixed(2)}% of the track, ` +
              `${(expected * 100).toFixed(2)}% expected`,
          );
        }
      }
      expect(drift, `bars off scale: ${drift.join(' · ')}`).toEqual([]);

      // Three roles state a figure; the other five print an open bracket, and
      // neither grade may drift into the other.
      const sourcedFigures = await page
        .locator('#experience [data-state="self-reported"]')
        .count();
      const openBrackets = await page.locator('#experience [data-state="open"]').count();
      expect(sourcedFigures, 'three roles carry a stated figure').toBe(3);
      expect(openBrackets, 'five roles carry an open bracket').toBe(5);
    });

    /* ── 13 ───────────────────────────────────────────────────────────────
       The calibration card. No proficiency bar has ever been allowed here
       (CLAUDE.md §4); with the bench plate gone the split has to read on the
       flat ground, from the DOM alone. */
    test(`TC-IF-13 @ ${size} — the calibration card reads, with no bar and no canvas`, async ({
      page,
    }) => {
      await settle(page);
      await reveal(page, '#skills');

      await expect(page.locator('#skills')).toBeVisible();
      const text = await page.locator('#skills').innerText();
      expect(text.trim().length, '#skills prints its card').toBeGreaterThan(200);

      // Tested and untested are both named — the card's whole point is the
      // split, and a card that printed only one half would be a claim.
      expect(/production/i.test(text), 'the card names what was measured in production').toBe(true);

      // No proficiency bar: nothing in the section may declare a width-driven
      // meter, and there is no canvas left to draw one either.
      expect(await page.locator('#skills canvas').count(), '#skills canvas').toBe(0);
      const meters = await page.locator('#skills [role="progressbar"], #skills progress, #skills meter').count();
      expect(meters, 'no proficiency meter').toBe(0);

      // The wires are SVG and survive the removal — the drawing never depended
      // on the field behind it.
      expect(await page.locator('#skills svg').count(), 'the bench still draws its wires').toBeGreaterThan(0);
    });

    /* ── 14 ───────────────────────────────────────────────────────────────
       Six of thirty-eight. Every card keeps its title, its description, its
       three metrics, its limits and its source; the drawing panel that stood
       between the description and the metrics is gone, and the rail is still
       a keyboard-reachable horizontal scroller. */
    test(`TC-IF-14 @ ${size} — six cards with their limits and sources, no drawing panel`, async ({
      page,
    }) => {
      await settle(page);
      await reveal(page, '#vitrine');

      const cards = page.locator('#vitrine [aria-roledescription="plate"]');
      expect(await cards.count(), 'six repository cards').toBe(6);

      for (let i = 0; i < 6; i += 1) {
        const card = cards.nth(i);
        const body = (await card.innerText()).trim();
        expect(body.length, `card ${i} prints`).toBeGreaterThan(80);
        expect(/limits/i.test(body), `card ${i} prints its limits`).toBe(true);
        expect(
          await card.locator('a[href^="https://github.com"]').count(),
          `card ${i} links its source`,
        ).toBeGreaterThan(0);
        expect(await card.locator('dl dt').count(), `card ${i} prints its metrics`).toBeGreaterThan(
          0,
        );
      }

      // No canvas, and no traced drawing frame.
      expect(await page.locator('#vitrine canvas').count(), '#vitrine canvas').toBe(0);
      expect(await page.locator('#vitrine svg[class*="drawing" i]').count(), 'no drawing').toBe(0);

      // Keyboard reach: focus the first card and step right with the arrow the
      // rail binds. The rail must move.
      await cards.first().focus();
      const before = await page.locator('#vitrine ol[role="list"]').evaluate((el) => el.scrollLeft);
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(600);
      const after = await page.locator('#vitrine ol[role="list"]').evaluate((el) => el.scrollLeft);
      const focused = await page.evaluate(
        () => document.activeElement?.getAttribute('aria-roledescription') ?? null,
      );
      expect(
        after > before || focused === 'plate',
        `the rail answers the keyboard (scrollLeft ${before} → ${after}, focus ${focused})`,
      ).toBe(true);
    });

    /* ── 15 ───────────────────────────────────────────────────────────────
       Four ways to reach him, plus the synthetic introduction labelled as one.
       The beat field is gone; not one route, and not the agenda action, may go
       with it. */
    test(`TC-IF-15 @ ${size} — four routes, the synthetic-introduction label and the agenda action`, async ({
      page,
    }) => {
      await settle(page);
      await reveal(page, '#listen');

      const routes = page.locator(
        '#listen a[href^="mailto:"], #listen a[href^="tel:"], #listen a[href^="https://"]',
      );
      const hrefs = await routes.evaluateAll((els) =>
        els.map((el) => (el as HTMLAnchorElement).href),
      );
      const kinds = {
        email: hrefs.filter((h) => h.startsWith('mailto:')).length,
        phone: hrefs.filter((h) => h.startsWith('tel:')).length,
        linkedin: hrefs.filter((h) => h.includes('linkedin.com')).length,
        github: hrefs.filter((h) => h.includes('github.com')).length,
      };
      expect(kinds.email, 'a mailto route').toBeGreaterThan(0);
      expect(kinds.phone, 'a tel route').toBeGreaterThan(0);
      expect(kinds.linkedin, 'a LinkedIn route').toBeGreaterThan(0);
      expect(kinds.github, 'a GitHub route').toBeGreaterThan(0);

      const text = await page.locator('#listen').innerText();
      // The synthetic introduction is labelled by the one figure the closing
      // instrument can honestly measure: its own length, printed from the
      // generated envelope rather than typed (LISTEN-FLAGSHIP.md §2 C5). The
      // reading is the label, and it must still be there with the field that
      // sat behind it removed.
      const reading = /(\d+\.\d{2})\s*s\b/.exec(text);
      expect(reading, `the introduction's measured length prints (${text.slice(0, 200)})`).not.toBeNull();
      expect(Number(reading![1]), 'the reading is a real duration').toBeGreaterThan(0);

      // The action the section closes on. Unchanged by this slice.
      expect(
        /20-minute-call agenda/i.test(text),
        `the agenda action prints (${text.slice(0, 200)})`,
      ).toBe(true);

      expect(await page.locator('#listen canvas').count(), '#listen canvas').toBe(0);
    });

    /* ── 16 ───────────────────────────────────────────────────────────────
       The ground the four sections stand on, sampled where no type and no
       chrome is drawn: near-black, the same floor the hero holds. */
    test(`TC-IF-16 @ ${size} — the tail ground is ≤ ${GROUND_LUMA_MAX} at nine points a section`, async ({
      page,
    }) => {
      await settle(page);

      for (const section of TAIL_SECTIONS) {
        await reveal(page, section);

        const boxes = await page.evaluate((sel) => {
          const rects: { x: number; y: number; w: number; h: number }[] = [];
          const root = document.querySelector(sel);
          if (!root) return rects;
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          const range = document.createRange();
          let node = walker.nextNode();
          while (node) {
            if ((node.textContent ?? '').trim().length > 0) {
              range.selectNodeContents(node);
              for (const r of Array.from(range.getClientRects())) {
                if (r.width > 0 && r.height > 0) {
                  rects.push({ x: r.x, y: r.y, w: r.width, h: r.height });
                }
              }
            }
            node = walker.nextNode();
          }
          // Everything that legitimately paints its own ground: the cards, the
          // bars, the rules, the chrome.
          for (const s of [
            'nav',
            '[data-minivic]',
            'svg',
            'img',
            `${sel} [aria-roledescription="plate"]`,
            `${sel} [class*="trackBar"]`,
            `${sel} [class*="gridLine"]`,
            `${sel} [class*="playhead"]`,
            `${sel} [class*="caliper"]`,
            `${sel} a`,
            `${sel} button`,
          ]) {
            for (const el of Array.from(document.querySelectorAll(s))) {
              const r = el.getBoundingClientRect();
              if (r.width > 0 && r.height > 0) {
                rects.push({ x: r.x, y: r.y, w: r.width, h: r.height });
              }
            }
          }
          return rects;
        }, section);

        const shot = PNG.sync.read(await page.screenshot({ type: 'png' }));
        const occupied = (x: number, y: number) =>
          boxes.some(
            (b) => x >= b.x - 12 && x <= b.x + b.w + 12 && y >= b.y - 12 && y <= b.y + b.h + 12,
          );

        const samples: { x: number; y: number; luma: number }[] = [];
        for (let row = 1; row <= 3; row += 1) {
          for (let col = 1; col <= 3; col += 1) {
            let x = Math.round((viewport.width * col) / 4);
            let y = Math.round((viewport.height * row) / 4);
            let clear = !occupied(x, y);
            for (let step = 0; step < 60 && !clear; step += 1) {
              x = (x + 17) % (viewport.width - 4);
              if (x < 4) x = 4;
              y = 8 + ((y + 13) % (viewport.height - 16));
              clear = !occupied(x, y);
            }
            // Every point on the sweep was occupied — there is no ground to
            // measure here, and a fabricated sample would be worse than none.
            if (!clear) continue;
            const idx =
              (shot.width * Math.min(y, shot.height - 1) + Math.min(x, shot.width - 1)) << 2;
            samples.push({
              x,
              y,
              luma: relativeLuminance(shot.data[idx], shot.data[idx + 1], shot.data[idx + 2]),
            });
          }
        }

        console.log(`[TC-IF-16] ${size} ${section}`, JSON.stringify(samples));
        expect(samples.length, `${section} has ground to sample`).toBeGreaterThan(0);
        for (const sample of samples) {
          expect(
            sample.luma,
            `${section} ground at (${sample.x}, ${sample.y}) is ${sample.luma.toFixed(4)}`,
          ).toBeLessThanOrEqual(GROUND_LUMA_MAX);
        }
      }
    });

    /* ── 17 ───────────────────────────────────────────────────────────────
       Contrast on the flat ground. The fields used to light these sections
       from behind and every contrast number was taken against a moving
       shader; now the ground is one colour and the measurement is honest. */
    test(`TC-IF-17 @ ${size} — every text node in the four sections clears ${CONTRAST_MIN}:1`, async ({
      page,
    }) => {
      await settle(page);

      const failures: string[] = [];
      const counted: Record<string, number> = {};
      for (const section of TAIL_SECTIONS) {
        await reveal(page, section);

        // The ground is the run's own effective background: the first ancestor
        // that paints one, alpha-composited down the chain onto the page's own
        // ground. Not a composited screenshot pixel — with every field removed
        // there is no shader behind the type any more, and a pixel read is now
        // only a way to be wrong: MiniVic's dock and the fixed nav paint over
        // whole runs while staying out of hit-testing, so the pixels in a run's
        // box can belong to something standing in front of it. What each run is
        // *drawn on* is the honest ground, and it is what this measures.
        const results = await page.evaluate((sel) => {
          const out: { text: string; colour: string; ground: string; ratio: number }[] = [];
          const root = document.querySelector(sel);
          if (!root) return out;

          const parse = (value: string): [number, number, number, number] | null => {
            const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(value);
            if (!m) return null;
            return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])];
          };
          const luminance = (r: number, g: number, b: number) => {
            const ch = (v: number) => {
              const c = v / 255;
              return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
            };
            return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
          };
          /** Every painted background from the element up, composited down. */
          const groundOf = (el: Element): [number, number, number] => {
            const layers: [number, number, number, number][] = [];
            let node: Element | null = el;
            while (node) {
              const rgba = parse(getComputedStyle(node).backgroundColor);
              if (rgba && rgba[3] > 0) {
                layers.push(rgba);
                if (rgba[3] === 1) break;
              }
              node = node.parentElement;
            }
            // The page's own ground closes the stack.
            const base = parse(getComputedStyle(document.body).backgroundColor);
            layers.push(base && base[3] === 1 ? base : [0, 0, 0, 1]);
            let [r, g, b] = layers[layers.length - 1].slice(0, 3) as [number, number, number];
            for (let i = layers.length - 2; i >= 0; i -= 1) {
              const [lr, lg, lb, la] = layers[i];
              r = lr * la + r * (1 - la);
              g = lg * la + g * (1 - la);
              b = lb * la + b * (1 - la);
            }
            return [r, g, b];
          };

          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          const range = document.createRange();
          let node = walker.nextNode();
          while (node) {
            const text = (node.textContent ?? '').trim();
            const parent = node.parentElement;
            if (text.length > 0 && parent) {
              const cs = getComputedStyle(parent);
              if (
                cs.visibility !== 'hidden' &&
                cs.display !== 'none' &&
                Number(cs.opacity) > 0.05 &&
                !parent.closest('[hidden]')
              ) {
                range.selectNodeContents(node);
                const r = range.getBoundingClientRect();
                if (r.width > 1 && r.height > 1) {
                  const ink = parse(cs.color);
                  if (ink) {
                    const [gr, gg, gb] = groundOf(parent);
                    // Ink drawn at less than full alpha sits over the same
                    // ground; composite it before grading it.
                    const ir = ink[0] * ink[3] + gr * (1 - ink[3]);
                    const ig = ink[1] * ink[3] + gg * (1 - ink[3]);
                    const ib = ink[2] * ink[3] + gb * (1 - ink[3]);
                    const a = luminance(ir, ig, ib);
                    const b = luminance(gr, gg, gb);
                    out.push({
                      text: text.slice(0, 40),
                      colour: cs.color,
                      ground: `rgb(${Math.round(gr)}, ${Math.round(gg)}, ${Math.round(gb)})`,
                      ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
                    });
                  }
                }
              }
            }
            node = walker.nextNode();
          }
          return out;
        }, section);

        counted[section] = results.length;
        for (const run of results) {
          if (run.ratio < CONTRAST_MIN) {
            failures.push(
              `${section} "${run.text}" ${run.colour} on ${run.ground} = ${run.ratio.toFixed(2)}:1`,
            );
          }
        }
      }

      console.log(`[TC-IF-17] ${size} runs measured`, JSON.stringify(counted));
      // A section that printed nothing would pass this vacuously.
      for (const section of TAIL_SECTIONS) {
        expect(counted[section] ?? 0, `${section} prints type`).toBeGreaterThan(4);
      }
      expect(failures, `runs under AA: ${failures.join(' · ')}`).toEqual([]);
    });

    /* ── 20 ───────────────────────────────────────────────────────────────
       Monochrome, with gold as a claim. Every colour these four sections
       declare is achromatic, except the elements that carry the claim mark:
       the sourced employer names, the caliper's closed jaws, the live
       repository URLs. */
    test(`TC-IF-20 @ ${size} — the only hue in the four sections is the gold claim, and it is never a fill`, async ({
      page,
    }) => {
      await settle(page);

      // The tokens the site declares for its one accent. Read from :root, so
      // this cannot drift from `app/globals.css`.
      const goldTokens = await page.evaluate(() => {
        const root = getComputedStyle(document.documentElement);
        return ['--gold', '--gold-light', '--gold-pale', '--gold-dark', '--gold-muted',
          '--gold-border', '--gold-veil']
          .map((name) => root.getPropertyValue(name).trim())
          .filter(Boolean);
      });
      expect(goldTokens.length, 'the gold tokens are declared in :root').toBeGreaterThan(3);

      const strays: string[] = [];
      const fills: string[] = [];
      for (const section of TAIL_SECTIONS) {
        await reveal(page, section);
        const found = await page.evaluate(
          ({ sel, floor, tokens }) => {
            const stray: string[] = [];
            const fill: string[] = [];
            const rgb = (value: string): [number, number, number, number] | null => {
              const m = /rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?/.exec(value);
              return m
                ? [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])]
                : null;
            };
            const hex = (value: string): [number, number, number, number] | null => {
              const m = /^#([0-9a-f]{6})$/i.exec(value.trim());
              return m
                ? [
                    parseInt(m[1].slice(0, 2), 16),
                    parseInt(m[1].slice(2, 4), 16),
                    parseInt(m[1].slice(4, 6), 16),
                    1,
                  ]
                : null;
            };
            const parse = (v: string) => rgb(v) ?? hex(v);
            const golds = tokens.map(parse).filter(Boolean) as [number, number, number, number][];
            const isGold = (c: [number, number, number, number]) =>
              golds.some(
                (g) =>
                  Math.abs(g[0] - c[0]) <= 2 && Math.abs(g[1] - c[1]) <= 2 && Math.abs(g[2] - c[2]) <= 2,
              );

            const root = document.querySelector(sel);
            if (!root) return { stray, fill };
            for (const el of [root, ...Array.from(root.querySelectorAll('*'))]) {
              const node = el as HTMLElement;
              const cs = getComputedStyle(node);
              const name = node.getAttribute('class') ?? '';
              for (const prop of [
                'color',
                'background-color',
                'border-top-color',
                'border-bottom-color',
                'fill',
                'stroke',
              ]) {
                const value = cs.getPropertyValue(prop);
                const c = parse(value);
                if (!c || c[3] === 0) continue;
                if (Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]) < floor) continue;
                const where = `${node.tagName.toLowerCase()}.${name.slice(0, 34)}`;
                // Rule one: gold is the only hue the page is allowed.
                if (!isGold(c)) {
                  stray.push(`${where} ${prop}=${value}`);
                  continue;
                }
                // Rule two: gold is a mark, never a fill, a background or a
                // theme (CLAUDE.md §4). A gold ground is allowed only at mark
                // scale — a swatch, a jaw, a rule — never as a panel.
                if (prop === 'background-color' && c[3] > 0.25) {
                  const r = node.getBoundingClientRect();
                  if (r.width * r.height > 24 * 24) {
                    fill.push(`${where} ${Math.round(r.width)}x${Math.round(r.height)} ${value}`);
                  }
                }
              }
            }
            return { stray, fill };
          },
          { sel: section, floor: CHROMA_FLOOR, tokens: goldTokens },
        );
        for (const item of found.stray) strays.push(`${section} ${item}`);
        for (const item of found.fill) fills.push(`${section} ${item}`);
      }

      expect(strays, `hues that are not the gold claim: ${strays.slice(0, 10).join(' · ')}`).toEqual(
        [],
      );
      expect(fills, `gold used as a fill: ${fills.slice(0, 10).join(' · ')}`).toEqual([]);
    });

  });
}

/* ── 18 ─────────────────────────────────────────────────────────────────────
   The GPU path. `?gl=force` used to mount five canvases across these four
   sections; after this slice the only canvas the page may mount anywhere is
   MiniVic's own viseme stage, and forcing WebGL must still raise nothing.
   Measured once at 1440 — a page error is not viewport-dependent. */
test.describe('TC-IF-18 — ?gl=force raises nothing and mounts no section canvas', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('TC-IF-18 — 0 page errors, and no canvas but MiniVic\'s', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/?gl=force');
    await settleBoot(page);

    for (const section of ['#experience', '#skills', '#vitrine', '#listen']) {
      await page.locator(section).scrollIntoViewIfNeeded();
      await page.waitForTimeout(900);
      expect(await page.locator(`${section} canvas`).count(), `${section} canvas`).toBe(0);
      expect(await page.locator(`${section} [data-scene]`).count(), `${section} scene`).toBe(0);
    }

    // Page-wide: every remaining canvas belongs to MiniVic.
    const strays = await page.evaluate(() =>
      Array.from(document.querySelectorAll('canvas'))
        .filter((c) => !c.closest('[data-minivic]') && !c.closest('[data-scene="minivic-viseme"]'))
        .map((c) => c.parentElement?.className?.toString().slice(0, 60) ?? 'unknown'),
    );
    expect(strays, `canvases outside MiniVic: ${strays.join(' · ')}`).toEqual([]);

    console.log('[TC-IF-18] pageerrors', JSON.stringify(errors));
    expect(errors, `page errors under ?gl=force: ${errors.join(' · ')}`).toEqual([]);
  });
});

/* ── 19 ─────────────────────────────────────────────────────────────────────
   Reduced motion renders the same four sections. Nothing in them is animation-
   dependent any more, so the two paths print the same words in the same rows —
   which is the whole of what "the frame is the content" means here. */
test.describe('TC-IF-19 — prefers-reduced-motion renders the same four sections', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('TC-IF-19 — the same text and the same row counts on both motion paths', async ({
    browser,
  }) => {
    const read = async (motion: 'no-preference' | 'reduce') => {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        reducedMotion: motion,
      });
      const page = await context.newPage();
      await gotoHome(page);
      await settleBoot(page);
      const out: Record<string, { text: string; counts: number[] }> = {};
      for (const section of ['#experience', '#skills', '#vitrine', '#listen']) {
        await page.locator(section).scrollIntoViewIfNeeded();
        await page.waitForTimeout(700);
        out[section] = {
          text: (await page.locator(section).innerText()).replace(/\s+/g, ' ').trim(),
          counts: [
            await page.locator(`${section} a`).count(),
            await page.locator(`${section} li`).count(),
            await page.locator(`${section} canvas`).count(),
          ],
        };
      }
      await context.close();
      return out;
    };

    const normal = await read('no-preference');
    const reduced = await read('reduce');

    for (const section of ['#experience', '#skills', '#vitrine', '#listen']) {
      expect(reduced[section].text, `${section} prints the same words`).toBe(normal[section].text);
      expect(reduced[section].counts, `${section} prints the same rows`).toEqual(
        normal[section].counts,
      );
    }
  });
});

/* ── 21 ─────────────────────────────────────────────────────────────────────
   MiniVic is not this slice's to change. G-MV1 — the launcher is never hidden
   below 834 — is restated here because four sections moved underneath it. The
   *click* contract is TC-MV-CLICK-01's and TC-IF-10's (at 390, where the dock
   and the fold actually compete); this case asserts only that the removal left
   the launcher mounted, visible and sized at every gate width. */
test.describe('TC-IF-21 — MiniVic is unchanged by the removal', () => {
  for (const width of [1440, 834, 390]) {
    test(`TC-IF-21 @ ${width} — the launcher is mounted, visible and hit-sized`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await settle(page);

      const launcher = page.locator('[data-testid="minivic-toggle"]').first();
      await expect(launcher, `G-MV1: the launcher is visible at ${width}`).toBeVisible();

      const box = await launcher.boundingBox();
      expect(box, `the launcher has a box at ${width}`).not.toBeNull();
      // A 44 px target is the floor the site's own a11y contract sets.
      expect(box!.width, `the launcher is hit-sized at ${width}`).toBeGreaterThanOrEqual(40);
      expect(box!.height, `the launcher is hit-sized at ${width}`).toBeGreaterThanOrEqual(40);
      expect(box!.y, `the launcher stands in the viewport at ${width}`).toBeLessThan(844);
    });
  }
});
