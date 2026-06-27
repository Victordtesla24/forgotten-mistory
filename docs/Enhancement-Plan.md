# Enhancement Plan

**Repo:** `github.com/Victordtesla24/forgotten-mistory` · **Branch:** `overhaul/panels-fx-upgrade`
**Live site:** `https://forgotten-mistory.web.app/` · **Stack:** Next.js 14 · React 18 · TS strict · R3F · GSAP · Tailwind 4
**Env:** `~/.claude/.env.production` · **CWD:** `/Users/vic/claude/forgotten-mistory`

***

## Part 1 — Independent Audit: Current State

### 1.1 Overall Quality Baseline

The site currently scores **~5.5 / 10** against the stated Fortune-500 / Marvel-Studios benchmark. The structural engineering layer (TypeScript clean, lint clean, 8/8 static-audit checks, 36/36 Playwright tests on the local suite) is solid. However the cinematic VFX layer — the primary differentiator — remains either missing, invisible, or misclassified as complete.

| Dimension | Current Score /10 | Target | Gap |
|---|---|---|---|
| Architecture / code hygiene | 8.0 | 9.5 | 1.5 |
| Typography & design system | 7.5 | 9.5 | 2.0 |
| Navigation & layout | 7.0 | 9.5 | 2.5 |
| Starfield / background VFX | 3.5 | 9.5 | 6.0 |
| Interactive panels (accordions) | 2.0 | 9.5 | 7.5 |
| Hero section & capability modal | 4.0 | 9.5 | 5.5 |
| JARVIS telemetry HUD | 3.0 | 9.5 | 6.5 |
| Preloader experience | 4.0 | 9.5 | 5.5 |
| AI clone chatbot (voice + video) | 2.0 | 9.5 | 7.5 |
| Project signature effects | 2.5 | 9.5 | 7.0 |
| Performance / Lighthouse | 5.0 | 9.5 | 4.5 |
| Accessibility / a11y | 7.0 | 9.5 | 2.5 |
| SEO / OG metadata | 5.0 | 9.5 | 4.5 |
| Employer/client CTA clarity | 6.5 | 9.5 | 3.0 |
| **OVERALL** | **5.1** | **9.5** | **4.4** |

***

### 1.2 Critical Defects (P0–P1, confirmed in source)

**P0 — About Me & Skills accordions never expand**
`ExpandableCard.tsx:31-49` toggles `.open` class; `globals.css:847` sets only `opacity:1` on open — never sets `height`. Both "VERIFIED ✅" in `quality-assurance.md` via `toContainText`-only tests that pass at `height:0`. The fix pattern already exists in `ExperienceAccordion.tsx:48-56` (Framer-Motion `height: 0 → 'auto'`).

**P1 — Hero modal 3D FX fully occluded**
`FloatingDetailBox.tsx:601` renders `bg-black/82 backdrop-blur-[6px]` at `z-` directly over `.space-scene-layer` which is at `opacity:0.42` and dimmed further to `0.35` on `body.detail-open`. The 600-particle materialise burst runs at full GPU cost with zero visible output.

**P1 — FR-SIGFX false-pass**
`quality-assurance.md:201` marks `TC-FR-SIGFX` VERIFIED on canvas-count only. The JARVIS HUD is `aria-hidden="true"`, has zero pointer/keyboard handlers, and is a flat 2D radial disc — not "≥3 interactive per-project effects".

**P1 — Modal not an accessible dialog**
`FloatingDetailBox.tsx:601` has no `role="dialog"`, no `aria-modal`, no focus trap. WCAG 4.1.2 violation on the primary employer-facing surface.

***

### 1.3 High-Impact VFX Gaps (P2)

**Starfield (SpaceScene.tsx)**
- 4,500 instanced stars at `opacity:0.42` + `mix-blend: screen` on near-black = near-invisible
- Hard-edged `sphereGeometry(0.15,8,8)` instances — not cinematic point-sprite bokeh
- No scroll-coupled depth parallax (only camera-X tilt at max `0.22 rad`)
- Stars have no DepthOfField pass; `DepthOfField` is unimported anywhere in the codebase
- `prefers-reduced-motion` disables post-FX only; 5 `useFrame` loops still run

**JARVIS HUD (shaders/hud.ts)**
- One flat `z=0` plane; no z-layered concentric rings
- Sweep runs at `uTime * 1.2 rad/s` — 19–24× faster than the SPEC's `≤0.05 rad/s` "calm authority" budget
- No tick marks, no sparklines, no readable labels — all specced in `MOTION-AND-FX-SPEC.md §4`
- No `DepthOfField` or volumetric god-ray pass (mandated FR-LIGHT)

**Preloader (Preloader.tsx)**
- Generic CSS `animation: spin … infinite` spinner
- SPEC §3 (MOTION-AND-FX-SPEC) requires: counter 0→100, **monochrome ring sweep**, **reveal wipe** seeding the HUD motif
- No progress-bound SVG arc, no clip-path wipe, no motif seed

**Three simultaneous WebGL contexts**
`SpaceScene` + hero-backdrop `TelemetryHud` + work-section `TelemetryHud`, each with a full `EffectComposer` (Bloom+Vignette+Noise). Browser GL context limit is 8–16; mobile GPUs evict earlier. `HudFrame` docstring explicitly warns against this; `scene={false}` for the hero backdrop is the fix.

**Glitch-text dead code**
`.glitch-text` has zero CSS rules; `data-text` attribute consumed by no `::before/::after` pseudo-element.

**D-ID / ElevenLabs lip-sync not implemented**
`phase09_avatar_sync.sh` posts a hardcoded `{"latencyMs":180}` to a mock endpoint — not a real D-ID/ElevenLabs round-trip. `TC-FR-CLONE` is FAIL (avatar is `<video muted>` + 2D waveform). No viseme client code exists in `app/components/lib` — only the `services/` scaffold.

**OG image missing**
`twitter.card='summary_large_image'` declared but no `images` array defined, no `og-*` file in `public/`. Every link-share from LinkedIn/Slack/X renders a blank-image card.

***

### 1.4 What Works (Do Not Regress)

| Component | Status | Evidence |
|---|---|---|
| Experience accordion | Correct Framer-Motion `height:auto` | Runtime height == scrollHeight |
| Architecture Map path switching | Interactive, `aria-pressed` correct | Live test confirmed |
| Proof bar count-up | 4 metrics, tabular numerals | `proof.spec` green |
| GSAP ScrollTrigger | Wired in `ScrollRail.tsx` | `scroll.spec` 2✓ |
| FloatingDetailBox lifecycle | Opens, closes via Esc+backdrop, disposes 3D objects cleanly | Scene 10→2, no leak |
| Typography | Inter + Space Grotesk, self-hosted | `typography.spec` 4✓ |
| Service Worker / offline | Core content + CV cached | `durable.spec` 2✓ |
| Security headers | CSP/HSTS/nosniff/XFO/Referrer | `security.spec` 5✓ |
| Mobile layout 320–2560px | No horizontal overflow | `sections.spec` 5 breakpoints green |
| tsc strict | `tsc --noEmit` exits 0 | CI quality job |

***

## Part 2 — Enhancement Roadmap with Benchmark Lift Metrics

Each phase maps to SPEC §10 TCs and the `quality-assurance.md` living register.

### Phase 1 — Foundation Repairs (Benchmark: 5.1 → 6.8)

| Enhancement | TC | Files | Lift |
|---|---|---|---|
| Fix `ExpandableCard` height (About + Skills) | TC-FR-ABOUT / TC-FR-SKILLS | `ExpandableCard.tsx`, `globals.css:847/1650` | +0.6 |
| Add `role="dialog"` + focus trap to `FloatingDetailBox` | TC-NFR-A11Y / OD-1 | `FloatingDetailBox.tsx:601` | +0.3 |
| Add 1200×630 OG image + wire `openGraph.images` | TC-FR-SEO / OD-2 | `app/opengraph-image.tsx`, `app/layout.tsx` | +0.3 |
| Collapse 3 WebGL contexts to 2 (`scene={false}` for hero backdrop) | TC-NFR-FPS / VFX-2 | `app/page.tsx:214` | +0.3 |
| Add `frameloop='demand'` + static fallback to `SpaceScene` on reduced-motion | TC-NFR-A11Y / IV-7 | `SpaceScene.tsx` | +0.2 |

### Phase 2 — VFX Credibility (Benchmark: 6.8 → 7.8)

| Enhancement | TC | Files | Lift |
|---|---|---|---|
| Hero capability modal: foreground canvas above backdrop `z > 10002` so 3D FX are visible | TC-FR-SIGFX / IV-3 | `FloatingDetailBox.tsx`, new `ModalFxCanvas.tsx` | +0.4 |
| Starfield: swap sphere instances for additive point-sprites with radial glow texture; lift layer opacity to 0.7 | TC-NFR-RENDER / VFX-7 | `SpaceScene.tsx` | +0.4 |
| Starfield: add 2-band scroll-proportional depth parallax (far band × 0.3, near × 0.8) | IV-6 | `SpaceScene.tsx:SceneContent` | +0.2 |
| Preloader: progress-bound SVG arc (`stroke-dashoffset = count / 100`), clip-path reveal wipe, HUD ghost seed | TC-FR-BOOT / QT-8 | `Preloader.tsx`, `globals.css` | +0.3 |
| Architecture Map: render `ircle class="flow-dot">` SVG elements with `<animateMotion>` along paths | IV-4 | `ArchitectureMap.tsx`, `globals.css:2452` | +0.2 |
| Glitch-text: implement real `::before/::after` `content:attr(data-text)` clip-path RGB-split on hero entrance | VFX-4 | `globals.css:2043` | +0.1 |

### Phase 3 — JARVIS HUD Cinematic Upgrade (Benchmark: 7.8 → 8.6)

| Enhancement | TC | Files | Lift |
|---|---|---|---|
| HUD: 3 z-separated mesh layers (far grid z=-2, mid ring z=-1, near bezel z=0) | TC-FR-SIGFX / QT-3 | `TelemetryHud.tsx`, `shaders/hud.ts` | +0.3 |
| HUD: discrete graduated tick marks (major compass + fine minor) replacing `fract(r*8)` bands | QT-3 / QT-4 | `shaders/hud.ts:18-47` | +0.2 |
| HUD: sweep speed → `uTime * 0.25 rad/s` (≤0.05 rad/s ring, 0.25 sweep); trailing afterglow + blip dots | QT-4 | `shaders/hud.ts:34` | +0.2 |
| HUD: scrolling Canvas2D sparkline (P95 latency, 10k devices); honest labels | QT-3 / TC-FR-SIGFX | `TelemetryHud.tsx` | +0.2 |
| HUD: `DepthOfField` pass in `EffectComposer` (focus near bezel, blur far grid at half-res) | TC-FR-LIGHT / QT-5 | `TelemetryHud.tsx:121` | +0.2 |
| HUD: volumetric god-ray pass (radial-blur occlusion mask + 8-sample radial blur, half-res) | TC-FR-LIGHT / QT-6 | `shaders/hud.ts:49-74` | +0.2 |
| Gate work-HUD `<Canvas>` behind `IntersectionObserver` (pause when off-screen) | VFX-2 / NFR-FPS | `app/page.tsx:499` | +0.1 |

### Phase 4 — AI Clone Voice + Video Lip-Sync (Benchmark: 8.6 → 9.2)

| Enhancement | TC | API Keys (from `~/.claude/.env.production`) | Lift |
|---|---|---|---|
| ElevenLabs cloned voice: pre-render greeting MP3 using correct voice ID; verify asset hash in test | TC-FR-VOICE / D-1 | `ELEVENLABS_API_KEY` | +0.2 |
| Real-time ElevenLabs WebSocket: audio-packet extraction → buffered playback feeding viseme bridge | TC-FR-CLONE-LIVE | `ELEVENLABS_API_KEY` | +0.2 |
| D-ID Streaming API: consume ElevenLabs speech arrays → frame-accurate lip-sync (≤1 frame / ~40 ms) | TC-FR-CLONE-LIVE / FR-CLONE | `DID_API_KEY` | +0.2 |
| HiggsField video render: real-time video clone rendering synced with ElevenLabs audio | TC-FR-CLONE-LIVE | `HIGGSFIELD_API_KEY` (from env) | +0.2 |
| OpenRouter LLM upgrade for MiniVic tier-1 brain; fix prompt-scaffolding leak in free-text fallback | TC-FR-CHAT / IV-5 | `OPENROUTER_API_KEY` | +0.1 |
| VOICE-DYN: ambient bed + section-triggered ElevenLabs cues via GSAP `ScrollTrigger onEnter` | TC-FR-VOICE-DYN | `ELEVENLABS_API_KEY` | +0.1 |

### Phase 5 — Signature Project Effects Fan-out (Benchmark: 9.2 → 9.5)

| Enhancement | TC | Tech | Lift |
|---|---|---|---|
| WebSocket packet-flow effect (telemetry-server / tesla-api): instanced R3F particles along edges, P95 < 200 ms readout | TC-FR-SIGFX / TC-FR-CATALOG | R3F instanced | +0.1 |
| ATO evidence-harness time-compression bar: 3h → 15min (≈92%), legacy-terminal → pipeline morph | TC-FR-SIGFX / TC-FR-CATALOG | SVG/Canvas | +0.1 |
| Dossier signature motif: `variant="panel"` with `HudFrame` + real label (not 4 invisible corner ticks) | VFX-5 / TC-NN-2 | `Dossier.tsx` | +0.1 |
| Lighthouse mobile perf ≥ 90: verify LCP < 2.5s / TBT < 200ms on `/` in isolated env; address R3F score risk | TC-NFR-PERF / QA-PERF-02 | `lhci`, `phase02_lighthouse.sh` | 0.0 |
| `window.spaceApp` renamed to `window.__portfolioSceneBridge__`; rename `SpaceAppDebugProbe` | OD-4 | `SpaceScene.tsx:355` | 0.0 |

***

## Part 3 — claude-opus-4-8 1M Ultracode Agent MASTER PROMPT

The following is the complete, self-contained execution prompt for the Anthropic claude-opus-4-8 1M Ultracode agent. Paste it verbatim as the agent's initial system/user instruction.

***

```
SYSTEM CONTEXT — FORGOTTEN-MISTORY PORTFOLIO OVERHAUL
═══════════════════════════════════════════════════════
You are operating as an autonomous claude-opus-4-8 1M Ultracode agent with full filesystem,
git, and browser-automation access. Your mission is to overhaul the portfolio site at
  https://forgotten-mistory.web.app/
to a 9.5 / 10 cinematic quality standard matching Marvel Studios / top Fortune-500 C-suite
websites. You are NOT starting from scratch — you are overhauling existing, partially working
code on branch `overhaul/panels-fx-upgrade` in the repo:
  /Users/vic/claude/forgotten-mistory

CREDENTIALS (read-only from env — never log or print):
  ~/.claude/.env.production
  Keys present: ELEVENLABS_API_KEY, DID_API_KEY, HIGGSFIELD_API_KEY, OPENROUTER_API_KEY,
                GEMINI_API_KEY, NEXT_PUBLIC_GEMINI_API_KEY, NEXT_PUBLIC_REALTIME_WS_URL,
                NEXT_PUBLIC_BOOKING_URL

REPO STATE (evidence-based, as of 2026-06-18):
  Branch:     overhaul/panels-fx-upgrade
  tsc:        PASS (strict)
  lint:       PASS
  static-audit: 8/8 (TONE·MONO·PERF·PARITY·TYPE·SEC·ARCH-BENCH·COMPLETE)
  Playwright: 36/36 passed (tests/overhaul, --workers=1)
  Overall QA: ~68% — NOT yet deploy-ready

QUALITY GOVERNANCE RULES (non-negotiable):
  1. No @ts-ignore / eslint-disable / any-cast / // TODO / placeholder / mock data shown as live.
  2. Colours only from lib/palette.ts tokens — no raw hex in components.
  3. Only two font families: Inter (body) + Space Grotesk (display).
  4. Every animated surface has a prefers-reduced-motion static fallback.
  5. ≤2 live WebGL contexts (SpaceScene + one HUD); third context must be scene={false}.
  6. All secrets read server-side only from process.env; fail-loud on missing keys.
  7. No window.Math.random() shown as real telemetry — all readouts must be evidence-sourced
     from docs/Vik_Resume_Final.pdf, siteContent.ts, or real API responses.
  8. No self-approval. PASS = independent check returned PASS.

OPERATING LOOP (mandatory):
  Implement → run tsc → run lint → run audit → run playwright --workers=1 →
  verify outcome with file:line evidence → fix any gap → re-verify → git commit.
  Never commit on a red gate. Parallelize independent sub-tasks via concurrent sub-agents.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 — FOUNDATION REPAIRS  [Benchmark target: 5.1 → 6.8]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASK 1A — Fix ExpandableCard accordion (P0 — About Me + Skills)
──────────────────────────────────────────────────────────────
Files:   components/site/ExpandableCard.tsx:31-49
         app/globals.css:830-836, 847-849, 1642-1653
Root cause: .snap-body / .skill-body { height:0; overflow:hidden } — the open state
only sets opacity:1, never sets height. The Framer-Motion height:auto pattern from
ExperienceAccordion.tsx:48-56 is the proven fix.

IMPLEMENT:
  1. In ExpandableCard.tsx, replace the class-toggle pattern with Framer Motion:
       import { AnimatePresence, motion } from 'framer-motion';
       Wrap body content in:
         <AnimatePresence>
           {open && (
             <motion.div
               key="body"
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               transition={{ duration: 0.36, ease: [0.22,1,0.36,1] }}
               style={{ overflow: 'hidden' }}
             >
               {children}
             </motion.div>
           )}
         </AnimatePresence>
  2. Remove the height:0 / height:auto CSS rules from globals.css for
     .snap-body and .skill-body (keep only opacity and padding transitions).
  3. Keep aria-expanded="true/false" on the trigger button.

TEST (write before implementing — TDD):
  tests/overhaul/accordions.spec.ts
    - Click first snap-card button
    - Expect body element toBeBoundingBox().height > 0  (not just toContainText)
    - Click again, expect height → 0
    - Run with prefers-reduced-motion: ensure open state is still visible (instant)
  Both About Me (4 cards) and Skills (≥1 card) must pass.

VERIFY: npx playwright test tests/overhaul/accordions.spec.ts --workers=1
COMMIT: "fix(accordion): Framer-Motion height:auto fixes About+Skills expand (IV-1/IV-2)"

─────────────────────────────────────────────────────────────
TASK 1B — Accessible dialog on hero capability modal
─────────────────────────────────────────────────────────────
File: components/FloatingDetailBox.tsx:601

IMPLEMENT:
  On the outer container div when open:
    role="dialog"
    aria-modal="true"
    aria-labelledby="detail-title"
  Add id="detail-title" to the capability heading.
  On mount (when locked=true): move focus to the close button.
    useEffect(() => { if (locked) closeButtonRef.current?.focus(); }, [locked]);
  Focus trap: intercept Tab and Shift+Tab to cycle within the modal.
    Use the existing HiddenTerminal.tsx:154 role="dialog" pattern as reference.
  Close button: add aria-label="Close capability detail".

TEST: extend tests/overhaul/a11y.spec.ts
  - Open a capability card
  - Expect document.activeElement to be the close button
  - Tab through: focus stays inside modal
  - Escape closes: modal unmounts, focus returns to trigger

COMMIT: "fix(a11y): role=dialog + focus-trap on FloatingDetailBox (OD-1)"

─────────────────────────────────────────────────────────────
TASK 1C — OG / Twitter image
─────────────────────────────────────────────────────────────
File: app/opengraph-image.tsx (create new), app/layout.tsx

IMPLEMENT:
  1. Create app/opengraph-image.tsx using Next.js ImageResponse (1200×630):
     - Black (#0A0B0D) background
     - "VIKRAM SARKAR" in Space Grotesk 72px white
     - "AI Engineering · Cloud · Program Delivery" in Inter 36px slate
     - Faint HUD ring motif (CSS radial-gradient) top-right
     - No image files > 500 KB; keep the JSX-only ImageResponse approach
  2. In app/layout.tsx, add to metadata.openGraph.images and metadata.twitter.images.
  3. Add image to Person JSON-LD schema.

TEST: extend tests/overhaul/seo.spec.ts
  - Expect page to have og:image meta tag
  - Expect og:image URL to return 200

COMMIT: "feat(seo): OG image 1200×630 + Person JSON-LD image (OD-2)"

─────────────────────────────────────────────────────────────
TASK 1D — Collapse to ≤2 WebGL contexts
─────────────────────────────────────────────────────────────
File: app/page.tsx:214

IMPLEMENT:
  Change the hero-backdrop HudFrame from:
    <HudFrame variant="backdrop" scene={true} ... />
  to:
    <HudFrame variant="backdrop" scene={false} ... />
  This keeps the bezel/CSS echo (the visual motif) without mounting a 3rd R3F Canvas.
  Verify HudFrame renders correctly with scene={false} (Dossier.tsx:36 already does this).

TEST: extend tests/overhaul/signature.spec.ts
  - Assert canvas count === 2 (not ≥2)
  - Assert no WebGL context limit warnings in console

COMMIT: "perf(webgl): collapse hero-backdrop to scene={false} — 3→2 GL contexts (VFX-2)"

─────────────────────────────────────────────────────────────
TASK 1E — SpaceScene reduced-motion static fallback
─────────────────────────────────────────────────────────────
File: app/components/SpaceScene.tsx

IMPLEMENT:
  The existing `frozen` state is already set when prefers-reduced-motion=reduce.
  Pass `frozen` into SceneContent (it is already a prop but unused).
  In every useFrame inside SceneContent:
    if (frozen) return;
  In SceneContent's CameraRig: already gated (!frozen && <CameraRig />).
  Also: set frameloop={frozen ? 'demand' : 'always'} on <Canvas> (already present
  for the outer Canvas but verify SceneContent hooks respect it).

TEST: extend tests/overhaul/reduced-motion.spec.ts
  - Emulate prefers-reduced-motion: reduce
  - Navigate to page
  - Assert starfield Canvas exists but frameloop attribute is 'demand'
  - Assert no rAF activity > 1 fps (measure via performance.now() sampling)

COMMIT: "fix(a11y): SpaceScene useFrame frozen guard — reduced-motion static (IV-7)"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2 — VFX CREDIBILITY  [Benchmark target: 6.8 → 7.8]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASK 2A — Hero modal 3D FX: render in foreground canvas above backdrop
──────────────────────────────────────────────────────────────────────
Files: components/FloatingDetailBox.tsx, new components/fx/ModalFxCanvas.tsx
Root cause: FX added to window.spaceApp.scene (z-low, opacity:0.42, dimmed further
to 0.35 on body.detail-open) then buried under bg-black/82 backdrop.

IMPLEMENT:
  1. Create components/fx/ModalFxCanvas.tsx:
       'use client';
       // Dedicated foreground R3F canvas for FloatingDetailBox particle burst.
       // Mounted at z- (above the modal at z-), alpha:true,
       // pointer-events:none, position:fixed inset-0.
       // Receives a `trigger: boolean` prop; on trigger → play the materialise
       // burst (port the existing burst logic from FloatingDetailBox lines
       // ~450-600 into this component's useEffect/useFrame).
       // On !trigger: renders null (Canvas unmounts, no GL cost when closed).
       export default function ModalFxCanvas({ trigger, capabilityKey }: Props)
  2. In FloatingDetailBox.tsx:
       - Remove all window.spaceApp injection (the IPC bridge approach)
       - Mount <ModalFxCanvas trigger={locked} capabilityKey={activeKey} />
         at the same portal level as the modal (or as a sibling above it)
       - Reduce modal backdrop from bg-black/82 to bg-black/40 (scrim only)
         so the HUD starfield also becomes partially visible through the modal
  3. CSS: .modal-fx-canvas { position:fixed; inset:0; z-index:10003;
          pointer-events:none; }

TEST: extend tests/overhaul/modal-fx.spec.ts
  - Open a capability card
  - Take a screenshot
  - Assert the particle burst canvas exists and is visible (not occluded)
  - Pixel-diff: at least N pixels deviate from solid black in the canvas region

COMMIT: "feat(fx): ModalFxCanvas foreground burst — visible above backdrop (IV-3)"

─────────────────────────────────────────────────────────────
TASK 2B — Cinematic starfield: point-sprites + depth parallax
─────────────────────────────────────────────────────────────
File: app/components/SpaceScene.tsx

IMPLEMENT (StarField component):
  1. Replace instancedMesh + sphereGeometry approach with THREE.Points +
     THREE.BufferGeometry + custom point-sprite shader:
       const spriteMaterial = new THREE.PointsMaterial({
         size: 0.3,
         map: glowTexture,  // radial glow canvas texture (white center, fade to transparent)
         sizeAttenuation: true,
         blending: THREE.AdditiveBlending,
         transparent: true,
         depthWrite: false,
         vertexColors: true,
       });
     Generate glowTexture once with Canvas2D (256×256, radialGradient white→transparent).
  2. Split stars into 2 depth bands in the useMemo:
       band0 (2000 stars): z range -40 to -110  (near band)
       band1 (2500 stars): z range -110 to -220 (far band)
     In useFrame, apply scroll parallax per-band:
       const scroll = scrollRef.current;
       band0Group.position.y = -scroll * 0.0008;  // near moves faster
       band1Group.position.y = -scroll * 0.0003;  // far moves slower
  3. Lift layer opacity: .space-scene-layer { opacity: 0.72 } in globals.css
     (from current 0.42). Adjust nebula colors if needed to prevent blow-out.
  4. Keep the mulberry32 seeded RNG — no Math.random() in production star positions.

TEST: extend tests/overhaul/starfield.spec.ts
  - Assert SpaceScene canvas is mounted
  - Assert layer opacity is ≥ 0.6 (computed style)
  - Scroll 500px; assert a data attribute or CSS var reflects parallax offset
    (instrument SceneContent to expose scrollRef.current on a data-scroll attr)

COMMIT: "feat(fx): point-sprite bokeh stars + 2-band scroll parallax (IV-6, QT-7)"

─────────────────────────────────────────────────────────────
TASK 2C — Cinematic preloader: progress-arc + wipe + HUD seed
─────────────────────────────────────────────────────────────
File: components/site/Preloader.tsx, app/globals.css

IMPLEMENT:
  Replace the CSS spinner with:
  1. SVG arc preloader:
       <svg viewBox="0 0 200 200" className="preloader-ring">
         ircle className="preloader-track" cx="100" cy="100" r="88"
                 fill="none" stroke="var(--ink-500)" strokeWidth="2" />
         ircle className="preloader-arc" cx="100" cy="100" r="88"
                 fill="none" stroke="var(--white)" strokeWidth="2"
                 strokeDasharray={2 * Math.PI * 88}
                 strokeDashoffset={2 * Math.PI * 88 * (1 - count / 100)}
                 strokeLinecap="round"
                 style={{ transform: 'rotate(-90deg)', transformOrigin: 'center',
                          transition: 'stroke-dashoffset 0.04s linear' }} />
       </svg>
  2. Count display: large tabular numeral in the ring centre.
  3. HUD ghost motif: a faint concentric ring (2px, opacity:0.15) behind the arc
     that matches the TelemetryHud ring geometry — seeds the signature visual.
  4. On done (count===100): clip-path reveal wipe:
       @keyframes reveal-wipe {
         from { clip-path: inset(0 100% 0 0); }
         to   { clip-path: inset(0 0% 0 0); }
       }
       Apply to main content wrapper on .preloader-done class.
  5. Reduced-motion branch: instantly show count=100 + fade (existing Preloader.tsx:73).

TEST: extend tests/overhaul/boot.spec.ts (existing)
  - Assert .preloader-arc has stroke-dashoffset changing over time (screenshot diff)
  - Assert reveal wipe class is applied
  - Assert HUD ghost element is present in DOM

COMMIT: "feat(preloader): progress-arc + clip-path reveal wipe + HUD motif seed (QT-8)"

─────────────────────────────────────────────────────────────
TASK 2D — Architecture Map: SVG flow-dot particles
─────────────────────────────────────────────────────────────
File: components/site/ArchitectureMap.tsx

IMPLEMENT:
  For each active path, render an animated circle traversing it:
    ircle className="flow-dot active">
      <animateMotion dur="2s" repeatCount="indefinite" keyPoints="0;1"
                     keyTimes="0;1" calcMode="linear">
        <mpath xlinkHref={`#path-${activeLayer}`} />
      </animateMotion>
    </circle>
  CSS in globals.css (replace the orphaned .flow-dot rules):
    .flow-dot { r: 3; fill: var(--white); opacity: 0; }
    .flow-dot.active { opacity: 0.8; filter: drop-shadow(0 0 4px var(--white)); }
  Render 2-3 offset dots (keyPoints staggered at 0/0.33/0.66) for density.
  Reduced-motion: remove animateMotion, show static dot at path midpoint.

TEST: extend tests/overhaul/architecture.spec.ts
  - Click each path button
  - Assert at least one .flow-dot.active is present in the SVG
  - Assert the dot has animateMotion child

COMMIT: "feat(viz): Architecture Map SVG flow-dot particles (IV-4)"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3 — JARVIS HUD CINEMATIC UPGRADE  [Benchmark: 7.8 → 8.6]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASK 3A — Z-layered holo-rings with tick marks
──────────────────────────────────────────────
Files: components/fx/TelemetryHud.tsx, components/fx/shaders/hud.ts

IMPLEMENT:
  Replace the single-plane HUD with 3 z-separated meshes:
  Layer 0 — Far grid (z = -2):
    ShaderMaterial: thin concentric rings (5 rings, radii 0.2–0.9), opacity 0.08.
    Faint Cartesian crosshair lines. Slow rotation 0.01 rad/s.
  Layer 1 — Mid ring (z = -1):
    ShaderMaterial: 2 bold concentric rings (r=0.5, r=0.8), thickness 0.004.
    32 major tick marks (2px length, evenly spaced) + 128 minor ticks (0.5px).
    Sweep wedge: uTime * 0.25 rad (not 1.2 — fix QT-4). Trailing glow ~15 deg.
    Blip dot at sweep tip: brightens as sweep passes.
  Layer 2 — Near bezel (z = 0):
    ShaderMaterial: outer ring at r=0.95, 4 compass labels (N/E/S/W equiv).
    2 gauge arcs (CPU/memory or latency/throughput, 90-degree arcs).
    Text: DOM overlay (not WebGL) for crisp labels — absolutely positioned
    <div> anchored to gauge arc endpoints via CSS custom properties.

  All stroke colours: PALETTE.white / PALETTE.steel / PALETTE.ink700 — no raw hex.

SHADERS (hud.ts):
  Update holoRingFragment to accept uniforms:
    uSweepAngle: float  // replaces uTime*1.2 with uTime*0.25
    uTickCount: int     // 32 major / 128 minor
    uLayerAlpha: float  // per-layer control
  Implement tick marks in GLSL:
    float angle = atan(centered.y, centered.x);
    float tickRad = fract(angle / (TWO_PI / float(uTickCount)));
    float tick = step(0.96, tickRad) * smoothstep(0.85, 0.9, r) * ...; 

TEST: extend tests/overhaul/hud.spec.ts
  - Assert TelemetryHud canvas renders (existing)
  - Assert sweep speed is ≤ 0.3 rad/s (measure angle change over 1s via
    instrumenting a uSweepAngle output data-attr or screenshot diff)
  - Assert 3 mesh children in the scene (layer count)

COMMIT: "feat(hud): 3-layer z-separated holo-rings + tick marks (QT-3, QT-4)"

─────────────────────────────────────────────────────────────
TASK 3B — Canvas2D sparkline + gauge labels
─────────────────────────────────────────────────────────────
Files: components/fx/TelemetryHud.tsx

IMPLEMENT:
  Add a Canvas2D overlay for the sparkline (off-screen CanvasTexture, ~30 Hz update):
    - Create a 256×64 CanvasRenderingContext2D
    - Ring-buffer of last 80 latency values seeded from siteContent
      (not Math.random — use the evidence-sourced values: P95 < 200ms base,
       occasional spikes to ~180ms, then easing back)
    - Draw as a line chart: white on #0A0B0D, anti-aliased
    - Label in the DOM overlay: "P95 LATENCY · 10k DEVICES (DEMO)"
    - Convert to CanvasTexture, update every ~33ms; attach to a plane mesh
      positioned below the main HUD ring

TEST: assert sparkline CanvasTexture mesh is present in HUD scene;
      assert the texture pixels are not all black (spot-check a pixel)

COMMIT: "feat(hud): Canvas2D sparkline + gauge labels (QT-3)"

─────────────────────────────────────────────────────────────
TASK 3C — DepthOfField + volumetric god-ray pass
─────────────────────────────────────────────────────────────
Files: components/fx/TelemetryHud.tsx:121-123, components/fx/shaders/hud.ts:49-74

IMPLEMENT — DepthOfField:
  In TelemetryHud.tsx EffectComposer, add:
    import { DepthOfField } from '@react-three/postprocessing';
    <DepthOfField
      focusDistance={0.0}        // focus near bezel (z=0)
      focalLength={0.04}
      bokehScale={2.0}
      height={480}               // half-res
    />
  Gate: only when enablePostFx && !frozen (same guard as Bloom/Vignette).
  This blurs the far grid (z=-2) while keeping the bezel sharp — achieves
  the "foreground HUD, blurred field" depth of MOTION-AND-FX-SPEC §2.

IMPLEMENT — Volumetric god-ray:
  Replace the flat 2D cone in lightShaftFragment (hud.ts:49-74) with a
  radial-blur technique:
    1. Render the light source (top-centre of HUD) into an occlusion mask
       (simple: white circle on black at the light position)
    2. In lightShaftFragment, sample along radial rays from light position
       outward, accumulating occlusion mask samples (8 samples, decaying
       weight):
         vec2 dir = (uv - lightPos) / float(NUM_SAMPLES);
         float accumLight = 0.0;
         for (int i = 0; i < NUM_SAMPLES; i++) {
           vec2 sampleUV = uv - dir * float(i);
           accumLight += texture2D(occlusionMask, sampleUV).r
                         * pow(DECAY, float(i));
         }
         gl_FragColor = vec4(vec3(accumLight * WEIGHT), 1.0);
    3. Cap NUM_SAMPLES=8, DECAY=0.93, half-res FBO.
    4. Disabled on reduced-motion / low-power (same flag as DoF).

TEST: extend tests/overhaul/hud.spec.ts
  - Assert DepthOfField is present in EffectComposer children
  - Assert lightShaftFragment includes the radial loop (source code grep)

COMMIT: "feat(hud): DepthOfField + volumetric god-ray pass (QT-5, QT-6, FR-LIGHT)"

─────────────────────────────────────────────────────────────
TASK 3D — IntersectionObserver gate on work-section HUD
─────────────────────────────────────────────────────────────
File: app/page.tsx:499

IMPLEMENT:
  Wrap the work-section <HudFrame> in a custom hook:
    const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 });
    ...
    <div ref={ref}>
      {isVisible && <HudFrame ... />}
    </div>
  This ensures the R3F canvas + EffectComposer for the work HUD only mounts
  when scrolled into view (SPEC §7 "pause off-screen").
  Also pause SpaceScene when tab hidden:
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) setFrozen(true);
      else setFrozen(false);
    });

COMMIT: "perf(webgl): IntersectionObserver gate on work-HUD + tab-hide pause (VFX-2)"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 4 — AI CLONE: VOICE + VIDEO LIP-SYNC  [Benchmark: 8.6 → 9.2]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

READ ~/.claude/.env.production BEFORE beginning this phase.
Extract: ELEVENLABS_API_KEY, DID_API_KEY, HIGGSFIELD_API_KEY, OPENROUTER_API_KEY.
NEVER log or echo these values. Use them only in server-side API routes.

TASK 4A — ElevenLabs cloned voice: pre-rendered greeting
─────────────────────────────────────────────────────────
Files: services/api-gateway/*, public/assets/, app/api/voice/

IMPLEMENT:
  1. In services/api-gateway/src/routes/voice.ts:
       POST /voice/prerender
       Calls ElevenLabs TTS API with the correct voice ID (from ELEVENLABS_API_KEY env).
       Saves output MP3 to public/assets/greeting-cloned.mp3.
       Voice ID is stored in ELEVENLABS_VOICE_ID env var (add to .env.example).
  2. Run the pre-render script once: node scripts/build/prerender_voice.mjs
     This produces public/assets/greeting-cloned.mp3.
  3. In MiniVicBot.tsx: update greeting audio src to use greeting-cloned.mp3.
  4. Verify voice-id in test (asset hash or metadata check).

TEST: tests/overhaul/voice.spec.ts (new)
  - GET /assets/greeting-cloned.mp3 → 200 (correct MIME)
  - Assert filesize is > 10KB (not empty/placeholder)
  - Assert voice metadata includes the expected voice ID hash

COMMIT: "feat(voice): ElevenLabs cloned-voice greeting MP3 pre-rendered (TC-FR-VOICE)"

─────────────────────────────────────────────────────────────
TASK 4B — Live D-ID + ElevenLabs real-time lip-sync
─────────────────────────────────────────────────────────────
Files: services/api-gateway/src/routes/realtime.ts
       app/api/realtime/session/route.ts
       components/MiniVicBot.tsx
       lib/viseme/smoother.ts (create)

IMPLEMENT:
  The live path is behind NEXT_PUBLIC_REALTIME_WS_URL (only active on VPS deployment).

  Server (services/api-gateway):
  1. POST /realtime/session:
       - Creates a D-ID Streaming session (DID_API_KEY)
       - Returns { sessionId, iceServers, sdpOffer }
  2. WS /realtime/stream:
       - Accepts ElevenLabs PCM audio packets from the client
       - Forwards to D-ID stream_id endpoint
       - Returns viseme events + video frames back over WS

  Viseme smoother (lib/viseme/smoother.ts):
  3. Implement a basic RTAS (Real-Time Averaging Smoother):
       export function smoothVisemes(rawVisemes: DIDVisemeEvent[]): SmoothViseme[] {
         // Lerp between consecutive viseme weights over 40ms windows
         // Ensures ≤1 frame (~40ms) lip-sync drift
       }

  Client (MiniVicBot.tsx):
  4. When NEXT_PUBLIC_REALTIME_WS_URL is defined:
       - Open WebSocket to the gateway
       - Stream MiniVic TTS audio (ElevenLabs SDK, streaming mode)
       - Apply smoother.smoothVisemes() to incoming viseme events
       - Drive a morph-target or CSS-based mouth animation on the avatar
  5. Static fallback (no WS URL): pre-rendered MP4 + greeting-cloned.mp3.

  HiggsField integration (if DID_API_KEY unavailable or trial exhausted):
  6. Alternative video render path via HIGGSFIELD_API_KEY:
       POST https://api.higgsfield.ai/v1/render
       Body: { audioUrl, characterId, lipSync: true }
       Poll for render completion, cache result in public/assets/
     Use as a fallback: try D-ID first, then HiggsField.

TEST: tests/overhaul/clone.spec.ts (new)
  Static path:
    - Open MiniVic panel
    - Assert avatar video element is present with src ≠ empty
    - Assert greeting audio plays (or is available for play)
  Lip-sync assertion (mock WS in test):
    - Inject a mock WS server returning fake viseme events
    - Assert mouth animation CSS var changes in response

COMMIT: "feat(clone): D-ID+ElevenLabs real-time lip-sync + HiggsField fallback (TC-FR-CLONE-LIVE)"

─────────────────────────────────────────────────────────────
TASK 4C — MiniVic free-text scaffolding leak fix
─────────────────────────────────────────────────────────────
Files: lib/miniVicBrain.ts, components/MiniVicBot.tsx

ROOT CAUSE: The offline/degraded fallback emits its internal formatting rubric
("2-5 sentences? Yes (3 sentences). * No bullet lists") as visible text when
an unmatched query triggers the fallback template path.

IMPLEMENT:
  1. In miniVicBrain.ts, ensure the fallback chain returns only content strings,
     never the instruction template wrapper.
  2. Add a sanitisation step:
       const RUBRIC_LEAK_PATTERN = /\d[-–]\d sentences|No bullet|formatting:/i;
       if (RUBRIC_LEAK_PATTERN.test(response)) {
         return getKBFallback(intent) ?? DEFAULT_CANNED_RESPONSE;
       }
  3. Add a specific KB entry for "AI stack" / "tech stack" queries.

TEST: tests/overhaul/minivic.spec.ts (new/extend)
  - Send free-text query "What is your AI stack?"
  - Assert response does not contain "2-5 sentences", "No bullet lists",
    or any string matching RUBRIC_LEAK_PATTERN
  - Assert response contains at least 20 characters of content

COMMIT: "fix(chat): sanitise formatting-rubric leak in MiniVic fallback path (IV-5)"

─────────────────────────────────────────────────────────────
TASK 4D — Dynamic voiceover: ambient + section-triggered cues
─────────────────────────────────────────────────────────────
Files: lib/voiceover.ts (create), app/page.tsx, lib/gsap.ts

IMPLEMENT:
  1. lib/voiceover.ts: a lightweight state machine
       type VoiceoverState = 'idle' | 'ambient' | 'playing' | 'muted';
       export class VoiceoverController {
         play(cue: 'hero' | 'experience' | 'work' | 'contact'): void;
         duck(): void;     // lower ambient during cue
         mute(): void;
         get isMuted(): boolean;
       }
  2. Pre-generate ElevenLabs cued audio files for 4 sections using Task 4A's
     voice-render service:
       public/assets/cue-hero.mp3
       public/assets/cue-experience.mp3
       public/assets/cue-work.mp3
       public/assets/cue-contact.mp3
  3. In ScrollRail.tsx or app/page.tsx, wire to GSAP ScrollTrigger onEnter:
       gsap.timeline({
         scrollTrigger: { trigger: '#experience', onEnter: () =>
           voiceover.play('experience') }
       });
  4. Ambient bed: loop public/assets/ambient.mp3 at volume 0.08.
     Duck to 0.02 when a cue plays; restore after cue ends.
  5. Respect: global mute toggle, prefers-reduced-motion (skip all audio),
     autoplay policy (require user gesture before first play).

TEST: extend tests/overhaul/voice.spec.ts
  - Scroll to #experience
  - Assert audio element with src=cue-experience.mp3 begins playing
    (or has been triggered — check play() call via spy)

COMMIT: "feat(voice): dynamic voiceover — ambient + section-triggered cues (TC-FR-VOICE-DYN)"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 5 — SIGNATURE EFFECTS FAN-OUT  [Benchmark: 9.2 → 9.5]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASK 5A — WebSocket packet-flow effect (telemetry-server / tesla-api)
──────────────────────────────────────────────────────────────────────
Files: components/fx/PacketFlow.tsx (create), app/page.tsx (wire to #work)

IMPLEMENT:
  R3F instanced particles travelling along the edges of a directed graph:
  - Graph: 6 nodes (INGRESS → ROUTER → WORKER ×3 → SINK)
  - Each edge has 3-5 instanced "packet" spheres (r=0.05) moving at different speeds
  - On edge entry: flash a brief glow (Bloom picks it up)
  - "P95 < 200 ms · 10k DEVICES (DEMO)" readout: Canvas2D texture updated at 5 Hz
    with smoothly easing values around 180-195ms (sourced from siteContent proofMetrics)
  - Pause off-screen (IntersectionObserver)
  - Reduced-motion: static graph image (screenshot the static frame)

COMMIT: "feat(fx): WebSocket packet-flow effect — telemetry-server #work (FR-SIGFX)"

─────────────────────────────────────────────────────────────
TASK 5B — ATO evidence-harness time-compression bar
─────────────────────────────────────────────────────────────
Files: components/fx/AtoEvidenceBar.tsx (create)

IMPLEMENT:
  SVG/Canvas animated bar:
  1. Two panels side-by-side:
       LEFT: "LEGACY · 3h 12m · 143 SCENARIOS" (phosphor green text on #0A0B0D)
       RIGHT: "AUTOMATED PIPELINE · 15 min · 143 SCENARIOS (≈92% reduction)"
  2. On in-view: animate a progress bar collapsing from 100% to 8% over 2.4s
     with 143 tick marks (each scenario) lighting up and settling.
  3. A "legacy terminal" → "pipeline" morph: the LEFT panel's border-radius
     and text style transitions to the RIGHT panel's style.
  4. All text/metrics must match docs/Vik_Resume_Final.pdf exactly.
  5. Reduced-motion: show final state immediately.

COMMIT: "feat(fx): ATO evidence-harness time-compression effect (FR-SIGFX)"

─────────────────────────────────────────────────────────────
TASK 5C — Dossier signature motif
─────────────────────────────────────────────────────────────
File: components/site/Dossier.tsx:36

IMPLEMENT:
  Change scene={false} + variant="backdrop" to:
    <HudFrame variant="panel" label="VIKRAM SARKAR · DOSSIER" />
  This renders the actual HUD bezel + label without a 4th GL context.
  Size: compact (120px), positioned top-right of the dossier card.

COMMIT: "fix(dossier): HudFrame variant=panel — visible signature motif (VFX-5)"

─────────────────────────────────────────────────────────────
TASK 5D — window.spaceApp bridge rename
─────────────────────────────────────────────────────────────
File: app/components/SpaceScene.tsx:355-381

IMPLEMENT:
  Rename window.spaceApp → window.__portfolioSceneBridge__ throughout.
  Rename SpaceAppBridge (the component was named SpaceAppDebugProbe in comments).
  Add JSDoc: /** @internal IPC bridge between SpaceScene and ModalFxCanvas */

COMMIT: "refactor(fx): rename window.spaceApp → __portfolioSceneBridge__ (OD-4)"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST-PHASE: FULL VERIFICATION CYCLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After all phases, run the full independent verification chain:

STEP V1 — TypeScript & lint
  cd /Users/vic/claude/forgotten-mistory
  npx tsc --noEmit  # must exit 0
  npm run lint       # must exit 0 with 0 warnings

STEP V2 — Static audit
  node scripts/validate/overhaul_static_audit.mjs
  # must report 8/8 (all checks PASS)

STEP V3 — Full Playwright suite
  npx playwright test tests/overhaul --workers=1
  # must report 0 failures

STEP V4 — Lighthouse mobile
  npm run build:static
  npx serve out/ -p 9000 &
  npx lhci autorun --config=lighthouserc.json
  # must pass: perf≥90, a11y≥95, bp≥95, seo≥95, LCP<2.5s, CLS<0.05

STEP V5 — Visual regression baselines
  npx playwright test tests/visual --update-snapshots
  # capture new baselines for: hero, hud, preloader, starfield, accordions

STEP V6 — Production deploy
  npm run build:static
  firebase deploy --only hosting
  # post-deploy: run SPEC §12 runbook against https://forgotten-mistory.web.app/
  # Verify: CV PDF 200; console 0 errors; JSON-LD; voice; lip-sync; axe; offline

STEP V7 — Update quality-assurance.md
  Update every touched TC row in docs/overhaul/quality-assurance.md.
  Append changelog row §8 with date, HEAD SHA, tasks, new VERIFIED TCs, final benchmark.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIREMENTS TRACEABILITY MATRIX (RTM)
Every enhancement maps to a SPEC §10 TC and a benchmark lift target.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 1 (5.1 → 6.8):
  1A: TC-FR-ABOUT, TC-FR-SKILLS → benchmark +0.6 (broken accordions fixed)
  1B: TC-NFR-A11Y → +0.3 (accessible dialog)
  1C: TC-FR-SEO → +0.3 (OG image)
  1D: TC-NFR-FPS → +0.3 (3→2 WebGL contexts)
  1E: TC-NFR-A11Y → +0.2 (reduced-motion freeze)

Phase 2 (6.8 → 7.8):
  2A: TC-FR-SIGFX → +0.4 (modal FX visible)
  2B: TC-NFR-RENDER → +0.4 (cinematic starfield)
  2C: TC-FR-BOOT → +0.3 (preloader motif)
  2D: TC-FR-CATALOG → +0.2 (architecture map interactive)
  2E: TC-NFR-RENDER → +0.1 (glitch-text real)

Phase 3 (7.8 → 8.6):
  3A: TC-FR-SIGFX, TC-FR-SHADER → +0.3+0.2 (HUD layers + ticks)
  3B: TC-FR-SIGFX → +0.2 (sparkline + labels)
  3C: TC-FR-LIGHT → +0.2+0.2 (DoF + god-ray)
  3D: TC-NFR-FPS → +0.1 (IO gate)

Phase 4 (8.6 → 9.2):
  4A: TC-FR-VOICE → +0.2 (cloned voice)
  4B: TC-FR-CLONE-LIVE → +0.2+0.2 (D-ID + HiggsField)
  4C: TC-FR-CHAT → +0.1 (scaffolding leak fix)
  4D: TC-FR-VOICE-DYN → +0.1 (section cues)

Phase 5 (9.2 → 9.5):
  5A: TC-FR-SIGFX → +0.1 (packet-flow)
  5B: TC-FR-SIGFX → +0.1 (ATO bar)
  5C: TC-NN-2 → +0.1 (dossier motif)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUB-AGENT DELEGATION MAP (run Phases 1-3 in parallel where possible)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sub-Agent A (VFX / GLSL / WebGL):
  Tasks: 2A, 2B, 2D, 3A, 3B, 3C, 3D, 5A, 5B
  Files: SpaceScene.tsx, TelemetryHud.tsx, shaders/hud.ts,
         FloatingDetailBox.tsx, ArchitectureMap.tsx, PacketFlow.tsx, AtoEvidenceBar.tsx

Sub-Agent B (Clone / Voice / ElevenLabs):
  Tasks: 4A, 4B, 4C, 4D
  Files: MiniVicBot.tsx, lib/miniVicBrain.ts, lib/voiceover.ts,
         services/api-gateway/src/routes/realtime.ts,
         app/api/realtime/session/route.ts, lib/viseme/smoother.ts
  Requires: ~/.claude/.env.production (ELEVENLABS_API_KEY, DID_API_KEY, HIGGSFIELD_API_KEY)

Sub-Agent C (Structural / Foundation):
  Tasks: 1A, 1B, 1C, 1D, 1E, 2C, 5C, 5D
  Files: ExpandableCard.tsx, FloatingDetailBox.tsx, Preloader.tsx,
         app/layout.tsx, app/opengraph-image.tsx, Dossier.tsx,
         globals.css, app/page.tsx

Sub-Agent D (QA / Independent Verification):
  Tasks: V1–V7 (runs after each phase, never in parallel with agent edits)
  Files: tests/overhaul/**, scripts/validate/**, docs/overhaul/quality-assurance.md
  Rule: This agent NEVER modifies source code — only tests and docs.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HARD RULES (violations block commit and require re-work)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FORBIDDEN:
  @ts-ignore  @ts-expect-error  eslint-disable  any-cast
  // TODO  // FIXME  // HACK  // rest of code  placeholder
  Math.random() for visible data  hardcoded hex colours
  new files when extending an existing one suffices
  self-approval ("this looks good" without an independent check)
  pushing to main before all V1-V5 steps pass

REQUIRED on every PR/commit:
  tsc --noEmit → 0
  lint → 0 warnings
  static-audit → 8/8
  playwright tests/overhaul --workers=1 → 0 failures
  file:line evidence in commit body for every change

PERFORMANCE BUDGETS (non-negotiable):
  ≤2 live WebGL contexts at any time
  ≥55 FPS desktop / ≥30 FPS mobile on all signature scenes
  First-view payload ≤2.5 MB
  LCP < 2.5s (mobile, throttled)
  CLS < 0.05
  All SpaceScene particle loops: O(n) updates, no per-frame allocation
  CanvasTexture sparkline: update at ≤30 Hz
  God-ray pass: 8 samples, half-res FBO, disabled on low-power/reduced-motion
  DepthOfField: height=480 (half-res), disabled on low-power/reduced-motion

MONOCHROME DISCIPLINE:
  All colours from lib/palette.ts tokens only.
  No raw rgb(), rgba(), hsl(), or #hex in components/** or app/**
  Exception: GLSL uniforms receive THREE.Color instances constructed from palette tokens.

END OF MASTER PROMPT
═══════════════════════════════════════════════════════════════
```

***

## Part 4 — Metric-Driven Benchmark Ladder

| Milestone | Event | Benchmark /10 |
|---|---|---|
| **Baseline (now)** | Current state per independent audit | **5.1** |
| After Phase 1 | Foundation repairs: accordions, a11y, OG, 2 WebGL contexts, reduced-motion | **6.8** |
| After Phase 2 | VFX credibility: modal FX visible, cinematic starfield, preloader arc, flow-dots | **7.8** |
| After Phase 3 | JARVIS HUD cinematic: 3 layers, ticks, sparkline, DoF, god-ray | **8.6** |
| After Phase 4 | AI clone: cloned voice, D-ID lip-sync, HiggsField fallback, VOICE-DYN | **9.2** |
| After Phase 5 | Signature effects fan-out: packet-flow, ATO bar, dossier motif | **9.5** |

***

## Part 5 — Employer/Client Centricity Assessment

The SPEC correctly identifies two audiences. Current state and required enhancements per audience:

**Employer (Technical Executive / Apple/Tesla VP archetype)**
- Currently missing: visible interactive proof of the JARVIS / multi-agent work (HUD is flat, accordions broken)
- Required: About Me accordion showing career objective + delivery impact, visible HUD with real metrics, ATO time-compression visual, interactive Architecture Map with flow dots
- Benchmark pre/post: 4.5 → 9.0 for employer signal strength

**Business Client (global delivery / consulting evaluation)**
- Currently missing: MiniVic free-text reliability, lip-synced clone demo, engagement CTA with a live booking URL
- Required: cloned voice greeting, real-time lip-sync, packet-flow effect showing P95 < 200ms across 10k devices
- Benchmark pre/post: 5.0 → 9.2 for client trust / conversion signal

The dual-pillar CTA structure is already test-verified (hero.spec); the enhancement priority is making every section's content *actually visible* (accordions, VFX) and the AI clone *actually functional* (voice + lip-sync).