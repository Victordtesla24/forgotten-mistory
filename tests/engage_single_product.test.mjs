/**
 * engage_single_product.test.mjs — one engagement product, defined once.
 *
 * G-C1 (docs/adversarial/GAP-BACKLOG.md) is binary: either both engage plates
 * point at a real calendar URL read from a NAMED env key, or they carry one
 * single honest `mailto:` with the same subject and the same body. Two different
 * mailto promises over one inbox is a FAIL, and that is what shipped: `#listen`
 * offered "Email a 20-minute-call agenda" with a four-line agenda body while
 * `#vitrine` offered "Email a project brief" with a different subject and no
 * body at all (docs/architecture/G-C1-HONEST-CTA.md §7.1).
 *
 * The root cause was not the copy. It was that two section data files each owned
 * a private copy of the product, so they could drift without any test noticing.
 * The fix is structural — one definition in `app/data/siteContent.ts`, next to
 * `contact`, imported by both surfaces — and this file is what makes the drift
 * impossible to reintroduce quietly: it pins the *shape* (defined once, imported
 * twice) as well as the strings.
 *
 * It is a `node --test` file rather than a Playwright spec on purpose. The
 * defect is in the data, so the assertion belongs before a build, not after a
 * deploy: this fails in under a second on a checkout with no `out/` at all.
 * `tests/e2e/audience-paths.spec.ts` AP-06/07/08 own the rendered pair.
 *
 * Usage:  node --test tests/engage_single_product.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const ROOT = process.cwd();
const SITE_CONTENT = join(ROOT, 'app', 'data', 'siteContent.ts');
const LISTEN = join(ROOT, 'app', 'data', 'portfolio', 'listen.ts');
const VITRINE = join(ROOT, 'app', 'data', 'portfolio', 'vitrine.ts');

const siteContentSource = readFileSync(SITE_CONTENT, 'utf8');
const listenSource = readFileSync(LISTEN, 'utf8');
const vitrineSource = readFileSync(VITRINE, 'utf8');

/**
 * `siteContent.ts` imports nothing, so transpiling that one file loads the real
 * product — not a second copy of the four strings that could quietly disagree
 * with the one the page renders.
 */
async function loadSiteContent() {
  const { outputText } = ts.transpileModule(siteContentSource, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
    fileName: 'siteContent.ts',
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText, 'utf8').toString('base64')}`);
}

/** The single href expression. Exactly one file in the repo may contain it. */
const HREF_EXPRESSION = /mailto:\$\{contact\.email\}\?subject=/g;

/** The agreed strings (docs/architecture/G-C1-HONEST-CTA.md §7.3), verbatim. */
const LABEL = 'Email a 20-minute-call agenda';
const SUBJECT = '20-minute call — Vikram Deshpande';
const BODY = [
  'Hiring or a project:',
  "What you're building:",
  'The decision you need made:',
  'Two or three times that suit you (Melbourne time):',
  'Anything I should read first:',
];

/** No plate may promise a tool that does not exist (§7.2 — 0 calendar key names). */
const BOOKING_VERB = /\bbook(ing)?\b|start a project/i;
const BOOKING_HOST = /cal\.com|calendly|savvycal/i;

const count = (source, pattern) => (source.match(pattern) ?? []).length;
const occurrences = (source, literal) => source.split(literal).length - 1;

/** The `engagement`/`engage` declarations only — comments and unrelated copy are not the product. */
function engagementLiterals() {
  const vitrineBlock = vitrineSource.slice(
    vitrineSource.indexOf('export const engagement'),
    vitrineSource.indexOf('export interface PlateMetric'),
  );
  const listenEngage = listenSource.slice(
    listenSource.indexOf('  engage:'),
    listenSource.indexOf('  channels:'),
  );
  assert.ok(vitrineBlock.length > 0, 'vitrine.ts declares no `export const engagement`');
  assert.ok(listenEngage.length > 0, 'listen.ts declares no `engage:` key on listenContent');
  return { vitrineBlock, listenEngage };
}

describe('ESP — one engagement product on Listen and Vitrine (G-C1)', () => {
  it('ESP-01: the product is defined exactly once', () => {
    assert.equal(
      count(siteContentSource, HREF_EXPRESSION),
      1,
      'app/data/siteContent.ts must build the engagement mailto exactly once',
    );
    assert.equal(
      count(listenSource, HREF_EXPRESSION),
      0,
      'app/data/portfolio/listen.ts builds its own engagement mailto — that is the drift G-C1 is about',
    );
    assert.equal(
      count(vitrineSource, HREF_EXPRESSION),
      0,
      'app/data/portfolio/vitrine.ts builds its own engagement mailto — that is the drift G-C1 is about',
    );
  });

  it('ESP-02: no section file redeclares a subject or a body', () => {
    for (const [name, source] of [
      ['listen.ts', listenSource],
      ['vitrine.ts', vitrineSource],
    ]) {
      for (const symbol of ['ENGAGE_SUBJECT', 'ENGAGE_AGENDA', 'ENGAGE_HREF', 'ENGAGEMENT_SUBJECT']) {
        assert.equal(
          source.includes(symbol),
          false,
          `${name} still declares ${symbol} — the product has two owners again`,
        );
      }
    }
  });

  it('ESP-03: both surfaces import the same symbol', () => {
    const importsEngagement = /import \{[^}]*\bENGAGEMENT\b[^}]*\} from '\.\.\/siteContent'/;
    assert.match(listenSource, importsEngagement, 'listen.ts does not import ENGAGEMENT from ../siteContent');
    assert.match(vitrineSource, importsEngagement, 'vitrine.ts does not import ENGAGEMENT from ../siteContent');
  });

  it('ESP-04: the strings are the agreed ones', () => {
    for (const literal of [SUBJECT, LABEL, ...BODY]) {
      assert.equal(
        occurrences(siteContentSource, literal),
        1,
        `siteContent.ts must contain ${JSON.stringify(literal)} exactly once`,
      );
    }
  });

  it('ESP-05: no booking verb anywhere in the product', async () => {
    const { ENGAGEMENT } = await loadSiteContent();
    const productStrings = [ENGAGEMENT.label, ENGAGEMENT.subject, ...ENGAGEMENT.agenda, ENGAGEMENT.href];
    for (const value of productStrings) {
      assert.doesNotMatch(value, BOOKING_VERB, `the engagement product promises a booking tool: ${value}`);
    }
    const { vitrineBlock, listenEngage } = engagementLiterals();
    assert.doesNotMatch(vitrineBlock, BOOKING_VERB, 'vitrine.ts engagement declaration carries a booking verb');
    assert.doesNotMatch(listenEngage, BOOKING_VERB, 'listen.ts engage declaration carries a booking verb');
  });

  it('ESP-06: no calendar host is introduced', () => {
    for (const [name, source] of [
      ['siteContent.ts', siteContentSource],
      ['listen.ts', listenSource],
      ['vitrine.ts', vitrineSource],
    ]) {
      assert.doesNotMatch(source, BOOKING_HOST, `${name} links a booking host that does not exist on this account`);
    }
  });

  it('ESP-07: the one href decodes to the agreed subject and the agreed five-line body, under the 900-character cap', async () => {
    const { ENGAGEMENT, contact } = await loadSiteContent();

    assert.equal(ENGAGEMENT.label, LABEL);
    assert.equal(ENGAGEMENT.subject, SUBJECT);
    assert.deepEqual([...ENGAGEMENT.agenda], BODY);

    assert.ok(
      ENGAGEMENT.href.startsWith(`mailto:${contact.email}?`),
      `href does not address ${contact.email}: ${ENGAGEMENT.href}`,
    );
    assert.ok(ENGAGEMENT.href.length <= 900, `mailto href is ${ENGAGEMENT.href.length} characters`);
    assert.doesNotMatch(ENGAGEMENT.href, /\s/, 'mailto href carries raw whitespace');
    assert.ok(ENGAGEMENT.href.includes('%0A'), 'agenda line breaks are not percent-encoded');

    const url = new URL(ENGAGEMENT.href);
    const params = new URLSearchParams(url.search);
    assert.equal(url.pathname, contact.email);
    assert.equal(params.get('subject'), SUBJECT);
    assert.deepEqual((params.get('body') ?? '').split('\n'), BODY);
  });

  it('ESP-08: Vitrine reuses the product rather than restating it, and adds only its note', () => {
    const { vitrineBlock } = engagementLiterals();
    assert.match(
      vitrineBlock,
      /\.\.\.ENGAGEMENT/,
      'vitrine.ts does not spread ENGAGEMENT — the two plates can drift again',
    );
    assert.equal(
      /\bhref\s*:/.test(vitrineBlock),
      false,
      'vitrine.ts declares its own href — the two plates can drift again',
    );
    assert.equal(
      /\blabel\s*:/.test(vitrineBlock),
      false,
      'vitrine.ts declares its own label — the two plates can drift again',
    );
    assert.match(
      vitrineBlock,
      /note: 'These six are shipped work\. The inbox that answers a role enquiry answers a project brief\.'/,
      'vitrine.ts lost its section-local note',
    );
  });
});
