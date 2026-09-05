# G-H6 — independent live reviewer verdict

- **Gate:** G-H6 (palette / chromatic-exception)
- **Acceptance probed:** colour-without-memo = FAIL; PASS iff `docs/architecture/PALETTE-EXCEPTIONS.md` exists on the tree matching the live commit **AND** a test pins the one chromatic hero still (do not require desaturation). The live hero photo must still be colour.
- **Reviewer:** fresh independent identity (prompt.md §5). **Not** the `t_g2_h6` author `7c63f7dc`. Read-only; no production code touched.
- **Date (UTC):** 2026-09-05T17:34Z

## Verdict: **PASS** — colour + memo + pin test all present on the live commit.

Colour-with-memo is the recorded, reversible decision. No desaturation required or requested.

---

## Evidence

### 1. Live commit (build-commit served now)

```
GET https://forgotten-mistory.web.app/  → HTTP/2 200
cache-control: public, max-age=0, must-revalidate
<meta name="build-commit" content="2806edec"/>
```

`origin/main` HEAD = `2806ede` → **live == origin/main** (`2806ede consolidate: merge worktree-rev1556-base into main`).

### 2. Memo present on the tree that matches the live commit

```
$ git ls-tree -r 2806edec --name-only | grep PALETTE-EXCEPTIONS
docs/architecture/PALETTE-EXCEPTIONS.md          # present at live commit
$ git ls-tree -r origin/main --name-only | grep PALETTE-EXCEPTIONS
docs/architecture/PALETTE-EXCEPTIONS.md          # present at origin/main
```

Added by `aaabee3` — `docs(palette): document the one chromatic exception (hero photo) + pin test`.
The memo names **exactly one** exception (the hero photograph — "a person, not chrome"), cites both binding
authorities (`docs/prompt.md` §0.3-2 and `TC-HERO-18`), states "There is no second exception.", and records the
reversal cost so a future desaturation is a documented Owner-gated flip.

### 3. A test pins the one chromatic hero still (no desaturation required)

Two guards, both present at `2806edec`:

- **`tests/e2e/hero.spec.ts` → TC-HERO-18** — `test('TC-HERO-18: the photograph is in colour and its chrome is achromatic')`
  - `expect(filter, 'no grayscale anywhere on the media wrapper').not.toContain('grayscale')` — pins the still as **colour**, not desaturated.
  - `chromaticOffenders(page, PORTRAIT, [])` with an **empty** allow-list — the surrounding chrome stays achromatic.
- **`tests/palette_bundle.test.mjs` → `describe('Palette exceptions register (G-H6)')`** (`node --test`)
  - asserts the memo exists, names exactly one exception, cites §0.3-2 + TC-HERO-18, that the raster refs in
    `app/data/portfolio/avatar.ts` exist, and that **TC-HERO-18 is not weakened**
    (`not.toContain('grayscale')` and `chromaticOffenders(page, PORTRAIT, [])` must remain).

This is the "TC-HERO-18 + palette bundle scan excluding the photo box" pairing the gate requires. Neither test
demands desaturation; both pin colour.

### 4. Live hero photo is still colour (not a FAIL — colour + memo)

Served CSS: no `grayscale()` in the `.portraitMedia` block across all four shipped stylesheets.

Served asset bytes (`/assets/my_avatar.webp`, 1480×826 sRGB):
```
HSL saturation mean = 0.263  (0 == grayscale)
mean per-pixel chroma (max-min) = 34.83 ;  76.4% of sampled pixels have chroma > 10
```

Rendered on the live page (CDP `Runtime.evaluate`, same-origin canvas — not tainted):
```
.portraitMedia computed filter = "saturate(1.02) contrast(1.03)"   (enhances colour; NO grayscale)
currentSrc = https://forgotten-mistory.web.app/assets/my_avatar.avif
naturalW×H = 1480×826
mean per-pixel chroma = 34.52 ;  77.2% of sampled pixels chromatic
```

The one chromatic hero still is confirmed colour, live. Its surrounding chrome remains achromatic per TC-HERO-18.

---

## Return

```json
{
  "live_commit": "2806edec",
  "memo_present": true,
  "test_present": true,
  "photo_colour": true,
  "verdict": "PASS"
}
```

> Note (out of G-H6 scope, forwarded): the still `/assets/my_avatar.png` is served at **900×502** while the
> `webp`/`avif` and the memo cite **1480×826**. That resolution-ladder mismatch is **G-H5**, not G-H6, and does
> not affect this colour+memo verdict.
