import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';

const URL = 'https://forgotten-mistory.web.app/';
const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v9-20260904T2312Z/R-c1/adv';
const R = { url: URL, ts: new Date().toISOString(), viewports: {}, reducedMotion: {}, keyboard: {}, sections: {}, network: {} };

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });

async function instrument(page, bag) {
  page.on('console', m => { if (m.type() === 'error') bag.consoleErrors.push(m.text().slice(0, 400)); else if (m.type() === 'warning') bag.consoleWarnings.push(m.text().slice(0, 300)); });
  page.on('pageerror', e => bag.pageErrors.push(String(e).slice(0, 400)));
  page.on('requestfailed', r => bag.failed.push(r.url() + ' :: ' + (r.failure()?.errorText || '')));
  page.on('response', async r => {
    const u = r.url(); const st = r.status();
    const h = r.headers();
    bag.responses.push({ url: u, status: st, type: h['content-type'] || '', len: h['content-length'] || '' });
    if (st >= 400) bag.badStatus.push(u + ' -> ' + st);
  });
}

for (const [w, h] of [[1440, 900], [390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const bag = { consoleErrors: [], consoleWarnings: [], pageErrors: [], failed: [], responses: [], badStatus: [] };
  await instrument(page, bag);
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3500);
  // scroll whole page to trigger lazy sections
  await page.evaluate(async () => {
    const H = document.body.scrollHeight;
    for (let y = 0; y < H; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2000);

  // sections in DOM order + visible heading
  const sec = await page.evaluate(() => {
    const ids = ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen'];
    const all = [...document.querySelectorAll('section[id], div[id], main [id]')].map(e => e.id).filter(Boolean);
    const domOrder = all.filter(i => ids.includes(i));
    return {
      domOrder,
      detail: ids.map(id => {
        const el = document.getElementById(id);
        if (!el) return { id, present: false };
        const hd = el.querySelector('h1,h2,h3,[role="heading"]');
        const cs = hd ? getComputedStyle(hd) : null;
        const rect = hd ? hd.getBoundingClientRect() : null;
        return {
          id, present: true,
          headingTag: hd ? hd.tagName : null,
          headingText: hd ? (hd.innerText || hd.textContent || '').trim().slice(0, 90) : null,
          headingVisible: !!(hd && rect && rect.width > 0 && rect.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05),
          headingOpacity: cs ? cs.opacity : null,
          canvases: el.querySelectorAll('canvas').length,
          svgs: el.querySelectorAll('svg').length,
          videos: el.querySelectorAll('video').length,
        };
      })
    };
  });
  R.sections['v' + w] = sec;

  // media autoplay state
  const media = await page.evaluate(() => [...document.querySelectorAll('video,audio')].map(v => ({ tag: v.tagName, src: v.currentSrc || v.src, autoplay: v.autoplay, paused: v.paused, muted: v.muted, loop: v.loop, preload: v.preload, t: v.currentTime })));
  // minivic toggle
  const mv = await page.evaluate(() => {
    const t = document.querySelector('[data-testid="minivic-toggle"]');
    if (!t) return { present: false };
    const r = t.getBoundingClientRect(); const cs = getComputedStyle(t);
    return { present: true, tag: t.tagName, label: (t.getAttribute('aria-label') || t.innerText || '').trim().slice(0, 80), rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, bottomRight: r.x > innerWidth * 0.55 && r.y > innerHeight * 0.55, visible: cs.visibility !== 'hidden' && cs.display !== 'none' };
  });

  // colour audit: sample computed colors of text nodes for non-monochrome/non-gold
  const colors = await page.evaluate(() => {
    const seen = {};
    const bad = [];
    const isMono = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b) <= 8;
    for (const el of [...document.querySelectorAll('*')].slice(0, 4000)) {
      const cs = getComputedStyle(el);
      for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor']) {
        const v = cs[prop];
        const m = v && v.match(/rgba?\((\d+), ?(\d+), ?(\d+)(?:, ?([\d.]+))?\)/);
        if (!m) continue;
        const [r, g, b] = [+m[1], +m[2], +m[3]]; const a = m[4] === undefined ? 1 : +m[4];
        if (a < 0.05) continue;
        if (isMono(r, g, b)) continue;
        const key = `${r},${g},${b}`;
        seen[key] = (seen[key] || 0) + 1;
      }
    }
    return seen;
  });

  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const viols = axe.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, targets: v.nodes.slice(0, 4).map(n => n.target.join(' ')), sample: v.nodes.slice(0, 2).map(n => (n.failureSummary || '').replace(/\s+/g, ' ').slice(0, 220)) }));

  R.viewports['v' + w] = {
    consoleErrors: bag.consoleErrors, consoleWarnings: bag.consoleWarnings.slice(0, 10), pageErrors: bag.pageErrors,
    failedRequests: bag.failed, badStatus: bag.badStatus,
    media, minivic: mv,
    nonMonochromeColors: colors,
    axeViolations: viols,
    axeSeriousCritical: viols.filter(v => v.impact === 'serious' || v.impact === 'critical'),
    requestCount: bag.responses.length,
  };
  if (w === 1440) R.network.responses1440 = bag.responses.filter(r => /\.(mp4|png|jpg|jpeg|webp|mp3|wav|webm|pdf|woff2?)(\?|$)/i.test(r.url) || /assets/.test(r.url));
  await ctx.close();
}

// reduced motion
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const bag = { consoleErrors: [], consoleWarnings: [], pageErrors: [], failed: [], responses: [], badStatus: [] };
  await instrument(page, bag);
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3500);
  const s1 = await page.evaluate(() => [...document.querySelectorAll('video,audio')].map(v => ({ src: (v.currentSrc || v.src || '').split('/').pop(), autoplay: v.autoplay, paused: v.paused, t: v.currentTime })));
  const anims1 = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').map(a => (a.animationName || a.transitionProperty || 'anim') + '@' + (a.effect?.target?.tagName || '?')).slice(0, 20));
  await page.waitForTimeout(2500);
  const s2 = await page.evaluate(() => [...document.querySelectorAll('video,audio')].map(v => ({ src: (v.currentSrc || v.src || '').split('/').pop(), paused: v.paused, t: v.currentTime })));
  const heroText = await page.evaluate(() => {
    const h = document.querySelector('#hero');
    if (!h) return null;
    const hd = h.querySelector('h1');
    const cs = hd ? getComputedStyle(hd) : null;
    return { text: (h.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 320), h1: hd ? hd.innerText.trim() : null, h1opacity: cs ? cs.opacity : null, h1transform: cs ? cs.transform : null };
  });
  await page.screenshot({ path: OUT + '/rm-hero-1440.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });
  R.reducedMotion = { mediaAtLoad: s1, mediaAfter2p5s: s2, runningAnimations: anims1, heroText, consoleErrors: bag.consoleErrors, pageErrors: bag.pageErrors };
  await ctx.close();
}

// no-WebGL
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t, ...a) { if (String(t).includes('webgl')) return null; return orig.call(this, t, ...a); };
  });
  const page = await ctx.newPage();
  const bag = { consoleErrors: [], consoleWarnings: [], pageErrors: [], failed: [], responses: [], badStatus: [] };
  await instrument(page, bag);
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3500);
  const hero = await page.evaluate(() => { const h = document.querySelector('#hero'); return h ? (h.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 250) : null; });
  await page.screenshot({ path: OUT + '/nowebgl-hero-1440.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });
  R.noWebGL = { heroText: hero, consoleErrors: bag.consoleErrors, pageErrors: bag.pageErrors };
  await ctx.close();
}

// keyboard
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, 0));
  const seq = [];
  for (let i = 0; i < 22; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const a = document.activeElement; if (!a) return null;
      const r = a.getBoundingClientRect(); const cs = getComputedStyle(a);
      return {
        tag: a.tagName, testid: a.getAttribute('data-testid') || null,
        text: (a.innerText || a.getAttribute('aria-label') || a.value || '').replace(/\s+/g, ' ').trim().slice(0, 55),
        href: a.getAttribute('href') || null,
        offscreen: r.width === 0 || r.height === 0,
        outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor,
        boxShadow: cs.boxShadow.slice(0, 60),
      };
    });
    seq.push(info);
  }
  R.keyboard.tabSequence = seq;
  await ctx.close();
}

await browser.close();
fs.writeFileSync(OUT + '/attack.json', JSON.stringify(R, null, 2));
console.log('DONE');
