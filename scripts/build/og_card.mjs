/**
 * og_card.mjs — renders the social card from the site's own design language.
 *
 * The card is the first thing a recruiter sees when this link is pasted into
 * LinkedIn or an email, so it has to be the same object as the page: the same
 * display serif, the same mono provenance line, the same caliper bracket, and
 * the same claim discipline. The previous card was left over from an earlier
 * design — a condensed grotesque, and a positioning line ("AI Engineering ·
 * Cloud · Program Delivery") that no longer matches what the site says he is.
 *
 * It renders through the real fonts from the built export rather than a
 * lookalike, so the card and the page cannot drift apart.
 *
 * Usage: npm run build:static && node scripts/build/og_card.mjs
 * Writes: public/assets/og-image.png (1200x630)
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const OUT = join(ROOT, 'public', 'assets', 'og-image.png');

/** The exact woff2 the built site serves, inlined so the render cannot miss it. */
function font(file) {
  const path = join(ROOT, 'out', '_next', 'static', 'media', file);
  if (!existsSync(path)) {
    console.error(`[og-card] FATAL: ${path} missing — run \`npm run build:static\` first.`);
    process.exit(1);
  }
  return readFileSync(path).toString('base64');
}

/**
 * The card quotes the BUILT PAGE, not a copy of its data. Reading the rendered
 * export means the card cannot drift from what is actually published: if the
 * hero's figures change, the card changes with them, and if the hero breaks,
 * this fails loudly rather than shipping a card describing a page that no
 * longer exists.
 */
async function readHero(page) {
  // Read the SERVED page, never the file:// export. The export's stylesheet is
  // linked at an absolute path, so opening index.html from disk renders it
  // completely unstyled — every visually-hidden element measures as visible and
  // the card ends up quoting screen-reader text as if it were a label.
  const base = process.env.OG_BASE_URL || 'http://localhost:5599/';
  const response = await page.goto(base, { waitUntil: 'load' });
  if (!response || !response.ok()) {
    console.error(
      `[og-card] FATAL: ${base} did not serve the site (${response?.status()}). ` +
        'Start one with: python3 -m http.server 5599 --directory out',
    );
    process.exit(1);
  }
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() => {
    const hero = document.querySelector('#hero');
    if (!hero) throw new Error('no #hero in the built export');
    const paragraphs = [...hero.querySelectorAll(':scope > div > p')];
    return {
      location: paragraphs[0]?.textContent?.trim() ?? '',
      name: hero.querySelector('h1')?.textContent?.trim() ?? '',
      role: paragraphs[1]?.textContent?.trim() ?? '',
      availability: paragraphs[3]?.textContent?.split('LinkedIn')[0]?.trim() ?? '',
      ledger: [...hero.querySelectorAll('ul li')].map((li) => {
        // The caliper carries a visually-hidden gloss ("(Measured; source
        // given.)") for screen readers. It is one more <span> in the same
        // subtree, so a naive text sweep pastes it into the figure — which is
        // exactly what the first version of this card printed.
        const visible = [...li.querySelectorAll('span')].filter(
          (span) => span.offsetWidth > 1 && span.offsetHeight > 1,
        );
        const texts = visible
          .map((span) => [...span.childNodes]
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => n.textContent.trim())
            .join(' ')
            .trim())
          .filter(Boolean);
        return { value: texts[0] ?? '', label: texts[1] ?? '', source: texts[2] ?? '' };
      }),
    };
  });
}

const serif = font('591e43f23f51e5a5-s.woff2');
const sans = font('df0a9ae256c0569c-s.woff2');
const mono = font('98e207f02528a563-s.woff2');

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
const reader = await browser.newPage();
const heroContent = await readHero(reader);
await reader.close();

if (!heroContent.name || heroContent.ledger.length !== 3) {
  console.error('[og-card] FATAL: could not read the hero from the built export:', heroContent);
  process.exit(1);
}

const html = `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face { font-family: Card-Serif; src: url(data:font/woff2;base64,${serif}) format('woff2'); font-weight: 400; }
  @font-face { font-family: Card-Sans;  src: url(data:font/woff2;base64,${sans})  format('woff2'); font-weight: 400; }
  @font-face { font-family: Card-Mono;  src: url(data:font/woff2;base64,${mono})  format('woff2'); font-weight: 500; }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 1200px; height: 630px;
    background:
      radial-gradient(120% 90% at 18% 0%, #1b1d23 0%, transparent 62%),
      linear-gradient(180deg, #0a0b0d 0%, #121317 58%, #0a0b0d 100%);
    color: #f4f6fa;
    font-family: Card-Sans, system-ui, sans-serif;
    padding: 74px 84px;
    display: flex; flex-direction: column; justify-content: space-between;
    position: relative; overflow: hidden;
  }

  .eyebrow {
    font-family: Card-Mono, monospace; font-size: 15px; letter-spacing: .18em;
    text-transform: uppercase; color: #8a8f9a;
    display: flex; align-items: center; gap: 12px;
  }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: #f4f6fa; box-shadow: 0 0 0 5px rgba(244,246,250,.08); }

  h1 { font-family: Card-Serif, Georgia, serif; font-weight: 400; font-size: 92px; line-height: .96; letter-spacing: -.03em; }
  .role { margin-top: 20px; font-size: 27px; color: #c9cdd6; letter-spacing: .005em; }

  .ledger { display: flex; gap: 56px; }
  .fig { display: flex; flex-direction: column; gap: 7px; }

  /* The caliper: two hairline jaws closing onto a figure that has a source. */
  .caliper { display: inline-flex; align-items: stretch; gap: 8px; line-height: 1; }
  .arm { position: relative; width: 8px; }
  .arm::before { content:''; position: absolute; top: 0; bottom: 0; width: 1px; background: #c9a84c; opacity: .85; }
  .arm.l::before { left: 0; } .arm.r::before { right: 0; }
  .arm::after { content:''; position: absolute; inset: 0; border-top: 1px solid #c9a84c; border-bottom: 1px solid #c9a84c; opacity: .85; }
  .value { font-family: Card-Serif, Georgia, serif; font-size: 46px; letter-spacing: -.02em; }
  .label { font-size: 16px; color: #c9cdd6; }
  .source { font-family: Card-Mono, monospace; font-size: 12.5px; color: #6e7178; letter-spacing: .02em; }

  .foot { display: flex; justify-content: space-between; align-items: flex-end; }
  .url { font-family: Card-Mono, monospace; font-size: 16px; color: #8a8f9a; letter-spacing: .04em; }
  .avail { font-family: Card-Mono, monospace; font-size: 13px; color: #c9a84c; letter-spacing: .1em; text-transform: uppercase; }
</style>
<body>
  <div>
    <div class="eyebrow"><span class="dot"></span>${heroContent.location}</div>
    <h1>${heroContent.name}</h1>
    <div class="role">${heroContent.role}</div>
  </div>

  <div class="ledger">
    ${heroContent.ledger
      .map(
        (entry) => `<div class="fig">
      <span class="caliper"><span class="arm l"></span><span class="value">${entry.value}</span><span class="arm r"></span></span>
      <span class="label">${entry.label}</span>
      <span class="source">${entry.source}</span>
    </div>`,
      )
      .join('')}
  </div>

  <div class="foot">
    <span class="url">forgotten-mistory.web.app</span>
    <span class="avail">${heroContent.availability}</span>
  </div>
</body>`;

const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
const buffer = await page.screenshot({ type: 'png' });
writeFileSync(OUT, buffer);
await browser.close();
console.log(`[og-card] wrote ${OUT} — ${(buffer.length / 1024).toFixed(0)} kB`);
