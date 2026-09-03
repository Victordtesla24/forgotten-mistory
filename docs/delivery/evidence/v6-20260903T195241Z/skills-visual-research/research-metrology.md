# CALIBRATION CERTIFICATE — RESEARCH DIGEST

## 1. The anatomy: what fields, in what order, and why

The order is not arbitrary. It runs **identity → provenance → conditions → numbers → limits → signature**, because each block is a precondition for trusting the next. The authority is ISO/IEC 17025:2017 §7.8.2.1 (common) + §7.8.4.1 (calibration-specific). NIST SOP 1 (NISTIR 6969) is the best free worked example; UKAS LAB 5 is the best layout spec.

**Block A — Identity / who is making the claim**
1. Title, literally the words `CALIBRATION CERTIFICATE` (§7.8.2.1a). Not "results", not "report".
2. Issuing laboratory name + address, **and the location where the work was actually performed** (§7.8.2.1c) — a lab loses accreditation coverage off-site.
3. Accreditation symbol + accreditation number (`UKAS Accredited Calibration Laboratory No. 0000`, `ANAB Cert. AC-1736`, `XYZ Accreditation Body: 1234567890`). UKAS LAB 5 §3.1(b): A4, symbol **top of page, left or right**.
4. Unique certificate number, **repeated on every page**, plus `Page X of Y` (§7.8.2.1d).
5. `DATE OF ISSUE` — distinct from date of calibration.
6. Customer name and address.

**Block B — The item and the method**
7. Unambiguous identification of the item: description, manufacturer, model, **serial number**, and *its condition on arrival* ("Artifacts showed evidence of improper handling. Fingerprints and dents were visible" — NIST SOP 1's example certificate actually prints this).
8. Method / procedure cited by number *and version date* (`QMS.CAL.01`; `Double Substitution (NISTIR 6969, SOP 4, 2019)`).
9. Dates, as a set of four: **received / sampled / calibrated / issued**. They are separate fields because the gap between them is diagnostic.

**Block C — Conditions (§7.8.4.1b)**
10. Environmental conditions *that influence the result*: `Temperature: 20.1 °C to 20.2 °C · Barometric Pressure: 752.7 mmHg · Relative Humidity: 43.35 % to 43.40 %`. Note the ranges, not points, and the absurd precision — the point is "we recorded the room, not just the reading."

**Block D — The numbers (§7.8.4.1a)**
11. The results table (see §2).
12. As-found / as-left (§7.8.4.1d: "the results before and after any adjustment or repair, **if available**"). Real wording from an accredited cert: `As Received Condition: … observed IN SPECIFICATION at the points tested. / Action Taken: No corrective actions were necessary. / As Shipped Condition: …`
13. Uncertainty statement, as prose, spelling out what went into it.

**Block E — Provenance and limits**
14. Traceability statement (§7.8.4.1c) — named chain, not a badge.
15. Standards-used table, when the cert is the only record: `Type | Model | Description | Serial Number | Certificate Number | Cal Due | Trace Value`, with a legend distinguishing `W – Working Standard` from `R – Reference Standard` (citing JCGM 200:2012 VIM3).
16. Statement of conformity + **the decision rule** (§7.8.6.2 requires naming which results, which spec, and which rule).
17. Scope limits: what is outside accreditation, marked.
18. `The results relate only to the items calibrated` (§7.8.2.1l).
19. `This certificate shall not be reproduced except in full, without the approval of …` (§7.8.2.1 NOTE — so pages cannot be taken out of context).
20. `This document does not represent or imply endorsement by the Accreditation Body … or any agency of a state and/or national government.`

**Block F — Accountability and closure**
21. Named signatory: **name, title, signature** — "each authorized signatory accepts responsibility for the technical accuracy and validity of the reported results."
22. Next-due date, and it is *not the lab's opinion*: §7.8.4.3 forbids a lab putting a recalibration interval on a certificate unless the customer asked. Real certs therefore print `Due Date (Requested by Customer): January 15, 2019` or `Based on the customer's request, the next calibration is due on 10 May 2017.`
23. **"A clear identification of the end of the certificate"** (§7.8.2.1d) — literally an *End of Certificate* rule/marker so nobody can append pages.

---

## 2. The results table — real column order and notation

Two canonical shapes.

**Deviation form** (dimensional/mass metrology — NIST SOP 1's actual example):

```
Nominal    Conventional Mass    Correction    Expanded Uncertainty    ASTM Class 4 Tolerances
  (g)             (g)              (mg)              (mg)                      (mg)
 1000      1000.000 82             0.82              0.92                      20
  300       299.999 87            - 0.13             0.27                       6.0
   20        19.999 987           - 0.013            0.023                      0.70
```

**Limits form** (electrical/RF — real accredited cert):

```
Description              Lower limit    Measured value    Upper limit      MU        Result
CW frequency accuracy
  0.3 MHz                299998.5 Hz    300000.2 Hz       300001.5 Hz   ±0.03 Hz     PASS
  8000 MHz              7999960000 Hz  8000005792.0 Hz   8000040000 Hz  ±800 Hz      PASS
Harmonic distortion *          –        -28.9 dBc         -25 dBc          –         PASS
```

Conventions worth stealing verbatim:
- **Units live in the column header, in a sub-row**, never repeated per cell. Figures are then bare and tabular-aligned.
- **SI digit grouping in the fraction**: `1000.000 82`, `0.500 013 2` — thin spaces in groups of three, no commas. Instantly reads as metrology and nothing else.
- **A dash `–` means "not applicable to this row"**, and it is printed, not left blank. Blank is ambiguous; the dash is a claim.
- **`±` only ever attaches to uncertainty**, never to the measured value.
- Uncertainty to **two significant figures**, and the result rounded to the same decimal place as its uncertainty.
- The asterisk `*` on a row = not covered by the accreditation scope, resolved by a footnote (see §5).
- Negative corrections printed with a space, `- 0.13`, so a minus can never be mistaken for a rule.

**Uncertainty statement, near-verbatim standard wording** (UKAS LAB 5 §3.3):
> *The reported expanded uncertainty is based on a standard uncertainty multiplied by a coverage factor k = 2, which for a normal distribution corresponds to a coverage probability of approximately 95 %.*

NIST's longer version additionally enumerates *what was combined*: the standard's uncertainty, the process's, uncorrected buoyancy error, and observed deviation from NIST values below surveillance limits. Then: **"The expanded uncertainty is not to be confused with a tolerance limit for the user during application."** That single sentence is the most honest line on the whole document.

---

## 3. Visual devices — the graphical vocabulary

### D1. The guard-band / decision-rule diagram (ILAC-G8:09/2019)
A single horizontal axis of the measurand. Vocabulary, exactly:
- **TL** — Tolerance Limit (a.k.a. Specification Limit, or **MPE**, maximum permissible error)
- **AL** — Acceptance Limit
- **w** — the guard band, `w = |TL − AL|`, usually set as `w = rU` with `r` a multiple of the expanded uncertainty
- **Simple acceptance**: `AL = TL`, i.e. `w = 0`
- **TUR** = `TL / U` — Test Uncertainty Ratio; **4:1 is the traditional bar**
- Three zones drawn as bands: **acceptance zone**, **guard band**, **rejection zone**
- The measurement result is drawn as a point with an **uncertainty bar** straddling it; OIML G19:2017's version overlays a **probability density curve** centred on the measured value so the tail crossing TL is visibly the risk
- **Binary** statements: `PASS` / `FAIL`. **Non-binary**: `PASS`, `CONDITIONAL PASS` (inside the guard band, below TL), `CONDITIONAL FAIL`, `FAIL`
- Errors have names: **false accept** (specific vs global risk) and **false reject**

> *Mapping:* the honest three-state grammar for a capability claim. A claim with sources sitting well inside its evidence sits in the acceptance zone; a claim whose evidence only just supports it sits in the guard band and is printed as *conditional*, not upgraded. This is exactly the site's rule "never grade a claim higher than its evidence", already drawn.

### D2. The tolerance band with measured points and error bars
Two horizontal dashed lines (lower limit / upper limit), a solid centre line at nominal, measured points plotted between them each with a vertical `±U` bar. The *only* thing that carries meaning is whether the **bar**, not the point, crosses a line.

> *Mapping:* one row = one capability; the point is the claim, the bar is the width of the evidence behind it. A claim whose bar crosses the line is the one you print the caveat next to.

### D3. As-found / as-left overlay (the error curve)
Deviation-from-nominal on the y-axis, the calibration points on the x-axis, **two traces**: as-found (before adjustment) and as-left (after). Certificates report them as two tables or two paired columns. As-found is described in practice as "the single most important field for quality decisions", because it retroactively validates or invalidates every measurement the instrument made since its last calibration.

> *Mapping:* claimed-on-CV versus verified-here. The gap between the two traces *is* the argument for the section. Nothing else on a portfolio shows the before.

### D4. The traceability pyramid / ladder
Apex: **SI, realised by BIPM**. Then **National Metrology Institute** (NIST / NPL / PTB / NMIA), then **reference standard**, then **working standard**, then **the instrument**, then **the measurement**. Each rung is a *documented, unbroken chain of calibrations, each contributing to the measurement uncertainty* (VIM/JCGM 200 definition, adopted verbatim by NIST). The pedagogical punch: **everything hanging below a broken link is not traceable.** Drawn as a ladder rather than a pyramid, each link carries its own certificate number and due date.

> *Mapping:* this *is* the existing bench diagram, but given a direction and a top. 13 sources → 17 capabilities becomes a chain with rungs: named employer/repository → the artefact you can open → the figure → the claim. A capability whose chain is broken at any rung is not traceable, and the diagram says so structurally instead of dimming a bar.

### D5. The standards-used table with cert numbers and due dates
`Type | Model | Description | Serial Number | Certificate Number | Cal Due | Trace Value`, plus the `W`/`R` legend. Its whole rhetorical function: *every instrument I used to measure you was itself measured, and here is the paperwork.*

> *Mapping:* the sources registry rendered as furniture rather than a legend — each source with its kind (programme / repository / credential) and the thing that makes it checkable.

### D6. Control chart (X̄/R or individuals)
Centre line, **UCL/LCL** at ±3σ as dashed rules, points in time sequence, out-of-control points ringed, Western Electric run rules. Labs run these on their check standards to prove stability *between* calibrations.

> *Mapping:* a capability measured repeatedly across roles over sixteen years — the point being consistency, not a peak.

### D7. Gauge R&R / MSA (AIAG MSA 4th ed.)
Stacked variation components (part-to-part vs repeatability vs reproducibility), with hard thresholds: **%GRR < 10 % acceptable, 10–30 % conditional, ≥ 30 % unacceptable**, and **ndc (number of distinct categories) ≥ 5** — and *both* must pass. The %GRR/ndc pair exists to answer "can this instrument even tell two things apart?"

> *Mapping:* the anti-proficiency-bar argument in one number. A proficiency bar has ndc = 1: it cannot distinguish anything. Naming that is the sharpest possible statement of why the bars are gone.

### D8. The vernier / micrometer scale
Main scale + sliding vernier scale whose divisions are deliberately *slightly smaller*; the reading is `main-scale reading + (coincident vernier division × least count)`, `LC = 1 main division ÷ n vernier divisions` (e.g. 1 mm ÷ 50 = **0.02 mm**). The whole instrument works because **exactly one line coincides** — everything else deliberately doesn't.

> *Mapping:* the single most legible ~3-second animation available. Two rulers slide; one line lands. That *is* what "calibration" means to a lay reader, and it is drawn purely in rules and ticks — no fill, no hue, no ornament. It also literally draws the Caliper mark's own geometry.

### D9. Gauge blocks / slip gauges
ISO 3650 / ASME grades **K (reference, master) → 00 → 0 (lab standard) → 1 (inspection working standard) → 2 (shop-floor working standard)**, with tolerances tightening by grade (a 10 mm block: ±0.12 µm at grade 0, ±0.20 at 1, ±0.45 at 2). Blocks are **wrung** — pressed and twisted until they adhere — to build an arbitrary length from a finite set.

> *Mapping:* a five-tier honesty ladder that already exists in industry; and *wringing* is the exact metaphor for composing a capability out of several sources — a stack of blocks whose combined length carries the sum of their deviations.

### D10. The physical calibration label
UKAS LAB 5 §4.4 specifies the fields to be **indelibly inscribed**: accreditation symbol + lab number, instrument ID, date of calibration (**with the month stated as a word**, so `12 Jan 2026` can never be read as `01/12`), certificate number, and a *blank space* for recalibration-due which **the customer fills in**. §4.2: where the calibration did not cover all major parts of the specification, the label must say **`Limited Calibration`**. §4.3: superseded labels must be removed or cancelled. Adjacent shop-floor vocabulary: `DO NOT USE — OUT OF CALIBRATION`, `CALIBRATE BEFORE USE`, `FOR INDICATION ONLY`, `VOID IF SEAL IS BROKEN`, tamper-evident seals.

> *Mapping:* `Limited Calibration` is the ready-made, industry-real label for the open/pending caliper state — far better than "in progress". And the *blank* due-date field is a beautiful detail: the document refuses to assert something it has no standing to assert.

---

## 4. How certificates declare LIMITS and what was NOT done

This is the part the section is actually about, and metrology has explicit machinery for it:

- **Marking out-of-scope work.** UKAS GEN 6 permits a lab to choose its own marking — "an asterisk or use of distinctive typeface" — provided it is unambiguous which calibrations the accreditation covers. Real footnote wording: *"Uncertainties indicated with an asterisk are traceable, but not UKAS Accredited. Calibrations marked not UKAS Accredited on this certificate have been included for completeness."* Another: *"This certificate may contain data that is not covered by the ANAB scope of accreditation. The unaccredited material, where applicable, is indicated by an asterisk (\*) or confined to clearly marked sections."*
- **CMC** — Calibration and Measurement Capability: the best uncertainty a lab is accredited to claim, published in its **Schedule of Accreditation**. A lab quoting better than its CMC is lying; quoting worse is fine. There is a public document you can check the lab against.
- **`Limited Calibration` / restricted calibration** — the calibration did not cover all major parts of the specification.
- **"At the points tested"** — the crucial hedge, repeated twice in a real cert: *"observed IN SPECIFICATION **at the points tested**."* Nothing is claimed between the points.
- **"Compliance refers to an assessment of ALL criteria of a referenced documentary standard and not a limited assessment of a portion or specific clauses."** (§7.8.4.1e / NIST SOP 1.) You may not say "compliant" if you tested only the tolerance clause.
- **Opinions and interpretations (§7.8.7)** are fenced off: they must be documented as such, only named authorised signatories may give them, and — per EA-4/23 — **accreditation bodies shall not accredit the expression of opinions and interpretations**. They live outside the accredited zone by design.
- **Customer-supplied information** must be clearly identified *and* carry a disclaimer where it can affect validity (§7.8.2.2). Where the lab did not sample, it must state the results apply **to the sample as received**.
- **No sampling plan** is stated affirmatively when none was used.
- **"No traceable test standards or equipment are required for this test"** — printed under a test rather than left empty.

---

## 5. What makes it read as authoritative rather than decorative

1. **It refuses to say more than it can.** Every hedge is printed, not omitted: "at the points tested", "results relate only to the items calibrated", "not to be confused with a tolerance limit", "due date requested by the customer".
2. **Everything is numbered and checkable.** Certificate number, procedure number + version date, standards' own certificate numbers, accreditation number, a public Schedule of Accreditation. There is no assertion that doesn't hand you a way to go and verify it.
3. **The document is closed.** `Page X of Y` on every page, the certificate number on every page, "not to be reproduced except in full", and an explicit end-of-certificate marker. It cannot be quoted out of context, and it announces that.
4. **A named human takes responsibility.** Name, title, signature. Not a logo.
5. **Typography is functional, not styled.** Ruled tables, tabular figures, units in the header, SI digit grouping, dashes for N/A, asterisks that resolve to a footnote. Nothing is coloured for emphasis; emphasis comes from a rule or a footnote.
6. **The uncertainty is louder than the result.** Any number without its `±U (k=2)` is treated as meaningless. The most authoritative move available is to print the width of your own error next to your own claim.
7. **It states its own boundary of authority.** The endorsement disclaimer, the accreditation-scope asterisks, the opinions-are-not-accredited fence.

---

## 6. Direct design consequences for #skills

- Gold stays legal: gold = **inside the accredited scope / traceable chain intact**. Grey + asterisk = traceable but not accredited. Dashed + hatch = **`Limited Calibration`**. That's a one-to-one map onto the Caliper's existing three states, using industry-real names.
- The strongest ~3-second opener is **D8 (the vernier coincidence)** or **D1 (the guard band with an uncertainty bar crossing a dashed limit)** — both are pure rules-and-ticks monochrome, both animate as a single sliding element, both hold a static frame under `prefers-reduced-motion`, and both explain the title *and* the absence of bars.
- The line to steal for the lede's replacement, if a caption is wanted: **`%GRR ≥ 30 % is unacceptable; a proficiency bar has ndc = 1.`**

---

## Sources

- UKAS LAB 5 Ed. 5 (Jan 2025), *Reporting calibration results* — certificate layout Figs 1–2, label spec §4 — https://www.ukas.com/wp-content/uploads/2021/11/LAB-5-Reporting-Calibration-Results.pdf
- UKAS GEN 6 Ed. 2, *Reference to accreditation and MLA signatory status* — https://www.ukas.com/wp-content/uploads/2021/11/GEN-6-Reference-to-accreditation-and-MLA-signatory-status.pdf
- UKAS LAB 45, *Schedules of accreditation for calibration laboratories* (CMC) — https://www.ukas.com/wp-content/uploads/2021/10/LAB-45-Schedules-of-Accreditation-for-Calibration-Laboratories.pdf
- NIST SOP 1 (NISTIR 6969, 2019), *Calibration Certificate Preparation* — includes Appendix A example certificate and Appendix B review checklist — https://www.nist.gov/document/sop-1-calibration-certificate-preparation-20190506pdf
- NIST, *Metrological Traceability: FAQ and NIST Policy* — https://www.nist.gov/metrology/metrological-traceability and https://www.nist.gov/calibrations/traceability
- PTB / Irene Flouda, *How to Develop and Interpret Calibration Certificates* (ISO/IEC 17025 §7.8 clause-by-clause, ILAC-G8 terminology, OIML G19 risk figures) — https://techreg.in.ua/wp-content/uploads/2021/03/2021-03-PTB-Flouda_Calibration-Certificates.pdf
- ILAC-G8:09/2019, *Guidelines on Decision Rules and Statements of Conformity* — https://nab.lrv.lt/uploads/nab/documents/files/ILAC_G8_09_2019.pdf ; intro slides: https://www.eurachem.org/images/stories/workshops/2019_11_MU/pdf/PL3-03_ILAC_G8_intro_daSilva.pdf
- Fluke, *Decision Rules in Calibration — Applying ILAC G8 and ISO/IEC Guide 98-4* — https://www.fluke.com/en-us/learn/blog/calibration-software/conformity-assessment
- Copper Mountain Technologies, *Sample ISO/IEC 17025 Accredited Calibration Certificate* (real 21-page cert; column headings, standards table, asterisk convention) — https://coppermountaintech.com/wp-content/uploads/2021/06/Sample-17025-Accredited-Calibration-Certificate.pdf
- Quality Magazine, *How to Read & Interpret ISO/IEC 17025 Calibration Certificates* — https://www.qualitymag.com/articles/98235-how-to-read-and-interpret-iso-iec-17025-calibration-certificates
- Techmaster, *How to Read an ISO/IEC 17025 Calibration Certificate* — https://techmaster.us/how-to-read-iso-17025-calibration-certificate/
- ICS Schneider, *Understanding a Calibration Certificate: deviation, uncertainty and tolerance* (as-found / as-left) — https://www.ics-schneider.de/kalibrierschein-verstehen-messabweichung-messunsicherheit-und-toleranz-richtig-bewerten/?lang=en
- Mensor, *What does k=2 mean?* — https://blog.mensor.com/blog/what-does-k2-mean-in-accuracy-specification
- A2LA, *Common Calibration Certificate Findings* — https://a2la.org/common-calibration-certificate-findings/
- Nordic Metrology, *The Traceability Pyramid* — https://nordicmetrology.com/traceability-pyramid/ ; Beamex, *Metrological traceability in calibration* — https://blog.beamex.com/metrological-traceability-in-calibration-are-you-traceable
- Micro Precision, *Calibration Label Requirements* — https://microprecision.com/blog/calibration-label-requirements/
- AIMS Industrial, *Gauge Block Guide: Grades K/0/1/2, ISO 3650* — https://aimsindustrial.com.au/blogs/product-guides/gauge-block-guide ; Pratt & Whitney, *Gage Block Calibration Tolerances* — https://www.prattandwhitney.com/Gage_Block_Calibration_Tolerances/
- EURAMET cg-2 v2.0, *Calibration of Gauge Block Comparators* — https://www.euramet.org/Media/docs/Publications/calguides/EURAMET_cg-2__v_2.0_Calibration_of_Gauge_Block_Comparators.pdf
- SPC for Excel, *Acceptance Criteria for MSA / Gage R&R* (%GRR, ndc) — https://www.spcforexcel.com/knowledge/measurement-systems-analysis-gage-rr/acceptance-criteria-for-msa/
- University of Cape Town Physics, *Using the Vernier Calipers & Micrometer Screw Gauge* — https://science.uct.ac.za/department-physics/courses-phylab1-course-i-laboratory/using-vernier-calipers-micrometer-screw-gauge

Extracted primary-source text is on disk at `/tmp/claude-0/-root/8984ac56-20bd-460b-9c7a-ea2231733569/scratchpad/sop1.txt` (NIST SOP 1) and `/root/.claude/projects/-root/8984ac56-20bd-460b-9c7a-ea2231733569/tool-results/{ukas-lab5.txt,sample-cert.txt,ptb.txt}`.