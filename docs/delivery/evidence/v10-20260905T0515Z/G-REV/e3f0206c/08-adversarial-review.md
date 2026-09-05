# 08 — Independent adversarial re-probe (PHASE 3 · G-H1 correction + G-H2a first paint)

**Task:** `t_g_rev` · **Profile:** reviewer — verification / 3rd_party_independent_adversarial_review (level 1, effort max)
**Live URL:** <https://forgotten-mistory.web.app/>
**Probed:** 2026-09-05 13:51Z – 14:14Z · **Verdict: G-H1 PASS · G-H2a FAIL**
**Read-only run.** No production code was touched; only files under this evidence directory were written.

## What was actually measured, and on which build

The scope named `e3f0206c` at 13:49:21Z. **It had already moved before the first probe and moved
three more times during the run** — the ten-minute deploy metronome fires under the review. Every
number below is stamped with the `build-commit` the page itself reported:

```
13:51:44Z  curl → build-commit" content="34755d6c"   (last-modified: Sat, 05 Sep 2026 13:50:17 GMT)
probeA     hero structure / keyboard, 4 viewports → meta read in-page: e658709b
probeB     vitals 1280 ×3, 1440 ×2                → 411650c2
probeB     vitals 1440 ×1, 390 ×3, and all G-H2a  → 753bc5ad
```

All four builds are descendants of the commits under test: `70a04a8` + `46379f1` (G-H1 correction)
and `9dfaacd` + `1938498` (G-H2a) are in each tree — `Hero.tsx` renders
`<Scene … priority>` and `<HeroPortraitControl />` inside `[data-testid="hero-proof"]`, and the
figure carries no pressable. Nothing in the two changes under test differs across those four
commits, so the verdicts hold; the build id is recorded per measurement rather than assumed.

**Method.** Fold inventory reuses `../9b864752/captures/probeA-hero.mjs` verbatim — same `inFold`,
same text-leaf / paragraph / CTA definitions, same CTA-group rule (nearest `[data-testid]` ancestor,
else parent class) — so every number is comparable to phase 2. Luminance is the WCAG helper from
`tests/overhaul/hero-first-paint.spec.ts` over every pixel of a PNG; the WebGL-chunk block is that
file's `LAZY_CHUNK` regex verbatim; JavaScript blocking is the Playwright context option
`javaScriptEnabled: false`. System Chrome, `--no-sandbox --use-gl=swiftshader
--enable-unsafe-swiftshader`, one browser context at a time.
Scripts: `captures/probeA-hero.mjs`, `captures/probeB-vitals-firstpaint.mjs`.

---

## 1. Verdict table — failures first

| Gap | Verdict | Measured on live | Evidence |
|-----|---------|------------------|----------|
| **G-H2a** | **FAIL** | The **JavaScript-blocked clause does not hold, at either width, by a factor of ~30.** With `javaScriptEnabled: false` the stage box does not exist: `[data-scene="hero-atmosphere"]` is in the DOM (count 1) but `boundingBox()` is **null**, `#hero` is **null**, and the only rendered text is *"Skip to the evidence · LOADING PORTFOLIO"*. Viewport mean luminance **0.0031 @1440** and **0.0033 @390** against the **≥ 0.10** acceptance. Measured the lane's own way instead (JS on, WebGL chunk aborted) the slot is lit but still short: **0.0530 @1440**, **0.0812 @390** — over the lane's own 0.04 floor, under the 0.10 this review was given. There is also **no poster**: the computed `background-image` on `.stage` contains no `url()` layer at any width — the "still" is the gradient stack. The `priority` mechanism itself is sound (see §3). | `probeB-vitals-firstpaint.json → jsBlocked, chunkBlocked`, `jsblocked-1440.png`, `chunkblocked-1440.png` |
| **G-H1** | **PASS** | Every acceptance clause holds at all four viewports. **Exactly one CTA group in the fold** (`hero-actions`, both links) at 1440 / 1280 / 834 / 390 — the figure holds **zero** pressables. `hero-actions` bottom clears the fold by **177 / 144 / 432 / 263 px** (≥ 40). `#hero ul` starts at **973 / 865 / 1275 / 959**, clearing `innerHeight` by **73 / 65 / 81 / 115 px** (≥ 40). Text leaves **6 / 6 / 6 / 5** (≤ 8); paragraphs over 12 words **1** (the 29-word statement). Stage coverage **1.000**. Photograph in the fold at every width (545×303 @1440, 484×269 @1280). CT-10 intact. **CLS 0.00000 on 9 of 9 cold loads** — zero `layout-shift` entries, not a small sum. LCP **480–1344 ms**. Keyboard, pointer and reduced-motion contracts all verified. **0 pageerrors in every context.** | `probeA-hero.json`, `probeB-vitals-firstpaint.json → vitals` |

---

## 2. G-H1 — clause by clause, per viewport

| Clause (gate) | 1440×900 | 1280×800 | 834×1194 | 390×844 |
|---|---|---|---|---|
| CTA groups in fold (**= 1**, must be `hero-actions`) | **1** ✅ `hero-actions` | **1** ✅ | **1** ✅ | **1** ✅ |
| …both links present | *See the evidence*, *Download CV* ✅ | ✅ | ✅ | ✅ |
| pressables inside the `<figure>` (**= 0**) | **0** ✅ | **0** ✅ | **0** ✅ | **0** ✅ |
| `hero-actions` bottom margin to fold (**≥ 40 px**) | **177** ✅ | **144** ✅ | **432** ✅ | **263** ✅ |
| `#hero ul` top − `innerHeight` (**≥ 40 px**) | **+73** (973) ✅ | **+65** (865) ✅ | **+81** (1275) ✅ | **+115** (959) ✅ |
| paragraphs > 12 words (**≤ 1**) | **1** (2 / 6 / 29 w) ✅ | **1** ✅ | **1** ✅ | **1** ✅ |
| text leaves in fold (**≤ 8**) | **6** ✅ | **6** ✅ | **6** ✅ | **5** ✅ |
| stage covers the fold | **1.000** ✅ | **1.000** ✅ | **1.000** ✅ | **1.000** ✅ |
| photograph in fold (≥ 1280 required) | 545×303 @top 256 ✅ | 484×269 @top 232 ✅ | 315×175 ✅ | 390×216 ✅ |
| grading nodes below fold | 0 in fold ✅ | 0 ✅ | 0 ✅ | 0 ✅ |
| availability below fold | 1131 ✅ | 1047 ✅ | 1656 ✅ | 1239 ✅ |
| CT-10 (`#hero ul li` ×3, 92 / $5M+ / 10k+) | 3 li, all three figures ✅ | ✅ | ✅ | ✅ |
| pageerrors | **0** ✅ | **0** ✅ | **0** ✅ | **0** ✅ |

`70a04a8`'s own claim — *"the ledger now starts 973 / 865 / 1275 / 959"* — **reproduces exactly**,
to the pixel, at all four viewports. Phase 2's one-pixel clearance (`1195` against a `1194` fold) is
gone; the `--space-12` token bug it named is genuinely fixed.

### 2.1 The control in the proof band

`<button data-testid="portrait-control">` — *"Play the portrait"* — at all four viewports:
`insideProof: true`, `belowFold: true` (top **1181 / 1097 / 1706 / 1349**), rendered height
**40 px** with `min-height: 40px` declared, `aria-pressed="false"` at rest, accessible name from
its own text. It follows the availability line, as claimed.

### 2.2 Keyboard — *"focus offers, a press decides"*

Measured at every viewport, identical result:

| Step | Measured |
|---|---|
| Tab presses to reach it from the top of the document | **10** — reached, `document.activeElement` is `[data-testid="portrait-control"]` ✅ |
| video state on **focus alone** (700 ms after) | `paused: true`, `currentTime: 0`, **`src` not even attached** ✅ — focus offers, it does not play |
| focus ring | `outline: 2px solid rgb(246, 246, 246)`, `box-shadow: none` — R = G = B, **achromatic** ✅ |
| **Enter** | `aria-pressed → "true"`, video **playing** (`my-avatar.mp4`, t ≈ 0.98–1.15 s) ✅ |
| **Space** | `aria-pressed → "false"`, video paused ✅ — the two keys toggle |

### 2.3 Pointer arms the loop (fresh context, no prior press)

1440 and 390: before hover `paused: true, src` unattached → pointer-enter over the figure →
**playing** (`my-avatar.mp4`, t ≈ 2.4 s) with `aria-pressed` on the proof-band control reflecting
**true** → pointer-leave → **paused**. The in-frame control was removed without removing the
behaviour, and the one state serves both places, exactly as `PortraitIntentProvider` claims.

### 2.4 CLS and LCP — 9 cold loads, 3 per viewport, none skipped

| Viewport | load 1 | load 2 | load 3 | build |
|---|---|---|---|---|
| 1280×720 | CLS **0.00000** / LCP 744 ms | **0.00000** / 1184 ms | **0.00000** / 820 ms | `411650c2` |
| 1440×900 | **0.00000** / 728 ms | **0.00000** / 1344 ms | **0.00000** / 1260 ms | `411650c2` → `753bc5ad` |
| 390×844 | **0.00000** / 536 ms | **0.00000** / 1180 ms | **0.00000** / 480 ms | `753bc5ad` |

The `layout-shift` observer (`buffered: true`, `hadRecentInput` filtered) recorded **zero entries**
in all nine — not a small sum, an empty list. Phase 2's **0.17639 at 1280×720 in 2 of 3 loads** is
gone. LCP worst case **1344 ms** against 2.5 s.

### 2.5 Reduced motion

At 1440 and 390 with `reducedMotion: 'reduce'`: **0 canvases** anywhere on the page, hero video
`paused: true, currentTime: 0` with no `src`, and **hovering the figure for 1.5 s does not start
the loop** (`paused: true, currentTime: 0`). The control is still present and still named. WCAG
2.2.2 holds — nothing autoplays, and only a press can start it.

---

## 3. G-H2a — clause by clause

| Clause | Verdict | Measured |
|---|---|---|
| JS blocked @1440: stage background carries the poster, **mean luminance ≥ 0.10** over the stage box | **FAIL** | Stage box **does not exist**: slot count 1, `boundingBox()` **null**, `#hero` `boundingBox()` **null**. Whole-viewport mean luminance **0.0031**. Rendered text: *"Skip to the evidence LOADING PORTFOLIO Privacy Policy·Terms·…"* |
| JS blocked @390: same | **FAIL** | **0.0033**, same shell, same null boxes |
| the still is lit at all (lane's own method: JS on, WebGL chunk aborted) | **partial** | Slot lit and canvas-free: **0.0530 @1440**, **0.0812 @390**, slot box 1440×1329 / 390×1490, `canvases: 0`. Clears the lane's own 0.04 floor; **misses the 0.10 in this review's acceptance** |
| the background is a *poster* | **FAIL (no poster exists)** | computed `background-image` has **no `url()` layer** at either width — five gradient layers only. The `hero-overture-poster.avif` the CSS comment anticipates is not in the stack |
| `/?gl=force`: a canvas exists inside `[data-scene="hero-atmosphere"]` soon after DOMContentLoaded | **reported, judged below** | **1477 ms @1440**, **1374 ms @390** after DCL |
| every OTHER scene mounts only after page settle | **PASS** | At `/?gl=force`, before any scroll: `hero-atmosphere: 1`, `about-field: 0`, `career-strata: 0`, `skills-bench: 0`. With `requestIdleCallback` neutered so `pageSettled` can never become true: still `hero: 1`, all others **0**. After scrolling down, `skills-bench: 1` — the deferred path mounts on proximity, and the hero releases its own canvas (`hero: 0`) once it is far away |
| LCP < 2.5 s, CLS < 0.05 unchanged | **PASS** | §2.4 — 0.00000 / ≤ 1344 ms |
| reduced motion: the stage shows the still, no canvas | **PASS** | `/?gl=force` + `reduce`: slot `canvases: 0`, slot mean luminance **0.0530 @1440**, **0.0818 @390** |
| normal (non-forced) load under SwiftShader headless | **states nothing either way** | No canvas within 15 s of DCL and **0** after a further 5 s at 1440. Capability detection declines SwiftShader without `?gl=force`; this is a harness property, not a production one, and it is why `?gl=force` is the probe |

### 3.1 Judging "in the first paint"

The lane's `TC-HERO-FIRSTPAINT-02` deliberately uses a liveness ceiling, not a wall clock, and says
so. On that test's own terms the change passes, and the **causal** half is what actually pins it
down: with `requestIdleCallback` replaced by a no-op — so `pageSettled` is false for the lifetime
of the page — **the hero canvas still mounts**. The idle gate is genuinely bypassed for the hero and
genuinely intact for S2…S7. `priority` does what it says.

By wall clock it is not "the first paint". The canvas is attached **1374–1477 ms after
DOMContentLoaded**, while **LCP lands at 728–1344 ms** — the largest paint is finished before the
canvas exists, in every run. Part of that is SwiftShader; none of it is measurable here as a GPU
visitor's experience. The honest statement is: *the hero scene no longer waits for `window.load`
plus idle, and it is not in the first frame either.* The gap is covered by the still — which is why
the still's luminance clause mattering is not a technicality.

### 3.2 Why the JS-blocked failure is a production finding, not a probe artefact

`app/loading.tsx` puts the route behind a Suspense boundary; the export ships the real markup
inside a `<div hidden>` and swaps it in with React's inline streaming script. Any client that does
not execute script — a non-executing crawler, a reader with JS off — gets *"LOADING PORTFOLIO"* and
nothing else, indefinitely. **The lane found this itself** and wrote it into
`tests/overhaul/hero-first-paint.spec.ts:55-75`, then substituted the WebGL-chunk block, filing the
shell defect "for its own task". That reasoning is sound and the substitution is honest. It does
not change the verdict here: the acceptance clause handed to this review is the JS-blocked one, it
is measurable, and on live it returns **0.0031 / 0.0033**. G-H2a cannot be signed off against its
stated acceptance while the route is invisible without script — and the lane's own softer
measurement (0.0530 / 0.0812) still lands under 0.10.

---

## 4. Regressions

**Versus phase 2 (`9b864752`): none. Three fixes confirmed, nothing traded for them.**

| Phase-2 finding | Now |
|---|---|
| Two CTA groups in the fold at 834 and 390 | **1 group at all four viewports**; figure holds 0 pressables |
| `#hero ul` cleared the fold by 1 px at 834 | **+81 px** at 834, **+65 px** minimum across all viewports |
| CLS 0.17639 at 1280×720 in 2 of 3 loads | **0.00000 in 9 of 9**, zero shift entries |
| 4 text leaves @1440 | 6 — still well inside the ≤ 8 gate; the two extra are the control's siblings entering the fold measurement, not new copy |

**Versus the flagship-C / stability reviews: no regression detected in what this scope re-probes.**

- **Phone plates** — present and unchanged at 390: `eyebrow`, `name`, `role`, `statement`,
  `secondaryAction`, `portraitCaption`, three `ledgerItem`s, `grading`, `availability`, plus the new
  `portraitControl` at `rgba(10,10,10,0.72)` — 12 plates. At 1440 the desktop set is 6. The new
  control adopted the plate treatment rather than punching a hole in it.
- **Phone scene** — under `/?gl=force` at 390 the hero canvas mounts (1374 ms); under reduced motion
  it does not, and the slot is still lit (0.0818). Both paths behave.
- **`openNote`** — outside the two changes under test and not re-probed this phase; it was not
  touched by `70a04a8`, `46379f1`, `9dfaacd` or `1938498` (all four are confined to
  `components/sections/Hero/*`, `components/gl/Scene.tsx` and `tests/`).

---

## 5. False-positive register

Claims made in the commits under test that this probe **cannot reproduce**, quoted verbatim.

| # | Claim (verbatim) | Source | What the live page gives |
|---|---|---|---|
| 1 | *"priority scene over a lit **poster** (G-H2a)"* | `9dfaacd` subject line | **No poster exists.** `getComputedStyle(.stage).backgroundImage` has no `url()` layer at 1440 or 390 — five gradients. The commit *body* is accurate (*"a still of the same light as its own CSS background"*); the subject line is not, and the subject is what the board and the changelog carry |
| 2 | *"mean luminance 0.0605 @1440 and 0.0902 @390 against a 0.04 floor"* | `9dfaacd` body / `TC-HERO-FIRSTPAINT-01` | Same method, same slot: **0.0530 @1440** and **0.0812 @390**. Same order, both lower, and **both under the 0.10** this review's acceptance sets. The lane's floor (0.04) is looser than the acceptance it was written against |
| 3 | *"It is safe for LCP because the slot is already lit before any of it runs."* | `9dfaacd` body | True only while script runs. With script blocked **nothing is lit** — 0.0031 — because the slot has no box at all. "Before any of it runs" is doing work the Suspense shell does not permit |
| 4 | *"the atmosphere **is in the first paint**"* | `9dfaacd` subject | The canvas attaches **1374–1477 ms after DCL**, with **LCP already settled at 728–1344 ms**. It is in the first *few* frames after the largest paint, not in the first paint. The mechanism claim (idle gate bypassed) **is** reproducible — proven causally with `requestIdleCallback` neutered |
| 5 | *"the ledger now starts 973 / 865 / 1275 / 959"* | `70a04a8` body | **Reproduced exactly**, all four. Recorded here as a confirmed claim, not a false positive |
| 6 | *"The figure now carries no control at all"* | `70a04a8` body | **Reproduced** — 0 pressables inside `#hero figure` at all four viewports |

---

## 6. One line per other open item

- **G-M3b** — live first-token measurement is owned by its own lane and still pending there; not
  measured in this phase (`8978c2c` is in every build probed, but MiniVic was not exercised).
- **G-S1c** — consolidated; a sweep reviewer is running it in parallel and this review does not
  duplicate that probe. Phase 2 signed off G-S1 (`skills-bench` lit, moving, one canvas).
- **Route shell defect (new, from §3.2)** — `app/loading.tsx` hides the whole route from any
  non-executing client. Filed by the G-H2a lane for its own task; it is the root cause of this
  phase's G-H2a failure and it belongs to a file the hero lane does not own.

---

## 7. Files

```
docs/delivery/evidence/v10-20260905T0515Z/G-REV/e3f0206c/
├── 08-adversarial-review.md            this file
└── captures/
    ├── probeA-hero.mjs / .json         fold inventory, control, keyboard, pointer, reduced motion
    ├── probeB-vitals-firstpaint.mjs / .json   CLS/LCP ×9, JS-blocked, chunk-blocked, gl=force, deferral
    ├── 1440x900-fold.png  1280x800-fold.png  834x1194-fold.png  390x844-fold.png
    ├── 1440-reduced.png  390-reduced.png
    ├── jsblocked-1440.png  jsblocked-390.png          the "LOADING PORTFOLIO" shell
    ├── chunkblocked-1440.png  chunkblocked-390.png    the still, canvas-free
    └── reduced-stage-1440.png  reduced-stage-390.png
```

**Verdict: G-H1 PASS · G-H2a FAIL.** G-H1's correction is real, complete and holds at every
viewport with no regression. G-H2a's mechanism is real; its stated acceptance is not met, at either
width, and the gap is not marginal.
