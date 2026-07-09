/**
 * miniVicKnowledge.ts — static knowledge base powering "MiniVic", the AI-clone
 * chatbot on this portfolio site. The site is statically hosted (no backend),
 * so MiniVic answers entirely client-side via deterministic keyword matching
 * against this curated, fact-checked knowledge base.
 *
 * Factual parity is maintained with:
 *   - app/data/siteContent.ts
 *   - app/data/resumeContent.ts
 *   - the standalone CV (public/docs/Vik_Resume_Final.pdf)
 *
 * Do not add claims here that are not present in those sources.
 */

export type PersonaMode = 'hiring' | 'engineering' | 'story';

export interface KnowledgeEntry {
  id: string;
  /** Lowercase keywords/phrases; a match on any scores the entry. Multi-word phrases score higher. */
  keywords: string[];
  /** Default answer, first person as Vikram ("I ..."). 2–5 sentences, concrete numbers where available. */
  answer: string;
  /** Optional persona-specific overrides. */
  personaVariants?: Partial<Record<PersonaMode, string>>;
}

export const FALLBACK_ANSWER: string =
  "Good question — I don't have that on file in my knowledge base. The real Vikram can answer it directly: email sarkar.vikram@gmail.com or call +61 433 224 556. Meanwhile, try asking me about his ATO role, the 92% test-automation win, his AI/ML work, leadership style, tech stack, or availability.";

export const GREETING: Record<PersonaMode, string> = {
  hiring:
    "Hi, I'm MiniVic — Vikram's AI clone. Ask me anything a hiring manager would: his current role at the ATO, track record, leadership style, availability, or why you should hire him.",
  engineering:
    "Hey, MiniVic here — Vikram's AI clone, engineering mode engaged. Ask me about his stack, the mainframe test-evidence automation (REXX/SMF/SDSF), LLM eval pipelines, or how this site was built.",
  story:
    "Hello! I'm MiniVic, Vikram's AI clone. Pull up a chair — ask me about his career and I'll tell it the way he would: the war rooms, the impossible deadlines, and the automation that saved them.",
};

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
      "I'm currently the Scrum Master / Project Manager on the Australian Taxation Office's Payday Super program in Melbourne (March 2026 – present), working on the NTP and Distribution UI features. I lead the Agile Kookaburras squad — one of eight squads on the program — owning sprint cadence, PI planning across PI 47–48, capacity management, and executive status reporting. Recent highlights include steering Distribution UI feature delivery past 95% completion and unblocking stalled NTP function testing by escalating L2 environment instability and brokering targeted SME enablement.",
    personaVariants: {
      hiring:
        "I'm the Scrum Master / Project Manager on the ATO's Payday Super program (March 2026 – present), leading the Agile Kookaburras squad — one of eight squads delivering NTP and Distribution UI capabilities. I own sprint cadence, PI planning (PI 47–48), capacity management, and executive reporting, and I've driven Distribution UI delivery past 95% completion while unblocking stalled NTP testing. It's a high-visibility government reform program, and I'm accountable for keeping delivery on track end to end.",
      engineering:
        "I run agile delivery for the Agile Kookaburras squad on the ATO's Payday Super program — NTP and Distribution UI features, one of eight squads. Beyond the Scrum Master remit, I architected the program's COBOL/mainframe test-evidence automation (REXX, SMF, SDSF, PCOMM, PowerShell, VBA) covering 200+ SIT/E2E scenarios, and I maintain full Azure DevOps traceability across the test scope. PI planning runs across PI 47–48; I also handle the L2 environment escalations when testing stalls.",
      story:
        "In March 2026 I joined the ATO's Payday Super program as Scrum Master / Project Manager for a squad called the Agile Kookaburras — one of eight squads rebuilding how superannuation gets delivered. Within weeks I was deep in PI planning for PI 47–48, untangling a stalled NTP test phase, and pushing Distribution UI delivery past 95%. Government reform programs move carefully, but I found the levers that move them faster.",
    },
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
      "At the ATO I architected the Payday Super program's COBOL/mainframe test-evidence automation covering 200+ SIT/E2E scenarios across all eight squads, cutting evidence effort from ~3 hours to ~15 minutes per scenario — a roughly 92% reduction. The toolchain (REXX, SMF, SDSF, PCOMM, PowerShell, VBA) required zero new InfoSec approvals, which is what made it deployable inside a government security envelope. I converted a mathematically infeasible SIT window — 75+ hours of manual evidence per team against 64 available hours — into an achievable plan via a six-day tiered harness build with a formal go/no-go gate and a four-level contingency ladder. The cross-discipline war room I convened produced a binding automation recommendation in under three hours.",
    personaVariants: {
      hiring:
        "My standout recent result: I turned an impossible test deadline at the ATO into a delivered outcome. The SIT phase required 75+ hours of manual test evidence per team against only 64 available hours — mathematically infeasible. I architected an automation approach that cut evidence effort by about 92% (from ~3 hours to ~15 minutes per scenario) across 200+ scenarios and eight squads, secured endorsement through a war room that reached a binding decision in under three hours, and did it all without a single new InfoSec approval — meaning no procurement or security delays.",
      engineering:
        "The constraint was brutal: 200+ SIT/E2E scenarios on a COBOL/mainframe estate, ~3 hours of manual evidence capture each, and a hard rule that nothing new could go through InfoSec approval. So I built the harness entirely from already-approved tooling: REXX execs driving SDSF and SMF extracts on the host, PCOMM for screen-level capture, PowerShell and VBA on the workstation side for collation and formatting. Six-day tiered build, formal go/no-go gate, four-level contingency ladder if any tier slipped. Result: ~15 minutes per scenario, ≈92% effort reduction, across all eight squads.",
      story:
        "The math said we'd already failed: 75+ hours of manual test evidence per team, 64 hours available. People were talking about descoping. I asked a different question — what if no human captured evidence at all? In six days we built a tiered automation harness from tools the ATO had already approved (REXX, SMF, SDSF, PCOMM, PowerShell, VBA), so InfoSec never had to say yes to anything new. I pulled the sceptics into one war room, and in under three hours we had a binding recommendation. Three hours per scenario became fifteen minutes, and the deadline that couldn't be met, was.",
    },
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
      'offshore',
      'onsite',
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
      "At ANZ I led 5+ cross-functional squads with 40+ onsite and offshore practitioners, managing a program portfolio valued at over $5M with 100% compliance to enterprise standards and risk frameworks. I ran executive workshops for 40+ leaders that improved strategic decision clarity by roughly 55%. Today I lead the Agile Kookaburras squad at the ATO within an eight-squad program. My style is to set a steady cadence, give people clear ownership, and personally take on the systemic blockers — escalations, environment issues, automation — so the team can focus on delivery.",
    personaVariants: {
      hiring:
        "I've led at genuine scale: 5+ cross-functional squads and 40+ onsite and offshore practitioners at ANZ, with a $5M+ program portfolio delivered at 100% compliance to enterprise risk frameworks. Executive workshops I ran for 40+ leaders improved strategic decision clarity by about 55%. Right now I lead one of eight squads on the ATO's Payday Super program. I keep teams shipping by owning the blockers myself — escalations, capacity fights, tooling — rather than delegating the hard conversations.",
      engineering:
        "I lead like an engineer: 5+ squads and 40+ onsite/offshore practitioners at ANZ, but my management tooling is automation, not status meetings. I built a JIRA analytics dashboard (Next.js/Supabase) for sprint velocity and LLM-generated retro insights, and at the ATO I removed my teams' single biggest time sink by automating mainframe test evidence (≈92% effort reduction). Distributed teams work when the delivery system itself is instrumented — that's what I build.",
      story:
        "The thing I learned leading 40+ people across onsite and offshore teams at ANZ is that leadership is mostly about what you remove, not what you add. Every squad has one systemic blocker eating their week — an environment that keeps falling over, evidence capture that takes three hours a pop. I make it my job to find that blocker and kill it. At the ATO that meant personally escalating L2 instability and building the automation that gave eight squads their time back.",
    },
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
      "The one I'd lead with: converting a mathematically infeasible SIT window at the ATO into a delivered outcome. The numbers said 75+ hours of manual test evidence per team against 64 available hours. I architected mainframe test-evidence automation across 200+ scenarios and eight squads that cut effort per scenario from ~3 hours to ~15 minutes (≈92%), built with zero new InfoSec approvals, and got it endorsed through a war room that reached a binding recommendation in under three hours. Close second: sustaining P95 latency under 200 ms across 10,000+ concurrent devices for real-time banking telemetry at ANZ.",
    personaVariants: {
      hiring:
        "Saving a government program's test phase that was mathematically infeasible — 75+ hours of required work against 64 available — by architecting automation that cut effort by 92% across eight squads, with zero new security approvals and executive endorsement secured in under three hours. It demonstrates the three things I'm hired for: diagnosing the real constraint, engineering the fix, and driving the governance to land it.",
      engineering:
        "Technically, the ATO mainframe evidence harness: 200+ SIT/E2E scenarios automated using only pre-approved tools (REXX, SMF, SDSF, PCOMM, PowerShell, VBA), ~3 hours down to ~15 minutes per scenario, built in a six-day tiered plan with a go/no-go gate and four contingency levels. For pure engineering difficulty, though, the ANZ real-time telemetry platform holding P95 under 200 ms at 10,000+ concurrent devices is the one I'd nerd out about.",
      story:
        "There's a moment in every rescue where the room stops believing it's doomed. For me that was the ATO war room — three hours, every discipline at the table, and at the end a binding decision to automate our way out of an impossible 64-hour test window. Six days later the harness was live; three-hour evidence jobs took fifteen minutes. Eight squads got their schedule back. That's the achievement I'd tell at a dinner table.",
    },
  },

  // ── 8. Delivery metrics track record ───────────────────────────────────
  {
    id: 'delivery-metrics',
    keywords: [
      'track record',
      'delivery metrics',
      'results',
      'numbers',
      'measurable',
      'outcomes',
      'kpis',
      'impact',
      'metrics',
      'proof',
    ],
    answer:
      "My track record in numbers: ~92% reduction in test-evidence effort across 200+ scenarios at the ATO; test capacity re-baselined from 30 to up to 90 person-days via an executive change request; Distribution UI delivery steered past 95% completion. At ANZ: P95 latency under 200 ms across 10,000+ concurrent devices, >30% delivery efficiency improvement and >15% infrastructure cost reduction from cloud migration, a $5M+ portfolio at 100% compliance, and ~55% improvement in executive decision clarity. In my AI consulting work, my LLM evaluation stack reduced simulated error-budget breaches by 38%. I measure everything I deliver — it's the only honest way to claim impact.",
  },

  // ── 9. ANZ experience ──────────────────────────────────────────────────
  {
    id: 'anz-experience',
    keywords: [
      'anz',
      'anz bank',
      'anz banking group',
      'at anz',
      'anz experience',
      'work at anz',
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
      'financial services',
      'banks',
      'nab',
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
      "My current engagement is with the Australian Taxation Office, where I'm Scrum Master / Project Manager on the Payday Super reform program — a large federal program running eight squads in parallel. Government delivery has its own physics: my flagship automation there was deliberately built with zero new InfoSec approvals so it could ship inside the security envelope, and my change request carried full options analysis, costed recommendations, and Azure DevOps traceability. My 15+ year career spans government, financial services, and telecommunications, so I'm used to delivering under formal governance.",
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
      'llm',
      'llms',
      'mlops',
    ],
    answer:
      "AI/ML runs through my last decade of work. At ANZ I led delivery of AI/ML solutions including real-time telemetry at P95 under 200 ms across 10,000+ devices. From Jun 2025 to Feb 2026 I ran independent AI consulting: I built a Next.js/Supabase JIRA analytics dashboard with LLM-powered retrospective insights, an LLM evaluation stack (Langfuse + Phoenix) that reduced simulated error-budget breaches by 38%, 'AI Resume Tailor' (NLP + prompt engineering), and 'AI Gmail Manager', an autonomous TypeScript inbox-triage agent. My toolkit covers LLM pipelines (LangChain, Langfuse, Phoenix), MLOps, real-time telemetry, and data architecture — and even back at Microsoft (2015–2016) I delivered a gap analysis for Azure ML telemetry.",
    personaVariants: {
      hiring:
        "I bring practical, shipped AI experience rather than slideware. I led AI/ML solution delivery at ANZ for critical banking services, then spent Jun 2025 – Feb 2026 as an independent AI consultant building production tooling: an LLM evaluation stack that cut simulated error-budget breaches by 38%, an analytics dashboard generating LLM-powered sprint retrospectives, and autonomous LLM agents for resume tailoring and inbox triage. I know how to take AI from prototype to governed, measured production — which is exactly the gap most organisations are struggling with.",
      engineering:
        "Hands-on across the LLM stack: LangChain pipelines, Langfuse + Phoenix for tracing and evals (38% reduction in simulated error-budget breaches), prompt engineering, and autonomous agents in TypeScript ('AI Gmail Manager' does triage, sentiment analysis, and draft generation). Infrastructure side: a Node.js/Express public-key server for API signing with full test coverage, Next.js/Supabase for the JIRA analytics dashboard, plus MLOps and real-time telemetry from the ANZ years (WebSocket, P95 < 200 ms at 10k+ concurrent devices).",
      story:
        "When I left ANZ in mid-2025 after eight years, I gave myself a clear objective: get genuinely hands-on with the LLM era instead of managing it from a distance. Eight months later I'd shipped an eval stack with Langfuse and Phoenix that cut simulated error-budget breaches by 38%, autonomous agents that triage inboxes and tailor resumes, and a dashboard that writes sprint retrospectives with an LLM. The lesson: AI quality is an engineering discipline, not a demo.",
    },
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
      'technologies',
      'programming languages',
      'what languages',
      'tools you use',
      'skills',
      'stack',
      'python',
      'typescript',
      'react',
      'kubernetes',
    ],
    answer:
      "My core stack: Python and TypeScript, with React/Next.js on the front end and Node.js services behind it, backed by Postgres/Supabase. Infrastructure-wise I work across Kubernetes, Docker, and Terraform on GCP, AWS, and Azure, with solid CI/CD and DevOps practice. The unusual entry on the list is mainframe test automation — REXX and JCL — which I used to automate 200+ test scenarios at the ATO. On the AI side: LLM pipelines with LangChain, Langfuse, and Phoenix, plus MLOps and real-time telemetry. D3 rounds it out for data visualisation.",
    personaVariants: {
      hiring:
        "I'm genuinely full-stack: Python, TypeScript, React/Next.js, and cloud-native infrastructure across AWS, GCP, and Azure (Kubernetes, Docker, Terraform), plus AI/LLM pipelines with LangChain, Langfuse, and Phoenix. What makes the profile rare is the range — I've shipped everything from mainframe REXX automation at the ATO to real-time AI telemetry at ANZ. You're hiring someone who can review the architecture and also present it to the steering committee.",
      engineering:
        "Languages: Python, TypeScript (plus REXX and JCL when the mainframe calls). Frontend: React/Next.js, D3 for visualisation, Framer Motion for animation. Backend: Node.js/Express, Postgres/Supabase. Infra: Kubernetes, Docker, Terraform across GCP/AWS/Azure, with CI/CD throughout. AI: LangChain pipelines, Langfuse + Phoenix for evals and observability, MLOps. Recent oddball credit: PCOMM, SDSF, and SMF scripting for ATO mainframe test-evidence capture, glued with PowerShell and VBA.",
      story:
        "My stack tells my career story in layers. The mainframe layer — REXX, JCL, SDSF — from automating government test evidence. The banking layer — .NET/Azure, real-time WebSocket telemetry — from eight years at ANZ. The modern layer — Python, TypeScript, Next.js, Kubernetes, Terraform across three clouds. And the newest stratum: LangChain, Langfuse, and Phoenix from my AI consulting tour. I never deleted a layer; each one keeps paying rent.",
    },
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
      'your certifications',
      'any certifications',
      'are you certified',
      'csm',
      'scrum alliance',
      'credentials',
      'certificate',
      'certs',
      'accreditation',
    ],
    answer:
      "I'm a Certified Scrum Master (CSM) through the Scrum Alliance, which underpins my agile delivery practice across the ATO and previous roles. I'm also currently progressing AWS and GCP cloud certifications to formalise the multi-cloud work I've been doing for years. Beyond certificates, my academic credentials are a Master of Computer Science (Honours) from Monash and a BE in Computer Science from the University of Melbourne.",
  },

  // ── 19. Availability & notice period ───────────────────────────────────
  {
    id: 'availability',
    keywords: [
      'availability',
      'available',
      'are you available',
      'notice period',
      'when can you start',
      'start date',
      'open to work',
      'open to opportunities',
      'looking for work',
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
      "I'm open to new delivery-leadership and AI engagements. I'm currently leading the Australian Taxation Office's Payday Super program as Scrum Master / Project Manager, so a start is a conversation about timing rather than an immediate jump — but the right opportunities are worth planning early. The best way to explore fit is to contact me directly: sarkar.vikram@gmail.com or +61 433 224 556.",
    personaVariants: {
      hiring:
        "I'm open to new roles, especially where AI delivery leadership meets complex programs. I'm currently engaged at the ATO on the Payday Super program, so timing is a conversation rather than an immediate start — but I'd genuinely welcome the discussion early. Reach out directly at sarkar.vikram@gmail.com or +61 433 224 556 and we can talk timing, scope, and fit.",
      engineering:
        "Status: currently committed to the ATO's Payday Super program. That said, I keep an open channel for interesting problems — particularly LLM platforms, delivery automation, and modernisation work. Email sarkar.vikram@gmail.com with what you're building and we'll see if the timelines and the problem are a match.",
      story:
        "Right now my days belong to the ATO and the Payday Super program — there's still a reform to land. But every chapter of my career started as a conversation that happened earlier than the calendar strictly allowed. If you think there's a story worth writing together, email sarkar.vikram@gmail.com or call +61 433 224 556.",
    },
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
      "I work across three engagement models. Advisory: fractional delivery advisor or AI strategy consultant, helping organisations design LLM deployment roadmaps, evaluate vendor tools, or stand up MLOps practices — typically remote with periodic on-site. Embedded delivery lead: joining a program as Scrum Master / Project Manager or AI delivery lead, owning sprint cadence, PI planning, and cross-team coordination — currently what I do for the ATO. Build / hands-on architect: designing and building the system myself — automation harnesses, LLM eval stacks, real-time telemetry dashboards, or AI agents — scoped, priced, and delivered to a measurable outcome. The right model depends on what you're trying to ship. Email sarkar.vikram@gmail.com with a sketch of the need and I'll tell you which model fits.",
    personaVariants: {
      hiring:
        "I offer three engagement models depending on what you need. Advisory: I help teams design their AI delivery roadmap, evaluate tools, or stand up MLOps — fractional, typically remote, highly flexible. Embedded delivery lead: I join your program as Scrum Master / Project Manager — what I'm doing right now at the ATO — owning sprint cadence, PI planning, and cross-squad dependency management. Build / hands-on: I architect and ship the system myself — automation, LLM evals, dashboards — scoped to a measurable outcome. For a permanent role, my experience spans 15+ years across government, banking, and AI consulting with a track record of delivering at scale.",
      engineering:
        "Three models, all evidence-led. Fractional advisory — AI/ML roadmap, vendor evaluation, MLOps setup; I typically run this remote with targeted on-site sessions. Embedded delivery — Scrum Master / PM role owning the full delivery cycle (current ATO engagement is this model). Hands-on build — I write the code (TypeScript/Python), architect the infrastructure (Kubernetes/Docker/Terraform), and ship a measured outcome (92% test-effort reduction is the kind of number I commit to). The model selection is about constraint fit: ask me at sarkar.vikram@gmail.com.",
      story:
        "When someone asks what I do, I point to three things. Sometimes I advise — helping a team see the AI roadmap clearly, picking tools, standing up the MLOps practice. Sometimes I embed — Scrum Master on a government program, owning the cadence, the PI planning, the messy cross-squad dependencies. And sometimes I build — seven days of REXX and PowerShell turning an impossible test deadline into a delivered outcome. The best engagements blend all three. If you know which one you need, email sarkar.vikram@gmail.com and we'll shape the engagement around the outcome.",
    },
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
      'how much',
      'do you charge',
      'how much do you charge',
      'charge',
      'cost',
      'pricing',
      'compensation',
      'pay',
      'budget',
      'fee',
    ],
    answer:
      "Honest answer: it depends entirely on scope — an advisory engagement, a delivery leadership role, and a hands-on build are priced very differently. Rather than quote a number into the void, I'd prefer a short conversation about what you actually need. Email me at sarkar.vikram@gmail.com with a sketch of the engagement and I'll respond with a straight answer.",
  },

  // ── 21. Contact details ────────────────────────────────────────────────
  {
    id: 'contact',
    keywords: [
      'contact',
      'email',
      'email address',
      'phone',
      'phone number',
      'reach you',
      'contact you',
      'get in touch',
      'linkedin',
      'github',
      'contact details',
      'call you',
    ],
    answer:
      "Here's how to reach me: email sarkar.vikram@gmail.com, phone +61 433 224 556, based in Melbourne VIC. You can also find me on GitHub at github.com/Victordtesla24, LinkedIn at linkedin.com/in/vikramd-profile, and YouTube at @vicd0ct. Email is the fastest channel for opportunities and project enquiries.",
  },

  // ── 22. Location & remote/hybrid ───────────────────────────────────────
  {
    id: 'location-remote',
    keywords: [
      'location',
      'where are you based',
      'where do you live',
      'remote work',
      'hybrid',
      'work from home',
      'relocate',
      'melbourne',
      'australia',
      'timezone',
      'remote',
      'onsite work',
    ],
    answer:
      "I'm based in Melbourne, VIC, Australia, and I'm comfortable across onsite, hybrid, and remote arrangements. Distributed delivery is something I've practised at scale — at ANZ I led 40+ practitioners split across onsite and offshore teams, so I know how to keep cadence, quality, and communication tight when the team isn't in one room. For the right engagement, the working model is a conversation, not a blocker.",
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
      "Because I close the gap most organisations struggle with: I have 15+ years of delivery leadership and the engineering depth to personally fix what's blocking delivery. At the ATO I didn't just report that the test window was infeasible — I architected the automation that made it feasible, cutting effort 92% with zero new security approvals. At ANZ I led a $5M+ portfolio and 40+ practitioners while owning the technical vision for cloud modernisation. And I bring current, hands-on AI capability — LLM pipelines, evaluation stacks, autonomous agents — not just AI strategy slides. I measure everything, so you'll always know what you're getting.",
    personaVariants: {
      hiring:
        "Three reasons. First, proven outcomes at scale: 92% test-effort reduction at the ATO, >30% delivery efficiency gains at ANZ, a $5M+ portfolio at 100% compliance. Second, range: I'm credible with executives, engineers, and auditors in the same week — I write the change request and the REXX script. Third, currency: while many delivery leaders watched the AI wave, I spent eight months hands-on building LLM evaluation stacks and autonomous agents. You get a leader who de-risks delivery because he can see all the way down.",
      engineering:
        "Because I'm the delivery lead who won't make you explain why the build is red. I've shipped real-time telemetry at P95 under 200 ms for 10k+ devices, automated a mainframe test estate with REXX/SDSF/SMF, and built LLM eval pipelines with Langfuse and Phoenix. I translate engineering reality into executive decisions without distorting it in either direction — and when something's truly stuck, I'm one of the people who can sit down and unstick it.",
      story:
        "Every organisation I've joined had a problem everyone had agreed was unsolvable — the infeasible test window at the ATO, the latency ceiling at ANZ. My pattern is the same each time: refuse the framing, find the constraint that actually binds, engineer around it, and bring the decision-makers along with numbers. Fifteen years in, that pattern has never failed to pay for itself. Hire me for the problem your team has stopped arguing about because they've accepted it.",
    },
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
      "This site is built with Next.js 14 and React 18 in TypeScript, animated with Framer Motion, with the starfield background rendered in React Three Fiber. It's deployed as a static export on Firebase — no server to maintain. I (MiniVic) answer with a Gemini-powered brain grounded strictly in a curated knowledge base of verified facts, and if the model is ever unreachable I fall back to deterministic keyword matching over the same facts, so I never go dark and never invent anything.",
    personaVariants: {
      hiring:
        "The site itself is a portfolio piece: Next.js 14, React 18, TypeScript, Framer Motion animations, and a React Three Fiber starfield, shipped as a static export on Firebase. The clever bit is me — MiniVic answers through a Gemini-grounded brain locked to a curated fact base, with a deterministic offline fallback, so there's no server to run and no invented claims. It shows how Vikram thinks: maximum effect, minimum operational surface.",
      engineering:
        "Stack: Next.js 14 (static export), React 18, strict TypeScript, Framer Motion for animation, React Three Fiber for the WebGL starfield, hosted on Firebase. MiniVic is a tiered brain: a direct Gemini generateContent call from the browser with a system prompt grounded in a typed knowledge base (KnowledgeEntry[]), degrading to a deterministic scorer — tokenize the query, score keyword hits (phrases 3 points, single words 1), return the best entry above threshold. No backend, no hallucination surface beyond the fact base.",
      story:
        "Vikram wanted a portfolio that could answer questions at 2 a.m. without running a server. So he built this: Next.js 14 and React 18 statically exported to Firebase, a starfield in React Three Fiber, Framer Motion easing everything into place — and me, MiniVic, a Gemini-grounded brain locked to a hand-written fact base, with a keyword-matching fallback for when the network is against us. It's the ATO automation philosophy applied to his own website: engineer the constraint away.",
    },
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
      "The combination of engineering depth and executive communication. Plenty of people can write REXX automation or run a war room or author an executive change request — almost nobody does all three in the same fortnight, which is literally what I did at the ATO. I can hold P95 latency budgets and person-day capacity models in the same head, then explain both to a steering committee in plain language. That dual fluency is why my escalations land, my change requests get approved, and my teams trust the plan.",
    personaVariants: {
      hiring:
        "Most candidates are either delivery leaders who need engineers to tell them what's possible, or engineers who need someone else to carry the message upstairs. I'm the rare both: I authored the executive change request that re-baselined test capacity from 30 to 90 person-days, and I architected the mainframe automation it depended on. You're not hiring a translator between business and engineering — you're hiring someone fluent as a native in both.",
      engineering:
        "I'm the person who can defend your architecture in the steering committee without dumbing it down or hiding the trade-offs. My range is genuinely unusual — REXX on z/OS through React Three Fiber on the web, LLM evals with Langfuse/Phoenix, P95 latency engineering at banking scale — but the differentiator is that I convert that depth into decisions executives can actually make. Engineers get a leader who understands them; executives get telemetry they can trust.",
      story:
        "Early in my career I noticed the same tragedy in every organisation: the engineers who knew the truth couldn't get it heard, and the leaders who could be heard didn't know the truth. I decided to be the person who closes that loop. Fifteen years on, it's my signature — the war room where sceptical specialists and anxious executives reached one binding decision in under three hours happened because someone in the room spoke both languages fluently.",
    },
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
      'telstra',
      'infocentric',
      'myob',
      'early career',
      'career history',
      'work history',
      'before anz',
      'business analyst',
      'background',
      'career path',
    ],
    answer:
      "My career spans 15+ years across government, financial services, and telecommunications. Before the banking years (NAB 2016–2017, ANZ 2017–2025) I was Lead Business Analyst at Microsoft in Sydney (Oct 2015 – Oct 2016), where I delivered a gap analysis for Azure ML telemetry that improved system reliability and reduced incident resolution time. Earlier: Business Analyst / Project Coordinator at Telstra (2014–2015) building customer journey scorecards, Senior Business Analyst at InfoCentric (2011–2014) delivering analytics and BI projects including automated regulatory reporting, and developer support, testing, and analysis at MYOB (2010–2011). It's a deliberate arc — from analysing systems, to delivering them, to leading the people and programs that build them.",
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
      "I offer three main service areas, all backed by 15+ years of measured delivery. First, AI/ML Solutions Architecture — I design and deliver LLM pipelines (LangChain, Langfuse, Phoenix), evaluation stacks, autonomous agents, and real-time telemetry platforms drawing on my experience shipping AI at ANZ and as an independent consultant. Second, Agile Program Delivery — I lead squads through complex government and enterprise programs, owning sprint cadence, PI planning, capacity management, and executive reporting, with a track record that includes steering a high-visibility government reform past 95% delivery completion. Third, Delivery Automation — I build the tooling that removes systemic friction from your delivery pipeline, whether that's mainframe test-evidence harnesses (92% effort reduction at the ATO), CI/CD instrumentation, or LLM-powered analytics dashboards. Every engagement is grounded in measured outcomes, not slideware.",
    personaVariants: {
      hiring:
        "My services break into three pillars, all measured. AI/ML Solutions: LLM pipeline architecture, evaluation stacks (Langfuse/Phoenix), autonomous agents, and real-time telemetry. Agile Delivery: I run squads through complex programs — sprint cadence, PI planning, capacity management, and governance — having led a $5M+ portfolio at ANZ and currently delivering for the ATO. Delivery Automation: I build the tooling that removes friction permanently — the ATO evidence harness cut effort 92%, and my JIRA analytics dashboard gives execs real sprint telemetry. I measure everything I deliver, so you'll know what you're getting.",
      engineering:
        "Three services, each with shipped proof. AI Architecture: LLM pipelines with LangChain/Langfuse/Phoenix, real-time telemetry (WebSocket, P95 under 200 ms at 10k+ devices), MLOps, and autonomous TypeScript agents — I built the eval stack that cut simulated error-budget breaches 38%. Delivery Leadership: I run squads at scale (5+ cross-functional, 40+ practitioners, $5M+ portfolio) following SAFe/PI planning cadence with full Azure DevOps traceability. Automation Engineering: REXX/mainframe harnesses, CI/CD instrumentation, and analytics dashboards — I automate the constraints that make delivery infeasible. I'm the person who writes the change request and the script.",
      story:
        "Every client I work with has a problem they've accepted as unsolvable — a test window that's mathematically infeasible, a platform that can't hit its latency budget. My offering is simple: I find the real constraint, engineer around it, and bring the decision-makers along with numbers. Sometimes that looks like AI architecture (LLM pipelines, eval stacks, autonomous agents), sometimes program delivery (squads, PI planning, governance), and sometimes automation (mainframe harnesses, CI/CD tooling). The common thread: measured outcomes, not slideware.",
    },
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
      "My engagement model starts with a conversation — not a sales pitch. Email me at sarkar.vikram@gmail.com with a sketch of what you need (scope, timeline, the problem you're solving) and I'll respond with a straight answer about fit, approach, and timing. I'm comfortable across advisory engagements, delivery leadership roles, and hands-on builds — the scope and pricing vary accordingly. Every engagement produces measured outcomes, and I'm happy to structure around deliverables or time-and-materials depending on what gives you the most confidence. Based in Melbourne, I work onsite, hybrid, or remote depending on what the engagement needs.",
    personaVariants: {
      hiring:
        "The starting point is a conversation — email me at sarkar.vikram@gmail.com with an outline of the role or engagement you have in mind. I'll respond with a candid read on fit and timing. I'm currently delivering for the ATO's Payday Super program, so my availability is a conversation rather than an immediate start, but the right opportunities are worth planning early. I work across advisory, delivery leadership, and hands-on builds; scope and structure follow from what you actually need.",
      engineering:
        "Start with a technical brief — email sarkar.vikram@gmail.com with the problem you're trying to solve and the constraints you're working within. I'll respond with an honest read on approach, architecture, and timeline. I structure engagements around deliverables or time-and-materials, whichever gives you the cleaner risk profile. Currently committed to the ATO but open to discussing upcoming work — the best architectures get designed before the clock is ticking.",
      story:
        "Every engagement I've ever taken started the same way: someone emailed me with a problem. Not a job description, not an RFP — a problem. Email sarkar.vikram@gmail.com with yours, and I'll reply with what I think. We'll figure out scope, structure, and timing from there. I'm based in Melbourne but work onsite, hybrid, or remote — the working model follows the work, not the other way around.",
    },
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
      "My AI architecture philosophy is: measure everything, degrade gracefully, and never ship a black box. I build LLM pipelines with LangChain for orchestration, Langfuse for tracing, and Phoenix for observability — my evaluation stack reduced simulated error-budget breaches by 38%. For real-time systems I use WebSocket telemetry with defined latency budgets (I held P95 under 200 ms across 10,000+ concurrent devices at ANZ). Every AI component has a deterministic fallback — the same principle behind this chatbot, which uses Gemini grounded in a curated knowledge base with a local keyword-matching fallback so it never hallucinates. On the infrastructure side I work with Kubernetes, Docker, and Terraform across GCP, AWS, and Azure, with CI/CD throughout. The architecture is always shaped by the constraint: at the ATO, the constraint was zero new InfoSec approvals, so I built the mainframe automation entirely from already-approved tools. Different constraint, different architecture — same principle.",
    personaVariants: {
      hiring:
        "I architect AI systems the way I deliver programs: measured, governed, and grounded in constraints. My LLM stack is LangChain for pipelines, Langfuse for tracing, Phoenix for observability — and I validate every component against error budgets (38% breach reduction in my evaluation stack). For real-time AI I define latency budgets upfront — at ANZ that meant P95 under 200 ms across 10,000+ concurrent devices. The non-negotiable is deterministic fallback: every AI surface degrades to a known-good path, which is how this chatbot works — Gemini grounded in a curated fact base, with a local matcher behind it. Infrastructure is Kubernetes, Docker, Terraform across GCP/AWS/Azure, all CI/CD automated.",
      engineering:
        "Stack: LangChain pipelines with Langfuse tracing and Phoenix observability on the LLM side. Real-time: WebSocket telemetry with P95 latency budgets (proven at 10k+ concurrent, sub-200 ms). Deterministic fallback everywhere — Gemini → keyword matcher with a typed KnowledgeEntry[] base, so the system never fabricates. Infra: Kubernetes, Docker, Terraform across GCP/AWS/Azure, CI/CD throughout. My eval stack (Langfuse + Phoenix) reduced simulated breaches 38%. The pattern: instrument first, ship with a safety net, measure continuously. Same approach whether it's a chatbot, a telemetry platform, or a mainframe harness built from REXX and SDSF inside a zero-new-approvals constraint.",
      story:
        "The lesson from 15 years of building systems is that architecture isn't about the prettiest diagram — it's about what survives contact with reality. At ANZ that meant defining a P95 latency budget and holding it at 200 ms across 10,000+ devices. At the ATO it meant building a mainframe automation harness from tools InfoSec had already approved, because the real constraint wasn't technical — it was procurement. My AI architecture follows the same rule: LangChain for pipelines, Langfuse and Phoenix for visibility, and always, always a deterministic fallback so nothing ships as a black box. The stack changes with the constraint. The principle doesn't.",
    },
  },
];

/** Minimum score required for matchKnowledge to return an entry. */
const MATCH_THRESHOLD = 2;
/** Points awarded when a multi-word keyword phrase appears in the query. */
const PHRASE_POINTS = 3;
/** Points awarded when a single-word keyword appears in the query. */
const WORD_POINTS = 1;

/** Lowercase a string and collapse all non-alphanumeric runs to single spaces. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Deterministic, dependency-free keyword matcher.
 *
 * Scoring: the query is lowercased and tokenized; for each entry, every
 * multi-word keyword phrase found in the query scores 3 points and every
 * single-word keyword found among the query tokens scores 1 point. The
 * highest-scoring entry is returned if its score meets the threshold of 2;
 * otherwise null (callers should fall back to FALLBACK_ANSWER). Ties resolve
 * to the earlier entry in knowledgeBase, so results are fully deterministic.
 */
export function matchKnowledge(query: string): KnowledgeEntry | null {
  const normalized = normalize(query);
  if (normalized.length === 0) {
    return null;
  }

  const paddedQuery = ` ${normalized} `;
  const tokens = new Set<string>(normalized.split(' '));

  let best: KnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of knowledgeBase) {
    let score = 0;

    for (const rawKeyword of entry.keywords) {
      const keyword = normalize(rawKeyword);
      if (keyword.length === 0) {
        continue;
      }

      if (keyword.includes(' ')) {
        // Multi-word phrase: must appear as a whole-word sequence in the query.
        if (paddedQuery.includes(` ${keyword} `)) {
          score += PHRASE_POINTS;
        }
      } else if (tokens.has(keyword)) {
        score += WORD_POINTS;
      }
    }

    // Strict > keeps the first (earlier) entry on ties — deterministic output.
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return bestScore >= MATCH_THRESHOLD ? best : null;
}
