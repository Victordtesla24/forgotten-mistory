# ABOUT-STORY-v2 — the field says *which* three of the ten are open, and it says it in the mark, not in the dimmer

**Author:** solutions-architect (`docs/prompt.md` §5), session `sa-w2-a3` · **Task:** `t_w2_a3sa` · **Written:** 2026-09-06T04:08Z–04:25Z
**Answers:** ADV-REVIEW-20260905T2315Z **F-2** (*"the field's light did not say which of the ten dimensions are answered"*),
`479e2b2` → `ef2979a` (the fix, and its revert), GAP-BACKLOG **G-A3**, `SIGNATURE-SCENES-v2` §5-2 (`TC-STORY-ABOUT-01/02`).
**Read-only pass:** no app code, no test code and no shader was edited to write this. Everything below is a specification
for slice **X2-F6** (and a conditional **X2-F7**), with the thresholds an AP has to make green.

---

## 1. The problem, in the three numbers that bound it

Three floors are live at once and the answered/open story sits between them. Every figure below is measured — by
`ap-w2-x2f5` on `:5627`, recorded in the bodies of `479e2b2` and `ef2979a`, or read out of the test files named beside it.

| Floor | Where it is written | Value | Where it stands today |
|---|---|---|---|
| **Coverage** | `tests/overhaul/flagship-visibility.spec.ts:175-176` (`COVERAGE_DELTA = 0.06`, `COVERAGE_MIN = 0.15`) | ≥ 15% of the isolated slot's pixels ≥ ground + 0.06 rel. luminance | **15.52%** @1440 on `main` (`ef2979a` body) — 0.52 pp of headroom |
| **Contrast** | `tests/a11y/text-contrast.spec.ts` `TC-CONTRAST-01` (`/`) and `-02` (`/?gl=force`), 1440 + 390 | every visible text node ≥ AA (4.5:1) | green, held there by the two ceilings `READING_CEILING = 0.1`, `INSTRUMENT_CEILING = 0.24` (`components/sections/About/AboutField.tsx:64-65`), applied last at `field.glsl.ts:415-427` |
| **Story** | `tests/overhaul/scene-about.spec.ts:684-690` (`TC-SCENE-ABOUT-10`, ratio ≥ **1.6**) and `tests/overhaul/story-contract.spec.ts:82-85` (`ABOUT_MIN_LOBES = 8`, `ABOUT_MINIMA_DEPTH = 0.25`, `ABOUT_ROLE_DEFICIT = 0.15`) | answered/open ring + fan means ≥ 1.6; ≥ 8 lobes; role-side ≥ 15% below candidate-side | ring **1.499** @1440 at rest — **red at the screen a reader arrives on** |

`479e2b2` moved the state term after both ceilings and applied it to the whole pixel. It bought the story and it
cost the area:

```
ring answered/open   1440 at rest       1.499 -> 1.556   (still under the 1.6 bar)
                     1440 dimension 4   3.983 -> 8.137
                     390  at rest       3.348 -> 7.791
fan  answered/open   1440 dimension 4   4.181 -> 14.996
TC-FLAGSHIP-VIS-ABOUT @1440 coverage   15.52% -> 13.66%  (floor 15%)
```

Three attempts to buy the area back, all measured (`ef2979a` body):

```
ring 0.68 / fan 1.10 / haze 0.252   14.28%   under the floor
ring 0.68 / fan 1.10 / haze 0.312   14.82%   under the floor
ring 0.82 / fan 1.30 / haze 0.312   15.31%   TC-CONTRAST-01 and -02 FAIL at 390
```

**Why the vice closes.** Coverage counts a pixel at ground + 0.06. The ceilings hold the light under type to 0.10
(reading column) and 0.24 (instrument caption) through a saturating map, `luma = ceiling·(1 − e^(−luma/ceiling))`
(`field.glsl.ts:427`), so *guarded area can never become coverage*. The area therefore has to come from the unguarded
plane; at 390 the unguarded plane is the band the heading and the instrument stand on
(`About.module.css:406-450` — one column, `.fieldViewport` 30 rem, the instrument in flow above the list), which is
exactly the light `TC-CONTRAST` measures. Coverage and contrast pull against each other and the three open wedges are
between them.

**And a dimmer cannot win it even if the area were free.** At 1440 at rest the whole-pixel state term reached
**1.556** against its own 1.6 bar. Going further means dimming harder, which costs more of the 0.52 pp of coverage
headroom that does not exist.

**The deeper defect the reviewers found.** `rev-12cd9123-w1` F-2 measured the ten ring sector means at 1440:

```
0.7065  0.6327  0.3556  0.4980  0.0122  0.2169  0.0627  0.2303  0.5661  0.7133
```

Sector 5 *Culture Fit* (**answered**) is the darkest thing on the ring at **0.0122**; sector 9 *Company Stability*
(**role-side, open**) is one of the brightest at **0.5661**. A group-mean ratio of 1.596 was recorded over that.
Brightness on this plane tracks **position** — the guard under the reading column, the falloff from the origin — not
`about.ts`. `rev-3657baa1` reaches the same reading. That is a defect in the *carrier*, not in its gain: no amount of
luminance grading survives a plane whose luminance is already a strong function of where a sector happens to point.
The same review also tested the obvious alternative and recorded it dead: **45° hatch energy per sector separates the
two groups 0.944 / 1.088** — the hatch that is already in the shader (`field.glsl.ts:267`, `sin((p.x+p.y)*42.0)`,
amplitude 0.26 inside a 0.34–0.60 multiplier applied to the ring and fan only) is not measurable through the unstated
haze it sits in.

---

## 2. Decision (§0.1 — non-interactive, logged with its reversal cost)

> **Decision: (c) both — (a) now, (b) on a stated numeric trigger.**
>
> **(a) lands in slice X2-F6.** The answered/open difference moves out of the *dimmer* and into a **mark**: an
> **area-preserving broken-and-ruled figure** drawn on the three open sectors only, at **mean luminance 1.0** — it
> takes no light away, so it spends no coverage — gated to the **unguarded** plane, so it cannot touch a ceiling and
> cannot move a contrast number. `TC-SCENE-ABOUT-10`'s group-ratio clause is replaced by a **per-sector separation
> clause in the mark channel** plus a **non-inversion floor** in the luminance channel; a new `TC-STORY-ABOUT-03`
> carries the same claim on the story capture. Today's luminance grading (`state`, `field.glsl.ts:275`) is left exactly
> as it ships, so coverage stays at its measured 15.52%, both ceilings stay where they are, and `TC-STORY-ABOUT-02`'s
> deficit clause is untouched.
>
> **(b) is specified and held.** The 390 composition change — end the plane band above the first of the ten and take
> the instrument's caption off the plane — is the *only* lever that creates unguarded area, and therefore the only way
> any **luminance** clause about this field can ever be raised. It is slice **X2-F7** and it fires on a measured
> trigger (§6), not on taste.
>
> **Rejected: lowering any floor.** Coverage stays 15%. AA stays 4.5:1. `READING_CEILING` stays 0.10 and
> `INSTRUMENT_CEILING` stays 0.24. Gold stays at zero pixels inside the field. No base coefficient in `field.glsl.ts`
> is raised by X2-F6.
>
> **Reversal cost.** X2-F6 is one shader file plus two test files, no data, no DOM, no CSS: `git revert` of a single
> commit, ~5 minutes, precedent `ef2979a`. The visual baselines photograph the CSS still (`/`, no `?gl=force`), so a
> shader-only change regenerates none of them — if a baseline does move, the slice stops and reports rather than
> accepting a snapshot. X2-F7 is one media block in `About.module.css` (+ possibly one caption node in `About.tsx`):
> revert ≈ 10 minutes plus a 390 visual baseline regeneration, ~15 minutes total.

### Why this is a redefinition and not a weakening

The clause being retired is *"the mean of the seven answered sectors is ≥ 1.6× the mean of the three open ones."*
`rev-12cd9123-w1` shipped the counter-example: that clause was satisfiable at 1.596 while an answered sector sat at
0.0122 and an open one at 0.5661. It is a group statistic over a quantity that is dominated by position.

The clause replacing it is *"**every** open sector carries the mark and **no** answered sector does, sector by sector,
at ≥ 3× separation — and the answered mean is still never below the open mean."* It is per-sector, it is normalised by
each sector's own local mean (so it is immune to exactly the position gradient that produced F-2), and it keeps a
luminance floor so the grading can never invert. A shader that passes the new clause cannot fail the old one's
*intent*; a shader that passed the old one (today's, at 1.499/1.596) fails the new one. That is strictly stronger.

`SIGNATURE-SCENES-v2` §5 already sets this precedent for `#vitrine`: *"a **structural** pass proves the story without
spending contrast"* — the honest way out of a deadlock where there is no brightness left to spend. `#about` is the same
deadlock with 0.52 pp of coverage instead of ×1.04 of AA.

### Can a stranger still tell answered from open with the dial hidden?

Yes, and by two channels at once, both of them the site's existing vocabulary rather than a new one to learn:

1. **Broken line.** An answered sector's arc is continuous; an open sector's is drawn in **five dashes across its own
   width**, phase-locked so a seam stays a seam. Solid-versus-broken is the oldest distinction in engineering drawing —
   *this is measured* against *this is provisional* — and it survives at a glance, at any brightness, in a dim corner of
   the plane as well as in the core.
2. **The 45° ruling.** The same hatch the SVG draws over an open sector and the same hatch the open caliper
   (`components/marks/Caliper.tsx`) uses everywhere else on the site — here at a spatial frequency a reader and a
   screenshot both resolve (§4), and applied to the whole pixel so the haze cannot wash it out.

Three of ten sectors read as *drawn open* — hatched, broken — while seven read as solid light. That is the same
sentence the caliper says beside each of the three role-side rows (*"measured from the role"*,
`app/data/portfolio/about.ts` dimensions 6 *Salary Fit*, 7 *Location Match*, 9 *Company Stability*), said in the field.
And unlike a dimmer, it does not claim that an open dimension is *less* — it claims it is *of a different kind*, which
is what `CLAUDE.md` prime directive 3 actually says about the open state.

---

## 3. The mechanism, precisely (what X2-F6 writes into `field.glsl.ts`)

Three edits, all inside `components/sections/About/field.glsl.ts`. Nothing else in the app changes.

**E-1 — hoist the guard, change nothing about it.** `toRight` / `belowList` / `reading` / `caption` / `guarded` /
`ceiling` (`:415-427`) depend only on `vUv` and `uGuard`. Compute them at the top of `main()`; leave the ceiling's own
application at `:427` exactly where and as it is. Pure code motion; `TC-CONTRAST-01/02` prove it.

**E-2 — keep the existing grading untouched.** `float state = mix(0.34 + 0.26 * hatch, 1.0, answered);` (`:275`) and
its four uses (`:308`, `:312`, `:341`, `:352`) stay byte-for-byte. This is what protects the 15.52%.

**E-3 — add the mark, once, to the whole pixel, before the ceilings.** Immediately after `float luma = sector;`
(`:384`) and before the edge fade:

```glsl
// The open mark: the three role-side sectors are DRAWN open rather than dimmed.
// Two channels, both of them the open caliper's own vocabulary — the arc broken
// into ABOUT_OPEN_DASHES dashes across the sector's width, and the 45-degree
// ruling the SVG hatches an open sector with. `mark` has mean 0 over a sector
// (integral of -cos over a whole number of cycles, and of a ruling over area),
// so `openMark` has mean 1.0: it moves light around inside a sector and never
// takes any away. That is the whole point — the coverage gate counts area, and
// this costs none.
float dash  = -cos(within * TAU * ABOUT_OPEN_DASHES);   // seam sits in a trough
float ruled =  sin((p.x + p.y) * ABOUT_OPEN_RULING);
float mark  = 0.5 * dash + 0.5 * ruled;                 // [-1, 1], mean 0
// Faded at both seams so a whole-plane multiplier draws no hard spoke in the
// haze (the failure 479e2b2 had to crossfade around), zeroed under both type
// guards so no guarded pixel is touched and no ceiling can be breached, and
// applied only where the sector is open.
float markWindow = smoothstep(0.0, 0.14, within) * smoothstep(1.0, 0.86, within)
                 * (1.0 - guarded) * (1.0 - answered);
luma *= 1.0 + ABOUT_OPEN_MARK_DEPTH * mark * markWindow;
```

with three named constants exported from the same module so the tests cannot drift from the shader:

```ts
export const ABOUT_OPEN_DASHES = 5.0;        // dashes across one sector's width
export const ABOUT_OPEN_RULING = 26.0;       // 45-degree ruling, in the plane's own frame
export const ABOUT_OPEN_MARK_DEPTH = 0.42;   // peak swing about the sector's own mean
```

Four properties this has by construction, each of which is still to be *measured*, not asserted from the armchair:

- **Coverage-neutral by mean.** `openMark` averages 1.0 over any whole sector, so no light leaves the plane. The only
  coverage it can move is the threshold-crossing asymmetry at ground + 0.06 — bounded, small, and **measured** in the
  slice. Budget: ABOUT coverage @1440 must read **≥ 15.00%** (target ≥ 15.20%).
- **Contrast-neutral by gating.** `(1.0 - guarded)` makes the multiplier exactly 1.0 on every pixel either ceiling
  touches, so `TC-CONTRAST-01/02` see the same field they see today. Still run, at both widths, on both paths.
- **Gold-neutral.** The mark multiplies `luma` only; colour is still `uLight`/`uInk` at `:434-440`. `TC-SCENE-ABOUT-10`'s
  `ring.gold` / `fan.gold` clauses stay green.
- **Position-invariant.** Depth is a fraction of each sector's *own* light, so a sector in a dim corner carries the same
  relative mark as one in the core. This is the direct answer to F-2.

**Tuning window (bounded, and only inside these bounds):** `ABOUT_OPEN_MARK_DEPTH ∈ [0.30, 0.50]`,
`ABOUT_OPEN_RULING ∈ [20, 32]`, `ABOUT_OPEN_DASHES ∈ {4, 5, 6}`. Coverage ≥ 15.00% is the hard bound; the structure
ratio (§4) is the target. If both cannot be met inside the window, the slice reports RED with its numbers and hands the
trigger to X2-F7 — it does not move a threshold.

---

## 4. TDD — the cases, first, with file, assertion and threshold

Written red before `field.glsl.ts` is opened. All three run on the captures the suites already take; no new fixture.

### T-1 · `tests/overhaul/scene-about.spec.ts` — the structure metric

Extend `readAnnulus()` (`tests/overhaul/scene-about.spec.ts:208`, returning the `AnnulusReading` declared at `:184-197`) with one field:

```ts
/** Normalised amplitude of the open mark in each sector, 0 = smooth arc. */
sectorStructure: number[];
```

computed **frequency-selectively**, because a plain contrast measure would read the shimmer term
(`sector *= 0.82 + 0.28 * shimmer`, `field.glsl.ts:310`) as structure:

1. For each sector `i`, at each of three fixed radii `rr ∈ {0.55, 0.66, 0.88}` of the rose radius (all clear of the
   numerals' groove at `rr = 0.724`, `field.glsl.ts:246`, and of both band edges), sample **32 arc positions** evenly
   over `within ∈ [0.06, 0.94]`.
2. Per radius, take the single DFT bin at `k = ABOUT_OPEN_DASHES` cycles across the sector (Goertzel is four lines) and
   normalise: `s = 2·|X_k| / mean(profile)`.
3. `sectorStructure[i] = median of the three radii`.

Import `ABOUT_OPEN_DASHES` from `components/sections/About/field.glsl.ts` so the test measures the frequency the shader
draws. Shimmer and drift deposit their energy at ≈1 cycle per sector and leak little into bin 5; the slice **prints all
ten values on every run**, pass or fail (`479e2b2` started that practice for the sector means because `rev-12cd9123-w1`
had to reconstruct them by hand — it is now mandatory for this metric too).

Then, inside `assertTellsTen()`, **replace** the `answeredMean / openMean ≥ 1.6` clause (`:684-690`) with:

| # | Assertion | Threshold |
|---|---|---|
| **10a** | `min(sectorStructure over measured open sectors) ≥ OPEN_STRUCTURE_RATIO × max(sectorStructure over measured answered sectors)` | `OPEN_STRUCTURE_RATIO = 3.0` |
| **10b** | `min(sectorStructure over measured open sectors) ≥ OPEN_STRUCTURE_MIN` — the mark exists, rather than both groups reading zero | `OPEN_STRUCTURE_MIN = 0.20` |
| **10c** | `answeredMean / openMean ≥ OPEN_NO_INVERSION` — the light may never grade an open sector *above* an answered one | `OPEN_NO_INVERSION = 1.20` (green today in all four measured states: 1.499 / 3.348 / 3.983 / 4.181) |

Unchanged and still asserted: ten sectors on the annulus, the 12% seam step on every boundary but one, no gold pixel in
ring or fan, both states (`at rest` and `dimension 4` / `dimension 1`) at both widths.

### T-2 · `tests/overhaul/story-contract.spec.ts` — `TC-STORY-ABOUT-03` (new)

Same isolated capture and the same ten-sector alignment search (`bestPhi`) `TC-STORY-ABOUT-02` already does; the
difference is that the structure clause reads the **raw** `bins`, not the 4-bin-smoothed `histogram` — a 5-cycles-per-
36°-sector mark has a 7.2° period and the smoother would attenuate it.

| # | Assertion | Threshold |
|---|---|---|
| **03a** | For each sector, normalised amplitude of raw `bins` at `k = ABOUT_OPEN_DASHES` over its 36° span: `min(role-side) ≥ 3.0 × max(candidate-side)` | 3.0 |
| **03b** | `min(role-side) ≥ 0.15` (the angular average over all radii dilutes the mark relative to T-1's fixed-radius read, so the absolute bar is lower and the ratio does the work) | 0.15 |

`role`/`candidate` come from `aboutContent.dimensions` exactly as `-02` does, so the claim is against the real data.

### T-3 · unchanged, and re-run as the guard on this change

| Test | Clause | Bar |
|---|---|---|
| `TC-STORY-ABOUT-01` | ≥ 8 lobes, minima ≥ 25% below peaks | unchanged — the mark is zero-mean per sector, and extra dash lobes can only raise the count |
| `TC-STORY-ABOUT-02` | role-side maxima ≥ 15% below candidate-side mean | **unchanged and not weakened.** The slice measures and reports it; luminance is not touched by X2-F6, so its value is whatever `main` reads today. A red here is the X2-F7 trigger (§6) |
| `TC-FLAGSHIP-VIS-ABOUT` | coverage ≥ 15%, peak ≥ 0.35, motion ≥ 0.004, fallback ≥ 8% @ +0.04 | unchanged |
| `TC-CONTRAST-01` / `-02` | every text node ≥ AA at 1440 and 390 | unchanged |
| `TC-SCENE-ABOUT-07/08/11` | masks wired, compass is chrome | unchanged |

---

## 5. Slice X2-F6 — `x2-f6-about-open-mark` (one AP, ≤ 30 min)

| | |
|---|---|
| **Goal** | The three role-side sectors are *drawn* open — broken and ruled — at unchanged mean luminance; the story assertion measures the mark, per sector |
| **Files** | `components/sections/About/field.glsl.ts` (E-1 hoist, E-3 mark, three exported constants) · `tests/overhaul/scene-about.spec.ts` (T-1) · `tests/overhaul/story-contract.spec.ts` (T-2). **No** CSS, **no** `About.tsx`, **no** `about.ts`, **no** uniform added |
| **Order** | T-1 and T-2 first and **red** (capture the red output as evidence) → E-1 → E-3 → tune inside the §3 window → green |
| **Port** | `:5601` (council battery). `:5599` and `:8080` are held by other tenants — never reuse |
| **Gates** | `npx tsc --noEmit` · `npm run lint` · `npm run build:static` · `node scripts/validate/overhaul_static_audit.mjs` = 10/10 · then on `:5601`: `tests/overhaul/scene-about.spec.ts` (both widths, both states) · `tests/overhaul/story-contract.spec.ts -g ABOUT` · `tests/overhaul/flagship-visibility.spec.ts -g about` · `tests/a11y/text-contrast.spec.ts` (both cases, 1440 + 390) |
| **Budgets** | ABOUT coverage @1440 **≥ 15.00%** (report the figure; 15.52% is the pre-change reading) · peak ≥ 0.35 · no base coefficient raised · zero gold pixels in ring or fan |
| **Evidence** | `docs/delivery/evidence/v10-20260905T0515Z/W2-A3/x2-f6/`: `02-tests-failing.log`, `04-tests-passing.log` with **all ten `sectorStructure` values and all ten sector means printed in each state**, `05-battery-{tsc,lint,build,audit}.log`, `06-coverage.log` (the flagship ABOUT numbers), `07-contrast.log`, and 1440 + 390 screenshots with the type hidden so a human can see the three broken sectors |
| **Stop conditions (report, never weaken)** | coverage < 15.00% at `ABOUT_OPEN_MARK_DEPTH = 0.30` · any `TC-CONTRAST` node below AA · a visual baseline moves · structure ratio < 3.0 at depth 0.50 |

---

## 6. Slice X2-F7 — `x2-f7-about-390-unguarded` (conditional, ≤ 30 min)

**Fires only on a measured trigger, recorded in X2-F6's evidence:**

- `TC-STORY-ABOUT-02` deficit < 0.15 (its authored bar) after X2-F6, **or**
- ABOUT coverage @1440 < 15.00% with the mark at its minimum depth, **or**
- `TC-SCENE-ABOUT-10` 10b red at 390 because the ring annulus there is mostly guarded.

**What it changes** (`components/sections/About/About.module.css:406-450`, the `≤ 900px` block; `About.tsx` only if the
caption node moves): end `.fieldViewport` **above the first of the ten** instead of 6 rem past the instrument, and take
the instrument's caption/key off the plane onto its own plate below the band. Then `uGuard.y` and `uGuard.z`
(`AboutField.tsx:211-214`, read from the list's and the caption's own rects) no longer intersect the plane at 390:
`guarded ≈ 0` over the whole band, the two ceilings stop capping the field, and **only then** may the ring / fan / haze
bases be lifted to buy the coverage and the deficit that `ef2979a` proved cannot be bought today
(15.31% cost `TC-CONTRAST-01` and `-02` at 390).

**Gates:** the X2-F6 battery, plus `tests/visual` at 390 (a baseline regeneration is expected here and must be looked at
before it is committed), plus `TC-SCENE-ABOUT-11` and the 390 reduced-motion still.
**Reversal:** revert one media block; ~10 minutes, plus the baseline.
**Cost if wrong:** the composition note in `About.module.css:419-430` records *why* the band currently reads past the
instrument and over the first of the ten. X2-F7 trades that reading for headroom, so it does not fire on taste — only on
one of the three numbers above.

---

## 7. Risk register

| Assumption | Mitigation |
|---|---|
| A zero-mean mark moves coverage by less than 0.52 pp | Measured in X2-F6 (`06-coverage.log`) before anything else is claimed; depth window 0.30–0.50 is the lever, and < 15.00% at 0.30 is a stop condition, not a threshold change |
| Shimmer/drift leak little into DFT bin 5 | The metric prints all ten values every run; if answered sectors read above `OPEN_STRUCTURE_MIN / 3`, the ratio clause 10a is the one that governs and the absolute clause 10b is still authored as written |
| `ABOUT_OPEN_RULING = 26` resolves at both widths and at DPR 1 | Period ≈ 0.24 of half the plane's height (≈ 110 px on a 900 px-tall canvas — **estimate**, to be replaced by the AP's screenshot); tuning window 20–32 exists for exactly this, and the 1440/390 type-hidden screenshots are the human check |
| Hoisting the guard is behaviour-free | `TC-CONTRAST-01/02` at both widths, plus the audit, in the same run |
| The mark reads as noise rather than as *open* | Two channels, not one: broken arc **and** 45° ruling, both already the caliper's vocabulary, and the three sectors are the three the DOM already labels *"measured from the role"* |
| `TC-STORY-ABOUT-02` is red today and nobody knows | X2-F6 measures and reports it in `04-tests-passing.log`; it is the first X2-F7 trigger |

---

## 8. What this document does **not** authorise

Lowering `COVERAGE_MIN`, `PEAK_MIN`, `MOTION_MIN`, `FALLBACK_COVERAGE_MIN`, `ABOUT_MIN_LOBES`, `ABOUT_MINIMA_DEPTH`,
`ABOUT_ROLE_DEFICIT`, the AA bar, `READING_CEILING`, or `INSTRUMENT_CEILING`. Introducing chroma into the field.
Restoring the whole-pixel dimmer of `479e2b2`. Raising a base coefficient in X2-F6. Any of those is a different
document with a different set of measurements behind it.
