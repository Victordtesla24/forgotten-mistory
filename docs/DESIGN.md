# Design brief — portfolio rebuild (2026-11)

The single source of truth for how this site looks, moves and is built. Decisions here are
final for the rebuild; where a detail is not specified, choose the option that is calmer,
more legible and cheaper to maintain. Background research with sources:
`docs/design/research-2026-11.md`.

## 1. Who it is for and what it must do

Vikram Deshpande — Melbourne — sixteen years of delivery leadership (ATO, ANZ, NAB,
Microsoft, Telstra) and AI solutions architecture. Two readers: a hiring manager or
recruiter, and a business client. Within the first screen either reader must learn who he
is, see two or three scoped proof points, and have one obvious next action. The page must
feel engineered and exact: quiet surfaces, confident type, and visuals that are drawn from
his real data rather than decoration.

## 2. Content rules (non-negotiable)

1. Every fact, figure, date, employer, repository and sentence of substance comes from
   `content/`. Never invent or round a figure, never add a claim, employer, technology,
   award or testimonial.
2. A figure always travels with its scope line (for example "≈92% · evidence effort removed ·
   ATO Payday Super, 200+ SIT scenarios"). The −38% figure keeps its qualifier "measured
   against a simulated budget, not live traffic" wherever it appears.
3. Where a role has no published figure, show nothing in that slot — no "no published
   figure" labels.
4. Section headings and UI labels may be rewritten in plain language (Work, Experience,
   Capabilities, About, Contact) but must not state facts that are not in `content/`.
5. Each project card keeps its "known limits" line. Honesty is part of the brand; it is
   presented plainly, not as an audit apparatus (no calipers, checksums, "self-reported"
   badges, observatories or build ids in the reading path).
6. The synthetic-media disclosure stays next to any generated voice or likeness, and such
   media never plays without an explicit click.

## 3. Art direction — "Calibrated"

Dark-first with a first-class light theme. Neutral surfaces, one cool accent, one warm
proof colour, hairline borders, generous space. The signature motif is the **ruler**: fine
tick marks with mono numerals, used for the hero's career scale, section dividers and the
experience timeline. It is the one ornament; do not add others.

### Tokens (define once in `app/globals.css`, expose through Tailwind 4 `@theme inline`)

| token | dark | light | use |
|---|---|---|---|
| `--bg` | `#0b0d10` | `#f6f5f1` | page |
| `--surface` | `#12151a` | `#ffffff` | cards, panels |
| `--raised` | `#181c22` | `#fbfaf7` | hover, popovers |
| `--line` | `#232830` | `#dcdad3` | hairlines, borders |
| `--line-strong` | `#343b46` | `#c4c1b8` | emphasised borders, ticks |
| `--text` | `#eceef1` | `#14161a` | body, headings |
| `--muted` | `#9aa3b0` | `#566070` | secondary text (≥ 4.5:1 on bg and surface) |
| `--accent` | `#7c9cff` | `#2f4fd8` | links, focus, active state, one emphasised word |
| `--accent-soft` | `rgb(124 156 255 / 0.12)` | `rgb(47 79 216 / 0.10)` | glows, selected fills |
| `--proof` | `#e8c27a` | `#8a5a00` | measured figures and their marks only |

Dark values sit on `:root`; light values apply under `[data-theme="light"]` and under
`@media (prefers-color-scheme: light)` when no explicit theme is stored. Set `color-scheme`
accordingly. No raw colour values outside `globals.css` (canvas/shader code reads the
tokens from computed style or from one exported palette module). Radii: 8 / 12 / 20 px.
Spacing: 4 px base; sections `clamp(5rem, 10vw, 9rem)` apart; content width 72rem with
`clamp(1.25rem, 4vw, 2.5rem)` gutters.

Depth: 1 px `--line` borders, an inner top highlight on cards
(`inset 0 1px 0 rgb(255 255 255 / 0.04)` in dark), shadows only on floating layers
(menu, assistant panel). One soft radial `--accent-soft` glow behind the hero. A faint
noise texture (inline SVG `feTurbulence` data URI, ≤ 4% opacity) on the page background.

### Typography (self-hosted through `next/font/google`)

- **Geist** — display and text. **Instrument Serif** italic — at most one phrase per
  heading. **Geist Mono** — eyebrows, figures, dates, tags, ruler numerals.
- Hero `clamp(2.75rem, 1.5rem + 6vw, 6rem)` / 1.0 / −0.035em / 600.
  H2 `clamp(2rem, 1.3rem + 2.6vw, 3.25rem)` / 1.08 / −0.03em / 600.
  H3 `1.25–1.5rem` / 1.25 / −0.01em / 600. Body `1.0625rem` / 1.6. Small `0.9375rem`.
  Eyebrow mono `0.8125rem`, uppercase, `+0.08em`.
- Nothing readable below 13 px. Measure ≤ 68ch. `text-wrap: balance` on headings,
  `pretty` on paragraphs, `tabular-nums` on every figure.

## 4. Page structure

One page, in this order, each a `<section id>` with an `aria-labelledby` heading. Header:
slim sticky bar — wordmark "Vikram Deshpande", anchors (Work, Experience, Capabilities,
About, Contact), theme toggle, "Ask Mini Vic" button, and a primary "Contact" action; on
small screens a menu button opens a full-height sheet (native `<dialog>`). Active section
is highlighted. A 2 px scroll-progress line sits under the header.

| id | section | what it shows |
|---|---|---|
| `top` | Hero | eyebrow (name · Melbourne · availability), H1 "Delivery leader and *AI solutions* architect.", the one-sentence statement, primary action "View selected work", secondary "Download CV", small links (LinkedIn, GitHub, Email); beside it the **career scale** panel: the eight roles drawn to scale on a 2010–2026 ruler that draws itself on load, with the current role marked; behind everything a slow shader field |
| `proof` | Proof strip | the three headline figures with count-up and scope lines; a row of employer names as text wordmarks |
| `work` | Selected work | six projects as a bento grid; each card: title, one-line description, an animated schematic of how it works, "known limits", repository link and live link where one exists |
| `experience` | Experience | the interactive to-scale timeline (select a role by pointer or keyboard), the selected role's title, employer, dates, headline figure and bullets; all roles also present as an accessible list |
| `capabilities` | Capabilities | the seventeen capabilities grouped by where they were proven, each with its evidence line and status (in production / outside production / in progress); filterable; an evidence map visual linking capabilities to programmes and repositories |
| `about` | About | portrait, short first-person bio assembled from existing sentences, "how I work" (selected answers from the ten dimensions), education and credentials |
| `contact` | Contact | the availability headline, one primary action (email), "Book a 20-minute call", phone, LinkedIn, GitHub, the Melbourne coffee line |

Plus the footer (privacy, terms, CV, repository link, a small build id), `/privacy`,
`/terms`, a 404 and an error page — all in the same system.

**Ask Mini Vic** is a text chat about Vikram's experience: a launcher (bottom-right and in
the header) opening a panel (`<dialog>`, focus-trapped, Escape closes, full-screen sheet on
small screens) with suggested questions, streamed answers, a clear "AI assistant — answers
may be wrong" note and a retry state. It keeps the existing transport
(`lib/assistant/`, Cloud Run origin first, then the `/api/chat` rewrite) and the local
fallback answers. No microphone, no speech synthesis, no avatar video.

## 5. Motion and visuals

Principles: motion explains or rewards, never blocks; content is visible and complete
without it; nothing loops in the reader's face; one signature moment per section.

- **Durations** 160 ms (hover), 320 ms (state), 700 ms (entrance). **Easing**
  `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Entrances and scroll effects** use native CSS scroll-driven animations
  (`animation-timeline: view()` / `scroll()`), wrapped in
  `@supports (animation-timeline: view())` and
  `@media (prefers-reduced-motion: no-preference)`. Without support the content is simply
  present. Never hide content behind JavaScript-added classes.
- **Stateful interaction** (menu, panel, filters, timeline selection, layout changes) uses
  `motion` (`motion/react`) through `LazyMotion` + `m` with `domAnimation`, and
  `<MotionConfig reducedMotion="user">`.
- **Figures** count up once when first visible with `@number-flow/react`.
- **Pointer polish** (fine pointers only): spotlight follow on cards via CSS custom
  properties, a subtle magnetic pull on the primary action. No custom cursor.
- **Theme change** uses the View Transitions API where available.
- **Data visuals** are server-rendered SVG with `d3-scale` maths: always a
  text alternative, keyboard access for anything interactive, tokens for every colour.
- **The shader field** (hero only) uses `@paper-design/shaders-react` (pinned exactly),
  mounted through a single `VisualStage` wrapper that: renders a CSS-gradient poster first,
  mounts the canvas after load when it is in view and WebGL2 is available, pauses when
  off-screen or the tab is hidden, caps pixel count, stops animating under reduced motion,
  survives context loss by falling back to the poster, and is `aria-hidden`. Text over it
  keeps ≥ 4.5:1 contrast through a scrim. It is never the LCP element.
- Not used: GSAP, smooth-scroll libraries, three.js / React Three Fiber, charting suites,
  custom cursors, autoplaying media, scroll-jacking, service workers. The one exception is
  `public/sw.js`: a worker that deletes the caches of the old site's worker, unregisters
  itself and reloads the open tab, so returning visitors are served the current site.

## 6. Engineering

- Next.js 15 App Router, `output: 'export'` always, React 19, TypeScript strict, Tailwind
  CSS 4 (CSS-first `@theme`). Server Components by default; a file is a Client Component
  only when it needs state, effects or browser APIs. Build fails on type or lint errors.
- Layout of the source tree:
  `app/` (routes, `globals.css`), `content/` (typed facts), `components/ui/` (primitives),
  `components/site/` (header, footer, theme), `components/sections/<Name>/`,
  `components/assistant/`, `components/visuals/`, `lib/`, `tests/`, `scripts/`.
- Styling: Tailwind utilities driven by the tokens; a CSS module only where a visual needs
  keyframes or complex selectors. No dead styles, no commented-out code, no TODOs, no
  placeholder copy or lorem ipsum.
- Accessibility: WCAG 2.2 AA. One `h1`, ordered headings, landmark roles, skip link,
  visible focus (2 px accent ring, 2 px offset), targets ≥ 44 px on touch, no horizontal
  scroll from 320 px to 1920 px, full keyboard operation, reduced-motion path for
  everything.
- Performance budgets: LCP < 2.5 s and CLS < 0.05 on a mid-range phone, the LCP element is
  hero text, heavy visuals load lazily after first paint, no single asset over 500 kB.
- The live page carries `<meta name="build-commit" content="<8-char sha>">`; the deploy
  check compares it with the commit that was shipped.

## 7. Definition of done for any change

`npm run check` (typecheck + lint) clean · `npm run build` clean · `npm test` (smoke, axe,
CSP and hosting headers) green · looked at in a browser at 390, 834, 1440 px in both themes ·
shipped with `scripts/ship.sh` · live `build-commit` equals the pushed commit.
