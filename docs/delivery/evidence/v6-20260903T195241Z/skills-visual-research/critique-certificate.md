**VERDICT: PROMISING**

---

**1. Teaching.** The filled-vs-empty contrast is genuinely pre-verbal — that part works. But the concept smuggles the vocabulary back in through its own captions. `INSTRUMENT NOT ACCEPTED`, `SCOPE OF CALIBRATION`, `NOMINAL`, `UNCERTAINTY`, `METHOD`, `ISSUED BY` — six metrology terms doing the load-bearing work, in a spec that claims it "needs no vocabulary at all." A visitor learns what a *form* is, not what *calibration* is. Nothing in the figure depicts measurement, a reference standard, or traceability. The h2 still carries the metaphor alone.

And the 3s read is arithmetically false. Count the text runs actually specified: masthead ×2, compartment 01 ×4, the 2×2 dash grid + footnote ×5, scope band ×3, foot strip ×4, `END OF CERTIFICATE`. That is ~19 runs, most at 8.5–9.5px. Risk #1 mitigates to "four fields, no more" — the spec in the same document already spends nineteen.

**2. Craft.** Real: the third-angle glyph, `crispEdges`, and the dimension line with `?` in the break — a dimension with no unit is the best idea here, a wordless indictment of the proficiency bar. Mediocre: **every rule is 1px and every micro-caption is `--mist-400`.** Both hierarchy axes flattened to one setting. A drawing sheet reads as a drawing sheet because of line-weight ratio (ISO 128, ~2:1 frame-to-detail) and a title block with real field hierarchy. Uniform hairlines over `rgb(244 246 250 / .015)` renders as evenly-grey boxes — a two-column card, not a sheet. Also: `scaleX` on a 1px `<i>` blurs sub-pixel mid-tween, which is precisely the wrong artifact on a site arguing hairline precision.

**3. Rules.** Monochrome: clean, no new hex. Gold: **violated.** Closing a `sourced` caliper on `ANZ Banking Group` puts gold on the *source*, not the figure — tautological ("this source has a source"), and it teaches gold as provenance-naming, corroding the one mark. Repo URLs earn gold because they're clickable; an employer string isn't. "Every visual is data": **violated, worse.** Compartment 02's bar — the largest drawn object — is invented: fill 156/223 encodes nothing. Risk #2 offers to change it to 90 "so it reads as obviously arbitrary." That is the admission.

**4. Collision.** `Caliper[state=open]` already paints a 45° hatch; you put a second 45° hatch *behind that same element*. Superimposition, not adjacency — guaranteed moiré, not a DPR question. Also two hairline no-fill mono drawings 40px apart; the Bench and this compete.

**5. Buildable?** Yes — the test homework (`no <path>`, outside `.tableWrap`, one `role=status`) is real and correct. Misses: visual baselines need regeneration at 4 widths; `capabilities[2].where` is `'ANZ'`, not `'ANZ Banking Group'`; the cert number duplicates TC-SKILL-08's existing footer fingerprint.

---

**STRONGEST FIX — make compartment 02 the *same compartment as 01, blank*.**

Delete the bar and the four metrology captions. Draw compartment 01 twice, side by side, identical rules and identical four captions — `ITEM · READING · TAKEN AT · VERIFY BY`. Left is filled from `capabilities[2]`; right is headed `PROFICIENCY 90%` with all four fields `–`. Move the sourced caliper off `ANZ` onto the reading itself (`10,000+ concurrent devices at P95 under 200 ms`), source printed beneath in mono — the site's actual grammar. Keep the `?`-in-the-break dimension, but as the *value* in the empty READING field, where it belongs.

This fixes five things at once: no fabricated geometry, no "he's 70% at something" misread, zero new vocabulary (the right column reuses captions the eye just parsed on the left), density halved, and the read becomes spot-the-difference — the fastest comparison a human performs. Then give the outer frame 2px against 1px internals so it looks ruled rather than boxed.