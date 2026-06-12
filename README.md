# Forgotten Mistory — Portfolio & Space Experience

Personal portfolio for **Vikram Deshpande** — Scrum Master / Project Manager (Australian Taxation Office, Payday Super program) and AI solutions architect. Built with Next.js 14 (App Router), TypeScript, Tailwind, Framer Motion, and a Three.js/R3F starfield scene.

- **Production:** https://forgotten-mistory.web.app (Firebase Hosting, static export)
- **Tech stack:** Next.js 14 · React 18 · TypeScript · Tailwind CSS 4 · Framer Motion · @react-three/fiber + drei + postprocessing · Firebase Hosting
- **Architecture:** a fully React-native runtime — every interaction (preloader, navigation, telemetry simulation, accordions, architecture map, hidden terminal, cursor, parallax) is a typed client component animated with Framer Motion. There is no imperative DOM script layer.

## Content Model

All biographical and career content lives in two typed modules and is kept in
strict parity with the standalone CV served at `public/docs/Vik_Resume_Final.pdf`:

| File | Purpose |
| --- | --- |
| `app/data/siteContent.ts` | Hero copy, about, experience roles, skills, projects, contact |
| `app/data/resumeContent.ts` | Hero outcome cards + FloatingDetailBox expansions |

To update career content, edit those files and regenerate the CV PDF — nothing
else needs to change.

## Project Structure

```
app/
  layout.tsx            Root layout: fonts, metadata, JSON-LD schema
  page.tsx              Single-page composition of all sections
  globals.css           Design tokens + component styles
  data/                 Typed content layer (see above)
  components/           SpaceScene (R3F starfield)
components/
  site/                 React runtime: Preloader, Navigation, CursorGlow,
                        Reveal, TelemetryPanel, ExperienceAccordion,
                        ExpandableCard, ArchitectureMap, ProjectsCarousel,
                        GithubFeed, HiddenTerminal, HeroAvatar
  MiniVicBot.tsx        AI assistant (degrades gracefully on static hosting)
  FloatingDetailBox.tsx Outcome-card flyout
services/
  realtime-orchestrator/  Optional gRPC/WebSocket backend for MiniVic realtime mode
```

## Getting Started

Requirements: Node 20.x (matches `engines`), npm.

```bash
npm install
npm run dev
# open http://localhost:8080
```

## Scripts

- `npm run dev` — Next dev server on port 8080 (API routes active).
- `npm run build` — production build (server mode).
- `npm run build:static` — static export to `out/` for Firebase Hosting.
- `npm run lint` — Next/ESLint.
- `npm test` — Playwright smoke suite (`tests/site.spec.ts`).
- `npm run test:e2e:bot` — provider-backed MiniVic E2E suite (requires API keys).
- `npm run validate:*` — operational validation pipeline (Lighthouse, a11y, infra phases).

## Deployment

Production is a **static export** on Firebase Hosting:

```bash
npm run build:static
firebase deploy --only hosting
```

CI (`.github/workflows/deploy.yml`) runs lint → Playwright tests → static build,
then deploys to the live channel on pushes to `main` (requires the
`FIREBASE_SERVICE_ACCOUNT` repository secret).

> **Note:** API routes (`/api/chat-with-vic`, `/api/realtime/session`) are not
> part of the static export. MiniVicBot detects this and falls back to a
> direct-contact message. Run `npm run dev` or deploy the realtime
> orchestrator to enable live chat.

## Environment Variables

Create `.env.local` for local development (see `.env.example`):

- `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`, `DID_API_KEY` — MiniVic provider pipeline
- `NEXT_PUBLIC_REALTIME_WS_URL` — explicit realtime WebSocket origin (optional)

## License

MIT — see `LICENSE`.
