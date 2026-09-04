import { chromium } from 'playwright';
const browser = await chromium.launch({ args:['--use-gl=angle','--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport:{width:1440,height:900}, reducedMotion:'no-preference' });
const page = await ctx.newPage();
const logs=[]; page.on('console',m=>logs.push(m.text()));
await page.goto('https://forgotten-mistory.web.app/?gl=force',{waitUntil:'load'});
await page.waitForTimeout(3500);
const mark = async (label)=>{ console.log(label, '| canvases:', await page.evaluate(()=>document.querySelectorAll('canvas').length), '| lostLogs:', logs.filter(l=>/Context Lost/.test(l)).length); };
await mark('at rest (hero)');
for (const id of ['about','experience','skills','vitrine','listen']) {
  await page.evaluate(s=>document.getElementById(s)?.scrollIntoView(), id);
  await page.waitForTimeout(2500);
  await mark(`after scroll to #${id}`);
}
await page.evaluate(()=>scrollTo(0,0)); await page.waitForTimeout(2500);
await mark('back at hero');
console.log('ALL LOGS:', JSON.stringify(logs,null,1));
await browser.close();
