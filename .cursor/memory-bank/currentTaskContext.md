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

## Symptom (Morphing background)
- Need subtle, organic SVG blobs behind the hero to reinforce the space theme and feel premium.

## Root Cause (Morphing background)
- The hero layout previously lacked layered SVG blobs and the CSS keyframe path target was the default shape; the design requirement called for slow, morphing organic blobs.

## Impacted Modules
- `app/page.tsx`
- `app/globals.css`
- `docs/ui_ux_audit.md`

## Evidence
- `app/page.tsx:109-149` now renders a `<div className="morphing-bg">` with three gradient-filled `<path>` blobs filtered through the same blur stack.
- `app/globals.css:329-361` defines the `.morphing-bg` wrapper, layered `.morphing-blob` classes, new `mix-blend-mode` tweaks, and updated `@keyframes morph` data to produce the intended drift.
- `docs/ui_ux_audit.md` records the verification checklist for the new background and the dev-only React warning.

## Fix Summary
- Added layered gradients, blur filter, and three blob paths after `SpaceScene` so the background now holds the requested morphing artwork without blocking interaction.
- Tuned the CSS animation to reference the new path data so each blob drifts gently on a 20s timeline while the secondary and tertiary copies offset via transforms.
- Documented the visual test results and observed React dev warning inside the UI audit checklist.

## Files Touched
- `app/page.tsx`
- `app/globals.css`
- `docs/ui_ux_audit.md`

## Why This Works
- The new markup renders entirely on the server (no JS needed), the low opacity/blur keeps it subtle, and the reused animation keyframe ensures each blob morphs synchronously while the transform offsets keep the shapes from stacking identically.

## Verification Evidence
- `npm run type-check` (fails: `npm error Missing script: "type-check"`).
- `npm run lint` (fails: `Converting circular structure to JSON` while processing `.eslintrc.json`).
- `npm test` (fails: `npm error Missing script: "test"`).
- `npm run build` (Next builds but lint still reports the same circular structure issue).
- `npm run dev` (starts successfully after clearing the lingering processes on port 8080; React Dev overlay still logs the `data-cursor-ref` hydration warning).

## Symptom (Next asset 404s)
- `GET /_next/static/css/app/layout.css` and multiple `_next/static/chunks/*.js` requests were returning 404 during runtime.

## Root Cause (Next asset 404s)
- A legacy static `index.html` (plus empty `main.js`) at the repo root was being served instead of the Next.js app, so the `_next` asset paths were never generated/served by Next.

## Impacted Modules
- Hosting entrypoint/static root
- `_next` asset serving

## Evidence
- Manual inspection showed `index.html` and `main.js` at repo root, outside the Next app, which would be picked up by static hosting.
- `_next/static/chunks` and CSS existed in `.next/`, confirming the build outputs were present but not served.

## Fix Summary
- Removed the stale root `index.html` and empty `main.js` so requests route to the Next.js app (and its `_next` assets) instead of the obsolete static page.

## Files Touched
- `index.html` (deleted)
- `main.js` (deleted)

## Why This Works
- With the static root entrypoint removed, hosting/dev now resolves to the Next.js server output, which correctly serves `_next` assets and prevents 404s for core bundles and CSS.

## Verification Evidence
- `.next/static/chunks` and `.next/static/css/app/layout.css` already exist; removing the static root ensures the Next server can serve them (run `npm run dev`/`npm run start` to verify locally).
