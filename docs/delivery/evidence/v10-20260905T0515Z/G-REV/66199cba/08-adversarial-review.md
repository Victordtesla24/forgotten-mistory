# G-H2 — independent adversarial production review, live build

**Reviewer:** council `reviewer` profile (docs/prompt.md §5) — verification +
3rd_party_independent_adversarial_review, level 1, effort max. Read-only; nothing in this
lane was implemented, tuned, or re-run until it passed.
**Probed:** 2026-09-05 14:26Z → 14:53Z against `https://forgotten-mistory.web.app/`.
**Predecessor:** `docs/delivery/evidence/v10-20260905T0515Z/G-REV/e3f0206c/08-adversarial-review.md`
(G-H2a **FAIL**). Method reused; every number below is a fresh live capture.
**Commits under test:** `ee334cc` (t_x1_02c, the rendered poster) · `9e41474` + `3d25643`
(t_x1_03, the column-bound scrim grade) · `6f4ba6c` (t_nojs01, no-Suspense first paint).

## Scope note — the build moved twice under the probe

The task scoped `66199cba` at 14:24:40Z. The live `build-commit` meta read `44327c5d` at
14:25:47Z and `d5227962` for the whole measurement window (14:26Z onward). I measured
`d5227962` and then checked whether that invalidates the scope:

```
git diff --stat 66199cb d5227962 -- app components public lib scripts/assets scripts/build
  → (no output)
git diff --stat 66199cb d5227962 -- tests
  → tests/ci_pipeline.test.mjs | 115 +++++++++-
```

**The entire shipped surface is byte-identical between `66199cba` and the build I
measured.** The only deltas are `tests/ci_pipeline.test.mjs`, board/docs artefacts and
`scripts/pm/kanban.mjs` — none of which reach `out/`. Every number here is therefore a
valid measurement of `66199cba`'s hero. Reported under `66199cba` per the task, with the
served build recorded on every capture.

---

## Verdict table

Failures first. There are none, so the table runs in clause order.

| # | Clause | Verdict | Evidence (live, this build) |
|---|--------|---------|------------------------------|
| 1 | `.stage` first background layer is `url(/assets/…)` @ 1440 & 390 | **PASS** | First layer of the computed stack is `url("…/assets/hero-atmosphere-poster.avif")` at 1440 (21 layers) and 390 (16 layers), `background-size: cover`, `position: 50% 50%`. Same first layer on all three paths: chunk-blocked, `javaScriptEnabled:false`, and reduced-motion. `probe-gh2.json` |
| 2 | Poster asset: 200, ≤ 500 kB, ≥ 3840×2160, a rendered frame not a gradient | **PASS** | `HTTP/2 200`, `content-type: image/avif`, **12,935 B** (2.6% of the 500 kB budget). Served file decodes at **3840×2160**, 8-bit greyscale (`identify`, `ffprobe`: `width=3840 height=2160 pix_fmt=yuv420p`) — not downscaled; the served dimensions are the claimed source dimensions. Composition: see §"Is it really the scene?" below. `poster-headers.txt`, `poster.avif` |
| 3 | Stage-box mean luminance ≥ 0.10, WebGL chunk route-aborted @ 1440 | **PASS** | **0.1104** ≥ 0.10, 0 canvases in the slot. `chunkblocked-stage-1440.png` |
| 4 | …same @ 390 | **PASS** | **0.1197** ≥ 0.10, 0 canvases. `chunkblocked-stage-390.png` |
| 5 | Stage-box mean luminance ≥ 0.10, `javaScriptEnabled:false` @ 1440 | **PASS** | **0.1103** ≥ 0.10. `jsblocked-stage-1440.png` |
| 6 | …same @ 390 | **PASS** | **0.1195** ≥ 0.10. `jsblocked-stage-390.png` |
| 7 | TC-HERO-SCRIM-01: brightest tenth − mean under the DOM-measured reading column ≥ 0.06 | **PASS** ×4 | `?gl=force`: **0.2912** @1440, **0.2582** @390. Reduced-motion still: **0.2146** @1440, **0.0640** @390. All four ≥ 0.06. Column read from the live layout (leaf text nodes), not assumed. |
| 8 | Hero canvas mount after DCL @ `?gl=force`; the poster is what paints before it | **PASS** | **1459 ms** after DCL @1440, **1706 ms** @390 (SwiftShader, `--use-gl=swiftshader --enable-unsafe-swiftshader`). At **t = 200 ms**: 0 canvases in the slot and the stage already carrying the poster url. `glforce-t200-*.png` vs `glforce-atmount-*.png` |
| 9 | AA walk over `#hero`, worst ten, 1440/390 on both paths | **PASS** | Worst of ten is **6.20:1** against 4.5 required, identical on `?gl=force` and the reduced-motion still at both widths. No element below its threshold. |
| 10 | Flagship hero floors | **PASS** | Coverage **0.4663** ≥ 0.15 @1440 · peak **0.8308** ≥ 0.35 · motion **0.00975** ≥ 0.004. Still coverage **0.4090** @1440 / **0.7846** @390, both ≥ 0.08. Ground-relative, isolated slot, spec's own helpers. |
| 11 | LCP < 2.5 s (element named, not the poster) and CLS < 0.05, 3 cold loads × 3 widths | **PASS** | 9/9 unskipped loads. LCP worst **1408 ms**; CLS **0.00000** on every load. LCP element: `h1#hero-name` ("Vikram Deshpande") at 1280 and 1440; the portrait `img[my_avatar.avif]` at 390. **Never the poster** — it is a CSS background and not an LCP candidate. |
| 12 | No-JS: `#hero` and all six section headings paint; no "Loading portfolio" | **PASS** | `#hero` box 1440×1328.9 / 390×1490.0 (not 0×0). h1 "Vikram Deshpande", statement `<p>`, 5 hero links, 3 media elements. All six headings present at both widths. "Loading portfolio" **absent**; ~14.9 kB of visible text. `jsblocked-fold-*.png` |
| 13 | 0 pageerrors / 0 failed requests in every context | **PASS** | 0 pageerrors across all clean contexts (2 chunk-blocked, 2 JS-off, 2 `?gl=force`, 2 reduced-motion, 9 vitals, 1 G-H1). Two apparent errors were probe artefacts — both registered below. |
| 14 | G-H1 regression: one CTA group in the fold, ledger below | **PASS** | Exactly **one** CTA group in the fold: `Hero_actions` at top 675 < 900, holding "See the evidence" + "Download CV". Ledger min top **973 ≥ 900** — entirely below the fold. `gh1-ledger.json` |

**Overall G-H2 verdict: PASS.** Clauses 1–13 all hold on the live build; clause 14 shows no
G-H1 regression.

---

## Is it really the scene, or a generic gradient?

The claim in `ee334cc` is strong — that the poster is *rendered from the hero's own
shader*, not painted. Three independent checks, because the commit message is not evidence:

1. **Provenance.** `scripts/assets/render-hero-poster.mjs` is committed and imports
   `components/sections/Hero/atmosphere.glsl.ts` — the same source `HeroAtmosphere.tsx`
   hands to three — pinning every uniform to its resting value and choosing `uTime` by
   argmax over a luminance sweep. The path from shader to asset is reproducible.
2. **The file itself.** 3840×2160, 8-bit **greyscale** on decode. A hand-drawn CSS-gradient
   impression exported at 4K would carry the gradients' banding; this decodes as a
   continuous-tone field.
3. **Pixels against the live scene.** I compared the decoded poster (downscaled to
   1440×810) against a `?gl=force` capture of the stage, greyscaled. Over the **right 30%
   of the frame — where `.stage::after`'s scrim is transparent past 66% and the shader is
   seen unmodified** — the 9×6 block-luminance signature correlates at **r = 0.676**
   (per-pixel r = 0.546; means 0.471 vs 0.542). Over the full frame r drops to 0.096,
   which is the scrim doing exactly what it is documented to do: the left is graded down
   to near-ink on the live page and is bright in the raw poster. The 3×3 grid agrees on
   the composition — both put the brightest cell bottom-right and the darkest top-centre.

That is consistent with "the same scene, one graded and one not", and inconsistent with a
generic gradient. Caveat stated plainly: the live capture also carries the portrait plate
and the type, so a perfect match was never available, and I did not attempt to re-run the
render script to reproduce the asset byte-for-byte (out of scope for a read-only review,
and it would need a GPU-free Chrome run inside the 25-minute cap).

---

## Regressions vs `e3f0206c`

None. Every clause that failed in the predecessor review now passes, and nothing that
passed there has regressed:

| Clause | `e3f0206c` | This build | Movement |
|--------|-----------|------------|----------|
| `.stage` url() layer | **absent at every width** | present, first layer, all three paths | fixed by `ee334cc` |
| Stage luminance, GL blocked @1440 | **0.0530** (FAIL vs 0.10) | **0.1104** | +0.0574 |
| Stage luminance, GL blocked @390 | **0.0812** (FAIL vs 0.10) | **0.1197** | +0.0385 |
| Stage luminance, JS off @1440 / @390 | not measurable — `#hero` was 0×0 | **0.1103 / 0.1195** | fixed by `6f4ba6c` |
| No-JS page | "Loading portfolio" + footer, `#hero` 0×0 | full page, six headings, hero 1440×1328.9 | fixed by `6f4ba6c` |
| TC-HERO-SCRIM-01 @390 still | 0.0511 (below floor) | **0.0640** | +0.0129 |
| CLS / LCP | green | green (CLS 0.00000, LCP ≤ 1408 ms) | held |

---

## False-positive register

Claims in `ee334cc` / `3d25643` / `6f4ba6c` I could not reproduce verbatim, and probe
artefacts I am declining to charge against the build.

### 1. `3d25643`: the 390 reduced-motion scrim number does not reproduce

Verbatim from the commit message:

> ```
> Evidence, all on this build:
>   TC-HERO-SCRIM-01   0.341 / 0.224 (1440 / 390, ?gl=force)
>                      0.102 / 0.078 (1440 / 390, reduced-motion still)
> ```

Live, this build: **0.2912 / 0.2582** (`?gl=force`) and **0.2146 / 0.0640** (still). Every
one of the four clears the 0.06 floor, so the *gate* holds — but not one of the four
numbers reproduces, and the two the commit reports as tightest move in opposite
directions: the 1440 still measures **0.2146 against a claimed 0.102** (twice the claim),
and the 390 still measures **0.0640 against a claimed 0.0776** (below the claim, leaving
**0.004 of margin** on a 0.06 floor). The commit's own narrative is that 390-still was
carried from 0.0511 to 0.0776 deliberately; the live frame says 0.0640. Local-vs-live
capture differences (server, fonts, image decode) plausibly explain the spread, but the
number in the commit is not the number on the site, and **the surface that lane
specifically tuned is the one with 6% of headroom.** A shader tweak, a font-metric shift,
or an AVIF re-encode could put it under. Flagged, not failed.

### 2. `ee334cc`: "12.6 kB" — reproduces, with a rounding note

Verbatim: *"12.6 kB of AVIF against a 500 kB budget."* The served asset is **12,935 bytes**
= 12.63 kiB / 12.94 kB. Both readings are honest depending on the unit; no defect.

### 3. Probe artefact — the `?gl=force` "pageerror" in my own phase 1

My first-phase script reported 1 pageerror per width at `?gl=force`:
`TypeError: Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'`.
That is **my init script**, registering an observer on `document.documentElement` before it
existed — not site code. Re-measured in phase 2 with a `requestAnimationFrame` poll instead:
**0 pageerrors** at both widths. Charged to the probe, not the build.

### 4. Probe artefact — the JS-off "failed request"

Both `javaScriptEnabled:false` contexts report one failed request:
`/_next/static/chunks/webpack-4c10488c802c3aaf.js` with `errorText: "csp"`. That is
Playwright's own script blocking under `javaScriptEnabled:false`, surfaced as a CSP
failure. It is the harness doing what the clause asks for. Not a site defect.

---

## What I could not close inside the cap

Stated so it is not mistaken for coverage:

- I did not re-run `scripts/assets/render-hero-poster.mjs` to reproduce the AVIF
  byte-for-byte. The composition check above is a correlation argument, not a rebuild.
- LCP/CLS are nine cold loads from one VPS on one network. They are decisive against a
  2.5 s / 0.05 bar with ≤ 1408 ms and 0.00000, but they are not a field distribution.
- Canvas mount timing is SwiftShader, explicitly labelled. A real GPU will be faster; this
  is the slow-path number, which is the one the poster exists to cover.
- Clauses 3–14 were measured at 1440 and 390 as scoped; 1280 appears only in the vitals.

## Captures

All beside this file in `captures/`:
`probe-gh2.mjs` · `probe-gh2.json` · `probe-gh2b.mjs` · `probe-gh2b.json` ·
`gh1-ledger.mjs` · `gh1-ledger.json` · `poster.avif` · `poster-headers.txt` ·
`poster-1440.png` · `scene-1440-gray.png` · `poster-vs-scene-diff.png` ·
`chunkblocked-{stage,fold}-{1440,390}.png` · `jsblocked-{stage,fold}-{1440,390}.png` ·
`glforce-{stage,t200,atmount}-{1440,390}.png` · `reduced-stage-{1440,390}.png`

`poster-decoded.png` (the raw 3840×2160 decode) is not committed — it is one command
from the asset that is: `magick poster.avif poster-decoded.png`.
