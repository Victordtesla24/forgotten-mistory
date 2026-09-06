import { chromium } from 'playwright';
const EXE = '/opt/ms-playwright/chromium-1234/chrome-linux64/chrome';
async function trial(name, args, url) {
  const b = await chromium.launch({ executablePath: EXE, headless: true, args });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const logs = []; p.on('console', m => logs.push(m.type()+':'+m.text().slice(0,160))); p.on('pageerror', e => logs.push('ERR:'+String(e).slice(0,160)));
  // Raw WebGL capability in this browser, before the site's own guards.
  const raw = await p.evaluate(() => {
    const c = document.createElement('canvas');
    const g2 = c.getContext('webgl2'); const g1 = c.getContext('webgl');
    const g = g2 || g1; let renderer = null;
    if (g) { const ext = g.getExtension('WEBGL_debug_renderer_info'); renderer = ext ? g.getParameter(ext.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.VERSION); }
    return { webgl2: !!g2, webgl: !!g1, renderer };
  }).catch(e => ({ err: String(e) }));
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2000);
  const top = await p.evaluate(() => document.querySelectorAll('canvas').length);
  await p.evaluate(() => document.querySelector('#about')?.scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(3000);
  const afterAbout = await p.evaluate(() => document.querySelectorAll('canvas').length);
  const anyCanvasInfo = await p.evaluate(() => [...document.querySelectorAll('canvas')].map(c => ({ w: c.width, h: c.height, cls: c.className, parent: c.parentElement?.getAttribute('data-scene') || c.parentElement?.className })));
  console.log('== TRIAL', name, '==');
  console.log(JSON.stringify({ raw, canvasesAtTop: top, canvasesAtAbout: afterAbout, anyCanvasInfo, glLogs: logs.filter(l=>/webgl|gl|context|three|scene/i.test(l)).slice(0,8) }, null, 2));
  await b.close();
}
const base = ['--no-sandbox'];
await trial('default-swiftshader', ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',...base], 'https://forgotten-mistory.web.app/');
await trial('glforce', ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',...base], 'https://forgotten-mistory.web.app/?gl=force#about');
