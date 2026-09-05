import { expect, test, type Page } from '@playwright/test';

/**
 * hero-fold.spec.ts — the first viewport is a composition, not a CV.
 *
 * Binding source: artifacts/kanban/tasks/t_g_h1.md (ADV-FAIL P0, G-H1). An
 * independent reviewer measured the first fold at 1440×900 on build 9ba97a5c
 * and found 21 text-bearing leaf nodes, four paragraphs over twelve words, six
 * calls to action in three groups, the three-figure ledger at y=535 with
 * fifteen caliper marks, the availability line at y=840, and a dominant visual
 * covering 11.4% of the frame. The verdict was "a CV dump, not a cinematic
 * composition".
 *
 * The budget this file enforces, at 1440×900, 1280×800, 834×1194 and 390×844:
 *
 *   · one `<h1>` in the fold — the name;
 *   · at most one paragraph longer than twelve words — the statement, which is
 *     the pitch (the role and the location are kickers, both under six words);
 *   · one call-to-action group — "See the evidence" + "Download CV", both
 *     wholly inside the fold, and no third link OR BUTTON beside them;
 *   · at most eight text-bearing leaves in total;
 *   · the ledger and the availability/links line start at or below 100vh —
 *     they are MOVED, never deleted (R7; CT-10 still asserts `#hero ul li` ×3
 *     with 92 / $5M+ / 10k+ and their sources);
 *   · the stage — the WebGL slot and the gradient that stands in for it —
 *     covers at least 90% of the fold: the visual is the fold, not a band in it;
 *   · at 1280 and wider the photograph is met in the first screen.
 *
 * Nothing here reads a CSS-module hash. The hero exposes three test ids
 * (`hero-fold`, `hero-proof`, `hero-actions`, `hero-availability`) so the
 * contract survives a restyle.
 */

const HERO = '#hero';
const FOLD = '[data-testid="hero-fold"]';
const PROOF = '[data-testid="hero-proof"]';
const ACTIONS = '[data-testid="hero-actions"]';
const AVAILABILITY = '[data-testid="hero-availability"]';
const PORTRAIT_IMG = '[data-testid="hero-portrait"] img';
/** The Scene slot: the hero's one decorative direct child. */
const STAGE = '#hero > div[aria-hidden="true"]';

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

const VIEWPORTS = [
  { label: '1440×900', width: 1440, height: 900 },
  { label: '1280×800', width: 1280, height: 800 },
  { label: '834×1194', width: 834, height: 1194 },
  { label: '390×844', width: 390, height: 844 },
] as const;

async function settle(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator(`${HERO} h1`).waitFor({ state: 'visible', timeout: 15000 });
  // The entrance is a CSS animation with staggered delays; the last step lands
  // well inside a second. Wait it out so every box is measured at rest.
  await page.waitForTimeout(1600);
}

/** Area of the part of `box` that falls inside the first `foldHeight` pixels. */
function foldArea(box: Box, viewportWidth: number, foldHeight: number): number {
  const left = Math.max(0, box.x);
  const right = Math.min(viewportWidth, box.x + box.width);
  const top = Math.max(0, box.y);
  const bottom = Math.min(foldHeight, box.y + box.height);
  if (right <= left || bottom <= top) return 0;
  return (right - left) * (bottom - top);
}

test.describe('Hero — the first fold', () => {
  test.describe.configure({ timeout: 90000 });

  for (const vp of VIEWPORTS) {
    test.describe(`at ${vp.label}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test(`TC-FOLD-01: one headline, one sentence, one action group at ${vp.label}`, async ({
        page,
      }) => {
        await settle(page);
        const fold = await page.evaluate(() => window.innerHeight);

        // ── one headline ──────────────────────────────────────────────────
        const headings = await page
          .locator(`${HERO} h1, ${HERO} h2, ${HERO} h3`)
          .evaluateAll(
            (els, limit) =>
              els
                .map((el) => el.getBoundingClientRect())
                .filter((r) => r.top < limit && r.height > 0).length,
            fold,
          );
        expect(headings, 'exactly one heading inside the fold').toBe(1);

        // ── one sentence ──────────────────────────────────────────────────
        const longParagraphs = await page.locator(`${HERO} p`).evaluateAll(
          (els, limit) =>
            els
              .filter((el) => {
                const r = el.getBoundingClientRect();
                return r.top < limit && r.height > 0;
              })
              .map((el) => (el.textContent ?? '').trim().split(/\s+/).filter(Boolean).length)
              .filter((words) => words > 12),
          fold,
        );
        expect(
          longParagraphs.length,
          `paragraphs over twelve words in the fold (word counts: ${longParagraphs.join(', ')})`,
        ).toBeLessThanOrEqual(1);

        // ── one CTA group ─────────────────────────────────────────────────
        const actions = await page.locator(ACTIONS).boundingBox();
        expect(actions, 'the action group is laid out').not.toBeNull();
        expect(
          actions!.y + actions!.height,
          'the action group ends inside the fold',
        ).toBeLessThanOrEqual(fold);
        await expect(page.locator(`${ACTIONS} a[href="#experience"]`)).toBeVisible();
        await expect(page.locator(`${ACTIONS} a[href$=".pdf"]`)).toBeVisible();

        // …and it is the ONLY group: no other link is reachable in the fold.
        const foldLinks = await page.locator(`${HERO} a`).evaluateAll(
          (els, limit) =>
            els
              .filter((el) => {
                const r = el.getBoundingClientRect();
                return r.top < limit && r.height > 0 && r.width > 0;
              })
              .map((el) => (el.textContent ?? '').trim()),
          fold,
        );
        expect(
          foldLinks.sort(),
          `links inside the fold: ${foldLinks.join(' | ')}`,
        ).toEqual(['Download CV', 'See the evidence']);

        // ── the text budget ───────────────────────────────────────────────
        // Text-bearing leaves: elements that own a non-empty text node.
        const leaves = await page.locator(`${HERO} *`).evaluateAll(
          (els, limit) =>
            els
              .filter((el) => {
                const r = el.getBoundingClientRect();
                if (!(r.top < limit && r.height > 0 && r.width > 0)) return false;
                return Array.from(el.childNodes).some(
                  (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim().length > 0,
                );
              })
              .map((el) => (el.textContent ?? '').trim().slice(0, 40)),
          fold,
        );
        expect(
          leaves.length,
          `text-bearing leaves in the fold:\n  ${leaves.join('\n  ')}`,
        ).toBeLessThanOrEqual(8);
      });

      /**
       * TC-FOLD-04 — the reviewer's instrument, as a gate.
       *
       * The independent adversarial re-probe of live `9b864752`
       * (docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/
       * 08-adversarial-review.md) counted calls to action as
       * `a[href], button` inside `#hero` whose box intersects the first
       * viewport, grouped by the nearest ancestor carrying a `data-testid`
       * (falling back to the parent's class). By that definition the fold
       * held TWO groups at 834 and 390 — `hero-actions` and a
       * `Play the portrait` button stamped on the photograph — and at 1440
       * and 1280 the single group it found was the portrait toggle, with
       * `hero-actions` below the first screen entirely.
       *
       * TC-FOLD-01 could not catch either: it counted `#hero a` only, so a
       * `<button>` was invisible to it, and it allowed the action group to end
       * exactly at the fold edge. This test uses the reviewer's definition
       * verbatim and adds the correction's margins: the action group ends at
       * least 40 px above the fold, and the ledger starts at least 40 px below
       * it. A layout that satisfies both has daylight on either side rather
       * than a one-pixel pass.
       */
      test(`TC-FOLD-04: one CTA group, with margin, at ${vp.label}`, async ({ page }) => {
        await settle(page);
        const fold = await page.evaluate(() => window.innerHeight);

        const probe = await page.evaluate(() => {
          const hero = document.querySelector('#hero')!;
          const limit = window.innerHeight;
          const inFold = (el: Element) => {
            const r = el.getBoundingClientRect();
            return r.top < limit && r.bottom > 0 && r.width > 0 && r.height > 0;
          };
          const groups = new Map<string, string[]>();
          for (const el of Array.from(hero.querySelectorAll('a[href], button')).filter(inFold)) {
            const parent = el.parentElement;
            const key =
              parent?.dataset?.testid ||
              parent?.className?.toString?.() ||
              'ROOT';
            if (!groups.has(key)) groups.set(key, []);
            groups
              .get(key)!
              .push(
                ((el as HTMLElement).innerText || el.getAttribute('aria-label') || '').trim(),
              );
          }
          const rect = (sel: string) => {
            const el = hero.querySelector(sel);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { top: r.top, bottom: r.bottom };
          };
          return {
            groups: Array.from(groups.entries()).map(([group, items]) => ({ group, items })),
            actions: rect('[data-testid="hero-actions"]'),
            ledger: rect('ul'),
          };
        });

        const described = probe.groups
          .map((g) => `${g.group} → ${g.items.join(' + ')}`)
          .join(' | ');

        expect(probe.groups.length, `CTA groups inside the fold: ${described}`).toBe(1);
        expect(probe.groups[0].group, 'the one group in the fold is hero-actions').toBe(
          'hero-actions',
        );
        expect(probe.groups[0].items.sort(), `its members: ${described}`).toEqual([
          'Download CV',
          'See the evidence',
        ]);

        expect(probe.actions, 'the action group is laid out').not.toBeNull();
        expect(
          probe.actions!.bottom,
          `the action group ends ${Math.round(fold - probe.actions!.bottom)} px above the fold`,
        ).toBeLessThanOrEqual(fold - 40);

        expect(probe.ledger, 'the ledger is laid out').not.toBeNull();
        expect(
          probe.ledger!.top,
          `the ledger starts ${Math.round(probe.ledger!.top - fold)} px below the fold`,
        ).toBeGreaterThanOrEqual(fold + 40);
      });

      test(`TC-FOLD-02: the evidence sits below the fold at ${vp.label}`, async ({ page }) => {
        await settle(page);
        const fold = await page.evaluate(() => window.innerHeight);

        // The ledger is not deleted — it is moved. It still resolves, still
        // carries three figures and their sources (CT-10), and it starts at or
        // below 100vh, inside #hero and before #about.
        const ledger = page.locator(`${HERO} ul`);
        await expect(ledger).toHaveCount(1);
        await expect(page.locator(`${HERO} ul li`)).toHaveCount(3);
        const ledgerBox = await ledger.boundingBox();
        expect(ledgerBox, 'the ledger is laid out').not.toBeNull();
        expect(ledgerBox!.y, 'the ledger starts at or below the fold').toBeGreaterThanOrEqual(fold);

        const availability = await page.locator(AVAILABILITY).boundingBox();
        expect(availability, 'the availability line is laid out').not.toBeNull();
        expect(
          availability!.y,
          'the availability line starts at or below the fold',
        ).toBeGreaterThanOrEqual(fold);

        // Both live in the proof band, which is part of #hero and precedes #about.
        const proof = await page.locator(PROOF).boundingBox();
        expect(proof, 'the proof band is laid out').not.toBeNull();
        expect(proof!.y, 'the proof band starts at or below the fold').toBeGreaterThanOrEqual(fold);
        const about = await page.locator('#about').boundingBox();
        expect(about, '#about is laid out').not.toBeNull();
        expect(proof!.y, 'the proof band precedes #about').toBeLessThan(about!.y);
      });

      test(`TC-FOLD-03: the visual is the fold at ${vp.label}`, async ({ page }) => {
        await settle(page);
        const fold = await page.evaluate(() => window.innerHeight);

        // The fold band itself is one screen tall — never one and a bit.
        const foldBox = await page.locator(FOLD).boundingBox();
        expect(foldBox, 'the fold band is laid out').not.toBeNull();
        expect(foldBox!.y, 'the fold band starts at the top of the page').toBeLessThanOrEqual(2);
        expect(foldBox!.height, 'the fold band is at least one screen').toBeGreaterThanOrEqual(
          fold * 0.95,
        );
        expect(foldBox!.height, 'the fold band is at most one screen').toBeLessThanOrEqual(
          fold * 1.12,
        );

        // The stage — the GL slot, and the gradient that stands in for it on
        // the no-WebGL path — covers the fold rather than sitting in a band.
        const stage = await page.locator(STAGE).first().boundingBox();
        expect(stage, 'the stage is laid out').not.toBeNull();
        const covered = foldArea(stage!, vp.width, fold) / (vp.width * fold);
        expect(
          covered,
          `the stage covers ${(covered * 100).toFixed(1)}% of the fold`,
        ).toBeGreaterThanOrEqual(0.9);

        if (vp.width >= 1280) {
          const photo = await page.locator(PORTRAIT_IMG).boundingBox();
          expect(photo, 'the photograph is laid out').not.toBeNull();
          const shown = foldArea(photo!, vp.width, fold) / (photo!.width * photo!.height);
          expect(
            shown,
            `${(shown * 100).toFixed(1)}% of the photograph is inside the fold`,
          ).toBeGreaterThanOrEqual(0.6);
        }
      });
    });
  }
});
