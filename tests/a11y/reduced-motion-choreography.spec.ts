import { test, expect, type Browser, type Page } from '@playwright/test';

/**
 * The parallel reduced-motion choreography (R-46, R-101, SC-27.1, T-39).
 *
 * R-46 requires "a parallel reduced-motion choreography that stays memorable";
 * SC-27.1 requires it certified memorable; R-101 requires "a beautiful
 * reduced-motion composition". The design-system lock
 * (docs/delivery/evidence/v6-20260903T195241Z/design-system-lock.md §4.3)
 * records that what ships instead is a **kill switch**:
 *
 *   - `app/globals.css:691-699` and again `app/globals.css:841-854` force
 *     `animation-duration: 0.001ms !important` / `transition-duration:
 *     0.01ms !important` on `*, *::before, *::after` — declared twice, at two
 *     different magnitudes.
 *   - Eight section modules then add `transition: none` / `animation: none`
 *     (About:239, Compass:176, Experience:402, Listen:162, Avatar:220,
 *     Bench:85, Skills:358, Vitrine:341).
 *   - Only `Hero.module.css:389-398` re-scores the entrance — and even that one
 *     is crushed to 0.001 ms by the blanket `!important` above it.
 *
 * The lock's §4.3 score is what these tests assert, per section, under emulated
 * `prefers-reduced-motion: reduce`:
 *
 *   RM-1  a sequenced opacity entrance is *present* — ≥3 elements, real
 *         durations inside the interface band, ≥3 distinct ordered delays.
 *   RM-2  the section's artefact is still composed and visible; nothing that
 *         is information vanishes, and every revealed element settles opaque.
 *   RM-3  nothing animates position or size — no keyframe and no surviving
 *         transition touches transform/size/inset.
 *   RM-4  colour affordances survive: a colour transition the section declares
 *         in the default motion mode still has a real duration under reduce.
 *   RM-5  (global) no blanket universal kill switch remains in the shipped CSS.
 *
 * Every assertion reads a **computed value** off a rendered element, or the
 * shipped CSSOM — never the presence of a class name.
 *
 * There is no preloader: `app/page.tsx` raises `body.page-ready` on the frame
 * after mount, so every navigation keys on that.
 */

/** Keyframe/transition properties that are safe under reduced motion. */
const SAFE_PROPERTIES = new Set([
  'opacity',
  'visibility',
  'color',
  'background-color',
  'background',
  'border-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
  'box-shadow',
  'fill',
  'stroke',
  'fill-opacity',
  'stroke-opacity',
  'text-decoration-color',
  'filter',
]);

/** Properties that move or resize a box. Forbidden under reduced motion. */
const MOTION_PROPERTIES = new Set([
  'transform',
  'translate',
  'rotate',
  'scale',
  'perspective',
  'offset-distance',
  'offset-path',
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'top',
  'right',
  'bottom',
  'left',
  'inset',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'stroke-dashoffset',
  'clip-path',
]);

/** Properties whose transition is the primary affordance signal (lock §4.3 instrument 3). */
const COLOUR_PROPERTIES = new Set([
  'color',
  'background',
  'background-color',
  'border-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
  'box-shadow',
  'fill',
  'stroke',
  'fill-opacity',
  'stroke-opacity',
  'text-decoration-color',
]);

/** R-46 interface band, with the fade floor the lock's re-score sits on (Hero uses 320 ms). */
const FADE_MIN_MS = 150;
const FADE_MAX_MS = 600;
/** A stagger that runs longer than this stops being an entrance and becomes a wait. */
const MAX_DELAY_MS = 1200;
/** A transition at or under this is indistinguishable from `none`. */
const CRUSHED_MS = 1;

interface AnimationRecord {
  key: string;
  names: string[];
  durationsMs: number[];
  delaysMs: number[];
  keyframeProperties: string[];
  opacity: number;
  width: number;
  height: number;
}

interface TransitionRecord {
  key: string;
  entries: { property: string; durationMs: number }[];
}

interface SectionSweep {
  found: boolean;
  elementCount: number;
  animations: AnimationRecord[];
  transitions: TransitionRecord[];
}

interface ElementState {
  opacity: number;
  visibility: string;
  display: string;
  width: number;
  height: number;
}

interface ArtefactState {
  selector: string;
  count: number;
  elements: ElementState[];
}

interface BlanketRule {
  condition: string;
  selector: string;
  properties: string[];
}

const SECTIONS = [
  {
    id: '#hero',
    name: 'Hero',
    /** The three graded figures — the section's data-backed artefact. */
    artefacts: ['#hero [aria-label="Delivery record"]', '#hero h1'],
  },
  {
    id: '#about',
    name: 'About',
    /** The compass instrument face: ten dimensions, drawn. */
    artefacts: ['#about svg[role="img"]', '#about h2'],
  },
  {
    id: '#experience',
    name: 'Experience',
    /** The duration-true timeline: eight bars on one axis. */
    artefacts: ['#experience ol li span[style]', '#experience h2'],
  },
  {
    id: '#skills',
    name: 'Skills',
    /** The calibration card and the bench that traces it. */
    artefacts: ['#skills table', '#skills svg'],
  },
  {
    id: '#vitrine',
    name: 'Vitrine',
    /** Six repository plates, each with its bespoke drawing. */
    artefacts: ['#vitrine ol > li', '#vitrine svg[role="img"]'],
  },
  {
    id: '#listen',
    name: 'Listen',
    /** The closing hairline and the four channels. */
    artefacts: ['#listen ul li a', '#listen h2'],
  },
] as const;

/**
 * Runs in the browser. Collects, for one section, every element's computed
 * animation and transition state plus the keyframe properties those animations
 * actually interpolate (read off the shipped CSSOM, not off the source).
 */
function sweepInPage(sectionSelector: string): SectionSweep {
  const root = document.querySelector(sectionSelector);
  if (!root) return { found: false, elementCount: 0, animations: [], transitions: [] };

  // name -> the union of properties its keyframes interpolate.
  const keyframeProps = new Map<string, string[]>();
  const collect = (rules: CSSRuleList): void => {
    for (const rule of Array.from(rules)) {
      const asKeyframes = rule as CSSKeyframesRule;
      if (typeof asKeyframes.name === 'string' && asKeyframes.cssRules) {
        const props = new Set<string>();
        for (const frame of Array.from(asKeyframes.cssRules)) {
          const style = (frame as CSSKeyframeRule).style;
          for (let i = 0; i < style.length; i++) props.add(style[i]);
        }
        keyframeProps.set(asKeyframes.name, Array.from(props));
        continue;
      }
      const grouping = rule as CSSGroupingRule;
      if (grouping.cssRules) collect(grouping.cssRules);
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      collect(sheet.cssRules);
    } catch {
      // Cross-origin sheet: not part of this build's CSS.
    }
  }

  const toMs = (value: string): number => {
    const trimmed = value.trim();
    if (trimmed.endsWith('ms')) return parseFloat(trimmed);
    if (trimmed.endsWith('s')) return parseFloat(trimmed) * 1000;
    return parseFloat(trimmed) || 0;
  };

  const descriptor = (el: Element): string => {
    const cls =
      typeof (el as HTMLElement).className === 'string'
        ? (el as HTMLElement).className
        : ((el as unknown as SVGElement).className as unknown as { baseVal?: string })?.baseVal || '';
    return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls ? `.${cls.trim().split(/\s+/).join('.')}` : ''}`;
  };

  const seen = new Map<string, number>();
  const animations: AnimationRecord[] = [];
  const transitions: TransitionRecord[] = [];
  const elements = [root, ...Array.from(root.querySelectorAll('*'))];

  for (const el of elements) {
    const desc = descriptor(el);
    const n = seen.get(desc) ?? 0;
    seen.set(desc, n + 1);
    const key = `${desc}@${n}`;
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    const names = cs.animationName
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && s !== 'none');
    if (names.length > 0) {
      const props = new Set<string>();
      for (const name of names) for (const p of keyframeProps.get(name) ?? []) props.add(p);
      animations.push({
        key,
        names,
        durationsMs: cs.animationDuration.split(',').map(toMs),
        delaysMs: cs.animationDelay.split(',').map(toMs),
        keyframeProperties: Array.from(props),
        opacity: parseFloat(cs.opacity),
        width: rect.width,
        height: rect.height,
      });
    }

    const props = cs.transitionProperty.split(',').map((s) => s.trim());
    // `all` is the initial value — nothing was authored on this element.
    if (props.length === 1 && (props[0] === 'all' || props[0] === 'none' || props[0] === '')) continue;
    const durs = cs.transitionDuration.split(',').map(toMs);
    transitions.push({
      key,
      entries: props.map((property, i) => ({
        property,
        durationMs: durs.length === 0 ? 0 : durs[i % durs.length],
      })),
    });
  }

  return { found: true, elementCount: elements.length, animations, transitions };
}

/** Runs in the browser. Finds universal-selector rules inside reduced-motion media blocks. */
function blanketRulesInPage(): BlanketRule[] {
  const hits: BlanketRule[] = [];
  const isUniversal = (selector: string): boolean =>
    selector
      .split(',')
      .map((s) => s.trim())
      .some((s) => /^\*(\s*::?[a-zA-Z-]+)?$/.test(s) || /^::?(before|after)$/.test(s));

  const walk = (rules: CSSRuleList, condition: string): void => {
    for (const rule of Array.from(rules)) {
      const media = rule as CSSMediaRule;
      const nextCondition =
        typeof media.conditionText === 'string' && media.conditionText
          ? `${condition}${condition ? ' and ' : ''}${media.conditionText}`
          : condition;
      const styleRule = rule as CSSStyleRule;
      if (typeof styleRule.selectorText === 'string' && styleRule.style) {
        if (/prefers-reduced-motion/i.test(condition) && isUniversal(styleRule.selectorText)) {
          const properties: string[] = [];
          for (let i = 0; i < styleRule.style.length; i++) {
            const prop = styleRule.style[i];
            if (prop === 'animation-duration' || prop === 'transition-duration' || prop === 'animation-name' || prop === 'transition-property') {
              properties.push(`${prop}: ${styleRule.style.getPropertyValue(prop)}${styleRule.style.getPropertyPriority(prop) ? ' !important' : ''}`);
            }
          }
          // A guard that only turns transform-driven keyframes off is the lock's
          // prescribed replacement; only duration-crushing is the kill switch.
          const crushes = properties.some((p) => /^(animation|transition)-duration:/.test(p));
          if (crushes) {
            hits.push({ condition: nextCondition, selector: styleRule.selectorText, properties });
          }
        }
      }
      const grouping = rule as CSSGroupingRule;
      if (grouping.cssRules) walk(grouping.cssRules, nextCondition);
    }
  };

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules, '');
    } catch {
      // Cross-origin sheet: not part of this build's CSS.
    }
  }
  return hits;
}


async function openPage(browser: Browser, reduced: 'reduce' | 'no-preference'): Promise<Page> {
  const context = await browser.newContext({
    reducedMotion: reduced,
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  // `page-ready` is raised inside a requestAnimationFrame callback, which a
  // headless browser under load can throttle indefinitely. It is a boot signal,
  // not the property under test, so the suite's convention is to prefer it and
  // fall through to the section itself — which every assertion below needs
  // rendered anyway, and which is therefore waited for unconditionally.
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
  return page;
}

/** Scroll the section into view so any observer-driven entrance actually fires, then settle. */
async function settle(page: Page, selector: string): Promise<void> {
  await page.locator(selector).scrollIntoViewIfNeeded();
  // Longest permitted entrance (600 ms) plus the longest permitted stagger (1200 ms).
  await page.waitForTimeout(2000);
}

/** Measure every element an artefact selector matches: is it composed, and is it visible? */
async function measureArtefact(page: Page, selector: string): Promise<ArtefactState> {
  const locator = page.locator(selector);
  const count = await locator.count();
  if (count === 0) return { selector, count, elements: [] };
  const elements = await locator.evaluateAll((els) =>
    els.map((el) => {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        opacity: parseFloat(cs.opacity),
        visibility: cs.visibility,
        display: cs.display,
        width: rect.width,
        height: rect.height,
      };
    }),
  );
  return { selector, count, elements };
}

interface SectionCapture {
  quiet: SectionSweep;
  base: SectionSweep;
  quietArtefacts: ArtefactState[];
  baseArtefacts: ArtefactState[];
}

/**
 * Capture one section in both motion modes. Self-contained per test: Playwright
 * discards a worker after a failing test, so a shared `beforeAll` would re-run
 * its whole capture after every failure — slow, and a source of load-dependent
 * flake that has nothing to do with what is under test.
 */
async function capture(browser: Browser, section: (typeof SECTIONS)[number]): Promise<SectionCapture> {
  const quietPage = await openPage(browser, 'reduce');
  await settle(quietPage, section.id);
  const quiet = await quietPage.evaluate(sweepInPage, section.id);
  const quietArtefacts: ArtefactState[] = [];
  for (const artefact of section.artefacts) quietArtefacts.push(await measureArtefact(quietPage, artefact));
  await quietPage.context().close();

  const basePage = await openPage(browser, 'no-preference');
  await settle(basePage, section.id);
  const base = await basePage.evaluate(sweepInPage, section.id);
  const baseArtefacts: ArtefactState[] = [];
  for (const artefact of section.artefacts) baseArtefacts.push(await measureArtefact(basePage, artefact));
  await basePage.context().close();

  return { quiet, base, quietArtefacts, baseArtefacts };
}

/** The colour properties a sweep sees transitioned, and for how long, per element. */
function colourDurations(sweepResult: SectionSweep): Map<string, number> {
  const out = new Map<string, number>();
  for (const t of sweepResult.transitions) {
    for (const e of t.entries) {
      if (!COLOUR_PROPERTIES.has(e.property)) continue;
      const key = `${t.key} · ${e.property}`;
      out.set(key, Math.max(out.get(key) ?? 0, e.durationMs));
    }
  }
  return out;
}

test.describe('Reduced-motion choreography (R-46 / R-101 / SC-27.1)', () => {
  for (const section of SECTIONS) {
    test(`${section.name} keeps a parallel reduced-motion choreography`, async ({ browser }) => {
      test.setTimeout(180000);
      const { quiet, base, quietArtefacts, baseArtefacts } = await capture(browser, section);
      expect(quiet.found && base.found, `${section.id} is not in the document`).toBe(true);

      // ── RM-1 · a sequenced opacity entrance is present ──────────────────────
      // An entrance is a fade whose keyframes touch nothing but safe properties.
      const fades = quiet.animations.filter(
        (a) =>
          a.keyframeProperties.length > 0 &&
          a.keyframeProperties.every((p) => SAFE_PROPERTIES.has(p)) &&
          a.keyframeProperties.includes('opacity'),
      );
      expect
        .soft(
          fades.length,
          `RM-1 ${section.name}: ${fades.length} element(s) carry an opacity entrance under ` +
            `prefers-reduced-motion; a sequenced reveal needs at least three. R-46 requires a parallel ` +
            `choreography, not silence.`,
        )
        .toBeGreaterThanOrEqual(3);

      // Every fade runs long enough to be perceived — a 0.001 ms "animation" is
      // the kill switch wearing the choreography's clothes.
      const crushed = fades
        .flatMap((f) => f.durationsMs.map((ms) => ({ key: f.key, ms })))
        .filter(({ ms }) => ms < FADE_MIN_MS || ms > FADE_MAX_MS)
        .map(({ key, ms }) => `${key}: ${ms}ms`);
      expect
        .soft(
          crushed,
          `RM-1 ${section.name}: entrance durations outside the ${FADE_MIN_MS}–${FADE_MAX_MS} ms band.`,
        )
        .toEqual([]);

      // The order is the choreography: distinct, ascending, bounded delays.
      const delays = Array.from(new Set(fades.map((f) => Math.round(f.delaysMs[0] ?? 0)))).sort((a, b) => a - b);
      expect
        .soft(
          delays.length,
          `RM-1 ${section.name}: the entrance is staggered across ${delays.length} distinct delay(s) ` +
            `(${delays.join(', ') || 'none'} ms). A choreography needs an order, not a single cue.`,
        )
        .toBeGreaterThanOrEqual(3);
      if (delays.length > 0) {
        expect.soft(Math.min(...delays), `RM-1 ${section.name}: negative entrance delay`).toBeGreaterThanOrEqual(0);
        expect
          .soft(
            Math.max(...delays),
            `RM-1 ${section.name}: the entrance is still arriving at ${Math.max(...delays)} ms, ` +
              `past the ${MAX_DELAY_MS} ms ceiling.`,
          )
          .toBeLessThanOrEqual(MAX_DELAY_MS);
      }

      // ── RM-2 · the artefact is still composed, and nothing vanishes ─────────
      const partTransparent = quiet.animations
        .filter((a) => a.opacity <= 0.99)
        .map((a) => `${a.key} settles at opacity ${a.opacity}`);
      expect
        .soft(
          partTransparent,
          `RM-2 ${section.name}: an animated element never finishes arriving under reduced motion.`,
        )
        .toEqual([]);

      // The artefact is measured against the *default* motion composition, not an
      // absolute: a plate the carousel deliberately leaves unlit is a designed
      // state, and reduced motion must reproduce it rather than amputate it.
      const vanished: string[] = [];
      quietArtefacts.forEach((state, i) => {
        const baseline = baseArtefacts[i];
        if (state.count === 0) {
          vanished.push(`"${state.selector}" matched nothing under reduced motion`);
          return;
        }
        if (state.count < baseline.count) {
          vanished.push(
            `"${state.selector}" renders ${state.count} element(s) under reduced motion but ${baseline.count} by default`,
          );
        }
        state.elements.forEach((el, n) => {
          const where = `"${state.selector}" [${n}]`;
          if (el.visibility !== 'visible') vanished.push(`${where} is ${el.visibility}`);
          if (el.display === 'none') vanished.push(`${where} is display:none`);
          if (el.width <= 0 || el.height <= 0) vanished.push(`${where} has a zero-area box`);
          if (el.opacity <= 0) vanished.push(`${where} is fully transparent`);
          const baseEl = baseline.elements[n];
          if (baseEl && el.opacity < baseEl.opacity - 0.01) {
            vanished.push(
              `${where} is at opacity ${el.opacity} under reduced motion but ${baseEl.opacity} by default`,
            );
          }
        });
      });
      expect
        .soft(
          vanished,
          `RM-2 ${section.name}: reduced motion may re-score the arrival, never remove or dim the artefact.`,
        )
        .toEqual([]);

      // ── RM-3 · nothing animates position or size ───────────────────────────
      const movingKeyframes = quiet.animations.flatMap((a) =>
        a.keyframeProperties
          .filter((p) => MOTION_PROPERTIES.has(p))
          .map((p) => `${a.key} · @keyframes ${a.names.join('+')} animates ${p}`),
      );
      expect
        .soft(movingKeyframes, `RM-3 ${section.name}: a keyframe moves or resizes an element under reduced motion.`)
        .toEqual([]);

      const movingTransitions = quiet.transitions.flatMap((t) =>
        t.entries
          .filter((e) => MOTION_PROPERTIES.has(e.property) && e.durationMs > CRUSHED_MS)
          .map((e) => `${t.key} · transition ${e.property} ${e.durationMs}ms`),
      );
      expect
        .soft(movingTransitions, `RM-3 ${section.name}: a transition moves or resizes an element under reduced motion.`)
        .toEqual([]);

      // ── RM-4 · colour affordances survive ──────────────────────────────────
      const baseline = colourDurations(base);
      const live = Array.from(baseline.entries()).filter(([, ms]) => ms >= FADE_MIN_MS);
      expect
        .soft(
          live.length,
          `RM-4 ${section.name}: no colour transition exists in the default motion mode, so this check ` +
            `cannot be satisfied by deleting the affordance rather than preserving it.`,
        )
        .toBeGreaterThan(0);

      const quietColour = colourDurations(quiet);
      const killed = live
        .filter(([key]) => (quietColour.get(key) ?? 0) < FADE_MIN_MS)
        .map(([key, ms]) => `${key}: ${ms}ms default → ${quietColour.get(key) ?? 0}ms reduced`);
      expect
        .soft(
          killed,
          `RM-4 ${section.name}: colour affordances are killed under reduced motion. A hover that changes ` +
            `colour causes no vestibular response and is the primary affordance signal; removing it makes ` +
            `the interface read as broken rather than calm (lock §4.3).`,
        )
        .toEqual([]);
    });
  }

  test('RM-5 no blanket universal kill switch survives in the shipped CSS', async ({ browser }) => {
    test.setTimeout(180000);
    const page = await openPage(browser, 'reduce');
    const blanketRules = await page.evaluate(blanketRulesInPage);
    await page.context().close();
    expect(
      blanketRules.map((r) => `@media ${r.condition} { ${r.selector} { ${r.properties.join('; ')} } }`),
      'A universal-selector rule inside prefers-reduced-motion crushes every duration on the page. ' +
        'R-46 asks for a parallel score; a global duration override can only amputate.',
    ).toEqual([]);
  });
});
