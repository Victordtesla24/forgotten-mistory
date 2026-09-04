import { chromium } from 'playwright';
import fs from 'fs';
const dir='/Users/vic/claude/forgotten-mistory/.audit-v7/ds/shots'; fs.mkdirSync(dir,{recursive:true});
const b=await chromium.launch({headless:false,args:['--hide-scrollbars']});
const ctx=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference',deviceScaleFactor:1});
const p=await ctx.newPage();
await p.goto('https://forgotten-mistory.web.app/',{waitUntil:'networkidle'});
await p.waitForTimeout(2500);
const info=await p.evaluate(()=>({canvases:[...document.querySelectorAll('canvas')].map(c=>({w:c.width,h:c.height,cls:String(c.className)})),rm:matchMedia('(prefers-reduced-motion: reduce)').matches,
  gl:(()=>{try{const c=document.createElement('canvas');const g=c.getContext('webgl');const e=g.getExtension('WEBGL_debug_renderer_info');return g.getParameter(e.UNMASKED_RENDERER_WEBGL);}catch(e){return 'n/a';}})()}));
console.log(JSON.stringify(info));
await p.screenshot({path:`${dir}/hero-1440.png`});
const secs=['hero','about','experience','skills','vitrine','listen'];
for(const s of secs){
  await p.evaluate(id=>{const e=document.getElementById(id);window.scrollTo(0,e.getBoundingClientRect().top+scrollY);},s);
  await p.waitForTimeout(2200);
  await p.screenshot({path:`${dir}/${s}-1440.png`});
}
await b.close();
