# c20 scenes 5 + 6 — `#vitrine` and `#listen` carry a field

Task `t_60d9cd7a` · SPEC-v10 §R2 / c20 · R-c13 M-2, MOT-C13-03, MOT-C13-06 ·
branch `worktree-wf_a2f5922d-8e7-1` · commits `1150e3e` (vitrine), `d53d228` (listen).

## What was wrong

R-c13 M-2 counted three of seven signature GL scenes: `#hero`, `#about` and
`#experience` mount a canvas; `#skills`, `#vitrine` and `#listen` mounted none
(`merge-probe2.json.glForceWalk`, build `3dae601a`). Two of those three are this
task. The same review found `#vitrine`'s trace-on running 6.67 ms between
consecutive strokes against a 720 ms stroke (MOT-C13-03) and its rail declaring
`scroll-behavior` only inside the reduced-motion block (MOT-C13-06).

## Decisions

1. **The field answers the section, it does not repeat it.** `#vitrine`'s raking
   light is CSS and stays CSS — it has to survive on a phone and with no WebGL.
   The shader draws the pool of light the *cabinet* stands in, under the rail,
   and lets the plates sit in it. No seventh plate, no second gradient. Same
   argument in `#listen`: the caliper's close is the section's one beat
   (MOT-F-4), so the field is that beat seen as light, not another one.

2. **Uniforms come from the section's own state, never a clock.** `#vitrine`:
   `uCentre` is the lit plate's measured centre across the stage, `uScroll` is
   `scrollLeft / scrollWidth`, `uLit` is the plate index that seeds the pool.
   `#listen`: `uClose` is the jaws' progress over the same `--motion-cine-long`
   window `caliperCloseLeft` runs in, started by the same `closed` flag, and
   `uBand` is the caliper's measured height in the section. A late mount (the
   scene waits for an idle callback and `#listen` is the last section) arrives
   already closed rather than replaying the beat.

3. **Continuous rail state is a ref, not React state.** The rail scrolls at
   frame rate; re-rendering six plates for each frame of it would cost more than
   the light it feeds. `Vitrine` writes `{centre, scroll}` into a ref in the rAF
   handler it already runs, and `VitrineField` reads it inside `useFrame`.
   `setLit` still runs on change only, so `data-lit` and `data-lit-index` cannot
   drift apart (TC-SCENE-VITRINE-03).

4. **A stage, not the whole section, is the field's frame.** `#vitrine` gets a
   `.railStage` wrapper — a plain block box the width of the section's column,
   so the rail's full bleed and `--rail-inset` compute exactly as before. The
   light belongs to the cabinet, not to the heading above it or the exclusions
   below.

5. **MOT-C13-03: the 900 ms budget is spent on sequence.** Stroke duration
   `var(--motion-base, 320ms)`, stagger `min(28ms, 520ms / max(1, n - 1))`,
   labels at 860 ms. Twenty-five strokes now land at 840 ms with consecutive
   strokes 21.67 ms apart. The reduced-motion block is untouched, as the review
   directed.

6. **MOT-C13-06: `scroll-behavior: smooth` on `.rail`,** with the existing
   reduced-motion `auto` left in place.

7. **Both fields obey the scene contract.** One `ScreenQuad`; three noise
   lookups per pixel in `#vitrine`, two in `#listen` (an empty screen should
   cost less than a full one); DPR capped by `GLCanvas` at `[1, 1.75]`; ink and
   light from `lib/palette.ts` only; alpha follows luminance so a dark field
   paints nothing; the slot is `inset: 0`, `aria-hidden` behind the content;
   `webglcontextlost` ramps the field out rather than freezing the last frame.
   No new dependency and no network asset.

## Measurements

From `03-probe.json` (system Chrome, `--use-gl=swiftshader
--enable-unsafe-swiftshader --ignore-gpu-blocklist`, served from `out/` on
:5602):

| frame | `#vitrine` canvases | `#listen` canvases | SVGs (v / l) | rail `scroll-behavior` |
|---|---|---|---|---|
| `?gl=force` 1440 | 1 | 1 | 6 / 1 | smooth |
| `?gl=force` 390 | 1 | 1 | 6 / 1 | smooth |
| reduced motion 1440 | 0 | 0 | 6 / 1 | auto |
| no WebGL 1440 | 0 | 0 | 6 / 1 | smooth |

Trace-on, plate 01 at 1440 (`03-probe.json → frames["gl-force #vitrine 1440"].trace`):
25 strokes · 320 ms each · last delay 520 ms → **lands at 840 ms** (budget 900) ·
smallest gap between consecutive strokes **21.67 ms** (floor 20) · label 860 ms.

First Load JS: **189 kB before, 189 kB after — +0 kB** (`01-baseline-build.log:43`
vs `05-build.log:49`; the route's own bundle moves 29.9 → 30.3 kB for the two
dynamic wrappers, and `three` stays in the chunk `Scene` fetches on mount).

## Gates

| gate | result |
|---|---|
| specs red before | `02-tests-failing.log` — 10 failed / 4 passed, EXIT=1 |
| both scene specs + `tests/e2e/vitrine` + `tests/e2e/listen` | `04-tests-passing.log` — **36 passed**, EXIT=0 |
| `tests/monochrome` + `tests/a11y/gold-contrast.spec.ts` | `05-battery-monochrome-a11y.log` — **17 passed**, EXIT=0 |
| `npx tsc --noEmit` | EXIT=0 |
| `npm run lint` | `✔ No ESLint warnings or errors` |
| `npm run build:static` | EXIT=0, `05-build.log` |
| `node scripts/validate/overhaul_static_audit.mjs` | `RESULT: ALL PASS (10/10)`, `05-static-audit.log` |
| screenshots | `08-screens/` — 8 frames, all ≤ 400 kB (the two 1440 `?gl=force` frames re-encoded 8-bit greyscale, which is what they already were) |

## Tools used

`Bash` (npm run build:static, npx tsc, npm run lint, npx playwright test,
node scripts/validate/overhaul_static_audit.mjs, node probe.mjs, git,
python3 -m http.server 5602, PIL re-encode), `Read`, `Write`, `Edit`.

## Not done here

`#skills` is the third section M-2 counts at zero canvases; it is not in this
task's scope. `probe.mjs` in this directory is the scene probe used above and is
kept beside its output.
