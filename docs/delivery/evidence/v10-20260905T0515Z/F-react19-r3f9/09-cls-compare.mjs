// Same measurement, same load window, two builds: this branch's local export and
// the live site (which is main, i.e. the next-14 / React-18 pin). Both run down
// the software-rasteriser fallback path on this GPU-less host, so they are
// comparable. Answers: is the footer layout shift this branch's, or pre-existing?
import { chromium } from 'playwright';
const ARGS = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
async function cls(url) {
  const b = await chromium.launch({ channel: 'chrome', args: ARGS });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    window.__s = [];
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__s.push({
          v: e.value, t: Math.round(e.startTime),
          src: (e.sources || []).map((s) => {
            const n = s.node; if (!n) return '(detached)';
            const tag = (n.tagName || n.nodeName || '').toLowerCase();
            const id = n.id ? '#' + n.id : '';
            const c = typeof n.className === 'string' && n.className.trim()
              ? '.' + n.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
            return tag + id + c;
          }),
        });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForLoadState('networkidle').catch(() => {});
  await p.waitForTimeout(6000);
  const s = await p.evaluate(() => window.__s);
  const commit = await p.evaluate(() => {
    const m = document.querySelector('meta[name="build-commit"]');
    return m ? m.content : null;
  });
  await b.close();
  return { url, buildCommit: commit, cls: Number(s.reduce((a, x) => a + x.v, 0).toFixed(4)), shifts: s };
}
const out = {
  loadavg: (await import('node:fs')).readFileSync('/proc/loadavg', 'utf8').trim(),
  local_branch: await cls('http://127.0.0.1:5603/'),
  live_main: await cls('https://forgotten-mistory.web.app/'),
};
console.log(JSON.stringify(out, null, 2));
