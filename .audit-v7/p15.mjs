import { chromium } from 'playwright';
const browser = await chromium.launch({ args:['--use-gl=angle','--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({viewport:{width:1440,height:900}, reducedMotion:'no-preference'});
const page = await ctx.newPage();
await page.goto('https://forgotten-mistory.web.app/?gl=force',{waitUntil:'load'});
await page.waitForTimeout(2500);
const h=await page.evaluate(()=>document.documentElement.scrollHeight);
for(let y=0;y<h;y+=700){await page.evaluate(v=>scrollTo(0,v),y); await page.waitForTimeout(60);} 
await page.waitForTimeout(800);
const r = await page.evaluate(()=>{
  const out={total:0, dead:0, deadSample:[], byFile:{}};
  for (const sheet of document.styleSheets){
    let rules; try{ rules=sheet.cssRules; }catch(e){ continue; }
    const href=(sheet.href||'inline').split('/').pop();
    const walk=(list)=>{ for(const r of list){
      if(r.type===1){ // style rule
        out.total++;
        const sel=r.selectorText.split(',').map(s=>s.replace(/::?(before|after|first-line|first-letter|placeholder|selection|marker|backdrop|-webkit-[\w-]+)/g,'').replace(/:(hover|focus|focus-visible|focus-within|active|disabled|visited|target|checked|not\([^)]*\)|where\([^)]*\)|is\([^)]*\)|nth-child\([^)]*\)|first-child|last-child|only-child|empty)/g,'').trim()).filter(Boolean);
        let matched=false;
        for(const s of sel){ try{ if(s && document.querySelector(s)){matched=true;break;} }catch(e){ matched=true; } }
        if(!matched){ out.dead++; out.byFile[href]=(out.byFile[href]||0)+1; if(out.deadSample.length<45) out.deadSample.push(href+' :: '+r.selectorText.slice(0,90)); }
      } else if (r.cssRules) walk(r.cssRules);
    }};
    walk(rules);
  }
  return out;
});
console.log('total style rules:', r.total, ' dead (0 matches):', r.dead, ` = ${(100*r.dead/r.total).toFixed(1)}%`);
console.log('by file:', JSON.stringify(r.byFile));
console.log(r.deadSample.join('\n'));
await browser.close();
