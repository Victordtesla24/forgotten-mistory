import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT='/Users/vic/claude/forgotten-mistory/.audit-v7/s1';
const browser = await chromium.launch({ headless:true,
  args:['--use-gl=angle','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist'] });
const out={};
for (const [w,h] of [[1440,900],[1920,1080],[1280,720],[390,844],[768,1024]]) {
  const ctx = await browser.newContext({ viewport:{width:w,height:h}, deviceScaleFactor:1, reducedMotion:'no-preference' });
  const page = await ctx.newPage();
  const logs=[]; page.on('console',m=>logs.push(m.type()+': '+m.text()));
  await page.goto('https://forgotten-mistory.web.app/?gl=force',{waitUntil:'networkidle',timeout:90000});
  await page.waitForTimeout(4000);
  const d = await page.evaluate(() => {
    const hero=document.getElementById('hero');
    const r=el=>{const b=el.getBoundingClientRect();return {x:+b.x.toFixed(1),y:+b.y.toFixed(1),w:+b.width.toFixed(1),h:+b.height.toFixed(1)};};
    const cs=el=>getComputedStyle(el);
    const canvases=[...hero.querySelectorAll('canvas')].map(c=>({...r(c),cw:c.width,ch:c.height,
      ctxLost: (()=>{try{const g=c.getContext('webgl2')||c.getContext('webgl');return g?g.isContextLost():'nogl';}catch(e){return 'err'}})()}));
    // content bbox of every visible leaf in hero
    let minx=1e9,maxx=-1e9,miny=1e9,maxy=-1e9; const items=[];
    hero.querySelectorAll('*').forEach(el=>{
      if(el.tagName==='CANVAS')return;
      const b=el.getBoundingClientRect(); const c=cs(el);
      if(b.width<1||b.height<1)return; if(c.visibility==='hidden'||c.display==='none')return;
      if(!el.textContent.trim() && !['SPAN'].includes(el.tagName))return;
      if(el.children.length===0 || el.className.toString().includes('ledgerItem')){
        items.push({t:el.tagName,cls:String(el.className).slice(0,40),txt:el.textContent.trim().slice(0,40),...r(el),fs:c.fontSize,color:c.color});
        minx=Math.min(minx,b.x);maxx=Math.max(maxx,b.right);miny=Math.min(miny,b.y);maxy=Math.max(maxy,b.bottom);
      }
    });
    const heroR=r(hero);
    // download-cv affordances in first viewport
    const cvs=[...document.querySelectorAll('a')].filter(a=>/download cv/i.test(a.textContent)).map(a=>{
      const b=a.getBoundingClientRect(); const c=cs(a);
      const parentVisible = c.visibility!=='hidden' && c.display!=='none' && parseFloat(c.opacity)>0.01;
      const inFold = b.y < window.innerHeight && b.bottom>0 && b.width>0;
      return {txt:a.textContent.trim(),...r(a),inFold,parentVisible,inNavOverlay:!!a.closest('.nav-overlay')};
    });
    // any scroll cue?
    const cue=[...document.querySelectorAll('*')].filter(el=>/scroll|↓|⌄|chevron/i.test(el.textContent||'')&&el.children.length===0).map(el=>({t:el.tagName,txt:el.textContent.trim().slice(0,40)}));
    // gold token usage inside hero
    const goldEls=[...hero.querySelectorAll('*')].filter(el=>{const c=cs(el);
      return [c.color,c.backgroundColor,c.borderTopColor,c.borderLeftColor,c.outlineColor].some(v=>/201, ?168, ?76|176, ?146, ?63|212, ?182, ?92|232, ?213, ?163/.test(v));}).length;
    // caliper metrics
    const cal=[...hero.querySelectorAll('[data-state]')].map(el=>{
      const val=el.querySelector('[class*=value]'); const arms=[...el.querySelectorAll('[class*=arm]')];
      const c=cs(el); const vc=cs(val);
      const after=getComputedStyle(val,'::after');
      return {state:el.dataset.state, ...r(el), valueFs:vc.fontSize, valueColor:vc.color, calColor:c.color,
        armW:arms.map(a=>r(a).w), glyphFs:after.fontSize, glyphContent:after.content, glyphOpacity:after.opacity};
    });
    return {vw:innerWidth,vh:innerHeight,heroR,canvases,contentBox:{minx:+minx.toFixed(1),maxx:+maxx.toFixed(1),miny:+miny.toFixed(1),maxy:+maxy.toFixed(1)},
      items, cvs, cue, goldEls, cal,
      stageBg: cs(hero.querySelector('[class*=stage]')).backgroundImage.slice(0,160),
      innerMax: cs(hero.querySelector('[class*=inner]')).maxWidth,
      docH: document.documentElement.scrollHeight};
  });
  d.console=logs;
  await page.screenshot({path:`${OUT}/hero-${w}.png`});
  out[`${w}x${h}`]=d;
  await ctx.close();
}
await browser.close();
fs.writeFileSync(`${OUT}/hero-measure.json`, JSON.stringify(out,null,1));
console.log('done');
