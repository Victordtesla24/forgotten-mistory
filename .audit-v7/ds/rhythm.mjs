import { chromium } from 'playwright';
const b=await chromium.launch();
const out={};
for(const w of [1440,390]){
const ctx=await b.newContext({viewport:{width:w,height:w<500?844:900},reducedMotion:'no-preference',deviceScaleFactor:1});
const p=await ctx.newPage();
await p.goto('https://forgotten-mistory.web.app/',{waitUntil:'networkidle'});
await p.evaluate(async()=>{const H=document.body.scrollHeight;for(let y=0;y<H;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,30));}window.scrollTo(0,0);});
await p.waitForTimeout(1200);
out[w]=await p.evaluate(()=>{
 const R=e=>{const r=e.getBoundingClientRect();return{t:Math.round(r.top+scrollY),b:Math.round(r.bottom+scrollY),l:Math.round(r.left),r:Math.round(r.right)};};
 return [...document.querySelectorAll('section[id]')].map(s=>{
  const sr=R(s), cs=getComputedStyle(s);
  const kicker=s.querySelector('p,span'); const h=s.querySelector('h1,h2');
  const lede=h?h.parentElement.querySelector('p:last-of-type'):null;
  // first artefact = first svg/canvas/table/ol/figure after the header
  const art=s.querySelector('figure,canvas,svg,table,ol:not(nav ol)');
  return {id:s.id, padT:cs.paddingTop, padB:cs.paddingBottom, sec:sr,
    h:h?R(h):null, lede:lede?R(lede):null, art:art?{tag:art.tagName,...R(art)}:null,
    gapHeadToArt: (art&&lede)? R(art).t - R(lede).b : null,
    gapSecTopToH: h? R(h).t - sr.t : null};
 });
});
await ctx.close();}
await b.close();
console.log(JSON.stringify(out,null,1));
