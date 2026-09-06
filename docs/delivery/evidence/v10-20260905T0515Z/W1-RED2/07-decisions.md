# W1-RED2 — six red specs on main, root-caused (t_w1_red2, 2026-09-06)

Baseline: `origin/main` @ `b02a8863`, own static export, served on :5605.
Reproduction: `01-reproduction.log`. Verification: `02-verify.log`, `03-gates.log`,
`04-suites.log`. Screenshots: `05-hero-hover-1440.png`, `06-minivic-open-1440.png`.

| Spec | Verdict | Evidence |
|---|---|---|
| `tests/e2e/hero-photo.spec.ts` TC-PHOTO-11 | **test** | `locator.hover()` runs an actionability scroll and `boundingBox()` is viewport-relative, so before/after straddled a 165 px scroll the product never made. Fixed by `scrollIntoViewIfNeeded()` + `page.mouse.move`. Threshold unchanged (1 px). |
| `tests/e2e/hero.spec.ts` TC-HERO-15 | **test** | Identical cause, identical 165 px, identical fix. Threshold unchanged (1 px). |
| `tests/e2e/hero.spec.ts` TC-HERO-13 | **test** | Asserted `/my-avatar\.mp4$/`; the product loads `/assets/my-hero-avatar.mp4` and `tests/palette_bundle.test.mjs` fails if the retired binary ever ships again. Re-pointed to `/my-hero-avatar\.mp4$/`. |
| `tests/e2e/chatbot.spec.ts` TC-BOT-14 | **product** | The 22rem panel-top cap was derived from a grid that recorded the hero name's lowest glyph at y≤330. Measured on this export at 1440×900 it is y=341, so the 352 px top left 11 px where the contract asks 16. Cap raised to 22.5rem (`100svh − 28rem`): measured top 360, glyph bottom 341, clearance **19 px**. The 16 px threshold was NOT lowered. |
| `tests/a11y/minivic-occlusion.spec.ts` TC-MV-OCCLUDE-01 | **product — NOT FIXED, followup** | See below. |
| `tests/monochrome/minivic-launcher.spec.ts` MONO-MV-02 @390 | **NOT FIXED, followup** | See below. `@640 passes` — the extension note's "@640" was mis-attributed. |

## Not fixed in this slice (30-min cap), with numbers

**TC-MV-OCCLUDE-01 (390×844).** One overlap fails, at `scrollY 16036`:
`div.Vitrine_exclusion > dd` ("an environment file was committed early in its h…")
ink `rgb(125,125,125)` on launcher-painted ground `rgb(30,30,30)` = **4.05:1**, needs 4.5.
`rgb(30,30,30)` is `--card-border` (`rgb(255 255 255 / 0.09)`) composited over `--ink-900`
(`#0A0A0A`) — the launcher's own hairline. The ceiling in `app/globals.css` was derived
from `--mist-200` (#CDCDCD) body ink; the Vitrine exclusion list is set in a dimmer grey
(`#7D7D7D`), which clears AA on the page ground (4.81:1) but not on anything brighter.
For that ink the ground ceiling is L ≤ 0.00669, i.e. **≤ rgb(19,19,19)** — the hairline at
32 is over it. Two candidate product fixes, both outside this slice's blast radius:
(a) below 87.5rem drop the launcher's border to ≈`rgb(255 255 255 / 0.03)` (≈rgb(17,17,17),
4.68:1) — costs the hairline most of its visibility; (b) raise the Vitrine exclusion ink to
`--mist-400` (#909090 → 5.22:1 on rgb(30,30,30)) — a visual-baseline change.
Needs a design decision, not a tester's unilateral one.

**MONO-MV-02 @390.** `.minivic-dock` composited opacity is **0** after the spec's twelve
844 px scroll steps, so the label reads as unpainted. `@640` passes. The gate is
`components/MiniVicBot.tsx:307` — `IntersectionObserver(#hero, { threshold: 0.35 })`.
At 390 the hero is far taller than the viewport, so the ratio can never approach 0.35 and
the only callback that can flip `pastHero` is the hero leaving the root entirely. Whether
that is a product gate defect (a single threshold that cannot fire on a phone) or a spec
that scrolls too little was not settled inside the cap; it is filed with these numbers
rather than guessed at.

## Pre-existing red, untouched and out of scope

`tests/e2e/hero.spec.ts` TC-HERO-08 — the fold band measures **928.30 px** against a
`viewport.height * 1.1` ceiling of **792 px** (default 720 px viewport). It fails for a
`components/sections/Hero/*` reason and cannot be caused by this change: the MiniVic panel
lives inside `.minivic-dock`, which is `position: fixed`, out of flow, and mounted only
when open. Hero component files belong to a concurrent lane, so this is reported, not
edited. Everything else in the three suites is green (69/70).
