import { chromium } from 'playwright';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const c=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
const p=await c.newPage();
await p.goto('https://forgotten-mistory.web.app/',{waitUntil:'networkidle'});
await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=350){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,25));}});
await p.waitForTimeout(2000);
console.log(JSON.stringify(await p.evaluate(()=>{
 const s=document.querySelector('#skills');
 const fig=s.querySelector('figure');
 const legend=s.querySelector('[aria-label="Status legend"]');
 const figR=fig.getBoundingClientRect(), lgR=legend.getBoundingClientRect();
 const marks=[...s.querySelectorAll('[class*="mark"]')];
 const lastMark=marks[marks.length-1].getBoundingClientRect();
 return {legendInsideFigure:fig.contains(legend),
  gapPx:Math.round(lgR.top-figR.bottom),
  gapFromLastMark:Math.round(lgR.top-lastMark.bottom),
  figH:Math.round(figR.height),
  benchMarkWords:[...s.querySelectorAll('[data-side="capabilities"] button')].slice(0,2).map(bn=>bn.innerText.trim()),
  figureTextMentionsStates:['measured in production','measured outside production','in progress, not yet held'].map(t=>fig.innerText.includes(t))};
})));
await b.close();
