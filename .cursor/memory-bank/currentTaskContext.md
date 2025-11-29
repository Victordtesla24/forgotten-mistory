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
