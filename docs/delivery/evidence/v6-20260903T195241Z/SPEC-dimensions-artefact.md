# SPEC · The Ten-Dimension Artefact

**Run** `v6-20260903T195241Z` · **Requirements** R-188, R-168, R-172, R-96, R-97, R-99, R-101,
R-104, R-109, R-110, R-111, R-112, R-121, R-95, R-108 · **Success criteria** SC-96.1, SC-87.1,
SC-88.1 · **Gates** K and R · **Binding decisions** D-01, D-04 (`DECISIONS.md`) · **Grammar**
`encoding-grammar.md` §2.1–2.5, §3.1–3.3, §5, §6, §8, §9, §12 · **Tokens** `design-system-lock.md`
§1.2, §1.4, §2.2, §3.3, §4.2, §4.3 · **Dataset** `dataset-layer-design.md` §1, §2.1, §2.3, §2.4,
§5, §6 · **Corrects** `AUDIT-RECONCILIATION.md` C-3 and C-8

This is a build specification. Every geometry, weight, duration, easing, angle, field name, DOM
shape, string and assertion below is fixed. An implementer executes it without making a further
design decision. Any number an implementer cannot reproduce from the canonical dataset is a defect
in this spec, not a licence to invent one.

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

**What is not true, and must not be repeated.** `Compass.tsx:78` says *"The index is the one gold
mark."* The shipped CSS already draws it `--gold`-free (`Compass.module.css:146-155`,
`fill: var(--white)`), and the file header at `:9-12` states the correct rule. The doc-comment at
`:78` is **stale prose, not a shipped violation** — correct it in the same commit. There is
currently **zero gold in `#about`**; §4 gives the section its first and only gold mark.

---

## 1 · What changes, exactly

| Kept, untouched | Extended | Added | Removed |
|---|---|---|---|
| the ten `name` strings, verbatim and in order | `Compass.tsx` — 2 states → 3 terminal forms, + tie ticks, + zoom, + hub probe | the evidence rail (§3) | `Dimension.evidence[0]`'s raw figure *"38 public repositories"* (§3.4) |
| the two `lede` paragraphs (the refusal of scores) | `About.tsx` — list items gain the rail; `<li tabIndex={0}>` is removed (§6) | the four filter controls (§5.3) | `Compass.tsx:78`'s stale gold comment |
| the open `<Caliper state="open">measured from the role</Caliper>` on the three role dimensions | `about.ts` — `provenance` gains a resolving citation (§4); each dimension gains `evidenceRefs` | the gold citation mark (§4) | nothing else |
| every `answer` string | `About.module.css`, `Compass.module.css` | `#about-desc`, the takeaway line (§8) | |

---

## 2 · The plate — exact geometry

`components/sections/About/Compass.tsx`. **Every shipped constant is unchanged**: `SPOKES = 10`,
`BEZEL_OUTER = 47`, `BEZEL_INNER = 43.2`, `SECTOR_OUTER = 41`, `SECTOR_INNER = 22`,
`NUMERAL_RADIUS = 36.2`, `HUB = 18`, `SECTOR_SWEEP = 36`, corner inset `1.1°`, engraved rules at
`t = 0.28 / 0.52 / 0.76`, 100 bezel graduations with every tenth major (`3.8` vs `1.9` long),
`viewBox="0 0 100 100"`, `polar(a, r) = [50 + cos((a−90)π/180)·r, 50 + sin((a−90)π/180)·r]`.

`.compass` changes `overflow: visible` → `overflow: hidden` (nothing is drawn outside 3…97; the zoom
in §5.2 requires the clip).

### 2.1 The three terminal forms — one per sector, derived, never authored

The single `annulus()` path is split into four elements so the caliper's grammar can be drawn
literally. `from = θᵢ − 16.9`, `to = θᵢ + 16.9`, `θᵢ = 36 · i`.

| element | path | `sourced` | `self-reported` | `open` |
|---|---|---|---|---|
| `.sectorFill` | `annulus(from, to, 22, 41)`, `stroke: none` | `var(--plate-sector-fill-src)` | `var(--plate-sector-fill)` | `url(#compass-open)` (the shipped 45° hatch) |
| `.sectorArc` | `M polar(from+g,41) A 41 41 0 0 1 polar(to−g,41)` | `g = 0`, `stroke-width 1.0`, solid, `var(--white)` @ 0.90 | `g = 0`, `stroke-width 0.6`, solid, `var(--steel)` @ 0.50 | `g = 1.4`, `stroke-width 0.6`, `stroke-dasharray 1.6 1.2`, `var(--mist-400)` @ 0.50 |
| `.sectorEdge` ×2 | `M polar(from,22) L polar(from,41)` and the `to` twin | `var(--steel)` @ 0.40, `0.4` wide | same | same + `stroke-dasharray 1.6 1.4` (shipped value) |
| `.rule` ×3 | shipped arcs at `t 0.28/0.52/0.76` | drawn | drawn | **absent** (shipped behaviour) |
| `.jaw` ×2 | `M polar(from+2.0,41) L polar(from+2.0,38.8)` and `M polar(to−2.0,41) L polar(to−2.0,38.8)` | **drawn**, `var(--white)`, `0.9` wide, @ 0.90 | absent | absent |

The `g = 1.4°` corner gap is the whole point of the `open` form: **arms that do not meet**, exactly
as `Caliper.tsx:26-28` glosses it. The `.jaw` pair is **closed jaws**, exactly as `:22-23` glosses
it. A reader who has met the caliper in the hero already reads this face without a legend.

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
luminance or stroke — varies with anything but `terminalForm`. There is no score to draw and the
geometry makes one unrepresentable. Asserted by TC-DIM-08.

### 2.2 The evidence gutter — tie ticks

A dedicated annular gutter between `SECTOR_OUTER` (41) and `BEZEL_INNER` (43.2), unused today.

| kind | angle | geometry |
|---|---|---|
| `role` | `θᵢ − 9°` | `M polar(θᵢ−9, 41.4) L polar(θᵢ−9, 43.2)` |
| `repository` | `θᵢ` | `M polar(θᵢ, 41.4) L polar(θᵢ, 43.2)` |
| `channel` | `θᵢ + 9°` | `M polar(θᵢ+9, 41.4) L polar(θᵢ+9, 43.2)` |

`.tieTick`: `stroke: var(--white)`, `stroke-width: 0.9`, `opacity: 0.62`; `[data-active] 1.0`.
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

`.readNumber` (heading face, 11 px, `var(--white)`, y `45.0`) — `01`…`10`, or `—` at rest.
`.readState` (mono, 2.6 px, `var(--mist-400)`, y `53.6`) — its vocabulary changes:

| state | string |
|---|---|
| rest | `NO SCORES` *(shipped string, kept — it is R-168's refusal, printed on the instrument)* |
| `sourced` | `OPENABLE` |
| `self-reported` | `CV ONLY` |
| `open` | `FROM THE ROLE` *(shipped string, kept)* |
| probe active (§5.4) | `10 ARGUMENTS` |

No third hub line. Anything smaller than 2.6 px in this viewBox renders under 10 CSS px on a 384 px
stage, and the site does not print type it cannot set well (R-103). The evidence kinds are carried
in real HTML type beneath the plate instead.

---

## 3 · The cross-link model — real corpus data, and the gaps stated

### 3.1 The ten dimensions and what actually evidences them

**Rule: at most one artefact per kind, per dimension** — the strongest one. The rest of the record
lives in Experience and the Vitrine, and the rail says so rather than duplicating them. Every id
below resolves in the canonical dataset as scoped today; **no dataset scope extension is required**
(`aether-job-career-agent` is one of the vitrine six, `dataset-layer-design.md` §2.3; all ten public
videos are in the channel module, §2.4; all nine roles are in the cv module, §2.1).

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

| # · kind | rendered label (from the dataset) | `what` (authored, verbatim) | tie caliper |
|---|---|---|---|
| 01 · role | `Scrum Master / Project Manager · Australian Taxation Office · March 2026 – present` | The COBOL/mainframe test-evidence toolchain — REXX, SMF, SDSF, PCOMM, PowerShell, VBA — across 200+ SIT and E2E scenarios. | self-reported |
| 01 · repo | `Victordtesla24/aether-job-career-agent · Python · MIT` | Python and TypeScript at production scale, with 392 Python test files behind it — and a public CI that is red on `main` today. | **sourced** |
| 01 · channel | `JARVIS — I Built a Real Arc Reactor HUD for My Mac (Apple Silicon Telemetry) · 2:01 · 16 April 2026` | Its own description names the stack: 60 fps via SwiftUI Canvas and Metal, with a Go telemetry daemon streaming JSON at 1 Hz. | **sourced** |
| 02 · role | `Developer Support / Software Testing / Analyst · MYOB · May 2010 – August 2011` | The earliest role on the CV of record. Every years-of-experience figure on this site is counted from its start date. | self-reported |
| 03 · role | `Senior Delivery Lead / Technical Product Owner · ANZ · September 2017 – June 2025` | Seven years and nine months inside one regulated bank — the longest single engagement on the record. Government and telecommunications sit beside it in Experience. | self-reported |
| 04 · role | `Scrum Master / Project Manager · Australian Taxation Office · March 2026 – present` | One of eight squads on the Payday Super programme, PI 47–48 — and the toolchain that unblocked it. The delivery problem and the engineering problem were the same problem. | self-reported |
| 05 · role | `AI/ML Strategy & Solutions Architect · ANZ · 2017 – 2022` | Five or more squads and up to forty practitioners, onshore and offshore, on a portfolio the CV values at over five million dollars. | self-reported |
| 08 · role | `Independent AI Consulting & Upskilling · June 2025 – February 2026` | An end-to-end Langfuse and Phoenix evaluation stack scoring hallucination, latency and cost. The 38% reduction in error-budget breaches was measured against a **simulated** error budget, not live traffic. | self-reported |
| 10 · role | `Scrum Master / Project Manager · Australian Taxation Office · March 2026 – present` | Seventy-five-plus hours of evidence against sixty-four available — said out loud, escalated, then re-baselined by an executive change request. | self-reported |
| 10 · repo | `Victordtesla24/aether-job-career-agent · README line 39` | Its own README: *"a signal with no data reads 'not measured' rather than counting as a zero."* The engine refuses to publish what it cannot source; so does this page. | **sourced** |
| 10 · channel | `Part 2: I Coded a 7,000-Year-Old Algorithm (It Actually Works) · 10:05 · 25 November 2025` | A 7,000-year-old text translated into executable Python, with the code published so the claim in the title can be checked by anyone who wants to. | **sourced** |

Both ANZ ties resolve to **one** Experience track (`#experience-anz`, span 2017-09 → 2025-06), because
Experience draws ANZ as a single span. The rail says so on tie 05: *"drawn as one span in
Experience."*

### 3.3 Link targets

| kind | `href` | notes |
|---|---|---|
| role | `#experience-{spanId}` | `role-ato-2026 → ato`, `role-anz-sdl-2017 → anz`, `role-anz-arch-2017 → anz`, `role-myob-2010 → myob`, `role-independent-2025 → independent`. **Requires** `components/sections/Experience/Experience.tsx` to render `id={`experience-${span.id}`}` on each role track `<button>` (ids exist in `app/data/portfolio/experience.ts:26,32,41,71`). TC-DIM-12 fails if any in-page tie href does not resolve to an element, so a missing id is a build-stopping defect, never a dead link. |
| repository | `repositories.<name>.htmlUrl` from the dataset | `https://github.com/Victordtesla24/aether-job-career-agent` |
| channel | `channel.videos.<id>.url` from the dataset | `https://www.youtube.com/watch?v=p9pGAmqJCSk`, `…?v=gMe4FZbjcQE`. An outbound link, **not** a player — R-118's facade rules bind embeds, and nothing is embedded here. |

`rel="noreferrer noopener"` and `target="_blank"` on external ties only, matching `About.tsx:47`.

### 3.4 The one copy change in `about.ts`

`dimensions[0].evidence` — `'38 public repositories · ATO evidence harness · ANZ platform migrations'` —
carries a bare figure in prose. It becomes:

> `'Public repositories · the ATO evidence harness · the ANZ platform migrations'`

The count moves into the rail's repository row, where it is a bound mark with a `retrievedAt`. The
other nine `evidence` strings are unchanged. Enter the change in the corrections ledger
(`delivery` module strand 1) so the site's own history records why the number moved.

### 3.5 The key beneath the plate

The shipped two-row `<dl>` becomes three rows, one per terminal form, each carrying **its glyph and
its words** (`encoding-grammar.md` §5, last bullet). `.keySwatch` gains a third variant.

| `data-state` | swatch | words |
|---|---|---|
| `sourced` | solid 1 px border, `var(--plate-sector-fill-src)`, plus two 0.85 rem `var(--white)` jaw ticks inset 0.15 rem from each end | Something you can open — a repository or a channel item, linked below. |
| `self-reported` | solid 1 px border, `var(--plate-sector-fill)` | The CV of record and nothing else. Take his word or check the PDF. |
| `open` | dashed 1 px border + the shipped 45° `repeating-linear-gradient` | Computed from the role, not the candidate. Nothing about a person to measure. |

Followed by one sentence, not a fourth key row:

> *"Inside the bezel, a tick for each kind of evidence: role to the left of the sector, repository at
> its centre, channel to its right. A kind with nothing behind it draws no tick."*

---

## 4 · R-172 — the citation, made to resolve, and the section's one gold mark

**The defect** (`AUDIT-RECONCILIATION.md` C-8): `about.ts:115` points `href` at the repository
**root**; the cited path `apps/api/app/routers/jobs.py` renders as unlinked text (`About.tsx:50`).
The citation is true and does not resolve — which is the one thing this section cannot afford,
because everything it says rests on it.

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

1. `GET /repos/Victordtesla24/aether-job-career-agent/commits?sha=main&per_page=1` → `ref`
   (observed at the time of writing: `bb5f5f010c202d1b1811ebaba443f30290cb29b2`, 2026-09-02T20:59:41Z —
   `corpus-repositories.json` `flagshipRepositories`).
2. `GET /repos/Victordtesla24/aether-job-career-agent/contents/apps/api/app/routers/jobs.py?ref=<ref>`
   → `blobSha` (the response's `sha`) and the base64 body.
3. Decode; find the 1-indexed line of `def build_fit_dimensions(` → `line`.
4. Extract the ten dimension name string literals from the function body → `names`.
5. Compose `href = https://github.com/Victordtesla24/aether-job-career-agent/blob/<ref>/apps/api/app/routers/jobs.py#L<line>`.
   A `blob/<ref>` URL takes a **commit-ish**; a blob sha is not one, so the blob sha is *printed and
   independently verifiable* (`GET /git/blobs/<blobSha>`) rather than routed.

**Three build-stopping assertions** (`scripts/validate/dataset_integrity.mjs`):

- `names` ≡ `aboutContent.dimensions.map(d => d.name)` as an **ordered** sequence. R-168's *verbatim*
  becomes mechanically true instead of asserted. A rename upstream stops the build.
- `line === 226`, or the build **passes with a recorded drift note** and the printed line is the
  observed one — never the stale one. The contract's `226` is an observation, not a constant.
- `blobSha` starts with `038073350df`. If it does not, the file changed: `names` still governs, and
  the drift is recorded. **The printed short sha is always `blobSha.slice(0, 11)` of the observed
  value — the ellipsised `038073350df…` from the contract is never rendered as if it were complete.**

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
      build_fit_dimensions() · L226 · blob 038073350df
    </Caliper>
  </a>
</p>
```

**This is the one gold mark in `#about`** (`encoding-grammar.md` §3.1; `design-system-lock.md` §1.3).
It is a `<Caliper state="sourced">` — the site's **first rendered `sourced` caliper**, closing C-3
from data rather than by inventing one. Gold geometry: the two 1 px caliper arms plus the link
underline, `var(--gold)` at 8.62:1 on `--ink-900` — a hairline and an inline link, both permitted by
`design-system-lock.md` §1.4 rule 2. **No other element in `#about` may carry `data-gold`, in any
state, including while the probe of §5.4 is open.** TC-DIM-06 asserts count === 1 in every state.

---

## 5 · Interaction — R-97's four depths

### 5.1 Hover reveal

Pointer over, or focus within, a sector control **or** a list item sets `active = i`:

- the rose rotates so sector `i` sits under the index at twelve o'clock (shipped mechanism,
  `Compass.tsx:122`, `680ms var(--motion-ease-emphasized)` → retokenised to
  `var(--motion-cine-in)` = 720 ms, `design-system-lock.md` §4.2);
- `.sectorFill` lifts to `var(--plate-sector-fill-lit)`, `.sectorArc` stroke → `var(--white)`,
  `.tieTick` opacity 0.62 → 1.0, `.numeral` → `var(--white)` @ 1.0 (all shipped patterns);
- the hub readout fills; the caption fills; the item's rail rows raise `var(--mist-400)` →
  `var(--white)`; the other nine items drop to `opacity: 0.45`.

**Nothing appears that was not already legible.** Every tie, every date, every link and every
"no evidence" sentence is in the DOM and visible before any interaction — `encoding-grammar.md`
§3.2 clause 3, the rule that keeps the section honest to a crawler, a screen reader and a printout
at once. There is no disclosure widget anywhere in this section.

### 5.2 Focus and zoom

`Enter` / `Space` on a sector control **pins** it (`data-pinned={i}`) and zooms the plate.

Because the rose has already carried the pinned sector to θ = 0, **one constant frames all ten**:

```
wedge bbox at θ=0, r ∈ [22, 43.2], θ ∈ [−17.9, +17.9]
  x: 36.72 … 63.28   (w 26.56)      y: 6.80 … 29.06   (h 22.26)
  centre (50, 17.93) ;  side = max(26.56, 22.26) × 1.12 = 29.75
ZOOM_BOX = 35.13 3.06 29.75 29.75
```

`viewBox` is not CSS-animatable, so the zoom is a **compositor-safe transform on a `<g class="stage">`
wrapper** — no `requestAnimationFrame`, no layout property, 60 fps by construction:

```css
.stage { transform-box: view-box; transform-origin: 50px 50px;
         transition: transform var(--motion-base) var(--motion-ease-emphasized); }
.stage[data-zoomed] { transform: scale(3.3613) translate(0px, 32.07px); }
```

`3.3613 = 100 / 29.75`. `translate` applies first, carrying the wedge centre `(50, 17.93)` to
`(50, 50)`; the scale then acts about `(50, 50)`. Verified: `(50, 17.93) → (50, 50) → (50, 50)`.

Two counter-scales keep type at its designed optical size (stage 384 px ⇒ 12.9 px per viewBox unit
while zoomed):

- `.stage[data-zoomed] .numeral { font-size: 0.92px; }` → 0.92 × 3.3613 = 3.09 px effective, i.e.
  the shipped 3.1 px, unchanged to the eye.
- `.tieLabel` — mono, `font-size: 0.85px` → 11.0 CSS px on a 384 px stage — is `opacity: 0` at rest
  and `opacity: 1` while zoomed, set at `polar(θᵢ ± 9 or θᵢ, 45.4)`, text-anchor `middle`, counter-
  rotated by `−rotation` like the numerals. Strings: `ROLE`, `REPO`, `CHAN`.

**This is the payoff that makes zoom non-decorative:** the tie ticks become directly labelled, which
is the form `encoding-grammar.md` §5 prefers and which the resting scale cannot afford. The
information is not *only* here — it is in the list, the caption and every `aria-label` — so §3.2
clause 3 holds.

`Escape` unpins, restores `viewBox` framing and keeps focus on the sector. While zoomed the hub
readout is off-screen; its two strings are duplicated in the caption (real HTML type) beneath.

### 5.3 Filtering / drill-down

Four `<button>`s above the list, in a `<div role="group" aria-label="Filter the ten dimensions">`:

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

A `<button class="hubProbe">`, centred on the hub, `4.4rem` diameter (70 px ≥ the 44 px target
floor), in the non-rotating overlay layer, accessible name **"Show where the ten names come from"**,
`aria-expanded`, `aria-controls="about-probe"`.

Activating it:

- swaps the caption block for `#about-probe`, a four-line mono panel at `var(--fs-caption)`:
  `build_fit_dimensions()` / `apps/api/app/routers/jobs.py` / `L226 · blob 038073350df` /
  `Victordtesla24/aether-job-career-agent` — **all four from the dataset, none gold** (the gold
  citation in the header remains the section's only gold mark);
- sets `data-probe` on the plate, which draws **all ten numerals in `var(--white)` at opacity 1
  simultaneously** and lengthens the ten major bezel graduations from `3.8` to `5.2` units;
- sets the hub readout to `— / 10 ARGUMENTS`.

The instrument shows its whole scale at once, and the reader discovers that the ten axes are not ten
opinions — **they are the arguments of a function, all equal, none ranked.** That is the single most
surprising true thing in the section, and it is the thing a sceptical reader most wants to test.
`Escape` closes it.

---

## 6 · The keyboard model (R-101 §9.1) — complete

**Tab order follows data order, not paint order:**

1. the gold citation `<a>` (§4)
2. the four filter buttons
3. the hub probe button
4. **the sector group — one tab stop**, roving `tabindex` over ten controls
5. the list, in order 01…10: each rail row's `<a>` is a natural stop; `<li>` elements are **not**
   focusable — `About.tsx:96`'s `tabIndex={0}` on the `<li>` is **removed**, because a non-interactive
   container that takes focus is a WCAG 2.2 anti-pattern and now duplicates the sector group.
   `onFocus` / `onBlur` stay on the `<li>` (focus events bubble), so focusing any tie link still
   indexes the plate to its dimension.

**Sector controls.** Ten `<button>`s in a `role="group"` overlay, absolutely positioned at the
sector centroid radius **31.5** (= (22 + 41) / 2), inside a container carrying the rose's own
`rotate(rotation)` and each control counter-rotated by `−rotation` (the shipped numeral trick,
`Compass.tsx:200`). Circular hit target: `3.4rem` desktop, `2.75rem` ≤ 900 px (the WCAG 2.2 AA
floor; at a 17 rem mobile plate the ten slots are 53.8 px apart, so 44 px targets do not overlap).

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

  <figure data-viz-id="about.dimension-plate"
          aria-labelledby="about-plate-title" aria-describedby="about-desc">
    <h3 id="about-plate-title" class="visually-hidden">
      Ten dimensions, drawn by what kind of evidence stands behind each answer
    </h3>
    <p id="about-desc" class="plateDesc">…the insight sentence, §8…</p>

    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <g class="stage"><g class="rose"> …bezel, ticks, sectors, jaws, tie ticks, numerals… </g></g>
      <g class="index">…</g><text class="readNumber">…</text><text class="readState">…</text>
    </svg>

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

    <button type="button" class="hubProbe" aria-expanded="false" aria-controls="about-probe">
      <span class="visually-hidden">Show where the ten names come from</span></button>

    <figcaption class="caption">…name / kinds / takeaway…</figcaption>
    <dl class="key">… three terminal forms, glyph + words …</dl>
  </figure>

  <div role="group" aria-label="Filter the ten dimensions">… four buttons …</div>
  <p role="status" class="filterCount">Showing 10 of 10 · every dimension</p>

  <ol class="list">… ten items, each with its rail …</ol>
</section>
```

- The SVG is `aria-hidden` **in its entirety** — bezel, graduations, hatches and rules are structure
  and atmosphere, and every datum they carry is on a real focusable control or in the list
  (`Experience.tsx:79,136` precedent, `encoding-grammar.md` §9.2).
- **Every accessible name carries its value and its units**: the dimension's ordinal and total, its
  side, which kinds of evidence exist, and the **caliper gloss verbatim** — `Measured; source given.`
  / `Self-reported figure.` / `Not measurable; reason given.` (`Caliper.tsx:44-46`). A mark that only
  exists visually makes no claim at all to everyone else (`Caliper.tsx:36-38`).
- The three role dimensions keep the shipped inline `<Caliper state="open">measured from the role</Caliper>`
  on their `<h3>`, with `label` unchanged (`About.tsx:107-114`). R-168, intact.
- One polite live region in the section: `.filterCount`. Asserted by TC-DIM-16.

---

## 8 · The dual read (R-99) and the text alternative (R-101 §9.3)

**3-second headline.** Ten equal sectors. Three are hatched and open at their corners; five are
engraved and plain; two carry closed caliper jaws. Eleven ticks in the bezel gutter, and one gold
mark in the header above.

**30-second detail.** Each sector's form says which of the three kinds of evidence stands behind its
answer; the gutter ticks say which artefacts exist; the list beneath prints the answer, the linked
role, repository and channel item with their real dates, and — where nothing exists — one sentence
saying so.

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

**Final values render on first paint.** Only `stroke-dashoffset` and `opacity` animate; no
coordinate, ordinal, date or count ever passes through a value it is not (R-175,
`encoding-grammar.md` §2.4). The numerals' text content is server-rendered.

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
  .sectorFill, .sectorArc, .numeral, .railRow a {
    transition: fill var(--motion-fast) var(--motion-ease-standard),
                stroke var(--motion-fast) var(--motion-ease-standard),
                color var(--motion-fast) var(--motion-ease-standard);
  }
}
```

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
  elements, as it does today (TC-ABOUT-07, kept).
- **Data unavailable** — impossible at runtime; the terminal forms are derived at build. A module
  refresh failure degrades to `retained` (`dataset-layer-design.md` §3.4) and the rail prints the
  retained `retrievedAt`, so the reader is told the dates are from the previous harvest rather than
  shown a fresh-looking stale plate.

---

## 10 · Performance envelope (R-100)

| Budget | Target | How it is met |
|---|---|---|
| fps, everything active | ≥ 60 | ≈ 190 SVG elements; only `transform`, `opacity`, `fill`, `stroke` and `stroke-dashoffset` animate; **zero** layout-triggering properties; zero `requestAnimationFrame`; zero runtime simulation |
| lazy init | yes | one `IntersectionObserver`, `threshold: 0.15`, disconnected on first intersection |
| full disposal | yes | on unmount: `observer.disconnect()`, the `matchMedia` listener removed, the `data-drawn` timer cleared; every pointer and key handler is React-managed. **Zero** `ResizeObserver`, zero RAF loop, zero timer after `data-drawn` |
| **declared memory ceiling** | **≤ 1.5 MB** JS heap delta while mounted | no image, no texture, no 3D runtime; the component's state is one integer, one nullable integer and one boolean |
| CLS contribution | **0.00** | the stage has a fixed `aspect-ratio: 1`; the ten controls are positioned from the precomputed table in §6; nothing is measured, so nothing reflows after paint |
| LCP | unaffected | `#about` is below the fold; the section contains no image and no font beyond the three already loaded |
| runtime bundle delta | ≈ 2.6 KB gzip component + 0 KB data (the crosslinks are ids in `about.ts`) | no new dependency; **a runtime `d3` import in `#about` is a build failure** (the `no-restricted-imports` list from `SPEC-skills-topology.md` §13 already covers `app/` and `components/`) |
| WebGL contexts | **0** | R-170's one-context-per-section posture is unaffected; this section never had one and does not gain one |

---

## 11 · Files

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
                                          each Dimension gains evidenceRefs (§3.1, §3.2);
                                          dimensions[0].evidence loses its raw figure (§3.4);
                                          add takeaway, insight, keyCopy, filterCopy, probeCopy
components/sections/About/About.tsx        header citation → gold Caliper link (§4);
                                          add figure/figcaption/#about-desc scaffold (§7);
                                          add the four filters + role="status" line (§5.3);
                                          add <EvidenceRail> per item;
                                          REMOVE tabIndex={0} from <li> (§6); keep onFocus/onBlur
components/sections/About/Compass.tsx      three terminal forms (§2.1); tie ticks (§2.2);
                                          .stage wrapper + ZOOM_BOX transform (§5.2);
                                          the ten sector controls + roving tabindex (§6);
                                          the hub probe (§5.4); readState vocabulary (§2.3);
                                          DELETE the stale gold doc-comment at :78
components/sections/About/Compass.module.css   the §2 form/tick/zoom/probe rules;
                                          680ms → var(--motion-cine-in);
                                          overflow: visible → hidden;
                                          the §9 reduced-motion re-score
components/sections/About/About.module.css     .provenance gold treatment; .filters/.filterCount;
                                          three-state .keySwatch (§3.5); .sectors overlay;
                                          mobile plate 14rem → 17rem; .lede 52ch → var(--measure-read)
components/sections/Experience/Experience.tsx  add id={`experience-${span.id}`} to each role track
app/globals.css                            add --plate-sector-fill: rgb(244 246 250 / 0.022);
                                          --plate-sector-fill-lit: rgb(244 246 250 / 0.075);
                                          --plate-sector-fill-src: rgb(244 246 250 / 0.055)
                                          (the two shipped literals, tokenised; raw values live only
                                           here and in lib/palette.ts — design-system-lock §1.4 r.1)
app/data/canonical/selectors.ts            add selectDimensionEvidence(), selectDimensionsSource()
app/data/canonical/schema/repositories.ts  add DimensionsSource (§4)
scripts/dataset/sources/repositories.mjs   the four-route citation adapter (§4)
scripts/validate/dataset_integrity.mjs     the three §4 build-stopping assertions
app/data/canonical/dossiers.ts             add the about.dimension-plate dossier (§13)
tests/e2e/about.spec.ts                    amend TC-ABOUT-02 and TC-ABOUT-06 (§12)
```

**Delete** — nothing. The instrument is extended in place; the preservation diff shows no removed
component, no removed CSS module and no removed content field.

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
  readonly label: string;          // rendered from the dataset, never authored
  readonly what: string;           // from EvidenceRef
  readonly href: string;           // '#experience-anz' | an https URL
  readonly external: boolean;      // true iff href starts with 'https://'
  readonly caliper: CaliperState;  // derived by dataset-layer-design.md §5.2
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
    <span class="railKind">ROLE</span>
    <a href="#experience-ato"
       data-mark-id="about.d01.role" data-source-id="cv.roles.role-ato-2026.title"
       data-caliper="self-reported" data-retrieved-at="…">
      Scrum Master / Project Manager · Australian Taxation Office · March 2026 – present
    </a>
    <p class="railWhat">The COBOL/mainframe test-evidence toolchain — REXX, SMF, SDSF, PCOMM,
       PowerShell, VBA — across 200+ SIT and E2E scenarios.</p>
    <Caliper state="self-reported">CV of record, page 1</Caliper>
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

---

## 12 · Tests

`tests/e2e/about-dimensions.spec.ts`. `TC-ABOUT-01`, `03`, `04`, `05`, `07` are **untouched and must
keep passing**. Two amendments:

- **TC-ABOUT-02** currently asserts exactly two `<p>` per `<li>` — the rail adds more. Amend to:
  `li [data-answer]` has length > 40, `li [data-evidence]` has length > 10, both per item, and drop
  the `toHaveCount(2)` on `p`.
- **TC-ABOUT-06** currently focuses the `<li>` itself. Amend to focus the first sector control and
  assert `[data-index="0"]` is focused and `#about ol li:first-child` carries `data-active="true"`.

| id | assertion |
|---|---|
| **TC-DIM-01** | `#about [data-form]` = 10; `[data-form="sourced"]` = 2, `[data-form="self-reported"]` = 5, `[data-form="open"]` = 3; the two sourced controls are dimensions 1 and 10 |
| **TC-DIM-02** | `#about svg .jaw` = 4 (two per sourced sector) and **zero** jaws sit inside a `[data-form="open"]` or `[data-form="self-reported"]` group; `.rule` count = 21 (3 × the 7 non-open sectors) |
| **TC-DIM-03** | `#about svg .tieTick` = **11**; per dimension the tick count equals its rail-row count; **no tick exists for a kind with no rail row** |
| **TC-DIM-04** | every `.railRow a[href^="https://"]` returns HTTP 200 unauthenticated (`request.get`), and every `.railRow a[href^="#"]` resolves to an element that exists in the page |
| **TC-DIM-05** | the citation `<a>`'s `href` matches `^https://github\.com/Victordtesla24/aether-job-career-agent/blob/[0-9a-f]{40}/apps/api/app/routers/jobs\.py#L\d+$` and returns HTTP 200 |
| **TC-DIM-06** | `#about [data-gold="true"]` = **exactly 1**, and it is the citation — asserted at rest, with a sector pinned, with a filter applied, and with the probe open |
| **TC-DIM-07** | the citation renders a `<Caliper state="sourced">`; `#about [data-state="sourced"]` ≥ 1 — **the site's first rendered `sourced` caliper** (closes C-3); the printed blob short-sha matches `/^[0-9a-f]{11}$/` and is a prefix of `dimensionsSource.blobSha` from `/dataset-provenance.json`; it is **never** the literal `038073350df…` with an ellipsis |
| **TC-DIM-08** | **no proficiency channel**: every `.sectorFill` path `d` is congruent — all ten have identical arc radii and identical sweep; the ten `.sectorArc` elements have at most **3** distinct computed `stroke-width` values (one per terminal form) and at most 3 distinct `stroke` values; no `<rect>` exists in the plate; no `%` character appears adjacent to a dimension name; zero `progress`/`meter`/`[role="progressbar"]`/`[role="meter"]` |
| **TC-DIM-09** | pressing `CV only` sets `.filterCount` to contain `Showing 5 of 10`, hides 5 list items, and leaves **all ten** sectors in the DOM with their `data-form` unchanged; the dimmed sectors compute `opacity: 0.28`, never `display:none` or `visibility:hidden` |
| **TC-DIM-10** | keyboard: focus the sector group, `ArrowRight` × 3 → `data-index="3"`; `ArrowDown` from index 0 → lands on a control with the **same** `data-form`; `Home` → 0, `End` → 9; `Enter` sets `data-pinned`; `Escape` clears `data-pinned` and `aria-expanded="false"` on the probe; `Shift+Tab` from index 0 leaves the group (**no trap**) |
| **TC-DIM-11** | `Enter` on a sector sets `.stage[data-zoomed]`; its computed `transform` matrix equals `scale(3.3613) translate(0,32.07)` about `50 50` within 0.01; `.tieLabel` reaches `opacity: 1` and its computed font-size on a 384 px stage is between 10.4 px and 11.6 px; `Escape` restores `transform: none` |
| **TC-DIM-12** | every in-page tie href (`#experience-ato`, `#experience-anz`, `#experience-myob`, `#experience-independent`) resolves to an existing element; **zero** dead anchors |
| **TC-DIM-13** | each sector control's `aria-label` contains its ordinal (`Dimension N of 10`), its name, its side, and the **verbatim caliper gloss** for its form; the three role controls contain `Not measurable; reason given.` |
| **TC-DIM-14** | the six gap sentences render as visible text; **no** `.railRow` exists without an `<a>`; **no** element inside `#about` has `data-kind` without a matching visible link |
| **TC-DIM-15** | under `prefers-reduced-motion: reduce`: every `.tieTick`, `.railRow` and `.numeral` reaches `opacity: 1`; no element's computed `transform` differs from `none` **during entrance**; and at least one ordered staggered fade is observable (`animation-delay` strictly increasing across ≥ 3 `.tieTick`s) |
| **TC-DIM-16** | exactly **one** `[role="status"]`/`aria-live` element in `#about`, and it is `.filterCount`; the caption and hub readout carry neither |
| **TC-DIM-17** | with `javaScriptEnabled: false`: 10 sectors with their `data-form`, 11 tie ticks, 10 numerals, 10 answers, 11 tie links, 6 gap sentences and the citation are all present in the served HTML |
| **TC-DIM-18** | `dataset_integrity.mjs` passes: every `data-source-id` in `#about` resolves in `/dataset-provenance.json`; `dimensionsSource.names` is ordered-equal to the ten rendered `<h3>` names; the dossier's `goldMark` is the only `data-gold="true"` in the view |
| **TC-DIM-19** | axe-core on `#about` reports zero violations at WCAG 2.2 AA — at rest, with a sector focused, with a sector pinned and zoomed, with the probe open, and with each of the four filters applied |
| **TC-DIM-20** | **at 390 × 844**: all ten sector controls are ≥ 44 × 44 CSS px, none overlaps another (pairwise bounding-box test), all 11 tie ticks are still rendered, and no `.sectors` ancestor computes `display: none` |
| **TC-DIM-21** | the gold contrast spec (`tests/a11y/gold-contrast.spec.ts`) covers the citation: `--gold` on the section ground computes ≥ 4.5:1 |
| **TC-DIM-22** | `tests/monochrome/gold-semantics.spec.ts` extended: no `--gold*` token resolves on any element inside `#about svg`, in any state — the plate is gold-free by assertion, not by habit |

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
    'where there is a repository or a channel item you can open, plain engraving where the CV of ' +
    'record is the only source, and dashed arms that do not meet over a 45° hatch for the three ' +
    'the engine computes from the role. Ticks in the bezel gutter say which kinds of artefact ' +
    'exist. No sector carries a magnitude, and none can: the data has no such field.',

  datasetFields: [
    'repositories.aether-job-career-agent.dimensionsSource',
    'repositories.aether-job-career-agent.htmlUrl',
    'repositories.aether-job-career-agent.primaryLanguage',
    'repositories.aether-job-career-agent.license',
    'cv.roles.role-ato-2026.title',
    'cv.roles.role-ato-2026.start',
    'cv.roles.role-myob-2010.title',
    'cv.roles.role-myob-2010.start',
    'cv.roles.role-myob-2010.end',
    'cv.roles.role-anz-sdl-2017.title',
    'cv.roles.role-anz-sdl-2017.start',
    'cv.roles.role-anz-sdl-2017.end',
    'cv.roles.role-anz-arch-2017.title',
    'cv.roles.role-independent-2025.title',
    'cv.roles.role-independent-2025.start',
    'cv.roles.role-independent-2025.end',
    'channel.videos.p9pGAmqJCSk.title',
    'channel.videos.p9pGAmqJCSk.publishDate',
    'channel.videos.p9pGAmqJCSk.duration',
    'channel.videos.p9pGAmqJCSk.description',
    'channel.videos.gMe4FZbjcQE.title',
    'channel.videos.gMe4FZbjcQE.publishDate',
    'channel.videos.gMe4FZbjcQE.duration',
    'manifest.modules.repositories.observedAt',
  ],

  goldMark: 'repositories.aether-job-career-agent.dimensionsSource',

  interactions: [
    { kind: 'hover-reveal', description: 'Pointer or focus on a sector or a list item turns the face to bring that dimension under the index, lights its sector and its ticks, and raises its evidence rail. Nothing appears that was not already legible: every tie, date and link is in the DOM before any interaction.' },
    { kind: 'focus-zoom',   description: 'Enter on a sector pins it and scales the plate 3.3613× about the reading position over 320 ms, at which scale the three evidence ticks carry their own labels — ROLE, REPO, CHAN. Escape restores.' },
    { kind: 'filter',       description: 'Four controls filter the ten by terminal form. Sectors are dimmed, never removed, and never lose their form: a dim here means filtered, not unevidenced.' },
    { kind: 'drill-down',   description: 'Every tie is a real link — into the Experience track that ran the programme, out to the repository, out to the channel item.' },
    { kind: 'curiosity',    description: 'The hub probe shows all ten numerals at once and lengthens the ten major graduations, and prints the file, the function, the line and the blob sha: the ten axes are not ten opinions, they are the arguments of a function, all equal and none ranked.' },
  ],

  demonstratedSkill:
    'An instrument that gains a third state without gaining a scale: the caliper’s grammar — closed ' +
    'jaws, plain engraving, arms that do not meet — carried from a 12-pixel inline mark up to a ' +
    '384-pixel face at the same 45°, so a reader who learned the mark once in the hero reads the ' +
    'plate without a legend. A compositor-only zoom that reframes an SVG with one transform and two ' +
    'counter-scaled type sizes, so a 3.36× magnification costs no requestAnimationFrame, no layout ' +
    'and no reflow. And a citation that is verified rather than asserted: the build fetches the ' +
    'source file at a pinned commit and fails if the ten names on this page are not the ten names ' +
    'in that function, in that order.',

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

1. **The blob sha in the contract is truncated** (`038073350df…`). The full 40-hex value has **not**
   been observed in this run. §4 makes the adapter fetch it and asserts the printed 11 characters are
   a prefix of the observed value. Nothing renders an ellipsis as if it were a sha.
2. **Line 226 is an observation, not a constant.** The contract records it; the adapter re-observes
   it every build and prints what it finds. If it moves, `names` still governs and the drift is
   recorded — the citation must never point at a line that no longer holds the function.
3. **The Experience anchors do not exist yet.** `id="experience-{spanId}"` is a required change to
   `Experience.tsx`; TC-DIM-12 fails the build until it lands. About must never ship a dead anchor.
4. **The channel speaks to two of the ten dimensions.** Nine of the ten public videos are Vedic and
   Sanskrit astronomy; they evidence curiosity and the instinct to teach (R-120), which is not one
   of the engine's ten. R-121's weave is satisfied honestly at two, not padded to ten.
5. **`aether-job-career-agent`'s public CI is red on `main`** (`R-184-flagship-ci-diagnosis.md`), and
   tie 01·repo says so on the page. If R-184's remediation turns it green, that sentence changes in
   the same commit — the site never carries a statement about itself its own data contradicts
   (R-182, R-183, `encoding-grammar.md` §11).
6. **`repositories.aether-job-career-agent.testFileCount` is not in the shipped dataset today.** The
   392 figure in tie 01·repo is in `corpus-repositories.json` but not yet in
   `app/data/canonical/generated/`. Either add the field to the repositories adapter in the same
   commit, or drop the figure from the sentence. It may **not** ship as an unbound number.
7. **The three role dimensions have no candidate-side evidence and never will.** That is the point of
   the open caliper, and it is the reason the section refuses to draw ten equal-looking answers.
8. **`--fs-*`, `--space-*`, `--measure-read`, `--motion-emphatic`, `--motion-cine-in` and
   `--stagger-tight` do not exist in `app/globals.css` today** — they are `design-system-lock.md`
   §2.2, §3.3 and §4.2 deliverables. This spec consumes them. If the token commit has not landed
   when this one does, each use ships with the shipped literal as a `var(--token, literal)` fallback
   and a follow-up removes the fallback; it does **not** ship a bare literal.
