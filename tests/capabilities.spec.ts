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
    await expect(page.locator(`${SECTION} ul[aria-label="Key"]`)).toContainText('In progress');
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
        const filters = section.querySelector('[data-filters="wide"]')?.getBoundingClientRect();
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

  test('the filters are buttons, exactly one pressed, and the field dims what is outside the chosen domain until All brings it back', async ({ page }) => {
    await openSettled(page, '/');
    const filters = page.locator(`${SECTION} [data-filters="wide"] button`);
    await expect(filters).toHaveCount(domains.length + 1);
    const pressed = () => filters.evaluateAll((buttons) => buttons.filter((button) => button.getAttribute('aria-pressed') === 'true').map((button) => button.textContent));
    expect(await pressed()).toEqual(['All']);
    const opacity = (selector: string) => page.locator(selector).first().evaluate((element) => getComputedStyle(element).opacity);
    const ai = capabilities.find((capability) => capability.domain === 'ai');
    const platform = capabilities.find((capability) => capability.domain === 'platform');
    if (!ai || !platform) throw new Error('content/capabilities.ts has lost a domain');
    await page.getByRole('button', { name: 'AI systems', pressed: false }).click();
    expect(await pressed()).toEqual(['AI systems']);
    await expect.poll(() => opacity(`${SECTION} [data-node="capability"][data-capability="${platform.id}"]`)).toBe('0.2');
    expect(await opacity(`${SECTION} [data-node="capability"][data-capability="${ai.id}"]`)).toBe('1');
    await page.getByRole('button', { name: 'All' }).click();
    expect(await pressed()).toEqual(['All']);
    await expect.poll(() => opacity(`${SECTION} [data-node="capability"][data-capability="${platform.id}"]`)).toBe('1');
  });

  test('choosing a domain re-forms the field within 400 ms and shifts nothing on the page', async ({ page }) => {
    await openSettled(page, '/');
    const before = await page.evaluate((selector) => (document.querySelector(selector) as HTMLElement).getBoundingClientRect().top + scrollY, `${SECTION} svg[data-field]`);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.evaluate(() => {
      const shifts: number[] = [];
      new PerformanceObserver((list) => list.getEntries().forEach((entry) => shifts.push((entry as PerformanceEntry & { value: number }).value))).observe({ type: 'layout-shift', buffered: false });
      (window as unknown as { __shifts: number[] }).__shifts = shifts;
    });
    // The moment the section stops saying it is forming, read where the change happens and not from a frame loop, which a busy machine delays.
    const duration = await page.evaluate(
      (selector) =>
        new Promise<number>((resolve) => {
          const section = document.querySelector(selector) as HTMLElement;
          const button = Array.from(section.querySelectorAll<HTMLButtonElement>('[data-filters="wide"] button')).find((entry) => entry.dataset.filter === 'platform') as HTMLButtonElement;
          const began = performance.now();
          new MutationObserver((_, observer) => {
            if (section.hasAttribute('data-forming')) return;
            observer.disconnect();
            resolve(performance.now() - began);
          }).observe(section, { attributes: true, attributeFilter: ['data-forming'] });
          button.click();
        }),
      SECTION,
    );
    expect(duration, 're-forming time, in ms').toBeLessThanOrEqual(400);
    expect(duration, 'it moves, then settles').toBeGreaterThan(0);
    const shifts = await page.evaluate(() => (window as unknown as { __shifts: number[] }).__shifts.reduce((sum, value) => sum + value, 0));
    expect(shifts, 'layout shift while the field re-forms').toBe(0);
    expect(await page.evaluate((selector) => (document.querySelector(selector) as HTMLElement).getBoundingClientRect().top + scrollY, `${SECTION} svg[data-field]`)).toBe(before);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(height);
  });

  for (const [label, path, reduce] of [
    ['reduced motion', '/', true],
    ['?motion=off', '/?motion=off', false],
  ] as const) {
    test(`under ${label} a filter changes the field at once`, async ({ page }) => {
      if (reduce) await page.emulateMedia({ reducedMotion: 'reduce' });
      await openSettled(page, path);
      const state = await page.evaluate((selector) => {
        const section = document.querySelector(selector) as HTMLElement;
        const button = Array.from(section.querySelectorAll<HTMLButtonElement>('[data-filters="wide"] button')).find((entry) => entry.dataset.filter === 'ai') as HTMLButtonElement;
        button.click();
        const platform = section.querySelector('[data-node="capability"][data-domain="platform"]') as SVGElement;
        return { opacity: getComputedStyle(platform).opacity, forming: section.hasAttribute('data-forming') };
      }, SECTION);
      expect(state).toEqual({ opacity: '0.2', forming: false });
    });
  }
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
  const chips = (page: Page) => page.locator(`${SECTION} [data-filters="narrow"] button`);
  const shown = (page: Page) => page.locator(`${SECTION} [data-group][data-shown]`);

  test('the filters are a snapping row of the five domains with no All, one domain shows at a time and choosing another re-forms the field', async ({ page }) => {
    await open(page, '/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(`${SECTION} svg[data-field]`)).toBeHidden();
    await expect(page.locator(`${SECTION} [data-filters="wide"]`)).toBeHidden();
    await expect(chips(page)).toHaveCount(domains.length);
    await expect(page.getByRole('button', { name: 'All', exact: true })).toHaveCount(0);
    const row = page.locator(`${SECTION} [data-filters="narrow"]`);
    expect(await row.evaluate((el) => ({ scrolls: el.scrollWidth > el.clientWidth, snaps: getComputedStyle(el).scrollSnapType.startsWith('x') }))).toEqual({ scrolls: true, snaps: true });

    for (const domain of domains) {
      const inDomain = capabilities.filter((capability) => capability.domain === domain.id);
      await page.getByRole('button', { name: domain.name, exact: true }).click();
      await expect(page.getByRole('button', { name: domain.name, exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(chips(page).and(page.locator('[aria-pressed="true"]'))).toHaveCount(1);
      // The field has re-formed when the section has stopped saying so; until then the old domain is leaving as the new one arrives.
      await expect(page.locator(`${SECTION}[data-filter="${domain.id}"]:not([data-forming])`)).toHaveCount(1);
      await expect(shown(page)).toHaveCount(1);
      await expect(shown(page)).toHaveAttribute('data-group', domain.id);
      const group = page.locator(`${SECTION} [data-group="${domain.id}"]`);
      await expect(group.locator('[data-column="capabilities"] a')).toHaveCount(inDomain.length);
      for (const capability of inDomain) await expect(group.getByRole('link', { name: new RegExp(`^${capability.label.replace(/[()]/g, '\\$&')}`) })).toBeVisible();
      const stated = new Set(inDomain.flatMap((capability) => capability.sources));
      await expect(group.locator('[data-column="sources"] li')).toHaveCount(stated.size);
      await expect(group.locator('path[data-part="edge"]')).toHaveCount(inDomain.reduce((sum, capability) => sum + capability.sources.length, 0));
      await expect(page.locator(`${SECTION} [data-group]:not([data-shown])`)).toHaveCount(domains.length - 1);
    }
  });

  test('every edge ends on the row it joins, to the pixel, and the page does not move when the domain changes', async ({ page }) => {
    await open(page, '/');
    await page.evaluate(() => document.fonts.ready);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (const domain of domains) {
      await page.getByRole('button', { name: domain.name, exact: true }).click();
      await expect(page.locator(`${SECTION}[data-filter="${domain.id}"]:not([data-forming])`)).toHaveCount(1);
      const off = await page.evaluate((id) => {
        const group = document.querySelector(`#capabilities [data-group="${id}"]`) as HTMLElement;
        const edges = group.querySelector('svg[data-part="edges"]') as SVGSVGElement;
        const box = edges.getBoundingClientRect();
        const scale = box.width / edges.viewBox.baseVal.width;
        return Array.from(edges.querySelectorAll<SVGPathElement>('path')).flatMap((path) => {
          const start = path.getPointAtLength(0);
          const end = path.getPointAtLength(path.getTotalLength());
          const from = group.querySelector(`[data-column="capabilities"] a[data-capability="${path.dataset.capability}"]`)?.getBoundingClientRect();
          const to = group.querySelector(`[data-column="sources"] li[data-source="${path.dataset.source}"]`)?.getBoundingClientRect();
          if (!from || !to) return [`${path.dataset.capability}: missing`];
          const problems: string[] = [];
          if (Math.abs(box.top + start.y - (from.top + from.height / 2)) > 1) problems.push(`${path.dataset.capability} starts off its row`);
          if (Math.abs(box.top + end.y - (to.top + to.height / 2)) > 1) problems.push(`${path.dataset.source} is off the end of its edge`);
          if (Math.abs(box.left + start.x * scale - from.right) > 1) problems.push(`${path.dataset.capability} starts off its edge`);
          if (Math.abs(box.left + end.x * scale - to.left) > 8) problems.push(`${path.dataset.source} ends off its mark`);
          return problems;
        });
      }, domain.id);
      expect(off, domain.id).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollHeight), `${domain.id}: page height`).toBe(height);
    }
  });

  test('every control is at least 44 by 44 px, the section is at most 1.6 screens, nothing scrolls sideways and the words stay few', async ({ page }) => {
    await open(page, '/');
    await page.evaluate(() => document.fonts.ready);
    for (const domain of domains) {
      await page.getByRole('button', { name: domain.name, exact: true }).click();
      await expect(page.locator(`${SECTION}[data-filter="${domain.id}"]:not([data-forming])`)).toHaveCount(1);
      const measured = await page.evaluate((selector) => {
        const section = document.querySelector(selector) as HTMLElement;
        const small = Array.from(section.querySelectorAll<HTMLElement>('[data-filters="narrow"] button, [data-group][data-shown] a')).flatMap((control) => {
          const box = control.getBoundingClientRect();
          return box.width < 44 || box.height < 44 ? [`${control.textContent}: ${Math.round(box.width)}x${Math.round(box.height)}`] : [];
        });
        const text = Array.from(section.querySelectorAll<SVGTextElement>('[data-group][data-shown] li span')).map((span) => parseFloat(getComputedStyle(span).fontSize));
        return { small, smallest: Math.min(...text), screens: section.getBoundingClientRect().height / innerHeight, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      }, SECTION);
      expect(measured.small, `${domain.id}: controls under 44 px`).toEqual([]);
      expect(measured.smallest, 'smallest label, in px').toBeGreaterThanOrEqual(13);
      expect(measured.screens, `${domain.id}: section height in screens`).toBeLessThanOrEqual(1.6);
      expect(measured.overflow).toBeLessThanOrEqual(0);
    }
    const counts = await visibleWordCounts(page, ['capabilities']);
    expect(counts.capabilities).toBeLessThanOrEqual(70);
  });

  test('a capability opens its panel on a phone, with its sources, and there are no disclosures left in the section', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator(`${SECTION} details`)).toHaveCount(0);
    await expect(page.locator(`${SECTION} [data-interim]`)).toHaveCount(0);
    await page.getByRole('button', { name: 'AI systems', exact: true }).click();
    const capability = capabilities.find((entry) => entry.id === 'llm-evaluation');
    if (!capability) throw new Error('llm-evaluation is gone');
    await page.locator(`${SECTION} [data-group="ai"] a[data-capability="${capability.id}"]`).click();
    const dialog = page.getByRole('dialog', { name: capability.label });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(capability.detail, { exact: false })).toBeVisible();
    for (const id of capability.sources) {
      const label = sources.find((entry) => entry.id === id)?.label ?? '';
      await expect(dialog.locator('[data-detail-item][data-active="true"] li').getByText(label, { exact: true })).toBeVisible();
    }
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
    const duplicates = await page.evaluate(() => {
      const seen = new Map<string, number>();
      for (const element of Array.from(document.querySelectorAll('[id]'))) seen.set(element.id, (seen.get(element.id) ?? 0) + 1);
      return [...seen].filter(([, count]) => count > 1).map(([id]) => id);
    });
    expect(duplicates).toEqual([]);
  });

  test('the in-progress certification is drawn hollow and unlinked in its domain', async ({ page }) => {
    await open(page, '/');
    await page.getByRole('button', { name: 'Cloud and platform', exact: true }).click();
    const pending = page.locator(`${SECTION} [data-group="platform"] a[data-capability="cloud-certification"]`);
    await expect(pending).toHaveAttribute('data-pending', '');
    await expect(pending.locator('circle[data-part="pending"]')).toHaveCount(1);
    await expect(page.locator(`${SECTION} [data-group="platform"] path[data-capability="cloud-certification"]`)).toHaveCount(0);
  });
});

test.describe('without script below 1024 px', { tag: '@mobile' }, () => {
  for (const [width, height] of [
    [390, 844],
    [768, 1024],
  ] as const) {
    test(`all seventeen capabilities, their detail and their sources are on the page, grouped by domain and inside the gutters, at ${width}x${height}`, async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height } });
      const page = await context.newPage();
      await page.goto('/');
      for (const row of ['wide', 'narrow']) await expect(page.locator(`${SECTION} [data-filters="${row}"]`)).toBeHidden();
      for (const domain of domains) {
        const group = page.locator(`${SECTION} [data-group="${domain.id}"]`);
        await expect(group.getByRole('heading', { name: domain.name })).toBeVisible();
      }
      let previous = -1;
      for (const capability of capabilities) {
        const item = page.locator(`${SECTION} section#${panelId(capability.id)}`);
        await expect(item, capability.id).toBeVisible();
        await expect(item.getByText(capability.detail, { exact: false })).toBeVisible();
        for (const id of capability.sources) {
          const label = sources.find((entry) => entry.id === id)?.label ?? '';
          await expect(item.locator('li').getByText(label, { exact: true }), `${capability.id}: ${label}`).toBeVisible();
        }
        const order = domains.findIndex((domain) => domain.id === capability.domain);
        expect(order, `${capability.id} follows its domain's turn`).toBeGreaterThanOrEqual(previous);
        previous = order;
      }
      const outside = await page.evaluate((selector) => {
        const width = document.documentElement.clientWidth;
        return Array.from(document.querySelectorAll<HTMLElement>(`${selector} *`))
          .filter((element) => element.getBoundingClientRect().width > 0 && !element.closest('svg') && !element.closest('[data-detail-trigger]'))
          .map((element) => element.getBoundingClientRect())
          .filter((box) => box.left < -0.5 || box.right > width + 0.5).length;
      }, SECTION);
      expect(outside).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      await context.close();
    });
  }
});
