import { chromium } from 'playwright';
import fs from 'node:fs';
const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const out={};
for (const rm of ['no-preference','reduce']) {
  const ctx=await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,reducedMotion:rm});
  const p=await ctx.newPage();
  await p.goto('https://forgotten-mistory.web.app/',{waitUntil:'networkidle',timeout:90000});
  await p.waitForTimeout(3500);
  const els=await p.evaluate(()=>{
    const pick=[
      ['eyebrow','#hero p'],
      ['statement',null],['grading',null],['availability',null],
    ];
    const ps=[...document.querySelectorAll('#hero p')];
    const map={
      eyebrow: ps.find(x=>x.textContent.includes('Melbourne')),
      role: ps.find(x=>x.textContent.includes('Delivery leadership')),
      statement: ps.find(x=>x.textContent.startsWith('Sixteen')),
      grading: ps.find(x=>x.textContent.startsWith('◐')),
      availability: ps.find(x=>x.textContent.startsWith('Open to')),
      ledgerSource1: document.querySelectorAll('#hero li')[0].lastElementChild,
      ledgerSource3: document.querySelectorAll('#hero li')[2].lastElementChild,
      ledgerLabel1: document.querySelectorAll('#hero li')[0].children[1],
    };
    const o={};
    for (const [k,e] of Object.entries(map)) { if(!e) continue; const r=e.getBoundingClientRect(); const c=getComputedStyle(e);
      o[k]={x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),color:c.color,fs:c.fontSize,fw:c.fontWeight}; }
    o._canvases=document.querySelectorAll('#hero canvas').length;
    return o;
  });
  await p.screenshot({path:`/Users/vic/claude/forgotten-mistory/.audit-v7/s1/c-${rm}.png`});
  out[rm]=els; await ctx.close();
}
await b.close();
fs.writeFileSync('/Users/vic/claude/forgotten-mistory/.audit-v7/s1/contrast.json',JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1));
