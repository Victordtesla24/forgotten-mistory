import { chromium } from 'playwright';
const b=await chromium.launch();
for(const w of [1440,390]){
const ctx=await b.newContext({viewport:{width:w,height:w<500?844:900},reducedMotion:'no-preference',deviceScaleFactor:1});
const p=await ctx.newPage();
await p.goto('https://forgotten-mistory.web.app/',{waitUntil:'networkidle'});
await p.evaluate(async()=>{const H=document.body.scrollHeight;for(let y=0;y<H;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,30));}});
await p.waitForTimeout(1200);
const r=await p.evaluate(()=>{
  const out=[];
  document.querySelectorAll('svg').forEach(svg=>{
    const sr=svg.getBoundingClientRect(); const vb=svg.getAttribute('viewBox');
    if(!vb||sr.width===0)return;
    const vw=parseFloat(vb.split(/\s+/)[2]); const k=sr.width/vw;
    const texts=[...svg.querySelectorAll('text,tspan')];
    const seen={};
    texts.forEach(t=>{
      const cs=getComputedStyle(t); const fs=parseFloat(cs.fontSize);
      const key=cs.fontSize+'|'+String(t.className.baseVal).split(' ')[0];
      if(seen[key])return; seen[key]=1;
      const bb=t.getBoundingClientRect();
      out.push({sec:svg.closest('section')?.id, cls:String(t.className.baseVal).split(' ')[0], declFs:cs.fontSize,
        renderedPx:Math.round(fs*k*100)/100, boxH:Math.round(bb.height*10)/10, scale:Math.round(k*1000)/1000,
        svgW:Math.round(sr.width), opacity:cs.opacity, fill:cs.fill, txt:(t.textContent||'').slice(0,16)});
    });
  });
  return out;
});
console.log('=== viewport',w,'===');
r.forEach(x=>console.log(`  ${String(x.sec).padEnd(10)} ${x.cls.padEnd(24)} decl=${x.declFs.padEnd(7)} scale=${String(x.scale).padEnd(6)} rendered=${String(x.renderedPx).padStart(6)}px boxH=${String(x.boxH).padStart(5)} op=${x.opacity} fill=${x.fill} "${x.txt}"`));
await ctx.close();}
await b.close();
