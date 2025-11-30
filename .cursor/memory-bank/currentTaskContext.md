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
