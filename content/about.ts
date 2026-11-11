/**
 * About: a three-sentence first-person summary, the working principles, and education
 * and credentials.
 */

/** A working principle, in the first person where it speaks of choices. */
export interface Principle {
  id: string;
  /** Two to four words. */
  title: string;
  /** One sentence. */
  statement: string;
  /** An optional second sentence. */
  detail?: string;
  /** The program, repository or figure behind it, in six words or fewer. */
  scope: string;
}

export interface Qualification {
  name: string;
  institution: string;
}

export interface Credential {
  name: string;
  institution?: string;
  /** For a credential not yet held: exactly that, in three or four words. */
  status?: string;
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
  /** Who and where; proof with scope; direction. Three sentences, at most 60 words. */
  bio: [
    'At the ATO I lead the Kookaburras squad, one of eight Payday Super squads.',
    'At ANZ I led AI/ML delivery and core banking modernisation; on my own, I build multi-agent systems.',
    'Next: programs where AI delivery and AI assurance are the hard part.',
  ],
  principles: [
    {
      id: 'architect-delivery',
      title: 'Architect the delivery',
      statement: 'Delivery and architecture are one job.',
      detail:
        'At the ATO, the eight-squad test-evidence problem was a delivery problem solved with a toolchain.',
      scope: 'ATO · 200+ SIT scenarios',
    },
    {
      id: 'practise-agile',
      title: 'Practise agile',
      statement:
        'Cadence and PI planning when the plan holds; a cross-discipline war room in under three hours when it does not.',
      scope: 'ATO · Payday Super',
    },
    {
      id: 'own-ai-assurance',
      title: 'Own AI assurance',
      statement: 'Accountable for whether model output can be trusted, as well as whether it shipped.',
      scope: 'Langfuse and Phoenix · −38% (in simulation)',
    },
    {
      id: 'state-the-number',
      title: 'State the number',
      statement:
        'A status report can carry bad news; every program I have rescued turned on someone stating the number early.',
      detail: '75+ hours of evidence against 64 available: escalated, then re-baselined.',
      scope: 'ATO · SIT window',
    },
    {
      id: 'measure-then-claim',
      title: 'Measure, then claim',
      statement:
        'In Aether, market figures cite their source, and an unmeasured signal reads “not measured”, never zero.',
      scope: 'aether-job-career-agent',
    },
  ] satisfies Principle[],
  education: [
    { name: 'Master of Computer Science (Honours)', institution: 'Monash University' },
    {
      name: 'Bachelor of Engineering, Computer Science',
      institution: 'University of Melbourne',
    },
  ] satisfies Qualification[],
  credentials: [
    { name: 'Certified Scrum Master (CSM)', institution: 'Scrum Alliance' },
    { name: 'AWS and GCP', status: 'Certification in progress' },
  ] satisfies Credential[],
} as const;
