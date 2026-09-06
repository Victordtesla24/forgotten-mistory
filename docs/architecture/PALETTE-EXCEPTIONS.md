# Palette exceptions

**Status:** RETIRED · **Gap:** G-H6 · **Task:** `t_w1_h6h5` · **Retired:** 2026-09-06
**Author:** analyst-programmer (ADV-2315Z) · **Decision class:** orchestrator decision (§0.1 — decide, log, continue)
**Supersedes:** the single-exception register decided 2026-09-05 under `t_g2_h6`

This document is the single register of chromatic exceptions to the site's
palette contract. **The register is empty. There are no active exceptions.**
Every surface of this site — including the hero photograph and its loop — is
bound by the palette rule without qualification: near-black inks, cool greys,
luminous white, and the one sanctioned gold that means *this figure has a
source*.

---

## The rule, restated without qualification

- **`docs/prompt.md` §0.3-2** (restated as **C-8**): *"Palette: only black,
  white, and gold from the Claude / Aether design system tokens
  (`app/globals.css`, `lib/palette.ts`, `design-tokens.json`). Gold marks sourced
  claims — never arbitrary chrome. No other hues."*
- **`CLAUDE.md` Prime Directive 4** ("Monochrome, with gold as a claim").

---

## What was retired, and why

Between 2026-09-05 and 2026-09-06 this register carried exactly one exception:
the hero photograph — the still (`my_avatar.avif` / `.webp` / `.png`) and the
hover loop — shipped in colour, on the strength of the Owner's 09:10Z
instruction of 2026-09-05 ("Integrate my Photo with full size, colours and
dimension…"). The reasoning then was that the exception was free at the gate,
because every palette scanner reads code and none of them can see raster bytes.

**`ADV-REVIEW-20260905T2315Z` failed the hero on exactly that reasoning**: a
reader does not read the source, they look at the page, and the page was
chromatic where the mandate says it is black, white and gold. The orchestrator
decided under `docs/prompt.md` §0.1 that the option preserving the §14 bar is
the mandate's **literal palette**, and commissioned `t_w1_h6h5` to ship the
photograph and the loop monochrome.

The retirement is therefore not a widening or a narrowing of a boundary — it is
the removal of the only exception that ever stood here.

## How the retirement was executed

- **Real re-encoded assets, never a CSS filter.** A `filter: grayscale(1)` would
  leave a colour file on the wire and grey it in the compositor: the bytes a
  reader downloads, an OpenGraph consumer reads, or a printer prints would still
  be chromatic. So the pixels themselves were re-encoded:
  - stills — `scripts/assets/generate_hero_formats.mjs` decodes the 1480×826
    WebP master once through sharp's `.grayscale()` and writes all three formats
    from that one buffer, at the master's own resolution (no upscale);
  - loop — `ffmpeg -vf 'scale=1280:720:flags=lanczos,format=gray,format=yuv420p'`
    from the genuine 3840×2160@24 master on this host
    (`artifacts/masters/minivic-greeting-2160p-master.mp4`), H.264, CRF 20, no
    audio, `+faststart`. `format=gray` (not `hue=s=0`) is what makes the chroma
    planes exactly neutral: the `hue` filter left a residual ±4/255 cast in the
    decoded frames, measured.
- **The name the mandate uses.** The loop ships at
  `public/assets/my-hero-avatar.mp4` — the path `docs/prompt.md` §0.3-3 names —
  and the retired `/assets/my-avatar.mp4` is a **301** in `firebase.json`, not a
  second binary (R4).

## How this document is enforced

| Guard | File | What it proves |
|-------|------|----------------|
| Byte-level portrait grade | `tests/hero_assets_monochrome.test.mjs` (`node --test`) | decodes all three stills and frames 0 / mid / last of the loop; **fails on any pixel with chroma > 2**; asserts the loop is 1280×720, under budget, and that `public/assets/my-avatar.mp4` no longer exists |
| Render-time grade | `TC-HERO-18`, `tests/e2e/hero.spec.ts` | the media wrapper carries **no `grayscale()`** (so the asset, not CSS, is doing the work), the painted portrait pixels are unsaturated, and a chromatic-offender sweep of the figure's chrome with an **empty** allow-list returns nothing |
| Composite at review width | `TC-PHOTO-03` / `TC-PHOTO-03b`, `tests/e2e/hero-photo.spec.ts` | screenshots the rendered `<picture>` at 1440 and requires ≥ 99.5 % of painted pixels under chroma 4 |
| This register | `tests/palette_bundle.test.mjs` → *Palette exceptions register (G-H6) — RETIRED* | this memo declares **Status: RETIRED**, states the register is empty, asserts there are no active exceptions, cites §0.3-2, `TC-HERO-18`, `ADV-REVIEW-20260905T2315Z` and `t_w1_h6h5`, and states what reopening would require |
| Code-level palette | `TC-NFR-MONO` (static audit) · served-CSS scan (`scripts/validate/css_chroma_scan.mjs`) · `tests/monochrome/monochrome.spec.ts` | chromatic literals in source, in the shipped stylesheets, and in computed styles |

The first three are the ones that matter for a raster asset: the three
code-level gates read source, CSS and computed styles, and **cannot see a
photograph**. That blind spot is precisely how a colour portrait shipped past
all of them for a day. It is now covered in the bytes and in the painted pixels.

---

## Reopening an exception

Nothing here forbids a future exception; it forbids an *undocumented* one. To
reopen this register a change must, in one commit:

1. Add the exception to this file with its scope, its binding source (an Owner
   instruction or a `docs/prompt.md` clause that is later and more specific than
   §0.3-2), and its reversal cost;
2. Re-point the guards above that would now fail, each with the reason written on
   the test — never by weakening a threshold or deleting an assertion;
3. Update `tests/palette_bundle.test.mjs`, whose *retired* expectations are what
   make a silent reopening impossible; and
4. Change `**Status:**` in this header, so the register's state is readable in
   one line.

Until that happens, the palette contract reads literally true, with zero
exceptions.
