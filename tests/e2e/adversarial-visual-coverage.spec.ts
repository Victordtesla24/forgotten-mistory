
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

test.describe('Adversarial Visual Coverage', () => {
  for (const vp of VIEWPORTS) {
    for (const m of MECHANISMS) {
      test(`Visual coverage for ${m.name} on ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`/#${m.id}`);
        
        // Settle animation
        await page.waitForTimeout(2000);
        
        const screenshotPath = `docs/uiux/evidence/20261013Z-adversarial/${m.id}__${vp.name}__baseline__post.png`;
        await page.locator(m.selector).screenshot({ path: screenshotPath });
        
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
        const resizePath = `docs/uiux/evidence/20261013Z-adversarial/${m.id}__${vp.name}__resize__post.png`;
        await page.locator(m.selector).screenshot({ path: resizePath });

        // Specific requirements from Step 5
        if (m.name === 'About') {
            // selection/needle
            await page.locator('[data-testid="compass-dimension"]').nth(2).click();
            await page.waitForTimeout(500);
            await page.locator(m.selector).screenshot({ path: `docs/uiux/evidence/20261013Z-adversarial/about__${vp.name}__selection__post.png` });
        }
        
        if (m.name === 'Experience') {
            // scrub 3 roles
            const scrubber = page.locator('[data-testid="career-scrubber"]');
            if (await scrubber.isVisible()) {
                await scrubber.fill('3');
                await page.waitForTimeout(500);
                await page.locator(m.selector).screenshot({ path: `docs/uiux/evidence/20261013Z-adversarial/experience__${vp.name}__scrub__post.png` });
            }
        }
        
        if (m.name === 'Vitrine') {
            // SVG / pressed / focus
            const stage = page.locator('#vitrine [data-testid="mechanism-diagram"] button').first();
            if (await stage.isVisible()) {
                await stage.click();
                await page.waitForTimeout(500);
                await page.locator(m.selector).screenshot({ path: `docs/uiux/evidence/20261013Z-adversarial/vitrine__${vp.name}__pressed__post.png` });
            }
        }

        if (m.name === 'Listen') {
            // menu 78x48
            const menu = page.locator('.menu-toggle');
            const box = await menu.boundingBox();
            console.log(`Menu toggle box on ${vp.name}: ${JSON.stringify(box)}`);
        }
      });
    }
  }
});
