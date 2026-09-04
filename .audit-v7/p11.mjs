import { chromium } from 'playwright';
const browser = await chromium.launch({ args:['--use-gl=angle','--ignore-gpu-blocklist'] });
for (const rm of ['reduce','no-preference']) {
  const ctx = await browser.newContext({viewport:{width:1440,height:900}, reducedMotion:rm});
  const page = await ctx.newPage();
  await page.goto('https://forgotten-mistory.web.app/?gl=force',{waitUntil:'load'});
  await page.waitForTimeout(1800);
  await page.evaluate(()=>document.getElementById('vitrine')?.scrollIntoView({block:'start'}));
  await page.waitForTimeout(900);
  await page.evaluate(()=>document.querySelectorAll('#vitrine li')[0].focus());
  await page.waitForTimeout(600);
  const samples = await page.evaluate(()=>new Promise(r=>{
    const rail=document.querySelector('[class*=Vitrine_rail]');
    const out=[]; const t0=performance.now();
    const tick=()=>{ out.push([Math.round(performance.now()-t0), Math.round(rail.scrollLeft)]); if(performance.now()-t0<900) requestAnimationFrame(tick); else r(out); };
    document.querySelectorAll('#vitrine li')[0].dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
    requestAnimationFrame(tick);
  }));
  const uniq = samples.filter((s,i,a)=>i===0||s[1]!==a[i-1][1]);
  console.log(`\nrm=${rm} ArrowRight rail scrollLeft trajectory (${uniq.length} distinct steps):`, JSON.stringify(uniq.slice(0,20)));
  console.log('  verdict:', uniq.length>2 ? 'SMOOTH ANIMATED SCROLL' : 'instant jump');
  // accordion
  await page.evaluate(()=>document.getElementById('experience')?.scrollIntoView());
  await page.waitForTimeout(800);
  const acc = await page.evaluate(()=>{
    const b=[...document.querySelectorAll('[class*=Experience_roleToggle]')][1];
    const body=b.parentElement.querySelector('[class*=Experience_roleBody],[class*=Experience_detail],[id]');
    const cs=body?getComputedStyle(body):null;
    return { expanded:b.getAttribute('aria-expanded'), controls:b.getAttribute('aria-controls'),
      bodyCls: body?String(body.className).slice(0,40):null, bodyTransition: cs?cs.transitionProperty+' | '+cs.transitionDuration:null, maxH: cs?cs.maxHeight:null, h: cs?cs.height:null };
  });
  console.log('  accordion:', JSON.stringify(acc));
  await ctx.close();
}
await browser.close();
