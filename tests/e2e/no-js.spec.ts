import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { expect, test } from '@playwright/test';

/**
 * The page paints without JavaScript.
 *
 * `components/sections/Hero/Hero.tsx` prints a promise on the page — *nothing
 * here waits on JavaScript; every word is server-rendered and visible* — and
 * `CLAUDE.md` repeats it: *the hero must be fully readable with WebGL
 * unavailable — the scene is never the content*. Nothing in the suite held
 * either claim to a measurement. Every other spec runs with script enabled, so
 * the one reader the promise is written for — a crawler that does not execute,
 * a locked-down browser, a person on a hostile network — was never in the room.
 *
 * It failed in production and no test noticed. Lane G-H2a photographed it
 * (`docs/delivery/evidence/v10-20260905T0515Z/G-H2a/09-js-blocked-1440.png`):
 * with script off the export painted the string "Loading portfolio" and a
 * footer, and `#hero` measured 0x0. The whole route sat behind the Suspense
 * boundary that `app/loading.tsx` creates. When the boundary's children are not
 * ready by the time React flushes the shell, React emits the *fallback* into
 * the HTML and streams the real markup afterwards inside `<div hidden>`, to be
 * swapped in by an inline `$RC(...)` script. A static export writes that whole
 * stream to a file, so `out/index.html` shipped the hero — and every word of
 * every section — behind a swap that only runs if script runs.
 *
 * ## What this file asserts, and why it is four tests rather than two
 *
 * 01 and 02 are the promise itself, at the two widths the acceptance names:
 * with `javaScriptEnabled: false`, the hero's name, role, statement, actions
 * and photograph are painted — not merely present in the DOM — and all six
 * section headings are readable.
 *
 * 03 and 04 are the *mechanism*, and they exist because 01 and 02 alone are not
 * enough. On the tree this file was written against, 01 and 02 already passed:
 * the boundary happened to resolve before the shell flushed, so no fallback was
 * emitted and the content was inline. That is an accident of what the page
 * currently imports, not a property of it. One `await` in a server component,
 * one `next/dynamic` that suspends during the prerender, and the fallback comes
 * back — and 01 and 02 would go on passing right up until the build where they
 * do not, with nothing in between to say the guarantee had become conditional.
 *
 * So 03 reads the served bytes and refuses a pending Suspense marker or a
 * fallback shell in them, and 04 refuses the boundary itself: a fully static
 * route has nothing to suspend on, so a `loading.tsx` in front of it buys
 * nothing and can only ever hide it. With no fallback to flush, React cannot
 * emit an incomplete shell — it holds the shell until the tree resolves — which
 * turns "the page paints without JavaScript" from something this build happens
 * to do into something the export cannot stop doing.
 *
 * 03 and 04 are the two that were red when this file was written (the string
 * `loading-shell` was in the served bytes and `app/loading.tsx` was on disk);
 * 01 and 02 were green and are here to stay green.
 */

const REPO_ROOT = path.resolve(__dirname, '..', '..');

/** The reveal is a CSS animation (`heroRise`, `both`), not a script. It runs
 *  with script disabled, but it runs on a delay — `--step * --stagger + 120ms`
 *  — so a probe that reads opacity on `load` reads the first frame of the
 *  animation and calls a fading element hidden. Poll instead of sleeping: a
 *  fixed wait either flakes on a slow host or hides a real stall on a fast one. */
async function expectPainted(
  locator: import('@playwright/test').Locator,
  what: string,
): Promise<void> {
  await expect(locator, `${what} is in the document`).toHaveCount(1);
  await expect
    .poll(
      async () =>
        locator.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return {
            opacity: Number(style.opacity),
            visibility: style.visibility,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        }),
      {
        message: `${what} is painted with script disabled`,
        timeout: 15000,
      },
    )
    .toEqual(
      expect.objectContaining({
        opacity: 1,
        visibility: 'visible',
      }),
    );

  const box = await locator.boundingBox();
  expect(box, `${what} has a box`).not.toBeNull();
  expect(box!.width, `${what} width`).toBeGreaterThan(0);
  expect(box!.height, `${what} height`).toBeGreaterThan(0);
}

const SECTIONS: ReadonlyArray<{ id: string; heading: string }> = [
  { id: 'hero', heading: 'Vikram Deshpande' },
  { id: 'about', heading: 'Ten dimensions, answered' },
  { id: 'experience', heading: 'Sixteen years, to scale' },
  { id: 'skills', heading: 'Calibration card' },
  { id: 'vitrine', heading: 'Six of thirty-eight' },
  { id: 'listen', heading: 'Feedback & coffee?' },
];

test.describe('No JavaScript', () => {
  // Context-scoped, so it belongs on the describe rather than at file level.
  test.use({ javaScriptEnabled: false });

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    test(`TC-NOJS-0${viewport.width === 1440 ? 1 : 2}: the hero and all six sections paint with script disabled at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/', { waitUntil: 'load' });

      // The section itself, first: G-H2a measured this at 0x0.
      const hero = page.locator('#hero');
      await expectPainted(hero, '#hero');
      const heroBox = await hero.boundingBox();
      expect(heroBox!.width).toBeGreaterThanOrEqual(viewport.width * 0.9);
      expect(heroBox!.height).toBeGreaterThan(400);
      console.log(
        `no-js #hero box at ${viewport.width}x${viewport.height}: ` +
          `${Math.round(heroBox!.width)}x${Math.round(heroBox!.height)}`,
      );

      // The four things a reader has to be able to read, and the photograph.
      await expectPainted(page.locator('#hero h1'), 'the hero name');
      await expect(page.locator('#hero h1')).toHaveText('Vikram Deshpande');
      await expectPainted(
        page.locator('#hero p').filter({ hasText: 'Delivery leadership' }),
        'the hero role line',
      );
      await expectPainted(
        page.locator('#hero p').filter({ hasText: 'Sixteen years leading delivery' }),
        'the hero statement',
      );
      await expectPainted(
        page.locator('#hero a', { hasText: 'See the evidence' }),
        'the primary hero action',
      );
      await expectPainted(
        page.locator('#hero a', { hasText: 'Download CV' }),
        'the secondary hero action',
      );

      // The first-paint poster (G-H2a): an <img>, not the WebGL scene, and it
      // has to have decoded — a broken source reports naturalWidth 0.
      const portrait = page.locator('#hero img').first();
      await expectPainted(portrait, 'the hero photograph');
      const decoded = await portrait.evaluate(
        (el) => (el as HTMLImageElement).naturalWidth,
      );
      expect(decoded, 'the hero photograph decoded').toBeGreaterThan(0);

      // Every section's own heading, readable.
      for (const section of SECTIONS) {
        const heading = page.locator(`#${section.id} h1, #${section.id} h2`).first();
        await expectPainted(heading, `the #${section.id} heading`);
        await expect(heading).toContainText(section.heading);
      }

      // And the negative: the fallback's copy is not what a reader gets.
      const text = (await page.locator('body').innerText()).trim();
      expect(text).not.toMatch(/^Loading portfolio$/);
      expect(text).toContain('Vikram Deshpande');
      expect(text.length, 'the page is more than a loading shell').toBeGreaterThan(2000);
    });
  }

  test('TC-NOJS-03: the served HTML carries no Suspense fallback in front of the route', async ({
    request,
  }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(200);
    const html = await response.text();

    // React's streaming markers. `<!--$?-->` opens a boundary whose content has
    // not arrived; `<template id="B:n">` marks where it will go; `$RC` is the
    // script that swaps it in. Any of the three means the reader is looking at
    // a fallback and the real page is behind script.
    expect(html, 'a pending Suspense boundary in the shell').not.toContain('<!--$?-->');
    expect(html, 'a streaming insertion point').not.toMatch(/<template id="B:\d/);
    expect(html, 'a client-side content swap').not.toContain('$RC(');
    expect(html, 'the page markup hidden behind a swap').not.toMatch(
      /<div hidden id="S:\d/,
    );
    // The fallback's own markup and copy, in the rendered document or in the
    // flight payload that would rebuild it.
    expect(html, 'the loading shell').not.toContain('loading-shell');
    expect(html, "the fallback's copy").not.toContain('Loading portfolio');

    // The positive half: the hero really is in the bytes, ahead of the footer.
    const mainAt = html.indexOf('<main');
    const heroAt = html.indexOf('id="hero"');
    const footerAt = html.indexOf('<footer');
    expect(mainAt, '<main> in the served bytes').toBeGreaterThan(-1);
    expect(heroAt, '#hero in the served bytes').toBeGreaterThan(mainAt);
    expect(html).toContain('Vikram Deshpande');
    if (footerAt > -1) {
      // Document order matters beyond tidiness: the streaming shell used to emit
      // <footer> before <main>, which is how the footer came to paint inside the
      // fold and score 0.1556 CLS (87c9667).
      expect(footerAt, '<footer> after <main>').toBeGreaterThan(mainAt);
    }
  });

  test('TC-NOJS-04: the static route has no loading.tsx', async () => {
    // `app/loading.tsx` is the boundary itself. The route is a client component
    // with no async data and the export is fully prerendered, so there is
    // nothing for it to cover — it can only ever stand in front of a page that
    // is already there. Deleting its styles from `app/globals.css` in the same
    // change is not optional either: TC-NFR-DEADCSS fails the audit on a rule
    // whose classes no source file can render.
    const exists = await readFile(path.join(REPO_ROOT, 'app', 'loading.tsx'))
      .then(() => true)
      .catch(() => false);
    expect(exists, 'app/loading.tsx exists').toBe(false);

    const globals = await readFile(path.join(REPO_ROOT, 'app', 'globals.css'), 'utf8');
    expect(globals, 'a .loading-* rule with nothing to style').not.toMatch(
      /\.loading-(shell|bar-track|bar-fill|center|label)\b/,
    );
  });
});
