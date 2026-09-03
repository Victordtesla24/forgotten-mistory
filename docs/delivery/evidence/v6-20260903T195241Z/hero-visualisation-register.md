# The Hero Visualisation Register

**Artifact:** execution step 15 — *"Author the hero visualisation register for all six
sections, with dossiers and rationale notes."* → **Gates K, M, Q**
**Requirements discharged:** R-93, R-94, R-95, R-96, R-97, R-99, R-100, R-101, R-109,
R-110, R-112, R-116, R-117 · with R-166, R-169, R-176, R-187, R-188 held intact
**Success criteria served:** SC-50.1, SC-51.1, SC-52.1, SC-53.1, SC-55.1, SC-56.1,
SC-57.1, SC-62.1, SC-65.1, SC-66.1
**Companion:** `encoding-grammar.md` (same directory) — every dossier below inherits it
**Repository:** `/root/forgotten-mistory` · **Written:** 2026-09-03

---

## 0 · How to read this register

R-94 requires **one registered hero visualisation per section**, in the focal position
(R-93), of the class R-96 assigns. Six sections, six entries, no more and no fewer. A
second visualisation in a section is a *supporting* artefact and inherits the hero's
grammar; it is not registered here.

Each dossier carries the eight fields R-112 demands, plus two the v6 audit makes
necessary:

1. **What it shows** · 2. **Dataset and provenance** · 3. **Interactions** (hover
reveal · focus/zoom · filter or drill-down · one curiosity-rewarding state, R-97) ·
4. **Demonstrated skill** · 5. **Takeaway line** (R-99, in the site's voice) ·
6. **Performance envelope** · 7. **Accessible equivalent** (R-101) · 8. **Render class**
(R-109) · **9. Status against the repository** · **10. Preservation obligations**.

**Two honesty notes about this document itself.**

- **No performance figure below is a measurement.** Ceilings and frame budgets are
  *declared* budgets in R-100's sense; T-22 produces the measurements. Where a dossier
  says "≤ 24 MB", that is a ceiling this register is committing to, not a reading taken.
- **Status is stated against the repository as it stands**, verified by reading the
  files cited. Where a hero does not yet exist, the dossier says so plainly and
  describes what must be built; it never describes unbuilt work in the present tense.

---

## Register at a glance

| # | Section | Hero | Class (R-109) | Status in repo |
|---|---|---|---|---|
| 1 | Front Door | **The Lattice** — repository · skill · delivery topology as a volumetric field | WebGL | Atmosphere shader exists; **not yet topology-driven** |
| 2 | About Me | **The Instrument Face** — ten dimensions, each opening into its evidence | SVG | Face exists; **drill-into-evidence not yet built** (R-188) |
| 3 | Experience | **The Span** — roles drawn to real duration, context → decision → outcome, with the absorbed **Mechanisms** diagram layer | SVG/HTML (+ WebGL texture) | Span exists and is preserved (R-169); depth + absorption pending (R-174, R-176) |
| 4 | Skills & Certifications | **The Bench** — provenance topology, sources wired to capabilities | SVG over HTML | Bipartite bench exists; force-directed form gated by R-187's escape clause |
| 5 | What is keeping me busy | **The Double Rail** — build strand and create strand on one shared timeline | Canvas 2D (+ SVG) | Repository strand exists as the vitrine; **creator strand absent** (R-186) |
| 6 | Feedback & Coffee | **The Open Caliper** — participatory; the reader sets the next thing to be measured | SVG | Corrections ledger exists; **participatory interactive not built** (R-177) |

---

## 1 · Front Door — **The Lattice**

*Class assigned by R-96: WebGL signature scene from real repository, skill and delivery
topology.*

**1. What it shows.** The working set, as a standing structure. Every public repository
that has evidence attached is a node in depth; every capability it evidences is a node
on the near plane; the delivery history — commits over time — is the field's grain. The
reader is not asked to read a value off it. They are asked to see, in three seconds,
that there is a *lot* of it, that it is *connected*, and that one strand of it is lit —
the single gold filament, running from the repository the site is most willing to be
judged on to the capability it evidences in production. The scene is the site's
thesis stated before a word is read: **this is a body of work, and each part of it is
attached to something checkable.**

**2. Dataset and provenance.** `app/data/generated/repo-harvest.json` — `harvestedAt`,
`publicRepoCount: 38`, and per repository `commits`, `firstCommit`, `lastPush`,
`primaryLanguage`, `languages`, `sizeKb`, `openIssues`. Produced against the real
GitHub API by `scripts/build/harvest_repos.mjs` and stamped with the date it was taken
(`:62`, `:91`). Capability nodes and their links come from `app/data/portfolio/skills.ts`
(`sources` `:45-59`, `capabilities` `:80-215`). The hero ledger figures and their
sources are `app/data/portfolio/hero.ts:26-45`, each carrying its `source` string
because *"a number without a source is a boast"* (`hero.ts:19`). Under R-182 the harvest
becomes a deploy-time refresh, and the limits copy changes in the same commit.

**3. Interactions.**
- *Hover reveal:* the structure parallax-tracks the pointer and the nearest strand
  resolves — its repository name, its commit count and its harvest date appear as HTML
  over the canvas (never painted into the scene, §6.1 of the grammar).
- *Focus / zoom:* keyboard focus steps strand by strand in data order; the camera eases
  to frame the focused strand. Escape returns to the establishing view.
- *Filter / drill-down:* three filters that are real facts, not moods — *has a live
  URL* · *measured in production* · *touched in the last 90 days*. Filtering removes
  strands rather than dimming them, so the density change itself carries the answer.
- *Curiosity-rewarding state (R-97):* holding focus on a strand for ~1.2 s unfolds its
  **first commit date** and draws the strand's growth from that date to now as a single
  sweep — the reader discovers that the structure has a history, not just a size. It
  rewards patience and gives nothing away to a reader in a hurry.

**4. Demonstrated skill.** GLSL and `three.js` authored from scratch — one context,
one full-screen program, no imported scene graph — driven by real typed data rather
than noise, and degrading to a composed still. This is the capability *"WebGL and GLSL
— three.js, React Three Fiber"* claimed at `app/data/portfolio/skills.ts:169-176`, with
this repository as its own evidence.

**5. Takeaway line.** *"Thirty-eight repositories. Six are worth your time, and each
one is attached to something you can check."*

**6. Performance envelope.** 60 fps at 1440p desktop and on mid-tier mobile;
**declared ceiling ≤ 24 MB** GPU + JS for the scene; one WebGL context, dynamically
imported so the runtime never lands on the critical path
(`components/gl/GLCanvas.tsx:11-21`); DPR capped at 1.75 (`:28`); stencil off (`:33`);
lazy init on viewport entry; full disposal of geometry, material and RAF on unmount;
probe context released immediately (`components/gl/useGLCapability.ts:45`). Software
rasterisers are treated as unsupported — *"a static page beats a stuttering one"*
(`useGLCapability.ts:33-37`). **Low-power path:** a static composition of the same
lattice at rest with the gold filament drawn, which must pass the same admiration panel
as the animated form.

**7. Accessible equivalent.** The scene is `role="img"` with a `<title>` and a `<desc>`
that states the insight, not the picture — the count, the connectedness, and which
strand is lit and why. Beneath it, the hero's three ledger figures render as real text
with their sources (`hero.ts:26-45`), each in a caliper whose state is announced to
assistive technology as well as drawn (`components/marks/Caliper.tsx:34-37, 41-53`).
Under `prefers-reduced-motion` and with JavaScript failed, the ledger and the statement
render at final value on first paint — no counter ever passes through zero (R-175).

**8. Render class.** WebGL — spatial and cinematic. Correct per R-109.

**9. Status.** The Front Door currently renders a volumetric monochrome atmosphere
(`components/sections/Hero/HeroAtmosphere.tsx`, `atmosphere.glsl.ts`) — the right class,
the right craft, but **its structure is not yet the repository/skill/delivery
topology R-96 names**. The gap is the data binding, not the renderer. Closing it means
feeding harvest and skills data into the existing program's uniforms; it does not mean
replacing the shader.

**10. Preservation obligations.** R-170 — one context per section, none on a phone,
static export, no third-party trackers. R-175 — no zero-state on any counter.

---

## 2 · About Me — **The Instrument Face**

*Class assigned by R-96: interactive 10-dimension rendering opening into evidence.*

**1. What it shows.** The ten dimensions Vikram's own job-fit engine scores a candidate
on, drawn as an instrument face that turns to index the dimension being read. Seven
sectors are engraved — computed from the candidate. Three are drawn **open**, over the
same 45° hatch the open caliper uses, because the engine computes them from the *role*,
not the person (`components/sections/About/Compass.tsx:139-141`). **There are no
scores.** The refusal is the argument: the engine will not publish a figure it cannot
source, and a number he assigns himself has no source at all
(`app/data/portfolio/about.ts:9-16`, `:36`).

**2. Dataset and provenance.** Ten dimensions taken **verbatim**, in the product's own
wording and order, from `Victordtesla24/aether-job-career-agent`, file
`apps/api/app/routers/jobs.py::build_fit_dimensions` — cited on the page and recorded at
`app/data/portfolio/about.ts:4-7` (R-172 fixes this as the source of record; the count
is exactly ten, verified by `grep -c "name: '" app/data/portfolio/about.ts` → `10`).
Each dimension carries `side: 'candidate' | 'role'` (`:22-23`), an `answer` with no
self-praising adjective (`:25`), and an `evidence` string naming where a reader can
check it (`:27`). Evidence targets resolve into `app/data/portfolio/experience.ts`,
`app/data/portfolio/vitrine.ts` and the channel corpus.

**3. Interactions.**
- *Hover reveal:* pointing at a sector turns the face to index it and surfaces that
  dimension's answer and evidence line.
- *Focus / zoom:* arrow keys walk the ten sectors in the product's order; the focused
  sector's evidence panel is the same DOM the hover uses, so keyboard and pointer are
  never two implementations.
- *Filter / drill-down (R-188, the part not yet built):* the evidence line becomes a
  **link into the artefact that proves it** — the Experience entry, the repository
  plate, or the channel item — and the target arrives already scrolled to and marked,
  so the reader lands on the proof rather than on the section containing it.
- *Curiosity-rewarding state:* selecting one of the three **role-side** dimensions
  turns the face inside out — the open sectors become the lit ones, and the face reads
  as *what he is looking for* rather than *what he is*. It is the honest reading of a
  two-sided measure (`app/data/portfolio/about.ts:15-18`) and most readers will never
  find it.

**4. Demonstrated skill.** Reading a real production scoring model out of its own
source file and rendering it as an instrument rather than a radar chart — including the
discipline to leave the values off. Precision SVG: engraved sectors, a shared hatch
pattern, optical alignment at every DPR.

**5. Takeaway line.** *"Ten dimensions, no scores — three of them were never about me
in the first place."*

**6. Performance envelope.** Pure SVG and CSS transforms; no WebGL context; 60 fps by
construction (transform and opacity only, zero layout-triggering properties);
**declared ceiling ≤ 3 MB**; the face is inert until the section is within a viewport
of entry. **Low-power path:** the face at rest, indexed to dimension 01, with all ten
answers rendered as text beneath — which is the section's normal reading order anyway.

**7. Accessible equivalent.** The face is `role="img"` with an `aria-label` that changes
with the indexed dimension and states the insight, including the refusal:
*"Instrument face of ten dimensions. No scores: three of the ten are computed from the
role and are drawn open."* (`components/sections/About/Compass.tsx:130-136`). All ten
dimensions — name, side, answer, evidence — are real text on the page, in the product's
order, and the *measured from the role* annotation is carried in words, not only in the
hatch. Sectors are keyboard-reachable in data order; the evidence links are ordinary
links.

**8. Render class.** SVG — precision graphics. Correct per R-109.

**9. Status.** The instrument face exists (`components/sections/About/Compass.tsx`, 227
lines) with the hatch, the three open sectors and the aria-label. **What R-188 still
requires is the opening-into-evidence**: today the evidence is a string, not a route
into the artefact that proves it.

**10. Preservation obligations.** R-168, in full — verbatim dimensions, the cited source
file path, the refusal to publish self-assigned scores, and the *measured from the role*
annotations. R-171: if any new requirement appears to conflict with these, both are
satisfied; neither is traded.

---

## 3 · Experience — **The Span**, with **Mechanisms**

*Class assigned by R-96: career-trajectory visualisation, context → decision → outcome
with drill-down, plus the authored system and delivery-flow diagrams absorbed from the
Architecture Lab (R-176).*

**1. What it shows.** Every role drawn to its **real duration** on one sixteen-year
axis. The 7.8 years at ANZ are drawn 7.8 years wide beside the six-month ATO
engagement, and the resulting asymmetry is not a layout problem to be tidied — it is
the section's entire content. Selecting a role opens it as **context → decision →
outcome**, and beneath the opened role sit the authored **Mechanisms**: the system and
delivery-flow diagrams absorbed from the standalone Architecture Lab, now attached to
the engagement they describe instead of competing with it from a seventh section.

**2. Dataset and provenance.** Month-precision spans as decimal years, read off the
`dates` string of each role, at `app/data/portfolio/experience.ts:23-56` (ATO from
March 2026, ANZ September 2017 → June 2025, and so on). The roles themselves stay in
`app/data/siteContent.ts`, *"the single source of truth kept in parity with the CV"*
(`experience.ts:3-8`) — nothing is restated. Each role carries the one figure a hiring
executive would actually ask about, or **`null` where the CV states none**
(`experience.ts:19-20`) — the absence is authored, not missing. Figures reconcile to
the CV of record, `public/docs/Vik_Resume_Final.pdf`, md5
`16b856c0f3f4ec0d801fdde6d084452c`, 157,615 bytes, digest written from the shipped bytes
on every build (`app/data/generated/cv-fingerprint.ts:4-14`). Qualifiers travel with
their figures: *"−38% error-budget breaches — measured against a simulated budget, not
live traffic"* (`experience.ts:36-39`).

**3. Interactions.**
- *Hover reveal:* a track raises and shows its exact span and its headline figure with
  the figure's caveat.
- *Focus / zoom:* tracks are real `<button>` elements
  (`components/sections/Experience/Experience.tsx:97-101`); the axis can be scoped to a
  decade, and the ruler and the bars re-derive from **one** expression (`:86`, `:141`)
  so they cannot drift.
- *Filter / drill-down:* opening a role reveals context → decision → outcome (R-174),
  and from there the **Mechanisms** diagram for that engagement, drawn left-to-right per
  §7 of the grammar, with labelled edges and boundaries that mirror real system
  boundaries.
- *Curiosity-rewarding state:* holding two roles selected draws the **overlap** — the
  months where two engagements ran at once — as a single hatched band on the axis. It
  is a fact only the duration-true drawing can produce, and it rewards a reader curious
  enough to compare rather than scroll.

**4. Demonstrated skill.** Programme-scale delivery made legible: sixteen years reduced
to one honest axis, with per-engagement system diagrams authored rather than
screenshotted. The diagrams themselves demonstrate the architecture practice the roles
claim.

**5. Takeaway line.** *"The eight years at ANZ are the reason the rest of this reads
the way it does."*

**6. Performance envelope.** The chart is HTML and SVG — no WebGL required to read a
value. One shared WebGL context renders **texture only** behind it
(`components/sections/Experience/CareerStrata.tsx`), and deliberately does not redraw
the roles: *"the DOM chart is the data, and a second, subtly misaligned copy of it in 3D
was actively misleading"* (`CareerStrata.tsx:11-16`). One full-screen quad, one fragment
program, no geometry and no textures (`:16`). **Declared ceiling ≤ 18 MB** including the
strata layer; 60 fps; lazy init; full disposal; DPR ≤ 1.75. **Low-power path:** the
chart alone, with the strata layer absent — which loses no data at all, because the
strata layer never carried any.

**7. Accessible equivalent.** *"The same sixteen-year axis, so the proportions survive
a screen reader"* (`components/sections/Experience/Experience.tsx:36-39`). Every track
is a button with an accessible name carrying role, company and dates (`:101`); durations
are printed as text on the bar in years or months (`:117-119`); gridlines and the axis
strip are `aria-hidden` (`:79`, `:136`) because a ruler is not content. Every Mechanisms
diagram is `role="img"` with a `<title>` and a `<desc>` describing the mechanism in
prose, following the pattern at `components/sections/Vitrine/Drawings.tsx:33-40` —
R-176 explicitly requires this of every canvas or WebGL artefact absorbed from the
Architecture Lab.

**8. Render class.** SVG/HTML for the data, WebGL for atmosphere only. Correct per
R-109 and per §6.2 of the grammar.

**9. Status.** The duration-true span exists and is **protected by R-169**. Outstanding:
R-174 (depth proportionate to duration — ANZ currently renders a single metric line
while the six-month ATO role carries six bullets) and R-176 (absorb the Architecture
Lab as the Mechanisms layer, then remove the standalone section and its nav entry as a
shipped removal under R-162, discarding none of its content).

**10. Preservation obligations.** R-169 — every bar drawn to its real duration on one
axis with the ANZ span visibly dominant, and the bespoke per-repository diagrams with
their descriptive captions. R-173 — one sourced figure for years of experience,
everywhere.

---

## 4 · Skills & Certifications — **The Bench**

*Class assigned by R-96 and R-187: force-directed skill topology encoding proficiency,
recency and adjacency, cross-linked to evidence — **subject to R-187's escape clause**,
which this dossier answers in full at §4.11.*

**1. What it shows.** Where each capability was measured. Thirteen sources on one side,
seventeen capabilities on the other, and a hairline between every pair that a line of
the CV or a line of a repository actually connects. *"A skills section that could not
draw this graph would be a list of adjectives; this one can, and the drawing is the
proof"* (`components/sections/Skills/Bench.tsx:16-22`). There are **no proficiency
bars**, and the section says why: *"nobody can check one"*
(`app/data/portfolio/skills.ts:6-9`; the lede repeats it at `:225`).

**2. Dataset and provenance.** `app/data/portfolio/skills.ts`. Thirteen `sources`,
typed by how a reader would verify each one — a `programme` by asking the employer, a
`repository` by opening it, a `credential` by its issuing body (`:27-31`, `:45-59`).
Seventeen `capabilities` (`:80-215`), each with `evidence` that is *"what was actually
measured. Never an adjective"* (`:67`), a `where`, explicit `sources` ids, a three-state
`status`, and an optional `caveat` (`:64-72`). The source ids are **authored, not
parsed**, because `ATO · Payday Super` contains the same separator that joins two
sources elsewhere and splitting on it *"would invent an employer called Payday Super"*
(`:38-44`). The CV calibration line prints md5 `16b856c0`, 157,615 bytes and the
document date, from `app/data/generated/cv-fingerprint.ts:11-14`, so a reader can run
`md5sum public/docs/Vik_Resume_Final.pdf` and check it themselves (`:7`).

**3. Interactions.**
- *Hover reveal:* focusing a node dims what it is **not** connected to. This is *"a
  reading aid, not a disclosure — every wire and every label is present and legible
  before anyone touches it, and the full record with its evidence sits directly
  beneath"* (`Bench.tsx:38-42`).
- *Focus / zoom:* both rails are real `<button>` elements in normal flow; only the
  curves are drawn, *"which is the one thing HTML cannot do"* (`Bench.tsx:24-31`).
  Keyboard traversal walks sources and capabilities in registry order.
- *Filter / drill-down:* *Everything* · *Production only* · *Not yet held*
  (`app/data/portfolio/skills.ts:226-230`), and selecting a capability drives the record
  beneath it (`Bench.tsx:84-89`, the `onSelect` contract).
- *Curiosity-rewarding state:* selecting a **source** rather than a capability shows
  what that one engagement or repository is carrying — the ANZ node lighting five
  capabilities at once makes the eight years legible as a fact about the graph, not a
  sentence about a CV.

**4. Demonstrated skill.** Building a bipartite provenance graph out of a real evidence
model and refusing, at every point, to convert it into a score. Measuring anchor points
from live layout and drawing only the curves — a hybrid HTML/SVG technique that keeps
every label selectable, focusable and readable by assistive technology.

**5. Takeaway line.** *"Every line on this page starts somewhere you can go and
check — and the one capability with no evidence yet has no line at all."*

**6. Performance envelope.** SVG over HTML; no WebGL context in this section;
**declared ceiling ≤ 6 MB**; wire geometry recomputed only on layout change
(ResizeObserver), never per frame; 60 fps by construction because only opacity and
transform animate. **Low-power path:** the rails and wires at rest with no dimming
behaviour — which loses nothing, since nothing is hidden behind the interaction.

**7. Accessible equivalent.** The rails *are* the accessible structure: real buttons,
in normal flow, with the full record and its evidence rendered as text directly beneath
the drawing (`Bench.tsx:24-31`, `:38-42`). Status is carried by glyph **and** words —
`●` *measured in production*, `◐` *measured outside production*, `○` *in progress, not
yet held* (`app/data/portfolio/skills.ts:75-80`) — never by colour alone. Caveats render
as text beside the figures they qualify.

**8. Render class.** SVG for the wires, HTML for the labels. Correct per R-109 and §6.1
of the grammar.

**9. Status.** The bench exists (`components/sections/Skills/Bench.tsx`, 432 lines) as a
**bipartite rail-and-wire graph with a fixed layout**, not the force-directed topology
R-96 and R-187 name. It already satisfies R-93's focal rule and R-97's interaction
depth — the static table the v6 audit describes has been superseded — but it does not
yet encode **proficiency, recency and adjacency** as R-96 requires.

**10. Preservation obligations (R-166, every clause).** The three states; the evidence
column; the where column; the explicit refusal of proficiency bars with its reason; the
qualifying footnotes (the −38% measured against a simulated error budget; *"Compose, not
Kubernetes — there are no cluster manifests in that repository"*); and the CV
calibration line with document hash, byte size and date.

### 4.11 · R-187's escape clause, answered

R-187 permits the topology **only if it is both more honest and more explorable than
the artefact it replaces** — *"if it cannot be both, the table stays until it can."*
This register treats that as a live gate, not a formality, because a force-directed
layout is exactly the kind of artefact that trades honesty for motion.

**How each calibration semantic survives the rebuild — the pass conditions.**

| R-166 semantic | Survives as | Fails if |
|---|---|---|
| Three states | Node terminal form and texture — solid / half / open ring, plus the glyph and its words on the node's label. Nominal, never a ramp (grammar §2.3) | any state is mapped to node size, force strength, edge length, ordering or opacity |
| Evidence | The `evidence` string renders in the node's panel **and** in the record beneath the drawing, unchanged | evidence is reachable only by hovering a node |
| Where | The `where` string, and the wire itself terminating at the named source node | source nodes are collapsed into a category |
| Qualifying footnotes | `caveat` renders at the same prominence as the figure it qualifies, in the same view | a caveat is moved to a tooltip, a footnote marker, or a second screen |
| Refusal of proficiency bars | No bar, no gauge, no score anywhere; the lede's reason stays on the page verbatim | proficiency is encoded as size, radius, centrality, or force |
| CV calibration line | md5 `16b856c0`, 157,615 bytes and the date, printed in the section footer from the build-time digest | the line is moved out of the section or shortened |
| No-evidence rule | The pending capability has **no wire**, and it still has a **row** stating *"studying; no certificate issued"* with its caveat | it is drawn as a floating node, a dimmed node, or a zero |

**The honest problem with "proficiency" in R-96.** R-96 asks the topology to encode
proficiency; R-166 forbids publishing proficiency, and `skills.ts:30-33` states that
status *"is about where the evidence was taken, never about how good he is at it."*
R-171 requires satisfying both rather than trading one away. The resolution: **the
topology encodes evidence weight, not self-assessment** — how many independent sources
attest a capability, and of what kind (programme / repository / credential) — and the
node label says so in words. Node degree is a fact a reader can count off the drawing;
a proficiency percentage is not. **Recency** is encoded from `lastPush` and `firstCommit`
in `repo-harvest.json` and from role end dates in `experience.ts` — dated facts, shown
with their dates. **Adjacency** is encoded from shared sources, which is already the
data model. Nothing self-assigned enters the layout.

**The falsifiable test, run at Gate K before the bench is replaced.**

1. *More honest:* every row of the table has a node; every caveat and both footnotes
   render at equal prominence; the CV line is present; the no-evidence capability has a
   row and no wire; no semantic in the table above is absent from the topology. Any miss
   → **fail**.
2. *More explorable:* keyboard traversal reaches every node and every edge; filtering
   works without a pointer; the drill-down reaches the evidencing repository or
   engagement; and the curiosity state exists. Any miss → **fail**.
3. *No new dishonesty:* no force-derived position is readable as a magnitude; no
   simulation state is non-deterministic across loads in a way that changes what the
   drawing appears to claim; the layout is seeded and settles to the same arrangement
   every time, so two readers discussing it are discussing the same picture.

**The fallback, stated plainly.** If any clause of test 1, 2 or 3 fails, **the current
bench stays**, and it stays as it is — not as a placeholder and not with an apology
attached. That is not a soft landing: the bench already meets R-93, R-97 and every
clause of R-166, so shipping it is a compliant outcome and shipping a topology that
loses one calibration semantic is not. The regression definition in R-171 is explicit —
diluting anything in R-165…R-170 fails Gate G and Gate R *"irrespective of any
improvement delivered alongside it."* A prettier graph is not an improvement that buys
a lost caveat.

---

## 5 · What is keeping me busy — **The Double Rail**

*Class assigned by R-96 and R-116: dual-strand build-and-create system with per-card
micro-visualisations, both strands on one shared timeline at equal prominence.*

**1. What it shows.** One shared timeline, two rails. The **build** rail carries
repositories and their commits; the **create** rail carries videos and series from the
channel. Neither is subordinate: same axis, same tick marks, same visual weight, same
row height, and the section header names both. Each item on either rail carries a
**micro-visualisation** — a mechanism drawing for a repository, a structure sparkline
for a video — so a reader scanning the rail is reading artefacts, not thumbnails. The
carousel interleaves the two strands chronologically, which is the only ordering that
makes the co-equality visible rather than asserted.

**2. Dataset and provenance.** *Build strand:* `app/data/generated/repo-harvest.json`
(commits, `firstCommit`, `lastPush`, languages, size), joined to the curated plates in
`app/data/portfolio/vitrine.ts` — six of thirty-eight, *"and that ratio is the point: a
vitrine is an editorial act"* (`vitrine.ts:1-6`). Every metric is read from the harvest;
*"nothing on the plate is typed by hand except the description, the limits line, and the
drawing"* (`:8-13`). *Create strand:* the channel corpus for `youtube.com/@vicd0ct`,
harvested in this run to `corpus-youtube.json` / `corpus-youtube.md` (same evidence
directory, schema 1.0.0, generated 2026-09-03T20:08:39Z) and to be joined into the
canonical layer under R-115 with the same per-field provenance rules, carrying the
R-114 analysis — subject taxonomy and theme clusters, format and structure, cadence and
consistency, depth signals, production evolution, communication evidence. **Two facts
from that corpus constrain this rail and must be designed for, not worked around:**
the channel holds **10 public videos** plus 1 unlisted video exposed by a public
playlist — so the create rail is sparse beside a build rail carrying 1,664 commits on
one repository alone, and equal prominence must be achieved by axis, weight and row
height rather than by item count; and **no transcript or caption text was retrievable**
(every watch request bot-gated, `LOGIN_REQUIRED`), so the depth and communication
signals derive from verbatim descriptions, titles, durations and publish dates only.
Any per-video micro-visualisation that would need a transcript is not built, and the
section says why rather than inferring one.

**3. Interactions.**
- *Hover reveal:* an item raises under a raking light and shows its date, its
  micro-visualisation and, for a repository, its **Limits** line.
- *Focus / zoom:* keyboard moves along a rail; a modifier switches rails; the shared
  axis can be scoped to a year and both rails re-scope together — never one without the
  other.
- *Filter / drill-down:* filter by theme, and **the filter applies to both rails at
  once**, because the taxonomy is shared (R-117). Opening an item gives the full plate
  or the facade player.
- *Curiosity-rewarding state:* selecting a topic lights its nodes on **both** rails and
  draws the tie-lines between them — the weeks where a repository and a video were about
  the same problem. That crossing is the section's real claim and it is only visible to
  a reader who goes looking.

**4. Demonstrated skill.** Joining two heterogeneous corpora — a code host's API and a
channel's public catalogue — into one typed, provenance-tracked dataset on a single
timeline, then rendering it densely at 60 fps without losing a label. Plus the editorial
discipline of showing six of thirty-eight and printing what each does **not** do.

**5. Takeaway line.** *"Two habits, one calendar — the weeks where the repository and
the video are about the same problem are not a coincidence."*

**6. Performance envelope.** Canvas 2D for the rail itself once item count passes the
SVG threshold (grammar §6), SVG for the per-card micro-visualisations and every label;
no WebGL. **Declared ceiling ≤ 12 MB** including decoded facade poster images;
off-screen cards are not decoded; the rail virtualises beyond the viewport; scroll never
fights input (SC-31.1). Facade player: click-to-load, `youtube-nocookie`, lazily loaded,
**zero third-party requests or cookies before intent** (R-118, SC-67.1).
**Low-power path:** the rail as a static composed strip, scroll-snapped, with both
strands and their labels — the reading order is unchanged.

**7. Accessible equivalent.** Two labelled lists in one landmark, in date order, each
item an ordinary link with an accessible name carrying its title, date and strand. The
shared timeline's structure is stated in prose — how many items, over what span, on each
rail — so the co-equality is legible without seeing it. Every micro-visualisation is
`role="img"` with a `<title>` and a `<desc>` (`components/sections/Vitrine/Drawings.tsx:16-18`,
`:33-40`). Video items carry captions and a transcript (SC-46.1).

**8. Render class.** Canvas 2D for the dense rail, SVG for drawings and labels. Correct
per R-109.

**9. Status.** The build strand exists as the vitrine — six plates with harvested
metrics, hand-authored **Limits** lines, mechanism drawings and a scroll-snap rail
(`app/data/portfolio/vitrine.ts`, `components/sections/Vitrine/Drawings.tsx`, 348
lines). **The create strand does not exist.** A repository-wide search
(`grep -ril "youtube\|vicd0ct" app/ components/ lib/ scripts/`) finds the channel named
only in prose and in the chatbot corpus — `app/data/siteContent.ts:102`, `:419-420`,
`:440` — and in two validation scripts. There is **no channel dataset, no harvest script
and no player component in the application**; the corpus harvested to
`corpus-youtube.json` in this run is evidence, not yet a shipped data module. R-186 is confirmed against this repository: the creator
strand, the dual-strand hero (R-116) and the content-DNA visualisation (R-117) are
**new construction**, not uplifts.

**10. Preservation obligations.** R-167 — the **Limits** line on every repository card
and the *Excluded, and why* list. R-119 — no subscriber counts, views, likes or
watch-time in any headline, badge or hero position, on either rail.

---

## 6 · Feedback & Coffee — **The Open Caliper**

*Class assigned by R-96 and R-177: a participatory interactive engineered as the
second-strongest moment on the site.*

**1. What it shows.** The site's own corrections, and an invitation to add to them. The
left half is the **corrections ledger** — the last times a review found something wrong
with this page and it was fixed, in the words of the commit that fixed it, each row a
link to the diff. The right half is participatory: a reader takes the caliper and sets
it on the claim they would check first, or writes the correction they would make. The
aggregate — which claims readers most want measured — is drawn back onto the ledger as
an open caliper per claim, and the open mark keeps its meaning exactly: *sought, and not
yet measured*. The section closes the site by handing the instrument to the reader.

**2. Dataset and provenance.** The ledger rows are **not authored** — they are read out
of this repository's history at build time by `scripts/build/feedback_log.mjs`, which
qualifies a commit *"only if it is a correction — a `fix` type, or a subject that names
a review, an audit or a finding. A commit that adds a feature does not qualify, no
matter how nicely its message reads"* (`:11-15`). The script states its own limitation
and the page carries it: writing the file is itself a commit, so *"the committed copy
trails HEAD by exactly one. The page never claims otherwise — it prints how many of the
total it is showing, and the date it was harvested"* (`:18-23`). Output:
`app/data/generated/feedback-log.ts`; rows link through
`https://github.com/Victordtesla24/forgotten-mistory/commit/`
(`app/data/portfolio/listen.ts:44`). The lede is explicit that the reviews behind the
corrections are *"a mix of people and adversarial agents pointed at my own work"*
(`listen.ts:42-43`). Participation data is stored server-side and is aggregate-only.

**3. Interactions.**
- *Hover reveal:* a ledger row reveals the full commit subject and its date; the caliper
  beside it shows its state gloss.
- *Focus / zoom:* rows are keyboard-traversable and each is an ordinary link to the
  diff; the participatory control is a labelled form field with a designed focus state.
- *Filter / drill-down:* filter the ledger by what was corrected — copy, data, motion,
  accessibility — and the counts update in a polite live region.
- *Curiosity-rewarding state:* after submitting, the reader's own mark joins the
  aggregate and the caliper beside that claim **visibly opens wider**. Nothing is
  promised, nothing is gamified: the reward is seeing that the instrument moved.

**4. Demonstrated skill.** Building the receipts for a claim rather than repeating the
claim — a build-time harvest of the repository's own history, with its limitation
printed on the page — and then engineering a participatory surface on a static export
without breaking the site's privacy posture.

**5. Takeaway line.** *"I have been wrong often enough to want to hear it early — here
is the list, and here is where you add to it."* (The italic sentence is the site's only
italic, twenty words, `app/data/portfolio/listen.ts:22-23`.)

**6. Performance envelope.** SVG and HTML only; no WebGL; **declared ceiling ≤ 4 MB**;
the participatory control is progressively enhanced — the ledger and the contact routes
work with JavaScript failed. One same-origin POST per submission, rate-limited and
length-capped server-side. **Low-power path:** the ledger and the four contact anchors,
statically rendered; the residue in memory is *"the absence of the instrument after five
screens of it"* (`listen.ts:1-7`), which the still form delivers better than the
animated one.

**7. Accessible equivalent.** The ledger is a list of links with dates and subjects as
real text. The participatory control is a labelled form with an explicit description of
what is stored and what is not, a designed error state, and a confirmation announced
politely. Every caliper announces its state to assistive technology as well as drawing
it (`components/marks/Caliper.tsx:34-37`). Aggregate results are text first, drawing
second.

**8. Render class.** SVG — precision graphics. Correct per R-109.

**9. Status.** The corrections ledger exists and is harvested from `git log`
(`scripts/build/feedback_log.mjs`, `app/data/generated/feedback-log.ts`,
`app/data/portfolio/listen.ts:36-45`). **The participatory interactive does not exist**
— the section is currently read-only, which is why R-177 calls the site's last
impression its weakest.

**10. Preservation and architectural constraints — and one honest conflict to
resolve.** A participatory interactive needs a server. The architecture already has
one: a Cloud Function behind a same-origin Hosting rewrite, with secrets in Secret
Manager, CORS locked to production origins, input length-capped and `maxInstances`
capping spend (`functions/index.js:1-14`) — so this is an extension of an existing
pattern, not a new posture. **But the colophon currently states *"no analytics, no
trackers, no cookies"*** (`app/data/portfolio/listen.ts:47`), and R-183 is absolute:
*"the site must never carry a statement about itself that its own code contradicts."*
Therefore the submission path must be genuinely cookieless and personal-data-free — no
identifier, no IP retained, aggregate counts only — **and** the colophon is rewritten in
the same commit that ships the endpoint, to state precisely what is stored and what is
never collected. Shipping the interactive without rewriting the line, or rewriting the
line without meeting the standard, both fail Gate R. R-185 also applies: **one**
canonical contact route, presented here, in the site's own register.

---

## 7 · Register-level conformance

**R-94 (one hero per section):** six sections, six heroes, each in the focal position
(R-93). No section carries two.

**R-96 (assigned class per section):** each dossier's §8 names the class and matches
the assignment. WebGL is used once, for the one scene that is genuinely spatial;
Canvas 2D once, for the one view that is genuinely dense; SVG for everything precise.
No generic dashboard appears anywhere (SC-52.1).

**R-97 (interaction depth):** every dossier lists all four — hover reveal, focus/zoom,
filter or drill-down, and one curiosity-rewarding state — and every one of them is
keyboard-reachable. No static chart image ships (SC-53.1).

**R-99 (dual-read):** every dossier carries its takeaway line in the site's voice.

**R-100 / R-101:** every dossier declares its memory ceiling, its lazy-init and
disposal behaviour, its low-power path and its accessible equivalent. A hero without a
declared ceiling does not pass Gate K (grammar §10).

**R-110 (one grammar):** every dossier inherits `encoding-grammar.md` without
exception. The gold rule holds in all six: exactly one gold mark per view, and it means
*this figure has a source you can go and check* — never "here", never a fill, never a
magnitude.

**Gate M (creator stream integration):** entry 5 carries the dual-strand hero (R-116)
and the shared taxonomy that R-117's content-DNA cross-links resolve into. Both strands
sit on one axis at equal prominence (SC-65.1); the cross-links resolve node-for-node
into the skill topology of entry 4 (SC-66.1) — which is the second reason entry 4's
node identity must remain the capability, not a score.

**Gate Q (principle integrity):** R-161 — the artefacts argue; the register does not
assert a quality it cannot draw. R-162 — the Architecture Lab's removal (entry 3) and
any bench replacement (entry 4) are planned, deployed and verified as deliverables, not
left as dead code behind a flag.

**Outstanding build, in dependency order.** (1) Channel corpus and harvest → unblocks
entry 5 and R-117. (2) Deploy-time data refresh (R-182) → unblocks entry 1's currency
claim. (3) Architecture Lab absorption and Experience depth (R-176, R-174) → entry 3.
(4) Evidence routing for the dimensions (R-188) → entry 2. (5) Participatory endpoint
plus the colophon rewrite in one commit (R-177, R-183, R-185) → entry 6. (6) The
force-directed topology (R-187) → entry 4, **only** if §4.11's three tests all pass;
otherwise the bench stays.
