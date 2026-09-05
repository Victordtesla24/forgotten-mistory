# 09 — Independent adversarial verification, cycle 15 (t_86cdd156)

**Reviewer:** council reviewer, role `3rd_party_independent_adversarial_review`, level 1, effort max.
Independent of the author; the author's report is treated as testimony, not as evidence.
**Under review:** `worktree-wf_eefd9de5-b04-1` @ `8be71c90a99807c5bcc7a66e3b511b47db4f5d76`
(`83767eb` feature + `8be71c9` evidence), worktree
`/root/forgotten-mistory/.claude/worktrees/wf_eefd9de5-b04-1`.
**Method:** the worktree was rebuilt from clean (`rm -rf out .next && npm run build:static`),
served on `127.0.0.1:5601`, and every gate was re-run here. Nothing in this file is copied from
the author's logs. My own instrument is `09-verify-probe.mjs`; its raw output is `09-probe.json`.

**Verdict: PASS**, with three findings recorded below (one acceptance sub-clause missed by 10 ms,
one direction step not implemented, one pre-existing defect confirmed but out of this diff).

---

## 1. Gates, re-run by the reviewer

| gate | command | exit | observed |
|---|---|---|---|
| build | `rm -rf out .next && npm run build:static` | 0 | `RESULT: PASS — no credential material in the emitted bundle.` |
| tsc | `npx tsc --noEmit` | 0 | no output |
| lint | `npm run lint` | 0 | `✔ No ESLint warnings or errors` |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | 0 | `RESULT: ALL PASS (10/10)` |
| cycle specs | `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/overhaul/scene-experience.spec.ts tests/e2e/experience.spec.ts` | 0 | `21 passed (41.0s)` — 8 scene + 13 e2e, TC-EXP-11 among them |
| monochrome + gold | `… npx playwright test tests/monochrome tests/a11y/gold-contrast.spec.ts` | 0 | `15 passed (26.2s)` |
| visual + overhaul | `… npx playwright test tests/visual tests/overhaul` | 1 | `75 passed` / 2 failed (2.7m) — VIS-04 `#listen` baseline (42 156 px, ratio 0.04 — the author's number reproduced exactly) and TC-CLONE-05, which is a **parallel-load flake**: re-run alone it is `2 passed (7.0s)`, exit 0. Neither touches this diff. |

The author's red-before claim was not re-run (the red state no longer exists on this branch); it is
accepted on the artefact `02-tests-failing.log` (`6 failed / 2 passed`) plus the structural proof in
§4 that TC-EXP-11 could not have been green before the selector was corrected.

---

## 2. `?gl=force` probe — SwiftShader, 1440 and 390 (`09-probe.json`)

Chromium launched with `--no-sandbox --use-gl=swiftshader --enable-unsafe-swiftshader
--ignore-gpu-blocklist`; renderer reported as
`ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) …), SwiftShader driver)` at both widths.

| measurement | 1440×900 | 390×844 |
|---|---|---|
| console errors / page errors | `[]` / `[]` | `[]` / `[]` |
| canvases in `#experience` after entry | **1** (1298×505) | **1** (356×605) |
| gold (`rgb(201, 168, 76)`) in `#experience` — `color`/`background`/`border`/`outline`/`stroke`/`fill`, element + `::before` + `::after`, every descendant and the section itself | **0** | **0** |
| playhead computed `color` | `rgb(246, 246, 246)` (`--white`) | `rgb(246, 246, 246)` |
| bar rows found | 8 | 8 |
| min scaleX observed during entry | 0 | 0 |
| **scaleX at ~100 ms** (first bar) | **0.045** @ 141 ms | **0.154** @ 119 ms |
| **transform at ~1500 ms** (all 8) | `matrix(1, 0, 0, 1, 0, 0)` ×8 | `matrix(1, 0, 0, 1, 0, 0)` ×8 |
| settled at | 1281 ms | 1265 ms |

The 100 ms sample is taken inside the page from the frame the section commits (`data-entered`),
not from the harness; the first frame at or after 100 ms landed at 141 ms / 119 ms because this
host rasterises in software (~15–25 rAF frames per 1700 ms). Both readings are far under the 0.5
ceiling and both were taken *later* than 100 ms, so the margin is conservative, not flattered.

**Playhead alignment, measured rather than asserted.** At 1440 the playhead occupies x 1255–1256
and the newest role's bar ends at 1256, with `.trackLine`'s right edge also at 1256; at 834,
playhead 703–704, newest bar right 704; at 390, playhead 305–306, newest bar right 306,
`.trackLine` right 306. The `now` axis label at 390 spans x 295–317, so the rule stands under its
own label. The playhead is on `now` at every width tested.

**Bar fills at rest** (`::before`, both widths): seven rows `rgb(144, 144, 144)` @ `0.72`, row 2
(ANZ) `rgb(246, 246, 246)` @ `0.9`. This matches R-c8 C-03's direction exactly.

---

## 3. Is the strata following the spans, or still decoration?

This is the substance of MOT-F-1 and the one claim a spec file cannot make for itself, so it was
measured against a control rather than read off a screenshot.

Method: at 1440 with `?gl=force`, screenshot clipped to the scene slot, then mean relative
luminance of a **4 px band strictly above each bar** (`cy−10 … cy−6`; the bar is 8.8 px tall, so
±4.4 px — the window never touches it), sampled at two x positions on the same scanline: 10 px
**inside** the span, and 70 px **left of** the span's start. The identical measurement was then
repeated with the canvas absent (plain `/`, `canvases = 0`) as the control.

| row | GL: inside | GL: left of span | Δ | no-GL: inside | no-GL: left of span | Δ |
|---|---|---|---|---|---|---|
| 0 | 5.56 | 2.46 | **+3.10** | 18.42 | 16.78 | +1.64 |
| 1 | 6.26 | 2.55 | **+3.71** | 16.30 | 16.77 | −0.47 |
| 2 (ANZ) | 10.66 | 7.61 | **+3.05** | 17.00 | 16.90 | +0.11 |
| 3 | 11.90 | 7.87 | **+4.03** | 16.86 | 16.67 | +0.19 |
| 4 | 10.78 | 8.27 | **+2.52** | 16.59 | 16.61 | −0.02 |
| 5 | 12.66 | 9.24 | **+3.42** | 16.77 | 16.30 | +0.47 |
| 6 | 12.10 → 16.04 | 12.10 | **+3.94** | 16.01 | 16.09 | −0.08 |
| 7 | 16.16 | 13.22 | **+2.94** | 15.90 | 15.95 | −0.05 |

**8 of 8 rows are lit inside their own span with the shader on; the same 8 rows show noise around
zero (4 of them negative) with the shader off.** The field is bound to the chart's geometry. The
`strata.glsl.ts` header no longer contains `encodes nothing` (TC-SCENE-EXP-07, green), and that is
now a true statement rather than a rewritten comment.

---

## 4. Label containment (C-03), and the two departures the author declared

`.trackYears` right edge vs the chart card, measured at five widths in one session:

| width | chart right | worst readout right | offenders (`right > chartRight − 16`) | `scrollWidth` / `innerWidth` |
|---|---|---|---|---|
| 390 | 366 | — (`display: none`) | `[]` | 390 / 390 |
| 834 | 792 | 742 | `[]` | 834 / 834 |
| 1280 | 1216 | 1166 | `[]` | 1280 / 1280 |
| 1440 | 1344 | 1294 | `[]` | 1440 / 1440 |
| 1920 | 1584 | 1534 | `[]` | 1920 / 1920 |

C-03's failure case — `6 mo` running from x=800 to x=830 with the card's border at x=793 at 834 —
is closed: at 834 the worst readout now ends at 742, fifty pixels inside the border.

**Departure 1 — `.trackLine { padding-right: 4.5rem }` not applied.** Accepted. `.trackBar` and
`.trackYears` are both `position: absolute` and their percentage `left`/`width` resolve against
`.trackLine`'s padding box, so the padding would reserve nothing (CSS 2.1 §10.1). The room is
reserved one level up as `--readout-column` on `.chart`, and the table above proves containment at
all five widths, which is what the acceptance actually asks for.

**Departure 2 — below 52rem the readout is hidden rather than `position: static`.** Accepted with a
correction to the author's stated mitigation. The geometric argument holds: every bar is measured
to the same right edge, so a static readout in a fixed column would sit on the bar it labels. But
the author writes that "the duration remains in every row's accessible name". What the accessible
name actually carries (read from the DOM at 390) is the **date range**, not the duration string —
e.g. `Senior Delivery Lead / AI-ML Solutions Architect, ANZ Banking Group, Sept 2017 - Jun 2025`,
never `7.8 yr`. The information is recoverable, not identical; the claim should have been phrased
that way. Not a defect in the build.

**TC-EXP-11 repaired, not weakened — verified structurally.** The old selector
`#experience ol li button span span > span` requires a span that is a direct child of a span that
is itself a descendant span of a descendant span of the button. Against the pre-cycle DOM
(`button > .trackCompany | .trackLine > .trackBar > .trackYears`) only `.trackYears` satisfies
that chain — `.trackBar`'s nearest span ancestor is `.trackLine`, which has no span ancestor inside
the button. `.trackYears` has no `::before` background, so every "brightness" the test compared was
`0` and `expect(0).toBeLessThan(0)` could never pass: the assertion had never once measured a bar.
The replacement computes composited relative luminance and the real WCAG 1.4.11 ratio against the
plot ground, and adds a line asserting ANZ clears the floor as well. Both original claims survive
and one new one is added. This is a widening.

---

## 5. Reduced motion

`reducedMotion: 'reduce'`, 1440×900, `?gl=force`, sampled every frame for 2400 ms across the scroll:

- minimum scaleX over every bar, every frame: **1** — no bar is ever short of its real duration;
- `document.getAnimations().filter(playState === 'running')`: **0 page-wide**, 0 in `#experience`;
- canvases in `#experience`: **0** (the scene never mounts);
- playhead present: **1**;
- console errors: `[]`.

The `1440-experience-reduced-motion.png` frame is compositionally identical to the settled frame —
same bar lengths, same readouts, same playhead, flat ground where the shader would be. The chart is
never briefly wrong for a reader who asked not to be moved.

---

## 6. Screenshots, read

- **`1440-experience.png` (settled).** The chart reads as sixteen years to scale: ANZ is the one
  long white bar spanning 2017→2025 and is unmistakably the longest and brightest object; the seven
  grey bars sit at their real positions along a 2010–now axis; each readout (`6 mo`, `8 mo`,
  `7.8 yr`, `10 mo`, `1.0 yr`, `11 mo`, `3.3 yr`, `1.3 yr`) sits beside its own bar, inside the
  card. The playhead is a faint white vertical rule at the right edge with a 4 px tick at its foot,
  standing under the `now` label. Nothing gold anywhere.
- **`1440-experience-mid-entry-300ms.png`.** A genuine beat: rows 0–2 partly drawn and anchored at
  their left edges (ANZ stops around x=977 against a settled x=1090), rows 3–4 barely started,
  rows 5–7 not started at all. This is the picture being measured out, not a fade.
- **`390-experience.png`.** Bars to scale, ANZ still the brightest, readouts gone, playhead and
  tick present, no horizontal overflow. Legible.
- **`1440-experience-reduced-motion.png`.** As §5.

---

## 7. Findings

**F-1 — the R-c13 acceptance's stagger sub-clause misses by 10 ms (minor, Verified).**
The task's closing comment (MOT-C13-02) asks for `document.getAnimations()` scoped to `#experience`
to hold ≥8 entries, `duration === 900`, `easing === 'cubic-bezier(0.16, 1, 0.3, 1)'`, **the last
starting at ≥ 490 ms**. Measured at both 1440 and 390: exactly **8** `CSSTransition` entries,
`duration: 900` on every one, `easing: "cubic-bezier(0.16, 1, 0.3, 1)"` on every one, delays
`60, 120, 180, 240, 300, 360, 420, 480`. The last starts at **480 ms**, not ≥490 ms — the comment's
direction specified `calc(var(--i) * 70ms)` (0…490) and the author shipped
`calc((var(--row) + 1) * 60ms)` (60…480) to buy the first row a beat of head start. Every other
clause of that acceptance, and the whole of the parent R-c8 acceptance (settled well inside
1500 ms), is met. Recorded, not escalated: this is a 10 ms difference in a delay ramp, and the
author's reason for the offset is stated in the CSS.

**F-2 — the readout roll-in was not implemented (minor, Verified).** The same comment's step 3 asks
for `.trackYears` to roll `opacity 0 → 1` over 320 ms at `calc(var(--i) * 70ms + 620ms)`, "so each
number lands as its bar stops". No opacity transition exists on `.trackYears` in the shipped CSS,
and the consequence is visible in the cycle's own mid-entry frame: `11 mo`, `3.3 yr` and `1.3 yr`
are printed at full weight beside three bars that have not begun to draw. The numbers arrive before
the measurement they label. This is the one direction step that was dropped without a stated
reason. Cheap to close: an `opacity` transition on the same `--row` ramp, in the same file.

**F-3 — the `2025` / `now` axis labels collide at 390 (minor, Verified, pre-existing).** At 390 the
`2025` label occupies x 275–304 and `now` occupies x 295–317: nine pixels of overlap, visible in
`390-experience.png` as `202₅now`. `.axis` / `.axisTick` are not in this diff
(`git diff main...HEAD --name-only` returns four Experience files, two specs and
`reports/static-audit.json`), so this cycle neither caused it nor fixed it. It belongs to whichever
cycle owns the axis.

**Carried, not attributable to this diff.** `tests/visual/screenshots.spec.ts` VIS-04
(`#listen` baseline) is red on this branch — 42 156 px, ratio 0.04, the author's figure reproduced
to the pixel. No `components/sections/Listen/**` file appears in the branch diff, so the drift
predates it; re-baselining another section's snapshot on this cycle's authority would hide whatever
moved it. Left open for the `#listen` cycle, as the author proposed.

**One flake, correctly not reported as a failure.** `tests/overhaul/avatar.spec.ts` TC-CLONE-05
(`[data-testid="minivic-panel"]` not found after pressing the launcher) went red in my two-worker
run of the same battery, which is why my count is `75 passed / 2 failed` against the author's
`76 passed / 1 failed`. Re-run alone with `--workers=1` the whole spec is `2 passed (7.0s)`,
exit 0. It is contention on this VPS, not a regression and not an under-report.

**The frame-rate gate cannot be honestly evaluated on this host.** The task lists "60 fps sampled at
1440 (rAF over 3 s ≥ 55 fps)". This VPS has no GPU; the scene runs under SwiftShader and the
author's own probe recorded 15 fps. `SPEC-v10.md` §5 decision 1 states that fps is not claimed from
this host and that every 60 fps assertion belongs to the GPU runner (`c20c-scene-framerate-gpu`).
The author did not fake, approximate or silently skip it — the number is recorded in `03-probe.json`
and explicitly disclaimed. I am recording the gate as **deferred and unmeasurable here**, not as
passed.

---

## 8. Conduct checks

- `package.json` is not in the diff — the `next 14.2.35` P100 pin is intact.
- `/root/.claude/.env.production` was never read or sourced by this review.
- Ports: only `127.0.0.1:5601` was bound (5599 and 8080 belong to other tenants and were left
  alone; 5602 was held by a sibling throughout and was not touched). Stopped with
  `fuser -k 5601/tcp` in its own call.
- No softening language and no approval-substitution in the author's report; every number it states
  that I re-measured came back within noise of the stated value, and the two that did not
  (`settledAt`, the 100 ms sample) came back *better* than claimed, not worse.

**Reviewer's verdict: PASS.** MOT-F-1 and C-03 are closed on measurement. F-2 should be raised as a
follow-up item on the `#experience` lane; F-1 and F-3 are recorded for the record.
