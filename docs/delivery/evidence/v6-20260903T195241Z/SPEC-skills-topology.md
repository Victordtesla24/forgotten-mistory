# SPEC · The Skills Topology

**Run** `v6-20260903T195241Z` · **Revision 2** (supersedes revision 1 in place; the critic's seven
blockers and F-8 … F-14 are dispositioned in the Revision record at the foot of this document)
**Requirements** R-187, R-166, R-96, R-97, R-99, R-101, R-110, R-111, R-112, R-52, R-95, R-108,
R-109, R-165 … R-171 · **Success criteria** SC-96.1, SC-87.1 · **Gates** K and R · **Binding
decision** D-01 (`DECISIONS.md`) · **Grammar** `encoding-grammar.md` §2.1–2.5, §3.1–3.3, §8, §9,
§12 · **Tokens** `design-system-lock.md` §1.2, §4.2, §4.3 · **Dataset** `dataset-layer-design.md`
§1, §2.3, §5, §6

This is a build specification. Every geometry, weight, duration, easing, field name, DOM shape and
assertion below is fixed. An implementer executes it without making a further design decision. Any
number an implementer cannot reproduce from the canonical dataset is a defect in this spec, not a
licence to invent one.

**Two reading rules before anything else.**

1. **Every radius, day count and ring printed in this document is a worked reproduction at a
   declared instant, not a constant to hard-code.** The declared state of record is
   `corpus-repositories.json`, `generatedAt = 2026-09-03T20:09:30Z`, and `corpus-cv.json`. The real
   build reads `T0` from the dataset manifest and will produce different numbers the moment anything
   is pushed — the worktree's own `manifest.v1.json` already carries
   `modules.repositories.newestRetrievedAt = 2026-09-03T22:05:11Z` and a newer
   `forgotten-mistory.pushedAt` than the corpus does. **No test may assert a constant radius.** The
   tests assert the *invariants* (§14): that a node's drawn distance equals its own `data-r`, that
   `data-r` equals `r(daysSince(provenanceDate))`, and that the axis is labelled. Reproduce the
   formula; the constants below exist so an implementer can check their arithmetic against a fixed
   input, and for no other purpose.
2. **This spec has a hard prerequisite.** It consumes the canonical dataset built by
   `SPEC-telemetry-and-data.md` (Wave 4, in flight in the `wt/data-backend` worktree). §13.0 states
   exactly what this spec *requires* of that layer and what it creates itself if the requirement is
   unmet. Nothing here assumes a shape that was not verified on disk.

---

## 0 · Verdict against R-187's own escape clause

> *"The topology must be at least as honest as the table it replaces and considerably more
> explorable; if it cannot be both, the table stays until it can."*

**It can be both, and the table stays anyway** — but in a different role.

| | Bench (today, measured) | Topology (this spec) |
|---|---|---|
| Encodes | adjacency only (13 sources × 17 capabilities) | evidence-strength **and** recency **and** adjacency |
| Recency | absent | **position on a drawn, labelled logarithmic axis** — real `pushedAt` and real CV dates, one per node |
| Gold marks in view | **17** — `Bench.module.css:219-221` (production wires) plus `Skills.module.css:109` and `:271`; an R-110 violation shipping today | **1**, and §14's TC-TOPO-GOLD-01 counts painted gold rather than trusting an attribute |
| Caliper `sourced` state | rendered **nowhere** (verified: zero call sites in `components/` or `app/`) | rendered on 7 source nodes, 8 capability nodes and every table row — **exactly one of them gold** |
| Mobile ≤900 px | wires `display:none`; two lists — **an R-52 failure** | same encoding, same axis, **all 20 wires drawn** at 390 px, in the served HTML with JavaScript off |
| Proficiency scalar | none | none |
| The refusal *"There are no proficiency bars on this page, because nobody can check one"* | present in `skillsContent.lede` | **present, verbatim, unchanged** (§1) |

The record table is **not** deleted. It is promoted to the R-101 §9.3 insight-equivalent text
alternative and the R-97 drill-down target, and gains three columns that carry the topology's three
encodings as text. R-166 is preserved in full: the three calibration states, the evidence column,
the where column, the qualifying footnotes (`caveat`), the refusal of proficiency bars **with its
reason**, and the CV calibration line all survive verbatim. TC-SKILL-01 … TC-SKILL-08 keep passing
unmodified.

**The Bench is superseded, not accompanied.** `components/sections/Skills/Bench.tsx` (17,552 B) and
`Bench.module.css` (8,813 B) are deleted. There is exactly one diagram in `#skills`.

---

## 1 · What displaces what — the exact list

| Removed | Replaced by | Why |
|---|---|---|
| `components/sections/Skills/Bench.tsx` | `components/sections/Skills/Topology.tsx` | one diagram per section; the Sankey cannot carry recency |
| `components/sections/Skills/Bench.module.css` | `Topology.module.css` | — |
| `<ul className={styles.legend}>` in `Skills.tsx:110-126` (the floating status legend) | the tag's `EVIDENCE CLASS` **and `WHERE TAKEN`** blocks | grammar §5: direct labelling, not legends. **Both** three-state vocabularies move onto the artefact — the caliper states *and* `statusLegend`'s ● ◐ ○ with its words verbatim |
| `<figcaption>` of the Bench figure | the tag's `ITEM` / `METHOD` fields | subsumed |
| `.mark.production { background: var(--gold) }` (`Bench.module.css:219-221`) | deleted with the file | R-110: gold is a claim about **checkability**, not about production |
| the `bench-wire-gold` linear gradient | no gold stroke anywhere in the diagram | same |
| `Skills.module.css:107-110` `.legendItem:first-child .legendGlyph { color: var(--gold) }` | deleted with the legend | same |
| `Skills.module.css:270-272` `tr[data-status="production"] .statusGlyph { color: var(--gold) }` | `color: var(--mist-200)` | same. Twelve gold glyphs in the table today |
| `Skills.module.css:372-374` `tr[data-traced] { box-shadow: inset 2px 0 0 var(--gold) }` | `box-shadow: inset 2px 0 0 var(--mist-400)` | §7's drill-down **sets** `data-traced`. Gold as "you are here" is the one meaning the rule explicitly forbids |
| `Caliper.module.css:75-80` — gold jaws on **every** `[data-state="sourced"]` | gold jaws only on `[data-state="sourced"][data-gold="true"]`; ungated sourced jaws close in `var(--mist-200)` | §1.1 |
| `statusLegend` glyph column in the table | **kept unchanged** (TC-SKILL-05) | — |
| `skillsContent.lede` | **kept verbatim, still rendered** (§1.2) | R-166 / R-171 |
| the `Calibrated against … MD5 … bytes` footer | **kept verbatim** (TC-SKILL-08) | R-166's CV calibration line |

Nothing else in `#skills` changes.

### 1.1 The gold gate — a refinement of a shipped mark, with its reason

`components/marks/Caliper.module.css:75-80` currently paints `--gold` on the jaws of **every**
caliper in the `sourced` state. That is invisible today only because `sourced` renders nowhere:

```
$ grep -rn 'state="sourced"' components/ app/     # → no matches
$ grep -rn "'sourced'" components/ app/           # → one match: the type union in Caliper.tsx:7
```

The moment this spec renders `sourced` at all — 7 source nodes, 8 capability nodes, 17 table
rows — the stylesheet ships **32 gold marks in one view**. R-110 and the binding design law permit
**one**. So the rule is gated:

```css
/* State: sourced. The FORM carries the grade: the jaws close, and closed jaws
   are what a reader learns to mean "measured; source given". */
.caliper[data-state="sourced"] { color: var(--white); }

.caliper[data-state="sourced"] .arm::before,
.caliper[data-state="sourced"] .arm::after {
    border-color: var(--mist-200);
    background: var(--mist-200);
    opacity: 0.85;
}

/* Gold is the view's ONE figure whose source the reader can open from where
   they are standing. Gold never widens its meaning here — every gold mark is
   still "this figure has a source you can go and check". What the gate adds is
   scarcity: of the many such figures in a view, exactly one is gold. Without
   it, rendering `sourced` at all breaks R-110 on first paint. */
.caliper[data-state="sourced"][data-gold="true"] .arm::before,
.caliper[data-state="sourced"][data-gold="true"] .arm::after {
    border-color: var(--gold);
    background: var(--gold);
}

.caliper[data-state="sourced"] .arm::after { background: none; }
```

`Caliper.tsx` gains a discriminated prop so the combination cannot be mis-authored:

```ts
type CaliperProps =
  | { state: 'sourced'; gold?: boolean; /* … */ }
  | { state: 'self-reported' | 'open'; gold?: never; /* … */ };
```

`gold` emits `data-gold="true"`. `dataset_integrity` (§13.0) fails the build if `data-gold` appears
on anything that is not `[data-state="sourced"]`, or more than once in one section.

**Three consequences, stated rather than buried.**

- This is a **zero-pixel change to the site as it ships today**, because `sourced` has no call sites.
  It is nevertheless an edit to the one mark the site asks a reader to learn, and it is recorded in
  `DECISIONS.md` as such.
- `CLAUDE.md` currently states that gold *"appears on closed caliper jaws, the 'measured in
  production' mark, and live repository URLs."* The middle clause is `Skills.module.css:271` and it
  is exactly what R-110 forbids — production is a statement about **where evidence was taken**, not
  about whether a stranger can check it. **`CLAUDE.md` is corrected in the same commit** to read:
  *"Gold appears on exactly one closed caliper per view: the one figure in that view whose source
  the reader can open from where they are standing."*
- `#vitrine`'s gold repository URLs are **out of scope** for this spec and are not touched. If that
  section paints more than one gold mark, that is its own R-110 finding and belongs in its own
  work item; it is recorded here so it is not lost.

### 1.2 `skillsContent.lede` stays — verbatim

Revision 1 deleted it and asserted its absence. That was wrong. The Preservation Register (R-166,
register §4.10) protects *"the explicit refusal of proficiency bars **with its reason**"*, and
register §4.11 test 1 makes any miss a fail with the stated remedy *"the bench stays."* The sentence

> **There are no proficiency bars on this page, because nobody can check one.**

is the reason, and it survives **verbatim, in `app/data/portfolio/skills.ts:226`, still rendered in
the `<header>`**. The whole three-sentence lede stays:

> *Every instrument ships with a certificate saying what was tested, where, and what was not. This
> is that certificate. There are no proficiency bars on this page, because nobody can check one.*

R-96/R-99 ask that the metaphor be **taught by an artefact** rather than only asserted in prose.
That is satisfied by *adding* the artefact, not by *removing* the prose: after this change the lede
stops being a description of an absent object and becomes a caption for a present one — the sentence
*"This is that certificate"* finally points at something. **TC-TAG-06 is inverted**: the test now
asserts the refusal sentence is present, character-for-character, inside `#skills`.

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

**Two silhouettes ship, one is shown.** Exactly as the topology does (§6.0), the tag renders both a
desktop and a mobile SVG into the served HTML and lets a CSS media query hide one. There is no
JavaScript in the switch, so it survives `javaScriptEnabled: false` and it resolves before first
paint, so it contributes nothing to CLS.

#### Desktop silhouette — `viewBox="0 0 640 320"`, `aspect-ratio: 2/1`

`shape-rendering: geometricPrecision`, `preserveAspectRatio="xMidYMid meet"`, `aria-hidden="true"`,
**zero `<text>` elements** (TC-TAG-07). It draws only the tag body and the wire:

- **Tag body**: one `<path>` — a rectangle `x=1 y=1 w=574 h=318` with the **top-left corner clipped
  at 28 px on both axes**: `M 29 1 L 575 1 L 575 319 L 1 319 L 1 29 Z`. Stroke `var(--mist-400)` at
  `stroke-opacity: 0.55`, `stroke-width: 1`, `fill: none`. This clipped corner is the entire
  three-second recognition cue. The 65 px strip to the right of `x=575` is deliberate empty board:
  it is the lane the tether leaves through (§3.7).
- **Eyelet**: `<circle cx="18" cy="46" r="7">` stroke `var(--mist-400)` 1 px, plus a second
  `<circle cx="18" cy="46" r="11">` at `stroke-opacity: 0.22` — the reinforcing washer.
- **Wire**: `<path d="M 18 39 C 18 12, 96 6, 178 6">`, stroke `var(--mist-400)`, `stroke-width: 1`,
  `stroke-opacity: 0.45`, `stroke-linecap: round`, `fill: none`. It leaves the SVG at `(178, 6)` and
  is continued by the topology's own `<path id="tag-tether">` (§3.7).
- **Left-column field rules**: `<line x1="46" x2="286" …>` at `y = 40, 84, 124, 168, 236`.
  **Right-column field rules**: `<line x1="300" x2="560" …>` at `y = 40, 146, 234`.
  All: `stroke="var(--mist-400)" stroke-opacity="0.16" stroke-width="1"`.
- **The `NOT TESTED` hatch**: `<pattern id="tag-hatch" width="6" height="6"
  patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="6"
  stroke="var(--mist-400)" stroke-width="1" stroke-opacity="0.30"/></pattern>` filling
  `<rect x="300" y="252" width="260" height="52">`. **This is the same 45° hatch used on the About
  instrument's role-computed sectors, inside `<Caliper state="open">`, and on the topology's undated
  band.** A reader learns the mark once (grammar §2.3).
- **The `DUE` box**: `<rect x="46" y="248" width="118" height="20" fill="none"
  stroke="var(--mist-400)" stroke-opacity="0.30" stroke-width="1"/>` — **left empty, forever.**
  ISO/IEC 17025 §7.8.4.3: a laboratory does not assert a recalibration date the customer never
  requested. A test asserts it stays empty (TC-TAG-05).

**Type.** All text is HTML, absolutely positioned over the SVG in a sibling
`<div className={styles.fields}>` with `position:absolute; inset:0`, coordinates expressed as
percentages of the same 640×320 box. SVG `<text>` is not used anywhere in this section: it hints
differently from the rest of the page and cannot be selected — the Bench's own ruling
(`Bench.tsx:26-31`), preserved and now enforced by TC-TAG-07 and TC-TOPO-21.

| Field | Left % / Top % | Label style | Value |
|---|---|---|---|
| `CALIBRATION CERTIFICATE` | 7.19 / 5.00 | — | mono 0.62rem, `.14em`, `--mist-400` |
| `ITEM` | 7.19 / 16.25 | mono 0.60rem `.16em` uppercase `--ink-300` | `--font-heading` 1.05rem `--white` — the specimen capability's `capability` string |
| `METHOD` | 7.19 / 28.75 | same | mono 0.68rem `--mist-200` — the literal `Provenance.method` |
| `TAKEN AT` | 7.19 / 41.25 | same | 0.86rem `--mist-200` + kind badge (mono 0.58rem, 1 px `--token-border-default` border, 2 px radius) |
| `RESULT` | 7.19 / 55.00 | same | **the section's one gold mark** — see §2.4 |
| `DUE` | 7.19 / 77.50 | same | *(empty box)* |
| `EVIDENCE CLASS` | 46.88 / 16.25 | same | three lines, see §2.3 |
| `WHERE TAKEN` | 46.88 / 46.90 | same | three lines, see §2.3 |
| `NOT TESTED` | 46.88 / 74.40 | same | `<Caliper state="open">` over the hatch, given the full 260×52 field |
| `CERT` | 7.19 / 92.50 | same | mono 0.62rem `--ink-300` — the repositories module's retrieval instant and its `RefreshOutcome` |

Type scale used: exactly five steps, all from the locked ramp — `0.58 / 0.62 / 0.68 / 0.86 /
1.05rem`. No sixth.

#### Mobile silhouette — `viewBox="0 0 390 620"`, `aspect-ratio: 39/62`, shown below 900 px

The two columns become one. Body `M 22 1 L 389 1 L 389 619 L 1 619 L 1 22 Z` (clipped corner 21 px),
eyelet `cx=14 cy=36 r=6` + `r=10`, wire `M 14 30 C 14 10, 60 6, 112 6`. The clipped corner and the
eyelet are the recognition cue and **must never be removed at any width**. The tether is not drawn.
The `NOT TESTED` hatch keeps a full-width band, `<rect x="22" y="470" width="346" height="86">`.
Field order top to bottom: `CALIBRATION CERTIFICATE`, `ITEM`, `METHOD`, `TAKEN AT`, `RESULT`,
`EVIDENCE CLASS`, `WHERE TAKEN`, `NOT TESTED`, `DUE`, `CERT`. Type scale drops one step
(`0.56 / 0.60 / 0.66 / 0.82 / 0.98rem`).

### 2.3 `EVIDENCE CLASS` and `WHERE TAKEN` — the legend, made an object

Two three-line blocks. Together they are the whole of the deleted `<ul className={styles.legend}>`,
and they teach **both** vocabularies the topology uses — which the floating legend never did, since
it only ever showed ● ◐ ○.

**`EVIDENCE CLASS` — can a stranger check the date?** Each line is a live `<Caliper>` beside a real,
derived count. This is where the reader meets all three caliper states in one glance.

```
SOURCED         <Caliper state="sourced">7 sources · 8 capabilities</Caliper>
                the date beside it comes from a public repository you can open now
SELF-REPORTED   <Caliper state="self-reported">6 sources · 7 capabilities</Caliper>
                the date is printed on the CV; no public record carries it
OPEN            <Caliper state="open">1 source · 2 capabilities</Caliper>
                looked for, and honestly not there
```

**`WHERE TAKEN` — where was the evidence measured?** `statusLegend`'s three entries, glyph and label
**verbatim** from `app/data/portfolio/skills.ts:75-79`, direct-labelled instead of floating:

```
●   measured in production
◐   measured outside production
○   in progress, not yet held
```

Counts in `EVIDENCE CLASS` are computed by `selectCalibrationCounts()` (§4.4), never authored. The
gloss lines are editorial copy in `skills.ts` (`skillsContent.tagCopy`). The glyphs and labels in
`WHERE TAKEN` are read from the existing `statusLegend` record — not re-typed — so the two can never
drift (TC-TAG-08).

**The gloss lines say what the caliper grades.** This matters more than anything else on the tag.
The caliper on a node grades **the date the node is drawn at**, never the claim in the row. A
capability marked `sourced` means *you can check when this was last touched*, and it never means
*this capability is better than that one*. The gloss lines above say so in words, `#topo-desc` says
so in a sentence, and every node's `aria-label` says so on focus (§9).

The `sourced` caliper in `EVIDENCE CLASS` is **not** the gold mark. Under §1.1 it renders closed
jaws in `--mist-200`; gold is applied by `data-gold="true"` on exactly one element (§2.4), and that
element is in `RESULT`.

### 2.4 `RESULT` — the one gold mark in the section

```tsx
<Caliper
  state="sourced"
  gold
  {...markAttrs(specimen.lastTouched, 'skills.tag.result')}
>
  {formatUtc(specimen.lastTouched.value)}
</Caliper>
<a className={styles.resultUrl} href={specimen.htmlUrl}>{specimen.htmlUrl}</a>
```

`.resultUrl` is styled `color: var(--mist-200)`, `text-decoration: underline dotted 1px
var(--ink-500)`. **It is not gold** — the gold is on the caliper jaws beside it, and only there.

**Specimen selection is a deterministic selector, never authored** (grammar §3.1 rule 5):

```
specimen = argmax over { s ∈ sources : s.kind === 'repository'
                         ∧ repositories[s.repo].visibility === 'public'
                         ∧ repositories[s.repo].htmlUrl !== null
                         ∧ the harvest recorded HTTP 200 unauthenticated for that htmlUrl }
           of repositories[s.repo].pushedAt      // ties → repository name ascending
```

At the state of record this resolves to **`forgotten-mistory`**,
`pushedAt = 2026-09-03T17:53:39Z`, `htmlUrl = https://github.com/Victordtesla24/forgotten-mistory`,
and the `METHOD` field prints the literal provenance method the dataset carries for that field —
verified present in the Wave-4 artefact:

```
GET /repos/Victordtesla24/forgotten-mistory -> .pushed_at
```

This is the strongest possible teaching of the gold rule: *this figure has a source you can go and
check*, and the source is the page the reader is standing on. It is a statement about **when
something was last touched**, measured by a named API at a printed time — never about how good
anyone is at anything.

The gold mark is **never** applied to a node, a wire, a ring, a table row or a hover state.
`data-gold="true"` appears exactly once in `#skills`; TC-TOPO-06 asserts the attribute count and
**TC-TOPO-GOLD-01 asserts the painted result**, which is the assertion that would actually have caught
revision 1's failure.

### 2.5 What the tag teaches, in the order the reader gets it

1. **Silhouette (< 1 s)** — clipped corner + eyelet + wire = *a tag tied to an instrument*.
2. **The wire (1–3 s)** — it goes somewhere. The thing below is the instrument this tag belongs to.
3. **Two columns (3–10 s)** — left: what was tested, how, when, and the one result you can open.
   Right: the two vocabularies the board uses, and a hatched block with **real area** that says what
   was *not* tested.
4. **The empty `DUE` box (the reward)** — a field deliberately left blank, in a document whose entire
   subject is filling fields in honestly.

---

## 3 · The topology

`components/sections/Skills/Topology.tsx` · render class **`svg`** (R-109) · vizId
`skills.calibration-topology`.

### 3.1 The encoding, in one sentence

> Every capability and every source sits at a radius set by **when the dated evidence carrying its
> figure was last attested**, on a drawn logarithmic axis; wires join a capability to each source its
> evidence came from, so **adjacency is shared sources**; and each node's terminal form states
> **which of the three calibration states that date is in**. Nothing on the board encodes how good he
> is at anything.

That is D-01 executed literally: **strength = the three states already in the data; recency = real
attested dates; adjacency = shared sources.** There is no size channel, no length channel, no
opacity ramp, no ordering by quality, and no scalar of any kind.

### 3.2 `provenanceDate` — the rule the layout script refuses to run without

Revision 1 keyed each node's radius to **the container the evidence sits in** — one `anz` source
keyed to one role's end date, one `ato` source keyed to "ongoing". That put two figures roughly four
years too fresh and put two unverifiable programme claims on the innermost *"I can prove it"* ring.
It is the worst class of error available here, because it is invisible: a reader cannot tell r=335
from r=373, so nothing in the drawing contradicts it.

**Every node carries its own `provenanceDate`, and it is keyed to the dated evidence that carries
the node's figure.** `scripts/dataset/skills_topology_layout.mjs` **throws** — it does not warn, does
not default, does not fall back to the build time — if any node reaches the layout stage without one.
A missing date is a build failure, exactly as a missing provenance is in the canonical dataset's own
kernel (`app/data/canonical/provenance.ts`: *"a value without a source is not representable"*).

```ts
type ProvenanceDate =
  | { kind: 'instant'; at: Iso8601; field: string }                 // one exact moment
  | { kind: 'band'; newest: Iso8601; oldest: Iso8601; field: string; why: string }
  | { kind: 'not-observable'; reason: string; provedBy: string; field: string };
```

**The four branches, in the order the resolver tries them.**

| # | Evidence carrier | `provenanceDate` | Why this and not something else |
|---|---|---|---|
| 1 | a **repository** | `instant` at `repositories.<repo>.pushedAt` | the API prints a timestamp; the reader can run the printed method and get the same one |
| 2 | a **CV role or education record with a printed end date** | `band` from the **last day** to the **first day** of the printed period, at the CV's own precision | a month-precision "June 2025" is not a point. The band *is* the imprecision, drawn |
| 3 | a **CV role that is still running** (`end.precision === 'ongoing'`) | `band` from the **CV's own creation instant** to the **first day of the role's start period** | the CV prints no end. The freshest instant at which the claim is attested by anything is the moment the document making it was authored. That instant is checkable: `pdfinfo public/docs/Vik_Resume_Final.pdf` → `CreationDate` → `Fri Jun 12 17:30:37 2026 UTC`. The band's other end is the earliest the work could have happened |
| 4 | **nothing dated** | `not-observable` with the corpus reason verbatim | the undated rail (§3.3), never a guessed date |

Branch 3 is the one that matters and it must not be softened. **Role currency is not evidence
recency.** A role that is running today does not make its figures checkable today; it makes them
*undated at the fresh end*, which is a wider band, not a smaller radius. Drawing the ATO figures on
the one-day ring would have made the diagram assert the opposite of the thing it exists to say.

**Consequence: the source registry splits to the resolution the corpus already has.**
`corpus-cv.json` records two ANZ roles with different printed ranges and different bullets, and
records the fact that they overlap as a named anomaly (`anom-anz-overlap`: *"The CV does not state
whether these were concurrent titles, a promotion sequence printed out of order, or a layout
artefact."*). The registry therefore carries **two** ANZ sources, and the anomaly text travels with
both of them into the readout and the `aria-label` — the site prints the ambiguity rather than
resolving it silently.

```ts
// app/data/portfolio/skills.ts — sources[], replacing the single 'anz' entry
{ id: 'anz-arch', label: 'ANZ · Solutions Architect, 2017–2022', kind: 'programme' },
{ id: 'anz-sdl',  label: 'ANZ · Senior Delivery Lead, 2022–2025', kind: 'programme' },
```

and the three capabilities re-key by which role's bullet carries their figure — verified line by
line against `corpus-cv.json`:

| capability | its figure | verbatim from | `sources` |
|---|---|---|---|
| 2 · Real-time telemetry | *10,000+ concurrent devices held at P95 under 200 ms* | `role-anz-sdl-2017`, bullet *"AI/ML Strategy & Solutions (2022 - 2025)"* | `['anz-sdl']` |
| 3 · Cloud-native migration | *>30% delivery efficiency · >15% infrastructure cost reduction* | `role-anz-arch-2017`, bullet *"Agile Transformation & Program Management (2017 - 2022)"* | `['anz-arch']` |
| 4 · Programme & portfolio | *$5M+ portfolio · 5+ squads · 40+ practitioners* | `role-anz-arch-2017`, bullet *"Delivery Leadership: Directed a program portfolio valued at over $5M…"* | `['anz-arch']` |

`where` strings are unchanged (`'ANZ'` remains true). Source count moves **13 → 14**; edge count is
unchanged at **20**; the 17-solid / 3-dashed split is unchanged.

### 3.3 The graph

| | count | derivation |
|---|---|---|
| source nodes | **14** | `sources[]` in `app/data/portfolio/skills.ts` after the ANZ split (§3.2) |
| capability nodes | **16** | `capabilities[]` **minus** any row whose `sources` is empty |
| edges | **20** | `capabilities.flatMap((c,i) => c.sources.map(s => ({s, i})))` |
| total nodes | **30** | 14 + 16 |

`capabilities[16]` — *AWS and GCP certification · studying; no certificate issued* — has no source
and therefore **no node and no wire**. Grammar §2.4 is binding: *no evidence yet → no row, no node,
no wire*, and `Bench.tsx:33-37` already carries the reasoning (*"a line to nowhere would be exactly
the dishonesty the rest of the section is built to avoid"*). It is **not** dropped from the site: it
occupies the tag's `NOT TESTED` field with a full 260×52 px of area and an open caliper, and it keeps
its table row (TC-SKILL-04).

Node and edge counts are asserted by TC-TOPO-01. `SC-17` on the live site currently reads
*"20 links · 13 sources · 17 capabilities"* and is graded **TRUE**; it is generated from array
lengths (`Bench.tsx:425`), so it re-derives itself. The topology's readout rest state becomes
*"20 links · 14 sources · 16 capabilities on the board · 1 with no evidence yet"*, which is also
true. **Both changes go in the corrections ledger** — the capability count because grammar §2.4
removes the undrawable row from the board, and the source count because the CV prints two ANZ roles
where the registry printed one.

### 3.4 The radial recency axis — exact

Position is rank-1 on the channel ranking (grammar §2.1) and time is explicitly one of the things it
may encode. The axis is therefore **drawn, labelled, and never omitted** (§2.2).

- **Reference instant `T0`** = `manifest.modules.repositories.newestRetrievedAt` — the instant the
  repository module was last observed, not the build time. (§13.0 requires this field; the Wave-4
  artefact on disk carries it.) At the declared state of record for the worked reproduction below,
  `T0 = 2026-09-03T20:09:30Z`.
- **`daysSince(d) = max(1, (T0 − d) / 86_400_000)`.** The floor of 1 day is declared to the reader in
  the axis label (`≤ 1 DAY`) and in the takeaway; a repository pushed three hours ago is drawn on the
  1-day ring and its exact timestamp is printed on focus and in the table.
- **Calendar convention, stated because §3.5's radii cannot be reproduced without it.** Every
  calendar date resolves at `T00:00:00Z`. A **month**-precision period spans its first day to its
  last day; a **year**-precision period spans 1 January to 31 December.
- **Scale.** `r(d) = 150 + (log10(clamp(d, 1, 10_000)) / 4) × 280`, in `viewBox="0 0 1000 1000"`
  with `cx = cy = 500`. Log is permitted under grammar §2.2 because the domain spans **1 day →
  ~7,004 days ≈ 3.85 orders of magnitude**; the base is printed on the axis and the takeaway line
  says the scale is logarithmic. Both conditions are mandatory, not optional.
- **Where a `band` node sits — the rule revision 1 never stated.** A band node is drawn at
  `r(dmid)` where **`dmid = (daysSince(newest) + daysSince(oldest)) / 2`** — the arithmetic midpoint
  of the *day range*, not of the log range, not `dmin`, not `dmax`, not a geometric mean. Its
  precision arc spans `[r(daysSince(newest)), r(daysSince(oldest))]`. An implementer who cannot
  reproduce §3.5's arcs from this sentence has found a defect in this spec.

**Rings (the axis).** Five concentric `<circle>` gridlines, `fill:none`, `stroke: var(--ink-500)`,
`stroke-width: 1`, `stroke-opacity: 0.40`, `aria-hidden="true"`:

| decade | r | desktop label (mono 0.60rem `.14em` `--ink-300`, HTML, on the 12 o'clock radius) |
|---|---|---|
| 1 day | 150 | `≤ 1 DAY` |
| 10 days | 220 | `10 DAYS` |
| 100 days | 290 | `100 DAYS` |
| 1,000 days | 360 | `1,000 DAYS` |
| 10,000 days | 430 | `10,000 DAYS` |

The 10,000-day gridline is the **clamp bound of the scale** and is drawn whether or not anything sits
on it. At the state of record nothing does, and that is a true statement about the data, not a gap:
the oldest node is 7,004 days out. §8 traverses **occupied** rings only, so an empty decade is never
a dead keystroke.

Ring labels are **HTML**, in the labels layer (§3.9), not SVG `<text>` — §2.2's ruling applies to the
whole section and TC-TOPO-21 asserts zero `<text>` elements in either SVG.

A sixth, non-quantitative arc at **r = 462**, drawn as a dashed circle (`stroke-dasharray: 3 6` —
the Caliper's own dash pitch) with the 45° hatch band between r=452 and r=472 over the sector
θ ∈ [254°, 286°], labelled `UNDATED · the CV prints no date for this`. It is **outside** the scale
and visually separated by a 32 px gap so it can never be read as "very old".

**Precision arcs.** Every `band` node draws a 1 px arc, `stroke-opacity: 0.35`, spanning
`[r(daysSince(newest)), r(daysSince(oldest))]` along its own radius — a visible uncertainty extent,
not a hidden rounding. Thirteen nodes carry one.

### 3.5 The computed radii — a worked reproduction, not a constant table

`T0 = 2026-09-03T20:09:30Z` (`corpus-repositories.json.generatedAt`). Read reading rule 1 first: the
build recomputes all of this and will print different numbers.

**Source nodes.**

| source id | branch | evidence date(s) | field | days | r | ring | precision arc |
|---|---|---|---|---|---|---|---|
| `this-site` | instant | `2026-09-03T17:53:39Z` | `repositories.forgotten-mistory.pushedAt` | 1.00 (floored) | **150.00** | 1 | — |
| `aether` | instant | `2026-09-02T20:59:41Z` | `repositories.aether-job-career-agent.pushedAt` | 1.00 (floored) | **150.00** | 1 | — |
| `abentertainment` | instant | `2026-08-06T06:57:44Z` | `repositories.abentertainment.pushedAt` | 28.55 | **251.89** | 2 | — |
| `ato` | band | `2026-06-12T17:30:37Z` … `2026-03-01` | `cv.roles.role-ato-2026` (ongoing) + CV `CreationDate` | 83.11 – 186.84 (mid 134.98) | **299.12** | 3 | 284.38 → 309.00 |
| `rectifier` | instant | `2026-03-30T13:34:15Z` | `repositories.containerised-birth-time-rectifier.pushedAt` | 157.27 | **303.77** | 3 | — |
| `independent` | band | `2026-02-28` … `2026-02-01` | `cv.roles.role-independent-2025.end` (`2026-02`, month) | 187.84 – 214.84 (mid 201.34) | **311.28** | 3 | 309.17 → 313.25 |
| `anz-sdl` | band | `2025-06-30` … `2025-06-01` | `cv.roles.role-anz-sdl-2017.end` (`2025-06`, month) | 430.84 – 459.84 (mid 445.34) | **335.41** | 3 | 334.40 → 336.38 |
| `public-key-server` | instant | `2025-05-02T00:23:12Z` | `repositories.public-key-server.pushedAt` | 489.82 | **338.30** | 3 | — |
| `timeline` | instant | `2025-04-13T20:42:05Z` | `repositories.relationship-timeline-feature.pushedAt` | 507.98 | **339.41** | 3 | — |
| `jira-dashboard` | instant | `2024-12-04T02:01:07Z` | `repositories.EFDDH-Jira-Analytics-Dashboard.pushedAt` | 638.76 | **346.37** | 3 | — |
| `anz-arch` | band | `2022-12-31` … `2022-01-01` | `cv.roles.role-anz-arch-2017.end` (`2022`, year) | 1342.84 – 1706.84 (mid 1524.84) | **372.83** | 4 | 368.96 → 376.25 |
| `monash` | band | `2010-12-31` … `2010-01-01` | `cv.education.edu-monash-2010.date` (`2010`, year) | 5725.84 – 6089.84 (mid 5907.84) | **414.00** | 4 | 413.05 → 414.92 |
| `unimelb` | band | `2007-12-31` … `2007-01-01` | `cv.education.edu-unimelb-2007.date` (`2007`, year) | 6821.84 – 7185.84 (mid 7003.84) | **419.17** | 4 | 418.37 → 419.95 |
| `scrum-alliance` | not-observable | — | `cv.certifications.cert-csm.date` | — | **undated arc, r = 462** | undated | — |

`scrum-alliance`'s reason is the corpus string verbatim: *"No award or expiry date is printed on the
CV for this certification."* `provedBy`: `pdftotext public/docs/Vik_Resume_Final.pdf - | sed -n
'/CERTIFICATIONS/,/$/p'`. It is corroborated by `corpus-cv.json`'s own `anom-cert-dates`.

**Capability nodes.** `r = min(r(source))` over its sources — *the ring of its freshest evidence* —
and the node inherits the `provenanceDate` (and therefore the precision arc and the caliper state) of
**that** source. This is a derivation; it is declared in the dossier and in the axis's `<desc>`.

| # | capability | via | r | ring | precision arc |
|---|---|---|---|---|---|
| 0 | Mainframe test automation | `ato` | 299.12 | 3 | 284.38 → 309.00 |
| 1 | Agile delivery at scale | `ato` | 299.12 | 3 | 284.38 → 309.00 |
| 2 | Real-time telemetry | `anz-sdl` | 335.41 | 3 | 334.40 → 336.38 |
| 3 | Cloud-native migration | `anz-arch` | **372.83** | 4 | 368.96 → 376.25 |
| 4 | Programme & portfolio | `anz-arch` | **372.83** | 4 | 368.96 → 376.25 |
| 5 | Multi-agent systems | `aether` | 150.00 | 1 | — |
| 6 | LLM eval & guardrails | `aether` | 150.00 | 1 | — |
| 7 | Next.js & TypeScript | `aether` | 150.00 | 1 | — |
| 8 | Node.js services | `public-key-server` | 338.30 | 3 | — |
| 9 | Containerised delivery | `aether` | 150.00 | 1 | — |
| 10 | Service orchestration | `rectifier` | 303.77 | 3 | — |
| 11 | WebGL & GLSL | `this-site` | 150.00 | 1 | — |
| 12 | Data visualisation | `timeline` | 339.41 | 3 | — |
| 13 | Certified Scrum Master | `scrum-alliance` | undated arc, r = 462 | undated | — |
| 14 | MSc Computer Science | `monash` | 414.00 | 4 | 413.05 → 414.92 |
| 15 | BE Computer Science | `unimelb` | 419.17 | 4 | 418.37 → 419.95 |

**Ring occupancy at the state of record:** ring 1 → 7 nodes (2 sources, 5 capabilities); ring 2 → 1;
ring 3 → 13; ring 4 → 7; ring 5 → **0**; undated → 2. Total 30.

**Ring index derivation** — specified, because revision 1 typed it and never defined it:

```
ringIndex(d) = clamp(1 + floor(log10(clamp(d, 1, 10_000))), 1, 5)   // 'undated' for not-observable
```

`layout.occupiedRings` is emitted by the build script as the ascending list of ring indices that
actually contain at least one node, followed by `'undated'` if the rail is occupied. At the state of
record: `[1, 2, 3, 4, 'undated']`. §8 traverses that list, so ring 5 costs no keystroke and a future
node past 10,000 days appears in traversal with no code change.

**Seven nodes share the one-day ring, and every one of them is a repository or backed by one.** That
is the finding, and after §3.2's fix it is a finding the picture actually demonstrates: the
programmes — the largest, longest and most senior parts of the career — sit between 135 and 1,525
days out, because nothing published attests them any more recently than the CV does.

### 3.6 Node encoding — exactly two channels, and neither is size

**Channel 1 · radius** — recency, above.
**Channel 2 · terminal form** — the calibration state of the node's date, drawn as *texture and
terminal form, never intensity and never size* (grammar §2.3).

Source nodes (`data-caliper` derived per §4.1):

| caliper | glyph | drawn as | element |
|---|---|---|---|
| `sourced` | ▣ | **9 px** square, `stroke: var(--mist-200)`, `stroke-width: 1.25`, `fill: none`, plus a 4 px tick on the outward radius | `<a href={htmlUrl}>` |
| `self-reported` | ▢ | **9 px** square, `stroke: var(--mist-400)`, `stroke-width: 1`, `fill: none` | `<button>` |
| `open` | ⌐ | **9 px** square with **only three sides drawn**, `stroke-dasharray: 3 6`, over the 45° hatch | `<button>` |

Capability nodes carry the three `statusLegend` marks, **all at one diameter**:

| status | glyph | drawn as |
|---|---|---|
| `production` | ● | **6 px** disc, `fill: var(--mist-200)`, no stroke |
| `non-production` | ◐ | **6 px** disc, `fill: none`, 1 px `var(--mist-400)` stroke, with a half-disc `<path>` of the same 6 px diameter filled `var(--mist-200)` |
| `pending` | ○ | **6 px** disc, `fill: none`, 1 px `var(--ink-300)` stroke |

Revision 1 specified 6.4 px for `production` and 5.4 px for the others while asserting *"no node size
channel"* in the same table. **That was a size channel varying with an evidence claim, and it is
removed.** Every capability glyph is 6 px; every source glyph is 9 px; the 9-vs-6 difference encodes
`kind`, which is nominal, not quantitative. TC-TOPO-18 is rewritten to attack this rather than
permit it: **exactly one** distinct computed glyph size per `data-kind`.

Nothing else varies. No fill ramp, no opacity ramp, no ordering by quality.

### 3.7 Edge encoding

- Geometry: quadratic Bézier `M ax ay Q qx qy bx by`, where `q` is the chord midpoint pulled toward
  the centre by 18 % of the chord length:
  `qx = mx + (500 − mx) × 0.18`, `qy = my + (500 − my) × 0.18`. The wires then read as belonging to
  the polar frame instead of cutting across it.
- Stroke: `var(--mist-400)`, `stroke-width: 1`, `stroke-opacity: 0.42`, `stroke-linecap: round`,
  `fill: none`. **No gradient, no gold, ever.**
- Texture = the capability's `status`: `production` → solid; `non-production` →
  `stroke-dasharray: 4 3`. Exactly **17 solid** and **3 dashed** (capability 6 contributes two dashed
  edges, capability 10 one), preserving the split TC-BENCH-02 asserted.
- Lit state: `stroke-opacity: 1`, `stroke-width: 1.4`. Dimmed complement: `stroke-opacity: 0.10`.
  Nothing disappears — grammar §3.2 clause 3 is absolute: **no datum may exist only inside an
  interaction.**

### 3.8 The tether

One `<path id="tag-tether">` in the desktop topology SVG continues the tag's wire from the tag's
bottom edge to the **specimen source node** (§2.4), entering the frame at `(178, 0)` in topology
coordinates: `M 178 0 C 178 60, 420 90, {nx} {ny}`. Stroke `var(--mist-400)`, 1 px,
`stroke-opacity: 0.45`, `stroke-dasharray: none`, `aria-hidden`. It is **not** in the mobile SVG (the
tag stacks above the diagram with no room for a tether); its job there is done by the shared label.

### 3.9 Labels

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
- The five ring labels and the undated label live in this same layer, so they scale-position with
  the focus-zoom (§7) and stay labelled.
- The container reserves `padding: 0 clamp(4rem, 11vw, 9rem)` so labels overflow the 1000×1000 SVG
  into real space rather than being clipped.

---

## 4 · What the caliper grades, and why nothing is graded above its evidence

The caliper's `sourced` state — *"Measured; source given."* — renders **nowhere** on the live site
today (C-3, re-verified in §1.1). Revision 1 tried to fix that by grading each capability's **claim**,
and needed an editorial judgement per row to do it — *"both artefacts open and run"* — which
`selectors.ts` cannot compute and which graded three prose claims at the highest grade. That is
exactly the failure R-166 exists to prevent, and it is removed.

### 4.1 The rule, made mechanical by moving it onto the date

**The topology encodes exactly one quantity: a date.** So the caliper on a node grades **that date**,
and nothing else. This is not a softening — it is the only grading the diagram is entitled to make,
because a date is the only thing it draws.

```
caliper(node) =
  node.provenanceDate.kind === 'not-observable'                      -> 'open'
  node.provenanceDate.provenance.source === 'github-rest'
    && repositories[repo].visibility === 'public'
    && repositories[repo].htmlUrl !== null
    && harvest recorded HTTP 200 unauthenticated for that htmlUrl    -> 'sourced'
  otherwise (source === 'cv-pdf')                                    -> 'self-reported'

caliper(capability) = caliper(the source that set its radius)        // §3.5
```

Every clause is a field lookup or a boolean already in the dataset. There is no list to hard-code,
no prose to adjudicate, and no row an implementer has to think about. `selectSkillsTopology()`
computes it; `dataset_integrity` fails the build if any node's caliper differs from the value this
expression returns.

**Why `cv-pdf` is `self-reported` and not `sourced`.** The CV is downloadable from this site, so a
reader *can* open it — but it is his own document with no published methodology behind it, which is
the site's shipped definition of `self-reported` (`CLAUDE.md`, prime directive 3). Grading it
`sourced` would make the word mean "he wrote it down", which is the meaning the whole card exists to
refuse.

**What the reader is told, in three places, so the grade cannot be misread as a proficiency.**

1. The tag's `EVIDENCE CLASS` gloss lines (§2.3) say the caliper grades the **date**.
2. `#topo-desc` (§10) says it in the sentence a screen-reader user hears first.
3. Every node's `aria-label` ends with the phrase *"— this grades the date, not the claim."*

### 4.2 The result

| | `sourced` | `self-reported` | `open` |
|---|---|---|---|
| **sources (14)** | 7 — `this-site`, `aether`, `abentertainment`, `rectifier`, `public-key-server`, `timeline`, `jira-dashboard` | 6 — `ato`, `anz-arch`, `anz-sdl`, `independent`, `monash`, `unimelb` | 1 — `scrum-alliance` |
| **capabilities (17)** | 8 — 5, 6, 7, 8, 9, 10, 11, 12 | 7 — 0, 1, 2, 3, 4, 14, 15 | 2 — 13 (date undated) and 16 (no evidence, no node) |

Sixteen capabilities are drawn as nodes; the seventeenth (16, `open`) is counted here, rendered in
the tag's `NOT TESTED` field and kept in the table. These are the counts `EVIDENCE CLASS` prints and
TC-TOPO-04 asserts — and TC-TOPO-04 asserts them **against `selectCalibrationCounts()`'s own output**,
not against literals, so the test cannot drift from the data (revision 1's TC-TOPO-04 asserted a
literal `6` that its own §16 said was unreachable).

### 4.3 Two evidence-cell corrections that are still required

Neither is a grading dependency any more. Both are honesty defects in the shipped copy, and both are
fixed by this spec with no new dataset field.

**(a) `capabilities[8].evidence` — the word "full".** It reads *"PEM key-distribution service · full
Mocha/Chai coverage"*. **"full" is a judgement, not a figure.** The CV's own bullet says
*"achieving 100% test coverage (Mocha/Chai)"*. The cell becomes the CV's own words, and the existing
`caveat` mechanism carries the limit:

```ts
evidence: 'PEM key-distribution service · 100% test coverage (Mocha/Chai)',
caveat: 'the coverage figure is the CV’s; the repository publishes no coverage report',
```

Revision 1 made this depend on `repositories.public-key-server.testFileCount`, a field that does not
exist in the canonical dataset — and then wrote a test asserting a count its own §16 said was
unreachable. **That dependency is deleted.** No implementer may ship the word "full" as evidence.

**(b) `capabilities[5].evidence` — "live on a VPS".** It reads *"20 agent engines · 22 routers ·
4,272 backend tests · live on a VPS"*. The first three clauses are counts; the fourth is a state no
unauthenticated reader can observe. It splits:

```ts
evidence: '20 agent engines · 22 routers · 4,272 backend tests',
caveat: 'it also runs on a VPS; that is not observable from outside',
```

Both changes are tone/R-166 obligations, not grading obligations, so **neither blocks the build** and
neither is gated on Wave 4.

### 4.4 The selectors

```ts
selectSkillsTopology(): TopologyLayout          // reads the generated layout JSON, validates the hash
selectCalibrationCounts(): {                    // drives EVIDENCE CLASS; never authored
  sourced: { sources: number; capabilities: number };
  selfReported: { sources: number; capabilities: number };
  open: { sources: number; capabilities: number };
}
selectTagSpecimen(): { capability: string; method: string; takenAt: Field<Iso8601>;
                       htmlUrl: string; kind: SourceKind }   // §2.4's argmax
```

### 4.5 Which do **not** qualify, and why that is the point

Seven capabilities and six sources are `self-reported`, and the topology says so in a mark the reader
already learned on the tag. Three of the six programme/credential sources — `ato`, `anz-arch`,
`anz-sdl` — are the largest, longest and most senior parts of the career, and **none of them is
checkable by a stranger.** After §3.2's fix the board does not hide that and cannot accidentally
contradict it: the one-day ring is exclusively repositories and repository-backed capabilities, ATO
sits at 135 days with a 104-day-wide uncertainty band because the CV prints no end date for it, ANZ's
architect work sits four years out where the CV puts it, and the outermost occupied ring holds two
degrees from 2007 and 2010 drawn with year-precision arcs. That asymmetry is the argument. Equalising
it would destroy the only fact the diagram contains.

**Nothing was manufactured.** LinkedIn remains not observable (HTTP 999 login gate); no credential
verification URL is claimed for Scrum Alliance, Monash or the University of Melbourne, because none
appears on the CV of record.

---

## 5 · The force simulation — exact, and it never runs in the browser

### 5.1 Where it runs

`scripts/dataset/skills_topology_layout.mjs`, invoked by `scripts/dataset/build_dataset.mjs` **after**
the `repositories` and `cv` modules refresh, writing
`app/data/canonical/generated/skills-topology-layout.v1.json`.

The browser runs **zero simulation**. It imports fixed coordinates. This is how the layout is
guaranteed stable across reloads, identical for every visitor, and incapable of causing CLS: there is
nothing to converge, nothing to measure, and nothing to re-lay-out. `d3-force@3.0.0` and
`d3-scale@4.0.2` are added to **`devDependencies` only**; the runtime bundle delta is the JSON
(≈ 8.4 KB raw / ≈ 2.4 KB gzip, both layouts) plus the component.

**The script refuses to run** — non-zero exit, no output file — if any node lacks a `provenanceDate`
(§3.2), if any `band` node lacks both ends, or if `T0` is absent from the manifest. It never
substitutes the build time for a missing date.

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

1. Nodes are built in a **fixed order**: the 14 sources in registry order, then the 16 capabilities in
   `capabilities[]` order. Node `index` is therefore stable.
2. Every node is seeded on its own ring at the golden angle:
   `θᵢ = i × 2.399963229728653`, `x = 500 + r·cos θᵢ`, `y = 500 + r·sin θᵢ`, `vx = vy = 0`.
   d3-force's default phyllotaxis initialiser is **bypassed** by pre-setting `x`/`y`.
3. `simulation.randomSource(mulberry32(SEED))` — d3-force v3's documented determinism hook. With
   seeded positions *and* a seeded source, the run has no entropy at all.
4. The simulation is **never started**: `forceSimulation(nodes).stop()`, then a manual tick loop.

### 5.3 The forces, and the clamp that is not a force

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
  .stop();

// The clamp is a POST-TICK projection, not a registered force.
for (let i = 0; i < 600; i += 1) {
  sim.tick();
  clampToRings(nodes);
}
```

```js
function clampToRings(nodes) {
  for (const n of nodes) {
    const dx = n.x - 500;
    const dy = n.y - 500;
    const len = Math.hypot(dx, dy) || 1e-6;
    const ux = dx / len;
    const uy = dy / len;
    n.x = 500 + ux * n.r;          // exact: |(x,y) - centre| === n.r
    n.y = 500 + uy * n.r;
    const vr = n.vx * ux + n.vy * uy;   // the radial component of velocity
    n.vx -= vr * ux;                    // discarded; only the tangential part survives
    n.vy -= vr * uy;
  }
}
```

**Two corrections to revision 1, both load-bearing.**

1. It registered the clamp with `.force('ring', radialClamp)` where `radialClamp` was written as
   `function radialClamp(nodes) { return () => {…} }`. d3-force invokes a force as `force(alpha)` and
   only calls `force.initialize(nodes, random)` when that method exists. So d3 would have called
   `radialClamp(alpha)`, received a closure, and **discarded it — the clamp would never have run.**
2. Even correctly shaped, a force cannot deliver the guarantee. `simulation.tick()` applies every
   force and **then** integrates `node.x += node.vx *= velocityDecay`; a clamp inside the force phase
   is undone by the same tick before anyone reads the coordinate. The clamp must therefore run
   **after** `tick()` returns, which is what the loop above does. Because the loop's final operation
   is a clamp, the coordinates that are written out are exact.

**This is the honesty mechanism.** `forceRadial` only *pulls toward* a radius; a node would settle
near its ring, and "near" is a fabricated position. The post-tick projection makes the radial channel
**exact** — every node's distance from the centre is the data, to floating point, before rounding.
The simulation is therefore only ever arranging **angle**, which encodes nothing and is free to be
arranged for legibility. `forceCenter` is **not** used (the clamp owns the centre) and
`forceX`/`forceY` are **not** used.

**No `alphaTarget` reheat exists anywhere**, because there is no drag interaction. Nodes are not
draggable: dragging a node would move it off its ring, which would make the picture lie.

### 5.4 Output

- Coordinates rounded with `Math.round(v * 100) / 100`. Rounding two coordinates to 2 dp perturbs the
  radius by at most `√2 × 0.005 ≈ 0.0071 px`, which is why TC-TOPO-03's tolerance is **± 0.05 px**
  and not revision 1's ± 0.5 px. A half-pixel tolerance would have passed a clamp that never ran.
- The file records
  `{ schemaVersion: 1, generatedFrom: { datasetHash, t0 }, seed: 0x5EED, ticks: 600,
     viewBox: [0,0,1000,1000], mobileViewBox: [0,0,390,820], centre: [500,500],
     rings: [...], occupiedRings: [...], nodes, edges }`
  with desktop and mobile coordinates on the same node objects (§13's `TopologyNode`).
- `build_dataset.mjs` fails the build if `generatedFrom.datasetHash` ≠ the current dataset hash — a
  stale layout can never ship, and recency can never silently freeze.
- `scripts/dataset/skills_topology_layout.mjs --check` re-runs the simulation and byte-compares the
  output. It is added to the `quality` CI job. Two runs that differ is a determinism regression and
  fails the build.

---

## 6 · Mobile at 390 px — the wires survive, with a mechanism

The current Bench sets `.wires { display: none }` below 900 px and renders two lists. **That is a
straight R-52 failure**: the diagram's entire content is the wires, and the mobile reader gets none
of them.

The topology does not fall back. It **unrolls the same polar frame into a Cartesian one**: the same
logarithmic recency scale, the same 30 nodes, the same 20 wires, the same terminal forms.

### 6.0 The switch — both layouts ship; CSS chooses

Revision 1 said *"below 900 px the component renders `layout.mobile`"* and never said how, while
requiring (TC-TOPO-15) that 20 wires be present in the **served HTML with JavaScript disabled**. A
static export cannot choose a `viewBox` without JavaScript, and a post-hydration swap would
contradict the CLS-0 claim. The mechanism is therefore stated and it is the boring one:

```html
<div class="stage" data-layout="desktop"> <svg viewBox="0 0 1000 1000">…</svg> <div class="labels">…</div> </div>
<div class="stage" data-layout="mobile">  <svg viewBox="0 0 390 820">…</svg>  <div class="labels">…</div> </div>
```

```css
[data-layout="mobile"]  { display: none; }
@media (max-width: 900px) {
  [data-layout="desktop"] { display: none; }
  [data-layout="mobile"]  { display: block; }
}
```

- **Both layouts are in the served HTML**, so TC-TOPO-15 passes at either width with JavaScript off.
- **`display: none` removes the hidden layout from the accessibility tree and from the tab order**,
  so there is exactly one focusable node per datum at any width. This is the reason the switch is
  `display` and not `visibility` or `opacity`.
- The media query resolves **before first paint**, so the switch contributes nothing to CLS and there
  is no hydration swap.
- Cost: the DOM carries ~230 elements of which ~115 are ever rendered, and the layout JSON carries
  both coordinate sets (≈ 2.4 KB gzip total). §12 is updated to the honest figure rather than the
  single-layout one.
- The keyboard hook and the pointer handlers bind to `[data-layout]:not([hidden])` resolved by
  `matchMedia('(max-width: 900px)')` — the *only* runtime use of `matchMedia` in the component, and
  it is torn down on unmount.

### 6.1 The projection (precomputed in the same build script)

- `viewBox="0 0 390 820"`, `aspect-ratio: 39/82`, `width: 100%`.
- **y = the same scale**: `y(d) = 56 + (log10(clamp(d, 1, 10_000)) / 4) × 620`.
  Gridlines become horizontal 1 px rules at `y = 56, 211, 366, 521, 676`, carrying the **identical**
  labels (`≤ 1 DAY`, `10 DAYS`, `100 DAYS`, `1,000 DAYS`, `10,000 DAYS`), right-aligned in a 64 px
  gutter, `var(--ink-500)` at `stroke-opacity: 0.40`.
  The undated rail is a dashed rule at `y = 744` with the same hatch band and the same label.
- Precision bands become vertical 1 px extents on the node's own x, spanning
  `[y(daysSince(newest)), y(daysSince(oldest))]` — e.g. `ato` 353.5 → 408.1, `anz-arch` 540.8 → 557.0.
- **x = kind**: sources anchor at `x = 150` (labels flow left from `x = 142`, right-aligned);
  capabilities anchor at `x = 240` (labels flow right from `x = 248`).
- Wires: cubic with horizontal tangents, `M 150 ay C 194 ay, 196 by, 240 by`. Same stroke, same
  texture rule, same lit/dim behaviour.

### 6.2 Label dodging — and it is drawn, not hidden

Per column, at build time: sort by true `y` ascending, then a forward pass and a backward pass
enforcing a **minimum 30 px gap** (the standard monotone two-pass dodge), clamped to `[44, 776]`.
Where `|dodgedY − trueY| > 2`, a **1 px leader** is drawn from the node's true position on the axis
to its dodged label, `var(--ink-500)`, `stroke-opacity: 0.5`. The displacement is therefore visible
rather than concealed — the reader can always see where the datum really sits.

14 sources need 420 px of the 732 px available; 16 capabilities need 480 px. Both fit without
compression, so no label is ever dropped.

---

## 7 · Interaction — R-97's four depths

| R-97 depth | Implementation |
|---|---|
| **hover reveal** | Pointer or focus over any node sets `active`; its wires and connected nodes go to full opacity, the complement drops to `stroke-opacity: 0.10` / `opacity: 0.30`. The readout beneath fills with that node's evidence, its formatted date and precision, its caliper gloss, its `statusLegend` label and its provenance method. Nothing appears that was not already legible. |
| **focus and zoom** | See §7.1 — a **fixed-factor** magnification applied identically to the SVG and the label layer. |
| **filtering / drill-down** | Pinning a node (`Enter` on a capability, or click) sets the record table's filter to `traced`, hides non-matching rows via the existing `hidden` mechanism inside the existing fixed-height wrapper, and updates the existing `role="status"` count line to `N of 17 capabilities shown · traced from {label}`. The existing `Everything` button clears it. The traced row's accent is `var(--mist-400)`, **not gold** (§1). TC-SKILL-06 and TC-SKILL-07 keep passing. |
| **one curiosity-rewarding state** | **The undated rail.** Arrowing outward past the last occupied ring — or activating the axis's undated label — moves focus to the two nodes on the dashed arc and reveals the line *"We looked. The CV prints no date for this certification, so it is not on the scale."* It is the only place on the board where the reader discovers something the site could not measure, and it is a reward rather than a gap. |

### 7.1 Focus-and-zoom — one factor, no measurement, labels come with it

Revision 1 interpolated the SVG `viewBox` to a per-node bounding box. That is architecturally
impossible here: node glyphs live in the `aria-hidden` SVG while **every focusable node, every label
and every focus ring is HTML absolutely positioned by percentage** (§3.9, §9). Animating the viewBox
would have moved the glyphs and left every label and every focus ring behind, and a per-node zoom
factor would have scaled the type off the locked five-step ramp.

The zoom is therefore a **CSS transform applied identically to both layers of the active stage**,
with a **single global factor**:

```css
.stage > svg,
.stage > .labels {
  transform-origin: 0 0;
  transform: translate(var(--zx, 0%), var(--zy, 0%)) scale(var(--zk, 1));
  transition: transform var(--motion-base) var(--motion-ease-emphasized);
}
.labels > * { transform: scale(calc(1 / var(--zk, 1))) /* …plus its §3.9 anchor translate… */; }
```

- **`--zk` takes exactly two values: `1` and `1.9`.** One factor, chosen once. Because the label
  children counter-scale by `1 / --zk`, rendered type is **exactly** its ramp value in both states —
  there is no intermediate size and no sixth step.
- `--zx` / `--zy` are **percentages precomputed at build time**, one pair per source node, emitted as
  `node.zoom = { zx, zy }`: the translation that centres that source's subtree bbox (inflated 12 %)
  in the frame at scale 1.9, clamped so the transformed board still covers the frame. No
  `getBoundingClientRect`, no `ResizeObserver`, no runtime geometry.
- The SVG and the labels div are the same box (`position: absolute; inset: 0`), so an identical CSS
  transform maps them identically. Glyphs, labels and focus rings move together by construction.
- `transform` does not affect layout, so **CLS stays 0.00**. `will-change: transform` is set on the
  two layers only while `--zk !== 1`.
- **Ring labels are HTML in the same layer**, so they scale-position with the zoom and stay labelled
  (§3.4). Zero SVG `<text>` exists to scale (TC-TOPO-21).
- `Escape` sets `--zk: 1`, `--zx: 0%`, `--zy: 0%`.
- Under `prefers-reduced-motion: reduce` the transition duration becomes `1ms`: the reader still gets
  the magnification — it is a navigation aid, not decoration — without the travel.

**Nodes are not draggable.** Dragging would move a node off its ring and the position would stop
being the data.

---

## 8 · The keyboard model (R-101 §9.1) — complete

- **Tab order follows data order, not paint order.** The section's tab sequence is:
  tag `RESULT` link → tag `NOT TESTED` caliper (`tabindex="-1"`, not a stop) → the topology group
  (one stop, roving `tabindex`) → the filter buttons → the table.
- The topology is **one tab stop**. Entry lands on the **first node in DOM order**, or on the
  last-focused node if the reader is returning.
- **DOM order of nodes = ring order (innermost occupied ring first); within a ring, ascending angle
  from 12 o'clock clockwise.** Screen-reader reading order therefore *is* the recency axis.
  Each node carries `data-ring-index` (`1…5`, or `6` for the undated rail) and `data-theta`.
- **Traversal uses `layout.occupiedRings`**, not the decade list. At the state of record that is
  `[1, 2, 3, 4, 'undated']`; ring 5 is empty and is never a dead keystroke. A future node past
  10,000 days joins traversal with no code change.

| Key | Action |
|---|---|
| `ArrowRight` / `ArrowLeft` | next / previous node **within the current occupied ring**, wrapping |
| `ArrowDown` | nearest node by angle on the **next occupied ring outward** (older); from the outermost occupied ring → the undated rail |
| `ArrowUp` | nearest node by angle on the **next occupied ring inward** (newer); from the innermost occupied ring → no move (no wrap, so the reader can feel the edge) |
| `Home` / `End` | first node on the innermost occupied ring / last node on the undated rail |
| `Enter` / `Space` | on a source: focus-and-zoom to its subtree (§7.1). On a capability: pin + drill down to the table |
| `Escape` | unpin, reset the zoom, clear the trace, keep focus on the current node |
| `Shift`+`Tab` from the first node | leaves the group upward — **no trap** |

Every `sourced` source node is an `<a href>`, so `Enter` on it in a screen reader's browse mode
follows the link, and `Space` zooms. No single-letter shortcuts are bound (they collide with AT
navigation). Focus ring: `outline: 2px solid var(--white); outline-offset: 3px` — the shipped
`Bench.module.css:181-184` treatment, kept, and it lives in the label layer so it follows the zoom.

---

## 9 · ARIA structure (R-101 §9.2)

```html
<figure data-viz-id="skills.calibration-topology" aria-labelledby="topo-title" aria-describedby="topo-desc">
  <h3 id="topo-title" class="visually-hidden">Every capability, placed by when its evidence was last attested</h3>
  <p id="topo-desc" class="topoDesc">…the insight sentence (§10)…</p>

  <div class="stage" data-layout="desktop">
    <svg aria-hidden="true" focusable="false" viewBox="0 0 1000 1000"> …rings, wires, glyphs, arcs… </svg>

    <div class="labels" role="group"
         aria-label="30 nodes on a logarithmic recency axis. Use arrow keys to move between them.">
      <a  href="https://github.com/Victordtesla24/forgotten-mistory" tabindex="0"
          data-kind="source" data-caliper="sourced" data-ring-index="1" data-theta="0.00"
          data-r="150.00" data-source-id="repositories.forgotten-mistory.pushedAt"
          data-retrieved-at="2026-09-03T20:09:30Z"
          aria-label="this site, a public repository. Last touched 3 September 2026.
                      Measured; source given — this grades the date, not the claim.
                      Carries 1 capability."
          aria-describedby="topo-n-this-site-links">…</a>
      <span id="topo-n-this-site-links" class="visually-hidden">Wired to: WebGL and GLSL.</span>
      …
    </div>
  </div>

  <div class="stage" data-layout="mobile"> …the same 30 nodes and 20 wires, Cartesian… </div>

  <p class="readout" data-testid="topo-readout"> …not a live region… </p>
</figure>
```

- The SVG is `aria-hidden` in its entirety: rings, gridlines, hatches, arcs and wires are atmosphere
  and structure, and every datum they carry is on a real focusable element or in the table
  (`Experience.tsx:79,136` precedent).
- Only one `.stage` is in the accessibility tree at a time; the other is `display: none` (§6.0).
- Every node's accessible name carries **its value and its units** — the formatted date, the
  precision if it is a band, the caliper gloss with the *"grades the date, not the claim"* qualifier,
  the `statusLegend` label for capability nodes, and the count of what it is wired to.
- A `band` node's label states the band: *"…dated between March 2026 and 12 June 2026, because the
  CV prints no end date for this role."* An ANZ node's label additionally carries `anom-anz-overlap`
  verbatim.
- The `.readout` is **not** a live region (the Bench's ruling, preserved: it changes on every hover
  and would make the section unusable). The evidence is on each node's own label, spoken once on
  focus.
- The **only** polite live region in the section is the existing `role="status"` filter-count line —
  a change the reader asked for.
- `<Caliper>` continues to announce its state via its `.gloss` span. The three glosses are unchanged.

---

## 10 · The dual read (R-99) and the text alternative (R-101 §9.3)

**3-second headline.** A tight cluster at the centre, a sparse rim, and one gold field on a tag above
it. *Everything he can show you is a repository touched this week; everything else is a year or more
back, and the CV is the only thing that says so.*

**30-second detail.** Five labelled rings on a base-10 scale, 30 nodes carrying three terminal forms,
20 wires joining capabilities to the programmes, repositories and issuing bodies their evidence came
from, seven of which are links you can open, and one uncertainty arc for every date the CV states
only to the month, only to the year, or not at all.

**Takeaway line** (authored prose, ≤ 20 words, printed with the artefact):

> *Everything I can prove is a week old. Everything I can only tell you about is months or years back.*

**Insight-equivalent text alternative.** The record table, unhidden, immediately beneath, with three
new columns:

| existing | new |
|---|---|
| Capability · Evidence · Where · Status | **Last touched** (formatted date or band + `<Caliper>` + the precision note) · **Openable** (the `htmlUrl` as a real link, or the reason there is none, verbatim) · **Shares a source with** (the capability names it is adjacent to) |

Every `<Caliper>` in the *Last touched* column renders ungated — closed jaws in `--mist-200` for
`sourced` (§1.1). None of them is gold.

Plus `#topo-desc`, rendered visibly above the diagram, which is the sentence a reader who never sees
the picture needs in order to reach the same conclusion the takeaway states:

> *Sixteen capabilities are placed on a logarithmic axis by when the dated evidence behind them was
> last attested — the caliper beside each one grades that date, never the capability. Five sit on the
> one-day ring because the repositories behind them were pushed this week; one sits at five months for
> the same reason. Two sit at about four and a half months with a wide uncertainty band, because they
> come from a role that is still running and the CV prints no end date for it, so the freshest thing
> that attests them is the date the CV itself was written. Three sit between fourteen and seventeen
> months out — one because the employer that measured it was left in June 2025, two because their
> repositories have not been touched since spring 2025. Two sit at about four years,
> where the CV dates the ANZ architecture role that carries their figures. Two sit at the rim because
> they are degrees from 2010 and 2007. One is off the scale entirely, because the CV prints no date
> for that certification at all.*

That is a sentence naming the shape, the extremes, the causes and the comparison — not "a chart of
skills", and not a bare table offered as the equivalent of a topology (grammar §9.3 prohibits both).
Every clause in it is derived from §3.5 and is regenerated with the layout, so it cannot drift from
the drawing (TC-TOPO-22).

---

## 11 · Motion, and the reduced-motion composition (R-101 §9.4)

All tokens from `design-system-lock.md` §4.2. **No new token is invented by this spec** — but three
of the tokens it uses (`--motion-emphatic: 440ms`, `--motion-cine-in: 720ms`, `--stagger-tight: 60ms`)
are **introduced by that lock and are not yet in `app/globals.css`** (verified: `globals.css` carries
`--motion-fast/base/slow` and two beziers only). This spec therefore **depends on the
`design-system-lock.md` §4.2 token block landing first**; until it does, every call site uses the
CSS fallback form `var(--motion-emphatic, 440ms)`, `var(--motion-cine-in, 720ms)`,
`var(--stagger-tight, 60ms)` so the section is never broken by the ordering.
`--motion-ease-mechanical`, proposed by both research concepts, is **not** added:
`var(--motion-ease-emphasized)` (`cubic-bezier(0.16, 1, 0.3, 1)`, which does not overshoot) is
correct and already shipped.

**Entrance**, one-shot, on `IntersectionObserver` at `threshold: 0.15`, `observer.disconnect()` on
first hit (the `Bench.tsx:189-207` pattern, preserved), total **1,180 ms**:

| beat | window | what |
|---|---|---|
| 1 | 0 – 440 ms | the five rings draw, outermost first, `stroke-dashoffset: 1 → 0` with `pathLength="1"`, `var(--motion-emphatic, 440ms)` `var(--motion-ease-emphasized)`, stagger `var(--stagger-tight, 60ms)` |
| 2 | 320 – 900 ms | the 20 wires trace, `stroke-dashoffset: 1 → 0`, `var(--motion-cine-in, 720ms)`, stagger 24 ms in **ring order, innermost first** |
| 3 | 760 – 1,180 ms | node glyphs, precision arcs and labels fade `opacity: 0 → 1`, `var(--motion-base)`, stagger `var(--stagger-tight, 60ms)` |

A `settled` flag is set at 1,240 ms and sets `animation: none` on every animated element, so a
resize, a re-render or a font swap can never replay the entrance (the Bench's hard-won lesson,
preserved). **Final values render on first paint** — the animation only fades opacity and traces
stroke offsets; no coordinate, count or date ever passes through a wrong intermediate value (R-175,
grammar §2.4).

**Reduced motion is a re-score, not a mute** (`design-system-lock.md` §4.3):

```css
@media (prefers-reduced-motion: reduce) {
  .ring, .wire, .glyph, .arc, .label { animation: none; }
  .figure[data-drawn] .label { animation: topoFade var(--motion-fast) linear both; }
  .figure[data-drawn] .label { animation-delay: calc(var(--i) * 40ms); }
  .wire { stroke-opacity: 0.30; }
  .wire[data-ring-index="1"] { stroke-opacity: 0.62; }
  .ring { stroke-opacity: 0.55; }
  .ringLabel { opacity: 1; }
  .stage > svg, .stage > .labels { transition-duration: 1ms; }   /* §7.1 */
}
```

The reduced composition is a **different arrangement of the same piece**: everything is at its final
position on first paint; the labels still arrive in order with a 40 ms stagger, losing only travel;
the ring labels, which fade in under motion, are simply always present; and the wires are graded so
the innermost ring reads first. It is a still that holds — a printed plate rather than a stopped
film. Colour and border transitions survive at `var(--motion-fast)` per §4.3 clause 3, and the
focus-zoom still magnifies, instantly.

**Degraded states** (grammar §9.5), all three designed:
- **JavaScript failed** — the entire figure is server-rendered markup from a static JSON, both
  layouts, with the CSS breakpoint choosing between them (§6.0). Rings, wires, glyphs, arcs, labels,
  readout rest state and the table all render. Only hover, zoom and keyboard traversal are lost.
  Nothing is measured at runtime, so there is nothing to fail.
- **No WebGL** — not applicable; render class is `svg`.
- **Data unavailable** — impossible at runtime (the layout is a build artefact). At *build* time a
  module refresh failure degrades to `retained` per `dataset-layer-design.md` §3.4, the `CERT` field
  prints the retained retrieval instant with its `RefreshOutcome`, and the readout says the dates are
  from the previous harvest rather than showing a fresh-looking stale board. A *missing*
  `provenanceDate` is not a degraded state: it fails the build (§5.1).

---

## 12 · Performance envelope (R-100)

| Budget | Target | How it is met |
|---|---|---|
| fps with everything active | ≥ 60 | ~230 SVG/HTML elements in the DOM, of which ~115 are ever rendered (the other layout is `display: none`, §6.0); only `stroke-opacity`, `opacity`, `stroke-width` and one compositor `transform` animate; no layout property is animated; no runtime simulation |
| lazy init | yes | one `IntersectionObserver`, `threshold: 0.15`, disconnected on first intersection |
| full disposal | yes | on unmount: `observer.disconnect()`, the one `matchMedia` listener removed, all pointer/key handlers React-managed. **Zero** `ResizeObserver`, zero `requestAnimationFrame` loop, zero timers after `settled` |
| memory ceiling | **≤ 3 MB** JS heap delta while mounted | declared in the dossier; measured by `tests/perf/viz_perf.spec.ts` (**created** by this spec, §13) |
| CLS contribution | **0.00** | both SVGs have a fixed `aspect-ratio`; labels are absolutely positioned from precomputed percentages; the mobile switch is a media query resolved before first paint; the zoom is a `transform`, which does not affect layout; nothing is measured, so nothing reflows after paint |
| LCP | unaffected | the section is below the fold; the tag is HTML text with no image |
| runtime bundle delta | ≈ 2.4 KB gzip JSON (both layouts) + ≈ 3.6 KB gzip component | `d3-force` and `d3-scale` are `devDependencies`; **a runtime `d3` import is a build failure** (ESLint `no-restricted-imports`) |

---

## 13 · Files

### 13.0 Prerequisite — what this spec requires of the canonical dataset layer

Revision 1 listed six things under **Change** that **do not exist in `main`**, verified:
`app/data/canonical/` (no directory), `scripts/dataset/` (no directory),
`scripts/validate/dataset_integrity.mjs`, `tests/perf/viz_perf.spec.ts`,
`public/dataset-provenance.json`, and `d3-force` / `d3-scale` in `package.json`. Its claim that
*"`dataset_integrity.mjs` clause 5 already asserts one gold mark"* asserted a clause of a file that
is not there.

`SPEC-telemetry-and-data.md` (Wave 4) is building that layer now in the `wt/data-backend` worktree.
**This spec is a dependent of it and does not start until it merges.** What was observed in that
worktree at the time of writing — `app/data/canonical/{provenance.ts, envelope.ts, assert.ts,
schema/{cv,repositories,channel,delivery,linkedin}.ts, generated/*.v1.json}`,
`scripts/dataset/build_dataset.mjs`, `public/dataset-provenance.json`,
`scripts/validate/dataset_canonical_contract.mjs` — is **evidence that the layer is real, not a
promise about its shape.** The requirements below are stated as a contract; anything unmet on merge
day is **created by this spec** and moves from *Requires* to *Create*.

| # | Requirement | Status observed in `wt/data-backend` |
|---|---|---|
| R-a | `repositories` module carries, per repository, `pushedAt` as a `Sourced<Iso8601>` with a runnable `Provenance.method` | **met** (`GET /repos/{owner}/{repo} -> .pushed_at`) |
| R-b | `repositories` module carries `htmlUrl` and `visibility` per repository, and records the unauthenticated HTTP status observed for `htmlUrl` at harvest | **not met** — both fields absent. This spec adds them to the repositories schema and harvester, moving the HTTP-200 check to harvest time where §4.1 needs it (and out of the Playwright suite, F-14) |
| R-c | the seven repositories this section cites are all in the module | **not met** — the module carries 6 repositories, only 3 of which are cited here. This spec extends the harvest list to include `public-key-server`, `containerised-birth-time-rectifier`, `relationship-timeline-feature`, `EFDDH-Jira-Analytics-Dashboard`. All seven are `visibility: public` in `corpus-repositories.json` |
| R-d | `manifest.modules.repositories.newestRetrievedAt` exists — this is `T0` | **met** |
| R-e | `cv` module carries per-role `start`/`end` with `{ iso, precision }` including `precision: 'ongoing'`, per-education `date` with precision, and `cert-csm.date` as `NotObservable` with its reason | schema present; **this spec asserts the shape and fails the build if absent** |
| R-f | `cv` module carries the CV document's own `CreationDate` (`pdfinfo … -> CreationDate` → `2026-06-12T17:30:37Z`) as a `Sourced<Iso8601>` | **not met** — this spec adds it. §3.2 branch 3 cannot run without it |
| R-g | `public/dataset-provenance.json` maps every `data-source-id` to its `Provenance` | **met** |
| R-h | a build-time integrity validator exists | `scripts/validate/dataset_canonical_contract.mjs` is present. This spec **adds** `scripts/validate/dataset_integrity.mjs` with the view-level clauses (one `data-gold` per section; `data-gold` only on `[data-state="sourced"]`; every `data-source-id` resolves; every node caliper equals §4.1's expression) — it does **not** assume a pre-existing clause 5 |

### 13.1 Create

```
components/sections/Skills/CalibrationTag.tsx
components/sections/Skills/CalibrationTag.module.css
components/sections/Skills/Topology.tsx
components/sections/Skills/Topology.module.css
components/sections/Skills/useTopologyKeyboard.ts
app/data/canonical/selectors.ts                               (does not exist today)
app/data/canonical/dossiers.ts                                (does not exist today)
app/data/canonical/schema/topology.ts
app/data/canonical/generated/skills-topology-layout.v1.json   (generated)
scripts/dataset/skills_topology_layout.mjs
scripts/validate/dataset_integrity.mjs                        (does not exist today)
tests/e2e/skills-topology.spec.ts
tests/perf/viz_perf.spec.ts                                   (does not exist today)
```

### 13.2 Change

```
components/marks/Caliper.module.css      gate the gold jaws on [data-gold="true"] (§1.1)
components/marks/Caliper.tsx             add the discriminated `gold` prop; emit data-gold
CLAUDE.md                                correct the gold rule in the same commit (§1.1)
app/data/portfolio/skills.ts             KEEP `lede` verbatim; split `anz` into `anz-arch` +
                                         `anz-sdl` and re-key capabilities 2/3/4 (§3.2);
                                         add `tagCopy`, `topologyCopy`, `takeaway`;
                                         restate capabilities[8].evidence and split
                                         capabilities[5].evidence (§4.3)
components/sections/Skills/Skills.tsx    swap <Bench/> for <CalibrationTag/> + <Topology/>;
                                         delete the <ul className={styles.legend}> block
                                         (lines 110-126); KEEP the lede <p> (line 98);
                                         add the three table columns; add filter mode 'traced'
components/sections/Skills/Skills.module.css
                                         delete .legend/.legendItem/.legendGlyph/.legendLabel
                                         (incl. the gold at :107-110);
                                         tr[data-status="production"] .statusGlyph -> --mist-200;
                                         tr[data-traced] box-shadow -> --mist-400;
                                         add .lastTouched/.openable/.adjacent column rules
scripts/dataset/build_dataset.mjs        invoke skills_topology_layout.mjs; assert datasetHash;
                                         harvest htmlUrl + visibility + unauthenticated status;
                                         harvest the CV CreationDate; extend the repository list
.eslintrc.json                           no-restricted-imports: 'd3-force', 'd3-scale' in app/ + components/
package.json                             devDependencies: d3-force 3.0.0, d3-scale 4.0.2;
                                         scripts: "dataset:layout:check"
tests/e2e/skills.spec.ts                 delete TC-BENCH-01…04 (the Bench is gone)
```

### 13.3 Delete

```
components/sections/Skills/Bench.tsx
components/sections/Skills/Bench.module.css
```

### 13.4 Types — `app/data/canonical/schema/topology.ts`

```ts
export type CaliperState = 'sourced' | 'self-reported' | 'open';   // re-export, single definition
export type NodeKind = 'source' | 'capability';
export type RingIndex = 1 | 2 | 3 | 4 | 5;

export type ProvenanceDate =
  | { readonly kind: 'instant'; readonly at: Iso8601; readonly field: string }
  | { readonly kind: 'band'; readonly newest: Iso8601; readonly oldest: Iso8601;
      readonly field: string; readonly why: string }
  | { readonly kind: 'not-observable'; readonly reason: string;
      readonly provedBy: string; readonly field: string };

export interface TopologyNode {
  readonly id: string;                 // 'src:anz-arch' | 'cap:5'
  readonly kind: NodeKind;
  readonly label: string;              // Source.label | Capability.short
  readonly longLabel: string;          // Source.label | Capability.capability
  readonly caliper: CaliperState;      // derived, never authored (§4.1)
  readonly status: EvidenceStatus | null;   // capabilities only
  readonly sourceKind: SourceKind | null;   // sources only
  readonly href: string | null;        // non-null iff caliper === 'sourced' && kind === 'source'
  readonly provenanceDate: ProvenanceDate;  // REQUIRED — the layout script throws without it
  readonly viaSourceId: string | null; // capabilities: the source that set the radius
  readonly daysSince: number | null;   // null iff not-observable
  readonly daysNewest: number | null;  // bands only
  readonly daysOldest: number | null;  // bands only
  readonly r: number;                  // 150…462, two decimals
  readonly rNewest: number | null;     // bands only — the precision arc
  readonly rOldest: number | null;
  readonly ring: RingIndex | 'undated';
  readonly theta: number;              // radians from 12 o'clock, clockwise — DOM order key
  readonly x: number; readonly y: number;             // desktop, viewBox units
  readonly mx: number; readonly my: number;           // mobile, viewBox units
  readonly mLeaderY: number | null;    // mobile true-y when the label was dodged
  readonly zoom: { readonly zx: string; readonly zy: string } | null;  // sources only, §7.1
  readonly sourceId: string;           // dataset provenance key
}

export interface TopologyEdge {
  readonly id: string;                 // 'anz-arch→3'
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
  readonly zoomFactor: 1.9;
  readonly rings: readonly { readonly days: number; readonly r: number;
                             readonly y: number; readonly label: string }[];
  readonly occupiedRings: readonly (RingIndex | 'undated')[];
  readonly nodes: readonly TopologyNode[];
  readonly edges: readonly TopologyEdge[];
  readonly desc: string;               // #topo-desc, regenerated with the layout (§10)
}
```

---

## 14 · Tests

`tests/e2e/skills-topology.spec.ts`. `TC-SKILL-01 … 08` are untouched and must keep passing.
`TC-BENCH-01 … 04` are deleted with the component they tested.

**Relationship to the in-flight site-wide gold gate.** A parallel work item is landing
`tests/monochrome/gold-semantics.spec.ts` (`TC-GOLD-SEM`) and
`scripts/validate/gold_contrast_audit.mjs`, which police gold **across the whole page** against the
design-system lock's sanctioned evidence inventory and its per-viewport *saturated* budget (the lock
resolves `#vitrine`'s three simultaneous live-URL marks by stepping the recessed plates down to
`--gold-pale`). The tests below are **scoped to `#skills`** and are complementary, not duplicative:
they carry a `TC-TOPO-GOLD-*` prefix so they cannot collide with that family, and they use the same
saturated-gold definition (`--gold` + `--gold-light`) so the two gates can never disagree about what
counts. If that work item has landed, this spec adds `#skills`'s single mark to its inventory rather
than defining a second one.

**The rule this suite is written under.** A test that can only fail if the implementer disobeys the
spec is not falsifiable; it is a restatement. Revision 1's TC-TOPO-06 counted `data-gold="true"` — an
attribute this spec invents and applies once — and would have gone green while the section painted 32
gold caliper jaws from a stylesheet nobody opened. **Every law in this document therefore gets at
least one assertion that attacks the rendered result rather than the authored intent.**

| id | assertion |
|---|---|
| **TC-TOPO-GOLD-01** | **The adversarial gold audit, scoped to `#skills`.** In-page, walk every element inside `#skills` and both its `::before` and `::after` pseudo-elements; for each, read `color`, `background-color`, the four `border-*-color`, `outline-color`, `box-shadow`, `fill`, `stroke` and `text-decoration-color`; collect every element where any value resolves to **saturated gold** — `rgb(201, 168, 76)` (`--gold`) or `rgb(212, 182, 92)` (`--gold-light`). **Every hit must be the single `[data-gold="true"]` element or a descendant of it.** Separately assert that **no** element in `#skills` paints `--gold-pale`, `--gold-dark`, `--gold-muted`, `--gold-border` or `--gold-veil`: this section has one evidence mark, so it never needs the recessive step-down. Run at 1440 and 390 px, at rest, with a node focused, with a node pinned (`data-traced` set), and with each of the three filters active. This one test covers F-1, F-2 and the `data-traced` accent |
| **TC-TOPO-GOLD-02** | `#skills [data-gold="true"]` has count exactly 1; it also matches `[data-state="sourced"]`; it is inside the tag's `RESULT` field |
| **TC-TAG-01** | `#skills` contains exactly one visible clipped-corner tag path; the desktop one's `d` starts `M 29 1` and the mobile one's `M 22 1`; both are in the served HTML |
| **TC-TAG-02** | the tag prints all three caliper states: `[data-state="sourced"]`, `[data-state="self-reported"]`, `[data-state="open"]` each ≥ 1 inside the tag |
| **TC-TAG-03** | `RESULT`'s adjacent `<a>` `href` matches `/^https:\/\/github\.com\/Victordtesla24\/[A-Za-z0-9._-]+$/` **and equals the `htmlUrl` the dataset carries for the specimen**. No network request is made. The unauthenticated HTTP 200 check lives in the harvest (§13.0 R-b), where §4.1 needs it anyway and where it cannot make a green suite flaky or offline-hostile |
| **TC-TAG-04** | the `METHOD` field's text equals the `provenance.method` for the `data-source-id` on the `RESULT` caliper, read from `/dataset-provenance.json` |
| **TC-TAG-05** | the `DUE` box contains no text node (`textContent.trim() === ''`) at both widths |
| **TC-TAG-06** | **inverted from revision 1.** The string *"There are no proficiency bars on this page, because nobody can check one."* is present character-for-character inside `#skills`, and so are the two sentences that precede it in `skillsContent.lede`. R-166 / Gate R |
| **TC-TAG-07** | `#skills svg text` has count **0**, at both widths |
| **TC-TAG-08** | the `WHERE TAKEN` block's three glyphs and three labels are string-equal to `statusLegend`'s three `{glyph, label}` pairs — the tag cannot drift from the data module |
| **TC-TOPO-01** | in the **visible** stage: `[data-kind="source"]` = 14, `[data-kind="capability"]` = 16, `path.wire` = 20. The hidden stage computes `display: none` and contributes no focusable element (`page.locator(':focus-within')` never enters it under 40 `Tab` presses) |
| **TC-TOPO-02** | exactly 17 wires have no `stroke-dasharray` and exactly 3 have `4 3`; `getComputedStyle(wire).stroke` never equals `rgb(201, 168, 76)` |
| **TC-TOPO-03** | for every node, `hypot(x − 500, y − 500)` equals its `data-r` within **± 0.05 px**, and `data-r` equals `150 + log10(clamp(daysSince, 1, 10000)) / 4 × 280` recomputed in the test from `data-days`. The tolerance is the 2-dp rounding bound (√2 × 0.005 ≈ 0.0071 px); revision 1's ± 0.5 px would have passed a clamp that never ran |
| **TC-TOPO-04** | the four `[data-caliper]` × `[data-kind]` counts equal `selectCalibrationCounts()`'s own output, imported into the test — **not literals**. Additionally: for every node, `data-caliper` equals §4.1's expression recomputed in the test from `/dataset-provenance.json` |
| **TC-TOPO-05** | every `[data-caliper="sourced"][data-kind="source"]` is an `<a>` with a `github.com` href; every other node is a `<button>` with no `href` |
| **TC-TOPO-06** | **`provenanceDate` integrity.** Every node carries `data-source-id`, `data-days` (or `data-undated`), and for bands `data-days-newest`/`data-days-oldest`; every one resolves in `/dataset-provenance.json`; **no two nodes whose figures come from different CV roles share a `data-source-id`.** Specifically: capability 2's differs from capability 3's and capability 4's; capabilities 0 and 1 carry the `ongoing` band, not an instant. This is the F-4 regression test |
| **TC-TOPO-07** | DOM order is **non-decreasing in `data-ring-index`** (1…5, then 6 for the undated rail), and within each ring non-decreasing in `data-theta`. (Revision 1 asserted non-decreasing `data-r`, which contradicts §8's within-ring angle ordering the moment one decade holds nodes of different radii — ring 3 holds 13 nodes spanning r = 299 … 346) |
| **TC-TOPO-08** | hovering `ANZ · Solutions Architect, 2017–2022` lights exactly 2 wires and `ANZ · Senior Delivery Lead, 2022–2025` exactly 1; every unlit wire computes `stroke-opacity < 0.15`; **every** wire and label is still in the DOM and none has `visibility:hidden` or `display:none` |
| **TC-TOPO-09** | each node's `aria-label` contains its formatted date (or its band), its caliper gloss, and the literal phrase *"grades the date, not the claim"*; a capability node's also contains its `statusLegend` label; the `scrum-alliance` node's contains *"No award or expiry date is printed on the CV"*; both ANZ nodes' contain the `anom-anz-overlap` sentence |
| **TC-TOPO-10** | keyboard: focus the group, `ArrowRight` × 3 stays within the current ring; `ArrowDown` lands on a node with a strictly larger `data-ring-index` **that is in `occupiedRings`** (never ring 5); `ArrowUp` from the innermost occupied ring does not move; `End` reaches the undated rail; `Escape` clears `[data-pinned]` and resets `--zk` to 1; `Shift+Tab` leaves the group (no trap) |
| **TC-TOPO-11** | `Enter` on a capability node sets the table filter and the `role="status"` line to contain `traced from` |
| **TC-TOPO-12** | **at 390 × 844**: `path.wire` count in the visible stage is still **20**, every wire has `getTotalLength() > 40`, and no ancestor of the wires computes `display: none`. *This is the R-52 regression test.* |
| **TC-TOPO-13** | at 390 px the five ring labels are present with the same strings as desktop, plus the undated label |
| **TC-TOPO-14** | under `prefers-reduced-motion: reduce`: every label reaches `opacity: 1`, no element's `transform` differs from `none` at rest, and at least one ordered staggered fade is observable (`animation-delay` strictly increasing across ≥ 3 labels) |
| **TC-TOPO-15** | with `javaScriptEnabled: false`: **both** stages are in the served HTML, each with 20 wires, 30 nodes and 5 ring labels; at 1440 px the desktop stage is visible and the mobile one computes `display: none`; at 390 px the reverse. This is the F-9 regression test |
| **TC-TOPO-16** | no `[role="status"]`/`aria-live` element exists inside the topology figure other than the filter count line |
| **TC-TOPO-17** | **determinism**: `node scripts/dataset/skills_topology_layout.mjs --check` exits 0 (two runs byte-identical) |
| **TC-TOPO-18** | **no proficiency channel, attacked not permitted.** `[data-kind="capability"]` glyphs have **exactly one** distinct computed size across all 16; `[data-kind="source"]` glyphs **exactly one** across all 14; no `<rect>` in either SVG has a width that varies across siblings; no `role="meter"`, `role="progressbar"`, `<progress>`, `<meter>`, and no `%` character adjacent to a capability label. (Revision 1 permitted "at most 3 distinct sizes", which ratified the 6.4/5.4 px size channel instead of catching it) |
| **TC-TOPO-19** | `node scripts/validate/dataset_integrity.mjs` exits 0: every `data-source-id` in `#skills` resolves in `/dataset-provenance.json`; `data-gold` appears once per section and only on `[data-state="sourced"]`; every node caliper equals §4.1's expression |
| **TC-TOPO-20** | axe-core on `#skills` reports zero violations at WCAG 2.2 AA — at 1440 and 390 px, at rest, with a node focused, and with a node pinned |
| **TC-TOPO-21** | `#skills svg text` count is **0** in both stages (§2.2's ruling applied section-wide) |
| **TC-TOPO-22** | `#topo-desc`'s text equals `layout.desc` from the generated JSON — the sentence cannot drift from the drawing |
| **TC-TOPO-23** | the layout script **refuses** a node with no `provenanceDate`: run it against a fixture with one date removed and assert a non-zero exit, no output file written, and the offending node id in stderr |

`TC-SKILL-03` (no proficiency bars, meters or ratings) is **extended** to scan both topology SVGs
with the same predicates as TC-TOPO-18.

---

## 15 · The dossier (R-112) — `app/data/canonical/dossiers.ts`

```ts
{
  vizId: 'skills.calibration-topology',
  section: '#skills',
  title: 'The calibration topology',
  renderClass: 'svg',

  whatItShows:
    'Sixteen capabilities and the fourteen programmes, repositories and issuing bodies their ' +
    'evidence came from, placed on a base-10 logarithmic axis by when the dated evidence carrying ' +
    'each figure was last attested. Radius is recency and nothing else; wires are shared sources; ' +
    'each node’s terminal form states which of the three calibration states that DATE is in — ' +
    'never the claim. No mark on the board encodes proficiency, and none can: the data carries no ' +
    'such field.',

  datasetFields: [
    'repositories.forgotten-mistory.pushedAt',
    'repositories.aether-job-career-agent.pushedAt',
    'repositories.abentertainment.pushedAt',
    'repositories.public-key-server.pushedAt',
    'repositories.containerised-birth-time-rectifier.pushedAt',
    'repositories.relationship-timeline-feature.pushedAt',
    'repositories.EFDDH-Jira-Analytics-Dashboard.pushedAt',
    'repositories.<repo>.htmlUrl',                   /* one per repository, §13.0 R-b */
    'repositories.<repo>.visibility',
    'cv.document.creationDate',                      /* §13.0 R-f — the ongoing-role band */
    'cv.roles.role-ato-2026.start',                  /* ongoing: no end is printed */
    'cv.roles.role-anz-arch-2017.end',               /* 2022, year  — capabilities 3, 4 */
    'cv.roles.role-anz-sdl-2017.end',                /* 2025-06     — capability 2 */
    'cv.roles.role-independent-2025.end',
    'cv.education.edu-monash-2010.date',
    'cv.education.edu-unimelb-2007.date',
    'cv.certifications.cert-csm.date',               /* NotObservable */
    'manifest.modules.repositories.newestRetrievedAt', /* T0 */
  ],

  goldMark: 'repositories.forgotten-mistory.pushedAt',   /* the §2.4 argmax at the state of record */

  interactions: [
    { kind: 'hover-reveal', description: 'Pointer or focus on a node raises its wires and connected nodes and drops the complement to 0.10 stroke-opacity. Nothing is hidden before the interaction.' },
    { kind: 'focus-zoom',   description: 'Enter on a source magnifies both the diagram and the label layer by a single fixed factor of 1.9 about that source’s subtree, over 320 ms; type stays exactly on the five-step ramp because the labels counter-scale; Escape restores.' },
    { kind: 'drill-down',   description: 'Enter on a capability pins it and filters the record table to its rows; the polite count line announces the change. The traced accent is mist, not gold.' },
    { kind: 'filter',       description: 'The three existing status filters continue to drive the table, and now also dim the corresponding nodes.' },
    { kind: 'curiosity',    description: 'Arrowing outward past the last occupied ring reaches the undated rail — the two nodes for which the CV prints no date at all.' },
  ],

  demonstratedSkill:
    'Deterministic force-directed layout computed at build time and shipped as fixed coordinates, ' +
    'so a graph of thirty nodes renders with zero runtime simulation, zero layout measurement and ' +
    'zero cumulative layout shift; a post-tick radial projection that makes the quantitative ' +
    'channel exact rather than approximate; a per-node provenance date the layout script refuses ' +
    'to run without, so no figure can be drawn at the date of the container it happens to sit in; ' +
    'and a responsive projection that keeps every wire at 390 px instead of dropping the diagram.',

  takeaway:
    'Everything I can prove is a week old. Everything I can only tell you about is months or ' +
    'years back.',

  accessibility: {
    textAlternative:
      '#skills p#topo-desc + #skills table — the insight sentence, then the full record with ' +
      'Last touched, Openable and Shares-a-source-with columns. Neither is behind a toggle.',
    reducedMotion:
      'The settled frame is the base stylesheet: rings, wires, glyphs, arcs and labels are at ' +
      'final position and opacity on first paint. The choreography is re-scored, not muted — ' +
      'labels still arrive in ring order on a 40 ms stagger with no travel, ring labels are ' +
      'permanently visible instead of fading in, the wires are graded so the one-day ring reads ' +
      'first, and the focus magnification still happens, instantly.',
  },

  performance: { /* NOT authored — written by scripts/dataset/build_dossiers.mjs from
                    reports/viz-perf.json. Budgets asserted: fps >= 60, initMs <= 120,
                    memoryMb <= 3, disposedCleanly === true. */ },
}
```

---

## 16 · Open facts, recorded rather than assumed

1. **The printed radii are a reproduction, not a constant.** Reading rule 1 governs. At the moment of
   writing, the Wave-4 manifest already carries a later `T0` (`2026-09-03T22:05:11Z`) and a later
   `forgotten-mistory.pushedAt` (`2026-09-03T21:57:19Z`) than the corpus does. Both are correct; they
   are different observations. **No test asserts a constant radius** (TC-TOPO-03 asserts the formula).
2. **The specimen can change between deploys.** `selectTagSpecimen()` is a `max(pushedAt)` over public
   repositories; a push to `aether-job-career-agent` after the next `forgotten-mistory` push moves the
   gold mark. That is correct behaviour — the gold mark is a function of the data, evaluated at build,
   never authored per view — and TC-TAG-03 asserts the *shape and the dataset agreement*, not the
   identity.
3. **`daysSince` is floored at 1.** Two repositories pushed hours apart share the innermost ring. The
   floor is stated in the axis label, in `#topo-desc` and in the dossier. It is a declared limit of
   the scale, not a rounding that hides a difference.
4. **The ATO band is wide on purpose.** 83 – 187 days is a 104-day uncertainty, and it is the widest
   band on the board relative to its radius. It is wide because the CV genuinely says less about that
   role than about any other: it prints a start and the word *Present*. Narrowing it would be
   inventing precision.
5. **The two ANZ roles overlap in the CV and this spec does not resolve the overlap.**
   `anom-anz-overlap` is printed verbatim on both nodes. What the split *does* claim is only what the
   CV prints: that these bullets sit under an entry dated 2017–2022 and those under one dated
   2017–2025 whose only bullet is inline-dated 2022–2025. If the CV is later corrected, the radii move
   with it and no code changes.
6. **No credential verification URL is claimed** for Scrum Alliance, Monash or the University of
   Melbourne. None appears on the CV of record and none was found. If one is later supplied, those
   three nodes become `sourced` by the same rule, with no code change.
7. **LinkedIn remains not observable** (HTTP 999 login gate, `AUDIT-RECONCILIATION.md` §D). It is not
   a source in this topology and no node depends on it.
8. **`SC-17`'s readout string changes** from *"20 links · 13 sources · 17 capabilities"* to
   *"20 links · 14 sources · 16 capabilities on the board · 1 with no evidence yet"*. Both are true.
   Two entries go in the corrections ledger: the capability count, because grammar §2.4 removes the
   undrawable row from the board; and the source count, because the CV prints two ANZ roles where the
   registry printed one.
9. **`#vitrine`'s gold repository URLs are untouched** and may themselves exceed one gold mark per
   view. That is a separate finding in a separate section and is recorded here so it is not lost.
10. **`repositories.public-key-server.testFileCount` is no longer a dependency of anything.** Revision
    1 blocked capability 8's grade on it; §4.1 grades the date and §4.3(a) restates the cell from the
    CV's own words, so nothing in this spec waits on that field.

---

## Revision record

Revision 1 was returned **NEEDS-REVISION** with seven blockers and seven further findings. Every one
is dispositioned below. Six shipped changes to production landed between revision 1 and revision 2
(`DEPLOYMENT-LOG.md`); the two that touch this spec are recorded at the foot.

| id | The finding | Disposition | Where |
|---|---|---|---|
| **F-1** | `Caliper.module.css:75-80` paints `--gold` on the jaws of **every** `[data-state="sourced"]` caliper; the spec renders `sourced` on 7 sources + 6 capabilities + a caliper per table row while claiming *"Gold marks in view: 1"*. | **CLOSED — the critic was right, and the count was worse than stated (32, not 8).** Verified: `grep -rn 'state="sourced"' components/ app/` → **no matches**, so the rule is invisible today and this is a zero-pixel change. Gold is gated on `[data-gold="true"]`; ungated `sourced` jaws close in `--mist-200`, so the *form* still carries the grade. `Caliper.tsx` gains a discriminated prop so the pair cannot be mis-authored. `CLAUDE.md`'s gold rule is corrected in the same commit. **TC-TOPO-GOLD-01 now counts painted gold across every element and pseudo-element in `#skills`, in five states and two widths** — the assertion that would actually have caught this. | §1.1, §2.3, §2.4, §14 TC-TOPO-GOLD-01/02 |
| **F-2** | `Skills.module.css:271` (12 gold status glyphs) and `:373` (gold inset on `tr[data-traced]`, which the spec's own drill-down sets) were never removed. | **CLOSED — the critic was right, and there was a third: `:107-110`** paints the legend's first glyph gold too. All three are in the Removed table: `:271` → `--mist-200`; `:373` → `--mist-400`; `:107-110` deleted with the legend. Gold as *"you are here"* is gone. TC-TOPO-GOLD-01 asserts it with `data-traced` set. | §1, §7, §14 TC-TOPO-GOLD-01 |
| **F-3** | Deleting `skillsContent.lede` loses the refusal *"There are no proficiency bars on this page, because nobody can check one"*, which register §4.10 protects verbatim; §4.11 test 1 makes that a fail with the remedy *"the bench stays."* | **CLOSED — the critic was right.** The lede is **kept, verbatim, still rendered** at `app/data/portfolio/skills.ts:226`. R-96/R-99 are satisfied by *adding* the artefact, not by removing the prose — the sentence *"This is that certificate"* now points at a real object. **TC-TAG-06 is inverted** to assert the sentence's presence character-for-character. | §1.2, §14 TC-TAG-06 |
| **F-4** | Fabricated position. `corpus-cv.json` holds **two** ANZ roles; capabilities 3 and 4 quote bullets from `role-anz-arch-2017` (2017–2022) and only capability 2 from `role-anz-sdl-2017`. Keying one `anz` source to `2025-06` drew 3 and 4 ~4 years too fresh and made `#topo-desc` state a false cause. Same class for `ato`. | **CLOSED — the critic was right on both counts, and this was the worst finding in the set** because it is invisible in the drawing. Verified bullet by bullet against `corpus-cv.json`. The critic's strongest suggestion is **adopted in full**: every node carries a `provenanceDate` keyed to the dated evidence carrying its figure, and `skills_topology_layout.mjs` **exits non-zero rather than run** without one (TC-TOPO-23). The registry splits `anz` → `anz-arch` + `anz-sdl`; capabilities 3 and 4 move from r=335.35 to **r=372.83**; `ato` moves from the one-day ring to a **83–187-day band at r=299.12**, because role currency is not evidence recency and the freshest thing attesting an ongoing role is the CV's own `CreationDate` (`2026-06-12T17:30:37Z`, from `pdfinfo`). `#topo-desc` is rewritten with the true causes. The recorded CV anomaly `anom-anz-overlap` travels onto both ANZ nodes verbatim rather than being resolved silently. **The takeaway now earns itself:** with ATO's two unprovable capabilities off the innermost ring, the one-day ring is exclusively repositories. TC-TOPO-06 is the regression test. | §3.2, §3.5, §10, §13.0 R-f, §14 TC-TOPO-06/23, §16.4/5 |
| **F-5** | `radialClamp` was registered as `.force('ring', fn)` but written as a closure-returning function, so d3 would call it with `alpha` and discard the result — the clamp never runs. And d3 integrates `x += vx` *after* forces, so a force-phase clamp is undone in the same tick; *"exact to floating point"* was false and TC-TOPO-03 would have failed. | **CLOSED — the critic was right on both the shape and the ordering.** The clamp is no longer a force. `.force('ring', …)` is deleted; the tick loop becomes `sim.tick(); clampToRings(nodes);` so the clamp is the **last** operation of every tick and of the run. The velocity fix is corrected too (revision 1 scaled `vx`/`vy` by `k`, which is not "discard the radial component"; the projection now subtracts `v·û` along the unit radial). TC-TOPO-03's tolerance drops from ± 0.5 px to **± 0.05 px**, the actual 2-dp rounding bound — a half-pixel tolerance would have passed the broken clamp. | §5.3, §5.4, §14 TC-TOPO-03 |
| **F-6** | (a) §16.1 said `testFileCount` does not exist, forcing capability 8 to `self-reported`, while TC-TOPO-04 asserted 6 sourced capabilities — a test asserting a number the spec said was unreachable. (b) TC-TOPO-07 (DOM order non-decreasing in `data-r`) contradicted §8 (within-ring angle order). (c) `ring` was typed but never derived; ring 5 is empty and `ArrowDown` had no defined behaviour. | **CLOSED — the critic was right on all three.** (a) The `testFileCount` dependency is **deleted**: §4.1 grades the date, and capability 8's cell is restated from the CV's own words (*"100% test coverage (Mocha/Chai)"*) with the limit in its `caveat`. TC-TOPO-04 now asserts against `selectCalibrationCounts()`'s own output, never a literal, so it cannot drift. (b) TC-TOPO-07 becomes non-decreasing **`data-ring-index`**, then non-decreasing `data-theta` within a ring — which is what §8 actually specifies. (c) `ringIndex(d) = clamp(1 + floor(log10(clamp(d,1,10000))), 1, 5)` is stated; `layout.occupiedRings` is emitted and drives traversal, so empty ring 5 costs no keystroke and a future node past 10,000 days joins with no code change. | §3.5, §4.1, §4.3(a), §8, §14 TC-TOPO-04/07/10, §16.10 |
| **F-7** | §4.1(b) requires a reproducible *figure*, but capabilities 10, 11 and 12 print prose; grading them `sourced` needed editorial judgement, so *"mechanical … never authored"* was false. Capability 11's grade additionally rested on a claim `AUDIT-RECONCILIATION.md` C-2 said was unobservable. | **CLOSED — the structural half was right; the C-2 half is wrong and is refuted here with evidence.** *Structural:* §4.1 is rebuilt so the caliper grades **the date the node is drawn at** — the only quantity the topology encodes — which is a pure field lookup (`source === 'github-rest'` ∧ `visibility === 'public'` ∧ `htmlUrl !== null` ∧ harvested 200). No list, no prose, no adjudication, and `dataset_integrity` recomputes it. Three places tell the reader the caliper grades the date and not the claim, so the reframe cannot be misread as a proficiency. *C-2:* **withdrawn as a false positive of the audit's own capture harness** (`AUDIT-RECONCILIATION.md` §F, FP-01). Re-tested with `reducedMotion: 'no-preference'` and `?gl=force`: **hero → 1 canvas, experience → 1 canvas.** The baseline ran headless with `prefers-reduced-motion: reduce` on a GPU-less host, and `Scene.tsx` deliberately renders nothing under either condition — the gate firing was the feature working. Any reasoning of the form *"no canvas renders"* is unsound. Capability 11 is unaffected either way, because under the new rule its grade comes from `repositories.forgotten-mistory.pushedAt`, not from a claim about canvases. | §4.1, §4.2, §4.3, §14 TC-TOPO-04 |
| **F-8** | `app/data/canonical/`, `scripts/dataset/`, `dataset_integrity.mjs`, `tests/perf/viz_perf.spec.ts`, `/dataset-provenance.json` and the `d3-*` packages were listed under **Change** but do not exist; the *"clause 5 already asserts one gold mark"* claim referenced a non-existent file. | **CLOSED — the critic was right; all six verified absent in `main`.** §13.0 is new: it declares the hard dependency on `SPEC-telemetry-and-data.md`, states **what this spec requires** of the canonical layer as eight numbered contract items rather than assuming a shape, and records what was actually observed in the `wt/data-backend` worktree — including the three requirements it does **not** yet meet (`htmlUrl`/`visibility`, four of the seven repositories, the CV `CreationDate`), each of which this spec then creates. Everything genuinely absent moved from **Change** to **Create**, `dataset_integrity.mjs` included. | §13.0–13.3 |
| **F-9** | The mobile switch had no mechanism: *"below 900 px the component renders `layout.mobile`"* cannot happen without JS in a static export, yet TC-TOPO-15 demanded 20 wires in the JS-disabled HTML. Either both layouts ship — doubling the counts — or JS chooses and CLS 0 is false. | **CLOSED — the critic was right that it was unresolved.** Both stages ship into the served HTML and a **CSS media query** hides one. `display: none` (not `visibility`/`opacity`) so the hidden stage leaves the accessibility tree and the tab order entirely. The counting problem is faced rather than dodged: **TC-TOPO-01 counts the visible stage** and additionally asserts the hidden one is unreachable by 40 `Tab` presses; §12 is restated to ~230 elements of which ~115 render. CLS stays 0.00 because a media query resolves before first paint and there is no hydration swap. | §6.0, §12, §14 TC-TOPO-01/15 |
| **F-10** | Focus-zoom animated the SVG `viewBox` while every focusable node, label and focus ring is HTML positioned by percentage — the glyphs would move and the labels stay. A per-node zoom factor would scale type off the locked ramp. §3.3's ring labels used SVG `<text>`, which §2.2 forbids. | **CLOSED — the critic was right on all three.** The viewBox is not animated. The zoom is a **CSS `transform` applied identically to both layers of the stage**, which are the same box, so glyphs, labels and focus rings move together by construction. The factor is **a single global 1.9**, not per-node, and label children counter-scale by `1/--zk`, so rendered type is exactly its ramp value in both states — no intermediate size, no sixth step. The translations are precomputed per source node at build time (`node.zoom`), so there is still no runtime measurement. `transform` does not affect layout, so CLS stays 0.00. Ring labels are HTML in the same layer; **TC-TAG-07 and TC-TOPO-21 assert zero `<text>` elements** anywhere in the section. | §3.4, §3.9, §7.1, §14 TC-TAG-07/TC-TOPO-21 |
| **F-11** | Deleting the legend left ● ◐ ○ untaught: the tag taught the caliper states, nothing taught `production` / `non-production` / `pending`, and `aria-label` carried the caliper gloss but not the status. | **CLOSED — the critic was right.** The tag gains a second block, **`WHERE TAKEN`**, carrying `statusLegend`'s three glyphs and three labels **verbatim** — and read from the data module rather than re-typed, so they cannot drift (TC-TAG-08). Capability node `aria-label`s now carry the status label as well as the caliper gloss (TC-TOPO-09). The vocabulary moves from a floating legend onto the artefact, which is what grammar §5 wanted in the first place. | §1, §2.2, §2.3, §9, §14 TC-TAG-08/TC-TOPO-09 |
| **F-12** | §3.5 asserted *"no node size channel"* in the same table that gave `production` a 6.4 px disc and the others 5.4 px — size varying with an evidence claim — and TC-TOPO-18 was written to permit up to 3 sizes, ratifying it. | **CLOSED — the critic was right.** All capability glyphs are **6 px**; all source glyphs are **9 px**. The three statuses differ by fill and stroke only; `◐` is a half-disc `<path>` at the same diameter. The 9-vs-6 difference encodes `kind`, which is nominal. **TC-TOPO-18 is inverted** to demand *exactly one* distinct computed size per `data-kind`, so it now attacks the rule instead of ratifying its breach. | §3.6, §14 TC-TOPO-18 |
| **F-13** | The precision arc's extent was defined but the node's own position within it never was; reverse-engineering showed the day-range midpoint. An implementer would have guessed and reproduced nothing. | **CLOSED — the critic was right.** §3.4 states it: **`dmid = (daysSince(newest) + daysSince(oldest)) / 2`**, the arithmetic midpoint of the *day* range — not the log midpoint, not `dmin`, not `dmax`, not a geometric mean — with the arc spanning `[r(daysSince(newest)), r(daysSince(oldest))]`. The calendar convention it depends on (dates at `T00:00:00Z`; a month spans first day to last day; a year spans 1 Jan to 31 Dec) is stated in the same section, because the radii cannot be reproduced without it. All thirteen band radii and arcs in §3.5 are recomputed from that stated rule. | §3.4, §3.5 |
| **F-14** | TC-TAG-03 made a live unauthenticated HTTPS request to github.com from inside a Playwright suite that must be green, on a project whose CI is already red. | **CLOSED — the critic was right.** TC-TAG-03 now asserts the URL **shape** and that it **equals the dataset's `htmlUrl`**, with no network request. The unauthenticated HTTP 200 check moves to the harvest (§13.0 R-b), which is where §4.1 needs it anyway and where a network failure is a data problem rather than a flaky test. | §13.0 R-b, §14 TC-TAG-03 |

### Production changes since revision 1 that touch this spec

- **R-147 is DONE** and **C-2 is WITHDRAWN** (`DEPLOYMENT-LOG.md` ships 3 and 5). C-2's withdrawal is
  load-bearing here: it invalidates half of F-7, and it is cited in F-7's disposition with the
  re-test that refutes it. No argument anywhere in this document rests on *"no canvas renders"*.
- The `<footer>`, the skip link, `<main id="main">` and the removal of both axe exclusions are live,
  which means **TC-TOPO-20's axe run now audits the whole page with no exclusions** — a stricter gate
  than revision 1 was written against, and the reason TC-TOPO-20 is specified at two widths and three
  states rather than one.

### Verification performed for this revision

Every path was checked with `ls`, every line number with `sed -n`, every count with `grep -c`, and
every date with a recomputation from `corpus-cv.json` / `corpus-repositories.json`. Specifically
confirmed: `Caliper.module.css:75-80` (gold jaws) · `Skills.module.css:109, 271, 373` (three gold
rules) · `skills.ts:226` (the lede, verbatim) · `skills.ts:44-58` (13 sources) ·
`corpus-cv.json.roles` (two ANZ entries, `role-anz-arch-2017` 2017–2022 and `role-anz-sdl-2017`
2017-09 → 2025-06, and `anom-anz-overlap`) · `corpus-cv.json.source_document.pdf_creation_date`
(`2026-06-12T17:30:37Z`) · all seven cited repositories `visibility: public` with resolving
`htmlUrl` · the absence of `app/data/canonical/`, `scripts/dataset/`,
`scripts/validate/dataset_integrity.mjs`, `tests/perf/viz_perf.spec.ts`,
`public/dataset-provenance.json` and `d3-*` in `main` · their presence in `wt/data-backend` ·
`--gold: #c9a84c` = `rgb(201, 168, 76)` · and that `--motion-emphatic`, `--motion-cine-in` and
`--stagger-tight` are proposed by `design-system-lock.md` §4.2 but are **not yet in
`app/globals.css`**, which is why §11 uses the CSS fallback form.
