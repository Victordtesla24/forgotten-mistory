/**
 * checkableRecords.ts — the one allow-list of records a reader can open.
 *
 * Gold is the site's single claim mark and `CLAUDE.md` prime directive 3 fixes
 * what it means: `sourced` is *measured, with a source a reader can go and
 * check*. A figure off the CV with no published methodology is `self-reported`,
 * and `self-reported` is never gold. So a claim earns gold only when it names
 * something from a *closed* list of records — an employer as the CV and
 * LinkedIn name it, the one publicly documented program, a curated repository,
 * or the GitHub account the repository count is checked against.
 *
 * This list is the same one written out in `tests/about_sourced_semantics.test.mjs`;
 * `#about` and `#experience` grade gold against the identical set, and
 * `tests/experience_sourced_semantics.test.mjs` asserts the two never drift.
 * A date, a duration or a bare figure is deliberately absent: a number is a
 * claim, not a place a claim can be checked, so an employer's *dates* never
 * match and therefore never carry the mark.
 */

/** Records a reader can open and check. Widening this is a visible edit here. */
export const CHECKABLE_RECORDS: readonly string[] = [
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
] as const;

/**
 * The one record `text` names, or `null` when it names none.
 *
 * Case-insensitive substring, the same test the About spec uses, so "Australian
 * Taxation Office (ATO)" matches on its employer and "Independent AI Consulting
 * & Upskilling" matches nothing — the latter is a self-described engagement, not
 * a record an outsider can open, and so it is never gold. A pure string in,
 * string-or-null out: no imports, so a Node test can load this file directly.
 */
export function matchRecord(text: string): string | null {
  if (!text) return null;
  const haystack = text.toLowerCase();
  return (
    CHECKABLE_RECORDS.find((record) => haystack.includes(record.toLowerCase())) ?? null
  );
}
