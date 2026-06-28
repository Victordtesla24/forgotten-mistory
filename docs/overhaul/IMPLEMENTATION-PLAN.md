# Implementation Plan & To-Do — forgotten-mistory overhaul

Living, traceable task list for the whole overhaul. Every item links to its driver
(`docs/prompt.md` §, SPEC `TC-*`/`FR-*`, or a `quality-assurance.md` `QA-*` finding) and an
acceptance condition. Ordered by the prompt §6 phases. Check items only when **verified**.

Legend: `[ ]` todo · `[~]` in-progress · `[x]` done+verified · `(V)` needs runtime/visual proof.

---

## Phase 0 — Pre-implementation gate ✅ (complete)

- [x] Baseline tag `pre-overhaul-baseline` + branch `overhaul/marvel-grade-portfolio`.
- [x] Master spec + test matrix (`SPEC.md` §10, 1 TC per requirement) — prompt §6 P1.
- [x] Companion docs: ARCHITECTURE, SYSTEM-DESIGN, MOTION-AND-FX-SPEC, TECH-STACK, EDGE-CASES (143 cases), README, CLAUDE, this plan.
- [x] Runnable static audit (`scripts/validate/overhaul_static_audit.mjs`): TONE, MONO (chromatic hex/rgb/hsl/Tailwind), PERF budget, PARITY, TYPE (≤2 font families — SPEC §3.2), SEC, ARCH-BENCH (no `/performance-benchmark` in `out/`) — **7/7 PASS**.
- [x] Monochrome design tokens (`design-tokens.json`, `globals.css :root`, `lib/palette.ts`).
- [x] D-4 assets ~22 MB → ~2.4 MB (EMAIL/TELEPHONE.jpeg deleted); D-5 resumeContent colours → monochrome; QA-CON-02 SIT parity reconciled. First-view network payload ≤2.5 MB now **test-traced** via `tests/overhaul/perf.spec.ts` (596.7–907.3 KB, gzip, static `out/`; OV-PERF/QA8).
- [x] Chromatic cleanup of `globals.css`/`page.tsx`/`MiniVicBot.tsx`/`FloatingDetailBox.tsx`/benchmark (QA-MONO-01..05).
- [~] GSAP 3.15 installed **but imported nowhere** (dead dep — FR-SCROLL still unwired; see Phase 2 scroll task). `components/fx/TelemetryHud.tsx` authored (custom GLSL + volumetric light) and `tsc` clean, **but imported by zero files (orphaned)** — its ShaderMaterial/volumetric pass have never compiled at runtime; GLSL+light render UNVERIFIED until it is mounted (Phase 2 line 37, TC-FR-SIGFX/SHADER/LIGHT).

## Phase 1 — Test suite isolation (prompt §6 P1; QA-TEST-01..04, QA-DR-02) 🔴 highest priority

- [~] **P1-1:** Playwright specs bound to TC IDs under `tests/overhaul/` — DONE for built TCs: `scroll` (FR-SCROLL), `signature` (FR-SIGFX/SHADER/LIGHT), `sections` (FR-NAV/ABOUT/EXP/SKILLS/SEO/RESP), `proof` (FR-PROOF), `contact` (FR-CONTACT), `audit` (NFR-TONE/MONO/PERF/PARITY/SEC/TS). Remaining TCs get specs as their features land. **Verified: full overhaul suite 24 passed / 1 skipped (320px fixme), system Chrome (re-audit #5, 2026-06-13).** (QA-TEST-01)
- [x] **P1-1:** Static unit checks in the suite via `audit.spec.ts` (tone/mono/parity/secret + strict `tsc`) — QA-TEST-02 core covered; placeholder/COMPLETE scan still to add.
- [~] **P1-1:** `tests/site.spec.ts` — retired the false "GSAP retired" assertion (GSAP is now an intentional module dep); fixed the **real nav-open bug** it surfaced (`.nav-overlay.active`→`.open`). Remaining old-UI assertions retire as Phase-2 rebuilds land. (QA-DR-02)
- [x] **P1-1:** `tests/requirements_list.md` repointed at SPEC §10 + TC→test binding table. (QA-TEST-04)
- [ ] Visual-regression baseline scaffolding per signature scene per breakpoint (QA-TEST-03).
- [ ] D-ID/ElevenLabs lifecycle integration test stub `TC-INT-CLONE` (QA-TEST-03).

## Phase 2 — MVP (prompt §6 P2; error-free, monochrome, 1 WebGL block, stable chat)

- [x] **Shell/L2:** monochrome Preloader (motif seed, count 0→100, clip-path reveal ≤1.5s) + Navigation (keyboard/Esc/anchor + **again-on-scroll** — hides on scroll-down, shows on scroll-up with 60px hysteresis, disabled under prefers-reduced-motion — TC-FR-NAV) + responsive grid + footer landmark (QA-ARCH-01). **QA-VERIFIED 2026-06-28:** `tsc` 0; audit 9/9; Playwright TC-NAV-01/02 passed (chromium). (TC-FR-BOOT, TC-FR-NAV)
- [x] **Hero/L3:** dual-pillar CTAs (employer: "Review experience" → #experience, client: "See outcomes" → #proof) + 6 quantified proof cards from resumeContent + HeroAvatar (still→MP4 crossfade, magnetic tilt, speaking pulse) + GitHub/YouTube/Resume/Contact links (TC-FR-HERO, NN-1). **QA-VERIFIED 2026-06-28:** `tsc` 0; audit 9/9. (TC-FR-HERO)
- [x] **Proof bar/L3 (P1-2):** `#proof` (`components/site/ProofBar.tsx`) — 4 resume-accurate metrics (15+ yrs · $5M+ · ≈92% · 10k+ devices @ P95<200ms) from `siteContent.proof`, scroll-in count-up, tabular numerals, reduced-motion shows finals. Mounted Hero→Proof→About. **QA-VERIFIED:** `tests/overhaul/proof.spec.ts` 2 passed (in the 17-pass suite); `tsc` 0; audit 7/7. (TC-FR-PROOF, QA-DR-07)
- [x] **About/Experience/L4:** About section with two tight paragraphs + 4 expandable proof cards; Experience section with all 8 roles + Independent rendered via ExperienceAccordion; **ATO evidence-harness bullet emphasized** with luminous left-border accent (`data-evidence-harness`, white border + gradient glow) — the 92% COBOL/mainframe automation story stands out visually (TC-FR-ABOUT/EXP). **QA-VERIFIED 2026-06-28:** `tsc` 0; audit 9/9. (TC-FR-ABOUT, TC-FR-EXP)
- [x] **Signature scene/L5 (P0-2):** `components/fx/HudFrame.tsx` (recurring monochrome bezel) wraps `TelemetryHud` and is mounted in **2 sections** — hero (quiet backdrop, page.tsx:211) + `#work` (JARVIS telemetry panel, §7 #1, page.tsx:499); `SpaceScene` demoted (opacity 0.42 + bloom 0.55→0.30). `TelemetryHud` no longer orphaned — custom GLSL + volumetric shaft compile at runtime. **QA-VERIFIED 2026-06-13:** `tests/overhaul/signature.spec.ts` **1 passed (34.3 s, chromium)** — HUD renders across ≥2 sections with **zero WebGL console errors**; `tsc` 0; audit 7/7. (TC-FR-SIGFX/SHADER/LIGHT, QA-VFX-01/02/03)
- [x] **GSAP scroll/L1 (P0-1):** `lib/gsap.ts` (client-only ScrollTrigger registration) + `components/site/ScrollRail.tsx` (scrubbed fill + pinned label; `gsap.context`/`matchMedia` reduced-motion branch/`ctx.revert`) mounted in `#experience`. **QA-VERIFIED 2026-06-13:** `tests/overhaul/scroll.spec.ts` **2 passed (42.9 s, chromium)**; `tsc` 0; audit 7/7. TC-FR-SCROLL VERIFIED (quality-assurance.md QA-SCROLL-01). (TC-FR-SCROLL)
- [x] **Typography/L1 (P1-4):** reduced to **2 families** — `Inter` (body) + `Space_Grotesk` (high-contrast grotesque display), both self-hosted via `next/font` (`app/layout.tsx:2,11-23`); Playfair/Roboto/Source-Sans/Source-Code dropped; `:root --font-body/--font-heading/--font-mono` (`app/globals.css:31-34`); metric numerals tabular. **QA-VERIFIED 2026-06-13 (re-audit #5):** `tests/overhaul/typography.spec.ts` **4 passed**; audit `TC-NFR-TYPE` PASS; `tsc` 0; audit 7/7. (TC-NFR-TYPE, SPEC §3.2, QA-FONT-01/02/03)
- [~] **MiniVic/L7 — P0-3 DONE (audit + E2E-regression verified):** sci-fi persona removed end-to-end — `PersonaMode 'scifi'` + `GREETING.scifi` + 10 `scifi` variants (`miniVicKnowledge.ts`), `scifi` `PERSONA_STYLE` (`miniVicBrain.ts`), and the MiniVicBot surface (`ModeKey`, `PERSONA_FOR_MODE`, Sci-Fi button, "Explain in sci-fi" prompt, Rocket branch + import). TONE audit widened (banned `commander/fleet/mission/decorated/squadron` + sci-fi terms; scope now `miniVicKnowledge.ts` + `layout.tsx` meta/OG/JSON-LD + alt/aria) and still **PASS**. Evidence: `tsc` 0; audit 7/7; full-repo grep zero scifi/Rocket; overhaul E2E **3 passed (38.1 s, system Chrome)** — no regression. **Still open (→ P2-1):** monochrome chat-UI visual pass + cloned-voice greeting (TC-FR-CHAT/VOICE). (TC-NFR-TONE done; **TC-NN-3 automated-PASS, manual tone sign-off pending** — story-mode prose theatrical; see quality-assurance.md QA-CON-03)
- [x] **Contact/L3 (P1-3):** in-section **Book a conversation** CTA (`NEXT_PUBLIC_BOOKING_URL` → Calendly/Cal.com; structured `mailto` fallback) + **Download CV** (`/docs/Vik_Resume_Final.pdf`); monochrome cards kept. **QA-VERIFIED:** `tests/overhaul/contact.spec.ts` 1 passed (CTA href valid, CV resolves 200 PDF, email/phone present); `tsc` 0; audit 7/7. **Note:** swap `NEXT_PUBLIC_BOOKING_URL` to the owner's real scheduling link to satisfy the "live endpoint" wording (mailto is the working default). (TC-FR-CONTACT, NN-1)
- [x] **SEO:** JSON-LD (Person + WebSite schema in `layout.tsx`), OG/twitter meta, canonical, favicon/apple-touch-icon retained (TC-FR-SEO). **QA-VERIFIED 2026-06-28:** all meta rendered in SSR output; `tsc` 0; audit 9/9.
- [x] **Gate:** `tsc --noEmit` 0 + audit 9/9 PASS + zero console/runtime errors across MVP (prompt §6 P2). **QA-VERIFIED 2026-06-28:** `tsc` clean; static audit `9/9 PASS`; Playwright nav/hero e2e tests passing; dev server 200 OK with no SSR errors.
- [ ] **MVP review checkpoint** (owner) — screenshots + local preview.

## Phase 3 — Recursive scaling / fan-out (prompt §6 P3; MVP-AND-ROLLOUT §2)

- [ ] **L5 / Sub-Agent A:** remaining per-repo signature effects (MVP-AND-ROLLOUT §2.1 table, one per corporate+personal project — TC-FR-CATALOG, FR-SIGFX). (V)
- [ ] **L7 / Sub-Agent B:** live D-ID ↔ ElevenLabs WebSocket pipeline wired behind `NEXT_PUBLIC_REALTIME_WS_URL`; frame-accurate ~40 ms (TC-FR-CLONE-LIVE, QA-SYS-01/QA-DR-10). (V)
- [ ] **L8 / Sub-Agent C:** multi-source synthesis (GitHub commits/READMEs, YouTube descriptions, local files) → `siteContent`/`miniVicKnowledge`; ≥1 non-resume-sourced fact (TC-FR-SYNTH/MINDSET).
- [ ] **Voiceover/L7:** ambient bed + view-transition-triggered cues, ducking, mute/reduced-motion (TC-FR-VOICE-DYN).
- [ ] Project catalogue ≥10 repos, per-link-200 check (TC-FR-CATALOG).

## Cross-cutting (any phase)

- [~] **CI (P1-1; QA-CI-01..04, QA-DR-03/11):** `deploy.yml` rewritten — `quality` job (`tsc --noEmit` + static audit), `test` across **chromium+webkit+firefox**, **Lighthouse** (`validate:phase02`) + **axe** (`validate:phase06`) jobs; `build` `needs: [quality, lint, test, lighthouse, axe]`. Stages locally-exercised (tsc/audit/Playwright green); **CI-green confirmable only on push** (owner-gated).
- [x] **Security (QA-SEC-01/02, QA-DR-05) — DONE & verified:** client Gemini key kept as the recorded **DEV-8** restricted-public-key deviation (real secrets stay in `services/`); fail-loud missing-key crash retained in `next.config.js`. Added **CSP/HSTS/X-Content-Type-Options/X-Frame-Options/Referrer-Policy/Permissions-Policy** to `next.config.js` (dev/dynamic) + mirrored in `firebase.json` (prod). `security.spec.ts` asserts headers present + no high-severity secret in `out/` + fail-loud. **27/27 suite green** (CSP doesn't break Gemini/YouTube/HMR); tsc 0; audit 7/7. (TC-NFR-SEC)
- [x] **A11y (TC-NFR-A11Y) — DONE & verified:** axe bound in the suite via `tests/overhaul/a11y.spec.ts` (`@axe-core/playwright`, gates on **critical + serious**, WCAG 2.1 A/AA); CI `axe` job also runs `phase06`. Home page is **0 critical + 0 serious** after fixes (footer/terminal-trigger contrast → tokens; nav + hidden-terminal overlays `inert` when closed; decorative viz no longer a scroll-trap). tsc 0; audit 7/7.
- [~] **Perf/FPS (TC-NFR-PERF/FPS/RENDER):** **First-view payload + CLS DONE & test-green** — `tests/overhaul/perf.spec.ts` measures the static `out/` export served with gzip at the `load` event: first-view transfer **596.7–907.3 KB ≤ 2.5 MB**, **CLS 0.0005–0.0011 < 0.05**; negative control (100 KB/0) fails both (gate bites); deferred video excluded + per-asset capped by audit (TC-NFR-PERF, execution-log OV-PERF/QA8). **Lighthouse perf/LCP/TBT UNVERIFIED** — `lighthouserc.json` + `phase02_lighthouse.sh` **repointed `/performance-benchmark` → `/`** (the earlier perf 0.99 was the lightweight benchmark page, not representative); not yet run in an isolated clean-build env. **OPEN RISK:** R3F/three.js homepage may score **<0.90** (R1 production home perf=0.54). **FPS probe UNVERIFIED** — `phase04` is `headless:false` (needs a display) and the mac bundled headless-shell won't install; needs a headed/Xvfb or CI run. Per-browser render-compliance pending. (V)
- [x] **Responsive (TC-FR-RESP, QA-RESP-01/02) — D-6 DONE & verified:** 320px overflow fixed at source — fixed-min auto-fit grids wrapped `minmax(min(Npx,100%),1fr)` (the `live-content` 320px-min column was the 32px culprit; `docW` 352→320). TC-FR-RESP runs all of 320/375/768/1280/2560 (no `fixme`) — **5/5 green**; audit 7/7. Per-breakpoint screenshots still optional polish.
- [x] **IA cleanup (QA-ARCH-02, QA-DR-08):** `/performance-benchmark` excluded from the public static export — page returns `notFound()` under `NEXT_PUBLIC_STATIC_EXPORT=1` and `scripts/build/prune_static_export.mjs` (wired into `build:static`) deletes any emitted artifact; `TC-ARCH-BENCH` audit check guards `out/`. **Verified (execution-log OV6):** `out/` perf-benchmark artifacts = 0; dynamic route still 200. (V) re-confirm on next `build:static`.
- [ ] **Durability (TC-NFR-DURABLE):** offline-after-visit reload renders core content + CV. (V)
- [ ] **Visual verification harness:** run `npm run dev`, capture per-section + per-scene screenshots; record results in `quality-assurance.md` §6.

## Definition of done (whole overhaul)

All `TC-*` VERIFIED on static preview **and** production; audit 7/7; Lighthouse/axe/FPS budgets met; zero console/runtime errors; QA register has no OPEN BLOCKER/HIGH; owner approves; post-deploy V&V (SPEC §12) green.

---

# Appendix A — Stage-2 Architecture: file-change map, FSM mapping, CI-CD & test strategy

> **Council Stage 2 of 5 — Solutions Architect.** The analyst-programmer (Stage 3) builds
> against this. Companion: `MOTION-AND-FX-SPEC.md §9` (GSAP orchestration plan, GLSL shader
> inventory, per-skill scene contracts, avatar contract). **Design only — no production code.**
> Constraints binding on every item: **C1** (UI/UX only — never reword `app/data/*` text),
> **C2** (preserve working behaviour — never regress VERIFIED TCs), **C3** (extend existing
> files; a genuinely-new file requires the justification column below).

## A.1 File-level change map (per requirement)

Existing files dominate (C3). Honest extension targets, grounded in the real tree
(`components/site/*`, `components/fx/*`, `app/*`, `lib/*`, `.github/workflows/*`):

| Req | Existing files to EXTEND | Genuinely-new files (+ justification) |
|---|---|---|
| **R1 shell/UI** | `app/page.tsx` (section composition), `app/globals.css` (tokens/component styles), `app/layout.tsx` (fonts/meta), `components/site/Preloader.tsx`, `Navigation.tsx`, `CursorGlow.tsx`, `components/MotionProvider.tsx` | — none (extend the existing single-page shell) |
| **R1 avatar/voice** | `components/site/HeroAvatar.tsx` (still→MP4 crossfade), `components/MiniVicBot.tsx`, `lib/miniVicBrain.ts`, `services/api-gateway/src/viseme/smoother.ts` | — none (extend 3-tier brain + crossfade) |
| **R2 per-skill FX** | `components/fx/TelemetryHud.tsx`, `PacketFlowGraph.tsx`, `SprintBurndown.tsx`, `AtoEvidenceBar.tsx`, `TokenReflow.tsx`, `DetailMaterialize.tsx`, `HudFrame.tsx`; `components/site/ArchitectureMap.tsx`, `ProjectsCarousel.tsx`, `Dossier.tsx`, `ExpandableCard.tsx`; `lib/palette.ts` | `components/fx/CelestialSphere.tsx` (§7 #8 — no existing astro scene); `components/fx/OrchestrationGraph.tsx` (§7 #12 — no existing agent-graph scene); `components/fx/shaders/{packetFlowEdge,celestialOrbit,agentGraphPulse}.glsl.ts` (new shaders; shaders dir is the established home per dossier §C3) |
| **R3 telemetry** | `components/fx/TelemetryHud.tsx` + `components/site/TelemetryPanel.tsx` — wire **real** `performance.now()` rAF-delta counters (FPS, frame-time); explicitly NOT a coffee-cup sim | — none (harden existing HUD) |
| **R6 CI-CD** | `.github/workflows/deploy.yml`, `lighthouserc.json`, `firebase.json`, `scripts/validate/overhaul_static_audit.mjs`, `scripts/validate/ci_pipeline_robustness.mjs` | — none (upgrade existing 8-job pipeline) |
| **R7 Disney+/mono** | `app/globals.css` (design tokens), `app/page.tsx` (hero full-bleed + `#catalogue` horizontal row), `components/site/ProjectsCarousel.tsx` | — none |
| **R8 tests** | `tests/overhaul/*.spec.ts` (scroll/signature/sections/proof/contact/audit/a11y/security/perf/typography), `tests/site.spec.ts`, `tests/requirements_list.md` | new `tests/overhaul/*.spec.ts` per new TC (catalogue, sigfx-extended, avatar lifecycle) — tests are additive by nature, not a C3 violation |

## A.2 prompt.md SDLC FSM (P1–P10) mapped onto the build

The analyst-programmer runs **every** task (each requirement / sub-feature) through this FSM,
announcing the phase and transition reason; never skip a phase (prompt §3).

| Phase | Gate in this build | Concrete artifact |
|---|---|---|
| **P1 Plan** | requirement listed, file-map row chosen, FSM announced | this Appendix + MOTION-AND-FX §9 |
| **P2 Build** | minimal scoped edit to the file-map targets; no unrelated edits | extend the named component/shader |
| **P3 Test** | run the requirement-linked `tests/overhaul/*.spec.ts` | per A.4 coverage table |
| **P4 Debug** | root-cause from logs/stack on any fail → back to Test | record in `quality-assurance.md` |
| **P5 Code-review** | self-review: correctness/security/perf/readability/C1-C3 adherence | independent-reviewer pass (Stage 4) |
| **P6 Re-test** | re-run ALL requirement-linked tests after review edits | full overhaul suite |
| **P7 Regression** | full regression suite — no previously-passing test fails | `tests/site.spec.ts` + overhaul suite + `tsc --noEmit` 0 + audit 7/7 |
| **P8 Commit** | atomic commit referencing satisfied Rk; **single `main` branch** (R8 — remove other branches/PRs); working tree clean | `git push origin HEAD:main` |
| **P9 Deploy** | only after P3/P5/P6/P7/P8 SUCCESS; Firebase live channel | `FirebaseExtended/action-hosting-deploy` |
| **P10 Verify prod** | open production in the cursor native browser (CDP :9222, R5); confirm via live check + logs/metrics | post-deploy V&V (SPEC §12) |

After P10 → loop to P1 for the next requirement. 3 failed Debug→Re-test→Regression loops ⇒ stop + Failure Report.

## A.3 Requirement-coverage table structure (prompt §4 — builder maintains)

The analyst-programmer keeps this table live, one row per Rk; **no Commit while any Rk lacks a
PASSing test** (prompt §4). Binary status only (PASS/FAIL — no soft language):

| Req | Implementation (file:symbol) | Test(s) (TC-id → spec) | Status |
|---|---|---|---|
| R1 shell | `app/page.tsx`, `Preloader.tsx`, `Navigation.tsx` | TC-FR-NAV/HERO → `sections.spec.ts` | _builder fills_ |
| R1 avatar | `HeroAvatar.tsx`, `MiniVicBot.tsx` | TC-FR-CLONE/VOICE, TC-INT-CLONE → `avatar.spec.ts` *(new)* | _builder fills_ |
| R2 per-skill FX | `components/fx/*` (§9.3 binding) | TC-FR-SIGFX/SHADER/CATALOG → `signature.spec.ts` | _builder fills_ |
| R3 telemetry | `TelemetryHud.tsx` real perf counters | TC-FR-SIGFX (real-data assertion) → `signature.spec.ts` | _builder fills_ |
| R6 CI-CD | `.github/workflows/deploy.yml` | green pipeline on push (owner-gated) | _builder fills_ |
| R7 Disney+/mono | `globals.css`, `page.tsx` hero/catalogue | TC-NFR-MONO + visual baseline | _builder fills_ |
| R8 tests | `tests/overhaul/*` | suite green + regression | _builder fills_ |

## A.4 CI-CD pipeline design (R6 — upgrade the existing 8-job pipeline, do not replace)

The existing `.github/workflows/deploy.yml` is already robust (dossier §5.1): `quality`(tsc+audit)
→ `lint` → `lighthouse` → `axe` → `test`(chromium/webkit/firefox, signal) → `build` → `deploy`
(main only, `FirebaseExtended/action-hosting-deploy`), with `ci_pipeline_robustness.mjs` ensuring
deploy never blocks on a GPU runner. **Upgrades to push it to "most sophisticated" (R6 wording):**

| Stage upgrade | Change | Priority |
|---|---|---|
| Playwright browser cache | `actions/cache` on `~/.cache/ms-playwright` — saves ~90 s/run | **High** |
| PR preview channels | `firebase hosting:channel:deploy preview-${{github.event.number}}` on PR push | Medium |
| Visual-regression gate | Playwright `toHaveScreenshot()` baselines per signature scene/breakpoint, stored as GH artifact | Medium |
| HTML test report | publish Playwright HTML report as a GH Pages artifact | Low |
| `tsc` fast-fail in lint | mirror tsc into lint for <30 s feedback (still hard-gated in quality) | Low |

**Invariants kept (C2):** deploy only on green quality+lint+lighthouse+axe; PR runs never
auto-deploy; fail-loud on missing `GEMINI_API_KEY`; signal tests stay `continue-on-error`; the
robustness check stays. R8 single-branch rule is enforced at **P8 commit** (remove all other
branches/PRs, commit + deploy to `main` only), not in the workflow YAML.

## A.5 Test strategy per requirement (R8 — comprehensive Playwright suite replacing the old one)

Replace the legacy `tests/site.spec.ts` old-UI assertions as Stage-3 rebuilds land; the new
suite is `tests/overhaul/*.spec.ts`, each spec bound to TC ids (TC↔test table in
`tests/requirements_list.md`). Every animation/VFX manually verified in the cursor native
browser (CDP :9222, R5). Regression = full overhaul suite + legacy retained specs + `tsc 0` +
audit 7/7, with **no previously-passing TC failing** (P7).

| Req | New/extended spec | What it proves | Manual-V (cursor browser) |
|---|---|---|---|
| R1 shell | `sections.spec.ts` | nav keyboard/Esc/anchor, hero CTAs, footer landmark | hero full-bleed reveal |
| R1 avatar | `avatar.spec.ts` *(new)* | zero-CLS box, still→MP4 crossfade, tier-fallback, cloned-voice-id hash | lip-sync drift ≤120 ms |
| R2/R3 FX | `signature.spec.ts` (extend) | each §9.3 effect mounts/animates, reduced-motion fallback, **zero WebGL console errors**, real-data (not coffee-cup) assertion | per-scene render Chrome/WebKit/Firefox |
| R6 CI-CD | n/a (pipeline self-tests) | green gates on push; preview channel resolves | PR preview URL live |
| R7 mono | `audit.spec.ts` + visual baseline | TC-NFR-MONO (no chromatic hex/rgb/hsl), Disney+ hero/catalogue layout | side-by-side vs reference |
| R8 regression | full `tests/overhaul/*` | suite green + no regression | full visual sweep, record in `quality-assurance.md §6` |

**Coverage rule (prompt §4):** every Rk needs ≥1 PASSing test before Commit; an independent
reviewer (Stage 4) re-derives each result from actual execution evidence (test output/logs/live
check), never from the builder's summary — Rk stays unverified until evidence is shown.
