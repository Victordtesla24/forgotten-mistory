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
