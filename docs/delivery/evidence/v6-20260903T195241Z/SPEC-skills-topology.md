# SPEC · The Skills Topology

**Run** `v6-20260903T195241Z` · **Requirements** R-187, R-166, R-96, R-97, R-99, R-101, R-110,
R-111, R-112, R-52, R-95, R-108, R-109 · **Success criteria** SC-96.1, SC-87.1 · **Gates** K and R
· **Binding decision** D-01 (`DECISIONS.md`) · **Grammar** `encoding-grammar.md` §2.1–2.5, §3.1–3.3,
§8, §9, §12 · **Tokens** `design-system-lock.md` §1.2, §4.2 · **Dataset** `dataset-layer-design.md`
§1, §2.3, §5, §6

This is a build specification. Every geometry, weight, duration, easing, field name, DOM shape and
assertion below is fixed. An implementer executes it without making a further design decision. Any
number an implementer cannot reproduce from the canonical dataset is a defect in this spec, not a
licence to invent one.

---

## 0 · Verdict against R-187's own escape clause

> *"The topology must be at least as honest as the table it replaces and considerably more
> explorable; if it cannot be both, the table stays until it can."*

**It can be both, and the table stays anyway** — but in a different role.

| | Bench (today) | Topology (this spec) |
|---|---|---|
| Encodes | adjacency only (13 sources × 17 capabilities) | evidence-strength **and** recency **and** adjacency |
| Recency | absent | **position on a drawn, labelled logarithmic axis** — real `pushedAt` / CV role-end dates |
| Gold marks in view | **17** (every production wire) — an R-110 violation shipped today | **1** |
| Caliper `sourced` state | rendered **nowhere** | rendered on 7 source nodes and 6 capability nodes, each an openable URL |
| Mobile ≤900 px | wires `display:none`; two lists — **an R-52 failure** | same encoding, same axis, **all 20 wires drawn** at 390 px |
| Proficiency scalar | none | none |

The record table is **not** deleted. It is promoted to the R-101 §9.3 insight-equivalent text
alternative and the R-97 drill-down target, and gains three columns that carry the topology's three
encodings as text. R-166 is preserved in full: the three calibration states, the evidence column,
the where column, the qualifying footnotes (`caveat`), the refusal of proficiency bars, and the CV
calibration line all survive verbatim. TC-SKILL-01 … TC-SKILL-08 keep passing unmodified.

**The Bench is superseded, not accompanied.** `components/sections/Skills/Bench.tsx` and
`Bench.module.css` are deleted. There is exactly one diagram in `#skills`.

---

## 1 · What displaces what — the exact list

| Removed | Replaced by | Why |
|---|---|---|
| `components/sections/Skills/Bench.tsx` (17,552 B) | `components/sections/Skills/Topology.tsx` | one diagram per section; the Sankey cannot carry recency |
| `components/sections/Skills/Bench.module.css` (8,813 B) | `Topology.module.css` | — |
| `skillsContent.lede` — the three-line text lede *"Every instrument ships with a certificate…"* | `components/sections/Skills/CalibrationTag.tsx` | R-96/R-99: the metaphor must be **taught by an artefact**, not asserted in prose. The lede is deleted from `app/data/portfolio/skills.ts` and from the `<header>`. |
| `<ul className={styles.legend}>` in `Skills.tsx` (the floating status legend) | the tag's `EVIDENCE CLASS` block | grammar §5: direct labelling, not legends |
| `<figcaption>` of the Bench figure | the tag's `ITEM` / `METHOD` fields | subsumed |
| `.mark.production { background: var(--gold) }` (`Bench.module.css:214`) | `background: var(--mist-200)` | R-110: gold is a claim about **checkability**, not about production |
| the `bench-wire-gold` linear gradient | no gold stroke anywhere in the diagram | same |
| `statusLegend` glyph column in the table | **kept unchanged** (TC-SKILL-05) | — |
| the `Calibrated against … MD5 … bytes` footer | **kept verbatim** (TC-SKILL-08) | R-166's CV calibration line |

Nothing else in `#skills` changes.

---

## 2 · The teaching visual — `CalibrationTag`

### 2.1 Why this one

Six candidates were researched with adversarial critiques (`skills-visual-research/`). Two rated
STRONG-adjacent: **"The tag on the instrument"** (`concept-instrument.json`, critiqued **PROMISING**)
and **"Chain of Custody"** (`concept-traceability.json`, critiqued **PROMISING**). Both critiques
land on the *same* strongest fix, from opposite directions:

- `critique-instrument.md`: *"Invert it. Draw the **tag** as the object … and reduce the instrument …
  so recognition arrives from silhouette instead of from reading … the caliper stops competing with
  the Caliper mark."*
- `critique-traceability.md`: *"Put at the apex the thing a stranger can reach — the repository,
  opened now — and hang his claim beneath it … Gold then falls on the reading whose source is
  genuinely reachable."*

This spec builds the intersection: **a shop-floor calibration tag, drawn as an object, wired to the
topology, whose one gold field is a repository you can open right now.** The illustrated vernier
caliper is **dropped entirely** — the site already ships `<Caliper>` as its one learned mark, and
drawing a picture of it demotes the abstraction (critique-instrument §4). The chain-of-custody
ladders are **dropped** — they are the Bench's one-to-many grammar rotated 90° (critique-traceability
§4).

### 2.2 Geometry — `components/sections/Skills/CalibrationTag.tsx`

Sits between `<header>` and `<Topology />` in `#skills > .inner`. Full `.inner` width.

**Silhouette.** One inline SVG, `viewBox="0 0 640 260"`, `aspect-ratio: 32/13`,
`shape-rendering: geometricPrecision`, `preserveAspectRatio="xMidYMid meet"`, `aria-hidden="true"`.
It draws only the tag body and the wire:

- Tag body: `<path>` — a rectangle `x=1 y=1 w=574 h=258` with the **top-left corner clipped at 28 px
  on both axes** (`M 29 1 L 575 1 L 575 259 L 1 259 L 1 29 Z`). Stroke `var(--mist-400)` at
  `stroke-opacity: 0.55`, `stroke-width: 1`, `fill: none`. This clipped corner is the entire
  three-second recognition cue.
- Eyelet: `<circle cx="18" cy="46" r="7">` stroke `var(--mist-400)` 1 px, plus a second
  `<circle r="11">` at `stroke-opacity: 0.22` — the reinforcing washer.
- Wire: `<path d="M 18 39 C 18 4, 300 4, 470 4">` — no. Exact: `M 18 39 C 18 12, 96 6, 178 6` then
  the wire **leaves the SVG** and is continued by the topology's own `<path id="tag-tether">` (§3.7).
  Stroke `var(--mist-400)`, `stroke-width: 1`, `stroke-opacity: 0.45`, `stroke-linecap: round`,
  `fill: none`.
- Six field rules: `<line x1="46" x2="560" stroke="var(--mist-400)" stroke-opacity="0.16"
  stroke-width="1">` at `y = 72, 104, 136, 172, 208, 236`.
- The `NOT TESTED` hatch: `<pattern id="tag-hatch" width="6" height="6" patternTransform="rotate(45)"
  patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="6" stroke="var(--mist-400)"
  stroke-width="1" stroke-opacity="0.30"/></pattern>` filling `<rect x="300" y="140" width="260"
  height="64">`. **This is the same 45° hatch used on the About instrument's role-computed sectors
  and inside `<Caliper state="open">`.** A reader learns the mark once (grammar §2.3).
- The `DUE` box: `<rect x="46" y="212" width="118" height="20" fill="none"
  stroke="var(--mist-400)" stroke-opacity="0.30" stroke-width="1"/>` — **left empty, forever.**
  ISO/IEC 17025 §7.8.4.3: a laboratory does not assert a recalibration date the customer never
  requested. A test asserts it stays empty (TC-TAG-05).

**Type.** All text is HTML, absolutely positioned over the SVG in a sibling
`<div className={styles.fields}>` with `position:absolute; inset:0`, coordinates expressed as
percentages of the same 640×260 box. SVG `<text>` is not used anywhere: it hints differently from
the rest of the page and cannot be selected — the Bench's own ruling (`Bench.tsx:19-24`), preserved.

| Field | Left % / Top % | Label | Value |
|---|---|---|---|
| `CALIBRATION CERTIFICATE` | 7.2 / 6.2 | — | mono 0.62rem, `.14em`, `--mist-400` |
| `ITEM` | 7.2 / 20.0 | mono 0.60rem `.16em` uppercase `--ink-300` | `--font-heading` 1.05rem `--white` — the specimen capability's `capability` string |
| `METHOD` | 7.2 / 32.3 | same | mono 0.68rem `--mist-200` — the literal `Provenance.method` |
| `TAKEN AT` | 7.2 / 44.6 | same | 0.86rem `--mist-200` + kind badge (mono 0.58rem, 1px `--token-border-default` border, 2px radius) |
| `RESULT` | 7.2 / 57.0 | same | **the section's one gold mark** — see §2.4 |
| `EVIDENCE CLASS` | 46.9 / 20.0 | same | three lines, see §2.3 |
| `NOT TESTED` | 46.9 / 55.0 | same | `<Caliper state="open">` over the hatch, given the full 260×64 field |
| `DUE` | 7.2 / 82.7 | same | *(empty box)* |
| `CERT` | 46.9 / 82.7 | same | mono 0.62rem `--ink-300` — dataset `repositories` module `observedAt` + `RefreshOutcome` |

Type scale used: exactly five steps, all from the locked ramp — `0.58 / 0.62 / 0.68 / 0.86 /
1.05rem`. No sixth.

### 2.3 The `EVIDENCE CLASS` block — the legend, made an object

Three lines. Each is a live `<Caliper>` beside a real, derived count. This is where the reader meets
all three caliper states in one glance, and where the floating `<ul>` legend goes.

```
SOURCED         <Caliper state="sourced">7 sources · 6 capabilities</Caliper>
                a public repository you can open now
SELF-REPORTED   <Caliper state="self-reported">5 sources · 10 capabilities</Caliper>
                stated on the CV; no public record exists
OPEN            <Caliper state="open">1 source · 1 capability</Caliper>
                looked for, and honestly not there
```

Counts are computed by `selectCalibrationCounts()` (§4.4), never authored. The three gloss lines are
editorial copy in `skills.ts`. The `sourced` caliper here is **not** the gold mark — gold is applied
by `data-gold="true"` on exactly one element (§2.4), and that element is in `RESULT`.

### 2.4 `RESULT` — the one gold mark in the section

```tsx
<Caliper state="sourced" {...markAttrs(specimen.lastTouched, 'skills.tag.result')} data-gold="true">
  {formatUtc(specimen.lastTouched.field.value)}
</Caliper>
<a className={styles.resultUrl} href={specimen.htmlUrl}>{specimen.htmlUrl}</a>
```

**Specimen selection is a deterministic selector, never authored** (grammar §3.1 rule 5):

```
specimen = argmax over { s ∈ sources : s.kind === 'repository'
                         ∧ repositories[s.repo].visibility === 'public'
                         ∧ repositories[s.repo].htmlUrl resolves }
           of repositories[s.repo].pushedAt      // ties → repo name ascending
```

At the dataset state of record (`corpus-repositories.json`, retrieved `2026-09-03T20:09:30Z`) this
resolves to **`forgotten-mistory`**, `pushedAt = 2026-09-03T17:53:39Z`,
`htmlUrl = https://github.com/Victordtesla24/forgotten-mistory`, and the `METHOD` field prints the
literal provenance method:

```
gh api repos/Victordtesla24/forgotten-mistory --jq .pushed_at
```

This is the strongest possible teaching of the gold rule: *this figure has a source you can go and
check*, and the source is the page the reader is standing on. It is a statement about **when
something was last touched**, measured by a named API at a printed time — never about how good
anyone is at anything.

The gold mark is **never** applied to a node, a wire, a ring or a hover state. `data-gold="true"`
appears exactly once in `#skills`; `dataset_integrity.mjs` clause 5 and TC-TOPO-06 both assert it.

### 2.5 What the tag teaches, in the order the reader gets it

1. **Silhouette (< 1 s)** — clipped corner + eyelet + wire = *a tag tied to an instrument*.
2. **The wire (1–3 s)** — it goes somewhere. The thing below is the instrument this tag belongs to.
3. **Two columns (3–10 s)** — left: what was tested and how. Right: the three classes of evidence,
   and a hatched block with **real area** that says what was *not* tested.
4. **The empty `DUE` box (the reward)** — a field deliberately left blank, in a document whose entire
   subject is filling fields in honestly.

---

## 3 · The topology

`components/sections/Skills/Topology.tsx` · render class **`svg`** (R-109) · vizId
`skills.calibration-topology`.

### 3.1 The encoding, in one sentence

> Every capability and every source sits at a radius set by **when its evidence was last touched**,
> on a drawn logarithmic axis; wires join a capability to each source its evidence came from, so
> **adjacency is shared sources**; and each node's terminal form states **which of the three
> calibration states its evidence is in**. Nothing on the board encodes how good he is at anything.

That is D-01 executed literally: **strength = the three states already in the data; recency = real
last-touched dates; adjacency = shared sources.** There is no size channel, no length channel, no
opacity ramp, no ordering by quality, and no scalar of any kind.

### 3.2 The graph

| | count | derivation |
|---|---|---|
| source nodes | **13** | `sources[]` in `app/data/portfolio/skills.ts`, unchanged |
| capability nodes | **16** | `capabilities[]` **minus** any row whose `sources` is empty |
| edges | **20** | `capabilities.flatMap((c,i) => c.sources.map(s => ({s, i})))` |

`capabilities[16]` — *AWS and GCP certification · studying; no certificate issued* — has no source
and therefore **no node and no wire**. Grammar §2.4 is binding: *no evidence yet → no row, no node,
no wire*, and `Bench.tsx:33-37` already carries the reasoning (*"a line to nowhere would be exactly
the dishonesty the rest of the section is built to avoid"*). It is **not** dropped from the site: it
occupies the tag's `NOT TESTED` field with a full 260×64 px of area and an open caliper, and it keeps
its table row (TC-SKILL-04). This is a stronger statement than a lonely disconnected node, and it is
the only change of venue in this spec that removes a mark.

Node and edge counts are asserted by TC-TOPO-01. `SC-17` on the live site currently reads
*"20 links · 13 sources · 17 capabilities"* and is graded **TRUE**; the topology's readout rest state
becomes *"20 links · 13 sources · 16 capabilities on the board · 1 with no evidence yet"*, which is
also true, and the change is recorded in the corrections ledger.

### 3.3 The radial recency axis — exact

Position is rank-1 on the channel ranking (grammar §2.1) and time is explicitly one of the things it
may encode. The axis is therefore **drawn, labelled, and never omitted** (§2.2).

- **Reference instant `T0`** = `manifest.modules.repositories.observedAt` (the dataset refresh time,
  not the build time). At the state of record, `T0 = 2026-09-03T20:09:30Z`.
- **`daysSince(d) = max(1, (T0 − d) / 86_400_000)`.** The floor of 1 day is declared to the reader in
  the axis label (`≤ 1 day`) and in the takeaway; a repository pushed three hours ago is drawn on the
  1-day ring and its exact timestamp is printed on focus and in the table.
- **Scale.** `r(d) = 150 + (log10(clamp(daysSince(d), 1, 10_000)) / 4) × 280`, in a
  `viewBox="0 0 1000 1000"` with `cx = cy = 500`.
  Log is permitted here under grammar §2.2 because the domain spans **1 day → 7,185 days ≈ 3.86
  orders of magnitude**; the base is printed on the axis and the takeaway line says the scale is
  logarithmic. Both conditions are mandatory, not optional.

**Rings (the axis).** Five concentric `<circle>` gridlines, `fill:none`,
`stroke: var(--ink-500)`, `stroke-width: 1`, `stroke-opacity: 0.40`, `aria-hidden="true"`:

| decade | r | label (mono 0.60rem `.14em` `--ink-300`, on the 12 o'clock radius, `text-anchor:middle`) |
|---|---|---|
| 1 day | 150 | `≤ 1 DAY` |
| 10 days | 220 | `10 DAYS` |
| 100 days | 290 | `100 DAYS` |
| 1,000 days | 360 | `1,000 DAYS` |
| 10,000 days | 430 | `10,000 DAYS` |

A sixth, non-quantitative arc at **r = 462**, drawn as a dashed circle (`stroke-dasharray: 3 6` —
the Caliper's own dash pitch) with the 45° hatch band between r=452 and r=472 over the sector
θ ∈ [254°, 286°], labelled `UNDATED · the CV prints no date for this`. It is **outside** the scale
and visually separated by a 32 px gap so it can never be read as "very old".

**Precision bands.** A date whose CV precision is `month` or `year` is not a point. Each such node
draws an additional 1 px arc, `stroke-opacity: 0.35`, spanning `[r(dₘᵢₙ), r(dₘₐₓ)]` along its own
radius — a visible uncertainty extent, not a hidden rounding.

### 3.4 The computed radii — reproduce these exactly

Source nodes (`T0 = 2026-09-03T20:09:30Z`):

| source id | evidence date | field | days | r | precision arc |
|---|---|---|---|---|---|
| `this-site` | `2026-09-03T17:53:39Z` | `repositories.forgotten-mistory.pushedAt` | 1 (floored) | **150.00** | — |
| `aether` | `2026-09-02T20:59:41Z` | `repositories.aether-job-career-agent.pushedAt` | 1 (floored) | **150.00** | — |
| `ato` | ongoing (`March 2026 – Present`) | `cv.roles.role-ato-2026.end` | 1 (ongoing) | **150.00** | — |
| `abentertainment` | `2026-08-06T06:57:44Z` | `repositories.abentertainment.pushedAt` | 28.55 | **251.90** | — |
| `rectifier` | `2026-03-30T13:34:15Z` | `repositories.containerised-birth-time-rectifier.pushedAt` | 157.27 | **303.76** | — |
| `independent` | `2026-02` (month) | `cv.roles.role-independent-2025.end` | 187 – 214 | **311.15** | 309.0 → 313.1 |
| `anz` | `2025-06` (month) | `cv.roles.role-anz-sdl-2017.end` | 430 – 459 | **335.35** | 334.3 → 336.3 |
| `public-key-server` | `2025-05-02T00:23:12Z` | `repositories.public-key-server.pushedAt` | 489.8 | **338.30** | — |
| `timeline` | `2025-04-13T20:42:05Z` | `repositories.relationship-timeline-feature.pushedAt` | 507.98 | **339.41** | — |
| `jira-dashboard` | `2024-12-04T02:01:07Z` | `repositories.EFDDH-Jira-Analytics-Dashboard.pushedAt` | 638.75 | **346.37** | — |
| `monash` | `2010` (year) | `cv.education.edu-monash-2010.date` | 5,725 – 6,089 | **413.98** | 413.0 → 414.9 |
| `unimelb` | `2007` (year) | `cv.education.edu-unimelb-2007.date` | 6,821 – 7,185 | **419.16** | 418.4 → 419.9 |
| `scrum-alliance` | **not observable** | `cv.certifications.cert-csm.date` → `NotObservable` | — | **undated arc, r = 462** | — |

`scrum-alliance`'s `NotObservable.reason` is the corpus string verbatim: *"No award or expiry date is
printed on the CV for this certification."* `provedBy`: `pdftotext public/docs/Vik_Resume_Final.pdf -
| sed -n '/CERTIFICATIONS/,/$/p'`.

Capability node radius = `min(r(source))` over its sources — *the ring of its freshest evidence*.
This is a derivation, and it is declared in the dossier and in the axis's `<desc>`.

| # | capability | r |
|---|---|---|
| 0 | Mainframe test automation | 150.00 |
| 1 | Agile delivery at scale | 150.00 |
| 2 | Real-time telemetry | 335.35 |
| 3 | Cloud-native migration | 335.35 |
| 4 | Programme & portfolio | 335.35 |
| 5 | Multi-agent systems | 150.00 |
| 6 | LLM eval & guardrails | 150.00 |
| 7 | Next.js & TypeScript | 150.00 |
| 8 | Node.js services | 338.30 |
| 9 | Containerised delivery | 150.00 |
| 10 | Service orchestration | 303.76 |
| 11 | WebGL & GLSL | 150.00 |
| 12 | Data visualisation | 339.41 |
| 13 | Certified Scrum Master | undated arc, r = 462 |
| 14 | MSc Computer Science | 413.98 |
| 15 | BE Computer Science | 419.16 |

Ten nodes share the 1-day ring (circumference 942 px, ≈ 94 px of arc each). That crowding **is the
finding**: almost everything he can show you was touched this week.

### 3.5 Node encoding — exactly two channels, no more

**Channel 1 · radius** — recency, above.
**Channel 2 · terminal form** — the calibration state, drawn as *texture and terminal form, never
intensity* (grammar §2.3).

Source nodes (`data-caliper` derived from provenance per `dataset-layer-design.md` §5.2):

| caliper | glyph | drawn as | element |
|---|---|---|---|
| `sourced` | ▣ | 9 px square, `stroke: var(--mist-200)`, `stroke-width: 1.25`, `fill: none`, plus a 4 px tick on the outward radius | `<a href={htmlUrl}>` |
| `self-reported` | ▢ | 9 px square, `stroke: var(--mist-400)`, `stroke-width: 1`, `fill: none` | `<button>` |
| `open` | ⌐ | 9 px square with **only three sides drawn**, `stroke-dasharray: 3 6`, over the 45° hatch | `<button>` |

Capability nodes carry the same three marks already shipped in `Bench.module.css:196-222`, with one
correction — production is no longer gold:

| status | glyph | drawn as |
|---|---|---|
| `production` | ● | 6.4 px disc, `fill: var(--mist-200)` (**was `var(--gold)`**) |
| `non-production` | ◐ | 5.4 px disc, 1 px `var(--mist-400)` ring, left half filled `var(--mist-200)` |
| `pending` | ○ | 5.4 px disc, 1 px `var(--ink-300)` ring, no fill |

Nothing else varies. **No node size channel** (grammar §2.3: never a node size), no fill, no opacity
ramp, no ordering by quality.

### 3.6 Edge encoding

- Geometry: quadratic Bézier `M ax ay Q qx qy bx by`, where `q` is the chord midpoint pulled toward
  the centre by 18 % of the chord length:
  `qx = mx + (500 − mx) × 0.18`, `qy = my + (500 − my) × 0.18`. The wires then read as belonging to
  the polar frame instead of cutting across it.
- Stroke: `var(--mist-400)`, `stroke-width: 1`, `stroke-opacity: 0.42`, `stroke-linecap: round`,
  `fill: none`. **No gradient, no gold, ever.**
- Texture = the capability's calibration status: `production` → solid; `non-production` →
  `stroke-dasharray: 4 3`. Exactly **17 solid** and **3 dashed** (capability 6 contributes two
  dashed edges, capability 10 one), preserving the split TC-BENCH-02 asserted.
- Lit state: `stroke-opacity: 1`, `stroke-width: 1.4`. Dimmed complement: `stroke-opacity: 0.10`.
  Nothing disappears — grammar §3.2 clause 3 is absolute: **no datum may exist only inside an
  interaction.**

### 3.7 The tether

One `<path id="tag-tether">` in the topology SVG continues the tag's wire from the tag's bottom edge
to the **specimen source node** (§2.4), entering the frame at `(178, 0)` in topology coordinates:
`M 178 0 C 178 60, 420 90, {nx} {ny}`. Stroke `var(--mist-400)`, 1 px, `stroke-opacity: 0.45`,
`stroke-dasharray: none`. It is `aria-hidden`. Below 900 px it is not drawn (the tag stacks above the
diagram with no room for a tether); its job there is done by the shared label.

### 3.8 Labels

Labels are **HTML, absolutely positioned** inside `<div className={styles.labels}>` (`position:
absolute; inset: 0; pointer-events: none`), each child re-enabling `pointer-events: auto`.
Coordinates come from the precomputed layout as percentages, so there is **no runtime measurement,
no `getBoundingClientRect`, no `ResizeObserver`, and therefore no CLS**.

- Placement: `left: ${x/10}%; top: ${y/10}%;` with
  `transform: translate(${cosθ >= 0 ? '0' : '-100%'}, -50%) translateX(${cosθ >= 0 ? 14 : -14}px)`.
  Labels always read outward from the centre; the left half is right-aligned, the right half
  left-aligned.
- Source labels: `var(--font-mono)`, `0.70rem`, `letter-spacing: .01em`, `color: var(--mist-400)`;
  `sourced` sources get `color: var(--mist-200)` and `text-decoration: underline dotted 1px
  var(--ink-500); text-underline-offset: 3px` — the standing signal that it is a real link.
- Capability labels: text face, `0.80rem`, `line-height: 1.3`, `color: var(--mist-200)`,
  `max-width: 13ch`, `overflow-wrap: anywhere`.
- The container reserves `padding: 0 clamp(4rem, 11vw, 9rem)` so labels overflow the 1000×1000 SVG
  into real space rather than being clipped.

---

## 4 · Which capabilities genuinely qualify for `sourced` — resolved, not manufactured

The caliper's `sourced` state — *"Measured; source given."* — renders **nowhere** on the live site
today. The reason is a wiring error, not an absence of qualifying data: the Bench keys gold off
`status === 'production'`, which is a claim about **where the evidence was taken**, when `sourced` is
a claim about **whether a stranger can open the source**. Those are different questions and the site
never asked the second one.

### 4.1 The qualification rule (mechanical, applied by `selectors.ts`, never authored)

A **source** node is `sourced` iff its provenance `source` is `github-rest`, the repository's
`visibility` is `public`, and its `htmlUrl` is non-null and returns HTTP 200 unauthenticated.
Otherwise `self-reported`, unless the field is `NotObservable`, in which case `open`.

A **capability** node is `sourced` iff **both**:
- **(a)** at least one of its `sources` is a `sourced` source node; **and**
- **(b)** the figure printed in its `evidence` cell is reproducible by the command printed in that
  field's `Provenance.method` — i.e. a reader who opens the repository can arrive at the same number.

**(a) alone is not enough.** A capability that cites a public repository but whose figure was
measured somewhere the reader cannot reach stays `self-reported`. Grading it higher would be exactly
the failure R-166 exists to prevent.

### 4.2 The result — 6 of 16 qualify

| # | capability | (a) public repo | (b) figure reproducible | **grade** |
|---|---|---|---|---|
| 5 | Multi-agent system design | ✓ `aether` | ✓ engine / router / test counts are countable in-tree | **`sourced`** ¹ |
| 7 | Next.js and TypeScript | ✓ `aether` | ✓ 39 routes / 2,326 unit cases / 26 specs all countable | **`sourced`** |
| 8 | Node.js / Express services | ✓ `public-key-server` | ✓ once restated as a count, not a judgement | **`sourced`** ² |
| 10 | Multi-service orchestration | ✓ `rectifier` | ✓ the compose files are in the tree; the caveat is checkable by `ls` | **`sourced`** |
| 11 | WebGL and GLSL | ✓ `this-site`, `abentertainment` | ✓ shader sources in-tree; the one-context claim is graded TRUE at SC-01b / SC-31 | **`sourced`** |
| 12 | Data visualisation | ✓ `timeline`, `jira-dashboard` | ✓ both artefacts open and run | **`sourced`** |
| 6 | LLM evaluation and guardrails | ✓ `aether` | ✗ the −38 % was measured against a **simulated** error budget — the row's own caveat says so | `self-reported` |
| 9 | Containerised delivery | ✓ `aether`, `abentertainment` | ✗ "automatic rollback on failure" describes a **private** CI runner; a reader cannot observe it | `self-reported` |
| 0 | Mainframe test automation | ✗ | — | `self-reported` |
| 1 | Agile delivery at programme scale | ✗ | — | `self-reported` |
| 2 | Real-time telemetry platforms | ✗ | — | `self-reported` |
| 3 | Cloud-native migration | ✗ | — | `self-reported` |
| 4 | Programme and portfolio management | ✗ | — | `self-reported` |
| 13 | Certified Scrum Master | ✗ | — | `self-reported`, **date `open`** |
| 14 | MSc Computer Science | ✗ | — | `self-reported` |
| 15 | BE Computer Science | ✗ | — | `self-reported` |
| 16 | AWS and GCP certification | — | — | **`open`** · no node |

¹ **Mandatory split before shipping.** `capabilities[5].evidence` currently reads
*"20 agent engines · 22 routers · 4,272 backend tests · live on a VPS"*. The first three clauses are
reproducible; **"live on a VPS" is not** — no unauthenticated reader can observe it. The evidence
field splits into `evidence` (the three counts, `sourced`) and a new optional
`unverifiableClause: 'live on a VPS'` rendered in the table under the existing `.caveat` class with
a `<Caliper state="self-reported">`. Without this split, capability 5 grades `self-reported`.

² **Mandatory restatement.** `capabilities[8].evidence` reads *"PEM key-distribution service · full
Mocha/Chai coverage"*. **"full" is a judgement, not a countable figure.** It is replaced by the
harvested count from the canonical dataset — `repositories.public-key-server.testFileCount` — and
formatted as `PEM key-distribution service · N Mocha/Chai spec files`. Until that field exists in the
dataset, capability 8 grades `self-reported` and the topology must render it so. **No implementer may
ship the word "full" as a `sourced` figure.**

**Totals, which the `EVIDENCE CLASS` counts must reproduce:** 6 `sourced` · 10 `self-reported` ·
1 `open` = 17 capabilities; 7 `sourced` · 5 `self-reported` · 1 `open` = 13 sources. Sixteen
capabilities are drawn as nodes; the seventeenth (`open`) is counted here and rendered in the tag's
`NOT TESTED` field and in the table.

### 4.3 Which do **not** qualify, and why that is the point

Ten capabilities and five sources are `self-reported`, and the topology says so in a mark the reader
already learned on the tag. Three of the five programme/credential sources — `ato`, `anz`,
`independent` — are the largest, longest and most senior parts of the career, and **none of them is
checkable by a stranger.** The board does not hide that: the 1-day ring is thick with repositories
and thin with employers, and the outermost ring holds two degrees from 2007 and 2010 drawn with
year-precision uncertainty arcs. That asymmetry is the argument. Equalising it would destroy the
only fact the diagram contains.

**Nothing was manufactured.** LinkedIn remains not observable (HTTP 999 login gate); no credential
verification URL is claimed for Scrum Alliance, Monash or the University of Melbourne, because none
appears on the CV of record.

---

## 5 · The force simulation — exact, and it never runs in the browser

### 5.1 Where it runs

`scripts/dataset/skills_topology_layout.mjs`, invoked by `build_dataset.mjs` **after** the
`repositories` and `cv` modules refresh, writing
`app/data/canonical/generated/skills-topology-layout.v1.json`.

The browser runs **zero simulation**. It imports fixed coordinates. This is how the layout is
guaranteed stable across reloads, identical for every visitor, and incapable of causing CLS: there is
nothing to converge, nothing to measure, and nothing to re-lay-out. `d3-force@3.0.0` and
`d3-scale@4.0.2` are added to **`devDependencies` only**; the runtime bundle delta is the JSON
(≈ 6.1 KB raw / ≈ 1.9 KB gzip) plus the component.

### 5.2 Determinism

```js
import { forceSimulation, forceLink, forceManyBody, forceCollide } from 'd3-force';

const SEED = 0x5EED;
function mulberry32(a) {
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

1. Nodes are built in a **fixed order**: the 13 sources in registry order, then the 16 capabilities in
   `capabilities[]` order. Node `index` is therefore stable.
2. Every node is seeded on its own ring at the golden angle:
   `θᵢ = i × 2.399963229728653`, `x = 500 + r·cos θᵢ`, `y = 500 + r·sin θᵢ`, `vx = vy = 0`.
   d3-force's default phyllotaxis initialiser is **bypassed** by pre-setting `x`/`y`.
3. `simulation.randomSource(mulberry32(SEED))` — d3-force v3's documented determinism hook. With
   seeded positions *and* a seeded source, the run has no entropy at all.
4. The simulation is **never started**: `forceSimulation(nodes).stop()`, then a manual tick loop.

### 5.3 The forces

```js
const sim = forceSimulation(nodes)
  .randomSource(mulberry32(SEED))
  .alpha(1)
  .alphaMin(0.001)
  .alphaDecay(1 - Math.pow(0.001, 1 / 600))   // = 0.0114815…, converges at tick 600
  .velocityDecay(0.35)
  .force('link', forceLink(edges).id(d => d.id).distance(44).strength(0.50))
  .force('charge', forceManyBody().strength(-90).distanceMax(340).theta(0.9))
  .force('collide', forceCollide()
    .radius(d => d.kind === 'source' ? 26 : 22)
    .strength(0.90)
    .iterations(3))
  .force('ring', radialClamp)                  // MUST be registered last
  .stop();

for (let i = 0; i < 600; i += 1) sim.tick();
```

`radialClamp` is a custom force that runs after every other force each tick and projects every node
back onto its exact ring:

```js
function radialClamp(nodes) {
  return () => {
    for (const n of nodes) {
      const dx = n.x - 500, dy = n.y - 500;
      const len = Math.hypot(dx, dy) || 1e-6;
      const k = n.r / len;
      n.x = 500 + dx * k;
      n.y = 500 + dy * k;
      n.vx *= k;                 // keep velocity tangential-ish; radial energy is discarded
      n.vy *= k;
    }
  };
}
```

**This is the honesty mechanism.** `forceRadial` only *pulls toward* a radius; a node would settle
near its ring, and "near" is a fabricated position. The clamp makes the radial channel **exact** —
every node's distance from the centre is the data, to floating-point. The simulation is therefore
only ever arranging **angle**, which encodes nothing and is free to be arranged for legibility.
`forceCenter` is **not** used (the clamp owns the centre) and `forceX`/`forceY` are **not** used.

**No `alphaTarget` reheat exists anywhere**, because there is no drag interaction. Nodes are not
draggable: dragging a node would move it off its ring, which would make the picture lie.

### 5.4 Output

- Coordinates rounded with `Math.round(v * 100) / 100`.
- The file records `{ schemaVersion: 1, generatedFrom: { datasetHash, T0 }, seed: 0x5EED, ticks: 600,
  viewBox: [0,0,1000,1000], centre: [500,500], rings: [...], desktop: { nodes, edges },
  mobile: { nodes, edges } }`.
- `build_dataset.mjs` fails the build if `generatedFrom.datasetHash` ≠ the current dataset hash — a
  stale layout can never ship, and recency can never silently freeze.
- `scripts/dataset/skills_topology_layout.mjs --check` re-runs the simulation and byte-compares the
  output. It is added to the `quality` CI job. Two runs that differ is a determinism regression and
  fails the build.

---

## 6 · Mobile at 390 px — the wires survive

The current Bench sets `.wires { display: none }` below 900 px and renders two lists. **That is a
straight R-52 failure**: the diagram's entire content is the wires, and the mobile reader gets none
of them.

The topology does not fall back. It **unrolls the same polar frame into a Cartesian one**: the same
logarithmic recency scale, the same nodes, the same 20 wires, the same three terminal forms.

### 6.1 The projection (precomputed in the same build script)

Below `900px` the component renders `layout.mobile`.

- `viewBox="0 0 390 820"`, `aspect-ratio: 39/82`, `width: 100%`.
- **y = the same scale**: `y(d) = 56 + (log10(clamp(daysSince(d), 1, 10_000)) / 4) × 620`.
  Gridlines become horizontal 1 px rules at `y = 56, 211, 366, 521, 676`, carrying the **identical**
  labels (`≤ 1 DAY`, `10 DAYS`, `100 DAYS`, `1,000 DAYS`, `10,000 DAYS`), right-aligned in a 64 px
  gutter, `var(--ink-500)` at `stroke-opacity: 0.40`.
  The undated rail is a dashed rule at `y = 744` with the same hatch band and the same label.
- **x = kind**: sources anchor at `x = 150` (labels flow left from `x = 142`, right-aligned);
  capabilities anchor at `x = 240` (labels flow right from `x = 248`).
- Wires: cubic with horizontal tangents, `M 150 ay C 194 ay, 196 by, 240 by`. Same stroke, same
  texture rule, same lit/dim behaviour.

### 6.2 Label dodging — and it is drawn, not hidden

Per column, at build time: sort by true `y` ascending, then a forward pass and a backward pass
enforcing a **minimum 30 px gap** (the standard monotone two-pass dodge), clamped to
`[44, 776]`. Where `|dodgedY − trueY| > 2`, a **1 px leader** is drawn from the node's true position
on the axis to its dodged label, `var(--ink-500)`, `stroke-opacity: 0.5`. The displacement is
therefore visible rather than concealed — the reader can always see where the datum really sits.

13 sources need 390 px of the 732 px available; 16 capabilities need 480 px. Both fit without
compression, so no label is ever dropped.

### 6.3 The tag at 390 px

The tag's two columns stack: `grid-template-columns: 1fr`, `viewBox` unchanged but
`aspect-ratio: 32/24`, the clipped corner and eyelet preserved (they are the recognition cue and must
never be removed), the tether not drawn, the `NOT TESTED` hatch keeping a full-width 100 px band.
Type scale drops one step (`0.56 / 0.60 / 0.66 / 0.82 / 0.98rem`).

---

## 7 · Interaction — R-97's four depths

| R-97 depth | Implementation |
|---|---|
| **hover reveal** | Pointer over any node sets `active`; its wires and connected nodes go to full opacity, the complement drops to `stroke-opacity: 0.10` / `opacity: 0.30`. The readout beneath fills with that node's evidence, date, caliper gloss and provenance method. Nothing appears that was not already legible. |
| **focus and zoom** | `Enter` / `Space` on a **source** node interpolates the SVG `viewBox` over `var(--motion-base)` (320 ms) `var(--motion-ease-emphasized)` to the bounding box of that source's subtree, inflated 12 %. The rings and their labels scale with it and stay labelled. `Escape` restores `0 0 1000 1000`. |
| **filtering / drill-down** | Pinning a node (`Enter` on a capability, or click) sets the record table's filter to `traced`, hides non-matching rows via the existing `hidden` mechanism inside the existing fixed-height wrapper, and updates the existing `role="status"` count line to `N of 17 capabilities shown · traced from {label}`. The existing `Everything` button clears it. TC-SKILL-06 and TC-SKILL-07 keep passing. |
| **one curiosity-rewarding state** | **The undated rail.** Arrowing outward past the 10,000-day ring — or activating the axis's last label — moves focus to the two nodes on the dashed arc and reveals the line *"We looked. The CV prints no date for this certification, so it is not on the scale."* It is the only place on the board where the reader discovers something the site could not measure, and it is a reward rather than a gap. |

**Nodes are not draggable.** Dragging would move a node off its ring and the position would stop
being the data.

---

## 8 · The keyboard model (R-101 §9.1) — complete

- **Tab order follows data order, not paint order.** The section's tab sequence is:
  tag `RESULT` link → tag `NOT TESTED` caliper (`tabindex="-1"`, not a stop) → the topology group
  (one stop, roving `tabindex`) → the filter buttons → the table.
- The topology is **one tab stop**. Entry lands on the **innermost ring's first node in DOM order**,
  or on the last-focused node if the reader is returning.
- DOM order of nodes = **ring order, innermost first; within a ring, ascending angle from 12 o'clock
  clockwise**. Screen-reader reading order therefore *is* the recency axis.

| Key | Action |
|---|---|
| `ArrowRight` / `ArrowLeft` | next / previous node **within the current ring**, wrapping |
| `ArrowDown` | nearest node by angle on the **next ring outward** (older); from the outermost ring → the undated rail |
| `ArrowUp` | nearest node by angle on the **next ring inward** (newer); from the innermost ring → no move (no wrap, so the reader can feel the edge) |
| `Home` / `End` | first node on the innermost ring / last node on the undated rail |
| `Enter` / `Space` | on a source: focus-and-zoom to its subtree. On a capability: pin + drill down to the table |
| `Escape` | unpin, restore the viewBox, clear the trace, keep focus on the current node |
| `Shift`+`Tab` from the first node | leaves the group upward — **no trap** |

Every openable source node is an `<a href>`, so `Enter` on it in a screen reader's browse mode
follows the link, and `Space` zooms. No single-letter shortcuts are bound (they collide with AT
navigation). Focus ring: `outline: 2px solid var(--white); outline-offset: 3px` — the shipped
`Bench.module.css:181-183` treatment, kept.

---

## 9 · ARIA structure (R-101 §9.2)

```html
<figure data-viz-id="skills.calibration-topology" aria-labelledby="topo-title" aria-describedby="topo-desc">
  <h3 id="topo-title" class="visually-hidden">Every capability, placed by when its evidence was last touched</h3>
  <p id="topo-desc" class="topoDesc">…the insight sentence (§10)…</p>

  <svg aria-hidden="true" focusable="false" viewBox="0 0 1000 1000"> …rings, wires, glyphs… </svg>

  <div class="labels" role="group" aria-label="29 nodes on a logarithmic recency axis. Use arrow keys to move between them.">
    <a  href="https://github.com/…" role="button" tabindex="0|-1"
        data-kind="source" data-caliper="sourced" data-ring="1"
        data-source-id="repositories.forgotten-mistory.pushedAt"
        data-retrieved-at="2026-09-03T20:09:30Z"
        aria-label="this site, a public repository. Last touched 3 September 2026. Measured; source given. Carries 1 capability."
        aria-describedby="topo-n-this-site-links">…</a>
    <span id="topo-n-this-site-links" class="visually-hidden">Wired to: WebGL and GLSL.</span>
    …
  </div>

  <p class="readout" data-testid="topo-readout"> …not a live region… </p>
</figure>
```

- The SVG is `aria-hidden` in its entirety: rings, gridlines, hatches and wires are atmosphere and
  structure, and every datum they carry is on a real focusable element or in the table
  (`Experience.tsx:79,136` precedent).
- Every node's accessible name carries **its value and its units** — the date, the caliper gloss, and
  the count of what it is wired to — not just its label.
- The `.readout` is **not** a live region (the Bench's ruling, preserved: it changes on every hover
  and would make the section unusable). The evidence is on each node's own label, spoken once on
  focus.
- The **only** polite live region in the section is the existing `role="status"` filter-count line —
  a change the reader asked for.
- `<Caliper>` continues to announce its state via its `.gloss` span. The three glosses are
  unchanged.

---

## 10 · The dual read (R-99) and the text alternative (R-101 §9.3)

**3-second headline.** A dense ring at the centre, a sparse rim, and one gold field on a tag above
it. *Almost everything he can show you was touched this week; the oldest things are two degrees.*

**30-second detail.** Five labelled rings on a base-10 scale, 29 nodes carrying three terminal forms,
20 wires joining capabilities to the programmes, repositories and issuing bodies their evidence came
from, seven of which are links you can open, and one uncertainty arc per date the CV states only to
the month or the year.

**Takeaway line** (authored prose, ≤ 20 words, printed with the artefact):

> *Everything I can prove is a week old. Everything I can only tell you about is a year or more.*

**Insight-equivalent text alternative.** The record table, unhidden, immediately beneath, with three
new columns:

| existing | new |
|---|---|
| Capability · Evidence · Where · Status | **Last touched** (formatted date + `<Caliper>` + precision note) · **Openable** (the `htmlUrl` as a real link, or the reason there is none, verbatim) · **Shares a source with** (the capability names it is adjacent to) |

Plus `#topo-desc`, rendered visibly above the diagram, which is the sentence a reader who never sees
the picture needs in order to reach the same conclusion the takeaway states:

> *Sixteen capabilities are placed on a logarithmic axis by when their evidence was last touched:
> seven sit on the one-day ring because the repositories behind them were pushed this week; one sits
> at five months; five sit between fourteen and twenty-one months out — three because the employer
> that measured them was left in June 2025, two because their repositories have not been touched
> since spring 2025; two sit at the rim because they are degrees from 2010 and 2007; and one is off
> the scale entirely, because the CV prints no date for that certification at all.*

That is a sentence naming the shape, the extremes and the comparison — not "a chart of skills", and
not a bare table offered as the equivalent of a topology (grammar §9.3 prohibits both).

---

## 11 · Motion, and the reduced-motion composition (R-101 §9.4)

All tokens from `design-system-lock.md` §4.2. **No new token is introduced** — in particular
`--motion-ease-mechanical`, proposed by both research concepts, is **not** added; `--motion-base` +
`--motion-ease-emphasized` (`cubic-bezier(0.16, 1, 0.3, 1)`, which does not overshoot) is correct
and already shipped.

**Entrance**, one-shot, on `IntersectionObserver` at `threshold: 0.15`, `observer.disconnect()` on
first hit (the `Bench.tsx:189-207` pattern, preserved), total **1,180 ms**:

| beat | window | what |
|---|---|---|
| 1 | 0 – 440 ms | the five rings draw, outermost first, `stroke-dashoffset: 1 → 0` with `pathLength="1"`, `var(--motion-emphatic)` `var(--motion-ease-emphasized)`, stagger `var(--stagger-tight)` (60 ms) |
| 2 | 320 – 900 ms | the 20 wires trace, `stroke-dashoffset: 1 → 0`, `var(--motion-cine-in)` (720 ms), stagger 24 ms in **ring order, innermost first** |
| 3 | 760 – 1,180 ms | node glyphs and labels fade `opacity: 0 → 1`, `var(--motion-base)`, stagger `var(--stagger-tight)` |

A `settled` flag is set at 1,240 ms and sets `animation: none` on every animated element, so a
resize, a re-render or a font swap can never replay the entrance (the Bench's hard-won lesson,
preserved). **Final values render on first paint** — the animation only fades opacity and traces
stroke offsets; no coordinate, count or date ever passes through a wrong intermediate value (R-175,
grammar §2.4).

**Reduced motion is a re-score, not a mute** (`design-system-lock.md` §4.3):

```css
@media (prefers-reduced-motion: reduce) {
  .ring, .wire, .glyph, .label { animation: none; }
  .figure[data-drawn] .label { animation: topoFade var(--motion-fast) linear both; }
  .figure[data-drawn] .label:nth-child(n) { animation-delay: calc(var(--i) * 40ms); }
  .wire { stroke-opacity: 0.30; }
  .wire[data-ring="1"] { stroke-opacity: 0.62; }
  .ring { stroke-opacity: 0.55; }
  .ringLabel { opacity: 1; }
}
```

The reduced composition is a **different arrangement of the same piece**: everything is at its final
position on first paint; the labels still arrive in order with a 40 ms stagger, losing only travel;
the ring labels, which fade in under motion, are simply always present; and the wires are graded so
the innermost ring reads first. It is a still that holds — a printed plate rather than a stopped
film. Colour and border transitions survive at `var(--motion-fast)` per §4.3 clause 3.

**Degraded states** (grammar §9.5), all three designed:
- **JavaScript failed** — the entire figure is server-rendered markup from a static JSON. Rings,
  wires, glyphs, labels, readout rest state and the table all render. Only hover/keyboard traversal
  is lost. Nothing is measured at runtime, so there is nothing to fail.
- **No WebGL** — not applicable; render class is `svg`.
- **Data unavailable** — impossible at runtime (the layout is a build artefact). At *build* time a
  module refresh failure degrades to `retained` per `dataset-layer-design.md` §3.4 and the readout
  prints the retained `observedAt` with its `RefreshOutcome`, so the reader is told the dates are
  from the previous harvest rather than shown a fresh-looking stale board.

---

## 12 · Performance envelope (R-100)

| Budget | Target | How it is met |
|---|---|---|
| fps with everything active | ≥ 60 | ~150 SVG elements; only `stroke-opacity`, `opacity` and `stroke-width` transition; no layout property is animated; no runtime simulation |
| lazy init | yes | one `IntersectionObserver`, `threshold: 0.15`, disconnected on first intersection |
| full disposal | yes | on unmount: `observer.disconnect()`, `matchMedia` listener removed, all pointer/key handlers are React-managed. **Zero** `ResizeObserver`, zero `requestAnimationFrame` loop, zero timers after `settled` |
| memory ceiling | **≤ 3 MB** JS heap delta while mounted | declared in the dossier; measured by `tests/perf/viz_perf.spec.ts` |
| CLS contribution | **0.00** | the SVG has a fixed `aspect-ratio`; labels are absolutely positioned from precomputed percentages; nothing is measured, so nothing reflows after paint |
| LCP | unaffected | the section is below the fold; the tag is HTML text with no image |
| runtime bundle delta | ≈ 1.9 KB gzip JSON + ≈ 3.4 KB gzip component | `d3-force` and `d3-scale` are `devDependencies`; **a runtime `d3` import is a build failure** (add to the ESLint `no-restricted-imports` list) |

---

## 13 · Files

**Create**
```
components/sections/Skills/CalibrationTag.tsx
components/sections/Skills/CalibrationTag.module.css
components/sections/Skills/Topology.tsx
components/sections/Skills/Topology.module.css
components/sections/Skills/useTopologyKeyboard.ts
app/data/canonical/generated/skills-topology-layout.v1.json   (generated)
scripts/dataset/skills_topology_layout.mjs
tests/e2e/skills-topology.spec.ts
```

**Change**
```
app/data/portfolio/skills.ts            delete `lede`; add `tagCopy`, `topologyCopy`, `takeaway`;
                                        split capabilities[5].evidence (§4.2 ¹);
                                        restate capabilities[8].evidence (§4.2 ²)
components/sections/Skills/Skills.tsx   swap <Bench/> for <CalibrationTag/> + <Topology/>;
                                        delete the <ul className={styles.legend}> block;
                                        delete the lede <p>; add the three table columns;
                                        add filter mode 'traced'
components/sections/Skills/Skills.module.css   delete .legend/.legendItem/.legendGlyph/.legendLabel;
                                        add .lastTouched/.openable/.adjacent column rules
app/data/canonical/selectors.ts         add selectSkillsTopology(), selectCalibrationCounts(),
                                        selectTagSpecimen()
app/data/canonical/dossiers.ts          add the skills.calibration-topology dossier (§15)
scripts/dataset/build_dataset.mjs       invoke skills_topology_layout.mjs; assert datasetHash match
scripts/validate/dataset_integrity.mjs  no change needed — clause 5 already asserts one gold mark
.eslintrc.json                          no-restricted-imports: 'd3-force', 'd3-scale' in app/ + components/
package.json                            devDependencies: d3-force 3.0.0, d3-scale 4.0.2;
                                        scripts: "dataset:layout:check"
tests/e2e/skills.spec.ts                delete TC-BENCH-01…04 (the Bench is gone)
```

**Delete**
```
components/sections/Skills/Bench.tsx
components/sections/Skills/Bench.module.css
```

**Types** (`app/data/canonical/schema/topology.ts`)

```ts
export type CaliperState = 'sourced' | 'self-reported' | 'open';   // re-export, single definition
export type NodeKind = 'source' | 'capability';

export interface TopologyNode {
  readonly id: string;                 // 'src:aether' | 'cap:5'
  readonly kind: NodeKind;
  readonly label: string;              // Source.label | Capability.short
  readonly longLabel: string;          // Source.label | Capability.capability
  readonly caliper: CaliperState;      // derived, never authored (§4.1)
  readonly status: EvidenceStatus | null;   // capabilities only
  readonly sourceKind: SourceKind | null;   // sources only
  readonly href: string | null;        // non-null iff caliper === 'sourced' && kind === 'source'
  readonly lastTouched: Field<Iso8601>;     // Sourced | NotObservable
  readonly precision: 'instant' | 'month' | 'year' | 'ongoing' | 'none';
  readonly daysSince: number | null;   // null iff NotObservable
  readonly r: number;                  // 150…462, two decimals
  readonly ring: 1 | 2 | 3 | 4 | 5 | 'undated';
  readonly x: number; readonly y: number;             // desktop, viewBox units
  readonly mx: number; readonly my: number;           // mobile, viewBox units
  readonly mLeaderY: number | null;    // mobile true-y when the label was dodged
  readonly sourceId: string;           // dataset provenance key
}

export interface TopologyEdge {
  readonly id: string;                 // 'aether→5'
  readonly source: string; readonly target: string;
  readonly status: EvidenceStatus;     // solid | dashed
  readonly d: string;                  // desktop path
  readonly md: string;                 // mobile path
}

export interface TopologyLayout {
  readonly schemaVersion: 1;
  readonly generatedFrom: { readonly datasetHash: string; readonly t0: Iso8601 };
  readonly seed: number; readonly ticks: number;
  readonly viewBox: readonly [0, 0, 1000, 1000];
  readonly mobileViewBox: readonly [0, 0, 390, 820];
  readonly centre: readonly [500, 500];
  readonly rings: readonly { readonly days: number; readonly r: number;
                             readonly y: number; readonly label: string }[];
  readonly nodes: readonly TopologyNode[];
  readonly edges: readonly TopologyEdge[];
}
```

---

## 14 · Tests

`tests/e2e/skills-topology.spec.ts`. `TC-SKILL-01 … 08` are untouched and must keep passing.
`TC-BENCH-01 … 04` are deleted with the component they tested.

| id | assertion |
|---|---|
| **TC-TAG-01** | `#skills` contains exactly one element with the clipped-corner tag path; its `d` starts `M 29 1` |
| **TC-TAG-02** | the tag prints all three caliper states: `[data-state="sourced"]`, `[data-state="self-reported"]`, `[data-state="open"]` each ≥ 1 inside the tag |
| **TC-TAG-03** | `RESULT`'s adjacent `<a>` `href` matches `/^https:\/\/github\.com\/Victordtesla24\//` and returns HTTP 200 unauthenticated (`request.get`) |
| **TC-TAG-04** | the `METHOD` field's text equals the `provenance.method` for the `data-source-id` on the `RESULT` caliper, fetched from `/dataset-provenance.json` |
| **TC-TAG-05** | the `DUE` box contains no text node (`textContent.trim() === ''`) |
| **TC-TAG-06** | the old lede string *"Every instrument ships with a certificate"* appears **nowhere** in `#skills` |
| **TC-TOPO-01** | `[data-kind="source"]` = 13, `[data-kind="capability"]` = 16, `#skills svg path.wire` = 20 |
| **TC-TOPO-02** | exactly 17 wires have no `stroke-dasharray` and exactly 3 have `4 3`; **zero** wires have a `stroke` containing `gold`; `getComputedStyle(wire).stroke` never equals `rgb(201, 168, 76)` |
| **TC-TOPO-03** | for every node, `hypot(cx − 500, cy − 500)` equals its `data-r` within 0.5 px — the radial channel is exact, so no node's position is approximate |
| **TC-TOPO-04** | `[data-caliper="sourced"][data-kind="source"]` = 7; `[data-caliper="self-reported"][data-kind="source"]` = 5; `[data-caliper="open"][data-kind="source"]` = 1; and `[data-caliper="sourced"][data-kind="capability"]` = 6 |
| **TC-TOPO-05** | every `[data-caliper="sourced"]` node is an `<a>` with a `github.com` href; every non-`sourced` node is a `<button>` with no `href` |
| **TC-TOPO-06** | `#skills [data-gold="true"]` has count **exactly 1**, and it is inside the tag's `RESULT` field |
| **TC-TOPO-07** | node DOM order is non-decreasing in `data-r` — reading order is the recency axis |
| **TC-TOPO-08** | hovering `ANZ Banking Group` lights exactly 3 wires; every unlit wire computes `stroke-opacity < 0.15`; **every** wire and label is still in the DOM and none has `visibility:hidden` or `display:none` |
| **TC-TOPO-09** | each node's `aria-label` contains its formatted date **and** its caliper gloss; the `scrum-alliance` node's label contains *"No award or expiry date is printed on the CV"* |
| **TC-TOPO-10** | keyboard: focus the group, press `ArrowRight` × 3 → focus moves within ring 1; `ArrowDown` → focus lands on a node with a larger `data-r`; `ArrowUp` from ring 1 does not move; `Escape` clears `[data-pinned]`; `Shift+Tab` leaves the group (no trap) |
| **TC-TOPO-11** | `Enter` on a capability node sets the table filter and the `role="status"` line to contain `traced from` |
| **TC-TOPO-12** | **at 390 × 844**: `svg path.wire` count is still **20**, every wire has `getTotalLength() > 40`, and no `.wires` ancestor computes `display: none`. *This is the R-52 regression test.* |
| **TC-TOPO-13** | at 390 px the five ring labels are present with the same strings as desktop |
| **TC-TOPO-14** | under `prefers-reduced-motion: reduce`: every label reaches `opacity: 1`, no element's `transform` differs from `none`, and at least one ordered staggered fade is observable (`animation-delay` strictly increasing across ≥ 3 labels) |
| **TC-TOPO-15** | with JavaScript disabled (`context.addInitScript` blocked / `javaScriptEnabled: false`): 20 wires, 29 nodes and 5 ring labels are present in the served HTML |
| **TC-TOPO-16** | no `[role="status"]`/`aria-live` element exists inside the topology figure other than the filter count line |
| **TC-TOPO-17** | **determinism**: `node scripts/dataset/skills_topology_layout.mjs --check` exits 0 (two runs byte-identical) |
| **TC-TOPO-18** | **no proficiency channel**: no node has a `width`, `height`, `r` or `font-size` that varies with anything but its `kind`; assert `[data-kind="capability"]` glyphs have at most 3 distinct computed sizes (one per status) and `[data-kind="source"]` at most 3 |
| **TC-TOPO-19** | `dataset_integrity.mjs` passes: every `data-source-id` in `#skills` resolves in `/dataset-provenance.json`, and the dossier's `goldMark` is the only `data-gold="true"` in the view |
| **TC-TOPO-20** | axe-core on `#skills` reports zero violations at WCAG 2.2 AA, including with a node focused and with a node pinned |

`TC-SKILL-03` (no proficiency bars, meters or ratings) is **extended** to scan the topology's SVG for
`<rect>` elements whose width varies across siblings, and to fail on any `role="meter"`,
`role="progressbar"`, `<progress>`, `<meter>`, or a `%` character adjacent to a capability label.

---

## 15 · The dossier (R-112) — `app/data/canonical/dossiers.ts`

```ts
{
  vizId: 'skills.calibration-topology',
  section: '#skills',
  title: 'The calibration topology',
  renderClass: 'svg',

  whatItShows:
    'Sixteen capabilities and the thirteen programmes, repositories and issuing bodies their ' +
    'evidence came from, placed on a base-10 logarithmic axis by how long ago that evidence was ' +
    'last touched. Radius is recency and nothing else; wires are shared sources; each node’s ' +
    'terminal form states which of the three calibration states its evidence is in. No mark on ' +
    'the board encodes proficiency, and none can: the data carries no such field.',

  datasetFields: [
    'repositories.forgotten-mistory.pushedAt',
    'repositories.aether-job-career-agent.pushedAt',
    'repositories.abentertainment.pushedAt',
    'repositories.public-key-server.pushedAt',
    'repositories.containerised-birth-time-rectifier.pushedAt',
    'repositories.relationship-timeline-feature.pushedAt',
    'repositories.EFDDH-Jira-Analytics-Dashboard.pushedAt',
    'repositories.forgotten-mistory.htmlUrl',        /* … one htmlUrl per repository … */
    'cv.roles.role-ato-2026.end',
    'cv.roles.role-anz-sdl-2017.end',
    'cv.roles.role-independent-2025.end',
    'cv.education.edu-monash-2010.date',
    'cv.education.edu-unimelb-2007.date',
    'cv.certifications.cert-csm.date',               /* NotObservable */
    'manifest.modules.repositories.observedAt',      /* T0 */
  ],

  goldMark: 'repositories.forgotten-mistory.pushedAt',

  interactions: [
    { kind: 'hover-reveal', description: 'Pointer or focus on a node raises its wires and connected nodes and drops the complement to 0.10 stroke-opacity. Nothing is hidden before the interaction.' },
    { kind: 'focus-zoom',   description: 'Enter on a source interpolates the viewBox to that source’s subtree over 320 ms; the rings scale and stay labelled; Escape restores.' },
    { kind: 'drill-down',   description: 'Enter on a capability pins it and filters the record table to its rows; the polite count line announces the change.' },
    { kind: 'filter',       description: 'The three existing status filters continue to drive the table, and now also dim the corresponding nodes.' },
    { kind: 'curiosity',    description: 'Arrowing outward past the 10,000-day ring reaches the undated rail — the two nodes for which the CV prints no date at all.' },
  ],

  demonstratedSkill:
    'Deterministic force-directed layout computed at build time and shipped as fixed coordinates, ' +
    'so a graph of twenty-nine nodes renders with zero runtime simulation, zero layout ' +
    'measurement and zero cumulative layout shift; a custom radial-clamp force that makes the ' +
    'quantitative channel exact rather than approximate; and a responsive projection that keeps ' +
    'every wire at 390 px instead of dropping the diagram.',

  takeaway:
    'Everything I can prove is a week old. Everything I can only tell you about is a year or more.',

  accessibility: {
    textAlternative:
      '#skills p#topo-desc + #skills table — the insight sentence, then the full record with ' +
      'Last touched, Openable and Shares-a-source-with columns. Neither is behind a toggle.',
    reducedMotion:
      'The settled frame is the base stylesheet: rings, wires, glyphs and labels are at final ' +
      'position and opacity on first paint. The choreography is re-scored, not muted — labels ' +
      'still arrive in ring order on a 40 ms stagger with no travel, ring labels are permanently ' +
      'visible instead of fading in, and the wires are graded so the one-day ring reads first.',
  },

  performance: { /* NOT authored — written by scripts/dataset/build_dossiers.mjs from
                    reports/viz-perf.json. Budgets asserted: fps ≥ 60, initMs ≤ 120,
                    memoryMb ≤ 3, disposedCleanly === true. */ },
}
```

---

## 16 · Open facts, recorded rather than assumed

1. **`repositories.public-key-server.testFileCount` does not yet exist** in the canonical dataset.
   Until it does, capability 8 grades `self-reported` and the word *"full"* must not ship as a
   `sourced` figure (§4.2 ²). This is a dataset work item, not a licence to guess.
2. **The specimen can change between deploys.** `selectTagSpecimen()` is a `max(pushedAt)` over
   public repositories; a push to `aether-job-career-agent` after the next `forgotten-mistory` push
   moves the gold mark. That is correct behaviour — the gold mark is a function of the data,
   evaluated at build, never authored per view — and TC-TAG-03 asserts the *shape*, not the identity.
3. **`daysSince` is floored at 1.** Two nodes pushed hours apart share the innermost ring. The floor
   is stated in the axis label, in `#topo-desc` and in the dossier. It is a declared limit of the
   scale, not a rounding that hides a difference.
4. **No credential verification URL is claimed** for Scrum Alliance, Monash or the University of
   Melbourne. None appears on the CV of record and none was found. If one is later supplied, those
   three nodes become `sourced` by the same rule, with no code change.
5. **LinkedIn remains not observable** (HTTP 999 login gate, `AUDIT-RECONCILIATION.md`). It is not a
   source in this topology and no node depends on it.
6. **`SC-17`'s readout string changes** from *"20 links · 13 sources · 17 capabilities"* to
   *"20 links · 13 sources · 16 capabilities on the board · 1 with no evidence yet"*. Both are true;
   the change is a consequence of grammar §2.4 and must be entered in the corrections ledger so the
   site's own history records why the number moved.

---

## Adversarial critique

**Verdict: NEEDS-REVISION.** Do not build until F-1 … F-7 are closed. As written the spec fails
`hero-visualisation-register.md` §4.11 test 1 and test 3, which mandates the stated fallback — *"the
current bench stays"* — so shipping it unrevised is non-compliant, not merely imperfect.

What survived attack: every date, radius, count and repository fact I could check is **real**. All
13 sources, 16 nodes, 20 edges, the 17/3 solid-dashed split, and all seven `pushedAt` values match
`corpus-repositories.json` (all seven repos are `visibility: public`); the CV date ranges match
`corpus-cv.json` (`role-anz-sdl-2017.end = 2025-06`, `role-independent-2025.end = 2026-02`,
`role-ato-2026.end = ongoing`); `r(d)` reproduces 251.90 / 303.76 / 338.30 / 339.41 / 346.37 exactly,
and the precision-band midpoints reproduce 311.15 / 335.35 / 413.98 / 419.16. Nothing is fabricated
in the arithmetic. The failures are in the law, the derivations and the code.

### Failures

| id | severity | failure |
|---|---|---|
| **F-1** | **BLOCKER — gold law** | `Caliper.module.css:76-79` paints `--gold` on the jaws of **every** `[data-state="sourced"]` caliper. §2.3 puts a `sourced` caliper in `EVIDENCE CLASS`, §10 adds a `<Caliper>` per row to the table's new *Last touched* column, and §4.2 grades 6 capabilities + 7 sources `sourced`. That is **≥ 8 gold marks in one view**, not one. §1's row *"Gold marks in view — Topology: 1"* is false, and §2.3's *"the `sourced` caliper here is not the gold mark"* is false against the shipped stylesheet. |
| **F-2** | **BLOCKER — gold law** | §13 does not remove `Skills.module.css:271` (`tr[data-status="production"] .statusGlyph { color: var(--gold) }` — 12 gold glyphs in the table) or `:373` (`tr[data-traced] { box-shadow: inset 2px 0 0 var(--gold) }`). §7's drill-down *sets* `data-traced`, so the spec's own interaction paints gold as **"you are here"** — explicitly forbidden. §1 removes gold only from `Bench.module.css:214`. |
| **F-3** | **BLOCKER — R-166 / R-171** | §1 and §13 **delete `skillsContent.lede`**, and TC-TAG-06 asserts it is gone. R-166's preservation obligations (register §4.10) require *"the explicit refusal of proficiency bars **with its reason**"*, and §4.11's pass table requires *"the lede's reason stays on the page verbatim."* The sentence *"There are no proficiency bars on this page, because nobody can check one"* is preserved **nowhere** in this spec. The tag teaches the three **caliper** states; it never states the refusal. Register §4.11 test 1: *any miss → fail → the bench stays.* |
| **F-4** | **BLOCKER — fabricated position** | The primary quantitative channel places two nodes ~4 years too fresh. `corpus-cv.json` holds **two** ANZ roles. The figures behind capability 3 (*">30% delivery efficiency · >15% infrastructure cost reduction"*) and capability 4 (*"$5M+ portfolio · 5+ squads · 40+ practitioners"*) are verbatim bullets of **`role-anz-arch-2017`, dated `2017 – 2022`** — only capability 2's telemetry bullet is dated `2022 – 2025` inside `role-anz-sdl-2017`. Keying the single `anz` source to `role-anz-sdl-2017.end` draws 3 and 4 at **r = 335.35 (430 days)** when their evidence was last touched in 2022 (**≈ 1,340 days, r ≈ 368.9**). §10's `#topo-desc` then states a false cause: *"three because the employer that measured them was left in June 2025."* Same defect class for `ato`, whose *role currency* is silently substituted for *evidence recency* — an unverifiable programme is drawn on the innermost "I can prove it" ring. |
| **F-5** | **BLOCKER — the honesty mechanism is a no-op** | §5.3's `radialClamp` is written as `function radialClamp(nodes) { return () => {…} }` and registered as `.force('ring', radialClamp)`. d3-force calls a force as `force(alpha)` and only ever calls `force.initialize(nodes, random)` if defined. So d3 invokes `radialClamp(alpha)`, receives a closure, and **discards it — the clamp never runs.** Worse, even once fixed it cannot deliver what §5.3 claims: d3's `tick()` applies forces **then** integrates `node.x += node.vx *= velocityDecay`, so a clamp inside the force phase is undone by the same tick. *"Every node's distance from the centre is the data, to floating-point"* is false; TC-TOPO-03 (±0.5 px) would fail. The clamp must be a post-tick pass, or the loop must be `sim.tick(); clamp();`. |
| **F-6** | **BLOCKER — self-contradicting tests** | (a) §16.1 states `repositories.public-key-server.testFileCount` **does not exist**, so §4.2 ² forces capability 8 to `self-reported`; yet §2.3 hard-prints *"6 capabilities"*, §4.2's totals say 6, and **TC-TOPO-04 asserts `[data-caliper="sourced"][data-kind="capability"] = 6`**. On day one the true count is **5**. The spec's own test asserts a number its own §16 says is unreachable. (b) **TC-TOPO-07** (DOM order non-decreasing in `data-r`) contradicts **§8** (*"within a ring, ascending angle"*) — decade ring 3 holds 12 nodes spanning r = 303.76 … 346.37, so angle-ordering breaks monotone r. (c) `ring: 1|2|3|4|5|'undated'` is in the type but its **derivation is never specified**; under decade bucketing ring 5 (10,000 days) is **empty**, and `ArrowDown` has no defined behaviour across it. |
| **F-7** | **MAJOR — grade above evidence** | §4.1(b) requires *"the figure printed in its `evidence` cell is reproducible."* Capabilities **10, 11 and 12 print no figure at all** — they print prose (*"gateway, AI service and Redis composed across separate stacks"*, *"bespoke shaders and scenes, one context per section, no context loss"*, *"customer-journey timeline in React/TypeScript"*). The spec grades all three `sourced` on editorial prose (*"both artefacts open and run"*), which cannot be computed by `selectors.ts` — so §4.1's *"mechanical … never authored"* is false and an implementer must hard-code the list. Capability 11 is worse: its `sourced` grade rests on *"graded TRUE at SC-01b / SC-31"*, but `AUDIT-RECONCILIATION.md` C-2 — the declared authority — records that **no `<canvas>` renders in the DOM at any section**; the one `webgl2` context is a detached probe. "One context per section, no context loss" is not observable by any reader on the site of record. |
| **F-8** | MAJOR — unbuildable as specified | `app/data/canonical/` **does not exist** (no `selectors.ts`, no `dossiers.ts`, no `schema/`); `scripts/dataset/` does not exist (no `build_dataset.mjs` to invoke); `scripts/validate/dataset_integrity.mjs` does not exist, so §13's *"no change needed — clause 5 already asserts one gold mark"* asserts a clause of a non-existent file; `tests/perf/viz_perf.spec.ts` does not exist; `/dataset-provenance.json` (TC-TAG-04, TC-TOPO-19) is not in `public/`; `d3-force`/`d3-scale` are not in `package.json`. Every one of these is listed under **"Change"**, not "Create". The spec is a dependent of `SPEC-telemetry-and-data.md` and must declare that ordering. |
| **F-9** | MAJOR — hand-wave | **The mobile switch has no stated mechanism.** §6 says *"Below 900 px the component renders `layout.mobile`"* while **TC-TOPO-15** requires 20 wires and 29 nodes in the **served HTML with JavaScript disabled**. A static export cannot choose a `viewBox` without JS. Either both layouts ship (CSS breakpoint) — and then **TC-TOPO-01 counts 26 sources, not 13**, and §12's *"~150 SVG elements"* doubles — or JS chooses, and TC-TOPO-15 fails at 390 px while a post-hydration swap on mobile contradicts the **CLS 0.00** claim. Unresolved. |
| **F-10** | MAJOR — hand-wave | **§7's focus-zoom is incompatible with §3.8's labels.** Node glyphs live in the `aria-hidden` SVG; the focusable nodes and all labels are **HTML absolutely positioned by percentage** (§9's markup confirms it). Interpolating the SVG `viewBox` moves the glyphs and leaves every label and every focus ring behind. Transforming `.labels` in step scales the type off the locked five-step ramp. §3.3's ring labels are specified with `text-anchor: middle` (SVG `<text>`) while §2.2 forbids SVG `<text>` — and if they are SVG they will scale under zoom too. |
| **F-11** | MODERATE — lost truth | Deleting the legend leaves the topology carrying **two** unexplained three-state vocabularies. The tag's `EVIDENCE CLASS` teaches the three **caliper** states; nothing anywhere teaches ● / ◐ / ○ (`production` / `non-production` / `pending`). §3.8's capability labels carry only the name, and §9's `aria-label` carries the caliper gloss but **not the status**. `statusLegend`'s words currently render on the page; after this change they render only inside table cells. |
| **F-12** | MODERATE — self-contradiction | §3.5 asserts *"**No node size channel** (grammar §2.3: never a node size)"* in the same table that specifies a **6.4 px** disc for `production` and **5.4 px** for `non-production`/`pending`. Size varies with an evidence claim. TC-TOPO-18 is written to *permit* this (*"at most 3 distinct computed sizes"*), so the test ratifies the violation instead of catching it. |
| **F-13** | MODERATE — under-specified | §3.3 defines the precision **arc** as `[r(dₘᵢₙ), r(dₘₐₓ)]` but **never states where the node itself sits**. Reverse-engineering §3.4 shows the midpoint of the day range was used (`independent` 200.6 d, `anz` 444.4 d, `monash` 5,901 d, `unimelb` 6,999 d). An implementer would guess `dₘᵢₙ`, `dₘₐₓ` or the geometric mean and reproduce none of the printed radii. State the rule. |
| **F-14** | MINOR — CI | **TC-TAG-03 makes a live unauthenticated HTTPS request to github.com inside the Playwright suite.** The site's CI is already red (`AUDIT-RECONCILIATION.md`); adding a network dependency to a test that must be green makes it flaky and offline-hostile. Assert the URL **shape** in the suite and move the 200 check to the dataset harvest, where it belongs and where §4.1 already needs it. |

### Critique (≈470 words)

The spine is right, and it is the best answer to D-01 anyone has written: strength stays the three
states already in the data, recency becomes a **drawn, labelled** axis with real dates, adjacency
stays shared sources, and no scalar of any kind is invented. Precomputing the layout at build time
and shipping fixed coordinates is the correct call and genuinely earns the CLS and fps claims. The
empty `DUE` box is the best single idea in the document — a field left blank in a document about
filling fields in honestly is a real reward, not a gimmick. Keeping all 20 wires at 390 px fixes a
live R-52 failure. The refusal to make nodes draggable, with its reason stated, is exactly the right
instinct. **None of that is what is wrong.**

What is wrong is that the spec repeatedly asserts a property it has not verified against the code
that would have to deliver it, and then writes a test that ratifies the assertion instead of
attacking it. F-1 is the sharpest case: TC-TOPO-06 counts `data-gold="true"` — an attribute the spec
itself invents and applies once — and would pass green while the section renders eight or more gold
caliper jaws from a stylesheet the spec never opened. TC-TOPO-02 checks the *wires* for gold and
finds none, which is true and irrelevant. TC-TOPO-18 is written around F-12 rather than at it.
A test that can only fail if the implementer disobeys the spec is not falsifiable; it is a
restatement. The suite needs at least one adversarial assertion per law — *count computed
`rgb(201, 168, 76)` across every element in `#skills`* would have caught F-1, F-2 and the
`data-traced` accent in one line.

On honesty the balance is genuinely positive — rendering `sourced` at all, printing the undated rail,
drawing precision arcs, and refusing to invent a credential URL are all net gains, and §4.3 is the
strongest paragraph here. But it is not uniformly positive, and R-171 does not net out. F-3 loses a
protected sentence. F-4 puts two figures on the wrong ring, in the one channel the spec calls exact.
F-7 grades three prose claims at the highest grade, including one the reconciliation record says a
reader cannot observe. Each is individually a *"rebuild that loses a truth"* — a downgrade wearing
better clothes — and F-4 is the worst kind, because it is invisible: a reader cannot tell 335 from
369, so the error is undetectable from the drawing and contradicted only by the corpus.

Buildability is the least of it, but F-8 through F-10 mean an implementer stops at the first hour:
the `Change` list names files that do not exist, the mobile switch has no mechanism, and the zoom
interaction and the label system are architecturally incompatible.

### The single strongest improvement

**Key every node's radius to the dated evidence that carries its figure, not to the container it
sits in — and prove it with a per-node `provenanceDate` field that the layout script refuses to run
without.** `corpus-cv.json` already carries what is needed: ANZ is two roles with printed ranges
(`2017 – 2022`, `2022 – 2025`) and the bullets themselves carry inline date ranges. One `anz` source
keyed to one role end is the single point where the spec's own quantitative channel stops being
data, and it silently drags `ato` (role currency read as evidence recency) with it. Fixing it splits
the source registry to the resolution the corpus already has, moves capabilities 3 and 4 outward to
where the CV puts them, corrects `#topo-desc`'s false cause, and — most valuable of all — makes the
takeaway *earn* itself: once ATO's two unprovable capabilities leave the one-day ring, *"Everything I
can prove is a week old; everything I can only tell you about is a year or more"* becomes a
statement the picture actually demonstrates, instead of one it currently contradicts.
