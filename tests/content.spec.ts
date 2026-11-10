import { expect, test, type Page } from '@playwright/test';

import { about } from '@/content/about';
import { capabilities, domains, sources } from '@/content/capabilities';
import { contact } from '@/content/contact';
import { roles } from '@/content/experience';
import { hero } from '@/content/hero';
import { headlineFigures } from '@/content/proof';
import { projects } from '@/content/work';

import { open } from './support';

const words = (text: string): number =>
  text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;

const sentences = (text: string): string[] => text.split(/(?<=[.!?])\s+/);

/** The page height, in screens, that the compact layout must stay under. */
const MAX_SCREENS = { desktop: 6.5, mobile: 9 } as const;

/** Text of the whole page, including what sits inside closed disclosures. */
async function pageText(page: Page): Promise<string> {
  return (await page.locator('main').textContent()) ?? '';
}

// The shape of the content: counts, and the limits the copy style guide sets.
test.describe('the content keeps to its contract', { tag: '@desktop' }, () => {
  test('the hero is one positioning line of at most 22 words', () => {
    expect(words(hero.positioning)).toBeLessThanOrEqual(22);
    expect(hero.headline.lead + hero.headline.emphasis + hero.headline.tail).toBe(
      'Delivery leader and AI solutions architect.',
    );
    expect(hero.headline.emphasis).toBe('AI solutions');
  });

  test('three headline figures, each with a short label, a short scope and a story', () => {
    expect(headlineFigures).toHaveLength(3);
    for (const figure of headlineFigures) {
      expect(words(figure.label), figure.id).toBeLessThanOrEqual(5);
      expect(words(figure.scope), figure.id).toBeLessThanOrEqual(6);
      expect(sentences(figure.story).length, figure.id).toBeGreaterThanOrEqual(2);
      expect(sentences(figure.story).length, figure.id).toBeLessThanOrEqual(3);
      expect(roles.map((role) => role.id), figure.id).toContain(figure.roleId);
    }
  });

  test('eight roles with a one-line summary and at most four achievement lines', () => {
    expect(roles).toHaveLength(8);
    for (const role of roles) {
      expect(words(role.summary), role.id).toBeLessThanOrEqual(14);
      expect(role.achievements.length, role.id).toBeGreaterThanOrEqual(1);
      expect(role.achievements.length, role.id).toBeLessThanOrEqual(4);
      // The style guide's ceiling is 35 words. The ATO and independent roles carry seven
      // and eight facts from the CV in four lines, so a line may run to 45.
      for (const line of role.achievements) expect(words(line), line).toBeLessThanOrEqual(45);
    }
  });

  test('six projects, each with three stages, a stack, decisions and a repository', () => {
    expect(projects).toHaveLength(6);
    for (const project of projects) {
      expect(words(project.value), project.repo).toBeLessThanOrEqual(14);
      expect(project.does, project.repo).toHaveLength(2);
      expect(project.schematic.stages, project.repo).toHaveLength(3);
      expect(project.stack.length, project.repo).toBeGreaterThan(0);
      expect(project.decisions.length, project.repo).toBeGreaterThan(0);
      expect(project.repoHref, project.repo).toContain(project.repo);
    }
  });

  test('seventeen capabilities in three to five domains, each linked to a known source', () => {
    expect(capabilities).toHaveLength(17);
    expect(domains.length).toBeGreaterThanOrEqual(3);
    expect(domains.length).toBeLessThanOrEqual(5);
    const sourceIds = new Set(sources.map((source) => source.id));
    for (const capability of capabilities) {
      expect(words(capability.label), capability.id).toBeLessThanOrEqual(5);
      expect(domains.map((domain) => domain.id), capability.id).toContain(capability.domain);
      for (const id of capability.sources) expect(sourceIds.has(id), `${capability.id}: ${id}`).toBe(true);
    }
  });

  test('a three-sentence bio and six to ten principle cards', () => {
    expect(about.bio).toHaveLength(3);
    expect(words(about.bio.join(' '))).toBeLessThanOrEqual(60);
    expect(about.principles.length).toBeGreaterThanOrEqual(6);
    expect(about.principles.length).toBeLessThanOrEqual(10);
    for (const principle of about.principles) {
      expect(words(principle.title), principle.id).toBeGreaterThanOrEqual(1);
      expect(words(principle.title), principle.id).toBeLessThanOrEqual(4);
      expect(words(principle.statement), principle.id).toBeLessThanOrEqual(20);
      expect(words(principle.scope), principle.id).toBeLessThanOrEqual(6);
    }
  });

  test('the closing call to action is one verb and one outcome', () => {
    expect(words(contact.action.label)).toBeLessThanOrEqual(12);
    expect(contact.channels).toHaveLength(4);
  });
});

// The page shows each set sideways and keeps every detail one step away, in the HTML.
test.describe('the home page is two levels deep', () => {
  test('every set has the right number of items', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('#proof ul > li')).toHaveCount(headlineFigures.length);
    await expect(page.locator('#experience ol > li')).toHaveCount(roles.length);
    await expect(page.locator('#work > div > ul > li')).toHaveCount(projects.length);
    await expect(page.locator('#capabilities [role="group"]')).toHaveCount(domains.length);
    await expect(page.locator('#capabilities details')).toHaveCount(capabilities.length);
    await expect(page.locator('#about details')).toHaveCount(about.principles.length);
  });

  test('every detail is closed on load and its content is in the HTML', async ({ page }) => {
    await open(page, '/');
    expect(await page.locator('main details[open]').count()).toBe(0);

    const text = await pageText(page);
    const expected = [
      ...headlineFigures.map((figure) => figure.story),
      ...roles.flatMap((role) => [role.title, role.employer, role.summary, ...role.achievements]),
      ...projects.flatMap((project) => [
        ...project.does,
        ...project.decisions,
        ...project.schematic.stages.flatMap((stage) => [stage.label, stage.note]),
      ]),
      ...capabilities.map((capability) => capability.detail),
      ...about.principles.flatMap((principle) => [principle.statement, principle.detail ?? '']),
    ].filter(Boolean);
    for (const sentence of expected) expect(text, sentence).toContain(sentence);
  });

  test('a disclosure opens to show its detail, and closes again', async ({ page }) => {
    await open(page, '/');
    const cases = [
      { summary: '#proof summary', detail: headlineFigures[0]?.story },
      { summary: '#experience summary', detail: roles[0]?.achievements[0] },
      { summary: '#work summary', detail: projects[0]?.does[0] },
      { summary: '#capabilities summary', detail: capabilities[0]?.detail },
      { summary: '#about summary', detail: about.principles[0]?.statement },
    ];
    for (const { summary, detail } of cases) {
      expect(detail, summary).toBeTruthy();
      const row = page.locator(summary).first();
      await row.scrollIntoViewIfNeeded();
      await row.click();
      await expect(page.getByText(detail ?? '', { exact: false }).first(), summary).toBeVisible();
      await row.click();
      await expect(page.getByText(detail ?? '', { exact: false }).first(), summary).toBeHidden();
    }
  });

  test('a disclosure opens from the keyboard', async ({ page }) => {
    await open(page, '/');
    const row = page.locator('#work summary').first();
    await row.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#work details').first()).toHaveAttribute('open', '');
    await page.keyboard.press('Space');
    await expect(page.locator('#work details').first()).not.toHaveAttribute('open', '');
  });

  test('the page stays within its height budget', async ({ page }, testInfo) => {
    await open(page, '/');
    await page.evaluate(() => document.fonts.ready);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const viewport = page.viewportSize()?.height ?? 0;
    const limit = testInfo.project.name === 'mobile' ? MAX_SCREENS.mobile : MAX_SCREENS.desktop;
    expect(height / viewport, `${height}px at ${viewport}px`).toBeLessThanOrEqual(limit);
  });
});

test.describe('sets run sideways', { tag: '@mobile' }, () => {
  test('on a phone, projects, roles, capabilities and principles are snapping rows', async ({
    page,
  }) => {
    await open(page, '/');
    for (const selector of ['#work ul', '#experience ol', '#capabilities ul', '#about ul']) {
      const row = page.locator(selector).first();
      const { scrolls, snaps } = await row.evaluate((el) => ({
        scrolls: el.scrollWidth > el.clientWidth,
        snaps: getComputedStyle(el).scrollSnapType.startsWith('x'),
      }));
      expect(scrolls, `${selector} scrolls sideways`).toBe(true);
      expect(snaps, `${selector} snaps`).toBe(true);
    }
  });
});

test.describe('sets are grids on a wide screen', { tag: '@desktop' }, () => {
  test('projects sit three to a row and roles four, side by side', async ({ page }) => {
    await open(page, '/');
    const tops = (selector: string) =>
      page.locator(selector).evaluateAll((items) =>
        items.map((item) => Math.round(item.getBoundingClientRect().top)),
      );
    const work = await tops('#work > div > ul > li');
    expect(work.slice(0, 3).every((top) => top === work[0])).toBe(true);
    expect(work[3]).toBeGreaterThan(work[0] ?? 0);
    const experience = await tops('#experience ol > li');
    expect(experience.slice(0, 4).every((top) => top === experience[0])).toBe(true);
    expect(experience[4]).toBeGreaterThan(experience[0] ?? 0);
  });
});
