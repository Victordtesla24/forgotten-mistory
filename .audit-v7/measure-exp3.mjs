import { chromium } from 'playwright';
import fs from 'fs';
const browser = await chromium.launch({ headless:true, args:['--use-gl=angle','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1, reducedMotion:'no-preference' });
const page = await ctx.newPage();
await page.goto('https://forgotten-mistory.web.app/', { waitUntil:'networkidle', timeout:90000 });
await page.evaluate(()=>document.querySelector('#experience').scrollIntoView({block:'start'}));
await page.waitForTimeout(5000);
// screenshot the chart region
const box = await page.evaluate(()=>{
  const s=document.querySelector('#experience [class*="chart"]');
  const b=s.getBoundingClientRect(); return {x:0,y:Math.max(0,b.top-20),width:1440,height:Math.min(880,b.height+80)};
});
await page.screenshot({ path:'/Users/vic/claude/forgotten-mistory/.audit-v7/shots/exp-chart-1440-nopref.png', clip: box });
// sample canvas luminance in-band vs out-of-band
const s = await page.evaluate(()=>{
  const sec=document.querySelector('#experience');
  const cv=sec.querySelector('canvas');
  if(!cv) return {err:'no canvas'};
  const gl=cv.getContext('webgl2')||cv.getContext('webgl');
  return { canvasSize:[cv.width,cv.height], cssSize:[cv.clientWidth,cv.clientHeight], glLost: gl? gl.isContextLost(): 'no-ctx',
    openNoteColor: getComputedStyle(sec.querySelector('[class*="openNote"]')).color,
    tickColor: getComputedStyle(sec.querySelector('[class*="axisTick"]')).color,
    barBg: getComputedStyle(sec.querySelector('[class*="trackBar"]'),'::before').backgroundColor,
    goldMarks: [...sec.querySelectorAll('*')].filter(e=>{const c=getComputedStyle(e); return [c.color,c.backgroundColor,c.borderColor,c.fill,c.stroke].some(v=>/201,\s*168,\s*76|c9a84c/i.test(v||''))}).length };
});
console.log(JSON.stringify(s,null,1));
await browser.close();
