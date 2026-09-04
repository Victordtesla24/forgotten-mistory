import { chromium } from 'playwright';
const URL='https://forgotten-mistory.web.app/';
const GOLDS=new Set(['rgb(201, 168, 76)','rgb(212, 182, 92)']);
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']});
const ctx=await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,reducedMotion:'no-preference'});
const p=await ctx.newPage();
await p.goto(URL,{waitUntil:'networkidle'});
await p.waitForTimeout(2500);
// scroll through whole page slowly to trigger observers
await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,40));}});
await p.waitForTimeout(2500);
const out=await p.evaluate(()=>{
  const s=document.querySelector('#skills');
  const svg=s.querySelector('svg');
  const paths=[...s.querySelectorAll('svg path')];
  const geo=paths.map(pa=>{const d=pa.getAttribute('d');const m=/M ([\d.-]+) ([\d.-]+) C .*?, ([\d.-]+) ([\d.-]+)$/.exec(d);return{d,len:pa.getTotalLength(),stroke:getComputedStyle(pa).stroke,so:getComputedStyle(pa).strokeOpacity};});
  const xs=paths.map(pa=>{const n=pa.getAttribute('d').match(/[-\d.]+/g).map(Number);return[n[0],n[n.length-2]];});
  return {
    svgViewBox: svg?.getAttribute('viewBox'),
    svgDisplay: svg?getComputedStyle(svg).display:null,
    pathCount:paths.length,
    startXs:[...new Set(xs.map(v=>v[0]))],
    endXs:[...new Set(xs.map(v=>v[1]))],
    lens:geo.map(g=>+g.len.toFixed(1)),
    strokes:[...new Set(geo.map(g=>g.stroke))],
    anchors:s.querySelectorAll('a[href]').length,
    anchorHrefs:[...s.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')),
    tableRows:s.querySelectorAll('tbody tr').length,
    nodeButtons:s.querySelectorAll('button').length,
    dates:(s.innerText.match(/\b(19|20)\d\d\b/g)||[]),
    figureAria:(()=>{const f=s.querySelector('figure');return f?{role:f.getAttribute('role'),label:f.getAttribute('aria-label'),by:f.getAttribute('aria-labelledby'),desc:f.getAttribute('aria-describedby')}:null;})(),
    svgAria:svg?{hidden:svg.getAttribute('aria-hidden'),role:svg.getAttribute('role')}:null,
    caption:s.querySelector('figcaption')?.textContent.trim(),
    readout:s.querySelector('figure > p')?.textContent.trim(),
    progressbars:s.querySelectorAll('progress,meter,[role=progressbar],[role=meter]').length,
    caliperStates:[...new Set([...s.querySelectorAll('[data-state]')].map(e=>e.getAttribute('data-state')))],
    sourcedCount:s.querySelectorAll('[data-state="sourced"]').length,
    h3:s.querySelectorAll('h3').length,
    sectionHeight:s.getBoundingClientRect().height,
    focusables:s.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])').length,
  };
});
console.log(JSON.stringify(out,null,1));
// gold painted marks per viewport, scanning
const goldScan=await p.evaluate((golds)=>{
  const s=document.querySelector('#skills');
  const r=s.getBoundingClientRect();
  const top=window.scrollY+r.top, h=r.height;
  const props=['color','backgroundColor','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','outlineColor','fill','stroke','textDecorationColor','boxShadow','columnRuleColor','caretColor'];
  const res=[];
  for(let i=0;i<5;i++){
    const y=top+ (h*i/4) - 100;
    window.scrollTo(0,y);
    let n=0; const detail={};
    for(const el of s.querySelectorAll('*')){
      const b=el.getBoundingClientRect();
      if(b.bottom<0||b.top>window.innerHeight||b.width===0&&b.height===0) continue;
      for(const pseudo of [null,'::before','::after']){
        const cs=getComputedStyle(el,pseudo);
        let hit=false;
        for(const pr of props){const v=cs[pr];if(!v)continue;if(golds.some(g=>v.includes(g))){hit=true;detail[pr+':'+(el.className&&el.className.baseVal!==undefined?el.className.baseVal:el.className||el.tagName)]=(detail[pr+':'+(el.className&&el.className.baseVal!==undefined?el.className.baseVal:el.className||el.tagName)]||0)+1;break;}}
        if(hit)n++;
      }
    }
    res.push({step:i,scrollY:Math.round(y),marks:n,detail});
  }
  return res;
},[...GOLDS]);
console.log(JSON.stringify(goldScan,null,1));
await b.close();
