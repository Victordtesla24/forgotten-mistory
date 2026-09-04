import { chromium } from 'playwright';
import fs from 'node:fs';
const browser = await chromium.launch({ headless:true, args:['--use-gl=angle','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1, reducedMotion:'no-preference' });
const page = await ctx.newPage();
await page.goto('https://forgotten-mistory.web.app/', { waitUntil:'networkidle', timeout:90000 });
await page.evaluate(async () => { for (let y=0;y<document.body.scrollHeight;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,45));} window.scrollTo(0,0); await new Promise(r=>setTimeout(r,600)); });
await page.waitForTimeout(2500);
const out = await page.evaluate(() => {
  const secOf = el => { const s=el.closest('section[id]'); return s?s.id:'root'; };
  const hasText = el => [...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
  const odd=[], track={};
  for (const el of document.querySelectorAll('body *')) {
    if(!hasText(el)) continue;
    const cs=getComputedStyle(el); const fs=parseFloat(cs.fontSize);
    if (fs < 10.5) odd.push({sec:secOf(el),tag:el.tagName.toLowerCase(),cls:(el.getAttribute('class')||'').slice(0,50),fs:cs.fontSize,text:(el.textContent||'').trim().slice(0,40),vis:cs.visibility,op:cs.opacity, w:Math.round(el.getBoundingClientRect().width)});
    const ls=cs.letterSpacing==='normal'?0:parseFloat(cs.letterSpacing)/fs;
    const k=(Math.round(ls*1000)/1000).toFixed(3);
    track[k]=(track[k]||0)+1;
  }
  // mono usage by text length
  let monoNodes=0, monoChars=0, interChars=0, serifChars=0, monoLong=[];
  for (const el of document.querySelectorAll('body *')) {
    if(!hasText(el)) continue;
    const fam=getComputedStyle(el).fontFamily; const t=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
    if (fam.includes('Plex_Mono')) { monoNodes++; monoChars+=t.length; if (t.split(/\s+/).length>12) monoLong.push({sec:secOf(el),cls:(el.getAttribute('class')||'').slice(0,44),words:t.split(/\s+/).length,text:t.slice(0,90)}); }
    else if (fam.includes('Inter')) interChars+=t.length;
    else if (fam.includes('Source_Serif')) serifChars+=t.length;
  }
  // scrollbar styling of vitrine rail
  const rail=document.querySelector('[class*="Vitrine_rail"]');
  const rcs=rail?getComputedStyle(rail):null;
  return {odd, track, mono:{monoNodes,monoChars,interChars,serifChars,monoLong},
    rail: rcs?{scrollbarWidth:rcs.scrollbarWidth, scrollbarColor:rcs.scrollbarColor, overflowX:rcs.overflowX, scrollSnapType:rcs.scrollSnapType, sw:rail.scrollWidth, cw:rail.clientWidth, oh:rail.offsetHeight, ch:rail.clientHeight}:null};
});
fs.writeFileSync('/Users/vic/claude/forgotten-mistory/.audit-v7/ds/probe2.json', JSON.stringify(out,null,1));
await browser.close(); console.log('ok');
