// R-c13 merge lens — independent re-verification on the CURRENT live build.
// Settles: (a) does the crash still reproduce on the live build (?gl=force + spoofed hardware GPU)?
// (b) does the MiniVic panel open (composition CC-03 says no, motion says yes)?
// (c) #listen engagement CTA count (CC-02), (d) per-section canvas/svg counts (ADV-2 vs R2).
import { chromium } from 'playwright';
import fs from 'node:fs';

const URL = 'https://forgotten-mistory.web.app/';
const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/R-c13';
const out = { startedAt: new Date().toISOString() };

const GPU_SPOOF = () => {
  const patch = (proto) => {
    if (!proto) return;
    const orig = proto.getParameter;
    proto.getParameter = function (p) {
      if (p === 0x9246) return 'ANGLE (Apple, Apple M2 Pro, OpenGL 4.1)';
      if (p === 0x9245) return 'Google Inc. (Apple)';
      return orig.call(this, p);
    };
    const ext = proto.getExtension;
    proto.getExtension = function (n) {
      if (n === 'WEBGL_debug_renderer_info') return { UNMASKED_RENDERER_WEBGL: 0x9246, UNMASKED_VENDOR_WEBGL: 0x9245 };
      return ext.call(this, n);
    };
  };
  patch(window.WebGLRenderingContext && window.WebGLRenderingContext.prototype);
  patch(window.WebGL2RenderingContext && window.WebGL2RenderingContext.prototype);
};

const SECTIONS = ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen'];

async function probe(ctx, url, label, opts = {}) {
  const page = await ctx.newPage();
  const ce = [], pe = [];
  page.on('console', (m) => { if (m.type() === 'error') ce.push(m.text().slice(0, 240)); });
  page.on('pageerror', (e) => pe.push(String(e).slice(0, 240)));
  if (opts.spoof) await page.addInitScript(GPU_SPOOF);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2200);
  const r = await page.evaluate((SECS) => {
    const meta = document.querySelector('meta[name="build-commit"]');
    const secs = [...document.querySelectorAll('section[id]')].map((s) => s.id);
    const per = {};
    for (const id of SECS) {
      const el = document.getElementById(id);
      per[id] = el ? { canvas: el.querySelectorAll('canvas').length, svg: el.querySelectorAll('svg').length } : null;
    }
    return {
      buildCommit: meta ? meta.getAttribute('content') : null,
      h1: (document.querySelector('h1') || {}).textContent || null,
      sections: secs,
      sectionCount: secs.length,
      canvasTotal: document.querySelectorAll('canvas').length,
      errorBoundary: /SYSTEM INTERRUPT|Something went wrong/i.test(document.body.innerText),
      per,
    };
  }, SECTIONS);
  r.consoleErrors = ce.slice(0, 6);
  r.consoleErrorCount = ce.length;
  r.pageErrors = pe.slice(0, 4);
  out[label] = r;
  if (opts.shot) await page.screenshot({ path: `${OUT}/capture/${opts.shot}` }).catch(() => {});
  if (opts.keep) return page;
  await page.close();
  return null;
}

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
try {
  // 1) default path, hardware-GPU spoof (what a real laptop gets)
  const c1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await probe(c1, URL, 'gpuSpoof1440', { spoof: true, shot: 'merge-1440-hardware-gpu.png' });
  await c1.close();

  // 2) ?gl=force
  const c2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await probe(c2, URL + '?gl=force', 'glForce1440', {});
  await c2.close();

  // 3) plain default path (software raster fallback) — section elements + MiniVic + #listen
  const c3 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await probe(c3, URL, 'default1440', { keep: true });

  // scroll every section into view so lazy scenes mount
  for (const id of SECTIONS) {
    await page.evaluate((i) => document.getElementById(i)?.scrollIntoView({ block: 'center' }), id);
    await page.waitForTimeout(900);
  }
  out.afterScroll = await page.evaluate((SECS) => {
    const per = {};
    for (const id of SECS) {
      const el = document.getElementById(id);
      per[id] = el ? { canvas: el.querySelectorAll('canvas').length, svg: el.querySelectorAll('svg').length } : null;
    }
    return { per, canvasTotal: document.querySelectorAll('canvas').length };
  }, SECTIONS);

  // #listen interactive inventory (CC-02)
  out.listen = await page.evaluate(() => {
    const l = document.getElementById('listen');
    if (!l) return null;
    return [...l.querySelectorAll('a,button')].map((e) => {
      const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      return {
        tag: e.tagName, text: (e.innerText || '').trim().slice(0, 60), href: e.getAttribute('href') || null,
        bg: cs.backgroundColor, color: cs.color, fs: cs.fontSize, border: cs.borderWidth,
        h: +r.height.toFixed(1), w: +r.width.toFixed(1),
      };
    });
  });

  // MiniVic launcher DOM (CC-03 half a)
  out.minivicClosed = await page.evaluate(() => {
    const t = document.querySelector('[data-testid="minivic-toggle"]');
    if (!t) return null;
    const r = t.getBoundingClientRect();
    const vids = [...t.querySelectorAll('video')].map((v) => ({
      src: v.getAttribute('src'), currentSrc: v.currentSrc, poster: v.getAttribute('poster'),
      sources: v.querySelectorAll('source').length, readyState: v.readyState,
    }));
    return {
      rect: { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
      ariaLabel: t.getAttribute('aria-label'), innerText: (t.innerText || '').trim(),
      svgCount: t.querySelectorAll('svg').length, imgCount: t.querySelectorAll('img').length,
      videos: vids, html: t.innerHTML.slice(0, 500),
    };
  });

  // open the panel and enumerate what appeared (CC-03 half b vs motion)
  const before = await page.evaluate(() => document.querySelectorAll('*').length);
  await page.click('[data-testid="minivic-toggle"]').catch(() => {});
  await page.waitForTimeout(2600);
  out.minivicOpen = await page.evaluate((before) => {
    const after = document.querySelectorAll('*').length;
    // any large fixed/absolute box that is not the toggle
    const boxes = [...document.querySelectorAll('body *')].filter((e) => {
      const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      return (cs.position === 'fixed' || cs.position === 'absolute') && r.width > 240 && r.height > 240 &&
        cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[data-testid="minivic-toggle"]');
    }).map((e) => {
      const r = e.getBoundingClientRect();
      return {
        tag: e.tagName, cls: (e.className || '').toString().slice(0, 90),
        role: e.getAttribute('role'), testid: e.getAttribute('data-testid'),
        ariaModal: e.getAttribute('aria-modal'), ariaLabel: e.getAttribute('aria-label'),
        rect: { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
        txt: (e.innerText || '').trim().slice(0, 120),
      };
    });
    const vids = [...document.querySelectorAll('video')].map((v) => ({
      src: v.getAttribute('src'), currentSrc: v.currentSrc, paused: v.paused, readyState: v.readyState,
    }));
    const canvases = [...document.querySelectorAll('canvas')].map((c) => ({ w: c.width, h: c.height, cls: (c.className || '').toString().slice(0, 60) }));
    return {
      domBefore: before, domAfter: after, delta: after - before,
      dialogByRole: document.querySelectorAll('[role="dialog"]').length,
      byTestid: document.querySelectorAll('[data-testid*="minivic"]').length,
      toggleStillVisible: !!document.querySelector('[data-testid="minivic-toggle"]')?.checkVisibility?.(),
      togglePressed: document.querySelector('[data-testid="minivic-toggle"]')?.getAttribute('aria-expanded'),
      bigBoxes: boxes.slice(0, 8), videos: vids, canvases,
      bodyTextTail: document.body.innerText.slice(-400),
    };
  }, before);
  await page.screenshot({ path: `${OUT}/capture/merge-1440-minivic-open.png` }).catch(() => {});
  await c3.close();
} finally {
  await browser.close();
}
out.finishedAt = new Date().toISOString();
fs.writeFileSync(`${OUT}/merge-probe.json`, JSON.stringify(out, null, 2));
console.log(JSON.stringify({
  gpuSpoof: { h1: out.gpuSpoof1440?.h1, sections: out.gpuSpoof1440?.sectionCount, boundary: out.gpuSpoof1440?.errorBoundary, ce: out.gpuSpoof1440?.consoleErrorCount, build: out.gpuSpoof1440?.buildCommit },
  glForce: { h1: out.glForce1440?.h1, sections: out.glForce1440?.sectionCount, boundary: out.glForce1440?.errorBoundary, ce: out.glForce1440?.consoleErrorCount },
  def: { h1: out.default1440?.h1, sections: out.default1440?.sectionCount, canvas: out.default1440?.canvasTotal, build: out.default1440?.buildCommit },
  afterScroll: out.afterScroll,
  listenCount: out.listen?.length,
  minivicOpen: { delta: out.minivicOpen?.delta, dialogs: out.minivicOpen?.dialogByRole, boxes: out.minivicOpen?.bigBoxes?.length, canvases: out.minivicOpen?.canvases?.length },
}, null, 2));
