// G-REV phase 3b — targeted ?gl=force canvas probe. Phase 2 recorded 1 canvas at
// 1440 ?gl=force (measured after scrolling to #about); probe3 recorded 0 with the
// same method. This isolates fold-anchored vs scrolled counts and asks the page
// itself whether WebGL is available, so the difference can be attributed rather
// than asserted. Read-only.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.dirname(new URL(import.meta.url).pathname);
const CHROME = process.env.CHROME_BIN || '/usr/bin/google-chrome';
const out = {};

for (const [label, vp] of [['1440', { width: 1440, height: 900 }], ['390', { width: 390, height: 844 }]]) {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const pageerrors = [];
  page.on('pageerror', (e) => pageerrors.push(String(e)));
  const resp = await page.goto('https://forgotten-mistory.web.app/?gl=force', { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 2500)));

  const snap = () => ({
    canvases: [...document.querySelectorAll('canvas')].map((c) => ({
      w: c.width, h: c.height,
      section: c.closest('section[id]')?.id || null,
      rect: (({ width, height }) => ({ width, height }))(c.getBoundingClientRect()),
    })),
    scrollY: window.scrollY,
  });

  const atFold = await page.evaluate(snap);
  // does the browser itself offer a WebGL context at all?
  const glSupport = await page.evaluate(() => {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return { context: null };
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      context: gl instanceof WebGL2RenderingContext ? 'webgl2' : 'webgl',
      vendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
      renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    };
  });

  await page.locator('#experience').scrollIntoViewIfNeeded().catch(() => {});
  await page.evaluate(() => new Promise((r) => setTimeout(r, 2000)));
  const atExperience = await page.evaluate(snap);

  await page.locator('#about').scrollIntoViewIfNeeded().catch(() => {});
  await page.evaluate(() => new Promise((r) => setTimeout(r, 1500)));
  const atAbout = await page.evaluate(snap);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => new Promise((r) => setTimeout(r, 2000)));
  const backAtFold = await page.evaluate(snap);

  out[label] = { status: resp.status(), pageerrors, glSupport, atFold, atExperience, atAbout, backAtFold };
  await page.screenshot({ path: path.join(OUT, `${label}-glforce-fold.png`), clip: { x: 0, y: 0, width: vp.width, height: Math.min(vp.height, 900) } });
  await ctx.close(); await browser.close();
  fs.writeFileSync(path.join(OUT, 'probe3b-gl.json'), JSON.stringify(out, null, 2));
  process.stderr.write(`${label}: fold=${atFold.canvases.length} exp=${atExperience.canvases.length} about=${atAbout.canvases.length} back=${backAtFold.canvases.length} gl=${glSupport.context} renderer=${glSupport.renderer}\n`);
}
process.stderr.write('DONE\n');
