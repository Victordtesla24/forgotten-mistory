# G-H1 — Hero first-fold placement research

**Task:** `t_g2_h1` (research leg) · **Profile:** researcher (docs/prompt.md §5, effort high) · **Identity:** `t_g2_h1_h1-research` / ADV-1556Z
**Scope:** prior-art evidence for one dominant visual plane in the hero first fold; it does **not** re-open the composition brief. Binding composition stays `docs/architecture/HERO-FOLD-v2.md`; this note supplies the external grounding that brief's §2 asks for and orders the two visible slices (`t_h2_03`, `t_h2_04`).
**Method:** live web search this session; every claim below carries a URL fetched on 2026-09-05. No source is quoted as a measurement — the lanes measure. Where a source is a marketing page or a template, it is cited as *pattern precedent*, never as a spec.

---

## 1. The question this research answers

The 1451Z reviewer failed the fold on **intent**, not density: *"polished hire landing, not cinematic stage; the colour headshot is a framed card beside a column; the H1 dominates; the brand is chrome"* (`docs/architecture/HERO-FOLD-v2.md` §1, quoting `G-REV/9ba97a5c/08-adversarial-review.md`). The creative council put a number on it — *"give the atmosphere the whole 100 vw × 100 vh and let type sit inside it, not beside it … dominant visual coverage ≥ 0.75 (measured 0.114)"* (`G-REV/9ba97a5c/08-adversarial-review.md` §3, `#hero` directions 1–2).

So the open question is not "can a dominant plane be built" — the brief already specifies `SPD ≥ 0.75/0.78` and the four moves M1–M4. The open question is **what the award-tier field actually does with the three hard parts**:

1. a name that must dominate the *type hierarchy* without becoming a paragraph;
2. a photograph that must live *inside* the plane, not in a second column;
3. readability bought *locally* (plates/keys) once the full-frame scrim is gone.

The findings below are organised on those three axes and then sequenced onto `t_h2_03` / `t_h2_04`.

---

## 2. Prior art — the dominant plane with type *inside* it

**Finding 2.1 — The award-tier pattern is "text is part of the scene," achieved by unifying text and background with a shared treatment, not by a dark overlay.**
Two 2026 Codrops build write-ups converge on the exact failure mode the 1451Z review named (a scrim that splits the fold into "two worlds") and reject it:

- *They Call Me Giulio* (cinematic portfolio, Codrops, 2026-04-14): *"when you overlay text on a deep 3D scene, readability collapses. I didn't want to solve it with the usual dark overlay or semi-transparent background. That would break the immersion and create two separate 'worlds'. … I brought the text content directly into the 3D scene and unified everything with shared effects … a subtle noise texture on the texts that makes them blend naturally with the background. This way, the text doesn't cover the scene. It becomes part of the scene."* — <https://tympanus.net/codrops/2026/04/14/they-call-me-giulio-the-making-of-a-cinematic-cyberpunk-portfolio/>
- *More Than a Portfolio* (scroll-driven 3D world, Codrops, 2026-04-28): the author's brief to himself — *"Not a scrolling document. Not a neat stack of cards … an environment the visitor actually enters, where every scene is composed with the same care a film sets a frame,"* with the hero being *"an architectural 3D environment, lit like an early morning underwater city, with the line … over it."* — <https://tympanus.net/codrops/2026/04/28/more-than-a-portfolio-building-a-scroll-driven-3d-world-with-something-to-say/>

**Bearing on the brief.** This is direct external corroboration for M1 (retire the half-frame wash) *and* for the reason it is safe: the field's own answer to "the scrim is what makes it wallpaper" is a *local* text treatment (a shared noise/plate that binds type to scene), which is exactly the per-run plate M1 promotes to every width (`HERO-FOLD-v2.md` §2 M1, §8 AA-interlock). It also warns against the naive fix the brief already rejects — `designdrastic.com`'s "immersive video hero" ships precisely the full-frame `linear-gradient` overlay the brief is deleting (<https://designdrastic.com/snippet/video-background-hero/>), so it is a **counter-example**, not a model: it keeps the two worlds the brief is trying to collapse.

**Finding 2.2 — In the strongest single-subject heroes, the wordmark *is* the plane's dominant object and the composition carries no secondary copy or CTA fighting it.** shadcnblocks "Hero 220 — Full-viewport hero with video-filled wordmark": *"The layout is intentionally sparse so the wordmark dominates; there is no secondary copy or CTA in the default component, only atmosphere … It reads as cinematic branding rather than conversion-heavy marketing … the hero is height locked."* — <https://www.shadcnblocks.com/block/hero220>. The same "the text is the visible footage / deep black backdrop is the canonical look / ultra-heavy display face so the letterforms carry the media" pattern is documented on crazygl's text-video-mask primitive — <https://crazygl.com/hero/text-video-mask>.

**Bearing on the brief.** Corroborates §3.3 ("a big name does not break SPD") and §6 (one quiet CTA bar): the field routinely lets a single mark dominate the *type* axis while the plane dominates the *light* axis, and it does so by **removing competing bright objects** — the same reason CTA-3 retires the filled-white primary pill (`HERO-FOLD-v2.md` §6, D-4). It is also a caution: Hero 220 achieves dominance by having *no* sentence and *no* CTA; our fold keeps ≤1 of each, so our plates and CTA-quietness (CTA-3 `Σm ≤ 0.06`) are doing the work the sparse references get for free.

---

## 3. Prior art — the name as a brand mark (informs `t_h2_03` / M2 / §4)

**Finding 3.1 — "One word/one line filling the frame, tight leading, over low-opacity photography" is an established SOTD-tier signature, and the measured recipe is public.** The Shelby Kay editorial system (documented on Refero) is the closest single precedent to M2 + BM-1..BM-4: *"a single word filling the frame. Always uppercase, always at maximum scale … Ranade at 265px, weight 400, line-height 0.90, no letter-spacing. Stretches full viewport width edge-to-edge … a large botanical photograph at ~12% opacity filling the background … full-bleed layout with no max-width container."* — <https://styles.refero.design/style/2ab2f666-6da7-4cd8-bc91-52a28bd560ad>

**Bearing on the brief.** Three transferable facts, each mapped to a clause:

- *Set to the full measure, no max-width column* → **BM-2** (advance 0.86–1.00 of the measure) and decision **D-2** (collapse the two-column grid). Precedent confirms the collapse is the enabling move, not a risk.
- *`line-height` 0.90, tight/near-zero tracking on a display face* → **BM-1 / BM-1b / BM-4**. Note the precedent runs a *single word* at 265px; our mark is a **two-word 16-glyph** name, which is why BM-1b (an authored two-line lockup at ≤0.92 em leading) exists for 390 and must not be treated as a failure to hit one line. The precedent's 0.90 leading is corroboration that sub-1.0 leading reads as "sculptural mark," not as a cramped heading.
- *Name over photography at ~12% opacity* → do **not** import this literally: our photograph is a lit subject, not a wash. The transferable idea is that the mark and the image share the same plane; the differentiator (§4 below) is that our figure is *keyed*, not faded to 12%.

**Finding 3.2 — "The type is the interface / the headline is the hero, not a label above content" is what the type-led awards actually reward.** Mat Voyce (Awwwards **Site of the Day**, Jan 2025, scored 7.59; GSAP Site of the Year 2025 nominee): *"The type is the interface. Headlines aren't labels sitting above content — they're the hero, the navigation cue, and the personality."* — <https://www.hontran.dev/blog/mat-voyce-case-study-award-winning-portfolio>. Catalin Vintila (Awwwards Nominee) lists "Kinetic hero typography" as its lead highlight element — <https://www.awwwards.com/sites/catalin-vintila-portfolio>.

**Bearing on the brief.** Direct external support for the reviewer-vs-brief reconciliation in §3.3 and §4: making the name *the* object is the award-winning move, provided it is a **mark** (one line, set to the measure) and not a wrapped heading. This is the precise defect the brief measures with **BM-1** (`h1` height ≤ 1.30× font-size), which is *currently failing* because the 118px name wraps in a 660px column (`HERO-FOLD-v2.md` §4).

**Finding 3.3 — Fluid `clamp()` for the mark is the field default, but the value must be measured, not guessed.** Every hero-scale reference uses `clamp()` for the display size (CodeFronts hero corpus: *"use `clamp()` for every scale-sensitive property"* — <https://codefronts.com/layouts/css-hero-sections/>; Lovable editorial template: *"Hero name scales smoothly from 48px to 160px using clamp-based fluid sizing"* — <https://lovable.dev/templates/websites/portfolio/serif-editorial-designer-portfolio>). The same corpus independently confirms two of the brief's live gates: prefer `100svh` over `100vh` because *"`100vh` jumps 60-80px mid-scroll … a Core Web Vitals CLS event"*, and animate *"transform + opacity, never margin/top/width/height"* to protect INP — matching `HERO-FOLD-v2.md`'s TC-FOLD-03 (`100svh`) and BM-5 (`heroRiseSolid`, transform-only, never opacity, or the LCP candidate disappears).

**Bearing on the brief.** Corroborates D-2/§4's insistence that the clamp be **derived from a real browser advance measurement** (`t_h2_03` execution step 1, "record the number in the commit body"), never from the brief's 166px/11.5vw arithmetic estimate. The external field uses `clamp()`; it does not license our specific numbers.

---

## 4. Prior art — the photograph integrated into the plane (informs `t_h2_04` / M3 / §5)

**Finding 4.1 — The field integrates a subject by dissolving its edges with a mask/gradient, not by framing it.** The Codrops "More Than a Portfolio" hero stands *"a small astronaut figure … in the middle of a field of roses … through fog"* — a figure held in the scene's own light and atmosphere, never a bordered card (<https://tympanus.net/codrops/2026/04/28/…>). At the primitive level, the masked-hero corpus repeatedly builds the effect with `mask-image` / SVG clip / `mix-blend-mode` so a media edge "falls off" into the backdrop rather than ending on a rule:

- FreeFrontend "Cinematic Masked Video Hero": *"layers solid and outlined typography over an SVG-clipped video element … breaking away from standard rectangular layouts through organic polygon masking."* — <https://freefrontend.com/code/cinematic-masked-video-hero-2026-04-09/>
- emineugurlu/ASIA: *"dynamic video masking, interactive `mix-blend-mode` typography … non-destructive image processing directly in the browser."* — <https://github.com/emineugurlu/ASIA>

**Bearing on the brief.** Direct precedent for M3 / §5.1: drop `.portraitFrame` + the four `.portraitTick` corners + `.portraitCross` (the closed rectangle with registration marks the reviewer called a card, `HERO-FOLD-v2.md` §1.3, §5.1) and apply a composite `mask-image` so the outer edges dissolve into the plane (**PH-1** no closed rectangle, **PH-2** `|ΔL| ≤ 0.04` across ≥3 edges). The field's masks are compositing-only, which is why PH-5 (`CLS 0`, no box resize) is achievable.

**Finding 4.2 — "The light contains the figure": the way the field makes a subject read as *belonging* to the plane is to shape the environment's key around the subject, not the reverse.** The Codrops cyberpunk build uses a *dolly-zoom* so *"the subject stays perfectly in the foreground"* while the background breathes (<https://tympanus.net/codrops/2026/04/14/…>); Marcelo Retana's R3F guide describes the standard rig — a directional key plus environment/ambient fill and `ContactShadows` so the subject sits in the same lighting model as the scene (<https://marceloretana.com/learn/build-a-3d-portfolio-with-threejs>).

**Bearing on the brief.** Corroborates M4 / §5.2 (`PL-1`): bind the shader's existing `poolPlate` (`atmosphere.glsl.ts`, `vec2(0.75*halfWidth, -0.04)`, comment "behind the portrait plate") to the figure's measured centre via a `uPortrait` uniform, mirror it in the `.stage` radial fallback, and re-render the poster in the same commit (PL-3). The award-tier tell is that the *light is authored around the subject* — our pool-to-figure bind is the 2D-shader analogue of the field's 3D key-on-subject rig.

**Finding 4.3 — On performance discipline the field agrees with our live gates.** Mat Voyce's build: *"one active video at a time … lazy-load below the fold … `transform`/`opacity` only on the swap"* (<https://www.hontran.dev/blog/mat-voyce-case-study-award-winning-portfolio>); the CodeFronts corpus mandates reduced-motion guards and compositor-only motion (<https://codefronts.com/layouts/css-hero-sections/>). None of this contradicts the §8 regression gates (CLS < 0.05, LCP < 2.5s, reduced-motion still is "the same picture stopped"). No external source licenses relaxing any §8 gate; treat §8 as invariant.

---

## 5. How `t_h2_03` (name as mark) and `t_h2_04` (photo loses card) should sequence

The brief already declares the dependency (`t_h2_04.Parents = t_h2_03`). The research **confirms that order is correct and load-bearing, not incidental**, and explains why:

1. **The mark defines the axis the figure is composed against.** In every single-subject precedent (Shelby Kay, Hero 220, the Codrops figures), the wordmark is the *compositional anchor* and the subject/photo is placed *relative to it*. `t_h2_04`'s own acceptance requires the figure to "overlap the mark's **right end**" (`HERO-FOLD-v2.md` §5.1, `t_h2_04` role). That right end does not exist as a stable coordinate until M2 has (a) collapsed the two-column grid and (b) set the name on one line to the full measure. Masking the photo first would mean re-placing it after the grid collapse — wasted motion and a likely CLS event mid-sequence.

2. **M2 frees the measure that M3 needs.** M3 moves the figure *into* the copy's plane; while the fold is still a `minmax(0,1fr) var(--portrait-w)` two-column grid (`HERO-FOLD-v2.md` §1.3), the photo is *structurally* a second column no mask can hide. D-2 (collapse the grid) is inside `t_h2_03`. So the card cannot truly leave the fold until `t_h2_03` lands.

3. **Risk isolation matches the brief's revert story.** `t_h2_03` is `heroRiseSolid`/LCP-sensitive (BM-5) and `t_h2_04` is mask/CLS-sensitive (PH-5); keeping them as separate slices (D-3 "elements are already conditional-render candidates") means an LCP regression and a mask regression can be reverted independently. The field's own "separate concerns, transform/opacity only" discipline (Finding 4.3) supports the split.

4. **Parent already shipped.** `t_h2_02` (retire the desktop half-frame scrim, M1) is complete (`t_g2_h1.md` COMMENT 16:58Z). M1 is the precondition for both — once the wash is gone, both the mark's tracking and the photo's edge-falloff are read against the *lit* plane, which is the only context in which BM-4 tracking and PH-2 edge-`ΔL` are meaningful.

**Recommended first slice: `t_h2_03` (HERO-TASKS `g2h1-03-brand-mark-one-line`, M2 / §4).** It is the unblocked next slice (parent `t_h2_02` done), it is the single change that most directly overturns the reviewer's two loudest verdicts — *"H1 dominates (as a wrapped heading)"* and *"brand is chrome"* (a name set to the measure at ≥6× the nav wordmark, BM-8, makes the fold's mark the identity) — and it establishes the horizontal axis `t_h2_04` composes against. `t_h2_04` follows immediately on the same measure; `g2h1-05` (pool-to-figure) then keys the light around the placed figure.

---

## 6. Gaps / non-findings (researcher discipline)

- **No award-tier precedent for a *two-word personal name* set to one line at fold scale was found this session.** All single-line-mark precedents (Shelby Kay, Hero 220, crazygl) are *one word* or a short literal string. This is *positive evidence for BM-1b*: the brief's authored two-line phone lockup is the honest treatment, and the desktop one-line target should be validated by `t_h2_03`'s real advance measurement, not assumed from single-word precedent. Flagged to `t_h2_03`.
- **No source measured SPD or an equivalent luminance-weighted dominance metric.** The `≥0.75/0.78` figure remains the council's own number (`HERO-FOLD-v2.md` §3.2); `g2h1-01` prints the real baseline. No external number may be quoted as SPD evidence.
- **Counter-example logged, not modelled:** `designdrastic.com/snippet/video-background-hero/` ships the full-frame gradient overlay the brief deletes — cited only to show the field's *common* fix is the one 1451Z failed us for.
- Marketing/template pages (shadcnblocks, Lovable, CodeFronts, crazygl, Refero) are cited as **pattern precedent**, corroborated by the two Codrops engineering write-ups and the two Awwwards entries for anything load-bearing; none is treated as a spec or a measurement.

---

## Sources (all fetched 2026-09-05)

| # | Source | Tier | Used for |
|---|---|---|---|
| 1 | Codrops — *They Call Me Giulio* <https://tympanus.net/codrops/2026/04/14/they-call-me-giulio-the-making-of-a-cinematic-cyberpunk-portfolio/> | build write-up | text-into-scene (2.1), key-on-subject (4.2) |
| 2 | Codrops — *More Than a Portfolio* <https://tympanus.net/codrops/2026/04/28/more-than-a-portfolio-building-a-scroll-driven-3d-world-with-something-to-say/> | build write-up | plane-not-cards (2.1), figure-in-light (4.1) |
| 3 | Mat Voyce case study (Awwwards SOTD Jan 2025) <https://www.hontran.dev/blog/mat-voyce-case-study-award-winning-portfolio> | award + build | type-is-interface (3.2), perf discipline (4.3) |
| 4 | Catalin Vintila — Portfolio (Awwwards Nominee) <https://www.awwwards.com/sites/catalin-vintila-portfolio> | award entry | kinetic hero typography as lead element (3.2) |
| 5 | Design by Dylan (Awwwards SOTD Feb 3 2026) <https://www.awwwards.com/sites/c-design-by-dylan> | award entry | single-subject hero + typography precedent (2) |
| 6 | Shelby Kay design system (Refero) <https://styles.refero.design/style/2ab2f666-6da7-4cd8-bc91-52a28bd560ad> | documented system | name-as-mark full-bleed, LH 0.90 (3.1) |
| 7 | shadcnblocks Hero 220 <https://www.shadcnblocks.com/block/hero220> | pattern | wordmark dominates, no competing copy/CTA (2.2) |
| 8 | crazygl text-video-mask <https://crazygl.com/hero/text-video-mask> | pattern | text-is-the-footage, black backdrop (2.2) |
| 9 | FreeFrontend Cinematic Masked Video Hero <https://freefrontend.com/code/cinematic-masked-video-hero-2026-04-09/> | pattern | mask/clip edges dissolve (4.1) |
| 10 | emineugurlu/ASIA <https://github.com/emineugurlu/ASIA> | repo | mask + mix-blend-mode integration (4.1) |
| 11 | Marcelo Retana — 3D portfolio guide <https://marceloretana.com/learn/build-a-3d-portfolio-with-threejs> | tutorial | key+fill rig on subject (4.2) |
| 12 | CodeFronts hero sections <https://codefronts.com/layouts/css-hero-sections/> | corpus | clamp, 100svh, transform-only (3.3, 4.3) |
| 13 | Lovable editorial portfolio template <https://lovable.dev/templates/websites/portfolio/serif-editorial-designer-portfolio> | template | clamp fluid hero name (3.3) |
| 14 | designdrastic immersive video hero <https://designdrastic.com/snippet/video-background-hero/> | counter-example | the full-frame scrim the brief deletes (2.1, 6) |

*Note: OpenRouter was treated as unavailable (402); reasoning ran on the Anthropic OAuth path. No `ANTHROPIC_API_KEY`, no Hermes. Findings are docs-only; no production code was read for edit and none was changed.*
