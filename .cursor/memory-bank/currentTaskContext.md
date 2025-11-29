# Current Task Context

## Symptom
User reported "There is no Parallax effect" despite previous CSS changes.

## Root Cause
CSS `perspective` and `translateZ` on the scrolling body can be unreliable or conflict with smooth scroll libraries (Lenis) depending on the exact DOM structure.

## Impacted Modules
- `app/page.tsx`: Added GSAP logic and `data-speed`/`data-parallax` attributes.
- `app/globals.css`: Removed conflicting CSS 3D transforms for desktop (kept mobile reset).
- `public/script.js`: Relied on for existing mouse parallax logic.

## Fix Summary
- **Scroll Parallax**: Added a `useEffect` in `app/page.tsx` using `gsap.to` with `ScrollTrigger` scrub to move elements vertically based on scroll position and `data-speed`.
- **Mouse Parallax**: Added `parallax` class and `data-speed` attributes to hero elements so `public/script.js` picks them up for mouse movement.
- **Cleanup**: Removed CSS `perspective` from `.hero-section` to allow GSAP full control.

## Files Touched
- `app/page.tsx`
- `app/globals.css`
- `docs/ui_ux_audit.md`

## Verification Evidence
- `npm run dev` confirms no errors.
- Visual inspection confirms elements move at different speeds on scroll and mouse hover.

## Symptom
- Cursor interactions currently lack a glowing particle trail, so the space-themed hero still feels static.

## Root Cause
- There was no DOM/canvas trail implemented; the runtime never spawned accent dots to follow the pointer and the stylesheet lacked a `.cursor-trail` definition.

## Impacted Modules
- `public/script.js`
- `app/globals.css`
- `.cursor/memory-bank/currentTaskContext.md`
- `.cursor/memory-bank/progressTracking.md`

## Evidence
- `public/script.js:38-128` now adds `initCursorTrail()` with a 20-item object pool and registers the mousemove handler.
- `app/globals.css:198-216` introduces `.cursor-trail` styling with glow, pointer-events- off, and a `prefers-reduced-motion` guard.

## Fix Summary
- Introduced `initCursorTrail()` that instantiates a pre-allocated pool of accent dots, repositions a recycled element on every mouse move, and uses CSS transitions so each dot fades/shrinks over 500 ms.
- Styled `.cursor-trail` with accent color, glow, and high z-index, plus disabled rendering when `prefers-reduced-motion: reduce` is active.

## Files Touched
- `public/script.js`
- `app/globals.css`
- `.cursor/memory-bank/currentTaskContext.md`
- `.cursor/memory-bank/progressTracking.md`

## Why This Works
- Object pooling avoids allocating new nodes per move while the transition- driven animation provides a smooth fade-and-shrink trail that matches the specified duration.
- The CSS ensures every dot glows with `--accent-color`, remains pointer-events-free, and is hidden for users who request reduced motion.

## Verification Evidence
- `npm run type-check` (fails: `npm error Missing script: "type-check"`; the package only exposes `dev`, `build`, and `lint` scripts).
- `npm run lint` (fails: Next/ESLint surfaces `Converting circular structure to JSON` while reading `/Users/Shared/cursor/forgotten-mistory/.eslintrc.json`).
- `npm test` (fails: `npm error Missing script: "test"`).
- `npm run build` (Next builds pages but the lint phase still errors with the same circular structure warning before continuing to collect page data).
- Screenshot comparison between `http://localhost:8080` and `https://forgotten-mistory.web.app/` shows the local hero text `Hello, I'm Vikram.` while production displays `Hello, I'm Vikram .` plus similar navigation/button layout otherwise.

## Symptom (Chunk 404)
- Dev server logs recorded repeated `GET /_next/static/chunks/main-app.js` and `GET /_next/static/chunks/app-pages-internals.js` returning 404 immediately after every page load (see `terminals/24.txt` lines 21-52).

## Root Cause (Chunk 404)
- `next.config.js` still forced `output: 'standalone'`, which prevented the dev middleware from emitting the standard `main-app` and `app-pages-internals` hot bundles under the non-hashed names that the page references, so those requests resolved as 404.

## Impacted Modules
- `next.config.js`
- `_next/static/chunks` bundle lookup

## Evidence
- `terminals/24.txt:21-52` shows the missing chunk requests.
- `curl -I http://localhost:8080/_next/static/chunks/main-app.js` returned 404 before the config change.

## Fix Summary
- Removed the `standalone` output mode so the dev server rebuilds using the default Next output, which delivers `main-app.js` and `app-pages-internals.js` bundles where the loader expects them.

## Files Touched
- `next.config.js`

## Why This Works
- Without `output: 'standalone'`, Next’s built-in dev middleware generates the standard chunk filenames and serves them directly from `_next/static/chunks/`, so the loader scripts now resolve and no longer hit 404.

## Verification Evidence
- `npm run type-check` (fails: `npm error Missing script: "type-check"`).
- `npm run lint` (fails: `Converting circular structure to JSON` while processing `.eslintrc.json`; same as before).
- `npm test` (fails: `npm error Missing script: "test"`).
- `npm run build` (Next builds but lint still reports the circular structure issue).
- `curl -I http://localhost:8080/_next/static/chunks/main-app.js` → 200 OK (new).
- `curl -I http://localhost:8080/_next/static/chunks/app-pages-internals.js` → 200 OK (new).
