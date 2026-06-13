# Tech stack

Exact, version-pinned stack with rationale and constraints. Source of truth: `package.json`,
`services/*/package.json`, `docker-compose.yml`.

## Frontend (the public site)

| Layer | Choice | Version | Why |
|---|---|---|---|
| Framework | Next.js (App Router) | 14.2.33 | RSC + static export to Firebase; **strict TS** (NFR-TS). Prompt §3 allows 14/15; 14.2 pinned, 15 only after a tested migration. |
| UI runtime | React | 18.2.0 | Concurrent features; ecosystem. |
| Language | TypeScript | 5.3.3 | **`strict: true`** (noImplicitAny, strictNullChecks); `tsc --noEmit` is a blocking gate (NFR-TS). |
| Styling | Tailwind CSS | 4.1.13 | Token-driven utility CSS (`@theme`/`:root`); strict monochrome (slate/charcoal/white/obsidian). |
| Scroll motion | **GSAP + ScrollTrigger** | ^3.15.0 (**wired & met**) | **Orchestral pinned/scrubbed scroll timelines** — the primary scroll-orchestration layer (prompt §3, FR-SCROLL/TC-FR-SCROLL). Registered client-side in `lib/gsap.ts`; drives a scrubbed/pinned timeline via `components/site/ScrollRail.tsx` (mounted in `#experience`) with a `matchMedia` reduced-motion branch + `ctx.revert` cleanup. **FR-SCROLL VERIFIED** (`tests/overhaul/scroll.spec.ts` 2 passed). Framer Motion + IntersectionObserver remain for component-level reveals only. |
| Component motion | Framer Motion | 11.18.2 | Component-level DOM motion only: reveals, layout & shared-element transitions, reduced-motion. Reused from the valid baseline. |
| 3D | three | 0.165.0 | WebGL signature scenes. |
| 3D React | @react-three/fiber | 8.18.0 | Declarative three in React. **Stay on v8** (v9 needs React 19). |
| 3D helpers | @react-three/drei | 9.122.0 | Trail, **`shaderMaterial` (custom GLSL vertex+fragment)**, lighting helpers. |
| Shaders & lighting | **custom GLSL + volumetric stage lighting** | — | Hand-authored vertex/fragment shaders + volumetric light on flagship scenes (prompt §3; FR-SHADER/FR-LIGHT). Shaders live in `components/fx/shaders/*`. |
| Post-FX | @react-three/postprocessing | 2.19.1 | Bloom, Noise, Vignette, DoF. Full pass renders on signature scenes (NFR-RENDER). Order matters (see MOTION-AND-FX-SPEC). |
| Icons | lucide-react | 0.344.0 | Lightweight monochrome icons. |
| Class utils | clsx, tailwind-merge, class-variance-authority | — | `cn()` in `lib/utils.ts`. |
| Images | sharp | 0.33.5 | Build-time AVIF/WebP generation. |

## Testing & quality

| Tool | Version | Use |
|---|---|---|
| Playwright | 1.57.0 | E2E + visual + production-audit. |
| @axe-core/playwright | 4.10.2 | Accessibility (WCAG 2.2 AA). |
| Lighthouse (CI) | via `lighthouserc.json` | Perf/a11y/SEO budgets. |
| ESLint + eslint-config-next | 8.57 / 14.2.33 | Linting. |
| Custom audits | `scripts/validate/*` (21 phases) + `overhaul_static_audit.mjs` | Tone, monochrome, asset budget, parity, **fonts (≤2 families)**, secrets, **no `/performance-benchmark` in `out/`** — **7 checks (7/7)**. |

## Dynamic backend (`services/`, optional — powers the live clone)

| Service | Stack | Role |
|---|---|---|
| `api-gateway` | Node + TypeScript (Dockerfile) | LLM gateway; providers: gemini, openai, local-llama, mock (`src/providers/*`); TTFT metrics; CORS/rate-limit hardening; viseme smoother (`src/viseme/smoother.ts`) for D-ID lip-sync. |
| `realtime-orchestrator` | gRPC (`realtime_orchestrator.proto`) | Streams realtime sessions to the browser; bridges LLM ⇄ TTS ⇄ avatar. |
| `llm-engine` | (service slot) | Local/hosted model serving. |
| `redis` | Redis | Session/cache. |
| `nginx-proxy` / `traefik` | Reverse proxy + TLS | Routing, HSTS, Let's Encrypt. |
| Observability | Prometheus + Grafana + Loki + Promtail | Metrics, dashboards, logs. Configs in `config/`. |

External APIs: **Gemini** (browser fallback brain + gateway provider), **OpenAI**,
**ElevenLabs** (voice clone), **D-ID** (talking-head video). Keys via env only.

**Live lip-sync pipeline (FR-CLONE-LIVE, dynamic path only):** per prompt §3/§5 the **D-ID
Streaming API is bound natively to ElevenLabs WebSocket speech arrays** — real-time audio-packet
extraction feeds the `viseme/smoother.ts` bridge for **frame-accurate lip-sync (≤1 frame / ~40 ms
drift)**. This requires the server (`services/`), so the static site ships a pre-rendered,
correctly-synced avatar (≤120 ms) as the durable default; the live pipeline is an enhancement
behind `NEXT_PUBLIC_REALTIME_WS_URL`.

## Deployment targets

- **Static:** Firebase Hosting (`firebase.json`, `.firebaserc`) ← `npm run build:static`.
- **Dynamic:** Docker Compose on a VPS (`docker-compose.yml`; Hostinger creds in env).
  Provisioning script `scripts/vps/*`, proxy/observability under `config/`.

## Constraints & upgrade notes

- **Node 20.x** required (`engines`). CI uses Node 20.
- **R3F 8 / three 0.165** are coupled to React 18 — upgrading React to 19 forces R3F 9; do it
  as one tested migration, not piecemeal.
- **Tailwind 4** uses the new `@theme`/CSS-first config — there is no `tailwind.config.ts`
  colour map; tokens live in `app/globals.css :root`. Keep palette there + `lib/palette.ts`.
- **Static export limits:** no `app/api/*`, no Node runtime, no ISR. Anything server-side is
  the `services/` path.
- **display-p3** was previously used in tokens; the monochrome system uses plain sRGB hex for
  portability and to keep the audit's hex-scan meaningful.
