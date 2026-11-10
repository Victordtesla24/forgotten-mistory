/**
 * About: the first-person bio, five selected answers with the evidence beside each,
 * and education and the certifications held.
 *
 * The answers sit under headings the aether-job-career-agent product scores a
 * candidate on, in its own wording and order; five of its ten are shown. No score is
 * printed against them: a number a person assigns to themselves is not evidence.
 * Company Stability is computed from the role's side of the match, so it is answered
 * as what Vikram is looking for.
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
  /** The portrait still, a 1480 × 826 photograph in three formats; the png is the fallback. */
  portrait: {
    avif: '/assets/my_avatar.avif',
    webp: '/assets/my_avatar.webp',
    png: '/assets/my_avatar.png',
    width: 1480,
    height: 826,
    alt: 'Portrait of Vikram Deshpande',
  },
  /** First-person summary, as it appears in the CV introduction. */
  bio: "I'm a technical delivery leader and AI solutions architect based in Melbourne, currently leading agile delivery as Scrum Master / Project Manager on the Australian Taxation Office's Payday Super program. Over sixteen years across government, finance, and telecommunications I've helped teams ship complex systems — from mainframe test automation to real-time AI platforms — with a focus on measurable business value.",
  /** The heading over the answers. Plain language, and it counts the answers shown. */
  heading: 'Where I fit, in five answers',
  dimensions: [
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
  /** Where the headings come from, so a reader knows they are not invented for the occasion. */
  provenance: {
    label: 'These headings are taken verbatim from',
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
