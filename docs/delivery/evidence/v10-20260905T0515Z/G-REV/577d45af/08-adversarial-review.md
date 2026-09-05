# 08 — Adversarial review: live re-probe of the flagship-C correction (t_flagvis0c)

**Reviewer** — council profile `reviewer` (docs/prompt.md §5), verification +
3rd_party_independent_adversarial_review, effort max. Read-only; no production file was
touched by this lane.

**Under review** — commits `d7adf27` (*fix(hero): the plates cost the fold nothing*) and
`13f1b82`, claimed live on build-commit `577d45af` at 12:40:05Z, per
`artifacts/kanban/tasks/t_flagvis0c.md` COMMENT 12:39:54Z / 12:40:55Z.

**Method** — `captures/probe3.mjs`, written for this review. System Chrome
(`/usr/bin/google-chrome`) with the launch args copied verbatim from
`tests/overhaul/flagship-visibility.spec.ts` `GL_ARGS`
(`--no-sandbox --use-gl=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`),
one browser context at a time, parity with the sibling reviewers' `G-REV/9ba97a5c/captures/probe.mjs`.
Every number below was captured fresh against the live origin. **No number from
`docs/delivery/evidence/v10-20260905T0515Z/C22c-flagship-correction/` was reused**; that
directory was read only to know what to attack.

Two luminance metrics are reported side by side and they answer different questions:

- **isolated** — `flagship-visibility.spec.ts`'s own measurement reproduced exactly: every
  element hidden except `[data-scene="hero-atmosphere"]`, coverage counted at
  `ground + 0.06`. This is the number the implementer's claim is stated in, so it is the
  number that can reproduce or refute it.
- **composited** — the stage box as it actually paints, with the text plates cut out of the
  histogram (27 plate/text rects at 390, 25 at 1440), coverage counted at an absolute
  0.12 relative luminance. This is what a visitor receives, which is the question F1 asks.

---

## 0. SCOPE DEVIATION — the build moved three times under the probe

The review was scoped to `577d45af`. The 10-minute deploy metronome shipped four builds
during the 18 minutes this probe ran. Each stage records the `build-commit` meta it actually
measured:

| stage | measured build | time |
|---|---|---|
| 390 `?gl=force` | `874f1ee9` | 12:52Z |
| 1440 `?gl=force` | `37cbb52c` | 12:56Z |
| 1440 `/`, 390 `/`, reduced-motion | `7d467770` | 12:58Z |
| 1280 perf | `9b864752` | 12:59Z |

**This does not invalidate the review, and here is the proof rather than the assertion:**

```
git diff --name-only 577d45a origin/main -- components app tests lib
  app/data/generated/greeting-asset.ts
  app/data/portfolio/about.ts
  components/MiniVicBot.tsx
  tests/about_sourced_semantics.test.mjs
  tests/ci_pipeline.test.mjs
  tests/e2e/about.spec.ts
  tests/e2e/minivic-send-path.spec.ts
  tests/minivic_greeting.test.mjs
  tests/minivic_send_path.test.mjs
  tests/monochrome/gold-semantics.spec.ts
```

Not one file under review changed. `Hero.module.css`, `Experience.module.css`,
`About/field.glsl.ts`, `Experience/strata.glsl.ts` and `app/globals.css` are byte-identical
between `577d45a` and `origin/main`. The CSS and GLSL measured here are the CSS and GLSL
`d7adf27` + `13f1b82` shipped.

**One caveat that does bite:** `d958917 fix(about): gold only where the evidence names a
checkable record` changed `app/data/portfolio/about.ts` between `577d45af` and the builds my
`#about` contrast nodes were sampled on. About-section AA results below are therefore for the
current About copy, not for `577d45af`'s. `#hero` and `#experience` — where every F1/F2
defect lives — are unaffected.

---

## 1. Verdict table

| gate | verdict | evidence |
|---|---|---|
| **F1-phone-scene** | **PASS** | 390×844 `?gl=force`, `[data-scene="hero-atmosphere"]` canvas mounted. **isolated: coverage 100.0% @ ground+0.06, peak 0.8308, motion 0.0796.** composited (plates masked, 67.5% of the box cut out): **coverage 65.0% @ L≥0.12, peak 0.9216, motion 0.0211.** Was 0.00% / 0.0212 / 0.00011. `.Hero_stage::after` computed `display: none` at 390 — the flat scrim is gone. `captures/probe3-a.json`, `captures/390-glforce-hero-{composited,isolated}.png` |
| **F2-contrast-gl** | **FAIL** (hairline, 390 only) | 390×844 `?gl=force`: **1 of 145 sampled text nodes below AA.** `section#experience > … > p.Experience_openNote` — "Three roles state a figure in the CV. The other…", fg `rgb(144,144,144)` on sampled ground `rgb(42,42,42)`, 15.09 px / 400, **ratio 4.496:1, needs 4.5:1** (deficit 0.004). 1440×900 `?gl=force`: **0 of 159 below AA**, worst `.Experience_roleDates` "March 2026 - Present" 4.66:1. `captures/probe3-{a,b}.json` |
| **F2-contrast-still** | **PASS** | `/` at 1440×900: 0 of 159 below AA, worst 4.66:1. `/` at 390×844: 0 of 145 below AA, worst 4.65:1. `captures/probe3-{c,d}.json` |
| **no-regression-desktop** | **PASS** on the gate, **claim not reproduced** | 1440×900 `?gl=force` hero isolated **coverage 40.3%** (gate ≥15%), peak 0.8308 (gate ≥0.35), motion 0.0216 (gate ≥0.004); composited 25.0% @ L≥0.12, peak 0.9216, motion 0.0144. No plate hides the scene. But 40.3% is **below the "~44%" the task text claims** — see §4. `captures/probe3-b.json` |
| **reduced-motion** | **PASS** | `prefers-reduced-motion: reduce` at 390 and 1440: **0 canvases** on the page, `#hero h1` "Vikram Deshpande" visible, 21 hero text leaves rendered. Still is light: 390 coverage **42.6%**, peak 0.301; 1440 coverage **10.4%**, peak 0.093 — both measured at the stricter `+0.06` delta and still clearing the suite's 8% floor at `+0.04`. `captures/probe3-e.json` |
| **perf** | **FAIL on CLS** | 1280×720, PerformanceObserver: **LCP 1488 ms** — PASS (<2500 ms) — element `IMG` `assets/my_avatar.avif`, 175 032 px². **CLS 0.176** — **FAIL (gate <0.05, 3.5× over)**. `responseEnd` 295 ms, `load` 786 ms. `captures/probe3-f.json` |
| **G-H2-scrim** | **PASS** | Desktop `.Hero_stage::after` computed `background-image` = `linear-gradient(90deg, rgba(10,10,10,0.88), rgba(10,10,10,0.86) 44%, rgba(10,10,10,0.45) 56%, rgba(0,0,0,0) 66%)`, `display: block`, 1440×937.64 px. **The flat 0.68 wash is gone**; the scrim is graded to full transparency past 66% of the frame. Fold dominant visual: the hero canvas at 1440×938 = **104.2% of the 1440×900 fold**, and it is lit (40.3% of it ≥ ground+0.06). The photograph (`my_avatar.avif` + its video twin, 516×287) is **11.45%** — the phase-1 11.4% baseline is the photograph, and it is no longer the dominant visual. `captures/probe3-b.json` |
| **errors / requests** | **PASS** | **0 pageerrors, 0 failed requests, 0 console errors** in all seven contexts: 390 & 1440 `?gl=force`, 390 & 1440 `/`, 390 & 1440 reduced-motion, 1280 perf. HTTP 200 throughout. |

---

## 2. Failures first

### FAIL-1 — `perf` / CLS 0.176 at 1280×720 (gate <0.05)

The only gate that fails by a wide margin. Measured with a `layout-shift` PerformanceObserver
buffered from before navigation, `hadRecentInput` shifts excluded, on `/` at 1280×720:
**CLS = 0.1763888888888889**. The Definition of Done in `CLAUDE.md` requires CLS < 0.05.

*Method caveat, stated so it cannot be mistaken for a hidden assumption:* the probe clicks the
Preloader's own Skip control (the `tests/helpers/boot.ts` handoff) rather than waiting out the
~1.9 s boot wipe. A Playwright click is a trusted input, so shifts inside its 500 ms window are
excluded by `hadRecentInput` — but the hero entrance that the skip triggers runs past that
window and is a plausible contributor. This number should be re-measured on an unskipped boot
before a fix is designed. It is reported as FAIL because 0.176 is 3.5× the gate and the
observation is real; it is **not** attributed to `d7adf27`/`13f1b82`, whose stated purpose was
the opposite — removing plate padding precisely so the fold did not move (TC-HERO-09).

### FAIL-2 — `F2-contrast-gl` at 390: one node at 4.496:1

`p.Experience_openNote` — "Three roles state a figure in the CV. The other …" — 15.09 px / 400,
`rgb(144,144,144)` over a sampled strata ground of `rgb(42,42,42)`, **4.496:1 against a 4.5:1
requirement**. It fails the repo's own predicate in `tests/a11y/text-contrast.spec.ts`
(`worst < need`) by 0.004.

This is the ceiling the correction's own CSS comment names:

> `0.90 is the measured number … over the brightest fog this shader draws (0.8308 relative
> luminance …) it lands the ground on '#212121', inside the '#2A2A2A' ceiling '--mist-400'
> needs for 4.5:1.` — `Hero.module.css:194-197`

`rgb(42,42,42)` **is** `#2A2A2A`. The design was taken to the exact boundary, and on the live
build one frame of shader phase put a sampled ground on the wrong side of it. That is why
TC-CONTRAST-02 can be green on the implementer's machine and red here: the predicate has no
margin, so it is decided by which frame the screenshot catches. **The claim "every visible text
node clears AA 4.5:1 … on `/?gl=force` … at 390×844" does not hold on the live build.** The
node is in `#experience`, one of the sections F2 explicitly covers.

Severity: hairline in ratio, real in gate terms. The fix is margin, not a new mechanism — a
darker plate or a shader groove under `.openNote`, the same two instruments already used for
`.trackCompany` and the compass numerals.

---

## 3. Regressions vs the 9ba97a5c baseline

**None found.** Everything the earlier reviewer's baseline flagged in this area is measurably
better or unchanged:

| item | 9ba97a5c-era baseline | live now | direction |
|---|---|---|---|
| hero scene @390 `?gl=force` | coverage 0.00%, peak 0.0212, motion 0.00011 | 100.0% / 0.8308 / 0.0796 | **fixed** |
| AA failures @1440 `?gl=force` | 9 nodes | 0 | **fixed** |
| AA failures @390 `?gl=force` | 12 nodes | 1 (hairline) | **11 of 12 fixed** |
| `.trackCompany` Telstra / InfoCentric | 1.10:1 / 1.11:1 | not in the failure set; worst `#experience` node is 4.50:1 | **fixed** |
| hero `.ledgerSource` @1440 | 1.34:1 | not in the failure set | **fixed** |
| compass numerals @390 | 5 nodes 2.66–3.45:1 | not in the failure set | **fixed** |
| About numeral "01" @1440 | 4.42:1 | not in the failure set (worst overall 4.66:1) | **fixed** |
| photograph caption "Photograph · Melbourne" | flagged, unmeasured | not in the failure set on either path | **fixed** |
| desktop fold dominant visual | 11.4% (the photograph) | hero canvas 104.2% of fold and lit; photograph 11.45% | **improved** |
| G-H2 desktop scrim | flat 0.68 wash | graded, transparent past 66% | **fixed** |
| pageerrors / failed requests | — | 0 / 0 in all 7 contexts | clean |

The desktop scene was **not** traded away to buy the phone fix: 1440 `?gl=force` coverage is
40.3% against a 15% floor, and no plate covers it.

---

## 4. False-positive register

Claims in `d7adf27` / `13f1b82` / the task's COMMENT text that this review could **not**
reproduce, quoted verbatim:

1. **"every visible text node clears AA 4.5:1 on / AND on /?gl=force at 1440×900 and 390×844"**
   *(task scope text, from the 12:39:54Z COMMENT "F2 TC-CONTRAST-02 added … and green")* —
   **not reproduced.** One node fails on `/?gl=force` at 390×844: `p.Experience_openNote` at
   4.496:1. Three of the four required cells are clean; the fourth is not.
   Evidence: `captures/probe3-a.json` → `["390-glforce"].aa.failures[0]`.

2. **"hero@390 gl=force coverage 100% / peak .83 / motion .0587"**
   *(task COMMENT 12:39:54Z)* — **coverage and peak reproduced exactly** (100.0%, 0.8308).
   **Motion not reproduced as stated: measured 0.0796, i.e. 36% higher than claimed.** The
   claim is conservative, so this is a variance note rather than an overclaim; it is registered
   because the number is not repeatable to the precision it was quoted at. The implementer's own
   `02d-tests-failing-round3` log records 0.04908 for the same measurement, so three runs give
   0.049 / 0.059 / 0.080 — the metric has roughly ±50% frame-phase spread and should not be
   quoted to four decimal places as a stable property.
   Evidence: `captures/probe3-a.json` → `["390-glforce"].heroStage.isolated.motion`.

3. **"the ~44% the implementer claims"** *(desktop hero coverage, review scope text)* —
   **not reproduced: measured 40.3%.** The implementer's own logs give 41.94%
   (`02d-tests-failing-round3-vitrine-flake.log:10`) and 43.03% (`02-tests-failing.log:10`), so
   "~44%" was already the top of their range rounded up. 40.3% is 2.7× the 15% gate and the
   gate is what governs, so this is a **documentation overclaim, not a defect**. Registered
   because the scope asked whether the number could be lower than claimed, and it is, by
   1.6–3.7 points.
   Evidence: `captures/probe3-b.json` → `["1440-glforce"].heroStage.isolated.coverageRepo`.

4. **"Every plate is now exactly the box the text already had."** *(d7adf27 commit body)* —
   **not verifiable as stated, and as written it is false.** The live phone plates carry
   `padding-inline: 0.45rem` with a compensating `margin-inline: -0.45rem`
   (`Hero.module.css:210-215`), so each plate is **wider than the glyph box by 0.9rem** and only
   the *glyph position* is unchanged. The commit's operative claim — that no glyph moves and the
   fold does not grow — is consistent with what shipped; the sentence quoted is not. Cosmetic,
   recorded for accuracy.

Nothing else in either commit body or the task's COMPLETE/COMMENT text failed to reproduce.

**Observation, not a finding:** the phone plate rules are declared twice in
`Hero.module.css` — at :204-219 and again at :983-999. The second block carries a comment
explaining that it must follow the base rules to beat their `margin`/`background` shorthands.
It is deliberate and documented, and `TC-NFR-DEADCSS` is about unrenderable selectors, not
duplicates, so no gate is threatened. Flagged only so the next editor of that file does not
change one copy and not the other.

---

## 5. Bottom line

**F1 PASSES, decisively and on the live build.** The phone hero scene is not merely mounted, it
is lit: 100% of the isolated slot above ground, 65% of the composited stage above 0.12 absolute
luminance with the plates cut out, and it moves. The `display: none` on the flat scrim is
confirmed in the live computed style.

**F2 does not fully pass.** Eleven of the twelve 390 defects and all nine 1440 defects are
genuinely fixed, and both still-path viewports are clean — but one node remains 0.004 short of
AA on the WebGL path at 390, at exactly the `#2A2A2A` boundary the correction's own comment
identifies as the ceiling. Because the correction is specified as *every* node clearing AA on
*both* paths at *both* viewports, this is a FAIL, and per the reviewer contract
(`reviewer.system-prompt.md` §3) it must open a `feedback_refactor_loop` task rather than be
silently closed.

**`goal_complete: false`** — F1 passes with no regression; F2 does not.

Two items land outside this correction's scope but were measured and should not be lost:
**CLS 0.176 at 1280×720** (gate <0.05), and the ±50% run-to-run spread of the `motion` metric
that three of these gates are stated in.
