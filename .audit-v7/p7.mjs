import { chromium } from 'playwright';
const browser = await chromium.launch({ args:['--use-gl=angle','--ignore-gpu-blocklist'] });
async function run(label, opts, url='https://forgotten-mistory.web.app/?gl=force'){
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const logs=[]; page.on('console',m=>logs.push(m.text()));
  await page.goto(url,{waitUntil:'load'});
  await page.waitForTimeout(2500);
  const h = await page.evaluate(()=>document.documentElement.scrollHeight);
  for(let y=0;y<h;y+=700){ await page.evaluate(v=>scrollTo(0,v),y); await page.waitForTimeout(70);} 
  await page.evaluate(()=>scrollTo(0,0)); await page.waitForTimeout(1200);
  const d = await page.evaluate(()=>({
    canvases: document.querySelectorAll('canvas').length,
    svgs: document.querySelectorAll('svg').length,
    anims: document.getAnimations().length,
    docH: document.documentElement.scrollHeight,
    sections: [...document.querySelectorAll('main section[id]')].map(s=>({id:s.id, h:Math.round(s.getBoundingClientRect().height)})),
    heroName: document.querySelector('h1')?.textContent?.slice(0,30),
    heroNameOpacity: document.querySelector('h1')?getComputedStyle(document.querySelector('h1')).opacity:null,
    minivic: !!document.querySelector('[aria-label*="Mini Vic"]'),
    progressBar: (()=>{const p=document.querySelector('[data-scroll-progress]'); return p?getComputedStyle(p).transform:null;})(),
  }));
  console.log(`\n===== ${label} =====`);
  console.log(JSON.stringify(d,null,1));
  console.log('console:', JSON.stringify(logs));
  await ctx.close();
}
await run('A. desktop 1440 rm=reduce (GPU on, ?gl=force)', {viewport:{width:1440,height:900}, reducedMotion:'reduce'});
await run('B. mobile 390x844 rm=no-preference', {viewport:{width:390,height:844}, reducedMotion:'no-preference', isMobile:true, hasTouch:true, deviceScaleFactor:3});
await run('C. desktop 1440 JS DISABLED', {viewport:{width:1440,height:900}, reducedMotion:'no-preference', javaScriptEnabled:false});
await run('D. desktop 1440 NO gl=force (software raster path)', {viewport:{width:1440,height:900}, reducedMotion:'no-preference'}, 'https://forgotten-mistory.web.app/');
await browser.close();
