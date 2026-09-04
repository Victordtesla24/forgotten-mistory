import { chromium } from 'playwright';
const RM = process.argv[2] || 'no-preference';
const W = +(process.argv[3]||1440), H=+(process.argv[4]||900);
const browser = await chromium.launch({ args:['--use-gl=angle','--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport:{width:W,height:H}, reducedMotion:RM });
const page = await ctx.newPage();
await page.goto('https://forgotten-mistory.web.app/?gl=force',{waitUntil:'load'});
const snap = async (label) => {
  const anims = await page.evaluate(() => document.getAnimations().map(a => {
    const t = a.effect?.getTiming?.() || {};
    const el = a.effect?.target;
    return {
      name: a.animationName || a.transitionProperty || '(unknown)',
      dur: t.duration, delay: t.delay, easing: t.easing, iters: t.iterations,
      target: el ? (el.tagName?.toLowerCase()+'.'+String(el.className||'').slice(0,40)) : 'n/a',
      playState: a.playState,
      props: a.effect?.getKeyframes ? [...new Set(a.effect.getKeyframes().flatMap(k=>Object.keys(k)))].filter(k=>!['offset','computedOffset','easing','composite'].includes(k)) : [],
    };
  }));
  console.log(`\n### ${label} — ${anims.length} running animations`);
  anims.forEach(a=>console.log(`  ${a.name} dur=${a.dur} delay=${a.delay} ease=${a.easing} iters=${a.iters} props=[${a.props}] state=${a.playState} on ${a.target}`));
};
await snap('t=0 immediately after load');
await page.waitForTimeout(3000);
await snap('t=3s (settled)');
await page.evaluate(()=>document.getElementById('listen')?.scrollIntoView());
await page.waitForTimeout(2000);
await snap('at #listen');
// probe minivic launcher
const mv = await page.evaluate(()=>{
  const b=[...document.querySelectorAll('button')].find(x=>/Mini Vic/i.test(x.getAttribute('aria-label')||''));
  if(!b) return null;
  const ping=b.querySelector('.animate-ping');
  const cs=getComputedStyle(b);
  return { present:true, cls:b.className, ping: !!ping, pingAnim: ping?getComputedStyle(ping).animation:null,
    btnTransition: cs.transitionProperty+' | '+cs.transitionDuration+' | '+cs.transitionTimingFunction,
    rect: b.getBoundingClientRect().toJSON(), visible: cs.visibility, opacity: getComputedStyle(b.parentElement).opacity, ariaHidden: b.parentElement.getAttribute('aria-hidden') };
});
console.log('\n### MiniVic launcher:', JSON.stringify(mv,null,1));
await browser.close();
