import fs from 'node:fs';

const files = process.argv.slice(2);
const HUES = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const PROPS = 'text|bg|border|ring|stroke|fill|from|to|via|outline|shadow|decoration|divide|accent|caret|placeholder';
const GOLD = new Set(['#c9a84c', '#d4b65c', '#e8d5a3', '#b0923f']);

function hexToRgb(h) {
  h = h.replace('#', '').toLowerCase();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length === 4) h = h.slice(0, 3).split('').map((c) => c + c).join('');
  if (h.length === 8) h = h.slice(0, 6);
  if (h.length !== 6) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function hueOf([r, g, b]) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return null;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = Math.round(h * 60);
  return h < 0 ? h + 360 : h;
}
const isGoldHue = (h) => h !== null && h >= 30 && h <= 60;

const utilHits = new Map();
const chromaHits = new Map();

for (const f of files) {
  const css = fs.readFileSync(f, 'utf8');
  const base = f.split('/').pop();

  // (a) hue utilities
  const ure = new RegExp(`\\.(?:${PROPS})-(?:${HUES})-(?:50|[1-9]00|950)\\b`, 'g');
  for (const m of css.matchAll(ure)) {
    const k = m[0];
    utilHits.set(k, (utilHits.get(k) || 0) + 1);
  }
  // also arbitrary/opacity variants like .bg-red-500\/50
  const ure2 = new RegExp(`\\.(?:${PROPS})-(?:${HUES})-(?:50|[1-9]00|950)\\\\/`, 'g');
  for (const m of css.matchAll(ure2)) utilHits.set(m[0], (utilHits.get(m[0]) || 0) + 1);

  // (b) hex literals
  for (const m of css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    const rgb = hexToRgb(m[0]);
    if (!rgb) continue;
    const spread = Math.max(...rgb) - Math.min(...rgb);
    if (spread <= 6) continue;
    const norm = '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
    const h = hueOf(rgb);
    const gold = GOLD.has(norm) || isGoldHue(h);
    const k = `${m[0]}|spread=${spread}|hue=${h}|${gold ? 'GOLD-HUE' : 'NON-GOLD'}`;
    if (!chromaHits.has(k)) chromaHits.set(k, { n: 0, files: new Set(), ctx: [] });
    const e = chromaHits.get(k); e.n++; e.files.add(base);
    if (e.ctx.length < 2) {
      const i = m.index;
      e.ctx.push(css.slice(Math.max(0, i - 70), i + 30).replace(/\s+/g, ' '));
    }
  }
  // rgb()/rgba()
  for (const m of css.matchAll(/rgba?\(\s*([0-9.]+)[\s,]+([0-9.]+)[\s,]+([0-9.]+)/g)) {
    const rgb = [+m[1], +m[2], +m[3]];
    const spread = Math.max(...rgb) - Math.min(...rgb);
    if (spread <= 6) continue;
    const h = hueOf(rgb);
    const gold = isGoldHue(h);
    const k = `${m[0]}...)|spread=${spread}|hue=${h}|${gold ? 'GOLD-HUE' : 'NON-GOLD'}`;
    if (!chromaHits.has(k)) chromaHits.set(k, { n: 0, files: new Set(), ctx: [] });
    const e = chromaHits.get(k); e.n++; e.files.add(base);
    if (e.ctx.length < 2) e.ctx.push(css.slice(Math.max(0, m.index - 70), m.index + 40).replace(/\s+/g, ' '));
  }
  // hsl()
  for (const m of css.matchAll(/hsla?\(\s*([0-9.]+)(?:deg)?[\s,]+([0-9.]+)%/g)) {
    const sat = +m[2];
    if (sat <= 3) continue;
    const k = `${m[0]}...)|sat=${sat}%|NON-GOLD?hue=${m[1]}`;
    if (!chromaHits.has(k)) chromaHits.set(k, { n: 0, files: new Set(), ctx: [] });
    const e = chromaHits.get(k); e.n++; e.files.add(base);
    if (e.ctx.length < 2) e.ctx.push(css.slice(Math.max(0, m.index - 70), m.index + 40).replace(/\s+/g, ' '));
  }
  // oklch()
  for (const m of css.matchAll(/oklch\(\s*([0-9.%]+)\s+([0-9.]+)\s+([0-9.]+)/g)) {
    const c = +m[2];
    if (c <= 0.01) continue;
    const hue = +m[3];
    const gold = hue >= 60 && hue <= 110; // oklch hue for gold ~ 85-95
    const k = `${m[0]}...)|chroma=${c}|hue=${hue}|${gold ? 'GOLD-HUE(oklch)' : 'NON-GOLD'}`;
    if (!chromaHits.has(k)) chromaHits.set(k, { n: 0, files: new Set(), ctx: [] });
    const e = chromaHits.get(k); e.n++; e.files.add(base);
    if (e.ctx.length < 2) e.ctx.push(css.slice(Math.max(0, m.index - 70), m.index + 45).replace(/\s+/g, ' '));
  }
}

console.log('### (a) hue-named utility class selectors');
if (utilHits.size === 0) console.log('  NONE');
else [...utilHits.entries()].sort().forEach(([k, v]) => console.log(`  ${v}x  ${k}`));

console.log('\n### (b) colour literals with chroma above threshold');
const rows = [...chromaHits.entries()].sort((a, b) => b[1].n - a[1].n);
if (rows.length === 0) console.log('  NONE');
for (const [k, v] of rows) {
  console.log(`  ${String(v.n).padStart(3)}x  ${k}   [${[...v.files].join(',')}]`);
  v.ctx.forEach((c) => console.log(`         ctx: ...${c}...`));
}
const nonGold = rows.filter(([k]) => k.includes('NON-GOLD'));
console.log(`\n### summary: ${rows.length} distinct chromatic literals, ${nonGold.length} NON-GOLD, ${utilHits.size} hue utilities`);
