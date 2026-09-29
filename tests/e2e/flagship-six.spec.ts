import { expect as baseExpect, test, type Locator, type Page } from '@playwright/test';

const expect = baseExpect.configure({ timeout: 3000 });

import { aboutContent } from '../../app/data/portfolio/about';
import { roles } from '../../app/data/portfolio/experience';
import { capabilities, statusLegend } from '../../app/data/portfolio/skills';
import { listenContent } from '../../app/data/portfolio/listen';
import { heroContent } from '../../app/data/portfolio/hero';
import { mechanismFacts } from '../../app/data/portfolio/mechanisms';
import { plates, exclusions } from '../../app/data/portfolio/vitrine';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://forgotten-mistory.web.app';

async function gotoHome(page: Page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
}

function ssrText(html: string) {
  return html
    .replace(/<!-- -->/g, '')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"');
}

async function expectNamedRegion(locator: Locator) {
  await expect(locator).toBeVisible();
  await expect(
    locator.evaluate((el) => {
      const explicit = el.getAttribute('role') === 'region';
      const namedSection =
        el.tagName.toLowerCase() === 'section' &&
        (Boolean(el.getAttribute('aria-label')) || Boolean(el.getAttribute('aria-labelledby')));
      return explicit || namedSection;
    }),
  ).resolves.toBe(true);
}

test.describe('flagship six interaction contract', () => {
  test('hero observatory samples only browser-local telemetry and exposes bounded honest state', async ({ page }) => {
    await gotoHome(page);

    const observatory = page.getByTestId('hero-observatory');
    await expectNamedRegion(observatory);
    await expect(observatory).toHaveAttribute('data-state', 'idle');
    await expect(page.getByTestId('telemetry-status')).toHaveText('Not sampled');

    const toggle = page.getByTestId('telemetry-toggle');
    await expect(toggle.evaluate((el) => el.tagName.toLowerCase())).resolves.toBe('button');
    await expect(toggle).toHaveAccessibleName('Start session sample');

    const startedAt = await page.evaluate(() => performance.now());
    await toggle.click();
    await expect(toggle).toHaveAccessibleName('Stop session sample');
    await expect(observatory).toHaveAttribute('data-state', /^(sampling|complete)$/);
    await expect(observatory).toHaveAttribute('data-state', 'complete', { timeout: 6000 });
    const elapsed = await page.evaluate((start) => performance.now() - start, startedAt);
    expect(elapsed, 'sampling must be bounded by 120 rAF frames or 5s plus scheduling slack').toBeLessThan(6500);

    const status = page.getByTestId('telemetry-status');
    const text = await status.innerText();
    expect(text).toMatch(/browser local/i);
    expect(text).toMatch(/performance\.now|requestAnimationFrame|rAF/i);
    expect(text).toMatch(/interval\D+\d/i);
    expect(text).toMatch(/viewport\D+\d+\D+\d/i);
    expect(text).toMatch(/elapsed\D+\d/i);
    expect(text).not.toMatch(/server|gpu/i);
  });

  test('hero observatory reports unavailable honestly when requestAnimationFrame is absent at sampling time', async ({ page }) => {
    await gotoHome(page);
    const observatory = page.getByTestId('hero-observatory');
    await expectNamedRegion(observatory);
    await expect(observatory).toHaveAttribute('data-state', 'idle');
    await expect(page.locator('body')).toHaveClass(/page-ready/);

    await page.evaluate(() => {
      const globalWindow = window as Window & {
        __restoreFlagshipRaf?: () => void;
        requestAnimationFrame?: typeof window.requestAnimationFrame;
        cancelAnimationFrame?: typeof window.cancelAnimationFrame;
      };
      const originalRequestAnimationFrame = window.requestAnimationFrame;
      const originalCancelAnimationFrame = window.cancelAnimationFrame;
      globalWindow.__restoreFlagshipRaf = () => {
        Object.defineProperty(window, 'requestAnimationFrame', {
          configurable: true,
          writable: true,
          value: originalRequestAnimationFrame,
        });
        Object.defineProperty(window, 'cancelAnimationFrame', {
          configurable: true,
          writable: true,
          value: originalCancelAnimationFrame,
        });
      };
      window.addEventListener('pagehide', globalWindow.__restoreFlagshipRaf, { once: true });
      window.addEventListener('beforeunload', globalWindow.__restoreFlagshipRaf, { once: true });
      Object.defineProperty(window, 'requestAnimationFrame', {
        configurable: true,
        writable: true,
        value: undefined,
      });
      Object.defineProperty(window, 'cancelAnimationFrame', {
        configurable: true,
        writable: true,
        value: undefined,
      });
    });

    try {
      await page.getByTestId('telemetry-toggle').click();
      await expect(observatory).toHaveAttribute('data-state', 'unavailable');
      const statusText = await page.getByTestId('telemetry-status').innerText();
      expect(statusText).toMatch(/unavailable|not available/i);
      expect(statusText).toMatch(/requestAnimationFrame/i);
      expect(statusText).not.toMatch(/\b\d+(?:\.\d+)?\s*(?:fps|frames\/s)\b/i);
    } finally {
      await page.evaluate(() => {
        (window as Window & { __restoreFlagshipRaf?: () => void }).__restoreFlagshipRaf?.();
      }).catch(() => undefined);
    }
  });


  test('hero observatory reports resource timing unavailable instead of a fake zero count', async ({ page }) => {
    await gotoHome(page);
    const observatory = page.getByTestId('hero-observatory');
    await expectNamedRegion(observatory);
    await expect(observatory).toHaveAttribute('data-state', 'idle');
    await expect(page.locator('body')).toHaveClass(/page-ready/);

    await page.evaluate(() => {
      const globalWindow = window as Window & {
        __restoreFlagshipResourceTiming?: () => void;
      };
      const ownDescriptor = Object.getOwnPropertyDescriptor(performance, 'getEntriesByType');
      globalWindow.__restoreFlagshipResourceTiming = () => {
        if (ownDescriptor) {
          Object.defineProperty(performance, 'getEntriesByType', ownDescriptor);
        } else {
          Reflect.deleteProperty(performance, 'getEntriesByType');
        }
      };
      window.addEventListener('pagehide', globalWindow.__restoreFlagshipResourceTiming, { once: true });
      window.addEventListener('beforeunload', globalWindow.__restoreFlagshipResourceTiming, { once: true });
      Object.defineProperty(performance, 'getEntriesByType', {
        configurable: true,
        writable: true,
        value: undefined,
      });
    });

    try {
      const startedAt = await page.evaluate(() => performance.now());
      await page.getByTestId('telemetry-toggle').click();
      await expect(observatory).toHaveAttribute('data-state', /^(sampling|complete)$/);
      await expect(observatory).toHaveAttribute('data-state', 'complete', { timeout: 6000 });
      const elapsed = await page.evaluate((start) => performance.now() - start, startedAt);
      expect(elapsed, 'resource timing fallback sampling stays bounded').toBeLessThan(6500);

      const statusText = await page.getByTestId('telemetry-status').innerText();
      expect(statusText).toMatch(/browser local/i);
      expect(statusText).toMatch(/resource count unavailable/i);
      expect(statusText).toMatch(/Resource Timing API unavailable/i);
      expect(statusText).not.toMatch(/session resource count\s+0\b/i);
      expect(statusText).not.toMatch(/resource count\s+0\b/i);
    } finally {
      await page.evaluate(() => {
        (window as Window & { __restoreFlagshipResourceTiming?: () => void }).__restoreFlagshipResourceTiming?.();
      }).catch(() => undefined);
    }
  });

  test('hero observatory completes a stalled frame sample without interval availability', async ({ page }) => {
    await gotoHome(page);
    const observatory = page.getByTestId('hero-observatory');
    await expectNamedRegion(observatory);
    await expect(observatory).toHaveAttribute('data-state', 'idle');
    await expect(page.locator('body')).toHaveClass(/page-ready/);

    await page.evaluate(() => {
      const globalWindow = window as Window & {
        __restoreFlagshipStalledRaf?: () => void;
      };
      const originalRequestAnimationFrame = window.requestAnimationFrame;
      const originalCancelAnimationFrame = window.cancelAnimationFrame;
      globalWindow.__restoreFlagshipStalledRaf = () => {
        Object.defineProperty(window, 'requestAnimationFrame', {
          configurable: true,
          writable: true,
          value: originalRequestAnimationFrame,
        });
        Object.defineProperty(window, 'cancelAnimationFrame', {
          configurable: true,
          writable: true,
          value: originalCancelAnimationFrame,
        });
      };
      window.addEventListener('pagehide', globalWindow.__restoreFlagshipStalledRaf, { once: true });
      window.addEventListener('beforeunload', globalWindow.__restoreFlagshipStalledRaf, { once: true });
      Object.defineProperty(window, 'requestAnimationFrame', {
        configurable: true,
        writable: true,
        value: () => 123,
      });
      Object.defineProperty(window, 'cancelAnimationFrame', {
        configurable: true,
        writable: true,
        value: () => undefined,
      });
    });

    try {
      const startedAt = await page.evaluate(() => performance.now());
      await page.getByTestId('telemetry-toggle').evaluate((button) => {
        (button as HTMLButtonElement).click();
      });
      await expect(observatory).toHaveAttribute('data-state', 'sampling');
      await expect
        .poll(() => observatory.getAttribute('data-state'), { timeout: 6500, intervals: [100, 250, 500] })
        .toBe('complete');
      const elapsed = await page.evaluate((start) => performance.now() - start, startedAt);
      expect(elapsed, 'stalled requestAnimationFrame watchdog completes within 6.5 seconds').toBeLessThan(6500);

      const statusText = await page.getByTestId('telemetry-status').innerText();
      expect(statusText).toMatch(/browser local/i);
      expect(statusText).toMatch(/no interval (?:value )?available/i);
      expect(statusText).not.toMatch(/stuck|sampling browser local requestAnimationFrame intervals/i);
    } finally {
      await page.evaluate(() => {
        (window as Window & { __restoreFlagshipStalledRaf?: () => void }).__restoreFlagshipStalledRaf?.();
      }).catch(() => undefined);
    }
  });

  test('about compass keeps the ten source answers server-rendered and selectable by named buttons', async ({ page, request }) => {
    const html = ssrText(await (await request.get(BASE_URL)).text());
    for (const dimension of aboutContent.dimensions) {
      expect(html, `SSR answer for ${dimension.name}`).toContain(dimension.answer);
    }

    await gotoHome(page);
    const compass = page.getByTestId('about-compass');
    await expectNamedRegion(compass);
    const buttons = compass.getByTestId('compass-dimension');
    await expect(buttons).toHaveCount(aboutContent.dimensions.length);

    for (const dimension of aboutContent.dimensions) {
      await expect(compass.getByRole('button', { name: dimension.name })).toBeVisible();
    }

    const selectedIndex = 7;
    await buttons.nth(selectedIndex).focus();
    await expect(compass).toHaveAttribute('data-active-index', String(selectedIndex));
    await expect(page.getByTestId('compass-answer')).toContainText(
      aboutContent.dimensions[selectedIndex].answer,
    );

    const clickedIndex = 2;
    await buttons.nth(clickedIndex).click();
    await expect(compass).toHaveAttribute('data-active-index', String(clickedIndex));
    await expect(page.getByTestId('compass-answer')).toContainText(
      aboutContent.dimensions[clickedIndex].answer,
    );
  });

  test('experience explorer exposes a named range scrubber with sourced duration geometry and no score', async ({ page }) => {
    await gotoHome(page);
    const explorer = page.getByTestId('experience-explorer');
    await expectNamedRegion(explorer);

    const scrubber = page.getByTestId('career-scrubber');
    await expect(scrubber.evaluate((el) => el.getAttribute('role') ?? (el as HTMLInputElement).type)).resolves.toMatch(/slider|range/);
    await expect(scrubber).toHaveAccessibleName('Inspect career timeline');
    await expect(scrubber).toHaveAttribute('type', 'range');
    await expect(scrubber).toHaveAttribute('min', '0');
    await expect(scrubber).toHaveAttribute('max', String(roles.length - 1));

    const inspection = page.getByTestId('career-inspection');
    const before = await inspection.innerText();
    const target = roles.length - 1;
    await scrubber.evaluate((input, value) => {
      const el = input as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (!setter) throw new Error('HTMLInputElement value setter unavailable');
      setter.call(el, String(value));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, target);
    await expect(inspection).not.toHaveText(before);
    await expect(inspection).toContainText(roles[target].company);
    await expect(inspection).toContainText(roles[target].dates);
    await expect(inspection).toContainText(`${roles[target].years.toFixed(1)} yr`);
    await expect(inspection).not.toContainText(/\bscore\b|\b\d{1,3}\s?%\b/i);
  });

  test('skills trace keeps the certificate table SSR-readable and changes exact capability evidence', async ({ page, request }) => {
    const html = ssrText(await (await request.get(BASE_URL)).text());
    for (const row of capabilities) {
      expect(html, `SSR capability ${row.capability}`).toContain(row.capability);
      expect(html, `SSR evidence ${row.capability}`).toContain(row.evidence);
    }
    expect(html, 'pending certificate remains readable in SSR').toContain('studying; no certificate issued');

    await gotoHome(page);
    const trace = page.getByTestId('skills-trace');
    await expectNamedRegion(trace);
    const selects = trace.getByTestId('capability-select');
    await expect(selects).toHaveCount(capabilities.length);

    const chosen = capabilities.findIndex((row) => row.status === 'pending');
    expect(chosen).toBeGreaterThanOrEqual(0);
    await selects.nth(chosen).click();

    const output = page.getByTestId('capability-evidence');
    await expect(output).toContainText(capabilities[chosen].evidence);
    await expect(output).toContainText(capabilities[chosen].where);
    await expect(output).toContainText(statusLegend[capabilities[chosen].status].label);

    const alternate = 0;
    await selects.nth(alternate).focus();
    await expect(output).toContainText(capabilities[alternate].evidence);
    await expect(output).toContainText(capabilities[alternate].where);
    await expect(output).toContainText(statusLegend[capabilities[alternate].status].label);
  });

  test('vitrine mechanism diagrams are six unique sourced schematics with inspectable details and existing exclusions', async ({ page }) => {
    await gotoHome(page);
    const vitrine = page.locator('#vitrine');
    await expectNamedRegion(vitrine);
    await expect(vitrine.locator('ol > li')).toHaveCount(6);
    for (const excluded of exclusions) {
      await expect(vitrine).toContainText(excluded.repo);
      await expect(vitrine).toContainText(excluded.reason);
    }

    const diagrams = vitrine.getByTestId('mechanism-diagram');
    await expect(diagrams).toHaveCount(plates.length);
    for (let index = 0; index < plates.length; index += 1) {
      const card = vitrine.locator('ol > li').nth(index);
      await expect(card).toHaveAttribute('data-mechanism', plates[index].drawing);
      await expect(card.getByTestId('mechanism-inspect').evaluate((el) => el.tagName.toLowerCase())).resolves.toBe('button');
      await expect(card.getByTestId('mechanism-inspect')).toHaveAccessibleName(new RegExp(plates[index].title, 'i'));
      await expect(card.getByTestId('mechanism-inspect')).toHaveAttribute('aria-expanded', 'false');
      await card.getByTestId('mechanism-inspect').click();
      await expect(card.getByTestId('mechanism-inspect')).toHaveAttribute('aria-expanded', 'true');
      await expect(card.getByTestId('mechanism-detail')).toBeVisible();
      await expect(card.getByTestId('mechanism-detail')).toContainText(/schematic/i);
      await expect(card.getByTestId('mechanism-detail')).toContainText(/not live/i);
    }

    const signatures = await diagrams.evaluateAll((nodes) =>
      nodes.flatMap((node) =>
        Array.from(node.querySelectorAll('path'))
          .map((path) => path.getAttribute('d')?.replace(/\s+/g, ' ').trim() ?? '')
          .filter(Boolean),
      ),
    );
    expect(new Set(signatures).size, signatures.join('\n')).toBeGreaterThanOrEqual(6);
  });

  test('listen resonance tracks focus across existing contact anchors without forms, autoplay audio, or obstruction', async ({ page }) => {
    await gotoHome(page);
    const resonance = page.getByTestId('listen-resonance');
    await expectNamedRegion(resonance);
    await expect(resonance.locator('form, input, textarea, select')).toHaveCount(0);
    await expect(resonance.locator('audio[autoplay], video[autoplay]')).toHaveCount(0);

    const contactAnchors = listenContent.channels.map((channel) => resonance.locator(`a[href="${channel.href}"]`));
    for (const anchor of contactAnchors) {
      await anchor.scrollIntoViewIfNeeded();
      await expect(anchor).toBeVisible();
      const unobstructed = await anchor.evaluate((el) => {
        const box = el.getBoundingClientRect();
        const x = Math.min(Math.max(box.left + box.width / 2, 0), window.innerWidth - 1);
        const y = Math.min(Math.max(box.top + box.height / 2, 0), window.innerHeight - 1);
        const top = document.elementFromPoint(x, y);
        return top === el || Boolean(top && el.contains(top));
      });
      expect(unobstructed, `anchor ${await anchor.getAttribute('href')} is not covered`).toBe(true);
    }

    await contactAnchors[0].focus();
    const firstState = await resonance.getAttribute('data-active-channel');
    expect(firstState).toBeTruthy();
    await contactAnchors[1].focus();
    await expect
      .poll(() => resonance.getAttribute('data-active-channel'))
      .not.toBe(firstState);
  });

  test('no-JavaScript SSR preserves the six section facts, first CTA, role bullets, and vitrine schematics', async ({ browser, request }) => {
    const html = ssrText(await (await request.get(BASE_URL)).text());

    const ssrFacts = [
      heroContent.name,
      heroContent.statement,
      heroContent.actions.primary.label,
      aboutContent.dimensions[0].answer,
      roles[0].company,
      roles[0].bullets[0],
      capabilities[0].capability,
      capabilities[0].evidence,
      plates[0].title,
      plates[0].limits,
      listenContent.sentence,
      listenContent.channels[0].label,
    ];
    for (const fact of ssrFacts) {
      expect(html, `SSR contains ${fact}`).toContain(fact);
    }
    for (const plate of plates) {
      expect(html, `SSR plate ${plate.title}`).toContain(plate.title);
      expect(html, `SSR plate limit ${plate.title}`).toContain(plate.limits);
      expect(html, `SSR schematic ${plate.drawing}`).toContain(mechanismFacts[plate.drawing].schematic);
    }
    for (const role of roles) {
      for (const bullet of role.bullets) {
        expect(html, `SSR role bullet ${role.id}`).toContain(bullet);
      }
    }

    const context = await browser.newContext({ javaScriptEnabled: false });
    const noJsPage = await context.newPage();
    try {
      await noJsPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      const sectionContracts = [
        { selector: '#hero', facts: [heroContent.name, heroContent.statement, heroContent.actions.primary.label] },
        { selector: '#about', facts: [aboutContent.dimensions[0].name, aboutContent.dimensions[0].answer] },
        { selector: '#experience', facts: [roles[0].company, roles[0].bullets[0]] },
        { selector: '#skills', facts: [capabilities[0].capability, capabilities[0].evidence] },
        { selector: '#vitrine', facts: [plates[0].title, mechanismFacts[plates[0].drawing].schematic] },
        { selector: '#listen', facts: [listenContent.sentence, listenContent.channels[0].label] },
      ];

      for (const contract of sectionContracts) {
        const section = noJsPage.locator(contract.selector);
        await expectNamedRegion(section);
        for (const fact of contract.facts) {
          await expect(section, `${contract.selector} no-JS fact ${fact}`).toContainText(fact);
        }
      }

      const primaryCta = noJsPage.locator('#hero').getByRole('link', { name: heroContent.actions.primary.label });
      await expect(primaryCta).toHaveAttribute('href', heroContent.actions.primary.href);

      const experience = noJsPage.locator('#experience');
      for (const role of roles) {
        await expect(experience, `no-JS role company ${role.id}`).toContainText(role.company);
        for (const bullet of role.bullets) {
          await expect(experience, `no-JS role bullet ${role.id}`).toContainText(bullet);
        }
      }
    } finally {
      await context.close();
    }
  });


  test('reduced motion at 320px preserves meaningful text and horizontal bounds', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth, `document overflows ${overflow.scrollWidth} > ${overflow.clientWidth}`).toBeLessThanOrEqual(
      overflow.clientWidth + 1,
    );

    for (const selector of ['#hero', '#about', '#experience', '#skills', '#vitrine', '#listen']) {
      const region = page.locator(selector);
      await region.scrollIntoViewIfNeeded();
      await expect(region).toBeVisible();
      const visibleContent = await region.evaluate((el) => {
        const sectionBox = el.getBoundingClientRect();
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            const text = node.textContent?.replace(/\s+/g, ' ').trim() ?? '';
            if (text.length < 2) return NodeFilter.FILTER_REJECT;
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const style = getComputedStyle(parent);
            if (style.display === 'none' || style.visibility === 'hidden') return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          },
        });
        const samples: Array<{ text: string; left: number; right: number; width: number }> = [];
        while (walker.nextNode()) {
          const node = walker.currentNode;
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const rect of Array.from(range.getClientRects())) {
            const clippedLeft = Math.max(rect.left, sectionBox.left, 0);
            const clippedRight = Math.min(rect.right, sectionBox.right, window.innerWidth);
            const width = Math.max(0, clippedRight - clippedLeft);
            if (width > 2 && rect.bottom > 0 && rect.top < window.innerHeight) {
              samples.push({
                text: node.textContent?.replace(/\s+/g, ' ').trim() ?? '',
                left: clippedLeft,
                right: clippedRight,
                width,
              });
            }
          }
          range.detach();
        }
        return {
          text: samples.map((sample) => sample.text).join(' '),
          maxWidth: Math.max(0, ...samples.map((sample) => sample.width)),
          outsideViewport: samples.filter((sample) => sample.left < -1 || sample.right > window.innerWidth + 1),
        };
      });
      expect(visibleContent.text.trim().length, `${selector} has actual visible text under reduced motion`).toBeGreaterThan(40);
      expect(visibleContent.maxWidth, `${selector} exposes visible text within the 320px viewport`).toBeGreaterThan(120);
      expect(visibleContent.outsideViewport, `${selector} visible text is not ancestor-clipped outside viewport`).toHaveLength(0);
    }
  });
});
