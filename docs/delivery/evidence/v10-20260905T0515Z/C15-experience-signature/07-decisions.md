# Cycle 15 — `t_86cdd156` — decisions, measurements and departures

**Task:** MOT-F-1 + C-03 — `#experience` becomes the narrated signature.
**Role:** analyst-programmer (coding, level 2, effort xhigh). **Port:** 5601.
**Worktree:** `/root/forgotten-mistory/.claude/worktrees/wf_eefd9de5-b04-1`,
branch `worktree-wf_eefd9de5-b04-1`, cut from `main` at `8dc4cf4`.
**Spec file (written first):** `tests/overhaul/scene-experience.spec.ts`.

Every number below is the literal output of a command run this session. Nothing
is quoted from memory.

---

## Tools used

| tool | what it did |
|---|---|
| `Read` / `Edit` / `Write` | every source change, Read before Edit throughout |
| `Bash` | `npm ci`, `npm run build:static`, `npx tsc --noEmit`, `npm run lint`, `node scripts/validate/overhaul_static_audit.mjs`, `python3 -m http.server 5601`, `git` |
| Playwright (`npx playwright test`) | the TDD red/green runs and the regression battery |
| Playwright (node script, system Chrome + SwiftShader flags) | `03-probe.json` at `?gl=force`, the five screenshots, the mid-entry frame |
| `grep` / `sed` | reading R-c8 `review.md`, SPEC-v10 §3 c18, existing specs |

The screenshot/probe instrument was a throwaway script under `scripts/`; it was
deleted after it ran, and its two commands are reproduced at the foot of this
file so the artefacts can be regenerated.

---

## TDD ledger

| stage | command | result |
|---|---|---|
| red | `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/overhaul/scene-experience.spec.ts` | **6 failed, 2 passed** (`02-tests-failing.log`) |
| baseline | same, `tests/e2e/experience.spec.ts` | **1 failed, 12 passed** — TC-EXP-11 already red (`01-baseline.log`) |
| green | both files together | **21 passed**, exit 0 (`04-tests-passing.log`) |

The two specs that passed in the red run were the gold audit (the section had no
gold before either — the point of the test is that it must stay that way through
a change that adds a "today" mark) and the single-canvas count.

---

## What was built

**1. The entry beat (MOT-F-1).** `.trackBar` mounts at `scaleX(0)` about its left
edge and grows to `scaleX(1)` over `900ms cubic-bezier(0.16, 1, 0.3, 1)`, one row
60 ms behind the last, driven by `data-entered` on `[data-track-field]`. An
`IntersectionObserver` at `threshold: 0.35` on the chart sets it once and
disconnects.

*Departure, deliberate:* the delay is `calc((var(--row) + 1) * 60ms)`, not
`var(--row) * 60ms` — every row gets one beat of head start. With no head start
the curve puts the first bar at **scaleX ≈ 0.534 at exactly 100 ms**, which fails
the acceptance line "at 100 ms the first bar is under half its length" on the
arithmetic alone, before any measurement jitter. One beat moves it to ≈ 0.25 and
the chart still settles at `60 + 7×60 + 900 = 1380 ms`, inside the 1500 ms
ceiling. Measured mid-entry at ~300 ms, all eight rows:
`[0.702, 0.52, 0.234, 0, 0, 0, 0, 0]` — `08-screens/1440-experience-mid-entry-300ms.png`.

**2. The chart is handed to the shader.** `strata.glsl.ts` gains
`uniform vec4 uSpans[8]` (left, width, row centre, in this canvas's 0..1 space),
`uniform float uProgress` and `uniform float uHover`. Each row lifts the sediment
under it by `+0.10`, clipped to `span.x + span.y * uProgress` so the field is
measured out left-to-right with the bar rather than switched on beneath it; the
pointed-at row takes a further `+0.06`, weighted by how far the CPU-side lerp
(`delta * 1.4`, `CareerStrata.tsx`) has travelled. Budget held: **one screen
quad, three `noise()` calls per pixel** (the three drifting bands — the span loop
is `step`/`smoothstep` arithmetic and samples nothing), DPR still capped at
`[1, 1.75]` in `GLCanvas.tsx`, no new asset and no new dependency.

The spans are measured from the DOM chart itself in `Experience.tsx` using
`offsetLeft` / `offsetWidth` — layout values, not painted ones, because the
painted box is mid-transform during the beat and `uProgress` is what does the
reveal. Re-measured on `ResizeObserver` and `resize`.

The header that read *"It encodes nothing, and is written not to look as though
it does"* is gone, because it is no longer true. TC-SCENE-EXP-07 fails if that
sentence — or the uniforms — go missing again.

**3. The playhead is white, and pinned.** `[data-playhead]` is a 1 px rule down
the track field with a 4 px tick across its foot, at
`right: calc(var(--readout-column) + var(--space-2))` — the same inset `.axis`
uses, so it stands exactly on the `now` label. Measured:
`playheadColour: "rgb(246, 246, 246)"`, `goldInSection: 0` (`03-probe.json`).
R-c8 resolved the motion reviewer's gold proposal against CLAUDE.md directive 3:
`Experience.tsx` grades every date `self-reported`, so gold is not available to
this section at all.

**4. Reduced motion.** `.trackBar { transform: none; transition: none }` inside
the existing `prefers-reduced-motion` block; the 320 ms `experienceFade` opacity
entrance is untouched. `uProgress` initialises to 1 when the query matches (the
scene does not mount under reduced motion today, but the shader must not depend
on that staying true). TC-SCENE-EXP-08: minimum observed `scaleX` over 1200 ms of
rAF sampling is **1**, canvases **0**, playhead still present.

**5. Bar weight (C-03).** Rest fill `var(--mist-400)` at **0.72** (was 0.85);
hover/active `var(--white)`, hover `scaleY(1.5455)` at 200 ms unchanged; the ANZ
row keeps `--white` at 0.9. Verified in `03-probe.json` `barFill`.

---

## Departures from the written direction, and why

**(a) `.trackLine { padding-right: 4.5rem }` was not applied.** It would be
inert. `.trackBar` and `.trackYears` are absolutely positioned, and an absolutely
positioned box resolves its percentages against its containing block's *padding*
box, not its content box (CSS 2.1 §10.1) — so the padding reserves nothing from
the bars. Making it bite would mean nesting the bars in a content-box plot
wrapper, which ends the sixteen-year axis 4.5 rem short of the `now` tick drawn
under it: a misalignment worse than the overflow it was meant to fix. The room
C-03 asks for is already reserved one level up, as the track grid's third column
(`--readout-column: 4.5rem`, declared on `.chart`). The reason is written into
the CSS at the `.trackLine` rule so the next reader does not re-derive it.

**Measured, all five widths, TC-SCENE-EXP-05 green:** zero `.trackYears` boxes
with `right > chartCard.right - 16`, and `scrollWidth === innerWidth` at 390,
834, 1280, 1440 and 1920. At 1440 the probe reads `chartRight: 1344`,
`playheadRight: 1256`.

**(b) Below 52 rem the readout is hidden, not made static.** Every bar in this
chart is measured up to the same right-hand edge — the newest role runs to `now`
— so a readout parked in a fixed column at that edge sits on top of the bar it
describes. The section already hid it below 760 px for that reason; the
breakpoint is raised to 52 rem, which removes the 761–832 px band where it was
visible and cramped. Nothing is lost: the duration is in every row's accessible
name and printed in full in the detail list below.

**(c) `.trackYears` moved out of `.trackBar`.** It is now a sibling, with `left`
written inline as the bar's own end plus `var(--space-1)`, from the same
percentages. As a child it would have been squashed by the very `scaleX` that
draws the bar and would have arrived unreadable. `max-width: 4rem` as directed.

**(d) The entry observer also commits when the chart is already behind you**
(`entry.boundingClientRect.bottom < 0`). Found while debugging, not theorised: a
deep link or a restored scroll position that lands below the chart never crosses
the 0.35 threshold, and the bars would have stayed at nothing for as long as the
page was open. A chart that is behind you is a chart that has finished drawing.

---

## TC-EXP-11 — reported, as asked

It was **red before this cycle** and is **green after**, but not because of the
bar colours. Two separate defects, both recorded:

1. **The selector never touched a bar.** `#experience ol li button span span > span`
   needs three levels of nested `span`; the only element that matched was
   `.trackYears`, the label, whose `::before` has no background. Every
   "brightness" it compared was `0`, so `expect(0).toBeLessThan(0)` failed
   (`01-baseline.log`: `bar 0 must not outshine ANZ / Expected: < 0 / Received: 0`).
   The test had never once measured a bar. It now names `[class*="trackBar"]`.

2. **The floor was an uncomposited proxy.** `≥ 120` stood in for the comment's
   own claim, "≈ 3:1 on a `#131313` ground", but ignored the fill's opacity
   compositing over that ground. At `--mist-400` × 0.72 the proxy reads **103.7**
   while the real WCAG 1.4.11 ratio is **3.39:1** — the proxy fails a bar that
   passes the criterion it was written to enforce. The test now computes the
   composited relative luminance and the contrast ratio directly. That is
   strictly the harder check: it is the thing the old comment claimed to verify,
   and the proxy could not have caught a fill that passed 120 uncomposited and
   failed 3:1 composited.

Both edits are widening, not weakening: the assertions "ANZ is the brightest bar"
and "every bar clears the non-text contrast floor" are intact, and a third line
was added asserting ANZ clears the floor too.

Three further tests in `tests/e2e/experience.spec.ts` were repaired for the same
structural reason (the readout is no longer nested three spans deep):
TC-EXP-02 now measures `offsetWidth` — the encoding, which is the same number
before, during and after the beat, rather than whichever animation frame the
harness caught — and TC-EXP-09 / TC-EXP-10 name `[class*="trackYears"]`.

---

## Battery

| gate | command | result |
|---|---|---|
| tsc | `npx tsc --noEmit` | exit **0** |
| lint | `npm run lint` | exit **0**, `✔ No ESLint warnings or errors` |
| build | `npm run build:static` | exit **0** |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | exit **0**, `RESULT: ALL PASS (10/10)` |
| c18 spec + experience e2e | `npx playwright test tests/overhaul/scene-experience.spec.ts tests/e2e/experience.spec.ts` | **21 passed**, exit 0 |
| monochrome + gold contrast | `npx playwright test tests/monochrome tests/a11y/gold-contrast.spec.ts` | **15 passed**, exit 0 |
| visual + overhaul | `npx playwright test tests/visual tests/overhaul` | **76 passed, 1 failed** — see below |

**The one failure is not this cycle's.** `VIS-04: Listen (closing) section
screenshot` differs from its baseline by 42 156 px (ratio 0.04), deterministic
across two runs. `#listen` is not in this cycle's diff — `git status --porcelain`
shows only `components/sections/Experience/*`, `tests/e2e/experience.spec.ts`,
`tests/overhaul/scene-experience.spec.ts` and evidence. The Listen baseline was
last written by `96732ff` (vitrine cycle) while `components/sections/Listen/`
last moved at `4f1d659`; the drift predates this branch. It is **not** re-baselined
here — accepting another section's snapshot on this cycle's authority would hide
whatever changed it.

## Frame rate — recorded, not claimed

`rafFps: 15` at `?gl=force`, renderer
`ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)…))`. This host has no
GPU. Per SPEC-v10 §0 that number is a software-rasterisation artefact and **must
not be quoted as the R2 60 fps measurement**; the task's "≥ 55 fps sampled at
1440" gate cannot be honestly evaluated here and is left for the GPU runner
(`c20c-scene-framerate-gpu`). `consoleErrors: []` at 1440 with the scene live.

## Observed, out of scope

At 390 the axis labels `2025` and `now` overlap (`08-screens/390-experience.png`).
`.axis` / `.axisTick` are untouched by this cycle; the collision predates it.

## Reproducing the artefacts

```bash
npm run build:static
python3 -m http.server 5601 --directory out --bind 127.0.0.1 &
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test \
  tests/overhaul/scene-experience.spec.ts tests/e2e/experience.spec.ts
node scripts/validate/overhaul_static_audit.mjs
fuser -k 5601/tcp
```

Screenshots and `03-probe.json` were taken with Playwright's `chromium`
(`channel: 'chrome'`) launched with
`['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']`
against `http://127.0.0.1:5601/?gl=force`, clipped to `#experience [data-chart]`
at `scale: 'css'`; every PNG is under 300 kB.
