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
const VITRINE = '#vitrine';
const ENGAGE = '[data-cta="engage"]';
/**
 * The client's action, in the client's words — never "hire me", never "resume",
 * and never a verb that promises a tool this account does not have. The earlier
 * form of this rule accepted `book` and `start a project`; both were renamed out
 * of the site (docs/architecture/G-C1-HONEST-CTA.md §4) and are now the two
 * things a plate must not say, so accepting them here would have been the test
 * agreeing with the defect.
 */
const CLIENT_NAME = /email .*(agenda|brief)|engagement|enquiry|work together/i;
/** A plate may not promise a booking tool: there is no calendar key on this account (§7.2). */
const BOOKING_VERB = /\bbook(ing)?\b|start a project/i;
/** The one product, verbatim (docs/architecture/G-C1-HONEST-CTA.md §7.3). */
const SUBJECT = '20-minute call — Vikram Deshpande';
const BODY = [
  'Hiring or a project:',
  "What you're building:",
  'The decision you need made:',
  'Two or three times that suit you (Melbourne time):',
  'Anything I should read first:',
];

/** Every engagement plate on the page, in document order, with what it promises. */
async function engagePlates(page: Page) {
  return page.locator(ENGAGE).evaluateAll((els) =>
    els.map((el) => ({
      href: el.getAttribute('href') || '',
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      section: el.closest('section')?.id || '',
    })),
  );
}

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

  test('AP-06: both engagement plates are byte-identical — one product, not two', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHome(page);
    await page.locator(VITRINE).scrollIntoViewIfNeeded();
    await page.locator(`${VITRINE} ${ENGAGE}`).first().waitFor({ state: 'attached', timeout: 15000 });
    await page.locator(LISTEN).scrollIntoViewIfNeeded();
    await page.locator(`${LISTEN} ${ENGAGE}`).first().waitFor({ state: 'attached', timeout: 15000 });

    const plates = await engagePlates(page);
    expect(plates.map((p) => p.section).sort(), 'the two engagement plates are not on #vitrine and #listen').toEqual([
      'listen',
      'vitrine',
    ]);
    expect(
      new Set(plates.map((p) => p.href)).size,
      `two different mailto products: ${plates.map((p) => `${p.section}=${p.href}`).join(' | ')}`,
    ).toBe(1);
    expect(
      new Set(plates.map((p) => p.text)).size,
      `two different labels: ${plates.map((p) => `${p.section}="${p.text}"`).join(' | ')}`,
    ).toBe(1);

    const params = new URLSearchParams(new URL(plates[0].href).search);
    expect(params.get('subject'), 'the shared subject is not the agreed one').toBe(SUBJECT);
    expect((params.get('body') ?? '').split('\n'), 'the shared body is not the agreed agenda').toEqual(BODY);
  });

  test('AP-07: both audiences finish — the employer takes the CV, the client sends a prefilled enquiry', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHome(page);

    // Employer: the CV control is reachable in the same pass as the client's action.
    const controls = await cvControls(page);
    expect(controls.length, `no control resolves to ${CV_PATH}`).toBeGreaterThan(0);

    // Client: the work (#vitrine) and the closing section (#listen) each finish,
    // and they finish in the same place. Vitrine carried no body at all before
    // G-C1 was fixed — this is the assertion that would have caught it.
    const hrefs: Record<string, string> = {};
    for (const section of [VITRINE, LISTEN]) {
      await page.locator(section).scrollIntoViewIfNeeded();
      const plate = page.locator(`${section} ${ENGAGE}`).first();
      await plate.waitFor({ state: 'attached', timeout: 15000 });
      const href = (await plate.getAttribute('href')) ?? '';

      expect(href.length, `${section}: engagement plate has no href`).toBeGreaterThan(0);
      expect(href.startsWith('mailto:'), `${section}: engagement href is not a mailto — ${href}`).toBe(true);
      const url = new URL(href);
      expect(url.pathname, `${section}: mailto recipient`).toContain('@');
      const params = new URLSearchParams(url.search);
      expect((params.get('subject') ?? '').trim().length, `${section}: empty subject`).toBeGreaterThan(0);
      expect((params.get('body') ?? '').trim().length, `${section}: empty body — a blank compose window`).toBeGreaterThan(
        0,
      );
      hrefs[section] = href;
    }
    expect(hrefs[VITRINE], 'the two doors send different enquiries').toBe(hrefs[LISTEN]);
  });

  test('AP-08: no plate promises a tool that does not exist', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHome(page);
    await page.locator(VITRINE).scrollIntoViewIfNeeded();
    await page.locator(`${VITRINE} ${ENGAGE}`).first().waitFor({ state: 'attached', timeout: 15000 });
    await page.locator(LISTEN).scrollIntoViewIfNeeded();
    await page.locator(`${LISTEN} ${ENGAGE}`).first().waitFor({ state: 'attached', timeout: 15000 });

    const labels = (await engagePlates(page)).map((p) => p.text);
    expect(labels, 'not exactly two engagement plates').toHaveLength(2);
    for (const label of labels) {
      expect(label, `"${label}" promises a booking tool`).not.toMatch(BOOKING_VERB);
      expect(label, `"${label}" does not name the mechanism`).toMatch(/^Email\b/);
      expect(label, `"${label}" is not named for a client`).toMatch(CLIENT_NAME);
    }
  });
});
