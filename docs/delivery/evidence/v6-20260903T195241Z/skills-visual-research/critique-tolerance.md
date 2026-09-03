**PROMISING**

---

### 1. Three seconds? No — it's a 25-second read, and it's gated on jargon.

The figure carries ~50 words at 9–10px uppercase mono: two column heads, two subheads, `U = —`×3, `POSITION IS NOT A QUANTITY…`, `TL 200 ms`, `SCOPE LIMIT`, `CONDITIONAL`, `LIMITED CALIBRATION…`, a title block, three row labels, three 60–96-char under-labels. It replaces a 3-sentence Inter lede with more text, set worse. The whole argument then rests on `U` — never expanded — meaning *uncertainty*. A recruiter sees an em dash. This teaches metrology to people who already know metrology; everyone else gets furniture. And it never draws a certificate: `CERT 16b856c0 / SCALE 1:1` is the one move that says "calibration card" to a layperson, and it's 10px, far right, decoration.

### 2. It ships the object the section exists to destroy.

AS LEFT brackets share a left edge (x 512), have different lengths (row 1 → 812, row 2 → 868), and sit under a common dashed limit at x 884. That is a bar chart on a shared axis with a target line. Row 2 reads *longer* than row 1 — "LLM eval beats telemetry." Printing `POSITION IS NOT A QUANTITY` does not stop the eye; a disclaimer that must be read to prevent a misreading has already failed. Separately, three hollow boxes with the right side open read as clipped/full bars, not "one end." Craft is real (range-frame, butt-capped serifs, n+0.5, non-scaling-stroke) but nothing has mass: it's the flattest object on a page with a 16-year scrub and a 20-wire board.

### 3. Gold: violated.

`Bench.tsx`'s own figcaption says "Gold where that evidence was taken **in production**," and `TC-BENCH-02` pins 17 gold wires to that rule. The concept redefines gold as "a source you can ring," denies it to row 2 — whose sources include a *public repo*, more checkable than a phone call — and puts it on a tick while painting the bracket grey. `Caliper.module.css` puts gold on the **jaws** when sourced. Two gold rules, 40px apart, and the site's one learnable mark drawn wrong.

### 4. Data fidelity: it fabricates the copy it calls verbatim.

`app/data/portfolio/skills.ts` says `evidence: '10,000+ concurrent devices held at P95 under 200 ms'`, `where: 'ANZ'`. The concept prints `P95 < 200 ms · 10,000+ concurrent devices · ANZ Banking Group` — reordered, re-notated, renamed. All three under-labels are paraphrases. An evidence-first figure inventing its own evidence strings is self-refuting.

### 5. Collision: it *is* the table.

Three rows of label|measurement|source, above a bench that already wires capability→source, above that same table. Same data three times. Buildable to spec — gate reasoning on `<path>` counts, `--motion-ease-mechanical`, and `Specimen.module.css` checks out against `scripts/validate/overhaul_static_audit.mjs` — but between 900–1120px those under-labels render at 8px and the mobile fallback drops the one row carrying a caveat.

---

## The single strongest fix

**Cut it to one claim, and make the enemy a real proficiency bar.**

One row — *Real-time telemetry* — drawn twice, large. **AS FOUND**: an actual filled bar, 78%, labelled `78%`, `U = —` beneath. That is the object every other portfolio ships, and a visitor recognises it instantly; the current hollow one-ended box does not read as the enemy. **AS LEFT**: `10,000+ concurrent devices held at P95 under 200 ms` and `ANZ` verbatim from `skills.ts`, in the caliper's own gold-jawed sourced bracket, at figure scale.

One row kills the accidental bar chart (nothing to compare lengths against), kills the paraphrasing (one row fits verbatim), kills the third grid, gives the figure a focal object with mass, and reduces the read to a swap anyone parses without knowing what `U` means: *they took the fake number out and put the receipt in.* Keep the title block and the `LIMITED CALIBRATION — NO CERTIFICATE ISSUED` hatch as a footer strip on the same card — that is the certificate furniture, and it belongs framing the swap, not competing as a third row.