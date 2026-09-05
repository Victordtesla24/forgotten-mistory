import { chromium } from '/root/forgotten-mistory/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const OUT = '/root/forgotten-mistory/.claude/worktrees/wf_2cd21f31-055-1/docs/delivery/evidence/v10-20260905T0515Z/G-REV/9ba97a5c/captures';
const BASE = 'https://forgotten-mistory.web.app';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const rec = { tried: [], api: [], console: [], pageerrors: [] };
p.on('pageerror', e => rec.pageerrors.push(String(e).slice(0, 300)));
p.on('console', m => { if (m.type() === 'error') rec.console.push(m.text().slice(0, 300)); });
p.on('request', r => { const u = r.url(); if (/\/api\/|cloudfunctions|run\.app|openai|anthropic|openrouter|elevenlabs/i.test(u)) rec.api.push({ t: Date.now(), kind: 'req', method: r.method(), url: u, post: (r.postData() || '').slice(0, 800) }); });
p.on('response', r => { const u = r.url(); if (/\/api\/|cloudfunctions|run\.app/i.test(u)) rec.api.push({ t: Date.now(), kind: 'res', status: r.status(), url: u }); });
await p.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(2000);
rec.buttonInventory = await p.evaluate(() => [...document.querySelectorAll('button,[role="button"],a')].map(e => ({ tag: e.tagName, text: (e.innerText || '').trim().slice(0, 50), aria: e.getAttribute('aria-label'), cls: (e.className?.toString?.() || '').slice(0, 60) })).filter(x => /vic|chat|ask|bot/i.test((x.text || '') + (x.aria || '') + x.cls)));
for (const sel of ['button[aria-label*="Mini Vic"]', 'text=Ask Mini Vic', '[class*="MiniVic"]', '[class*="minivic" i]']) {
  rec.tried.push(sel);
  try { const el = p.locator(sel).first(); if (await el.count() && await el.isVisible()) { await el.click({ timeout: 5000, force: true }); rec.openedWith = sel; break; } } catch (e) { rec.tried.push('fail:' + String(e).slice(0, 80)); }
}
await p.waitForTimeout(2000);
await p.screenshot({ path: OUT + '/minivic2-open.png' });
rec.panelText = (await p.evaluate(() => document.body.innerText)).slice(-1200);
const ta = p.locator('textarea, input[type=text]').first();
rec.inputVisible = (await ta.count()) ? await ta.isVisible().catch(() => false) : false;
if (rec.inputVisible) {
  await ta.fill('What did you do at ANZ?');
  const before = await p.evaluate(() => document.body.innerText.length);
  const t0 = Date.now(); rec.tSend = t0;
  await p.keyboard.press('Enter');
  for (let i = 0; i < 100; i++) { await p.waitForTimeout(200); const len = await p.evaluate(() => document.body.innerText.length); if (len > before + 40) { rec.ttftMs = Date.now() - t0; break; } }
  await p.waitForTimeout(4000);
  rec.replyTail = (await p.evaluate(() => document.body.innerText)).slice(-800);
  await p.screenshot({ path: OUT + '/minivic2-reply.png' });
}
rec.api = rec.api.map(a => ({ ...a, dtMs: rec.tSend ? a.t - rec.tSend : null }));
rec.apiPaths = [...new Set(rec.api.map(a => a.url))];
fs.writeFileSync(OUT + '/minivic-probe.json', JSON.stringify(rec, null, 2));
console.log(JSON.stringify({ openedWith: rec.openedWith, inputVisible: rec.inputVisible, ttftMs: rec.ttftMs, apiPaths: rec.apiPaths, buttons: rec.buttonInventory }, null, 1));
await ctx.close(); await b.close();
