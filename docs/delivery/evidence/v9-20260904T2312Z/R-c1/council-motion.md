# Council — Motion / Visualisation review, cycle c1

Site: https://forgotten-mistory.web.app (commit 6dcb4f53) · run v9-20260904T2312Z · reviewer: creative motion / visualisation architect · cap 9 min (honoured; findings written before refinement).

Evidence in this directory: `motion-observe.cjs` + `motion-observe.json` (default Chrome, 1440x900, reduced-motion pass, 390px mobile pass), `motion-force.cjs` (same page with `?gl=force`), screenshots `hero-*.png`, `<section>-{0,1,2}.png` (400 ms apart), `about-hover-item4.png`, `experience-hover-track3.png`, `skills-hover-source1.png`, `vitrine-scrolled.png`, `minivic-open.png`, `hero-reduced-motion.png`, `hero-390.png`, `force-hero-{left,right}.png`, `force-experience.png`.

Verdict: **FAIL** against the Owner's bar ("each of six sections owns ONE cinematic signature visual"). Three of six sections have a signature visual that narrates the argument (About, Skills, Vitrine). Hero's shader is cinematic but arrives late and washes the copy; Experience's shader is decorative by its own admission; Listen has none. Zero console errors and zero page errors in both passes (Verified: `motion-observe.json` `console: []`, `pageErrors: []`; force pass `errs: []`).

## Failures first

| id | sev | section | finding | tag |
|----|-----|---------|---------|-----|
| M-01 | major | #hero | Under real GL (`?gl=force`) the atmosphere fades up **after** the type has already risen and lifts the whole frame from mean luma ~30 to a visibly brighter mist that sits directly behind the body paragraph; `force-hero-right.png` shows "Sixteen years leading delivery…" as grey-on-grey. `force-hero-left.png` (1.2 s earlier) shows no atmosphere at all — the mean-abs pixel diff between the two frames is 38.0/255, which is the entrance ramp (`uIntensity += delta*0.65`, ~1.5 s), not pointer parallax. Canvas query at networkidle+2.5 s returned `[]` in the force pass, so the stage mounts lazily and the backdrop pops in ~3–4 s after LCP. A cinematic backdrop must be present under the first painted frame or fade in under a copy-protection gradient. | Verified |
| M-02 | major | #experience | The strata shader (`strata.glsl.ts`) is, per its own header, "sediment, not data … it encodes nothing". The section's argument — "every bar to its real duration on one axis" — is carried entirely by the DOM chart; the WebGL layer decorates. Default-GL pass: hovering track 3 changed nothing measurable on the bar (`barTransform: none`, `barTransition: all`, only label colour brightens — `experience-hover-track3.png`). No signature visual narrates duration. | Verified |
| M-03 | major | #listen | No signature visual (`listen: canvas:false, svg:false`). Only motion is a 262 px hairline `ruleDraw` (720 ms). The section is "the instrument set down" by design; the Owner's bar still asks for one restrained beat. Specified below. | Verified |
| M-04 | minor | #hero | Default-GL (software-raster) pass: pointer sweep from x=100 to x=1340 produced a 0.012/255 mean pixel diff — i.e. no parallax at all on the static path. That is correct by design (`useGLCapability` rejects SwiftShader), but it means every no-GL reader sees a flat `#0f0f0f` gradient with no depth cue whatsoever. A CSS-only depth cue is required so the fallback is a quieter version of the same idea, not a different page. | Verified |
| M-05 | minor | #vitrine | Rail scrolled 700 → landed at 600 (`scroll-snap-type: x mandatory`), plate 3 `data-lit=true`. The raking light works. But the six mechanism drawings are static hairlines — no draw-on when a plate becomes the lit one. The drawings are the section's story ("what it does, not what it looks like"); they should be traced as the plate is lit. | Verified |
| M-06 | polish | #about | Compass rotates −108° on hovering item 4, `transform 0.72s cubic-bezier(0.16,1,0.3,1)`, readout "04 / ANSWERED" (Verified: `motion-observe.json.compass`). Correct and legible. But `about-0..2.png` (no hover) show the face idle at 0° with "— / NO SCORES" — the instrument never demonstrates itself to a reader who only scrolls. Needs a scroll-driven index (IntersectionObserver on each `<li>`) so the bezel turns as the reader reads, hover overriding. | Verified |
| M-07 | polish | #skills | Bench trace already settled by the time I reached it (`animationName: none` on the first three wires; `settled` flag removes the animation — correct by design). 20 wires, 17 in the production/gold class. Hover on source 1 dims the rest to ~0.15 (`skills-hover-source1.png`) — good. No fault; guard it with a test that the trace animation is present on first paint of the section only. | Verified |
| M-08 | minor | mobile | 390 px pass mounted no canvas (`mobile: []`) — expected on this software host; cannot verify the `uQuality=0` branch's frame cost here. Inferred from source: near-layer and shafts drop below 900 px, four-octave fbm x2 + stars remain (≈9 noise lookups/px at DPR cap). Acceptable budget; unverified on device. | Inferred |

## Per-section direction

### #hero — "the front door"  (signature: atmosphere shader; keep, re-time, protect copy)
- **Change the entrance ordering.** Mount the GL stage eagerly for the hero only (not behind the IntersectionObserver idle path) and gate the type's `heroRise` on `uIntensity ≥ 0.35` via a `data-atmosphere="ready"` attribute on `#hero`, so the mist is *under* the words, never behind them. Reduced-motion: keep `heroFade 320ms linear` as now.
- **Entrance ramp:** `uIntensity` 0→1 over **1160 ms** (`--motion-cine-long`) with CPU-side easing `cubic-bezier(0.16,1,0.3,1)` instead of the linear `delta*0.65`.
- **Copy protection:** add a fixed radial scrim in the shader — `luma *= 1.0 - 0.42 * smoothstep(0.55, 0.0, length((uv - vec2(0.33,0.52)) * vec2(1.6,1.0)))` — a soft dark pocket where the paragraph and figures sit (left 60 %, y 0.35–0.75). Target: body copy contrast ≥ 4.5:1 sampled against the rendered canvas (WCAG AA).
- **Parallax magnitude:** keep `uPointer * 0.055`; raise near-layer factor 1.15 → 1.35 and far 0.18 → 0.12 so the depth ratio reads 11:1. Pointer lerp `delta*1.6` → `delta*2.2` (≈450 ms settle) so the drift answers the hand within the interface band.
- **Gold:** none in the scene. Gold stays on the three caliper marks only. (Verified: hero shows `self-reported` marks, no gold — correct.)
- **No-GL fallback (M-04):** two stacked CSS layers on `.stage`: a static `radial-gradient(120% 90% at 22% 30%, rgb(255 255 255 / 0.07), transparent 60%)` key and a 2 % SVG grain data-URI; on pointer move (JS, ≤ 4 lines) translate the key by `pointer * 6px` with `transition: transform 450ms cubic-bezier(0.22,1,0.36,1)`; disabled under reduced-motion.
- **Guard:** Playwright — with `?gl=force`: assert `#hero canvas` exists ≤ 1500 ms after `domcontentloaded`; take two screenshots at pointer x=100 and x=1340 after 1500 ms settle, assert mean-abs diff of the left 700 px column is > 2/255 (parallax) **and** that a 400x120 crop over the paragraph has mean luma < 48 (scrim). Without force: assert no canvas and `heroRise` animation-name present.

### #about — "Ten dimensions, answered"  (signature: Compass; keep, add scroll-drive)
- Add `IntersectionObserver` (rootMargin `-45% 0px -45% 0px`) on each `<li>`; the centred item sets `active` unless a hover is live. Rotation transition stays `720ms cubic-bezier(0.16,1,0.3,1)`; numerals counter-rotate (already).
- Add one cinematic beat on first entry: bezel does a full **−360° sweep over 1160 ms** `cubic-bezier(0.16,1,0.3,1)` and settles on 01 (`data-swept` once). Reduced-motion: no sweep, index snaps (current CSS already `transition: none`).
- Gold: index caret only (already). Do not gold the active sector.
- Guard: scroll so item 6 is centred, wait 800 ms, assert `g[class*=rose]` style `rotate(-180deg)` and readout `06`/`FROM THE ROLE`; under reduced-motion assert computed `transition-duration: 0s`.

### #experience — "Sixteen years, to scale"  (signature must become the chart itself)
- **Retire the strata shader as the signature** (keep as backdrop only at `uIntensity*0.85 → 0.55`). The signature visual is the axis: on section entry, the bars **grow from their start-year to their end-year** left→right, `scaleX` via `transform-origin: left`, duration per bar = `clamp(600, years*140, 1200) ms`, `cubic-bezier(0.16,1,0.3,1)`, stagger 60 ms by CV order (top to bottom). A 1 px **gold** playhead traverses the axis once over 1200 ms ahead of the bars — gold is justified because the dates are sourced from the CV (state the source in the caption; if the Owner rules CV dates `self-reported`, the playhead is white).
- Hover: bar `scaleY(1.6)` 200 ms `cubic-bezier(0.22,1,0.36,1)`, duration label brightens to `--white`, the year gridline under the pointer lights to 0.35 opacity. Currently only the label changes (M-02).
- Reduced-motion / no-GL: bars render at final width, playhead omitted (already the DOM path is complete).
- Guard: assert `#experience ol li:nth-child(3) [class*=bar]` computed `transform` ≠ `none` within 200 ms of scroll-into-view and equals `matrix(1,…)` after 1400 ms; hover assert `scaleY` component ≈ 1.6.

### #skills — "Calibration card"  (signature: Bench wires; keep)
- Working as designed: HTML rails, SVG wires, trace once (`--motion-cine` 900 ms, emphasised ease, per-wire `--delay`), gold only on production evidence. One direction: on hover of a **capability**, the connected wire's stroke should breathe to 1.5 px over 200 ms (the current dim-others is enough for sources but the capability side reads flat in `skills-hover-source1.png`).
- Guard: on first scroll-into-view assert at least one `path` has `animation-name: trace` (before `settled`), and after 1600 ms all have `animation-name: none`; count gold-class wires equals the data's `production` link count (17 today).

### #vitrine — "Six of thirty-eight"  (signature: raking light + mechanism drawings; add draw-on)
- When a plate gains `data-lit`, trace its drawing: `stroke-dasharray/dashoffset` on every `path/line/circle` with `pathLength=1`, duration **900 ms**, `cubic-bezier(0.16,1,0.3,1)`, stagger 40 ms per element, labels fade in over 320 ms after the strokes. Play once per plate (`data-drawn`). Reduced-motion: no dash animation (strokes present).
- Rail: keep `x mandatory` snap; add `scroll-behavior: smooth` off under reduced-motion (already). Gold: repository URL only.
- Guard: scroll rail by 700, assert `li[data-lit=true]` index 2 and, within 1200 ms, its drawing's first `path` has `stroke-dashoffset: 0`.

### #listen — "Feedback & coffee?"  (no signature today; one restrained beat belongs here)
- **Decision: yes, one beat, and it must be silent.** The caliper closes. An SVG caliper (the site's one learned mark) 320 px wide, hairline, jaws open at 100 % on entry; over **1160 ms** `cubic-bezier(0.16,1,0.3,1)` the jaws close to the width of the sentence's first word and the reading "—" stays "—" (no figure, no gold: the section makes no claim). Then the existing `ruleDraw` hairline (720 ms) fires as the last stroke. Reduced-motion: caliper drawn closed, rule drawn.
- This narrates the section: the instrument that measured everything above is set down, still honest, with nothing to measure.
- Guard: on scroll-into-view assert `#listen svg[data-caliper]` exists, computed `animation-duration: 1.16s` on the jaw group; under reduced-motion assert `0s` and jaws at closed geometry.

## Cross-cutting

- Motion bands respected everywhere observed: interface 200/320/440 ms, cinematic 720/900/1160 ms (Verified: `app/globals.css` tokens; About 0.72 s measured live).
- Gold usage: Verified gold only on bench production wires and the compass index; hero figures are `self-reported` (no gold). No violations seen.
- Zero console/page errors in both passes (Verified).
- LCP/CLS not measured in this brief (out of scope for the motion role); the M-01 late fade-up is a perceived pop, not layout shift.

## Screenshot index

hero-0/1/2, about-0/1/2, experience-0/1/2, skills-0/1/2, vitrine-0/1/2, listen-0/1/2 — 400 ms apart, default-GL path. force-hero-left/right, force-experience — `?gl=force`. hero-reduced-motion, hero-390.
