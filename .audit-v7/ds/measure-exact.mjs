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
    const res=[];
    document.querySelectorAll('p,li,blockquote,dd,figcaption').forEach(el=>{
      if(el.querySelector('p,li,blockquote,dd,figcaption,ul,ol,dl,table')) return;
      const cs=getComputedStyle(el);
      if(cs.display==='none'||cs.visibility==='hidden') return;
      // gather text nodes
      const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
      const nodes=[];let n;while((n=walker.nextNode()))nodes.push(n);
      const full=nodes.map(x=>x.textContent).join('');
      if(full.replace(/\s+/g,' ').trim().length<90) return;
      // find line breaks via per-character rects
      const r=new Range();
      let lineTops=[],perLine=[],cur=0,curTop=null;
      for(const node of nodes){
        for(let i=0;i<node.textContent.length;i++){
          r.setStart(node,i);r.setEnd(node,i+1);
          const rect=r.getBoundingClientRect();
          if(rect.width===0&&rect.height===0)continue;
          const t=Math.round(rect.top);
          if(curTop===null){curTop=t;cur=0;}
          else if(Math.abs(t-curTop)>3){perLine.push(cur);lineTops.push(curTop);curTop=t;cur=0;}
          cur++;
        }
      }
      if(curTop!==null){perLine.push(cur);lineTops.push(curTop);}
      if(perLine.length<2) return;
      const fullLines=perLine.slice(0,-1); // drop last (partial)
      const avg=fullLines.reduce((a,b)=>a+b,0)/fullLines.length;
      res.push({sec:el.closest('section')?.id||(el.closest('footer')?'footer':'?'),tag:el.tagName,
        fs:cs.fontSize, lines:perLine.length, perLine,
        cpl:Math.round(avg*10)/10, min:Math.min(...fullLines), max:Math.max(...fullLines),
        snip:full.replace(/\s+/g,' ').trim().slice(0,44)});
    });
    return res;
  });
  await ctx.close();
}
await b.close();
console.log(JSON.stringify(out));
