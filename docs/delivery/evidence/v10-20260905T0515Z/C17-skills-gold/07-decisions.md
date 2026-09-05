# Cycle 17 — C-08 + CC-10 + Motion F-6: #skills spends gold once

Task `t_3729f57e`. Worktree `.claude/worktrees/wf_4c95b7c6-be5-1`, branch
`worktree-wf_4c95b7c6-be5-1`. Static export served on `127.0.0.1:5603`.

## What the baseline actually measured

`01-baseline/probe.log` (Chrome, `--use-gl=swiftshader`, 1440×900, `#skills`
scrolled into view, bench settled):

| where | count | x |
|---|---|---|
| `.mark.production` bench dots, `background: rgb(201,168,76)` | 14 | 1088 |
| `.statusGlyph` on `tr[data-status="production"]`, `color: rgb(201,168,76)` | 14 | 1159.6 |
| `.legendGlyph` (production key) | 1 | 129 |
| gold-ramp strands (`stroke: url(#bench-wire-gold)`, `stroke-opacity: 1`) | 20 | — |

29 elements painting saturated `--gold`, in **two parallel columns 71 px apart**
— CC-10's finding — over a bundle of strands already at full strength.

## Decisions

1. **The table's status glyph is chrome, not a mark.** `tr[data-status="production"]
   .statusGlyph { color: var(--gold) }` is deleted; the glyph falls back to its own
   `--mist-200`. This is CC-10's direction taken verbatim ("render the second
   column's glyph in `var(--mist-200)`"), and it costs no information: the row
   still says *measured in production* in words, and `.statusLabel` is unchanged,
   so GC-02's 4.5:1 measurement is untouched.

2. **The bench keeps the one gold column, one step back.** `.mark.production`
   moves from `var(--gold)` to `var(--gold-dark)` at rest and comes to
   `var(--gold)` on the row being traced (`.node[data-lit] .mark.production`).
   This is R-110's established step-down ("the lit plate keeps `--gold`, and the
   recessed plates step down") applied to the card. Fourteen saturated dots down
   a rail is a fill; fourteen recessed ones are a column of evidence, and the
   accent now has somewhere to go when the reader asks a question of a row.
   `--gold-dark` is one of the four sanctioned golds (`gold-contrast.spec.ts:58`),
   so the claim is not diluted, only quieted.

3. **The legend keeps the single saturated gold**, and is named for what it is:
   `.measuredMark` (`Skills.tsx`, `Skills.module.css`). Prime directive 4
   enumerates "the measured in production mark" as a licensed gold surface; the
   key is where a reader learns the mark, so it is the one place the card spends
   `--gold` at full strength. Result: **1** saturated gold element in `#skills`
   at rest, against a budget of 6.

4. **The `<defs>` ramp owns the shape of the fade; `stroke-opacity` owns the
   level.** The gold ramp's body stops moved 0.62 → 1 and the grey ramp's 0.5 → 1,
   with the end stops kept low so the wire still fades out of its rail rather than
   butting into the label. The level now lives entirely in CSS: production strands
   `0.28`, the rest `0.35`, dimmed `0.18`, lit `1` at `stroke-width: 1.5`, on a
   200 ms `cubic-bezier(0.22, 1, 0.36, 1)`. Before this, the two multiplied and a
   strand asked for full strength arrived at 0.62 of it.

5. **Deviation, recorded: unsourced strands stay `--mist-400`, not `--ink-500`.**
   The task text specifies `var(--ink-500)` at 0.35 for non-sourced strands.
   `--ink-500` is `#3C3C3C`; at 0.35 over the section's near-black ground it
   composites to ≈`rgb(27,27,28)` — about 1.35:1, an invisible hairline. The three
   non-production links are the honest half of the drawing (the bench exists to
   show *where* evidence was and was not taken), and rendering them invisible
   would delete that. `--mist-400` at the same 0.35 composites to ≈1.9:1 and reads
   as cabling. The stroke-opacity half of the instruction is implemented exactly.

6. **Reduced motion is colour only.** `@media (prefers-reduced-motion: reduce)`
   drops the `stroke-width` half of the transition and pins the lit strand's width
   at 1, so the attention state still reads while no geometry moves.

## Gates

| gate | command | result |
|---|---|---|
| spec red first | `npx playwright test tests/monochrome/gold-semantics.spec.ts` | 6 failed / 5 passed (`02-tests-failing/gold-semantics-red.log`) |
| spec green | same, after the change | 21 passed (`04-tests-passing/`) |
| gold semantics + skills + a11y | `tests/monochrome tests/e2e/skills.spec.ts tests/a11y …` | 85 passed in the joint run |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | `ALL PASS (10/10)`, exit 0 |
| tsc / lint / build | `npx tsc --noEmit` · `npm run lint` · `npm run build:static` | exit 0 · `✔ No ESLint warnings or errors` · exit 0 |

Measured after the change (`04-tests-passing/`, GS-10/11/12 console output):
saturated gold in `#skills` = **1** (budget 6, was 29); any-gold = **15**
(CC-10 ceiling 16); gold columns = **1** run (was 2).

## Tools used

Read, Edit, Write, Bash (npm ci / build:static / tsc / lint / static audit /
playwright / python3 http.server on :5603), Playwright (Chrome channel,
`--no-sandbox --use-gl=swiftshader --enable-unsafe-swiftshader
--ignore-gpu-blocklist`) for the baseline probe and the screens.

## Files

- `components/sections/Skills/Skills.tsx`
- `components/sections/Skills/Skills.module.css`
- `components/sections/Skills/Bench.tsx`
- `components/sections/Skills/Bench.module.css`
- `tests/monochrome/gold-semantics.spec.ts`
