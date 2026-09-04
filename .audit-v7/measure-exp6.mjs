import { chromium } from 'playwright';
const browser = await chromium.launch({ headless:true, args:['--use-gl=angle','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1, reducedMotion:'no-preference' });
const p = await ctx.newPage();
await p.goto('https://forgotten-mistory.web.app/', {waitUntil:'networkidle', timeout:90000});
await p.evaluate(()=>document.querySelector('#experience').scrollIntoView());
await p.waitForTimeout(4000);
const o = await p.evaluate(()=>{
  const s=document.querySelector('#experience');
  const ol=s.querySelector('ol');
  return {
    figures: s.querySelectorAll('figure,figcaption').length,
    roleImg: s.querySelectorAll('[role="img"]').length,
    svgs: s.querySelectorAll('svg').length,
    canvases: s.querySelectorAll('canvas').length,
    tracksAria: { label: ol.getAttribute('aria-label'), labelledby: ol.getAttribute('aria-labelledby'), role: ol.getAttribute('role') },
    ariaHidden: [...s.querySelectorAll('[aria-hidden="true"]')].map(e=>e.className.toString().slice(0,40)),
    tabbables: s.querySelectorAll('a[href],button,[tabindex]:not([tabindex="-1"])').length,
    links: [...s.querySelectorAll('a')].map(a=>a.href),
    dataAttrs: [...new Set([...s.querySelectorAll('*')].flatMap(e=>[...e.attributes].map(a=>a.name).filter(n=>n.startsWith('data-'))))],
    headings: [...s.querySelectorAll('h1,h2,h3,h4')].map(h=>h.tagName+':'+h.textContent.slice(0,60)),
    caliperStates: [...s.querySelectorAll('[data-state]')].map(e=>e.getAttribute('data-state')),
    sectionText: s.innerText.length,
  };
});
console.log(JSON.stringify(o,null,1));
await browser.close();
