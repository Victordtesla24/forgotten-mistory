# 08 — Independent adversarial re-probe (PHASE 2 · live `9b864752`)

**Task:** `t_g_rev` · **Profile:** reviewer — verification / 3rd_party_independent_adversarial_review (level 1, effort max)
**Live URL:** <https://forgotten-mistory.web.app/>
**Live `build-commit`:** `9b864752` — read from the page meta, not from the repo
**Probed:** 2026-09-05 13:00Z – 13:27Z · **Verdict: G-H1 FAIL · G-S1 PASS**
**Read-only run.** No production code was touched. Only files under this evidence directory were written.

```
$ curl -sI https://forgotten-mistory.web.app/ | grep -iE 'last-modified|etag'
etag: "333523311d6fa3c77680c6f7f4e72bd529107127eb91468dcefb3a4125bd2900"
last-modified: Sat, 05 Sep 2026 12:59:09 GMT
$ curl -s https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'
build-commit" content="9b864752"
```

The deployed commit is the one in scope; it did **not** move under me. `9b86475` is a
consolidate merge whose tree carries both commits under test —
`components/sections/Hero/Hero.tsx` renders `data-testid="hero-fold"` / `"hero-proof"`,
and `components/sections/Skills/Bench.tsx:304` mounts `<Scene sceneId="skills-bench">`.
Both were pushed before their Playwright batteries finished; this is the first
independent check.

**Method.** Reused `../9ba97a5c/captures/probe.mjs` verbatim for the fold inventory
(same `inFold`, same text-leaf, paragraph, and CTA definitions) so every number is
comparable to the phase-1 baseline. Luminance / coverage / peak / motion reuse
`tests/overhaul/flagship-visibility.spec.ts` (`relativeLuminance`, `coverage` at
`GROUND + 0.06`, `peak`, `meanDelta` over two frames 1 s apart, slot isolated by
`visibility`). Gold uses the exact `SATURATED_GOLD` / `ANY_GOLD` palettes and the
`LICENSED` selector from `tests/monochrome/gold-semantics.spec.ts:34-45,236`. System
Chrome, `--no-sandbox --use-gl=swiftshader --enable-unsafe-swiftshader`, one context
at a time. Scripts: `captures/probeA-hero.mjs`, `probeB-gl.mjs`, `probeC-final.mjs`.

---

## 1. Verdict table — failures first

| Gap | Verdict | Measured on live `9b864752` | Evidence |
|-----|---------|------------------------------|----------|
| **G-H1** | **FAIL** | Two acceptance clauses miss. (a) **"exactly one CTA group"** holds at 1440 and 1280 but **fails at 834 and 390**, where the fold carries **two** groups — `hero-actions` (*See the evidence*, *Download CV*) **and** `hero-portrait` (*Play the portrait*). (b) **CLS at 1280×720 = 0.17639** in 2 of 3 cold loads — the gate is `< 0.05`, so it is over by 3.5×. Everything else on the clause list passes at all four viewports. | `captures/probeA-hero.json`, `probeC-final.json → webvitals1280` |
| **G-S1** | **PASS** | `#skills` mounts exactly **one** `<canvas>` inside `[data-scene="skills-bench"]`, `webgl2-live`, at **both** 1440 (1248×579) and 390 (342×152) on `/?gl=force`. Field is lit and moving: **coverage 0.4473** (≥ 0.15), **peak 0.7529** (≥ 0.35), **motion 0.014825** (≥ 0.004) — all three flagship gates clear. Reduced-motion: **0 canvases**, SVG bench still drawn (1248×580, 20 paths). No-GL headless: **0 canvases**, section whole (4270 chars, 21 rows, heading *Calibration card*). Gold: **1 saturated** (budget 6), **15 any-gold**, **0 unlicensed**. **0 pageerrors** in every context. | `captures/probeB-gl.json`, `probeC-final.json` |

---

## 2. G-H1 — per-viewport sub-rows

`hero-fold` / `hero-proof` both exist at every viewport. `.proof` starts below the
fold everywhere, exactly as `Hero.module.css` claims.

| Viewport | h1 in fold | text leaves (≤ 8) | paras > 12w (≤ 1) | CTA groups (= 1) | CTAs in fold | `#hero ul` top vs `innerHeight` | availability top | stage coverage (≥ 0.90) | photo | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| **1440×900** | 1 ✅ | **4** ✅ | **1** ✅ (29 w) | **1** ✅ | 1 — *Play the portrait* only | **1110** > 900 ✅ | **1268** > 900 ✅ | **1.000** ✅ | 632×352 visible ✅ | **PASS** |
| **1280×800** | 1 ✅ | **4** ✅ | **1** ✅ | **1** ✅ | 1 — *Play the portrait* only | **1005** > 800 ✅ | **1191** > 800 ✅ | **1.000** ✅ | 561×312 visible ✅ | **PASS** |
| **834×1194** | 1 ✅ | **6** ✅ | **1** ✅ | **2** ❌ | 3 | **1195** > 1194 ✅ *(by 1 px)* | **1576** ✅ | **1.000** ✅ | 365×203 | **FAIL** |
| **390×844** | 1 ✅ | **5** ✅ | **1** ✅ | **2** ❌ | 3 | **892** > 844 ✅ | **1171** ✅ | **1.000** ✅ | 390×216 | **FAIL** |

**Ledger / grading / availability are out of the fold at all four viewports.** The
three `<li>` sit at `top: 1110 / 1005 / 1195 / 892`, each beyond its own
`innerHeight`; `[data-testid="hero-availability"]` at `1268 / 1191 / 1576 / 1171`;
zero grading-note leaves (`/self-reported|sourced|grading|figure/i`) inside the fold.
That is a clean fix of the phase-1 failure (baseline: ledger at `top: 535`,
availability at `top: 840`, both inside a 900 px fold).

**Text density is fixed.** 21 → **4** in-fold text leaves at 1440 (council target ≤ 8);
4 → **1** paragraph over 12 words. The one long paragraph is the statement, which the
acceptance explicitly allows. The role kicker is 6 words; the eyebrow is 2.

**Dominant visual is fixed.** `[data-scene="hero-atmosphere"]` *is* `.Hero_stage`, and
its box covers **100 %** of the fold at every viewport (phase-1 baseline: 11.4 %,
measured against the largest media element). Measured against the largest single media
element the number is 0.1714 at 1440 — the photograph — but the acceptance names the
stage, and the stage is full-bleed.

### The two failures

**(a) Two CTA groups at 834 and 390.** `Play the portrait` is a real in-fold CTA — a
`<button class="Hero_portraitToggle">` with an accessible name and a click handler,
inside `[data-testid="hero-portrait"]`, at `top: 352` (834) and `top: 780` (390). It
sits in a different parent from `[data-testid="hero-actions"]`, so a reader at phone
and tablet width is offered two competing groups in the first screen. **Yes, it counts.**

The inverse is true at desktop and is worth stating plainly even though it passes the
letter of the clause: at **1440 and 1280 the named actions group is *below* the fold** —
*See the evidence* and *Download CV* are not in the first viewport at all (they first
appear in-fold at 834, `top: 970`). The single in-fold CTA group at desktop is the
portrait toggle. The clause "exactly one CTA group" is satisfied by the wrong group.

**(b) CLS 0.17639 at 1280×720.** Three cold loads via `PerformanceObserver`
(`layout-shift`, `hadRecentInput` excluded):

| run | LCP | CLS | LCP element |
|---|---|---|---|
| 0 | 800 ms | **0.17639** | `IMG my_avatar.avif` |
| 1 | 1032 ms | 0.00000 | `IMG my_avatar.avif` |
| 2 | 1116 ms | **0.17639** | `IMG my_avatar.avif` |

**LCP median 1032 ms — PASS** (gate 2.5 s). **CLS max 0.17639 — FAIL** (gate 0.05),
reproducing in 2 of 3 runs at an identical magnitude, which reads as one deterministic
reflow that sometimes lands before the observer's first frame rather than as noise. The
LCP element is the hero photograph, the element `0506e7e` moved — so the shift is
attributable to the hero band under test, not to a pre-existing section.

### G-H1 secondary clauses — all pass

| Clause | Measured | Verdict |
|---|---|---|
| 0 pageerrors | 0 in all 6 contexts (4 viewports normal + 1440/390 `?gl=force`) | ✅ |
| ≤ 700 px text plates `rgb(10 10 10 / 0.90)` on `/?gl=force` at 390 | **10 plates** present — `Hero_eyebrow`, `Hero_name`, `Hero_role`, `Hero_statement`, `Hero_secondaryAction`, … all `rgba(10, 10, 10, 0.9)` | ✅ |
| hero scene measurable at 390 (coverage > 50 %) | `[data-scene="hero-atmosphere"]` mounts **1 canvas, `webgl2-live`** on `/?gl=force` at 390 and 1440; slot is 390×1257 and covers **100 %** of the fold | ✅ |
| AA contrast walk over `#hero`, 1440 + 390, both paths | **0 failures**, **min ratio 6.20** on all four walks (normal and `?gl=force`) | ✅ |
| **CT-10** — `#hero ul li` ×3 with 92 / $5M+ / 10k+ | `ulLiCount: 3`; `≈92%`, `$5M+`, `10k+` all present in `#hero`, each with `(Self-reported figure.)` | ✅ |

---

## 3. G-S1 — per-viewport sub-rows

| Check | 1440 | 390 | Verdict |
|---|---|---|---|
| canvases in `#skills` on `/?gl=force` | **1** | **1** | ✅ |
| `data-scene` / context | `skills-bench` · `webgl2-live` · 1248×579 | `skills-bench` · `webgl2-live` · 342×152 | ✅ |
| field coverage (≥ 0.15) | **0.4473** | — | ✅ |
| field peak (≥ 0.35) | **0.7529** | — | ✅ |
| field motion, 2 frames 1 s apart (≥ 0.004) | **0.014825** | — | ✅ |
| `prefers-reduced-motion: reduce` → 0 canvases in `#skills` | **0** | — | ✅ |
| …with the SVG bench still visible | `Bench_wires` 1248×580, `display: block`, 20 paths | `display: none` at 390 (mobile layout drops the wire diagram; the card's 21 rows carry the content) | ✅ at 1440 |
| WebGL unavailable (normal headless) — section whole | 0 canvases, 4270 chars, 21 rows, heading *Calibration card*, SVG drawn | same | ✅ |
| gold in `#skills` ≤ `SKILLS_GOLD_BUDGET` (6) | **1 saturated** — `SPAN.Skills_legendGlyph.Skills_measuredMark` `●` `rgb(201,168,76)` at x=129 | — | ✅ |
| every gold node on a licensed surface | **15 any-gold, 0 unlicensed** — 14 × `SPAN.Bench_mark.Bench_production` `rgb(176,146,63)` (`--gold-dark`) at x=1088, all matching `[class*="mark"][class*="production"]`; + the legend glyph | — | ✅ (also under GS-11's ≤ 16 ceiling) |
| pageerrors | **0** | **0** | ✅ |
| text contrast in `#skills` on `/?gl=force` | **0 failures, min 4.70** | **0 failures, min 4.70** | ✅ no worse than baseline |

The 14 production dots sit in a **single** vertical run at `x = 1088` — the collapsed
shape CC-10 asks for, not the two competing columns the rule was written against.

---

## 4. Regressions

| Area | Status |
|---|---|
| **CLS at 1280×720** | **REGRESSION — 0.17639 vs a 0.05 gate**, 2 of 3 cold loads, LCP element `my_avatar.avif`. The one new failure this build introduces. |
| Hero phone scene (flagship-C) | **No regression.** `hero-atmosphere` mounts 1 `webgl2-live` canvas on `/?gl=force` at 390 *and* 1440. Scenes are IntersectionObserver-gated — only the in-view slot holds a canvas — so a probe that scrolls away from `#hero` before scanning will read 0 there and must not call it a regression. |
| Hero text plates (flagship-C) | **No regression.** 10 × `rgba(10, 10, 10, 0.9)` plates at 390 on `/?gl=force`. |
| **CT-10** | **Holds.** 3 `<li>`, all three figures, all three still `(Self-reported figure.)` — no re-grading to `sourced`. |
| `#hero` AA contrast | **No regression.** 0 failures, min 6.20, both paths, both widths. |
| `#skills` AA contrast | **No regression.** 0 failures, min 4.70 on `/?gl=force`. |
| pageerrors | **No regression.** 0 everywhere, in 12 page loads. |

---

## 5. False-positive register

Claims I could not reproduce on live `9b864752`, verbatim with source:

1. **`0506e7e` — "a second band … and one actions group *See the evidence* + *Download CV*"**
   *inside the fold.* **Not reproduced at 1440 or 1280.** `[data-testid="hero-actions"]` is
   below the first viewport at both desktop widths; the only in-fold CTA group there is the
   portrait toggle. The group exists and is correctly composed — it is simply not in the fold
   the acceptance describes.
   `probeA-hero.json → 1440-normal.measure.hero.ctaGroups` = `[{group: "Hero_portraitMedia…", items: ["Play the portrait"]}]`.

2. **`0506e7e` — the fold shows "the photograph" as part of a dominant full-bleed visual.**
   Partly reproduced. The **stage** is full-bleed (coverage 1.000) and clears the ≥ 0.90 clause;
   the **photograph** itself occupies 17.1 % of the fold at 1440 and 17.1 % at 1280. Anyone
   reading "dominant full-bleed visual" as *the photograph* would be wrong — it is the stage.
   `probeA-hero.json → hero.dominantMediaCoverage` = 0.1714 / 0.1712; `hero.stage.visibleInFoldCoverage` = 1.

3. **My own phase-2 first pass reported `0` canvases in `#skills` at 390 on `/?gl=force`.**
   **Withdrawn — my measurement error, not a site fault.** A 2 500 ms settle after a single
   `scrollIntoView` is too short for the 342×152 mobile slot. Re-probed with six
   scroll-and-wait cycles (`probeC-final.mjs`) the canvas mounts every time:
   `canvasTrace = 1>1>1>1>1>1`, `webgl2-live`. Recorded here rather than deleted, because a
   FAIL asserted on a timing artifact is the failure mode this role exists to prevent.

4. **`captures/probeB-gl.json → 390-glforce.field`** (`coverage 0.4766, peak 0.1384,
   motion 0.075233`) **is not a measurement of the bench field** — it was taken in the run
   where the canvas had not yet mounted, so it measures the CSS slot alone. Disregard it;
   the field numbers of record are the 1440 ones in §3.

**What I did not measure (declared, not inferred):** the isolated luminance field of the
`skills-bench` canvas at 390 (the slot is 342×152 and the flagship thresholds are calibrated
against the 1440 slot); and the `hero-atmosphere` scene's isolated coverage — hero coverage
above is the **slot's** share of the fold by geometry, not a photographed luminance field.

---

## 6. One-line status for the remaining P0 gaps

- **G-H2** (hero flagship on a *normal* load) — **still open, unchanged**: 0 canvases anywhere on the page without `?gl=force`, at 1440 and 390. Lane in flight; not re-adjudicated here.
- **G-H3** (chroma utilities + blue-steel body washes in the served CSS) — **not re-probed this run**; lane in flight, no claim either way.
- **G-A1c / G-M1 / G-M2** — probed by sibling reviewers this cycle; **not duplicated here** by instruction.

---

## 7. Artefacts

```
docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/
├── 08-adversarial-review.md          (this file)
└── captures/
    ├── probeA-hero.mjs / .json       G-H1 fold inventory, 4 viewports × 2 paths, contrast walks
    ├── probeB-gl.mjs   / .json       scene-slot scan, bench field luminance, reduced-motion, gold
    ├── probeC-final.mjs / .json      390 long-settle retry, exact gold palettes, no-GL, LCP/CLS
    ├── {1440,1280,834,390}-{normal,glforce}-fold.png
    ├── {1440,390}-glforce-benchfield-t{0,1}.png
    └── {1440,390}-glforce-skills.png, 1440-{nogl-normal,nogl-reduced,reduced,normal}-skills.png
```

**`goal_complete = false`** — G-S1 passes cleanly; G-H1 fails on the CTA-group clause at
834 and 390 and on the CLS gate at 1280×720, and the CLS miss is a new regression.
