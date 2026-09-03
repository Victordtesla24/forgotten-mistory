**VERDICT: PROMISING**

---

**1. Three-second teach — no, not as specified.** The recognition claim is the concept's best asset and it's true: everyone has seen the sticker on a fire extinguisher. But what's drawn is not a sticker. A sticker is four sparse fields at large type. This is a five-band, 600×320 certificate carrying ~14 mono runs, 17 ticks, 17 glyphs, two boxes, two footnotes and a stamp — which reads as "official technical document," the same generic impression the lede already fails to escape. Worse, both objects nominated to carry the fast read encode *absence*. Absence doesn't say "calibration," it says "incomplete."

**2. Craft is real in the lines, absent in the type — and one cue is a no-op.** Genuine grade-10: the 24-unit *structural* break rather than a dash gap; the four-weight ramp; crispEdges + non-scaling-stroke. Grade 6: nine text runs at 7.5/8/8/9/9/9.5/11/11px — five sizes inside a 3.5px band is texture, not hierarchy, and the spec's own Risk 1 warns against precisely what the spec then mandates. Fatal detail: the engraving pass is `drop-shadow(0 0.5px 0 var(--ink-900))` and the ground *is* `--ink-900` (#0A0B0D, `globals.css:6`; `.skills` sets no background). Black on black — the only permitted depth cue renders nothing. The plate was conceived on white paper. So was the "ruled writing line": nobody writes on a black plate, so the refusal most dependent on recognition is the one the palette kills.

**3. Gold: violated** — not the hash quibble it flags, the caps. Gold on all 16 sourced stations, while `Bench.tsx` 15px below golds only *production* evidence (TC-BENCH-02 = 17/20). Two capabilities would be gold-capped on the plate and grey-wired on the bench, in one viewport. Gold means two predicates in one section.

**4. Collides — with the Bench, not another section.** Both draw the same 17 capabilities, both reuse `statusLegend` glyphs, both mark the un-sourced one by withholding the mark, both use 45° hatch. The plate spoils the Bench's punchline before the Bench delivers it, and adds no datum.

**5. Band C is not buildable to bar.** `Bench.tsx`'s own opening comment says labels left SVG because `<text>` hints differently from the page. This puts ~14 runs back at 7.5–9px. At 1× that's mud.

---

**STRONGEST FIX: delete Band C.** Cut the 17 stations, ticks, caps and datum entirely — the Bench directly below already *is* the readings, drawn better. The plate becomes what a real sticker is: five fields, three type sizes, ~2.5:1 ratio, two of them visibly refused. One cut fixes six things at once: it restores the sticker silhouette that buys the free recognition, forces the type hierarchy Risk 1 demands, ends the Bench duplication, removes every gold cap so the gold-predicate conflict evaporates, and eliminates the sub-9px SVG text. Then invert the engraving for a dark ground (a *lighter* 0.5px offset, `--ink-500`), and replace the "ruled writing line" with a mono row of hairline underscores — a blank that reads as blank on black.