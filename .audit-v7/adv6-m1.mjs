import { chromium } from '@playwright/test';

const GOLD = 'rgb(201, 168, 76)';
const PROPS = ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'fill', 'stroke'];

const b = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });

async function probe(url, vw, vh) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh }, reducedMotion: 'no-preference' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e).slice(0, 140)));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text().slice(0, 140)); });
  const resp = await p.goto(url, { waitUntil: 'networkidle' });
  const status = resp ? resp.status() : null;
  const target = await p.$('#listen');
  if (target) { await target.scrollIntoViewIfNeeded(); await p.waitForTimeout(1500); }
  const r = await p.evaluate(({ GOLD, PROPS }) => {
    const goldHits = [];
    const scan = (root, label) => {
      if (!root) return;
      for (const el of root.querySelectorAll('*')) {
        const cs = getComputedStyle(el);
        for (const prop of PROPS) {
          if (cs[prop] === GOLD) {
            const bb = el.getBoundingClientRect();
            goldHits.push({ label, tag: el.tagName, cls: String(el.className || '').slice(0, 46), prop, w: Math.round(bb.width), h: Math.round(bb.height), ariaHidden: el.getAttribute('aria-hidden'), opacity: cs.opacity });
            break;
          }
        }
      }
    };
    const s = document.querySelector('#listen');
    scan(s, '#listen');
    scan(document.querySelector('footer'), 'footer');
    const anchors = Array.from(document.querySelectorAll('a'));
    const href = (a) => a.getAttribute('href') || '';
    const rect = s ? s.getBoundingClientRect() : null;
    const contrast = (fg, bgEl) => {
      const parse = (c) => c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
      const lum = (rgb) => { const a = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
      let bg = 'rgba(0, 0, 0, 0)'; let el = bgEl;
      while (el && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) { bg = getComputedStyle(el).backgroundColor; el = el.parentElement; }
      const l1 = lum(parse(fg)); const l2 = lum(parse(bg));
      return { ratio: +(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2)), bg };
    };
    const footer = document.querySelector('footer');
    const sepInfo = footer ? Array.from(footer.querySelectorAll('span')).filter((e) => e.textContent.trim() === '·').map((e) => { const cs = getComputedStyle(e); const bb = e.getBoundingClientRect(); return { color: cs.color, ariaHidden: e.getAttribute('aria-hidden'), w: Math.round(bb.width), h: Math.round(bb.height), ...contrast(cs.color, e.parentElement) }; }) : [];
    const bot = document.querySelector('[data-testid="minivic-toggle"]');
    return {
      status: null,
      listenExists: !!s,
      contactExists: !!document.querySelector('#contact'),
      htmlCount: document.querySelectorAll('html').length,
      bodyCount: document.querySelectorAll('body').length,
      hasMain: !!document.querySelector('main#main'),
      hasFooter: !!footer,
      hasNav: !!document.querySelector('nav'),
      interactives: s ? Array.from(s.querySelectorAll('a,button,input,textarea,select,[role="radio"],[role="button"],[tabindex]')).map((e) => e.tagName + ':' + (e.getAttribute('href') || '')) : [],
      canvasesInSection: s ? s.querySelectorAll('canvas').length : null,
      svgsInSection: s ? s.querySelectorAll('svg').length : null,
      words: s ? s.innerText.trim().split(/\s+/).length : null,
      box: rect ? { w: Math.round(rect.width), h: Math.round(rect.height), y: Math.round(rect.y + window.scrollY) } : null,
      sectionHeights: ['#hero', '#about', '#experience', '#skills', '#vitrine', '#listen'].map((id) => { const e = document.querySelector(id); return id + '=' + (e ? Math.round(e.getBoundingClientRect().height) : 'MISSING'); }),
      docH: Math.round(document.documentElement.scrollHeight),
      goldHits,
      goldSiteWide: (() => { let n = 0; for (const el of document.querySelectorAll('*')) { const cs = getComputedStyle(el); if (PROPS.some((pp) => cs[pp] === GOLD)) n++; } return n; })(),
      mailtos: anchors.filter((a) => href(a).startsWith('mailto:')).map((a) => (a.closest('section') || {}).id || (a.closest('footer') ? 'FOOTER' : (a.closest('nav') ? 'NAV' : 'OTHER'))),
      tels: anchors.filter((a) => href(a).startsWith('tel:')).length,
      linkedins: anchors.filter((a) => href(a).includes('linkedin.com')).length,
      githubs: anchors.filter((a) => href(a).includes('github.com')).length,
      downloads: Array.from(document.querySelectorAll('a[download]')).map((a) => a.getAttribute('href')),
      cvAnchors: anchors.filter((a) => href(a).includes('Vik_Resume')).map((a) => (a.className || '') + '|dl=' + a.hasAttribute('download')),
      dataContactRoute: document.querySelectorAll('[data-contact-route]').length,
      dataGold: document.querySelectorAll('[data-gold]').length,
      sourced: document.querySelectorAll('[data-state="sourced"]').length,
      calipers: document.querySelectorAll('[data-caliper], [class*="aliper"]').length,
      allRights: (document.body.innerText.match(/All rights reserved/gi) || []).length,
      likeness: (document.body.innerText.match(/model-generated likeness|cloned/gi) || []).length,
      noAnalytics: (document.body.innerText.match(/no analytics/gi) || []).length,
      forms: document.querySelectorAll('form').length,
      inputs: document.querySelectorAll('input,textarea,select').length,
      iframes: document.querySelectorAll('iframe').length,
      conversationHome: document.querySelectorAll('#conversation-home').length,
      botPosition: bot ? getComputedStyle(bot.parentElement).position + '/' + getComputedStyle(bot.parentElement.parentElement || bot.parentElement).position : null,
      sepInfo,
      inSiteAnchors: Array.from(new Set(anchors.map(href).filter((h) => h.startsWith('/') || h.startsWith('#')))).slice(0, 20),
      bodyFont: getComputedStyle(document.body).fontFamily,
      notFoundFont: document.querySelector('.notfound-page') ? getComputedStyle(document.querySelector('.notfound-page')).fontFamily : null,
      notFoundText: document.querySelector('.notfound-page') ? document.querySelector('.notfound-page').innerText.slice(0, 200) : null,
      // geometry below the rule
      geom: (() => {
        if (!s) return null;
        const inner = s.firstElementChild;
        const out = {};
        if (inner) { const bb = inner.getBoundingClientRect(); out.inner = { x: Math.round(bb.x), w: Math.round(bb.width) }; }
        for (const sel of ['p', 'h2', 'span', 'ul', 'li', 'a']) {
          out[sel] = Array.from(s.querySelectorAll(sel)).map((e) => { const bb = e.getBoundingClientRect(); return Math.round(bb.width) + 'x' + Math.round(bb.height) + '@' + Math.round(bb.y); }).slice(0, 8);
        }
        return out;
      })(),
    };
  }, { GOLD, PROPS });
  r.status = status;
  r.errs = errs;
  await ctx.close();
  return r;
}

const out = {};
out['home-1440'] = await probe('https://forgotten-mistory.web.app/', 1440, 900);
out['home-390'] = await probe('https://forgotten-mistory.web.app/', 390, 844);
out['privacy'] = await probe('https://forgotten-mistory.web.app/privacy', 1440, 900);
out['terms'] = await probe('https://forgotten-mistory.web.app/terms', 1440, 900);
out['404'] = await probe('https://forgotten-mistory.web.app/nonexistent-adv-check', 1440, 900);
console.log(JSON.stringify(out, null, 1));
await b.close();
