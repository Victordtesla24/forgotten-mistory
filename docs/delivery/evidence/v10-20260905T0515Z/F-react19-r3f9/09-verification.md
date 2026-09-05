# 09 — Independent verification of F-react19-r3f9

**Role** 3rd-party independent adversarial review, level 1, effort max ·
**Reviewer worktree** the same tree, read-only until this file ·
**Branch** `worktree-wf_a0a1850a-28a-1` · **HEAD reviewed** `6203211c1ea0d5b172a8a6f39f0cf14be18f438a` ·
**Port** 5603 (`python3 -m http.server 5603 --directory out --bind 127.0.0.1`)

Everything below was re-run by the reviewer against a **fresh `npm run build:static`** of
this branch. No number here is copied from the tester's testimony; where the two disagree,
the disagreement is stated. Logs written by this pass are prefixed `09-`.

---

## V-1 What the branch actually contains

`git log --oneline origin/main..HEAD` — four commits, exactly as testified:

```
6203211 merge: origin/main — next 15 + React 19 supersedes the P100 pin
69c8c7e docs(evidence): add F-react19-r3f9 gate logs cited by 07-decisions.md
139d116 docs(evidence): F-react19-r3f9 — inventory, probes and battery
fc50ff5 chore(deps): react 19 + @react-three/fiber 9 — scenes mount again under next 15
```

`git diff origin/main...HEAD --stat` — 34 files, 2923 insertions, 1461 deletions. Thirty of
those files are evidence under `docs/delivery/evidence/`. The **entire source-code surface of
this branch is six files**:

| File | Change |
|---|---|
| `package.json` | react/react-dom 18.2.0 → 19.2.8, @types/react(-dom) → 19.x, fiber 8.18.0 → 9.7.0, drei 9.122.0 → 10.7.8, lucide-react 0.344.0 → 1.41.0, next + eslint-config-next 14.2.35 → 15.5.25, `@react-three/postprocessing` deleted, `playwright-core: 1.57.0` added to `overrides` |
| `package-lock.json` | regenerated to match |
| `next.config.js` | one line — `@react-three/postprocessing` removed from `transpilePackages` |
| `components/sections/Vitrine/Drawings.tsx` | one line — `import type { JSX } from 'react'` |
| `README.md` | delivery-log row; the now-false `next@14` advisory limitation deleted |
| `app/data/generated/build-stamp.ts`, `reports/static-audit.json` | build/audit artefacts |

**Suppression scan — clean.** `git diff origin/main...HEAD` filtered to added lines for
`ts-ignore`, `ts-expect-error`, `eslint-disable`, `test.skip`, `test.only`, `describe.only`,
`.only(`, `xit(`, `xdescribe(` over everything **except** the evidence directory returns
**no hits**. Across the whole diff including evidence there is exactly one hit, and it is
prose in `07-decisions.md`: `+No \`@ts-ignore\`, no \`any\`.` No test was skipped, narrowed
or silenced to make this branch green.

**The deleted dependency really is dead.** `grep -rn postprocessing app components lib
scripts tests` over `*.ts,*.tsx,*.mjs,*.js` returns one hit, and it is an English word
inside a report string (`scripts/testing/generate_post_prod_summary.mjs:122`, "reduced
postprocessing"). No module imports `@react-three/postprocessing`; removing it cannot change
behaviour. It is gone from the lockfile too (0 entries).

**The type fix is a real fix, not a mute.** `Drawings.tsx:4` imports the type and
`Drawings.tsx:339` consumes it — `Record<DrawingId, () => JSX.Element>`. `@types/react@19`
drops the global `JSX` namespace; importing it is the documented migration, and `tsc` is
clean without a single suppression.

**The lockfile agrees with `package.json`.** Independently walked: `lockfileVersion 3`,
zero mismatches between every dependency/devDependency pin and both the lock's root block
and its installed entry; `react 19.2.8`, `next 15.5.25`, `@react-three/fiber 9.7.0` locked.
The tester could not run `npm install --package-lock-only` on this host (`EALLOWREMOTE`);
that does not matter, because the committed lock is internally consistent with the resolved
`package.json` and `npm ci` installs from it cleanly.

## V-2 Gates — all re-run by the reviewer on this branch

| Gate | Command | Observed | Exit |
|---|---|---|---|
| Types | `npx tsc --noEmit` | no diagnostics | **0** (`09-tsc.log`) |
| Lint | `npm run lint` | `✔ No ESLint warnings or errors` | **0** (`09-lint.log`) |
| Static audit | `node scripts/validate/overhaul_static_audit.mjs` | `RESULT: ALL PASS (10/10)` | **0** (`09-audit-static.log`) |
| Advisories | `npm audit --audit-level=high` | `found 0 vulnerabilities` | **0** (`09-audit-npm.log`) |
| Build | `npm run build:static` | `▲ Next.js 15.5.25`; `/` = **29.9 kB / 170 kB First Load JS**; `RESULT: PASS — no credential material in the emitted bundle.` | **0** (`/tmp` → quoted here) |
| Tree | `npm ls react react-dom next @react-three/fiber three` | one deduped `react@19.2.8` | **0** |

170 kB First Load JS for `/` — identical to the figure `main` carries, so the React major
bump costs **+0 kB** on the route that matters.

**One correction to the testimony.** The tester wrote "one deduped react@19.2.8 tree, every
dependent `deduped`". Every *react* dependent is deduped, but the same command prints
`stats-gl@2.4.2 └── three@0.170.0` — a second, **un-deduped** copy of `three` under a drei
transitive. It is immaterial (nothing imports `stats-gl`, and the route size is unchanged at
170 kB), but "every dependent deduped" is not literally what the command printed.

## V-3 The scenes — reviewer's own probes

Two probes were written for this pass rather than re-running the tester's:
`09-probe-verify.mjs` (per-section canvas attribution, hardware-GPU spoof, CLS with shift
sources) and `09-probe-slots.mjs` (scroll the GL **slot**, not the section).

### V-3a `?gl=force` at 1440 and 390 — `09-probe-slots.json`

Canvases are counted **inside their own section** (`#about canvas`, `#experience canvas`),
which a page-wide `page.locator('canvas').count()` cannot distinguish:

| | hero | about | experience | error shell | pageErrors | consoleErrors |
|---|---|---|---|---|---|---|
| **1440×900** | 1 | 1 (slot 384×384) | 1 (slot 1298×505) | false | `[]` | `[]` |
| **390×844** | 1 | 1 (slot 224×224) | 1 (slot 356×605) | false | `[]` | `[]` |

All six section ids present at both widths; `#hero h1` reads "Vikram Deshpande".
**All three WebGL scenes mount at both widths, with zero errors.** The slot geometry
reproduces the tester's `08-probe-390-slots.json` to the pixel.

The reviewer's *first* probe (`09-probe-verify.json`) scrolled the **section**, and saw
`#experience` mount nothing at either width. Scrolling the **slot** mounts it every time.
That independently reproduces the tester's answer to the previous agent's open question:
`components/gl/Scene.tsx:85` observes with `{ rootMargin: '50% 0px' }` and gates on
`const show = capability === 'supported' && allowMotion && near && pageSettled;`
(line 91) — a canvas exists only while its slot is within half a viewport, so a
section-top scroll can leave a lower slot outside the lead-in. **Measurement artefact,
confirmed. Not a width gate, not a defect.**

### V-3b The production path — hardware GPU, no query string

This is the case that broke production in P100, and **the tester never ran it**: every probe
in the tester's evidence carries `?gl=force`, which is an escape hatch the public site never
uses. The reviewer spoofed the capability probe instead — `WEBGL_debug_renderer_info`'s
`UNMASKED_RENDERER_WEBGL` (`0x9246`) patched to
`ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)` — and loaded
`http://127.0.0.1:5603/` **with no query string at all**, so
`components/gl/useGLCapability.ts` takes the `'supported'` branch exactly as a real
visitor's GPU makes it:

```
rendererSeen : ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)
heroH1       : "Vikram Deshpande"
errorShell   : false
headings     : Vikram Deshpande · Ten dimensions, answered · Sixteen years, to scale ·
               Calibration card · Six of thirty-eight · Feedback & coffee?
canvases     : #hero 1440×956 · #experience 1298×505 (display block, visibility visible)
pageErrors   : []
consoleErrors: []
```

No `app/error.tsx`, no `TypeError: Cannot read properties of undefined (reading
'ReactCurrentBatchConfig')`, all six headings, the scenes live. **The P100 crash is fixed on
the path that actually crashed**, not merely on the forced one.

## V-4 The battery

`09-specs.log` — `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5603 npx playwright test
tests/overhaul/render.spec.ts tests/overhaul/scene-about.spec.ts
tests/overhaul/cinematic.spec.ts tests/e2e/hero.spec.ts tests/e2e/experience.spec.ts`

`Running 53 tests using 2 workers` → **`48 passed`, `5 failed` (4.7m)**, `SPECS_EXIT=1`.
Host `loadavg` during the run: **10.18 → 24.08 on 4 cores**, with a sibling agent's own
Playwright run holding two of them.

| ✘ | Status |
|---|---|
| `e2e/experience.spec.ts:172` TC-EXP-11 | on the known list |
| `e2e/hero.spec.ts:475` TC-HERO-15 | off-list, already declared by the tester |
| `e2e/hero.spec.ts:623` TC-HERO-19 — eager image weight / loop fetched after load | **new — the tester's 301-test suite passed it** |
| `overhaul/scene-about.spec.ts:143` TC-SCENE-ABOUT-03 | **new — the tester reported scene-about 6/6 green** |
| `overhaul/scene-about.spec.ts:157` TC-SCENE-ABOUT-04 | **new — same** |

Three failures the testimony did not predict is exactly the shape that should stop a review,
so each was isolated rather than waved through. Their in-suite errors name the cause:

```
TC-SCENE-ABOUT-03/-04  TimeoutError: locator.waitFor: Timeout 15000ms exceeded.
                       Call log: - waiting for locator('#hero') to be visible
                       (scene-about.spec.ts:56, inside waitForPageReady)
TC-HERO-19             Error: the loop was requested by the gate
                       expect(timing.loop).not.toBeNull() → Received: null
```

Neither is a product claim failing. `#hero` never became *visible* inside 15 s — while the
reviewer's own probes, minutes earlier, rendered `#hero h1` in every configuration with zero
page errors — and `timing.loop` was null because the deferred video request had not been
issued inside the sampling window. Both are starvation.

**Isolation, `--workers=1 --repeat-each=2`, at `loadavg 24.08`** (`09-isolate.log`):

| Test | In-suite | Isolated |
|---|---|---|
| TC-HERO-19 | ✘ | **✓ 2/2** |
| TC-SCENE-ABOUT-03 | ✘ | **✓ 2/2** |
| TC-SCENE-ABOUT-04 | ✘ | **✓ 2/2** |
| TC-HERO-15 (CLS) | ✘ | **✘ 1 / ✓ 1** |

`7 passed, 1 failed (41.6s)`, `ISOLATE_EXIT=1`. So the three new ✘ are host contention and
the tester's 18/18 stands on an idle host — the discrepancy is this reviewer's noisier host,
not a false claim. **TC-HERO-15 is the one that matters:** it failed and then passed *inside
a single `--workers=1` command, on identical bytes, with `Error: CLS (PERF-03 budget)`.*
That is not a claim about React 19; it is proof that this assertion is intermittent. The
tester got 2/2 green on it and the reviewer got 1/2 — which is precisely what an
intermittent assertion looks like from two directions.

### The full suite the tester ran — every ✘ accounted for

`05-regression.log` was read line by line: `9 failed`, `292 passed (8.6m)` out of 301. The
known list is `C13-next15/09-verification.md` (GC-01, TC-CONTRAST-01 @390 and @1440,
TC-BOT-12, TC-EXP-11, TC-HERO-12, TC-STATE-HOVER, TC-STATE-ACTIVE, TC-LISTEN-05, plus
`render.spec.ts:154:7` and VIS-01/02/04/06):

| ✘ | On the known list? |
|---|---|
| `a11y/text-contrast.spec.ts:275` TC-CONTRAST-01 @ 390 | **yes** |
| `e2e/chatbot.spec.ts:257` TC-BOT-12 | **yes** |
| `e2e/experience.spec.ts:172` TC-EXP-11 | **yes** |
| `e2e/interaction-states.spec.ts:204` TC-STATE-HOVER | **yes** |
| `e2e/interaction-states.spec.ts:248` TC-STATE-ACTIVE | **yes** |
| `e2e/listen.spec.ts:65` TC-LISTEN-05 | **yes** |
| `visual/screenshots.spec.ts:113` VIS-04 | **yes** |
| `e2e/hero.spec.ts:475` TC-HERO-15 | **no — off-list** |
| `perf/performance.spec.ts:88` PERF-03 | **no — off-list** |

So the instruction "confirm every ✘ is in the known list" resolves as **seven of nine are;
two are not** — and the tester declared both as off-list rather than burying them. That is
the honest report, and it is the reason the next section exists rather than a rubber stamp.

## V-5 The two off-list ✘ — the tester's conclusion holds, the tester's reason does not

Both are the same CLS budget (`< 0.05`). The tester classified them as "CPU contention
during layout-shift measurement, not a regression", reasoning that "nothing in React 19 or
fiber 9 touches the hero portrait crossfade". The reviewer measured CLS **with the identity
of every shifting node**, which contention cannot fake.

**`09-probe-verify.json`, `/` at 1440, no query string:**

```
cls 0.1556 · 1 shift · 0.1556 @ 508 ms  ->  ["footer.Footer_footer__TWDx3"]
```

The shift is real, it is a single event worth three times the budget, and **its source is
the footer — not the hero crossfade**. The tester's mechanism is wrong.

**`09-cls-compare.json`** then runs the identical measurement back-to-back against two
builds in one load window — this branch's local export (`build-commit 6203211c`) and the
**live site, which is `main`** (`build-commit 2a871dbc`, i.e. the next-14 / React-18 pin).
Both fall down the software-rasteriser path on this GPU-less host, so they are comparable:

| Build | CLS | shifts |
|---|---|---|
| local, this branch `6203211c` | **0.0000** | 0 |
| live, `main` `2a871dbc` | **0.0000** | 0 |

The same branch bytes therefore produce `0.1556` on one run and `0.0000` on the next, and
`main` produces `0.0000` under the same conditions. §V-4 then closes it from the other side:
TC-HERO-15 failed on `Error: CLS (PERF-03 budget)` and passed **inside one
`--workers=1 --repeat-each=2` command** on those same bytes. That is a **conditional,
intermittent layout shift, not a deterministic property of either build** — the branch does
not introduce it and does not deterministically exhibit it. **The tester's verdict (not a
regression from this change; no code written to chase it) is correct and is upheld.** Their
attribution is not: `07-decisions.md` §S-4 should name `footer.Footer_footer__TWDx3` at
~508 ms as the shifting node so the follow-up isn't sent after the hero portrait. Recorded
as Finding 1; it does not block this branch, because a pre-existing intermittent shift that
`main` shares is not something a dependency bump caused. It is, however, a live defect on
the page — `CLAUDE.md`'s definition of done says `CLS < 0.05` — and it currently belongs to
nobody.

## V-6 Finding 2 — the branch is now eleven commits behind `main`, and `main` moved in code

The tester merged `origin/main` at `3dae601`. At review time `origin/main` is `2a871db`.
`3dae601` is an ancestor of it, so nothing is lost — but eleven commits have landed since,
and `git diff --stat 3dae601 origin/main` excluding docs shows they are **not all docs**:

```
app/globals.css                            180 +
components/MiniVicBot.tsx                   92 +-
components/site/Navigation.tsx              17 +
tests/a11y/minivic-launcher.spec.ts        143 +   (new)
tests/a11y/minivic-occlusion.spec.ts       342 +   (new)
tests/monochrome/minivic-launcher.spec.ts  158 +   (new)
tests/e2e/chatbot.spec.ts                    8 +-
```

Cycle 16's labelled MiniVic launcher, the occlusion fix and the skip link. **None of that
code has ever been executed against React 19 / Next 15**, and the three new spec files have
never run on this branch — the 292/301 figure was measured on a tree that does not contain
them. The branch touches none of those files, so `deploy.yml`'s consolidation should merge
without conflict, but the *combined* tree is untested by anyone. This is not a defect in the
tester's work (`main` moved after their merge); it is a live risk that belongs to whoever
lands it. Recorded as Finding 2, with the concrete ask: **re-run
`tests/a11y/minivic-*.spec.ts` and `tests/monochrome/minivic-launcher.spec.ts` immediately
after consolidation**, since a React-19 regression in that component would land straight on
production, which `88f1385` says is already red on the WebGL crash this branch fixes.

## V-7 Verdict

**PASS.** The branch does what it says. The dependency reconciliation is complete and
internally consistent; the one type error React 19 surfaced was fixed in real code with no
suppression; the deleted dependency is provably unimported; every named gate reproduces
green under the reviewer's own hand; and the crash that took production down is gone on the
real production path — hardware GPU, no query string — not merely behind `?gl=force`.

Five specs failed in the reviewer's battery and none survives isolation as a product defect:
one is on the standing known list, three are `#hero`-never-visible / request-window
starvation that go 2/2 green at `--workers=1`, and the fifth is a CLS assertion that flips
inside a single serial command. No failure in this pass has a mechanism that touches React
19, `@react-three/fiber` 9 or `drei` 10.

The findings below are recorded and none blocks: the CLS attribution in §S-4 names the wrong
element (the conclusion it supports is right), and the branch is eleven commits behind a
`main` that has gained untested component code. Ship it, then run the MiniVic specs on the
consolidated tree.

### Findings

1. **`07-decisions.md` §S-4 misattributes the CLS shift.** The measured shift source is
   `footer.Footer_footer__TWDx3` at ~508 ms (0.1556 in one run), not the hero portrait
   crossfade. The classification "not a regression from this branch" is upheld — `main`
   measures 0.0000 under the identical probe and this branch measures both 0.1556 and
   0.0000 on the same bytes — but the page carries a real intermittent CLS defect that
   nobody owns, and the note points the next agent at the wrong element.
2. **Eleven `main` commits are missing from the branch, including ~630 lines of new
   component/CSS code and three new spec files** (`MiniVicBot.tsx`, `Navigation.tsx`,
   `globals.css`, `tests/a11y/minivic-launcher`, `tests/a11y/minivic-occlusion`,
   `tests/monochrome/minivic-launcher`). Never executed against React 19. Re-run those
   three specs immediately after consolidation.
3. **Minor testimony inaccuracy:** "every dependent `deduped`" — `stats-gl@2.4.2` carries an
   un-deduped `three@0.170.0`. Immaterial to the bundle (route still 170 kB) but not what
   the command printed.
4. **`CLAUDE.md` says "276 Playwright tests"; the suite discovers 301.** Already raised by
   the tester as a follow-up; repeated here so it is not lost.
5. **Three specs fail for host starvation, not for what they assert.**
   `TC-SCENE-ABOUT-03/-04` give up waiting 15 s for `#hero` to be *visible* and `TC-HERO-19`
   samples before the deferred loop request exists; all three are 2/2 green serially. On a
   4-core host shared with sibling agents this makes the battery's own result unreliable —
   a genuine regression and a starved worker are currently indistinguishable from the
   summary line. Worth a longer `waitForPageReady` budget or a serial project for the
   timing-sensitive specs, so a future reviewer does not have to isolate five tests to find
   out nothing was wrong.
