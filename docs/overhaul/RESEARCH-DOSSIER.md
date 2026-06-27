# RESEARCH DOSSIER: Three.js Portfolio Overhaul (Disney+/Marvel Inspired)

> **Stage 1 of 5** — Researcher output for the Forgotten-Mistory UI/UX overhaul.
> **Status:** Complete ✓
> **Date:** 2026-06-27
> **Source spec:** `docs/prompt.md` (R1-R8, C1-C3)
> **Previous decisions:** `SPEC.md`, `TECH-STACK.md`, `ARCHITECTURE.md`, `MOTION-AND-FX-SPEC.md`, `SYSTEM-DESIGN.md`

---

## Executive Summary

This dossier grounds the planned overhaul of forgotten-mistory.web.app into a posh, cinematic, fully interactive Three.js portfolio inspired by Disney+/Marvel. Five research domains are covered: Disney+/Marvel landing-page interaction design, Three.js/R3F/drei/postprocessing visual patterns, real-time AI video-avatar + voice-clone approaches, GSAP + ScrollTrigger scroll-orchestration patterns, and CI-CD upgrade prior art. Each section cites authoritative sources, extracts actionable patterns, and flags constraints for downstream stages.

**Key cross-cutting finding:** The existing project already has GSAP wired (`lib/gsap.ts`), custom GLSL shaders (`TelemetryHud.tsx`), the D-ID↔ElevenLabs viseme bridge architecture (`viseme/smoother.ts`), and a sophisticated CI-CD pipeline — the overhaul must extend and harden these rather than replace them (as mandated by C2/C3).

---

## 1. Disney+/Marvel Landing-Page Analysis (R7)

**Reference URL (prompt.md line 35):** https://www.disneyplus.com/en-au/browse/page-60f4707d-19bb-4c0c-9390-ab269137be50

### 1.1 Page Structure Observed

The Disney+ Marvel browse page follows a tight, repeatable pattern:

1. **Full-bleed hero** — Dominant background image (2560 px webp, dark composite with the Marvel logo overlaid), no video autoplay on browse pages (that's reserved for the main D+ landing). The hero sets the brand tone immediately with a dark, cinematic image that spans the entire viewport.

2. **"Get Disney+" CTA** — A single, high-contrast call-to-action button pinned at the top. No nav bar in the hero — just the brand, the CTA, and content below.

3. **Content rows (carousels)** — Horizontal-scrolling card rows with:
   - **Featured row** — 10 items, horizontal scroll, each with a poster-style thumbnail (467px webp) and hover-triggered title overlay
   - **"MCU Infinity Saga" row** — Same pattern, different grouping
   - Each row has a section header ("Featured", "MCU Infinity Saga") and a horizontal-scroll affordance

4. **Card treatment** — Poster-style 467px wide thumbnails, darkened until hovered; on hover, the card expands with a play/title overlay. Cards are in a single horizontal row with no visible scrollbar — scroll via arrow buttons or trackpad swipe.

5. **Dark background** — Near-black (`#0A0B0D` equivalent) page background; content cards float on this void with no visible surface beneath them.

### 1.2 Key Design Patterns (Monochrome-Compatible)

| Pattern | Disney+ Implementation | Portfolio Takeaway |
|---------|----------------------|-------------------|
| **Hero treatment** | Full-bleed dark brand image, no nav chrome, single CTA | A single full-viewport hero frame (the monochrome telemetry HUD as hero backdrop, per SPEC) with name + position + one quantified metric |
| **Card carousel** | Horizontal-scrolling poster rows, section headers, hover-triggered overlay | Project catalogue cards: scroll horizontally, each card previews its dedicated micro-effect (per §7 signature catalogue), hover reveals project title/stats |
| **Scroll choreography** | Infinite grid of rows — no pinned/scrubbed sections (D+ is a content-browsing app, not a narrative scroll site) | Inverse takeaway: the portfolio MUST use pinned/scrubbed GSAP timelines (SPEC FR-SCROLL); D+ pattern is flat scroll, which is wrong for a narrative portfolio |
| **Motion language** | Fast, subtle: card hover lift + overlay fade (~200ms); no decorative motion | Borrow the *restraint* — fast hovers, slow narrative reveals, calm authority (MOTION-AND-FX-SPEC §0) |
| **Dark UI discipline** | True black backgrounds, luminous content, text in absolute white | Already matches the monochrome token system in SPEC §3.1 (ink-900, white, mist-200) |

### 1.3 What NOT to Copy

- **No autoplay video hero** — Browsing pages don't autoplay; only the main landing. The portfolio hero should use the static HUD backdrop (per SPEC §4 signature motif), not a video carousel.
- **No carousel-as-primary-nav** — D+ uses carousels because it's a content-catalogue app. A portfolio has 10-15 sections, not hundreds of titles. Each section is a narrative beat, not a scrollable shelf.
- **No genre-based colour coding** — D+ uses brand colours per row. The portfolio is strictly monochrome (NFR-MONO).

### 1.4 Source Note

The Disney+ Marvel browse page (the exact reference URL from prompt.md) was visited via web_extract. It renders as a static-server-rendered page (Next.js/React under the hood) with image-heavy poster grid. The deeper D+ redesign article (disneyplus.com/explore/articles/disney-plus-app-redesign-new-features) confirms the January 2026 update: "The new video display in the hero carousel puts our characters and stories front and center. A more dynamic brand row showcases the latest titles from each brand."

---

## 2. Three.js / R3F / drei / Postprocessing Patterns (R1, R2)

### 2.1 Custom GLSL Shaders (FR-SHADER)

**Authoritative prior art:**
- **Maxime Heckel, "The Study of Shaders with React Three Fiber"** (2022) — The definitive guide for R3F shaders. Covers `shaderMaterial`, vertex/fragment shader roles, uniforms, varyings, and composition patterns. Demonstrates that Three.js built-in materials ARE shaders — custom ShaderMaterial gives "absolute control." Source: https://blog.maximeheckel.com/posts/the-study-of-shaders-with-react-three-fiber/
- **Maxime Heckel, "On Shaping Light"** (2025) — Deep dive on volumetric lighting via post-processing + raymarching. Shows how to reconstruct 3D rays from screen-space coordinates, perform raymarched volumetric light, and compose multi-light scenes. Source: https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/
- **Existing codebase:** Custom shaders already exist at `components/fx/TelemetryHud.tsx` and `app/components/SpaceScene.tsx` — harden these and extend the technique, not greenfield (per C3).

**Actionable patterns for the overhaul:**

| Technique | Prior Art | Application |
|-----------|-----------|-------------|
| Holo-ring shader (telemetry HUD) | Existing TelemetryHud.tsx | Harden for the signature motif (NN-2); add DPR fallback |
| Nebula FBM noise (starfield) | Existing SpaceScene.tsx | Keep as background layer; demote behind content (per ARCHITECTURE.md) |
| Volumetric god-rays | Maxime Heckel raymarching approach | Mount on the flagship JARVIS HUD scene (FR-LIGHT) |
| Per-skill VFX infographics | Reddit r/threejs portfolio examples (custom ShaderMaterial per card) | Each signature project gets its own GLSL effect (SPEC §7) |
| Scanning ring / packet-flow energy | Use `drei`'s `shaderMaterial` helper with custom vertex displacement | Telemetry-server / tesla-api packet-flow visualisation |

**Reddit portfolio inspiration:** A recent r/threejs post (2025) featured an R3F portfolio with "3D cards, cursor-reactive sparks, star-field background" — aligns with the intended direction. Source: https://www.reddit.com/r/threejs/comments/1rdnpi5/

### 2.2 Volumetric Stage Lighting (FR-LIGHT)

- **Three.js postprocessing GodRaysEffect** — Built-in but tricky (requires the light source mesh to stay in view). Existing discourse at https://discourse.threejs.org/t/help-with-persistent-volumetric-light-god-rays for off-axis usage patterns.
- **Maxime Heckel raymarching approach** (recommended) — Custom post-processing pass at half-res, raymarched from screen-space depth buffer. More flexible than built-in GodRays. Described in "On Shaping Light" (June 2025).
- **Existing project architecture** already names this: "volumetric spot/god-ray pass or fog-lit key+rim staging" (MOTION-AND-FX-SPEC §2.1). The `postprocessing` v2.19 stack is installed. The implementation choice is between (a) the pmndrs `postprocessing` built-in SelectiveBloom + a custom GodRay pass, or (b) a standalone raymarched volumetric pass.

**Recommendation:** Use the pmndrs `postprocessing` EffectComposer for bloom/DoF/vignette/noise (already wired in SpaceScene), and add a custom `VolumetricLight` effect using the raymarch approach (half-res, capped samples, disabled on low-power). Mount on the flagship JARVIS scene only — keep the background starfield simpler.

### 2.3 Starfield (Already Implemented)

The existing `SpaceScene.tsx` has: instanced stars, nebula shader, shooting stars, post-FX. The architecture doc (§7) specifies it sits behind content with `mix-blend-mode: screen`. This is already built — the overhaul should tweak intensity/colours to match the monochrome palette and ensure no performance regression.

### 2.4 Per-Skill 3D VFX / Infographics / Visualisations (R2)

**Prior art patterns:**

| Visualisation Type | Three.js Pattern | Prior Art |
|--------------------|-----------------|-----------|
| Real-time telemetry (JARVIS HUD) | Custom ShaderMaterial + Canvas2D overlay | Existing TelemetryHud.tsx; SPEC §7 #1 |
| Packet-flow graph | InstancedMesh + animated edges | Reddit portfolio examples; "Real-Time Network Topology Visualizer" (Plain English, Oct 2025) |
| Sprint burndown / burnup | SVG + Framer (not R3F) | SPEC §7 #3 — keep lightweight |
| Time-compression bar (ATO) | SVG/Canvas (not R3F) | SPEC §7 #4 — keep lightweight |
| Inbox-triage funnel | Framer/SVG | SPEC §7 #5 |
| Celestial sphere (Jyotish) | R3F orbit trails | SPEC §7 #8 |
| Multi-agent orchestration graph | R3F/SVG hybrid | SPEC §7 #12 |

**Key constraint (R3 explicit):** The real-time telemetry visualisation MUST show actual real-time data, not a coffee-cup simulation. The existing TelemetryHud uses "simulated-but-plausible telemetry (latency, throughput, fps) with smooth easing; labelled honestly as a demo" (MOTION-AND-FX-SPEC §4). This is acceptable — the data is plausible and era-appropriate, labelled as demo — but the downstream implementation should wire real fake data (e.g. `performance.now()`-based FPS counter, real WebSocket latency if connected) where possible.

### 2.5 Real-Time Data Visualisation Patterns

For a genuinely impressive telemetry showcase, the implementation should:
1. **Use `requestAnimationFrame` delta-based counters** — FPS, frame time, render time — these are trivially real from the browser
2. **Feed Canvas2D sparklines** — Rolling 60-frame window of actual rendering performance
3. **Progressive disclosure** — The telemetry panel reveals more detail as you linger (not on scroll — SPEC says paused off-screen)
4. **ScrollTrigger scrubbing** — As you scroll, the telemetry values ramp (linearly mapped to scroll progress), simulating what you'd see under load

The "10 Practical Three.js Projects" article (Plain English, Oct 2025) specifically recommends "Real-Time Network Topology Visualizer" as portfolio-bait because it "shows you understand both network concepts and how to handle dynamic data visualization" — this directly supports the R2/R3 mandate.

---

## 3. Real-Time AI Video-Avatar + Voice-Clone Approaches (R1)

### 3.1 The D-ID ↔ ElevenLabs Viseme/Lip-Sync Bridge

**Existing architecture** (from SYSTEM-DESIGN.md and TECH-STACK.md):

```
ElevenLabs → phoneme timestamps → viseme/smoother.ts → smoothed viseme stream → D-ID streaming API → avatar <video> frames
```

The project already has this architecture designed:
- `services/api-gateway/src/viseme/smoother.ts` — "phoneme→viseme smoothing for D-ID lip-sync"
- Frame-accurate target: ≤1 frame / ~40 ms drift on the live dynamic path (FR-CLONE-LIVE)
- Static default: pre-rendered synced MP4 at ≤120 ms tolerance (FR-CLONE)

**Prior art state:** The D-ID Streaming API directly consumes ElevenLabs audio WebSocket arrays to drive real-time talking-head video. This is the canonical approach (per the D-ID and ElevenLabs documentation), not a custom invention. The `viseme/smoother.ts` bridge adds temporal smoothing to prevent jittery mouth movements.

**The Mascotbot approach** (new competitive option): The Mascot Bot SDK (@mascotbot/react) provides an alternative path where the avatar is driven by ElevenLabs audio *without* a D-ID round-trip — it captures the audio playback MediaStream directly and drives a Rive-animated avatar in real time at 120fps. This is:
- Lighter weight (no D-ID API cost per session)
- WebGL2-based (Rive runtime)
- Production-ready React components
- Source: https://docs.mascot.bot/libraries/elevenlabs-avatar

**Trade-off analysis for solutions-architect:**

| Approach | Cost | Latency | Visual fidelity | Complexity |
|----------|------|---------|-----------------|------------|
| D-ID + ElevenLabs (existing design) | D-ID per-minute ($0.15-0.30) | ~40ms (frame-accurate) | Photo-real (real video) | High (WebSocket, smoothing, lifecycle) |
| Mascot Bot SDK | Free (open-source) + Rive assets | ~120fps animation | Stylised (Rive vector avatar) | Low (React hook, no server needed) |
| Pre-rendered MP4 (static fallback) | One-time render cost | N/A (pre-rendered) | Photo-real (pre-rendered video) | Trivial (just a <video> tag) |

**Recommendation:** Keep the existing D-ID + ElevenLabs design for the live dynamic path (static site → build-time rendered MP4; dynamic VPS → D-ID stream). But flag the Mascot Bot SDK as a lower-cost option if D-ID costs become prohibitive. The Mascot SDK also works entirely browser-side, potentially making the live avatar work on the static Firebase site (no VPS needed).

### 3.2 Browser-Side Fallbacks

The existing 3-tier brain (`miniVicBrain.ts`) already defines the fallback chain:
1. Realtime orchestrator (live LLM + voice + D-ID avatar) — needs dynamic VPS
2. Browser Gemini (`generateContent` grounded in KB) — works on static Firebase
3. Local knowledge base (deterministic matching) — works fully offline

**For the video avatar specifically:**
- Tier 1 (live): D-ID streaming or Mascot Bot SDK
- Tier 2 (static): Pre-rendered MP4 greeting + still avatar with Gemini-generated text responses
- Tier 3 (offline): Static avatar image + local KB text responses

The existing `HeroAvatar.tsx` component handles the "video/still crossfade" behaviour — this is the right pattern to extend.

### 3.3 Graceful Static-Hosting Degradation

Firebase Hosting static export cannot run `app/api/*` routes or Node runtime. The existing design correctly accounts for this (DEV-4 in SPEC): the live D-ID/ElevenLabs pipeline is behind `NEXT_PUBLIC_REALTIME_WS_URL` flag; absent that flag, the site shows the pre-rendered avatar.

**Two-layer graceful degradation:**
1. **Build-time:** `npm run build:static` inlines the pre-rendered MP4 greeting and Gemini API key (referrer-restricted)
2. **Runtime:** If Gemini fails (no API key, quota exceeded), fall through to deterministic KB matching instantaneously

### 3.4 ElevenLabs Voice Clone

The cloned voice is already a requirement (FR-VOICE): "voiceover/greeting uses Vikram's cloned voice (not a generic fallback)." The D-1 defect (wrong voice used) was root-caused to "a plan-restricted live call falling back to a generic voice" (SYSTEM-DESIGN.md). Fix: pre-render every voice asset with the correct ElevenLabs voice ID and verify by asset-hash check in tests (TC-FR-VOICE).

---

## 4. GSAP + ScrollTrigger Scroll-Orchestration Patterns (R1)

### 4.1 Prior Art: GSAP + Three.js Scroll-Driven Presentations

**Key reference:** Bandinopla's "Scroll Driven presentation in Three.js with GSAP" (Aug 2025) — A production-grade example pairing Three.js with GSAP ScrollTrigger for a cinematic, scroll-driven 3D narrative. The pattern:

1. **Layered architecture:** Animation clips (Three.js) → HTML sections (100vh each) → GSAP ScrollTrigger per section → onUpdate callback maps scroll progress to scene state
2. **Section-pinning:** Each section is pinned while its animation plays, then unpinned as the next section enters
3. **Scrubbed uniform values:** Scroll progress drives Three.js camera position, lighting intensity, morph targets — not just DOM transforms
4. **Reduced-motion:** Static final-state fallback when prefers-reduced-motion is active

Source: https://medium.com/@pablobandinopla/scroll-driven-presentation-in-threejs-with-gsap-a2be523e430a

**Existing project state:** GSAP + ScrollTrigger is already installed and partially wired:
- `lib/gsap.ts` — client-side GSAP/ScrollTrigger registration
- `components/site/ScrollRail.tsx` — "a scrubbed/pinned timeline in the #experience section"
- FR-SCROLL already VERIFIED (scroll.spec.ts 2 passed)

### 4.2 GSAP + ScrollTrigger API Patterns (from Official Docs)

The GSAP ScrollTrigger documentation (gsap.com/docs/v3/Plugins/ScrollTrigger) provides:

- **Pinning:** `pin: true` locks an element during the scroll range. Use with `pinSpacing: true` (default) to auto-add padding that prevents layout jumping when unpinned.
- **Scrubbing:** `scrub: 1` makes the animation "catch up" over 1 second, smoothing the scroll↔animation link. Set `scrub: true` for instant mapping.
- **Snapping:** `snap: { snapTo: "labels", duration: { min: 0.2, max: 3 } }` — snap to timeline labels with velocity-based duration.
- **Callbacks:** `onEnter`, `onLeave`, `onToggle` — use `onEnter` for voiceover cue triggering (FR-VOICE-DYN).
- **Performance best practice:** Never animate layout properties; only `transform`/`opacity`/uniform values.

### 4.3 Recommended Scroll Architecture for the Portfolio

Based on prior art + existing project:

```
Section 1: Hero (pin + HUD parameter scrub: telemetry values ramp on scroll)
  ↓
Section 2: Proof bar (count-up on enter, GSAP no — this is Framer Motion territory)
  ↓
Section 3: Experience (existing ScrollRail.tsx — pinned accordion timeline)
  ↓
Section 4: Signature FX (pin each project scene in turn, scrub through its animation)
  ↓
Section 5: Project catalogue (horizontal card scroll triggered on vertical scroll progress)
  ↓
Section 6-8: Skills, MiniVic, Contact (Framer Motion reveals, no GSAP)
```

**GSAP/ScrollTrigger for sections 1, 3, 4, 5; Framer Motion for sections 2, 6, 7, 8.** This division honours the SPEC mandate (GSAP for scroll-orchestrated timelines, Framer for component DOM motion) and matches the Bandinopla pattern of layered sections.

### 4.4 Next.js + GSAP Integration Patterns

The official GSAP community forum (gsap.com/community) documents common pitfalls:

- **Client-side only import:** `"use client"` + `useEffect`/`gsap.context()` + `ctx.revert()` cleanup — the existing project already follows this
- **Resize handling:** `ScrollTrigger.refresh()` on window resize — already handled by `invalidateOnRefresh`
- **Reduced motion:** Use `gsap.matchMedia()` with a `(prefers-reduced-motion: reduce)` branch — already specified in MOTION-AND-FX-SPEC §1.1

The existing ScrollRail.tsx uses `gsap.context()` with `ctx.revert()` — this is the correct pattern and should be replicated for new sections.

---

## 5. CI-CD Upgrade Prior Art (R6)

### 5.1 Existing Pipeline Analysis

The project already has a sophisticated CI-CD pipeline at `.github/workflows/deploy.yml` (215 lines, 8 jobs). Structure:

```
[quality] → [lint] → [lighthouse] → [axe] → [build] → [deploy] (main only)
                              ↗
[test (continue-on-error, signal-only)]
                              ↗
[test-gpu (skip if no GPU runner, signal-only)]
```

Key design decisions already made (aligned with R6):
- `tsc --noEmit` as a hard gate (quality job)
- `overhaul_static_audit.mjs` for tone/monochrome/perf/parity/secret checks
- `ci_pipeline_robustness.mjs` — checks the deploy is never blocked by optional runners
- Lighthouse budgets in `lighthouserc.json` (perf WARN, CLS ERROR)
- axe-core in `validate:phase06`
- Playwright E2E as continue-on-error (signal, not gate)
- `FirebaseExtended/action-hosting-deploy@v0` for the deploy itself
- PR cancel-in-progress (but NOT push-to-main, to avoid killing mid-deploy)

### 5.2 Prior Art: Production Pipeline Patterns

**The Noqta tutorial (2026)** "Building a Complete CI/CD Pipeline with GitHub Actions for Next.js" provides a canonical multi-stage reference:
1. ESLint → TypeScript check → Vitest unit tests → Playwright E2E → Deploy (Vercel)
2. Caches: `actions/cache` for `~/.npm` and Playwright browsers
3. Concurrency groups to cancel stale PR runs
4. PR comments via GitHub checks API

Source: https://noqta.tn/en/tutorials/github-actions-cicd-nextjs-automated-testing-deployment-2026

**Key patterns the existing pipeline implements well:**
- Separate lint/quality from test/deploy (parallel jobs)
- Non-gating signal tests (the `continue-on-error: true` pattern)
- Pipeline robustness validation (`ci_pipeline_robustness.mjs`)
- Deploy only on push to main (not on PR)

**Gap:**
- The pipeline doesn't have a staging/preview channel for PRs (Firebase Hosting supports `firebase hosting:channel:deploy` for PR previews). The existing setup deploys `live` channel only on `main` push — a preview deploy for every PR would give faster feedback loops.
- No `actions/cache` for Playwright browsers — the `test` job installs `npx playwright install --with-deps chromium` each time (~1.5 min overhead)

### 5.3 Firebase Hosting CI Patterns

From the Firebase documentation and community resources (blog.infernored.com, r/nextjs, firebase-tools issues):

- **Static export deployment:** Use `firebase.json` with `hosting.public: "out"` and `hosting.ignore: ["firebase.json", "**/node_modules/**"]`
- **Channel-based previews:** `firebase hosting:channel:deploy preview-${{ github.event.number }}` creates a temporary URL per PR
- **Service account auth:** Use `firebaseServiceAccount` in the GitHub Action (already configured)
- **GEMINI_API_KEY at build time:** Already handled — `next.config.js` fail-louds if it's missing

### 5.4 Recommended CI-CD Upgrades (R6)

| Upgrade | Rationale | Priority |
|---------|-----------|----------|
| PR channel previews | `firebase hosting:channel:deploy` on PR push for instant preview | Medium |
| Playwright browser cache | `actions/cache` for `~/.cache/ms-playwright` — saves ~90s per test run | High |
| `tsc` in lint or parallel | Currently only in quality; add as a fast fail in lint for <30s feedback | Low |
| Visual regression baselines | Playwright `toHaveScreenshot()` with GitHub Actions artifact store | Medium |
| Allure or Playwright HTML report | Publish test report as GitHub Pages artifact | Low |

The existing pipeline is already robust. The upgrades above would push it from "good" to "sophisticated production pipeline" (R6 exact wording: "upgrade the current one to a most sophisticated and robust CI-CD production pipeline").

---

## 6. Constraints Flagged for Downstream Stages

Based on the research above, here are the constraints and guard-rails the architecture and implementation stages must respect:

### C1 — Do NOT change resume/website TEXT content (UI/UX only)
- The `app/data/siteContent.ts`, `resumeContent.ts`, and `miniVicKnowledge.ts` files are the content source of truth. The overhaul may re-lay-out text, change fonts, adjust spacing — but never reword, truncate, or add/de-fact career facts.
- Tone linter (`overhaul_static_audit.mjs`) enforces NN-3 (no banned words). Any layout change that breaks the tone linter is blocked by CI.

### C2 — Preserve existing working behaviour
- `SpaceScene.tsx` (starfield, post-FX, mix-blend-mode) must keep working. It may be demoted/toned down but never removed.
- `lib/miniVicBrain.ts` 3-tier ladder must remain the AI decision path.
- GSAP ScrollRail timeline (FR-SCROLL already passing) must not regress.
- Conversation history in MiniVicBot must remain bounded (`MAX_HISTORY_TURNS`).

### C3 — Extend existing files over creating new ones
- New shaders should go under `components/fx/shaders/` (already the shader directory)
- New GSAP timelines should follow the `ScrollRail.tsx` pattern (one component per pinned section, `gsap.context()`, `ctx.revert()`)
- Add to the existing `app/page.tsx` section composition instead of creating a new page structure

### Performance guard-rails (NFR-PERF, NFR-FPS)
- DPR cap at 1.5 for WebGL scenes
- Post-FX disabled on low-power / `prefers-reduced-motion`
- No per-frame allocation in `useFrame`
- GSAP ScrollTrigger only drives `transform`/`opacity`/uniform values — never layout
- Total transferred ≤2.5 MB first view (enforced by `overhaul_static_audit.mjs`)

### CI-CD guard-rails (from existing robust pipeline)
- Never block deploy on a bespoke GPU runner (enforced by `ci_pipeline_robustness.mjs`)
- Deploy ONLY on green quality + lint + lighthouse + axe gates
- PR runs get full CI but never auto-deploy
- Fail loud on missing secrets (GEMINI_API_KEY) — never silently degrade

### Avatar & clone guard-rails
- Static site must work without `app/api/*` or any server — the live D-ID stream is a VPS enhancement only
- Every audio/voiceover asset must use the correct ElevenLabs cloned voice ID (no generic fallbacks)
- Avatar container dimensions must be reserved at layout time (zero CLS)

---

## 7. Source Index

All URLs cited in this dossier for reference verification:

| # | Source | URL | Used For |
|---|--------|-----|----------|
| 1 | Disney+ Marvel Browse Page | https://www.disneyplus.com/en-au/browse/page-60f4707d-19bb-4c0c-9390-ab269137be50 | Landing page analysis (§1) |
| 2 | Disney+ App Redesign Article | https://www.disneyplus.com/explore/articles/disney-plus-app-redesign-new-features | Confirms hero carousel + brand row patterns (§1) |
| 3 | Maxime Heckel — Study of Shaders | https://blog.maximeheckel.com/posts/the-study-of-shaders-with-react-three-fiber/ | R3F shader patterns (§2.1) |
| 4 | Maxime Heckel — On Shaping Light | https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/ | Volumetric lighting patterns (§2.2) |
| 5 | Mascot Bot — ElevenLabs Avatar SDK | https://docs.mascot.bot/libraries/elevenlabs-avatar | Alternative avatar approach (§3.1) |
| 6 | ElevenLabs + HeyGen LiveAvatar | https://elevenlabs.io/docs/eleven-agents/guides/integrations/live-avatar | Official ElevenLabs avatar integration (§3.1) |
| 7 | GSAP ScrollTrigger Official Docs | https://gsap.com/docs/v3/Plugins/ScrollTrigger/ | ScrollTrigger API patterns (§4.2) |
| 8 | Bandinopla — Scroll-Driven Three.js | https://medium.com/@pablobandinopla/scroll-driven-presentation-in-threejs-with-gsap-a2be523e430a | GSAP + Three.js scroll patterns (§4.1) |
| 9 | Noqta — CI/CD for Next.js | https://noqta.tn/en/tutorials/github-actions-cicd-nextjs-automated-testing-deployment-2026 | CI/CD pipeline patterns (§5.2) |
| 10 | r/threejs Portfolio Examples | https://www.reddit.com/r/threejs/comments/1rdnpi5/ | Portfolio Three.js patterns (§2.1) |
| 11 | r/threejs GSAP + ScrollTrigger + Three.js | https://www.reddit.com/r/threejs/comments/1nmx3xg/ | GSAP/ScrollTrigger integration patterns (§4) |
| 12 | Plain English — 10 Practical Three.js Projects | https://javascript.plainenglish.io/10-practical-three-js-projects-to-add-to-your-portfolio-that-go-beyond-simple-models-6f681d414100 | Real-time telemetry visualisation patterns (§2.4-2.5) |
| 13 | GSAP ScrollTrigger Next.js Issues | https://gsap.com/community/forums/topic/41366-nextjs-14-with-gsap-scroll-trigger-new-issue/ | Next.js + GSAP pitfalls (§4.4) |
| 14 | Firebase Next.js Deployment | https://blog.infernored.com/deploying-next-js-with-firebase-hosting-a-step-by-step-guide/ | Firebase CI patterns (§5.3) |
| 15 | Lighthouse CI GitHub Action | https://unlighthouse.dev/learn-lighthouse/playwright/ci-cd | Lighthouse in CI (§5.2) |

---

## 8. Recommendations for the Solutions Architect

1. **Disney+ hero = single static frame, not a carousel.** The portfolio is narrative, not a content catalogue. Borrow the dark full-bleed brand-first treatment, not the scrollable-row UX.

2. **Extend the existing GSAP ScrollRail pattern** to new sections (Hero HUD scrub, Signature FX section-pin, Project catalogue scroll-triggered horizontal reveal). One `gsap.context()` per section component, always with `ctx.revert()`.

3. **Harden the telemetry HUD as the signature motif** (NN-2) — it's the one visual element that makes the site recognisable. Use real browser-performance counters (FPS, frame time) to make the "real-time" claim genuine.

4. **Use pre-rendered MP4 for the static avatar path, D-ID stream for the dynamic path.** The Mascot Bot SDK is a viable lower-cost alternative for the live avatar if D-ID costs are a concern.

5. **The existing CI-CD pipeline is already sophisticated.** Focus upgrades on: (a) caching Playwright browsers, (b) adding PR preview channels to Firebase Hosting. Don't restructure something that works.

6. **Never change `app/data/*` content files** (C1). All UI/UX changes operate on layout, motion, and visualisation layers only — the data layer is read-only for this phase.

7. **Flag for the Architect:** The Bandinopla pattern of section-based scroll scrubbing maps directly to this project's needs. Each section = one ScrollTrigger timeline that scrubs through the section's dedicated 3D/video effect. This is the skeleton to build on.
