# C22 — flagship visibility: independent adversarial verification

**Verdict: FAIL.** Two of the three sections meet the owner's bar at 1440. The hero does
not meet it at 390 at all, and the brightening this lane shipped has taken text below AA
in nine places at 1440 and twelve at 390 on the path the owner actually looks at.

Reviewer: council `reviewer` profile, `3rd_party_independent_adversarial_review`, level 1,
effort max. Independent of the author. Every number below was re-derived in this session
from a rebuild of the pushed tree — none is copied from the author's logs.

* Worktree `/root/forgotten-mistory/.claude/worktrees/wf_0d0dffdb-8bf-1`, branch
  `worktree-wf_0d0dffdb-8bf-1`, HEAD `3221a7cc` (build stamp in `out/index.html`
  confirms `3221a7cc`).
* Served from `127.0.0.1:5602` (`python3 -m http.server --directory out --bind 127.0.0.1`).
* Probe: `verify/probe.mjs` — my own script, playwright-core, `channel: 'chrome'`,
  `--no-sandbox --use-gl=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.
  Raw output `verify/shots/probe-report.json`, frames in `verify/shots/`.

---

## 1. Gates I ran myself

| gate | command | result |
|---|---|---|
| build | `npm run build:static` | `BUILD_EXIT=0` (`verify/v01-build.log`), stamp `3221a7cc` |
| types | `npx tsc --noEmit` | `TSC_EXIT=0` (`verify/v04-tsc.log`) |
| lint | `npm run lint` | `✔ No ESLint warnings or errors`, `LINT_EXIT=0` (`verify/v05-lint.log`) |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | `RESULT: ALL PASS (10/10)`, `AUDIT_EXIT=0` (`verify/v06-audit.log`) |
| flagship + contrast | `npx playwright test tests/overhaul/flagship-visibility.spec.ts tests/a11y/text-contrast.spec.ts` | `8 passed (1.0m)`, `PW_EXIT=0` (`verify/v02-flagship-and-contrast.log`) |
| section suites | `tests/e2e/{hero,about,experience}`, `tests/overhaul/{scene-about,scene-experience,cinematic}`, `tests/monochrome` | `88 passed (3.2m)`, `SUITES_EXIT=0` (`verify/v07-section-suites.log`) |

Every gate the author claimed reproduces. The author's reported numbers are honest: I
measured hero 43.03% / 0.8308 / 0.00460 against their 43.05 / 0.8308 / 0.00620, about
44.67% against 44.93%, experience 26.93% against 25.60% — all within shader-noise of the
claim. No fabricated artefact, no fabricated log line, no softening in the exit report's
gate section. `07-decisions.md` carries a superseded results table at line 51 (the
pre-scrim 96.55% hero figure) but explicitly corrects it in the 10:00Z addendum, so it is
stale rather than misleading. The gates table there says "15 frames"; there are 17.

**The gates are not the finding. What the gates do not measure is.**

## 2. The owner's question, answered per section

> *Would a visitor notice this scene within a second, and does it tell the section's story?*

### Hero — **desktop yes, phone no**

At 1440 (`verify/shots/hero-1440-glforce-rest.jpg`): **yes.** There is a real volumetric
haze pooling behind the portrait plate, dust motes drifting through it, a rake of light
off the upper left. It reads as a lit room rather than a dark page, the eye lands on the
plate, and the name still owns the frame. This is the first version of this scene that a
visitor would notice, and it is the right story — a person photographed under a light,
not a gradient.

At 390 (`verify/shots/hero-390-glforce-rest.jpg`): **no, and not marginally — there is
nothing there.** Measured on the shader path with the canvas confirmed mounted
(`canvases=1`):

| | coverage (floor 15%) | peak (floor 0.35) | motion (floor 0.004) |
|---|---|---|---|
| hero @390 `?gl=force` | **0.00%** | **0.0212** | **0.00011** |

Compare the author's own baseline for the sections they were sent to fix: *"about 0.00%
coverage / 0.017 peak; experience 0.00% coverage / 0.017 peak."* The hero at 390 now
carries **the identical signature as the defect the owner reported.** The cause is in
`components/sections/Hero/Hero.module.css`: the `@media (max-width: 700px)` block replaces
the graded `.stage::after` scrim with a flat full-frame
`linear-gradient(90deg, rgb(10 10 10 / 0.86), rgb(10 10 10 / 0.86))`. That layer paints
*after* the canvas, so on a phone with a GPU it extinguishes the shader across the whole
frame. The frame is a flat black rectangle; I looked at it.

Nothing catches this because `tests/overhaul/flagship-visibility.spec.ts` declares
`test.use({ viewport: { width: 1440, height: 900 } })` for the whole file — the gate the
lane built to prove the scenes are visible only ever asks at one width.

About @390 also misses a floor: peak `0.2965` against the 0.35 the same spec calls "a core
the eye lands on". Coverage and motion pass there; the ring is present but dim.

### About — **yes**

`verify/shots/about-1440-glforce-rest.jpg`: ten luminous sectors in an annulus, the active
one lit at its core, the numerals legible against it, the whole disc rotating slowly.
Coverage 44.67%, peak 0.8308, motion 0.02379. A visitor notices it immediately and it is
the section's own story — ten dimensions, one of them answered — rather than decoration.
This is the strongest of the three.

### Experience — **yes**

`verify/shots/experience-1440-glforce-rest.jpg` and the author's
`08-screens/experience-chart-1440-glforce.jpg`: the strata now have real sediment weight,
lit from the left, drifting; the bars stay the brightest objects, so the scene reads as
ground the chart stands on and not as competition. Coverage 26.93%, peak 0.8070, motion
0.04598. Yes to both halves of the question.

## 3. Blocking defects

### F1 — the hero's flagship scene is extinguished on every phone with a GPU

`components/sections/Hero/Hero.module.css`, `@media (max-width: 700px)` → `.stage::after`.
Measured: 0.00% coverage, 0.0212 peak, 0.00011 motion at 390 `?gl=force`, canvas mounted.
Evidence: `verify/shots/hero-390-glforce-rest.jpg`, `verify/shots/probe-report.json`,
and the author's own `08-screens/hero-390-glforce-rest.jpg`, which shows it and was passed
over. The owner's correction was "for each section", not "for each section at 1440".

The gate cannot see it: `flagship-visibility.spec.ts` is single-viewport. Whatever fix
lands, the spec has to iterate viewports before it can be said to hold the line.

### F2 — the brightening took text below AA on the shader path, and this lane caused it

`tests/a11y/text-contrast.spec.ts` is green, and it is green because `auditViewport` calls
`page.goto('/')` with no query — it photographs the CSS still and never the shader. I ran
its exact algorithm (glyph mask, composited-pixel sample, WCAG ratio) against `/?gl=force`:

* **1440 — 9 nodes below AA.** Worst: hero `.ledgerSource` "ANZ · real-time telemetry
  platform" at **1.34:1** on `rgb(168,168,168)`; the caliper gloss at 1.36:1; experience
  `.trackCompany` "ANZ Banking Group" at 2.16:1, "National Australia Bank (NAB)" 2.73:1,
  "InfoCentric" 2.86:1, ATO 3.84:1; `.trackYears` "3.3 yr" 3.84:1.
* **390 — 12 nodes below AA.** Worst: `.trackCompany` "Telstra" at **1.10:1**
  (`rgb(144,144,144)` on `rgb(137,137,137)` — grey on grey, functionally invisible),
  "InfoCentric" 1.11:1, "Microsoft" 1.85:1; five compass numerals between 2.66:1 and 3.45:1.

These are regressions from this lane, not inherited. Before the change the strata peaked at
0.017 luminance and the hero atmosphere was "faint" — the company names and the ledger sat
on near-black and cleared AA comfortably. They now sit on grounds this lane raised to
`rgb(90,90,90)`–`rgb(137,137,137)`. The `::after` scrims fix the regions the author
photographed; they do not reach the strata band under the company names or the pool under
the third ledger item.

The author named the missing gate as a residual, which is right, but then wrote *"the
hero's third ledger source … is readable in `08-screens/hero-1440-glforce-rest.jpg`"*.
Measured, it is 1.34:1. That claim does not survive the measurement, and it is the one
place in the report where an assertion outran the evidence.

## 4. What I am not disputing

The lane's central idea is correct and well executed: a gate that measures light rather
than markup is the right instrument, `data-scene` on `Scene.tsx` is the right handle,
parameterising over `SCENES` is the right shape for later sections, and the contrast-vs-
brightness trade-offs are argued in writing at the point of change rather than asserted.
The 2% `fallbackCoverageMin` for `#experience` is justified honestly and I would not
overturn it. No new dependency, `package.json` untouched, DPR cap and context-loss
handling untouched, one `ScreenQuad` per scene, no gold anywhere, audit 10/10, monochrome
suites green. At 1440 the owner's correction is genuinely answered for all three sections.

## 5. Required before this can be called done

1. Restore a visible hero scene at ≤ 700 px — grade the mobile scrim the way the desktop
   one is graded, or scrim the reading column rather than the frame.
2. Make `flagship-visibility.spec.ts` iterate viewports (1440 and 390 at minimum) so F1
   cannot recur silently. About @390 must also reach the 0.35 peak floor.
3. Add the `?gl=force` variant of TC-CONTRAST-01 the author already identified, then fix
   the nodes it reports — `.trackCompany` and `.trackYears` over the strata, and the hero
   ledger over the pool.

Until 1 and 3 land, a visitor on a phone sees no hero scene and a visitor on a GPU reads
company names at 1.1:1.
