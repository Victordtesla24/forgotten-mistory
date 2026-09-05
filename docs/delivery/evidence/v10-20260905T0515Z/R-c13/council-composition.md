# R-c13 — composition lens (senior creative UI council)

**Run:** v10-20260905T0515Z · **Lens:** composition · **Reviewer:** 3rd-party independent adversarial review (level 1, effort max)
**Target:** <https://forgotten-mistory.web.app> — production only.
**Reviewed build:** `15fb165b` (`<meta name="build-commit">`, read live by the probe at each viewport; `composition-report.json.buildCommit`).
**Precondition:** live meta was `3adf126a` at 06:36Z per the task spec; it advanced to **`15fb165b`** mid-review (`15fb165 consolidate: merge worktree-wf_55e925e9-074-1 into main`). Both satisfy *live is a descendant of `f86b125`* — `git merge-base --is-ancestor f86b125 15fb165b` → OK. **Every measurement below is from `15fb165b`.**

**Instruments (read-only, no source file touched):**

| Artefact | What produced it |
|---|---|
| `composition-report.json` | `comp.mjs` — playwright chromium `channel:'chrome'`, `--no-sandbox`, one browser, viewports 1440×900 / 1920×1080 / 834×1194 / 390×844; full-page scroll to mount lazy content, then DOM measurement |
| `composition-triage.json` | `comp-triage.mjs` — plain URL vs `?gl=force`, 1440 + 390, console/pageerror capture, 3× reload |
| `capture/comp-*.png` | 12 captures, each ≤ 400 kB |

**Verdict: FAIL.** Three blockers. The most severe is not a composition defect in the ordinary sense — it is that on any visitor machine with a working GPU there is, on the evidence, **no composition at all**: the page renders its error boundary. Below that, the site has no engagement CTA for the business-client audience, and the MiniVic launcher does not read or behave as a chat affordance.

---

## What holds (measured this build — do not re-open these)

| Item | Evidence |
|---|---|
| **C-01 one content spine — CLOSED.** All six sections' heading left edge is identical at every width: **96 px** @1440, **336 px** @1920, **41.7 px** @834, **24 px** @390. Inner column 1248 px at both desktop widths. | `composition-report.json.widths.*.spine` |
| **C-02 Vitrine rail — CLOSED.** Rail padding 96 px @1440 / 336 px @1920 = heading `x` exactly; `mask-image: linear-gradient(to right, transparent 0px, #000 72px, #000 calc(100% - 64px), transparent 100%)` present; card 01 carries `data-lit` at rest; unlit plates `opacity: 0.62`. | `…sections.vitrine.rail`, `.plates` |
| **C-03 Experience labels inside the card — CLOSED.** Max `.trackYears` right edge 1293.8 vs card right 1344 @1440 (Δ 50.2); 742.1 vs 792.3 @834 (Δ 50.2). `scrollWidth === innerWidth` at all four widths. | `…sections.experience.years`, `.scrollW` |
| **ADV-F-1 reduced motion — CLOSED.** The launcher pip now carries `motion-reduce:animate-none` alongside `animate-ping`. | `…minivic.html` |
| **No chromatic colour in `rgb()` space.** Zero non-gold chromatic elements across `body *` in `rgb()/rgba()`. (Caveat: this scan is blind to `oklch()` — see CC-07.) | `…widths.1440.chroma` = `[]` |
| **Hero at 1440 is above the bar.** Name at 118.08 px on the 96 px spine, role line, 65 ch lede, three graded figures with caliper marks and provenance captions, portrait tile with a pause control, two actions, contact row — all inside 900 px with nothing cut. | `capture/comp-1440x900-minivic-open.png` (top of page), `…sections.hero` |
| **Skills gold is no longer a mass.** Total gold-painted area in `#skills` is **3 539 px²** across a 1440 × 3086.5 px section (0.08 %). R-c8's ~25 gold strands sweeping 900 px are gone. | `…sections.skills.goldArea` |

---

## Findings

### 1. CC-01 — BLOCKER — every section (Verified for `?gl=force`; Inferred for GPU visitors)

**Finding.** `https://forgotten-mistory.web.app/?gl=force` renders **the error boundary instead of the site**, at 1440 and at 390. `document.querySelectorAll('section')` returns **0**; `h1` is `"Something went wrong"`; the frame shows `SYSTEM INTERRUPT / Something went wrong / Try again`. Console:

```
TypeError: Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')
  at e.exports (…/_next/static/chunks/904.66d19854a4ab6d3a.js:1:10329)
[app/error.tsx] Unhandled error: TypeError: … 'ReactCurrentBatchConfig'
```

The plain URL is clean (6 sections, `h1 = "Vikram Deshpande"`, 0 console errors, 0 pageerrors, stable over 3 reloads). **The blast radius is not limited to the query param.** `components/gl/Scene.tsx:98` gates the mount on `capability === 'supported' && allowMotion && near && pageSettled`, and `components/gl/useGLCapability.ts:41-43` shows `?gl=force`'s *only* effect is setting `isSoftware = false` so `cached = 'supported'`. A visitor on real hardware reaches `capability === 'supported'` by the identical path, imports the identical `GLCanvas` chunk (`Scene.tsx:11`), and therefore hits the identical crash. Composition consequence: on an employer's or client's laptop there is no hero, no spine, no type hierarchy, no flagship visualisation — §0.3 mandate 1 and §14 C-1 are unassessable and the site is unshippable. This VPS has no GPU, so the review's six sections were graded down the **no-WebGL fallback path** (`canvases: 0` in every section at every width) — every other finding here is about the path a *software-rasteriser* visitor sees.

**Direction.** Root cause is a React-internals mismatch: `package.json` pins `react`/`react-dom` **18.2.0** under `next` **15.5.25** with `@react-three/fiber` **8.18.0**. `ReactCurrentBatchConfig` lives on React 18's `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`; R3F 8.x reads it through `react-reconciler`, and the runtime Next 15 actually serves does not expose it. Fix by aligning the three, not by widening the error boundary: either (a) `react`/`react-dom` → `^19.0.0` **and** `@react-three/fiber` → `^9` (the React-19 line), or (b) hold React 18 and pin `next` to the 14.2.x line. Whichever is chosen, `?gl=force` must be part of the deploy verification, not an unexercised escape hatch — `scripts/deploy.mjs` currently verifies only the `build-commit` meta on the plain URL.

**Files.** `package.json`, `components/gl/Scene.tsx:11,98`, `components/gl/useGLCapability.ts:41-43`, `components/gl/GLCanvas.tsx`, `scripts/deploy.mjs`, `tests/e2e/`

**Acceptance.** Playwright, `channel:'chrome'`, against the live URL at 1440×900 and 390×844, for **both** `/` and `/?gl=force`: `document.querySelectorAll('section')).toHaveLength(6)`; `page.locator('#hero h1')` has text `Vikram Deshpande`; **zero** `pageerror` events and zero `console.error` entries; `document.body.innerText` does not match `/Something went wrong|SYSTEM INTERRUPT/`. Add as `tests/e2e/gl-force-parity.spec.ts` and wire the `?gl=force` assertion into `scripts/deploy.mjs`'s post-deploy verification so a repeat cannot ship.

---

### 2. CC-02 — BLOCKER — `#listen` (business-client audience) (Verified)

**Finding.** **There is no engagement CTA for business clients anywhere on the page.** `#listen` contains exactly four interactive elements, all plain text anchors: `sarkar.vikram@gmail.com`, `+61 433 224 556`, `linkedin.com/in/vikramd-profile`, `github.com/Victordtesla24` — every one 14 px IBM Plex Mono, `rgb(205,205,205)`, `background: transparent`, `border-width: 0px`, `padding: 0px`, stacked at 32 px intervals down the 96 px spine. The only two *buttons* on the entire site are `See the evidence` → `#experience` and `Download CV` → `/docs/Vik_Resume_Final.pdf` — both employer-path. §2 names **BUSINESS CLIENTS** as a first-class audience and R4 requires "client reaches booking/engagement CTA — click-through complete". A client who has read six sections and decided to buy is handed a `mailto:` in 14 px grey mono. CLAUDE.md prime directive 1 ("two audiences are first-class") is not met on the client half.

**Direction.** Add one engagement action to `#listen`, given equal weight to the hero's primary — a filled `var(--white)` plate, `color: var(--ink-900)`, `padding: var(--space-2) var(--space-4)`, `font-size: var(--fs-small)`, min height 48 px — placed as the *first* item in `.channels`, above the four channels, on the 96 px spine. Label it for the client, not the recruiter (e.g. `Start a project` / `Book a 30-minute call`), and point it at a real destination the visitor can complete: a `mailto:` with a pre-filled subject is acceptable only if the copy says so; a scheduling URL is better. Keep the four channels as the quiet secondary row beneath it, and keep the existing `.channel::after` underline treatment (`Listen.module.css:223`) on them only. No gold — this is chrome, not a sourced claim.

**Files.** `app/data/portfolio/listen.ts` (add the engagement entry beside `channels`), `components/sections/Listen/Listen.tsx:184-196`, `components/sections/Listen/Listen.module.css:195-260`, `tests/content/`

**Acceptance.** At 390/834/1280/1440/1920: `#listen` contains exactly one element matching `a,button` whose computed `background-color` is not `rgba(0,0,0,0)`; its `getBoundingClientRect().height >= 48`; its left edge equals the `#listen` heading's left edge within 1 px; its `href` is non-empty and resolves (HTTP < 400 or a `mailto:`/`https:` scheme); and it precedes the four `.channel` anchors in DOM order. Add as `tests/content/client-cta.spec.ts`.

---

### 3. CC-03 — BLOCKER — global chrome (MiniVic launcher + panel) (Verified)

**Finding.** The launcher neither reads as a chat affordance nor opens one. DOM at 1440 (`…widths.1440.minivic`): 64 × 64 at (1352, 812), `aria-label="Open Mini Vic assistant"`, **`innerText` empty, `svgCount: 0`** — no glyph, no label, no visible word. Its only content is

```html
<video class="pointer-events-none h-full w-full object-cover"
       autoplay loop muted playsinline preload="none"></video>
```

— a `<video>` with **no `src` and no `<source>` child**, so it paints nothing; the launcher is a 2 px ring around emptiness. After `click()` on `[data-testid="minivic-toggle"]` and a 2 500 ms settle, **no panel node exists** under `[role="dialog"]`, `[class*="panel" i]` or `[data-testid*="minivic-panel"]` (`composition-report.json.minivicOpen.panel === null`), and the captured frame shows no panel and no launcher (`capture/comp-1440x900-minivic-open.png`). R-c8's C-04 ("empty ring, reads as a loading spinner") is therefore **not closed** — a source-less video replaced the emptiness with different emptiness. §0.3 mandate 5 and R3 make this control the employer/client channel; it currently advertises nothing and, in this build, does nothing.

**Direction.** Two separable fixes, both required. (a) *Read as chat*: give the button a permanent 24 × 24 mark in `var(--white)` — an inline `<svg>` speech-mark or the "VIC" monogram at `var(--fs-micro)`, `letter-spacing: 0.12em` — rendered **under** the video so it is the resting state and the avatar is the enhancement; add a `title` and a 1-line label plate on hover/focus (`var(--ink-800)` ground, `var(--white)` ink, `var(--fs-caption)`, `padding: var(--space-05) var(--space-1)`, offset 12 px left of the ring). (b) *Never ship a source-less video*: only render `<video>` when a resolved poster/source exists; give it `poster={avatarPoster}` so the first paint is the face rather than nothing, and keep `preload="none"` on the clip only. (c) Verify the panel actually mounts — give the panel root `role="dialog"` and `data-testid="minivic-panel"` so this is testable at all.

**Files.** `components/MiniVicBot.tsx:1593-1610` (button body), the panel root in the same file, `app/data/portfolio/avatar.ts`, `tests/e2e/`

**Acceptance.** At 1440×900 and 390×844 against the live URL: `[data-testid="minivic-toggle"]` contains at least one `svg` **or** non-empty `innerText`; every `video` inside it has a non-empty `currentSrc` **or** `poster`; the toggle's rendered box is visible (`toBeVisible()`); after `click()`, `[data-testid="minivic-panel"]` is attached and visible within 1 500 ms, and `Escape` returns focus to the toggle. Add as `tests/e2e/minivic-affordance.spec.ts`.

---

### 4. CC-04 — MAJOR — `#hero` / nav (Verified)

**Finding.** **"Download CV" appears twice in the 1440 first screen** — and three times in the DOM. Measured in-viewport at 1440×900 (`…widths.1440.nav.ctas`): the nav pill at **x 1140.5, y 28, 132.1 × 39** (1 px `rgb(246,246,246)` border) and the hero outline button at **x 296.6, y 755.6, 155.8 × 48** (1 px `rgba(255,255,255,0.09)` border) — both `href="/docs/Vik_Resume_Final.pdf"`. A third anchor with the same text and href occupies **x 445.9, y 6, 548.1 × 96**, overlapping the nav band. Confirmed visually in `capture/comp-1440x900-minivic-open.png`: top-right pill and lower-left button, same words, same destination, one viewport. R-c8's C-07 is unresolved. Two identical calls to action in one frame halve the weight of each and read as an unresolved layout, not a decision.

**Direction.** Keep exactly one per viewport band. The nav pill is the persistent recruiter action (`Navigation.tsx:154-157`, D-CV-01) — keep it. Demote the hero's second copy: change the hero's secondary from a bordered button to the section's text-link treatment (drop `border`, keep `var(--mist-200)` ink at `var(--fs-small)` with the `::after` underline used by `.channel`) **or** re-label it to the thing the nav does not offer (e.g. `See the dossier`) so the two are not the same action. Then find and remove the third phantom anchor at (445.9, 6, 548 × 96) — a 548 × 96 hit area sitting across the nav is either a mobile-menu item with layout it should not have or a duplicated render; whichever it is, it must not be in the accessibility or hit-test tree while the desktop nav is showing.

**Files.** `components/site/Navigation.tsx:26,154-157`, `components/sections/Hero/Hero.tsx`, `components/sections/Hero/Hero.module.css`, `tests/overhaul/`

**Acceptance.** At 390/834/1280/1440/1920, for the first viewport (`scrollY === 0`): the count of elements matching `a[href="/docs/Vik_Resume_Final.pdf"]` whose rect intersects the viewport **and** whose computed `visibility !== 'hidden'` is exactly **1**. Add as `tests/overhaul/cta-duplication.spec.ts`.

---

### 5. CC-05 — MAJOR — `#listen` (Verified)

**Finding.** The page's business end is its quietest type. Every contact line is `font-size: 14px`, `font-family: "IBM Plex Mono"`, `color: rgb(205,205,205)` (`--mist-200`), `padding: 0`, `border-width: 0` — while the section's own pull-quote above it is set at **54.4 px** (`line-height: 73.44 px`) in `rgb(246,246,246)`. That is a 3.9× type ratio pointing the wrong way: the sentence a visitor does not need is four times the size of the address they came for. The section spans the column correctly now (`rightmostContent = 1344` = the 1248 px column's right edge), so R-c8's "right half empty" is fixed — but the hierarchy inside it is inverted. Distinct from CC-02: that finding adds the missing client action; this one is about the weight of the four channels that already exist.

**Direction.** In `Listen.module.css` `.channel` (line 206): raise `font-size` to `var(--fs-body)` (16 px) and `color` to `var(--white)`; keep IBM Plex Mono — the monospace is right for an address, the greyness is not. Give each channel a 44 px minimum hit box (`padding-block: var(--space-1)`) so it is a touch target as well as a line. Reduce the pull-quote from `--fs-h2` to `var(--fs-h3)` (≈ 23 px at 1440) so the ratio between the quote and the address is ≈ 1.4×, not 3.9×. Keep the `::after` underline reveal (`:223`, `:243`) as the hover state.

**Files.** `components/sections/Listen/Listen.module.css:196-260`, and the `.quote` rule at `:63,:203`

**Acceptance.** At 1440 and 390: every `#listen .channel` has computed `font-size >= 16px`, `color` = `rgb(246,246,246)`, and `getBoundingClientRect().height >= 44`; the `#listen` quote's computed `font-size` divided by a channel's is `<= 1.6`.

---

### 6. CC-06 — MAJOR — `#skills`, `#experience`, `#hero`, `#about` (Verified)

**Finding.** Four running-text blocks blow past the 55–75 ch measure, the widest by more than double. Measured by rendering each `<p>`'s own computed font into a canvas and dividing its box by the `0`-advance (`…widths.1440.measures`):

| Section | ch | box | size | text |
|---|---|---|---|---|
| `#skills` | **173** | 1246 px | 12 px | `Calibrated against public/docs/Vik_Resume_Fina…` |
| `#hero` | **124** | 1248 px | 16 px | `Open to delivery-leadership and AI engagements…` |
| `#experience` | **124** | 1248 px | 16 px | the three metric rows (`≈92%`, `−38%`, `10k+`) |
| `#skills` | **124** | 1248 px | 16 px | `20 links · 13 sources · 17 capabilities. Hover…` |
| `#about` | **105 / 99** | 928 / 712 px | 14 / 12 px | `Dimensions taken verbatim…`, the four provenance captions |

The site already owns the correct token — `--measure-read: clamp(58ch, 64ch + 0.4vw, 72ch)` — and every paragraph that uses it lands on **65 ch** exactly. These blocks simply do not apply it: they inherit the full 1248 px column. A 173 ch line at 12 px is a line a reader loses their place in on the return sweep, and it is the line that carries the calibration provenance — the most load-bearing sentence in `#skills`.

**Direction.** Apply `max-width: var(--measure-read)` to the offenders rather than inventing new widths: `Skills.module.css` — the footnote/provenance rule and the `20 links · …` summary rule; `Experience.module.css` — the metric row's caption element; `Hero.module.css` — the availability line. Where a line is deliberately a full-width rule of small caps (the availability line may be), the fix is instead `letter-spacing: 0.04em` plus `max-width: var(--measure-read)` and left alignment on the spine — never a 124 ch paragraph. For the small captions in `#about`, use `--measure-read` too: at 12 px it resolves to a shorter pixel width automatically because `ch` tracks the font.

**Files.** `components/sections/Skills/Skills.module.css`, `components/sections/Experience/Experience.module.css`, `components/sections/Hero/Hero.module.css`, `components/sections/About/About.module.css`

**Acceptance.** At 1440 and 1920, every `p` inside `#hero,#about,#experience,#skills,#vitrine,#listen` whose `textContent.trim().length > 60` measures **≤ 78 ch** by the canvas method above (the `--measure-read` ceiling of 72 ch plus 6 ch of tolerance). Add as `tests/overhaul/measure.spec.ts`.

---

### 7. CC-07 — MAJOR — global chrome (MiniVic launcher pip) (Verified)

**Finding.** The monochrome doctrine is still breached, now in `oklch()` where R-c8's checks could not see it. The launcher's two pip spans compute to

```
bg = oklch(0.705 0.015 286.067)   /* zinc-400 */
bg = oklch(0.552 0.016 285.938)   /* zinc-500 */
```

Chroma 0.015/0.016 at hue ≈ 286° is a blue-violet, not a neutral: `R = G = B` fails, and it is not `--gold`. This is the same defect R-c8 logged inside C-04, surviving a Tailwind colour-space change. My own `rgb()`-based scan returned **zero** chromatic elements — a false negative that the next audit must not inherit: `scripts/validate/overhaul_static_audit.mjs`'s monochrome gate needs to parse `oklch()`/`oklab()`, not just `rgb()`.

**Direction.** Replace `bg-zinc-400` / `bg-zinc-500` on the two pip spans with the site's own tokens: outer ping `background: var(--mist-400)` at `opacity: 0.75`, inner dot `background: var(--mist-200)`. Both are `R = G = B` by construction. Do not substitute another Tailwind neutral — `zinc`, `slate`, `stone` and `neutral` all carry chroma in Tailwind v4's oklch ramp; only `--mist-*`/`--ink-*` are provably achromatic here. Then extend the audit's colour parser to `oklch(L C H)` and fail on `C > 0.005` unless the resolved colour is a `--gold-*` token.

**Files.** `components/MiniVicBot.tsx:1568-1569` (the two pip spans), `app/globals.css`, `scripts/validate/overhaul_static_audit.mjs`

**Acceptance.** For every element under `[data-testid="minivic-toggle"]`, every computed `color`/`background-color`/`border-color`/`fill`/`stroke` parsed via `oklch()`, `oklab()` **and** `rgb()` is either achromatic (`C <= 0.005`, or `R = G = B`) or exactly a `--gold-*` value. Extend the existing monochrome spec under `tests/monochrome/`.

---

### 8. CC-08 — MINOR — `#vitrine` (Verified)

**Finding.** The rail scrolls 3 192 px inside a 1 440 px window — **1 752 px, 55 % of the content, is off-screen** — and the only affordance is the 64 px right-edge mask fade. `…sections.vitrine.thumb` = **0**: no thumb, no track, no counter, no arrow. The heading promises "Six of thirty-eight"; at rest a reader sees two and a sliver, with nothing telling them the other four exist or that the region is horizontally scrollable. (The R-c8 C-02 direction specified this thumb; the mask and the spine shipped, the thumb did not.)

**Direction.** Add the rail thumb from the C-02 direction, unbuilt: a 2 px track in `var(--ink-500)` spanning the column (96 px → 1344 px at 1440), with a thumb `height: 2px`, `background: var(--mist-400)`, `border-radius: 1px`, `width: calc(clientWidth / scrollWidth * 100%)` translated by `scrollLeft / scrollWidth`, sitting `var(--space-2)` below the cards on the same spine. Pair it with a `01 / 06` counter at `var(--fs-micro)` in `var(--mist-400)` at the track's right end. Reduced motion: position updates without transition. No gold.

**Files.** `components/sections/Vitrine/Vitrine.module.css:307+`, `components/sections/Vitrine/Vitrine.tsx`

**Acceptance.** At 1440 and 1920, `#vitrine` contains an element whose computed width is `< rail.clientWidth` and whose left offset changes after `rail.scrollBy(600)`; its track's left edge equals the `#vitrine` heading's left edge within 1 px.

---

### 9. CC-09 — MINOR — page (vertical rhythm) (Verified)

**Finding.** Section padding is not on one scale, and the page closes tighter than it opens. At 1440: `#hero` `padding-bottom: 90px` meets `#about` `padding-top: 108px`; the four middle sections are a clean symmetric 108/108; `#listen` is **126 top / 45 bottom**. At 1920 the same asymmetry is 151.2/48; at 390 it is 118.16/42.2. The last section therefore ends at roughly a third of the gap that every other section opens with, so the page stops rather than closes — the weakest possible last impression on the section that carries the contact details.

**Direction.** `Listen.module.css:15` sets `padding: clamp(6rem,14vh,--space-20) <gutter> <smaller>`. Make the block padding symmetric with the rest of the page: use the same `clamp(var(--space-10), 12vh, 9rem)` block value the four middle sections use, so 1440 resolves to 108/108 and the closing gap matches the opening one. If the tight bottom exists to keep the footer close, move that intent into the footer's own top margin rather than into `#listen`'s bottom padding. Likewise give `#hero` `padding-bottom: clamp(var(--space-10),12vh,9rem)` so the hero→about seam is 108→108 rather than 90→108.

**Files.** `components/sections/Listen/Listen.module.css:15`, `components/sections/Hero/Hero.module.css:19-21`

**Acceptance.** At 390/834/1280/1440/1920, for each of the six sections `|padding-top − padding-bottom| <= 2px`, and the six `padding-top` values fall in at most two distinct buckets ≤ 2 px wide.

---

### 10. CC-10 — POLISH — `#skills` (Verified)

**Finding.** `#skills` carries **29 gold-painted elements** — more than every other section combined (`#vitrine` has 3, the live repository URLs; `#hero`, `#about`, `#experience`, `#listen` have 0). The 29 are 14 `Bench_mark` dots (6.7 × 6.7 px, `background rgb(201,168,76)`, all at x = 1088), 14 `Skills_statusGlyph` "●" (10.5 × 18 px, all at x = 1159.6), and 1 `legendGlyph`. Total area is small (3 539 px², so this is *not* R-c8's C-08 gold mass — that is closed), but the shape is wrong: fourteen identical dots in a single vertical column at a fixed x read as a **status column**, the way a build dashboard prints green ticks — not as fourteen individual "this figure has a source" marks. `Skills.module.css:292` keys the glyph off `tr[data-status="production"]`, i.e. off deployment status, not off whether a claim is sourced. CLAUDE.md prime directive 4 licenses gold for exactly one meaning; a status column quietly adds a second.

**Direction.** Decide which of the two the column means and paint only that one gold. If it marks *sourced*, key it off the caliper state rather than `data-status` and keep `var(--gold)`. If it marks *in production*, it is chrome: render it in `var(--mist-200)` and let the row's caliper carry the gold. Either way collapse the two parallel gold columns (x = 1088 and x = 1159.6) into one — two gold columns 71 px apart in the same table is the reader being asked to learn two marks in a section whose heading is "Calibration card".

**Files.** `components/sections/Skills/Skills.tsx:114-118,195`, `components/sections/Skills/Skills.module.css:103-109,286-306`

**Acceptance.** `#skills` contains at most one vertical run of gold-painted elements sharing an x within 2 px; the total count of gold-painted elements in `#skills` is ≤ 16; and every gold element in `#skills` sits inside a row whose caliper state is `sourced`.

---

## Grading against the top-5 bar (§2 / §14 / CLAUDE.md)

| Criterion | Grade | Basis |
|---|---|---|
| **C-1 cinematic / UHD feel** | **FAIL** | On a GPU visitor the page is an error boundary (CC-01). On the fallback path all six sections render `canvases: 0` — the flagship visualisations §0.3 mandate 1 requires are, for this reviewer, unobservable in production. |
| **C-8 black/white/gold only** | **FAIL (narrowly)** | Zero chromatic colour in `rgb()` across the whole body; the single breach is the launcher pip in `oklch` hue 286 (CC-07). Everything inside the six sections is clean. |
| **Gold = sourced mark only** | **PASS with a caveat** | 35 gold elements page-wide, all in `#skills` (29) and `#vitrine` (3 live URLs, deliberately `--gold` on the lit plate and `--gold-pale` on its neighbours per the documented GS-02 rule at `Vitrine.module.css:324-331`). Caveat is CC-10's status column. |
| **One content spine** | **PASS** | Identical at all four widths (see holds). |
| **Type hierarchy & measure** | **FAIL** | 65 ch throughout the disciplined blocks, but 173/124/105 ch in five places (CC-06); and `#listen`'s hierarchy is inverted 3.9:1 against its own purpose (CC-05). |
| **Vertical rhythm** | **MARGINAL** | Four middle sections perfect; hero and listen off-scale (CC-09). |
| **Hero first screen — 1440** | **PASS** | Name, role, lede, three graded figures with provenance, portrait, two actions, contact row, nothing cut. |
| **Hero first screen — 390** | **PASS (fallback path)** | `scrollWidth === innerWidth = 390`, spine 24 px, H1 48 px. R-c8's C-06 overflow at 390 is not reproducible on this build. |
| **Experience chart legibility** | **PASS** | Labels 50.2 px inside the card at both 1440 and 834; no horizontal overflow. |
| **Vitrine rail** | **PASS on spine/mask/lit plate; MINOR on affordance** | CC-08. |
| **Skills gold mass** | **PASS** | 0.08 % of the section's area (CC-10 is about shape, not mass). |
| **Listen's business end** | **FAIL** | No client CTA at all (CC-02); contact hierarchy inverted (CC-05). |
| **MiniVic launcher** | **FAIL** | No glyph, no label, source-less video, no panel on activation (CC-03); pip chromatic (CC-07). |
| **Nav duplication** | **FAIL** | "Download CV" twice in the 1440 first screen, three times in the DOM (CC-04). |

**A first visit, graded as the two audiences.** An *employer* on a GPU laptop sees `Something went wrong`. On the fallback path they get a genuinely strong hero, a spine that never wavers, and a chart that reads — then meet the same button twice and a chatbot that opens nothing. A *business client* completes the whole page and finds no way to start work: four grey mono lines and a CV download addressed to somebody else. **FAIL for both.**

---

## Captures (12, each ≤ 400 kB, in `R-c13/capture/`)

`comp-1440x900-hero.png` · `comp-1440x900-about.png` · `comp-1440x900-experience.png` · `comp-1440x900-skills.png` · `comp-1440x900-vitrine.png` · `comp-1440x900-listen.png` · `comp-1440x900-minivic-open.png` (launcher activated; no panel appears) · `comp-1920x1080-full.png` (all six sections) · `comp-834x1194-full.png` (all six) · `comp-834x1194-experience.png` · `comp-390x844-full.png` (all six) · `comp-390x844-listen.png`

The per-section 1920/834/390 shots the brief asks for are delivered as the three full-page captures at those widths (deviceScaleFactor 0.5/0.7/1.0) rather than 24 separate files, to stay inside the ≤ 12-per-lens cap; the per-section numbers at every width are in `composition-report.json.widths.<w>`, which is what every measurement above is read from.
