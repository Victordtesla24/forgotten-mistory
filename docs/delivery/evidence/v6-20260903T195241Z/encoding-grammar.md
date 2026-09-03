# The Data-Visual Encoding Grammar

**Artifact:** execution step 11 — *"Lock the data-visual encoding grammar."* → **Gate K** (T-25)
**Requirements discharged:** R-93, R-95, R-97, R-98, R-99, R-100, R-101, R-109, R-110, R-111 · §7.8 Visualisation Craft
**Success criteria served:** SC-53.1, SC-54.1, SC-55.1, SC-56.1, SC-57.1, SC-62.1
**Repository:** `/root/forgotten-mistory` · **Production:** https://forgotten-mistory.web.app/
**Written:** 2026-09-03

---

## 0 · What this document is, and what it is not

This is the **normative** grammar. One grammar, site-wide, binding on every mark on
every surface — SVG, Canvas 2D, WebGL, and the HTML that carries them. R-110 requires
exactly one; §7.8 requires it to be honest before it is beautiful, and then beautiful
without compromise.

Two kinds of statement appear below, and they are never mixed:

- **Observed.** A rule the codebase already enforces, cited to `file:line`. These are
  not proposals; they are the grammar being described from the artefact that already
  obeys it, which is the only way R-110's "one grammar" survives a rebuild.
- **Binding.** A rule this document locks for everything not yet built. It is a
  requirement on future work, not a claim about present state.

No performance figure in this document is a measurement. Envelopes are **declared
budgets** in the sense R-100 uses ("declared memory ceiling"); the measurements that
test them are produced by T-22 and recorded separately. Nothing here asserts a number
that has been benchmarked, because nothing here has been benchmarked.

---

## 1 · The grammar in one sentence

> **Position and length carry magnitude; colour carries provenance; the gold mark
> carries the single claim the view exists to make — and every one of the three can be
> read without moving the mouse.**

Everything below is that sentence made falsifiable.

---

## 2 · Scale semantics

### 2.1 · The channel ranking (binding)

Encode the message on the strongest channel available, in this order, and never reach
past a channel that would have worked:

| Rank | Channel | Encodes | Notes |
|---|---|---|---|
| 1 | Position on a common scale | quantity, time, rank | The default. Two things comparable must sit on **one** axis. |
| 2 | Length / extent from a common baseline | duration, count, span | Bars, spans, tracks. Baseline is always drawn. |
| 3 | Angle on a shared centre | proportion of a whole, orientation | Only where a whole genuinely exists. |
| 4 | Area | magnitude, sqrt-scaled | Radius ∝ √value, never radius ∝ value. Label the value directly. |
| 5 | Luminance / opacity | ordered emphasis, recency, confidence | Ordered only. Never a category. |
| 6 | Texture (hatch, dash) | a **kind**, never a quantity | The 45° hatch is reserved — see 2.3. |
| 7 | Shape / glyph | category | Small cardinality only (≤ 5). |

**Observed:** Experience draws every role's duration as length from one common
baseline across one sixteen-year axis, and prints the duration as text on the same
element — `components/sections/Experience/Experience.tsx:36-39` ("sixteen years on one
axis"), tracks and axis ticks computed from the same `(year - TIMELINE_START) / (NOW -
TIMELINE_START)` expression at `:86` and `:141`, so the bars and the ruler can never
drift apart. Month-precision spans are authored as decimal years in
`app/data/portfolio/experience.ts:23-56`.

### 2.2 · Honest axes (binding, and non-negotiable)

- **Quantitative axes begin at zero.** No truncated baselines, no broken axes, no
  "zoomed" y-ranges that manufacture a slope. If a difference is too small to see at a
  zero baseline, the honest response is to say the difference is small, in words, in
  the takeaway line — not to re-scale until it looks large.
- **Time axes run left-to-right, oldest to newest,** and are drawn to real elapsed
  time. A three-month engagement is drawn three months wide next to a 7.8-year one.
  This is the whole content of R-169 and R-174: the asymmetry in the drawing **is** the
  argument, and equalising the bars to make a layout tidier destroys the only fact the
  chart contains.
- **One axis per comparison.** Two scales on one chart (a second y-axis) are
  prohibited: the crossing point is an artefact of the two ranges chosen, and a reader
  cannot check it.
- **Log scales are permitted only** where the data spans ≥ 3 orders of magnitude, the
  base is labelled on the axis, and the takeaway line says the scale is logarithmic.
- **No axis is ever omitted to reduce clutter.** If the axis is noise, the chart is
  the wrong chart.

### 2.3 · The calibration scale is nominal, and stays nominal (binding)

The three calibration states — `production` / `non-production` / `pending`, glossed
*measured in production* / *measured outside production* / *in progress, not yet held*
(`app/data/portfolio/skills.ts:75-80`) — and the three caliper states — `sourced` /
`self-reported` / `open` (`components/marks/Caliper.tsx:7`, glosses at `:44-48`) — are
**categorical**. They say **where the evidence came from**, never **how good he is at
it** (`app/data/portfolio/skills.ts:30-33`).

Therefore, everywhere and forever:

- They are **never** mapped to a ramp, a gradient, a bar length, a node size, an
  ordering, or a score. Doing so re-introduces the proficiency bar through the back
  door, which is precisely what `skills.ts:6-9` exists to refuse: *"nobody can check a
  claim that leadership is at 90%."*
- They are drawn with **texture and terminal form**, not intensity: solid arms; solid
  arms with a grey value; dashed arms that do not meet over a 45° hatch.
- The **open** state is a *positive* mark — "measured, and found honestly
  unmeasurable" — not an absence (`components/marks/Caliper.tsx:26-31`). It is never
  rendered as a gap, a placeholder, a dimmed row or a zero.
- The same 45° hatch means the same thing wherever it appears, including the
  role-computed sectors on the About instrument. A reader learns the mark once.

### 2.4 · Zero, absent, and withheld are three different marks (binding)

| State | Meaning | Mark |
|---|---|---|
| A measured zero | the quantity was measured and is 0 | the value `0`, calipered `sourced` |
| Not measurable | sought, and honestly cannot be measured | open caliper, **reason** in the value slot |
| No evidence yet | there is nothing to show | **no row, no node, no wire** |

**Observed:** the third rule is already load-bearing —
`components/sections/Skills/Bench.tsx:33-37`: *"The one capability with no evidence yet
has no wire at all, because a line to nowhere would be exactly the dishonesty the rest
of the section is built to avoid."* And `app/data/portfolio/skills.ts:23-25`: *"A
capability without evidence does not get a row. Not a dimmed row, not an empty cell —
no row."*

**Binding, R-175:** no counter, axis or figure may pass through a state that reads as a
real value it is not. Final values render on first paint, before any animation, under
`prefers-reduced-motion`, and with JavaScript disabled or failed. A site whose argument
is that it refuses to publish an unsourced number cannot show `$0M+` for one frame.

### 2.5 · Density (binding)

Density is **earned**, never decorative. A mark is permitted only if it is (a) real
data from the canonical layer, and (b) individually resolvable at the reader's DPR, or
(c) part of a distribution the takeaway line explicitly reads as a distribution. Marks
that exist to make a view look busy are deleted under R-106.

---

## 3 · Emphasis rules

### 3.1 · Exactly one gold mark per view (binding, absolute)

Gold — `#c9a84c`, `lib/palette.ts:18`, taken verbatim from the Aether brand palette so
the portfolio and the product read as the same hand — means **one thing**:

> **This figure has a source you can go and check.**

Rules, in force everywhere:

1. **One gold mark per view.** A "view" is what is on screen at one time: a section's
   hero visualisation, a card, a diagram, a panel. Two gold marks in one view means the
   view has not decided what it is claiming.
2. **Gold is a mark, never a fill, never a theme.** No gold backgrounds, no gold
   gradients, no gold hover states on non-evidential elements, no gold in the
   navigation, no gold on a button because it is the primary button.
3. **Gold never means "here".** A mark showing where the reader is standing is white,
   because an accent that also means "here" stops meaning "sourced". Current position,
   selection and focus are drawn in white/`accent` (`#E8EBF0`, `design-tokens.json`
   `colors.accent`).
4. **Gold never encodes magnitude.** No gold ramp, no gold-to-grey scale, no "more
   gold = more of it". See 3.3.
5. **Gold is conditional on the data, evaluated at render, not authored per view.**
   **Observed:** `components/sections/Skills/Bench.tsx:33-36` — *"A wire is gold only
   where the evidence at its end was measured in production. Grey where it was measured
   somewhere that was not."* The gold is a function of `status`, so it cannot be
   applied to something that has not earned it.

### 3.2 · The emphasis ladder below gold (binding)

When a view needs a second and third level of emphasis — and it usually does — take
them in this order, never by reaching for a second hue:

1. **Luminance.** `white` `#F4F6FA` → `mist.200` `#C9CDD6` → `mist.400` `#8A8F9A` →
   `ink.500` `#3A3D46` (`design-tokens.json` `colors`).
2. **Weight / stroke width.** 1px hairline is the resting state; 1.5–2px is emphasis.
   Never > 2px on a data mark.
3. **Dimming the complement.** Raise the subject by lowering everything else.
   **Observed and binding as a rule:** hover/focus on the Bench dims what a node is not
   connected to — and this is *a reading aid, not a disclosure*: every wire and every
   label is present and legible before anyone touches it
   (`components/sections/Skills/Bench.tsx:38-42`). **No datum may exist only inside an
   interaction.** That is the single most important emphasis rule in this document,
   because it is what keeps the site honest to a reader who never hovers, a crawler, a
   screen reader and a printout simultaneously.
4. **Scale**, last, and only for a hero mark.

### 3.3 · Colour never encodes magnitude (binding, absolute)

The site is monochrome by mandate (`design-tokens.json` `metadata.note`;
`lib/palette.ts:2-5`). There is exactly one hue, and it is a **categorical** mark. It
follows that:

- There are **no sequential palettes**, no diverging palettes, no heatmap ramps, no
  "warm = high / cool = low", no viridis, no chromatic legend of any kind.
- Where a quantity must be shown across a surface (a density field, a distribution),
  it is encoded in **luminance only**, the ramp is monotonic, and the extremes are
  **directly labelled with their values** so the reader never has to invert a colour to
  a number by eye.
- No library default palette ever ships. SC-54.1 counts "zero default library
  theming"; d3's `schemeCategory10` appearing anywhere is a Gate K failure.

---

## 4 · Axis and label treatment

**Binding, all classes:**

- **Type.** Two faces site-wide (SC-28.1). Numerals in data positions are **tabular**
  so columns of figures align optically (R-103). Units are set once, on the axis or in
  the takeaway line, never repeated on every tick.
- **Ticks.** Sparse and meaningful — decade or era boundaries, not an even division of
  an arbitrary range. **Observed:** Experience ticks on `DECADES`
  (`components/sections/Experience/Experience.tsx:80, 137-141`).
- **Gridlines** are hairlines behind the data at the lowest legible luminance, and are
  `aria-hidden` — they are a ruler, not content. **Observed:**
  `components/sections/Experience/Experience.tsx:79` (`<div className={styles.grid}
  aria-hidden="true">`), and the axis strip at `:136`.
- **The same expression positions the datum and its ruler.** A gridline computed from
  a different expression than the bar it rules is a lie waiting to happen. **Observed:**
  `Experience.tsx:86` and `:141` use one expression.
- **Rotated axis labels are prohibited.** If labels do not fit horizontally, transpose
  the chart or shorten the labels; a reader should never tilt their head. Every dataset
  in `app/data/portfolio/` therefore carries an authored short form — e.g. `short` on
  every `Capability` (`app/data/portfolio/skills.ts:64-65`) — rather than a truncation
  computed at render.
- **No label is ever ellipsised or auto-truncated.** Truncation is authored upstream
  in the data, by a person, or it does not happen.
- **Optical, not metric, alignment.** Baselines align to the mark's optical edge; tick
  labels are centred on the tick, not on the tick's bounding box.

---

## 5 · Direct labelling, not legends (§7.8)

**Binding.** A legend forces a reader to hold a colour in working memory, look away,
and come back. The grammar prefers the label sitting on the thing.

Precedence, in order:

1. **Label on the mark.** The name is written on, in, or immediately beside the datum.
2. **Label at the end of the mark.** Series names at the terminus of a line or span;
   no line leaders where the label can simply sit there.
3. **Leader line to the label**, hairline, one bend maximum, only where 1 and 2
   collide.
4. **A legend**, only when all three of these hold: (a) ≥ 6 series, (b) the marks are
   too small to carry text at any DPR, and (c) the legend can sit inside the view
   without scrolling. R-98 permits a legend "where needed"; this clause defines needed.

Additional rules:

- **The three calibration states are taught by their glosses, not by a legend.** Each
  caliper announces its own meaning inline — *"(Measured; source given.)"*,
  *"(Not measurable; reason given.)"* — as real text, to every reader
  (`components/marks/Caliper.tsx:41-48, 53`). A reader meets all three states in the
  hero and the ledger and reads the rest of the page through them, without a key.
- **A value shown as a shape is also shown as a number** wherever the number is what
  the reader would want: the Experience tracks print `yr` / `mo` on the bar
  (`components/sections/Experience/Experience.tsx:117-119`).
- **Where a legend is unavoidable, it is not colour-only.** Each entry carries its
  glyph *and* its words — the pattern `statusLegend` already uses (`glyph` + `label`,
  `app/data/portfolio/skills.ts:75-80`).

---

## 6 · Render architecture by class (R-109)

One renderer per class. The class is chosen by what the artefact **is**, never by
what is fashionable or what is already imported.

| Class | Renderer | Use for | Never use for |
|---|---|---|---|
| **Diagrams & precision graphics** | **SVG**, hand-authored or D3-positioned | system diagrams, mechanism drawings, flows, charts under ~2k marks, anything with text | dense scatter; anything animating per-frame |
| **High-density plots** | **Canvas 2D** | > ~2k marks, distributions, density fields, dense timelines, sparkline grids | anything whose labels must be selectable or crawlable |
| **Spatial & cinematic scenes** | **WebGL** (`three.js` / React Three Fiber) | volumetric fields, depth, atmosphere, spatial topology | charts; anything a reader must read a value off |

**Binding rules that cross the classes:**

1. **Text is HTML or SVG `<text>`, never painted into a canvas or a texture.**
   **Observed, and this is the rule generalised from a real decision:**
   `components/sections/Skills/Bench.tsx:24-31` — *"The rails are HTML, the wires are
   SVG. Labels rendered as SVG `<text>` hint differently from the rest of the page and
   cannot be selected, tabbed to or read by a screen reader as the buttons they behave
   like. So the two rails are real `<button>` elements in normal flow, their anchor
   points are measured from layout, and only the curves are drawn — which is the one
   thing HTML cannot do."*
2. **Never draw the same data twice in two renderers.** **Observed:**
   `components/sections/Experience/CareerStrata.tsx:11-16` — the WebGL layer draws
   *texture*, not the roles, because *"the DOM chart is the data, and a second, subtly
   misaligned copy of it in 3D was actively misleading."* A WebGL layer behind a chart
   is atmosphere; the moment it re-states a number it becomes a second source of truth
   that can disagree with the first.
3. **One WebGL context per section, and none on a phone** — the engineering posture
   preserved by R-170 and stated publicly in the colophon
   (`app/data/portfolio/listen.ts:47`). A new capability is delivered **within** this
   constraint, never by relaxing it.
4. **The WebGL runtime is never on the critical path.** It is reached through a
   dynamic import so `three` and `@react-three/fiber` land in a chunk fetched when a
   scene mounts (`components/gl/GLCanvas.tsx:11-21`).
5. **Device-pixel ratio is capped at 1.75** (`components/gl/GLCanvas.tsx:28`), and the
   stencil buffer is off for scenes that never depth-sort against a cleared background
   (`:33`). Precision graphics (SVG) render crisply at every DPR by construction, which
   is the other half of R-103.
6. **A software rasteriser is treated as unsupported** — a static page beats a
   stuttering one (`components/gl/useGLCapability.ts:33-37`). The fallback is a
   composition, not an error state.

---

## 7 · Diagram grammar (R-98)

**One flow direction, site-wide: left → right**, and it mirrors a real system
boundary, never a layout convenience.

- **Left is input / earlier / upstream. Right is output / later / downstream.** Time
  and causality run the same way as the Experience axis, so a reader who has learned
  the site's charts already knows how to read its diagrams.
- **Vertical is used for one thing only: rank within a stage** (parallel workers, the
  branches of a gate). It never carries time.
- **A loop is drawn as an explicit return edge** below the flow, labelled with what
  travels back. Loops never reverse the primary direction.
- **A boundary is drawn where a boundary exists** — a process, a host, a trust
  boundary, an API edge — as a hairline enclosure with the boundary's real name. No
  decorative grouping. **Observed:** the six mechanism drawings run a single
  left-to-right mechanism per plate and describe it in prose, e.g. *"Twenty engine
  nodes in a line carry one job application from left to right. Near the end, a
  vertical gate intercepts a proposed sentence and strikes it through"*
  (`components/sections/Vitrine/Drawings.tsx:33-40`).
- **Edges are labelled with what flows, not with a verb.** "reverted claim", "PEM
  key", "SMF record" — not "sends", "calls".
- **Routing:** orthogonal or a single smooth curve; one bend class per diagram; edges
  never cross a node; crossings are minimised and, where unavoidable, hopped.
- **One viewBox per diagram family** so a set reads as a set — `'0 0 320 200'`
  (`components/sections/Vitrine/Drawings.tsx:23`), with a deliberate exception cropping
  the same grid where the drawing is shorter (`:84`), not a different grid.
- **Hairlines only, in `currentColor`. No fills, no gradients, no hue** — the drawings
  inherit the surface's colour so the section's light falls on them
  (`components/sections/Vitrine/Drawings.tsx:16-18`).
- **Never a screenshot, a logo, or a laptop mockup.** *"A screenshot shows what a
  repository looks like; a mechanism drawing shows what it does, which is the only thing
  a technical reader is actually assessing"* (`Drawings.tsx:13-16`).

---

## 8 · The dual-read contract (R-99)

Every registered visualisation ships all three of these, and they are checked in this
order at Gate K:

| Read | Duration | Must deliver |
|---|---|---|
| **Headline** | 3 s | the shape of the answer, from the marks alone, with no interaction and no reading of body text |
| **Detail** | 30 s | the specific values, their units, and where each came from — still without interaction where possible |
| **Takeaway** | one line | the claim, in the site's voice, sitting with the artefact |

The takeaway line is **authored prose, not a caption of the chart type**. "Roles drawn
to real duration" is a caption. "The eight years at ANZ are why the rest of this reads
the way it does" is a takeaway. It states what the reader should conclude, and it is
falsifiable against the same data the marks render.

---

## 9 · The accessible-equivalent contract (R-101)

This is a **contract**, not a checklist: a visualisation is not shippable until all
five clauses hold. A section that renders no text to a reader or a crawler fails R-101
regardless of how it looks (R-176).

### 9.1 · Keyboard traversal

- Every datum a pointer can reach, a keyboard can reach. Data marks are real
  focusable elements — `<button>` in normal flow where they behave like buttons
  (`components/sections/Skills/Bench.tsx:24-31`; role tracks are `<button>` at
  `components/sections/Experience/Experience.tsx:97-101`).
- Tab order follows the **data order**, not the paint order.
- Arrow keys move within a visualisation (next/previous node, next/previous role);
  Tab moves between visualisations. Escape returns focus to the visualisation's own
  entry point and clears any drill-down.
- Focus is always visible, always designed, never a browser default (SC-30.1).
- No keyboard trap, ever: every zoom, drill-down and filter has a keyboard exit.

### 9.2 · ARIA structure

- A visualisation that is one picture is `role="img"` with a `<title>` **and** a
  `<desc>`, referenced by `aria-labelledby` — the existing pattern at
  `components/sections/Vitrine/Drawings.tsx:33-40` and
  `components/sections/About/Compass.tsx:130-131`.
- A visualisation that is a set of things is a **list or a group of controls**, with
  each datum carrying an accessible name that contains its **value and its units**, not
  just its label: `aria-label={`${role.role}, ${role.company}, ${role.dates}`}`
  (`components/sections/Experience/Experience.tsx:101`).
- **State is announced, not only drawn.** The caliper announces its state to assistive
  technology as well as drawing it, *"because a mark that only exists visually would
  make the same claim to sighted readers and no claim at all to everyone else"*
  (`components/marks/Caliper.tsx:34-37`).
- Rulers, gridlines and atmosphere are `aria-hidden` (`Experience.tsx:79, 136`).
- Live regions are used only for changes a reader asked for (a filter result count),
  and are polite.

### 9.3 · Insight-equivalent text alternative

The alternative conveys **the insight**, not the pixels. The test: *could a reader who
never sees the image reach the same conclusion the takeaway line states?*

- Prohibited: "a chart showing skills"; "bar chart of career"; a bare data table
  offered as the equivalent of a topology.
- Required: a sentence that names the shape, the extreme, and the comparison the view
  exists to make — followed by the values as real text.
- **The underlying record is always present as text on the page**, not hidden behind a
  toggle. On Skills the full record with its evidence *"sits directly beneath"* the
  drawing (`components/sections/Skills/Bench.tsx:38-42`), so the accessible equivalent
  and the visible page are the same artefact. This is the preferred form everywhere:
  the equivalent is not an accommodation bolted on, it is the section's own prose.

### 9.4 · The reduced-motion composition must be beautiful

`prefers-reduced-motion` and the no-WebGL path do not degrade to a blank box, a
spinner, or an apology. They resolve to a **composed still** — the same encoding, the
same gold rule, the same labels, at rest. R-100's "impressive low-power path" and
R-101's "beautiful reduced-motion composition" are the same deliverable seen from two
sides, and it is judged by the same admiration panel as the animated form (Gate L).

**Observed:** every section already ships a reduced-motion path in its stylesheet
(`prefers-reduced-motion` blocks in `Hero.module.css`, `About.module.css`,
`Compass.module.css`, `Experience.module.css`, `Skills.module.css`,
`Bench.module.css`, `Vitrine.module.css`, `Listen.module.css`, `Avatar.module.css` —
enumerated by `grep -rl "prefers-reduced-motion" components/ --include=*.css`).

### 9.5 · Degraded states

Three states are designed, not discovered: **JavaScript failed**, **WebGL absent or
software-rasterised** (`components/gl/useGLCapability.ts:33-37`), and **data
unavailable**. Each renders final values, real labels and the takeaway line. No state
shows a zero that is not a measured zero (2.4, R-175).

---

## 10 · Performance envelope (R-100) — the default budget

Every registered visualisation inherits this envelope and may only tighten it. These
are **declared budgets**; T-22 measures against them.

| Clause | Default budget |
|---|---|
| Frame rate | 60 fps sustained with everything in the section active, mid-tier mobile (SC-27.1) |
| Layout | zero layout-triggering animation properties; transform and opacity only |
| Init | lazy — nothing constructed before the section is within one viewport of entry; WebGL runtime dynamically imported (`components/gl/GLCanvas.tsx:11-21`) |
| Disposal | on unmount: geometries, materials, textures, render targets disposed; RAF cancelled; observers and listeners removed; probe contexts released (`components/gl/useGLCapability.ts:45`) |
| Contexts | ≤ 1 WebGL context per section; none on a phone (R-170, `app/data/portfolio/listen.ts:47`) |
| DPR | capped at 1.75 (`components/gl/GLCanvas.tsx:28`) |
| Memory ceiling | declared per visualisation in the register; a visualisation without a declared ceiling does not pass Gate K |
| Low-power path | a composed still that passes the same admiration panel (9.4) |
| Page budget | LCP < 2.0 s, CLS < 0.05 on 4G mobile with all scenes active (SC-32.1) |

---

## 11 · Provenance is part of the grammar (R-95, R-108, R-111)

- **Every mark renders real data from the canonical dataset**, and every field carries
  its source. Repository metrics are read from
  `app/data/generated/repo-harvest.json`, produced against the real GitHub API and
  stamped with the date it was taken (`app/data/portfolio/vitrine.ts:8-13`;
  `harvestedAt` written at `scripts/build/harvest_repos.mjs:62, 91`). The CV digest is
  written from the bytes of the shipped PDF on every build
  (`app/data/generated/cv-fingerprint.ts:4-14`: md5 `16b856c0f3f4ec0d801fdde6d084452c`,
  157,615 bytes).
- **The source is rendered, not just stored.** A number without a source is a boast
  (`app/data/portfolio/hero.ts:19`), so each hero figure carries its `source` string on
  the page (`hero.ts:26-45`).
- **A caveat travels with the figure it qualifies**, in the same view, at the same
  prominence — never in a footnote a reader can miss. **Observed:** the `caveat` field
  is part of the data model (`app/data/portfolio/skills.ts:70-72`), carrying *"the −38%
  was measured against a simulated error budget, not live traffic"* and *"Compose, not
  Kubernetes — there are no cluster manifests in that repository"*.
- **AI assists the aesthetic; data owns the truth** (R-111). No generative process
  may produce, interpolate, smooth or infer a value that is rendered as a datum. Its
  scope is texture, light, motion and composition.
- **The honesty copy must track the implementation, never lag it** (R-182, R-183). If
  the harvest becomes deploy-time, the limits line changes in the same commit. The site
  must never carry a statement about itself that its own code contradicts.

---

## 12 · Prohibitions (Gate K fails on any one of these)

1. A truncated or non-zero quantitative baseline.
2. Two gold marks in one view; gold as a fill, theme, hover, or "here"; gold used for
   anything other than *this figure has a checkable source*.
3. Colour encoding magnitude; any sequential, diverging or categorical hue ramp.
4. A default library palette or default library theming of any kind.
5. A datum reachable only by hover or only by pointer.
6. A legend where direct labelling would have fitted (§5).
7. A calibration state rendered as a score, a bar, a size, or an ordering (2.3).
8. An empty, dimmed or zero mark standing in for "no evidence"; a zero frame on any
   counter (2.4, R-175).
9. Text painted into a canvas or a texture (§6.1).
10. The same data drawn twice by two renderers (§6.2).
11. A second y-axis; a rotated or auto-truncated axis label.
12. A diagram whose flow direction contradicts §7, or whose grouping does not mirror a
    real boundary.
13. A visualisation shipped without its takeaway line, its declared memory ceiling, or
    its accessible equivalent.
14. A static chart image anywhere (SC-53.1).

---

## 13 · Conformance procedure (T-25 · Gate K)

For each registered visualisation, in order:

1. **Grammar audit** — §2–§7 line by line; any prohibition in §12 is an immediate fail.
2. **Dual-read** — 3 s and 30 s reads with fresh eyes; takeaway line present and
   falsifiable (T-20).
3. **Interaction depth** — hover reveal, focus/zoom, filter or drill-down, and one
   curiosity-rewarding state, all keyboard-reachable (T-21, R-97).
4. **Data truth** — every mark resolved to a canonical field with named provenance
   (T-19).
5. **Performance** — measured against §10's budget; memory ceiling verified; disposal
   verified across mount/unmount cycles (T-22).
6. **Accessibility** — the five clauses of §9, with the insight-equivalence question
   asked out loud (T-23).
7. **Diagram craft** — §7, for every diagram in the view (T-25).
8. **Preservation diff** — nothing in R-165 … R-170 removed, diluted, hidden or
   softened (Gate R). Where a new requirement appears to conflict with a preserved
   asset, the resolution is to satisfy both (R-171).

---

## Appendix · Token bindings

The CSS side of the system is declared once, at `app/globals.css:33-39`, with the
meaning written into the file above it (`app/globals.css:16-32`). `lib/palette.ts` is
the same values for WebGL and Canvas, where custom properties cannot reach. The audited
contrast figures and the alpha-composited variants are recorded in
`design-system-lock.md` (same directory); this appendix is the semantic binding, that
document is the measured one, and the two must never diverge.

| Meaning | Token | Value | Source |
|---|---|---|---|
| Sourced / checkable | `--gold` / `gold` | `#c9a84c` | `app/globals.css:33`; `lib/palette.ts:18` |
| Gold, lit | `--gold-light` / `goldLight` | `#d4b65c` | `app/globals.css:34`; `lib/palette.ts:19` |
| Gold, pale | `--gold-pale` / `goldPale` | `#e8d5a3` | `app/globals.css:35`; `lib/palette.ts:20` |
| Gold, recessed | `--gold-dark` | `#b0923f` | `app/globals.css:36` — AA, not AAA on ink; non-text and large only |
| Gold veils | `--gold-muted` / `--gold-border` / `--gold-veil` | α 0.08 / 0.20 / 0.13 | `app/globals.css:37-39` — hairlines and edges only, never a fill |
| Here / selected / focus | `accent` | `#E8EBF0` | `design-tokens.json` `colors.accent` |
| Primary text / highlight | `white` | `#F4F6FA` | `design-tokens.json` `colors.white` |
| Body text | `mist.200` | `#C9CDD6` | `design-tokens.json` `colors.mist.200` |
| Secondary text | `mist.400` | `#8A8F9A` | `design-tokens.json` `colors.mist.400` |
| Hairline / border | `ink.500` | `#3A3D46` | `design-tokens.json` `colors.ink.500` |
| Card / panel | `ink.700` | `#1B1D23` | `design-tokens.json` `colors.ink.700` |
| Raised surface | `ink.800` | `#121317` | `design-tokens.json` `colors.ink.800` |
| Page ground | `ink.900` | `#0A0B0D` | `design-tokens.json` `colors.ink.900` |
| Spacing | 8-point scale | `0 … 4rem` | `design-tokens.json` `spacing` (SC-29.1) |

**Gold text is only ever set on `--ink-900`, `--ink-800`, `--ink-700` or `--card-bg`;**
gold on `--ink-500` measures 4.75:1, which is AA and not AAA
(`design-system-lock.md:80-81`).

Raw hex never appears in a component; scene colours are read from `lib/palette.ts`,
which exists so the "no raw hex in components" invariant enforced by
`scripts/validate/overhaul_static_audit.mjs` survives WebGL and Canvas, where CSS
custom properties cannot reach (`lib/palette.ts:1-6`).
