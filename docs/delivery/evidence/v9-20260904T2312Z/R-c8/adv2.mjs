import { chromium } from 'playwright';
const b=await chromium.launch({channel:'chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
const ctx=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
const p=await ctx.newPage();
await p.goto('https://forgotten-mistory.web.app/?gl=force',{waitUntil:'load',timeout:60000});
await p.waitForTimeout(3000);
console.log('RM_ANIM',JSON.stringify(await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').map(a=>{
 const t=a.effect.target;const cs=t?getComputedStyle(t):null;
 return{tag:t.tagName,cls:String(t.className).slice(0,80),anim:cs?cs.animationName:'',dur:cs?cs.animationDuration:'',
  parent:t.parentElement?t.parentElement.tagName+'.'+String(t.parentElement.className).slice(0,60):'',
  section:(t.closest('section[id]')||{}).id||'(none)',aria:t.getAttribute('aria-hidden')};}))));
await ctx.close();
// tab reach to minivic, no reduced motion
const c2=await b.newContext({viewport:{width:1440,height:900}});
const p2=await c2.newPage();
await p2.goto('https://forgotten-mistory.web.app/?gl=force',{waitUntil:'load',timeout:60000});
await p2.waitForTimeout(2500);
console.log('MV_DOM',JSON.stringify(await p2.evaluate(()=>{const el=document.querySelector('[data-testid="minivic-toggle"]');
 const f=[...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(e=>!e.hasAttribute('disabled')&&e.offsetParent!==null);
 return{total:f.length,idx:f.indexOf(el),tabindex:el.getAttribute('tabindex'),ariaHidden:el.closest('[aria-hidden="true"]')?'yes':'no',inert:el.closest('[inert]')?'yes':'no'};})));
let reached=null;
for(let i=1;i<=200;i++){await p2.keyboard.press('Tab');
 const hit=await p2.evaluate(()=>document.activeElement&&document.activeElement.getAttribute('data-testid')==='minivic-toggle');
 if(hit){reached=i;break;}}
console.log('MV_TAB_STOPS',reached);
await b.close();
