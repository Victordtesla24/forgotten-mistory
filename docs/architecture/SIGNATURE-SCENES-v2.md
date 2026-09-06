# SIGNATURE-SCENES-v2 — the seventh scene is a set piece, and the six stop being wallpaper

**Author:** solutions-architect (`docs/prompt.md` §5), session `sa-w2-x2` · **Task:** `t_w2_x2sa` · **Written:** 2026-09-06T01:07Z–01:35Z
**Answers:** ADV-2315Z **R2 FAIL** ("Six `data-scene` slots; GL is wallpaper; not ≥7 cinematic 60 fps HyperFrames scenes")
and **§14 Marvel FAIL** ("No set-piece WoW"); GAP-BACKLOG **G-X2** (P0), **G-E2 / G-S2 / G-H2** (P1).
**Supersedes for scene 7 only:** `SIGNATURE-SCENES-v1.md` §0.6.1 / §4.9 (which named `t_x1_10` HyperFrames `hero-overture`).
Everything else in v1 — §0.5 census, §0.6 viseme ruling, §0.5.1 frame-rate readings, §5 R5 plan, §8 decision log — **stands unchanged and is cited, not restated.**
**Does not touch the hero fold:** that is `docs/architecture/HERO-SETPIECE-v3.md` (`t_w2_h1sa`, written 01:14Z). §2.4 below records the collision this doc avoids.

**Read-only lane.** No application file was edited by this session. The two artefacts are this document and
`docs/architecture/SIGNATURE-SCENES-TASKS.json` (13 slices appended in place, §7).

---

## 0. Evidence discipline for this document

Every number below is one of three kinds and is labelled every time it appears:

| Label | Means |
|---|---|
| **measured (this session)** | printed by a command run in this session, quoted verbatim below |
| **measured (cited)** | printed by an earlier lane, cited to the file that holds the raw output |
| **ESTIMATE** | derived arithmetically from a measured quantity; **not** a reading, and never reportable as one |

### 0.1 Measured this session

```
$ node -v                                 v22.23.1
$ which ffmpeg                            /usr/bin/ffmpeg
$ which google-chrome                     /usr/bin/google-chrome
$ which chromium                          /snap/bin/chromium
$ nproc                                   4
$ uptime            01:24:29 up 16:18, load average: 6.96, 23.91, 18.28

$ ls -la artifacts/masters/
  58,370,772  minivic-greeting-2160p-master.mp4
   4,754,189  minivic-greeting-1080p-voiced.mp4
   1,096,301  minivic-idle-720p.mp4
              explainer/                       (directory)

$ grep -rn 'sceneId=' components app          → 7 hits
    Hero.tsx:59        hero-atmosphere   priority resolutionScale={0.5}
    About.tsx:187      about-field                resolutionScale={0.5}
    Experience.tsx:151 career-strata              resolutionScale={0.5}
    Bench.tsx:330      skills-bench               (scale 1)
    Vitrine.tsx:167    vitrine-field              (scale 1)
    Listen.tsx:197     listen-field               (scale 1)
    MiniVicBot.tsx:1069 minivic-viseme            (inside the bot panel — not in the census, v1 §0.6)

$ python3 -c "len(json.load(open('docs/architecture/SIGNATURE-SCENES-TASKS.json')))"   → 14
```

Gate constants read off the specs this session, so no slice below invents a threshold:

- `tests/overhaul/flagship-visibility.spec.ts` — `COVERAGE_DELTA 0.06`, `COVERAGE_MIN 0.15`, `PEAK_MIN 0.35`,
  `MOTION_MIN 0.004`, `FALLBACK_DELTA 0.04`, `FALLBACK_COVERAGE_MIN 0.08`; `VIEWPORTS` = 1440×900 **and** 390×844;
  isolation helper `isolateScene()` (`:273`) hides `body *` and restores with `restorePage()` (`:285`).
- `tests/perf/scene-framerate.spec.ts` — `DESKTOP_BUDGET_MS 16.7`, `PHONE_BUDGET_MS 20.0`, median (not mean),
  `renderer` + `rendererLabel` recorded per reading, `software-rasteriser` detection at `:202`.
- `tests/overhaul/hero-plane-dominance.spec.ts` — `SPD_MIN 0.75`, `SPD_SHIP 0.78`, `LIT_FLOOR 0.045`,
  armed only under `HERO_PLANE_GATE=1` (`:63`).
- `components/gl/GLCanvas.tsx:44` — `DPR_CEILING = 1.75`.

### 0.2 One correction to the task brief, recorded rather than papered over

The task spec cites "G-A3's **TC-SCENE-ABOUT-10**" as the recall precedent. **That test id does not exist.**
`grep -o "TC-[A-Z0-9-]*" tests/overhaul/scene-*.spec.ts | sort -u` (this session) returns
`TC-SCENE-ABOUT-01 … TC-SCENE-ABOUT-09` and nothing higher. The real G-A3 recall contract is split across two
places and §5 below models on the actual pair, not the cited id:

- **`TC-SCENE-ABOUT-08`** — a *source and layout* contract: the field is mounted outside the instrument, the
  plane spans both columns and is `100vh`, the fan carries the ten sectors with `answered`/`sourced`, and the
  light is bounded under type by a `1.0 - exp(-luma / ceiling)` ceiling. It asserts the field *can* tell the
  section.
- **`flagship-visibility.spec.ts`** — a *runtime* contract: hide every element (`isolateScene`), photograph the
  slot, and hold the capture to coverage / peak / motion floors. It asserts the field *is visible*.

Neither asks the question ADV-2315Z is actually asking, which is why the site passed both and still failed R2.
§5 adds the missing third contract.

---

## 1. The failure, stated precisely

R2's acceptance (`docs/prompt.md:162`): *"≥7 signature scenes hold 60 fps desktop + 2021+ phone; reduced-motion
fallback on each"*, over a stack named as *"Three.js/R3F + HyperFrames + GLSL … fully animated/interactive"*.

Three separate things are red, and they need three separate answers:

| # | Red | Answer in this document |
|---|---|---|
| **1. count** | six scenes, not seven (v1 §0.5, re-confirmed this session: 7 `sceneId` hits, one of them the panel-only viseme) | **§2** — a seventh scene that is a set piece, not a seventh field |
| **2. character** | "GL is wallpaper" — six ambient fields that clear a brightness floor and carry no structure a reader could name | **§5** — a story contract per field, measured on the chrome-hidden capture |
| **3. frame rate** | 33–100 ms/frame after `af7355a`, on a software rasteriser (v1 §0.5.1, measured/cited) — and **no GPU reading has ever been taken** (zero self-hosted runners, `E2E_RUNNER_LABELS` unset) | **§6** — three honest proof tiers, and a free path to the first real device number |

**The count is the least important of the three.** A seventh ambient field would close (1) and deepen (2) — it is
exactly the miscount v1 §0.6 corrected when it struck `minivic-viseme` off the R2 inventory. Whatever ships as
scene 7 has to be the thing a recruiter *names*.

---

## 2. Scene 7 — the decision

### 2.1 The three candidates, and what each actually buys

| | Candidate | Buys | Costs | Verdict |
|---|---|---|---|---|
| **(i)** | **Hero overture** — pre-rendered from a 4K master, played in `#hero` (`t_x1_10` + `t_x1_11`, v1 §4.9) | R2's *named HyperFrames* clause and R5's 4K clause in one lane; trivially 60 fps because it is a video | It is **not interactive** — R2's own words are "fully animated/**interactive**". It adds a **second** flagship to the one section §0.3-1 gives exactly one. It **collides with HERO-SETPIECE-v3** (§2.4). And `t_x1_11`'s own gate already forbids what it needs: *"the overture must not sit on top of the scene the gate measures"* | **Rejected as scene 7.** Its render half survives — §4 |
| **(ii)** | **A travelling scene the reader passes through** — the career as one continuous object, scroll as the camera | Interactive by construction; the only candidate with **no chrome over it**, which is the definition of "not wallpaper"; its data is the most checkable thing on the site (eight role spans) | A new mount, a new band of page, and a scroll tax on a recruiter who wants the CV | **WINNER** — §2.2 |
| **(iii)** | **A MiniVic "presence" stage** — a real GLSL portrait-light stage, not the viseme canvas | A better R3 accessory | **v1 §0.6 already ruled on this exact address**: a scene that mounts only after a visitor clicks the launcher "is not a scene the site *presents*, it is a widget the site *contains*". Building a better scene at a rejected address inherits the rejection. It also double-counts R3's open failure against R2 | **Rejected.** Improving it is R3 work and belongs on the MiniVic lane, not here |

### 2.2 Winner — **S7 `career-descent`**

> **Story sentence, the one a recruiter repeats:**
> *"There's a bit where you scroll and you're falling down sixteen years of his career like a core sample —
> each job is a layer, and the layers get brighter as you come up to now."*

Not an atmosphere. A **subject** (one object: the career, drawn once, end to end) and a **key** (the light is on
the present and falls away with depth), travelled by a **camera the reader drives** (scroll). It is the only
composition on this site where the scene is the whole frame and nothing is written on top of it.

**Why this wins on the brief's own terms, not on taste:**

1. **It is the section's thesis, not a mood.** `#experience` is headed *"Sixteen years, to scale"*. The Gantt
   draws those years as **length**. The descent draws the same eight spans as **depth** — the same data, the
   axis a chart cannot show. ADV-2315Z's Experience row is *"recruiter recall ≠ Gantt"*; this is the answer.
2. **Its data is checkable.** `app/data/portfolio/experience.ts` — eight roles, `start`/`end` in decimal years,
   `TIMELINE_START = 2010`, `NOW = 2026 + 8/12` (read this session). Every layer's position is a CV fact.
3. **It refuses the tempting dishonesty.** The brief suggested *"the ledger figures as light"*. The three hero
   figures (≈92% / $5M+ / 10k+) are graded **`self-reported`** and a test already fails if they are graded
   higher (`CLAUDE.md`, CT-10). Building the site's flagship set piece out of its least-sourced numbers would
   grade a claim above its evidence in the largest possible typeface. **The set piece is built on the role
   spans, which the CV holds, and it carries no gold** — light is not a figure, the rule every shader here
   already keeps.
4. **It cannot be wallpaper.** Wallpaper is a definition, not an insult: a field with type over it is
   background *by construction*. The descent has one caption line and the year ticks, and nothing else. It is
   the only scene on the site that is measured with nothing in front of it because there is nothing in front
   of it.

### 2.3 Mount — exact

| Property | Value | Why |
|---|---|---|
| `sceneId` | `career-descent` | seventh handle; enters the **static** census (unlike `minivic-viseme`, v1 §0.6) |
| Section | `#experience`, **after** the chart and the accordion | the section whose data it draws; keeps the six-section IA in `CLAUDE.md` intact — **it is not a seventh section** |
| Structure | a `160vh` band containing a `position: sticky; top: 0; height: 100vh` stage | the sticky stage is the camera: 60vh of scroll is 0→1 of `uDescent` |
| z-order | band background < canvas < year ticks < one caption line. **No heading, no paragraph, no CTA over the canvas** | see §2.2(4) |
| `priority` | `false` | it is below the fold; the `pageSettled` gate stays in force (`Scene.tsx:216`). Only the hero is exempt |
| `resolutionScale` | `0.5` | matches hero/about/strata (`af7355a`). §3.3 shows the arithmetic |
| Draw calls | **1** (one `ScreenQuad`) · **instances: 0** | the pattern every shipped scene keeps: no geometry, no textures |

**Two scenes in `#experience`, and the §0.3-1 reading that permits it.** §0.3-1 asks for *"exactly one flagship
… per section"*. `career-strata` is the **chart's ground light** — it exists to serve the bars above it and it
draws nothing a reader could mistake for data (`strata.glsl.ts` header, read this session). `career-descent` is
the section's flagship. Read as a floor ("no section is without one"), seven scenes across six sections is
consistent. **This is an interpretation and it is logged as risk R-2 (§8) with its reversal:** if a reviewer
reads §0.3-1 as a ceiling, `career-strata` is reclassified in the docs as ground light rather than a flagship —
a wording change, no code, and the R2 count is unaffected because R2 counts *signature scenes*, not flagships.

### 2.4 The collision this avoids — recorded, because it nearly happened

`docs/architecture/HERO-SETPIECE-v3.md` (sibling solutions-architect, `t_w2_h1sa`, 01:14Z) resolves the hero
fold as **one plane with the figure standing inside it** (Composition A), gated by `TC-HERO-PLANE-01`
(SPD ≥ 0.75). It contains **zero** mentions of `overture`, `HyperFrames` or a seventh scene (grep, this
session). v1's plan put a `@hyperframes/player` element **into that exact stack** — between the poster and the
canvas (`t_x1_11`, order step 3).

Landing both would have put a video layer inside a fold whose dominance is now measured by a per-pixel
instrument, on the same week, from two lanes that never read each other. **Scene 7 moves out of `#hero`
entirely.** That is a decision (D-3, §8), not a coincidence.

---

## 3. `career-descent` — the build contract

### 3.1 What is on screen

Eight strata stacked in depth, deepest = oldest. `uDescent` moves the camera from the surface (2026, bright,
sharp) down to the floor (2010, dim, blurred by distance). Each stratum's **thickness is its role's duration**
— the same quantity the Gantt draws as bar length — so a nine-year band and a six-month seam are the same fact
in a different projection. Three parallax layers (near dust, the strata, a far floor) move at different rates
against `uDescent`, which is what makes it depth rather than a gradient. The stratum for the role the reader
last hovered in the chart above holds a brighter edge.

### 3.2 Uniforms — every one traces to data or to reader state

```glsl
uniform float uTime;         // shared clock (all scenes)
uniform vec2  uResolution;
uniform float uDescent;      // 0..1 — the band's own sticky progress; THE CAMERA
uniform vec4  uSpans[8];     // (startNorm, endNorm, depth, sourced) per role
uniform float uSpanCount;    // 8 today; read from roles.length, never hard-coded
uniform float uHover;        // -1 = none, else index of the role hovered in the chart above
uniform float uQuality;      // 1 = three parallax layers, 0 = two (phone branch)
uniform float uIntensity;    // mount ramp (all scenes)
uniform vec3  uInk;          // lib/palette.ts
uniform vec3  uLight;        // lib/palette.ts
// no gold uniform, ever: gold marks a sourced figure and a field of light is not a figure
```

`uSpans` is normalised on the CPU from `app/data/portfolio/experience.ts` with **the same
`TIMELINE_START = 2010` / `NOW = 2026 + 8/12` the chart uses**, imported from the same module — so the descent
and the Gantt can never disagree about a date. `sourced` is `roles[i].sourced` (the employer-string grade); it
is carried only so a later slice *may* mark the checkable employers differently in **luminance**, never in hue.

### 3.3 Budget, and the fill arithmetic behind `resolutionScale = 0.5`

Per-pixel: ≤ 4 value-noise lookups (near dust, strata grain, far floor, one hash) + an 8-iteration
`smoothstep` loop — arithmetic, not sampling. That is the ceiling `career-strata` and `AboutField` already hold
to, plus one lookup for the third depth layer.

Backing stores at `dpr = min(devicePixelRatio, 1.75) × resolutionScale` (`GLCanvas.tsx:44`, measured):

| viewport | dpr used | `resolutionScale` | buffer | pixels |
|---|---|---|---|---|
| 1440×900, dsf 1 | 1.00 | 0.5 | 720×450 | 324,000 |
| 390×844, dsf 3 | 1.75 | 0.5 | 341×738 | 251,658 |

**Host cost — ESTIMATE.** v1 §0.5.1 (measured, cited) gives two same-shader-class readings with known buffers
at 1440 after `af7355a`: `career-strata` 648×268 = 173,664 px at **50.00 ms** (288 ns/px) and `hero-atmosphere`
720×664 = 478,080 px at **100.00 ms** (209 ns/px). Taking ~250 ns/px as this host's SwiftShader rate for the
class:

- 1440: 324,000 px × 250 ns ≈ **81 ms/frame** — **ESTIMATE**, 4.9× over the 16.7 ms budget.
- 390 (with ×4 CPU throttle, which the rate above does not include): **60–150 ms/frame** — **ESTIMATE**.

**This scene will fail `TC-SCENE-FPS-01/02` on this host, by design, and that is not a defect.** Every scene
does (v1 §0.5.1: 33–100 ms after the fix). A four-core software rasteriser under load 6.96 is not a phone.

**2021-phone cost — ESTIMATE, derived, not measured.** The program is ≈ 120 ALU ops/px; at 251,658 px that is
≈ 30 MFLOP/frame. Against the published FP32 throughput class of 2021 phone GPUs (A15 / Adreno 660, order
1.5–1.7 TFLOP/s — **general knowledge, not fetched this session**), the arithmetic is ~0.02 ms and the frame is
bound by bandwidth and driver overhead rather than by shading: **estimate 3–8 ms/frame, i.e. inside the 20 ms
budget with ≥ 2.5× headroom.** **No claim rests on this.** It is a sizing argument for choosing the budget, and
it is superseded the moment §6 Tier B or Tier C produces a reading.

### 3.4 The three fallback paths are one picture

| Path | What renders |
|---|---|
| **reduced motion** | canvas does not mount (`Scene.tsx` gate); band collapses `160vh → 100vh`; the slot's CSS background is `career-descent-poster.avif`, **rendered from this same shader** at the composed frame `uDescent = 0.62` |
| **no WebGL / capability refused** | identical to the above — same poster, same picture |
| **`?gl=force` on a software rasteriser** | the live scene, slowly. Zero `pageerror`s is the gate; frame rate is recorded, never claimed |

The poster is rendered from the shader, not drawn by hand — HERO-FOLD-v2's rule ("re-render the poster from the
same shader so the no-GL path is the same picture"). A reader who has asked for stillness sees the same
composition held, not a different one.

---

## 4. HyperFrames — the verdict, plainly

**Scene 7 does not ship HyperFrames in the page, and this is the honest branch GAP-BACKLOG G-X2 explicitly
offers:** *"HyperFrames in product **or** honest 'zero-credit, not shipped' + incremental UHD GLSL that **is**
the story."* The second branch is taken.

The researcher's finding (`W2-RESEARCH/G-H1-G-X2-prior-art.md` §"HyperFrames verdict") is that HyperFrames
*"adds something real, but only the render pipeline — not the in-browser interactivity"*, and that
*"HyperFrames does not generate that language, it only renders and plays it."* Follow that to its conclusion:

- If the in-page artefact is a **live R3F/GLSL scene**, then rendering it to a 2160p60 master needs **headless
  Chrome + a deterministic frame driver + FFmpeg** — all three present on this host (measured, §0.1). It does
  **not** need HyperFrames, and it does not need `@hyperframes/player`'s 17.6 kB in the bundle.
- `@hyperframes/player` is only required if the in-page artefact **is** the video. §2.1 rejects that.

**So:** `t_x1_10` survives, narrowed — HyperFrames stays a **devDependency-only** render lane if a later pass
wants it, satisfying R2's named-tool clause with **zero shipped bytes**. `t_x1_11` (the in-page player) is
**withdrawn** for the collision in §2.4 and the reasoning above. Slice **X2-S4** (§7) renders the 2160p60 master
with the tools already on the box, so the R5 asset clause closes either way.

**And the distinction that must never be blurred:** an `ffprobe` line reading `3840,2160,60/1` proves the
**asset** is 4K/60. It says **nothing** about whether the **live scene** holds 60 fps. v1 §4.9 and the research
doc both sit close to conflating those; this document does not, and neither may any evidence file, board row or
cycle report downstream of it.

---

## 5. The story contract — what each field must say with the chrome hidden

**The missing third contract (§0.2).** Coverage / peak / motion ask *"is there light?"*. `TC-SCENE-ABOUT-08`
asks *"is it wired to the data?"*. Neither asks **"if I hide every word on the page and photograph this slot,
can a stranger tell which section they are looking at?"** — which is the question ADV-2315Z is asking and the
reason six passing scenes still read as wallpaper.

The new assertions all run on the **same isolated capture** `flagship-visibility.spec.ts` already produces
(`isolateScene()` at `:273`), at **both** viewports, and they are all **structural**: a histogram, a profile, a
centroid, a correlation. None of them asks for more light — which matters, because v1 records three
sub-threshold margins (M-1 listen motion ×1.07, M-2 vitrine peak ×1.08, M-3 vitrine AA ×1.04) where there is no
brightness left to spend.

| § | Section | The ONE thing the field must say with the chrome hidden | Measurable assertion (new id) | Shader today |
|---|---|---|---|---|
| 1 | `#hero` | *the light is on the man* — the plane's brightest region coincides with the figure, so plane and portrait are one object, not two | **`TC-STORY-HERO-01`** — the capture's luminance centroid lies within 12% of the frame diagonal of the figure's measured bounding-box centre. (SPD ≥ 0.75 stays where it is, `TC-HERO-PLANE-01`) | **Cannot yet** — `poolPlate` is declared and **unbound** (research §0). **Owned by `HERO-SETPIECE-v3` M4/§4.2, not by this doc.** Slice **X2-F0** authors the test only, so the hero lane has a red target to make green |
| 2 | `#about` | *ten dimensions, and they are not interchangeable* — a ring of ten, some answered, some open | **`TC-STORY-ABOUT-01`** — a 360-bin angular histogram about `uCentre` has **≥ 8 local maxima** separated by minima ≥ 25% below the adjacent peaks; **`-02`** — the maxima at the three `role`-side sectors are ≥ 15% below the mean of the seven `candidate`-side ones | **Can** — `uAnsweredMask` / `uSourcedMask` / `fan` all exist (`TC-SCENE-ABOUT-07/08`). Assertion is new; expect green or a small gain change. Slice **X2-F5** |
| 3 | `#experience` | *sixteen years have depth, and the roles are in it* — ≥ 2 planes at different distances, and the spans are findable | **`TC-STORY-EXP-01`** — a vertical luminance profile has **≥ 2 band groups** whose peaks move by **different pixel counts** between `uDescent`/scroll t₀ and t₁ (parallax, not a gradient); **`-02`** — **≥ 6 of 8** `uSpans` are recoverable as horizontal light extents within ±8% of their normalised positions | **Cannot yet** — `strata.glsl.ts` draws *"three drifting bands"* at **one** depth; there is no parallax term, so `-01` is unsatisfiable today. This is G-E2's *"≥2 visible strata depth planes"* stated as a number. Slices **X2-F1** (strata) and **X2-S2** (descent) |
| 4 | `#skills` | *some of this was measured in production and some was not* — the bench light reads the split | **`TC-STORY-SKILLS-01`** — mean luminance sampled at the y of the production-measured rows exceeds that at the three non-production rows by **≥ 0.06** relative luminance (`COVERAGE_DELTA`'s own step), with the rails' columns excluded | **Can, probably** — `uRows` / `uRowCount` already lift the plate at production rows (`bench.glsl.ts` header). The *split* has never been measured. Test-first; if Δ misses, one contrast slice. Slice **X2-F2** |
| 5 | `#vitrine` | *six plates, six different lights* — the cabinet is lit six ways, not one gradient slid sideways | **`TC-STORY-VITRINE-01`** — across the six rail positions the pool's x-centroid takes **6 distinct values, monotonic in `uLit`**, spanning ≥ 55% of the slot width; **`-02`** — the per-plate captures are not translations of one another (mean |Δ| after best-fit x-alignment ≥ 0.01) | **Can** — `uCentre` / `uLit` / `uScroll` all exist. **This is also the honest way out of the F-S5-390 deadlock:** `vitrine-field` misses `PEAK_MIN` at 390 (0.2918 vs 0.35) and cannot be brightened because M-3 leaves only ×1.04 of AA margin. A **structural** pass proves the story without spending contrast. Slice **X2-F3** |
| 6 | `#listen` | *this is his voice, drawn* — the band is the greeting's own loudness, not an animation | **`TC-STORY-LISTEN-01`** — band amplitude sampled over the reading correlates with the `uEnvelope` texture at **Pearson r ≥ 0.7**, and correlates with a same-period sine at **r < 0.5** | **Can** — `uEnvelope` (256×1) and `uDuration` exist; ADV-2315Z already confirms live *"the shader is envelope-driven (not `sin()` band)"*. Never asserted. Slice **X2-F4** |
| 7 | `#experience` (S7) | *sixteen years is one object and you fall down it* | **`TC-STORY-DESCENT-01`** — with all chrome hidden, ≥ 8 stratum edges are detectable and their **spacing is proportional to role duration** (rank correlation with `end − start` ≥ 0.9); **`-02`** — no text node intersects the stage box at either viewport | new scene; slices **X2-S1…S4** |

**Two "cannot yet" verdicts, both slice-backed and neither hidden:** `#hero` (`poolPlate` unbound — belongs to
HERO-SETPIECE-v3) and `#experience` strata (no parallax term — **X2-F1**). Every other field is asserted against
what its shader already does.

---

## 6. TDD — the tests come first, and the fps proof is honest about its instrument

### 6.1 Order of authorship (non-negotiable)

1. **X2-T1** authors every `TC-STORY-*` assertion in §5 — including the two that **cannot** pass — and captures
   `02-tests-failing.log` verbatim. A story contract with no red in it was written after the fact.
2. **X2-T2** extends the fps harness with `career-descent` before the scene exists (it fails "no such scene",
   which is the correct first failure).
3. Only then do X2-S1…S4 and X2-F1…F5 make specific tests green, one at a time.

### 6.2 The three fps proof tiers — and which one may be reported as 60 fps

| Tier | Instrument | Status | What a PASS proves | What it may be called |
|---|---|---|---|---|
| **A** | `tests/perf/scene-framerate.spec.ts` under `?gl=force`, SwiftShader, this VPS | **available now**; every scene currently **FAILS** it (33–100 ms, v1 §0.5.1, measured/cited) | a pass would be *stronger* than a GPU pass; a fail proves nothing about a GPU | *"median rAF X ms, software-rasteriser"* — **never** "60 fps" |
| **B** | `TC-SCENE-FPS-03` on a self-hosted GPU runner (`.github/workflows/checks.yml:96`, gated on `vars.E2E_RUNNER_LABELS`) | **has never executed** — v1 §0.5.1 measured `variables: total_count 0`, `runners: total_count 0` | R2's desktop 60 fps clause | *"60 fps, GPU-class"* — the **only** tier that may say it |
| **C** | `?fps=1` in-page HUD, read on the owner's own 2021-class phone, screenshot into evidence | **does not exist — slice X2-T3 builds it** | R2's *"2021+ phone"* clause, on an actual 2021 phone | *"60 fps, <device>, <renderer string>"* |

**Tier C is the whole point of this section.** Tier B needs a runner nobody has registered; a hosted GPU browser
is a cost gate. Tier C is free, needs no runner, and is the **only** path on the table that produces a number
from real 2021-phone silicon. It is a query-gated dynamic import — zero bytes on the default path — that prints
median rAF, p95, sample count, the `WEBGL_debug_renderer_info` string and the `sceneId`. It is an instrument,
not a feature.

**Standing rule, inherited from v1 D9 and restated because it is the one most likely to be broken by a hurried
cycle report:** a SwiftShader median that clears a budget is evidence; a SwiftShader **claim of 60 fps** is a
lie. Every reading carries its renderer string or it is not a reading.

### 6.3 The rest of the suite, per scene

Every scene — the six and the seventh — must additionally hold:

- **reduced motion**: no canvas mounts; the section is whole; the poster background is present and its mean
  luminance ≥ `FALLBACK_DELTA` above ground over ≥ `FALLBACK_COVERAGE_MIN` of the slot.
- **no WebGL**: same picture as reduced motion; `pageErrors.length === 0`.
- **`?gl=force`**: canvas count ≥ 1 in the slot; **0 `pageerror`s** — the check the React-19/R3F crash memory
  exists to enforce.
- **plane dominance, per section**: the scene's slot is ≥ 50% of the section's own visual weight on the
  chrome-hidden capture (`TC-STORY-PLANE-01`, the SPD instrument reused per-section at a lower floor than the
  hero's 0.75 — sections carry prose and cannot meet the fold's bar).
- **monochrome**: no hex in the GLSL or the component; colours arrive from `lib/palette.ts`; no `gold`.

---

## 7. Slices — 13, each ≤ 30 minutes, ordered by recruiter visibility

Appended in place to `docs/architecture/SIGNATURE-SCENES-TASKS.json` (14 existing entries untouched → 27).
Order below is dispatch order. **T-slices are TDD gates: S- and F-slices may not start before their T.**

| # | id | Title | Files | min |
|---|---|---|---|---|
| 1 | `x2-t1-story-contract-tests` | Author every `TC-STORY-*` in §5, red where the shader cannot | `tests/overhaul/story-contract.spec.ts` | 30 |
| 2 | `x2-t2-descent-fps-harness` | Extend the fps harness with `career-descent`; renderer label mandatory in the JSON | `tests/perf/scene-framerate.spec.ts` | 20 |
| 3 | `x2-f0-hero-story-assertion` | `TC-STORY-HERO-01` authored **red**; hands the target to HERO-SETPIECE-v3 | `tests/overhaul/story-contract.spec.ts` | 15 |
| 4 | `x2-s1-career-descent-mount` | The sticky band, the mount, `uSpans` from `experience.ts` — **first visible ship** | `Experience.tsx`, `Experience.module.css`, `CareerDescent.tsx`, `descent.glsl.ts` | 30 |
| 5 | `x2-s2-career-descent-depth` | Three parallax layers + the 8 strata; `uQuality` phone branch | `descent.glsl.ts` | 30 |
| 6 | `x2-s3-career-descent-still` | Poster rendered from the same shader; band collapses; reduced-motion + no-GL are one picture | `scripts/assets/`, `public/assets/`, CSS | 25 |
| 7 | `x2-f1-strata-depth-planes` | The parallax term `TC-STORY-EXP-01` needs (**G-E2**) | `strata.glsl.ts` | 30 |
| 8 | `x2-t3-fps-hud-device-path` | `?fps=1` HUD — the only free path to a real 2021-phone number (**Tier C**) | `components/gl/FpsHud.tsx`, `GLCanvas.tsx` | 30 |
| 9 | `x2-f5-about-ten-lobes` | `TC-STORY-ABOUT-01/02` green | `field.glsl.ts` (if needed) | 25 |
| 10 | `x2-f2-skills-split-delta` | `TC-STORY-SKILLS-01` green (**G-S2**) | `bench.glsl.ts` (if needed) | 25 |
| 11 | `x2-f3-vitrine-six-lights` | `TC-STORY-VITRINE-01/02` — structural, spends no contrast (**F-S5-390**) | `vitrine.glsl.ts` (if needed) | 25 |
| 12 | `x2-f4-listen-envelope-correlation` | `TC-STORY-LISTEN-01` green | test only, probably | 20 |
| 13 | `x2-s4-descent-2160p60-master` | Deterministic offline render → `ffprobe 3840,2160,60/1`; **R5 asset clause**, no 60 fps claim | `scripts/assets/descent_render.mjs` | 30 |

Slice 4 is the first recruiter-visible ship and it is reachable inside one cadence window after slices 1–3.
Slices 9–12 are independent of each other and of 4–8: they parallelise up to the GAP-BACKLOG cap of **2**
Chrome-heavy lanes at load > 8 (measured load 6.96 at 01:24Z — 4 lanes are currently permitted, but the load
one-minute figure is falling from 23.91 and should be re-read at dispatch).

---

## 8. Decision log

| id | Decision | Reversal cost |
|---|---|---|
| **D-1** | Scene 7 is a **live scroll-driven R3F/GLSL set piece** (`career-descent`), not a pre-rendered overture | one lane; the render pipeline in X2-S4 is reusable either way |
| **D-2** | It mounts in **`#experience`**, as a sticky band, **not** as a seventh section | CSS + one mount move; the six-section IA in `CLAUDE.md` is preserved by construction |
| **D-3** | Nothing from this lane enters `#hero` — HERO-SETPIECE-v3 owns that fold | free now; expensive after both ship |
| **D-4** | **`t_x1_11` (in-page `@hyperframes/player`) is withdrawn**; `t_x1_10` survives narrowed to a devDependency-only render lane | re-add the player: one dependency + a z-order negotiation with the hero plane |
| **D-5** | The set piece is built on **role spans**, never on the three `self-reported` ledger figures | none — the alternative is a caliper-grade violation |
| **D-6** | The story contract is **structural** (histogram / profile / centroid / correlation), never "make it brighter" | none; brightness is already spent (M-1/M-2/M-3) |
| **D-7** | A **Tier C on-device HUD** is built, because Tier B has no runner and a hosted GPU is a cost gate | 30 min; the HUD is query-gated and removable |
| **D-8** | `ffprobe 3840,2160,60/1` closes **R5's asset clause only**; it never closes R2's live-fps clause | none — this is a labelling rule, not a build choice |

## 9. Risk register

| id | Assumption | Mitigation |
|---|---|---|
| **R-1** | A 160vh band is a scroll tax a recruiter will pay | it sits **after** the chart and the accordion, so the CV is read first; if the reviewer calls it a wall, shrink to 130vh — `uDescent` is normalised, so the composition does not change |
| **R-2** | §0.3-1's "exactly one flagship per section" reads as a floor (§2.3) | reclassify `career-strata` in the docs as the chart's ground light. Wording only; R2's count is unaffected |
| **R-3** | The ESTIMATE of 3–8 ms on a 2021 phone (§3.3) | it gates nothing. Tier C (X2-T3) replaces it with a reading; until then no fps claim exists |
| **R-4** | `TC-STORY-EXP-02` (≥6 of 8 spans recoverable) may be unrecoverable at 390 where the stage is narrow | the assertion is parameterised per viewport; if 390 cannot carry eight, it carries the four longest and the failure is recorded as a named, viewport-scoped FAIL — never waived |
| **R-5** | Two lanes writing `Experience.tsx` (X2-S1 descent, X2-F1 strata) collide | X2-F1 touches `strata.glsl.ts` only; the mount edit is X2-S1's alone. Sequence 4 → 7 |
| **R-6** | The 2160p60 master exceeds the audit's on-demand caps (`overhaul_static_audit.mjs:168-171` — 2.5 MB video, 5 MB under `assets/avatar/`) | the master is **evidence, not a shipped asset**; only the AVIF poster ships. If a clip is later shipped, trim length, never resolution (v1's own rule) |
| **R-7** | Host load (6.96, falling from 23.91 — measured 01:24Z) makes any Tier A reading noisy | v1 §0.5.1 already records a 3.5× swing on an untouched scene from load alone. Every reading prints its loadavg; no ratio is claimed across runs at different loads |

---

## 10. Verification

```bash
test -f /root/forgotten-mistory/docs/architecture/SIGNATURE-SCENES-v2.md \
  && grep -c 'scene' /root/forgotten-mistory/docs/architecture/SIGNATURE-SCENES-TASKS.json
python3 -c "import json;d=json.load(open('/root/forgotten-mistory/docs/architecture/SIGNATURE-SCENES-TASKS.json'));print(len(d))"
```

**What this document does not claim:** that R2 passes; that any scene holds 60 fps; that a 2021 phone has been
measured; that HyperFrames ships. It claims a seventh scene that is a set piece, six fields with a story each
measured on the chrome-hidden capture, an honest three-tier frame-rate proof with one free path to a real device
number, and thirteen slices of thirty minutes or less to get there.
