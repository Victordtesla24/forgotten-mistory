import { expect, test, type Page } from '@playwright/test';

import { projects } from '@/content/work';
import { schematicLayout } from '@/lib/schematic';

import { open, visibleWordCounts, watchConsole } from './support';

const SECTION = '#work';

/** Opens a path and waits until the section's behaviour (loaded after the page) has set the cards and panels up. */
async function openWork(page: Page, path: string): Promise<void> {
  await open(page, path);
  await expect(page.locator(`${SECTION}[data-interactive="true"]`)).toBeAttached();
}
const card = (page: Page, repo: string) => page.locator(`${SECTION} article[data-project="${repo}"]`);
const panelId = (repo: string) => `project-${repo}-detail`;

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
    const size = async () => owner.boundingBox().then((box) => ({ width: box?.width, height: box?.height }));
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
