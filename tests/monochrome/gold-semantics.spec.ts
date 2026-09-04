import { test, expect, type Page } from '@playwright/test';

/**
 * Gold is a claim, not decoration — asserted on the rendered page.
 *
 * `app/globals.css:16-32` writes the rule into the stylesheet itself: gold
 * appears only where a figure has a source a reader could go and check, and
 * "the moment it becomes an accent for things that merely look important, it
 * stops being evidence and becomes brass". `tests/monochrome/monochrome.spec.ts`
 * already proves the *token* half of that — no unsanctioned hue anywhere — and
 * `scripts/validate/overhaul_static_audit.mjs` proves the definition half: raw
 * gold hex lives only in `app/globals.css` and `lib/palette.ts`.
 *
 * Neither can see the semantic half. `components/MiniVicBot.tsx:1244` paints a
 * liveness dot with `var(--gold-light)` / `var(--gold)`; it references the
 * token, so both existing gates pass it, and it is still gold spent on the fact
 * that a widget is switched on rather than on a figure with a source. These
 * tests read the composited colour off the element and assert on the value, so
 * they cannot be satisfied by renaming a class or by routing the same gold
 * through a different token.
 *
 * The second rule under test is R-110's per-view budget. Six vitrine plates sit
 * in one horizontal rail and three of them carry a live URL
 * (`app/data/portfolio/vitrine.ts`), so a reader can have three saturated gold
 * marks in one viewport at once — which is three "look here"s and therefore
 * none. The design-system lock resolves this without deleting evidence: the lit
 * plate keeps `--gold`, and the recessed plates step down to `--gold-pale`. The
 * assertion is on how many *saturated* golds share a viewport, not on how many
 * gold marks exist.
 */

/** Saturated gold: the two values that read as "look here". */
const SATURATED_GOLD: [number, number, number][] = [
  [201, 168, 76], // --gold      #c9a84c
  [212, 182, 92], // --gold-light #d4b65c
];

/** Every sanctioned gold, saturated or recessive. */
const ANY_GOLD: [number, number, number][] = [
  ...SATURATED_GOLD,
  [232, 213, 163], // --gold-pale #e8d5a3
  [176, 146, 63], // --gold-dark #b0923f
];

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('[data-testid="minivic-toggle"]');
      if (!btn) return false;
      return Object.keys(btn).some(
        (key) => key.startsWith('__reactFiber') || key.startsWith('__reactProps'),
      );
    },
    { timeout: 30000 },
  );
}

async function settle(page: Page) {
  await page
    .evaluate(() => {
      const finite = document
        .getAnimations()
        .filter((a) => Number.isFinite((a.effect?.getComputedTiming().iterations ?? 1) as number))
        .map((a) => a.finished.catch(() => undefined));
      return Promise.race([
        Promise.all(finite),
        new Promise((resolve) => window.setTimeout(resolve, 3000)),
      ]).then(() => undefined);
    })
    .catch(() => undefined);
}

test.describe('R-21 / R-110 — gold means "this figure has a source"', () => {
  test('GS-01: the MiniVic liveness dot is not gold', async ({ page }) => {
    await gotoHome(page);

    const toggle = page.locator('[data-testid="minivic-toggle"]');
    await expect(toggle).toBeVisible();
    await toggle.evaluate((el: HTMLElement) => el.click());
    const panel = page.locator('[data-testid="minivic-panel"]');
    await expect(panel).toBeVisible();

    const badge = panel.getByText('MiniVic Live', { exact: true }).locator('xpath=..');
    await expect(badge, 'the "MiniVic Live" badge is the subject of this check').toBeVisible();
    const dot = badge.locator('span').first();
    await expect(dot).toBeVisible();

    const painted = await dot.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        background: cs.backgroundColor,
        color: cs.color,
        borderColor: cs.borderTopColor,
        width: cs.width,
        height: cs.height,
      };
    });
    console.log(`\n=== GS-01 MiniVic liveness dot === ${JSON.stringify(painted)}`);

    const parse = (s: string) => {
      const m = s.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
      return { rgb: [p[0], p[1], p[2]] as [number, number, number], a: p.length > 3 ? p[3] : 1 };
    };
    const goldNames = ['--gold', '--gold-light', '--gold-pale', '--gold-dark'];
    const offences: string[] = [];
    for (const [prop, value] of Object.entries(painted)) {
      const c = parse(value);
      if (!c || c.a === 0) continue;
      const hit = ANY_GOLD.findIndex(
        (g) => Math.abs(c.rgb[0] - g[0]) <= 1 && Math.abs(c.rgb[1] - g[1]) <= 1 && Math.abs(c.rgb[2] - g[2]) <= 1,
      );
      if (hit !== -1) offences.push(`${prop} = ${value} (${goldNames[hit]})`);
    }

    expect(
      offences,
      'a liveness indicator is not a figure with a source — gold on it makes the site\'s one mark mean "switched on"',
    ).toEqual([]);
  });

  for (const bp of [
    { name: '390x844 (phone)', width: 390, height: 844 },
    { name: '768x1024 (tablet)', width: 768, height: 1024 },
    { name: '1280x720 (laptop)', width: 1280, height: 720 },
    { name: '1920x1080 (desktop)', width: 1920, height: 1080 },
  ]) {
  test(`GS-02 @ ${bp.name}: at most one saturated gold mark shares a viewport in the vitrine`, async ({ page }) => {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await gotoHome(page);
    await page.locator('#vitrine').scrollIntoViewIfNeeded();
    // Each plate is taller than a laptop viewport, so aligning the section top
    // puts the live URLs — the marks under test — below the fold. Read the rail
    // where a reader reads it: with the link row centred.
    await page.evaluate(() => {
      const link = document.querySelector('#vitrine a[class*="live"]');
      link?.scrollIntoView({ block: 'center', inline: 'nearest' });
    });
    await settle(page);

    const marks = await page.evaluate((golds: number[][]) => {
      const parse = (s: string) => {
        const m = s.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
        return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
      };
      const isGold = (s: string) => {
        const c = parse(s);
        if (!c || c.a === 0) return false;
        return golds.some(
          (g) => Math.abs(c.rgb[0] - g[0]) <= 1 && Math.abs(c.rgb[1] - g[1]) <= 1 && Math.abs(c.rgb[2] - g[2]) <= 1,
        );
      };
      const props = ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor', 'fill', 'stroke'] as const;
      const out: { tag: string; cls: string; text: string; via: string }[] = [];
      const section = document.querySelector('#vitrine');
      if (!section) return out;
      for (const el of Array.from(section.querySelectorAll('*'))) {
        const box = el.getBoundingClientRect();
        if (box.width < 1 || box.height < 1) continue;
        if (box.bottom <= 0 || box.top >= window.innerHeight) continue;
        if (box.right <= 0 || box.left >= window.innerWidth) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) continue;
        for (const p of props) {
          const v = cs[p] as unknown as string;
          if (typeof v !== 'string' || !isGold(v)) continue;
          // Text colour only counts when this element actually owns text.
          if (p === 'color') {
            const owns = Array.from(el.childNodes).some(
              (n) => n.nodeType === 3 && (n.textContent || '').trim().length > 0,
            );
            if (!owns) continue;
          }
          out.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || '').toString().slice(0, 48),
            text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 48),
            via: `${p}: ${v}`,
          });
          break;
        }
      }
      return out;
    }, SATURATED_GOLD as unknown as number[][]);

    console.log(
      `\n=== GS-02 @ ${bp.name} — saturated gold marks sharing the vitrine viewport === ${marks.length}`,
    );
    for (const m of marks) console.log(`  ${m.tag}.${m.cls} "${m.text}" via ${m.via}`);

    expect(
      marks.length,
      'R-110 — one saturated gold mark per view; additional sourced marks step down to --gold-pale. ' +
        `Visible: ${marks.map((m) => `${m.tag}.${m.cls} "${m.text}" (${m.via})`).join(' | ')}`,
    ).toBeLessThanOrEqual(1);
  });
  }
});
