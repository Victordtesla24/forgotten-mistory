# forgotten-mistory

The portfolio of Vikram Deshpande: one page with seven sections (hero, headline figures,
work, experience, capabilities, about, contact), a privacy policy, terms, and "Ask Mini Vic", a
text chat about his experience. It is a static export served by Firebase Hosting at
<https://forgotten-mistory.web.app>.

## Stack

- Next.js 15 App Router with `output: 'export'`, React 19, TypeScript (strict)
- Tailwind CSS 4, with every colour, size and radius defined as a token in `app/globals.css`
- `motion` for interaction, native CSS scroll-driven animation for entrances, server-rendered
  SVG visuals drawn with `d3-scale`
- Playwright with `@axe-core/playwright` for the tests, including checks that the pages run
  clean under the Content-Security-Policy in `firebase.json` and that every page revalidates
  on each load
- Firebase Hosting for the site; the chat backend in `functions/` is a separate Cloud
  Functions deploy

Node 22 or newer (see `.node-version`).

## Commands

```bash
npm run dev      # dev server on http://localhost:4100
npm run check    # typecheck and lint
npm run build    # static export to out/
npm test         # Playwright smoke, axe, CSP and hosting-header tests against out/ (build first)
npm run ship     # the whole release, same as scripts/ship.sh
node scripts/brand-assets.mjs  # regenerate og-image.png, icon.png and apple-icon.png from the tokens
```

`npm test` serves `out/` on port 4173; set `PORT` to use another.

## How a release works

`scripts/ship.sh` is the release. It can be run from the main clone or from a linked
worktree and does these things in order, stopping at the first failure:

1. refuses to start with uncommitted changes
2. takes a machine-wide lock so two releases never overlap
3. rebases onto `origin/main` (and aborts with a message if that conflicts)
4. `npm run check`
5. `npm run build`
6. `npm test`
7. pushes `HEAD` to `main`
8. deploys to Firebase Hosting
9. polls the live site until its `build-commit` meta equals the commit and every page and
   payload it serves revalidates on each load, then prints `SHIPPED <sha>`

Every build carries the short commit in `<meta name="build-commit">` (and in the footer).
The push in step 7 also starts `.github/workflows/ship.yml`, which checks, builds and tests
again and deploys only if the live site is not already serving that commit.

## Where things live

- `content/` holds every fact on the page as typed data. Change facts there, and only to
  match the CV in `public/docs/`.
- `app/` has the routes and `globals.css`; `components/` has the primitives, site chrome,
  page sections, assistant and visuals; `lib/` has the assistant's transport.
- `tests/` is the Playwright suite; `scripts/` holds the release, screenshot and brand-image
  helpers, and `scripts/ops/` the keep-warm ping for the chat backend.
- `docs/DESIGN.md` is the design and engineering brief; `docs/COPY-STYLE.md` is the style guide
  for every word on the page; `CLAUDE.md` is the short guide for working in the repository.

Everything from before the November 2026 rebuild is kept only in git history, under the tag
`pre-rebuild-2026-11-10`.
