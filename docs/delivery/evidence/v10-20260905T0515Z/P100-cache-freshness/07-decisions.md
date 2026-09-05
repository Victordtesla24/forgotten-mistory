# P100 — cache freshness: every deploy is visible on the next load

Task `t_cachefr01`. Worktree `.claude/worktrees/wf_b12ab287-6ab-1`, branch
`worktree-wf_b12ab287-6ab-1`, from `main` at `7ae763a6`.

## The incident, measured

The Owner reloads <https://forgotten-mistory.web.app> after a deploy and sees the
old site for up to an hour. Two independent causes, both measured before any change
(`01-headers-before.txt`, 2026-09-05T09:13Z):

| what was measured | value | why it goes stale |
|---|---|---|
| `curl -sI /` | `cache-control: max-age=3600` | Firebase's *default* browser cache. `firebase.json` set Cache-Control for `/_next/static/**`, `/assets/**`, `/docs/**` and `/sw.js` — never for the HTML document. The document is the only file that names the new chunk hashes, so an hour-old document *is* an hour-old site. |
| `curl -sI /_next/static/chunks/webpack-3e5d94ffc6a7d4c6.js` | `public, max-age=31536000, immutable` | correct, and the reason the first row is fatal: the stale document asks for the previous build's chunk URLs, which are then answered from cache forever, correctly. |
| `curl -sI /sw.js` | `no-cache` | correct — already right. |
| `public/sw.js` fetch handler | `const cached = await cache.match(request); if (cached) return cached;` | cache-first for **navigations**. A returning visitor never reached the network at all, so the header fix alone would not have helped them. |
| `public/sw.js` cache name | `const CACHE_VERSION = 'v1'` | a literal with a comment asking a human to bump it on any change. Nobody ever did, so `activate`'s "delete every cache that is not mine" step had nothing to delete on any deploy in the site's history. The precache from a visitor's first visit survived indefinitely. |

## What changed, and why this shape

**`firebase.json` — four HTML sources, `public, max-age=0, must-revalidate`.**

- Not `no-cache, no-store, must-revalidate`. `no-store` forbids the CDN and the
  browser from holding the bytes at all, which throws away the ETag revalidation
  Firebase already serves (`etag:` is in the measured response above) and pays a
  full ~120 kB transfer on every navigation. `max-age=0, must-revalidate` keeps the
  copy and forces a conditional request: a 304 when the deploy has not changed, the
  new document the instant it has.
- Four sources — `/`, `/index.html`, `**/*.html`, `/404.html` — rather than one
  `**` override. **Firebase's header precedence for overlapping `source` globs is
  not documented.** The published priority order (`firebase.google.com/docs/hosting/full-config`,
  read via context7 `/websites/firebase_google`) covers redirects and rewrites —
  "Hosting applies the first rule matching the requested path" — and says nothing
  about which of several matching `headers` entries wins. So the fix does not depend
  on a precedence rule: these four sources overlap **no** existing Cache-Control rule.
- That headers from several *matching* blocks are applied together is measured, not
  assumed: the live chunk above carries the CSP from the `**` block **and** the
  immutable Cache-Control from the `/_next/static/**` block in one response. The `**`
  block declares no Cache-Control, so nothing is overridden by accident — asserted in
  `tests/hosting_cache.test.mjs`.

**`public/sw.js` — navigations are network-first; sub-resources stay cache-first.**
The document goes to the network and the cache becomes what the file's own header
comment always claimed it was: an offline fallback. Hashed sub-resources keep
cache-first — a hit is the right bytes by construction, and revalidating them would
cost a round trip per asset for nothing. The fresh document also refreshes the cached
shell (`cache.put('/')`), so going offline right after a deploy strands nobody on the
build before last. The old catch-block navigate fallback was removed as dead code:
navigations no longer reach it.

**`scripts/build/stamp_service_worker.mjs` (new) — `CACHE_VERSION` is a build stamp.**
`__BUILD_STAMP__` in the source, rewritten to the short commit SHA in `out/sw.js`.
A new commit is a new cache name, so `activate` deletes the previous precache on the
first load after a deploy. Three decisions inside it:

- It stamps **`out/`, not `public/`**. `out/` is the deploy artifact
  (`firebase.json` `"public": "out"`). Stamping tracked source would dirty the tree
  against HEAD on every build — exactly the condition `build_stamp.mjs` treats as
  "these bytes came from no commit" (INCIDENT-01).
- The stamp is read from **`git rev-parse --short=8 HEAD`, not from
  `app/data/generated/build-stamp.ts`**. That file deliberately withholds its sha
  when the tree is dirty, because the footer must never name a commit the rendered
  bytes did not come from. A cache name makes no such claim — it only has to differ
  between deploys — so taking it from HEAD keeps local dirty-tree builds working.
  Confirmed in this run: `build_stamp.mjs` reported "tree was not clean — no commit
  stamp will render" while `[sw-stamp] out/sw.js cache name is fm-static-7ae763a6`.
- Outside a checkout it falls back to an 8-hex digest of the worker plus the built
  document — it changes exactly when the shipped bytes change. Both forms satisfy
  `^[0-9a-f]{8}$`. A missing placeholder **throws**; a silent no-op would ship the
  never-changing cache name this script exists to remove.

**`scripts/build/prune_static_export.mjs` — calls the stamp.** `package.json` is
out of scope for this task, so the stamp rides the one existing step that already
post-processes `out/` after `next build`.

**`components/site/ServiceWorkerRegister.tsx` — reload once on `controllerchange`.**
`hadController` is captured *before* registration: a first visit has no controller,
and the install that follows claims it (`clients.claim`), firing `controllerchange`
for a page already showing the current build — reloading there would be a pointless
flash. Only a controller *replacing* another means a newer build installed underneath
the visitor. A `sessionStorage` flag caps this at one automatic reload per tab; the
existing toast still covers any further update. `sessionStorage` is read inside
try/catch because merely touching it throws where site data is blocked (Safari
private browsing); the error is not swallowed — it resolves to "already reloaded",
the only direction that cannot loop.

## Gates observed in this run

| gate | command | result |
|---|---|---|
| contract test red | `node --test tests/hosting_cache.test.mjs tests/sw_strategy.test.mjs` | exit **1** — 20 tests, 7 pass, **13 fail** (`02-tests-failing.log`) |
| contract test green | same command, after the fix + `npm run build:static` | exit **0** — 20 tests, **20 pass**, 0 fail (`04-tests-passing.log`) |
| worker stamped | `grep CACHE_VERSION out/sw.js` | `const CACHE_VERSION = '7ae763a6';` |
| tsc | `npx tsc --noEmit` | exit **0** |
| lint | `npm run lint` | exit **0** — "✔ No ESLint warnings or errors" |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | exit **0** — **ALL PASS (10/10)** |
| build | `npm run build:static` | exit **0** |

The red run is a real red: `out/` had already been built from the *unmodified* source,
so the `out/sw.js` assertions failed against a genuine artifact carrying `'v1'` rather
than against a missing file.

## Two failures that are not this change

- **`tests/minivic_chat_function.test.mjs`** — `Error: Cannot find module
  'firebase-functions/v2/https'`. `functions/` has no `node_modules` in this
  worktree; the other four node suites pass (26/27). Environmental, pre-existing.
- **`tests/overhaul/durability.spec.ts` TC-DURABLE-04** — `.nav-cv` not visible.
  Run against the built export on port 5603: **6 passed, 1 failed**. The failure is
  the nav's Download CV link, asserted by a test that never registers or awaits the
  service worker; this diff touches neither `components/site/Navigation.tsx` nor
  `app/globals.css`. Pre-existing, out of scope for a cache-freshness task.
  **TC-DURABLE-05 — the offline reload — passed**, which is the assertion the
  network-first change could plausibly have broken: offline, the failed `fetch`
  falls through to the cached shell and the page still renders at status 200.

## Tools used

- `Bash` — `curl -sI` against the live site (before-headers evidence), `npm ci`,
  `npm run build:static` (twice: once before the fix so the red run had a real
  artifact, once after), `node --test`, `npx tsc --noEmit`, `npm run lint`,
  `node scripts/validate/overhaul_static_audit.mjs`, `python3 -m http.server 5603`,
  `fuser -k 5603/tcp`, `git`.
- `Read` / `Write` / `Edit` — the role prompts, `firebase.json`, `public/sw.js`,
  `components/site/ServiceWorkerRegister.tsx`, `scripts/build/{build_stamp,prune_static_export}.mjs`,
  `tests/ci_pipeline.test.mjs`, `tests/overhaul/durability.spec.ts`, `app/globals.css`,
  `playwright.config.ts`.
- `mcp__context7__resolve-library-id` + `mcp__context7__query-docs`
  (`/websites/firebase_google`) — Firebase Hosting `headers` source precedence. The
  docs specify first-match ordering for redirects and rewrites only, which is why
  the fix uses non-overlapping sources instead of relying on an override.
- `npx playwright test tests/overhaul/durability.spec.ts` — a single targeted spec
  (not the full battery) to prove the network-first change did not cost offline
  durability.
