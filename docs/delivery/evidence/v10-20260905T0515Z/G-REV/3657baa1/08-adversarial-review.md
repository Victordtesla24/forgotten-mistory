# 08 — adversarial review of live `3657baa1` (rev-3657baa1-w2)

**Subject:** <https://forgotten-mistory.web.app/> — the only subject. Nothing below is read from an
implementer's evidence bundle; every number was re-measured on the live URL in this session.
**Reviewer:** `rev-3657baa1-w2`, independent (implemented nothing under review).
**Probed:** 2026-09-06T03:29Z → 03:46Z. **Live `build-commit` at start and at finish: `3657baa1`**
(`curl` at 03:29:13Z and 03:46:22Z; `origin/main` = `3657baa` at both). The build did not move
during this review, so every measurement below is on one SHA. **It moved after:** at ~03:49Z the live
`build-commit` became `e90c4e43` (`479e2b2` G-A3 about-field story + its consolidate merge; non-doc files
`components/sections/About/field.glsl.ts` and `tests/overhaul/scene-about.spec.ts` only). Nothing in
`#hero` changed, so F-1/F-2/F-3/F-4 and F-6 carry over unchanged; only the G-A3 regression row below was
measured on a build that has since been superseded.
**Ancestry (`git merge-base --is-ancestor`):** `9835a950` (hero S2) ✓, `8100d99b` (story tests) ✓,
`a2891fc` (red3) ✓, `26213c4c` (doc fixes) ✓ — all ancestors of `3657baa1`.
**Task:** `artifacts/kanban/tasks/t_w1_rev5.md`. **Baselines:** `G-REV/97e19d07/verdicts.json`,
`G-REV/12cd9123/verdicts.json`.

**Constraints honoured:** read-only (no application file touched); one headless browser at a time,
closed between phases; system Chrome `--no-sandbox --use-gl=swiftshader --disable-lcd-text` from
`/root/forgotten-mistory`; no Hermes; no secrets read or printed; ports 5599/8080 untouched (no local
server used at all — the live origin is the subject).

---

## FAILURES FIRST

### F-1 — GRADED FAIL · the H1's descender leaves the plate and is washed out, at every viewport, on both paths

The name is set in `#f6f6f6` (L = 0.9216) on a plate of `rgba(10, 10, 10, 0.9)`. Under the glyph ink
the ground measures L 0.0123–0.0144, i.e. **median local contrast 15.25–15.6:1** — the name is
legible. But the plate's bottom edge is cut at the baseline, so the **descender of the "p" in
"Deshpande" falls off the plate onto the near-white plane**:

| viewport | path | washed ink | share of the name's ink | worst local contrast | ground under the worst pixel | washed blob (one connected run) |
|---|---|---|---|---|---|---|
| 1440×900 | gl | 204 px | 0.69 % | **1.26:1** | L 0.7231 | 34×6 px at (857, 640) |
| 1440×900 | still | 204 px | 0.70 % | **1.55:1** | L 0.5776 | 34×6 px at (857, 640) |
| 1280×800 | gl | 203 px | 0.77 % | **1.31:1** | L 0.6939 | 32×7 px at (784, 565) |
| 1280×800 | still | 203 px | 0.77 % | **1.55:1** | L 0.5776 | 32×7 px at (784, 565) |
| 834×1194 | gl | 84 px | 0.78 % | **1.14:1** | L 0.7991 | 21×4 px at (511, 913) |
| 834×1194 | still | 84 px | 0.78 % | **1.32:1** | L 0.6867 | 21×4 px at (511, 913) |
| 390×844 | gl | 64 px | 0.98 % | **1.10:1** | L 0.8308 | 15×8 px at (160, 596) |
| 390×844 | still | 64 px | 0.99 % | **1.34:1** | L 0.6724 | 15×8 px at (160, 596) |

Every washed pixel is one connected blob (largest-blob px == total washed px in all eight runs), and
in all eight the blob starts **exactly at the plate's bottom edge**: plate bottom = 639.8 / 565.3 /
912.7 / 595.9 CSS px at 1440 / 1280 / 834 / 390; blob top = 640 / 565 / 913 / 596. This is the "p"
descender, not a shader shaft, and it is present on the **reduced-motion still** path where the
frame-to-frame drift I measured is ≤ 0.017 L — so it is not a capture artefact.

*Severity, stated honestly:* the reader can read the name (99.0–99.3 % of its ink sits at ≥ 4.5:1).
What fails is the contract: `HERO-SETPIECE-v3` §7 asks for ≥ 4.5:1 for **every glyph over the plane**,
and WCAG 1.4.3 is per-text, not per-average. A live reader sees the tail of the "p" vanish.
*Evidence:* `05-h1-inkmask.json`, `h1-1440x900-gl-shipped.png` (the tail below the plate is visible),
`h1-390x844-still-washzone.png` (ground bright enough to wash `#f6f6f6` painted red).

### F-2 — GRADED FAIL by the task's own rule · glyph-ink-box contrast is under 4.5:1 at six of eight

The task grades: *contrast of the glyph ink against the P95 luminance under the glyph ink box*.
Measured on the true glyph-ink bounding box (α ≥ 0.5 coverage, recovered per pixel — method below):

| viewport | path | P95 ground under glyph ink box | ratio | verdict |
|---|---|---|---|---|
| 1440×900 | gl | 0.0144 | 15.08:1 | PASS |
| 1440×900 | still | 0.0137 | 15.25:1 | PASS |
| 1280×800 | gl | 0.5906 | **1.52:1** | FAIL |
| 1280×800 | still | 0.4969 | **1.78:1** | FAIL |
| 834×1194 | gl | 0.6654 | **1.36:1** | FAIL |
| 834×1194 | still | 0.5149 | **1.72:1** | FAIL |
| 390×844 | gl | 0.8070 | **1.13:1** | FAIL |
| 390×844 | still | 0.5776 | **1.55:1** | FAIL |

The two 1440 rows pass only because the same bright sliver (the strip of plane between the plate's
bottom edge and the descender's tip) is under 5 % of the larger box there. F-1 and F-2 are one defect
measured two ways: **the plate does not cover the type it is there to carry.**

### F-3 — TC-HERO-A11Y-01 red 8/8 independently reproduced (line-box measure)

| viewport | path | P95 ground under the H1 line box | ratio |
|---|---|---|---|
| 1440×900 | gl / still | 0.8070 / 0.6939 | 1.13:1 / 1.31:1 |
| 1280×800 | gl / still | 0.8070 / 0.6795 | 1.13:1 / 1.33:1 |
| 834×1194 | gl / still | 0.7529 / 0.6584 | 1.21:1 / 1.37:1 |
| 390×844 | gl / still | 0.8070 / 0.5647 | 1.13:1 / 1.58:1 |

The implementer's report ("P95 ground 0.83 vs glyph 0.92 under the font-box rect") reproduces: my
worst line-box P95 is 0.8070. **Cause, measured:** the H1 line box is 180 / 171 / 111 / 136 px tall
against a plate 137.8 / 130.4 / 84.9 / 108 px tall, so 14–24 % of the line box is leading that hangs
off the plate over a near-white plane (`03-h1-washzone.json`: wash-ground share of the line box =
19.30 / 23.39 / 23.54 / 14.84 % on the gl path). The spec's rect therefore measures plane the type
never sits on **as well as** the real descender defect. The test is red for one honest reason (F-1)
and one instrument reason (leading), and both are fixable in S3 (plate/baseline geometry).

### F-4 — SPD floor breached on the reduced-motion path at 390 (PLANE-01 min, not just the ship margin)

`SPD_MIN = 0.75` (`scripts/validate/hero_plane_dominance.mjs:84`). Measured with the instrument's own
`preparePage` + `measureFold` against live:

| viewport | gl | still | ≥ 0.75 | ≥ 0.78 (ship) |
|---|---|---|---|---|
| 1440×900 | 0.8257 | 0.8066 | ✓ ✓ | ✓ ✓ |
| 1280×800 | **0.7788** | **0.7586** | ✓ ✓ | ✗ ✗ |
| 834×1194 | 0.8756 | 0.8542 | ✓ ✓ | ✓ ✓ |
| 390×844 | 0.7828 | **0.7153** | ✓ **✗** | ✓ ✗ |

PLANE-02 lit density (floor 0.045) is clear everywhere: 0.4011 / 0.3177 / 0.3873 / 0.3116 / 0.5327 /
0.3151 / 0.3950 / 0.2635. Ground chain roots at `div.Hero_plane__iCeB5` on all eight runs, so the
declared plane (D-4) is what is being measured.

### F-5 — FALSE POSITIVE in the S2 implementer's report

> "SPD ≥ 0.78 at 1440/1280/834 but 0.7153 at 390 (still)" — t_w1_rev5 dispatch, quoting the S2 lane.

Contradicted on live `3657baa1`: **1280×800 = 0.7788 (gl) and 0.7586 (still)** — both below 0.78, one
of them by 2.1 points. The 390 number is honest (0.7153, reproduced exactly). Whatever build the lane
measured, the claim does not hold for the build readers are served.

### F-6 — TC-BOT-14 still FAIL at 1440 (report only, fix in flight)

Open MiniVic panel (x 984–1416, y 360–812) overlaps the H1 glyph run (x 96–1215.2, y 480.05–660.05)
by **231.2 × 180 px**; min horizontal gap **−231.2 px** against the contract's ≥ +16 px. Identical to
rev-97e19d07's measurement, so the defect survived S2 untouched. `07-regression.json` → `TC_BOT_14`,
screenshot `reg-1440-panel-open.png`.

---

## What the graded question actually answers

**Can a reader read the name on the plane?** Yes — at 1440, 1280, 834 and 390, on `?gl=force` and on
the reduced-motion still. Near-white serif on a 90 %-opaque near-black plate: median local contrast
15.25–15.6:1 over 6,449–29,366 core-ink pixels per run. The failure is bounded and specific: one
descender per viewport, 64–204 px, at 1.10–1.55:1. Screenshots a human can check:
`fold-1440x900-gl-A-shipped.png`, `fold-390x844-still-A-shipped.png`, `h1-*-shipped.png`.

### Method (so this is re-derivable, not trusted)

1. `preparePage` / `measureFold` / `decodeLuma` / `relativeLuminance` / `percentile` / `planeDominance`
   are imported from `scripts/validate/hero_plane_dominance.mjs` — the same instrument the specs use,
   pointed at the live origin (`00-hero-fold-probe.mjs`, `04-h1-inkmask-probe.mjs`).
2. Three frames per run: **A** as shipped; **C** with `#hero h1` ink forced to `#ff0000`; **B** with it
   forced to `transparent`. The page is greyscale (max chroma 0 over every fold capture), so
   `C = α·(255,0,0) + (1−α)·(v,v,v)` gives `α = 1 − G_C / G_B` — exact coverage **including over
   near-white ground**, which a plain A-vs-B difference cannot resolve (`#f6f6f6` and a 0.80 L ground
   are 16/255 apart). Pass 1's photometric α is superseded by this for the ink box; both agree on the
   per-pixel verdict (204/203/84/64 washed px in both passes).
3. Layout never changes (only `color`), so `window.__heroCopyGuard` is identical before and after —
   verified per run in `01-hero-fold.json` (`copy_guard_before` vs `copy_guard_after_hide`).
4. Shader drift between frames was measured, not assumed: mean |ΔL| 0.013–0.069 (gl), 0.000 (still);
   the still path is the drift-free control and shows the same defect.

---

## Interim, recorded not graded (S3 typography, S4 parity/gate still to land)

| clause | 1440 | 1280 | 834 | 390 | reading |
|---|---|---|---|---|---|
| SET-01 fold text blocks ≤ 3 | 2 | 2 | 2 | 2 | H1 + statement (brand mark is nav, outside `#hero`) |
| SET-01 CTA groups = 1, strays = 0 | 1 / 0 | 1 / 0 | 1 / 0 | 1 / 0 | `div[data-testid=hero-actions]` |
| SET-02 ledger top ≥ innerHeight | 900 ≥ 900 | 800 ≥ 800 | 1194 ≥ 1194 | 844 ≥ 844 | passes with **zero** margin at all four |
| SET-03 figure ⊂ plane, ≤ 846 px | 846.0 ✓ | 800.0 ✓ | 750.6 ✓ | 366.0 ✓ | natural 1480×826 on all |
| GL-01/02 canvases | 1 / 0 | 1 / 0 | 1 / 0 | 1 / 0 | gl mounts one, still mounts none |
| PERF-03 nothing plays | 0 media requests, `<video preload=none paused currentTime=0>` | idem | idem | idem | across all 8 runs |
| PAL-01 fold max chroma | 0 | 0 | 0 | 0 | both paths |

LCP/CLS on live, default path, this VPS through SwiftShader: **1440 → LCP 972 ms, CLS 0**;
**390 → LCP 772 ms, CLS 0**.

---

## Regression table (S-3) — re-run on `3657baa1`

| gap | verdict | evidence measured this session |
|---|---|---|
| G-H6 hero monochrome | **PASS** | max chroma 0 over every fold capture, 8/8 (`01-hero-fold.json.max_chroma_fold`) |
| G-C1 identical CTA hrefs | **PASS** | 2 `mailto:` "20-minute call" hrefs in served HTML, 314 chars each, byte-identical |
| G-A3 ten sectors | **PASS** | `#about` under `?gl=force`: 1 canvas, dimensions 01–10 all present, h2 "Ten dimensions, answered" |
| G-MV1 first-fold click @390 | **PASS** | launcher (207.6, 776) 158.4×44, inside first fold, `elementFromPoint` → `SPAN.minivic-launcher__pill`, hit-is-self, real click opened a 342×396 panel in 3,173 ms |
| G-OG1 | **PASS** | `/assets/og-image.png` 200, 2400×1260, 209,035 B, max chroma 0 over 3,024,000 px |
| MiniVic disclosure visible | **PASS** | "MiniVic · synthetic" visible and unclipped at 1440 and at 390; `AI clone` 0 hits in served HTML |
| scene-7 band present | **PASS (presence only)** | `[data-scene="career-descent"]` present, 1 canvas at 1440 under `?gl=force`. Band **height not re-derived** — my selector resolved to the scene box (900 px); rev-97e19d07's 160vh figure is neither confirmed nor contradicted here |
| `?gl=off` → 0 canvases | **PASS** | 0 canvases in all six sections and 0 page-wide; H1 visible; 0 pageerrors (`07-regression.json.gl_off`) |
| `/api/tts` | **NOT RE-MEASURED — cost gate** | `GET /api/tts` → 405 (route alive and rewritten to `elevenLabsTts`). A POST is a paid ElevenLabs call; CLAUDE.md requires asking first and this run is non-interactive, so it was **not** issued. rev-97e19d07's POST 200 / 30,973 B stands unreproduced by me |
| TC-BOT-14 | **FAIL (report only)** | F-6 above |
| pageerrors / console errors | **PASS** | 0 pageerrors and 0 console **errors** across 11 live page visits; the only console output was 4 SwiftShader `GPU stall due to ReadPixels` performance **warnings** at 1440 gl |

### Observation, not a gate

`#about` carries gold body text — `rgb(160,134,64)` on "38 public repositories · ATO evidence harness ·
ANZ platform migrations" (`app/data/portfolio/about.ts:65`, painted through `var(--gold)` at
`components/sections/About/About.module.css:410`), 1,545 chromatic pixels in a 519×10 strip
(`chroma-about-crop.png`). It is a sourced-claim line, so it is inside the palette rule's intent, but
it is gold used as a *text colour for a list*, which is wider than "caliper jaws, the measured mark,
live repository URLs". Flagging it for the Owner's palette call; the hero fold itself is chroma 0.

## False positives named (including candidates I rejected)

1. **"The H1 fails contrast, so the name is unreadable."** Rejected. The ground under the ink is L
   0.0123–0.0144; median local contrast 15.25–15.6:1. The failing P95 numbers come from plane pixels
   *inside the rect but not under the ink* — plus one real descender.
2. **"Pass 1's 110 washed pixels at 1440."** My own first-pass number, superseded by the red-channel
   coverage mask (204 px). Photometric α is blind where ink and ground are 16/255 apart — exactly the
   wash case — so pass 1 undercounted. Recorded here rather than quietly dropped (§10.3).
3. **"Chroma 125 on the About screen is a monochrome regression."** Rejected: it is the `--gold`
   sourced-evidence line, sampled and read (see Observation).
4. **"`scene-7` band shrank from 160vh to 100vh."** Not claimed: my band selector resolved to the
   scene box, not the sticky band rev-97e19d07 measured. Coverage gap, stated.

## Coverage — what was not covered

`/api/tts` POST (cost gate, above); `/api/chat` streaming behaviour and G-M4 first-token timing (not in
this task's scope, and rev-97e19d07's G-M4 **FAIL** is untouched by anything in S2); the full
Playwright battery (this review measures the live origin only, per the task); the greeting-mp3 drift
item, which remains assigned-OPEN from rev-97e19d07.

**R3: OPEN.**
