# Forgotten Mistory — Vikram Deshpande · Portfolio

A monochromatic, cinematic portfolio for **Vikram Deshpande** — Scrum Master / Project
Manager on the Australian Taxation Office's Payday Super program, and AI solutions
architect. Built for two audiences: **potential employers** and **business clients**.

- **Production:** https://forgotten-mistory.web.app (Firebase Hosting, static export)
- **Repo:** https://github.com/Victordtesla24/forgotten-mistory
- **Design language:** monochrome (near-black → luminous cool-white; no hue), restrained
  evidence-led copy, Marvel/WB/Disney-grade *but purposeful* motion. See
  [`docs/overhaul/SPEC.md`](docs/overhaul/SPEC.md).

> **Overhaul in progress** on branch `overhaul/marvel-grade-portfolio`. The pre-overhaul
> production state is preserved at git tag `pre-overhaul-baseline`. Read the
> [documentation index](#documentation) before changing anything.

---

## Tech stack (summary)

Next.js 14.2 (App Router, strict TS) · React 18.2 · TypeScript 5.3 · Tailwind CSS 4.1 ·
**GSAP + ScrollTrigger** (scroll orchestration) + Framer Motion 11 (component motion) ·
three 0.165 + @react-three/fiber 8 + drei 9 + postprocessing 2 (**+ custom GLSL shaders &
volumetric stage lighting**) · Playwright + axe + Lighthouse. Optional dynamic backend
(`services/`): Node/TS api-gateway (multi-LLM), gRPC realtime-orchestrator, **D-ID ↔ ElevenLabs
WebSocket** viseme smoother (frame-accurate lip-sync), Redis, Prometheus/Grafana/Loki. Full
detail: [`docs/overhaul/TECH-STACK.md`](docs/overhaul/TECH-STACK.md).

## Two-tier architecture

1. **Static site (default, public):** `npm run build:static` → `out/` → Firebase Hosting.
   Fast, cacheable, durable (works after the visitor goes offline). No server.
2. **Dynamic backend (optional enhancement):** the `services/` stack (Docker) powers the
   live MiniVic clone — real-time LLM streaming, ElevenLabs voice, D-ID lip-sync via the
   viseme bridge. The static site degrades gracefully without it.

Full picture: [`docs/overhaul/ARCHITECTURE.md`](docs/overhaul/ARCHITECTURE.md) ·
[`docs/overhaul/SYSTEM-DESIGN.md`](docs/overhaul/SYSTEM-DESIGN.md).

## Content model (single source of truth)

All biographical/career content is typed and kept in **strict parity** with the standalone
CV at `public/docs/Vik_Resume_Final.pdf`:

| File | Purpose |
| --- | --- |
| `app/data/siteContent.ts` | Hero, about, experience, skills, projects, contact |
| `app/data/resumeContent.ts` | Hero outcome cards + FloatingDetailBox expansions |
| `app/data/miniVicKnowledge.ts` | MiniVic AI-clone persona + grounded Q&A knowledge base |

To change career facts: edit these files, regenerate the CV PDF, and run
`node scripts/validate/overhaul_static_audit.mjs` (parity check). Nothing else changes.

## Project structure

```
app/
  layout.tsx              Root layout: fonts, metadata, JSON-LD (Person + WebSite)
  page.tsx                Single-page composition of all sections
  globals.css             Monochrome design tokens (:root) + component styles
  data/                   Typed content layer (see above)
  components/SpaceScene   R3F starfield (monochrome; colours via lib/palette.ts)
  api/                    chat-with-vic, realtime/session (DYNAMIC only — not in export)
  performance-benchmark/  Isolated perf harness page
components/
  site/                   Preloader, Navigation, CursorGlow, Reveal, TelemetryPanel,
                          ExperienceAccordion, ExpandableCard, ArchitectureMap,
                          ProjectsCarousel, GithubFeed, HiddenTerminal, HeroAvatar
  MiniVicBot.tsx          AI clone UI (degrades gracefully on static hosting)
  FloatingDetailBox.tsx   Outcome-card flyout
  MotionProvider.tsx      Framer Motion config / reduced-motion provider
  ui/button.tsx           Primitive
lib/
  palette.ts              Single source for raw scene colours (monochrome)
  miniVicBrain.ts         3-tier client brain: realtime API → browser-Gemini → local KB
  utils.ts                cn() etc.
services/                 Optional dynamic backend (api-gateway, realtime-orchestrator,
                          llm-engine) — see docs/overhaul/SYSTEM-DESIGN.md
config/                   Observability/proxy configs (loki, prometheus, promtail, traefik)
scripts/validate/         21 validation phases + overhaul_static_audit.mjs
tests/                    Playwright + node test suites
docs/overhaul/            The overhaul spec + this documentation set
```

## Getting started

Requires Node 20.x (see `engines`) and npm.

```bash
npm install
npm run dev          # Next dev server on http://localhost:8080 (API routes active)
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server, port 8080, API routes active |
| `npm run build` | Production build (server mode) |
| `npm run build:static` | Static export → `out/` (Firebase) |
| `npm run lint` | Next/ESLint |
| `npm test` | Playwright smoke suite |
| `npm run test:e2e:bot` | Provider-backed MiniVic E2E (needs API keys) |
| `npm run validate:*` | Validation phases (Lighthouse, axe, infra, TTS, viseme…) |
| `node scripts/validate/overhaul_static_audit.mjs` | 7 static gates: tone / monochrome / asset-budget / parity / fonts (≤2 families) / secret scan / no `/performance-benchmark` in `out/` |

## Deployment

Static export on Firebase Hosting (deploy is **owner-gated** — local-first):

```bash
npm run build:static
firebase deploy --only hosting
```

CI (`.github/workflows/deploy.yml`): parallel gate jobs — **quality** (`tsc --noEmit` + static
audit), **lint**, **test** (chromium + webkit + firefox), **lighthouse**, **axe** — fan into
**build** → **deploy** on `main` (requires `FIREBASE_SERVICE_ACCOUNT` secret). Post-deploy
checks: [`docs/overhaul/SPEC.md` §12].

> API routes (`/api/chat-with-vic`, `/api/realtime/session`) are **not** in the static
> export. MiniVicBot detects this and falls back. Run `npm run dev` or deploy the
> `services/` stack to enable the live clone.

## Environment variables

Local dev: copy `.env.example` → `.env.local`. Never commit real keys. Required keys must
fail loud (the app crashes clearly — non-zero exit naming the missing key, never a silent
fallback — see SECURITY notes in [`docs/overhaul/SYSTEM-DESIGN.md`]). Provider keys: `OPENAI_API_KEY`, `GEMINI_API_KEY`,
`ELEVENLABS_API_KEY` (+ `ELEVENLABS_VOICE_ID`), `DID_API_KEY`.

> **Known config bug:** `.env.production` uses `DI_D_API_KEY`, `.env.example` uses
> `DID_API_KEY`, older docs say `D_ID_API_KEY`. Canonicalise to **`DID_API_KEY`** when wiring
> the live clone (tracked in SPEC defect register D-? / edge case EC-CFG-01).

## Documentation

| Doc | What it covers |
| --- | --- |
| [`docs/prompt.md`](docs/prompt.md) | **Binding source of truth** — the owner's requirements & success criteria. Everything else is kept in parity with it. |
| [`docs/overhaul/SPEC.md`](docs/overhaul/SPEC.md) | Requirements, acceptance criteria, **1 test case per requirement**, test plan, V&V (1:1 parity with `prompt.md`) |
| [`docs/overhaul/MVP-AND-ROLLOUT.md`](docs/overhaul/MVP-AND-ROLLOUT.md) | MVP scope, fan-out lanes, publish/rollback |
| [`docs/overhaul/ARCHITECTURE.md`](docs/overhaul/ARCHITECTURE.md) | System architecture (frontend + backend + infra + data flow) |
| [`docs/overhaul/SYSTEM-DESIGN.md`](docs/overhaul/SYSTEM-DESIGN.md) | Deployment topologies, sequence flows, state, security, scaling |
| [`docs/overhaul/MOTION-AND-FX-SPEC.md`](docs/overhaul/MOTION-AND-FX-SPEC.md) | UI/UX animation, visualisation, visual & after-effects specs |
| [`docs/overhaul/TECH-STACK.md`](docs/overhaul/TECH-STACK.md) | Stack, versions, rationale, constraints, upgrades |
| [`docs/overhaul/EDGE-CASES.md`](docs/overhaul/EDGE-CASES.md) | Exhaustive edge-case catalogue (the hard scenarios) |
| [`CLAUDE.md`](CLAUDE.md) | Operating guide for AI agents working in this repo |

## License

MIT — see `LICENSE`.
