import { chromium } from 'playwright';
import fs from 'node:fs';

const URL = 'https://forgotten-mistory.web.app/';
const OUT = '/Users/vic/claude/forgotten-mistory/.audit-v7/xcut';
const WIDTHS = [390, 768, 1024, 1440, 1920];

function srgb(c){ c/=255; return c<=0.04045? c/12.92 : Math.pow((c+0.055)/1.055,2.4); }
function lum(rgb){ const [r,g,b]=rgb; return 0.2126*srgb(r)+0.7152*srgb(g)+0.0722*srgb(b); }
function ratio(a,b){ const la=lum(a), lb=lum(b); const [hi,lo]=la>lb?[la,lb]:[lb,la]; return (hi+0.05)/(lo+0.05); }
function parse(s){ const m=String(s).match(/rgba?\(([^)]+)\)/); if(!m) return null;
  const p=m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return {r:p[0],g:p[1],b:p[2],a:p[3]===undefined?1:p[3]}; }
function over(fg,bg){ return [fg.r*fg.a+bg[0]*(1-fg.a), fg.g*fg.a+bg[1]*(1-fg.a), fg.b*fg.a+bg[2]*(1-fg.a)]; }

const browser = await chromium.launch({ channel: 'chrome', headless: true,
  args: ['--force-color-profile=srgb','--enable-gpu','--use-gl=angle','--ignore-gpu-blocklist'] });

const results = {};

for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  const consoleMsgs = [];
  page.on('console', m => consoleMsgs.push(`${m.type()}: ${m.text()}`));
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 90000 });
  // scroll through to trigger lazy mounts
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y < h; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2500);

  const data = await page.evaluate(() => {
    const out = {};
    // --- 1. GOLD ENUMERATION ---
    const goldish = (s) => {
      const m = String(s).match(/rgba?\(([^)]+)\)/g) || [];
      return m.some(x => { const p = x.match(/[\d.]+/g).map(Number);
        if (p.length < 3) return false; const [r,g,b] = p;
        const mx = Math.max(r,g,b), mn = Math.min(r,g,b);
        if (mx === 0) return false;
        const sat = (mx-mn)/mx;
        return sat > 0.2 && r >= g && g > b; }); // warm chroma
    };
    const goldNodes = [];
    for (const el of document.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      const props = ['color','backgroundColor','borderTopColor','borderBottomColor','borderLeftColor','borderRightColor','fill','stroke','boxShadow','backgroundImage','outlineColor','textDecorationColor'];
      const hits = [];
      for (const p of props) { const v = cs[p]; if (v && v !== 'none' && goldish(v)) hits.push(`${p}=${v}`); }
      if (hits.length) {
        const r = el.getBoundingClientRect();
        const sec = el.closest('section')?.id || el.closest('header,footer,nav')?.tagName?.toLowerCase() || 'root';
        goldNodes.push({ tag: el.tagName.toLowerCase(), cls: (typeof el.className === 'string' ? el.className : el.className?.baseVal || '').slice(0,80),
          sec, hits, text: (el.textContent||'').trim().slice(0,40),
          rect: { x: Math.round(r.x), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) },
          color: cs.color, bg: cs.backgroundColor, opacity: cs.opacity,
          effOpacity: (() => { let o=1,n=el; while(n && n!==document.body){ o *= parseFloat(getComputedStyle(n).opacity||'1'); n=n.parentElement;} return o; })(),
          fontSize: cs.fontSize });
      }
    }
    out.goldNodes = goldNodes;

    // SVG gradient gold stops (not caught by computed styles)
    out.goldGradients = [...document.querySelectorAll('linearGradient,radialGradient')].map(g => ({
      id: g.id, stops: [...g.querySelectorAll('stop')].map(s => ({ c: getComputedStyle(s).stopColor, o: getComputedStyle(s).stopOpacity }))
    })).filter(g => g.stops.some(s => { const p=(s.c.match(/[\d.]+/g)||[]).map(Number); if(p.length<3) return false; const [r,gg,b]=p; const mx=Math.max(r,gg,b),mn=Math.min(r,gg,b); return mx>0 && (mx-mn)/mx>0.2 && r>=gg && gg>b; }));
    out.goldPathCount = [...document.querySelectorAll('path,line,circle,rect')].filter(p => {
      const st = p.getAttribute('stroke')||''; const fl=p.getAttribute('fill')||'';
      return /gold/i.test(st+fl);
    }).length;

    // --- 2. TYPE ---
    out.faces = [...new Set([...document.querySelectorAll('*')].map(e => getComputedStyle(e).fontFamily))];
    // measure: characters per line on prose elements
    const proseSel = 'p, li, blockquote, figcaption, dd';
    const prose = [];
    for (const el of document.querySelectorAll(proseSel)) {
      const r = el.getBoundingClientRect();
      if (r.width < 40 || !el.textContent.trim()) continue;
      const cs = getComputedStyle(el);
      // measure a '0' width in the element's font
      const span = document.createElement('span');
      span.textContent = '0'.repeat(100);
      span.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:${cs.font};letter-spacing:${cs.letterSpacing}`;
      document.body.appendChild(span);
      const chW = span.getBoundingClientRect().width / 100;
      span.remove();
      const contentW = r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      prose.push({ sec: el.closest('section')?.id || 'root', tag: el.tagName.toLowerCase(),
        cls: (typeof el.className==='string'?el.className:'').slice(0,50),
        ch: +(contentW / chW).toFixed(1), px: Math.round(contentW), fs: cs.fontSize,
        fam: cs.fontFamily.split(',')[0].replace(/["']/g,''),
        chars: el.textContent.trim().length,
        text: el.textContent.trim().slice(0,50) });
    }
    out.prose = prose;
    out.fontFeature = [...document.querySelectorAll('*')].reduce((acc,e)=>{const cs=getComputedStyle(e);
      const k = cs.fontVariantNumeric; if(k && k!=='normal') acc[k]=(acc[k]||0)+1; return acc;},{});
    out.smallCaps = [...document.querySelectorAll('*')].filter(e=>{const cs=getComputedStyle(e); return /small-caps/.test(cs.fontVariantCaps||'')||/small-caps/.test(cs.fontVariant||'');}).length;
    out.hangingPunct = [...document.querySelectorAll('*')].filter(e=>{const cs=getComputedStyle(e); return (cs.hangingPunctuation||'none')!=='none';}).length;
    out.textTransformUpper = [...document.querySelectorAll('*')].filter(e=>getComputedStyle(e).textTransform==='uppercase').length;

    // --- 3. GRID / ALIGNMENT ---
    const secs = ['hero','about','experience','skills','vitrine','listen'];
    out.align = {};
    for (const id of secs) {
      const s = document.getElementById(id); if (!s) continue;
      const sr = s.getBoundingClientRect();
      const h2 = s.querySelector('h2, h1');
      const kicker = s.querySelector('[class*="kicker"],[class*="eyebrow"]');
      const lede = s.querySelector('[class*="lede"],[class*="lead"]');
      const figs = [...s.querySelectorAll('figure, canvas, svg, table, [class*="chart"], [class*="plot"], [class*="rail"], [class*="board"], [class*="bench"]')]
        .map(f => { const r=f.getBoundingClientRect(); return { tag:f.tagName.toLowerCase(), cls:(typeof f.className==='string'?f.className:f.className?.baseVal||'').slice(0,60), left:+r.left.toFixed(1), right:+r.right.toFixed(1), w:+r.width.toFixed(1), h:+r.height.toFixed(1)};})
        .filter(f => f.w > 100);
      // content right edge: max right of all text-bearing descendants
      let maxRight = 0, minLeft = 1e9;
      for (const el of s.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility==='hidden'||cs.display==='none') continue;
        const hasText = [...el.childNodes].some(n=>n.nodeType===3 && n.textContent.trim());
        const isMark = ['CANVAS','SVG','IMG','TABLE'].includes(el.tagName);
        if (hasText || isMark) { maxRight = Math.max(maxRight, r.right); minLeft = Math.min(minLeft, r.left); }
      }
      out.align[id] = {
        secLeft:+sr.left.toFixed(1), secWidth:+sr.width.toFixed(1), secHeight:Math.round(sr.height),
        h2Left: h2 ? +h2.getBoundingClientRect().left.toFixed(1) : null,
        h2Right: h2 ? +h2.getBoundingClientRect().right.toFixed(1) : null,
        kickerLeft: kicker ? +kicker.getBoundingClientRect().left.toFixed(1) : null,
        ledeRight: lede ? +lede.getBoundingClientRect().right.toFixed(1) : null,
        figs, contentMinLeft: +minLeft.toFixed(1), contentMaxRight: +maxRight.toFixed(1),
        emptyRightPx: +(sr.width - maxRight).toFixed(1),
        emptyRightPct: +(((sr.width - maxRight)/sr.width)*100).toFixed(1)
      };
    }
    out.rootVars = (() => { const cs = getComputedStyle(document.documentElement); const o={};
      for (const k of ['--gold','--gold-light','--gold-pale','--gold-dark','--ink-900','--ink-800','--ink-700','--ink-500','--mist-400','--mist-200','--white','--accent',
        '--space-1','--space-2','--space-3','--space-4','--fs-body','--fs-title','--measure-read','--measure-display','--gutter','--shell-max','--content-max']) o[k]=cs.getPropertyValue(k).trim();
      return o; })();
    out.docHeight = document.documentElement.scrollHeight;
    return out;
  });

  // compute contrast for gold nodes
  for (const n of data.goldNodes) {
    const fg = parse(n.color);
    if (!fg) continue;
    const ground = [10,11,13]; // --ink-900
    const eff = { ...fg, a: fg.a * n.effOpacity };
    n.contrastOnInk900 = +ratio(over(eff, ground), ground).toFixed(2);
  }
  results[w] = { ...data, console: consoleMsgs };
  await ctx.close();
  process.stderr.write(`done ${w}\n`);
}
await browser.close();
fs.writeFileSync(`${OUT}/measure.json`, JSON.stringify(results, null, 1));
console.log('ok');
