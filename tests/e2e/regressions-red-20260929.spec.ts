/**
 * Independent RED reproductions for the C4/C5 regression set (TestAuthor, 2026-09-29).
 *   UX-P0-001  Hero primary CTA contrast (axe color-contrast on .Hero_primaryAction), sampled
 *              across the entry timeline, not only at rest.
 *   UX-P1-001  320 px reflow: document scrollWidth must equal clientWidth.
 *   UX-P2-002  Nav active state (aria-current) + URL hash follow the section on click, scroll, Back.
 *   UX-P1-006  Mobile Lighthouse is measured out-of-band (scripts/uiux/lighthouse_mobile_gate.mjs);
 *              this spec asserts the committed medians against §9 when LH_MEDIANS points at them.
 * Production by default; override with PLAYWRIGHT_BASE_URL.
 */
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = (process.env.PLAYWRIGHT_BASE_URL || 'https://forgotten-mistory.web.app').replace(/\/$/, '');
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

function contrast(fg: number[], bg: number[]) {
  const lum = (c: number[]) => {
    const [r, g, b] = c.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

async function ctaSample(page: Page) {
  return page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('[class*="primaryAction"]');
    if (!el) return null;
    const parse = (s: string) => (s.match(/[\d.]+/g) || []).map(Number);
    let op = 1;
    for (let n: HTMLElement | null = el; n; n = n.parentElement) op *= Number(getComputedStyle(n).opacity || 1);
    const cs = getComputedStyle(el);
    return { cls: el.className, text: el.textContent?.trim(), color: parse(cs.color), bg: parse(cs.backgroundColor), effectiveOpacity: op };
  });
}

async function axeContrast(page: Page) {
  if (!(await page.evaluate(() => 'axe' in window))) await page.addScriptTag({ content: AXE });
  return page.evaluate(async () => {
    // @ts-expect-error injected
    const r = await window.axe.run(document, { runOnly: { type: 'rule', values: ['color-contrast'] } });
    return r.violations.flatMap((v: { nodes: { target: string[]; any: { message: string }[] }[] }) =>
      v.nodes.map((n) => ({ target: n.target.join(' '), message: n.any[0]?.message })));
  });
}

test.describe('UX-P0-001 Hero CTA contrast', () => {
  for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    test(`@${vp.width}: .Hero_primaryAction passes color-contrast through the entry timeline`, async ({ page }, testInfo) => {
      await page.setViewportSize(vp);
      const samples: unknown[] = [];
      await page.goto(`${BASE}/`, { waitUntil: 'commit' });
      await page.waitForSelector('[class*="primaryAction"]', { state: 'attached' });
      for (const t of [0, 150, 400, 800, 1500, 3000, 6000]) {
        if (t) await page.waitForTimeout(t - ((samples.at(-1) as { t?: number })?.t ?? 0));
        const s = await ctaSample(page);
        const axe = (await axeContrast(page)).filter((v) => /primaryAction/.test(v.target));
        samples.push({ t, ...s, ratio: s ? Number(contrast(s.color, s.bg).toFixed(2)) : null, axe });
      }
      await testInfo.attach('cta-contrast-timeline', { body: JSON.stringify(samples, null, 1), contentType: 'application/json' });
      const bad = samples.filter((s) => (s as { axe: unknown[] }).axe.length > 0);
      expect(bad, 'axe color-contrast violations on .Hero_primaryAction at any sampled time').toEqual([]);
      for (const s of samples as { t: number; ratio: number }[]) expect(s.ratio, `ratio at t=${s.t}ms`).toBeGreaterThanOrEqual(4.5);
    });
  }

  test('@390 reduced-motion + hover/focus states keep ≥4.5:1', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    const cta = page.locator('[class*="primaryAction"]').first();
    const out: { [k: string]: unknown } = {};
    out.rest = await ctaSample(page);
    await cta.hover();
    await page.waitForTimeout(400);
    out.hover = await ctaSample(page);
    await page.keyboard.press('Shift');
    await cta.focus();
    await page.waitForTimeout(300);
    out.focus = await ctaSample(page);
    out.axe = (await axeContrast(page)).filter((v) => /primaryAction/.test(v.target));
    await testInfo.attach('cta-states', { body: JSON.stringify(out, null, 1), contentType: 'application/json' });
    for (const k of ['rest', 'hover', 'focus']) {
      const s = out[k] as { color: number[]; bg: number[] };
      expect(contrast(s.color, s.bg), `${k} ratio`).toBeGreaterThanOrEqual(4.5);
    }
    expect(out.axe).toEqual([]);
  });
});

test.describe('UX-P1-001 320 px reflow', () => {
  for (const vp of [{ width: 320, height: 800 }, { width: 360, height: 800 }, { width: 390, height: 844 }]) {
    test(`@${vp.width}: document scrollWidth === clientWidth (settled + all sections visited)`, async ({ page }, testInfo) => {
      await page.setViewportSize(vp);
      await page.goto(`${BASE}/`, { waitUntil: 'load' });
      const rows: unknown[] = [];
      for (const id of ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen']) {
        await page.evaluate((i) => document.getElementById(i)!.scrollIntoView(), id);
        await page.waitForTimeout(500);
        rows.push(await page.evaluate((i) => {
          const d = document.documentElement;
          const offenders = [...document.querySelectorAll<HTMLElement>('body *')]
            .filter((e) => e.getBoundingClientRect().right > d.clientWidth + 0.5 && getComputedStyle(e).position !== 'fixed')
            .slice(0, 5).map((e) => `${e.tagName}.${String(e.className).slice(0, 40)} r=${Math.round(e.getBoundingClientRect().right)}`);
          return { at: i, scrollWidth: d.scrollWidth, clientWidth: d.clientWidth, offenders };
        }, id));
      }
      await testInfo.attach('reflow', { body: JSON.stringify(rows, null, 1), contentType: 'application/json' });
      for (const r of rows as { at: string; scrollWidth: number; clientWidth: number }[]) {
        expect(r.scrollWidth, `scrollWidth at #${r.at}`).toBeLessThanOrEqual(r.clientWidth);
      }
    });
  }
});

test.describe('UX-P2-002 nav active state / hash sync', () => {
  const navTo = async (page: Page, id: string) => {
    await page.locator('.menu-toggle').click();
    await page.waitForTimeout(400);
    await page.locator(`#site-nav-overlay a[href="#${id}"]`).click();
  };
  const current = (page: Page) => page.evaluate(() =>
    [...document.querySelectorAll('#site-nav-overlay a[aria-current], nav a[aria-current]')].map((a) => a.getAttribute('href')));

  test('desktop: click → aria-current + hash; manual scroll → follows; Back → restores', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    const log: unknown[] = [];
    await navTo(page, 'skills');
    await page.waitForTimeout(1500);
    log.push({ step: 'click #skills', hash: await page.evaluate(() => location.hash), current: await current(page) });
    // Real user input, not programmatic scroll: keyboard PageDown until Listen reaches the top band.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    let presses = 0;
    while (presses < 40 && (await page.evaluate(() => document.getElementById('listen')!.getBoundingClientRect().top)) > 200) {
      await page.keyboard.press('PageDown');
      await page.waitForTimeout(250);
      presses++;
    }
    await page.waitForTimeout(1500);
    const listenTop = await page.evaluate(() => Math.round(document.getElementById('listen')!.getBoundingClientRect().top));
    log.push({ step: `keyboard PageDown ×${presses} to #listen (top ${listenTop})`, hash: await page.evaluate(() => location.hash), current: await current(page) });
    await page.evaluate(() => document.getElementById('about')!.scrollIntoView());
    await page.waitForTimeout(1500);
    log.push({ step: 'manual scroll to #about', hash: await page.evaluate(() => location.hash), current: await current(page) });
    await testInfo.attach('nav-sync', { body: JSON.stringify(log, null, 1), contentType: 'application/json' });
    const [a, b, c] = log as { hash: string; current: string[] }[];
    expect(a.current, 'aria-current after click').toContain('#skills');
    expect(a.hash).toBe('#skills');
    expect(b.current, 'aria-current follows keyboard scroll to Listen').toContain('#listen');
    expect(b.hash, 'hash follows keyboard scroll to Listen').toBe('#listen');
    expect(c.current, 'aria-current follows manual scroll to About').toContain('#about');
    expect(c.hash, 'hash follows manual scroll to About').toBe('#about');
  });

  test('desktop: scrollbar-equivalent scroll (no wheel/key/touch events) after a nav click updates aria-current + hash', async ({ page }, testInfo) => {
    // Dragging the scrollbar or a scroll restored by the browser emits only `scroll`,
    // never wheel/keydown/touch. Emulated with window.scrollTo.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await navTo(page, 'skills');
    await page.waitForTimeout(1500);
    const before = { hash: await page.evaluate(() => location.hash), current: await current(page) };
    await page.evaluate(() => window.scrollTo(0, document.getElementById('listen')!.getBoundingClientRect().top + scrollY - 96));
    await page.waitForTimeout(2000);
    const after = { hash: await page.evaluate(() => location.hash), current: await current(page),
      listenTop: await page.evaluate(() => Math.round(document.getElementById('listen')!.getBoundingClientRect().top)) };
    await testInfo.attach('nav-scrollbar', { body: JSON.stringify({ before, after }), contentType: 'application/json' });
    expect(before.current).toContain('#skills');
    expect(after.current, 'aria-current follows scroll-only movement to Listen').toContain('#listen');
    expect(after.hash, 'hash follows scroll-only movement to Listen').toBe('#listen');
  });

  test('desktop: Back after two nav clicks restores section, hash and aria-current', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await navTo(page, 'experience');
    await page.waitForTimeout(1200);
    await navTo(page, 'vitrine');
    await page.waitForTimeout(1200);
    await page.goBack();
    await page.waitForTimeout(1500);
    const s = { hash: await page.evaluate(() => location.hash), current: await current(page),
      top: await page.evaluate(() => Math.round(document.getElementById('experience')!.getBoundingClientRect().top)) };
    await testInfo.attach('nav-back', { body: JSON.stringify(s), contentType: 'application/json' });
    expect(s.hash).toBe('#experience');
    expect(s.current).toContain('#experience');
    expect(s.top).toBeLessThanOrEqual(320);
    expect(s.top).toBeGreaterThanOrEqual(-40);
  });

  test('mobile 390: deep link /#vitrine marks Vitrine current in the menu', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/#vitrine`, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await page.locator('.menu-toggle').click();
    await page.waitForTimeout(400);
    const c = await current(page);
    await testInfo.attach('nav-mobile', { body: JSON.stringify(c), contentType: 'application/json' });
    expect(c).toContain('#vitrine');
  });
});

test.describe('UX-P1-006 mobile Lighthouse (§9 thresholds)', () => {
  test('median of committed runs meets Perf ≥ 0.90, LCP ≤ 2500 ms, TBT ≤ 200 ms', async ({}, testInfo) => {
    const file = process.env.LH_MEDIANS;
    test.skip(!file, 'LH_MEDIANS not set; run scripts/uiux/lighthouse_mobile_gate.mjs first');
    const m = JSON.parse(fs.readFileSync(path.resolve(file!), 'utf8')).median;
    testInfo.annotations.push({ type: 'lighthouse-median', description: JSON.stringify(m) });
    expect.soft(m.performance, 'Perf score').toBeGreaterThanOrEqual(0.9);
    expect.soft(m.lcp, 'LCP ms').toBeLessThanOrEqual(2500);
    expect.soft(m.tbt, 'TBT ms').toBeLessThanOrEqual(200);
    expect.soft(m.cls, 'CLS').toBeLessThanOrEqual(0.05);
  });
});
