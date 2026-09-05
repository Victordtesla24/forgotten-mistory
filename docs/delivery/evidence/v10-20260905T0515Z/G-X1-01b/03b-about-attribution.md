# Where the About field's frame actually goes (t_x1_01b, 2026-09-05 ~14:53Z)

The task's premise is that the hero and About shaders "do far more per-pixel work
than the picture needs". For the hero that is true and fill-bound. For
`about-field` it is not, and this is the measurement that says so — recorded
because a child task should not spend another lane cutting octaves out of a
shader that is not the cost.

## The canvases, measured

Backing-store sizes read off the live page at 1440x900 dsf1, `?gl=force`
(`08-screens/before.log`, printed by the same script that took the screenshots):

| scene | canvas backing store | px | baseline median @1440 | ns per pixel |
|---|---|---|---|---|
| `hero-atmosphere` | 1440x1328 | 1.91 M | 433.35 ms | 227 |
| `about-field` | **384x384** | **0.147 M** | 274.95 ms | **1866** |
| `career-strata` | 1297x536 | 0.695 M | 66.70 ms | 96 |
| `skills-bench` | 1248x579 | 0.72 M | 116.70 ms | 162 |

`career-strata` and `about-field` run the *same* shader budget — three value-noise
lookups and one hash — so their per-pixel costs should match. They differ by 19x.
Whatever the About field's frame is spent on, it is not its own fragments: at the
strata's measured 96 ns/px a 384x384 quad is **14 ms**, not 275.

## The attribution probe

`probe-tmp.mjs` (not committed — it is a measurement, not a fixture), 30 rAF
deltas per stage, scrolled to `#about`, host loadavg 12.47 rising to 12.78, so
read the *differences*, not the absolute numbers:

```
about-field A: scene mounted             median 450.1 ms
about-field B: canvas visibility:hidden  median 283.4 ms
about-field C: + nav backdrop-blur off   median 316.6 ms   (noise; no effect)
about-field D: + canvas display:none     median 266.7 ms
```

The renderer is still drawing in B and D — nothing stopped `useFrame`, the WebGL
context is alive and the shader runs every frame. The only thing that changed is
whether the browser has to **composite that canvas into the page**. That single
step is worth ~165 ms of a 450 ms frame here, and with it gone the page under the
About section still serves frames at ~267 ms on its own.

So the About field's cost splits roughly: **~60% the page's own per-frame
composite at `#about`, ~40% the canvas composite, and a single-digit percentage
the fragments themselves.** Rendering those fragments at half resolution — what
this lane does — cannot touch the 60%, and touches the 40% only insofar as the
upload is smaller; the composited *area* on the page is unchanged, because that
is the slot, not the render target.

The nav's `backdrop-filter: blur(16px)` (globals.css:1466) was the obvious suspect
for the page-side cost and stage C rules it out: turning it off changed nothing
outside noise.

## What this means for the acceptance ratio

`hero-atmosphere` is fill-bound (227 ns/px over 1.91 M px) and half resolution is
the right lever: a quarter of the fragments. `career-strata` likewise. For
`about-field`, ≥3x is not reachable by any change to `field.glsl.ts` or to its
render resolution, and a lane that "achieved" it by cutting the scene's frame
*rate* would be moving the metric, not the cost — the harness's median rAF delta
would report the cheap half of a bimodal distribution while the reader still saw
the same stutter.

The honest next step for `#about` is a child task against the page, not the
shader: find what the About section repaints every frame (candidate: the
`.fieldSlot` radial-gradient stack and the `.field` box being re-rasterised
because the canvas over it invalidates them; `will-change`/layer promotion, or
giving the canvas its own compositing layer, are the first things to try) and
measure the same four stages again.
