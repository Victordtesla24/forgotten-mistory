import { chromium } from 'playwright';
const RM = process.argv[2] || 'no-preference';
const browser = await chromium.launch({ args:['--use-gl=angle','--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport:{width:1440,height:900}, reducedMotion:RM });
const page = await ctx.newPage();
await page.goto('https://forgotten-mistory.web.app/?gl=force',{waitUntil:'load'});
await page.waitForTimeout(1500);
for (const id of ['about','experience','skills','vitrine','listen']) {
  await page.evaluate(s=>document.getElementById(s)?.scrollIntoView({block:'start'}), id);
  await page.waitForTimeout(1400);
  const a = await page.evaluate(() => document.getAnimations().map(x=>{
    const t=x.effect?.getTiming?.()||{}; const el=x.effect?.target;
    return `${x.animationName||x.transitionProperty} d=${t.duration} st=${x.playState} @${el?el.tagName.toLowerCase()+'.'+String(el.className||'').slice(0,28):'?'}`;
  }));
  console.log(`\n#${id}: ${a.length} anims`);
  // only show ones not already seen at hero
  a.filter(s=>!/heroRise|ping|cardSettle|ruleDraw/.test(s)).forEach(s=>console.log('   NEW ', s));
  const counts = {};
  a.forEach(s=>{const k=s.split(' ')[0]; counts[k]=(counts[k]||0)+1;});
  console.log('   tally', JSON.stringify(counts));
}
// vitrine rail scroll ergonomics
await page.evaluate(()=>document.getElementById('vitrine')?.scrollIntoView());
await page.waitForTimeout(800);
const rail = await page.evaluate(()=>{
  const el = document.querySelector('#vitrine ul, #vitrine [class*=rail], #vitrine [class*=track]');
  if(!el) return null;
  const cs=getComputedStyle(el);
  return { cls: el.className, overflowX: cs.overflowX, scrollbarWidth: cs.scrollbarWidth, scrollSnapType: cs.scrollSnapType,
    scrollW: el.scrollWidth, clientW: el.clientWidth, hasNativeBar: el.offsetHeight-el.clientHeight,
    tabIndex: el.getAttribute('tabindex'), role: el.getAttribute('role'), ariaLabel: el.getAttribute('aria-label') };
});
console.log('\nVITRINE RAIL:', JSON.stringify(rail,null,1));
const plate = await page.evaluate(()=>{
  return [...document.querySelectorAll('#vitrine li')].map(li=>{
    const cs=getComputedStyle(li);
    const body=li.querySelector('p');
    return { idx: li.textContent.slice(0,2), opacity: cs.opacity, tabindex: li.getAttribute('tabindex'), role: li.getAttribute('role'),
      ariaLabel: li.getAttribute('aria-label'), bodyColor: body?getComputedStyle(body).color:null, transform: cs.transform };
  });
});
console.log('PLATES:', JSON.stringify(plate,null,1));
await browser.close();
