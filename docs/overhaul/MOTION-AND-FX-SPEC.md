# Motion, visualisation & visual-effects specification

The cinematic grammar of the site — animation, data-visualisation, and post-processing.
Reference quality bar: Marvel/WB/Disney title-sequence discipline, **applied restrainedly**.
Every effect has a job; nothing animates for decoration. Monochrome only.

## 0. First principles

1. **Purposeful** — motion reveals hierarchy, shows a real metric, or guides the eye. If it
   does none of those, remove it.
2. **Calm authority** — slow, precise easing; depth via light/blur/parallax, not colour or busyness.
3. **Honest** — visualisations show real data/claims; they never exaggerate (NN-3).
4. **Accessible** — every animation has a `prefers-reduced-motion` static equivalent.
5. **Cheap** — 60 fps budget; no per-frame allocation; GPU-friendly transforms only.

## 1. Motion tokens

| Token | Value | Use |
|---|---|---|
| `--motion-fast` | 220 ms | hovers, micro-feedback |
| `--motion-base` | 360 ms | reveals, card transitions |
| `--motion-slow` | 520 ms | section/hero entrances |
| `--motion-ease-standard` | `cubic-bezier(0.22,1,0.36,1)` | most UI |
| `--motion-ease-emphasized` | `cubic-bezier(0.16,1,0.3,1)` | hero/feature entrances |
| stagger | 60–90 ms | list/grid item cascades |

Only animate `transform` and `opacity` (and `filter` sparingly). Never animate layout
properties (width/height/top/left) on scroll paths.

## 1.1 Scroll orchestration — GSAP + ScrollTrigger (FR-SCROLL)

GSAP + ScrollTrigger is the **primary scroll-orchestration layer** (prompt §3); Framer Motion
is reserved for component-level DOM motion. Division of labour:

- **GSAP/ScrollTrigger:** orchestral, scrubbed/pinned timelines tied to scroll — section
  pin-and-reveal, parallax depth, the hero→proof→experience narrative beats, scene parameter
  scrubbing (e.g. HUD value ramps as you scroll). One `gsap.context()` per section component;
  always `ctx.revert()` on unmount.
- **Rules:** register `ScrollTrigger` once (client only); `scrub: true` for value-tied motion,
  discrete tweens otherwise; `invalidateOnRefresh` on resize; never pin without a fallback height.
- **Reduced-motion:** wrap every ScrollTrigger timeline in `gsap.matchMedia()` with a
  `(prefers-reduced-motion: reduce)` branch that sets final states with no scrub (TC-FR-SCROLL).
- **Perf:** ScrollTrigger only drives `transform`/`opacity`/uniform values — never layout.

## 2. Post-processing stack (R3F)

Order is load-bearing (`@react-three/postprocessing` 2.19). Current SpaceScene:
`Bloom → Noise → Vignette`. Target signature scenes:

```
EffectComposer
  ├─ Bloom            (intensity ~0.5, luminanceThreshold ~0.18, mipmapBlur) — selective glow on bright elements only
  ├─ DepthOfField     (optional; focus the foreground HUD, blur the field) — fake depth
  ├─ Vignette         (offset ~0.18, darkness ~0.78) — frame the eye
  └─ Noise            (opacity ~0.015) — filmic grain, kills banding
```
Rules: keep **text out of bloom** (render UI in DOM, not WebGL, or mask it). Disable the whole
composer on `prefers-reduced-motion` or low-power devices (already wired in `SpaceScene`).
See the `cinematic-threejs-hud` skill for selective bloom + DoF tuning.

## 2.1 Custom GLSL shaders & volumetric lighting (FR-SHADER / FR-LIGHT)

Mandated by prompt §3 — signature scenes are not just primitives + post-FX:

- **Custom GLSL (FR-SHADER):** ≥1 signature scene ships a hand-authored `ShaderMaterial` with
  vertex **and** fragment GLSL (e.g. the telemetry HUD's scanning ring, the nebula fbm field,
  the packet-flow energy along edges). Shaders live in `components/fx/shaders/*` and must
  **compile clean** (no WebGL program warnings) and render across Chrome/WebKit/Firefox
  (TC-FR-SHADER, TC-NFR-RENDER). Author with explicit `precision`, guarded uniforms, and a
  software fallback path.
- **Volumetric stage lighting (FR-LIGHT):** the flagship JARVIS HUD scene uses a volumetric
  light pass (god-rays / light-shafts via a volumetric technique or `drei` lighting helpers +
  a custom pass) to give the monochrome scene cinematic depth (TC-FR-LIGHT). Budget it: half-res
  volumetric buffer, capped samples, disabled on low-power/reduced-motion.
- **Monochrome discipline:** shader colours come from `lib/palette.ts` constants passed as
  uniforms — never hardcoded chromatic values in GLSL.

## 3. Per-section motion spec

| Section | Effect | Timing | Reduced-motion |
|---|---|---|---|
| **Preloader** | Counter 0→100; monochrome ring sweep; reveal wipe sets the signature motif | ≤1.5 s perceived | Instant 100 + fade |
| **Navigation** | Logo fade-in; menu overlay slide (translateY) with link stagger | base/slow | Overlay appears, no slide |
| **Hero** | Headline line-by-line clip-reveal; subtitle fade-up; avatar crossfade still→video | slow, emphasized | Static text + still avatar |
| **Proof bar** | Metric count-up (tabular numerals) on in-view | 1.2 s ease-out | Final values shown |
| **About** | Paragraph fade-up on scroll | base | Static |
| **Experience** | Accordion height/opacity; role nudge on hover; chevron rotate | base, fast hover | Open/close instant |
| **Signature FX** | WebGL/SVG scenes (see §5); enter on in-view, pause off-screen | per-scene | Static poster frame |
| **Project catalogue** | Card reveal stagger; hover lift + hairline glow; per-card micro-effect | base + 60 ms stagger | Static cards |
| **Skills** | Group reveal; expandable list height | base | Static, expanded |
| **MiniVic** | Typing indicator; message fade-up; avatar speaking pulse | fast | No pulse; text appears |
| **Contact** | CTA magnetic hover (subtle); social underline wipe | fast | No magnet |
| **Cursor** | `CursorGlow` soft spotlight following pointer | continuous | Disabled |

## 4. Signature motif — the telemetry HUD (recurring, NN-2)

A monochrome real-time HUD derived from the **jarvis** project. It recurs as the site's
visual signature (preloader seed, hero accent, project #1 demo) so the site is recognisable.

- **Geometry:** thin concentric holo-rings; radial gauges; streaming sparklines; tick marks.
- **Data:** simulated-but-plausible telemetry (latency, throughput, fps) with smooth easing;
  labelled honestly as a demo.
- **Palette:** `--white` strokes on `--ink-900`; `--steel` for secondary; glow via Bloom.
- **Motion:** rings rotate slowly (≤0.05 rad/s); sparklines scroll left; gauges ease to targets.
- **Perf:** Canvas2D or instanced R3F; throttle texture updates to ~30 Hz; no per-frame alloc.
- **Reduced-motion:** a single static frame with final values.

## 5. Per-project signature effects (monochrome data-viz)

One effect per project (SPEC §7). Spec per effect = {visual, data, motion, fallback}. Flagship
(MVP) set:

1. **Telemetry HUD** (jarvis) — §4. Pillar A+B.
2. **WebSocket packet-flow** (telemetry-server/tesla-api) — particles travel edges of a graph;
   a live "P95 < 200 ms · 10k devices" readout eases; pause off-screen. Fallback: static graph.
3. **ATO evidence-harness time-compression** — a bar collapses "3 h → 15 min (≈92%)" across
   200+ scenario ticks; a legacy-terminal panel (monochrome phosphor on obsidian, no hue) morphs into an automated pipeline. Fallback: the
   final bar + caption.

Catalogue (post-MVP, see SPEC §7 table): sprint burndown, inbox-triage funnel, résumé↔JD
arcs, D3 journey timeline, celestial ephemeris, clearance stepper, self-healing graph,
before/after upscaler, multi-agent orchestration graph, key-signing pulse, token-reflow,
event seat-map shimmer. Each: monochrome, evidence-tied, reduced-motion fallback, FPS-budgeted.

## 6. Visual/after-effects (atmosphere)

- **Starfield + nebula** (`SpaceScene`): instanced stars (monochrome), dark nebula shader,
  occasional shooting star. Bloom + grain + vignette. Behind all content; `mix-blend: screen`.
- **Film grain & vignette:** global, very low opacity — filmic cohesion, anti-banding.
- **Hairline glows:** card borders/hover use white/steel glow, never coloured.
- **Parallax:** subtle pointer/scroll parallax on depth layers; disabled on mobile/reduced-motion.
- **Scanlines/CRT:** keep extremely subtle (≤0.1 opacity) or drop if they read as gimmicky.

## 6.5 Dynamic voiceover & avatar lip-sync (FR-VOICE-DYN / FR-CLONE / FR-CLONE-LIVE)

Two audio layers, synced to on-screen view transitions (prompt §5):
- **Ambient bed:** a low, looping atmospheric layer; **ducks** under any triggered voiceover and
  under MiniVic speech; respects mute and `prefers-reduced-motion`.
- **Triggered voiceover:** a short cued line fires on entering an instrumented section
  (ScrollTrigger `onEnter`), debounced so fast scrolling never stacks cues (TC-FR-VOICE-DYN).
- **Cloned voice only:** every greeting/voiceover asset is the **correct ElevenLabs cloned
  voice id** — never a generic fallback (the D-1 defect). Pre-rendered to static MP3 for the
  durable path; verified by voice-id/asset-hash check (TC-FR-VOICE).

**Avatar lip-sync:**
- **Static default (FR-CLONE):** a pre-rendered avatar MP4 already synced to the greeting
  audio, ≤120 ms tolerance; **zero layout shift** in the avatar container on load (reserve box).
- **Live (FR-CLONE-LIVE, dynamic path):** D-ID Streaming API consumes ElevenLabs WebSocket
  speech arrays → real-time packet extraction → `viseme/smoother.ts` → **frame-accurate
  (≤1 frame / ~40 ms) lip-sync**. Lifecycle handles (sockets/sessions) open, stream, and
  dispose cleanly with a reconnection path (TC-INT-CLONE); behind `NEXT_PUBLIC_REALTIME_WS_URL`.

## 7. Motion performance rules (enforced by TC-NFR-FPS)

- ≥55 fps desktop / ≥30 fps mobile on every scene; no leak over 60 s.
- Cap DPR (scenes run at dpr 1–1.5); antialias off where bloom hides edges.
- `will-change: transform` only on actively-animating elements; remove after.
- Pause/teardown WebGL when off-screen or tab hidden (visibilitychange).
- No `setState` in `useFrame`; mutate refs/attributes and flag `needsUpdate`.

## 8. Reduced-motion contract

`prefers-reduced-motion: reduce` (and low-power detection) must yield a fully static,
information-complete site: final metric values shown, posters instead of scenes, no parallax,
no cursor glow, no infinite loops. This is tested (TC-NFR-A11Y) and non-negotiable.

---

# 9. Stage-2 Architecture — GSAP orchestration plan & GLSL shader inventory

> **Council Stage 2 of 5 — Solutions Architect.** Authored from `RESEARCH-DOSSIER.md`
> (Stage 1) + `prompt.md` R1–R8/C1–C3/P1–P10. Scope: the **motion/FX/shader** half of the
> architecture (component scene graphs, GSAP timelines, GLSL list). The **file-change map,
> FSM mapping, and test strategy** live in `IMPLEMENTATION-PLAN.md §A`. Read both together.
> **Design only — no production code.** All effects extend existing `components/fx/*` and
> `components/site/*` per C3; the data layer (`app/data/*`) is read-only per C1.

## 9.1 GSAP + ScrollTrigger master orchestration plan (R1, R7)

One **`gsap.context()` per pinned section component**, always torn down with `ctx.revert()`,
always wrapped in `gsap.matchMedia()` with a `(prefers-reduced-motion: reduce)` branch that
sets final state with no scrub (the proven `ScrollRail.tsx` pattern — replicate, do not
re-invent). `ScrollTrigger` is registered exactly once, client-only, in `lib/gsap.ts`.
Division of labour is fixed: **GSAP drives scroll-orchestrated/scrubbed/pinned timelines;
Framer Motion drives component-level DOM motion.** Disney+/Marvel takeaway (R7): borrow the
*restraint* (fast hovers, slow narrative reveals) and full-bleed dark hero — **not** the flat
catalogue scroll; the portfolio is narrative, so sections pin-and-scrub.

| # | Section (page.tsx anchor) | GSAP trigger | Scrub | Pin | Drives | Reduced-motion branch |
|---|---|---|---|---|---|---|
| T1 | `#hero` | top top → bottom top | `true` | `false` | HUD telemetry uniforms ramp (`uLoad` 0→1), headline clip-reveal, avatar still→video crossfade | final uniforms; static headline; still avatar |
| T2 | `#proof` | enter 80% | — (discrete) | no | Framer count-up handoff (GSAP only fires `onEnter` cue) | final values shown |
| T3 | `#experience` | **existing `ScrollRail.tsx`** | `true` | label pin | scrubbed fill + pinned role label (VERIFIED — do not regress) | open/instant |
| T4 | `#work` (Signature FX) | per-scene pin, sequential | `1` (catch-up) | `true` | each flagship scene's hero uniform (`uReveal`/camera dolly), then unpin to next | static poster frame per scene |
| T5 | `#catalogue` | vertical→horizontal | `true` | `true` | horizontal card-row translateX mapped to vertical scroll progress (Disney+ row, narrative-gated) | vertical static card grid |
| T6 | `#skills` | enter, stagger | — | no | Framer group reveal + per-skill micro-viz `onEnter` mount cue | static, expanded |
| T7 | `#minivic` / `#contact` | enter | — | no | Framer reveals; magnetic CTA hover (fast) | no magnet, text appears |

**Rules carried from §1.1 (unchanged, restated for the builder):** `scrub:true` only for
value-tied motion; `invalidateOnRefresh` on resize; never pin without a fallback height;
ScrollTrigger only touches `transform`/`opacity`/uniform values — never layout. The hero→proof→
experience→signature beat sequence is the Bandinopla section-scrubbing skeleton (dossier §4.1):
each pinned section = one timeline that scrubs its dedicated 3D/SVG effect.

## 9.2 GLSL shader inventory (FR-SHADER / FR-LIGHT, R2)

All shaders live under `components/fx/shaders/*` (the established shader directory, C3). Each
ships **explicit `precision`**, **guarded uniforms**, palette uniforms sourced from
`lib/palette.ts` (never hardcoded hue — NFR-MONO), must **compile clean** (zero WebGL program
warnings) and render across Chrome/WebKit/Firefox (TC-FR-SHADER, TC-NFR-RENDER), with a
software/poster fallback. Monochrome only: strokes `--white`, secondary `--steel`, base `--ink-900`.

| Shader | Type | Host scene | Uniforms (key) | Status | Notes |
|---|---|---|---|---|---|
| `holoRing` | vert+frag | TelemetryHud (jarvis HUD) | `uTime`,`uLoad`,`uColorStroke`,`uColorSteel`,`uDpr` | **exists** (mounted, §4) | harden: DPR fallback, 30 Hz throttle, no per-frame alloc |
| `volumetricShaft` | frag post-pass | TelemetryHud flagship | `uTime`,`uLightPos`,`uSamples`,`uHalfRes` | **exists** (mounted) | FR-LIGHT: half-res buffer, capped samples, off on low-power |
| `nebulaFBM` | vert+frag | SpaceScene (background) | `uTime`,`uIntensity`,`uColorInk` | **exists** | demoted (opacity 0.42); tone to mono, no regression (C2) |
| `packetFlowEdge` | vert displacement + frag | PacketFlowGraph (§7 #2) | `uTime`,`uFlow`,`uP95`,`uColorStroke` | **new shader, existing component** | energy travels graph edges; values from real readout, not random (R3) |
| `celestialOrbit` | frag (orbit trails) | new `CelestialSphere.tsx` (§7 #8) | `uTime`,`uOrbitSpeed`,`uColorSteel` | **new** | slow monochrome ephemeris; R3F orbit trails (jyotish/btr cluster) |
| `agentGraphPulse` | frag (edge pulse) | new `OrchestrationGraph.tsx` (§7 #12) | `uTime`,`uActiveEdge`,`uColorStroke` | **new** | multi-agent graph (meta: how this site was built) |

Non-shader flagship/catalogue effects stay **SVG/Framer** per DEV-7 (lightweight, read as
"real-time canvas" intent): SprintBurndown, AtoEvidenceBar, inbox-triage funnel, TokenReflow,
résumé↔JD arcs, journey timeline, clearance stepper, self-healing graph, upscaler, key-signing,
seat-map. These already exist or extend an existing fx component (see IMPLEMENTATION-PLAN §A.3).

## 9.3 Per-skill / per-project signature scene contracts (R2 — one design per tangible skill)

Each tangible skill (from `app/data/siteContent.ts` `skillGroups`) and each flagship project
(`projects`/`featuredRepos` → SPEC §7 catalogue) maps to **one dedicated, fully-implemented
effect** — never a shared placeholder (FR-CATALOG). Contract shape = `{props, sceneGraph,
shaders, data, motion, fallback}`. Skill→effect binding:

| Tangible skill (siteContent skillGroups) | Bound signature effect | Component | Scene graph / tech |
|---|---|---|---|
| **AI/ML Solutions, LLM Pipelines, MLOps** | Multi-agent orchestration graph (§7 #12) | `OrchestrationGraph.tsx` *(new)* | R3F instanced nodes + `agentGraphPulse` shader edges |
| **Real-Time Telemetry** (R3 anchor) | JARVIS telemetry HUD (§7 #1) | `TelemetryHud.tsx` *(exists)* | R3F + `holoRing`+`volumetricShaft` GLSL + Canvas2D sparkline; **real browser perf counters** (FPS, frame-time via `performance.now()` rAF delta) — NOT a coffee-cup sim |
| **Data Architecture** | WebSocket packet-flow (§7 #2) | `PacketFlowGraph.tsx` *(exists)* | R3F instanced particles + `packetFlowEdge` shader; live P95<200 ms / 10k-device readout eases |
| **Cloud-Native & Full-Stack / CI-CD / DevOps** | Self-healing build/error graph (Error-Management-System) | `ArchitectureMap.tsx` *(exists, extend)* | SVG/Framer node graph; failing node → repair pulse |
| **Program Delivery / Agile/Scrum/SAFe** | Sprint burndown/burnup + PI swimlane (§7 #3) | `SprintBurndown.tsx` *(exists)* | SVG + Framer; velocity ticks |
| **Stakeholder Alignment / Exec Reporting** | Inbox-triage funnel (§7 #5, AI-Gmail) | new effect in `ProjectsCarousel`/`fx` *(extend)* | Framer/SVG; messages classify, labels settle |
| **Risk/Capacity/Budget (ATO)** | ATO evidence-harness time-compression (§7 #4) | `AtoEvidenceBar.tsx` *(exists)* | SVG bar collapses 3 h→15 min (≈92%) over 200+ ticks; legacy-terminal→pipeline morph |
| **Credentials & Governance** | Clearance/credential stepper | extend `ExpandableCard`/`Dossier` *(exists)* | Framer stepper; monochrome |
| **Jyotish/astro cluster** (btr-demo, jyotish-shastra, Birth-Time-Rectifier) | Celestial ephemeris sphere (§7 #8) | `CelestialSphere.tsx` *(new)* | R3F orbit trails + `celestialOrbit` shader |
| **NLP / Resume Tailor** | Résumé↔JD matching arcs / TokenReflow | `TokenReflow.tsx` *(exists)* | SVG arcs / token reflow |
| **Relationship Timeline (D3)** | D3 journey timeline | extend `Dossier`/catalogue card *(exists)* | SVG/D3 temporal viz |

**Component contract template (builder fills per scene):**
```
Props:      { active: boolean; reducedMotion: boolean; dpr: number; palette: PaletteTokens }
SceneGraph: <Canvas dpr={[1,1.5]}> <Scene/> <EffectComposer/> </Canvas> + DOM overlay (text OUT of bloom)
Shaders:    [list from §9.2]
Data:       real/sourced values (R3) — perf counters, P95 readout, resume metrics; never random/coffee-cup
Motion:     enter on in-view (IntersectionObserver), PAUSE off-screen + on visibilitychange (NFR-FPS)
Fallback:   static poster frame (reduced-motion / low-power / WebGL fail)
```

## 9.4 R1 avatar + voice-clone component contract (real-time AI video avatar)

Extends `components/site/HeroAvatar.tsx` (already does video/still crossfade) + `MiniVicBot.tsx`
(3-tier brain). **No new top-level component** — extend the existing crossfade pattern (C3).
Three-tier degradation (dossier §3.2), zero-CLS reserved container:

| Tier | Path | Avatar | Voice | Gate |
|---|---|---|---|---|
| 1 — live | dynamic VPS | D-ID Streaming ← ElevenLabs WS → `viseme/smoother.ts`, ≤1 frame / ~40 ms | live ElevenLabs cloned voice id | `NEXT_PUBLIC_REALTIME_WS_URL` set |
| 2 — static | Firebase static | pre-rendered synced MP4 greeting (≤120 ms tol) + still | pre-rendered MP3, **correct cloned voice id** (D-1 fix) | default |
| 3 — offline | offline reload | still avatar image | none / text | always |

**Contract:** `HeroAvatar` reserves its box at layout time (zero CLS); crossfades still→MP4 on
load; exposes a `speaking` pulse hook for MiniVic. Mascot Bot SDK flagged as a lower-cost
browser-side alternative to D-ID (dossier §3.1) — **not adopted now**, recorded as a fallback
option. Every voiceover/greeting asset verified by voice-id/asset-hash check (TC-FR-VOICE).
