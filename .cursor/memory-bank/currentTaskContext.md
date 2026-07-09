# UI/UX Audit & Fixes

## Symptom
The user reported UI/UX issues including scrolling, overlapping text, overflow, animation glitches, parallax defects, and star field inconsistency/realism mismatch.
- **Snapshot Analysis**: Revealed "missing s" characters in text (likely tool artifact), `SpaceScene` hidden by opaque body background, and potential overflow on mobile.
- **Console**: "Preloader cleared: failsafe" warning.
- **User Feedback**: Overlapping content on scroll and starfield visibility issues.
- **Regression**: A static `index.html` and `src/` folder ("Constellation Demo") were reintroduced, breaking Next.js routing.

## Root Cause
- **Overlap**: `hero-links` (moving down at speed 1) and `telemetry-panel` (moving up at speed -0.5) were colliding due to converging parallax paths.
- **Star Field**: `app/globals.css` overlays (`body::after`, `body::before`) were too opaque (0.4/0.6), dimming the stars.
- **Preloader**: The logic was too slow/random, often triggering the 2.5s failsafe before completion.
- **Overflow**: Mobile font size for `hero-title` was `14vw`, potentially causing overflow.
- **Static File Conflict**: `index.html` at the root takes precedence over Next.js routes on many hosting platforms, serving a static "Constellation Demo" instead of the app.

## Impacted Modules
- `app/globals.css`
- `public/script.js`
- `app/page.tsx`
- `app/components/SpaceScene.tsx`
- `index.html` (deleted)
- `src/` (deleted)

## Fix Summary
1.  **Parallax Overlap**: Adjusted `data-speed` in `app/page.tsx`. `hero-links` now moves at `0.2` (slower) and `telemetry-panel` at `0.4` (faster), causing them to separate or maintain distance rather than converge. Added `margin-top: 4rem` to `.telemetry-panel` in CSS.
2.  **Star Field**: Reduced `body::after` opacity to `0.1` and `body::before` opacity to `0.3`. Increased star brightness (opacity 1.0), count (8000), and size range in `SpaceScene.tsx`. Set `body` background to `transparent`.
3.  **Preloader Optimization**: Tuned `public/script.js` counter increment (10-30) and delay (5-45ms) to ensure it finishes naturally before the failsafe (extended to 2000ms).
4.  **Mobile Layout**: Reduced `.hero-title` font size from `14vw` to `12vw` on mobile.
5.  **Font Robustness**: Added system font fallbacks (`Segoe UI`, `Roboto`, `Helvetica`, `Arial`) to `font-family`.
6.  **Route Conflict**: Deleted `index.html` and `src/` directory to restore Next.js application serving.

## Verification Evidence
- **Visuals**: `SpaceScene` is clearly visible as the background. Overlap in Hero section is resolved by parallax speed adjustments.
- **Console**: Preloader failsafe warning is resolved.
- **Code**: Verified `Resume`, `Reset` text in `app/page.tsx` is correct.
- **Routing**: Root `index.html` is gone, ensuring `npm run dev` / `start` serves the Next.js app.

## Deployment
- **Build**: `npm run build` passed.
- **Firebase**: Successfully deployed to `forgotten-mistory` (Project Number: 642338064840).
- **URL**: `https://forgotten-mistory.web.app`

---

## Logging cleanup & Three.js wiring fix (2025-11-30)

### Symptom
- Dev server responded with repeated 404/500 errors for `/_next/static/...` assets and threw `TypeError: __webpack_modules__[moduleId] is not a function`.
- Production bundles contained debug plumbing that POSTed hypothesis telemetry to `http://127.0.0.1:7242/...`.
- Detail cards never animated because `window.spaceApp` was always `undefined`.

### Root Cause
- Hard-coded `DEBUG_ENDPOINT` constants executed in all environments, attempting to beacon telemetry to a localhost address that does not exist outside of the debugging machine.
- A legacy Vite prototype (`index.html` + `src/`) re-introduced a competing entry point; during dev the static files sometimes served first, and on some hosts they shadow Next.js entirely.
- The Three.js helper probe only *read* `window.spaceApp` but never wrote to it, so downstream consumers bailed out every time.

### Impacted Modules
- `next.config.js`
- `public/script.js`
- `app/components/SpaceScene.tsx`
- `components/FloatingDetailBox.tsx`
- Legacy prototype assets in `src/`

### Evidence
- `NEXT_RUNTIME_DEBUG_ENDPOINT=console npm run dev` logged dev-phase metadata and showed Webpack chunk names (`[name].js`), confirming the environment was correct while the logging endpoint remained localhost (`next.config debug` console output).
- `curl -I http://localhost:8080/_next/static/chunks/app/layout.js` returned 404 before a page hit and 200 after compilation, indicating the chunk was served once Next handled routing.
- `kill` and `lsof` invocations confirmed multiple dev servers fighting for port 8080.

### Fix Summary
1. Wrapped debug beacons behind a `NEXT_RUNTIME_DEBUG_ENDPOINT`/`NEXT_PUBLIC_DEBUG_ENDPOINT` opt-in. Added a `"console"` pseudo-target to aid local diagnostics without shipping traffic to localhost.
2. Restored the Three.js probe to populate `window.spaceApp` with `{ scene, camera, THREE }` while keeping the lightweight `logDebug` helper.
3. Removed the stale `src/` prototype to eliminate the static entry point entirely.

### Files Touched
- `next.config.js`
- `public/script.js`
- `app/components/SpaceScene.tsx`
- `components/FloatingDetailBox.tsx`
- `src/components/ThreeScene.ts` (deleted)
- `src/main.ts` (deleted)
- `src/style.css` (deleted)
- `src/` directory (deleted)

### Why This Works
- Debug telemetry now runs only when a maintainer explicitly opts in, ensuring no production traffic gets sent to localhost and avoiding surprise session metadata leaks.
- By setting `window.spaceApp` inside `SpaceAppDebugProbe`, downstream components receive the references they expect and animation setup no longer short-circuits.
- Removing the static prototype guarantees Next.js routes occupy `/`, preventing hashed asset lookups from falling back to the wrong build.

### Verification Evidence
- `npm run lint`
- `npm run build`
- `curl -I http://localhost:8080/_next/static/chunks/app/layout.js` (200 after initial compilation)
- `NEXT_RUNTIME_DEBUG_ENDPOINT=console npm run dev` (shows environment metadata without external network calls)

---

## Animation Performance Fix (2025-11-30)

### Symptom
- The detail box animation would constantly restart or stutter because `triggerRect` (a DOMRect object) was included in the `useEffect` dependency array, causing re-runs on every layout reflow.

### Root Cause
- `triggerRect` changes reference on every render or layout update. Including it in the dependency array caused the effect to tear down and re-initialize the Three.js scene repeatedly.

### Fix Summary
- Removed `triggerRect` from the `useEffect` dependency array in `components/FloatingDetailBox.tsx`. This ensures the animation only initializes when `displayKey` changes (modal opens), using the initial rect for position calculation without reacting to subsequent rect updates.

### Files Touched
- `components/FloatingDetailBox.tsx`

### Verification Evidence
- Code analysis confirms dependency array no longer includes the unstable object.
- Build passed (`npm run build`).

---

## IDE Reliability: Claude Code plugins + MCP + CDP browser (2026-07-10)

### Symptom
- Every `claude` startup in Cursor's native terminal logged 21 plugin failures: `Plugin "<name>" not cached at ~/.claude/plugins/cache/... — run /plugin to refresh` (error type `plugin-cache-miss`); `/reload-plugins --force` did not repair them.
- `claude mcp list`: `plugin:desktop-commander` and `plugin:firebase` = "✘ Failed to connect".
- Agents could not drive Cursor's in-IDE browser: nothing listening on CDP port 9222 (nor 4992); `~/.cursor-cdp/cdp.cjs tabs` dead; `cursor-cdp` MCP tools fail at call time.
- Cursor-side plugin MCP servers `snyk`/`convex` log `MCP error -32000: Connection closed` at startup (logs `~/Library/Application Support/Cursor/logs/20260709T230024/`).

### Root Cause
1. **Plugin cache split-brain**: `~/.claude/plugins/installed_plugins.json` entries pointed at stale/husk cache dirs (e.g. `typescript-lsp/1.0.0` contained only LICENSE+README, no `.claude-plugin/`; `context7/unknown` failed Claude Code 2.1.205 cache validation). User-level `enabledPlugins` had no valid user-scope install for 21 plugins.
2. **Volatile npm cache**: `~/.claude/settings.json` env set `NPM_CONFIG_CACHE=/tmp/claude/npm-cache`; /tmp is wiped at reboot and swept by macOS (files >3 days). Every cold start re-downloaded npx MCP servers (firebase-tools ≈170s, desktop-commander ≈150s incl. sharp/puppeteer postinstalls) — far beyond the default 30s MCP startup timeout. The sweeper could also delete module files under a RUNNING server → mid-session plugin tool errors.
3. **Literal `${VAR}` placeholders** in settings env (GITHUB_PERSONAL_ACCESS_TOKEN etc.) — Claude Code does NOT interpolate; children received the literal string `${GITHUB_PERSONAL_ACCESS_TOKEN}` (verified via `ps eww` on MCP child PID 34392), overriding valid values inherited from `~/.zshrc`'s `.env.production` loader.
4. **CDP dead**: Cursor 3.11.6 update (Jul 8) replaced the app bundle, wiping the CDP binary wrapper. The re-wrap watchdog (`~/.local/bin/cursor-cdp-watchdog.sh`) had NEVER worked on macOS: `flock: command not found` on every run (`/tmp/cursor-cdp-watchdog.err`), plus a logic hole (stale `Cursor.original` blocked re-wrap). Port 4992 was a defunct ad-hoc reference (only in an old prompt in `~/.claude/history.jsonl`); the whole stack (mcp.json, cdp.cjs, zshrc, Cursor `cursor.cdpUrl`) standardises on 9222.

### Impacted Modules
- `~/.claude/settings.json` (env), `~/.claude/plugins/*` (cache/installed_plugins.json)
- `~/.local/bin/cursor-cdp-watchdog.sh`, `~/Library/LaunchAgents/com.vic.cursor-cdp-wrapper.plist`
- `~/.cursor/scripts/fix-cursor-internal-browser.sh` (watchdog generator), `~/.cursor/scripts/validate-cursor-config.mjs` (sessionStart hook)

### Evidence
- `~/.claude/debug/b316482f-4503-4435-81de-7630e411b0ae.txt` — 21 × "not cached" + `plugin-cache-miss` MCP skips.
- `/tmp/cursor-cdp-watchdog.err` — repeated `flock: command not found`.
- `file /Applications/Cursor.app/Contents/MacOS/Cursor` → plain Mach-O (no wrapper, no `Cursor.original`), dated Jul 8 22:19 (3.11.6).
- `lsof -iTCP:9222 / :4992` → empty; live claude MCP children in `/tmp/claude/npm-cache/_npx/*` (born 23:02, same night as reboot).

### Fix Summary
1. Reinstalled all 21 broken plugins at user scope (`claude plugin install <p>@claude-plugins-official -s user`, plus `compound-engineering@compound-engineering-plugin`) and the 8 `local-desktop-app-uploads` plugins after `claude plugin marketplace update`.
2. settings env: `NPM_CONFIG_CACHE` → `/Users/vic/.claude/npm-cache` (persistent), added `MCP_TIMEOUT=120000`, removed literal `${VAR}` placeholders (keys flow from `~/.zshrc` ← `.env.production`).
3. Pre-warmed the persistent cache (desktop-commander, firebase-tools respond to MCP `initialize` from warm cache) and default `~/.npm` (convex, snyk for Cursor-side npx MCPs).
4. Rewrote the watchdog: mkdir-based lock (no flock on macOS), stale-backup refresh, consistent ad-hoc codesign identifier; added `WatchPaths` on `.../Cursor.app/Contents/MacOS` to the LaunchAgent; fixed the generator heredoc in `fix-cursor-internal-browser.sh` so reinstalls don't regress.
5. Extended the Cursor sessionStart hook (`validate-cursor-config.mjs`) with a CDP liveness probe: a dead `--browser-url` endpoint now surfaces an agent-visible warning with the exact remediation.

### Why This Works
- User-scope reinstall re-aligns `installed_plugins.json` with real, validated cache dirs — the loader finds every enabled plugin at startup, in every project.
- A persistent npm cache survives reboots/sweeps; warm spawns answer `initialize` in seconds, far under both the default and raised startup timeouts; and a live session's `_npx` modules can no longer be swept from under it.
- Removing non-interpolated placeholders lets children inherit real key values from the shell environment.
- The watchdog now actually runs on macOS and re-wraps at the next quit window after any Cursor update; CDP:9222 then comes up on every launch path (Dock, Spotlight, terminal).
- No running process was touched: the live claude session (PID 30971) and Cursor itself were left running; the wrapper applies at the next full quit (deliberate deferral).

### Verification Evidence
- `claude -p … --debug` fresh session → debug log `068c3185…`: 0 "Plugin loading errors", 0 `plugin-cache-miss` (was 21).
- `claude mcp list` → serena/playwright/github/chrome-devtools/context7 etc. Connected; desktop-commander + firebase answer MCP `initialize` from the warm persistent cache (probes above); remaining "Needs authentication": supabase, adobe (user OAuth action).
- `node ~/.cursor/scripts/validate-cursor-config.mjs` → TOTAL ERRORS: 0 + explicit CDP-dead warning while the pre-fix Cursor instance is still running (expected until next full restart).
- `bash -n` clean on watchdog + fix script; `plutil -lint` OK on the LaunchAgent; `launchctl kickstart` ran the new watchdog with empty stderr (no-op while Cursor runs, as designed).

### Third-Party Review (gpt-5.5, read-only, adversarial) + Incorporation
Initial verdict DO-NOT-SHIP with 3 MAJOR + 2 MINOR findings — all incorporated:
1. Watchdog running-check hardened: LaunchServices-aware `cursor_running()` (osascript first, pgrep fallback), re-checked immediately before mutation, wrapper written via mktemp + atomic `mv`, temp file cleaned on EXIT trap.
2. `~/.cursor/settings.json` (Claude-compatible mirror) had the SAME volatile `/tmp/claude/npm-cache` + literal `${VAR}` placeholders — env aligned to persistent cache + `MCP_TIMEOUT=120000`, placeholders removed, header comment corrected.
3. Three stale installer copies that could re-introduce the flock watchdog (`~/.claude/scripts/fix-cursor-internal-browser.sh`, `~/.local/bin/fix-cursor-cdp`, `~/.local/bin/fix-cursor-cdp-legacy` — the last md5-identical to the pre-fix script) converted to exec shims delegating to the canonical `~/.cursor/scripts/fix-cursor-internal-browser.sh`. `rg '^\s*[^#]*\bflock\b'` across all agent script dirs: no live code hits.
4. CDP liveness probe now parses both `--browser-url=URL` and split-arg `--browser-url URL`.
5. Hook-mode evidence regenerated: `validate-cursor-config.mjs --hook` writes the endpoint row to the log and emits the `agent_message` CDP-dead warning.
Re-review verdict: **SHIP** (re-verified per-finding, read-only). Final probe: fresh claude session debug `9efde221…` = 0 plugin errors / 0 cache-miss; generator heredoc verified byte-identical to deployed watchdog after final sync.

---

# Context7 CPU Runaway + Stale-Config Purge (2026-07-10)

### Symptom
`@upstash/context7-mcp` (npx child, PID 89752) pinned 100% CPU; user demanded removal. Follow-up directive: "remove everything that is stale or out of place" across `~/.cursor/` + `~/.claude/`.

### Root Cause
Context7 shipped as a plugin on BOTH stacks — Cursor plugin `context7-plugin` (cursor-public marketplace, spawns `npx -y @upstash/context7-mcp` stdio server via its `.mcp.json`) and Claude Code plugin `context7@claude-plugins-official` — so killing the process alone let it respawn at next plugin load. Additional staleness: orphaned per-project state for deleted macOS temp workspaces, dangling skill symlinks to a pruned `~/.agents/skills/`, install records pointing at cache dirs deleted during the earlier plugin-cache sweep, an unreferenced JetBrains marketplace payload, and self-labelled TEMP debug scripts in the repo.

### Impacted Modules
- `~/.claude/settings.json`, `~/.cursor/settings.json`, `~/Library/Application Support/Cursor/User/settings.json` (enabledPlugins)
- `~/.claude/plugins/installed_plugins.json` (+ two timestamped .bak files created)
- Plugin caches under `~/.claude/plugins/cache/` and `~/.cursor/plugins/cache/cursor-public/`
- `~/.cursor/projects/*/mcps/` and `~/.cursor/projects/var-folders-*`
- `~/.claude/skills/` (symlinks), `~/.claude/plugins/marketplaces/`
- `scripts/testing/_*.mjs` (repo, untracked scratch)

### Evidence
- Process: PID 89752 `npm exec @upstash/context7-mcp` at 100% CPU (killed by prior subagent); `pgrep -fl "context7|upstash"` empty on every re-check since.
- Plugin origin: `~/.cursor/plugins/cache/cursor-public/context7-plugin/*/.mcp.json` + `~/.claude/plugins/cache/claude-plugins-official/context7/unknown/.mcp.json` (`npx -y @upstash/context7-mcp`).
- 49 dirs `~/.cursor/projects/*/mcps/plugin-context7-plugin-context7/`; 52 dirs `~/.cursor/projects/var-folders-…-T-<uuid>` whose backing `/var/folders/jg/…/T/<uuid>` paths were all gone (52/52 verified).
- 26 symlinks in `~/.claude/skills/` failing `test -e`; `installed_plugins.json` had 5 records with `installPath` dirs absent (chrome-devtools-mcp ×2, circleback, ralph-loop-infinite, ralphy); no JetBrains IDE or `~/Library/Application Support/JetBrains` on machine.
- Repo scratch: `scripts/testing/_cascade.mjs` header "TEMP — … Delete after."

### Fix Summary
1. Context7 enablement → `false` in all three settings files; 5 install records removed; both plugin caches deleted; 49 stale MCP tool-cache dirs deleted. Cannot respawn: no enablement, no cache, no install record, no mcpServers entry anywhere (`.claude.json` global + per-project checked).
2. Deleted 52 orphaned temp-workspace state dirs (~62 MB; projects dir 106→44 MB).
3. Deleted 26 dangling skill symlinks; 13 real skills remain.
4. Removed orphaned `~/.claude/plugins/marketplaces/claude-code-jetbrains-plugin` (12 MB, unreferenced by known_marketplaces.json, no JetBrains install).
5. Pruned the 5 dead install records (backup `.bak-20260710-0205`); 38 unreferenced-but-`.in_use`-marked cache versions deliberately KEPT (marker indicates loader retention; disable-over-delete rule).
6. Deleted 11 untracked `scripts/testing/_*.mjs` scratch scripts.

### Why This Works
Respawn requires an enabled plugin with a cache or install record — all four Context7 anchors (enablement flags, install records, caches, tool caches) are gone, and no raw `mcpServers` entry references upstash anywhere. Every other deletion targeted artifacts whose referent was verifiably absent (backing dir, symlink target, installPath, marketplace registration), so no working surface changed.

### Verification Evidence
- `python3 json.load` OK on all 7 touched/critical configs; `context7 … enabled=False` ×3; installed_plugins.json valid, 75 plugins.
- `node ~/.cursor/scripts/validate-cursor-config.mjs` → `TOTAL ERRORS: 0`, plugins **37/37 with manifest** (was 37/38 — the gap WAS context7-plugin), 288 skills, cursor-cdp PASS (endpoint-dead warning expected until Cursor relaunch).
- `pgrep -fl "context7|upstash"` → no matches (checked 4× across the session).
- Terminal 2 / live sessions untouched: only PID 89752 was ever killed (before this agent); Cursor, Claude desktop, firebase MCP all still running.
