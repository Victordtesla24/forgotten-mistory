# HERO-SETPIECE-v3 — the first fold as one plane, with the figure standing in it

- **Task:** `t_w2_h1sa` · **Gap:** G-H1 (P0, ADV-REVIEW-20260905T2315Z §Hero FAIL) · **Role:** solutions-architect (docs/prompt.md §5)
- **Identity:** `sa-w2-h1` · **Written:** 2026-09-06, read-only session on `/root/forgotten-mistory` @ `cd2544d`
- **Supersedes:** `docs/architecture/HERO-FOLD-v2.md` for the R1 bar. v2's §3 measure (SPD) and §5.1 mask survive verbatim and are load-bearing here; v2's §2 composition (a reading column beside a picture column) does not.
- **Research input:** `docs/delivery/evidence/v10-20260905T0515Z/W2-RESEARCH/G-H1-G-X2-prior-art.md` (three compositions A/B/C, ranked A > B > C).
- **Decision authority:** docs/prompt.md §0.1 — decided in-session, logged here, not asked. Non-interactive.

**Every number below is either read from a file in this repo this session, or arithmetic on such a number, or labelled `estimate`.** Nothing is quoted from a prior document as measurement.

---

## 0. The recruiter sentence this fold is built to produce

> **"His face is standing in the shaft of light that his name is written across."**

One clause. One set piece. If a reviewer opens the site and says anything with two nouns joined by "and" — a column *and* a picture, a headline *and* a headshot — the fold has failed, whatever the gates print.

---

## 1. Composition A wins, and the instrument decides it (not taste)

**Chosen: (A) the atmosphere GLSL is the plane; the monochrome photograph is composited inside it.**

The research doc ranked A first on craft grounds. This session found two *mechanical* reasons that make the ranking non-negotiable — both derived from files read this session, not from the research doc.

### 1.1 The SPD instrument's own ink rule eliminates C outright and taints B

`scripts/validate/hero_plane_dominance.mjs` (read this session, lines 20–50) defines the ink set:

```
Ink set I = (a) every text-leaf rect in the fold
          ∪ (b) every media rect — `img`, `video`, `svg`
          ∪ (c) every element whose computed background-color alpha ≥ 0.5
          each dilated 8 px.        Plane P = fold ∖ I.        SPD = Σ_P m / Σ_fold m
```

and the ground-chain exemption, written into the module's own header:

> "the **ground chain** — the stage slot `[data-scene="hero-atmosphere"]`, its ancestors, and its descendants (the canvas and the poster still) — is the plane by definition and is never ink."

Consequences, by construction:

| Composition | How the photograph ships | Effect on `I` | SPD outcome |
|---|---|---|---|
| **(C) Apple pattern** — full-bleed `<img>` with type stacked over it | an `<img>` filling the fold | rule (b) puts ~100% of the fold into `I` | **SPD → ≈ 0.** PLANE-1 fails by construction. The composition fails the exact gate it exists to pass. |
| **(B) portrait plate is the plane** — full-bleed `background-image` on a div | a `background-image`; rule (b) reads `img/video/svg` only, rule (c) reads `background-**color**` alpha | escapes `I` **through a hole in the rule**, not by being the plane | SPD passes, but only because the measurement cannot see the picture. That is measurement-gaming; the next adversarial reviewer overturns it exactly as ADV-1451Z overturned "flagship". |
| **(A) figure composited inside the plane** | inside the declared plane subtree, alongside the canvas and the poster | plane **by declaration**, printed in `groundChain` on every run | SPD is *earned*: the photograph is not an object placed on the backdrop, it is part of the backdrop. This is literally what G-H1 asks for — "Photograph **in** the plane". |

The DOM move *is* the design move. That is why A wins.

### 1.2 The still ceiling forbids a full-bleed photograph at the gate's own tablet width

`app/data/portfolio/avatar.ts` (read this session): *"1480×826 is the honest still ceiling on this host: no larger portrait still exists, and nothing here is upscaled."* Confirmed by `identify` this session:

```
public/assets/my_avatar.avif   AVIF 1480x826   36,551 B
public/assets/my_avatar.png    PNG  1480x826  483,145 B (256-colour greyscale)
```

`background-size: cover` of a 1480×826 (1.792:1) still into each gate viewport requires:

| viewport | aspect | cover scale | rendered | verdict |
|---|---|---|---|---|
| 1440×900 | 1.600 | 900/826 = **1.090×** | 1612×900 | marginal upscale |
| 1280×800 | 1.600 | 800/826 = **0.969×** | 1433×800 | downscale, fine |
| **834×1194** | 0.699 | 1194/826 = **1.445×** | 2139×1194 | **44.5% upscale of the site's largest raster, on a gate viewport** |
| 390×844 | 0.462 | 844/826 = **1.022×** | 1512×844 | marginal |

B and C both require that 1.445× upscale. A does not: A bounds the figure's rendered box (§3) so it is never scaled above 1.0× on any device the site supports.

### 1.3 What A costs, stated honestly

- **It requires an instrument change** (§4, D-4) — the ground chain must be declared as `[data-plane="hero"]` so the figure can carry its `alt` and stay visible to assistive tech. An exemption that grows is an exemption that gets abused, so **TC-HERO-PLANE-03** fences it: nothing pressable and no text leaf may live inside the declared plane.
- **It concentrates risk on one asset.** With no GL and reduced motion, the plane is `hero-atmosphere-poster.avif` (measured this session: **3840×2160, AV1, 12,935 bytes**) plus the figure layer. If the poster is wrong, the fold is wrong on both fallback paths at once. §6 pins the poster's re-render to the same shader so it cannot drift.

### 1.4 Why the losers lose, in one line each

- **(B)** loses on §1.1 (passes SPD only through a rule hole) and §1.2 (1.445× upscale at 834). It stays the fallback direction if A's SPD measures short after slice 2.
- **(C)** loses on §1.1 (SPD ≈ 0 by construction) and additionally under-uses the one bespoke asset the site owns, which works directly against R2/G-X2.

---

## 2. The set piece, in words

One plane fills the fold: the atmosphere's raked shafts and its two pools, edge to edge, nothing over it and nothing beside it. The photograph stands inside that plane, right of centre, its outer margin dissolving into the light so it has no edge a reader can find. The name is struck across the full measure of the page and its baseline crosses the figure's dissolving lower band — the type and the picture touch, so they read as one surface rather than two zones. One sentence sits under the name. One quiet bar of two actions sits under that. Everything else — the three figures, their provenance, the role line, the city, the portrait's play control — begins at exactly `100svh` and not one pixel above it.

---

## 3. Geometry — four viewports, numeric

Tokens read from source this session: `--nav-height: 5.5rem` (88 px), `--page-max: 78rem` (1248 px), `--page-gutter: clamp(1.5rem, 5vw, 5rem)` (`app/globals.css`). Content column = `min(1248, viewport − 2·gutter)`, centred. Figure aspect fixed at **1480/826 = 1.7918** (`avatar.ts`, intrinsic).

**FIG-CAP — the figure's rendered CSS width never exceeds 846 px.** Derivation: the site caps DPR at 1.75 (research §4, F8), so the largest CSS box that 1480 device-pixels can fill without upscaling is `1480 / 1.75 = 845.7 → 846`. This is a hard clamp, asserted by TC-HERO-SET-03.

### 3.1 The plane at every viewport

`[data-plane="hero"]` is `inset: 0` on `#hero`'s first band: **x 0 → W, y 0 → H, area = 100% of the fold**, at all four viewports and on both paths. It contains exactly two children: the `<Scene>` stage slot (canvas on the GL path, poster still otherwise) and `.planeFigure`.

### 3.2 1440×900 — gutter 72, column x 96 → 1344

```
 0                                                                        1440
 ┌──────────────────────────────────────────────────────────────────────────┐ 0
 │ VIKRAM.  20px  x96 y30–50                    [nav · Ask Mini Vic]        │
 │                                                                          │
 │                            ┌───────────────────────────────────┐ y148    │
 │      P L A N E             │        .planeFigure  846×472      │         │
 │   (shafts + pools,         │   face-safe x691–1199 y242–526    │         │
 │    edge to edge)           │ ░░ dissolve band y535–620 ░░░░░░░ │ y620    │
 │                            └───────────────────────────────────┘         │
 │  Vikram Deshpande            ← H1 112px, x96→1028, cap y556–668          │
 │  ─────────────────────────────────────╫── crosses the dissolve, not the face
 │  Sixteen years leading delivery …      x96 w640, y700–784 (3 lines)      │
 │                                                                          │
 │  [ See the evidence ] [ Download CV ]  x96 y812–860, 48px targets        │
 └──────────────────────────────────────────────────────────────────────────┘ 900
   .proof (ledger) top = 900 ─ exactly the fold height, never above it
```

| box | x | y | w × h |
|---|---|---|---|
| plane | 0 → 1440 | 0 → 900 | 1440 × 900 (100%) |
| `.planeFigure` | 522 → 1368 | 148 → 620 | **846 × 472** (1.000× scale) |
| — dissolve band (α→0) | 522 → 1368 | 535 → 620 | 846 × 85 |
| — face-safe (inner 60%) | 691 → 1199 | 242 → 526 | 508 × 284 |
| — pool centre (uv) | 945 px | 384 px | **(0.656, 0.427)** |
| brand mark | 96 | 30 → 50 | 20 px cap |
| H1 (1 line, 112 px) | 96 → ≈1028 | 556 → 668 | overlaps figure x522–1028 × y556–620 = inside the dissolve ✓ |
| statement (19/28) | 96 | 700 → 784 | measure 640, 3 lines |
| CTA bar | 96 | 812 → 860 | 48 px tall |
| **ledger top** | — | **≥ 900** | = `innerHeight` |

### 3.3 1280×800 — gutter 64, column x 64 → 1216

| box | x | y | w × h |
|---|---|---|---|
| plane | 0 → 1280 | 0 → 800 | 1280 × 800 (100%) |
| `.planeFigure` | 416 → 1216 | 120 → 566 | **800 × 446** (0.946× scale) |
| — dissolve band | 416 → 1216 | 486 → 566 | 800 × 80 |
| — face-safe | 576 → 1056 | 209 → 477 | 480 × 268 |
| — pool centre (uv) | 816 px | 343 px | **(0.638, 0.429)** |
| brand mark | 64 | 28 → 48 | 20 px |
| H1 (1 line, 102.4 px) | 64 → ≈916 | 500 → 602 | overlaps x416–916 × y500–566 = dissolve ✓ |
| statement | 64 | 634 → 714 | measure 600, 3 lines |
| CTA bar | 64 | 740 → 788 | 48 px |
| **ledger top** | — | **≥ 800** | |

### 3.4 834×1194 — gutter 42, column x 42 → 792

```
 0                                     834
 ┌─────────────────────────────────────┐ 0
 │ VIKRAM. 20px                        │
 │        P  L  A  N  E                │
 │   ┌───────────────────────────┐ 210 │
 │   │   .planeFigure 750×419    │     │
 │   │  face-safe x192–642       │     │
 │   │░░ dissolve y566–628 ░░░░░░│ 628 │
 │   └───────────────────────────┘     │
 │  Vikram      ← H1 66.7px, 2 lines   │
 │  Deshpande      cap y596–740        │
 │  Sixteen years leading delivery …   │
 │        x42 w690 y780–900            │
 │  [ See the evidence ]               │
 │  [ Download CV ]     y930–986       │
 │        (plane breathes 208px)       │
 └─────────────────────────────────────┘ 1194
```

| box | x | y | w × h |
|---|---|---|---|
| plane | 0 → 834 | 0 → 1194 | 834 × 1194 (100%) |
| `.planeFigure` | 42 → 792 | 210 → 628 | **750 × 418** (0.887× scale) |
| — dissolve band | 42 → 792 | 566 → 628 | 750 × 62 |
| — face-safe | 192 → 642 | 294 → 544 | 450 × 250 |
| — pool centre (uv) | 417 px | 419 px | **(0.500, 0.351)** |
| brand mark | 42 | 30 → 50 | 20 px |
| H1 (**2 lines**, 66.7 px) | 42 | 596 → 740 | overlaps figure y596–628 = dissolve ✓ |
| statement | 42 | 780 → 900 | measure 690, 4 lines |
| CTA bar | 42 | 930 → 986 | two 48 px rows, 8 px gap |
| **ledger top** | — | **≥ 1194** | 208 px of open plane below the CTA |

### 3.5 390×844 — gutter 24, column x 24 → 366

| box | x | y | w × h |
|---|---|---|---|
| plane | 0 → 390 | 0 → 844 | 390 × 844 (100%) |
| `.planeFigure` | 24 → 390 (bleeds right) | 150 → 354 | **366 × 204** (0.433× scale) |
| — dissolve band | 24 → 390 | 323 → 354 | 366 × 31 |
| — face-safe | 97 → 317 | 191 → 313 | 220 × 122 |
| — pool centre (uv) | 207 px | 252 px | **(0.531, 0.299)** |
| brand mark | 24 | 26 → 44 | 18 px |
| H1 (**2 lines**, 52 px) | 24 | 330 → 442 | overlaps figure y330–354 = dissolve ✓ |
| statement | 24 | 474 → 642 | measure 342, 6 lines |
| CTA bar | 24 | 670 → 790 | two 48 px rows + 24 gap |
| **ledger top** | — | **≥ 844** | 54 px margin |

**Phone note (load-bearing):** `HeroAtmosphere.tsx` sets `uQuality = size.width >= 900 ? 1 : 0`, and at `uQuality = 0` the shader drops the near ridged layer and the second shaft (`atmosphere.glsl.ts` lines 157, 213). The pool must therefore be bound in **uv space**, not in the shaft's constants, or it vanishes on the phone branch — the same failure the shader's own comment records at lines 186–189 ("the shaft's Gaussian evaluated to zero across the whole phone viewport"). §5 specifies this.

---

## 4. How the plane and the photograph merge

### D-4 — the plane is declared, not inferred

Today the instrument infers the plane from `[data-scene="hero-atmosphere"]`. `Scene.tsx` line 283 renders that slot with **`aria-hidden="true"`**, so a `<picture>` placed inside it would be hidden from assistive technology — unacceptable for a photograph of the person the page is about, and `aria-hidden` on an ancestor cannot be undone by a descendant.

**Decision:** introduce `.plane` with **`data-plane="hero"`**, wrapping `<Scene>` and a sibling `.planeFigure`. The instrument's ground chain becomes `[data-plane="hero"]`, its ancestors and its whole subtree. The figure keeps `alt="Portrait of Vikram Deshpande"` and stays in the accessibility tree.

**Reversal cost:** low — one attribute, one CSS wrapper, one constant in the instrument.
**Abuse guard (mandatory, ships in the same slice):** **TC-HERO-PLANE-03** asserts the declared plane subtree contains **zero** text-leaf rects and **zero** `a, button, [role="button"], input, select, textarea` — the exemption can never be widened to hide type or a CTA from the measure. `groundChain` is already printed on every run (`formatReport`), so a reviewer re-derives the exemption rather than trusting it.

### 4.1 Compositing — CSS layer, shader light

Two layers, one exposure:

1. **`.planeFigure`** — the existing `<picture>` (AVIF → WebP → PNG) and the `<video>`, moved verbatim out of `.portraitMedia` and into the plane at the §3 geometry. It keeps the composite mask HERO-FOLD-v2 §5.1 already shipped (`components/sections/Hero/Hero.module.css`, `.portraitMedia`): outer edges dissolve via `mask-image`, extended here to a named **dissolve band** on the lower edge (§3 tables) so the name's baseline can cross vanishing photograph and never the face.
2. **The shader** paints the light the figure stands in. `atmosphere.glsl.ts` line 230 already carries `float poolPlate = exp(-dot(q2, q2) * 2.60);` — authored, per the file's own comment, as the pool "behind the portrait plate", and bound to a fixed constant today. **It binds to the figure's measured centre** (§3 uv values) through two new uniforms.

**No photograph is sampled inside the fragment shader.** A texture upload would put the still on the GL critical path, cost a decode before first paint, and have no counterpart on the reduced-motion path where no canvas mounts at all. The light is procedural; the figure is a DOM layer inside the declared plane; they share one exposure because the pool is aimed at the figure's centre and the figure's edges dissolve into it.

### 4.2 New uniforms (two, both cheap)

| uniform | type | value | purpose |
|---|---|---|---|
| `uFigure` | `vec2` | the §3 uv centre per viewport, written from the figure's measured `getBoundingClientRect()` | replaces `poolPlate`'s constant `q2` centre — the pool follows the figure at every width, including the `uQuality = 0` phone branch |
| `uCopyGuard` | `vec4` | the union rect of the fold's text leaves, in uv | a soft luminance-suppression lobe under the type — the plane flags its own light, the way a gaffer flags a lamp |

**`uCopyGuard` is bounded, and the bound is a gate.** Its −50 % contour must lie **inside the union of the fold's text rects dilated 8 px** — the same dilation the instrument uses. Any wider and the guard would buy contrast by darkening pixels that count in `Σ_P m`, i.e. by lowering SPD to raise contrast. Asserted by TC-HERO-A11Y-01 read together with TC-HERO-PLANE-01: both must be green on the same build.

### 4.3 The on-demand rungs

| rung | asset | measured this session | when it is fetched |
|---|---|---|---|
| still (always) | `my_avatar.avif` 1480×826, 36,551 B | `identify` | server-rendered, `fetchpriority=high` |
| loop (on intent) | `my-hero-avatar.mp4` **1280×720 @ 24 fps, 12.29 s, 1,916,328 B, H.264, greyscale** | `ffprobe` | `preload="none"`, `src` assigned on first pointer-enter over the figure or press of the named control in `.proof` — the mechanism already in `HeroPortrait.tsx` (`usePortraitOnIntent`), carried over unchanged |
| 4K master | `artifacts/masters/minivic-greeting-2160p-master.mp4` — 58,370,772 B, 3840×2160 **@ 24 fps** | `ls -la` | **never shipped.** It is not in `public/`, and it must not be moved there. |

Budget: the loop is **1.916 MB ≤ 2.5 MB** and is off the critical path by construction. **R5 stays OPEN**: 3840×2160 @ **24** fps is not ≥ 3840×2160 @ 60 fps, and the asset ladder (`docs/delivery/evidence/v10-20260905T0515Z/G2-H5/asset-ladder.md`) already published that. **This brief makes no R5 claim and no slice below may add one.**

Hover/focus/scroll trigger: pointer-enter over `.planeFigure` arms it; `prefers-reduced-motion` disarms hover but keeps the named control (WCAG 2.2.2 — a reader's own press is allowed); scroll never triggers it. Nothing plays by default, at any viewport, on any path.

---

## 5. The three fallback paths, which are one picture

| path | canvas | plane content | figure |
|---|---|---|---|
| GL (`?gl=force`, or a capable GPU) | 1, `resolutionScale 0.5` | live shader | `.planeFigure` at §3 geometry |
| `prefers-reduced-motion` | **0** (Scene's contract; pinned by `hero-plane-dominance.spec.ts:143`) | `hero-atmosphere-poster.avif` as the stage's painted still | identical geometry |
| no WebGL / chunk in flight | 0 | same poster | identical geometry |

**The poster is re-rendered from the same shader** (`scripts/assets/render_atmosphere_poster.mjs`, slice 2) with `uFigure` and `uCopyGuard` at their 16:9 values, so the still is not an approximation of the GL frame — it is the GL frame.

**Poster crop-safety — computed this session.** The poster is 3840×2160 (16:9, `identify`). Under `background-size: cover` the horizontally-visible window is:

| viewport | scale | rendered | visible x window |
|---|---|---|---|
| 1440×900 | 0.4167 | 1600×900 | 5.0 % → 95.0 % |
| 1280×800 | 0.4167 | 1422×800 | 5.0 % → 95.0 % |
| 834×1194 | 0.5528 | 2123×1194 | 30.4 % → 69.6 % |
| 390×844 | 0.3907 | 1500×844 | 37.0 % → 63.0 % |

**Intersection: x ∈ [37.0 %, 63.0 %] — a 26 %-wide centre column is all that survives at every gate viewport.** Therefore: the poster's shaft convergence and its brighter pool must both read inside that centre column, and **the figure is never baked into the poster** — it is always the separate `.planeFigure` layer, positioned per viewport by CSS, so it cannot be cropped away at 390×844. This is a correction to the research doc's §3(A) suggestion of pre-compositing the figure into the poster at build time; that suggestion would delete the face on a phone.

---

## 6. Typography — the brand is not dwarfed

ADV-2315Z: *"Brand 16–18 px vs H1 ~60–131 px — H1 owns the fold."* Measured from source this session: `.name` is `clamp(3.75rem, 9.7vw, 8.2rem)` (`Hero.module.css:429`) → 131.2 / 124.2 / 80.9 / 60.0 px at the four widths. Against an 17 px nav mark that is **7.7 : 1** at 1440.

Two moves, both testable:

1. **The H1 *is* the brand mark** in this composition (bierman.io precedent, research §1) — so the nav `VIKRAM.` is wayfinding, and it is lifted so it is not a rounding error: **1.25 rem (20 px) at ≥ 834, 1.125 rem (18 px) at 390**.
2. **The H1 is bounded**: `clamp(3.25rem, 8vw, 7rem)`.

| viewport | H1 px | brand px | ratio | TYPE-1 (2.5 ≤ r ≤ 6.0) |
|---|---|---|---|---|
| 1440×900 | 112.0 (cap 7 rem) | 20 | **5.60** | ✓ |
| 1280×800 | 102.4 (8 vw) | 20 | **5.12** | ✓ |
| 834×1194 | 66.7 (8 vw) | 20 | **3.34** | ✓ |
| 390×844 | 52.0 (floor 3.25 rem) | 18 | **2.89** | ✓ |

The name still dominates the *type hierarchy* by 5.6× over the statement's 19 px — HERO-FOLD-v2 §3.3's two-axis argument holds unchanged. One line at ≥ 720 px, the authored two-line lockup below it via the existing `.nameBreak`.

### 6.1 The copy budget, and what leaves the fold

`app/data/portfolio/hero.ts` is **not edited**. What changes is where `Hero.tsx` renders three of its strings.

| string | today | v3 |
|---|---|---|
| `name` | H1 in the fold | H1 in the fold — unchanged |
| `statement` | fold | fold — the one sentence, unchanged |
| `actions` (2) | fold, one group | fold, one group — unchanged |
| `role` | fold, `.role` | **→ `.proof`**, below the fold |
| `location` | fold, `.eyebrow` | **→ `.proof`**, beside `availability` |
| `avatarContent.caption` "Photograph · Melbourne" | fold, `<figcaption>` | **→ `.proof`**, beside the play control |
| `ledger` ×3 + `grading` + `availability` + `links` | `.proof` | `.proof` — unchanged, already below `100svh` |

Nothing is deleted (R-16 discipline): three strings move one scroll down. Fold text leaves after the move: **brand mark, H1, statement = 3**, plus exactly one `[data-testid="hero-actions"]`. Removing the `<figcaption>` also removes a real text rect from `I`, which raises SPD honestly rather than by exemption.

---

## 7. Accessibility

- **Contrast ≥ 4.5:1 for every glyph over the plane**, measured against the **95th-percentile** luminance under each text rect (not the mean — a bright shaft crossing one word is the failure case). Delivered by `uCopyGuard` (§4.2), bounded so it cannot trade SPD for contrast.
- **Focus order:** nav brand → nav links → *Ask Mini Vic* → `hero-actions` primary → secondary → `.proof`. `.planeFigure` is **not** focusable and carries **no control** — G-H1's "one CTA group" and HeroPortrait's rule 5 (two competing CTA groups on live `9b864752`) both stay closed.
- **G-MV1 protected:** *Ask Mini Vic* keeps its label and is never hidden below 834 px. No slice below touches the dock's visibility.
- **Alt text:** `alt="Portrait of Vikram Deshpande"` survives the move into the plane — the whole reason for D-4.
- **Targets:** every CTA ≥ 48×48 CSS px at all four viewports (≥ WCAG 2.5.5 AAA 44 px).
- **Reduced motion:** the fold is complete and legible with zero canvases and zero playback.

---

## 8. TDD cases — written before any code

Thresholds are exact. Lowering one to make a run green is a violation (inherited from `t_h2_01` QUALITY GATES). All cases run at **1440×900, 1280×800, 834×1194, 390×844** and, where marked ⇄, on **both** paths (`/?gl=force` settled, and the `prefers-reduced-motion` still).

| id | file | assertion | threshold |
|---|---|---|---|
| **TC-HERO-PLANE-01** ⇄ | `tests/overhaul/hero-plane-dominance.spec.ts` (exists) | `SPD = Σ_P m / Σ_fold m` | **≥ 0.75**; ship **≥ 0.78** |
| **TC-HERO-PLANE-02** ⇄ | same | `Σ_fold m / (W·H)` | **≥ 0.045** |
| **TC-HERO-PLANE-03** ⇄ | same (new case) | `[data-plane="hero"]` subtree contains 0 text-leaf rects and 0 `a,button,[role=button],input,select,textarea`; its rect area ÷ fold area | **0, 0, ≥ 0.98** |
| **TC-HERO-SET-01** ⇄ | `tests/overhaul/hero-setpiece.spec.ts` (new) | fold text-leaf **blocks** (brand, H1, statement) and CTA groups; other pressables in the fold | **≤ 3 blocks, exactly 1 group, 0 others** |
| **TC-HERO-SET-02** ⇄ | same | `[data-testid="hero-proof"]` `getBoundingClientRect().top` | **≥ `innerHeight`** |
| **TC-HERO-SET-03** ⇄ | same | figure rect ⊂ plane rect; rendered CSS width; `naturalWidth/naturalHeight` | **contained; width ≤ 846 px; 1480×826** |
| **TC-HERO-SET-04** ⇄ | same | mean light mass `m` in an 8–24 px annulus around the figure ÷ fold mean `m` — the pool reaches the figure, it is not a plate on black | **≥ 1.35** |
| **TC-HERO-SET-05** ⇄ | same | no text-leaf rect intersects the figure's inner-60 % face-safe box; the H1 rect **does** intersect the figure's dissolve band | **0 intersections; ≥ 1 touch, ≥ 40 px of overlap** |
| **TC-HERO-TYPE-01** | `tests/overhaul/hero-typography.spec.ts` (new) | computed H1 px ÷ nav brand px | **2.5 ≤ r ≤ 6.0** |
| **TC-HERO-TYPE-02** | same | H1 line count | **1 at ≥ 720 px, 2 below** |
| **TC-HERO-A11Y-01** ⇄ | `tests/a11y/hero-contrast.spec.ts` (extend) | contrast(glyph colour, **P95** luminance under each fold text rect) | **≥ 4.5:1** |
| **TC-HERO-A11Y-02** | same | focus order matches §7; `.planeFigure` not in tab order; CTA target box | **exact order; 0 tabbable; ≥ 48×48 px** |
| **TC-HERO-GL-01** | `tests/e2e/hero-first-paint.spec.ts` (extend) | `?gl=force`: `pageerror` count; canvases in the plane | **0 errors; ≥ 1 canvas** |
| **TC-HERO-GL-02** | same | reduced motion: canvases; poster painted (non-zero luminance over the plane) | **0 canvases; lit ≥ 0.045** |
| **TC-HERO-PERF-01** | `tests/perf/hero-vitals.spec.ts` (extend) | LCP on the static export | **< 2.5 s** |
| **TC-HERO-PERF-02** | same | CLS on the static export | **< 0.05** |
| **TC-HERO-PERF-03** | same | requests for `my-hero-avatar.mp4` before any pointer/press; largest critical-path asset | **0 requests; ≤ 500 kB** |
| **TC-HERO-PAL-01** ⇄ | `tests/monochrome/` (extend `palette_bundle.test.mjs`) | max sRGB chroma across the fold capture; gold rects in the fold | **≤ 2/255; 0 gold** |

**Measurement note for SET-04 and A11Y-01:** both reuse `hero_plane_dominance.mjs`'s existing exports (`decodeLuma`, `relativeLuminance`, `planeDominance`) rather than a second luminance implementation — a fold that two instruments disagree about is a fold nobody can defend.

---

## 9. Build slices — four, each ≤ 30 min, each visibly shippable

Assignee for all four build slices: **analyst-programmer**. Each pushes its own branch; the pipeline consolidates (CLAUDE.md Workflow §5).

### S1 · `g2h1v3-01` — the plane owns the frame (30 min)
Introduce `.plane` (`data-plane="hero"`) wrapping `<Scene>` + `.planeFigure`; move `<picture>`/`<video>` out of `.portraitMedia` into the plane at §3 geometry; move `role`, `location`, `caption` into `.proof`; extend the instrument's ground chain to `[data-plane="hero"]` and add its fence.
**Files:** `components/sections/Hero/Hero.tsx`, `Hero.module.css`, `HeroPortrait.tsx`, `scripts/validate/hero_plane_dominance.mjs`, `tests/overhaul/hero-plane-dominance.spec.ts`, `tests/overhaul/hero-setpiece.spec.ts` (new).
**Green:** TC-HERO-PLANE-03, SET-01, SET-02, SET-03, SET-05.
**Visible:** the figure standing in the plane; the ledger gone from the first screen.
**Gates:** `tsc` clean · `lint` clean · `npm run build:static` · static audit 10/10 · no dead CSS (delete `.portraitFrame`/`.portraitTick`/`.portraitCross` styles in the same commit — `TC-NFR-DEADCSS`) · `hero.ts` unedited.

### S2 · `g2h1v3-02` — the light finds the figure (30 min)
Bind `poolPlate` to `uFigure` (uv, so the `uQuality = 0` phone branch keeps it); add the bounded `uCopyGuard` lobe; retire any residual `.stage::after` frame-wide wash; re-render `hero-atmosphere-poster.avif` from the same shader.
**Files:** `components/sections/Hero/atmosphere.glsl.ts`, `HeroAtmosphere.tsx`, `Hero.module.css`, `scripts/assets/render_atmosphere_poster.mjs` (new), `public/assets/hero-atmosphere-poster.avif`.
**Green:** TC-HERO-PLANE-01 (≥ 0.75), PLANE-02, SET-04, A11Y-01, GL-01, GL-02.
**Visible:** the pool lands on the face; the frame is lit edge to edge on both paths.
**Gates:** the four above · poster ≤ 60 kB · `uCopyGuard` −50 % contour inside text-rects+8 px, printed in the run log · palette: no hex outside `globals.css`/`lib/palette.ts`.

### S3 · `g2h1v3-03` — the name struck across the plane (25 min)
H1 to `clamp(3.25rem, 8vw, 7rem)`; nav mark to 1.25 rem / 1.125 rem; baseline anchored so the H1 crosses the dissolve band and never the face-safe box; the CTA group as one quiet bar, 48 px targets, nothing else pressable in the fold.
**Files:** `components/sections/Hero/Hero.module.css`, `components/site/Navigation.tsx` (mark size only), `app/globals.css` (nav token).
**Green:** TC-HERO-TYPE-01, TYPE-02, SET-05 (touch clause), A11Y-02.
**Visible:** the type lockup at all four widths.
**Gates:** the four · G-MV1 untouched (*Ask Mini Vic* labelled and visible at 390) · screenshots at 1440/1280/834/390 attached.

### S4 · `g2h1v3-04` — the same picture everywhere, gate unarmed (30 min)
Confirm nothing plays by default and the loop is not requested at load; capture parity between `?gl=force` and reduced motion at all four viewports; palette sweep; **remove `HERO_PLANE_GATE`** so PLANE-01/02 run unconditionally at the **0.78** ship margin; LCP/CLS on the export.
**Files:** `components/sections/Hero/HeroPortrait.tsx`, `tests/overhaul/hero-plane-dominance.spec.ts`, `tests/perf/hero-vitals.spec.ts`, `tests/monochrome/`, `docs/delivery/evidence/v10-20260905T0515Z/W2-H1/`.
**Green:** PERF-01, PERF-02, PERF-03, PAL-01, and PLANE-01 at ship 0.78 with the flag gone.
**Visible:** the reduced-motion fold is the same picture as the GL fold.
**Gates:** the four · full Playwright battery green · **no R5 claim added anywhere** · evidence log per viewport per path.

**Dependency order:** S1 → S2 → S3 → S4. S3 can start once S1 lands (it does not need the shader); S4 needs all three.

---

## 10. Constraints ledger — every immovable, and where it is answered

| constraint | answered in | how it is proved |
|---|---|---|
| LCP < 2.5 s | §4.1 (no texture upload; the `<picture>` is server-rendered at full opacity), §9 S4 | TC-HERO-PERF-01 |
| CLS < 0.05 | §3 (every box has fixed intrinsic ratio 1480/826; the aspect box survives) | TC-HERO-PERF-02 |
| nothing plays by default | §4.3 (`preload="none"`, `src` on intent — mechanism unchanged) | TC-HERO-PERF-03 |
| critical-path video ≤ 2.5 MB | §4.3 — loop **1.916 MB**, and off the critical path | TC-HERO-PERF-03 |
| palette B/W/gold, gold = sourced only | §4.1 (shader is achromatic by construction: `uInk`/`uLight`), §6.1 (the ledger — the only gold in `#hero` — is below the fold) | TC-HERO-PAL-01 |
| reduced-motion fully readable | §5 (poster + figure, zero canvases) | TC-HERO-GL-02, and every ⇄ case |
| no-GL fully readable | §5 (identical to reduced motion) | TC-HERO-GL-01/02 |
| keyboard-navigable | §7 | TC-HERO-A11Y-02 |
| contrast ≥ 4.5:1 over the plane | §4.2, §7 | TC-HERO-A11Y-01 |
| monochrome portrait as shipped in `56ffed3e` | §3 FIG-CAP (never upscaled), §4.3 (rungs) | TC-HERO-SET-03 |
| copy budget (≤ 1 headline, ≤ 1 sentence, 1 CTA group) | §6.1 | TC-HERO-SET-01 |
| ledger below the fold | §3 tables, §6.1 | TC-HERO-SET-02 |
| DPR cap not raised | §3 FIG-CAP is derived *from* the 1.75 cap; no slice changes it | — |
| R5 (4K@60) | §4.3 — **stays OPEN**, master is 24 fps; no claim made | S4 gate: "no R5 claim added" |

---

## 11. Risks

| # | assumption | mitigation |
|---|---|---|
| R1 | SPD clears 0.75 once the wash is gone and the figure is inside the plane. **Not measured** — this session ran no browser (read-only, loaded host). | S1 prints the real baseline before S2 moves a pixel; if S2 lands under 0.75, fall back to composition **B** (§1.4) rather than relaxing the threshold. |
| R2 | The declared-plane exemption (D-4) reads as gaming to the next reviewer. | TC-HERO-PLANE-03 fences it, `groundChain` is printed on every run, and §1.1 states the reasoning in the doc a reviewer reads first. |
| R3 | `uCopyGuard` is tuned to buy contrast at SPD's expense. | The −50 % contour bound (§4.2) is a gate, and A11Y-01 + PLANE-01 must be green **on the same build**. |
| R4 | The re-rendered poster drifts from the live shader. | S2 renders it *from* `atmosphere.glsl.ts` in a script, not by hand; the parity capture in S4 is the check. |
| R5 | The name crossing the figure fails contrast on a bright frame. | The crossing is confined to the dissolve band (α→0), the face-safe box is fenced by SET-05, and A11Y-01 measures P95, not mean. |
| R6 | Moving `role`/`location`/`caption` reads as deleted copy. | §6.1 states the destination for each; `hero.ts` is untouched; `.proof` already renders below `100svh`. |
| R7 | The figure's uv centre is authored per viewport and drifts from the CSS. | `uFigure` is written from the figure's **measured** `getBoundingClientRect()` at runtime, not from the §3 constants; the table is the design intent, the DOM is the source. |

---

## 12. Verification

```bash
test -f docs/architecture/HERO-SETPIECE-v3.md && \
  grep -c 'slice' docs/architecture/HERO-TASKS.json
```

Per slice, after the build (CLAUDE.md Workflow §3 — note :5599 and :8080 are held by other tenants; council batteries use :5601/:5602):

```bash
npx tsc --noEmit && npm run lint && npm run build:static
node scripts/validate/overhaul_static_audit.mjs                      # 10/10
python3 -m http.server 5601 --directory out &
HERO_PLANE_GATE=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:5601 \
  npx playwright test tests/overhaul/hero-plane-dominance.spec.ts \
                      tests/overhaul/hero-setpiece.spec.ts --workers=1
node scripts/validate/hero_plane_dominance.mjs --base http://127.0.0.1:5601 \
  --out docs/delivery/evidence/v10-20260905T0515Z/W2-H1/spd.json
```

---

*Read-only session: no application file was edited by this task. Assets were measured with `identify` (ImageMagick) and `ffprobe` on the host; every other number is arithmetic on a value read from a named file above.*
