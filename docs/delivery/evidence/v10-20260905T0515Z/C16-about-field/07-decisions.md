# c16 — `#about` flagship: a GLSL compass field behind the SVG rose

**Task** `t_4e30d620` · **Role** analyst-programmer (coding, level 2, effort xhigh)
**Worktree** `/root/forgotten-mistory/.claude/worktrees/wf_697f0e83-f46-1` ·
**Branch** `worktree-wf_697f0e83-f46-1` · **Base** `d6396d203cafd6a7dfb1432d751a5845d1614af6`
**Port** 5601 (`python3 -m http.server 5601 --directory out --bind 127.0.0.1`)
**Requirements** SPEC-v10 §R2 (≥7 signature GLSL scenes), M1 (one flagship per section),
M6 (`#about`'s beat), task card `artifacts/kanban/tasks/t_4e30d620.md`.

---

## What was built

| File | What it is |
|---|---|
| `components/sections/About/field.glsl.ts` | The fragment/vertex pair. One full-screen quad, ten sectors of light, three value-noise lookups per pixel plus one hash for grain. |
| `components/sections/About/AboutField.tsx` | The R3F child: uniforms, the 720 ms intensity ramp, the eased rotation, and the context-loss handler. |
| `components/sections/About/About.tsx` | Mounts the field through `components/gl/Scene.tsx`, inside `.instrumentStage`, behind the rose. |
| `components/sections/About/About.module.css` | `.field` / `.fieldSlot`, and `z-index` on the stage's SVG so the engraving is always over the light. |
| `tests/overhaul/scene-about.spec.ts` | Six binary cases, written before the implementation (`02-tests-failing.log`). |

## The decisions

**1. The field draws the rose's own sectors, not a second instrument.**
`#experience` already made the other mistake once: a 3-D copy of the DOM chart, slightly
misaligned, read as a rendering bug (`components/sections/Experience/strata.glsl.ts`,
its own header says so). So the shader's geometry is deliberately the compass's geometry —
`SECTORS = 10`; the lit annulus is the same band of radii the SVG's sector ring occupies
(22 → 41 of a 100-unit face); and `uRotation` is the *identical* angle, in radians, that
`Compass.tsx` applies in degrees (`-index * 36°`). The field turns under the engraving in
lockstep instead of drifting against it.

**2. One index, from cycle 12's scroll-drive.** `About.tsx` already computes `active`
(hover overriding the centre-band IntersectionObserver). The field is handed the same
number the rose is — there is no second observer and no second source of truth, which is
what TC-SCENE-ABOUT-03 asserts through the `data-axis` attribute on the slot. The About
copy and the Compass semantics were not touched: all twelve `TC-ABOUT-*` cases and the
whole monochrome suite stayed green (`04-tests-passing.log`).

**3. Light only, never ink.** `CareerStrata` writes `vec4(colour, uIntensity * 0.85)` and
paints ink over the whole slot. Doing that here would have erased `.instrumentStage`'s own
radial pool of light. The field's alpha follows its luminance instead, so where the field
is dark it paints nothing at all.

**4. The slot is exactly the stage, and never wider.** The first arrangement bled the slot
past the stage to halo the instrument; at 390 px that made the canvas wider than the column
and would have given the page a horizontal scrollbar. The light belongs under the rose's
sector ring anyway. Recorded in `About.module.css` beside `.field`.

**5. Reduced motion and no-WebGL were designed for first, not patched in.** `Scene.tsx`
mounts nothing when either applies, so a reader who asked for reduced motion never has a
context allocated for them at all. Proven: TC-SCENE-ABOUT-04 (0 canvases, 138 drawn SVG
elements still present, ten dimensions, "Ten axes · no scores") and TC-SCENE-ABOUT-05
(`getContext('webgl'|'webgl2')` stubbed to `null`; 0 canvases, 0 page errors). Both pass.

**6. Context loss fades the field out rather than freezing it.** A lost context leaves the
browser presenting the last frame — a bright ring frozen under an instrument that is still
turning. `AboutField.tsx` listens for `webglcontextlost` / `webglcontextrestored` and ramps
`uIntensity` down over 360 ms and back up over 720 ms.

**7. Monochrome.** Colour comes only from `lib/palette.ts` (`ink900`, `white`). The site's
one accent means "this figure has a source", and a field of light is not a figure — asserted
at source level by TC-SCENE-ABOUT-06 together with the ≤ 3 noise-lookup fill budget, the
`ScreenQuad` (one quad, no mesh) and the context-loss listener. DPR stays capped at
`[1, 1.75]` by `components/gl/GLCanvas.tsx`; nothing here raises it.

---

## The blocker found, and it is not this change

**TC-SCENE-ABOUT-01, -02 and -03 cannot pass on this host, and the cause predates c16.**

At `?gl=force` the page does not render at all — it falls into `app/error.tsx` with:

```
TypeError: Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')
  at _next/static/chunks/904.66d19854a4ab6d3a.js
```

`@react-three/fiber@8.18.0`'s reconciler reads `React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`,
which React 19 removed. `package.json` declares `react@18.2.0` (`npm ls react` shows a single
deduped 18.2.0 tree) but the client bundle is built by `next@15.5.25`, which vendors React 19.
So **no** scene can mount: not `#about`'s, not `HeroAtmosphere`, not `CareerStrata`.

This was verified against a clean baseline, not inferred. The c16 change was stashed
(`git stash push -u`), `npm run build:static` re-run, and the same probe re-run:

```
BASELINE(main, no c16 change): {"sections":[],"canvases":0}
console: TypeError: Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')
```

`tests/overhaul/render.spec.ts -g TC-RENDER-01` — the pre-existing test that asserts the
existing hero and experience scenes mount — also fails on this build, for the same reason.
`git log --oneline -3 -- package.json` puts the cause at `18c6beb chore(deps): next 15.5.25`.

Two consequences worth stating plainly:

- SPEC-v10's P-2 figure of `canvases: 1` for `#hero` and `#experience` was measured against
  the **live** site (`build-commit 07e80f5f`), which predates the Next 15.5.25 commit. On
  `main` today that number is 0 for every section.
- On a normal load nothing breaks, because `useGLCapability` classifies this GPU-less VPS as
  `unsupported` and mounts no canvas — which is why the regression went unseen. A visitor on
  real GPU hardware would take the crash.

**Remaining step (one, and it is a dependency change, not a `#about` change):** reconcile the
React major that `@react-three/fiber` sees with the one `next@15.5.25` vendors — upgrade
`@react-three/fiber` to v9 and `@react-three/drei` to v10 with `react@19`/`react-dom@19`, or
pin `next` back below 15. Then re-run
`PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 npx playwright test tests/overhaul/scene-about.spec.ts`
and TC-SCENE-ABOUT-01/-02/-03 exercise the shader as written. Nothing in this commit needs
to change for that to happen.

---

## Gates

| Gate | Command | Result |
|---|---|---|
| spec red before | `npx playwright test tests/overhaul/scene-about.spec.ts` | 5 failed, 1 passed (`02-tests-failing.log`) |
| spec green after | same | 3 passed, 3 failed — the three blocked by the R3F/React mismatch above (`05-battery-scene-about-final.log`) |
| `tsc` | `npx tsc --noEmit` | exit 0 (`05-battery-tsc.log`) |
| `lint` | `npm run lint` | `✔ No ESLint warnings or errors`, exit 0 (`05-battery-lint.log`) |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | `RESULT: ALL PASS (10/10)`, exit 0 (`05-battery-audit.log`) |
| build | `npm run build:static` | `RESULT: PASS — no credential material in the emitted bundle` (`05-battery-build.log`) |
| section suites | `npx playwright test tests/e2e/about.spec.ts tests/monochrome` | 24 passed, 0 failed (`04-tests-passing.log`) |
| screenshots | 1440 / 1280 / 834 / 390 + reduced motion | `08-screens/*.png`, each ≤ 288 kB |

Screenshots are of the fallback path, because this host cannot render the scene at all (see
the blocker). The reduced-motion capture reports `#about canvases: 0` from the same run.

## Tools used

`Read`, `Write`, `Edit`, `Bash` (`git`, `npm ci`, `npm run build:static`, `npm run lint`,
`npx tsc --noEmit`, `npx playwright test`, `node scripts/validate/overhaul_static_audit.mjs`,
`node -e` with `playwright` for the baseline probe and the screenshots, `python3` +
`PIL` to quantise the PNGs under the 400 kB cap, `python3 -m http.server` on port 5601),
`ToolSearch`, `Monitor` (schema only). No paid API was called. No secret was read or printed.
