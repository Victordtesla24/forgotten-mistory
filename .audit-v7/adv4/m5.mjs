import { chromium } from 'playwright';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const c=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
const p=await c.newPage();
await p.goto('https://forgotten-mistory.web.app/',{waitUntil:'networkidle'});
await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,25));}});
await p.waitForTimeout(2000);
console.log(JSON.stringify(await p.evaluate(()=>{
 const s=document.querySelector('#skills');
 const marks=[...s.querySelectorAll('[class*="mark"]')].map(m=>{const cs=getComputedStyle(m);const r=m.getBoundingClientRect();
   return {cls:m.className.replace(/Bench_|__\w+/g,''),w:+cs.width.replace('px',''),h:+cs.height.replace('px',''),border:cs.borderTopWidth,box:+r.width.toFixed(2),bg:cs.backgroundColor,bImg:cs.backgroundImage.slice(0,40)};});
 const uniq={}; marks.forEach(m=>{const k=m.cls+'|'+m.w+'|'+m.box; uniq[k]=(uniq[k]||0)+1;});
 // pending mark ring colour
 const legend=[...s.querySelectorAll('[class*="legendGlyph"]')].map(e=>getComputedStyle(e).color);
 const statusGlyphs=[...s.querySelectorAll('[class*="statusGlyph"]')].map(e=>getComputedStyle(e).color);
 const glyphCount={}; statusGlyphs.forEach(c=>glyphCount[c]=(glyphCount[c]||0)+1);
 return {markSizes:uniq,legend,glyphCount,
  benchBox:(()=>{const f=s.querySelector('figure');const r=f.getBoundingClientRect();return{w:Math.round(r.width),h:Math.round(r.height)};})(),
  railBoxes:[...s.querySelectorAll('[data-side]')].map(r=>{const b=r.getBoundingClientRect();return{side:r.dataset.side,x:Math.round(b.x),w:Math.round(b.width)};}),
  gradients:s.querySelectorAll('linearGradient').length,
  emptyState:!!s.querySelector('[class*="empty"]'),
  tracedShadowRule:'see css'};
})));
// tab order
await p.evaluate(()=>document.querySelector('#skills figure').scrollIntoView({block:'start'}));
await p.waitForTimeout(400);
const seq=[];
await p.evaluate(()=>{const f=document.querySelector('#skills figure button');f&&f.focus();});
for(let i=0;i<36;i++){seq.push(await p.evaluate(()=>{const a=document.activeElement;return (a.tagName+':'+(a.textContent||'').trim().slice(0,26));})); await p.keyboard.press('Tab');}
console.log('TABSEQ',JSON.stringify(seq));
await b.close();
