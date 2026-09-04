import { chromium } from 'playwright';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
// no-JS
const c1=await b.newContext({viewport:{width:1440,height:900},javaScriptEnabled:false,reducedMotion:'no-preference'});
const p1=await c1.newPage();
await p1.goto('https://forgotten-mistory.web.app/',{waitUntil:'domcontentloaded'});
await p1.waitForTimeout(1500);
console.log('NOJS',JSON.stringify(await p1.evaluate(()=>{const s=document.querySelector('#skills');if(!s)return{noSection:true};const sv=s.querySelector('svg');
 return{viewBox:sv?.getAttribute('viewBox'),paths:s.querySelectorAll('svg path').length,rows:s.querySelectorAll('tbody tr').length,
 caption:s.querySelector('figcaption')?.textContent.trim().slice(0,80),readout:s.querySelector('figure > p')?.textContent.trim(),
 footer:[...s.querySelectorAll('p')].map(x=>x.textContent).filter(t=>t.includes('Calibrated')).length, buttons:s.querySelectorAll('button').length};})));
await c1.close();
// mobile 390 no-preference
const c2=await b.newContext({viewport:{width:390,height:844},reducedMotion:'no-preference',hasTouch:true,isMobile:true});
const p2=await c2.newPage();
await p2.goto('https://forgotten-mistory.web.app/',{waitUntil:'networkidle'});
await p2.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,25));}});
await p2.waitForTimeout(1500);
console.log('M390',JSON.stringify(await p2.evaluate(()=>{const s=document.querySelector('#skills');const sv=s.querySelector('svg');
 return{svgDisplay:getComputedStyle(sv).display,paths:s.querySelectorAll('svg path').length,h:Math.round(s.getBoundingClientRect().height),
 caption:s.querySelector('figcaption')?.textContent.trim(),readout:s.querySelector('figure > p')?.textContent.trim(),anchors:s.querySelectorAll('a[href]').length};})));
await c2.close();
// reduce at 1440
const c3=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
const p3=await c3.newPage();
await p3.goto('https://forgotten-mistory.web.app/',{waitUntil:'networkidle'});
await p3.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,25));}});
await p3.waitForTimeout(1500);
console.log('REDUCE',JSON.stringify(await p3.evaluate(()=>{const s=document.querySelector('#skills');const ps=[...s.querySelectorAll('svg path')];
 return{paths:ps.length,opacities:[...new Set(ps.map(x=>getComputedStyle(x).opacity))],so:[...new Set(ps.map(x=>getComputedStyle(x).strokeOpacity))]};})));
// interactions at 1440 (reuse c3 page? use fresh no-preference)
await c3.close();
const c4=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
const p4=await c4.newPage();
await p4.goto('https://forgotten-mistory.web.app/',{waitUntil:'networkidle'});
await p4.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,25));}});
await p4.waitForTimeout(2500);
await p4.evaluate(()=>document.querySelector('#skills figure').scrollIntoView({block:'center'}));
await p4.waitForTimeout(800);
// focus a capability node
const r=await p4.evaluate(async()=>{
  const s=document.querySelector('#skills');
  const caps=[...s.querySelectorAll('[class*="rail"][data-side="capabilities"] button')];
  const target=caps.find(bn=>bn.textContent.includes('Real-time'))||caps[2];
  target.focus(); target.dispatchEvent(new MouseEvent('mouseenter',{bubbles:false}));
  await new Promise(res=>setTimeout(res,600));
  const traced=[...s.querySelectorAll('tr[data-traced]')];
  const readout=s.querySelector('figure > p');
  const rb=readout.getBoundingClientRect();
  const dim=[...s.querySelectorAll('svg path')].map(x=>getComputedStyle(x).strokeOpacity);
  // now a source node
  const srcs=[...s.querySelectorAll('[data-side="sources"] button')];
  const anz=srcs.find(bn=>bn.textContent.includes('ANZ'));
  const capRes={tracedRows:traced.length,tracedTop:traced[0]?Math.round(traced[0].getBoundingClientRect().top):null,vh:innerHeight,
    readoutText:readout.textContent.trim().slice(0,140),readoutInView:rb.top>=0&&rb.bottom<=innerHeight,
    dimmed:[...new Set(dim)]};
  target.blur();
  anz.focus(); anz.dispatchEvent(new MouseEvent('mouseenter',{bubbles:false}));
  await new Promise(res=>setTimeout(res,600));
  const srcRes={tracedRows:s.querySelectorAll('tr[data-traced]').length,readout:s.querySelector('figure > p').textContent.trim().slice(0,120)};
  // click test
  anz.click(); await new Promise(res=>setTimeout(res,400));
  const clicked={tracedAfterClick:s.querySelectorAll('tr[data-traced]').length,ariaPressed:anz.getAttribute('aria-pressed'),ariaExpanded:anz.getAttribute('aria-expanded')};
  return {capRes,srcRes,clicked};
});
console.log('INTERACT',JSON.stringify(r,null,1));
await b.close();
