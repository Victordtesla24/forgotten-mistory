# ARCHITECTURE DECISIONS — Forgotten-Mistory UI/UX Overhaul

> **Stage 2 of 5** — Solutions Architect output for the Forgotten-Mistory overhaul.
> **Author:** Council Solutions Architect (`claude-opus-4-8`).
> **Status:** Complete ✓ — design only, no code. The analyst-programmer implements from this.
> **Date:** 2026-06-27
> **Binding inputs:** `docs/prompt.md` (R1–R8, C1–C3) · `RESEARCH-DOSSIER.md` (Stage 1) ·
> `SPEC.md` (master) · `MOTION-AND-FX-SPEC.md` · `TECH-STACK.md` · `ARCHITECTURE.md` ·
> `SYSTEM-DESIGN.md` · `MVP-AND-ROLLOUT.md` · live source under `app/`, `components/`, `lib/`,
> `.github/workflows/`, `scripts/validate/`.
> **Authority:** `docs/prompt.md` is the binding SoT; where this plan must diverge from a naive
> reading it records the deviation explicitly (SPEC §0.1 convention), in the prompt's favour.

---

## 0. Executive summary & the C3 governing principle

The codebase is **already ~55–60% built** (SPEC v2 header) with a mature, monochrome,
test-first foundation: GSAP+ScrollTrigger is wired (`lib/gsap.ts` → `ScrollRail.tsx`), custom
GLSL ships (`components/fx/shaders/hud.ts`), the signature telemetry-HUD motif recurs via
`HudFrame`/`TelemetryHud`, a `components/fx/*` effect library exists, and the CI pipeline is
**already hardened** to the exact robustness contract this plan must protect. Therefore the
governing architectural principle for every decision below is **C3 — extend, never recreate**:

> **No new file is justified where extending an existing file achieves the same result.** This
> plan flags every genuinely-new file with an explicit justification, and defaults all other
> work to *extension of a named existing file*. (Prompt C3; SPEC §4 Structural Scope Freeze.)

The overhaul's job is **not** a greenfield rebuild — it is to (a) close the named defect
register D-1…D-11 (SPEC §13), (b) raise the existing scenes to studio-cinematic fidelity at the
NFR-PERF/FPS budget, and (c) make the "completely new" feel (R1/R4) real through motion
orchestration and per-skill VFX, **without** regressing a single working behaviour (C2) or
touching resume/site **text** (C1 — layout/format may change, words may not).

### 0.1 The one decision that needs owner/PM ratification

**CI/CD migration tension (R6).** R6 mandates the *global template* (a thin caller to the
canonical reusable workflow). The current `deploy.yml` is bespoke but encodes a **stricter,
hard-won robustness contract** the linear reusable workflow does not yet express (deploy must
never transitively depend on an offline GPU runner — the PR#4 root cause). My recommendation
(§7, **ADR-CICD-01**) is: **extend the canonical reusable workflow to support a non-gating
signal job *first*, then migrate** — keeping the current hardened pipeline until that extension
is verified, because a naive migration *re-introduces the exact deploy-hang defect*. This is the
single judgement call the implementer should not make unilaterally; it is called out here and in
§7 for sign-off.

---

## 1. Requirement → Component Design Map (R1–R8)

For each requirement: the **exact existing files to extend** (C3), and any genuinely-new file
with justification. "Section ids" reference the live `app/page.tsx` composition.

### R1 — Remove & replace the UI/UX with a posh, fully interactive, animated Three.js site + real-time AI video/voice clone

R1 is the umbrella. It decomposes into the section-level work below; nothing in R1 authorises a
new page shell — `app/page.tsx` already composes every section and is the single extension point.

| Surface | Extend (existing) | Change | New? |
|---|---|---|---|
| Page composition | `app/page.tsx` | Re-orchestrate section order/wrappers for the scroll narrative (§3); mount per-skill VFX (§2). No new page file. | — |
| Global tokens / motion | `app/globals.css` (`:root`), `design-tokens.json`, `lib/palette.ts` | Monochrome tokens already present (D-5 closed in tokens); harden motion tokens per MOTION-AND-FX-SPEC §1. | — |
| Metadata / JSON-LD | `app/layout.tsx` | Keep Person+WebSite JSON-LD; ensure tone-clean descriptions (NFR-TONE covers meta/OG/JSON-LD). | — |
| Atmosphere (starfield) | `app/components/SpaceScene.tsx` | Demote behind content, monochrome-tune, perf-guard (C2: never remove). | — |
| AI clone (UI) | `components/MiniVicBot.tsx` | Live video-avatar + voice surface; 3-tier degradation intact. | — |
| AI clone (reasoning) | `lib/miniVicBrain.ts` | Keep 3-tier ladder (C2 invariant); expand context buffer (FR-CHAT). | — |
| Hero avatar (video/still) | `components/site/HeroAvatar.tsx` | Reserve box (zero CLS, FR-CLONE); pre-rendered synced MP4 default. | — |

> **R1 verdict:** zero new top-level files. The "completely new" experience (R1/R4) is delivered
> by motion (§3), VFX (§2), shaders (§4) and palette discipline layered onto the existing shell —
> not by replacing the shell. This is the literal reading of C2+C3 over R1's "remove and replace".

### R2 — Each tangible skill → a unique, fully-implemented Three.js VFX / infographic

Full treatment in **§2**. Component map: extend `components/fx/*` and `components/site/ArchitectureMap.tsx`;
exactly **one** new file (`components/fx/NeuralField.tsx`) is justified there.

### R3 — Real-time telemetry (not a "coffee-cup simulation")

| Extend | Change |
|---|---|
| `components/fx/TelemetryHud.tsx` + `components/fx/shaders/hud.ts` | Already a custom-GLSL radar HUD with live-easing gauges + sparkline. Upgrade the data layer from a static `SPARKLINE_DATA` array to **genuinely real browser counters** — `requestAnimationFrame` delta-based FPS / frame-time fed through a rolling 60-frame ring buffer (RESEARCH-DOSSIER §2.5). The "P95 198 ms" readout stays labelled-as-demo (honest, NN-3) but FPS/frame-time become real. |
| `components/site/TelemetryPanel.tsx` | The hero's DOM telemetry panel — wire to the same real-counter source so hero + HUD agree. |

> R3 is a **data-source** change, not a new component. The "real telemetry" claim becomes literally
> true for the FPS/frame-time channels; latency/throughput stay clearly-labelled plausible demo
> values (MOTION-AND-FX-SPEC §4 explicitly permits this).

### R4 — Use all capabilities (parallel agents, TDD, MCP, plugins); leverage existing work; produce a fresh-baked feel

Process requirement, satisfied by the council/fan-out orchestration and the test-first rule
(SPEC §5/§10). No component map. Honour C3 ("leverage what you can from existing") — this whole
plan is the answer to R4.

### R5 — Verify in the Cursor native browser (CDP on :9222)

Tooling/verification requirement (mapped to the memory `cursor-inbuilt-browser-cdp` and the
`cursor-cdp` MCP). No site component. The visual-verification step (§7 gates, SPEC §12 runbook)
drives the Cursor Simple Browser via CDP on :9222 for the manual VFX sign-off (R8).

### R6 — Robust, sophisticated CI/CD using the global template

Full treatment in **§7** (ADR-CICD-01). Extend `.github/workflows/deploy.yml`,
`scripts/validate/ci_pipeline_robustness.mjs`, `tests/ci_pipeline.test.mjs`. No new workflow files
on this repo; the *extension* lands in the shared reusable workflow repo.

### R7 — Disney+/Marvel inspiration

Design-language requirement folded into §3 (scroll choreography) and §4 (cinematic shader/light
fidelity). Per RESEARCH-DOSSIER §1: borrow the **dark full-bleed, brand-first, restraint-of-motion**
treatment — **not** the carousel-as-nav pattern (a portfolio is narrative, not a content catalogue).
Extends `app/globals.css` + `app/page.tsx` (hero treatment), no new files.

### R8 — Comprehensive test suite; one branch; deploy; verify in Cursor browser

Test-architecture requirement. Extend `tests/overhaul/*` (one spec per FR/NFR per SPEC §10) and
the `scripts/validate/*` harness. Branch/PR hygiene and production V&V are process (SPEC §12), not
components.

---

## 2. Per-Skill VFX Assignments (R2)

**Design rule:** one **unique** visualization per tangible skill domain, monochrome, evidence-tied,
each with a `prefers-reduced-motion` static fallback (mandatory). **C3 reconciliation:** the
`components/fx/*` library + `ArchitectureMap.tsx` already cover four of the five domains — only the
AI/ML neural visualization is genuinely absent. **DEV-7 reconciliation** (SPEC §0.1): the flagship
per-skill scenes ship WebGL/R3F (literal R2 reading); lighter cadence/topology scenes ship SVG/Canvas,
read as satisfying the prompt's "real-time canvas" intent — this is the recorded, tested-acceptable
interpretation, so the implementer must **not** rewrite the SVG scenes in WebGL.

| Tangible skill | Visualization (monochrome) | Tech | Extend / New | File | Evidence tie |
|---|---|---|---|---|---|
| **AI / ML** | Neural inference constellation — nodes fire along weighted edges, signal propagates left→right, settles to a stable activation. | R3F instanced + custom GLSL edge-glow | **NEW (justified)** | `components/fx/NeuralField.tsx` (+ shader in `components/fx/shaders/`) | Langfuse/Phoenix eval stack; AI/ML delivery depth (FR-MINDSET) |
| **Cloud / DevOps** | Infrastructure topology — edge clients → Gemini → telemetry → governance, request paths trace live. | SVG/Canvas (DEV-7) | **EXTEND** | `components/site/ArchitectureMap.tsx` | Cloud modernisation; .NET/Azure transformation |
| **Full-Stack / Realtime** | WebSocket packet-flow along graph edges + legacy-terminal→pipeline morph. | R3F instanced (`PacketFlowGraph`) + SVG/Canvas (`AtoEvidenceBar`) | **EXTEND** | `components/fx/PacketFlowGraph.tsx`, `components/fx/AtoEvidenceBar.tsx` | P95 < 200 ms / 10k devices (ANZ); ATO ≈92% evidence reduction |
| **Scrum / Agile** | Sprint burndown/burnup with velocity ticks. | SVG + Framer (DEV-7) | **EXTEND** | `components/fx/SprintBurndown.tsx` | EFDDH JIRA analytics; Agile Kookaburras squad |
| **Project / Program Mgmt** | PI-cadence swimlane + milestone rail (Gantt-like program view). | SVG + Framer (DEV-7) | **EXTEND (variant)** | `components/fx/SprintBurndown.tsx` → add a `mode="program"` variant **before** spawning a new `ProgramCadence.tsx` | $5M+ portfolio; 5+ squads / 40 resources |

> **New-file budget for R2: exactly one** (`NeuralField.tsx`), justified because no neural-net
> visualization exists and it is conceptually distinct from both the telemetry HUD and the
> multi-agent orchestration graph (SPEC §7 #12). **C3 escalation rule:** PM/Program Management
> reuses `SprintBurndown` via a `mode` prop; only if that prop cannot cleanly host both the
> sprint and program views does a second file (`ProgramCadence.tsx`) become justified — the
> implementer must record that decision in the execution log if taken.

**Token reflow** (`components/fx/TokenReflow.tsx`) and the **MiniVic clone** already cover the
prompt-engineering and conversational-AI signal; they are mounted but not counted as "skill VFX"
to avoid double-assigning AI/ML.

---

## 3. GSAP + ScrollTrigger Orchestration Plan (FR-SCROLL, R1/R7)

**Division of labour (immutable, SPEC §3.3 / MOTION-AND-FX-SPEC §1.1):** GSAP+ScrollTrigger owns
*orchestral, scrubbed/pinned, scroll-tied* motion; **Framer Motion owns component DOM motion only**
(reveals, layout transitions, micro-interactions). Do not cross these streams.

**Pattern contract (already proven in `ScrollRail.tsx` — replicate exactly):** one
`gsap.context()` per section component; `gsap.matchMedia()` with a
`(prefers-reduced-motion: reduce)` branch that **sets final states with no scrub/pin**;
`ctx.revert()` on unmount; `ScrollTrigger` registered once, client-only, via `lib/gsap.ts`;
ScrollTrigger drives **only** `transform`/`opacity`/uniform values, **never** layout.

### 3.1 Scroll timeline map (which sections pin / scrub / reveal)

| # | Section (`page.tsx` id) | GSAP role | Framer role | Reduced-motion fallback |
|---|---|---|---|---|
| 1 | `#hero` | **Scrub** HUD uniform values + telemetry ramps as you leave the hero (extend the existing Framer parallax with a GSAP value-scrub on `TelemetryPanel`/HUD) | hero line clip-reveal, CTA stagger (existing) | static final values, still avatar |
| 2 | `ProofBar` | — | count-up on in-view (Framer territory — existing) | final metric values shown |
| 3 | `#experience` | **Pin + scrub** (existing `ScrollRail` — keep, do not regress FR-SCROLL ✓) | accordion height/opacity | rail filled, head at rest (already implemented) |
| 4 | `#work` (Signature FX) | **Pin each flagship scene in turn**, scrub through its animation (Bandinopla layered pattern, RESEARCH-DOSSIER §4.1/§4.3) | card reveal stagger | static poster frame per scene |
| 5 | `ProjectsCarousel` | **Scroll-triggered horizontal reveal** (vertical scroll progress → horizontal card advance) | hover lift + hairline glow | static card grid, native scroll |
| 6 | `#about`, `#skills`, `MindsetProjection`, `Dossier`, `#contact` | — | Framer reveals only | static |

> **Reduced-motion is non-negotiable and tested (TC-FR-SCROLL, TC-NFR-A11Y).** Every new
> ScrollTrigger added (#1, #4, #5) ships its `matchMedia('reduce')` branch in the same commit as
> the animation — never as a follow-up.

### 3.2 New GSAP wiring — extend, don't create

- **#hero scrub & #work pinning:** add to `app/page.tsx` inline `gsap.context()` blocks **or**
  a thin reusable hook `lib/useScrollScene.ts` (**NEW, justified** only if ≥2 sections share the
  pin/scrub boilerplate — otherwise inline, no new file). Default: inline first; extract to a hook
  only on the second repetition (YAGNI / SYSTEM-DESIGN §3).
- **Horizontal carousel reveal:** extend `components/site/ProjectsCarousel.tsx` with a
  ScrollTrigger that maps vertical progress → `x` transform; no new file.
- **Voiceover cues (FR-VOICE-DYN):** the ScrollTrigger `onEnter` callbacks become the audio-sync
  event source (debounced) consumed by the voiceover layer — wire in the section components, no new
  file.

---

## 4. GLSL Shader & Volumetric-Lighting Inventory (FR-SHADER / FR-LIGHT)

**Monochrome discipline (NFR-MONO, enforced):** every shader colour enters as a `uColor` uniform
sourced from `lib/palette.ts` — **zero chromatic literals in GLSL** (the existing `hud.ts` already
obeys this; the audit's hex-scan covers components, palette is the only sanctioned hex source).
All shaders: explicit `precision highp float`, guarded uniforms, a software/reduced-motion fallback,
and must compile clean (no WebGL program warnings) across Chrome/WebKit/Firefox (TC-FR-SHADER,
NFR-RENDER).

### 4.1 Existing shaders (harden — do NOT rewrite)

| Shader | File | Role | Action |
|---|---|---|---|
| `hudVertex` | `components/fx/shaders/hud.ts` | shared vertex (passes `vUv`) | keep |
| `holoRingFragment` | `components/fx/shaders/hud.ts` | radar rings + rotating sweep + contact blips (FR-SHADER ✓) | harden; DPR-fallback verified |
| `lightShaftFragment` | `components/fx/shaders/hud.ts` | faux-volumetric stage-light cone + motes + scatter (FR-LIGHT ✓) | keep as the budget-safe volumetric on the HUD |
| Nebula FBM | `app/components/SpaceScene.tsx` (inline) | starfield nebula field | monochrome-tune, demote behind content |

### 4.2 New shaders (justified)

| Shader | File | Justification | Budget |
|---|---|---|---|
| Edge-glow / signal-pulse | `components/fx/shaders/neural.ts` (**NEW**) | needed by `NeuralField.tsx` (§2); no existing shader animates weighted-edge activation | additive, instanced; ≤1 ShaderMaterial program |
| (Optional) raymarched volumetric pass | `components/fx/shaders/volumetric.ts` (**NEW, deferred**) | RESEARCH-DOSSIER §2.2 recommends a half-res raymarched god-ray ONLY if the `lightShaftFragment` faux-volumetric proves insufficient on the flagship JARVIS scene. **Do not build pre-emptively** — the existing `lightShaftFragment` already satisfies FR-LIGHT/TC-FR-LIGHT. Flag for post-MVP. | half-res buffer, capped samples, disabled on low-power/reduced-motion |

### 4.3 Post-processing stack (order is load-bearing — MOTION-AND-FX-SPEC §2)

Per flagship scene, extend the existing `EffectComposer` in `TelemetryHud.tsx`:
`Bloom (selective, luminanceThreshold ~0.3) → DepthOfField (foreground HUD focus) → Vignette →
Noise (grain, ~0.015)`. **Text stays out of bloom** (render UI in DOM/SVG, not WebGL — already the
pattern: `Sparkline`/`hud-readout` are DOM). Whole composer disabled under reduced-motion/low-power
(already wired via the `frozen` branch). Reference the `cinematic-threejs-hud` skill for selective
bloom + DoF tuning (postprocessing v2.x).

---

## 5. GLSL/VFX flagship-scene assembly (R1/R2 cinematic bar)

The flagship **JARVIS telemetry HUD** is the NN-2 signature motif and the proof of the cinematic
bar. Its assembly is already correct (`HudFrame` → `TelemetryHud` → `shaders/hud.ts`); the overhaul
*hardens* it:

1. **Real data** (R3, §1/R3) — replace static sparkline data with live FPS/frame-time counters.
2. **Lazy single-context discipline** (NFR-FPS) — `HudFrame lazy` already defers the WebGL context
   until `#work` scrolls in, so the home view boots with one live context (`SpaceScene`). Preserve
   this; the hero uses `HudFrame variant="backdrop" scene={false}` (bezel only, no second context).
3. **Volumetric depth** (FR-LIGHT) — `lightShaftFragment` behind the dish; raymarched pass only if
   needed (§4.2, deferred).
4. **Pin+scrub** (§3 #4) — the `#work` HUD pins and scrubs its gauge targets with scroll progress.

> **Hard perf invariant (NFR-FPS / gotcha):** never raise DPR (capped 1–1.5), never add a third
> concurrent WebGL context to the home view, no per-frame allocation in `useFrame` (mutate refs +
> `needsUpdate`), teardown on `visibilitychange`. These are already honoured — the implementer
> must keep them honoured.

---

## 6. File-Change Map (consolidated, C3-audited)

**Legend:** ✎ extend existing · ✨ new file (justified) · ⚙ config/CI · 🧪 test.

### 6.1 Extend (the default — no new files)

```
app/page.tsx                          ✎ R1/R3/§3  section orchestration, GSAP scrub/pin blocks, VFX mounts
app/globals.css                       ✎ R1/R7     motion tokens, hero dark full-bleed, monochrome polish
app/layout.tsx                        ✎ R1        tone-clean meta/JSON-LD (NFR-TONE)
lib/palette.ts                        ✎ R2/§4     any new uniform colours (monochrome only)
lib/gsap.ts                           ✎ §3        (already correct; no change expected)
lib/miniVicBrain.ts                   ✎ R1/FR-CHAT expanded context buffer; 3-tier ladder intact (C2)
app/components/SpaceScene.tsx         ✎ R1/§4     demote, monochrome-tune, perf-guard (never remove, C2)
components/MiniVicBot.tsx             ✎ R1        live avatar/voice surface; graceful degradation intact
components/site/HeroAvatar.tsx        ✎ FR-CLONE  reserve box (zero CLS), synced pre-render default
components/site/TelemetryPanel.tsx    ✎ R3        live counter source
components/site/ArchitectureMap.tsx   ✎ R2        Cloud/DevOps topology (extend)
components/site/ProjectsCarousel.tsx  ✎ §3 #5     scroll-triggered horizontal reveal
components/fx/TelemetryHud.tsx        ✎ R3/§5     real data, pin+scrub, post-FX tune
components/fx/shaders/hud.ts          ✎ §4.1      harden holoRing/lightShaft
components/fx/PacketFlowGraph.tsx     ✎ R2        Full-Stack/realtime packet-flow (extend)
components/fx/AtoEvidenceBar.tsx      ✎ R2        legacy→pipeline morph (extend)
components/fx/SprintBurndown.tsx      ✎ R2        Scrum + PM `mode="program"` variant (extend)
components/fx/TokenReflow.tsx         ✎ R2        (mounted; prompt-eng signal — keep)
```

### 6.2 New files (the entire justified budget)

```
components/fx/NeuralField.tsx         ✨ R2   AI/ML neural-inference viz — no equivalent exists
components/fx/shaders/neural.ts       ✨ §4.2 edge-glow GLSL for NeuralField (palette-uniform only)
lib/useScrollScene.ts                 ✨ §3.2 ONLY IF ≥2 sections share pin/scrub boilerplate (else inline)
components/fx/shaders/volumetric.ts   ✨ §4.2 DEFERRED — only if faux-volumetric proves insufficient
components/fx/ProgramCadence.tsx      ✨ §2   DEFERRED — only if SprintBurndown `mode` can't host both
```

> **Four of five new files are conditional.** The unconditional new-file budget for the whole
> overhaul is **two** (`NeuralField.tsx` + its shader). Every other requirement extends an existing
> file. Any deviation from this budget must be logged in `docs/execution-log.md` with its C3
> justification.

### 6.3 CI / config / tests

```
.github/workflows/deploy.yml          ⚙ R6   see §7 ADR-CICD-01 (target: thin caller; keep hardened until reusable extended)
scripts/validate/ci_pipeline_robustness.mjs  ⚙ R6  invariant guard; update post-migration to audit rendered graph
tests/ci_pipeline.test.mjs            🧪 R6   contract tests for the robustness invariant
tests/overhaul/*.spec.ts              🧪 R8   one spec per FR/NFR (SPEC §10); add specs for new VFX + scroll scenes
scripts/validate/overhaul_static_audit.mjs   ⚙      tone/mono/perf/parity/secret/fonts — keep green
```

---

## 7. CI/CD Design (R6) — ADR-CICD-01

### 7.1 Current state (verified, already robust)

`.github/workflows/deploy.yml` runs parallel jobs and gates deploy on the **always-available** set
only:

```
deploy (push main only) ──needs──▶ build ──needs──▶ [ quality, lint, lighthouse, axe ]
                                                       (all ubuntu-latest)
   test      (ubuntu-latest, continue-on-error, NOT in build.needs)  ── non-gating signal
   test-gpu  (E2E_RUNNER_LABELS-gated, continue-on-error, NOT in build.needs)  ── optional signal
```

- `quality` = `tsc --noEmit` + `overhaul_static_audit.mjs` + `ci_pipeline_robustness.mjs` +
  `node --test tests/ci_pipeline.test.mjs`.
- The GPU-dependent Playwright specs (backdrop-filter compositing + heavy R3F frame-rates) **cannot
  pass on GitHub's GPU-less runners**, so they are **signal, not gate** (`continue-on-error`, NOT in
  `build.needs`). This is **enforced**, not conventional, by `ci_pipeline_robustness.mjs`
  (transitive-closure check: every deploy-critical job must be GitHub-hosted) + `tests/ci_pipeline.test.mjs`.
- **This is the corrected design** (prior-art memory: the PR#4 "gate deploy on a self-hosted GPU
  runner" design *hung* deploy when the Mac runner was offline → stale site). It must not regress.

### 7.2 The R6 tension

R6 mandates *the global template* — a **thin caller** to the canonical reusable workflow
(`Victordtesla24/prompt-reconstruction-engine/.github/workflows/reusable-ci-cd.yml`), whose pipeline
is **linear**: `lint → custom-check → test → build → deploy → smoke`. A naive migration would place
the GPU-dependent E2E in `test`, **transitively gating `build`+`deploy` on it** — re-introducing the
exact deploy-hang the robustness guard exists to prevent. The `global-cicd` skill is explicit:
*"never regress a project's existing richer gates… extend the reusable workflow — do not fork it."*

### 7.3 Decision

**Adopt the global thin-caller template as the target, but extend the reusable workflow to express
the non-gating-signal contract _before_ migrating. Keep the current hardened `deploy.yml` until the
extension is verified.**

**Step 1 — Extend the canonical reusable workflow** (in the `prompt-reconstruction-engine` repo, per
"extend don't fork"): add first-class inputs for a **non-gating signal test job** —
`signal_test_cmd` (runs `continue-on-error`, **excluded from the deploy critical path**) and optional
`gpu_runner_labels` (an opt-in hardware-GL job that *also* never gates deploy). Also add a
`pr_preview` deploy mode for Firebase channel previews (RESEARCH-DOSSIER §5.4; the skill notes
PR-preview channels may require a reusable-workflow extension).

**Step 2 — Migrate forgotten-mistory to a thin caller** mapping current → template:

| Reusable input | Value |
|---|---|
| `node_version` | `"20"` |
| `lint_cmd` | `npm run lint` |
| `custom_check_cmd` | `npx tsc --noEmit && node scripts/validate/overhaul_static_audit.mjs && node scripts/validate/ci_pipeline_robustness.mjs && node --test tests/ci_pipeline.test.mjs` |
| `test_cmd` | always-green Playwright subset + `npm run validate:phase02` (Lighthouse) + `npm run validate:phase06` (axe) — folded in as **gating** so richer gates are not lost |
| `signal_test_cmd` | the GPU-dependent specs under `xvfb-run` — **non-gating** |
| `gpu_runner_labels` | inherit `vars.E2E_RUNNER_LABELS` (optional, never gates) |
| `build_cmd` | `npm run build:static` (GEMINI_API_KEY fail-loud — NFR-SEC) |
| `deploy_target` / `firebase_project` | `firebase` / `forgotten-mistory` |
| `smoke_url` | `https://forgotten-mistory.web.app/` |
| caller `permissions` | `contents: read` (+ `checks: write` for the deploy comment) |
| secrets | `inherit` (`FIREBASE_SERVICE_ACCOUNT`, `GEMINI_API_KEY`) |

**Step 3 — Keep the invariant guard.** `ci_pipeline_robustness.mjs` stays; after migration, update it
to audit the **rendered caller+reusable graph** and assert `deploy` never transitively `needs` the
signal job. The guard is the permanent contract that survives any future template change.

**Step 4 — Non-regressing upgrades** (research dossier §5.4), all additive: Playwright browser cache
(`actions/cache` on `~/.cache/ms-playwright`, ~90 s/run), Firebase PR preview channels
(`firebase hosting:channel:deploy preview-${PR}`), optional Playwright HTML report artifact.

**Until Step 1 ships and is verified, the current `deploy.yml` stays as-is** — it is *not* a fork of
the reusable workflow (it predates it and over-satisfies its robustness bar) and it already passes
the guard + contract tests. This sequencing is the owner/PM ratification point (§0.1).

### 7.4 Gate semantics (unchanged through the migration)

- Deploy only on `push` to `main`, after every **gating** job is green. PRs get full CI, never deploy.
- `concurrency`: cancel superseded **PR** runs; **never** cancel a push-to-main run (it owns the
  Firebase release).
- Fail loud on missing secrets (`GEMINI_API_KEY`), never silent-degrade (NFR-SEC).
- Forks skip the secret-dependent `build:static` signal (no repo secrets) — already handled.

---

## 8. Risk Register (assumption → mitigation)

| # | Risk / assumption | Impact | Mitigation |
|---|---|---|---|
| RK-1 | Naive R6 migration re-gates deploy on the GPU/E2E job | **Stale live site** (the PR#4 defect) | §7 ADR-CICD-01: extend reusable workflow first; keep guard `ci_pipeline_robustness.mjs`; migrate only after verification |
| RK-2 | New per-skill VFX (`NeuralField`) + flagship pin/scrub push a 3rd live WebGL context onto the home view | FPS regression (NFR-FPS) | one live context discipline (`HudFrame lazy`, `scene={false}` echoes); `NeuralField` lazy-mounts in `#work`/skills only; DPR cap intact |
| RK-3 | C3 erosion — implementer creates new files where extension suffices | scope creep, audit drift | unconditional new-file budget = **2**; conditional = 3; every extra logged with justification (§6) |
| RK-4 | "Real-time telemetry" (R3) read as requiring real network data the static site can't source | unmet R3 / dishonest viz (NN-3) | FPS/frame-time become *genuinely* real; latency/throughput stay labelled-demo (MOTION-AND-FX-SPEC §4 permits) |
| RK-5 | Touching layout near resume text breaches C1 | content regression | C1 = format/layout free, **text immutable**; tone linter (`overhaul_static_audit.mjs`) + parity diff (TC-FR-PARITY) gate every change |
| RK-6 | New ScrollTrigger animations ship without reduced-motion branch | a11y failure (TC-NFR-A11Y) | `matchMedia('reduce')` branch in the **same commit** as each animation; replicate `ScrollRail` pattern exactly |
| RK-7 | Volumetric raymarch pass built pre-emptively | budget/perf waste | DEFERRED (§4.2) — `lightShaftFragment` already satisfies FR-LIGHT; build only on demonstrated insufficiency |
| RK-8 | New GLSL introduces chromatic literals | monochrome failure (NFR-MONO) | colours only via `uColor` uniform from `lib/palette.ts`; audit hex-scan covers components |
| RK-9 | Live D-ID/ElevenLabs path assumed on static Firebase | broken clone on prod | live pipeline is VPS-only behind `NEXT_PUBLIC_REALTIME_WS_URL`; static ships pre-rendered synced MP4 + 3-tier brain (DEV-4) |
| RK-10 | `.env.production` read/committed, or it breaks `next build` | secret leak / phantom build failure | radioactive file — never print/commit; move aside before `next build` (recursion bug, memory) |
| RK-11 | Sibling agent holds `next dev` on :8080 during Playwright | flaky ERR_CONNECTION_REFUSED | wait for idle window, don't kill the peer (memory); CI serves read-only `out/` not `next start` |
| RK-12 | next/font classes drift onto `<body>` | `:root` font tokens compute empty | keep next/font vars on `<html>` in `app/layout.tsx` (memory) |
| RK-13 | Paid D-ID/ElevenLabs call made during build | cost gate breach | **ask before any paid API call** — cost gate, not deploy gate (CLAUDE.md) |

---

## 9. Definition of Done for the implementation that follows this plan

- `tsc --noEmit` clean; `lint` clean; static audit 7/7; relevant Playwright green (SPEC §10).
- Lighthouse mobile perf ≥90, a11y ≥95; LCP<2.5s; CLS<0.05; no asset >500 KB; payload ≤2.5 MB.
- Every animated surface has a working reduced-motion fallback; keyboard-navigable; monochrome;
  tone-clean; CV⇄site parity intact (C1).
- One live WebGL context on the home view; ≥55 FPS desktop / ≥30 mobile on signature scenes.
- CI/CD: `ci_pipeline_robustness.mjs` PASS; deploy gates only on always-available runners.
- Execution log (`docs/execution-log.md`) updated per change; any new file beyond the §6.2 budget
  carries a logged C3 justification.

---

*End of ARCHITECTURE-DECISIONS (Stage 2). Hand-off: the analyst-programmer implements from §1–§6;
the owner/PM ratifies the §7 / §0.1 CI-CD sequencing before R6 migration begins.*
