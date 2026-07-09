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
