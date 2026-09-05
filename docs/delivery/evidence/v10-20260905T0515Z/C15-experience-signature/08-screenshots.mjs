/**
 * The instrument that produced `03-probe.json` and `08-screens/*.png`.
 *
 * Run from the repo root with the static export served on :5601:
 *
 *   npm run build:static
 *   python3 -m http.server 5601 --directory out --bind 127.0.0.1 &
 *   node docs/delivery/evidence/v10-20260905T0515Z/C15-experience-signature/08-screenshots.mjs
 *   fuser -k 5601/tcp
 *
 * This host has no GPU, so the SwiftShader flags plus `?gl=force` are the only
 * way to compile the shader at all — see `components/gl/useGLCapability.ts`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const BASE = 'http://127.0.0.1:5601';
const OUT = 'docs/delivery/evidence/v10-20260905T0515Z/C15-experience-signature/08-screens';
const GL_ARGS = [
  '--no-sandbox',
  '--use-gl=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', args: GL_ARGS });

async function shoot(page, name) {
  const chart = page.locator('#experience [data-chart]');
  await chart.screenshot({ path: `${OUT}/${name}.png`, scale: 'css' });
}

async function settle(page) {
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#experience [data-chart]').scrollIntoViewIfNeeded();
}

for (const width of [1440, 1280, 834, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'load' });
  await settle(page);
  await page.waitForTimeout(3000);
  await shoot(page, `${width}-experience`);
  await page.close();
}

// A frame mid-entry: the beat caught at ~300 ms, bars part-grown.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#experience [data-chart]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const scales = await page.evaluate(() =>
    Array.from(document.querySelectorAll('#experience [class*="trackBar"]')).map((bar) => {
      const t = getComputedStyle(bar).transform;
      const m = t.match(/matrix\(([^)]+)\)/);
      return m ? Number(parseFloat(m[1].split(',')[0]).toFixed(3)) : 1;
    }),
  );
  await page.locator('#experience [data-chart]').screenshot({
    path: `${OUT}/1440-experience-mid-entry-300ms.png`,
    scale: 'css',
  });
  console.log('mid-entry scaleX at ~300 ms:', JSON.stringify(scales));
  await page.close();
}

// Reduced motion: no canvas, no scaleX, chart readable.
{
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'load' });
  await settle(page);
  await page.waitForTimeout(1500);
  await shoot(page, '1440-experience-reduced-motion');
  await page.close();
}

// The probe, at ?gl=force, with the shader actually compiled.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'load' });
  await settle(page);
  await page.waitForTimeout(4000);

  const probe = await page.evaluate(() => {
    const section = document.querySelector('#experience');
    const canvases = Array.from(section.querySelectorAll('canvas'));
    const field = section.querySelector('[data-track-field]');
    const bars = Array.from(section.querySelectorAll('[class*="trackBar"]'));
    const chart = section.querySelector('[data-chart]');
    const playhead = section.querySelector('[data-playhead]');
    const gl = canvases[0]?.getContext('webgl2') || canvases[0]?.getContext('webgl');
    const dbg = gl?.getExtension('WEBGL_debug_renderer_info');
    return {
      canvasesInExperience: canvases.length,
      canvasSize: canvases[0]
        ? { w: canvases[0].width, h: canvases[0].height, cssW: canvases[0].clientWidth }
        : null,
      devicePixelRatio: window.devicePixelRatio,
      renderer: dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : null,
      entered: field?.hasAttribute('data-entered') ?? null,
      barTransforms: bars.map((b) => getComputedStyle(b).transform),
      barFill: bars.map((b) => {
        const cs = getComputedStyle(b, '::before');
        return { background: cs.backgroundColor, opacity: cs.opacity };
      }),
      playheadColour: playhead ? getComputedStyle(playhead).color : null,
      playheadRight: playhead ? Math.round(playhead.getBoundingClientRect().right) : null,
      chartRight: chart ? Math.round(chart.getBoundingClientRect().right) : null,
      goldInSection: Array.from(section.querySelectorAll('*')).filter((el) => {
        const cs = getComputedStyle(el);
        return [cs.color, cs.backgroundColor, cs.fill, cs.stroke].some((v) =>
          String(v).includes('rgb(201, 168, 76)'),
        );
      }).length,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    };
  });

  // Frame rate over three seconds with the scene live, no scrolling.
  const fps = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let frames = 0;
        const t0 = performance.now();
        const tick = () => {
          frames += 1;
          if (performance.now() - t0 >= 3000) {
            resolve(Number(((frames * 1000) / (performance.now() - t0)).toFixed(1)));
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );

  writeFileSync(
    'docs/delivery/evidence/v10-20260905T0515Z/C15-experience-signature/03-probe.json',
    `${JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        url: `${BASE}/?gl=force`,
        host: 'VPS srv1356245 — no GPU; SwiftShader forced via ?gl=force + chromium flags',
        fpsNote:
          'rAF frame rate on a software rasteriser. Recorded, never quoted as an R2 60 fps measurement (SPEC-v10 §0).',
        rafFps: fps,
        consoleErrors,
        ...probe,
      },
      null,
      2,
    )}\n`,
  );
  console.log('probe canvases:', probe.canvasesInExperience, 'gold:', probe.goldInSection, 'fps:', fps);
  await page.close();
}

await browser.close();
