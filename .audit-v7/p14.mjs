import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const dir='/Users/vic/claude/forgotten-mistory/.audit-v7/shots-firstpaint'; mkdirSync(dir,{recursive:true});
const browser = await chromium.launch({ args:['--use-gl=angle','--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({viewport:{width:1440,height:900}, reducedMotion:'no-preference'});
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions',{offline:false, latency:150, downloadThroughput:1.6*1024*1024/8, uploadThroughput:750*1024/8});
await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
const p = page.goto('https://forgotten-mistory.web.app/?gl=force',{waitUntil:'commit', timeout:120000});
await p;
const t0=Date.now();
for (const t of [600,900,1200,1500,1800,2400,3200]) {
  const w = t-(Date.now()-t0); if(w>0) await page.waitForTimeout(w);
  const o = await page.evaluate(()=>{const h=document.querySelector('h1'); if(!h) return null; const cs=getComputedStyle(h); return {op:cs.opacity, tr:cs.transform};}).catch(()=>null);
  await page.screenshot({path:`${dir}/t${t}.png`, clip:{x:0,y:0,width:1440,height:520}});
  console.log(`t=${t}ms h1 opacity=${o?o.op:'?'} transform=${o?o.tr:'?'}`);
}
await browser.close();
