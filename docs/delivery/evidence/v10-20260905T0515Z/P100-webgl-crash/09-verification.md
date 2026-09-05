# P100 — independent adversarial verification of the `?gl=force` crash hotfix

**Task** `t_p100hotfx` · **Reviewer role** 3rd-party independent adversarial review
(profile reviewer, level 1, effort max) · **Independent of the author.**
**Worktree reviewed** `/root/forgotten-mistory/.claude/worktrees/wf_7910f160-45a-1` ·
**Branch** `worktree-wf_7910f160-45a-1` · **HEAD reviewed** `f91843f` ·
**Branch point** `6dbb799` · **Port** 5601, stopped at the end.
**Raw logs and probes** `09-verify/` beside this file.

Nothing below is taken from the author's report. Every figure is a command I ran in this
session and the output I read. Where I reproduce a number the author published I say so;
where I contradict the *task brief* I say that too.

---

## 1. Verdict

**PASS.** The production incident is fixed, the fix is the right shape, and it is already
live. Ten gates re-run independently, all green. One expectation in my own review brief —
"canvases ≥ 2 after experience" — is **not met and should not be**: it contradicts the
site's design, and I proved that with geometry rather than accepting the author's word.

---

## 2. The change, re-derived from the diff

`git diff 6dbb799..HEAD --stat` — 8 files, and only one of them is code:

| File | What |
|---|---|
| `package.json` | `next` `15.5.25 → 14.2.35`, `eslint-config-next` `15.5.25 → 14.2.35`. Exactly two strings. |
| `package-lock.json` | regenerated to match |
| `README.md` | delivery-log row + known-limitation bullet |
| `reports/static-audit.json` | timestamp only |
| `docs/.../P100-webgl-crash/` | probe script + before/after JSON + decisions |

No application source is touched. `react` / `react-dom` stay `18.2.0`; `@react-three/fiber`
stays `8.18.0`. Verified independently:

```
package.json : next 14.2.35  react 18.2.0  react-dom 18.2.0  r3f 8.18.0  drei 9.122.0  eslint-config-next 14.2.35
package-lock : node_modules/next 14.2.35   node_modules/react 18.2.0   node_modules/react-dom 18.2.0
               node_modules/@react-three/fiber 8.18.0   node_modules/eslint-config-next 14.2.35
installed    : node_modules/next/package.json → 14.2.35
npm ls react react-dom next → LS_EXIT=0, every entry "react@18.2.0 deduped"
find node_modules -mindepth 2 -maxdepth 4 -type d -path '*/node_modules/react' → (nothing)
```

package.json, the lockfile and what is actually installed all agree, and there is a single
React tree. **The author's claim holds.**

## 3. The gates, re-run on a clean rebuild

`rm -rf out && npm run build:static` first, so nothing below reads a stale export.

| Gate | Command | Observed | Log |
|---|---|---|---|
| build | `npm run build:static` | `BUILD_EXIT=0`, `scanned : 43 files under out/`, `RESULT: PASS — no credential material in the emitted bundle.` | `09-verify/build.log` |
| tsc | `npx tsc --noEmit` | no diagnostics, `TSC_EXIT=0` | `09-verify/tsc.log` |
| lint | `npm run lint` | `✔ No ESLint warnings or errors`, `LINT_EXIT=0` | `09-verify/lint.log` |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | `RESULT: ALL PASS (10/10)`, `AUDIT_EXIT=0` | `09-verify/audit.log` |
| CI pipeline | `node --test tests/ci_pipeline.test.mjs` | `# pass 11`, `# fail 0`, `CI_PIPELINE_EXIT=0` | `09-verify/ci_pipeline.log` |
| suites | `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/overhaul/render.spec.ts tests/overhaul/cinematic.spec.ts tests/e2e/hero.spec.ts` | **`34 passed (1.3m)`**, `PW_EXIT=0` | `09-verify/playwright.log` |
| npm audit | `npm audit --audit-level=high` | `1 high severity vulnerability`, `Will install next@16.3.4, which is a breaking change`, `NPM_AUDIT_EXIT=1` | `09-verify/npm-audit.log` |

The four `TC-RENDER` cases the crash was killing are green here: `TC-RENDER-01` (12.9 s),
`-02` (10.0 s), `-06` (13.4 s), `-09` (7.4 s). The author reported 34/34; I got 34/34.

`npm audit` exiting 1 is **not hidden and not a regression of this review** — it is the
author's own D-3, declared in the commit body and in the README's known-limitations. I
re-ran it rather than take it on trust, and it says what they said it says.

## 4. My own `?gl=force` probe — not theirs

I wrote `09-verify/reviewer-probe.mjs` rather than re-run `probe-glforce.mjs`. Same browser
(`channel: 'chrome'`, `--no-sandbox --use-gl=swiftshader --enable-unsafe-swiftshader
--ignore-gpu-blocklist`) and same query, but it also records, at each hold, which scene
slots sit inside the observer's half-viewport lead-in — the number that decides how many
canvases *may* be alive.

| | 1440×900 (`probe-1440.json`) | 390×844 (`probe-390.json`) |
|---|---|---|
| HTTP | 200 | 200 |
| hold 4 s at `#hero` — canvases | **1** | **1** |
| `#hero h1` | present, `"Vikram Deshpande"` | present, `"Vikram Deshpande"` |
| section ids | all six: hero, about, experience, skills, vitrine, listen | all six |
| hold 4 s at `#experience` — canvases | **1** | **0** — see §5 |
| scrolled to end — canvases | 0 | 0 |
| `errorShellShowing` | **false** | **false** |
| pageErrors | **0** | **0** |
| console errors | **0** | **0** |

No `ReactCurrentBatchConfig`, no error shell, no `[app/error.tsx] Unhandled error`. The
outage is gone at both widths.

## 5. Where I disagree with my brief, not with the author

My brief asked for **"canvases ≥ 2 after experience"**. It is 1 at 1440 and 0 at 390, and
**that is correct behaviour**, not a residual fault. I did not accept the author's D-5 on
its word — I measured the slot geometry (`09-verify/slot-geometry-probe.mjs`,
`slot-geometry.json`), with `#experience` scrolled to `block: center`:

| | 1440×900 | 390×844 |
|---|---|---|
| `#experience` height | 2968 px | **4193 px** |
| `.chartScene` slot rect (top → bottom) | −646 → −141 | **−1284 → −680** |
| observer lead-in (`rootMargin: 50%`) | ±450 px | ±422 px |
| slot inside lead-in? | **yes** | **no** (−680 < −422) |
| canvas in `#experience` | **1** | 0 |

`components/gl/Scene.tsx` mounts `GLCanvas` only while `capability === 'supported' &&
allowMotion && near && pageSettled`, with `near` driven by an `IntersectionObserver` at
`rootMargin: '50% 0px'`, and tears it down the moment the slot leaves. Only three sections
mount a `Scene` at all — Hero, About, Experience — and on this layout no two of their slots
are in range at once. So one live canvas is the ceiling by design, and on mobile
`#experience` is 4193 px tall, so centring the *section* leaves the chart 680 px above the
viewport with no canvas owed. `tests/e2e/hero.spec.ts` `TC-HERO-11` asserts the same
ceiling and is green. **The brief's number was wrong about the design; the author's D-5 is
right, and now proven rather than asserted.**

## 6. The live site — the fix reached production

```
curl -s https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'
→ build-commit" content="3dae601a"

git merge-base --is-ancestor f91843f 3dae601a  → YES, live build contains the fix
git log -1 3dae601a → docs(cycle): v10 cycle 02 — P100 incident restored, live verified f103462f
```

The live build is a descendant of the reviewed commit, so I ran the same probe against it
(`09-verify/probe-live-1440.json`, 1440×900, `?gl=force`):

```
httpStatus 200 · hero canvases 1 · #hero h1 "Vikram Deshpande"
sectionIds [hero, about, experience, skills, vitrine, listen]
#experience canvases 1 · errorShellShowing false · pageErrors 0 · consoleErrors 0
```

**Production serves the site, not the error shell.** The incident is closed on the live
artifact, not merely on a branch.

## 7. Two observations the author did not report

Neither blocks; both are recorded rather than glossed.

1. **`app/data/generated/build-stamp.ts` at `f91843f` names `6dcb4f53`, not this branch.**
   The author restored the file to its HEAD value before committing (their D-7 discipline,
   correctly applied to avoid shipping a null stamp), so the committed stamp names an older
   commit. Harmless — `scripts/build/build_stamp.mjs` regenerates it in the deploy build,
   and the live page's `build-commit` meta is `3dae601a`, which is right. Not this fix's
   defect; noted so nobody reads the checked-in stamp as the deployed one.
2. **`tests/a11y/text-contrast.spec.ts` `TC-CONTRAST-01` remains red** (68 nodes below AA at
   1440, 30 at 390, per the C16 verification of the same tree). Out of scope here, untouched
   by a two-line dependency pin, and already on the board. Stated so this PASS is not read
   as "the whole suite is green".

## 8. Scope discipline

The fix is two version strings. It reverts no correct work from `18c6beb` — `.eslintrc.json`
`"root": true`, `tsconfig.json` `"target": "ES2017"` and both `next/link` swaps are still in
the tree and still pass `tsc` (exit 0), `lint` (exit 0) and `build:static` (exit 0) on
Next 14, which I re-ran rather than assumed. No placeholder, no suppressed error, no
fabricated output: every number above came from a command in `09-verify/`.

---

## 9. Gate table

| Gate | Command | Exit | Pass |
|---|---|---|---|
| diff scope | `git diff 6dbb799..HEAD --stat` | 0 | yes — 8 files, no app source |
| deps agree | `npm ls react react-dom next` | 0 | yes — single deduped 18.2.0 |
| build | `npm run build:static` | 0 | yes |
| tsc | `npx tsc --noEmit` | 0 | yes |
| lint | `npm run lint` | 0 | yes |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | 0 | yes — 10/10 |
| ci pipeline | `node --test tests/ci_pipeline.test.mjs` | 0 | yes — 11/11 |
| suites | `npx playwright test render + cinematic + hero` | 0 | yes — 34 passed |
| probe 1440 | `node 09-verify/reviewer-probe.mjs … 1440 900` | 0 | yes — 0 errors, hero canvas 1 |
| probe 390 | `node 09-verify/reviewer-probe.mjs … 390 844` | 0 | yes — 0 errors, hero canvas 1 |
| live probe | `node 09-verify/reviewer-probe.mjs https://forgotten-mistory.web.app 1440 900` | 0 | yes — 0 errors, no error shell |
| npm audit | `npm audit --audit-level=high` | 1 | **known**, D-3, declared in README |

— end —
