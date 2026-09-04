import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist'] });
for (const [W,H] of [[390,844],[768,1024],[1024,768],[1280,800],[1920,1080]]) {
  const ctx = await browser.newContext({ viewport:{width:W,height:H}, deviceScaleFactor:1, reducedMotion:'no-preference' });
  const page = await ctx.newPage();
  await page.goto('https://forgotten-mistory.web.app/', { waitUntil:'networkidle', timeout:90000 });
  await page.evaluate(()=>document.querySelector('#experience')?.scrollIntoView());
  await page.waitForTimeout(2500);
  const o = await page.evaluate(() => {
    const sec=document.querySelector('#experience');
    const c=n=>sec.querySelector(`[class*="${n}"]`), a=n=>[...sec.querySelectorAll(`[class*="${n}"]`)];
    const bx=e=>e?{l:+e.getBoundingClientRect().left.toFixed(2),r:+e.getBoundingClientRect().right.toFixed(2),t:+(e.getBoundingClientRect().top+scrollY).toFixed(2),b:+(e.getBoundingClientRect().bottom+scrollY).toFixed(2)}:null;
    const gl=a('gridLine').map(e=>+e.getBoundingClientRect().left.toFixed(2));
    const tk=a('axisTick').map(e=>({t:e.textContent,cx:+(e.getBoundingClientRect().left+e.getBoundingClientRect().width/2).toFixed(2),r:+e.getBoundingClientRect().right.toFixed(2)}));
    const tl=sec.querySelector('[class*="trackLine"]').getBoundingClientRect();
    const yrs=a('trackYears').map(e=>({t:e.textContent,r:+e.getBoundingClientRect().right.toFixed(2),vis:getComputedStyle(e).display}));
    const inner=c('inner').getBoundingClientRect();
    return { rm:matchMedia('(prefers-reduced-motion: reduce)').matches,
      innerL:+inner.left.toFixed(2), innerR:+inner.right.toFixed(2),
      barsL:+tl.left.toFixed(2), barsR:+tl.right.toFixed(2),
      axis:bx(c('axis')), axisML:getComputedStyle(c('axis')).marginLeft,
      labelCols:getComputedStyle(sec.querySelector('[class*="trackButton"]')).gridTemplateColumns,
      scene:bx(c('chartScene')), canvas:!!sec.querySelector('canvas'),
      openNote:bx(c('openNote')), gridLines:gl, ticks:tk, years:yrs,
      docScrollW:document.documentElement.scrollWidth, clientW:document.documentElement.clientWidth };
  });
  const err = o.ticks.map((t,i)=> i<o.gridLines.length ? +(o.gridLines[i]-t.cx).toFixed(2) : null);
  console.log(`\n### ${W}x${H}  rm=${o.rm} canvas=${o.canvas}`);
  console.log(` inner ${o.innerL}..${o.innerR} | bars ${o.barsL}..${o.barsR} | axis ${o.axis.l}..${o.axis.r} (ml ${o.axisML}) | cols ${o.labelCols}`);
  console.log(` axisOrigin-vs-barOrigin = ${(o.barsL-o.axis.l).toFixed(2)}px`);
  console.log(` tick-vs-gridline err px: ${JSON.stringify(err)}  ticks:${o.ticks.map(t=>t.t+'@'+t.cx).join(' ')}`);
  console.log(` "now" right ${o.ticks.at(-1).r} vs inner right ${o.innerR} -> overflow ${(o.ticks.at(-1).r-o.innerR).toFixed(2)}px`);
  console.log(` scene ${o.scene? o.scene.l+'..'+o.scene.r+' bottom '+o.scene.b : 'ABSENT'} | openNote ${o.openNote.t}..${o.openNote.b} | axis top ${o.axis.t}`);
  if(o.scene) console.log(` openNote/scene vertical overlap = ${Math.max(0,+(o.scene.b-o.openNote.t).toFixed(2))}px ; scene-left vs column-left = ${(o.scene.l-o.innerL).toFixed(2)}px ; axis top - scene bottom = ${(o.axis.t-o.scene.b).toFixed(2)}px`);
  console.log(` years labels: ${o.years.map(y=>y.t+'@'+y.r+(y.vis==='none'?'(hidden)':'')).join(' ')} | max overflow ${Math.max(...o.years.map(y=>y.vis==='none'?0:y.r-o.innerR)).toFixed(2)}px`);
  console.log(` doc scrollW ${o.docScrollW} vs clientW ${o.clientW}`);
  await ctx.close();
}
await browser.close();
