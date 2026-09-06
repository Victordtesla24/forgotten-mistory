# W1-MV3 — decisions (t_w1_mv3, analyst-programmer ap-w1-mv3, 2026-09-06)

Base: `origin/main` @ `b9f5195e`. Branch `worktree-w1-mv3`. Own export on :5629.

## (1) TC-MV-OCCLUDE-01 — the ink rises, the launcher is untouched

PM decision (b) was taken as written: raise the ink rather than dim the
launcher's hairline. Launcher CSS in `app/globals.css` is byte-identical to
`origin/main` (`git diff origin/main -- app/globals.css` is empty).

Two rules changed, both from `--ink-300` (#7D7D7D) to `--mist-400` (#909090):

| rule | measured before | ground | after |
|---|---|---|---|
| `components/sections/Vitrine/Vitrine.module.css` `.exclusion dd` | 4.05:1 (W1-RED2, scrollY 16036) | rgb(30,30,30) | **5.22:1** |
| `components/sections/Skills/Skills.module.css` `.caveat` | **4.00:1 measured here**, scrollY 14348 | rgb(31,31,31) | **5.16:1** |

**Decision, §0.1 (divergence from the task spec, logged not guessed):** the spec
names the Vitrine `dd` as the failing node. On `b9f5195` it is not — the
launcher's overlap band has moved and the node that actually fails is
`span.Skills_caveat`. It is the same defect with the same numbers: `--ink-300`
clears AA on `--ink-900` (4.81:1) and on nothing brighter than rgb(19,19,19),
and the launcher's own hairline (`--card-border`, rgb(255 255 255 / 0.09) over
`--ink-900`) paints rgb(30–31). So the PM's remedy was applied to both — the
node the spec names, which would fail again the moment the band moves back, and
the node that fails today. Both are still clearly secondary to `--mist-200` body
ink (12.5:1 vs 6.20:1 on the page ground).

Not fixed, reported: **TC-MV-OCCLUDE-02** is red on `b9f5195` — "the brightest
ground the closed launcher paints at 390 is rgb(182,182,182) (relative luminance
0.4678); the ceiling is 0.0968". That is the launcher's *own* surface. This task
forbids touching launcher CSS, and W1-RED2 reproduced only OCCLUDE-01 on
`b02a8863` ("One overlap fails"), so it regressed between `b02a8863` and
`b9f5195` in another lane. Filed with numbers rather than edited blind.

## (2) MONO-MV-02 — root cause: TEST (the instrument, not the gate)

**Decision, §0.1 (the PM COMMENT's premise does not hold on this build).** The
COMMENT of 2026-09-06T03:16:05Z says the observer's 0.35 threshold "can never
approach 0.35" at 390 and that the label reads unpainted after twelve steps.
Measured here (`01-reproduction.log`):

- `#hero` at 390 is **1607.11 px** tall against an 844 px viewport — 1.90
  viewports, not "far taller". At scrollY 0 the ratio is **0.525**, comfortably
  above 0.35, so the gate holds over the fold exactly as intended.
- The dock is painted at the loop's **first** read (scrollY 1266, opacity
  **0.992969**, `data-past-hero="true"`), and every label assertion passes.
- The failure is the **later** assertion, at scrollY 0, and it fails at **both**
  widths, not 390 only: opacity **0.115637** (390) and **0.0791977** (640)
  against `< 0.05`.
- Sampled by rAF after `scrollTo(0, 0)`: op 1 → 0.079 → **0** by ~300 ms at 390;
  1 → 0.031 → **0** at 640. The dock's computed transition is
  `opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)`, and it cannot start until the
  IntersectionObserver re-reports `#hero` and React re-renders. Observer latency
  plus 300 ms ≈ the spec's own fixed 400 ms wait, so the single sample sat on
  the boundary of a still-falling curve.

The product reaches unpainted over the fold at both widths. The instrument was
sampling the withdrawal. Fixed on the test side, and **no threshold moved**:

1. the 0.05 ceiling is unchanged and still asserted on the settled reading;
2. a new assertion is added — the withdrawal must *complete* within a stated
   1000 ms budget (3.3× the transition), so "it eventually fades" is now proven
   rather than assumed;
3. the fade-**in** loop was hardened the same way, waiting on the paint rather
   than on a 400 ms clock. That half flaked once at 640 in the combined run
   (`label opacity 0`) for the identical reason, under load behind
   `tests/a11y/minivic-occlusion.spec.ts` — the exact symptom W1-RED2 recorded
   on `b02a8863` and attributed to the observer threshold.

G-MV1 holds: nothing hides the pill, `display: inline-block` untouched, the
label reads "Ask Mini Vic" at 390 and 640 at AA. G-E2 holds: `07-first-fold-390.png`
shows the fold with no launcher on the portrait or the two actions.

## Visual baselines

Re-accepted **one**, `tests/baselines/visual/screenshots.spec.ts-snapshots/vitrine-section-chromium-linux.png`
(VIS-05), because `.exclusion dd` is inside that frame and its ink changed by
design. `05-vitrine-foot-390.png` is the eyes-on check.

VIS-01 (hero), VIS-02 (about), VIS-04 (listen) and VIS-06 (viewport-top) are also
red on this export. None of them contains `.exclusion dd` or `.caveat`, so they
cannot be caused by this change; they are pre-existing and were left alone rather
than re-accepted, which would have buried another lane's diff under this commit.
