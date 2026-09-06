import sharp from 'sharp';
const { data, info } = await sharp('fullpage-1440.png').removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = info.channels;
const bands = new Map(); const hues = new Map(); const rows = new Map();
let gt4 = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * C; const r = data[i], g = data[i+1], b = data[i+2];
  const ch = Math.max(Math.abs(r-g), Math.abs(g-b), Math.abs(r-b));
  if (ch <= 4) continue;
  gt4++;
  const band = Math.floor(y / 500) * 500;
  bands.set(band, (bands.get(band) || 0) + 1);
  rows.set(y, (rows.get(y)||0)+1);
  const mx = Math.max(r,g,b), mn = Math.min(r,g,b), d = mx-mn;
  let h = 0; if (d) { if (mx===r) h = 60*((((g-b)/d)%6+6)%6); else if (mx===g) h = 60*((b-r)/d+2); else h = 60*((r-g)/d+4); }
  if (h<0) h+=360; const hb = Math.floor(h/15)*15;
  const key = hb; const cur = hues.get(key) || { n:0, maxSat:0, sample:null, minY: 1e9, maxY: 0 };
  cur.n++; const s = mx===0?0:d/mx; if (s>cur.maxSat){cur.maxSat=s; cur.sample={r,g,b,x,y,ch};}
  cur.minY=Math.min(cur.minY,y); cur.maxY=Math.max(cur.maxY,y);
  hues.set(key, cur);
}
console.log('total px chroma>4:', gt4, 'of', W*H, `(${(100*gt4/(W*H)).toFixed(4)}%)`);
console.log('\n-- by 500px vertical band (y start : count) --');
[...bands.entries()].sort((a,b)=>a[0]-b[0]).forEach(([k,v])=>console.log(String(k).padStart(6), v));
console.log('\n-- by hue bucket (15deg) --');
[...hues.entries()].sort((a,b)=>b[1].n-a[1].n).forEach(([k,v])=>console.log(`hue ${String(k).padStart(3)}-${k+15}: n=${String(v.n).padStart(7)} maxSat=${v.maxSat.toFixed(3)} yRange=${v.minY}..${v.maxY} sample=`, v.sample));
