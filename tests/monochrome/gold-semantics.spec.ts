import { test, expect, type Page } from '@playwright/test';
import { aboutContent } from '../../app/data/portfolio/about';

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

/**
 * G-A1 / G-A2 — the About section obeys the same two rules as the rest of the
 * page: gold marks a sourced claim, and everything that is not gold is grey.
 *
 * The independent production review (artifacts/adversarial/ADV-REVIEW-20260905.md,
 * `#about`) found both halves broken in the same section. Every evidence line
 * under an answered dimension — "38 public repositories · ATO evidence harness
 * · ANZ platform migrations", "Payday Super program · Agile Kookaburras squad ·
 * PI 47-48" — was painted `var(--mist-400)`, the same grey as the caption that
 * introduces it, so the one place on the page where a claim actually names a
 * checkable source spent no gold at all (`anyGoldColorInAbout: false`). And the
 * key's role swatch was hatched with `rgb(138 143 154 / 0.34)`, a cool steel
 * whose channels differ by 16 — under the audit's 0.28 saturation ceiling, so
 * neither existing gate could see it, and still a blue hue on a monochrome page.
 *
 * CC-A1 reads the composited colour off each evidence line and, for the ones
 * that name a source, requires the gold token *and* AA contrast against the
 * pixels actually behind the text — gold that a reader cannot read is not a
 * mark. Which lines those are is read from `aboutContent` rather than written
 * down here. That matters: the first pass at the `sourced` flag graded nine of
 * ten gold on the criterion "an employer, a program, a named repository, a
 * figure from the CV", and a spec that hardcoded "at least nine" would have
 * agreed with it — the number was the thing under review. Deriving the split
 * from the data means this spec proves the *rendering* matches the grade, and
 * `tests/about_sourced_semantics.test.mjs` proves the grade itself is honest.
 * Neither can be satisfied by editing the other.
 *
 * The lines graded `false` must stay grey: grading one gold would say the site
 * can source a claim it cannot, which is the failure the caliper exists to
 * prevent.
 *
 * CC-A2 holds the hatch to zero chroma, reading the resolved
 * `background-image` rather than the source literal so a `var()` cannot hide a
 * hue behind indirection.
 */

/** Class-based, not data-attribute-based, so a missing attribute reads as a
 *  failure rather than as an empty set. */
const ABOUT_EVIDENCE = '#about p[class*="evidence"]';

/** The probe truncates each line for legible failure output; the expectations
 *  are cut the same way so the two are comparable. */
const asProbed = (text: string) => text.trim().replace(/\s+/g, ' ').slice(0, 56);

/** The expected split, read from the data the page renders — never a literal.
 *  See the header: the count was the thing under review, so a number written
 *  here would ratify whatever the data happened to say. */
const EXPECTED_SOURCED = aboutContent.dimensions
  .filter((dimension) => dimension.sourced)
  .map((dimension) => asProbed(dimension.evidence))
  .sort();
const EXPECTED_UNSOURCED = aboutContent.dimensions
  .filter((dimension) => !dimension.sourced)
  .map((dimension) => asProbed(dimension.evidence))
  .sort();

/** Mask every glyph so a screenshot shows only what sits *behind* the text. */
async function maskGlyphs(page: Page, on: boolean) {
  await page.evaluate((enable) => {
    const id = '__ga1_glyph_mask__';
    document.getElementById(id)?.remove();
    if (!enable) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent =
      '*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;' +
      'text-shadow:none!important;transition:none!important}';
    document.head.appendChild(style);
  }, on);
}

/** Decode a viewport PNG in the page and read the pixels at the given points. */
async function samplePixels(page: Page, pngB64: string, points: [number, number][]) {
  return page.evaluate(
    async ([b64, pts]) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64 as string}`;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      const scale = img.naturalWidth / window.innerWidth;
      return (pts as [number, number][]).map(([x, y]) => {
        const d = ctx.getImageData(
          Math.min(canvas.width - 1, Math.round(x * scale)),
          Math.min(canvas.height - 1, Math.round(y * scale)),
          1,
          1,
        ).data;
        return [d[0], d[1], d[2]] as [number, number, number];
      });
    },
    [pngB64, points] as const,
  );
}

const srgbChannel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const relLuminance = ([r, g, b]: [number, number, number]) =>
  0.2126 * srgbChannel(r) + 0.7152 * srgbChannel(g) + 0.0722 * srgbChannel(b);
const contrastRatio = (a: [number, number, number], b: [number, number, number]) => {
  const l1 = relLuminance(a);
  const l2 = relLuminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};
const rgbTriples = (value: string): [number, number, number][] =>
  Array.from(value.matchAll(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/g)).map(
    (m) => [Number(m[1]), Number(m[2]), Number(m[3])] as [number, number, number],
  );
const isOneOf = (c: [number, number, number], palette: [number, number, number][]) =>
  palette.some(
    (g) => Math.abs(c[0] - g[0]) <= 1 && Math.abs(c[1] - g[1]) <= 1 && Math.abs(c[2] - g[2]) <= 1,
  );

test.describe('G-A — #about spends gold on its sourced evidence and nothing else', () => {
  test.describe.configure({ timeout: 180000 });

  for (const bp of [
    { name: '1440x900 (desktop)', width: 1440, height: 900 },
    { name: '390x844 (phone)', width: 390, height: 844 },
  ]) {
    test(`CC-A1 @ ${bp.name}: every sourced About evidence line is painted in the gold token, legibly`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await gotoHome(page);

      const lines = page.locator(ABOUT_EVIDENCE);
      const count = await lines.count();
      expect(
        count,
        'the ten dimensions each print an evidence line; if this is 0 the selector, not the colour, is what broke',
      ).toBeGreaterThanOrEqual(10);

      const sourced: { text: string; color: string; ratio: number; bg: string }[] = [];
      const unsourced: { text: string; color: string }[] = [];

      for (let i = 0; i < count; i++) {
        const line = lines.nth(i);
        await line.scrollIntoViewIfNeeded();
        await settle(page);

        const probe = await line.evaluate((el) => {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return {
            text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 56),
            color: cs.color,
            isSourced: el.getAttribute('data-sourced') === 'true',
            point: [
              Math.round(r.left + Math.min(r.width * 0.25, 60)),
              Math.round(r.top + r.height / 2),
            ] as [number, number],
          };
        });

        if (!probe.isSourced) {
          unsourced.push({ text: probe.text, color: probe.color });
          continue;
        }

        await maskGlyphs(page, true);
        const png = await page.screenshot({ fullPage: false, animations: 'disabled' });
        await maskGlyphs(page, false);
        const [bg] = await samplePixels(page, png.toString('base64'), [probe.point]);
        const fgRgb = rgbTriples(probe.color)[0];
        sourced.push({
          text: probe.text,
          color: probe.color,
          bg: `rgb(${bg.join(',')})`,
          ratio: fgRgb ? Math.round(contrastRatio(fgRgb, bg) * 100) / 100 : 0,
        });
      }

      console.log(`\n=== CC-A1 @ ${bp.name} — About evidence lines ===`);
      for (const s of sourced)
        console.log(`  SOURCED   ${s.color} on ${s.bg} = ${s.ratio}:1  "${s.text}"`);
      for (const u of unsourced) console.log(`  UNSOURCED ${u.color}  "${u.text}"`);

      // Which lines carry the mark is decided in app/data/portfolio/about.ts and
      // proved honest in tests/about_sourced_semantics.test.mjs. What this spec
      // proves is that the page renders exactly that grade — no line quietly
      // gaining or losing the mark between the data and the pixels.
      expect(
        sourced.map((s) => s.text).sort(),
        'the gold lines on the page are exactly the dimensions app/data/portfolio/about.ts grades `sourced`',
      ).toEqual(EXPECTED_SOURCED);
      expect(
        unsourced.map((u) => u.text).sort(),
        'and the grey lines are exactly the ones it grades `false` — the flag drives the paint',
      ).toEqual(EXPECTED_UNSOURCED);
      expect(
        sourced.length,
        'some evidence on this page does name a checkable record; a section with no gold at all would ' +
          'mean the grade collapsed rather than corrected',
      ).toBeGreaterThan(0);

      const notGold = sourced.filter((s) => {
        const c = rgbTriples(s.color)[0];
        return !c || !isOneOf(c, SATURATED_GOLD);
      });
      expect(
        notGold.map((s) => `${s.color} "${s.text}"`),
        'gold marks a figure with a source: the evidence line under an answered dimension IS that source, ' +
          'so it takes --gold (or --gold-light), never the caption grey',
      ).toEqual([]);

      const illegible = sourced.filter((s) => s.ratio < 4.5);
      expect(
        illegible.map((s) => `${s.ratio}:1 — ${s.color} on ${s.bg} "${s.text}"`),
        'WCAG 1.4.3 AA — a mark a reader cannot read is not a mark',
      ).toEqual([]);

      const goldenLies = unsourced.filter((u) => {
        const c = rgbTriples(u.color)[0];
        return c ? isOneOf(c, ANY_GOLD) : false;
      });
      expect(
        goldenLies.map((u) => `${u.color} "${u.text}"`),
        'an evidence line that names no checkable record stays grey — never grade a claim higher than its evidence',
      ).toEqual([]);
    });
  }

  test('CC-A2: the About key hatch has zero chroma', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHome(page);
    await page.locator('#about').scrollIntoViewIfNeeded();
    await settle(page);

    const swatch = page.locator('#about [data-state="role"]').first();
    await expect(swatch, 'the key names the two states the dial can be in').toHaveCount(1);

    const painted = await swatch.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        backgroundImage: cs.backgroundImage,
        backgroundColor: cs.backgroundColor,
        borderTopColor: cs.borderTopColor,
      };
    });
    console.log(`\n=== CC-A2 role swatch === ${JSON.stringify(painted)}`);

    const offenders: string[] = [];
    for (const [prop, value] of Object.entries(painted)) {
      for (const c of rgbTriples(value)) {
        if (isOneOf(c, ANY_GOLD)) continue; // the one sanctioned hue
        const mx = Math.max(...c);
        const mn = Math.min(...c);
        if (mx <= 24) continue; // near-black: hue is imperceptible
        if (mx - mn > 2) offenders.push(`${prop}: rgb(${c.join(' ')})`);
      }
    }

    expect(
      offenders,
      'monochrome greys and white only — the hatch was a cool steel rgb(138 143 154), a blue hue under ' +
        "the audit's saturation ceiling and therefore invisible to every other gate",
    ).toEqual([]);
  });
});

/**
 * G-E2 — #experience spends gold on a sourced employer, and budgets it.
 *
 * The section used to teach the site's evidence language with no gold at all.
 * G-E2 (ADV-1451Z P1) gives the employer strings graded `sourced`
 * (`app/data/portfolio/experience.ts`, the same allow-list as
 * `tests/about_sourced_semantics.test.mjs`) the mark — but eight employers sit
 * in one chart, so the same per-view rule the vitrine and skills hold applies:
 * one saturated "look here", not eight. The sourced employers are recessed
 * `--gold-pale` at rest and step up to saturated `--gold` only under the active
 * or open row.
 *
 * These two tests read the composited colour off the page, so they cannot be
 * satisfied by renaming a class: GE-01 holds the saturated budget at rest, and
 * GE-02 holds that every gold pixel sits on a `[data-sourced]` employer and
 * none on a date.
 */
const EXPERIENCE_SATURATED_BUDGET = 1;

test.describe('G-E2 — #experience gold marks a sourced employer, once per view', () => {
  test('GE-01: at rest at most one saturated gold employer shares the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHome(page);
    await page.locator('#experience').scrollIntoViewIfNeeded();
    await settle(page);

    const saturated = await page.evaluate((gold: number[]) => {
      const parse = (s: string) => {
        const m = String(s).match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
        return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
      };
      const isGold = (s: string) => {
        const c = parse(s);
        if (!c || c.a === 0) return false;
        return (
          Math.abs(c.rgb[0] - gold[0]) <= 1 &&
          Math.abs(c.rgb[1] - gold[1]) <= 1 &&
          Math.abs(c.rgb[2] - gold[2]) <= 1
        );
      };
      const section = document.querySelector('#experience');
      if (!section) return -1;
      let count = 0;
      for (const el of Array.from(section.querySelectorAll('[data-sourced]'))) {
        const box = el.getBoundingClientRect();
        if (box.width < 1 || box.height < 1) continue;
        if (box.bottom <= 0 || box.top >= window.innerHeight) continue;
        if (isGold(getComputedStyle(el).color)) count += 1;
      }
      return count;
    }, SATURATED_GOLD[0] as unknown as number[]);

    expect(
      saturated,
      'R-110 — one saturated gold mark per view; sourced employers rest at --gold-pale',
    ).toBeLessThanOrEqual(EXPERIENCE_SATURATED_BUDGET);
  });

  test('GE-02: gold in #experience sits only on a sourced employer, never a date', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHome(page);
    await page.locator('#experience').scrollIntoViewIfNeeded();
    await settle(page);

    const offenders = await page.evaluate((golds: number[][]) => {
      const parse = (s: string) => {
        const m = String(s).match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
        return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
      };
      const isGold = (s: string) => {
        const c = parse(s);
        if (!c || c.a === 0) return false;
        return golds.some(
          (g) =>
            Math.abs(c.rgb[0] - g[0]) <= 1 &&
            Math.abs(c.rgb[1] - g[1]) <= 1 &&
            Math.abs(c.rgb[2] - g[2]) <= 1,
        );
      };
      const props = ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor', 'fill', 'stroke'] as const;
      const out: string[] = [];
      const section = document.querySelector('#experience');
      if (!section) return ['#experience is missing'];
      for (const el of Array.from(section.querySelectorAll('*'))) {
        const cs = getComputedStyle(el);
        for (const p of props) {
          if (!isGold(cs[p] as unknown as string)) continue;
          if (!(el as HTMLElement).closest('[data-sourced]')) {
            out.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().slice(0, 40)} via ${p}`);
          }
          break;
        }
      }
      return out;
    }, ANY_GOLD as unknown as number[][]);

    expect(
      offenders,
      `gold outside a sourced employer (a date must never be gold): ${offenders.join(' | ')}`,
    ).toEqual([]);
  });
});
