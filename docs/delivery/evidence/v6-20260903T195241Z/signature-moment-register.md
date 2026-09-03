# The Signature Moment Register

Run `v6-20260903T195241Z` · execution step 14 · **R-45, R-64** → **SC-26.1, SC-42.1** → **Gate H**

> **R-45.** *"One per section, plus one site-defining moment; each documented with the skill it demonstrates."*
> **R-64.** *"Zero gimmicks. Every 'WoW' moment demonstrates a real, named skill."*
> **SC-26.1.** Six section signature interactions **plus** one site-defining moment — **seven**.

---

## 0 · The rule this register is written against

R-64 is the hard filter. A moment qualifies only if a competent reviewer, shown the moment
alone, can name the skill it took to build **and** state what would break if the skill were
absent. A moment that is merely pleasant is a gimmick and is deleted (R-106: *earn
admiration or be deleted*).

Two further constraints shape the assignments below:

- **R-60** places the peak inside the first two sections. The site-defining moment is
  therefore assigned to the Front Door, which also carries its own section moment. R-45
  permits this: it asks for one per section *plus* one site-defining moment, and does not
  require them to be in different sections.
- **P-6 / R-93** make the visualisation the focal point of each section, so every moment
  below is the section's hero artefact doing something — never a decoration beside it.
- **R-52** requires mobile to carry its own signature moment at parity. Each row states
  the touch form of the moment; where the desktop form depends on a pointer, the mobile
  form is named separately and is not a degraded copy.

**Status vocabulary** is the same as the trait map: **PRESENT** (implemented, with a
citation), **TO BUILD** (not implemented), **PRESENT · EXTENSION PENDING** (the moment
lands today and a named requirement deepens it).

---

## 1 · The register

| # | Moment | Section | Named skill (R-64) | Status |
|---|---|---|---|---|
| **SD** | **The Lattice ignites** | 1 · Front Door | Real-time GPU rendering of a real, checkable topology | **TO BUILD** |
| 1 | **The graded ledger** | 1 · Front Door | Provenance-first information design | **PRESENT** |
| 2 | **The open sector** | 2 · About Me | Measurement modelling — knowing what cannot be measured | **PRESENT · EXTENSION PENDING** |
| 3 | **The span check** | 3 · Experience | Falsifiable data encoding against a shared axis | **PRESENT · EXTENSION PENDING** |
| 4 | **The trace** | 4 · Skills | Bipartite graph layout measured from live DOM geometry | **PRESENT** |
| 5 | **The raking light** | 5 · Keeping me busy | Scroll-driven state with zero scroll hijack | **PRESENT · EXTENSION PENDING** |
| 6 | **The corrections ledger** | 6 · Feedback & Coffee | Build-time harvest of the site's own git history | **PRESENT · EXTENSION PENDING** |

Seven moments. Six sections, one per section, plus the site-defining moment — **SC-26.1
satisfied structurally; one row (SD) outstanding on implementation.**

---

## SD · The site-defining moment — **The Lattice ignites** · Front Door · **TO BUILD**

**What it is.** On the Front Door, behind the name, a standing structure resolves out of
the ink: every public repository that has evidence attached is a node in depth, every
capability it evidences is a node on the near plane, and the delivery history is the
field's grain. It is not read as a chart — nobody takes a value off it. In three seconds
it says: *there is a lot of this, it is connected, and one strand of it is lit.* The lit
strand is a **single gold filament** running from the repository the site is most willing
to be judged on to the capability it evidences in production. Moving the pointer parallaxes
the structure and brings the nearest strand forward; on touch, a slow drift does the same
work without input.

**Why it is the site-defining moment, and why it is the peak.** It is the only moment on
the site that states the whole thesis before a word is read — *this is a body of work, and
every part of it is attached to something checkable* — and it is the only one that cannot
be mistaken for another portfolio's. R-60 requires the peak inside the first two sections;
this is section one, above the fold.

**Named skill (R-64).** Real-time GPU rendering of a real dataset: authoring a GLSL program
that draws a graph structure derived from `repo-harvest.json` and `skills.ts` inside one
WebGL context, at 60 fps, with full disposal and a low-power path — and holding the
data-truth rule while doing it (R-95: every mark renders real data). Remove the skill and
you get either a decorative particle field (no data) or a dropped-frame slideshow (no
budget discipline). Both failure modes are visible to a reviewer in under five seconds.

**Where it lands.** `components/sections/Hero/HeroAtmosphere.tsx` and
`components/sections/Hero/atmosphere.glsl.ts`, mounted through the existing
`components/gl/Scene.tsx` slot at `Hero.tsx:34-36`, dynamically imported so it stays out of
the critical bundle (`Hero.tsx:11-13`) and with the hero unchanged when it does not mount
(`Hero.tsx:25-27`). Dataset: `app/data/generated/repo-harvest.json`;
`app/data/portfolio/skills.ts:44-57` (sources) and `:80-219` (capabilities).

**Mobile form (R-52).** No parallax and no pointer. The structure drifts on a fixed slow
orbit and the gold filament is lit from the start rather than on approach — the moment is
the filament, and it is present at parity. Per the colophon's own promise
(`app/data/portfolio/listen.ts:46-47`) there is no WebGL on a phone, so the mobile form
is the same topology drawn as a static SVG lattice from the same data, not a downgraded
canvas.

**How it is verified.**
```bash
npx playwright test tests/overhaul/render.spec.ts -g 'TC-RENDER-10'   # to add: node count == harvest, exactly one gold filament, one context
npx playwright test tests/e2e/hero.spec.ts        -g 'TC-HERO-11'     # runs today: at most one WebGL context
npx playwright test tests/overhaul/cinematic.spec.ts -g 'TC-CINE-01|TC-CINE-04'  # runs today: decorative, and the page is whole without it
npx playwright test tests/perf/performance.spec.ts -g 'PERF-01|PERF-02'          # runs today: the moment does not cost the fold
```
Gate L (admiration, R-102, T-24) additionally requires the panel verdict to be
*"someone who knows what they are doing"*, never *"flashy"* — which is why the moment is a
topology and not an effect.

---

## 1 · Front Door — **The graded ledger** · **PRESENT**

**What it is.** Three figures sit under the statement — `≈92%`, `$5M+`, `10k+` — and each
is drawn inside a caliper whose jaws are closed but whose value is *grey*, not luminous.
One line beneath grades all three: **"◐ self-reported, from my CV. Repository figures below
are harvested and dated."** The moment is the small recalibration a reader performs when
they realise the site has just marked its own headline numbers as the weakest evidence on
the page — and then kept them anyway.

**Named skill (R-64).** Provenance-first information design: building a visual grammar in
which the *epistemic status* of a number is part of its typography, and applying it against
your own interest. Remove the skill and the ledger is three unsourced boasts, which is what
every other portfolio hero is.

**Where it is implemented.**
- `components/sections/Hero/Hero.tsx:59-83` — the ledger row, each value wrapped
  `<Caliper state="self-reported">` (`:68-70`), each with its source printed beneath
  (`:74`), and the grading sentence at `:80-82`.
- `app/data/portfolio/hero.ts:30-46` — the figures and their `source` strings, with the
  rule stated in the type itself: *"Shown on the page: a number without a source is a
  boast"* (`hero.ts:18`).
- `components/marks/Caliper.tsx:40-56` — the three states, with the state announced to
  assistive technology (`:54`), not only drawn.

**Mobile form (R-52).** Identical: the ledger and its grading line are text and CSS, so the
moment survives at any width and with images and JavaScript disabled.

**How it is verified.**
```bash
npx playwright test tests/e2e/hero.spec.ts -g 'TC-HERO-04'        # three figures, each with its source
npx playwright test tests/content/content-check.spec.ts -g 'CT-10' # every hero figure printed with its source
npx playwright test tests/e2e/hero.spec.ts -g 'TC-HERO-09'        # the whole hero, ledger included, legible in the first viewport
```

---

## 2 · About Me — **The open sector** · **PRESENT · EXTENSION PENDING (R-188)**

**What it is.** A ten-sector compass sits beside ten dimensions. Moving down the list turns
the instrument so the current dimension sits at top-centre — and three of the ten sectors
never close. Salary Fit, Location Match and Company Stability are drawn with an **open**
caliper reading *"measured from the role"*, because the engine computes them from the job,
not the candidate. The moment is the reader noticing that a section which could have drawn a
flattering ten-point radar has instead drawn three deliberate holes and labelled them.

**Named skill (R-64).** Measurement modelling: recognising that a two-sided metric cannot be
scored from one side, and encoding that distinction in the instrument rather than flattening
ten axes into one uniform ring. Remove the skill and you get a self-scored radar chart —
the most common unfalsifiable object in the genre.

**Where it is implemented.**
- `components/sections/About/About.tsx:86-121` — the list drives `active`; hover, focus and
  blur all set it, so it is reachable by keyboard (`:93-96`).
- `components/sections/About/About.tsx:103-114` — the open caliper on every role-side
  dimension.
- `components/sections/About/Compass.tsx` — the instrument; `sides` (`:20-27`) is why the
  three sectors are drawn open rather than merely unlabelled.
- `app/data/portfolio/about.ts:38-115` — the ten dimensions verbatim from
  `apps/api/app/routers/jobs.py::build_fit_dimensions`, with the refusal to score stated at
  `:9-13` and the source named on the page (`about.ts:110-115`, rendered `About.tsx:45-51`).

**Extension pending.** R-188 requires each dimension to **open into its evidence**
(`hero-visualisation-register.md` §2). Today the evidence line is printed beside the answer
(`About.tsx:117`); the drill-in is not built. The moment lands without it; the extension
deepens it.

**Mobile form (R-52).** The compass moves above the list and stops being sticky
(`About.tsx:55-57`); `active` is driven by focus and by the list item entering the
viewport centre rather than by hover, so the turn still happens under a thumb.

**How it is verified.**
```bash
npx playwright test tests/e2e/about.spec.ts -g 'TC-ABOUT-05'   # job-side dimensions are labelled as such
npx playwright test tests/e2e/about.spec.ts -g 'TC-ABOUT-03'   # no dimension is given a score
npx playwright test tests/e2e/about.spec.ts -g 'TC-ABOUT-06'   # each dimension is keyboard reachable
npx playwright test tests/e2e/about.spec.ts -g 'TC-ABOUT-07'   # complete without WebGL
```

---

## 3 · Experience — **The span check** · **PRESENT · EXTENSION PENDING (R-174)**

**What it is.** Sixteen years on one axis. Eight bars, each positioned and sized in
percentages of the same span, with gridlines at 2010 · 2015 · 2020 · 2025 · now drawn
*through* the tracks. The moment is the reader measuring the site against itself: the ANZ
bar looks about eight times the NAB bar, they check it against the gridlines, and it is.
Then they notice the note under the chart — five of the eight roles state no figure, and
none was invented for them.

**Named skill (R-64).** Falsifiable data encoding: putting a claim on screen in a form a
reader can check in three seconds, and refusing the encodings that would make it
uncheckable. `Experience.tsx:44-46` states the discipline outright — *"A bar's length is its
role's real duration and encodes nothing else. Sizing bars by seniority or importance would
make the picture unfalsifiable."* Remove the skill and you get a decorative timeline whose
proportions mean nothing.

**Where it is implemented.**
- `components/sections/Experience/Experience.tsx:20-25` — `track()`, the only encoding of
  the career on the page.
- `:78-127` — the track field, gridlines (`:79-92`) offset past the label column
  (`LABEL_COLUMN`, `:33`) so they line up with the bars they exist to measure.
- `:131-134` — the open-bracket note, printed once rather than five times.
- `:136-149` — the axis, labelled with real years.
- `app/data/portfolio/experience.ts:24-79` — month-precision spans read off the CV.

**Extension pending.** R-174 / R-96 add the context → decision → outcome drill-down and the
absorbed system-and-delivery-flow diagram layer (**Mechanisms**). Tracked as row 4 of
`statement-trait-map.md`.

**Mobile form (R-52).** The chart keeps its proportions (percentages, not pixels); the row
buttons remain real buttons with accessible names (`:97-101`), so the check is performed by
tapping a bar and landing on the role, which is the same act.

**How it is verified.**
```bash
npx playwright test tests/e2e/experience.spec.ts -g 'TC-EXP-02'   # bar lengths proportional to real durations
npx playwright test tests/e2e/experience.spec.ts -g 'TC-EXP-03'   # the axis is labelled with real years
npx playwright test tests/e2e/experience.spec.ts -g 'TC-EXP-07'   # headline figures carry their role, not a bare number
npx playwright test tests/e2e/experience.spec.ts -g 'TC-EXP-08'   # the section is complete without WebGL
```

---

## 4 · Skills & Certifications — **The trace** · **PRESENT**

**What it is.** Thirteen sources on one rail, seventeen capabilities on the other, and a
hairline between every pair the data actually asserts. Touch `ATO · Payday Super` and
everything it is not wired to falls back; the wires it owns stay lit; and the calibration
table underneath marks the matching row instead of filtering itself. The gold wires are
only the ones whose evidence was taken in production. One capability — the AWS/GCP
certification — has **no wire at all**, because a line to nowhere would be the exact
dishonesty the section exists to refuse.

**Named skill (R-64).** Bipartite graph layout measured from live DOM geometry: rails that
are real focusable HTML buttons, anchor points measured from layout, and only the curves
drawn in SVG — so the labels hint like the rest of the page, are selectable, tabbable and
readable by a screen reader (`Bench.tsx:26-32`). Remove the skill and you get SVG `<text>`
in a picture: pretty, unselectable, invisible to assistive technology.

**Where it is implemented.**
- `components/sections/Skills/Bench.tsx:72-77` — the three source bands.
- `:60-66` — `LINKS`, every (source → capability) pair the data asserts.
- `:242` — the traced capability reported upward.
- `:347-392` — the rails as real buttons, each with its own accessible name carrying its
  evidence and status.
- `components/sections/Skills/Skills.tsx:106` — `<Bench onSelect={setTraced} />`;
  `:174` — the record below marks the traced row rather than filtering to it, for the reason
  stated at `:38-41`.
- `app/data/portfolio/skills.ts:44-57`, `:80-219` — the registry and the rows.

**Mobile form (R-52).** Hover is replaced by tap-to-trace on the same buttons; the dimming
is a class on the board, not a pointer effect, and the record below scrolls the marked row
into view. The board is legible untouched — *"Nothing is hidden behind the interaction"*
(`Bench.tsx:39-44`).

**How it is verified.**
```bash
npx playwright test tests/e2e/skills.spec.ts -g 'TC-BENCH-01'   # every link the data asserts is actually drawn
npx playwright test tests/e2e/skills.spec.ts -g 'TC-BENCH-02'   # gold is still only a claim about production evidence
npx playwright test tests/e2e/skills.spec.ts -g 'TC-BENCH-03'   # tracing a source dims what it is not wired to
npx playwright test tests/e2e/skills.spec.ts -g 'TC-BENCH-04'   # each node speaks its own evidence
npx playwright test tests/e2e/skills.spec.ts -g 'TC-SKILL-03'   # and no proficiency bar anywhere
```

---

## 5 · What is keeping me busy — **The raking light** · **PRESENT · EXTENSION PENDING (R-186)**

**What it is.** A horizontal rail of plates. As a plate reaches the centre of the rail the
light tracks to it and its neighbours fall into shadow — exactly like a gallery spot
following the piece you are standing in front of. It is caused entirely by the reader's own
scroll. There is no autoplay, no drag physics, no scroll hijack and no progress dots.

**Named skill (R-64).** Scroll-driven state with zero scroll hijack: native `scroll-snap` so
a trackpad, a touchscreen, a scrollbar and the keyboard all work without being simulated,
plus a rAF-throttled nearest-to-centre computation that an IntersectionObserver cannot do —
*"An IntersectionObserver alone cannot answer 'which is most central' — it answers 'which is
visible', and with six plates on a wide screen that is most of them"*
(`Vitrine.tsx:40-43`). Remove the skill and you get a carousel that fights the pointer.

**Where it is implemented.**
- `components/sections/Vitrine/Vitrine.tsx:36-76` — the lit-plate computation and its rAF
  throttle; listeners registered `{ passive: true }` (`:69-70`) and fully torn down
  (`:71-75`).
- `:78-96` — keyboard operation: arrows move focus and scroll the plate to centre.
- `:114-128` — `data-lit` on the plate; the light itself is a CSS gradient, so it survives
  on a phone and on a machine with no WebGL (`:26-29`).
- `components/sections/Vitrine/Drawings.tsx` — the per-plate micro-visualisation the light
  is raking across.

**Extension pending.** R-186 / R-113 … R-117 add the creator strand and turn the rail into
**The Double Rail**. Tracked as row 6 of `statement-trait-map.md`.

**Mobile form (R-52).** This is the moment's *native* form: the rail is a touch scroller,
and the light tracks the plate the thumb has brought to centre. No behaviour is
pointer-dependent, which is why the section's signature is not something only a desktop GPU
gets to see (`Vitrine.tsx:26-29`).

**How it is verified.**
```bash
npx playwright test tests/e2e/vitrine.spec.ts -g 'TC-VIT-06'   # the light tracks the plate at the centre of the rail
npx playwright test tests/e2e/vitrine.spec.ts -g 'TC-VIT-07'   # keyboard operable, traps nothing
npx playwright test tests/e2e/vitrine.spec.ts -g 'TC-VIT-05'   # no screenshots, logos or raster images
npx playwright test tests/a11y/accessibility.spec.ts -g 'A11Y-06'  # including scrollable-region-focusable
```

---

## 6 · Always willing to listen — **The corrections ledger** · **PRESENT · EXTENSION PENDING (R-177)**

**What it is.** After five screens of instruments the page goes quiet: one italic sentence,
one hairline, four real anchors. Then, underneath, the receipts — *"What I was told I had
got wrong"* — a list of the last times a review found something wrong with **this page**, in
the words of the commit that fixed it, each row a link to the diff, with a denominator
saying how much of the history is shown. The moment is the reader clicking a hash and
landing on a real diff of a real correction to the page they are standing on.

**Named skill (R-64).** Build-time harvest of the site's own version history:
`scripts/build/feedback_log.mjs` reads the repository's commits, classifies which qualify as
corrections, and emits a typed generated module — *"because a hand-written list of times you
took feedback well is not evidence of anything"* (`app/data/portfolio/listen.ts:34-39`).
Remove the skill and the section is a claim about being open to feedback with nothing behind
it, which is what the sentence above it would otherwise be.

**Where it is implemented.**
- `components/sections/Listen/Listen.tsx:67-95` — the ledger; each hash links to
  `listen.ts:44` `commitBase` + the hash; `:90-94` prints *n* of `total`.
- `app/data/generated/feedback-log.ts:1-6` — generated, do not edit; `:17-20` — `total: 59`.
- `app/data/portfolio/listen.ts:40-45` — the ledger copy, naming that the reviews were a
  mix of people and adversarial agents.
- `components/sections/Listen/Listen.tsx:37-39` — the one italic on the site, and the one
  line that carries no source, because it makes no factual claim.

**Extension pending.** R-177 / R-96 assign this section a **participatory interactive**
engineered as the second-strongest moment on the site (**The Open Caliper**). It is not
built. See `peak-end-record.md` §2.

**Mobile form (R-52).** The ledger is a list of links; the moment is tapping a hash and
landing on the diff. Nothing here is pointer-dependent, and the section carries no form and
no third-party embed (`Listen.tsx:18-21`).

**How it is verified.**
```bash
npx playwright test tests/e2e/listen.spec.ts -g 'TC-LEDGER-01'   # every correction is a link to the commit that made it
npx playwright test tests/e2e/listen.spec.ts -g 'TC-LEDGER-02'   # the ledger says how much of the history it is showing
npx playwright test tests/e2e/listen.spec.ts -g 'TC-LISTEN-01'   # the closing sentence is the only italic on the page
npx playwright test tests/e2e/listen.spec.ts -g 'TC-LISTEN-03'   # no form, no input, no third-party embed
```

---

## 2 · Anti-gimmick adjudication (R-64, R-92, R-106)

Every moment above was put to the same three questions. Recorded here so Gate L does not
have to reconstruct the reasoning.

| Moment | Skill a reviewer can name | What breaks without the skill | Works toward a conversation (R-92) |
|---|---|---|---|
| The Lattice | GLSL + data topology in one context at 60 fps | decorative particles, or dropped frames | it is the reason a recruiter keeps scrolling |
| The graded ledger | provenance-first typography | three unsourced boasts | the figures survive being checked |
| The open sector | two-sided measurement modelling | a self-scored radar chart | it answers "how would you score me" honestly |
| The span check | falsifiable encoding on a shared axis | a decorative timeline | tenure is verified without an interview (R-11) |
| The trace | bipartite layout from live DOM geometry | unselectable SVG text, invisible to AT | it shows *where* each claim was measured |
| The raking light | scroll-driven state without hijack | a carousel that fights the pointer | it makes six repositories get read |
| The corrections ledger | build-time git harvest | an unbacked claim about openness | it is the invitation, evidenced |

**One candidate was adjudicated out.** The hidden `~/terminal` easter egg, the *"sudo hire
vic"* command and the Konami code are **not** in this register. R-180 submits them to the
restraint check (R-106) and the ownership test (R-92) at Gate L; jokey phrasing that
undercuts seniority and humility does not survive a dual-audience panel (R-107). They
demonstrate no skill this register cannot already name, so they are not carried here as a
signature moment. Their disposal is R-180's, under R-162.
