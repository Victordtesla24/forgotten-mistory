import { test, expect, type Page } from '@playwright/test';

/**
 * The two audiences, each with a path they can finish.
 *
 * CLAUDE.md prime directive 1 names employers and business clients as
 * first-class, and docs/prompt.md R4 asks that each one can complete an action
 * rather than admire one. This file walks both paths end to end from `/`:
 *
 *  - the employer wants the CV. It has to be reachable in at most two clicks
 *    from the front door, with a mouse or with a keyboard alone, and the file
 *    behind the control has to actually be a PDF that the server returns.
 *  - the client wants to start something. #listen has to carry exactly one
 *    engagement action, big enough to hit, named for a client rather than a
 *    recruiter, and pointed at a destination the visitor can complete. No
 *    booking tool exists on this account yet, so the sanctioned route is a
 *    `mailto:` carrying a non-empty subject — a pre-addressed enquiry, not a
 *    blank compose window (decision recorded in
 *    docs/delivery/evidence/v10-20260905T0515Z/C20-listen-tenure/07-decisions.md).
 */

const CV_PATH = '/docs/Vik_Resume_Final.pdf';
const LISTEN = '#listen';
/** The client's action, in the client's words — never "hire me", never "resume". */
const CLIENT_NAME = /engagement|book|start a project|work together/i;

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
}

/** Every control on the page that resolves to the CV, with the clicks it costs. */
async function cvControls(page: Page) {
  return page.evaluate((path) => {
    return Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'))
      .filter((a) => new URL(a.href, location.href).pathname.endsWith(path))
      .map((a) => {
        const rect = a.getBoundingClientRect();
        return {
          text: (a.textContent || '').trim(),
          visible: rect.width > 0 && rect.height > 0 && getComputedStyle(a).display !== 'none',
          inOverlay: !!a.closest('[data-nav-overlay], .nav-overlay, nav'),
        };
      });
  }, CV_PATH);
}

test.describe('Audience paths', () => {
  test.describe.configure({ timeout: 90000 });

  test('AP-01: the employer reaches the CV in two clicks or fewer, at 1440 and 390', async ({
    page,
  }) => {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await gotoHome(page);

      const controls = await cvControls(page);
      expect(controls.length, `${viewport.width}: no control resolves to ${CV_PATH}`).toBeGreaterThan(0);

      const directlyVisible = controls.some((c) => c.visible);
      if (directlyVisible) continue;

      // One click to open the menu, one to take the CV: still inside the budget.
      const toggle = page.locator('.menu-toggle');
      await expect(toggle, `${viewport.width}: CV is hidden and there is no menu to open`).toBeVisible();
      await toggle.click();
      await page.waitForTimeout(400);
      const afterOpen = await cvControls(page);
      expect(
        afterOpen.some((c) => c.visible),
        `${viewport.width}: CV not visible after opening the menu (2 clicks)`,
      ).toBe(true);
    }
  });

  test('AP-02: the CV control is reachable with the keyboard alone', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHome(page);
    await page.locator('body').click({ position: { x: 2, y: 2 } });

    let reached = false;
    const seen: string[] = [];
    for (let i = 0; i < 12 && !reached; i += 1) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate((path) => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return null;
        const href = el.getAttribute('href');
        return {
          tag: el.tagName.toLowerCase(),
          label: (el.textContent || '').trim().slice(0, 40),
          isCv: !!href && new URL(href, location.href).pathname.endsWith(path),
          ring: getComputedStyle(el).outlineStyle,
        };
      }, CV_PATH);
      if (!focused) continue;
      seen.push(`${focused.tag}:${focused.label}`);
      if (focused.isCv) {
        reached = true;
        // A keyboard reader has to be able to see where they are.
        expect(focused.ring, 'the focused CV control draws no outline').not.toBe('none');
      }
    }
    expect(reached, `CV never took focus. Tab order: ${seen.join(' → ')}`).toBe(true);
  });

  test('AP-03: the CV the control points at is a real PDF the server returns', async ({
    request,
  }) => {
    const response = await request.get(CV_PATH);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type'] ?? '').toContain('application/pdf');
    const body = await response.body();
    expect(body.byteLength).toBeGreaterThan(1024);
    expect(body.subarray(0, 4).toString('latin1')).toBe('%PDF');
  });

  test('AP-04: #listen carries exactly one engagement action, named for a client', async ({
    page,
  }) => {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await gotoHome(page);
      await page.locator(LISTEN).scrollIntoViewIfNeeded();

      const cta = page.locator(`${LISTEN} [data-cta="engage"]`);
      await expect(cta, `${viewport.width}: not exactly one engagement action`).toHaveCount(1);

      const probe = await cta.evaluate((el) => ({
        height: el.getBoundingClientRect().height,
        name: (el.getAttribute('aria-label') || el.textContent || '').trim(),
        href: el.getAttribute('href') || '',
        tag: el.tagName.toLowerCase(),
      }));

      expect(probe.tag, 'the engagement action is not an anchor').toBe('a');
      expect(probe.height, `${viewport.width}: engagement action is ${probe.height}px tall`).toBeGreaterThanOrEqual(44);
      expect(probe.name, `${viewport.width}: accessible name "${probe.name}"`).toMatch(CLIENT_NAME);
      expect(probe.href.length).toBeGreaterThan(0);
    }
  });

  test('AP-05: activating the engagement action completes — a live URL, or a mailto with a subject', async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHome(page);
    await page.locator(LISTEN).scrollIntoViewIfNeeded();

    const href = await page.locator(`${LISTEN} [data-cta="engage"]`).getAttribute('href');
    expect(href).toBeTruthy();

    if (href!.startsWith('mailto:')) {
      const url = new URL(href!);
      // `mailto:` puts the address in the pathname and the rest in the query.
      expect(url.pathname, 'mailto with no recipient').toContain('@');
      const subject = new URLSearchParams(url.search).get('subject') ?? '';
      expect(subject.trim().length, `mailto subject is empty in ${href}`).toBeGreaterThan(0);
    } else {
      const response = await request.get(href!);
      expect(response.status(), `${href} returned ${response.status()}`).toBeLessThan(400);
    }
  });
});
