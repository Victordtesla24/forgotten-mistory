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

/**
 * R-c8 C-08 + R-c13 CC-10 — #skills: gold is a mark, not a mass.
 *
 * The calibration card printed the same claim three times over. Twenty-nine
 * elements inside `#skills` painted saturated `--gold` at rest: fourteen bench
 * dots in a column at x=1088, fourteen status glyphs in a second column 71px
 * to their right at x=1159.6, and the legend swatch that keys them. Two
 * parallel gold columns ask a reader to learn two marks in one table, and a
 * mark repeated twenty-eight times down a page is not a mark — it is a fill,
 * which is the one thing `app/globals.css` says gold is never allowed to be.
 *
 * These tests hold the collapsed shape:
 *   · at rest at 1440, at most six elements inside `#skills` paint saturated
 *     gold (`rgb(201, 168, 76)`);
 *   · every element painting *any* sanctioned gold sits on a licensed surface —
 *     a sourced caliper, the "measured in production" mark, or a live
 *     repository URL — so recessing a mark cannot be used to smuggle gold onto
 *     something with no source behind it;
 *   · those elements form at most one vertical run, so there is one column of
 *     evidence rather than two competing ones.
 *
 * And Motion F-6, which is the same rule expressed in time: the strands are
 * dim at rest and light only under the reader's attention. Gold that is always
 * at full strength cannot get any louder when it has something to say.
 */
const SKILLS_GOLD_BUDGET = 6;

/** The surfaces the design system licenses gold to appear on. */
const LICENSED =
  '[data-caliper-state="sourced"], [class*="measuredMark"], [class*="mark"][class*="production"], a[href^="https://github.com/"]';

async function goldInSkills(page: Page, golds: [number, number, number][]) {
  return page.evaluate(
    ({ palette, licensed }: { palette: number[][]; licensed: string }) => {
      const parse = (s: string) => {
        const m = String(s).match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
        return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
      };
      const hit = (s: string) => {
        const c = parse(s);
        if (!c || c.a === 0) return -1;
        return palette.findIndex(
          (g) =>
            Math.abs(c.rgb[0] - g[0]) <= 1 &&
            Math.abs(c.rgb[1] - g[1]) <= 1 &&
            Math.abs(c.rgb[2] - g[2]) <= 1,
        );
      };
      const props = [
        'color',
        'backgroundColor',
        'borderTopColor',
        'borderRightColor',
        'borderBottomColor',
        'borderLeftColor',
        'fill',
        'stroke',
      ] as const;
      const out: { tag: string; cls: string; x: number; index: number; via: string; licensed: boolean }[] = [];
      const section = document.querySelector('#skills');
      if (!section) return out;
      for (const el of Array.from(section.querySelectorAll('*'))) {
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        const box = el.getBoundingClientRect();
        if (box.width < 0.5 && box.height < 0.5) continue;
        for (const p of props) {
          const v = cs[p] as unknown as string;
          if (typeof v !== 'string') continue;
          const index = hit(v);
          if (index === -1) continue;
          // Text colour only counts where the element actually owns text.
          if (p === 'color') {
            const owns = Array.from(el.childNodes).some(
              (n) => n.nodeType === 3 && (n.textContent || '').trim().length > 0,
            );
            if (!owns) continue;
          }
          out.push({
            tag: el.tagName.toLowerCase(),
            cls: String((el as HTMLElement).className || '').slice(0, 52),
            x: Math.round(box.x * 10) / 10,
            index,
            via: `${p}: ${v}`,
            licensed: Boolean(el.closest(licensed)),
          });
          break;
        }
      }
      return out;
    },
    { palette: golds as unknown as number[][], licensed: LICENSED },
  );
}

async function readSkills(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoHome(page);
  await page.locator('#skills').scrollIntoViewIfNeeded();
  await settle(page);
  // The bench traces itself in once; read it after it has settled, which is the
  // state a reader spends all but the first two seconds looking at.
  await page.waitForTimeout(2200);
}

test.describe('C-08 / CC-10 — the calibration card spends gold once', () => {
  test.describe.configure({ timeout: 120000 });

  test('GS-10: at most six elements paint saturated gold inside #skills at rest', async ({ page }) => {
    await readSkills(page);
    const marks = await goldInSkills(page, SATURATED_GOLD);

    console.log(`\n=== GS-10 saturated gold inside #skills @1440 === ${marks.length}`);
    for (const m of marks) console.log(`  ${m.tag}.${m.cls} x=${m.x} via ${m.via}`);

    expect(
      marks.length,
      'twenty-nine saturated gold marks down one section is a fill, not a claim. ' +
        `Painting gold: ${marks.map((m) => `${m.tag}.${m.cls} (${m.via})`).join(' | ')}`,
    ).toBeLessThanOrEqual(SKILLS_GOLD_BUDGET);
  });

  test('GS-11: every gold mark in #skills sits on a licensed surface', async ({ page }) => {
    await readSkills(page);
    const marks = await goldInSkills(page, ANY_GOLD);

    console.log(`\n=== GS-11 any-gold inside #skills @1440 === ${marks.length}`);
    for (const m of marks) console.log(`  ${m.tag}.${m.cls} x=${m.x} licensed=${m.licensed} via ${m.via}`);

    // CC-10's own ceiling: recessing a mark is a step down in value, not a
    // licence to paint more of them.
    expect(marks.length, 'CC-10 — no more than sixteen gold marks in the card').toBeLessThanOrEqual(16);

    const unlicensed = marks.filter((m) => !m.licensed);
    expect(
      unlicensed.map((m) => `${m.tag}.${m.cls} (${m.via})`),
      'gold means "this figure has a source": a sourced caliper, the measured-in-production mark, or a live repository URL',
    ).toEqual([]);
  });

  test('GS-12: the card carries one vertical run of gold, not two', async ({ page }) => {
    await readSkills(page);
    const marks = await goldInSkills(page, ANY_GOLD);

    // A "run" is two or more gold marks stacked on the same x — a column the
    // reader has to learn. One is the evidence column; two is a second mark.
    const columns = new Map<number, number>();
    for (const m of marks) {
      let key = [...columns.keys()].find((k) => Math.abs(k - m.x) <= 2);
      if (key === undefined) key = m.x;
      columns.set(key, (columns.get(key) ?? 0) + 1);
    }
    const runs = [...columns.entries()].filter(([, count]) => count >= 2);

    console.log(
      `\n=== GS-12 gold columns === ${JSON.stringify([...columns.entries()])} → ${runs.length} run(s)`,
    );

    expect(
      runs.length,
      'CC-10 — two parallel gold columns ask the reader to learn two marks in one table. ' +
        `Columns: ${runs.map(([x, count]) => `x=${x} (${count} marks)`).join(' | ')}`,
    ).toBeLessThanOrEqual(1);
  });

  test('GS-13: at rest the sourced strands are dim gold and the rest are grey', async ({ page }) => {
    await readSkills(page);

    const strands = await page.evaluate(() => {
      const paths = Array.from(document.querySelectorAll('#skills svg path[class*="wire"]'));
      return paths.map((p) => {
        const cs = getComputedStyle(p);
        const cls = p.getAttribute('class') ?? '';
        return {
          production: /production/i.test(cls) && !/nonProduction/i.test(cls),
          strokeOpacity: Number(cs.strokeOpacity),
          stroke: cs.stroke,
        };
      });
    });

    const gradientStops = await page.evaluate(() => {
      const read = (id: string) =>
        Array.from(document.querySelectorAll(`#${id} stop`)).map((s) => ({
          color: getComputedStyle(s).stopColor,
          opacity: Number(getComputedStyle(s).stopOpacity),
        }));
      return { gold: read('bench-wire-gold'), grey: read('bench-wire-grey') };
    });

    const sourced = strands.filter((s) => s.production);
    const others = strands.filter((s) => !s.production);
    console.log(
      `\n=== GS-13 strands at rest === sourced=${sourced.length} others=${others.length} ` +
        `stops=${JSON.stringify(gradientStops)}`,
    );
    console.log(`  sourced stroke-opacity: ${[...new Set(sourced.map((s) => s.strokeOpacity))].join(', ')}`);
    console.log(`  other  stroke-opacity: ${[...new Set(others.map((s) => s.strokeOpacity))].join(', ')}`);

    expect(sourced.length, 'the bench must draw the production links it exists to draw').toBeGreaterThan(0);

    // The strand is gold — it is stroked with a ramp whose body is var(--gold) —
    // but at rest that gold is spent at under a third of its strength.
    expect(
      gradientStops.gold.every((s) => s.color === 'rgb(201, 168, 76)'),
      'a sourced strand is stroked with var(--gold)',
    ).toBe(true);
    for (const s of sourced) {
      expect(s.stroke, 'sourced strands take the gold ramp').toContain('bench-wire-gold');
      expect(s.strokeOpacity, 'gold at full strength at rest has nowhere left to go on hover').toBeLessThanOrEqual(0.3);
    }
    for (const s of others) {
      expect(s.stroke, 'unsourced strands are grey, never gold').toContain('bench-wire-grey');
      expect(s.strokeOpacity).toBeCloseTo(0.35, 2);
    }
  });

  test('GS-14 (Motion F-6): hovering a capability lights its strands and recedes the rest', async ({ page }) => {
    await readSkills(page);

    const node = page.locator('#skills [data-side="capabilities"] button').first();
    await node.scrollIntoViewIfNeeded();
    await node.hover();
    await page.waitForTimeout(300); // the budget the rule gives it

    const opacities = await page.evaluate(() =>
      Array.from(document.querySelectorAll('#skills svg path[class*="wire"]')).map((p) =>
        Number(getComputedStyle(p).strokeOpacity),
      ),
    );
    console.log(`\n=== GS-14 stroke-opacity under hover === ${JSON.stringify(opacities)}`);

    expect(
      opacities.filter((o) => o >= 0.99).length,
      'the strands the hovered capability owns come to full strength within 300 ms',
    ).toBeGreaterThanOrEqual(1);
    expect(
      opacities.filter((o) => Math.abs(o - 0.18) < 0.01).length,
      'everything it does not touch falls back to 0.18 — dimmed, never deleted',
    ).toBeGreaterThanOrEqual(1);
  });

  test.describe('reduced motion', () => {
    test('GS-15: under reduced motion the strand transition is colour only', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await readSkills(page);
      const transition = await page.evaluate(() => {
        const p = document.querySelector('#skills svg path[class*="wire"]');
        if (!p) return null;
        const cs = getComputedStyle(p);
        return { property: cs.transitionProperty, animation: cs.animationName };
      });
      console.log(`\n=== GS-15 reduced-motion strand transition === ${JSON.stringify(transition)}`);

      expect(transition, 'the bench must still draw its strands under reduced motion').not.toBeNull();
      expect(
        transition!.property,
        'geometry must not move under reduced motion — only the colour changes',
      ).not.toContain('stroke-width');
      expect(transition!.property).toContain('stroke-opacity');
      expect(transition!.animation, 'and nothing traces itself in').toBe('none');
    });
  });
});
