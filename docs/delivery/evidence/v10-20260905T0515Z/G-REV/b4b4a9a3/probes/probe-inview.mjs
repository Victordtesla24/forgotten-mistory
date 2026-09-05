import { chromium } from '/root/forgotten-mistory/node_modules/playwright/index.mjs';
import { writeFileSync } from 'node:fs';
const OUT='/root/.claude/jobs/4e543924/tmp';
const b = await chromium.launch({channel:'chrome',args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const ctx = await b.newContext({viewport:{width:1440,height:900}});
const p = await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto('https://forgotten-mistory.web.app/?gl=force',{waitUntil:'networkidle',timeout:60000});
const res={buildCommit:await p.locator('meta[name="build-commit"]').getAttribute('content'),sections:{}};
for (const id of ['hero','about','experience','skills','vitrine','listen']) {
  await p.locator('#'+id).scrollIntoViewIfNeeded({timeout:20000});
  await p.waitForTimeout(3500);
  res.sections[id] = await p.evaluate((sid)=>{
    const s=document.querySelector('#'+sid);
    const cs=Array.from(s.querySelectorAll('canvas'));
    return {canvases:cs.length, sizes:cs.map(c=>({w:c.width,h:c.height,cw:c.clientWidth,ch:c.clientHeight})),
            svg:s.querySelectorAll('svg').length, video:s.querySelectorAll('video').length,
            pageWideCanvases:document.querySelectorAll('canvas').length};
  }, id);
  await p.screenshot({path:`${OUT}/section-${id}-1440.png`});
}
res.pageErrors=errs;
writeFileSync(`${OUT}/probe-inview.json`,JSON.stringify(res,null,2));
console.log('buildCommit:',res.buildCommit);
for(const [k,v] of Object.entries(res.sections)) console.log(`  ${k.padEnd(11)} canvasInSection=${v.canvases} svg=${v.svg} video=${v.video} pageWide=${v.pageWideCanvases} sizes=${JSON.stringify(v.sizes)}`);
console.log('pageErrors:',JSON.stringify(errs));
await ctx.close(); await b.close();
