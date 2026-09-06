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
