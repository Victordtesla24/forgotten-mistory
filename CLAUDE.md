# CLAUDE.md — working on this portfolio

Vikram Deshpande's portfolio: a Next.js 15 static export on Firebase Hosting at
<https://forgotten-mistory.web.app>. User instructions always take precedence over this file.

The site was rebuilt in November 2026. `docs/DESIGN.md` is the source of truth for how it
looks, moves and is built — read it before changing anything visible.

## Map

- `content/` — every fact on the page, typed, in two levels: what is always on screen and
  what opens on demand. Change facts only here, and only to match the CV
  (`public/docs/Vikram_Deshpande_CV.pdf`), LinkedIn or a named repository. Write every word to
  `docs/COPY-STYLE.md`; `tests/hygiene.spec.ts` fails the build on a banned label or phrase.
- `app/` — routes (`page.tsx`, `privacy`, `terms`, `not-found`, `error`), `layout.tsx`
  (fonts, metadata, JSON-LD), `globals.css` (design tokens).
- `components/ui/` primitives, including the shared `DetailPanel` · `components/site/` header,
  footer, theme, Motion control · `components/sections/<Name>/` one directory per page section ·
  `components/assistant/` the Ask Mini Vic chat · `components/visuals/` the React glue of the
  stage (`StageMount`, `StageView`).
- `lib/gl/` — the three.js stage, framework-free: one shared canvas, scissored views over DOM
  placeholders, render on demand, tiers `high`/`low`/`still`/`off`. Three is loaded lazily and
  never reaches the initial JavaScript. `lib/motion.ts` holds the motion tokens (mirrored as CSS
  custom properties) and the Motion on/off switch. `lib/timeline.ts` is the one UTC time scale every
  timeline takes its positions from; `lib/entrance.ts` is the hero's entrance, written once for the CSS
  and the stage; `lib/readings.ts` is what the three headline readings draw, and `readingLayout` there is the one layout both the stage's views and the DOM drawing (`lib/place-reading.ts`) take, so the two coincide to the pixel. Review hooks: `?gl=off|still|low|high`,
  `?motion=off`, `data-*` on the canvas, `window.__stage`.
- `lib/assistant/` — chat transport (Cloud Run origin, then the `/api/chat` rewrite) and
  local fallback answers. The backend lives in `functions/` and is deployed separately
  (`firebase deploy --only functions`); UI work never touches it.
- `tests/` — the Playwright suite (smoke, axe, CSP, hosting headers, content, stage and panels)
  that runs against the built `out/`.
- `scripts/` — `ship.sh` is the whole release (check, build, test, push to `main`, deploy,
  verify, then ask the live assistant a real question through `check-assistant.sh`, which
  exits 2 when it cannot answer); `brand-assets.mjs` regenerates the social card and icons;
  `screenshot.mjs` takes contact sheets; `ops/` keeps the chat backend warm.

## Rules

1. Never invent a fact, figure, employer or claim. Every figure keeps its scope line.
2. Colours, type and spacing come from the tokens in `app/globals.css`. No raw colour
   values elsewhere.
3. Content must be visible and complete with JavaScript animations off, with
   `prefers-reduced-motion`, and without WebGL.
4. No placeholders, TODOs, commented-out code or unused files. If you remove a component,
   remove its styles, tests and assets in the same commit.
5. No secrets in the repository or the client bundle.
6. Generated voice or likeness never plays without a click and always sits beside its
   disclosure.

## Commands

```bash
npm run dev          # local dev server
npm run check        # typecheck + lint
npm run build        # static export to out/
npm test             # Playwright suite against out/ (build first)
node scripts/brand-assets.mjs  # regenerate og-image.png, icon.png, apple-icon.png
scripts/ship.sh      # check, build, test, push to main, deploy to Firebase, verify live
```

Pushing to `main` also runs `.github/workflows/ship.yml`, which builds, tests and deploys
when the live site is not already serving that commit.

On this VPS Playwright uses the system Chrome (`channel: 'chrome'`); WebGL in headless
Chrome needs the SwiftShader flags already set in `playwright.config.ts`. Software rendering
is detected and runs the stage at the `still` tier; add `?gl=high` to see it animate.

## Definition of done

`npm run check`, `npm run build` and `npm test` all clean; the change looked at in a
browser at 390, 834 and 1440 px in both themes; shipped with `scripts/ship.sh`; the live
`build-commit` meta equals the pushed commit.
