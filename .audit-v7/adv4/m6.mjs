import { chromium } from 'playwright';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
// console on desktop
const c=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
const p=await c.newPage();
const msgs=[];
p.on('console',m=>msgs.push(m.type()+': '+m.text()));
p.on('pageerror',e=>msgs.push('pageerror: '+e.message));
await p.goto('https://forgotten-mistory.web.app/',{waitUntil:'networkidle'});
await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=350){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60));}});
await p.waitForTimeout(3000);
console.log('CONSOLE',JSON.stringify(msgs.slice(0,20)));
console.log('WEBGL_CLAIM_IN_SKILLS',await p.evaluate(()=>document.querySelector('#skills').innerText.includes('one context per section, no context loss')));
await c.close();
// touch 390: tap a source chip
const c2=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'no-preference'});
const p2=await c2.newPage();
await p2.goto('https://forgotten-mistory.web.app/',{waitUntil:'networkidle'});
await p2.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=350){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,25));}});
await p2.waitForTimeout(1500);
const r=await p2.evaluate(()=>{const s=document.querySelector('#skills');
 const chips=[...s.querySelectorAll('[data-side="sources"] button')];
 return {chips:chips.length,cls:chips[0]?.className, hoverMediaNone:matchMedia('(hover: none)').matches};});
console.log('CHIPS',JSON.stringify(r));
const chip=p2.locator('#skills [data-side="sources"] button').filter({hasText:'ANZ'}).first();
await chip.scrollIntoViewIfNeeded();
await chip.tap();
await p2.waitForTimeout(600);
console.log('AFTER_TAP',JSON.stringify(await p2.evaluate(()=>{const s=document.querySelector('#skills');
 const caps=[...s.querySelectorAll('[data-side="capabilities"] button')];
 return {benchDimmed:s.querySelector('[class*="bench"]')?.hasAttribute('data-dimmed'),
  litCaps:caps.filter(c=>c.hasAttribute('data-lit')).length,
  visibleRows:[...s.querySelectorAll('tbody tr')].filter(t=>!t.hidden).length,
  tracedRows:s.querySelectorAll('tr[data-traced]').length,
  readout:s.querySelector('figure > p')?.textContent.trim().slice(0,90),
  countLine:s.querySelector('[role=status]')?.textContent.trim()};})));
// tap elsewhere to see if state clears
await p2.locator('#skills h2').tap();
await p2.waitForTimeout(400);
console.log('AFTER_TAP_AWAY',JSON.stringify(await p2.evaluate(()=>{const s=document.querySelector('#skills');
 return {benchDimmed:s.querySelector('[class*="bench"]')?.hasAttribute('data-dimmed')};})));
await b.close();
