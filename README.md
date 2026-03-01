# Forgotten Mistory — Portfolio & Space Experience

High-concept personal portfolio built with Next.js 14 (App Router), TypeScript, Tailwind, and a Three.js/R3F space scene. Features glassmorphism UI, interactive detail flyouts, smooth scrolling, and a realtime AI media pipeline (LLM -> ElevenLabs -> D-ID session orchestration).

- **Production:** https://forgotten-mistory.web.app (Firebase Hosting) — update if your deployment domain differs.
- **Tech stack:** Next.js 14, React 18, TypeScript, TailwindCSS, @react-three/fiber + drei + postprocessing, GSAP, Lenis, Firebase Hosting.
- **Visuals:** Fullscreen starfield/nebula background, morphing SVG gradients, glass cards, custom cursor, preloader, and FloatingDetailBox animations synced to hover/click triggers.
- **Realtime AI pipeline:** `/api/realtime/session` and `/ws/realtime/:sessionId` stream token/audio/avatar orchestration through the API gateway and gRPC realtime orchestrator.

## Getting Started

Requirements: Node 20.x (matches `engines`), npm.

```bash
npm install
npm run dev
# open http://localhost:8080
```

## Available Scripts

- `npm run dev` — Next dev server on port 8080.
- `npm run build` — production build.
- `npm start` — serve the production build.
- `npm run lint` — lint with Next/ESLint config.
- `npm run validate:provider-keys` — validate configured provider API keys from `.env` against official provider auth/model endpoints.

## Environment Variables

Create `.env.local` for local development:

```bash
# AI + Realtime (optional, used by /api/chat and /api/realtime/session)
GEMINI_API_KEY=your_key
POLLO_AI_API_KEY=your_key          # optional fallback/telemetry
ELEVENLABS_API_KEY=your_key        # optional TTS
ELEVENLABS_VOICE_ID=voice_id       # required if using ElevenLabs
DID_API_KEY=your_key               # required for D-ID stream creation
ORCHESTRATOR_GRPC_ADDR=realtime-orchestrator:50051

# Frontend debug beacons (optional)
NEXT_PUBLIC_ASSET_DEBUG_ENDPOINT=   # e.g. https://example.com/debug or omit to disable
NEXT_PUBLIC_REALTIME_WS_URL=        # optional explicit ws/wss base
```

## Provider Key Validation

Run provider key validation before deploy:

```bash
npm run validate:provider-keys
```

The validator checks configured keys against official provider APIs:
- OpenAI: `GET /v1/models`
- Gemini: `GET /v1beta/models`
- ElevenLabs: `GET /v1/models`
- D-ID: `GET /agents`

## Project Structure

- `app/` — Next.js App Router pages, layout, global styles, and the R3F `SpaceScene`.
- `components/` — shared UI like `FloatingDetailBox`.
- `public/` — static assets, vendor scripts (GSAP/ScrollTrigger), and `script.js` for smooth scrolling, cursor, and telemetry UI hooks.
- `tests/` — Playwright end-to-end setup.
- `firebase.json` — Firebase Hosting config (serves `.next` output).

## Key Features

- **Space backdrop:** Instanced stars, nebula shader, bloom/noise post-processing, shooting stars; camera handle exposed via `window.spaceApp` for downstream animations.
- **Detail flyouts:** `FloatingDetailBox` renders animated glassmorphism panels anchored to trigger rects with GSAP timelines and Three.js overlays.
- **Smooth interactions:** Lenis-driven scroll, custom cursor trail, preloader, morphing gradients, and telemetry widgets.
- **Realtime orchestration:** API gateway proxies realtime websocket events while a dedicated gRPC orchestrator streams model output, TTS chunks, and avatar readiness events.

## Deployment

The project is configured for Firebase Hosting (`.firebaserc`, `firebase.json`). Typical flow:

```bash
npm run build
firebase deploy --only hosting
```

Update the production URL above if your hosting domain changes.

## License

MIT — see `LICENSE`.
