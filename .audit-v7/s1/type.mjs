import { chromium } from 'playwright';
const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
for (const [w,h] of [[1440,900],[1920,1080],[1280,720],[768,1024],[390,844]]) {
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,reducedMotion:'no-preference'});
  const p=await ctx.newPage();
  await p.goto('https://forgotten-mistory.web.app/',{waitUntil:'networkidle',timeout:90000});
  await p.waitForTimeout(2500);
  const d=await p.evaluate(()=>{
    // measure chars-per-line via Range rects
    function lines(el){
      const r=document.createRange(); r.selectNodeContents(el);
      const rects=[...r.getClientRects()].filter(x=>x.width>1);
      // char width estimate: use text length / rect widths proportion
      const txt=el.textContent;
      const total=rects.reduce((a,x)=>a+x.width,0);
      const cpp=txt.length/total; // chars per px
      return rects.map(x=>({w:+x.width.toFixed(1),chars:Math.round(x.width*cpp)}));
    }
    const st=document.querySelector('#hero p:nth-of-type(3)');
    const stmt=[...document.querySelectorAll('#hero p')].find(x=>x.textContent.startsWith('Sixteen'));
    const grad=[...document.querySelectorAll('#hero p')].find(x=>x.textContent.startsWith('◐'));
    const src=document.querySelector('#hero li span:last-child');
    const cs=e=>getComputedStyle(e);
    return {
      statement:{fs:cs(stmt).fontSize, maxW:cs(stmt).maxWidth, lines:lines(stmt), len:stmt.textContent.length},
      grading:{fs:cs(grad).fontSize, color:cs(grad).color, lines:lines(grad), len:grad.textContent.length},
      role:{fs:cs(document.querySelector('#hero p:nth-of-type(2)')).fontSize},
      tokens:(()=>{const r=getComputedStyle(document.documentElement);const o={};
        ['--space-1','--space-2','--space-3','--space-4','--space-5','--space-6','--space-8','--measure-read','--gold','--mist-400','--nav-height','--stagger','--motion-cine'].forEach(k=>o[k]=r.getPropertyValue(k).trim());return o;})(),
      gaps:(()=>{const g=(a,b)=>+(b.getBoundingClientRect().top-a.getBoundingClientRect().bottom).toFixed(1);
        const ps=[...document.querySelectorAll('#hero > div > *')];
        return ps.slice(0,-1).map((e,i)=>({from:e.tagName+':'+e.textContent.trim().slice(0,14),gap:g(e,ps[i+1])}));})()
    };
  });
  console.log('===',w+'x'+h); console.log(JSON.stringify(d,null,1));
  await ctx.close();
}
await b.close();
