# T-40 · Self-Claim Reconciliation

**Requirements** R-182, R-183, R-184, R-158 · **Success criterion** SC-94.1 · **Gate** R
**Repository** `/root/forgotten-mistory` at `d1fce27` (2026-09-03 17:53:38 +0000)
**Production** `https://forgotten-mistory.web.app/` · served build `last-modified: Thu, 03 Sep 2026 17:54:20 GMT`
**Captured** 2026-09-03 ~20:10–20:15 UTC
**Machine-readable companion** `T40-self-claim-register.json` (36 entries, same ids)

---

## Verdict

**Gate R: FAIL.**

R-183 states the rule this test exists to enforce: *the site must never carry a statement about itself that its own code contradicts.* Thirty-six such statements were extracted and each was checked against the shipped code, the GitHub API today, or a real network trace of a full production visit.

| Verdict | Count | Ids |
| --- | --- | --- |
| TRUE | 26 | — |
| **CONTRADICTED** | **5** | SC-01c, SC-08, SC-09, SC-23, SC-26 |
| UNVERIFIABLE as written | 4 | SC-03, SC-10, SC-21, SC-24 |
| Absent (requirement unmet, no false claim) | 1 | SC-27 |

Three of the five contradictions are in visitor-visible copy. Two requirements are additionally unmet in code, so no amount of rewriting closes them: **R-182**'s deploy-time refresh is not implemented, and **R-183**'s first-party instrumentation is not built.

The good news is worth stating plainly, because R-165 … R-171 protect it: the telemetry claim is currently **true**, the calibration hash and byte count are **exact**, the corrections ledger reproduces **exactly** at HEAD, the provenance labelling holds everywhere, and the console is silent. The failures below are a small number of specific sentences, not a posture problem.

---

## The network trace

Playwright, Chromium `channel: 'chrome'`, full visit to production, `waitUntil: 'networkidle'`, then a scripted scroll of the entire document, a 4 s settle, a scroll back to the top and a 2 s settle.

| Measure | Observed |
| --- | --- |
| Requests | 22 |
| Distinct origins | `https://forgotten-mistory.web.app` — **one** |
| Third-party requests | **0** |
| Request methods | `GET` only |
| `Set-Cookie` response headers | 0 |
| Cookies after the visit | 0 · `document.cookie` empty |
| `localStorage` / `sessionStorage` keys | 0 / 0 |
| `<form>` elements | 0 (desktop and iPhone 13) |
| Console messages / page errors | 0 / 0 |
| Service workers | `/sw.js` (same-origin, cache-first, no reporting) |

No analytics or telemetry library exists in the source or the shipped bundle — grep over `app components lib public scripts config next.config.js package.json firebase.json` for `sendBeacon`, `gtag`, `googletagmanager`, `google-analytics`, `plausible`, `umami`, `fathom`, `posthog`, `mixpanel`, `segment.`, `hotjar`, `clarity`, `matomo`, `@vercel/analytics` returns nothing. The only storage API anywhere in the source is a `sessionStorage` reload guard in `app/error.tsx:37-39`, inside an error boundary that never fired. `functions/index.js` persists nothing and logs only `logger.error` on upstream failure.

---

## The five contradictions

### 1. SC-01c — "and none on a phone" · **CONTRADICTED** · high severity

> "© 2026 Vikram Deshpande · Melbourne · static export · at most one WebGL context per section, **and none on a phone** · no analytics, no trackers, no cookies"
> — `app/data/portfolio/listen.ts:47`, the last line of the page

**Code.** `components/gl/Scene.tsx:91` is the entire render gate:

```
const show = capability === 'supported' && allowMotion && near && pageSettled;
```

`capability` comes from `components/gl/useGLCapability.ts`, which tests for a WebGL2/WebGL context and rejects software rasterisers. There is **no viewport, pointer-type, user-agent or device gate anywhere in the file**, and no media query hides either slot — `.stage` (`Hero.module.css:79`) and `.chartScene` (`Experience.module.css:62`) render at every width. The opposite is true: `components/sections/Hero/HeroAtmosphere.tsx:50` reads

```
material.uniforms.uQuality.value = size.width >= 900 ? 1 : 0;
```

with a comment at lines 31–34 explaining that below phone width the ridged near layer and the shafts are dropped. A designed-in phone shader path only exists because the scene runs on a phone.

**Trace.** Instrumenting `HTMLCanvasElement.prototype.getContext` and loading `https://forgotten-mistory.web.app/?gl=force`:

| Profile | innerWidth | At hero | At `#experience` | After full scroll |
| --- | --- | --- | --- | --- |
| iPhone 13 | 390 | 1 canvas in `#hero` (622×888) | 1 canvas in `#experience` | 0 |
| Pixel 5 | 393 | 1 canvas in `#hero` (687×1717) | 1 canvas in `#experience` | 0 |
| Desktop | 1440 | 1 canvas in `#hero` (1440×917) | 1 canvas in `#experience` | 0 |

`?gl=force` suppresses **only** the software-rasteriser rejection at `useGLCapability.ts:40-42`. It touches no viewport or device logic, so it models exactly the case the claim is about: a phone with a working GPU. (On the unmodified URL in headless Chrome the renderer is classified as software, only the throwaway probe context is created, and no canvas mounts — that is the fallback path, not the phone path.)

**Remediation — R-183 requires both halves in one commit.** Either
**(a) add the gate:** give `Scene.tsx` a real phone test (`matchMedia('(max-width: 899px)')` or a coarse-pointer check) so no context is created below the width `HeroAtmosphere` already treats as a phone, then delete the now-dead `uQuality === 0` branch in `HeroAtmosphere.tsx:50` and `atmosphere.glsl.ts:127` as a shipped removal under R-162, keeping the sentence; or
**(b) fix the sentence:** rewrite the colophon to what the code does — *"at most one WebGL context per section, and a reduced shader on a phone"* — and keep the phone path.
(b) is cheaper and matches the deliberate engineering already there; (a) is the stronger performance stance. Re-run SC-31's console check afterwards either way, because both touch the same code path.

---

### 2. SC-09 — jyotish-shastra *Limits* line · **CONTRADICTED** · high severity

> "An engine, not an interpretation: it computes positions and declines to tell fortunes."
> — `app/data/portfolio/vitrine.ts:84`

**GitHub API, today.** The repository ships a large interpretation layer:

- `src/services/analysis/` — `ArudhaAnalysisService.js`, `BirthDataAnalysisService.js`, `BirthTimeRectificationService.js`, `DetailedDashaAnalysisService.js`, `HouseAnalysisService.js`, `LagnaAnalysisService.js`, `LuminariesAnalysisService.js`, `MasterAnalysisOrchestrator.js`, `YogaDetectionService.js`
- `src/services/report/` + `reportService.js`
- `src/core/reports/synthesis/` — `AnalysisSynthesizer.js`, `ContradictionResolver.js`, `PriorityRanker.js`, `QualityAssuranceEngine.js`, `ReportSynthesisEngine.js`, `TimelineIntegrator.js`
- `src/core/analysis/` — `accuracy/`, `aspects/`, `dashas/`, `divisional/`, `houses/`, `integration/`, `lagna/`, `timing/`, `verification/`, `yogas/`

`LagnaAnalysisService.js` is explicitly interpretive — its sign table returns `characteristics` such as *"Dynamic and energetic"*, *"Natural leadership qualities"*, *"Can be impulsive and impatient"* and `physicalTraits` such as *"Medium to tall build"*, *"Prominent forehead"*. That is interpretation, and it is the larger half of the repository.

**Remediation.** Rewrite `vitrine.ts:84` to a limit the repository actually has. Verified candidate: the ephemeris is gated against JPL Horizons (`tests/integration/btr/horizons-accuracy.test.js`) but nothing checks the interpretation layer, and `src/core/analysis/accuracy/PredictiveAccuracyScorer.js` scores against fixtures rather than outcomes. Suggested: *"The ephemeris is gated against JPL Horizons; the interpretation layer on top of it is rule-derived from the texts and is checked by nothing."*

---

### 3. SC-08 — prompt-reconstruction-engine *Limits* line · **CONTRADICTED** · high severity

> "Reconstruction quality is judged by the operator; there is no automated benchmark yet."
> — `app/data/portfolio/vitrine.ts:75`

**GitHub API, today.** A full automated benchmark harness is committed:

| Artefact | What it does |
| --- | --- |
| `tools/eval-corpus.cjs` (2,859 B) | fixed corpus of coding and non-coding cases |
| `tools/model-eval.cjs` | *"R1: Cross-model execution evals via OpenRouter — real API, fail loudly if key missing"*, targeting claude-haiku-4.5, claude-sonnet-4.6, claude-opus-4.8, gemini-3.1-pro-preview |
| `tools/precision-audit.cjs` | *"R2: Prompt precision audit — ambiguity, indexing, phase exactness"* — scores every corpus item for missing requirements, missing constraints, missing SDLC phases, ambiguous language |
| `tools/regression.cjs` | *"R3: Regression compare baseline vs current deterministic outputs"* — hashes each reconstruction against a committed baseline |
| `tools/capture-baseline.cjs`, `tools/browser-evidence.cjs` | baseline capture, browser evidence |
| `package.json` | `test:models`, `test:precision`, `test:regression`, `test:browser-evidence`, `verify:production`, `baseline:capture` |
| `reports/` | committed results — `model-eval.json`, `precision-audit.json`, `regression-diff.json`, `verifier-report.md`, `baseline/` |

**Remediation.** Rewrite `vitrine.ts:75` to the limit that is true — the benchmark scores structural precision and drift, not whether the reconstructed specification produced a better outcome. Suggested: *"The benchmark scores structure and drift, not outcome — whether a reconstruction actually produced better work is still judged by the operator."* Check the replacement against `reports/precision-audit.json` before shipping it.

---

### 4. SC-23 — "no server to maintain" · **CONTRADICTED** · high severity

> "It's deployed as a static export on Firebase — **no server to maintain**." · "…so there's **no server to run** and no invented claims." · "**No backend**, no hallucination surface beyond the fact base."
> — `app/data/miniVicKnowledge.ts:723, 726, 728` — answers MiniVic gives a visitor about this site

**Deployment.** `firebase.json` declares two Cloud Function rewrites: `/api/chat → minivicChat` and `/api/tts → elevenLabsTts`, both `us-central1`. Live probes:

| Probe | Result |
| --- | --- |
| `POST /api/chat` `{"message":"hi"}` | **HTTP 400** `{"error":"messages_required"}` — the function ran and validated the body |
| `GET /api/chat` | **HTTP 405** `application/json` |
| `POST /api/tts` | **HTTP 502** — reachable and failing, not absent |

A pure static host would have returned the SPA HTML. `functions/index.js` proxies OpenRouter with a server-side key, and `lib/miniVicBrain.ts:315-322` documents this openly in a code comment — *"the same-origin `/api/chat` function (a Firebase Function via Hosting rewrite …). The OpenRouter key stays server-side."* The codebase already knows what the chatbot denies.

Separately, the shipped bundle inlines a referrer-locked **public** Gemini key (`out/_next/static/chunks/app/layout-*.js`; documented at `next.config.js:6`) and the deployed CSP permits `connect-src … https://generativelanguage.googleapis.com https://*.googleapis.com`. A visitor who uses MiniVic sends their typed question to Google and/or through the Cloud Function to OpenRouter.

**Remediation.** Rewrite all three answers to describe the deployment that exists — a static export on Firebase Hosting **plus** two Cloud Functions behind same-origin rewrites, a browser-side Gemini tier behind a referrer-locked public key, and a deterministic offline fallback over the typed fact base — and say plainly that a question asked of MiniVic leaves the browser. Then reconcile two stale code comments: `components/MiniVicBot.tsx:832` (*"No server-side cloned-voice TTS is provisioned on this deployment"* — `/api/tts` answers 502, so it is provisioned and broken: fix it or de-provision the rewrite) and `components/MiniVicBot.tsx:1061` (*"Static deployments have no /api routes"* — this one does). **This must ship with SC-01a**, because the honest telemetry statement has to name this third-party flow.

---

### 5. SC-26 — sitemap change frequency · **CONTRADICTED** · low severity

> `<changefreq>monthly</changefreq>` — `app/sitemap.ts:11`, served live at `/sitemap.xml`

Twelve or more commits landed on 2026-09-03 alone, and the page's own ledger prints 59 corrections. The site changes several times a day. **Remediation:** set `changeFrequency: 'daily'` or drop the field; emit a real `lastModified` alongside the SC-27 build signal.

---

## The two requirements that copy cannot fix

### R-182 — deploy-time data refresh · **UNMET** (SC-04b)

> "38 public repositories · metrics harvested 2026-09-03 from the GitHub API, not live"
> — `components/sections/Vitrine/Vitrine.tsx:201-202`

The sentence is **literally true**, and `scripts/build/harvest_repos.mjs` says so itself at lines 3–9: *"Run by hand, not by the build."* `package.json:11` confirms it — `build:static` runs `cv_fingerprint.mjs` and `feedback_log.mjs` and **nothing else**; the harvest is never invoked by any build or predeploy step. `app/data/generated/repo-harvest.json` was written 2026-09-03 **11:03:31 UTC**; the build that is in production was cut at **17:54**.

Re-running the same API calls the script makes, today:

| Repository | Page prints | GitHub API today | Drift |
| --- | --- | --- | --- |
| aether-job-career-agent | 1,664 commits · 2026-07 → 2026-09 | 1,664 · created 2026-07-01 · pushed 2026-09-02 | none |
| abentertainment | 243 · 2026-03 → 2026-08 | 243 · 2026-03-13 · 2026-08-06 | none |
| ralph-loop-infinite | 31 · 2026-05 → 2026-05 | 31 · 2026-05-19 · 2026-05-20 | none |
| prompt-reconstruction-engine | 34 · 2026-06 → 2026-06 | 34 · 2026-06-16 · 2026-06-26 | none |
| jyotish-shastra | 214 · 2025-06 → 2025-11 | 214 · 2025-06-24 · 2025-11-10 | none |
| **forgotten-mistory** | **205** commits | **238** commits · size 291,111 KB (harvest holds 273,230) | **+33 commits, same day** |
| public repo count | 38 | 38 | none |

Five of six plates are accurate. The sixth is stale **within its own date stamp** — which is precisely the failure R-182 anticipates: a date is too coarse a unit for a page that redeploys several times a day.

**Remediation.** Add `node scripts/build/harvest_repos.mjs` to `package.json:11` ahead of `next build`, guarded so a network or `gh` failure leaves the last good `repo-harvest.json` in place rather than failing the deploy — the script already writes `null` for anything the API declines, and `metricsFor()` already renders `null` as an open caliper reading *"not harvested"*. Then, in the same deployment, restamp the footer with a **timestamp**, e.g. *"38 public repositories · metrics refreshed at deploy, 2026-09-03T17:54Z, from the GitHub API"*.

### R-183 — first-party instrumentation · **NOT BUILT** (SC-01a, SC-02, SC-30)

> "no analytics, no trackers, no cookies" — `app/data/portfolio/listen.ts:47`
> "The page you are reading: static export, one WebGL context per section, no analytics." — `app/data/portfolio/vitrine.ts:92`

Both are **TRUE today**, proven by the trace above and by the greps. R-87 requires first-party, cookieless, personal-data-free telemetry across dwell, scroll depth, drop-off, carousel depth, chatbot sessions and topics, avatar plays and completion, and conversion on every path to conversation. None of it exists.

**Do not weaken these lines on their own.** They are currently accurate and they are protected by R-170/R-171. Build the instrumentation, then rewrite both sentences **in the same deployment** to name exactly what is measured and exactly what is never collected. The rewritten wording must also cover two facts the current phrasing leaves out: Firebase Hosting and Cloud Functions produce platform request logs the site does not author (SC-30), and using MiniVic sends the visitor's question to a third party (SC-23). Scoping the sentence to the page — *"nothing this page runs measures you"*, plus the explicit list — survives both without pretending either away.

### R-184 — flagship CI · disclosure TRUE, defect OPEN (SC-05)

> "The public CI workflow is red on main; production deploys through a separate gated pipeline."
> — `app/data/portfolio/vitrine.ts:46`

`gh api repos/Victordtesla24/aether-job-career-agent/actions/runs?branch=main` — every one of the last five `CI` runs on `main` concluded **failure** (2026-09-02 20:59, 2026-09-02 18:41, 2026-08-20 11:52, 11:51, 08:57), and the `VPS Delivery` workflow concluded **success** on all five of the same pushes. Both halves of the sentence are exactly true.

R-184 is explicit that this is not enough: *honest disclosure of a broken thing is not a substitute for fixing a thing that can be fixed*, and R-105 guarantees a reviewer opens this repository first. Repair CI so `main` is green, then rewrite the *Limits* line to whatever remains true of the platform. Do not delete the line — R-167 preserves the instrument; only its content changes.

---

## Verified true — the instruments that hold

| Id | Claim | Verification | Result |
| --- | --- | --- | --- |
| SC-11 | "Calibrated against `public/docs/Vik_Resume_Final.pdf` · MD5 `16b856c0` · 157,615 bytes. Run `md5sum` … same eight characters." | `md5sum` → `16b856c0f3f4ec0d801fdde6d084452c`; `stat` → `157615` | **exact**, and regenerated on every build by `cv_fingerprint.mjs` (`package.json:11`) |
| SC-11b | The calibration line prints **no date** | `cv_fingerprint.mjs:35-37` — mtime is checkout time, not authorship; PDF mtime 2026-07-09 22:56:02 matches every other checkout file | correctly **not claimed** under R-158 |
| SC-16 | "8 of 59 corrections in the history · harvested 2026-09-03" | re-ran `feedback_log.mjs`'s exact filter over `git log` at HEAD | total **59**, newest eight identical to the page |
| SC-17 | "20 links · 13 sources · 17 capabilities" | counted out of `app/data/portfolio/skills.ts` | 17 / 13 / 20 — **all three match** |
| SC-14 | Dimensions from `aether-job-career-agent` · `apps/api/app/routers/jobs.py` | `gh api …/contents/apps/api/app/routers/jobs.py` | exists, 52,581 bytes — matches R-172 |
| SC-04a | "38 public repositories" | `gh api users/Victordtesla24/repos … length` | **38** |
| SC-05 | aether *Limits* — CI red on main, separate gated pipeline | Actions API | both halves true |
| SC-06 | abentertainment *Limits* — flat JSON, no database | `contents/data` (11 JSON files), `docker-compose.yml` (one `app` service, no db) | true |
| SC-07 | ralph-loop-infinite *Limits* — a harness, trusted local environment | `install-sub-agents-to-root.sh`, `bootstrap.sh`, `hooks/`, `.claude.json`, README | true |
| SC-15 | "Three roles state a figure … the other five state none" | live text — 3 figures, 5 "no published figure" across 8 roles | true |
| SC-29 | "Excluded, and why" | `vik-legal-defence` and `AI-Gmail-Mailbox-Manager` both `private: false` | a genuine editorial act on visible work |
| SC-25 | "There is deliberately no contact form" | `document.querySelectorAll('form').length` | **0** on desktop and iPhone 13 |
| SC-01b / SC-31 | one WebGL context per section, no context loss | canvas instrumentation + console listeners | max **1** live canvas at every sample; **0** console messages, **0** page errors |
| SC-22 | "A word from me — 29 seconds" | final VTT cue ends 00:00:29.150 | true of the narration |

---

## Unverifiable as written — tighten under R-159

| Id | Claim | Why it does not resolve | Remediation |
| --- | --- | --- | --- |
| SC-03 | *"Every figure on it is quoted from a CV or a repository — none is computed live."* (`vitrine.ts:93`) | Nothing is computed at **request** time (0 fetches in the trace), but several figures are **computed at build**: the MD5 and byte count from the PDF bytes (`cv_fingerprint.mjs:33-37`), the 59-correction total from `git log` (`feedback_log.mjs:47-69`), the bench counts and durations at render. "Quoted from" is not what those are. | *"Nothing on it is fetched at request time: every figure is either quoted from the CV or computed at build from a file or a repository you can check."* — stays true after R-182 lands. |
| SC-10 | *"…an ephemeris accuracy gate that fails the build on drift."* (`vitrine.ts:83`) | The gate exists (`test:btr:accuracy` → `tests/integration/btr/horizons-accuracy.test.js`; `deploy:validate` → `test:btr:all && evidence:generate`), but there is **no build to fail**: `.github/workflows/` contains one file, `blank.yml`, and it is **zero bytes**; the repository's last three Actions runs (2025-11-10) each concluded `failure` against it. | Restore a real CI workflow that runs `test:btr:accuracy` (which also clears three red runs a reviewer will see), or rewrite to *"…that blocks its deploy script on drift."* |
| SC-21 | Avatar provenance rows | **Verified:** "delivered at 1080 × 1080, H.264" (`ffprobe` → h264, 1080×1080, 29.96 s) and "the transcript is below, verbatim" (the ten VTT cues concatenate to the four transcript paragraphs exactly). **Not verified:** "Master: 1440 × 1440" (no 1440 master committed — only the 1080 delivery, a 760×760 poster and a 1,116-byte VTT), "ByteDance OmniHuman 1.5, one take, no edit" (corroborated only by `README.md:200` and a Playwright assertion, both restating rather than evidencing), "my own photograph, unretouched framing" (`public/assets/my_avatar.png` exists but nothing links it to the render), "my own voice, cloned from a recording of me" (no source recording committed). | R-160 makes the render ledger reviewable output. Commit the receipt — provider, model id and version, job id, date, input photograph checksum, input voice-sample checksum, master resolution, delivered transcode — and cite it the way the calibration footer cites `md5sum`. One commit converts four self-assertions into checkable facts. Cut any row a receipt cannot cover. |
| SC-24 | *"…so I never go dark and never invent anything."* (`miniVicKnowledge.ts:723`) | The tiering and deterministic fallback exist as described; "never invent" is an absolute over two live LLM tiers and no evaluation in this repository measures it. | Narrow to what the code guarantees — *"the fallback tier can only return sentences from a fact base you can read"* — or add a grounded-answer evaluation and cite its result, in the manner of the corrections ledger. |
| SC-20 | *"Nothing else on this site is synthetic."* (`avatar.ts:75`) | The disclosure itself is sound and correctly treated (visible text, before play, once, in the site's own typography — R-157 satisfied; the clip's own first sentence repeats it). The trailing universal negative covers every asset on the page and nothing evidences it. | Keep the disclosure verbatim — R-158 forbids weakening it. Either commit an asset provenance record naming the origin of every image and scene in `public/assets`, or narrow to *"This clip is the only synthetic asset on the page."* |

---

## Absent — R-181's build and deploy signal (SC-27)

The colophon carries **no** build or deploy signal; the sitemap emits no `lastmod`; no build-time constant exists in `app/`, `components/` or `lib/`. The only deploy evidence a visitor can reach is the HTTP header `last-modified: Thu, 03 Sep 2026 17:54:20 GMT`, which is not authored copy and is not presented as a claim. The nearest thing on the page — *"harvested 2026-09-03"* — dates the harvest, not the deploy.

This is an unmet requirement, not a false statement. **Remediation:** emit the commit sha and an ISO deploy timestamp at build time from a generated module alongside `cv-fingerprint.ts` and `feedback-log.ts`, and print it as authored microcopy — *"built from `d1fce27` · deployed 2026-09-03 17:54 UTC"*. Ship it with the R-182 harvest timestamp so the page carries one consistent account of its own currency.

---

## Remediation order

Ranked by credibility cost per unit of effort. Every row changes **code and sentence together** — R-183 admits no other shape.

| # | Id | Requirement | Action | Cost | Visibility |
| --- | --- | --- | --- | --- | --- |
| 1 | SC-01c | R-183, R-170 | Reconcile "none on a phone" with `Scene.tsx` — add the gate, or rewrite the colophon | low | high |
| 2 | SC-09 | R-167, R-183 | Rewrite the jyotish-shastra *Limits* line | low | high |
| 3 | SC-08 | R-167, R-183 | Rewrite the prompt-reconstruction-engine *Limits* line | low | high |
| 4 | SC-23 | R-183 | Rewrite MiniVic's three "no server" answers + two stale `MiniVicBot.tsx` comments | low | medium |
| 5 | SC-04b | R-182, R-108 | Add `harvest_repos.mjs` to `build:static` with a safe fallback; restamp with a deploy timestamp | medium | high |
| 6 | SC-05 | R-184 | Repair CI on `aether-job-career-agent`; rewrite its *Limits* line | high (external repo) | **highest** |
| 7 | SC-01a, SC-02, SC-30 | R-183, R-87 | Build the instrumentation, then rewrite all three telemetry statements together | high | high |
| 8 | SC-27 | R-181, R-54 | Emit and print the build/deploy signal | low | medium |
| 9 | SC-21, SC-20 | R-160, R-158 | Commit the avatar render receipt; evidence or narrow the synthetic-assets negative | medium | medium |
| 10 | SC-03, SC-10, SC-24, SC-26 | R-159, R-183 | Tighten four imprecise or unfalsifiable statements | low | low–medium |

---

## Not observable

Recorded rather than guessed, per the zero-fabrication rule:

- Whether the avatar was rendered by ByteDance OmniHuman 1.5, from a 1440 × 1440 master, in one take, from `public/assets/my_avatar.png` and a recording of the owner's voice — **no render receipt, job id or master file exists in the repository**.
- Whether `AI-Gmail-Mailbox-Manager`'s stated exclusion reason (a committed environment file) is accurate — not re-verified here; the repository is public and the disclosure is self-incriminating.
- Whether the MiniVic tiers can fabricate in practice — no grounded-answer evaluation exists in this repository to measure it.

---

## Method and provenance

Every value above came from one of: a command run in this session (`md5sum`, `stat`, `ffprobe`, `git log`, `gh api`, `curl`), a file read in this session, or the Playwright traces of the live production page. Playwright ran from `/root/forgotten-mistory/node_modules` with `channel: 'chrome'`. Trace scripts were written under the session scratchpad and deleted; no temporary file was created inside `/root/forgotten-mistory`. No source file was modified. `~/.claude/.env.production` was never read or printed; the referrer-locked public Gemini key detected in the shipped bundle was confirmed present by name only and is not reproduced anywhere in this register.
