import { chromium } from 'playwright'; import fs from 'node:fs';
const b = await chromium.launch({ headless:true, executablePath:'/usr/bin/google-chrome-stable',
  args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
const out=[];
for (const [w,h,gl] of [[1440,900,true],[1440,900,false],[390,844,true],[390,844,false]]) {
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1}); const p=await ctx.newPage();
  await p.goto('https://forgotten-mistory.web.app/'+(gl?'?gl=force':''),{waitUntil:'networkidle',timeout:90000});
  await p.waitForTimeout(2000);
  await p.evaluate(()=>{const hh=document.querySelector('#hero');window.scrollTo(0,(hh?hh.getBoundingClientRect().height:innerHeight)+400);});
  const series=[];
  for (let i=0;i<8;i++){ await p.waitForTimeout(1000);
    series.push(await p.evaluate(()=>{const d=document.querySelector('.minivic-dock');return d?+getComputedStyle(d).opacity:null;})); }
  const pill=await p.evaluate(()=>{const e=document.querySelector('[data-testid="minivic-launcher-label"]');const cs=getComputedStyle(e);const r=e.getBoundingClientRect();
    return {text:e.textContent.trim(),computedDisplay:cs.display,visibility:cs.visibility,opacity:cs.opacity,w:Math.round(r.width),h:Math.round(r.height),parentDisplay:getComputedStyle(e.parentElement).display};});
  out.push({viewport:`${w}x${h}`,gl,opacitySeries:series,finalOpacity:series[series.length-1],pill});
  await ctx.close(); console.error(`${w}x${h} gl=${gl}`, series.join(','));
}
await b.close(); fs.writeFileSync('dock-opacity.json',JSON.stringify(out,null,2)); console.log(JSON.stringify(out,null,2));
