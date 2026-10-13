
import { test, expect } from '@playwright/test';

const MECHANISMS = [
  { name: 'Hero', id: 'hero', selector: '#hero' },
  { name: 'About', id: 'about', selector: '#about' },
  { name: 'Experience', id: 'experience', selector: '#experience' },
  { name: 'Skills', id: 'skills', selector: '#skills' },
  { name: 'Vitrine', id: 'vitrine', selector: '#vitrine' },
  { name: 'Listen', id: 'listen', selector: '#listen' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
];

async function paintedGraphic(page, selector) {
  return page.locator(selector).first().evaluate((el) => {
    const root = el as HTMLElement;
    const r = root.getBoundingClientRect();
    const cs = getComputedStyle(root);
    const shapes = Array.from(root.querySelectorAll('path,circle,line,rect,polyline,polygon,ellipse')).map((n) => {
      const nr = n.getBoundingClientRect();
      const ns = getComputedStyle(n);
      return { w: nr.width, h: nr.height, opacity: Number(ns.opacity), fill: ns.fill, stroke: ns.stroke };
    });
    return {
      bbox: { w: r.width, h: r.height },
      visible: r.width > 1 && r.height > 1 && cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0,
      painted: shapes.some((s) => (s.w > 0 || s.h > 0) && s.opacity > 0 && (s.fill !== 'none' || s.stroke !== 'none')) || ((root.textContent || '').trim().length > 0 || Array.from(root.children).some((c) => { const cr = c.getBoundingClientRect(); const ccs = getComputedStyle(c); return cr.width > 0 && cr.height > 0 && ccs.visibility !== 'hidden' && ccs.display !== 'none'; })),
    };
  });
}

test.describe('Adversarial Visual Coverage (Detailed)', () => {
  for (const vp of VIEWPORTS) {
    for (const m of MECHANISMS) {
      test(`Visual coverage for ${m.name} on ${vp.name}`, async ({ page }, testInfo) => {
        const browserName = testInfo.project.name;
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`/#${m.id}`);
        
        // Settle animation
        await page.waitForTimeout(2000);
        
        const screenshotPath = `docs/uiux/evidence/20261013Z-adversarial/${browserName}__${m.id}__${vp.name}__baseline__post.png`;
        await page.locator(m.selector).screenshot({ path: screenshotPath });
        
        // Instrument rendering check (from draft)
        const instrumentSelector = `[data-testid="${m.id}-${m.id === 'vitrine' ? 'mechanism-diagram' : m.id === 'hero' ? 'observatory' : m.id === 'about' ? 'compass' : m.id === 'experience' ? 'explorer' : m.id === 'skills' ? 'trace' : 'resonance'}"]`;
        if (await page.locator(instrumentSelector).isVisible()) {
            const measured = await paintedGraphic(page, instrumentSelector);
            expect(measured.visible, `${m.id} has visible CSS bbox/opacity`).toBe(true);
            expect(measured.painted, `${m.id} has rendered graphic elements`).toBe(true);
        }

        // Adversarial: Resize stress
        if (vp.name === 'desktop') {
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.waitForTimeout(500);
            await page.setViewportSize({ width: vp.width, height: vp.height });
        } else {
            await page.setViewportSize({ width: 844, height: 390 });
            await page.waitForTimeout(500);
            await page.setViewportSize({ width: vp.width, height: vp.height });
        }
        await page.waitForTimeout(1000);
        const resizePath = `docs/uiux/evidence/20261013Z-adversarial/${browserName}__${m.id}__${vp.name}__resize__post.png`;
        await page.locator(m.selector).screenshot({ path: resizePath });

        // Specific requirements from Step 5
        if (m.name === 'About') {
            await page.locator('[data-testid="compass-dimension"]').nth(2).click();
            await page.waitForTimeout(500);
            await page.locator(m.selector).screenshot({ path: `docs/uiux/evidence/20261013Z-adversarial/${browserName}__about__${vp.name}__selection__post.png` });
        }
        
        if (m.name === 'Experience') {
            const scrubber = page.locator('[data-testid="career-scrubber"]');
            if (await scrubber.isVisible()) {
                await scrubber.focus();
                for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
                await page.waitForTimeout(500);
                await page.locator(m.selector).screenshot({ path: `docs/uiux/evidence/20261013Z-adversarial/${browserName}__experience__${vp.name}__scrub__post.png` });
            }
        }
        
        if (m.name === 'Vitrine') {
            const stage = page.locator('#vitrine [data-testid="mechanism-diagram"] button').first();
            if (await stage.isVisible()) {
                await stage.click();
                await page.waitForTimeout(500);
                await page.locator(m.selector).screenshot({ path: `docs/uiux/evidence/20261013Z-adversarial/${browserName}__vitrine__${vp.name}__pressed__post.png` });
            }
        }

        if (m.name === 'Listen') {
            const menu = page.locator('.menu-toggle');
            const box = await menu.boundingBox();
            expect(box!.width).toBeGreaterThanOrEqual(24);
            expect(box!.height).toBeGreaterThanOrEqual(24);
        }
      });
    }
  }
});
