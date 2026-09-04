import { chromium } from 'playwright';
const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
for (const [w,h,dsf] of [[390,844,3],[430,932,3],[360,780,3],[768,1024,2],[1280,720,1],[1440,900,1]]) {
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,reducedMotion:'no-preference',isMobile:w<500,hasTouch:w<500});
  const p=await ctx.newPage();
  await p.goto('https://forgotten-mistory.web.app/',{waitUntil:'networkidle',timeout:90000});
  await p.waitForTimeout(2500);
  const d=await p.evaluate(()=>{
    const q=s=>{const e=document.querySelector(s); if(!e)return null; const b=e.getBoundingClientRect(); return {y:+b.y.toFixed(1),b:+b.bottom.toFixed(1)};};
    const hero=document.getElementById('hero');
    return {vh:innerHeight, heroH:+hero.getBoundingClientRect().height.toFixed(1),
      h1:q('#hero h1'), ledger3:(()=>{const l=document.querySelectorAll('#hero ul li');const e=l[l.length-1];const b=e.getBoundingClientRect();return{y:+b.y.toFixed(1),b:+b.bottom.toFixed(1)};})(),
      primary:q('#hero a[href="#experience"]'), cv:q('#hero a[href$=".pdf"]'),
      avail:q('#hero p:last-of-type'), grading:(()=>{const e=[...document.querySelectorAll('#hero p')].find(x=>x.textContent.startsWith('◐'));const b=e.getBoundingClientRect();return{y:+b.y.toFixed(1),b:+b.bottom.toFixed(1)};})(),
      canvases:document.querySelectorAll('#hero canvas').length};
  });
  console.log(w+'x'+h, JSON.stringify(d));
  await ctx.close();
}
await b.close();
