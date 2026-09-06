import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://127.0.0.1:5635';
const W = Number(process.env.W || 390);
const H = Number(process.env.H || 844);
const HOVER = process.env.HOVER === '1';

const chan = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
const lum = ([r, g, b]) => 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
const BODY_INK = [205, 205, 205];
const CEILING = (lum(BODY_INK) + 0.05) / 4.5 - 0.05;

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto(BASE + '/', { waitUntil: 'load' });
await page.locator('#hero h1').waitFor({ state: 'visible', timeout: 20000 });
await page.evaluate(async () => {
  const h = document.documentElement.scrollHeight;
  for (let y = 0; y < h; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(2000);
await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2));
await page.waitForTimeout(500);
const box = await page.locator('[data-testid="minivic-toggle"]').boundingBox();
if (HOVER) { await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2); await page.waitForTimeout(600); }
await page.evaluate(() => {
  const s = document.createElement('style'); s.id = '__m';
  s.textContent = '*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;caret-color:transparent!important;transition:none!important}';
  document.head.appendChild(s);
});
const png = await page.screenshot({ fullPage: false, animations: 'disabled' });
await page.evaluate(() => document.getElementById('__m')?.remove());

const pts = [];
for (let y = box.y + 1; y < box.y + box.height - 1; y += 2)
  for (let x = box.x + 1; x < box.x + box.width - 1; x += 2) pts.push([Math.round(x), Math.round(y)]);

const px = await page.evaluate(async ([b64, p]) => {
  const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0);
  const scale = img.naturalWidth / window.innerWidth;
  return p.map(([x, y]) => { const d = ctx.getImageData(Math.round(x * scale), Math.round(y * scale), 1, 1).data; return [d[0], d[1], d[2]]; });
}, [png.toString('base64'), pts]);

let maxL = -1, bright = [0,0,0], bi = 0;
px.forEach((p, i) => { const l = lum(p); if (l > maxL) { maxL = l; bright = p; bi = i; } });
const overs = px.map((p,i)=>[p,i]).filter(([p]) => lum(p) > CEILING);
console.log(`viewport ${W}x${H} hover=${HOVER} box=${JSON.stringify(box)}`);
console.log(`brightest rgb(${bright.join(',')}) L=${maxL.toFixed(4)} at ${JSON.stringify(pts[bi])} ceiling=${CEILING.toFixed(4)}  ${maxL<=CEILING?'PASS':'FAIL'}`);
console.log(`pixels over ceiling: ${overs.length}/${px.length}`);
// where are the offending pixels, and what element is there?
const sample = overs.slice(0, 6).map(([,i]) => pts[i]);
const who = await page.evaluate((pp) => pp.map(([x,y]) => ({ pt:[x,y], stack: document.elementsFromPoint(x,y).slice(0,4).map(e => e.tagName.toLowerCase()+'.'+String(e.className).slice(0,42)) })), sample);
console.log(JSON.stringify(who, null, 1));
// geometry of the parts
const parts = await page.evaluate(() => {
  const b = document.querySelector('[data-testid="minivic-toggle"]');
  const g = (s) => { const e = s ? b.querySelector(s) : b; if(!e) return null; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    return { rect: {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}, bg: cs.backgroundColor, op: cs.opacity }; };
  return { button: g(null), pill: g('.minivic-launcher__pill'), disc: g('.minivic-launcher__disc'), dockOpacity: getComputedStyle(document.querySelector('.minivic-dock')).opacity };
});
console.log(JSON.stringify(parts, null, 1));
await browser.close();
