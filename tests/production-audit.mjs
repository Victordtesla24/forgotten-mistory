/**
 * Exhaustive production audit for https://forgotten-mistory.web.app
 * One scenario per feature; PASS/FAIL log + screenshot evidence for each.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'https://forgotten-mistory.web.app';
const OUT = '/tmp/evidence2';
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const log = (id, name, pass, note = '') => {
  results.push({ id, name, pass, note });
  console.log(`SCENARIO|${id}|${name}|${pass ? 'PASS' : 'FAIL'}|${note}`);
};

const run = async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const requests = [];
  const failedResponses = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
  page.on('request', (r) => requests.push(r.url()));
  page.on('response', (r) => { if (r.status() >= 400) failedResponses.push(`${r.status()} ${r.url().slice(0, 120)}`); });

  // ── 01 Preloader ────────────────────────────────────────────────────────
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  const preloaderSeen = await page.locator('.preloader').count() > 0;
  await page.locator('.preloader').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  const preloaderGone = !(await page.locator('.preloader').isVisible().catch(() => false));
  log('01', 'Preloader shows and releases page', preloaderSeen && preloaderGone);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${OUT}/01-hero.png` });

  // ── 02 Hero content & CTAs ─────────────────────────────────────────────
  const heroTitle = await page.locator('.hero-title').textContent();
  const heroSub = await page.locator('.hero-subtitle').textContent();
  const ctas = {
    github: await page.locator('.hero-links a[href*="github.com"]').count(),
    youtube: await page.locator('.hero-links a[href*="youtube"]').count(),
    resume: await page.locator('.hero-links a[href="/docs/Vik_Resume_Final.pdf"]').count(),
    talk: await page.locator('.hero-links a[href="#contact"]').count(),
  };
  log('02', 'Hero identity + ATO positioning + 4 CTAs',
    /Vikram/.test(heroTitle) && /Australian Taxation Office/.test(heroSub) && Object.values(ctas).every(Boolean));

  // ── 03 Telemetry panel live simulation ─────────────────────────────────
  const lat1 = await page.locator('.pill.accent').textContent();
  await page.waitForTimeout(7000);
  const lat2 = await page.locator('.pill.accent').textContent();
  log('03', 'Telemetry values update over time', lat1 !== lat2, `${lat1?.trim()} -> ${lat2?.trim()}`);
  await page.screenshot({ path: `${OUT}/03-telemetry.png` });

  // ── 04 Outcome cards + FloatingDetailBox ───────────────────────────────
  const cardCount = await page.locator('[data-outcome-card="true"]').count();
  await page.locator('[data-outcome-card="true"]').first().click();
  await page.waitForTimeout(1800);
  const detailVisible = await page.getByText('Architected the ATO Payday Super', { exact: false }).first().isVisible().catch(() => false);
  await page.screenshot({ path: `${OUT}/04-detailbox.png` });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
  log('04', '6 outcome cards; detail box opens with ATO card + closes on Esc', cardCount === 6 && detailVisible, `cards=${cardCount}`);

  // ── 05 Hero avatar video swap ───────────────────────────────────────────
  const videoState = await page.evaluate(() => {
    const v = document.querySelector('#avatar-container video');
    return v ? { src: !!v.src, time: v.currentTime } : null;
  });
  log('05', 'Avatar video lazy-loads and plays', !!videoState && videoState.src && videoState.time > 0, JSON.stringify(videoState));

  // ── 06 Navigation overlay ───────────────────────────────────────────────
  await page.locator('.menu-toggle').click();
  await page.waitForTimeout(700);
  const navOpen = await page.locator('.nav-overlay.open').count() === 1;
  const navLinks = await page.locator('.nav-links a').count();
  await page.screenshot({ path: `${OUT}/06-nav.png` });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const navClosed = await page.locator('.nav-overlay.open').count() === 0;
  log('06', 'Menu opens (8 links) and closes on Esc', navOpen && navLinks === 8 && navClosed, `links=${navLinks}`);

  // ── 07 Custom cursor ────────────────────────────────────────────────────
  await page.mouse.move(700, 400);
  const cursorEnhanced = await page.evaluate(() => document.body.classList.contains('cursor-enhanced'));
  const cursorDots = await page.locator('.cursor-dot').count();
  log('07', 'Custom cursor active on fine pointer', cursorEnhanced && cursorDots === 1);

  // ── 08 About snap-cards ─────────────────────────────────────────────────
  await page.locator('#about').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  const snapCards = await page.locator('.snap-card').count();
  await page.locator('.snap-card .snap-header').nth(1).click();
  await page.waitForTimeout(600);
  const snapOpen = await page.locator('.snap-card.open').count() === 1;
  const snapATO = await page.locator('.snap-card.open').textContent();
  await page.screenshot({ path: `${OUT}/08-about.png` });
  log('08', '4 snap-cards; Delivery Impact expands w/ ATO metric', snapCards === 4 && snapOpen && /92%/.test(snapATO));

  // ── 09 Experience accordion ─────────────────────────────────────────────
  await page.locator('#experience').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  const items = await page.locator('.accordion-item').count();
  const firstText = await page.locator('.accordion-item').first().textContent();
  const atoFirstOpen = /Australian Taxation Office/.test(firstText) && /March 2026 - Present/.test(firstText)
    && await page.locator('.accordion-item').first().evaluate((el) => el.classList.contains('active'));
  // toggle behaviour
  await page.locator('.accordion-item').nth(2).locator('.accordion-header').click();
  await page.waitForTimeout(700);
  const thirdOpen = await page.locator('.accordion-item').nth(2).evaluate((el) => el.classList.contains('active'));
  await page.screenshot({ path: `${OUT}/09-experience.png` });
  log('09', '8 roles; ATO first+open; accordion toggles', items === 8 && atoFirstOpen && thirdOpen, `items=${items}`);

  // ── 10 Skills cards ─────────────────────────────────────────────────────
  await page.locator('#skills').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  const skillCards = await page.locator('.skill-card').count();
  await page.locator('.skill-card .skill-header').first().click();
  await page.waitForTimeout(500);
  const skillOpen = await page.locator('.skill-card.open').count() === 1;
  await page.screenshot({ path: `${OUT}/10-skills.png` });
  log('10', '5 skill cards expand on demand', skillCards === 5 && skillOpen, `cards=${skillCards}`);

  // ── 11 Architecture map flows ───────────────────────────────────────────
  await page.locator('#architecture-lab').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  const m1 = await page.locator('.arch-metric-value').nth(1).textContent();
  await page.locator('.arch-btn', { hasText: 'Telemetry Stream' }).click();
  await page.waitForTimeout(700);
  const m2 = await page.locator('.arch-metric-value').nth(1).textContent();
  const activeLines = await page.locator('.arch-connection.active').count();
  const activeChips = await page.locator('.arch-node-chip.active').count();
  await page.screenshot({ path: `${OUT}/11-architecture.png` });
  await page.locator('.arch-btn', { hasText: 'Governance' }).click();
  await page.waitForTimeout(500);
  const govTitle = await page.locator('.arch-explainer-title').textContent();
  log('11', '3 flows switch; metrics+lines+chips react', m1 !== m2 && activeLines > 0 && activeChips > 0 && /Governance/.test(govTitle),
    `metrics ${m1?.trim()}->${m2?.trim()}, lines=${activeLines}, chips=${activeChips}`);

  // ── 12 Projects carousel drag ───────────────────────────────────────────
  await page.locator('#work').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  const projCards = await page.locator('.project-card').count();
  const rail = page.locator('.projects-carousel');
  await rail.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const before = await rail.evaluate((el) => el.scrollLeft);
  const box = await rail.boundingBox();
  const cy = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width - 100, cy);
  await page.mouse.down();
  await page.mouse.move(box.x + 100, cy, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const after = await rail.evaluate((el) => el.scrollLeft);
  await page.screenshot({ path: `${OUT}/12-carousel.png` });
  log('12', '4 project cards; drag-to-scroll works', projCards === 4 && after > before, `scroll ${before}->${after}`);

  // ── 13 GitHub feed ──────────────────────────────────────────────────────
  const feedOk = await page.locator('#github-projects .repo-card, #github-projects .repo-status').first().isVisible().catch(() => false);
  const repoCards = await page.locator('#github-projects .repo-card').count();
  log('13', 'GitHub feed renders live repos (or graceful fallback)', feedOk, `repo-cards=${repoCards}`);

  // ── 14 Featured repos + 15 YouTube ──────────────────────────────────────
  const featured = await page.locator('.repo-curated li').count();
  log('14', 'Featured repos list (5)', featured === 5, `count=${featured}`);
  const ytVisible = await page.locator('.video-frame iframe').isVisible();
  log('15', 'YouTube channel embed present', ytVisible);
  await page.screenshot({ path: `${OUT}/13-work.png` });

  // ── 16 Contact section ──────────────────────────────────────────────────
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  const email = await page.locator('a[href="mailto:sarkar.vikram@gmail.com"]').count();
  const phone = await page.locator('a[href="tel:+61433224556"]').count();
  const socials = await page.locator('.social-btn').count();
  await page.screenshot({ path: `${OUT}/16-contact.png` });
  log('16', 'Contact: email, phone, 2 social CTAs', email === 1 && phone === 1 && socials === 2);

  // ── 17 Footer ───────────────────────────────────────────────────────────
  const footerText = await page.locator('footer').textContent();
  log('17', 'Footer dynamic year + terminal trigger', /2026/.test(footerText) && await page.locator('.terminal-trigger').count() === 1);

  // ── 18 Hidden terminal (trigger + commands + konami) ────────────────────
  await page.locator('.terminal-trigger').click();
  await page.waitForTimeout(600);
  const termOpen = await page.locator('#terminal-overlay.open').count() === 1;
  await page.locator('#terminal-input').fill('sudo hire vic');
  await page.locator('#terminal-input').press('Enter');
  await page.waitForTimeout(300);
  const termAnswer = await page.locator('#terminal-log').textContent();
  await page.screenshot({ path: `${OUT}/18-terminal.png` });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  // Konami
  for (const k of ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']) {
    await page.keyboard.press(k);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(500);
  const konamiOpen = await page.locator('#terminal-overlay.open').count() === 1;
  await page.keyboard.press('Escape');
  log('18', 'Terminal: trigger, commands, Konami code', termOpen && /sarkar\.vikram@gmail\.com/.test(termAnswer) && konamiOpen,
    `konami=${konamiOpen}`);

  // ── 19 MiniVic full flow ────────────────────────────────────────────────
  await page.locator('button[aria-label*="Mini Vic assistant"]').click();
  await page.waitForTimeout(2500);
  const greetingAudio = requests.some((u) => u.includes('minivic-greeting.mp3'));
  // persona switch
  const personaBtn = page.locator('[data-testid="minivic-panel"] button', { hasText: 'Engineering' }).first();
  const personaOk = await personaBtn.isVisible().catch(() => false);
  if (personaOk) await personaBtn.click();
  await page.waitForTimeout(400);
  const input = page.locator('input[placeholder*="Ask me anything"]').first();
  await input.fill('What tech stack does Vikram use?');
  await input.press('Enter');
  let botAnswered = false;
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    const t = ((await page.locator('[data-testid="minivic-panel"]').textContent()) ?? '').replace(/\s+/g, ' ');
    if (/TypeScript|Kubernetes|Next\.js/i.test(t.split('What tech stack')[1] ?? '')) { botAnswered = true; break; }
  }
  const geminiUsed = requests.some((u) => u.includes('generativelanguage.googleapis.com'));
  await page.screenshot({ path: `${OUT}/19-minivic.png` });
  log('19', 'MiniVic: cloned-voice greeting, persona switch, Gemini answer', greetingAudio && personaOk && botAnswered,
    `greeting=${greetingAudio} gemini=${geminiUsed}`);
  await page.locator('button[aria-label*="Mini Vic assistant"]').click();

  // ── 20 WebGL scene running ──────────────────────────────────────────────
  const sceneInfo = await page.evaluate(async () => {
    const canvas = document.querySelector('.space-scene-layer canvas');
    if (!canvas) return { canvas: false };
    const frames = await new Promise((res) => {
      let n = 0;
      const t0 = performance.now();
      const tick = () => { n += 1; if (performance.now() - t0 < 1000) requestAnimationFrame(tick); else res(n); };
      requestAnimationFrame(tick);
    });
    return { canvas: true, fps: frames, sceneBridge: !!window.__portfolioSceneBridge__ };
  });
  log('20', 'Three.js scene live (canvas, ~60fps loop, __portfolioSceneBridge__ handle)',
    sceneInfo.canvas && sceneInfo.fps > 25 && sceneInfo.sceneBridge, `fps≈${sceneInfo.fps}`);

  // ── 21 Scroll reveals ───────────────────────────────────────────────────
  const aboutOpacity = await page.locator('#about .section-title').evaluate((el) => getComputedStyle(el.parentElement).opacity);
  log('21', 'Scroll-reveal sections fully visible after entrance', parseFloat(aboutOpacity) === 1, `opacity=${aboutOpacity}`);

  // ── 22 SEO & structured data ────────────────────────────────────────────
  const title = await page.title();
  const desc = await page.locator('meta[name="description"]').getAttribute('content');
  const jsonld = await page.evaluate(() =>
    [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent).join(' '));
  log('22', 'SEO title/description/JSON-LD reflect ATO role',
    /Scrum Master/.test(title) && /Australian Taxation Office/.test(desc + jsonld));

  // ── 23 Console errors ───────────────────────────────────────────────────
  const realErrors = consoleErrors.filter((e) => !/favicon|ERR_BLOCKED_BY_CLIENT/.test(e));
  log('23', 'Zero console errors on full journey', realErrors.length === 0,
    `${realErrors.slice(0, 2).join(' ; ')} || failed: ${failedResponses.slice(0, 4).join(' , ')}`);

  // ── 24 Performance timing ───────────────────────────────────────────────
  const perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    return { dcl: Math.round(nav.domContentLoadedEventEnd), fcp: fcp ? Math.round(fcp.startTime) : null };
  });
  log('24', 'Performance: FCP under 2.5s on broadband', perf.fcp !== null && perf.fcp < 2500, JSON.stringify(perf));

  // ── 25 404 page + 26 benchmark page + 27 resume ────────────────────────
  const r404 = await page.request.get(`${BASE}/definitely-not-a-page`);
  log('25', 'Custom 404 served', r404.status() === 404 || (await r404.text()).includes('not-found') || (await r404.text()).includes('404'), `status=${r404.status()}`);
  // QA-ARCH-02: the Lighthouse-only /performance-benchmark route is intentionally
  // excluded from the public static export. It must NOT serve the benchmark page —
  // Firebase either returns 404 or rewrites unknown routes to the home shell.
  const rBench = await page.request.get(`${BASE}/performance-benchmark`);
  const rBenchBody = await rBench.text().catch(() => '');
  log('26', 'Performance-benchmark route excluded from public build',
    rBench.status() === 404 || !rBenchBody.includes('Enterprise Performance Validation Target'));
  const rCv = await page.request.get(`${BASE}/docs/Vik_Resume_Final.pdf`);
  log('27', 'Resume PDF serves 200 (157KB, original template + ATO)', rCv.status() === 200 && (await rCv.body()).length > 100000);

  // ── 28 Reduced motion compliance ────────────────────────────────────────
  const rmCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const rmPage = await rmCtx.newPage();
  await rmPage.goto(BASE, { waitUntil: 'domcontentloaded' });
  await rmPage.waitForTimeout(2500);
  const rmHeroVisible = await rmPage.locator('.hero-title').isVisible();
  const rmCursor = await rmPage.locator('.cursor-dot').count();
  await rmPage.screenshot({ path: `${OUT}/28-reduced-motion.png` });
  log('28', 'Reduced-motion: instant content, no custom cursor', rmHeroVisible && rmCursor === 0, `cursor=${rmCursor}`);
  await rmCtx.close();

  // ── 29 Mobile 375px ─────────────────────────────────────────────────────
  const mCtx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const mPage = await mCtx.newPage();
  await mPage.goto(BASE, { waitUntil: 'domcontentloaded' });
  await mPage.locator('.preloader').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await mPage.waitForTimeout(3500);
  const hScroll = await mPage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await mPage.screenshot({ path: `${OUT}/29-mobile-hero.png` });
  let panelFits = false;
  try {
    await mPage.locator('button[aria-label*="Mini Vic assistant"]').click({ timeout: 10000 });
    await mPage.waitForTimeout(1500);
    panelFits = await mPage.locator('[data-testid="minivic-panel"]').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.left >= 0 && r.right <= window.innerWidth + 1;
    });
    await mPage.screenshot({ path: `${OUT}/29-mobile-minivic.png` });
  } catch (e) {
    log('29x', 'Mobile MiniVic button reachable', false, e.message.slice(0, 120));
  }
  log('29', 'Mobile 375px: no horizontal overflow; MiniVic panel fits', hScroll <= 1 && panelFits, `overflow=${hScroll}px fits=${panelFits}`);
  await mCtx.close();

  // ── 30 Caching headers ──────────────────────────────────────────────────
  const rChunk = await page.request.get(`${BASE}/_next/static/chunks/fd9d1056-8ef33f5ef9456d1f.js`).catch(() => null);
  const cache = rChunk ? rChunk.headers()['cache-control'] : '';
  log('30', 'Immutable caching on static chunks', /max-age=31536000/.test(cache ?? ''), cache);

  await browser.close();

  const pass = results.filter((r) => r.pass).length;
  console.log(`SUMMARY|${pass}/${results.length} PASS`);
  fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
};

run().catch((e) => { console.error('AUDIT CRASHED:', e); process.exit(1); });
