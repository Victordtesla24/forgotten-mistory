import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://127.0.0.1:5601';
const WIDTHS = [
  { w: 1440, h: 900, label: '1440' },
  { w: 390, h: 844, label: '390' },
];

const measure = () => {
  const host = document.querySelector('[class*="fieldViewport"]');
  const stage = document.querySelector('[class*="instrumentStage"]');
  const caption = document.querySelector('[class*="instrumentCaption"]');
  const list = document.querySelector('ol[class*="list"]');
  if (!host || !stage || !caption || !list) return { error: 'missing node' };
  const hostRect = host.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  const capRect = caption.getBoundingClientRect();
  const listRect = list.getBoundingClientRect();
  const clamp = (v) => Math.min(Math.max(v, 0), 1);
  const centre = [
    clamp((stageRect.left + stageRect.width / 2 - hostRect.left) / hostRect.width),
    clamp(1 - (stageRect.top + stageRect.height / 2 - hostRect.top) / hostRect.height),
  ];
  const roseRadius = Math.max(stageRect.width / hostRect.height, 0.001);
  const guard = {
    x: (listRect.left - hostRect.left) / hostRect.width,
    y: 1 - (listRect.top - hostRect.top) / hostRect.height,
    z: 1 - (capRect.top - hostRect.top) / hostRect.height,
  };
  return {
    hostRect: { w: hostRect.width, h: hostRect.height, top: hostRect.top, left: hostRect.left },
    stageRect: { w: stageRect.width, h: stageRect.height, top: stageRect.top },
    capTop: capRect.top, listTop: listRect.top, listLeft: listRect.left,
    centre, roseRadius, guard,
    canvases: document.querySelectorAll('#about canvas').length,
  };
};

const smoothstep = (e0, e1, x) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};

function guardMask(m, W, H) {
  // returns fn(u,v) -> guarded
  const { guard } = m;
  return (u, v) => {
    const toRight = smoothstep(guard.x - 0.12, guard.x, u);
    const belowList = smoothstep(guard.y + 0.12, guard.y, v);
    const reading = Math.min(toRight, belowList);
    const caption = smoothstep(guard.z + 0.10, guard.z, v);
    return Math.max(reading, caption);
  };
}

function sampleBand(m, W, H, rrLo, rrHi) {
  const g = guardMask(m, W, H);
  const aspect = W / H;
  const per = [];
  let all = [];
  let off = 0;
  let total = 0;
  for (let s = 0; s < 10; s++) {
    const vals = [];
    for (let ri = 0; ri < 7; ri++) {
      const rr = rrLo + (rrHi - rrLo) * (ri / 6);
      const r = rr * m.roseRadius;
      for (let ai = 0; ai < 32; ai++) {
        const within = 0.06 + (0.88 * ai) / 31;
        const a = ((s - 0.5 + within) / 10) * Math.PI * 2;
        // p = (uv - centre) * vec2(aspect,1) * 2 ; a = atan(p.x, p.y)
        const px = r * Math.sin(a);
        const py = r * Math.cos(a);
        const u = m.centre[0] + px / (2 * aspect);
        const v = m.centre[1] + py / 2;
        if (u < 0 || u > 1 || v < 0 || v > 1) { off += 1; continue; } // outside the plane: not guarded, absent
        vals.push(g(u, v));
      }
    }
    total += 7 * 32;
    const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    per.push(mean);
    all = all.concat(vals);
  }
  const mean = all.length ? all.reduce((a, b) => a + b, 0) / all.length : 0;
  const unguardedFrac = all.length ? all.filter((x) => x < 0.05).length / all.length : 0;
  return { per, mean, unguardedFrac, offPlaneFrac: off / total };
}

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const out = {};
for (const { w, h, label } of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.evaluate(() => document.querySelector('#about')?.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(1200);
  const m = await page.evaluate(measure);
  if (m.error) { out[label] = m; await ctx.close(); continue; }
  const ring = sampleBand(m, w, h, 0.40, 0.96);
  const fan = sampleBand(m, w, h, 1.12, 1.60);
  out[label] = { m, ring, fan };
  await ctx.close();
}
await browser.close();

for (const [label, o] of Object.entries(out)) {
  if (o.error) { console.log(`[${label}] ${o.error}`); continue; }
  const { m, ring, fan } = o;
  console.log(`\n=== ${label} at rest ===`);
  console.log(`host ${m.hostRect.w.toFixed(0)}x${m.hostRect.h.toFixed(0)}  stage ${m.stageRect.w.toFixed(0)}  canvases=${m.canvases}`);
  console.log(`centre=(${m.centre[0].toFixed(4)}, ${m.centre[1].toFixed(4)}) roseRadius=${m.roseRadius.toFixed(4)}`);
  console.log(`guard.x=${m.guard.x.toFixed(4)} guard.y=${m.guard.y.toFixed(4)} guard.z=${m.guard.z.toFixed(4)}`);
  console.log(`RING  rr 0.40-0.96  mean guarded=${ring.mean.toFixed(4)}  unguarded fraction=${(ring.unguardedFrac * 100).toFixed(1)}%  off-plane=${(ring.offPlaneFrac * 100).toFixed(1)}%`);
  console.log(`  per-sector guarded: ${ring.per.map((x) => x.toFixed(3)).join(' ')}`);
  console.log(`FAN   rr 1.12-1.60  mean guarded=${fan.mean.toFixed(4)}  unguarded fraction=${(fan.unguardedFrac * 100).toFixed(1)}%  off-plane=${(fan.offPlaneFrac * 100).toFixed(1)}%`);
  console.log(`  per-sector guarded: ${fan.per.map((x) => x.toFixed(3)).join(' ')}`);
}
