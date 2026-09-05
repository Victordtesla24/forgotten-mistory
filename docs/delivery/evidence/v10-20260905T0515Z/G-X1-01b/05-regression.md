# G-X1-01b — regression battery (t_x1_01b)

```
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5625 npx playwright test \
  tests/overhaul/flagship-visibility.spec.ts tests/a11y/text-contrast.spec.ts \
  tests/overhaul/hero-first-paint.spec.ts --workers=1
→ 30 passed, 8 failed (8.0m)   [05-regression.log]
```

**Every scene this lane changed is green, and every scene that failed is one this
lane did not touch.**

## The floors, on the changed scenes (flagship-visibility)

Floors: coverage ≥ 15%, peak ≥ 0.35, motion (mean |dL| over 1.5 s) ≥ 0.004.

| scene | 1440 coverage / peak / motion | 390 coverage / peak / motion |
|---|---|---|
| hero | 46.63% / 0.8308 / 0.02881 | 100.00% / 0.8308 / 0.03526 |
| about | 46.98% / 0.6514 / 0.01466 | 45.87% / 0.4179 / 0.01495 |
| experience | 25.77% / 0.8308 / 0.02970 | 37.02% / 0.8308 / 0.03811 |
| skills | 34.66% / 0.5029 / 0.01477 | 44.31% / 0.4910 / 0.00711 |

Each of the eight is above its floor with margin, and the reduced-motion stills
(`TC-FLAGSHIP-VIS-STILL-*`) passed for all four as well — they are CSS, and this
change cannot reach them.

## Text contrast — both paths, both widths, all four green

`TC-CONTRAST-01 @ 1440`, `@ 390` (no-GL path) and `TC-CONTRAST-02 @ 1440`, `@ 390`
(over the live shaders) all passed. Half-resolution light does not put a text node
below AA: the scrim in `atmosphere.glsl.ts` and `.stage::after` are unchanged and
the light they grade is the same light.

## Hero first paint and scrim

`TC-HERO-FIRSTPAINT-01/02/02b/03` and `TC-HERO-SCRIM-01` passed on both paths and
both widths — the poster is untouched (no shader source was edited), and the scrim
still holds the reading column:

```
[TC-HERO-SCRIM-01] 1440 gl:    under_type=0.0898  lit_window=0.4406  delta=0.3508
[TC-HERO-SCRIM-01] 390  gl:    under_type=0.2074  lit_window=0.4362  delta=0.2288
[TC-HERO-SCRIM-01] 1440 still: under_type=0.0630  lit_window=0.3167  delta=0.2537
[TC-HERO-SCRIM-01] 390  still: under_type=0.1331  lit_window=0.2067  delta=0.0736
```

## The eight failures are the vitrine and listen fields (S5/S6), not this lane

```
TC-FLAGSHIP-VIS-VITRINE @ 1440 / @ 390
TC-FLAGSHIP-VIS-LISTEN  @ 1440 / @ 390
TC-FLAGSHIP-VIS-STILL-VITRINE @ 1440 / @ 390
TC-FLAGSHIP-VIS-STILL-LISTEN  @ 1440 / @ 390
```

Those two scenes arrived from `origin/main` mid-lane (192d743, "vitrine and listen
fields carry sceneIds and are held to the flagship floors (S5, S6) — **checkpoint**")
and are the live subject of a parallel lane. This lane did not edit
`vitrine.glsl.ts`, the listen field, or either section, and neither `<Scene>` passes
`resolutionScale`, so both render at exactly the resolution they did before:
`resolutionScale` defaults to 1 and `renderResolution(1)` returns
`min(devicePixelRatio, 1.75)` — the same value `dpr={[1, 1.75]}` produced at the
harness's dsf 1 and dsf 3. They were not green before this commit and they are not
green after it; they belong to S5/S6.

(The one behavioural difference the default carries: on a display reporting a device
ratio *below* 1 — a zoomed-out desktop browser — the old array form clamped up to 1
and the new form does not, so such a display now renders the scene at its own ratio
rather than above it. No test viewport is in that range, and rendering more pixels
than the display has was never the intent of a cap.)
