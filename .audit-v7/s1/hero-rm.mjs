import { chromium } from 'playwright';
const browser = await chromium.launch({ headless:true, args:['--use-gl=angle','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist'] });
const OUT='/Users/vic/claude/forgotten-mistory/.audit-v7/s1';
for (const [tag,rm,url] of [['rm','reduce','https://forgotten-mistory.web.app/'],['nopref-nogl','no-preference','https://forgotten-mistory.web.app/']]) {
  const ctx=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,reducedMotion:rm});
  const p=await ctx.newPage();
  await p.goto(url,{waitUntil:'networkidle',timeout:90000});
  await p.waitForTimeout(3500);
  const n=await p.evaluate(()=>document.querySelectorAll('#hero canvas').length);
  console.log(tag,'canvases',n);
  await p.screenshot({path:`${OUT}/hero-1440-${tag}.png`});
  await ctx.close();
}
await browser.close();
