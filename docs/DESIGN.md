# Design brief — portfolio rebuild (2026-11, revision 2)

The single source of truth for how this site looks, moves and is built. Where a detail is
not specified, choose the option that is more legible, more precise and cheaper to
maintain. Research with sources: `docs/design/research-2026-11.md` (direction, type, UX)
and `docs/design/research-2026-11-webgl.md` (three.js stage, timelines, 3D data visuals,
craft). Revision 2 replaces revision 1 in three ways the owner ordered: three.js is the
visual engine, every timeline is horizontal and as wide as the browser, and each section
must pass the scored quality gate in section 9 before the next one is started.

## 1. Who it is for and what it must do

Vikram Deshpande — Melbourne — sixteen years of delivery leadership (ATO, ANZ, NAB,
Microsoft, Telstra) and AI solutions architecture. Two readers: a hiring manager or
recruiter, and a business client. Within the first screen either reader learns who he is,
sees scoped proof, and has one obvious next action. The page must feel engineered and
exact, and every section carries one visual a reader would remember, drawn from his real
data and built to the standard of the best studio sites of 2026.

## 2. Content and writing rules (non-negotiable)

1. **True.** Every fact, figure, date, employer, repository and credential is true to the
   CV (`public/docs/Vikram_Deshpande_CV.pdf`) and lives in `content/`. Never invent, inflate
   or round a figure; never add a claim, employer, technology, award or testimonial. A
   result obtained in simulation or outside production is named as such in a word or two
   ("in simulation"), never presented as a production result.
2. **Expert voice.** Copy reads like the profile of a sought-after senior delivery leader
   and AI solutions architect: confident, specific, outcome-first, active verbs, numbers
   with their scope inside the sentence ("cut evidence effort ≈92% across 200+ SIT
   scenarios"). `docs/COPY-STYLE.md` is the style guide and the benchmark it was derived
   from.
3. **No defensive writing.** No labels such as "Evidence", "self-reported", "known
   limits", "what I look for"; no hedging, apology, disclaimers about the site or its
   method, or commentary on why something is listed. A constraint appears only as a
   deliberate engineering decision, stated positively, and only in a detail panel.
4. **Visual first, words second.** What is always on screen is a visual, a number or a
   few words. Sentences live in detail panels. Each section has a word budget for
   always-visible copy (section 4).
5. **Nothing lost.** Every detail a reader could want is one interaction away in a detail
   panel and is present in the HTML (expanded inline when JavaScript is off).
6. A visual may encode only what the data states: counts, durations, dates, group sizes,
   links between things. It never implies a quantity the content does not give.
7. Generated voice or likeness never plays without a click and always sits beside a
   disclosure. No readable text is ever carried only by a canvas.

## 3. Art direction — "Calibrated"

Dark-first with a first-class light theme. Neutral surfaces, one cool accent, one warm
colour reserved for measured figures, hairline borders, generous space. The one motif is
the **ruler**: fine tick marks with mono numerals. It is the hero field, the experience
timeline (the one career scale on the page) and the closing scene; section dividers are
plain hairlines with no ticks or numerals. Do not add a second motif.

### Tokens (defined once in `app/globals.css`, exposed through Tailwind 4 `@theme inline`)

| token | dark | light | use |
|---|---|---|---|
| `--bg` | `#0b0d10` | `#f6f5f1` | page |
| `--surface` | `#12151a` | `#ffffff` | cards, panels |
| `--raised` | `#181c22` | `#fbfaf7` | hover, popovers |
| `--line` | `#232830` | `#dcdad3` | hairlines, borders |
| `--line-strong` | `#343b46` | `#c4c1b8` | emphasised borders, ticks |
| `--text` | `#eceef1` | `#14161a` | body, headings |
| `--muted` | `#9aa3b0` | `#566070` | secondary text (≥ 4.5:1) |
| `--accent` | `#7c9cff` | `#2f4fd8` | links, focus, selection, one emphasised phrase |
| `--accent-soft` | `rgb(124 156 255 / 0.12)` | `rgb(47 79 216 / 0.10)` | glows, selected fills |
| `--proof` | `#e8c27a` | `#8a5a00` | measured figures and their marks only |

No raw colour values outside `globals.css`. WebGL code reads the tokens from computed
style through one palette module and recolours in place when the theme changes. Radii
8 / 12 / 20 px. Spacing on a 4 px base; sections `clamp(5rem, 10vw, 9rem)` apart; text
measure inside a 72rem container with `clamp(1.25rem, 4vw, 2.5rem)` gutters. Full-bleed
elements are full-width blocks (never `100vw`, which includes the scrollbar).

### Typography (self-hosted through `next/font/google`)

Geist for display and text; Instrument Serif italic for at most one phrase per heading;
Geist Mono for eyebrows, figures, dates, tags and ruler numerals. Hero
`clamp(2.75rem, 1.5rem + 6vw, 6rem)` / 1.0 / −0.035em / 600. H2
`clamp(2rem, 1.3rem + 2.6vw, 3.25rem)` / 1.08 / −0.03em / 600. H3 1.25–1.5rem / 1.25.
Body 1.0625rem / 1.6. Eyebrow mono 0.8125rem uppercase +0.08em. Nothing readable below
13 px. Measure ≤ 68ch. `text-wrap: balance` on headings, `tabular-nums` on figures.

## 4. Page structure and each section's signature visual

One page, in this order; each a `<section id>` with an `aria-labelledby` heading. Header:
slim sticky bar (wordmark, anchors, theme toggle, "Ask Mini Vic", primary "Contact");
below 900 px a menu button opens a `<dialog>` sheet. A 2 px scroll-progress line under
the header. Footer: privacy, terms, CV, repository, a link to report a site problem, a "Motion on/off" control. The build id is in
`<meta name="build-commit">` only.

**A compact page.** Vertical scrolling is kept to the minimum: on a 1440×900 desktop each
section fits one screen and the whole page is at most 6.5 screens; on a 390×844 phone
each section is at most 1.6 screens and the page at most 9. Sections show visuals,
numbers and a few words; everything else opens in a **detail panel** (below). Sets of
things (projects, roles, capabilities, principles) are laid out horizontally and are
never stacked as long vertical lists. One exception: below 640 px the five principles of
About are a column of closed one-line rows, so a principle that is opened is read at the
full width of the phone. Every sideways row has an accessible name.

| id | section | always visible (word budget) | signature visual (three.js, from real data) | in detail panels |
|---|---|---|---|---|
| `top` | Hero, with the headline figures (`#proof` is the anchor of the figures group) | eyebrow, H1 "Delivery leader and *AI solutions* architect.", one short line, two actions, three small links (≤ 45 words) | **Ruler field, three readings, one lit line.** Beside the type, in one plane to the right of the headline block, receding lanes of fine ticks drift and lean with the pointer; the plane fades in over a long ramp and out above the readings, so no scrap of it stands anywhere else. Under the type, the three headline figures as a row of live readings whose marks are the number, each ending in a line of key (what one mark stands for, and for the evidence reading what its fill stands for): 100 blocks of 100 devices under a sweeping 200 ms line (all 10,000 points in the panel); 200 separate scenario cells whose fill falls to the ≈8% that is left; 40 marks across two rows, one for each practitioner, with no squad drawn because the CV gives no squad sizes. Every mark is countable at every size and screen. On a wide screen one lit vertical line falls from the field to the hero's bottom edge on the x where the Experience timeline has its "now" edge, so the hero hands over to the page's one career timeline. On load: the field, type, then the readings count up. | each figure: the story behind the number |
| `experience` | Experience | heading and the timeline's own labels (≤ 40 words) | **The full-width timeline.** A horizontal 2010–2026 axis, edge to edge, bars to scale in light, a playhead that follows pointer, keys and touch, and a compact card for the role under it. See section 7. | the role: title, employer, dates, headline figure as a small infographic, achievements |
| `work` | Selected work | heading and six cards: name plus one line each (≤ 70 words) | **Six working schematics.** A horizontal set of six cards, each an isometric diagram of that project's stages with packets travelling its real path. Idle is calm; hover, focus or tap runs the flow and names the stage. | the project: what it does, how it works with the schematic enlarged and steppable, stack, engineering decisions, repository and live links |
| `capabilities` | Capabilities | heading, domain names, capability names (labels only) | **Capability constellation.** Capabilities grouped by domain and linked to the programmes, repositories and credentials where they were applied, as a node-link field with depth. Hover, focus or tap lights a capability and where it was applied; domain filters re-form the field. | the capability: where it was applied and the outcome |
| `about` | About | portrait, three sentences, principle titles, credential names (≤ 90 words) | **Portrait with depth.** The photograph leans and relights with the pointer from a baked depth map. Working principles are a horizontal strip of cards to drag or arrow through. Education and credentials are compact chips (the CV gives them no dates, so they are never drawn on an axis). | each principle in full; each credential |
| `contact` | Contact, with the footer | one line, the primary action, a control that copies the email address, four links (≤ 40 words) | **The ruler resolves.** The hero's field returns and settles into a single baseline from 2010 to now, the "now" tick lit beside the primary action. | — |

**Detail panels.** One shared primitive (`components/ui/DetailPanel`): a native `<dialog>`
that grows out of the element that opened it (View Transitions where available, a
scale-and-fade spring otherwise), centred and at most 880 px wide on desktop, a bottom
sheet on phones; focus-trapped, closed by Escape, backdrop, a close button and the
browser's back button; each panel has its own URL fragment so it can be linked to;
previous / next move through the set without closing. Panels are visual too: a figure,
schematic or small infographic leads, text follows in short blocks. With JavaScript off
the same content is expanded inline.

Plus `/privacy`, `/terms`, a 404 and an error page in the same system. **Ask Mini Vic** is
a text chat (`<dialog>`, focus-trapped, full-screen sheet on phones) on the existing
transport in `lib/assistant/`; no microphone, speech or avatar.

Every visual has three layers, built in this order: (1) the **semantic layer** in the
server HTML — real text, lists, buttons and an SVG or CSS drawing of the same data, which
is complete and good-looking on its own; (2) the **light layer** in WebGL — depth, glow,
motion — drawn behind or between the DOM, `aria-hidden`; (3) **interaction**, always on
real DOM elements, which drive both layers. Remove layer 2 and nothing is lost but light.

## 5. The stage (three.js)

- **Engine.** `three@0.187.0`, plain three.js with hand-written GLSL `ShaderMaterial`s
  on `WebGLRenderer` (WebGL2). Not used: React Three Fiber, drei, the postprocessing
  library, WebGPU/TSL, troika or any in-canvas text, GSAP, smooth-scroll libraries,
  anything fetched from a CDN, eval, blob workers.
- **One context.** A single canvas for the whole page, attached to the page and moved
  with the scroll position each frame, so it stays registered with the DOM under fast
  scrolling. Each visual is a *view*: a DOM placeholder whose rectangle becomes a
  viewport and scissor. Views are measured only while near the viewport.
- **Code shape.** `lib/gl/` is framework-free TypeScript: `stage.ts` (renderer, the one
  frame loop, view registry, quality tiers, clock), `palette.ts` (tokens → shared colour
  uniforms, sRGB-exact, no tone mapping), `pointer.ts` (one pointer bus), `ruler.ts`
  (the shared tick geometry), `glsl/` (shared snippets: analytic anti-aliasing, dither,
  grain) and one module per visual in `lib/gl/views/`. React sees it through
  `components/visuals/StageMount.tsx` (loads the engine after first paint, once a view
  is near) and `components/visuals/StageView.tsx` (the placeholder; its children are the
  semantic fallback). DOM state reaches a view through a small store, never through
  re-renders.
- **Loading.** three.js is never in the initial bundle. The hero's type is the LCP
  element and does not wait for it. The canvas fades in over its semantic layer; there
  is no loader and no blank frame.
- **Discipline.** Render on demand: a frame is drawn only while a visible view is
  animating or its inputs changed; an idle or hidden page draws nothing. Drawing-buffer
  pixels follow the screen's own ratio up to 2 in every tier (and ≤ 10 megapixels). Tiers, chosen at
  mount and lowered by a frame-time governor: `high`, `low` (fewer marks and effects, never a lower ratio), and
  `still` (one frame per state change; used for reduced motion, the Motion-off control,
  save-data and software rendering), then `off` (no canvas: no WebGL2 or context lost
  twice). Context loss falls back to the semantic layer and restores once.
- **Finish.** Glow, grain, vignette and dither live in each view's own shader. Hairlines
  are GL lines or analytically anti-aliased; no visible aliasing, no banding on dark
  gradients. Materials are flat tokens, additive light and rim accents; no glass,
  refraction, HDR environments or real-time shadows.
- **Budgets per frame, whole page.** ≤ 40 draw calls, ≤ 12,000 points, ≤ 10,000 line
  segments, ≤ 60,000 triangles, no texture over 1024 px except the portrait.
- **Review hooks (kept in production, they cost nothing).** `?gl=off|still|low|high`
  forces a tier and `?motion=off` forces reduced motion. The canvas carries
  `data-tier`, `data-dpr`, `data-views`, `data-calls`, `data-points`, `data-lines`,
  `data-triangles` and `data-frames`, refreshed at most once a second.
  `window.__stage` exposes `ready` (a promise), `info()` and `seek(ms)` (freeze the
  stage clock at a time, for deterministic frame strips).

## 6. Motion

Motion explains or rewards and never blocks; content is complete without it; one thing
leads at a time.

- **Tokens** in `lib/motion.ts` and mirrored as CSS custom properties: durations 120
  (press), 200 (hover), 320 (state), 520 (panel), 800 (entrance), 1200 ms (a section's
  whole entrance, the ceiling); easing `cubic-bezier(0.22, 1, 0.36, 1)` out,
  `cubic-bezier(0.65, 0, 0.35, 1)` in-out; springs `snappy` (stiffness 420, damping 34),
  `settle` (220, 28), `drift` (60, 20); stagger 40–70 ms, at most eight steps.
- **Time-based** motion for entrances and state changes; **scroll-linked** motion only
  for things that are position or progress (the playhead, the progress line, parallax of
  the field). Never smooth or delay anything that must stay registered with the scroll.
- **Entrances** play once, in a written order per section (what leads, what follows,
  what settles last). Type is never hidden waiting for JavaScript.
- **Ambient motion** exists only in the hero field and the contact scene: slow enough to
  ignore, stopped by the Motion-off control, by reduced motion, off-screen and on a
  hidden tab. Nothing else loops when idle.
- **DOM engine.** Native CSS (scroll-driven animations behind `@supports`, `@property`,
  `offset-path`, View Transitions for the theme change and list reordering) and `motion`
  (`motion/react`, `LazyMotion` + `m`, `MotionConfig reducedMotion="user"`) for stateful
  UI; `@number-flow/react` for figures. Springs that drive WebGL uniforms come from the
  same tokens.
- **Pointer** (fine pointers): a spotlight and border light on cards, a magnetic pull on
  the primary action only, tilt with spring on project cards, pointer lean in the field.
  Touch gets press states and drag with inertia. No custom cursor.
- **Tells to avoid:** everything fading up identically, simultaneous starts, linear
  easing, bounces, entrances over 1.2 s, motion that replays on every scroll pass,
  hover effects that move layout, parallax on text, idle loops.

## 7. Timelines

Every timeline on the site is horizontal and spans the full width of the browser, edge
to edge, at every width from 320 to 1920 px and beyond. One module (`lib/timeline.ts`:
a `d3-scale` UTC time scale over 2010-01 to the current month, calendar ticks, label
lanes, the "now" edge) feeds all of them, so they can never disagree.

- **The hero has no timeline.** The page shows one career timeline, Experience's; the hero
  hands over to it with the field's one lit "now" line.
- **Experience.** One screen, never pinned and never tied to vertical scroll. The whole
  axis is fitted edge to edge at every width. The playhead follows the pointer; a click,
  tap, or arrow keys / Home / End select a role; on touch the track can also be dragged.
  The selected role shows as a compact card joined to its bar by a connector (title,
  employer, dates, headline figure); "Role details" or Enter opens its detail panel. On
  phones the axis stays full width with a lens on the selected role above a native
  horizontally snapping row of role cards that drives the lens (and the lens drives it).
  From 640 px on a touch screen the card stands on the axis as on a desktop (at most 26rem
  wide, never a band), a touch on the track lights a ring of at least 44 px round the nearest
  bar, and the row of cards under the axis shows employer, title and years on each.
- **Semantics.** The bars are the tabs of an ARIA tab list in date order; one tab panel
  shows the selected role; the complete list of roles is in the HTML for no-JS and
  screen readers. Focus is always visible above the canvas. Targets ≥ 44 px on touch.
- **Fallbacks.** No JS: the SVG axis and the full list with every role expanded. No
  WebGL, reduced motion or Motion off: the same timeline without the light layer.

## 8. Engineering

- Next.js 15 App Router, `output: 'export'`, React 19, TypeScript strict, Tailwind CSS 4.
  Server Components by default. Build fails on type or lint errors.
- Tree: `app/`, `content/`, `components/{ui,site,assistant,visuals}`,
  `components/sections/<Name>/`, `lib/` (`gl/`, `timeline.ts`, `motion.ts`,
  `assistant/`), `tests/`, `scripts/`.
- No dead code: when a section is rebuilt, its previous components, styles, tests and
  assets leave in the same change. No TODOs, placeholders, commented-out code or
  eslint-disable lines.
- Accessibility: WCAG 2.2 AA. One `h1`, ordered headings, landmarks, skip link, visible
  focus (2 px accent ring, 2 px offset), full keyboard operation, no horizontal page
  scroll from 320 px, no drag-only control, every moving thing stoppable.
- Performance: the home route's initial JavaScript does not grow by more than 6 kB gzip
  over the pre-stage build; the lazy three.js chunk is ≤ 170 kB gzip; LCP < 2.5 s with
  the hero heading as the LCP element; CLS < 0.05; no image over 300 kB.
- Security: the Content-Security-Policy in `firebase.json` stays strict (no eval, no
  third-party origins except the chat origin); `tests/csp.spec.ts` enforces it.
- Tests (Playwright, system Chrome with SwiftShader): smoke, axe, CSP, and per section a
  spec that asserts its content, its fallbacks (`?gl=off`, reduced motion, JavaScript
  disabled), its interactions by keyboard, and that the stage drew its view
  (`?gl=high`, non-blank pixels, budgets from the `data-` attributes).
- The live page carries `<meta name="build-commit" content="<8-char sha>">`.

## 9. The quality gate

Sections are built one at a time. A section is finished only when an independent reviewer
has scored the production site and every hard gate holds and every scored dimension is
8 or more. Otherwise it is refined and reviewed again. The next section does not start
before that.

**Hard gates (any failure fails the section)**

- G1 Truth: everything shown matches `content/`; scope lines present; nothing implied
  that the data does not state.
- G2 Timelines: every timeline in the section is horizontal and its track is as wide as
  the browser's content width (within 1 px) at 320, 390, 834, 1440 and 1920 px.
- G3 Engine: the signature visual is drawn by the three.js stage from the section's
  real data and responds to pointer, touch and keyboard through DOM controls.
- G4 Resilience: with `?gl=off`, with reduced motion and with JavaScript disabled, all
  content is present and the section looks finished.
- G5 Health: no console error or CSP violation; axe clean; no horizontal overflow; no
  text under 13 px; the hero heading is still the LCP element; layout shift during the
  section's animations < 0.05; stage budgets respected; an idle page draws no frames.
- G6 No leftovers: nothing of the section's previous implementation remains.
- G7 Compact: the section meets its height limit (one screen at 1440×900; 1.6 screens at
  390×844; contact with footer 0.9 and 1.2) and its always-visible word budget.
- G8 Nothing lost: every fact in `content/` for the section is on screen or in a detail
  panel one interaction away, and in the HTML; panels open, close, deep-link and work by
  keyboard, touch and the back button.
- G9 Voice: no defensive wording (section 2 rule 3), no spelling or grammar fault,
  Australian English, and nothing that is not true to the CV.

**Scored dimensions (1–10; 8 is the bar)**

| | 6 looks like | 8 looks like | 10 looks like |
|---|---|---|---|
| S1 Concept and data truth | decoration that could sit on any site | one clear idea, visibly made of this section's data, readable at a glance | explains the data better than the text does and is unmistakably his |
| S2 Choreography | everything fades in at once, or loops | a written order with a lead, consistent tokens, every intermediate frame intentional, a clean settle | timing and overlap feel authored; motion shows cause and effect; a pleasure on repeat |
| S3 Visual finish | tidy but flat or uneven | exact alignment, coherent depth and light, crisp at every size, both themes equally finished | studio grade: every edge, label and state considered |
| S4 Interaction | works but inert or inconsistent | every control answers within 100 ms with designed hover, focus, press and selected states; keyboard and touch parity | feels physical, discoverable and forgiving |
| S5 3D and effects craft | a demo pasted behind content; aliasing, jitter, banding or a flash on mount | integrated with the DOM to the pixel, stable under scroll, theme-aware, restrained light and depth | indistinguishable from the best current studio work |
| S6 Responsive and resilient | desktop first, the phone an afterthought | phone, tablet and desktop each composed on purpose; fallbacks look designed | the phone view is as strong as the desktop |
| S7 Writing and information design | correct but wordy, generic or hedged; text does the work visuals should | every line specific, confident and outcome-first; visuals carry the message and words are few; details are exactly where a reader looks for them | reads like the best executive profile in the field; nothing to cut, nothing missing |

**Evidence the reviewer must produce:** film strips of the section (load or enter,
scroll scrub, each interaction, pointer sweep) at 1440 px dark, 390 px dark and 1440 px
light with `?gl=high`; contact sheets at 320, 390, 834, 1440 and 1920 px; the fallback
captures for G4; measured numbers for G2 and G5. For every score under 8: exactly what
is missing to reach 8, as findings a developer can act on.

## 10. Definition of done for any change

`npm run check`, `npm run build` and `npm test` clean · looked at in a browser at 390,
834 and 1440 px in both themes, with film strips of anything that moves · shipped with
`scripts/ship.sh` · the live `build-commit` equals the pushed commit · for a section, the
gate in section 9 passed.
