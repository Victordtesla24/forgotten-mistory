# UI / UX / VFX Audit — forgotten-mistory portfolio

**Target:** `http://localhost:8080/` (Next.js dev server, `overhaul/marvel-grade-portfolio` branch)
**Date:** 2026-06-16
**Auditor:** Claude (Opus 4.8) — live runtime inspection (Chrome DevTools MCP) + code/doc cross-reference + a 40-agent adversarial verification workflow.
**Scope:** Every interactive visualisation, animation, VFX/after-effect, and "implemented/verified" claim on the single-page site, judged against the project's own SPEC, MOTION-AND-FX-SPEC, the QA register, and the owner's **Marvel-Studios / Fortune-500** quality bar.

> Each finding below was **observed first-hand in the running browser** and/or **confirmed in source** with `file:line` citations, then **independently re-verified** by a separate agent that re-opened the cited files. 34 of 35 candidate findings survived verification; 1 was rejected (see Appendix C). Confidence on every retained finding is **high** unless noted.

---

## How the evidence was gathered

1. **Live browser** (DevTools MCP): navigated the page, took an a11y DOM snapshot, captured console + network, and **physically interacted** with every interactive surface — About Me / Skills / Experience accordions, the hero capability modal, the Architecture Map path switches, the Current-Projects HUD, the Mini Vic clone, scroll-driven parallax, the proof counters — at desktop (2274×1216) and mobile (390×844).
2. **Runtime probes** (`evaluate_script`): measured computed styles, element geometry, React handler presence, WebGL canvas inventory, rAF frame-rate, and before/after state on every interaction.
3. **Code + docs**: read the implicated components, `app/globals.css`, the SPEC / MOTION-AND-FX-SPEC, `docs/overhaul/quality-assurance.md`, `docs/execution-log.md`, the Playwright specs, and the static-audit script.
4. **Adversarial verification**: a five-dimension workflow (interactive-viz · VFX · false-claims · marvel-gap · other) generated candidate findings, each re-checked by an independent skeptic agent that re-opened the files and reconciled against the runtime evidence.

**Severity key:** **P0** broken/lost content · **P1** major UX failure or false "verified" claim on a primary surface · **P2** visible quality gap / partial implementation / missing safeguard · **P3** hygiene / polish / doc drift.

---

## Executive summary

The page is visually coherent, monochrome, fast to boot (counter settles to 100, reveal < 2.5 s), and **most chrome works** (Experience accordion, Architecture-Map path switching, proof counters, Mini Vic clone for its built-in prompts, mobile layout — see Appendix B). **But three classes of problem dominate:**

- **A whole interaction is dead.** The **About Me** accordion (4 cards) **and** the **Skills & Certifications** accordion never open — content is permanently clipped to `height:0`. Both were marked **VERIFIED ✅** in the QA register because the bound tests assert text-in-DOM, not visibility. This is the single most serious defect (loss of CV content on the "memorable-takeaway" sections) and the clearest example of a **QA pass that hides a broken feature**.
- **Expensive VFX that nobody can see.** The genuinely cinematic 600-particle "materialise" animation on the hero capability modal is rendered **behind the modal's own 82 %-opaque black backdrop** — full GPU cost, zero visible payoff. The deep-space starfield, hero radar, and morphing blob are all dimmed to **0.42 / 0.22 / 0.048 opacity** respectively — heavy WebGL/post-processing spend on near-invisible decoration, with **no scroll-coupled depth parallax** and **no reduced-motion fallback** on the starfield.
- **"Marvel-grade" claims the build does not meet.** The Current-Projects **"JARVIS" HUD is a flat 2-D radial disc** with **zero interactivity** (`aria-hidden`, no handlers), yet `FR-SIGFX` ("≥3 interactive per-project effects") is marked **VERIFIED**. Mandated craft — **DepthOfField**, a **volumetric/god-ray** pass, a progress-bound **preloader sweep**, the **D-ID↔ElevenLabs live lip-sync** — is specced and in some cases logged "PASS" but is **absent, faked (mock), or flat**.

**Counts:** 34 confirmed findings — **1× P0, 8× P1, 20× P2, 5× P3.** By bucket: Interactive-viz 7 · VFX/AE 9 · Below-threshold/false-pass 13 · Other 5 (some findings span buckets and are cross-referenced).

### Top priorities (fix order)

| # | Finding | Sev | Where |
|---|---------|-----|-------|
| 1 | About Me **and** Skills accordions never expand (`height:0`) — one shared broken component | **P0** | `ExpandableCard.tsx`, `globals.css:847/1650` |
| 2 | Those broken accordions are marked **VERIFIED ✅** on text-only tests | **P1** | `quality-assurance.md:198/205`, `sections.spec.ts` |
| 3 | Hero capability-modal 3-D FX fully occluded by the modal's own backdrop | **P1** | `FloatingDetailBox.tsx:603` |
| 4 | `FR-SIGFX` "≥3 interactive per-project effects" marked VERIFIED, but `#work` ships **one decorative `aria-hidden` HUD** | **P1** | `quality-assurance.md:201`, `signature.spec.ts:34` |
| 5 | Locked capability modal is **not an accessible dialog** (no `role=dialog`, no focus trap) | **P1** | `FloatingDetailBox.tsx:601` |
| 6 | JARVIS radar is a flat disc; DoF / volumetric / sprite-stars / parallax all missing | **P1–P2** | `shaders/hud.ts`, `TelemetryHud.tsx`, `SpaceScene.tsx` |

---

## 1 · Interactive visualisations & animations — defects

### IV-1 — About Me accordion never expands (content clipped to `height:0`) — **P0**
*Workflow #1. Section: About Me. Component: `ExpandableCard` (snap-card) + `globals.css .snap-body`.*

- **Symptom (observed live):** Clicking any of the 4 cards (Career Objective, Delivery Impact, Leadership & Governance, Recent Builds) rotates the `+` to `×` and sets `aria-expanded=true` **and `opacity:1`**, but **no content appears** — the bullet list stays clipped to **0 px**. Verified at runtime: `aria-expanded=true`, body `getBoundingClientRect().height === 0`, inner `<ul>` is 307–485 px.
- **Root cause:** `ExpandableCard` ([components/site/ExpandableCard.tsx:31-49](components/site/ExpandableCard.tsx#L31-L49)) only toggles the `.open` class — it writes **no pixel height**. The collapsed rule `.snap-body { height:0; overflow:hidden; transition:height… }` ([app/globals.css:830-836](app/globals.css#L830-L836)) is never overridden: the open rule `.snap-card.open .snap-body` ([app/globals.css:847-849](app/globals.css#L847-L849)) sets **only `opacity:1`**. `height` (not `max-height`) stays `0`, so the body can never transition open.
- **Claim vs reality:** ExpandableCard's own doc-comment says *"max-height transitions live in globals.css."* There is **no `max-height` rule** and no open-state height anywhere. The contract is unsatisfiable.
- **Contrast (proves the fix):** the **Experience** accordion works — it uses Framer-Motion `height:0→'auto'` ([ExperienceAccordion.tsx:48-56](components/site/ExperienceAccordion.tsx#L48-L56)); runtime height 753 == scrollHeight.
- **Fix:** migrate `ExpandableCard` to the same Framer-Motion `height:auto` pattern (repairs About **and** Skills at once), **or** measure `scrollHeight` in JS on toggle, **or** the minimal CSS fix `grid-template-rows: 0fr→1fr` on the open state. Then delete the misleading comment.

### IV-2 — Skills & Certifications accordion has the **identical** dead-expand bug — **P1**
*Workflow #2/#3. Section: Skills & Certifications.*

- **Symptom:** every Skills card flips its chevron to `×` and sets `aria-expanded=true`, but the skill list never reveals — body stays 0 px.
- **Root cause:** **same `ExpandableCard` component** (only `bodyClass` differs). `.skill-body { height:0; overflow:hidden }` ([app/globals.css:1642-1648](app/globals.css#L1642-L1648)); open rule `.skill-card.open .skill-body` ([app/globals.css:1650-1653](app/globals.css#L1650-L1653)) sets only `opacity` + `padding`, never height. `ExpandableCard` is the **single shared root** — instantiated 5× across two sections ([app/page.tsx](app/page.tsx) snap ×4, skill ×1-map); any future card built on it will silently fail too.
- **Fix:** fixing `ExpandableCard` once repairs both sections. Add a Playwright assertion that an opened body's bounding-rect height > 0 (see QT-1).

### IV-3 — Hero capability modal ("floating panel"): 3-D animation renders but is **invisible** — **P1**
*Workflow #4/#8/#20/#27 (merged). Section: Hero → `FloatingDetailBox`.*

- **Symptom (observed live):** clicking a hero capability card (Test Automation at Scale, Cloud Modernisation, …) **does** open the detail modal with content, and **does** inject an elaborate 3-D burst into the shared scene (≈600 stardust particles imploding → beam → orbiting trailed star → halo → expanding shockwave → 140 sparks; scene child count jumps 6→10). **The user sees none of it.**
- **Root cause:** the FX meshes are added to `window.spaceApp.scene`, which lives in `.space-scene-layer` at **`opacity:0.42`, `mix-blend:screen`, z-low** ([globals.css:99-105/3286](app/globals.css#L3286)), and is dimmed *further* to 0.35 while a detail is open (`body.detail-open .scene-stack`, [globals.css:131-134](app/globals.css#L131-L134)). The modal then paints `absolute inset-0 bg-black/82 backdrop-blur-[6px]` at **`z-[10002]`** ([FloatingDetailBox.tsx:601-603](components/FloatingDetailBox.tsx#L601-L603)) directly over it. An 82 %-opaque blurred black sheet erases the FX.
- **Also:** the left sidebar's decorative `text-9xl` "92" is clipped by `overflow-hidden`, and the heading crowds the stat (observed). The cinematic moment — the most genuinely Marvel-grade animation in the codebase — has **zero visible payoff** for full GPU cost.
- **Fix:** render the burst in a **dedicated foreground canvas above the backdrop** (its own `z>10002`, `alpha:true`, `pointer-events:none`) so the beam/particles visibly carry the card into place — *or* drop the backdrop to a light scrim (`bg-black/30`, no full blur) and keep the scene visible through it — *or* delete the ~250 lines of per-frame 3-D work. Add a pixel-diff test that the FX is actually visible on open.
- *(Note: the modal closes cleanly via Escape **and** backdrop, and disposes its 3-D objects on close — scene 10→2, no leak. Those parts work.)*

### IV-4 — Architecture Map: promised animated "packet dots" are never rendered (orphaned CSS) — **P2**
*Workflow #5. Section: Interactive Architecture Map.*

- **Symptom:** the path-switch buttons work (paths highlight; the active line gets a marching stroke-dash). But the **packet dots** the component advertises travelling along the paths **never appear** — the data-flow reads as a dashed-line shimmer only.
- **Root cause:** the SVG renders **only `<path>`** elements ([ArchitectureMap.tsx:115-123](components/site/ArchitectureMap.tsx#L115-L123)); no `<circle class="flow-dot">` / motion element is ever created. The `.flow-dot` / `.flow-dot.active` rules ([globals.css:2452-2461](app/globals.css#L2452-L2461)) and the "restart packet animation" effect target **DOM nodes that don't exist** — dead rules.
- **Fix:** render the dots (SVG `<circle class="flow-dot active">` animated via `<animateMotion>` or rAF along `getPointAtLength`), or update the doc-comment to the stroke-dash-only reality and delete the orphaned CSS. *(The core path-switching is interactive and works — see Appendix B.)*

### IV-5 — Mini Vic clone leaks prompt scaffolding on free-text queries — **P2**
*First-hand runtime finding (not in workflow). Section: Dossier → "Ask my digital twin".*

- **Symptom (observed live):** the clone **opens and answers its built-in suggestion chips well** (e.g. *"Fit me to a role"* → *"I bring a rare combination of enterprise delivery leadership—having managed a $5M+ AI/ML…"*). But the free-text query **"What is your AI stack?"** returned, after a 5172 ms "Accessing neural memory…" state, the answer **"2-5 sentences? Yes (3 sentences). * No bullet lists"** — i.e. **internal formatting-rubric scaffolding leaked into the visible answer** instead of a substantive response.
- **Likely cause:** the offline/fallback brain (or a degraded provider path in dev) emitting its instruction template for an unmatched query. Worth tracing in `lib/miniVicBrain.ts` / `MiniVicBot.tsx`.
- **Fix:** ensure the fallback ladder never surfaces meta-instructions; return a graceful "here's the stack: …" canned answer for stack/tech queries, and add a test that no response contains rubric tokens ("2-5 sentences", "No bullet lists").

### IV-6 — Deep-space starfield: **no scroll-coupled depth parallax** — **P2**
*Workflow #9/#26 (merged). Section: global background (`SpaceScene`).*

- **Symptom (observed live):** a 4,500-star field that should read as deep, parallaxing space instead reads as a faint, near-static backdrop. The `.space-scene-layer` CSS transform stays `none` across all scroll positions; near and far stars move identically.
- **Root cause:** scroll is wired to **exactly one transform** — `groupRef.rotation.x` eased toward `min(0.22, scrollY*0.00012)` applied to the **whole** star group ([SpaceScene.tsx:403-404](app/components/SpaceScene.tsx#L403-L404)) — no depth-differential parallax, no camera dolly. The only depth-aware motion is **mouse** parallax (`mouseVec*0.12`). Visibility is then crushed by `opacity:0.42` + `mix-blend:screen` + `dpr:1`.
- **Fix:** split stars into 2–3 depth bands translated by a scroll-proportional factor (far slow, near fast) **or** dolly camera-Z on scroll; lift the layer opacity (or drop `mix-blend:screen`, which is self-defeating on a near-black page). If a faint backdrop is the deliberate choice, cut the 4,500-star + 3-nebula + shooting-star + post-FX cost to match its near-invisible role.

### IV-7 — Starfield has **no reduced-motion fallback** — animations keep running — **P2**
*Workflow #12. Section: global background. **Violates a mandatory requirement.***

- **Symptom:** with `prefers-reduced-motion: reduce`, the starfield still drifts, twinkles, tilts on scroll, runs the camera-rig elliptical drift, and spawns shooting stars. Only the Bloom/Noise/Vignette post-pass is disabled.
- **Root cause:** the reduced-motion branch feeds **only** `setEnablePostFx(false)` ([SpaceScene.tsx:424-434](app/components/SpaceScene.tsx#L424-L434)); none of the five `useFrame` loops check a frozen flag, and the `<Canvas>` has no `frameloop` prop (defaults `always`). CLAUDE.md/SPEC mandate a **static** reduced-motion fallback for every flagship effect. (`TelemetryHud` does this correctly: `frozen` → `frameloop='demand'`.)
- **Fix:** thread a `frozen` flag into `SceneContent` and early-return inside each `useFrame` (or set `frameloop='demand'`) under reduced-motion, rendering one static frame.

---

## 2 · High-end VFX / animations / after-effects — defects

### VFX-1 — Hero radar backdrop: full-viewport WebGL + Bloom at **0.22 opacity** — **P2**
*Workflow #10. Section: Hero. Component: `HudFrame variant="backdrop"` → `TelemetryHud`.*

- **Symptom (observed live):** the hero radar is a **2274×1868** `<Canvas>` running a Bloom+Vignette EffectComposer **every frame**, then dimmed to **22 %** and largely hidden behind the headline.
- **Root cause:** `HudFrame variant="backdrop"` still passes `scene={true}` (default) ([page.tsx:214](app/page.tsx#L214)), mounting the full `TelemetryHud` canvas; CSS only dims the output (`.hud-frame--backdrop { opacity:0.22 }`), it does not reduce render resolution or disable post-FX. A full-screen mipmap-blur bloom whose visible contribution is ~22 % and mostly occluded.
- **Fix:** pass `scene={false}` for the backdrop (HudFrame already supports a bezel-only echo — and `Dossier.tsx:36` already uses it), or drop the EffectComposer / cap dpr for this instance.

### VFX-2 — **Three simultaneous live WebGL contexts**, each with its own post-processing — **P2**
*Workflow #11/#28/#32 (merged). Whole page.*

- **Symptom (observed live, 3 canvases):** `SpaceScene` (Bloom+Noise+Vignette) + hero radar backdrop `TelemetryHud` (Bloom+Vignette) + work-section `TelemetryHud` (Bloom+Vignette) all boot at once, each its own render loop + composer. rAF measured ~57 fps on a desktop GPU; browsers cap ~8–16 contexts and mobile GPUs evict earlier.
- **Root cause:** each component self-mounts its own `<Canvas>` ([page.tsx:160/214/513](app/page.tsx#L160)). `HudFrame`'s **own docstring warns** "a third live R3F scene would be wasteful … `scene={false}` … keeps the GPU/perf budget intact" — yet the hero backdrop mounts exactly that third scene.
- **No guard:** `perf.spec.ts` sums only `transferSize` + CLS; `signature.spec.ts` only asserts canvas count ≥2 and zero WebGL console errors. The FPS probe (`phase04`) is **not** a CI gate.
- **Fix:** collapse to ≤2 contexts (hero backdrop → `scene={false}`); gate the work-HUD canvas behind an `IntersectionObserver` (it sits at offset 8706, far below the fold) so its composer only runs on-screen (SPEC §7 "pause off-screen"). Add a context-count / sustained-FPS test on a throttled mobile profile.

### VFX-3 — Morphing SVG blob background is **invisible** (`opacity:0.048`) and Chromium-only — **P3**
*Workflow #14. Section: hero scene-stack background.*

- **Symptom:** a 3-layer blurred morphing-blob field is mounted behind the hero but is **under 5 % opacity** — imperceptible. The morph (animating SVG `d:`) is a **Chromium-only** feature; in Firefox/Safari it never morphs, and all three `<path>`s start from the **same** `d` ([page.tsx:185/190/195](app/page.tsx#L185)) so they're three identical stacked shapes there.
- **Root cause:** `.morphing-bg { opacity:0.048 }` ([globals.css:453](app/globals.css#L453)); `@keyframes morph { d: path(…) }` ([globals.css:1949-1956](app/globals.css#L1949-L1956)).
- **Fix:** commit (raise opacity + switch to a transform/SMIL/JS morph that works cross-browser) or remove the subtree — at 4.8 % opacity behind an already-busy scene-stack it adds DOM, a blur filter, and a Chromium-only animation for ~zero value.

### VFX-4 — Hero name "glitch-text" is **dead code** — **P2**
*Workflow #7. Section: Hero.*

- **Symptom (observed live):** the hero name carries `class="… glitch-text"` and a `data-text={name}` attribute that imply a cinematic RGB-split glitch reveal, but **at rest there is no glitch at all** — the only motion is a gradient `textShine` sweep. A 6-keyframe ±2 px jitter fires **only on `:hover`** and jitters the whole gradient title (not a layered split).
- **Root cause:** `.glitch-text` has **zero CSS rules**; `data-text` is consumed by **no `::before/::after`** pseudo-element ([page.tsx:224](app/page.tsx#L224); [globals.css:2043-2065](app/globals.css#L2043-L2065)). The duplicated-layer glitch technique was never wired.
- **Fix:** implement the real glitch (`.glitch-text::before/::after { content: attr(data-text); … }` clip-path RGB-split on entrance) **or**, if a glitch conflicts with the restrained monochrome tone (NN-3), remove the misleading class + unused attribute so markup matches reality.

### VFX-5 — Dossier "signature HUD motif" is reduced to 4 near-invisible corner ticks — **P3**
*Workflow #6. Section: Dossier (the key leave-behind card).*

- **Symptom:** the recurring HUD motif that should anchor the closing dossier card is **just four faint corner-tick spans** — no radar canvas, no label.
- **Root cause:** `Dossier.tsx:36` passes **both** `scene={false}` (skips the canvas) **and** `variant="backdrop"` (only `panel` renders the label) with an empty label — every meaningful element is gated off. This undercuts the **NN-2** "memorable signature visual" goal on the most important section.
- **Fix:** use `variant="panel"` with a real label, or render a **static CSS/SVG radar-ring fallback** so the motif is actually visible without a 4th WebGL context.

### VFX-6 — Stale comment: `CameraRig` references a `FloatingDetailBox` integration that isn't in the scene — **P3**
*Workflow #13. Section: `SpaceScene`.*

- **Symptom:** the `CameraRig` docstring claims its drift is bounded "without ever moving far enough to disturb the FloatingDetailBox screen-space unprojection," implying `FloatingDetailBox` is part of `SceneContent`. It isn't — `SceneContent` ([SpaceScene.tsx:408-418](app/components/SpaceScene.tsx#L408-L418)) renders only StarField/Nebula×3/ShootingStar×2; `FloatingDetailBox` is a separate DOM component that reaches into the shared `window.spaceApp`.
- **Real consequence:** the rig **keeps moving** the camera after `FloatingDetailBox` snapshots its `unproject` — so even if the FX were visible (it isn't, IV-3), the injected meshes can drift relative to their DOM trigger. Fix the comment and the occlusion together.

> VFX issues that are *also* "below-threshold / Marvel-gap" items — the flat radar, missing DepthOfField, fake volumetric light, sprite-less stars — are catalogued in §3 to keep the quality-bar argument in one place.

---

## 3 · Passed QA / claimed "implemented" — but **below the quality threshold**

This bucket answers the brief directly: features marked **OK / VERIFIED / PASS** that are broken, faked, non-interactive, or simply not Marvel-grade.

### QT-1 — About & Skills accordions marked **`TC-FR-ABOUT` / `TC-FR-SKILLS` VERIFIED ✅** while visually broken — **P1**
*Workflow #15/#16. The headline false-pass.*

- **Claim:** `quality-assurance.md:198` marks `TC-FR-ABOUT` **VERIFIED ✅** ("sections.spec — #about title + bio"); `:205` marks `TC-FR-SKILLS` **VERIFIED ✅**.
- **Reality:** the bound tests ([tests/overhaul/sections.spec.ts:32-37 / 47-51](tests/overhaul/sections.spec.ts#L32-L51)) assert only `toHaveCount(1)` + `toContainText(…)`. **`toContainText` matches text anywhere in the DOM tree regardless of `height:0; overflow:hidden`** — so the test is green while the content is invisible and keyboard-unreachable (IV-1/IV-2). The accordion was never opened in a test, and body height was never asserted.
- **Fix:** add a real assertion — open a card, then `expect(body).toBeVisible()` / `boundingBox().height > 0` — then fix the CSS. **This weak-assertion pattern is the process gap that let the P0 ship; audit all `toContainText`-only "VERIFIED" rows.**

### QT-2 — `FR-SIGFX` "≥3 **interactive** per-project effects" marked **VERIFIED** — but `#work` ships one decorative `aria-hidden` HUD — **P1**
*Workflow #17. Section: Current Projects. The exact "false claim of interactivity" the brief flags.*

- **Symptom (observed live):** the "JARVIS · REAL-TIME TELEMETRY" HUD has **zero** pointer/click/keyboard handlers (confirmed on the frame, canvas, scene wrapper, and parent), is `aria-hidden="true"`, `cursor:none`. The project cards below it are static links. There is **no per-project interactive effect**.
- **Claim:** `SPEC.md:343` `FR-SIGFX` = "≥3 interactive signature project effects in MVP … each tied to a real project, each with reduced-motion fallback … id=work." `quality-assurance.md:201` marks `TC-FR-SIGFX` **VERIFIED ✅** ("HUD ×2 sections, zero WebGL errors").
- **Reality:** the bound test ([signature.spec.ts:34-37](tests/overhaul/signature.spec.ts#L34)) only asserts `.hud-frame` count ≥2 and `canvas` count ≥2 — it never checks "≥3", "interactive", or "tied to a project." A **count-only check is presented as fulfilment of an interactivity requirement.**
- **Fix:** downgrade `TC-FR-SIGFX` to **PARTIAL** and scope the per-project effects as open work, **or** implement the §7 effects with real interaction + reduced-motion fallbacks and a test asserting ≥3 distinct, project-bound, interactive mounts.

### QT-3 — JARVIS radar HUD is a flat 2-D disc — no depth, parallax, ticks, labels, or particulate — **P1**
*Workflow #21. The "absolute crap / not Marvel-grade" item, grounded.*

- **Symptom (observed live):** the signature work-HUD reads as a **metallic-grey vinyl/sonar disc** with a single sweep wedge — the recurring brand motif (NN-2), but it looks like a one-pass radial gradient, not a holographic instrument.
- **Root cause:** the entire radar is **one flat z=0 plane** driven by `holoRingFragment` ([shaders/hud.ts:18-47](components/fx/shaders/hud.ts#L18-L47)): rings = `smoothstep(fract(r*8))`, one rotating wedge, a rim, one inner ring — all composited into a **single alpha** (`hud.ts:41`). The `Hud` group has **4 meshes total** (1 light plane, 1 ring, 2 bare gauge arcs); **no z-layering, no text, no ticks, no sparkline.** Yet the docstring claims "live-easing gauge readouts **and a scrolling sparkline**," and MOTION-AND-FX-SPEC §4 mandates "concentric holo-rings; radial gauges; **streaming sparklines; tick marks**" — none exist.
- **Fix (all monochrome, from PALETTE):** (1) split into 3+ Z-separated layers (far grid · mid ring · near bezel) so DoF/parallax bite; (2) replace the `fract(r*8)` band with discrete **graduated tick marks** (major compass ticks + fine minor ticks); (3) add 2–3 honest readout labels (e.g. `P95 184ms`, `10k DEVICES — SIMULATED`) anchored to the arcs; (4) add the **scrolling sparkline** the spec/docstring promise; (5) give the sweep a trailing afterglow + blip dots that flare as it passes.

### QT-4 — Radar sweep rotates **~19–24× faster** than the spec's "calm authority" budget — **P2**
*Workflow #22.*

- **Claim vs reality:** MOTION-AND-FX-SPEC §4 budgets "rings rotate slowly (**≤0.05 rad/s**)"; the sweep runs at **`uTime * 1.2` rad/s** ([shaders/hud.ts:34](components/fx/shaders/hud.ts#L34)) — a full revolution every ~5.2 s instead of the intended ~2 min. It feels like a busy loading spinner, breaking the §0.2 "calm, precise easing" tone.
- **Fix:** drop to ~0.18–0.30 rad/s (a 20–35 s revolution); brighten the leading edge of the sweep. Also re-seed the `GaugeArc` targets periodically so the gauges visibly re-ease to new plausible values instead of freezing at 0.78/0.42.

### QT-5 — Mandated **DepthOfField** pass is never used anywhere — **P2**
*Workflow #23. The single biggest "looks flat" lever, switched off.*

- **Claim vs reality:** MOTION-AND-FX-SPEC §2 lists **DepthOfField** in the post-processing stack ("focus the foreground HUD, blur the field — fake depth"; "order is load-bearing"), and the `cinematic-threejs-hud` skill makes DoF a core depth technique. **It is never imported.** Both composers run Bloom+Vignette(+Noise) only ([TelemetryHud.tsx:121-123](components/fx/TelemetryHud.tsx#L121); [SpaceScene.tsx:449-455](app/components/SpaceScene.tsx#L449)). Repo-wide, `DepthOfField`/`TiltShift`/`GodRays` appear **only in comments**, never as JSX.
- **Fix:** add a budgeted DoF to the HUD composer (focus the near bezel, blur the far grid once the radar is z-layered per QT-3) and a subtle DoF/fog to `SpaceScene`; half-res, gated on the existing `enablePostFx`/reduced-motion flag.

### QT-6 — "Volumetric" stage light is a flat 2-D smoothstep cone, not the mandated god-ray pass — **P2**
*Workflow #24.*

- **Claim vs reality:** `SPEC §2.1 FR-LIGHT` requires "a volumetric light pass (god-rays / light-shafts … half-res volumetric buffer, capped samples)." The code labels it "volumetric stage light (FR-LIGHT)" but `lightShaftFragment` ([shaders/hud.ts:49-74](components/fx/shaders/hud.ts#L49-L74)) is a **2-D cone** (`smoothstep` on `|x|/width`) with **binary** noise specks (`step(0.985, mote)` → ~1.5 % of cells pop on/off per frame) on a single plane. No shafts, no density accumulation, no radial-blur sampling.
- **Fix:** implement a real radial-blur god-ray post-pass (occlusion mask + radial sampling, half-res) **or** at minimum animate a softly-banded fbm density along the cone, add 2–3 overlapping translucent shaft quads at different z, and smooth the motes' lifecycle.

### QT-7 — Starfield not cinematic — hard-edged dots, no sprites/bokeh, no DoF, faint — **P2**
*Workflow #26 (depth craft; see also IV-6 for the parallax mechanics).*

- **Symptom:** stars are solid `sphereGeometry(0.15,8,8)` instances with flat `meshBasicMaterial` opacity 0.92 ([SpaceScene.tsx:319-331](app/components/SpaceScene.tsx#L319-L331)) — **crisp dots, not soft luminous points.** (Ironically `FloatingDetailBox` builds a radial glow texture for its particles; the background stars get none.) Combined with 0.42 layer opacity + no DoF, near/far stars look identical.
- **Fix:** swap instanced spheres for **additive point sprites with a soft radial glow** (reuse the existing glow-texture approach) so Bloom blooms only the brightest; add real depth (camera dolly / per-band parallax) + budgeted DoF/fog; reconsider the 0.42 opacity.

### QT-8 — Preloader is a generic spinner — no progress-bound sweep, no reveal wipe, no motif seed — **P2**
*Workflow #25.*

- **Claim vs reality:** MOTION-AND-FX-SPEC §3 specifies "Counter 0→100; **monochrome ring sweep**; **reveal wipe** sets the signature motif." Reality: a stock 160 px CSS spinner (`animation: spin … infinite`, [globals.css:202-211](app/globals.css#L202-L211)) + an `opacity 1→0` fade ([Preloader.tsx:73](components/site/Preloader.tsx#L73)). No progress-tied arc sweep, no clip-path wipe, and nothing seeds the radar/HUD motif (NN-2 recognisability) before the hero appears.
- **Fix:** make the ring a progress-bound SVG arc (`stroke-dashoffset = count/100`); replace the fade with a directional clip-path **wipe**; flash a faint `holoRing` ghost through the wipe so boot visibly seeds the signature HUD. Keep the reduced-motion instant-100 branch.

### QT-9 — D-ID↔ElevenLabs live lip-sync: specced + logged "PASS", but **mocked / not implemented for the live site** — **P2**
*Workflow #18/#19.*

- **`phase09` "PASS" is a mock:** `scripts/validate/phase09_avatar_sync.sh` boots the gateway with `LLM_PROVIDER=mock`, **POSTs a hardcoded `{"latencyMs":180}`**, reads it back, and asserts `<200` — it round-trips an **injected constant through a mock**, not a real D-ID Streaming ↔ ElevenLabs WebSocket. Yet `execution-log.md:17` presents `phase09 … latency<200ms | PASS` as evidence.
- **Live reality:** `MiniVicBot.tsx` opens a WS from `NEXT_PUBLIC_REALTIME_WS_URL` and calls `/api/realtime/session`; neither runs on the Firebase static export, so the clone shows an offline notice ([MiniVicBot.tsx:581](components/MiniVicBot.tsx#L581)). No D-ID/ElevenLabs/viseme client code exists in `app|components|lib` — only the unwired `services/` scaffold. SPEC/QA correctly mark `TC-FR-CLONE-LIVE` **OPEN**; the `phase09` log row and CLAUDE.md framing **over-state** it.
- **Fix:** relabel the `phase09` row as exercising the mock stats path only; keep `TC-FR-CLONE-LIVE` OPEN until a real (cost-gated) integration test measures actual lip-sync drift. (No code defect — documentation honesty.)

### QT-10 — Monochrome/token rule advertised as audit-enforced, but the audit only catches **chromatic hue** — **P2**
*Workflow #29.*

- **Claim vs reality:** CLAUDE.md rule 4 says "Never hardcode hex in components (**the audit fails the build if you do**)." But `checkMono()` in [scripts/validate/overhaul_static_audit.mjs:87-93](scripts/validate/overhaul_static_audit.mjs#L87-L93) only flags **chromatic** color (`saturation > 0.28`, and exempts anything with max channel ≤24 as "near-black"); its Tailwind regex lists only hued families (red…rose) and **never** matches `gray/white/black` utilities. So `FloatingDetailBox` carries **~22–31 hardcoded grey/white literals** (`THEME_COLORS` raw `rgb()`, `bg-[rgb(8_11_17)]`, `text-gray-50`, `border-white/25`, `0xffffff`) — and `TC-NFR-MONO` still reports **clean (PASS)**. The audit enforces "no hue," not "colours come from tokens."
- **Fix:** either route those values through `lib/palette.ts`/CSS vars, **or** extend `checkMono()` to flag any raw `rgb()`/`#hex` and `gray/white/black` utility in `components/**`, then reconcile the CLAUDE.md wording with what's actually enforced.

> The **shared-root** nature of the accordion bug (one `ExpandableCard` contract no consumer satisfies, reused 5×) is itself a false-claim finding (Workflow #3) — fix once, repair everywhere.

---

## 4 · Other defects

### OD-1 — Locked capability modal is **not an accessible dialog** — **P1**
*Workflow #30. Section: Hero capability modal. Primary-audience (employer) surface.*

- **Symptom:** clicking a capability card opens a full-screen **locked** modal (`pointer-events-auto`, 82 % backdrop) that is **not exposed as a dialog**: the container ([FloatingDetailBox.tsx:601](components/FloatingDetailBox.tsx#L601)) has **no `role="dialog"`, no `aria-modal`, no `aria-labelledby`**; focus is **never moved into** the modal; focus is **not trapped** (Tab cycles the page behind the backdrop); and the close button has **no accessible name** (its only child `<X>` is `aria-hidden`). A screen reader is never told a modal opened. WCAG 4.1.2 / 2.4.3.
- **Why CI missed it:** `a11y.spec.ts` (axe) scans at rest, when the modal is closed. `HiddenTerminal.tsx:154` already uses `role="dialog"` correctly — the pattern exists in-repo but wasn't applied here.
- **Fix:** on lock, set `role="dialog" aria-modal="true" aria-labelledby`, move focus to the close button (give it `aria-label`), trap Tab, restore focus to the trigger on close. (Escape + backdrop close already work.)

### OD-2 — OG/Twitter `summary_large_image` declared, but **no image shipped** — **P2**
*Workflow #34. Section: document head.*

- **Symptom:** `twitter.card='summary_large_image'` and `openGraph.type='website'` ([app/layout.tsx:32-46](app/layout.tsx#L32-L46)), but **neither `openGraph` nor `twitter` defines an `images` array**, there's no `og-*` file in `public/`, and the Person JSON-LD has no `image`. Sharing the URL on Slack/LinkedIn/X yields a **text-only card with an empty image frame** — directly undercutting the "memorable takeaway" goal for link-sharing employers/clients.
- **Fix:** add a 1200×630 OG image (or `app/opengraph-image`), wire `openGraph.images` + `twitter.images`, add `image` to the Person schema; or downgrade to `summary`. (`public/assets/my_avatar.png` exists as a candidate but is square, not 1200×630.)

### OD-3 — No GPU/FPS budget test for the 3 WebGL contexts — **P2**
*Workflow #32 (test-coverage facet of VFX-2).* `perf.spec.ts` measures only network bytes + CLS; `signature.spec.ts` only canvas count + zero WebGL errors; the `phase04` FPS probe (desktop, ≥60) is **not** a CI gate. **Fix:** add a context-count + sustained-FPS assertion on a throttled-mobile profile, or consolidate renderers.

### OD-4 — `window.spaceApp` exposes the live THREE scene/camera in production — **P3**
*Workflow #31.* `SpaceAppDebugProbe` ([SpaceScene.tsx:355-381](app/components/SpaceScene.tsx#L355-L381)) assigns `window.spaceApp = { scene, camera, THREE }` **unconditionally** — only the `console.debug` logging is `NODE_ENV`-gated, not the global. It's a deliberate IPC bridge for `FloatingDetailBox`, but ships a writable global misleadingly named `*DebugProbe`. **Fix:** rename to reflect it's a runtime bridge, or replace with a typed context/event bus; gate exposure behind a non-prod flag (FloatingDetailBox already degrades cleanly when absent). *(No security/secret exposure — the scene is decorative.)*

### OD-5 — Doc-vs-enforcement: MiniVic ships a **1.03 MB** second video vs the "no asset >500 KB" DoD — **P3**
*Workflow #33.* `public/assets/my-avatar.mp4` is 1,081,330 bytes — the only `public/` asset over CLAUDE.md's flat "no asset >500KB" DoD, yet it **passes** because the audit's *video* cap is 2.5 MB ([overhaul_static_audit.mjs:122](scripts/validate/overhaul_static_audit.mjs#L122)). It is lazy-loaded (fetched only when the bot opens), so no first-view impact. **Fix:** re-encode to <500 KB (the 228 KB hero clip proves it's achievable) or reconcile the DoD wording to the differentiated caps the audit actually enforces.

### OD-6 — Minor: fixed nav overlaps content on mid-page mobile reload — **P3**
*First-hand. On a mobile reload that restored scroll mid-section, the fixed `VIKRAM.` / `MENU` nav overlapped an expanded card heading.* Likely a missing nav backdrop/solid-fill when scrolled. Low impact; worth a nav `backdrop-filter`/solid background when not at the top.

---

## Appendix A — Severity ledger (34 confirmed)

| ID | Title | Sev | Bucket |
|----|-------|-----|--------|
| IV-1 | About Me accordion never expands (`height:0`) | **P0** | Interactive viz |
| IV-2 | Skills accordion — identical dead-expand bug | P1 | Interactive viz |
| IV-3 | Hero capability modal 3-D FX fully occluded | P1 | Interactive viz / VFX |
| IV-4 | Architecture Map "packet dots" never rendered | P2 | Interactive viz |
| IV-5 | Mini Vic clone leaks prompt scaffolding (free-text) | P2 | Interactive viz |
| IV-6 | Starfield — no scroll-coupled depth parallax | P2 | Interactive viz / VFX |
| IV-7 | Starfield — no reduced-motion fallback (mandatory) | P2 | Interactive viz |
| VFX-1 | Hero radar — full-viewport WebGL+Bloom at 0.22 opacity | P2 | VFX |
| VFX-2 | Three live WebGL contexts, each with post-processing | P2 | VFX |
| VFX-3 | Morphing blob invisible (0.048) + Chromium-only | P3 | VFX |
| VFX-4 | Hero "glitch-text" is dead code | P2 | VFX |
| VFX-5 | Dossier signature motif = 4 invisible corner ticks | P3 | VFX |
| VFX-6 | Stale `CameraRig` comment / FX drift coupling | P3 | VFX |
| QT-1 | About/Skills marked VERIFIED on text-only tests | P1 | False-pass |
| QT-2 | `FR-SIGFX` "≥3 interactive" VERIFIED, ships 1 decorative HUD | P1 | False-pass |
| QT-3 | JARVIS radar is a flat 2-D disc (no depth/ticks/sparkline) | P1 | Below-threshold |
| QT-4 | Radar sweep ~19–24× too fast vs spec | P2 | Below-threshold |
| QT-5 | Mandated DepthOfField never used | P2 | Below-threshold |
| QT-6 | "Volumetric" light is a flat 2-D cone | P2 | Below-threshold |
| QT-7 | Starfield not cinematic (no sprites/bokeh/DoF) | P2 | Below-threshold |
| QT-8 | Preloader is a generic spinner, no motif seed | P2 | Below-threshold |
| QT-9 | D-ID lip-sync mocked / "phase09 PASS" overstated | P2 | False-pass |
| QT-10 | Monochrome audit only catches hue, not hardcoded tokens | P2 | False-pass |
| (#3) | `ExpandableCard` is the single shared broken root (5× reuse) | P1 | False-pass |
| OD-1 | Capability modal not an accessible dialog | P1 | Other (a11y) |
| OD-2 | OG/Twitter `summary_large_image` with no image | P2 | Other (SEO) |
| OD-3 | No GPU/FPS budget test | P2 | Other (test) |
| OD-4 | `window.spaceApp` exposed in production | P3 | Other |
| OD-5 | MiniVic 1.03 MB video vs 500 KB DoD | P3 | Other (perf/doc) |
| OD-6 | Nav overlaps content on mid-page mobile reload | P3 | Other |

*(VFX-1/2 and QT-3/5/6/7 overlap with the consolidated FloatingDetailBox-occlusion and 3-WebGL-context findings, which the workflow surfaced from multiple angles; listed once each here.)*

## Appendix B — What was verified **working** (for balance)

These were tested live and pass — do **not** "fix" them:

- **Experience accordion** — opens correctly (Framer-Motion `height:0→auto`; runtime height == scrollHeight). It is the reference implementation the broken accordions should copy.
- **Architecture Map** — path-switch buttons (LLM Chat / Telemetry / Governance) flip `aria-pressed` and swap the explainer text + highlighted path. Interactive and correct. *(Only the "packet dots" sub-feature is missing — IV-4.)*
- **Proof counters** — animate from 0 to target (15+, $5M+, ≈92%, 10k+) on scroll into view.
- **Mini Vic clone** — opens, accepts input, and answers its **built-in suggestion chips** with coherent, on-message copy. *(Only certain free-text queries leak scaffolding — IV-5.)*
- **FloatingDetailBox lifecycle** — opens with content, closes via **Escape and backdrop**, and **disposes** its 3-D objects on close (scene 10→2, no leak). *(Only the FX visibility is the problem — IV-3.)*
- **Boot / Preloader timing** — counter settles to 100, reveal < 2.5 s. *(Only its craft is generic — QT-8.)*
- **Hygiene** — zero console errors/warnings (only Fast-Refresh dev logs); ~57 fps rAF; no app-asset 404s; mobile (390 px) has no horizontal overflow and correctly suppresses the radar backdrop.

## Appendix C — Rejected candidate (verification working as intended)

- **"Hero radar still rendering despite being removed in a prior iteration"** — **rejected.** `grep -rin radar docs/` returns **0 hits**; no SPEC/QA/log/prompt ever claims the radar was removed or reduced. The radar/HUD is the **intended, documented recurring signature motif** (NN-2; `HudFrame.tsx`, `TelemetryHud.tsx`, `signature.spec.ts`). So the radar's presence is **by design** — the real issues with it are its *flat quality* (QT-3/QT-4) and *cost-vs-visibility* (VFX-1/VFX-2), not that it was "supposed to be gone." Documented here so the assumption isn't re-raised.

## Appendix D — The systemic pattern (why broken things passed QA)

Three of the worst findings share one root: **tests assert presence, not behaviour.**
- `toContainText`/`toHaveCount` pass on `height:0; overflow:hidden` content → broken accordions read "VERIFIED" (QT-1).
- `canvas.count() >= 2` is accepted as proof of "≥3 interactive per-project effects" (QT-2).
- A mock POST-ing its own latency back is accepted as a real lip-sync "PASS" (QT-9).
- The monochrome audit checks **hue**, but the rule is documented as "no hardcoded color" (QT-10).

**Recommended guardrails:** for every interactive feature add a test that asserts the *user-visible outcome* (opened body `height > 0` / `toBeVisible()`, a real pointer interaction changing state, a pixel-diff that an effect is on-screen), and reconcile each `VERIFIED` row in `quality-assurance.md` whose evidence is a count/text-only check.
