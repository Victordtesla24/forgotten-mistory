/**
 * About: the first-person lede, the ten dimensions answered with the evidence
 * beside each, and education and credentials.
 *
 * The ten dimensions are the ones the aether-job-career-agent product scores a
 * candidate on, in its own wording and order. No score is printed against them:
 * a number a person assigns to themselves is not evidence. Three of the ten
 * (Salary Fit, Location Match, Company Stability) are computed from the role's
 * side of the match, so they are answered as what Vikram is looking for.
 */

export interface Dimension {
  /** Verbatim from the product. */
  name: string;
  /** Which side of the match the product computes this from. */
  side: 'candidate' | 'role';
  /** The answer. One or two sentences. */
  answer: string;
  /** Where a reader can check it. */
  evidence: string;
}

export interface Qualification {
  qualification: string;
  institution: string;
}

export interface Credential {
  name: string;
  issuer?: string;
  /** The status of the credential, in the words of the CV. */
  status: string;
}

export const about = {
  /** First-person summary, as it appears in the CV introduction. */
  bio: "I'm a technical delivery leader and AI solutions architect based in Melbourne, currently leading agile delivery as Scrum Master / Project Manager on the Australian Taxation Office's Payday Super program. Over sixteen years across government, finance, and telecommunications I've helped teams ship complex systems — from mainframe test automation to real-time AI platforms — with a focus on measurable business value.",
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
        'Sixteen years. Senior delivery lead and AI/ML solutions architect since 2017; before that, business analysis and project delivery from May 2010 — sixteen years and four months to September 2026.',
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
      evidence: '5+ squads, up to 40 practitioners onshore and offshore',
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
  /** Where the ten dimensions come from, so a reader knows they are not invented for the occasion. */
  provenance: {
    label: 'Dimensions taken verbatim from',
    repo: 'Victordtesla24/aether-job-career-agent',
    path: 'apps/api/app/routers/jobs.py',
    href: 'https://github.com/Victordtesla24/aether-job-career-agent/blob/main/apps/api/app/routers/jobs.py',
  },
  education: [
    { qualification: 'Master of Computer Science (Honours)', institution: 'Monash University' },
    {
      qualification: 'Bachelor of Engineering, Computer Science',
      institution: 'University of Melbourne',
    },
  ] satisfies Qualification[],
  credentials: [
    { name: 'Certified Scrum Master (CSM)', issuer: 'Scrum Alliance', status: 'held' },
    { name: 'AWS and GCP certification', status: 'in progress' },
  ] satisfies Credential[],
} as const;
