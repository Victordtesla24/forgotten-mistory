# P95 deploy skew — decisions

## 1. The precache manifest is generated, never written by hand

`scripts/build/stamp_service_worker.mjs` already owned `out/` after `next build` and already
rewrote one placeholder there (`__BUILD_STAMP__`). The asset list rides the same step:
`collectPrecacheAssets(outDir)` walks `out/_next/static`, keeps `.js`, `.css` and `.woff2`,
and `injectPrecacheAssets` replaces `__PRECACHE_ASSETS__` with the sorted JSON array.

Sorted, because two builds of identical output must produce identical worker bytes.
Injected into `out/` and not `public/`, for the reason the file's own header gives: stamping
source would dirty the tree against HEAD on every build, which is the exact condition
`build_stamp.mjs` treats as "these bytes came from no commit" (INCIDENT-01).

Both failure modes throw rather than no-op — an absent placeholder and an empty manifest.
A silent no-op is how the never-changing `CACHE_VERSION = 'v1'` shipped for the site's whole
history; the same mistake with an empty precache would be this outage shipped again.

## 2. Images and video are not precached

The manifest is the executable build plus the faces it renders in. `/_next/static` fonts are
included because a missing one is a visible layout shift; images and video are not, because
they are large, they are not re-hashed per build (so they do not go missing on deploy), and a
missing one degrades to alt text rather than to a broken page. The measured manifest is 66
files for this build — small enough to precache on a phone, which a media-inclusive list
would not be.

## 3. "The previous generation" is recorded, not inferred

The cache name is `fm-static-<commit sha>`, and SHAs have no order, so the worker cannot look
at `caches.keys()` and know which entry preceded it. `CacheStorage.keys()` does return names
in creation order per spec, but relying on an ordering guarantee no test on this host can
observe is exactly the kind of assumption that produced the original bug. So `activate`
keeps an explicit ledger — a JSON array, newest first, in a cache named `fm-generations`
(deliberately outside the `fm-static-` prefix so the cleanup cannot eat its own bookkeeping)
— and truncates it to `KEEP_GENERATIONS = 2`.

Two, not more: one generation is the outage (build N's chunks are deleted under the page
still running build N); three would hold roughly 200 files of dead build for a window nobody
is still inside. Measured in the cutover run: after build B activates, `fm-static-<A>` is
still present and a synthetic older generation is gone.

## 4. The 404 rescue is a second key, not a substitute

`fetch` for `/_next/static/**` stays cache-first. What is new is that a **404 from the
network** — not only a connection failure — searches every surviving `fm-static-*` cache with
`ignoreSearch`. This is the case the incident actually hit: the visitor is online, the origin
answers promptly, and its answer is "that file does not exist any more".

## 5. The app-level recovery resolves; it never rejects

`components/gl/Scene.tsx` wraps the dynamic import. A `ChunkLoadError` retries once after
800 ms, then reloads the page once per session (`sessionStorage['fm-chunk-reload']`) — a
reload is the only way to obtain the current document, which is the only file that names the
chunks that do exist. If it has already reloaded, the loader **resolves to an empty
component** rather than re-throwing, so nothing propagates and `app/error.tsx` is
unreachable from this path. One `console.error` per page, module-level guarded, because
three scenes share one failed import.

Non-chunk errors are re-thrown deliberately: a broken shader is a real fault and belongs in
the boundary, not silently swallowed.

## 6. The scene-local boundary renders nothing, and does not reset (t_e9d4e10f)

`SceneErrorBoundary` renders `null` on failure — the same state a reader with no WebGL or
with reduced motion already gets, which is the path every section is built and tested
against. It does not reset: a renderer that failed to obtain a context will fail again, and
re-mounting it would loop. `app/error.tsx` stays for genuine page-level faults.

## 7. The spec blocks service workers on purpose

`tests/overhaul/scene-error-boundary.spec.ts` sets `serviceWorkers: 'block'`. In production
the precache answers first, and leaving the worker in would let it satisfy the 404'd request
so the spec would pass without ever executing the recovery code it exists to protect. The
worker half is asserted separately by `tests/sw_strategy.test.mjs` and measured end-to-end by
the cutover simulation (`06-cutover.log`).

## Tools used

- `Bash` — builds, `node --test`, `npx playwright test`, the static audit, `python3 -m
  http.server` on :5603, git.
- `Read` / `Edit` / `Write` — `public/sw.js`, `scripts/build/stamp_service_worker.mjs`,
  `components/gl/Scene.tsx`, `components/gl/GLCanvas.tsx`, the two test files, this evidence.
- `@playwright/test` (`chromium.launchPersistentContext`) — the cutover simulation harness,
  run from `/tmp/fm-cutover.mjs` so no throwaway script lands in the repository.
