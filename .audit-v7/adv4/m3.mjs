import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import fs from 'fs';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const ctx=await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,reducedMotion:'no-preference'});
const p=await ctx.newPage();
await p.goto('https://forgotten-mistory.web.app/',{waitUntil:'networkidle'});
await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,30));}});
await p.waitForTimeout(2000);
await p.evaluate(()=>{document.querySelector('#skills figure').scrollIntoView({block:'center'});});
await p.waitForTimeout(1200);
const buf=await p.screenshot({path:'/Users/vic/claude/forgotten-mistory/.audit-v7/adv4/skills-1440.png'});
const png=PNG.sync.read(buf);
// sample wire midpoints
const pts=await p.evaluate(()=>{
  const paths=[...document.querySelectorAll('#skills svg path')];
  return paths.map(pa=>{const L=pa.getTotalLength();const m=pa.getPointAtLength(L/2);
    const svg=pa.ownerSVGElement; const r=svg.getBoundingClientRect();
    const vb=svg.viewBox.baseVal;
    const sx=r.width/vb.width, sy=r.height/vb.height;
    return {x:Math.round(r.left+m.x*sx), y:Math.round(r.top+m.y*sy), status:pa.className.baseVal};});
});
const px=(x,y)=>{const i=(png.width*y+x)*4;return [png.data[i],png.data[i+1],png.data[i+2]];};
const lum=(c)=>{const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2]);};
const cr=(a,bb)=>{const l1=lum(a),l2=lum(bb);return ((Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05));};
const rows=[];
for(const pt of pts){
  // sample a small vertical window to find the darkest and brightest and the wire pixel
  let best=null;
  for(let dy=-2;dy<=2;dy++){const c=px(pt.x,pt.y+dy); const s=c[0]+c[1]+c[2]; if(!best||s>best.s) best={c,s,dy};}
  const bg=px(pt.x,pt.y+14);
  rows.push({status:pt.status.includes('production')&&!pt.status.includes('non')?'production':'other',wire:best.c,bg,ratio:+cr(best.c,bg).toFixed(2)});
}
console.log(JSON.stringify(rows,null,0));
const gold=rows.filter(r=>r.status==='production'), grey=rows.filter(r=>r.status!=='production');
console.log('gold wires',gold.length,'min ratio',Math.min(...gold.map(r=>r.ratio)));
console.log('grey wires',grey.length,'ratios',grey.map(r=>r.ratio));
await b.close();
