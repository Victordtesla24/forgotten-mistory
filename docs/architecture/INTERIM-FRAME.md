# INTERIM FRAME — the removal slice (hero + About)

**Task:** `artifacts/kanban/tasks/t_w3_rm1.md` · **Branch:** `worktree-w3-rm1` ·
**Owner instruction:** `artifacts/kanban/INBOX/OWNER-DIRECTIVE-20260906T0529Z.md`
§Escalation, verbatim, 2026-09-06T05:51Z:

> all the UI work that has been done is useless and does not even come close to what was
> specified in the rewuirements - remove all your shabby work immediately and replace it
> with credible work - or else, continue in an infinite loop refactoring the UI/UX until
> every sinhle UI/UX requirement, success criteria is met

This document is the record of the **removal**. Nothing is invented here: the credible
replacement is specified under CINEMATIC-VFX-v1 and lands in the wave-3 slices that follow.
What this slice leaves behind is a disciplined frame — near-black ground from the existing
ink tokens, white and grey type from the existing tokens, the greyscale photograph as a
plain image, every word of `app/data/portfolio/*.ts` unchanged, section ids and order
unchanged, every caliper mark unchanged, MiniVic unchanged, the nav unchanged.

The frame's contract is `tests/overhaul/interim-frame.spec.ts` (TC-IF-01…10). Every
contract that asserted a removed element is superseded **by name** in the table below and
removed from the suite in this same commit; git history keeps every one of them.

---

## 1. Removed elements

| # | Element | Files | Why it is gone |
|---|---------|-------|----------------|
| 1 | Hero atmosphere scene (fog, two Gaussian shafts, two pools, grain) | `components/sections/Hero/HeroAtmosphere.tsx`, `components/sections/Hero/atmosphere.glsl.ts` — **deleted** | Graded below the bar by the Owner on the live frames; replaced, not polished. |
| 2 | The atmosphere's poster still and its generator | `public/assets/hero-atmosphere-poster.avif`, `scripts/assets/render-hero-poster.mjs` — **deleted** | The still is a frame of the deleted shader; the script imports the deleted GLSL and cannot run without it. |
| 3 | The hero's declared plane (`[data-plane="hero"]`) and its stage slot (`.plane`, `.planeFigure`, `.stage`) | `components/sections/Hero/Hero.tsx`, `Hero.module.css` | The plane existed to hold the atmosphere and composite the figure into it. With no atmosphere there is no plane — the photograph stands in normal flow. |
| 4 | The bloom under the photograph (`.portraitStage`, `.portraitGlow`, `data-testid="portrait-glow"`) | `HeroPortrait.tsx`, `Hero.module.css` | Decoration whose only job was to seat the figure in the removed light. |
| 5 | The photograph's colour grade and dissolve mask (`filter: saturate(1.02) contrast(1.03)`, the two intersected mask ramps) | `Hero.module.css` `.portraitMedia` | TC-IF-02 requires a photograph with no CSS filter. The frame is monochrome in the **shipped bytes** (`app/data/portfolio/avatar.ts`), which is where it belongs. |
| 6 | Every opaque plate behind a run of copy (`.eyebrow/.name/.role/.statement/.availability` grounds and their `box-shadow` spread, `.secondaryAction`'s ground, the phone plate block, `.portraitCaption`'s plate) | `Hero.module.css` | The plates bought contrast against the shader's fog. The ground is flat near-black now; a plate on black is a rectangle for its own sake. |
| 7 | About compass and its shader field | `components/sections/About/AboutField.tsx`, `Compass.tsx`, `Compass.module.css`, `field.glsl.ts` — **deleted**; `.field`, `.fieldViewport`, `.fieldSlot`, `.instrument`, `.instrumentStage`, `.instrumentCaption`, `.instrumentReading`, `.instrumentConstant`, `.key`, `.keyRow`, `.keySwatch` removed from `About.module.css` | Graded below the bar with the rest of the visual layer. |
| 8 | The compass's own chrome copy — the reading caption (`— / <dimension>`), the constant `Ten axes · no scores`, and the two key rows | `About.tsx` | These sentences are the component's own, not the content files'. They name the face's states; with no face they name nothing. **No word of `app/data/portfolio/about.ts` changed.** |

### What moved, and what did not

- **The role line rejoins the fold.** `heroContent.role` stood in the proof band under
  HERO-SETPIECE-v3 §6.1 so the plane could hold the first screen alone. With the plane
  gone the fold is the words, and TC-IF-02 requires the name, the role, the sentence and
  both actions in the first screen. **The node moved; not a word changed**, and `hero.ts`
  is untouched.
- **The photograph moves into the fold in normal flow** (`.portraitFigure`), capped in the
  block axis (`max-height: min(34svh, 22rem)`) so the whole fold stands in one screen at
  1440×900, 1280×800, 834×1194 and 390×844.
- **Unchanged:** every string in `app/data/portfolio/*.ts`; the six section ids and their
  order; every `Caliper` state (`self-reported` on the three hero figures, `open` on the
  three role-side dimensions); the ledger and its provenance lines; the availability line
  and its links; `HeroPortraitControl` and `HeroPortraitCaption`; MiniVic; the nav.

---

## 2. Superseded tests → replacement

Every case below asserted an element removed above. None is weakened: each is replaced by a
case in `tests/overhaul/interim-frame.spec.ts` that measures the frame that stands now.

| Superseded | What it asserted | Replacement |
|---|---|---|
| `tests/overhaul/hero-setpiece.spec.ts` (whole file, TC-HERO-SET-01…05) | The plane's geometry: the figure composited into the plane, the name's baseline crossing its dissolve band, FIG-CAP, `.proof` at exactly `100svh` | TC-IF-02 (the fold's five elements in one screen), TC-IF-09 (the ledger below the fold) |
| `tests/overhaul/hero-plane-dominance.spec.ts` (whole file) | The declared plane dominates the fold's ink set | TC-IF-01 (no plane, no scene, no canvas), TC-IF-03 (the ground is ≤ 0.03) |
| `tests/overhaul/hero-plates.spec.ts` (whole file, TC-HERO-PLATE-01…03) | Every run of hero copy carries an opaque plate at 0.90 | TC-IF-02 (no plate behind the name), TC-IF-04 (every run clears 4.5:1 on the ground it is actually drawn on) |
| `tests/overhaul/hero-first-paint.spec.ts` (whole file, TC-HERO-FIRSTPAINT-01…03, TC-HERO-SCRIM-01) | The atmosphere's poster is lit in the first paint; the canvas mounts on a cold load; the scrim is a column-bound grade | TC-IF-01, TC-IF-03, TC-IF-06 (`?gl=force` raises nothing and mounts nothing) |
| `tests/e2e/hero-first-paint.spec.ts` (whole file, TC-HERO-GL-01/02) | ≥ 1 canvas in the plane under `?gl=force`; the poster lit above a floor under reduced motion | TC-IF-06, TC-IF-07 (the reduced-motion frame is the same frame) |
| `tests/overhaul/scene-about.spec.ts` (whole file, TC-SCENE-ABOUT-01…) | The About field mounts, is the section's plane, and the instrument stacks over it | TC-IF-01, TC-IF-05 (the heading, the lede, the provenance line and the ten rows) |
| `tests/overhaul/story-contract.spec.ts` → `TC-STORY-HERO-01`, `TC-STORY-ABOUT-01/02/03` (rows only; the Experience, Skills, Vitrine, Listen and Descent rows are untouched) | The plane's brightest region is where the figure is; the About fan is a ring of ten with three open sectors | TC-IF-01, TC-IF-03, TC-IF-05 |
| `tests/overhaul/flagship-visibility.spec.ts` → the `hero` and `about` items (rows only; skills, vitrine, listen and experience keep theirs) | The hero atmosphere and the About compass field read as light | TC-IF-01, TC-IF-03 |
| `tests/e2e/hero-fold.spec.ts` → `TC-FOLD-03` (row only) | The scene stage is the fold | TC-IF-02 |

`tests/e2e/about.spec.ts` and `tests/overhaul/render.spec.ts` reference the compass
face and the removed caption in individual rows; those rows are addressed in the same
pass and are listed under **Remaining** in this slice's structured output rather than
silently deleted.

---

## 3. Audit gate changes

**None.** `scripts/validate/overhaul_static_audit.mjs` was read gate by gate before the
removal: its ten gates (`TC-NFR-TONE`, `TC-NFR-MONO`, `TC-NFR-PERF`, `TC-FR-PARITY`,
`TC-NFR-TYPE`, `TC-NFR-SEC`, `TC-ARCH-BENCH`, `TC-NFR-COMPLETE`, `TC-NFR-TOKEN`,
`TC-NFR-DEADCSS`) count no scene mounts and no canvases, so none of them needed
re-pointing. The audit stays **10/10** on its existing contract.

Two of them are touched by the removal and hold without a change:

- `TC-NFR-DEADCSS` — the styles for every deleted node are deleted in this same commit
  (`.plane`, `.planeFigure`, `.stage`, `.portraitStage`, `.portraitGlow`, the plate block,
  the About field/instrument/key blocks) and `Compass.module.css` is deleted whole.
- `TC-NFR-PERF` — the deleted poster (`hero-atmosphere-poster.avif`) and the two deleted
  shaders only reduce the shipped weight.

---

## 4. What wave 3 reinstates on this frame

The instruments are kept in place for the hero that replaces this frame — they are how the
new work is graded, and none of them is deleted by this slice:

- `scripts/validate/hero_plane_dominance.mjs` — the SPD instrument. It measures whichever
  ground the new hero declares; with no plane declared it has nothing to exempt, and it is
  the wave-3 hero slice's job to give it one again.
- The About **story metric** (ABOUT-STORY-v2 §metric) carries into CINEMATIC-VFX-v1 as a
  gate on whatever instrument replaces the compass — a section whose recall is "the SVG
  radar" fails it, and so does a section with no instrument at all.
- `tests/overhaul/interim-frame.spec.ts` is the floor the replacement must not drop below:
  the words readable, the ground disciplined, the photograph unfiltered, the ten rows
  intact, nothing chromatic outside the gold claim. A new scene is added *over* this
  contract, and TC-IF-01/06 are re-pointed at that point — consciously, in the slice that
  adds it, with the reason written here.

---

# SLICE 0b — Experience, Skills, Vitrine, Listen

**Task:** `artifacts/kanban/tasks/t_w3_rm2.md` · **Branch:** `worktree-w3-rm2` ·
**Parent:** `worktree-w3-rm1` (consolidated into `main` as `8359094`).

Same Owner instruction, same discipline: this slice removes the remaining visual layer —
the five WebGL fields and the sticky descent stage — and keeps every fact they stood
behind. Nothing is invented here. Not one word of `app/data/portfolio/*.ts` changed, the
six section ids and their order are unchanged, every `Caliper` state is unchanged, MiniVic
and the nav are unchanged.

## 5. Removed elements

| # | Element | Files | Why it is gone |
|---|---------|-------|----------------|
| 9 | The career strata field under the chart (`career-strata`) and the geometry the chart fed it | `components/sections/Experience/CareerStrata.tsx`, `strata.glsl.ts` — **deleted**; the `spans` state, the `offsetLeft/offsetWidth` measuring effect, the `<Scene sceneId="career-strata">` mount and `.chartScene` / `.chartScene::after` removed from `Experience.tsx` / `Experience.module.css` | Graded below the bar with the rest of the visual layer. The chart itself is DOM and always was — the field drew texture, not data, so removing it removes no information. |
| 10 | The sticky career-descent stage (`career-descent`), its 60vh camera move, its year ticks and its caption | `components/sections/Experience/CareerDescent.tsx`, `descent.glsl.ts` — **deleted**; the `descentBand` / `descentStage` / `descentScene` / `descentTicks` / `descentTick` / `descentCaption` blocks removed from `Experience.tsx` and `Experience.module.css` | A second drawing of the same sixteen years, over a shader. The axis above already reads those four years; the descent restated them at the cost of 60vh of scroll. `experienceContent.descentCaption` **stays in the data file, unread** — no word of `experience.ts` was touched. |
| 11 | The skills bench plate (`skills-bench`) and the row-height reading set that lit it | `components/sections/Skills/BenchField.tsx`, `bench.glsl.ts` — **deleted**; `hoverState`, `fieldRows`, the `<Scene sceneId="skills-bench">` mount, `.stage` and `.fieldSlot` removed from `Bench.tsx` / `Bench.module.css` | The wires are SVG and the board is DOM; the plate was the light under them. The calibration card reads on the flat ground. |
| 12 | The vitrine cabinet light (`vitrine-field`) and the per-frame rail state that drove it | `components/sections/Vitrine/VitrineField.tsx`, `vitrine.glsl.ts` — **deleted**; `railState`, `stageRef`, the field `div`, `.field` and `.fieldSlot` removed from `Vitrine.tsx` / `Vitrine.module.css` | The raking light on the plates is CSS and is untouched; the pool under the cabinet was the shader. |
| 13 | The six traced mechanism drawings and their reveal | `components/sections/Vitrine/Drawings.tsx`, `Drawings.module.css` — **deleted**; the `drawn` state, `data-drawn`, `.drawingFrame` and the `<Drawing>` mount removed from `Vitrine.tsx` / `Vitrine.module.css` | Decoration between a card's description and its metrics. Every fact each card carries — title, description, commits/active/stack, limits, source, live URL — is unchanged. `plate.drawing` **stays in `vitrine.ts`, unread**. |
| 14 | The listen beat field (`listen-field`) and the band measurement that placed it | `components/sections/Listen/ListenField.tsx`, `listen.glsl.ts` — **deleted**; the `beat` ref, the band half of `measure()`, the field `div`, `.field` and `.fieldSlot` removed from `Listen.tsx` / `Listen.module.css` | The caliper, its four arrival marks and the reading are SVG and are untouched; the field was the light behind them. |

### What did not move

Everything that carries meaning. The eight role rows and their to-scale bars, the three
`self-reported` figures and the five `open` brackets, the axis and its playhead, the
accordion and its bullets; the calibration card and its wires; the six cards with their
metrics, limits and sources and the keyboard-reachable rail; the four contact routes, the
synthetic-introduction label and the agenda action; every `Caliper`; MiniVic; the nav.

**No `<Scene>` remains in any section.** The only scene the page still mounts anywhere is
`minivic-viseme`, inside MiniVic's own panel — which is why `tests/helpers/scenes.ts`
(`discoverSceneIds`) would no longer have a second reader and is deleted with the suite
that used it.

## 6. Superseded tests → replacement

Every case below asserted an element removed above. None is weakened: each is replaced by a
case in `tests/overhaul/interim-frame.spec.ts` (TC-IF-11…21) that measures the frame that
stands now. Git history keeps every one of them.

| Superseded | What it asserted | Replacement |
|---|---|---|
| `tests/overhaul/scene-experience.spec.ts` (whole file) | The `career-strata` field mounts under the chart and lights the eight role spans | TC-IF-11 (no canvas, no scene), TC-IF-12 (the eight bars are the durations, to within 2 %) |
| `tests/overhaul/scene-descent.spec.ts` (whole file) | The descent stage is sticky, its camera travels the sixteen years, and nothing is written over it | TC-IF-11 (no descent band, no descent stage), TC-IF-12 (the years are read from the chart's own axis) |
| `tests/overhaul/scene-skills.spec.ts` (whole file) | The `skills-bench` plate mounts and lifts the production rows | TC-IF-11, TC-IF-13 (the card's tested/untested split reads with no bar and no canvas) |
| `tests/overhaul/scene-vitrine.spec.ts` (whole file) | The `vitrine-field` pool tracks the rail across six plates | TC-IF-11, TC-IF-14 (six cards with their metrics, limits and sources; the rail still answers the keyboard) |
| `tests/overhaul/scene-listen.spec.ts` (whole file) | The `listen-field` band is the greeting's own loudness, under the caliper | TC-IF-11, TC-IF-15 (the four routes, the synthetic-introduction label and the agenda action) |
| `tests/overhaul/story-contract.spec.ts` (whole file — `TC-STORY-EXP-01/02`, `TC-STORY-SKILLS-01`, `TC-STORY-VITRINE-01`, `TC-STORY-LISTEN-01`, `TC-STORY-DESCENT-01/02`, `TC-STORY-PLANE-01`; its hero and About rows were already superseded in slice 0a) | Each field "says its own section": strata at ≥ 2 depths, ≥ 6 of 8 spans findable in the light, production rows lit, the pool moving six ways, the band tracking loudness, the descent spacing being the durations, and every declared plane carrying ≥ its share of the light | TC-IF-11 (there is no field to say anything), TC-IF-12/13/14/15 (each section's facts, measured in DOM), TC-IF-16 (the ground those facts stand on) |
| `tests/overhaul/flagship-visibility.spec.ts` (whole file — its `hero` and `about` rows went in slice 0a; `experience`, `skills`, `vitrine` and `listen` are the rest of `SCENES`) | Each flagship scene reads as light above its section's ground | TC-IF-16 (the ground is ≤ 0.03 everywhere), TC-IF-17 (every run of type clears AA on it), TC-IF-20 (nothing chromatic but the gold claim) |
| `tests/perf/scene-framerate.spec.ts` (whole file) | Every discovered scene holds its frame budget under CPU throttling | TC-IF-18 (`?gl=force` mounts no section canvas and raises nothing) and TC-IF-19 (the reduced-motion path prints the same four sections) — a section with no scene has no frame budget to miss |
| `tests/helpers/scenes.ts` (`discoverSceneIds`) | Derived the scene list the two suites above were parameterised over | Deleted with its only two readers. It is the right shape for the wave-3 scenes and can be restored from history when the first of them lands. |
| `tests/overhaul/render.spec.ts` → `TC-RENDER-01` (row only; `TC-RENDER-02`'s context-loss watch stays, now over an empty `SCENE_SECTIONS`) | At least one section scene mounts a live WebGL canvas ≥ 100×100 under `?gl=force` | TC-IF-18 |
| `tests/e2e/vitrine.spec.ts` → `TC-VIT-05`'s six-drawing block (the "no screenshots, logos or raster images" assertion stays) | Six inline `svg[role="img"]` mechanism drawings, each with a non-empty `title` and `desc` | TC-IF-14 |
| `tests/a11y/text-contrast.spec.ts` → the `SCENE_SLOTS` warm list (rows only; the contrast walk itself is untouched) | Warmed five section shaders before photographing each band | TC-IF-17 — the walk now photographs the flat ground, which is the ground a reader actually gets |
| `scripts/testing/vitrine-plate-contrast.mjs` (whole file) | Sampled plate-caption contrast against the `vitrine-field` shader | TC-IF-17 |

## 7. Audit gate changes

**None.** `scripts/validate/overhaul_static_audit.mjs` was re-read after the removal: none
of its ten gates counts a scene mount or a canvas — `TC-ARCH-BENCH` is about the
`/performance-benchmark` route, not the skills bench. The audit is **10/10** on its
existing contract (`docs/delivery/evidence/v10-20260905T0515Z/W3-RM2/04-audit.log`).

Two gates are touched by the removal and hold without a change:

- `TC-NFR-DEADCSS` — the styles for every removed node are deleted in this same commit
  (`.chartScene`, the six `descent*` blocks and their two media-query rules, `.stage`,
  three `.fieldSlot`s, two `.field`s, `.drawingFrame`), and `Drawings.module.css` is
  deleted whole.
- `TC-NFR-PERF` — five deleted shaders only reduce the shipped weight.
