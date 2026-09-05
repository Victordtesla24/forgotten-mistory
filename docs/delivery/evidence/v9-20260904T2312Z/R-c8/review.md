# R-c8 merged review - run v9-20260904T2312Z - commit 9321998b

Target: https://forgotten-mistory.web.app/?gl=force

## Verdict: FAIL

All three reviewers returned FAIL. Composition raised two blockers on the page spine (C-01, C-02); Motion found two sections (#about, #experience) not meeting the one-cinematic-visualisation bar; Adversarial found the reduced-motion path is not motion-free (F-1). Gates that hold (Verified by adversarial, adversarial-report.json/headers-root.txt/api-chat.json): deploy commit 9321998b, 0 console errors/pageerrors/failed requests at 1440 and 390, axe 0 violations, CSP/XFO/HSTS present, asset budgets, six sections in order, /api/chat returns the published email, MiniVic launcher bottom-right with data-testid minivic-toggle.

## Blockers (fix before anything else)

1. C-01 (composition, Verified): six sections use three different content spines - eyebrow left edge 176/96/168/352 px at 1440 (416/336/416/592 at 1920). Hero.module.css:89 68rem, About/Experience/Skills/Vitrine 78rem, Listen.module.css:24 46rem.
2. C-02 (composition, Verified): Vitrine card rail sits 96 px (1440) / 336 px (1920) off its own heading spine, right-most card is cut mid-word with no mask, and card 02 (not 01) is lit at rest.

## Contradictions between reviewers, and how they were resolved

### Gold 'today' playhead in #experience (Motion F-1 step 3 vs Composition C-08 / CLAUDE.md prime directive 3 / Adversarial P-10)

Sided with: **composition + adversarial + CLAUDE.md doctrine**. Motion licensed gold on the grounds that CV dates are checkable. The site's own grading (Experience.tsx:176, Caliper state='self-reported', Verified by motion) classes those dates as self-reported, and CLAUDE.md directive 3 reserves gold for 'sourced' only; composition C-08 already shows gold over-extended in #skills. Kept every other part of Motion F-1 (uSpans/uProgress/uHover binding, scaleX entry beat, stagger, reduced-motion path). The playhead ships in var(--white); acceptance check changed from 'exactly one gold element' to 'zero elements with rgb(201,168,76) in #experience'.

### Deployed commit (Motion F-7 'local HEAD 4f1d659, live bundle unverified' vs Adversarial P-1)

Sided with: **adversarial**. Adversarial curl'd the live origin and read <meta name="build-commit" content="9321998b"/> from the served index.html (headers-root.txt, index.html in R-c8) - that is the live bundle. Motion only read its local checkout. The commit-hash half of F-7 is closed as Verified-clean; note the two reviewers' checkouts differed (4f1d659 vs 6f02332), so worktrees are not in sync - a process note, not a site defect.

### Colour of the MiniVic launcher rim indicator (Motion F-7 'gold arc, Inferred' vs Composition C-04 '3px rim dot' vs Adversarial F-1 class dump)

Sided with: **adversarial**. Adversarial's Verified DOM dump names the indicator: span.animate-ping.bg-zinc-400 over span.bg-zinc-500 (components/MiniVicBot.tsx:1568-1569). Tailwind zinc, not --gold. However zinc-400 (#a1a1aa) and zinc-500 (#71717a) are NOT achromatic (R=G=B fails) - Inferred from the class names, not pixel-sampled - so the launcher does breach the monochrome doctrine that composition C-12 verified at the token level, just not with gold. Folded into C-04 with an added acceptance check that every colour inside the launcher is R=G=B or --gold-free.

### 'NO SCORES' label in #about (Composition C-11 'raise it to --mist-400' vs Motion F-2 'remove the -1 state')

Sided with: **motion**. Motion's fix removes the contradiction with the heading 'Ten dimensions, answered'; recolouring the contradiction only makes it louder. C-11's baseline-alignment half stands on its own.

### Vitrine unlit-plate rest opacity

Sided with: **both agree**. Composition C-02 and Motion F-5 both specify 0.62. Motion's ~0.45 current value is Inferred (not measured); composition's is read from the PNG. Single item.

## Prioritised backlog (failures first, 1 = build first)

| # | id | section | severity | tag | source | one line |
|---|---|---|---|---|---|---|
| 1 | C-01 | page (all six sections) | blocker | Verified | composition | Three different content spines: eyebrow left edge Hero 176px, About/Experience/Skills 96px, Vitrine header 168px, Listen 352px at 1440 (416/336/416/592 at 1920) |
| 2 | C-02 | #vitrine | blocker | Verified | composition | Card rail on a different spine from its heading (heading left x=416, card 01 border x=80 at 1920; 168 vs 72 at 1440); right-most card cut mid-word ('Prompt Reconstructio...') with a hard edge and no rail affordance; card 02 'AB Entertainment' is lit at rest while 01/03/04 are dimmed |
| 3 | ADV-F-1 | global chrome (MiniVic launcher) / reduced-motion path | major | Verified | adversarial | An infinite CSS animation keeps running under prefers-reduced-motion: reduce - the Tailwind animate-ping pip on the MiniVic launcher (components/MiniVicBot.tsx:1568) loops at 1s with iterations Infinity |
| 4 | MOT-F-2 | #about | major | Verified | motion | At rest (no hover) the compass reads '- / NO SCORES' for the whole section, contradicting the heading 'Ten dimensions, answered' |
| 5 | MOT-F-1 | #experience | major | Verified | motion | The section's WebGL signature (CareerStrata) is decoration by its own admission and does not narrate 'Sixteen years, to scale'; bars are static grey with no entry beat |
| 6 | C-03 | #experience | major | Verified | composition | Bar duration labels are absolutely positioned outside their track box with no room reserved, so they overflow the chart card and clip at 834 |
| 7 | C-04 | global chrome (MiniVic launcher) | major | Verified | composition | The closed MiniVic launcher is an empty ring - no glyph, no avatar, no label - reading as a loading spinner |
| 8 | C-05 | global chrome (MiniVic panel) | major | Verified | composition | The open panel covers the H1 (the LCP element) and its transcript is cut horizontally mid-sentence with no fade |
| 9 | C-06 | #hero at 390 | major | Verified | composition | At 390 the portrait tile (x=278-366, y=96-184) sits beside the eyebrow (ends x=252) and forces the H1 to break 'Vikram / Deshpande'; the third stat's provenance caption 'ANZ - real-time telemetry platform' reaches x=390 and is cut at y=746 while the left gutter is 24px (390x844-hero.png) |
| 10 | C-08 | #skills | major | Verified | composition | Gold is used as a mass, not a mark: ~25 --gold strands sweep 900px of the section plus gold node dots on every right-hand label (1440x900-skills.png) |
| 11 | C-07 | #hero / nav | major | Verified | composition | Two near-identical 'Download CV' buttons in one viewport: nav pill at (1141-1273, y=30-65) and hero outline button at (378-531, y=758-802) in 1440x900-hero.png |
| 12 | ADV-F-3 | global chrome (MiniVic launcher) | minor | Inferred | adversarial | Two instruments disagree on whether the launcher sits inside an aria-hidden='true' subtree: adv2.mjs el.closest('[aria-hidden="true"]') reported 'yes' (closest('[inert]') 'no'), while axe (wcag2a/2aa/21a/21aa incl |
| 13 | ADV-F-2 | global chrome (MiniVic launcher) | minor | Verified | adversarial | The MiniVic launcher is the 93rd tab stop and last of 100 focusable elements (adv2.mjs MV_TAB_STOPS 93, MV_DOM {total:100, idx:99}); a keyboard user traverses the entire page before reaching the chatbot the brief names as the employer/client channel |
| 14 | MOT-F-3 | #hero | minor | Verified | motion | No-WebGL / reduced-motion hero has zero depth cue - flat near-black ground (mobile-rm-nogl-hero.png, 390x844@2x, getContext stubbed null: canvases:0, fallbackEls:0) |
| 15 | C-09 | #listen | minor | Verified | composition | Contact lines (email, +61 phone, LinkedIn) are set in mono at --fs-small 14px in --mist-400 grey at x=352 with the entire right half of the 1440 frame empty (1440x900-listen.png) - the page's business end is its quietest type |
| 16 | C-11 | #about | minor | Verified | composition | Dial and list do not share a baseline: list's first hairline rule at y=600, dial's outer ring begins y~615, '01' tick at y=655 (1440x900-about.png) |
| 17 | ADV-F-4 | #experience / #about copy | polish | Verified | adversarial | Site headline tenure is one year above the CV's own headline: page says 'Sixteen years' (app/data/portfolio/vitrine.ts:116 heading; siteContent.ts:69 'Over sixteen years') while public/docs/Vik_Resume_Final.pdf line 3 says '15+ year' (pdftotext -layout) |
| 18 | MOT-F-4 | #listen | polish | Verified | motion | The caliper-close beat (jaws close 1160ms emphasized, rule draws after) is live and correct - Listen.module.css:137-185, listen-t2.png |

### 1. C-01 - BLOCKER - page (all six sections) (Verified, from composition)

**Finding.** Three different content spines: eyebrow left edge Hero 176px, About/Experience/Skills 96px, Vitrine header 168px, Listen 352px at 1440 (416/336/416/592 at 1920). Measured off 1440x900-*.png and 1920x1080-*.png captures.

**Direction.** app/globals.css :root - add `--page-max: 78rem;`. Hero.module.css:89 `.inner{max-width:68rem}` -> `max-width:var(--page-max)`; About.module.css:20, Experience.module.css:18, Skills.module.css:20, Vitrine.module.css:19 `78rem` -> `var(--page-max)`; Listen.module.css:24 `.inner{max-width:46rem}` -> `max-width:var(--page-max)` and move the 46rem onto `.quote{max-width:46rem}` only (its `max-width:var(--measure-display)` at line 63 stays). Add `padding-inline: var(--page-gutter, clamp(var(--space-3),5vw,var(--space-10)))` to Hero.module.css:21 `.section`, which currently sets block padding only.

**Files.** `app/globals.css`, `components/sections/Hero/Hero.module.css`, `components/sections/About/About.module.css`, `components/sections/Experience/Experience.module.css`, `components/sections/Skills/Skills.module.css`, `components/sections/Vitrine/Vitrine.module.css`, `components/sections/Listen/Listen.module.css`

**Acceptance.** At 390/834/1280/1440/1920, getBoundingClientRect().left of each section's eyebrow (#hero, #about, #experience, #skills, #vitrine, #listen) is equal to within 1px. Add as tests/overhaul/page-spine.spec.ts.

### 2. C-02 - BLOCKER - #vitrine (Verified, from composition)

**Finding.** Card rail on a different spine from its heading (heading left x=416, card 01 border x=80 at 1920; 168 vs 72 at 1440); right-most card cut mid-word ('Prompt Reconstructio...') with a hard edge and no rail affordance; card 02 'AB Entertainment' is lit at rest while 01/03/04 are dimmed. Cause: Vitrine.module.css:13 `.section{padding: clamp(...) 0}` + line 57 `.rail` has no max-width while `.header` is centred inside 78rem. Merged with Motion F-5 (unlit opacity 0.62, drawings trace-on) which touches the same rules.

**Direction.** Vitrine.module.css `.rail` - add `max-width: var(--page-max); margin-inline: auto;` and `mask-image: linear-gradient(to right, #000 0 calc(100% - 6rem), transparent 100%);`. Add a rail thumb under the cards: 2px track `background: var(--ink-500)`, thumb `width:6rem; height:2px; background: var(--mist-400); border-radius:1px`, translated by scrollLeft/scrollWidth. `.plate:not([data-lit])` opacity 0.62. In Vitrine.tsx default the lit card index to 0, not 1. (Polish, same files, from Motion F-5: on [data-lit] trace each Drawings.tsx path via stroke-dasharray/stroke-dashoffset over 720ms cubic-bezier(0.16,1,0.3,1), stagger 40ms per path; reduced motion sets dashoffset 0 immediately. Gold remains only on live repository URLs.)

**Files.** `components/sections/Vitrine/Vitrine.module.css`, `components/sections/Vitrine/Vitrine.tsx`, `components/sections/Vitrine/Drawings.tsx`, `components/sections/Vitrine/Drawings.module.css`

**Acceptance.** At 1440 and 1920 the first card's border-left equals the heading's left (within 1px); the right-most partial card fades rather than cuts (mask-image computed non-'none'); card 01 carries [data-lit] on first paint; after scrollBy 600px on .rail exactly one [data-lit]; unlit plate computed opacity >= 0.6; lit plate svg paths reach stroke-dashoffset 0 by 900ms.

### 3. ADV-F-1 - MAJOR - global chrome (MiniVic launcher) / reduced-motion path (Verified, from adversarial)

**Finding.** An infinite CSS animation keeps running under prefers-reduced-motion: reduce - the Tailwind animate-ping pip on the MiniVic launcher (components/MiniVicBot.tsx:1568) loops at 1s with iterations Infinity. adv2.mjs with reducedMotion:'reduce' printed RM_ANIM [{tag:SPAN, cls:'... animate-ping ... bg-zinc-400', anim:'ping', dur:'1s'}]; adversarial-report.json rm1440.autoplay.runningCount = 1, iter 'Infinity'. Everything else in the reduced-motion path is clean: both <video> paused with empty currentSrc, #hero h1 at opacity 1 / transform none.

**Direction.** In app/globals.css, inside the existing @media (prefers-reduced-motion: reduce) block, add `.animate-ping { animation: none !important; }` so the pip stays visible (status dot) but stops moving. Keep the static sibling span at MiniVicBot.tsx:1569 as the visible resting state. Do not delete the animate-ping class from the TSX; the full-motion path keeps the 1s ping.

**Files.** `app/globals.css`, `components/MiniVicBot.tsx`, `tests/a11y/`

**Acceptance.** Playwright context reducedMotion:'reduce', 1440x900 and 390x844, after load + 3000ms: `document.getAnimations().filter(a => a.playState === 'running').length` === 0 (currently 1). Add as a spec under tests/a11y/.

### 4. MOT-F-2 - MAJOR - #about (Verified, from motion)

**Finding.** At rest (no hover) the compass reads '- / NO SCORES' for the whole section, contradicting the heading 'Ten dimensions, answered'. Compass.tsx:220-223 renders '-' and 'NO SCORES' when active<0; About.tsx:93-94 sets active only onMouseEnter/onFocus. about-hover.png confirms the rotate-to-sector beat works on hover (720ms emphasized). Supersedes the 'NO SCORES' recolour half of Composition C-11.

**Direction.** About.tsx: on first IntersectionObserver hit (>=40% of the SVG, once) step active 0->9 at 110ms per step (1100ms total) with rose transition temporarily transform 320ms cubic-bezier(0.22,1,0.36,1), then settle on index 0 and restore 720ms cubic-bezier(0.16,1,0.3,1). Rest state after sweep = index 0 (drop the -1 / 'NO SCORES' state; rest on last-hovered). Reduced motion: set active=0 immediately, no sweep. Add roving tabindex + ArrowUp/ArrowDown across the ten <li>. No gold.

**Files.** `components/sections/About/About.tsx`, `components/sections/About/Compass.tsx`, `components/sections/About/Compass.module.css`

**Acceptance.** After #about scrolls into view: expect(page.locator('#about svg text', {hasText:'NO SCORES'})).toHaveCount(0) at 1400ms and expect(page.locator('#about [data-active]')).toHaveCount(1); under reducedMotion:'reduce' same assertions at 100ms.

### 5. MOT-F-1 - MAJOR - #experience (Verified, from motion)

**Finding.** The section's WebGL signature (CareerStrata) is decoration by its own admission and does not narrate 'Sixteen years, to scale'; bars are static grey with no entry beat. strata.glsl.ts header: 'It encodes nothing, and is written not to look as though it does.' experience-hover.png shows barely-visible grey strata behind static grey bars. CONTRADICTION RESOLVED: Motion's gold 'today' playhead is rejected - Experience.tsx:176 grades the dates self-reported, and gold is licensed for sourced figures only (CLAUDE.md directive 3; composition C-08). Playhead ships in var(--white).

**Direction.** CareerStrata.tsx/strata.glsl.ts: add uniforms uSpans (vec4[8] left,width,rowY,0 in 0..1 chart space), uProgress (0..1), uHover (row index); per row brighten sediment band +0.10 * step(spanLeft,uv.x) * step(uv.x, spanLeft+spanWidth*uProgress), hover row +0.06 lerped on CPU at delta*1.4. Experience.module.css .trackBar: mount at transform:scaleX(0), transform-origin:left, grow to scaleX(1) on 35% intersection with transition transform 900ms cubic-bezier(0.16,1,0.3,1), stagger 60ms per row (8 rows, settled by 1320ms). Add 1px vertical 'today' playhead + 4px tick in var(--white) (NOT --gold) at right chart edge. Reduced motion: keep experienceFade 320ms opacity, no scaleX. Keep hover scaleY(1.5455) at 200ms. Shader stays one quad, 3 noise lookups/pixel; keep DPR cap.

**Files.** `components/sections/Experience/CareerStrata.tsx`, `components/sections/Experience/strata.glsl.ts`, `components/sections/Experience/Experience.module.css`, `components/sections/Experience/Experience.tsx`, `tests/overhaul/experience-signature.spec.ts`

**Acceptance.** tests/overhaul/experience-signature.spec.ts: scroll #experience into view; at 100ms first .trackBar scaleX < 0.5; all bars reach matrix(1,0,0,1,0,0) within 1500ms; ZERO elements in #experience with computed color/background/stroke rgb(201,168,76); a playhead element exists with computed color rgb(246,246,246) or var(--white) equivalent; under reducedMotion:'reduce' no bar ever has scaleX < 1.

### 6. C-03 - MAJOR - #experience (Verified, from composition)

**Finding.** Bar duration labels are absolutely positioned outside their track box with no room reserved, so they overflow the chart card and clip at 834. 834x1194-experience.png: chart card right border x=793; label '6 mo' runs x=800 to 830 - outside the card, 4px from the viewport edge. 1440x900-experience.png: grid and '6 mo' label run to x~1382 while the 78rem column ends at 1344. Cause: Experience.module.css:183-186 `.trackYears{position:absolute; left: calc(100% + var(--space-1))}`. Build in the same pass as MOT-F-1 (same CSS module).

**Direction.** Experience.module.css - `.trackLine` add `padding-right: 4.5rem;`. `.trackYears` add `max-width: 4rem;` and under `@media (max-width: 52rem)` switch to `position: static; margin-left: var(--space-1);`. Bar weight: `.trackBar::before` rest colour -> `var(--mist-400)` at `opacity: 0.72` (keep `var(--white)` on hover/active).

**Files.** `components/sections/Experience/Experience.module.css`

**Acceptance.** At 390/834/1280/1440/1920 every .trackYears box satisfies right <= chartCard.right - 16, and document.documentElement.scrollWidth === innerWidth.

### 7. C-04 - MAJOR - global chrome (MiniVic launcher) (Verified, from composition)

**Finding.** The closed MiniVic launcher is an empty ring - no glyph, no avatar, no label - reading as a loading spinner. Visible in every closed-state capture (1440x900-hero/about/experience/skills/vitrine/listen.png, 1920x1080-vitrine.png): ~64px circle at approx (1388,848) containing only a 3px rim dot. Merged with Motion F-7 (rim indicator colour): the dot is span.bg-zinc-400/zinc-500 (MiniVicBot.tsx:1568-1569, Verified by adversarial), not gold - but Tailwind zinc is not R=G=B (Inferred from class names, not pixel-sampled), so it breaches the achromatic rule composition C-12 verified at token level.

**Direction.** components/MiniVicBot.tsx plus its chrome block in app/globals.css: fill the ring with the grayscale portrait already used in the open panel header (`filter: grayscale(1) contrast(1.05); border-radius:50%`) inset 2px inside `1px solid var(--card-border)`, or set a 20px speech-mark glyph in `var(--white)`. Add a label pill to its left at >=834: text 'Ask Mini Vic', `font-size: var(--fs-caption); letter-spacing: var(--ls-caption); color: var(--mist-200); background: rgb(10 10 10 / 0.72); padding: var(--space-1) var(--space-2); border-radius: 999px`, icon-only below 834. Replace bg-zinc-400/bg-zinc-500 on the pip spans with token colours (var(--mist-400) / var(--ink-500)). Keep data-testid minivic-toggle and a 44px hit area. No --gold on it.

**Files.** `components/MiniVicBot.tsx`, `app/globals.css`

**Acceptance.** A 1440 closed-state screenshot shows a recognisable, labelled chat affordance; no element inside [data-testid=minivic-toggle] has computed stroke/color/background rgb(201,168,76); every computed colour inside the launcher satisfies R==G==B (add to tests/monochrome/).

### 8. C-05 - MAJOR - global chrome (MiniVic panel) (Verified, from composition)

**Finding.** The open panel covers the H1 (the LCP element) and its transcript is cut horizontally mid-sentence with no fade. 1440x900-minivic-open.png: panel occupies x=988 to 1420, y=225 to 815 and obscures the final characters of 'Vikram Deshpande'; the reply ends '...the ATO work, or how I lead' sliced at y=692 by the scroll box.

**Direction.** MiniVic panel styles: `bottom: calc(var(--space-3) + 4.5rem); right: var(--space-3); max-height: min(34rem, calc(100vh - 12rem));` so at 900px tall the panel top lands near y=360, clear of the name. Transcript scroller: add `mask-image: linear-gradient(to bottom, #000 0 calc(100% - 2rem), transparent);` and `padding-bottom: var(--space-2)`. Header text over the photo: add `text-shadow: 0 1px 3px rgb(0 0 0 / 0.65)` or a `linear-gradient(to top, rgb(10 10 10 / 0.85), transparent)` scrim behind the 'Vikram's AI clone - ask me anything' block.

**Files.** `components/MiniVicBot.tsx`, `app/globals.css`

**Acceptance.** With the panel open at 1440x900 and 1280x800, no part of #hero h1's bounding box is overlapped by the panel; the last transcript line ends cleanly or fades (mask-image computed non-'none' on the scroller).

### 9. C-06 - MAJOR - #hero at 390 (Verified, from composition)

**Finding.** At 390 the portrait tile (x=278-366, y=96-184) sits beside the eyebrow (ends x=252) and forces the H1 to break 'Vikram / Deshpande'; the third stat's provenance caption 'ANZ - real-time telemetry platform' reaches x=390 and is cut at y=746 while the left gutter is 24px (390x844-hero.png). Includes C-10 (ragged stat captions at 1440).

**Direction.** components/sections/Hero/Hero.module.css, inside `@media (max-width: 30rem)`: `.portrait { position: static; width: 100%; max-width: 9rem; margin: var(--space-3) 0 0; }` placed after the lede so the H1 owns the full 342px measure. `.figureNote` (line 234) and the provenance rule (line 249): add `max-width: 100%; overflow-wrap: anywhere;` and give `.ledger` `padding-inline: var(--space-3)` at <=30rem. At >=52rem set `.figureNote { min-height: calc(2 * 1.55 * var(--fs-caption)) }` so the three captions share one two-line box, and set the footnote `margin-top: var(--space-3)` (C-10).

**Files.** `components/sections/Hero/Hero.module.css`, `components/sections/Hero/Hero.tsx`

**Acceptance.** At 390: document.documentElement.scrollWidth === 390; no caption box extends past x=366; H1 sets one line per word with the portrait below the lede. At 1440: the three .figureNote boxes share the same height and the footnote top is 24px below the tallest.

### 10. C-08 - MAJOR - #skills (Verified, from composition)

**Finding.** Gold is used as a mass, not a mark: ~25 --gold strands sweep 900px of the section plus gold node dots on every right-hand label (1440x900-skills.png). Each strand is a sourced edge so the audit passes in code, but perceptually it reads as a gold theme - the failure mode app/globals.css:21-33 names. Merged with Motion F-6 (wire hover) which is the complementary half: dim field at rest, hovered path lit.

**Direction.** components/sections/Skills/Skills.module.css / Bench.module.css wire rules: rest-state sourced strands `stroke: var(--gold); stroke-opacity: 0.28; stroke-width: 1;`; non-sourced strands `stroke: var(--ink-500); stroke-opacity: 0.35`. On .node:hover raise that node's wires to `stroke-opacity: 1; stroke-width: 1.5` (gold stays gold) and others to 0.18 over 200ms cubic-bezier(0.22,1,0.36,1); reduced motion keeps colour-only transition. Keep terminal node dots gold at full opacity.

**Files.** `components/sections/Skills/Bench.module.css`, `components/sections/Skills/Bench.tsx`, `components/sections/Skills/Skills.module.css`

**Acceptance.** At rest at 1440 the summed rendered length of paths with stroke-opacity > 0.5 and stroke rgb(201,168,76) is less than that of neutral paths (or: no gold path at rest has stroke-opacity > 0.3); hover a capability node: >=1 path with stroke-opacity 1 and >=1 with stroke-opacity 0.18 within 300ms.

### 11. C-07 - MAJOR - #hero / nav (Verified, from composition)

**Finding.** Two near-identical 'Download CV' buttons in one viewport: nav pill at (1141-1273, y=30-65) and hero outline button at (378-531, y=758-802) in 1440x900-hero.png. The hero primary 'See the evidence' competes with a duplicate of its own sibling.

**Direction.** components/site/Navigation.tsx + its block in app/globals.css: demote the nav action to text until the hero has left the viewport - remove the pill border/background, `color: var(--mist-200)`, `font-size: var(--fs-small)`, `letter-spacing: var(--ls-small)`; restore the pill only on `[data-scrolled]`. Or, cheaper: change the nav label to 'CV' and keep the pill.

**Files.** `components/site/Navigation.tsx`, `app/globals.css`

**Acceptance.** At 1440 with scrollY 0, the hero frame contains exactly one filled CTA and one outline CTA; the nav control's computed border-style is 'none' or its text is 'CV'.

### 12. ADV-F-3 - MINOR - global chrome (MiniVic launcher) (Inferred, from adversarial)

**Finding.** Two instruments disagree on whether the launcher sits inside an aria-hidden='true' subtree: adv2.mjs el.closest('[aria-hidden="true"]') reported 'yes' (closest('[inert]') 'no'), while axe (wcag2a/2aa/21a/21aa incl. aria-hidden-focus) reported 0 violations at both viewports (adversarial-report.json). MiniVicBot.tsx:1536-1544 carries no aria-hidden on the button. A focusable control inside aria-hidden would be a serious WCAG failure; the ambiguity itself needs closing. Cheap - do it in the same pass as C-04.

**Direction.** Playwright eval at 1440x900: walk the launcher's ancestor chain printing {tag, className, aria-hidden}. If a real ancestor in components/MiniVicBot.tsx or app/layout.tsx carries aria-hidden='true', remove it from the wrapper and put it only on the decorative pip spans at MiniVicBot.tsx:1568-1569. If the match is a Next.js portal node absent from production, record that and close as a false signal.

**Files.** `components/MiniVicBot.tsx`, `app/layout.tsx`

**Acceptance.** Ancestor-chain eval shows no element with aria-hidden='true' between the launcher button and <html>, while axe continues to report 0 violations for aria-hidden-focus at 1440x900 and 390x844.

### 13. ADV-F-2 - MINOR - global chrome (MiniVic launcher) (Verified, from adversarial)

**Finding.** The MiniVic launcher is the 93rd tab stop and last of 100 focusable elements (adv2.mjs MV_TAB_STOPS 93, MV_DOM {total:100, idx:99}); a keyboard user traverses the entire page before reaching the chatbot the brief names as the employer/client channel. Skip link is stop 1, hero actions 6-7.

**Direction.** Extend the skip-link pattern rather than reordering the DOM: add a second visually-hidden-until-focused anchor next to 'Skip to the evidence' in components/site/Navigation.tsx reading 'Ask Mini Vic', whose onClick focuses toggleRef.current (MiniVicBot.tsx:1537) and calls setIsOpen(true). Same style rule as the existing skip link (2px solid focus outline).

**Files.** `components/site/Navigation.tsx`, `components/MiniVicBot.tsx`

**Acceptance.** Tab from the top at 1440x900: within the first 3 tab stops one focused element exposes the accessible name 'Ask Mini Vic'; pressing Enter leaves document.activeElement with data-testid='minivic-toggle' and the panel open.

### 14. MOT-F-3 - MINOR - #hero (Verified, from motion)

**Finding.** No-WebGL / reduced-motion hero has zero depth cue - flat near-black ground (mobile-rm-nogl-hero.png, 390x844@2x, getContext stubbed null: canvases:0, fallbackEls:0). Readable and correct, but the fallback is 'nothing' rather than a still of the same scene.

**Direction.** Hero.module.css .stage (when canvas absent): background radial-gradient(60% 55% at 22% 30%, rgb(255 255 255 / 0.11), transparent 70%) + linear-gradient(to top, rgb(255 255 255 / 0.05), transparent 45%) + inline SVG feTurbulence baseFrequency 0.9 grain at opacity 0.06 mix-blend-mode:screen - matches shader key lightPos(-0.62,0.40). Static. Under GL the layer fades to 0 over 720ms cubic-bezier(0.16,1,0.3,1) as uIntensity reaches 1; HeroAtmosphere.tsx:102 raise intensity ramp from delta*0.65 (~1540ms) to delta*0.87 (~1150ms).

**Files.** `components/sections/Hero/Hero.module.css`, `components/sections/Hero/HeroAtmosphere.tsx`, `components/sections/Hero/Hero.tsx`

**Acceptance.** With getContext stubbed null: #hero canvas count 0 and getComputedStyle(.stage).backgroundImage contains 'radial-gradient'; with GL: canvas exists and .stage opacity reaches 0 within 1500ms.

### 15. C-09 - MINOR - #listen (Verified, from composition)

**Finding.** Contact lines (email, +61 phone, LinkedIn) are set in mono at --fs-small 14px in --mist-400 grey at x=352 with the entire right half of the 1440 frame empty (1440x900-listen.png) - the page's business end is its quietest type. Depends on C-01 (Listen .inner -> --page-max).

**Direction.** Listen.module.css `.contactItem` (line 205): `font-size: var(--fs-lede)`, `color: var(--white)`, keep --font-mono, `line-height: var(--lh-snug)`; set the email as a filled pill matching the hero primary (`background: var(--white); color: var(--ink-900); padding: var(--space-2) var(--space-4); border-radius: 999px`). Lay the four contact routes as `grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: var(--space-4)` across the full column. Do not add a second motion beat (Motion F-4: the caliper-close is the single correct beat).

**Files.** `components/sections/Listen/Listen.module.css`, `components/sections/Listen/Listen.tsx`

**Acceptance.** Email and LinkedIn are the second-highest-contrast elements in #listen after the pull-quote; no >30% empty right column at 1440 (rightmost contact item right edge > 0.7 * innerWidth).

### 16. C-11 - MINOR - #about (Verified, from composition)

**Finding.** Dial and list do not share a baseline: list's first hairline rule at y=600, dial's outer ring begins y~615, '01' tick at y=655 (1440x900-about.png). (The 'raise NO SCORES to --mist-400' half is superseded by MOT-F-2, which removes that state.)

**Direction.** About.module.css:125 dial wrapper (`max-width: 24rem`): `align-self: start; margin-top: 0;` so the grid row starts both children at the same y.

**Files.** `components/sections/About/About.module.css`

**Acceptance.** At 1440 the dial svg's bounding top equals the first list item's top within 4px.

### 17. ADV-F-4 - POLISH - #experience / #about copy (Verified, from adversarial)

**Finding.** Site headline tenure is one year above the CV's own headline: page says 'Sixteen years' (app/data/portfolio/vitrine.ts:116 heading; siteContent.ts:69 'Over sixteen years') while public/docs/Vik_Resume_Final.pdf line 3 says '15+ year' (pdftotext -layout). Role dates (May 2010 onward) do support ~16.3y, so the number is defensible; the two documents' headline figures disagree.

**Direction.** Pick one figure and use it in both places: either change the site heading/copy to 'Fifteen-plus years' / '15+ years', or update the CV PDF headline to 'Sixteen-year' so site and CV agree. Content-only change under app/data/portfolio/ and app/data/siteContent.ts; extend tests/content/content-check.spec.ts to assert the site's tenure figure equals the CV headline figure.

**Files.** `app/data/portfolio/experience.ts`, `app/data/portfolio/vitrine.ts`, `app/data/siteContent.ts`, `public/docs/Vik_Resume_Final.pdf`, `tests/content/content-check.spec.ts`

**Acceptance.** pdftotext of the CV headline and the rendered #experience h2 state the same tenure figure; content-check spec asserts it.

### 18. MOT-F-4 - POLISH - #listen (Verified, from motion)

**Finding.** The caliper-close beat (jaws close 1160ms emphasized, rule draws after) is live and correct - Listen.module.css:137-185, listen-t2.png. Keep it as the single beat. Refinement only: the reading '-' should arrive after the jaws close.

**Direction.** Listen.module.css .reading: opacity 0->1 over 320ms cubic-bezier(0.22,1,0.36,1) with delay 1160ms; under prefers-reduced-motion draw at once (already the pattern). No gold.

**Files.** `components/sections/Listen/Listen.module.css`

**Acceptance.** Scroll #listen into view: at 400ms svg text '-' opacity < 0.5; at 1600ms opacity 1 and both [data-jaw] transforms settled; reduced motion: opacity 1 at 100ms.

## Keep (verified clean - do not touch)

- C-12 (composition, Verified): every neutral token in app/globals.css:6-14 is R=G=B; --gold #c9a84c appears only on caliper jaws, Skills wires, repository marks. Keep.
- Motion per-section table: #hero atmosphere, #skills bench, #vitrine rail, #listen caliper-close meet the one-signature bar; do not add second beats.
- Adversarial gates that hold: deploy commit, console 0/0/0, axe 0, CSP/XFO/HSTS, asset budgets, six sections in order, /api/chat live with published email, launcher position and testid.

## Not tested this run (Assumed / out of scope)

- LCP and CLS were not re-measured this run (adversarial Assumed the capture's 1596ms / 0).
- The no-WebGL path on desktop was not exercised by adversarial (?gl=force forces GL on); motion covered it only at 390 with getContext stubbed.
- MiniVic answer quality for the business-client audience beyond one contact question.
- Pixel-sampled palette compliance; contrast beyond axe.

## Next cycle (single <=10-minute increment)

C-01 page spine: add `--page-max: 78rem` to app/globals.css :root, point the six .inner max-widths at it (Hero 68rem, Listen 46rem included; move 46rem to Listen .quote), add padding-inline to Hero .section, then run one Playwright eval asserting the six eyebrow left edges match within 1px at 390/834/1280/1440/1920 and save it as tests/overhaul/page-spine.spec.ts. Seven one-line CSS edits plus one spec - under 10 minutes, clears a blocker, and C-02/C-09 depend on it.

## Sources

- `adversarial-review.md`, `adversarial-report.json`, `adv.mjs`, `adv2.mjs`, `headers-root.txt`, `api-chat.json`, `index.html`, `adv-rm1440.png`
- `council-composition.md` and the `capture/` PNGs it cites (1440x900-*, 1920x1080-*, 834x1194-*, 390x844-*)
- `council-motion.md`, `motion-probe.js`, `motion-probe.json`, `*-t{0,1,2}.png`, `about-hover.png`, `experience-hover.png`, `vitrine-rail-scrolled.png`, `minivic-open.png`, `mobile-rm-nogl-*.png`
- `backlog.json` (machine-readable form of this file; review.md is generated from it)