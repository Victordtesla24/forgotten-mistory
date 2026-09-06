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
    await expect(page.locator(ABOUT)).toContainText('Ten axes · no scores');
    // Not this section's scene alone: `gl=off` is every scene's answer.
    await expect(page.locator('#hero canvas, #experience canvas')).toHaveCount(0);

    // And the flag has to be the reason. Without this second half the test
    // would still pass on a host that merely happens to be too busy for the
    // software rasteriser to clear the frame budget — the exact false green
    // the old version lived on. `?gl=force` on the same build mounts the
    // field, so the zero above is the flag's doing and nothing else.
    await page.goto('/?gl=force');
    await page.locator(ABOUT).scrollIntoViewIfNeeded();
    await expect(page.locator(`${ABOUT} canvas`)).toHaveCount(1);
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

  test('TC-ABOUT-08: the compass turns as the reader scrolls — item 6 centred reads 06 / FROM THE ROLE', async ({
    page,
  }) => {
    await waitForSweep(page);
    await centreItem(page, 6);
    await page.waitForTimeout(900);
    const rose = page.locator(`${ABOUT} svg g[class*="rose"]`).last();
    const transform = await rose.evaluate((el) => getComputedStyle(el).transform);
    // Index 5 of ten sectors is carried to twelve o'clock by rotate(-180deg).
    expect(Math.abs(Math.abs(rotationOf(transform)) - 180), transform).toBeLessThan(0.5);
    await expect(page.locator(`${ABOUT} ol li`).nth(5)).toHaveAttribute('data-active', 'true');
    // The hub readout, not the ring: the numerals 01–10 are always on the face.
    await expect(page.locator(READ_NUMBER)).toHaveText('06');
    await expect(page.locator(READ_STATE)).toHaveText('FROM THE ROLE');
    // The rotation itself still travels on the cinematic-in transition.
    const transition = await rose.evaluate((el) => {
      const cs = getComputedStyle(el);
      return `${cs.transitionProperty} ${cs.transitionDuration} ${cs.transitionTimingFunction}`;
    });
    expect(transition).toContain('transform');
    expect(transition).toContain('0.72s');
    expect(transition).toContain('cubic-bezier(0.16, 1, 0.3, 1)');
  });

  test('TC-ABOUT-09: hover overrides the scroll index, and leaving the list hands it back', async ({ page }) => {
    await waitForSweep(page);
    await centreItem(page, 6);
    await page.waitForTimeout(900);
    await expect(page.locator(READ_NUMBER)).toHaveText('06');
    // Move the pointer onto the next item down without scrolling — a
    // `locator.hover()` would scroll it into view and move the scroll index
    // with it, which is not what is under test here.
    const seventh = await page.locator(`${ABOUT} ol li`).nth(6).boundingBox();
    expect(seventh).not.toBeNull();
    await page.mouse.move(seventh!.x + seventh!.width / 2, seventh!.y + Math.min(24, seventh!.height / 2));
    await expect(page.locator(READ_NUMBER)).toHaveText('07');
    await expect(page.locator(`${ABOUT} ol li`).nth(6)).toHaveAttribute('data-active', 'true');
    // Off the list: back to whatever the scroll position says.
    await page.mouse.move(2, 2);
    await expect(page.locator(READ_NUMBER)).toHaveText('06');
    await expect(page.locator(`${ABOUT} ol li`).nth(5)).toHaveAttribute('data-active', 'true');
  });

  test('TC-ABOUT-10: on first entry the bezel sweeps once — 1160 ms, emphasised ease, never again', async ({
    page,
  }) => {
    // beforeEach has already scrolled the section into view, which is the
    // first entry; the sweep is running or has just run.
    await expect(page.locator(ABOUT)).toHaveAttribute('data-swept', 'true');
    const sweep = page.locator(`${ABOUT} svg [data-sweep]`);
    const declared = await sweep.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        duration: cs.animationDuration,
        easing: cs.animationTimingFunction,
        iterations: cs.animationIterationCount,
        name: cs.animationName,
      };
    });
    expect(declared.duration).toBe('1.16s');
    expect(declared.easing).toBe('cubic-bezier(0.16, 1, 0.3, 1)');
    expect(declared.iterations).toBe('1');
    expect(declared.name).not.toBe('none');
    const played = await sweep.evaluate((el) =>
      el.getAnimations().map((a) => ({
        state: a.playState,
        duration: Number(a.effect?.getComputedTiming().duration ?? 0),
      })),
    );
    expect(played.length).toBeGreaterThanOrEqual(1);
    expect(played[0].duration).toBe(1160);
    expect(['running', 'finished']).toContain(played[0].state);

    // Leave and come back: the mark stays and nothing replays.
    await waitForSweep(page);
    await page.locator('#hero').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.locator(ABOUT).scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await expect(page.locator(ABOUT)).toHaveAttribute('data-swept', 'true');
    const replayed = await sweep.evaluate(
      (el) => el.getAnimations().filter((a) => a.playState === 'running').length,
    );
    expect(replayed).toBe(0);
  });

  test('TC-ABOUT-11: under reduced motion the index snaps — no sweep, no travel, still swept', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator(ABOUT).scrollIntoViewIfNeeded();
    await expect(page.locator(ABOUT)).toHaveAttribute('data-swept', 'true');
    const timing = await page.locator(`${ABOUT} svg [data-sweep]`).evaluate((el) => {
      const outer = getComputedStyle(el);
      const rose = el.querySelector('g') as SVGGElement;
      const inner = getComputedStyle(rose);
      return {
        sweepAnimation: outer.animationDuration,
        roseAnimation: inner.animationDuration,
        roseTransition: inner.transitionDuration,
      };
    });
    expect(timing.sweepAnimation).toBe('0s');
    expect(timing.roseAnimation).toBe('0s');
    expect(timing.roseTransition).toBe('0s');
    // The face still points: centre item 6 and it reads 06 at once.
    await centreItem(page, 6);
    await expect(page.locator(READ_NUMBER)).toHaveText('06');
    const transform = await page
      .locator(`${ABOUT} svg g[class*="rose"]`)
      .last()
      .evaluate((el) => getComputedStyle(el).transform);
    expect(Math.abs(Math.abs(rotationOf(transform)) - 180), transform).toBeLessThan(0.5);
  });

  test('TC-ABOUT-12: no gold on the face — the active sector, its numeral and the ring stay achromatic', async ({
    page,
  }) => {
    await waitForSweep(page);
    await page.locator(`${ABOUT} ol li`).nth(0).hover();
    const active = page.locator(`${ABOUT} svg path[data-active]`);
    await expect(active).toHaveCount(1);
    const chroma = (colour: string): number => {
      const m = colour.match(/rgba?\(([^)]+)\)/);
      if (!m) return colour.startsWith('url') || colour === 'none' ? 0 : 255;
      const [r, g, b] = m[1].split(/[\s,/]+/).map((v) => parseFloat(v));
      return Math.max(r, g, b) - Math.min(r, g, b);
    };
    const paints = await page
      .locator(`${ABOUT} svg g[class*="rose"]`)
      .last()
      .evaluate((rose) =>
        [rose, ...Array.from(rose.querySelectorAll('*'))].map((el) => {
          const cs = getComputedStyle(el);
          return { tag: el.tagName, active: el.hasAttribute('data-active'), fill: cs.fill, stroke: cs.stroke };
        }),
      );
    const activeSector = paints.find((p) => p.tag === 'path' && p.active);
    expect(activeSector).toBeTruthy();
    expect(chroma(activeSector!.fill), activeSector!.fill).toBeLessThanOrEqual(8);
    expect(chroma(activeSector!.stroke), activeSector!.stroke).toBeLessThanOrEqual(8);
    const offenders = paints
      .filter((p) => chroma(p.fill) > 8 || chroma(p.stroke) > 8)
      .map((p) => `${p.tag} fill=${p.fill} stroke=${p.stroke}`);
    expect(offenders).toEqual([]);
  });

  /**
   * The dial and the list start on the same line (R-c8 C-11).
   *
   * The instrument is the accompaniment and the ten are the content; when the
   * face floats a dozen pixels below the list's first rule the two read as two
   * unrelated objects that happen to share a row. They are one row, and the row
   * has one top.
   */
  test('TC-ABOUT-13: at 1440 the dial and the first dimension share a baseline', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.locator(ABOUT).scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    // Measured from the top of the document, with the page scrolled back to the
    // start: the instrument is `position: sticky`, so a viewport-relative
    // reading taken mid-section would compare a pinned element against a
    // scrolled one and say nothing about where the row begins.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    const tops = await page.evaluate(() => {
      const about = document.querySelector('#about')!;
      const dial = about.querySelector('svg[class*="compass"]') ?? about.querySelector('svg');
      const first = about.querySelector('ol li');
      const docTop = (el: Element) => el.getBoundingClientRect().top + window.scrollY;
      return {
        dial: dial ? docTop(dial) : null,
        list: first ? docTop(first) : null,
      };
    });

    expect(tops.dial, 'no dial svg in #about').not.toBeNull();
    expect(tops.list, 'no list item in #about').not.toBeNull();
    expect(
      Math.abs(tops.dial! - tops.list!),
      `dial top ${tops.dial}, first item top ${tops.list}`,
    ).toBeLessThanOrEqual(4);
  });
});
