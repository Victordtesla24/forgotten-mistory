import { test, expect, type Page } from '@playwright/test';

/**
 * Interaction-state library — the keyboard-and-pointer half (R-49, R-90, SC-30.1).
 *
 * SC-30.1 requires designed hover, focus, active, disabled, loading and empty
 * states on every interactive element, and **zero browser-default states**.
 * R-90 names an unstyled focus ring as a prohibited anti-pattern.
 *
 * The design-system lock
 * (docs/delivery/evidence/v6-20260903T195241Z/design-system-lock.md §5) tables
 * all 23 interactive elements and records: `:active` designed on 0 of 23,
 * `:disabled` on 0 of 23, three elements with no `:focus-visible` at all, and
 * `components/MiniVicBot.tsx:1199` removing a focus ring outright with
 * `focus:outline-none`. §5.3 then locks the replacement state library.
 *
 * These checks assert **computed values on rendered elements**, never the
 * presence of a class. A focus ring is only counted when the browser actually
 * paints one: an author-declared `outline-style` at ≥2px, or a box-shadow ring
 * that appears on focus and not at rest. Chromium's `outline-style: auto` is
 * the *user-agent* ring — it is what an element gets when nobody designed
 * anything — so it is counted as a failure, which is exactly what R-90 says.
 *
 * The hover / active / loading half of the same library lives in
 * tests/e2e/interaction-states.spec.ts. The static half — focus indicators
 * removed in source, bare `:focus` where `:focus-visible` is required, and the
 * missing empty-state branches — lives in
 * scripts/validate/interaction_state_audit.mjs.
 *
 * There is no preloader: `app/page.tsx` raises `body.page-ready` on the frame
 * after mount, so every navigation keys on that.
 */

const FOCUSABLE =
  'a[href], area[href], button, input:not([type="hidden"]), select, textarea, summary, iframe, [tabindex], [contenteditable="true"]';

/**
 * Injected into the page. Everything below runs in the browser, so it is
 * written as a single self-contained string of helpers plus a sweep.
 */
const SWEEP = ([selector, rootSelector]: [string, string | null]) => {
  /** Resolve any CSS colour Chromium can produce (rgb, rgba, oklab, colour-mix) to [r,g,b,a]. */
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
  function toRGBA(value: string): [number, number, number, number] {
    if (!value || value === 'none' || value === 'transparent') return [0, 0, 0, 0];
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  }
  /** Source-over composite of `fg` onto the opaque `bg`. */
  function over(
    fg: [number, number, number, number],
    bg: [number, number, number, number],
  ): [number, number, number, number] {
    const a = fg[3] + bg[3] * (1 - fg[3]);
    if (a === 0) return [0, 0, 0, 0];
    return [
      (fg[0] * fg[3] + bg[0] * bg[3] * (1 - fg[3])) / a,
      (fg[1] * fg[3] + bg[1] * bg[3] * (1 - fg[3])) / a,
      (fg[2] * fg[3] + bg[2] * bg[3] * (1 - fg[3])) / a,
      a,
    ];
  }
  function luminance([r, g, b]: [number, number, number, number]): number {
    const lin = (c: number) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }
  function contrast(
    a: [number, number, number, number],
    b: [number, number, number, number],
  ): number {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  /** The opaque colour painted behind `el`, walking up from `startAtParent`. */
  function backdrop(el: Element, startAtParent: boolean): [number, number, number, number] {
    let acc: [number, number, number, number] = [0, 0, 0, 0];
    let node: Element | null = startAtParent ? el.parentElement : el;
    while (node) {
      const bg = toRGBA(getComputedStyle(node).backgroundColor);
      acc = over(acc, bg);
      if (acc[3] >= 0.999) return acc;
      node = node.parentElement;
    }
    // Nothing opaque up the chain — fall back to the canvas colour.
    return over(acc, toRGBA(getComputedStyle(document.documentElement).backgroundColor));
  }
  function describe(el: Element): string {
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
    const name = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    const testid = el.getAttribute('data-testid');
    return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}${testid ? `[data-testid=${testid}]` : ''}${name ? ` "${name}"` : ''}`;
  }
  /**
   * Chromium serialises the same shadow colour two different ways depending on
   * which state produced it — `rgba(0, 0, 0, 0)` at rest and `oklab(0 0 0 / 0)`
   * once a focus rule has touched the property — so a raw string comparison
   * reports a "change" where nothing at all is painted. Every colour in the
   * value is resolved to rgba before comparison, and a shadow only counts as a
   * ring when at least one layer is actually opaque enough to see.
   */
  function normaliseShadow(value: string): string {
    if (!value || value === 'none') return 'none';
    return value.replace(/(?:rgba?|hsla?|oklab|oklch|color|color-mix)\([^()]*(?:\([^()]*\)[^()]*)*\)|#[0-9a-fA-F]{3,8}/g, (m) => {
      const [r, g, b, a] = toRGBA(m);
      return `rgba(${r}, ${g}, ${b}, ${Math.round(a * 1000) / 1000})`;
    });
  }
  function hasVisibleShadowLayer(normalised: string): boolean {
    const layers = normalised.match(/rgba\(\d+, \d+, \d+, ([\d.]+)\)/g) || [];
    return layers.some((l) => Number(l.match(/([\d.]+)\)$/)?.[1] ?? 0) > 0.1);
  }
  function isVisible(el: Element): boolean {
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) < 0.05) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    return !el.closest('[aria-hidden="true"],[hidden]');
  }

  const root: ParentNode = rootSelector ? (document.querySelector(rootSelector) as ParentNode) : document;
  const all = Array.from(root.querySelectorAll(selector)) as HTMLElement[];
  const candidates = all.filter(
    (el) => el.tabIndex >= 0 && !(el as HTMLButtonElement).disabled && el.getAttribute('aria-disabled') !== 'true' && isVisible(el),
  );

  const RING_PROPS = ['outlineStyle', 'outlineWidth', 'outlineColor', 'outlineOffset', 'boxShadow'] as const;
  const report: Array<{
    el: string;
    focusVisible: boolean;
    outlineStyle: string;
    outlineWidth: number;
    outlineColor: string;
    ringContrast: number | null;
    boxShadowChanged: boolean;
    designedRing: boolean;
    reason: string;
  }> = [];

  for (const el of candidates) {
    const rest: Record<string, string> = {};
    {
      const s = getComputedStyle(el);
      for (const k of RING_PROPS) rest[k] = s[k] as string;
    }
    el.focus({ preventScroll: true });
    const s = getComputedStyle(el);
    const focusVisible = el.matches(':focus-visible');
    const outlineStyle = s.outlineStyle;
    const outlineWidth = parseFloat(s.outlineWidth) || 0;
    const shadowAtRest = normaliseShadow(rest.boxShadow);
    const shadowOnFocus = normaliseShadow(s.boxShadow);
    const boxShadowChanged = shadowOnFocus !== shadowAtRest && hasVisibleShadowLayer(shadowOnFocus);

    // An author-designed outline: a real style (not the UA `auto` ring, not
    // `none`/`hidden`) painted at 2px or more — the width §5.3 locks.
    const outlineDesigned =
      outlineStyle !== 'none' && outlineStyle !== 'hidden' && outlineStyle !== 'auto' && outlineWidth >= 2;

    let ringContrast: number | null = null;
    if (outlineDesigned) {
      const ring = over(toRGBA(s.outlineColor), backdrop(el, true));
      ringContrast = Math.round(contrast(ring, backdrop(el, true)) * 100) / 100;
      // The ring sits on whatever is behind the element; with a positive offset
      // that is the parent's paint, which is what `backdrop(el, true)` returns.
    }

    const designedRing = (outlineDesigned && (ringContrast ?? 0) >= 3) || boxShadowChanged;
    let reason = '';
    if (!focusVisible) reason = 'element never enters :focus-visible on keyboard focus';
    else if (outlineStyle === 'auto') reason = 'browser-default focus ring (outline-style: auto) — R-90 anti-pattern';
    else if (outlineStyle === 'none' || outlineStyle === 'hidden')
      reason = boxShadowChanged ? '' : 'focus indicator removed (outline-style: none) with no replacement ring';
    else if (outlineWidth < 2) reason = `outline-width ${outlineWidth}px is below the locked 2px`;
    else if ((ringContrast ?? 0) < 3) reason = `focus ring contrast ${ringContrast}:1 is below WCAG 1.4.11's 3:1`;

    report.push({
      el: describe(el),
      focusVisible,
      outlineStyle,
      outlineWidth,
      outlineColor: s.outlineColor,
      ringContrast,
      boxShadowChanged,
      designedRing,
      reason,
    });
  }
  (document.activeElement as HTMLElement | null)?.blur?.();
  return report;
};

const DISABLED_SWEEP = (rootSelector: string | null) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
  function toRGBA(value: string): [number, number, number, number] {
    if (!value || value === 'none' || value === 'transparent') return [0, 0, 0, 0];
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  }
  function over(
    fg: [number, number, number, number],
    bg: [number, number, number, number],
  ): [number, number, number, number] {
    const a = fg[3] + bg[3] * (1 - fg[3]);
    if (a === 0) return [0, 0, 0, 0];
    return [
      (fg[0] * fg[3] + bg[0] * bg[3] * (1 - fg[3])) / a,
      (fg[1] * fg[3] + bg[1] * bg[3] * (1 - fg[3])) / a,
      (fg[2] * fg[3] + bg[2] * bg[3] * (1 - fg[3])) / a,
      a,
    ];
  }
  function luminance([r, g, b]: [number, number, number, number]): number {
    const lin = (c: number) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }
  function backdrop(el: Element): [number, number, number, number] {
    let acc: [number, number, number, number] = [0, 0, 0, 0];
    let node: Element | null = el;
    while (node) {
      acc = over(acc, toRGBA(getComputedStyle(node).backgroundColor));
      if (acc[3] >= 0.999) return acc;
      node = node.parentElement;
    }
    return over(acc, toRGBA(getComputedStyle(document.documentElement).backgroundColor));
  }
  function describe(el: Element): string {
    const name = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    return `${el.tagName.toLowerCase()}${name ? ` "${name}"` : ''}`;
  }

  const root: ParentNode = rootSelector ? (document.querySelector(rootSelector) as ParentNode) : document;
  const els = Array.from(
    root.querySelectorAll('button[disabled], input[disabled], select[disabled], textarea[disabled], [aria-disabled="true"]'),
  ) as HTMLElement[];

  return els.map((el) => {
    const s = getComputedStyle(el);
    // The composited alpha the element is actually painted at, including every
    // ancestor's opacity — a 0.3 fade is what §5.3 forbids.
    let effectiveOpacity = 1;
    let node: Element | null = el;
    while (node) {
      effectiveOpacity *= Number(getComputedStyle(node).opacity);
      node = node.parentElement;
    }
    const fg = over(
      [...(toRGBA(s.color).slice(0, 3) as [number, number, number]), toRGBA(s.color)[3] * effectiveOpacity] as [
        number,
        number,
        number,
        number,
      ],
      backdrop(el),
    );
    const bg = backdrop(el);
    const la = luminance(fg);
    const lb = luminance(bg);
    return {
      el: describe(el),
      exposedToAT: (el as HTMLButtonElement).disabled === true || el.getAttribute('aria-disabled') === 'true',
      opacity: s.opacity,
      effectiveOpacity: Math.round(effectiveOpacity * 1000) / 1000,
      cursor: s.cursor,
      pointerEvents: s.pointerEvents,
      contrast: Math.round(((Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)) * 100) / 100,
    };
  });
};

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
  // Every section below the fold mounts on an IntersectionObserver, so the
  // sweep only sees the whole page after it has been scrolled once.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
}

type FocusReport = Awaited<ReturnType<typeof runSweep>>;

/**
 * Sweeps the page twice — parked at the top and parked at the bottom — and
 * merges the two by element. Some controls only exist in one of those
 * positions: the clone's launcher is `aria-hidden` and fully transparent until
 * the reader is past the hero, and a sweep taken only at the top would score it
 * as "not present" rather than "has no ring".
 */
async function sweepWholePage(page: Page, rootSelector: string | null) {
  const seen = new Map<string, FocusReport[number]>();
  for (const position of ['top', 'bottom'] as const) {
    await page.evaluate((where) => window.scrollTo(0, where === 'top' ? 0 : document.body.scrollHeight), position);
    await page.waitForTimeout(900);
    await armKeyboardModality(page);
    const report = await runSweep(page, rootSelector);
    for (const row of report) if (!seen.has(row.el) || (seen.get(row.el)!.designedRing && !row.designedRing)) seen.set(row.el, row);
  }
  return Array.from(seen.values());
}

function runSweep(page: Page, rootSelector: string | null) {
  return page.evaluate(SWEEP, [FOCUSABLE, rootSelector] as [string, string | null]);
}

/**
 * Chromium only paints `:focus-visible` when the last input modality was the
 * keyboard. A bare `.focus()` after a click reads as a pointer focus and the
 * ring never appears, which would make every element look broken. One key
 * press sets the modality for the sweep that follows.
 */
async function armKeyboardModality(page: Page) {
  await page.keyboard.press('Shift');
}

async function openMiniVic(page: Page) {
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('[data-testid="minivic-toggle"]');
      return !!btn && Object.keys(btn).some((k) => k.startsWith('__reactFiber') || k.startsWith('__reactProps'));
    },
    { timeout: 30000 },
  );
  await page.locator('[data-testid="minivic-toggle"]').evaluate((el: HTMLElement) => el.click());
  await page.locator('[data-testid="minivic-panel"]').waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(1000);
}

test.describe('Interaction states — focus, disabled and cursor (R-49, R-90, SC-30.1)', () => {
  /**
   * TC-STATE-FOCUS → R-90, SC-30.1.
   * Every focusable element on the page must paint an author-designed focus
   * indicator. The lock records three elements with no `:focus-visible` rule at
   * all (#4 About provenance link, #22 SW toast reload, #23 MiniVic controls);
   * those fall through to Chromium's `outline-style: auto`, which is the
   * browser default R-90 prohibits.
   */
  test('TC-STATE-FOCUS — every focusable element paints a designed focus ring', async ({ page }) => {
    test.setTimeout(120000);
    await gotoHome(page);

    const report = await sweepWholePage(page, null);
    expect(report.length, 'the sweep found no focusable elements — the page did not render').toBeGreaterThan(20);

    const offenders = report.filter((r) => !r.designedRing);
    const lines = offenders.map(
      (r) =>
        `${r.el}\n      outline: ${r.outlineStyle} ${r.outlineWidth}px ${r.outlineColor}` +
        ` · ring contrast ${r.ringContrast ?? 'n/a'} · box-shadow changed: ${r.boxShadowChanged}` +
        `\n      → ${r.reason}`,
    );
    expect(
      offenders.map((r) => r.el),
      `${offenders.length} of ${report.length} focusable elements have no designed focus indicator:\n  - ${lines.join('\n  - ')}`,
    ).toEqual([]);
  });

  /**
   * TC-STATE-FOCUS-MINIVIC → R-90, SC-30.1, lock §5.2 row 23.
   * The clone's panel is the one place on the site that removes a focus ring
   * outright (`focus:outline-none`, MiniVicBot.tsx:1199) and styles a text
   * input's `:focus` with a border colour and no ring (globals.css:800-801).
   * The panel only exists once opened, so it gets its own sweep.
   */
  test('TC-STATE-FOCUS-MINIVIC — the clone panel paints a designed focus ring on every control', async ({ page }) => {
    test.setTimeout(120000);
    await gotoHome(page);
    await openMiniVic(page);
    await armKeyboardModality(page);

    const report = await runSweep(page, '[data-testid="minivic-panel"]');
    expect(report.length, 'the opened panel exposed no focusable controls').toBeGreaterThan(5);

    const offenders = report.filter((r) => !r.designedRing);
    const lines = offenders.map(
      (r) => `${r.el} — outline: ${r.outlineStyle} ${r.outlineWidth}px, contrast ${r.ringContrast ?? 'n/a'} → ${r.reason}`,
    );
    expect(
      offenders.map((r) => r.el),
      `${offenders.length} of ${report.length} controls inside the MiniVic panel have no designed focus indicator:\n  - ${lines.join('\n  - ')}`,
    ).toEqual([]);
  });

  /**
   * TC-STATE-FOCUS-REDUCED-MOTION → R-49, SC-30.1.
   * `app/globals.css:690-700` flattens every animation and transition under
   * `prefers-reduced-motion: reduce` with `!important`. A state library whose
   * indicators are carried by a transition would vanish for exactly the readers
   * who need them most, so the ring is asserted again with motion reduced.
   */
  test('TC-STATE-FOCUS-REDUCED-MOTION — the focus ring survives prefers-reduced-motion', async ({ page }) => {
    test.setTimeout(120000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);

    const report = await sweepWholePage(page, null);
    const offenders = report.filter((r) => !r.designedRing);
    expect(
      offenders.map((r) => r.el),
      `under prefers-reduced-motion, ${offenders.length} of ${report.length} focusable elements paint no designed focus indicator:\n  - ${offenders
        .map((r) => `${r.el} → ${r.reason}`)
        .join('\n  - ')}`,
    ).toEqual([]);
  });

  /**
   * TC-STATE-DISABLED → SC-30.1, lock §5.3.
   * The locked disabled state is `opacity: 1` — never a fade, because a fade
   * destroys contrast — plus `cursor: not-allowed`, `pointer-events: none` and
   * a colour that still clears 4:1. The two controls the clone panel ships
   * disabled at rest ("Replay last voice", "Send message") are the subjects.
   */
  test('TC-STATE-DISABLED — disabled controls carry the locked disabled treatment', async ({ page }) => {
    test.setTimeout(120000);
    await gotoHome(page);
    await openMiniVic(page);

    const report = await page.evaluate(DISABLED_SWEEP, '[data-testid="minivic-panel"]');
    expect(
      report.length,
      'no disabled control was rendered — the disabled state has no subject to audit',
    ).toBeGreaterThan(0);

    const offenders: string[] = [];
    for (const r of report) {
      const faults: string[] = [];
      if (r.effectiveOpacity < 0.999) faults.push(`faded to opacity ${r.effectiveOpacity} (locked: 1 — a fade destroys contrast)`);
      if (r.cursor !== 'not-allowed') faults.push(`cursor: ${r.cursor} (locked: not-allowed)`);
      if (r.pointerEvents !== 'none') faults.push(`pointer-events: ${r.pointerEvents} (locked: none)`);
      if (r.contrast < 4) faults.push(`text contrast ${r.contrast}:1 (locked floor: 4:1)`);
      if (!r.exposedToAT) faults.push('the disabled state is not exposed to assistive technology');
      if (faults.length) offenders.push(`${r.el} — ${faults.join('; ')}`);
    }
    expect(offenders, `${offenders.length} of ${report.length} disabled controls miss the locked disabled state:\n  - ${offenders.join('\n  - ')}`).toEqual(
      [],
    );
  });

  /**
   * TC-STATE-CURSOR → R-49, SC-30.1 ("zero browser-default states").
   * `app/globals.css:125` sets `* { cursor: auto }` unlayered, so an anchor the
   * reader can click renders the text/arrow cursor the browser would have used
   * on a paragraph. The lock (§5.3, cursor-state design) requires three
   * designed cursor states; the observable floor asserted here is that no
   * element the reader can activate is left on the browser default.
   */
  test('TC-STATE-CURSOR — no interactive element renders the browser-default cursor', async ({ page }) => {
    test.setTimeout(120000);
    await gotoHome(page);

    const report = await page.evaluate((selector) => {
      const isVisible = (el: Element) => {
        const s = getComputedStyle(el);
        if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) < 0.05) return false;
        const r = el.getBoundingClientRect();
        return r.width >= 1 && r.height >= 1 && !el.closest('[aria-hidden="true"],[hidden]');
      };
      const describe = (el: Element) => {
        const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
        const name = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 32);
        return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}${name ? ` "${name}"` : ''}`;
      };
      return (Array.from(document.querySelectorAll(selector)) as HTMLElement[])
        .filter((el) => el.tabIndex >= 0 && !(el as HTMLButtonElement).disabled && isVisible(el))
        .map((el) => ({ el: describe(el), cursor: getComputedStyle(el).cursor }));
    }, FOCUSABLE);

    expect(report.length, 'no interactive elements were found').toBeGreaterThan(20);
    const offenders = report.filter((r) => r.cursor === 'auto' || r.cursor === 'default');
    expect(
      offenders.map((r) => `${r.el} → cursor: ${r.cursor}`),
      `${offenders.length} of ${report.length} interactive elements render the browser-default cursor`,
    ).toEqual([]);
  });
});
