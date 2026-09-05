# t_nojs01 — the page paints without JavaScript

Lane: analyst-programmer · branch `worktree-wf_c3c62ccc-f72-1` · static export served on
`http://127.0.0.1:5621` · every figure below comes from a command in this directory.

## 1. What reproduced, and what did not

The finding (G-H2a, `../G-H2a/09-js-blocked-1440.png`) is a JS-disabled load of the
export painting only "Loading portfolio" with `#hero` at 0×0.

**On this tree, before any change, it did not reproduce.** The export built from
`5a8c8c3` and probed at 1440 with `javaScriptEnabled: false` painted the hero in full:

| | before the change | after |
|---|---|---|
| `#hero` box at 1440×900 | 1440 × 1329 | 1440 × 1329 |
| `#hero` box at 390×844 | 390 × 1490 | 390 × 1490 |
| six section headings painted | yes | yes |
| `.loading-shell` in the DOM | absent | absent |

Byte analysis of that same `out/index.html`:

```
len 123908 · </head> 4374 · <main 6564 · id="hero" 6589 · <h1 6958 · <footer 112308
<!--$?-->                0    (pending Suspense boundary)
<template id="B:n">      0    (streaming insertion point)
$RC(                     0    (client-side content swap)
<div hidden id="S:n">    0    (page markup behind the swap)
loading-shell            1    — inside a self.__next_f.push() flight string at 121063,
                              never as a rendered class attribute
```

So the boundary resolved before React flushed the shell and emitted no fallback. The
mechanism the finding describes is real and the photograph is real; the tree it was
photographed on is not this one. G-H2a's own build predates `87c9667`, which is where
`app/loading.tsx` stopped being a `'use client'` component with a `<style jsx>` block.

## 2. The decision: (a), remove `app/loading.tsx`

Removed, with its styles, rather than kept as a non-Suspense overlay.

**Why (a).** Nothing on this route suspends by design. `app/page.tsx` is a client
component with no async data; `app/layout.tsx` awaits nothing; the export is fully
prerendered (`○ (Static) prerendered as static content`). The boundary therefore covers
nothing — and §1 measures exactly that: it fired zero times. What it *does* do is make
the no-JS guarantee conditional on the import graph. One `await` in a server component,
one `next/dynamic` that suspends during the prerender, and the shell flushes early
again, precisely as it did on the tree G-H2a built — and nothing in the suite would have
said so, because every other spec runs with script enabled. With no fallback to flush,
React cannot emit an incomplete shell: it holds the shell until the tree resolves. The
guarantee stops being an accident and becomes a property of the export.

**Why not (b).** A preloader as a non-Suspense overlay hides content until a script
removes it — the same defect for the same reader, one layer higher. The preloader was
also deleted deliberately in the rebuild: `tests/e2e/hero.spec.ts` TC-HERO-10 asserts it
stays gone and `app/page.tsx` records why. Re-adding a curtain in front of a page that
already paints would be a regression dressed as UX.

**What removing it cost.** The `.loading-*` rules in `app/globals.css` became dead and
were deleted in the same commit (TC-NFR-DEADCSS fails on a rule whose classes no source
can render). Those rules were `87c9667`'s CLS fix, so CLS was re-measured on unskipped
cold boots rather than assumed — §3. The page's own reservation, `.page-frame`, is
untouched, and the footer-before-main inversion the rules were fighting belonged to the
streaming shell and went with the boundary (`<main>` 6564 ahead of `<footer>` 112308).

## 3. Gates

| gate | command | result |
|---|---|---|
| TDD red | `npx playwright test tests/e2e/no-js.spec.ts` (before) | `02-tests-failing.log` — 2 failed (TC-NOJS-03 "the loading shell", TC-NOJS-04 "app/loading.tsx exists"), 2 passed |
| TDD green | same (after) | `04-tests-passing.log` — 4 passed |
| types | `npx tsc --noEmit` | `03a-tsc.log` — exit 0 |
| lint | `npm run lint` | `03b-lint.log` — no warnings or errors |
| build | `npm run build:static` | exit 0, secret scan PASS |
| audit | `node scripts/validate/overhaul_static_audit.mjs` | `05-static-audit.log` — ALL PASS (10/10) |
| no-JS + perf + first paint | `npx playwright test tests/e2e/no-js.spec.ts tests/perf/performance.spec.ts tests/overhaul/hero-first-paint.spec.ts --workers=1` | `06-nojs-perf-firstpaint.log` — 22 passed |
| hero + cinematic + render | `npx playwright test tests/e2e/hero.spec.ts tests/e2e/hero-fold.spec.ts tests/overhaul/cinematic.spec.ts tests/overhaul/render.spec.ts --workers=1` | `07-hero-cinematic-render.log` — 50 passed |

CLS, PERF-08, nine unskipped cold loads with layout-shift sources listed
(`06-nojs-perf-firstpaint.log`):

```
1280x720  load 0/1/2 : 0.00000  0.00000  0.00000
1440x900  load 0/1/2 : 0.00000  0.00000  0.00000
390x844   load 0/1/2 : 0.00000  0.00000  0.00000
```

LCP 668 ms against the 2.5 s budget (PERF-02); the LCP entry is the hero portrait
`IMG` at 768 ms, not a deferred WebGL layer (PERF-07). PERF-06 — the hero LCP element
paints from static HTML with JS and WebGL blocked — green.

## 4. The screenshots

`09-js-blocked-1440.png` and `09-js-blocked-390.png` are the same probe that produced
G-H2a's photograph, taken against this build: hero name, role line, statement, both
actions and the decoded photograph, with script disabled.
