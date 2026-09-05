# Palette exceptions

**Status:** decided · **Gap:** G-H6 · **Task:** `t_g2_h6` · **Decided:** 2026-09-05
**Author:** analyst-programmer (ADV-1556Z) · **Decision class:** documented exception (§0.1 — decide, log, continue)

This document is the single register of chromatic exceptions to the site's
palette contract. There is **exactly one** exception, and it is described in
full below. Anything not listed here is bound by the palette rule without
qualification: near-black inks, cool greys, luminous white, and the one
sanctioned gold that means *this figure has a source*.

---

## The rule the exception is measured against

Two authorities state the same contract:

- **`docs/prompt.md` §0.3-2** (and its restatement as **C-8**, `docs/prompt.md`
  around line 750): *"Palette: only black, white, and gold from the Claude /
  Aether design system tokens (`app/globals.css`, `lib/palette.ts`,
  `design-tokens.json`). Gold marks sourced claims — never arbitrary chrome. No
  other hues."*
- **`CLAUDE.md` Prime Directive 4** ("Monochrome, with gold as a claim"): gold
  (`--gold`) means one thing only — this figure has a source; it is never a
  fill, a background, or a theme, and raw hex outside `app/globals.css` /
  `lib/palette.ts` fails the audit.

Three gates enforce that contract today, and **all three read colour out of
code, never out of pixels**:

| Gate | File | Reads |
|------|------|-------|
| `TC-NFR-MONO` (static audit) | `scripts/validate/overhaul_static_audit.mjs` → `checkMono()` | chromatic literals in `app/**` and `components/**` `*.ts` / `*.tsx` / `*.css` |
| Served-CSS palette scan | `tests/palette_bundle.test.mjs` → `scripts/validate/css_chroma_scan.mjs` | the shipped stylesheets under `out/_next/static/css/*.css` |
| Monochrome render sweep | `tests/monochrome/monochrome.spec.ts` (`MONO-01…07`) | computed CSS colour longhands (`color`, `fill`, `stroke`, borders, …) of every section |

None of the three inspects the bytes of a raster asset. This matters for the
exception: it means the photograph is already outside every palette gate *by
construction*, and the job of this memo is to name that boundary, not to widen
a gate.

---

## The conflict

The 09:10Z Owner correction of 2026-09-05 directed: *"Integrate my Photo with
full size, colours and dimension … Include a hover effect that plays the hero
video avatar and not by default."* That is a later, more specific instruction
than §0.3-2, and it is in colour. The two binding sources therefore disagree
about one element only — the hero photograph:

- **§0.3-2 / Prime Directive 4** would desaturate every visible surface,
  including the photograph, to black / white / gold.
- **The 09:10Z correction (pinned as `TC-HERO-18`)** requires the photograph in
  full colour.

Per `docs/prompt.md` §0.1 (decide, log, continue) the later, more specific
Owner direction wins, and the resolution is recorded here rather than escalated.

---

## Decision — the one exception

> **The hero photograph — the still and the loop that shares its composition — is
> the single chromatic element on the site. It is a person, not chrome.
> Everything the figure *draws* around it, and everything in every other
> section, stays black / white / gold.**

Concretely:

- **In colour (the exception).** The raster media referenced by
  `app/data/portfolio/avatar.ts`:
  - still — `/assets/my_avatar.avif` → `/assets/my_avatar.webp` →
    `/assets/my_avatar.png` (1480×826), and
  - loop — `/assets/my-avatar.mp4` (1280×720, fetched only on the reader's
    intent).
  These are rendered by `components/sections/Hero/HeroPortrait.tsx` inside
  `.portraitMedia`, which carries **no `grayscale()` filter**.
- **Still achromatic (not the exception).** Everything the figure draws is held
  to the site's inks with an *empty* accent allow-list — not even the sanctioned
  golds are permitted inside the figure, because gold means "sourced" and a
  portrait is not a sourced figure: the drafting frame and corner ticks
  (`.portraitFrame`, `.portraitTick`), the registration cross (`.portraitCross`),
  the bloom (`.portraitGlow`), the caption (`.portraitCaption`), and the
  play/pause control (`.portraitControl`, `[data-testid="portrait-control"]`).
- **Boundary.** The exception is the *pixels* of the photograph. It grants no
  licence to any CSS colour, any component hex, any shader uniform, or any other
  image on the page. There is no second exception.

### Why this is the default, not a concession

The exception is free at the gate: because colour lives only in the raster
bytes and every palette gate reads code, keeping the photo in colour requires
**no** widening of any allow-list, threshold, or scanner scope. Desaturating it,
by contrast, would mean *adding* a `grayscale()` filter that `TC-HERO-18`
currently forbids — i.e. writing code to satisfy the general rule at the cost of
the specific Owner instruction. Colour is the lower-cost, higher-fidelity
resolution and the one the Owner asked for.

---

## Pinning tests

The exception is nailed down from two sides, so neither the photograph's colour
nor the surrounding achromatic discipline can drift:

1. **`TC-HERO-18`** — `tests/e2e/hero.spec.ts` (render-time, Playwright). Asserts
   the media wrapper carries **no `grayscale`** (the photograph is in colour) and
   that a chromatic-offender sweep over the whole figure with an **empty**
   allow-list returns nothing (the chrome is achromatic). This test is the
   exception's positive and negative halves in one place. **It must not be
   weakened** — it is the guard the exception rests on.
2. **`tests/palette_bundle.test.mjs` → describe("Palette exceptions register")**
   (`node --test`, no browser). Pins this memo against the code:
   - the memo exists and names exactly one exception — the hero photograph;
   - it cites both binding sources (§0.3-2 and `TC-HERO-18`) and the reversal
     cost;
   - the raster asset references it depends on exist in
     `app/data/portfolio/avatar.ts`;
   - the boundary invariant holds — the served-CSS scan and the static audit
     read CSS/source only, so the photo box is excluded from the palette scan by
     construction rather than by a hand-maintained skip-list;
   - `TC-HERO-18` still asserts colour + achromatic chrome with an empty
     allow-list (a weakening of the guard fails this test).

Together these are the "TC-HERO-18 + the palette bundle scan excluding the photo
box" pairing the task requires.

---

## Alternative considered — desaturate with a warm-neutral grade

Grade the photograph to black / white with a warm-neutral (not gold) tone curve,
matching the site's inks, and drop `TC-HERO-18`'s colour assertion in favour of
the original grayscale guard (preserved in the C4/C21 evidence history).

- **Pro:** one rule, no register; the palette contract reads literally true with
  zero exceptions.
- **Con:** it directly contradicts the 09:10Z Owner instruction ("colours and
  dimension"), trading the most human element on the page — a face — for
  uniformity. It also *adds* code (a `grayscale()` / tone-curve filter on
  `.portraitMedia`) to enforce a rule that costs nothing to leave un-enforced
  here.

This alternative is **not** adopted. It is recorded so a future reversal is a
documented flip, not a rediscovery.

### Reversal cost (if we later desaturate)

If the decision is ever reversed, the work is bounded and known:

1. Add a `grayscale(1)` (or warm-neutral tone curve) filter to `.portraitMedia`
   in `components/sections/Hero/Hero.module.css` — one rule, both still and loop
   inherit it.
2. Re-point `TC-HERO-18` back to its grayscale assertion (the original text is in
   `docs/delivery/evidence/v9-20260904T2312Z/…/B-research/02-hero-avatar-placement.md`
   §4 "Monochrome"); update the `node --test` guard's expectation in step (5)
   above to match.
3. Delete this exception from this register, leaving it empty.
4. Obtain an Owner correction that supersedes the 09:10Z instruction — the
   decision is Owner-owned, so the code change **must not** land without it.

No other file, section, shader, or asset is affected: the reversal is local to
the figure's filter, two test expectations, and this document. The cost is
therefore low in code and gated entirely on a new Owner instruction — which is
precisely why colour-without-this-memo is a FAIL and colour-with-it is the
recorded, reversible decision.
