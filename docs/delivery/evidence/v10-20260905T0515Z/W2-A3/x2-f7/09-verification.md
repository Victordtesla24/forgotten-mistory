# X2-F7 — `x2-f7-about-390-unguarded` — the guard mask was measured first, and it falsifies trigger (3)

**Agent:** `ap-w2-x2f7` (analyst-programmer, `docs/prompt.md` §5) · **Task:** `t_w2_x2f7`
**Branch:** `worktree-w2-x2f7` from `origin/main` `afad076` · **Port:** `:5601` · **Run:** 2026-09-06T04:52Z–05:25Z
**Method mandated by the PM comment:** *"first MEASURE the guard mask over the ring annulus (rr 0.40–0.96) and the fan
(1.12–1.6) at 1440 and 390 in the at-rest state … then create unguarded annulus area by RELOCATING the guarded UI …
never by weakening `READING_CEILING` / `INSTRUMENT_CEILING` or the (1−guarded) gate."*

## Outcome

**No CSS is shipped.** The mandated first step was run and it says the ring annulus is **already unguarded** at both
widths at rest. Relocating guarded UI off the annulus therefore cannot restore the mark that `TC-SCENE-ABOUT-10` 10b
reads there, because nothing is on it. The guarded region that is real is the **fan**, and at 390 two thirds of the fan
is not guarded but **off the plane entirely** — a different defect, with a different fix, and one the doc's own remedy
(*"end `.fieldViewport` above the first of the ten"*) would make worse.

## 1 · The measurement (`01-guard-mask-probe.mjs` → `02-guard-mask-measured.log`)

The probe reads the same four rects `AboutField.tsx:208-214` reads (`.fieldViewport` host, `.instrumentStage`,
`.instrumentCaption`, `ol.list`), derives `uCentre` / `uRoseRadius` / `uGuard` by the same arithmetic, and then
evaluates the shader's own guard expression

```
toRight    = smoothstep(uGuard.x - 0.12, uGuard.x, vUv.x)
belowList  = smoothstep(uGuard.y + 0.12, uGuard.y, vUv.y)
reading    = min(toRight, belowList)
caption    = smoothstep(uGuard.z + 0.10, uGuard.z, vUv.y)
guarded    = max(reading, caption)
```

(`field.glsl.ts:415-421`) at 7 radii × 32 arc positions × 10 sectors per band, in the same polar frame the shader uses
(`p = (vUv - uCentre) * vec2(W/H, 1) * 2`, `a = atan(p.x, p.y)`, `s = a/TAU*10 + 0.5`). Samples that fall outside the
plane are counted separately as **off-plane** — there the mark is absent because there is no plane, not because a guard
is on it. Static export of `afad076` on `:5601`, system Chrome, DPR 1, `#about` scrolled to `block: 'start'` — the same
state `tests/overhaul/scene-about.spec.ts:73` puts the page in.

| width | band | mean `guarded` | unguarded (<0.05) | off-plane |
|---|---|---|---|---|
| **1440** | ring `rr 0.40–0.96` | **0.0363** | **88.1%** | 0.0% |
| **1440** | fan `rr 1.12–1.60` | 0.6694 | 16.2% | **38.4%** |
| **390** | ring `rr 0.40–0.96` | **0.0164** | **94.8%** | 0.0% |
| **390** | fan `rr 1.12–1.60` | 0.6942 | 21.2% | **67.6%** |

Per-sector mean `guarded` on the ring (index as the shader indexes; role-side = 5, 6, 8):

```
1440 at rest   0.000 0.000 0.024 0.024 0.053 0.209 0.053 0.000 0.000 0.000
390  at rest   0.000 0.000 0.000 0.000 0.021 0.122 0.021 0.000 0.000 0.000
```

Geometry behind it, both widths:

```
1440   host 1248x900   centre (0.1667, 0.7689)  roseRadius 0.4622
       guard.x 0.3910  guard.y 1.0000  guard.z 0.5200
390    host  342x480   centre (0.5000, 0.7667)  roseRadius 0.4667
       guard.x 0.0000  guard.y 0.0049  guard.z 0.5000
```

`uRoseRadius = stageWidth / hostHeight`, and the bands are read in units of `uRoseRadius` on a frame where 1.0 is half
the plane's height — so a band's reach **in pixels** is `rr × stageWidth / 2` and does **not** depend on the plane's
height. Ring outer = 0.96 × 208 = **200 px** below the stage centre at 1440 (0.96 × 112 = **108 px** at 390); the
caption's top is **224 px** below it at 1440 and **128 px** at 390. The ring clears `uGuard.z` at both widths by
construction. The fan's outer edge is 333 px / 179 px, which is past the caption at both widths and past the 30 rem
band's own foot at 390.

## 2 · What that means for the three triggers

**Trigger (3) — `TC-SCENE-ABOUT-10` 10b red "because the ring annulus there is mostly guarded" — is falsified.**
88.1% of the ring annulus at 1440 at rest, and 94.8% at 390, sit at `guarded < 0.05`; `markWindow`'s `(1.0 - guarded)`
factor is ≈ 1 over almost all of it. The most-guarded single sector is index 5 at 0.209 — the one that points straight
down at the caption — and it is one of the three *open* sectors, so even that is a 21% attenuation of the mark on one
sector of three, not the "exactly zero" the x2-f6 handover recorded. `x2-f6/09-verification.md` §3 attributes the
0.0972 open-min at 1440 at rest to the guard; **that attribution does not survive measurement.** The cause of 10b's red
at 1440 at rest is somewhere else in the term (candidates not yet measured: the ruling's contribution at
`ABOUT_OPEN_RULING = 26` folding into DFT bin 5 with a sign that cancels the dash at those three radii; the ring band's
`groove` at `rr = 0.724` sitting between two of the three structure radii; the incoherent floor the x2-f6 baseline
measured at 0.09–0.26). **A composition change cannot fix a term that a composition change does not gate.**

**Trigger (1) — `TC-STORY-ABOUT-02` @390 deficit 0.1075 < 0.15 — stands, and its headroom is in the fan, not the ring.**
At 390, 67.6% of the fan band is **off the plane** (the 30 rem viewport ends 240 px below the stage centre and the fan
reaches 179 px past the caption), and of what is left, sectors 4/5/6 are 0.77–1.00 guarded by `uGuard.z`. So there is
real area to win at 390 — but it is won by making the band **reach further** and by moving the caption/key **below the
fan's outer edge** (a ≥ 4 rem plate offset under the compass at 390 by the arithmetic above), which is the opposite of
"end `.fieldViewport` above the first of the ten". That is a composition decision with a 390 visual baseline
regeneration attached, and `ABOUT-STORY-v2` §6 requires the regenerated baseline be looked at before it is committed.

**Trigger (2) — coverage < 15.00% at minimum mark depth — did not fire** (x2-f6 never shipped the shader term).

## 3 · Decision (`docs/prompt.md` §0.1, non-interactive, logged with its reversal cost)

> **Ship the measurement, not the layout.** The PM's method has two halves and the first half returns a number that
> invalidates the second half for the trigger that dispatched this slice. Shipping the `About.module.css` relocation
> anyway would be a composition change made on a premise this session has just disproved, against the `≤ 900px` block
> whose own comment (`About.module.css:419-430`) records why the band reads past the instrument — and it would spend a
> 390 visual baseline for no measured gain on the ring. `CLAUDE.md` prime directive 5 and the slice's own stop rules
> both say a claim is not evidence; the inverse holds too, and a fix aimed at a falsified cause is not a fix.
>
> **Reversal cost:** zero. Nothing in the app, the tests, the CSS or the shader is touched — the diff is one probe
> script and its logs under `docs/delivery/evidence/`.
>
> **Handover.** The probe is committed and re-runnable (`node docs/.../x2-f7/01-guard-mask-probe.mjs` against any
> static export on `:5601`), so the next slice starts from the mask rather than from an inference about it. The two
> questions it leaves, in the order they should be answered: (i) why is the mark's DFT-bin-5 amplitude 0.0972 at 1440
> at rest on an annulus that is 88% unguarded — instrument the shader term itself, not the guard; (ii) at 390, is the
> fan worth reclaiming, given it costs a taller band, a caption plate ≥ 4 rem below the compass, and a baseline.

## 4 · Gates on the pushed tree

| gate | result | log |
|---|---|---|
| `npm run build:static` | exit 0, secret scan PASS | `05-battery-build-baseline.log` |
| `npx tsc --noEmit` | exit 0, clean | `05-battery-tsc.log` |
| `npm run lint` | exit 0, 0 warnings 0 errors | `05-battery-lint.log` |
| `node scripts/validate/overhaul_static_audit.mjs` | **ALL PASS (10/10)** | `05-battery-audit.log` |
| guard-mask probe, both widths | exit 0 | `02-guard-mask-measured.log` |
| `READING_CEILING` / `INSTRUMENT_CEILING` / `(1 − guarded)` | untouched — no source file is in the diff | `git diff --stat` |
| visual baselines | untouched — no CSS, no shader, no `tests/` file in the diff | `git diff --stat` |

The About Playwright battery (`TC-SCENE-ABOUT-10`, `TC-STORY-ABOUT-01/02/03`, `TC-FLAGSHIP-VIS-ABOUT`,
`TC-CONTRAST-01/02`) was **not** re-run and is **not** claimed: this tree's app, shader, CSS and test sources are
byte-identical to `origin/main` `afad076`, so it reads exactly what `main` reads. Unclaimed rather than asserted.
