/**
 * siteContent.ts — single source of truth for all biographical and career
 * content rendered on the site. This file is kept in strict parity with the
 * standalone CV (public/docs/Vik_Resume_Final.pdf).
 */

export interface ExperienceRole {
  id: string;
  role: string;
  company: string;
  location: string;
  dates: string;
  bullets: string[];
}

export interface SkillGroup {
  id: string;
  kicker: string;
  name: string;
  icon: 'brain' | 'gitBranch' | 'crown' | 'badgeCheck' | 'graduationCap';
  items: string[];
}

export interface ProjectCard {
  href: string;
  badge: string;
  title: string;
  description: string;
  visual: 'dashboard' | 'doc' | 'waveform' | 'terminal' | 'telemetry-hud' | 'packet-flow' | 'evidence-bar' | 'celestial' | 'clearance' | 'repair-loop' | 'image-compare' | 'orchestration' | 'key-signing' | 'token-flow' | 'event-seat';
}

export interface FeaturedRepo {
  href: string;
  name: string;
  description: string;
}

/**
 * Provenance of the multi-source synthesis (SPEC §6 / FR-SYNTH, prompt §4).
 * Each `kind` is one §6 source category that was actually mined; `tracedFact` is
 * a concrete claim rendered elsewhere on the site that traces back to that
 * source — so every fact stays evidence-led and is never the résumé alone (NN-3).
 */
export type SynthesisSourceKind =
  | 'resume'
  | 'repo'
  | 'youtube'
  | 'local'
  | 'traces'
  | 'accounts';

export interface SynthesisSource {
  kind: SynthesisSourceKind;
  label: string;
  mined: string;
  tracedFact: string;
}

export const hero = {
  greeting: "Hello, I'm",
  name: 'Vikram.',
  subtitle: [
    "I'm a technical delivery leader and AI solutions architect based in Melbourne, currently serving as Scrum Master / Project Manager on the Australian Taxation Office's Payday Super program. Over 15+ years across government, finance, and telecommunications I've helped teams ship complex systems — from mainframe test automation to real-time AI platforms — with a focus on measurable business value.",
    "Beyond my professional work, I have a deep interest in the intersection of technology and history, particularly ancient algorithms and Vedic astronomy. I believe there's a lot to learn from the past to build a better future.",
  ],
};

export const about = {
  paragraphs: [
    'With over 15 years in the technology industry, I work as a Senior Technical Leader and Certified Scrum Master (CSM) across government, financial services, and telecommunications — currently leading agile delivery for the Australian Taxation Office’s Payday Super reform program. My focus is program delivery, enterprise transformation, and architecting AI/ML-driven solutions.',
    'I lead cross-functional squads, guide cloud-based modernisations, and automate away systemic delivery friction. My technical background spans Python, TypeScript, and cloud-native infrastructure (Kubernetes, GCP, AWS, Azure). I focus on fostering an agile culture and translating complex technical roadmaps into measurable business value.',
  ],
};

export const experience: ExperienceRole[] = [
  {
    id: 'ato',
    role: 'Scrum Master / Project Manager — Payday Super Program (NTP & Distribution UI)',
    company: 'Australian Taxation Office (ATO)',
    location: 'Melbourne, VIC',
    dates: 'March 2026 - Present',
    bullets: [
      'Lead end-to-end agile delivery for the Agile Kookaburras squad — one of eight squads delivering NTP and Distribution UI capabilities for the ATO’s Payday Super reform — owning sprint cadence, PI planning (PI 47–48), capacity management, and executive status reporting.',
      'Architected the program’s COBOL/mainframe test-evidence automation strategy covering 200+ SIT/E2E scenarios across all eight squads, cutting evidence effort from ~3 hours to ~15 minutes per scenario (≈92% reduction) using a zero-new-approvals toolchain (REXX, SMF, SDSF, PCOMM, PowerShell, VBA).',
      'Converted a mathematically infeasible SIT window — 75+ hours of manual evidence per team against 64 available hours — into an achievable plan through a six-day tiered harness build with a formal go/no-go gate and a four-level contingency ladder.',
      'Convened and facilitated a cross-discipline technical war room that produced a binding automation recommendation in under three hours, securing endorsement without a single new InfoSec approval.',
      'Authored the executive change request re-baselining Payday Super test capacity from 30 to up to 90 person-days, including options analysis, costed recommendation, risk assessment, and full Azure DevOps traceability across 40 scenarios and 11 data tables (AC6–AC19) with STT regression scope.',
      'Unblocked stalled NTP function testing by escalating L2 environment instability and brokering targeted SME enablement, while steering Distribution UI feature delivery to 95%+ completion.',
    ],
  },
  {
    id: 'independent',
    role: 'AI Solutions Consultant — Applied LLM Engineering & Delivery Tooling',
    company: 'Independent AI Consulting & Upskilling',
    location: 'Melbourne, VIC',
    dates: 'Jun 2025 - Feb 2026',
    bullets: [
      'Architected and developed a Next.js and Supabase analytics dashboard for JIRA to expose sprint velocity metrics and generate LLM-powered retrospective insights.',
      'Built an LLM evaluation stack using Langfuse and Phoenix that reduced simulated error-budget breaches by 38%, alongside a production-grade Node.js/Express public-key server for API signing with full test coverage.',
      "Built 'AI Resume Tailor', an automated NLP system using web scraping and prompt engineering to match CVs to job descriptions instantly.",
      "Created 'AI Gmail Manager', an autonomous TypeScript agent for inbox triage, sentiment analysis, and draft generation using LLMs.",
      "Developed 'Jyotish Shastra' and 'BTR-Demo', enterprise-grade platforms exploring the intersection of ancient Vedic algorithms and modern AI/ML, and a React/TypeScript + D3 customer-journey visualiser.",
      'Creator of the @vicd0ct YouTube channel, producing technical deep-dives on live coding, algorithm archaeology, and telemetry breakdowns.',
    ],
  },
  {
    id: 'anz',
    role: 'Senior Delivery Lead / AI-ML Solutions Architect',
    company: 'ANZ Banking Group',
    location: 'Melbourne, VIC',
    dates: 'Sept 2017 - Jun 2025',
    bullets: [
      'Led the delivery of AI/ML solutions, including real-time WebSocket telemetry sustaining P95 latency under 200 ms across 10,000+ concurrent devices for critical banking services.',
      'Guided the transition of core banking platforms to cloud-native architectures (.NET/Azure), improving delivery efficiency by more than 30% and reducing infrastructure costs by over 15%.',
      'Managed a program portfolio valued at over $5M across 5+ cross-functional squads (40+ onsite and offshore practitioners) with 100% compliance to enterprise standards and risk frameworks.',
      'Owned the technical vision and product backlog for platform modernisations; executive workshops for 40+ leaders improved strategic decision clarity by approximately 55%.',
    ],
  },
  {
    id: 'nab',
    role: 'Senior Project Manager & Business Analyst',
    company: 'National Australia Bank (NAB)',
    location: 'Melbourne, VIC',
    dates: 'Nov 2016 - Sept 2017',
    bullets: [
      'Managed the delivery of a critical risk-and-compliance program, ensuring regulatory adherence for major enterprise data initiatives.',
    ],
  },
  {
    id: 'microsoft',
    role: 'Lead Business Analyst',
    company: 'Microsoft',
    location: 'Sydney, NSW',
    dates: 'Oct 2015 - Oct 2016',
    bullets: [
      'Delivered a gap analysis for Azure ML telemetry that improved system reliability and reduced incident resolution time.',
      'Aligned DevOps strategies with enterprise standards to improve compliance.',
    ],
  },
  {
    id: 'telstra',
    role: 'Business Analyst / Project Coordinator',
    company: 'Telstra',
    location: 'Melbourne, VIC',
    dates: 'Nov 2014 - Oct 2015',
    bullets: [
      'Developed customer journey scorecards and streamlined JIRA requirements to improve delivery efficiency and operational clarity.',
    ],
  },
  {
    id: 'infocentric',
    role: 'Senior Business Analyst',
    company: 'InfoCentric',
    location: 'Melbourne, VIC',
    dates: 'Aug 2011 - Nov 2014',
    bullets: [
      'Delivered analytics and BI projects that boosted client engagement and automated regulatory reporting.',
    ],
  },
  {
    id: 'myob',
    role: 'Developer Support / Software Testing / Analyst',
    company: 'MYOB',
    location: 'Melbourne, VIC',
    dates: 'May 2010 - Aug 2011',
    bullets: [
      'Optimised data processing workflows, improving efficiency and reducing reporting time for financial data sets.',
    ],
  },
];

export const skillGroups: SkillGroup[] = [
  {
    id: 'ai-ml',
    kicker: 'AI/ML & Data',
    name: 'AI/ML Solutions & LLM Pipelines',
    icon: 'brain',
    items: [
      'AI/ML Solutions',
      'LLM Pipelines (LangChain, Langfuse, Phoenix)',
      'Real-Time Telemetry',
      'MLOps',
      'Data Architecture',
    ],
  },
  {
    id: 'engineering',
    kicker: 'Engineering',
    name: 'Cloud-Native & Full-Stack',
    icon: 'gitBranch',
    items: [
      'Python, TypeScript, React/Next.js',
      'Kubernetes, Docker, Terraform',
      'GCP, AWS, Azure',
      'Postgres/Supabase',
      'CI/CD, DevOps, Mainframe Test Automation (REXX/JCL)',
    ],
  },
  {
    id: 'leadership',
    kicker: 'Leadership',
    name: 'Program Delivery & Management',
    icon: 'crown',
    items: [
      'Technical Program Management',
      'Agile/Scrum/SAFe & PI Planning',
      'Product Ownership',
      'Stakeholder Alignment & Executive Reporting',
      'Risk, Capacity & Budget Management',
    ],
  },
  {
    id: 'certifications',
    kicker: 'Certifications',
    name: 'Credentials & Governance',
    icon: 'badgeCheck',
    items: [
      'Certified Scrum Master (CSM)',
      'Cloud/Data Certifications (AWS/GCP - In progress)',
    ],
  },
  {
    id: 'education',
    kicker: 'Education',
    name: 'Formal Education',
    icon: 'graduationCap',
    items: [
      'Master of Computer Science (Honours), Monash University',
      'Bachelor of Engineering, Computer Science, University of Melbourne',
    ],
  },
];

export const projects: ProjectCard[] = [
  {
    href: 'https://github.com/Victordtesla24/EFDDH-Jira-Analytics-Dashboard',
    badge: 'Python / AI',
    title: 'EFDDH Jira Analytics',
    description: 'Python dashboard surfacing sprint velocity + LLM retros using LangChain. Exec-ready insights.',
    visual: 'dashboard',
  },
  {
    href: 'https://github.com/Victordtesla24/tailor-resume-with-ai',
    badge: 'NLP Automation',
    title: 'AI Resume Tailor',
    description: 'Automated resume tailoring with web scraping & prompt engineering. Matches CVs to JDs instantly.',
    visual: 'doc',
  },
  {
    href: 'https://github.com/Victordtesla24/relationship-timeline-feature',
    badge: 'React / D3',
    title: 'Relationship Timeline',
    description: 'React/TypeScript + D3 customer journey visualiser. Interactive temporal data visualization.',
    visual: 'waveform',
  },
  {
    href: 'https://github.com/Victordtesla24/AI-Gmail-Mailbox-Manager',
    badge: 'TypeScript Automation',
    title: 'AI Gmail Manager',
    description: 'Autonomous Gmail triage in TypeScript. Filters, labels, and drafts replies using LLMs.',
    visual: 'terminal',
  },
];

export const featuredRepos: FeaturedRepo[] = [
  {
    href: 'https://github.com/Victordtesla24/btr-demo',
    name: 'btr-demo',
    description: 'BPHS Birth Time Rectification engine.',
  },
  {
    href: 'https://github.com/Victordtesla24/jyotish-shastra',
    name: 'jyotish-shastra',
    description: 'Enterprise-grade Vedic Astrology platform.',
  },
  {
    href: 'https://github.com/Victordtesla24/rishi-prajnya',
    name: 'rishi-prajnya',
    description: 'AI career guidance platform.',
  },
  {
    href: 'https://github.com/Victordtesla24/Birth-Time-Rectifier',
    name: 'Birth-Time-Rectifier',
    description: 'AI-driven rectification system.',
  },
  {
    href: 'https://github.com/Victordtesla24/Advanced-Prompt-Creator',
    name: 'Advanced-Prompt-Creator',
    description: 'Privacy-first prompt engineering.',
  },
  {
    href: 'https://github.com/Victordtesla24/telemetry-server',
    name: 'telemetry-server',
    description: 'Real-time device telemetry ingestion and WebSocket fan-out server (ANZ-era platform).',
  },
  {
    href: 'https://github.com/Victordtesla24/tesla-api',
    name: 'tesla-api',
    description: 'Telemetry API layer normalising live vehicle signal feeds for downstream clients.',
  },
  {
    href: 'https://github.com/Victordtesla24/ride-with-vic-app',
    name: 'ride-with-vic-app',
    description: 'Client app consuming the live telemetry stream over WebSockets.',
  },
  {
    href: 'https://github.com/Victordtesla24/Error-Management-System',
    name: 'Error-Management-System',
    description: 'Autonomous AI agent that detects and repairs build and runtime errors across projects.',
  },
];

/**
 * The six §6 mining sources, each with a fact traceable to it that is rendered
 * elsewhere on the site (FR-SYNTH / TC-FR-SYNTH). Order: résumé first, then the
 * five non-résumé sources the SPEC names as consulted.
 */
export const synthesisSources: SynthesisSource[] = [
  {
    kind: 'resume',
    label: 'Résumé dossier',
    mined: 'Roles, dates, education and certifications.',
    tracedFact: 'Eight career roles from MYOB (2010) through to the ATO Payday Super program.',
  },
  {
    kind: 'repo',
    label: 'GitHub repositories, commits and READMEs',
    mined: 'Project scope and execution detail read from the code itself.',
    tracedFact: 'telemetry-server — real-time device ingestion with WebSocket fan-out.',
  },
  {
    kind: 'youtube',
    label: 'YouTube @vicd0ct video descriptions',
    mined: 'Project narratives and live-build context.',
    tracedFact: 'Deep-dives on live coding, algorithm archaeology and telemetry breakdowns.',
  },
  {
    kind: 'local',
    label: 'Local profile source files',
    mined: 'CLAUDE.md, design-tokens.json, SPEC.md and workspace configuration.',
    tracedFact: 'CLAUDE.md §3 non-negotiables — monochrome design system, dual-pillar audience model (employer + client), evidence-led copy enforced by tone linter (NN-3).',
  },
  {
    kind: 'traces',
    label: 'Past operational traces',
    mined: 'Prior outcomes and measured reliability.',
    tracedFact: '10,000+ concurrent devices held at P95 under 200 ms.',
  },
  {
    kind: 'accounts',
    label: 'Public accounts',
    mined: 'Verifiable public presence.',
    tracedFact: 'github.com/Victordtesla24 and youtube.com/@vicd0ct.',
  },
];

/** The tangible-value layers FR-MINDSET names (≥2 must be shown on the value dimension). */
export type ProjectionValueKind = 'time saved' | 'risk reduced' | 'cost avoided';

export interface ProjectionDimension {
  /** Stable slug → `data-dimension`. */
  key: 'depth' | 'scale' | 'longevity' | 'value';
  label: string;
  /** Number-led, source-traceable claim (NN-3). */
  claim: string;
  /** Primary source the claim traces back to. */
  source: string;
  /** Only the multi-layered value dimension: the value types delivered. */
  values?: ProjectionValueKind[];
}

/**
 * FR-MINDSET (prompt §4) — the four dimensions of the balanced persona, each a
 * number-led claim traceable to the résumé/record (mirrored in `miniVicKnowledge`
 * so the clone projects the same profile). Rendered in `#mindset` (TC-FR-MINDSET).
 */
export const projectionDimensions: ProjectionDimension[] = [
  {
    key: 'depth',
    label: 'Technical depth',
    claim: '92% of test-evidence effort cut across 200+ ATO scenarios — automation built with zero new InfoSec approvals.',
    source: 'ATO Payday Super test-automation harness',
  },
  {
    key: 'scale',
    label: 'Program scale',
    claim: '$5M+ program portfolio across 5+ squads and 40+ practitioners, delivered at 100% compliance.',
    source: 'ANZ Banking Group program leadership',
  },
  {
    key: 'longevity',
    label: 'Sustained execution',
    claim: '15+ years across government, finance and telecommunications; nearly 8 sustained years at ANZ (2017–2025).',
    source: 'Career record, MYOB (2010) through to the ATO',
  },
  {
    key: 'value',
    label: 'Tangible value',
    claim: '30%+ delivery-efficiency gain, 15%+ infrastructure cost cut, and 100% risk-framework compliance.',
    source: 'ANZ cloud-native modernisation',
    values: ['time saved', 'cost avoided', 'risk reduced'],
  },
];

export const contact = {
  headline: "Let's ship AI/ML programs that stay fast, safe, and compliant.",
  email: 'sarkar.vikram@gmail.com',
  phone: '+61 433 224 556',
  phoneHref: 'tel:+61433224556',
  github: 'https://github.com/Victordtesla24',
  youtube: 'https://youtube.com/@vicd0ct',
};

export interface ProofPoint {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

/** Quantified, resume-sourced proof points for the hero proof bar (FR-PROOF). */
export const proof: ProofPoint[] = [
  { value: 15, suffix: '+', label: 'years across government, finance and telecommunications' },
  { value: 5, prefix: '$', suffix: 'M+', label: 'program portfolio led at ANZ' },
  { value: 92, prefix: '≈', suffix: '%', label: 'evidence effort cut by the ATO test-automation harness' },
  { value: 10, suffix: 'k+', label: 'concurrent devices at P95 under 200 ms (ANZ telemetry)' },
];

export type DossierPersona = 'employer' | 'client';

export interface DossierEdition {
  /** First-class audience → `data-persona` (SPEC §2 / NN-1). */
  persona: DossierPersona;
  /** Section label, e.g. "For employers". */
  label: string;
  /** Number-led, persona-specific takeaway (NN-3). */
  takeaway: string;
}

/**
 * NN-2 (prompt §2) — the memorable "leave-behind" dossier. A visitor leaves with
 * something concrete: a downloadable one-page dossier (the CV PDF), the recurring
 * monochrome signature motif, and a reachable clone. Every recall signature is
 * number-led and traces 1:1 to the canonical `proof` data above (no drift).
 * Rendered in `#dossier` (TC-NN-2).
 */
export const dossier = {
  name: 'Vikram Deshpande',
  role: 'Scrum Master / Project Manager — Australian Taxation Office · AI Solutions Architect',
  summary:
    'Fifteen-plus years turning complex government, finance and telecommunications programs into measurable, compliant delivery.',
  downloadHref: '/docs/Vik_Resume_Final.pdf',
  downloadLabel: 'Download the one-page dossier (PDF)',
  highlights: [
    '15+ years across government, finance and telecommunications',
    '$5M+ program portfolio led across 5+ squads at 100% compliance',
    '≈92% test-evidence effort cut on the ATO Payday Super harness',
    '10k+ concurrent devices at P95 under 200 ms (ANZ telemetry)',
  ],
  editions: [
    {
      persona: 'employer',
      label: 'For employers',
      takeaway:
        '15+ years of delivery leadership and a 92% evidence-effort cut — the full record is in the dossier.',
    },
    {
      persona: 'client',
      label: 'For clients',
      takeaway:
        '$5M+ programs shipped at 100% compliance; book a conversation and keep the one-page dossier.',
    },
  ] as DossierEdition[],
};
