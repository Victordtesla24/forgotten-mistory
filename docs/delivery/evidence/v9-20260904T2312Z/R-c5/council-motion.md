# Council — Motion / visualisation architect (R-c5)

Run v9-20260904T2312Z · cycle c5 · commit e64566e3 · https://forgotten-mistory.web.app/?gl=force
Observer: Playwright (repo `node_modules/playwright`, Chrome channel, `--use-angle=swiftshader`), 1440x900 DPR1, plus 390x844 DPR2 `reducedMotion:'reduce'` without `?gl=force`.
Evidence in this directory: `motion-probe.json`, `hero-pointer-{a,b}.png`, `<section>-{0,1,2}.png` (3 frames, 400 ms apart), `about-hover.png`, `experience-hover.png`, `skills-hover.png`, `vitrine-scrolled.png`, `minivic-open.png`, `mobile-rm-hero.png`. Script: `/tmp/motion_probe.js` (transient).

Tags: **Verified** = observed in this session, artifact cited · **Inferred** = derived from source read this session · **Assumed** = not observed.

## Verdict: FAIL against the Owner's bar

Zero console errors/warnings and zero page errors across the full scroll, all hovers, the rail scroll and the MiniVic open (Verified — `motion-probe.json` `console: []`, `pageerrors: []`). The bar fails on **signature-visual grade**, not on hygiene: two of the six sections (Experience, Vitrine) have a visual that decorates rather than narrates, and the hero's one moving part is under-driven.

## Failures first

### F1 — Experience (#experience): the section's argument is not animated; the WebGL scene encodes nothing by design — MAJOR
- **Verified**: `experience-hover.png` — eight bars sit static at their final widths, all in one low-contrast grey (~#4a4a4a on #101010), 6 px tall; hovering bar 2 ("Independent AI Consulting") produced no visible change in the 500 ms frame. The strata canvas is present behind the chart as faint horizontal lines (visible in `experience-1.png`), dissolving at the edges as `strata.glsl.ts` intends.
- **Inferred** (from `strata.glsl.ts` header): the shader is documented as "sediment, not data … It encodes nothing". So the ONE visual this section owns is a backdrop; the chart — which *is* the argument "to scale" — has no cinematic beat. `Experience.module.css` has only `color`/`transform` transitions at `--motion-fast` (200 ms) on hover.
- **Direction (exact)**:
  1. Bars grow to their real duration on first entry. `Experience.tsx`: add an `IntersectionObserver` (threshold 0.35, once) that sets `data-entered` on `<ol class="tracks">`. CSS: `.bar { transform-origin: left; transform: scaleX(0); }` → `[data-entered] .bar { transform: scaleX(1); transition: transform var(--motion-cine-long) /* 1160ms */ cubic-bezier(0.16, 1, 0.3, 1); transition-delay: calc(var(--i) * var(--stagger) /* 90ms */); }` with `--i` = chronological index (oldest first, MYOB=0), so the timeline is laid down in the order it was lived. The duration label fades in at `--motion-base` (320 ms) after its bar completes: `transition-delay: calc(var(--i) * 90ms + 900ms)`.
  2. One gold playhead: a 1 px vertical `<span class="playhead">` at "today", drawn in `--gold` because its position is a CV-sourced date (a checkable figure); it draws down over `--motion-cine-in` (720 ms) after the last bar lands. No other gold in the section.
  3. Hover: `.bar:hover, .track:focus-within .bar { transform: scaleY(1.6); transition: transform var(--motion-fast) var(--motion-ease-standard); }` plus the adjacent axis gridline column brightens to `--ink-400` (200 ms). Raise rest-state bar luminance to `--ink-500`-equivalent so 8 bars clear WCAG 3:1 non-text contrast against `--ink-900` (currently Verified low in `experience-hover.png`; contrast not measured numerically here → Inferred).
  4. Shader stays as-is (correct decision: it must not compete with data) but its `uPointer * 0.02` parallax is invisible at that magnitude; raise to `0.035` and add `uScroll` (as hero does) at `0.06` so the strata slide slowly under the chart as the reader scrolls past — depth, not information.
  5. Reduced motion: `@media (prefers-reduced-motion: reduce) { .bar { transform: none; transition: none } .playhead { animation: none } }` — bars at final width on paint. No-GL: DOM chart is the data already (Verified mobile no-GL path: `mobileRM.canvases: 0`, hero text readable in `mobile-rm-hero.png`; Inferred the same holds for Experience).
  6. Mobile frame budget: transform-only animation, 8 elements, compositor thread — no layout. 
- **Playwright guard**: `tests/e2e/experience-entry.spec.ts` — scroll `#experience` into view; assert first bar `getComputedStyle(bar).transform` matrix a-component is `< 0.2` at t=0 and `=== 1` after 2200 ms; assert exactly one element in `#experience` has computed `color`/`background-color` equal to the resolved `--gold` (the playhead); under `reducedMotion:'reduce'` assert the matrix is identity at t=0.

### F2 — Vitrine (#vitrine): six mechanism drawings never move; the rail's "raking light" is only opacity — MAJOR
- **Verified**: `vitrine-scrolled.png` after `scrollBy(900, smooth)` — plate 02 is lit (opacity 1), 01 and 03 dimmed (0.42 rest per `Vitrine.module.css:92`). The drawings (`Drawings.tsx`, hairline SVG in `currentColor`) are fully drawn at rest and identical between frames `vitrine-0/1/2.png` (400 ms apart). Snap is `x mandatory` (Verified `motion-probe.json` `rail.snap`).
- **Direction (exact)**: the drawing *is* the story ("what it does, not what it looks like"), so it should be **drawn** when the plate is lit, exactly as the Bench wires trace.
  1. In `Drawings.tsx` give every `<path>/<line>/<circle>` `pathLength="1"` and class `styles.stroke`. CSS: `.stroke { stroke-dasharray: 1; stroke-dashoffset: 1; } [data-lit] .stroke { stroke-dashoffset: 0; transition: stroke-dashoffset var(--motion-cine) /* 900ms */ cubic-bezier(0.16, 1, 0.3, 1); transition-delay: calc(var(--k) * var(--stagger-tight) /* 60ms */); }` where `--k` is draw order (line first, nodes, then the gate/labels). Labels (`<text>`) fade `opacity 0→1` over `--motion-base` (320 ms) at the end of the trace.
  2. Unlit rest opacity `0.42 → 0.62` (plates are unreadable at 0.42 — Verified plate 03 text in `vitrine-scrolled.png` is barely legible); lit plate adds `transform: translateY(-4px)` at `--motion-base`.
  3. Rail edges: `mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)` on `.rail` so plates enter from light, not from a hard clip; scrollbar thumb opacity `0.18 → 0.32`.
  4. Gold stays only on live repository URLs (existing rule) — the drawings remain `currentColor`.
  5. Reduced motion: `.stroke { stroke-dashoffset: 0; transition: none }` — drawings fully present. No WebGL involved.
- **Playwright guard**: `tests/e2e/vitrine-trace.spec.ts` — for the lit plate, assert `getComputedStyle(path).strokeDashoffset` is `'1'` (or `1px`) on mount and `'0'` within 1400 ms of `data-lit`; assert under reduced motion it is `'0'` immediately; assert `.rail` `mask-image` is not `none`.

### F3 — Hero (#hero): the atmosphere is present but the pointer parallax is below perception and the scene arrives before the type — MINOR/POLISH
- **Verified**: the hero canvas is 1440x903, opacity 1, WebGL context live under SwiftShader (`motion-probe.json` `gl:` "ANGLE … SwiftShader"). `hero-pointer-b.png` shows mist strata, sparse stars, key light top-left, grain — the achromatic ramp holds (no hue visible). `hero-pointer-a.png` vs `-b.png` (pointer swept to 1300,800) — no parallax shift I could see at 1x; not pixel-diffed → **Inferred** the 0.055 magnitude is sub-perceptual on a 1440 frame.
- **Inferred** (from `HeroAtmosphere.tsx`): `uIntensity` ramps linearly `+delta*0.65` (≈1.5 s linear); `Hero.module.css` `heroRise` runs at `--motion-cine` (900 ms) + 120 ms; so the type lands before the backdrop finishes — the reverse of the intended "arrives behind the type".
- **Direction (exact)**:
  1. `uPointer` parallax `0.055 → 0.09`; `lightPos` parallax factor `0.35 → 0.5`; near-layer factor `1.15 → 1.6` (near moves ~3x far; keep far at 0.18 so depth ratio widens instead of everything sliding together). CPU lerp `delta * 1.6 → delta * 2.2` (≈450 ms settle, inside the interface band).
  2. Replace the linear intensity ramp with an eased one: `intensity = easeOutCubic(min(elapsed / 1.16, 1))`, `easeOutCubic = 1 - (1-t)^3`, started at mount, so the backdrop is 85 % up at 500 ms — before `heroRise` begins at 120 ms + stagger has resolved the name. Duration 1160 ms = `--motion-cine-long`.
  3. `uTime * 0.012` drift is right (nothing pulses); leave.
  4. Grain `0.018` reads correctly on the 1x capture (no banding visible) — leave.
  5. Gold: none in the scene — correct. The three caliper marks remain `self-reported`, no gold (Verified `hero-pointer-b.png`: marks are white/grey).
  6. Reduced motion: already zeroes `uTime`/pointer/scroll (Verified in source; Verified 390 RM run mounts **no** canvas and the hero text is fully readable — `mobile-rm-hero.png`). No-GL path: CSS gradient fallback — add a static 2-stop radial from top-left (`--ink-700` at 0 → `--ink-900` at 70 %) so the key light exists without a shader.
- **Playwright guard**: `tests/visual/hero-parallax.spec.ts` — screenshot the hero canvas region (0,0,720,450) with pointer at (100,100) and again at (1340,800) after 600 ms; assert `pixelmatch` diff ratio `> 0.004` (parallax perceptible) and `< 0.08` (not a swing); under `reducedMotion:'reduce'` assert diff `=== 0`.

### F4 — Listen (#listen): no signature visual — DECISION: one restrained beat belongs here, and it is the instrument being set down
- **Verified**: `listen-0/1/2.png` are identical apart from the nav; the only motion is `ruleDraw` on the 1 px rule (`Listen.module.css:79`, 720 ms, emphasized ease, 140 ms delay). The section reads as intended silence.
- **Direction (exact)** — keep the silence, give it one closing stroke:
  1. Extend `ruleDraw` into "the caliper closing": the rule is the two jaws of the site's caliper mark meeting. Render `<span class="rule">` as two 50 %-width halves; on entry (IntersectionObserver, once, threshold 0.6) each half `scaleX(0→1)` from its outer end over `--motion-cine-in` (720 ms) `cubic-bezier(0.16, 1, 0.3, 1)`, meeting in the centre; at the meeting point a 3 px dot fades in over `--motion-base` (320 ms), **grey not gold** — the sentence makes no factual claim, so it earns no gold (the site's own rule).
  2. The four channels then rise 6 px / fade in with `--stagger` (90 ms) after the dot, `--motion-base`.
  3. Nothing else moves. No WebGL, no SVG beyond the dot.
  4. Reduced motion: rule at full width, dot present, channels static (existing `animation: none` block covers it).
- **Playwright guard**: `tests/e2e/listen-close.spec.ts` — assert `.rule` halves have `transform: matrix(0,…)` before entry and identity after 1000 ms; assert no element inside `#listen` resolves to `--gold`.

## Sections that meet the bar (with polish notes)

### About (#about) — PASS
- **Verified**: `about-hover.png` — hovering item 3 rotated the rose to `rotate(-72deg)` (`motion-probe.json` `compassRotation`), sector 03 lit, numerals upright, hub reads "03 / ANSWERED", role-side sectors 08–10 hatched, gold index caret at twelve o'clock is the single gold mark. Inline SVG, crisp at 1x, no WebGL dependency; sticky column holds through the list. Transition `--motion-cine-in` 720 ms emphasized (`Compass.module.css:24`).
- Polish: (a) on first entry the rose should sweep once through 360° over `--motion-cine-long` (1160 ms, `cubic-bezier(0.16,1,0.3,1)`) then settle at 0 — an instrument being zeroed — and (b) scroll-drive: bind `active` to the list item nearest the viewport centre (IntersectionObserver rootMargin `-45% 0px -45% 0px`) so keyboard/touch readers get the same rotation as hover (Verified hover-only in `About.tsx:93 onMouseEnter`). Guard: assert `g[style]` transform changes when scrolling item 5 to centre with no pointer.

### Skills (#skills) — PASS
- **Verified**: `skills-hover.png` — 20 wires (`benchWires: 20`), gold only on production-evidenced wires and their capability dots, grey otherwise, one capability with no wire; hovering a capability dims unconnected wires. Trace animation runs once then is removed (`Bench.module.css:64-66`), so resize does not replay. This is the site's best visual: it narrates the argument exactly.
- Polish: hovered wire should thicken `stroke-width 1 → 1.6` at `--motion-fast` and its two end labels go to `--white`; add the wire count per source as a `title` for AT. Guard already exists for gold (monochrome suite); add `expect(wireEls.filter(gold).length).toBe(productionLinks.length)`.

### MiniVic — PASS for this brief's scope
- **Verified**: `minivic-toggle` present bottom-right; click opened `minivic-panel` with modes *Hiring Fit / Engineering / Story*, greeting addressed to employers ("open to Scrum Master and delivery-leader…") (`motion-probe.json` `minivicPanel`, `minivic-open.png`).

## Cross-cutting

- Zero console errors/warnings, zero page errors, 1440 full journey (Verified).
- Monochrome + gold-as-claim holds in every capture reviewed (Verified visually; numeric hue scan not run here — the monochrome suite owns that).
- LCP/CLS not measured in this brief (Assumed covered by the perf reviewer).
- Mobile frame budget: hero drops ridged layer + shafts below 900 px (`uQuality`), DPR capped (Inferred from source; not profiled here).

## Ranked directions
1. F1 Experience entry growth + gold playhead + hover scaleY (major, ~2 h).
2. F2 Vitrine drawings trace-on-lit + rest opacity 0.62 + rail mask (major, ~2 h).
3. F3 Hero parallax magnitudes + eased 1160 ms entrance + no-GL radial (minor, ~1 h).
4. F4 Listen caliper-close beat (polish, ~1 h).
5. About first-entry sweep + scroll-drive; Skills wire hover (polish, ~1.5 h).
