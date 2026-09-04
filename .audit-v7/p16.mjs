import { chromium } from 'playwright';
const browser = await chromium.launch({ args:['--use-gl=angle','--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({viewport:{width:1440,height:900}, reducedMotion:'no-preference'});
const page = await ctx.newPage();
await page.goto('https://forgotten-mistory.web.app/?gl=force',{waitUntil:'load'});
await page.waitForTimeout(2000);
const h=await page.evaluate(()=>document.documentElement.scrollHeight);
for(let y=0;y<h;y+=700){await page.evaluate(v=>scrollTo(0,v),y); await page.waitForTimeout(60);} 
// open the minivic panel so tailwind utilities get a fair chance
await page.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Mini Vic/i.test(x.getAttribute('aria-label')||'')); b&&b.click();});
await page.waitForTimeout(1500);
const r = await page.evaluate(()=>{
  const dead=[]; let authored=0, authoredDead=0;
  for (const sheet of document.styleSheets){
    let rules; try{ rules=sheet.cssRules; }catch(e){ continue; }
    const walk=(list)=>{ for(const rr of list){
      if(rr.type===1){
        const raw = rr.selectorText;
        // "authored" = not a tailwind utility/preflight: our globals selectors are kebab-case words, element selectors from preflight excluded
        const isTw = /^[.:]?[-\w\\/\[\]().%#]+$/.test(raw) && /\\|^\.(inset|top|right|bottom|left|w-|h-|p[xytblr]?-|m[xytblr]?-|text-|bg-|border|flex|grid|gap-|rounded|shadow|z-|absolute|relative|fixed|sticky|static|block|inline|hidden|opacity-|translate|scale-|overflow|backdrop|font-|leading|tracking|whitespace|truncate|shrink|grow|items-|justify-|self-|min-|max-|space-|divide-|ring|outline-|cursor-|select-|pointer-events|sr-only|not-sr-only|collapse|invisible|visible|animate-|transition|duration-|ease-|delay-|group|peer|placeholder)/.test(raw);
        const isPreflight = /^(html|body|\*|::?before|::?after|h[1-6]|p|a|b|strong|small|sub|sup|hr|abbr|blockquote|figure|ol|ul|menu|dl|dd|table|button|input|select|textarea|optgroup|progress|summary|img|svg|video|audio|canvas|iframe|embed|object|fieldset|legend|dialog|:root|::[-\w]+|:host)\b/.test(raw) || raw.includes('::-webkit') || raw.includes('::file-selector') || raw.includes('::placeholder');
        if (isTw || isPreflight) continue;
        authored++;
        const sels = raw.split(',').map(s=>s.replace(/::?(before|after|placeholder|selection|marker|backdrop|-webkit-[\w-]+)/g,'').replace(/:(hover|focus-visible|focus-within|focus|active|disabled|visited|target|checked|first-child|last-child|only-child|empty)/g,'').trim()).filter(Boolean);
        let m=false; for(const s of sels){ try{ if(document.querySelector(s)){m=true;break;} }catch(e){ m=true; } }
        if(!m){ authoredDead++; if(dead.length<60) dead.push(raw.slice(0,100)); }
      } else if (rr.cssRules) walk(rr.cssRules);
    }};
    walk(rules);
  }
  return {authored, authoredDead, dead};
});
console.log(`authored (non-tailwind, non-preflight) rules: ${r.authored}; matching nothing in the live DOM: ${r.authoredDead} (${(100*r.authoredDead/r.authored).toFixed(1)}%)`);
console.log(r.dead.join('\n'));
await browser.close();
