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
    },
    {
      name: 'Experience Level',
      side: 'candidate',
      answer:
        'Fifteen years. Senior delivery lead and AI/ML solutions architect since 2017; before that, business analysis and project delivery from 2010.',
      evidence: 'ATO · ANZ · NAB · Microsoft · Telstra · InfoCentric · MYOB',
    },
    {
      name: 'Industry Match',
      side: 'candidate',
      answer:
        'Government, banking and telecommunications — three regulated industries where the delivery constraint is usually assurance, not engineering.',
      evidence: 'Australian Taxation Office, ANZ, NAB, Telstra',
    },
    {
      name: 'Role Alignment',
      side: 'candidate',
      answer:
        'Scrum Master and Project Manager who architects. I have never found the two halves to be separate jobs: the eight-squad test-evidence problem at the ATO was a delivery problem solved with a toolchain.',
      evidence: 'Payday Super program · Agile Kookaburras squad · PI 47–48',
    },
    {
      name: 'Culture Fit',
      side: 'candidate',
      answer:
        'Agile as practice rather than ceremony. Cadence and PI planning when the plan holds; a cross-discipline war room, inside three hours, when it does not.',
      evidence: '5+ squads, 40+ practitioners onshore and offshore',
    },
    {
      name: 'Salary Fit',
      side: 'role',
      answer:
        'Melbourne market band for senior delivery leadership. I would rather agree the scope first and let the rate follow it.',
      evidence: 'Open to permanent and contract engagements',
    },
    {
      name: 'Location Match',
      side: 'role',
      answer:
        'Melbourne, Victoria. Hybrid locally, or remote across Australian and New Zealand time zones.',
      evidence: 'Currently on site with the ATO, Melbourne',
    },
    {
      name: 'Career Growth',
      side: 'candidate',
      answer:
        'Programs where AI delivery and AI assurance are the hard part — where somebody has to be accountable for whether the model output can be trusted, not just whether it shipped.',
      evidence: 'Langfuse + Phoenix evaluation stack · −38% simulated error-budget breaches',
    },
    {
      name: 'Company Stability',
      side: 'role',
      answer:
        'I look for organisations that can absorb an honest status report. Every program I have rescued was one where somebody said the number out loud early enough.',
      evidence: '75+ hours of evidence against 64 available — escalated, then re-baselined',
    },
    {
      name: 'North Star Align',
      side: 'candidate',
      answer:
        'Build systems whose claims can be checked. Everything I ship is designed to refuse to fabricate its own evidence, and to say so when it cannot measure something.',
      evidence: 'aether-job-career-agent · unmeasured signals read "not measured", never zero',
    },
  ] satisfies Dimension[],
  /** Named so the reader knows the ten are not invented for the occasion. */
  provenance: {
    label: 'Dimensions taken verbatim from',
    repo: 'Victordtesla24/aether-job-career-agent',
    path: 'apps/api/app/routers/jobs.py',
    href: 'https://github.com/Victordtesla24/aether-job-career-agent',
  },
} as const;
