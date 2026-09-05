/**
 * about_sourced_semantics.test.mjs — gold on #about means a checkable record.
 *
 * `CLAUDE.md` prime directive 3 gives the caliper three states and they are not
 * interchangeable: `sourced` is *measured, with a source a reader can go and
 * check*; `self-reported` is *a CV figure with no published methodology behind
 * it*; `open` is *sought, honestly not measurable*. Gold is the site's one claim
 * mark and it means the first of those, only.
 *
 * Two failures are possible here and this file closes both.
 *
 * 1. **A self-description graded as a record.** `app/data/portfolio/about.ts`
 *    grades each evidence line with a `sourced` boolean, and the first pass at
 *    that flag used the criterion "an employer, a program, a named repository,
 *    a figure from the CV". The last clause admits exactly the category prime
 *    directive 3 calls `self-reported` — "5+ squads, up to 40 practitioners" and
 *    "75+ hours of evidence against 64 available" name no employer, no program,
 *    no repository and publish no methodology, and "−38% simulated
 *    error-budget breaches" says *simulated* in its own text. So a `sourced`
 *    line has to name something from a closed allow-list of records a reader can
 *    actually open, and must not consist of a bare self-reported figure.
 *
 * 2. **The two flags drifting apart.** `side` was on `Dimension` before
 *    `sourced` was; `components/sections/About/About.tsx` renders the OPEN
 *    caliper "measured from the role" for every `side === 'role'` dimension. A
 *    dimension marked both `sourced` and `open` says, in one breath, that the
 *    claim has a checkable source and that nothing here could honestly be
 *    measured. Location Match and Company Stability shipped in exactly that
 *    state. `side === 'role'` ⇒ `sourced === false` is the invariant that makes
 *    the pair impossible to contradict, and it is asserted here against the
 *    data rather than the pixels so it fails before a build, not after a deploy.
 *
 * The allow-list is written out explicitly below rather than inferred, so that
 * widening what counts as a record is a visible edit to this file.
 *
 * Usage:  node --test tests/about_sourced_semantics.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const ROOT = process.cwd();
const ABOUT_DATA = join(ROOT, 'app', 'data', 'portfolio', 'about.ts');
const ABOUT_COMPONENT = join(ROOT, 'components', 'sections', 'About', 'About.tsx');

/**
 * `about.ts` imports nothing, so transpiling that one file is enough to load
 * the real data — no build step, no fixture, no second copy of the ten lines
 * that could quietly disagree with the ones the page renders.
 */
async function loadAboutContent() {
  const source = readFileSync(ABOUT_DATA, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
    fileName: 'about.ts',
  });
  const module = await import(
    `data:text/javascript;base64,${Buffer.from(outputText, 'utf8').toString('base64')}`
  );
  return module.aboutContent;
}

/**
 * Records a reader can open and check, taken from the CV, the vitrine and the
 * public GitHub account — an employer, the one named program, or a repository.
 * Nothing here is a figure: a number is a claim, and this list is the set of
 * places a claim can be checked.
 */
const CHECKABLE_RECORDS = [
  // Employers, as the CV and LinkedIn name them.
  'Australian Taxation Office',
  'ATO',
  'ANZ',
  'National Australia Bank',
  'NAB',
  'Microsoft',
  'Telstra',
  'InfoCentric',
  'MYOB',
  // The one publicly documented program.
  'Payday Super',
  // The six curated repositories — app/data/portfolio/vitrine.ts.
  'aether-job-career-agent',
  'abentertainment',
  'ralph-loop-infinite',
  'prompt-reconstruction-engine',
  'jyotish-shastra',
  'forgotten-mistory',
  // The account the repository count is checked against.
  'GitHub',
];

/**
 * Phrases that mark a line as self-reported no matter what else it contains: a
 * figure the site itself calls simulated, and the two bare scale figures that
 * publish no methodology. A line built out of these is `self-reported`, and
 * `self-reported` is never gold.
 */
const SELF_REPORTED_MARKERS = ['simulated', 'hours of evidence', 'practitioners'];

const evidenceOf = (dimension) => `${dimension.name} — "${dimension.evidence}"`;

describe('#about grades gold only where the evidence names a checkable record', () => {
  it('loads the ten dimensions the page actually renders', async () => {
    const aboutContent = await loadAboutContent();
    assert.equal(
      aboutContent.dimensions.length,
      10,
      'the section is the engine\'s ten dimensions; a different count means the data moved and this file is measuring the wrong thing',
    );
    for (const dimension of aboutContent.dimensions) {
      assert.equal(
        typeof dimension.sourced,
        'boolean',
        `${dimension.name} must carry an explicit sourced grade — an absent flag reads as ungraded, not as false`,
      );
    }
  });

  it('never marks a role-side dimension sourced — the component already calls it unmeasurable', async () => {
    const aboutContent = await loadAboutContent();
    const contradictory = aboutContent.dimensions
      .filter((dimension) => dimension.side === 'role' && dimension.sourced)
      .map(evidenceOf);
    assert.deepEqual(
      contradictory,
      [],
      'About.tsx renders <Caliper state="open">measured from the role</Caliper> for every side==="role" ' +
        'dimension. Grading one of those `sourced` marks the same claim both "has a checkable source" and ' +
        '"nothing here could honestly be measured" — CLAUDE.md prime directive 3',
    );
  });

  it('keeps the open caliper bound to side==="role", so the invariant above still means something', () => {
    const component = readFileSync(ABOUT_COMPONENT, 'utf8');
    assert.match(
      component,
      /dimension\.side === 'role'/,
      'the role-side branch is what renders the open caliper; if it is gone the invariant above is vacuous',
    );
    assert.match(
      component,
      /state="open"/,
      'the role-side branch must still render the OPEN caliper state, not a closed or self-reported one',
    );
    assert.match(
      component,
      /data-sourced=\{dimension\.sourced\}/,
      'the paint has to read the data flag, so the grade and the colour cannot drift apart',
    );
  });

  it('gives every gold line a record from the allow-list', async () => {
    const aboutContent = await loadAboutContent();
    const sourced = aboutContent.dimensions.filter((dimension) => dimension.sourced);
    assert.ok(
      sourced.length > 0,
      'the section does have checkable evidence; grading all ten grey would be its own dishonesty',
    );
    const unbacked = sourced
      .filter(
        (dimension) =>
          !CHECKABLE_RECORDS.some((record) =>
            dimension.evidence.toLowerCase().includes(record.toLowerCase()),
          ),
      )
      .map(evidenceOf);
    assert.deepEqual(
      unbacked,
      [],
      'gold means a reader can open something and check it. These lines name no employer, no program and ' +
        'no repository, so they are self-reported figures and belong in the caption grey',
    );
  });

  it('lets no gold line rest on a self-reported figure', async () => {
    const aboutContent = await loadAboutContent();
    const selfReported = aboutContent.dimensions
      .filter(
        (dimension) =>
          dimension.sourced &&
          SELF_REPORTED_MARKERS.some((marker) =>
            dimension.evidence.toLowerCase().includes(marker.toLowerCase()),
          ),
      )
      .map(evidenceOf);
    assert.deepEqual(
      selfReported,
      [],
      'a figure the copy itself calls simulated, or a bare count of hours or practitioners with no published ' +
        'methodology, is `self-reported` — CLAUDE.md prime directive 3 says that is never gold',
    );
  });

  it('leaves the grey lines grey for a stated reason, not by accident', async () => {
    const aboutContent = await loadAboutContent();
    const grey = aboutContent.dimensions.filter((dimension) => !dimension.sourced);
    assert.ok(
      grey.length >= 3,
      'the three role-side dimensions alone are grey; fewer than three means the invariant above was ' +
        'satisfied by deleting a dimension rather than by regrading it',
    );
    for (const dimension of grey) {
      assert.ok(
        dimension.evidence.trim().length > 10,
        `${dimension.name} still prints its evidence line — grey is a grade, not a deletion`,
      );
    }
  });
});
