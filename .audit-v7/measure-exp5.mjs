import { chromium } from 'playwright';
const browser = await chromium.launch({ headless:true, args:['--use-gl=angle','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist'] });
async function run(label, scroll) {
  const ctx = await browser.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1, reducedMotion:'no-preference' });
  const p = await ctx.newPage(); const m=[];
  p.on('console', e=>m.push(e.text()));
  await p.goto('https://forgotten-mistory.web.app/', {waitUntil:'networkidle', timeout:90000});
  await p.waitForTimeout(4000);
  const before = m.filter(t=>/Context Lost/i.test(t)).length;
  if (scroll) { await p.evaluate(()=>document.querySelector('#experience').scrollIntoView()); await p.waitForTimeout(5000);
                await p.evaluate(()=>document.querySelector('#skills').scrollIntoView()); await p.waitForTimeout(3000); }
  const after = m.filter(t=>/Context Lost/i.test(t)).length;
  console.log(`${label}: contextLost before-scroll=${before} after=${after} total-console=${m.length}`, JSON.stringify(m.slice(0,6)));
  await ctx.close();
}
await run('hero-only', false);
await run('scroll-through-experience', true);
await browser.close();
