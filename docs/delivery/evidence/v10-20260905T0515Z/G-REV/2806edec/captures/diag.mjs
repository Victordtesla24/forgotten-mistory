import { chromium } from 'playwright';
const EXE = '/opt/ms-playwright/chromium-1234/chrome-linux64/chrome';
const LIVE_URL = process.env.URL || 'https://forgotten-mistory.web.app/';
const b = await chromium.launch({ executablePath: EXE, headless: true,
  args: ['--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist','--enable-webgl','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const logs=[]; p.on('console',m=>logs.push(m.type()+':'+m.text())); p.on('pageerror',e=>logs.push('ERR:'+e));
await p.goto(LIVE_URL, { waitUntil: 'networkidle', timeout: 60000 });
await p.evaluate(() => document.querySelector('#about')?.scrollIntoView({ block: 'center' }));
await p.waitForTimeout(2500);
const info = await p.evaluate(() => {
  const out = { canvases: [], sceneHost: null, fieldSlot: null };
  document.querySelectorAll('canvas').forEach((c) => {
    let ctx = null, lost = null, ver = null;
    try { const g = c.getContext('webgl2'); if (g){ver='webgl2';lost=g.isContextLost();} else { const g1=c.getContext('webgl'); if(g1){ver='webgl';lost=g1.isContextLost();} } } catch(e){ ctx = String(e); }
    const r = c.getBoundingClientRect();
    out.canvases.push({ w: c.width, h: c.height, cssW: Math.round(r.width), cssH: Math.round(r.height), inAbout: !!c.closest('#about'), ver, lost, ctxErr: ctx });
  });
  const host = document.querySelector('[data-scene="about-field"]');
  if (host) { const r = host.getBoundingClientRect(); out.sceneHost = { rect:[r.x,r.y,r.width,r.height].map(Math.round), html: host.outerHTML.slice(0,300) }; }
  const fs = document.querySelector('#about [data-axis]');
  if (fs) { const r = fs.getBoundingClientRect(); out.fieldSlot = { axis: fs.getAttribute('data-axis'), rect:[r.x,r.y,r.width,r.height].map(Math.round) }; }
  return out;
});
console.log(JSON.stringify(info, null, 2));
console.log('--- logs (last 15) ---');
console.log(logs.slice(-15).join('\n'));
await b.close();
