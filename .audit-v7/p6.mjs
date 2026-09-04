import { chromium } from 'playwright';
const browser = await chromium.launch({ args:['--use-gl=angle','--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport:{width:1440,height:900}, reducedMotion:'no-preference' });
const page = await ctx.newPage();
await page.goto('https://forgotten-mistory.web.app/?gl=force',{waitUntil:'load'});
await page.waitForTimeout(1500);

// scroll-behavior + smooth-scroll
console.log('html scroll-behavior:', await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior));
console.log('overscroll:', await page.evaluate(()=>getComputedStyle(document.documentElement).overscrollBehavior+' / body '+getComputedStyle(document.body).overscrollBehavior));

// keyboard walk: tab through and record focus ring + scroll jumps
await page.evaluate(()=>scrollTo(0,0));
await page.waitForTimeout(400);
const walk = [];
for (let i=0;i<40;i++){
  await page.keyboard.press('Tab');
  await page.waitForTimeout(90);
  const f = await page.evaluate(()=>{
    const el=document.activeElement; if(!el) return null;
    const cs=getComputedStyle(el);
    return { tag:el.tagName.toLowerCase(), cls:String(el.className||'').slice(0,34), label:(el.getAttribute('aria-label')||el.textContent||'').trim().replace(/\s+/g,' ').slice(0,38),
      outline: cs.outlineStyle+' '+cs.outlineWidth+' '+cs.outlineColor, boxShadow: cs.boxShadow.slice(0,40), y: Math.round(scrollY), inView: (()=>{const r=el.getBoundingClientRect(); return r.top>=-4 && r.bottom<=innerHeight+4;})() };
  });
  walk.push(f);
}
console.log('\n=== TAB WALK (40 stops) ===');
walk.forEach((f,i)=>console.log(`${String(i+1).padStart(2)} ${f.tag}.${f.cls} [${f.label}] outline="${f.outline}" inView=${f.inView} scrollY=${f.y}`));
await browser.close();
