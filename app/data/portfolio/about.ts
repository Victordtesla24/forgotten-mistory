/**
 * about.ts — the ten dimensions, answered.
 *
 * The device: Vikram's own product, `aether-job-career-agent`, scores a
 * candidate against a role on exactly ten dimensions. The list below is those
 * ten, in the product's own wording and order, taken verbatim from
 * `apps/api/app/routers/jobs.py::build_fit_dimensions`.
 *
 * What this section deliberately does NOT do is print a score against each one.
 * A number a person assigns to themselves is not evidence, and the product
 * itself refuses to publish a figure it cannot source — that refusal is the
 * design principle the section is trying to demonstrate, so contradicting it
 * here to draw a prettier radar chart would give away the whole argument.
 *
 * Three of the ten (Salary Fit, Location Match, Company Stability) are computed
 * from the job side, not the candidate. Those are answered as what he is
 * looking for, which is the honest reading of a two-sided measure.
 */

export interface Dimension {
  /** Verbatim from the product. Do not paraphrase these. */
  name: string;
  /** Which side of the match the product computes this from. */
  side: 'candidate' | 'role';
  /** The answer. One or two sentences, factual, no adjectives of self-praise. */
  answer: string;
  /** Where a reader can check it. */
  evidence: string;
  /**
   * Whether that evidence names a record a reader can actually go and open —
   * an employer, the named program, a named repository. Gold is the site's one
   * claim mark and `CLAUDE.md` prime directive 3 fixes what it means: `sourced`
   * is *measured, with a source a reader can go and check*. A figure off the CV
   * with no published methodology behind it is `self-reported`, which is a
   * different grade and never gold — so "5+ squads, up to 40 practitioners",
   * "75+ hours of evidence against 64 available" and a −38% the copy itself
   * calls *simulated* are `false`, and so is a line that states an intention
   * rather than a record. Grading any of them gold would say the site can
   * source a claim it cannot, which is the one thing this section exists to
   * argue against.
   *
   * Invariant, asserted in `tests/about_sourced_semantics.test.mjs`:
   * `side === 'role'` ⇒ `sourced === false`. `About.tsx` renders the OPEN
   * caliper "measured from the role" for every role-side dimension, and a claim
   * cannot honestly be both "has a checkable source" and "nothing here could be
   * measured". The two flags were added at different times and did drift apart;
   * the test is what stops them.
   */
  sourced: boolean;
}

export const aboutContent = {
  kicker: 'About',
  title: 'Ten dimensions, answered',
  lede: [
    'I build a job-fit engine that scores a candidate against a role on ten dimensions. It is the fairest summary of a person I know how to write, so here I am on all ten of them.',
    'There are no scores below. The engine refuses to publish a number it cannot source, and a number I assign to myself has no source at all — so these are answers, with the evidence beside them.',
  ],
  dimensions: [
    {
      name: 'Technical Skills',
      side: 'candidate',
      answer:
        'Python and TypeScript to production, and REXX on a mainframe when the program actually needs it. Cloud-native across Azure, GCP and AWS; Kubernetes, Terraform, Postgres.',
      evidence: '38 public repositories · ATO evidence harness · ANZ platform migrations',
      sourced: true,
    },
    {
      name: 'Experience Level',
      side: 'candidate',
      answer:
        'Sixteen years. Senior delivery lead and AI/ML solutions architect since 2017; before that, business analysis and project delivery from May 2010 — sixteen years and four months to September 2026.',
      evidence: 'ATO · ANZ · NAB · Microsoft · Telstra · InfoCentric · MYOB',
      sourced: true,
    },
    {
      name: 'Industry Match',
      side: 'candidate',
      answer:
        'Government, banking and telecommunications — three regulated industries where the delivery constraint is usually assurance, not engineering.',
      evidence: 'Australian Taxation Office, ANZ, NAB, Telstra',
      sourced: true,
    },
    {
      name: 'Role Alignment',
      side: 'candidate',
      answer:
        'Scrum Master and Project Manager who architects. I have never found the two halves to be separate jobs: the eight-squad test-evidence problem at the ATO was a delivery problem solved with a toolchain.',
      evidence: 'Payday Super program · Agile Kookaburras squad · PI 47–48',
      sourced: true,
    },
    {
      name: 'Culture Fit',
      side: 'candidate',
      answer:
        'Agile as practice rather than ceremony. Cadence and PI planning when the plan holds; a cross-discipline war room, inside three hours, when it does not.',
      // A figure of scale off the CV: no employer, no program, no repository
      // and no published methodology behind the count. Self-reported, so grey.
      evidence: '5+ squads, up to 40 practitioners onshore and offshore',
      sourced: false,
    },
    {
      name: 'Salary Fit',
      side: 'role',
      answer:
        'Melbourne market band for senior delivery leadership. I would rather agree the scope first and let the rate follow it.',
      evidence: 'Open to permanent and contract engagements',
      sourced: false,
    },
    {
      name: 'Location Match',
      side: 'role',
      answer:
        'Melbourne, Victoria. Hybrid locally, or remote across Australian and New Zealand time zones.',
      // Role-side: the heading already carries the open caliper "measured from
      // the role". Gold on the same line would grade one claim both sourced and
      // unmeasurable, so the engagement is stated and the line stays grey.
      evidence: 'Currently on site with the ATO, Melbourne',
      sourced: false,
    },
    {
      name: 'Career Growth',
      side: 'candidate',
      answer:
        'Programs where AI delivery and AI assurance are the hard part — where somebody has to be accountable for whether the model output can be trusted, not just whether it shipped.',
      // The eval stack is real and the line names the two tools, but it was
      // built in independent consulting (app/data/siteContent.ts) and is not
      // published anywhere a reader can open — and the −38% says *simulated* in
      // its own text, with no methodology behind it. Both halves are
      // self-reported, so the whole line is grey rather than half-marked.
      evidence: 'Langfuse + Phoenix evaluation stack · −38% simulated error-budget breaches',
      sourced: false,
    },
    {
      name: 'Company Stability',
      side: 'role',
      answer:
        'I look for organisations that can absorb an honest status report. Every program I have rescued was one where somebody said the number out loud early enough.',
      // Role-side, and a bare pair of numbers with no employer, program or
      // methodology attached. Both reasons point the same way: grey.
      evidence: '75+ hours of evidence against 64 available — escalated, then re-baselined',
      sourced: false,
    },
    {
      name: 'North Star Align',
      side: 'candidate',
      answer:
        'Build systems whose claims can be checked. Everything I ship is designed to refuse to fabricate its own evidence, and to say so when it cannot measure something.',
      evidence: 'aether-job-career-agent · unmeasured signals read "not measured", never zero',
      sourced: true,
    },
  ] satisfies Dimension[],
  /** Named so the reader knows the ten are not invented for the occasion. */
  provenance: {
    label: 'Dimensions taken verbatim from',
    repo: 'Victordtesla24/aether-job-career-agent',
    path: 'apps/api/app/routers/jobs.py',
    href: 'https://github.com/Victordtesla24/aether-job-career-agent/blob/main/apps/api/app/routers/jobs.py',
  },
} as const;
