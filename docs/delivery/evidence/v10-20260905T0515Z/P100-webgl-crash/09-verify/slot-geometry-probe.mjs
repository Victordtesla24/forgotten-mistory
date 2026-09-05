import { chromium } from 'playwright';
const b = await chromium.launch({ channel:'chrome', args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const out = {};
for (const [w,h] of [[1440,900],[390,844]]) {
  const c = await b.newContext({ viewport:{width:w,height:h} });
  const p = await c.newPage();
  await p.goto('http://127.0.0.1:5601/?gl=force', { waitUntil:'load' });
  await p.waitForTimeout(4000);
  await p.evaluate(()=>document.querySelector('#experience').scrollIntoView({behavior:'instant',block:'center'}));
  await p.waitForTimeout(5000);
  out[`${w}x${h}`] = await p.evaluate(()=>{
    const sec = document.querySelector('#experience');
    const slots = Array.from(sec.querySelectorAll(':scope > div[aria-hidden="true"], :scope div[aria-hidden="true"]'));
    const m = window.innerHeight*0.5;
    return {
      canvasesInExperience: sec.querySelectorAll('canvas').length,
      canvasesTotal: document.querySelectorAll('canvas').length,
      sectionRect: (({top,bottom,height})=>({top:Math.round(top),bottom:Math.round(bottom),height:Math.round(height)}))(sec.getBoundingClientRect()),
      innerHeight: window.innerHeight,
      slots: slots.slice(0,8).map(el=>{const r=el.getBoundingClientRect();return {cls:el.className, top:Math.round(r.top), bottom:Math.round(r.bottom), h:Math.round(r.height), within: r.bottom>-m && r.top<window.innerHeight+m, hasCanvas: !!el.querySelector('canvas')};}),
    };
  });
  await c.close();
}
console.log(JSON.stringify(out,null,2));
await b.close();
