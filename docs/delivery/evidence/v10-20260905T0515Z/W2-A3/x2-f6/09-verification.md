# X2-F6 — `x2-f6-about-open-mark` — RED, and the trigger for X2-F7 is measured

**Agent:** `ap-w2-x2f6` (analyst-programmer, `docs/prompt.md` §5) · **Task:** `t_w2_x2f6`
**Branch:** `worktree-w2-x2f6` from `origin/main` `83f4b208` · **Port:** `:5601` · **Run:** 2026-09-06T04:29Z–05:30Z

## Outcome

`TC-SCENE-ABOUT-10` (10a/10b/10c) and `TC-STORY-ABOUT-03` are authored, measured and pushed **red by
design**. The shader term is **not** pushed. A stop condition fired; ABOUT-STORY-v2 §5 says do not push a
partial shader, and §6's trigger list is now carried by measurement rather than by expectation.

## What was run, and what it said

### 1 · The tests, red first, before `field.glsl.ts` was opened (`02-tests-failing.log`)

The metric was authored and run against unmodified `origin/main`. All ten sectors read the same:

| state | structure, ten sectors (role-side = 6, 7, 9 → indices 5, 6, 8) | answered max | open min |
|---|---|---|---|
| 1440 at rest | 0.1708 0.1808 0.1215 0.2367 0.0892 0.1670 0.1235 0.1834 0.1605 0.1741 | 0.2367 | 0.1235 |
| 1440 dim 4 | 0.1225 0.1251 0.1189 0.1344 0.1262 0.1108 0.1118 0.1394 0.0990 0.1186 | 0.1394 | 0.0990 |
| 390 at rest | 0.1026 0.1160 0.1067 0.1165 0.1147 0.1022 0.1089 0.0978 0.1332 0.1248 | 0.1248 | 0.1022 |
| 390 dim 1 | 0.1530 0.1521 0.2616 0.1166 0.1136 0.0981 0.1139 0.1186 0.1837 0.1522 | 0.2616 | 0.0981 |

No separation anywhere — which is the F-2 defect, stated in the mark channel for the first time.

That first read also produced a finding the architecture could not have had: **the incoherent floor in
DFT bin 5 is 0.09–0.26, not the ~0.02 a grain-only estimate gives.** A single-pixel arc read cannot
resolve a 0.21 modulation against it. So the estimator — not the threshold — was made precise: each arc
position is now the mean of a 15-sample radial run (`RADIAL_RUN`/`RADIAL_SPAN`,
`tests/overhaul/scene-about.spec.ts`). The mark is drawn from `within` alone, so it is *exactly*
radius-invariant and a radial mean is coherent gain on it; grain, motes and the value-noise shimmer are
not, and fall as 1/sqrt(n). `OPEN_STRUCTURE_RATIO = 3.0`, `OPEN_STRUCTURE_MIN = 0.20`,
`OPEN_NO_INVERSION = 1.20` are exactly as ABOUT-STORY-v2 §4 authored them. **Decision logged under
§0.1: measurement precision raised, no threshold moved.**

### 2 · E-1 + E-3 applied and measured (`03-shader-E1-E3.patch`, `04-tests-measured-depth-0.42.log`)

`ABOUT_OPEN_MARK_DEPTH = 0.42`, `ABOUT_OPEN_RULING = 26.0`, `ABOUT_OPEN_DASHES = 5.0`:

| state | open min | answered max | ratio | 10a (≥3.0×) | 10b (≥0.20) |
|---|---|---|---|---|---|
| 1440 dim 4 | **0.3859** | 0.1297 | **2.98** | ~at bar | PASS |
| 390 at rest | **0.3689** | 0.1239 | **2.98** | ~at bar | PASS |
| 390 dim 1 | **0.3483** | 0.2204 | 1.58 | FAIL | PASS |
| **1440 at rest** | **0.0972** | 0.1737 | **0.56** | FAIL | **FAIL** |

The mark is real and it is visible: `08-about-390-at-rest-mark.png` shows three of the ten sectors
carrying the 45° ruling and the broken arc while the other seven read as solid light, at unchanged mean
luminance. `08-about-1440-at-rest-mark.png` shows the same mark present only in the plane's lower band.

### 3 · Why 1440-at-rest is zero, and why depth cannot fix it

`markWindow` carries `(1.0 - guarded)` — mandated by ABOUT-STORY-v2 §3 so no pixel either ceiling
touches is moved, and so `TC-CONTRAST-01/02` cannot change. At 1440 with the section at its first
viewport, `guarded` covers most of the ring annulus the test reads, so the multiplier is 1.0 there and
the mark is absent — not attenuated. **Raising `ABOUT_OPEN_MARK_DEPTH` to 0.50 multiplies a zero and was
therefore not run**; the ruling and dash counts change the frequency, not the gate. This is
ABOUT-STORY-v2 §6's third X2-F7 trigger — *"10b red because the ring annulus there is mostly guarded"* —
observed at 1440 rather than at 390.

### 4 · The other X2-F7 trigger, also now measured (`02b-story-about-failing.log`)

`TC-STORY-ABOUT-02` on unmodified `origin/main`, the number §7's risk register said nobody had:

```
[story:about-02@1440] role=0.10178 candidate=0.17392 deficit=0.4148   PASS (bar 0.15)
[story:about-02@390]  role=0.17353 candidate=0.19443 deficit=0.1075   FAIL (bar 0.15)
```

**`TC-STORY-ABOUT-02 @ 390` is red at 0.1075 against its authored 0.15 bar — X2-F7's first trigger,
fired.** It is red on `main` today and is not caused by anything in this slice.

`TC-STORY-ABOUT-03` red at both widths, as authored: 1440 role-min 0.0882 / candidate-max 0.3296
(ratio 0.268); 390 role-min 0.0642 / candidate-max 0.2968 (ratio 0.216). `TC-STORY-ABOUT-01` green at
both widths (13 and 12 lobes). `TC-STORY-PLANE-01` green at both widths.

## Gates on the pushed tree

| gate | result | log |
|---|---|---|
| `npx tsc --noEmit` | clean | `05-battery-tsc-lint.log` |
| `npm run lint` | clean, 0 warnings | `05-battery-tsc-lint.log` |
| `npm run build:static` | exit 0, secret scan PASS | `05-battery-build.log` |
| `overhaul_static_audit.mjs` | **10/10** | `05-battery-audit.log` |
| `TC-SCENE-ABOUT-10` ×4 | **red by design**, all ten values printed per state | `02-tests-failing.log` |
| `TC-STORY-ABOUT-03` ×2 | **red by design** | `02b-story-about-failing.log` |
| visual baselines | untouched — no shader ships, and no `tests/visual` file is in the diff | `git diff --stat` |
| gold in ring/fan | untouched — the pushed diff contains no GLSL change | `03-shader-E1-E3.patch` (not applied) |

Coverage and contrast were **not** re-measured on the pushed tree: the pushed tree's `field.glsl.ts`
GLSL body is byte-identical to `origin/main`, so `TC-FLAGSHIP-VIS-ABOUT` and `TC-CONTRAST-01/02` read
exactly what `main` reads. They are unclaimed rather than asserted.

## Handover to X2-F7

The measured term is kept verbatim at `03-shader-E1-E3.patch` (E-1 hoist + E-3 mark + the three GLSL
constants interpolated from the exported TS ones). Once X2-F7 ends the plane band above the first of the
ten and takes the caption off the plane, `guarded ≈ 0` over the band and the patch applies unchanged;
the three states that already clear 10b at depth 0.42 suggest depth 0.42–0.50 will carry the fourth.
