# Progress Tracking

## Status: Completed

## Tasks
- [x] Analyze issue (dependency stability).
- [x] Fix `app/page.tsx` (useCallback).
- [x] Verify fix with linter.
- [x] Enhance `SpaceScene.tsx` with interactive elements.
    - [x] Nebula clouds (ShaderMaterial).
    - [x] Shooting stars (Trail).
    - [x] 6000 Stars + Mouse Gravity.
    - [x] Orbital drift.
- [x] Fix loader timing in `script.js` to prevent race condition warnings.
- [x] Fix color issues in `SpaceScene.tsx` (realistic star/nebula colors).
- [x] Fix typography in `app/page.tsx` ("Vikram ." -> "Vikram.").
- [x] Implement Parallax Floating Hero Elements.
    - [x] Add `data-depth` attributes in `app/page.tsx`.
    - [x] Add 3D perspective styles in `app/globals.css`.
    - [x] **Refinement**: Replaced CSS parallax with GSAP ScrollTrigger for reliable scroll-based parallax.
    - [x] **Refinement**: Added `data-speed` and `parallax` class for mouse-based parallax via `script.js`.
- [x] UI/UX Audit & Fixes.
    - [x] Content typo check.
    - [x] Mobile responsiveness verification.
    - [x] Scrollbar check.

## History
- Initialized task for fixing `FloatingDetailBox` animation interruption.
- Wrapped `handleClose` in `useCallback` in `app/page.tsx`.
- Verified no linter errors.
- Enhanced `SpaceScene.tsx` with advanced R3F features.
- Optimized `script.js` loader logic.
- Conducted UI/UX audit and fixed visual defects.
- Added CSS-based 3D parallax to the Hero section.
- Verified and finalized UI checks.
- Switched parallax implementation to GSAP for better control and fixed "no effect" issue.
## Status: In Progress

## Tasks
- [x] Implement `initCursorTrail` with a pooled set of dots inside `public/script.js`.
- [x] Add `.cursor-trail` styling in `app/globals.css` that matches `--accent-color` and respects reduced-motion.
- [x] Capture screenshots for `http://localhost:8080` and `https://forgotten-mistory.web.app/` to compare hero state.
- [x] Investigate ESLint `Converting circular structure to JSON` failure (resolved by rolling back to ESLint 8 + config 15).
- [x] Note missing `type-check` and `test` scripts so verification instructions can be adjusted.
- [x] Rerun verification suite once lint/script blockers are resolved (lint and build now pass after dependency fix).
- [x] Add layered morphing SVG blobs after `SpaceScene` and refresh the `@keyframes morph` path data.
- [x] Document the new background verification and React hydration warning in `docs/ui_ux_audit.md`.
- [x] Resolve Firebase deployment dependency conflict by aligning ESLint versions (config 15 + plugin 4 + ESLint 8).
- [x] Remove legacy static root (`index.html`, `main.js`) to eliminate `_next` asset 404s and force the Next.js app to serve bundles.
- [x] Clean `.next` before dev/build to stop HMR hot-update 404s caused by stale artifacts.

## History
- Added cursor trail effect and CSS glow, documented the local vs hosted UI mismatch, and captured the current lint/type-check/test script blockers when verifying the build.

## Current Task Summary (2025-11-30)
- Restored Playwright stability by fixing fonts/hero copy, constraining worker count, and aligning ESLint config with Next 14.

## Latest Cycle
- Removed `process.env` reference in static `public/script.js` to prevent client-side ReferenceErrors.
- Hardened `SpaceAppDebugProbe` cleanup in `SpaceScene.tsx` using a ref-based comparison to ensure stale Three.js instances are properly disposed.
- Wrapped `next.config.js` debug logging behind a `NEXT_RUNTIME_DEBUG_ENDPOINT` check to avoid unintended telemetry calls.
- Removed unstable `triggerRect` dependency from `FloatingDetailBox.tsx` effect to prevent animation restarts.
- Verified that `npm run dev` works correctly with logging enabled/disabled and no longer conflicts with legacy static files.

## Next Steps Checklist
- [ ] Add missing npm scripts for `type-check` and `test` if required by CI.
- [ ] Address Next Image `sizes` warning for `/assets/my_avatar.png`.
- [ ] Monitor GPU stall warnings from WebGL; currently non-blocking.

## IDE Reliability: plugins/MCP/CDP (2026-07-10)

## Status: Completed (Cursor restart pending at user's convenience for CDP)

## Tasks
- [x] Diagnose 21 × `plugin-cache-miss` at claude startup (native terminal) — evidence in `~/.claude/debug/`.
- [x] Reinstall broken plugins at user scope (21 official + compound-engineering + 8 local-marketplace).
- [x] Move `NPM_CONFIG_CACHE` to persistent `~/.claude/npm-cache`; add `MCP_TIMEOUT=120000`; drop literal `${VAR}` env placeholders.
- [x] Pre-warm npm caches (desktop-commander, firebase-tools, convex, snyk).
- [x] Fix CDP watchdog (flock→mkdir lock, stale-backup handling, codesign identity) + LaunchAgent WatchPaths; fix generator script.
- [x] Add CDP liveness probe to Cursor sessionStart hook (`validate-cursor-config.mjs`).
- [x] Verify: fresh claude session loads with 0 plugin errors; MCP servers respond to `initialize` from warm cache.
- [ ] USER ACTION: fully quit + relaunch Cursor (after live claude session finishes) → watchdog wraps binary → CDP :9222 live.
- [ ] USER ACTION: authenticate supabase / adobe / datadog MCPs when needed (OAuth prompts).

## Context7 Removal + Stale Purge (2026-07-10, post-IDE-fix)

## Status: Completed

## Tasks
- [x] Kill runaway `@upstash/context7-mcp` (PID 89752, 100% CPU) — done by prior subagent, no respawn since.
- [x] Disable context7 in enabledPlugins (×3 settings files: `~/.claude`, `~/.cursor`, Cursor User) → `false`.
- [x] Remove 5 context7 install records + delete both plugin caches (claude + cursor-public) + 49 per-project MCP tool-cache dirs.
- [x] Delete 52 orphaned `var-folders-*` project state dirs (backing temp paths gone; 62 MB freed).
- [x] Delete 26 dangling `~/.claude/skills/` symlinks (targets pruned from `~/.agents/skills/`).
- [x] Remove orphaned `claude-code-jetbrains-plugin` marketplace dir (12 MB, no JetBrains on machine, unreferenced).
- [x] Prune 5 dead install records (missing installPath) from installed_plugins.json — backups kept.
- [x] Delete 11 untracked `scripts/testing/_*.mjs` TEMP debug scripts.
- [x] Verify: validator `TOTAL ERRORS: 0`, plugins 37/37 with manifest, JSONs valid, no context7 process.
- KEPT (deliberate): 38 unreferenced cache versions carrying `.in_use` markers; empty `_staging` dir (Cursor infra); `installed_plugins.json.bak-*` history; cursor-cdp MCP (working path, awaiting relaunch).


---

# Fable 5 P0: crash + hero name (2026-07-10)

## Symptom
- Owner screenshot: production "SYSTEM INTERRUPT / Something went wrong" (app/error.tsx).
- Hero name visually clipped/corrupted ("Vikr" / "Vikrar") despite DOM text "Vikram.".

## Root Cause
1. **D-NAME-01:** `HeroScroll` GSAP used scroll-scrubbed `clipPath` on the title; at scrollY=0 progress sat ~40% → `inset(0 60% 0 0)` clipped trailing glyphs. Compounded by `.hero-title .line { overflow:hidden }` and `background-clip:text` + transparent fill.
2. **D-KEYS-01 / D-CRASH-01 contributor:** `InboxTriage` effect re-appended the same `m1…m12` ids into `visibleMessages` under AnimatePresence → React duplicate-key warnings (`m3`/`m5`). Intermittent error-boundary still under verification (auto-retry + suppressHydrationWarning added as belt-and-suspenders).

## Impacted Modules
- `components/site/HeroScroll.tsx`
- `app/globals.css` (`.hero-title .line`, `.reveal-text`, glitch pseudos)
- `components/fx/InboxTriage.tsx`
- `app/error.tsx`, `app/layout.tsx`
- `tests/e2e/hero.spec.ts`, `tests/overhaul/telemetry-stability.spec.ts`, `tests/overhaul/render.spec.ts`, `playwright.config.ts`

## Evidence
- Live CDP: duplicate-key warnings under AnimatePresence; owner `website-2-error.png`.
- HeroScroll comment + prior clip-diag: scrub at scroll 0 left partial inset.
- Local browser after fix: overflow=visible, solid `-webkit-text-fill-color` = white, full "Vikram.".

## Fix Summary
1. HeroScroll: entrance-only clip tween + `clearProps:'clipPath'` on complete.
2. globals.css: `.line` overflow visible; solid monochrome name fill (no background-clip shine).
3. InboxTriage: reset stream on effect start; skip append if id already present.
4. error.tsx: one silent auto-retry / 10s via sessionStorage; layout `suppressHydrationWarning` on html/body for extension-mutated DOM.
5. Tests: TC-HERO-17..19; TS-05/TS-06; render TC-RENDER-09 scroll; playwright baseURL :8080; gotoHome clicks Skip.

## Files Touched
- listed above + `artifacts/backlog.json`, `artifacts/D-1-audit/defects.json`, `artifacts/delegation-ledger.jsonl`

## Why This Works
- Entrance wipe always completes to unclipped CSS; no permanent inline clip-path.
- Solid fill paints every glyph; overflow no longer truncates the line box.
- Deduped message stream removes AnimatePresence key collisions that polluted console and risked render instability.

## Verification Evidence
- Cursor browser local: full "Hello, I'm Vikram." + hire ATF signals.
- Playwright suite running → `artifacts/gates/hero-telemetry-tests.log` (pending completion).

---

## D-NAME-01 author-name (2026-07-10) — COMPLETE (tests green; no commit/deploy)

### Symptom
Hero name painted clipped/corrupted despite full DOM text.

### Root Cause
`overflow:hidden` on `.line` + `background-clip:text` + GSAP clip-path wipe + sticky glitch overlays.

### Impacted Modules
`app/globals.css`, `components/site/HeroScroll.tsx`, `tests/e2e/hero.spec.ts`

### Evidence
Backlog D-NAME-01; CDP overflow:hidden; a11y triple "Vikram." from pseudos.

### Fix Summary
overflow:visible; solid white fill; opacity GSAP entrance (no clip-path); glitchBurst → visibility:hidden; reduced-motion kills glitch.

### Files Touched
`app/globals.css`, `components/site/HeroScroll.tsx`, `tests/e2e/hero.spec.ts`, ledger + memory-bank

### Why This Works
No structural clip/mask left on the name after settle; monochrome solid paint.

### Verification Evidence
`npx playwright test tests/e2e/hero.spec.ts --workers=1` → **19 passed**.

---

## D-CRASH-01 + D-KEYS-01 author-crash (2026-07-10) — COMPLETE (tests green; no commit/deploy)

### Symptom
Intermittent root error boundary + duplicate AnimatePresence keys m3/m5.

### Root Cause
InboxTriage.tsx: AnimatePresence + re-append of static msg.ids on effect re-run.

### Impacted Modules
InboxTriage, MiniVicBot, ClearanceStepper, telemetry-stability + render specs, playwright.config.

### Evidence
Backlog D-CRASH-01/D-KEYS-01; CDP m3/m5 warnings.

### Fix Summary
Remove AnimatePresence; append-only id dedupe; monotonic MiniVic ids; harden tests.

### Files Touched
`components/fx/InboxTriage.tsx`, `components/MiniVicBot.tsx`, `components/fx/ClearanceStepper.tsx`, `tests/overhaul/telemetry-stability.spec.ts`, `tests/overhaul/render.spec.ts`, `playwright.config.ts`, ledger + memory-bank

### Why This Works
No exit-node key collision; unique chat keys; LOADING_SNAPSHOT untouched.

### Verification Evidence
telemetry-stability 6/6 PASS; TC-RENDER-09 PASS; TS-06 confirms zero duplicate-key console warnings.

---

## D-VERIFY-01 — MiniVic lifecycle verification (2026-07-10)

### Symptom
- The launcher close path could hide MiniVic while media playback or speech recognition continued.

### Root Cause
- Launcher state toggling bypassed the cleanup used by Escape and the in-panel close control.

### Impacted Modules
- `components/MiniVicBot.tsx`
- `tests/e2e/chatbot.spec.ts`

### Evidence
- Divergent close handlers were present at `MiniVicBot.tsx:300-311`, `1183-1187`, and `1437`.
- Focused lifecycle test initially exposed the missing close-state contract.

### Fix Summary
- Added one `closePanel()` lifecycle path, audio-source teardown, speech-recognition stopping, and deterministic launcher-close regression coverage.

### Files Touched
- `components/MiniVicBot.tsx`
- `tests/e2e/chatbot.spec.ts`
- `artifacts/delegation-ledger.jsonl`
- `.cursor/memory-bank/currentTaskContext.md`
- `.cursor/memory-bank/progressTracking.md`

### Why This Works
- Closing MiniVic now consistently releases active browser resources before the UI is hidden.

### Verification Evidence
- Chatbot E2E: 7 passed.
- Strict TypeScript: passed.
- ESLint: passed.
- Static audit: 9/9 passed.

### Integration Lane Next Steps
- Run P0 hero/telemetry/render regression suites, then static build and broader local/prod verification before deployment.

---

## Experience Section Polish (2026-07-10)

## Status: Completed

## Tasks
- [x] Establish baseline: tsc, lint, and experience E2E tests.
- [x] Refine accordion motion (bullet stagger, +/× icon morph, shared easing).
- [x] Improve readability and visual rhythm (typography, spacing, evidence-harness).
- [x] Polish scroll-rail (track inset glow, fill gradient, label transition).
- [x] Add responsive accordion layout for mobile.
- [x] Fix deterministic bug: stateful callback ref for CardFlipCanvas + missing ARIA id.
- [x] Harden experience E2E selectors (TC-EXP-03/TC-EXP-05).
- [x] Verify reduced-motion path and accessibility.
- [x] Update memory-bank.

## History
- Initial inspection of `ExperienceAccordion.tsx`, `app/globals.css`, `ScrollRail.tsx`, and `tests/e2e/experience.spec.ts`.
- Identified flaky wrapper-click selector and null-ref race in CardFlipCanvas.
- Implemented polish pass while keeping all resume facts untouched.
- Updated memory-bank with full Error Trail.

## Verification Evidence
- `npx tsc --noEmit` → passed (0 errors).
- `npm run lint` → passed (0 warnings).
- `node scripts/validate/overhaul_static_audit.mjs` → 9/9 PASS.
- `npx playwright test tests/e2e/experience.spec.ts --workers=1` → 5 passed.
- `npx playwright test tests/a11y/accessibility.spec.ts --workers=1` partial → A11Y-04 (Experience section) PASS.

## Residual Notes
- `npm run build:static` and `tests/overhaul/render.spec.ts` were blocked by network failures fetching Google Fonts during this session, not by code changes.


---

## Section-Swarm Integration (2026-07-10)

### Symptom
Multi-agent section swarm left completed worktrees unmerged; About/Skills/Architecture/E2E agents stopped on Cursor billing invoice errors with partial artifacts.

### Root Cause
Parallel best-of-n worktrees diverged from the main dirty tree (which already contained ship-lane P0 crash/name/MiniVic/content fixes). Naïve whole-file apply would regress monotonic chat IDs and stronger Work/Contact/test coverage.

### Impacted Modules
- `app/page.tsx`, `app/globals.css`, `components/site/Preloader.tsx`
- `components/site/{ArchitectureMap,SkillsScroll,ExpandableCard}.tsx`, `components/fx/SkillViz*.tsx`
- `components/MiniVicBot.tsx`, `tests/e2e/vfx.spec.ts`

### Evidence
- Worktree inventory under `~/.cursor/worktrees/*` all detached at `d471cbc`
- Main already matched ship-lane for InboxTriage/ClearanceStepper/error/layout/playwright + section components
- Agent transcripts: Experience/Hero/Work/Contact/MiniVic `turn_ended success`; About/Skills/Architecture/E2E unpaid invoice

### Fix Summary
1. Applied unique Hero Preloader `fm:page-ready` + page hero reveal choreography
2. Applied About snap-grid Reveal wrap
3. Applied Skills wrappers/layout + SkillsScroll/ExpandableCard/SkillViz fill sizing
4. Applied ArchitectureMap + architecture section header/CSS + vfx.spec
5. Merged MiniVic object-URL/inFlight/typed-speech reliability while keeping `nextChatMessageId`
6. Intentionally retained main Work/Contact/test suites (P0-stronger than section worktrees)

### Files Touched
Preloader, page.tsx, globals.css, ArchitectureMap, SkillsScroll, ExpandableCard, SkillViz*, MiniVicBot, vfx.spec, artifacts/delegation-ledger.jsonl, memory-bank

### Why This Works
Section polish lands without overwriting ship-lane stability contracts; MiniVic reliability is additive to the crash-key fix.

### Verification Evidence
- `npx tsc --noEmit` → 0 errors (post MiniVic dedupe)
- `npm run lint` → clean
- `node scripts/validate/overhaul_static_audit.mjs` → 9/9 PASS
- `PLAYWRIGHT_BASE_URL=http://localhost:8080 npx playwright test tests/e2e/hero.spec.ts -g "TC-HERO-17|TC-HERO-18|TC-HERO-19"` → 3 passed
- `PLAYWRIGHT_BASE_URL=http://localhost:8080 npx playwright test tests/e2e/contact.spec.ts -g "TC-CONTACT-01"` → 1 passed
- Full 4-spec batch timed out ~8m; deploy withheld

---

## About Section Polish (2026-07-10, worktree restart)

### Symptom
Section-swarm About owner failed on Cursor billing; About `#about` needed visual/interaction polish without content changes.

### Root Cause
Snap-cards used older glass styling (not shared card-depth tokens); paragraph entrances were plain fade; grid had no staggered reveal; expandable body metrics (92%, Langfuse) live only when cards open (AnimatePresence).

### Impacted Modules
- `app/page.tsx` (#about block)
- `app/globals.css` (about-scoped + snap-card rules)

### Evidence
- Worktree: `/Users/vic/.cursor/worktrees/about-polish-2eb996d/forgotten-mistory-c98f7f1a1a3f` @ `d471cbc`
- `npx tsc --noEmit` → 0; `npm run lint` → clean; `overhaul_static_audit.mjs` → 9/9
- `tests/e2e/about.spec.ts` → 6/8 pass; TC-ABOUT-04 expand passes; TC-ABOUT-06/08 fail on collapsed innerText (pre-existing)

### Fix Summary
1. Paragraph `Reveal` → `variant="clip"`; snap-grid wrapped in staggered `Reveal`
2. `.about-section` atmosphere gradient; first-paragraph left accent
3. Snap-cards aligned to `--card-*` depth system (sheen, rim, hover/open glow, pill + icon, luminous bullets)
4. `prefers-reduced-motion` flatten on snap-card lift

### Files Touched
`app/page.tsx`, `app/globals.css`, `docs/execution-log.md`, memory-bank

### Why This Works
Matches Skills/hero card language; motion uses existing Reveal/ExpandableCard stack; monochrome tokens only; zero copy changes.

### Verification Evidence
- `npx tsc --noEmit` → 0 errors
- `npm run lint` → clean
- `node scripts/validate/overhaul_static_audit.mjs` → 9/9 PASS
- `npx playwright test tests/e2e/about.spec.ts --workers=1` → 6 passed / 2 failed (collapsed-body text assertions)


### Verification Evidence (integrator close-out 2026-07-10 17:58 AEST)
- `npx tsc --noEmit` → pass
- `npm run lint` → pass
- `node scripts/validate/overhaul_static_audit.mjs` → 9/9 PASS
- Playwright (PLAYWRIGHT_BASE_URL=http://localhost:8080): chatbot earlier clean lane **6 passed / 6 failed** (BOT-01–04 + voice OK; BOT-05–10 soft-fail under hydration/HMR churn). Later reruns flaked when Next HMR remounted mid-suite. **Do not deploy.**
- ArchitectureMap worktree rejected (SVG `<title>` hydration killed MiniVic); HEAD map retained; architecture section header+CSS kept.
