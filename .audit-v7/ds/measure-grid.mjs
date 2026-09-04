import { chromium } from 'playwright';
const URL='https://forgotten-mistory.web.app/';
const b=await chromium.launch();
const out={};
for(const w of [1440,1920,1024]){
 const ctx=await b.newContext({viewport:{width:w,height:900},reducedMotion:'no-preference',deviceScaleFactor:1});
 const p=await ctx.newPage();
 await p.goto(URL,{waitUntil:'networkidle'});
 await p.evaluate(async()=>{const H=document.body.scrollHeight;for(let y=0;y<H;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,30));}window.scrollTo(0,0);});
 await p.waitForTimeout(1500);
 out[w]=await p.evaluate(()=>{
  const secs=[...document.querySelectorAll('section[id]')];
  const rows=[];
  for(const s of secs){
    const sr=s.getBoundingClientRect();
    const off=window.scrollY;
    // heading
    const h=s.querySelector('h2,h1');
    const lede=s.querySelector('h2 ~ p, h1 ~ p');
    // direct significant children
    const kids=[...s.querySelectorAll(':scope > *, :scope > * > *')].filter(e=>{
      const r=e.getBoundingClientRect(); return r.width>100&&r.height>20;
    });
    const lefts={};
    kids.forEach(e=>{const r=e.getBoundingClientRect();const L=Math.round(r.left);const R=Math.round(r.right);
      const k=`${L}|${R}`;lefts[k]=lefts[k]||{L,R,n:0,tags:[]};lefts[k].n++;if(lefts[k].tags.length<3)lefts[k].tags.push(e.tagName+'.'+String(e.className).split(' ')[0].slice(0,26));});
    // artefacts
    const arts=[...s.querySelectorAll('canvas,svg,figure,table')].map(e=>{const r=e.getBoundingClientRect();
      return {tag:e.tagName,cls:String(e.className.baseVal??e.className).split(' ')[0].slice(0,28),left:Math.round(r.left),right:Math.round(r.right),w:Math.round(r.width),h:Math.round(r.height)};}).filter(a=>a.w>80);
    rows.push({id:s.id, secLeft:Math.round(sr.left), secRight:Math.round(sr.right),
      h2:h?{left:Math.round(h.getBoundingClientRect().left),right:Math.round(h.getBoundingClientRect().right)}:null,
      cols:Object.values(lefts).sort((a,b)=>b.n-a.n).slice(0,8),
      arts});
  }
  // gold marks visible: compute all elements whose computed color/background/border is goldish
  function goldish(c){const m=c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);if(!m)return null;
    const [r,g,bl]=[+m[1],+m[2],+m[3]];const a=m[4]===undefined?1:+m[4];if(a<0.15)return null;
    const mx=Math.max(r,g,bl),mn=Math.min(r,g,bl);if(mx===0)return null;const sat=(mx-mn)/mx;
    if(sat<0.25)return null; if(!(r>=g&&g>bl))return null; return {rgb:[r,g,bl],a,sat};}
  const gold=[];
  document.querySelectorAll('*').forEach(e=>{
    const cs=getComputedStyle(e); const r=e.getBoundingClientRect();
    if(r.width===0&&r.height===0)return;
    if(cs.visibility==='hidden'||cs.display==='none')return;
    for(const prop of ['color','backgroundColor','borderTopColor','borderBottomColor','borderLeftColor','fill','stroke','outlineColor']){
      const v=cs[prop]; if(!v)continue; const g=goldish(v);
      if(g){ // color only counts if element has own text
        if(prop==='color'){const t=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join('');if(!t)continue;}
        gold.push({sec:e.closest('section')?.id||'chrome',tag:e.tagName,cls:String(e.className.baseVal??e.className).split(' ')[0].slice(0,26),prop,v,
          top:Math.round(r.top+window.scrollY),w:Math.round(r.width),h:Math.round(r.height),txt:(e.textContent||'').trim().slice(0,26)});
        break;}
    }
  });
  return {rows,gold,docH:document.documentElement.scrollHeight,secTops:[...document.querySelectorAll('section[id]')].map(s=>({id:s.id,top:Math.round(s.getBoundingClientRect().top+window.scrollY),h:Math.round(s.getBoundingClientRect().height)}))};
 });
 await ctx.close();
}
await b.close();
console.log(JSON.stringify(out));
