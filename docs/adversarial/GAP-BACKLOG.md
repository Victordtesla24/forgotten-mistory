# GAP BACKLOG — ADV 20260905T2315Z (patch immediately, parallel)

**Live FAIL** on `9136bc59`. Prior 1556Z/1451Z backlogs are **superseded for status**; IDs reused.

Contract: `docs/prompt.md` + paste `docs/ORCHESTRATOR-MASTER-PROMPT.md`.  
Spawn **only** §5 profiles via `/root/.sub-agents/hierarchy/profile_map.yaml`.  
Each gap → Kanban task → worktree → push branch → `deploy.yml` / `fm-deploy-cadence.timer` (≤10 min **visible** ships).  
Independent **reviewer** against https://forgotten-mistory.web.app/ after **every** Deploy (O2/O6).  
**Never** mark architecture markdown or docs commits as live PASS.

## Closed on live (do not rework)

| ID | Status | Evidence |
|----|--------|----------|
| **G-MV1** | **HOLD PASS** | Live pill labelled “Ask Mini Vic”. Do **not** `display:none` below 834px. Dock opacity/z-index still a separate G-E2 issue. |
| **G-V3** | **PASS** | Rest-plate primary strokes ≥4.5:1 on `9136bc59`. |
| **G-L1** | **PASS** (instrument) | Envelope field, 24.98 s reading, gold jaws LinkedIn+GitHub. Channel *words* still white (nit). |
| **G-M2** | **PASS** | Greeting MP3 hash === on-screen intro. |

## P0 — next cadence windows (dispatch in parallel NOW)

| ID | Section | Acceptance (binary) | Files | Profile |
|----|---------|---------------------|-------|---------|
| **G-H1** | hero | First viewport: one dominant visual plane (full-bleed video or GL) ≥~75% weight. Brand, ≤1 headline, ≤1 non-CV sentence, ≤1 CTA group. Photograph **in** the plane — not a résumé stack + colour still below. Ledger **below** the fold. Recruiter names the set-piece in one sentence. | `components/sections/Hero/*`, `hero.ts` | researcher → solutions-architect → analyst-programmer |
| **G-H5** | hero/R5 | Ship ≥1080p path toward 4K **or** publish asset-ladder that says no higher source exists and **stop any R5 claim**. Stop 404 on `my-hero-avatar.mp4`. Do not serve 720p24 as the hero product. | `public/assets/*`, Hero | analyst-programmer + researcher |
| **G-H6** | palette | Desaturate hero still to B/W/gold **or** `docs/architecture/PALETTE-EXCEPTIONS.md` + test pinning the one chromatic exception. Colour-without-memo = FAIL. | Hero CSS, stills | analyst-programmer |
| **G-A3** | about | Recruiter recall of `#about` is the **GL field**, not the SVG radar. Hide SVG 3s on GPU load — remaining picture still tells ten sectors; restore SVG and field still ≥~75% weight. Gold/hatch honesty stays green. **Reopen** any board “G-A3 PASS”. | `About/*`, `field.glsl.ts` | analyst-programmer |
| **G-C1** | R4 client | Real calendar URL from a **named env key** on Listen **and** Vitrine engage — **or** one single honest mailto (same subject/body) and drop dual products. Two different mailto promises = FAIL. | `listen.ts`, vitrine engage | solutions-architect → analyst-programmer |
| **G-M4** | MiniVic | Hosting `POST /api/chat` TTFB **&lt;1.5s** on a **cold** probe (not only Cloud Run origin). | `MiniVicBot.tsx`, `functions/`, Hosting rewrite | analyst-programmer |
| **G-R2** | §0.4 | Live JSON must not be `provider: openai` as the happy path. OpenRouter first; on 402 **Anthropic OAuth only** — never `ANTHROPIC_API_KEY`. Record routing in evidence. Drop `MINIVIC LIVE` unless Higgsfield+WSS actually live. | `functions/index.js`, client labels | analyst-programmer + reviewer |
| **G-X2** | R2 | ≥7 **visible cinematic** scenes at 60 fps with reduced-motion — **not** a `data-scene` census. HyperFrames in product **or** honest “zero-credit, not shipped” + incremental UHD GLSL that **is** the story. | Scene mounts | solutions-architect → analyst-programmer |
| **G-R3** | R3 | Keep full realtime Higgsfield avatar **OPEN/honest** if credits block it. Do not claim R3 PASS. Ship G-M4 + G-R2 + honest badge in the meantime. | MiniVic, functions | researcher + analyst-programmer |

## P1 — following windows

| ID | Directive |
|----|-----------|
| **G-E2** | Experience: recruiter recall ≠ Gantt. ≥2 visible strata depth planes. MiniVic must not occlude `[data-chart]` / `.trackYears`. Do not hide the pill (G-MV1). |
| **G-S2** | Skills: `skills-bench` is the narrative carrier; quiet Download CV allowed. Table may annotate. |
| **G-H2** | Atmosphere readable as product; no fake 60 fps on SwiftShader. |
| **G-NEW-1** | Freeze dock `opacity` so first-fold keyboard users still see Ask Mini Vic **or** document that it appears after `#hero` — recruiter-visible at 390 after scroll. |

## Parallelism / CI (HARD)

1. Max **2** Playwright/Chrome-heavy lanes if load average &gt; 8; otherwise ≤4 implementer worktrees.
2. **Never** hold a visible UI merge for full suite green (O3). `build:static` + smoke → push → Deploy. Suites **after** ship.
3. Cap agent runtime **≤30 min**; split overruns.
4. No Hermes. No `ANTHROPIC_API_KEY`. No Owner questions. No “holding for go-ahead.”
5. Append `artifacts/delegation-ledger.jsonl` before commits.
6. Cycle reports: **Deploy run id + live `build-commit`**. Docs-only SHA = O5 FAIL.
7. Credits blocked → §0.4 OAuth + achievable slice. Full R3 stays **open**.
8. Reopen any board “done” that still fails **this** live review (especially G-A3, G-H1).
9. If Claude Pro/Max **session limit**: write INBOX + board, do not idle; resume at reset with MASTER prompt.
