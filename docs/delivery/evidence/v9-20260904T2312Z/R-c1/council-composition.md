# Council — Composition, Typography, Colour, Hierarchy (R-c1)

Run `v9-20260904T2312Z` · commit `6dcb4f53` · reviewer: senior creative UI designer
Target: <https://forgotten-mistory.web.app> · Bar: Fortune-500 C-suite / Apple–Stripe polish, monochrome.

**Verdict: FAIL.** Three blockers and five majors sit above `polish`.

Evidence basis — every screenshot under
`docs/delivery/evidence/v9-20260904T2312Z/R-c1/capture/` was opened and read
(390 / 834 / 1280 / 1440 / 1920). Colour ratios below are **sampled from those
PNGs** with a WCAG relative-luminance script run in this session, not estimated.
Every CSS value cited was read in the file named.

Tags: **Verified** = observed here with the artifact/command cited ·
**Inferred** = derived from code I read + a measurement · **Assumed** = stated as such.

---

## Failures first — ranked by damage to a hiring executive's first ten seconds

### C1 · BLOCKER · Hero — the provenance mark renders as a stray apostrophe

The site's central honesty device (prime directive #3: never grade a claim higher
than its evidence) is a half-disc `◐` printed beside every self-reported figure.
It does not render.

- **Verified** — `1440x900-hero.png`: beside `≈92%`, `$5M+` and `10k+` the mark
  draws as a small high tick, indistinguishable from a typographic apostrophe
  (`≈92% ˈ`). Same at `390x844-hero.png` and `1920x1080-hero.png`. The footnote
  reads `◐ self-reported, from my CV.` where the glyph is a 9 px smudge.
- **Verified (code)** — `components/marks/Caliper.module.css`:
  ```css
  .caliper[data-state="self-reported"] .value::after {
      content: "\00A0◐";
      font-size: 0.7em;
      vertical-align: super;
      opacity: 0.75;
  }
  ```
- **Inferred** — U+25D0 is absent from the self-hosted Source Serif 4 / Inter
  subsets, so the browser substitutes. A text glyph cannot carry this meaning.

**Direction — `components/marks/Caliper.module.css`**

```css
.caliper[data-state="self-reported"] .value::after {
    content: "";
    display: inline-block;
    width: 0.5em;
    height: 0.5em;
    margin-left: 0.28em;
    vertical-align: 0.34em;           /* was: vertical-align: super */
    border: 1px solid currentColor;
    border-radius: 50%;
    background: linear-gradient(to right, currentColor 50%, transparent 50%);
    opacity: 0.9;                     /* was 0.75 — 0.75 × mist-400 is unreadable */
}
```
Two rendered halves, no font dependency, scales with the figure. Apply the same
treatment wherever `◐` appears in copy (`app/data/portfolio/hero.ts` caption) —
replace the literal glyph with a `<span class="mark" aria-label="self-reported">`.

**Acceptance:** screenshot `#hero` at 1440 and 390; the mark beside `≈92%` is a
circle half-filled on the left, ≥ 8 px wide, and is not an apostrophe.

---

### C2 · BLOCKER · Whole page — there is no vertical spine; four different left edges at 1440

An executive reads alignment as care. At 1440 the page has four left margins.

**Verified** — measured off the 1440 PNGs:

| element | left edge (px) | source |
|---|---|---|
| nav wordmark `VIKRAM.` | 72 | `1440x900-hero.png` |
| hero `h1` / eyebrow / lede | **176** | `1440x900-hero.png` |
| `#about` / `#experience` / `#skills` headings | **96** | `1440x900-{about,experience,skills}.png` |
| `#vitrine` heading `Six of thirty-eight` | **168** | `1440x900-vitrine.png` |
| `#vitrine` cards | **72** | same file |
| `#listen` heading + contact list | **352** | `1440x900-listen.png` |

**Verified (code)** — each section invents its own container width and all use
`margin: 0 auto`, so a different max-width produces a different edge:

- `Hero.module.css:89` — `.inner { max-width: 68rem }` → (1296 − 1088)/2 + 72 = **176**
- `About.module.css:20`, `Experience.module.css:18` — `max-width: 78rem` → **96**
- `Vitrine.module.css:15-21` — `.head,.foot { max-width: 78rem; padding: 0 var(--page-gutter…) }`
  applies the gutter *inside* the already-capped box → 96 + 72 = **168**
- `Listen.module.css:24` — `max-width: 46rem` → **352**

**Direction**

1. `app/globals.css` `:root` — add the spine as one token beside `--page-gutter`:
   ```css
   --page-max: 78rem;          /* new — the single content column */
   ```
2. `components/sections/Hero/Hero.module.css:89`
   `.inner { max-width: 68rem }` → `max-width: var(--page-max)`.
   Keep the *reading* measure by leaving `.statement { max-width: var(--measure-read) }` (line 157) as-is — the column moves, the paragraph does not.
3. `components/sections/Vitrine/Vitrine.module.css`
   - `.head, .foot` (15-21): delete `padding: 0 var(--page-gutter, …)`; set `max-width: var(--page-max)`.
   - `.section` (13): `padding: clamp(var(--space-10), 12vh, 9rem) var(--page-gutter, clamp(1.5rem, 5vw, 5rem))`.
   - `.rail` (53-62): keep the full-bleed by bleeding out and back —
     `margin-inline: calc(var(--page-gutter, clamp(1.5rem, 5vw, 5rem)) * -1);`
     `padding-inline: var(--page-gutter, clamp(1.5rem, 5vw, 5rem));`
     so card 01 starts on the spine (96) instead of 72.
4. `components/sections/Listen/Listen.module.css:24`
   `.inner { max-width: 46rem; margin: 0 auto }` → wrap in the spine and left-align:
   `max-width: var(--page-max); margin-inline: auto;` and move the 46 rem cap to the
   prose child (`.quote`, `.channels`) as `max-width: 46rem`. The closing section
   then lands on 96 with the other five.

**Acceptance:** in the browser at 1440,
`['#hero h1','#about h2','#experience h2','#skills h2','#vitrine h2','#listen h2']
.map(s => Math.round(document.querySelector(s).getBoundingClientRect().left))`
returns `[96,96,96,96,96,96]`. Repeat at 1280 (expect all-equal 64) and 1920
(expect all-equal 336).

---

### C3 · BLOCKER · Listen — gold spent on decoration, against the file's own rule

- **Verified** — `1440x900-listen.png`: a gold hairline runs x 352→613 under the
  pull-quote "*I have been wrong often enough…*". It is the only gold in the section.
- **Verified (code)** — `components/sections/Listen/Listen.module.css:68-75`
  `.rule { height: 1px; background: var(--gold); opacity: 0.55 }`.
  The same file argues against exactly this twice: line 111 *"It is white: an
  affordance is not evidence, and gold is reserved for evidence"*; line 154
  *"Not gold. Gold on this site means 'this figure has a source you can check'."*
  A hairline under a sentence marks no figure and cites no source.

**Direction — `Listen.module.css:73`**
`background: var(--gold);` → `background: var(--token-border-default);`
and `opacity: 0.55` → `opacity: 1` (the token already carries 0.10 alpha; stacking
opacity on top halves a hairline that is already sub-pixel at 1×).
The `ruleDraw` animation stays — the gesture survives, the claim is withdrawn.

**Acceptance:** a Playwright pass over `#listen` finds zero pixels within ΔE 10 of
`#c9a84c`; `getComputedStyle($('#listen [class*=rule]')).backgroundColor` is
`rgba(255, 255, 255, 0.1)`.

---

### C4 · MAJOR · Experience — the data graphic fails the non-text contrast floor and breaks the right gutter

This is the section that carries "sixteen years". Twice broken.

**a) Contrast — Verified by pixel sample of `1440x900-experience.png`:**
bar fill `rgb(66,67,70)` on plot ground `rgb(17,18,21)` = **1.89:1**. WCAG 1.4.11
requires **3:1** for a graphic that conveys information. The duration readouts
(`7.8 yr`, `10 mo`) sample at `rgb(104,107,114)` ≈ **3.3:1** at ~12 px mono — below
the 4.5:1 text floor.

**b) Gutter — Verified by measurement on the same PNG:** the readout `6 mo`
occupies x 1352–1382 while the section heading's right edge is 1344 (the 96 px
gutter). The chart overruns its own container by ~38 px; at 1920 the same row
overruns by the same amount (`1920x1080-experience.png`).
**Inferred cause:** `Experience.module.css:246`
`grid-template-columns: minmax(0, 1fr) auto 1.5rem;` — the readout and the 1.5 rem
spacer sit *outside* the 1fr plot track, so the row's intrinsic width exceeds
`.inner`'s `max-width: 78rem` (line 18).

**Direction — `components/sections/Experience/Experience.module.css`**
- Bar fill (the rule painting the bar body, currently resolving to ≈`#424346`):
  raise to `var(--mist-400)` at `opacity: 0.85` → sampled ≈ 6.4:1, and the long
  ANZ bar can then take `var(--white)` at `opacity: 0.9` so the eight-year bar is
  the brightest object in the section — which is the story the copy tells.
- Readouts: `color: var(--mist-400)` → `var(--mist-200)` (≈ 9.8:1).
- Line 246: `minmax(0, 1fr) auto 1.5rem` → `minmax(0, 1fr) 4.5rem` (drop the
  trailing spacer; 4.5 rem holds `7.8 yr` at `--fs-caption` with 8 px of air),
  and add `.chart { padding-right: 0 }` so the readout column lives inside the
  78 rem spine.

**Acceptance:** `#experience .chart` row right edge ≤ `#experience h2` right edge
at 1280/1440/1920; sampled bar-to-ground ratio ≥ 3.0:1 and readout ratio ≥ 4.5:1
from a fresh capture.

---

### C5 · MAJOR · MiniVic — the panel covers the H1 and does not share the launcher's axis

- **Verified** — `1440x900-minivic-open.png`: the panel spans x 988→1424 and
  occludes "…ndeˮ of **Vikram Deshpande**, the single most important object on the
  page. Panel right margin = 16 px; launcher (`1360–1416`) right margin = 24 px —
  two elements in the same corner on two different verticals.
- **Verified** — the quick-reply chips clip mid-word at the panel edge:
  `Fit me to a role · Ship a roadmap · Tech stack rea…`, with no fade, no arrow and
  no visible scrollbar. A hiring executive reads a broken component, not a scroller.

**Direction — MiniVic panel styles (`app/globals.css` MiniVic chrome block /
`components/MiniVicBot.tsx` module)**
- Panel: `right: 24px` (match launcher), `bottom: calc(24px + 3.5rem + 1rem)` so the
  panel stacks **above** the 56 px launcher rather than beside it; add
  `max-height: min(40rem, calc(100svh - 8rem))`.
- Chip row: add
  `mask-image: linear-gradient(to right, #000 calc(100% - 2.5rem), transparent)`
  and `scroll-snap-type: x proximity`, and reduce chip `padding-inline`
  `0.75rem → 0.625rem` so three chips fit a 436 px panel at 1440.

**Acceptance:** at 1440 with the panel open, `#hero h1`'s bounding box and the
panel's bounding box do not intersect; the panel's `right` and the launcher's
`right` computed values are equal; no chip's text node is `scrollWidth > clientWidth`
without the fade mask present.

---

### C6 · MAJOR · Vitrine — cards at rest read as disabled, and the rail is cut with no mask

- **Verified** — `Vitrine.module.css:90` `.card { opacity: 0.42 }` (active `1`, line 122).
  Sampled from `1440x900-vitrine.png`: card 01 title `Aether` = `rgb(110,111,114)`
  on `rgb(12,13,15)` = **3.87:1**; its body copy = `rgb(92,95,100)` ≈ **2.9:1**,
  below the 4.5:1 text floor. Card 02 title samples `rgb(244,246,250)`. Two of the
  three visible cards therefore look switched off in a static capture — the state a
  screenshot-taking recruiter sees.
- **Verified** — card 03 is sliced by the viewport edge at x 1440 with a hard cut,
  no gradient mask and no arrow affordance.

**Direction — `components/sections/Vitrine/Vitrine.module.css`**
- Line 90: `opacity: 0.42` → `0.62` (card-01 body then samples ≈ 4.6:1; the
  focus hierarchy survives because the active card is still at 1.0 and gains the
  `--card-shadow-hover` ramp).
- `.rail` (53): add
  `mask-image: linear-gradient(to right, transparent 0, #000 var(--page-gutter, 4.5rem), #000 calc(100% - 4rem), transparent 100%);`
  so the rail *ends* rather than being severed, and re-enable a 2 px thumb
  (`.rail::-webkit-scrollbar` at line 69 currently hides it) so the horizontal
  affordance is discoverable without hover.

**Acceptance:** at 1440, every visible card's body copy samples ≥ 4.5:1 against the
card ground; the right-hand 4 rem of the rail shows a gradient fade in a fresh capture.

---

### C7 · MAJOR · About — the compass numerals fail AA by a wide margin

- **Verified** — pixel sample of `1440x900-about.png`, dial numeral `10`:
  brightest ink `rgb(95,100,108)` on `rgb(26,27,31)` = **2.89:1**. These are the
  labels 01–10 identifying the ten dimensions — informational text, not decoration,
  so the 4.5:1 floor applies. `NO SCORES` at the hub samples similarly.

**Direction — `components/sections/About/Compass.module.css`**
raise the numeral colour to `var(--mist-200)` (`#C9CDD6` on `#1A1B1F` ≈ **10.6:1**)
at `opacity: 0.75` (≈ 7.4:1), keeping the ring hairlines at their current value so
the numerals — not the furniture — carry the ink. Bump the numeral size
`--fs-micro → --fs-caption` (11 px → 12 px) so it clears the small-text threshold
at 390 too.

**Acceptance:** sampled numeral-to-ground ratio ≥ 4.5:1 at 1440 and 390.

---

### C8 · MAJOR · Hero — the grading note is unreadable, and the right third of the hero is empty

- **Verified** — `1440x900-hero.png`: the note *"◐ self-reported, from my CV.
  Repository figures below are harvested and dated."* samples `rgb(110,113,120)` on
  `rgb(15,16,20)` = **3.89:1** at ~12 px mono → below 4.5:1. It is the sentence that
  makes the three headline figures honest, and it is the least legible text on the page.
- **Verified** — `Hero.module.css:171` `.ledgerRow { grid-template-columns:
  minmax(0,1fr) minmax(0,15rem) }` puts that note alone in the right column. Above
  it, from y 100 to y 520 and x 980 to 1344, the hero is empty. At 1920
  (`1920x1080-hero.png`) the empty band is ~700 px wide. The composition is a
  left-weighted column in a widescreen frame with nothing answering it.

**Direction**
- `Hero.module.css` — the note's rule: `color: var(--mist-400)` → `var(--mist-200)`
  at `opacity: 0.85` (≈ 8.3:1), `line-height: var(--lh-caption)` (1.55) and
  `max-width: 22ch` so it sets as a tight three-line block rather than four ragged ones.
- Composition: raise the note to sit level with the **top** of the ledger rules
  (`.ledgerRow { align-items: end }` → `start`, and give the note
  `padding-top: var(--space-2)` to align its cap-height with the ledger captions),
  and let the hero's one cinematic element (`HeroAtmosphere`) carry weight on the
  right rather than rendering as flat black. Compositionally the cheapest fix that
  is still Marvel-grade: give `.inner` `grid-template-columns: minmax(0,1fr) minmax(0,18rem)`
  at ≥ 1280 and move the availability line + `LinkedIn · GitHub · Email` cluster
  into that right column at the H1's baseline, so the right third holds the
  "how to reach him" answer instead of air.

**Acceptance:** note ratio ≥ 4.5:1; at 1440 and 1920 no rectangle wider than 240 px
and taller than 240 px inside `#hero` is free of both text and rendered atmosphere.

---

## Polish (below the bar, listed for completeness)

- **P1 · Cool-tinted greys.** **Verified by hex arithmetic on `app/globals.css`:**
  `--mist-400: #8A8F9A` has B−R = **+16**, `--mist-200: #C9CDD6` = **+13**,
  `--white: #F4F6FA` = **+6**. At the sizes these are used the mid-greys read
  faintly blue rather than obsidian. For a true neutral: `--mist-400: #8F9095`
  (B−R +6), `--mist-200: #CDCED2` (+5), `--white: #F6F6F7` (+1). `--ink-900:#0A0B0D`
  (+3) and `--gold:#c9a84c` are already correct and should not move.
- **P2 · Two measures stacked, Skills.** `1440x900-skills.png`: the lede sets to
  x 824 and the paragraph below it to x 708 — two rags, 116 px apart, in the same
  column. Put both on `var(--measure-read)` in `Skills.module.css`.
- **P3 · 390 hero: the caliper columns are ragged.** `390x844-hero.png` — the right
  jaws land at x 118 / 115 / 107 because each figure sizes its own box while all
  three labels align at 136. Give `.ledgerItem` a `min-width: 6.5rem` on the value
  column below 600 px (`Hero.module.css:366` already switches to
  `minmax(4.5rem, auto) 1fr` — change to `minmax(6.5rem, 6.5rem) 1fr`).
- **P4 · 390 hero: no CTA above the fold.** At 390 the first screen ends inside the
  ledger; `See the evidence` / `Download CV` are below. Consider tightening
  `Hero.module.css:33` `padding-bottom` and the ledger `gap` so at least one action
  is visible at 844 px tall.
- **P5 · Listen contacts have no button affordance.** `1440x900-listen.png` — four
  mono lines of raw address text. For the business-client audience, promote `Email`
  to the same pill treatment as `Download CV` and leave the other three as the
  current underline-on-hover channels.

---

## What passes, and is worth protecting

- **Verified** — the type system is genuinely well built: one document serif for
  the six titles and every figure, Inter for prose, IBM Plex Mono strictly for
  provenance. Nothing in any of the 41 captures breaks that assignment.
- **Verified** — `--fs-*` / `--ls-*` / `--lh-*` are a real six-step scale with
  optical letter-spacing that tightens as size rises (`--ls-name: -0.035em`
  through `--ls-body: 0`). The H1 at 1440 is correctly tracked.
- **Verified** — the Skills flow diagram is the strongest graphic on the site and
  the only place gold currently earns its keep.
- **Verified** — `1440x900-reduced-motion-hero.png` is byte-identical in size to
  `1440x900-hero.png`; the reduced-motion path renders the same composition.
