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

- [ ] **Shell/L2:** monochrome Preloader (motif seed) + Navigation (keyboard/Esc/anchor — TC-FR-NAV) + responsive grid + footer landmark (QA-ARCH-01).
- [ ] **Hero/L3:** dual-pillar CTAs + one quantified proof + avatar (TC-FR-HERO, NN-1).
- [x] **Proof bar/L3 (P1-2):** `#proof` (`components/site/ProofBar.tsx`) — 4 resume-accurate metrics (15+ yrs · $5M+ · ≈92% · 10k+ devices @ P95<200ms) from `siteContent.proof`, scroll-in count-up, tabular numerals, reduced-motion shows finals. Mounted Hero→Proof→About. **QA-VERIFIED:** `tests/overhaul/proof.spec.ts` 2 passed (in the 17-pass suite); `tsc` 0; audit 7/7. (TC-FR-PROOF, QA-DR-07)
- [ ] **About/Experience/L4:** tighten copy; ATO evidence-harness emphasis (TC-FR-ABOUT/EXP).
- [x] **Signature scene/L5 (P0-2):** `components/fx/HudFrame.tsx` (recurring monochrome bezel) wraps `TelemetryHud` and is mounted in **2 sections** — hero (quiet backdrop, page.tsx:211) + `#work` (JARVIS telemetry panel, §7 #1, page.tsx:499); `SpaceScene` demoted (opacity 0.42 + bloom 0.55→0.30). `TelemetryHud` no longer orphaned — custom GLSL + volumetric shaft compile at runtime. **QA-VERIFIED 2026-06-13:** `tests/overhaul/signature.spec.ts` **1 passed (34.3 s, chromium)** — HUD renders across ≥2 sections with **zero WebGL console errors**; `tsc` 0; audit 7/7. (TC-FR-SIGFX/SHADER/LIGHT, QA-VFX-01/02/03)
- [x] **GSAP scroll/L1 (P0-1):** `lib/gsap.ts` (client-only ScrollTrigger registration) + `components/site/ScrollRail.tsx` (scrubbed fill + pinned label; `gsap.context`/`matchMedia` reduced-motion branch/`ctx.revert`) mounted in `#experience`. **QA-VERIFIED 2026-06-13:** `tests/overhaul/scroll.spec.ts` **2 passed (42.9 s, chromium)**; `tsc` 0; audit 7/7. TC-FR-SCROLL VERIFIED (quality-assurance.md QA-SCROLL-01). (TC-FR-SCROLL)
- [x] **Typography/L1 (P1-4):** reduced to **2 families** — `Inter` (body) + `Space_Grotesk` (high-contrast grotesque display), both self-hosted via `next/font` (`app/layout.tsx:2,11-23`); Playfair/Roboto/Source-Sans/Source-Code dropped; `:root --font-body/--font-heading/--font-mono` (`app/globals.css:31-34`); metric numerals tabular. **QA-VERIFIED 2026-06-13 (re-audit #5):** `tests/overhaul/typography.spec.ts` **4 passed**; audit `TC-NFR-TYPE` PASS; `tsc` 0; audit 7/7. (TC-NFR-TYPE, SPEC §3.2, QA-FONT-01/02/03)
- [~] **MiniVic/L7 — P0-3 DONE (audit + E2E-regression verified):** sci-fi persona removed end-to-end — `PersonaMode 'scifi'` + `GREETING.scifi` + 10 `scifi` variants (`miniVicKnowledge.ts`), `scifi` `PERSONA_STYLE` (`miniVicBrain.ts`), and the MiniVicBot surface (`ModeKey`, `PERSONA_FOR_MODE`, Sci-Fi button, "Explain in sci-fi" prompt, Rocket branch + import). TONE audit widened (banned `commander/fleet/mission/decorated/squadron` + sci-fi terms; scope now `miniVicKnowledge.ts` + `layout.tsx` meta/OG/JSON-LD + alt/aria) and still **PASS**. Evidence: `tsc` 0; audit 7/7; full-repo grep zero scifi/Rocket; overhaul E2E **3 passed (38.1 s, system Chrome)** — no regression. **Still open (→ P2-1):** monochrome chat-UI visual pass + cloned-voice greeting (TC-FR-CHAT/VOICE). (TC-NFR-TONE done; **TC-NN-3 automated-PASS, manual tone sign-off pending** — story-mode prose theatrical; see quality-assurance.md QA-CON-03)
- [x] **Contact/L3 (P1-3):** in-section **Book a conversation** CTA (`NEXT_PUBLIC_BOOKING_URL` → Calendly/Cal.com; structured `mailto` fallback) + **Download CV** (`/docs/Vik_Resume_Final.pdf`); monochrome cards kept. **QA-VERIFIED:** `tests/overhaul/contact.spec.ts` 1 passed (CTA href valid, CV resolves 200 PDF, email/phone present); `tsc` 0; audit 7/7. **Note:** swap `NEXT_PUBLIC_BOOKING_URL` to the owner's real scheduling link to satisfy the "live endpoint" wording (mailto is the working default). (TC-FR-CONTACT, NN-1)
- [ ] **SEO:** JSON-LD/OG/sitemap/favicon retained (TC-FR-SEO).
- [ ] **Gate:** `tsc --noEmit` 0 + audit 7/7 + zero console/runtime errors across MVP (prompt §6 P2).
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
