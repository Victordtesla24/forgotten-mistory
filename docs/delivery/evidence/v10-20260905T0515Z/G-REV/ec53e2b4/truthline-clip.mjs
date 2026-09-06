import { chromium } from 'playwright';
const b = await chromium.launch({ channel:'chrome', args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
const out=[];
for (const [w,h] of [[1440,900],[390,844]]) {
  const c = await b.newContext({ viewport:{width:w,height:h} });
  const p = await c.newPage();
  await p.goto('https://forgotten-mistory.web.app/', {waitUntil:'load',timeout:90000});
  await p.waitForTimeout(3000);
  await p.evaluate(()=>window.scrollBy(0, Math.round(window.innerHeight*1.3)));
  await p.waitForTimeout(1200);
  await p.getByTestId('minivic-toggle').first().click({timeout:12000});
  await p.waitForTimeout(2000);
  const inp = p.getByTestId('minivic-input');
  await inp.first().fill('In one sentence, what did Vikram do at the ATO?');
  await p.keyboard.press('Enter');
  for (let i=0;i<50;i++){ await p.waitForTimeout(400);
    const t = await p.getByTestId('minivic-synthetic-label').first().innerText();
    if (/VIA /i.test(t)) break; }
  const m = await p.evaluate(()=>{
    const q=(sel)=>{const e=document.querySelector(sel); if(!e) return null; const cs=getComputedStyle(e);
      return {domText:e.innerText, scrollW:e.scrollWidth, clientW:e.clientWidth, clipped:e.scrollWidth>e.clientWidth+1,
              overflow:cs.overflow, textOverflow:cs.textOverflow, whiteSpace:cs.whiteSpace, textTransform:cs.textTransform,
              visibleFraction:+(e.clientWidth/e.scrollWidth).toFixed(3)};};
    return { truthLine:q('[data-testid="minivic-synthetic-label"]'),
             subtitle:q('[data-testid="minivic-panel"] p.truncate') };
  });
  out.push({viewport:`${w}x${h}`, ...m});
  await p.getByTestId('minivic-synthetic-label').first().screenshot({path:`/root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/G-REV/ec53e2b4/15-truthline-${w}.png`}).catch(()=>{});
  await c.close();
}
console.log(JSON.stringify(out,null,2));
await b.close();
