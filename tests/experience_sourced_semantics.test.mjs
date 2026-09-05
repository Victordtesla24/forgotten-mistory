/**
 * experience_sourced_semantics.test.mjs — gold on #experience means a record.
 *
 * G-E2 (ADV-1451Z P1 / GAP-BACKLOG 1556): the Experience section taught the
 * site's evidence language with zero gold. The fix is the same rule the rest of
 * the page already obeys — gold marks a claim a reader can go and check — pinned
 * here at the data and wiring level so it holds without a browser:
 *
 *  1. **The allow-list does not drift.** `app/data/portfolio/checkableRecords.ts`
 *     is the one set of records gold is licensed against, and it is the same set
 *     `tests/about_sourced_semantics.test.mjs` writes out. This file keeps its
 *     own literal copy and asserts the two are identical, so widening one
 *     without the other fails here.
 *
 *  2. **Employers are records; a self-described engagement is not.** Every real
 *     employer on the CV (`app/data/siteContent.ts`) names a record and earns
 *     the mark. "Independent AI Consulting & Upskilling" names none — it is a
 *     period of self-directed work, not an organisation an outsider can open —
 *     so it stays grey. The independent role is the whole reason a blanket
 *     "every employer is gold" rule would be dishonest.
 *
 *  3. **Dates are never a record.** A start month, an end month, a duration and
 *     a bare year all match nothing in the allow-list, so nothing in the chart's
 *     time axis can carry gold — which is the invariant the playhead and the
 *     duration readouts depend on.
 *
 *  4. **The mark is wired to the data, not sprinkled on.** `Experience.tsx`
 *     reads a `sourced` flag onto the employer string and onto nothing else; the
 *     stylesheet spends the *saturated* gold only under the active/open row, so
 *     a chart of eight employers never lights eight "look here"s at once — the
 *     per-view gold budget the vitrine and skills already hold.
 *
 * Usage:  node --test tests/experience_sourced_semantics.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const ROOT = process.cwd();
const RECORDS = join(ROOT, 'app', 'data', 'portfolio', 'checkableRecords.ts');
const EXPERIENCE_DATA = join(ROOT, 'app', 'data', 'portfolio', 'experience.ts');
const SITE_CONTENT = join(ROOT, 'app', 'data', 'siteContent.ts');
const EXPERIENCE_COMPONENT = join(ROOT, 'components', 'sections', 'Experience', 'Experience.tsx');
const EXPERIENCE_CSS = join(ROOT, 'components', 'sections', 'Experience', 'Experience.module.css');
const STRATA_GLSL = join(ROOT, 'components', 'sections', 'Experience', 'strata.glsl.ts');
const CAREER_STRATA = join(ROOT, 'components', 'sections', 'Experience', 'CareerStrata.tsx');
const MINIVIC = join(ROOT, 'components', 'MiniVicBot.tsx');

/**
 * `checkableRecords.ts` imports nothing, so transpiling that one file loads the
 * real allow-list and matcher — no build step, no second copy that could
 * quietly disagree with the module the page grades against.
 */
async function loadRecords() {
  const source = readFileSync(RECORDS, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
    fileName: 'checkableRecords.ts',
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(outputText, 'utf8').toString('base64')}`
  );
}

/** The canonical list, written out so a drift is a failing literal diff. */
const CANONICAL_RECORDS = [
  'Australian Taxation Office',
  'ATO',
  'ANZ',
  'National Australia Bank',
  'NAB',
  'Microsoft',
  'Telstra',
  'InfoCentric',
  'MYOB',
  'Payday Super',
  'aether-job-career-agent',
  'abentertainment',
  'ralph-loop-infinite',
  'prompt-reconstruction-engine',
  'jyotish-shastra',
  'forgotten-mistory',
  'GitHub',
];

/** Read the `company:` string of every role in siteContent, in source order. */
function companiesFromSiteContent() {
  const source = readFileSync(SITE_CONTENT, 'utf8');
  const block = source.slice(
    source.indexOf('export const experience'),
    source.indexOf('export const skillGroups'),
  );
  return Array.from(block.matchAll(/company:\s*'([^']+)'/g)).map((m) => m[1]);
}

describe('#experience — the allow-list is the one the rest of the page uses', () => {
  it('exposes exactly the records tests/about_sourced_semantics.test.mjs allows', async () => {
    const { CHECKABLE_RECORDS } = await loadRecords();
    assert.deepEqual(
      [...CHECKABLE_RECORDS],
      CANONICAL_RECORDS,
      'checkableRecords.ts must stay identical to the allow-list About grades against — ' +
        'gold means the same thing in both sections or it means nothing',
    );
  });
});

describe('#experience — an employer is a record, a self-run engagement is not', () => {
  it('marks every real employer on the CV as a checkable record', async () => {
    const { matchRecord } = await loadRecords();
    const employers = companiesFromSiteContent();
    assert.ok(employers.length >= 8, 'the CV lists at least eight roles');

    const independent = employers.filter((c) => /independent/i.test(c));
    assert.equal(independent.length, 1, 'exactly one self-run engagement is expected');

    const graded = employers.map((company) => ({ company, record: matchRecord(company) }));
    const gold = graded.filter((g) => g.record);
    const grey = graded.filter((g) => !g.record);

    assert.deepEqual(
      grey.map((g) => g.company),
      independent,
      'the only employer string that names no record is the independent engagement; ' +
        'every organisation on the CV is checkable and therefore gold',
    );
    assert.ok(gold.length >= 7, 'seven organisations earn the mark');
  });
});

describe('#experience — dates never earn the mark', () => {
  it('matches no record against a month, a duration or a year', async () => {
    const { matchRecord } = await loadRecords();
    const dates = [
      'March 2026 - Present',
      'Jun 2025 - Feb 2026',
      'Sept 2017 - Jun 2025',
      'Nov 2016 - Sept 2017',
      '2010',
      '2026',
      '7.8 yr',
      '6 mo',
      'May 2010 → September 2026',
    ];
    const offenders = dates.filter((d) => matchRecord(d));
    assert.deepEqual(
      offenders,
      [],
      'a date is a self-reported figure, never a source: gold on the time axis is the failure this guards',
    );
  });
});

describe('#experience data grades sourced from the shared allow-list', () => {
  it('imports checkableRecords and computes a sourced flag, not a literal', () => {
    const data = readFileSync(EXPERIENCE_DATA, 'utf8');
    assert.match(
      data,
      /from '.*checkableRecords'/,
      'experience.ts grades against the shared allow-list rather than a hand-kept copy',
    );
    assert.match(
      data,
      /sourced/,
      'experience.ts carries a sourced grade onto each role, the same flag About uses',
    );
  });
});

describe('#experience wires the mark to the employer, not the dates', () => {
  const component = () => readFileSync(EXPERIENCE_COMPONENT, 'utf8');

  it('reads data-sourced onto the company string', () => {
    assert.match(
      component(),
      /data-sourced=\{[^}]*sourced[^}]*\}/,
      'the paint reads the data flag so the grade and the colour cannot drift apart',
    );
  });

  it('never marks a date element sourced', () => {
    const src = component();
    // The date-bearing elements: the duration readout and the detail dates.
    for (const marker of ['trackYears', 'roleDates']) {
      const idx = src.indexOf(marker);
      assert.ok(idx > -1, `${marker} is still the class carrying a date`);
    }
    assert.doesNotMatch(
      src,
      /trackYears[^>]*data-sourced/,
      'the duration readout is a self-reported figure and must never take the mark',
    );
    assert.doesNotMatch(
      src,
      /roleDates[^>]*data-sourced/,
      'the detail dates are self-reported and must never take the mark',
    );
  });
});

describe('#experience gold budget — recessed at rest, saturated only under attention', () => {
  const css = () => readFileSync(EXPERIENCE_CSS, 'utf8');

  it('paints a sourced employer the recessed gold at rest', () => {
    assert.match(
      css(),
      /\[data-sourced\][\s\S]*?color:\s*var\(--gold-pale\)/,
      'eight employers in one chart cannot each be a saturated "look here"; at rest the mark is --gold-pale',
    );
  });

  it('spends saturated --gold only under an active or open row', () => {
    const source = css();
    // Every occurrence of the saturated token must sit in a rule qualified by
    // an active/open/hover state — never a bare resting declaration.
    const saturated = [...source.matchAll(/([^{}]*)\{[^}]*var\(--gold\)[^}]*\}/g)];
    assert.ok(saturated.length > 0, 'the section does light a saturated gold — under attention');
    for (const [, selector] of saturated) {
      assert.match(
        selector,
        /data-active|\[data-open\]|:hover|:focus/,
        `saturated gold must be gated behind attention, not painted at rest: "${selector.trim()}"`,
      );
    }
  });

  it('never paints gold on the time axis', () => {
    const source = css();
    for (const dateClass of ['.trackYears', '.playhead', '.axisTick', '.roleDates']) {
      const start = source.indexOf(dateClass);
      if (start === -1) continue;
      const block = source.slice(start, source.indexOf('}', start));
      assert.doesNotMatch(
        block,
        /var\(--gold/,
        `${dateClass} carries a date and must stay --white/--mist, never gold`,
      );
    }
  });
});

describe('#experience strata — two or more depth planes parallax on scroll', () => {
  it('the shader takes a scroll uniform and offsets planes at depth-dependent rates', () => {
    const glsl = readFileSync(STRATA_GLSL, 'utf8');
    assert.match(glsl, /uniform float uScroll/, 'the field reads scroll as a uniform');
    // The parallax is depth-dependent: the scroll term is multiplied by a
    // per-plane factor so near and far planes travel at different rates.
    assert.match(
      glsl,
      /uScroll\s*\*[^;]*depth/,
      'each plane moves by uScroll scaled by its own depth — parallax, not a uniform shift',
    );
    // At least three bands already exist; the requirement is two or more planes.
    const bandLoop = glsl.match(/for\s*\(int i = 0; i < (\d+); i\+\+\)/);
    assert.ok(bandLoop && Number(bandLoop[1]) >= 2, 'two or more depth planes');
  });

  it('CareerStrata feeds the canvas scroll position into uScroll every frame', () => {
    const strata = readFileSync(CAREER_STRATA, 'utf8');
    assert.match(strata, /uScroll/, 'the component owns a uScroll uniform');
    assert.match(
      strata,
      /getBoundingClientRect|scrollY|innerHeight/,
      'the scroll value is read from the canvas position in the viewport, not a constant',
    );
  });
});

describe('MiniVic default does not cover the chart', () => {
  it('opens closed — the panel is mounted only once the reader asks', () => {
    const src = readFileSync(MINIVIC, 'utf8');
    assert.match(
      src,
      /const \[isOpen, setIsOpen\] = useState\(false\)/,
      'the launcher rests closed by default, so nothing overlays #experience until invited',
    );
    assert.match(
      src,
      /\{isOpen && \(/,
      'the panel is conditional on isOpen — a closed default renders no panel over the chart',
    );
  });
});
