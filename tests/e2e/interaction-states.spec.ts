import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * Interaction-state library — the pointer-and-progress half (R-49, SC-30.1).
 *
 * The design-system lock
 * (docs/delivery/evidence/v6-20260903T195241Z/design-system-lock.md §5.2)
 * tables all 23 interactive elements and records `:active` designed on **0 of
 * 23**, loading designed on **0**, and five elements with no hover treatment at
 * all. §5.3 locks the replacement: `active` presses the control
 * (`translateY(1px) scale(0.995)` on buttons, a solid underline on text links),
 * and `loading` sets `aria-busy="true"` and draws an indeterminate rule along
 * the control's edge — no spinner, no label swap, and still present under
 * reduced motion.
 *
 * These checks compare **computed styles on the rendered element and its
 * subtree, including `::before` and `::after`** between two real pointer
 * states. Nothing here looks at a class name: a state counts as designed only
 * when the browser paints something different.
 *
 * Two guards keep the comparison honest.
 *
 *   1. The rest state is sampled twice. Any property that moved on its own
 *      between the two samples is running an animation, and is excluded — so a
 *      pulsing glow can never be mistaken for a hover treatment.
 *   2. `:active` is measured from a baseline that is *already focused and
 *      hovered*. Several controls light up on `:focus` as a side effect of the
 *      press (the Vitrine plate calls `setLit` from `onFocus`), and that is a
 *      focus state, not a press state.
 *
 * The keyboard half of the library — focus rings, the disabled treatment and
 * the cursor states — is in tests/a11y/interaction-states.spec.ts.
 *
 * Row 22 of the lock's table (the service-worker toast's Reload button) has no
 * subject here: it renders only when the worker reports a waiting update, which
 * a static export served fresh never does. It is audited statically instead, in
 * scripts/validate/interaction_state_audit.mjs.
 */

/** State signals. A designed state has to move at least one of these. */
const SIGNALS = [
  'color',
  'backgroundColor',
  'backgroundImage',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'borderTopWidth',
  'borderBottomWidth',
  'outlineStyle',
  'outlineWidth',
  'outlineColor',
  'outlineOffset',
  'boxShadow',
  'transform',
  'scale',
  'translate',
  'opacity',
  'filter',
  'textDecorationLine',
  'textDecorationStyle',
  'textDecorationColor',
  'textUnderlineOffset',
  'letterSpacing',
] as const;

/** Runs in the page: computed `SIGNALS` for the element, its subtree and their pseudo-elements. */
const SNAPSHOT = ([selector, index, signals]: [string, number, string[]]) => {
  const el = document.querySelectorAll(selector)[index] as HTMLElement | undefined;
  if (!el) return null;
  const nodes = [el, ...Array.from(el.querySelectorAll('*'))].slice(0, 60);
  const rows: Array<Record<string, string>> = [];
  for (const n of nodes) {
    for (const pseudo of [null, '::before', '::after']) {
      const s = getComputedStyle(n, pseudo);
      const row: Record<string, string> = {};
      for (const k of signals) row[k] = (s as unknown as Record<string, string>)[k];
      rows.push(row);
    }
  }
  return rows;
};

type Snapshot = Array<Record<string, string>> | null;

/** Properties that changed between two snapshots, minus those already moving on their own. */
function movedSignals(a: Snapshot, b: Snapshot, unstable: Set<string>): string[] {
  if (!a || !b) return [];
  const moved: string[] = [];
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    for (const k of SIGNALS) {
      const key = `${i}:${k}`;
      if (unstable.has(key)) continue;
      if (a[i][k] !== b[i][k]) moved.push(`[node ${i}] ${k}: ${a[i][k]} → ${b[i][k]}`);
    }
  }
  return moved;
}

function unstableKeys(a: Snapshot, b: Snapshot): Set<string> {
  const out = new Set<string>();
  if (!a || !b) return out;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    for (const k of SIGNALS) if (a[i][k] !== b[i][k]) out.add(`${i}:${k}`);
  }
  return out;
}

/**
 * Moves the real pointer onto the element and confirms the browser agrees it is
 * hovered. Playwright's centre point can land on an overlay (the hero canvas,
 * the nav backdrop), so several points inside the box are tried before giving
 * up — and giving up is an error, not a silent "no hover found".
 */
async function pointerOnto(page: Page, locator: Locator): Promise<void> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('element has no box — it is not rendered');
  const points: Array<[number, number]> = [
    [box.x + box.width / 2, box.y + box.height / 2],
    [box.x + box.width / 2, box.y + Math.min(8, box.height / 2)],
    [box.x + Math.min(12, box.width / 2), box.y + box.height / 2],
    [box.x + box.width - Math.min(12, box.width / 2), box.y + box.height / 2],
    [box.x + box.width / 2, box.y + box.height - Math.min(8, box.height / 2)],
  ];
  for (const [x, y] of points) {
    await page.mouse.move(x, y, { steps: 3 });
    await page.waitForTimeout(120);
    if (await locator.evaluate((el) => el.matches(':hover'))) return;
  }
  throw new Error('the pointer could never be placed over the element — :hover never matched');
}

async function parkPointer(page: Page) {
  await page.mouse.move(2, 2, { steps: 2 });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
  await page.waitForTimeout(250);
}

/**
 * The 23 interactive elements of lock §5.2, keyed by their row number, with the
 * DOM instance each check should use. Where an element carries a selected state
 * by default (Vitrine's first plate is `data-lit`, Skills' first filter is
 * `aria-pressed`), a later instance is used so the reading is of the state under
 * test rather than of the selection.
 */
const TABLE: Array<{ row: number; name: string; selector: string; index: number }> = [
  { row: 1, name: 'Hero primary action', selector: '[class*="Hero_primaryAction__"]', index: 0 },
  { row: 2, name: 'Hero secondary action', selector: '[class*="Hero_secondaryAction__"]', index: 0 },
  { row: 3, name: 'Hero inline link', selector: '[class*="Hero_link__"]', index: 0 },
  { row: 4, name: 'About provenance link', selector: '[class*="About_provenance__"] a', index: 0 },
  { row: 5, name: 'About dimension item', selector: '[class*="About_item__"]', index: 2 },
  { row: 6, name: 'Experience track button', selector: '[class*="Experience_trackButton__"]', index: 2 },
  { row: 7, name: 'Experience role toggle', selector: '[class*="Experience_roleToggle__"]', index: 2 },
  { row: 8, name: 'Skills filter', selector: '[class*="Skills_filter__"]', index: 1 },
  { row: 9, name: 'Bench source node', selector: '[class*="Bench_node__"]', index: 0 },
  { row: 10, name: 'Bench capability node', selector: '[class*="Bench_node__"]', index: 20 },
  { row: 11, name: 'Vitrine plate', selector: '[class*="Vitrine_plate__"]', index: 2 },
  { row: 12, name: 'Vitrine source link', selector: '[class*="Vitrine_source__"]', index: 0 },
  { row: 13, name: 'Vitrine live URL', selector: '[class*="Vitrine_live__"]', index: 0 },
  { row: 14, name: 'Listen channel link', selector: '[class*="Listen_channel__"]', index: 0 },
  /* Rows 15-17 of the lock's table no longer have a subject on this site, and
     the three replacements below stand in their place so the table still probes
     21 rendered controls rather than 18.

     The lock's row 15 was the Listen ledger's correction hashes and rows 16-17
     were the self-presentation clip's play trigger and transcript toggle. The
     clip was removed in `9733a85 feat(listen): remove the self-presentation clip
     and its disclaimer` and the ledger in the closing-section work of this same
     wave; neither element is rendered by any source file now, so an assertion
     about their hover and press states asserts nothing about this site.

     The replacements are three controls that are rendered and that the lock's
     table skipped: the two *selected* variants of elements it only probed in
     their unselected state — where a state gap is easiest to leave, and where
     this run found two — and the footer's contact link. */
  { row: 15, name: 'Skills filter (selected)', selector: '[class*="Skills_filter__"]', index: 0 },
  { row: 16, name: 'Vitrine plate (lit)', selector: '[class*="Vitrine_plate__"]', index: 0 },
  { row: 17, name: 'Footer link', selector: '[class*="Footer_link__"]', index: 0 },
  { row: 18, name: 'Nav logo', selector: '.logo', index: 0 },
  { row: 19, name: 'Nav CV chip', selector: '.nav-cv', index: 0 },
  { row: 20, name: 'Nav menu toggle', selector: '.menu-toggle', index: 0 },
  { row: 23, name: 'MiniVic launcher', selector: '[data-testid="minivic-toggle"]', index: 0 },
];

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
}

test.describe('Interaction states — hover, active and loading (R-49, SC-30.1)', () => {
  /**
   * TC-STATE-HOVER → SC-30.1, lock §5.2 (rows 5, 7, 11, 18, 20 marked missing).
   * A hover state is designed when moving the pointer onto the control changes
   * something the browser paints.
   */
  test('TC-STATE-HOVER — every interactive element has a designed hover state', async ({ page }) => {
    test.setTimeout(240000);
    await gotoHome(page);

    const offenders: string[] = [];
    const errors: string[] = [];
    for (const entry of TABLE) {
      const locator = page.locator(entry.selector).nth(entry.index);
      if ((await locator.count()) === 0) {
        errors.push(`row ${entry.row} ${entry.name}: no element matched ${entry.selector}[${entry.index}]`);
        continue;
      }
      try {
        await locator.scrollIntoViewIfNeeded({ timeout: 10000 });
        await parkPointer(page);
        const restA = (await page.evaluate(SNAPSHOT, [entry.selector, entry.index, [...SIGNALS]] as [string, number, string[]])) as Snapshot;
        await page.waitForTimeout(400);
        const restB = (await page.evaluate(SNAPSHOT, [entry.selector, entry.index, [...SIGNALS]] as [string, number, string[]])) as Snapshot;
        const unstable = unstableKeys(restA, restB);

        await pointerOnto(page, locator);
        await page.waitForTimeout(450);
        const hover = (await page.evaluate(SNAPSHOT, [entry.selector, entry.index, [...SIGNALS]] as [string, number, string[]])) as Snapshot;

        const moved = movedSignals(restB, hover, unstable);
        if (moved.length === 0) offenders.push(`row ${entry.row} — ${entry.name} (${entry.selector}[${entry.index}])`);
      } catch (err) {
        errors.push(`row ${entry.row} ${entry.name}: ${(err as Error).message.split('\n')[0]}`);
      }
    }

    expect(errors, `the hover probe could not be run on some elements:\n  - ${errors.join('\n  - ')}`).toEqual([]);
    expect(
      offenders,
      `${offenders.length} of ${TABLE.length} interactive elements paint nothing on hover:\n  - ${offenders.join('\n  - ')}`,
    ).toEqual([]);
  });

  /**
   * TC-STATE-ACTIVE → SC-30.1, lock §5.2 (`:active` designed on 0 of 23) and
   * §5.3 ("confirms the press before the state changes"). The baseline is the
   * element already focused and hovered, so a focus side effect of the mousedown
   * cannot be mistaken for a press treatment.
   */
  test('TC-STATE-ACTIVE — every interactive element has a designed pressed state', async ({ page }) => {
    test.setTimeout(240000);
    await gotoHome(page);

    const offenders: string[] = [];
    const errors: string[] = [];
    for (const entry of TABLE) {
      const locator = page.locator(entry.selector).nth(entry.index);
      if ((await locator.count()) === 0) {
        errors.push(`row ${entry.row} ${entry.name}: no element matched ${entry.selector}[${entry.index}]`);
        continue;
      }
      try {
        await locator.scrollIntoViewIfNeeded({ timeout: 10000 });
        await parkPointer(page);
        await locator.evaluate((el: HTMLElement) => el.focus({ preventScroll: true }));
        await pointerOnto(page, locator);
        await page.waitForTimeout(400);

        const baseA = (await page.evaluate(SNAPSHOT, [entry.selector, entry.index, [...SIGNALS]] as [string, number, string[]])) as Snapshot;
        await page.waitForTimeout(400);
        const baseB = (await page.evaluate(SNAPSHOT, [entry.selector, entry.index, [...SIGNALS]] as [string, number, string[]])) as Snapshot;
        const unstable = unstableKeys(baseA, baseB);

        await page.mouse.down();
        await page.waitForTimeout(350);
        const pressed = (await page.evaluate(SNAPSHOT, [entry.selector, entry.index, [...SIGNALS]] as [string, number, string[]])) as Snapshot;
        const isActive = await locator.evaluate((el) => el.matches(':active'));
        // Release the button away from the control. A mousedown and mouseup on
        // the same element is a click, and clicking down this table would open
        // the nav overlay over the launcher, swap the avatar for a <video> and
        // move the page out from under every row that follows — so the press is
        // measured and then abandoned rather than completed.
        await page.mouse.move(2, 2, { steps: 2 });
        await page.mouse.up();
        await page.waitForTimeout(150);

        if (!isActive) {
          errors.push(`row ${entry.row} ${entry.name}: the element never entered :active under a real mousedown`);
          continue;
        }
        const moved = movedSignals(baseB, pressed, unstable);
        if (moved.length === 0) offenders.push(`row ${entry.row} — ${entry.name} (${entry.selector}[${entry.index}])`);
      } catch (err) {
        errors.push(`row ${entry.row} ${entry.name}: ${(err as Error).message.split('\n')[0]}`);
      }
    }

    expect(errors, `the press probe could not be run on some elements:\n  - ${errors.join('\n  - ')}`).toEqual([]);
    expect(
      offenders,
      `${offenders.length} of ${TABLE.length} interactive elements paint nothing while pressed:\n  - ${offenders.join('\n  - ')}`,
    ).toEqual([]);
  });

  /**
   * TC-STATE-LOADING → SC-30.1, lock §5.2 (loading designed on 0 of 23) and
   * §5.3.
   *
   * The lock wrote this check against `components/sections/Listen/Avatar.tsx`,
   * which swapped its play control for a `<video preload="auto">` and showed
   * the reader nothing between the swap and the first frame. That component was
   * deleted from the site in `9733a85 feat(listen): remove the
   * self-presentation clip and its disclaimer`, after this file's red capture
   * was taken, so the subject is gone and the requirement is not.
   *
   * The clone's composer is now the one surface on this site that waits on a
   * network round trip: `components/MiniVicBot.tsx` calls the client-side brain,
   * which posts to `/api/chat`, and everything between the send and the reply is
   * a loading window with nothing to show for it. That request is held open here
   * so the window is real and long enough to observe; no code under test is
   * touched to produce it.
   *
   * The locked loading state is unchanged from what the lock wrote: `aria-busy`
   * on the region, a visible indicator that is not a spinner, and the label left
   * where it was rather than swapped.
   */
  test('TC-STATE-LOADING — the clone announces and shows that it is composing', async ({ page }) => {
    test.setTimeout(180000);

    let release: () => void = () => undefined;
    const hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    let held = false;
    await page.route('**/api/chat', async (route) => {
      held = true;
      await hold;
      await route.abort();
    });

    await gotoHome(page);

    await page.waitForFunction(
      () => {
        const btn = document.querySelector('[data-testid="minivic-toggle"]');
        return !!btn && Object.keys(btn).some((k) => k.startsWith('__reactFiber') || k.startsWith('__reactProps'));
      },
      { timeout: 30000 },
    );
    await page.locator('[data-testid="minivic-toggle"]').evaluate((el: HTMLElement) => el.click());
    const panel = page.locator('[data-testid="minivic-panel"]');
    await panel.waitFor({ state: 'visible', timeout: 15000 });

    const send = panel.locator('button[aria-label="Send message"]');
    const sendLabelBefore = await send.getAttribute('aria-label');

    await panel.locator('[data-testid="minivic-input"]').fill('How do you run a delivery?');
    await send.click();
    await page.waitForTimeout(1200);

    const state = await panel.evaluate((root) => {
      const isVisible = (el: Element) => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05 && r.width >= 1 && r.height >= 1;
      };
      const region = root.querySelector('[data-testid="minivic-loading"]');
      const indicators = region
        ? Array.from(region.querySelectorAll('*')).filter(
            (el) =>
              isVisible(el) &&
              ((el.textContent || '').trim().length > 0 || getComputedStyle(el, '::after').animationName !== 'none'),
          )
        : [];
      return {
        ariaBusyPresent: !!root.querySelector('[aria-busy="true"]'),
        indicatorCount: indicators.length,
        spinnerCount: Array.from(root.querySelectorAll('*')).filter(
          (el) => isVisible(el) && /spin/i.test(getComputedStyle(el).animationName),
        ).length,
        regionHTML: (region?.outerHTML || root.innerHTML).slice(0, 400),
      };
    });

    release();

    expect(held, 'the reply never went to the network, so there was no loading window to audit').toBe(true);
    expect(
      state.ariaBusyPresent,
      `while the reply was still being composed nothing carried aria-busy="true". The region held:\n${state.regionHTML}`,
    ).toBe(true);
    expect(
      state.indicatorCount,
      'while the reply was still being composed the panel showed the reader nothing at all',
    ).toBeGreaterThan(0);
    expect(state.spinnerCount, 'the loading state is a spinner, which R-51 forbids').toBe(0);
    expect(await send.getAttribute('aria-label'), 'the control swapped its label while loading').toBe(sendLabelBefore);
  });
});
