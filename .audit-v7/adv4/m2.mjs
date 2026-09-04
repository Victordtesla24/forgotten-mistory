import { chromium } from 'playwright';
const URL='https://forgotten-mistory.web.app/';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
for(const vp of [[1440,900],[1920,1080],[1280,720],[768,1024],[390,844]]){
const ctx=await b.newContext({viewport:{width:vp[0],height:vp[1]},deviceScaleFactor:1,reducedMotion:'no-preference'});
const p=await ctx.newPage();
await p.goto(URL,{waitUntil:'networkidle'});
await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,30));}});
await p.waitForTimeout(2000);
const res=await p.evaluate(()=>{
  const GOLD=['rgb(201, 168, 76)','rgb(212, 182, 92)'];
  const s=document.querySelector('#skills');
  const r=s.getBoundingClientRect(); const top=window.scrollY+r.top, h=r.height;
  const props=['color','backgroundColor','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','outlineColor','fill','stroke','textDecorationColor','boxShadow'];
  const isGoldPaint=(el)=>{
    const cs=getComputedStyle(el);
    // svg gold gradient counts as a gold paint
    if((cs.stroke||'').includes('bench-wire-gold')||(cs.fill||'').includes('bench-wire-gold')) return 'wire-gold';
    for(const pr of props){const v=cs[pr]; if(!v) continue;
      if(GOLD.some(g=>v.includes(g))){
        // ignore inherited `color` when element paints no text of its own
        if(pr==='color'){ const hasText=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()); if(!hasText) continue; }
        return pr;}}
    return null;
  };
  const out=[];
  for(let i=0;i<5;i++){
    const y=top+(h*i/4)-window.innerHeight*0.25;
    window.scrollTo(0,y);
    let n=0; const d={};
    for(const el of s.querySelectorAll('*')){
      const bb=el.getBoundingClientRect();
      if(bb.bottom<0||bb.top>window.innerHeight) continue;
      const g=isGoldPaint(el);
      if(g){n++; const k=g+'|'+(el.tagName); d[k]=(d[k]||0)+1;}
    }
    out.push({step:i,marks:n,d});
  }
  // whole section totals
  let tot=0; const td={};
  for(const el of s.querySelectorAll('*')){const g=isGoldPaint(el); if(g){tot++; const k=g+'|'+el.tagName; td[k]=(td[k]||0)+1;}}
  return {vp:[innerWidth,innerHeight],sectionH:Math.round(h),perView:out,total:tot,totalDetail:td,
    svgDisplay:(()=>{const sv=s.querySelector('svg');return sv?getComputedStyle(sv).display:'none';})(),
    wires:s.querySelectorAll('svg path').length};
});
console.log(JSON.stringify(res));
await ctx.close();
}
await b.close();
