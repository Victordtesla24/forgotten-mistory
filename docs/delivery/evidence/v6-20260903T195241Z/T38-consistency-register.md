# T-38 — Cross-source consistency audit

**Contract:** R-172, R-173, R-184, SC-88.1
**Date:** 2026-09-03
**Site audited:** <https://forgotten-mistory.web.app/> — HTTP 200, 116,809 bytes, md5 `74712d2c420b80127a72846d82e139b0`
**Machine-readable register:** `T38-consistency-register.json` (70 rows)

The deployed page is byte-identical to `/root/forgotten-mistory/out/index.html`, so what is live is the build of the
current working tree. `sitemap.xml` lists one URL; the site is a single page, and every claim below was extracted from it.

| Verdict | Rows |
| --- | ---: |
| consistent | 59 |
| divergent | 9 |
| not observable | 2 |
| **total** | **70** |

---

## 1 · Source integrity — the CV of record

| Check | Expected | Actual | Verdict |
| --- | --- | --- | --- |
| MD5 short hash | `16b856c0` | `16b856c0f3f4ec0d801fdde6d084452c` → `16b856c0` | **MATCH** |
| Byte size | 157615 | 157615 | **MATCH** |

Commands run: `md5sum public/docs/Vik_Resume_Final.pdf`, `stat -c '%s' public/docs/Vik_Resume_Final.pdf`.
The digest the Skills calibration footer prints, and the digest in `app/data/generated/cv-fingerprint.ts`, both match the
shipped bytes. A reader who runs `md5sum` against the linked PDF gets the eight characters the page promises.

## 2 · LinkedIn — not observable, and not inferred

Two independent attempts this run, both refused:

| # | Method | Result |
| --- | --- | --- |
| 1 | `curl` with a desktop Chrome User-Agent | HTTP **999**, 1,530-byte tracking stub |
| 2 | Playwright `chromium.launch({ channel: 'chrome' })` | HTTP **999**, body is LinkedIn's "Agree & Join LinkedIn" registration wall — zero profile fields |

HTTP 999 is LinkedIn's non-standard refusal for unauthenticated clients. **No** field of the profile — headline, roles,
dates, education, certifications, skills — was retrieved. Consequently **no** site claim in this register is confirmed or
contradicted by LinkedIn, and every `linkedinValue` reads `not observable`. Nothing was carried over from the CV or
GitHub and labelled as LinkedIn.

The profile **URL** (`linkedin.com/in/vikramd-profile`) *is* observable — it is printed in the CV's CONTACT INFO block on
page 1, and the site reproduces it exactly. Only the content behind it is unavailable.

---

## 3 · The three named divergences

### R-173 — "fifteen years" vs "Sixteen years" · **RESOLVED on the live site; one dead string remains**

**The correct figure, computed from the CV of record's employment dates:**

| Employer | CV dates |
| --- | --- |
| MYOB | May 2010 – Aug 2011 |
| InfoCentric | Aug 2011 – Nov 2014 |
| Telstra | Nov 2014 – Oct 2015 |
| Microsoft Inc. | Oct 2015 – Oct 2016 |
| National Australia Bank | Nov 2016 – Sept 2017 |
| ANZ | Sept 2017 – June 2025 |
| Independent | June 2025 – Feb 2026 |
| Australian Taxation Office | March 2026 – Present |

Earliest role start **May 2010** → **2026-09-03** = **16 years 4 months (16.34 years)**.

> **The single sourced figure that must appear everywhere is “sixteen years”.**

Note the trap in the source document: the CV's own CAREER OBJECTIVE prose says *"15+ year Senior Technical Leader"*. That
prose is stale against the CV's own dates. **The dates are the source of record for this figure, not the objective
paragraph** — anyone reconciling this in future will otherwise "correct" the site back to fifteen.

**Current state of the live page:** the baseline divergence is already gone. `grep -i 'ifteen'` over the deployed HTML
returns **0 hits**. All three rendered surfaces now agree:

| Surface | Live value | Source |
| --- | --- | --- |
| Hero statement | "**Sixteen years** leading delivery across government, banking and telecommunications…" | `app/data/portfolio/hero.ts:29` |
| About dimension 02 | "**Sixteen years.** Senior delivery lead and AI/ML solutions architect since 2017; before that, business analysis and project delivery from 2010." | `app/data/portfolio/about.ts:50` |
| Experience heading | "**Sixteen years**, to scale" | `app/data/portfolio/experience.ts:106` |

**Residual fix required (regression risk, not a live defect):**

- `app/data/siteContent.ts:558` — `dossier.summary` still reads *"**Fifteen-plus years** turning complex government,
  finance and telecommunications programs into measurable, compliant delivery."* The `dossier` export is imported by
  nothing (`grep -rn dossier app components lib` finds only `siteContent.ts` itself; `Navigation.tsx:5` imports only
  `contact`), so it does not render. **Delete the dead export, or change the string to "Sixteen years".** Leaving a
  contradictory figure in the data layer is exactly how R-173 comes back on the next edit.

### R-172 — the dimensions source repository and path · **one divergence**

`aether-career-agent` (the wrong slug) appears **zero times** — not in the deployed HTML, and not anywhere under `app/`,
`components/`, `lib/`, `docs/`, `scripts/` or `tests/`. Every reference uses the full correct slug:

| File:line | Reference |
| --- | --- |
| `app/data/portfolio/about.ts:113` | `repo: 'Victordtesla24/aether-job-career-agent'` |
| `app/data/portfolio/about.ts:114` | `path: 'apps/api/app/routers/jobs.py'` |
| `app/data/portfolio/about.ts:115` | `href: 'https://github.com/Victordtesla24/aether-job-career-agent'` |
| `app/data/portfolio/about.ts:107` | evidence string `aether-job-career-agent · …` |
| `app/data/portfolio/vitrine.ts:43,48,49` | plate 01 repo, href, live URL |
| `app/data/portfolio/skills.ts:48,127,135,144,160` | source registry and four `where` strings |

The cited file was verified live: `apps/api/app/routers/jobs.py` exists on `main` (blob sha
`038073350df86466c0838c0539d5c3d41bbd0fe6`, 52,581 bytes) and defines `build_fit_dimensions()` at line 226. The ten
dimension names the About section prints are **verbatim** the ten strings that function returns, in order — Technical
Skills, Experience Level, Industry Match, Role Alignment, Culture Fit, Salary Fit, Location Match, Career Growth, Company
Stability, North Star Align. The page's claim that three of them are computed from the role is also the code's own
docstring: *"The three résumé-INDEPENDENT dimensions (Salary Fit / Location Match / Company Stability) are computed from
the ``Job`` row alone."*

**Fix required — `app/data/portfolio/about.ts:115`:**

```
href: 'https://github.com/Victordtesla24/aether-job-career-agent'
```

resolves to the **repository root**, not to the file the sentence quotes. The path itself is rendered as an unlinked
`<span class="About_provenancePath__36m9_">`. R-172 requires the reference to resolve to
`apps/api/app/routers/jobs.py`. Change the href to:

```
https://github.com/Victordtesla24/aether-job-career-agent/blob/main/apps/api/app/routers/jobs.py
```

so "Dimensions taken verbatim from …" lands the reader on the code it is quoting.

### R-184 — "the public CI workflow is red on main" · **CONSISTENT, now with run ids**

Queried live against `Victordtesla24/aether-job-career-agent` on 2026-09-03.

**Workflows (3):**

| Name | Path | id | State |
| --- | --- | --- | --- |
| CI | `.github/workflows/ci.yml` | 311628383 | active |
| VPS Delivery | `.github/workflows/vps-delivery.yml` | 336597190 | active |
| Dependency Graph | `dynamic/dependabot/update-graph` | 305449047 | active |

**Runs on `main` — 525 total. Most recent, at head `bb5f5f01`:**

| Run id | Workflow | Event | Status | Conclusion | Created |
| --- | --- | --- | --- | --- | --- |
| **33682579720** | **CI** | push | completed | **failure** | 2026-09-02T20:59:50Z |
| 33682579662 | VPS Delivery | push | completed | success | 2026-09-02T20:59:50Z |
| 33668786861 | CI | push | completed | failure | 2026-09-02T18:41:44Z |
| 33668786648 | VPS Delivery | push | completed | success | 2026-09-02T18:41:44Z |
| 32365985463 | CI | push | completed | failure | 2026-08-20T11:52:59Z |
| 32365841061 | CI | push | completed | failure | 2026-08-20T11:51:13Z |
| 32351429057 | CI | push | completed | failure | 2026-08-20T08:57:45Z |
| 32332032864 | CI | push | completed | failure | 2026-08-20T04:28:46Z |
| 32300932470 | CI | push | completed | failure | 2026-08-19T20:52:49Z |

Every CI run on `main` in the returned window is `failure`. **Failing jobs in the current run 33682579720:**

| Job id | Job | Conclusion | Failing step |
| --- | --- | --- | --- |
| 100422393204 | API — full pytest suite (self-hosted, isolated schema) | failure | `Full backend suite against aether_test_ci` |
| 100422393390 | API — lint, types (+ DB tests when secret set) | failure | `Run ruff check app/ tests/` |
| 100422393625 | Web — lint, types, unit tests | success | — |

**Verdict: the vitrine is telling the truth, in both halves.** CI is red on `main`, and the separate delivery pipeline
(VPS Delivery, run 33682579662, same commit `bb5f5f01`) is green — which is precisely what "production deploys through a
separate gated pipeline" claims. No change required. If this line is ever re-harvested, cite run id **33682579720**.

---

## 4 · Every other divergence found

| # | Claim | Site says | Source says | Fix |
| --- | --- | --- | --- | --- |
| 1 | `dossier.summary` career length | "Fifteen-plus years" (not rendered) | CV dates give 16y4m | Delete the dead `dossier` export or set "Sixteen years" — `app/data/siteContent.ts:558` |
| 2 | About provenance link target | repo root | R-172 requires the file | Point href at `/blob/main/apps/api/app/routers/jobs.py` — `app/data/portfolio/about.ts:115` |
| 3 | Independent engagement job title | role "AI Solutions Consultant — Applied LLM Engineering & Delivery Tooling", company "Independent AI Consulting & Upskilling" | CV: role = "Independent AI Consulting & Upskilling", employer = "Independent". **"AI Solutions Consultant" appears nowhere in the CV.** | Restore the CV's role/employer pair, or mark the title as a self-description — `app/data/siteContent.ts:92-93` |
| 4 | ANZ job title | one card, "Senior Delivery Lead / AI-ML Solutions Architect" | CV lists **two** ANZ entries: "Senior Delivery Lead / Technical Product Owner" (Sept 2017 – June 2025) and "AI/ML Strategy & Solutions Architect" (2017 – 2022) | Print the CV's primary title with the architect role as a 2017–2022 sub-line, or disclose that the card merges two appointments — `app/data/siteContent.ts:107` |
| 5 | ANZ practitioner count | "40+ practitioners" (a **floor**) | CV: "up to 40 resources" (a **ceiling**) | Change to "up to 40 practitioners" in the Experience bullet, About dimension 05 evidence, and Skills row 5 |
| 6 | ANZ decision clarity | "approximately 55%" | CV: ">55%" | Change to "by more than 55%" |
| 7 | Experience lede | "eight years at ANZ" | Sept 2017 – June 2025 = 7y9m; the bar beside it is labelled **7.8 yr**; `siteContent.ts:480` already says "nearly 8 sustained years" | Change to "nearly eight years at ANZ" — `app/data/portfolio/experience.ts:107` |
| 8 | forgotten-mistory commit count | **205** commits | GitHub API **238**; local `git rev-list --count HEAD` **238** — on the same date the page claims to have harvested | Re-run the harvest as the last step before deploy, or print the harvest commit sha beside the date — `app/data/generated/repo-harvest.json:66` |
| 9 | aether "20 agent engines" | 20 | `apps/api/app/agents/` holds **21** non-`__init__` modules, of which **18** are `*_agent.py`. No counting rule yields 20. | Correct to 18 or 21 and state the rule, or drop the count — the neighbouring "22 routers · 4,272 backend tests" both reproduce exactly — `app/data/portfolio/skills.ts:126` |

**Not observable (1 further row):** the "**2,326 unit cases**" figure. Static counting at `main@bb5f5f01` gives 2,270
strict `it(`/`test(` call sites (2,274 including `it.each`/`.only`/`.skip` forms) across 259 `*.test.ts(x)` files in
`apps/web`. A Vitest run expands parametrised `it.each` tables into multiple reported cases, which plausibly explains the
~52-case gap, and the figure may have been taken at a different commit — so the claim can be neither confirmed nor
refuted by inspection. **Recommendation:** record the harvest method and commit sha beside the number, the way
`repo-harvest.json` already does for commits, so the claim becomes reproducible rather than merely plausible.

---

## 5 · What reconciles exactly (59 rows)

**All eight employment date ranges** are month-for-month identical to the CV, and every bar in the duration chart
recomputes from those dates: ATO 6 mo, Independent 8 mo, ANZ 7.8 yr, NAB 10 mo, Microsoft 1.0 yr, Telstra 11 mo,
InfoCentric 3.3 yr, MYOB 1.3 yr. The machine-readable spans at `app/data/portfolio/experience.ts:27-73` carry the same
months as inline comments, and `NOW = 2026 + 8/12` matches the audit date.

**Five of six job titles** are verbatim (ATO, NAB, Microsoft, Telstra, InfoCentric, MYOB — see §4 for the two that are not).

**Every CV-sourced metric** reconciles verbatim: ≈92% / 200+ SIT scenarios / ~3 h → ~15 min; $5M+ portfolio; 10k+ devices
at P95 < 200 ms; −38% error-budget breaches *with the CV's own "simulated" caveat carried across*; >30% delivery
efficiency and >15% infrastructure cost; test capacity re-baselined 30 → 90 person-days across 40 scenarios and 11 data
tables (AC6–AC19); 75+ hours against 64 available; 95%+ Distribution UI completion; PI 47–48; eight squads.

**All four credentials** match: CSM (Scrum Alliance), MSc Computer Science (Honours, Monash), BE Computer Science
(University of Melbourne), and AWS/GCP recorded as *"studying; no certificate issued — listed because the CV lists it"*,
which reproduces the CV's own "(In progress)" qualifier.

**All contact details** match the CV's page-1 CONTACT INFO block exactly.

**Five of six vitrine plates** reconcile to the GitHub API on commits, active month-range **and** the three named
languages in byte order: aether-job-career-agent 1,664 / 2026-07 → 2026-09; abentertainment 243 / 2026-03 → 2026-08;
ralph-loop-infinite 31 / 2026-05; prompt-reconstruction-engine 34 / 2026-06; jyotish-shastra 214 / 2025-06 → 2025-11.
Public repository count **38** matches `/users/Victordtesla24`. All four named exclusions
(`vik-legal-defence`, `AI-Gmail-Mailbox-Manager`, `Codex`, `claude-designs`) are real public repositories. All three cited
deployments answer HTTP 200.

**Three of four aether internal counts reproduce exactly** against the git tree at `main`: 22 routers (23 `.py` files less
`__init__.py`), 4,272 backend tests (`def test_` / `async def test_` across 392 files — exact to the unit), 39 page
routes, 26 Playwright e2e specs.

**The corrections ledger reproduces exactly.** Re-running the build script's own qualifying rule over the live history:
235 commits scanned, **59** qualifying — and the eight most recent qualifying SHAs are `f642b41`, `e480687`, `df0dac6`,
`5c7b50f`, `45077cb`, `79b11a0`, `3df1815`, `699933f`, which is the exact eight the page renders, in the exact order.

**Skills graph totals reproduce:** 13 sources (3 programme, 7 repository, 3 credential), 17 capabilities, and the
`sources` arrays across those 17 sum to exactly 20 links.

**Provenance discipline holds.** Every CV figure on the page carries "(Self-reported figure.)"; every role without a CV
figure carries "no published figure — (Not measurable; reason given.)" rather than a zero or an invention; every
repository figure is dated and disclosed as harvested, not live. Five employers (Microsoft, Telstra, InfoCentric, MYOB,
NAB) have percentages in the CV that the site declines to print — deliberate under-claiming, and the reason this audit
could be run at all.
