import { ensureStaticBuild } from './overhaul/helpers/staticServer';

/**
 * Playwright globalSetup — materialise the production static export (`out/`) EXACTLY
 * ONCE, in the main process, before the worker pool spawns.
 *
 * Root cause this fixes (the long-red CI `test` job):
 *   boot / perf / durable / reduced-motion each call `ensureStaticBuild()` in their
 *   `beforeAll`. On a fresh checkout `out/` is absent, so with `fullyParallel` +
 *   `workers: 3` all three workers ran `npm run build:static` CONCURRENTLY — each
 *   clean step wiped another build mid-flight, producing the ENOENT (`_error.js` /
 *   `_not-found.rsc` / `next-font-manifest.json`) and ENOTEMPTY (`.next/export`)
 *   failures that cascaded into ~46 red specs and blocked `build` + `deploy`.
 *
 * Building here runs `build:static` once before any worker starts, so every per-spec
 * `ensureStaticBuild()` finds a fresh `out/` (the mtime guard short-circuits) and is a
 * no-op. One build, zero worker concurrency, no race.
 *
 * Ordering caveat (verified against Playwright 1.57 source — runner/tasks.js +
 * taskRunner.js): the `webServer` is started BEFORE this globalSetup. `build:static`
 * shares the default `.next` with the server build, so if it ran here it would
 * `rm -rf .next` out from under the already-live `next start -p 8080`. CI therefore
 * runs `npm run build:static` as a dedicated step BEFORE Playwright (see deploy.yml
 * `test` job) — `out/` is already fresh when this globalSetup runs, so it no-ops and
 * never disturbs the live server. This globalSetup remains the build site for the
 * LOCAL `npx playwright test` loop, where the webServer is `next dev` (which tolerates
 * a `.next` rebuild) and there is no pre-build step.
 */
async function globalSetup(): Promise<void> {
  ensureStaticBuild();
}

export default globalSetup;
