# 01 — Employer expectations applied to MiniVic

Run `v9-20260904T2312Z` · generated 2026-09-05 · read-only research sub-agent.

**Fact policy.** Every fact in the proposed copy traces to /root/forgotten-mistory/app/data/siteContent.ts (read this session). The brief's mention of the job-fit engine 'aether-job-career-agent' is NOT in siteContent.ts and is therefore excluded from all proposed copy.

## Inputs read

- **siteContent** — /root/forgotten-mistory/app/data/siteContent.ts (564 lines, full read)
- **miniVicKnowledge_1_40** — /root/forgotten-mistory/app/data/miniVicKnowledge.ts lines 1-40 — FALLBACK_ANSWER and GREETING {hiring, engineering, story}
- **MiniVicBot_100_150** — /root/forgotten-mistory/components/MiniVicBot.tsx lines 100-150 — PERSONA_MODES keys recruiter/engineer/story (labels 'Hiring Fit', 'Engineering', 'Story') and five QUICK_PROMPTS
- **audit_BANNED** — /root/forgotten-mistory/scripts/validate/overhaul_static_audit.mjs lines 50-59 — TC-NFR-TONE list: world-class, best-in-class, ninja, guru, rockstar, unparalleled, revolutionary, cutting-edge, passionate, industry-leading, market-leading, world-leading, leading expert, exceptional, amazing, genius, visionary, unmatched, second to none, game-changing, commander, fleet, mission, decorated, squadron, sci-fi, star wars, star trek, starship, jedi
- **Config_5_1** — /root/forgotten-mistory/docs/avatar/Config.md §5.1 lines 290-295 — banned register: sorry, apolog*, I'm just, I'm only, unfortunately, I'm afraid, disclaimer, I can't really, I'm not an expert, hopefully, I might be wrong, please forgive, bear with me, to be honest, I hope this helps
- **Config_1_4_and_header** — /root/forgotten-mistory/docs/avatar/Config.md lines 10-16 and 44-50 — ElevenLabs tier reports can_use_instant_voice_cloning:false → 401 ivc_not_permitted; deployed MP3 is 12.356 s, eleven_turbo_v2
- **greeting_script** — /root/forgotten-mistory/scripts/generate-cloned-greeting.ts line 26-27 — GREETING_TEXT of the deployed MP3

## Findings

| Tag | Claim | Source |
|---|---|---|
| Inferred | Indeed's interview guidance recommends a 'present, past, future' (or past-present-future) formula for 'tell me about yourself': present = current role and recent accomplishments; past = relevant roles, a key quantifiable achievement; future = why this role is the next step. | https://www.indeed.com/career-advice/interviewing/interview-question-tell-me-about-yourself and https://www.indeed.com/career-advice/interviewing/words-and-adjectives-to-describe-yourself (direct fetch returned HTTP 403; wording obtained via Perplexity retrieval of the page this session) |
| Verified | SEEK (Australia) career advice, quoting interview coach Leah Lambart: the answer should lead with current professional title and years of experience, then the most relevant experience, transferable skills and standout achievements, then why this role; do not recount the whole career history; interviewers often decide in the first few minutes. | https://www.seek.com.au/career-advice/article/how-to-answer-so-tell-me-about-yourself (fetched this session, steps 1-3 and 'Common mistakes' section) |
| Inferred | Ladders Inc. 2018 eye-tracking study: recruiters spend an average of 7.4 seconds on an initial resume screen (up from ~6 s in the 2012 study); the two-stage method combined a timed selection exercise with laboratory eye-tracking. | https://www.theladders.com/static/images/basicSite/pdfs/TheLadders-EyeTracking-StudyC2.pdf (direct fetch blocked by robots.txt 403; figure and method obtained via Perplexity retrieval of the PDF; secondary confirmation https://www.hrdive.com/news/eye-tracking-study-shows-recruiters-look-at-resumes-for-7-seconds/541582/) |
| Verified | EU AI Act Article 50(1): providers of AI systems intended to interact directly with natural persons must ensure those persons are informed they are interacting with an AI system, unless obvious to a reasonably well-informed, observant and circumspect person. Applies from 2 August 2026. | https://artificialintelligenceact.eu/article/50/ (fetched this session) |
| Verified | European Commission FAQ on Article 50: chatbots, AI agents and avatars are in scope; people must be notified 'from the start of the first interaction in a clear and distinguishable manner', so they can 'calibrate their trust in the content accordingly'. | https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act (fetched this session) |
| Assumed | Luo et al. (2019), 'Machines vs. Humans: The Impact of AI Chatbot Disclosure on Customer Purchases', Management Science — the standard experimental reference on disclosure timing; the exact effect sizes were not retrievable this session and are not quoted. | https://doi.org/10.1287/mnsc.2018.3093 (not fetched; DOI only) |
| Verified | No LinkedIn Talent Solutions, Indeed Hiring Lab, Gallup, CIPD or AHRI primary statistic on introduction content was retrievable within the fetch budget; no callback-rate percentage for quantified achievements is claimed in this document. | Two Perplexity queries this session returned no primary URL for these organisations on this topic; LinkedIn pages are blocked to autonomous fetch by robots.txt |
| Verified | The current hiring greeting opens with the disclosure and a hedge ('if I do not have it on file, I will say so rather than guess') and names no role, location, availability or number; the engineering greeting opens 'Hey, MiniVic here'; the story greeting opens 'Pull up a chair'. None states availability or a measured result in the first sentence. | /root/forgotten-mistory/app/data/miniVicKnowledge.ts lines 30-37 |
| Verified | Current QUICK_PROMPTS ask about an 'enterprise AI delivery role', an 'AI telemetry platform in a bank', 'real-time dashboards', 'services & rates' and 'large distributed teams'; none asks about availability, location, the ATO role, or a measured result — the items siteContent.ts positions first (hero.title, hero.availability, contact.headline). | /root/forgotten-mistory/components/MiniVicBot.tsx lines 118-144; /root/forgotten-mistory/app/data/siteContent.ts hero and contact objects |
| Verified | The deployed greeting MP3 (public/assets/minivic-greeting.mp3, 12.356 s, eleven_turbo_v2) speaks a fixed sentence beginning 'Hi, I'm Mini Vic — Vikram's AI clone. I can answer questions about his experience delivering AI programs...'. It cannot be regenerated in Vikram's cloned voice: the ElevenLabs account tier reports can_use_instant_voice_cloning:false and text-to-speech returns 401 ivc_not_permitted on any key; architecture as of 2026-09-04 is OpenRouter-only and OpenRouter exposes no TTS models. | /root/forgotten-mistory/scripts/generate-cloned-greeting.ts lines 26-27; /root/forgotten-mistory/docs/avatar/Config.md lines 10-16, 44-50, §1.4a |
| Verified | siteContent.ts positions Vikram as 'Scrum Master / Project Manager · Technical Delivery Leader', Melbourne, 'Actively exploring Scrum Master and delivery-leadership roles in Melbourne', contact headline 'Open to Scrum Master / Project Manager roles in Melbourne — and selected AI delivery engagements.' | /root/forgotten-mistory/app/data/siteContent.ts hero and contact objects |

## 1. Three principles

### P1 — Present first, then one measured past result, then what next

Open with the current title, employer and location, then a single quantified achievement, then the role sought. This is the Indeed present-past-future formula and SEEK's three-step formula; SEEK adds that interviewers decide within the first few minutes, so the first sentence carries the decision.

**Applied to MiniVic:** Every greeting's first sentence after the disclosure clause names the ATO Scrum Master / Project Manager role and Melbourne availability (hiring), the latest shipped result (engineering) or the latest chapter (story).

Citations:
- https://www.indeed.com/career-advice/interviewing/interview-question-tell-me-about-yourself
- https://www.seek.com.au/career-advice/article/how-to-answer-so-tell-me-about-yourself

### P2 — Numbers the reader can check, not adjectives

Recruiters' initial screen averages 7.4 seconds (Ladders 2018), so the introduction must carry the load-bearing figures a scanner would look for: title, years, employer names, one or two measured outcomes. Superlatives are excluded by the site's own tone gate (TC-NFR-TONE) and Config.md §5.2 ('numbers over adjectives').

**Applied to MiniVic:** Each greeting carries at most three figures drawn from siteContent.ts (sixteen years; $5M+ / 40+; 200+ scenarios ≈92%; P95 <200 ms / 10,000+ devices) and zero words from the BANNED list.

Citations:
- https://www.theladders.com/static/images/basicSite/pdfs/TheLadders-EyeTracking-StudyC2.pdf
- /root/forgotten-mistory/scripts/validate/overhaul_static_audit.mjs lines 50-59
- /root/forgotten-mistory/docs/avatar/Config.md §5.2

### P3 — Disclose the AI in one clause at the first turn, then stop talking about it

EU AI Act Art. 50(1) and the Commission FAQ require that a person be told they are interacting with an AI system from the start of the first interaction, clearly, so they can calibrate trust. The disclosure is one clause, not a paragraph, and it is not followed by hedging or apology (Config.md §5.1 bans 'sorry', 'unfortunately', 'I'm afraid', 'disclaimer', 'hopefully').

**Applied to MiniVic:** Every greeting and the spoken script contain exactly one clause 'his AI clone' / 'my AI clone speaking'; the fallback answer states the boundary of the knowledge base as a fact and redirects, with no apology.

Citations:
- https://artificialintelligenceact.eu/article/50/
- https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act
- /root/forgotten-mistory/docs/avatar/Config.md §5.1

## 2. Proposed greetings (≤60 words, first person as Vikram's clone, one disclosure clause)

**hiring**

> I'm Vikram — his AI clone, speaking from his CV. I'm Scrum Master / Project Manager on the ATO's Payday Super program and open to Scrum Master and delivery-leadership roles in Melbourne. Sixteen years across government, finance and telecommunications; at ANZ I ran a $5M+ portfolio across 40+ practitioners. Ask about availability, the ATO work, or how I lead.

Traces: experience[ato].role, .company, .dates (March 2026 - Present); hero.availability / contact.headline (Scrum Master, delivery-leadership, Melbourne); hero.subtitle (sixteen years across government, finance, and telecommunications); experience[anz].bullets[2] ($5M+ portfolio, 40+ onsite and offshore practitioners)

**engineering**

> I'm Vikram — his AI clone, answering from his CV and repositories. Latest build: ATO mainframe test-evidence automation, 200+ SIT scenarios cut from ~3 hours to ~15 minutes each (≈92%) with REXX, SMF and SDSF and zero new InfoSec approvals. At ANZ: WebSocket telemetry holding P95 under 200 ms across 10,000+ devices. Ask about the stack, LLM evals, or trade-offs.

Traces: experience[ato].bullets[1] (200+ SIT/E2E scenarios, ~3 hours to ~15 minutes, ≈92%, REXX/SMF/SDSF, zero-new-approvals); projectionDimensions[depth] (zero new InfoSec approvals); experience[anz].bullets[0] (WebSocket telemetry, P95 under 200 ms, 10,000+ concurrent devices); skillGroups[ai-ml] (LLM Pipelines — Langfuse, Phoenix)

**story**

> I'm Vikram — his AI clone, telling it the way he would. Latest chapter: a SIT window needing 75+ hours of manual evidence against 64 available, closed by a six-day harness build and a war room that produced a binding recommendation in under three hours. Sixteen years of those, MYOB in 2010 to the ATO now. Ask for one.

Traces: experience[ato].bullets[2] (75+ hours vs 64 available, six-day tiered harness build); experience[ato].bullets[3] (war room, binding recommendation in under three hours); synthesisSources[resume].tracedFact / projectionDimensions[longevity] (MYOB 2010 through to the ATO)

## 3. Quick prompts (ordered by employer priority; #6 is for business clients)

| # | Audience | Label (chars) | Full question | mode | Why |
|---|---|---|---|---|---|
| 1 | employer | `Available when, and where?` (26) | What roles are you open to right now, and are you based in Melbourne? | recruiter | Ladders eye-tracking: title, current employer, dates and location are the first fixation points; siteContent hero.availability answers it directly. |
| 2 | employer | `Biggest measured result` (23) | What is the biggest measured result you have delivered, and how was it measured? | recruiter | P2 — one checkable number (≈92% across 200+ ATO scenarios, or $5M+ at 100% compliance). |
| 3 | employer | `Day to day at the ATO` (21) | What do you own day to day on the ATO Payday Super program? | recruiter | Indeed/SEEK 'present' step — current responsibilities: sprint cadence, PI planning 47-48, capacity, executive reporting. |
| 4 | employer | `How you run a squad` (19) | How do you run sprint cadence, PI planning and executive reporting across a squad? | recruiter | Scrum Master / PM competency the hero title leads with. |
| 5 | employer | `First two weeks in the role` (27) | For a Scrum Master or delivery-lead role, what would you do in the first two weeks? | recruiter | Time-to-value; replaces the existing 'Fit me to a role' prompt which names an 'enterprise AI delivery role' that is not the hero positioning. |
| 6 | business client | `Engagements you take on` (23) | What AI delivery engagements do you take on, and what has one produced before? | recruiter | contact.headline 'selected AI delivery engagements'; answerable with the Langfuse + Phoenix evaluation stack (−38% simulated error-budget breaches) and the Next.js/Supabase JIRA dashboard. |

## 4. Proposed FALLBACK_ANSWER (≤45 words)

> That is outside my knowledge base, which is built from Vikram's CV and repositories. Ask him directly: sarkar.vikram@gmail.com or +61 433 224 556. On file here: the ATO Payday Super work, the 92% evidence-automation cut, ANZ telemetry, leadership style, stack, and availability.

## 5. Spoken introduction script (12-16 s, ≤45 words)

> I'm Vikram — this is my AI clone speaking. I lead delivery on the ATO's Payday Super program, after eight years at ANZ running a five-million-dollar portfolio. Sixteen years across government, finance and telecommunications. Open to Scrum Master and delivery-leadership roles in Melbourne. Ask me anything.

Traces: experience[ato].role/company; experience[anz].dates Sept 2017 - Jun 2025 (nearly 8 years, projectionDimensions[longevity]); experience[anz].bullets[2] ($5M+); hero.subtitle (sixteen years); hero.availability

**Existing MP3.** public/assets/minivic-greeting.mp3 (12.356 s) speaks a different fixed sentence: 'Hi, I'm Mini Vic — Vikram's AI clone. I can answer questions about his experience delivering AI programs, leading squads, and architecting platforms. Ask me anything about his work at the ATO, ANZ, or the open-source projects on his GitHub. What would you like to know?' It cannot be regenerated in Vikram's cloned voice on the current ElevenLabs tier (can_use_instant_voice_cloning:false → 401 ivc_not_permitted; Config.md lines 12-13). Any new spoken intro is either a HeyGen built-in voice via OpenRouter (voice_is_cloned:false, advisory VOICE-1) or waits for a tier change — a paid decision the owner must make (CLAUDE.md cost gate).

## Compliance check (script-verified this session by check-and-render.mjs)

| Text | Words | Limit | Result | Banned hits (TC-NFR-TONE + Config §5.1 + brief) | "AI clone" clauses |
|---|---|---|---|---|---|
| hiring | 57 | 60 | pass | none | 1 |
| engineering | 59 | 60 | pass | none | 1 |
| story | 58 | 60 | pass | none | 1 |
| fallback | 42 | 45 | pass | none | 0 |
| spoken | 45 | 45 | pass | none | 1 |

Quick-prompt labels: 26, 23, 21, 19, 27, 23 characters — all ≤28.

## Open points for the owner

- PERSONA_MODES keys are recruiter/engineer/story in MiniVicBot.tsx but GREETING keys are hiring/engineering/story in miniVicKnowledge.ts — the implementer must map them; not changed here (read-only agent).
- SEEK's step 3 recommends stating why this employer; a static greeting cannot know the employer, so the greetings end with an offer of what to ask instead.
- Two Indeed URLs and the Ladders PDF are blocked to autonomous fetch; the implementer or reviewer can open them in a browser to upgrade the two 'Inferred' findings to 'Verified'.
