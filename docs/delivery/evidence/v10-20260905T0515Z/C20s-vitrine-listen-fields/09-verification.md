# 09 — independent verification, c20 scenes 5 + 6 (`#vitrine`, `#listen`)

**Reviewer:** third-party adversarial review, level 1, effort max. Independent of the author; no
number below is copied from `03-probe.json`, `04-tests-passing.log` or the implementer's report.
**Branch:** `worktree-wf_a2f5922d-8e7-1` · **HEAD:** `71fb1e2a6ab21cf8b096585324a1439f617c1b4f`
**Under review:** `1150e3e` (`feat(vitrine)`), `d53d228` (`feat(listen)`), `71fb1e2` (evidence).
**Method:** `rm -rf out .next && npm run build:static` in the author's worktree, `out/` served by
`python3 -m http.server 5602 --directory out --bind 127.0.0.1`, every suite and probe re-run against
that server. WebGL is only reachable on this host at `?gl=force` with
`--no-sandbox --use-gl=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.

## Verdict: **PASS**, with five findings, none of them blocking

Every gate the implementer claimed reproduces, and every acceptance line in SPEC-v10 §R2 / c20,
R-c13 **M-2** (`#vitrine`, `#listen` halves), **MOT-C13-03** and **MOT-C13-06** is met on a build I
produced myself. The findings are two stale comments, one evidence-encoding defect, one cascade
fragility and one fill-rate note for `c20c`.

## Gates — the literal exit codes and summary lines observed

| gate | command | observed | exit |
|---|---|---|---|
| build | `npm run build:static` | `RESULT: PASS — no credential material in the emitted bundle.` | 0 |
| types | `npx tsc --noEmit` | no diagnostics | 0 |
| lint | `npm run lint` | `✔ No ESLint warnings or errors` | 0 |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | `RESULT: ALL PASS (10/10)` | 0 |
| section suites | `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5602 npx playwright test tests/overhaul/scene-vitrine.spec.ts tests/overhaul/scene-listen.spec.ts tests/e2e/vitrine.spec.ts tests/e2e/listen.spec.ts` | `36 passed (56.7s)` | 0 |
| monochrome + gold contrast | `… npx playwright test tests/monochrome tests/a11y/gold-contrast.spec.ts` | `17 passed (33.4s)` | 0 |
| probe A | `node …/09-verify-probe.mjs` | wrote `09-verify-probe.json` | 0 |
| probe B | `node …/09-verify-probe2.mjs` | wrote `09-verify-probe2.json` + `09-screens/` | 0 |

Logs: `09-build.log`, `09-tsc-lint-audit.log`, `09-tests-sections.log`,
`09-tests-monochrome-a11y.log`. The 36 passing tests are `TC-SCENE-VITRINE-01…08`,
`TC-SCENE-LISTEN-01…06`, `TC-VIT-01…13` and `TC-LISTEN-01…08` — each id appears in
`09-tests-sections.log`, so the two new specs did not displace the existing suites.

## Acceptance, re-measured

**M-2, `#vitrine` and `#listen` halves — one canvas each, only where it is earned.**
At `?gl=force`, `#vitrine` centred and again `#listen` centred, at 1440×900 and 390×844:
`{vitrine: 1, listen: 1}`, `hero/about/experience/skills: 0`, `pageErrors: []`,
`consoleErrors: []` (`09-verify-probe.json.glForce1440`, `.glForce390`). The canvas is inside
`aria-hidden="true"` (`Scene`'s slot), `position: absolute`, in a wrapper at `z-index: 0` under the
rail at `z-index: 1` and, in `#listen`, under `.inner` at `z-index: 1`.

**The scene is never the content.** `reducedMotion: 'reduce'` at 1440 and 390:
`0` canvases page-wide, `document.getAnimations()` running count `0`, the caliper jaw's
`animation-duration` and `transition-duration` both `0s`, six SVG drawings still in `#vitrine` with
all `72` strokes at `stroke-dashoffset: 0`, four `#listen` anchors present. With `webgl`/`webgl2`
refused by `getContext`: `0` canvases, `0` page errors, `0` console errors, `h1 = "Vikram
Deshpande"`, `6` `section[id]`, no error boundary, six `#vitrine` SVGs and one `#listen` SVG
(`.reduce1440`, `.reduce390`, `.noGL1440`).

**MOT-C13-03 — the trace reads as a trace.** 1440, `#vitrine` entered, the 25-stroke plate:
`transition-duration 320 ms`, last `transition-delay 520 ms` (acceptance 480–560), smallest gap
between consecutive delays **21.666 ms** (floor 20), lands at **840 ms** (budget 900), every stroke
finishing at `stroke-dashoffset: 0` (`09-verify-probe.json.stagger.plates[0]`). Closed.

**MOT-C13-06 — the rail travels.** Addressed by the scroller itself (`ol.Vitrine_rail__UCX1h`, not
the `.railStage` wrapper): `scroll-behavior` is `smooth` at 1440 **and** 390 under no-preference and
`auto` under `prefers-reduced-motion: reduce`; `scroll-snap-type` stays `x mandatory` in all four
runs; `scrollWidth/clientWidth` 3192/1440 and 2140/390 (`09-verify-probe2.json`). Closed.

**Uniforms bound to the section's own state, not to a clock.** Centring plate 03 inside the rail
moves `data-lit-index` from `0` to `2` and the single `[data-lit]` plate from accession `01` to `03`
at both widths, including under reduced motion. `#listen`'s field carries `data-close="closed"` after
entry and `animation-name: none` — the CSS caliper beat remains the section's only beat (MOT-F-4).

**Monochrome, gold only as a claim.** Walking every element's `color`, `background-color`, painted
border/outline colours, `fill` and `stroke` against all four gold tokens: `#vitrine` has exactly
**three** gold elements at 1440 and at 390 — the three `.live` anchors
(`aether.srv1356245.hstgr.cloud`, `abentertainment.com.au`, `forgotten-mistory.web.app`), gold on
`color` only. `#listen` has **zero**. Neither shader source names gold, and `tests/monochrome` +
`tests/a11y/gold-contrast.spec.ts` are green.

**Cost.** First Load JS for `/` is **189 kB** before (`01-baseline-build.log`, build-stamp
`a211df9a` — the parent commit) and **189 kB** after (`09-build.log`, build-stamp `71fb1e2a`):
**+0 kB**. The route's own bundle moves 29.9 kB → 30.3 kB for the two `dynamic()` wrappers; shared
chunks 87.6 kB unchanged. `git diff --name-only a211df9a..HEAD` touches no `package*.json` and adds
no file under `public/` — no new dependency, no new network asset. Three `noise()` calls in the
`#vitrine` fragment program, two in `#listen`'s, one `ScreenQuad` each, DPR capped by `GLCanvas`.

## What the fields actually look like

Measured, not asserted: identical build, viewport and scroll position, WebGL on versus
`getContext('webgl')` returning `null`, `compare -metric RMSE` over the pair
(`09-screens/`, all sRGB TrueColor):

| frame | RMSE (normalised) | reading |
|---|---|---|
| `#vitrine` 1440 | 0.00159 | present, very quiet |
| `#listen` 1440 | 0.00575 | present, the strongest of the four |
| `#vitrine` 390 | 0.00100 | present, at the threshold of visibility |
| `#listen` 390 | 0.02938 | inflated — the MiniVic launcher video is on a different frame in the two captures; the field's own contribution is of the 1440 order |

**`#listen` at 1440** (`08-screens/gl-force-listen-1440.png`): a soft horizontal band of light lies
across the section at the caliper's own height, widest at the spine and gone at both gutters. It
reads as bench light under an instrument that has been set down — which is the section's story, not
a decoration bolted to it. The pull-quote stays the brightest thing on the screen and the four
contact lines are unchanged; nothing about the field competes for the eye.

**`#listen` at 390** (`gl-force-listen-390.png`): the same band, narrower and quieter, sitting behind
the pull-quote and the rule. Type is unambiguously primary; the light never touches a glyph's
contrast.

**`#vitrine` at 1440** (`gl-force-vitrine-1440.png`): a shallow pool under the cabinet, centred on
plate 01, dying before the rail's hairline rule and before its own canvas edge — no visible canvas
rectangle. It reads as the room the cabinet stands in rather than a seventh plate. Quiet to the point
of austerity; the cards, the drawings and the "LIMITS" copy are the whole of the reading.

**`#vitrine` at 390** (`gl-force-vitrine-390.png`): the faintest of the four — a slight lift around
plate 01's edges and a vertical gradient behind it. Correct in kind, close to imperceptible in
degree; on a phone this earns its WebGL context mostly on principle.

## Findings

**F-1 (evidence, should fix) — the two 1440 `gl-force` frames in `08-screens/` are 8-bit
greyscale.** `identify` reports `Gray depth=8 type=Grayscale` for `gl-force-vitrine-1440.png` and
`gl-force-listen-1440.png`, while all six other frames are `sRGB … TrueColor`. They were re-encoded
to get under the folder's 400 kB convention. The cost is exactly the thing this site cares about: in
`gl-force-vitrine-1440.png` the live repo URL renders grey, and in its `no-gl` counterpart it renders
gold — so the pair reads as though the shader removed the site's one accent, which it does not
(measured above: three gold elements with the field on). Those two frames cannot be used to judge
monochrome compliance. Re-capture in colour; `09-screens/vitrine1440-gl-on.png` (347 kB) and
`listen1440-gl-on.png` (427 kB) show a colour capture fits under 500 kB unaided.

**F-2 (comment vs code, minor) — `ListenField.tsx:106-112` claims a behaviour it does not
implement.** The comment says "if the mount is late, arrive already closed"; the code advances
`elapsed` from `0` whenever `closed` is true, so a field that mounts after the beat has run ramps
`uClose` 0 → 1 over `CLOSE_SECONDS` again. In the ordinary path `Scene`'s `rootMargin: 50%` mount
precedes the `threshold: 0.4` close, so the two run together and nothing is visible; the divergence
only shows for a reader who lands on `#listen` directly and whose idle callback is late. One line
fixes it — seed `elapsed.current = CLOSE_SECONDS` on the first frame when `closed` is already true.

**F-3 (stale doc, minor) — `Listen.module.css:4-6` still reads "The section carries no scene, no
chart and no card."** It carries a scene as of `d53d228`. In this repo the comments are the design
record; leaving that sentence in place will mislead the next agent that greps for which sections have
scenes.

**F-4 (cascade fragility, minor) — MOT-C13-06 is implemented by ordering, not by a guard.**
`Vitrine.module.css:89` sets `scroll-behavior: smooth` unconditionally; `auto` for reduce comes only
from the later `@media (prefers-reduced-motion: reduce)` block. The acceptance passes (measured
above), but the review's Direction asked for the `smooth` to sit inside
`@media (prefers-reduced-motion: no-preference)`. As written, reordering or deleting the reduced-motion
block silently gives reduce users an animated rail. No test pins the reduce side of this at 1440.

**F-5 (fill rate, for `c20c`) — two canvases are now live at once, at rest.** With `#vitrine`
centred, and again with `#listen` centred, the page-wide canvas count is **2** at both 1440 and 390
(`{vitrine: 1, listen: 1}`). The two sections are adjacent and short enough that both sit inside
`Scene`'s 50% `rootMargin`, so this is the documented "occasionally two mid-scroll" becoming two at
rest. R-c13 M-2 recorded "at most one canvas is live at a time" as the prior state; that sentence is
no longer true. Nothing here is a defect — both programs are one `ScreenQuad` with ≤3 noise lookups
and DPR ≤ 1.75 — but the 60 fps proof `c20c` owes R2 must sample this pair together, not each scene
alone.

## Reproduce

```bash
cd /root/forgotten-mistory/.claude/worktrees/wf_a2f5922d-8e7-1
rm -rf out .next && npm run build:static
python3 -m http.server 5602 --directory out --bind 127.0.0.1 &
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5602 npx playwright test \
  tests/overhaul/scene-vitrine.spec.ts tests/overhaul/scene-listen.spec.ts \
  tests/e2e/vitrine.spec.ts tests/e2e/listen.spec.ts
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5602 npx playwright test tests/monochrome tests/a11y/gold-contrast.spec.ts
npx tsc --noEmit && npm run lint && node scripts/validate/overhaul_static_audit.mjs
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5602 node docs/delivery/evidence/v10-20260905T0515Z/C20s-vitrine-listen-fields/09-verify-probe.mjs
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5602 node docs/delivery/evidence/v10-20260905T0515Z/C20s-vitrine-listen-fields/09-verify-probe2.mjs
fuser -k 5602/tcp
```
