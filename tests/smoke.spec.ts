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

  test('the first screen shows the readings with their scope lines, whole and clear of the launcher', async ({
    page,
  }) => {
    // Reduced motion puts every element where its entrance ends, so the geometry is exact.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/');
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    const fold = viewport?.height ?? 0;

    const cards = await page
      .locator('#proof ul')
      .first()
      .locator(':scope > li')
      .evaluateAll((items) =>
        items.map((item) => {
          const box = item.getBoundingClientRect();
          return { text: item.textContent ?? '', top: box.top, bottom: box.bottom, left: box.left, right: box.right };
        }),
      );
    expect(cards).toHaveLength(3);

    // Beside the headline all three are on the first screen; on a phone they are one row to
    // move along, and the first is whole with the next showing at the edge.
    const onFirstScreen = (viewport?.width ?? 0) >= 1024 ? cards : cards.slice(0, 1);
    const launcher = await page.locator('#assistant-launcher').boundingBox();
    expect(launcher).not.toBeNull();
    for (const card of onFirstScreen) {
      expect(card.bottom, `${card.text} ends above the fold`).toBeLessThanOrEqual(fold);
      const apart =
        !launcher ||
        launcher.x >= card.right ||
        launcher.x + launcher.width <= card.left ||
        launcher.y >= card.bottom ||
        launcher.y + launcher.height <= card.top;
      expect(apart, `${card.text} is not covered by the launcher`).toBe(true);
    }
  });

  test('the eyebrow never breaks on a separator, from 320 px up', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [320, 360, 390, 834, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      const lines = await page.locator('#top .type-eyebrow').evaluate((eyebrow) => {
        const range = document.createRange();
        const found: { top: number; text: string }[] = [];
        const walker = document.createTreeWalker(eyebrow, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const text = (node as Text).data;
          for (let index = 0; index < text.length; index += 1) {
            range.setStart(node, index);
            range.setEnd(node, index + 1);
            const rects = range.getClientRects();
            if (rects.length === 0) continue;
            const top = Math.round(rects[0].top);
            let line = found.find((entry) => Math.abs(entry.top - top) < 4);
            if (!line) {
              line = { top, text: '' };
              found.push(line);
            }
            line.text += text[index];
          }
        }
        return found.map((entry) => entry.text.trim());
      });
      for (const line of lines) {
        expect(line, `a line of the eyebrow at ${width}px`).not.toMatch(/^·|·$/);
      }
    }
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

// The menu button only exists below 900px, so this runs in the mobile project only.
test.describe('on small screens', { tag: '@mobile' }, () => {
  test('the mobile menu opens, lists the anchors and closes with Escape', async ({ page }) => {
    await open(page, '/');

    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    const menu = page.getByRole('dialog', { name: 'Site menu', exact: true });
    await expect(menu).toBeVisible();

    const links = menu.getByRole('navigation', { name: 'Menu', exact: true }).getByRole('link');
    await expect(links).toHaveText(NAV_ITEMS.map((item) => item.label));
    for (const [index, { id }] of NAV_ITEMS.entries()) {
      await expect(links.nth(index)).toHaveAttribute('href', `/#${id}`);
    }

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
  });

  test('every link and button in the hero, the proof and the footer is a 44 px touch target', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/');
    const small = await page.evaluate(() =>
      Array.from(document.querySelectorAll('#top a, #top button, #proof a, footer a'))
        .map((control) => {
          const box = control.getBoundingClientRect();
          return { name: (control.textContent ?? '').trim(), width: box.width, height: box.height };
        })
        .filter((control) => control.width < 43.5 || control.height < 43.5)
        .map((control) => `${control.name}: ${Math.round(control.width)}x${Math.round(control.height)}`),
    );
    expect(small).toEqual([]);
  });
});

// Nothing below depends on the viewport, so it runs once, in the desktop project.
test.describe('checked once, because the viewport does not matter', { tag: '@desktop' }, () => {
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

  test('the numerals on a scale never touch, from 320 to 1920 px', async ({ page }) => {
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);

      const touching = await page.evaluate(() => {
        const GAP = 4;
        const found: string[] = [];
        for (const svg of document.querySelectorAll('svg')) {
          const numerals = Array.from(svg.querySelectorAll('text'))
            .map((text) => ({ label: text.textContent ?? '', box: text.getBoundingClientRect() }))
            .filter(({ box }) => box.width > 0)
            .sort((a, b) => a.box.left - b.box.left);
          for (let at = 1; at < numerals.length; at += 1) {
            const [before, after] = [numerals[at - 1], numerals[at]];
            if (after.box.left - before.box.right < GAP) found.push(`${before.label} ${after.label}`);
          }
        }
        return found;
      });
      expect(touching, `${width}px`).toEqual([]);
    }
  });

  test('an experience card is readable well before it reaches the middle of the screen', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, '/');
    const card = page.locator('#experience ol > li').first();
    // Put the card's top edge 54% of the way down the screen, where the review found it still half faded.
    await card.evaluate((element) => {
      const top = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top - window.innerHeight * 0.54, behavior: 'instant' });
    });
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    expect(await effectiveOpacity(card)).toBeGreaterThanOrEqual(0.9);
  });

  test('the page ships one WebGL canvas, behind the content, and the copy claims no more', async ({
    page,
  }) => {
    await open(page, '/');
    // The stage mounts once the page has loaded and gone idle; every view shares its canvas.
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect(page.locator('body > div[aria-hidden="true"] > canvas[data-stage]')).toHaveCount(1);
    expect((await page.locator('main').textContent()) ?? '').not.toMatch(/context per section/i);
    await expect(page.locator('#capabilities')).not.toContainText(/this site/i);
  });

  test('keyboard focus shows the accent ring on the first frame, on every navigation link', async ({
    page,
  }) => {
    await open(page, '/');
    const accent = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--accent)';
      document.body.append(probe);
      const colour = getComputedStyle(probe).color;
      probe.remove();
      return colour;
    });
    const links = page.locator('header nav a, footer nav a');
    const count = await links.count();
    expect(count).toBeGreaterThan(5);
    for (let index = 0; index < count; index += 1) {
      const ring = await links.nth(index).evaluate((link) => {
        (link as HTMLElement).focus();
        const style = getComputedStyle(link);
        return { colour: style.outlineColor, kind: style.outlineStyle, name: link.textContent };
      });
      expect(ring.kind, `${ring.name} shows a ring`).toBe('solid');
      expect(ring.colour, `${ring.name} ring colour`).toBe(accent);
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
