## Digest — the aesthetics of instrumentation drawing, mapped onto this site's palette

Read at `/root/forgotten-mistory/app/globals.css` (tokens) and `/root/forgotten-mistory/components/sections/Skills/Bench.tsx` (existing SVG idiom: HTML rails + SVG wires, `pathLength={1}`, gradient strokes). Everything below is expressed in existing tokens — no new colour is proposed.

---

### Part 1 — The single governing insight

A real calibration certificate is not a *list*. It is four things in a fixed order, and this is what makes it instantly legible as a certificate rather than as a table:

1. **The instrument** (what was measured)
2. **The reference standard** it was measured *against*, and its traceability chain
3. **The deviation, with an uncertainty band** — "as found / as left", `U = ±x (k=2)`
4. **An explicit scope-of-calibration clause: what was NOT tested**

Item 4 is the one every skill-bar portfolio omits and the one this section is built on. A drawn metaphor that reads in 3 s must show **a scale, a thing indexed against it, and a hatched region at the end of the scale that was deliberately not certified.** That triad — scale / index / excluded zone — is the whole argument. Everything below is vocabulary for drawing it without it looking like a SaaS illustration.

---

### Part 2 — Named devices and conventions, with rendering notes

**1. Dimension line + extension lines + arrowheads (ISO 128-20 / ASME Y14.5).**
The canonical grammar: two thin extension lines rise from the feature, *not touching it* (≈1 mm gap) and overrun the dimension line by ≈2–3 mm; a thin dimension line runs between them terminated by two filled arrowheads; the value sits above or in a break in the line. Thick:thin width ratio is 2:1 (e.g. 0.7 / 0.35 mm).
*Render:* extension + dimension lines `stroke: var(--mist-400)`, `stroke-width: 0.75`, `stroke-linecap: butt`, `shape-rendering: geometricPrecision`. The measured object gets `stroke: var(--mist-200)`, `stroke-width: 1.25`. Arrowheads are **filled `<path>` triangles, never `marker-end` with a rounded cap** — 3:1 length:width, ~9×3 units. On a near-black ground, the 2:1 width ratio alone is invisible; encode hierarchy as **luminance + width together**: `--ink-500` 0.5px (construction) → `--mist-400` 0.75px (annotation) → `--mist-200` 1.25px (object) → `--white` (value). The 1 mm gap between feature and extension line is the single most "drawn by an engineer" detail available — keep it as an actual 3–4px gap.

**2. Leader line with horizontal landing.**
A leader is a thin line at a *fixed* oblique angle (30°, 45° or 60° — never arbitrary), ending in a short horizontal "landing" segment (~5 mm) under the note, with an arrowhead on a line, a dot inside an area, or nothing on a surface.
*Render:* `<polyline>` of exactly two segments, `stroke: var(--mist-400)`, 0.75. The landing is what separates a leader from a "connector line" in a startup diagram — it is non-negotiable. Note text in `var(--font-mono)`, `letter-spacing: 0.06em`, size ~11px, `var(--mist-200)`.

**3. Datum feature symbol + feature control frame (GD&T).**
A datum is a filled or open triangle on the feature, joined by a short line to a **boxed capital letter** (`A`, `B`, `C`). A feature control frame is a rectangle divided into compartments: `[⌖ | ⌀0.1 Ⓜ | A | B | C]` — symbol, tolerance, then the datum references in precedence order.
*Render:* `<rect>` grid, `stroke: var(--mist-400)`, `stroke-width: 0.75`, **`rx="0"` — square corners are the whole point**; internal dividers are full-height thin lines. This is the closest existing convention to what the calibration card already does: *capability | evidence | where | status* is literally a feature control frame with named compartments. Drawing the table header as a compartmented frame would be the cheapest possible win.

**4. Section hatching at 45° (ISO 128-3).**
Thin continuous lines at 45° to the principal outline, evenly spaced 1–4 mm, spacing widened for large areas. Adjacent parts get *opposite* 45°/135° hatch or a different pitch so they read as separate bodies.
*Render:* the site already owns this — the caliper's `open` state hatch. Use one `<pattern patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">` containing a single `<line>` at `stroke: var(--ink-500)` (or `--mist-400` at 0.35 opacity). **This is the "not tested" mark.** Reserve 45° hatch site-wide to mean exactly one thing: *inside this boundary, nothing was certified.* That gives the section a second learnable mark alongside the caliper, and it is already semantically consistent with `open`.

**5. Title block and revision table (ISO 7200).**
Bottom-right of the sheet: a ruled block carrying drawing title, drawing number, sheet n of m, scale, date, "drawn by / checked by", and — above it, filling upward — a revision table with columns `REV | DATE | DESCRIPTION | BY`.
*Render:* an HTML `<table>` or `<dl>` with `border-collapse: collapse`, `border: 0.5px solid var(--card-border)`, all cells `var(--font-mono)` uppercase 10px, `var(--mist-400)`, values `var(--mist-200)`. The site already has `cv-fingerprint.ts` — a build-time hash and date is *exactly* a revision line, and printing it as `REV | 2026-09-03 | CV SHA 3f9a… | AUTOGEN` is a real title block, not a pastiche. Scale field reads `1:1`. Do not round the corners; do not add a shadow.

**6. First/third angle projection symbol.**
The truncated cone drawn in two orthogonal views inside a small frame, placed in the title block. Cone tapering *right* in the side view = first angle (ISO/Europe); tapering *left* = third angle (ASME/US).
*Render:* ~28×14 SVG, two `<path>`s + two centre lines, `var(--mist-400)` 0.75. It carries almost no information but it is the strongest single "this is a real drawing" signal available for ~200 bytes. Use it as the section's corner glyph.

**7. Tick hierarchy — major / minor / micro (machinist rule).**
Real rules run three tick lengths and *one* numbered tier: major ticks full-height and numbered, minor at ~60% height, micro at ~35%. Numbering only on majors; ticks never all the same length.
*Render:* three `<line>` sets, all `stroke-width: 0.75`, differentiated by **length and luminance, not weight**: major `var(--mist-200)` h=12, minor `var(--mist-400)` h=7, micro `var(--ink-500)` h=4. Numerals `var(--font-mono)` 10px `var(--mist-400)`, baseline-aligned below the majors. Use `shape-rendering: crispEdges` and place tick x at `n + 0.5` for a 1px-wide stroke so verticals land on a device pixel instead of smearing across two; pair with `vector-effect="non-scaling-stroke"` if the SVG scales responsively.

**8. Vernier / nonius scale.**
The most beautiful idea in metrology: a second scale whose *n* divisions span *n−1* of the main scale, so exactly one pair of lines coincides, and that coincidence *is* the reading. Precision emerges from misalignment, not from finer engraving.
*Render:* two parallel tick rows, the lower one at pitch `p × (n−1)/n`. Everything grey except the single coinciding pair. **This is the perfect gold rule:** the one line where the claim and the reference standard *coincide* is `var(--gold)` — because coincidence is precisely "this figure has a source you can check". Every other tick stays `--mist-400`. Semantically airtight, visually thrilling, and gold appears exactly once per reading.

**9. Micrometer barrel and thimble.**
A fixed linear sleeve scale (mm above the datum line, half-mm below, offset) read against a rotating thimble scale of 50 divisions; the total is *sleeve + thimble*, and the reading is taken where the thimble edge crosses the sleeve datum. A vernier on the barrel extends it to 0.002 mm.
*Render:* horizontal sleeve with a long continuous datum line and ticks above *and* below it (the offset half-scale is the recognisable detail); thimble as a `<rect>` with a vertical tick column and a bevel edge. The bevel is the only place a gradient is justified: `linear-gradient` from `--ink-700` → `--ink-800` across ~6px, no blur.

**10. Oscilloscope graticule (Tektronix convention).**
10 divisions wide × 8 tall; the centre horizontal and vertical axes are *thicker* and carry 5 minor ticks per division; dedicated horizontal lines at **0 %, 10 %, 90 %, 100 %** (0 % and 100 % at ±2.5 div) for rise-time measurement, with percentage labels at the left edge.
*Render:* `<line>` grid at `var(--ink-500)` 0.5px, centre cross at `var(--mist-400)` 0.75px, minor ticks 4px on the centre axes only. The 10/90 lines are the payload: a section that shows "measured between 10 % and 90 %" is showing *methodology*, not a score. Labels in `--font-mono` 9px at the left margin. This is the best available grid substrate for the bench diagram's background — far more truthful than a generic dot grid.

**11. Dial indicator face + tolerance band arc.**
A circular scale, a needle, and — the crucial part — two adjustable **limit pointers** describing an arc of acceptable deviation. The instrument does not say "good"; it says "inside the band you set".
*Render:* `<circle>` `stroke: var(--ink-500)`; ticks by `transform="rotate(θ 0 0)"`; the tolerance arc as a `<path>` arc `stroke: var(--mist-200)` 2px with butt caps; the needle as a filled tapered `<polygon>`, `var(--white)`. Gold only if the *band* itself is sourced. Excellent for the "no proficiency bars" argument: it looks like a gauge but reads a *deviation from a standard*, not a percentage of mastery.

**12. Spirit level bubble with two limit lines.**
A vial, a bubble, two engraved lines. Binary and honest: in or out. No 73 %.
*Render:* `<rect rx="4">` vial in `--ink-800`, two vertical `--mist-200` 1px limit lines, bubble as a `<circle>` `fill: rgb(244 246 250 / 0.16)` with `--card-rim`-style inset. Reduced-motion static path is trivial (bubble parked centred).

**13. Range-frame and dot-dash plot (Tufte).**
Erase the axis outside the data: the frame line spans only min→max of what was actually observed, and marginal rug ticks on each axis show the real distribution. The axis stops telling a lie about coverage.
*Render:* replace any full-length axis `<line>` with one whose endpoints are the data extremes; add 4px rug ticks at each datum, `var(--ink-500)` 0.5px. For this section: the "years of evidence" axis should end at the actual first and last measurement date, not at a round decade. Directly serves the site's prime directive — *never grade a claim higher than its evidence.*

**14. Tolerance stack / expanded uncertainty bar.**
`value ± U (k=2)` — a nominal tick with a symmetric error bar and serifed end caps, plus a separate, wider "specification limit" bracket behind it. The visual claim is that the measurement is smaller than the tolerance.
*Render:* two nested horizontal rules: the spec limit as an outer bracket `var(--ink-500)`, the measured band `var(--mist-200)` with butt-capped 6px end serifs, the nominal as a single `var(--white)` 1.5px tick. If the figure is sourced, **the nominal tick alone goes gold** — not the bar.

**15. Engraved vs printed marks (how real scales sit in light).**
An engraved mark is a groove filled with paint: on a light instrument it reads as a dark line with a *bright* highlight on the light-facing wall. On a near-black ground the relationship inverts — the mark is the filled paint, and it needs a 0.5px darker edge below it to sit *in* the surface rather than float above it.
*Render:* two-pass. Either duplicate the path at `translate(0, 0.5)` in `var(--ink-900)` beneath the light stroke, or `filter: drop-shadow(0 0.5px 0 rgb(10 11 13 / 0.9))` on the group. This is the single technique that most separates "engraved panel" from "dark-mode dashboard" — dashboards have flat 1px strokes with nothing under them. Keep it to the primary scale only; applying it everywhere costs paint and looks embossed.

**16. Break line / interrupted view.**
When a long part won't fit, the drawing removes the middle with a freehand or zig-zag break and keeps the dimension honest. It is an admission drawn into the geometry.
*Render:* a `<path>` zig-zag, `stroke: var(--mist-400)` 0.75. Useful anywhere the card compresses 16 years into a fixed width without pretending the axis is continuous.

**17. Edge-lit / etched panel nomenclature (Apollo, Braun).**
Apollo CSM panel legends were engraved and *electroluminescently backlit* through the nomenclature itself, so the label glowed and the panel stayed dark — the exact inverse of printed ink. Braun and Ulm-school panel graphics do the same job in a grid: all-caps sans nomenclature, tight tracking, hard-aligned to control centres, no label larger than it needs to be.
*Render:* `--font-mono` uppercase, 10–11px, `letter-spacing: 0.10em`, `color: var(--mist-200)`, with an optional `text-shadow: 0 0 6px rgb(232 235 240 / 0.18)` — that shadow is the *only* legitimate glow in this vocabulary, and only on nomenclature, never on the drawing lines. Every label must be centred on the thing it names, never floated near it.

**18. Bill of materials as small multiples.**
A drawing's parts list uses one identical row form repeated *n* times with a balloon number tying each row to the geometry. Tufte's small multiples are the same object: identical axes, shrunken, high density, comparative.
*Render:* the bench's 13 sources × 17 capabilities is already this. Balloon numbers (`<circle r="7">` + `--font-mono` 9px) tying each drawing node to its table row would make the diagram↔table relationship explicit for keyboard and screen-reader users at essentially zero cost.

---

### Part 3 — Rendering it monochrome on near-black without a dark-mode-dashboard look

The failure mode is specific and avoidable. Dark dashboards are: uniform 1px strokes, rounded corners, `rgba` greys with no ramp, glow on everything, and lines that don't terminate on anything. Instrument drawings are the opposite.

**Line ramp (use exactly these four, nothing between):**

| Role | Token | Width | Notes |
|---|---|---|---|
| Construction / grid / hatch | `var(--ink-500)` | 0.5 | `shape-rendering: crispEdges`, coords at `n+0.5` |
| Annotation — extension, dimension, leader, ticks | `var(--mist-400)` | 0.75 | butt caps, fixed angles only |
| Object / measured body / scale rule | `var(--mist-200)` | 1.25 | the thing being certified |
| Value, needle, index | `var(--white)` | 1.5 | numerals in `--font-heading` |

**Gold rule, restated for this vocabulary.** Gold is a *terminator*, never a *path*. Legitimate: the coinciding vernier line; the pair of arrowheads at the two ends of a dimension whose value is sourced; the nominal tick inside an uncertainty bar; the closed caliper jaws. Illegitimate: a gold axis, a gold grid, a gold hatch, a gold gradient along a wire, gold on hover, gold as "selected". If it can be dragged along a length, it is not gold. `Bench.tsx` already gets this right — a wire is gold only where the evidence at its end was measured in production.

**Never in this drawing:** `stroke-linejoin: round`, `stroke-linecap: round`, `rx > 0` on frames, `box-shadow` on drawn geometry, blur, opacity animation on lines, any angle outside {0, 30, 45, 60, 90}, any font other than `--font-mono` inside the drawing (figures in `--font-heading`; body font never enters an SVG).

**Motion, if any.** An instrument does one thing: it *travels and stops*. A jaw closes, a needle settles, a thimble rotates to a stop. So: a single `stroke-dashoffset` sweep or a single transform over ~500–700 ms on `var(--motion-ease-standard)`, once, then dead still. No loop, no pulse, no shimmer. `pathLength={1}` (already the file's idiom) makes dash animation resolution-independent. Under `prefers-reduced-motion`, the static path is the *settled* state — jaws closed on the value, needle at rest, coincidence line already gold — which is also the correct default for the no-JS static export.

**Accessibility.** Each device needs a text equivalent, exactly as `Caliper.tsx` does with its `gloss` span: a vernier coincidence announces "sourced; coincides with ATO · Payday Super", a hatched region announces "not tested". A mark that only exists visually makes a claim to sighted readers and none to anyone else.

**Budget.** All 18 devices are pure inline SVG paths and CSS — a full drawing of this vocabulary is 3–6 kB gzipped, no raster, no font subset, no WebGL. Zero LCP/CLS risk if the SVG carries an explicit `viewBox` and the container reserves height (the section already holds a measured `floor` for the table for exactly this reason).

---

### Part 4 — Reference works

1. **ISO 128-20:1996 — *Technical drawings, general principles of presentation, Part 20: Basic conventions for lines*** — the authoritative line-type vocabulary (continuous thick/thin, dashed thin, chain thin) and the 2:1 thick:thin ratio with the 0.25/0.35/0.5/0.7/1/1.4/2 mm width series. — https://www.iso.org/obp/ui/#iso:std:iso:128:-20:en · free sample of the companion Part 3 (views, sections, hatching, projection symbols): https://cdn.standards.iteh.ai/samples/69130/5d6dca563ab343c9a6ae7031a7b6fe5d/ISO-128-3-2020.pdf
2. **Mitutoyo, *How to Read the Scale* (micrometer bulletin, PDF)** — the sleeve/thimble/vernier reading procedure drawn at full instrument fidelity; the definitive source for tick hierarchy, the offset half-mm scale, and the 0.002 mm nonius. — https://www2.mitutoyo.co.jp/eng/useful/E11003/pdf/10.pdf
3. **NASA TN D-8301, *Apollo Experience Report — Command and Service Module Controls and Displays Subsystem*** — panel nomenclature, engraved-and-backlit legends, grouping and legibility criteria; pair with Heroic Relics' annotated high-resolution CM main display panel for the actual graphics. — https://ntrs.nasa.gov/api/citations/19760026143/downloads/19760026143.pdf · http://heroicrelics.org/info/csm/cm-ctrl-panel.html
4. **Tektronix 2213 user manual (PDF) + Teledyne LeCroy, *Using the Display Graticule*** — the 10×8 graticule, 5 minor ticks per division on the centre axes only, and the 0/10/90/100 % rise-time lines. The canonical precision grid. — https://users.physics.unc.edu/~sean/Phys351/techresource/docs/2213%20User%20Manual.pdf · https://blog.teledynelecroy.com/2014/09/back-to-basics-using-display-graticule.html
5. **Massimo Vignelli, *The Vignelli Canon* (free PDF, RIT Vignelli Center)** — grids, margins, scale, the discipline of a restricted type palette and a fixed set of sizes; the argument for why three faces with one job each beats a ramp of nine. — https://www.rit.edu/vignellicenter/sites/rit.edu.vignellicenter/files/documents/The%20Vignelli%20Canon.pdf
6. **Eye Magazine, *Designing for Dieter Rams*** — Braun control panels read as three-dimensional information design: controlled typography, alignment of dials/switches/jackplugs, pragmatic restraint. The Ulm-school lineage (Aicher, Gugelot) behind it. — https://www.eyemagazine.com/blog/post/designing-for-dieter-rams
7. **Nicholas Felton, *Feltron Annual Reports 2006–2011* (MoMA collection)** — the strongest precedent for a person rendered as an instrument readout rather than as a portfolio, and for treating personal data with the typographic seriousness of a technical document. — https://www.moma.org/collection/works/145531
8. **Tufte's devices, implemented — "Tufte in D3"** — working range-frame, dot-dash plot and sparkline implementations with the exact axis-truncation logic. — https://yangdanny97.github.io/blog/2023/03/23/tufte-in-D3
9. **ISO/IEC 17025 calibration-certificate field checklist** — the mandatory fields (unique certificate ID, instrument identification, date, method reference, results with units, traceability statement, expanded uncertainty, authorised approval), plus the as-found/as-left column pair and the decision rule. The literal content model for this section. — https://labcalibrate.com/iso-17025-calibration-certificate-requirements
10. **MDN, `shape-rendering` and `vector-effect`** — `crispEdges` for hairline grids and ticks, `non-scaling-stroke` so line weights survive responsive scaling of the `viewBox`. — https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/shape-rendering · https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/vector-effect

---

### Part 5 — Where this points, in one paragraph

The highest-yield device for the 3-second read is **#8, the vernier**, because it is the only convention in the entire vocabulary whose *meaning* is already the site's meaning: precision arrives from a claim coinciding with an independent reference, gold marks the single line where they coincide, and everything that does not coincide stays grey without being an error. Wrap it in **#1** (a dimension line whose two arrowheads span "16 years") and terminate the right end in **#4** (a 45° hatched zone labelled `NOT CALIBRATED — AWS / GCP, in progress`), set the whole thing on **#10**'s graticule, and sign it with **#5**'s title block carrying the real CV fingerprint and `1:1`. That is a calibration card a visitor understands before reading the lede — and every element of it is data the section already holds.