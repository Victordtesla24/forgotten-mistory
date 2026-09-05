# C21 — the hero photograph: full size, full colour, loop on intent

Task `t_heroph001`, run v10-20260905T0515Z, worktree `wf_31b6f314-9ff-1`, branch
`worktree-wf_31b6f314-9ff-1`.

Owner instruction, 2026-09-05 09:10Z, verbatim: *"Integrate my Photo with full size,
colours and dimension with creative decorations that match the website UI/UX Design.
Include a hover effect that plays the hero video avatar and not by default."* It takes
precedence over CLAUDE.md's grayscale treatment **for this element only**.

## Which loop the hover plays, and why

`public/assets/my-avatar.mp4` — 1280×720, 24 fps, 12.29 s, 1 096 301 B (ffprobe, logged in
`01-baseline.log`). Not `my-hero-avatar.mp4` (640×360, 5.88 s, 160 156 B).

Frame 0 of each loop was extracted with `ffmpeg -frames:v 1` and read beside the still.
The three assets are **one composition at three resolutions** — the bin sits at ~12 % of
frame width in all three, the dark tower spans ~23–39 %, the face is ~15.6 % of frame
width, aspect 1.792 / 1.778 / 1.778. So the 1280×720 loop costs nothing in framing
continuity and doubles the pixels: the figure is 518 px wide at 1440 (up to 1036 device px
at DPR 2), where a 640-wide source would be a 1.6× upscale visibly softer than the still it
fades over.

The 500 kB budget is a **critical-path** budget, and this file is not on the critical path:
`preload="none"`, no `src` attribute in the served HTML, and the source is assigned in a
`useEffect` that only runs once the reader hovers, focuses or presses. TC-HERO-19 measures
exactly that — image bytes transferred before `loadEventEnd` ≤ 500 kB, and the loop's
`requestStart` strictly after `loadEventEnd`. Measured this run: it passes.

## Grade on the photograph

`filter: saturate(1.02) contrast(1.03)` on `.portraitMedia`. A point of saturation and
three of contrast, no more: the frame is a golden-hour exposure and the page is near-black,
so the photograph needed separation from the ground, not correction. No grayscale, no hue
rotation, no tint. TC-PHOTO-03 asserts both halves — no `grayscale` anywhere in the img's
ancestor filter chain, and mean pixel saturation of the decoded still > 0.15 (measured:
well clear).

## Sizes measured, not assumed (08-screens, printed by the screenshot run)

| viewport | figure box | share of viewport |
|---|---|---|
| 1440×900 | 518.39 × 321.81 at x=825.6 | **36.0 %** (owner floor 34 %, and ≥ 440 px) |
| 1280×720 | 460.80 × 289.67 | 36.0 % |
| 834×1112 | 300.23 × 199.98, right column | 36.0 % |
| 390×844 | **390 × 248.75 at x=0, y=839** | 100 % — full bleed, below the actions |

## Decorations (all achromatic, all from tokens)

- Drafting rule inset 12 px, 1 px `var(--card-border)`.
- Four caliper corner ticks, 15 px Ls in `var(--white)` at 0.7 opacity, `data-corner`
  tl/tr/br/bl — the same jaw language the caliper mark uses on a figure.
- Registration cross, two hairlines, top right inside the rule, 0.6 opacity.
- Caption plate below the frame: `var(--font-mono)`, `var(--fs-micro)`,
  `var(--ls-caption)`, `var(--mist-400)`, with a ruled leader line. Its words come from
  `app/data/portfolio/avatar.ts` → `caption` = "Photograph · Melbourne" (same city as
  `hero.ts` → `location`). The component holds no strings.
- Bloom: `.portraitGlow`, two radial gradients in `rgb(246 246 246 / 0.12)` and `/ 0.09`
  (the `--white` value at low alpha, the way `.locationDot` already draws its halo),
  spilling past the frame and under the plate so the photograph sits in light. Implemented
  as a gradient layer rather than a HeroAtmosphere uniform: the WebGL scene is declined
  entirely on a software renderer and on `prefers-reduced-motion`, and the light behind the
  photograph must not depend on a canvas that is allowed not to exist.
- **No gold** anywhere in or near the figure. TC-PHOTO-10 sweeps every computed colour
  property inside the figure with an empty allow-list, and also greps every
  `background-image` for the gold values.

## Playback contract

At rest the `<video>` has no `src`, no `autoplay`, `preload="none"`, and is paused —
TC-PHOTO-04 proves it after 3 s and with a network listener. `pointerenter` and a
`:focus-visible` focus inside the figure assign the source and play muted; the layer fades
in over 320 ms on `cubic-bezier(0.16, 1, 0.3, 1)`. `pointerleave` / blur pauses and fades
out. The button (`aria-pressed` = the reader's intent) overrides the pointer, so a touch
reader — who has no hover — has a visible affordance, and a keyboard reader can stop it.
A hidden tab pauses. While the MiniVic panel speaks, the loop rests: one face does not talk
in two places.

Under `prefers-reduced-motion: reduce` hover and focus are refused outright (`motionAllowed()`
returns false), the fade is removed, and only a press starts anything — TC-PHOTO-07 hovers
under reduced motion and asserts no source, no request, no running animation, button still
present.

## Tests re-pointed, and why (nothing weakened silently)

All in `tests/e2e/hero.spec.ts`, each with the reason on the test:

| test | was | now | reason |
|---|---|---|---|
| TC-HERO-13 | the gate assigns the src and plays after load+idle+intersection | still silent after that window; a hover assigns it | the owner forbids playing by default |
| TC-HERO-14 | reduced motion has **no button** | reduced motion **keeps** the button, `aria-pressed=false` | a reader's own press is allowed; on touch it is the only affordance |
| TC-HERO-15 | waits for the gate's playback | hovers first, then measures | same assertion, new trigger |
| TC-HERO-16 | aborts the loop and waits | aborts, hovers, then waits | the failure can only be provoked on intent |
| TC-HERO-17 | at rest the label is "Pause the portrait" | at rest "Play the portrait"; keyboard focus arms it; Enter pauses, Space plays | `aria-pressed` now mirrors intent, which at rest is false |
| TC-HERO-18 | `filter` contains `grayscale(1)` | `filter` contains **no** grayscale; the chrome sweep with an empty allow-list is unchanged | the owner instruction; the exemption is the photograph's pixels, nothing else |
| TC-HERO-19 | "requested by the gate" | "requested by the hover"; the ≤ 500 kB pre-load budget is unchanged | same budget, new trigger |
| TC-HERO-21 | an 88 px stamp beside the eyebrow, no `<video>` below 720 px | full-bleed photograph below the actions, `<video>` present but sourceless, no horizontal overflow | "full size" is not 88 px. The P1 stamp recommendation (B-research §4) is superseded by the owner instruction. TC-HERO-12 and TC-PHOTO-08 both still hold the fold at 390 |

`tests/monochrome/*` needed **no** change: those specs read computed CSS colour properties,
never pixels, so a colour photograph is invisible to them and no exclusion was added
anywhere. `tests/a11y/text-contrast.spec.ts`, `tests/perf/performance.spec.ts` and
`tests/overhaul/cinematic.spec.ts` are unmodified and green.

## The one red gate, measured to its source: PERF-03 is a pre-existing footer shift

`05-battery.log` ends `1 failed / 69 passed` — PERF-03 (page CLS at 390×844) reporting
0.2561. It is **not** this change, and here is the proof rather than the assertion:

1. Alone, against this same build and server, PERF-03 passes: `CLS: 0.0002`.
2. Reproduced deterministically with `Emulation.setCPUThrottlingRate: 8` and shift-source
   attribution (probe scrolls exactly as PERF-03 does), the total is 0.2561 in two parts:

   ```
   0.2559  footer.Footer_footer__TWDx3  prev={y:24,w:390,h:215.77} cur={0,0,0,0}
   0.0002  div.Hero_portraitMedia__gBrPy prev={y:806.97,h:37.03}  cur={y:803.47,h:40.53}
   ```

   The footer collapses to zero height late in the scroll; the photograph's own
   contribution is 0.0002.
3. The **same 0.2559 footer entry reproduces on the live production site**
   (`https://forgotten-mistory.web.app/`, i.e. `main` without this change) under the same
   throttle. It is pre-existing and belongs to the footer, not the hero.

PERF-03 is not this task's gate to move, so it is left exactly as it was and reported red
here with its attribution. TC-HERO-15 and TC-PHOTO-11 showed the same load-dependent page
shift; both were re-pointed to attribute the shift instead of summing it (the crossfade's
own contribution is what they own, and it is nil — logged as `Crossfade shifts: []` /
`Hover shifts: []` in the battery), while the page-wide budget stays with PERF-03.

## Tools used

Bash (`ls`, `grep`, `sed`, `head`, `curl`, `fuser`), `ffprobe` / `ffmpeg` (asset
measurement, frame extraction, screenshot compression), Read (source files and the
extracted frames — the framing comparison was made by eye on real frames, not assumed),
Write / Edit, `npx tsc --noEmit`, `npm run lint`, `npm run build:static`,
`node scripts/validate/overhaul_static_audit.mjs`, `npx playwright test`, `python3 -m
http.server` on port 5601 (own port; 5599/8080 foreign, 5602/5603 siblings'), and two
throwaway Playwright probes (CLS attribution, screenshots) run from the worktree root and
deleted afterwards.

No generation of any kind: Higgsfield credits are 0 and every asset used is one that was
already in `public/assets`.
