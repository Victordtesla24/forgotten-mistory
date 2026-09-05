// Numeric side-by-side of this build's isolated scene captures against the
// pre-resolutionScale captures taken by the same method on live ff67273b
// (G-REV/ff67273b/captures/glforce-1440-*.png). Upscale artefacts would show as
// fewer distinct luminance levels (posterisation), a lower mid-row second
// difference (softening), or a visible drop in peak/mean.
import { PNG } from '/root/forgotten-mistory/node_modules/pngjs/lib/png.js';
import fs from 'node:fs';
import path from 'node:path';
const OUT = path.dirname(new URL(import.meta.url).pathname);
const OLD = '/root/forgotten-mistory/.claude/worktrees/wf_a576a440-b8f-1/docs/delivery/evidence/v10-20260905T0515Z/G-REV/ff67273b/captures';
const lum = (r, g, b) => { const c = (v) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); }; return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b); };
function stats(file) {
  if (!fs.existsSync(file)) return null;
  const p = PNG.sync.read(fs.readFileSync(file));
  const v = new Float64Array(p.width * p.height);
  for (let i = 0; i < v.length; i++) { const o = i * 4; v[i] = lum(p.data[o], p.data[o + 1], p.data[o + 2]); }
  let mean = 0, peak = 0; const levels = new Set();
  for (let i = 0; i < v.length; i++) { mean += v[i]; if (v[i] > peak) peak = v[i]; levels.add(Math.round(v[i] * 255)); }
  mean /= v.length;
  // mid-row second difference (edge energy): posterised upscales soften this
  let rough = 0, n = 0;
  const y = Math.floor(p.height / 2);
  for (let x = 2; x < p.width - 2; x++) { const a = v[y * p.width + x - 2], b = v[y * p.width + x], c = v[y * p.width + x + 2]; rough += Math.abs(a - 2 * b + c); n++; }
  // whole-image horizontal gradient energy
  let grad = 0, gn = 0;
  for (let yy = 0; yy < p.height; yy += 3) for (let xx = 1; xx < p.width; xx += 3) { grad += Math.abs(v[yy * p.width + xx] - v[yy * p.width + xx - 1]); gn++; }
  return { w: p.width, h: p.height, mean: +mean.toFixed(4), peak: +peak.toFixed(4), distinctLevels: levels.size,
    midRowRoughness: +(rough / n).toFixed(6), gradEnergy: +(grad / gn).toFixed(6) };
}
const rows = [];
for (const scene of ['hero-atmosphere', 'about-field', 'career-strata', 'skills-bench', 'vitrine-field', 'listen-field']) {
  rows.push({ scene, before: stats(path.join(OLD, `glforce-1440-${scene}.png`)), after: stats(path.join(OUT, `glforce-1440-${scene}.png`)) });
}
fs.writeFileSync(path.join(OUT, 'compare-before-after.json'), JSON.stringify(rows, null, 2));
for (const r of rows) {
  const b = r.before, a = r.after;
  console.log(`${r.scene.padEnd(16)} before ${b ? `${b.w}x${b.h} mean=${b.mean} peak=${b.peak} levels=${b.distinctLevels} rough=${b.midRowRoughness} grad=${b.gradEnergy}` : 'n/a'}`);
  console.log(`${''.padEnd(16)} after  ${a ? `${a.w}x${a.h} mean=${a.mean} peak=${a.peak} levels=${a.distinctLevels} rough=${a.midRowRoughness} grad=${a.gradEnergy}` : 'n/a'}`);
}
