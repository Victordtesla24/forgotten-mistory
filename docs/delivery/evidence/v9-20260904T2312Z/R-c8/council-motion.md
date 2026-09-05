# Council — Motion / Visualisation Architect (R-c8, run v9-20260904T2312Z)

Target: https://forgotten-mistory.web.app/?gl=force at 1440x900, Chrome via repo Playwright (`motion-probe.js`, output `motion-probe.json`, 26 PNGs in this directory).
Caveat (Verified): local HEAD is `4f1d659`, not the `9321998b` the brief names (`git log -1`). The live bundle's commit was not verified in this session.

## Verdict: FAIL (Owner's bar not met on two sections; nothing broken)

Failures first, then per-section direction. Tags: Verified = observed here (artifact cited) · Inferred · Assumed.

### Session facts (Verified)
- `networkidle` reached in 1728 ms; 0 console errors/warnings, 0 page errors across the full scroll, hovers, rail scroll and MiniVic open (`motion-probe.json` → `errs:0, pageErrs:[]`).
- Canvas inventory at load: exactly one `<canvas>` (hero, 1440x955, WebGL context true). Experience's `CareerStrata` canvas is lazily mounted by `Scene` (`show = supported && allowMotion && near && pageSettled`, `components/gl/Scene.tsx:91`) — in `experience-hover.png` the faint horizontal strata are visible behind the chart, so it does mount on approach.
- Section visual inventory: hero 1 svg/13 animated els; about 1 svg/44; experience 0 svg/24; skills 1 svg/54; vitrine 6 svg/15; listen 1 svg/4.
- No-WebGL + reduced-motion + 390 px: hero fully readable, three caliper figures present, `canvases:0`, `fallbackEls:0` (`mobile-rm-nogl-hero.png`).
- MiniVic launcher present, `data-testid="minivic-toggle"`, bottom-right (box printed in `motion-probe.json`), click opened it (`minivic-open.png`). Panel copy not assessed in this brief.

---

## F-1 · #experience — the WebGL signature is decoration by its own admission — MAJOR
Verified: `strata.glsl.ts` header: "This shader draws what is behind it ... It encodes nothing, and is written not to look as though it does." `experience-hover.png`: the strata are barely-visible grey hairlines; the DOM bars are static grey; no gold anywhere though every bar's dates are CV-sourced (`Caliper state="self-reported"` at `Experience.tsx:176`). The Owner's bar says the visual must narrate the section's argument ("Sixteen years, to scale"). The current one does not.

Direction (exact):
1. Keep `CareerStrata` as the field but bind it to the data: pass a `uSpans` uniform (`vec4[8]`: left, width, depthRow, 0 in 0..1 chart space) and a `uProgress` (0..1). In the fragment program, add a sediment "cut" per row: `float row = smoothstep(0.0, 0.006, abs(uv.y - spanY))`; brighten the band under each span by `+0.10 * step(spanLeft, uv.x) * step(uv.x, spanLeft + spanWidth * uProgress)`. The field then literally shows the same eight spans as sediment layers the DOM chart sits on — one drawing, not two competing ones (the objection in the shader header is answered by driving it from the same percentages).
2. Entry beat (DOM, works with no GL): bars mount at `transform: scaleX(0); transform-origin: left` and grow to `scaleX(1)` when the chart enters 35% of viewport, `transition: transform var(--motion-cine) var(--motion-ease-emphasized)` = 900 ms `cubic-bezier(0.16, 1, 0.3, 1)`, stagger 60 ms per row top→bottom (8 rows → last row starts at 420 ms, all settled by 1320 ms). Reduced motion: keep the existing `experienceFade` 320 ms opacity ramp, no scaleX.
3. Gold playhead: a 1 px vertical rule at "today" (right chart edge) in `var(--gold)` with a 4 px gold tick above the axis. This is a checkable source (CV dates → today), so gold is licensed. Nothing else in the section goes gold.
4. Hover: existing `scaleY(1.5455)` over `--motion-fast` 200 ms is right; add the strata reacting: `uHover` uniform = row index, brighten that row's sediment band by +0.06 over the same 200 ms (lerp on CPU like the pointer).
5. Mobile budget: shader stays one quad, 3 noise lookups/pixel; the added per-row loop is 8 iterations of arithmetic only. Keep DPR cap.
Playwright guard: `tests/overhaul/experience-signature.spec.ts` — (a) scroll `#experience` into view, assert every `.trackBar` computed `transform` reaches `matrix(1,0,0,1,0,0)` within 1500 ms and that at t=100 ms the first bar's scaleX < 0.5 (proves the grow); (b) assert exactly one element in `#experience` with computed color/background `rgb(201, 168, 76)` (the playhead); (c) under `reducedMotion:'reduce'` assert no bar ever has scaleX < 1.

## F-2 · #about — compass at rest shows "— / NO SCORES"; no first-entry sweep — MAJOR
Verified: `Compass.tsx:220-223` renders `'—'` and `'NO SCORES'` when `active < 0`; hover/focus is the only driver (`About.tsx:93-94`). `about-hover.png` shows the instrument doing exactly what it should on hover — sector 03 rotated under the caret over `--motion-cine-in` 720 ms emphasized. A reader who scrolls without hovering sees an instrument reporting "no scores" for the whole section — the visual contradicts the heading "Ten dimensions, answered".

Direction: on first intersection (≥ 40% of the SVG visible, once), run a sweep: `active` steps 0→9 at 110 ms per step (1100 ms total, inside the cinematic band), rose rotation transition shortened to `--motion-base` 320 ms `--motion-ease-standard` during the sweep, then settle on index 0 ("Technical Skills") and restore the 720 ms transition. Rest state after sweep = index 0, never `-1`; the `'—'`/`NO SCORES` state becomes hover-out-only if kept at all (recommend dropping it: rest on last-hovered). Reduced motion: set `active=0` immediately, no sweep. Keyboard: arrow keys move `active` between the ten `<li>` (tabindex roving), Enter scrolls to the item. Gold: none (correct as-is — nothing here is sourced).
Playwright guard: after `#about` scrolls into view, `expect(page.locator('#about svg text').filter({hasText:'NO SCORES'})).toHaveCount(0)` at 1400 ms and `expect(locator('[data-active]')).toHaveCount(1)`; under reduced motion the same assertions at 100 ms.

## F-3 · #hero — no-WebGL/reduced-motion path has zero depth cue — MINOR
Verified: `mobile-rm-nogl-hero.png` — flat near-black ground, `fallbackEls:0`. Readable and correct, but the fallback is "nothing" rather than a still of the same scene.
Direction: CSS-only stand-in on `.stage` when the canvas is absent: two stacked `radial-gradient` layers — key `radial-gradient(60% 55% at 22% 30%, rgb(255 255 255 / 0.11), transparent 70%)` and horizon `linear-gradient(to top, rgb(255 255 255 / 0.05), transparent 45%)` — plus a 1.8% SVG turbulence grain via `feTurbulence baseFrequency 0.9`, `mix-blend-mode: screen`, opacity 0.06. Static, no animation, matches the shader's key position (`lightPos = (-0.62, 0.40)` → ~22% x, 30% y). Under GL, the same layer fades to 0 over `--motion-cine-in` 720 ms as `uIntensity` reaches 1 (shader ramps at `delta*0.65` ≈ 1540 ms — Verified `HeroAtmosphere.tsx:102`; recommend raising to `delta*0.87` ≈ 1150 ms to sit inside the 1160 ms cinematic band).
Playwright guard: with `getContext` stubbed to null, assert `#hero .stage` computed `background-image` contains `radial-gradient` and the hero canvas count is 0; with GL, assert canvas exists and `.stage` opacity → 0 by 1500 ms.

---

## Per-section signature judgement

| # | Section | Signature now | Narrates the argument? | Bar met |
|---|---|---|---|---|
| 1 | #hero | Full-screen GLSL atmosphere: fbm mist ×3 depths, ridged near layer along beam axis, radial shafts, key at (-0.62, 0.40), pointer parallax 0.055, scroll parallax 0.12, stars 0.8% cell density, grain 1.8% (Verified `atmosphere.glsl.ts`; `hero-pointer-sweep.png` shows shafts and horizon visible) | Yes — one light source, everything lit from high-left, type in front | Yes (with F-3) |
| 2 | #about | SVG instrument face: 10 annular sectors, 7 solid / 3 hatched (role-side), rotates active sector under a caret, reading digit + state word (Verified `about-hover.png`) | Yes on hover; contradicts itself at rest | No (F-2) |
| 3 | #experience | DOM bars to scale + GLSL sediment field | Bars yes; field no ("encodes nothing") | No (F-1) |
| 4 | #skills | SVG bench: ~30 bezier wires from programmes/repositories to capabilities, `trace` stroke-dash animation 900 ms emphasized with per-wire `--delay`, gold gradient only on `status==='production'` wires (Verified `skills-t2.png`, `Bench.tsx:290-326`) | Yes — "every capability wired to its evidence"; gold = measured in production, correctly licensed | Yes |
| 5 | #vitrine | Native scroll-snap rail (`x mandatory`, 3144/1440 px), IntersectionObserver-driven raking light: lit plate white, unlit plates dimmed; six hairline mechanism drawings in currentColor (Verified `vitrine-rail-scrolled.png`, `motion-probe.json.vitrineRail`) | Yes — "standing in front of one plate"; drawings show what each repo does | Yes, with polish below |
| 6 | #listen | Caliper set down: jaws close over `--motion-cine-long` 1160 ms emphasized to the width of the first word, reading stays '—', rule draws 720 ms after (Verified `Listen.module.css:137-185`, final state in `listen-t2.png`) | Yes — the instrument that measured everything above, with nothing to measure | Yes |

The brief states Listen has no signature visual; that is out of date — the caliper-close beat is live and is the right restraint. Direction: keep it as the single beat. Do not add a second. One refinement (POLISH): the reading '—' should arrive after the jaws close (opacity 0→1 over `--motion-base` 320 ms, delay 1160 ms) so the eye reads "closed, then nothing measured" in sequence; reduced motion draws it at once (already the case).

## Polish directions (not verdict-bearing)
- #vitrine: unlit plate rest opacity currently reads ~0.45 (Inferred from `vitrine-rail-scrolled.png`, not measured) — raise to 0.62 so drawings stay legible off-axis; when a plate becomes lit, trace its drawing on with `stroke-dasharray/dashoffset` over `--motion-cine-in` 720 ms emphasized, stagger 40 ms per path; reduced motion draws instantly. Gold stays only on live repository URLs. Guard: assert lit plate `[data-lit]` count is exactly 1 after a 600 px rail scroll and that its drawing paths have `stroke-dashoffset: 0` by 900 ms.
- #skills: the trace already runs once and detaches (`Bench.tsx:104`). Add wire hover: hovering a capability raises its wires' `stroke-opacity` to 1 and dims others to 0.18 over `--motion-fast` 200 ms standard. Guard: hover a node, assert ≥1 path with stroke-opacity 1 and ≥1 with 0.18.
- #hero: pointer lerp `delta*1.6` (Verified) gives ~600 ms lag — correct for "a beat behind". Keep. Parallax ratio far:mid:near = 0.18:0.55:1.15 reads as depth; do not raise the pointer coefficient above 0.07 or the type and its backdrop separate visibly.
- MiniVic: launcher verified bottom-right; panel geometry deferred to cycle 13 (task list) — not assessed here.

## Gold audit (this pass)
Verified gold appearances at 1440: skills production wires + endpoint dots (`skills-t2.png`), MiniVic launcher ring segment (tiny arc, `skills-t2.png` bottom-right — Inferred it is the launcher's speaking/ready indicator; if it is not tied to a sourced figure it is a palette breach and should be white). No gold observed in hero, about, experience, vitrine title area, listen (Verified screenshots).

## Artifacts
`motion-probe.js`, `motion-probe.json`, `motion-probe.log`, `hero-pointer-sweep.png`, `{hero,about,experience,skills,vitrine,listen}-t{0,1,2}.png`, `about-hover.png`, `experience-hover.png`, `vitrine-rail-scrolled.png`, `minivic-open.png`, `mobile-rm-nogl-{hero,experience,about}.png` — all under `docs/delivery/evidence/v9-20260904T2312Z/R-c8/`.
