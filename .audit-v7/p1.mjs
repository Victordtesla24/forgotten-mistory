import { chromium } from 'playwright';

const URL = process.argv[2] || 'https://forgotten-mistory.web.app/?gl=force';
const RM  = process.argv[3] || 'no-preference';
const W = Number(process.argv[4] || 1440), H = Number(process.argv[5] || 900);

const browser = await chromium.launch({
  args: ['--use-gl=angle','--use-angle=default','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
});
const ctx = await browser.newContext({ viewport:{width:W,height:H}, reducedMotion: RM, deviceScaleFactor:1 });
const page = await ctx.newPage();
const logs = [];
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));
await page.goto(URL, { waitUntil:'load', timeout:60000 });
await page.waitForTimeout(4000);

const gl = await page.evaluate(() => {
  const c = document.createElement('canvas');
  const g = c.getContext('webgl2') || c.getContext('webgl');
  if(!g) return {ok:false};
  const d = g.getExtension('WEBGL_debug_renderer_info');
  return { ok:true, renderer: d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown' };
});
const rm = await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
const before = await page.evaluate(()=>document.querySelectorAll('canvas').length);

console.log('URL', URL, 'rm-matches:', rm, 'gl:', JSON.stringify(gl));
console.log('canvases at rest:', before);
console.log('--- console after load ---');
logs.forEach(l=>console.log(l));

// now scroll the whole page slowly and count again
logs.length = 0;
const h = await page.evaluate(()=>document.documentElement.scrollHeight);
for (let y=0; y<h; y+=400){ await page.evaluate(v=>scrollTo(0,v), y); await page.waitForTimeout(120); }
await page.waitForTimeout(1500);
for (let y=h; y>=0; y-=600){ await page.evaluate(v=>scrollTo(0,v), y); await page.waitForTimeout(100); }
await page.waitForTimeout(1500);
console.log('--- console during/after full scroll ---');
logs.forEach(l=>console.log(l));
console.log('canvases after scroll:', await page.evaluate(()=>document.querySelectorAll('canvas').length));
await browser.close();
