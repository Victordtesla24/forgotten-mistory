import { chromium } from 'playwright';
const browser = await chromium.launch({ args:['--use-gl=angle','--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({viewport:{width:1440,height:900}, reducedMotion:'no-preference'});
const page = await ctx.newPage();
await page.goto('https://forgotten-mistory.web.app/?gl=force',{waitUntil:'load'});
await page.waitForTimeout(2500);
const h=await page.evaluate(()=>document.documentElement.scrollHeight);
for(let y=0;y<h;y+=700){await page.evaluate(v=>scrollTo(0,v),y); await page.waitForTimeout(60);} 
await page.evaluate(()=>scrollTo(0,0)); await page.waitForTimeout(1000);
for (const [label,sel] of [['hero primary','[class*=Hero_primaryAction]'],['listen channel','[class*=Listen_channel]'],['skills filter','[class*=Skills_filter]'],['exp trackButton bar','[class*=Experience_trackButton]']]){
  await page.evaluate(s=>document.querySelector(s).scrollIntoView({block:'center'}), sel);
  await page.waitForTimeout(400);
  const box = await page.evaluate(s=>{const r=document.querySelector(s).getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2};}, sel);
  await page.mouse.move(box.x, box.y); await page.waitForTimeout(600);
  const r = await page.evaluate(s=>{const e=document.querySelector(s); const cs=getComputedStyle(e); const af=getComputedStyle(e,'::after'); const bf=getComputedStyle(e,'::before');
    const child = e.querySelector('[class*=trackBar]'); const cb = child?getComputedStyle(child,'::before'):null;
    return {hover:e.matches(':hover'), color:cs.color, bg:cs.backgroundColor, border:cs.borderColor, afterTransform:af.transform, beforeTransform:bf.transform, childBeforeTransform: cb?cb.transform+' bg='+cb.backgroundColor:null};}, sel);
  console.log(label, JSON.stringify(r));
  await page.mouse.move(5,5); await page.waitForTimeout(400);
  const r2 = await page.evaluate(s=>{const e=document.querySelector(s); const cs=getComputedStyle(e); const af=getComputedStyle(e,'::after');
    const child=e.querySelector('[class*=trackBar]'); const cb=child?getComputedStyle(child,'::before'):null;
    return {hover:e.matches(':hover'), color:cs.color, bg:cs.backgroundColor, afterTransform:af.transform, childBeforeTransform: cb?cb.transform+' bg='+cb.backgroundColor:null};}, sel);
  console.log('  rest ', JSON.stringify(r2));
}
await browser.close();
