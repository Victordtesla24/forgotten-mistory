# 07-decisions.md — C11-vitrine-integration (run v10-20260905T0515Z)

Worktree: `/root/forgotten-mistory/.claude/worktrees/wf_18f926b0-2a4-2`, branch `worktree-wf_18f926b0-2a4-2`, base `8dc4cf4` (== origin/main at start).
Patch applied: `/root/.claude/jobs/2ca96782/tmp/c11-vitrine.patch` (`git apply --3way`, exit 0, all 14 files clean).

Every judgement call in this cycle, in the order it was taken. Numbers cite the log they come from.

## D-1 — `.eslintrc.json` gains `"root": true`

`npm run lint` exited 1 in this worktree before any code change:
`Plugin "@next/next" was conflicted between ".eslintrc.json …" and "../../../.eslintrc.json …"`.
ESLint's cascading config walks up from the nested worktree and merges the main checkout's `.eslintrc.json` (three directories up), which resolves `eslint-config-next` from a different `node_modules`. `"root": true` is ESLint's documented way to stop the cascade; on CI the repo sits at the checkout root so it changes nothing there. After the edit: `✔ No ESLint warnings or errors` (06-audit.log / 04-tests-passing.log). Chosen over an env hack because the next worktree agent would hit the same wall.

## D-2 — TDD evidence was taken against a build of unpatched main, with the specs present

The implementation half of the patch was stashed (`git stash push -- components tests/baselines docs/delivery/evidence/v9-…/C11-vitrine-integration`), leaving `tests/e2e/vitrine.spec.ts` (patch's TC-VIT-10/11 plus my TC-VIT-12/13), `out/` was rebuilt from that tree, and the relevant specs were run on :5602 → `02-tests-failing.log`: **7 failed / 10 passed**.
Failing on main: TC-CONTRAST-01 @1440 (68 nodes below AA), TC-CONTRAST-01 @390 (30 nodes), TC-HERO-12 (action ends at 852.48 px > 844), TC-VIT-10, TC-VIT-12 @1440, TC-VIT-12 @1920, TC-VIT-13.
Passing on main: TC-VIT-01…09 (untouched), TC-VIT-11 (trivially — with no dash on main every stroke's computed dashoffset is already 0; the spec exists to guard the reduced-motion path of the new feature).
The stash was then popped and every file returned to its patched state (`git status` in 01-baseline.log vs after pop: identical file list).

## D-3 — Card 01 lit at rest needed a real fix; the archived patch did not carry one

`02-tests-failing.log` line 153-154: at 1440 after hydration `#vitrine ol > li:first-child` has **no** `data-lit` — exactly the C-02 finding "card 02 lit at rest". Cause is `Vitrine.tsx` `update()`: it lights the plate whose centre is nearest the rail's centre, and at `scrollLeft 0` the snap cannot centre card 01, so card 02 sits nearer the middle. `useState(0)` (which the c8 direction asked for) was already the default on main and is overwritten on mount. The archived patch changes only `data-drawn` in that file.
Fix: the lit plate is the one the rail has *snapped to* — for each plate compute the scroll position that would centre it, clamp to `[0, scrollWidth − clientWidth]`, and pick the plate whose clamped position is nearest the current `scrollLeft`. Mid-rail this orders plates identically to the old distance metric; at either end it keeps the light on the outermost plate. No CSS change, no change to keyboard/focus lighting.

## D-4 — Trace-on timing: stagger is budgeted so every stroke lands by 880 ms

Acceptance (c8 C-02, restated by the orchestrator): "a lit plate's svg strokes reach stroke-dashoffset 0 within 900 ms". The patch used a 900 ms transition plus a flat 40 ms stagger per stroke; plate 01 has 25 strokes → last stroke would land at 900 + 24×40 = 1860 ms. Changed to Motion F-5's 720 ms per stroke and `transition-delay: calc(var(--k) * min(40ms, 160ms / max(1, var(--n) − 1)))`, with `--n` (stroke count) set on the frame by `Drawings.tsx`. Worst case 720 + 160 = 880 ms for any count; a ≤5-stroke drawing keeps the full 40 ms stagger. Label fade delay moved from 900 → 880 ms to keep "labels fade once the last stroke has landed" literally true. TC-VIT-13 asserts the declared duration+delay of the slowest stroke ≤ 900 ms (deterministic, from computed style) and the measured landing ≤ 1200 ms (harness-tolerant; TC-VIT-10 already uses that bound).

## D-5 — Two contrast failures outside the patch's files, fixed in this cycle

TC-CONTRAST-01 is in the CI-red list and the orchestrator's acceptance requires it green at both widths, so every node it reports is mine.
- `components/sections/Skills/Skills.module.css` `.footer`: `--ink-300` measured 3.91:1 on the card ground at 390 (02-tests-failing.log line 68). → `--mist-400`; the `<code>` path inside steps to `--mist-200` so it still reads brighter than its sentence.
- `components/sections/About/Compass.module.css` `.readNumber` reported 1.03:1 "fg rgb(246,246,246) on bg rgb(243,243,243)" at 1440 (line 28). Not a real contrast defect: the gate masks glyphs with `color: transparent`, and text painted with a literal `fill:` token is not masked, so the gate samples the glyph's own pixels as the ground. The patch already fixed the numerals this way (`color` + `fill: currentColor`); applied the same to `.readNumber`, `.readState` and `.numeral[data-active]` (which re-set `fill: var(--white)` and would have re-broken the active numeral). Visual result identical — same tokens, painted through `color`.

## D-6 — `app/data/generated/build-stamp.ts`

`scripts/build/build_stamp.mjs` rewrote the tracked file to `sha: null, clean: false` because the tree is dirty during a local build. It is restored to HEAD before the commit; CI regenerates it from a clean checkout.

(Sections D-7 onward are written as the visual/render decisions, screenshots and battery results come in below.)

## D-7 — What the four widths actually look like (08-screens/, read by eye)

`08-screenshots.mjs` → `08-montage.sh` → eight PNGs in `08-screens/`; each was opened with
the Read tool before this paragraph was written. The instrumented run printed:

```
1440x900: lit plate(s) [1]; drawn [1]; heading.left 96    card01.left 96    ; hero action bottom (page y) 803.64
1280x800: lit plate(s) [1]; drawn [1]; heading.left 64    card01.left 64    ; hero action bottom (page y) 708.72
834x1194: lit plate(s) [1]; drawn [1]; heading.left 41.69 card01.left 41.69 ; hero action bottom (page y) 1068.30
390x844 : lit plate(s) [1]; drawn [1]; heading.left 24    card01.left 24    ; hero action bottom (page y) 797.28
```

- **Vitrine (C-06, the spine).** `heading.left` and `card01.left` are the same number at all
  four widths, and the eye agrees: in `sections-1440.png` the "S" of *Six of thirty-eight*
  and the left edge of the Aether plate stand on one line. The rail leaves the frame as a
  fade, not a cut — plate 03 is half-dissolved at the right margin rather than sliced.
- **Vitrine (C-02, the light).** Card 01 is the lit plate at rest at every width, and it is
  the only one carrying `data-drawn`: its mechanism is fully traced while 02 and 03 hold
  their labels and stay dark. That is the intended reading order — the drawing is the
  argument of the plate you are looking at, and it is not spent on plates you are not.
- **Hero at 390 (TC-HERO-12).** `hero-390.png` shows name, role, the paragraph, the three
  self-reported figures and both actions inside the 844 px fold; the action row's bottom
  measures 797.28 px, 46.72 px of clearance. Only the "Open to…" tail line sits under the
  fold, which is what a tail line is for.
- **About at 390 (D-5's layout half).** In `sections-390.png` the compass sits once, in
  flow, above the ten answers, and the answers run over an opaque ground — the dial is no
  longer printed through the paragraphs.
- **Skills / About contrast.** The captions that moved off `--ink-300` read as grey text,
  not as grey-on-grey: nothing in the montages looks brighter or louder than it was, which
  is the point — these were token swaps inside the same monochrome family, not a lift.
- No gold anywhere in the eight files outside the caliper marks and repository URLs.

## D-8 — `.instrumentConstant` was the last real contrast defect; the one node left is fixed chrome over prose, not a contrast defect

Re-running the battery after D-1…D-6 left **two** nodes below AA (04-tests-passing.log's
first pass; both widths). They are different problems and only one of them is a colour:

1. `About .instrumentConstant` ("Ten axes · no scores") measured **4.39:1 @1440** and
   **4.40:1 @390** on `--ink-300` (#7D7D7D) — under AA by a tenth, and the one caption in
   `About.module.css` that D-5's sweep missed. Swapped to `--mist-400` (#909090, ≈5.6:1),
   the same token every other caption in that file now uses. TC-CONTRAST-01 **@1440 is
   green** after the swap.
2. `#role-body-ato ul li` ("Lead end-to-end agile delivery…") reports **1.79:1 @390**,
   `fg rgb(205,205,205) on bg rgb(153,153,157)`. That ground is not the Experience
   section. Probing the gate's own sample points at 390 (`elementsFromPoint` at
   `[304,779]`, the third of nine points on the first line) returns
   `button.group.relative → div.fixed.bottom-6` on top of the `li`: the MiniVic launcher,
   `position: fixed; z-index: 10030`, whose light portrait occupies x 304–366 of a 390 px
   viewport. With every glyph masked, the gate screenshots the launcher and reads *its*
   pixels as the text's ground. Eight of the nine points sample the real ground
   (`rgb(14,14,16)`, ≈13:1); the ninth samples the chrome floating over it.
   Neither `components/MiniVicBot.tsx` nor `Experience.module.css .bullets` is touched by
   this cycle (`git diff` — the only Experience rule added is
   `p.roleHeadline .roleHeadlineOpen`), so the ratio at that pixel is identical to `main`:
   this is a pre-existing occlusion that only surfaced in the worst-ten report once the
   other 29 nodes were fixed. It is an occlusion defect in the persistent chrome, not a
   colour defect in the Experience section, and the honest fix — where a floating launcher
   is allowed to sit on a 390 px page — is a chrome decision with its own baselines and its
   own test. **It is not fixed here and TC-CONTRAST-01 @390 is left red**, named, measured
   and attributed rather than silenced: the spec was not weakened, no exemption was added,
   and no token was moved to make a red go away.

## D-9 — Only three baselines were rebaselined, and that was proved rather than assumed

`--update-snapshots` rewrites every snapshot it runs, so it rewrote seven. The four that
are not in S-6's list were restored (`git checkout --`) and the visual + overhaul render
specs re-run **without** update: `10 passed, 1 failed` (`09-visual-verify.log`). The
only failure is `listen-section` at ratio 0.04 — the Listen section is not touched by any
file in this diff, so its baseline was left exactly as it is on `main` rather than
laundered through an update run. `about-section`, `vitrine-section` and `nav-overlay-open`
all pass against their untouched baselines. The committed baseline diff is therefore
exactly the three PNGs S-6 names: `hero-section`, `hero-full`, `viewport-top-1440x900`,
each opened before committing (D-7).

## Gates, as observed

| gate | command | result |
|---|---|---|
| types | `npx tsc --noEmit` | exit 0 |
| lint | `npm run lint` | `✔ No ESLint warnings or errors`, exit 0 |
| build | `npm run build:static` | `BUILD_EXIT=0` |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | `RESULT: ALL PASS (10/10)`, exit 0 (06-audit.log) |
| targeted battery | `playwright test tests/e2e/vitrine.spec.ts tests/e2e/hero.spec.ts tests/a11y/text-contrast.spec.ts tests/overhaul/page-spine.spec.ts` | **37 passed, 1 failed** — TC-VIT-01…13 ✓, TC-HERO-01…21 ✓ (incl. TC-HERO-12), TC-CONTRAST-01 @1440 ✓, TC-CONTRAST-01 @390 ✘ (D-8) (04-tests-passing.log) |
| visual | `playwright test tests/visual tests/overhaul/render.spec.ts` | 10 passed, 1 failed (`listen-section`, untouched by this diff — D-9) |

S-5 (the full 276-spec suite in two shards) was re-assigned by the orchestrator to the
cycle-14 tester on the merged `main` (task decision 2026-09-05T06:01:51Z); it was not run
here and nothing in this file claims it was.

## Tools used

`Read` (task spec, 07-decisions.md, CSS/TSX sources, the eight `08-screens/*.png` and the
three regenerated baselines), `Edit` (`About.module.css` `.instrumentConstant`), `Write`
(`08-screenshots.mjs`, `08-montage.sh`), `Bash` (`git status/diff/checkout/add/commit`,
`npm run build:static`, `npx tsc --noEmit`, `npm run lint`,
`node scripts/validate/overhaul_static_audit.mjs`, `npx playwright test` ×4,
`python3 -m http.server 5602`, an in-tree `elementsFromPoint` probe run and deleted, and
ImageMagick `convert` for the montages).
