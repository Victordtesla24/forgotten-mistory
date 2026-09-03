## Research: explanatory micro-animation, 2026 — technique catalogue for the Calibration Card

### 0. Constraints established from the repo (not from the web)

`components/sections/Skills/Bench.tsx` + `Bench.module.css` **already implement the house pattern** the new metaphor animation must match, and it is the right one: `pathLength={1}` on every wire, a single `IntersectionObserver` at `threshold: 0.15` that calls `observer.disconnect()` on first hit, a `trace 820ms var(--motion-ease-emphasized)` keyframe with staggered `--delay`, a `settled` state after a computed total that sets `animation: none` so nothing can replay, and a `matchMedia('(prefers-reduced-motion: reduce)')` early-return that sets `drawn = true` (fully drawn, not hidden). Motion tokens exist: `--motion-ease-standard: cubic-bezier(0.22, 1, 0.36, 1)`, `--motion-ease-emphasized: cubic-bezier(0.16, 1, 0.3, 1)`. `framer-motion@11.18.2` is already a dependency (zero marginal bytes), wrapped in `<MotionConfig reducedMotion="user">`. Any new technique that contradicts these is a regression, not an improvement.

---

### 1. Browser-support facts that constrain the choice (verified Sept 2026)

| Feature | Status | Consequence |
|---|---|---|
| **CSS scroll-driven animations** (`animation-timeline: view()/scroll()`, `animation-range`, `timeline-scope`) | Chrome/Edge 115+, Safari 26+ (Sept 2025). **Firefox stable still requires `layout.css.scroll-driven-animations.enabled`** (on by default only in Nightly, still flagged as of FF 152, June 2026). MDN prints **"Limited availability — not Baseline"**. ~82–84% global usage. | **Never the only path.** Use it only as a `@supports` progressive enhancement over an IntersectionObserver base, or skip it. Roughly one in six visitors (and every Firefox employer) sees nothing. |
| **`@property`** registered custom properties | Baseline Newly available since July 2024 (Chrome 85+, Safari 16.4+, Firefox 128+), ~95% in 2026. | **Safe.** This is the 2026 unlock: type a custom property as `<number>`/`<length>` and CSS will interpolate it, letting one keyframe drive a numeric readout, a dash, and a rotation together. |
| **CSS `d: path()`** (declarative morph) | Chrome/Edge/Firefox yes; **Safari still does not support `d` as a CSS property** (WebKit bug 234227 open). | **Do not build the metaphor on CSS path morphing.** It silently no-ops on ~20% of traffic — worst possible failure for an explanatory graphic. |
| **SMIL (`<animate>`, `<animateTransform>`)** | Deprecation was abandoned after 2015 pushback; works in every current engine. | Usable, but it ignores `prefers-reduced-motion` (no CSS override reaches it), can't read CSS custom properties, and is awkward to gate/stop. Use only for attributes CSS genuinely can't animate. |
| **Web Animations API** | Universal. | The right JS escape hatch: it composes with CSS, respects `getAnimations()`, and lets you `.finish()` on the reduced-motion path instead of ripping animation out. |

---

### 2. The technique catalogue

Verdict key: **✅** = zero added bytes, pure CSS/SVG/inline JS, safe for `output: 'export'` under the 500 kB ceiling. **⚠️** = safe but needs discipline. **❌** = don't.

---

**T1 — `stroke-dashoffset` draw-on with `pathLength="1"`** ✅
*What:* Normalise every path to unit length, then animate `stroke-dashoffset: 1 → 0` so it appears to be drawn by an instrument.
*Use when:* Anything that should read as *being measured/inscribed rather than appearing* — a certificate line being ruled, a trace being taken, a wire being landed. This is the single most legible "instrument at work" primitive on the web.
*Failure mode:* Using `getTotalLength()` at runtime instead — it returns the pre-layout length, so a responsive redraw leaves a dash array shorter than the path and the stroke never closes. (The Bench file's own comment records exactly this bug.) Second failure: leaving the animation attached after it finishes, so any style recalculation replays it.
*Shape:* `path { stroke-dasharray: 1; stroke-dashoffset: 1; animation: trace 820ms var(--motion-ease-emphasized) var(--delay) both; }` with `pathLength="1"` on the element.

---

**T2 — `@property`-typed custom property as the single animation clock** ✅
*What:* Register `--t` as `<number>`, animate `--t` in one keyframe, and derive dash offset, opacity, a rotation angle and a `calc()`-positioned needle from it. One timeline, many synchronised effects.
*Use when:* A composite mechanism must move as one object (jaws closing *while* the reading resolves *while* the certificate line rules itself). Far cheaper and more legible than four keyframes you hand-align.
*Failure mode:* Forgetting `inherits: false` (children silently inherit and animate too); using an unregistered `--var` and getting a discrete jump instead of interpolation with no error.
*Shape:* `@property --t { syntax: '<number>'; inherits: false; initial-value: 0 }` then `transform: rotate(calc(var(--t) * -6deg))`.

---

**T3 — Reveal by animated `clip-path` / `mask-image` ("the certificate is stamped")** ✅
*What:* Wipe content in behind a moving `inset()`/`polygon()` edge or a `mask-image` gradient stop, rather than fading or sliding it.
*Use when:* You want the *reading* to arrive as if printed by the instrument — the label appears left-to-right under a moving rule, not floated in from nowhere. Reads as mechanical, not decorative.
*Failure mode:* `clip-path` animation is **not** compositor-only in most cases — it repaints. On a large box during scroll that is a real cost. Also, `polygon()` interpolation requires the same vertex count in both keyframes, or it snaps. And clipped text is still in the a11y tree, so a screen reader announces it before it's visible (fine here; catastrophic for a "spoiler").
*Shape:* `@keyframes rule { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0 0 0 0) } }` — keep the clipped element small.

---

**T4 — SVG `<mask>` / `<clipPath>` with an animated child** ✅
*What:* Put the animation inside the mask (a moving rect, a growing circle), keep the artwork static.
*Use when:* The reveal shape is itself part of the metaphor — e.g. a tolerance band sweeping across a scale, a hatch region uncovering the "open" state.
*Failure mode:* Masks force an offscreen buffer; nesting mask-inside-filter-inside-mask is where SVG frame times fall off a cliff. Also `maskUnits` defaults trip people up: `objectBoundingBox` means your rect coordinates are 0–1, not user units.
*Shape:* `<mask id="m"><rect width="0" height="100%" fill="#fff"><animate .../></rect></mask>` (prefer a CSS-animated class on the rect over SMIL).

---

**T5 — `getPointAtLength()` sampling to place things *on* a path** ⚠️
*What:* Sample an `SVGGeometryElement` at *n* points to position tick marks, dots, or a travelling readout exactly along a curve; or to pre-bake a polyline you then animate cheaply.
*Use when:* You need labels/ticks that sit on a curve you authored once, or you want a numeric readout to track the drawing head of a T1 trace.
*Failure mode:* Calling it per-frame in a `requestAnimationFrame` loop forces layout every frame — this is the classic "SVG is slow" self-own. Sample **once** after mount (and on a debounced resize), cache the array. Also returns `0` if the element isn't laid out yet — guard for a hidden/`display:none` ancestor.
*Shape:* `const pts = Array.from({length: n}, (_, i) => path.getPointAtLength(path.getTotalLength() * i / (n - 1)))` — once, memoised.
*Cheaper alternative:* CSS `offset-path: path(...)` + `offset-distance: 0% → 100%` moves an element along a path with **no JS at all** and is compositor-friendly (motion path is widely supported). Prefer this for a travelling head.

---

**T6 — Path morphing** ❌ as designed; ⚠️ only in a constrained form
*What:* Interpolating one `d` string into another (dashed open jaws → closed jaws).
*Why it's a trap here:* CSS `d:path()` doesn't work in Safari. Naive interpolation requires **identical command sequences and vertex counts** or points cross-link and the shape turns inside out. Libraries that fix this (flubber ~; GSAP MorphSVG is paid) cost bytes and still can't be expressed declaratively for the reduced-motion path.
*The constrained form that is fine:* author both states with **the same command list** and morph by animating a small number of coordinates via a `@property`-typed variable, or simply **cross-fade two sibling paths** (`opacity` only — compositor-only, free, and visually indistinguishable at 200 ms for a mark this small). For the Caliper's three states, cross-fade + a transform beats a morph.
*Shape:* two `<path>` siblings, `.open { opacity: calc(1 - var(--t)) } .closed { opacity: var(--t) }`.

---

**T7 — `<animateTransform>` (SMIL) vs CSS `transform` vs WAAPI** ⚠️
*What:* Three ways to rotate/translate SVG children.
*Use which:* **CSS `transform` on SVG elements is universally supported now** and is the default answer — it's the only one of the three that `prefers-reduced-motion` can override in a stylesheet and that respects `transform-box: fill-box; transform-origin: center` for sane rotation pivots. **WAAPI** when the trigger is JS and you need `.finish()`/`.cancel()` semantics. **SMIL** only for attributes CSS can't touch (`viewBox`, `startOffset`, `d` where you need Safari).
*Failure mode:* Forgetting `transform-box: fill-box` — SVG's default `view-box` origin rotates your caliper jaw about the corner of the canvas. Also SMIL animations keep running under reduced motion and are invisible to `getAnimations()`.
*Shape:* `.jaw { transform-box: fill-box; transform-origin: 50% 100%; transform: rotate(var(--jaw)); }`

---

**T8 — `@keyframes` + `animation-delay` stagger driven by an index custom property** ✅
*What:* One keyframe, N elements, `--i` per element sets the delay. No JS orchestration.
*Use when:* Anything enumerable — 13 sources landing, 17 capabilities lighting, four certificate rows ruling in.
*Failure mode:* Linear stagger over a large N produces a dead tail: 17 × 60 ms = 1.02 s of nothing happening at the end. Cap total stagger at ~400–500 ms by shrinking the step as N grows (`calc(var(--i) * (400ms / var(--n)))`), or stagger in groups. Second failure: `animation-delay` with `both` fill leaves elements invisible if the animation never starts (e.g. an ancestor is `display: none` at trigger time).
*Shape:* `animation-delay: calc(var(--i) * 38ms);` set inline via `style={{ '--i': i }}`.

---

**T9 — "Animate once, then settle" (the state-flip)** ✅ **— mandatory**
*What:* After the intro completes, a `settled` class **removes the animation entirely** (`animation: none`) and the element's resting style is its final style. The animation is never the source of truth for the resting appearance.
*Use when:* Always, for an explanatory intro. This is the difference between a diagram and a toy.
*Failure mode:* Leaving `animation: … both` on: any style recalculation, a container-query re-evaluation, a tab return, or React re-mount replays the whole explainer in the reader's face. Also: driving the intro from a `useEffect` that depends on a value that changes on resize → replay on every resize/orientation change. Compute the settle timeout from the actual stagger total, and set `settled` from `animationend` on the *last* element where possible (more robust than a magic number).
*Shape:* `useEffect(() => { const t = setTimeout(() => setSettled(true), TOTAL); return () => clearTimeout(t) }, [drawn])` + `.settled .wire { animation: none }`.

---

**T10 — IntersectionObserver one-shot trigger** ✅ **— the correct trigger in 2026**
*What:* Fire the explainer when the section first crosses ~15% visibility, then `disconnect()`.
*Use when:* Always, as the base layer. It is cheap, universally supported, off the main thread for the intersection computation, and it does not couple animation progress to scroll position (so no jank, no scrubbing back and forth, no scroll hijack).
*Failure mode:* Observing with no `disconnect()` (replays on every re-entry); a `threshold` so high the element never reaches it on a short viewport (use `threshold: 0.15` **plus** a `rootMargin` bottom trim, or observe a small sentinel); and forgetting that a deep-linked `#skills` load may already have the element on screen at mount — IO fires correctly on first observation, but a hand-rolled scroll listener would not.
*Shape:* the exact block already in `Bench.tsx` lines 194–206. Reuse it.

---

**T11 — CSS scroll-driven animation (`animation-timeline: view()`)** ⚠️ enhancement only
*What:* Bind progress to the element's travel through the viewport, main-thread-free.
*Use when:* You want the *ruling of the certificate* to track the reader's scroll for the first ~30% of the section, then finish. Genuinely nicer than a fixed-duration intro because the reader controls it.
*Failure mode:* Firefox stable shows **nothing** (flagged), so it must sit behind `@supports` with the T10 path as the default; the two must not both run. And compositor promotion is **property-dependent** — a view-timeline animating `width`, `filter` or `clip-path` still hits layout/paint every frame, so the "free" reputation is only true for `transform`/`opacity`/registered numeric props.
*Shape:* `@supports (animation-timeline: view()) { .wire { animation-timeline: view(); animation-range: entry 20% cover 45%; } }`
*Rule for this site:* if it can't be seen in Firefox, it cannot carry meaning. Scroll-driven timing may only change *how* the same information arrives.

---

**T12 — Do not hijack scroll** ✅ (a technique of omission)
*What:* No `wheel` preventDefault, no pinned/`position: sticky` scroll-scrubbed sequence that steals the reader's scroll budget, no "scroll to advance the explainer" gate.
*Why:* Scrolljacking breaks assistive tech and keyboard paging, defeats Find-in-page, and is on Webflow's and the Front-End Checklist's accessibility fail lists. It also converts a 3-second explainer into an obstacle. The metaphor must land in ~3 s *without* the reader doing anything.
*Failure mode if ignored:* keyboard users using PageDown land mid-animation with no way out; the section fails your own "keyboard-navigable" definition of done.

---

**T13 — SVG filters (`feTurbulence` + `feDisplacementMap`)** ❌ for animation, ⚠️ once
*What:* Procedural noise / hand-drawn jitter / paper texture.
*Real cost:* Each primitive enlarges the painted region and adds an image-processing pass before the frame can present; `feGaussianBlur` is cheap, **`feDisplacementMap` is slow**, and in practice many filter graphs fall back to CPU rasterisation even where GPU paths nominally exist. Animating a filter's `baseFrequency` or `seed` is a full re-rasterise per frame of the whole filter region.
*The only acceptable uses here:* a **static** filter applied once to a small element (the 45° hatch behind an `open` caliper could be a `<pattern>`, which is far cheaper than a filter), or a filter you render once and never animate.
*Shape (if at all):* `filter: url(#grain)` on a ≤200 px box, never inside a keyframe.
*Better monochrome alternative:* `<pattern>` for the hatch, `feTurbulence`-free.

---

**T14 — Canvas / WebGL** ❌ overkill here
*When it actually wins:* SVG stays fully interactive and competitive up to ~1–2 k nodes and degrades past ~5 k; canvas only pays off at tens of thousands of marks. The bench is 13 + 17 + ~40 wires — three orders of magnitude below the crossover.
*Why not:* loses text selection, DOM accessibility, keyboard focus, print, and CSS token theming — all of which this site's audit depends on. The site already has WebGL where it belongs (Experience strata); a second canvas for a 70-node diagram costs a `useGLCapability` fallback path for nothing.

---

**T15 — Discrete-state transitions with `transition-behavior: allow-discrete` + `@starting-style`** ⚠️
*What:* Animate an element in from nothing without a JS mount dance (useful if the explainer reveals a caption on first draw).
*Failure mode:* Safari/Firefox parity is newer than the rest of this list — treat as enhancement; a missing `@starting-style` just means the element appears instantly, which is an acceptable degradation.
*Shape:* `@starting-style { opacity: 0 }` + `transition: opacity .3s, display .3s allow-discrete;`

---

### 3. Craft rules for *instrument* motion (as opposed to organic)

- **Easing is the whole personality.** Organic/UI motion uses springy overshoot (`cubic-bezier(0.16, 1, 0.3, 1)` — your `--motion-ease-emphasized`, which overshoots-then-settles). **Instrument motion must not overshoot.** A caliper jaw that bounces is a broken caliper. For the mechanism itself use a **decelerating, non-overshooting** curve — `cubic-bezier(0.2, 0, 0, 1)` (already the Bench fallback) or `cubic-bezier(0.4, 0, 0.2, 1)`. Reserve `--motion-ease-emphasized` for *ink arriving* (the trace, the label), where a soft settle reads as printing. Consider adding one token, e.g. `--motion-ease-mechanical: cubic-bezier(0.2, 0, 0, 1)`, rather than reusing an overshoot curve for a measuring tool.
- **Linear is not neutral, it's robotic** — and that is occasionally correct: a *dial sweeping to a reading* can be linear-then-decelerate; a *stroke being drawn by a pen* should not be.
- **Duration budget.** Desktop UI micro-interactions live at 150–200 ms; a motion scale of ~100/200/300/500/800 ms is the 2026 convention. Map it: mark state-change 160–200 ms; a single trace 600–820 ms; the **whole explainer ≤ 2.4 s from trigger to settled**, because the brief says the metaphor must land in ~3 s and a reader who has to wait longer than that has already scrolled.
- **Stagger to imply causality, not to fill time.** 30–45 ms/step, total stagger capped ~400 ms. Order carries meaning: *instrument → certificate → the absent bars*. If the order is arbitrary, don't stagger.
- **One idea per beat.** Three beats maximum: (1) the instrument closes on a thing and takes a reading; (2) the reading is *inscribed* onto a card as a line of provenance; (3) the empty row where a proficiency bar would be stays empty, with the reason ruled in. If a viewer must watch twice, it's a diagram failure, not an animation failure.
- **Animate once, then settle** (T9) and **never replay on resize** — gate the trigger effect on `[]`, keep measurement in a separate debounced effect, and flip to `animation: none`.
- **The static frame must be the true frame.** Screenshot the settled state; if it doesn't explain the metaphor on its own, the animation is doing work the design should be doing.

---

### 4. What a *good* `prefers-reduced-motion` path looks like

The 2026 consensus is explicit: `reduce` means *remove or replace motion that can trigger discomfort*, **not** *remove information*, and the recommended implementation is a very short duration rather than `animation: none`, so that dependent `animationend` listeners still fire.

A good static path for this section:
1. **Ship the finished frame, not an empty one.** Reduced motion sets `drawn = true` immediately (already what `Bench.tsx` does) — the wires are simply *there*.
2. **Author motion as the enhancement**, not the default: base styles are the settled state; the `@media (prefers-reduced-motion: no-preference)` block adds the intro. This is strictly safer than an override, because a missed selector fails *static*, not *animated*.
3. **Keep the cheap, non-vestibular signals**: opacity crossfades under ~200 ms, focus rings, colour/weight changes, and the caliper's state change on hover/focus are all fine to keep.
4. **Kill exactly these**: the traced draw-on, any parallax, any scroll-scrubbed progress, any looping/idle motion, any large translate.
5. **Preserve the beat structure as layout.** If the animation told a 3-beat story, the static version must show all three beats simultaneously as a small strip (instrument → card → the empty row), so the reduced-motion reader gets the *same* argument, not a mute one.
6. **Test it as a first-class path**, e.g. a Playwright project with `reducedMotion: 'reduce'` asserting the wires have `stroke-dashoffset: 0` at first paint and that a visual baseline matches the settled frame.

Also honour the global override you already have (`animation-duration: 0.001ms !important`) — note that this override **cannot reach SMIL**, which is a second reason T7 prefers CSS.

---

### 5. Performance: what actually causes CLS/jank here

- **CLS:** the two real risks are (a) an SVG without a reserved box — give the figure an explicit `aspect-ratio` (or width/height attributes + `height: auto`) so it occupies its final size before hydration; and (b) a *font-swap* on the mono provenance labels reflowing the card. Neither is caused by animation itself. Animations that change `width/height/top/left/margin` do not shift *other* content only if they're inside a contained box — prefer `transform: scaleX()` over `width` for anything bar-like, and add `contain: layout paint` to the figure.
- **Compositor-only = `transform`, `opacity`, and registered numeric custom properties that feed them.** Everything else (`clip-path`, `filter`, `stroke-dashoffset`, `stroke-width`, `d`) costs paint. **`stroke-dashoffset` is a paint-property animation** — it is acceptable here only because the region is small, it runs once, and it stops. Don't run it on a full-bleed graphic during scroll.
- **`will-change` discipline:** each promoted layer costs GPU memory; over-promotion measurably *slows* low-memory devices. Rule: at most one or two promoted elements, added when the intro starts and **removed when `settled` flips** — never a blanket `will-change: transform` in a module.
- **Scroll-driven ≠ automatically free** (see T11): compositor promotion is property-dependent in both Chrome and Safari.
- **Don't sample geometry per frame** (T5). One `getTotalLength()`/`getPointAtLength()` pass at mount, cached.
- **Budget:** every technique marked ✅ above adds **0 bytes** of new dependency — it's inline SVG + CSS module + the `framer-motion` you already ship. The 500 kB ceiling is not in play unless someone reaches for GSAP/MorphSVG (don't) or a Lottie JSON (don't — a Lottie of this would be a raster-thinking answer to a vector-thinking problem, un-tokenisable, un-themeable, and it would put gold in a JSON file where the audit can't see it).

---

### 6. Applied shortlist for "draw the calibration card" (my recommendation to the design pass)

Compose **T10 (one-shot IO trigger) → T2 (`@property --t` as the single clock) → T1 (dash trace) + T6-constrained (cross-fade caliper states) + T3 (clip-path rule for the inscribed line), staggered by T8, terminated by T9**, with **T11 as an optional `@supports` enhancement** and the reduced-motion path from §4 authored first.

Concretely, one ~2.2 s, three-beat, ≤70-node inline SVG:
1. **0–700 ms** — a caliper descends onto a specimen and *closes* (dashed `open` arms cross-fade to solid `sourced` arms; no overshoot, `cubic-bezier(0.2,0,0,1)`). This teaches the mark the site wants read.
2. **700–1500 ms** — the reading it took is *ruled onto a card* as a mono line of provenance (T1 trace for the rule, T3 clip-wipe for the text) — this is literally "the certificate that ships with the instrument", drawn.
3. **1500–2200 ms** — beside it, the row where every other portfolio puts a proficiency bar draws as an **open caliper over 45° hatch** — dashed arms that never meet — and stays empty. The absence is the punchline, and it's the one beat that must survive into the settled and reduced-motion frames.

Gold appears in beat 2 **only** on the jaws that closed on a real source, and nowhere in beats 1 or 3 — which is exactly the lesson the animation exists to teach, so the motion and the palette rule reinforce each other rather than compete.

---

**Sources:** [MDN: animation-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline) · [MDN: CSS scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations) · [Native CSS Scroll-Driven Animations in 2026 (Mintec)](https://mintec.co/blog/css-scroll-driven-animacion/) · [Scroll-driven animations progressive enhancement (zko.world)](https://zko.world/blog/css-scroll-driven-animations-progressive-enhancement-quick-take) · [web.dev: @property is Baseline](https://web.dev/blog/at-property-baseline) · [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) · [MDN: d CSS property](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/d) · [CSS-Tricks: Animate SVG path changes in CSS](https://css-tricks.com/animate-svg-path-changes-in-css/) · [CSS-Tricks: SMIL is dead! Long live SMIL!](https://css-tricks.com/smil-is-dead-long-live-smil-a-guide-to-alternatives-to-smil-features/) · [MDN: SVG animation with SMIL](https://developer.mozilla.org/en-US/docs/Web/SVG/Guides/SVG_animation_with_SMIL) · [CSS-Tricks: How SVG line animation works](https://css-tricks.com/svg-line-animation-works/) · [Stefan Judis: pathLength makes SVG path animations easier](https://www.stefanjudis.com/today-i-learned/pathlength-makes-makes-svg-path-animations-easier-to-manage/) · [flubber (veltman)](https://github.com/veltman/flubber) · [Motion: SVG path morphing](https://motion.dev/tutorials/js-svg-path-morphing) · [How to implement performant SVG filters (svg-filter-lab)](https://github.com/MelodicBloom/svg-filter-lab/blob/main/docs/how-to-implement-performant-svg-filters-without-killing-your-frame-rate.md) · [ImageToSVG: SVG filter performance tips](https://imagetosvg.com/how-to/svg-filter-performance-tips) · [MDN: feDisplacementMap](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feDisplacementMap) · [web.dev: Stick to compositor-only properties and manage layer count](https://developers.google.com/web/fundamentals/performance/rendering/stick-to-compositor-only-properties-and-manage-layer-count) · [MDN: will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) · [CSS-Tricks: When is it right to reach for contain and will-change](https://css-tricks.com/when-is-it-right-to-reach-for-contain-and-will-change-in-css/) · [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) · [CSS-Tricks: No motion isn't always prefers-reduced-motion](https://css-tricks.com/nuking-motion-with-prefers-reduced-motion/) · [A11Y Project: primer to vestibular disorders](https://www.a11yproject.com/posts/understanding-vestibular-disorders/) · [Webflow accessibility checklist: avoid scrolljacking](https://webflow.com/accessibility/checklist/task/avoid-scrolljacking) · [SitePoint: Scrolljacking and accessibility](https://www.sitepoint.com/scrolljacking-accessibility/) · [ApexCharts: SVG vs Canvas charts, what actually matters (2026)](https://apexcharts.com/blog/svg-vs-canvas-charts/) · [Material: duration & easing](https://m1.material.io/motion/duration-easing.html) · [Motion vs GSAP bundle size](https://motion.dev/docs/gsap-vs-motion)