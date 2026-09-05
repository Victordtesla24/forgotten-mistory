import { chromium } from 'playwright';
const SPOOF = `(() => { const F='ANGLE (Apple, ANGLE Metal Renderer: Apple M2 Pro, Unspecified Version)';
 const patch=(p)=>{if(!p)return;const g=p.getParameter;p.getParameter=function(x){if(x===0x9246)return F;if(x===0x9245)return 'Google Inc. (Apple)';return g.call(this,x);};};
 patch(window.WebGLRenderingContext&&window.WebGLRenderingContext.prototype);
 patch(window.WebGL2RenderingContext&&window.WebGL2RenderingContext.prototype);})();`;
const b = await chromium.launch({ channel:'chrome', args:['--no-sandbox','--disable-dev-shm-usage'] });
const c = await b.newContext({ viewport:{width:1440,height:900} });
await c.addInitScript(SPOOF);
const p = await c.newPage(); const ce=[];
p.on('console', m => { if (m.type()==='error') ce.push(m.text().slice(0,120)); });
await p.goto('https://forgotten-mistory.web.app/', { waitUntil:'load' });
await p.waitForTimeout(5000);
console.log(JSON.stringify(await p.evaluate(() => ({
  build: document.querySelector('meta[name="build-commit"]')?.content,
  h1: document.querySelector('h1')?.textContent?.trim(),
  sections: document.querySelectorAll('section[id]').length,
  errorBoundary: /SYSTEM INTERRUPT/i.test(document.body.innerText),
}))));
console.log('consoleErrors=' + ce.length, JSON.stringify(ce.slice(0,1)));
await b.close();
