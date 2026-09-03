# T-37 · Baseline Inventory of the Audited Live Site

> Machine-diffable record of the Preservation Register as it renders on production.
> Contract: **R-165 … R-171** · **SC-87.1** · test **T-37** · **Gate R**.
> Every value below was read from the live page by Playwright. Nothing is inferred; anything not observable is written as *not observable*.

| | |
|---|---|
| Target | `https://forgotten-mistory.web.app/` |
| Run id | `v6-20260903T195241Z` |
| Captured (UTC) | `2026-09-03T20:03:42.936Z` |
| Document title | Vikram Deshpande — Scrum Master / Project Manager · AI Solutions Architect |
| Tool | Playwright (chromium, channel:'chrome'), v1.57.0 |
| Viewports | desktop 1440×900 · mobile 390×844 |
| Screenshots | `docs/delivery/evidence/v6-20260903T195241Z/T37-baseline-shots` (15 files) |

Procedure: navigate → first-rAF snapshot → load → 2.5 s settle → scroll each section into view (2.2 s dwell each) → extract → expand every Experience role → re-extract; a separate javaScriptEnabled:false pass captured the no-JS render.

---

## 1 · Every metric, with its provenance label

Caliper states rendered on this baseline: `open`, `self-reported`.

Provenance gloss strings observed verbatim:
- “Computed from the role, not the candidate; answered as what he looks for.”
- “Not measurable; reason given.”
- “Self-reported figure.”

> **Not observable on this baseline:** Measured; source given. — the 'sourced' caliper state is defined in the component but no element on the live page currently renders it

The gloss is delivered as a screen-reader-only span inside the mark (`position: absolute`, 1px box) — it is announced, not printed. Desktop count **15**, mobile count **15**; desktop/mobile value parity: **True**.

Hero grading line: “◐ self-reported, from my CV. Repository figures below are harvested and dated.”

| # | Section | Caliper state | Visible value | Provenance gloss | Context | Selector |
|---|---|---|---|---|---|---|
| 1 | `hero` | `self-reported` | ≈92% | Self-reported figure. | ≈92% (Self-reported figure.)evidence effort removedATO Payday Super · 200+ SIT scenarios | `#hero > div.Hero_inner__2iGTj:nth-of-type(2) > div.Hero_ledgerRow__UJeSu:nth-of-type(1) > ul.Hero_ledger__T0DjZ > li.Hero_ledgerItem__FffnS:nth-of-type(1) > span.Caliper_caliper__w4oUs.Hero_ledgerValue__bBHSS:nth-of-type(1)` |
| 2 | `hero` | `self-reported` | $5M+ | Self-reported figure. | $5M+ (Self-reported figure.)program portfolio ledANZ · 5+ squads, 40+ practitioners | `#hero > div.Hero_inner__2iGTj:nth-of-type(2) > div.Hero_ledgerRow__UJeSu:nth-of-type(1) > ul.Hero_ledger__T0DjZ > li.Hero_ledgerItem__FffnS:nth-of-type(2) > span.Caliper_caliper__w4oUs.Hero_ledgerValue__bBHSS:nth-of-type(1)` |
| 3 | `hero` | `self-reported` | 10k+ | Self-reported figure. | 10k+ (Self-reported figure.)devices at P95 < 200 msANZ · real-time telemetry platform | `#hero > div.Hero_inner__2iGTj:nth-of-type(2) > div.Hero_ledgerRow__UJeSu:nth-of-type(1) > ul.Hero_ledger__T0DjZ > li.Hero_ledgerItem__FffnS:nth-of-type(3) > span.Caliper_caliper__w4oUs.Hero_ledgerValue__bBHSS:nth-of-type(1)` |
| 4 | `about` | `open` | measured from the role | Computed from the role, not the candidate; answered as what he looks for. | Salary Fitmeasured from the role (Computed from the role, not the candidate; answered as what he looks for.) | `#about > div.About_inner__s8EsR > div.About_body__cuZQw > ol.About_list__aJ6X9 > li.About_item__fSusw:nth-of-type(6) > div.About_itemBody__sd_yL > h3.About_name__Ytdnm > span.Caliper_caliper__w4oUs.About_sideTag__gGn7_` |
| 5 | `about` | `open` | measured from the role | Computed from the role, not the candidate; answered as what he looks for. | Location Matchmeasured from the role (Computed from the role, not the candidate; answered as what he looks … | `#about > div.About_inner__s8EsR > div.About_body__cuZQw > ol.About_list__aJ6X9 > li.About_item__fSusw:nth-of-type(7) > div.About_itemBody__sd_yL > h3.About_name__Ytdnm > span.Caliper_caliper__w4oUs.About_sideTag__gGn7_` |
| 6 | `about` | `open` | measured from the role | Computed from the role, not the candidate; answered as what he looks for. | Company Stabilitymeasured from the role (Computed from the role, not the candidate; answered as what he loo… | `#about > div.About_inner__s8EsR > div.About_body__cuZQw > ol.About_list__aJ6X9 > li.About_item__fSusw:nth-of-type(9) > div.About_itemBody__sd_yL > h3.About_name__Ytdnm > span.Caliper_caliper__w4oUs.About_sideTag__gGn7_` |
| 7 | `experience` | `self-reported` | ≈92% | Self-reported figure. | ≈92% (Self-reported figure.)evidence effort removed across 200+ SIT scenarios | `#role-ato > p.Experience_roleHeadline__ol121 > span.Caliper_caliper__w4oUs.Experience_roleHeadlineValue__BC6J9:nth-of-type(1)` |
| 8 | `experience` | `self-reported` | −38% | Self-reported figure. | −38% (Self-reported figure.)error-budget breaches — measured against a simulated budget, not live traffic | `#role-independent > p.Experience_roleHeadline__ol121 > span.Caliper_caliper__w4oUs.Experience_roleHeadlineValue__BC6J9:nth-of-type(1)` |
| 9 | `experience` | `self-reported` | 10k+ | Self-reported figure. | 10k+ (Self-reported figure.)concurrent devices at P95 under 200 ms | `#role-anz > p.Experience_roleHeadline__ol121 > span.Caliper_caliper__w4oUs.Experience_roleHeadlineValue__BC6J9:nth-of-type(1)` |
| 10 | `experience` | `open` | no published figure | Not measurable; reason given. | no published figure (Not measurable; reason given.) | `#role-nab > p.Experience_roleHeadline__ol121 > span.Caliper_caliper__w4oUs.Experience_roleHeadlineOpen__1FiOr` |
| 11 | `experience` | `open` | no published figure | Not measurable; reason given. | no published figure (Not measurable; reason given.) | `#role-microsoft > p.Experience_roleHeadline__ol121 > span.Caliper_caliper__w4oUs.Experience_roleHeadlineOpen__1FiOr` |
| 12 | `experience` | `open` | no published figure | Not measurable; reason given. | no published figure (Not measurable; reason given.) | `#role-telstra > p.Experience_roleHeadline__ol121 > span.Caliper_caliper__w4oUs.Experience_roleHeadlineOpen__1FiOr` |
| 13 | `experience` | `open` | no published figure | Not measurable; reason given. | no published figure (Not measurable; reason given.) | `#role-infocentric > p.Experience_roleHeadline__ol121 > span.Caliper_caliper__w4oUs.Experience_roleHeadlineOpen__1FiOr` |
| 14 | `experience` | `open` | no published figure | Not measurable; reason given. | no published figure (Not measurable; reason given.) | `#role-myob > p.Experience_roleHeadline__ol121 > span.Caliper_caliper__w4oUs.Experience_roleHeadlineOpen__1FiOr` |
| 15 | `skills` | `open` | ○ |  | ○ ()in progress, not yet held | `#skills > div.Skills_inner__FWoEr > div.Skills_card__IAS_z > div.Skills_controls__jIh1U:nth-of-type(1) > ul.Skills_legend__kt3A_ > li.Skills_legendItem__Icsg2:nth-of-type(3) > span.Caliper_caliper__w4oUs.Skills_legendGlyph__ZFNcO:nth-of-type(1)` |

About-instrument key swatches (the two provenance states the compass draws):
- `answered` — Seven axes the engine computes from the candidate — answered on this page.
- `role` — Three it computes from the role. Nothing about a person to measure, so the sector stays open.

---

## 2 · Skills calibration semantics

Section `#skills` · heading **Calibration card** · kicker *Skills & Certifications*.

### The three status states

`data-status` values in the DOM: `production`, `non-production`, `pending`

| Glyph | Exact label string | Caliper state |
|---|---|---|
| ● | **measured in production** | — |
| ◐ | **measured outside production** | — |
| ○ | **in progress, not yet held** | open |

### Explicit refusal of proficiency bars

> Every instrument ships with a certificate saying what was tested, where, and what was not. This is that certificate. There are no proficiency bars on this page, because nobody can check one.

`#skills > div.Skills_inner__FWoEr > header.Skills_header__EGNya > p.Skills_lede__IPBNB:nth-of-type(2)`

### Calibration table — evidence and where, per row

Headers: Capability · Evidence · Where · Status

| # | Status | Capability | Evidence column | Where column | Qualifying footnote |
|---|---|---|---|---|---|
| 1 | ● measured in production | Mainframe test automation — REXX, SMF, SDSF, PCOMM | 200+ SIT/E2E scenarios · ~3 h to ~15 min per scenario | ATO · Payday Super | — |
| 2 | ● measured in production | Agile delivery at programme scale | 8 squads · PI 47–48 · test capacity re-baselined 30 → 90 person-days | ATO · Payday Super | — |
| 3 | ● measured in production | Real-time telemetry platforms | 10,000+ concurrent devices held at P95 under 200 ms | ANZ | — |
| 4 | ● measured in production | Cloud-native migration — .NET, Azure | >30% delivery efficiency · >15% infrastructure cost reduction | ANZ | — |
| 5 | ● measured in production | Programme and portfolio management | $5M+ portfolio · 5+ squads · 40+ practitioners onshore and offshore | ANZ | — |
| 6 | ● measured in production | Multi-agent system design — Python, FastAPI, Postgres, Redis | 20 agent engines · 22 routers · 4,272 backend tests · live on a VPS | aether-job-career-agent | — |
| 7 | ◐ measured outside production | LLM evaluation and guardrails — Langfuse, Phoenix | −38% error-budget breaches; entailment guard reverts unsupported claims | Independent · aether-job-career-agent | the −38% was measured against a simulated error budget, not live traffic |
| 8 | ● measured in production | Next.js and TypeScript at production scale | 39 page routes · 2,326 unit cases · 26 Playwright specs | aether-job-career-agent | — |
| 9 | ● measured in production | Node.js / Express services | PEM key-distribution service · full Mocha/Chai coverage | public-key-server | — |
| 10 | ● measured in production | Containerised delivery — Docker, systemd, self-hosted CI | build → gate → deploy → smoke test → automatic rollback on failure | aether-job-career-agent · abentertainment | — |
| 11 | ◐ measured outside production | Multi-service orchestration — Docker Compose | gateway, AI service and Redis composed across separate stacks | containerised-birth-time-rectifier | Compose, not Kubernetes — there are no cluster manifests in that repository |
| 12 | ● measured in production | WebGL and GLSL — three.js, React Three Fiber | bespoke shaders and scenes, one context per section, no context loss | this site · abentertainment | — |
| 13 | ● measured in production | Data visualisation | customer-journey timeline in React/TypeScript; sprint-velocity dashboard in Python | relationship-timeline-feature · EFDDH-Jira-Analytics-Dashboard | — |
| 14 | ● measured in production | Certified Scrum Master (CSM) | Scrum Alliance credential, held | Scrum Alliance | — |
| 15 | ● measured in production | Master of Computer Science (Honours) | conferred | Monash University | — |
| 16 | ● measured in production | Bachelor of Engineering, Computer Science | conferred | University of Melbourne | — |
| 17 | ○ in progress, not yet held | AWS and GCP certification | studying; no certificate issued | — | listed because the CV lists it — saying so is the point of the card |

### Qualifying footnotes / caveats, verbatim

- **LLM evaluation and guardrails — Langfuse, Phoenix** — “the −38% was measured against a simulated error budget, not live traffic”
- **Multi-service orchestration — Docker Compose** — “Compose, not Kubernetes — there are no cluster manifests in that repository”
- **AWS and GCP certification** — “listed because the CV lists it — saying so is the point of the card”

### CV calibration line

> Calibrated against public/docs/Vik_Resume_Final.pdf · MD5 16b856c0 · 157,615 bytes. Run md5sum against the PDF this page links to and you should get the same eight characters.

- Document path rendered: `public/docs/Vik_Resume_Final.pdf`
- MD5 prefix rendered: `16b856c0`
- Byte size rendered: **157,615 bytes**
- Selector: `#skills > div.Skills_inner__FWoEr > div.Skills_card__IAS_z > p.Skills_footer__N8hs4:nth-of-type(2)`

### Topology figure accompanying the table

- Caption: “Every capability, wired to the programme, repository or issuing body its evidence came from. Gold where that evidence was taken in production.”
- Status line: not observable
- SVG present: True · role `None` · aria-label none

Mobile parity — legend labels match: True · rows 17/17 · caveats match: True · CV line match: True.

---

## 3 · Vitrine repository cards

Section `#vitrine` · kicker *What is keeping me busy* · heading **Six of thirty-eight** · 6 cards.

Lede: Thirty-eight public repositories exist. These six are the ones worth your time, each with what it does not do printed beside what it does.

### 01 · `aether-job-career-agent` — Aether

- **What it does:** A job-application platform whose guard reverts any claim your own résumé cannot support.
- **Limits:** The public CI workflow is red on main; production deploys through a separate gated pipeline.
- Harvested metrics: commits 1,664 · active 2026-07 → 2026-09 · stack Python · TypeScript · HTML
- Links: [Source](https://github.com/Victordtesla24/aether-job-career-agent) · [aether.srv1356245.hstgr.cloud](https://aether.srv1356245.hstgr.cloud/)
- Selector: `#vitrine > ol.Vitrine_rail__UCX1h > li.Vitrine_plate__p2JME:nth-of-type(1)`

### 02 · `abentertainment` — AB Entertainment

- **What it does:** A live event company’s site and admin portal, containerised and deployed from a push.
- **Limits:** Content persists as flat JSON files, not a database — sized for one editor, not many.
- Harvested metrics: commits 243 · active 2026-03 → 2026-08 · stack HTML · TypeScript · JavaScript
- Links: [Source](https://github.com/Victordtesla24/abentertainment) · [abentertainment.com.au](https://abentertainment.com.au/)
- Selector: `#vitrine > ol.Vitrine_rail__UCX1h > li.Vitrine_plate__p2JME:nth-of-type(2)`

### 03 · `ralph-loop-infinite` — Ralph Loop

- **What it does:** An agent loop whose only exit is a signed verifier saying the work actually passed.
- **Limits:** A harness for his own machine, not a product; it assumes a trusted local environment.
- Harvested metrics: commits 31 · active 2026-05 → 2026-05 · stack Shell · Python · HTML
- Links: [Source](https://github.com/Victordtesla24/ralph-loop-infinite)
- Selector: `#vitrine > ol.Vitrine_rail__UCX1h > li.Vitrine_plate__p2JME:nth-of-type(3)`

### 04 · `prompt-reconstruction-engine` — Prompt Reconstruction

- **What it does:** Rebuilds a raw prompt into a specification, with provider failover when a model declines.
- **Limits:** Reconstruction quality is judged by the operator; there is no automated benchmark yet.
- Harvested metrics: commits 34 · active 2026-06 → 2026-06 · stack HTML · JavaScript
- Links: [Source](https://github.com/Victordtesla24/prompt-reconstruction-engine)
- Selector: `#vitrine > ol.Vitrine_rail__UCX1h > li.Vitrine_plate__p2JME:nth-of-type(4)`

### 05 · `jyotish-shastra` — Jyotish Shastra

- **What it does:** A Vedic astrology API with an ephemeris accuracy gate that fails the build on drift.
- **Limits:** An engine, not an interpretation: it computes positions and declines to tell fortunes.
- Harvested metrics: commits 214 · active 2025-06 → 2025-11 · stack JavaScript · CSS · Shell
- Links: [Source](https://github.com/Victordtesla24/jyotish-shastra)
- Selector: `#vitrine > ol.Vitrine_rail__UCX1h > li.Vitrine_plate__p2JME:nth-of-type(5)`

### 06 · `forgotten-mistory` — This site

- **What it does:** The page you are reading: static export, one WebGL context per section, no analytics.
- **Limits:** Every figure on it is quoted from a CV or a repository — none is computed live.
- Harvested metrics: commits 205 · active 2025-11 → 2026-09 · stack TypeScript · JavaScript · CSS
- Links: [Source](https://github.com/Victordtesla24/forgotten-mistory) · [forgotten-mistory.web.app](https://forgotten-mistory.web.app/)
- Selector: `#vitrine > ol.Vitrine_rail__UCX1h > li.Vitrine_plate__p2JME:nth-of-type(6)`

### Excluded, and why

| Repository | Reason, verbatim |
|---|---|
| `vik-legal-defence` | a personal legal matter; not a work sample |
| `AI-Gmail-Mailbox-Manager` | an environment file was committed early in its history |
| `Codex · claude-designs` | scratch workspaces — no reviewable architecture |

Stamp line: **38 public repositories · metrics harvested 2026-09-03 from the GitHub API, not live**

Mobile parity — Limits lines match: True · exclusions match: True.

---

## 4 · The ten-dimension framing

Section `#about` · kicker *About* · heading **Ten dimensions, answered**.

### Cited source, as rendered

> Dimensions taken verbatim from Victordtesla24/aether-job-career-agentapps/api/app/routers/jobs.py

- Repository as rendered: **Victordtesla24/aether-job-career-agent** → `https://github.com/Victordtesla24/aether-job-career-agent`
- File path as rendered: `apps/api/app/routers/jobs.py`
- Selector: `#about > div.About_inner__s8EsR > header.About_header__75tJL > p.About_provenance__WZF2T:nth-of-type(4)`

### No-scores refusal copy

> There are no scores below. The engine refuses to publish a number it cannot source, and a number I assign to myself has no source at all — so these are answers, with the evidence beside them.

Instrument key rows:
- `answered` — Seven axes the engine computes from the candidate — answered on this page.
- `role` — Three it computes from the role. Nothing about a person to measure, so the sector stays open.

Instrument SVG aria-label: “Instrument face of ten dimensions. No scores: three of the ten are computed from the role and are drawn open.”

### The ten dimensions

| # | Dimension | Side | Annotation | Answer | Evidence |
|---|---|---|---|---|---|
| 01 | Technical Skills | `candidate` | — | Python and TypeScript to production, and REXX on a mainframe when the program actually needs it. Cloud-native across … | 38 public repositories · ATO evidence harness · ANZ platform migrations |
| 02 | Experience Level | `candidate` | — | Sixteen years. Senior delivery lead and AI/ML solutions architect since 2017; before that, business analysis and proj… | ATO · ANZ · NAB · Microsoft · Telstra · InfoCentric · MYOB |
| 03 | Industry Match | `candidate` | — | Government, banking and telecommunications — three regulated industries where the delivery constraint is usually assu… | Australian Taxation Office, ANZ, NAB, Telstra |
| 04 | Role Alignment | `candidate` | — | Scrum Master and Project Manager who architects. I have never found the two halves to be separate jobs: the eight-squ… | Payday Super program · Agile Kookaburras squad · PI 47–48 |
| 05 | Culture Fit | `candidate` | — | Agile as practice rather than ceremony. Cadence and PI planning when the plan holds; a cross-discipline war room, ins… | 5+ squads, 40+ practitioners onshore and offshore |
| 06 | Salary Fit | `role` | measured from the role | Melbourne market band for senior delivery leadership. I would rather agree the scope first and let the rate follow it. | Open to permanent and contract engagements |
| 07 | Location Match | `role` | measured from the role | Melbourne, Victoria. Hybrid locally, or remote across Australian and New Zealand time zones. | Currently on site with the ATO, Melbourne |
| 08 | Career Growth | `candidate` | — | Programs where AI delivery and AI assurance are the hard part — where somebody has to be accountable for whether the … | Langfuse + Phoenix evaluation stack · −38% simulated error-budget breaches |
| 09 | Company Stability | `role` | measured from the role | I look for organisations that can absorb an honest status report. Every program I have rescued was one where somebody… | 75+ hours of evidence against 64 available — escalated, then re-baselined |
| 10 | North Star Align | `candidate` | — | Build systems whose claims can be checked. Everything I ship is designed to refuse to fabricate its own evidence, and… | aether-job-career-agent · unmeasured signals read "not measured", never zero |

### “measured from the role” annotations

- **06 Salary Fit** — annotation “measured from the role”, gloss “(Computed from the role, not the candidate; answered as what he looks for.)”, caliper state `open`
- **07 Location Match** — annotation “measured from the role”, gloss “(Computed from the role, not the candidate; answered as what he looks for.)”, caliper state `open`
- **09 Company Stability** — annotation “measured from the role”, gloss “(Computed from the role, not the candidate; answered as what he looks for.)”, caliper state `open`

Mobile parity — dimension names match: True · cited file path match: True.

---

## 5 · The Experience timeline — duration-true mapping

Section `#experience` · kicker *Experience* · heading **Sixteen years, to scale**.

Lede: Every bar below is drawn to its real duration — the same dates as the CV, on one axis. The long one in the middle is eight years at ANZ, and it is the reason the rest of this reads the way it does.

Mechanism: each bar carries an inline style of left:<percent>% and width:<percent>% against the track line; widths are laid out in 0.5-percent steps.

### Desktop 1440×900 — track line 1004.00 px

| Role (company) | Rendered duration | Dates from aria-label | Span (months) | Bar width % | Bar width px | px per year |
|---|---|---|---|---|---|---|
| Australian Taxation Office (ATO) | 6 mo | 2026-03 → present | 6 | 3 | 30.11 | 60.22 |
| Independent AI Consulting & Upskilling | 8 mo | 2025-06 → 2026-02 | 8 | 4 | 40.16 | 60.237 |
| ANZ Banking Group | 7.8 yr | 2017-09 → 2025-06 | 93 | 46.5 | 466.86 | 60.24 |
| National Australia Bank (NAB) | 10 mo | 2016-11 → 2017-09 | 10 | 5 | 50.19 | 60.2304 |
| Microsoft | 1.0 yr | 2015-10 → 2016-10 | 12 | 6 | 60.23 | 60.23 |
| Telstra | 11 mo | 2014-11 → 2015-10 | 11 | 5.5 | 55.22 | 60.2378 |
| InfoCentric | 3.3 yr | 2011-08 → 2014-11 | 39 | 19.5 | 195.77 | 60.2369 |
| MYOB | 1.3 yr | 2010-05 → 2011-08 | 15 | 7.5 | 75.3 | 60.24 |

**Implied scale (desktop): 60.22 – 60.24 px per year** across all eight bars — a spread of 0.02 px. Percent-per-year: 5.9997 – 6.0002.

### Mobile 390×844 — track line 218.00 px

| Role (company) | Rendered duration | Bar width % | Bar width px | px per year |
|---|---|---|---|---|
| Australian Taxation Office (ATO) | 6 mo | 3 | 6.53 | 13.06 |
| Independent AI Consulting & Upskilling | 8 mo | 4 | 8.72 | 13.0793 |
| ANZ Banking Group | 7.8 yr | 46.5 | 101.36 | 13.0787 |
| National Australia Bank (NAB) | 10 mo | 5 | 10.89 | 13.0685 |
| Microsoft | 1.0 yr | 6 | 13.08 | 13.08 |
| Telstra | 11 mo | 5.5 | 11.98 | 13.0686 |
| InfoCentric | 3.3 yr | 19.5 | 42.5 | 13.0769 |
| MYOB | 1.3 yr | 7.5 | 16.34 | 13.072 |

**Implied scale (mobile): 13.06 – 13.08 px per year.**

percent-per-year is constant at 6.0 for every role whose span divides evenly into the 0.5-percent rendering step; the residual spread is the rounding of the inline percent, not a distortion of duration. The widest bar is **ANZ Banking Group**.

### Which roles carry a figure and which carry an open bracket

| Role id | Title | Company | Dates | Caliper state | Value | Carries a figure | Detail bullets (expanded) |
|---|---|---|---|---|---|---|---|
| `role-ato` | Scrum Master / Project Manager — Payday Super Program (NTP & Distribution UI) | Australian Taxation Office (ATO) | March 2026 - Present | `self-reported` | ≈92% | figure | 6 |
| `role-independent` | AI Solutions Consultant — Applied LLM Engineering & Delivery Tooling | Independent AI Consulting & Upskilling | Jun 2025 - Feb 2026 | `self-reported` | −38% | figure | 6 |
| `role-anz` | Senior Delivery Lead / AI-ML Solutions Architect | ANZ Banking Group | Sept 2017 - Jun 2025 | `self-reported` | 10k+ | figure | 4 |
| `role-nab` | Senior Project Manager & Business Analyst | National Australia Bank (NAB) | Nov 2016 - Sept 2017 | `open` | no published figure | open bracket | 1 |
| `role-microsoft` | Lead Business Analyst | Microsoft | Oct 2015 - Oct 2016 | `open` | no published figure | open bracket | 2 |
| `role-telstra` | Business Analyst / Project Coordinator | Telstra | Nov 2014 - Oct 2015 | `open` | no published figure | open bracket | 1 |
| `role-infocentric` | Senior Business Analyst | InfoCentric | Aug 2011 - Nov 2014 | `open` | no published figure | open bracket | 1 |
| `role-myob` | Developer Support / Software Testing / Analyst | MYOB | May 2010 - Aug 2011 | `open` | no published figure | open bracket | 1 |

- Roles carrying a figure: `role-ato`, `role-independent`, `role-anz`
- Roles carrying an open bracket: `role-nab`, `role-microsoft`, `role-telstra`, `role-infocentric`, `role-myob`

Mobile parity — duration labels match: True · bar percent widths match: True.

Chart scene container present: True · child elements: 0 (empty — no scene mounts into it on this baseline).

---

## 6 · Bespoke per-repository diagrams and their captions

6 bespoke drawings, one per vitrine card, each an inline `svg[role=img]` labelled by its own `<title>` and `<desc>`.

### `aether-job-career-agent` — Aether

- **Caption (title, `#d1t`):** The application pipeline and its fabrication guard
- **Caption (description, `#d1d`):** Twenty engine nodes in a line carry one job application from left to right. Near the end, a vertical gate intercepts a proposed sentence and strikes it through, reverting any claim the résumé does not support.
- `viewBox` 0 0 320 200 · `aria-labelledby="d1t d1d"` · shapes: line×4, circle×20, text×2, path×2

### `abentertainment` — AB Entertainment

- **Caption (title, `#d2t`):** The deploy loop behind a live client site
- **Caption (description, `#d2d`):** A push enters at the left, rebuilds a container image, and is released only after a health probe answers. A failed probe returns along the lower path to the previous image.
- `viewBox` 0 58 320 122 · `aria-labelledby="d2t d2d"` · shapes: g×4, rect×4, text×5, line×3, path×1

### `ralph-loop-infinite` — Ralph Loop

- **Caption (title, `#d3t`):** An agent loop with a single signed exit
- **Caption (description, `#d3d`):** Four stages — generate, critique, judge, remediate — run as a closed circuit. The one exit on the right stays shut until a signed verifier reports a pass; the repository generates and checks those contract hashes in its own hooks.
- `viewBox` 0 0 320 200 · `aria-labelledby="d3t d3d"` · shapes: circle×5, g×4, text×6, line×2

### `prompt-reconstruction-engine` — Prompt Reconstruction

- **Caption (title, `#d4t`):** A raw prompt reconstructed into a specification
- **Caption (description, `#d4d`):** Unstructured text enters at the top as broken bands. Five passes narrow it into evenly ruled lines leaving the bottom. A brighter hairline marks the fallback taken when a model declines the request.
- `viewBox` 0 0 320 200 · `aria-labelledby="d4t d4d"` · shapes: line×16, path×1, text×1

### `jyotish-shastra` — Jyotish Shastra

- **Caption (title, `#d5t`):** A North Indian chart and its ephemeris accuracy gate
- **Caption (description, `#d5d`):** The twelve houses of a North Indian chart drawn in hairlines. One house is isolated by a caliper reading the Lahiri ayanamsa the repository configures as its default; a drift beyond tolerance fails the build.
- `viewBox` 0 0 320 200 · `aria-labelledby="d5t d5d"` · shapes: rect×1, line×5, path×2, text×2

### `forgotten-mistory` — This site

- **Caption (title, `#d6t`):** The reading rail of this page
- **Caption (description, `#d6d`):** A vertical rail with six ticks, one for each section of this site, and a single node travelling down it — the position you are currently reading from.
- `viewBox` 0 0 320 200 · `aria-labelledby="d6t d6d"` · shapes: line×7, g×6, text×7, circle×1

### Other captioned figures on the page

- `about` · `svg` — Instrument face of ten dimensions. No scores: three of the ten are computed from the role and are drawn open.
- `skills` · `figure` — Every capability, wired to the programme, repository or issuing body its evidence came from. Gold where that evidence was taken in production.
- `listen` · `figure` — AI-generated: my photograph, my cloned voice, animated by a model. Nothing else on this site is synthetic.Read it insteadHello. I'm Vikram Deshpande.What you're watching is an AI-generated avatar — my photograph, my own cloned voice, rendered by a model. I'm telling you that straight away, because I build systems that are not allowed to fabricate their own evidence.Everything else here is real. The figures come from my CV, and from repositories you can open and read. Where something could not honestly be measured, the page says so.If any of it is useful to you, I would welcome a conversation.Facemy own photograph, unretouched framingVoicemy own voice, cloned from a recording of meRenderByteDance OmniHuman 1.5, one take, no editMaster1440 × 1440 · delivered at 1080 × 1080, H.264Scriptwritten by me; the transcript is below, verbatim

---

## 7 · WebGL context count and third-party requests

### Canvases and WebGL contexts

| | Desktop | Mobile |
|---|---|---|
| `<canvas>` elements in the DOM | 0 | 0 |
| WebGL contexts created | 1 | 1 |
| `webglcontextlost` events | 0 | 0 |

> the single webgl2 context is created on a detached 300x150 probe canvas (attached:false) — a capability probe, not a rendered scene.

Per-section walk (each section scrolled into view, 2.2 s dwell):

| Section | Canvases in section | Canvases in document | Contexts created so far | Context-lost events |
|---|---|---|---|---|
| `hero` | 0 | 0 | 1 | 0 |
| `about` | 0 | 0 | 1 | 0 |
| `experience` | 0 | 0 | 1 | 0 |
| `skills` | 0 | 0 | 1 | 0 |
| `vitrine` | 0 | 0 | 1 | 0 |
| `listen` | 0 | 0 | 1 | 0 |

**One-context-per-section posture:** not observable as a rendered scene on this baseline: 0 canvas elements mount in any section at either viewport; 1 detached webgl2 probe context is created per page load and never lost.

### Third-party requests

| | Desktop | Mobile |
|---|---|---|
| Total requests | 22 | 22 |
| Hosts contacted | forgotten-mistory.web.app | forgotten-mistory.web.app |
| Third-party hosts | 0 | 0 |
| Third-party requests | 0 | 0 |

**Assertion:** every request on both viewports resolves to forgotten-mistory.web.app; zero third-party hosts contacted; zero tracker requests.

Request failures: desktop 0, mobile 0. Page errors: desktop 0, mobile 0.

All desktop requests:

- `document` https://forgotten-mistory.web.app/
- `font` https://forgotten-mistory.web.app/_next/static/media/4fcd55e2c741afb8-s.p.woff2
- `font` https://forgotten-mistory.web.app/_next/static/media/e4af272ccee01ff0-s.p.woff2
- `stylesheet` https://forgotten-mistory.web.app/_next/static/css/4c45845169e695cf.css
- `stylesheet` https://forgotten-mistory.web.app/_next/static/css/aa9d2e780cc5fe7d.css
- `script` https://forgotten-mistory.web.app/_next/static/chunks/webpack-17ccc4c733b623d8.js
- `script` https://forgotten-mistory.web.app/_next/static/chunks/fd9d1056-65122057374fba7a.js
- `script` https://forgotten-mistory.web.app/_next/static/chunks/117-618d8b8178db00cb.js
- `script` https://forgotten-mistory.web.app/_next/static/chunks/main-app-364df5d8ef28aa6c.js
- `script` https://forgotten-mistory.web.app/_next/static/chunks/56-3885c91d30670c4e.js
- `script` https://forgotten-mistory.web.app/_next/static/chunks/180-3f6e420f54f764ed.js
- `script` https://forgotten-mistory.web.app/_next/static/chunks/app/page-97105010a4314fee.js
- `script` https://forgotten-mistory.web.app/_next/static/chunks/app/layout-e0b4d6ac7372434a.js
- `script` https://forgotten-mistory.web.app/_next/static/chunks/29-cf690c3b83c509f3.js
- `script` https://forgotten-mistory.web.app/_next/static/chunks/app/error-589692ed6ad97452.js
- `script` https://forgotten-mistory.web.app/_next/static/chunks/app/not-found-7ff5dcacaa933207.js
- `script` https://forgotten-mistory.web.app/_next/static/chunks/app/loading-81b2f18be645a569.js
- `font` https://forgotten-mistory.web.app/_next/static/media/d3ebbfd689654d3a-s.woff2
- `font` https://forgotten-mistory.web.app/_next/static/media/adc34f647e3c68e5-s.woff2
- `font` https://forgotten-mistory.web.app/_next/static/media/98e207f02528a563-s.woff2
- `other` https://forgotten-mistory.web.app/icon.png?bb6e72afeae3e9f8
- `image` https://forgotten-mistory.web.app/assets/avatar/poster.jpg

---

## 8 · Sections and navigation

### Sections in DOM order

| # | id | Heading | Nested |
|---|---|---|---|
| 0 | `hero` | Vikram Deshpande | False |
| 1 | `about` | Ten dimensions, answered | False |
| 2 | `experience` | Sixteen years, to scale | False |
| 3 | `skills` | Calibration card | False |
| 4 | `vitrine` | Six of thirty-eight | False |
| 5 | `listen` | Feedback & coffee? | False |
| 6 | `(none)` | What I was told I had got wrong | True |

Top-level section ids, in order: `hero` → `about` → `experience` → `skills` → `vitrine` → `listen`

### Navigation labels

| Label | href | Visible at 1440×900 |
|---|---|---|
| VIKRAM. | `#hero` | True |
| Download CV | `/docs/Vik_Resume_Final.pdf` | True |
| Home | `#hero` | True |
| About | `#about` | True |
| Experience | `#experience` | True |
| Skills | `#skills` | True |
| Keeping me busy | `#vitrine` | True |
| Feedback & coffee | `#listen` | True |
| LinkedIn | `https://www.linkedin.com/in/vikramd-profile` | True |
| Download CV | `/docs/Vik_Resume_Final.pdf` | True |

- Button: **Menu** (aria-label none, aria-expanded false)

Overlay navigation (`#site-nav-overlay`): Home → `#hero`, About → `#about`, Experience → `#experience`, Skills → `#skills`, Keeping me busy → `#vitrine`, Feedback & coffee → `#listen`, LinkedIn → `https://www.linkedin.com/in/vikramd-profile`, Download CV → `/docs/Vik_Resume_Final.pdf`

`<footer>` element: not present — the page has no footer element on this baseline

### Closing section

- Kicker: *Always willing to listen* · heading **Feedback & coffee?**
- Sentence: I have been wrong often enough to want to hear it early. Tell me what you think — I’ll listen properly.
- Channels: sarkar.vikram@gmail.com (`mailto:sarkar.vikram@gmail.com`) · +61 433 224 556 (`tel:+61433224556`) · linkedin.com/in/vikramd-profile (`https://www.linkedin.com/in/vikramd-profile`) · github.com/Victordtesla24 (`https://github.com/Victordtesla24`)
- Coffee line: Coffee · Melbourne CBD · I’ll come to you
- Nested ledger heading: What I was told I had got wrong
- Avatar caption: AI-generated: my photograph, my cloned voice, animated by a model. Nothing else on this site is synthetic.Read it insteadHello. I'm Vikram Deshpande.What you're watching is an AI-generated avatar — my photograph, my own cloned voice, rendered by a model. I'm telling you that straight away, because I build systems that are not allowed to fabricate their own evidence.Everything else here is real. The figures come from my CV, and from repositories you can open and read. Where something could not honestly be measured, the page says so.If any of it is useful to you, I would welcome a conversation.Facemy own photograph, unretouched framingVoicemy own voice, cloned from a recording of meRenderByteDance OmniHuman 1.5, one take, no editMaster1440 × 1440 · delivered at 1080 × 1080, H.264Scriptwritten by me; the transcript is below, verbatim

Mobile navigation labels: VIKRAM., Download CV, Home, About, Experience, Skills, Keeping me busy, Feedback & coffee, LinkedIn, Download CV

---

## 9 · Counters — value at first paint vs final value

Method: a first-requestAnimationFrame snapshot taken by an init script recorded every value-bearing node before any animation could run; the settled extraction ran after full load, a 2.5 s settle and a full-page scroll walk; a third pass loaded the page with JavaScript disabled.

| | Desktop | Mobile |
|---|---|---|
| First animation frame at | 303.4 ms | 401.2 ms |
| First-frame values identical to settled | **True** | **True** |

| Value at first paint | Final value |
|---|---|
| ≈92% | ≈92% |
| $5M+ | $5M+ |
| 10k+ | 10k+ |
| measured from the role | measured from the role |
| measured from the role | measured from the role |
| measured from the role | measured from the role |
| ≈92% | ≈92% |
| −38% | −38% |
| 10k+ | 10k+ |
| no published figure | no published figure |
| no published figure | no published figure |
| no published figure | no published figure |
| no published figure | no published figure |
| no published figure | no published figure |
| ○ | ○ |

Timeline duration labels at first paint vs settled:

- First frame: 6 mo, 8 mo, 7.8 yr, 10 mo, 1.0 yr, 11 mo, 3.3 yr, 1.3 yr
- Settled: 6 mo, 8 mo, 7.8 yr, 10 mo, 1.0 yr, 11 mo, 3.3 yr, 1.3 yr

### JavaScript disabled

Static markup served without JavaScript is 116,373 bytes and already contains every value:

- `≈92%` — present: True
- `$5M+` — present: True
- `10k+` — present: True
- `−38%` — present: True
- `7.8 yr` — present: True
- `1,664` — present: True
- `157,615 (CV byte size, split across React comment markers in the markup)` — present: True

Screenshot: `T37-baseline-shots/desktop-1440x900-nojs.png`

**Counters that animate from zero: 0 (none).**

> no counter on the live baseline animates from zero: every value-bearing node holds its final value at the first animation frame, at settle, and with JavaScript disabled. Values at first paint equal values at settle in all three passes and at both viewports.

---

## Screenshots captured

- `T37-baseline-shots/desktop-1440x900-about.png`
- `T37-baseline-shots/desktop-1440x900-experience.png`
- `T37-baseline-shots/desktop-1440x900-full.png`
- `T37-baseline-shots/desktop-1440x900-hero.png`
- `T37-baseline-shots/desktop-1440x900-listen.png`
- `T37-baseline-shots/desktop-1440x900-nojs.png`
- `T37-baseline-shots/desktop-1440x900-skills.png`
- `T37-baseline-shots/desktop-1440x900-vitrine.png`
- `T37-baseline-shots/mobile-390x844-about.png`
- `T37-baseline-shots/mobile-390x844-experience.png`
- `T37-baseline-shots/mobile-390x844-full.png`
- `T37-baseline-shots/mobile-390x844-hero.png`
- `T37-baseline-shots/mobile-390x844-listen.png`
- `T37-baseline-shots/mobile-390x844-skills.png`
- `T37-baseline-shots/mobile-390x844-vitrine.png`

---

## How to diff against this baseline

Re-run the same capture after any deployment and compare `T37-baseline-inventory.json` key by key. Under SC-87.1 a preserved asset that **moved** is acceptable; one that **weakened** is a Gate R failure. The load-bearing keys are:

1. `1_metrics_with_provenance.desktop[].provenance_gloss` — every metric keeps a provenance label.
2. `2_skills_calibration_semantics` — the three state labels, every `evidence_column_text`, every `where_column_text`, all three `qualifying_footnotes_caveats`, the proficiency-bar refusal sentence, and the CV calibration line with its hash and byte size.
3. `3_vitrine_repository_cards.cards[].limits_line_verbatim` and `excluded_and_why.entries[].reason_verbatim`.
4. `4_ten_dimension_framing.cited_source`, `.no_scores_refusal_copy`, `.measured_from_the_role_annotations`.
5. `5_experience_timeline.duration_true_mapping` — the px-per-year spread must stay flat across all bars.
6. `6_bespoke_diagrams_and_captions.per_repository_drawings[].caption_*_verbatim`.
7. `7_webgl_and_third_party.third_party_requests.*.third_party_request_count` must stay 0.
8. `8_sections_and_navigation.top_level_section_ids_in_dom_order` and `navigation_labels_in_order`.
9. `9_counters_first_paint_vs_settled.assertion` — no zero-state may become reachable.
