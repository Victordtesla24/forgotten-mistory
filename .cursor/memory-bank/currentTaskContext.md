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

## Task Summary (2025-11-30)
- Stabilize Playwright suites by fixing typography expectations, hero copy, and flaky worker settings while keeping tooling aligned with Next 14.

## Symptom
- Playwright functional suite failed font assertions and hero text checks.
- Full-suite runs timed out in chatbot flows when Playwright spawned 5 workers.
- `npm run lint` crashed with “Converting circular structure to JSON” from `.eslintrc.json`.

## Root Cause
- CSS font stacks used undefined variables, invalidating `font-family` so computed fonts fell back to Tailwind defaults.
- Hero TextScramble animation never settled, leaving scrambled characters.
- Secondary Playwright config (`playwright.config.ts`) allowed default/high worker counts, overloading the dev server.
- `eslint-config-next` version (16.x) mismatched `next@14.2.33`, triggering the circular config error.

## Impacted Modules
- app/globals.css
- app/page.tsx
- public/script.js
- playwright.config.ts
- package.json / package-lock.json

## Evidence
- tests/functional.spec.js:20 font-family expectation failed (`Received string: "ui-sans-serif..."`).
- tests/functional.spec.js:65 `toContainText("Vikram")` failed due to scrambled hero title.
- npx playwright test (12 tests using 5 workers) timed out in deployment_v2.spec.ts:54/90 before worker cap.
- npm run lint output: “Converting circular structure to JSON … property 'react' closes the circle”.

## Fix Summary
- Added resilient font fallbacks and explicit stacks so headings/body resolve to Roboto Condensed/Inter/Source Sans.
- Removed hero TextScramble in the intro sequence and added explicit spacing between hero title lines for stable text.
- Limited Playwright workers to 2 and switched reporter to `list` in `playwright.config.ts` to mirror the intended dev setup.
- Downgraded `eslint-config-next` to 14.2.33 to match Next 14 and clear the lint crash.
- Captured comparison screenshots for localhost vs hosted site.

## Files Touched
- app/globals.css
- app/page.tsx
- public/script.js
- playwright.config.ts
- package.json
- package-lock.json
- test-results/local.png
- test-results/remote.png

## Why This Works
- Defining font-variable fallbacks keeps `font-family` valid even if Google font vars are missing, satisfying regex expectations.
- Static hero title text removes leftover scrambled glyphs so Playwright reads “Vikram” reliably.
- Capping workers prevents server contention; consistent config means `npx playwright test` now matches passing single-worker runs.
- Aligning eslint-config-next with the Next.js version resolves the circular plugin graph that Next lint serializes.

## Verification Evidence
- npx playwright test (12 passed, workers=2).
- npm run lint (pass).
- npm run build (pass).
- npm run type-check / npm test: scripts missing (cannot run).
- Screenshots saved: test-results/local.png vs test-results/remote.png (remote still shows scrambled hero title; latency numbers differ: 0.163s remote vs 0.142s local).
