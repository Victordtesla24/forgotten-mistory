import { chromium } from 'playwright';
import fs from 'node:fs';
const URL='https://forgotten-mistory.web.app/';
const OUT='/Users/vic/claude/forgotten-mistory/.audit-v7/xcut';
const b = await chromium.launch({ channel:'chrome', headless:true, args:['--force-color-profile=srgb','--enable-gpu','--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1, reducedMotion:'no-preference' });
const p = await ctx.newPage();
await p.goto(URL,{waitUntil:'networkidle',timeout:90000});
await p.evaluate(async()=>{const h=document.body.scrollHeight;for(let y=0;y<h;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,50));}window.scrollTo(0,0);});
await p.waitForTimeout(3000);
const secs = await p.evaluate(()=>['hero','about','experience','skills','vitrine','listen'].map(id=>{const e=document.getElementById(id);const r=e.getBoundingClientRect();return {id, top:Math.round(r.top+window.scrollY), h:Math.round(r.height)};}));
fs.writeFileSync(`${OUT}/secs.json`, JSON.stringify(secs,null,1));
for (const s of secs){
  await p.evaluate(y=>window.scrollTo(0,y), s.top);
  await p.waitForTimeout(1400);
  await p.screenshot({ path:`${OUT}/sec-${s.id}-1440.png` });
  // a cropped square from the middle of the first viewport, for the unmistakability test
  await p.screenshot({ path:`${OUT}/crop-${s.id}-1440.png`, clip:{x:300,y:180,width:760,height:560} });
}
// also vertical rhythm + type feature audit
const meta = await p.evaluate(()=>{
  const out={sections:[],typeFeat:{}};
  for (const id of ['hero','about','experience','skills','vitrine','listen']){
    const s=document.getElementById(id); const cs=getComputedStyle(s);
    const h2=s.querySelector('h2,h1'); const hdr = h2? h2.parentElement : null;
    out.sections.push({id, padTop:cs.paddingTop, padBottom:cs.paddingBottom,
      inner: (()=>{const inn=s.firstElementChild; const c=inn?getComputedStyle(inn):null; return c?{maxW:c.maxWidth, padL:c.paddingLeft, padR:c.paddingRight, w:Math.round(inn.getBoundingClientRect().width)}:null;})(),
      h2fs: h2?getComputedStyle(h2).fontSize:null, h2fam:h2?getComputedStyle(h2).fontFamily.split(',')[0]:null,
      h2lh: h2?getComputedStyle(h2).lineHeight:null, h2ls:h2?getComputedStyle(h2).letterSpacing:null,
      headerMB: hdr?getComputedStyle(hdr).marginBottom:null });
  }
  // tabular figures
  const nums=[];
  for (const el of document.querySelectorAll('*')){
    const t=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('');
    if(!/\d/.test(t)) continue;
    const cs=getComputedStyle(el);
    nums.push({tag:el.tagName.toLowerCase(),cls:(typeof el.className==='string'?el.className:'').slice(0,40),
      fvn:cs.fontVariantNumeric, fam:cs.fontFamily.split(',')[0].replace(/["']/g,''), txt:t.trim().slice(0,28), sec:el.closest('section')?.id||'root'});
  }
  out.numeric=nums;
  return out;
});
fs.writeFileSync(`${OUT}/meta.json`, JSON.stringify(meta,null,1));
await b.close();
console.log(JSON.stringify(meta.sections,null,1));
