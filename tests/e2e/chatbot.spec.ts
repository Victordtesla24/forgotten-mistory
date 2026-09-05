import { test, expect, type Page } from '@playwright/test';
import { settleBoot } from '../helpers/boot';

/**
 * E2E — MiniVicBot, the conversational clone.
 *
 * MiniVicBot is one of the three things the rebuild left standing outside the
 * six sections: it mounts from `app/layout.tsx`, so it is present on the page
 * regardless of what the page contains. Its subject therefore survived intact
 * and none of these tests were deleted — but five of them were written against
 * a panel that never shipped, and had been failing ever since. They asserted an
 * `aria-labelledby`/`aria-describedby` pair, an `aria-expanded` launcher with a
 * visible "Ask Mini Vic" invitation, a `role="tablist"` persona selector, a
 * `data-testid="minivic-quick-prompts"` strip and a `role="status"` processing
 * region. The shipped component labels its dialog with `aria-label`, flips the
 * launcher's `aria-label` instead of `aria-expanded`, expresses persona
 * selection with `aria-pressed`, marks the prompt strip with the
 * `.minivic-quickstrip` class, and announces replies through the transcript's
 * own `aria-live="polite"` log. Every one of those is a legitimate way to meet
 * the contract, so the tests were re-pointed at what is really there rather
 * than left red or dropped.
 *
 * One consequence of the static export shapes TC-BOT-10. `NEXT_PUBLIC_STATIC_EXPORT`
 * is `1` in `out/`, so `handleSend` never probes `/api/*` — it goes straight to
 * the client-side brain in `lib/miniVicBrain.ts`, whose ladder ends in a
 * deterministic offline knowledge base when no key is bundled. That is what a
 * visitor to the deployed site actually gets, so it is what the test exercises;
 * mocking a route the build never calls proved nothing.
 *
 * The clone's audio moved out of this file. It was covered here, in
 * tests/overhaul/voiceover.spec.ts and in tests/e2e/clone-voice.spec.ts at
 * once, three times over and nowhere thoroughly. The three now divide the
 * subject: this file owns the panel, the composer and the reply;
 * voiceover.spec.ts owns the cloned greeting and its play/pause/mute
 * transport; clone-voice.spec.ts owns the page-wide voiceover controller.
 *
 * There is no preloader to dismiss. The wait is on React hydration of the
 * launcher, because a click that lands before the handlers are attached is a
 * click that does nothing.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('[data-testid="minivic-toggle"]');
      if (!btn) return false;
      return Object.keys(btn).some(
        (key) => key.startsWith('__reactFiber') || key.startsWith('__reactProps'),
      );
    },
    { timeout: 30000 },
  );
}

async function openMiniVic(page: Page) {
  const toggle = page.locator('[data-testid="minivic-toggle"]');
  await expect(toggle).toBeVisible();
  // Native element click — Playwright's centre-point click can land on the
  // avatar <video> child before pointer-events settle after hydration.
  await toggle.evaluate((el: HTMLElement) => el.click());

  const panel = page.locator('[data-testid="minivic-panel"]');
  await expect(panel).toBeVisible();

  return {
    toggle,
    panel,
    input: page.locator('[data-testid="minivic-input"]'),
    audio: page.locator('[data-testid="minivic-audio"]'),
  };
}

test.describe('E2E: MiniVicBot Chatbot', () => {
  test.describe.configure({ timeout: 90000 });

  test('TC-BOT-01: MiniVicBot toggle button is visible on the page', async ({ page }) => {
    await gotoHome(page);

    const toggle = page.locator('[data-testid="minivic-toggle"]');
    await expect(toggle).toBeAttached();
    await expect(toggle).toBeVisible();
  });

  test('TC-BOT-02: Opening MiniVic reveals the panel and chat input', async ({ page }) => {
    await gotoHome(page);

    const { panel, input } = await openMiniVic(page);
    await expect(panel).toContainText('Mini Vic');
    await expect(input).toBeVisible();
  });

  test('TC-BOT-03: Opening MiniVic shows the curated quick prompts', async ({ page }) => {
    await gotoHome(page);

    const { panel } = await openMiniVic(page);
    // The first two prompts are the two things a recruiter decides on first —
    // availability/location and one measured result (research-backed, v9 cycle 3).
    await expect(panel.getByRole('button', { name: 'Available when, and where?' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Biggest measured result' })).toBeVisible();
  });

  test('TC-BOT-04: Closing MiniVic via the launcher hides the panel and clears greeting audio state', async ({ page }) => {
    await gotoHome(page);

    const { toggle, panel, audio } = await openMiniVic(page);

    await expect
      .poll(
        async () => audio.evaluate((el) => (el as HTMLAudioElement).getAttribute('src') ?? ''),
        { timeout: 5000 },
      )
      .toContain('/assets/minivic-greeting.mp3');

    await toggle.click();
    await expect(panel).toBeHidden();
    await expect(toggle).toBeFocused();

    await expect
      .poll(
        async () =>
          audio.evaluate((el) => ({
            currentTime: (el as HTMLAudioElement).currentTime,
            paused: (el as HTMLAudioElement).paused,
            src: (el as HTMLAudioElement).getAttribute('src') ?? '',
          })),
        { timeout: 5000 },
      )
      .toEqual({
        currentTime: 0,
        paused: true,
        src: '',
      });
  });

  test('TC-BOT-05: MiniVicBot open/close cycle does not throw page errors', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await gotoHome(page);

    const { toggle } = await openMiniVic(page);
    await toggle.click();
    await page.waitForTimeout(300);

    expect(pageErrors).toHaveLength(0);
  });

  test('TC-BOT-06: MiniVic shell is a labelled dialog and takes focus when it opens', async ({ page }) => {
    await gotoHome(page);

    const { panel, input } = await openMiniVic(page);
    // The panel is a non-modal dialog named by `aria-label`, not by a referenced
    // heading. Both satisfy the same requirement — the dialog has an accessible
    // name — and this is the one the component actually ships.
    await expect(panel).toHaveAttribute('role', 'dialog');
    await expect(panel).toHaveAttribute('aria-label', 'MiniVic assistant panel');
    await expect(panel.getByRole('heading', { name: 'Mini Vic' })).toBeVisible();
    await expect(input).toBeVisible();

    // Opening the panel must move focus into it, or a keyboard user is left
    // behind on the launcher with a dialog they cannot reach.
    await expect(panel).toBeFocused();

    // The transcript is a polite live region, which is how a new reply is
    // announced without stealing focus from the composer.
    const transcript = panel.getByRole('log');
    await expect(transcript).toBeVisible();
    await expect(transcript).toHaveAttribute('aria-live', 'polite');
  });

  test('TC-BOT-07: The launcher announces which action it will perform', async ({ page }) => {
    await gotoHome(page);

    const toggle = page.locator('[data-testid="minivic-toggle"]');
    // The launcher carries a visible label from 834px up ("Ask Mini Vic"), so
    // its accessible name may no longer be an unrelated sentence: WCAG 2.5.3
    // (Label in Name) requires the visible words to be *in* the name, or a
    // speech-input user saying what they can read never reaches the control.
    // The name is therefore constant and starts with the visible label; the
    // state it used to carry is now on `aria-expanded`, which is what a
    // disclosure control is supposed to use (V-c16 §4, R-c13 CC-03a).
    await expect(toggle).toHaveAttribute('aria-label', /^Ask Mini Vic\b/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.evaluate((el: HTMLElement) => el.click());
    await expect(page.locator('[data-testid="minivic-panel"]')).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-label', /^Ask Mini Vic\b/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await toggle.click();
    await expect(page.locator('[data-testid="minivic-panel"]')).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('TC-BOT-08: Persona selector is a pressed-state toggle group with one active mode', async ({ page }) => {
    await gotoHome(page);

    const { panel } = await openMiniVic(page);
    const hiring = panel.locator('[data-testid="minivic-mode-recruiter"]');
    const engineering = panel.locator('[data-testid="minivic-mode-engineer"]');
    const story = panel.locator('[data-testid="minivic-mode-story"]');

    // Exactly one mode is pressed at a time, and the status line under the
    // control says what the selected mode changes about the answers.
    await expect(hiring).toHaveAttribute('aria-pressed', 'true');
    await expect(engineering).toHaveAttribute('aria-pressed', 'false');
    await expect(story).toHaveAttribute('aria-pressed', 'false');
    await expect(panel).toContainText('Outcomes, budgets, velocity');

    await engineering.click();
    await expect(engineering).toHaveAttribute('aria-pressed', 'true');
    await expect(hiring).toHaveAttribute('aria-pressed', 'false');
    await expect(story).toHaveAttribute('aria-pressed', 'false');
    await expect(panel).toContainText('Architecture, telemetry, trade-offs');
  });

  test('TC-BOT-09: Mobile shell stays inside the viewport with composer visible', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await gotoHome(page);

    const { panel, input } = await openMiniVic(page);
    const box = await panel.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
    expect(box!.y + box!.height).toBeLessThanOrEqual(640);
    await expect(input).toBeVisible();
    await expect(panel.locator('.minivic-quickstrip')).toBeVisible();
  });

  test('TC-BOT-10: A question gets exactly one answer, and the composing state clears', async ({ page }) => {
    await gotoHome(page);
    const { panel, input } = await openMiniVic(page);
    // Muting first keeps the assertion about text rather than about whether the
    // browser's autoplay policy let the cloned voice start.
    await panel.getByRole('button', { name: 'Mute voice' }).click();

    const question = 'How would you assess role fit?';
    await input.fill(question);

    const messages = panel.locator('[data-minivic-message]');
    const before = await messages.count();
    await input.press('Enter');

    // The question echoes once — the duplicate-render regression this test was
    // originally written for would show up here as a count of two.
    await expect(panel.getByText(question, { exact: true })).toHaveCount(1);

    // And exactly one reply arrives. On the static export that comes from the
    // offline knowledge base in lib/miniVicBrain.ts, which is what a real
    // visitor to forgotten-mistory.web.app gets.
    await expect(messages).toHaveCount(before + 2, { timeout: 30000 });
    const reply = messages.nth(before + 1);
    await expect(reply).toContainText('Vic');
    expect((await reply.innerText()).trim().length).toBeGreaterThan(20);

    // The transient "Composing a reply…" indicator must not be left on screen.
    await expect(panel.getByText('Composing a reply…')).toHaveCount(0);
  });

  test('TC-BOT-12: The open panel stacks above the launcher on its axis and never covers the h1', async ({
    page,
  }) => {
    // Design council R-c1, C5: at 1440 the panel occluded the end of
    // "Vikram Deshpande" and sat 16 px from the right edge beside a launcher
    // that sits 24 px from it — two elements in one corner on two verticals.
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHome(page);
    const { panel, toggle } = await openMiniVic(page);
    await page.waitForTimeout(400);

    const h1 = (await page.locator('#hero h1').boundingBox())!;
    const panelBox = (await panel.boundingBox())!;
    const intersects =
      panelBox.x < h1.x + h1.width &&
      panelBox.x + panelBox.width > h1.x &&
      panelBox.y < h1.y + h1.height &&
      panelBox.y + panelBox.height > h1.y;
    expect(intersects, `panel ${JSON.stringify(panelBox)} must not cover h1 ${JSON.stringify(h1)}`).toBe(false);

    const toggleBox = (await toggle.boundingBox())!;
    const panelRight = 1440 - (panelBox.x + panelBox.width);
    const toggleRight = 1440 - (toggleBox.x + toggleBox.width);
    expect(Math.abs(panelRight - toggleRight), `panel right ${panelRight}, launcher right ${toggleRight}`).toBeLessThanOrEqual(1);
    expect(toggleRight, 'launcher sits 24px from the edge').toBeCloseTo(24, 0);
    // Stacked, not beside: the panel's bottom clears the launcher's top.
    expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(toggleBox.y + 0.5);

    const strip = page.locator('.minivic-quickstrip');
    // `scroll-snap-type: x proximity` is what app/globals.css declares, but
    // `proximity` is the initial strictness, so Chromium's computed value
    // serialises as the axis alone — "x". Asserting the declared spelling could
    // never pass in this browser (it is why TC-BOT-12 was red on CI run
    // 33936783382); what the test is entitled to require is that the row snaps
    // on the horizontal axis, in either serialisation.
    await expect(strip).toHaveCSS('scroll-snap-type', /^x( proximity)?$/);
    const mask = await strip.evaluate((el) => {
      const cs = getComputedStyle(el);
      return cs.maskImage !== 'none' ? cs.maskImage : cs.webkitMaskImage;
    });
    expect(mask, 'chip row must fade at its right edge').toMatch(/linear-gradient/);
  });

  test('TC-BOT-14: The open panel covers no glyph of the hero name at any laptop width', async ({
    page,
  }) => {
    // V-c16 F-V16-2. TC-BOT-12 asserts "never covers the h1" but measures one
    // viewport (1440) and one box (the h1's block box). Both are too narrow.
    // At 1280x800 the panel {l:824,t:232,r:1256,b:712} clears the h1's block
    // box by nothing at all — the box ends at y=284 — while the rendered
    // glyphs run to y=301 and x=959, so ~135x69 px of "Vikram Deshpande" was
    // painted over. This test measures what a reader actually sees: every
    // client rect of every text node in the h1, via Range.getClientRects(),
    // at the three laptop widths the failure was reproduced on, and requires
    // a real gap rather than a shared edge.
    const CLEARANCE = 16;
    const VIEWPORTS = [
      { width: 1440, height: 900 },
      { width: 1366, height: 768 },
      { width: 1280, height: 800 },
    ];

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await gotoHome(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      const { panel } = await openMiniVic(page);
      await page.waitForTimeout(400);

      const measured = await page.evaluate(() => {
        const panelEl = document.querySelector('[data-testid="minivic-panel"]')!;
        const p = panelEl.getBoundingClientRect();
        const h1 = document.querySelector('#hero h1')!;
        const rects: { l: number; t: number; r: number; b: number; text: string }[] = [];
        const walk = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walk.nextNode())) {
          const text = (node.nodeValue || '').trim();
          if (!text) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const r of Array.from(range.getClientRects())) {
            if (r.width < 0.5 || r.height < 0.5) continue;
            rects.push({ l: r.left, t: r.top, r: r.right, b: r.bottom, text: text.slice(0, 32) });
          }
        }
        const hits = rects.filter(
          (r) => p.left < r.r && p.right > r.l && p.top < r.b && p.bottom > r.t,
        );
        return {
          panel: { l: Math.round(p.left), t: Math.round(p.top), r: Math.round(p.right), b: Math.round(p.bottom) },
          glyphBottom: Math.round(Math.max(...rects.map((r) => r.b))),
          glyphRight: Math.round(Math.max(...rects.map((r) => r.r))),
          rectCount: rects.length,
          hits: hits.map((r) => ({
            l: Math.round(r.l), t: Math.round(r.t), r: Math.round(r.r), b: Math.round(r.b), text: r.text,
          })),
        };
      });

      expect(measured.rectCount, 'the hero name must render at least one glyph rect').toBeGreaterThan(0);
      expect(
        measured.hits,
        `${viewport.width}x${viewport.height}: the open panel ${JSON.stringify(measured.panel)} ` +
          `covers ${measured.hits.length} glyph rect(s) of the hero name: ${JSON.stringify(measured.hits)}`,
      ).toEqual([]);
      expect(
        measured.panel.t - measured.glyphBottom,
        `${viewport.width}x${viewport.height}: the panel top ${measured.panel.t} must clear the ` +
          `lowest glyph of the hero name (${measured.glyphBottom}) by ${CLEARANCE}px, not sit on it`,
      ).toBeGreaterThanOrEqual(CLEARANCE);
    }
  });

  test('TC-BOT-11: The transcript controls are present and say what they do', async ({ page }) => {
    await gotoHome(page);

    const { panel } = await openMiniVic(page);
    // Every control in the header strip is icon-only, so its `aria-label` is
    // the whole of its accessible name. The audio behaviour behind these lives
    // in tests/overhaul/voiceover.spec.ts; what is asserted here is only that
    // the composer offers them and names them.
    await expect(panel.getByRole('button', { name: 'Mute voice' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Replay last voice' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Reset conversation' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Close mini Vic' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Send message' })).toBeVisible();
  });
});
