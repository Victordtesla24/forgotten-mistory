import { test, expect, type Page } from '@playwright/test';

/**
 * About — the ten dimensions his own job-fit engine scores a candidate on,
 * answered one at a time.
 *
 * The section's argument is that a self-assigned number is not evidence, so
 * these tests pin two things above all: that all ten dimensions are present and
 * named exactly as the product names them, and that no score appears anywhere
 * near them. If a future change adds a percentage or a progress bar to this
 * section, that is not a styling regression — it contradicts the copy sitting
 * directly above it, and this file should fail.
 */

const ABOUT = '#about';
/** The hub readout: the number of the axis being read, and which side it is computed from. */
const READ_NUMBER = `${ABOUT} svg text[class*="readNumber"]`;
const READ_STATE = `${ABOUT} svg text[class*="readState"]`;

const DIMENSIONS = [
  'Technical Skills',
  'Experience Level',
  'Industry Match',
  'Role Alignment',
  'Culture Fit',
  'Salary Fit',
  'Location Match',
  'Career Growth',
  'Company Stability',
  'North Star Align',
];

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator(ABOUT).scrollIntoViewIfNeeded();
});

test.describe('About', () => {
  test('TC-ABOUT-01: all ten dimensions render, in the engine’s own order', async ({ page }) => {
    const names = await page.locator(`${ABOUT} ol li h3`).allInnerTexts();
    expect(names).toHaveLength(10);
    names.forEach((text, index) => {
      expect(text).toContain(DIMENSIONS[index]);
    });
  });

  test('TC-ABOUT-02: every dimension carries an answer and its evidence', async ({ page }) => {
    const items = page.locator(`${ABOUT} ol li`);
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      const paragraphs = items.nth(i).locator('p');
      await expect(paragraphs).toHaveCount(2);
      const answer = (await paragraphs.nth(0).innerText()).trim();
      const evidence = (await paragraphs.nth(1).innerText()).trim();
      expect(answer.length, `answer ${i}`).toBeGreaterThan(40);
      expect(evidence.length, `evidence ${i}`).toBeGreaterThan(10);
    }
  });

  test('TC-ABOUT-03: no dimension is given a score', async ({ page }) => {
    // The check is scoped to the headings and the answers, not the evidence
    // lines: an evidence line is where a figure is allowed to appear at all,
    // graded honestly — "−38% simulated error-budget breaches" prints in the
    // caption grey precisely because it is self-reported, not gold.
    // What must never appear is a rating attached to a dimension —
    // a percentage, an "8/10", or a bar — since the copy directly above says
    // there are none and explains why.
    const headings = (await page.locator(`${ABOUT} ol li h3`).allInnerTexts()).join(' ');
    const answers = (await page.locator(`${ABOUT} ol li p:first-of-type`).allInnerTexts()).join(' ');
    for (const scored of [headings, answers]) {
      expect(scored).not.toMatch(/\b\d{1,3}\s?%/);
      expect(scored).not.toMatch(/\b\d{1,2}\s?\/\s?10\b/);
      expect(scored).not.toMatch(/\b\d{1,2}\s+out of\s+10\b/i);
    }
    // No meters, progress bars or sliders either.
    await expect(page.locator(`${ABOUT} progress, ${ABOUT} meter, ${ABOUT} [role="progressbar"]`)).toHaveCount(0);
    await expect(page.locator(ABOUT)).toContainText('There are no scores below');
  });

  test('TC-ABOUT-04: the dimensions name their source', async ({ page }) => {
    const link = page.locator(`${ABOUT} a[href*="aether-job-career-agent"]`);
    await expect(link).toBeVisible();
    await expect(page.locator(ABOUT)).toContainText('apps/api/app/routers/jobs.py');
  });

  test('TC-ABOUT-05: job-side dimensions are labelled as such', async ({ page }) => {
    // Salary Fit, Location Match and Company Stability are computed from the
    // role, not the candidate. Answering them about oneself without saying so
    // would misrepresent what the engine measures.
    const tagged = page.locator(`${ABOUT} ol li[data-side="role"]`);
    await expect(tagged).toHaveCount(3);
    for (const name of ['Salary Fit', 'Location Match', 'Company Stability']) {
      await expect(
        page.locator(`${ABOUT} ol li[data-side="role"]`, { hasText: name }),
      ).toHaveCount(1);
    }
  });

  test('TC-ABOUT-06: the ten items are reading aids, not tab stops', async ({ page }) => {
    // The ten <li> used to carry tabindex=0 with no role and no accessible
    // name: ten dead stops a keyboard user had to Tab through to reach the
    // next real control (adversarial F4). Nothing inside an item is
    // interactive — the answers are prose, the caliper is a mark — so the
    // decision is to drop keyboard focus for the items entirely and let the
    // compass follow scroll (a keyboard reader scrolls). Tab from the heading
    // must therefore reach the provenance link in at most two stops, with no
    // <li> in between.
    await expect(page.locator(`${ABOUT} ol li[tabindex]`)).toHaveCount(0);

    // Clicking prose sets the sequential-focus starting point in Chromium, so
    // the next Tab continues from the heading rather than from the top.
    await page.locator(`${ABOUT} h2`).click();
    const provenance = page.locator(`${ABOUT} a[href*="aether-job-career-agent"]`);
    let stops = 0;
    let landed = false;
    while (stops < 2 && !landed) {
      await page.keyboard.press('Tab');
      stops += 1;
      const focused = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el ? `${el.tagName}:${el.getAttribute('href') ?? ''}` : 'none';
      });
      expect(focused, `Tab #${stops} landed on a list item`).not.toMatch(/^LI:/);
      landed = focused.startsWith('A:') && focused.includes('aether-job-career-agent');
    }
    expect(landed, 'the provenance link was not reached within two Tab stops').toBe(true);
    await expect(provenance).toBeFocused();

    // Every focusable element inside the section has an accessible name.
    const unnamed = await page.locator(ABOUT).evaluate((root) => {
      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])',
        ),
      );
      const nameOf = (el: HTMLElement): string => {
        const labelledBy = el.getAttribute('aria-labelledby');
        if (labelledBy) {
          const text = labelledBy
            .split(/\s+/)
            .map((id) => document.getElementById(id)?.textContent ?? '')
            .join(' ')
            .trim();
          if (text) return text;
        }
        return (el.getAttribute('aria-label') ?? el.textContent ?? el.getAttribute('title') ?? '').trim();
      };
      return focusable.filter((el) => nameOf(el).length === 0).map((el) => el.outerHTML.slice(0, 80));
    });
    expect(unnamed).toEqual([]);
  });

  test('TC-ABOUT-07: the section is complete without WebGL', async ({ page }) => {
    // The no-WebGL path is *asked for*, never inferred from the host.
    //
    // This test used to load `/` and rely on headless Chrome reporting
    // SwiftShader, which `useGLCapability` refuses by name. But that refusal is
    // appealed: `projectedFrameMs()` re-measures a refused renderer and admits
    // it whenever it clears the 33 ms frame budget — which a software
    // rasteriser does on an idle machine. So the assertion below was really
    // asserting "this VPS is busy right now", and it inverted with the load
    // average: 3/3 failures on an idle host, green under load
    // (docs/delivery/evidence/v10-20260905T0515Z/W1-RED3/01-reproduction.log).
    //
    // `?gl=off` is the documented contract (components/gl/useGLCapability.ts):
    // capability answers `'unsupported'` before any context is created, so a
    // reader with no WebGL and this test see the same page on every machine.
    await page.goto('/?gl=off');
    await page.locator(ABOUT).scrollIntoViewIfNeeded();
    await expect(page.locator(`${ABOUT} ol li`)).toHaveCount(10);
    await expect(page.locator(`${ABOUT} canvas`)).toHaveCount(0);
    // `Ten axes · no scores` was the compass's own constant and left with it
    // (docs/architecture/INTERIM-FRAME.md §1 item 8); the ten rows above are the
    // section's completeness now, and interim-frame TC-IF-05 asserts the rest of
    // it — the heading, the lede and the provenance line.
    // Not this section's scene alone: `gl=off` is every scene's answer.
    await expect(page.locator('#hero canvas, #experience canvas')).toHaveCount(0);

    // The second half of this case — `?gl=force` mounts the field, so the zero
    // above is the flag's doing — is SUPERSEDED by interim-frame TC-IF-06: with
    // the field deleted there is nothing left for the flag to mount, and TC-IF-06
    // asserts zero canvases and zero page errors on that path instead.
    await page.goto('/?gl=force');
    await page.locator(ABOUT).scrollIntoViewIfNeeded();
    await expect(page.locator(`${ABOUT} canvas`)).toHaveCount(0);
  });

  /**
   * Scroll item `n` (1-based) so its centre sits at the viewport's centre, with
   * the pointer parked off the list so no hover is live.
   */
  async function centreItem(page: Page, n: number) {
    await page.mouse.move(2, 2);
    await page
      .locator(`${ABOUT} ol li`)
      .nth(n - 1)
      .evaluate((el) => {
        const r = el.getBoundingClientRect();
        window.scrollTo(0, window.scrollY + r.top + r.height / 2 - window.innerHeight / 2);
      });
  }

  /** The rotation, in degrees, that a computed 2-D transform matrix encodes. */
  function rotationOf(transform: string): number {
    const m = transform.match(/matrix\(([^)]+)\)/);
    if (!m) return 0;
    const [a, b] = m[1].split(',').map((v) => parseFloat(v.trim()));
    return (Math.atan2(b, a) * 180) / Math.PI;
  }

  /** Wait until the first-entry sweep on the compass has finished. */
  async function waitForSweep(page: Page) {
    await expect(page.locator(ABOUT)).toHaveAttribute('data-swept', 'true');
    await page.locator(`${ABOUT} svg [data-sweep]`).evaluate(async (el) => {
      await Promise.all(el.getAnimations().map((a) => a.finished.catch(() => undefined)));
    });
  }

  /* SUPERSEDED by tests/overhaul/interim-frame.spec.ts TC-IF-01 and TC-IF-05.
     It asserted the compass — its index, its sweep, its achromatic face, its
     baseline with the first dimension — and the field behind it.
     Removed on the Owner's 2026-09-06T05:51Z instruction
     (docs/architecture/INTERIM-FRAME.md); a case that measures a deleted element
     is not a case that can be made to pass. */

});
