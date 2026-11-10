import { expect, test, type Locator } from '@playwright/test';

import { NAV_ITEMS, SECTION_IDS, enforceProductionCsp, hydrated, open } from './support';

const sectionIds: readonly string[] = SECTION_IDS;

/** Opacity of an element multiplied through its ancestors: what a reader actually sees. */
function effectiveOpacity(element: Locator): Promise<number> {
  return element.evaluate((el) => {
    let opacity = 1;
    for (let node: Element | null = el; node; node = node.parentElement) {
      opacity *= Number(getComputedStyle(node).opacity);
    }
    return opacity;
  });
}

test.describe('on every viewport', () => {
  test('the home page loads without console errors, page errors or CSP violations', async ({
    page,
  }) => {
    const problems: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') problems.push(`console: ${message.text()}`);
    });
    page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (event) => {
        console.error(`CSP violation: ${event.violatedDirective} blocked ${event.blockedURI}`);
      });
    });
    await enforceProductionCsp(page);

    const response = await open(page, '/');
    expect(response?.status()).toBe(200);

    // Scroll to the bottom so anything loaded lazily on the way has loaded.
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    });
    await page.waitForLoadState('networkidle');

    expect(problems).toEqual([]);
  });

  test('the page has exactly one h1', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });

  test('the sections come in order and every header anchor points at one', async ({ page }) => {
    await page.goto('/');

    const ids = await page.locator('main section[id]').evaluateAll((sections) => sections.map((s) => s.id));
    expect(ids.filter((id) => sectionIds.includes(id))).toEqual(sectionIds);

    const targets = await page
      .getByRole('banner')
      .locator('a[href*="#"]')
      .evaluateAll((links) => links.map((a) => new URL((a as HTMLAnchorElement).href).hash.slice(1)));
    for (const target of targets) expect(sectionIds).toContain(target);
    for (const { id } of NAV_ITEMS) expect(targets).toContain(id);
  });

  test('with reduced motion every section heading and the hero h1 are fully visible', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const headings = await page.locator('h1, section[id] h2').all();
    expect(headings.length).toBeGreaterThanOrEqual(SECTION_IDS.length - 1);
    for (const heading of headings) {
      await expect(heading).toBeVisible();
      expect(await effectiveOpacity(heading), await heading.innerText()).toBe(1);
    }
  });

  test('the theme toggle switches data-theme and the choice survives a reload', async ({ page }) => {
    const root = page.locator('html');
    const toggle = page.getByRole('button', { name: 'Switch colour theme' });
    await open(page, '/');

    await toggle.click();
    await expect(root).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await hydrated(page);
    await expect(root).toHaveAttribute('data-theme', 'light');

    await toggle.click();
    await expect(root).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await hydrated(page);
    await expect(root).toHaveAttribute('data-theme', 'dark');
  });

  test('"Ask Mini Vic" opens a dialog and Escape closes it', async ({ page }) => {
    await open(page, '/');

    // The header and the floating launcher both carry the button; either opens the panel.
    await page.getByRole('button', { name: 'Ask Mini Vic' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});

test.describe('on small screens', () => {
  test('the mobile menu opens, lists the anchors and closes with Escape', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'the menu button only exists below 900px');
    await open(page, '/');

    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    const menu = page.getByRole('dialog', { name: 'Site menu' });
    await expect(menu).toBeVisible();

    const links = menu.getByRole('navigation', { name: 'Menu' }).getByRole('link');
    await expect(links).toHaveText(NAV_ITEMS.map((item) => item.label));
    for (const [index, { id }] of NAV_ITEMS.entries()) {
      await expect(links.nth(index)).toHaveAttribute('href', `/#${id}`);
    }

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
  });
});

test.describe('checked once, because the viewport does not matter', () => {
  test.skip(({ isMobile }) => isMobile, 'nothing here depends on the viewport');

  test('the CV link returns a PDF', async ({ page }) => {
    await page.goto('/');
    const cv = page.getByRole('contentinfo').getByRole('link', { name: /CV/ });
    const href = await cv.getAttribute('href');
    expect(href).toBeTruthy();

    const response = await page.request.get(href ?? '');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/pdf');
  });

  test('nothing overflows horizontally at 320, 390 and 1440 px', async ({ page }) => {
    const routes = ['/', '/privacy', '/terms', '/no-such-page'];
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of routes) {
        await page.goto(route);
        await page.evaluate(() => document.fonts.ready);

        // Body clips horizontal overflow, so the scroll width alone proves nothing:
        // look for any element that sticks out of the viewport outside a scroller.
        const wide = await page.evaluate(() => {
          const viewport = document.documentElement.clientWidth;
          const scrolls = (el: Element) => {
            for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
              if (getComputedStyle(node).overflowX !== 'visible') return true;
            }
            return false;
          };
          return Array.from(document.body.querySelectorAll('*'))
            .filter((el) => {
              const box = el.getBoundingClientRect();
              return box.width > 0 && box.right > viewport + 1 && !scrolls(el);
            })
            .map((el) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}`);
        });
        expect(wide, `${route} at ${width}px`).toEqual([]);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${route} at ${width}px`).toBeLessThanOrEqual(0);
      }
    }
  });

  test('/privacy and /terms return their headings', async ({ page }) => {
    for (const { path, heading } of [
      { path: '/privacy', heading: 'Privacy Policy' },
      { path: '/terms', heading: 'Terms' },
    ]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      await expect(page.getByRole('heading', { level: 1, name: heading, exact: true })).toBeVisible();
    }
  });

  test('an unknown path shows the not-found page', async ({ page }) => {
    const response = await page.goto('/no-such-page');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  });

  test('the built HTML carries the build-commit meta', async ({ request }) => {
    const response = await request.get('/');
    expect(await response.text()).toMatch(/<meta name="build-commit" content="[0-9a-f]{8}"/);
  });
});
