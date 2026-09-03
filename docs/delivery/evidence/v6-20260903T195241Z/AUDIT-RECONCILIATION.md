# Audit reconciliation — where the v6 contract's premises meet the observed baseline
Run `v6-20260903T195241Z` · required by R-186 ("record that finding explicitly") and P-10
(where the audited baseline already meets a requirement it is *satisfied, not re-executed*)

Every row below was measured in this run, not inherited. Production HTML and the local
`out/index.html` share md5 `74712d2c420b80127a72846d82e139b0`, so the repository build **is** what
production serves — the codebase and the live site are one artefact for audit purposes.

## A · Premises the contract asserts that the baseline REFUTES

| # | Contract premise | Observed reality | Consequence |
|---|---|---|---|
| A-1 | **R-186:** "the audit finds **no self-presentational avatar video present**, so R-147's removal step is a no-op" | **FALSE.** `components/sections/Listen/Avatar.tsx:28-114` + `Avatar.module.css` (230 ln) + `app/data/portfolio/avatar.ts` + **4.08 MB** of assets ship a 29-second self-presentational clip, mounted at `Listen.tsx:97`. Script verbatim (`avatar.ts:41-46`): *"Hello. I'm Vikram Deshpande… What you're watching is an AI-generated avatar… If any of it is useful to you, I would welcome a conversation."* Four sentences, zero technical content, coupled to no visualisation. | **R-147's removal is REAL work, not a no-op.** It is a self-introduction — precisely what R-147 removes — and R-162 makes the removal a shipped, verified deliverable. R-186's no-op instruction is superseded by observation. |
| A-2 | **R-186:** "the audit finds no AI chatbot (R-65 … R-74)" | **FALSE.** `MiniVicBot` (1,561 ln) is mounted at `app/layout.tsx:142`; `lib/miniVicBrain.ts:322,336` POSTs `/api/chat`, rewritten by `firebase.json:16` to `functions/index.js:111-185` → `meta-llama/llama-3.3-70b-instruct` via OpenRouter with a server-side secret. Live probe returned **HTTP 200** with a real completion. `grep AIza out/_next/` → 0 client-exposed keys. | The chatbot is an **uplift, not a build**. Genuinely ABSENT within it: streaming (`functions/index.js:159-190` returns one JSON blob), retrieval (whole-KB prompt stuffing, `lib/miniVicBrain.ts:70-72`), and server-enforced grounding (a probe with no system prompt returned an ungrounded answer, proving the function injects nothing). R-71 and R-66 remain open. |
| A-3 | **R-176:** "the standalone `#architecture-lab` section sits after Skills & Certifications and breaches the six-section architecture" | **NOT PRESENT.** No such section exists; only comments and orphan CSS remain. Sections in DOM order: `hero → about → experience → skills → vitrine → listen`. | The absorption is satisfied; the residue is dead CSS to delete under TC-NFR-DEADCSS. |
| A-4 | **R-180:** adjudicate "the `~/terminal` easter egg, the *sudo hire vic* command and the Konami code" | **NOT PRESENT.** No terminal, no command, no Konami handler. Only dead CSS at `app/globals.css:746-780`. | Adjudication resolves to **removal of the residue**, and SC-93.1's "no third outcome" is met by the removal branch. |
| A-5 | **R-175:** "the hero and About counters animate from zero" | **NO COUNTER ANIMATES.** First-frame values == settled values == JS-disabled values, at both viewports. The hero figures are quoted string literals (`hero.ts:15,32,37,42`) present in the server-rendered HTML. | R-175 / SC-90.1 are **already satisfied**; the degraded-state audit (T-39) still runs to keep them so. |
| A-6 | **R-178:** replace nav labels "Work", "Contact", "Architecture" | Those labels are **gone**; the nav already carries mandated section titles. | Satisfied. Verify-only. |
| A-7 | **R-181:** *"All rights reserved"* boilerplate in the footer | The string appears **nowhere**. There is also **no `<footer>` element at all**. | The defect is not boilerplate but **absence** — R-181's authored footer with an honest build/deploy signal is still to be built. |
| A-8 | **R-173:** the site says "fifteen years" in the hero and About 02 while Experience heads "Sixteen years, to scale" | **Already reconciled on the live page**: `grep -i ifteen` over the deployed HTML → 0 hits. Computed from the CV of record: earliest role **MYOB, May 2010** → 2026-09-03 = **16.34 years** (16y 4m 2d). | The single sourced figure is **sixteen**. One residual: `app/data/siteContent.ts:558` still holds `'Fifteen-plus years'` in a dead, un-imported `dossier` export. Note the trap: the CV's own CAREER OBJECTIVE prose says "15+ year" and is **stale against its own dates**. |

## B · Premises the contract asserts that the baseline CONFIRMS

| # | Premise | Evidence |
|---|---|---|
| B-1 | **R-184:** the flagship's public CI is red on `main` | Confirmed. `aether-job-career-agent` CI red since **2026-08-18T01:36:45Z**; last green run `32087090146`; latest run `33682579720` (head `bb5f5f01`) conclusion **failure**; the eight most recent runs on main all failed. Two deterministic, reproducible causes: (1) `ruff check app/ tests/` → 10 violations (5 `E501`, 5 fixable `I001`), each verified present at HEAD, with `mypy` **skipped** so its true state is unknown; (2) the self-hosted pytest job → **20 failures** (16 `test_live_submitter_*` guard-refusal tests plus a `test_sub008_answer_bank_seed_classes` group attributed to commit `d803629e`). Flake, browser-revision drift and "the new tests are the failing ones" were each ruled out with evidence. |
| B-2 | **R-186:** no explainer avatar, no real-time presence, no YouTube strand, no dual-strand hero, no content-DNA visualisation | Confirmed absent. `/api/realtime/session` → 404; the realtime path is short-circuited at `MiniVicBot.tsx:1063-1065`; the `services/` realtime stack exists as source but was never installed (no `node_modules`/`dist`), never run, and ports 50051 and 9003 refuse. |
| B-3 | **R-182:** repository metrics are harvested once, not live | Confirmed. `scripts/build/harvest_repos.mjs` calls the real GitHub API but its line 3 states "Run by hand, not by the build", and it appears in **neither** a build script nor CI. The site's own stamp says "38 public repositories · metrics harvested 2026-09-03 from the GitHub API, not live" — currently true, and it must stay true as the implementation changes (R-183). |
| B-4 | **R-183:** the site claims it carries no analytics | Confirmed true today: **0 third-party hosts, 0 third-party requests** (22/22 to `forgotten-mistory.web.app`). `lib/githubTelemetry.ts` was deleted after the 2026-07-09 outage and nothing replaced it. Building R-87's instrumentation therefore **requires** rewriting the claim in the same commit. |
| B-5 | **R-179:** three *Download CV* affordances stack before any artefact | Confirmed: `Navigation.tsx:156`, `Navigation.tsx:26`, `Hero.tsx:89` — two of them above the fold. Nine scattered contact affordances also found (R-185 wants one canonical route). |
| B-6 | **R-84:** the mandated open-source stack | **5 of 9 absent**: GSAP + ScrollTrigger, Lenis, three.js `postprocessing`, D3, and a Lighthouse CI runner (`lighthouserc.json` exists; no runner installed). Present: three.js + R3F, Framer Motion, Playwright, axe-core. |

## C · New defects the contract did not anticipate

| # | Defect | Evidence |
|---|---|---|
| C-1 | **`forgotten-mistory`'s OWN CI is red on `main`.** | Playwright a11y specs hit `ERR_CONNECTION_REFUSED at localhost:8080` (the workflow has no `webServer`); the Firebase deploy job exits **127** with an IAM **403**; `npm audit` gates on high-severity `brace-expansion` / `browserslist` / `glob`. R-105 guarantees a technical reviewer will look at this before anything else. |
| C-2 | ~~**No `<canvas>` element renders in the DOM at any section.**~~ **WITHDRAWN — false positive in this run's own audit (see §F).** | Re-tested with `reducedMotion: 'no-preference'` and `?gl=force`: **hero → 1 canvas, experience → 1 canvas.** The site behaves exactly as designed. |
| C-3 | **The caliper's `sourced` state is never rendered.** | 15 caliper marks live, in states `self-reported` and `open` only. `"Measured; source given."` is defined at `Caliper.tsx:44` and used by nothing. The mark's three-state grammar is therefore only two-thirds legible to a visitor. **It must not be fixed by inventing a sourced mark** — grading a claim above its evidence is the one thing this site may never do. |
| C-4 | **An orphan, billable Cloud Function is live.** | `ssrforgottenmistory` (v2, us-central1) appears in neither `firebase.json` nor `functions/index.js` — a leftover webframeworks SSR function. Removal is a deliverable under R-162. |
| C-5 | **False-positive readiness gates.** | `scripts/validate/phase07..phase10` and `phase21` break out of their readiness loop when `127.0.0.1:8000/health` returns 200 — which on this host is the **Aether production API**, a foreign service. The gates pass instantly and their assertions then 404. They also attempt to *bind* :8000, colliding with a guardian-owned production service. §13 bans false-positive results; §11 bans a gate that cannot fail. |
| C-6 | **A dangling test reference.** | `tests/test_realtime_pipeline.js` was deleted in `3d6b071` but is still referenced by `package.json:42` and `scripts/validate/phase21_realtime_pipeline.sh:37`. Phase 21 cannot pass. |
| C-7 | **`/api/tts` is deployed but 502s** (ElevenLabs upstream 400), and `MiniVicBot.tsx:826-840` has already removed the call — `/api/tts` appears **0×** in the shipped bundle. | Live infrastructure serving nothing. |
| C-8 | **R-172 divergence.** `app/data/portfolio/about.ts:115` links the dimensions source to the repository **root**; the cited path `apps/api/app/routers/jobs.py` renders as unlinked text. | The ten dimension names are verbatim from `build_fit_dimensions()` at `jobs.py:226` (blob sha `038073350df…`) — the citation is true but does not resolve. |
| C-9 | **The `MiniVicBot` is a floating widget.** | R-75 forbids exactly that ("never a floating widget pasted over the design") and R-135 forbids floating bubbles. Its launcher is grey, where R-70 specifies a gold-accent affordance — which now collides with the gold rule and must be resolved deliberately. |
| C-10 | **Dead exports.** `siteContent.ts` exports 15 symbols of which **2** are consumed. | R-82/§13: dead code is a defect, and removal is a deliverable. |

## D · The corpus, established

- **CV of record verified**: md5 `16b856c0f3f4ec0d801fdde6d084452c` (short `16b856c0` — MATCH), **157,615 bytes** (MATCH), mtime 2026-07-09. Extracted with `pdftotext` (Poppler 26.01.0) per page with column crops: **9 roles, 21 verbatim bullets, 2 education records, 2 certifications, 4 skills blocks (32 items), 37 quantitative metrics**, each carrying `{source, page, section}`. Self-verified 149/149 as substrings of a fresh extraction.
- **LinkedIn: not observable.** Five documented attempts (firecrawl blocklist; WebFetch HTTP 999; curl with Chrome UA HTTP/2 999; bare curl 999; site-scoped search → zero matches). 999 is identical with and without a browser UA, so it is a login gate, not UA filtering. No `LINKEDIN_*` credential exists. **The CV of record wins by default, not by contest** (R-173). Five *different* people named Vikram Deshpande were found and are logged explicitly as non-substitutes.
- **GitHub: 41 repositories** (38 public, 3 private — metadata only, 1 fork, 0 archived, 26 with workflows), every field carrying its endpoint and retrieval time.
- **YouTube: the channel is real and not empty.** `@vicd0ct` = "Vic", channel `UCJSYpoFkGKKzYTKzAr8vGzQ`, Australia, joined 2015-05-28. **10 public videos** (the About tab agrees) plus **1 unlisted** leaking through a public playlist; 2 playlists, one also listed as a podcast; no Shorts/streams/releases tabs. Publish dates span **2025-11-19 → 2026-04-16**. Subjects: Vedic/Sanskrit astronomy algorithms (9) and a macOS telemetry HUD "JARVIS" (1); 4 of 10 in Marathi/Devanagari, 6 English. No `YOUTUBE_API_KEY` exists — enumeration used a standalone yt-dlp binary in scratch (the system `/usr/local/bin/yt-dlp` is broken: `ModuleNotFoundError: No module named 'yt_dlp'`) plus `ytInitialData` parsing.

## E · Ruling

P-10 states that where the audited baseline already meets a requirement it is **satisfied, not
re-executed**. Rows A-3 through A-6 are closed on that basis and carry verify-only obligations.
Rows A-1, A-2 and A-7 run the other way: the contract's audit was **wrong in the direction of
under-stating the work** for A-1 (a real removal) and **over-stating it** for A-2 (an uplift, not a
build) and A-7 (an absence, not boilerplate). Observation governs in every case; the requirement
text does not get to overrule the artefact in front of it.


## F · False-positive register (§10.3) — including this run's own

§10.3 requires every unreproducible "finding" to be named, **including the reviewer's own**. One
qualifies so far.

### FP-01 · C-2, "no `<canvas>` renders anywhere" — WITHDRAWN

**The claim.** The T-37 baseline capture recorded 0 `<canvas>` elements at every section, at both
viewports, with exactly one `webgl2` context on a detached probe canvas. It was written up as a
defect: that the WebGL scenes were not rendering as visible artefacts.

**Why it did not reproduce.** Two independent measurement artifacts, both in the *capture
environment*, neither in the site:

1. **Headless Chrome reports `prefers-reduced-motion: reduce` by default.** `components/gl/Scene.tsx`
   deliberately renders no canvas at all under reduced motion — *"A scene renders nothing at all
   when WebGL is unavailable or the reader has asked for reduced motion."* The capture asked for
   reduced motion without knowing it.
2. **This host has no GPU.** `components/gl/useGLCapability.ts` correctly classifies the
   SwiftShader software rasteriser as unsupported — *"a static page beats a stuttering one"* —
   and the probe confirmed the renderer string
   `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)`.

**The re-test.** Same live URL, Playwright with `reducedMotion: 'no-preference'` and the codebase's
own `?gl=force` escape hatch:

```
rm reduce? false
hero        canvases: 1
experience  canvases: 1
```

**Verdict.** No defect. The site renders exactly one WebGL context per section that has one, and
tears it down on exit — which is precisely the R-170 posture the Preservation Register protects.
The original reading had it backwards: the gate firing was the feature working, not the scene
failing.

**The lesson, recorded because it will recur.** A capture harness's own defaults are part of the
measurement. Any future audit of this site MUST state its `prefers-reduced-motion` and GPU
condition alongside its findings, or it will keep re-discovering this non-defect. T-39's
degraded-state audit is the right place for the reduced-motion pass — as a *deliberate* condition,
never as an unexamined default.
