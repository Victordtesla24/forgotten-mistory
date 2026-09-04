import { chromium } from 'playwright';
const browser = await chromium.launch({ args:['--use-gl=angle','--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({viewport:{width:1440,height:900}, reducedMotion:'no-preference'});
const page = await ctx.newPage();
await page.goto('https://forgotten-mistory.web.app/?gl=force',{waitUntil:'load'});
await page.waitForTimeout(2000);

console.log('menu-toggle__bar transition:', await page.evaluate(()=>{const b=document.querySelector('.menu-toggle__bar'); if(!b) return 'absent'; const c=getComputedStyle(b); return c.transitionProperty+' | '+c.transitionDuration+' | '+c.transitionTimingFunction+' | width='+c.width;}));

// Experience chart: canvas + text equivalent
await page.evaluate(()=>document.getElementById('experience')?.scrollIntoView());
await page.waitForTimeout(2500);
console.log('\nEXPERIENCE canvases:', await page.evaluate(()=>[...document.querySelectorAll('#experience canvas')].map(c=>({w:c.width,h:c.height, ariaHidden:c.closest('[aria-hidden]')?.getAttribute('aria-hidden'), role:c.getAttribute('role'), label:c.getAttribute('aria-label')}))));
console.log('EXPERIENCE svg roles:', await page.evaluate(()=>[...document.querySelectorAll('#experience svg')].map(s=>({role:s.getAttribute('role'),label:(s.getAttribute('aria-label')||'').slice(0,80), hidden:s.getAttribute('aria-hidden')}))));

// Vitrine rail: keyboard focus jump + snap fight
await page.evaluate(()=>document.getElementById('vitrine')?.scrollIntoView({block:'start'}));
await page.waitForTimeout(1200);
const before = await page.evaluate(()=>({y:scrollY, railX: document.querySelector('[class*=Vitrine_rail]')?.scrollLeft}));
await page.evaluate(()=>{ const p=[...document.querySelectorAll('#vitrine li')]; p[5]?.focus(); });
await page.waitForTimeout(900);
const after = await page.evaluate(()=>({y:scrollY, railX: document.querySelector('[class*=Vitrine_rail]')?.scrollLeft}));
console.log('\nVITRINE focus plate06: before',JSON.stringify(before),'after',JSON.stringify(after));

// wheel over rail: does a vertical gesture get captured?
await page.evaluate(()=>scrollTo(0, document.getElementById('vitrine').offsetTop));
await page.waitForTimeout(600);
const y0 = await page.evaluate(()=>scrollY);
const rail = await page.$('[class*=Vitrine_rail]');
const box = await rail.boundingBox();
await page.mouse.move(box.x+box.width/2, box.y+box.height/2);
await page.mouse.wheel(0, 400);
await page.waitForTimeout(600);
const y1 = await page.evaluate(()=>({y:scrollY, railX: document.querySelector('[class*=Vitrine_rail]').scrollLeft}));
console.log('wheel(0,400) over rail: y0=',y0,'->',JSON.stringify(y1));

// arrow keys inside rail
console.log('\nrail computed:', await page.evaluate(()=>{const r=document.querySelector('[class*=Vitrine_rail]'); const c=getComputedStyle(r); return {scrollSnapType:c.scrollSnapType, scrollBehavior:c.scrollBehavior, overscrollBehavior:c.overscrollBehavior, scrollbarWidth:c.scrollbarWidth, scrollbarColor:c.scrollbarColor};}));

// Skills bench svg a11y
await page.evaluate(()=>document.getElementById('skills')?.scrollIntoView());
await page.waitForTimeout(1200);
console.log('\nSKILLS svg:', await page.evaluate(()=>[...document.querySelectorAll('#skills svg')].map(s=>({role:s.getAttribute('role'),label:(s.getAttribute('aria-label')||'').slice(0,90), hidden:s.getAttribute('aria-hidden')}))));
await browser.close();
