# 09 — independent verification of P95 (deploy skew), reviewer

Reviewer run on branch `worktree-wf_6fd4d3c4-790-1` at `30198af`, worktree
`/root/forgotten-mistory/.claude/worktrees/wf_6fd4d3c4-790-1`, port 5603.
Dependencies verified against `package.json` pins before any gate:
next 15.5.25, react/react-dom 19.2.8, @react-three/fiber 9.7.0, three 0.165.0,
@playwright/test 1.57.0 — all exact.

**Verdict: FAIL — one of the author's reported gates does not reproduce.** The service-worker
half of the fix is confirmed end to end in a real browser, including the half the author
could not observe. The scene-boundary spec the author added, `TC-SKEW-02`, is red here on a
clean build of this branch: 4 runs, 4 failures, same assertion.

## Gates observed

| gate | command | result |
|---|---|---|
| build | `npm run build:static` | `BUILD_EXIT:0`; `[sw-stamp] out/sw.js cache name is fm-static-30198af1 (git HEAD); precaching 68 build asset(s)` |
| precache manifest == disk | node comparison of `out/sw.js` `PRECACHE_ASSETS` vs `out/_next/static/**` | 68 == 68, `equal: true`, placeholder gone, 0 entries missing on disk, payload 2 623 604 B (2.50 MB) |
| node tests | `node --test tests/sw_strategy.test.mjs tests/hosting_cache.test.mjs` | `# pass 27  # fail 0`, `NODE_TEST_EXIT:0` (09-node-tests.log) |
| tsc | `npx tsc --noEmit` | `TSC_EXIT:0`, no diagnostics |
| lint | `npm run lint` | `✔ No ESLint warnings or errors`, `LINT_EXIT:0` |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | `RESULT: ALL PASS (10/10)`, `AUDIT_EXIT:0` |
| playwright battery | `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5603 npx playwright test tests/overhaul/scene-error-boundary.spec.ts tests/overhaul/render.spec.ts tests/overhaul/cinematic.spec.ts --workers=2` | **`2 failed`, `12 passed (1.2m)`, `PW_EXIT:1`** (09-playwright.log) |
| TC-SKEW-02 alone | same, `-g "TC-SKEW-02" --repeat-each=3 --workers=1` | **3 failed / 3**, `SKEW02_EXIT:1` (09-skew02-repeat3.log) |
| cutover simulation | `node 09-cutover-harness.mjs /tmp/rev-build-a /tmp/rev-build-b` | `CUTOVER: PASS`, `CUTOVER2_EXIT:0` (09-cutover-independent.log) |

Red-before, checked against the branch point `4879b1e` rather than taken on trust:
`PRECACHE_ASSETS`, `KEEP_GENERATIONS`, `matchAcrossGenerations`, `LEDGER_CACHE` each occur
0 times in `4879b1e:public/sw.js`, and `SceneErrorBoundary` 0 times in
`4879b1e:components/gl/Scene.tsx` — every new assertion in `tests/sw_strategy.test.mjs`
fails on the pre-fix source.

## The cutover, re-run independently — and the open half closed

The author's run left one half unobserved: build B's worker never reached `activate`, so
"keeps exactly two generations, drops the older" was asserted only statically, and the
A-only probe was a `_buildManifest.js` rather than a re-hashed lazy chunk. This run fixes
both. Build B is derived from the real export with **every lazy chunk re-hashed** (7 of
them) and a new cache name, so build A's chunk filenames genuinely 404 on build B's origin —
the incident's exact shape. The still-open build-A page then updates its registration, so
build B's worker installs, activates and claims the page *while the reader is still on
build A's document*.

```
build A stamp        : fm-static-30198af1  (precache 68 assets, 7 lazy chunks)
build B stamp        : fm-static-b0b0b0b0
visit 1 (build A)    : worker controlling, cache fm-static-30198af1 holds 70 entries
origin now answers   : /_next/static/chunks/162.6490edc6d7909ed0.js -> HTTP 404
worker answers       : /_next/static/chunks/162.6490edc6d7909ed0.js -> HTTP 200, 5403 bytes
mid-visit scroll (A) : sections 6, canvases 2, chunk errors 0, error shell false
  chunks on scroll   : 200 743.45e97a893c99a0d7.js | 200 427.dc6df1e7370e8fb2.js
                       | 200 366.49d1290033776ffb.js | 200 315.4e3b21383d309578.js
  pageerrors         : none
build B page         : sections 6, canvases 1, error shell false
generations (B active): fm-generations, fm-static-30198af1, fm-static-b0b0b0b0
  build A kept: true · build B present: true · stale 3rd dropped: true
CUTOVER: PASS
```

Chunks `743` and `427` are the two the 10:09Z monitor reported as
`Loading chunk 427.8222755a6b18eedc.js failed`. Here they are answered `200` from the
previous generation's cache after the deploy that deleted them from the origin, with the
scene mounting (2 canvases) and no page error. That is the incident, fixed, observed.

Note on the author's `stale 3rd dropped: false`: reading `caches.keys()` as soon as the new
cache name appears reads it during **install** (`caches.open(CACHE_NAME)` creates the name
before `activate` runs), which is why neither their run nor this one's first snapshot saw
the collection. Read again after the reload, with build B's worker active, the ledger has
done its job: exactly two `fm-static-*` generations, the seeded third
(`fm-static-deadbeef`) deleted. The `KEEP_GENERATIONS = 2` logic is therefore observed, not
merely asserted in source text.

## The failure

`tests/overhaul/scene-error-boundary.spec.ts:165` — TC-SKEW-02:

```
Error: an uncaught page error escaped: Error: fm-test: forced WebGL context creation failure
expect(received).toHaveLength(expected)
Expected length: 0
Received length: 1
Received array:  ["Error: fm-test: forced WebGL context creation failure"]
```

Deterministic: 1 failure in the battery plus 3/3 under `--repeat-each=3`. The assertions
*before* it pass — `section[id]` count is 6, `#hero h1` reads "Vikram Deshpande", the body
matches no error shell — so the containment goal of `t_e9d4e10f` holds: a thrown renderer
does not replace the document. What does not hold is the spec's own contract that no
uncaught error reaches `window`: with React 19 the throw from the patched
`HTMLCanvasElement.prototype.getContext` surfaces as a page error rather than being
swallowed by `SceneErrorBoundary`, so `pageErrors` is 1, not 0.

Two possibilities, and this review cannot separate them without touching the code (which a
reviewer does not do): either the boundary is catching the render error while React 19 also
reports it to `window` (in which case the assertion is wrong and should allow the forced
`fm-test:` error), or R3F raises this particular failure asynchronously, outside any
boundary's reach (in which case the boundary does not contain the case the spec claims it
does, and the fix needs a `window.onerror` guard or a different injection point). Either way
the branch's own new spec is red, and the author's reported gate — "TC-SKEW-01 and TC-SKEW-02
both pass" — is not reproducible on a clean build.

`TC-RENDER-07` (hero screenshot baseline, `81552 pixels (ratio 0.09)`) also fails here, which
matches the author's disclosure and their reading that it is pre-existing: the baseline PNG
predates two hero-shader commits on `main` and nothing in this branch changes hero pixels.
Not attributed to this lane.

## Environment note (not a finding against this change)

`/root/forgotten-mistory/node_modules` has **next 14.2.35** installed while `package.json`
pins **15.5.25**; a build against it dies in `patch-incorrect-lockfile.js`
(`TypeError: Cannot read properties of undefined (reading 'os')`). This worktree carried no
`node_modules` at review time, so this run used a hardlink copy of a sibling worktree's
tree, which matches every pin exactly (verified above). The main checkout's install is stale
and will fail any build run from it.
