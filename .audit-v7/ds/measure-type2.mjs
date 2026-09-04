import { chromium } from 'playwright';
const URL='https://forgotten-mistory.web.app/';
const WIDTHS=[390,768,1024,1440,1920];
const b=await chromium.launch();
const out={};
for(const w of WIDTHS){
  const ctx=await b.newContext({viewport:{width:w,height:w<500?844:900},reducedMotion:'no-preference',deviceScaleFactor:1});
  const p=await ctx.newPage();
  await p.goto(URL,{waitUntil:'networkidle'});
  await p.evaluate(async()=>{const H=document.body.scrollHeight;for(let y=0;y<H;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,25));}window.scrollTo(0,0);});
  await p.waitForTimeout(1000);
  out[w]=await p.evaluate(()=>{
    const m=document.createElement('canvas').getContext('2d');
    const res=[];
    document.querySelectorAll('p,li,blockquote,dd,figcaption').forEach(el=>{
      // leaf prose only: no child element that itself is a prose tag
      if(el.querySelector('p,li,blockquote,dd,figcaption,ul,ol,dl,table')) return;
      const txt=(el.innerText||'').replace(/\s+/g,' ').trim();
      if(txt.length<90) return;
      const cs=getComputedStyle(el);
      if(cs.display==='none'||cs.visibility==='hidden'||parseFloat(cs.opacity)<0.1) return;
      const r=el.getBoundingClientRect(); if(r.width<40) return;
      const cw=r.width-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
      m.font=`${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const avg=m.measureText(txt).width/txt.length;
      const lines=Math.round(r.height/parseFloat(cs.lineHeight));
      res.push({sec:el.closest('section')?.id||(el.closest('footer')?'footer':'?'),tag:el.tagName,
        w:Math.round(cw),fs:cs.fontSize,maxW:cs.maxWidth,lines,
        cpl:Math.round(cw/avg*10)/10, actualCpl: lines>1? Math.round(txt.length/lines*10)/10 : txt.length,
        snip:txt.slice(0,50)});
    });
    return res;
  });
  await ctx.close();
}
await b.close();
console.log(JSON.stringify(out));
