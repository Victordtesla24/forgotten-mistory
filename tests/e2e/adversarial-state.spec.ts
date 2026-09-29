import { expect as baseExpect, test, type Browser, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

import { aboutContent } from '../../app/data/portfolio/about';
import { roles } from '../../app/data/portfolio/experience';
import { capabilities, statusLegend } from '../../app/data/portfolio/skills';
import { listenContent } from '../../app/data/portfolio/listen';
import { heroContent } from '../../app/data/portfolio/hero';
import { mechanismFacts } from '../../app/data/portfolio/mechanisms';
import { plates } from '../../app/data/portfolio/vitrine';

const expect = baseExpect.configure({ timeout: 2500 });
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://forgotten-mistory.web.app';
const EVIDENCE_DIR = path.join(process.cwd(), 'docs/uiux/evidence/matrix');
const EVIDENCE_LABEL = process.env.UIUX_EVIDENCE_LABEL || 'matrix';
const BEFORE_JSON = path.join(EVIDENCE_DIR, `${EVIDENCE_LABEL}.json`);
const SECTIONS = ['#hero', '#about', '#experience', '#skills', '#vitrine', '#listen'] as const;

type Finding = { id: string; severity: 'high' | 'medium' | 'low'; observed: string; expected: string; recipe: string; evidence: string[] };
const findings: Finding[] = [];
const passedIds: string[] = [];
const failedIds: string[] = [];
const consoleEvents: string[] = [];
const pageErrors: string[] = [];
const limitations: string[] = [];
const evidencePaths: string[] = [BEFORE_JSON];
let screenshotCount = 0;

function ensureEvidenceDir() { fs.mkdirSync(EVIDENCE_DIR, { recursive: true }); }
function cleanText(value: string) { return value.replace(/\s+/g, ' ').trim(); }
function notePass(id: string) { passedIds.push(id); }
async function attachTelemetry(page: Page) {
  page.on('console', (message) => {
    const type = message.type();
    if (['error', 'warning'].includes(type)) consoleEvents.push(`${type}: ${message.text().slice(0, 500)}`);
  });
  page.on('pageerror', (error) => pageErrors.push(error.message.slice(0, 500)));
}
async function captureFailure(page: Page, id: string) {
  ensureEvidenceDir();
  screenshotCount += 1;
  const file = path.join(EVIDENCE_DIR, `${id.replace(/[^a-z0-9_-]+/gi, '_').slice(0, 90)}-${screenshotCount}.webp`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 55, fullPage: false }).catch(() => undefined);
  evidencePaths.push(file);
  return file;
}
async function check(id: string, page: Page, expected: string, recipe: string, fn: () => Promise<void>, severity: Finding['severity'] = 'medium') {
  try {
    await fn();
    notePass(id);
  } catch (error) {
    const shot = await captureFailure(page, id);
    const observed = error instanceof Error ? error.message : String(error);
    failedIds.push(id);
    findings.push({ id, severity, observed, expected, recipe, evidence: [shot] });
  }
}
async function gotoHome(page: Page, target = '') {
  await page.goto(`${BASE_URL}/${target}`, { waitUntil: 'domcontentloaded', timeout: 12000 });
  await expect(page.locator('body')).toBeVisible();
}
async function styleSnapshot(locator: Locator) {
  return locator.evaluate((el) => {
    const style = getComputedStyle(el as HTMLElement);
    const rect = (el as HTMLElement).getBoundingClientRect();
    return { transform: style.transform, opacity: style.opacity, color: style.color, background: style.backgroundColor, left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  });
}
async function fastScrollAll(page: Page) {
  for (const section of SECTIONS) {
    await page.locator(section).scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 950);
    await page.mouse.wheel(0, -450);
  }
}
async function resizeCycle(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(80);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(80);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(80);
}
async function deepNav(page: Page, hash: '#skills' | '#vitrine') {
  await page.goto(`${BASE_URL}/${hash}`, { waitUntil: 'domcontentloaded', timeout: 12000 });
  await expect(page.locator(hash)).toBeVisible();
  await page.goBack({ waitUntil: 'domcontentloaded', timeout: 12000 }).catch(() => undefined);
  await page.goForward({ waitUntil: 'domcontentloaded', timeout: 12000 }).catch(() => undefined);
  await expect(page.locator(hash)).toBeVisible();
}
async function assertHero(page: Page, id: string) {
  const observatory = page.getByTestId('hero-observatory');
  const toggle = page.getByTestId('telemetry-toggle');
  await expect(observatory).toBeVisible();
  for (let i = 0; i < 3; i += 1) {
    const start = await page.evaluate(() => performance.now());
    await toggle.click();
    await expect(observatory).toHaveAttribute('data-state', /sampling|complete|idle|unavailable/);
    await expect(observatory).toHaveAttribute('data-state', /complete|idle|unavailable/, { timeout: 6500 });
    const elapsed = await page.evaluate((s) => performance.now() - s, start);
    if (elapsed > 7000) throw new Error(`${id}: telemetry sample ${i} exceeded bound: ${elapsed}`);
    const status = cleanText(await page.getByTestId('telemetry-status').innerText());
    if (!/(browser local|requestAnimationFrame|Not sampled|unavailable)/i.test(status)) throw new Error(`${id}: dishonest/missing telemetry provenance: ${status}`);
    if (/resource count\s+0\b/i.test(status) && /Resource Timing API unavailable/i.test(status)) throw new Error(`${id}: resource API unavailable represented as fake zero`);
    if ((await observatory.getAttribute('data-state')) === 'sampling') await toggle.click();
  }
}
async function assertAbout(page: Page, id: string) {
  await page.locator('#about').scrollIntoViewIfNeeded();
  const compass = page.getByTestId('about-compass');
  const answer = page.getByTestId('compass-answer');
  const buttons = compass.getByTestId('compass-dimension');
  await expect(buttons).toHaveCount(aboutContent.dimensions.length);
  const before = await styleSnapshot(compass.locator('svg line').last());
  for (let i = 0; i < aboutContent.dimensions.length; i += 1) {
    const button = buttons.nth(i);
    await button.focus();
    await button.click();
    await expect(answer).toContainText(aboutContent.dimensions[i].answer.slice(0, 20));
    await expect(answer).toContainText(aboutContent.dimensions[i].evidence.slice(0, 15));
  }
  const after = await styleSnapshot(compass.locator('svg line').last());
  if (before.left === after.left && before.top === after.top && before.width === after.width && before.height === after.height && before.transform === after.transform) {
    throw new Error(`${id}: compass indicator computed geometry did not change after ten focus+click selections`);
  }
}
async function assertExperience(page: Page, id: string) {
  await page.locator('#experience').scrollIntoViewIfNeeded();
  const scrubber = page.getByTestId('career-scrubber');
  const output = page.getByTestId('career-inspection');
  const playhead = page.locator('[class*="inspectionHairline"]');
  await expect(scrubber).toBeVisible();
  const before = await styleSnapshot(playhead);
  await scrubber.focus();
  await page.keyboard.press('End');
  await expect(output).toContainText(roles[roles.length - 1].company);
  await expect.poll(async () => JSON.stringify(await styleSnapshot(playhead)), { timeout: 2500 }).not.toBe(JSON.stringify(before));
  const atEnd = await styleSnapshot(playhead);
  await page.keyboard.press('Home');
  await expect(output).toContainText(roles[0].company);
  await expect.poll(async () => JSON.stringify(await styleSnapshot(playhead)), { timeout: 2500 }).toBe(JSON.stringify(before));
  const roleButtons = page.locator('#experience button[aria-expanded]');
  const count = Math.min(await roleButtons.count(), roles.length);
  for (let i = 0; i < count; i += 1) {
    await roleButtons.nth(i).click();
    await expect(roleButtons.nth(i)).toHaveAttribute('aria-expanded', /true|false/);
  }
  if (before.left === atEnd.left && before.top === atEnd.top && before.width === atEnd.width && before.height === atEnd.height && before.transform === atEnd.transform) {
    throw new Error(`${id}: inspection hairline position/transform did not update at End key`);
  }
}
async function assertSkills(page: Page, id: string) {
  await page.locator('#skills').scrollIntoViewIfNeeded();
  const trace = page.getByTestId('skills-trace');
  const buttons = trace.getByTestId('capability-select');
  const output = page.getByTestId('capability-evidence');
  await expect(buttons).toHaveCount(capabilities.length);
  await expect(output).toContainText(capabilities[0].evidence.slice(0, 12));
  const pendingIndex = capabilities.findIndex((c) => c.status === 'pending');
  const index = pendingIndex >= 0 ? pendingIndex : capabilities.length - 1;
  const target = buttons.nth(index);
  const before = await styleSnapshot(target);
  await target.focus();
  await target.click();
  await expect(output).toContainText(capabilities[index].capability.slice(0, 10));
  await expect(output).toContainText(statusLegend[capabilities[index].status].label);
  const after = await styleSnapshot(target);
  if (before.color === after.color && before.opacity === after.opacity && before.background === after.background) throw new Error(`${id}: capability highlight has no computed style change`);
}
async function assertVitrine(page: Page, id: string) {
  await page.locator('#vitrine').scrollIntoViewIfNeeded();
  const plateItems = page.locator('#vitrine li[aria-roledescription="plate"]');
  await expect(plateItems).toHaveCount(plates.length);
  for (let i = 0; i < plates.length; i += 1) {
    const plate = plateItems.nth(i);
    await plate.focus();
    const stageButtons = plate.locator('button').filter({ hasNotText: /^Inspect / });
    if ((await stageButtons.count()) > 1) {
      const beforeStage = await plate.evaluate((el) => ({
        activeText: (el.querySelector('[aria-pressed="true"]')?.textContent || '').trim(),
        svg: el.querySelector('svg')?.innerHTML || '',
      }));
      await stageButtons.nth(1).focus();
      await page.keyboard.press('Enter');
      await expect(plate.getByTestId('mechanism-detail')).toContainText(/\w{3,}/);
      const afterStage = await plate.evaluate((el) => ({
        activeText: (el.querySelector('[aria-pressed="true"]')?.textContent || '').trim(),
        svg: el.querySelector('svg')?.innerHTML || '',
      }));
      if (afterStage.activeText === beforeStage.activeText && afterStage.svg === beforeStage.svg) throw new Error(`${id}: stage keyboard activation changed neither active control nor SVG for ${plates[i].title}`);
    }
    const inspect = plate.getByTestId('mechanism-inspect');
    await inspect.focus();
    await page.keyboard.press('Enter');
    await expect(inspect).toHaveAttribute('aria-expanded', 'true');
    await expect(plate.getByTestId('mechanism-detail')).toContainText(mechanismFacts[plates[i].drawing].schematic.slice(0, 15));
  }
}
async function assertListen(page: Page, id: string) {
  await page.locator('#listen').scrollIntoViewIfNeeded();
  const resonance = page.getByTestId('listen-resonance');
  const anchors = resonance.locator('a[href]');
  const count = await anchors.count();
  if (count < listenContent.channels.length) throw new Error(`${id}: missing contact anchors`);
  const neutralEcho = JSON.stringify(await styleSnapshot(resonance.locator('span').first()));
  for (let i = 0; i < count; i += 1) {
    const anchor = anchors.nth(i);
    await anchor.focus();
    await expect.poll(async () => JSON.stringify(await styleSnapshot(resonance.locator('span').first())), { timeout: 2500 }).not.toBe(neutralEcho);
  }
}
async function allInteractions(page: Page, prefix: string) {
  await check(`${prefix}-hero`, page, 'Hero telemetry starts/stops/reruns boundedly.', prefix, () => assertHero(page, prefix), 'high');
  await check(`${prefix}-about`, page, 'About interactions update answer and indicator.', prefix, () => assertAbout(page, prefix));
  await check(`${prefix}-experience`, page, 'Experience controls update inspection hairline.', prefix, () => assertExperience(page, prefix));
  await check(`${prefix}-skills`, page, 'Skills interactions update evidence and highlight.', prefix, () => assertSkills(page, prefix));
  await check(`${prefix}-vitrine`, page, 'Vitrine controls work with keyboard.', prefix, () => assertVitrine(page, prefix), 'high');
  await check(`${prefix}-listen`, page, 'Listen channels focus updates interaction echo.', prefix, () => assertListen(page, prefix));
}
async function makeContext(browser: Browser, mobile = false) {
  const context = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await attachTelemetry(page);
  return { context, page };
}

test.describe.configure({ mode: 'serial' });
test.use({ actionTimeout: 5000, navigationTimeout: 12000 });

for (const rep of [1, 2]) {
  test(`matrix stress fresh context rep ${rep}`, async ({ browser }) => {
    const { context, page } = await makeContext(browser, false);
    try {
      await gotoHome(page);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await fastScrollAll(page);
      await allInteractions(page, `desktop-${rep}`);
    } finally {
      await context.close();
    }
  });
}

test.afterAll(async () => {
  ensureEvidenceDir();
  const report = { agent_role: 'matrix-tester', status: 'done', findings, matrix: { passed: passedIds, failed: failedIds } };
  fs.writeFileSync(BEFORE_JSON, `${JSON.stringify(report, null, 2)}\n`);
});
