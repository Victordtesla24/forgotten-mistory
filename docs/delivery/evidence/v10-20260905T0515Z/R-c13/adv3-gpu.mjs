// R-c13 pass 3 — reproduce a REAL-GPU visitor. No query string.
// useGLCapability.ts:30-47 only declines WebGL when UNMASKED_RENDERER_WEBGL matches
// /swiftshader|llvmpipe|software|basic render/i. Spoof that string to a hardware GPU
// and the code path is byte-identical to a visitor on a MacBook / GeForce laptop.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://forgotten-mistory.web.app';
const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/R-c13';
const CAP = path.join(OUT, 'capture');

const SPOOF = `(() => {
  const FAKE = 'ANGLE (Apple, ANGLE Metal Renderer: Apple M2 Pro, Unspecified Version)';
  const FAKE_V = 'Google Inc. (Apple)';
  const patch = (proto) => {
    if (!proto) return;
    const gp = proto.getParameter;
    proto.getParameter = function (p) {
      // UNMASKED_RENDERER_WEBGL = 0x9246, UNMASKED_VENDOR_WEBGL = 0x9245
      if (p === 0x9246) return FAKE;
      if (p === 0x9245) return FAKE_V;
      return gp.call(this, p);
    };
  };
  patch(window.WebGLRenderingContext && window.WebGLRenderingContext.prototype);
  patch(window.WebGL2RenderingContext && window.WebGL2RenderingContext.prototype);
})();`;

const R = { generatedAt: new Date().toISOString(), method: 'UNMASKED_RENDERER_WEBGL spoofed to a hardware GPU string; no query parameters' };

async function run(browser, w, h, name, shot) {
  const ce = [], pe = [], fr = [];
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.addInitScript(SPOOF);
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') ce.push(m.text().slice(0, 600)); });
  page.on('pageerror', (e) => pe.push(String(e).slice(0, 600)));
  page.on('requestfailed', (r) => fr.push({ url: r.url().slice(0, 180), err: r.failure()?.errorText }));
  page.on('response', (r) => { if (r.status() >= 400) fr.push({ url: r.url().slice(0, 180), status: r.status() }); });

  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(5000);
  const d = await page.evaluate(() => ({
    rendererSeenByPage: (() => { try { const c = document.createElement('canvas'); const g = c.getContext('webgl2') || c.getContext('webgl');
      const x = g && g.getExtension('WEBGL_debug_renderer_info'); return x ? String(g.getParameter(x.UNMASKED_RENDERER_WEBGL)) : 'no-ext'; } catch (e) { return 'err'; } })(),
    h1: document.querySelector('h1')?.textContent?.trim() || null,
    sectionCount: document.querySelectorAll('section[id]').length,
    sectionIds: [...document.querySelectorAll('section[id]')].map((s) => s.id),
    canvasTotal: document.querySelectorAll('canvas').length,
    errorBoundary: /SYSTEM INTERRUPT|Something went wrong|unexpected error occurred/i.test(document.body.innerText),
    bodyHead: document.body.innerText.trim().slice(0, 260),
  }));
  if (shot) await page.screenshot({ path: path.join(CAP, shot) });
  await ctx.close();
  return { name, ...d, ceCount: ce.length, ce: ce.slice(0, 4), peCount: pe.length, pe: pe.slice(0, 3), frCount: fr.length, fr };
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    R.runs = [];
    R.runs.push(await run(browser, 1440, 900, '1440x900-hardware-gpu', '1440x900-hardware-gpu.png'));
    console.error('[gpu 1440]', JSON.stringify({ h1: R.runs[0].h1, sections: R.runs[0].sectionCount, canvases: R.runs[0].canvasTotal, err: R.runs[0].errorBoundary, ce: R.runs[0].ceCount }));
    R.runs.push(await run(browser, 390, 844, '390x844-hardware-gpu', '390x844-hardware-gpu.png'));
    console.error('[gpu 390]', JSON.stringify({ h1: R.runs[1].h1, sections: R.runs[1].sectionCount, canvases: R.runs[1].canvasTotal, err: R.runs[1].errorBoundary, ce: R.runs[1].ceCount }));
    console.error('[renderer seen]', R.runs[0].rendererSeenByPage);
    console.error('[body]', JSON.stringify(R.runs[0].bodyHead));
  } catch (e) { R.fatal = String(e && e.stack || e); console.error('[FATAL]', R.fatal); }
  finally { await browser.close(); }
  fs.writeFileSync(path.join(OUT, 'adversarial-report-pass3-gpu.json'), JSON.stringify(R, null, 2));
  console.error('[written pass3]');
})();
