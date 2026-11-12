import { expect, test, type Page } from '@playwright/test';

import { capabilities, domains, sources } from '@/content/capabilities';
import { roles } from '@/content/experience';
import { projects } from '@/content/work';

import { open, visibleWordCounts } from './support';

const SECTION = '#capabilities';

/** The edges the content states: each capability to its domain, and each to the sources it names. */
const domainEdges = capabilities.length;
const sourceEdges = capabilities.reduce((sum, capability) => sum + capability.sources.length, 0);

/** The laptop and desktop sizes at which the section is one screen. */
const WIDE = [
  [1280, 720],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
] as const;

const panelId = (id: string) => `capability-${id}`;
const trigger = (page: Page, id: string) => page.locator(`${SECTION} [data-node="capability"][data-capability="${id}"]`);
const [firstCapability] = capabilities;
if (!firstCapability) throw new Error('content/capabilities.ts has no capabilities');

/** Opens a path and waits for the fonts, so that what is measured is the settled drawing. */
async function openSettled(page: Page, path: string): Promise<void> {
  await open(page, path);
  await page.evaluate(() => document.fonts.ready);
}

test.describe('the map', { tag: '@desktop' }, () => {
  test('draws the five domains, seventeen capabilities, twelve sources and exactly the edges the content states', async ({ page }) => {
    await openSettled(page, '/');
    const field = page.locator(`${SECTION} svg[data-field]`);
    await expect(field).toBeVisible();
    await expect(field).toHaveAttribute('data-domains', String(domains.length));
    await expect(field).toHaveAttribute('data-capabilities', String(capabilities.length));
    await expect(field).toHaveAttribute('data-sources', String(sources.length));
    await expect(field).toHaveAttribute('data-edges', String(domainEdges + sourceEdges));
    await expect(field.locator('[data-node="domain"]')).toHaveCount(domains.length);
    await expect(field.locator('[data-node="capability"]')).toHaveCount(capabilities.length);
    await expect(field.locator('[data-node="source"]')).toHaveCount(sources.length);
    await expect(field.locator('path[data-edge="domain"]')).toHaveCount(domainEdges);
    await expect(field.locator('path[data-edge="source"]')).toHaveCount(sourceEdges);

    const drawn = await field.locator('path[data-edge="source"]').evaluateAll((paths) =>
      paths.map((path) => `${path.getAttribute('data-capability')}>${path.getAttribute('data-source')}`).sort(),
    );
    const stated = capabilities.flatMap((capability) => capability.sources.map((source) => `${capability.id}>${source}`)).sort();
    expect(drawn).toEqual(stated);

    // The capability that names no source has no edge to the right and a hollow mark.
    const pending = capabilities.filter((capability) => capability.sources.length === 0);
    expect(pending.map((capability) => capability.id)).toEqual(['cloud-certification']);
    await expect(field.locator('path[data-edge="source"][data-capability="cloud-certification"]')).toHaveCount(0);
    await expect(trigger(page, 'cloud-certification').locator('circle[data-part="pending"]')).toHaveCount(1);
    await expect(page.locator(`${SECTION} [data-map] ul[aria-label="Key"]`)).toContainText('In progress');
    await expect(page.locator(`${SECTION} svg line`)).toHaveCount(0);
  });

  for (const [width, height] of WIDE) {
    test(`is one screen with the heading, the filters and the whole map at ${width}x${height}, its labels clear of each other and of every edge`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openSettled(page, '/');
      const measured = await page.evaluate((selector) => {
        const section = document.querySelector(selector) as HTMLElement;
        const field = section.querySelector('svg[data-field]') as SVGSVGElement;
        const scale = field.getBoundingClientRect().width / field.viewBox.baseVal.width;
        const labels = Array.from(field.querySelectorAll<SVGTextElement>('text')).map((text) => {
          const box = text.getBBox();
          return { name: text.textContent ?? '', x: box.x, y: box.y, width: box.width, height: box.height, size: parseFloat(getComputedStyle(text).fontSize) * scale };
        });
        const overlap = (a: (typeof labels)[number], b: (typeof labels)[number]) =>
          a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
        const overlapping: string[] = [];
        labels.forEach((a, i) => labels.slice(i + 1).forEach((b) => overlap(a, b) && overlapping.push(`${a.name} / ${b.name}`)));
        const crossing: string[] = [];
        for (const path of Array.from(field.querySelectorAll<SVGPathElement>('path[data-edge]'))) {
          const length = path.getTotalLength();
          for (let at = 0; at <= length; at += 2) {
            const point = path.getPointAtLength(at);
            const hit = labels.find((label) => point.x > label.x && point.x < label.x + label.width && point.y > label.y && point.y < label.y + label.height);
            if (hit) {
              crossing.push(`${path.getAttribute('data-capability')} through ${hit.name}`);
              break;
            }
          }
        }
        const heading = section.querySelector('h2')?.getBoundingClientRect();
        const filters = section.querySelector('fieldset')?.getBoundingClientRect();
        const box = section.getBoundingClientRect();
        const key = section.querySelector('ul[aria-label="Key"]')?.getBoundingClientRect();
        const mapBox = field.getBoundingClientRect();
        return {
          section: box.height,
          heading: heading ? { top: heading.top - box.top, bottom: heading.bottom - box.top } : null,
          filters: filters ? { bottom: filters.bottom - box.top } : null,
          field: { bottom: mapBox.bottom - box.top, left: mapBox.left, right: mapBox.right },
          key: key ? { bottom: key.bottom - box.top } : null,
          smallest: Math.min(...labels.map((label) => label.size)),
          labels: labels.length,
          overlapping,
          crossing,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      }, SECTION);
      expect(measured.labels).toBe(domains.length + capabilities.length);
      expect(measured.overlapping, 'labels that overlap').toEqual([]);
      expect(measured.crossing, 'edges through a label').toEqual([]);
      expect(measured.smallest, 'smallest label on screen, in px').toBeGreaterThanOrEqual(13);
      expect(measured.section, `section height at ${height} px`).toBeLessThanOrEqual(height);
      expect(measured.heading?.bottom ?? Infinity).toBeLessThan(measured.filters?.bottom ?? 0);
      expect(measured.key?.bottom ?? Infinity).toBeLessThanOrEqual(measured.section);
      expect(measured.field.left).toBeGreaterThanOrEqual(0);
      expect(measured.field.right).toBeLessThanOrEqual(width);
      expect(measured.overflow).toBeLessThanOrEqual(0);
    });
  }

  test('keeps its words to the headings, the filters, the labels and a four-word key', async ({ page }) => {
    await openSettled(page, '/');
    const counts = await visibleWordCounts(page, ['capabilities']);
    // 1 eyebrow + 7 heading + 6 filters (All and the five domains, 11 words) + the 5 domains again (10) + 17 labels (53) + the key (5).
    expect(counts.capabilities).toBeLessThanOrEqual(87);
  });

  test('the filters dim what is outside the chosen domain, and All brings it back', async ({ page }) => {
    await openSettled(page, '/');
    const opacity = (selector: string) => page.locator(selector).first().evaluate((element) => getComputedStyle(element).opacity);
    const ai = capabilities.find((capability) => capability.domain === 'ai');
    const platform = capabilities.find((capability) => capability.domain === 'platform');
    if (!ai || !platform) throw new Error('content/capabilities.ts has lost a domain');
    await page.getByRole('radio', { name: 'AI systems' }).check();
    await expect.poll(() => opacity(`${SECTION} [data-node="capability"][data-capability="${platform.id}"]`)).toBe('0.2');
    expect(await opacity(`${SECTION} [data-node="capability"][data-capability="${ai.id}"]`)).toBe('1');
    await page.getByRole('radio', { name: 'All' }).check();
    await expect.poll(() => opacity(`${SECTION} [data-node="capability"][data-capability="${platform.id}"]`)).toBe('1');
  });
});

test.describe('the panel', { tag: '@desktop' }, () => {
  test('a capability opens with its own part of the map, its detail and its sources, and the address names it', async ({ page }) => {
    await openSettled(page, '/');
    const capability = capabilities.find((entry) => entry.id === 'llm-evaluation');
    if (!capability) throw new Error('llm-evaluation is gone');
    await trigger(page, capability.id).click();
    const dialog = page.getByRole('dialog', { name: capability.label });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`#${panelId(capability.id)}$`));
    const lead = dialog.locator('[data-detail-item][data-active="true"] svg[data-subgraph]');
    await expect(lead).toHaveAttribute('data-sources', String(capability.sources.length));
    for (const id of capability.sources) {
      const source = sources.find((entry) => entry.id === id);
      await expect(lead.locator(`[data-source="${id}"]`).first()).toBeAttached();
      await expect(dialog.locator('[data-detail-item][data-active="true"]').getByText(source?.label ?? '', { exact: true }).last()).toBeVisible();
    }
    await expect(dialog.getByText(capability.detail, { exact: false })).toBeVisible();
  });

  test('Escape, the back button and the close button close it and put focus back on the capability', async ({ page }) => {
    await openSettled(page, '/');
    const target = trigger(page, 'telemetry');
    await target.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Real-time telemetry' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(target).toBeFocused();
    await expect(page).not.toHaveURL(/#capability-/);

    await target.click();
    await expect(dialog).toBeVisible();
    await page.goBack();
    await expect(dialog).toBeHidden();

    await target.click();
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
    await expect(target).toBeFocused();
  });

  test('a deep link opens it, and previous and next walk the seventeen without closing', async ({ page }) => {
    await openSettled(page, `/#${panelId('portfolio')}`);
    const portfolio = capabilities.find((entry) => entry.id === 'portfolio');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: portfolio?.label ?? '' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Next' }).click();
    await expect(dialog.getByRole('heading', { name: capabilities[2]?.label ?? '' })).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(dialog.getByRole('heading', { name: portfolio?.label ?? '' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Previous' }).click();
    await expect(dialog.getByRole('heading', { name: firstCapability.label })).toBeVisible();
    await expect(dialog.getByText(`1 / ${capabilities.length}`)).toBeVisible();
  });

  test('a source with a role or a project opens that panel; a source without one is plain text', async ({ page }) => {
    await openSettled(page, `/#${panelId('agile-delivery')}`);
    const dialog = page.getByRole('dialog', { name: firstCapability.label });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('link', { name: /ATO Payday Super/ }).click();
    const role = roles.find((entry) => entry.id === 'ato');
    await expect(page.getByRole('dialog', { name: role?.title ?? '' })).toBeVisible();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/#role-ato-detail$/);

    await page.goBack();
    await expect(dialog).toBeVisible();

    await page.evaluate((id) => {
      window.location.hash = id;
    }, panelId('multi-agent'));
    const multi = page.getByRole('dialog', { name: 'Multi-agent systems' });
    await expect(multi).toBeVisible();
    await multi.getByRole('link', { name: /aether-job-career-agent/ }).click();
    await expect(page.getByRole('dialog', { name: projects[0]?.name ?? '' })).toBeVisible();

    for (const source of sources.filter((entry) => !entry.link)) {
      const owner = capabilities.find((capability) => capability.sources.includes(source.id));
      await page.evaluate((id) => {
        window.location.hash = id;
      }, panelId(owner?.id ?? ''));
      const unlinked = page.getByRole('dialog', { name: owner?.label ?? '' });
      await expect(unlinked).toBeVisible();
      await expect(unlinked.locator('[data-detail-item][data-active="true"] li').getByText(source.label, { exact: true })).toBeVisible();
      await expect(unlinked.getByRole('link', { name: new RegExp(source.label) })).toHaveCount(0);
    }
  });

  test('every capability has a panel with its id, and no id on the page is used twice', async ({ page }) => {
    await openSettled(page, '/');
    for (const capability of capabilities) await expect(page.locator(`section#${panelId(capability.id)}`)).toHaveCount(1);
    const duplicates = await page.evaluate(() => {
      const seen = new Map<string, number>();
      for (const element of Array.from(document.querySelectorAll('[id]'))) seen.set(element.id, (seen.get(element.id) ?? 0) + 1);
      return [...seen].filter(([, count]) => count > 1).map(([id]) => id);
    });
    expect(duplicates).toEqual([]);
  });
});

test.describe('without script', { tag: '@desktop' }, () => {
  for (const [width, height] of [
    [1280, 720],
    [1440, 900],
  ] as const) {
    test(`the map is drawn and every capability, its detail and its sources are on the page, inside the gutters, at ${width}x${height}`, async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height } });
      const page = await context.newPage();
      await page.goto('/');
      await expect(page.locator(`${SECTION} svg[data-field] path[data-edge]`)).toHaveCount(domainEdges + sourceEdges);
      await expect(page.locator(`${SECTION} svg[data-field]`)).toBeVisible();
      for (const capability of capabilities) {
        const item = page.locator(`${SECTION} section#${panelId(capability.id)}`);
        await expect(item, capability.id).toBeVisible();
        await expect(item.getByText(capability.detail, { exact: false })).toBeVisible();
        for (const id of capability.sources) {
          const label = sources.find((entry) => entry.id === id)?.label ?? '';
          await expect(item.locator('li').getByText(label, { exact: true }), `${capability.id}: ${label}`).toBeVisible();
        }
      }
      const outside = await page.evaluate((selector) => {
        const width = document.documentElement.clientWidth;
        return Array.from(document.querySelectorAll<HTMLElement>(`${selector} [data-detail-item] *`))
          .map((element) => element.getBoundingClientRect())
          .filter((box) => box.width > 0 && (box.left < 0 || box.right > width)).length;
      }, SECTION);
      expect(outside).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      await context.close();
    });
  }
});

test.describe('below 1024 px', { tag: '@mobile' }, () => {
  test('the five cards of disclosures stand where the map does not, with no id used twice', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator(`${SECTION} svg[data-field]`)).toBeHidden();
    await expect(page.locator(`${SECTION} [data-interim] [role="group"]`)).toHaveCount(domains.length);
    await expect(page.locator(`${SECTION} [data-interim] details`)).toHaveCount(capabilities.length);
    const row = page.locator(`${SECTION} [data-interim] summary`).first();
    await row.scrollIntoViewIfNeeded();
    await row.click();
    await expect(page.locator(`${SECTION} [data-interim]`).getByText(firstCapability.detail, { exact: false }).first()).toBeVisible();
    const duplicates = await page.evaluate(() => {
      const seen = new Map<string, number>();
      for (const element of Array.from(document.querySelectorAll('[id]'))) seen.set(element.id, (seen.get(element.id) ?? 0) + 1);
      return [...seen].filter(([, count]) => count > 1).map(([id]) => id);
    });
    expect(duplicates).toEqual([]);
  });
});
