# R-c13 — Motion / Visualisation Council (lens 3 of 3)

**Reviewer:** independent, `3rd_party_independent_adversarial_review` · profile `reviewer` · level 1 · effort **max** (docs/prompt.md §5)
**Task:** `artifacts/kanban/tasks/t_4adf34f7.md` · S-4
**Target:** <https://forgotten-mistory.web.app> — **production only**
**Reviewed build:** `build-commit = 6dbb7992` (`<meta name="build-commit">`, read in-page at 07:02Z and 07:06Z)
**Precondition:** the brief named `3adf126a` at 06:36Z; a deploy landed mid-review, so **both values are recorded**. `git merge-base --is-ancestor f86b125 6dbb7992` → **OK** (`6dbb799` = *consolidate: merge worktree-wf_697f0e83-f46-1 into main*, 2026-09-05 06:54:05 +0000). Cycle 11 is in the reviewed build.
**Scope:** motion, visualisation, interactive infographics — graded against docs/prompt.md §2 (Marvel-Studios benchmark), §0.3-1 (exactly one flagship visualisation per section, and it must tell the section's story), §0.3-6 (narrative), §14 C-6 (reduced motion on every scene).

## Verdict: **FAIL**

Two independent FAIL conditions from the lens brief are met:

1. **Every section lacks its flagship on the live site the moment the flagship is allowed to mount.** Both WebGL flagships (`HeroAtmosphere`, `CareerStrata`) throw on mount and take the *entire six-section document* down into `app/error.tsx`. Verified, deterministic, root-caused — MOT-C13-01 below.
2. **`#experience` has no flagship motion at all under normal motion** — zero animations on entry, zero after 1600 ms; its only entry beat exists *inside* the `prefers-reduced-motion` block, so the reduced-motion reader gets more motion than the full-motion reader. Verified — MOT-C13-02.

Everything else in the motion layer is, on the evidence, good work: four of six sections have a correctly-timed, correctly-eased, correctly-reduced signature, and the reduced-motion audit is **clean** (zero running animations, zero infinite animations, zero canvases across all six sections after 2200 ms).

---

## 0. Method, and the one hard limit on the frame-rate numbers

Two read-only Playwright probes, chromium `channel:'chrome'`, `args:['--no-sandbox']`, one browser at a time. No source file was edited.

| Probe | Script | Output |
|---|---|---|
| P-1 | `R-c13/motion-probe.mjs` | `R-c13/motion-probe.json` — inventory / entry beats / keyboard / MiniVic at 1440 `?gl=force`, 1440 RM, 390 `?gl=force`, 1440 no-GL |
| P-2 | `R-c13/motion-probe2.mjs` | `R-c13/motion-probe2.json` — crash diagnosis, per-section entry timings, RM audit, 390 pacing, captures |

> **This host has no GPU.** `glCapability` read in-page: `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)` (`motion-probe.json` → `phases.p4.glCapability`). `components/gl/useGLCapability.ts:34` classifies that as `unsupported` and mounts no canvas, so **every frame-rate figure in this report is a software-rasteriser idle-page number and is indicative only.** It is *not* an R2 60 fps measurement and must never be quoted as one. A real 60 fps grade requires the GPU runner (`E2E_RUNNER_LABELS`).

Measured pacing, for the record: **median rAF delta 16.7 ms (≈59.9 fps), p95 16.7 ms at 1440×900**, and **median 16.7 ms (≈59.9 fps) at 390×844@2×** (`motion-probe2.json` → `p390.fps`, 181 samples over 3 s). Both were sampled on a page with **no scene mounted**, so they measure the compositor idling, not a shader.

---

## 1. Inventory — what each section actually renders

Read in-page at 1440×900 (`motion-probe.json` → `phases.p4.atHero.out`, and `phases.p2` for reduced motion).

| # | Section | Heading it must narrate | Flagship in source | Technique | Canvas live (no-GL / SwiftShader) | Canvas live (`?gl=force`) | Narrates? |
|---|---|---|---|---|---|---|---|
| 1 | `#hero` | *Vikram Deshpande* — three graded figures | `HeroAtmosphere` + `atmosphere.glsl.ts` | R3F ScreenQuad + GLSL | 0 | **page crashes** | partly — see MOT-C13-04 |
| 2 | `#about` | *Ten dimensions, answered* | `Compass.tsx` | inline SVG 384×384, 32 paths | 0 (SVG present) | page crashes | **yes** |
| 3 | `#experience` | *Sixteen years, to scale* | `CareerStrata` + `strata.glsl.ts` | R3F ScreenQuad + GLSL | 0, **and 0 SVG** | **page crashes** | **no** — MOT-C13-02 |
| 4 | `#skills` | *Calibration card* | `Bench.tsx` | inline SVG 1248×580, 20 paths | 0 (SVG present) | page crashes | **yes** |
| 5 | `#vitrine` | *Six of thirty-eight* | `Drawings.tsx` ×6 | 6 inline SVGs 414×259 | 0 (SVGs present) | page crashes | yes, weakly — MOT-C13-03 |
| 6 | `#listen` | *Feedback & coffee?* | caliper | CSS keyframes, `Listen.module.css:136-186` | 0 (SVG 320×40) | page crashes | **yes** |
| — | MiniVic stage | — | `mouthCanvasRef` + `/assets/my-avatar.mp4` | Canvas2D visemes + looping video | 200×100 buffer @ 96×48 CSS | n/a | **yes** — moves while speaking |

**Signature scenes that actually reach a visitor today: 4** (about, skills, vitrine, listen — all SVG/CSS). The two GLSL scenes reach **nobody**: a software-rasteriser visitor is correctly denied them, and a GPU visitor gets the error page instead of the site. Against R2's ≥7 that is 4, not the 6 the SPEC-v10 inventory implies.

---

## 2. Beat sheet — measured, in ms

Read from `document.getAnimations()` immediately after each section was scrolled into view (`motion-probe2.json` → `p1440.entry`, `p1440.heroBeats`). Durations and delays are the browser's own resolved values.

| Section | Beat | Duration | Delay / stagger | Easing (source token) | State after 1600 ms |
|---|---|---|---|---|---|
| `#hero` | `heroRiseSolid` on `h1.Hero_name` | **900 ms** | 210 ms | `--motion-ease-emphasized` = `cubic-bezier(0.16,1,0.3,1)` | finished |
| `#hero` | `heroRise` on eyebrow / role / statement / ledger / actions | **900 ms** | 120 → 300 → 390 ms (**90 ms stagger**) | same | finished |
| `#about` | `compassSweep` (index turns −360°) | **1160 ms** (`--motion-cine-long`) | 0 | emphasized, `iteration-count: 1`, `data-sweep` set once | finished |
| `#experience` | — | **none** | — | — | **`anims: []` on arrival and after 1600 ms** |
| `#skills` | `Bench_trace` × 20 wires (`stroke-dashoffset` 1→0) | **900 ms** (`--motion-cine`) | 120 ms + **38 ms per wire** | emphasized | all finished |
| `#vitrine` | `Drawings_stroke` transition `stroke-dashoffset` | **720 ms** | **6.67 ms per stroke** (measured `transition-delay: 0.00666667s`) | `cubic-bezier(0.16,1,0.3,1)` | drawn; `data-lit` + `data-drawn` set |
| `#vitrine` | `.label` opacity | 320 ms | 880 ms | linear | drawn |
| `#listen` | `caliperCloseLeft` / `caliperCloseRight` (jaws close ±160 px) | **1160 ms** | 0 | emphasized | finished |
| `#listen` | `ruleDraw` (`scaleX` 0→1) | **720 ms** (`--motion-cine-in`) | **1160 ms** — waits for the jaws | emphasized | still running at 1600 ms — correct |

The easing vocabulary is exactly the two curves the brief asks for: `--motion-ease-emphasized: cubic-bezier(0.16,1,0.3,1)` and `--motion-ease-standard: cubic-bezier(0.22,1,0.36,1)` (`app/globals.css:122-123`). The timing scale (`200/320/440/720/900/1160 ms`, `app/globals.css:110-116`) is coherent and cinematic. **Nothing needs redesigning here — one section simply never uses it.**

---

## 3. Reduced motion — clean

`browser.newContext({ reducedMotion: 'reduce' })`, each section scrolled in, audited 2200 ms after arrival (`motion-probe2.json` → `rm.perSection`, `rm.pageInfinite`).

| Section | Canvases | Still running after 2200 ms | Infinite animations |
|---|---|---|---|
| about / experience / skills / vitrine / listen | **0** | **[]** | **[]** |
| page-wide | — | — | **`pageInfinite: []`** |

No scene runs under reduced motion, and no animation loops. `components/gl/Scene.tsx:91` (`capability === 'supported' && allowMotion && near && pageSettled`) is the single gate that makes this true for both GLSL scenes, and each CSS signature carries its own `@media (prefers-reduced-motion: reduce)` block: `Compass.module.css:213-226`, `Bench.module.css:85-90`, `Drawings.module.css:78-93`, `Listen.module.css:282-300`, `Hero.module.css:669-690`. **This half of C-6 passes without qualification.**

## 4. No-GL fallback — the honest answer is "nothing"

At 1440×900 with no `?gl=force` (SwiftShader ⇒ `unsupported`), every section renders its text and its SVG, and `#hero` and `#experience` render **no substitute for the shader at all**: `fallbackEls: 0`, `background-color: rgba(0,0,0,0)`, `background-image: none` on both (`motion-probe.json` → `phases.p4.perSection`). The slot `div` from `Scene.tsx:94` is present and empty. So the answer to *"a still of the same light, or nothing?"* is **nothing** — see MOT-C13-04. It is legible, which satisfies the letter of C-6; it is not the same picture, which is what §0.3-1 asks for.

---

## Findings

### MOT-C13-01 — **BLOCKER** — all sections (Verified)

**Finding.** The moment WebGL is judged available, the page dies. At `https://forgotten-mistory.web.app/?gl=force` the document renders **`SYSTEM INTERRUPT / Something went wrong / Try again`** — `app/error.tsx` — and **all six section ids are absent from the DOM** (`sectionsPresent: []`, `canvases: 0`). Reproduced 4/4: two loads at 1440×900 and one at 390×844@2× in P-1, plus a load *and* a reload in P-2 (`reloadSectionsPresent: []`). The auto-retry at `app/error.tsx:38-42` fires and fails, so the recruiter is left on the manual "Try again" card. Capture: `R-c13/capture/1440-glforce-crash.png`.

The error, read from the console (`motion-probe2.json` → `glForceCrash.consoleErrors[0]`):

```
TypeError: Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')
    at e.exports (https://forgotten-mistory.web.app/_next/static/chunks/904.66d19854a4ab6d3a.js:1:10329)
```

Root cause, confirmed against the deployed bundles themselves:

| Deployed chunk | `__CLIENT_INTERNALS_…CANNOT_UPGRADE` (React 19) | `__SECRET_INTERNALS_…WILL_BE_FIRED` (React ≤18) |
|---|---|---|
| `chunks/4bd1b696-c023c6e3521b1417.js` (React runtime) | **1** | **0** |
| `chunks/904.66d19854a4ab6d3a.js` (the GL chunk) | 0 | **1**, and `ReactCurrentBatchConfig` ×1 |

**React 19 is deployed; the GL chunk is `@react-three/fiber@8.18.0`, whose `react-reconciler@0.27` reads React 18's internals object.** It resolves to `undefined` and the reconciler throws on first mount. `package.json:56-58` pins `next: 15.5.25` (which carries React 19) alongside `react: 18.2.0` / `react-dom: 18.2.0`, while `package.json:48-49` pins `@react-three/drei: 9.122.0` / `@react-three/fiber: 8.18.0` — the React-18 generation. The local `node_modules` is stale (`next@14.2.35`, `react@18.2.0`), which is why this never reproduces on this box outside `?gl=force` and why the two scenes were signed off as mounting.

**Why this is a blocker and not a `?gl=force` curiosity.** `useGLCapability.ts:40-42` — the flag flips *one boolean*, `isSoftware`. It does not change the mount path. `Scene.tsx:91` then evaluates `capability === 'supported'` identically for a `?gl=force` SwiftShader visitor and for a recruiter on a MacBook with a real GPU. **Every visitor with hardware WebGL and no reduced-motion preference takes this exact path**, so the live portfolio renders "Something went wrong" for them. (*Inferred* for the real-GPU visitor specifically — this host cannot produce one — but the failure is a JavaScript module-internals mismatch with no GPU dependency, so the inference is strong.)

**Direction.**
1. Move R3F to the React-19 generation in the same commit: `@react-three/fiber` `^9.0.0` and `@react-three/drei` `^10.0.0` (`package.json:48-49`); R3F 9 targets `react-reconciler@0.31`/React 19. Re-lock and commit `package-lock.json` in the same commit.
2. Verify what actually resolves before shipping: `npm ls react react-dom react-reconciler @react-three/fiber` must show one React major, and it must match R3F's generation.
3. Add a build-time guard so this class of failure can never reach production silently — assert in `scripts/validate/overhaul_static_audit.mjs` that no emitted chunk contains `ReactCurrentBatchConfig` while the React runtime chunk contains `__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE`.
4. Make the boundary survivable regardless: `app/error.tsx` currently replaces the whole document, so one shader mount error costs all six sections. Wrap the `GLCanvas` mount at `components/gl/Scene.tsx:95-97` in a scene-local error boundary that sets `capability = 'unsupported'` and renders the slot empty — the scene is explicitly "never the content" (`Scene.tsx:36-37`), so its failure must degrade to the no-GL path, not to a crash card.

**Files.** `package.json:48-49,56-58` · `components/gl/GLCanvas.tsx:3,22-44` · `components/gl/Scene.tsx:91,94-98` · `components/gl/useGLCapability.ts:40-42` · `app/error.tsx:28-46` · `scripts/validate/overhaul_static_audit.mjs`

**Acceptance.** `https://forgotten-mistory.web.app/?gl=force` at 1440×900 and 390×844 returns all six section ids present, ≥1 `<canvas>` inside `#hero` and ≥1 inside `#experience`, `consoleErrors` containing no `ReactCurrentBatchConfig`, and no `app/error.tsx` text (`SYSTEM INTERRUPT`) anywhere in `document.body.innerText`. Re-run `node docs/delivery/evidence/v10-20260905T0515Z/R-c13/motion-probe2.mjs` and require `glForceCrash.sectionsPresent.length === 6`.

---

### MOT-C13-02 — **BLOCKER** — `#experience` (Verified)

**Finding.** *"Sixteen years, to scale"* is the one heading on the page that is literally a description of an animation, and the section has **no animation**. On arrival: `anims: []`. After 1600 ms: `anims: []` (`motion-probe2.json` → `p1440.entry.experience`). The bars are painted at full length in the first frame; nothing draws, nothing counts, nothing arrives. The only `animation:` declaration in `Experience.module.css` is at **line 479, inside `@media (prefers-reduced-motion: reduce)`** — so the reduced-motion reader receives a 320 ms `experienceFade` and the full-motion reader receives nothing at all. The section's WebGL flagship, `CareerStrata`, is by its own file comment "the field behind the experience chart… draws texture rather than the roles themselves" (`CareerStrata.tsx:12-14`) — decoration, not narration — and per MOT-C13-01 it never renders anyway. This is R-c8 **MOT-F-1 still open**; it was not in the worked set (C-01, C-02, ADV-F-1, MOT-F-2, C-05, C-06).

**Direction.** Give the chart the one beat its heading promises: **the bars grow to their real duration on entry, longest role last, so the eye reads sixteen years accumulating.**
1. Add an `IntersectionObserver` at `threshold: 0.2` in `components/sections/Experience/Experience.tsx` (mirror `Bench.tsx:189-206` exactly — it already solves the once-only + reduced-motion case) that sets `data-drawn` on the chart.
2. In `Experience.module.css`, animate `.trackBar::before` (line 175) with `transform: scaleX(0) → scaleX(1)`, `transform-origin: left center`, **`--motion-cine` (900 ms)**, **`cubic-bezier(0.16,1,0.3,1)`**, stagger by role index: `animation-delay: calc(var(--i) * 70ms)` — eight roles land the last bar at 1390 ms, inside the caliper's own 1160 ms vocabulary and well under a scroll-through.
3. Roll the year labels with it: `.trackYears` (line 225) fades `opacity: 0 → 1` over `--motion-base` (320 ms) at `calc(var(--i) * 70ms + 620ms)`, so each number lands as its bar stops.
4. Reduced motion: inside the existing block at line 473, set `.trackBar::before { animation: none; transform: none }` and keep `experienceFade` — the bars are simply already at length.
5. `CareerStrata` stays as the field, but let it acknowledge the beat rather than idle: drive `uIntensity` (`CareerStrata.tsx:45-47`) from the same `data-drawn` flag instead of ramping unconditionally at `delta * 0.5`, so the strata rise *with* the bars.

**Files.** `components/sections/Experience/Experience.tsx:100,156` · `components/sections/Experience/Experience.module.css:169,175,225,473-486` · `components/sections/Experience/CareerStrata.tsx:45-47` · pattern to copy: `components/sections/Skills/Bench.tsx:189-206`

**Acceptance.** With normal motion at 1440×900, scrolling `#experience` into view yields ≥8 entries in `document.getAnimations()` scoped to `#experience`, each with `duration === 900` and `easing === 'cubic-bezier(0.16, 1, 0.3, 1)'`, the last starting at ≥ 490 ms; a Playwright assertion that `.trackBar::before` computed `transform` is not `matrix(1,0,0,1,0,0)` at t = 100 ms and is at t = 1600 ms. Under `reducedMotion: 'reduce'`, `#experience` reports zero running animations after 2200 ms (already true — must stay true).

---

### MOT-C13-03 — **MAJOR** — `#vitrine` (Verified)

**Finding.** The trace-on is real but it is not legible as a trace. The measured `transition-delay` between consecutive strokes is **6.67 ms** (`motion-probe2.json` → `p1440.entry.vitrine.after1600ms.strokes[1].transDelay = "0.00666667s"`), so a 25-stroke drawing finishes its entire stagger in ~160 ms while each stroke takes 720 ms. At that ratio the strokes are effectively simultaneous: the plate reads as one mechanism *fading up*, not as a mechanism *being drawn*. The cause is the budget formula at `Drawings.module.css:52-56`, `min(40ms, 160ms / max(1, var(--n) - 1))` — introduced to satisfy R-c8 C-02's "every stroke has landed by 900 ms", which it does, at the cost of the gesture it was protecting. "Six of thirty-eight" wants each plate to *draw itself* as it takes the light.

**Direction.** Keep the 900 ms landing budget, but spend it on sequence instead of on stroke duration.
1. Shorten the per-stroke draw and lengthen the stagger: stroke `transition-duration` **320 ms** (`--motion-base`), stagger `min(28ms, 520ms / max(1, var(--n) - 1))`. Twenty-five strokes then run 0 → 520 ms of stagger + 320 ms of draw = **840 ms**, still inside the C-02 budget, and consecutive strokes are 28 ms apart — above the ~24 ms threshold at which a sequence stops reading as one event.
2. Keep `cubic-bezier(0.16,1,0.3,1)` and keep the label fade, moving its delay from 880 ms to **860 ms** so it still lands after the last stroke.
3. Leave the reduced-motion block (`Drawings.module.css:78-93`) untouched — it is correct.

**Files.** `components/sections/Vitrine/Drawings.module.css:52-56,70-76` · `components/sections/Vitrine/Drawings.tsx:360-361` (the `--n` / `--k` writer, unchanged)

**Acceptance.** At 1440×900, after `#vitrine` enters, the computed `transition-delay` of the *last* `.stroke` in a 25-stroke plate is ≥ 480 ms and ≤ 560 ms, its `transition-duration` is `0.32s`, and the difference between consecutive strokes' delays is ≥ 20 ms. Total time from `data-lit` to last stroke at `stroke-dashoffset: 0px` ≤ 900 ms.

---

### MOT-C13-04 — **MAJOR** — `#hero`, `#experience` (Verified)

**Finding.** The two sections whose flagship is a shader have **no still of that light** when the shader is absent — which, today, is every visitor. Measured with no `?gl=force` at 1440×900: `#hero` and `#experience` both report `fallbackEls: 0`, `background-color: rgba(0, 0, 0, 0)`, `background-image: none` (`motion-probe.json` → `phases.p4.perSection`). `Scene.tsx:94` renders an empty slot `div` and `Scene.tsx:36-37` states the intent — "the slot keeps its own CSS treatment" — but no CSS treatment exists on either slot. Captures `1440-hero.png` and `1440-experience.png` are the flat near-black result. This is R-c8 **MOT-F-3 still open**, now widened to `#experience`. With MOT-C13-01 unfixed it is the *only* thing a visitor can see, which raises it from minor to major.

**Direction.** Give each slot a static gradient that is the shader's own first frame — the same light, not a substitute idea.
1. `#hero`: on the `.atmosphere` slot in `Hero.module.css`, add a two-stop radial derived from `atmosphere.glsl.ts`'s resting composition — `background: radial-gradient(120% 80% at 50% 18%, color-mix(in oklab, var(--white) 7%, transparent) 0%, transparent 62%), linear-gradient(180deg, color-mix(in oklab, var(--white) 3%, transparent) 0%, transparent 45%)`. No raw hex — tokens only, so `TC-NFR-DEADCSS` and the palette gate both stay green.
2. `#experience`: on `.chartScene` (`Experience.module.css:73`), the strata equivalent — `background: repeating-linear-gradient(178deg, color-mix(in oklab, var(--white) 4%, transparent) 0 1px, transparent 1px 14px)` faded out below 60% with a `mask-image: linear-gradient(180deg, #000 0%, transparent 88%)`, so the field reads as sedimentary layers behind the bars exactly as the shader does.
3. Both are unconditional CSS, so they are correct under reduced motion, under no-GL, and *behind* the canvas when it does mount (the canvas is `position: absolute; inset: 0`, `GLCanvas.tsx:25`).

**Files.** `components/sections/Hero/Hero.module.css` (the `Scene` slot class) · `components/sections/Experience/Experience.module.css:73` · reference for the light: `components/sections/Hero/atmosphere.glsl.ts`, `components/sections/Experience/strata.glsl.ts` · `components/gl/Scene.tsx:94`

**Acceptance.** At 1440×900 with no `?gl=force`, `getComputedStyle` of the hero scene slot and of `.chartScene` each returns a `background-image` that is not `none`; the visual baseline for `1440-nogl-hero` differs from a flat fill; the monochrome gate and `TC-NFR-DEADCSS` still pass; both values resolve through tokens (no raw hex outside `app/globals.css` / `lib/palette.ts`).

---

### MOT-C13-05 — **MINOR** — `#about` (Inferred)

**Finding.** The compass sweep is correct and lands once (1160 ms, emphasized, `data-sweep` set once — `Compass.module.css:39-51`, measured `finished` after 1600 ms). But at the one point I sampled — pointer moved to 50% width / 22% height of the 384×384 dial, held 600 ms — **the section's text did not change** (`motion-probe2.json` → `p1440.compassHover.changed: false`; `pre` and `post` identical for 220 chars). The dial exposes `#compass-open` and `#compass-hub` and the section has its own focusables, so the readout may simply require a pointer inside a sector rather than the bezel, and R-c8 MOT-F-2 was reported worked. Tagged **Inferred**: one sample point, not a proof of absence.

**Direction.** Verify with a hover over each of the ten sector centroids and over `#compass-hub`, and if any sector fails to update the readout, bind the readout to `pointerenter` on the sector `path` rather than to a hit area that the bezel overlays. Whatever the outcome, add the regression test — a hover at each sector centroid must change the readout text — since this exact state has now been reported twice.

**Files.** `components/sections/About/Compass.tsx` · `components/sections/About/About.tsx` · new spec in `tests/e2e/`

**Acceptance.** A Playwright spec that, for all ten sectors, hovers the sector's centroid and asserts `#about` `innerText` changes and names that dimension; and that the same ten are reachable by keyboard with `ArrowRight`/`ArrowLeft` from `#compass-open`.

---

### MOT-C13-06 — **POLISH** — `#vitrine` at 390 (Verified)

**Finding.** The plate rail is a real horizontal carousel at 390 — `scrollWidth: 2140`, `clientWidth: 390`, `overflow-x: auto`, `scroll-snap-type: x mandatory` — but `scroll-behavior: auto` (`motion-probe2.json` → `p390.vitrineScroll`). Programmatic moves between plates therefore jump rather than travel, which breaks the "one light raking across a cabinet" idea the section is built on (`Vitrine.tsx:27`).

**Direction.** Set `scroll-behavior: smooth` on the rail in `Vitrine.module.css`, guarded by `@media (prefers-reduced-motion: no-preference)`; the existing reduced-motion block at `Vitrine.module.css:453` keeps `auto`. Snap alignment and the `data-lit` centre computation (`Vitrine.tsx:50-60`) are already correct and need no change.

**Files.** `components/sections/Vitrine/Vitrine.module.css:453` and the rail class

**Acceptance.** At 390×844, the rail's computed `scroll-behavior` is `smooth` under `no-preference` and `auto` under `reduce`; snap positions unchanged (`scroll-snap-type: x mandatory`).

---

### MOT-C13-07 — **POLISH** — `#hero` (Verified)

**Finding.** `HeroAtmosphere.tsx:51-76,82,88-92` carries a full `prefers-reduced-motion` implementation — a media-query listener, a scroll listener, `uTime` forced to 0, pointer targets zeroed. None of it can ever run: `Scene.tsx:91` requires `allowMotion` before `GLCanvas` mounts at all, so the component does not exist under reduced motion. Confirmed by the RM audit (`canvases: 0` in every section). It is dead defence-in-depth that reads as a second, competing reduced-motion policy.

**Direction.** Not urgent and not wrong — but when MOT-C13-01 is fixed, either delete the block and let `Scene.tsx:91` be the single policy, or keep it and say so in one line at `HeroAtmosphere.tsx:20` ("belt-and-braces; `Scene` already gates this"). Do not leave two policies with no note.

**Files.** `components/sections/Hero/HeroAtmosphere.tsx:20,51-76,82,88-92` · `components/gl/Scene.tsx:91`

**Acceptance.** Either the block is gone and RM still reports zero canvases and zero running animations, or the comment states the redundancy explicitly.

---

## 5. MiniVic avatar stage — does anything move while it speaks? **Yes.**

Opened via the toggle at 1440×900 (`motion-probe.json` → `phases.p1.miniVic`, `phases.p1.miniVicMotion`; capture `1440-minivic-open.png`):

- **Avatar video** `/assets/my-avatar.mp4` — `paused: false`, `readyState: 4`. Playing.
- **Viseme mouth canvas** — 200×100 backing buffer at 96×48 CSS. Pixel sums sampled at 0 / 900 / 1800 ms: `[21140, 19655, 23617]` → **`changed: true`**. The mouth is genuinely driven, not a static overlay. Source: `components/MiniVicBot.tsx:224,621-642` (viseme arcs, not an amplitude waveform).
- The panel labels itself `SYNTHETIC VOICE · NOT A RECORDING OF VIKRAM` — the §0.3-5 honesty requirement is met in the stage itself.
- The panel carries **no CSS animation** of its own (`anims: []`); the movement is entirely video + canvas. That is the right division.

No finding. This is the strongest motion surface on the site and it is the one a recruiter is most likely to remember.

---

## 6. Keyboard

Tab order from the top (`motion-probe.json` → `phases.p1.keyboard`) reaches `Open Mini Vic assistant` with a **3 px solid** focus ring at 64×64 px, and every earlier stop carries a **2 px solid** outline. No focus stop is invisible. (That run was on the crashed page, so the in-section order could not be sampled; the section-level keyboard path belongs to the adversarial lens, and MOT-C13-05 carries the compass-specific requirement.) Tagged **Verified** for the chrome, **not assessed** for in-section order.

---

## Backlog

| id | section | severity | tag | one line |
|---|---|---|---|---|
| MOT-C13-01 | all | **blocker** | Verified | React 19 in the bundle vs `@react-three/fiber@8.18.0`'s React-18 reconciler → `ReactCurrentBatchConfig` of undefined → both GLSL flagships crash the whole page into `app/error.tsx` |
| MOT-C13-02 | `#experience` | **blocker** | Verified | "Sixteen years, to scale" has zero entry animation under normal motion; its only beat lives inside the reduced-motion block |
| MOT-C13-03 | `#vitrine` | major | Verified | Trace-on stagger measured at 6.67 ms per stroke — the plates fade up rather than draw |
| MOT-C13-04 | `#hero`, `#experience` | major | Verified | No still of the shader's light when the shader is absent — both slots are transparent with `fallbackEls: 0` |
| MOT-C13-05 | `#about` | minor | Inferred | Compass readout did not change at the one hovered point; needs a ten-sector check and a regression test |
| MOT-C13-06 | `#vitrine` | polish | Verified | Rail is `scroll-behavior: auto` at 390 — plate-to-plate moves jump instead of travelling |
| MOT-C13-07 | `#hero` | polish | Verified | Dead reduced-motion branch in `HeroAtmosphere` that `Scene.tsx:91` makes unreachable |

## What holds

- Reduced motion is clean across all six sections: **0 canvases, 0 running animations, 0 infinite animations** after 2200 ms, page-wide.
- The motion vocabulary is coherent and correctly applied where it is applied: `900 / 1160 / 720 / 320 ms` on `cubic-bezier(0.16,1,0.3,1)` and `cubic-bezier(0.22,1,0.36,1)` (`app/globals.css:110-125`).
- `#hero` stagger (90 ms), `#skills` Bench trace (900 ms / 38 ms stagger), `#listen` caliper (1160 ms jaws → 720 ms rule at 1160 ms delay) and `#about` compass sweep (1160 ms, once) are all measured correct and all narrate their headings.
- The MiniVic avatar stage moves while it speaks — video playing plus a viseme-driven canvas with verified pixel change — and labels itself synthetic.
- No `pageerror` and no failed request on the normal (no-`?gl=force`) page.

## Artefacts

| Path | What |
|---|---|
| `docs/delivery/evidence/v10-20260905T0515Z/R-c13/council-motion.md` | this report |
| `…/R-c13/motion-probe.mjs` · `motion-probe.json` · `motion-probe.log` | P-1 inventory / entry / keyboard / MiniVic / no-GL |
| `…/R-c13/motion-probe2.mjs` · `motion-probe2.json` · `motion-probe2.log` | P-2 crash diagnosis / beat timings / RM audit / 390 pacing |
| `…/R-c13/capture/1440-glforce-crash.png` | the blocker — `SYSTEM INTERRUPT` in place of the site |
| `…/R-c13/capture/1440-{hero,about,experience,skills,vitrine,listen}.png` | per-section at 1440×900, normal motion |
| `…/R-c13/capture/1440-rm-{hero,experience}.png` | reduced motion |
| `…/R-c13/capture/1440-minivic-open.png` | avatar stage open |
| `…/R-c13/capture/390-{hero,experience}.png` | 390×844@2× |

12 captures, each ≤ 400 kB (largest 258 kB).
