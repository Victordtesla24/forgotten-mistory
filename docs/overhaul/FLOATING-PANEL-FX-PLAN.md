# Floating-Panel FX Upgrade — Implementation Plan (Fortune-500 / studio-grade)

Status: in progress. Branch `overhaul/marvel-grade-portfolio`.
Goal: upgrade the hero "floating panels" motion to real Three.js / R3F / GLSL quality
while keeping strict monochrome discipline, the FPS budget, the reduced-motion contract,
and **zero regression** of the existing 469-line `floating-panels-animation.spec.ts`.

## Guiding strategy — additive enhancement layers

Each existing layer is kept as the **structural contract + reduced-motion fallback**; the
real WebGL/GLSL is mounted as an **enhancement layer on top** (full-motion only). This keeps
every current assertion green (D5) while delivering the upgrade (D6/D7/D8) and a clean
reduced-motion flatten (D13).

WebGL context budget: today the page mounts ≤3 contexts (SpaceScene, CursorDepthField,
TelemetryHud). This plan adds 2 persistent (telemetry depth backdrop, GLSL sparkline) and 1
transient (detail-box particles, only while a panel is open) → peak ≤6, safely under Chrome's
~16-context ceiling. Every new scene: `frameloop="demand"`, capped DPR (≤1.5), IntersectionObserver
pause when off-screen, refs-not-setState in `useFrame`, palette-sourced uniforms only.

## Systems

### System B — Living Sparkline (GLSL) — `data-spark-gl`
- New `components/fx/shaders/sparkline.ts` (vertex+fragment GLSL): polyline from N sample
  uniforms, animated traveling glow (uTime), gradient area-fill, glowing scan node.
- New `components/fx/SparklineGL.tsx`: self-contained R3F canvas, sample values as a uniform
  array, throttled demand loop. Reduced-motion → renders nothing (the SVG remains).
- `TelemetryPanel.tsx`: overlay `<SparklineGL>` above the existing SVG (SVG stays = fallback +
  structural contract for `.telemetry-spark-area/-node/-stroke`).

### System A — Panel Depth Parallax (real 3D) — `data-panel-depth`
- New `components/fx/shaders/panelDepth.ts` + `components/fx/PanelDepthScene.tsx`: R3F backdrop
  inside `.telemetry-panel` with a **perspective camera that tilts toward the pointer** (real 3D),
  instanced depth motes across Z-planes (true depth sorting / parallax), a cursor-tracking
  volumetric light cone, and selective Bloom. DOM content stays crisp on top.
- CSS `--rx/--ry/--mouse-x` tilt on the DOM panel is retained (CursorGlow) — tests depend on it,
  and it is the reduced-motion fallback.

### System C + Hover — Magnetic Glass Cards (real 3D transforms) — `--depth`, `--edge-glow`
- New `components/site/CardDepth.tsx`: a single controller that attaches GSAP-driven hover
  timelines to every `[data-outcome-card]` — real `translateZ` Z-lift, deeper perspective,
  parallax inner layers (icon lifts more than text), hairline edge glow. Reduced-motion → no-op.
- CSS `.meta-card` transform gains `translateZ(var(--depth))` and `preserve-3d` inner parallax.
- CursorGlow continues to write `--rx/--ry/--tx/--ty` (tilt + magnetic) — kept (tests + fallback).

### FloatingDetailBox materialization — R3F instanced particles — `data-detail-canvas` (now WebGL)
- New `components/fx/shaders/materializeParticles.ts` + `components/fx/DetailMaterialize.tsx`:
  R3F instanced/points particle system with 3D trajectories from the card origin → panel centre,
  volumetric convergence, Bloom post-processing. Self-contained per dialog, torn down on close.
- `FloatingDetailBox.tsx`: replace the 2-D `MaterializeCanvas` with `<DetailMaterialize>` wrapped in
  `<div data-detail-canvas data-detail-fx="r3f">` (keeps existing count assertions; the inner
  `<canvas>` is WebGL). DOM panel content overlays on top. Reduced-motion → no particles (unchanged).

## Tests (extend `tests/overhaul/floating-panels-animation.spec.ts`, test-first)
- System B: `[data-spark-gl]` present + nested `<canvas>` + `data-gl="webgl"` under full motion;
  absent under reduced motion; SVG structure still present (existing).
- System A: `[data-panel-depth]` present + nested WebGL `<canvas>` under full motion; absent reduced.
- System C/hover: hovering a card sets `--depth` (translateZ) and `--edge-glow`; reduced motion none.
- DetailBox: `[data-detail-canvas]` count 1 + nested `<canvas>` + `data-detail-fx="r3f"`; WebGL;
  reduced-motion count 0; teardown on close; zero console errors.

## Verification gates (DoD D1–D18)
tsc → lint → static audit 7/7 → full floating-panels spec → no regression in other specs →
build:static → commit → push → firebase deploy → production verification → execution log.
