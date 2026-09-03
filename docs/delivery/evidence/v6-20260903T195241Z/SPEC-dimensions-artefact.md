# SPEC · The Ten-Dimension Artefact

**Run** `v6-20260903T195241Z` · **Requirements** R-188, R-168, R-172, R-96, R-97, R-99, R-101,
R-104, R-109, R-110, R-111, R-112, R-121, R-95, R-108 · **Success criteria** SC-96.1, SC-87.1,
SC-88.1 · **Gates** K and R · **Binding decisions** D-01, D-04 (`DECISIONS.md`) · **Grammar**
`encoding-grammar.md` §2.1–2.5, §3.1–3.3, §5, §6, §8, §9, §11, §12 · **Tokens**
`design-system-lock.md` §1.3, §1.4, §2.2, §3.3, §4.2, §4.3 · **Dataset** `dataset-layer-design.md`
§1, §2.1, §2.3, §2.4, §3.4, §5, §6 · **Closes** `AUDIT-RECONCILIATION.md` C-3 · **Revises** C-8

This is a build specification. Every geometry, weight, duration, easing, angle, field name, DOM
shape, string and assertion below is fixed. An implementer executes it without making a further
design decision. Any number an implementer cannot reproduce from the canonical dataset is a defect
in this spec, not a licence to invent one.

Every factual claim in this document was re-verified against the working tree and the live GitHub
API on 2026-09-03, after the six changes recorded in `DEPLOYMENT-LOG.md` had shipped. Where the
first draft inherited a premise from the contract or from `AUDIT-RECONCILIATION.md` without
checking it, and the premise turned out to be false, the false premise has been **deleted, not
footnoted** — see the Revision record at the end.

---

## 0 · The call: the instrument is **extended**, not replaced — and here is why

R-188 says *rebuild*. The honest reading of the audited baseline is that the thing to rebuild is the
**prose**, not the instrument. Three findings decide it.

1. **The compass is already a data mark, and a correct one.** `Compass.tsx:85-225` draws ten equal
   sectors — no needle, no magnitude, no radar — and encodes exactly one real datum: the
   candidate/role split, drawn with the **same 45° hatch the open caliper uses** (`Compass.tsx:140-150`
   ↔ `Caliper.module.css`). R-168 names *"the measured from the role annotations"* as a preserved
   asset and SC-87.1 fails Gate R on any loss. Deleting the face to draw a new one would forfeit a
   preserved asset to gain nothing the face cannot carry.
2. **The prose is the part that fails R-188.** `about.ts:44,51,58,…` ships ten `evidence` strings —
   *"38 public repositories · ATO evidence harness · ANZ platform migrations"* — that name evidence
   without **being** evidence. Nothing resolves. Nothing is cross-linked. Nothing carries a source.
   That is the static prose block SC-96.1 forbids.
3. **The face has spare, honest capacity.** It draws two states where the site's grammar has
   **three** (`encoding-grammar.md` §2.3). The caliper's `sourced` state is rendered **nowhere on the
   site** (`AUDIT-RECONCILIATION.md` C-3) — and two of the ten dimensions genuinely have evidence a
   reader can open. Extending the face from a two-state reading aid to a **three-state evidence
   instrument** renders `sourced` for the first time *from the data*, which is the only sanctioned
   way to close C-3.

**Ruling.** `Compass.tsx` and `Compass.module.css` are **extended in place** — same file names, same
viewBox, every shipped constant unchanged — so the T-37 preservation diff reads as extension, not
substitution. The ten `evidence` strings are **kept** and demoted to a summary line above a real,
linked, sourced evidence rail. Nothing is deleted from `about.ts` except one unmarked figure (§3.4).

**What is not true, and must not be repeated.** `Compass.tsx` says *"The index is the one gold
mark"* at **`:78`** and *"the one gold mark on the instrument"* at **`:211`**. The shipped CSS
already draws the index `--gold`-free (`Compass.module.css:146-155`, `fill: var(--white)`), and the
stylesheet header at `Compass.module.css:9` states the correct rule. **Both** doc-comments are stale
prose, not shipped violations — delete both in the same commit. There is currently **zero gold in
`#about`**; §4 gives the section its first and only gold mark.

---

## 0.1 · The hard ordering dependency, declared

This spec **consumes** the canonical dataset layer; it does not create it. As of this run, none of
the following exists in the tree — verified with `ls`:

```
app/data/canonical/                      absent   (selectors.ts, dossiers.ts, schema/, generated/)
scripts/dataset/                         absent   (build_dataset.mjs, sources/*.mjs)
scripts/validate/dataset_integrity.mjs   absent
public/dataset-provenance.json           absent
reports/viz-perf.json                    absent
```

They are the deliverables of **`dataset-layer-design.md` §1–§3 and §5.3**, scheduled by
`SPEC-telemetry-and-data.md` (which names `app/data/canonical/**` as owned by the dataset design at
its line 49, and `scripts/dataset/sources/repositories.mjs` at its §19). **This spec cannot be
started before that layer lands.** §11 therefore lists every one of them under *Depends on*, never
under *Change*, and an implementer who finds a missing import has started in the wrong order rather
than found a defect.

Two consequences are stated rather than assumed:

- §3.1's claim is narrower than the first draft's. It is **not** true that "no dataset scope
  extension is required": §4 adds a `DimensionsSource` field group to the `repositories` module, and
  §14.6 records a second field (`pythonTestFiles`) that must land with it. What *is* true is that
  **no new module and no new generated file** are required — every id this spec resolves already
  falls inside an existing module's declared scope (`aether-job-career-agent` is one of the vitrine
  six, `dataset-layer-design.md` §2.3; all ten public videos are in the channel module, §2.4; all
  nine roles are in the cv module, §2.1).
- TC-DIM-07 and TC-DIM-18 read `/dataset-provenance.json`, which `dataset-layer-design.md:576-577`
  writes to `public/` so it is fetchable from the static export. Until it exists those two tests
  cannot run, and this spec is not startable.

---

## 1 · What changes, exactly

| Kept, untouched | Extended | Added | Removed |
|---|---|---|---|
| the ten `name` strings, verbatim and in order | `Compass.tsx` — 2 states → 3 terminal forms, + tie ticks, + zoom, + hub probe | the evidence rail (§3) | `Dimension.evidence[0]`'s raw figure *"38 public repositories"* (§3.4) |
| the two `lede` paragraphs (the refusal of scores) | `About.tsx` — list items gain the rail; `<li tabIndex={0}>` is removed (§6) | the four filter controls (§5.3) | `Compass.tsx:78` **and** `:211`'s stale gold comments |
| the caption's rest string `Ten axes · no scores` (§8) | `about.ts` — `provenance` gains a commit-pinned citation (§4); each dimension gains `evidenceRefs` | the gold citation mark (§4) | nothing else |
| the open `<Caliper state="open">measured from the role</Caliper>` on the three role dimensions | `About.module.css`, `Compass.module.css` | `#about-desc`, the takeaway line (§8) | |
| every `answer` string | | `data-answer` / `data-evidence` on the two shipped `<p>`s (§12) | |

**Not changed, contrary to the first draft:** `components/sections/Experience/Experience.tsx`. See
§3.3 — the anchors this section links to already ship.

---

## 2 · The plate — exact geometry

`components/sections/About/Compass.tsx`. **Every shipped constant is unchanged**: `SPOKES = 10`,
`BEZEL_OUTER = 47`, `BEZEL_INNER = 43.2`, `SECTOR_OUTER = 41`, `SECTOR_INNER = 22`,
`NUMERAL_RADIUS = 36.2`, `HUB = 18`, `SECTOR_SWEEP = 36`, corner inset `1.1°`, engraved rules at
`t = 0.28 / 0.52 / 0.76`, 100 bezel graduations from `BEZEL_INNER` outward with every tenth major
(`+3.8` vs `+1.9` long, i.e. to r 47.0 and r 45.1 — `Compass.tsx:111-115`),
`viewBox="0 0 100 100"`, `polar(a, r) = [50 + cos((a−90)π/180)·r, 50 + sin((a−90)π/180)·r]`.

`.compass` changes `overflow: visible` → `overflow: hidden` (nothing is drawn outside 3…97; the zoom
in §5.2 requires the clip).

### 2.1 The three terminal forms — **terminal form only, never intensity**

The single `annulus()` path is split into four elements so the caliper's grammar can be drawn
literally. `from = θᵢ − 16.9`, `to = θᵢ + 16.9`, `θᵢ = 36 · i`.

`encoding-grammar.md` §2.3 is binding and unambiguous: the caliper states *"are drawn with texture
and terminal form, **not intensity**"*, and §12 prohibition 7 fails Gate K on *"a calibration state
rendered as a score, a bar, a size, or an ordering"*. A stroke-width ramp is a size ramp. A fill- or
stroke-opacity ramp is a luminance ramp (channel rank 5, *"ordered only"*). **Neither is permitted
here.** So:

> **Across `sourced` and `self-reported` every continuous channel is byte-identical.** Same fill,
> same stroke colour, same stroke width, same opacity, same geometry. The *only* difference is the
> presence of the `.jaw` pair — a terminal form, exactly as the shipped mark's own gloss puts it:
> *"sourced — solid arms; self-reported — solid arms, grey value"* (`Caliper.tsx:22-28`), where the
> grey is carried by the **value**, which on the plate is the rail row's type, not the arc.

| element | path | `sourced` | `self-reported` | `open` |
|---|---|---|---|---|
| `.sectorFill` | `annulus(from, to, 22, 41)`, `stroke: none` | `var(--plate-sector-fill)` | `var(--plate-sector-fill)` — **identical** | `url(#compass-open)` (the shipped 45° hatch) |
| `.sectorArc` | `M polar(from+g,41) A 41 41 0 0 1 polar(to−g,41)` | `g = 0`, `stroke-width 0.6`, solid, `var(--steel)` @ 0.50 | `g = 0`, `stroke-width 0.6`, solid, `var(--steel)` @ 0.50 — **identical** | `g = 1.4`, `stroke-width 0.6`, `var(--steel)` @ 0.50, `stroke-dasharray 1.6 1.2` |
| `.sectorEdge` ×2 | `M polar(from,22) L polar(from,41)` and the `to` twin | `var(--steel)` @ 0.40, `0.4` wide | same | same + `stroke-dasharray 1.6 1.4` (shipped value) |
| `.rule` ×3 | shipped arcs at `t 0.28/0.52/0.76` | drawn | drawn | **absent** (shipped behaviour) |
| `.jaw` ×2 | `M polar(from+2.0,41) L polar(from+2.0,38.8)` and `M polar(to−2.0,41) L polar(to−2.0,38.8)` | **drawn**, `var(--white)`, `0.9` wide, @ 0.90 | absent | absent |

Read down the columns: `sourced` and `self-reported` differ in **one row**, and that row is a
terminal form. `open` differs by dash pitch, corner gap and hatch — all texture (channel rank 6,
*"a **kind**, never a quantity"*). No channel that can be ordered is used to separate the three.

The `g = 1.4°` corner gap is the whole point of the `open` form: **arms that do not meet**, exactly
as `Caliper.tsx:26-28` glosses it. The `.jaw` pair is **closed jaws**, exactly as `:22-23` glosses
it. A reader who has met the caliper in the hero already reads this face without a legend.

The `.jaw` pair is `var(--white)`, **never `var(--gold)`** — the shipped inline caliper draws sourced
jaws in gold (`Caliper.module.css:77-78`), but the plate may not, because §4's citation is this
view's one gold mark and `encoding-grammar.md` §12 prohibition 2 fails Gate K on a second. The
white jaw is the same *form* in a permitted *colour*, and the grade it stands for is spoken in the
control's `aria-label` and printed in the key (§3.5) and the rail (§11.3). Asserted by TC-DIM-22.

`vector-effect: non-scaling-stroke` on `.sectorArc`, `.sectorEdge`, `.jaw`, `.tieTick` (shipped
discipline, `Compass.module.css:32,48,71,109,133,154`).

**Derivation (never authored).** `terminalForm(i)` is computed in `selectDimensionEvidence()`:

```
ties = resolved evidence ties for dimension i
if ties.some(t => t.href !== null && t.external)      -> 'sourced'
else if ties.length > 0                               -> 'self-reported'
else if dimension.side === 'role'                     -> 'open'
else                                                  -> throw
```

The `throw` is load-bearing. `open` means *"measured, and found honestly unmeasurable"*
(`encoding-grammar.md` §2.3). A candidate-side dimension with no ties is *"no evidence yet"*, which
per §2.4 gets **no mark at all**, not an open one — and since all ten sectors must render (R-168),
the only correct response is to fail the build until the data is fixed. Today all seven
candidate-side dimensions carry a role tie, so the throw is unreachable; it exists so it stays that
way.

**Sector size is invariant.** All ten sweep 36°, span r 22→41, and no channel — radius, angle, area,
luminance or stroke — varies with anything but the presence or absence of a terminal form. There is
no score to draw and the geometry makes one unrepresentable. Asserted by TC-DIM-08.

### 2.2 The evidence gutter — tie ticks

A dedicated annular gutter between `SECTOR_OUTER` (41) and `BEZEL_INNER` (43.2), unused today.

| kind | angle | geometry |
|---|---|---|
| `role` | `θᵢ − 9°` | `M polar(θᵢ−9, 41.4) L polar(θᵢ−9, 43.2)` |
| `repository` | `θᵢ` | `M polar(θᵢ, 41.4) L polar(θᵢ, 43.2)` |
| `channel` | `θᵢ + 9°` | `M polar(θᵢ+9, 41.4) L polar(θᵢ+9, 43.2)` |

`.tieTick`: `stroke: var(--white)`, `stroke-width: 0.9`, `opacity: 0.62`; `[data-active] 1.0`. The
opacity change is the **reading position** — which dimension the pointer or focus is on — not a
calibration state, so §2.3's ban on intensity does not reach it (`encoding-grammar.md` §3.1 rule 3
reserves ordered emphasis for exactly this).

**A kind with no evidence draws nothing** — `encoding-grammar.md` §2.4 rule 3 and §12 prohibition 8:
there is no dimmed tick, no empty slot, no placeholder. Eleven ticks exist on the shipped data
(§3.1); the count is a consequence of the data, never a target.

The three clock positions are constant across all ten sectors, so the pattern is readable as a
pattern. They are too small to carry text at rest (1.8 viewBox units ≈ 6.9 CSS px on a 384 px
stage), which is exactly the condition `encoding-grammar.md` §5 clause 4 sets for a key — so they
are named in one sentence beneath the plate (§3.5), and **directly labelled on zoom** (§5.2).

### 2.3 The index and the hub readout

`.index` (caret `M 50 3.2 L 52.5 8.4 L 47.5 8.4 Z`, stem `50,9.6 → 50,14.4`) is unchanged, and
stays `var(--white)`. It marks *where the reader is standing*, and `encoding-grammar.md` §3.1 rule 3
reserves that job for white precisely so gold keeps meaning *sourced*.

`.readNumber` (heading face, `var(--white)`, **y `47.5`** — the shipped value, `Compass.tsx:218`) —
`01`…`10`, or `—` at rest. `.readState` (mono, 2.6 px, `var(--mist-400)`, **y `56.5`** — the shipped
value, `Compass.tsx:221`). Only the readout's **vocabulary** changes:

| state | string |
|---|---|
| rest | `NO SCORES` *(shipped string, kept — it is R-168's refusal, printed on the instrument)* |
| `sourced` | `OPENABLE` |
| `self-reported` | `CV ONLY` |
| `open` | `FROM THE ROLE` *(shipped string, kept)* |
| probe active (§5.4) | `10 ARGUMENTS` |

The shipped `ANSWERED` string is the one replaced; it is the string the third state makes
imprecise, because five of the seven "answered" dimensions are answered from the CV alone and two
are answered from something a reader can open.

No third hub line. Anything smaller than 2.6 px in this viewBox renders under 10 CSS px on a 384 px
stage, and the site does not print type it cannot set well (R-103). The evidence kinds are carried
in real HTML type beneath the plate instead.

---

## 3 · The cross-link model — real corpus data, and the gaps stated

### 3.1 The ten dimensions and what actually evidences them

**Rule: at most one artefact per kind, per dimension** — the strongest one. The rest of the record
lives in Experience and the Vitrine, and the rail says so rather than duplicating them. Every id
below resolves in the canonical dataset as scoped today; **no new module and no new generated file
is required** (§0.1 states the two field additions that are).

| # | Dimension | side | ROLE (`cv.roles.*`) | REPOSITORY (`repositories.*`) | CHANNEL (`channel.videos.*`) | form |
|---|---|---|---|---|---|---|
| 01 | Technical Skills | candidate | `role-ato-2026` | `aether-job-career-agent` | `p9pGAmqJCSk` | **sourced** |
| 02 | Experience Level | candidate | `role-myob-2010` | — | — | self-reported |
| 03 | Industry Match | candidate | `role-anz-sdl-2017` | — | — | self-reported |
| 04 | Role Alignment | candidate | `role-ato-2026` | — | — | self-reported |
| 05 | Culture Fit | candidate | `role-anz-arch-2017` | — | — | self-reported |
| 06 | Salary Fit | **role** | — | — | — | **open** |
| 07 | Location Match | **role** | — | — | — | **open** |
| 08 | Career Growth | candidate | `role-independent-2025` | — | — | self-reported |
| 09 | Company Stability | **role** | — | — | — | **open** |
| 10 | North Star Align | candidate | `role-ato-2026` | `aether-job-career-agent` | `gMe4FZbjcQE` | **sourced** |

Totals: **2 sourced · 5 self-reported · 3 open · 11 tie ticks.** Filter counts 10 / 2 / 5 / 3.

**The six "no evidence" statements are the honest truth, not padding, and each is checked:**

- 02 · *"No repository and no channel item evidences how long a career is."*
- 03 · *"No repository and no channel item evidences which industries an employer is in."*
- 04 · *"The ATO toolchain runs on a mainframe inside a government network. There is no repository
  to open, and there never will be."*
- 05 · *"No repository and no channel item. Forty practitioners across five squads is a thing you
  either did or did not do; there is no artefact of it."*
- 08 · *"No repository and no channel item. This dimension is about the next programme, and the only
  evidence that can exist for it is what has already been built toward it."*
- 06 / 07 / 09 · *"Computed from the role, not the candidate. There is nothing about a person to
  measure here, so nothing links out."* — one sentence, shared, beside the shipped open caliper.

**Rejected ties, recorded so the rejection is auditable.** `agsva-security-clearance-webapp` for
03 (its description — *"web app to track, manage and track AGSVA Security Clearance (Baseline)"* —
is a personal tracker, not evidence of working in a regulated industry); `Error-Management-System`
for 08 (error handling is not model assurance); `global-ticketing-initiative` for 04 (created
2026-08-23, pushed 2026-08-25, two days of history and no described substance); the nine Vedic
astronomy videos for 03/05 (they evidence curiosity and the instinct to teach — R-120 — which is
not one of the engine's ten dimensions, and stretching one to fit would be exactly the padding this
section exists to refuse). The channel therefore speaks to **two** of the ten. That is the finding.

### 3.2 The verbatim tie copy

Each tie ships `{ kind, ref, what }` in `about.ts` (editorial) and resolves its facts through
`selectDimensionEvidence()` (canonical). `what` is authored prose; every figure inside it is either
inside a marked element or carries its caveat in the same sentence (`encoding-grammar.md` §11).

**Labels are printed from the dataset's own verbatim strings, never re-typed.** The role label is
`title · employer · date_text_verbatim`, all three fields exactly as `corpus-cv.json` holds them —
which is why the employer reads *Australian Taxation Office (ATO)* and the dates read *March 2026 -
Present*, with the CV's own hyphen and capitalisation. The video label is `title · duration.formatted
· publish_date`, likewise verbatim — which is why the JARVIS title carries a **hyphen**, not an
em-dash. Re-punctuating a "never authored" label is authoring it. Asserted by TC-DIM-23.

| # · kind | rendered label (verbatim from the dataset) | `what` (authored) | grade |
|---|---|---|---|
| 01 · role | `Scrum Master / Project Manager · Australian Taxation Office (ATO) · March 2026 - Present` | The COBOL/mainframe test-evidence toolchain — REXX, SMF, SDSF, PCOMM, PowerShell, VBA — across 200+ SIT/E2E scenarios. | self-reported |
| 01 · repo | `Victordtesla24/aether-job-career-agent · Python · MIT` | Python and TypeScript at production scale, with 392 Python test files behind it — and a public CI that is red on `main` today. | **sourced** |
| 01 · channel | `JARVIS - I Built a Real Arc Reactor HUD for My Mac (Apple Silicon Telemetry) · 2:01 · Apr 16, 2026` | Its own description names the stack: 60 fps via SwiftUI Canvas and Metal, with a Go telemetry daemon streaming JSON at 1 Hz. | **sourced** |
| 02 · role | `Developer Support / Software Testing / Analyst · MYOB · May 2010 - Aug 2011` | The earliest role on the CV of record. Every years-of-experience figure on this site is counted from its start date. | self-reported |
| 03 · role | `Senior Delivery Lead / Technical Product Owner · ANZ · Sept 2017 - June 2025` | Seven years and nine months inside one regulated bank — the longest single engagement on the record. Government and telecommunications sit beside it in Experience. | self-reported |
| 04 · role | `Scrum Master / Project Manager · Australian Taxation Office (ATO) · March 2026 - Present` | One of eight squads on the Payday Super programme, PI 47–48 — and the toolchain that unblocked it. The delivery problem and the engineering problem were the same problem. | self-reported |
| 05 · role | `AI/ML Strategy & Solutions Architect · ANZ · 2017 - 2022` | 5+ cross-functional squads and up to 40 resources including offshore teams, on a programme portfolio the CV values at over $5M. Drawn as one span in Experience. | self-reported |
| 08 · role | `Independent AI Consulting & Upskilling · Independent · June 2025 - Feb 2026` | An end-to-end Langfuse and Phoenix evaluation stack scoring hallucination, latency and cost. The 38% reduction in error-budget breaches was measured in a **simulated** production environment, not against live traffic. | self-reported |
| 10 · role | `Scrum Master / Project Manager · Australian Taxation Office (ATO) · March 2026 - Present` | A mathematically infeasible SIT window — 75+ hours of **manual** evidence **per team** against 64 available hours — said out loud, escalated, then re-baselined by an executive change request. | self-reported |
| 10 · repo | `Victordtesla24/aether-job-career-agent · README line 39` | Its own README: *"a signal with no data reads 'not measured' rather than counting as a zero."* The engine refuses to publish what it cannot source; so does this page. | **sourced** |
| 10 · channel | `Part 2: I Coded a 7,000-Year-Old Algorithm (It Actually Works) · 10:05 · Nov 25, 2025` | A 7,000-year-old text translated into executable Python, with the code published so the claim in the title can be checked by anyone who wants to. | **sourced** |

Both ANZ ties resolve to **one** Experience entry (`#role-anz`), because Experience draws ANZ as a
single span. The rail says so on tie 05: *"drawn as one span in Experience."*

**The rail draws no caliper bracket.** Each row's grade is carried as (a) `data-caliper` on the
link, (b) a **word** in the row's kind column — `ROLE · CV ONLY`, `REPO · OPENABLE`, `CHAN ·
OPENABLE` — and (c) the sector's terminal form on the plate, which is this section's whole visual
encoding of exactly this distinction. A `<Caliper state="sourced">` in the rail would render gold
jaws (`Caliper.module.css:77-78`) four times over and break §12 prohibition 2 and R-110 in the same
stroke; a `<Caliper state="self-reported">` would add seven more bracket pairs to a list that
already has ten. The grade is stated in type, which is what `Caliper.tsx:36-38` says a mark is for.

### 3.3 Link targets

| kind | `href` | notes |
|---|---|---|
| role | `#role-{siteRoleId}` | `role-ato-2026 → #role-ato`, `role-anz-sdl-2017 → #role-anz`, `role-anz-arch-2017 → #role-anz`, `role-myob-2010 → #role-myob`, `role-independent-2025 → #role-independent`. **These anchors already ship.** `Experience.tsx:156` renders ``id={`role-${role.id}`}`` on every role entry and `:107` already scrolls to them; the ids are defined at `app/data/portfolio/experience.ts:26,32,41,71`. **No change to `Experience.tsx` is required or permitted by this spec.** |
| repository | `repositories.<name>.htmlUrl` from the dataset | `https://github.com/Victordtesla24/aether-job-career-agent` |
| channel | `channel.videos.<id>.url` from the dataset | `https://www.youtube.com/watch?v=p9pGAmqJCSk`, `…?v=gMe4FZbjcQE`. An outbound link, **not** a player — R-118's facade rules bind embeds, and nothing is embedded here. |

The first draft proposed minting a parallel `#experience-{spanId}` scheme and changing
`Experience.tsx` to render it. That would give every role two ids for one thing — the divergence
SC-88.1 exists to prevent — and would gate this section behind an edit to a section it does not own.
It is deleted. TC-DIM-12 asserts the four in-page anchors resolve, and it passes against the tree as
it stands today.

`rel="noreferrer noopener"` and `target="_blank"` on external ties only, matching `About.tsx:47`.

### 3.4 The figures in `about.ts` — all four of them, disposed of one at a time

The first draft claimed `dimensions[0].evidence` carried "the one bare figure". It does not; four of
the ten `evidence` strings carry one. Each is dealt with here, and nothing is left to be inferred.

| # | shipped string (`about.ts`) | disposition |
|---|---|---|
| `[0]` Technical Skills | `'38 public repositories · ATO evidence harness · ANZ platform migrations'` | becomes `'Public repositories · the ATO evidence harness · the ANZ platform migrations'`. The figure is **deleted, not relocated.** The site's one bound instance of it already exists and stays where it is: `vitrine.ts:116-117` heads the section *"Six of thirty-eight"* over *"Thirty-eight public repositories exist"*, with `publicRepoCount` and `harvestedAt` read from the harvest. Repeating it here would be the same number in two places under two different provenances. |
| `[4]` Culture Fit | `'5+ squads, 40+ practitioners onshore and offshore'` | **kept verbatim.** It is now a summary line sitting directly above tie 05·role, which prints the same figures inside a row whose link resolves to the ANZ span, whose `data-caliper` is `self-reported` and whose kind column reads `ROLE · CV ONLY`. `encoding-grammar.md` §11 requires the caveat to travel *"in the same view, at the same prominence"*; it does, one line below. |
| `[7]` Career Growth | `'Langfuse + Phoenix evaluation stack · −38% simulated error-budget breaches'` | **kept verbatim.** The string already carries its own caveat — the word *simulated* — inside itself, which is §11's test. Tie 08·role restates it in full beneath. |
| `[8]` Company Stability | `'75+ hours of evidence against 64 available — escalated, then re-baselined'` | becomes `'75+ hours of manual evidence per team against 64 available — escalated, then re-baselined'`. The CV's own words are *"75+ hours of manual evidence **per team** against 64 available hours"*; dropping *manual* and *per team* changes what the ratio means. This is a **restoration of accuracy**, not a new claim. Dimension 09 is role-side and carries no tie, so this string is the only place the figure stands in `#about`; tie 10·role tells the same story about a different dimension and prints the full CV sentence. |

**The corrections ledger.** `scripts/build/feedback_log.mjs:34-36` harvests the ledger from git
history — a commit qualifies as a correction by its `fix(`/`perf(`/`refactor(` type or by naming a
review or finding. The ledger entry for this work is therefore **the commit message**, and it must
describe what actually changed: a figure removed from a prose line because the site's one bound
instance of it lives in the Vitrine, and a CV quotation restored to its own qualifying words. It
must **not** say the citation was broken or pointed at a repository root — that would write a
falsehood into the site's own history, which is an R-171 violation in the corrections ledger of all
places. §4 explains what the citation's real defect is.

### 3.5 The key beneath the plate

The shipped two-row `<dl>` becomes three rows, one per terminal form, each carrying **its glyph and
its words** (`encoding-grammar.md` §5, last bullet). `.keySwatch` gains a third variant. The two
solid swatches are **identically filled and identically bordered**; only the jaw ticks differ, which
is §2.1's rule drawn at 0.85 rem.

| `data-state` | swatch | words |
|---|---|---|
| `sourced` | solid 1 px `var(--steel)` border, `var(--plate-sector-fill)`, **plus** two 0.85 rem `var(--white)` jaw ticks inset 0.15 rem from each end | Something you can open — a repository or a channel item, linked below. |
| `self-reported` | solid 1 px `var(--steel)` border, `var(--plate-sector-fill)` — the same swatch, without the jaw ticks | The CV of record and nothing else. Take his word or check the PDF. |
| `open` | dashed 1 px `var(--steel)` border + the shipped 45° `repeating-linear-gradient` | Computed from the role, not the candidate. Nothing about a person to measure. |

Followed by one sentence, not a fourth key row:

> *"Inside the bezel, a tick for each kind of evidence: role to the left of the sector, repository at
> its centre, channel to its right. A kind with nothing behind it draws no tick."*

---

## 4 · R-172 — the citation, re-pinned, and the section's one gold mark

**What is already true, and must not be described as a defect.** `about.ts:115` reads

```
https://github.com/Victordtesla24/aether-job-career-agent/blob/main/apps/api/app/routers/jobs.py
```

That is a blob URL to the exact cited file, and it returns **HTTP 200** — verified with `curl` on
2026-09-03. It was fixed and deployed in this run (`DEPLOYMENT-LOG.md` ship 1, `4338ac2`).
`AUDIT-RECONCILIATION.md` C-8's *"links … to the repository root"* is stale; this spec does not
inherit it. R-172's own text — *"Cite it exactly, as the site already does"* — is about inherited
`aether-career-agent` **name** references, of which the audit found zero.

**The two defects that remain, and they are real:**

1. **The link is pinned to a moving branch.** `blob/main` resolves to whatever `main` points at when
   the reader clicks. `main` moved eight times in the fortnight before this run
   (`R184-flagship-ci-diagnosis.md`). A citation whose target can change under the reader is not a
   citation; the ten names on this page are asserted against a file that is free to stop containing
   them.
2. **There is no line anchor, and the path is unlinked text.** `About.tsx:50` renders
   `provenance.path` in a `<span>`. A reader who follows the link lands at the top of a 1,143-line
   file and has to search for the function the page is quoting.

**The fix.** `about.ts` `provenance` becomes:

```ts
provenance: {
  label: 'Dimensions taken verbatim from',
  repo: 'Victordtesla24/aether-job-career-agent',
  path: 'apps/api/app/routers/jobs.py',
  fn: 'build_fit_dimensions()',
  /** ALL of ref, line, blobSha and href come from the dataset — never authored. */
  sourceId: 'repositories.aether-job-career-agent.dimensionsSource',
}
```

**Dataset addition** — one field group on the existing `repositories` module, produced by
`scripts/dataset/sources/repositories.mjs` (extended; no new module, no new generated file):

```ts
export interface DimensionsSource {
  readonly path: Sourced<string>;        // 'apps/api/app/routers/jobs.py'
  readonly ref: Sourced<string>;         // commit sha on the default branch
  readonly blobSha: Sourced<string>;     // 40-hex blob sha of that file at that ref
  readonly line: Sourced<number>;        // 1-indexed line of `def build_fit_dimensions(`
  readonly fn: Sourced<string>;          // 'build_fit_dimensions'
  readonly names: Sourced<readonly string[]>;  // the ten, in file order
  readonly href: Sourced<string>;        // the deep link, composed, see below
}
```

Adapter, in order, each route becoming the field group's `provenance.method`:

1. `GET /repos/Victordtesla24/aether-job-career-agent/commits?sha=main&per_page=1` → `ref`.
   **Observed 2026-09-03:** `bb5f5f010c202d1b1811ebaba443f30290cb29b2`, committed 2026-09-02T20:59:41Z.
2. `GET /repos/Victordtesla24/aether-job-career-agent/contents/apps/api/app/routers/jobs.py?ref=<ref>`
   → `blobSha` (the response's `sha`) and the base64 body.
3. Decode; find the 1-indexed line whose text starts with `def build_fit_dimensions(` → `line`.
4. Extract `names` — **the parse strategy, stated, because it gates the build:**
   - Take the slice from `line` to the first subsequent line matching `/^(def |@|class )/` (i.e. the
     next top-level statement). Observed today: lines 226 → 319.
   - Apply `/_dimension\(\s*\n?\s*"([^"]+)"/g` over that slice and collect capture group 1 in order.
   - Assert the result has **exactly ten** entries. Fewer, more, or a call whose first argument is
     not a plain string literal (an f-string, a name, a concatenation) **fails the build** with the
     offending line printed. No fallback, no partial list, no regex that "usually works".
   - **Verified against the real file at `bb5f5f01`**, which yields, in order: `Technical Skills`,
     `Experience Level`, `Industry Match`, `Role Alignment`, `Culture Fit`, `Salary Fit`,
     `Location Match`, `Career Growth`, `Company Stability`, `North Star Align` — ordered-identical
     to `aboutContent.dimensions.map(d => d.name)`.
5. Compose `href = https://github.com/Victordtesla24/aether-job-career-agent/blob/<ref>/apps/api/app/routers/jobs.py#L<line>`.
   A `blob/<ref>` URL takes a **commit-ish**; a blob sha is not one, so the blob sha is *printed and
   independently verifiable* (`GET /git/blobs/<blobSha>`) rather than routed.

**Three build-stopping assertions** (`scripts/validate/dataset_integrity.mjs`):

- `names` ≡ `aboutContent.dimensions.map(d => d.name)` as an **ordered** sequence. R-168's *verbatim*
  becomes mechanically true instead of asserted. A rename upstream stops the build.
- `line` is whatever step 3 observed and is printed as observed. **Observed today: `226`.** If it
  moves, the build passes with a recorded drift note and prints the new line — never the stale one.
  The contract's `226` is an observation, not a constant.
- `blobSha` is printed as `blobSha.slice(0, 11)` of the **observed** value. **Observed today, in
  full: `038073350df86466c0838c0539d5c3d41bbd0fe6`** (fetched at `bb5f5f01` and re-derived locally as
  `sha1("blob " + bytelength + "\0" + bytes)`), so the printed short sha is `038073350df`. If the
  file changes, `names` still governs and the drift is recorded. The ellipsised `038073350df…` from
  the contract is **never** rendered as if it were complete.

**Failure policy** (`dataset-layer-design.md` §3.4): GitHub unreachable → the whole `repositories`
module degrades to `retained`, the previously observed `ref`/`line`/`blobSha` ship with their
original `retrievedAt`, and the citation still resolves. No path exists that fabricates a ref.

**Rendered, in the header, replacing `About.tsx:45-51`:**

```html
<p class="provenance">
  Dimensions taken verbatim from
  <a href="{href}" target="_blank" rel="noreferrer noopener"
     data-mark-id="about.citation" data-gold="true"
     data-source-id="repositories.aether-job-career-agent.dimensionsSource"
     data-caliper="sourced" data-retrieved-at="{retrievedAt}">
    <Caliper state="sourced">
      Victordtesla24/aether-job-career-agent · apps/api/app/routers/jobs.py ·
      build_fit_dimensions() · L{line} · blob {blobSha.slice(0,11)}
    </Caliper>
  </a>
</p>
```

The path is now **inside the link**, which closes defect 2 above; the `<span class="provenancePath">`
at `About.tsx:50` goes away with it. TC-ABOUT-04 — which asserts a visible
`a[href*="aether-job-career-agent"]` and the string `apps/api/app/routers/jobs.py` somewhere in
`#about` — keeps passing, because both are still there and the second is now inside the first.

**This is the one gold mark in `#about`** (`encoding-grammar.md` §3.1, §12 prohibition 2;
`design-system-lock.md` §1.3, §1.4 rules 2–3). It is a `<Caliper state="sourced">` — the site's
**first rendered `sourced` caliper**, closing C-3 from data rather than by inventing one. Gold
geometry: the two 1 px caliper arms plus the link underline, `var(--gold)` at 8.62:1 on `--ink-900`
— a hairline and an inline link, both permitted by `design-system-lock.md` §1.4 rule 2. **No other
element in `#about` may carry `data-gold` or compute any `--gold*` token, in any state, including
while a sector is pinned, while a filter is applied and while the probe of §5.4 is open.** §3.2's
decision that the rail draws no caliper bracket is what makes this true rather than merely intended.
TC-DIM-06 asserts count === 1 in every state; TC-DIM-22 asserts zero gold anywhere inside the plate.

---

## 5 · Interaction — R-97's four depths

### 5.1 Hover reveal

Pointer over, or focus within, a sector control **or** a list item sets `active = i`:

- the rose rotates so sector `i` sits under the index at twelve o'clock (shipped mechanism,
  `Compass.tsx:122`, `680ms var(--motion-ease-emphasized)` → retokenised to
  `var(--motion-cine-in)` = 720 ms, `design-system-lock.md` §4.2);
- `.sectorFill` lifts to `var(--plate-sector-fill-lit)`, `.tieTick` opacity 0.62 → 1.0, `.numeral` →
  `var(--white)` @ 1.0 (all shipped patterns). **`.sectorArc` does not change stroke width or
  colour** — the lit fill and the numeral carry the reading position, and leaving the arc alone
  keeps §2.1's guarantee true in every state as well as at rest;
- the hub readout fills; the caption fills; the item's rail rows raise `var(--mist-400)` →
  `var(--white)`; the other nine items drop to `opacity: 0.45`.

**Nothing appears that was not already legible.** Every tie, every date, every link and every
"no evidence" sentence is in the DOM and visible before any interaction — `encoding-grammar.md`
§3.2 clause 3, the rule that keeps the section honest to a crawler, a screen reader and a printout
at once. There is no disclosure widget anywhere in this section.

### 5.2 Focus and zoom

`Enter` / `Space` on a sector control **pins** it (`data-pinned={i}`) and zooms the plate.

Because the rose has already carried the pinned sector to θ = 0, **one constant frames all ten**.
The frame is derived over the radius band the zoom exists to reveal — **out to r 46.2, which is where
`.tieLabel`'s ink ends** (baseline r 45.4, cap height 0.86 px ⇒ outer ink 45.83, rounded up), not
merely to `BEZEL_INNER`:

```
wedge bbox at θ=0, r ∈ [22, 46.2], θ ∈ [−17.9, +17.9]
  x: 50 ± 46.2·sin17.9° = 35.800 … 64.200   (w 28.400)
  y: 50 − 46.2          = 3.800   (top, at θ=0)
     50 − 22·cos17.9°   = 29.065  (bottom, at θ=±17.9)   (h 25.265)
  centre (50, 16.4325) ;  side = max(28.400, 25.265) × 1.06 = 30.104 → 30.10
ZOOM_BOX = 34.95 1.38 30.10 30.10
```

`viewBox` is not CSS-animatable, so the zoom is a **compositor-safe transform on a `<g class="stage">`
wrapper** — no `requestAnimationFrame`, no layout property, 60 fps by construction:

```css
.stage { transform-box: view-box; transform-origin: 50px 50px;
         transition: transform var(--motion-base) var(--motion-ease-emphasized); }
.stage[data-zoomed] { transform: scale(3.3223) translate(0px, 33.57px); }
```

`3.3223 = 100 / 30.10`. `translate` applies first, carrying the wedge centre `(50, 16.4325)` to
`(50, 50)`; the scale then acts about `(50, 50)`. Verified for the four extreme points of the framed
wedge — the two outer bezel corners at `(θ=±17.9, r=47.0)` land at `(2.0 … 98.0, 12.93)` and the two
inner corners at `(θ=±17.9, r=22)` land at `(27.5 … 72.5, 91.98)`; every one is inside `0…100`, so
nothing the zoom is meant to show is clipped by `.compass { overflow: hidden }`.

Two counter-scales keep type at its designed optical size (stage 384 px ⇒ 12.758 CSS px per viewBox
unit while zoomed):

- `.stage[data-zoomed] .numeral { font-size: 0.93px; }` → 0.93 × 3.3223 = 3.09 px effective, i.e.
  the shipped 3.1 px, unchanged to the eye.
- `.tieLabel` — mono, `font-size: 0.86px` → 0.86 × 12.758 = **10.97 CSS px** on a 384 px stage — is
  `opacity: 0` at rest and `opacity: 1` while zoomed, set at `polar(θᵢ ± 9 or θᵢ, 45.4)`, text-anchor
  `middle`, counter-rotated by `−rotation` like the numerals. Strings: `ROLE`, `REPO`, `CHAN`.

**The graduations clear the band while zoomed.** `.tieLabel` sits at r 45.4, which is inside the
43.2 → 47.0 graduation band, and every tenth graduation is a **major** at exactly `θᵢ` — directly
under `REPO`. So `.stage[data-zoomed] .tick, .stage[data-zoomed] .tickMajor { opacity: 0; }`, on the
same `var(--motion-base)` transition. The graduations are `aria-hidden` atmosphere carrying no datum
(§7), the two bezel circles stay and frame the labels like an engraved legend, and nothing
informational is lost.

**The readout is hidden, not "off-screen".** `.readNumber`, `.readState` and `.index` are siblings of
`.stage` (§7) and therefore do **not** transform; left alone they would sit dead-centre over the
magnified wedge. So `.plate[data-zoomed] .index, …[data-zoomed] .readNumber, …[data-zoomed] .readState
{ opacity: 0; }`, again on `var(--motion-base)`. Their two strings are duplicated in the
`<figcaption>` as real HTML type, which is where a screen reader was reading them from anyway.

**This is the payoff that makes zoom non-decorative:** the tie ticks become directly labelled, which
is the form `encoding-grammar.md` §5 prefers and which the resting scale cannot afford. The
information is not *only* here — it is in the list, the caption and every `aria-label` — so §3.2
clause 3 holds.

`Escape` unpins, restores the resting transform and keeps focus on the sector.

### 5.3 Filtering / drill-down

Four `<button>`s in a `<div role="group" aria-label="Filter the ten dimensions">`, placed **between
the header and the two-column body**, full width — so DOM order, visual order and focus order are the
same order (§6, §7):

| button | shows | count |
|---|---|---|
| `All ten` (default, `aria-pressed="true"`) | everything | 10 |
| `Evidence you can open` | `terminalForm === 'sourced'` | 2 |
| `CV only` | `terminalForm === 'self-reported'` | 5 |
| `Computed from the role` | `side === 'role'` | 3 |

Non-matching list items get `hidden`. Non-matching sectors get `opacity: 0.28` — **they are never
removed and never lose their terminal form**, and the distinction matters: this dim means *filtered
out of the current view*, never *no evidence* (`encoding-grammar.md` §12 prohibition 8). Asserted by
TC-DIM-09.

One polite live region, the only one in the section:

```html
<p role="status" class="filterCount">Showing 2 of 10 · dimensions with evidence you can open</p>
```

The caption and hub readout are **not** live regions — they change on every hover and would make the
section unusable with a screen reader (the Bench's ruling, `SPEC-skills-topology.md` §9, preserved).

### 5.4 The one curiosity-rewarding state — the probe

A `<button class="hubProbe">`, centred on the hub, `4.4rem` diameter (70.4 px ≥ the 44 px target
floor, and inside the hub's own 97.9 px diameter at the 17 rem mobile plate), transparent so the
readout beneath stays legible, in the non-rotating overlay layer, accessible name **"Show where the
ten names come from"**, `aria-expanded`, `aria-controls="about-probe"`.

Activating it:

- swaps the caption block for `#about-probe`, a four-line mono panel at `var(--fs-caption)`:
  `build_fit_dimensions()` / `apps/api/app/routers/jobs.py` / `L{line} · blob {shortSha}` /
  `Victordtesla24/aether-job-career-agent` — **all four from the dataset, none gold** (the gold
  citation in the header remains the section's only gold mark);
- sets `data-probe` on the plate, which draws **all ten numerals in `var(--white)` at opacity 1
  simultaneously** and lengthens the ten major bezel graduations from `+3.8` to `+5.2` units;
- sets the hub readout to `— / 10 ARGUMENTS`.

The instrument shows its whole scale at once, and the reader discovers that the ten axes are not ten
opinions — **they are the arguments of a function, all equal, none ranked.** That is the single most
surprising true thing in the section, and it is the thing a sceptical reader most wants to test.
`Escape` closes it. The probe and the zoom are mutually exclusive states: opening one closes the
other, so the lengthened graduations of §5.4 and the faded graduations of §5.2 can never both apply.

---

## 6 · The keyboard model (R-101 §9.1) — complete

**Tab order follows DOM order, and DOM order follows visual order.** No positive `tabindex` exists
anywhere in this section; the order below is achieved by writing the elements in this sequence,
which §7's DOM does.

1. the gold citation `<a>` (§4) — last element of `<header>`
2. the four filter buttons — the `role="group"` immediately after `<header>`
3. the hub probe button — first focusable child of `<figure>`
4. **the sector group — one tab stop**, roving `tabindex` over ten controls
5. the list, in order 01…10: each rail row's `<a>` is a natural stop; `<li>` elements are **not**
   focusable — `About.tsx:96`'s `tabIndex={0}` on the `<li>` is **removed**, because a non-interactive
   container that takes focus is a WCAG 2.2 anti-pattern and now duplicates the sector group.
   `onFocus` / `onBlur` stay on the `<li>` (focus events bubble), so focusing any tie link still
   indexes the plate to its dimension.

The probe precedes the sectors in the DOM. Both are absolutely positioned overlays, so paint order
is set by `z-index` in `Compass.module.css` (`.sectors` above `.hubProbe`), not by document order —
which is why the reading order and the focus order can agree without a `tabindex` hack. This is the
contradiction the first draft left unresolved between its own §6 and §7; it is resolved by ordering
the markup, and asserted by TC-DIM-24.

**Sector controls.** Ten `<button>`s in a `role="group"` overlay, absolutely positioned at the
sector centroid radius **31.5** (= (22 + 41) / 2), inside a container carrying the rose's own
`rotate(rotation)` and each control counter-rotated by `−rotation` (the shipped numeral trick,
`Compass.tsx:200`). Circular hit target: `3.4rem` desktop, `2.75rem` (= 44 px, the WCAG 2.2 AA
floor) at ≤ 900 px. At a 17 rem (272 px) mobile plate the centroid circle has radius
0.315 × 272 = 85.68 px, so adjacent centres are `2 × 85.68 × sin 18° = ` **52.95 px** apart —
comfortably more than 44, so the targets do not overlap.

Precomputed centres, in per-cent of the stage box — `left: X%`, `top: Y%`, `translate(−50%, −50%)`:

| i | θ | X% | Y% |
|---|---|---|---|
| 0 | 0 | 50.000 | 18.500 |
| 1 | 36 | 68.515 | 24.516 |
| 2 | 72 | 79.958 | 40.266 |
| 3 | 108 | 79.958 | 59.734 |
| 4 | 144 | 68.515 | 75.484 |
| 5 | 180 | 50.000 | 81.500 |
| 6 | 216 | 31.485 | 75.484 |
| 7 | 252 | 20.042 | 59.734 |
| 8 | 288 | 20.042 | 40.266 |
| 9 | 324 | 31.485 | 24.516 |

Nothing is measured at runtime, so nothing reflows after paint: **CLS contribution 0.00**.

| key | action |
|---|---|
| `ArrowRight` / `ArrowLeft` | next / previous dimension in the engine's order, wrapping |
| `ArrowDown` / `ArrowUp` | next / previous dimension **of the same terminal form**, wrapping — the fastest way to walk "the two you can open", and it teaches the encoding by using it |
| `Home` / `End` | dimension 01 / dimension 10 |
| `Enter` / `Space` | pin and zoom (§5.2) |
| `Escape` | unpin, unzoom, close the probe; focus stays on the current sector |
| `Shift`+`Tab` from the first control | leaves the group upward — **no trap, anywhere** |

No single-letter shortcuts are bound; they collide with assistive-technology browse mode. Focus ring
is the shipped treatment, `outline: 2px solid var(--white); outline-offset: 4px`
(`About.module.css:158-160`).

---

## 7 · ARIA structure (R-101 §9.2)

```html
<section id="about" aria-labelledby="about-title">
  <header>… kicker, h2#about-title, two ledes, the gold citation …</header>

  <div role="group" aria-label="Filter the ten dimensions">… four buttons …</div>
  <p role="status" class="filterCount">Showing 10 of 10 · every dimension</p>

  <div class="body">
    <figure data-viz-id="about.dimension-plate"
            aria-labelledby="about-plate-title" aria-describedby="about-desc">
      <h3 id="about-plate-title" class="visually-hidden">
        Ten dimensions, drawn by what kind of evidence stands behind each answer
      </h3>
      <p id="about-desc" class="plateDesc">…the insight sentence, §8…</p>

      <button type="button" class="hubProbe" aria-expanded="false" aria-controls="about-probe">
        <span class="visually-hidden">Show where the ten names come from</span></button>

      <div class="sectors" role="group"
           aria-label="Ten dimensions on an instrument face. Use the arrow keys to move between them.">
        <button type="button" tabindex="0|-1" data-index="0"
                data-form="sourced" data-side="candidate"
                aria-label="Dimension 1 of 10, Technical Skills. Computed from the candidate.
                            Evidence: one role, one repository and one channel item.
                            Measured; source given."
                aria-describedby="about-tick-0">…</button>
        <span id="about-tick-0" class="visually-hidden">Ticks drawn: role, repository, channel.</span>
        …
      </div>

      <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <g class="stage"><g class="rose"> …bezel, graduations, sectors, jaws, tie ticks, numerals,
                                          tie labels… </g></g>
        <g class="index">…</g><text class="readNumber">…</text><text class="readState">…</text>
      </svg>

      <figcaption class="caption">…name-or-“Ten axes · no scores” / kinds / takeaway…</figcaption>
      <dl class="key">… three terminal forms, glyph + words …</dl>
    </figure>

    <ol class="list">… ten items, each with its rail …</ol>
  </div>
</section>
```

- The `<svg>` is written **after** the two interactive overlays and painted **beneath** them
  (`z-index`), so DOM order can serve the focus order of §6 while the visual stacking is unchanged.
- The SVG is `aria-hidden` **in its entirety** — bezel, graduations, hatches and rules are structure
  and atmosphere, and every datum they carry is on a real focusable control or in the list
  (`Experience.tsx:79,136` precedent, `encoding-grammar.md` §9.2).
- **Every accessible name carries its value and its units**: the dimension's ordinal and total, its
  side, which kinds of evidence exist, and the **caliper gloss verbatim** — `Measured; source given.`
  / `Self-reported figure.` / `Not measurable; reason given.` (`Caliper.tsx:44-46`). A mark that only
  exists visually makes no claim at all to everyone else (`Caliper.tsx:36-38`). This is also how the
  `sourced` / `self-reported` distinction reaches a reader who cannot see the jaw pair.
- The three role dimensions keep the shipped inline `<Caliper state="open">measured from the role</Caliper>`
  on their `<h3>`, with `label` unchanged (`About.tsx:107-114`). R-168, intact.
- One polite live region in the section: `.filterCount`. Asserted by TC-DIM-16.

---

## 8 · The dual read (R-99) and the text alternative (R-101 §9.3)

**3-second headline.** Ten equal sectors. Three are hatched and open at their corners; seven are
engraved and plain; two of those seven carry closed caliper jaws. Eleven ticks in the bezel gutter,
and one gold mark in the header above.

**30-second detail.** Each sector's form says which of the three kinds of evidence stands behind its
answer; the gutter ticks say which artefacts exist; the list beneath prints the answer, the linked
role, repository and channel item with their real dates, and — where nothing exists — one sentence
saying so.

**The caption.** `<figcaption>` carries three things: at rest the shipped string **`Ten axes · no
scores`**, verbatim and unchanged, replaced on hover or focus by the active dimension's name and its
kinds; then the hub readout's two strings as real type; then the takeaway line. The rest string is
kept because it is R-168's refusal printed on the instrument, and because `about.spec.ts:107`
(TC-ABOUT-07) asserts `#about` contains it — a test this spec must not break and has no business
weakening.

**Takeaway line** (16 words, `≤ 20`), sitting with the artefact in `<figcaption>`:

> **Ten dimensions the engine scores. Three are not about me. Two have something you can open.**

**`#about-desc`, the insight-equivalent text alternative** — real text on the page, not behind a
toggle, and it states the shape, the extreme and the comparison:

> *Ten equal sectors, one per dimension, in the engine's own order. Three are drawn open over a 45°
> hatch because the engine computes them from the role and there is nothing about a person to
> measure. Five are engraved but plain: the only evidence behind them is the CV of record. Two carry
> closed caliper jaws, because they have a repository or a channel item you can open — Technical
> Skills and North Star Align. No sector is longer, wider or brighter than another, because there is
> no score to draw.*

The full record — ten answers, eleven linked artefacts, six honest gaps — is the visible list. The
accessible equivalent and the visible page are the same artefact (`encoding-grammar.md` §9.3).

---

## 9 · Motion, and the reduced-motion composition (R-101 §9.4)

All tokens from `design-system-lock.md` §4.2. **No new motion token is introduced.** The shipped
literal `680ms` (`Compass.module.css:24`) is retokenised to `var(--motion-cine-in)` (720 ms).

**Entrance**, one-shot, `IntersectionObserver` at `threshold: 0.15`, `observer.disconnect()` on
first hit (the `Bench.tsx:189-207` pattern), total **1,400 ms**:

| beat | window | what |
|---|---|---|
| 1 | 0 – 440 ms | the two bezel circles draw, `pathLength="1"`, `stroke-dashoffset: 1 → 0`, `var(--motion-emphatic)` (440 ms) `var(--motion-ease-emphasized)`; the 100 graduations fade as **one group**, not 100 elements |
| 2 | 320 – 1,400 ms | the ten `.sectorArc` paths draw in index order, `stroke-dashoffset: 1 → 0`, `var(--motion-cine-in)` (720 ms), stagger 40 ms |
| 3 | 900 – 1,280 ms | `.jaw`, `.tieTick` and `.numeral` fade `opacity: 0 → 1`, `var(--motion-base)` (320 ms), stagger `var(--stagger-tight)` (60 ms) |

`data-drawn` is set at 1,500 ms and applies `animation: none` to every animated element, so a
resize, a re-render or a font swap can never replay the entrance.

**Final values render on first paint.** Only `stroke-dashoffset` and `opacity` animate; **no element
in the plate is transformed during the entrance** — `.rose` carries its resting `rotate(rotation)`
and `.stage` carries no transform at all until a sector is pinned. No coordinate, ordinal, date or
count ever passes through a value it is not (R-175, `encoding-grammar.md` §2.4). The numerals' text
content is server-rendered.

**Reduced motion is a re-score, not a mute** (`design-system-lock.md` §4.3). The shipped block
(`Compass.module.css:176-184`) already states the right intent for the rose — *"the face still
points — that is information, not decoration. It arrives rather than travels."* Generalise it:

```css
@media (prefers-reduced-motion: reduce) {
  /* 2 · instant-state truth — the face and the zoom arrive, they do not travel */
  .rose, .stage { transition: none; }
  .bezel, .bezelInner, .sectorArc, .jaw, .tieTick, .numeral { animation: none; }

  /* 1 · sequenced opacity — order and stagger survive, travel does not */
  .plate[data-drawn] .tieTick,
  .list[data-drawn] .railRow {
    animation: aboutFade var(--motion-fast) linear both;
    animation-delay: calc(var(--i) * 40ms);
  }

  /* 3 · colour and border transitions survive — the primary affordance signal */
  .sectorFill, .numeral, .railRow a {
    transition: fill var(--motion-fast) var(--motion-ease-standard),
                color var(--motion-fast) var(--motion-ease-standard);
  }
}
```

`.sectorArc` is absent from the surviving-transition list on purpose: nothing about it changes on
hover any more (§5.1), so a transition on it would be a rule with no state to interpolate.

The reduced composition is a **different arrangement of the same piece**: every sector, jaw, tick,
numeral and rail row is at its final position and opacity on first paint; the eleven ticks and the
rail rows still arrive in order on a 40 ms stagger, losing only travel; the plate still indexes to
the dimension being read and still zooms, by cut rather than sweep. It is a printed plate rather
than a stopped film.

**Degraded states** (`encoding-grammar.md` §9.5), all three designed:

- **JavaScript failed** — the entire figure is server-rendered markup. Ten sectors in their terminal
  forms, eleven ticks, ten numerals, the key, the citation, all ten answers, all eleven tie links
  and all six gap sentences render. Only hover, the roving-tabindex traversal, zoom, the probe and
  the filters are lost — the filters degrade to "all ten shown", which is the default and the truth.
- **No WebGL** — not applicable; render class is `svg`. `#about` renders **zero** `<canvas>`
  elements, in every condition, because it contains no `<Scene>`. This is a property of the section,
  not of the capture harness: `AUDIT-RECONCILIATION.md` §F withdrew C-2 after confirming that the
  hero and Experience each render one canvas under `reducedMotion: 'no-preference'` on a real GPU.
  About renders none either way, which is why TC-ABOUT-07's `toHaveCount(0)` is safe to keep.
- **Data unavailable** — impossible at runtime; the terminal forms are derived at build. A module
  refresh failure degrades to `retained` (`dataset-layer-design.md` §3.4) and the rail prints the
  retained `retrievedAt`, so the reader is told the dates are from the previous harvest rather than
  shown a fresh-looking stale plate.

---

## 10 · Performance envelope (R-100)

| Budget | Target | How it is met |
|---|---|---|
| fps, everything active | ≥ 60 | ≈ 190 SVG elements; only `transform`, `opacity`, `fill` and `stroke-dashoffset` animate; **zero** layout-triggering properties; zero `requestAnimationFrame`; zero runtime simulation |
| lazy init | yes | one `IntersectionObserver`, `threshold: 0.15`, disconnected on first intersection |
| full disposal | yes | on unmount: `observer.disconnect()`, the `matchMedia` listener removed, the `data-drawn` timer cleared; every pointer and key handler is React-managed. **Zero** `ResizeObserver`, zero RAF loop, zero timer after `data-drawn` |
| **declared memory ceiling** | **≤ 1.5 MB** JS heap delta while mounted | no image, no texture, no 3D runtime; the component's state is one integer, one nullable integer and one boolean |
| CLS contribution | **0.00** | the stage has a fixed `aspect-ratio: 1`; the ten controls are positioned from the precomputed table in §6; nothing is measured, so nothing reflows after paint |
| LCP | unaffected | `#about` is below the fold; the section contains no image and no font beyond the three already loaded |
| runtime bundle delta | ≈ 2.6 KB gzip component + 0 KB data (the crosslinks are ids in `about.ts`) | no new dependency; **a runtime `d3` import in `#about` is a build failure** (the `no-restricted-imports` list from `SPEC-skills-topology.md` §13 already covers `app/` and `components/`) |
| WebGL contexts | **0** | R-170's one-context-per-section posture is unaffected; this section never had one and does not gain one |

---

## 11 · Files

**Depends on — must already exist; this spec creates none of them** (§0.1)
```
app/data/canonical/{provenance.ts,selectors.ts,dossiers.ts,schema/,generated/}
scripts/dataset/{build_dataset.mjs,sources/repositories.mjs,sources/cv.mjs,sources/channel.mjs}
scripts/validate/dataset_integrity.mjs
public/dataset-provenance.json
reports/viz-perf.json
```

**Create**
```
components/sections/About/EvidenceRail.tsx
components/sections/About/EvidenceRail.module.css
components/sections/About/useDimensionKeyboard.ts
tests/e2e/about-dimensions.spec.ts
```

**Change**
```
app/data/portfolio/about.ts               provenance → {label, repo, path, fn, sourceId} (§4);
                                          each Dimension gains evidenceRefs + gap (§3.1, §3.2);
                                          dimensions[0].evidence loses its raw figure and
                                          dimensions[8].evidence regains "manual … per team" (§3.4);
                                          add takeaway, insight, keyCopy, filterCopy, probeCopy
components/sections/About/About.tsx        header citation → gold Caliper link, path inside the
                                          link, .provenancePath span deleted (§4);
                                          add figure/figcaption/#about-desc scaffold (§7);
                                          add the four filters + role="status" line, between the
                                          header and .body (§5.3, §7);
                                          add <EvidenceRail> per item;
                                          add data-answer / data-evidence to the two shipped <p>s;
                                          REMOVE tabIndex={0} from <li> (§6); keep onFocus/onBlur
components/sections/About/Compass.tsx      three terminal forms (§2.1); tie ticks (§2.2);
                                          .stage wrapper + ZOOM_BOX transform (§5.2);
                                          the ten sector controls + roving tabindex, written
                                          AFTER the probe and BEFORE the <svg> (§6, §7);
                                          the hub probe (§5.4); readState vocabulary (§2.3);
                                          DELETE the stale gold doc-comments at :78 AND :211
components/sections/About/Compass.module.css   the §2 form/tick/zoom/probe rules;
                                          680ms → var(--motion-cine-in);
                                          overflow: visible → hidden;
                                          z-index order .sectors > .hubProbe > svg (§6);
                                          the §9 reduced-motion re-score
components/sections/About/About.module.css     .provenance gold treatment; .filters/.filterCount;
                                          three-state .keySwatch (§3.5); .sectors overlay;
                                          mobile plate 14rem → 17rem; .lede 52ch → var(--measure-read)
app/globals.css                            add --plate-sector-fill: rgb(244 246 250 / 0.022);
                                          --plate-sector-fill-lit: rgb(244 246 250 / 0.075)
                                          (the two shipped literals from Compass.module.css:67,85,
                                           tokenised — no third value is invented; raw values live
                                           only here and in lib/palette.ts, design-system-lock §1.4 r.1)
app/data/canonical/selectors.ts            add selectDimensionEvidence(), selectDimensionsSource()
app/data/canonical/schema/repositories.ts  add DimensionsSource (§4)
scripts/dataset/sources/repositories.mjs   the five-step citation adapter (§4), and pythonTestFiles
scripts/validate/dataset_integrity.mjs     the three §4 build-stopping assertions
app/data/canonical/dossiers.ts             add the about.dimension-plate dossier (§13)
tests/e2e/about.spec.ts                    amend TC-ABOUT-02, TC-ABOUT-03 and TC-ABOUT-06 (§12)
```

**Delete** — nothing. The instrument is extended in place; the preservation diff shows no removed
component, no removed CSS module and no removed content field.

**Not touched** — `components/sections/Experience/Experience.tsx`. Its `#role-*` anchors already
ship (§3.3).

### 11.1 Types — `app/data/portfolio/about.ts`

```ts
export type EvidenceKind = 'role' | 'repository' | 'channel';
export type TerminalForm = 'sourced' | 'self-reported' | 'open';   // === CaliperState

/** EDITORIAL. Ids and authored prose only — never a URL, never a date, never a figure. */
export interface EvidenceRef {
  readonly kind: EvidenceKind;
  /** cv role id | repository name | youtube video id. Must resolve in the canonical dataset. */
  readonly ref: string;
  /** What this artefact proves about this dimension. Authored. One or two sentences. */
  readonly what: string;
}

export interface Dimension {
  readonly name: string;                 // verbatim from the product. Never paraphrase.
  readonly side: 'candidate' | 'role';
  readonly answer: string;
  readonly evidence: string;             // the shipped summary line, kept (§3.4)
  readonly evidenceRefs: readonly EvidenceRef[];   // 0..3, at most one per kind
  /** Printed where the missing ties would be. Required when evidenceRefs.length < 3. */
  readonly gap: string;
}
```

### 11.2 Types — `app/data/canonical/selectors.ts`

```ts
export interface ResolvedTie {
  readonly kind: EvidenceKind;
  readonly label: string;          // printed from the dataset's verbatim strings, never re-typed
  readonly what: string;           // from EvidenceRef
  readonly href: string;           // '#role-anz' | an https URL
  readonly external: boolean;      // true iff href starts with 'https://'
  readonly caliper: CaliperState;  // derived by dataset-layer-design.md §5.2
  readonly grade: 'OPENABLE' | 'CV ONLY';   // the word printed in the kind column (§3.2)
  readonly sourceId: string;
  readonly retrievedAt: Iso8601;
}

export interface DimensionEvidence {
  readonly index: number;                       // 0..9
  readonly terminalForm: TerminalForm;          // derived, §2.1 — throws on the illegal case
  readonly ties: readonly ResolvedTie[];        // in fixed kind order: role, repository, channel
  readonly kinds: readonly EvidenceKind[];      // which ticks to draw
  readonly gap: string | null;
}

export function selectDimensionEvidence(): readonly DimensionEvidence[];   // length 10, memoised
export function selectDimensionsSource(): MarkBinding<DimensionsSource>;
```

### 11.3 The rail's DOM — `EvidenceRail.tsx`

```html
<ul class="rail" aria-label="Evidence for Technical Skills">
  <li class="railRow" data-kind="role" style="--i:0">
    <span class="railKind">ROLE · CV ONLY</span>
    <a href="#role-ato"
       data-mark-id="about.d01.role" data-source-id="cv.roles.role-ato-2026.title"
       data-caliper="self-reported" data-retrieved-at="…">
      Scrum Master / Project Manager · Australian Taxation Office (ATO) · March 2026 - Present
    </a>
    <p class="railWhat">The COBOL/mainframe test-evidence toolchain — REXX, SMF, SDSF, PCOMM,
       PowerShell, VBA — across 200+ SIT/E2E scenarios.</p>
  </li>
  …
</ul>
<p class="railGap">No repository and no channel item evidences how long a career is.</p>
```

The connector art is **CSS, not SVG**: a 1 px `.rail::before` vertical spine in
`var(--token-border-default)` spanning the first row to the last, and a 1 px `.railRow::before`
horizontal stub. Hairlines in `currentColor`, crisp at every DPR, no scaling, no measurement
(`encoding-grammar.md` §7, `Drawings.tsx:16-18` house style).

**There is no `railRow` for a missing kind** — no empty cell, no dimmed row, no placeholder
(§12 prohibition 8). One `.railGap` sentence carries the absence.

**No `<Caliper>` is rendered inside the rail** (§3.2). `.railKind` carries the grade word.

---

## 12 · Tests

`tests/e2e/about-dimensions.spec.ts` is new. `tests/e2e/about.spec.ts` is amended in three places
and the amendments are stated here rather than discovered at run time — the first draft called five
of its tests untouched and two of those provably break.

**Untouched, and verified to keep passing against the new DOM:**

- **TC-ABOUT-01** — `#about ol li h3` still yields exactly ten headings; the rail's `<li class="railRow">`
  carry no `<h3>`.
- **TC-ABOUT-04** — `a[href*="aether-job-career-agent"]` is the citation and is visible;
  `apps/api/app/routers/jobs.py` is still inside `#about`, now inside the link rather than beside it.
- **TC-ABOUT-05** — `ol li[data-side="role"]` is still exactly 3; rail rows carry `data-kind`, never
  `data-side`.
- **TC-ABOUT-07** — ten `ol li` at the top level; **zero** `#about canvas` (the section mounts no
  `<Scene>`, in any GPU or reduced-motion condition); and `#about` still contains the exact string
  **`Ten axes · no scores`**, which §8 keeps as the `<figcaption>`'s rest state. *The first draft
  replaced `.instrumentCaption` without carrying this string and then declared the test untouched;
  the string is kept instead, because it is R-168's refusal printed on the instrument and deleting a
  truth to pass a redesign is the R-171 failure this run exists to avoid.*

**Amended, with the reason:**

- **TC-ABOUT-02** — currently asserts exactly two `<p>` per `<li>` (`:49`); the rail adds more.
  Amend to `li > .itemBody > p[data-answer]` length > 40 and `li > .itemBody > p[data-evidence]`
  length > 10, per item, and drop `toHaveCount(2)`. **`About.tsx` adds those two attributes** (§11)
  — the first draft named selectors it never created.
- **TC-ABOUT-03** — currently scopes answers with `#about ol li p:first-of-type` (`:65`), a
  descendant combinator that now also matches `.railWhat`, whose tie-08 copy contains **"38%"**. The
  test's own comment at `:57-63` says the scope is meant to be *"the headings and the answers, not
  the evidence lines"* and that a sourced figure like the −38% *"is exactly the kind of number this
  site wants"*. Amend the selector to the child chain `#about ol > li > .itemBody > p[data-answer]`,
  which expresses the intent the comment already states, and **add** an assertion that makes the test
  stronger rather than weaker: every `.railWhat` containing `/\d{1,3}\s?%/` must also contain
  `simulated` or `measured` in the same element (`encoding-grammar.md` §11's caveat-travels rule,
  now enforced).
- **TC-ABOUT-06** — currently focuses the `<li>` itself (`:97`), which §6 makes non-focusable.
  Amend to focus the first sector control and assert `[data-index="0"]` is focused and
  `#about ol > li:first-child` carries `data-active="true"`.

| id | assertion |
|---|---|
| **TC-DIM-01** | `#about [data-form]` = 10; `[data-form="sourced"]` = 2, `[data-form="self-reported"]` = 5, `[data-form="open"]` = 3; the two sourced controls are dimensions 1 and 10 |
| **TC-DIM-02** | `#about svg .jaw` = 4 (two per sourced sector) and **zero** jaws sit inside a `[data-form="open"]` or `[data-form="self-reported"]` group; `.rule` count = 21 (3 × the 7 non-open sectors) |
| **TC-DIM-03** | `#about svg .tieTick` = **11**; per dimension the tick count equals its rail-row count; **no tick exists for a kind with no rail row** |
| **TC-DIM-04** | *(offline)* every `.railRow a[href^="https://"]` is byte-equal to the `htmlUrl` / `url` its `data-source-id` names in `/dataset-provenance.json`, and matches `^https://(github\.com/Victordtesla24/[\w-]+\|www\.youtube\.com/watch\?v=[\w-]{11})$`. Liveness is **not** re-checked here: the dataset adapter fetched each resource and stamped `retrievedAt`, and re-fetching YouTube and GitHub unauthenticated on every CI run would flake by design (the corpus records YouTube bot-gating; GitHub allows 60 req/hr anonymous). |
| **TC-DIM-04N** | *(tagged `@network`, nightly project only, never gating a PR)* every external tie href and the citation href return HTTP 200 with a token when one is present, and the failure is reported as a data-staleness alert, not a test failure |
| **TC-DIM-05** | the citation `<a>`'s `href` matches `^https://github\.com/Victordtesla24/aether-job-career-agent/blob/[0-9a-f]{40}/apps/api/app/routers/jobs\.py#L\d+$` — a **40-hex commit sha**, never `main`; and its `#L` number equals `dimensionsSource.line` from `/dataset-provenance.json` |
| **TC-DIM-06** | `#about [data-gold="true"]` = **exactly 1**, and it is the citation; **no element inside `#about` other than that link and its two caliper arms computes any `--gold*` value** — asserted at rest, with a sector focused, with a sector pinned and zoomed, with each of the four filters applied, and with the probe open |
| **TC-DIM-07** | the citation renders a `<Caliper state="sourced">`; `#about [data-state="sourced"]` = 1 — **the site's first rendered `sourced` caliper** (closes C-3); the printed blob short-sha matches `/^[0-9a-f]{11}$/` and is a prefix of `dimensionsSource.blobSha` from `/dataset-provenance.json`; it is **never** the literal `038073350df…` with an ellipsis |
| **TC-DIM-08** | **no proficiency channel, and no calibration ramp.** (a) every `.sectorFill` path `d` is congruent — identical arc radii, identical sweep; (b) the ten `.sectorArc` elements compute **exactly one** distinct `stroke-width` and **exactly one** distinct `stroke`, at rest and with any sector active; (c) the seven non-open `.sectorFill` compute **exactly one** distinct `fill`, and the `sourced` and `self-reported` values are string-equal; (d) the only computed properties that differ by `data-form` are `stroke-dasharray` and the presence of `.jaw` and `.rule`; (e) no `<rect>` in the plate, no `%` adjacent to a dimension name, zero `progress`/`meter`/`[role="progressbar"]`/`[role="meter"]`. *(b)–(d) are the assertions the first draft's "at most 3 distinct stroke-widths" licensed away.* |
| **TC-DIM-09** | pressing `CV only` sets `.filterCount` to contain `Showing 5 of 10`, hides 5 list items, and leaves **all ten** sectors in the DOM with their `data-form` unchanged; the dimmed sectors compute `opacity: 0.28`, never `display:none` or `visibility:hidden` |
| **TC-DIM-10** | keyboard: focus the sector group, `ArrowRight` × 3 → `data-index="3"`; `ArrowDown` from index 0 → lands on a control with the **same** `data-form`; `Home` → 0, `End` → 9; `Enter` sets `data-pinned`; `Escape` clears `data-pinned` and `aria-expanded="false"` on the probe; `Shift+Tab` from index 0 leaves the group (**no trap**) |
| **TC-DIM-11** | `Enter` on a sector sets `.stage[data-zoomed]`; its computed `transform` matrix equals `scale(3.3223) translate(0,33.57)` about `50 50` within 0.01; `.tieLabel` reaches `opacity: 1` and its computed font-size on a 384 px stage is between 10.4 px and 11.6 px; `.tick` and `.tickMajor` reach `opacity: 0`; `.readNumber`, `.readState` and `.index` reach `opacity: 0` and the caption contains the same two strings; every `.tieLabel` bounding box lies inside the `<svg>` client rect; `Escape` restores `transform: none` |
| **TC-DIM-12** | every in-page tie href (`#role-ato`, `#role-anz`, `#role-myob`, `#role-independent`) resolves to an existing element; **zero** dead anchors. *Passes against `Experience.tsx` as it ships today; no cross-section change gates it.* |
| **TC-DIM-13** | each sector control's `aria-label` contains its ordinal (`Dimension N of 10`), its name, its side, and the **verbatim caliper gloss** for its form; the three role controls contain `Not measurable; reason given.`; the two sourced controls contain `Measured; source given.` |
| **TC-DIM-14** | the six gap sentences render as visible text; **no** `.railRow` exists without an `<a>`; **no** element inside `#about` has `data-kind` without a matching visible link; every `.railKind` ends in `CV ONLY` or `OPENABLE` and the word agrees with the row's `data-caliper` |
| **TC-DIM-15** | under `prefers-reduced-motion: reduce`: every `.tieTick`, `.railRow` and `.numeral` reaches `opacity: 1`; **no element's computed `transform` changes between first paint and the settled frame** (matrices captured at both and compared — `.rose`'s resting `matrix(…)` is legitimate and is not asserted to be `none`); `.stage` computes `none` throughout; and at least one ordered staggered fade is observable (`animation-delay` strictly increasing across ≥ 3 `.tieTick`s) |
| **TC-DIM-16** | exactly **one** `[role="status"]`/`aria-live` element in `#about`, and it is `.filterCount`; the caption and hub readout carry neither |
| **TC-DIM-17** | with `javaScriptEnabled: false`: 10 sectors with their `data-form`, 11 tie ticks, 10 numerals, 10 answers, 11 tie links, 6 gap sentences and the citation are all present in the served HTML |
| **TC-DIM-18** | `dataset_integrity.mjs` passes: every `data-source-id` in `#about` resolves in `/dataset-provenance.json`; `dimensionsSource.names` is ordered-equal to the ten rendered `<h3>` names; the dossier's `goldMark` is the only `data-gold="true"` in the view |
| **TC-DIM-19** | axe-core on `#about` reports zero violations at WCAG 2.2 AA — at rest, with a sector focused, with a sector pinned and zoomed, with the probe open, and with each of the four filters applied |
| **TC-DIM-20** | **at 390 × 844**: all ten sector controls are ≥ 44 × 44 CSS px, none overlaps another (pairwise bounding-box test), all 11 tie ticks are still rendered, and no `.sectors` ancestor computes `display: none` |
| **TC-DIM-21** | the gold contrast spec (`tests/a11y/gold-contrast.spec.ts`) covers the citation: `--gold` on the section ground computes ≥ 4.5:1 |
| **TC-DIM-22** | `tests/monochrome/gold-semantics.spec.ts` extended: no `--gold*` token resolves on any element inside `#about svg` or `#about .rail`, in any state — the plate and the rail are gold-free by assertion, not by habit |
| **TC-DIM-23** | **labels are not re-typed.** Every `.railRow a` inner text is character-equal to the string composed from the dataset fields its `data-source-id` names (`title · employer · date_text_verbatim` for roles; `title · duration.formatted · publish_date` for videos), read from `/dataset-provenance.json`. Catches an em-dash swapped for a hyphen, a dropped `(ATO)`, or a re-cased month. |
| **TC-DIM-24** | **focus order equals visual order.** Tabbing from the `<h2>` reaches, in this order: the citation link, the four filter buttons, the hub probe, one sector control, then the first rail link. No element in `#about` has a `tabindex` greater than 0. |

---

## 13 · The dossier (R-112) — `app/data/canonical/dossiers.ts`

```ts
{
  vizId: 'about.dimension-plate',
  section: '#about',
  title: 'The dimension plate',
  renderClass: 'svg',

  whatItShows:
    'The ten dimensions his own job-fit engine scores a candidate on, drawn as ten equal sectors ' +
    'of an instrument face in the engine’s own order. Each sector’s terminal form states which of ' +
    'the three calibration states the evidence behind that answer is in — closed caliper jaws ' +
    'where there is a repository or a channel item you can open, the same engraving without them ' +
    'where the CV of record is the only source, and dashed arms that do not meet over a 45° hatch ' +
    'for the three the engine computes from the role. Nothing but the presence of a terminal form ' +
    'separates the first two: no weight, no brightness, no size. Ticks in the bezel gutter say ' +
    'which kinds of artefact exist. No sector carries a magnitude, and none can: the data has no ' +
    'such field.',

  datasetFields: [
    'repositories.aether-job-career-agent.dimensionsSource',
    'repositories.aether-job-career-agent.htmlUrl',
    'repositories.aether-job-career-agent.primaryLanguage',
    'repositories.aether-job-career-agent.license',
    'repositories.aether-job-career-agent.pythonTestFiles',
    'cv.roles.role-ato-2026.title',
    'cv.roles.role-ato-2026.employer',
    'cv.roles.role-ato-2026.date_text_verbatim',
    'cv.roles.role-myob-2010.title',
    'cv.roles.role-myob-2010.employer',
    'cv.roles.role-myob-2010.date_text_verbatim',
    'cv.roles.role-anz-sdl-2017.title',
    'cv.roles.role-anz-sdl-2017.employer',
    'cv.roles.role-anz-sdl-2017.date_text_verbatim',
    'cv.roles.role-anz-arch-2017.title',
    'cv.roles.role-anz-arch-2017.date_text_verbatim',
    'cv.roles.role-independent-2025.title',
    'cv.roles.role-independent-2025.date_text_verbatim',
    'channel.videos.p9pGAmqJCSk.title',
    'channel.videos.p9pGAmqJCSk.publish_date',
    'channel.videos.p9pGAmqJCSk.duration',
    'channel.videos.p9pGAmqJCSk.description',
    'channel.videos.gMe4FZbjcQE.title',
    'channel.videos.gMe4FZbjcQE.publish_date',
    'channel.videos.gMe4FZbjcQE.duration',
    'manifest.modules.repositories.observedAt',
  ],

  goldMark: 'repositories.aether-job-career-agent.dimensionsSource',

  interactions: [
    { kind: 'hover-reveal', description: 'Pointer or focus on a sector or a list item turns the face to bring that dimension under the index, lights its sector and its ticks, and raises its evidence rail. Nothing appears that was not already legible: every tie, date and link is in the DOM before any interaction.' },
    { kind: 'focus-zoom',   description: 'Enter on a sector pins it and scales the plate 3.3223× about the reading position over 320 ms, at which scale the three evidence ticks carry their own labels — ROLE, REPO, CHAN — with the bezel graduations faded out of their way. Escape restores.' },
    { kind: 'filter',       description: 'Four controls filter the ten by terminal form. Sectors are dimmed, never removed, and never lose their form: a dim here means filtered, not unevidenced.' },
    { kind: 'drill-down',   description: 'Every tie is a real link — into the Experience entry that ran the programme, out to the repository, out to the channel item.' },
    { kind: 'curiosity',    description: 'The hub probe shows all ten numerals at once and lengthens the ten major graduations, and prints the file, the function, the line and the blob sha: the ten axes are not ten opinions, they are the arguments of a function, all equal and none ranked.' },
  ],

  demonstratedSkill:
    'An instrument that gains a third state without gaining a scale: the caliper’s grammar — closed ' +
    'jaws, plain engraving, arms that do not meet — carried from a 12-pixel inline mark up to a ' +
    '384-pixel face at the same 45°, with every orderable channel held constant across the two ' +
    'measured states so the mark can never be misread as a grade. A compositor-only zoom that ' +
    'reframes an SVG with one transform and two counter-scaled type sizes, so a 3.32× magnification ' +
    'costs no requestAnimationFrame, no layout and no reflow. And a citation that is verified rather ' +
    'than asserted: the build fetches the source file at a pinned commit and fails if the ten names ' +
    'on this page are not the ten names in that function, in that order.',

  takeaway:
    'Ten dimensions the engine scores. Three are not about me. Two have something you can open.',

  accessibility: {
    textAlternative:
      '#about p#about-desc + #about ol.list — the insight sentence, then the full record: ten ' +
      'answers, eleven linked artefacts with their real dates, and six sentences naming exactly ' +
      'what has no evidence. Neither is behind a toggle.',
    reducedMotion:
      'The settled frame is the base stylesheet: every sector, jaw, tick and numeral is at final ' +
      'position and opacity on first paint. The choreography is re-scored, not muted — the eleven ' +
      'ticks and the rail rows still arrive in order on a 40 ms stagger with no travel, the face ' +
      'still indexes and still zooms by cut rather than sweep, and colour transitions survive at ' +
      '--motion-fast so the interface reads as calm rather than broken.',
  },

  performance: { /* NOT authored — written by scripts/dataset/build_dossiers.mjs from
                    reports/viz-perf.json. Budgets asserted: fps >= 60, initMs <= 90,
                    memoryMb <= 1.5, disposedCleanly === true. */ },
}
```

---

## 14 · Open facts, recorded rather than assumed

1. **The blob sha is now fully observed.** `038073350df86466c0838c0539d5c3d41bbd0fe6`, fetched at
   commit `bb5f5f01` on 2026-09-03 and re-derived locally from the file bytes as
   `sha1("blob <len>\0" + bytes)`. The first draft recorded it as unobserved; it is observed. §4
   still makes the adapter re-fetch it every build and print `slice(0, 11)` of what it *then* finds,
   because the point is that the printed value is current, not that it matches this note.
2. **Line 226 is a re-verified observation, not a constant.** `def build_fit_dimensions(` is at
   line 226 of the 1,143-line file at `bb5f5f01`; the function body ends at line 319. The adapter
   re-observes both every build and prints what it finds. If it moves, `names` still governs and the
   drift is recorded — the citation must never point at a line that no longer holds the function.
3. **The Experience anchors already exist.** `Experience.tsx:156` renders ``id={`role-${role.id}`}``
   and `:107` scrolls to it; `experience.ts:26,32,41,71` define `ato`, `independent`, `anz` and
   `myob`. The first draft's claim that they "do not exist yet" was false, and the `Experience.tsx`
   change it ordered is deleted (§3.3). TC-DIM-12 passes against the tree as it stands.
4. **The channel speaks to two of the ten dimensions.** Nine of the ten public videos are Vedic and
   Sanskrit astronomy; they evidence curiosity and the instinct to teach (R-120), which is not one
   of the engine's ten. R-121's weave is satisfied honestly at two, not padded to ten.
5. **`aether-job-career-agent`'s public CI is red on `main`** (`R184-flagship-ci-diagnosis.md`), and
   tie 01·repo says so on the page. If R-184's remediation turns it green, that sentence changes in
   the same commit — the site never carries a statement about itself its own data contradicts
   (R-182, R-183, `encoding-grammar.md` §11).
6. **`repositories.aether-job-career-agent.pythonTestFiles` is not in the shipped dataset today.**
   The 392 figure is in `corpus-repositories.json` (`"pythonTestFiles": 392`, counted from the git
   tree at HEAD with vendor and venv paths excluded) but not in `app/data/canonical/generated/`.
   Either add the field to the repositories adapter in the same commit — §11 and §13 assume this —
   or drop the figure from tie 01·repo's sentence. It may **not** ship as an unbound number.
7. **The three role dimensions have no candidate-side evidence and never will.** That is the point of
   the open caliper, and it is the reason the section refuses to draw ten equal-looking answers.
8. **`--fs-*`, `--space-*`, `--measure-read`, `--motion-emphatic`, `--motion-cine-in` and
   `--stagger-tight` do not exist in `app/globals.css` today** — they are `design-system-lock.md`
   §2.2, §3.3 and §4.2 deliverables. This spec consumes them. If the token commit has not landed
   when this one does, each use ships with the shipped literal as a `var(--token, literal)` fallback
   and a follow-up removes the fallback; it does **not** ship a bare literal.
9. **The canonical dataset layer does not exist yet either, and that is a harder dependency than the
   tokens.** §0.1 states it in full. A missing token degrades to a literal; a missing
   `selectDimensionEvidence()` does not degrade to anything.
10. **`#about` renders zero `<canvas>` in every condition, and that is a property of the section, not
    of the harness.** `AUDIT-RECONCILIATION.md` §F withdrew C-2 after re-testing with
    `reducedMotion: 'no-preference'` and `?gl=force`: hero 1 canvas, experience 1 canvas, About none,
    because About mounts no `<Scene>`. Nothing in this spec reasons from "no canvas renders anywhere".

---

## Revision record

Every blocker and defect the adversarial critique raised, and its disposition. "Closed" means the
revised text no longer contains the defect; "critic wrong" means the finding did not survive
verification and the evidence is given. The critique section the first draft carried at its end is
removed, because a spec that ships with its own errata is two documents, and §11 asks an implementer
to read one.

| id | disposition |
|---|---|
| **F1** · §4's premise false twice | **Closed.** `curl` on 2026-09-03 returns **HTTP 200** for `…/blob/main/apps/api/app/routers/jobs.py`; `about.ts:115` holds exactly that URL (shipped in `4338ac2`). §4 no longer says "repository root" and no longer invokes C-8's wording. The defect is restated as the two that are real and verifiable: **a moving-branch pin** (`blob/main`, and `main` moved eight times in the fortnight before the run) and **no line anchor with the path rendered as unlinked text** (`About.tsx:50`). R-172's actual subject — inherited `aether-career-agent` name references — is named, and the audit's zero hits recorded. §3.4's ledger instruction is rewritten: the ledger is harvested from git history (`feedback_log.mjs:34-36`), so the commit message *is* the entry, and it must describe the two changes that actually happened. Ordering a false entry would have been an R-171 violation inside the corrections ledger. |
| **F2** · two "untouched" tests break | **Closed, and one of them without touching the test.** TC-ABOUT-07 (`about.spec.ts:107`) asserts `'Ten axes · no scores'`: §8 now **keeps that string verbatim** as the `<figcaption>`'s rest state, so the test stays untouched and passes — deleting a shipped refusal to make room for a redesign is the R-171 failure this run exists to catch. TC-ABOUT-03 (`:65`) uses `#about ol li p:first-of-type`, which the rail's `.railWhat` now matches and tie 08 fills with "38%": §12 amends the selector to the child chain the test's own comment at `:57-63` already describes, and **adds** a caveat-travels assertion so the test ends up stronger. TC-ABOUT-02's amendment now names `data-answer` / `data-evidence`, and §11 adds them to `About.tsx` — the first draft named selectors it never created. All three amendments are declared in §12 rather than discovered at run time. |
| **F3** · calibration state rendered as intensity | **Closed.** §2.1 now holds **every orderable channel constant across `sourced` and `self-reported`**: same fill token, same stroke colour (`--steel` @ 0.50), same stroke-width (0.6), same opacity. The sole differentiator is the `.jaw` pair — a terminal form, as `encoding-grammar.md` §2.3 requires. `open` differs only by dash pitch, corner gap and hatch, all texture (channel rank 6). The invented third fill token `--plate-sector-fill-src` (0.055) is deleted, so §11's `globals.css` change now tokenises the **two** shipped literals and invents nothing. §5.1's hover no longer touches the arc. TC-DIM-08 is rewritten from "at most 3 distinct stroke-widths" — which licensed the violation — to **exactly one** stroke-width, **exactly one** stroke colour, and `sourced`/`self-reported` fills string-equal. |
| **F4** · dataset layer does not exist | **Closed.** New **§0.1** declares the hard ordering dependency, lists the five absent paths (each verified with `ls`), names their owner (`dataset-layer-design.md` §1–§3, §5.3, scheduled by `SPEC-telemetry-and-data.md`), and states that this spec is not startable before that layer lands. §11 moves all five from **Change** to a new **Depends on** block. §3.1's over-broad "no dataset scope extension is required" is narrowed to what is true — no new *module* and no new *generated file* — with the two field additions (`DimensionsSource`, `pythonTestFiles`) named. §14.9 records it beside the token dependency and marks it the harder of the two. |
| **1** · §3.4 relocates nothing | **Closed.** §3.4 states plainly that "38 public repositories" is **deleted, not relocated**, and names the site's one bound instance that stays where it is: `vitrine.ts:116-117` — *"Six of thirty-eight"* over *"Thirty-eight public repositories exist"*, with `publicRepoCount` and `harvestedAt` from the harvest. |
| **2** · "one bare figure" is false | **Closed.** §3.4 is now a four-row ledger covering `evidence[0]`, `[4]`, `[7]` and `[8]`, each disposed of explicitly. `[8]` is **corrected** rather than left alone: the CV says *"75+ hours of **manual** evidence **per team** against 64 available hours"*, and the shipped string dropped both qualifiers, which changes what the ratio means. |
| **3** · §6 and §7 contradict | **Closed.** §7's DOM is reordered to `header (citation) → filters + status → figure( probe → sectors → svg → figcaption → key ) → list`, which is exactly §6's tab order, achieved with **no positive `tabindex`**. Paint order is restored by `z-index` in `Compass.module.css`. New **TC-DIM-24** asserts the focus order and that no `tabindex > 0` exists. |
| **4** · the readout cannot go off-screen | **Closed.** §5.2 stops claiming it goes off-screen and instead specifies `.plate[data-zoomed]` setting `opacity: 0` on `.index`, `.readNumber` and `.readState` — they are siblings of `.stage` and do not transform, so hiding is the only honest mechanism. Their strings are duplicated in the `<figcaption>` as real type. TC-DIM-11 asserts all three reach opacity 0 and the caption carries the strings. |
| **5** · the zoom bbox omits what the zoom reveals | **Closed.** The frame is re-derived over `r ∈ [22, 46.2]` — out to where `.tieLabel`'s ink ends — giving `ZOOM_BOX = 34.95 1.38 30.10 30.10`, `scale(3.3223) translate(0, 33.57px)`; four extreme corner points are computed and shown inside `0…100`. The graduation collision is addressed rather than ignored: the `REPO` label at `θᵢ` sits under a **major** graduation, so `.stage[data-zoomed]` fades `.tick` and `.tickMajor` to 0. Counter-scales are recomputed (`.numeral` 0.93px → 3.09px; `.tieLabel` 0.86px → 10.97 CSS px). TC-DIM-11 asserts the new matrix, the faded graduations and that every `.tieLabel` box lies inside the SVG rect. |
| **6** · `:78` is not the only stale gold prose | **Closed.** §0 and §11 now name **both** `Compass.tsx:78` and `:211`, verified by `grep`, and order both deleted. |
| **7** · verbatim drift in "never authored" labels | **Closed.** §3.2 gains a binding rule that labels are printed from the dataset's own strings, and every label in the table is corrected against `corpus-cv.json` and `corpus-youtube.json`: `Australian Taxation Office (ATO)`, `March 2026 - Present`, `May 2010 - Aug 2011`, `Sept 2017 - June 2025`, `2017 - 2022`, `June 2025 - Feb 2026`, `Apr 16, 2026`, `Nov 25, 2025`, and the JARVIS title with its real **hyphen**. Tie 10·role restores *manual* and *per team*; tie 05·role restores the CV's own *"5+ cross-functional squads … up to 40 resources including offshore teams … over $5M"*; tie 08·role restores *"in a simulated production environment"*. New **TC-DIM-23** asserts every rail label is character-equal to the composed dataset string. |
| **8** · test rigour | **Closed on all three.** TC-DIM-15 no longer asserts `transform === none` (`.rose` legitimately computes an identity matrix): it now compares the first-paint and settled matrices and asserts they are equal, and asserts `.stage` computes `none`. TC-DIM-04 becomes an **offline** identity check against `/dataset-provenance.json` plus a URL-shape regex; live liveness moves to **TC-DIM-04N**, tagged `@network`, nightly-only, non-gating — the corpus records YouTube bot-gating and GitHub's 60 req/hr anonymous ceiling, and CI is already red (C-1). TC-DIM-08 is rewritten as described under F3 and is now the strictest test in the set rather than the weakest. |
| **9** · arithmetic | **Closed.** §6 prints the derivation and the right number: `2 × (0.315 × 272) × sin 18° = ` **52.95 px**, not 53.8. The conclusion (52.95 > 44) is unchanged. |
| **10** · §4 step 4 hand-waves | **Closed.** §4 step 4 gives the exact strategy: slice from `line` to the next `/^(def \|@\|class )/`, apply `/_dimension\(\s*\n?\s*"([^"]+)"/g`, require exactly ten plain string literals, and **fail the build** with the offending line printed on anything else — no fallback, no partial list. Verified against the real file at `bb5f5f01` (lines 226–319), which yields the ten names in the order `about.ts` holds them. |
| **F-SELF-1** · four gold marks the critic did not catch | **Found in revision, closed.** The first draft's §3.2 graded four rail ties `sourced` and §11.3 rendered `<Caliper>` inside the rail. A `sourced` caliper draws **gold jaws** (`Caliper.module.css:77-78`), so the section would have shipped **five** gold marks and failed `encoding-grammar.md` §12 prohibition 2, R-110 and its own TC-DIM-06 on the first run. §3.2 now specifies that the rail draws **no caliper bracket**: the grade is carried by `data-caliper`, by a word in the kind column (`ROLE · CV ONLY`, `REPO · OPENABLE`), and by the sector's terminal form — which is the section's whole visual encoding of that distinction anyway. §2.1 makes the same rule explicit for the plate's `.jaw`, which is `--white` and never `--gold`. TC-DIM-06 and TC-DIM-22 assert it in every state. |
| **F-SELF-2** · two hub coordinates silently moved | **Found in revision, closed.** §2.3 gave `.readNumber` y `45.0` and `.readState` y `53.6` while claiming "every shipped constant is unchanged"; the shipped values are `47.5` and `56.5` (`Compass.tsx:218,221`). Restored, so the claim in §2 is true. |
| **F-SELF-3** · probe and zoom could contradict | **Found in revision, closed.** §5.4 lengthens the major graduations; §5.2 now fades them. §5.4 states the two are mutually exclusive states — opening one closes the other — so the two rules can never both apply. |
| **Critic's strongest improvement** · retarget the role ties at the anchors that already ship | **Adopted in full.** Verified: `Experience.tsx:156` renders ``id={`role-${role.id}`}``, `:107` already scrolls to it, and `experience.ts:26,32,41,71` define the four ids. §3.3 now links to `#role-ato`, `#role-anz`, `#role-myob`, `#role-independent`; the `#experience-{spanId}` scheme and the `Experience.tsx` change are deleted from §11; §14.3 records that the first draft's claim was false. This removes a file from the change list, removes a cross-section build-stopping coupling, and makes TC-DIM-12 pass on the first run. |

**Not carried over.** The critique's fabrication check (clean, every corpus figure re-verified) and
its closing assessment are evidence about the first draft, not instructions to an implementer, and
they do not belong in a build spec. They remain in the run's record. Every corpus figure the check
validated is still in this document, and the ones it flagged as drifted have been corrected against
the corpus rather than re-asserted.
