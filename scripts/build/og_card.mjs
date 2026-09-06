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
 * ── The palette, in the bytes (G-OG1) ────────────────────────────────────────
 * docs/architecture/PALETTE-EXCEPTIONS.md retired its register with the words
 * "every surface of this site … is bound by the palette rule without
 * qualification", and reasoned explicitly about "the bytes a reader downloads,
 * an OpenGraph consumer reads". This card was the counter-example: its ground
 * was a blue-cast near-black (#0a0b0d → #121317 over #1b1d23) and its caliper
 * jaws were gold. Measured by ADV-REVIEW-20260905T2315Z: max chroma 157, and
 * 55,620 saturated non-gold pixels, 7.36 % of the card.
 *
 * Two rules now hold here, and tests/hero_assets_monochrome.test.mjs reads the
 * shipped PNG to prove them:
 *
 *   1. Every ink is a token from app/globals.css `:root` — --ink-900 ground,
 *      --white / --mist-200 / --mist-400 / --ink-300 type. Each is chroma 0, so
 *      the card decodes grey. LCD subpixel text is switched off at the browser
 *      (`--disable-lcd-text`), because subpixel antialiasing fringes every
 *      glyph edge red and blue in the raster no matter what colour the CSS says.
 *   2. Gold is spent only on a figure that has a source. The three ledger
 *      figures the card quotes are graded `self-reported` on the page itself
 *      (CT-10), so the card draws them the way the page does — grey jaws, white
 *      value, the half-disc grade mark — and carries no gold at all.
 *
 * ── Size ─────────────────────────────────────────────────────────────────────
 * 2400x1260: the platform-standard 1.91:1 ratio at 2x, so the card is sharp on
 * a retina preview rather than upscaled. app/layout.tsx declares those exact
 * numbers to og:image:width/height.
 *
 * Usage: npm run build:static && node scripts/build/og_card.mjs
 * Writes: public/assets/og-image.png (2400x1260)
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const OUT = join(ROOT, 'public', 'assets', 'og-image.png');

/** 1.91:1 in CSS pixels; the raster is this at deviceScaleFactor 2. */
const CARD = { width: 1200, height: 630, scale: 2 };

/**
 * The inks, quoted from app/globals.css `:root`. Every one is chroma 0 — R, G
 * and B equal — which is what makes the rendered card decode as a true grey.
 * They are repeated here rather than imported because this file renders in a
 * bare browser context with no stylesheet of the site's to inherit from; the
 * chroma test is what keeps the two copies honest.
 */
const INK = {
  ink900: '#0A0A0A', // --ink-900, the ground
  ink800: '#131313', // --ink-800, the lift at the top of the frame
  ink300: '#7D7D7D', // --ink-300, provenance
  mist400: '#909090', // --mist-400, the self-reported caliper's jaws
  mist200: '#CDCDCD', // --mist-200, labels
  white: '#F6F6F6', // --white, the values and the name
};

/**
 * The exact woff2 the built site serves, inlined so the render cannot miss it.
 *
 * Resolved out of the built stylesheet rather than pinned by content hash. The
 * hashes change on every dependency bump, and a stale one used to take the
 * whole card down (`FATAL: …591e43f23f51e5a5-s.woff2 missing`) — or worse,
 * quietly name the wrong subset: the pinned "sans" was Inter's *Vietnamese*
 * face, which carries no basic Latin, so the card's body type had been
 * rendering in a system fallback. Reading the `@font-face` rule the page itself
 * serves, and taking the face whose unicode-range covers `u+00??`, ties the
 * card to the built site the way the rest of this script does.
 */
function font(family, weight) {
  const dir = join(ROOT, 'out', '_next', 'static', 'css');
  if (!existsSync(dir)) {
    console.error(`[og-card] FATAL: ${dir} missing — run \`npm run build:static\` first.`);
    process.exit(1);
  }
  const css = readdirSync(dir)
    .filter((f) => f.endsWith('.css'))
    .map((f) => readFileSync(join(dir, f), 'utf8'))
    .join('\n');
  const faces = css.match(/@font-face\{[^}]*\}/g) ?? [];
  const face = faces.find(
    (rule) =>
      rule.includes(family) &&
      rule.includes('font-style:normal') &&
      rule.includes(`font-weight:${weight}`) &&
      // The Latin subset. Every other face in the set is Greek, Cyrillic or
      // Vietnamese and would render the card's text as blank boxes.
      rule.includes('unicode-range:u+00??'),
  );
  const url = face?.match(/url\((\/_next\/static\/media\/[^)]+\.woff2)\)/)?.[1];
  if (!url) {
    console.error(
      `[og-card] FATAL: no Latin @font-face for ${family} at weight ${weight} in the built CSS. ` +
        'Run `npm run build:static` first; if the build is current, the font stack in app/layout.tsx changed.',
    );
    process.exit(1);
  }
  const path = join(ROOT, 'out', url.replace(/^\//, ''));
  if (!existsSync(path)) {
    console.error(`[og-card] FATAL: ${path} is referenced by the built CSS but not emitted.`);
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

    /**
     * Address the hero by its CSS-module class rather than by position. The
     * first version of this reader walked `#hero > div > p`, which stopped
     * matching the moment the copy was wrapped one level deeper: the card then
     * printed the availability line where the location belongs, the portrait
     * button's aria-label ("Play the portrait") as the role, and the whole
     * link bar run together as one word. The hashed suffix changes every build,
     * the prefix does not.
     */
    const pick = (selector) => hero.querySelector(selector);
    /** Only the element's own text — never a nested link bar or a hidden gloss. */
    const ownText = (el) =>
      el
        ? [...el.childNodes]
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => n.textContent.trim())
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim()
        : '';

    return {
      location: ownText(pick('p[class*="Hero_eyebrow"]')),
      name: (pick('h1#hero-name')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
      role: ownText(pick('p[class*="Hero_role"]')),
      availability: ownText(pick('[data-testid="hero-availability"]')),
      // The page's own words on how these figures are graded — it is the whole
      // reason the card carries no gold, so it travels with them. Only the
      // first sentence: the second ("Repository figures below are harvested and
      // dated") points at a part of the page the card does not contain.
      grading: ownText(pick('p[class*="Hero_grading"]')).split('.')[0].trim() + '.',
      ledger: [...hero.querySelectorAll('ul li')].map((li) => {
        // The caliper carries a visually-hidden gloss ("(Measured; source
        // given.)") for screen readers. It is one more <span> in the same
        // subtree, so a naive text sweep pastes it into the figure — which is
        // exactly what the first version of this card printed.
        const visible = [...li.querySelectorAll('span')].filter(
          (span) => span.offsetWidth > 1 && span.offsetHeight > 1,
        );
        const texts = visible.map(ownText).filter(Boolean);
        return {
          value: texts[0] ?? '',
          label: texts[1] ?? '',
          source: texts[2] ?? '',
          // The grade the PAGE gives this figure, read off the caliper rather
          // than assumed. Gold is only ever spent on a sourced one.
          state: li.querySelector('[data-state]')?.getAttribute('data-state') ?? 'self-reported',
        };
      }),
    };
  });
}

const serif = font('Source_Serif_4', 400);
const sans = font('Inter', 400);
const mono = font('IBM_Plex_Mono', 500);

const browser = await chromium.launch({
  channel: 'chrome',
  args: [
    '--no-sandbox',
    // Subpixel antialiasing paints each glyph edge as red and blue fringes. On
    // screen that is invisible; in a PNG an OpenGraph consumer re-encodes it is
    // a measured hue on a site that says it has none (G-OG1: 1.4 % of the old
    // card sat above chroma 40 on glyph rows alone). Greyscale AA instead.
    '--disable-lcd-text',
    '--disable-font-subpixel-positioning',
    // Render in sRGB, so the written bytes are the colours the CSS asked for
    // rather than a display-profile transform of them.
    '--force-color-profile=srgb',
  ],
});
const reader = await browser.newPage();
const heroContent = await readHero(reader);
await reader.close();

// Every field the card prints has to have come off the page. A silent empty
// string here is how the card ends up with a blank role or a missing location
// and still exits 0.
const required = ['name', 'location', 'role', 'availability', 'grading'];
const missing = required.filter((key) => !heroContent[key]);
if (missing.length || heroContent.ledger.length !== 3) {
  console.error(
    `[og-card] FATAL: could not read the hero from the built export (missing: ${missing.join(', ') || 'none'}, `
      + `${heroContent.ledger.length} ledger entries):`,
    heroContent,
  );
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
    width: ${CARD.width}px; height: ${CARD.height}px;
    /* --ink-900 flat, with a --ink-800 lift at the top corner. Two greys, so
       every pixel of the ground — and every step of the ramp between them —
       has R, G and B equal. */
    background:
      radial-gradient(120% 90% at 18% 0%, ${INK.ink800} 0%, rgb(10 10 10 / 0) 62%),
      ${INK.ink900};
    color: ${INK.white};
    font-family: Card-Sans, system-ui, sans-serif;
    padding: 74px 84px;
    display: flex; flex-direction: column; justify-content: space-between;
    position: relative; overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }

  .eyebrow {
    font-family: Card-Mono, monospace; font-size: 15px; letter-spacing: .18em;
    text-transform: uppercase; color: ${INK.mist400};
    display: flex; align-items: center; gap: 12px;
  }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: ${INK.white}; box-shadow: 0 0 0 5px rgb(246 246 246 / .08); }

  h1 { font-family: Card-Serif, Georgia, serif; font-weight: 400; font-size: 92px; line-height: .96; letter-spacing: -.03em; }
  .role { margin-top: 20px; font-size: 27px; color: ${INK.mist200}; letter-spacing: .005em; }

  .ledger { display: flex; gap: 56px; }
  .ledgerBlock { display: flex; flex-direction: column; }
  .fig { display: flex; flex-direction: column; gap: 7px; }

  /* The caliper, drawn exactly as components/marks/Caliper.module.css draws it
     — including the state. These three figures are graded self-reported on the
     page (CT-10), so the jaws are grey and the value carries the half-disc
     grade mark. Gold jaws would claim a source none of them publish. */
  .caliper { display: inline-flex; align-items: stretch; gap: 8px; line-height: 1; color: ${INK.mist400}; }
  .arm { position: relative; width: 8px; }
  .arm::before { content:''; position: absolute; top: 0; bottom: 0; width: 1px; background: currentColor; opacity: .55; }
  .arm.l::before { left: 0; } .arm.r::before { right: 0; }
  .arm::after { content:''; position: absolute; inset: 0; border-top: 1px solid currentColor; border-bottom: 1px solid currentColor; opacity: .55; }
  .value { font-family: Card-Serif, Georgia, serif; font-size: 46px; letter-spacing: -.02em; color: ${INK.white}; }

  /* U+25D0 is not in the self-hosted font subsets, so the mark is drawn rather
     than typed — same construction as the module, same reason. */
  .caliper[data-state="self-reported"] .value::after {
    content: ''; display: inline-block;
    width: .5em; height: .5em; margin-left: .28em; vertical-align: .34em;
    border: 1px solid currentColor; border-radius: 50%;
    background: linear-gradient(to right, currentColor 50%, rgb(10 10 10 / 0) 50%);
    opacity: .9;
  }
  /* A sourced figure is the only thing on this card allowed to be gold — and
     none of the three currently are, so this rule paints nothing today. It
     stands so the discipline survives the next figure that earns it. */
  .caliper[data-state="sourced"] .arm::before { background: var(--gold, #c9a84c); opacity: .85; }
  .caliper[data-state="sourced"] .arm::after { border-color: var(--gold, #c9a84c); opacity: .85; }

  .label { font-size: 16px; color: ${INK.mist200}; }
  .grading { margin-top: 30px; font-family: Card-Mono, monospace; font-size: 13px; color: ${INK.ink300}; letter-spacing: .02em; display: flex; align-items: center; gap: 9px; }
  /* The same half-disc that grades each figure, at caption size. */
  .grading-mark { display: inline-block; width: 10px; height: 10px; border: 1px solid currentColor; border-radius: 50%; background: linear-gradient(to right, currentColor 50%, rgb(10 10 10 / 0) 50%); }
  .source { font-family: Card-Mono, monospace; font-size: 12.5px; color: ${INK.ink300}; letter-spacing: .02em; }

  .foot { display: flex; justify-content: space-between; align-items: flex-end; }
  .url { font-family: Card-Mono, monospace; font-size: 16px; color: ${INK.mist400}; letter-spacing: .04em; }
  .avail {
    font-family: Card-Mono, monospace; font-size: 13px; color: ${INK.mist200};
    letter-spacing: .1em; text-transform: uppercase;
    border: 1px solid rgb(246 246 246 / .18); border-radius: 2px; padding: 7px 13px;
  }
</style>
<body>
  <div>
    <div class="eyebrow"><span class="dot"></span>${heroContent.location}</div>
    <h1>${heroContent.name}</h1>
    <div class="role">${heroContent.role}</div>
  </div>

  <div class="ledgerBlock">
  <div class="ledger">
    ${heroContent.ledger
      .map(
        (entry) => `<div class="fig">
      <span class="caliper" data-state="${entry.state}"><span class="arm l"></span><span class="value">${entry.value}</span><span class="arm r"></span></span>
      <span class="label">${entry.label}</span>
      <span class="source">${entry.source}</span>
    </div>`,
      )
      .join('')}
  </div>
    <div class="grading"><span class="grading-mark"></span>${heroContent.grading}</div>
  </div>

  <div class="foot">
    <span class="url">forgotten-mistory.web.app</span>
    <span class="avail">${heroContent.availability}</span>
  </div>
</body>`;

const page = await browser.newPage({
  viewport: { width: CARD.width, height: CARD.height },
  deviceScaleFactor: CARD.scale,
});
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
const buffer = await page.screenshot({ type: 'png' });
writeFileSync(OUT, buffer);
await browser.close();
console.log(
  `[og-card] wrote ${OUT} — ${CARD.width * CARD.scale}x${CARD.height * CARD.scale}, ${(buffer.length / 1024).toFixed(0)} kB`,
);
