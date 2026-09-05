# C22 — flagship visibility (hero, about, experience)

Task `t_flagvis0a`. Owner correction, 09:10Z: *"I still cannot see flagship UI/UX for
each section."* Confirmed on live 1440 captures at `?gl=force` — the hero atmosphere was
faint, the About field and the Experience strata were not visible at all.

## What was wrong, measured

Every existing scene suite asked whether a canvas mounts, whether it is `aria-hidden`,
whether the fallback survives reduced motion. None asked whether there is anything to
look at. So the first artefact here is a gate that measures light, not markup:
`tests/overhaul/flagship-visibility.spec.ts` isolates each scene (hides every element on
the page except the slot stamped `data-scene` and its canvas), photographs the slot at
`?gl=force`, decodes the PNG with `pngjs` (already in `node_modules` — no new dependency)
and computes WCAG relative luminance per pixel against the section's own computed ground.

Baseline on the tree as it stood (`01-baseline-build.log`, `02-tests-failing.log`) — all
six cases red:

| scene | coverage ≥ ground+0.06 | peak | reduced-motion still |
|---|---|---|---|
| hero atmosphere | under the 15% floor | — | 0.00% |
| about compass field | 0.00% | 0.017 | 0.00% |
| experience strata | 0.00% | 0.017 | 0.00% |

`0.017` peak luminance is about `#0F0F0F` on `#0A0A0A`. The owner was right: the scenes
were shipped and invisible.

## What changed

* **`components/gl/Scene.tsx`** — a `sceneId` prop stamped on the slot as `data-scene`.
  CSS-module class names are hashed in a production export, so nothing outside the
  component could address a scene slot; the gate (and every later lane that wants to
  measure a scene) needs that handle, so it is part of `Scene`'s contract rather than
  re-derived per section.
* **Hero (`atmosphere.glsl.ts`, `Hero.module.css`)** — volumetric shafts from the upper
  left, fog with real density variation, a pool behind the name and the portrait plate,
  pointer parallax. The no-GL still is the same structure in tokens.
* **About (`field.glsl.ts`, `About.module.css`)** — ten luminous sectors, the active one
  lit at its core, an entry sweep, slow rotation coupled to the compass index.
* **Experience (`strata.glsl.ts`, `Experience.module.css`)** — the bands became strata:
  the duty cycle went from 6% to two thirds of each period, the constant `0.85` alpha
  (a second, permanent attenuation on a field already too dark to see) was dropped, the
  edge dissolve came in from 16% to 10%, and the key from the left carries real weight.
  The bars stay the brightest objects in the section.

## Results (`04-tests-passing.log`, all at `?gl=force`, 1440×900, DPR 1)

| scene | coverage (≥15%) | peak (≥0.35) | motion (≥0.004) | still (floor) |
|---|---|---|---|---|
| hero atmosphere | 96.55% | 0.8308 | 0.01610 | 17.86% (8%) |
| about compass field | 44.91% | 0.6654 | 0.02454 | 35.29% (8%) |
| experience strata | 33.28% | 0.8070 | 0.06592 | 4.11% (2%) |

## Decisions

1. **The gate is parameterised, not hard-coded.** Adding `#skills`, `#vitrine` or
   `#listen` to the `SCENES` array is the whole cost of holding those scenes to the same
   bar. That is how the later lanes are meant to use this file.
2. **Contrast beat brightness twice, and both times in writing.**
   * The hero's first still lifted the ground under the reading column to `#404040` at
     1440 and `#525252` at 390; `--mist-400` on those is 3.25:1 and 2.45:1, and
     `tests/a11y/text-contrast.spec.ts` caught it because it samples *composited* pixels
     and loads the page without `?gl=force` — so that gradient is exactly what it
     photographs. The fix is a scrim as the first background layer (and a full-frame one
     under 700 px, where the copy is the whole frame): the reading column is dark ground
     again by the time a glyph is drawn on it. The still still covers 17.86%.
   * `#experience` is the one section held to a **2%** fallback floor instead of 8%
     (`fallbackCoverageMin`, justified in the spec and in the CSS). `.axisTick` is
     `--ink-300` (4.81:1 on the ink — its ground may not pass 0.007 relative luminance)
     and `.trackYears` / `.openNote` are `--mist-400` (6.20:1 — a ground of 0.023). Both
     ceilings sit under the 0.04 the gate asks for, so the bright surface is placed in
     the one band of the slot that carries no text at all — the chart's own top padding
     plus the 6% the slot overhangs into the header's bottom margin. Lighting the rest
     would take the dates and the axis under AA. The shader path, which a reader with
     WebGL and motion enabled actually sees, meets the full bar unchanged.
3. **No new dependency, no new asset.** The PNG decode uses `pngjs`, which arrives with
   the Playwright toolchain; `tests/helpers/pngjs.d.ts` is the local type declaration.
4. **Budget unchanged.** One `ScreenQuad` per scene, ≤ 3 noise lookups per pixel (+1 for
   grain), DPR still capped, context-loss handling untouched, canvases still
   `aria-hidden` behind the content.

## Gates

| gate | result |
|---|---|
| specs red before | 6 failed (`02-tests-failing.log`) |
| flagship-visibility + text-contrast | 8 passed, exit 0 (`04-tests-passing.log`) |
| section suites (hero/about/experience e2e, scene-about, scene-experience, cinematic, monochrome) | 88 passed, exit 0 (`05b-section-suites.log`) |
| `npx tsc --noEmit` | exit 0 |
| `npm run lint` | `✔ No ESLint warnings or errors`, exit 0 |
| `node scripts/validate/overhaul_static_audit.mjs` | `RESULT: ALL PASS (10/10)`, exit 0 |
| `npm run build:static` | exit 0 (`05a-build-experience.log`) |
| screenshots | `08-screens/`, 15 frames, largest 127 kB |

## Tools used

Bash (git, npm, npx playwright, node, python3 for the CSS/GLSL edits, `python3 -m
http.server` on 127.0.0.1:5602), Read (the captured frames), Playwright via
`playwright-core` with `channel: 'chrome'` and
`--no-sandbox --use-gl=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`
for the `?gl=force` captures. No MCP server was used.
