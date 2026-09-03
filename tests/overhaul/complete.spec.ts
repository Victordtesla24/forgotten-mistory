import { test, expect, type Page } from '@playwright/test';

/**
 * SPEC §10 TC-NFR-COMPLETE — nothing on the rendered page is a stub.
 *
 * The source-tree half of this gate lives in
 * `scripts/validate/overhaul_static_audit.mjs`, which greps `app/**`,
 * `components/**` and `lib/**` for truncation and placeholder markers, and
 * `tests/static_audit_fail.test.mjs` proves that audit exits non-zero when a
 * marker is injected. This file is the runtime half: the same rule, applied to
 * what a visitor actually sees, because a section can render an empty shell
 * from perfectly marker-free source.
 *
 * TC-COMPLETE-01 was deleted. It skipped itself outside CI and, inside CI,
 * asserted `expect(true).toBe(true)` on the theory that the audit had already
 * run — a test that cannot fail is not a gate, and the real gate is the audit
 * plus its own fail-loud contract test, both of which are unaffected.
 *
 * The section list was re-pointed with the page. `#contact` became `#listen`,
 * which now carries the four contact anchors, and `#vitrine` was added: the
 * placeholder scan over the project catalogue used to live in
 * `tests/overhaul/catalogue.spec.ts` (TC-CATALOG-05) against `#work` and the
 * `.vfx-gallery`, and when that file was deleted with its section the check
 * moved here rather than being lost. It matters more on the vitrine than
 * anywhere else, because a plate whose "limits" line degraded to a placeholder
 * would quietly turn the section's central claim into a lie.
 */

/** Markers that would mean a section shipped half-written. */
const BANNED = [
  'lorem ipsum',
  'placeholder',
  'coming soon',
  'under construction',
  'todo',
  'fixme',
  'tbd',
  '...',
  'not implemented',
  'undefined',
  '[object object]',
];

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
}

/** Scrolls a section into view, waits for its lazy content, and returns its text. */
async function sectionText(page: Page, id: string): Promise<string> {
  await page.locator(id).scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  return page.locator(id).innerText();
}

function expectNoStubMarkers(text: string, id: string) {
  const lower = text.toLowerCase();
  for (const marker of BANNED) {
    expect(lower, `${id} contains the stub marker "${marker}"`).not.toContain(marker);
  }
}

test.describe('TC-NFR-COMPLETE: Zero Placeholder/Stub Scan', () => {
  test.describe.configure({ timeout: 90000 });

  test('TC-COMPLETE-02: The hero is finished copy, not a scaffold', async ({ page }) => {
    await gotoHome(page);
    const text = await sectionText(page, '#hero');
    expectNoStubMarkers(text, '#hero');

    // And it is the real front door: name, positioning, and three figures.
    expect(text).toContain('Vikram Deshpande');
    expect(text).toContain('Delivery leadership');
    expect(text.length).toBeGreaterThan(300);
  });

  test('TC-COMPLETE-03: The experience timeline carries real roles', async ({ page }) => {
    await gotoHome(page);
    const text = await sectionText(page, '#experience');
    expectNoStubMarkers(text, '#experience');
    expect(text).toMatch(/ATO|ANZ|NAB|Microsoft|Telstra|InfoCentric|MYOB/);
    // Eight roles, each with a duration label — the bars are the section.
    expect(text).toMatch(/\d+(\.\d+)?\s*yr|\d+\s*mo/);
  });

  test('TC-COMPLETE-04: The calibration table carries real rows, including the un-held one', async ({ page }) => {
    await gotoHome(page);
    const text = await sectionText(page, '#skills');
    expectNoStubMarkers(text, '#skills');
    expect(text).toMatch(/AI|Engineering|Leadership|Certif|Education/);

    // Every row must have all four cells filled. An empty evidence or "where"
    // cell is exactly the shape of an unfinished row, and the section's rule is
    // that a capability without evidence gets no row at all.
    const emptyCells = await page.locator('#skills tbody tr:not([hidden]) td').evaluateAll((cells) =>
      cells.filter((c) => (c.textContent ?? '').trim().length === 0).length,
    );
    expect(emptyCells).toBe(0);
  });

  test('TC-COMPLETE-05: The closing section carries real contact details', async ({ page }) => {
    await gotoHome(page);
    const text = await sectionText(page, '#listen');
    expectNoStubMarkers(text, '#listen');
    expect(text.toLowerCase()).not.toContain('email@example.com');
    expect(text).toContain('sarkar.vikram@gmail.com');
  });

  test('TC-COMPLETE-06: About has real content, not stubs', async ({ page }) => {
    await gotoHome(page);
    const text = await sectionText(page, '#about');
    expectNoStubMarkers(text, '#about');
    expect(text.toLowerCase()).not.toContain('add your bio here');
    expect(text.length).toBeGreaterThan(200);

    // Ten dimensions, each answered. Nine would mean one silently dropped.
    await expect(page.locator('#about ol > li')).toHaveCount(10);
  });

  test('TC-COMPLETE-07: Every vitrine plate states what its repository does not do', async ({ page }) => {
    await gotoHome(page);
    const text = await sectionText(page, '#vitrine');
    expectNoStubMarkers(text, '#vitrine');

    // Inherited from the deleted TC-CATALOG-05. Six plates, and each one's
    // limits line is the part a reader is asked to trust the rest on, so an
    // empty or missing one is a completeness failure rather than a copy nit.
    const plates = page.locator('#vitrine li[aria-roledescription="plate"]');
    await expect(plates).toHaveCount(6);
    const limits = await plates.evaluateAll((items) =>
      items.map((item) => {
        const line = Array.from(item.querySelectorAll('p')).find((p) =>
          (p.textContent ?? '').includes('Limits'),
        );
        return (line?.textContent ?? '').replace('Limits', '').trim();
      }),
    );
    expect(limits).toHaveLength(6);
    for (const line of limits) expect(line.length).toBeGreaterThan(20);
  });

  test('TC-COMPLETE-08: The MiniVicBot clone opens without an error state', async ({ page }) => {
    await gotoHome(page);

    // The old selector was `[class*="mini-vic"]`, which matches nothing — the
    // component is styled with utility classes and identifies itself with
    // `data-testid` instead, so the check could never see its subject and the
    // guarded `if` meant it never ran.
    const toggle = page.locator('[data-testid="minivic-toggle"]');
    await expect(toggle).toBeVisible();
    await toggle.evaluate((el: HTMLElement) => el.click());

    const panel = page.locator('[data-testid="minivic-panel"]');
    await expect(panel).toBeVisible();
    const text = (await panel.innerText()).toLowerCase();
    expect(text).not.toContain('not implemented');
    expect(text).not.toContain('error:');
    expect(text).not.toContain('undefined');
  });
});
