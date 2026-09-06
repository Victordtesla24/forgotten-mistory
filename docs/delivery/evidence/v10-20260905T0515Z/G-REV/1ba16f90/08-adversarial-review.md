# G-REV / 1ba16f90 — independent adversarial review (WAVE-2 REVIEW 6)

**Reviewer** `rev-1ba16f90-w2` · read-only · implemented nothing under review
**Subject** `https://forgotten-mistory.web.app/` — the live origin, nothing else
**Probed** 2026-09-06T04:00Z – 04:26Z · VPS srv1356245 · system Chrome, `--no-sandbox`, one browser at a time
**Task** `artifacts/kanban/tasks/t_w1_rev6.md`

## The live build moved twice during this review. Every number says which SHA it is on.

| window | live `build-commit` | what it is | what was measured on it |
|---|---|---|---|
| 04:00–04:08Z | **`1ba16f90`** | `consolidate: merge worktree-w2-x2f5` — carries `479e2b2` (About G-A3 light) and `c29b55e` (scene-7 depth) | **G-A3 story clause, all four states** (`01-about-story.json`) |
| ~04:10–04:18Z | **`b9f5195e`** | `ef2979a revert(about): back out the G-A3 state-gate light change — it costs the ABOUT coverage floor` | scene 7 (unaffected: only `field.glsl.ts` differs); hero pre-S3 at 1440/1280/834 |
| 04:18Z → now | **`83f4b208`** | `1e1cb39 feat(hero) … G-H1 S3 (g2h1v3-03)` — **hero S3 landed mid-review** | **hero, all 4 viewports × 2 paths** (`06-hero-postS3.json`); the whole regression table |

Ancestry verified with `git merge-base --is-ancestor`: `c29b55e1` (x2s2) and `3657baa1` are ancestors of `1ba16f90`; `worktree-w2-h1s3` is **not** an ancestor of `1ba16f90` but **is** an ancestor of `83f4b208`.

---

# FAILURES FIRST

## F-1 — the H1 descender still leaves the plate. 8 of 8, after S3. (GRADED, FAIL)

Measured on **`83f4b208`** (post-S3), 4 viewports × 2 paths, `06-hero-postS3.json`.
Coverage recovered from a red-ink frame against an ink-transparent frame (`α = 1 − G_C/G_B`), so ink over near-white ground is still separable; contrast is `contrast(L(#f6f6f6), L(ground under that pixel))`.

Gate: **0 px of core ink outside the plate rect.**

| viewport / path | core ink px | ink **off** the plate | all of it **below** the plate | worst | median | box |
|---|---|---|---|---|---|---|
| 1440×900 gl | 21 335 | **145** | 145 | 1.28 | 1.32 | 29×5 @ (746, 640) |
| 1440×900 still | 21 306 | **145** | 145 | 1.26 | 1.31 | 29×5 @ (746, 640) |
| 1280×800 gl | 17 750 | **130** | 130 | 1.19 | 1.22 | 26×5 @ (658, 566) |
| 1280×800 still | 17 722 | **130** | 130 | 1.32 | 1.34 | 26×5 @ (658, 566) |
| 834×1194 gl | 7 097 | **57** | 57 | 1.22 | 1.24 | 17×4 @ (429, 913) |
| 834×1194 still | 7 091 | **57** | 57 | 1.23 | 1.26 | 17×4 @ (429, 913) |
| 390×844 gl | 4 979 | **42** | 42 | 1.10 | 1.13 | 13×6 @ (142, 596) |
| 390×844 still | 4 950 | **42** | 42 | 1.29 | 1.33 | 13×6 @ (142, 596) |

The plate is `h1.Hero_name__vovn8`, `rgba(10,10,10,0.9)`. At 1440 it is `y 522 … 640`; the off-plate blob starts at `y = 640` — **exactly the plate's bottom edge** — and the same holds at 1280 (`458+108 = 566`), 834 (`843+70 = 913`) and 390 (`502+94 = 596`). Every one of those pixels is below 4.5:1.

**S3 shrank the blob but did not close it:** 204 → 145 (1440), 192 → 130 (1280), 84 → 57 (834), 64 → 42 (390) against `b9f5195e`. F-1 carries forward.

## F-2 — G-A3's story clause fails on the screen the reader arrives on, at 1440. (GRADED, FAIL)

Measured on **`1ba16f90`** — the SHA that carried the fix — with `#about header`, `#about ol` and `#about [class*="instrument"]` hidden, so the light is judged alone (`01-about-story.json`, captures `a3-1440x900-at-rest-field-alone.png`).

| state | seams ≥ 12% | answered/open (ring) | STORY-02: role-side max vs candidate mean | verdict |
|---|---|---|---|---|
| **1440, at rest (`data-axis = -1`)** | **5/10** (needs ≥ 9) | **1.632** (floor 1.60) | role max **0.3865** vs candidate mean 0.3565 → **8.4 % _above_** (needs ≥ 15 % below) | **FAIL** |
| 1440, dimension 4 (`axis = 3`) | 10/10 | 8.138 | 84.7 % below | PASS |
| 390, at rest | 10/10 | 7.561 | 82.3 % below | PASS |
| 390, dimension 1 | 10/10 | 3.244 | 53.5 % below | PASS |

Per-sector at 1440 at rest: `0.159 0.4167 0.5234 0.3676 0.5505 0.0168 0.3865 0.0888 0.2522 0.3893`. Sector 7 (`Location Match`, role-side) is the **third-brightest of the ten**; sector 5 (`Culture Fit`, answered) is at 0.0888. The light still tracks position on the plane, not `about.ts`.

**The 1.632 does not hold still.** Five independent captures of the same state (`03-scene7.json → about_1440_at_rest_confirmation`, 6 s settle, two captures 2 s apart):

| capture | seams ≥ 12% | ratio | role max vs candidate mean |
|---|---|---|---|
| phase A | 5/10 | 1.632 | −8.4 % (above) |
| confirm run 1, t₀ | 5/10 | **1.269** | −40.7 % (above) |
| confirm run 1, t₀+2 s | **3/10** | **1.389** | −30.9 % (above) |

Four of five readings are **below** the 1.60 floor. The one that clears it clears it by 0.032.

**The fan at 1440 at rest is inverted:** answered 0.0401, open 0.1179 → **0.34**. The light outside the bezel — the light a reader actually sees, since the bezel covers the ring — says the *open* dimensions are the bright ones.

**Independent corroboration from the implementer's own re-run.** `docs/delivery/evidence/…/W2-X2/t_w2_x2f5/04-verification.log` at `b9f5195e` records `TC-SCENE-ABOUT-10 … 1440x900, at rest` **✘ red**: `only 6 of 10 sector boundaries show a 12% luminance step`, ratio 1.412.

## F-3 — the change this review was dispatched to grade has been reverted on live. (GRADED)

`ef2979a revert(about): back out the G-A3 state-gate light change — it costs the ABOUT coverage floor`, shipped as `b9f5195e` at ~04:10Z.

```
git diff 3657baa1:components/sections/About/field.glsl.ts b9f5195e:components/sections/About/field.glsl.ts
(no output)
```

`field.glsl.ts` on live is **byte-identical to `3657baa1`** — the pre-x2f5 shader. G-A3's story clause therefore has **no fix on live at all**; the state that failed on `1ba16f90` is the state that is shipping. The `x2f5` slice is not "landed with one open sub-claim"; it is out.

## F-4 — SPD misses the 0.75 floor at 390 reduced-motion. (GRADED, FAIL)

`83f4b208`, `06-hero-postS3.json`. Ground chain `div.Hero_plane__iCeB5` (declared plane, D-4) on all 8 runs.

| viewport | gl | still |
|---|---|---|
| 1440×900 | 0.8623 | 0.8404 |
| 1280×800 | 0.8256 | 0.8051 |
| 834×1194 | 0.8898 | 0.8750 |
| 390×844 | 0.8104 | **0.7487** ✘ (floor 0.75) |

S3 lifted every figure (390-still 0.7153 → 0.7487, 1440-gl 0.8288 → 0.8623) and put 7 of 8 over the `0.78` ship bar. 390 reduced-motion is still the one red cell — **0.0013 short**.

## F-5 — TC-BOT-14: the open panel still lands on the H1. (GRADED, FAIL)

`83f4b208`, `05-hero-regression.json`. Panel `x 984 … 1416, y 360 … 812`; H1 glyph run `x 96 … 1051, y 503 … 657`. **Horizontal gap −67 px** against a contract of ≥ +16 px; the rects overlap. S3's narrower H1 improved this from −231.2 px (`3657baa1`) but did not clear it.

## F-6 — scene 7: the strata are visible, their spacing is not proportional to the roles. (INTERIM — recorded, not graded)

`03-scene7.json`, `s7-1440-t025.png`. My own detector: local minima of the row profile (σ 5) that sit ≥ 0.02 below their flanks.

- **Edges: 10** at both scroll positions (contract ≥ 8) — **met**.
- Edge rows `119 148 394 424 460 494 644 686 767 794` → gaps `29 246 30 36 34 150 42 81 27`.
- Role durations, newest first: `0.5 0.667 7.75 0.833 1 0.917 3.25 1.25` y. The section's own axis ticks (`now/2025/2020/2015/2010` at y `101/174/392/610/829`) give **43.7 px/year**, predicting thicknesses `22 29 338 36 44 40 142 55`.
- **Spearman ρ, best of four alignments = 0.214** (offset 0 newest-first −0.071, oldest-first 0.214; offset 1: −0.143 / 0.119). Contract asks **≥ 0.9**.

The two long roles *are* there — a 246 px band and a 150 px band against 338 and 142 predicted — but they are not where a linear time axis puts them and they are ~27 % short. The picture says "two long roles and six short ones"; it does not yet say *which* role is *how* long.

## F-7 — `t_w2_x2f5` shipped on a truncated verification log. (GRADED, process)

`docs/delivery/evidence/…/W2-X2/t_w2_x2f5/04-verification.log` **as committed in `1ba16f90`** is **7 lines**: the header `Running 18 tests using 1 worker`, then only rows 1 and 2 — both from `tests/a11y/text-contrast.spec.ts` — and **no summary line**. Not one of the `scene-about.spec.ts` cases the slice authored appears in it. `1ba16f90` shipped to production on that log. The same file at `b9f5195e` is complete, and shows the 1440-at-rest case **red**.

## F-8 — "caption-only over the canvas" is not what is over the canvas. (INTERIM)

`03-scene7.json → text_over_stage`, 1440 `?gl=force`. Stage box = the canvas, `1392×900` — the sticky stage fills the viewport, so **10 text nodes intersect it**:

- the scene's own: the caption (1) + five axis ticks `now/2025/2020/2015/2010` (5) = **6**
- persistent chrome: `VIKRAM.`, `Download CV`, `Menu`, `Ask Mini Vic` = 4

`TC-STORY-DESCENT-02` as written ("no text node intersects the stage box") cannot pass while the stage is 100 vh and the site has persistent chrome. Recorded as a **contract defect plus a real overlap**, not graded — the ticks are legitimately part of the instrument, but "caption-only" is not the live picture.

---

# PASSES, with the numbers

## G-A3 — everything except the 1440 at-rest screen

| clause | measured | gate | verdict |
|---|---|---|---|
| ten sectors countable | 10/10 on the ring in all four states | 10 | PASS |
| plane dominance | **0.7683** (mass 37 240.5 with field vs 8 628.3 without, over the `[data-axis]` clip, ground `--ink-900` L 0.0030) | ≥ 0.75 | PASS |
| dial ≤ `--mist-400` | brightest dial stroke **L 0.2789**; `--mist-400` `rgb(144,144,144)` **L 0.2789** | ≤ | PASS (equal) |
| gold in the field | **0 px** in ring and fan, all four states | 0 | PASS |
| about contrast | lede 13.21 · name 19.43 · answer 13.21 · evidence 9.19 · index 6.58 · kicker 6.58 | ≥ 4.5 | PASS |
| reduced motion | 0 canvases, 10 items, `Ten dimensions, answered`, SVG present, 0 pageerrors | — | PASS |
| no WebGL (`?gl=off`) | 0 canvases in `#about` and 0 page-wide, 10 items, 0 pageerrors | — | PASS |

## Scene 7 — INTERIM

| clause | measured | verdict |
|---|---|---|
| band present | `[data-scene="career-descent"]`, **1 canvas**, scene 1392×900, band `[data-descent-band]` 1392×**1440** = **1.60 vh** | PASS (matches the 160 vh contract) |
| spans legible as bands | **10 edges** ≥ 8 | PASS |
| spacing ∝ duration | ρ **0.214** vs ≥ 0.9 | **MISS** (F-6) |
| parallax | over a 270 px scroll (t 0.25 → 0.75), separating the profile by spatial frequency: far/low **+17 rows** (r 0.47), strata/mid **−14** (r 0.62), near/high **−15** (r 0.61) — **three rates, one of them opposite in sign** | PASS — real depth, not a gradient |
| pageerrors | **0**, console errors **0** | PASS |

**Frame time — recorded, never graded, and never called a frame rate.**
`median rAF 50.00 ms, p95 116.6 ms, 145 samples`, renderer
`Google Inc. (Google) / ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`.
This is **Tier A** (SIGNATURE-SCENES-v2 §6.2). It may be reported as *"median rAF 50 ms, software rasteriser"* and as nothing else. **R2's 60 fps clause remains unproven**: Tier B has never executed and Tier C does not exist.

## Hero — S3 delivered the typography contract exactly

`83f4b208`, `06-hero-postS3.json`:

| case | 1440 | 1280 | 834 | 390 | gate | verdict |
|---|---|---|---|---|---|---|
| **TYPE-01** H1 px / brand px | 112/20 = **5.60** | 102.4/20 = **5.12** | 66.72/20 = **3.34** | 52/18 = **2.89** | 2.5 – 6.0 | **PASS 4/4** |
| **TYPE-02** H1 lines | 1 | 1 | 1 | 2 | 1 at ≥ 720, 2 below | **PASS 4/4** |
| **A11Y-02** CTA targets | 185×48 · 156×48 | same | same | 181×48 · 153×48 | ≥ 48×48 | **PASS 8/8** |
| **SET-02** proof top vs innerHeight | 900 ≥ 900 | 800 ≥ 800 | 1194 ≥ 1194 | 844 ≥ 844 | below the fold | PASS — **zero margin at all four** |
| CTA groups / canvases | 1 / 1 gl, 0 still | 1 | 1 | 1 | 1 group | PASS |
| pageerrors | 0 | 0 | 0 | 0 | 0 | PASS 8/8 |

Against `b9f5195e` the ratio was **7.29 / 6.90 / 4.56 / 2.89** — 1440 and 1280 were **outside** the 2.5–6.0 band before S3. S3 fixed that. It did not fix F-1.

## Regression table — `83f4b208`

| row | measured | verdict |
|---|---|---|
| **G-H6** hero monochrome | max sRGB chroma **0** and **0** gold-ish px over all 8 post-S3 fold captures | PASS |
| **G-C1** identical hrefs | 2 `mailto` "20-minute call" hrefs, **1 distinct**, 305 chars | PASS |
| **G-MV1** 390 first-fold click | pill `(208, 776) 158×44`, `display: flex`, inside the first fold, `elementFromPoint → SPAN.minivic-launcher__pill`, **hit-is-self**, real click opened a **342×396** panel | **PASS — the `12cd9123` FAIL is closed** |
| **G-OG1** | `/assets/og-image.png` **200**, 2400×1260, 209 035 B, max chroma **0** | PASS |
| MiniVic disclosure | served HTML: `synthetic stand-in for Vikram` ×1; `AI clone` **×0** | PASS |
| **`?gl=off`** | **0** canvases page-wide after walking all six sections, H1 visible, 0 pageerrors | PASS |
| **TC-BOT-14** | gap **−67 px** vs ≥ +16 | **FAIL** (F-5) |
| pageerrors / console errors | **0 / 0** across every live visit in this review | PASS |
| **LCP / CLS** live | 1440: **1408 ms / 0** · 390: **1260 ms / 0** | PASS (< 2500 ms, < 0.05) |
| G-A3 presence | 1 canvas, 10 numbered, `Ten dimensions, answered`, `data-axis = -1` | PASS |

---

# False positives I found and rejected

1. **"The MiniVic disclosure is gone."** My in-page `innerText` probe returned `synthetic: false` — it read the page with the panel closed. The served HTML carries `synthetic stand-in for Vikram` once and `AI clone` zero times. Not a regression; my instrument's fault (self-reported).
2. **"Scene 7 has no parallax."** My first instrument split the canvas into thirds and got `−14 / −15 / −15` — a 1 px spread, at the noise floor. Separating by spatial frequency instead gives `+17 / −14 / −15`, three rates including a sign flip. The thirds measurement was the weaker instrument, not evidence of absence.
3. **"The H1 is unreadable."** 21 335 / 17 750 / 7 097 / 4 979 core-ink px per run; only 145 / 130 / 57 / 42 of them are off the plate. The name reads. The descender does not.
4. **"Hero S3 has not landed."** It had not at 04:00Z; it landed at ~04:18Z as `83f4b208`, mid-review. The hero table was re-run from scratch on it.
5. **"G-A3 fails."** It passes at 390 in both states and at 1440 with a dimension indexed. Exactly one screen fails — 1440 at rest — and that is the screen a reader arrives on.
6. **"Plane dominance regressed below 0.75 in `#about`."** 0.7683 — it clears, by 1.8 points.

# Not covered

- `/api/tts` POST — paid ElevenLabs call, cost gate, non-interactive run. Not issued.
- `/api/chat` streaming and G-M4 first-token timing — out of this task's scope.
- Full Playwright battery — this task measures the live origin only.
- Tier B / Tier C fps — no GPU runner is registered and the `?fps=1` HUD does not exist.

# Standing status

- **R2** — OPEN. 60 fps is unproven: the only instrument that ran is SwiftShader (median rAF 50 ms), and SIGNATURE-SCENES-v2 §6.2's standing rule forbids calling that 60 fps.
- **R3** — OPEN.
- **R5** — OPEN (carried from `12cd9123`: all three rungs are 24 fps).

---

## Artifacts

`00-about-story-probe.mjs` · `01-about-story.json` · `02-scene7-probe.mjs` · `03-scene7.json` ·
`04-hero-regression-probe.mjs` · `05-hero-regression.json` · `06-hero-postS3.json` · `verdicts.json` ·
`a3-{1440x900,390x844}-{at-rest,dimension-N}-field-alone.png` · `a3-1440-at-rest-confirm-{0,1}.png` ·
`a3-1440-{with,without}-field.png` · `a3-1440-dial-alone.png` · `a3-{reduced-motion,no-gl}-1440.png` ·
`s7-1440-t{025,075}.png` · `fold-{1440x900,1280x800,834x1194,390x844}-{gl,still}.png` · `reg-390-minivic-after-click.png`
