import { chromium } from 'playwright';
const browser = await chromium.launch({ args:['--use-gl=angle','--ignore-gpu-blocklist'] });
const shots = '/Users/vic/claude/forgotten-mistory/.audit-v7/shots-motion';
import { mkdirSync } from 'fs'; mkdirSync(shots,{recursive:true});
async function shot(name, opts, sel=null, wait=3500){
  const ctx = await browser.newContext(opts);
  const p = await ctx.newPage();
  await p.goto('https://forgotten-mistory.web.app/?gl=force',{waitUntil:'load'});
  await p.waitForTimeout(wait);
  await p.screenshot({path:`${shots}/${name}.png`});
  await ctx.close();
  console.log('shot', name);
}
await shot('hero-1440-motion', {viewport:{width:1440,height:900}, reducedMotion:'no-preference'});
await shot('hero-1440-reduce', {viewport:{width:1440,height:900}, reducedMotion:'reduce'});
await shot('hero-390-motion', {viewport:{width:390,height:844}, reducedMotion:'no-preference', deviceScaleFactor:2, isMobile:true, hasTouch:true});

// FPS during scroll, GPU on, no-preference
const ctx = await browser.newContext({viewport:{width:1440,height:900}, reducedMotion:'no-preference'});
const page = await ctx.newPage();
await page.goto('https://forgotten-mistory.web.app/?gl=force',{waitUntil:'load'});
await page.waitForTimeout(2500);
const fps = await page.evaluate(async () => {
  const res = [];
  const run = (label, ms) => new Promise(r=>{
    let n=0; const t0=performance.now();
    const tick=()=>{ n++; if(performance.now()-t0<ms) requestAnimationFrame(tick); else { res.push({label, fps: +(n/((performance.now()-t0)/1000)).toFixed(1)}); r(); } };
    requestAnimationFrame(tick);
  });
  await run('idle @hero', 2000);
  const p = run('scrolling hero->listen', 4000);
  const h = document.documentElement.scrollHeight; let y=0;
  const iv = setInterval(()=>{ y+=120; scrollTo(0,y); if(y>h) clearInterval(iv); }, 16);
  await p; clearInterval(iv);
  scrollTo(0,0); await new Promise(r=>setTimeout(r,800));
  await run('idle @hero after', 2000);
  return res;
});
console.log('FPS:', JSON.stringify(fps));
// long tasks
const lt = await page.evaluate(()=>new Promise(r=>{
  const out=[]; try{ new PerformanceObserver(l=>{for(const e of l.getEntries()) out.push({dur:Math.round(e.duration), start:Math.round(e.startTime)});}).observe({type:'longtask',buffered:true}); }catch(e){}
  setTimeout(()=>r(out), 500);
}));
console.log('LONG TASKS (buffered):', JSON.stringify(lt));
await browser.close();
