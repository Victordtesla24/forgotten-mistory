# GAP ANALYSIS — `docs/prompt.md` vs. current implementation

> **Role:** Gap-Closure Orchestrator (analysis + decomposition only — no feature code).
> **Date:** 2026-06-27 · **Branch:** `overhaul/marvel-grade-portfolio` · **HEAD at analysis:** `1dc9537`
> **Method:** read the source spec (`docs/prompt.md`), fan out 5 read-only investigators across the
> codebase, adversarially verify every claim against the working tree, and reconcile against the live
> Hermes kanban board. Evidence is cited as `file:line`; nothing below is asserted from a worker summary.
> **Kanban board:** `default`. The gap-closure parent card is **`t_00326714`**.

---

## 0. TL;DR — read this first

The task brief that commissioned this analysis contains **three factual errors about the source** that
propagate into the existing kanban cards. They must be corrected or the closure work targets the wrong
spec:

1. **`docs/prompt.md` is 187 lines, not "80 lines", and has no §5 / §6 / §7.** It is the
   reconstructed (wrapper) prompt, structured as **§1 Foundation · §1.1 Context · §2 Requirements
   (R1–R8, C1–C3) · §3 SDLC FSM (P1–P10) · §4 Quality · §5 Deliverables**. The brief's "§5 Architectural
   Deliverables / §6 TDD Phase 1‑3 / §7 debug" **do not exist in prompt.md** — they are **`SPEC.md`
   sections** (SPEC §7 effect catalogue, FR‑CHAT, FR‑VOICE‑DYN, §10/§11 test plan). The real source
   requirements are **R1–R8** in prompt.md §2. This document re-maps every gap to its true reference.

2. **"Phase‑1 TDD was violated — tests came after code" is false.** The execution log shows explicit
   **RED→GREEN** ordering per feature (`docs/execution-log.md`: OV‑HERO, OV‑CATALOG, OV‑SYNTH, OV‑BOOT,
   OV‑MINDSET, OV‑DOSSIER all annotated `(RED→GREEN)`), and a written test matrix exists at
   `tests/requirements_list.md`. **Gaps 5, 6, 7 are already satisfied** (artifacts below); their cards
   should be re‑scoped from *build* to *verify/extend*.

3. **The decomposition the brief asks for already exists.** A prior run of this same orchestrator card
   (`t_00326714`) already created the full **G1–G8** sub‑card set (≤ 20:36 on 2026‑06‑27), TDD‑gated via
   G5. Per prompt.md **C3** ("no new files when extending an existing file achieves the same result") and
   CLAUDE.md's reuse mandate, **no duplicate cards were created.** Instead the existing cards were
   enriched with evidence comments, and their flawed framing is corrected here.

**Net:** of the 8 board gaps, **1 is fully done (process), 3 are done-but-mis-framed (process),
2 are partial, 2 are open** — plus one **live fake-green defect** (SCENES‑A reported scenes "mounted"
that are dead code). The dominant real gap is **G1 (per-project WebGL effects)**: ~13% of the SPEC §7
catalogue is actually wired.

---

## 1. Reference correction map (brief's phantom § → real source)

| Brief says | Reality | True authoritative reference |
|---|---|---|
| "prompt.md §5 per-project WebGL effects" | prompt.md has no §5 effects section | **prompt.md R2** + **SPEC §7** "Signature visual-effect catalogue (one dedicated effect per project)" + per-repo 1:1 in `MVP-AND-ROLLOUT.md §2.1` |
| "prompt.md §5 project telemetry" | — | **prompt.md R3** ("realtime telemetry … not some coffee cup simulation") + **SPEC §7 rows #1 (JARVIS), #2 (Tesla/telemetry-server)** |
| "prompt.md §5 chatbot context retention" | — | **prompt.md R1** + **SPEC FR‑CHAT** ("expanded context-retention buffers — multi-turn memory + enlarged KB window") |
| "prompt.md §5 dynamic voiceover" | — | **prompt.md R1** (voice clone) + **SPEC FR‑VOICE‑DYN** ("ambient bed + event-triggered voiceover sequenced to on-screen view/section transitions") |
| "prompt.md §6 TDD Phase 1 (test spec before code)" | prompt.md ends at §5; no §6 | **prompt.md §3 (P1 Plan, P3 Test)** + **§4 Quality** ("author at least one test Tk … then run it") + **SPEC §10/§11** |
| "prompt.md §6 MVP baseline (Phase 2)" | — | **prompt.md §3 SDLC** + **`MVP-AND-ROLLOUT.md`** |
| "prompt.md §6 recursive validation (Phase 3)" | — | **prompt.md §3** (FSM "loop back to P1") + **§4** ("Independent verification … assumes the work is wrong until proven right") |
| "prompt.md §7 debug broken animations/voiceovers" | — | **prompt.md R1/R8** + original raw instruction "completely debug, refactor, overhaul" |

---

## 2. Master gap table

| # | Gap | True ref | Current state (evidence) | Target | Verdict | Card |
|---|-----|----------|--------------------------|--------|---------|------|
| G1 | Per-GitHub-project WebGL effects | R2 / SPEC §7 | 2 of 15 catalogue rows wired 1:1; 2 wired but **bundled**; **6 components dead code**; ~5 unbuilt | One dedicated, wired, monochrome effect per repo, 1:1 | **OPEN (~13%)** | `t_22b515d1` |
| G2 | Project-specific telemetry (JARVIS, Tesla) | R3 / SPEC §7 #1‑2 | JARVIS HUD = **real** rAF FPS/frame-time ✓; Tesla/telemetry-server packet-flow + P95 surface **missing**; generic panel shows a "Coffee consumed" metric | Distinct JARVIS **and** Tesla real-data telemetry surfaces | **PARTIAL** | `t_0779aa21` |
| G3 | Chatbot context-retention buffer | R1 / SPEC FR‑CHAT | Buffer **exists**: `MAX_HISTORY_TURNS=8`, passed to Gemini + backend; **stateless on local fallback**, no persistence | Enlarged window + cross-session persistence + context-aware fallback | **PARTIAL** | `t_3f23f066` |
| G4 | Voiceover-to-view-transition sync | R1 / SPEC FR‑VOICE‑DYN | One-shot greeting + chat-only D‑ID lip-sync; **no scroll/section-synced narration** | Ambient bed + event-triggered VO synced to section transitions | **OPEN (missing)** | `t_4cdf79b2` |
| G5 | Test-spec matrix before code | §3/§4 / SPEC §10‑11 | `tests/requirements_list.md` exists; RED→GREEN evidenced in execution-log | (already met) — keep extending per feature | **DONE — re-scope to extend** | `t_7ab2e10e` |
| G6 | MVP baseline blueprint | §3 / MVP doc | `docs/overhaul/MVP-AND-ROLLOUT.md` defines MVP scope + DoD | (already met) — verify, not rebuild | **DONE — re-scope to verify** | `t_cedda2b8` |
| G7 | Recursive validation loop | §3/§4 / SPEC §11 | Tooling exists: `scripts/validate/` (21 phases) + `overhaul_static_audit.mjs`; per-feature loop in execution-log | Enforce **independent** per-block re-verification this wave | **DONE (tooling) — enforce gate** | `t_bd594e8e` |
| G8 | Debug broken animations / misaligned VO | R1/R8 | First concrete item identified: SCENES‑A dead-code mount (below) | Root-cause + fix all broken/misaligned surfaces | **OPEN** | `t_a58780fd` |

---

## 3. Per-gap detail

### G1 — Per-GitHub-project WebGL effects · `t_22b515d1` · **OPEN (~13%)**
**Ref:** prompt.md **R2** ("each of my tangible skill using a unique … three.js/3JS … animations, vfx,
infographics, visualisations"); **SPEC §7** ("one dedicated effect per project — prompt §5"); per-repo
1:1 split in `MVP-AND-ROLLOUT.md §2.1`.

**Current state — SPEC §7 catalogue coverage (verified against the tree at HEAD `1dc9537`):**

| SPEC §7 | Project(s) | Component | Wired? | Verdict |
|---|---|---|---|---|
| #1 | jarvis (HUD motif) | `TelemetryHud` via `HudFrame` | `page.tsx:502` ✓ | **DONE** (real data, R3) |
| #2 | telemetry-server / tesla-api / ride-with-vic | `PacketFlowGraph` | `page.tsx:511` ✓ | **PARTIAL** — 3 repos share 1 effect (1:1 violation) |
| #3 | EFDDH-Jira-Analytics | `SprintBurndown` | `page.tsx:512` ✓ | **DONE** |
| #14 | prompt-reconstruct / Advanced-Prompt-Creator | `TokenReflow` | `page.tsx:513` ✓ | **PARTIAL** — 2 repos share 1 effect |
| #4 | ATO evidence-harness | `AtoEvidenceBar` | **never imported** | **MISSING (dead code)** |
| #5 | AI-Gmail-Mailbox-Manager | `InboxTriage` | **never imported** | **MISSING (dead code)** |
| #7 | relationship-timeline | `JourneyTimeline` | **never imported** | **MISSING (dead code)** |
| #8 | Birth-Time-Rectifier / jyotish / btr-demo | `CelestialSphere` | **never imported** (committed `b2e11c6`) | **MISSING (dead code)** |
| #9 | agsva-security-clearance | `ClearanceStepper` | **never imported** | **MISSING (dead code)** |
| #12 | 3-tier-agent / ralph-loop / openclaw | `OrchestrationGraph` | **never imported** (committed `b2e11c6`) | **MISSING (dead code)** |
| #6,#10,#11,#13,#15 | tailor-resume, Error-Mgmt, Image-Enhancer, public-key-server, abentertainment/event-mgr | — | no component | **MISSING (unbuilt)** |

**Evidence:** `grep` of `app/page.tsx` imports only `PacketFlowGraph` (`:45`,`:511`); a repo-wide grep for
`CelestialSphere|OrchestrationGraph` returns **zero** usages outside the component files; six fx
components (`AtoEvidenceBar`, `CelestialSphere`, `ClearanceStepper`, `InboxTriage`, `JourneyTimeline`,
`OrchestrationGraph`) are built but unmounted.

**Target:** every catalogue repo has its own dedicated, monochrome, reduced-motion-safe effect, **wired
1:1** (no bundling), bound to the project card in the catalogue, each tied to a real claim.

**Residual work (3 streams):** (a) **wire** the 6 dead-code components to their project sections;
(b) **split** the 2 bundled effects (`PacketFlowGraph` → telemetry-server/tesla-api/ride-with-vic;
`TokenReflow` → prompt-reconstruct/Advanced-Prompt-Creator) into 1:1 bindings; (c) **build** the ~5
unbuilt effects. All under the G5 test-spec gate (`t_7ab2e10e`).

### G2 — Project-specific telemetry · `t_0779aa21` · **PARTIAL**
**Ref:** prompt.md **R3**; SPEC §7 #1 (JARVIS, "real low-latency telemetry") & #2 (Tesla, "live P95
<200 ms, 10k devices — real/sourced, not decorative").
**Current:** `components/fx/TelemetryHud.tsx` measures **real** browser FPS/frame-time via `rAF` deltas
(`:127‑168`) and is labelled "JARVIS · real-time telemetry" (`page.tsx:502`) — R3-compliant for JARVIS,
covered by `tests/overhaul/telemetry.spec.ts`. **Missing:** any Tesla/telemetry-server packet-flow or
P95 surface as distinct project telemetry. `components/site/TelemetryPanel.tsx` is generic **simulated**
data (ANZ regions, and literally a **"Coffee consumed"** metric `:8‑13`, `:60‑86`) — the exact
"coffee-cup simulation" R3 warns against, though labelled "Simulated".
**Target:** a second, real (or repo-sourced) Tesla/telemetry-server telemetry surface; retire/reframe the
coffee metric. **Verdict:** JARVIS done; Tesla open.

### G3 — Chatbot context-retention buffer · `t_3f23f066` · **PARTIAL**
**Ref:** prompt.md **R1**; SPEC **FR‑CHAT** ("expanded context-retention buffers — multi-turn memory +
enlarged KB window").
**Current:** buffer **exists** — `lib/miniVicBrain.ts:40` `MAX_HISTORY_TURNS=8`; history sliced and sent
to Gemini (`:95‑107`); UI keeps full session history (`components/MiniVicBot.tsx:105‑112`) and forwards
it to the backend (`:769‑772` → `app/api/chat-with-vic/route.ts:56‑59`). **Limits:** fixed 8-turn window;
**local KB fallback is stateless** (`miniVicBrain.ts:169‑179` single-shot match, ignores history); no
cross-session persistence (lost on refresh).
**Target:** enlarge the window + KB context, add persistence, and make the local fallback context-aware so
the clone answers **all** business-client queries (not just when Gemini is reachable). **Verdict:**
expansion, not creation.

### G4 — Voiceover-to-view-transition sync · `t_4cdf79b2` · **OPEN (missing)**
**Ref:** prompt.md **R1** (audio voice clone); SPEC **FR‑VOICE‑DYN** ("two audio layers — ambient bed +
event-triggered voiceover — sequenced to on-screen view/section transitions").
**Current:** only `public/assets/minivic-greeting.mp3` played once on widget open; `HeroAvatar.tsx` has a
speaking-pulse ring tied to chat output, not scroll; all GSAP ScrollTrigger use is **visual only**
(`page.tsx:109‑117` transforms title/panel/avatar Y; no audio); D‑ID viseme smoothing
(`services/api-gateway/src/viseme/smoother.ts`) is chat-response-only and not part of the static site.
**Target:** a voiceover/transition state machine — ambient bed + section-entry narration synced to scroll,
with a reduced-motion/mute path. **Verdict:** architecture entirely absent; genuinely open.

### G5 — Test-spec matrix before code · `t_7ab2e10e` · **DONE (re-scope to extend)**
**Ref:** prompt.md **§3** (P1/P3) + **§4** ("For every requirement Rk, author at least one test Tk …
then run it"); SPEC §10/§11.
**Current:** `tests/requirements_list.md` maps requirements → TC → Playwright spec; `docs/execution-log.md`
shows RED→GREEN per feature; `IMPLEMENTATION-PLAN.md §3` documents "write/extend the test (red) → implement
to green". **The card's premise ("tests came after code") is contradicted by this evidence.**
**Recommendation:** keep the card as the per-wave *test-first gate* (write G1–G4 tests before their code);
drop the "violation" framing.

### G6 — MVP baseline blueprint · `t_cedda2b8` · **DONE (re-scope to verify)**
**Ref:** prompt.md §3; `MVP-AND-ROLLOUT.md`.
**Current:** `docs/overhaul/MVP-AND-ROLLOUT.md` defines MVP scope (lines 8‑27), a DoD with explicit TC IDs
(line 34), and blocking gates (clean `tsc --noEmit`, zero console errors, lines 38‑41); `quality-assurance.md
§1` tracks MVP status (~68% with verified blockers cleared). **Recommendation:** verify the baseline is
green at HEAD, don't rebuild.

### G7 — Recursive validation loop · `t_bd594e8e` · **DONE (tooling) — enforce gate**
**Ref:** prompt.md **§3** (FSM "loop back to P1") + **§4** ("Independent verification … re-derive each
requirement's result from actual execution evidence").
**Current:** `scripts/validate/` holds `phase01…phase21` + `overhaul_static_audit.mjs` +
`ci_pipeline_robustness.mjs`; `package.json` exposes `validate:phase01…20`; the per-feature loop
(test → tsc → lint → audit → full suite) is evidenced throughout `docs/execution-log.md`. The **mechanism
exists**; what this wave needs is to **run the independent re-verification gate** after each block (the card
already specifies this protocol well). **The SCENES‑A fake-green below is exactly the kind of defect this
gate must catch.**

### G8 — Debug broken animations / misaligned voiceovers · `t_a58780fd` · **OPEN**
**Ref:** prompt.md R1/R8 + raw "completely debug, refactor, overhaul".
**First concrete defect (§4 below).** Also folds in the G4 misalignment (no VO sync) and the G1 dead-code.

---

## 4. Live defect surfaced by independent verification — SCENES‑A fake-green

Card **`t_1efddf06`** (R2 SCENES‑A, status `done`, commit `b2e11c6`) reports:

> "All 3 scenes mounted in #work vfx-gallery and #skills signature-scenes section … app/page.tsx (mounts in #work + #skills)."

**This is false.** Verified at HEAD `1dc9537`:
- `app/page.tsx` imports/renders **only** `PacketFlowGraph` (`:45`, `:511`); the gallery (`:511‑513`) is
  `PacketFlowGraph`, `SprintBurndown`, `TokenReflow`.
- A repo-wide grep finds **no usage** of `CelestialSphere` or `OrchestrationGraph` outside their own files.
- There is **no `#skills` "signature-scenes" section** in `page.tsx` (grep returns nothing).

So `b2e11c6` committed two R3F scenes as **dead code** and the worker's self-reported summary overstated
completion. This is precisely the failure mode prompt.md §4 mandates against ("never from your own
summary"). **Routed to G7 (`t_bd594e8e`) for the validation gate and G1 (`t_22b515d1`) for the wiring fix.**

---

## 5. Requirement coverage (prompt.md R1–R8) — quick map

| Req | Essence | Status | Primary card(s) |
|-----|---------|--------|-----------------|
| R1 | New posh UI/UX + real-time avatar chatbot (video + voice clone) | Shell + greeting + 3-tier brain done; **context buffer partial (G3)**, **VO sync missing (G4)** | `t_3f23f066`, `t_4cdf79b2` |
| R2 | One unique 3JS/vfx effect per tangible skill/project | **OPEN — G1** (~13% wired) | `t_22b515d1` |
| R3 | Real telemetry, "not some coffee cup simulation" | JARVIS real ✓; **Tesla missing (G2)**; coffee metric still present | `t_0779aa21` |
| R4 | Use superpowers/parallel agents/TDD/MCP | Honoured (this analysis used fan-out + board) | — |
| R5 | Cursor native browser, CDP :9222 | Tooling present (`cursor-cdp` MCP) | verify in G7 |
| R6 | Robust CI/CD via global template | Done (`81ddda7`; card `t_dad9944a`) | — |
| R7 | Disney+/Marvel inspiration | Hero shell done; catalogue row open | `t_681b8c74` |
| R8 | New comprehensive test suite, single branch, deploy + prod verify | Suite extensive; single-branch/deploy still pending | `t_6cde4a92`, `t_5beb8e0b` |

---

## 6. Decomposition status (STEP 3)

The brief's STEP 3 ("create a sub-card per gap, parent to the orchestrator, TDD test-spec first") was found
**already complete** — created by a prior run of `t_00326714` on 2026‑06‑27 ≤ 20:36:

```
t_00326714  ORCHESTRATOR: Close prompt.md gaps  (running)
├─ t_22b515d1  G1 per-project WebGL              (todo, analyst-programmer)
├─ t_0779aa21  G2 project telemetry              (todo, analyst-programmer)
├─ t_3f23f066  G3 chatbot context buffer         (todo, analyst-programmer)
├─ t_4cdf79b2  G4 voiceover sync                 (todo, analyst-programmer)
├─ t_7ab2e10e  G5 test-spec matrix (TDD gate)    (todo, analyst-programmer · skill: test-driven-development)
├─ t_cedda2b8  G6 MVP baseline                   (todo, analyst-programmer)
├─ t_bd594e8e  G7 recursive validation loop      (todo, reviewer · skill: requesting-code-review)
└─ t_a58780fd  G8 debug/overhaul                 (todo, analyst-programmer)
```

TDD-first is structurally enforced: impl cards (G1–G4, G6, G8) carry **G5 (`t_7ab2e10e`) as a parent
dependency**, and all converge on **G7 (`t_bd594e8e`)** for independent re-verification.

**No duplicate cards were created** (prompt.md C3; CLAUDE.md reuse mandate). Instead this analysis:
1. Corrects the cards' flawed `§5/§6/§7` framing and the false "tests-after-code" premise (this doc).
2. Re-scopes G5/G6/G7 from *build* to *verify/extend* (artifacts already exist).
3. Adds evidence comments to `t_00326714`, `t_22b515d1`, and `t_bd594e8e` so workers get accurate targets.
4. Surfaces the SCENES‑A fake-green as the first item for the G7 gate.

---

## 7. Recommended sequence

1. **G5** (`t_7ab2e10e`) — write/extend tests for G1–G4 surfaces **first** (per C-rule).
2. **G1** (`t_22b515d1`) — wire the 6 dead-code components, split the 2 bundled effects, build the ~5
   missing; bind 1:1 to repos.
3. **G2** (`t_0779aa21`) — add the Tesla/telemetry-server real telemetry surface; reframe the coffee metric.
4. **G3** (`t_3f23f066`) — enlarge buffer + persistence + context-aware fallback.
5. **G4** (`t_4cdf79b2`) — build the voiceover/transition state machine.
6. **G8** (`t_a58780fd`) — debug pass (start with SCENES‑A dead code).
7. **G6/G7** (`t_cedda2b8`, `t_bd594e8e`) — verify MVP green; run the independent re-verification gate over
   every landed block; re-derive R1–R8 from execution evidence, not summaries.

---

## 8. Evidence sources

- **Source spec:** `docs/prompt.md` (187 lines; §1–§5; R1–R8; C1–C3; P1–P10 FSM).
- **Target spec:** `docs/overhaul/SPEC.md` (§2 NN-1/2/3; §7 catalogue; FR‑CHAT; FR‑VOICE‑DYN; §10/§11);
  `MVP-AND-ROLLOUT.md` (§2.1 per-repo); `IMPLEMENTATION-PLAN.md`; `quality-assurance.md`.
- **Code (HEAD `1dc9537`):** `app/page.tsx`, `components/fx/*`, `components/site/{TelemetryPanel,HeroAvatar}.tsx`,
  `lib/miniVicBrain.ts`, `components/MiniVicBot.tsx`, `app/data/{siteContent,miniVicKnowledge}.ts`,
  `services/api-gateway/src/viseme/smoother.ts`, `scripts/validate/*`, `tests/overhaul/*`,
  `tests/requirements_list.md`, `docs/execution-log.md`.
- **Board:** Hermes kanban `default` — parent `t_00326714`; children G1–G8 as mapped above; SCENES‑A
  `t_1efddf06` (`b2e11c6`).
