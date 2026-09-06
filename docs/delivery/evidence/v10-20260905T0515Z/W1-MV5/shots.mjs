import { chromium } from 'playwright';
const B = 'http://127.0.0.1:5635';
const OUT = '/root/forgotten-mistory/.claude/worktrees/w1-mv5/artifacts/evidence/W1-MV5';
const br = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });

const p = await br.newPage({ viewport: { width: 390, height: 844 } });
await p.goto(B + '/'); await p.locator('#hero h1').waitFor({ state: 'visible', timeout: 20000 });
await p.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y=0;y<h;y+=500){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60));} window.scrollTo(0,0); });
await p.waitForTimeout(1500);
await p.evaluate(() => window.scrollTo(0, window.innerHeight * 2)); await p.waitForTimeout(700);
const box = await p.locator('[data-testid="minivic-toggle"]').boundingBox();
const clip = { x: Math.max(0, box.x - 24), y: Math.max(0, box.y - 24), width: box.width + 48, height: box.height + 48 };
await p.screenshot({ path: `${OUT}/06-launcher-closed-390.png`, clip });
await p.mouse.move(box.x + box.width - 10, box.y + box.height / 2); await p.waitForTimeout(800);
await p.screenshot({ path: `${OUT}/07-launcher-hover-390.png`, clip });
await p.screenshot({ path: `${OUT}/08-launcher-in-page-390.png` });
await p.close();

// PM COMMENT 05:09Z — the panel's composer at 1366x768
const q = await br.newPage({ viewport: { width: 1366, height: 768 } });
await q.goto(B + '/'); await q.locator('#hero h1').waitFor({ state: 'visible', timeout: 20000 });
await q.evaluate(() => window.scrollTo(0, window.innerHeight * 2)); await q.waitForTimeout(700);
await q.locator('[data-testid="minivic-toggle"]').evaluate((e) => e.click());
await q.waitForTimeout(1200);
const m = await q.evaluate(() => {
  const panel = document.querySelector('[data-testid="minivic-panel"]');
  if (!panel) return { panel: null };
  const pr = panel.getBoundingClientRect();
  const form = panel.querySelector('form') || panel.querySelector('textarea,input[type=text]')?.closest('form,div');
  const fr = form ? form.getBoundingClientRect() : null;
  const ta = panel.querySelector('textarea,input[type=text]');
  const tr = ta ? ta.getBoundingClientRect() : null;
  const r = (x) => x ? { x: Math.round(x.x), y: Math.round(x.y), w: Math.round(x.width), h: Math.round(x.height), bottom: Math.round(x.bottom) } : null;
  return { panel: r(pr), composer: r(fr), field: r(tr),
    composer_inside_panel: fr ? (fr.bottom <= pr.bottom + 0.5 && fr.top >= pr.top - 0.5) : null,
    field_inside_panel: tr ? (tr.bottom <= pr.bottom + 0.5 && tr.top >= pr.top - 0.5) : null };
});
console.log('PANEL@1366x768 ' + JSON.stringify(m));
await q.screenshot({ path: `${OUT}/09-panel-1366x768.png` });
await q.close();
await br.close();
