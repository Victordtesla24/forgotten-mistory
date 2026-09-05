# R-c5 synthesised review — https://forgotten-mistory.web.app/?gl=force (commit e64566e3, run v9-20260904T2312Z)
**Verdict: FAIL.** Three reviews merged (adversarial, composition, motion); all three returned FAIL independently. 17 items, deduplicated; every blocker and major retained with the reviewers' exact values. Tags: Verified = reviewer observed it and cites an artifact in this directory; Inferred/Assumed marked inline.
Sources: `adversarial-review.md`, `council-composition.md`, `council-motion.md`, `adversarial-browser.json`, `adversarial-browser2.json`, `motion-probe.json`, PNG captures under `capture/` and this directory.
## Blockers
- B-01 — "40+ practitioners" printed in five places (one under the gold "measured in production" mark) while the CV says "up to 40 resources" and never uses "practitioner" (adversarial, Verified: pdftotext public/docs/Vik_Resume_Final.pdf lines 136-138; app/data/siteContent.ts:114, :474). Inverts the evidence-grading contract (CLAUDE.md prime directive 3/4).

## Contradictions resolved
1. **Vitrine resting-card opacity** — motion said .42→.62, composition said .72 (dimmed 15px copy measures ≈3.9:1 on #131313). Sided with **composition**: the .72 figure is anchored to a WCAG 4.5:1 measurement; .62 was aesthetic. (M-04)
2. **Gold in #listen** — motion's acceptance demanded zero gold in #listen; composition wanted gold on the live GitHub URL. Sided with **composition**: CLAUDE.md prime directive 4 names live repository URLs as one of the three legitimate gold marks. Motion's check amended to 'no gold except the live GitHub URL'. (M-06, P-01)
3. **Skills gold discipline** — composition C3 (major) says gold dominates (~30 curves, 8/10 dots); motion Verified 'benchWires: 20, gold only on production-evidenced wires' and rates Skills PASS. Sided with **motion on the contract** (every gold wire is sourced, so gold still claims something) and **downgraded C3 to minor** on proportion: reduce gold mass, do not strip gold from sourced wires. (N-01)
4. **MiniVic launcher tab order** — adversarial proposed a low positive tabindex. Rejected as a WCAG 2.4.3 anti-pattern; direction is to move the launcher's DOM node to just after the skip link/nav (it is position:fixed so nothing moves visually) or add a second skip link. Finding and its 92-of-92 measurement retained verbatim. (M-05)
5. **Experience bar contrast** — composition (0.22→0.46, 1.88:1 measured) and motion ('raise rest bar luminance to clear 3:1') agree; merged into one item with composition's numbers. (M-03)

## Backlog, priority order (failures first)
| # | id | severity | section | source | files |
|---|----|----------|---------|--------|-------|
| 1 | B-01 | blocker | #hero #about #experience #skills (content / evidence grading) | adversarial | app/data/siteContent.ts, tests/content/content-check.spec.ts |
| 2 | M-01 | major | Global (reduced-motion path) | adversarial | app/globals.css, tests/a11y/ |
| 3 | M-02 | major | page chrome / all six sections (vertical spine) | composition | app/globals.css, components/sections/Hero/Hero.module.css, components/sections/Vitrine/Vitrine.module.css |
| 4 | M-03 | major | #experience (visualisation contrast + entry animation) | composition | components/sections/Experience/Experience.module.css, components/sections/Experience/Experience.tsx, components/sections/Experience/strata.glsl.ts, tests/e2e/experience-entry.spec.ts |
| 5 | M-04 | major | #vitrine (drawings trace + rail affordance + resting-card contrast) | motion | components/sections/Vitrine/Drawings.tsx, components/sections/Vitrine/Vitrine.module.css, tests/e2e/vitrine-trace.spec.ts |
| 6 | M-05 | major | MiniVic launcher + panel (global chrome) | adversarial | components/MiniVicBot.tsx, components/site/Navigation.tsx, app/layout.tsx, tests/a11y/, tests/e2e/ |
| 7 | M-06 | major | #listen (hierarchy + CTA weight) | composition | components/sections/Listen/Listen.module.css, components/sections/Listen/Listen.tsx |
| 8 | M-07 | major | #hero (1920 void + orphaned footnote) | composition | components/sections/Hero/Hero.module.css, components/sections/Hero/Hero.tsx |
| 9 | M-08 | major | #hero (390 ledger cramp + gutter bleed) | composition | components/sections/Hero/Hero.module.css |
| 10 | N-01 | minor | #skills (gold proportion) | composition | components/sections/Skills/Skills.module.css, components/sections/Skills/Bench.tsx, components/sections/Skills/Bench.module.css, tests/monochrome/ |
| 11 | N-02 | minor | #hero (atmosphere parallax + entrance timing + no-GL key light) | motion | components/sections/Hero/atmosphere.glsl.ts, components/sections/Hero/HeroAtmosphere.tsx, components/sections/Hero/Hero.module.css, tests/visual/hero-parallax.spec.ts |
| 12 | N-03 | minor | #about (keyboard stops + scroll-driven compass) | adversarial | components/sections/About/About.tsx, components/sections/About/Compass.module.css, tests/e2e/about-compass-scroll.spec.ts, tests/a11y/ |
| 13 | N-04 | minor | #hero (LCP candidate) | adversarial | components/sections/Hero/Hero.module.css, components/sections/Hero/Hero.tsx, tests/perf/ |
| 14 | N-05 | minor | Global typography (running measure) | composition | app/globals.css |
| 15 | P-01 | polish | #listen (entry beat) | motion | components/sections/Listen/Listen.tsx, components/sections/Listen/Listen.module.css, tests/e2e/listen-close.spec.ts |
| 16 | P-02 | polish | #hero / #listen (eyebrow rhythm) | composition | components/sections/Listen/Listen.module.css |
| 17 | P-03 | polish | Repo hygiene (untracked assets) | adversarial | public/assets/minivic-greeting.mp4, public/assets/minivic-greeting-2160p.mp4, components/sections/Hero/HeroAtmosphere.tsx, components/sections/Hero/atmosphere.glsl.ts |

## Items in full
### 1. B-01 — BLOCKER — #hero #about #experience #skills (content / evidence grading) (source: adversarial)

**Direction:** Edit app/data/siteContent.ts. Line 114: "(40+ onsite and offshore practitioners)" -> "(up to 40 onsite and offshore resources)". Line 474: "$5M+ program portfolio across 5+ squads and 40+ practitioners, delivered at 100% compliance." -> "... across 5+ squads and up to 40 resources, delivered at 100% compliance." Propagate "up to 40 resources" to the hero ledger source string, the About evidence string and the Skills bench-node/table evidence string (five rendered occurrences). Do NOT touch the separate, correct "workshops for 40+ leaders" (siteContent.ts:115). If "up to 40" is too weak for the Skills row, drop the headcount from that row rather than keep a lower-bound number under the gold "measured in production" mark. CV source: pdftotext public/docs/Vik_Resume_Final.pdf lines 136-138 "up to 40 resources"; "practitioner" appears 0 times.

**Acceptance:** curl -s 'https://forgotten-mistory.web.app/?gl=force' | grep -c '40+ practitioners' returns 0 and grep -c 'up to 40' returns 5 (or the headcount is absent from the Skills row). New content test asserts no rendered string matches /40\+\s*(practitioner|resource)/.

**Files:** `app/data/siteContent.ts`, `tests/content/content-check.spec.ts`

### 2. M-01 — MAJOR — Global (reduced-motion path) (source: adversarial)

**Direction:** grep -rn animate-ping app components to find the span with class "absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-400 opacity-75" (animationName ping, 1s, infinite). One-line fix: add `.animate-ping{animation:none!important}` inside the existing `@media (prefers-reduced-motion: reduce)` block in app/globals.css (covers future animate-ping too); or drop the class under the existing reduced-motion guard. Keep the dot visible — remove the motion, not the mark.

**Acceptance:** Playwright context reducedMotion:'reduce' on the live URL, after a full-page scroll: document.getAnimations().filter(a=>a.playState==='running').length === 0 (was 1: ping@SPAN in adversarial-browser2.json rmAfterScroll). Assertion added as a spec under tests/a11y/.

**Files:** `app/globals.css`, `tests/a11y/`

### 3. M-02 — MAJOR — page chrome / all six sections (vertical spine) (source: composition)

**Direction:** Five different left edges measured at 1440 (hero 176, about/experience/skills 96, vitrine header 168, vitrine cards 72, listen centred 352; at 1920 hero 416 vs 336). app/globals.css :root — add `--page-max: 78rem;` and `--page-gutter: clamp(1.5rem, 5vw, 5rem);` (--page-gutter is referenced in five modules and declared nowhere). components/sections/Hero/Hero.module.css:89 `.inner` max-width 68rem -> var(--page-max). components/sections/Vitrine/Vitrine.module.css:21 `.head` — delete the second `padding: 0 var(--page-gutter,…)` (the 78rem container at :19 already sets the inset); leave .rail:57 unchanged so cards land on the 96px line.

**Acceptance:** At 1440 and 1920, the eyebrow of all six sections and the left edge of the first vitrine card share one x within ±1px.

**Files:** `app/globals.css`, `components/sections/Hero/Hero.module.css`, `components/sections/Vitrine/Vitrine.module.css`

### 4. M-03 — MAJOR — #experience (visualisation contrast + entry animation) (source: composition)

**Direction:** Merged C2 (composition) + F1 (motion); both reviewers agree the rest bars fail 3:1 (measured 1.88:1: rgb(246 246 246/0.22) over rgb(255 255 255/0.055) over #0A0A0A). Contrast: Experience.module.css:169 `rgb(246 246 246 / 0.22)` -> `rgb(246 246 246 / 0.46)` (≈#787878 on #111 ≈ 4.4:1, still below the var(--white) hover at :181); :151 row `rgb(255 255 255 / 0.05)` -> `0.08`; label cell of the :112 grid `text-align:right; padding-right: var(--space-2)`. Entry: Experience.tsx IntersectionObserver (threshold 0.35, once) sets data-entered on ol.tracks; `.bar{transform-origin:left;transform:scaleX(0)}` `[data-entered] .bar{transform:scaleX(1);transition:transform 1160ms cubic-bezier(0.16,1,0.3,1);transition-delay:calc(var(--i)*90ms)}` with --i chronological (MYOB=0); duration labels fade at 320ms after bar lands. One 1px vertical span.playhead at 'today' in var(--gold) (CV-sourced date — the only gold in the section), draws over 720ms after the last bar. Hover/focus-within `.bar{transform:scaleY(1.6);transition:200ms cubic-bezier(0.22,1,0.36,1)}`. strata.glsl.ts uPointer*0.02 -> 0.035, add uScroll parallax 0.06. Reduced motion: transform:none, transition:none; no-GL: DOM chart is already the data.

**Acceptance:** Measured bar-fill vs panel contrast ≥ 3:1; row labels flush right against the axis at 1440 and 834. tests/e2e/experience-entry.spec.ts: scroll #experience into view; first .bar transform matrix a < 0.2 at t=0 and === 1 after 2200ms; exactly one element in #experience resolves to --gold (the playhead); under reducedMotion:'reduce' matrix is identity at t=0.

**Files:** `components/sections/Experience/Experience.module.css`, `components/sections/Experience/Experience.tsx`, `components/sections/Experience/strata.glsl.ts`, `tests/e2e/experience-entry.spec.ts`

### 5. M-04 — MAJOR — #vitrine (drawings trace + rail affordance + resting-card contrast) (source: motion)

**Direction:** Merged F2 (motion, major) + C7 (composition, minor). Drawings.tsx: pathLength="1" + class .stroke on every path/line/circle; `.stroke{stroke-dasharray:1;stroke-dashoffset:1}` `[data-lit] .stroke{stroke-dashoffset:0;transition:stroke-dashoffset 900ms cubic-bezier(0.16,1,0.3,1);transition-delay:calc(var(--k)*60ms)}` with --k draw order; <text> labels opacity 0->1 over 320ms after trace; lit plate translateY(-4px) at 320ms. Rail: Vitrine.module.css:55 `.rail` mask-image linear-gradient(90deg, transparent 0, #000 var(--page-gutter), #000 calc(100% - 4rem), transparent 100%) plus a visible 2px thumb track (--card-border track, --mist-400 thumb; thumb alpha .18 -> .32). Resting plate opacity: CONTRADICTION — motion proposed .42 -> .62, composition proposed .72 because dimmed 15px body copy measures ≈#7D7D7D on #131313 ≈ 3.9:1 (< 4.5:1). Sided with composition (.72): the number is anchored to a WCAG measurement, .62 is aesthetic. Gold stays only on live repo URLs. Reduced motion: `.stroke{stroke-dashoffset:0;transition:none}`.

**Acceptance:** tests/e2e/vitrine-trace.spec.ts: lit plate path strokeDashoffset is 1 on mount and 0 within 1400ms of data-lit; under reduced motion 0 immediately; .rail computed mask-image !== 'none'; third card masked rather than cut at 1440; dimmed body copy measured ≥ 4.5:1 (rest opacity ≈ 0.72).

**Files:** `components/sections/Vitrine/Drawings.tsx`, `components/sections/Vitrine/Vitrine.module.css`, `tests/e2e/vitrine-trace.spec.ts`

### 6. M-05 — MAJOR — MiniVic launcher + panel (global chrome) (source: adversarial)

**Direction:** Merged adversarial F3 (launcher is tab stop 92 of 92; fixed 64x64 at right:20 bottom:20, visible from first paint) + composition C8 (transcript sliced mid-word through 'lead' at the container bottom, no fade/scroll cue; puck drawn behind the open panel's corner) + C11 (launcher reads as an unlabelled empty puck). Tab order: adversarial suggested a low positive tabindex — rejected (positive tabindex is a WCAG 2.4.3 anti-pattern); instead render the launcher's DOM node immediately after the skip link / nav (it is position:fixed so visual placement is unchanged), or add a second skip link 'Skip to Mini Vic' next to 'Skip to the evidence'. Panel: components/MiniVicBot transcript container `mask-image: linear-gradient(#000 calc(100% - 2rem), transparent)`, `overflow-y:auto; scroll-behavior:smooth`, newest message pinned to the top of the visible box; panel `bottom: calc(var(--space-3) + 4rem); right: var(--space-3)` so the puck never sits inside the panel footprint. Affordance: persistent visible label pill 'Ask Mini Vic' (--fs-caption, letter-spacing .08em, --mist-200 on --card-bg) on ≥834px collapsing to the bare puck ≤520px; ring lifted to --card-border-hover. Also test (untested by adversarial): the greeting audio must NOT auto-play when the panel is opened under prefers-reduced-motion.

**Acceptance:** Tab walk from the top reaches [data-testid=minivic-toggle] within the first 12 stops with no positive tabindex anywhere in the DOM; no transcript message is cut mid-word at 1440/834; the launcher is fully outside the open panel; 'Ask Mini Vic' label visible at 1440 and hidden at 390; under reducedMotion:'reduce' opening the panel leaves every <audio>/<video> paused.

**Files:** `components/MiniVicBot.tsx`, `components/site/Navigation.tsx`, `app/layout.tsx`, `tests/a11y/`, `tests/e2e/`

### 7. M-06 — MAJOR — #listen (hierarchy + CTA weight) (source: composition)

**Direction:** Listen.module.css:38 `.title` and :56 `.sentence` are both var(--fs-title) = 56px at 1440, so the four-line pull-quote out-masses the h2. :56 `.sentence` font-size -> clamp(1.75rem, 3.2vw, 2.6rem) and max-width var(--measure-display) (26ch) -> 32ch so it sets in three lines. :96 give email and LinkedIn rows the hero action treatment (`border:1px solid var(--card-border); border-radius:999px; padding: var(--space-1) var(--space-3); font-family: var(--font-body); font-size: var(--fs-body); color: var(--white)`), keep phone and GitHub as mono text, and set `color: var(--gold)` on the live GitHub URL. CONTRADICTION with motion F4's acceptance ('zero elements inside #listen resolve to --gold'): sided with composition — CLAUDE.md prime directive 4 explicitly lists live repository URLs as one of the three places gold appears. Motion's acceptance is amended to 'no gold in #listen except the live GitHub URL link'.

**Acceptance:** The h2 is visibly the largest type in #listen; email and LinkedIn read as pill buttons at 1440 and 390; the GitHub URL is the only element in #listen resolving to --gold.

**Files:** `components/sections/Listen/Listen.module.css`, `components/sections/Listen/Listen.tsx`

### 8. M-07 — MAJOR — #hero (1920 void + orphaned footnote) (source: composition)

**Direction:** 1920x1080-hero.png: content stops at x≈1440, the 'self-reported, from my CV…' note floats at x=1264-1420 as an orphaned fourth ledger column. Hero.module.css:171 `.ledgerRow` grid-template-columns `minmax(0,1fr) minmax(0,15rem)` -> `minmax(0, 1fr)`; move the note beneath the ledger (`font-size: var(--fs-micro); color: var(--mist-400); margin-top: var(--space-2); max-width: var(--measure-read)`). M-02's 68rem -> var(--page-max) recovers 80px of the void.

**Acceptance:** At 1920 no hero element sits right of x≈1584 (78rem + gutter); the note sits under the three figures, left-flush with the first.

**Files:** `components/sections/Hero/Hero.module.css`, `components/sections/Hero/Hero.tsx`

### 9. M-08 — MAJOR — #hero (390 ledger cramp + gutter bleed) (source: composition)

**Direction:** 390x844-hero.png: figure and caption side by side with a ~28px dead gap after the caliper bracket around '≈92%'; caption 'ANZ · real-time telemetry platform' runs to x=390, breaking the 24px gutter. Hero.module.css:360 only collapses .ledger below 860px. Add `@media (max-width: 520px)` with `.ledgerItem{display:flex;flex-direction:column;align-items:flex-start;gap:var(--space-05)}` and `.ledgerCaption{max-width:100%;padding-right:var(--space-2);font-size:var(--fs-micro)}`.

**Acceptance:** At 390 no text renders within 24px of either edge; each figure sits directly above its own caption.

**Files:** `components/sections/Hero/Hero.module.css`

### 10. N-01 — MINOR — #skills (gold proportion) (source: composition)

**Direction:** CONTRADICTION: composition C3 (major) says gold is the dominant ink (≈30 leader curves + 8/10 node dots gold, section reads warm in the fullpage PNG at 25%); motion verified 'benchWires: 20, gold only on production-evidenced wires and their capability dots' and rates Skills PASS as the site's best visual. Sided with motion on the contract (every gold wire carries a production source, so gold still claims something) and downgraded C3 to minor on proportion. Direction: keep gold on sourced wires but reduce its visual mass — gold wire stroke 1px at rgb(var(--gold-rgb)/0.55) at rest, full --gold only on hover/focus; default grey wires `rgb(255 255 255 / 0.16)` at 1px. Merge the two intro paragraphs at Skills.module.css:51 into one at --fs-lede (or demote the second to About's mono provenance style; currently 83px apart vs the 40px header→lede gap used elsewhere). C10: Skills.module.css:123 label-row gap var(--space-1) -> var(--space-2) so count digits clear their leader lines. Motion F6 polish: hovered wire stroke-width 1 -> 1.6 at --motion-fast, end labels to --white, per-source wire count as title for AT.

**Acceptance:** expect(wireEls.filter(gold).length).toBe(productionLinks.length); one lede paragraph; ≥ 8px between digit and wire at 1280-1920; the section does not read warmer than the other five in the fullpage PNG at 25%.

**Files:** `components/sections/Skills/Skills.module.css`, `components/sections/Skills/Bench.tsx`, `components/sections/Skills/Bench.module.css`, `tests/monochrome/`

### 11. N-02 — MINOR — #hero (atmosphere parallax + entrance timing + no-GL key light) (source: motion)

**Direction:** Inferred (not pixel-diffed): pointer parallax uPointer*0.055 below perception at 1440; linear 1.5s uIntensity ramp lands after the 900ms heroRise. atmosphere.glsl.ts: uPointer 0.055 -> 0.09; lightPos parallax 0.35 -> 0.5; near-layer 1.15 -> 1.6 (far stays 0.18). HeroAtmosphere.tsx: pointer lerp delta*1.6 -> 2.2; replace linear ramp with intensity = 1-(1-min(elapsed/1.16,1))^3 from mount (85% at 500ms, full at 1160ms). Keep uTime*0.012 drift, 0.018 grain; no gold in scene. No-GL fallback: static radial-gradient top-left --ink-700 0% -> --ink-900 70% on the hero background. NOTE: HeroAtmosphere.tsx and atmosphere.glsl.ts are currently modified-uncommitted in the working tree (git status) — reconcile with that diff first.

**Acceptance:** tests/visual/hero-parallax.spec.ts: canvas region (0,0,720,450) with pointer at (100,100) vs (1340,800) after 600ms — pixelmatch diff ratio > 0.004 and < 0.08; under reducedMotion:'reduce' diff === 0; with WebGL disabled hero background-image !== 'none'.

**Files:** `components/sections/Hero/atmosphere.glsl.ts`, `components/sections/Hero/HeroAtmosphere.tsx`, `components/sections/Hero/Hero.module.css`, `tests/visual/hero-parallax.spec.ts`

### 12. N-03 — MINOR — #about (keyboard stops + scroll-driven compass) (source: adversarial)

**Direction:** Merged adversarial F4 (ten `<li class=About_item tabindex=0 data-side=role>` with no interactive role or accessible name — 10 of the 92 tab stops) + motion F5 (compass is hover-only via About.tsx:93 onMouseEnter; keyboard/touch readers never see it turn). Remove tabindex=0 from the ten li (or, if they must be focusable to drive the compass, give them role=button/tab with aria-label and make focus drive `active`). About.tsx: IntersectionObserver on list items (rootMargin '-45% 0px -45% 0px') sets active to the item nearest viewport centre when no pointer is over the list; on first section entry sweep the rose 360° -> 0° over 1160ms cubic-bezier(0.16,1,0.3,1). Keep 720ms per-item rotation. Reduced motion: no sweep, rotation snaps.

**Acceptance:** No focusable element in #about lacks an interactive role and accessible name (page tab-stop count drops by 10 unless the li become role=button/tab); with no pointer events, scrolling item 5 to viewport centre makes #about svg g[style] transform rotate(-144deg) within 900ms; under reduced motion transition-duration is 0s.

**Files:** `components/sections/About/About.tsx`, `components/sections/About/Compass.module.css`, `tests/e2e/about-compass-scroll.spec.ts`, `tests/a11y/`

### 13. N-04 — MINOR — #hero (LCP candidate) (source: adversarial)

**Direction:** PerformanceObserver reports the LCP element as the nav wordmark A 'VIKRAM.' at 1036ms (1440x900) / 580ms (390x844), CLS 0 — inside budget, but the hero h1 'Vikram Deshpande' is not the LCP candidate, consistent (Inferred) with an opacity-0 entrance excluding it. Make the h1 the LCP: start the heroRise from opacity ≥ 0.01 with a transform-only rise, or apply the entrance to a wrapper not the text node, so the largest text paints and counts.

**Acceptance:** PerformanceObserver largest-contentful-paint entry.element is the #hero h1 at 1440 and 390 with startTime < 2500ms and CLS < 0.05 (assert in tests/perf/).

**Files:** `components/sections/Hero/Hero.module.css`, `components/sections/Hero/Hero.tsx`, `tests/perf/`

### 14. N-05 — MINOR — Global typography (running measure) (source: composition)

**Direction:** globals.css:194 `--measure-read: clamp(58ch, 64ch + 0.4vw, 72ch)` resolves to ≈70ch at 1440 / 72ch at 1920 (visible in 1440x900-experience.png, three-line lede to x=818). Change to `clamp(56ch, 60ch + 0.3vw, 66ch)`; affects About, Experience, Skills, Vitrine ledes uniformly and fixes C12's hero statement wrap.

**Acceptance:** No running paragraph exceeds 66ch at 1280/1440/1920.

**Files:** `app/globals.css`

### 15. P-01 — POLISH — #listen (entry beat) (source: motion)

**Direction:** Listen.tsx: render .rule as two 50%-width halves; IntersectionObserver (threshold 0.6, once) sets data-entered; each half scaleX(0 -> 1) from its outer end over 720ms cubic-bezier(0.16,1,0.3,1) meeting at centre; a 3px --ink-300 dot fades in over 320ms at the meeting point (grey, not gold — the sentence makes no factual claim); the four .channel links translateY(6px -> 0) + opacity with 90ms stagger at 320ms. No WebGL/SVG. Reduced motion: existing animation:none block — rule full width, dot present, channels static. Do after M-06 so the CTA pills exist before they are animated.

**Acceptance:** tests/e2e/listen-close.spec.ts: .rule halves transform matrix a ≈ 0 before entry and 1 after 1000ms; no element in #listen other than the live GitHub URL resolves to --gold; under reduced motion halves are identity at t=0.

**Files:** `components/sections/Listen/Listen.tsx`, `components/sections/Listen/Listen.module.css`, `tests/e2e/listen-close.spec.ts`

### 16. P-02 — POLISH — #hero / #listen (eyebrow rhythm) (source: composition)

**Direction:** Hero eyebrow dot sits 10px from 'MELBOURNE' (Hero.module.css:120 gap var(--space-1), correct); Listen's kicker uses 8px. Align Listen's kicker gap to var(--space-1) so both eyebrows share one rhythm.

**Acceptance:** Hero and Listen eyebrow dot-to-text gap measure identical at 1440.

**Files:** `components/sections/Listen/Listen.module.css`

### 17. P-03 — POLISH — Repo hygiene (untracked assets) (source: adversarial)

**Direction:** public/assets/minivic-greeting.mp4 and minivic-greeting-2160p.mp4 exist untracked locally and HEAD 404 on the live origin; the deployed panel plays my-avatar.mp4 + minivic-greeting.mp3, so no live defect today. Also untracked: public/assets/explainer/, docs/delivery/evidence/v8-…; modified-uncommitted: HeroAtmosphere.tsx, atmosphere.glsl.ts, my-avatar.mp4, my-hero-avatar.mp4. Owner decision needed: commit (with the 500kB asset budget checked — the 2160p file is almost certainly over) or delete before any component references them.

**Acceptance:** git status --porcelain shows no untracked mp4 under public/assets; every asset referenced from components resolves 200 on the live origin; no asset over 500kB.

**Files:** `public/assets/minivic-greeting.mp4`, `public/assets/minivic-greeting-2160p.mp4`, `components/sections/Hero/HeroAtmosphere.tsx`, `components/sections/Hero/atmosphere.glsl.ts`

## Verified passing (do not re-spend cycles here)
- Deploy: served `<meta name="build-commit" content="e64566e3"/>` matches local HEAD; last-modified Sat, 05 Sep 2026 00:28:41 GMT (adversarial, Verified).
- Console: 0 errors, 0 pageErrors, 0 failed requests at 1440x900 and 390x844; only SwiftShader GL-driver warnings (adversarial + motion, Verified).
- /api/chat: HTTP 200 in 2.47s, returns published email/phone/LinkedIn/GitHub; provider openai, model gpt-4.1-mini (adversarial, Verified).
- Security headers: CSP frame-ancestors 'none', X-Frame-Options DENY, nosniff, HSTS preload, referrer-policy, permissions-policy on / and /api/chat. script-src still carries 'unsafe-inline' 'unsafe-eval' (recorded, not scored).
- Asset budgets: initial load pulls zero mp4; MiniVic open fetches my-avatar.mp4 1,096,301 B + minivic-greeting.mp3 198 KB, user-initiated; all images ≤ 500 KB (adversarial, Verified).
- axe-core wcag2a/2aa/21a/21aa: 0 violations at both viewports (scope caveat: axe covers ~1/3 of WCAG; N-03 is not caught by it).
- Six sections present, in order, headings visible at both viewports (adversarial, Verified).
- LCP 1036 ms / 580 ms, CLS 0 at 1440 / 390 (inside budget; see N-04 for the candidate-element caveat).
- Colour tokens achromatic (R=G=B) throughout app/globals.css :root; no cool-tinted grey (composition, Verified).
- About compass (hover) and Skills bench: PASS as signature visuals (motion, Verified); MiniVic panel opens with Hiring Fit / Engineering / Story modes and an employer-addressed greeting (motion, Verified).
- 'Payday Super / one of eight squads' and '$5M+ portfolio' match the CV; 'Sixteen years' is Inferred-but-defensible from MYOB May 2010 (adversarial).

## Not tested by any reviewer (stated, not implied)
- MiniVic greeting audio auto-play under prefers-reduced-motion when the panel is opened (folded into M-05's acceptance).
- Real-GPU rendering — all WebGL observed via SwiftShader on a headless VPS; hero parallax finding N-02 is Inferred, not pixel-diffed.
- Per-node black/white/gold contrast audit; the 'thirty-eight repositories' figure against GitHub.

## Next cycle (≤10 min)

One ≤10-minute increment that flips both adversarial gates: (1) edit app/data/siteContent.ts lines 114 and 474 plus the hero-ledger, About-evidence and Skills-bench strings so all five occurrences read "up to 40 resources" (drop the headcount from the Skills row if it must stay under the gold mark), with a content-check test asserting no rendered /40\+\s*(practitioner|resource)/; (2) add `.animate-ping{animation:none!important}` inside the existing @media (prefers-reduced-motion: reduce) block in app/globals.css with a tests/a11y spec asserting zero running animations after a full-page scroll under reducedMotion:'reduce'. Then tsc, lint, build:static, static audit 10/10, Playwright, deploy, re-curl for 0 hits of '40+ practitioners'.
