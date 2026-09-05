import { test, expect, type Page } from '@playwright/test';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

import { greetingAudioSha256 } from '../../app/data/generated/greeting-asset';
import { greetingEnvelope } from '../../app/data/generated/greeting-envelope';
import { contact } from '../../app/data/siteContent';
import { listenContent } from '../../app/data/portfolio/listen';

/**
 * The Listen flagship — the client's one door (docs/architecture/LISTEN-FLAGSHIP.md §3;
 * ADV-1451Z P1 "Dual mailto engage pills; no booking").
 *
 * The section offered a filled plate (*Start a project*) and, one row below, the raw
 * email address as a second filled pill: the same route wearing different type. Two
 * identical doors is not two options.
 *
 * There is no booking tool on this account. That was verified by key NAME only — the
 * `^[A-Z][A-Z0-9_]*=` keys of .env.production, values stripped with sed and never read,
 * number 45, and `grep -ciE 'cal|calendar|book|schedul|meet'` over those names returns
 * 0 (evidence: docs/delivery/evidence/v10-20260905T0515Z/t_l1_01/00-env-key-names.log)
 * — so a calendar URL would be a 404 in front of the one visitor ready to buy. And no
 * response-time figure is sourced anywhere (`app/data/siteContent.ts` forbids
 * unverifiable promises), so none is printed.
 *
 * What ships instead: one door, and it does the scheduling work a booking page would.
 * The plate reads "Book a 20-minute call" and its mailto prefills a four-line agenda
 * the sender edits in place; the address beneath it is a plain channel like the other
 * three. `tests/e2e/listen.spec.ts` TC-LISTEN-01..11 and
 * `tests/overhaul/scene-listen.spec.ts` TC-SCENE-LISTEN-04/05 keep owning the section's
 * restraint, beat and anchor count; this file owns the door.
 */

const LISTEN = '#listen';
const ENGAGE = `${LISTEN} [data-cta="engage"]`;

const LABEL = 'Book a 20-minute call';
/** The agenda, verbatim. Every line is a prompt to the sender; none is a promise. */
const AGENDA = [
  "What you're building:",
  'The decision you need made:',
  'Two or three times that suit you (Melbourne time):',
  'Anything I should read first:',
];
/** Older desktop mail clients truncate long mailto URLs; 900 is inside every mainstream one. */
const HREF_CAP = 900;
/** TC-LISTEN-02's budget, measured here on the section's rendered text rather than a clone. */
const WORD_CAP = 65;
/** The four routes plus the one plate that leads them (TC-SCENE-LISTEN-04/05). */
const ANCHORS = listenContent.channels.length + 1;
const BOOKING_HOST = /cal\.com|calendly|savvycal/i;
const TIMING_PROMISE = /within\s+\d+\s*(h|hours|business\s+days)/i;

async function gotoListen(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator(LISTEN).scrollIntoViewIfNeeded();
}

/** The shader source the band is drawn by, read as text for the C1 assertions. */
const GLSL_SOURCE = join(process.cwd(), 'components/sections/Listen/listen.glsl.ts');

test.describe('Listen flagship — the band is the greeting, not a sine (C1)', () => {
  test('TC-LISTEN-FLAG-01: the generated envelope is 256 in-range samples, is a waveform, and is pinned to the shipped greeting', () => {
    // GENERATED, never hand-edited: it is written by
    // scripts/build/greeting_envelope.mjs from the MP3's own bytes.
    const { envelope, durationSeconds, sourceSha256 } = greetingEnvelope;

    expect(envelope, 'the envelope is not exactly 256 samples').toHaveLength(256);
    for (const value of envelope) {
      expect(value, `envelope sample ${value} is outside [0, 1]`).toBeGreaterThanOrEqual(0);
      expect(value, `envelope sample ${value} is outside [0, 1]`).toBeLessThanOrEqual(1);
    }

    // A waveform, not a constant: a peak the band can land on and a pause it can
    // fall to. A flat band would look like data without being it.
    expect(
      envelope.some((v) => v >= 0.9),
      'no sample reaches 0.9 — the band has no loud moment',
    ).toBe(true);
    expect(
      envelope.some((v) => v <= 0.1),
      'no sample falls to 0.1 — the band never pauses',
    ).toBe(true);

    expect(durationSeconds, 'durationSeconds is not the greeting length').toBeGreaterThan(24);
    expect(durationSeconds).toBeLessThan(26);

    // The pin: the same defect class the greeting digest was introduced to catch
    // — a regenerated MP3 with a stale envelope — fails here.
    expect(
      sourceSha256,
      'the envelope sourceSha256 does not equal greetingAudioSha256 — the band and the greeting have drifted',
    ).toBe(greetingAudioSha256);
  });

  test('TC-LISTEN-FLAG-02: the band is driven by uEnvelope, and the sine is gone from the fragment main (budget unchanged)', () => {
    const glsl = readFileSync(GLSL_SOURCE, 'utf8');

    expect(glsl, 'the shader never samples the greeting envelope').toContain('uEnvelope');

    // The fragment program's main only — the value-noise `hash()` above it is
    // allowed its own `sin`, exactly as TC-SCENE-LISTEN-06 measures the budget.
    const main = glsl.slice(glsl.lastIndexOf('void main'));
    expect(main, 'the fragment main still contains a sin() term — the breath was not removed').not.toMatch(
      /\bsin\s*\(/,
    );

    // Budget and palette, unchanged from TC-SCENE-LISTEN-06.
    const noiseCalls = main.match(/\bnoise\s*\(/g) ?? [];
    expect(noiseCalls.length, `noise() calls in the fragment main: ${noiseCalls.length}`).toBeLessThanOrEqual(3);
    expect(glsl, 'the shader gained a hex colour literal').not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(glsl.toLowerCase(), "the shader gained a 'gold' accent").not.toContain('gold');
  });
});

test.describe('Listen flagship — the client CTA', () => {
  test('TC-LISTEN-CTA-01: #listen has exactly one filled action, it reads "Book a 20-minute call", and the email is a plain channel', async ({
    page,
  }) => {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      await gotoListen(page);

      const probe = await page.evaluate((email) => {
        const section = document.querySelector('#listen')!;
        const anchors = Array.from(section.querySelectorAll<HTMLAnchorElement>('a'));
        const text = (el: Element) => (el.textContent || '').replace(/\s+/g, ' ').trim();
        // A plate is any anchor painting its own ground. `rgba(0, 0, 0, 0)` and
        // `transparent` are not a ground; anything with alpha > 0 is.
        const filled = (el: Element) => {
          const bg = getComputedStyle(el).backgroundColor;
          const m = bg.match(/rgba?\(\s*[\d.]+[\s,]+[\d.]+[\s,]+[\d.]+(?:[\s,/]+([\d.]+))?\s*\)/);
          if (!m) return false;
          return m[1] === undefined ? true : Number(m[1]) > 0;
        };
        const styleOf = (el: Element | null) => {
          if (!el) return null;
          const cs = getComputedStyle(el);
          return {
            background: cs.backgroundColor,
            color: cs.color,
            fontSize: cs.fontSize,
            fontFamily: cs.fontFamily,
            padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
            radius: cs.borderTopLeftRadius,
            minHeight: cs.minHeight,
          };
        };
        const emailRoute = section.querySelector<HTMLAnchorElement>(`a[href="mailto:${email}"]`);
        const telRoute = section.querySelector<HTMLAnchorElement>('a[href^="tel:"]');
        return {
          anchors: anchors.length,
          filled: anchors.filter(filled).map(text),
          engage: anchors
            .filter((a) => a.dataset.cta === 'engage')
            .map((a) => ({ text: text(a), filled: filled(a), height: a.getBoundingClientRect().height })),
          email: emailRoute
            ? { className: emailRoute.className, style: styleOf(emailRoute), height: emailRoute.getBoundingClientRect().height }
            : null,
          tel: styleOf(telRoute),
        };
      }, contact.email);

      const at = `${viewport.width}px`;
      expect(probe.anchors, `${at}: anchor count in #listen`).toBe(ANCHORS);

      // One door, named for what it does.
      expect(probe.engage, `${at}: not exactly one [data-cta="engage"]`).toHaveLength(1);
      expect(probe.engage[0].text, `${at}: plate label`).toBe(LABEL);
      expect(probe.engage[0].filled, `${at}: the plate is not a filled ground`).toBe(true);
      expect(probe.engage[0].height, `${at}: plate hit box`).toBeGreaterThanOrEqual(44);

      // …and it is the only door. Exactly one anchor in the section paints a ground.
      expect(probe.filled, `${at}: filled anchors in #listen`).toEqual([LABEL]);

      // The address is a channel like the other three: same class family, no pill,
      // and the same computed type, ground, padding and radius as the phone route.
      expect(probe.email, `${at}: no plain mailto route for ${contact.email}`).not.toBeNull();
      expect(probe.email!.className, `${at}: email route class "${probe.email!.className}"`).toMatch(/channel/);
      expect(probe.email!.className, `${at}: email route still carries the pill class`).not.toMatch(/pill/i);
      expect(probe.tel, `${at}: no tel route to compare against`).not.toBeNull();
      expect(probe.email!.style, `${at}: email route is styled differently from the phone route`).toEqual(probe.tel);
      expect(probe.email!.height, `${at}: email route hit box`).toBeGreaterThanOrEqual(44);
    }
  });

  test('TC-LISTEN-CTA-02: the plate is a mailto with a 20-minute-call subject and a four-line agenda body, under 900 characters', async ({
    page,
  }) => {
    await gotoListen(page);

    const href = await page.locator(ENGAGE).getAttribute('href');
    expect(href, 'the engagement plate has no href').toBeTruthy();

    // The DOM carries exactly what the data module says — no drift between the
    // content file and the rendered plate.
    expect(href).toBe(listenContent.engage.href);

    expect(href!.startsWith(`mailto:${contact.email}?`), `href does not address ${contact.email}: ${href}`).toBe(true);
    expect(href!.length, `mailto href is ${href!.length} characters`).toBeLessThanOrEqual(HREF_CAP);
    // Fully encoded: no raw whitespace, and the line breaks travel as %0A so every
    // client's parser reads the same four lines.
    expect(href, 'mailto href carries raw whitespace').not.toMatch(/\s/);
    expect(href, 'agenda line breaks are not percent-encoded').toContain('%0A');

    const url = new URL(href!);
    expect(url.pathname, 'mailto recipient').toBe(contact.email);
    const params = new URLSearchParams(url.search);
    expect(params.has('subject'), 'no subject= in the mailto').toBe(true);
    expect(params.has('body'), 'no body= in the mailto').toBe(true);

    const subject = params.get('subject') ?? '';
    expect(subject.trim().length, 'empty subject').toBeGreaterThan(0);
    expect(subject, `subject "${subject}" does not name the 20-minute call`).toMatch(/20-minute call/i);

    const body = params.get('body') ?? '';
    const lines = body.split('\n');
    expect(lines, 'decoded body is not exactly the four agenda lines').toEqual(AGENDA);
    expect(lines.length).toBeGreaterThanOrEqual(4);
  });

  test('TC-LISTEN-CTA-03: no response-time promise, and the closing copy still fits the word budget with the plate on it', async ({
    page,
  }) => {
    await gotoListen(page);

    const text = await page.locator(LISTEN).innerText();
    expect(text, 'the closing section prints an unsourced timing promise').not.toMatch(TIMING_PROMISE);
    expect(text, 'the closing section prints an unsourced response commitment').not.toMatch(
      /respon(?:d|se)\s+(?:time|within)|reply\s+within/i,
    );

    // The rendered words a visitor reads — kicker, title, sentence, the plate, the
    // four routes and the coffee line. The budget is TC-LISTEN-02's; measured here
    // on innerText so the plate's own label is inside it.
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    expect(words, `#listen renders ${words} words`).toBeLessThanOrEqual(WORD_CAP);
    expect(text).toContain(LABEL);
  });

  test('TC-LISTEN-CTA-04: no booking host ships — not in the built export, not in the section', async ({
    page,
  }) => {
    // The built export the suite is pointed at. A booking URL is public by nature,
    // but until a key NAMED for one exists in .env.production there is nothing
    // real to link to, and a fabricated one is a 404 (LISTEN-FLAGSHIP.md §3.1).
    const out = join(process.cwd(), 'out');
    expect(existsSync(out), 'out/ is not built — run npm run build:static first').toBe(true);

    const TEXT = new Set(['.html', '.js', '.mjs', '.css', '.json', '.txt', '.xml', '.webmanifest', '.svg', '.map']);
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        const stat = statSync(path);
        if (stat.isDirectory()) {
          walk(path);
        } else if (TEXT.has(extname(path).toLowerCase()) && BOOKING_HOST.test(readFileSync(path, 'utf8'))) {
          hits.push(relative(out, path));
        }
      }
    };
    walk(out);
    expect(hits, 'built output references a booking host').toEqual([]);

    await gotoListen(page);
    const booking = await page
      .locator(`${LISTEN} a`)
      .evaluateAll((els) =>
        els.map((el) => el.getAttribute('href') || '').filter((href) => /cal\.com|calendly|savvycal/i.test(href)),
      );
    expect(booking, '#listen links to a booking host').toEqual([]);
  });
});
