import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = '/Users/vic/claude/forgotten-mistory/.audit-v7/ds';
const BPS = [390, 768, 1024, 1440, 1920];
const SECS = ['hero','about','experience','skills','vitrine','listen'];

const browser = await chromium.launch({ headless:true,
  args:['--use-gl=angle','--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist'] });

const all = {};
for (const w of BPS) {
  const ctx = await browser.newContext({ viewport:{width:w,height:900}, deviceScaleFactor:1, reducedMotion:'no-preference' });
  const page = await ctx.newPage();
  const console_ = [];
  page.on('console', m => console_.push(m.type()+': '+m.text()));
  await page.goto('https://forgotten-mistory.web.app/', { waitUntil:'networkidle', timeout:90000 });
  // force full lazy mount
  await page.evaluate(async () => {
    for (let y=0; y<document.body.scrollHeight; y+=400) { window.scrollTo(0,y); await new Promise(r=>setTimeout(r,45)); }
    window.scrollTo(0,0); await new Promise(r=>setTimeout(r,600));
  });
  await page.waitForTimeout(2500);

  const data = await page.evaluate((SECS) => {
    const px = v => parseFloat(v)||0;
    const vis = el => { const r=el.getBoundingClientRect(); const cs=getComputedStyle(el);
      return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none'&&parseFloat(cs.opacity)>0.01; };
    const secOf = el => { const s = el.closest('section[id]'); return s?s.id:'root'; };
    const chW = (el) => { const s=document.createElement('span'); const cs=getComputedStyle(el);
      s.style.cssText=`position:absolute;visibility:hidden;white-space:pre;font:${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily};letter-spacing:${cs.letterSpacing}`;
      s.textContent='0'.repeat(100); document.body.appendChild(s); const wpc=s.getBoundingClientRect().width/100; s.remove(); return wpc; };

    // ---------- 1. running prose measure ----------
    const prose=[];
    for (const el of document.querySelectorAll('p,li,blockquote,dd,figcaption,td,th')) {
      if (!vis(el)) continue;
      if (el.querySelector('p,li,ul,ol,div,figure,table')) continue;
      const t=(el.innerText||'').trim(); if (t.length<110) continue;
      const cw=el.getBoundingClientRect().width - px(getComputedStyle(el).paddingLeft) - px(getComputedStyle(el).paddingRight);
      const c=chW(el);
      prose.push({sec:secOf(el),tag:el.tagName.toLowerCase(),cls:el.className.toString().slice(0,40),
        chars:t.length, ch:+(cw/c).toFixed(1), px:Math.round(cw),
        fs:getComputedStyle(el).fontSize, lh:getComputedStyle(el).lineHeight,
        fam:getComputedStyle(el).fontFamily.split(',')[0], text:t.slice(0,60)});
    }

    // ---------- 2. font-family census ----------
    const famCount={}, famSample={};
    for (const el of document.querySelectorAll('body *')) {
      if (!el.childNodes.length) continue;
      let hasText=false; for (const n of el.childNodes) if (n.nodeType===3 && n.textContent.trim()) hasText=true;
      if (!hasText) continue;
      const f=getComputedStyle(el).fontFamily;
      famCount[f]=(famCount[f]||0)+1;
      if(!famSample[f]) famSample[f]={sec:secOf(el),tag:el.tagName.toLowerCase(),cls:el.className.toString().slice(0,60),text:(el.innerText||'').trim().slice(0,50)};
    }

    // ---------- 3. type-scale census ----------
    const fsCount={}, lhCount={}, lsCount={};
    for (const el of document.querySelectorAll('body *')) {
      if (!vis(el)) continue;
      let hasText=false; for (const n of el.childNodes) if (n.nodeType===3 && n.textContent.trim()) hasText=true;
      if (!hasText) continue;
      const cs=getComputedStyle(el);
      const f=(Math.round(parseFloat(cs.fontSize)*100)/100)+'px';
      fsCount[f]=(fsCount[f]||0)+1;
      const ratio = (parseFloat(cs.lineHeight)/parseFloat(cs.fontSize));
      const lr = isNaN(ratio)?cs.lineHeight:(Math.round(ratio*100)/100).toFixed(2);
      lhCount[lr]=(lhCount[lr]||0)+1;
      lsCount[cs.letterSpacing]=(lsCount[cs.letterSpacing]||0)+1;
    }

    // ---------- 4. gold census with per-viewport-window density ----------
    const GOLDS=['201, 168, 76','212, 182, 92','232, 213, 163','176, 146, 63'];
    const isGold = s => GOLDS.some(g=>s.includes(g));
    const gold=[];
    for (const el of document.querySelectorAll('body *, svg *')) {
      const cs=getComputedStyle(el); const hits=[];
      for (const p of ['color','backgroundColor','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','fill','stroke','boxShadow','outlineColor','backgroundImage','stopColor']) {
        const v=cs[p]; if (v && isGold(v)) hits.push(p);
      }
      if (!hits.length) continue;
      const r=el.getBoundingClientRect();
      if (r.width<=0||r.height<=0) { // gradient stops etc.
        gold.push({sec:secOf(el),tag:el.tagName,cls:(el.getAttribute('class')||'').slice(0,40),hits,geom:null});
        continue;
      }
      gold.push({sec:secOf(el),tag:el.tagName,cls:(el.getAttribute('class')||'').slice(0,40),hits,
        geom:{x:Math.round(r.x),y:Math.round(r.y+scrollY),w:Math.round(r.width),h:Math.round(r.height)},
        area:Math.round(r.width*r.height), text:(el.textContent||'').trim().slice(0,30)});
    }
    // svg paths referencing a gold gradient
    const goldGrads=new Set();
    for (const g of document.querySelectorAll('linearGradient,radialGradient')) {
      for (const s of g.querySelectorAll('stop')) {
        const c=getComputedStyle(s).stopColor||s.getAttribute('stop-color')||'';
        if (isGold(c)|| (s.getAttribute('stop-color')||'').includes('gold')) goldGrads.add('#'+g.id);
      }
    }
    let goldPaths=[];
    for (const p of document.querySelectorAll('path,line,polyline,rect,circle')) {
      const st=(p.getAttribute('stroke')||'')+(p.getAttribute('fill')||'');
      for (const id of goldGrads) if (st.includes(id)) {
        const r=p.getBoundingClientRect();
        goldPaths.push({sec:secOf(p),grad:id,y:Math.round(r.y+scrollY),h:Math.round(r.height),opacity:getComputedStyle(p).strokeOpacity});
      }
    }

    // ---------- 5. section geometry, heading column vs artefact ----------
    const align={};
    for (const id of SECS) {
      const s=document.getElementById(id); if(!s) continue;
      const sr=s.getBoundingClientRect();
      const h2=s.querySelector('h2,h1');
      const hr=h2?h2.getBoundingClientRect():null;
      const figs=[];
      for (const f of s.querySelectorAll('figure,canvas,svg,[class*="chart"],[class*="rail"],[class*="bench"],[class*="scene"],[class*="plate"],table')) {
        if (!vis(f)) continue; const r=f.getBoundingClientRect();
        if (r.width<80||r.height<40) continue;
        figs.push({tag:f.tagName.toLowerCase(),cls:(f.getAttribute('class')||'').slice(0,34),
          left:+r.left.toFixed(1),right:+r.right.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1)});
      }
      // ink occupancy histogram across section width, 40 buckets
      const B=40, buckets=new Array(B).fill(0);
      const walk=(el)=>{ for (const c of el.children){ 
        const cs=getComputedStyle(c);
        if(cs.display==='none'||cs.visibility==='hidden'||parseFloat(cs.opacity)<0.05) continue;
        const isLeafText = [...c.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
        const isGfx=['CANVAS','SVG','IMG','VIDEO'].includes(c.tagName);
        if (isLeafText||isGfx){ const r=c.getBoundingClientRect();
          if(r.width>0&&r.height>0&&r.width<sr.width*1.2){
            const a=Math.max(0,Math.floor((r.left-sr.left)/sr.width*B));
            const b=Math.min(B-1,Math.ceil((r.right-sr.left)/sr.width*B)-1);
            for(let i=a;i<=b;i++) buckets[i]+=r.height;
          }
        }
        if(!isGfx) walk(c);
      }};
      walk(s);
      align[id]={secLeft:+sr.left.toFixed(1), secW:+sr.width.toFixed(1), secH:Math.round(sr.height),
        h2Left:hr?+hr.left.toFixed(1):null, h2Right:hr?+hr.right.toFixed(1):null,
        figs, inkBuckets:buckets.map(v=>Math.round(v))};
    }

    // ---------- 6. craft signals ----------
    let smallCaps=0, hang=0, tab=0, balance=0, upper=0;
    for (const el of document.querySelectorAll('body *')) {
      const cs=getComputedStyle(el);
      if (cs.fontVariantCaps && cs.fontVariantCaps!=='normal') smallCaps++;
      if (cs.hangingPunctuation && cs.hangingPunctuation!=='none') hang++;
      if ((cs.fontVariantNumeric||'').includes('tabular')) tab++;
      if ((cs.textWrap||cs.textWrapStyle||'')==='balance') balance++;
      if (cs.textTransform==='uppercase') upper++;
    }

    // ---------- 7. scrollbars / overflow ----------
    const overflowX=[];
    for (const el of document.querySelectorAll('body *')) {
      const cs=getComputedStyle(el);
      if ((cs.overflowX==='auto'||cs.overflowX==='scroll') && el.scrollWidth>el.clientWidth+2)
        overflowX.push({sec:secOf(el),cls:(el.getAttribute('class')||'').slice(0,40),sw:el.scrollWidth,cw:el.clientWidth,scrollbarSpace:el.offsetHeight-el.clientHeight});
    }

    return {prose,famCount,famSample,fsCount,lhCount,lsCount,gold,goldPaths,goldGrads:[...goldGrads],align,
      craft:{smallCaps,hang,tab,balance,upper},overflowX,docH:document.documentElement.scrollHeight};
  }, SECS);

  data.console = console_;
  all[w]=data;
  await ctx.close();
  console.error('done',w);
}
fs.writeFileSync(OUT+'/ds-measure.json', JSON.stringify(all,null,1));
await browser.close();
console.log('WROTE');
