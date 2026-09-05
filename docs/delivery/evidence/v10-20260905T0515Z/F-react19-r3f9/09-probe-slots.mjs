import { chromium } from 'playwright';
const BASE='http://127.0.0.1:5603';
const ARGS=['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'];
const SLOTS={hero:'#hero canvas, [class*="heroScene"], [class*="Hero_"][class*="scene"]',about:'[class*="fieldSlot"]',experience:'[class*="chartScene"]'};
async function run(width,height,query){
  const b=await chromium.launch({channel:'chrome',args:ARGS});
  const ctx=await b.newContext({viewport:{width,height},deviceScaleFactor:1});
  const p=await ctx.newPage();
  const pe=[],ce=[];
  p.on('pageerror',e=>pe.push(String(e.message||e)));
  p.on('console',m=>{if(m.type()==='error')ce.push(m.text());});
  await p.goto(BASE+query,{waitUntil:'domcontentloaded'});
  await p.waitForLoadState('networkidle').catch(()=>{});
  await p.waitForTimeout(3500);
  const out={viewport:`${width}x${height}`,query:query||'(none)'};
  out.heroCanvases=await p.locator('#hero canvas').count();
  for(const id of ['about','experience']){
    const slot=p.locator(SLOTS[id]).first();
    const slotExists=await slot.count();
    let afterSlotScroll=null,box=null;
    if(slotExists){
      await slot.scrollIntoViewIfNeeded().catch(()=>{});
      await p.waitForTimeout(3000);
      afterSlotScroll=await p.locator(`#${id} canvas`).count();
      box=await slot.boundingBox();
    }
    out[id]={slotExists,canvasesInSection:afterSlotScroll,slotBox:box?{w:Math.round(box.width),h:Math.round(box.height)}:null};
  }
  out.errorShell=await p.getByText('Something went wrong').count()>0;
  out.pageErrors=pe;out.consoleErrors=ce;
  await b.close();
  return out;
}
const r={loadavg:(await import('node:fs')).readFileSync('/proc/loadavg','utf8').trim(),
 force1440:await run(1440,900,'/?gl=force'),
 force390:await run(390,844,'/?gl=force')};
console.log(JSON.stringify(r,null,2));
