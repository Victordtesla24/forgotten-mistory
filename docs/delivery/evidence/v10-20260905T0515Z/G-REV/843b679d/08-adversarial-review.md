# G-REV phase 2 — live adversarial re-probe of G-V1 / G-V2

**Build under test:** `843b679d` — read from the live document, not assumed:
`curl -fsS https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'` →
`build-commit" content="843b679d"`, read at **2026-09-05T12:32:14Z**. The build did not move
during the probe: all six browser contexts independently report
`meta[name=build-commit] = 843b679d` (`captures/probe.json` → `*.measure.buildCommit`).

**Commit under test:** `a80d00e` *feat(vitrine): plates drawn at rest; engagement CTA after the work*
(reached live through the consolidate merge `843b679d`).

**Phase-1 FAIL baseline for comparison:** `../9ba97a5c/08-adversarial-review.md` (G-V1 FAIL, G-V2 FAIL).

**Method.** Same launcher, wiring and context matrix as the phase-1 probe
(`../9ba97a5c/captures/probe.mjs`): system Chrome, `--no-sandbox`, SwiftShader, one browser
context at a time, fresh context per row. Every number below was captured on the live site in
this session — nothing is read from the repository except to establish the *provenance* of a
value already measured live. Scripts: `captures/probe.mjs` (six contexts, 1440×900 and 390×844,
normal / `?gl=force` / `prefers-reduced-motion: reduce`) and `captures/litprobe.mjs`
(same-plate state comparison). Raw: `captures/probe.json`, `captures/lit-vs-resting.json`.

---

## Verdict table

| Gap | PASS/FAIL | Evidence |
|-----|-----------|----------|
| **G-V1** — *Neighbour plates must not look empty; default visible stroke or pre-draw* | **PASS** | All 6 plates, both widths, all 6 contexts: `stroke-dashoffset` = `0px` with **no** exceptions (`probe.json` → `*.measure.plates[].dashoffsetValues` = `["0px"]`, and `dasharray` is now `none`, not `1px`). Resting `stroke-opacity` = **0.5** (≥ 0.4) on every resting plate; lit plate = **1.0**. Label group opacity **0.85** resting / **1.0** lit. Pixel check — every resting plate carries visible ink inside its own drawing box: p1 2 881 px (2.68 %), p2 1 798 px (1.67 %), p4 4 950 px (4.60 %) of 107 640 px at 1440 (`probe.json` → `1440-normal.platePixels`; per-plate PNGs `captures/1440-normal-plate{0..5}.png`). No empty frame at either width. |
| **G-V2** — *Client engagement CTA after curated work* | **PASS** | Exactly **one** engagement CTA inside `#vitrine`, at both widths and in every context: `<a data-cta="engage">Start a project</a>`, `href="mailto:sarkar.vikram@gmail.com?subject=Engagement%20enquiry%20%E2%80%94%20Vikram%20Deshpande"` — subject prefilled. Positioned after the work: CTA top **10 578** vs rail bottom **10 542** vs last plate bottom **10 255** (document px, 1440); 390: **15 952** vs **15 854** vs **15 505**. Achromatic: fg `rgb(10,10,10)`, bg `rgb(246,246,246)`, border `rgb(10,10,10)` → chroma **0 / 0 / 0**. Contrast **18.32:1** (≥ 4.5). Keyboard: reachable in **1 Tab** from the end of the plate rail, `:focus-visible` = true, ring `rgb(246,246,246) solid 2px` at `outline-offset: 4px`. Hit target `min-height: 48px` (rendered 56 px / 54 px). (`probe.json` → `*.measure.engagementCtas`, `*.cta`) |

**Failures first:** none for the two gaps in scope. Both G-V1 and G-V2 move FAIL → PASS against
their binary acceptance. Nothing was softened to get there; the qualifications below are recorded
as measurements, not as waivers.

---

## G-V1 — what was tried to break it

**1. Every plate, not the sampled one.** Six plates measured individually per context, keyed by
title (`Aether`, `AB Entertainment`, `Ralph Loop`, `Prompt Reconstruction`, `Jyotish Shastra`,
`This site`) with their `data-lit` / `data-drawn` ancestry recorded at the moment of measurement,
so a plate that happened to be lit cannot be mistaken for a resting one.

| ctx | plate | state | dashoffset | stroke-opacity | label opacity | host opacity |
|-----|-------|-------|-----------|----------------|---------------|--------------|
| 1440 normal | p0 Aether | lit + drawn | `0px` | 1.0 | 1.0 | 1.0 |
| 1440 normal | p1 AB Entertainment | resting | `0px` | 0.5 | 0.85 | 0.62 |
| 1440 normal | p2 Ralph Loop | resting | `0px` | 0.5 | 0.85 | 0.62 |
| 1440 normal | p3 Prompt Reconstruction | resting | `0px` | 0.5 | 0.85 | 0.62 |
| 1440 normal | p4 Jyotish Shastra | resting | `0px` | 0.5 | 0.85 | 0.62 |
| 1440 normal | p5 This site | resting | `0px` | 0.5 | 0.85 | 0.62 |
| 390 normal | p0–p5 | p0 lit, p1–p5 resting | `0px` | 1.0 / 0.5 | 1.0 / 0.85 | 1.0 / 0.62 |
| 1440 + 390 `?gl=force` | p0–p5 | identical to normal | `0px` | 1.0 / 0.5 | 1.0 / 0.85 | 1.0 / 0.62 |

**2. The pixel test the CSS cannot fake.** Each plate's `<svg>` was screenshotted at its own
bounding box and the ink counted as pixels differing from the box's modal colour (`rgb(8,8,8)`)
by more than 10 in any channel. Every resting plate is non-empty. Baseline `9ba97a5c` had
`stroke-dashoffset: 1px` on five of six plates — the drawing was withheld; it is now present.

**3. The lit plate must be measurably heavier.** Two independent controls, because ink fraction
is not comparable across plates with different drawings (26 vs 7 vs 17 strokes):

- *Same plate, same raster, stroke-opacity 0.5 → 1* (the exact step `[data-lit] .stroke` performs),
  isolated using the reduced-motion context which forces resting strokes to 1.0:
  p1 **0.02677 → 0.03247 (+21.3 %)**, p2 **0.01670 → 0.01951 (+16.8 %)**,
  p4 **0.04599 → 0.04870 (+5.9 %)** (`probe.json` → `1440-normal` vs `1440-reduced` `.platePixels`).
- *Same plate, live state change* (`captures/lit-vs-resting.json`, `captures/litcmp-p1-*.png`):
  p1 resting `hostOpacity 0.62`, ink 2 881 → after pointer emphasis `hostOpacity 0.8`, ink 3 353
  (**+16.4 %**); p2 1 798 → 1 872 (**+4.1 %**).
- Computed-style headroom is unambiguous: lit = stroke-opacity **1.0** × host **1.0**; resting =
  **0.5** × **0.62**. The lit plate composites at ~**3.2×** the resting plate's alpha.

**4. `prefers-reduced-motion: reduce` — every plate fully present.** At 1440 and 390 with reduced
motion, all six plates report `stroke-dashoffset: 0px` **and** `stroke-opacity: 1.0` including the
five resting ones — the reduced-motion path does not depend on the trace running.
(`probe.json` → `1440-reduced`, `390-reduced`.) Screenshots `captures/1440-reduced-vitrine.png`,
`captures/390-reduced-vitrine.png`.

**5. Rail screenshots at rest:** `captures/1440-normal-vitrine.png`, `captures/390-normal-vitrine.png`.

### Measurements recorded against G-V1 that are *not* failures of this commit

- **Composited resting alpha is 0.31, not 0.5.** `.plate` carries `opacity: 0.62`
  (`components/sections/Vitrine/Vitrine.module.css:170`, under the comment *"its neighbours fall
  into shadow"*), so a resting stroke reaches the reader at 0.5 × 0.62 = **0.31** effective alpha
  over `rgb(8,8,8)`. If the ≥ 0.4 threshold is read as *delivered* alpha rather than the stroke's
  own property, this is the number that matters. **It is not a regression from `a80d00e`:**
  `git show a80d00e -- components/sections/Vitrine/Vitrine.module.css | grep -E '^[-+].*opacity'`
  returns only the three new `.engage` lines — the 0.62 predates this commit. Pixel evidence
  confirms the drawing survives it (1.7–4.6 % ink), so G-V1's acceptance —
  *"must not look empty"* — is met at 0.31.
- **Individual strokes sit far below 0.5 by their own `opacity`.** Resting plates carry element
  opacities down to **0.07** (p4), 0.16, 0.22, 0.30, 0.35 — composited that is ~0.02 for the
  faintest. This is the drawings' pre-existing weighting, present in the baseline capture too
  (`../9ba97a5c/captures/probe-a.json` shows 0.22 / 0.30 / 0.35 / 0.50 at `9ba97a5c`), not
  something `a80d00e` introduced.

---

## G-V2 — what was tried to break it

- **Count.** `#vitrine` exposes 10 links; exactly **one** matches the engagement predicate
  (`mailto:` or *start a project / hire / engage / work with / brief / consult*). Baseline: 9 links,
  **0** engagement CTAs. The other nine are repository and demo URLs, unchanged.
- **Order.** The CTA sits below both the last plate and the rail container at both widths (numbers
  in the verdict table) — after the curated work, not beside it.
- **Colour.** fg / bg / border chroma (max−min RGB) all **0**. No gold: the section's single
  gold-coloured element is the live repository URL `aether.srv1356245.hstgr.cloud`
  (`probe.json` → `*.measure.goldInVitrine`), which is exactly what the gold token is for.
- **Keyboard.** Focus placed on the last focusable element of the plate rail, then Tab: the CTA
  takes focus on the **1st** Tab, reports `:focus-visible = true`, and paints a 2 px solid
  `rgb(246,246,246)` outline at 4 px offset. Same at 390.
- **Contrast.** `rgb(10,10,10)` on `rgb(246,246,246)` = **18.32:1**, identical in the reduced-motion
  context.

### Duplication — reported, judged intentional

`Start a project` appears **twice** on the page: `#vitrine` and `#listen`, with byte-identical
`href` (same inbox, same prefilled subject). `probe.json` → `*.measure.startAProjectPageWide`.
Page-wide `mailto:` inventory: `#hero` "Email" (bare), `#vitrine` and `#listen` "Start a project"
(subject-prefilled), `#listen` the address itself, plus a footer "Contact support".
`a80d00e`'s message states this explicitly — *"The route is the pre-addressed enquiry `#listen`
already offers, same inbox and same subject line, so an enquiry that starts at the work arrives
indistinguishable from one that starts at the closing section"* — and the commit adjusts
`cta-duplication.spec` accordingly. **Judgement: intentional and defensible.** Two entry points to
one identical action is a conversion decision, not a defect; there is no divergence for a reader
to resolve (same label, same target, same subject). Flagged so the board owns it as a decision
rather than an accident.

---

## Regressions

| Check | Result |
|-------|--------|
| Page errors, 1440 + 390, normal | **0** in both (`probe.json` → `1440-normal.pageerrors`, `390-normal.pageerrors`) |
| Page errors, 1440 + 390, `?gl=force` | **0** in both |
| Console errors / failed requests, all 6 contexts | **0 / 0** in every context |
| `scene-vitrine` field mounts at `?gl=force` | **Yes** — 1 live canvas in `#vitrine`, `webgl2-live`, 1296×759 at 1440 and 342×745 at 390 |
| `#vitrine` gold count | **1**, on the live repository URL `aether.srv1356245.hstgr.cloud` (`color` + `border`). Gold appears on no other element in the section, and not on the new CTA. Consistent with the gold-as-claim rule and with the monochrome suite's GS-02 ("one saturated gold per vitrine viewport"). |
| `#vitrine` text contrast vs baseline | **No worse.** 0 failing text nodes in `#vitrine` at 1440 and 390 (WCAG AA, large-text aware), matching the baseline's finding that no contrast failure sat in `#vitrine`. |
| Section inventory | Six sections, unchanged order |

**No regression found.**

---

## False-positive register

Claims in `a80d00e` or on the board that I could not reproduce on live `843b679d`:

> "every `.stroke` is `stroke-dashoffset: 0; stroke-opacity: 0.5` at rest"

Reproduced for `stroke-dashoffset` without exception. For `stroke-opacity`, one element inside the
`Jyotish Shastra` plate's SVG reports `1` at rest while every `.stroke` I sampled reports `0.5`
(`probe.json` → `1440-normal.measure.plates[4].strokeOpacityMax` = 1, `.strokes[0..3]` all 0.5 with
`isStrokeClass: true`). My selector deliberately captures **every** SVG geometry node, `.stroke` or
not, so I cannot attribute that `1` to a `.stroke` element — **no false positive is claimed here**;
it is recorded so the next probe can resolve it with a `.stroke`-only selector.

Every other checkable claim in `a80d00e`'s message reproduced on live: dashoffset 0 at rest,
stroke-opacity 0.5 → 1 under `[data-lit]`/`[data-drawn]`, labels 0.85 → 1, one achromatic
mailto CTA after the rail, gold in the section confined to plate URLs.

**Register otherwise empty.** No board "Done"/"PASS" claim in scope contradicted a live measurement.

---

## Remaining P0 gaps — one line each

Scope note: `G-A1` / `G-A2` are being re-probed by a sibling reviewer and are deliberately not
duplicated here. Commit range checked for remediation: `git log --oneline 9ba97a5c..843b679d`
returns `6f59312` (CI), `77cd9a3` + `ff44168` (evidence), `0b0bf02` (architecture doc),
`03aa1ed` (G-A1), `0c6f9f9`/`e47221e`/`675eea1`/`843b679d` (merges/docs), `a80d00e` (this review).

| Gap | Status on live `843b679d` |
|-----|---------------------------|
| **G-H1** hero first fold | **FAIL, unchanged** — no remediation commit in `9ba97a5c..843b679d`; phase-1 baseline stands. |
| **G-H2** hero signature scene | **FAIL, unchanged** — `0b0bf02` lands an architecture document only; no shipped UI in the range. |
| **G-H3** palette purge | **FAIL, unchanged** — no remediation commit; `t_g_h3` still queued per the board. |
| **G-S1** skills scene | **FAIL, unchanged** — no remediation commit; `#skills` reports **0 canvases** at `?gl=force` in this probe, matching baseline. |
| **G-M1** MiniVic send path | **FAIL, unchanged** — no remediation commit in range. |
| **G-M2** greeting MP3 vs intro text | **FAIL, unchanged** — no remediation commit in range. |
| **G-M3** first-token latency | **FAIL, unchanged** — no remediation commit in range; `t_g_m3` gated behind `t_g_m1`. |

`goal_complete` stays **false**: the run's goal is every P0 gap PASS on live, and seven remain FAIL.

---

## Evidence index

```
docs/delivery/evidence/v10-20260905T0515Z/G-REV/843b679d/
├── 08-adversarial-review.md              this file
└── captures/
    ├── probe.mjs                         6-context live probe (source)
    ├── probe.json                        every measurement quoted above
    ├── litprobe.mjs                      same-plate lit-vs-resting comparison (source)
    ├── lit-vs-resting.json               its output
    ├── 1440-normal-vitrine.png           rail at rest, 1440×900
    ├── 390-normal-vitrine.png            rail at rest, 390×844
    ├── 1440-reduced-vitrine.png          rail under prefers-reduced-motion
    ├── 390-reduced-vitrine.png
    ├── 1440-glforce-vitrine.png
    ├── {1440-normal,390-normal,1440-reduced}-plate{0..5}.png   per-plate ink crops
    └── litcmp-p{1,2}-{A-resting,B-lit}.png
```
