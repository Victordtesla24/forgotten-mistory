import { chromium } from 'playwright';

const W = Number(process.argv[2] || 1440);
const H = Number(process.argv[3] || 900);

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  reducedMotion: 'no-preference',
});
const page = await ctx.newPage();
const msgs = [];
page.on('console', m => msgs.push(`${m.type()}: ${m.text()}`));
await page.goto('https://forgotten-mistory.web.app/', { waitUntil: 'networkidle', timeout: 90000 });
await page.evaluate(() => document.querySelector('#experience')?.scrollIntoView());
await page.waitForTimeout(4000);

const out = await page.evaluate(() => {
  const q = s => document.querySelector(s);
  const r = e => { if (!e) return null; const b = e.getBoundingClientRect(); return {
    l: +b.left.toFixed(2), r: +b.right.toFixed(2), t: +(b.top + scrollY).toFixed(2),
    b: +(b.bottom + scrollY).toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2) }; };
  const sec = q('#experience');
  const cls = n => sec.querySelector(`[class*="${n}"]`);
  const all = n => [...sec.querySelectorAll(`[class*="${n}"]`)];

  const gridLines = all('gridLine').map(e => ({ left: getComputedStyle(e).left, x: +e.getBoundingClientRect().left.toFixed(2) }));
  const ticks = all('axisTick').map(e => ({ text: e.textContent, styleLeft: e.style.left, x: +e.getBoundingClientRect().left.toFixed(2), cx: +(e.getBoundingClientRect().left + e.getBoundingClientRect().width/2).toFixed(2), right: +e.getBoundingClientRect().right.toFixed(2) }));
  const bars = all('trackBar').map(e => { const b = e.getBoundingClientRect(); const btn = e.closest('button');
    return { company: btn.querySelector('[class*="trackCompany"]').textContent,
      styleLeft: e.style.left, styleWidth: e.style.width,
      x: +b.left.toFixed(2), right: +b.right.toFixed(2), w: +b.width.toFixed(2),
      bg: getComputedStyle(e, '::before').backgroundColor,
      yearsRight: (()=>{const y=e.querySelector('[class*="trackYears"]'); return y? +y.getBoundingClientRect().right.toFixed(2):null;})(),
      yearsText: (()=>{const y=e.querySelector('[class*="trackYears"]'); return y? y.textContent:null;})() }; });
  const trackLines = all('trackLine').map(e => ({ x: +e.getBoundingClientRect().left.toFixed(2), r: +e.getBoundingClientRect().right.toFixed(2) }));

  const canvas = sec.querySelector('canvas');
  const openNote = cls('openNote');
  const axis = cls('axis');
  const chart = cls('chart');
  const scene = cls('chartScene');
  const trackField = cls('trackField');
  const inner = cls('inner');

  return {
    scroll: scrollY, docH: document.documentElement.scrollHeight,
    rm: matchMedia('(prefers-reduced-motion: reduce)').matches,
    section: r(sec), inner: r(inner), chart: r(chart), scene: r(scene), canvas: r(canvas),
    trackField: r(trackField), openNote: r(openNote), axis: r(axis),
    axisMarginLeft: axis ? getComputedStyle(axis).marginLeft : null,
    axisComputedH: axis ? getComputedStyle(axis).height : null,
    sceneInset: scene ? getComputedStyle(scene).inset : null,
    labelColComputed: getComputedStyle(sec.querySelector('[class*="trackButton"]')).gridTemplateColumns,
    trackLines, bars, gridLines, ticks,
    openNoteText: openNote?.textContent,
    roleCount: all('role_').length,
    bodies: [...sec.querySelectorAll('[id^="role-body-"]')].map(e => ({ id: e.id, hidden: e.hidden, bullets: e.querySelectorAll('li').length })),
  };
});
console.log(JSON.stringify({ viewport: {W,H}, out, console: msgs.slice(0,20) }, null, 1));
await browser.close();
