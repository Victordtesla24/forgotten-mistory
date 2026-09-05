# G-X1-01b — what changed, per scene (t_x1_01b, R2)

One change, applied to three of the four measured scenes: **the fragments are
computed at half the display's own resolution and the browser upscales the result
into the slot.** No shader source was edited, no threshold was moved, no
dependency was added, and the fourth scene (`skills-bench`) was left alone.

## Why resolution, and not the shaders

Every one of these scenes is a single full-screen fragment program — one quad, no
geometry, no textures — so a frame costs very close to the number of pixels it is
asked to fill times the arithmetic per pixel. The canvases were measured on the
live page rather than assumed (`08-screens/before.log`), against this lane's own
baseline (`02-baseline/`, host loadavg 4.33 → 14.18):

| scene | lookups per pixel | canvas | px | median @1440 | ns/px |
|---|---|---|---|---|---|
| `hero-atmosphere` | 11 noise + 2 hash | 1440x1328 | 1.91 M | 433.35 ms | 227 |
| `about-field` | 3 noise + 1 hash | 384x384 | 0.147 M | 274.95 ms | **1866** |
| `career-strata` | 3 noise + 1 hash | 1297x536 | 0.695 M | 66.70 ms | 96 |
| `skills-bench` | 3 noise + 1 hash + 2 `pow(·,60)` | 1248x579 | 0.72 M | 116.70 ms | 162 |

Three of the four line up as fill: the hero costs 2.4× the strata per pixel and
does roughly 3.6× its arithmetic; the bench costs 1.7× and carries two `pow(·,60)`
the strata does not. Those three are fill-bound, and the cheapest frame is the one
with fewer pixels in it.

`about-field` is the exception and it is not a small one — 19× the strata's
per-pixel cost on the *same* shader budget. At the strata's rate a 384x384 quad is
14 ms, not 275. An attribution probe (`03b-about-attribution.md`) locates the rest
of it: ~60% of that frame is the page's own per-frame composite at `#about` and
~40% is compositing the canvas into it, with the fragments a single-digit
percentage. **Half resolution therefore cannot deliver 3× for `about-field`, and
nothing in `field.glsl.ts` can either.** It is carried here at the ratio it
actually achieves, with the real cost named for a child task, rather than reported
against a lever that does not reach it.

Cutting octaves and taps was the second lever in the task's own order of least
risk (levers 2–4). It was not needed where the ratio was reached — the hero clears
3× on resolution alone, at 4.33× — and it could not have reached the one place the
ratio was missed, because `about-field` at 1440 is not spending its frame on
fragments at all. It is also not free: `atmosphere.glsl.ts` is the source the hero
poster is rendered from
(`scripts/assets/render-hero-poster.mjs`, TC-HERO-FIRSTPAINT-01), so every edit to
it puts a new binary in the repo and a new first paint in front of the reader.
Lever 1 alone buys a factor of four in fragments and leaves both the shader source
and the poster byte-identical. If a later lane needs more headroom, the octave
cuts are still there to take.

## The mechanism

`components/gl/GLCanvas.tsx` grew a `resolutionScale` prop (default `1` — every
scene keeps its full-resolution frame unless it asks for less), threaded through
`components/gl/Scene.tsx`. It is applied as:

```
full  = min(devicePixelRatio, 1.75)          // the retina ceiling, unchanged
dpr   = scale >= 1 ? full : max(0.5, full * scale)
```

The 1.75 ceiling is **not raised** (CLAUDE.md: DPR is capped for mobile frame
rate). The 0.5 floor is new and is a quality floor, not a performance one: every
one of these shaders dithers with a per-pixel hash, and below half a CSS pixel
that grain stops being grain and starts being blocks.

At the harness's two viewports that means:

| scene | 1440x900 dsf1: before → after | 390x844 dsf3: before → after |
|---|---|---|
| `hero-atmosphere` | dpr 1 → 0.5 (¼ the fragments) | dpr 1.75 → 0.875 (¼) |
| `about-field` | dpr 1 → 0.5 (¼) | dpr 1.75 → 0.875 (¼) |
| `career-strata` | dpr 1 → 0.5 (¼) | dpr 1.75 → 0.875 (¼) |
| `skills-bench` | dpr 1 → **unchanged** | dpr 1.75 → **unchanged** |

## Per scene

### `hero-atmosphere` — `components/sections/Hero/Hero.tsx`, `resolutionScale={0.5}`

The most expensive frame on the site. What it draws is fog, two Gaussian shafts
about a raked axis, two pools and a quadratic key — every one of them a smooth
falloff with no edge in it, and the whole frame sits under `.stage::after`, the
scrim that protects the reading column. There is no line in this picture for an
upscale to soften. The one term resolution touches at all is the 1.8% grain
dither, which is why the floor exists.

`atmosphere.glsl.ts` is untouched, so `public/assets/hero-atmosphere-poster.avif`
is still a faithful frame of this shader and is not re-rendered.

### `about-field` — `components/sections/About/About.tsx`, `resolutionScale={0.5}`

An annulus of light with `smoothstep`ed radial and angular edges, a numeral
groove and a travelling gleam. The compass engraving over it — the part a reader
actually reads — is inline SVG in the DOM and is not rendered by this canvas at
all, so it stays pixel-sharp at any scene resolution.

### `career-strata` — `components/sections/Experience/Experience.tsx`, `resolutionScale={0.5}`

Three slow horizontal smears and eight span lifts, the narrowest of which
(`ROW_HALF = 0.026`, about three bars) is ~13 px in a ~500 px canvas — still 6 px
at half resolution, and it is a `smoothstep` falloff rather than a line. The bars
and the axis above it are DOM.

### `skills-bench` — unchanged

Deliberately excluded. Its graticule is `pow(0.5 + 0.5*cos(px * TAU / 64), 60)` in
**device pixels** — a hairline ruled to a 64 px pitch, which is exactly the figure
a half-resolution upscale destroys, and at 66.7 ms it is the one scene that was
not driving the failure. The gate for it is "not worse", and the way to hold that
is to not touch it.

## What was considered and rejected

- **A ratio-guard assertion in the harness.** The task allows one; it is not
  added. The host is a shared 4-core box whose load moved between 4.5 and 11
  during this lane alone, and a gate asserting `median ≤ committed_baseline / 3`
  on a rasteriser that quantises every delta to a multiple of 16.66 ms would be a
  flaky gate — it would fail on a busy afternoon for reasons that have nothing to
  do with the shader. The measurement of record stays the harness's own fixed
  16.7 / 20.0 budgets (unchanged, and still red — see 04), with the before/after
  JSON pairs in this directory carrying the ratio. Decision logged rather than
  silently skipped.
- **Raising the 1.75 retina ceiling** — never; it is a mobile frame-rate cap.
- **Lowering the floor below 0.5** — the grain becomes blocks.
