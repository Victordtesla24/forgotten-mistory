import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * TC-NFR-A11Y — zero critical accessibility violations on the home page (WCAG 2.1 A/AA).
 * Runs in the overhaul suite on the configured browser (system Chrome locally; the CI
 * `axe` job additionally runs scripts/validate/phase06 against the built export).
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
  // let reveals/animations settle so axe sees the resting DOM
  await page.waitForTimeout(800);
}

test.describe('TC-NFR-A11Y — accessibility', () => {
  test.describe.configure({ timeout: 90000 });

  test('zero critical axe violations on the home page', async ({ page }) => {
    await gotoHome(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical');
    const serious = results.violations.filter((v) => v.impact === 'serious');

    // Surface the full picture in the failure message for triage.
    const fmt = (v: (typeof results.violations)[number]) =>
      `${v.impact}:${v.id} ×${v.nodes.length} (${v.help})`;
    const withNodes = [...critical, ...serious]
      .map((v) => `${v.impact}:${v.id} :: ${v.nodes.map((n) => n.target.join(' ')).join(' || ')}`)
      .join('\n');
    if (withNodes) console.log('AXE_NODES\n' + withNodes);

    // Executive AA bar: gate on BOTH critical and serious (zero tolerance).
    expect([...critical, ...serious].map(fmt), 'critical/serious axe violations').toEqual([]);
  });
});

/**
 * TC-NFR-A11Y-DIALOG — the capability modal (FloatingDetailBox) is an accessible
 * modal dialog (WCAG 2.1.2 / APG dialog pattern): it traps Tab focus inside the
 * dialog while open, moves focus to the close control on open, and restores focus
 * to the triggering element on Escape. The modal opens "locked" by CLICKING a hero
 * outcome card (handleMetaClick → openDetail(locked=true)); hover previews never
 * lock or trap, so a click is required to exercise the trap. Selectors mirror
 * modalInteractivity.spec.ts and floating-panels-animation.spec.ts.
 */
const DETAIL_DIALOG = '[role="dialog"][aria-labelledby="capability-modal-title"]';
const CLOSE_LABEL = 'Close capability details';

/** Click-open the locked dialog from the first hero outcome card and wait for the
 *  focus-to-close-button handoff (the component focuses the close control ~60ms
 *  after open). Returns the dialog + close-button locators. */
async function openLockedDialog(page: Page) {
  const card = page.locator('[data-outcome-card="true"]').first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible({ timeout: 10000 });
  await card.click();

  const dialog = page.locator(DETAIL_DIALOG);
  await expect(dialog).toBeVisible({ timeout: 5000 });
  const closeBtn = dialog.locator(`button[aria-label="${CLOSE_LABEL}"]`);
  await expect(closeBtn).toBeFocused({ timeout: 5000 });
  return { dialog, closeBtn };
}

test.describe('TC-NFR-A11Y-DIALOG — capability modal focus trap', () => {
  test.describe.configure({ timeout: 90000 });

  test('on open, focus moves to the close button', async ({ page }) => {
    await gotoHome(page);
    const { closeBtn } = await openLockedDialog(page);

    // document.activeElement is exactly the close control.
    await expect(closeBtn).toBeFocused();
    const activeLabel = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.getAttribute('aria-label') ?? null,
    );
    expect(activeLabel).toBe(CLOSE_LABEL);
  });

  test('Tab repeatedly keeps focus inside the dialog subtree', async ({ page }) => {
    await gotoHome(page);
    await openLockedDialog(page);

    // Cycle Tab well past the number of focusable controls; the trap must keep the
    // active element within the [role=dialog] subtree on every step.
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate((sel) => {
        const active = document.activeElement as HTMLElement | null;
        const dialog = document.querySelector(sel);
        return !!active && !!dialog && dialog.contains(active);
      }, DETAIL_DIALOG);
      expect(inside, `focus left the dialog after ${i + 1} Tab press(es)`).toBe(true);
    }
  });

  test('Shift+Tab from the first focusable wraps to the last focusable', async ({ page }) => {
    await gotoHome(page);
    const { dialog, closeBtn } = await openLockedDialog(page);

    // The close control is the first focusable element (focus rests there on open).
    await expect(closeBtn).toBeFocused();

    // Shift+Tab from the first focusable must wrap to the LAST focusable in the dialog.
    await page.keyboard.press('Shift+Tab');

    // Identify the dialog's last focusable element and assert focus landed on it.
    const focusedIsLast = await dialog.evaluate((root) => {
      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );
      const last = focusable[focusable.length - 1] ?? null;
      return !!last && document.activeElement === last;
    });
    expect(focusedIsLast, 'Shift+Tab from first did not wrap to last focusable').toBe(true);

    // And the wrap target is NOT the close button (i.e. it actually moved).
    await expect(closeBtn).not.toBeFocused();
  });

  test('Escape closes the modal and returns focus to the triggering card', async ({ page }) => {
    await gotoHome(page);
    const { dialog } = await openLockedDialog(page);

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0, { timeout: 5000 });

    // Focus is restored to the originating outcome card (the trigger element).
    const focusedIsCard = await page.evaluate(
      () => !!(document.activeElement as HTMLElement | null)?.closest('[data-outcome-card="true"]'),
    );
    expect(focusedIsCard, 'focus was not returned to the triggering card on Escape').toBe(true);
  });
});
