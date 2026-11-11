import { expect, test, type Locator, type Page } from '@playwright/test';
import sharp from 'sharp';

import { projects } from '@/content/work';
import { schematicLayout } from '@/lib/schematic';

import { entranceDone, open, visibleWordCounts, watchConsole } from './support';

const SECTION = '#work';

/** Opens a path and waits until the section's behaviour (loaded after the page) has set the cards and panels up. */
async function openWork(page: Page, path: string): Promise<void> {
  await open(page, path);
  await expect(page.locator(`${SECTION}[data-interactive="true"]`)).toBeAttached();
}
const card = (page: Page, repo: string) => page.locator(`${SECTION} article[data-project="${repo}"]`);
const panelId = (repo: string) => `project-${repo}-detail`;

/** The space an element takes in the layout, which a transform does not change. */
const layoutSize = (owner: Locator) =>
  owner.evaluate((element) => (element instanceof HTMLElement ? { width: element.offsetWidth, height: element.offsetHeight } : null));

const [aether, , ralph, , jyotish] = projects;
if (!aether || !ralph || !jyotish) throw new Error('content/work.ts no longer holds the six projects');

/** The laptop and desktop sizes at which the whole rail is on screen at once. */
const WIDE = [
  [1280, 720],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
] as const;

test.describe('the rail on a wide screen', { tag: '@desktop' }, () => {
  for (const [width, height] of WIDE) {
    test(`six equal cards stand in one row within one screen at ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openWork(page, '/');
      await page.evaluate(() => document.fonts.ready);
      const measured = await page.evaluate((selector) => {
        const section = document.querySelector(selector) as HTMLElement;
        const cards = [...section.querySelectorAll<HTMLElement>('article[data-project]')].map((element) => element.getBoundingClientRect());
        const visual = section.querySelector<HTMLElement>('article[data-project] [data-schematic]')?.getBoundingClientRect();
        const width = document.documentElement.clientWidth;
        return {
          section: section.getBoundingClientRect().height,
          cards: cards.map((box) => ({ top: box.top, left: box.left, right: box.right, height: box.height })),
          share: visual ? visual.height / (cards[0]?.height ?? 1) : 0,
          overflow: document.documentElement.scrollWidth - width,
          width,
        };
      }, SECTION);
      expect(measured.cards).toHaveLength(projects.length);
      for (const box of measured.cards) {
        expect(Math.abs(box.top - (measured.cards[0]?.top ?? 0))).toBeLessThan(1);
        expect(Math.abs(box.height - (measured.cards[0]?.height ?? 0))).toBeLessThan(1);
        expect(box.left).toBeGreaterThanOrEqual(0);
        expect(box.right).toBeLessThanOrEqual(measured.width);
      }
      // The rail is the width of the browser, with a margin of 16 to 24 px at each end.
      expect(measured.cards[0]?.left).toBeGreaterThanOrEqual(15.5);
      expect(measured.cards[0]?.left).toBeLessThanOrEqual(24.5);
      expect(measured.width - (measured.cards.at(-1)?.right ?? 0)).toBeLessThanOrEqual(24.5);
      expect(measured.overflow).toBeLessThanOrEqual(0);
      expect(measured.section, `${measured.section}px in a ${height}px screen`).toBeLessThanOrEqual(height);
      expect(measured.share, 'the schematic is the dominant part of the card').toBeGreaterThanOrEqual(0.55);
    });
  }
});

test.describe('the cards and their schematics', () => {
  test('each card draws its three stages from content/work.ts, in a composition of its own', async ({ page }) => {
    const problems = watchConsole(page);
    await openWork(page, '/');
    const drawings = new Set<string>();
    for (const project of projects) {
      const owner = card(page, project.repo);
      await expect(owner.locator('h3')).toHaveText(project.name);
      await expect(owner.locator('[data-project-status]')).toHaveText(project.status);
      await expect(owner.getByText(project.value, { exact: true })).toBeVisible();
      const drawing = owner.locator('svg[data-schematic-id]');
      await expect(drawing).toHaveAttribute('data-schematic-id', project.schematic.id);
      await expect(drawing.locator('g[data-stage]')).toHaveCount(3);
      expect(await drawing.locator('g[data-stage]').evaluateAll((marks) => marks.map((mark) => mark.getAttribute('data-stage')))).toEqual(project.schematic.stages.map((stage) => stage.id));
      // The names of the three stages are in the HTML, in order, beside a drawing that carries no text.
      await expect(owner.locator('ol li .sr-only')).toHaveText(project.schematic.stages.map((stage) => stage.label));
      await expect(owner.locator('[data-stage-view]')).toHaveCount(1);
      await expect(owner.locator('svg text')).toHaveCount(0);
      drawings.add(await drawing.evaluate((svg) => svg.innerHTML));
      // The drawing is what the layout function says it is.
      const layout = schematicLayout(project.schematic);
      expect(layout.nodes.map((node) => node.id)).toEqual(project.schematic.stages.map((stage) => stage.id));
    }
    expect(drawings.size, 'six different compositions').toBe(projects.length);
    expect(await page.locator('canvas').count()).toBeLessThanOrEqual(1);
    expect(problems).toEqual([]);
  });

  test('the Aether card names no repository and no live address', async ({ page }) => {
    await openWork(page, '/');
    await expect(card(page, aether.repo).locator('a[href^="http"]')).toHaveCount(0);
  });

  test('pointing at a schematic lights its stages in order and names each, and nothing moves', async ({ page }) => {
    await openWork(page, '/');
    const owner = card(page, aether.repo);
    const caption = owner.locator('p[aria-live]');
    // The space the card takes: a lean (a transform) never changes it, and nothing else may.
    const size = () => layoutSize(owner);
    const before = await size();
    await expect(caption).toHaveText('');
    // Every change of the caption is written down with the stage lit at that moment, so the order is read
    // from what the page did and not from when this test happened to look.
    await owner.evaluate((element) => {
      const seen: { caption: string; lit: string | null }[] = [];
      const read = () => ({
        caption: element.querySelector('p[aria-live]')?.textContent ?? '',
        lit: element.querySelector('g[data-stage][data-active="true"]')?.getAttribute('data-stage') ?? null,
      });
      new MutationObserver(() => seen.push(read())).observe(element, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['data-active'],
      });
      Object.assign(window, { seenFlow: seen });
    });
    await owner.locator('[data-schematic] button').hover();
    const [, , last] = aether.schematic.stages;
    await expect(caption).toHaveText(`3 · ${last.label}`);
    expect(await size()).toEqual(before);
    const seen = await page.evaluate(() => (window as unknown as { seenFlow: { caption: string; lit: string | null }[] }).seenFlow);
    const steps = seen.filter((entry, at) => entry.caption !== '' && entry.caption !== seen[at - 1]?.caption);
    expect(steps).toEqual(aether.schematic.stages.map((stage, at) => ({ caption: `${at + 1} · ${stage.label}`, lit: stage.id })));
    await page.mouse.move(2, 2);
    await expect(caption).toHaveText('');
  });

  test('keyboard focus runs the stages once, and a press after it runs them again', async ({ page }) => {
    await openWork(page, '/');
    const owner = card(page, ralph.repo);
    const caption = owner.locator('p[aria-live]');
    const [first, , last] = ralph.schematic.stages;
    await owner.locator('[data-schematic] button').focus();
    await expect(caption).toHaveText(`1 · ${first.label}`);
    await expect(caption).toHaveText(`3 · ${last.label}`);
    // The run is over: it stays on the last stage, and does not go round again.
    await page.waitForTimeout(1800);
    await expect(caption).toHaveText(`3 · ${last.label}`);
    await page.keyboard.press('Enter');
    await expect(caption).toHaveText(`1 · ${first.label}`);
    await owner.locator('[data-schematic] button').blur();
    await expect(caption).toHaveText('');
  });

  test('a tap runs the stages of a schematic once and names each', { tag: '@mobile' }, async ({ page }) => {
    await openWork(page, '/');
    const owner = card(page, jyotish.repo);
    await owner.scrollIntoViewIfNeeded();
    const caption = owner.locator('p[aria-live]');
    await owner.locator('[data-schematic] button').tap();
    for (const [at, stage] of jyotish.schematic.stages.entries()) await expect(caption).toHaveText(`${at + 1} · ${stage.label}`);
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  });

  test('the visible words of the section keep to the budget of 70', { tag: '@desktop' }, async ({ page }) => {
    await openWork(page, '/');
    expect((await visibleWordCounts(page, ['work'])).work).toBeLessThanOrEqual(70);
  });
});

test.describe('the project panel', () => {
  test('Open project opens the panel on its own address; Escape and Back close it and focus returns to the card', async ({ page }) => {
    await openWork(page, '/');
    const link = card(page, ralph.repo).locator('[data-detail-trigger]');
    await link.scrollIntoViewIfNeeded();
    await link.click();
    const dialog = page.getByRole('dialog', { name: ralph.name });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`#${panelId(ralph.repo)}$`));
    const item = dialog.locator('section[data-active="true"]');
    await expect(item.locator('svg[data-schematic-id]')).toBeVisible();
    await expect(item.locator('[data-stage-view]')).toHaveCount(1);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(link).toBeFocused();

    await link.click();
    await expect(dialog).toBeVisible();
    await page.goBack();
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(link).toBeFocused();
  });

  test('a link to a project opens its panel, and the controls move between the six', async ({ page }) => {
    await openWork(page, `/#${panelId(jyotish.repo)}`);
    const dialog = page.getByRole('dialog', { name: jyotish.name });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('dialog', { name: projects[5]?.name ?? '' })).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Previous' }).click();
    await expect(page.getByRole('dialog', { name: jyotish.name })).toBeVisible();
  });

  test('three stage controls and the arrow keys step the stages and show each note', async ({ page }) => {
    await openWork(page, `/#${panelId(aether.repo)}`);
    const dialog = page.getByRole('dialog', { name: aether.name });
    await expect(dialog).toBeVisible();
    const item = dialog.locator('section[data-active="true"]');
    const picks = item.locator('button[aria-pressed]');
    await expect(picks).toHaveCount(3);
    const lit = item.locator('g[data-stage][data-active="true"]');
    await expect(picks.nth(0)).toHaveAttribute('aria-pressed', 'true');
    await expect(item.getByText(aether.schematic.stages[0].note)).toBeVisible();
    await expect(item.getByText(aether.schematic.stages[1].note)).toBeHidden();

    await picks.nth(2).click();
    await expect(lit).toHaveAttribute('data-stage', aether.schematic.stages[2].id);
    await expect(item.getByText(aether.schematic.stages[2].note)).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await expect(lit).toHaveAttribute('data-stage', aether.schematic.stages[1].id);
    await expect(item.getByText(aether.schematic.stages[1].note)).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(lit).toHaveAttribute('data-stage', aether.schematic.stages[2].id);
    // The arrow keys step the stages, not the projects: the same project is still showing.
    await expect(page).toHaveURL(new RegExp(`#${panelId(aether.repo)}$`));
  });

  test('every project shows what it does, its stack, its decisions, its dates and exactly its links', async ({ page }) => {
    await openWork(page, '/');
    for (const project of projects) {
      await page.evaluate((id) => {
        window.location.hash = `#${id}`;
      }, panelId(project.repo));
      const dialog = page.getByRole('dialog', { name: project.name });
      await expect(dialog).toBeVisible();
      const item = dialog.locator('section[data-active="true"]');
      for (const sentence of project.does) await expect(item.getByText(sentence, { exact: false })).toBeVisible();
      for (const tool of project.stack) await expect(item.getByText(tool, { exact: true })).toBeVisible();
      for (const decision of project.decisions) await expect(item.getByText(decision, { exact: true })).toBeVisible();
      for (const figure of project.figures) await expect(item.getByText(figure.value, { exact: true })).toBeVisible();
      await expect(item.getByText(/^First commit \d+ \w+ \d{4}, [\d,]+ commits as of 10 November 2026$/)).toBeVisible();
      const expected = [project.repoHref, project.live?.href].filter(Boolean);
      const links = await item.locator('a[href^="http"]').evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute('href')));
      expect(links, project.name).toEqual(expected);
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
    }
  });
});

test.describe('without the light layer or script', () => {
  test('?gl=off draws the same cards and opens the same panel', async ({ page }) => {
    await openWork(page, '/?gl=off');
    await expect(page.locator(`${SECTION} article[data-project]`)).toHaveCount(projects.length);
    await card(page, aether.repo).locator('[data-detail-trigger]').click();
    await expect(page.getByRole('dialog', { name: aether.name })).toBeVisible();
  });

  test('with script off all six projects are listed in full on the page', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto('/');
    const items = page.locator(`${SECTION} [data-detail-item]`);
    await expect(items).toHaveCount(projects.length);
    for (const project of projects) {
      const item = page.locator(`#${panelId(project.repo)}`);
      await expect(item.locator('svg[data-schematic-id]')).toBeVisible();
      for (const [at, stage] of project.schematic.stages.entries()) {
        await expect(item.locator('[data-stage-control]').nth(at)).toContainText(stage.label);
        await expect(item.getByText(stage.note, { exact: true })).toBeVisible();
      }
      for (const decision of project.decisions) await expect(item.getByText(decision, { exact: true })).toBeVisible();
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await context.close();
  });
});

/** What the page did when the rail came into view, written down by the page itself as it happened. */
interface Arrival {
  /** Each card's delay and duration in milliseconds, in the order of the rail, read the moment the entrance began. */
  timings: { delay: number; duration: number }[];
  /** The index of each card, in the order the cards began to run. */
  started: number[];
  /** How many times the section was set to play. */
  plays: number;
  /** Layout shift of anything inside the section, scored from the moment the rail came into view. */
  shift: number;
}

/** Watches the section from now on, then lets the rail come into view by scrolling it to the middle of the screen. */
async function scrollRailIn(page: Page): Promise<void> {
  await page.evaluate((selector) => {
    const section = document.querySelector<HTMLElement>(selector);
    const rail = section?.querySelector('article[data-project]')?.closest('ul');
    if (!section || !rail) throw new Error('the rail is missing');
    const cards = [...rail.children];
    const record: Arrival = { timings: [], started: [], plays: 0, shift: 0 };
    new MutationObserver(() => {
      if (section.dataset.entrance !== 'play') return;
      record.plays += 1;
      // Asking for the animations makes the browser create them now, before it has drawn a frame of them.
      record.timings = cards.map((card) => {
        const run = card.getAnimations().find((animation) => animation instanceof CSSAnimation && /arrive/.test(animation.animationName));
        const timing = run?.effect?.getComputedTiming();
        return { delay: Number(timing?.delay ?? -1), duration: Number(timing?.duration ?? -1) };
      });
    }).observe(section, { attributes: true, attributeFilter: ['data-entrance'] });
    section.addEventListener('animationstart', (event) => {
      const at = cards.indexOf(event.target as Element);
      if (at >= 0) record.started.push(at);
    });
    // Only what moved inside this section counts: the timeline above it has its own way of arriving.
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number; sources: { node: Node | null }[] })[]) {
        if (entry.sources.some((source) => source.node && section.contains(source.node))) record.shift += entry.value;
      }
    }).observe({ type: 'layout-shift' });
    Object.assign(window, { arrival: record });
    const top = rail.getBoundingClientRect().top + window.scrollY - window.innerHeight / 3;
    window.scrollTo({ top, behavior: 'instant' });
  }, SECTION);
}

const arrival = (page: Page) => page.evaluate(() => (window as unknown as { arrival: Arrival }).arrival);

test.describe('the entrance of the rail', () => {
  test('the six cards arrive in order, a stagger apart, inside 1200 ms, and no card moves the page', async ({ page }) => {
    await openWork(page, '/');
    const section = page.locator(SECTION);
    await expect(section).toHaveAttribute('data-entrance', 'armed');
    const places = () => page.evaluate((selector) => [...document.querySelectorAll(`${selector} article[data-project]`)].map((element) => {
      const box = element.getBoundingClientRect();
      return { left: box.left + window.scrollX, top: box.top + window.scrollY, width: box.width, height: box.height };
    }), SECTION);
    const before = await places();
    // Waiting out of sight, the cards take their places but are not drawn.
    const waiting = await page.evaluate((selector) => [...document.querySelectorAll(`${selector} article[data-project]`)].map((element) => getComputedStyle(element.parentElement as Element).opacity), SECTION);
    expect(waiting).toEqual(projects.map(() => '0'));

    await scrollRailIn(page);
    await expect(section).toHaveAttribute('data-entrance', 'done');
    const seen = await arrival(page);
    expect(seen.plays).toBe(1);
    expect(seen.timings).toHaveLength(projects.length);
    const [first, ...rest] = seen.timings;
    expect(first?.delay).toBe(0);
    let previous = first?.delay ?? 0;
    for (const timing of rest) {
      const step = timing.delay - previous;
      expect(step, `a card starts ${step} ms after the one before it`).toBeGreaterThanOrEqual(40);
      expect(step).toBeLessThanOrEqual(70);
      previous = timing.delay;
    }
    for (const timing of seen.timings) expect(timing.delay + timing.duration).toBeLessThanOrEqual(1200);
    expect(seen.started).toEqual(projects.map((_, at) => at));
    expect(seen.shift).toBe(0);

    // Settled: nothing is left half-faded or off its place, and every card stands exactly where it stood.
    await entranceDone(page);
    const settled = await page.evaluate((selector) => [...document.querySelectorAll(`${selector} article[data-project]`)].map((element) => {
      const slot = getComputedStyle(element.parentElement as Element);
      return { opacity: slot.opacity, translate: slot.translate, animations: (element.parentElement as Element).getAnimations().length };
    }), SECTION);
    expect(settled).toEqual(projects.map(() => ({ opacity: '1', translate: 'none', animations: 0 })));
    const after = await places();
    for (const [at, box] of after.entries()) {
      expect(Math.abs(box.left - (before[at]?.left ?? 0))).toBeLessThan(0.5);
      expect(Math.abs(box.top - (before[at]?.top ?? 0))).toBeLessThan(0.5);
      expect(Math.abs(box.width - (before[at]?.width ?? 0))).toBeLessThan(0.5);
      expect(Math.abs(box.height - (before[at]?.height ?? 0))).toBeLessThan(0.5);
    }
  });

  test('scrolling away and back does not play it again', async ({ page }) => {
    await openWork(page, '/');
    const section = page.locator(SECTION);
    await expect(section).toHaveAttribute('data-entrance', 'armed');
    await scrollRailIn(page);
    await expect(section).toHaveAttribute('data-entrance', 'done');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect(page.locator(`${SECTION} article[data-project]`).first()).not.toBeInViewport();
    await page.evaluate(() => {
      const rail = document.querySelector('#work article[data-project]')?.closest('ul');
      if (rail) window.scrollTo({ top: rail.getBoundingClientRect().top + window.scrollY - window.innerHeight / 3, behavior: 'instant' });
    });
    await expect(page.locator(`${SECTION} article[data-project]`).first()).toBeInViewport();
    // The first frame of the second visit is the settled one: every card drawn, none running.
    const frame = await page.evaluate((selector) => ({
      running: document.getAnimations().filter((animation) => animation instanceof CSSAnimation && /arrive/.test(animation.animationName)).length,
      opacity: [...document.querySelectorAll(`${selector} article[data-project]`)].map((element) => getComputedStyle(element.parentElement as Element).opacity),
    }), SECTION);
    expect(frame.running).toBe(0);
    expect(frame.opacity).toEqual(projects.map(() => '1'));
    expect((await arrival(page)).plays).toBe(1);
  });

  test('a rail that is already on screen is not held back', async ({ page }) => {
    // A screen as tall as the page's first three: the rail is in view the moment the page loads.
    await page.setViewportSize({ width: 1440, height: 3200 });
    await openWork(page, '/');
    await expect(page.locator(`${SECTION} article[data-project]`).first()).toBeInViewport();
    await expect(page.locator(SECTION)).not.toHaveAttribute('data-entrance', /.+/);
    const opacity = await page.evaluate((selector) => [...document.querySelectorAll(`${selector} article[data-project]`)].map((element) => getComputedStyle(element.parentElement as Element).opacity), SECTION);
    expect(opacity).toEqual(projects.map(() => '1'));
  });
});

/** With a preference or the site's own control asking for less motion the rail is never held back, so the first frame is the settled one. */
async function restsAtOnce(page: Page, path: string): Promise<void> {
  await openWork(page, path);
  await scrollRailIn(page);
  const frame = await page.evaluate((selector) => ({
    state: document.querySelector(selector)?.getAttribute('data-entrance') ?? null,
    running: document.getAnimations().filter((animation) => animation instanceof CSSAnimation && /arrive/.test(animation.animationName)).length,
    opacity: [...document.querySelectorAll(`${selector} article[data-project]`)].map((element) => getComputedStyle(element.parentElement as Element).opacity),
  }), SECTION);
  expect(frame).toEqual({ state: null, running: 0, opacity: projects.map(() => '1') });
}

test.describe('the entrance with reduced motion', () => {
  test('there is none: the first frame is the settled state', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await restsAtOnce(page, '/');
  });
});

test.describe('the entrance with Motion off', () => {
  test('there is none: the first frame is the settled state', async ({ page }) => {
    await restsAtOnce(page, '/?motion=off');
  });
});

/**
 * What `owner` shows of the pointer at this moment: its transform, how deep the point of the card at
 * (`dx`, `dy`) from its centre has gone from the card's plane (negative is away from the viewer), and the
 * light on its border with where the card says it is.
 */
async function respond(owner: Locator, dx = 0, dy = 0) {
  return owner.evaluate(
    (element, offset) => {
      const style = getComputedStyle(element);
      const matrix = new DOMMatrix(style.transform === 'none' ? undefined : style.transform);
      const edge = getComputedStyle(element, '::after');
      return {
        transform: style.transform,
        depth: matrix.transformPoint(new DOMPoint(offset.dx, offset.dy, 0)).z,
        light: element.dataset.light ?? null,
        lightX: parseFloat(element.style.getPropertyValue('--light-x')),
        lightY: parseFloat(element.style.getPropertyValue('--light-y')),
        edge: { content: edge.content, opacity: edge.opacity, image: edge.backgroundImage },
      };
    },
    { dx, dy },
  );
}

/** Two frames of the page: whatever a pointer move was going to start has started. */
const afterFrames = (page: Page) => page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))));

/** The card scrolled into view, and where it stands once the rail has finished arriving (at rest, so this is the card as laid out). */
async function restingBox(owner: Locator) {
  await owner.scrollIntoViewIfNeeded();
  await expect(owner.page().locator(SECTION)).not.toHaveAttribute('data-entrance', /^(armed|play)$/);
  const box = await owner.boundingBox();
  if (!box) throw new Error('the card has no box');
  return box;
}

test.describe('the response of a card to a mouse', { tag: '@desktop' }, () => {
  test('it leans so that the part under the pointer sinks, follows the pointer, and a light follows it round the border', async ({ page }) => {
    await openWork(page, '/?gl=off');
    const owner = card(page, ralph.repo);
    const box = await restingBox(owner);
    expect((await respond(owner)).transform).toBe('none');
    expect((await respond(owner)).light).toBeNull();

    const upperLeft = { x: box.x + box.width * 0.2, y: box.y + box.height * 0.25 };
    await page.mouse.move(upperLeft.x, upperLeft.y, { steps: 3 });
    const dxA = upperLeft.x - (box.x + box.width / 2);
    const dyA = upperLeft.y - (box.y + box.height / 2);
    await expect.poll(async () => (await respond(owner, dxA, dyA)).depth).toBeLessThan(-0.5);
    const first = await respond(owner, dxA, dyA);
    expect(first.transform).not.toBe('none');
    expect(first.light).toBe('on');
    expect(first.lightX).toBeCloseTo(upperLeft.x - box.x, 0);
    expect(first.lightY).toBeCloseTo(upperLeft.y - box.y, 0);
    expect(first.edge.content).toBe('""');
    expect(first.edge.image).toContain('radial-gradient');
    await expect.poll(async () => (await respond(owner)).edge.opacity).toBe('1');

    // Across and down to the other corner: the lean turns the other way and the light has moved with the pointer.
    const lowerRight = { x: box.x + box.width * 0.8, y: box.y + box.height * 0.75 };
    await page.mouse.move(lowerRight.x, lowerRight.y, { steps: 6 });
    const dxB = lowerRight.x - (box.x + box.width / 2);
    const dyB = lowerRight.y - (box.y + box.height / 2);
    await expect.poll(async () => (await respond(owner, dxB, dyB)).depth).toBeLessThan(-0.5);
    const second = await respond(owner, dxB, dyB);
    expect(second.transform).not.toBe(first.transform);
    expect(second.lightX).toBeCloseTo(lowerRight.x - box.x, 0);
    expect(second.lightY).toBeCloseTo(lowerRight.y - box.y, 0);
    // What sank under the pointer a moment ago has come up.
    expect((await respond(owner, dxA, dyA)).depth).toBeGreaterThan(0);

    // It leans and nothing else of the page moves: the card takes the space it took.
    const space = await layoutSize(owner);
    expect(Math.abs((space?.width ?? 0) - box.width)).toBeLessThanOrEqual(1);
    expect(Math.abs((space?.height ?? 0) - box.height)).toBeLessThanOrEqual(1);
  });

  test('on leaving, the card springs back flat and the light fades out', async ({ page }) => {
    await openWork(page, '/?gl=off');
    const owner = card(page, aether.repo);
    const box = await restingBox(owner);
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.4, { steps: 3 });
    await expect.poll(async () => (await respond(owner)).transform).not.toBe('none');
    // The lean is at its place once the transform has not changed for a dozen frames.
    await page.evaluate(
      (selector) =>
        new Promise<void>((done) => {
          const element = document.querySelector(selector);
          let before = '';
          let still = 0;
          const look = () => {
            const now = element ? getComputedStyle(element).transform : '';
            still = now === before ? still + 1 : 0;
            before = now;
            if (still >= 12) done();
            else requestAnimationFrame(look);
          };
          look();
        }),
      `${SECTION} article[data-project="${aether.repo}"]`,
    );
    // From here every frame is written down until the card is flat, so that the way back is read from what it did.
    await owner.evaluate((element) => {
      const record = { turn: [] as number[], flat: false };
      Object.assign(window, { springBack: record });
      const look = () => {
        const transform = getComputedStyle(element).transform;
        record.turn.push(transform === 'none' ? 0 : Math.abs(new DOMMatrix(transform).m13));
        if (transform === 'none') record.flat = true;
        else requestAnimationFrame(look);
      };
      look();
    });
    await page.mouse.move(2, 2);
    await expect.poll(() => page.evaluate(() => (window as unknown as { springBack: { flat: boolean } }).springBack.flat)).toBe(true);
    const { turn } = await page.evaluate(() => (window as unknown as { springBack: { turn: number[] } }).springBack);
    const peak = Math.max(...turn);
    expect(peak, 'the card was leaning when the pointer left').toBeGreaterThan(0.02);
    // A spring and not a jump: several different angles on the way, each no larger than the one before (to a hair), ending flat.
    expect(new Set(turn).size).toBeGreaterThanOrEqual(4);
    turn.forEach((value, at) => expect(value).toBeLessThanOrEqual((turn[at - 1] ?? peak) + peak * 0.05));
    expect(turn.at(-1)).toBe(0);
    const after = await respond(owner);
    expect(after.transform).toBe('none');
    expect(after.light).toBeNull();
    await expect.poll(async () => (await respond(owner)).edge.opacity).toBe('0');
  });

  test('pressing flattens the card at once, and the next movement leans it again', async ({ page }) => {
    await openWork(page, '/?gl=off');
    const owner = card(page, jyotish.repo);
    const box = await restingBox(owner);
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.3, { steps: 3 });
    await expect.poll(async () => (await respond(owner)).transform).not.toBe('none');
    await page.mouse.down();
    await expect.poll(async () => (await respond(owner)).transform).toBe('none');
    await page.mouse.up();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.35, { steps: 2 });
    await expect.poll(async () => (await respond(owner)).transform).not.toBe('none');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  });

  for (const [name, path, reduce] of [
    ['reduced motion', '/?gl=off', true],
    ['Motion off', '/?gl=off&motion=off', false],
  ] as const) {
    test(`with ${name} a mouse over a card changes nothing: no lean, no light`, async ({ page }) => {
      if (reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
      await openWork(page, path);
      const owner = card(page, aether.repo);
      const box = await restingBox(owner);
      await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3, { steps: 4 });
      await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.6, { steps: 4 });
      await afterFrames(page);
      await afterFrames(page);
      const now = await respond(owner);
      expect(now.transform).toBe('none');
      expect(now.light).toBeNull();
      expect(now.edge.content).toBe('none');
    });
  }

  test('the lean and the light stop the moment Motion is turned off', async ({ page }) => {
    await openWork(page, '/?gl=off');
    const owner = card(page, ralph.repo);
    const box = await restingBox(owner);
    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.3, { steps: 3 });
    await expect.poll(async () => (await respond(owner)).transform).not.toBe('none');
    await page.evaluate(() => {
      document.documentElement.dataset.motion = 'off';
    });
    await expect.poll(async () => (await respond(owner)).transform).toBe('none');
    const now = await respond(owner);
    expect(now.light).toBeNull();
    expect(now.edge.content).toBe('none');
  });
});

test.describe('the response of a card on a touch screen', { tag: '@mobile' }, () => {
  test('a tap, and even a mouse event, leave the card flat and without a light', async ({ page }) => {
    await openWork(page, '/?gl=off');
    const owner = card(page, jyotish.repo);
    const box = await restingBox(owner);
    await owner.locator('[data-schematic] button').tap();
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3, { steps: 3 });
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5, { steps: 3 });
    await afterFrames(page);
    await afterFrames(page);
    const now = await respond(owner);
    expect(now.transform).toBe('none');
    expect(now.light).toBeNull();
    expect(now.edge.content).toBe('none');
  });
});

test.describe('focus on a card', { tag: '@desktop' }, () => {
  test('keyboard focus shows the accent ring on all four sides of each of its controls, above the light layer', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await openWork(page, '/');
    const owner = card(page, aether.repo);
    await restingBox(owner);
    const accent = await page.evaluate(() => {
      const probe = document.createElement('i');
      probe.style.color = 'var(--accent)';
      document.body.append(probe);
      const colour = getComputedStyle(probe).color;
      probe.remove();
      return (colour.match(/\d+/g) ?? []).slice(0, 3).map(Number);
    });
    // The ring is 2 px wide: `inside` is where its middle lies measured in from the control's edge, a pixel that is wholly ring.
    for (const [control, inside] of [
      [owner.locator('[data-schematic] button'), 2],
      [owner.locator('[data-detail-trigger]'), 1],
    ] as const) {
      await page.keyboard.press('Shift');
      await control.focus();
      await expect(control).toBeFocused();
      const box = await control.boundingBox();
      if (!box) throw new Error('the control has no box');
      const { data, info } = await sharp(await page.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      const sides = {
        left: { x: box.x + inside, y: centre.y },
        right: { x: box.x + box.width - inside, y: centre.y },
        top: { x: centre.x, y: box.y + inside },
        bottom: { x: centre.x, y: box.y + box.height - inside },
      };
      for (const [side, point] of Object.entries(sides)) {
        const at = (Math.floor(point.y) * info.width + Math.floor(point.x)) * info.channels;
        const pixel = [data[at], data[at + 1], data[at + 2]];
        const off = Math.max(...pixel.map((value, channel) => Math.abs((value ?? 0) - (accent[channel] ?? 0))));
        expect(off, `the ${side} side of the ring, ${pixel.join(',')} against the accent ${accent.join(',')}`).toBeLessThanOrEqual(24);
      }
    }
  });
});
