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
