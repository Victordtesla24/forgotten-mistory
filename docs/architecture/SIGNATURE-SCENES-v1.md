# SIGNATURE-SCENES-v1 — architecture to MEET R2 / R5 / §0.3-1 / G-H2

**Task:** `t_g_h2` (ADV-FAIL P0, lane G-H2 / G-X1) · **Author:** solutions-architect (§5, effort max)
**Date:** 2026-09-05 · **Baseline:** `bdf4edc4` / `9ba97a5c` · **Contract:** `docs/prompt.md` (sole SoT)
**Status:** binding architecture. No implementation in this document; no Owner decision parked (§0.1).

---

## 0. Failures first (§10.1)

Everything below is measured in this session. Commands and outputs are named inline; nothing is estimated
unless the line says **[ESTIMATE]**.

| # | Failure | Evidence (this session) |
|---|---------|-------------------------|
| F1 | **HyperFrames is absent.** R2 names it explicitly; `package.json` has zero HyperFrames packages. | `python3 -c "json.load(open('package.json'))"` → deps: `@radix-ui/react-slot, @react-three/drei 10.7.8, @react-three/fiber 9.7.0, @types/three, class-variance-authority, clsx, framer-motion 11.18.2, lucide-react, next 15.5.25, react 19.2.8, react-dom, tailwind-merge, three 0.165.0`. No `hyperframes*`. |
| F2 | **GSAP + ScrollTrigger is absent.** §2.1 names it as the cinematic motion layer. Only *comments* reference it. | `grep -rn "gsap\|ScrollTrigger" package.json components/ app/ lib/` → 5 hits, all prose/CSS comments (`app/globals.css:1332,1343`, `lib/voiceoverContext.tsx:116,119,125`). Zero library. |
| F3 | **First paint is blank of GL.** `Scene` gates on `capability === 'supported' && allowMotion && near && pageSettled`; `pageSettled` waits for `window.load` *then* `requestIdleCallback`. | `components/gl/Scene.tsx:216` (`const show = …`), `:176-200` (`settle()`). The hero's flagship is structurally unable to be in the first frame. |
| F4 | **Hero scrim is a 0.86 wash over the whole frame**, not a graded text plate. | `components/sections/Hero/Hero.module.css:157` `rgb(10 10 10 / 0.86) 44%`, `:171` `linear-gradient(90deg, rgb(10 10 10 / 0.86), rgb(10 10 10 / 0.86))`. |
| F5 | **Only 3 of 7 scenes are measured at all.** `flagship-visibility.spec.ts` parameterises over `SCENES` = hero-atmosphere, about-field, career-strata. | `tests/overhaul/flagship-visibility.spec.ts:138-147`. |
| F6 | **Vitrine and Listen scenes have no `sceneId`** — they are structurally unmeasurable by the flagship gate. | `grep -rn 'sceneId=' components/` → 3 hits only: `Experience.tsx:148 career-strata`, `About.tsx:170 about-field`, `Hero.tsx:35 hero-atmosphere`. `Listen.tsx:161` mounts `<Scene className={styles.fieldSlot}>` with no id; `Vitrine.tsx` the same. |
| F7 | **Skills scene exists but is uncommitted.** `BenchField.tsx` + `bench.glsl.ts` live only in worktree `wf_c06ca2f9-9de-1`; it *does* mount correctly through `Scene` with `sceneId="skills-bench"`. | `ls .claude/worktrees/wf_c06ca2f9-9de-1/components/sections/Skills/` → `BenchField.tsx bench.glsl.ts`; `Bench.tsx:304` `<Scene className={styles.fieldSlot} sceneId="skills-bench">`. |
| F8 | **No scene is R5-audited.** No test sets a 3840×2160 viewport, and the DPR cap is `[1, 1.75]`. | `components/gl/GLCanvas.tsx:28` `dpr={[1, 1.75]}`. `grep 'test(' tests/perf/performance.spec.ts` → PERF-01…07, none at 4K, none measuring rAF. |
| F9 | **Both avatar rasters fail R5 by a factor of 3–6 in each axis.** | `ffprobe … public/assets/my-avatar.mp4` → `h264,1280,720,24/1`; `my-hero-avatar.mp4` → `h264,640,360,24/1`; `my_avatar.avif` → `1480,826`. R5 wants ≥3840×2160 / 60 fps. |
| F10 | **Higgsfield cannot render the 4K assets — 0 credits, free plan.** | `mcp__claude_ai_Higgsfield__balance` → `{"credits":0,"subscription_plan_type":"free"}` (called 2026-09-05T12:20Z). |
| F11 | **No rAF budget is enforced anywhere.** The 60 fps half of R2 has never been measured. | `grep -n "rAF\|16.7\|median" tests/perf/performance.spec.ts` → zero hits. |

**Root cause the reviewer named (#3): prior agents renegotiated the bar.** This document does the opposite —
each clause below is either *designed to meet* with a named test file and assertion, or declared infeasible
**with the measurement that proves it** and the honest substitute. Section 7 is the ledger of which is which.

---

## 1. HyperFrames — what it actually is (researched, not assumed)

Fetched `https://github.com/heygen-com/hyperframes` (README) and the npm registry directly
(`curl -s https://registry.npmjs.org/<pkg>`), 2026-09-05T12:14–12:18Z. All eight published packages are at
**v0.8.29, published 2026-09-05T01:54–02:01Z**. Licence **Apache 2.0**. Requirements **Node ≥ 22 + FFmpeg +
headless Chrome**.

> "an open-source framework for turning HTML, CSS, media, and seekable animations into deterministic MP4
> videos… The renderer seeks each frame in headless Chrome and encodes the result with FFmpeg, so the same
> input produces the same video." — README

| Package | latest | unpacked | files | key deps | what it is |
|---------|--------|----------|-------|----------|------------|
| `hyperframes` | 0.8.29 | 34.55 MB | 86 | citty, hono, esbuild, sharp, fontkit, postcss, giget | **CLI** — `init` / `preview` / `render`. Build-time only. |
| `@hyperframes/core` | 0.8.29 | 2.74 MB | 568 | linkedom, postcss, `@hyperframes/{lint,parsers,studio-server}` | types, parsers, compiler, linter, **runtime**, frame adapters |
| `@hyperframes/engine` | 0.8.29 | 1.97 MB | 219 | **puppeteer**, puppeteer-core, hono | "Seekable web page to video rendering engine (Puppeteer + FFmpeg)" — Node only |
| `@hyperframes/producer` | 0.8.29 | 71.21 MB | 227 | 11 × `@fontsource/*`, hono | "HTML-to-video rendering engine using Chrome's BeginFrame API" |
| **`@hyperframes/player`** | **0.8.29** | **1.44 MB** | **19** | **`@hyperframes/core` only** | **"Embeddable web component for HyperFrames compositions"** — the browser surface |
| `@hyperframes/shader-transitions` | 0.8.29 | 3.35 MB | 11 | html2canvas | WebGL shader transitions between composition scenes |
| `@hyperframes/studio` | 0.8.29 | 25.05 MB | 1189 | 12 × `@codemirror/*` | browser authoring UI (timeline + editor). Not for production. |

**Composition format** (README, verbatim): plain HTML with data attributes on the root —
`<div id="stage" data-composition-id="launch" data-start="0" data-width="1920" data-height="1080">` — and
"bring GSAP, CSS animations, Lottie, **Three.js**, Anime.js, WAAPI, or a custom runtime" as the animation
layer. Frame-accurate seeking is the contract that makes it renderable.

### 1.1 The runtime bundle cost — measured, not guessed

```
npm pack @hyperframes/player@0.8.29 ; tar xzf hyperframes-player-0.8.29.tgz
ls -la package/dist/  →  hyperframes-player.global.js  64,037 bytes
gzip -9 -c package/dist/hyperframes-player.global.js | wc -c  →  17,645 bytes
```

**17.6 kB gzip** for the browser web component. For comparison, `GLCanvas.tsx:14` records that R3F + three
cost "132 kB of WebGL runtime" and were moved off the critical path for exactly that reason. The player is
an eighth of that, ships a `.global.js` UMD build (no bundler integration needed), and can be lazy-loaded
behind the same `next/dynamic` boundary the GL bundle already uses.

### 1.2 The integration decision

**HyperFrames is adopted in both roles, split by where the code runs. This is the winning design (§3).**

**Role A — build-time render pipeline (`devDependencies`, never shipped).**
`hyperframes` CLI + `@hyperframes/engine` render an HTML composition to a deterministic MP4 in headless
Chrome + FFmpeg. This host can run it *today*, at zero credit cost:

```
node -v            → v22.23.1      (README requires >= 22)
which ffmpeg       → /usr/bin/ffmpeg
which google-chrome → /usr/bin/google-chrome
```

This is the **R5 unblock**. Higgsfield has 0 credits (F10) and is a paid cost gate; HyperFrames renders the
same class of asset locally, deterministically, for nothing. The composition's output size is declared on the
root element (`data-width` / `data-height`), so **3840 × 2160 is a data attribute, not a purchase**.

**Role B — in-page cinematic compositions (`dependencies`, lazy).**
`@hyperframes/player` (17.6 kB gz) mounts a HyperFrames composition as a web component inside the page. Two
places earn it, and only two:
- **S1 hero overture** — the 2.4 s title composition that fills the first paint (§4.1), because a HyperFrames
  composition is *seekable*: the same source produces the in-page motion **and** the 2160p60 poster/loop that
  the render pipeline emits. One authored artifact, two outputs — that is the honest reason to use it rather
  than hand-rolled CSS.
- **S7 MiniVic viseme stage** — the composition is the frame around the avatar plate (§4.7).

**Not adopted:** `@hyperframes/studio` (25 MB authoring UI — a build-time human tool, no production role),
`@hyperframes/producer` (71.21 MB, bundles 11 font packages; `engine` covers the same job at 1.97 MB), and
`@hyperframes/shader-transitions` (3.35 MB + `html2canvas`; this site's transitions are GLSL we already own,
and `html2canvas` rasterising the DOM is the wrong tool on a page whose type must stay crisp at 4K).

**Reversal cost:** Role A is a devDependency and a script — reverting is deleting
`scripts/assets/hyperframes_render.mjs` plus one `package.json` line; the emitted MP4s stay valid. Role B is
one lazy import behind `next/dynamic` — reverting is deleting the import and keeping the CSS/GL path that is
already the reduced-motion fallback. **Both are ≤ 1 commit to undo.**

### 1.3 GSAP — the other half of §2.1

GSAP is absent (F2) and HyperFrames explicitly supports it as a frame adapter. Adopt **`gsap@3` core +
ScrollTrigger** (`gsap/ScrollTrigger`), lazy-loaded with the GL bundle, never on the critical path. It is the
choreography layer for scroll-linked scene state (§4) and the animation runtime inside HyperFrames
compositions, so the same timeline drives the page and the render. **[ESTIMATE]** gsap core + ScrollTrigger
≈ 70 kB gz; it must be measured by `TC-BUNDLE-01` before it is allowed to land, and it rides the existing
lazy GL chunk, not the first-view budget (`PERF-01`: first view ≤ 2.5 MB).

---

## 2. What already exists (survey)

| Section | Scene component | Shader | Mounted through `Scene` | `sceneId` | Measured by flagship gate |
|---------|-----------------|--------|--------------------------|-----------|---------------------------|
| `#hero` | `Hero/HeroAtmosphere.tsx` | `atmosphere.glsl.ts` | yes | `hero-atmosphere` | **yes** |
| `#about` | `About/AboutField.tsx` | `field.glsl.ts` | yes | `about-field` | **yes** |
| `#experience` | `Experience/CareerStrata.tsx` | `strata.glsl.ts` | yes | `career-strata` | **yes** |
| `#skills` | `Skills/BenchField.tsx` **(uncommitted, worktree `wf_c06ca2f9-9de-1`)** | `bench.glsl.ts` | yes | `skills-bench` | no |
| `#vitrine` | `Vitrine/VitrineField.tsx` | `vitrine.glsl.ts` | yes | **none (F6)** | no |
| `#listen` | `Listen/ListenField.tsx` | `listen.glsl.ts` | yes | **none (F6)** | no |
| MiniVic | `components/MiniVicBot.tsx` | — (canvas 2D, `lib/visemeMap.ts`) | **no** | — | no |

**Six of the seven scenes exist as GLSL already.** R2 is not a from-scratch build; it is (a) commit the
seventh, (b) give two of them handles, (c) promote MiniVic's 2D mouth to the shared GL stage, (d) prove the
frame rate and the resolution that nobody has ever measured, and (e) add the HyperFrames layer R2 names by
name. That is a five-part gap, not a rewrite — which is exactly why renegotiating it away was never
justified.

The plumbing is sound and is **kept**: `Scene.tsx` (visibility-scoped single context, chunk-skew recovery,
per-scene error boundary), `GLCanvas.tsx` (one `<Canvas>`, dpr cap, no stencil), `useGLCapability.ts`
(software-rasteriser rejection + `?gl=force` escape hatch). One line of `Scene.tsx` changes (§4.1).

---

## 3. Winning design + two alternatives

### Winner — **"One stage, two outputs"**

A single R3F/GLSL stage per section (what exists), *plus* a HyperFrames composition layer used where a
composition genuinely buys something the shader cannot: a **seekable** timeline that renders identically
in-page and to a 2160p60 file. GSAP/ScrollTrigger is the shared choreography clock. R5 is proven two ways:
GL/SVG by **rendering at a 4K viewport and asserting the backing store**, raster/video by **HyperFrames
rendering the master at 3840×2160@60 on this VPS for zero credits**.

*Why it wins:* it meets every named clause of R2 (Three.js/R3F ✔, HyperFrames ✔, GLSL ✔, ≥7 scenes ✔,
60 fps ✔ measured, reduced-motion each ✔), it reuses six working shaders, its added first-view cost is
zero (everything lazy), and every claim it makes is falsifiable by a test that runs on this host. Its
weakness is a new build-time dependency chain (Puppeteer + FFmpeg) — mitigated because both are already
installed and the render is offline, so a failure never touches a deploy.

### Alternative A — **"Pure GL, substitute for HyperFrames"**
Skip HyperFrames; build the hero overture as a second GLSL pass and render 4K assets with `ffmpeg` alone.
*Trade-off:* −17.6 kB and one fewer dependency; but it **fails R2 as written** (HyperFrames named
explicitly), and it loses the single-source property — the in-page motion and the rendered file would be two
separate implementations that drift. **Rejected: this is precisely the silent narrowing the reviewer flagged.**

### Alternative B — **"HyperFrames-first, video everywhere"**
Author every section's flagship as a HyperFrames composition rendered to 2160p60 video, and play the files.
*Trade-off:* trivially cinematic and trivially 4K; but it is **not interactive** (R2 says "fully
animated/**interactive**"), it blows the asset budget (`TC-NFR-PERF`: video ≤ 2.5 MB inline, six 4K clips is
an order of magnitude over), and it kills pointer/scroll-reactive scenes that are the site's actual
signature. **Rejected on R2's interactivity clause and on the audit gate.**

---

## 4. The seven signature scenes

Shared contract for all seven — this *is* the R2 acceptance surface:

- **Palette:** `--ink-*` / `--mist-*` / `--white` only, via `lib/palette.ts` uniforms. `--gold` appears in a
  scene **only** where the scene is drawing a sourced mark (C-8/§0.3-2). No scene introduces a hue.
- **Perf budget:** median rAF **≤ 16.7 ms @ 1440×900**, **≤ 20 ms @ 390×844** (2021-phone proxy), measured
  over ≥ 120 frames with the scene on screen.
- **Reduced motion:** `Scene` mounts nothing; the slot's CSS still is *lit* — ≥ 8 % of pixels ≥ 0.04 above
  ground (the R-c13 MOT-C13-04 rule already encoded at `flagship-visibility.spec.ts:41-44`).
- **No GL:** identical to reduced motion. Section is complete and legible; nothing throws (`SceneErrorBoundary`).
- **Visibility:** coverage ≥ 15 % at Δ 0.06, peak ≥ 0.35, motion mean |dL| ≥ 0.004 — the thresholds already
  at `flagship-visibility.spec.ts:150-155`.

| # | `sceneId` | Section | Story it tells (§0.3-6) | Tech | New test |
|---|-----------|---------|--------------------------|------|----------|
| S1 | `hero-atmosphere` | `#hero` | *The approach* — volumetric shafts rake the frame; you arrive somewhere | GLSL quad + **HyperFrames overture** + GSAP | `flagship-visibility` (has) + `TC-HERO-FIRSTPAINT-01` |
| S2 | `about-field` | `#about` | *Ten dimensions* — the compass field the answers are plotted on | GLSL quad + SVG compass | `flagship-visibility` (has) |
| S3 | `career-strata` | `#experience` | *Sixteen years, to scale* — sediment laid down at real duration | GLSL quad, scroll-driven | `flagship-visibility` (has) |
| S4 | `skills-bench` | `#skills` | *What was tested, where* — a ruled measuring plate under the wires | GLSL quad + hover ref | `TC-FLAGSHIP-VIS[skills-bench]` |
| S5 | `vitrine-field` | `#vitrine` | *Six of thirty-eight* — the cabinet light that finds the lit plate | GLSL quad + rail ref | `TC-FLAGSHIP-VIS[vitrine-field]` |
| S6 | `listen-field` | `#listen` | *Feedback & coffee?* — the beat the voice arrives on | GLSL quad + beat ref | `TC-FLAGSHIP-VIS[listen-field]` |
| S7 | `minivic-viseme` | MiniVic | *He is answering you* — the viseme stage the avatar speaks from | R3F plane + GLSL, driven by `lib/visemeMap.ts` | `TC-FLAGSHIP-VIS[minivic-viseme]` + `TC-VISEME-GL-01` |

### 4.1 S1 `hero-atmosphere` — the G-H2 fix (P0)

Three defects, three fixes, each with its own assertion.

**(a) First paint is blank of GL (F3).** `Scene`'s `pageSettled` gate exists for a real reason — `GLCanvas.tsx:14`
records that eager R3F pushed LCP from ~1.6 s to 2.7 s — so it is **not** removed globally. Instead `Scene`
gains one opt-in prop:

```
priority?: boolean   // default false — unchanged for S2…S7
show = capability === 'supported' && allowMotion && near && (priority || pageSettled)
```

and the hero's slot renders a **static poster frame** (`hero-overture-poster.avif`, the composition's frame 0,
≤ 500 kB per `TC-NFR-PERF`) as the slot's CSS background *from the static HTML*, which the scene crossfades
over on `onCreated`. So: first paint carries the composition's own frame — never a blank rectangle, never a
flat gradient — and the LCP element is still static HTML (`PERF-06`/`PERF-07` stay green because the poster is
a CSS background on an existing element, not a new LCP candidate).

**(b) Scrim is a 0.86 full-frame wash (F4).** Replace with a **graded text plate**: the darkening is bound to
the reading column, not the frame — `radial-gradient`/`linear-gradient` reaching ~0.72 under the type and
**≤ 0.25 outside the column**, so the light crosses the frame and the copy still clears AA. The existing
`tests/a11y/text-contrast.spec.ts` is the guard on one side, `flagship-visibility` COVERAGE/PEAK on the other
— brightening until type fails AA is a different bug (`flagship-visibility.spec.ts:45-49`), and the pair is
run together.

**(c) HyperFrames overture.** A 2.4 s composition (`assets/compositions/hero-overture.html`,
`data-width="3840" data-height="2160"`) whose GSAP timeline strikes the name and rakes the first shaft.
`@hyperframes/player` plays it in page (lazy, after the poster paints); `hyperframes render` emits
`hero-overture-2160p60.webm` + `.mp4` and frame 0 as the poster. **One artifact, three outputs.**

**Acceptance — `tests/overhaul/hero-first-paint.spec.ts`**
- `TC-HERO-FIRSTPAINT-01` — with JS blocked, the hero slot's computed background carries the poster URL and
  the slot's mean luminance ≥ 0.10 (i.e. the first frame is *lit*, not black).
- `TC-HERO-FIRSTPAINT-02` — at `?gl=force`, a canvas exists inside `[data-scene="hero-atmosphere"]` **without
  waiting for network idle** (`waitUntil: 'domcontentloaded'` + ≤ 1200 ms), proving `priority` bypassed the
  idle gate.
- `TC-HERO-SCRIM-01` — the hero's outer thirds (x < 22 % and x > 78 % of the slot) are ≥ 0.06 luminance
  brighter than the reading column's centre band, proving the scrim is graded, not a wash.
- `TC-CINE-*` and `tests/a11y/text-contrast.spec.ts` stay green (no regression, C-7).

### 4.2–4.6 S2…S6

S2/S3 are already green on the flagship gate and change only by joining the new rAF and 4K suites. S4/S5/S6
each need the same two-line change and then inherit every threshold:

- **S4 `skills-bench`** — land `BenchField.tsx` + `bench.glsl.ts` from worktree `wf_c06ca2f9-9de-1` (F7). It
  already mounts through `Scene` with the right id. This alone closes the reviewer's "worst vs R2" finding
  (`#skills` has *zero* WebGL).
- **S5 `vitrine-field`** — add `sceneId="vitrine-field"` to `Vitrine.tsx`'s `<Scene>` (F6). Story: the cabinet
  light gathers on the lit plate, so an unlit neighbour reads as *waiting*, not empty (closes G-V1 from the
  scene side).
- **S6 `listen-field`** — add `sceneId="listen-field"` to `Listen.tsx:161` (F6).

Each then goes into the `SCENES` array at `flagship-visibility.spec.ts:138` — which the file's own header
says is "the whole cost of holding those scenes to the same bar" (`:52-54`). **Gold rule per scene:** S5 is
the only one permitted a gold accent, and only on a plate whose repository URL is live (a sourced mark);
S4's gold stays in the SVG engraving where evidence was taken in production, never in the shader.

### 4.7 S7 `minivic-viseme` — the seventh scene

MiniVic drives its mouth on a 2D canvas from `lib/visemeMap.ts` (`getVisemeShape`, `lerpVisemeShapes`,
`heuristicVisemeFromFrequency`, `deterministicIdleViseme` — `MiniVicBot.tsx:11-16`). Promote the *stage*, not
the logic: a `Scene`-mounted R3F plane behind the avatar plate whose shader is driven by the same viseme refs
— a shallow pool of light that opens and closes with the phoneme, so the avatar is lit *by what he is
saying*. The 2D mouth path stays exactly as-is and is the no-GL fallback, so lip-sync accuracy cannot regress.

**Acceptance — `tests/overhaul/viseme-stage.spec.ts`**
- `TC-VISEME-GL-01` — with the bot open at `?gl=force`, `[data-scene="minivic-viseme"]` contains a canvas and
  the flagship COVERAGE/PEAK/MOTION thresholds hold while a synthetic viseme stream is driven.
- `TC-VISEME-GL-02` — under `prefers-reduced-motion`, no canvas mounts **and** the 2D mouth still animates
  (the fallback is the *existing* behaviour, unchanged).

### 4.8 The 60 fps clause — measured for the first time (F11)

**`tests/perf/scene-framerate.spec.ts`** — for each of the seven `sceneId`s, at `?gl=force`:

```
scroll scene into view → discard 30 warm-up frames → sample 120 rAF deltas → median
```

- `TC-SCENE-FPS-01` (desktop, 1440×900): median rAF ≤ **16.7 ms**, p95 ≤ 33 ms.
- `TC-SCENE-FPS-02` (phone, 390×844, `deviceScaleFactor: 3`, CPU throttle ×4 — the 2021-phone proxy):
  median rAF ≤ **20 ms**.

**Honest caveat, stated up front:** this VPS has no GPU, so these numbers are taken under **SwiftShader** via
`?gl=force`. A SwiftShader median that clears 16.7 ms is *stronger* evidence than a GPU one, and a
SwiftShader failure is a real failure — but a SwiftShader **pass** is not proof of a 2021 phone's GPU. The
test therefore records the renderer string (`WEBGL_debug_renderer_info`) alongside every number, and the
result is labelled `software-rasteriser` in evidence. The GPU-class confirmation is `TC-SCENE-FPS-03`, run on
the Mac runner when `E2E_RUNNER_LABELS` is set — **non-gating** (per the CI memory: nothing may hang the
deploy on an offline self-hosted runner). Until it runs, the claim on the board reads
*"60 fps proven on software rasteriser; GPU-class confirmation pending"* — not "PASS".

---

## 5. R5 plan — 2160p60, proven or honestly deferred

R5: *"Every surface + asset audited ≥ 3840×2160 / 60 fps; raster assets ≥ 4K; no layout breaks."*

### 5.1 GL and SVG surfaces — **resolution-independent, and here is how it is PROVEN**

"Vector scales" is an assertion, not a proof. The proof is that the backing store actually reaches 4K and the
frame budget survives it.

**`tests/perf/resolution-independence.spec.ts`** — viewport `3840 × 2160`, `deviceScaleFactor: 1`,
`?gl=force`:

- `TC-R5-GL-01` — for each `sceneId`, the mounted canvas reports
  `gl.drawingBufferWidth ≥ 3840 && gl.drawingBufferHeight ≥ 2160`. This is the falsifiable claim: with
  `dpr={[1, 1.75]}` a CSS-4K viewport at dsf 1 gives a native 3840×2160 buffer, so the cap **is not** the
  ceiling people assumed — it caps *oversampling*, not resolution. If a scene fails, it fails loudly here.
- `TC-R5-GL-02` — median rAF at 4K ≤ 16.7 ms desktop-class. A surface that reaches 2160 but not 60 fps has
  met half of R5, and the test says which half.
- `TC-R5-LAYOUT-01` — at 3840×2160 no horizontal overflow (`scrollWidth ≤ clientWidth`), every section
  heading is in the viewport box, and the visual baseline diff is within tolerance. "No layout breaks" is
  R5's third clause and is the one most likely to actually fail.
- `TC-R5-SVG-01` — the Compass, the Bench and the Vitrine drawings are `<svg>` with a `viewBox` and no
  fixed pixel `width`/`height` attributes — the structural property that makes 5.1's claim true rather than
  lucky.

### 5.2 Raster and video assets — **currently FAIL, unblock named, no fake PASS**

Measured (F9): `my-avatar.mp4` = 1280×720@24, `my-hero-avatar.mp4` = 640×360@24, `my_avatar.avif` = 1480×826.
**All three fail R5.** Higgsfield, the contracted generator (R6/C-3), is at **0 credits on a free plan** (F10)
— a purchase is a cost gate, and §0.1 forbids stopping to ask.

**Decision (logged, §8-D4): the 4K master is rendered by HyperFrames on this VPS, not bought.**

`hyperframes render` seeks frames in headless Chrome and encodes with FFmpeg — all three requirements are
installed here (`node v22.23.1`, `/usr/bin/ffmpeg`, `/usr/bin/google-chrome`). The composition declares
`data-width="3840" data-height="2160"`; the CLI renders at 60 fps. **Cost: zero. Credits: zero. API calls:
zero.** The source material is the owner's existing footage and stills composited in the composition — no
new generative content, so C-4's generation discipline is not engaged at all.

Budget reality, from the audit gate itself (`scripts/validate/overhaul_static_audit.mjs:168-171`): images
≤ 500 kB, video ≤ 2.5 MB, **click-to-play video under `assets/avatar/` ≤ 5 MB**, audio ≤ 1 MB. So the shipped
form is:

| Asset | Master (rendered) | Shipped | Under |
|---|---|---|---|
| Hero overture | 3840×2160@60 WebM/AV1 | ≤ 6 s loop, AV1 WebM + H.264 MP4 fallback, `assets/avatar/` | 5 MB on-demand cap |
| Hero poster | frame 0 @ 3840×2160 | AVIF, ≤ 500 kB | 500 kB image cap |
| Avatar plate | re-render at 3840×2160@60 | ≤ 5 MB click-to-play | 5 MB on-demand cap |

**`TC-R5-ASSET-01`** (`tests/content/asset-resolution.spec.ts`, a node test over `public/`): every
`.mp4/.webm/.avif/.webp/.png/.jpg` referenced by a section either (a) reports ≥ 3840×2160 via `ffprobe`, or
(b) appears in an **explicit, dated waiver list with the reason and the unblock**. The waiver list starts
with all three current assets and is *the* R5 scoreboard — it shrinks to zero as renders land, and the test
fails if an asset is added without either meeting the bar or being waived. **A waiver is a recorded FAIL,
never a PASS.**

**Interim honest state, to be reported verbatim on the board and to the reviewer:**
> R5 — **FAIL (partial)**. GL/SVG surfaces: designed to PASS, proof pending `TC-R5-GL-01/02` +
> `TC-R5-LAYOUT-01`. Raster/video: **FAIL** — 1280×720@24, 640×360@24, 1480×826 measured 2026-09-05.
> Unblock in flight: HyperFrames local render at 3840×2160@60 (zero credits). Higgsfield remains at 0
> credits/free plan; buying credits would be an alternative route and is **not** required by this plan.

---

## 6. Perf, palette and a11y guard-rails (C-6, C-8)

- **First-view budget is untouched.** `hyperframes/player` (17.6 kB gz), gsap+ScrollTrigger
  (**[ESTIMATE]** ~70 kB gz) and three/R3F all ride lazy chunks. `PERF-01` (first view ≤ 2.5 MB) is the gate;
  `TC-BUNDLE-01` (new) asserts no HyperFrames or GSAP byte appears in the document's initial JS.
- **Palette.** Scene uniforms come from `lib/palette.ts` only; raw hex outside `app/globals.css` and
  `lib/palette.ts` already fails `TC-NFR-MONO`. Gold appears in exactly two of the seven scenes and only on
  sourced marks (§4.6).
- **Reduced motion is not optional.** Every scene's fallback is the *same* still light, asserted by the
  flagship gate's FALLBACK case for all seven, not three.
- **Concurrency.** `Scene`'s visibility scoping bounds live contexts to 1–2 regardless of scene count; adding
  four scene ids does not add contexts. S7 mounts inside the bot, which is at most one more.

---

## 7. Clause ledger — meet, or infeasible-with-substitute (zero silent narrowing)

| Clause | Verdict | Where |
|---|---|---|
| R2 · Three.js / R3F | **MEET** (exists) | §2 |
| R2 · **HyperFrames** | **MEET** — `@hyperframes/player` in page + `hyperframes` CLI render pipeline | §1.2, §4.1 |
| R2 · GLSL | **MEET** (7 shaders) | §4 |
| R2 · ≥ 7 signature scenes | **MEET** — 7 enumerated, each with an id and a test | §4 |
| R2 · 60 fps desktop | **MEET, with a labelled caveat** — `TC-SCENE-FPS-01`; software-rasteriser evidence, GPU confirmation non-gating | §4.8 |
| R2 · 60 fps 2021+ phone | **MEET, with a labelled caveat** — `TC-SCENE-FPS-02` at 390×844 ×4 CPU throttle; no physical device on this host, stated as such | §4.8 |
| R2 · reduced-motion fallback on each | **MEET** — flagship FALLBACK case × 7 | §4 |
| R5 · GL/SVG surfaces ≥ 3840×2160 | **MEET** — `TC-R5-GL-01/02`, `TC-R5-SVG-01` | §5.1 |
| R5 · 60 fps at 4K | **MEET** — `TC-R5-GL-02` | §5.1 |
| R5 · raster assets ≥ 4K | **FAIL today; unblock designed** — HyperFrames local render; waiver list is the scoreboard | §5.2 |
| R5 · no layout breaks at 4K | **MEET** — `TC-R5-LAYOUT-01` | §5.1 |
| §0.3-1 · one flagship per section | **MEET** — S1…S6, one per section, each measured | §4 |
| §0.3-2 · black/white/gold | **MEET** — palette uniforms + `TC-NFR-MONO` | §6 |
| §2.1 · GSAP + ScrollTrigger | **MEET** — adopted, lazy, bundle-gated | §1.3 |
| G-H2 · scrim / first paint / HyperFrames | **MEET** — poster-first + `priority`, graded plate, overture | §4.1 |

Nothing in R2/R5/§0.3-1 is narrowed. The one **FAIL** (R5 raster) is stated as a FAIL with a measurement, a
named unblock, and a test that keeps it visible.

---

## 8. Decision log (with reversal cost)

| # | Decision | Why | Reversal cost |
|---|---|---|---|
| D1 | Adopt HyperFrames in **both** roles (player in page, CLI at build) | R2 names it; the player is 17.6 kB gz measured; the CLI runs here for free | 1 commit: delete a lazy import + a script |
| D2 | Do **not** adopt `studio` / `producer` / `shader-transitions` | 25 / 71 / 3.35 MB for jobs already covered; `html2canvas` rasterises type | none — never added |
| D3 | Add `priority` to `Scene` rather than removing the idle gate | the gate protects LCP for S2…S7 (`GLCanvas.tsx:14`); only the hero needs the first frame | 1 line |
| D4 | Render the 4K masters with HyperFrames, **not** Higgsfield | Higgsfield = 0 credits/free (measured); buying is a cost gate and §0.1 forbids asking | re-render with Higgsfield later if credits appear; assets are interchangeable |
| D5 | Report R5 raster as **FAIL** with a waiver list rather than re-scoping R5 | root cause #3 was renegotiating the bar | n/a |
| D6 | Adopt GSAP + ScrollTrigger | §2.1 names it; HyperFrames uses it as a frame adapter — one timeline, two outputs | 1 commit; scenes keep `useFrame` |
| D7 | GPU-class fps confirmation is **non-gating** CI | an offline self-hosted runner must never hang deploy (O3, and the CI memory) | flip one `continue-on-error` |
| D8 | Promote MiniVic's *stage* to GL, keep the 2D mouth as the fallback | gives the 7th scene without risking lip-sync accuracy (R3) | delete one `<Scene>` block |

---

## 9. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| SwiftShader fps numbers mistaken for GPU proof | high | credibility (this is exactly root cause #3) | renderer string recorded with every number; result labelled `software-rasteriser`; board text fixed in §4.8 |
| `priority` hero scene regresses LCP (`PERF-02` < 2.5 s) | medium | P0 | poster is a CSS background on an existing element, not a new LCP candidate; `PERF-06/07` are run in the same batch and are blocking for that task |
| HyperFrames 0.8.x API churn (published hours ago) | medium | build-time only | pin exact `0.8.29`; the render is offline — a break never touches a deploy |
| Puppeteer downloads a second Chrome (disk/time) | medium | build | `PUPPETEER_SKIP_DOWNLOAD=1` + `PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome` |
| 4K master exceeds the 5 MB on-demand cap | high | audit red | ≤ 6 s loop, AV1 first with H.264 fallback; `TC-NFR-PERF` is the gate and is run on the same task |
| Adding 4 ids to `SCENES` turns 4 gates red at once | high (expected) | cadence | one scene per board task (§10) — each lands or reverts alone |
| Brightening scenes breaks AA text contrast | medium | a11y | `tests/a11y/text-contrast.spec.ts` runs with every flagship task, as the spec's own header requires |
| Worktree `wf_c06ca2f9-9de-1` conflicts on landing | medium | rework | land S4 first, before any other Skills work |
| 4 concurrent Playwright batteries on 4 cores | high | flaky reds | one lane at a time; scene tasks are serialised in `parents` |

---

## 10. Delivery shape

`docs/architecture/SIGNATURE-SCENES-TASKS.json` holds **14 board tasks**, each ≤ 30 minutes, each shipping a
**recruiter-visible** slice on the 10-minute cadence, each with `order[]`, `gates[]` and a runnable
`verify[]`. The chain is: measurement harness first (so every later claim is falsifiable) → the G-H2 hero fix
(the most visible defect) → one scene per task → R5 proof → HyperFrames overture → the 4K render pipeline.

Every task is TDD-first: the failing assertion is captured red (`02-tests-failing.log`) before implementation
and green (`04-tests-passing.log`) after, into
`docs/delivery/evidence/v10-20260905T0515Z/G-H2/<slug>/`.
