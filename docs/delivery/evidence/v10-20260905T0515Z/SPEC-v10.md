# SPEC-v10 — requirements spec + binary test-case list (R9 / TDD gate)

**Task:** t_cba10f82 · **Role:** solutions-architect (architecture / requirements_analysis, level 1, effort max)
**Run:** v10-20260905T0515Z · **Written:** 2026-09-05T06:2xZ · **Repo HEAD:** `74ed0800cd4b7a4f54e1822f01a0d8339f382338` on `main` (`git rev-parse HEAD`)
**Live target:** <https://forgotten-mistory.web.app> — HTTP 200, `<meta name="build-commit" content="07e80f5f">` at 06:03:21Z (`/tmp/sa-probe.mjs`, Playwright chromium `channel:'chrome'`, `--no-sandbox`)

This document is the **requirements spec that must precede code** (R9). Nothing in it was written from
memory: every state claim carries the command, URL or `file:line` that produced it and is tagged
**Verified** (I ran it this session), **Inferred** (derived from something I ran), or **Assumed**.

---

## 0. Probe methodology and its one hard limit

Three read-only probes were run against production this session. No source file was edited.

| Probe | Command | What it produced |
|---|---|---|
| P-1 desktop / RM / mobile | `node /tmp/sa-probe.mjs` | scenes, R4 paths, gold audit, reduced-motion, console, mobile overflow |
| P-2 WebGL forced | `node /tmp/sa-gl.mjs` (`?gl=force`) | true canvas inventory per section, nav timing, resource weights |
| P-3 endpoints | `curl` against `/api/chat`, `/api/tts`, `/docs/Vik_Resume_Final.pdf`, `api.elevenlabs.io/v1/user/subscription` | R3 brain / voice / dossier state |

**Hard limit (Verified, and it governs every fps claim below).** This VPS has no GPU.
`components/gl/useGLCapability.ts:33-36` classifies a SwiftShader/llvmpipe renderer as `unsupported`
and mounts no canvas at all; P-1 therefore measured `canvases: 0` in all six sections and an
`avgFps` of 0.3–6.4, which is an artefact of software rasterisation plus a `scrollBy` inside the rAF
loop — **it is not an R2 frame-rate measurement and must never be quoted as one.** The `?gl=force`
escape hatch (`useGLCapability.ts:41`) was used in P-2 to inventory what *would* mount. Every
60 fps acceptance line in this spec is therefore written to run on a **GPU runner**
(`E2E_RUNNER_LABELS`, the self-hosted Mac) and to be *skipped, never faked*, on the VPS.

---

## 1. Signature-scene inventory (S-1)

Source of truth: `find components/sections -type f`, `grep -rln 'gl_FragColor\|ShaderMaterial' components/`,
and P-2's per-section canvas count at `?gl=force`.

| # | Section | Flagship today | Technique | Canvas at `?gl=force` (P-2) | R2-grade? |
|---|---|---|---|---|---|
| 1 | `#hero` | `HeroAtmosphere` + `atmosphere.glsl.ts` | R3F quad + GLSL | 1 | **yes** |
| 2 | `#about` | `Compass.tsx` | inline SVG, 138 paths | 0 | no |
| 3 | `#experience` | `CareerStrata` + `strata.glsl.ts` | R3F quad + GLSL | 1 (`1297x504`) | **yes** |
| 4 | `#skills` | `Bench.tsx` | inline SVG, 20 paths | 0 | no |
| 5 | `#vitrine` | `Drawings.tsx` | 6 inline SVGs, 74 paths | 0 | no |
| 6 | `#listen` | caliper (CSS keyframes, `Listen.module.css:137-185`) | CSS | 0 | no |
| 7 | MiniVic avatar stage | `mouthCanvasRef` 2D canvas (`MiniVicBot.tsx:209,295-297`) | Canvas2D | n/a | no |

**R2-grade scenes today: 2 of the required ≥7.** (Verified — P-2 `perSection`, and
`window.THREE === "undefined"` confirms three.js is code-split behind `Scene`, not global.)

### Cheapest path to ≥7 without breaking LCP < 2.5 s, CLS < 0.05 or the 500 kB asset cap

The expensive-looking option — new 4K video or texture assets per section — is the one that breaks
all three budgets. The cheap option is already paid for:

1. **three.js + R3F are already in the bundle and already code-split.** `components/gl/Scene.tsx:11`
   loads `GLCanvas` through `next/dynamic({ ssr:false })`, and `Scene.tsx:98` gates the mount on
   `capability === 'supported' && allowMotion && near && pageSettled`. P-2 measured total page
   transfer at **0.67 MB over 33 resources, `load` 1889 ms**, with the largest script chunk
   `b536a0f1.ad3dbd768643527b.js` at 133 kB. Five more scenes that mount through the same `Scene`
   add **zero new network assets** — only GLSL source strings and a small component each
   (`atmosphere.glsl.ts` and `strata.glsl.ts` are the size precedent).
2. **Therefore the 500 kB per-asset cap is untouched** (no new asset), and **LCP is untouched**
   because `Scene.tsx:56-73` refuses to fetch anything 3D until `load` *and* one idle callback,
   i.e. strictly after the LCP element has painted.
3. **CLS is untouched** because each scene renders into a slot `<div>` that already exists and
   already has its CSS box (`Scene.tsx:96`, `aria-hidden="true"`); the canvas appears inside a
   reserved box, so nothing reflows.
4. **Context count stays bounded at 1–2** by the existing `rootMargin: '50% 0px'` observer
   (`Scene.tsx:84`), which is the whole reason the current two scenes do not log context loss.

So the path is: **promote the four SVG/CSS sections to GLSL scenes rendered behind their existing
SVG (the SVG stays as the reduced-motion / no-WebGL path), and promote the MiniVic mouth canvas
from Canvas2D to a GLSL viseme stage** — which also serves R3. 2 + 4 + 1 = **7**. Each is one
full-viewport quad, ≤3 noise lookups per pixel, no geometry, no textures, DPR capped as today.

---

## 2. Requirements table — R1–R12, O1–O6, M1–M7

`state` ∈ met · partial · unmet · owner-blocked. Every "test" names a **spec file + the assertion**
that must exist and fail before the fix, and pass after it.

| id | state | evidence (command / URL / file:line) | gap | binary test (spec file + assertion) | closing cycle |
|---|---|---|---|---|---|
| R1 — net-new top-5-class IA/visual system | partial | Verified: six sections in order, headings read `Vikram Deshpande / Ten dimensions, answered / … / Feedback & coffee?` (P-1 `scenes[].present` all true, `r4_client.listenHeading`); axe 0 violations and 0 console errors carried from v9 R-c8 `review.md` "Gates that hold". The IA is net-new; the *finish* is not: P-1 `gold.bySection` = `{skills:29, vitrine:1}` — 29 gold-painting elements in one section is gold used as a mass, which is R-c8 **C-08** still open on the live build. | Gold-as-mass in `#skills`; R-c8 backlog items C-01…C-11 not all verified closed on `07e80f5f` | `tests/monochrome/gold-semantics.spec.ts` — extend: `expect(goldPaintingElements('#skills')).toBeLessThanOrEqual(6)` and every gold element must sit inside `[data-caliper-state="sourced"]`, a `.measuredMark`, or an `a[href^="https://github.com/"]` | c15 |
| R2 — ≥7 Three.js/R3F+GLSL signature scenes, 60 fps desktop + 2021 phone, reduced-motion fallback each | unmet | Verified: **2 of 7**. P-2 at `?gl=force` returns `canvases:1` for `#hero` and `#experience` (`1297x504`), `0` for `#about`/`#skills`/`#vitrine`/`#listen`. GLSL files: `components/sections/Hero/atmosphere.glsl.ts`, `components/sections/Experience/strata.glsl.ts` only (`grep -rln gl_FragColor components/`). Reduced-motion path is clean: P-1 `reducedMotion.runningCount = 0` at 3000 ms, `canvases: 0`, `heroReadable: true`. | 5 scenes missing; fps never measured on GPU hardware (see §0) | one spec per scene, listed in §3; plus `tests/perf/scene-framerate.spec.ts` — for each of the 7 slots, on the GPU runner, median rAF delta ≤ 16.7 ms over 240 frames at 1440×900 and ≤ 20 ms at 390×844; `test.skip(!process.env.GPU_RUNNER)` — never a stubbed pass | c16–c20 |
| R3 — real-time AI video-avatar agent (voice + avatar + brain) | partial / part owner-blocked | Verified: **brain works** — `POST /api/chat {"messages":[…]}` → HTTP 200, `{"provider":"openai","model":"gpt-4.1-mini"}`, **3.42 s** total (`curl -w`). **Voice is down** — `POST /api/tts` → HTTP **502** `{"error":"tts_upstream_failed","status":401}`. **The ElevenLabs account is fine**: `GET api.elevenlabs.io/v1/user/subscription` with `ELEVENLABS_API_KEY` read by name from `/root/.claude/.env.production` → HTTP 200 `{tier:"payg", status:"active", used:28916, limit:37471, ivc:false, pvc:false}`. So the 401 is a **Secret Manager drift defect**, not a credit block. Lip-sync scaffolding already exists: `lib/visemeMap.ts` (229 lines, 21-viseme D-ID set), `MiniVicBot.tsx:209` mouth canvas, `:214` `AnalyserNode`. Avatar loop `public/assets/my-avatar.mp4` = 1280×720 @24 fps, 12.29 s (`ffprobe`). | (a) TTS 401 → no voice at all; (b) 3.42 s first word vs ≤1.5 s budget; (c) **owner-blocked:** a true ≤40 ms viseme track needs a *generated* phoneme timeline — Higgsfield credits `0` / plan `free` and OpenRouter balance **−$5.38** (`00-run-manifest.json` `baseline`), and ElevenLabs `ivc:false`/`pvc:false` refuses voice cloning, so the avatar must ship as a **stock voice labelled synthetic** over a pre-rendered loop | `tests/e2e/avatar-voice.spec.ts` — `POST /api/tts` returns 200 with `content-type: audio/mpeg` and ≥8 kB body. `tests/e2e/avatar-latency.spec.ts` — from `submit` click to first non-empty transcript token ≤ 1500 ms (p50 of 5 runs) with the ladder warm. `tests/e2e/avatar-mouth.spec.ts` — during playback `mouthCanvas` pixel-diff between two frames 200 ms apart > 0.5 %, and the panel carries a visible `synthetic voice` label (`getByText(/synthetic/i)`). `tests/e2e/avatar-blocked.spec.ts` — asserts the *absence* of any cloned-voice claim in the UI copy | c14 (a), c17 (b), c18 (c-partial); true lip-sync **owner-blocked** |
| R4 — both audiences persuaded, click-through complete | partial | Verified: **employer path complete** — P-1 `r4_employer` finds three anchors to `/docs/Vik_Resume_Final.pdf` (nav pill at x1141 y28, hero button at x297 y756, plus a hero card link), and `page.request.get('/docs/Vik_Resume_Final.pdf')` → **HTTP 200, `application/pdf`, 157 615 bytes**. **Client path incomplete** — P-1 `r4_client.bookingLinks = 0`: no `calendly`/`cal.com`/`savvycal` link anywhere; `#listen` offers only `mailto:sarkar.vikram@gmail.com`, phone and LinkedIn, under the heading `Feedback & coffee?`. That is a contact list, not an engagement CTA. R-c8 **C-09** already flagged those lines as the page's quietest type. | No booking/engagement CTA; three near-identical "Download CV" affordances in one viewport (R-c8 **C-07**) | `tests/e2e/audience-paths.spec.ts` — (employer) click the nav CV control → a request to `/docs/Vik_Resume_Final.pdf` resolves 200 `application/pdf`; (client) `#listen` contains exactly one element matching `[data-cta="engage"]`, it is a link or button ≥44 px tall, its accessible name matches `/engagement|book|start a project|work together/i`, and activating it reaches a destination returning HTTP < 400 (or opens a prefilled `mailto:` whose `subject` is non-empty); (dedupe) `page.locator('a[href$="Vik_Resume_Final.pdf"]:visible')` ≤ 2 at 1440×900 | c15 |
| R5 — 4K / 2160p60 everything | unmet (asset half **owner-blocked**) | Verified by `ffprobe` / `identify` over `find public -type f`: `my-avatar.mp4` **1280×720 @24 fps**; `my-hero-avatar.mp4` **640×360 @24 fps** (mounted live — P-1 `videos[0].src` is `…/my-hero-avatar.mp4`, `w:640 h:360`, `paused:false`, `loop:true`); `og-image.png` 1200×630; `my_avatar.png` 900×502; `my_avatar.webp` / `.avif` 1480×826. **Not one asset reaches 3840×2160 or 60 fps.** No layout break though: P-1 `mobile.scrollWidth === innerWidth === 390`. | Every raster and video is sub-4K. Re-rendering them at 2160p60 requires Higgsfield (credits **0**, plan free) — **owner-blocked**; unblocked by ≥1 Higgsfield credit pack (image/video generation) | `tests/perf/asset-resolution.spec.ts` (node:test sibling `tests/asset_resolution.test.mjs`) — walk `public/assets`; every `.mp4`/`.webm` has `width ≥ 3840 && height ≥ 2160 && fps ≥ 60`; every raster ≥ 3840 px on its long edge; **each failing file must appear in `docs/delivery/evidence/v10-…/OWNER-BLOCKED.md` with the exact credit that unblocks it, or the test fails** — the register is the only sanctioned way to be red | c19 (register) · asset re-render **owner-blocked** |
| R6 — all generation via Higgsfield + OpenRouter, latest models, planned→prompt-reviewed→verified, zero blind re-fires | owner-blocked | Verified: `00-run-manifest.json` `baseline.higgsfield_mcp` = `credits 0, plan free`; `baseline.openrouter` = `balance −$5.38 (402 on every call)`; `spend_policy.paid_generation_cap_usd` = `0`. Live chat is answering on the **`openai` rung** (`/api/chat` → `provider:"openai"`), which is the ladder's documented failover (`functions/index.js:140-172`), not a violation. | No generation is possible this run. **Never fake it**: no mock asset, no "simulated" render, no placeholder passed off as generated | `tests/content/generation-provenance.spec.ts` — every file under `public/assets` has a row in `docs/delivery/evidence/**/generation-log.md` naming `{provider, model, prompt-review commit, verified resolution}`; a file with no row fails; a row naming a provider that was at zero credits on the generation date fails | **owner-blocked** — unblocks on Higgsfield credits + OpenRouter top-up (≥ $5.38 to clear the negative balance) |
| R7 — every claim traces to the resume, zero fabrication | partial | Verified: `reports/static-audit.json` (05:14Z) `result: "PASS"`, `parity: "all key facts present"`, 10/10 gates; `Skills.tsx:209` prints the CV MD5 from `app/data/generated/cv-fingerprint.ts`. Verified counter-example still open from R-c8 **ADV-F-4**: the site says "Sixteen years" (`app/data/portfolio/vitrine.ts:116`, `siteContent.ts:69`) while `public/docs/Vik_Resume_Final.pdf` line 3 says "15+ year". | One headline number one year above its own source | `tests/content/content-check.spec.ts` — extend with CT-11: the tenure figure rendered in `#experience`'s heading equals the tenure string extracted from `public/docs/Vik_Resume_Final.pdf` (via the build-time fingerprint), asserted as an exact string, not a range | c15 |
| R8 — build + deploy on the VPS, CI/CD, production-verified | partial | Verified: `gh run list` shows `Deploy` **success** at 05:59:41Z, 06:01:30Z, 06:02:53Z (three successful deploys inside four minutes) and live `build-commit` moved `8dc4cf46 → 07e80f5f` between P-1 and the manifest. But `Checks` run **33946855946 failed** (05:18Z) and `Checks` 33936783382 failed before it — v9 manifest records the causes: `next 14.2.35` high-severity audit, `minivic_chat_function.test.mjs` cannot resolve `firebase-functions/v2/https` in CI, and 15 failing e2e specs. | CI signal is chronically red even though deploy is green | `tests/ci_pipeline.test.mjs` — extend: the parsed `checks.yml` job list must contain an `install functions deps` step before the node-test step; and a repo-root `npm audit --audit-level=high --omit=dev` returns 0 findings | c14 |
| R9 — documentation + tests BEFORE code (TDD) | **met (this document)** | Verified: this file at `docs/delivery/evidence/v10-20260905T0515Z/SPEC-v10.md` gives every R/O/M id a state, a gap and a named failing test **before** any v10 implementation task is dispatched; `test -s … && grep -c '^| R' …` is the task's own verification line | none for the artefact; it stays met only if each child task lands its spec file first | `tests/ci_pipeline.test.mjs` — extend: for every task id listed in §3, the named `spec_file` exists on disk and contains at least one `expect(` before the implementation commit that closes it (checked by `git log --diff-filter=A` ordering) | c14 |
| R10 — MVP then 3 iterations, loop to 100 % / ≤120 | partial | Verified: `ls artifacts/kanban/cycles/` is **empty** — no cycle report files exist, although `artifacts/kanban/board.json` carries 36 task specs in `artifacts/kanban/tasks/` and prior runs v6–v9 are recorded under `docs/delivery/evidence/`. The iteration history exists as evidence directories, not as the cycle reports §4 requires. | No PEA score per cycle in the canonical location | `tests/ci_pipeline.test.mjs` — extend: `artifacts/kanban/cycles/` contains one JSON per closed cycle with `{cycle, pea_numerator, pea_denominator, adversarial_verdict, deploy_commit}`, and `pea_denominator === 25` (R1–R12 + O1–O6 + M1–M7) | c21 |
| R11 — Fusion Council final gate, all directions implemented | unmet | Verified: `find docs artifacts -iname '*fusion*'` returns only `docs/fusion-os.md` — **no Fusion Council run artefact exists** anywhere in the repo | The one-time mandatory gate (§11) has never run | `tests/ci_pipeline.test.mjs` — extend: `docs/delivery/evidence/**/fusion-council/verdict.json` exists, carries ≥3 distinct panel identities, a verdict of `PASS`, and every `directions[].id` appears as a closed task id in `artifacts/kanban/board.json` | c22 (last, after R2/R3/R4 close) |
| R12 — use ALL skills, plugins, MCP servers, public tools | partial | Verified this session: `playwright` (P-1/P-2 against the live URL), `gh` (run list), `ffprobe`/`identify` (asset audit), `curl` against three live APIs including ElevenLabs. Higgsfield MCP is reachable but at `credits 0` (`00-run-manifest.json`); Figma / chrome-devtools MCP show no usage artefact in `docs/delivery/evidence/v10-*`. | No per-cycle record of which MCP servers were exercised | `tests/ci_pipeline.test.mjs` — extend: each cycle JSON carries `tools_used: string[]` with ≥4 entries and at least one MCP server id; a cycle with an empty array fails | c21 |
| O1 — CI + deploy every 10 min, no workflow > 30 min | **met** | Verified: `gh run list --limit 12` → `Deploy` completed **success** at 05:59:41Z, 06:01:30Z, 06:02:53Z, with two more in flight at 06:03:42Z; the 01:38Z deploy ran **1m55s**. Cadence is well inside 10 min and no run approaches 30 min. | none | `tests/ci_pipeline.test.mjs` — the `deploy.yml` schedule cron is `*/10` **and** the workflow has `timeout-minutes: 30` on every job | held by c14 regression |
| O2 — adversarial + creative council per deploy | partial | Verified: v9 produced `docs/delivery/evidence/v9-20260904T2312Z/R-c8/review.md` (260 lines, three reviewers, verdict **FAIL**, 18-item ranked backlog). v10 has produced none yet — `ls docs/delivery/evidence/v10-20260905T0515Z/` shows only `00-run-manifest.json` and `HYG-branches/`. | No v10 adversarial artefact; R-c8's FAIL verdict is not yet cleared | `tests/ci_pipeline.test.mjs` — for the run id in `board.json`, `docs/delivery/evidence/<run_id>/R-*/review.md` exists and its `## Verdict:` line is parsed; a `FAIL` verdict requires every blocker id to map to a task in `board.json` | c21 |
| O3 — simple autonomous CI, `main` the sole survivor | partial | Verified: `git branch -a` at session start showed `main` plus the transient worktree branch; `00-run-manifest.json` `remote.branches` = `["refs/heads/main"]`, `open_prs` = `"0"`. Deploy never gates on Checks (Deploy green while Checks red at 05:18Z) — that is the intended design. But Checks itself is chronically red, which is the "chronic blocker" O3 names, just displaced. | Checks red on every push | same as R8 | c14 |
| O4 — parallel workflows never deadlock | **met** | Verified: three Deploy runs completed successfully inside four minutes (05:59/06:01/06:02) while two more were `in_progress` at 06:03 — concurrent runs are completing, not blocking each other. `00-run-manifest.json` `worktrees` lists eight worktrees co-existing. | none | `tests/ci_pipeline.test.mjs` — `deploy.yml` declares `concurrency: {group: deploy-main, cancel-in-progress: false}` so queued runs serialise rather than cancel | held by c14 |
| O5 — a visible UI/UX improvement ships every 10 min | partial | Verified: the live `build-commit` advanced `8dc4cf46 → 07e80f5f` during this session's probes — deploys are landing. What landed in those commits is documentation and CI, not a visible UI change (`git log --oneline -3`: `docs(board)`, `docs(run)`, `ci:`). | Cadence is met with non-visual commits | `tests/visual/screenshots.spec.ts` — extend: a cycle that claims O5 must add or update at least one baseline PNG under `tests/baselines/`, asserted by the cycle JSON referencing the changed baseline path | c21 |
| O6 — production verification + adversarial review against the **live** site until PASS | partial | Verified: this spec's probes all ran against `https://forgotten-mistory.web.app` (P-1/P-2/P-3), which satisfies the *verification* half; the *adversarial PASS* half is outstanding — the last recorded verdict is v9 R-c8 **FAIL**. | No PASS on record | `tests/ci_pipeline.test.mjs` — as O2, plus: the newest `review.md` `## Verdict:` must read `PASS` before any task may be marked `done` with `goal_complete: true` | c22 |
| M1 (§0.3-1) — exactly one flagship visualisation per section, cinematic/UHD | unmet | Verified: §1 table — 2 of 6 sections carry a GLSL flagship; `#about`/`#skills`/`#vitrine` are inline SVG (138 / 20 / 74 paths, P-2), `#listen` is CSS keyframes (`Listen.module.css:137-185`). | 4 sections without a flagship scene | `tests/overhaul/section-flagship.spec.ts` — for each of the six section ids, at `?gl=force`, exactly **one** `canvas` descendant exists after the section scrolls into view (`toHaveCount(1)`), and with `reducedMotion:'reduce'` exactly **zero** canvases and the section's static path is still visible | c16–c19 |
| M2 (§0.3-2) — black / white / gold only, gold = sourced claim | partial | Verified: `reports/static-audit.json` `monochrome: pass — greys plus the gold token, defined only in globals.css and lib/palette.ts` (token level). But at runtime P-1 counted **30** gold-painting elements, **29 of them in `#skills`** (`gold.bySection`), which is R-c8 **C-08** "gold as a mass, not a mark" unclosed on the live build. | Gold over-extended in `#skills` | as R1 (`tests/monochrome/gold-semantics.spec.ts`), plus: no element inside `[data-testid="minivic-toggle"]` paints a non-achromatic colour (R-c8 **C-04**) | c15 |
| M3 (§0.3-3) — hero video avatar placed well, no regression | **met** | Verified: `components/sections/Hero/HeroPortrait.tsx:29` `LOOP_SRC='/assets/my-hero-avatar.mp4'`; P-1 `videos[0]` shows it live at 640×360, `paused:false`, `loop:true`; the gate at `HeroPortrait.tsx:52-58` requires ≥720 px, no reduced motion, no `saveData`; P-1 reduced-motion pass shows `runningCount: 0` and `heroReadable: true`, so no regression down the fallback path. | resolution only — carried by R5, not by M3 | `tests/e2e/hero.spec.ts` — extend: at 1440 the hero `<video>` has `currentSrc` ending `my-hero-avatar.mp4` and `readyState ≥ 2`; under `reducedMotion:'reduce'` the same element has empty `currentSrc` and the AVIF poster is visible | c16 (regression guard) |
| M4 (§0.3-4) — n8n avatar workflows fixed and matching site quality | owner-blocked | Verified: `find . -iname '*n8n*'` returns only evidence documents (`docs/delivery/evidence/v9-…/E-n8n/n8n-fix.md`, `v7-…/n8n-YYNSZMYApt7N3U3B.{current,post}.json`) — **no workflow definition lives in this repo**, and the workflow's output quality depends on Higgsfield generation, which is at 0 credits. | Workflow is external; its output cannot be regenerated or verified at 4K this run | `tests/ci_pipeline.test.mjs` — a committed `docs/n8n/<workflow-id>.json` exists and its node list contains the Higgsfield generation node with `resolution: "3840x2160"`; **skipped with a named reason** while the credit block stands, never stubbed green | **owner-blocked** — unblocks on Higgsfield credits |
| M5 (§0.3-5) — MiniVic introduction rewritten on research, substance not word salad | partial | Verified: the brain answers with real, specific content — `/api/chat` returned the published email, phone, LinkedIn and GitHub in one sentence with no filler (P-3, HTTP 200, `provider:"openai"`); `app/data/miniVicKnowledge.ts:726,1188` carry the sourced answer text. What is missing is the *opening* — the panel's first impression is a pre-rendered greeting audio file (`MiniVicBot.tsx:259` `/assets/minivic-greeting.mp3`) whose script has no research artefact in `docs/delivery/evidence/v10-*`. | Greeting script unresearched; and it cannot be re-voiced while `/api/tts` 401s | `tests/content/minivic-knowledge.spec.ts` — extend: the greeting string is ≤ 45 words, names the target role, names one quantified outcome that also appears in `app/data/portfolio/*`, contains none of `/passionate|synergy|leverage|journey|excited to/i`, and is labelled synthetic in the DOM | c17 |
| M6 (§0.3-6) — every section tells a story; visual + intellectual blend; durable recall | partial | Verified per section (headings from P-1, components from `find components/sections`): `#hero` states who/what/where and shows three graded figures — **beat present**; `#about` answers ten dimensions but the compass reads `— / NO SCORES` at rest (R-c8 **MOT-F-2**) — **beat contradicted**; `#experience` draws sixteen years to scale but its own shader header says "It encodes nothing" (`strata.glsl.ts`, R-c8 **MOT-F-1**) — **beat decorative, not narrative**; `#skills` prints what was tested and the CV MD5 — beat present but gold-flooded; `#vitrine` shows six repos with limits printed — beat present, rail off-spine (R-c8 **C-02**); `#listen` closes with the caliper beat (`Listen.module.css:137-185`) — beat present but the contact lines are the page's quietest type (R-c8 **C-09**). | Two of six section beats are contradicted or decorative | `tests/overhaul/section-narrative.spec.ts` — after each section enters view: `#about` shows zero `NO SCORES` text at 1400 ms and exactly one `[data-active]`; `#experience` bars animate from `scaleX < 0.5` to `matrix(1,0,0,1,0,0)` within 1500 ms and the section contains **zero** elements painting `rgb(201,168,76)`; both assertions hold with `reducedMotion:'reduce'` in their static form | c16, c18 |
| M7 (§0.3-7) — 0 regression on site functionality | **met at this commit** | Verified on `07e80f5f`: P-1 `consoleErrors: []`, `failedRequests: []` at 1440×900; `reducedMotion.runningCount = 0` (this **closes R-c8 ADV-F-1**, which was 1); `mobile.scrollWidth === innerWidth === 390` (no horizontal overflow at 390); `minivic.present: true` with `aria-label "Open Mini Vic assistant"`; `reports/static-audit.json` 10/10 PASS. | none at this commit; must be re-asserted after every scene lands | `tests/e2e/regression-guard.spec.ts` — the four invariants above asserted as one spec at 1440, 834 and 390, run after every cycle: 0 console errors, 0 failed requests, `getAnimations()` running === 0 under reduced motion, `scrollWidth === innerWidth` | every cycle |

**Row count: 25** — R1–R12 (12) + O1–O6 (6) + M1–M7 (7). No id is unaccounted for.

---

## 3. Proposed board children (S-6) — exact files, binary acceptance

Each row below becomes one task in `artifacts/kanban/tasks/`. Every one names its spec file, and by
R9 that spec file lands **before** the implementation it guards.

| slug | title | assignee | spec file | closes |
|---|---|---|---|---|
| `c14-tts-secret-and-ci-green` | Restore `/api/tts` (Secret Manager drift) and make Checks green | analyst-programmer | `tests/e2e/avatar-voice.spec.ts` | R3a, R8, O3 |
| `c15-gold-cta-tenure` | Gold back to a mark, one client engagement CTA, tenure matches the CV | coder | `tests/e2e/audience-paths.spec.ts` | R1, R4, R7, M2 |
| `c16-about-compass-glsl` | `#about` flagship: GLSL compass field behind the SVG | coder | `tests/overhaul/scene-about.spec.ts` | R2, M1, M6 |
| `c17-avatar-latency-and-greeting` | First word ≤1.5 s + researched, synthetic-labelled greeting | analyst-programmer | `tests/e2e/avatar-latency.spec.ts` | R3b, M5 |
| `c18-experience-narrative-glsl` | `#experience` shader narrates the spans it sits under | coder | `tests/overhaul/scene-experience.spec.ts` | R2, M6 |
| `c19-skills-bench-glsl` | `#skills` flagship: GLSL bench field | coder | `tests/overhaul/scene-skills.spec.ts` | R2, M1 |
| `c19b-owner-blocked-register` | 4K asset register naming the exact credit per blocked asset | solutions-architect | `tests/asset_resolution.test.mjs` | R5, R6, M4 |
| `c20-vitrine-listen-glsl` | `#vitrine` + `#listen` flagships (scenes 6 and 7 with the MiniVic stage) | coder | `tests/overhaul/scene-vitrine.spec.ts`, `tests/overhaul/scene-listen.spec.ts` | R2, M1 |
| `c20b-minivic-viseme-stage` | MiniVic mouth canvas → GLSL viseme stage (7th scene, serves R3) | coder | `tests/e2e/avatar-mouth.spec.ts` | R2, R3c, M1 |
| `c20c-scene-framerate-gpu` | 60 fps proof for all 7 scenes on the GPU runner | tester | `tests/perf/scene-framerate.spec.ts` | R2 |
| `c21-cycle-reports-and-tooling` | Cycle JSONs with PEA/25 + `tools_used` + baseline-diff proof | analyst-programmer | `tests/ci_pipeline.test.mjs` | R10, R12, O2, O5 |
| `c22-fusion-council` | Run the one-time Fusion Council on the live site; fold every direction into the board | reviewer | `tests/ci_pipeline.test.mjs` | R11, O6 |

---

## 4. Owner-blocked register (named, with the credit that unblocks each)

Nothing in this list may be faked, mocked, simulated, or stubbed green. The sanctioned behaviour is a
**named skip** plus a row in this register.

| item | requirement | blocking fact (Verified) | credit that unblocks it |
|---|---|---|---|
| 4K/2160p60 re-render of `my-avatar.mp4`, `my-hero-avatar.mp4`, `og-image.png`, `my_avatar.*` | R5, C-1 | Higgsfield MCP `credits 0, plan free` (`00-run-manifest.json` `baseline.higgsfield_mcp`); `spend_policy.paid_generation_cap_usd: 0` | any Higgsfield credit pack covering image + video generation |
| Any new generated media at all | R6, C-4 | as above, plus OpenRouter balance **−$5.38**, 402 on every call | Higgsfield credits **and** an OpenRouter top-up ≥ $5.38 |
| Cloned-voice avatar (owner's own voice) | R3 voice fidelity | ElevenLabs `ivc:false`, `pvc:false` on tier `payg` (live `GET /v1/user/subscription`, HTTP 200) | an ElevenLabs plan that enables Instant/Professional Voice Cloning |
| True ≤40 ms lip-sync from a generated viseme track | R3 lip-sync | needs a generated phoneme timeline from a paid TTS/avatar render; both providers blocked above | same as the two rows above |
| n8n avatar workflow output at site quality | M4 | workflow definition is not in this repo; its output quality depends on Higgsfield generation | Higgsfield credits |

**The achievable R3 slice, stated plainly.** Brain: the deployed Cloud Function ladder
(`functions/index.js:140-172`) — OpenRouter first once credited, `openai/gpt-4.1-mini` today, proven
live at HTTP 200. Voice: an ElevenLabs **stock** voice, labelled *synthetic* in the UI, once the
Secret Manager drift behind the 401 is fixed — 8 555 characters of quota remain
(`37471 − 28916`), which is enough for a greeting plus short replies, not for bulk narration.
Avatar: the existing pre-rendered loop (`my-avatar.mp4`, 1280×720 @24 fps) with mouth states driven
by the **audio envelope** through the `AnalyserNode` already at `MiniVicBot.tsx:214`, shaped by the
21-viseme table already at `lib/visemeMap.ts`. Latency target ≤1.5 s to first word, measured from
click to first transcript token. **What stays blocked:** phoneme-accurate ≤40 ms lip-sync, the
owner's cloned voice, and any 4K avatar render.

---

## 5. Decisions taken (§0.1 — chosen, logged, not escalated)

1. **fps is not claimed from this host.** The VPS has no GPU and `useGLCapability.ts:33` deliberately
   refuses SwiftShader; every 60 fps assertion is written to run on the GPU runner and to skip with a
   named reason elsewhere. A stubbed pass would be a false-positive test (C-7).
2. **The 7th scene is the MiniVic avatar stage, not a second scene in any section.** §0.3-1 says
   *exactly one* flagship per section, so the seventh must live in the chrome — and putting it on the
   avatar's mouth serves R3 at the same time.
3. **New scenes carry no new assets.** three.js/R3F are already code-split and already gated behind
   `load` + idle + intersection, so five more quad-and-shader scenes cost bytes measured in kilobytes
   of source, leaving LCP, CLS and the 500 kB cap untouched.
4. **The `/api/tts` 401 is treated as a repo/infra defect, not a credit block**, because the key in
   `/root/.claude/.env.production` authenticates successfully against ElevenLabs right now (HTTP 200).
   It is therefore scheduled in c14, not filed as owner-blocked.
5. **R-c8's FAIL verdict stays open** until a v10 adversarial review is recorded; O2/O6 rows point at
   the same artefact so the FAIL cannot be silently closed.

---

**Tools used:** Bash (`git`, `grep`, `find`, `wc`, `sed`, `curl`, `ffprobe`, `identify`, `gh run list`, `node`) · Read · Write · Playwright 1.57.0 via `node` with `channel:'chrome'` and `--no-sandbox` (`/tmp/sa-probe.mjs`, `/tmp/sa-gl.mjs`) against <https://forgotten-mistory.web.app> · live HTTP probes of `/api/chat`, `/api/tts`, `/docs/Vik_Resume_Final.pdf` and `api.elevenlabs.io/v1/user/subscription` (key read by name from `/root/.claude/.env.production`, never printed).
