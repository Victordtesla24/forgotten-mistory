# F-react19-r3f9 — React 19 + @react-three/fiber 9, so the scenes mount under next 15

**Task** `t_r19r3f9` · **Role** coding, level 2, effort xhigh
**Worktree** `/root/forgotten-mistory/.claude/worktrees/wf_a0a1850a-28a-1` ·
**Branch** `worktree-wf_a0a1850a-28a-1` · **Base** `6dbb799` (main)
**Port** 5603 (`python3 -m http.server 5603 --directory out --bind 127.0.0.1`)

The durable lane for the crash proved in `C16-about-field/07-decisions.md` §"The blocker":
at `?gl=force` main fell into `app/error.tsx` with
`TypeError: Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')`
because `@react-three/fiber@8.18.0` reads a React internal that the React 19 vendored by
`next@15.5.25` no longer publishes. This lane reconciles the React major upward so
`next` 15 stays and `npm audit` stays clean.

---

## S-1 Inventory (before)

`01-inventory-before.log` — `npm ls` exit **1** (`ELSPROBLEMS`), a single deduped
`react@18.2.0` tree, `@react-three/fiber@8.18.0`, `@react-three/drei@9.122.0`,
`three@0.165.0`, `@types/react@18.2.61`, `@types/react-dom@18.2.19`.

The tree was **already broken before this change**:

```
npm error invalid: three@0.165.0 .../node_modules/three
  three@0.165.0 deduped invalid: ">= 0.168.0 < 0.186.0" from node_modules/postprocessing
```

Imports of `@react-three/*` and `react-dom` across `components/ lib/ app/`:

| Import | Where |
|---|---|
| `ScreenQuad` from `@react-three/drei` | `Hero/HeroAtmosphere.tsx`, `About/AboutField.tsx`, `Experience/CareerStrata.tsx` |
| `useFrame`, `useThree` from `@react-three/fiber` | the same three files |
| `Canvas` from `@react-three/fiber` | `components/gl/GLCanvas.tsx` |
| `useSyncExternalStore` from `react` | `lib/githubTelemetry.ts:803` |

**Only one drei helper is used site-wide — `ScreenQuad`** — which survives drei 10 unchanged.
`grep` for `ReactDOM`, `react-dom/client`, `findDOMNode`, `defaultProps` over
`components/ lib/ app/` returns **no matches**, so none of React 19's removals are touched.
`useSyncExternalStore` is imported from `react` itself, not a shim.

## S-2 The upgrade, and the two things that actually blocked it

| Package | Before | After |
|---|---|---|
| `react` / `react-dom` | 18.2.0 | **19.2.8** |
| `@types/react` | 18.2.61 | **19.2.18** |
| `@types/react-dom` | 18.2.19 | **19.2.7** |
| `@react-three/fiber` | 8.18.0 | **9.7.0** |
| `@react-three/drei` | 9.122.0 | **10.7.8** |
| `lucide-react` | 0.344.0 | **1.41.0** |
| `@react-three/postprocessing` | ^2.16.3 | **removed** |
| `three` / `@types/three` | 0.165.0 | unchanged |

**1. `@react-three/postprocessing` was the real blocker, and it was dead weight.**
`npm install` failed `ERESOLVE` on `peer @react-three/fiber@"^8.0" from
@react-three/postprocessing@2.19.1`. It is imported **nowhere** — a repo-wide grep over
`*.ts,*.tsx,*.mjs,*.js` finds it only in `package.json` and in `next.config.js`'s
`transpilePackages`. Its transitive `postprocessing@6.x` is also the sole source of the
pre-existing `three@0.165.0 invalid` error above. Upgrading it to v3 would have forced
`three >= 0.156` *and* dragged `postprocessing@^6.36.0`'s `three >= 0.168` peer along,
i.e. a `three` major bump through the three GLSL scenes with no test able to see the
result on this GPU-less host. Deleting an unused dependency removes the conflict, clears
the pre-existing tree error, and cannot change behaviour because no module imports it.
Its `transpilePackages` entry is deleted in the same commit so no dead config is left.

**2. `lucide-react@0.344.0` peers `react ^16.5.1 || ^17 || ^18`** — a hard `ERESOLVE`
against React 19. Bumped to 1.41.0 (`react ... || ^19.0.0`). The twelve icons
`MiniVicBot.tsx` imports are unchanged; `tsc` proves it.

The stale `package-lock.json` had to be regenerated — with it in place npm kept anchoring
on `Found: @react-three/drei@9.122.0` and refused every resolution. It is regenerated and
committed alongside `package.json`.

## S-2b The two type errors React 19 surfaced — fixed in real code, no suppressions

**`components/sections/Vitrine/Drawings.tsx:338` — `TS2503: Cannot find namespace 'JSX'`.**
`@types/react` 19 removes the *global* `JSX` namespace; it now lives on `React.JSX` and is
re-exported as a named type. `Record<DrawingId, () => JSX.Element>` therefore no longer
resolves. Fixed by importing the type it already meant: `import type { JSX } from 'react';`.
No `@ts-ignore`, no `any`.

**`tests/a11y/accessibility.spec.ts` — four `TS2322`/`TS2740` "Page is not assignable to
Page"** — two copies of `playwright-core` in the tree. Regenerating the lock hoisted
`playwright-core@1.63.0` (pulled by `@axe-core/playwright`) while the pinned
`playwright@1.57.0` kept a nested `1.57.0`, so `page` crossed two different `Page` types.
Fixed by pinning one copy in the existing `overrides` block:
`"playwright-core": "1.57.0"` — matching the exact `playwright`/`@playwright/test` pin the
repo already declares. This is a real single-version fix, not a silenced error.

## S-3 The proof at `?gl=force` — the crash is gone

`03-probe.mjs` → `03-probe.json`, `03-probe-sections.mjs` → `03-probe-sections.json`.
Playwright `channel: 'chrome'`, args
`['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']`.

| | 1440×900 | 390×844 |
|---|---|---|
| `#hero h1` | 1 — "Vikram Deshpande" | 1 — "Vikram Deshpande" |
| canvases at hero | **1** | **1** |
| `errorShell` (`app/error.tsx`) | **false** | **false** |
| `pageErrors` | **[]** | **[]** |
| console errors | **[]** | **[]** |
| section ids | all six | all six |

Per-section, scrolled and settled 6 s each (`03-probe-sections.json`):

| | `#hero` | `#about` | `#experience` |
|---|---|---|---|
| 1440×900 | **1** | **1** | **1** |
| 390×844 | 1 | 0 | 0 |

**All three scenes mount and draw.** The count does not accumulate to ≥2 because
`components/gl/Scene.tsx` mounts one scene at a time and unmounts it when it leaves the
viewport — so the honest measurement is per section, and each of the three is 1 at 1440.
`ReactCurrentBatchConfig` appears nowhere in any run.

Reduced motion (`reducedMotion: 'reduce'`): **0 running animations, 0 canvases**, `#hero h1`
present, no errors. No-GL (`getContext('webgl'|'webgl2'|'experimental-webgl')` stubbed to
`null`): **0 canvases**, `#hero h1` present, all six sections, **14 870 characters of body
text**, no errors — readable.

**Stated plainly, not dressed up:** at 390×844 `#about` and `#experience` mount **0**
canvases where 1440 mounts 1. `#hero` mounts at both. I did not have time to determine
whether that is a deliberate narrow-viewport gate in `Scene.tsx` / `useGLCapability.ts` or
a defect, and I will not guess. It is the first thing to check on resuming.

## S-4 Battery

| Gate | Command | Result | Log |
|---|---|---|---|
| `npm ci` | `npm ci` | exit **0** | `02-npmci.log` |
| single tree | `npm ls react react-dom @react-three/fiber @react-three/drei three @types/react @types/react-dom` | exit **0** — one deduped `react@19.2.8`; the pre-existing `three` `ELSPROBLEMS` is gone | `02-inventory-after.log` |
| audit | `npm audit --audit-level=high` | exit **0**, `found 0 vulnerabilities` | `02-audit.log` |
| `tsc` | `npx tsc --noEmit` | exit **0** | `04-tsc.log` |
| `lint` | `npm run lint` | `✔ No ESLint warnings or errors`, exit **0** | `04-lint.log` |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | `RESULT: ALL PASS (10/10)`, exit **0** | `04-audit.log` |
| build | `npm run build:static` | exit **0**, `RESULT: PASS — no credential material in the emitted bundle.` | `04-build.log` |
| bundle | `First Load JS` for `/` | **170 kB** vs main's **170 kB** — **+0 kB**, inside the +10 kB allowance. `Route (app) /` 29.9 kB; shared 103 kB | `04-build.log` |

Main's 170 kB baseline is the figure independently measured in
`C16-about-field/09-verification.md` §6 against this same `next build`.

## What is NOT done

**The full Playwright suite was not run.** The 30-minute cap expired after the probe. Per
the brief's own rule — commit what is verified, do not push — the branch is **local only**
and `05-regression.log` does not exist. Nothing in this report claims a test result I did
not observe.

## Tools used

`Read`, `Write`, `Bash` (`npm ci`, `npm install`, `npm ls`, `npm audit`, `npm view`,
`npx tsc --noEmit`, `npm run lint`, `npm run build:static`,
`node scripts/validate/overhaul_static_audit.mjs`, `node` with `playwright` for the two
probes, `python3` to edit `package.json`, `python3 -m http.server` on port 5603,
`grep`, `sed`, `git`). No paid API was called. `~/.claude/.env.production` was never read.

---

# Continuation — tester pass, `t_r19r3f9` level 2

Same worktree, same branch, port 5603. This pass merges `origin/main` (which had pinned
`next` back to 14.2.35 under P100), re-proves the scene mount, and runs the full suite the
first pass could not reach.

## S-1 The merge with `origin/main` (`3dae601`)

Two conflicts, both in the dependency manifest — `README.md` and `reports/static-audit.json`
merged without one.

| File | Resolution |
|---|---|
| `package.json` | this branch's versions, whole. `next` and `eslint-config-next` stay **15.5.25** |
| `package-lock.json` | this branch's lock — already generated against exactly this `package.json` |
| `README.md` | auto-merged; both sides' delivery-log rows are present |
| `reports/static-audit.json` | auto-merged, then rewritten by the audit run in S-5 |

`main`'s only source-level change since the merge base is that pin
(`git diff <base> origin/main -- package.json`: `next` 15.5.25→14.2.35,
`eslint-config-next` 15.5.25→14.2.35). It was a hotfix for the crash *this branch removes at
the root*, so it is superseded here — deliberately, not accidentally, and the merge commit
body says so.

`npm install --package-lock-only` cannot run on this host: npm refuses one optional tarball
with `EALLOWREMOTE — Fetching packages of type "remote" have been disabled`
(`@tailwindcss/oxide-wasm32-wasi@4.1.13`), with and without the sandbox. It is not needed:
the resolved `package.json` is byte-identical to this branch's, so the committed lock is
already its regeneration, and `npm ci` proves the two agree.

| Gate | Command | Result | Log |
|---|---|---|---|
| install | `npm ci` | exit **0** | `08-npmci.log` |
| single tree | `npm ls react react-dom next @react-three/fiber three` | exit **0** — one deduped `react@19.2.8`, `react-dom@19.2.8`, `next@15.5.25`, `@react-three/fiber@9.7.0`, `three@0.165.0`; every dependent `deduped` | `08-npmls.log` |

## S-2 Build and the `?gl=force` probe, after the merge

`npm run build:static` exit **0**, `RESULT: PASS — no credential material in the emitted
bundle.` **First Load JS for `/` = 170 kB** (route 29.9 kB + 103 kB shared) — unchanged from
both this branch's pre-merge figure and `main`'s baseline. `08-build.log`.

`03-probe.mjs` re-run against the merged build → `03b-probe-after-merge.json`. Identical to
the pre-merge `03-probe.json` in every field:

| | 1440×900 | 390×844 |
|---|---|---|
| `#hero h1` | 1 — "Vikram Deshpande" | 1 — "Vikram Deshpande" |
| canvases at hero | 1 | 1 |
| `errorShell` | false | false |
| `pageErrors` / console errors | [] / [] | [] / [] |
| section ids | all six | all six |

Reduced motion: 0 running animations, 0 canvases, `#hero h1` present. No-GL: 0 canvases,
all six sections, 14 870 characters of body text. No errors in any run.

### The open question from the first pass, answered: by design, not a defect

The first pass reported `#about` and `#experience` mounting **0** canvases at 390×844 and
declined to guess why. Measured now (`08-probe-390-slots.mjs` → `08-probe-390-slots.json`),
scrolling the *slot* rather than the *section*:

| 390×844 | after section scroll | after slot scroll | computed | box |
|---|---|---|---|---|
| `#about` `.fieldSlot` | 0 | **1** | `display: block`, `visibility: visible` | 224×224 |
| `#experience` `.chartScene` | 0 | **1** | `display: block`, `visibility: visible` | 356×605 |

Both scenes mount at 390. **It was a measurement artefact, not a narrow-viewport gate.** The
governing line is `components/gl/Scene.tsx`:

```ts
const observer = new IntersectionObserver(
  (entries) => setNear(entries.some((entry) => entry.isIntersecting)),
  { rootMargin: '50% 0px' },
);
…
const show = capability === 'supported' && allowMotion && near && pageSettled;
```

A canvas exists only while its slot is within half a viewport. At 390 each section's header
is tall enough that `scrollIntoViewIfNeeded()` on the *section* leaves the slot outside that
lead-in; at 1440 it does not. Neither `Scene.tsx` nor `useGLCapability.ts` has a width
threshold, and neither `About.module.css` nor `Experience.module.css` hides the slot — the
`@media (max-width: 900px)` and `(max-width: 760px)` blocks change the instrument's size and
the chart's columns, never the slot's `display`. **No finding.**

## S-3 The three scene suites — green

`PLAYWRIGHT_BASE_URL=http://127.0.0.1:5603 npx playwright test tests/overhaul/render.spec.ts
tests/overhaul/scene-about.spec.ts tests/overhaul/cinematic.spec.ts` → **18 passed**, exit
**0** (`08-scenespecs.log`). `scene-about` — blocked entirely by the crash before this
branch — passes all six, including TC-SCENE-ABOUT-01 "exactly one canvas mounts in `#about`
once the section is in view".

## S-4 Full suite — 292 passed, 9 failed, 0 caused by this change

`05-regression.log`: **301 tests, 292 passed, 9 failed**, 8.6 min, exit **1**.

| # | ✘ | On the known list? |
|---|---|---|
| 1 | `a11y/text-contrast.spec.ts:275` TC-CONTRAST-01 @ 390 | yes (@1440 now passes) |
| 2 | `e2e/chatbot.spec.ts:257` TC-BOT-12 | yes |
| 3 | `e2e/experience.spec.ts:172` TC-EXP-11 | yes |
| 4 | `e2e/hero.spec.ts:475` TC-HERO-15 | **no** — see below |
| 5 | `e2e/interaction-states.spec.ts:204` TC-STATE-HOVER | yes |
| 6 | `e2e/interaction-states.spec.ts:248` TC-STATE-ACTIVE | yes |
| 7 | `e2e/listen.spec.ts:65` TC-LISTEN-05 | yes (the known flake) |
| 8 | `perf/performance.spec.ts:88` PERF-03 CLS | **no** — see below |
| 9 | `visual/screenshots.spec.ts:113` VIS-04 listen-section | yes |

Known failures that did **not** recur: GC-01, TC-HERO-12, `interaction-states` :362 and
:415, VIS-01/02/06, text-contrast @1440. Nine ✘ against a known list of fourteen.

**The two off-list failures are the same failure, and it is host load — not this upgrade.**
Both are the CLS budget, measured while the other Playwright worker and two sibling agents
shared four cores:

- TC-HERO-15 — `Error: CLS (PERF-03 budget) … Expected: < 0.05  Received: 0.1763888888888889`
- PERF-03 — `CLS: 0.2559 … Expected: < 0.05  Received: 0.2559241706161137`

Re-run alone, `--repeat-each=2 --workers=1`, against the same server and the same build:

| Spec | Result | Log |
|---|---|---|
| PERF-03 | **2 passed**, `CLS: 0.0000` both runs, exit **0** | `08-perf03-repeat.log` |
| TC-HERO-15 | **2 passed**, exit **0** | `08-hero15-repeat.log` |

Four isolated runs, zero shift. Nothing in React 19 or `@react-three/fiber@9` touches the
hero portrait's crossfade — it is a `<video>` layered over a poster with a fixed
`aspect-ratio` box, no R3F in it — and the same specs pass on the same bytes the moment the
CPU is free. Recorded as **load-sensitive, not a regression**; no code was changed for
them, because changing code to chase a contention artefact would be the false positive this
role exists to refuse. If they recur on an idle host they are a real defect and this note is
wrong.

## S-5 Battery, after the merge

| Gate | Command | Result | Log |
|---|---|---|---|
| `tsc` | `npx tsc --noEmit` | exit **0** | `08-tsc.log` |
| `lint` | `npm run lint` | `✔ No ESLint warnings or errors`, exit **0** | `08-lint.log` |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | `RESULT: ALL PASS (10/10)`, exit **0** | `08-audit-static.log` |
| build | `npm run build:static` | exit **0**, 170 kB First Load JS | `08-build.log` |
| npm audit | `npm audit --audit-level=high` | exit **0**, `found 0 vulnerabilities` | `08-audit-npm.log` |

`npm audit` is the figure that retires the README's standing acceptance: the P100 pin bought
0 crashes at the cost of one high advisory against `next@14.2.35`, and the README said in as
many words that the acceptance "expires when React 19 + `@react-three/fiber@9` +
`@react-three/drei@10` land together". They land here, and the audit is clean, so the
limitation is deleted rather than left to read as true.

## What this pass did not do

No screenshots at 1440/1280/834/390 — the composition was not touched, and the visual suite
(bar the known VIS-04 baseline) is green. No deploy: pushing the branch is where this role
stops; `deploy.yml` consolidates and ships.
