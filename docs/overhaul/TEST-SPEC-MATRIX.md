# TEST SPECIFICATION MATRIX

> **G5 TDD-PHASE-1 gate document.** Every requirement R1–R8 and constraint C1–C3 is
> mapped to at least one concrete, executable test BEFORE source code is modified for
> the remaining gaps (G1, G2, G3, G4, G6, G8). This is the root dependency every
> implementation card blocks on — no test spec, no code.

**Repo branch:** `overhaul/marvel-grade-portfolio`  
**Generated:** 2026-06-27  
**TDD enforcement:** `tests came AFTER code` violation corrected — spec first.  
**Gate:** `tsc --noEmit` must be clean before any test run.

---

## §1 · REQUIREMENT-COVERAGE TABLE

Per prompt.md §4: every requirement Rk has ≥1 test Tk that unambiguously proves it.

| Req | Implementation (file:symbol) | Test(s) | Status |
|-----|------------------------------|---------|--------|
| **R1** | `app/page.tsx:Home` `app/layout.tsx` `components/MiniVicBot.tsx` `components/site/HeroAvatar.tsx` — full UI/UX redesign + real-time AI chatbot video avatar + audio voice clone | **T-R1-AVATAR** (avatar.spec.ts), **T-R1-CHATBOT** (miniVicBot.spec.ts), **T-R1-SHELL** (boot.spec.ts, hero.spec.ts, navigation), **T-R1-VOICE** (avatar voice-id hash) | SPECIFIED |
| **R2** | `components/fx/PacketFlowGraph.tsx` `components/fx/CelestialSphere.tsx` `components/fx/OrchestrationGraph.tsx` `app/components/SpaceScene.tsx` `components/fx/TelemetryHud.tsx` — each tangible skill via unique Three.js/R3F/hyperframes VFX | **T-R2-SCENES** (signature-scenes.spec.ts per-scene smoke), **T-R2-PER-PROJECT** (one smoke per G1 project, see §2.G1), **T-R2-SHADERS** (shader compile check) | SPECIFIED |
| **R3** | `components/fx/TelemetryHud.tsx` `components/site/TelemetryPanel.tsx` — real browser perf-counter HUD (FPS/frame-time rAF deltas, Canvas2D sparklines); JARVIS + Tesla dashboard telemetry (see G2) | **T-R3-TELEMETRY** (telemetry.spec.ts — FPS HUD renders, sparkline data non-random), **T-R3-JARVIS** (G2 JARVIS block), **T-R3-TESLA** (G2 Tesla dashboard block) | SPECIFIED |
| **R4** | Process requirement — multi-agent orchestration used | **T-R4-BUILD** (build completes, static export verified) | SPECIFIED |
| **R5** | Cursor native browser CDP on port 9222 — manual verification vehicle | **T-R5-MANUAL** (manual — CDP launched; all visual-regression Playwright screenshots serve as evidence channel) | MANUAL |
| **R6** | `.github/workflows/` — robust CI/CD pipeline | **T-R6-CI** (ci_pipeline.test.mjs — pipeline definition checks), **T-R6-DEPLOY** (deployment_v2.spec.ts) | SPECIFIED |
| **R7** | Disney+ Marvel-page inspiration — design language, full-bleed hero, glass-card motifs | **T-R7-DESIGN** (visual-regression — hero.spec.ts, catalogue.spec.ts, sections.spec.ts comparing against Disney+ reference snapshots) | SPECIFIED |
| **R8** | New comprehensive test suite; manual animation/VFX verification via CDP; regression gate | **T-R8-REGRESSION** (all .spec.ts files in tests/overhaul/), **T-R8-AUDIT** (audit.spec.ts, a11y.spec.ts), **T-R8-MANUAL** (CDP manual verify) | SPECIFIED |
| **C1** | Content integrity — resume/website text MUST NOT change (UI/UX layout only) | **T-C1-CONTENT** (content diff against pre-overhaul baseline — signature.spec.ts, durable.spec.ts) | SPECIFIED |
| **C2** | Preserve all existing implementations; no regression of working behaviour | **T-C2-REGRESSION** (full regression suite run before any commit — every existing .spec.ts must pass) | SPECIFIED |
| **C3** | No new files when extending an existing file achieves the same result | **T-C3-FILESYSTEM** (filesystem lint — audit.spec.ts `no_stray_files` check, scripts/validate/overhaul_static_audit.mjs) | SPECIFIED |

---

## §2 · GAP-SPECIFIC TEST SPECIFICATIONS

### §2.1 · G1 — PER-PROJECT WEBGL EFFECTS (10 projects, 10 dedicated effects)

**Parent card:** `t_22b515d1`  
**Source:** prompt.md §5/R2 — one dedicated WebGL/real-time canvas effect per project, each tailored to functional core.  
**Test framework:** Playwright visual-regression (`toHaveScreenshot`) + smoke (component mounts, zero console errors).

| Test ID | Project | Effect Theme | Test File | Type | Acceptance |
|---------|---------|-------------|-----------|------|------------|
| **TG1-01** | EFDDH-Jira-Analytics-Dashboard | Sprint-velocity burn / agile cadence flow | `tests/overhaul/g1-project-effects.spec.ts` | Visual regression + smoke | Component mounts, renders without console errors, monochrome palette verified, no FPS regression vs G6 baseline |
| **TG1-02** | tailor-resume-with-ai | Token/embedding match streams | `tests/overhaul/g1-project-effects.spec.ts` | Visual regression + smoke | Component mounts, renders without console errors, monochrome preserved |
| **TG1-03** | relationship-timeline-feature | Temporal journey curve / timeline particles | `tests/overhaul/g1-project-effects.spec.ts` | Visual regression + smoke | Component mounts, renders without console errors, monochrome preserved |
| **TG1-04** | AI-Gmail-Mailbox-Manager | Inbox triage / classification routing | `tests/overhaul/g1-project-effects.spec.ts` | Visual regression + smoke | Component mounts, renders without console errors, monochrome preserved |
| **TG1-05** | btr-demo / Birth-Time-Rectifier | Celestial/ephemeris rectification | `tests/overhaul/g1-project-effects.spec.ts` | Visual regression + smoke | Component mounts, renders without console errors, monochrome preserved |
| **TG1-06** | jyotish-shastra | Chart/celestial sphere (extends existing CelestialSphere) | `tests/overhaul/g1-project-effects.spec.ts` | Visual regression + smoke | Component mounts, renders without console errors, monochrome preserved |
| **TG1-07** | rishi-prajnya | Guidance/decision graph | `tests/overhaul/g1-project-effects.spec.ts` | Visual regression + smoke | Component mounts, renders without console errors, monochrome preserved |
| **TG1-08** | Advanced-Prompt-Creator | Prompt token assembly | `tests/overhaul/g1-project-effects.spec.ts` | Visual regression + smoke | Component mounts, renders without console errors, monochrome preserved |
| **TG1-09** | telemetry-server / tesla-api / ride-with-vic-app | Live-signal stream visual (coordinate with G2) | `tests/overhaul/g1-project-effects.spec.ts` | Visual regression + smoke | Component mounts, renders without console errors, no duplication with G2 telemetry |
| **TG1-10** | Error-Management-System | JARVIS autonomous repair loop | `tests/overhaul/g1-project-effects.spec.ts` | Visual regression + smoke | Component mounts, renders without console errors, monochrome preserved |

**G1 cross-cutting checks (also in g1-project-effects.spec.ts):**
- **TG1-ALL-MONOCHROME:** All 10 effects use only PALETTE tokens (no hue) — pixel-scan each screenshot
- **TG1-ALL-CONSOLE:** Zero console errors across all 10 effects on mount
- **TG1-ALL-FPS:** No FPS regression vs G6 baseline (FPS ≥ G6_measured_FPS * 0.95)
- **TG1-ALL-TEARDOWN:** Clean unmount — zero leaked listeners/animations per effect

---

### §2.2 · G2 — PROJECT TELEMETRY: JARVIS + TESLA DASHBOARD

**Parent card:** `t_0779aa21`  
**Source:** prompt.md §5/R3 — "a realtime telemetry must be shown and not some coffee cup simulation"

| Test ID | Component | Test File | Type | Acceptance |
|---------|-----------|-----------|------|------------|
| **TG2-01** | JARVIS telemetry block mounts | `tests/overhaul/g2-telemetry.spec.ts` | Smoke | Component renders, `data-testid="jarvis-telemetry"` visible |
| **TG2-02** | JARVIS data-binding is live | `tests/overhaul/g2-telemetry.spec.ts` | Data-binding assertion | Verify displayed values change over 5s (not static — store snapshots at t=1s, t=5s, assert difference) |
| **TG2-03** | JARVIS data source is NOT Math.random() | `tests/overhaul/g2-telemetry.spec.ts` | Data integrity | Verify deterministic feed or WebSocket source label is present; snapshot cycle check shows non-uniform patterns |
| **TG2-04** | Tesla dashboard block mounts | `tests/overhaul/g2-telemetry.spec.ts` | Smoke | Component renders, `data-testid="tesla-dashboard"` visible |
| **TG2-05** | Tesla dashboard data-binding is live | `tests/overhaul/g2-telemetry.spec.ts` | Data-binding assertion | Verify speed/charge/power/range-style gauges update over 5s |
| **TG2-06** | No memory leak (60s mount) | `tests/overhaul/g2-telemetry.spec.ts` | Performance | Mount both blocks, record `performance.memory.usedJSHeapSize` at t=5s and t=60s, assert delta < 5MB |
| **TG2-07** | Zero console errors | `tests/overhaul/g2-telemetry.spec.ts` | Quality | Page console listener captures zero errors during 60s window |
| **TG2-08** | Clean unmount — no leaked rAF/interval | `tests/overhaul/g2-telemetry.spec.ts` | Stability | Unmount both blocks, assert zero animation frames pending, zero intervals active |
| **TG2-09** | Monochrome preserved | `tests/overhaul/g2-telemetry.spec.ts` | Visual | Pixel-scan telemetry blocks — all rendered colors in PALETTE range |
| **TG2-10** | Composes with perf HUD (t_5ce8b08e) | `tests/overhaul/g2-telemetry.spec.ts` | Integration | Mount TelemetryHud + JARVIS + Tesla together, assert all three render without conflict/overlay |

---

### §2.3 · G3 — CHATBOT CONTEXT: EXPANDED KB + MULTI-TURN RETENTION

**Parent card:** `t_3f23f066`  
**Source:** prompt.md §5/R1 — expand context-retention buffers + KB so agent answers ALL business-client queries

| Test ID | Component | Test File | Type | Acceptance |
|---------|-----------|-----------|------|------------|
| **TG3-01** | Multi-turn context retention | `tests/overhaul/g3-chatbot.spec.ts` | Unit (lib/miniVicBrain) | Ask Q1="What's your current role?", then Q2="How many squads in that program?" — answer to Q2 references "Agile Kookaburras squad / eight-squad SIT program" without re-stating Q1 context |
| **TG3-02** | Services offered query | `tests/overhaul/g3-chatbot.spec.ts` | KB coverage | "What services do you offer?" → grounded answer referencing AI solutions architecture, agile delivery, test automation |
| **TG3-03** | Engagement model query | `tests/overhaul/g3-chatbot.spec.ts` | KB coverage | "How do you engage with clients?" → grounded answer with contact info |
| **TG3-04** | ATO Payday Super query | `tests/overhaul/g3-chatbot.spec.ts` | KB coverage | "Tell me about your ATO work" → answer references Payday Super program, Kookaburras squad, test automation |
| **TG3-05** | Portfolio projects query | `tests/overhaul/g3-chatbot.spec.ts` | KB coverage | "What projects have you built?" → answer lists ≥3 projects from siteContent.ts |
| **TG3-06** | Availability/contact query | `tests/overhaul/g3-chatbot.spec.ts` | KB coverage | "Are you available?" → answer includes email/phone from siteContent.ts |
| **TG3-07** | No fabricated facts | `tests/overhaul/g3-chatbot.spec.ts` | Data integrity | Run 10 queries; every answer's claims trace to siteContent.ts / resumeContent.ts / miniVicKnowledge.ts (regex match against source data) |
| **TG3-08** | 3-tier fallback chain intact | `tests/overhaul/g3-chatbot.spec.ts` | Integration | Config: NEXT_PUBLIC_STATIC_EXPORT=1 → brain returns from local KB (not Gemini, not API). Greeting renders. |
| **TG3-09** | Voice greeting preserved (C2) | `tests/overhaul/g3-chatbot.spec.ts` | Regression | Greeting MP3 hash matches CLONED_VOICE_GREETING_HASH (from avatar.spec.ts) |
| **TG3-10** | Static-host KB answers all business-client queries | `tests/overhaul/g3-chatbot.spec.ts` | KB coverage matrix | Defined query set (≥12 professional queries) — every query returns non-fallback answer on static-host tier |

---

### §2.4 · G4 — VOICEOVER SYNC: AMBIENT + TRIGGERED AUDIO

**Parent card:** `t_4cdf79b2`  
**Source:** prompt.md §5 — sync ambient and triggered audio with on-screen view transitions

| Test ID | Component | Test File | Type | Acceptance |
|---------|-----------|-----------|------|------------|
| **TG4-01** | Ambient layer initializes on user gesture | `tests/overhaul/g4-voiceover.spec.ts` | Integration | After click/tap, ambient audio context created — no autoplay before gesture |
| **TG4-02** | Triggered cue fires on correct transition | `tests/overhaul/g4-voiceover.spec.ts` | Timing | Scroll to section T3 (Work); assert cue fires within 500ms of ScrollTrigger onEnter |
| **TG4-03** | No double-fire | `tests/overhaul/g4-voiceover.spec.ts` | Timing | Scroll in/out/in of T3 section — assert exactly 1 cue per enter (not 2+) |
| **TG4-04** | No overlap between cues | `tests/overhaul/g4-voiceover.spec.ts` | Timing | Rapid scroll through T1→T7 — assert each cue completes or is cleanly interrupted before next fires |
| **TG4-05** | Mute control silences all audio | `tests/overhaul/g4-voiceover.spec.ts` | State | Toggle mute → assert audioContext state is 'suspended' or gain node is 0; toggle unmute → resumes |
| **TG4-06** | Prefers-reduced-motion silences audio | `tests/overhaul/g4-voiceover.spec.ts` | A11y | Emulate `prefers-reduced-motion: reduce` — assert no audio plays, no AudioContext created |
| **TG4-07** | Avatar voice lip-sync timing | `tests/overhaul/g4-voiceover.spec.ts` | Timing | Trigger avatar greeting; measure time from audio-start to first visible mouth-waveform frame ≤ 120ms |
| **TG4-08** | Smooth cross-fade (ambient↔triggered) | `tests/overhaul/g4-voiceover.spec.ts` | Audio quality | Trigger a cue while ambient is playing — assert gain transition has no audible pop (check for gain-step discontinuities in audio graph) |
| **TG4-09** | No audio glitch on rapid transitions | `tests/overhaul/g4-voiceover.spec.ts` | Stability | Scroll rapidly through all 7 sections 3x — assert zero `AudioContext` error events, zero `MediaError` |
| **TG4-10** | Clean teardown — no leaked audio nodes | `tests/overhaul/g4-voiceover.spec.ts` | Memory | Mount audio controller, scroll through all sections, unmount — assert AudioContext closed, zero active source nodes |

---

### §2.5 · G6 — MVP BASELINE GATE

**Parent card:** `t_cedda2b8`  
**Source:** prompt.md §3 SDLC — error-free core before expansion

| Test ID | Gate | Test File | Type | Acceptance |
|---------|------|-----------|------|------------|
| **TG6-01** | `npm run build:static` zero errors | `tests/overhaul/g6-mvp-baseline.spec.ts` | Build | Exit code 0, stderr empty of ERROR, output dir `out/` exists with index.html |
| **TG6-02** | `tsc --noEmit` clean | `tests/overhaul/g6-mvp-baseline.spec.ts` | Type check | Exit code 0, zero type errors in output |
| **TG6-03** | Zero console errors on first load | `tests/overhaul/g6-mvp-baseline.spec.ts` | Quality | Navigate to `/`, capture all console events for 10s, assert zero `error`-level events |
| **TG6-04** | Navigation end-to-end | `tests/overhaul/g6-mvp-baseline.spec.ts` | Integration | Preloader → Navigation → click each nav item → assert target section is in viewport |
| **TG6-05** | Monochrome tokens intact | `tests/overhaul/g6-mvp-baseline.spec.ts` | Visual | Screenshot of full page; pixel-scan: all rendered colors in PALETTE range (near-black → luminous cool-white, no hue) |
| **TG6-06** | Exactly ONE WebGL block renders | `tests/overhaul/g6-mvp-baseline.spec.ts` | Visual regression | Screenshot evidence of SpaceScene starfield rendering (Playwright `toHaveScreenshot` baseline) |
| **TG6-07** | Chat pipeline mounts | `tests/overhaul/g6-mvp-baseline.spec.ts` | Integration | Click MiniVicBot launcher → chat interface visible, greeting shown |
| **TG6-08** | Chat degrades gracefully offline | `tests/overhaul/g6-mvp-baseline.spec.ts` | Integration | Config: `NEXT_PUBLIC_STATIC_EXPORT=1` → send message → receives local-KB answer (not HTTP error) |
| **TG6-09** | No regression vs baseline | `tests/overhaul/g6-mvp-baseline.spec.ts` | Regression | Diff working tree against `pre-overhaul-baseline` tag — assert no removed functionality |
| **TG6-10** | All existing tests still pass | `tests/overhaul/g6-mvp-baseline.spec.ts` | Regression | Run full `tests/overhaul/*.spec.ts` suite → 100% pass |

---

### §2.6 · G8 — DEBUG/OVERHAUL: BROKEN ANIMATIONS + MISALIGNED VOICEOVERS

**Parent card:** `t_a58780fd`  
**Source:** prompt.md — "completely debug, refactor, overhaul"  
**Depends on:** G1 (WebGL effects exist), G2 (telemetry blocks exist), G4 (voiceover architecture exists)

| Test ID | Defect Class | Test File | Type | Acceptance |
|---------|-------------|-----------|------|------------|
| **TG8-01** | GSAP/ScrollTrigger T1 animation audit | `tests/overhaul/g8-debug.spec.ts` | Animation | Scroll through HeroScroll T1 — assert animation completes (no stuck pin), FPS ≥ 30 during animation |
| **TG8-02** | GSAP/ScrollTrigger T2–T7 animation audit | `tests/overhaul/g8-debug.spec.ts` | Animation | Scroll through every remaining GSAP timeline (ProofScroll, WorkScroll, CatalogueScroll, SkillsScroll, ContactScroll) — assert each completes without console errors |
| **TG8-03** | Framer Motion component audit | `tests/overhaul/g8-debug.spec.ts` | Animation | Audit all Framer Motion components (Reveal, ExpandableCard, FloatingDetailBox, etc.) — assert each animates on-scroll without `layout animations` warnings |
| **TG8-04** | Three.js/R3F scene audit | `tests/overhaul/g8-debug.spec.ts` | Animation | Audit SpaceScene, PacketFlowGraph, CelestialSphere, OrchestrationGraph — assert each renders shader uniforms, no `WebGL: INVALID_OPERATION` console warnings |
| **TG8-05** | Reduced-motion compliance | `tests/overhaul/g8-debug.spec.ts` | A11y | Emulate `prefers-reduced-motion: reduce` — assert zero `requestAnimationFrame` loops active after initial render, all animations at `currentTime: 0` / `progress: 1` (instant complete) |
| **TG8-06** | Voiceover alignment audit | `tests/overhaul/g8-debug.spec.ts` | Audio | Trigger every voiceover cue on its intended transition — assert each cue fires ≤ 250ms of trigger event |
| **TG8-07** | Lip-sync drift audit | `tests/overhaul/g8-debug.spec.ts` | Audio/Visual | Measure mouth waveform peaks vs audio envelope peaks — assert cross-correlation peak offset < 40ms (≤1 frame at 25fps) |
| **TG8-08** | Zero console errors full scroll-through | `tests/overhaul/g8-debug.spec.ts` | Quality | Simulate full scroll-through of every section (T1→T7 + contact + footer); capture all console events; assert zero errors and zero warnings |
| **TG8-09** | No layout thrash | `tests/overhaul/g8-debug.spec.ts` | Performance | Record `PerformanceObserver` for layout-shift entries during full scroll-through — assert cumulative CLS < 0.1 |
| **TG8-10** | Defect log completeness | `tests/overhaul/g8-debug.spec.ts` | Documentation | Assert defect log file exists (`docs/overhaul/G8-DEFECT-LOG.md`), contains ≥1 entry per defect class, each entry has evidence + root cause + fix |

---

## §3 · TEST INFRASTRUCTURE

### §3.1 · Test Runners

| Layer | Runner | Config | Command |
|-------|--------|--------|---------|
| Unit (TS) | Vitest | `vitest.config.ts` | `npx vitest run` |
| Unit (JS/CJS) | Node + built-in assert | `tests/*.test.mjs` | `node tests/ci_pipeline.test.mjs` |
| Integration / E2E | Playwright | `playwright.config.ts` | `npx playwright test` |
| Visual regression | Playwright `toHaveScreenshot` | `tests/screenshots/` | `npx playwright test --update-snapshots` (baseline), `npx playwright test` (verify) |
| Type check | `tsc --noEmit` | `tsconfig.json` (strict) | `npx tsc --noEmit` |
| Build | Next.js static export | `next.config.js` | `npm run build:static` |

### §3.2 · Test Scaffolding Plan

Per TDD (skill: test-driven-development) and the G5 gate rules:

1. **Step 1 — Scaffold test files with `.skip`:** Create test files with `test.skip('...')` stubs matching every Test ID in §2. These are committed FIRST so the test structure is visible and reviewable before any implementation code changes.
2. **Step 2 — Each implementation card un-skips and makes GREEN:** When G1–G8 workers implement, they remove `.skip` from their assigned test IDs, run them to RED (verify failure), then implement to GREEN.
3. **Step 3 — No source code until GREEN cycle complete:** The test-first cycle is enforced structurally — test files exist first, implementation cards carry G5 as a dependency.

Scaffolding files to create (with `.skip` placeholders):

```
tests/overhaul/
├── g1-project-effects.spec.ts     # TG1-01 through TG1-10 + cross-cutting
├── g2-telemetry.spec.ts           # TG2-01 through TG2-10
├── g3-chatbot.spec.ts             # TG3-01 through TG3-10
├── g4-voiceover.spec.ts           # TG4-01 through TG4-10
├── g6-mvp-baseline.spec.ts        # TG6-01 through TG6-10
└── g8-debug.spec.ts               # TG8-01 through TG8-10
```

**Note:** Existing test files (avatar.spec.ts, miniVicBot.spec.ts, etc.) are NOT scaffolding — they already contain working tests. This matrix references them (see §1 coverage table) but does not duplicate them.

### §3.3 · Visual-Regression Baseline Setup

```bash
# 1. Start dev server
npm run dev

# 2. Create baseline screenshots (run once, commit to git)
UPDATE_SNAPSHOTS=1 npx playwright test --project=chromium

# 3. Verify against baselines (run in CI / on each commit)
npx playwright test --project=chromium
```

Screenshot baselines live in `tests/screenshots/` (chromium, webkit, firefox subdirs per Playwright convention). They are committed to git and verified in CI.

### §3.4 · CI Integration

The CI pipeline (`.github/workflows/`) must run in this order:

1. `tsc --noEmit` — type-check gate
2. `npm run build:static` — build gate
3. `npx vitest run` — unit tests
4. `npx playwright test` — integration/visual-regression (with dev server)
5. `node tests/ci_pipeline.test.mjs` — pipeline self-test

If any gate fails, the CI run fails — no deployment.

---

## §4 · TEST ID INDEX

Quick lookup: every test ID → file + type.

| Test ID | File | Type | Gap / Req |
|---------|------|------|-----------|
| T-R1-AVATAR | `tests/overhaul/avatar.spec.ts` | Visual regression | R1 |
| T-R1-CHATBOT | `tests/overhaul/miniVicBot.spec.ts` | Integration | R1 |
| T-R1-SHELL | `tests/overhaul/boot.spec.ts`, `hero.spec.ts` | Integration | R1 |
| T-R1-VOICE | `tests/overhaul/avatar.spec.ts` | Unit (hash) | R1 |
| T-R2-SCENES | `tests/overhaul/signature-scenes.spec.ts` | Visual + smoke | R2 |
| T-R2-PER-PROJECT | `tests/overhaul/g1-project-effects.spec.ts` | Visual + smoke | R2, G1 |
| T-R2-SHADERS | `tests/overhaul/vfx-new.spec.ts` | Compile check | R2 |
| T-R3-TELEMETRY | `tests/overhaul/telemetry.spec.ts` | Visual + data | R3 |
| T-R3-JARVIS | `tests/overhaul/g2-telemetry.spec.ts` | Data-binding | R3, G2 |
| T-R3-TESLA | `tests/overhaul/g2-telemetry.spec.ts` | Data-binding | R3, G2 |
| T-R4-BUILD | `tests/overhaul/g6-mvp-baseline.spec.ts` | Build gate | R4, G6 |
| T-R5-MANUAL | CDP port 9222 | Manual | R5 |
| T-R6-CI | `tests/ci_pipeline.test.mjs` | Pipeline check | R6 |
| T-R6-DEPLOY | `tests/deployment_v2.spec.ts` | Deploy check | R6 |
| T-R7-DESIGN | `tests/overhaul/hero.spec.ts`, `catalogue.spec.ts`, `sections.spec.ts` | Visual regression | R7 |
| T-R8-REGRESSION | All `tests/overhaul/*.spec.ts` | Full suite | R8 |
| T-R8-AUDIT | `tests/overhaul/audit.spec.ts`, `a11y.spec.ts` | Audit | R8 |
| T-R8-MANUAL | CDP manual verify | Manual | R8 |
| T-C1-CONTENT | `tests/overhaul/signature.spec.ts`, `durable.spec.ts` | Content diff | C1 |
| T-C2-REGRESSION | Existing `.spec.ts` files (all) | Regression | C2 |
| T-C3-FILESYSTEM | `tests/overhaul/audit.spec.ts`, `scripts/validate/overhaul_static_audit.mjs` | Filesystem lint | C3 |
| TG1-01–TG1-10 | `tests/overhaul/g1-project-effects.spec.ts` | Visual + smoke | G1 |
| TG2-01–TG2-10 | `tests/overhaul/g2-telemetry.spec.ts` | Data-binding + perf | G2 |
| TG3-01–TG3-10 | `tests/overhaul/g3-chatbot.spec.ts` | Unit + KB coverage | G3 |
| TG4-01–TG4-10 | `tests/overhaul/g4-voiceover.spec.ts` | Timing + audio | G4 |
| TG6-01–TG6-10 | `tests/overhaul/g6-mvp-baseline.spec.ts` | Gate (all layers) | G6 |
| TG8-01–TG8-10 | `tests/overhaul/g8-debug.spec.ts` | Debug + audit | G8 |

---

## §5 · ACCEPTANCE CHECKLIST (this card)

- [x] Matrix document exists at `docs/overhaul/TEST-SPEC-MATRIX.md`
- [x] Test ID listed for each of R1–R8 (10 test IDs covering all R1–R8)
- [x] Test ID listed for each of C1–C3 (3 test IDs)
- [x] G1 acceptance tests specified (10 project effects + 4 cross-cutting = 14 test IDs)
- [x] G2 acceptance tests specified (10 test IDs)
- [x] G3 acceptance tests specified (10 test IDs)
- [x] G4 acceptance tests specified (10 test IDs)
- [x] G6 acceptance tests specified (10 test IDs)
- [x] G8 acceptance tests specified (10 test IDs)
- [x] `tsc --noEmit` clean is part of the matrix gate (TG6-02)
- [x] Test scaffolding plan included (6 new spec files to create with `.skip` stubs)
- [x] No source/feature code edited — SPECIFICATION ONLY
- [ ] Document committed to the repo (next step)
