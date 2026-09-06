# HERO-FOLD-v2 — the first fold as a set piece

> **SUPERSEDED by `docs/architecture/HERO-SETPIECE-v3.md` (t_w2_h1sa, 2026-09-06) for the R1 bar.** §3 (the SPD measure) and §5.1 (the composite mask) remain binding and are carried into v3 verbatim; §2's composition — a reading column beside a picture column — is retired, because ADV-REVIEW-20260905T2315Z §Hero measured what it produced as a stacked hire landing over smoky GL wallpaper.

**Author:** solutions-architect (docs/prompt.md §5 — architecture / requirements_analysis,
level 1, effort max). **Task:** `t_g2_h1` (ADV-1451Z P0, G-H1 restated at the R1/§14 bar).
**Status:** composition brief. Binding on every hero lane until superseded.
**Companion:** `docs/architecture/HERO-TASKS.json` (the ≤ 30-minute slices).
**Colour of the photograph:** decided in `t_g2_h6`. This brief is written so that either
outcome ships without a second composition — see §7.

---

## 1. What is actually wrong

The density clauses pass and the intent fails. Both statements are measured, not opinions.

| Clause | Live measurement | Source |
|---|---|---|
| one `<h1>` in the fold | `h1InFold: 1` | `G-REV/e3f0206c/captures/probeA-hero.json` |
| one paragraph over 12 words | `paragraphsOver12Words: 1` | same |
| one CTA group in the fold | `ctaGroupCount: 1` (`hero-actions`, top 675 < 900) | `G-REV/66199cba/08-adversarial-review.md` clause 14 |
| ledger below the fold | `ulTop 973 ≥ 900` | same |
| poster first paint | stage-box mean luminance **0.1104** @1440, **0.1197** @390, chunk-blocked | same, clauses 3–6 |
| AA on `?gl=force` | worst of ten **6.20:1** | same, clause 9 |
| CLS / LCP | CLS **0.00000** on 9/9 loads; LCP worst **1408 ms** | same, clause 11 |

Those are the gates. They stay. What the 1451Z reviewer then wrote is a verdict about
*composition*, and every phrase of it is reproducible in the same capture:

1. **"polished hire landing, not cinematic stage."** `.stage::after` paints
   `rgb(10 10 10 / 0.88)` over the frame from 0% to 44% and `0.86 → 0.45` out to 56%
   (`Hero.module.css`). The half of the frame the reader's eye enters through is
   deliberately extinguished. The atmosphere is a strip on the right.
2. **"H1 dominates."** Not in scale — `--fs-name` is already `clamp(3rem, 8.2vw, 7.5rem)`
   = 118 px at 1440, 0.131 of a 900 px fold. It dominates because it is the only lit
   *object* on the left: 16 glyphs in a ~660 px column, so it **wraps to two lines**
   (h1 top 183, `.role` top 453 — a 270 px block where one 124 px line belongs). A
   wrapped name is a heading. A single line set to the frame is a mark.
3. **"colour headshot as a framed card beside a column."** `@media (min-width: 720px)`
   sets `grid-template-columns: minmax(0, 1fr) var(--portrait-w)`; `HeroPortrait` draws
   `.portraitFrame` (a hairline rule inset 12 px), four `.portraitTick` corners and
   `.portraitCross`. That is, literally, a card: a closed rectangle with registration
   marks, parked in the second column. Measured 545 × 303 CSS px — **11.4 %** of the fold
   (`G-REV/9ba97a5c` §4.2, `dominantMediaCoverage: 0.114`).
4. **"brand 'VIKRAM.' is chrome."** The nav wordmark and the fold's name say the same
   thing at two scales, and the *chrome* one is the one that reads as designed.

The creative council reached the same place independently and put a number on it:
*"Give the atmosphere the whole 100 vw × 100 vh and let type sit inside it, not beside it
… dominant visual coverage ≥ 0.75 (measured 0.114)"* and *"kill the 68 % scrim, use a key
… contrast is bought locally, not by dimming the whole stage"*
(`G-REV/9ba97a5c/08-adversarial-review.md` §3, `#hero` directions 1 and 2).

**Diagnosis in one line:** the fold is a two-column résumé printed on top of a picture that
has been switched off wherever the résumé stands. The remedy is not more picture; it is to
stop paying for contrast with the whole frame, and to stop letting the photograph be an
object *beside* the type instead of a body *inside* the light.

---

## 2. The set piece

One plane. The name is the mark struck on it, the photograph is a body standing in its
light, the sentence is a caption, and the actions are one quiet bar along the bottom.
Nothing in the fold is a card, a column, or a panel.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← shafts rake down from the upper left, across the whole frame →        │
│                                                                          │
│   MELBOURNE, AUSTRALIA                            ╭ · · · · · · ╮        │
│                                                   ·   the pool   ·       │
│   V I K R A M   D E S H P A N D E   ← one line, full measure   ·         │
│   ───────────────────────────────────────────    ·  the figure  ·        │
│   Delivery leadership · AI solutions architecture ·  standing    ·       │
│                                                   ·  in it, no   ·       │
│   Sixteen years leading delivery across…          ╰ edge, no card╯       │
│                                                                          │
│   See the evidence   ·   Download CV      ← one bar, one plate, hairline  │
└──────────────────────────────────────────────────────────────────────────┘
   ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁ the proof band (unchanged, below 100svh) ▁▁▁▁▁▁▁▁▁▁
```

Four moves, in dependency order:

**M1 — the contrast moves off the frame and onto the type.**
Retire the half-frame `.stage::after` wash above 700 px. Every run of copy carries its own
plate, exactly as the phone already does (`@media (max-width: 700px)`:
`background: rgb(10 10 10 / 0.90); border-radius: 3px; padding-inline: .45rem;
margin-inline: -.45rem`). That instrument is already shipped, already measured, already
green on AA at 390 — this promotes it to every width and deletes the wash it replaces.
The light then reaches the left of the frame, which is the entire reason the fold reads as
wallpaper today.

**M2 — the name becomes a mark.**
The grid stops splitting the fold into a reading column and a picture column. The copy
runs the full `--page-max` measure; `--fs-name` is re-derived so `Vikram Deshpande` sets on
**one line filling that measure**, with the display tracking it already asks for.

**M3 — the photograph is masked into the plane.**
`.portraitFrame`, the four `.portraitTick` corners and `.portraitCross` leave the fold (the
drafting language survives where it belongs: on the caliper mark and in the proof band).
The media box loses its rectangle to a mask that dissolves its outer edges into the light,
and it overlaps the mark's right end rather than standing to the side of it.

**M4 — the pool comes to the figure.**
`atmosphere.glsl.ts` already has a pool written *for* this: `poolPlate`, centred at
`vec2(0.75 * halfWidth, -0.04)`, whose own comment says it is "behind the portrait plate".
It is a constant; the figure's position is a layout. Bind them — pass the figure's measured
centre as a uniform — and re-render the poster from the same shader so the no-GL path is
the same picture.

Everything else in the fold is unchanged: the same six text leaves, the same one CTA group,
the same proof band below `100svh`, the same words.

---

## 3. The dominance measure (this is the acceptance, not a metaphor)

"Dominant" has to be a number a probe can print, or the next reviewer will overturn it the
way this one overturned "flagship".

### 3.1 Definition — Stage-Plane Dominance (SPD)

Capture the fold at device-scale 1, `W × H` = viewport. For each pixel compute WCAG
relative luminance `L` from the sRGB bytes (the same helper
`tests/overhaul/flagship-visibility.spec.ts` already uses).

- **Ground** `G` = the 10th-percentile `L` of the fold. (Percentile, not the section's
  declared background: it survives a poster change and needs no DOM.)
- **Light mass** of a pixel: `m = max(0, L − G)`. This is the instrument
  TC-FLAGSHIP-VIS already reasons in — light above the ground is what an eye is drawn to.
- **Ink set `I`** = the union, from the live DOM, of: every text-leaf rect in the fold;
  every media rect (`img`, `video`, `svg`); and every element whose computed
  `background-color` alpha ≥ 0.5 inside the fold (the plates). Each rect dilated by 8 px.
- **Plane set `P`** = fold `∖ I`.

```
SPD = Σ_P m  /  Σ_fold m
```

### 3.2 Thresholds

| id | clause | threshold | why this number |
|---|---|---|---|
| **PLANE-1** | `SPD ≥ 0.75` | the council's own figure | the plane must carry three quarters of everything the eye is pulled toward |
| **PLANE-2** | `Σ_fold m / (W·H) ≥ 0.045` | absolute floor | without it a uniformly black fold scores SPD = 1.0. The frame must be *lit* before it can be dominant |
| **PLANE-3** | ship at `SPD ≥ 0.78` | +0.03 margin | `filter: grayscale()` re-weights channels; a gate sitting on 0.750 can flip on the `t_g2_h6` decision alone (§7) |

Measured at **1440×900, 1280×800, 834×1194, 390×844**, on **both** paths: `/?gl=force`
(the shader) and the reduced-motion / chunk-blocked still (the poster). A reader without a
GPU gets the same set piece or the claim is false.

### 3.3 Why a big name does not break it

Type contributes to `I`, and `I` is subtracted from the numerator, not added to it. A mark
at 160 px on its own dark plate has a light mass of ≈ 0 — so the name can dominate the
*type hierarchy* (§4) while the plane dominates the *light*. Those are two axes and the
brief requires both. This is the precise reason the reviewer's "H1 dominates" and this
brief's "make the name a brand mark" are not in conflict.

### 3.4 Predicted movement (estimate — the lane measures, it does not quote this)

Today the scrim zeroes `m` across 0–56 % of the frame and the 545×303 photograph sits in
the brightest region: the numerator is thin and the photograph is a large share of what is
left. Removing the wash restores light across the left half — all of it in `P` — while the
plates keep `m ≈ 0` under the type. The direction is unambiguous; the magnitude is not
predictable from a static read of CSS. **`g2h1-01` prints the real baseline before any
pixel moves.** No lane may quote a number from this section as evidence.

---

## 4. The name as a brand mark

| id | clause | acceptance | measured at |
|---|---|---|---|
| **BM-1** | single line | `h1` client height ≤ 1.30 × computed `font-size` | 1440, 1280, 834 |
| **BM-1b** | the phone is an authored lockup, not a rag | exactly 2 line boxes, authored break, leading ≤ 0.92 em | 390 |
| **BM-2** | set to the measure | h1 text advance ≥ 0.86 and ≤ 1.00 of the copy column width | 1440, 1280 |
| **BM-3** | optical scale | `font-size ≥ 0.10 × fold height` (≥ 90 px at 900) | 1440, 1280 |
| **BM-4** | display tracking | computed `letter-spacing` ∈ [−0.035 em, −0.015 em] | all |
| **BM-5** | it is still the LCP element | LCP element is `h1#hero-name` at 1280/1440, LCP < 2500 ms | 3 cold loads × 3 widths |
| **BM-6** | it is the only display type in the fold | no other fold node computes `font-size` > 40 px | all |
| **BM-7** | it never overflows | `documentElement.scrollWidth ≤ innerWidth` | 390, 834, 1280, 1440 |
| **BM-8** | the mark, not the chrome, is the identity | fold h1 cap-height ≥ 6 × the nav wordmark's | 1440 |

**BM-1 is currently failing** and that is the substance of the change: at 118 px in a
~660 px column the name wraps. Freeing the measure (M2) is what makes one line possible.

**On the numbers:** a single line of `Vikram Deshpande` needs roughly `7.5 em` of advance
(16 glyphs at ≈ 0.50 em mean advance for the heading face, less 15 × 0.035 em of tracking).
Against a 1248 px `--page-max` that is ≈ 166 px ≈ 11.5 vw at 1440; against a 342 px phone
measure it is ≈ 45 px, which is **below** today's `3rem` floor — which is why BM-1b exists
rather than a pretence that 390 holds one line. **These are arithmetic estimates from a
metric assumption. `g2h1-03` measures the real advance in the browser and derives the clamp
from the measurement.** Shipping the estimate is a violation.

**BM-5 is a hard constraint on how the mark is animated.** `.name` runs `heroRiseSolid`
(transform only, never opacity) precisely because Chrome does not record an element first
painted at `opacity: 0` as an LCP candidate. Any brand-mark treatment that fades, masks to
transparent, or reveals the name is forbidden.

---

## 5. The photograph, integrated

Two mechanisms. They are complementary, not alternatives, and they are separate slices so
either can be reverted alone.

### 5.1 Masked into the light (`g2h1-04`)

Drop `.portraitFrame`, `.portraitTick` ×4 and `.portraitCross` from the fold. Apply a
composite `mask-image` to `.portraitMedia` so the outer edges fall off into the plane
instead of ending on a rule.

| id | clause | acceptance |
|---|---|---|
| **PH-1** | no closed rectangle | computed `border`, `outline`, `box-shadow` on the media box and its children are `none`; `[data-testid="portrait-tick"]` count in the fold = 0 |
| **PH-2** | the edges dissolve | sampling 4 px inside vs 4 px outside the media rect, mean \|ΔL\| ≤ 0.04 on ≥ 3 of the 4 edges |
| **PH-3** | the face survives | the mask is opaque over the upper-centre 46 % of the media box; no gradient crosses the face |
| **PH-4** | it is still a `<figure>` with a `<figcaption>` | unchanged element contract; `figurePressables === 0` |
| **PH-5** | costs nothing | CLS 0 across 9 loads; the mask is compositing only — no box changes size |

### 5.2 The pool shaped around it (`g2h1-05`)

`atmosphere.glsl.ts` line ~228: `vec2 q2 = (p - vec2(0.75 * halfWidth, -0.04) ...)`. Add a
`uPortrait` uniform (normalised centre, defaulting to today's constant so the shader is
byte-equivalent until it is fed), set it from the figure's measured rect in
`HeroAtmosphere.tsx`, and mirror the same centre in `.stage`'s radial fallback. Then re-run
`node scripts/assets/render-hero-poster.mjs` in the same commit — the poster is *rendered*
from this shader, so a shader change that skips the re-render silently desynchronises the
no-GL path.

| id | clause | acceptance |
|---|---|---|
| **PL-1** | the light contains the figure | the fold's brightest 5 % of pixels: ≥ 60 % of them lie within 1.3 × the media rect's half-diagonal of its centre, on `?gl=force` at 1440 |
| **PL-2** | the still agrees with the scene | same test on the reduced-motion still (the poster + gradients), ≥ 50 % |
| **PL-3** | the poster is regenerated in the same commit | `git diff --name-only` for the commit contains both `atmosphere.glsl.ts` and `public/assets/hero-atmosphere-poster.avif` |
| **PL-4** | the poster stays cheap | ≤ 500 kB (today 12 935 B), 3840×2160 |

---

## 6. One quiet bar

| id | clause | acceptance |
|---|---|---|
| **CTA-1** | one group | exactly one CTA group in the fold (`hero-actions`); `ctaGroupCount === 1` — the existing TC-FOLD-04 rule, unchanged |
| **CTA-2** | one row | both links share a row: \|Δ top\| ≤ 4 px, group height ≤ 56 px, at ≥ 720 px |
| **CTA-3** | quiet | the group's summed light mass `Σ m` ≤ 0.06 of `Σ_fold m` |
| **CTA-4** | one plate, not two objects | a single element carries the group's ground; the bar is one box in `I`, not two pills |
| **CTA-5** | still unmistakably an action | primary label contrast ≥ 7:1 against its own plate; the label text is unchanged |
| **CTA-6** | in the fold with air | `marginToFoldBottom ≥ 40 px` (today 177) — TC-FOLD-04's existing clause |

CTA-3 is what retires the filled white `.primaryAction`: a white pill is a bright *object*
competing with the plane for the same eye. Contrast is not reduced — area is. CTA-5 exists
so that reducing the area can never be traded for reducing the legibility.

**Gold is not available here.** `--gold` means "this figure has a source"
(`CLAUDE.md` prime directive 4). It does not appear in the fold under any treatment.

---

## 7. Designed for both outcomes of `t_g2_h6` (the colour photograph)

The composition does not depend on the decision. Exactly one declaration does.

| | colour retained | monochrome |
|---|---|---|
| what changes | nothing | one `filter: grayscale(1)` on `.portraitMedia img, .portraitMedia video` |
| layout | identical | identical (a filter is compositing; CLS unaffected) |
| **CHROMA-1** | mean CIE LCh chroma outside the media rect ≤ 4 | same |
| **CHROMA-2** | inside the media rect: unconstrained — it is the one chromatic object | inside ≤ 4 as well |
| SPD | must clear **0.78** (PLANE-3) | must clear 0.75 |

Grayscale re-weights the channels, so `L` moves a little under the media rect. PLANE-3's
+0.03 margin is sized for that: the gate cannot flip on a decision taken in another task.
The mask (PH-2), the pool (PL-1) and every metric in §4 and §6 are colour-independent by
construction — none of them samples inside the media rect.

---

## 8. Gates that do not move

Every one of these is green on live `66199cba` and is a **regression gate**, not a target.
A slice that improves SPD and breaks one of these has failed.

| gate | clause | where it is asserted |
|---|---|---|
| **CT-10** | `≈92% / $5M+ / 10k+` printed with sources, graded `self-reported`, `#hero ul` resolves | `tests/content/content-check.spec.ts`; lives in the proof band, below `100svh` — no fold change may pull it up or drop it |
| **TC-FOLD-01/02/04** | one h1, one sentence over 12 words, one CTA group, evidence below the fold | `tests/e2e/hero-fold.spec.ts` |
| **TC-FOLD-03** | fold band = one screen (0.95–1.12 × `innerHeight`); stage covers ≥ 90 % of the fold | same |
| **plates ≤ 700 px** | every run of copy keeps its own `rgb(10 10 10 / 0.90)` ground on the phone | `Hero.module.css` `@media (max-width: 700px)` — M1 *extends* this instrument upward; it must never be removed from the phone |
| **AA on `?gl=force`** | worst of ten ≥ 4.5:1 (today 6.20:1) at 1440 and 390 | `tests/a11y/text-contrast.spec.ts` |
| **TC-HERO-SCRIM-01** | brightest tenth − mean under the DOM-measured reading column ≥ 0.06 | ×4 contexts; today 0.2912/0.2582/0.2146/0.0640 |
| **first-paint poster** | stage-box mean luminance ≥ 0.10 chunk-blocked and JS-off, 1440 and 390 | `tests/overhaul/hero-first-paint.spec.ts` (TC-HERO-FIRSTPAINT-01/02) |
| **flagship floors** | coverage ≥ 0.15, peak ≥ 0.35, motion ≥ 0.004; still coverage ≥ 0.08 | `tests/overhaul/flagship-visibility.spec.ts` |
| **CLS / LCP** | CLS < 0.05 (today 0.00000), LCP < 2.5 s (today 1408 ms worst) | `tests/perf/` |
| **keyboard** | the two fold actions reachable in DOM order with visible focus rings ≥ 3:1; no new `tabindex`; `figurePressables === 0`; the play/pause control stays named, in the proof band | `tests/a11y/`, probe field `control.belowFold` |
| **reduced motion** | a static path for every animation; the still is the same picture stopped, never a different one | `Hero.module.css`, `HeroAtmosphere.tsx` |
| **budget** | no asset over 500 kB | static audit |

**The AA interlock is the one to be careful with.** `.stage::after` is deleted, so on
`?gl=force` the shader's near-white fog (peak 0.8308) reaches the copy directly. AA is then
bought *only* by the plates. Sizing is not a taste call and the file already records the
arithmetic: over 0.8308 fog, `rgb(10 10 10 / 0.90)` lands the ground on `#212121`, inside
the `#2A2A2A` ceiling `--mist-400` needs for 4.5:1. A slice that lightens a plate below
0.90 without re-measuring the ten worst nodes has broken the gate.

---

## 9. Decisions, with reversal cost (§0.1 — decided, logged, not asked)

| # | decision | why | reversal cost |
|---|---|---|---|
| **D-1** | Delete the desktop half-frame scrim; promote the phone's per-run plates to every width. | It is the single cause of "wallpaper", and the replacement instrument is already shipped and already green at 390. | **Low.** One `@media` boundary. Restoring `.stage::after` is one block. |
| **D-2** | Collapse the two-column fold grid; the copy takes the full measure and the figure moves into the plane. | BM-1 (single line) is unreachable in a 660 px column at 118 px. | **Medium.** `@media (min-width: 720px)` `grid-template-columns` and the portrait's `grid-column`. TC-FOLD-03's photograph clause must be re-checked at 1280. |
| **D-3** | The drafting frame leaves the fold and stays in the proof band / on the caliper. | A closed rectangle with registration ticks is the definition of a card. The language is not lost, only relocated. | **Low.** The elements are already conditional-render candidates. |
| **D-4** | The primary action loses its white fill; the bar keeps its contrast on one plate. | CTA-3 — a filled white pill is the second-brightest object in the fold and it is not the subject. | **Medium — the only conversion-touching decision here.** CTA-5 protects legibility (≥ 7:1 and the same words), so the risk is preference, not comprehension. If a later conversion measurement disagrees, restoring the fill is one rule. |
| **D-5** | SPD is measured on both the GL path and the still, and shipped at 0.78 not 0.75. | A gate that a colour decision in another task can flip is not a gate. | **Low.** A constant. |
| **D-6** | The phone gets a two-line authored lockup, not one line. | ≈ 45 px is below the readable floor for the mark; the honest substitute is a lockup with tight leading. | **Low.** One authored break. |
| **D-7** | The shader change and the poster re-render ship in the same commit (PL-3). | The poster *is* the shader rendered; a split commit silently desynchronises the no-GL path. | **Zero.** It is a process rule. |

**Not decided here:** the colour of the photograph (`t_g2_h6`), and the nav wordmark
(BM-8 only requires the fold's mark to be unambiguously larger; changing the nav is a
separate lane).

---

## 10. How this is verified

The instrument is `scripts/validate/hero_plane_dominance.mjs` (built in `g2h1-01`) and
`tests/overhaul/hero-plane-dominance.spec.ts` (`TC-HERO-PLANE-01` SPD, `TC-HERO-PLANE-02`
the PLANE-2 floor). It prints, per width per path: `G`, `Σ_fold m`, `Σ_P m`, SPD, and the
rect list it excluded — so any reviewer can re-derive the number instead of trusting it.

```bash
npm run build:static
python3 -m http.server 5635 --directory out &
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5635 npx playwright test tests/overhaul/hero-plane-dominance.spec.ts
node scripts/validate/hero_plane_dominance.mjs --base http://127.0.0.1:5635
```

Ports 5635+ throughout. **Never 5599 or 8080** — both are bound by other tenants on this
host; council batteries hold 5601/5602.

A slice is done when its own clause is green **and** the §8 table is unchanged **and** the
change is visible on `https://forgotten-mistory.web.app` with the deployed `build-commit`
recorded. `g2h1-07` re-probes all of it independently on the live build; nothing in this
brief is closed by the lane that wrote it.
