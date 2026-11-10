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
    'Technical delivery leader and AI solutions architect, Melbourne.',
    'I lead agile delivery as Scrum Master / Project Manager on the ATO’s Payday Super program.',
    'Across sixteen years in government, finance and telecommunications, I have helped teams ship complex systems, from mainframe test automation to real-time AI platforms, with a focus on measurable business value.',
  ],
  principles: [
    {
      id: 'architect-delivery',
      title: 'Architect the delivery',
      statement: 'Delivery and architecture are one job.',
      detail:
        'At the ATO, the eight-squad test-evidence problem was a delivery problem solved with a toolchain.',
      scope: 'Agile Kookaburras · PI 47–48',
    },
    {
      id: 'practise-agile',
      title: 'Practise agile',
      statement: 'Agile as practice rather than ceremony.',
      detail:
        'Cadence and PI planning when the plan holds; a cross-discipline war room, inside three hours, when it does not.',
      scope: '5+ squads · up to 40 practitioners',
    },
    {
      id: 'own-ai-assurance',
      title: 'Own AI assurance',
      statement: 'I look for programs where AI delivery and AI assurance are the hard part.',
      detail:
        'Someone has to be accountable for whether model output can be trusted, not just whether it shipped.',
      scope: 'Langfuse and Phoenix · −38% (simulated budget)',
    },
    {
      id: 'state-the-number',
      title: 'State the number',
      statement: 'I look for organisations where a status report can carry bad news.',
      detail:
        'Every program I have rescued turned on someone stating the number early: 75+ hours of evidence against 64 available, escalated, then re-baselined.',
      scope: 'ATO · SIT window',
    },
    {
      id: 'check-every-claim',
      title: 'Check every claim',
      statement: 'Outputs cite their source; an unmeasured signal reads “not measured”, never zero.',
      detail:
        'Everything I ship refuses to fabricate its own evidence, and says so when it cannot measure something.',
      scope: 'aether-job-career-agent',
    },
    {
      id: 'engagement',
      title: 'Engagement',
      statement:
        'Open to Scrum Master / Project Manager roles in Melbourne and selected AI delivery engagements.',
      detail: 'Coffee in the Melbourne CBD; I will come to you.',
      scope: 'Melbourne',
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
