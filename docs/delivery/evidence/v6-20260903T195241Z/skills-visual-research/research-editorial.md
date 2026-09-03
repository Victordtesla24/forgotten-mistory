# Teaching an unfamiliar metaphor fast — research digest for §4 "Calibration card"

Sources: two deep Perplexity research passes (raw at `/tmp/claude-0/-root/8984ac56-20bd-460b-9c7a-ea2231733569/scratchpad/px1.md` and `px2.md`), plus targeted web search. Project files read: `/root/forgotten-mistory/CLAUDE.md`, `/root/forgotten-mistory/app/data/portfolio/skills.ts`, `/root/forgotten-mistory/components/sections/Skills/Skills.tsx`, `/root/forgotten-mistory/components/sections/Skills/Bench.tsx`, `/root/forgotten-mistory/components/marks/Caliper.tsx`.

---

## PART 1 — What the evidence actually says about "~3 seconds"

**The 3-second brief is not achievable as *comprehension*. It is achievable as *subject, unit, and reading rule*.** Design to that, or the piece fails.

| Finding | Number | Source |
|---|---|---|
| Gist/topic/dominant object registers | 0.1–1 s | Borkin et al. 2013, 1-second recognition study, n=2,070 vizzes — https://vcg.seas.harvard.edu/files/pfister/files/viztaxonomy2013.pdf |
| A familiar pictorial metaphor is *identified as* metaphor | ~3–5 s (metaphorical images 4.35 s vs literal sentences 2.00 s) | Hiniker et al., *Toward the Operationalization of Visual Metaphor* — https://faculty.washington.edu/aragon/pubs/Hiniker2017_Visual_Metaphor.pdf |
| Answering an elementary "read the data" question from *any* chart | 28–31 s | Stoiber et al., *Comparative Evaluations of Visualization Onboarding Methods*, n=596 — https://arxiv.org/pdf/2203.15418 |
| A genuinely unfamiliar encoding (parallel coordinates) | 57 s, **55% accuracy**; tutorial itself consumed ~102 s | same |
| Title fixation peaks | 0.75–1.0 s; data overtakes title at ~1.5 s, peaks ~4.5 s. Data is in the first three fixated regions in **80.5%** of scanpaths; legend only **40.5%** | Bylinskii et al., *Patterns of Attention* — https://www.osti.gov/servlets/purl/1425321 |
| Direct labels beat a separated legend on both speed and accuracy | Lohse, summarised in Franconeri et al. 2021 — https://faculty.sites.iastate.edu/tesfatsi/archive/tesfatsi/ScienceOfVisualDataCommunication.FranconeriEtAl2021.pdf |
| "Five-second rule" | **No cognitive-ergonomics research establishes 5 s as a comprehension threshold.** It measures first impression and salience only | https://www.tandfonline.com/doi/full/10.1080/0144929X.2023.2272747 |

**Operational conclusion:** the first ~1.5 s buys you a declarative title and one dominant object. Seconds 2–5 buy you *one* unit and *one* reading rule. Everything else is a second read. There is no published number for "how many novel conventions at once" — but the onboarding literature's own recommendation is **one major unfamiliar convention per explanatory step**, introduced *in situ* on a concrete first example.

## What kills it

1. **Legend hunting.** A key detached from the marks forces repeated search + correspondence + working-memory ops. Worse when legend order ≠ mark order (Riechelmann & Huestegge — https://www.psychologie.uni-wuerzburg.de/fileadmin/06020330/Methoden/Publikationen/Riechelmann_Huestegge_2018.pdf).
2. **Split attention.** Explanation spatially separated from its referent. Integrated labels win (Ayres & Sweller — https://www.davidlewisphd.com/courses/EDD8121/readings/2006-AyersSweller.pdf). **This is precisely the current failure mode of §4: the metaphor is explained in a 3-line lede that sits above and apart from the thing it explains.**
3. **Schema collision.** A prior expectation (left-to-right = time; longer = more; a horizontal bar in a skills section = proficiency) overrides the intended rule unless redundantly and explicitly overridden — https://pubmed.ncbi.nlm.nih.gov/41284390/
4. **Simultaneous novelty.** New mark + new spatial grammar + new colour semantics + new unit in one frame = no schema forms.
5. **Annotation as second prose layer.** Stokes et al. found *no* comprehension benefit from annotations that merely restate the surrounding text — https://www.tandfonline.com/doi/full/10.1080/15551393.2020.1749842
6. **Memorability ≠ understanding.** A striking mark can be recognised at 1 s and still be misread (Borkin 2013/2016).
7. **Competing decoration.** Haroz/Kosara/Franconeri: a pictorial unit helps *when the object is the data mark*; a decorative background object measurably impairs reading and memory — http://steveharoz.com/research/isotype/ISOTYPE_Visualization_CHI2015_Haroz_Kosara_Franconeri.pdf

---

## PART 2 — Twelve named craft patterns

### 1. Annotated first example ("one specimen explained, then the grid")
**What it is.** Isolate a single instance at readable size, direct-label its unit, its parts and its reading direction with leader lines, then repeat the identical grammar unchanged across the full set. The reader pays the decoding cost exactly once.
**Exemplar.** Reuters, *A World Cup dominated by the big five European leagues* — the ring grammar ("26 dots per squad, homegrown vs foreign") is stated on one ring before the grid of national rings. https://www.reuters.com/graphics/SOCCER-WORLDCUP/zgvolqqoypd/ · Also FT *Bailout costs will be a burden for years*, which carries a literal "how to read" block at the top of the chart canvas.
**For §4.** Draw **one full-size specimen row** — capability · evidence · where · caliper — floating above the table, with four hairline leader lines naming each field: *what was tested · what the reading was · where it was taken · what state the bracket is in*. The certificate metaphor becomes a thing you can point at, not a sentence.

### 2. Anchor, then scale
**What it is.** Start at one human-scale unit the reader can hold, preserve the unit exactly, then expand to the otherwise abstract total.
**Exemplar.** FT, *How much is your personal data worth?* — anchors at $0.0005 per person, restates as $0.50 per 1,000, then lets you scale. https://ig.ft.com/how-much-is-your-personal-data-worth/
**For §4.** One row at 1× is the anchor; "17 capabilities, 13 sources, 0 unevidenced claims" is the scale. The reader learns the unit before meeting the count.

### 3. Before/after — "the wrong way vs. our way"
**What it is.** Put the misleading-but-intuitive representation directly beside the corrected one, holding the underlying data constant. Teaching by controlled counterexample.
**Exemplar.** National Geographic, *A Quick Guide to Spotting Graphics That Lie* — truncated axis beside full-height axis. https://www.nationalgeographic.com/science/article/150619-data-points-five-ways-to-lie-with-charts
**For §4.** This is the single highest-leverage move available and nothing on the page does it yet. **Draw one skill bar** — the thing on every other portfolio — grey, unlabelled, "React ▓▓▓▓▓▓▓░░ 78%". Beside it, the same claim as a calibration row. Between them, one line: *nobody can check the left one.* Three seconds, zero prose, and it answers all three of your questions at once (what it is / what it means here / why not bars). The bar is the reader's existing schema; you must show it to override it.

### 4. Visual analogy panel / familiar-size comparator
**What it is.** Translate an unfamiliar quantity into a spatial event the reader can mentally simulate, while keeping the original measurement adjacent.
**Exemplar.** Reuters, *How fast wildfires burn* — acres/day restated as "half a football field per minute → seven and a half per minute." https://www.reuters.com/graphics/CALIFORNIA-WILDFIRE/SPEED/akpeewrodpr/
**For §4.** The analogy is already chosen and unused visually: an instrument's certificate. Show a *tiny* silhouette of a measuring instrument with its paper tag — then dissolve the instrument and keep the tag, which becomes the card. The transfer happens without a sentence.

### 5. Scrollytelling / layer-by-layer build (one new rule per step)
**What it is.** Hold the coordinate system fixed; each step adds exactly one layer, series or annotation. The onboarding literature's strongest recommendation.
**Exemplar.** Bloomberg, *What's Really Warming the World?* — one forcing at a time against a fixed observed-temperature line. https://www.bloomberg.com/graphics/2015-whats-warming-the-world/
**For §4.** Your section is deliberately motionless, and that is correct — do **not** add a scrubber. But the *build* can happen once, on entry, in ~600 ms and three beats: capability appears → its evidence slides in beside it → the caliper closes on it. Reduced-motion path: all three states present, no transition. That is one rule per beat, not three at once.

### 6. One unit drawn large, then multiplied (ISOTYPE build)
**What it is.** Show one mark with its semantic meaning stated, then repeat it without changing shape or unit, so accumulation is legible as counting.
**Exemplar.** NYT, *How America Reached One Million Covid Deaths* — "each dot is one person," then ~1M dots. https://www.nytimes.com/interactive/2022/05/13/us/covid-deaths-us-one-million.html · Evidence base: Haroz/Kosara/Franconeri ISOTYPE, above.
**For §4.** The Bench already does this and doesn't announce it. One wire, drawn alone and named — *"one line = one place this was actually measured"* — before the other 30+ appear, converts the bench from a pretty network into a countable claim.

### 7. Legend as illustration (semantic key)
**What it is.** Make the key a miniature of the real object or process, not an abstract swatch plus prose. Eliminates arbitrary symbol↔meaning lookup.
**Exemplar.** Washington Post, *Why outbreaks like coronavirus spread exponentially* — the state key is the same moving particles used in the simulation. https://www.washingtonpost.com/graphics/2020/world/corona-simulator/ · Also Bloomberg *How a Melting Arctic Changes Everything*, where the key is the feedback mechanism. https://www.bloomberg.com/graphics/2017-arctic/
**For §4.** `statusLegend` should stop being a legend. Print each status **as a live specimen row** — a real production row, a real non-production row, the real pending AWS/GCP row — under the header. The key and the data become the same object, which kills legend hunting (the #1 measured killer) outright.

### 8. Progressive disclosure / overview-first, detail-on-demand
**What it is.** Show the structure first; reveal precise metadata on hover, click or zoom — but keep everything needed for the *basic reading* permanently visible.
**Exemplar.** The Pudding, *A People Map of the UK*. https://pudding.cool/2019/06/people-map-uk/
**For §4.** Already correctly implemented — `Bench.tsx`'s comment "Nothing is hidden behind the interaction" is exactly right and matches the evidence. Do not regress this. The one thing that *should* be disclosed on demand is the certificate anatomy: a persistent, always-visible "how this card is read" specimen, not a tooltip.

### 9. Guess-then-reveal (calibration by participation)
**What it is.** Withhold the answer, make the reader commit, then overlay reality. The reader learns the axes *and* the size of their own misconception.
**Exemplar.** NYT Upshot, *You Draw It: How Family Income Predicts Children's College Chances* — Malofiej 24 Gold. https://www.nytimes.com/interactive/2015/05/28/upshot/you-draw-it-how-family-income-affects-childrens-college-chances.html · FiveThirtyEight, *Science Isn't Broken* / "Hack Your Way to Scientific Glory" — teaches p-hacking by letting you manufacture significance. https://fivethirtyeight.com/features/science-isnt-broken/
**For §4.** Risky here (adds interaction, adds a novelty) but the highest-ceiling option: a single draggable proficiency bar labelled "set his React level." Whatever the reader sets, the caption reads *"you just made that up. So did every portfolio you've read this week."* Then it collapses into the real row. Use only if you drop pattern 3 — never both.

### 10. Named-chain traceability diagram (the metrology convention proper)
**What it is.** The literal, conventional drawing of measurement provenance: a chain or pyramid where every lower result inherits its inputs and its uncertainty from the link above, with **every node named**.
**Exemplar.** BIPM, *Traceability chain from the definition of the kilogram* — https://www.bipm.org/documents/20126/41489673/SI-App2-kilogram.pdf · NPL *Fundamental Good Practice in Dimensional Metrology* Figs 33–34, which explicitly show the abstract pyramid **and** the concrete named gauge-block chain, and note the named version is more informative. https://eprintspublications.npl.co.uk/3360/1/mgpg80.pdf
**For §4.** The Bench *is* a traceability chain and doesn't say so. Rotating its framing from "sources → capabilities" to the metrology grammar — *standard → comparison → result* — makes it recognisable to anyone who has ever held a calibration certificate, at zero visual cost.

### 11. As-found / as-left — the certificate's own table grammar
**What it is.** Real ISO/IEC 17025 certificates put **Nominal · As Found · As Left · permitted min/max · uncertainty** in one aligned grid, and a formal note distinguishing *As Found* (before adjustment), *As Left* (after), and *Found-Left* (no adjustment made). Administrative identity first, measurement table in the middle, qualifications and signature last.
**Exemplars.** Yokogawa WT5000 sample certificate — https://cdn.tmi.yokogawa.com/static_files/WT5000%205A%20Module%20Sample%20Certificate%20ISO17025.pdf · Instrument Calibration Solutions sample — https://instrumentcs.com/wp-content/uploads/SampleCertificate.pdf · NIST SOP 1, *Calibration Certificate Preparation*, which requires uncertainty to sit **with** the result, in the same units — https://www.nist.gov/system/files/documents/2019/05/13/sop-1-calibration-certificate-preparation-20190506.pdf · NIST/SEMATECH uncertainty budget layout — https://www.itl.nist.gov/div898/handbook/mpc/section5/mpc565.htm
**For §4.** The cheapest, most literal win available. Give the card a real certificate **header block** — a certificate number (you already generate `cv-fingerprint.ts`, which is exactly a document hash), issue date, "instrument under test: Vikram Deshpande," "conditions of test," and a scope line naming what is *out* of scope. That block, in `--font-mono`, in the top 200 px, tells a stranger what kind of document they are looking at in about one second — the only thing the research says one second can buy.

### 12. Drawing the absence as a positive mark
**What it is.** Give unmeasured/unavailable evidence its own encoded state rather than deleting it or interpolating over it. The strongest version grades the *kind* of absence, not just its presence.
**Exemplars.** FGDC/USGS *Digital Cartographic Standard for Geologic Map Symbolization* — solid = accurately located, long-dash = approximate, short-dash = inferred, dotted = concealed. Four grades of evidence in line style alone. https://ngmdb.usgs.gov/fgdc_gds/geolsymstd/fgdc-geolsym-all.pdf · LIGO's GW150914 noise budget, which names an *unexplained* noise component in the 20–100 Hz band rather than folding it into a total-error curve. https://ligo.org/wp-content/uploads/2024/08/GW150914Detector.pdf · Evergreen, *Visualizing Not Applicable or Missing Data* — https://stephanieevergreen.com/missing-data/ · FlowingData, *Visualizing Incomplete and Missing Data* — https://flowingdata.com/2018/01/30/visualizing-incomplete-and-missing-data/
**For §4.** Your `open` caliper — dashed arms that do not meet over 45° hatch — is already the USGS/LIGO convention, independently arrived at. It is the site's strongest single asset and it is currently buried at the bottom of the table. **Promote the AWS/GCP pending row into the specimen block.** "This is the row that makes the other sixteen believable" is the argument of the whole section, and it is currently only in a code comment (`skills.ts`: *"The row that does the most work is the last one"*).

---

## PART 3 — Synthesis for this specific section

**The diagnosis.** §4 has excellent data and a good mark, and commits exactly one measured comprehension error: **split attention**. The metaphor lives in prose, spatially separated from the artefact it names. Every pattern above converges on the same fix — *move the explanation onto the object*.

**The recommended composition**, in strict priority order, obeying "one novel convention per step" and the monochrome/gold rules:

1. **A certificate header block** (pattern 11) — mono, hairline-ruled, top of card. Certificate no. from `cv-fingerprint`, date, item under test, scope, and an explicit *out of scope* line. Cost: near zero. Buys the 1-second "what document is this."
2. **The refutation pair** (pattern 3) — one dead grey skill bar beside one live calibration row, same claim, one caption. Cost: ~40 lines. Buys seconds 2–5 and answers "why not bars" without a sentence of argument. Gold-safe: the bar is `--mist-400`, the row's caliper earns gold only because its evidence is sourced — which is *itself* the lesson.
3. **The annotated specimen row** (patterns 1 + 7 + 12) — one full-size row with four leader lines, and the three status states shown as three real rows rather than as a legend. Fold `statusLegend` into it and delete the detached key.
4. **The bench's first wire, named** (patterns 6 + 10) — one wire drawn and labelled before the rest resolve, in the same ~600 ms entry beat.

**Do not do:** a scrubber or scroll-driven build (the section's silence is a deliberate contrast with §3 and is correct); an animated instrument illustration that is not itself a data mark (Haroz: competing decoration measurably hurts); a hover-only explanation of the metaphor (split attention again, plus it is invisible on touch); more than one new interactive affordance.

**Gates this must clear:** all teaching marks are `--ink-*`/`--mist-*`; gold appears only where a caliper closes on genuinely sourced evidence — *including on the specimen*, since a fake gold specimen would break the site's one rule. The 45° hatch and dashed arms come from `Caliper.module.css`, so no new hex. Reduced-motion: all four elements are static-complete; the entry beat is the only motion and it is a fade, not a layout change (CLS). Everything is real DOM — the specimen row is a `<table>` row with `aria-hidden` leader lines, and the refutation bar needs a text alternative saying it is an illustration of a discredited convention, not a claim about him.