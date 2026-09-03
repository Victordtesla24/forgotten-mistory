# Codebase Report — grounding a new "what is a calibration card" visual for `#skills`

Everything below is read from source. File:line citations are exact.

---

## 0. Correction on the binding docs

`/root/forgotten-mistory/docs/prompt.md` is **not** a design spec — it is the Hermes **PM orchestration prompt** (552 lines: role definition, Kanban lifecycle, council profiles). Its requirements matrix is **R1–R12 only** (`docs/prompt.md:52-64`). **There is no R-16**, despite `CLAUDE.md:28` citing "`docs/prompt.md` R-16". The only requirements in it that bear on a new visual:

- **R2** (`prompt.md:56`) — "≥7 signature scenes hold 60 fps desktop + 2021+ phone; **reduced-motion fallback on each**"
- **R7** (`prompt.md:61`) — "every claim maps to resume; zero fabricated facts"
- **R9** (`prompt.md:63`) — "Requirements spec + test cases exist and **precede** implementation"

The *actual* binding design law for this work is `/root/forgotten-mistory/CLAUDE.md` (prime directives 1–6, lines 30–52; "Definition of done", lines 134–139) plus the audit script. `docs/overhaul/SPEC.md` contains **no** mention of "calibration", "proficiency" or `#skills` — the calibration-card concept lives entirely in `app/data/portfolio/skills.ts:1-20` and the component doc comments.

---

## 1. Tokens a new visual may use — exact names and values

All declared in `app/globals.css` `:root` (lines 3–114). **Nothing else exists.** Note there is no `--ink-600`, no `--mist-300`, no `--gold-…` beyond the seven listed.

### Inks / greys / white — `globals.css:6-14, 55-57`
| Token | Value | Line |
|---|---|---|
| `--ink-900` | `#0A0B0D` | 6 |
| `--ink-800` | `#121317` | 7 |
| `--ink-700` | `#1B1D23` | 8 |
| `--ink-500` | `#3A3D46` | 9 |
| `--ink-400` | `#8F93A3` | 56 |
| `--ink-300` | `#6E7178` | 57 |
| `--mist-400` | `#8A8F9A` | 10 |
| `--mist-200` | `#C9CDD6` | 11 |
| `--mist-100` | `#D6D8E2` | 55 |
| `--white` | `#F4F6FA` | 12 |
| `--accent` | `#E8EBF0` | 13 |
| `--steel` | `#AEB6C2` | 14 |

### Gold — `globals.css:33-39` (meaning fixed by `globals.css:16-32`)
`--gold` `#c9a84c` · `--gold-light` `#d4b65c` · `--gold-pale` `#e8d5a3` · `--gold-dark` `#b0923f` · `--gold-muted` `rgb(201 168 76 / 0.08)` · `--gold-border` `rgb(201 168 76 / 0.2)` · `--gold-veil` `rgb(201 168 76 / 0.13)`

Currently gold is spent in exactly seven places sitewide (`grep var(--gold`): Caliper sourced jaws (`Caliper.module.css:77-78`), Skills legend first item + production status glyph + traced-row inset rule (`Skills.module.css:109,271,373`), Bench production dot (`Bench.module.css:220`) and the two Bench gold gradient stops (`Bench.tsx:297-300`), Vitrine live-URL link (`Vitrine.module.css:243-249`), Listen's one-pixel closing rule (`Listen.module.css:69`), MiniVicBot speaking dot.

### Semantic aliases — `globals.css:41-53`
`--token-bg-base|surface|elevated`, `--token-text-primary|secondary`, `--token-brand-primary|accent`, `--token-border-default` (`rgb(255 255 255 / 0.10)`), `--bg-color`, `--text-color`, `--accent-color`, `--secondary-text`, `--border-color`.

### Surface / depth — `globals.css:58-68, 105-113`
`--card-bg` `rgb(244 246 250 / 0.03)` · `--card-radius` `18px` · `--card-border` `rgb(255 255 255 / 0.09)` · `--card-border-hover` `rgb(255 255 255 / 0.18)` · `--card-rim` · `--card-shadow` · `--card-shadow-hover` · `--card-sheen` · `--elev-1|2|3` · `--rim` · `--rim-strong` · `--hair` (`inset 0 0 0 1px rgb(58 61 70 / 0.70)`) · `--keylight`.

### Geometry / rhythm — `globals.css:96-103`
`--beat-pad` `clamp(6rem,12vh,11rem)` · `--letterbox-h` · `--rail-gap` · `--tile-w` · `--gutter` `clamp(1.25rem,5vw,4rem)` · `--spot-x` `50%` · `--spot-y` `18%` · `--nav-height` `5.5rem` (line 71) · `--cursor-size`.

⚠️ **`--page-gutter` is never declared anywhere.** Every section uses it only as `var(--page-gutter, clamp(1.5rem, 5vw, 5rem))` — the fallback is the real value (`Skills.module.css:14`, `About.module.css:11`, `Experience.module.css:12`, `Hero.module.css:22`, `Listen.module.css:15`, `Vitrine.module.css:21,56,61`). Match that idiom exactly.

### Type — `globals.css:80-85`
- `--font-body` → Inter (prose)
- `--font-heading` → Source Serif 4 (titles, figures, `Bench.module.css:254` readout title)
- `--font-heading-italic` → used **exactly once** sitewide, on the closing sentence (`globals.css:82-84`, `Caliper.module.css:140-142` explicitly forbids a second use)
- `--font-mono` → IBM Plex Mono, **provenance/data only** (band labels, axis readouts, status labels, hashes)

There is **no type-scale token set**. Sizes are literal `rem`/`clamp()` per module. Skills' own scale for reference: title `clamp(2rem,4.2vw,3.4rem)` (`Skills.module.css:42`), lede `clamp(1rem,1.25vw,1.12rem)`/1.68 (52-53), kicker `0.74rem`/`0.2em` uppercase (32-35), Bench caption `0.92rem` (`Bench.module.css:17`), node `0.82rem` / source node `0.72rem` mono (`Bench.module.css:161,172`), band label `0.6rem`/`0.16em` mono (142-145), mono micro-copy `0.66–0.68rem` (`Skills.module.css:114-117,239,277`).

### `@property`
Only one registered: `--angle` (`globals.css:116-120`).

---

## 2. Motion tokens and easing already in use

`globals.css:86-90` — the entire vocabulary:
```
--motion-fast:  220ms
--motion-base:  360ms
--motion-slow:  520ms
--motion-ease-standard:   cubic-bezier(0.22, 1, 0.36, 1)
--motion-ease-emphasized: cubic-bezier(0.16, 1, 0.3, 1)
```

Durations actually used in and around Skills, so a new visual has a precedent to match:
- Card fade-in `240ms var(--motion-ease-standard)` (`Skills.module.css:62`, keyframes 65-73)
- Filter transitions `var(--motion-fast)` (`Skills.module.css:135-138`)
- Bench wire trace `820ms var(--motion-ease-emphasized) var(--delay)`, delay = `120 + index*38` ms, set inline (`Bench.module.css:57`, `Bench.tsx:333`)
- Bench dim/undim `var(--motion-base)` on `stroke-opacity`/`stroke-width` (`Bench.module.css:47-49`)
- Bench node hover `var(--motion-fast)` (`Bench.module.css:164-166`)
- Compass rose rotation `680ms var(--motion-ease-emphasized)` (`Compass.module.css:24`) — a bespoke duration, the only one on the site outside the token set besides Bench's 820ms
- Nav `0.4s cubic-bezier(0.22,0.61,0.36,1)` (`globals.css:287`)

**Global reduced-motion kill switch:** `globals.css:691-699` sets `animation-duration: .001ms !important; transition-duration: .001ms !important` on `*, *::before, *::after`. So a CSS-animated visual is *already* neutralised — but the **end state must be the correct static state**, since the animation snaps to its `to` frame. Bench handles this with `@media (prefers-reduced-motion: reduce) { .wire[data-drawn] { animation: none; opacity: 1 } }` (`Bench.module.css:85-90`) plus a JS branch that sets `drawn=true` immediately when `matchMedia('(prefers-reduced-motion: reduce)').matches` rather than waiting for IntersectionObserver (`Bench.tsx:189-207`). Copy that two-layer pattern.

---

## 3. What each other section's visual already spends (collision map)

| Section | Signature visual | Device it owns — **do not reuse** |
|---|---|---|
| **Hero** `Hero.tsx`, `HeroAtmosphere.tsx`, `atmosphere.glsl.ts` | Full-screen GLSL atmosphere quad behind server-rendered type; pointer-parallax lerped on CPU; three `self-reported` calipers in a ledger row with source lines | **Volumetric backdrop / shader haze**; **the staggered `--step` CSS entrance** (`Hero.tsx:39,44,48…`); the "◐ self-reported" grading note |
| **About** `Compass.tsx` + `.module.css` | **A circular instrument face**: 47-unit bezel, 100 graduations (every 10th major), 10 annular sectors, engraved arcs, counter-rotating mono numerals, hub readout `01`/`NO SCORES`, **white** index caret fixed at 12 o'clock while the rose turns | **Any dial, bezel, radial gauge, rotating ring, tick-ring, radial sector, or "index at twelve o'clock" device is a hard collision.** Also owns the **45° hatch pattern** (`Compass.tsx:142-150`, `Compass.module.css:96-100`) — shared with the open caliper. Also owns "an instrument whose reading position is fixed while the data moves" |
| **Experience** `Experience.tsx`, `CareerStrata.tsx`, `strata.glsl.ts` | **Horizontal duration bars on one 16-year axis**, positioned in `%` of the same span (`Experience.tsx:20-25`), decade gridlines computed to skip the label column (`:28-33, 79-92`), axis ticks, over a GLSL strata field that draws texture *not* data | **Any horizontal proportional bar / timeline axis / gridline-and-tick chart.** Also owns the "the scene draws texture, never a second copy of the data" pattern (`Experience.tsx:41-44`) |
| **Skills** *(current)* `Bench.tsx` + `.module.css` | **Two HTML rails + an SVG cable bundle**: 13 sources (3 bands) left, 17 capabilities right, 20 flat-tangent cubic wires, anchors measured from layout, gold-vs-grey `userSpaceOnUse` gradients, hover/focus dims the unlinked, four-line readout with reserved `min-height: 5.2rem` | Already spends: **wires/cabling, node-link graph, left↔right rails, hover-to-trace dimming, a fixed-height readout strip** |
| **Vitrine** `Drawings.tsx` + `Drawings.module.css` | **Six hairline mechanism drawings**, all `viewBox="0 0 320 200"`, `stroke="currentColor"`, `strokeWidth` 0.75–1, opacity 0.16–0.95, uppercase mono labels, each `role="img" aria-labelledby="dNt dNd"` with `<title>`+`<desc>`. Includes a **pipeline-with-gate**, a **four-box PUSH→BUILD→PROBE→LIVE flow with a rollback return path**, a **circular 4-stage loop**, **noise→ruled-bands reconstruction**, a **diamond chart with a caliper closing on a reading** (`Drawings.tsx:284-293`), and a **vertical rail with "YOU ARE HERE"** | **Any box-and-arrow process flow, any labelled-box pipeline, any "noise in / order out" band diagram, and a literal drawn caliper** are all already spent here. Vitrine also owns the hairline-only, no-fill, `currentColor`, uppercase-mono-label drawing *style* |
| **Listen** `Listen.tsx`, `Avatar.tsx` | **Deliberate emptiness** after five dense screens; one italic sentence (the site's only italic); one gold hairline `.rule` "the caliper at one-pixel scale" (`Listen.tsx:42`, `Listen.module.css:69`); the feedback-correction ledger read from git history; click-to-play avatar | Owns **silence as a device**, the single italic, and the one-pixel gold terminal rule |

**Net headroom for a Skills metaphor visual:** paper/certificate objects (a stamped or ruled document, a fold, a tear-line, a masthead/serial block), a **strike-through / substitution** gesture (the bar the card refuses to draw), a **before→after swap**, side-by-side **specimen comparison**, a **stamp / seal / sign-off block**, or a **column of measured-vs-not readings**. All of those are unclaimed. Circles, dials, arrows-between-boxes, horizontal proportional bars and cable bundles are not.

---

## 4. The 10 audit gates — verbatim in effect, and how a new visual fails each

`scripts/validate/overhaul_static_audit.mjs`, 612 lines. Run order at lines 549–561; report 563–575; **exit 1 on any failure** (line 612). `walk()` (line 24) skips `node_modules .next out .git coverage reports`.

| # | ID | Registered name | Scope | How a **new SVG/CSS visual** fails it |
|---|---|---|---|---|
| 1 | `TC-NFR-TONE` | "No boastful/sci-fi copy (data + layout meta + alt/aria)" — `:49-88` | every **string literal** in `app/data/**/*.ts(x)` + `app/layout.tsx`; and every `alt=` `aria-label=` `aria-description=` `aria-roledescription=` `title=` **attribute value** in `app/**/*.tsx` + `components/**/*.tsx` | An `aria-label` on the new SVG containing any of the 30 banned words (`:50-63`) — the traps here are **`mission`**, **`fleet`**, **`commander`**, **`exceptional`**, `visionary`, `cutting-edge`, `passionate`. Word-boundary regex, case-insensitive. New copy added to `skills.ts` is scanned as string literals. |
| 2 | `TC-NFR-MONO` | "Achromatic, with one sanctioned accent defined in one place" — `:90-153` | all `.ts .tsx .css` under `app/**` + `components/**`, **comments stripped** (`:43-47`) | (a) any hex whose `(max−min)/max > 0.28` and `max > 24`; (b) any `rgb()/rgba()` failing the same; (c) any `hsl()` with saturation `> 15%`; (d) any Tailwind chromatic utility matching `:114` (`text-blue-500`, `stroke-amber-400`, …); (e) `<ChromaticAberration>`. **The gold hexes are only allowed in `app/globals.css` and `lib/palette.ts`** (`:104-107`) — writing `#c9a84c` or `stroke="#c9a84c"` in a Skills file **fails**, even though it is "the right colour". Use `var(--gold)`. Note SVG `stopColor="var(--gold)"` is the established, passing idiom (`Bench.tsx:297`). |
| 3 | `TC-NFR-PERF` | "Asset budgets (img ≤0.5MB · video ≤2.5MB, ≤5MB click-to-play · audio ≤1MB)" — `:155-197` | files under `public/**` | Only if the visual ships a raster/font asset. **An inline SVG is invisible to this gate** — inline SVG is the right choice. |
| 4 | `TC-FR-PARITY` | "Resume facts present in siteContent" — `:199-210` | `app/data/siteContent.ts` must contain 15 literal facts | Only fails if you delete something from `siteContent.ts`. Inert for a new visual. |
| 5 | `TC-NFR-TYPE` | "Three font families — Source Serif 4 (display) + Inter (body) + IBM Plex Mono (data)" — `:212-250` | `app/**` + `components/**` `.css .tsx` | The literal strings `Roboto`, `Playfair Display`, `Space Grotesk`, `Source Code Pro`, `Source Sans Pro/3`, `Roboto Condensed`, or the stale vars `--font-roboto` / `--font-alt` / `--font-space-grotesk` appearing **anywhere, including a comment**. Use only `var(--font-heading|body|mono)`. |
| 6 | `TC-NFR-SEC` | "No hardcoded secrets in client source" — `:252-271` | `app/** components/** lib/**` `.ts .tsx .js` | Inert for a visual. |
| 7 | `TC-ARCH-BENCH` | "No /performance-benchmark route in static export" — `:273-294` | `out/` | Inert. Passes with a note if `out/` is absent. |
| 8 | `TC-NFR-COMPLETE` | "No truncation/placeholder/stub markers (app\|components\|lib)" — `:296-347` | every line of `.ts .tsx .js .jsx .mjs` under `app/ components/ lib/`, **comments included** | **The single most likely accidental failure.** Line-level regexes at `:304-322`: `\bTODO\b`, `\bFIXME\b`, `\bXXX\b`, `\bHACK\b`, `not implemented`, `unimplemented`, **`\bmock(?:ed\|s)?\b` (case-insensitive)**, **`\bstub(?:bed\|s)?\b`**, `rest of the file`, `code omitted`, `omitted for brevity`, `your code here`, `implementation goes here`, `placeholder implementation/logic/function/component/here`. Plus whole-line ellipsis comments (`:324-329`). A doc comment saying "not a mock-up", "stubbed in", or a variable named `mockData` fails the build. |
| 9 | `TC-NFR-TOKEN` | "CSS custom properties match design token spec" — `:349-490` | all `.css` in `app/ components/`; all `.css .tsx .ts` for `var()` refs | Two ways: (a) redeclaring `--ink-900` etc. with a value differing from `design-tokens.json` (`:424-437`); (b) **referencing an undeclared colour-family var**. `TOKEN_FAMILIES` = the keys of `design-tokens.json → colors` = **`ink, mist, white, accent, steel`** (note: **`gold` is NOT in `design-tokens.json`**, so `var(--gold*)` is never drift-checked). So `var(--ink-600)`, `var(--mist-300)`, `var(--steel-2)` → **FAIL** unless declared in a scanned CSS file. Approved non-colour prefixes at `:398-413`: `--token- --card- --cursor- --font- --motion- --bg- --text- --border- --secondary- --accent- --angle --img- --lift --arch- --detail-`. **`--page-gutter` and `--delay` are not on that list but pass** because `looksLikeColorToken()` returns false for them (`:456-463`) — only colour-family-looking names are ever flagged. Inline `style={{ '--delay': … }}` (the Bench idiom, `Bench.tsx:333`) is therefore safe. |
| 10 | `TC-NFR-DEADCSS` | "No globals.css rules for classes that do not exist" — `:492-547` | **`app/globals.css` only** | A rule whose selector contains a class token that appears in **no string literal** anywhere in `app/ components/ lib/` `.ts(x)/.js(x)/.mjs`. **A CSS Module (`*.module.css`) is out of scope entirely** — so putting the new visual's styles in a new/existing `.module.css` sidesteps this gate completely. Only add to `globals.css` if you must, and then only with a class the source demonstrably renders. |

`tests/static_audit_fail.test.mjs` (run with `node --test`) asserts the audit itself exits 0 on clean source and 1 on injected TONE/MONO/etc. violations — so the audit cannot be silently weakened.

---

## 5. Tests that would need updating / adding

### Would **break** on a new visual (must be updated deliberately)

| Test | File:line | Why it breaks |
|---|---|---|
| **TC-BENCH-01** | `tests/e2e/skills.spec.ts:139-161` | `expect(page.locator('#skills svg path')).toHaveCount(20)`. The selector is **`#skills svg path`, not scoped to the bench** — *any* `<path>` in *any* new inline SVG inside `#skills` breaks it. It then asserts all path start-x collapse to one value and all end-x to one value (`starts.size === 1`, `ends.size === 1`) and every length `> 80`. A second SVG would blow all three assertions. **Either scope this test to the bench SVG, or draw the new visual with non-`<path>` primitives (`line`, `rect`, `circle`, `polyline`, `text`).** |
| **TC-BENCH-02** | `tests/e2e/skills.spec.ts:163-173` | Counts `#skills svg path` whose `stroke` attribute string contains `"gold"`, expects exactly `17`. A new gold-stroked path inside `#skills` fails it. |
| **TC-SKILL-07** | `tests/e2e/skills.spec.ts:108-118` | `expect(page.locator('#skills [role="status"]')).toHaveCount(1)`. **A new visual must not add a live region / `role="status"`.** |
| **TC-SKILL-06** | `tests/e2e/skills.spec.ts:77-106` | Measures `#skills` `getBoundingClientRect().height` before and after clicking "Production only", tolerance **≤ 1 px**. Any new element inside `#skills` that changes height in response to filtering (or that reflows when the table re-measures) fails. |
| **TC-SKILL-03** | `tests/e2e/skills.spec.ts:46-60` | `#skills progress, #skills meter, #skills [role="progressbar"]` must be **count 0**. If the visual *depicts* a rejected proficiency bar, it must not use those elements or that role. Also `★`/`⭐` are forbidden in the table text and `\d{1,2}\s?/\s?(5|10)` anywhere in it. |
| **VIS-01…VIS-06** | `tests/visual/screenshots.spec.ts:95-128` | There is currently **no `#skills` baseline** (VIS-01 hero, VIS-02 about, VIS-03 nav, VIS-04 listen, VIS-05 vitrine, VIS-06 viewport-top). VIS-06 captures the viewport top only, so `#skills` is unaffected. Nothing breaks — but this is the gap to fill (see below). |
| **TC-RENDER-08** | `tests/overhaul/render.spec.ts:164-171` | Hero-only screenshot, `maxDiffPixelRatio 0.01`. Unaffected. |

### Would **need to pass unchanged** (constraints on the design)

| Test | File:line | Constraint imposed |
|---|---|---|
| **A11Y-05** | `tests/a11y/accessibility.spec.ts:124` | Full axe scan over `#skills` with the WCAG tag set, **zero violations**. So: every new SVG is either `aria-hidden="true" focusable="false"` (Bench's choice, `Bench.tsx:274-275`) or `role="img"` + `aria-label` (Compass, `Compass.tsx:129-137`) or `role="img"` + `aria-labelledby` pointing at `<title>`+`<desc>` (Drawings, `Drawings.tsx:33-39`). Any interactive element needs a name, a ≥ AA contrast, and a visible focus ring. |
| **A11Y (heading order)** | `tests/a11y/accessibility.spec.ts:203` | `#skills` is in the section-id sweep; heading levels must stay sane (`h2` is `#skills-title`; the bench uses `<figcaption>`, not a heading). |
| **MONO-04** | `tests/monochrome/monochrome.spec.ts:206-215` | `getComputedStyle` over **every element** in the six sections, all 13 colour longhands incl. `fill` and `stroke` (`:35-49`). Chromatic = `(max−min)/max > 0.28` with `max > 24`. Allow-list is only the four golds `201,168,76 / 212,182,92 / 232,213,163 / 176,146,63` (`:32`). This catches what the static audit cannot — a hue arriving through `var()` indirection or the cascade. |
| **MONO-03** | `tests/monochrome/monochrome.spec.ts:153-204` | No inline `style` attribute may declare a non-palette colour. Inline `--delay`-style custom props are fine; inline `stroke: <colour>` is not. |
| **MONO-05** | `tests/monochrome/monochrome.spec.ts:217-240` | The gold **must render** somewhere in `#hero *, #skills *, #vitrine *, #listen *`. Removing gold from Skills is also a failure. |
| **TC-CINE-04** | `tests/overhaul/cinematic.spec.ts:142-168` | Under `reducedMotion: 'reduce'`, `page.locator('canvas')` must be **count 0** across the whole page, and every section's `innerText` must still be `> 200` chars. → **A WebGL/canvas visual in `#skills` would fail this outright** unless it mounts through `components/gl/Scene.tsx`, which refuses to mount under reduced motion. Inline SVG is the safe and precedented choice (see `Compass.tsx:80-84`: "Inline SVG, not WebGL… it existed for readers on a discrete GPU and left everyone else four hundred pixels of empty column"). |
| **TC-CINE-07** | `tests/overhaul/cinematic.spec.ts:210-238` | Under reduced motion, `#skills h2` must be visible with `opacity > 0.9` — i.e. no reveal that fails closed. |
| **TC-COMPLETE-04** | `tests/overhaul/complete.spec.ts:89-102` | `#skills` text must contain no stub markers, must match `/AI|Engineering|Leadership|Certif|Education/`, and **zero empty `<td>`** among `#skills tbody tr:not([hidden]) td`. |
| **CT-08** | `tests/content/content-check.spec.ts:137-155` | `tr[data-status="pending"]` count exactly 1, containing "AWS and GCP" and "no certificate issued". |
| **TC-RENDER-09** | `tests/overhaul/render.spec.ts:173-200` | A full-page scroll must raise **zero** `pageerror`. A `ResizeObserver`/`getBoundingClientRect` visual that throws on an unmounted node fails here. |
| **TELEMETRY** | `tests/overhaul/telemetry-stability.spec.ts:144-148` | Clicks "Production only" then "Everything" on `#skills` and requires rows still present — the new visual must survive a filter round-trip. |
| **PERF-02 / PERF-03** | `tests/perf/performance.spec.ts:27-28, 61-129` | `LCP_BUDGET_MS = 2500`, `CLS_BUDGET = 0.05`. Any visual whose height is computed after mount **must reserve its box up front** (the Bench readout's `min-height: 5.2rem`, `Bench.module.css:245-247`, is the precedent for exactly this). |

### Tests that would need to be **added** (the "test first" directive, `CLAUDE.md:49`)

Minimum set, phrased against the section's own contract:

1. **`TC-SKILL-09`** — the metaphor is drawn, not only written: the new figure exists in `#skills`, is present before any interaction, and carries an accessible name/description (`role="img"` + `aria-label`, or `<title>`/`<desc>`). Assert its text/label mentions what a calibration certificate states.
2. **`TC-SKILL-10`** — the refused device is depicted as refused: if the visual shows a proficiency bar being struck out, assert it is **not** a `progress`/`meter`/`[role=progressbar]` and that it is marked as rejected in the accessible description (this is the honesty invariant, and it is the one a future edit is most likely to break by "cleaning up" the strike-through).
3. **`TC-SKILL-11`** — reduced motion: with `page.emulateMedia({ reducedMotion: 'reduce' })`, the figure is fully in its end state (opacity ≈ 1, no `animationName` still running, all sub-parts visible) and `canvas` count remains 0.
4. **`TC-SKILL-12`** — no layout shift: the figure's `offsetHeight` is identical before and after `document.fonts.ready` + 500 ms, and the `#skills` height is unchanged (±1 px) across a filter round-trip (extends TC-SKILL-06's contract to the new element).
5. **`VIS-07`** — a `#skills` visual baseline, captured with `shootSection(page, '#skills', 'skills-section.png')` using the existing helper (`tests/visual/screenshots.spec.ts:61-90`, `SHOT` at `:32`). There is currently no such baseline, which is why nobody would notice this section going ugly. Generate with `UPDATE_SNAPSHOTS=1 npx playwright test tests/visual`.
6. **Amend `TC-BENCH-01` / `TC-BENCH-02`** — re-scope both from `#skills svg path` to the bench's own SVG (e.g. `#skills figure svg path`, or add a `data-bench` hook) *before* adding any second SVG. Do this as its own commit so the count change is auditable.

Run command (there is **no `webServer`/`globalSetup`** — `CLAUDE.md:98-107`, `playwright.config.ts`):
```
npm run build:static
python3 -m http.server 5599 --directory out &
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5599 npx playwright test
```

---

## 6. Structural constraints, and the machinery a new visual can reuse

**Client component, static export.** `app/page.tsx:1` is `'use client'`; `Skills.tsx:1` and `Bench.tsx:1` likewise. Firebase serves `out/` only — `app/api/*` does not run (`CLAUDE.md:118-120`). No server-side data, no runtime fetch.

**No-JS / pre-hydration behaviour.** Everything in `#skills` is server-rendered markup; only the *measured* parts (wire geometry, the table height floor) are JS. The rule from `Hero.tsx:19-24` and `About.tsx:15-20` — "complete with reduced motion or with JavaScript switched off" — applies. A visual whose geometry is computed in `useLayoutEffect` must have a correct un-measured first paint (Bench's SVG renders with `viewBox="0 0 1 1"` and zero wires, `Bench.tsx:271-272`; the rails are real HTML and are complete without it).

**Measurement machinery available for reuse, in Bench.tsx:**
- `measure()` (`Bench.tsx:114-150`) — reads `benchRef.getBoundingClientRect()` as the origin, then `anchor(el, 'right'|'left')` converts any child element's box into origin-relative `{x, y}` at its vertical midpoint. Bails on `origin.width === 0`. Directly reusable for any "draw a line between two pieces of live HTML" visual.
- The **double-rAF settle** (`Bench.tsx:152-184`): a `ResizeObserver` that calls `measure()` immediately *and* again after two `requestAnimationFrame`s, because a single-frame read gets the pre-rewrap anchors. Plus `document.fonts?.ready.then(measure)` because the rails wrap differently once the real faces land. This is a hard-won pattern — reuse it, don't reinvent it.
- The **run-once trace** (`Bench.tsx:189-214`): `IntersectionObserver` at `threshold: 0.15` sets `drawn`; a timer of `120 + LINKS.length*38 + 820 + 80` ms then sets `settled`, and `.wire[data-settled]` removes the animation entirely (`Bench.module.css:64-70`) so a later resize cannot replay it under the reader. Any entrance animation in this section should adopt the same `drawn`/`settled` two-flag shape.
- `pathLength={1}` normalisation for dash-based draw-in (`Bench.tsx:325`, `Bench.module.css:53-55, 72-83`) — chord-length estimates were wrong enough to leave wires stopping mid-air.
- **`stroke-opacity`, never `opacity`, for dimming while an animation owns `opacity`** (`Bench.module.css:92-102`) — a running animation beats any selector's specificity.
- **Literal SVG ids, not `useId()`** (`Bench.tsx:91-95`): React ids contain colons, which are illegal inside `url(#…)`. Any new `<defs>` must use a literal id, and it must be unique against `bench-wire-gold`, `bench-wire-grey`, `compass-open`, `compass-hub`, and Drawings' `arrow`.
- **`gradientUnits="userSpaceOnUse"`** for gradients on near-horizontal strokes (`Bench.tsx:281-288`) — an `objectBoundingBox` gradient on a zero-area box renders nothing.

**The Skills table's own floor machinery** (`Skills.tsx:52-78`): the unfiltered table height is measured with a `ResizeObserver` + `document.fonts.ready`, and applied as `minHeight` on the **wrapper**, never on the measured element (a `min-height` on the measured element inflates its own measurement and ratchets). If a new visual sits *inside* the card, it must not participate in that measurement.

**Existing plumbing already wired into Skills:** `Bench` reports the traced capability upward via `onSelect` (`Bench.tsx:239-245`, `Skills.tsx:41,106`), and Skills marks the row with `data-traced` (`Skills.tsx:174`) styled at `Skills.module.css:371-377`. A new visual can hook the same `traced` state without new plumbing.

**Data.** `app/data/portfolio/skills.ts` is the single source: 13 `sources` (`:44-58`, kinds `programme|repository|credential`), 17 `capabilities` (`:81-221`) each with `capability`, `short`, `evidence`, `where`, `sources[]`, `status`, optional `caveat`; `statusLegend` glyphs `● ◐ ○` (`:75-79`); `skillsContent` incl. the 3-line lede (`:226`) and 3 filters (`:227-231`). Derived counts a visual can honestly print: **20 links** (`LINKS`, `Bench.tsx:61-64`), 13 sources, 17 capabilities, **17 production / 2 non-production / 1 pending**, and the CV fingerprint (`cvFingerprint.short`, `.bytes`) from `app/data/generated/cv-fingerprint.ts`, written at build time by `scripts/build/cv_fingerprint.mjs` — **never hand-edited** (`CLAUDE.md:58-59`). If the new visual needs new numbers, they must be derived from this file, not typed.

**Narrow-viewport contract.** Below `900px` the bench drops the wires entirely and becomes source-chips + a capability list (`Bench.module.css:280-349`); below `860px` the table becomes stacked blocks (`Skills.module.css:305-356`). A new visual needs its own honest sub-900px form — the site's stated position is "no diagram pretending to be readable at 390px" (`Bench.module.css:283-284`).

**Section tone constraint, stated in the code itself:** `Skills.tsx:31-34` — "Motion here is deliberately nil beyond the card's own fade. The section before this one scrubs a sixteen-year chart; this one is meant to be flat, dense and silent." A ~3-second explanatory animation is in tension with that written intent; it will read as coherent only if it is a single, once-only, small-amplitude gesture in the header zone (above the bench), settling to a static end state — the `drawn`/`settled` pattern — rather than an ongoing motion.