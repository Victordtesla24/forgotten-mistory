# G-X1-01b — the numbers (t_x1_01b, R2)

All figures are median rAF deltas from `tests/perf/scene-framerate.spec.ts`, on
this host's software rasteriser — `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device
(Subzero)), SwiftShader driver)`, 4 cores. **Per SIGNATURE-SCENES-v1 D9 none of
this is evidence that any scene holds 60 fps on a visitor's GPU, and no such claim
is made here.** The budgets (16.7 ms / 20.0 ms) are unchanged and every scene is
still over them: this lane moved the cost, not the threshold, and the harness is
still red.

Before: `02-baseline/` (this worktree, pre-change, build cd2544d8).
After: `04-after/` (this worktree, post-change).
Load is recorded per measurement inside each JSON (`host.loadavg`).

## TC-SCENE-FPS-01 — 1440x900, dsf 1, no CPU throttle

| scene | before (load) | after (load) | ratio | target |
|---|---|---|---|---|
| `hero-atmosphere` | 433.35 ms (4.3–14.2 band) | 100.00 ms (11.12) | **4.33×** | ≥ 3× ✅ |
| `about-field` | 274.95 ms | 100.00 ms (7.36) | 2.75× | ≥ 3× ⚠ |
| `career-strata` | 66.70 ms | 50.00 ms (11.05) | 1.33× | ≥ 2× ⚠ |
| `skills-bench` | 116.70 ms | 33.30 ms (9.42) | 3.50× (untouched) | not worse ✅ |

## TC-SCENE-FPS-02 — 390x844, dsf 3, CPU throttle x4

| scene | before | after (load) | ratio | target |
|---|---|---|---|---|
| `hero-atmosphere` | 433.30 ms | 66.60 ms | **6.51×** | ≥ 3× ✅ |
| `about-field` | 491.65 ms | 66.70 ms | **7.37×** | ≥ 3× ✅ |
| `career-strata` | 183.30 ms | 33.40 ms | **5.49×** | ≥ 2× ✅ |
| `skills-bench` | 33.30 ms | 33.30 ms | 1.00× (untouched) | not worse ✅ |

## How much of this is the change, and how much is the host

`skills-bench` was **not modified by this lane** and its desktop median moved
116.7 → 33.3 ms between the two runs. That is a 3.5× swing from host load alone
(loadavg 4.33 at the start of the baseline, 11.1 during the after-run, and the
committed t_x1_01 baseline measured the same scene at 66.7 ms in a third load
band). Any ratio in the tables above therefore carries a host term of the same
order, in *either* direction, and the honest reading is:

- **`hero-atmosphere` is a real, large win.** 4.33× at 1440 and 6.51× at 390, and
  it is exactly the shape the mechanism predicts: the hero canvas is 1440x1328 =
  1.91 M fragments and now computes 0.48 M of them. The prediction was 4×; the
  measurement is 4.33× desktop and better on the phone, where the retina path was
  computing 1.75 CSS px and now computes 0.875.
- **`about-field` at 390 is a real win** (7.37×) for the same reason: at dsf 3 its
  canvas is ~672² rather than 384², so on that path it *is* fill-bound.
- **`about-field` at 1440 misses the 3× at 2.75×, and it was never going to reach
  it from here** — see `03b-about-attribution.md`: at 1440 that canvas is 384x384
  and ~60% of its frame is the page's own composite at `#about`, with the
  fragments a single-digit percentage. The ratio is reported as measured, not
  argued up, and the 390 result (7.37×) is the same change on the same shader
  where the canvas is ~672² and the fragments do dominate.
- **`career-strata` at 1440 (1.33×) is inside the host's own noise band.** Against
  the committed t_x1_01 baseline for the same scene (183.3 ms) the same after-run
  reads 3.67×. Both figures are printed rather than the flattering one being
  chosen; the fragment count fell 4× and the two runs disagree by more than the
  effect.

Nothing here was tuned to the metric: no frame-rate limiter, no `frameloop`
change, no threshold moved, and the only edit is how many pixels three scenes
compute per frame.

## The mechanism, confirmed on the live page

Canvas backing stores read off the running page at 1440x900 dsf1 before and after
(`08-screens/before.log`, `08-screens/after.log`) — the CSS box is unchanged in
every case, which is what "upscaled into the slot" means:

| scene | before | after | fragments |
|---|---|---|---|
| `hero-atmosphere` | 1440x1328 | **720x664** | ×0.25 |
| `about-field` | 384x384 | **192x192** | ×0.25 |
| `career-strata` | 1297x536 | **648x268** | ×0.25 |
| `skills-bench` | 1248x579 | 1248x579 | ×1 (untouched) |

Side-by-side screenshots of all four slots at 1440 are in `08-screens/`
(`<scene>-before.png` / `<scene>-after.png`) and were inspected: the hero's fog,
shafts and pools land in the same places at the same weight; the About ring keeps
its ten sectors, its hairline separations and its numeral groove, and the numerals
themselves are SVG and unchanged; the strata keep their band structure and the
DOM bars over them are untouched. The softening is visible only in the gradient
noise, which is what a half-resolution upscale of a soft field is supposed to look
like.

## Where about-field @1440 came from

The first after-run's `TC-SCENE-FPS-01 about-field` failed as a 20 s timeout
waiting for `[data-scene="about-field"] canvas` (`04-after.log:9`), not as a
measurement — that run was the first to include the `vitrine-field` and
`listen-field` scenes that arrived from `origin/main` mid-lane, at 12 tests on a
box at loadavg 11. The same scene mounted and measured on the phone pass of the
same run. It was re-run alone (`04-after-about-retry.log`) rather than reported
from a failed mount.
