import { chromium, devices } from '@playwright/test';
const b = await chromium.launch({ channel: 'chrome' });
const c = await b.newContext({ ...devices['iPhone 13'] });
const p = await c.newPage();
// throttle to Fast 3G-ish 4G
const cdp = await c.newCDPSession(p);
await cdp.send('Network.emulateNetworkConditions', { offline:false, downloadThroughput: 1.6*1024*1024/8, uploadThroughput: 750*1024/8, latency: 150 });
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
const byType = {};
const reqs = [];
p.on('response', async (r) => {
  reqs.push({ url: r.url().split('/').pop(), t: Date.now(), status: r.status(), len: Number(r.headers()['content-length']||0), type: (r.headers()['content-type']||'').split(';')[0] });
  try {
    const h = r.headers();
    const len = Number(h['content-length'] || 0);
    const t = (h['content-type']||'').split(';')[0] || 'other';
    byType[t] = (byType[t]||0) + len;
  } catch {}
});
const t0 = Date.now();
await p.goto('https://forgotten-mistory.web.app/', { waitUntil: 'load' });
const vitals = await p.evaluate(() => new Promise((res) => {
  const out = { lcp: 0, cls: 0, fcp: 0 };
  new PerformanceObserver((l) => { for (const e of l.getEntries()) out.lcp = Math.round(e.startTime); }).observe({ type:'largest-contentful-paint', buffered:true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) out.cls += e.value; }).observe({ type:'layout-shift', buffered:true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name==='first-contentful-paint') out.fcp = Math.round(e.startTime); }).observe({ type:'paint', buffered:true });
  setTimeout(() => res(out), 5000);
}));
console.log('load wall time (4x CPU, 1.6Mbps):', Date.now()-t0, 'ms');
console.log('FCP', vitals.fcp, 'ms | LCP', vitals.lcp, 'ms | CLS', vitals.cls.toFixed(4));
console.log('--- transfer by type (content-length) ---');
Object.entries(byType).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k.padEnd(28)} ${(v/1024).toFixed(1)} kB`));
console.log('--- requests in order ---');
reqs.forEach(r => console.log(`  +${String(r.t-t0).padStart(5)}ms  ${String((r.len/1024).toFixed(1)).padStart(7)}kB  ${r.type.padEnd(16)} ${r.url}`));
const lcpEl = await p.evaluate(() => { const e = performance.getEntriesByType('largest-contentful-paint').pop(); return e ? { el: e.element?.tagName + '.' + (e.element?.className||'').toString().slice(0,30), size: e.size, url: e.url } : null; });
console.log('LCP element:', JSON.stringify(lcpEl));
console.log('  TOTAL', (Object.values(byType).reduce((a,b)=>a+b,0)/1024).toFixed(1), 'kB');
await b.close();
