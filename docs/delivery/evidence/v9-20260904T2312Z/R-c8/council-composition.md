# Council — Composition, typography, colour, hierarchy (R-c8)

Run v9-20260904T2312Z · commit 9321998b · target https://forgotten-mistory.web.app/?gl=force
Reviewer role: senior creative UI designer. Read-only.

Evidence: every PNG under `docs/delivery/evidence/v9-20260904T2312Z/R-c8/capture/` at 390 / 834 /
1280 / 1440 / 1920, cross-read against `app/globals.css` and the six
`components/sections/<X>/<X>.module.css` files. Coordinates below are CSS px measured off the
named PNG. Tags: **Verified** = observed here; **Inferred** = derived from code + image;
**Assumed** = stated as such.

## Verdict: FAIL — two blockers on the page spine.

The type is right. The scale is right. The palette is genuinely achromatic — `--ink-900 #0A0A0A`,
`--ink-300 #7D7D7D`, `--mist-400 #909090`, `--mist-200 #CDCDCD`, `--white #F6F6F6` carry zero hue
(`app/globals.css:6-14`, **Verified**), so nothing on this page reads blue. What fails is the thing
an executive registers before reading a word: the page has **three different left edges**, and the
Vitrine has a fourth.

---

## FAILURES FIRST

### C-01 · BLOCKER · the six sections do not share a vertical spine

**Evidence (Verified).** Content left edge, measured at 1440 CSS px:

| section | `.inner` max-width | left edge @1440 | left edge @1920 |
|---|---|---|---|
| Hero | `68rem` (`Hero.module.css:89`) | **176 px** | **416 px** |
| About / Experience / Skills | `78rem` (`About.module.css:20`, `Experience.module.css:18`, `Skills.module.css:20`) | **96 px** | **336 px** |
| Vitrine header | `78rem` + `--page-gutter` (`Vitrine.module.css:19,21`) | **168 px** | **416 px** |
| Listen | `46rem` (`Listen.module.css:24`) | **352 px** | **592 px** |

Confirmed against the PNGs: `1440x900-hero.png` eyebrow "MELBOURNE, AUSTRALIA" at x=176;
`1440x900-about.png` eyebrow "ABOUT" at x=96; `1440x900-vitrine.png` eyebrow at x=168;
`1440x900-listen.png` eyebrow at x=352. Scrolling the page, the left edge walks 176 → 96 → 96 → 96
→ 168 → 352. No portfolio at Apple/Stripe calibre lets the spine move; it is the single strongest
signal of composed-versus-assembled.

**Direction.** In `app/globals.css :root`, add one token beside `--page-gutter`:

```
--page-max: 78rem;         /* 1248px — the one content column */
--measure-display: 26ch;   /* unchanged; a measure, not a container */
```

Then set every section's `.inner` to it:
- `components/sections/Hero/Hero.module.css:89` — `max-width: 68rem` → `max-width: var(--page-max)`
- `components/sections/About/About.module.css:20` — `78rem` → `var(--page-max)`
- `components/sections/Experience/Experience.module.css:18` — `78rem` → `var(--page-max)`
- `components/sections/Skills/Skills.module.css:20` — `78rem` → `var(--page-max)`
- `components/sections/Vitrine/Vitrine.module.css:19` — `78rem` → `var(--page-max)`
- `components/sections/Listen/Listen.module.css:24` — `max-width: 46rem` → `max-width: var(--page-max)`,
  and move the 46rem to the pull-quote only: `.quote { max-width: 46rem }` (it already carries
  `max-width: var(--measure-display)` at line 63 — keep that, it is the measure).

Hero additionally needs `padding-inline: var(--page-gutter, clamp(var(--space-3), 5vw, var(--space-10)))`
on `.section` (`Hero.module.css:21` currently sets only block padding), so its inner column lands on
the same 96 px edge as About at 1440 and 336 + 80 = 416… i.e. identical to every other section.

**Why.** A constant left edge is what makes six unrelated visualisations read as one document.
It is also the cheapest fix on this list: six one-line changes.

**Acceptance.** At 390/834/1280/1440/1920, `document.querySelectorAll('section h2, section p:first-of-type')`
→ every section's eyebrow `getBoundingClientRect().left` is equal to within 1 px.

---

### C-02 · BLOCKER · the Vitrine rail is on a different spine from its own heading

**Evidence (Verified).** `1920x1080-vitrine.png`: heading "Six of thirty-eight" starts at x=416;
card 01 "Aether" border starts at **x=80** — a 336 px disagreement inside one section.
`1440x900-vitrine.png`: heading x=168, card x=72 — 96 px disagreement. Cause is in the CSS
(**Verified**): `.section { padding: clamp(...) 0 }` (`Vitrine.module.css:13`) plus `.rail { padding:
var(--space-1) var(--page-gutter) var(--space-4) }` (line 57) with **no `max-width` on the rail**, so
the rail is gutter-relative to the full viewport while `.header` is centred inside `78rem`.

A second break in the same frame: card 04 "Prompt Reconstructio…" is guillotined mid-word at the
right edge with **no fade mask and no visible rail affordance** — no arrows, no thumb, no gradient.
At 1920 it reads as a layout overflow bug, not a carousel.

Third: at rest the **second** card is the lit one (`AB Entertainment` at full `--white`; Aether,
Ralph Loop and Prompt Reconstruction sit dimmed). Emphasising item 02 on first paint reads arbitrary.

**Direction.** `components/sections/Vitrine/Vitrine.module.css`:
- `.rail` — add `max-width: var(--page-max); margin-inline: auto;` so the first card's left border
  lands on the heading's left edge exactly.
- `.rail` — add an edge mask so the cut card reads as "more to the right", not as clipping:
  `mask-image: linear-gradient(to right, #000 0 calc(100% - 6rem), transparent 100%);`
  (and the `prefers-reduced-motion` path keeps it — it is a static mask, not motion).
- Add a rail thumb: a 2 px `--ink-500` track under the cards, `width: 6rem`, `background: var(--mist-400)`,
  `border-radius: 1px`, translating with `scrollLeft / scrollWidth`.
- Default the lit card to index 0, not 1 (the active-card state in `Vitrine.tsx`); rest opacity for
  unlit cards `0.62` so the dim state reads deliberate rather than unloaded.

**Acceptance.** At 1440 and 1920, first card's `left` === heading's `left`; the right-most partial
card fades rather than cuts; card 01 is lit on first paint.

---

### C-03 · MAJOR · Experience duration labels overflow the chart, and clip at 834

**Evidence (Verified).** `834x1194-experience.png`: the chart card's right border is at x=793;
the label `6 mo` runs x=800→830 — **outside the card, 4 px from the viewport edge**, and the ATO bar
(x=773→793) is jammed against the border with zero end-padding. Same at 1440
(`1440x900-experience.png`): grid and label run to x≈1382 while the `78rem` column ends at 1344.
Cause (**Verified**): `.trackYears { position: absolute; left: calc(100% + var(--space-1)) }`
(`Experience.module.css:183-186`) places the label outside the track box with nothing reserving room.

**Direction.** `components/sections/Experience/Experience.module.css`:
- `.trackLine` (the bar lane) — add `padding-right: 4.5rem;` so the longest label (`7.8 yr` ≈ 44 px at
  `--fs-caption` mono + `--space-1`) always has a home inside the card.
- `.trackYears` — add `max-width: 4rem;` and, under `@media (max-width: 52rem)`, switch to
  `position: static; margin-left: var(--space-1);` so at 834/390 the figure sits inline after the bar
  instead of hanging off the card.
- Bar weight: `.trackBar::before` currently paints at `0.55rem` in a mid-grey. Raise the rest colour to
  `--mist-400` at `opacity: 0.72` and keep `--white` on hover/active, so the eight bars carry the
  section instead of ghosting into the strata field. **Inferred** — `--ink-300` on `--ink-900` measures
  4.81:1, which clears AA for text, but the bars sit over a live WebGL gradient, not the flat token.

**Acceptance.** At 390/834/1280/1440/1920, every `.trackYears` box is fully inside its chart card's
padding box (`right <= card.right - 16`); no horizontal page scroll.

---

### C-04 · MAJOR · the MiniVic launcher is an empty ring

**Evidence (Verified).** Present in every closed-state capture — `1440x900-hero.png`,
`1440x900-about.png`, `1440x900-experience.png`, `1440x900-skills.png`, `1440x900-vitrine.png`,
`1440x900-listen.png`, `1920x1080-vitrine.png`: a ~64 px circle at bottom-right (centre ≈1388,848 at
1440) containing **nothing but a single 3 px dot on its rim**. No glyph, no avatar, no word. It reads
as a loading spinner. The single highest-value interaction on the page is invisible for the first ten
seconds.

**Direction.** In the MiniVic launcher styles (`components/MiniVicBot.tsx` + its chrome block in
`app/globals.css`), give the closed launcher a face:
- Fill the ring with the same grayscale portrait already used in the open panel header at
  `filter: grayscale(1) contrast(1.05)`, `border-radius: 50%`, inset 2 px inside a
  `1px solid var(--card-border)` ring; **or** set a 20 px speech-mark glyph in `--white`.
- Add a persistent label pill to its left on ≥834: text `Ask Mini Vic`, `--fs-caption`,
  `letter-spacing: var(--ls-caption)`, `color: var(--mist-200)`, `background: rgb(10 10 10 / 0.72)`,
  `padding: var(--space-1) var(--space-2)`, `border-radius: 999px` — collapsing to icon-only below 834.
- Keep `data-testid="minivic-toggle"` and the 44 px minimum hit area.

**Acceptance.** A 1440 screenshot with the panel closed shows a recognisable, labelled chat affordance;
`--gold` is not used on it (it marks no sourced figure).

---

### C-05 · MAJOR · the MiniVic panel opens across the H1 and clips its own reply

**Evidence (Verified).** `1440x900-minivic-open.png`: the panel occupies x=988→1420, y=225→815 and
covers the last five characters of "Vikram Deshpande" — the name, the LCP element, and the one thing
that must never be obscured. Inside the panel, the transcript ends mid-sentence, "…the ATO work, or
how I lead" cut horizontally by the scroll box at y=692, which reads as a rendering fault rather than
an overflow.

**Direction.**
- Anchor the panel to the bottom-right and cap its height so it clears the H1:
  `bottom: calc(var(--space-3) + 4.5rem); right: var(--space-3); max-height: min(34rem, calc(100vh - 12rem));`
  — at 900 px tall this puts the panel top at y≈360, below the name's baseline.
- The transcript scroller needs a bottom fade so a mid-sentence cut reads as "scroll":
  `mask-image: linear-gradient(to bottom, #000 0 calc(100% - 2rem), transparent);` and
  `padding-bottom: var(--space-2)`.
- Header contrast: "Vikram's AI clone · ask me anything" is `--mist-400`-weight text sitting on a
  photographic backdrop. Add `text-shadow: 0 1px 3px rgb(0 0 0 / 0.65)` or a
  `linear-gradient(to top, rgb(10 10 10 / 0.85), transparent)` scrim behind the header text block, so
  the 4.5:1 holds against the photo, not just against the token. **Inferred** — contrast against a
  photo cannot be read off the token pair.

**Acceptance.** Open panel at 1440×900 and 1280×800: no part of `#hero h1` is overlapped; the last
transcript line either ends cleanly or fades.

---

### C-06 · MAJOR · hero at 390 — portrait collides with the name, provenance runs off the edge

**Evidence (Verified).** `390x844-hero.png`: the portrait tile occupies x=278→366, y=96→184. The
eyebrow "● MELBOURNE, AUSTRALIA" ends at x=252 — 26 px of air — and the H1 is forced to break
"Vikram / Deshpande" underneath it, so the name loses the one-line authority it has at every other
width. Separately, the third provenance caption `ANZ · real-time telemetry platform` runs to x=390
and is **cut by the viewport** at y=746; the page gutter is 24 px on the left and 0 px there.

**Direction.** `components/sections/Hero/Hero.module.css`, inside the existing mobile block:
- `@media (max-width: 30rem)`: move the portrait below the lede rather than beside the eyebrow —
  `.portrait { position: static; width: 100%; max-width: 9rem; margin: var(--space-3) 0 0; }` and
  remove it from the eyebrow row, so the H1 owns the full 342 px measure.
- `.figureNote` / `.provenance` (the `--fs-caption` mono lines, `Hero.module.css:234` and `:249`) —
  add `max-width: 100%; overflow-wrap: anywhere;` and confirm the stat grid inherits the 24 px right
  gutter (`padding-inline: var(--space-3)` on `.ledger` at ≤30rem).
- Set `.figureNote { min-height: calc(2 * 1.55 * var(--fs-caption)) }` at ≥52rem so the three columns'
  captions occupy the same two-line box — see C-10.

**Acceptance.** At 390: `document.documentElement.scrollWidth === 390`; no caption box extends past
x=366; H1 sets on one line per word with the portrait below the lede.

---

### C-07 · MAJOR · two identical "Download CV" buttons in one viewport

**Evidence (Verified).** `1440x900-hero.png`: a filled-outline pill "Download CV" in the nav at
(1141→1273, y=30→65) and a second, visually near-identical outline button "Download CV" at
(378→531, y=758→802), 700 px apart in the same frame. The hero's primary — "See the evidence", the
white pill — has to fight a duplicate of its own sibling for attention.

**Direction.** `components/site/Navigation.tsx` + its block in `app/globals.css`:
- Demote the nav action to text until the hero has left the viewport: remove the pill
  `border`/`background`, set `color: var(--mist-200)`, `font-size: var(--fs-small)`,
  `letter-spacing: var(--ls-small)`; restore the pill only on `[data-scrolled]`.
- Or, cheaper: change the nav label to `CV` and keep the pill — one word, unmistakably secondary.

**Why.** Two equal-weight CTAs is the classic executive-portfolio hierarchy error: the eye lands on
neither. One primary (white pill, `See the evidence`), one secondary, one persistent-but-quiet.

**Acceptance.** At 1440, the hero frame contains exactly one filled CTA and one outline CTA.

---

### C-08 · MAJOR · gold is used as a mass in Skills, not as a mark

**Evidence (Verified).** `1440x900-skills.png`: roughly twenty-five `--gold` strands sweep across
900 px of the section, plus gold node dots on every right-hand label. The doctrine in
`app/globals.css:21-33` is explicit — gold "appears ONLY where a figure has a source a reader could go
and check… the moment it becomes an accent for things that merely look important, it stops being
evidence and becomes brass." At this density the eye reads a gold **theme**, which is precisely the
failure mode the token comment names. The rule is not violated in code (each strand is a sourced
edge, so the audit passes) — it is violated perceptually.

**Direction.** `components/sections/Skills/Skills.module.css` (the wire/flow rules):
- Rest-state strands: `stroke: var(--gold); stroke-opacity: 0.28; stroke-width: 1;` and lift to
  `stroke-opacity: 0.9; stroke-width: 1.5` only for the hovered/focused node's own edges.
- Non-sourced strands: `stroke: var(--ink-500); stroke-opacity: 0.35` — the contrast between a dim
  neutral field and a few lit gold edges is what makes gold mean "checkable".
- Keep the terminal node dots gold at full opacity: eleven small gold marks reads as evidence; a gold
  ribbon field reads as decoration.

**Acceptance.** A 1440 screenshot of `#skills` at rest shows gold occupying visibly less area than the
neutral strands; hovering one capability lights that path alone.

---

## MINOR

### C-09 · MINOR · Listen buries the conversion point

`1440x900-listen.png` (**Verified**): the contact lines `sarkar.vikram@gmail.com`,
`+61 433 224 556`, `linkedin.com/in/vikramd-profile` are set in mono at `--fs-small` (14 px) in
`--mist-400`-weight grey at x=352, with the entire right half of the 1440 frame empty. This is the
page's business end and it is the quietest type on it.

**Direction.** `components/sections/Listen/Listen.module.css`:
- `.contactItem` (the `--fs-small` block at line 205) — `font-size: var(--fs-lede)` (18 px),
  `color: var(--white)`, keep `--font-mono`, `line-height: var(--lh-snug)`, and set the email as a
  filled pill matching the hero primary (`background: var(--white); color: var(--ink-900);
  padding: var(--space-2) var(--space-4); border-radius: 999px`).
- With C-01 applied (`.inner` → `var(--page-max)`), lay the four contact routes as a
  `grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: var(--space-4)` band across the
  full column, which also removes the right-hand void.

**Acceptance.** Email and LinkedIn are the second-highest-contrast elements in `#listen` after the
pull-quote; the section has no >30 % empty right column at 1440.

### C-10 · MINOR · hero stat captions are ragged

`1440x900-hero.png` (**Verified**): columns 1 and 2 wrap their mono provenance to two lines
(y=632 and y=650) while column 3 wraps to two as well but the label row above sits on a different
baseline; the footnote then starts at y=684 relative to the tallest column, so the group's bottom edge
is uneven against the 8-pt grid. Fix with the `min-height` in C-06 and set the footnote
`margin-top: var(--space-3)` (24 px) rather than deriving it from the tallest caption.

### C-11 · MINOR · About dial and list do not share a baseline

`1440x900-about.png` (**Verified**): the ten-item list's first hairline rule sits at y=600; the dial's
outer ring begins at y≈615 and its "01" tick at y=655. Set the dial wrapper
(`About.module.css:125`, `max-width: 24rem`) to `align-self: start; margin-top: 0;` and let the grid
row start both children at the same y, so the compass reads as the list's instrument rather than a
floating graphic. Also raise the `NO SCORES` centre label from its current near-`--ink-500` grey to
`--mist-400` — it is the one word that explains the whole visualisation.

## POLISH

### C-12 · POLISH · colour discipline is clean — keep it

**Verified**: `app/globals.css:6-14` defines every neutral with equal R=G=B (`#0A0A0A`, `#131313`,
`#1C1C1C`, `#3C3C3C`, `#909090`, `#CDCDCD`, `#F6F6F6`, `#B8B8B8`). No cool tint exists in the token
set, and none is visible in any of the 38 captures. `--gold #c9a84c` appears only on caliper jaws, the
Skills wires and repository marks. The obsidian/white/gilt target is met at the token level; C-08 is
about gold's *area*, not its hue.

---

## Summary table

| id | sev | section | one line |
|---|---|---|---|
| C-01 | blocker | page | three content widths → left edge walks 176/96/352 at 1440 |
| C-02 | blocker | vitrine | rail spine 336 px off its own heading at 1920; card cut with no mask |
| C-03 | major | experience | duration labels overflow the card; clipped at 834 |
| C-04 | major | chrome | MiniVic launcher is an empty ring — no glyph, no label |
| C-05 | major | chrome | panel covers the H1; transcript clipped mid-sentence |
| C-06 | major | hero @390 | portrait collides with the name; caption runs off the edge |
| C-07 | major | hero/nav | two "Download CV" buttons in one viewport |
| C-08 | major | skills | gold reads as a field, not a mark |
| C-09 | minor | listen | contact details are the quietest type on the page |
| C-10 | minor | hero | stat captions ragged against the 8-pt grid |
| C-11 | minor | about | dial baseline 15 px off the list's first rule |
| C-12 | polish | page | achromatic discipline verified clean |
