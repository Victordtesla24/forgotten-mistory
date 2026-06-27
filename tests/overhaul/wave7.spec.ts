import { test, expect, type Page } from '@playwright/test';

/**
 * WAVE 7 — Showcase + easter-egg elevation (#18 ProjectsCarousel, #19 GithubFeed,
 * #20 HiddenTerminal). Studio-grade, restrained, strictly-monochrome motion that
 * MUST flatten under prefers-reduced-motion while keeping every surface usable.
 *
 *   #18 ProjectsCarousel — snap scroll, glassmorphic card surface, pointer 3D tilt
 *                          (perspective + rotateX/Y), staggered whileInView entrance,
 *                          drag-release inertia with decay. Reduced motion → native scroll.
 *   #19 GithubFeed       — skeleton shimmer while loading, staggered card entrance,
 *                          star count-up badge, monochrome language dot, fresh-data
 *                          pulse, error state with a retry button that re-fetches.
 *   #20 HiddenTerminal   — per-character typewriter reveal, CRT scan-line overlay,
 *                          arrow-key command history, Konami celebration burst, flicker.
 */

const SAMPLE_REPOS = [
  {
    id: 1,
    name: 'forgotten-mistory',
    html_url: 'https://github.com/Victordtesla24/forgotten-mistory',
    description: 'Monochrome portfolio with GSAP + R3F.',
    language: 'TypeScript',
    stargazers_count: 7,
    pushed_at: '2026-06-18T09:00:00Z',
  },
  {
    id: 2,
    name: 'prompt-reconstruction-engine',
    html_url: 'https://github.com/Victordtesla24/prompt-reconstruction-engine',
    description: 'Deterministic prompt rewriting engine.',
    language: 'JavaScript',
    stargazers_count: 3,
    pushed_at: '2026-06-10T09:00:00Z',
  },
];

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
}

/** True when the element's computed backdrop-filter (or -webkit-) blurs. */
async function hasBackdropBlur(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) return false;
    const cs = getComputedStyle(el);
    const bf = `${cs.backdropFilter} ${(cs as unknown as Record<string, string>).webkitBackdropFilter ?? ''}`;
    return /blur\(/.test(bf);
  }, selector);
}

/** Read an element's INLINE CSS custom property (what the JS drivers write). */
async function inlineVar(page: Page, selector: string, prop: string): Promise<string> {
  return page.evaluate(
    ([sel, p]) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      return el ? el.style.getPropertyValue(p).trim() : '__no-el__';
    },
    [selector, prop] as const,
  );
}

/** Fulfil the GitHub repos request with a fixed payload (optionally after a delay). */
async function routeGithub(page: Page, repos: unknown, delayMs = 0) {
  await page.route('**/api.github.com/**', async (route) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(repos),
    });
  });
}

// ── #18 ProjectsCarousel ───────────────────────────────────────────────────────────
test.describe('WAVE7 #18 — ProjectsCarousel snap + glass + 3D tilt + stagger', () => {
  test.describe.configure({ timeout: 90000 });

  test('rail snaps on a glassmorphic surface and staggers its cards into view', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));

    const rail = page.locator('.projects-carousel');
    await expect(rail).toHaveAttribute('data-carousel-stagger', '');

    // Native snap physics: the rail declares a horizontal snap axis.
    const snap = await rail.evaluate((el) => getComputedStyle(el).scrollSnapType);
    expect(snap, 'carousel must declare a horizontal scroll-snap axis').toContain('x');

    // Glass surface on the card visual.
    expect(await hasBackdropBlur(page, '.project-image'), 'card surface must use a backdrop blur').toBe(true);

    // Staggered entrance: every card wrapper resolves to fully visible.
    const cards = rail.locator(':scope > .project-card');
    expect(await cards.count(), 'rail must carry ≥2 project cards').toBeGreaterThanOrEqual(2);
    await expect
      .poll(
        async () =>
          cards.evaluateAll((els) => els.every((el) => Number(getComputedStyle(el as HTMLElement).opacity) > 0.9)),
        { timeout: 8000 },
      )
      .toBe(true);
  });

  test('pointer over a card writes a 3D tilt with rotation vars', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));

    const card = page.locator('.project-card[data-tilt-card]').first();
    await expect(card).toBeAttached();
    await card.scrollIntoViewIfNeeded();
    const box = await card.boundingBox();
    expect(box).not.toBeNull();

    await page.mouse.move(box!.x + box!.width * 0.7, box!.y + box!.height * 0.35, { steps: 6 });

    await expect
      .poll(async () => inlineVar(page, '.project-card[data-tilt-card]', '--tilt-y'), { timeout: 4000 })
      .not.toBe('');
    // The glass surface actually transforms in 3D (perspective → matrix3d, not none).
    const transform = await card
      .locator('.project-image')
      .evaluate((el) => getComputedStyle(el as HTMLElement).transform);
    expect(transform).not.toBe('none');
  });

  test('reduced motion: no tilt vars are written (native scroll only)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));

    const card = page.locator('.project-card[data-tilt-card]').first();
    await card.scrollIntoViewIfNeeded();
    const box = await card.boundingBox();
    await page.mouse.move(box!.x + box!.width * 0.7, box!.y + box!.height * 0.35, { steps: 6 });
    await page.waitForTimeout(200);
    expect(await inlineVar(page, '.project-card[data-tilt-card]', '--tilt-y')).toBe('');
  });
});

// ── #19 GithubFeed ────────────────────────────────────────────────────────────────
test.describe('WAVE7 #19 — GithubFeed skeleton + stagger + star badge + retry', () => {
  test.describe.configure({ timeout: 90000 });

  test('renders a shimmering skeleton while the feed is loading', async ({ page }) => {
    await routeGithub(page, SAMPLE_REPOS, 2500);
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('github-projects')?.scrollIntoView({ block: 'center' }));

    const skeletons = page.locator('#github-projects [data-skeleton]');
    expect(await skeletons.count(), 'a skeleton must be shown while loading').toBeGreaterThanOrEqual(1);
    // The shimmer is a real animation, not a static block.
    const anim = await skeletons.first().evaluate((el) => getComputedStyle(el as HTMLElement).animationName);
    expect(anim, 'skeleton must carry a shimmer keyframe').not.toBe('none');
  });

  test('on data arrival, cards stagger in with a star badge and language dot', async ({ page }) => {
    await routeGithub(page, SAMPLE_REPOS);
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('github-projects')?.scrollIntoView({ block: 'center' }));

    const group = page.locator('[data-feed-stagger]');
    await expect(group).toBeAttached();

    const cards = group.locator(':scope > .repo-card');
    await expect.poll(async () => cards.count(), { timeout: 8000 }).toBeGreaterThanOrEqual(2);
    await expect
      .poll(
        async () =>
          cards.evaluateAll((els) => els.every((el) => Number(getComputedStyle(el as HTMLElement).opacity) > 0.9)),
        { timeout: 8000 },
      )
      .toBe(true);

    await expect(page.locator('#github-projects [data-star-count]').first()).toBeVisible();
    await expect(page.locator('#github-projects .repo-lang-dot').first()).toBeAttached();
    // A live fresh-data pulse marks the feed as current.
    await expect(page.locator('#github-projects [data-fresh-pulse]')).toBeAttached();
  });

  test('error state shows a retry button that re-fetches successfully', async ({ page }) => {
    let attempt = 0;
    await page.route('**/api.github.com/**', async (route) => {
      attempt += 1;
      if (attempt === 1) {
        await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SAMPLE_REPOS) });
      }
    });
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('github-projects')?.scrollIntoView({ block: 'center' }));

    const retry = page.locator('#github-projects [data-feed-retry]');
    await expect(retry).toBeVisible({ timeout: 8000 });
    await retry.click();

    await expect.poll(async () => page.locator('#github-projects .repo-card').count(), { timeout: 8000 }).toBeGreaterThanOrEqual(2);
  });

  test('reduced motion: repos are readable immediately', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await routeGithub(page, SAMPLE_REPOS);
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('github-projects')?.scrollIntoView({ block: 'center' }));

    const card = page.locator('#github-projects .repo-card').first();
    await expect(card).toBeVisible({ timeout: 8000 });
    expect(await card.evaluate((el) => Number(getComputedStyle(el as HTMLElement).opacity))).toBeGreaterThan(0.95);
  });
});

// ── #20 HiddenTerminal ────────────────────────────────────────────────────────────
test.describe('WAVE7 #20 — HiddenTerminal typewriter + CRT + history + konami', () => {
  test.describe.configure({ timeout: 90000 });

  async function openTerminal(page: Page) {
    await page.locator('.terminal-trigger').scrollIntoViewIfNeeded();
    await page.locator('.terminal-trigger').click();
    await expect(page.locator('#terminal-overlay')).toHaveClass(/\bopen\b/);
  }

  test('window carries a CRT scan-line overlay', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('.terminal-window [data-terminal-scanline]')).toBeAttached();
  });

  test('running a command types its output in per character', async ({ page }) => {
    await gotoHome(page);
    await openTerminal(page);

    const input = page.locator('#terminal-input');
    await input.fill('stack');
    await input.press('Enter');

    // The typewriter resolves the full line over a few hundred ms.
    await expect.poll(
      async () => (await page.locator('#terminal-log').innerText()).includes('Mainframe'),
      { timeout: 8000 },
    ).toBe(true);
  });

  test('arrow-up recalls the previous command into the input', async ({ page }) => {
    await gotoHome(page);
    await openTerminal(page);

    const input = page.locator('#terminal-input');
    await input.fill('whoami');
    await input.press('Enter');
    await expect(input).toHaveValue('');

    await input.press('ArrowUp');
    await expect(input).toHaveValue('whoami');
  });

  test('the Konami code opens the terminal with a celebration burst', async ({ page }) => {
    await gotoHome(page);
    const sequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    for (const key of sequence) await page.keyboard.press(key);

    await expect(page.locator('#terminal-overlay')).toHaveClass(/\bopen\b/);
    await expect.poll(async () => page.locator('[data-konami-burst] [data-burst-particle]').count(), { timeout: 4000 }).toBeGreaterThanOrEqual(1);
  });

  test('reduced motion: terminal opens and a command is readable immediately', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    await openTerminal(page);

    const input = page.locator('#terminal-input');
    await input.fill('whoami');
    await input.press('Enter');
    // No typewriter delay under reduced motion — the output is present at once.
    await expect(page.locator('#terminal-log')).toContainText('Vikram Deshpande', { timeout: 2000 });
    // The CRT scan-line is pinned (no sweep) under reduced motion.
    const anim = await page
      .locator('.terminal-window [data-terminal-scanline]')
      .evaluate((el) => getComputedStyle(el as HTMLElement).animationName);
    expect(anim).toBe('none');
  });
});
