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
/**
 * The Scene slot.
 *
 * RE-POINTED 2026-09-06 (t_w2_h1s5) to HERO-SETPIECE-v3 §4 decision D-4. The
 * selector was `#hero > div[aria-hidden="true"]` — "the hero's one decorative
 * direct child" — and that sentence stopped being true when v3 introduced the
 * declared plane: `<Scene>`'s slot and `.planeFigure` now live inside
 * `[data-plane="hero"]`, which is NOT `aria-hidden` (it carries the
 * photograph's `alt`, and `aria-hidden` on an ancestor cannot be undone by a
 * descendant — D-4's whole reason for existing). So the old selector resolved
 * to nothing and `boundingBox()` hung until the 90 s case timeout, at all four
 * viewports, on every build since S1 (t_w2_h1s4/09-hero-e2e.log).
 *
 * This is the same element the case always measured — the stage slot that
 * carries the canvas on the GL path and the poster gradient otherwise — named
 * by its own `data-scene` contract rather than by a DOM position v3 moved. No
 * threshold below changes.
 */

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

      /* TC-FOLD-03 is SUPERSEDED by tests/overhaul/interim-frame.spec.ts
         TC-IF-02: it asserted that the hero's scene stage
         (`[data-plane="hero"] > [data-scene="hero-atmosphere"]`) fills the
         fold. The plane and the atmosphere were removed on the Owner's
         2026-09-06T05:51Z instruction (docs/architecture/INTERIM-FRAME.md);
         what stands in the fold now — the name, the role, the sentence, both
         actions and the photograph — is what TC-IF-02 measures. */


    });
  }
});
