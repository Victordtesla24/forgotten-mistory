# SIGNATURE-SCENES-v1 — architecture to MEET R2 / R5 / §0.3-1 / G-H2

**Task:** `t_g_h2` (authored) → **`t_g2_x2` (this refresh, ADV-1451Z P0, lane G-X2)**
**Author:** solutions-architect (§5, effort max) · **Contract:** `docs/prompt.md` (sole SoT)
**Authored:** 2026-09-05 against `bdf4edc4` / `9ba97a5c` · **Refreshed:** 2026-09-05T15:16Z against live **`b0d41a20`**
**Status:** binding architecture. No implementation in this document; no Owner decision parked (§0.1).

> **Read §0.5 first.** §0–§9 below were written when four scenes existed and none had been timed.
> Seven are mounted now and the frame cost has been measured. Where the two disagree, **§0.5 and
> §4.1(b)'s superseding note are the current state**; the original text is kept because the reasoning
> that produced the design is still the reasoning that has to be argued with to change it.

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

## 0.5 Status on LIVE `b0d41a20` (refresh, `t_g2_x2`)

```
curl -fsS https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'
→ build-commit" content="b0d41a20"
grep -rn 'sceneId=' components/     → 7 hits
```

**All seven named scenes are mounted.** F5, F6 and F7 above are closed; F1, F2, F8, F9, F10 and F11
are not. The seventh (`minivic-viseme`) landed in **`c1df356`** and reached production as
`c1df3565` at 14:54Z — after the reviewer report that said "only ~4 named data-scene mounts"
(`ADV-REVIEW-20260905T1451Z`, probed `ff67273b` at 14:41Z, before S5/S6 in `192d743` and before S7).
That finding is **stale by construction, not wrong when written**.

### Per-scene status

| # | `sceneId` | Mount (file:line) | Landed | Gate | Live status | Reviewer evidence |
|---|---|---|---|---|---|---|
| S1 | `hero-atmosphere` | `Hero.tsx:51` (`priority resolutionScale={0.5}`) | pre-existing; `priority`+poster `ee334cc`, grade `3d25643` | `flagship-visibility` + `hero-first-paint` | **PASS** 1440 & 390 | `G-REV/66199cba/`, `G-REV/e3f0206c/` |
| S2 | `about-field` | `About.tsx:174` (`resolutionScale={0.5}`) | pre-existing | `flagship-visibility` | **PASS** | `G-REV/9b864752/`, `G-REV/e47221ed/` |
| S3 | `career-strata` | `Experience.tsx:151` (`resolutionScale={0.5}`) | pre-existing | `flagship-visibility` (`fallbackCoverageMin 0.02`) | **PASS** | `G-REV/abc475e3/` |
| S4 | `skills-bench` | `Bench.tsx:304` | landed (F7 closed) | `flagship-visibility` | **PASS** | `G-REV/abc475e3/`, `G-REV/577d45af/` |
| S5 | `vitrine-field` | `Vitrine.tsx:167` | `192d743` | `flagship-visibility` | **1440 PASS · 390 FAIL** — peak **0.2918** < 0.35 | **`G-REV/ff67273b/08-adversarial-review.md` F-S5-390** |
| S6 | `listen-field` | `Listen.tsx:161` | `192d743` | `flagship-visibility` | **PASS** both widths | `G-REV/ff67273b/` (S6-b, S6-c) |
| S7 | `minivic-viseme` | `MiniVicBot.tsx:1052` | **`c1df356`** (live `c1df3565`, 14:54Z) | `tests/overhaul/viseme-stage.spec.ts` (`TC-VISEME-GL-01/02/03`) | **not yet independently re-probed on live** | — (post-dates every G-REV report) |

`SCENES` in `tests/overhaul/flagship-visibility.spec.ts:138-164` now holds **six** entries at **both**
1440×900 and 390×844 (`VIEWPORTS`, `:190-193`). S7 is held by its own spec instead, because the stage
lives inside the bot panel and has to be opened before it can be photographed.

### Open findings carried forward (not closed by this refresh)

| ID | Finding | Number | Owner lane |
|---|---|---|---|
| **F-S5-390** | `vitrine-field` has no core at 390: the narrow branch spreads its light instead of concentrating it (coverage is already 66%) | peak **0.2918** vs floor **0.35** — the repo gate and the independent probe agree to four decimals | **`t_g2_v3`** (running) |
| **F-CLAIM-01** | the `SCENES` comment added in `192d743` claims both widths for S5; one width was never measured | comment at `flagship-visibility.spec.ts:152-163` | `t_g2_v3` |
| **M-1** | `listen-field` motion @1440 = **0.00428** vs floor 0.004 (×1.07); the repo gate read 0.00607 on the same build | thin margin | any lane touching `listen.glsl.ts` |
| **M-2** | `vitrine-field` peak @1440 = **0.3763** vs floor 0.35 (×1.08) | thin margin | `t_g2_v3` |
| **M-3** | worst AA node in `#vitrine`, all four contexts = **4.69:1** vs 4.5 (×1.04) | thin margin — **coupled to F-S5-390**: brightening the field to raise peak spends this margin | `t_g2_v3` |

Margins M-1…M-3 are recorded so a later pass does not mistake them for headroom
(`G-REV/ff67273b/08-adversarial-review.md`, "Sub-threshold margins"). Any further dimming of either
field, at either width, lands under a floor; any further brightening of the vitrine lands under AA.

### 0.5.1 Frame-rate reality — measured, and still red

The 60 fps half of R2 has now been measured for the first time (`tests/perf/scene-framerate.spec.ts`,
landed `9d30641`). **It is red, and this document does not round it up.**

**Baseline, `t_x1_01` harness** (`G-X1-01/TC-SCENE-FPS-0*.json`, renderer
`ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)`, label
`software-rasteriser`, 4 cores):

| scene | `TC-SCENE-FPS-01` median @1440×900 | `TC-SCENE-FPS-02` median @390×844 dsf3 ×4 CPU |
|---|---|---|
| `hero-atmosphere` | **366.6 ms** (p95 583.3, 118 samples, loadavg 15.43) | 308.3 ms |
| `about-field` | **333.3 ms** | 333.3 ms |
| `career-strata` | **183.3 ms** | 166.6 ms |
| `skills-bench` | **66.7 ms** | 33.4 ms |

The budgets are **16.7 ms** desktop and **20 ms** phone. On the committed baseline every scene sits between
**66.7 ms and 366.6 ms per frame** at 1440 — four to twenty-two times over, i.e. **≈ 2.7 to 15 fps**, not 60.
(The `t_x1_01b` re-baseline, taken in a worktree at a different load band, reads hero 433.35 / about 274.95 /
strata 66.70 / bench 116.70 at 1440. The two disagree by more than 3× on `skills-bench`, which no lane
touched — see the host-noise note below. Both are printed; neither is chosen for being flattering.)

**After `af7355a`** (`resolutionScale={0.5}` on hero / about / strata; `skills-bench` deliberately
untouched — its graticule is a hairline and it was not driving the cost). Backing stores read off the
running page: hero 1440×1328 → **720×664**, about 384×384 → **192×192**, strata 1297×536 → **648×268**;
CSS boxes unchanged (`G-X1-01b/08-screens/{before,after}.log`):

| scene | before → after @1440 | ratio | before → after @390 | ratio |
|---|---|---|---|---|
| `hero-atmosphere` | 433.35 → **100.00 ms** | **4.33×** | 433.30 → **66.60 ms** | **6.51×** |
| `about-field` | 274.95 → **100.00 ms** | 2.75× | 491.65 → **66.70 ms** | **7.37×** |
| `career-strata` | 66.70 → **50.00 ms** | 1.33× | 183.30 → **33.40 ms** | 5.49× |
| `skills-bench` (untouched) | 116.70 → 33.30 ms | — | 33.30 → 33.30 ms | 1.00× |

`skills-bench` was **not modified** and moved 116.7 → 33.3 ms between the two runs. That is a 3.5×
swing from host load alone (loadavg 4.33 → 11.1), so every ratio above carries a host term of the same
order in either direction. The honest readings, from `G-X1-01b/04-results.md`:

- **hero is a real, large win** — the mechanism predicts 4×, the measurement is 4.33× / 6.51×.
- **`career-strata` @1440 (1.33×) is inside the host's noise band** — against the committed `t_x1_01`
  baseline the same after-run reads 3.67×. Both figures are printed; the flattering one is not chosen.
- **`about-field` @1440 misses at 2.75× and was never going to reach 3× from there.** At 1440 its canvas
  is 384×384 and the attribution probe puts **~60% of its per-frame cost in the page's own composite at
  `#about`**, not in its fragments — 1866 ns/px against `career-strata`'s 96 ns/px on the *same* three-lookup
  shader budget, a 19× gap that fragments cannot explain (`G-X1-01b/03b-about-attribution.md`).
  **That composite is lane `t_x1_01d`, not another octave cut out of the shader.**

**After the change every scene is still over budget** (best case 33 ms against 16.7 ms). This lane moved
the cost, not the threshold: no frame-rate limiter, no `frameloop` change, no threshold edited.

**GPU-class confirmation has never run.** The `scene-fps-gpu` job exists (`.github/workflows/checks.yml:96`,
landed `f5eb4c8`) and is gated on `vars.E2E_RUNNER_LABELS != ''`, so it is skipped unless a self-hosted
runner is registered. Measured this session:

```
gh api repos/:owner/:repo/actions/variables → {"variables":[],"total_count":0}
gh api repos/:owner/:repo/actions/runners   → {"total_count":0,"runners":[]}
```

**Zero runners, variable unset ⇒ the job has never executed.** D7 (non-gating) and D9 (software-rasteriser
is not GPU proof) are unchanged and remain correct: a job that cannot run must never hang a deploy, and a
SwiftShader number is not a phone's number. **No 60 fps claim is made anywhere in this document.**

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

> **Superseded by §0.5 for the `sceneId` / measured columns.** The table below is the survey taken at
> `bdf4edc4`, kept because §2's closing paragraph (what the five-part gap was) is what the plan was
> built on. On live `b0d41a20` all seven rows carry an id and six are in the flagship gate; (a), (b)
> and (c) of the five-part gap are **done**, (d) is **measured and red** (§0.5.1), (e) is **not started**
> (§10.1).

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
the reading column, not the frame, so the light crosses the frame and the copy still clears AA. The existing
`tests/a11y/text-contrast.spec.ts` is the guard on one side, `flagship-visibility` COVERAGE/PEAK on the other
— brightening until type fails AA is a different bug (`flagship-visibility.spec.ts:45-49`), and the pair is
run together.

> #### ⚠ CORRECTION (`t_g2_x2`) — the geometry and the alpha this clause originally named are **superseded**
>
> The first draft of (b) wrote the acceptance as *"the outer thirds (x < 22% and x > 78%) are ≥ 0.06
> brighter than the centre reading band"*, with the plate *"reaching ~0.72 under the type and ≤ 0.25
> outside the column"*. **Both halves of that are wrong on the build that shipped, and the implementing
> lane was right to reject them.** The reasoning is `tests/overhaul/hero-first-paint.spec.ts:388-470`.
>
> **The geometry was an assumption, and it stopped being true.** *x < 22%* was written when the copy ran
> down the middle of the frame. The fold lane (`44c3e08`, `70a04a8`) moved the reading column to one grid
> item hard against the left gutter, beside a `38vw` photograph. Measured on the shipped build at 1440,
> the hero's text runs **x = 96…960 — 6.7% to 66.7% of the frame**. So `x < 22%` is not an outer third at
> all: it is the `<h1>`, the role line and the statement, and *lighting* it is the one thing this lane is
> forbidden to do. At 390 there is no right-hand third to point at either: the copy runs x = 17…373 of 390,
> `.stage::after` is `display: none`, and every run of copy carries its own plate.
> **Replacement, shipped:** the reading column is **measured from the DOM** every run
> (`readingColumnFractions`, `:522-556`) and the lit band is *"the brightest tenth of the frame, wherever
> it is"* (`LIT_WINDOW_FRACTION = 0.1`, `brightestWindow`, `:498-520`) — one assertion that asks the same
> question of both layouts and keeps asking it if the column moves again.
>
> **The alpha was a WCAG failure.** `--mist-400` (`#909090`, relative luminance 0.2789) over the brightest
> fog this shader draws (0.8308, about `#ECECEC`) needs its ground at or below `#2A2A2A` to clear 4.5:1.
> **0.72** composites that ground to `#494949` and lands `--mist-400` on it at **2.82:1** — a fail, which
> `tests/a11y/text-contrast.spec.ts` TC-CONTRAST-02 would have caught.
> **Shipped instead: `rgb(10 10 10 / 0.88)`** (`Hero.module.css:196`), which composites to `#252525` and
> **4.79:1** — and is transparent past 66% so the pool, the portrait plate and everything the
> flagship-visibility gate measures are untouched (`Hero.module.css:168-173`, `:181-199`).
>
> **What survives verbatim is the *quantity*:** the **0.06 relative-luminance margin** between the band
> the type reads on and a lit band elsewhere. That is this document's own figure and the spec adopts it
> unchanged (`SCRIM_MIN_DELTA = 0.06`, `:472`). Room on the shipped build, from that lane's
> `04-tests-passing.log`: **0.399** @1440 and **0.205** @390 on `?gl=force`; **0.102** @1440 and
> **0.078** @390 on the reduced-motion still. The 390 still is permanently the tight one — it is the only
> one of the four with no shader to be bright with — and it is the surface a careless scrim edit breaks
> first (it read **0.0511**, red, when the assertion was first run).
>
> **Nothing was renegotiated here:** the bar (AA *and* a visible flagship) got harder, not softer — the
> original clause would have passed a frame whose type failed AA. Reversal cost: one CSS value and one
> spec constant.

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
- `TC-HERO-SCRIM-01` — ~~the hero's outer thirds (x < 22 % and x > 78 % of the slot) are ≥ 0.06 luminance
  brighter than the reading column's centre band~~ **[superseded — see the correction above]** → the
  brightest tenth of the frame is ≥ 0.06 luminance above the DOM-measured reading column's band, at 1440
  and 390, on `?gl=force` **and** on the reduced-motion still. Shipped as `G-H2b` in
  `tests/overhaul/hero-first-paint.spec.ts:558+`.
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

**RESULT (refresh): the harness landed in `9d30641` and is RED. See §0.5.1 for every number.** The
budgets below are unchanged and unreachable on this host: measured 67–367 ms/frame before `af7355a`,
33–100 ms/frame after. No PASS is claimed on either case.

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

**Refresh (`t_g2_x2`): unchanged, and still un-started.** Re-`ffprobe`d on `b0d41a20` — `my-avatar.mp4`
**1280,720,24/1**; `my-hero-avatar.mp4` **640,360,24/1**; `my_avatar.avif` **1480,826**. Neither
`tests/perf/resolution-independence.spec.ts` nor `tests/content/asset-resolution.spec.ts` exists
(`ls tests/perf tests/content`), so R5 has **no proof in either direction**: the GL/SVG half is
*unproven*, not passing, and the raster half is *FAIL* with no waiver list to shrink. Both specs are
re-issued in `SIGNATURE-SCENES-NEXT.json` (§10.1), re-sequenced behind `t_x1_10` per D13.

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

The **Designed** column is the verdict this document argued for at authoring time. The **Live `b0d41a20`**
column is where each clause actually stands, and it is the only one anyone may quote. "Designed to MEET"
is a plan, not a pass.

| Clause | Designed | **Live `b0d41a20`** | Evidence |
|---|---|---|---|
| R2 · Three.js / R3F | MEET | **MET** | `package.json`: `@react-three/fiber 9.7.0`, `three 0.165.0` |
| R2 · **HyperFrames** | MEET | **NOT MET — F1 stands** | `grep -i hyperframes package.json` → 0. §10.1 is the plan |
| R2 · GLSL | MEET | **MET** — 7 shaders | `components/sections/*/*.glsl.ts`, `MiniVicBot` stage |
| R2 · ≥ 7 signature scenes mounted | MEET | **MET (7/7 mounted)** — but **5/7 verified passing on live** | §0.5: S5@390 FAIL, S7 not yet re-probed |
| R2 · 60 fps desktop | MEET w/ caveat | **NOT MET — measured red** | §0.5.1: 100 ms best case @1440 vs 16.7 ms budget |
| R2 · 60 fps 2021+ phone | MEET w/ caveat | **NOT MET — measured red** | §0.5.1: 33.4 ms best case @390 vs 20 ms budget |
| R2 · 60 fps on a real GPU | non-gating confirm | **UNMEASURED** | 0 runners, `E2E_RUNNER_LABELS` unset (§0.5.1). D7/D9 unchanged |
| R2 · reduced-motion fallback on each | MEET | **MET for S1…S6**, S7 by `TC-VISEME-GL-02` | flagship FALLBACK × 6 at both widths |
| R5 · GL/SVG surfaces ≥ 3840×2160 | MEET | **UNPROVEN** — `tests/perf/resolution-independence.spec.ts` does not exist | `ls tests/perf/` → `performance`, `scene-framerate` only. Lane `t_x1_08` (todo) |
| R5 · 60 fps at 4K | MEET | **NOT MET** — it is not met at 1440 (§0.5.1) | — |
| R5 · raster assets ≥ 4K | FAIL; unblock designed | **FAIL, unchanged** | re-`ffprobe`d this session: `my-avatar.mp4` 1280×720@24, `my-hero-avatar.mp4` 640×360@24, `my_avatar.avif` 1480×826 |
| R5 · no layout breaks at 4K | MEET | **UNPROVEN** — same missing spec | lane `t_x1_08` (todo) |
| §0.3-1 · one flagship per section | MEET | **MET as mounts; 5/6 sections verified lit at both widths** | §0.5 (`#vitrine` @390 is the exception) |
| §0.3-2 · black/white/gold | MEET | **MET** | `TC-NFR-MONO` green in the static audit |
| §2.1 · GSAP + ScrollTrigger | MEET | **NOT MET — F2 stands** | `grep -rn gsap package.json` → 0; only prose/CSS comments. Lane `t_x1_12` (todo) |
| G-H2 · scrim / first paint | MEET | **MET** — poster + `priority` (`ee334cc`), column-bound grade (`3d25643`) | `G-REV/66199cba/`, `G-REV/e3f0206c/`; §4.1(b) correction |
| G-H2 · HyperFrames overture | MEET | **NOT MET** | §10.1, lane `t_x1_11` |

**Score: 8 met · 5 not met · 3 unproven · 1 unmeasured.** Nothing in R2/R5/§0.3-1 is narrowed here; the
plan is unchanged and the distance to it is now stated in numbers instead of intentions (§10.2).

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

**Added by this refresh (`t_g2_x2`):**

| # | Decision | Why | Reversal cost |
|---|---|---|---|
| D9 | A software-rasteriser number is **never** reported as a frame-rate pass, and the word "60 fps" does not appear as a claim anywhere in this document or on the board | root cause #3 was renegotiating the bar; `rendererLabel` is written into every JSON so the label travels with the number | n/a — this is a reporting rule |
| D10 | §4.1(b)'s *geometry* is superseded by the DOM-measured column and its *alpha* by the WCAG arithmetic; the **0.06 margin is kept verbatim** | the shipped composition moved the column and 0.72 fails AA at 2.82:1; the implementing lane measured rather than complied | one CSS value + one spec constant |
| D11 | The About field's remaining cost is attacked as a **page-composite** problem (`t_x1_01d`), not as more shader cuts | 1866 ns/px vs `career-strata`'s 96 ns/px on the same shader budget; ~60% of the frame is the page's own composite at `#about` | none — it is a routing decision |
| D12 | **HyperFrames (`t_x1_10` → `t_x1_11`) is the next lane after `t_g2_v3`**, ahead of GSAP (`t_x1_12`) and ahead of any further fps tuning | it is the only unmet R2 clause that no other work closes, and it is the R5 unblock; fps is bounded by a host with no GPU, HyperFrames is not | both are ≤ 1 commit to undo (D1) |
| D13 | `t_x1_08` (4K proof) is **re-sequenced to run after** `t_x1_10`, not before | `t_x1_08` proves surfaces reach 2160; `t_x1_10` is what makes any *asset* reach 2160. Proving the cheap half first has produced two "unproven" rows and no pixels | reorder two board rows |

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

`docs/architecture/SIGNATURE-SCENES-TASKS.json` holds the original **14 board tasks**, each ≤ 30 minutes,
each shipping a **recruiter-visible** slice on the 10-minute cadence, each with `order[]`, `gates[]` and a
runnable `verify[]`. The chain was: measurement harness first (so every later claim is falsifiable) → the
G-H2 hero fix (the most visible defect) → one scene per task → R5 proof → HyperFrames overture → the 4K
render pipeline.

Every task is TDD-first: the failing assertion is captured red (`02-tests-failing.log`) before implementation
and green (`04-tests-passing.log`) after, into
`docs/delivery/evidence/v10-20260905T0515Z/G-H2/<slug>/`.

**Delivered from that file:** `g-x1-01` (harness, `9d30641`), `g-h2-02` (poster + `priority`, `ee334cc`),
`g-h2-03` (graded plate, `3d25643`), `g-s1-04` (skills bench), `g-x1-05` + `g-x1-06` (`192d743`),
`g-x1-07` (`c1df356`). **Not started:** `g-x1-08`…`g-x1-14`.

### 10.1 The next two slices — HyperFrames, re-validated against the current tree

`docs/architecture/SIGNATURE-SCENES-NEXT.json` holds the four re-validated tasks
(`t_x1_10`, `t_x1_11`, and the re-checked `t_x1_08` / `t_x1_09`) with concrete `verify[]` commands on
**ports 5635+** — `:5599` and `:8080` are held by other tenants and `:5601`/`:5602` by the council
batteries, so this document's own task file may not use them. Re-validation performed this session:

| Precondition the specs assume | Re-checked on `b0d41a20` | Verdict |
|---|---|---|
| `node >= 22`, FFmpeg, headless Chrome present | `node -v` → **v22.23.1**; `which ffmpeg` → **/usr/bin/ffmpeg**; `which google-chrome` → **/usr/bin/google-chrome** | **holds** — the zero-credit path is still open |
| zero HyperFrames packages | `grep -i hyperframes package.json` → **0** | **holds** (F1) |
| zero GSAP | `grep -rn "gsap" package.json` → **0** (5 prose/CSS comments only) | **holds** (F2) — so `t_x1_10`'s composition cannot assume a GSAP timeline is already available; it brings its own, or uses WAAPI/CSS, which HyperFrames also accepts |
| Higgsfield at 0 credits | not re-called (paid gate, §0.1) — **assumed unchanged**, and the design does not need it | **irrelevant by design** (D4) |
| audit caps: img 500 kB, video 2.5 MB, `assets/avatar/*` 5 MB, audio 1 MB | `scripts/validate/overhaul_static_audit.mjs:168-171` — **byte-identical**, `onDemand` still keys on `assets/avatar/` | **holds** |
| `public/assets/avatar/` exists | `ls public/assets/avatar/` → **no such directory** | **CHANGED** — `t_x1_10` must create it; nothing under the 5 MB on-demand cap exists yet |
| a hero poster to crossfade from | `public/assets/hero-atmosphere-poster.avif` — **12,935 B**, shipped `ee334cc` | **CHANGED for the better** — `t_x1_11` crossfades from a poster that already exists and is a real rendered frame of `atmosphere.glsl.ts`, not one this lane has to invent |
| `Scene` accepts `priority` | `Scene.tsx:176,221,280` | **holds** |
| `Scene`/`GLCanvas` accept `resolutionScale` | `Scene.tsx:195`, `GLCanvas.tsx:16` — **new since authoring** (`af7355a`) | **NEW** — the overture must not fight it: the hero canvas is now 720×664, so the player's element sits above the poster and below the canvas at CSS size, unscaled |

**Consequences folded into `SIGNATURE-SCENES-NEXT.json`:** `t_x1_10` gains a step that creates
`public/assets/avatar/` and an `ffprobe` gate that must print `3840,2160,60/1` before any claim; `t_x1_11`
drops the "author a poster" step (one exists) and gains a reduced-motion gate naming the poster by path.

### 10.2 The honest distance to R2 and to the Marvel bar

**R2, clause by clause, on live `b0d41a20`:** four of its named clauses are met (R3F, GLSL, ≥ 7 mounted
scenes, per-scene reduced-motion), three are not (HyperFrames, 60 fps desktop, 60 fps phone), and one is
unmeasurable here (GPU-class fps). **R2 is FAIL.** Nothing about seven mounts changes that: mounting a
scene is the cheap half, and this project has now done the cheap half seven times.

The two remaining distances are different in kind, and it matters:

- **HyperFrames is a distance in work, not in physics.** Everything it needs is installed on this host and
  costs nothing. It is two lanes (§10.1). There is no honest reason it is still open, and no substitute is
  offered — Alternative A was rejected precisely because substituting for it is the silent narrowing the
  reviewer named.
- **60 fps is a distance in hardware.** The best measurement on this host is **33 ms/frame** on a 4-core
  VPS whose only rasteriser is SwiftShader, against a 16.7 ms budget. `af7355a` bought 4.3–7.4× and the
  scenes are *still* 2–6× over. No further shader work on this host can produce a trustworthy 60 fps
  number, because the number would be about SwiftShader, not about a visitor. **The honest substitute is
  not a lower budget — it is a different instrument:** `scene-fps-gpu` on a registered runner (currently
  zero), or a Lighthouse/CrUX-style field signal from real devices. Until one exists, the correct board
  text is *"frame cost measured and red on a software rasteriser; GPU-class fps unmeasured"* — never
  "60 fps", and never a PASS.

**The Marvel bar (§0.3-1: one flagship visualisation per section, main-title grade).** Measured against
what an art director would actually say, not against the gate:

| | Status |
|---|---|
| Every section has a lit, moving, reduced-motion-safe scene | **yes** — this is real and it is new |
| Every scene clears the floor a reader would notice | **no** — `#vitrine` at 390 has no core (0.2918), and three more measures sit within ×1.08 of their floors (§0.5) |
| The scenes are *composed* — one continuous move, a subject, a key | **partly.** The hero is: poster → grade → shader, and the creative council's three hero directions (`G-REV/9ba97a5c/08-adversarial-review.md` §3) are what it was built against. The other five are **fields** — beautiful grounds with nothing staged on them. The council asked `#experience` for depth planes and a dossier beat, `#about` for the dial at ≥ 60% of the section's weight, `#skills` for a lattice that resolves once and holds, `#vitrine` for six plates all drawn. **None of those five has been done.** `docs/architecture/LISTEN-FLAGSHIP.md` is the first of them to be specified. |
| It runs like a title sequence | **no.** A title sequence is 60 fps and choreographed; this is 10–30 fps on the only instrument available and has no choreography layer at all (F2). |

**So: the floors are nearly held and the bar is not.** The gap between "every section has a shader" and
"a Marvel main title" is composition and choreography — GSAP (`t_x1_12`), the five council directions,
and the HyperFrames overture that makes one authored artifact drive both the page and the 2160p60 file.
That is the honest distance, and it is stated here so that no later pass can read seven green mounts as
seven flagships.
