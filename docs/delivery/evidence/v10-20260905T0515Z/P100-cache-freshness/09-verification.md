# P100 cache freshness — independent verification (3rd-party adversarial review)

Reviewer: council verifier (reviewer profile, level 1, effort max).
Subject: `51bffe5 fix(hosting): make every deploy visible on the next load`, branch
`worktree-wf_b12ab287-6ab-1`, merged to `main` as `e25ed57`, deployed as build `4a003ba0`.
Run window: 2026-09-05T09:22Z → 09:32Z. Every line below is a command run in this session.

**Verdict: FAIL** — the reported incident is fixed and every claimed gate reproduces, but the
diff introduces one measured regression (F1) and leaves two of the site's three HTML routes on
the one-hour default it set out to remove (F2). Neither is caught by the two new suites, and
neither suite runs in CI (F3).

---

## 1. Gates re-run in the author's worktree

`cd /root/forgotten-mistory/.claude/worktrees/wf_b12ab287-6ab-1` — clean tree at `51bffe5e`.

| gate | command | exit | observed |
|------|---------|------|----------|
| build | `npm run build:static` | 0 | `✓ Compiled successfully in 22.7s`; `[prune] done — 3 artifact(s) removed`; `[sw-stamp] out/sw.js cache name is fm-static-51bffe5e (git HEAD)` |
| contract tests | `node --test tests/hosting_cache.test.mjs tests/sw_strategy.test.mjs` | 0 | `# tests 20  # pass 20  # fail 0` |
| types | `npx tsc --noEmit` | 0 | no diagnostics |
| lint | `npm run lint` | 0 | `✔ No ESLint warnings or errors` |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | 0 | `RESULT: ALL PASS (10/10)` |
| stamp landed | `grep CACHE_VERSION out/sw.js` | 0 | `const CACHE_VERSION = '51bffe5e';` — equals `git rev-parse --short=8 HEAD`, no `__BUILD_STAMP__` left |

The author's testimony matches on every one of these.

## 2. Live headers after the pipeline deployed (`https://forgotten-mistory.web.app`)

Deploy landed 09:26:12Z; the poll flipped off `max-age=3600` on that tick.

```
GET /                       200  cache-control: public, max-age=0, must-revalidate
                                 etag: "d344ae6db8fb2cac325d04009d21eef88992dbd8849e41d8283f43e2a0e642c5"
                                 <meta name="build-commit" content="4a003ba0">
GET /sw.js                  200  cache-control: no-cache · service-worker-allowed: /
                                 const CACHE_VERSION = '4a003ba0';   ← equals the deployed build-commit
GET /_next/static/chunks/webpack-3e5d94ffc6a7d4c6.js
                            200  cache-control: public, max-age=31536000, immutable   (unchanged)
GET /index.html             301  cache-control: public, max-age=0, must-revalidate → /
GET /nope-does-not-exist    404  cache-control: public, max-age=0, must-revalidate
GET /terms                  200  cache-control: max-age=3600      ← see F2
GET /privacy                200  cache-control: max-age=3600      ← see F2
```

Before this change the same `curl -sI /` read `cache-control: max-age=3600` and `/sw.js` carried
`const CACHE_VERSION = 'v1';` (measured 09:22:49Z, before the deploy landed).

## 3. Live browser check (Chrome channel, `--no-sandbox`, fresh profile, two loads)

```json
{"load-1": {"status": 200, "cacheControl": "public, max-age=0, must-revalidate",
            "controller": true, "buildCommit": "4a003ba0", "caches": ["fm-static-4a003ba0"]},
 "load-2": {"status": 200, "cacheControl": "public, max-age=0, must-revalidate",
            "controller": true, "controllerScript": ".../sw.js",
            "buildCommit": "4a003ba0", "caches": ["fm-static-4a003ba0"]},
 "pageErrors": []}
```

Second load is controlled by the worker, its `build-commit` meta equals the document the network
serves, and exactly one cache exists — named for the build, so the previous precache was retired.
No stale shell, no page errors.

Second probe, same profile: the online navigation is `fromServiceWorker: true` and carries the
live ETag (network-first passthrough); with the context set offline the reload still returns 200,
renders `Vikram Deshpande` and keeps 3 CV links — offline durability survived the strategy change.

## 4. Findings

### F1 — a `/terms` or `/privacy` visit replaces the homepage's offline shell (regression, new in this diff)

`public/sw.js` navigation branch:

```js
if (fresh && fresh.status === 200 && fresh.type === 'basic') {
  cache.put('/', fresh.clone());          // ← the key is hardcoded, the request is not consulted
}
```

Every navigation response is written under the key `'/'`, whatever was navigated to. Measured on
production (Chrome, fresh profile, worker controlling):

1. load `/` → worker installs, precaches `'/'`
2. load `/terms` → the navigate branch overwrites the `'/'` entry with the Terms document
3. go offline, load `/` → **renders the Terms page at the homepage URL**

```json
{"offlineHome": {"status": 200, "title": "Terms — Vikram Deshpande", "h1": "Terms",
                 "url": "https://forgotten-mistory.web.app/"},
 "cacheKeysForRoot": {"names": ["fm-static-4a003ba0"],
                      "shellTitle": "Terms — Vikram Deshpande", "shellBytes": 27252}}
```

The pre-change worker could not do this: its runtime `cache.put` keyed every response by its own
request, and nothing but `install` ever wrote `'/'`. `TC-DURABLE-05` cannot catch it because it
only ever navigates to the homepage.

Fix (one line): key the entry by the request, and refresh the shell only for the root.

```js
const url = new URL(request.url);
cache.put(request, fresh.clone());
if (url.pathname === '/') cache.put('/', fresh.clone());
```

Worth pairing with a durability assertion that visits `/terms`, goes offline and asserts the
homepage still renders the hero.

### F2 — the clean-URL routes are still on Firebase's one-hour default

`firebase.json` adds four HTML sources: `/`, `/index.html`, `**/*.html`, `/404.html`. Hosting
matches a header source against the **request path**, and with `cleanUrls: true` the two secondary
pages are requested as `/terms` and `/privacy` — which match none of the four. Measured above:
both still return `cache-control: max-age=3600`, the exact value this task set out to remove.
`hosting_cache.test.mjs` cannot see it: it asserts the text of `firebase.json`, not what the CDN
serves, and its `HTML_SOURCES` list is the same four sources the config declares (the test and the
config are the same claim written twice).

Fix: add `/terms` and `/privacy` sources (or an explicit list generated from the export's HTML
files), and assert the served header rather than the config, e.g. a post-deploy curl gate.

### F3 — neither new suite runs in CI

`.github/workflows/checks.yml` names its node suites explicitly:

```
node --test tests/ci_pipeline.test.mjs tests/static_audit_fail.test.mjs \
            tests/github-telemetry.test.mjs tests/minivic_chat_function.test.mjs
```

`tests/hosting_cache.test.mjs` and `tests/sw_strategy.test.mjs` are not in that list, so the two
contract tests written to prevent this incident's recurrence never run unless a human runs them.
`hosting_cache` belongs in that step as-is; `sw_strategy` reads `out/sw.js` and so belongs in the
playwright job, after its `npm run build:static` step.

### F4 — `scripts/build/stamp_service_worker.mjs` contains a raw NUL byte

Offset 4431 (line 93) is a literal `U+0000` used as the hash domain separator in
`.update('\0')`. Git therefore classifies the file as binary — `git diff --stat` reports
`Bin 0 -> 5665 bytes`, it produces no reviewable textual diff, it will not merge textually in the
consolidate-and-deploy pipeline, and default `grep` skips it as binary (a future dead-code or
secret scan can silently pass over it). Write the two-character escape (backslash-zero) or a printable separator
instead; the hash is unaffected.

### F5 — informational: one more stale load for visitors already carrying the `v1` worker

The auto-reload lives in the new bundle, so it cannot run on a page the old worker served. A
returning visitor gets the cached shell once more, the new worker installs underneath, and the
**old** registrar shows its "A new version is available · Reload" toast. From the second load
onward everything is fresh. Nothing to fix — but if the Owner sees the old page once after this
deploy, a single reload clears it permanently.

### F6 — minor: the shell refresh is not awaited

`cache.put('/', fresh.clone())` in the navigate branch is neither awaited nor wrapped in
`event.waitUntil`, so a worker terminated immediately after the response is returned can drop the
refresh. Low impact (the next navigation retries it), but `event.waitUntil(cache.put(...))` costs
nothing.

## 5. Claims checked against the artefacts

- `05-battery-node-tests.log` — the `firebase-functions/v2/https` failure is environmental
  (`functions/` has no `node_modules` in a fresh worktree), not caused by this diff. Confirmed.
- `05-battery-durability-spec.log` — `TC-DURABLE-04` asserts `.nav-cv` is visible; the diff touches
  neither `components/site/Navigation.tsx` nor `app/globals.css` (`git diff HEAD~1 --stat`), so the
  failure cannot originate here. Confirmed pre-existing.
- The header-precedence reasoning in `07-decisions.md` holds for the sources that were added: the
  new HTML rules and `/docs/**` declare the identical value, and `**` declares no `Cache-Control`,
  so no matching pair disagrees. The gap is coverage (F2), not precedence.
