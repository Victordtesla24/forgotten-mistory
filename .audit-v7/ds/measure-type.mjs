import { chromium } from 'playwright';
const URL = 'https://forgotten-mistory.web.app/';
const WIDTHS = [390, 768, 1024, 1440, 1920];
const b = await chromium.launch({ args: ['--force-color-profile=srgb'] });
const out = {};
for (const w of WIDTHS) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, reducedMotion: 'no-preference', deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'networkidle' });
  // scroll whole page to trigger lazy mounts
  await p.evaluate(async () => { const H=document.body.scrollHeight; for(let y=0;y<H;y+=400){window.scrollTo(0,y); await new Promise(r=>setTimeout(r,25));} window.scrollTo(0,0); });
  await p.waitForTimeout(1200);
  const res = await p.evaluate(() => {
    // measure characters-per-line for every prose block
    function isProse(el){
      const t = el.tagName;
      if(!['P','LI','BLOCKQUOTE','DD','FIGCAPTION'].includes(t)) return false;
      const txt = (el.innerText||'').trim();
      if(txt.length < 80) return false;
      return true;
    }
    const results = [];
    const measurer = document.createElement('canvas').getContext('2d');
    document.querySelectorAll('p,li,blockquote,dd,figcaption').forEach(el=>{
      if(!isProse(el)) return;
      const cs = getComputedStyle(el);
      if(cs.display==='none'||cs.visibility==='hidden') return;
      const r = el.getBoundingClientRect();
      if(r.width<40) return;
      const contentW = r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      measurer.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const txt = (el.innerText||'').replace(/\s+/g,' ').trim();
      const avg = measurer.measureText(txt).width / txt.length;
      const zeroW = measurer.measureText('0').width;
      const cpl = contentW/avg;
      const sec = el.closest('section')?.id || (el.closest('footer')?'footer':'?');
      results.push({
        sec, tag: el.tagName, cls: el.className?.toString().slice(0,40),
        w: Math.round(contentW), fs: cs.fontSize, ff: cs.fontFamily.split(',')[0],
        maxW: cs.maxWidth,
        cpl: Math.round(cpl*10)/10,
        chUnits: Math.round(contentW/zeroW*10)/10,
        snippet: txt.slice(0,45)
      });
    });
    return { results, docH: document.documentElement.scrollHeight };
  });
  out[w] = res;
  await ctx.close();
}
await b.close();
console.log(JSON.stringify(out, null, 1));
