import { execFileSync } from 'node:child_process';

import { test, expect, type Page } from '@playwright/test';
import { knowledgeBase } from '../../app/data/miniVicKnowledge';

/**
 * Content parity — the CV's facts, still on the page after the rebuild.
 *
 * This file's only job is to prove that the rewrite did not quietly lose a
 * fact. The site's copy now lives in six per-section modules under
 * `app/data/portfolio/` instead of in one `siteContent.ts` blob, and the
 * sections that used to hold these facts (`#work`, `#contact`, `#dossier`,
 * `#mindset`) are gone — but the facts themselves are all still checkable
 * against `public/docs/Vik_Resume_Final.pdf`, so the checks were re-pointed at
 * whichever section now carries each one rather than deleted with the section.
 *
 * Three of the old checks were dropped outright because their subject was a
 * component, not a fact: CT-12/CT-13 tested the hero outcome cards and their
 * flyout, and CT-16 tested the Dossier frame's role label. The claims those
 * components made are re-asserted here against the hero ledger and the
 * experience roles instead.
 *
 * CT-10 additionally carries what `tests/overhaul/mindset.spec.ts` used to
 * guard before `#mindset` was deleted: that the page states at least one
 * multi-million-dollar figure and at least one multi-year span, and that every
 * such figure is printed with its provenance rather than on its own. That was
 * the whole point of the projection cards, and it is now the hero ledger's job.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
}

test.describe('Content Preservation', () => {
  test.describe.configure({ timeout: 60000 });

  // ── The hero: app/data/portfolio/hero.ts ──

  test('CT-01: Hero name from hero.ts appears verbatim', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('#hero h1')).toHaveText('Vikram Deshpande');
  });

  test('CT-02: Hero positioning line appears verbatim', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('#hero')).toContainText(
      'Delivery leadership · AI solutions architecture',
    );
  });

  test('CT-03: Hero statement states a tenure and names the current engagement', async ({ page }) => {
    await gotoHome(page);
    // The tenure figure is a year count that advances, so it is matched as a
    // pattern rather than pinned to the word that happens to be correct this
    // year — pinning it turns a birthday into a test failure. What must not
    // drift is the rest: the three industries, and the engagement the CV names.
    await expect(page.locator('#hero')).toContainText(
      /\w+ years leading delivery across government, banking and telecommunications/,
    );
    await expect(page.locator('#hero')).toContainText("Australian Taxation Office's Payday Super");
  });

  // ── The about section: app/data/portfolio/about.ts ──
  //
  // `siteContent.about` — the two-paragraph biography — was deleted with the
  // rebuild and the export removed rather than left dangling. The section is
  // now ten job-fit dimensions, and tests/e2e/about.spec.ts owns its
  // behavioural contract; this check only pins the career facts a recruiter
  // scans for, which is a parity concern rather than a UI one.
  test('CT-05: About carries the career facts', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#about').scrollIntoViewIfNeeded();
    // Same reasoning as CT-03: the tenure is a moving number, the rest is not.
    await expect(page.locator('#about')).toContainText(
      /\w+ years\. Senior delivery lead and AI\/ML solutions architect since 2017/,
    );
    await expect(page.locator('#about')).toContainText('Melbourne, Victoria');
    await expect(page.locator('#about')).toContainText('Australian Taxation Office');
  });

  // ── The experience section: app/data/portfolio/experience.ts ──

  test('CT-04: Every employer on the CV is named in the experience timeline', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#experience').scrollIntoViewIfNeeded();
    const experience = page.locator('#experience');
    for (const employer of [
      'Australian Taxation Office',
      'ANZ',
      'National Australia Bank',
      'Microsoft',
      'Telstra',
      'InfoCentric',
      'MYOB',
    ]) {
      await expect(experience).toContainText(employer);
    }
  });

  // ── The vitrine: app/data/portfolio/vitrine.ts ──

  test('CT-06: All six curated repositories render as plates with real GitHub links', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#vitrine').scrollIntoViewIfNeeded();
    const vitrine = page.locator('#vitrine');
    for (const repo of [
      'aether-job-career-agent',
      'abentertainment',
      'ralph-loop-infinite',
      'prompt-reconstruction-engine',
      'jyotish-shastra',
      'forgotten-mistory',
    ]) {
      await expect(vitrine).toContainText(repo);
    }

    // Every plate links somewhere a reader can actually check.
    const sources = vitrine.locator('a[href^="https://github.com/"]');
    expect(await sources.count()).toBeGreaterThanOrEqual(6);
  });

  test('CT-07: The Vedic-astronomy work survives the rebuild as a vitrine plate', async ({ page }) => {
    await gotoHome(page);
    // This work used to sit in the hero's narrative and was then demoted into
    // `#work`. `#work` is gone; the repository is now plate 05, which is a
    // stronger home for it because the plate also prints what the engine
    // refuses to do.
    await page.locator('#vitrine').scrollIntoViewIfNeeded();
    await expect(page.locator('#vitrine')).toContainText('Vedic');
    await expect(page.locator('#hero')).not.toContainText('Vedic');
  });

  // ── The skills card: app/data/portfolio/skills.ts ──

  test('CT-08: Credentials and the un-held certification both appear in the calibration table', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#skills').scrollIntoViewIfNeeded();
    const skills = page.locator('#skills');

    // The credentials the CV actually claims.
    await expect(skills).toContainText('Certified Scrum Master');
    await expect(skills).toContainText('Monash University');
    await expect(skills).toContainText('University of Melbourne');

    // And the one it does not: the CV says AWS and GCP are being studied with no
    // certificate issued, and the card has to say so too. This row is the reason
    // every row above it is believable, so losing it would be the single most
    // damaging content regression this section could suffer.
    const pending = skills.locator('tr[data-status="pending"]');
    await expect(pending).toHaveCount(1);
    await expect(pending).toContainText('AWS and GCP');
    await expect(pending).toContainText('no certificate issued');
  });

  // ── The closing section: app/data/portfolio/listen.ts ──

  test('CT-09: Contact channels from siteContent appear verbatim in the closing section', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#listen').scrollIntoViewIfNeeded();
    const listen = page.locator('#listen');
    await expect(listen).toContainText('sarkar.vikram@gmail.com');
    await expect(listen).toContainText('+61 433 224 556');
    // Two anchors now carry the address: the engagement plate, which sends a
    // pre-addressed enquiry, and the route, which is the address itself. The
    // route is the one that has to read verbatim; the plate's own contract —
    // one per section, with a non-empty subject — is AP-04/AP-05 in
    // tests/e2e/audience-paths.spec.ts.
    await expect(listen.locator('a[href="mailto:sarkar.vikram@gmail.com"]')).toHaveCount(1);
    await expect(listen.locator('a[data-cta="engage"]')).toHaveAttribute(
      'href',
      /^mailto:sarkar\.vikram@gmail\.com\?subject=.+/,
    );
    await expect(listen.locator('a[href^="tel:"]')).toHaveAttribute('href', 'tel:+61433224556');
  });

  test('CT-10: Every hero figure is printed with the source it came from', async ({ page }) => {
    await gotoHome(page);

    // The quantified claims themselves — the same four the deleted ProofBar and
    // the deleted #mindset projection cards used to restate.
    const ledgerItems = page.locator('#hero ul li');
    await expect(ledgerItems).toHaveCount(3);
    const ledgerText = await page.locator('#hero ul').innerText();
    expect(ledgerText).toContain('92');
    expect(ledgerText).toContain('$5M+');
    expect(ledgerText).toContain('10k+');

    // TC-FR-MINDSET's two substantive requirements, preserved: at least one
    // multi-million-dollar figure and at least one multi-year span, both on the
    // page and both traceable.
    expect(ledgerText).toMatch(/\$\d+M/);
    // No leading `\b`: Playwright concatenates the section's text nodes, so the
    // span runs straight on from the line before it ("architectureSixteen").
    await expect(page.locator('#hero')).toContainText(
      /(?:fifteen|sixteen|seventeen|eighteen|nineteen|twenty|\d+\+?)\s*years?\b/i,
    );

    // And the part that keeps them honest: each figure carries a caliper mark
    // grading it, plus the provenance line naming where the work happened. The
    // three hero figures are the candidate's own account of his own programmes
    // — no third party published a methodology a reader could go and check —
    // so the mark they carry is `self-reported`, not `sourced`. Asserting
    // `sourced` here is what let an earlier pass grade its own claims too well;
    // this test now fails if any of them is ever upgraded without a citation.
    for (let i = 0; i < 3; i += 1) {
      const item = ledgerItems.nth(i);
      await expect(item.locator('[data-state="self-reported"]')).toHaveCount(1);
      await expect(item.locator('[data-state="sourced"]')).toHaveCount(0);
      const source = await item.innerText();
      expect(source, `hero ledger item ${i} has no provenance line`).toMatch(/ATO|ANZ/);
    }

    // The grade is explained once, in the hero, rather than left as an
    // uninterpretable glyph beside each number.
    await expect(page.locator('#hero')).toContainText(/self-reported/i);
  });

  test('CT-11: GitHub and LinkedIn are linked from the closing section', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#listen').scrollIntoViewIfNeeded();
    const listen = page.locator('#listen');
    // The profile, specifically — an exact-href match, not a substring on the
    // owner. Substring matching here has been wrong before, and an assertion
    // that can be satisfied by an unrelated link to the same account proves
    // nothing about whether the reader can reach him.
    await expect(
      listen.locator('a[href="https://github.com/Victordtesla24"]'),
    ).toHaveCount(1);
    await expect(listen.locator('a[href*="linkedin.com/in/vikramd-profile"]')).toHaveCount(1);
    // The YouTube channel is still declared in the Person JSON-LD, but it is no
    // longer an anchor anywhere on the page — the closing section offers four
    // channels and a coffee, and a video channel is not one of them.
    await expect(listen.locator('a[href*="youtube.com"]')).toHaveCount(0);
  });

  test('CT-15: LinkedIn (primary recruiter channel) is linked from the persistent navigation', async ({ page }) => {
    await gotoHome(page);
    await page.locator('.menu-toggle').click();
    const li = page.locator('#site-nav-overlay a[href*="linkedin.com/in/vikramd-profile"]');
    await expect(li).toHaveCount(1);
  });

  // ── miniVicKnowledge.ts ──

  test('CT-14: MiniVicBot mounts from the layout without throwing', async ({ page }) => {
    // The listener has to be attached before navigation — the old version
    // registered it after the page had already loaded, so it could only ever
    // observe an empty array.
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await gotoHome(page);
    await expect(page.locator('[data-testid="minivic-toggle"]')).toBeVisible();
    await page.waitForTimeout(2000);

    expect(errors, `page errors while MiniVicBot mounted:\n${errors.join('\n')}`).toHaveLength(0);
  });

  test('CT-17: MiniVic availability default and hiring copy keep active-intent ATO wording', async () => {
    const availability = knowledgeBase.find((entry) => entry.id === 'availability');
    expect(availability).toBeDefined();

    if (!availability) {
      throw new Error('Availability entry is missing from miniVicKnowledge.');
    }

    const defaultAnswer = availability.answer;
    const hiringAnswer = availability.personaVariants?.hiring;

    expect(hiringAnswer, 'availability.hiring persona variant is required').toBeTruthy();

    for (const [variant, answer] of [
      ['default', defaultAnswer],
      ['hiring', hiringAnswer ?? ''],
    ] as const) {
      expect(answer, `${variant} availability must signal active intent`).toContain('actively exploring');
      expect(
        /(?:ato|australian taxation office|payday super)/i.test(answer),
        `${variant} availability must mention current ATO work`,
      ).toBe(true);
      expect(answer.toLowerCase(), `${variant} availability must not claim off-market`).not.toContain(
        'not on the market',
      );
    }
  });

  /**
   * CT-11: the tenure figure is never higher than its evidence (R-c8 ADV-F-4,
   * R-c13 ADV-6).
   *
   * The CV's own headline says "15+ year"; the page says "Sixteen years". Both
   * are true — the roles in `app/data/portfolio/experience.ts` run May 2010 to
   * September 2026, which is 16.3 years elapsed and 16.2 years of role spans
   * summed — but a reader holding the PDF sees the site round up past its
   * source unless the page shows its working. So every rendered tenure claim
   * must either appear verbatim in the CV text, or print the two years it is
   * derived from inside the same element, where a reader can check the
   * subtraction without leaving the sentence.
   *
   * `pdftotext` supplies the verbatim half when poppler is installed. Where it
   * is not, the escape hatch simply is not available and every claim has to
   * carry its anchors — a stricter test, never a skipped one.
   */
  test('CT-11: every tenure claim on the page carries its evidence', async ({ page }) => {
    let cvText = '';
    try {
      cvText = execFileSync('pdftotext', ['-layout', 'public/docs/Vik_Resume_Final.pdf', '-'], {
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024,
      });
    } catch {
      cvText = '';
    }

    await gotoHome(page);
    for (const id of ['#about', '#experience', '#vitrine', '#listen']) {
      await page.locator(id).scrollIntoViewIfNeeded();
    }
    await page.locator('#hero').scrollIntoViewIfNeeded();

    const claims = await page.evaluate(() => {
      const TENURE =
        /\b(?:fifteen|sixteen|seventeen|eighteen|nineteen|twenty|\d{1,2}\+?)[\s-]*years?\b/i;
      const out: { path: string; text: string }[] = [];
      const all = Array.from(document.body.querySelectorAll<HTMLElement>('*'));
      for (const el of all) {
        if (el.closest('script,style,noscript,template,[hidden],[aria-hidden="true"]')) continue;
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (!TENURE.test(text)) continue;
        // Only the deepest element that still states the claim: an ancestor
        // "carries" it only because its child does.
        const deeper = Array.from(el.children).some((child) =>
          TENURE.test((child.textContent || '').replace(/\s+/g, ' ').trim()),
        );
        if (deeper) continue;
        const section = el.closest('section[id]')?.id ?? el.tagName.toLowerCase();
        out.push({ path: `${section} > ${el.tagName.toLowerCase()}`, text });
      }
      return out;
    });

    expect(claims.length, 'no tenure claim renders on the page at all').toBeGreaterThan(0);

    const cv = cvText.replace(/\s+/g, ' ').toLowerCase();
    const offenders = claims.filter(({ text }) => {
      const phrase = text.match(
        /\b(?:fifteen|sixteen|seventeen|eighteen|nineteen|twenty|\d{1,2}\+?)[\s-]*years?\b/i,
      )![0];
      const verbatim = cv.length > 0 && cv.includes(phrase.toLowerCase());
      const anchored = /\b2010\b/.test(text) && /\b2026\b/.test(text);
      return !verbatim && !anchored;
    });

    expect(
      offenders.map((o) => `${o.path}: ${o.text.slice(0, 120)}`),
      'a tenure claim states a figure the CV does not, without printing the years it comes from',
    ).toEqual([]);
  });
});
