import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';

import { duration, ease } from '@/lib/motion';

import { open, watchConsole } from './support';

/** The dialog that holds the three headline figures' panels, one of the two in the hero. */
const FIGURES_DIALOG = 'dialog[data-detail]:has(#figure-evidence)';

/** Initial JavaScript of the home route before the stage, in bytes gzipped (origin/main, 2026-11-10). */
const PRE_STAGE_INITIAL_GZIP = 237_013;

/** The most the stage may add to the initial JavaScript, and the most its lazy chunks may weigh. */
const INITIAL_GROWTH_LIMIT = 6 * 1000;
const LAZY_ENGINE_LIMIT = 170 * 1000;

/** The budgets of DESIGN.md section 5, per frame for the whole page. */
const BUDGET = { calls: 40, points: 12_000, lines: 10_000, triangles: 60_000 };

/** The most ruler segments the hero field draws on each tier. */
const FIELD_LINES = { high: 6000, low: 2500 };

/** The Aether repository is private and its live site is stopped: neither is linked. */
const DEAD_LINKS = ['github.com/Victordtesla24/aether-job-career-agent', 'aether.srv1356245.hstgr.cloud'];

function jsFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return jsFiles(path);
    return path.endsWith('.js') ? [path] : [];
  });
}

const gzipped = (path: string) => gzipSync(readFileSync(path), { level: 9 }).length;

/** What the static export ships: the scripts the home page loads up front and the engine's lazy chunks. */
function bundle() {
  const html = readFileSync('out/index.html', 'utf8');
  const initial = [...new Set(Array.from(html.matchAll(/\/_next\/static\/[^"']+\.js/g), (match) => match[0]))];
  const engine = jsFiles('out/_next/static')
    .map((path) => path.replace(/^out/, ''))
    .filter((path) => /WebGLRenderer|uTickHeight/.test(readFileSync(`out${path}`, 'utf8')));
  return { html, initial, engine };
}

/** Waits for the review hook and for its `ready` promise. */
async function stageReady(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__stage !== undefined);
  await page.evaluate(() => window.__stage?.ready);
}

const frames = (page: Page) => page.evaluate(() => window.__stage?.info().frames ?? -1);

/** Waits until the stage has stopped drawing: the frame count is the same a second and a half apart. */
async function settled(page: Page): Promise<number> {
  let previous = -2;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const now = await frames(page);
    if (now === previous) return now;
    previous = now;
    await page.waitForTimeout(1500);
  }
  throw new Error('the stage never stopped drawing');
}

interface Sample {
  /** Pixels that differ from the page background. */
  changed: number;
  /** Mean brightness of those pixels minus the background's, in 0 to 255: light on dark is positive. */
  lift: number;
}

/**
 * Looks at the canvas alone: hides the DOM above it, takes a screenshot of the first screen
 * and compares every pixel with the page background.
 */
async function sampleField(page: Page): Promise<Sample> {
  const hide = await page.addStyleTag({
    content: 'main, header, footer, a[href="#main"], #assistant-launcher, [data-stage-view] { visibility: hidden !important; }',
  });
  const background = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
  const [br = 0, bg = 0, bb = 0] = (background.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  const { data, info } = await sharp(await page.screenshot())
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  await hide.evaluate((element) => (element as Element).remove());
  const luma = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  let changed = 0;
  let lift = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    if (Math.max(Math.abs(r - br), Math.abs(g - bg), Math.abs(b - bb)) <= 8) continue;
    changed += 1;
    lift += luma(r, g, b) - luma(br, bg, bb);
  }
  return { changed, lift: changed ? lift / changed : 0 };
}

test.describe('the stage', { tag: '@desktop' }, () => {
  for (const tier of ['high', 'low'] as const) {
    test(`draws the hero field on one canvas at ?gl=${tier}, inside the budgets`, async ({ page }) => {
      const problems = watchConsole(page);
      await open(page, `/?gl=${tier}`);
      await stageReady(page);
      await expect(page.locator('canvas')).toHaveCount(1);

      await page.evaluate(() => window.__stage?.seek(10_000));
      const info = await page.evaluate(() => window.__stage?.info());
      expect(info?.tier).toBe(tier);
      expect(info?.views).toBeGreaterThanOrEqual(1);
      expect(info?.calls).toBeLessThanOrEqual(BUDGET.calls);
      expect(info?.points).toBeLessThanOrEqual(BUDGET.points);
      expect(info?.triangles).toBeLessThanOrEqual(BUDGET.triangles);
      expect(info?.lines).toBeGreaterThan(0);
      expect(info?.lines).toBeLessThanOrEqual(Math.min(FIELD_LINES[tier], BUDGET.lines));
      await expect(page.locator('canvas')).toHaveAttribute('data-tier', tier);

      const sample = await sampleField(page);
      expect(sample.changed, 'pixels that differ from the page background').toBeGreaterThan(2000);
      expect(problems).toEqual([]);
    });
  }

  test('an idle page draws no further frames', async ({ page }) => {
    await open(page, '/?gl=high');
    await stageReady(page);
    const settledAt = await settled(page);
    await page.waitForTimeout(1200);
    const first = await page.locator('canvas').getAttribute('data-frames');
    await page.waitForTimeout(2200);
    const second = await page.locator('canvas').getAttribute('data-frames');
    expect(Number(first)).toBeGreaterThanOrEqual(settledAt - 1);
    expect(second).toBe(first);
    expect(await frames(page)).toBe(Number(second));
  });

  test('the field leans to the pointer and then settles again', async ({ page }) => {
    await open(page, '/?gl=high');
    await stageReady(page);
    const before = await settled(page);
    await page.mouse.move(200, 300);
    await page.mouse.move(900, 500, { steps: 6 });
    await expect.poll(() => frames(page), { timeout: 10_000 }).toBeGreaterThan(before);
    const after = await settled(page);
    expect(after).toBeGreaterThan(before);
    await page.waitForTimeout(1500);
    expect(await frames(page)).toBe(after);
  });

  test('recolours when the theme changes, without a reload', async ({ page }) => {
    await open(page, '/?gl=high');
    await stageReady(page);
    await page.evaluate(() => {
      (window as unknown as { marker: string }).marker = 'same page';
      window.__stage?.seek(10_000);
    });
    const dark = await sampleField(page);
    expect(dark.changed).toBeGreaterThan(2000);
    expect(dark.lift, 'light ticks on a dark page').toBeGreaterThan(0);

    const drawn = await frames(page);
    await page.getByRole('button', { name: 'Switch colour theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect.poll(() => frames(page)).toBeGreaterThan(drawn);
    await page.waitForTimeout(800);

    const light = await sampleField(page);
    expect(light.changed).toBeGreaterThan(2000);
    expect(light.lift, 'dark ticks on a light page').toBeLessThan(0);
    expect(await page.evaluate(() => (window as unknown as { marker?: string }).marker)).toBe('same page');
  });
});

test.describe('without the stage', { tag: '@desktop' }, () => {
  async function expectCompleteHero(page: Page) {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Delivery leader');
    await expect(page.getByRole('link', { name: 'View selected work' })).toBeVisible();
    await expect(page.locator('#proof li')).toHaveCount(3);
    await expect(page.locator('[data-career-scale] [data-bars] a[data-role]')).toHaveCount(8);
    await expect(page.locator('[data-stage-view]')).toHaveCount(5);
    await expect(page.locator('[data-stage-view][data-ready="true"]')).toHaveCount(0);
  }

  test('?gl=off shows the whole hero, draws nothing and loads no engine', async ({ page }) => {
    const problems = watchConsole(page);
    await open(page, '/?gl=off');
    await stageReady(page);
    await page.waitForTimeout(2500);
    await expect(page.locator('canvas')).toHaveCount(0);
    expect(await page.evaluate(() => window.__stage?.info().tier)).toBe('off');
    await expectCompleteHero(page);

    const requested = await page.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name));
    for (const chunk of bundle().engine) {
      expect(requested.some((url) => url.endsWith(chunk)), chunk).toBe(false);
    }
    expect(problems).toEqual([]);
  });

  test('?motion=off draws at most one still and the page stays complete', async ({ page }) => {
    const problems = watchConsole(page);
    await open(page, '/?gl=high&motion=off');
    await stageReady(page);
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    expect(await page.evaluate(() => window.__stage?.info().tier)).toBe('still');
    const settledAt = await settled(page);
    expect(settledAt).toBeLessThanOrEqual(6);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('reduced motion draws a single still, settled', async ({ page }) => {
    const problems = watchConsole(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/?gl=high');
    await stageReady(page);
    expect(await page.evaluate(() => window.__stage?.info().tier)).toBe('still');
    await settled(page);
    const sample = await sampleField(page);
    expect(sample.changed, 'the still frame shows the settled field').toBeGreaterThan(2000);
    expect(problems).toEqual([]);
  });

  test('the footer Motion control turns motion off and remembers it', async ({ page }) => {
    await open(page, '/?gl=off');
    const toggle = page.getByRole('switch', { name: /Motion/ });
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    await expect(toggle).toHaveAttribute('aria-checked', 'false');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    await expect(page.getByRole('switch', { name: /Motion/ })).toHaveAttribute('aria-checked', 'false');

    await page.getByRole('switch', { name: /Motion/ }).click();
    await expect(page.locator('html')).not.toHaveAttribute('data-motion', 'off');
  });
});

test.describe('the motion tokens', { tag: '@desktop' }, () => {
  test('the CSS custom properties are the ones in lib/motion.ts', async ({ page }) => {
    await open(page, '/?gl=off');
    const read = (name: string) =>
      page.evaluate((property) => getComputedStyle(document.documentElement).getPropertyValue(property).trim(), name);
    // The stylesheet is minified, so 120ms may arrive as .12s.
    const milliseconds = async (name: string) => {
      const value = await read(name);
      return value.endsWith('ms') ? parseFloat(value) : Math.round(parseFloat(value) * 1000);
    };
    expect(await milliseconds('--duration-press')).toBe(duration.press);
    expect(await milliseconds('--duration-hover')).toBe(duration.hover);
    expect(await milliseconds('--duration-state')).toBe(duration.state);
    expect(await milliseconds('--duration-panel')).toBe(duration.panel);
    expect(await milliseconds('--duration-enter')).toBe(duration.entrance);
    expect(await milliseconds('--duration-section')).toBe(duration.section);
    const curve = async (name: string) => ((await read(name)).match(/\d*\.?\d+/g) ?? []).map(Number);
    expect(await curve('--ease')).toEqual([...ease.out]);
    expect(await curve('--ease-in-out')).toEqual([...ease.inOut]);
  });
});

test.describe('the detail panel', () => {
  const trigger = '[data-detail-trigger="figure-evidence"]';

  test('opens from its trigger, traps focus, closes on Escape and the backdrop, and restores focus', async ({
    page,
  }) => {
    await open(page, '/?gl=off');
    const dialog = page.locator(FIGURES_DIALOG);
    await expect(dialog).toBeHidden();

    await page.locator(trigger).focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/#figure-evidence$/);
    await expect(dialog).toHaveAccessibleName('less evidence effort per scenario');

    for (let press = 0; press < 8; press += 1) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Shift+Tab');
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page).not.toHaveURL(/#/);
    await expect(page.locator(trigger)).toBeFocused();

    await page.locator(trigger).click();
    await expect(dialog).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-vt', 'detail');
    await page.mouse.click(6, 6);
    await expect(dialog).toBeHidden();
    await expect(page.locator(trigger)).toBeFocused();
  });

  test('closes with the close button and with the browser back button', async ({ page }) => {
    await open(page, '/?gl=off');
    const dialog = page.locator(FIGURES_DIALOG);
    await page.locator(trigger).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();

    await page.locator(trigger).click();
    await expect(dialog).toBeVisible();
    await page.goBack();
    await expect(dialog).toBeHidden();
    await page.goForward();
    await expect(dialog).toBeVisible();
  });

  test('moves to the previous and next panel without closing', async ({ page }) => {
    await open(page, '/?gl=off');
    const dialog = page.locator(FIGURES_DIALOG);
    await page.locator(trigger).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Next' }).click();
    await expect(dialog.getByRole('heading', { name: 'portfolio across 5+ squads' })).toBeVisible();
    await expect(page).toHaveURL(/#figure-portfolio$/);
    await expect(dialog.getByText('2 / 3')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(dialog.getByRole('heading', { name: 'concurrent devices' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Previous' }).click();
    await dialog.getByRole('button', { name: 'Previous' }).click();
    await expect(dialog.getByRole('heading', { name: 'less evidence effort per scenario' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.locator(trigger)).toBeFocused();
  });

  test('can be linked to by its fragment', async ({ page }) => {
    await page.goto('/?gl=off#figure-telemetry');
    const dialog = page.locator(FIGURES_DIALOG);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'concurrent devices' })).toBeVisible();
    await expect(dialog.getByText('P95 latency to under 200 ms')).toBeVisible();
  });

  test('has its content in the HTML and shows it in place with JavaScript off', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('/');
    for (const id of ['figure-evidence', 'figure-portfolio', 'figure-telemetry']) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
    await expect(page.locator('#figure-evidence')).toContainText('COBOL/mainframe test-evidence automation');
    await expect(page.locator(`${FIGURES_DIALOG} [aria-label="Close"]`)).toBeHidden();
    await context.close();
  });

  test('opens with no serious accessibility violation and no console error', { tag: '@desktop' }, async ({ page }) => {
    const problems = watchConsole(page);
    await open(page, '/?gl=off');
    await page.locator(trigger).click();
    const dialog = page.locator(FIGURES_DIALOG);
    await expect(dialog).toBeVisible();
    await expect(page.locator('html')).not.toHaveAttribute('data-vt', 'detail');
    const { violations } = await new AxeBuilder({ page }).analyze();
    const blocking = violations.filter((entry) => entry.impact === 'serious' || entry.impact === 'critical');
    expect(blocking.map((entry) => entry.id)).toEqual([]);
    // Opening and closing in quick succession must not leave a rejected view transition behind.
    await page.keyboard.press('Escape');
    await page.locator(trigger).click();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    expect(problems).toEqual([]);
  });

  test('is a bottom sheet on a phone', { tag: '@mobile' }, async ({ page }) => {
    await open(page, '/?gl=off');
    await page.locator(trigger).click();
    const dialog = page.locator(FIGURES_DIALOG);
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(700);
    const box = await dialog.boundingBox();
    const viewport = page.viewportSize();
    expect(box && viewport).toBeTruthy();
    if (!box || !viewport) return;
    expect(box.x).toBeLessThanOrEqual(1);
    expect(box.width).toBeGreaterThanOrEqual(viewport.width - 2);
    expect(box.y + box.height).toBeGreaterThanOrEqual(viewport.height - 2);
  });

  test('is centred and no wider than 880 px on a desktop', { tag: '@desktop' }, async ({ page }) => {
    await open(page, '/?gl=off');
    await page.locator(trigger).click();
    const dialog = page.locator(FIGURES_DIALOG);
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(700);
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    expect(box.width).toBeLessThanOrEqual(880);
    expect(Math.abs(box.x + box.width / 2 - 720)).toBeLessThanOrEqual(2);
  });
});

test.describe('the build', { tag: '@desktop' }, () => {
  test('keeps three.js out of the initial HTML and JavaScript, and inside the budgets', () => {
    const { html, initial, engine } = bundle();
    expect(html).not.toMatch(/WebGLRenderer/);
    expect(engine.length, 'the engine is in lazy chunks').toBeGreaterThan(0);
    for (const path of initial) {
      expect(readFileSync(`out${path}`, 'utf8'), path).not.toMatch(/WebGLRenderer|uTickHeight/);
      expect(engine, path).not.toContain(path);
    }

    const initialGzip = initial.reduce((total, path) => total + gzipped(`out${path}`), 0);
    const engineGzip = engine.reduce((total, path) => total + gzipped(`out${path}`), 0);
    test.info().annotations.push(
      { type: 'initial JS gzip', description: `${initialGzip} B (${initialGzip - PRE_STAGE_INITIAL_GZIP} B over the pre-stage build)` },
      { type: 'lazy engine gzip', description: `${engineGzip} B in ${engine.length} chunks` },
    );
    expect(initialGzip - PRE_STAGE_INITIAL_GZIP).toBeLessThanOrEqual(INITIAL_GROWTH_LIMIT);
    expect(engineGzip).toBeLessThanOrEqual(LAZY_ENGINE_LIMIT);
  });

  test('has dropped the old visual components, their dependency and the two dead links', () => {
    for (const path of [
      'components/visuals/VisualStage.tsx',
      'components/visuals/HeroField.tsx',
      'components/visuals/HeroBackdrop.tsx',
      'components/visuals/palette.ts',
    ]) {
      expect(existsSync(path), path).toBe(false);
    }
    const manifest = readFileSync('package.json', 'utf8');
    expect(manifest).not.toContain('@paper-design');
    expect(manifest).toContain('"three": "0.187.0"');
    expect(manifest).toContain('"@types/three": "0.187.0"');

    const { html } = bundle();
    for (const link of DEAD_LINKS) expect(html, link).not.toContain(link);
  });
});
