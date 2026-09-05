# P100 — the WebGL scenes crash the whole page; pin Next back to 14.2.35

**Task** `t_p100hotfx` · **Priority 100 — production incident** · **Role** coding, level 2, effort xhigh
**Worktree** `/root/forgotten-mistory/.claude/worktrees/wf_7910f160-45a-1` ·
**Branch** `worktree-wf_7910f160-45a-1` · **Base** `6dbb799` (main)
**Port** 5601 (`python3 -m http.server 5601 --directory out --bind 127.0.0.1`), stopped at the end.

---

## The incident

On any browser whose GPU passes `useGLCapability`, the hero's `Scene` mounts,
`@react-three/fiber@8.18.0` reaches for a React internal, finds `undefined`, and the whole
page falls into `app/error.tsx`. The visitor gets "SYSTEM INTERRUPT — Something went
wrong". Not the hero, not the six sections: the error shell.

Reproduced before touching anything (`01-repro-before.json`, script `probe-glforce.mjs`,
Chrome with `--use-gl=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`,
1440×900, `?gl=force`, held 4 s at the hero):

```
canvases: 0        heroH1Present: false       sectionIds: []
errorShellShowing: true
body: "Skip to the evidence SYSTEM INTERRUPT Something went wrong …"
consoleErrors (4): TypeError: Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')
                     at _next/static/chunks/904.66d19854a4ab6d3a.js:1:10329
                   [app/error.tsx] Unhandled error: <the same TypeError>
```

`ReactCurrentBatchConfig` is a member of `React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`.
R3F 8 reads it to run `useTransition`-style scheduling. The React that Next **vendors into
the client bundle** — not the `react@18.2.0` in `node_modules` — stopped exporting it at
React 19, which is what `next@15.5.25` ships. `npm ls react` shows one deduped 18.2.0 tree,
so the mismatch is invisible to the dependency graph and only appears at runtime, in the
browser, on a machine with a GPU. That is why it survived a green `tsc`, a green `lint`,
a 10/10 audit and a clean build.

Introduced by `18c6beb` (`chore(deps): next 15.5.25`). Independently confirmed pre-existing
to c16 by the adversarial reviewer, who rebuilt the c16 baseline with the About field moved
aside and got the identical crash
(`docs/delivery/evidence/v10-20260905T0515Z/C16-about-field/09-verification.md` §4).

## The decisions

**D-1 — Pin the framework back, do not patch around it.** The durable fix is React 19 +
`@react-three/fiber@9` + `@react-three/drei@10`, which is a coordinated upgrade of three
libraries and every `Scene` child that touches R3F's reconciler. That is not a hotfix; the
site is currently serving an error page to every GPU visitor. `next` and
`eslint-config-next` go back to `14.2.35` — exactly what `main` carried before `18c6beb`
(`git show 18c6beb^:package.json`), except pinned exactly rather than `^14.2.35`, so a
future `npm install` cannot drift the framework under the scenes again without a
deliberate edit. `react`/`react-dom` stay at 18.2.0; the tree is verified single:
`next@14.2.35`, `react@18.2.0`, `react-dom@18.2.0`, `@react-three/fiber@8.18.0`, no nested
`node_modules/*/node_modules/react`.

**D-2 — Everything else from `18c6beb` stays.** Next 14 accepts all of it, so nothing was
reverted beyond the two version strings: `"root": true` in `.eslintrc.json` (lint green),
`"target": "ES2017"` in `tsconfig.json` (`tsc --noEmit` exit 0), and the two
`<a href="/">` → `next/link` swaps in `app/not-found.tsx` and
`app/performance-benchmark/page.tsx` (both are ordinary Next 14 API; build exit 0). Reverting
them would have been undoing correct work for no reason.

**D-3 — The `next@14` advisory is re-accepted, with an expiry.** `npm audit --audit-level=high`
now exits 1 with **1 high severity vulnerability** — the `next` advisory chain
(GHSA-q4gf-8mx6-v5v3 and 16 others), whose only offered remedy is `next@16.3.4`, a breaking
change. Every one of those advisories is a **server-side** class: Server Components DoS,
middleware/proxy cache poisoning, Server Action SSRF, Image Optimization DoS, RSC cache
confusion. The public site is a **static export on Firebase Hosting** — `app/api/*` does not
run, there is no middleware, no Server Action, no image optimizer, no custom server. None of
these advisories has a reachable surface on the deployed artifact. Against that: a certain,
total, currently-live outage for every GPU visitor. Accepted, and it expires when the React 19
+ R3F 9 upgrade lands — this is not a permanent posture. `18c6beb` bought a clean audit number
at the price of the site rendering at all; the trade is reversed here deliberately and on the
record.

**D-4 — Follow-up, not deferral.** The durable upgrade is a real task and must be booked:
React 19 + `@react-three/fiber@9` + `@react-three/drei@10` + `next@15`, with the `?gl=force`
probe in this directory promoted to a Playwright case so no future dependency bump can
reintroduce a runtime-only crash that the four static gates cannot see. `tests/overhaul/render.spec.ts`
TC-RENDER-01 does mount a live canvas and did fail here, so the suite was not blind — it was
simply not run against `?gl=force` at the moment the bump landed.

## Verification (every line an observed exit code)

| Gate | Command | Observed |
|---|---|---|
| probe before | `node probe-glforce.mjs … 01-repro-before.json` | `canvases: 0`, `errorShellShowing: true`, 4 console errors, `PROBE_BEFORE_EXIT=0` |
| probe after | `node probe-glforce.mjs … 02-repro-after.json` | `canvases: 1`, `heroH1Present: true`, `heroH1Text: "Vikram Deshpande"`, all six `sectionIds`, `pageErrorCount: 0`, `consoleErrorCount: 0`, `errorShellShowing: false`, `PROBE_AFTER_EXIT=0` |
| render/cinematic/hero specs | `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/overhaul/render.spec.ts tests/overhaul/cinematic.spec.ts tests/e2e/hero.spec.ts` | `34 passed (1.1m)`, `PW_EXIT=0` — including TC-RENDER-01/-02/-06/-09 and TC-HERO-11 |
| tsc | `npx tsc --noEmit` | no output, `TSC_EXIT=0` |
| lint | `npm run lint` | `✔ No ESLint warnings or errors`, `LINT_EXIT=0` |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | `RESULT: ALL PASS (10/10)`, `AUDIT_EXIT=0` |
| build | `npm run build:static` | `RESULT: PASS — no credential material in the emitted bundle.`, `BUILD_AFTER_EXIT=0` |
| npm audit | `npm audit --audit-level=high` | `1 high severity vulnerability` (next), `NPM_AUDIT_EXIT=1` — accepted per D-3 |
| install | `npm install --package-lock-only` then `npm ci` | `LOCK_EXIT=0`, `NPM_CI_AFTER_EXIT=0`, single tree |

### On the canvas count at `#experience`

The probe scrolls to `#experience` and holds 4 s; the count stays at **1**, not 2. That is
the design, not a residual fault: `components/gl/Scene.tsx` mounts a scene only while it is
near-and-settled and unmounts it when it leaves, and `tests/e2e/hero.spec.ts` TC-HERO-11
("the hero holds at most one WebGL context") asserts exactly that. The live canvas at
`#experience` is proven instead by `tests/overhaul/render.spec.ts` TC-RENDER-01, which walks
the section scenes and requires a live WebGL canvas at each — green here, red before the pin.

## Tools used

`git` (`show`, `log`, `diff`, `add`, `commit`, `push`) · `npm` (`ci`,
`install --package-lock-only`, `ls`, `run build:static`, `run lint`, `audit`) ·
`npx tsc` · `npx playwright test` · `node` (the probe, `scripts/validate/overhaul_static_audit.mjs`) ·
`playwright` Node API with Chrome channel and software WebGL · `python3 -m http.server` on
port 5601 · `curl` · `fuser -k 5601/tcp`.
