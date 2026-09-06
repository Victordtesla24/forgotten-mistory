# G-H1 / G-X2 prior art — researcher (t_w2_h1r)

**Author:** researcher (docs/prompt.md §5) · **Session:** res-w2-h1r · **Fetched:** 2026-09-06T00:56Z–01:01Z (UTC)
**Feeds:** t_w2_h1sa (solutions-architect design brief) for G-H1 (hero set-piece) and G-X2 (seventh cinematic scene).
**Constraint honoured throughout:** no fabricated citation — every URL below was actually fetched this session via
the tool named in its row. Where a fetch returned thin/metadata-only content (SPA shells the fetch tool's small
model could not fully render), that is stated plainly rather than padded with invented detail.

---

## 0. Read first (S-1)

Read in full this session: `docs/prompt.md` §2.1/§0.3-1/-3/-6/R1/R2/§14 C-1/C-6; `docs/adversarial/ADV-REVIEW-20260905T2315Z.md`
(Hero/About/Experience rows + "Why Claude Code failed" #2, #9 — the file's top holds those, not a separate section);
`docs/adversarial/GAP-BACKLOG.md` (G-H1/G-X2/G-E2/G-S2/G-H2 rows); `docs/architecture/HERO-FOLD-v2.md` in full;
`docs/architecture/SIGNATURE-SCENES-v1.md` §0/§0.5 + `SIGNATURE-SCENES-NEXT.json`; `atmosphere.glsl.ts` (skimmed —
see §2 below for what it can already do); `app/data/portfolio/hero.ts` (the copy budget, quoted in §1).

**What this constrains the compositions to:**
- The fold today fails PLANE-1 (`SPD ≥ 0.75`, measured 0.114 dominant-media coverage) because a `.stage::after`
  scrim zeroes light across 0–56% of the frame and the colour portrait sits in a bordered card (`.portraitFrame`,
  four `.portraitTick` corners, `.portraitCross`) occupying 11.4% of the fold — a résumé stack, not a set piece.
- `atmosphere.glsl.ts` already has a `poolPlate` uniform "behind the portrait plate" — unbound today. HERO-FOLD-v2
  §2 M4 already directs binding the figure's measured centre to it. This research treats that as a given constraint,
  not something to re-derive.
- Copy budget is fixed (`hero.ts`): name "Vikram Deshpande", role line, location, one 29-word statement, three
  self-reported ledger figures, two actions ("See the evidence", "Download CV"). No composition below invents copy.
- Hard technical floor: LCP < 2.5s, video ≤ 2.5 MB on the critical path, nothing autoplays by default, DPR capped,
  `prefers-reduced-motion` must have a fully static path, `?gl=force` / no-GL must render the same picture (per
  HERO-FOLD-v2 M4: "re-render the poster from the same shader so the no-GL path is the same picture").

---

## 1. Prior art — references table

| URL | Tool used | Fetched at (UTC) | What it is | Why it matters here |
|---|---|---|---|---|
| https://bierman.io | `mcp__firecrawl__firecrawl_scrape` (screenshot + summary), image viewed | 2026-09-06T00:58Z | Matt Bierman (Sigma Computing frontend engineer) personal portfolio. Awwwards-tagged (see row below). Screenshot at desktop viewport shows a **monochrome ASCII-art self-portrait rendered as a canvas/WebGL texture filling essentially the whole viewport** (dot-pattern background, ASCII-shaded face occupying the full frame height), with the first name "matt" set in a huge black slab-serif overlapping the top-left of the portrait and the surname "bierman" set the same size overlapping the bottom-right — no card, no frame, no colour. Small meta text ("senior frontend engineer at sigma computing", "based in nyc") sits top-right, no larger than body copy. | **Direct working precedent for Composition B** (portrait plate IS the plane): a monochrome face fills 100% of the fold, the name is struck directly across it in two anchored fragments rather than boxed beside it, and the whole thing reads as ASCII/procedural texture rather than a photograph — i.e. it is GPU/canvas-rendered, not a raw `<img>`, which is the same rendering path this site's atmosphere GLSL already uses. |
| https://www.awwwards.com/inspiration/interactive-webgl-hero-matt-bierman-portfolio | `WebFetch` | 2026-09-06T00:59Z | Awwwards "inspiration" listing tagging bierman.io's hero specifically for its WebGL technique. | Fetch returned only tag metadata (`webgl`, `three.js`, `ascii`, `ascii 3d`, `logo`, `branding`) — no prose — but it corroborates the screenshot finding independently: the industry catalogues this exact hero as a **three.js/WebGL ASCII-art technique**, confirming it is a real, awarded, GPU-rendered composition and not a static image. |
| https://www.awwwards.com/websites/sites_of_the_day/ | `WebFetch` | 2026-09-06T00:58Z | Awwwards' live Sites-of-the-Day gallery (current listing at fetch time). | Discovery source. Model's read of the page named five current SOTD entries (Gionatan Nese, Trevor Noah, Paul Kalkbrenner, Michael Gatt, "NOTHIN'") as full-bleed-visual-plus-overlaid-name patterns; only the first (gionatannese.com) was independently verified below — the other four are **listing claims, not independently confirmed compositions**, and are not used as evidence for any specific technique claim in §3. |
| https://gionatannese.com | `mcp__firecrawl__firecrawl_scrape` (screenshot + summary), image viewed | 2026-09-06T00:59Z | Gionatan Nese (Italy) — multi-disciplinary designer/art director portfolio, Awwwards-listed. Screenshot shows an almost entirely **white, empty fold**: name small and left-aligned, a tiny centred monogram "GN .D", role label small and right-aligned, a page counter "070" bottom-centre. No dominant visual plane in the fold at all — the WebGL/3D work (per its meta description and keywords) lives deeper in the page, not in the first screen. | **Negative/contrast reference.** This is the opposite composition from what G-H1 needs: it proves a real, awarded portfolio can lead with near-zero visual weight in the fold and defer the spectacle to scroll. Useful to rule out — the brief for THIS hero explicitly wants the plane to dominate the *first* screen, so this pattern is noted and rejected, not adopted. |
| https://huyml.co | `mcp__firecrawl__firecrawl_scrape` (summary only — screenshot not downloaded/viewed for time) | 2026-09-06T00:58Z | Huy Phan — Ho Chi Minh City art director, self-titled "Award-winning designer", page footer/metadata claims "FWA of the Day" and "CSSDA Website of the Day" badges for past project pages (built on Framer). | Fetch returned only text summary of listed *client* projects (FROMANOTHER, IVENTIONS, WON J. YOU STUDIOS, EISLAB, RLY NETWORK, DISTRICT2 STUDIO) — no description of huyml.co's own hero composition was recoverable from this fetch, so **no composition claim is made about this URL**; it is retained only as a corroborating source that the FWA/CSSDA/Awwwards awards named in the task exist and are the correct venues to search. |
| https://thefwa.com/cases/rafal-bojar-one-story-hero | `WebFetch` | 2026-09-06T00:58Z | FWA case-study page for a project titled "One Story Hero" by designer Rafal Bojar. | Fetch returned only the page title — the fetch tool could not extract composition detail from this SPA. **No composition claim is made about this URL**; retained only as a discovery lead (the title itself — "One Story Hero" — is suggestive of a single-narrative hero pattern but this was not verified). |
| https://www.awwwards.com/sites/bencodes-developer-portfolio | `WebFetch` | 2026-09-06T00:58Z | Awwwards nominee page for a self-described "17-year-old fullstack developer" minimalist portfolio (bencodes.de), tagged with a component called "Hero Lines" (described by Awwwards as a video element). | Fetch returned only nomination metadata ("Minimalist", "Clean") — no composition detail recoverable. **No composition claim is made about this URL**; retained only to note that a named "Hero Lines" video-based hero component exists in the Awwwards catalogue as a discovery lead for future, deeper research. |
| https://bruno-simon.com | `mcp__firecrawl__firecrawl_scrape` (screenshot captured, not downloaded/viewed for time) | 2026-09-06T00:59Z | Bruno Simon's well-known interactive 3D portfolio (drivable go-kart through a WebGL scene) — Awwwards Site-of-the-Year precedent widely cited in the industry for a WebGL scene *being* the entire site, not just the hero. | Screenshot was captured by the tool but not downloaded/viewed in this session (time budget) — the metadata/summary fetched back was generic Firecrawl boilerplate, not a description of the page. **No new composition claim is made about this URL beyond the well-established public fact of what the site is** (a full-viewport three.js scene as the whole experience). It is listed because it is the canonical "the GL scene owns the entire frame, not a portion beside a card" precedent this council has referenced before, and it was fetched (not just recalled) in this session. |
| https://www.apple.com/apple-vision-pro/ | `WebFetch` | 2026-09-06T01:01Z | Apple's live Vision Pro product page. | Fetched hero fold: **one product photograph fills the frame** (a person wearing the device), headline text ("New powerful M5 chip and comfortable Dual Knit Band") is stacked and centred **over** the photograph, two CTAs ("Book a demo", "Buy") sit above the image, palette is neutral/monochrome-adjacent (grey/aluminium/glass), and per the fetch, without video/JS **a static image with the same overlaid headline and CTAs still renders** — i.e. the fallback is the same picture, not a degraded one. This is the Apple-grade reference the task asked for: **product photograph as the single plane, type stacked directly on it, no side column, no card.** |

**Search tooling used for discovery (not cited as evidence, only as how references were found):** SearXNG JSON API
at `http://127.0.0.1:8890/search?q=…&format=json` — five queries run (award-site full-bleed hero portrait monochrome;
FWA photographer portfolio hero; CSSDA full-screen video portrait; Apple Vision Pro hero; monochrome WebGL portrait
hero; developer-portfolio hero one-line name; godly.website; GLSL shader hero single line). Signal-to-noise was low
(the instance returned many irrelevant general-web results alongside the useful ones); every URL actually used above
was independently fetched and confirmed live, per the table.

---

## 2. What the existing atmosphere GLSL can already do (skim, per S-1)

From `components/sections/Hero/atmosphere.glsl.ts` (comments + uniform list, read this session):
- Single full-screen fragment shader, no geometry/textures — pure procedural mist + two volumetric shafts raked
  from the upper-left + fog density modulation (fbm/ridged noise), strictly achromatic (colour is a luminance ramp
  between two `:root` ink uniforms — cannot drift off-palette).
- Uniforms already present: `uTime`, `uResolution`, `uPointer` (parallax), `uIntensity` (entrance fade), `uScroll`,
  `uInk`, `uLight`, `uQuality` (1 = full strata, 0 = phone-cheap two-layer path — this is the reduced-cost mobile
  branch, distinct from `prefers-reduced-motion`, which needs its own static frame per Gotchas).
- Two "pools" already exist as constants, one of them commented **"behind the portrait plate"** — i.e. the shader
  was already authored with the intent of the figure sitting inside its light; it is only ever bound to a fixed
  screen position today, not to the figure's actual measured centre (this is exactly HERO-FOLD-v2 M4's finding —
  this research does not re-discover it, it uses it as a load-bearing existing asset for Composition A and C below).
- Composition-relevant limits observed: `uQuality` branch already halves cost on narrow viewports by dropping the
  near ridged layer and the second shaft — any composition below that asks the shader to do more (e.g. masking a
  photograph into it) has to cost this into the same phone branch, not add a third quality tier.

---

## 3. Three compositions for this hero (S-3)

### (A) The atmosphere GLSL becomes the plane; the monochrome portrait is composited inside it

The canvas already fills the section (`Scene`/`GLCanvas` mount full-bleed per `Hero.tsx`). Retire `.stage::after`'s
frame-wide 0.86 wash (HERO-FOLD-v2 M1) and mask the monochrome portrait into the shader's own draw call — either as
a luminance-driven alpha cutout sampled inside the fragment shader (so the pool light and the figure share one
render pass and one exposure curve) or, more cheaply, as a `<canvas>`-composited grayscale image layer whose alpha
is driven by the same `poolPlate` uniform math so it dims/lights in lockstep with the shafts. The 4K master
(3840×2160@24, per §9 of the asset ladder) supplies the monochrome still frame for both the static path and the
"plays on hover only" enhancement named in the task brief.

- **Recruiter sentence:** "His face is standing in a shaft of light that also lights his name."
- **LCP risk:** low-to-medium. The LCP candidate must stay the `h1` (per HERO-FOLD-v2 BM-5: transform-only entrance,
  never `opacity:0` first paint) — the portrait mask must not be the thing Chrome measures LCP against, so it needs
  its own non-blocking paint path (background-image/poster, not a chunked React import gating first paint).
- **Reduced-motion path:** the poster AVIF (already re-rendered from the same shader per HERO-FOLD-v2 M4) with the
  portrait pre-composited into it at build time — no separate reduced-motion asset to keep in sync.
- **No-GL path:** identical poster; because the mask math lives in the same uniform-driven system, "the no-GL path
  is the same picture" (quoting HERO-FOLD-v2 M4) is satisfied by construction, not by a second art pass.
- **Palette compliance:** trivial — the shader is already achromatic by construction (`uInk`/`uLight` only); a
  grayscale portrait mask cannot introduce hue.
- **Reusable assets/uniforms:** `poolPlate` uniform (bind to measured figure centre, per M4), `uIntensity` entrance
  fade, existing 4K monochrome master + poster AVIF, `Scene`/`GLCanvas`/`useGLCapability` mount chain unchanged.

### (B) The portrait plate itself is the plane; GLSL becomes volumetric light behind/around the figure

Direct precedent: **bierman.io** (fetched, §1) — a monochrome full-bleed figure *is* the frame, with the name struck
across it in two large anchored fragments rather than boxed beside it. Adapted here: the 4K monochrome portrait
(as a still, not ASCII) is the dominant background layer (`background-size: cover`, full 100vw×100svh), and the
atmosphere GLSL canvas sits as a second, blended layer casting the raking shafts and pool light across/around the
figure's silhouette (e.g. `mix-blend-mode: screen` or an alpha-masked overlay so the shafts read as light falling on
the person rather than a separate wallpaper strip). The name sets across the full measure per HERO-FOLD-v2 M2/BM-2,
overlapping the frame the way M3 already directs the media box to "overlap the mark's right end."

- **Recruiter sentence:** "One picture of the person, lit like a portrait, with his name struck across it."
- **LCP risk:** the portrait itself risks becoming the LCP candidate instead of the `h1` if it is a plain `<img>`;
  must be a CSS `background-image` on a non-LCP-eligible element, or paired with `h1` painting strictly first
  (BM-5 is a hard constraint either way).
- **Reduced-motion path:** trivial — the portrait is already a static image; only the GLSL light layer needs a
  frozen/poster substitute, and it is a *secondary* layer here (unlike Composition A), so the fallback is lower-risk.
- **No-GL path:** the portrait alone still reads as a strong, dominant plane even with zero shader light — this
  composition degrades more gracefully than (A) because the photograph does not depend on the shader to exist.
- **Palette compliance:** requires the monochrome master (already produced per the asset ladder, §9) — no new
  grading work; the GLSL light layer stays achromatic as built.
- **Reusable assets/uniforms:** 3840×2160@24 monochrome master as the base layer; `atmosphere.glsl.ts` unmodified
  except for exposing it as an overlay-mode canvas rather than the sole background; existing shaft/pool uniforms
  reused as-is for the "light falling on the figure" read.

### (C) Product-photograph-as-plane with stacked, centred type over it (Apple Vision Pro pattern)

Direct precedent: **apple.com/apple-vision-pro** (fetched, §1) — one photograph fills the frame, headline stacks
directly over it centred, two CTAs sit above/on the image, and the same picture is the fallback with no JS/video.
Adapted here (necessarily de-centred, since this hero's copy is a name + role + statement + ledger, not a single
product headline): the monochrome portrait fills the frame full-bleed exactly as in (B), but type is set as a single
centred or lower-third stack directly on the photograph with **no side grid at all** (removing even the M2
full-measure-on-the-left approach) — closer to a magazine-cover title lockup than a two-zone layout. The GLSL
atmosphere is demoted to a subtle top-of-frame vignette/rim-light rather than a full second layer, keeping the
photograph itself as unambiguously the single dominant plane.

- **Recruiter sentence:** "It reads like a magazine cover — his photo, his name, one line, done."
- **LCP risk:** lowest of the three — a single hero photograph with text overlay is the most standard, best-optimised
  LCP pattern on the web (this is exactly why Apple ships it); `h1` can still be forced first via `content-visibility`
  ordering or by keeping the photograph as a non-competing `background-image`.
- **Reduced-motion path:** identical to normal path — nothing animates by default in this composition; the GLSL rim
  light is the only motion and it is already gated behind `prefers-reduced-motion` site-wide.
- **No-GL path:** the photograph alone carries the whole composition; losing the GLSL rim light costs the least of
  any of the three options here, because the shader was never load-bearing for dominance in this version.
- **Palette compliance:** monochrome portrait + achromatic rim light, same as (B).
- **Reusable assets/uniforms:** 4K monochrome master; a reduced subset of the existing shaft/pool uniforms (or none,
  if the rim light is simplified to a single soft gradient); no new GLSL authoring required at all — this is the
  cheapest option engineering-wise.

### Ranking and why

1. **(A)** — ranked first. It is the only option that makes the *existing, purpose-built but unbound* `poolPlate`
   uniform (found in `atmosphere.glsl.ts`'s own comments, and already the subject of HERO-FOLD-v2 M4) do the job it
   was written for, satisfies the brief's literal ask ("the atmosphere GLSL becomes the plane with the monochrome
   portrait composited inside it... the 4K master plays on hover only"), and gives PLANE-1's dominance measure (§3
   of HERO-FOLD-v2) the most headroom: the whole frame is procedurally lit, not just a photographed rectangle, so
   `Σ_P m` (light mass outside the ink set) can be tuned independently of how large the portrait crop is.
2. **(B)** — ranked second. Directly precedented (bierman.io), degrades best on no-GL/reduced-motion because the
   photograph alone still dominates, but risks the LCP-candidate collision noted above and requires the most careful
   blend-mode tuning to make the shader read as light-on-a-person rather than two independent layers.
3. **(C)** — ranked third *for this brief specifically*, not on merit — it is the safest, cheapest, most proven
   pattern (Apple ships it) but it under-uses the site's one genuinely bespoke asset (the atmosphere shader) by
   demoting it to a rim-light detail, which works against G-X2/R2's separate ask for GL to read as more than
   wallpaper. Keep it as the fallback direction if (A) or (B) fail their SPD measurement in practice.

---

## 4. G-X2 — seventh cinematic scene (S-4)

Read this session: `SIGNATURE-SCENES-NEXT.json` (`t_x1_10`, `t_x1_11` HyperFrames render/player pair) and
`SIGNATURE-SCENES-v1.md` §0/§0.5 (the six-scene live census: `hero-atmosphere`, `about-field`, `career-strata`,
`skills-bench`, `vitrine-field`, `listen-field` — all `resolutionScale 0.5`, none rAF-budget-tested, none at
2160p60). No new prior-art URLs were fetched specifically for "delivery-leadership as strata/telemetry/orbits" scene
techniques within this session's time budget (25-minute cap, §S-2/S-3 already consumed the majority of it); the
verdict below is therefore derived from the two documents named plus the existing `atmosphere.glsl.ts`/
`SIGNATURE-SCENES-v1.md` technique inventory already in the repo, not from fresh external references. **This gap is
disclosed rather than papered over with invented citations** — a follow-up research pass with a dedicated time
budget should fetch concrete Three.js/GLSL "orbits/strata/telemetry" showcases (e.g. Three.js examples gallery,
Codrops GLSL demos) before the solutions-architect commits to a specific technique.

### Candidates (derived from repo evidence, not fetched externally this session)

1. **Extend `career-strata` into the seventh scene's visual language** (instancing + SDF strata bands already
   partially proven by `career-strata`'s existing mount) rather than authoring a wholly new technique — cheapest
   path to 60fps-on-2021-phone because it reuses a scene already carrying `resolutionScale 0.5` and the `Scene`
   capability-detection mount.
2. **HyperFrames-authored overture per `t_x1_10`/`t_x1_11`**: a pre-rendered 3840×2160@60 composed clip (CSS/WAAPI
   animation layer, explicitly **not** GSAP — absent from the tree per F2) played through `@hyperframes/player`
   (measured 17.6 kB gzipped per the spec) crossfading into the live shader on `Scene.onCreated`. This is a
   render-once, play-back-only pattern — it buys the true 4K/60fps clause (R5) that no live WebGL scene on this
   stack has yet achieved (F8/F11: no scene is rAF-budget-tested or R5-audited today), at the cost of the scene
   being a video rather than truly interactive.
3. **A pointer/scroll-reactive orbit field** (programmes as orbiting points, telemetry as pulsing light) built the
   same way `atmosphere.glsl.ts` is built — single fragment shader, `uQuality` branch for phone — deferring
   instancing entirely; consistent with this codebase's existing zero-dependency GLSL pattern rather than
   introducing R3F instancing for the first time in a seventh scene.

### HyperFrames verdict

**Adds something real, but only the render pipeline — not the in-browser interactivity.** Per `SIGNATURE-SCENES-NEXT.json`
(`t_x1_10`), HyperFrames' value here is narrowly that it lets a **zero-credit, offline render** (no Higgsfield call,
confirmed 0 credits / free plan per F10) produce a genuine 3840×2160@60 master file — something no live R3F/GLSL
scene on this stack has achieved yet (F8: DPR capped at `[1, 1.75]`, no scene R5-audited). `@hyperframes/player` is
then a very small (17.6 kB gzip) web component to *play back* that pre-rendered composition in-page, crossfading
into the live shader. **What it does not add:** the seventh scene's *cinematic* content — the strata/telemetry/orbit
visual language — still has to be authored as a composition (CSS/WAAPI keyframes matching the existing poster,
per `t_x1_10`'s "continue hero-atmosphere-poster.avif rather than contradict it" gate); HyperFrames does not
generate that language, it only renders and plays it. A plain R3F/GLSL scene, by contrast, is truly interactive
(responds to pointer/scroll every frame, as the existing six scenes do) but, given zero credits and no completed
R5 audit on any live scene, **cannot currently prove it hits 4K/60fps** the way a pre-rendered HyperFrames clip can
prove it via `ffprobe`. **Given zero credits, HyperFrames is the only path in this stack that can currently produce
a verifiably 4K/60fps signature scene; a live GLSL scene remains the only path that is genuinely interactive.**
The honest recommendation inherited from `SIGNATURE-SCENES-v1.md`'s own ruling: do not claim R2's "signature scene"
language for a scene that is only a data-scene mount (§0.6's minivic-viseme rejection) — whichever technique is
chosen, it must clear the `flagship-visibility` SPD-style measurement, not merely exist in the DOM.

---

## 5. Tools actually used this session (R12)

- `Bash` (repo file reads via `cat`/`sed`/`grep`) — S-1 reading.
- `curl` against the host SearXNG JSON API (`http://127.0.0.1:8890/search?q=…&format=json`) — 8 discovery queries,
  all responded 200; signal was mixed (see §1 note).
- `WebFetch` — 6 calls: awwwards.com Sites-of-the-Day listing, thefwa.com/cases/rafal-bojar-one-story-hero,
  huyml.co, awwwards.com/sites/bencodes-developer-portfolio, awwwards.com/inspiration/interactive-webgl-hero-matt-bierman-portfolio,
  apple.com/apple-vision-pro. No failures; several returned thin/metadata-only content because the underlying pages
  are JS-rendered SPAs the small extraction model could not fully resolve — recorded honestly per-row in §1 rather
  than backfilled with invented detail.
- `mcp__firecrawl__firecrawl_scrape` — 4 calls (bierman.io, huyml.co, gionatannese.com, bruno-simon.com), each
  requesting `screenshot` + `summary` formats. No failures.
- `Read` (image viewer) — used to actually view 2 of the 4 firecrawl screenshots (bierman.io, gionatannese.com) by
  downloading them locally first with `curl`; the other two (huyml.co had no screenshot requested in a usable form,
  bruno-simon.com's screenshot was captured by Firecrawl but not downloaded/viewed, disclosed in §1) were not
  visually inspected — time budget (25-minute hard cap) was allocated to the two most load-bearing references.
- No `perplexity_*` tools were invoked this session (SearXNG + WebFetch + firecrawl covered the need within budget).
