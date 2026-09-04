import { chromium } from 'playwright';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference',deviceScaleFactor:1});
const p=await ctx.newPage();
await p.goto('https://forgotten-mistory.web.app/',{waitUntil:'networkidle'});
await p.evaluate(async()=>{const H=document.body.scrollHeight;for(let y=0;y<H;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,40));}});
await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{
  const o={};
  // bench wires
  const wires=[...document.querySelectorAll('#skills svg path')];
  o.wires={total:wires.length,gold:wires.filter(w=>(w.getAttribute('stroke')||'').includes('gold')).length,
    grey:wires.filter(w=>(w.getAttribute('stroke')||'').includes('grey')).length};
  // vitrine live links
  o.live=[...document.querySelectorAll('#vitrine a')].filter(a=>getComputedStyle(a).color.match(/2\d\d|1\d\d/)&&/hstgr|abentertainment|forgotten/.test(a.textContent)).map(a=>({
    txt:a.textContent.trim().slice(0,30),color:getComputedStyle(a).color,
    plateLit:a.closest('li')?.hasAttribute('data-lit'),
    plateOpacity:getComputedStyle(a.closest('li')).opacity,
    goldLive:getComputedStyle(a.closest('li')).getPropertyValue('--gold-live')}));
  // experience chart geometry
  const sec=document.querySelector('#experience');
  const header=sec.querySelector('header'); const hR=header.getBoundingClientRect();
  const els=[...sec.querySelectorAll('*')].map(e=>{const r=e.getBoundingClientRect();return {cls:String(e.className.baseVal??e.className).split(' ')[0],tag:e.tagName,l:Math.round(r.left),r:Math.round(r.right),t:Math.round(r.top+scrollY),h:Math.round(r.height),w:Math.round(r.width)};}).filter(e=>e.w>200&&e.h>40);
  o.expHeaderLeft=Math.round(hR.left);
  o.expEls=els.slice(0,26);
  const cvs=sec.querySelector('canvas');
  o.expCanvas=cvs?(()=>{const r=cvs.getBoundingClientRect();return{l:Math.round(r.left),r:Math.round(r.right),t:Math.round(r.top+scrollY),w:Math.round(r.width),h:Math.round(r.height),cssW:getComputedStyle(cvs).width};})():null;
  // right-hand dead space per section: rightmost painted content
  const secs=[...document.querySelectorAll('section[id]')];
  o.dead=secs.map(s=>{
    let maxR=0, minL=1e9;
    s.querySelectorAll('*').forEach(e=>{
      const cs=getComputedStyle(e); if(cs.visibility==='hidden'||cs.display==='none')return;
      const r=e.getBoundingClientRect(); if(r.width<2||r.height<2)return;
      // only count elements with text or a paint
      const hasText=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
      const paints=cs.backgroundColor!=='rgba(0, 0, 0, 0)'||cs.borderTopWidth!=='0px'||['CANVAS','SVG','IMG','TABLE'].includes(e.tagName);
      if(!hasText&&!paints)return;
      maxR=Math.max(maxR,Math.min(r.right,1440)); minL=Math.min(minL,Math.max(r.left,0));
    });
    return {id:s.id,minL:Math.round(minL),maxR:Math.round(maxR),deadRightPct:Math.round((1440-maxR)/1440*1000)/10};
  });
  return o;
});
console.log(JSON.stringify(r,null,1));
await b.close();
