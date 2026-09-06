# W1-A3 — decisions and deviations (G-A3)

Task: `artifacts/kanban/tasks/t_w1_a3.md`. Branch `worktree-w1-a3` off `origin/main@56ffed3`.

## Deviations from the task's literal wording (docs/prompt.md §0.1 — decide, log, continue)

1. **The annulus is written in the rose's frame, not `r ∈ [0.26,0.42]·min(w,h)`.**
   At 1440 the engraving sits in the left column of a 1248x900 plane with its centre
   ~208 px from the canvas's left edge, so a band of 234–378 px runs off the canvas and
   three of the ten sectors could not be sampled at all. `TC-SCENE-ABOUT-10` measures two
   annuli instead — the sector ring under the bezel (`rr ∈ [0.40, 0.96]`, all ten) and the
   fan outside it (`rr ∈ [1.12, ≤1.6]`, every sector that is inside the canvas, at least
   six) — and asserts the same three things on each. The fan is the half that matters: the
   bezel covers the ring, so the light a reader actually sees is the light outside it.
2. **Answered/open is asserted from `about.ts`, not as "sectors 1..k vs k+1..10".**
   The ten are not ordered that way: the three role-side dimensions are 6, 7 and 9. The
   test reads the same mask the shader and the SVG read, which is the same claim against
   the real data and cannot pass by an accident of ordering.
3. **The dial's ink is a variable, not a constant.** `--dial-ink` is `--mist-400` while a
   canvas is mounted and `--white` on `.body:not(:has(canvas))`, so with WebGL refused or
   reduced motion asked for the ten dimensions are still drawn at full contrast by the
   only thing left that can draw them (`10-about-1440-reduced-motion.png`, numeral fill
   measured `rgb(246,246,246)`; with the canvas, `rgb(144,144,144)` — `06-gl-probe.log`).
4. **Numerals went to full opacity when they went to `--mist-400`.** 0.85 of the chrome
   ink measured 3.0:1 over the lit face. The field is recessed under the engraving as
   well (haze x0.40 inside the bezel, the hub dimmed to 0.42, the numeral groove deepened
   to 0.96 and applied to the answered bloom too), which is what an instrument face does
   and what takes every numeral back over 4.5:1.

## Failures that are NOT this change (verified in-session, not asserted)

- `tests/e2e/about.spec.ts` **TC-ABOUT-07** ("complete without WebGL", expects 0 canvases)
  fails on this host with `Received: 1`, and fails identically with this branch's source
  stashed — i.e. on `origin/main`'s own code, rebuilt (`05-baseline-build.log`). The
  capability appeal in `components/gl/useGLCapability.ts` (untouched here: `git diff
  origin/main -- components/gl` is empty) lets SwiftShader through when the host is idle.
  It passes against live production and passed in the serial re-run of the same suite.
- `tests/overhaul/flagship-visibility.spec.ts` **listen beat field motion** fails here at
  0.00064/0.00044 and fails on **live production** at 0.00142 (`05-listen-preexisting-live.log`).
  `#listen` is not touched by this branch. Both need their own board items.
