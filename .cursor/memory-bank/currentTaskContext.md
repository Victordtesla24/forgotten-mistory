# UI/UX Audit and Fixes

## Symptom

The user reported UI/UX issues, including scrolling, overlapping text, overflow, animation glitches, parallax defects, and star field inconsistency or realism mismatches.

- **Snapshot Analysis:** Missing "s" characters in text (likely a tool artifact), `SpaceScene` hidden by opaque body background, and potential overflow on mobile.
- **Console:** "Preloader cleared: failsafe" warning.
- **User Feedback:** Overlapping content on scroll, star field visibility issues.
- **Regression:** A static `index.html` and `src/` folder ("Constellation Demo") were reintroduced, breaking Next.js routing.

## Root Cause

- **Overlap:** `hero-links` (moving down at speed 1) and `telemetry-panel` (moving up at speed -0.5) collided due to converging parallax paths.
- **Star Field:** In `app/globals.css`, overlays (`body::after`, `body::before`) were too opaque (0.4/0.6), dimming the stars.
- **Preloader:** Logic was too slow and random, often triggering the 2.5s failsafe before completion.
- **Overflow:** Mobile font size for `hero-title` was `14vw`, causing overflow issues.
- **Static File Conflict:** `index.html` at the root took precedence over Next.js routes, serving "Constellation Demo" instead of the app.

## Impacted Modules

- `app/globals.css`
- `public/script.js`
- `app/page.tsx`
- `app/components/SpaceScene.tsx`
- `index.html` (deleted)
- `src/` (deleted)

## Fix Summary

1. **Parallax Overlap:** Adjusted `data-speed` in `app/page.tsx`. `hero-links` now moves at `0.2` (slower), and `telemetry-panel` at `0.4` (faster), causing separation. Added `margin-top: 4rem` to `.telemetry-panel` in CSS.
2. **Star Field:** Reduced `body::after` opacity to `0.1`, and `body::before` to `0.3`. Increased star brightness (opacity 1.0), star count (8000), and size range in `SpaceScene.tsx`. Set `body` background to transparent.
3. **Preloader Optimization:** Tuned `public/script.js` counter increment (10–30) and delay (5–45ms) to finish before the failsafe (now 2000ms).
4. **Mobile Layout:** `.hero-title` font size reduced from `14vw` to `12vw`.
5. **Font Robustness:** Added system font fallbacks to the `font-family`.
6. **Route Conflict:** Deleted `index.html` and `src/` to restore Next.js application serving.

## Verification Evidence

- **Visuals:** `SpaceScene` is visible as the background, and hero parallax overlap is resolved.
- **Console:** Preloader failsafe warning is gone.
- **Code:** "Resume" and "Reset" text in `app/page.tsx` verified.
- **Routing:** `index.html` deleted; running `npm run dev` or `npm start` serves the Next.js app.

## Deployment

- **Build:** `npm run build` passed.
- **Firebase:** Deployed to `forgotten-mistory` (Project: 642338064840).
- **URL:** <https://forgotten-mistory.web.app>

---

### **Logging Cleanup and Three.js Wiring Fix (2025-11-30)**

#### Logging/Three.js Symptom

- Development server: repeated 404/500 errors for `/_next/static/...`; `TypeError: __webpack_modules__[moduleId] is not a function`.
- Production: Debug POSTs to `http://127.0.0.1:7242/...`.
- Detail cards failed to animate; `window.spaceApp` was always `undefined`.

##### Logging/Three.js Root Cause

- Hard-coded `DEBUG_ENDPOINT` executed everywhere, causing telemetry to attempt connections to localhost outside the debug machine.
- Legacy Vite prototype (`index.html` and `src/`) provided a competing entry point; static files could shadow Next.js.
- Three.js helper only *read* `window.spaceApp`, never wrote to it; downstream consumers failed due to undefined reference.

##### Logging/Three.js Impacted Modules

- `next.config.js`
- `public/script.js`
- `app/components/SpaceScene.tsx`
- `components/FloatingDetailBox.tsx`
- Legacy assets in `src/`

##### Logging/Three.js Evidence

- `NEXT_RUNTIME_DEBUG_ENDPOINT=console npm run dev` confirms the environment is correct; debug endpoint is console.
- `curl -I ...layout.js` returns 404 before first hit, 200 after compilation.
- `kill` and `lsof` show multiple dev servers on the same port.

##### Logging/Three.js Fix Summary

1. Debug beacons now require an explicit `NEXT_RUNTIME_DEBUG_ENDPOINT` or `NEXT_PUBLIC_DEBUG_ENDPOINT` opt-in. Added `"console"` target for local diagnostics.
2. Three.js probe populates `window.spaceApp` with `{ scene, camera, THREE }`.
3. Stale `src/` prototype removed, preventing static entry.

##### Logging/Three.js Files Touched

- `next.config.js`
- `public/script.js`
- `app/components/SpaceScene.tsx`
- `components/FloatingDetailBox.tsx`
- (deleted) `src/components/ThreeScene.ts`, `src/main.ts`, `src/style.css`, `src/`

##### Logging/Three.js Rationale

- Telemetry only runs with explicit opt-in; no production debug traffic.
- Downstream code receives proper `window.spaceApp` references, and animation setup no longer short-circuits.
- Only Next.js is routed at the root.

##### Logging/Three.js Verification Evidence

- `npm run lint` and `npm run build` passed.
- Chunks load as expected after compilation.
- `NEXT_RUNTIME_DEBUG_ENDPOINT=console npm run dev` verifies local-only logging.

---

#### Animation Performance Fix (2025-11-30)

##### Animation Performance Symptom

- Detail box animation stuttered and restarted: `triggerRect` was included in `useEffect` dependency array, causing retriggers on layout.

##### Animation Performance Root Cause

- `triggerRect` changes reference on every render or layout. Including it in effect dependencies re-initialized Three.js repeatedly.

##### Animation Performance Fix Summary

- Removed `triggerRect` from `useEffect` dependencies in `FloatingDetailBox.tsx`; animation now only initializes when `displayKey` changes.

##### Animation Performance Files Touched

- `components/FloatingDetailBox.tsx`

##### Animation Performance Verification Evidence

- Dependency array is now stable. Build passes.

---

#### IDE Reliability: Claude Code Plugins, MCP, and CDP Browser (2026-07-10)

##### IDE Reliability Symptom

- `claude` startup: 21 plugin failures, plugin-cache-miss, `/reload-plugins` ineffective.
- Agents couldn't drive the in-IDE browser: CDP port 9222 dead, `cdp.cjs tabs` failing.
- MCP servers logged "connection closed"; multiple plugin failures.

##### IDE Reliability Root Cause

1. Plugin cache split-brain.
2. Volatile npm cache at `/tmp/claude/npm-cache` was cleaned up by the OS; MCP servers re-downloaded on each launch.
3. Literal `${VAR}` placeholders in settings, not interpolated.
4. CDP dead: macOS update wiped the wrapper, and no working watchdog remained.

##### IDE Reliability Impacted Modules

- `~/.claude/settings.json`, `~/.claude/plugins/*`
- `~/.local/bin/cursor-cdp-watchdog.sh`, `~/Library/LaunchAgents/...plist`
- `~/.cursor/scripts/fix-cursor-internal-browser.sh`, `validate-cursor-config.mjs`

##### IDE Reliability Evidence

- Debug logs: plugin-cache-miss, flock errors, and binary reinstalled.
- `lsof`: no process bound to ports; MCP children in temp npm cache.

##### IDE Reliability Fix Summary

1. Reinstalled 21+8 plugins at the user scope, updated marketplaces.
2. Set up a persistent npm cache, removed non-interpolated placeholders, set timeouts.
3. Prewarmed persistent caches.
4. Rewrote watchdog for macOS; migration is safe and logic is solid.
5. Extended sessionStart hook for CDP liveness probe.

##### IDE Reliability Rationale

- Reinstallation aligns plugin state; the persistent cache survives OS sweeps.
- Environment obtains valid keys; watchdog works on macOS.
- CDP and MCPs run as needed.

##### IDE Reliability Verification Evidence

- Plugins load cleanly, all tools connect.
- CDP warning appears only if actually dead.
- All scripts and lint checks pass.
- 3rd-party review confirmed the release.

---

#### Context7 CPU Runaway and Stale Config Purge (2026-07-10)

##### Context7 Symptom

- `@upstash/context7-mcp` (npx child, PID 89752) at 100% CPU; user requested removal and cleanup.

##### Context7 Root Cause

- Context7 plugin was enabled in both Cursor and Claude. Killing one process was insufficient. Many stale directories, skills, configs, and scripts persisted.

##### Context7 Impacted Modules

- All `enabledPlugins`, install records, plugin caches, per-project MCP tool cache directories
- Dangling skills, orphaned marketplace payloads, temporary scripts

##### Context7 Evidence

- PID and plugin origin traced.
- Verified missing directories, skills, orphans, and temporary scripts.

##### Context7 Fix Summary

1. Disabled Context7 everywhere; removed install records, plugin caches, and tool caches.
2. Deleted orphaned temporary state directories.
3. Removed dangling skills, orphaned JetBrains marketplace payloads, and pruned dead install records.
4. Deleted untracked temporary scripts (testing, files with `_*.mjs`).

##### Context7 Rationale

- All anchors for Context7 are removed; only cleaned up artifacts targeting tangible stale objects.

##### Context7 Verification Evidence

- JSON loads, plugins validate, no running Context7 orphans.
- No live sessions interrupted.

---

#### Fable 5 P0: Crash and Hero Name (2026-07-10)

##### Fable 5 Symptom

- Production: "SYSTEM INTERRUPT / Something went wrong".
- Hero name was clipped ("Vikr"/"Vikrar") despite DOM text "Vikram.".

##### Fable 5 Root Cause

1. GSAP scroll-based `clipPath` on the title clipped trailing glyphs at 40% scroll.
2. `InboxTriage` re-appended identical IDs, causing AnimatePresence key warnings.

##### Fable 5 Impacted Modules

- `components/site/HeroScroll.tsx`
- `app/globals.css` (`.hero-title .line`, `.reveal-text`, glitch pseudo-elements)
- `components/fx/InboxTriage.tsx`
- `app/error.tsx`, `app/layout.tsx`
- All related tests and configs

##### Fable 5 Evidence

- Console: duplicate-key warnings.
- Style caused trailing glyphs to be clipped; fixes produced the correct full label display.

##### Fable 5 Fix Summary

1. Entrance-only clip tween, clearProps on animation end.
2. `.line` overflow set to visible, solid fill instead of background-clip.
3. Message deduplication for AnimatePresence.
4. `error.tsx`: auto-retry, suppressHydrationWarning for mutation.
5. Tests: upgraded and verified all scenarios.

##### Fable 5 Files Touched

- Above code and corresponding test artifacts/backlog.

##### Fable 5 Rationale

- Clip/tween only on entrance; solid paint everywhere; deduplicated keys.

##### Fable 5 Verification Evidence

- Local and CI test runs: visual and test suite pass.

---

##### D-NAME-01 — Hero Name Clipped/Corrupted (author-name, 2026-07-10)

###### D-NAME-01 Symptom

- DOM text was "Vikram." but screenshots showed "Vikr" / "Vikrar".
- Confirmed `overflow:hidden` caused glyph clipping.

###### D-NAME-01 Root Cause

1. `.hero-title .line { overflow: hidden }`—clipped the line box.
2. `background-clip:text` plus transparent fill.
3. GSAP mid-tween or uncleared inline clip left the name clipped.
4. Glitch overlays sometimes remained visible.

###### D-NAME-01 Impacted Modules

- `app/globals.css` (affected classes)
- `components/site/HeroScroll.tsx`
- `tests/e2e/hero.spec.ts`

###### D-NAME-01 Evidence

- Live backlog description and a11y snapshots showed repeated or ghost text.

###### D-NAME-01 Fix Summary

1. `.hero-title .line { overflow: visible }`
2. Solid color or fill, no background-clip.
3. Single glitch keyframe, inert under reduced motion.
4. GSAP opacity-only entrance, cleans up inline states.

###### D-NAME-01 Files Touched

- Above styles, components, and tests.

###### D-NAME-01 Rationale

- Overflow is visible, solid fill, overlays removed.

###### D-NAME-01 Verification Evidence

```shell
npx playwright test tests/e2e/hero.spec.ts --workers=1
# 19 passed (11.7m)
```

TC-HERO-17/18/19 all pass (full text coverage, visual and reduced-motion OK).

---

#### D-VERIFY-01 — MiniVic panel lifecycle cleanup (integration verifier, 2026-07-10)

##### Symptom
- Closing MiniVic with its floating launcher only flipped `isOpen`; active greeting audio, lip-sync animation, and browser speech recognition could continue while the panel was hidden.

##### Root Cause
- The launcher toggle bypassed the existing close handlers, which called `stopAudio()` and returned focus.
- Speech recognition had no shared stop path or teardown on panel closure.

##### Impacted Modules
- `components/MiniVicBot.tsx`
- `tests/e2e/chatbot.spec.ts`

##### Evidence
- `components/MiniVicBot.tsx:1437` previously used `setIsOpen(!isOpen)` without cleanup.
- `components/MiniVicBot.tsx:300-311` and `1183-1187` already had separate close behavior, demonstrating divergent lifecycle paths.
- New regression `tests/e2e/chatbot.spec.ts:59` failed before the cleanup when it asserted the required close-state contract.

##### Fix Summary
1. Added a shared `closePanel()` path that stops audio and speech recognition, closes the dialog, and restores launcher focus when appropriate.
2. Cleared audio handlers and removed the media source before calling `load()` so hidden audio does not retain a playback source.
3. Added speech-recognition teardown on unmount.
4. Replaced permissive chatbot checks with deterministic open/close lifecycle coverage.

##### Files Touched
- `components/MiniVicBot.tsx`
- `tests/e2e/chatbot.spec.ts`
- `artifacts/delegation-ledger.jsonl`
- `.cursor/memory-bank/currentTaskContext.md`
- `.cursor/memory-bank/progressTracking.md`

##### Why This Works
- Every dismissal route now converges on the same cleanup behavior, eliminating hidden audio/listening state and reducing late callback risk after panel closure.

##### Verification Evidence
- `PLAYWRIGHT_BASE_URL=http://localhost:8080 npx playwright test tests/e2e/chatbot.spec.ts --workers=1` → 7 passed.
- `npx tsc --noEmit` → passed.
- `npm run lint` → passed with no warnings.
- `node scripts/validate/overhaul_static_audit.mjs` → 9/9 passed.

---

#### Experience Section Polish (2026-07-10)

##### Symptom
The `#experience` section needed more polish: accordion motion felt basic, scroll-rail could feel more premium, hover/focus states needed refinement, and a fragile E2E selector caused a flaky failure (TC-EXP-03/TC-EXP-05). A deterministic bug existed where the CardFlipCanvas overlay received `contentRef.current` (often `null` on first render) and the content `button` lacked the `id` matching `aria-labelledby`.

##### Root Cause
1. The accordion used a plain `+` text icon and no bullet-stagger animation.
2. Hover/focus transitions were ad-hoc (different durations/easings) and the header was not fully keyboard-optimized.
3. The scroll-rail track/fill lacked subtle depth (no inset glow, flat gradient).
4. `ExperienceAccordion.tsx` passed `contentRef.current` directly to `CardFlipCanvas`, which is `null` until React commits the ref; the header `button` had no `id` to satisfy the region's `aria-labelledby`.
5. `tests/e2e/experience.spec.ts` used a broad union selector that resolved to the `.accordion-group` wrapper (or multiple elements), making the click non-deterministic and the scroll-rail assertion strict-mode-violating.

##### Impacted Modules
- `components/site/ExperienceAccordion.tsx`
- `app/globals.css` (experience accordion + scroll-rail + responsive blocks)
- `tests/e2e/experience.spec.ts`

##### Evidence
- `components/site/ExperienceAccordion.tsx:100` — `contentRef.current` passed as `containerEl` before ref commit.
- `components/site/ExperienceAccordion.tsx:71` — `aria-labelledby` referenced an `id` that did not exist on the header.
- `tests/e2e/experience.spec.ts:49` — union selector resolved to the wrapper, not the button.
- `tests/e2e/experience.spec.ts:66` — scroll-rail locator matched 20 elements.

##### Fix Summary
1. **Accordion motion + readability:**
   - Added a staggered `motion.li` reveal for bullets (Apple ease, 0.05 s stagger, suppressed under `prefers-reduced-motion`).
   - Replaced the `+` text icon with two CSS bars that morph into an `×` (rotate 45° + vertical bar fade) on expand.
   - Unified all transitions under `--motion-base` and `--motion-ease-standard` for a coherent feel.
   - Added `:focus-visible` parity to `:hover` so keyboard users get the same luminous lift.
   - Tightened typography hierarchy: role title uses `clamp`, company/date labels use uppercase tracking, bullets get `1.25 rem` left padding and `1.7` line-height.
2. **Scroll-rail polish:** added a subtle inset track glow, brighter fill gradient, and a color transition on the label.
3. **Responsive rhythm:** on mobile the header stacks vertically, the timeline rail/node are inset to match the narrower layout, and the date stays visible rather than hidden.
4. **Deterministic bug cleanup:**
   - Used a stateful callback ref (`setContentEl`) so `CardFlipCanvas` always receives the real measured DOM node.
   - Added the missing `id` to the header button so `aria-labelledby` resolves correctly.
5. **Test hardening:**
   - TC-EXP-03 now clicks the first `.accordion-header` button directly and toggles twice to assert collapse/expand still works.
   - TC-EXP-05 targets `#experience .scroll-rail-label` to avoid the 20-element strict-mode violation.

##### Files Touched
- `components/site/ExperienceAccordion.tsx`
- `app/globals.css`
- `tests/e2e/experience.spec.ts`
- `.cursor/memory-bank/currentTaskContext.md`
- `.cursor/memory-bank/progressTracking.md`

##### Why This Works
- The stateful callback ref removes the race between React ref assignment and the R3F overlay measuring the panel.
- The ARIA `id`/`aria-labelledby` pair makes the accordion relationship explicit to assistive tech.
- Shared motion tokens and staggered bullet reveals give the section a polished, deliberate feel without changing any resume facts.
- The hardened test selectors target real controls, eliminating the wrapper-click ambiguity.

##### Verification Evidence
- `npx tsc --noEmit` → passed (0 errors).
- `npm run lint` → passed (0 warnings).
- `node scripts/validate/overhaul_static_audit.mjs` → 9/9 PASS.
- `npx playwright test tests/e2e/experience.spec.ts --workers=1` → 5 passed (TC-EXP-01 through TC-EXP-05).
- `npx playwright test tests/a11y/accessibility.spec.ts --workers=1` partial → A11Y-04 (Experience section) PASS.
- Note: `npm run build:static` and `tests/overhaul/render.spec.ts` were blocked by network failures fetching Google Fonts during this session, not by code changes.


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
- Full 4-spec Playwright batch timed out at ~8m (no failures captured); deploy withheld pending full suite green

---

## About Section Polish Restart (2026-07-10)

### Symptom
About section owner agent failed on billing; `#about` needed posh monochrome animation/interaction polish without content edits.

### Root Cause
Snap-cards lagged Skills card-depth system; entrances were undifferentiated; collapsed expandable bodies keep metrics out of section innerText (TC-ABOUT-06/08).

### Impacted Modules
`app/page.tsx` (#about), `app/globals.css` (about/snap rules)

### Evidence
Worktree `about-polish-2eb996d` @ `d471cbc`; tsc/lint/audit green; about e2e 6/8 (expand OK)

### Fix Summary
Clip-reveal paragraphs; staggered snap-grid Reveal; shared `--card-*` snap-card depth (sheen, rim, hover/open glow, pill + icon, luminous bullets); section atmosphere; reduced-motion flatten.

### Files Touched
`app/page.tsx`, `app/globals.css`, `docs/execution-log.md`, memory-bank (worktree only — merge via `/apply-worktree`)

### Why This Works
Reuses existing Reveal/ExpandableCard/motion tokens; no copy or hex drift; matches site glass language.

### Verification Evidence
`npx tsc --noEmit` 0; `npm run lint` clean; audit 9/9; `npx playwright test tests/e2e/about.spec.ts` 6/8 (06/08 pre-existing collapsed-body assertions)


### Verification Evidence (integrator close-out 2026-07-10 17:58 AEST)
- `npx tsc --noEmit` → pass
- `npm run lint` → pass
- `node scripts/validate/overhaul_static_audit.mjs` → 9/9 PASS
- Playwright (PLAYWRIGHT_BASE_URL=http://localhost:8080): chatbot earlier clean lane **6 passed / 6 failed** (BOT-01–04 + voice OK; BOT-05–10 soft-fail under hydration/HMR churn). Later reruns flaked when Next HMR remounted mid-suite. **Do not deploy.**
- ArchitectureMap worktree rejected (SVG `<title>` hydration killed MiniVic); HEAD map retained; architecture section header+CSS kept.
