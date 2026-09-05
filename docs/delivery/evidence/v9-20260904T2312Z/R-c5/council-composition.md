# Council — Composition, typography, colour, hierarchy (R-c5)

Run `v9-20260904T2312Z` · commit `e64566e3` · cycle c5 · reviewer: senior creative UI designer
Verdict: **FAIL** (6 major, 3 minor, 3 polish). Nothing here is a blocker — the page renders,
reads and holds its monochrome. It is not yet at Fortune-500 C-suite calibre because the page
has no single vertical spine, the Experience visualisation is functionally invisible, and gold
has stopped being a claim in Skills.

Evidence base: every PNG under `docs/delivery/evidence/v9-20260904T2312Z/R-c5/capture/`
(390 / 834 / 1280 / 1440 / 1920 per section, plus minivic-panel and reduced-motion), read in
this session; CSS read before citation (`app/globals.css`, all six
`components/sections/<X>/<X>.module.css`).

## Colour discipline — verified clean

`app/globals.css:6–14` — every achromatic token is R=G=B (`#0A0A0A #131313 #1C1C1C #3C3C3C
#909090 #CDCDCD #F6F6F6 #EBEBEB #B8B8B8`). **No cool-tinted grey anywhere in the token set.**
The obsidian/white axis is correct. The only warm ink is `--gold #c9a84c` and its ramp — the
problem is not the hue, it is the dosage in Skills (C3).

---

## Findings, ranked by damage to a hiring executive's first ten seconds

### C1 — major — The page has five different left edges (no vertical spine)

**Verified.** Measured off `1440x900-*.png`, left edge of first ink per section:
hero 176 px · about / experience / skills 96 px · vitrine header 168 px · vitrine cards 72 px ·
listen 352 px (centred). At 1920 the same split reads hero 416 px vs sections 336 px.
Cause, read in source: `Hero.module.css:89` `.inner{max-width:68rem}` while
`About/Experience/Skills.module.css` use `max-width:78rem`; `Vitrine.module.css:19+21` puts the
header inside the 78 rem container *and* adds the page gutter again (96+72=168), while
`.rail` (`:57`) is full-bleed at gutter only (72). `--page-gutter` is referenced in five files
and **defined nowhere** — every call site runs on its fallback.

Direction:
- `app/globals.css` `:root` — add `--page-max: 78rem;` and `--page-gutter: clamp(1.5rem, 5vw, 5rem);`
  (currently only a fallback literal, `globals.css` has no `--page-gutter` declaration).
- `components/sections/Hero/Hero.module.css:89` `.inner` — `max-width: 68rem` → `max-width: var(--page-max)`.
- `components/sections/Vitrine/Vitrine.module.css:21` `.head` — delete the second
  `padding: 0 var(--page-gutter,…)`; the 78 rem container at `:19` already sets the inset.
  Keep `.rail:57` padding as is so cards start on the same 96 px line as every heading.
- Why: a scanning executive reads the left margin as the page's posture. Five edges read as five
  templates stitched together — the single loudest "not finished" signal on the site.

Acceptance: at 1440 and 1920, the eyebrow of all six sections and the first vitrine card share one
x within ±1 px.

### C2 — major — Experience bars sit at ~1.9:1 and disappear

**Verified.** `1440x900-experience.png`: the eight duration bars are barely separable from the
panel; the ATO bar (6 mo — his current, most relevant role) is a ~30 px stub jammed at the panel's
right border. `Experience.module.css:169` `background: rgb(246 246 246 / 0.22)` composited over
`:92` `rgb(255 255 255 / 0.055)` over `#0A0A0A` resolves to ≈ `#414141` on ≈ `#111111` →
**1.88:1**, under the 3:1 WCAG 1.4.11 floor for a graphical object that *is* the content.

Direction:
- `components/sections/Experience/Experience.module.css:169` — `rgb(246 246 246 / 0.22)`
  → `rgb(246 246 246 / 0.46)` (resolves ≈ `#787878` on `#111` ≈ 4.4:1, still clearly below the
  `var(--white)` hover state at `:181`).
- Same file `:151` row separator `rgb(255 255 255 / 0.05)` → `rgb(255 255 255 / 0.08)` so the
  grid reads as a chart rather than a smudge.
- Right-align the row-label column: `:112` `grid-template-columns: clamp(7rem,22%,14rem) minmax(0,1fr)`
  keep, add `text-align: right; padding-right: var(--space-2)` to the label cell — the label
  column is currently left-ragged (labels end anywhere from x=138 "MYOB" to x=308 "Australian
  Taxation Office (ATO)"), which is the one place a chart must be flush.

Acceptance: bar fill vs panel ≥ 3:1 measured; labels flush right against the axis at 1440/834.

### C3 — major — Skills spends gold on everything, so gold claims nothing

**Verified.** `1440x900-skills.png` and `1920x1080-skills.png`: roughly thirty leader curves and
8 of the 10 right-hand node dots render gold. The section turns the page warm and, per the site's
own contract (`CLAUDE.md` prime directive 4, `globals.css:17–33`), gold must mark *only* a figure
with a checkable source. When four-fifths of the marks are gold the mark has no discriminating
power left, and the page's one colour event lands on its least load-bearing section rather than on
the hero's evidence.

Direction:
- `components/sections/Skills/Skills.module.css` — set the default wire stroke to
  `rgb(255 255 255 / 0.16)` and apply `var(--gold)` **only** on the `[data-sourced="production"]`
  wires (retain the existing gold on the node dot that carries a production source).
  Target ≤ 30 % of wires gold; keep gold stroke-width 1 px and raise achromatic wires to 1 px too
  so weight, not hue, is what a reader notices first.
- Same file `:51` lede block — the section carries two consecutive intro paragraphs at two sizes
  and two colours (white `--fs-lede` at y≈337, grey `--fs-body` at y≈480, 83 px apart against the
  40 px header→lede gap used everywhere else). Merge into one lede at `--fs-lede`, or demote the
  second to the mono provenance line style already used in About (`Dimensions taken verbatim from…`).

Acceptance: gold marks are countable at a glance (< 1/3 of wires); one lede paragraph; the section
does not read warmer than the other five when the full-page PNG is viewed at 25 %.

### C4 — major — Hero leaves the right 30 % of a 1920 canvas empty, with an orphaned footnote in it

**Verified.** `1920x1080-hero.png`: content stops at x≈1440, the canvas runs to 1920 — a 480 px
void. The provenance note ("self-reported, from my CV…") floats alone at x=1264–1420 as a fourth
column of a three-column ledger (`Hero.module.css:171`
`grid-template-columns: minmax(0,1fr) minmax(0,15rem)`), bottom-aligned against caption text that
wraps to two lines, so its baseline matches nothing. The comment on `:170` says the split exists
"because the hero's right half was empty" — the split did not fill it; it put a footnote where a
figure should be.

Direction:
- `Hero.module.css:171` `.ledgerRow` — drop the second column: `grid-template-columns: minmax(0,1fr)`.
- Move the note under the ledger as a full-width mono line: `font-size: var(--fs-micro);
  color: var(--mist-400); margin-top: var(--space-2); max-width: var(--measure-read)` — a footnote
  belongs under the table it annotates, not beside it.
- `Hero.module.css:89` with C1 applied (68→78 rem) recovers 80 px of the void; give the hero
  atmosphere canvas a visible light source right of the type (it already renders there) rather
  than adding UI.

Acceptance: at 1920 no element sits right of x≈1584 (78 rem + gutter); the note sits under the
three figures, left-flush with them.

### C5 — major — 390 px: the hero ledger cramps and a caption bleeds past the page gutter

**Verified.** `390x844-hero.png`: figure and caption sit in two columns; the caliper bracket around
`≈92%` is separated from its caption by a ~28 px dead gap, and the third caption
`ANZ · real-time telemetry platform` runs to x=390 — **it touches the viewport edge**, breaking the
24 px page gutter every other element respects. `Hero.module.css:360` collapses `.ledger` to
`grid-template-columns: 1fr` only below 860 px, but `.ledgerItem` keeps a row layout at 390.

Direction:
- `Hero.module.css` `@media (max-width: 520px)` — force `.ledgerItem { display: flex;
  flex-direction: column; align-items: flex-start; gap: var(--space-05); }` and
  `.ledgerCaption { max-width: 100%; padding-right: var(--space-2); }`.
- Reduce mono caption to `--fs-micro` at ≤ 520 px so `ANZ · real-time telemetry platform` sets on
  one line inside the gutter.

Acceptance: at 390 no text renders within 24 px of either edge; each figure sits directly above its
own caption.

### C6 — major — Listen: heading and pull-quote are the same size, and the contact block has no CTA weight

**Verified.** `Listen.module.css:38` `.title{font-size: var(--fs-title)}` and `:56` `.sentence
{font-size: var(--fs-title)}` — the section h2 and the four-line italic quote are set at the identical
step (56 px at 1440, confirmed in `1440x900-listen.png`). The quote out-masses the heading purely by
line count, so the hierarchy inverts. Below it, the four contact routes render as four undecorated
mono lines (`sarkar.vikram@gmail.com`, phone, LinkedIn, GitHub) at `--fs-small` grey — the final
call to action on a hiring page is styled like a log file.

Direction:
- `Listen.module.css:56` `.sentence` — `font-size: var(--fs-title)` →
  `font-size: clamp(1.75rem, 3.2vw, 2.6rem)`, `line-height: var(--lh-snug)` kept, and widen
  `max-width: var(--measure-display)` (26 ch) → `32ch` so it sets in three lines, not four.
- `Listen.module.css:96` contact list — give the email and LinkedIn rows the hero's action
  treatment: `border: 1px solid var(--card-border); border-radius: 999px; padding: var(--space-1)
  var(--space-3); font-family: var(--font-body); font-size: var(--fs-body); color: var(--white)`,
  keeping phone/GitHub as mono text. Two ranked actions, not four flat ones.
- The live GitHub URL is the one place gold is *earned* here (`CLAUDE.md` directive 4: live
  repository URLs) — currently rendered grey. Apply `color: var(--gold)` to it.

Acceptance: h2 is visibly the largest type in the section; email + LinkedIn read as buttons at
1440 and 390; the GitHub URL is the only gold in the section.

### C7 — minor — Vitrine: the carousel doesn't announce that it scrolls, and resting cards fall under AA

**Verified.** `1440x900-vitrine.png`: card 03 is sliced by the viewport with no edge mask, no rail,
no arrows; cards 01 and 03 are dimmed so their 15 px body copy renders ≈ `#7D7D7D` on `#131313`
≈ **3.9:1** — under 4.5:1 for text below 24 px.

Direction:
- `Vitrine.module.css:55` `.rail` — add
  `mask-image: linear-gradient(90deg, transparent 0, #000 var(--page-gutter), #000 calc(100% - 4rem), transparent 100%)`
  and a visible 2 px thumb track under the rail (`--card-border` track, `--mist-400` thumb).
- Raise the resting card opacity so body copy resolves ≥ 4.5:1 — set the dim state to
  `opacity: 0.72` (from the current ≈0.45) and keep the lit card at 1.

Acceptance: the third card is masked rather than cut; dimmed body copy ≥ 4.5:1 measured.

### C8 — minor — MiniVic: the transcript is sliced mid-sentence and the launcher pokes out under the panel

**Verified.** `1440x900-minivic-panel.png`: the first reply is cut horizontally through the word
"lead" at the transcript container's bottom edge — a hard slice, no fade, no scroll cue. The
launcher puck (bottom-right, y≈848) is drawn *behind* the panel's bottom-right corner and its arc
is visible outside it.

Direction:
- `components/MiniVicBot` transcript container — add
  `mask-image: linear-gradient(#000 calc(100% - 2rem), transparent)` and `overflow-y: auto;
  scroll-behavior: smooth`, and pin the newest message to the top of the visible box.
- Panel geometry: stack the panel **above** the launcher — `bottom: calc(var(--space-3) + 4rem)`
  with `right: var(--space-3)` — so the puck never renders inside the panel's footprint.

Acceptance: no message is cut mid-word at 1440/834; the launcher is fully outside the open panel.

### C9 — minor — Running measure is 70 ch at 1440

**Verified.** `globals.css:194` `--measure-read: clamp(58ch, 64ch + 0.4vw, 72ch)` resolves to ≈70 ch
at 1440 / 72 ch at 1920. Executive-report typography lands at 62–68 ch; at 70+ the return sweep
starts costing the reader (visible in `1440x900-experience.png`, three-line lede running to x=818).

Direction: `globals.css:194` → `clamp(56ch, 60ch + 0.3vw, 66ch)`. Affects About, Experience,
Skills, Vitrine ledes uniformly.

Acceptance: no running paragraph exceeds 66 ch at any of 1280/1440/1920.

### C10 — polish — Skills leader-line digits collide with their wires

**Verified.** `1440x900-skills.png`: the count digit after each left-hand label ("2", "3", "1")
sits ~1 px from the start of its leader line at x≈332. Direction: `Skills.module.css:123`
`gap: var(--space-1)` → `var(--space-2)` on the label row, or add `padding-right: var(--space-1)`
to the count cell. Acceptance: ≥ 8 px between digit and wire at 1280–1920.

### C11 — polish — The MiniVic launcher reads as an empty puck

**Verified.** Visible in `1440x900-about/experience/skills/vitrine/listen.png` as an unlabelled dark
circle with a thin ring. A hiring executive has no reason to press it. Direction: add a persistent
`aria-label`-matching visible label pill on ≥ 834 px (`Ask Mini Vic`, `--fs-caption`,
`letter-spacing .08em`, `--mist-200` on `--card-bg`, collapsing to the bare puck at ≤ 520 px), and
lift the ring to `--card-border-hover` so the affordance survives on the near-black sections.

### C12 — polish — Hero body measure and eyebrow rhythm

**Verified.** `1440x900-hero.png`: the statement wraps at ≈72 ch (fixed by C9); the eyebrow's
leading dot sits 10 px from "MELBOURNE" while the same dot pattern in Listen uses 8 px. Direction:
`Hero.module.css:120` `gap: var(--space-1)` is correct — align Listen's kicker to the same
`--space-1` so the two eyebrows share one rhythm.

---

## Not defects (checked, passing)

- Type scale (`globals.css:153–162`) is a clean fluid ramp; the serif/Inter/Plex split is used
  exactly as documented (serif = titles + figures, mono = provenance only). **Verified** across all
  section PNGs.
- 8-pt grid: every padding/gap I read resolves to a `--space-*` step or a clamp over two of them.
  **Verified** in the six module files.
- Reduced-motion hero (`1440x900-reduced-motion-hero.png`) holds the full composition with the
  atmosphere static — no layout shift versus the animated capture. **Verified.**
- Nav chrome: `VIKRAM.` lockup, `Download CV` pill and `MENU` sit on one 88 px bar with correct
  optical centring at every width captured. **Verified.**
