# t_h2_01 — SPD instrument: luminance-weighted plane dominance, baseline red

**Role:** tester (docs/prompt.md §5) · **Brief:** `docs/architecture/HERO-FOLD-v2.md` §3 / §10 ·
**Board:** `artifacts/kanban/tasks/t_h2_01.md` (HERO-TASKS `g2h1-01-spd-instrument`) ·
**Branch:** `worktree-wf_b87d138f-c96-2` · **Run:** 2026-09-05 15:19Z → 15:40Z.

The task file names this lane's evidence folder `G2H1/01/` with a `02-tests-failing.log`;
the host's later RECTIFY layout names it `<TASK-ID>/`. This folder is the latter, and
`02-baseline-red.log` is that "tests failing" log.

## What landed

| file | role |
|---|---|
| `scripts/validate/hero_plane_dominance.mjs` | the shared measurement — importable, and a CLI (`--base <url> [--out json] [--shots dir]`) |
| `tests/overhaul/hero-plane-dominance.spec.ts` | TC-HERO-PLANE-01 (SPD ≥ 0.75, ship 0.78) and TC-HERO-PLANE-02 (Σ_fold m /(W·H) ≥ 0.045), 4 widths × 2 paths = 16 cases |

**No production file changed.** `git diff --name-only origin/main...HEAD` shows only
`scripts/validate/`, `tests/overhaul/` and this folder.

## The definition, as implemented

Capture at `deviceScaleFactor: 1` with `--disable-lcd-text`, `W × H` = viewport.
`L` = WCAG relative luminance per pixel. `G` = 10th-percentile `L` of the fold, from the
capture (never from a declared colour). `m = max(0, L − G)`. Ink set `I`, read from the live
DOM: every text-leaf **line box** (`Range.getClientRects()` of the element's own text nodes;
element box as fallback), every `img` / `video` / `svg` rect, every element whose computed
`background-color` alpha ≥ 0.5 — each dilated 8 px and clipped to the fold. `P = fold ∖ I`.

    SPD = Σ_P m / Σ_fold m

One reading the brief leaves implicit is made explicit in the module header: `body`, `#hero`
and every ancestor of the stage slot paint an opaque ink ground, so a literal rule (c) puts the
whole fold in `I` and SPD is identically 0. The **ground chain** — the stage slot
`[data-scene="hero-atmosphere"]`, its ancestors and its descendants (canvas, poster still) —
is the plane by definition and never ink. Everything else in the viewport is: the fixed nav
wordmark and menu, the MiniVic launcher, the plates, the type, the photograph. The chain and
every rect are printed in every report so the derivation is reproducible, not trusted.

## HERO_PLANE_GATE

The spec is armed by `HERO_PLANE_GATE=1`. Unset, all 16 cases `test.skip` with the reason
printed (`01-gate-unarmed-skips.log`: 16 skipped, exit 0) so the shared battery stays green
while the baseline is red by design. Armed, every case runs at the real thresholds — 0.75 and
0.045 exactly, pinned by assertion against the module's constants. The flag is to be removed
by the lane that brings every case over 0.78; lowering a threshold is a violation.

```bash
# armed, local build on this lane's port
HERO_PLANE_GATE=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:5636 \
  npx playwright test tests/overhaul/hero-plane-dominance.spec.ts --workers=1
# standalone, any served build
node scripts/validate/hero_plane_dominance.mjs --base https://forgotten-mistory.web.app --shots <dir>
```

## Baseline — measured, not predicted

### Local static build (`02-baseline-red.log`, worktree at `aa3a719`, served on :5636)

| viewport | path | G | Σ_fold m | Σ_P m | **SPD** | PLANE-1 ≥ 0.75 | Σ_fold m/(W·H) | PLANE-2 ≥ 0.045 | ink rects · cover |
|---|---|---|---|---|---|---|---|---|---|
| 1440×900 | `/?gl=force` | 0.0091 | 220054 | 134045 | **0.6091** | FAIL | 0.1698 | PASS | 27 · 36.5% |
| 1440×900 | still | 0.0060 | — | — | **0.4109** | FAIL | 0.1044 | PASS | 27 · 36.5% |
| 1280×800 | `/?gl=force` | 0.0091 | — | — | **0.5928** | FAIL | 0.1720 | PASS | 26 · 39.5% |
| 1280×800 | still | 0.0060 | — | — | **0.3730** | FAIL | 0.1015 | PASS | 26 · 39.5% |
| 834×1194 | `/?gl=force` | 0.0091 | — | — | **0.8252** | PASS (ship PASS) | 0.2689 | PASS | 29 · 25.7% |
| 834×1194 | still | 0.0052 | — | — | **0.4881** | FAIL | 0.0718 | PASS | 29 · 25.7% |
| 390×844 | `/?gl=force` | 0.0080 | — | — | **0.2641** | FAIL | 0.2343 | PASS | 32 · 81.1% |
| 390×844 | still | 0.0040 | — | — | **0.0559** | FAIL | 0.1157 | PASS | 32 · 81.1% |

Σ columns for every row are in the log itself (each case prints all four terms); the first row
is copied here as the worked example. Playwright tally: **7 failed, 9 passed, exit 1** — every
TC-HERO-PLANE-02 passes, TC-HERO-PLANE-01 fails on 7 of 8 cases. The second capture of the
`gl` path in each pair differs by ≤ 0.003 SPD (the shader breathes); the stills are
deterministic to four decimals.

### Live `https://forgotten-mistory.web.app` (`03-live-baseline.log`, frames in `03-live-captures/`)

Live `build-commit` at the time of the run: `6bb2b14f` (15:40Z). The local build measured
above was `c3cb77c5` (this worktree at `origin/main` when it was built).

| viewport | `/?gl=force` SPD | still SPD | `/?gl=force` lit | still lit |
|---|---|---|---|---|
| 1440×900 | 0.6044 FAIL | 0.4109 FAIL | 0.1673 | 0.1044 |
| 1280×800 | 0.5932 FAIL | 0.3730 FAIL | 0.1722 | 0.1015 |
| 834×1194 | 0.8242 PASS | 0.4881 FAIL | 0.2674 | 0.0718 |
| 390×844 | 0.2641 FAIL | 0.0559 FAIL | 0.2344 | 0.1157 |

CLI exit 1 (7/8 cases red). Live and local agree to ≤ 0.005 on every case; the three stills are
identical to four decimals, which is what a rendered poster should do.

## What the instrument says about the fold (observations, not new claims)

- The 1440 `gl` report lists `h1#hero-name` as **two** 162 px line boxes (`y=163`, `y=287`):
  the name wraps, which is the brief's BM-1 finding, reproduced independently by a probe that
  was not looking for it.
- The portrait `img` rect is `545.19 × 303.38` at 1440 — the brief's "545 × 303, 11.4 %".
- Peak `L` is 1.0000 on every case: the white `.primaryAction` pill is the brightest object in
  the frame (CTA-3's target).
- 834×1194 `gl` is the one passing case: the tablet layout gives the stage the most uncovered
  area (ink covers 25.7 %) and the rake crosses it. The same width's still fails at 0.4881 —
  the poster is dimmer than the shader where it is not covered, so the plane's share drops.
- At 390 the ink covers 81 % of the fold (per-run plates + full-bleed photograph); on the still
  the plane carries 5.6 % of the light. The phone is where the moves have furthest to go.

## Gates for this lane

| gate | result | evidence |
|---|---|---|
| tsc | 0 errors | this session, after each edit and after the merge |
| next lint | clean | this session |
| build:static | exit 0 | `out/index.html` 15:26Z |
| overhaul_static_audit | 10/10 | this session |
| thresholds exactly 0.75 / 0.045 | pinned by `expect` in the spec | `hero-plane-dominance.spec.ts` `instrument()` |
| G from the capture | percentile of decoded pixels | `planeDominance()` |
| both paths measured | 8 + 8 cases | `02-baseline-red.log`, `03-live-baseline.log` |
| rect list printed, not summarised | every report | both logs |
| zero production files | `git diff --name-only` | scripts/validate, tests/, this folder only |
