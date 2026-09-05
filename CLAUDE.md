# CLAUDE.md — operating guide for agents working on this portfolio

This is **Vikram Deshpande's portfolio** (`forgotten-mistory`), a Next.js static export
deployed to Firebase Hosting at <https://forgotten-mistory.web.app>. **User instructions
always take precedence over this file.**

The binding requirements live in `docs/prompt.md`. This file is the map: what the site is
now, where things are, and the gates a change has to clear.

---

## What the site is

One page, six sections, in this order. Each is a directory under `components/sections/`
with its own CSS module and its own data file under `app/data/portfolio/`.

| # | id | heading | what it does |
|---|----|---------|--------------|
| 1 | `#hero` | Vikram Deshpande | the front door — name, role, three graded figures, two actions |
| 2 | `#about` | Ten dimensions, answered | the ten dimensions his own job-fit engine scores a candidate on, answered about himself |
| 3 | `#experience` | Sixteen years, to scale | every role drawn to its real duration on one axis, over a WebGL strata field |
| 4 | `#skills` | Calibration card | what was tested, where, and what was not — no proficiency bars |
| 5 | `#vitrine` | Six of thirty-eight | a horizontal carousel of six repositories, each with its limits printed beside what it does |
| 6 | `#listen` | Feedback & coffee? | four ways to reach him, plus the synthetic introduction, labelled as one |

Anything not in that list was removed in the rebuild. Do not restore a deleted section
by reintroducing its component — the sections after Skills were replaced deliberately
(`docs/prompt.md` R-16).

## Prime directives

1. **Two audiences are first-class:** employers and business clients. Every change serves
   at least one without harming the other.
2. **Evidence, not adjectives.** Every claim traces to the CV, LinkedIn, or a named
   repository. The tone linter in `scripts/validate/overhaul_static_audit.mjs` fails the
   build on boastful copy.
3. **Never grade a claim higher than its evidence.** The caliper mark
   (`components/marks/Caliper.tsx`) has three states and they are not interchangeable:
   `sourced` — measured, with a source a reader can go and check; `self-reported` — a CV
   figure with no published methodology behind it; `open` — sought, honestly not
   measurable, reason printed where the number would be. The hero's three figures are
   `self-reported`. An earlier pass marked them `sourced`; a test now fails if that
   happens again (`tests/content/content-check.spec.ts` CT-10).
4. **Monochrome, with gold as a claim.** Near-black inks, cool greys, luminous white.
   Gold (`--gold`) means one thing only: *this figure has a source*. It appears on closed
   caliper jaws, the "measured in production" mark, and live repository URLs. Nothing
   else. It is never a fill, a background, or a theme. Raw hex outside `app/globals.css`
   and `lib/palette.ts` fails the audit.
5. **Tests before features.** No behaviour change lands without a test that would have
   caught its absence.
6. **No secrets in client code or commits.** `~/.claude/.env.production` holds live keys
   and is read-only — never print it, never commit it, never modify it.

## Where things live

- **Content:** `app/data/portfolio/{hero,about,experience,skills,vitrine,listen,avatar}.ts`.
  This is the single source of truth for every word on the page — change facts only here.
  `app/data/generated/cv-fingerprint.ts` is written at build time by
  `scripts/build/cv_fingerprint.mjs`; do not hand-edit it.
- **Composition:** `app/page.tsx` (all six sections), `app/layout.tsx` (fonts, metadata,
  JSON-LD, the persistent chrome).
- **Sections:** `components/sections/<Name>/` — component, CSS module, and any WebGL
  child and GLSL beside it.
- **Shared:** `components/marks/Caliper.tsx` (the one mark the site asks a reader to
  learn), `components/gl/Scene.tsx` + `useGLCapability.ts` (every WebGL canvas mounts
  through these, which handle capability detection and context loss),
  `components/site/Navigation.tsx`, `components/MiniVicBot.tsx`.
- **Tokens:** `app/globals.css` `:root` — plus the nav, the MiniVic chrome, and element
  defaults. Everything else is a CSS module. `lib/palette.ts` is the only place raw hex
  lives for WebGL.
- **Tests:** `tests/{e2e,a11y,perf,visual,monochrome,content,overhaul}/` — 276 Playwright
  tests (`*.spec.ts`; the `tests/*.test.mjs` node:test files run with `node --test`). Visual baselines in `tests/baselines/`.
- **Validation:** `scripts/validate/overhaul_static_audit.mjs` — 10 gates, run on every
  change.

## Workflow

1. **Read** the section's data file and CSS module before changing it.
2. **Test first** — add or extend the assertion, then make it pass.
3. **Verify, all four:**
   ```bash
   npx tsc --noEmit
   npm run lint
   npm run build:static
   node scripts/validate/overhaul_static_audit.mjs     # must be 10/10
   PLAYWRIGHT_BASE_URL=http://127.0.0.1:5599 npx playwright test
   ```
4. **Look at it.** Screenshot the section at 1440, 1280, 834 and 390 CSS px. The suite
   catches broken; only your eyes catch ugly.
5. **Deploy** — autonomous, no approval needed. Push to `main`; `.github/workflows/deploy.yml`
   consolidates every branch into `main` (conflicts resolve in favour of the branch's newer
   change — nothing is skipped or escalated) and deploys within ten minutes (also on a
   ten-minute schedule), then verifies the live `build-commit` meta. Agents working in a
   worktree push their branch to `origin` when done; the pipeline merges and deletes it. To ship immediately from the VPS:
   ```bash
   git push origin HEAD:main && node scripts/deploy.mjs
   ```
   Never force-push, never rewrite history. Tests and audits run in `checks.yml` and report —
   they do not gate a deploy. **Ask before any paid ElevenLabs / D-ID / video-render call** —
   that is a cost gate, not a deploy gate.

## Running the tests

Playwright has no `webServer` and no `globalSetup`. Build the static export once and
serve `out/` yourself, then point the suite at it:

```bash
npm run build:static
python3 -m http.server 5599 --directory out &     # or any static server
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5599 npx playwright test
```

This is deliberate. Each spec used to run `npm run build:static` from its own
`beforeAll`; under `fullyParallel` those builds raced and corrupted each other's build
directory, failing ~46 specs at once for reasons unrelated to any of them.

To accept an intended visual change: `UPDATE_SNAPSHOTS=1 npx playwright test tests/visual`.
Look at the regenerated PNG before you commit it.

## Gotchas

- **Static export ≠ server.** `app/api/*` does not run on Firebase. The public site is
  entirely static; anything needing a server lives in `services/` and is optional.
- **`out/` is the deploy artifact.** `firebase.json` points at it. A stale `out/` deploys
  a stale site — always `npm run build:static` first. And always `git fetch` before
  working: a stale checkout once rolled production back a month.
- **Reachability is computed from Next.js convention files.** `page`, `layout`, `error`,
  `loading`, `not-found`, `robots`, `sitemap` are entry points the framework wires up and
  nothing imports. A dead-code scan that does not seed from all of them will report them,
  and everything they own, as dead.
- **Dead CSS is a build failure.** `TC-NFR-DEADCSS` fails the audit if `app/globals.css`
  contains a rule whose class selectors name classes no source file can render. If you
  delete a component, delete its styles in the same commit.
- **`prefers-reduced-motion` is not optional.** Every animation needs a static path, and
  the hero must be fully readable with WebGL unavailable — the scene is never the content.
- **DPR is capped** in the WebGL scenes for mobile frame rate. Don't raise it blindly.

## Definition of done

`tsc` clean · `lint` clean · static audit 10/10 · 276 Playwright green · build clean ·
LCP < 2.5 s · CLS < 0.05 · no asset over 500 kB · reduced-motion path works ·
keyboard-navigable · monochrome with gold only as a claim · every new sentence traceable ·
deployed and verified against the live URL.
