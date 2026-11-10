/**
 * The local knowledge base: curated, first-person answers about Vikram that the
 * assistant gives when the live chat function cannot be reached. They are kept
 * in parity with content/ and with the CV (public/docs/Vik_Resume_Final.pdf);
 * do not add a claim here that those sources do not carry.
 *
 * Matching lives in ./local.ts.
 */

export interface KnowledgeEntry {
  id: string;
  /** Lowercase keywords and phrases; a match on any scores the entry. Multi-word phrases score higher. */
  keywords: string[];
  /** The answer, first person as Vikram ("I ..."), with concrete numbers where available. */
  answer: string;
}

export const FALLBACK_ANSWER: string =
  'That is outside my knowledge base, which is built from Vikram\'s CV and repositories. Ask him directly: sarkar.vikram@gmail.com or +61 433 224 556. On file here: the ATO Payday Super work, the 92% evidence-automation cut, ANZ telemetry, leadership style, stack, and availability.';

export const knowledgeBase: KnowledgeEntry[] = [
  // ── 1. Current role ────────────────────────────────────────────────────
  {
    id: 'current-role',
    keywords: [
      'current role',
      'current job',
      'what do you do',
      'where do you work',
      'working now',
      'working on now',
      'ato',
      'australian taxation office',
      'scrum master',
      'project manager',
      'kookaburras',
      'agile kookaburras',
      'role',
      'job',
      'ato work',
      'tell me about your ato',
      'about your ato',
    ],
    answer:
      "I'm the Scrum Master / Project Manager on the ATO's Payday Super program (March 2026 – present), leading the Agile Kookaburras squad — one of eight squads delivering NTP and Distribution UI capabilities. I own sprint cadence, PI planning (PI 47–48), capacity management, and executive reporting, and I've driven Distribution UI delivery past 95% completion while unblocking stalled NTP testing. It's a high-visibility government reform program, and I'm accountable for keeping delivery on track end to end.",
  },

  // ── 2. Payday Super / NTP ──────────────────────────────────────────────
  {
    id: 'payday-super',
    keywords: [
      'payday super',
      'what is payday super',
      'ntp',
      'distribution ui',
      'superannuation',
      'super reform',
      'ato program',
      'reform program',
    ],
    answer:
      "Payday Super is the ATO's major superannuation reform program, and I work on its NTP and Distribution UI features as Scrum Master / Project Manager. The program runs eight squads in parallel; my squad, the Agile Kookaburras, is one of them. The delivery challenge is significant — for example, system integration testing spans 200+ SIT/E2E scenarios across all eight squads — which is why I invested heavily in test-evidence automation and capacity re-baselining to keep the program feasible.",
  },

  // ── 3. Test-automation achievement ─────────────────────────────────────
  {
    id: 'test-automation',
    keywords: [
      'test automation',
      'test evidence',
      'evidence automation',
      'automation achievement',
      '92%',
      'sit window',
      'war room',
      'contingency ladder',
      'go no go',
      'infeasible',
      'automation',
      'sit',
      'e2e',
    ],
    answer:
      "My standout recent result: I turned an impossible test deadline at the ATO into a delivered outcome. The SIT phase required 75+ hours of manual test evidence per team against only 64 available hours — mathematically infeasible. I architected an automation approach that cut evidence effort by about 92% (from ~3 hours to ~15 minutes per scenario) across 200+ scenarios and eight squads, secured endorsement through a war room that reached a binding decision in under three hours, and did it all without a single new InfoSec approval — meaning no procurement or security delays.",
  },

  // ── 4. Change request / governance ─────────────────────────────────────
  {
    id: 'change-request',
    keywords: [
      'change request',
      'governance',
      'rebaseline',
      're-baseline',
      'person days',
      'options analysis',
      'capacity',
      'traceability',
      'azure devops',
      'stt regression',
      'data tables',
    ],
    answer:
      "I authored the executive change request that re-baselined Payday Super test capacity from 30 to up to 90 person-days. It included a full options analysis, a costed recommendation, a risk assessment, and end-to-end Azure DevOps traceability across 40 scenarios and 11 data tables (acceptance criteria AC6–AC19), plus the STT regression scope. That's the kind of governance work I do alongside hands-on delivery — making the case to executives with numbers, not assertions.",
  },

  // ── 5. Scrum style & ceremonies ────────────────────────────────────────
  {
    id: 'scrum-style',
    keywords: [
      'scrum style',
      'agile ceremonies',
      'how do you run',
      'sprint cadence',
      'pi planning',
      'retrospective',
      'standup',
      'stand up',
      'ceremonies',
      'safe',
      'agile',
      'sprints',
      'facilitation',
    ],
    answer:
      "I'm a Certified Scrum Master (Scrum Alliance) and I run a steady, data-driven cadence: sprints, PI planning (currently PI 47–48 at the ATO), capacity management, and executive status reporting are all part of my weekly rhythm. I work within scaled environments — my squad is one of eight on the Payday Super program — so cross-squad dependency management and escalation paths matter as much as ceremonies. I also build tooling for the process itself: I developed a Next.js/Supabase JIRA analytics dashboard that surfaces sprint velocity and generates LLM-powered retrospective insights. My philosophy is that ceremonies exist to remove friction, and where the friction is systemic, I automate it away.",
  },

  // ── 6. Leadership / people management ──────────────────────────────────
  {
    id: 'leadership',
    keywords: [
      'leadership',
      'leadership style',
      'management style',
      'people management',
      'team size',
      'team sizes',
      'squad size',
      'how many people',
      'how big were the teams',
      'how big was the team',
      'biggest team',
      'largest team',
      'teams you led',
      'team you led',
      'managed budgets',
      'manage budgets',
      'budget management',
      'headcount',
      'direct reports',
      'span of control',
      'offshore',
      'managing teams',
      'leading teams',
      'manage',
      'leader',
      'mentoring',
      'lead a team',
      'lead teams',
      'how you lead',
      'how do you lead',
    ],
    answer:
      "I've led at genuine scale: 5+ cross-functional squads and up to 40 onsite and offshore practitioners at ANZ, with a $5M+ program portfolio delivered at 100% compliance to enterprise risk frameworks. Executive workshops I ran for 40+ leaders improved strategic decision clarity by about 55%. Right now I lead one of eight squads on the ATO's Payday Super program. I keep teams shipping by owning the blockers myself — escalations, capacity fights, tooling — rather than delegating the hard conversations.",
  },

  // ── 7. Biggest achievement ─────────────────────────────────────────────
  {
    id: 'biggest-achievement',
    keywords: [
      'biggest achievement',
      'proudest',
      'greatest achievement',
      'best work',
      'most proud',
      'career highlight',
      'top achievement',
      'achievement',
      'accomplishment',
    ],
    answer:
      "Saving a government program's test phase that was mathematically infeasible — 75+ hours of required work against 64 available — by architecting automation that cut effort by 92% across eight squads, with zero new security approvals and executive endorsement secured in under three hours. It demonstrates the three things I'm hired for: diagnosing the real constraint, engineering the fix, and driving the governance to land it.",
  },

  // ── 8. Delivery metrics track record ───────────────────────────────────
  {
    id: 'delivery-metrics',
    keywords: [
      'track record',
      'delivery metrics',
      'results',
      'what results',
      'results have you delivered',
      'quantified outcomes',
      'quantified results',
      'measurable outcomes',
      'measurable results',
      'with numbers',
      'hard numbers',
      'key metrics',
      'business impact',
      'value delivered',
      'top achievements',
      'three achievements',
      'data points',
      'numbers',
      'measurable',
      'outcomes',
      'kpis',
      'impact',
      'metrics',
      'proof',
      'evidence',
      'statistics',
      'stats',
    ],
    answer:
      "My track record in numbers. At the ATO: ≈92% reduction in test-evidence effort across 200+ SIT/E2E scenarios (~3 hours to ~15 minutes each); test capacity re-baselined from 30 to up to 90 person-days via an executive change request; Distribution UI delivery steered past 95% completion. At ANZ: P95 latency under 200 ms across 10,000+ concurrent devices, >30% delivery-efficiency improvement and >15% infrastructure cost reduction from the cloud-native modernisation, a $5M+ portfolio across 5+ squads at 100% compliance, and ~55% improvement in executive decision clarity from workshops with 40+ leaders. In my independent AI consulting: an LLM evaluation stack that cut simulated error-budget breaches by 38%. Every one of those traces to a line on my CV — it's the only honest way to claim impact.",
  },

  // ── 9. ANZ experience ──────────────────────────────────────────────────
  {
    id: 'anz-experience',
    keywords: [
      'anz',
      'anz bank',
      'anz banking group',
      'at anz',
      'about anz',
      'anz experience',
      'anz role',
      'work at anz',
      'worked at anz',
      'time at anz',
      'delivery lead',
      'solutions architect',
      'telemetry',
      'websocket',
    ],
    answer:
      "I spent nearly eight years at ANZ Banking Group (Sept 2017 – Jun 2025) as Senior Delivery Lead / AI-ML Solutions Architect. I led delivery of AI/ML solutions including real-time WebSocket telemetry sustaining P95 latency under 200 ms across 10,000+ concurrent devices for critical banking services, and guided core banking platforms onto cloud-native .NET/Azure architectures — improving delivery efficiency by more than 30% and cutting infrastructure costs by over 15%. I managed a $5M+ program portfolio across 5+ squads (40+ onsite and offshore practitioners) with 100% compliance, and owned the technical vision and product backlog for the platform modernisations.",
  },

  // ── 10. Banking / financial services ───────────────────────────────────
  {
    id: 'banking-financial-services',
    keywords: [
      'banking',
      'banking experience',
      'banking background',
      'experience in banking',
      'financial services',
      'banks',
      'nab',
      'at nab',
      'national australia bank',
      'finance experience',
      'finance background',
      'fintech',
      'risk and compliance',
      'regulated',
    ],
    answer:
      "I have deep financial-services experience: almost eight years at ANZ (Sept 2017 – Jun 2025) leading AI/ML delivery and cloud modernisation for core banking platforms, preceded by NAB (Nov 2016 – Sept 2017) where I managed a critical risk-and-compliance program ensuring regulatory adherence for major enterprise data initiatives. Earlier, I worked at MYOB on financial data processing. I'm comfortable operating where engineering meets regulation — at ANZ I managed a $5M+ portfolio with 100% compliance to enterprise risk frameworks.",
  },

  // ── 11. Government experience ──────────────────────────────────────────
  {
    id: 'government-experience',
    keywords: [
      'government',
      'public sector',
      'federal',
      'government experience',
      'security clearance',
      'gov',
    ],
    answer:
      "My current engagement is with the Australian Taxation Office, where I'm Scrum Master / Project Manager on the Payday Super reform program — a large federal program running eight squads in parallel. Government delivery has its own physics: my flagship automation there was deliberately built with zero new InfoSec approvals so it could ship inside the security envelope, and my change request carried full options analysis, costed recommendations, and Azure DevOps traceability. My sixteen-year career spans government, financial services, and telecommunications, so I'm used to delivering under formal governance.",
  },

  // ── 12. AI/ML & LLM experience ─────────────────────────────────────────
  {
    id: 'ai-ml-experience',
    keywords: [
      'ai experience',
      'ml experience',
      'machine learning',
      'artificial intelligence',
      'ai ml',
      'llm experience',
      'genai',
      'generative ai',
      'langchain',
      'ai work',
      'ai tools',
      'ai technologies',
      'llm tools',
      'ai skills',
      'ai background',
      'ai capability',
      'ai delivery',
      'agents',
      'rag',
      'prompt engineering',
      'llm',
      'llms',
      'mlops',
    ],
    answer:
      "I bring practical, shipped AI experience rather than slideware. I led AI/ML solution delivery at ANZ for critical banking services, then spent Jun 2025 – Feb 2026 as an independent AI consultant building production tooling: an LLM evaluation stack that cut simulated error-budget breaches by 38%, an analytics dashboard generating LLM-powered sprint retrospectives, and autonomous LLM agents for resume tailoring and inbox triage. I know how to take AI from prototype to governed, measured production — which is exactly the gap most organisations are struggling with.",
  },

  // ── 13. LLM evaluation / quality work ──────────────────────────────────
  {
    id: 'llm-evaluation',
    keywords: [
      'llm evaluation',
      'llm evals',
      'ai quality',
      'langfuse',
      'phoenix',
      'error budget',
      'ai safety',
      'model evaluation',
      'observability',
      'evals',
      'hallucination',
    ],
    answer:
      "I built a production LLM evaluation stack using Langfuse and Phoenix that reduced simulated error-budget breaches by 38% — tracing, scoring, and catching quality regressions before they reach users. Alongside it I built a production-grade Node.js/Express public-key server for API signing with full test coverage, and automated risk-assessment pipelines so AI rollouts stay aligned with enterprise compliance and risk models. My view: if you can't measure an LLM system against an error budget, you don't have a production system yet.",
  },

  // ── 14. Technical stack ────────────────────────────────────────────────
  {
    id: 'tech-stack',
    keywords: [
      'tech stack',
      'technical skills',
      'technology stack',
      'technologies',
      'what technologies',
      'technologies do you use',
      'programming languages',
      'what languages',
      'which languages',
      'tools you use',
      'tools do you use',
      'what tools',
      'which tools',
      'do you know',
      'are you familiar',
      'have you used',
      'do you use',
      'have you worked with',
      'hands on skills',
      'skills',
      'stack',
      'python',
      'typescript',
      'javascript',
      'react',
      'nextjs',
      'node',
      'kubernetes',
      'docker',
      'terraform',
      'postgres',
      'supabase',
      'sql',
      'd3',
    ],
    answer:
      "I'm genuinely full-stack: Python, TypeScript, React/Next.js, and cloud-native infrastructure across AWS, GCP, and Azure (Kubernetes, Docker, Terraform), plus AI/LLM pipelines with LangChain, Langfuse, and Phoenix. What makes the profile rare is the range — I've shipped everything from mainframe REXX automation at the ATO to real-time AI telemetry at ANZ. You're hiring someone who can review the architecture and also present it to the steering committee.",
  },

  // ── 15. Mainframe / COBOL ──────────────────────────────────────────────
  {
    id: 'mainframe-cobol',
    keywords: [
      'mainframe',
      'cobol',
      'rexx',
      'jcl',
      'sdsf',
      'smf',
      'pcomm',
      'legacy systems',
      'z os',
      'zos',
      'mainframe automation',
      'mainframe work',
      'mainframe automation work',
    ],
    answer:
      "Yes — I do real mainframe work, which is increasingly rare. At the ATO I architected the COBOL/mainframe test-evidence automation for the Payday Super program: REXX scripting, SMF data, SDSF, and PCOMM on the host side, with PowerShell and VBA handling workstation-side collation. It covered 200+ SIT/E2E scenarios across eight squads and cut evidence effort by about 92% per scenario, using only already-approved tooling so no new InfoSec approvals were needed. I treat legacy platforms as engineering problems, not museum pieces.",
  },

  // ── 16. Cloud platforms ────────────────────────────────────────────────
  {
    id: 'cloud-platforms',
    keywords: [
      'cloud',
      'aws',
      'gcp',
      'azure',
      'cloud platforms',
      'cloud experience',
      'cloud migration',
      'cloud native',
      'terraform',
      'docker',
    ],
    answer:
      "I work across all three major clouds — GCP, AWS, and Azure — with Kubernetes, Docker, and Terraform as my infrastructure toolkit. The flagship cloud project was at ANZ, where I guided core banking platforms onto cloud-native .NET/Azure architectures, improving delivery efficiency by more than 30% and reducing infrastructure costs by over 15%. I'm also formalising the credentials: AWS and GCP certifications are currently in progress, on top of my Certified Scrum Master.",
  },

  // ── 17. Education ──────────────────────────────────────────────────────
  {
    id: 'education',
    keywords: [
      'education',
      'degree',
      'degrees',
      'university',
      'monash',
      'melbourne university',
      'university of melbourne',
      'masters',
      'bachelor',
      'study',
      'studied',
      'your education',
      'did you study',
      'qualifications',
      'qualification',
    ],
    answer:
      "I hold a Master of Computer Science (Honours) from Monash University (2010) and a Bachelor of Engineering in Computer Science from the University of Melbourne (2007). The formal CS grounding still shows up in my work — from algorithm-level thinking in my side projects to architecting systems with measurable performance budgets.",
  },

  // ── 18. Certifications ─────────────────────────────────────────────────
  {
    id: 'certifications',
    keywords: [
      'certifications',
      'certified',
      'certification',
      'your certifications',
      'any certifications',
      'what certifications',
      'which certifications',
      'certifications do you hold',
      'list your certifications',
      'are you certified',
      'csm',
      'scrum alliance',
      'certified scrum master',
      'credentials',
      'certificate',
      'certs',
      'accreditation',
      'accreditations',
      'what accreditations',
      'accreditations do you have',
      'aws certification',
      'gcp certification',
      'cloud certification',
      'cloud certifications',
      'professional certifications',
      'when did you get',
      'what year did you',
      'certification dates',
      'qualifications',
      'licences',
      'licenses',
    ],
    answer:
      "One certification held and two in progress, plus two dated degrees. Held: Certified Scrum Master (CSM) from the Scrum Alliance — the CV carries it without an award date, so I won't invent one; I'll send the certificate on request. In progress: AWS and GCP cloud/data certifications, which formalise multi-cloud work I've been doing since the ANZ modernisation. Degrees: Master of Computer Science (Honours), Monash University, 2010; Bachelor of Engineering in Computer Science, University of Melbourne, 2007.",
  },

  // ── 19. Availability & notice period ───────────────────────────────────
  {
    id: 'availability',
    keywords: [
      'availability',
      'available',
      'are you available',
      'your availability',
      'availability for',
      'notice period',
      'when can you start',
      'can you start',
      'start immediately',
      'how soon can you start',
      'immediately available',
      'currently available',
      'start date',
      'open to work',
      'open to opportunities',
      'open to a new role',
      'looking for work',
      'are you looking',
      'job search',
      'actively looking',
      'new role',
      'next role',
      'when can you join',
      'free',
      'notice',
      'join us',
      'new engagement',
      'new engagements',
      'new opportunities',
      'engagements',
      'opportunities',
    ],
    answer:
      "I'm actively exploring Scrum Master / Project Manager and delivery-leadership roles in Melbourne, especially where AI delivery leadership meets complex programs. I'm currently engaged at the ATO on the Payday Super program, so timing is a conversation rather than an immediate start — but I'd genuinely welcome the discussion early. Reach out directly at sarkar.vikram@gmail.com or +61 433 224 556 and we can talk timing, scope, and fit.",
  },

  // ── 20. Services / engagements ──────────────────────────────────────────
  {
    id: 'services-engagements',
    keywords: [
      'services',
      'what services',
      'services do you offer',
      'what do you offer',
      'engagement model',
      'engagement models',
      'how do you engage',
      'engage with clients',
      'types of engagements',
      'consulting services',
      'advisory',
      'consulting offer',
      'what kind of work',
      'client work',
      'client engagement',
      'delivery model',
      'engagement types',
      'contract',
      'contracting',
      'consulting',
      'consultant',
      'offer services',
      'your services',
    ],
    answer:
      "I offer three engagement models depending on what you need. Advisory: I help teams design their AI delivery roadmap, evaluate tools, or stand up MLOps — fractional, typically remote, highly flexible. Embedded delivery lead: I join your program as Scrum Master / Project Manager — what I'm doing right now at the ATO — owning sprint cadence, PI planning, and cross-squad dependency management. Build / hands-on: I architect and ship the system myself — automation, LLM evals, dashboards — scoped to a measurable outcome. For a permanent role, my experience spans sixteen years across government, banking, and AI consulting with a track record of delivering at scale.",
  },

  // ── 21. Rates / salary ─────────────────────────────────────────────────
  {
    id: 'rates-salary',
    keywords: [
      'rate',
      'rates',
      'salary',
      'day rate',
      'daily rate',
      'your rate',
      'your rates',
      'your salary',
      'salary expectation',
      'salary expectations',
      'expected salary',
      'current salary',
      'salary range',
      'how much',
      'do you charge',
      'how much do you charge',
      'charge',
      'cost',
      'pricing',
      'compensation',
      'remuneration',
      'package',
      'pay',
      'budget',
      'fee',
    ],
    answer:
      "Honest answer: pay isn't published on this site, and it depends entirely on scope — an advisory engagement, a delivery-leadership role, and a hands-on build are priced very differently. I won't quote a number into the void, and I won't share my current package through a chatbot either. Email me at sarkar.vikram@gmail.com with a sketch of the role or engagement and I'll respond with a straight answer on range and structure.",
  },

  // ── 21. Contact details ────────────────────────────────────────────────
  {
    id: 'contact',
    keywords: [
      'contact',
      'email',
      'email address',
      'your email',
      'phone',
      'phone number',
      'your phone',
      'mobile number',
      'reach you',
      'reach out',
      'how can i reach',
      'best way to reach',
      'contact me',
      'contact details',
      'contact info',
      'contact information',
      'contact you',
      'get in touch',
      'call you',
      'linkedin',
      'your linkedin',
      'linkedin profile',
      'linkedin url',
      'linkedin page',
      'linkedin link',
      'github',
      'your github',
      'github profile',
      'github url',
      'github link',
      'social profiles',
      'profile links',
      'where can i find you',
      'how do i find you',
      'connect with you',
    ],
    answer:
      "Here's how to reach me: email sarkar.vikram@gmail.com, phone +61 433 224 556, based in Melbourne, VIC, Australia. LinkedIn is linkedin.com/in/vikramd-profile, GitHub is github.com/Victordtesla24, and the YouTube channel is youtube.com/@vicd0ct. Email is the fastest channel for roles and project enquiries; LinkedIn is the one to use if you'd rather start with a connection request.",
  },

  // ── 22. Location & remote/hybrid ───────────────────────────────────────
  {
    id: 'location-remote',
    keywords: [
      'location',
      'where are you based',
      'where are you located',
      'are you located',
      'where do you live',
      'which city',
      'what city',
      'based in',
      'based where',
      'your location',
      'remote work',
      'work remotely',
      'do you work remotely',
      'remote role',
      'remote roles',
      'fully remote',
      'hybrid',
      'hybrid work',
      'work from home',
      'relocate',
      'relocating',
      'relocation',
      'willing to relocate',
      'open to relocating',
      'open to relocation',
      'melbourne',
      'australia',
      'timezone',
      'time zone',
      'remote',
      'onsite',
      'onsite work',
      'office',
      'commute',
    ],
    answer:
      "I'm based in Melbourne, VIC, Australia (AEST/AEDT), and I'm comfortable across onsite, hybrid, and remote arrangements. My current ATO engagement is Melbourne-based, and every role on my record since 2010 has been in Melbourne apart from Microsoft in Sydney (Oct 2015 – Oct 2016). Distributed delivery is something I've practised at scale — at ANZ I led 40+ onsite and offshore practitioners across 5+ squads — so cadence and quality hold up when the team isn't in one room. For the right engagement, the working model is a conversation, not a blocker.",
  },

  // ── 23. Why hire Vikram ────────────────────────────────────────────────
  {
    id: 'why-hire',
    keywords: [
      'why hire',
      'why should we hire',
      'should we hire',
      'should i hire',
      'hire you',
      'hire vikram',
      'reasons to hire',
      'why you',
      'what do you bring',
      'value proposition',
      'sell yourself',
      'pitch',
      'why choose you',
      'strengths',
    ],
    answer:
      "Three reasons. First, proven outcomes at scale: 92% test-effort reduction at the ATO, >30% delivery efficiency gains at ANZ, a $5M+ portfolio at 100% compliance. Second, range: I'm credible with executives, engineers, and auditors in the same week — I write the change request and the REXX script. Third, currency: while many delivery leaders watched the AI wave, I spent eight months hands-on building LLM evaluation stacks and autonomous agents. You get a leader who de-risks delivery because he can see all the way down.",
  },

  // ── 24. Weaknesses / growth areas ──────────────────────────────────────
  {
    id: 'weaknesses',
    keywords: [
      'weakness',
      'weaknesses',
      'your weakness',
      'your weaknesses',
      'biggest weakness',
      'growth areas',
      'areas for improvement',
      'improve',
      'biggest flaw',
      'development areas',
      'what are you bad at',
      'shortcomings',
      'criticism',
    ],
    answer:
      "Honest answer: I have a hands-on bias. When delivery is blocked, my instinct is to dive in and fix it myself — which is a strength in a crisis but can crowd out the team's own problem-solving if I'm not careful. I actively manage it two ways: I delegate deliberately, giving squad members ownership of escalations and technical spikes even when I could do them faster, and I channel the hands-on energy into building automation and tooling that removes the friction permanently rather than heroics that remove it once. The ATO evidence harness is that mitigation in action — I built the system so nobody, including me, has to do the manual work again.",
  },

  // ── 25. Side projects ──────────────────────────────────────────────────
  {
    id: 'side-projects',
    keywords: [
      'side projects',
      'personal projects',
      'github projects',
      'open source',
      'jyotish',
      'vedic',
      'birth time',
      'resume tailor',
      'gmail manager',
      'projects',
      'portfolio',
      'repos',
      'what projects',
      'what have you built',
      'projects have you built',
      'built projects',
      'portfolio projects',
      'what projects have you built',
    ],
    answer:
      "My GitHub (github.com/Victordtesla24) reflects two passions. The practical AI side: 'AI Resume Tailor' (automated CV-to-JD matching with NLP and prompt engineering), 'AI Gmail Manager' (an autonomous TypeScript inbox-triage agent), the EFDDH JIRA Analytics dashboard with LLM-powered retros, and a React/TypeScript + D3 relationship-timeline visualiser. The unusual side: 'Jyotish Shastra' and 'BTR-Demo' — enterprise-grade platforms exploring the intersection of ancient Vedic algorithms and modern AI/ML, including a BPHS birth-time rectification engine. I genuinely believe there's a lot to learn from ancient algorithms and Vedic astronomy when building modern systems.",
  },

  // ── 26. YouTube channel ────────────────────────────────────────────────
  {
    id: 'youtube',
    keywords: [
      'youtube',
      'youtube channel',
      'vicd0ct',
      'videos',
      'content creator',
      'channel',
      'live coding',
    ],
    answer:
      "I run the @vicd0ct YouTube channel (youtube.com/@vicd0ct) with 10 published videos in English and Marathi. Highlights include a JARVIS-inspired real Arc Reactor HUD for Apple Silicon telemetry on Mac (196 views), and a multi-part series on the 7,000-year-old algorithm hidden in Sanskrit — translating Vedic astronomy into Python code — whose flagship video has 3.1K views. It's where my professional delivery work and my interest in the history of computation meet in public.",
  },

  // ── 27. How this website was built ─────────────────────────────────────
  {
    id: 'website-build',
    keywords: [
      'this website',
      'this site',
      'how was this built',
      'how did you build this',
      'built this site',
      'website stack',
      'starfield',
      'site built',
      'framer motion',
      'next js',
      'nextjs',
      'minivic',
      'chatbot',
      'how do you work',
    ],
    answer:
      "The site itself is a portfolio piece: Next.js, React and TypeScript with Motion for animation, shipped as a static export on Firebase. The considered bit is me — MiniVic answers through a server-side model call locked to a curated fact base, with a deterministic offline fallback, so there's no server to maintain and no invented claims. It shows how Vikram thinks: maximum effect, minimum operational surface.",
  },

  // ── 28. What makes him different ───────────────────────────────────────
  {
    id: 'what-makes-different',
    keywords: [
      'what makes you different',
      'different from',
      'unique',
      'stand out',
      'differentiator',
      'special about',
      'unusual',
      'rare',
      'edge',
    ],
    answer:
      "Most candidates are either delivery leaders who need engineers to tell them what's possible, or engineers who need someone else to carry the message upstairs. I'm the rare both: I authored the executive change request that re-baselined test capacity from 30 to 90 person-days, and I architected the mainframe automation it depended on. You're not hiring a translator between business and engineering — you're hiring someone fluent as a native in both.",
  },

  // ── 29. Independent consulting period ──────────────────────────────────
  {
    id: 'independent-consulting',
    keywords: [
      'independent consulting',
      'consultant',
      'consulting',
      'freelance',
      'career break',
      'gap',
      '2025',
      'between anz and ato',
      'upskilling',
      'sabbatical',
    ],
    answer:
      "Between ANZ and the ATO (Jun 2025 – Feb 2026) I worked as an independent AI Solutions Consultant in Melbourne, deliberately going hands-on with applied LLM engineering. In eight months I shipped: a Next.js/Supabase JIRA analytics dashboard with sprint velocity metrics and LLM-powered retrospective insights, an LLM evaluation stack (Langfuse + Phoenix) reducing simulated error-budget breaches by 38%, a production-grade Node.js/Express public-key server for API signing with full test coverage, a React/TypeScript + D3 relationship-timeline visualiser, plus the 'AI Resume Tailor' and 'AI Gmail Manager' agents. It wasn't a gap — it was a self-funded engineering residency that made my AI credentials current and practical.",
  },

  // ── 30. Earlier career (Microsoft, Telstra, InfoCentric, MYOB) ─────────
  {
    id: 'early-career',
    keywords: [
      'microsoft',
      'at microsoft',
      'telstra',
      'at telstra',
      'infocentric',
      'myob',
      'at myob',
      'early career',
      'career history',
      'work history',
      'before anz',
      'business analyst',
      'background',
      'career path',
    ],
    answer:
      "My career spans sixteen years across government, financial services, and telecommunications. Before the banking years (NAB 2016–2017, ANZ 2017–2025) I was Lead Business Analyst at Microsoft in Sydney (Oct 2015 – Oct 2016), where I delivered a gap analysis for Azure ML telemetry that improved system reliability and reduced incident resolution time. Earlier: Business Analyst / Project Coordinator at Telstra (2014–2015) building customer journey scorecards, Senior Business Analyst at InfoCentric (2011–2014) delivering analytics and BI projects including automated regulatory reporting, and developer support, testing, and analysis at MYOB (2010–2011). It's a deliberate arc — from analysing systems, to delivering them, to leading the people and programs that build them.",
  },

  // ── 31. Services offered ─────────────────────────────────────────────────
  {
    id: 'services-offered',
    keywords: [
      'services',
      'what services',
      'services do you offer',
      'what do you offer',
      'services offered',
      'what can you do for me',
      'what can you do',
      'consulting services',
      'offerings',
      'what you offer',
      'service',
      'capabilities',
      'delivery services',
      'consultant',
      'as a consultant',
    ],
    answer:
      "My services break into three pillars, all measured. AI/ML Solutions: LLM pipeline architecture, evaluation stacks (Langfuse/Phoenix), autonomous agents, and real-time telemetry. Agile Delivery: I run squads through complex programs — sprint cadence, PI planning, capacity management, and governance — having led a $5M+ portfolio at ANZ and currently delivering for the ATO. Delivery Automation: I build the tooling that removes friction permanently — the ATO evidence harness cut effort 92%, and my JIRA analytics dashboard gives execs real sprint telemetry. I measure everything I deliver, so you'll know what you're getting.",
  },

  // ── 32. Engagement model ─────────────────────────────────────────────────
  {
    id: 'engagement-model',
    keywords: [
      'engagement model',
      'how do you engage',
      'how do you work with clients',
      'working model',
      'engagement',
      'how do you work',
      'contract',
      'contracting',
      'statement of work',
      'fixed price',
      'time and materials',
      'retainer',
      'engagement type',
      'how do we start',
      'how to start',
      'process',
      'next steps',
      'how to hire you',
      'hire you',
    ],
    answer:
      "The starting point is a conversation — email me at sarkar.vikram@gmail.com with an outline of the role or engagement you have in mind. I'll respond with a candid read on fit and timing. I'm currently delivering for the ATO's Payday Super program, so my availability is a conversation rather than an immediate start, but the right opportunities are worth planning early. I work across advisory, delivery leadership, and hands-on builds; scope and structure follow from what you actually need.",
  },

  // ── 33. AI solutions architecture ────────────────────────────────────────
  {
    id: 'ai-architecture',
    keywords: [
      'ai architecture',
      'ai solutions architecture',
      'ai approach',
      'how do you build ai',
      'ai methodology',
      'ai design',
      'ai system design',
      'llm architecture',
      'ai stack',
      'ai platform',
      'how do you architect',
      'architecture approach',
      'solutions architecture',
      'architectural approach',
    ],
    answer:
      "I architect AI systems the way I deliver programs: measured, governed, and grounded in constraints. My LLM stack is LangChain for pipelines, Langfuse for tracing, Phoenix for observability — and I validate every component against error budgets (38% breach reduction in my evaluation stack). For real-time AI I define latency budgets upfront — at ANZ that meant P95 under 200 ms across 10,000+ concurrent devices. The non-negotiable is deterministic fallback: every AI surface degrades to a known-good path, which is how this chatbot works — a server-side model call grounded in a curated fact base, with a local matcher behind it. Infrastructure is Kubernetes, Docker, Terraform across GCP/AWS/Azure, all CI/CD automated.",
  },

  // ── 34. Profile summary / "tell me about yourself" ───────────────────────
  {
    id: 'profile-summary',
    keywords: [
      'tell me about yourself',
      'tell me about you',
      'about yourself',
      'who are you',
      'introduce yourself',
      'your background',
      'your profile',
      'elevator pitch',
      'give me a summary',
      'quick summary',
      'summarise your experience',
      'summarize your experience',
      'summarise your career',
      'summarize your career',
      'in a nutshell',
      'overview',
      'summary',
      'bio',
      'profile',
    ],
    answer:
      "Scrum Master / Project Manager and technical delivery leader, Melbourne-based, 15+ years across government, finance, and telecommunications — currently on the ATO's Payday Super reform program. The short version of my record: a $5M+ portfolio led across 5+ squads and 40+ practitioners at ANZ, ≈92% of test-evidence effort removed at the ATO, and 10,000+ concurrent devices held at P95 under 200 ms. Certified Scrum Master, Master of Computer Science (Honours) from Monash. What I'm hired for is closing the gap between what executives decide and what engineering can actually deliver.",
  },

  // ── 35. Years of experience / career span ────────────────────────────────
  {
    id: 'years-of-experience',
    keywords: [
      'years of experience',
      'years experience',
      'how many years',
      'how many years of experience',
      'how much experience',
      'how long have you been',
      'how long have you worked',
      'how long in it',
      'years in the industry',
      'years in technology',
      'years working',
      'total experience',
      'career length',
      'career span',
      'experience level',
      'level of experience',
      'seniority',
      'seniority level',
      'how senior',
      '15 years',
      'fifteen years',
      'tenure',
      'experienced',
    ],
    answer:
      "15+ years, and the shape matters more than the count: eight roles since May 2010, with nearly eight of those years at ANZ Banking Group (Sept 2017 – Jun 2025) — so I've done long-horizon delivery, not just short engagements. Roughly the last decade has been leadership: program and delivery management at ANZ and NAB, and now Scrum Master / Project Manager at the ATO. The sectors are government, financial services, and telecommunications, all of them regulated, which is why governance and evidence are habits rather than overhead.",
  },

  // ── 36. Industries & sectors ─────────────────────────────────────────────
  {
    id: 'industries-sectors',
    keywords: [
      'what industries',
      'which industries',
      'industries have you worked',
      'industry experience',
      'what sectors',
      'which sectors',
      'sector experience',
      'sectors',
      'domains',
      'verticals',
      'worked in government',
      'worked in banking',
      'have you worked in',
      'what kind of companies',
      'types of organisations',
      'types of organizations',
    ],
    answer:
      "Three sectors, with dates. Government: the Australian Taxation Office since March 2026, on the Payday Super reform program. Financial services: ANZ Banking Group (Sept 2017 – Jun 2025), NAB (Nov 2016 – Sept 2017), and MYOB (May 2010 – Aug 2011) on financial data processing. Telecommunications: Telstra (Nov 2014 – Oct 2015). Add Microsoft in Sydney (Oct 2015 – Oct 2016) for enterprise technology, InfoCentric (Aug 2011 – Nov 2014) for analytics and BI consulting, and Jun 2025 – Feb 2026 as an independent AI consultant. Every one of those is a regulated or governance-heavy environment, which is the common thread.",
  },

  // ── 37. CV / dossier download ────────────────────────────────────────────
  {
    id: 'resume-cv',
    keywords: [
      'your resume',
      'your cv',
      'send me your resume',
      'send me your cv',
      'send your resume',
      'share your resume',
      'download your cv',
      'download your resume',
      'download the cv',
      'copy of your resume',
      'copy of your cv',
      'see your resume',
      'see your cv',
      'resume pdf',
      'cv pdf',
      'curriculum vitae',
      'dossier',
      'resume',
      'cv',
    ],
    answer:
      "The full CV is on this site as a PDF — the 'Download the CV dossier (PDF)' link, served from /docs/Vik_Resume_Final.pdf. It carries exactly the facts I answer from: eight roles from MYOB (2010) through to the ATO, the Certified Scrum Master credential, both degrees, and the quantified outcomes. If you'd rather have it by email with a covering note against a specific role, ask at sarkar.vikram@gmail.com — LinkedIn at linkedin.com/in/vikramd-profile works too.",
  },

  // ── 38. Work rights / citizenship (honest non-answer) ────────────────────
  {
    id: 'work-rights',
    keywords: [
      'work rights',
      'right to work',
      'visa',
      'visa status',
      'have a visa',
      'need a visa',
      'sponsorship',
      'need sponsorship',
      'require sponsorship',
      'citizenship',
      'citizen',
      'australian citizen',
      'are you a citizen',
      'permanent resident',
      'residency',
      'work permit',
      'eligible to work',
      'security clearance level',
      'baseline clearance',
      'nv1',
      'agsva',
    ],
    answer:
      "What's on record is that I'm based in Melbourne, VIC, Australia, and I've worked continuously for Australian employers since May 2010 — MYOB, InfoCentric, Telstra, Microsoft, NAB, ANZ, and now the Australian Taxation Office, which is a federal government engagement. Visa, citizenship, and clearance status aren't details I publish through this synthetic stand-in, and I won't guess at them on Vikram's behalf. Ask him directly at sarkar.vikram@gmail.com or +61 433 224 556 and you'll get a straight answer the same day.",
  },
];
